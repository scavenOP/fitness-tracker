import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { LogService } from './core/services/log.service';
import { filter } from 'rxjs/operators';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <router-outlet />
      @if (showNav) {
        <nav class="bottom-nav glass">
          @for (item of navItems; track item.path) {
            <a [routerLink]="item.path" routerLinkActive="active" class="nav-item">
              <div class="nav-icon-wrap">
                <span class="nav-icon" [innerHTML]="item.icon"></span>
                <div class="nav-indicator"></div>
              </div>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        </nav>
      }

      <!-- Debug log overlay -->
      @if (logOpen()) {
        <div class="log-overlay">
          <div class="log-toolbar">
            <span>🪲 Debug Log ({{ logger.logs().length }})</span>
            <button (click)="logger.clear()">Clear</button>
            <button (click)="logOpen.set(false)">✕</button>
          </div>
          <div class="log-body">
            @for (e of logger.logs(); track $index) {
              <div class="log-entry" [class]="e.level">
                <span class="log-time">{{ e.time }}</span>
                <span class="log-msg">{{ e.msg }}</span>
              </div>
            }
          </div>
        </div>
      }
      <button class="log-fab" (click)="logOpen.set(!logOpen())">🪲</button>
    </div>
  `,
  styles: [`
    .app-shell {
      height: 100dvh;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    router-outlet + * {
      flex: 1;
      overflow: hidden;
    }

    .bottom-nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: var(--nav-height);
      display: flex;
      align-items: center;
      justify-content: space-around;
      padding: 0 8px;
      padding-bottom: env(safe-area-inset-bottom, 0);
      z-index: 1000;
      border-top: 1px solid var(--border);
      border-radius: 24px 24px 0 0;
    }

    .nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-decoration: none;
      color: var(--text3);
      transition: color 0.3s;
      padding: 8px 16px;
      border-radius: 16px;
      position: relative;
      min-width: 64px;

      &.active {
        color: var(--primary);
        .nav-icon-wrap { transform: translateY(-4px); }
        .nav-indicator { opacity: 1; transform: scaleX(1); }
        .nav-icon { filter: drop-shadow(0 0 8px var(--primary)); }
      }
    }

    .nav-icon-wrap {
      position: relative;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .nav-icon { font-size: 22px; display: block; line-height: 1; }

    .nav-indicator {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: 20px;
      height: 3px;
      background: var(--primary);
      border-radius: 2px;
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .nav-label { font-size: 11px; font-weight: 600; letter-spacing: 0.3px; transition: color 0.3s; }

    /* Debug log overlay */
    .log-fab {
      position: fixed;
      bottom: 90px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(0,0,0,0.6);
      border: none;
      font-size: 18px;
      cursor: pointer;
      z-index: 9999;
      opacity: 0.5;
    }

    .log-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.92);
      z-index: 10000;
      display: flex;
      flex-direction: column;
      font-family: monospace;
      font-size: 11px;
    }

    .log-toolbar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #111;
      color: #fff;
      font-size: 13px;
      span { flex: 1; }
      button { background: #333; color: #fff; border: none; padding: 4px 10px; border-radius: 4px; cursor: pointer; }
    }

    .log-body {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .log-entry {
      display: flex;
      gap: 8px;
      padding: 4px 6px;
      border-radius: 4px;
      word-break: break-all;
      white-space: pre-wrap;
      &.error { background: rgba(255,50,50,0.2); color: #ff6b6b; }
      &.warn  { background: rgba(255,200,0,0.15); color: #ffd43b; }
      &.info  { color: #a9e34b; }
    }

    .log-time { color: #888; flex-shrink: 0; }

    .nav-item:nth-child(2) {
      .nav-icon-wrap {
        background: linear-gradient(135deg, var(--primary), var(--secondary));
        width: 52px;
        height: 52px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: -20px;
        box-shadow: 0 4px 20px rgba(108,99,255,0.5);
        transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      }
      &.active .nav-icon-wrap {
        transform: translateY(-4px) scale(1.05);
        box-shadow: 0 8px 30px rgba(108,99,255,0.6);
      }
      .nav-icon { font-size: 24px; filter: none !important; }
      .nav-indicator { display: none; }
    }
  `]
})
export class AppComponent implements OnInit {
  showNav = false;
  logOpen = signal(false);

  navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/tracker', label: 'Track', icon: '▶️' },
    { path: '/history', label: 'History', icon: '📊' },
  ];

  constructor(private router: Router, private auth: AuthService, public logger: LogService) {}

  private async registerSilentChannel() {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await LocalNotifications.createChannel({
        id: 'fittrack_live',
        name: 'Live Tracking',
        importance: 3,       // DEFAULT importance — shows but no sound
        sound: undefined,    // no sound
        vibration: false,
        lights: false
      });
    } catch (_) {}
  }

  ngOnInit() {
    this.auth.handleRedirectResult();
    this.registerSilentChannel();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.showNav = !e.url.includes('/auth');
    });
  }
}
