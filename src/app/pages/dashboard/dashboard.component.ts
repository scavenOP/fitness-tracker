import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TrackingService, Activity } from '../../core/services/tracking.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

interface ChartBar { label: string; steps: number; pct: number; isToday: boolean; }

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  animations: [
    trigger('staggerCards', [
      transition(':enter', [
        query('.anim-card', [
          style({ opacity: 0, transform: 'translateY(24px)' }),
          stagger(80, animate('0.45s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="page-container">
      <!-- Header -->
      <header class="dash-header glass">
        <div class="header-left">
          <div class="header-brand">
            <img src="/assets/mobile_logo.png" alt="Fitly" class="header-logo" />
            <span class="header-app-name">Fitly</span>
          </div>
          <p class="greeting">{{ greeting }}, 👋</p>
          <h2 class="user-name">{{ userName() }}</h2>
        </div>
        <button class="btn btn-icon btn-secondary" (click)="logout()">🚪</button>
      </header>

      <div class="page-content" @staggerCards>
        <!-- Hero banner -->
        <div class="hero-banner anim-card">
          <div class="hero-content">
            <h2>Ready to <span class="gradient-text">crush it</span> today?</h2>
            <p>Track your workout and hit your goals!</p>
            <a routerLink="/tracker" class="btn btn-primary">Start Tracking 🏃</a>
          </div>
          <div class="hero-emoji animate-float">🏅</div>
        </div>

        <!-- Weekly stats -->
        <div class="section-title anim-card">
          <h3>This Week</h3>
          <span class="badge badge-primary">{{ weekActivities() }} activities</span>
        </div>

        <div class="stats-grid anim-card">
          @for (stat of weekStats(); track stat.label) {
            <div class="stat-card">
              <span class="stat-icon">{{ stat.icon }}</span>
              <span class="stat-value">{{ stat.value }}</span>
              <span class="stat-label">{{ stat.label }}</span>
            </div>
          }
        </div>

        <!-- Steps Bar Chart -->
        <div class="chart-card anim-card">
          <div class="chart-header">
            <div class="chart-title-wrap">
              <h3>Steps</h3>
              <span class="chart-total">{{ chartTotal() | number }} total</span>
            </div>
            <div class="chart-toggle">
              <button class="toggle-btn" [class.active]="chartMode() === 'week'" (click)="chartMode.set('week')">Week</button>
              <button class="toggle-btn" [class.active]="chartMode() === 'month'" (click)="chartMode.set('month')">Month</button>
            </div>
          </div>

          <div class="bar-chart" [class.monthly]="chartMode() === 'month'">
            @for (bar of chartBarsWithPct(); track bar.label) {
              <div class="bar-col" [class.today]="bar.isToday" [title]="bar.steps + ' steps'">
                <span class="bar-steps-tip">{{ bar.steps > 0 ? (bar.steps | number) : '' }}</span>
                <div class="bar-wrap">
                  <div class="bar-fill" [style.height.%]="bar.pct"
                    [class.bar-active]="bar.isToday || bar.steps > 0">
                    <div class="bar-glow"></div>
                  </div>
                </div>
                <span class="bar-label">{{ bar.label }}</span>
              </div>
            }
          </div>

          @if (chartBars().length === 0 || chartTotal() === 0) {
            <div class="chart-empty">
              <span>👟</span>
              <span>No steps recorded yet — start walking!</span>
            </div>
          }
        </div>

        <!-- Recent activities -->
        <div class="section-title anim-card">
          <h3>Recent Activities</h3>
          <a routerLink="/history" class="see-all">See all →</a>
        </div>

        @if (loading()) {
          <div class="loading-wrap anim-card">
            <div class="spinner"></div>
          </div>
        } @else if (activities().length === 0) {
          <div class="empty-state anim-card">
            <span class="empty-icon">🏃</span>
            <h3>No activities yet</h3>
            <p>Start your first workout to see your progress here!</p>
            <a routerLink="/tracker" class="btn btn-primary">Start Now</a>
          </div>
        } @else {
          <div class="activities-list">
            @for (act of activities().slice(0, 5); track act.id; let i = $index) {
              <a [routerLink]="['/activity', act.id]" class="activity-card anim-card" [style.animation-delay]="(i * 0.08) + 's'">
                <div class="act-icon-wrap" [class.run]="act.type === 'run'">
                  {{ act.type === 'run' ? '🏃' : '🚶' }}
                </div>
                <div class="act-info">
                  <div class="act-title">{{ act.type === 'run' ? 'Running' : 'Walking' }}</div>
                  <div class="act-date">{{ act.startTime | date:'MMM d, h:mm a' }}</div>
                </div>
                <div class="act-stats">
                  <div class="act-stat">{{ formatDist(act.distance) }}</div>
                  <div class="act-stat-label">{{ formatDuration(act.duration) }}</div>
                </div>
                <span class="act-arrow">›</span>
              </a>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dash-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      padding-top: calc(16px + env(safe-area-inset-top, 0));
      border-bottom: 1px solid var(--border);
      flex-shrink: 0;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .header-logo {
      width: 28px; height: 28px;
      border-radius: 8px;
      object-fit: cover;
    }

    .header-app-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 15px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-light), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .greeting { font-size: 13px; color: var(--text2); margin-bottom: 2px; }
    .user-name { font-size: 20px; font-weight: 700; }

    .hero-banner {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 50%, #3D35B5 100%);
      border-radius: var(--radius);
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      overflow: hidden;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        top: -50%; right: -20%;
        width: 200px; height: 200px;
        background: rgba(255,255,255,0.05);
        border-radius: 50%;
      }
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      h2 { font-size: 22px; color: white; }
      p { font-size: 13px; color: rgba(255,255,255,0.7); }
    }

    .hero-emoji { font-size: 64px; line-height: 1; }

    .section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
      h3 { font-size: 17px; font-weight: 700; }
    }

    .see-all {
      font-size: 13px;
      color: var(--primary-light);
      text-decoration: none;
      font-weight: 500;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--card);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transition: transform 0.2s;
      &:active { transform: scale(0.97); }
    }

    .stat-icon { font-size: 24px; }
    .stat-value { font-size: 22px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
    .stat-label { font-size: 12px; color: var(--text2); font-weight: 500; }

    /* ── Chart ── */
    .chart-card {
      background: var(--card);
      border-radius: var(--radius);
      border: 1px solid var(--border);
      padding: 18px 16px 14px;
      margin-bottom: 24px;
    }

    .chart-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .chart-title-wrap {
      display: flex;
      flex-direction: column;
      gap: 2px;
      h3 { font-size: 16px; font-weight: 700; }
    }

    .chart-total { font-size: 12px; color: var(--text2); }

    .chart-toggle {
      display: flex;
      background: var(--card2);
      border-radius: 50px;
      padding: 3px;
      border: 1px solid var(--border);
    }

    .toggle-btn {
      padding: 5px 14px;
      border: none;
      background: transparent;
      color: var(--text2);
      font-family: 'Inter', sans-serif;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 50px;
      transition: all 0.25s;

      &.active {
        background: var(--primary);
        color: white;
        box-shadow: 0 2px 8px rgba(108,99,255,0.4);
      }
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      gap: 6px;
      height: 120px;
      padding-bottom: 24px;
      position: relative;

      &.monthly {
        gap: 3px;
        .bar-label { font-size: 8px; }
        .bar-steps-tip { display: none; }
      }
    }

    .bar-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      position: relative;
      cursor: default;

      &:hover .bar-steps-tip { opacity: 1; transform: translateY(0); }
      &.today .bar-fill { background: linear-gradient(180deg, var(--primary-light), var(--primary)); }
    }

    .bar-steps-tip {
      position: absolute;
      top: -22px;
      background: var(--card2);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2px 6px;
      font-size: 10px;
      font-weight: 600;
      white-space: nowrap;
      opacity: 0;
      transform: translateY(4px);
      transition: all 0.2s;
      pointer-events: none;
      z-index: 2;
    }

    .bar-wrap {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      padding: 0 1px;
    }

    .bar-fill {
      width: 100%;
      min-height: 3px;
      background: var(--card2);
      border-radius: 4px 4px 2px 2px;
      transition: height 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      overflow: hidden;

      &.bar-active {
        background: linear-gradient(180deg, rgba(108,99,255,0.9), rgba(108,99,255,0.5));
      }
    }

    .bar-glow {
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 40%;
      background: rgba(255,255,255,0.15);
      border-radius: 4px 4px 0 0;
    }

    .bar-label {
      position: absolute;
      bottom: 0;
      font-size: 10px;
      color: var(--text2);
      font-weight: 500;
      white-space: nowrap;

      .today & { color: var(--primary-light); font-weight: 700; }
    }

    .chart-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 8px 0 4px;
      font-size: 12px;
      color: var(--text3);
    }

    /* ── Activities ── */
    .loading-wrap { display: flex; justify-content: center; padding: 40px; }

    .activities-list { display: flex; flex-direction: column; gap: 10px; }

    .activity-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: var(--card);
      border-radius: var(--radius-sm);
      border: 1px solid var(--border);
      padding: 14px 16px;
      text-decoration: none;
      color: var(--text);
      transition: all 0.2s;
      animation: fadeInUp 0.4s ease both;
      &:active { transform: scale(0.98); background: var(--card2); }
    }

    .act-icon-wrap {
      width: 44px; height: 44px;
      border-radius: 12px;
      background: rgba(108,99,255,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
      &.run { background: rgba(255,101,132,0.15); }
    }

    .act-info { flex: 1; }
    .act-title { font-size: 15px; font-weight: 600; }
    .act-date { font-size: 12px; color: var(--text2); margin-top: 2px; }
    .act-stats { text-align: right; }
    .act-stat { font-size: 15px; font-weight: 700; }
    .act-stat-label { font-size: 12px; color: var(--text2); }
    .act-arrow { color: var(--text3); font-size: 20px; margin-left: 4px; }
  `]
})
export class DashboardComponent implements OnInit {
  activities = signal<Activity[]>([]);
  loading = signal(true);
  userName = signal('Athlete');
  weekActivities = signal(0);
  weekStats = signal<any[]>([]);
  chartMode = signal<'week' | 'month'>('week');

  greeting = '';

  constructor(private auth: AuthService, private tracking: TrackingService) {
    const h = new Date().getHours();
    this.greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }

  async ngOnInit() {
    this.auth.user$.subscribe(u => {
      if (u?.displayName) this.userName.set(u.displayName.split(' ')[0]);
    });

    const acts = await this.tracking.getActivities();
    this.activities.set(acts);
    this.loading.set(false);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weekActs = acts.filter(a => a.startTime > weekAgo);
    this.weekActivities.set(weekActs.length);

    const totalDist = weekActs.reduce((s, a) => s + a.distance, 0);
    const totalCal = weekActs.reduce((s, a) => s + a.calories, 0);
    const totalSteps = weekActs.reduce((s, a) => s + a.steps, 0);
    const totalTime = weekActs.reduce((s, a) => s + a.duration, 0);

    this.weekStats.set([
      { icon: '📍', value: this.formatDist(totalDist), label: 'Distance' },
      { icon: '🔥', value: totalCal.toLocaleString(), label: 'Calories' },
      { icon: '👟', value: totalSteps.toLocaleString(), label: 'Steps' },
      { icon: '⏱️', value: this.formatDuration(totalTime), label: 'Active Time' },
    ]);
  }

  chartBars = computed<ChartBar[]>(() => {
    const mode = this.chartMode();
    const acts = this.activities();
    const today = new Date();

    if (mode === 'week') {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(today.getDate() - (6 - i));
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        const steps = acts
          .filter(a => a.startTime >= dayStart && a.startTime < dayEnd)
          .reduce((s, a) => s + a.steps, 0);
        const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return {
          label: labels[d.getDay()],
          steps,
          pct: 0,
          isToday: d.toDateString() === today.toDateString()
        };
      });
    } else {
      const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      return Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
        const dayStart = d.getTime();
        const dayEnd = dayStart + 86400000;
        const steps = acts
          .filter(a => a.startTime >= dayStart && a.startTime < dayEnd)
          .reduce((s, a) => s + a.steps, 0);
        return {
          label: String(i + 1),
          steps,
          pct: 0,
          isToday: d.toDateString() === today.toDateString()
        };
      });
    }
  });

  // Separate computed for bars with percentages (avoids circular)
  chartBarsWithPct = computed<ChartBar[]>(() => {
    const bars = this.chartBars();
    const max = Math.max(...bars.map(b => b.steps), 1);
    return bars.map(b => ({ ...b, pct: Math.max((b.steps / max) * 100, b.steps > 0 ? 8 : 3) }));
  });

  chartTotal = computed(() => this.chartBars().reduce((s, b) => s + b.steps, 0));

  formatDist(m: number): string {
    return m >= 1000 ? (m / 1000).toFixed(2) + ' km' : Math.round(m) + ' m';
  }

  formatDuration(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  logout() { this.auth.logout(); }
}
