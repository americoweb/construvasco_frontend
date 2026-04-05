import { Routes } from '@angular/router';
import { productsRoutes } from './products/products.routes';

/**
 * Landing routes configuration
 * All public landing page routes (home, products, checkout, etc.)
 * 
 * Route order matters: more specific routes should come before less specific ones
 */
export const landingRoutes: Routes = [
    // Home route (empty path - must be first with pathMatch: 'full')
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () => {
            return import('./home/home.component').then(m => m.LandingHomeComponent);
        },
        data: {
            layout: 'empty'
        }
    },
    // Landing redirect
    {
        path: 'landing',
        pathMatch: 'full',
        redirectTo: ''
    },
    // Products list routes (produtos with category/subcategory)
    {
        path: 'produtos',
        loadComponent: () => {
            return import('./products/products.component').then(m => m.ProductsComponent);
        },
        data: {
            layout: 'empty'
        },
        children: productsRoutes
    },
    // Individual product detail route (more specific than produtos)
    {
        path: 'products/:slug',
        loadComponent: () => {
            return import('./product/product.component').then(m => m.ProductComponent);
        }
    },
    // Checkout route
    {
        path: 'checkout',
        loadComponent: () => {
            return import('./checkout/checkout.component').then(m => m.CheckoutPageComponent);
        }
    }
];

