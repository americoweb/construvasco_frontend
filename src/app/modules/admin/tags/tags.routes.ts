import { Routes } from '@angular/router';

export const tagsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./list/tags-list.component').then(m => m.TagsListComponent)
  },
  {
    path: 'create',
    loadComponent: () => import('./form/tag-form.component').then(m => m.TagFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./detail/tag-detail.component').then(m => m.TagDetailComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./form/tag-form.component').then(m => m.TagFormComponent)
  }
];

