import { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./list/categories-list.component').then(m => m.CategoriesListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./form/category-form.component').then(m => m.CategoryFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/category-detail.component').then(m => m.CategoryDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./form/category-form.component').then(m => m.CategoryFormComponent)
  }
];

