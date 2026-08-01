import { Injectable, inject, Injector, runInInjectionContext, NgZone } from '@angular/core';
import { Database, ref, push, set, get } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';

// Stubbed on web — only used on native
let BackgroundGeolocation: any = null;
let bgGeoWatcherId: string | null = null;

export interface TrackPoint { lat: number; lng: number; timestamp: number; speed: number; }
export interface Activity {
  id?: string;
  userId: string;
  type: 'walk' | 'run';
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  steps: number;
  calories: number;
  avgSpeed: number;
  maxSpeed: number;
  route: TrackPoint[];
}

export interface LiveStats {
  running: boolean;
  duration: number;
  distance: number;
  steps: number;
  calories: number;
  currentSpeed: number;
  avgSpeed: number;
  maxSpeed: number;
  route: TrackPoint[];
  currentPos: { lat: number; lng: number } | null;
}

@Injectable({ providedIn: 'root' })
export class TrackingService {
  private db = inject(Database);
  private authService = inject(AuthService);
  private injector = inject(Injector);
  private zone = inject(NgZone);

  private isNative = Capacitor.isNativePlatform();

  // Web fallback
  private watchId: number | null = null;
  private timerInterval: any = null;
  private startTime = 0;
  private lastPos: { lat: number; lng: number } | null = null;
  private speedSamples: number[] = [];
  private activityType: 'walk' | 'run' = 'walk';

  // Live notification ID
  private readonly NOTIF_ID = 1001;

  stats$ = new BehaviorSubject<LiveStats>({
    running: false, duration: 0, distance: 0, steps: 0,
    calories: 0, currentSpeed: 0, avgSpeed: 0, maxSpeed: 0,
    route: [], currentPos: null
  });

  async startTracking(type: 'walk' | 'run') {
    this.activityType = type;
    this.startTime = Date.now();
    this.lastPos = null;
    this.speedSamples = [];
    this.stats$.next({
      running: true, duration: 0, distance: 0, steps: 0,
      calories: 0, currentSpeed: 0, avgSpeed: 0, maxSpeed: 0,
      route: [], currentPos: null
    });

    await this.requestNotificationPermission();
    await this.showLiveNotification(type);

    if (this.isNative) {
      // On native: timer runs inside the BG geolocation callback (survives background)
      // Also start a fallback interval for duration-only updates when GPS hasn't fired
      this.timerInterval = setInterval(() => {
        const s = this.stats$.value;
        const newDuration = Math.floor((Date.now() - this.startTime) / 1000);
        this.zone.run(() => this.stats$.next({ ...s, duration: newDuration }));
        if (newDuration % 5 === 0) this.updateLiveNotification({ ...s, duration: newDuration });
      }, 1000);
      await this.startNativeTracking(type);
    } else {
      this.timerInterval = setInterval(() => {
        const s = this.stats$.value;
        const newDuration = Math.floor((Date.now() - this.startTime) / 1000);
        this.stats$.next({ ...s, duration: newDuration });
        if (newDuration % 5 === 0) this.updateLiveNotification({ ...s, duration: newDuration });
      }, 1000);
      this.startWebTracking(type);
    }
  }

  private startWebTracking(type: 'walk' | 'run') {
    this.watchId = navigator.geolocation.watchPosition(
      pos => this.onPosition(pos.coords.latitude, pos.coords.longitude, pos.coords.speed, type),
      err => console.error(err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  private async startNativeTracking(type: 'walk' | 'run') {
    try {
      // Use a script-level eval-style import so bundler never resolves the package on web
      const modFactory = new Function('return import("@capacitor-community/background-geolocation")');
      const mod = await modFactory();
      BackgroundGeolocation = mod?.BackgroundGeolocation ?? mod?.default?.BackgroundGeolocation ?? mod?.default;

      if (!BackgroundGeolocation?.addWatcher) throw new Error('No addWatcher');

      bgGeoWatcherId = await BackgroundGeolocation.addWatcher(
        {
          backgroundMessage: `FitTrack is tracking your ${type}`,
          backgroundTitle: 'Fitly — Live Tracking',
          requestPermissions: true,
          stale: false,
          distanceFilter: 5
        },
        (location: any, error: any) => {
          if (error) { console.error(error); return; }
          this.zone.run(() => {
            this.onPosition(location.latitude, location.longitude, location.speed, type);
            // Update notification on every GPS fix (already silent channel)
            const s = this.stats$.value;
            this.updateLiveNotification(s);
          });
        }
      );
    } catch (e) {
      console.warn('BackgroundGeolocation not available, falling back to web', e);
      this.startWebTracking(type);
    }
  }

  private onPosition(lat: number, lng: number, speed: number | null, type: 'walk' | 'run') {
    const s = this.stats$.value;
    const speedKmh = speed != null && speed > 0 ? speed * 3.6 : 0;
    const duration = Math.floor((Date.now() - this.startTime) / 1000);

    let addedDist = 0;
    if (this.lastPos) {
      addedDist = this.haversine(this.lastPos.lat, this.lastPos.lng, lat, lng);
    }
    this.lastPos = { lat, lng };

    const newDist = s.distance + addedDist;
    this.speedSamples.push(speedKmh);
    const avgSpeed = this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length;
    const maxSpeed = Math.max(s.maxSpeed, speedKmh);
    const steps = this.calcSteps(newDist, type);
    const calories = this.calcCalories(newDist, type);
    const point: TrackPoint = { lat, lng, timestamp: Date.now(), speed: speedKmh };

    this.stats$.next({
      ...s,
      duration,
      distance: newDist,
      currentSpeed: speedKmh,
      avgSpeed,
      maxSpeed,
      steps,
      calories,
      route: [...s.route, point],
      currentPos: { lat, lng }
    });
  }

  async stopTracking(type: 'walk' | 'run'): Promise<string> {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Stop native background geolocation
    if (this.isNative && BackgroundGeolocation) {
      try { await BackgroundGeolocation.removeAllWatchers?.(); } catch (_) {}
      bgGeoWatcherId = null;
    }

    // Dismiss live notification
    await this.dismissLiveNotification();

    const s = this.stats$.value;
    this.stats$.next({ ...s, running: false });

    const activity: Activity = {
      userId: this.authService.uid!,
      type,
      startTime: this.startTime,
      endTime: Date.now(),
      duration: s.duration,
      distance: s.distance,
      steps: s.steps,
      calories: s.calories,
      avgSpeed: s.avgSpeed,
      maxSpeed: s.maxSpeed,
      route: s.route
    };

    const activitiesRef = ref(this.db, `activities/${this.authService.uid}`);
    const newRef = await runInInjectionContext(this.injector, () => push(activitiesRef));
    await runInInjectionContext(this.injector, () => set(newRef, activity));
    return newRef.key!;
  }

  async getActivities(): Promise<Activity[]> {
    const uid = this.authService.uid;
    if (!uid) return [];
    const activitiesRef = ref(this.db, `activities/${uid}`);
    const snap = await runInInjectionContext(this.injector, () => get(activitiesRef));
    if (!snap.exists()) return [];
    const data = snap.val();
    return Object.entries(data).map(([id, val]: any) => ({ id, ...val }))
      .sort((a, b) => b.startTime - a.startTime);
  }

  async getActivity(id: string): Promise<Activity | null> {
    const uid = this.authService.uid;
    if (!uid) return null;
    const actRef = ref(this.db, `activities/${uid}/${id}`);
    const snap = await runInInjectionContext(this.injector, () => get(actRef));
    return snap.exists() ? { id, ...snap.val() } : null;
  }

  // ── Live Notification (iOS Dynamic Island / Android Foreground) ──────────

  private async requestNotificationPermission() {
    try {
      // Ensure silent channel exists before any notification is shown
      if (this.isNative) {
        await LocalNotifications.deleteChannel({ id: 'fittrack_live' }).catch(() => {});
        await LocalNotifications.createChannel({
          id: 'fittrack_live',
          name: 'Live Tracking',
          importance: 2,   // IMPORTANCE_LOW: shows in shade, zero sound/vibration
          vibration: false,
          lights: false
        });
      }
      const perm = await LocalNotifications.requestPermissions();
      return perm.display === 'granted';
    } catch (_) { return false; }
  }

  private async showLiveNotification(type: 'walk' | 'run') {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: this.NOTIF_ID,
          title: `Fitly — ${type === 'run' ? '🏃 Running' : '🚶 Walking'}`,
          body: 'Starting... tap to open',
          ongoing: true,
          autoCancel: false,
          smallIcon: 'ic_stat_directions_run',
          iconColor: '#6C63FF',
          channelId: 'fittrack_live',
          extra: { type }
        }]
      });
    } catch (e) {
      console.warn('Live notification not available', e);
    }
  }

  private async updateLiveNotification(s: LiveStats) {
    try {
      const duration = s.duration ?? Math.floor((Date.now() - this.startTime) / 1000);
      const dist = s.distance >= 1000
        ? (s.distance / 1000).toFixed(2) + ' km'
        : Math.round(s.distance) + ' m';
      const mins = Math.floor(duration / 60);
      const secs = duration % 60;
      const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;

      // Schedule with same ID — Android updates in-place (no cancel) when channel is IMPORTANCE_LOW
      await LocalNotifications.schedule({
        notifications: [{
          id: this.NOTIF_ID,
          title: `Fitly — ${this.activityType === 'run' ? '🏃 Running' : '🚶 Walking'}`,
          body: `⏱ ${timeStr}  📍 ${dist}  🔥 ${s.calories} kcal  👟 ${s.steps} steps`,
          ongoing: true,
          autoCancel: false,
          smallIcon: 'ic_stat_directions_run',
          iconColor: '#6C63FF',
          channelId: 'fittrack_live',
          silent: true
        }]
      });
    } catch (_) {}
  }

  private async dismissLiveNotification() {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: this.NOTIF_ID }] });
    } catch (_) {}
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calcSteps(distMeters: number, type: 'walk' | 'run'): number {
    return Math.round(distMeters / (type === 'run' ? 1.4 : 0.78));
  }

  private calcCalories(distMeters: number, type: 'walk' | 'run'): number {
    const metValue = type === 'run' ? 9.8 : 3.5;
    return Math.round(metValue * 70 * (distMeters / 1000 / 5));
  }
}
