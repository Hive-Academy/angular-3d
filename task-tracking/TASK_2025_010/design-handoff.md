# Design Handoff - TASK_2025_010

> **Developer Implementation Guide**  
> For implementing the Hive Academy Angular Libraries Showcase landing page

**Design Specification**: [visual-design-specification.md](file:///d:/projects/angular-3d-workspace/task-tracking/TASK_2025_010/visual-design-specification.md)

---

## Quick Start

### Prerequisites

All dependencies already installed:

- ✅ TailwindCSS configured ([tailwind.config.js](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/tailwind.config.js))
- ✅ Design tokens defined ([designs-systems.md](file:///d:/projects/angular-3d-workspace/docs/design-system/designs-systems.md))
- ✅ `@hive-academy/angular-3d` library complete
- ✅ `@hive-academy/angular-gsap` library complete
- ✅ 3D scene references available in `temp/scene-graphs/`

### Implementation Order

```
1. App Routing Structure (1 hour)
2. Navigation Component (1 hour)
3. Hero Section (3 hours) - Most complex, includes 3D
4. Library Overview Cards (2 hours)
5. Angular-3D Features Section (2 hours)
6. Angular-GSAP Features Section (2 hours)
7. CTA Section (1 hour)
8. Footer (1 hour)
9. Responsive Polish (2 hours)
10. Accessibility Audit (1 hour)
```

**Total**: ~16 hours

---

## File Structure

```
apps/angular-3d-demo/src/app/
├── app.component.ts              # Root component
├── app.routes.ts                 # Route configuration
├── components/
│   ├── navigation.component.ts   # Fixed nav bar
│   └── footer.component.ts       # Footer section
├── sections/                     # Landing page sections
│   ├── hero-section.component.ts
│   ├── library-overview.component.ts
│   ├── angular-3d-features.component.ts
│   ├── angular-gsap-features.component.ts
│   └── cta-section.component.ts
└── scenes/                       # 3D scene wrappers
    ├── hero-3d-scene.component.ts
    ├── cta-3d-scene.component.ts
    └── value-props-3d-scene.component.ts
```

---

## Code Examples

### 1. Navigation Component

**File**: `apps/angular-3d-demo/src/app/components/navigation.component.ts`

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
        <!-- Logo -->
        <a routerLink="/" class="text-headline-md font-bold text-neon-green hover:animate-glow transition-all duration-250"> Hive Academy </a>

        <!-- Nav Links -->
        <div class="hidden md:flex items-center gap-6x">
          <a routerLink="/angular-3d" routerLinkActive="text-neon-green" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> Angular-3D </a>
          <a routerLink="/angular-gsap" routerLinkActive="text-neon-green" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> Angular-GSAP </a>
          <a href="https://docs.hive-academy.com" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> Docs </a>
          <a href="https://github.com/hive-academy" class="text-body-lg text-text-secondary hover:text-neon-green transition-colors duration-250"> GitHub </a>

          <!-- CTA Button -->
          <button
            class="px-6x py-2x bg-primary-500 text-white rounded-button font-semibold 
                         hover:scale-105 hover:shadow-button-hover 
                         transition-all duration-250"
          >
            Get Started
          </button>
        </div>

        <!-- Mobile Menu Button -->
        <button class="md:hidden text-neon-green">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </nav>
  `,
})
export class NavigationComponent {}
```

---

### 2. Hero Section Component

**File**: `apps/angular-3d-demo/src/app/sections/hero-section.component.ts`

```typescript
import { Component, signal } from '@angular/core';
import { Hero3dSceneComponent } from '../scenes/hero-3d-scene.component';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [Hero3dSceneComponent],
  template: `
    <section class="min-h-screen bg-background-dark relative overflow-hidden">
      <!-- 3D Scene Background -->
      <div class="absolute inset-0 z-0">
        <app-hero-3d-scene />
      </div>

      <!-- Content Overlay -->
      <div class="relative z-10 max-w-container mx-auto px-4x py-12x min-h-screen flex items-center">
        <div class="grid lg:grid-cols-2 gap-8x items-center w-full">
          <!-- Text Column -->
          <div class="space-y-6x">
            <!-- Headline -->
            <h1
              class="text-display-xl md:text-display-lg font-bold text-white 
                       animate-fade-in"
            >
              Build <span class="text-neon-green">Stunning 3D Experiences</span> with Angular
            </h1>

            <!-- Subheadline -->
            <p class="text-headline-md text-text-secondary animate-fade-in" style="animation-delay: 0.2s">Two powerful libraries for modern Angular applications</p>

            <!-- Feature Pills -->
            <div class="flex flex-wrap gap-2x animate-fade-in" style="animation-delay: 0.4s">
              <span
                class="bg-background-dark/50 border border-neon-green/30 
                           px-4x py-2x rounded-full text-body-md text-neon-green"
              >
                Three.js Wrapper
              </span>
              <span
                class="bg-background-dark/50 border border-neon-green/30 
                           px-4x py-2x rounded-full text-body-md text-neon-green"
              >
                GSAP Animations
              </span>
              <span
                class="bg-background-dark/50 border border-neon-green/30 
                           px-4x py-2x rounded-full text-body-md text-neon-green"
              >
                Signal-Based
              </span>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-wrap gap-4x animate-fade-in" style="animation-delay: 0.6s">
              <button
                class="px-8x py-4x bg-neon-green text-background-dark rounded-button 
                             font-semibold hover:scale-105 hover:shadow-neon-green 
                             transition-all duration-250"
              >
                Explore Angular-3D
              </button>
              <button
                class="px-8x py-4x border-2 border-neon-green text-neon-green rounded-button 
                             font-semibold hover:bg-neon-green hover:text-background-dark 
                             transition-all duration-250"
              >
                View GSAP Library
              </button>
            </div>
          </div>

          <!-- 3D Scene Column (Spacer for mobile) -->
          <div class="hidden lg:block min-h-[600px]">
            <!-- Scene is in background, this is just spacing -->
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HeroSectionComponent {}
```

---

### 3. Hero 3D Scene Wrapper

**File**: `apps/angular-3d-demo/src/app/scenes/hero-3d-scene.component.ts`

```typescript
import { Component, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Scene3dComponent, GltfModelComponent, StarFieldComponent, NebulaComponent, SVGIconComponent, ParticleTextComponent, OrbitControlsComponent, BloomEffectComponent, Float3dDirective, Rotate3dDirective } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-3d-scene',
  standalone: true,
  imports: [Scene3dComponent, GltfModelComponent, StarFieldComponent, NebulaComponent, SVGIconComponent, ParticleTextComponent, OrbitControlsComponent, BloomEffectComponent, Float3dDirective, Rotate3dDirective],
  template: `
    <scene-3d [cameraPosition]="[0, 0, 5]" [cameraFov]="75">
      <!-- Lights -->
      <app-ambient-light [intensity]="0.5" />
      <app-directional-light [position]="[10, 10, 5]" [intensity]="1" [color]="'#A1FF4F'" />

      <!-- Earth Model -->
      <app-gltf-model [modelPath]="'/assets/3d/planet_earth/scene.gltf'" [position]="[-1, 0, 0]" [scale]="1.5" rotate3d [rotationSpeed]="0.005" [rotationAxis]="'y'" />

      <!-- Star Field (3 layers) -->
      <app-star-field [count]="starCount()" [layers]="3" [colors]="['#FFFFFF', '#A1FF4F', '#6366F1']" />

      <!-- Nebula -->
      <app-nebula [opacity]="0.4" [color]="'#6366F1'" />

      <!-- Tech Stack Logos -->
      <app-svg-icon [svgPath]="'/assets/images/logos/nestjs.svg'" [position]="[2, 2, -1]" float3d [floatHeight]="0.3" [floatDuration]="3" />

      <!-- Particle Text -->
      <app-particle-text [text]="'Hive Academy'" [position]="[0, -2, 0]" [particleCount]="textParticles()" />

      <!-- Robot Model -->
      <app-gltf-model [modelPath]="'/assets/3d/mini_robot.glb'" [position]="[2, 1, -1]" spaceFlight3d />

      <!-- Controls -->
      <app-orbit-controls [enableDamping]="true" [autoRotate]="true" [autoRotateSpeed]="0.5" />

      <!-- Post-Processing -->
      <app-bloom-effect [strength]="0.8" [radius]="0.5" [threshold]="0.85" />
    </scene-3d>
  `,
})
export class Hero3dSceneComponent {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  // Responsive particle counts
  private readonly viewportWidth = signal<number>(this.isBrowser ? window.innerWidth : 1920);

  readonly starCount = computed(() => {
    const width = this.viewportWidth();
    if (width < 768) return 1500; // Mobile: 50%
    if (width < 1024) return 2250; // Tablet: 75%
    return 3000; // Desktop: 100%
  });

  readonly textParticles = computed(() => {
    const width = this.viewportWidth();
    if (width < 768) return 30;
    if (width < 1024) return 45;
    return 60;
  });
}
```

---

### 4. Library Overview Cards

**File**: `apps/angular-3d-demo/src/app/sections/library-overview.component.ts`

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-library-overview',
  standalone: true,
  template: `
    <section class="bg-background-light py-16x">
      <div class="max-w-container mx-auto px-4x">
        <!-- Section Header -->
        <h2 class="text-display-lg text-center mb-12x font-bold">Two Libraries, <span class="text-primary-500">Infinite Possibilities</span></h2>

        <!-- Cards Grid -->
        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Angular-3D Card -->
          <div
            class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover 
                      hover:-translate-y-2 transition-all duration-300"
          >
            <!-- Icon/Visual Placeholder -->
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
                <span class="text-body-md">26+ Primitives</span>
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

            <a href="#" class="text-primary-500 hover:text-neon-green font-semibold inline-flex items-center gap-1x transition-colors duration-250">
              Explore Components
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          <!-- Angular-GSAP Card (similar structure) -->
          <div
            class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover 
                      hover:-translate-y-2 transition-all duration-300"
          >
            <!-- (Similar structure to Angular-3D card) -->
            <h3 class="text-headline-lg font-bold text-primary-500 mb-3x">&#64;hive-academy/angular-gsap</h3>
            <!-- ... rest of card content ... -->
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LibraryOverviewComponent {}
```

---

### 5. CTA Section with 3D Background

**File**: `apps/angular-3d-demo/src/app/sections/cta-section.component.ts`

```typescript
import { Component } from '@angular/core';
import { Cta3dSceneComponent } from '../scenes/cta-3d-scene.component';

@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [Cta3dSceneComponent],
  template: `
    <section class="relative w-full py-20x px-4x bg-background-dark overflow-hidden">
      <!-- 3D Background -->
      <div class="absolute inset-0 z-0 opacity-40">
        <app-cta-3d-scene />
      </div>

      <!-- Content -->
      <div class="relative z-10 max-w-content mx-auto text-center">
        <h2 class="text-display-lg font-bold text-white mb-4x">Ready to Build?</h2>

        <p class="text-headline-md text-text-secondary mb-8x">Install both libraries and start creating stunning Angular applications today</p>

        <!-- CTA Buttons -->
        <div class="flex flex-wrap gap-4x justify-center mb-8x">
          <button
            class="px-10x py-4x bg-neon-green text-background-dark rounded-button 
                         font-semibold hover:scale-105 hover:shadow-neon-green 
                         transition-all duration-250"
          >
            Get Started
          </button>
          <button
            class="px-10x py-4x border-2 border-white text-white rounded-button 
                         font-semibold hover:bg-white hover:text-background-dark 
                         transition-all duration-250"
          >
            View Documentation
          </button>
        </div>

        <!-- Install Command -->
        <div
          class="inline-block bg-background-dark/80 border border-neon-green/30 
                    px-6x py-3x rounded-lg relative group"
        >
          <code class="text-neon-green font-mono text-body-md"> npm install &#64;hive-academy/angular-3d &#64;hive-academy/angular-gsap </code>
          <button
            class="absolute right-2 top-1/2 -translate-y-1/2 
                         text-text-secondary hover:text-neon-green transition-colors"
            title="Copy to clipboard"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>
  `,
})
export class CtaSectionComponent {}
```

---

### 6. CTA 3D Scene (Polyhedrons)

**File**: `apps/angular-3d-demo/src/app/scenes/cta-3d-scene.component.ts`

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, PolyhedronComponent, AmbientLightComponent, DirectionalLightComponent, Float3dDirective } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-cta-3d-scene',
  standalone: true,
  imports: [Scene3dComponent, PolyhedronComponent, AmbientLightComponent, DirectionalLightComponent, Float3dDirective],
  template: `
    <scene-3d [cameraPosition]="[0, 0, 6]" [cameraFov]="50">
      <!-- Lights -->
      <app-ambient-light [intensity]="0.6" />
      <app-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

      <!-- Floating Polyhedrons -->
      <app-polyhedron [type]="'icosahedron'" [position]="[-3, 1, -2]" [color]="'#6366F1'" [opacity]="0.35" float3d [floatHeight]="0.5" [floatDuration]="4.5" />

      <app-polyhedron [type]="'octahedron'" [position]="[3, -1, -2]" [color]="'#A1FF4F'" [opacity]="0.3" float3d [floatHeight]="0.4" [floatDuration]="5" />

      <app-polyhedron [type]="'dodecahedron'" [position]="[0, 0, -4]" [color]="'#6366F1'" [opacity]="0.4" float3d [floatHeight]="0.6" [floatDuration]="4" />
    </scene-3d>
  `,
})
export class Cta3dSceneComponent {}
```

---

## Responsive Implementation

### Mobile-First Approach

**Breakpoint Utilities** (Already in Tailwind config):

- Mobile: `< 768px` (default classes)
- Tablet: `md:` (≥768px)
- Desktop: `lg:` (≥1024px)

### Example Responsive Classes

```html
<!-- Responsive Grid -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4x md:gap-6x lg:gap-8x">
  <!-- Content -->
</div>

<!-- Responsive Typography -->
<h1 class="text-headline-lg md:text-display-md lg:text-display-xl">Responsive Headline</h1>

<!-- Responsive Padding -->
<section class="px-2x py-8x md:px-4x md:py-12x lg:px-6x lg:py-16x">
  <!-- Content -->
</section>

<!-- Hide on Mobile, Show on Desktop -->
<div class="hidden lg:block">Desktop Only</div>

<!-- Show on Mobile, Hide on Desktop -->
<div class="lg:hidden">Mobile Only</div>
```

---

## Accessibility Implementation

### Keyboard Navigation

```html
<!-- Focus Ring Pattern -->
<button class="focus:outline-none focus:ring-2 focus:ring-neon-green focus:ring-offset-2">Button</button>

<!-- Skip to Main Content -->
<a
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 
          bg-neon-green text-background-dark px-4x py-2x rounded-button"
>
  Skip to main content
</a>
```

### ARIA Labels

```html
<!-- 3D Scene -->
<scene-3d aria-label="3D visualization of space scene">
  <!-- ... -->
</scene-3d>

<!-- Navigation -->
<nav role="navigation" aria-label="Main navigation">
  <!-- ... -->
</nav>

<!-- Buttons -->
<button aria-label="Copy install command to clipboard">
  <svg>...</svg>
</button>
```

### Reduced Motion

**Global Stylesheet** (`styles.scss`):

```scss
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Animation Implementation

### CSS Animations (Tailwind Classes)

Already configured in `tailwind.config.js`:

- `animate-fade-in` - Fade in from bottom
- `animate-slide-in` - Slide in from left
- `animate-glow` - Pulsing glow effect

### Usage:

```html
<div class="animate-fade-in">Content</div>

<!-- With Delay -->
<div class="animate-fade-in" style="animation-delay: 0.2s">Content</div>
```

### GSAP Scroll Animations

```typescript
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  imports: [ScrollAnimationDirective],
  template: `
    <div scrollAnimation
         [animationType]="'fadeInUp'"
         [trigger]="'0.2'"
         [duration]="0.6">
      Content animates when 20% visible
    </div>
  `
})
```

---

## Testing Checklist

### Visual QA

- [ ] All sections render correctly
- [ ] 3D scenes load and animate
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] Navigation sticky and functional
- [ ] All hover states work

### Accessibility

- [ ] Tab navigation works through all interactive elements
- [ ] Focus rings visible
- [ ] ARIA labels present
- [ ] Color contrast meets WCAG AA
- [ ] Reduced motion respected

### Performance

- [ ] Lighthouse score ≥90
- [ ] Hero scene loads <2s
- [ ] 60fps on desktop
- [ ] No console errors

### Cross-Browser

- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari 15+

---

## Next Steps

1. **Start with Routing**: Set up app routes and basic structure
2. **Build Layout First**: Navigation + Footer (no 3D yet)
3. **Add Content**: Hero text, cards (without 3D scenes)
4. **Integrate 3D**: Add scene components progressively
5. **Polish**: Animations, transitions, responsive tweaks
6. **Test**: Accessibility, performance, cross-browser

---

**Questions?** Reference the full [visual-design-specification.md](file:///d:/projects/angular-3d-workspace/task-tracking/TASK_2025_010/visual-design-specification.md) for detailed component specs.
