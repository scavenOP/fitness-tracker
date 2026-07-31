import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, user, updateProfile, signInWithRedirect, getRedirectResult,
  GoogleAuthProvider, browserLocalPersistence, setPersistence
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private injector = inject(Injector);

  user$: Observable<any> = user(this.auth);

  get currentUser() { return this.auth.currentUser; }
  get uid() { return this.auth.currentUser?.uid; }

  // Call this on app startup to handle redirect result after Google login
  async handleRedirectResult() {
    try {
      const result = await runInInjectionContext(this.injector, () =>
        getRedirectResult(this.auth)
      );
      if (result?.user) {
        this.router.navigate(['/dashboard']);
      }
    } catch (e) {
      console.error('Redirect result error', e);
    }
  }

  async login(email: string, password: string) {
    await runInInjectionContext(this.injector, () =>
      signInWithEmailAndPassword(this.auth, email, password)
    );
    this.router.navigate(['/dashboard']);
  }

  async signup(email: string, password: string, displayName: string) {
    const cred = await runInInjectionContext(this.injector, () =>
      createUserWithEmailAndPassword(this.auth, email, password)
    );
    await updateProfile(cred.user, { displayName });
    this.router.navigate(['/dashboard']);
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    await runInInjectionContext(this.injector, () =>
      setPersistence(this.auth, browserLocalPersistence)
    );

    if (Capacitor.isNativePlatform()) {
      // Native: use redirect — popup doesn't work in Capacitor WebView
      await runInInjectionContext(this.injector, () =>
        signInWithRedirect(this.auth, provider)
      );
    } else {
      // Web browser: use popup
      const { signInWithPopup } = await import('@angular/fire/auth');
      const result = await runInInjectionContext(this.injector, () =>
        signInWithPopup(this.auth, provider)
      );
      if (result.user) this.router.navigate(['/dashboard']);
    }
  }

  async logout() {
    await runInInjectionContext(this.injector, () => signOut(this.auth));
    this.router.navigate(['/auth']);
  }
}
