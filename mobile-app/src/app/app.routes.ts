import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tracker',
    loadComponent: () => import('./pages/tracker/tracker.component').then(m => m.TrackerComponent),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'activity/:id',
    loadComponent: () => import('./pages/activity-detail/activity-detail.component').then(m => m.ActivityDetailComponent),
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'dashboard' }
];
