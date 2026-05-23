import { Route } from '@angular/router';
import { authGuard } from './core/auth/guards/auth.guard';
import { customerGuard } from './core/auth/guards/customer.guard';
import { adminGuard } from './core/auth/guards/admin.guard';
import { noAuthGuard } from './core/auth/guards/no-auth.guard';
import { LayoutComponent } from './layout/layout.component';
import { landingRoutes } from './modules/landing/landing.routes';
import { environment } from '../environments/environment';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

/** Legacy public URLs → login when the shop/landing is disabled. */
const legacyPublicRedirects: Route[] = [
    { path: 'landing', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'servicos', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'como-funciona', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'portfolio', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'sobre', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'contacto', redirectTo: 'auth/sign-in', pathMatch: 'full' },
    { path: 'produtos', redirectTo: 'auth/sign-in', pathMatch: 'prefix' },
    { path: 'products', redirectTo: 'auth/sign-in', pathMatch: 'prefix' },
    { path: 'checkout', redirectTo: 'auth/sign-in', pathMatch: 'full' },
];

const publicSiteRoutes: Route[] = environment.features.publicSiteEnabled
    ? [
          {
              path: 'public',
              component: LayoutComponent,
              data: { layout: 'empty' },
              children: landingRoutes,
          },
          { path: '', pathMatch: 'full', redirectTo: 'public' },
      ]
    : legacyPublicRedirects;

export const routes: Route[] = [
    // Interior-first entry (iHALTH-style): unauthenticated users hit adminGuard → sign-in
    { path: '', pathMatch: 'full', redirectTo: 'admin/dashboard' },
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'admin/dashboard' },

    ...publicSiteRoutes,

    // Auth routes
    {
        path: 'auth',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {
                path: 'change-password',
                canActivate: [authGuard],
                loadComponent: () => import('./modules/auth/change-password/change-password.component').then(m => m.AuthChangePasswordComponent)
            },
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
        canActivate: [authGuard, customerGuard],
        canActivateChild: [authGuard, customerGuard],
        data: {
            layout: 'empty'
        },
        children: [
            {
                path: '',
                loadComponent: () => import('./modules/account/account.component').then(m => m.AccountComponent),
                children: [
                    {path: '', pathMatch: 'full', redirectTo: 'dashboard'},
                    {
                        path: 'dashboard',
                        loadComponent: () =>
                            import('./modules/account/views/customer-dashboard/customer-dashboard.component').then(
                                (m) => m.CustomerDashboardComponent
                            ),
                    },
                    {
                        path: 'pedidos',
                        loadComponent: () =>
                            import('./modules/account/views/customer-requests/customer-requests.component').then(
                                (m) => m.CustomerRequestsComponent
                            ),
                    },
                    {
                        path: 'orcamentos/:id',
                        loadComponent: () =>
                            import('./modules/account/views/customer-quote/customer-quote.component').then(
                                (m) => m.CustomerQuoteComponent
                            ),
                    },
                    {path: 'designs', pathMatch: 'full', redirectTo: 'projectos'},
                    {
                        path: 'projectos',
                        loadComponent: () =>
                            import('./modules/account/views/customer-projects/customer-projects.component').then(
                                (m) => m.CustomerProjectsComponent
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
                path: 'pedidos',
                data: { title: 'Pedidos de projecto', description: 'Briefings e orçamentos' },
                loadComponent: () =>
                    import('./modules/admin/project-requests/project-requests-hub.component').then(
                        (m) => m.ProjectRequestsHubComponent
                    ),
                children: [
                    { path: '', pathMatch: 'full', redirectTo: 'lista' },
                    {
                        path: 'lista',
                        loadComponent: () =>
                            import('./modules/admin/project-requests/project-requests-list.component').then(
                                (m) => m.ProjectRequestsListComponent
                            ),
                    },
                    {
                        path: 'novo',
                        loadComponent: () =>
                            import('./modules/admin/project-requests/project-requests-page.component').then(
                                (m) => m.ProjectRequestsPageComponent
                            ),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./modules/admin/project-requests/project-request-detail.component').then(
                                (m) => m.ProjectRequestDetailComponent
                            ),
                    },
                ],
            },
            {
                path: 'projectos',
                data: { title: 'Projectos', description: 'Obras activas' },
                loadComponent: () =>
                    import('./modules/admin/projects/projects-shell.component').then((m) => m.ProjectsShellComponent),
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./modules/admin/projects/projects-list.component').then((m) => m.ProjectsListComponent),
                    },
                    {
                        path: ':id',
                        loadComponent: () =>
                            import('./modules/admin/projects/project-detail.component').then((m) => m.ProjectDetailComponent),
                    },
                ],
            },
            {
                path: 'clientes',
                data: { title: 'Clientes', description: 'Registo de clientes' },
                loadComponent: () =>
                    import('./modules/admin/clients/clients-hub.component').then((m) => m.ClientsHubComponent),
            },
            { path: 'orders', redirectTo: 'pedidos', pathMatch: 'full' },
            { path: 'orders/**', redirectTo: 'pedidos' },
            { path: 'job-cards', redirectTo: 'projectos', pathMatch: 'full' },
            { path: 'job-cards/**', redirectTo: 'projectos' },
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
        ]
    },

    { path: '**', redirectTo: 'admin/dashboard' },
];
