import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'coach',
    loadComponent: () =>
      import('./pages/coach/coach.component').then((m) => m.CoachComponent),
  },
  { path: '**', redirectTo: '' },
];
