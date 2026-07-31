import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { filter, map, take } from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  // Skip the initial `undefined` emission Firebase sends before it resolves
  // the persisted session / redirect result. Filter to the first non-undefined value.
  return user(auth).pipe(
    filter(u => u !== undefined),
    take(1),
    map(u => u ? true : router.createUrlTree(['/auth']))
  );
};
