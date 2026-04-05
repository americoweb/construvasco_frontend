import { Routes } from '@angular/router';

export const designsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./list/designs-list.component').then(m => m.DesignsListComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/design-detail.component').then(m => m.DesignDetailComponent)
  }
];

