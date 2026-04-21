import { Route } from '@angular/router';

export const staffRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: 'list' },
  {
    path: 'list',
    loadComponent: () =>
      import('./list/staff-list.component').then(m => m.StaffListComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./form/staff-form.component').then(m => m.StaffFormComponent)
  },
  {
    path: ':id/edit',
    loadComponent: () =>
      import('./form/staff-form.component').then(m => m.StaffFormComponent)
  },
];
