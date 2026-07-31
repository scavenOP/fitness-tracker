import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signOut, user, updateProfile, signInWithRedirect, getRedirectResult,
  GoogleAuthProvider
} from '@angular/fire/auth';
import { Database, ref, get, push, set } from '@angular/fire/database';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private injector = inject(Injector);

  user$: Observable<any> = user(this.auth);

  get currentUser() { return this.auth.currentUser; }
  get uid() { return this.auth.currentUser?.uid; }

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

  /**
   * Uses redirect (not popup) to avoid COOP header issues on Cloudflare/strict origins.
   * Call checkRedirectResult() on app init to handle the return.
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    await runInInjectionContext(this.injector, () =>
      signInWithRedirect(this.auth, provider)
    );
  }

  /** Call once on app startup — handles the redirect result after Google login */
  async checkRedirectResult() {
    try {
      const result = await runInInjectionContext(this.injector, () =>
        getRedirectResult(this.auth)
      );
      if (result?.user) {
        this.router.navigate(['/dashboard']);
      }
    } catch (_) {}
  }

  async logout() {
    await runInInjectionContext(this.injector, () => signOut(this.auth));
    this.router.navigate(['/auth']);
  }

  /** Helper for services that call Firebase DB outside component context */
  dbGet(dbRef: any) {
    return runInInjectionContext(this.injector, () => get(dbRef));
  }

  dbPush(dbRef: any) {
    return runInInjectionContext(this.injector, () => push(dbRef));
  }
}
