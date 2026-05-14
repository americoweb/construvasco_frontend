import { Routes } from '@angular/router';
import { productsRoutes } from './products/products.routes';

/**
 * Landing routes configuration
 * All public landing page routes (home, products, checkout, etc.)
 * 
 * Route order matters: more specific routes should come before less specific ones
 */
export const landingRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
            import('./home/home.component').then((m) => m.LandingHomeComponent),
        data: { layout: 'empty' }
    },
    {
        path: 'landing',
        pathMatch: 'full',
        redirectTo: ''
    },
    {
        path: 'servicos',
        pathMatch: 'full',
        redirectTo: 'produtos'
    },
    {
        path: 'como-funciona',
        pathMatch: 'full',
        redirectTo: ''
    },
    {
        path: 'portfolio',
        pathMatch: 'full',
        redirectTo: 'produtos'
    },
    {
        path: 'sobre',
        pathMatch: 'full',
        redirectTo: ''
    },
    {
        path: 'contacto',
        pathMatch: 'full',
        redirectTo: 'checkout'
    },
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
    {
        path: 'products/:slug',
        loadComponent: () => {
            return import('./product/product.component').then(m => m.ProductComponent);
        }
    },
    {
        path: 'checkout',
        loadComponent: () => {
            return import('./checkout/checkout.component').then(m => m.CheckoutPageComponent);
        }
    }
];

