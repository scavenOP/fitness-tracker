import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { filter, map, take } from 'rxjs/operators';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    filter(u => u !== undefined),
    take(1),
    map(u => u ? router.createUrlTree(['/dashboard']) : true)
  );
};
