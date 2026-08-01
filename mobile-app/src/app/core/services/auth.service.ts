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
import { LogService } from './log.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private injector = inject(Injector);
  private log = inject(LogService);

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
      try {
        this.log.info('GoogleAuth: starting native sign-in');
        const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
        await GoogleAuth.initialize();
        this.log.info('GoogleAuth: initialized');
        const googleUser = await GoogleAuth.signIn();
        this.log.info('GoogleAuth: got user', googleUser?.email);
        const credential = GoogleAuthProvider.credential(googleUser.authentication.idToken);
        const result = await signInWithCredential(this.auth, credential);
        this.log.info('Firebase signIn success', result.user?.email);
        if (result.user) this.router.navigate(['/dashboard']);
      } catch (e: any) {
        this.log.error('GoogleAuth native error:', e?.code, e?.message, JSON.stringify(e));
        throw e;
      }
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
