import { Routes } from '@angular/router';

export const ordersRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./list/orders-list.component').then(m => m.OrdersListComponent)
  },
  {
    path: 'kanban',
    loadComponent: () => import('./kanban/orders-kanban.component').then(m => m.OrdersKanbanComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/order-detail.component').then(m => m.OrderDetailComponent)
  }
];

