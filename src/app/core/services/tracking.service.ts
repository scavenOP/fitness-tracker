import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Database, ref, push, set, get } from '@angular/fire/database';
import { AuthService } from './auth.service';
import { BehaviorSubject } from 'rxjs';

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

  private watchId: number | null = null;
  private timerInterval: any = null;
  private startTime = 0;
  private pausedAt = 0;
  private totalPausedMs = 0;
  private paused = false;
  private lastPos: GeolocationPosition | null = null;
  private speedSamples: number[] = [];

  private elapsedSeconds(): number {
    const pauseOffset = this.paused ? (Date.now() - this.pausedAt) : 0;
    return Math.floor((Date.now() - this.startTime - this.totalPausedMs - pauseOffset) / 1000);
  }

  pauseTracking() {
    if (this.paused) return;
    this.paused = true;
    this.pausedAt = Date.now();
  }

  resumeTracking() {
    if (!this.paused) return;
    this.paused = false;
    this.totalPausedMs += Date.now() - this.pausedAt;
  }

  stats$ = new BehaviorSubject<LiveStats>({
    running: false, duration: 0, distance: 0, steps: 0,
    calories: 0, currentSpeed: 0, avgSpeed: 0, maxSpeed: 0,
    route: [], currentPos: null
  });

  startTracking(type: 'walk' | 'run') {
    this.startTime = Date.now();
    this.pausedAt = 0;
    this.totalPausedMs = 0;
    this.paused = false;
    this.lastPos = null;
    this.speedSamples = [];
    this.stats$.next({
      running: true, duration: 0, distance: 0, steps: 0,
      calories: 0, currentSpeed: 0, avgSpeed: 0, maxSpeed: 0,
      route: [], currentPos: null
    });

    this.timerInterval = setInterval(() => {
      if (this.paused) return;
      const s = this.stats$.value;
      this.stats$.next({ ...s, duration: this.elapsedSeconds() });
    }, 1000);

    this.watchId = navigator.geolocation.watchPosition(
      pos => this.onPosition(pos, type),
      err => console.error(err),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
    );
  }

  private onPosition(pos: GeolocationPosition, type: 'walk' | 'run') {
    if (this.paused) return;
    const s = this.stats$.value;
    const { latitude: lat, longitude: lng, speed } = pos.coords;
    const speedKmh = speed != null ? speed * 3.6 : 0;

    let addedDist = 0;
    if (this.lastPos) {
      addedDist = this.haversine(
        this.lastPos.coords.latitude, this.lastPos.coords.longitude, lat, lng
      );
    }
    this.lastPos = pos;

    const newDist = s.distance + addedDist;
    this.speedSamples.push(speedKmh);
    const avgSpeed = this.speedSamples.reduce((a, b) => a + b, 0) / this.speedSamples.length;
    const maxSpeed = Math.max(s.maxSpeed, speedKmh);
    const steps = this.calcSteps(newDist, type);
    const calories = this.calcCalories(newDist, type);

    const point: TrackPoint = { lat, lng, timestamp: Date.now(), speed: speedKmh };
    const route = [...s.route, point];

    this.stats$.next({
      ...s, distance: newDist, currentSpeed: speedKmh,
      avgSpeed, maxSpeed, steps, calories,
      route, currentPos: { lat, lng }
    });
  }

  async stopTracking(type: 'walk' | 'run'): Promise<string> {
    if (this.watchId !== null) navigator.geolocation.clearWatch(this.watchId);
    if (this.timerInterval) clearInterval(this.timerInterval);

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

  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private calcSteps(distMeters: number, type: 'walk' | 'run'): number {
    const strideLength = type === 'run' ? 1.4 : 0.78;
    return Math.round(distMeters / strideLength);
  }

  private calcCalories(distMeters: number, type: 'walk' | 'run'): number {
    const metValue = type === 'run' ? 9.8 : 3.5;
    const weightKg = 70;
    const distKm = distMeters / 1000;
    return Math.round(metValue * weightKg * (distKm / 5));
  }
}
