import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { combineLatest, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const userService = inject(UserService);
  const router = inject(Router);

  console.log('🔒 [AdminGuard] Guard activated', {
    routePath: route.routeConfig?.path,
    stateUrl: state.url,
    fullRoute: route
  });

  return combineLatest([
    authService.check(),
    authService.mustChangePassword$
  ]).pipe(
    switchMap(([authenticated, mustChangePassword]) => {
      console.log('🔒 [AdminGuard] Authentication check result', {
        authenticated,
        mustChangePassword,
        stateUrl: state.url
      });

      // First check authentication
      if (!authenticated) {
        console.warn('🔒 [AdminGuard] ❌ Access denied: User not authenticated');
        // Store the attempted URL for redirecting after login
        const redirectUrl = state.url === '/sign-out' ? '/' : state.url;
        console.log('🔒 [AdminGuard] Redirecting to sign-in with redirectUrl:', redirectUrl);
        router.navigate(['/auth/sign-in'], { 
          queryParams: { redirectUrl } 
        });
        return of(false);
      }

      // Check if user must change password
      if (mustChangePassword && !state.url.includes('change-password')) {
        console.warn('🔒 [AdminGuard] ❌ Access denied: User must change password');
        console.log('🔒 [AdminGuard] Redirecting to change-password');
        router.navigate(['/auth/change-password']);
        return of(false);
      }

      // Check if user data is loaded, if not fetch it
      const currentUser = userService.user;
      console.log('🔒 [AdminGuard] User data check (initial)', {
        userExists: !!currentUser,
        user: currentUser ? {
          id: currentUser.id,
          email: currentUser.email,
          current_tenant_context: currentUser.current_tenant_context
        } : null
      });

      // If user data is not loaded, fetch it first
      if (!currentUser) {
        console.log('🔒 [AdminGuard] User data not loaded, fetching from API...');
        return userService.getCurrentUser().pipe(
          map(user => {
            console.log('🔒 [AdminGuard] User data fetched', {
              userExists: !!user,
              user: user ? {
                id: user.id,
                email: user.email,
                current_tenant_context: user.current_tenant_context
              } : null
            });
            return checkUserRole(user, router, state);
          }),
          catchError(error => {
            console.error('🔒 [AdminGuard] Failed to fetch user data', error);
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

  console.log('🔒 [AdminGuard] Role check', {
    userRole,
    userRoleOriginal: user?.current_tenant_context?.role,
    isCustomer,
    currentTenantContext: user?.current_tenant_context
  });

  if (isCustomer) {
    console.warn('🔒 [AdminGuard] ❌ Access denied: User is a customer', {
      userRole,
      isCustomer
    });
    // Redirect customers to their account dashboard
    console.log('🔒 [AdminGuard] Redirecting customer to /conta/dashboard');
    router.navigate(['/conta/dashboard']);
    return false;
  }

  // Allow access for admin users (any role that's not customer)
  console.log('✅ [AdminGuard] Access granted', {
    userRole,
    stateUrl: state.url
  });
  return true;
}

