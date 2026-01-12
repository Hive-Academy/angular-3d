# @hive-academy/angular-gsap

[Back to Main](../../CLAUDE.md)

## Purpose

Angular library wrapping GSAP for scroll-based animations. Provides directives for ScrollTrigger animations and hijacked scroll experiences.

## Boundaries

**Belongs here**:

- GSAP animation directives
- ScrollTrigger integrations
- Hijacked scroll components
- Scroll-based animation utilities

**Does NOT belong**:

- Three.js/3D code (use `@hive-academy/angular-3d`)
- Application-specific scroll sections
- Demo/showcase code

## Structure

```
src/
├── lib/
│   ├── directives/
│   │   ├── scroll/                           # Scroll-based directives
│   │   │   ├── scroll-animation.directive.ts # Main scroll animation
│   │   │   ├── hijacked-scroll.directive.ts  # Scroll hijacking container
│   │   │   ├── hijacked-scroll-item.directive.ts # Hijacked scroll items
│   │   │   └── scroll-section-pin.directive.ts   # Section pinning
│   │   ├── viewport-animation.directive.ts   # IntersectionObserver animations
│   │   ├── section-sticky.directive.ts       # Sticky section behavior
│   │   ├── parallax-split-item.directive.ts  # Parallax split items
│   │   └── lenis-smooth-scroll.directive.ts  # Smooth scroll directive
│   ├── components/
│   │   ├── scroll-timeline/                  # Timeline components
│   │   │   ├── hijacked-scroll-timeline.component.ts
│   │   │   ├── scroll-timeline.component.ts
│   │   │   └── step-indicator.component.ts
│   │   ├── feature-showcase/                 # Feature showcase system
│   │   │   ├── feature-showcase-timeline.component.ts
│   │   │   ├── feature-step.component.ts
│   │   │   └── feature-step.directives.ts    # 6 content directives
│   │   ├── split-panel/                      # Split panel system
│   │   │   ├── split-panel-section.component.ts
│   │   │   └── split-panel.directives.ts     # 5 content directives
│   │   └── parallax-split-scroll.component.ts
│   ├── services/
│   │   ├── gsap-core.service.ts              # GSAP initialization & config
│   │   └── lenis-smooth-scroll.service.ts    # Lenis smooth scroll service
│   └── providers/
│       ├── gsap.provider.ts                  # provideGsap() function
│       └── lenis.provider.ts                 # provideLenis() function
└── index.ts                                  # Public API exports
```

## Key Files

- `scroll-animation.directive.ts` - Main scroll animation directive with predefined animations
- `hijacked-scroll.directive.ts` - Container for hijacked scroll experiences
- `hijacked-scroll-item.directive.ts` - Individual items in hijacked scroll

## Dependencies

**External**:

- `gsap` - GreenSock Animation Platform
- `gsap/ScrollTrigger` - Scroll-triggered animations

## Commands

```bash
# Building
npx nx build @hive-academy/angular-gsap          # Production build
npx nx build @hive-academy/angular-gsap:development

# Testing
npx nx test @hive-academy/angular-gsap           # Run tests
npx nx test @hive-academy/angular-gsap --watch   # Watch mode

# Linting
npx nx lint @hive-academy/angular-gsap
npx nx typecheck @hive-academy/angular-gsap

# Publishing
npx nx run @hive-academy/angular-gsap:nx-release-publish
```

## Guidelines

### Scroll Animation Directive

Basic usage:

```html
<!-- Simple fade-in -->
<h1 scrollAnimation>Title</h1>

<!-- Custom animation -->
<div
  scrollAnimation
  [scrollConfig]="{
    animation: 'slideUp',
    start: 'top 80%',
    duration: 1.2,
    ease: 'power3.out'
  }"
>
  Content
</div>

<!-- Parallax effect -->
<div
  scrollAnimation
  [scrollConfig]="{
    animation: 'parallax',
    speed: 0.5,
    scrub: true
  }"
>
  Parallax element
</div>
```

### Animation Types

```typescript
type AnimationType =
  | 'fadeIn' // Fade from 0 to 1 opacity
  | 'fadeOut' // Fade from 1 to 0 opacity
  | 'slideUp' // Slide up with fade
  | 'slideDown' // Slide down with fade
  | 'slideLeft' // Slide left with fade
  | 'slideRight' // Slide right with fade
  | 'scaleIn' // Scale from 0.8 with fade
  | 'scaleOut' // Scale from 1.2 with fade
  | 'parallax' // Parallax scroll effect
  | 'custom'; // Custom from/to values
```

### Configuration Options

```typescript
interface ScrollAnimationConfig {
  // Animation type
  animation?: AnimationType;

  // ScrollTrigger settings
  trigger?: string; // CSS selector or 'self'
  start?: string; // e.g., 'top 80%'
  end?: string; // e.g., 'bottom 20%'
  scrub?: boolean | number; // Link to scroll progress
  pin?: boolean; // Pin during scroll
  markers?: boolean; // Debug markers

  // Animation properties
  duration?: number; // Seconds
  delay?: number; // Seconds
  ease?: string; // GSAP easing
  stagger?: number; // Child stagger

  // Parallax settings
  speed?: number; // 0.5 = half, 2 = double
  yPercent?: number;
  xPercent?: number;

  // Custom animation
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;

  // Callbacks
  onEnter?: () => void;
  onLeave?: () => void;
  onUpdate?: (progress: number) => void;

  // Performance
  once?: boolean; // Run once only
  toggleActions?: string; // play/pause/resume/reset
}
```

### Hijacked Scroll

For full-page scroll experiences:

```html
<div hijackedScroll [config]="{ totalItems: 5 }">
  <section hijackedScrollItem [config]="{ index: 0, direction: 'up' }">Section 1</section>
  <section hijackedScrollItem [config]="{ index: 1, direction: 'left' }">Section 2</section>
  <!-- More sections... -->
</div>
```

### SSR Compatibility

The directive handles SSR automatically:

```typescript
constructor() {
  // Register ScrollTrigger only in browser
  if (isPlatformBrowser(this.platformId)) {
    gsap.registerPlugin(ScrollTrigger);
  }

  // Initialize after render (browser only)
  if (isPlatformBrowser(this.platformId)) {
    afterNextRender(() => {
      this.initializeAnimation(config);
    });
  }
}
```

### Cleanup

Animations are cleaned up automatically on destroy:

```typescript
ngOnDestroy(): void {
  if (this.scrollTrigger) {
    this.scrollTrigger.kill();
  }
  if (this.animation) {
    this.animation.kill();
  }
}
```

### Public Methods

```typescript
// Manually refresh ScrollTrigger (after content changes)
directive.refresh();

// Get current scroll progress (0-1)
const progress = directive.getProgress();

// Enable/disable the trigger
directive.setEnabled(false);
```

## Public API

Import from `@hive-academy/angular-gsap`:

```typescript
// Scroll Directives (4 directives)
export { ScrollAnimationDirective, ScrollAnimationConfig, AnimationType, HijackedScrollDirective, HijackedScrollConfig, HijackedScrollItemDirective, HijackedScrollItemConfig, SlideDirection, ScrollSectionPinDirective } from '@hive-academy/angular-gsap';

// Other Directives (4 directives)
export { ViewportAnimationDirective, ViewportAnimationConfig, ViewportAnimationType, SectionStickyDirective, ParallaxSplitItemDirective, ParallaxSplitItemConfig, SplitLayout, LenisSmoothScrollDirective, LenisSmoothScrollConfig } from '@hive-academy/angular-gsap';

// Scroll Timeline Components (3 components)
export { HijackedScrollTimelineComponent, ScrollTimelineComponent, StepIndicatorComponent, StepData } from '@hive-academy/angular-gsap';

// Feature Showcase Components (2 components + 6 directives)
export { FeatureShowcaseTimelineComponent, FeatureStepComponent, FeatureBadgeDirective, FeatureTitleDirective, FeatureDescriptionDirective, FeatureNotesDirective, FeatureVisualDirective, FeatureDecorationDirective } from '@hive-academy/angular-gsap';

// Split Panel Components (1 component + 5 directives)
export { SplitPanelSectionComponent, SplitPanelImageDirective, SplitPanelBadgeDirective, SplitPanelTitleDirective, SplitPanelDescriptionDirective, SplitPanelFeaturesDirective } from '@hive-academy/angular-gsap';

// Other Components (1 component)
export { ParallaxSplitScrollComponent } from '@hive-academy/angular-gsap';

// Services (2 services)
export { GsapCoreService } from '@hive-academy/angular-gsap';
export { LenisSmoothScrollService, LenisServiceOptions, LenisScrollEvent } from '@hive-academy/angular-gsap';

// Providers (Modern Angular pattern)
export { provideGsap, GSAP_CONFIG, GsapConfig, provideLenis, LENIS_CONFIG } from '@hive-academy/angular-gsap';
```

## Common Patterns

### Staggered Children

```html
<div
  scrollAnimation
  [scrollConfig]="{
    animation: 'slideUp',
    stagger: 0.1
  }"
>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```

### Progress-Based Updates

```html
<div
  scrollAnimation
  [scrollConfig]="{
    scrub: true,
    onUpdate: updateProgress
  }"
>
  Content
</div>
```

```typescript
updateProgress = (progress: number) => {
  this.progressSignal.set(progress * 100);
};
```

### Pinned Sections

```html
<section
  scrollAnimation
  [scrollConfig]="{
    pin: true,
    pinSpacing: true,
    start: 'top top',
    end: '+=100%'
  }"
>
  Pinned content
</section>
```
