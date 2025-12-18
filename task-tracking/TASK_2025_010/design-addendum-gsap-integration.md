# Design Addendum: GSAP Showcase Integration

> **Integration of TASK_2025_012 Requirements**  
> Expanding the landing page design to properly showcase `@hive-academy/angular-gsap`

**Related Tasks**:

- TASK_2025_010: Demo App Migration (Angular-3D scenes)
- TASK_2025_012: GSAP Showcase Migration (scroll animations)

---

## Executive Summary

The original design specification focused primarily on Angular-3D with limited GSAP coverage. This addendum updates the information architecture to give **equal prominence** to both libraries and leverages the rich showcase components in `temp/`:

**Existing GSAP Showcase Components**:

- `scrolling-code-timeline.component.ts` - Progressive code revelation with hijacked scroll
- `hijacked-scroll-timeline.component.ts` - Generic timeline wrapper
- `chromadb-section.component.ts` - Interactive tech section
- `neo4j-section.component.ts` - Database showcase section
- `value-propositions-section.component.ts` - Feature highlights
- `problem-solution-section.component.ts` - Narrative section

**Design Impact**: Instead of a single-page landing, we create a **dual showcase architecture**:

1. **Home Page**: Brief intro + both libraries
2. **/angular-3d**: Dedicated 3D demos
3. **/angular-gsap**: Dedicated GSAP demos (TASK_2025_012 components)

---

## Updated Information Architecture

### Original Structure (Too 3D-Heavy)

```
Home Page:
  - Hero (3D scene)
  - Library Overview (brief cards)
  - Angular-3D Features (deep dive)
  - Angular-GSAP Features (shallow)
  - CTA
```

### **New Structure (Balanced)**

```
Home Page (Landing):
  - Hero Section (3D + GSAP combined)
  - Library Overview (equal cards with CTAs)
  - Feature Comparison Grid
  - CTA Section

/angular-3d Route (Deep Dive):
  - Hero Space Scene (interactive)
  - Primitives Showcase
  - GLTF Model Gallery
  - Post-Processing Effects
  - Controls Demo
  - Value Props 3D Scene

/angular-gsap Route (Deep Dive - TASK_2025_012):
  - ScrollAnimation Showcase
  - Hijacked Scroll Timeline (code steps)
  - ChromaDB Section (migrated)
  - Neo4j Section (migrated)
  - Problem-Solution Timeline
  - Value Propositions (scroll-triggered)

/docs Route:
  - API documentation
```

---

## Updated Home Page Sections

### 1. Hero Section (Revised - Dual Library Showcase)

**Layout**: Full viewport, split visually

**Left Half**: Angular-3D Demo

- Rotating 3D scene (smaller than original design)
- Interactive OrbitControls
- Subtle particle effects

**Right Half**: Angular-GSAP Demo

- Scroll-animated text elements
- Timeline preview (mini version)
- Code snippet that animates in

**Center Overlay** (Main Content):

- Headline: "Two Libraries, **One Ecosystem**"
- Subheadline: "Build stunning 3D experiences and scroll animations with Angular"
- Dual CTAs:
  - "Explore 3D →" (links to /angular-3d)
  - "See Animations →" (links to /angular-gsap)

**Implementation**:

```typescript
// Simplified hero - teaser for both libraries
<section class="min-h-screen grid lg:grid-cols-2 gap-0">
  <!-- Left: 3D Teaser -->
  <div class="relative overflow-hidden bg-background-dark">
    <app-hero-3d-teaser /> <!-- Smaller version of space scene -->
  </div>

  <!-- Right: GSAP Teaser -->
  <div class="relative overflow-hidden bg-white">
    <app-hero-gsap-teaser /> <!-- Scroll animation preview -->
  </div>

  <!-- Center Content Overlay -->
  <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
    <div class="pointer-events-auto max-w-content text-center bg-white/90 backdrop-blur-md p-12x rounded-card shadow-card">
      <!-- Headline, CTAs -->
    </div>
  </div>
</section>
```

---

### 2. Library Overview Cards (Revised - Equal Depth)

**Layout**: Side-by-side cards with **equal visual weight**

**Angular-3D Card**:

- Inline 3D demo (rotating cube or sphere)
- Feature list: Primitives, GLTF, Post-processing, Controls
- CTA: "Explore Full Demo →" (links to /angular-3d)

**Angular-GSAP Card**:

- Mini scroll animation demo (text fading in as you hover/scroll)
- Feature list: ScrollTrigger, Hijacked Scroll, Timelines, Directives
- CTA: "See Animations →" (links to /angular-gsap)

**No More "Deep Dive" on Home**: Both libraries get equal teaser treatment. Deep dives happen on dedicated routes.

---

## New Route: /angular-gsap (TASK_2025_012 Implementation)

**Purpose**: Dedicated page showcasing `@hive-academy/angular-gsap` using migrated temp/ components

### Page Structure

**Section 1: GSAP Hero**

- Headline: "Powerful GSAP Animations for Angular"
- Animated headline using GSAP split text
- Subheadline scrolls in from bottom
- Background: Subtle SVG pattern animations

**Section 2: ScrollAnimation Directive Demo**

- Live demo: Elements fade in as you scroll
- Code example showing directive usage
- Interactive controls: Adjust trigger point, animation type

**Component**: New wrapper using existing patterns

```typescript
<div scrollAnimation
     [animationType]="'fadeInUp'"
     [trigger]="'0.2'">
  <h2>Content animates when 20% visible</h2>
</div>
```

**Section 3: Hijacked Scroll Code Timeline**

- **Source**: `temp/scrolling-code-timeline.component.ts` (migrate as-is)
- **Content**: Show 4-5 code steps demonstrating GSAP usage
- **Layout**: Alternating left/right with code blocks
- **Example Steps**:
  1. Installing GSAP library
  2. Using ScrollAnimationDirective
  3. Creating Hijacked Scroll
  4. Building Timelines

**Implementation**:

```html
<app-scrolling-code-timeline [timelineData]="gsapTutorialSteps" />
```

**Section 4: ChromaDB Showcase** (if applicable to GSAP demo)

- **Source**: `temp/chromadb-section.component.ts`
- Shows complex scroll-triggered animations
- Database architecture visualization with GSAP

**Section 5: Neo4j Showcase** (if applicable)

- **Source**: `temp/neo4j-section.component.ts`
- Graph database visualization with scroll animations

**Section 6: Problem-Solution Timeline**

- **Source**: `temp/problem-solution-section.component.ts`
- Narrative storytelling with scroll reveals
- Problem → Solution format with GSAP transitions

**Section 7: Value Propositions (GSAP Version)**

- **Source**: `temp/value-propositions-section.component.ts`
- Feature cards with scroll-triggered animations
- Different from the 3D value props (this is DOM-based)

**Section 8: CTA**

- Install command for @hive-academy/angular-gsap
- Links to docs, GitHub

---

## Updated Component Specifications

### Hero GSAP Teaser Component (New)

**File**: `apps/angular-3d-demo/src/app/sections/hero-gsap-teaser.component.ts`

```typescript
import { Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-hero-gsap-teaser',
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `
    <div class="h-screen flex flex-col items-center justify-center p-8x bg-gradient-to-br from-white to-primary-50">
      <!-- Animated Text -->
      <h2 scrollAnimation [animationType]="'fadeInUp'" class="text-display-md font-bold text-primary-500 mb-4x">Scroll Animations</h2>

      <p scrollAnimation [animationType]="'fadeInUp'" [delay]="0.2" class="text-headline-md text-text-secondary mb-8x">Build with GSAP</p>

      <!-- Mini Code Block (animated) -->
      <div scrollAnimation [animationType]="'slideInRight'" [delay]="0.4" class="bg-background-dark p-4x rounded-lg border border-primary-500/30">
        <code class="text-neon-green font-mono text-body-sm"> &lt;div scrollAnimation&gt;...&lt;/div&gt; </code>
      </div>

      <!-- Scroll Indicator -->
      <div class="mt-12x animate-bounce">
        <svg class="w-6 h-6 text-primary-500" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
        </svg>
      </div>
    </div>
  `,
})
export class HeroGsapTeaserComponent {}
```

---

### GSAP Showcase Page Component (New)

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
        <h1 class="text-display-xl font-bold mb-4x">Angular GSAP Animations</h1>
        <p class="text-headline-md opacity-90">Signal-based directives for scroll-driven experiences</p>
      </div>
    </section>

    <!-- Code Timeline -->
    <section class="bg-background-light">
      <app-scrolling-code-timeline [timelineData]="gsapTutorial" />
    </section>

    <!-- ChromaDB Section -->
    <app-chromadb-section />

    <!-- Neo4j Section -->
    <app-neo4j-section />

    <!-- Problem/Solution -->
    <app-problem-solution-section />

    <!-- CTA -->
    <section class="bg-background-dark text-white py-20x text-center">
      <h2 class="text-display-lg mb-8x">Ready to Animate?</h2>
      <button class="px-10x py-4x bg-neon-green text-background-dark rounded-button font-semibold">Install @hive-academy/angular-gsap</button>
    </section>
  `,
})
export class GsapShowcaseComponent {
  public readonly gsapTutorial = [
    {
      id: '1',
      step: 1,
      title: 'Install the Library',
      description: 'Add @hive-academy/angular-gsap to your Angular project',
      code: 'npm install @hive-academy/angular-gsap gsap',
      language: 'bash',
      layout: 'left' as const,
    },
    {
      id: '2',
      step: 2,
      title: 'Use ScrollAnimation',
      description: 'Add the directive to any element for scroll-triggered animations',
      code: `<div scrollAnimation
     [animationType]="'fadeInUp'"
     [trigger]="'0.2'">
  Content animates when 20% visible
</div>`,
      language: 'html',
      layout: 'right' as const,
    },
    // ... more steps
  ];
}
```

---

## Updated Routing Structure

**File**: `apps/angular-3d-demo/src/app/app.routes.ts`

```typescript
export const routes: Route[] = [
  {
    path: '',
    component: HomeComponent, // Revised homepage with dual showcase
    title: 'Hive Academy - Angular 3D & GSAP Libraries',
  },
  {
    path: 'angular-3d',
    loadComponent: () => import('./pages/angular-3d-showcase.component').then((m) => m.Angular3dShowcaseComponent),
    title: 'Angular-3D Showcase',
  },
  {
    path: 'angular-gsap',
    loadComponent: () => import('./pages/gsap-showcase.component').then((m) => m.GsapShowcaseComponent),
    title: 'Angular-GSAP Showcase',
  },
  {
    path: 'docs',
    loadChildren: () => import('./docs/docs.routes'),
    title: 'Documentation',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
```

---

## Migration Checklist (TASK_2025_012)

### Components to Migrate from temp/

- [ ] `scrolling-code-timeline.component.ts` → `apps/angular-3d-demo/src/app/components/`
- [ ] `hijacked-scroll-timeline.component.ts` → `apps/angular-3d-demo/src/app/components/`
- [ ] `chromadb-section.component.ts` → `apps/angular-3d-demo/src/app/components/`
- [ ] `neo4j-section.component.ts` → `apps/angular-3d-demo/src/app/components/`
- [ ] `problem-solution-section.component.ts` → `apps/angular-3d-demo/src/app/components/`
- [ ] `value-propositions-section.component.ts` → `apps/angular-3d-demo/src/app/components/`

### Import Updates

For each migrated component:

1. Change imports from `../../core/angular-3d/directives/` to `@hive-academy/angular-gsap`
2. Update component decorator to use standalone: true (if not already)
3. Verify GSAP and ScrollTrigger imports
4. Test animations work correctly

### Testing Checklist

- [ ] All scroll animations trigger at correct positions
- [ ] Hijacked scroll step transitions are smooth
- [ ] Timeline navigation works (if applicable)
- [ ] Responsive behavior (mobile/tablet/desktop)
- [ ] Code blocks syntax highlight correctly
- [ ] No console errors
- [ ] Performance: 60fps during scroll animations

---

## Design Tokens Update (No Changes Needed)

The existing Tailwind configuration already supports GSAP showcase:

- Primary colors for highlights
- Generous spacing for scroll sections
- Typography scale for code and headings
- Animation utilities (though GSAP handles most)

**New Utility Classes** (if needed):

```javascript
// Add to tailwind.config.js
extend: {
  minHeight: {
    'screen-70': '70vh', // For hijacked scroll steps
  }
}
```

---

## Updated File Structure

```
apps/angular-3d-demo/src/app/
├── app.routes.ts (updated with 3 routes)
├── pages/
│   ├── home.component.ts (revised dual showcase)
│   ├── angular-3d-showcase.component.ts (deep dive 3D)
│   └── gsap-showcase.component.ts (deep dive GSAP - NEW)
├── sections/
│   ├── hero-3d-teaser.component.ts (smaller 3D for home)
│   ├── hero-gsap-teaser.component.ts (NEW)
│   ├── library-overview.component.ts (revised cards)
│   └── cta-section.component.ts (dual CTA buttons)
├── components/ (GSAP components from temp/)
│   ├── scrolling-code-timeline.component.ts (migrated)
│   ├── hijacked-scroll-timeline.component.ts (migrated)
│   ├── chromadb-section.component.ts (migrated)
│   ├── neo4j-section.component.ts (migrated)
│   ├── problem-solution-section.component.ts (migrated)
│   └── value-propositions-section.component.ts (migrated)
└── scenes/ (3D wrappers)
    ├── hero-3d-scene.component.ts
    ├── cta-3d-scene.component.ts
    └── value-props-3d-scene.component.ts
```

---

## Summary of Changes

### What Changed

1. **Home Page**: Reduced to teaser for both libraries (not deep dive)
2. **New Route**: `/angular-gsap` for dedicated GSAP showcase
3. **Architecture**: Multi-page instead of single-page landing
4. **Balance**: Equal prominence for both libraries

### Why This is Better

- **User Journey**: Clear path for users interested in 3D vs animations
- **Performance**: Lazy load routes instead of loading everything on home
- **Showcase Depth**: Both libraries get full demonstrations
- **Maintenance**: Easier to update individual showcases
- **TASK_2025_012 Integration**: Natural home for migrated GSAP components

### Implementation Priority

1. **Phase 1**: Update home page (revised hero, cards)
2. **Phase 2**: Create /angular-3d route (TASK_2025_010)
3. **Phase 3**: Create /angular-gsap route (TASK_2025_012)
4. **Phase 4**: Migrate temp/ components to /angular-gsap
5. **Phase 5**: Polish, test, optimize

---

**Next Steps**:

1. Review this addendum alongside original design spec
2. Decide: Single-page landing (original) vs Multi-page showcase (addendum)
3. Proceed to Phase 4 (Architecture) with chosen approach
