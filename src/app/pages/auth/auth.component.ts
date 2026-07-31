import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { trigger, transition, style, animate, query, stagger } from '@angular/animations';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30px)' }),
        animate('0.5s cubic-bezier(0.34, 1.56, 0.64, 1)', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    trigger('staggerIn', [
      transition(':enter', [
        query('.stagger-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(80, animate('0.4s ease', style({ opacity: 1, transform: 'translateY(0)' })))
        ], { optional: true })
      ])
    ])
  ],
  template: `
    <div class="auth-page">
      <!-- Animated background -->
      <div class="bg-orbs">
        <div class="orb orb1"></div>
        <div class="orb orb2"></div>
        <div class="orb orb3"></div>
      </div>

      <div class="auth-container" @fadeSlide>
        <!-- Logo -->
        <div class="logo-section">
          <div class="logo-icon animate-float">🏃</div>
          <h1 class="logo-text">FitTrack <span class="gradient-text">Pro</span></h1>
          <p class="logo-sub">Your personal fitness companion</p>
        </div>

        <!-- Tab switcher -->
        <div class="tab-switcher">
          <button class="tab-btn" [class.active]="!isSignup()" (click)="isSignup.set(false)">Login</button>
          <button class="tab-btn" [class.active]="isSignup()" (click)="isSignup.set(true)">Sign Up</button>
          <div class="tab-indicator" [style.transform]="isSignup() ? 'translateX(100%)' : 'translateX(0)'"></div>
        </div>

        <!-- Form -->
        <form class="auth-form" @staggerIn (ngSubmit)="submit()">
          @if (isSignup()) {
            <div class="input-group stagger-item">
              <label>Full Name</label>
              <div class="input-wrap">
                <span class="input-icon">👤</span>
                <input type="text" [(ngModel)]="name" name="name" placeholder="John Doe" required />
              </div>
            </div>
          }

          <div class="input-group stagger-item">
            <label>Email</label>
            <div class="input-wrap">
              <span class="input-icon">✉️</span>
              <input type="email" [(ngModel)]="email" name="email" placeholder="you@example.com" required />
            </div>
          </div>

          <div class="input-group stagger-item">
            <label>Password</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input [type]="showPass ? 'text' : 'password'" [(ngModel)]="password" name="password"
                placeholder="••••••••" required minlength="6" />
              <button type="button" class="pass-toggle" (click)="showPass = !showPass">
                {{ showPass ? '🙈' : '👁️' }}
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="error-msg stagger-item">⚠️ {{ error() }}</div>
          }

          <button type="submit" class="btn btn-primary btn-lg stagger-item" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-sm"></span>
            } @else {
              {{ isSignup() ? '🚀 Create Account' : '⚡ Login' }}
            }
          </button>
        </form>

        <!-- Features preview -->
        <div class="features-row">
          @for (f of features; track f.icon) {
            <div class="feature-chip">
              <span>{{ f.icon }}</span>
              <span>{{ f.label }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      position: relative;
      overflow: hidden;
      background: var(--bg);
    }

    .bg-orbs {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.15;
    }

    .orb1 {
      width: 400px; height: 400px;
      background: var(--primary);
      top: -100px; left: -100px;
      animation: float 6s ease-in-out infinite;
    }

    .orb2 {
      width: 300px; height: 300px;
      background: var(--secondary);
      bottom: -50px; right: -50px;
      animation: float 8s ease-in-out infinite reverse;
    }

    .orb3 {
      width: 200px; height: 200px;
      background: var(--accent);
      top: 50%; left: 50%;
      animation: float 5s ease-in-out infinite 2s;
    }

    .auth-container {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      gap: 24px;
      position: relative;
      z-index: 1;
    }

    .logo-section {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .logo-icon {
      font-size: 56px;
      line-height: 1;
      filter: drop-shadow(0 0 20px rgba(108,99,255,0.5));
    }

    .logo-text {
      font-size: 32px;
      font-weight: 800;
      color: var(--text);
    }

    .logo-sub {
      color: var(--text2);
      font-size: 14px;
    }

    .tab-switcher {
      display: flex;
      background: var(--card);
      border-radius: 50px;
      padding: 4px;
      position: relative;
      border: 1px solid var(--border);
    }

    .tab-btn {
      flex: 1;
      padding: 12px;
      border: none;
      background: transparent;
      color: var(--text2);
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 50px;
      position: relative;
      z-index: 1;
      transition: color 0.3s;

      &.active { color: white; }
    }

    .tab-indicator {
      position: absolute;
      top: 4px; bottom: 4px;
      left: 4px;
      width: calc(50% - 4px);
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 50px;
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: 0 4px 15px rgba(108,99,255,0.4);
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      background: var(--card);
      border-radius: var(--radius);
      padding: 24px;
      border: 1px solid var(--border);
    }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;

      .input-icon {
        position: absolute;
        left: 14px;
        font-size: 16px;
        pointer-events: none;
      }

      input {
        padding-left: 44px !important;
        padding-right: 44px !important;
      }

      .pass-toggle {
        position: absolute;
        right: 12px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 16px;
        padding: 4px;
      }
    }

    .error-msg {
      background: rgba(255,101,132,0.1);
      border: 1px solid rgba(255,101,132,0.3);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
      font-size: 13px;
      color: var(--secondary);
    }

    .spinner-sm {
      width: 20px; height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .features-row {
      display: flex;
      gap: 8px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .feature-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 50px;
      padding: 8px 14px;
      font-size: 12px;
      color: var(--text2);
      font-weight: 500;
    }
  `]
})
export class AuthComponent {
  isSignup = signal(false);
  loading = signal(false);
  error = signal('');

  email = '';
  password = '';
  name = '';
  showPass = false;

  features = [
    { icon: '🗺️', label: 'Live Map' },
    { icon: '⚡', label: 'Real-time' },
    { icon: '📊', label: 'Analytics' },
    { icon: '🔥', label: 'Calories' },
  ];

  constructor(private auth: AuthService) {}

  async submit() {
    this.error.set('');
    this.loading.set(true);
    try {
      if (this.isSignup()) {
        await this.auth.signup(this.email, this.password, this.name);
      } else {
        await this.auth.login(this.email, this.password);
      }
    } catch (e: any) {
      this.error.set(this.parseError(e.code));
    } finally {
      this.loading.set(false);
    }
  }

  private parseError(code: string): string {
    const map: Record<string, string> = {
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'Email already registered.',
      'auth/weak-password': 'Password must be at least 6 characters.',
      'auth/invalid-email': 'Invalid email address.',
      'auth/invalid-credential': 'Invalid email or password.',
    };
    return map[code] || 'Something went wrong. Please try again.';
  }
}
