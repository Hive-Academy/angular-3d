# Final Design Specification - Multi-Page Architecture

> **Hive Academy Angular Libraries Showcase**  
> Unified design for `@hive-academy/angular-3d` and `@hive-academy/angular-gsap`

**Architecture**: Multi-page application with dedicated showcases  
**Tasks Integrated**: TASK_2025_010 (Angular-3D) + TASK_2025_012 (Angular-GSAP)

---

## Design System Reference

**Configuration**: [tailwind.config.js](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/tailwind.config.js)  
**Tokens**: [designs-systems.md](file:///d:/projects/angular-3d-workspace/docs/design-system/designs-systems.md)

### Core Design Tokens

**Colors**:

- Primary: `#6366F1`, Neon Green: `#A1FF4F`, Deep Black: `#0A0E11`
- Text: Primary `#23272F`, Secondary `#71717A`, Inverse `#FFFFFF`

**Typography**: Inter/Manrope, Display XL (64px) → Body MD (16px)

**Spacing**: 8px base unit (`1x` to `20x`)

**Accessibility**: WCAG AA compliant, keyboard navigation, reduced motion support

---

## Application Architecture

### Route Structure

```
/ (Home)
  ├── Hero (dual teaser)
  ├── Library Overview Cards
  ├── Feature Comparison
  └── CTA

/angular-3d
  ├── Hero Space Scene
  ├── Primitives Showcase
  ├── GLTF Gallery
  ├── Post-Processing Demo
  └── Value Props 3D

/angular-gsap
  ├── GSAP Hero
  ├── ScrollAnimation Demo
  ├── Hijacked Scroll Timeline
  ├── ChromaDB Section
  ├── Neo4j Section
  └── Problem-Solution Timeline

/docs (future)
```

### Navigation

**Fixed Header** (`bg-background-dark/80`, backdrop blur):

- Logo: "Hive Academy" (neon green)
- Links: Home, Angular-3D, Angular-GSAP, GitHub
- CTA: "Get Started" button

---

## HOME PAGE SPECIFICATION

### 1. Hero Section - Dual Showcase

**Layout**: Full viewport split (grid `lg:grid-cols-2`)

**Left Half** - Angular-3D Teaser:

- Background: `bg-background-dark`
- Simplified 3D scene (rotating polyhedrons with particles)
- Subtle OrbitControls
- Performance: 30fps minimum

**Right Half** - Angular-GSAP Teaser:

- Background: `bg-white` to `bg-primary-50` gradient
- Animated text elements (fadeInUp, slideIn)
- Mini code snippet with GSAP directive example
- Scroll indicator (bounce animation)

**Center Overlay** (absolute positioned):

```html
<div class="absolute inset-0 flex items-center justify-center">
  <div class="bg-white/90 backdrop-blur-md p-12x rounded-card shadow-card max-w-content text-center">
    <h1 class="text-display-xl font-bold mb-4x">Two Libraries, <span class="text-neon-green">One Ecosystem</span></h1>
    <p class="text-headline-md text-text-secondary mb-8x">Build stunning 3D experiences and scroll animations with Angular</p>
    <div class="flex gap-4x justify-center">
      <a href="/angular-3d" class="px-8x py-4x bg-primary-500 text-white rounded-button"> Explore 3D → </a>
      <a href="/angular-gsap" class="px-8x py-4x border-2 border-neon-green text-neon-green rounded-button"> See Animations → </a>
    </div>
  </div>
</div>
```

---

### 2. Library Overview - Equal Cards

**Layout**: `grid md:grid-cols-2 gap-8x`, max-width container

**Angular-3D Card**:

- Small inline 3D demo (rotating icosahedron, wireframe)
- Title: `@hive-academy/angular-3d`
- Features: 26+ Primitives, GLTF Loading, Post-processing, Controls
- CTA: "Explore Full Demo →" → `/angular-3d`

**Angular-GSAP Card**:

- Animated preview (text fading in on hover)
- Title: `@hive-academy/angular-gsap`
- Features: ScrollTrigger, Hijacked Scroll, Timelines, SSR Compatible
- CTA: "See Animations →" → `/angular-gsap`

**Styling**: White cards, `shadow-card`, hover lift effect

---

### 3. Feature Comparison Grid

**Layout**: `grid md:grid-cols-3 gap-6x`

**Column 1: Angular-3D**

- Scene Management
- Component-Based
- Three.js Integration
- WebGL Rendering

**Column 2: Angular-GSAP**

- Scroll Animations
- Signal-Based
- GSAP Integration
- DOM Animations

**Column 3: Shared**

- Standalone Components
- TypeScript
- Angular 20+
- MIT License

---

### 4. CTA Section

**Background**: `bg-background-dark` with floating CTA polyhedrons (low opacity)

**Content** (centered):

- Headline: "Ready to Build?"
- Dual install commands (tabs or side-by-side)
- Buttons: "Get Started", "View Docs"

---

## /ANGULAR-3D PAGE SPECIFICATION

### Section 1: Hero Space Scene (Full Interactive)

**Source**: `temp/scene-graphs/hero-space-scene.component.ts`

**Layout**: Full viewport height, 3D scene fills screen

**Elements**:

- Earth GLTF model (rotating)
- Star field (3 layers, 3000 stars on desktop)
- Nebula volumetric clouds
- Tech logos (NestJS, LangChain, Chroma, Neo4j) floating
- Particle text: "Hive Academy"
- Flying robots (SpaceFlight3d directive)
- OrbitControls enabled
- Bloom post-processing

**Overlay Text** (bottom left):

```html
<div class="absolute bottom-10x left-10x">
  <h1 class="text-display-lg text-white mb-2x">Angular-3D</h1>
  <p class="text-headline-md text-text-secondary">Component-based Three.js for Angular</p>
</div>
```

---

### Section 2: Primitives Showcase

**Layout**: Grid of primitive demos, each in a card

**Examples**:

- Box (rotating with colors)
- Sphere (metallic material)
- Cylinder & Torus (wireframe)
- Polyhedrons (icosahedron, dodecahedron, octahedron)
- Cone & Capsule

**Each Card**:

- 3D inline scene showing primitive
- Component name
- Code snippet showing usage

---

### Section 3: GLTF Model Gallery

**Models**:

- Earth planet
- Mini robot
- Robo head

**Layout**: Horizontal scroll carousel or grid

**Features**:

- Loading states
- Model stats (triangles, materials)
- OrbitControls per model

---

### Section 4: Post-Processing Effects

**Demos**:

- Bloom effect
- Depth of field (if available)
- Comparison: With/without effect (toggle)

---

### Section 5: Value Props 3D Scene

**Source**: `temp/scene-graphs/value-propositions-3d-scene.component.ts`

**Layout**: 11 rotating geometries, scroll-triggered animations

**Each geometry** represents a library feature:

- Component appears on scroll
- Rotates and scales into view
- Feature text overlay

---

## /ANGULAR-GSAP PAGE SPECIFICATION

### Section 1: GSAP Hero

**Background**: Gradient `from-primary-500 to-purple-600`

**Content** (centered, white text):

```html
<h1 class="text-display-xl font-bold animate-splitText">Angular GSAP Animations</h1>
<p class="text-headline-md opacity-90">Signal-based directives for scroll-driven experiences</p>
```

---

### Section 2: ScrollAnimation Directive Demo

**Layout**: Split (text left, demo right)

**Left** - Documentation:

- Directive name
- Props table (animationType, trigger, duration, delay)
- Code snippet

**Right** - Live Demo:

- Interactive controls (change animation type, trigger point)
- Multiple elements with different animations
- Visual trigger indicators

---

### Section 3: Hijacked Scroll Code Timeline

**Component**: `ScrollingCodeTimelineComponent` (migrated from temp/)

**Content**: 4-5 tutorial steps

**Example Steps**:

1. Install GSAP library
2. Import directives
3. Use ScrollAnimationDirective
4. Create Hijacked Scroll
5. Build Timelines

**Layout**: Alternating left/right, code blocks with syntax highlighting

---

### Section 4: ChromaDB Section

**Component**: `ChromadbSectionComponent` (migrated from temp/)

**Purpose**: Showcase complex scroll-triggered animations with database visualization

---

### Section 5: Neo4j Section

**Component**: `Neo4jSectionComponent` (migrated from temp/)

**Purpose**: Graph database visualization with scroll animations

---

### Section 6: Problem-Solution Timeline

**Component**: `ProblemSolutionSectionComponent` (migrated from temp/)

**Layout**: Narrative format

- Problem statement (scroll in from left)
- Solution (scroll in from right)
- GSAP transitions between states

---

### Section 7: Value Propositions (GSAP Version)

**Component**: `ValuePropositionsSectionComponent` (migrated from temp/)

**Layout**: Feature cards with scroll-triggered reveals

**Different from 3D version** - This uses DOM animations, not WebGL

---

### Section 8: CTA

**Background**: Dark with subtle patterns

**Content**:

```html
<h2 class="text-display-lg mb-8x">Ready to Animate?</h2>
<code class="bg-background-dark/80 px-6x py-3x rounded-lg"> npm install @hive-academy/angular-gsap </code>
<div class="mt-8x flex gap-4x">
  <button>View Docs</button>
  <a href="https://github.com/hive-academy/angular-gsap">GitHub</a>
</div>
```

---

## Component Implementation Examples

### Home Page Component

**File**: `apps/angular-3d-demo/src/app/pages/home.component.ts`

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
    <!-- Dual Hero -->
    <section class="min-h-screen grid lg:grid-cols-2 relative">
      <app-hero-3d-teaser />
      <app-hero-gsap-teaser />

      <!-- Center Overlay -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div class="pointer-events-auto bg-white/90 backdrop-blur-md p-12x rounded-card shadow-card max-w-content text-center">
          <h1 class="text-display-xl font-bold mb-4x">Two Libraries, <span class="text-neon-green">One Ecosystem</span></h1>
          <p class="text-headline-md text-text-secondary mb-8x">Build stunning 3D experiences and scroll animations with Angular</p>
          <div class="flex gap-4x justify-center flex-wrap">
            <a routerLink="/angular-3d" class="px-8x py-4x bg-primary-500 text-white rounded-button font-semibold hover:scale-105 transition-transform"> Explore 3D → </a>
            <a routerLink="/angular-gsap" class="px-8x py-4x border-2 border-neon-green text-neon-green rounded-button font-semibold hover:bg-neon-green hover:text-background-dark transition-all"> See Animations → </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Library Overview -->
    <app-library-overview />

    <!-- CTA -->
    <app-cta-section />
  `,
})
export class HomeComponent {}
```

---

### Angular-3D Showcase Page

**File**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase.component.ts`

```typescript
import { Component } from '@angular/core';
import { HeroSpaceSceneComponent } from '../scenes/hero-space-scene.component';
import { PrimitivesShowcaseComponent } from '../sections/primitives-showcase.component';
import { GltfGalleryComponent } from '../sections/gltf-gallery.component';
import { ValueProps3dSceneComponent } from '../scenes/value-props-3d-scene.component';

@Component({
  selector: 'app-angular-3d-showcase',
  standalone: true,
  imports: [HeroSpaceSceneComponent, PrimitivesShowcaseComponent, GltfGalleryComponent, ValueProps3dSceneComponent],
  template: `
    <!-- Hero Space Scene -->
    <app-hero-space-scene />

    <!-- Primitives -->
    <section class="py-16x bg-background-light">
      <app-primitives-showcase />
    </section>

    <!-- GLTF Gallery -->
    <section class="py-16x bg-white">
      <app-gltf-gallery />
    </section>

    <!-- Value Props -->
    <section class="py-16x bg-background-dark">
      <app-value-props-3d-scene />
    </section>
  `,
})
export class Angular3dShowcaseComponent {}
```

---

### Angular-GSAP Showcase Page

**File**: `apps/angular-3d-demo/src/app/pages/gsap-showcase.component.ts`

```typescript
import { Component } from '@angular/core';
import { ScrollingCodeTimelineComponent } from '../components/scrolling-code-timeline.component';
import { ChromadbSectionComponent } from '../components/chromadb-section.component';
import { Neo4jSectionComponent } from '../components/neo4j-section.component';
import { ProblemSolutionSectionComponent } from '../components/problem-solution-section.component';

@Component({
  selector: 'app-gsap-showcase',
  standalone: true,
  imports: [ScrollingCodeTimelineComponent, ChromadbSectionComponent, Neo4jSectionComponent, ProblemSolutionSectionComponent],
  template: `
    <!-- GSAP Hero -->
    <section class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600">
      <div class="text-center text-white">
        <h1 class="text-display-xl font-bold mb-4x">Angular GSAP</h1>
        <p class="text-headline-md opacity-90">Scroll-driven animations for Angular</p>
      </div>
    </section>

    <!-- Tutorial Timeline -->
    <app-scrolling-code-timeline [timelineData]="gsapTutorialSteps" />

    <!-- Section Showcases -->
    <app-chromadb-section />
    <app-neo4j-section />
    <app-problem-solution-section />

    <!-- CTA -->
    <section class="bg-background-dark text-white py-20x text-center">
      <h2 class="text-display-lg mb-8x">Ready to Animate?</h2>
      <code class="inline-block bg-background-dark/80 border border-neon-green/30 px-6x py-3x rounded-lg text-neon-green font-mono"> npm install @hive-academy/angular-gsap </code>
    </section>
  `,
})
export class GsapShowcaseComponent {
  public readonly gsapTutorialSteps = [
    /* tutorial data */
  ];
}
```

---

## Routing Configuration

**File**: `apps/angular-3d-demo/src/app/app.routes.ts`

```typescript
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home.component').then((m) => m.HomeComponent),
    title: 'Hive Academy - Angular 3D & GSAP',
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

---

## Migration Checklist

### TASK_2025_010 (Angular-3D)

- [ ] Create home page with dual hero
- [ ] Migrate hero-space-scene from temp/scene-graphs/
- [ ] Migrate cta-scene-graph from temp/scene-graphs/
- [ ] Migrate value-propositions-3d-scene from temp/scene-graphs/
- [ ] Create primitives showcase
- [ ] Create GLTF gallery
- [ ] Update all imports to `@hive-academy/angular-3d`

### TASK_2025_012 (Angular-GSAP)

- [ ] Migrate scrolling-code-timeline.component from temp/
- [ ] Migrate hijacked-scroll-timeline.component from temp/
- [ ] Migrate chromadb-section.component from temp/
- [ ] Migrate neo4j-section.component from temp/
- [ ] Migrate problem-solution-section.component from temp/
- [ ] Migrate value-propositions-section.component from temp/
- [ ] Update all imports to `@hive-academy/angular-gsap`
- [ ] Test scroll animations on all sections

---

## Performance Targets

**Home Page**:

- LCP < 2s (lightweight teasers, not full scenes)
- FID < 100ms

**Angular-3D Page**:

- 60fps on desktop, 30fps mobile
- Hero scene load < 2s

**Angular-GSAP Page**:

- Smooth 60fps scroll animations
- No layout shift during reveals

---

## Accessibility

- All routes keyboard navigable
- Skip links on each page
- 3D scenes have `aria-label`
- Color contrast WCAG AA
- Reduced motion support for GSAP animations

---

## File Structure

```
apps/angular-3d-demo/src/app/
├── app.routes.ts
├── app.component.ts
├── pages/
│   ├── home.component.ts
│   ├── angular-3d-showcase.component.ts
│   └── gsap-showcase.component.ts
├── sections/
│   ├── hero-3d-teaser.component.ts
│   ├── hero-gsap-teaser.component.ts
│   ├── library-overview.component.ts
│   ├── primitives-showcase.component.ts
│   ├── gltf-gallery.component.ts
│   └── cta-section.component.ts
├── scenes/ (3D wrappers)
│   ├── hero-space-scene.component.ts
│   ├── cta-scene.component.ts
│   └── value-props-3d-scene.component.ts
└── components/ (GSAP migrated)
    ├── scrolling-code-timeline.component.ts
    ├── hijacked-scroll-timeline.component.ts
    ├── chromadb-section.component.ts
    ├── neo4j-section.component.ts
    ├── problem-solution-section.component.ts
    └── value-propositions-section.component.ts
```

---

## Implementation Priority

**Phase 1**: Home Page (P0)

1. Navigation component
2. Dual hero teasers
3. Library overview cards
4. CTA section
5. Footer

**Phase 2**: Angular-3D Showcase (P1)

1. Hero space scene migration
2. Primitives showcase
3. GLTF gallery
4. Value props 3D scene

**Phase 3**: Angular-GSAP Showcase (P1)

1. GSAP hero
2. Migrate scrolling-code-timeline
3. Migrate section components (ChromaDB, Neo4j, etc.)
4. Wire up tutorial data

**Phase 4**: Polish & Testing (P2)

1. Responsive testing
2. Accessibility audit
3. Performance optimization
4. Cross-browser testing

---

**Next Step**: `/phase-4-architecture TASK_2025_010` to create implementation plan
