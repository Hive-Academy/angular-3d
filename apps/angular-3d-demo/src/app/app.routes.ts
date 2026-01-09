import { Routes } from '@angular/router';
import { sceneLoadingGuard } from '@hive-academy/angular-3d';

export const appRoutes: Routes = [
  {
    path: '',
    // Optional: Demonstrate sceneLoadingGuard for route-level loading coordination
    // This guard waits for the scene to be ready before allowing navigation
    // In this demo, it may not provide significant benefit without a resolver,
    // but it demonstrates the pattern for library consumers
    canActivate: [sceneLoadingGuard({ timeout: 10000 })],
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
        path: 'particles',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/particles-section.component'
          ),
        title: 'Particle Systems | Angular-3D',
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
        path: 'postprocessing-advanced',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/postprocessing-advanced-section.component'
          ),
        title: 'Postprocessing Advanced | Angular-3D',
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
        path: 'loading-entrance',
        loadComponent: () =>
          import(
            './pages/home/sections/loading-entrance-demo-section.component'
          ).then((m) => m.LoadingEntranceDemoSectionComponent),
        title: 'Loading & Entrance | Angular-3D',
      },
      {
        path: 'space-station',
        loadComponent: () =>
          import(
            './pages/home/sections/space-station-demo-section.component'
          ).then((m) => m.SpaceStationDemoSectionComponent),
        title: 'Space Station | Angular-3D',
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
      {
        path: 'metaball',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/metaball-hero-scene.component'
          ).then((m) => m.MetaballHeroSceneComponent),
        title: 'Metaball Hero | Angular-3D',
      },

      {
        path: 'crystal-grid',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/crystal-grid-hero-scene.component'
          ).then((m) => m.CrystalGridHeroSceneComponent),
        title: 'Crystal Grid | Angular-3D',
      },
      {
        path: 'floating-geometry',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/floating-geometry-hero-scene.component'
          ).then((m) => m.FloatingGeometryHeroSceneComponent),
        title: 'Floating Geometry | Angular-3D',
      },
      {
        path: 'particle-storm',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/particle-storm-hero-scene.component'
          ).then((m) => m.ParticleStormHeroSceneComponent),
        title: 'Particle Storm | Angular-3D',
      },
      {
        path: 'bubble-dream',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/bubble-dream-hero-scene.component'
          ).then((m) => m.BubbleDreamHeroSceneComponent),
        title: 'Bubble Dream | Angular-3D',
      },
      {
        path: 'textures',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/tsl-textures-section.component'
          ),
        title: 'TSL Textures | Angular-3D',
      },
      {
        path: 'backgrounds',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/sections/backgrounds-section.component'
          ).then((m) => m.BackgroundsSectionComponent),
        title: 'Background Shaders | Angular-3D',
      },
      {
        path: 'marble-hero',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/marble-hero-scene.component'
          ).then((m) => m.MarbleHeroSceneComponent),
        title: 'Marble Hero | Angular-3D',
      },
      {
        path: 'hexagonal-hero',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/hexagonal-hero-demo.component'
          ).then((m) => m.HexagonalHeroDemoComponent),
        title: 'Hexagonal Hero | Angular-3D',
      },
      {
        path: 'hexagonal-features',
        loadComponent: () =>
          import(
            './pages/angular-3d-showcase/scenes/hexagonal-features-demo.component'
          ).then((m) => m.HexagonalFeaturesDemoComponent),
        title: 'Hexagonal Features | Angular-3D',
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
