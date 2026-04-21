import { Routes } from '@angular/router';

export const jobCardsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () =>
      import('./list/job-cards-list.component').then(m => m.JobCardsListComponent)
  },
  {
    path: 'kanban',
    loadComponent: () =>
      import('./kanban/job-cards-kanban.component').then(m => m.JobCardsKanbanComponent)
  },
  {
    path: 'create',
    loadComponent: () =>
      import('./create/job-card-create.component').then(m => m.JobCardCreateComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/job-card-detail.component').then(m => m.JobCardDetailComponent)
  }
];
