import { RouteReuseStrategy, ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';

export class AccountRouteReuseStrategy implements RouteReuseStrategy {
  private storedRoutes = new Map<string, DetachedRouteHandle>();

  shouldDetach(route: ActivatedRouteSnapshot): boolean {
    // Don't store account routes - check if route is under /conta
    // Also don't store landing routes to ensure proper navigation between them
    return !this.isAccountRoute(route) && !this.isLandingRoute(route);
  }

  store(route: ActivatedRouteSnapshot, handle: DetachedRouteHandle | null): void {
    // Don't store account or landing routes
    if (handle && !this.isAccountRoute(route) && !this.isLandingRoute(route)) {
      this.storedRoutes.set(this.getRouteKey(route), handle);
    }
  }

  shouldAttach(route: ActivatedRouteSnapshot): boolean {
    // Don't reuse account routes
    if (this.isAccountRoute(route)) {
      return false;
    }
    // Don't reuse landing routes to ensure proper component lifecycle
    if (this.isLandingRoute(route)) {
      return false;
    }
    return this.storedRoutes.has(this.getRouteKey(route));
  }

  retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    // Don't retrieve account or landing routes
    if (this.isAccountRoute(route) || this.isLandingRoute(route)) {
      return null;
    }
    return this.storedRoutes.get(this.getRouteKey(route)) || null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    const futurePath = future.routeConfig?.path || '';
    const currPath = curr.routeConfig?.path || '';
    
    // Get child route paths if they exist (for nested routes)
    const futureChildPath = future.firstChild?.routeConfig?.path || '';
    const currChildPath = curr.firstChild?.routeConfig?.path || '';
    
    // For account routes, check if they're child routes (definicoes, pedidos, etc.)
    // Child routes should NOT be reused when navigating between different ones
    if (this.isAccountRoute(future) && this.isAccountRoute(curr)) {
      // Account sub-route paths (definicoes, pedidos, dashboard, etc.)
      const accountSubRoutes = ['dashboard', 'pedidos', 'designs', 'pagamentos', 'definicoes'];
      
      // Check if the current route or its child is an account sub-route
      const futureIsSubRoute = accountSubRoutes.includes(futurePath) || accountSubRoutes.includes(futureChildPath);
      const currIsSubRoute = accountSubRoutes.includes(currPath) || accountSubRoutes.includes(currChildPath);
      
      // If both are account sub-routes (either directly or as children), compare paths
      if (futureIsSubRoute && currIsSubRoute) {
        // Compare the actual sub-route paths (use child path if parent is empty)
        const futureSubPath = futurePath || futureChildPath;
        const currSubPath = currPath || currChildPath;
        const shouldReuse = futureSubPath === currSubPath;
        
        console.log('[AccountRouteReuseStrategy] Account sub-route check:', {
          futurePath,
          currPath,
          futureChildPath,
          currChildPath,
          futureSubPath,
          currSubPath,
          shouldReuse
        });
        
        // Only reuse if paths are identical - this ensures proper component switching
        return shouldReuse;
      }
      
      // For parent account routes (empty path AccountComponent wrapper), allow reuse
      // This allows the AccountComponent to stay mounted while child routes change
      // BUT only if the child routes are the same
      if (futurePath === '' && currPath === '') {
        // If both have children, check if children are the same
        if (futureChildPath && currChildPath) {
          const childrenMatch = futureChildPath === currChildPath;
          console.log('[AccountRouteReuseStrategy] Account parent with children:', {
            futureChildPath,
            currChildPath,
            childrenMatch
          });
          return childrenMatch;
        }
        // If no children or children match, reuse the parent
        console.log('[AccountRouteReuseStrategy] Account parent route - reusing');
        return true;
      }
      
      // For other account route levels (like 'conta' itself), use default behavior
      const defaultReuse = future.routeConfig === curr.routeConfig;
      console.log('[AccountRouteReuseStrategy] Other account route level:', {
        futurePath,
        currPath,
        defaultReuse
      });
      return defaultReuse;
    }
    
    // If only one is an account route, don't reuse
    if (this.isAccountRoute(future) || this.isAccountRoute(curr)) {
      console.log('[AccountRouteReuseStrategy] Only one is account route - not reusing');
      return false;
    }
    
    // For landing routes (home, produtos, etc.), don't reuse when navigating between different routes
    // This ensures proper component lifecycle when navigating between home and produtos
    if (this.isLandingRoute(future) || this.isLandingRoute(curr)) {
      // Only reuse if paths are the same
      return futurePath === currPath && future.routeConfig === curr.routeConfig;
    }
    // For other routes, use default behavior
    return future.routeConfig === curr.routeConfig;
  }

  private isAccountRoute(route: ActivatedRouteSnapshot): boolean {
    // Check if route is under /conta by traversing up the route tree
    let current: ActivatedRouteSnapshot | null = route;
    while (current) {
      if (current.routeConfig?.path === 'conta') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private isLandingRoute(route: ActivatedRouteSnapshot): boolean {
    // Check if route is a landing route (home, produtos, products, checkout)
    // by checking the route path
    const path = route.routeConfig?.path || '';
    const landingPaths = ['', 'produtos', 'products', 'checkout', 'landing'];
    
    // Check current route
    if (landingPaths.includes(path)) {
      return true;
    }
    
    // Also check parent routes to see if we're under a landing route
    let current: ActivatedRouteSnapshot | null = route.parent;
    while (current) {
      const parentPath = current.routeConfig?.path || '';
      if (landingPaths.includes(parentPath) || parentPath === '') {
        return true;
      }
      current = current.parent;
    }
    return false;
  }

  private getRouteKey(route: ActivatedRouteSnapshot): string {
    return route.routeConfig?.path || '';
  }
}

