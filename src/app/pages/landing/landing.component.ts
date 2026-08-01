import { Component, OnInit, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(40px)' }),
        animate('0.7s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerFeatures', [
      transition(':enter', [
        query('.feature-card', [
          style({ opacity: 0, transform: 'translateY(30px)' }),
          stagger(100, animate('0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="landing">

      <!-- Animated background orbs -->
      <div class="bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <!-- Floating particles -->
      <div class="particles">
        @for (p of particles; track p.id) {
          <div class="particle" [style]="p.style"></div>
        }
      </div>

      <!-- Nav -->
      <nav class="landing-nav glass" @fadeUp>
        <div class="nav-brand">
          <img src="/assets/mobile_logo.png" alt="Fitly" class="nav-logo" />
          <span class="nav-name">Fitly</span>
        </div>
        <button class="btn btn-primary btn-sm" (click)="goToWeb()">Launch App</button>
      </nav>

      <!-- Hero -->
      <section class="hero">
        <div class="hero-content">
          <div class="hero-badge animate-fadeInUp" style="animation-delay:0.1s">
            <span class="badge-dot"></span>
            Your Personal Fitness Companion
          </div>

          <div class="logo-wrap animate-float">
            <img src="/assets/mobile_logo.png" alt="Fitly" class="hero-logo animate-glow" />
          </div>

          <h1 class="hero-title animate-fadeInUp" style="animation-delay:0.2s">
            Track. Move.<br><span class="gradient-text">Conquer.</span>
          </h1>

          <p class="hero-sub animate-fadeInUp" style="animation-delay:0.3s">
            Real-time GPS tracking, live stats, and beautiful insights — all in one app.
          </p>

          <!-- CTA Buttons -->
          <div class="cta-group animate-fadeInUp" style="animation-delay:0.4s">
            <button class="cta-btn cta-android" (click)="downloadAndroid()" [class.downloading]="downloading()">
              <div class="cta-btn-inner">
                <span class="cta-icon">
                  @if (downloading()) {
                    <span class="dl-spinner"></span>
                  } @else {
                    🤖
                  }
                </span>
                <div class="cta-text">
                  <span class="cta-label">Download for</span>
                  <span class="cta-platform">Android</span>
                </div>
                <span class="cta-arrow">↓</span>
              </div>
              <div class="cta-shine"></div>
            </button>

            <button class="cta-btn cta-web" (click)="goToWeb()">
              <div class="cta-btn-inner">
                <span class="cta-icon">🌐</span>
                <div class="cta-text">
                  <span class="cta-label">Use</span>
                  <span class="cta-platform">Web Version</span>
                </div>
                <span class="cta-arrow">→</span>
              </div>
              <div class="cta-shine"></div>
            </button>
          </div>

          <!-- iOS coming soon -->
          <div class="ios-badge animate-fadeInUp" style="animation-delay:0.5s">
            <span class="ios-icon"></span>
            <span>iOS — Coming Soon</span>
          </div>
        </div>
      </section>

      <!-- Stats strip -->
      <div class="stats-strip animate-fadeInUp" style="animation-delay:0.6s">
        @for (s of stats; track s.label) {
          <div class="strip-stat">
            <span class="strip-val">{{ s.value }}</span>
            <span class="strip-label">{{ s.label }}</span>
          </div>
          @if (!$last) { <div class="strip-divider"></div> }
        }
      </div>

      <!-- Features -->
      <section class="features" @staggerFeatures>
        @for (f of features; track f.title) {
          <div class="feature-card glass">
            <div class="feature-icon">{{ f.icon }}</div>
            <div class="feature-body">
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          </div>
        }
      </section>

      <!-- Footer -->
      <footer class="landing-footer">
        <div class="footer-logo">
          <img src="/assets/mobile_logo.png" alt="Fitly" class="footer-logo-img" />
          <span>Fitly</span>
        </div>
        <p>Built with ❤️ for fitness lovers</p>
      </footer>

      <!-- Download toast -->
      @if (showToast()) {
        <div class="dl-toast glass">
          ✅ Download started! Install the APK on your Android device.
        </div>
      }
    </div>
  `,
  styles: [`
    .landing {
      min-height: 100dvh;
      overflow-y: auto;
      overflow-x: hidden;
      background: var(--bg);
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* ── Background ── */
    .bg-orbs {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.25;
      animation: float 6s ease-in-out infinite;
    }

    .orb-1 {
      width: 500px; height: 500px;
      background: radial-gradient(circle, var(--primary), transparent);
      top: -150px; left: -150px;
      animation-delay: 0s;
    }

    .orb-2 {
      width: 400px; height: 400px;
      background: radial-gradient(circle, var(--secondary), transparent);
      top: 30%; right: -100px;
      animation-delay: 2s;
    }

    .orb-3 {
      width: 350px; height: 350px;
      background: radial-gradient(circle, var(--accent), transparent);
      bottom: 10%; left: 20%;
      animation-delay: 4s;
    }

    /* ── Particles ── */
    .particles {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
    }

    .particle {
      position: absolute;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: var(--primary);
      opacity: 0.4;
      animation: particleFloat linear infinite;
    }

    @keyframes particleFloat {
      0% { transform: translateY(100vh) scale(0); opacity: 0; }
      10% { opacity: 0.4; }
      90% { opacity: 0.4; }
      100% { transform: translateY(-100px) scale(1); opacity: 0; }
    }

    /* ── Nav ── */
    .landing-nav {
      position: sticky;
      top: 0;
      width: 100%;
      max-width: 900px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 24px;
      z-index: 100;
      border-bottom: 1px solid var(--border);
      border-radius: 0 0 20px 20px;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .nav-logo {
      width: 36px; height: 36px;
      border-radius: 10px;
      object-fit: cover;
    }

    .nav-name {
      font-family: 'Space Grotesk', sans-serif;
      font-size: 20px;
      font-weight: 700;
      background: linear-gradient(135deg, var(--primary-light), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .btn-sm { padding: 10px 20px; font-size: 14px; }

    /* ── Hero ── */
    .hero {
      width: 100%;
      max-width: 600px;
      padding: 40px 24px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      position: relative;
      z-index: 1;
    }

    .hero-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      width: 100%;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(108,99,255,0.15);
      border: 1px solid rgba(108,99,255,0.3);
      border-radius: 50px;
      padding: 8px 18px;
      font-size: 13px;
      font-weight: 500;
      color: var(--primary-light);
    }

    .badge-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent);
      animation: pulse 2s infinite;
      flex-shrink: 0;
    }

    .logo-wrap {
      position: relative;
    }

    .hero-logo {
      width: 110px; height: 110px;
      border-radius: 28px;
      object-fit: cover;
      box-shadow: 0 0 40px rgba(108,99,255,0.4), 0 0 80px rgba(108,99,255,0.2);
    }

    .hero-title {
      font-size: clamp(42px, 10vw, 64px);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -1px;
    }

    .hero-sub {
      font-size: 17px;
      color: var(--text2);
      line-height: 1.6;
      max-width: 420px;
    }

    /* ── CTA Buttons ── */
    .cta-group {
      display: flex;
      gap: 14px;
      width: 100%;
      max-width: 480px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .cta-btn {
      flex: 1;
      min-width: 180px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;
      padding: 0;

      &:hover { transform: translateY(-4px); }
      &:active { transform: scale(0.97); }
    }

    .cta-btn-inner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 18px 22px;
      position: relative;
      z-index: 1;
    }

    .cta-android {
      background: linear-gradient(135deg, #3DDC84, #00C853);
      box-shadow: 0 8px 30px rgba(61,220,132,0.35);
      &:hover { box-shadow: 0 12px 40px rgba(61,220,132,0.5); }
      &.downloading { opacity: 0.8; pointer-events: none; }
    }

    .cta-web {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      box-shadow: 0 8px 30px rgba(108,99,255,0.35);
      &:hover { box-shadow: 0 12px 40px rgba(108,99,255,0.5); }
    }

    .cta-icon {
      font-size: 28px;
      line-height: 1;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
    }

    .cta-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex: 1;
    }

    .cta-label {
      font-size: 11px;
      font-weight: 500;
      color: rgba(255,255,255,0.75);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cta-platform {
      font-size: 18px;
      font-weight: 700;
      color: white;
      font-family: 'Space Grotesk', sans-serif;
    }

    .cta-arrow {
      font-size: 20px;
      color: rgba(255,255,255,0.8);
      font-weight: 700;
    }

    .cta-shine {
      position: absolute;
      top: 0; left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transform: skewX(-20deg);
      transition: left 0.6s;
    }

    .cta-btn:hover .cta-shine { left: 150%; }

    .dl-spinner {
      width: 24px; height: 24px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: block;
    }

    /* ── iOS badge ── */
    .ios-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 50px;
      padding: 8px 18px;
      font-size: 13px;
      color: var(--text2);
    }

    .ios-icon {
      width: 16px; height: 16px;
      background: var(--text2);
      border-radius: 3px;
      -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'/%3E%3C/svg%3E") center/contain no-repeat;
      mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z'/%3E%3C/svg%3E") center/contain no-repeat;
    }

    /* ── Stats strip ── */
    .stats-strip {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 20px 32px;
      margin: 0 24px 32px;
      width: calc(100% - 48px);
      max-width: 560px;
      position: relative;
      z-index: 1;
    }

    .strip-stat {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .strip-val {
      font-size: 26px;
      font-weight: 800;
      font-family: 'Space Grotesk', sans-serif;
      background: linear-gradient(135deg, var(--primary-light), var(--accent));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .strip-label {
      font-size: 12px;
      color: var(--text2);
      font-weight: 500;
    }

    .strip-divider {
      width: 1px;
      height: 40px;
      background: var(--border);
      flex-shrink: 0;
    }

    /* ── Features ── */
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
      padding: 0 24px 32px;
      width: 100%;
      max-width: 900px;
      position: relative;
      z-index: 1;
    }

    .feature-card {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 20px;
      border-radius: 18px;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 40px rgba(108,99,255,0.2);
      }
    }

    .feature-icon {
      font-size: 32px;
      line-height: 1;
      flex-shrink: 0;
    }

    .feature-body {
      h3 { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
      p { font-size: 13px; color: var(--text2); line-height: 1.5; }
    }

    /* ── Footer ── */
    .landing-footer {
      width: 100%;
      padding: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      border-top: 1px solid var(--border);
      position: relative;
      z-index: 1;

      p { font-size: 13px; color: var(--text3); }
    }

    .footer-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Space Grotesk', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: var(--text2);
    }

    .footer-logo-img {
      width: 28px; height: 28px;
      border-radius: 8px;
      object-fit: cover;
    }

    /* ── Toast ── */
    .dl-toast {
      position: fixed;
      bottom: 32px;
      left: 50%;
      transform: translateX(-50%);
      padding: 14px 24px;
      border-radius: 50px;
      font-size: 14px;
      font-weight: 500;
      z-index: 9999;
      white-space: nowrap;
      animation: fadeInUp 0.4s ease, fadeOut 0.4s ease 3s forwards;
    }

    @keyframes fadeOut {
      to { opacity: 0; transform: translateX(-50%) translateY(10px); }
    }
  `]
})
export class LandingComponent implements OnInit {
  downloading = signal(false);
  showToast = signal(false);

  readonly APK_URL = 'https://github.com/Ahsaniss/fitness-tracker/raw/main/APK/Fitly.apk';

  particles: { id: number; style: string }[] = [];

  stats = [
    { value: 'GPS', label: 'Live Tracking' },
    { value: '100%', label: 'Free' },
    { value: 'Real-time', label: 'Stats' },
    { value: '∞', label: 'Activities' },
  ];

  features = [
    { icon: '🗺️', title: 'Live GPS Tracking', desc: 'Real-time route mapping with OpenStreetMap — no API key needed.' },
    { icon: '⚡', title: 'Instant Stats', desc: 'Speed, distance, steps, calories and duration updated live.' },
    { icon: '📊', title: 'Activity History', desc: 'Browse all past workouts with filters by type, week or month.' },
    { icon: '🏅', title: 'Achievements', desc: 'Unlock badges and milestones as you hit your fitness goals.' },
    { icon: '🔐', title: 'Secure Auth', desc: 'Email/password and Google sign-in with persistent sessions.' },
    { icon: '📱', title: 'Mobile First', desc: 'Designed for phones with smooth animations and touch gestures.' },
  ];

  constructor(private router: Router) {}

  ngOnInit() {
    this.particles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      style: [
        `left: ${Math.random() * 100}%`,
        `animation-duration: ${6 + Math.random() * 10}s`,
        `animation-delay: ${Math.random() * 10}s`,
        `width: ${2 + Math.random() * 4}px`,
        `height: ${2 + Math.random() * 4}px`,
        `opacity: ${0.2 + Math.random() * 0.4}`,
        `background: ${Math.random() > 0.5 ? 'var(--primary)' : Math.random() > 0.5 ? 'var(--accent)' : 'var(--secondary)'}`,
      ].join(';')
    }));
  }

  downloadAndroid() {
    this.downloading.set(true);
    const a = document.createElement('a');
    a.href = this.APK_URL;
    a.download = 'Fitly.apk';
    a.click();
    setTimeout(() => {
      this.downloading.set(false);
      this.showToast.set(true);
      setTimeout(() => this.showToast.set(false), 3500);
    }, 1500);
  }

  goToWeb() {
    this.router.navigate(['/auth']);
  }
}
