import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { of, switchMap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { resolveRoleDashboardPath } from '../utils/role-dashboard.util';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const userService = inject(UserService);

  return authService.check().pipe(
    switchMap(authenticated => {
      if (authenticated) {
        return userService.getCurrentUser().pipe(
          switchMap((user) => {
            const target = resolveRoleDashboardPath(user?.current_tenant_context?.role);
            router.navigate([target]);
            return of(false);
          }),
          catchError(() => {
            router.navigate([resolveRoleDashboardPath(undefined)]);
            return of(false);
          }),
        );
      }

      return of(true);
    })
  );
};
