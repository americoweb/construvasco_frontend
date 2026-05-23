import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { isStaffRole } from '../utils/role-dashboard.util';

export const customerGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  return authService.check().pipe(
    switchMap((authenticated) => {
      if (!authenticated) {
        router.navigate(['/auth/sign-in'], { queryParams: { redirectUrl: state.url } });
        return of(false);
      }

      const user = userService.user;
      if (user) {
        if (isStaffRole(user.current_tenant_context?.role)) {
          router.navigate(['/admin/dashboard']);
          return of(false);
        }
        return of(true);
      }

      return userService.getCurrentUser().pipe(
        map((loaded) => {
          if (isStaffRole(loaded?.current_tenant_context?.role)) {
            router.navigate(['/admin/dashboard']);
            return false;
          }
          return true;
        }),
        catchError(() => {
          router.navigate(['/auth/sign-in'], { queryParams: { redirectUrl: state.url } });
          return of(false);
        })
      );
    })
  );
};
