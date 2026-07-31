import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TrackingService, Activity } from '../../core/services/tracking.service';
import * as L from 'leaflet';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-activity-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('staggerIn', [
      transition(':enter', [
        query('.anim-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(70, animate('0.4s ease', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <header class="detail-header glass">
        <a routerLink="/history" class="back-btn">‹</a>
        <div class="header-center">
          <h2>{{ activity()?.type === 'run' ? '🏃 Running' : '🚶 Walking' }}</h2>
          <span class="act-date">{{ activity()?.startTime | date:'MMM d, yyyy · h:mm a' }}</span>
        </div>
        <div style="width:40px"></div>
      </header>

      @if (loading()) {
        <div style="display:flex;justify-content:center;align-items:center;flex:1">
          <div class="spinner"></div>
        </div>
      } @else if (activity()) {
        <div class="page-content" @staggerIn>
          <!-- Route map -->
          <div class="map-card anim-item">
            <div #mapEl class="detail-map"></div>
            <div class="map-label">Route Map</div>
          </div>

          <!-- Hero stats -->
          <div class="hero-stats anim-item">
            <div class="hero-stat">
              <span class="hs-value gradient-text">{{ formatDist(activity()!.distance) }}</span>
              <span class="hs-label">Total Distance</span>
            </div>
            <div class="hs-divider"></div>
            <div class="hero-stat">
              <span class="hs-value gradient-text">{{ formatDur(activity()!.duration) }}</span>
              <span class="hs-label">Duration</span>
            </div>
          </div>

          <!-- Stats grid -->
          <div class="detail-grid anim-item">
            @for (stat of detailStats(); track stat.label) {
              <div class="detail-stat-card">
                <span class="ds-icon">{{ stat.icon }}</span>
                <span class="ds-value">{{ stat.value }}</span>
                <span class="ds-label">{{ stat.label }}</span>
              </div>
            }
          </div>

          <!-- Pace / Speed chart placeholder -->
          <div class="speed-section anim-item card">
            <h3 class="section-h">Speed Overview</h3>
            <div class="speed-bars">
              <div class="sb-row">
                <span class="sb-label">Current</span>
                <div class="sb-bar-wrap">
                  <div class="sb-bar" [style.width]="speedPct(activity()!.avgSpeed) + '%'"></div>
                </div>
                <span class="sb-val">{{ activity()!.avgSpeed.toFixed(1) }} km/h</span>
              </div>
              <div class="sb-row">
                <span class="sb-label">Max</span>
                <div class="sb-bar-wrap">
                  <div class="sb-bar sb-max" [style.width]="speedPct(activity()!.maxSpeed) + '%'"></div>
                </div>
                <span class="sb-val">{{ activity()!.maxSpeed.toFixed(1) }} km/h</span>
              </div>
            </div>
          </div>

          <!-- Achievements -->
          <div class="achievements anim-item">
            <h3 class="section-h">Achievements</h3>
            <div class="ach-list">
              @for (ach of achievements(); track ach.label) {
                <div class="ach-chip" [class.earned]="ach.earned">
                  <span>{{ ach.icon }}</span>
                  <span>{{ ach.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .detail-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      padding-top: calc(14px + env(safe-area-inset-top, 0));
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .back-btn {
      width: 40px; height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--card);
      border-radius: 50%;
      text-decoration: none;
      color: var(--text);
      font-size: 24px;
      border: 1px solid var(--border);
    }

    .header-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      h2 { font-size: 17px; font-weight: 700; }
    }

    .act-date { font-size: 12px; color: var(--text2); }

    .map-card {
      border-radius: var(--radius);
      overflow: hidden;
      border: 1px solid var(--border);
      position: relative;
      margin-bottom: 16px;
    }

    .detail-map {
      width: 100%;
      height: 220px;
    }

    .map-label {
      position: absolute;
      top: 12px; left: 12px;
      background: rgba(15,15,26,0.8);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 4px 12px;
      font-size: 12px;
      font-weight: 600;
      color: var(--text2);
      border: 1px solid var(--border);
    }

    .hero-stats {
      display: flex;
      background: linear-gradient(135deg, var(--card), var(--card2));
      border-radius: var(--radius);
      border: 1px solid var(--border);
      padding: 24px;
      margin-bottom: 16px;
      justify-content: space-around;
      align-items: center;
    }

    .hero-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .hs-value {
      font-size: 28px;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
    }

    .hs-label { font-size: 13px; color: var(--text2); }
    .hs-divider { width: 1px; height: 50px; background: var(--border); }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 16px;
    }

    .detail-stat-card {
      background: var(--card);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      padding: 14px 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      text-align: center;
    }

    .ds-icon { font-size: 22px; }
    .ds-value { font-size: 15px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
    .ds-label { font-size: 11px; color: var(--text2); }

    .section-h {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 14px;
    }

    .speed-section { margin-bottom: 16px; }

    .speed-bars { display: flex; flex-direction: column; gap: 12px; }

    .sb-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sb-label { font-size: 12px; color: var(--text2); width: 50px; flex-shrink: 0; }

    .sb-bar-wrap {
      flex: 1;
      height: 8px;
      background: var(--card2);
      border-radius: 4px;
      overflow: hidden;
    }

    .sb-bar {
      height: 100%;
      background: linear-gradient(90deg, var(--primary), var(--primary-light));
      border-radius: 4px;
      transition: width 1s ease;
    }

    .sb-max { background: linear-gradient(90deg, var(--secondary), #FF8FA3); }
    .sb-val { font-size: 12px; font-weight: 600; width: 60px; text-align: right; flex-shrink: 0; }

    .achievements { margin-bottom: 16px; }

    .ach-list {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .ach-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 500;
      background: var(--card2);
      border: 1px solid var(--border);
      color: var(--text3);
      filter: grayscale(1);
      opacity: 0.5;
      transition: all 0.3s;

      &.earned {
        background: rgba(108,99,255,0.15);
        border-color: rgba(108,99,255,0.4);
        color: var(--primary-light);
        filter: none;
        opacity: 1;
      }
    }
  `]
})
export class ActivityDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('mapEl') mapEl!: ElementRef;

  activity = signal<Activity | null>(null);
  loading = signal(true);
  private map!: L.Map;

  constructor(private route: ActivatedRoute, private tracking: TrackingService) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const act = await this.tracking.getActivity(id);
    this.activity.set(act);
    this.loading.set(false);
  }

  ngAfterViewInit() {
    setTimeout(() => {
      if (this.activity()) this.initMap();
    }, 300);
  }

  private initMap() {
    const act = this.activity()!;
    if (!this.mapEl?.nativeElement) return;

    this.map = L.map(this.mapEl.nativeElement, {
      zoomControl: false, attributionControl: false,
      dragging: false, scrollWheelZoom: false, doubleClickZoom: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);

    if (act.route?.length > 0) {
      const points: L.LatLngExpression[] = act.route.map(p => [p.lat, p.lng]);
      const poly = L.polyline(points, {
        color: '#6C63FF', weight: 5, opacity: 0.9,
        lineCap: 'round', lineJoin: 'round'
      }).addTo(this.map);

      // Start marker
      L.circleMarker(points[0] as L.LatLngExpression, {
        radius: 8, color: '#43E97B', fillColor: '#43E97B', fillOpacity: 1, weight: 2
      }).addTo(this.map).bindTooltip('Start', { permanent: false });

      // End marker
      L.circleMarker(points[points.length - 1] as L.LatLngExpression, {
        radius: 8, color: '#FF6584', fillColor: '#FF6584', fillOpacity: 1, weight: 2
      }).addTo(this.map).bindTooltip('End', { permanent: false });

      this.map.fitBounds(poly.getBounds(), { padding: [20, 20] });
    } else {
      this.map.setView([20, 0], 2);
    }
  }

  detailStats() {
    const a = this.activity()!;
    return [
      { icon: '👟', value: a.steps.toLocaleString(), label: 'Steps' },
      { icon: '🔥', value: a.calories + ' kcal', label: 'Calories' },
      { icon: '⚡', value: a.avgSpeed.toFixed(1) + ' km/h', label: 'Avg Speed' },
      { icon: '🚀', value: a.maxSpeed.toFixed(1) + ' km/h', label: 'Max Speed' },
      { icon: '📍', value: this.formatDist(a.distance), label: 'Distance' },
      { icon: '⏱️', value: this.formatDur(a.duration), label: 'Duration' },
    ];
  }

  achievements() {
    const a = this.activity()!;
    return [
      { icon: '🥇', label: 'First Step', earned: true },
      { icon: '🔥', label: '100+ Calories', earned: a.calories >= 100 },
      { icon: '📍', label: '1km Club', earned: a.distance >= 1000 },
      { icon: '🏃', label: '5km Runner', earned: a.distance >= 5000 },
      { icon: '⏱️', label: '30min Warrior', earned: a.duration >= 1800 },
      { icon: '👟', label: '5K Steps', earned: a.steps >= 5000 },
    ];
  }

  speedPct(speed: number): number {
    const max = this.activity()?.type === 'run' ? 20 : 10;
    return Math.min((speed / max) * 100, 100);
  }

  formatDist(m: number): string {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  }

  formatDur(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }
}
