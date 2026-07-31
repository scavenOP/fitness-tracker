import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { filter } from 'rxjs/operators';

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

  navItems = [
    { path: '/dashboard', label: 'Home', icon: '🏠' },
    { path: '/tracker', label: 'Track', icon: '▶️' },
    { path: '/history', label: 'History', icon: '📊' },
  ];

  constructor(private router: Router, private auth: AuthService) {}

  ngOnInit() {
    // Handle Google redirect result when app resumes after OAuth
    this.auth.handleRedirectResult();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((e: any) => {
      this.showNav = !e.url.includes('/auth');
    });
  }
}
