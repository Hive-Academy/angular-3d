import { Routes } from '@angular/router';

export const appRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
    title: 'Hive Academy - Angular 3D & GSAP Libraries',
  },
  {
    path: 'angular-3d',
    loadComponent: () =>
      import('./pages/angular-3d-showcase/angular-3d-showcase.component').then(
        (m) => m.Angular3dShowcaseComponent
      ),
    title: 'Angular-3D Showcase | Hive Academy',
  },
  {
    path: 'angular-gsap',
    loadComponent: () =>
      import('./pages/gsap-showcase/gsap-showcase.component').then(
        (m) => m.GsapShowcaseComponent
      ),
    title: 'Angular-GSAP Showcase | Hive Academy',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
