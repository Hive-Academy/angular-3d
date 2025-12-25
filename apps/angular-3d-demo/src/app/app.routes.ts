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
      import('./pages/angular-3d-showcase/angular-3d-layout.component'),
    title: 'Angular-3D Showcase | Hive Academy',
    children: [
      {
        path: '',
        redirectTo: 'primitives',
        pathMatch: 'full',
      },
      {
        path: 'primitives',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/primitives-section.component'
          ),
        title: 'Primitives | Angular-3D',
      },
      {
        path: 'space',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/space-section.component'
          ),
        title: 'Space Elements | Angular-3D',
      },
      {
        path: 'text',
        loadComponent: () =>
          import('./pages/angular-3d-showcase/sections/text-section.component'),
        title: 'Text Rendering | Angular-3D',
      },
      {
        path: 'lighting',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/lighting-section.component'
          ),
        title: 'Lighting | Angular-3D',
      },
      {
        path: 'directives',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/directives-section.component'
          ),
        title: 'Directives | Angular-3D',
      },
      {
        path: 'postprocessing',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/postprocessing-section.component'
          ),
        title: 'Postprocessing | Angular-3D',
      },
      {
        path: 'controls',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/controls-section.component'
          ),
        title: 'Controls | Angular-3D',
      },
      {
        path: 'performance',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/performance-section.component'
          ),
        title: 'Performance | Angular-3D',
      },
      {
        path: 'hero-space',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/hero-space-scene.component'
          ).then((m) => m.HeroSpaceSceneComponent),
        title: 'Hero Space | Angular-3D',
      },
      {
        path: 'clouds',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/cloud-hero-scene.component'
          ).then((m) => m.CloudHeroSceneComponent),
        title: 'Clouds | Angular-3D',
      },
    ],
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
