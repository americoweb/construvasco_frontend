import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { combineLatest, of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return combineLatest([
    authService.check(),
    authService.mustChangePassword$
  ]).pipe(
    switchMap(([authenticated, mustChangePassword]) => {
      if (!authenticated) {
        // Store the attempted URL for redirecting after login
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        router.navigate(['/auth/sign-in'], { 
          queryParams: { redirectUrl } 
        });
        return of(false);
      }

      // Check if user must change password
      if (mustChangePassword && !state.url.includes('change-password')) {
        router.navigate(['/auth/change-password']);
        return of(false);
      }

      return of(true);
    })
  );
};
