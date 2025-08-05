import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'signup',
        loadComponent: () => import('./features/auth/signup.component').then(m => m.SignupComponent)
      }
    ]
  },
  {
    path: '',
    loadComponent: () => import('./shared/components/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'pets',
        loadComponent: () => import('./features/pets/pets.component').then(m => m.PetsComponent)
      },
      {
        path: 'pets/:id',
        loadComponent: () => import('./features/pets/pet-detail.component').then(m => m.PetDetailComponent)
      },
      {
        path: 'events/pet/:petId',
        loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent)
      },
      {
        path: 'events',
        loadComponent: () => import('./features/events/events.component').then(m => m.EventsComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
