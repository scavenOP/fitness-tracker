import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TrackingService, LiveStats } from '../../core/services/tracking.service';
import { BackgroundKeepAliveService } from '../../core/services/background-keepalive.service';
import { Subscription } from 'rxjs';
import * as L from 'leaflet';

type ActivityType = 'walk' | 'run' | 'other';

interface ActivityOption {
  type: ActivityType;
  icon: string;
  label: string;
  desc: string;
  available: boolean;
}

@Component({
  selector: 'app-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page-container tracker-page">
      <!-- Header -->
      <header class="tracker-header glass">
        <div class="header-center">
          <h2>{{ isRunning() ? (isPaused() ? '⏸ Paused' : '🔴 Live Tracking') : '🏃 Tracker' }}</h2>
          @if (isRunning()) {
            <div class="live-badge">
              <span class="live-dot"></span>
              LIVE
            </div>
          }
        </div>

      </header>

      <!-- Map -->
      <div class="map-section">
        <div #mapEl class="map-container"></div>
        @if (!isRunning() && !hasRoute()) {
          <div class="map-overlay">
            <div class="map-overlay-content">
              <span class="map-icon animate-float">🗺️</span>
              <p>Your route will appear here</p>
            </div>
          </div>
        }
      </div>

      <!-- Stats panel -->
      <div class="stats-panel glass">
        <!-- Timer -->
        <div class="timer-display">
          <span class="timer-value">{{ formatTime(stats().duration) }}</span>
          <span class="timer-label">Duration</span>
        </div>

        <!-- Main stats grid -->
        <div class="live-stats-grid">
          @for (stat of liveStats(); track stat.label) {
            <div class="live-stat" [class.highlight]="stat.highlight">
              <span class="live-stat-value">{{ stat.value }}</span>
              <span class="live-stat-label">{{ stat.label }}</span>
            </div>
          }
        </div>

        <!-- Speed indicator -->
        @if (isRunning()) {
          <div class="speed-bar-wrap">
            <div class="speed-bar-label">
              <span>Speed</span>
              <span class="speed-val">{{ stats().currentSpeed.toFixed(1) }} km/h</span>
            </div>
            <div class="speed-bar">
              <div class="speed-fill" [style.width]="speedPercent() + '%'"></div>
            </div>
          </div>
        }

        <!-- Controls -->
        <div class="controls">
          @if (!isRunning()) {
            <button class="activity-picker-btn" (click)="showPicker.set(true)">
              <span class="picker-icon">{{ selectedOption().icon }}</span>
              <div class="picker-info">
                <span class="picker-label">{{ selectedOption().label }}</span>
                <span class="picker-sub">Tap to change activity</span>
              </div>
              <span class="picker-chevron">›</span>
            </button>
            <button class="btn btn-success btn-lg start-btn animate-glow" (click)="start()">
              ▶ Start {{ selectedOption().label }}
            </button>
          } @else {
            <div class="running-controls">
              <button class="btn btn-secondary btn-icon-lg" (click)="togglePause()">
                {{ isPaused() ? '▶️' : '⏸️' }}
              </button>
              <button class="btn btn-danger stop-btn" (click)="stop()">
                ⏹ Stop & Save
              </button>
            </div>
          }
        </div>
      </div>

      <!-- Activity Picker Modal -->
      @if (showPicker()) {
        <div class="modal-backdrop" (click)="showPicker.set(false)">
          <div class="modal-sheet glass" (click)="$event.stopPropagation()">
            <div class="modal-handle"></div>
            <h3 class="modal-title">Choose Activity</h3>
            <div class="activity-options">
              @for (opt of activityOptions; track opt.type) {
                <button class="activity-opt"
                  [class.selected]="actType() === opt.type"
                  [class.disabled]="!opt.available"
                  (click)="selectActivity(opt)">
                  <span class="opt-icon">{{ opt.icon }}</span>
                  <div class="opt-info">
                    <span class="opt-label">{{ opt.label }}</span>
                    <span class="opt-desc">{{ opt.available ? opt.desc : '🔒 Coming Soon' }}</span>
                  </div>
                  @if (opt.available) {
                    <div class="opt-check" [class.checked]="actType() === opt.type">
                      @if (actType() === opt.type) { <span>✓</span> }
                    </div>
                  } @else {
                    <span class="coming-soon-badge">Soon</span>
                  }
                </button>
              }
            </div>
          </div>
        </div>
      }

      <!-- Saving overlay -->
      @if (saving()) {
        <div class="saving-overlay">
          <div class="saving-card glass">
            <div class="spinner"></div>
            <p>Saving your activity...</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tracker-page {
      display: flex;
      flex-direction: column;
      height: 100dvh;
    }

    .tracker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 20px;
      padding-top: calc(14px + env(safe-area-inset-top, 0));
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .header-center {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 1;
      justify-content: center;
      h2 { font-size: 18px; font-weight: 700; }
    }

    .live-badge {
      display: flex;
      align-items: center;
      gap: 5px;
      background: rgba(255,71,87,0.2);
      border: 1px solid rgba(255,71,87,0.4);
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #FF4757;
      letter-spacing: 1px;
    }

    .live-dot {
      width: 6px; height: 6px;
      background: #FF4757;
      border-radius: 50%;
      animation: blink 1s infinite;
    }


    .map-section {
      flex: 1;
      position: relative;
      min-height: 0;
    }

    .map-container {
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    .map-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15,15,26,0.7);
      z-index: 2;
      pointer-events: none;
    }

    .map-overlay-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: var(--text2);
      .map-icon { font-size: 48px; }
      p { font-size: 14px; }
    }

    .stats-panel {
      flex-shrink: 0;
      padding: 16px 20px;
      padding-bottom: calc(var(--nav-height) + 16px);
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 14px;
      border-radius: 24px 24px 0 0;
    }

    .timer-display {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .timer-value {
      font-size: 42px;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
      letter-spacing: -1px;
      background: linear-gradient(135deg, var(--text), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .timer-label { font-size: 12px; color: var(--text2); font-weight: 500; }

    .live-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .live-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: var(--card);
      border-radius: var(--radius-sm);
      padding: 10px 6px;
      border: 1px solid var(--border);
      transition: all 0.3s;

      &.highlight {
        background: rgba(108,99,255,0.1);
        border-color: rgba(108,99,255,0.3);
      }
    }

    .live-stat-value {
      font-size: 15px;
      font-weight: 700;
      font-family: 'Space Grotesk', sans-serif;
      animation: countUp 0.3s ease;
    }

    .live-stat-label { font-size: 10px; color: var(--text2); font-weight: 500; text-align: center; }

    .speed-bar-wrap { display: flex; flex-direction: column; gap: 6px; }

    .speed-bar-label {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: var(--text2);
    }

    .speed-val { color: var(--primary-light); font-weight: 600; }

    .speed-bar {
      height: 6px;
      background: var(--card2);
      border-radius: 3px;
      overflow: hidden;
    }

    .speed-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
      border-radius: 3px;
      transition: width 0.5s ease;
      min-width: 4px;
    }

    .controls { display: flex; flex-direction: column; gap: 10px; }

    /* Activity picker button */
    .activity-picker-btn {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 12px 14px;
      cursor: pointer;
      width: 100%;
      text-align: left;
      transition: all 0.2s;
      color: var(--text);

      &:active { background: var(--card2); transform: scale(0.99); }
    }

    .picker-icon { font-size: 26px; }

    .picker-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .picker-label { font-size: 15px; font-weight: 600; }
    .picker-sub { font-size: 11px; color: var(--text2); }
    .picker-chevron { font-size: 22px; color: var(--text3); }

    .start-btn { width: 100%; }

    .running-controls {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .btn-icon-lg {
      width: 56px; height: 56px;
      border-radius: 50%;
      font-size: 22px;
      flex-shrink: 0;
      padding: 0;
    }

    .stop-btn { flex: 1; }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.6);
      z-index: 2000;
      display: flex;
      align-items: flex-end;
      backdrop-filter: blur(4px);
      animation: fadeIn 0.2s ease;
    }

    .modal-sheet {
      width: 100%;
      border-radius: 24px 24px 0 0;
      padding: 12px 20px 40px;
      animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .modal-handle {
      width: 40px; height: 4px;
      background: var(--border);
      border-radius: 2px;
      margin: 0 auto 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 16px;
      text-align: center;
    }

    .activity-options {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .activity-opt {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px 16px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
      color: var(--text);
      width: 100%;

      &.selected {
        border-color: var(--primary);
        background: rgba(108,99,255,0.1);
      }

      &.disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:not(.disabled):active { transform: scale(0.98); }
    }

    .opt-icon { font-size: 28px; }

    .opt-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .opt-label { font-size: 15px; font-weight: 600; }
    .opt-desc { font-size: 12px; color: var(--text2); }

    .opt-check {
      width: 24px; height: 24px;
      border-radius: 50%;
      border: 2px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      transition: all 0.2s;

      &.checked {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
    }

    .coming-soon-badge {
      background: rgba(255,101,132,0.15);
      border: 1px solid rgba(255,101,132,0.3);
      color: var(--secondary);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      font-weight: 700;
    }

    /* Saving overlay */
    .saving-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      backdrop-filter: blur(10px);
    }

    .saving-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px 48px;
      border-radius: var(--radius);
      p { color: var(--text2); font-size: 15px; }
    }
  `]
})
export class TrackerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('mapEl') mapEl!: ElementRef;

  isRunning = signal(false);
  isPaused = signal(false);
  saving = signal(false);
  showPicker = signal(false);
  actType = signal<ActivityType>('walk');

  stats = signal<LiveStats>({
    running: false, duration: 0, distance: 0, steps: 0,
    calories: 0, currentSpeed: 0, avgSpeed: 0, maxSpeed: 0,
    route: [], currentPos: null
  });

  activityOptions: ActivityOption[] = [
    { type: 'walk', icon: '🚶', label: 'Walking', desc: 'Casual walk or hike', available: true },
    { type: 'run', icon: '🏃', label: 'Running', desc: 'Outdoor run or jog', available: false },
    { type: 'other', icon: '⚡', label: 'Other', desc: 'Cycling, skating & more', available: false },
  ];

  selectedOption = signal<ActivityOption>(this.activityOptions[0]);

  private map!: L.Map;
  private routeLine!: L.Polyline;
  private posMarker!: L.CircleMarker;
  private sub!: Subscription;

  constructor(
    private tracking: TrackingService,
    private router: Router,
    private zone: NgZone,
    private keepAlive: BackgroundKeepAliveService
  ) {}

  ngOnInit() {
    this.sub = this.tracking.stats$.subscribe(s => {
      this.zone.run(() => {
        this.stats.set(s);
        this.isRunning.set(s.running);
        if (s.currentPos && this.map) this.updateMap(s);
      });
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    if (this.map) this.map.remove();
    this.keepAlive.stop();
  }

  private initMap() {
    this.map = L.map(this.mapEl.nativeElement, {
      center: [20, 0], zoom: 2,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap'
    }).addTo(this.map);

    L.control.attribution({ position: 'bottomright', prefix: false }).addTo(this.map);

    this.routeLine = L.polyline([], {
      color: '#6C63FF', weight: 5, opacity: 0.9,
      lineCap: 'round', lineJoin: 'round'
    }).addTo(this.map);

    this.posMarker = L.circleMarker([0, 0], {
      radius: 10, color: '#6C63FF', fillColor: '#fff',
      fillOpacity: 1, weight: 3
    }).addTo(this.map);

    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude, longitude } = pos.coords;
      this.map.setView([latitude, longitude], 16);
    }, () => {});
  }

  private updateMap(s: LiveStats) {
    if (!s.currentPos) return;
    const latlng: L.LatLngExpression = [s.currentPos.lat, s.currentPos.lng];
    this.posMarker.setLatLng(latlng);
    const points: L.LatLngExpression[] = s.route.map(p => [p.lat, p.lng]);
    this.routeLine.setLatLngs(points);
    if (s.route.length > 1) {
      this.map.panTo(latlng, { animate: true, duration: 0.5 });
    } else {
      this.map.setView(latlng, 17);
    }
  }

  selectActivity(opt: ActivityOption) {
    if (!opt.available) return;
    this.actType.set(opt.type);
    this.selectedOption.set(opt);
    this.showPicker.set(false);
  }

  start() {
    this.routeLine?.setLatLngs([]);
    this.tracking.startTracking(this.actType() as 'walk' | 'run');
    this.isRunning.set(true);
    // Start silent audio session so iOS/Android keep JS running when screen turns off
    this.keepAlive.start();
  }

  togglePause() {
    this.isPaused.set(!this.isPaused());
  }

  async stop() {
    this.saving.set(true);
    this.keepAlive.stop();
    try {
      const id = await this.tracking.stopTracking(this.actType() as 'walk' | 'run');
      this.router.navigate(['/activity', id]);
    } catch (e) {
      console.error(e);
      this.saving.set(false);
    }
  }

  hasRoute(): boolean { return this.stats().route.length > 0; }

  speedPercent(): number {
    const maxExpected = this.actType() === 'run' ? 20 : 8;
    return Math.min((this.stats().currentSpeed / maxExpected) * 100, 100);
  }

  liveStats() {
    const s = this.stats();
    return [
      { label: 'Distance', value: this.formatDist(s.distance), highlight: false },
      { label: 'Steps', value: s.steps.toLocaleString(), highlight: false },
      { label: 'Calories', value: s.calories + ' kcal', highlight: true },
      { label: 'Avg Speed', value: s.avgSpeed.toFixed(1) + ' km/h', highlight: false },
    ];
  }

  formatTime(s: number): string {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  }

  formatDist(m: number): string {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  }
}
