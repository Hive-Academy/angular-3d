# Implementation Plan - TASK_2025_010 (with TASK_2025_012 Integration)

> **Unified Demo Application** for `@hive-academy/angular-3d` and `@hive-academy/angular-gsap`

**Architect**: software-architect  
**Complexity**: Complex  
**Developer Type**: Frontend Developer  
**Estimated Tasks**: 35-40 atomic tasks  
**Batch Strategy**: Route-based (Home → Angular-3D → Angular-GSAP)

---

## 📊 Codebase Investigation Summary

### Libraries Discovered

**@hive-academy/angular-3d** (`libs/angular-3d/src/index.ts:1-30`):

- **Primitives**: 27 components (Box, Sphere, Cylinder, Torus, Polyhedron, GltfModel, StarField, Nebula, ParticleSystem, Planet, SVGIcon, Text3D, SceneLighting, etc.)
- **Directives**: Float3dDirective, Rotate3dDirective
- **Controls**: OrbitControls
- **Loaders**: GLTF, Texture
- **Postprocessing**: EffectComposer, Bloom, SMAA
- **Services**: AnimationService
- **Canvas**: Scene3dComponent (render loop management)

**@hive-academy/angular-gsap** (from TASK_2025_009):

- **Directives**: ScrollAnimationDirective, HijackedScrollDirective, HijackedScrollItemDirective
- **Components**: HijackedScrollTimelineComponent

### Patterns Identified

**1. Standalone Component Pattern** (all library components):

```typescript
// Evidence: libs/angular-3d/src/lib/primitives/box.component.ts (example)
@Component({
  selector: 'app-box',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class BoxComponent implements AfterViewInit, OnDestroy {
  // Signal-based inputs
  readonly position = input<[number, number, number]>([0, 0, 0]);

  // DestroyRef cleanup
  constructor() {
    inject(DestroyRef).onDestroy(() => this.cleanup());
  }
}
```

**2. Library Import Pattern**:

```typescript
// Evidence: libs/angular-3d/src/index.ts:1-30
import {
  Scene3dComponent,
  BoxComponent,
  SphereComponent,
  GltfModelComponent,
  StarFieldComponent,
  // ... other primitives
  Float3dDirective,
  Rotate3dDirective,
  OrbitControlsComponent,
} from '@hive-academy/angular-3d';
```

**3. Route Component Pattern** (new for demo app):

```typescript
// Pattern to establish (no existing demo routes)
// Will follow Angular 20+ standalone routing
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home.component').then(m => m.HomeComponent)
  },
  {path 'angular-3d',
    loadComponent: () => import('./pages/angular-3d-showcase.component').then(m => m.Angular3dShowcaseComponent)
  }
];
```

**4. Scene Component Migration Pattern** (from temp/scene-graphs/):

- Source files use `angular-three` imports (to be replaced)
- Complex 3D scenes already structured as components
- Migration: Replace `ngt-*` tags with Angular component selectors

### Integration Points

**Existing Demo App** (`apps/angular-3d-demo`):

- **Main**: `src/main.ts` (Angular bootstrap)
- **App Root**: `src/app/app.ts` (root component)
- **Routes**: `src/app/app.routes.ts` (currently empty array)
- **Config**: `src/app/app.config.ts` (providers)
- **Assets**: `public/` folder (will need to add 3D models, textures, logos)

---

## 📐 Visual Design References

**Design Specifications**: `task-tracking/TASK_2025_010/visual-design-specification-final.md`  
**Asset Inventory**: `task-tracking/TASK_2025_010/design-assets-inventory.md`  
**Developer Handoff**: `task-tracking/TASK_2025_010/design-handoff.md`

### Architecture (From Visual Specs)

The ui-ux-designer specified **multi-page architecture**:

- **Home Page** (`/`): Dual hero (3D + GSAP teasers), library overview cards, feature comparison, CTA
- **/angular-3d**: Hero space scene, primitives showcase, GLTF gallery, value props 3D
- **/angular-gsap**: GSAP hero, scroll demos, timeline showcases (TASK_2025_012 components)

Reference: `visual-design-specification-final.md` (complete multi-route spec)

### Shared Components (From Design Handoff)

Per design-handoff.md, NO shared UI components specified—design uses library components directly and inline sections.

### 3D Scene Specifications (From Design Specs)

**Hero Space Scene** (`visual-design-specification-final.md:180-230`):

- Earth GLTF, star field (3 layers), nebula, tech logos, particle text, flying robots
- OrbitControls + Bloom effect
- Source: `temp/scene-graphs/hero-space-scene.component.ts` (migrate)

**CTA Polyhedrons** (`visual-design-specification-final.md:250-280`):

- 3 floating polyhedrons (icosahedron, octahedron, dodecahedron)
- Float3dDirective animations
- Source: `temp/scene-graphs/cta-scene-graph.component.ts` (migrate)

**Value Props 3D** (`visual-design-specification-final.md:300-330`):

- 11 rotating geometries (scroll-triggered)
- Source: `temp/scene-graphs/value-propositions-3d-scene.component.ts` (migrate)

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Multi-page SPA with lazy-loaded routes  
**Rationale**:

- Matches multi-page architecture from design specs
- Performance: Separate bundles for each showcase
- Equal library prominence (3D and GSAP)
- Clean separation of concerns

**Evidence**: Angular 20+ routing best practices, design-specification-final.md:50-100

### Component Hierarchy

```
apps/angular-3d-demo/src/app/
├── app.ts (root)
├── app.routes.ts (3 routes)
├── pages/
│   ├── home.component.ts
│   ├── angular-3d-showcase.component.ts
│   └── gsap-showcase.component.ts
├── sections/
│   ├── hero-3d-teaser.component.ts
│   ├── hero-gsap-teaser.component.ts
│   ├── library-overview.component.ts
│   ├── primitives-showcase.component.ts (NEW)
│   └── cta-section.component.ts
├── scenes/ (3D wrappers - migrated from temp/)
│   ├── hero-space-scene.component.ts
│   ├── cta-scene.component.ts
│   └── value-props-3d-scene.component.ts
├── components/ (GSAP - migrated from temp/)
│   ├── scrolling-code-timeline.component.ts
│   ├── chromadb-section.component.ts
│   ├── neo4j-section.component.ts
│   └── problem-solution-section.component.ts
└── shared/
    ├── navigation.component.ts
    └── footer.component.ts
```

---

## 📦 Proposed Changes

### Phase 1: Application Foundation

#### 1.1 Update Routing Configuration

##### [MODIFY] `apps/angular-3d-demo/src/app/app.routes.ts`

**Current State**: Empty routes array (`export const routes: Route[] = [];`)

**Changes**:

- Add 3 lazy-loaded routes (home, angular-3d, angular-gsap)
- Configure titles for each route
- Set up 404 redirect

**Pattern Reference**: Standard Angular 20 routing with lazy loading

```typescript
// apps/angular-3d-demo/src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home.component').then((m) => m.HomeComponent),
    title: 'Hive Academy - Angular 3D & GSAP Libraries',
  },
  {
    path: 'angular-3d',
    loadComponent: () => import('./pages/angular-3d-showcase.component').then((m) => m.Angular3dShowcaseComponent),
    title: 'Angular-3D Showcase | Hive Academy',
  },
  {
    path: 'angular-gsap',
    loadComponent: () => import('./pages/gsap-showcase.component').then((m) => m.GsapShowcaseComponent),
    title: 'Angular-GSAP Showcase | Hive Academy',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

**Quality Requirements**:

- ✅ Lazy loading for performance
- ✅ Route titles for SEO
- ✅ 404 redirect to home

---

#### 1.2 Update Root Component Template

##### [MODIFY] `apps/angular-3d-demo/src/app/app.html`

**Current State**: Basic router-outlet

**Changes**:

- Add navigation component
- Add footer component
- Keep router-outlet for route rendering

**Pattern**: Standard Angular app shell

```html
<!-- apps/angular-3d-demo/src/app/app.html -->
<app-navigation />
<main class="min-h-screen">
  <router-outlet />
</main>
<app-footer />
```

---

#### 1.3 Update Root Component Imports

##### [MODIFY] `apps/angular-3d-demo/src/app/app.ts`

**Pattern Reference**: Standalone component imports (libs/angular-3d components)

**Changes**:

- Import NavigationComponent, FooterComponent
- Add to component imports array

```typescript
// apps/angular-3d-demo/src/app/app.ts (partial)
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationComponent } from './shared/navigation.component';
import { FooterComponent } from './shared/footer.component';

@Component({
  templateUrl: './app.html',
  standalone: true,
  imports: [RouterOutlet, NavigationComponent, FooterComponent],
})
export class AppComponent {}
```

---

### Phase 2: Shared Components

#### 2.1 Create Navigation Component

##### [CREATE] `apps/angular-3d-demo/src/app/shared/navigation.component.ts`

**Purpose**: Fixed header navigation with route links

**Pattern Reference**: `design-handoff.md:60-120` (navigation spec)

**Component Spec**:

- Standalone component
- Fixed positioning (`fixed top-0 z-50`)
- Dark background with backdrop blur
- Nav links with RouterLinkActive
- CTA button

```typescript
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="fixed top-0 left-0 right-0 z-50 bg-background-dark/80 backdrop-blur-md border-b border-neon-green/10">
      <div class="max-w-container mx-auto px-4x py-3x flex items-center justify-between">
        <a routerLink="/" class="text-headline-md font-bold text-neon-green hover:animate-glow"> Hive Academy </a>

        <div class="hidden md:flex items-center gap-6x">
          <a routerLink="/" routerLinkActive="text-neon-green" [routerLinkActiveOptions]="{ exact: true }" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> Home </a>
          <a routerLink="/angular-3d" routerLinkActive="text-neon-green" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> Angular-3D </a>
          <a routerLink="/angular-gsap" routerLinkActive="text-neon-green" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> Angular-GSAP </a>
          <a href="https://github.com/hive-academy" target="_blank" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> GitHub </a>

          <button class="px-6x py-2x bg-primary-500 text-white rounded-button font-semibold hover:scale-105 hover:shadow-button-hover transition-all duration-250">Get Started</button>
        </div>
      </div>
    </nav>
  `,
})
export class NavigationComponent {}
```

**Quality Requirements**:

- ✅ RouterLinkActive for current route highlighting
- ✅ Tailwind classes from design tokens
- ✅ Responsive (mobile menu future enhancement)
- ✅ Accessibility (keyboard navigation, focus states)

---

#### 2.2 Create Footer Component

##### [CREATE] `apps/angular-3d-demo/src/app/shared/footer.component.ts`

**Purpose**: Footer with library links, resources, community

**Pattern Reference**: `visual-design-specification-final.md:400-430`

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="bg-background-dark text-white py-12x mt-20x">
      <div class="max-w-container mx-auto px-4x">
        <div class="grid md:grid-cols-4 gap-8x mb-8x">
          <!-- Column 1: Branding -->
          <div>
            <h3 class="text-headline-sm font-bold text-neon-green mb-3x">Hive Academy</h3>
            <p class="text-body-md text-text-secondary">Angular libraries for 3D and animation experiences</p>
          </div>

          <!-- Column 2: Libraries -->
          <div>
            <h4 class="text-body-lg font-semibold mb-3x">Libraries</h4>
            <ul class="space-y-2x">
              <li><a routerLink="/angular-3d" class="text-body-md text-text-secondary hover:text-neon-green">Angular-3D</a></li>
              <li><a routerLink="/angular-gsap" class="text-body-md text-text-secondary hover:text-neon-green">Angular-GSAP</a></li>
              <li><a href="https://github.com/hive-academy" class="text-body-md text-text-secondary hover:text-neon-green">GitHub</a></li>
            </ul>
          </div>

          <!-- Column 3: Resources -->
          <div>
            <h4 class="text-body-lg font-semibold mb-3x">Resources</h4>
            <ul class="space-y-2x">
              <li><span class="text-body-md text-text-secondary">Documentation (Coming Soon)</span></li>
              <li><span class="text-body-md text-text-secondary">Examples (This Demo)</span></li>
            </ul>
          </div>

          <!-- Column 4: Community -->
          <div>
            <h4 class="text-body-lg font-semibold mb-3x">Community</h4>
            <ul class="space-y-2x">
              <li><a href="https://github.com/hive-academy/angular-3d/issues" class="text-body-md text-text-secondary hover:text-neon-green">GitHub Issues</a></li>
            </ul>
          </div>
        </div>

        <!-- Bottom Bar -->
        <div class="border-t border-gray-700 pt-6x flex justify-between items-center">
          <p class="text-body-sm text-text-secondary">© 2025 Hive Academy. MIT License.</p>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {}
```

---

### Phase 3: Home Page Implementation

#### 3.1 Create Home Page Component

##### [CREATE] `apps/angular-3d-demo/src/app/pages/home.component.ts`

**Purpose**: Landing page with dual hero, library cards, CTA

**Pattern Reference**: `visual-design-specification-final.md:100-180`

```typescript
import { Component } from '@angular/core';
import { Hero3dTeaserComponent } from '../sections/hero-3d-teaser.component';
import { HeroGsapTeaserComponent } from '../sections/hero-gsap-teaser.component';
import { LibraryOverviewComponent } from '../sections/library-overview.component';
import { CtaSectionComponent } from '../sections/cta-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [Hero3dTeaserComponent, HeroGsapTeaserComponent, LibraryOverviewComponent, CtaSectionComponent],
  template: `
    <!-- Dual Hero Section -->
    <section class="mt-[72px] min-h-screen grid lg:grid-cols-2 relative">
      <app-hero-3d-teaser />
      <app-hero-gsap-teaser />

      <!-- Center Overlay -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none px-4x">
        <div class="pointer-events-auto bg-white/90 backdrop-blur-md p-8x md:p-12x rounded-card shadow-card max-w-content text-center">
          <h1 class="text-display-md md:text-display-xl font-bold mb-4x">Two Libraries, <span class="text-neon-green">One Ecosystem</span></h1>
          <p class="text-headline-sm md:text-headline-md text-text-secondary mb-8x">Build stunning 3D experiences and scroll animations with Angular</p>
          <div class="flex gap-4x justify-center flex-wrap">
            <a routerLink="/angular-3d" class="px-8x py-4x bg-primary-500 text-white rounded-button font-semibold hover:scale-105 transition-transform"> Explore 3D → </a>
            <a routerLink="/angular-gsap" class="px-8x py-4x border-2 border-neon-green text-neon-green rounded-button font-semibold hover:bg-neon-green hover:text-background-dark transition-all"> See Animations → </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Library Overview -->
    <app-library-overview />

    <!-- CTA Section -->
    <app-cta-section />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class HomeComponent {}
```

**Note about margin-top**: Added `mt-[72px]` to account for fixed navigation (approximate height, adjust after testing).

---

#### 3.2 Create Hero 3D Teaser Component

##### [CREATE] `apps/angular-3d-demo/src/app/sections/hero-3d-teaser.component.ts`

**Purpose**: Left half of home hero - simplified 3D teaser

**Pattern**: Uses @hive-academy/angular-3d library components

**Spec**: Rotating polyhedron with particles (simpler than full hero space scene)

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, PolyhedronComponent, AmbientLightComponent, DirectionalLightComponent, StarFieldComponent, Rotate3dDirective } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-3d-teaser',
  standalone: true,
  imports: [Scene3dComponent, PolyhedronComponent, AmbientLightComponent, DirectionalLightComponent, StarFieldComponent, Rotate3dDirective],
  template: `
    <div class="relative h-screen bg-background-dark overflow-hidden">
      <scene-3d [cameraPosition]="[0, 0, 5]" [cameraFov]="75">
        <!-- Lights -->
        <app-ambient-light [intensity]="0.5" />
        <app-directional-light [position]="[5, 5, 5]" [intensity]="0.8" [color]="'#A1FF4F'" />

        <!-- Star Field Background -->
        <app-star-field [count]="1000" [colors]="['#FFFFFF', '#A1FF4F']" />

        <!-- Rotating Icosahedron -->
        <app-polyhedron [type]="'icosahedron'" [position]="[0, 0, 0]" [color]="'#6366F1'" [wireframe]="true" rotate3d [rotationSpeed]="0.01" [rotationAxis]="'y'" />
      </scene-3d>
    </div>
  `,
})
export class Hero3dTeaserComponent {}
```

**Evidence**: Library imports from `libs/angular-3d/src/index.ts:1-30`

---

#### 3.3 Create Hero GSAP Teaser Component

##### [CREATE] `apps/angular-3d-demo/src/app/sections/hero-gsap-teaser.component.ts`

**Purpose**: Right half of home hero - GSAP animation preview

**Pattern**: Uses @hive-academy/angular-gsap directives

**Note**: ScrollAnimationDirective requires @hive-academy/angular-gsap import

```typescript
import { Component } from '@angular/core';
// NOTE: This will error until TASK_2025_012 completes migration
// For now, create component without directive, add later
// import { ScrollAnimation Directive } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-hero-gsap-teaser',
  standalone: true,
  imports: [
    // ScrollAnimationDirective // Add when available
  ],
  template: `
    <div class="h-screen flex flex-col items-center justify-center p-8x bg-gradient-to-br from-white to-primary-50">
      <!-- Placeholder for GSAP animations -->
      <!-- TODO: Add scrollAnimation directive when TASK_2025_012 completes -->

      <h2 class="text-display-md font-bold text-primary-500 mb-4x">Scroll Animations</h2>

      <p class="text-headline-md text-text-secondary mb-8x">Build with GSAP</p>

      <div class="bg-background-dark p-4x rounded-lg border border-primary-500/30">
        <code class="text-neon-green font-mono text-body-sm"> &lt;div scrollAnimation&gt;...&lt;/div&gt; </code>
      </div>

      <div class="mt-12x animate-bounce">
        <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  `,
})
export class HeroGsapTeaserComponent {}
```

**Dependency Note**: GSAP directive integration deferred to TASK_2025_012 completion.

---

#### 3.4 Create Library Overview Component

##### [CREATE] `apps/angular-3d-demo/src/app/sections/library-overview.component.ts`

**Purpose**: Side-by-side library cards

**Pattern Reference**: `design-handoff.md:180-260`

```typescript
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-library-overview',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="bg-background-light py-16x">
      <div class="max-w-container mx-auto px-4x">
        <!-- Section Header -->
        <h2 class="text-display-lg text-center mb-12x font-bold">Two Libraries, <span class="text-primary-500">Infinite Possibilities</span></h2>

        <!-- Cards Grid -->
        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Angular-3D Card -->
          <div class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300">
            <div class="w-16x h-16x mb-4x bg-primary-50 rounded-lg flex items-center justify-center">
              <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"></path>
              </svg>
            </div>

            <h3 class="text-headline-lg font-bold text-primary-500 mb-3x">&#64;hive-academy/angular-3d</h3>

            <p class="text-body-lg text-text-secondary mb-4x">Pure Angular wrapper for Three.js. Build 3D scenes with components, not imperative code.</p>

            <!-- Features List -->
            <div class="grid grid-cols-2 gap-2x mb-4x">
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">27+ Primitives</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">GLTF Loading</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">Post-processing</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">OrbitControls</span>
              </div>
            </div>

            <a routerLink="/angular-3d" class="text-primary-500 hover:text-neon-green font-semibold inline-flex items-center gap-1x transition-colors duration-250">
              Explore Components
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          <!-- Angular-GSAP Card -->
          <div class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300">
            <div class="w-16x h-16x mb-4x bg-primary-50 rounded-lg flex items-center justify-center">
              <svg class="w-10 h-10 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>

            <h3 class="text-headline-lg font-bold text-primary-500 mb-3x">&#64;hive-academy/angular-gsap</h3>

            <p class="text-body-lg text-text-secondary mb-4x">Signal-based GSAP directives for scroll-driven animations and timeline orchestration.</p>

            <!-- Features List -->
            <div class="grid grid-cols-2 gap-2x mb-4x">
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">ScrollTrigger</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">Hijacked Scroll</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">Timelines</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg class="w-5 h-5 text-success" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                </svg>
                <span class="text-body-md">SSR Compatible</span>
              </div>
            </div>

            <a routerLink="/angular-gsap" class="text-primary-500 hover:text-neon-green font-semibold inline-flex items-center gap-1x transition-colors duration-250">
              View Animations
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LibraryOverviewComponent {}
```

---

#### 3.5 Create CTA Section Component

##### [CREATE] `apps/angular-3d-demo/src/app/sections/cta-section.component.ts`

**Purpose**: Call-to-action with 3D background

**Pattern**: Uses CTA 3D scene (migrated later)

```typescript
import { Component } from '@angular/core';
// import { CtaSceneComponent } from '../scenes/cta-scene.component'; // Created in Phase 4

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [
    // CtaSceneComponent // Add in Phase 4
  ],
  template: `
    <section class="relative w-full py-20x px-4x bg-background-dark overflow-hidden">
      <!-- 3D Background (add in Phase 4) -->
      <!-- <app-cta-scene class="absolute inset-0 opacity-40" /> -->

      <!-- Content -->
      <div class="relative z-10 max-w-content mx-auto text-center">
        <h2 class="text-display-lg font-bold text-white mb-4x">Ready to Build?</h2>

        <p class="text-headline-md text-text-secondary mb-8x">Install both libraries and start creating stunning Angular applications today</p>

        <!-- CTA Buttons -->
        <div class="flex flex-wrap gap-4x justify-center mb-8x">
          <button class="px-10x py-4x bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 hover:shadow-neon-green transition-all duration-250">Get Started</button>
          <button class="px-10x py-4x border-2 border-white text-white rounded-button font-semibold hover:bg-white hover:text-background-dark transition-all duration-250">View Documentation</button>
        </div>

        <!-- Install Command -->
        <div class="inline-block bg-background-dark/80 border border-neon-green/30 px-6x py-3x rounded-lg relative group">
          <code class="text-neon-green font-mono text-body-md"> npm install &#64;hive-academy/angular-3d &#64;hive-academy/angular-gsap </code>
        </div>
      </div>
    </section>
  `,
})
export class CtaSectionComponent {}
```

---

### Phase 4: Angular-3D Showcase Page

(Due to message length, summarizing remaining phases)

#### Components to Create:

- `angular-3d-showcase.component.ts` (page)
- `hero-space-scene.component.ts` (migrate from temp/)
- `primitives-showcase.component.ts` (grid of primitives)
- `value-props-3d-scene.component.ts` (migrate from temp/)
- `cta-scene.component.ts` (migrate from temp/)

**Migration Pattern**: Replace `angular-three` imports with `@hive-academy/angular-3d`, convert `ngt-*` tags to Angular component selectors.

---

### Phase 5: Angular-GSAP Showcase Page (TASK_2025_012)

#### Components to Migrate from temp/:

- `gsap-showcase.component.ts` (page)
- `scrolling-code-timeline.component.ts`
- `chromadb-section.component.ts`
- `neo4j-section.component.ts`
- `problem-solution-section.component.ts`

**Migration Pattern**: Update imports to `@hive-academy/angular-gsap`, verify directive usage.

---

### Phase 6: Asset Migration

#### [COPY] Assets from temp/ to apps/angular-3d-demo/public/

**Assets needed**:

- `temp/assets/3d/` → `apps/angular-3d-demo/public/3d/`
- `temp/assets/images/logos/` → `apps/angular-3d-demo/public/images/logos/`
- `temp/assets/moon.jpg` → `apps/angular-3d-demo/public/moon.jpg`

---

## 🧪 Verification Plan

### Automated Tests

**Unit Tests**:

```bash
# Run demo app tests
npx nx test angular-3d-demo

# Expected:New tests for page components (home, angular-3d-showcase, gsap-showcase)
# Pattern: Component renders without errors (smoke tests)
```

**Build Verification**:

```bash
# Development build
npx nx serve angular-3d-demo

# Production build
npx nx build angular-3d-demo --configuration=production

# Expected: Build succeeds, bundle <500KB gzipped (excluding Three.js)
```

**Lint Check**:

```bash
npx nx lint angular-3d-demo

# Expected: Zero errors/warnings
```

### Manual Verification

**Visual Inspection** (requires browser):

1. Navigate to `http://localhost:4200`
2. Verify home page renders with dual hero
3. Click "Explore 3D" → verify /angular-3d route loads
4. Click "See Animations" → verify /angular-gsap route loads
5. Navigate between routes 10x → verify no memory leaks (Chrome DevTools Performance tab)

**Responsive Testing**:

1. Open DevTools responsive mode
2. Test mobile (375px), tablet (768px), desktop (1920px)
3. Verify layouts adapt correctly

**Accessibility Testing**:

1. Tab through navigation → verify focus visible
2. Check color contrast (browser extension)
3. Test with screen reader (if available)

---

## 👨‍💼 Team-Leader Handoff

**Developer Type**: Frontend Developer  
**Complexity**: Complex  
**Estimated Tasks**: 35-40 atomic tasks

**Batch Strategy**: Route-based implementation

- **Batch 1**: Foundation (app shell, routing, navigation, footer) - 5 tasks
- **Batch 2**: Home Page (page + 4 section components) - 5 tasks
- **Batch 3**: Angular-3D Page (page + 3D scenes) - 10-12 tasks
- **Batch 4**: Angular-GSAP Page (page + migrated components) - 10-12 tasks (TASK_2025_012)
- **Batch 5**: Asset Migration + Polish - 5 tasks

**Key Integration Points**:

- All library imports must use `@hive-academy/angular-3d` and `@hive-academy/angular-gsap`
- Scene components migrate from `temp/scene-graphs/` with import updates
- GSAP components migrate from `temp/` with import updates
- Asset paths updated to `/public/` folder convention

**Quality Requirements**:

- ✅ All components use `ChangeDetectionStrategy.OnPush`
- ✅ Signal-based inputs throughout
- ✅ DestroyRef cleanup for 3D resources
- ✅ Tailwind classes from design tokens
- ✅ Accessibility compliance (WCAG AA)
- ✅ Performance targets (60fps desktop, 30fps mobile)

---

## 📊 Task Decomposition Preview

Example atomic tasks (Team-Leader will create full list):

**Foundation:**

1. Update `app.routes.ts` with 3 lazy-loaded routes
2. Create `NavigationComponent` with RouterLink
3. Create `FooterComponent` with library links
4. Update `app.html` with navigation + footer

**Home Page:** 5. Create `HomeComponent` page structure 6. Create `Hero3dTeaserComponent` (simple polyhedron scene) 7. Create `HeroGsapTeaserComponent` (placeholder for GSAP) 8. Create `LibraryOverviewComponent` (2 cards) 9. Create `CtaSectionComponent` (CTA template)

**Angular-3D Page:** 10. Create `Angular3dShowcaseComponent` page 11. Migrate `hero-space-scene.component.ts` from temp (update imports) 12. Create `PrimitivesShowcaseComponent` (grid of boxes, spheres, etc.) 13. Migrate `value-props-3d-scene.component.ts` from temp 14. Migrate `cta-scene.component.ts` from temp

_... (Team-Leader will decompose remainder into ~40 total tasks)_

---

**Ready for Phase 5: Task Decomposition**

Command: `/phase-5-decomposition TASK_2025_010`
