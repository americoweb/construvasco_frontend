import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { combineLatest, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

const adminGuardDebug = (message: string, details?: unknown): void => {
  if (!environment.production && environment.features?.debugging) {
    // eslint-disable-next-line no-console -- intentional dev-only routing diagnostics
    console.log(`[AdminGuard] ${message}`, details ?? '');
  }
};

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  adminGuardDebug('activated', {
    routePath: route.routeConfig?.path,
    stateUrl: state.url,
  });

  return combineLatest([
    authService.check(),
    authService.mustChangePassword$
  ]).pipe(
    switchMap(([authenticated, mustChangePassword]) => {
      adminGuardDebug('auth', { authenticated, mustChangePassword, stateUrl: state.url });

      // First check authentication
      if (!authenticated) {
        console.warn('[AdminGuard] Access denied: not authenticated');
        // Store the attempted URL for redirecting after login
        const redirectUrl = state.url === '/sign-out' ? '/admin/dashboard' : state.url;
        router.navigate(['/auth/sign-in'], {
          queryParams: { redirectUrl }
        });
        return of(false);
      }

      // Check if user must change password
      if (mustChangePassword && !state.url.includes('change-password')) {
        console.warn('[AdminGuard] Access denied: must change password');
        router.navigate(['/auth/change-password']);
        return of(false);
      }

      // Check if user data is loaded, if not fetch it
      const currentUser = userService.user;
      adminGuardDebug('user snapshot', { userExists: !!currentUser });

      // If user data is not loaded, fetch it first
      if (!currentUser) {
        adminGuardDebug('fetching current user from API');
        return userService.getCurrentUser().pipe(
          map(user => {
            adminGuardDebug('user loaded', { userExists: !!user });
            return checkUserRole(user, router, state);
          }),
          catchError(error => {
            console.error('[AdminGuard] Failed to fetch user data', error);
            router.navigate(['/auth/sign-in'], {
              queryParams: { redirectUrl: state.url }
            });
            return of(false);
          })
        );
      }

      // User data is already loaded, check role
      return of(checkUserRole(currentUser, router, state));
    })
  );
};

// Helper function to check user role
function checkUserRole(user: any, router: Router, state: any): boolean {
  const userRole = user?.current_tenant_context?.role?.toLowerCase();
  const isCustomer = !userRole || userRole === 'customer';

  adminGuardDebug('role check', {
    userRole,
    userRoleOriginal: user?.current_tenant_context?.role,
    isCustomer,
  });

  if (isCustomer) {
    console.warn('[AdminGuard] Access denied: customer role cannot open admin', { userRole });
    router.navigate(['/conta/dashboard']);
    return false;
  }

  adminGuardDebug('access granted', { userRole, stateUrl: state.url });
  return true;
}

