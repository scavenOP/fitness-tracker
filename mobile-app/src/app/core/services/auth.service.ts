import { Injectable, inject, Injector, runInInjectionContext, NgZone } from '@angular/core';
import {
  Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, user, updateProfile, signInWithRedirect, signInWithPopup, getRedirectResult,
  GoogleAuthProvider, browserLocalPersistence, setPersistence, signInWithCredential
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

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
      // Listen for deep link bringing app back after Google redirect
      if (Capacitor.isNativePlatform()) {
        App.addListener('appUrlOpen', async () => {
          try {
            const result = await getRedirectResult(this.auth);
            if (result?.user) this.router.navigate(['/dashboard']);
          } catch (e) { console.error('Deep link redirect result error', e); }
        });
      }
      const result = await getRedirectResult(this.auth);
      if (result?.user) this.router.navigate(['/dashboard']);
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
    await setPersistence(this.auth, browserLocalPersistence);

    if (Capacitor.isNativePlatform()) {
      // Use @codetrix-studio/capacitor-google-auth for native —
      // returns idToken directly, no redirect/domain needed
      const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
      const googleUser = await GoogleAuth.signIn();
      const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
      const result = await signInWithCredential(this.auth, credential);
      if (result.user) this.router.navigate(['/dashboard']);
    } else {
      try {
        const result = await signInWithPopup(this.auth, provider);
        if (result.user) this.router.navigate(['/dashboard']);
      } catch (popupError: any) {
        console.error('Popup failed:', popupError?.code, popupError);
        if (popupError?.code === 'auth/popup-blocked' ||
            popupError?.code === 'auth/popup-closed-by-user' ||
            popupError?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(this.auth, provider);
        } else {
          throw popupError;
        }
      }
    }
  }

  async logout() {
    await runInInjectionContext(this.injector, () => signOut(this.auth));
    this.router.navigate(['/auth']);
  }
}
