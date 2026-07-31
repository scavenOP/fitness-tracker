import { ApplicationConfig, APP_INITIALIZER, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Auth, provideAuth, getAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';
import { environment } from '../environments/environment';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions()),
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase()),
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const auth = inject(Auth);
        return () => new Promise<void>(resolve => {
          const unsub = auth.onAuthStateChanged(() => { unsub(); resolve(); });
        });
      },
      multi: true,
      deps: []
    }
  ]
};
