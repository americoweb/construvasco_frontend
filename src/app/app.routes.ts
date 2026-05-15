import { Route } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { adminGuard } from './core/auth/guards/admin.guard';
import { noAuthGuard } from './core/auth/guards/no-auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { landingRoutes } from './modules/landing/landing.routes';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const routes: Route[] = [

    // Redirect signed-in user to the account dashboard
    {path: 'signed-in-redirect', pathMatch : 'full', redirectTo: 'conta/dashboard'},

    // Landing routes (public, no auth required)
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: landingRoutes
    },

    // Auth routes
    {
        path: 'auth',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            // Password change route (requires authentication)
            {
                path: 'change-password',
                canActivate: [authGuard],
                loadComponent: () => import('./modules/auth/change-password/change-password.component').then(m => m.AuthChangePasswordComponent)
            },
            // Guest routes (accessible only when NOT authenticated)
            {
                path: 'sign-in',
                canActivate: [noAuthGuard],
                loadComponent: () => import('./modules/auth/sign-in/sign-in.component').then(m => m.SignInComponent)
            },
            {
                path: 'sign-up',
                canActivate: [noAuthGuard],
                loadComponent: () => import('./modules/auth/sign-up/sign-up.component').then(m => m.AuthSignUpComponent)
            },
            {
                path: 'sign-up/:companyName',
                canActivate: [noAuthGuard],
                loadComponent: () => import('./modules/auth/sign-up/sign-up.component').then(m => m.AuthSignUpComponent)
            },
            {
                path: 'forgot-password',
                redirectTo: 'sign-in',
                pathMatch: 'full'
            },
            {
                path: 'reset-password',
                redirectTo: 'sign-in',
                pathMatch: 'full'
            },
            {
                path: 'redefinir-senha/:token',
                redirectTo: 'sign-in',
                pathMatch: 'full'
            },
        ]
    },

    // Account routes (require authentication)
    {
        path: 'conta',
        component: LayoutComponent,
        canActivate: [authGuard],
        canActivateChild: [authGuard],
        data: {
            layout: 'empty'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./modules/account/account.component').then(m => m.AccountComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
                    {path: 'dashboard', loadComponent: () => import('./modules/account/views/dashboard/dashboard.component').then(m => m.DashboardComponent)},
                    {path: 'pedidos', loadComponent: () => import('./modules/account/views/orders/orders.component').then(m => m.OrdersComponent)},
                    {path: 'designs', pathMatch: 'full', redirectTo: 'projectos'},
                    {
                        path: 'projectos',
                        loadComponent: () =>
                            import('./modules/account/views/saved-designs/saved-designs.component').then(
                                (m) => m.SavedDesignsComponent
                            ),
                    },
                    {path: 'pagamentos', loadComponent: () => import('./modules/account/views/payment-methods/payment-methods.component').then(m => m.PaymentMethodsComponent)},
                    {path: 'definicoes', loadComponent: () => import('./modules/account/views/settings/settings.component').then(m => m.SettingsComponent)},
                ]
            }
        ]
    },

    // Admin routes (require admin role)
    {
        path: 'admin',
        component: LayoutComponent,
        // Only canActivate: canActivateChild would run this guard once per nested segment (admin → orders → list).
        canActivate: [adminGuard],
        children: [
            { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
            {
                path: 'dashboard',
                data: {
                    title: 'Painel',
                    description: 'Visão geral da operação',
                },
                loadComponent: () =>
                    import('./modules/admin/dashboard/admin-dashboard.component').then(
                        (m) => m.AdminDashboardComponent
                    ),
            },
            {
                path: 'financas',
                data: {
                    title: 'Finanças',
                    description: 'Pagamentos e resumo financeiro (MVP)',
                },
                loadComponent: () =>
                    import('./modules/admin/finances/admin-finances.component').then((m) => m.AdminFinancesComponent),
            },
            {
                path: 'settings',
                data: {
                    title: 'Configurações',
                    description: 'Conta e preferências',
                },
                loadComponent: () => import('./modules/settings/settings.component').then(m => m.SettingsComponent)
            },
            {
                path: 'products',
                data: {
                    title: 'Products',
                    description: 'Manage products',
                },
                loadComponent: () => import('./modules/admin/products/products.component').then(m => m.ProductsComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'list'},
                    {path: 'list', loadComponent: () => import('./modules/admin/products/list/products-list.component').then(m => m.ProductsListComponent)},
                    {path: 'create', loadComponent: () => import('./modules/admin/products/form/product-form.component').then(m => m.ProductFormComponent)},
                    // More specific route must come before less specific one
                    {path: ':id/edit', loadComponent: () => import('./modules/admin/products/form/product-form.component').then(m => m.ProductFormComponent)},
                    {path: ':id', loadComponent: () => import('./modules/admin/products/detail/product-detail.component').then(m => m.ProductDetailComponent)},
                ]
            },
            {
                path: 'designs',
                data: {
                    title: 'Designs',
                    description: 'Manage designs',
                },
                loadComponent: () => import('./modules/admin/designs/designs.component').then(m => m.DesignsComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'list'},
                    {path: 'list', loadComponent: () => import('./modules/admin/designs/list/designs-list.component').then(m => m.DesignsListComponent)},
                    {path: ':id', loadComponent: () => import('./modules/admin/designs/detail/design-detail.component').then(m => m.DesignDetailComponent)},
                ]
            },
            {
                path: 'orders',
                data: {
                    title: 'Pedidos',
                    description: 'Pedidos de serviço e estados',
                },
                loadComponent: () => import('./modules/admin/orders/orders.component').then(m => m.OrdersComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'list'},
                    {path: 'list', loadComponent: () => import('./modules/admin/orders/list/orders-list.component').then(m => m.OrdersListComponent)},
                    {path: 'create', loadComponent: () => import('./modules/admin/orders/create/admin-order-create.component').then(m => m.AdminOrderCreateComponent)},
                    {path: 'kanban', loadComponent: () => import('./modules/admin/orders/kanban/orders-kanban.component').then(m => m.OrdersKanbanComponent)},
                    {path: ':id', loadComponent: () => import('./modules/admin/orders/detail/order-detail.component').then(m => m.OrderDetailComponent)},
                ]
            },
            {
                path: 'categories',
                data: {
                    title: 'Categories',
                    description: 'Manage categories',
                },
                loadComponent: () => import('./modules/admin/categories/categories.component').then(m => m.CategoriesComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'list'},
                    {path: 'list', loadComponent: () => import('./modules/admin/categories/list/categories-list.component').then(m => m.CategoriesListComponent)},
                    {path: 'create', loadComponent: () => import('./modules/admin/categories/form/category-form.component').then(m => m.CategoryFormComponent)},
                    // More specific route must come before less specific one
                    {path: ':id/edit', loadComponent: () => import('./modules/admin/categories/form/category-form.component').then(m => m.CategoryFormComponent)},
                    {path: ':id', loadComponent: () => import('./modules/admin/categories/detail/category-detail.component').then(m => m.CategoryDetailComponent)},
                ]
            },
            {
                path: 'staff',
                data: { title: 'Equipa', description: 'Membros e perfis da equipa' },
                loadComponent: () => import('./modules/admin/staff/staff.component').then(m => m.StaffComponent),
                children: [
                    { path: '', pathMatch: 'full', redirectTo: 'list' },
                    { path: 'list',     loadComponent: () => import('./modules/admin/staff/list/staff-list.component').then(m => m.StaffListComponent) },
                    { path: 'create',   loadComponent: () => import('./modules/admin/staff/form/staff-form.component').then(m => m.StaffFormComponent) },
                    { path: ':id/edit', loadComponent: () => import('./modules/admin/staff/form/staff-form.component').then(m => m.StaffFormComponent) },
                ]
            },
            {
                path: 'job-cards',
                data: {
                    title: 'Fichas de projecto',
                    description: 'Execução técnica, marcos e entregas por projecto',
                },
                loadComponent: () => import('./modules/admin/job-cards/job-cards.component').then(m => m.JobCardsComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'list'},
                    {path: 'list',   loadComponent: () => import('./modules/admin/job-cards/list/job-cards-list.component').then(m => m.JobCardsListComponent)},
                    {path: 'kanban', loadComponent: () => import('./modules/admin/job-cards/kanban/job-cards-kanban.component').then(m => m.JobCardsKanbanComponent)},
                    {path: 'create', loadComponent: () => import('./modules/admin/job-cards/create/job-card-create.component').then(m => m.JobCardCreateComponent)},
                    {path: ':id',    loadComponent: () => import('./modules/admin/job-cards/detail/job-card-detail.component').then(m => m.JobCardDetailComponent)},
                ]
            },
        ]
    },

    // 404 route - removed to prevent circular reference issues
    // Angular will handle unmatched routes naturally
    // If 404 handling is needed, implement it via a route guard or interceptor
];
