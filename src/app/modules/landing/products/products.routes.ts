import { Routes } from '@angular/router';

/**
 * Products routes configuration
 * Child routes for the produtos path
 * Order matters: more specific routes (with subcategory) come before less specific ones
 */
export const productsRoutes: Routes = [
  // Products list (empty path - produtos root)
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => {
      return import('./list/products-list.component').then(m => m.ProductsListComponent);
    }
  },
  // Products by category and subcategory (most specific)
  {
    path: ':category/:subcategory',
    loadComponent: () => {
      return import('./list/products-list.component').then(m => m.ProductsListComponent);
    }
  },
  // Products by category only (less specific - must come after subcategory route)
  {
    path: ':category',
    loadComponent: () => {
      return import('./list/products-list.component').then(m => m.ProductsListComponent);
    }
  }
];

