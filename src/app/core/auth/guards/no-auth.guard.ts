import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.check().pipe(
    switchMap(authenticated => {
      if (authenticated) {
        // User is authenticated, redirect to account dashboard
        router.navigate(['/conta/dashboard']);
        return of(false);
      }

      return of(true);
    })
  );
};
