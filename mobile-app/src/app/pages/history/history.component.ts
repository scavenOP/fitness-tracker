import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrackingService, Activity } from '../../core/services/tracking.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('listAnim', [
      transition(':enter', [
        query('.hist-item', [
          style({ opacity: 0, transform: 'translateX(-20px)' }),
          stagger(60, animate('0.4s ease', style({ opacity: 1, transform: 'translateX(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <header class="hist-header glass">
        <h2>Activity History</h2>
        <span class="badge badge-primary">{{ activities().length }} total</span>
      </header>

      <div class="page-content">
        @if (loading()) {
          <div style="display:flex;justify-content:center;padding:60px">
            <div class="spinner"></div>
          </div>
        } @else if (activities().length === 0) {
          <div class="empty-state">
            <span class="empty-icon">📋</span>
            <h3>No activities yet</h3>
            <p>Complete your first workout to see it here.</p>
            <a routerLink="/tracker" class="btn btn-primary">Start Tracking</a>
          </div>
        } @else {
          <!-- Filter tabs -->
          <div class="filter-tabs">
            @for (f of filters; track f.value) {
              <button class="filter-tab" [class.active]="activeFilter() === f.value"
                (click)="activeFilter.set(f.value)">
                {{ f.label }}
              </button>
            }
          </div>

          <!-- Summary bar -->
          <div class="summary-bar">
            <div class="sum-item">
              <span class="sum-val">{{ totalDist() }}</span>
              <span class="sum-label">Total Distance</span>
            </div>
            <div class="sum-divider"></div>
            <div class="sum-item">
              <span class="sum-val">{{ totalCal() }}</span>
              <span class="sum-label">Total Calories</span>
            </div>
            <div class="sum-divider"></div>
            <div class="sum-item">
              <span class="sum-val">{{ totalSteps() }}</span>
              <span class="sum-label">Total Steps</span>
            </div>
          </div>

          <!-- Activity list grouped by date -->
          <div @listAnim>
            @for (group of groupedActivities(); track group.date) {
              <div class="date-group">
                <div class="date-label">{{ group.date }}</div>
                @for (act of group.items; track act.id) {
                  <a [routerLink]="['/activity', act.id]" class="hist-item">
                    <div class="hist-icon" [class.run]="act.type === 'run'">
                      {{ act.type === 'run' ? '🏃' : '🚶' }}
                    </div>
                    <div class="hist-info">
                      <div class="hist-title">{{ act.type === 'run' ? 'Running' : 'Walking' }}</div>
                      <div class="hist-time">{{ act.startTime | date:'h:mm a' }}</div>
                    </div>
                    <div class="hist-metrics">
                      <div class="hist-metric">
                        <span class="hm-val">{{ formatDist(act.distance) }}</span>
                        <span class="hm-label">dist</span>
                      </div>
                      <div class="hist-metric">
                        <span class="hm-val">{{ act.calories }}</span>
                        <span class="hm-label">kcal</span>
                      </div>
                      <div class="hist-metric">
                        <span class="hm-val">{{ formatDur(act.duration) }}</span>
                        <span class="hm-label">time</span>
                      </div>
                    </div>
                    <span class="hist-arrow">›</span>
                  </a>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .hist-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      padding-top: calc(16px + env(safe-area-inset-top, 0));
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;

      h2 { font-size: 20px; font-weight: 700; }
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      overflow-x: auto;
      padding-bottom: 4px;
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }

    .filter-tab {
      padding: 8px 18px;
      border-radius: 50px;
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--text2);
      font-family: 'Inter', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.2s;

      &.active {
        background: var(--primary);
        border-color: var(--primary);
        color: white;
      }
    }

    .summary-bar {
      display: flex;
      background: var(--card);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      padding: 16px;
      margin-bottom: 20px;
      justify-content: space-around;
    }

    .sum-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .sum-val { font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
    .sum-label { font-size: 11px; color: var(--text2); }
    .sum-divider { width: 1px; background: var(--border); }

    .date-group { margin-bottom: 20px; }

    .date-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text2);
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 8px;
      padding-left: 4px;
    }

    .hist-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: var(--card);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      padding: 14px;
      text-decoration: none;
      color: var(--text);
      margin-bottom: 8px;
      transition: all 0.2s;

      &:active { transform: scale(0.98); }
    }

    .hist-icon {
      width: 42px; height: 42px;
      border-radius: 12px;
      background: rgba(108,99,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;

      &.run { background: rgba(255,101,132,0.15); }
    }

    .hist-info { flex: 1; }
    .hist-title { font-size: 14px; font-weight: 600; }
    .hist-time { font-size: 12px; color: var(--text2); margin-top: 2px; }

    .hist-metrics {
      display: flex;
      gap: 12px;
    }

    .hist-metric {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .hm-val { font-size: 13px; font-weight: 700; }
    .hm-label { font-size: 10px; color: var(--text2); }
    .hist-arrow { color: var(--text3); font-size: 20px; }
  `]
})
export class HistoryComponent implements OnInit {
  activities = signal<Activity[]>([]);
  loading = signal(true);
  activeFilter = signal('all');

  filters = [
    { label: 'All', value: 'all' },
    { label: '🚶 Walk', value: 'walk' },
    { label: '🏃 Run', value: 'run' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  constructor(private tracking: TrackingService) {}

  async ngOnInit() {
    const acts = await this.tracking.getActivities();
    this.activities.set(acts);
    this.loading.set(false);
  }

  get filtered(): Activity[] {
    const f = this.activeFilter();
    const acts = this.activities();
    if (f === 'walk' || f === 'run') return acts.filter(a => a.type === f);
    if (f === 'week') return acts.filter(a => a.startTime > Date.now() - 7 * 86400000);
    if (f === 'month') return acts.filter(a => a.startTime > Date.now() - 30 * 86400000);
    return acts;
  }

  groupedActivities() {
    const groups: Record<string, Activity[]> = {};
    for (const act of this.filtered) {
      const key = this.dateLabel(act.startTime);
      if (!groups[key]) groups[key] = [];
      groups[key].push(act);
    }
    return Object.entries(groups).map(([date, items]) => ({ date, items }));
  }

  totalDist() { return this.formatDist(this.filtered.reduce((s, a) => s + a.distance, 0)); }
  totalCal() { return this.filtered.reduce((s, a) => s + a.calories, 0).toLocaleString() + ' kcal'; }
  totalSteps() { return this.filtered.reduce((s, a) => s + a.steps, 0).toLocaleString(); }

  private dateLabel(ts: number): string {
    const d = new Date(ts);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  }

  formatDist(m: number): string {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  }

  formatDur(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m` : `${sec}s`;
  }
}
