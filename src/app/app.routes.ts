import { Routes } from '@angular/router';

export const routes: Routes = [
  { 
    path: '', 
    loadComponent: () => import('./features/events/components/event-list/event-list.component')
      .then(m => m.EventListComponent) 
  },
  { 
    path: 'event/:id', 
    loadComponent: () => import('./features/events/components/event-detail/event-detail.component')
      .then(m => m.EventDetailComponent) 
  },
  { path: '**', redirectTo: '' }
];