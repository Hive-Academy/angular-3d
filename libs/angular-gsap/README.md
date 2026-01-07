# @hive-academy/angular-gsap

[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-gsap.svg)](https://www.npmjs.com/package/@hive-academy/angular-gsap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE)

> 🎬 **GSAP-powered scroll animations for Angular applications**

A modern Angular library providing declarative, scroll-triggered animations using GSAP and ScrollTrigger. Create stunning scroll experiences with minimal code.

## ✨ Features

- 🎯 **Declarative API** - Configure animations via simple inputs
- 📜 **Scroll Triggers** - Animate elements based on scroll position
- 👁️ **Viewport Animations** - Trigger animations when elements become visible
- 🎭 **Hijacked Scroll** - Create scroll-jacked step-by-step sequences
- 🌐 **SSR Compatible** - Safely handles server-side rendering
- 🎨 **12+ Built-in Animations** - Fade, slide, scale, parallax, bounce, flip, and more
- 🔧 **Fully Customizable** - Use GSAP TweenVars for complete control
- 📦 **Tree-Shakeable** - Import only what you need
- 🎓 **TypeScript First** - Full type safety and IntelliSense support

> **Scope**: This library provides **DOM scroll animation utilities**. For Three.js object animations, see [`@hive-academy/angular-3d`](../angular-3d).

---

## 📦 Installation

```bash
npm install @hive-academy/angular-gsap gsap lenis
```

**Peer Dependencies**:

| Package           | Version | Purpose                      |
| ----------------- | ------- | ---------------------------- |
| `@angular/core`   | ~20.3.0 | Angular framework            |
| `@angular/common` | ~20.3.0 | Angular common utilities     |
| `gsap`            | ^3.14.2 | GreenSock Animation Platform |
| `lenis`           | ^1.3.16 | Smooth scroll library        |

---

## 🚀 Quick Start

### Example 1: Fade-in on Scroll

```typescript
import { Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: ` <h1 scrollAnimation>Welcome to Angular GSAP</h1> `,
})
export class HeroComponent {}
```

### Example 2: Parallax Effect

```typescript
import { Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-parallax',
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `
    <div
      scrollAnimation
      [scrollConfig]="{
        animation: 'parallax',
        speed: 0.5,
        scrub: true
      }"
      class="background-image"
    >
      Parallax Background
    </div>
  `,
})
export class ParallaxComponent {}
```

### Example 3: Hijacked Scroll Timeline

```typescript
import { Component } from '@angular/core';
import { HijackedScrollTimelineComponent, HijackedScrollItemDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-tutorial',
  standalone: true,
  imports: [HijackedScrollTimelineComponent, HijackedScrollItemDirective],
  template: `
    <agsp-hijacked-scroll-timeline [scrollHeightPerStep]="100" [animationDuration]="0.5">
      <div hijackedScrollItem [slideDirection]="'left'">
        <h2>Step 1</h2>
        <p>First concept explanation</p>
      </div>

      <div hijackedScrollItem [slideDirection]="'right'">
        <h2>Step 2</h2>
        <p>Second concept</p>
      </div>

      <div hijackedScrollItem [slideDirection]="'none'">
        <h2>Step 3</h2>
        <p>Final step</p>
      </div>
    </agsp-hijacked-scroll-timeline>
  `,
})
export class TutorialComponent {}
```

---

## 📚 API Reference

### ScrollAnimationDirective

Applies GSAP-powered scroll-triggered animations to DOM elements.

**Selector**: `[scrollAnimation]`

**Inputs**:

- `scrollConfig?: ScrollAnimationConfig` - Animation configuration

**Public Methods**:

- `refresh(): void` - Manually refresh ScrollTrigger
- `getProgress(): number` - Get current scroll progress (0-1)
- `setEnabled(enabled: boolean): void` - Enable/disable animation

**Built-in Animations**:

- `fadeIn`, `fadeOut` - Opacity transitions
- `slideUp`, `slideDown`, `slideLeft`, `slideRight` - Slide animations
- `scaleIn`, `scaleOut` - Scale transitions
- `parallax` - Parallax movement
- `custom` - Use custom `from`/`to` values

**Example with Custom Animation**:

```typescript
[scrollConfig]="{
  animation: 'custom',
  from: { scale: 0.8, rotation: -10, opacity: 0 },
  to: { scale: 1, rotation: 0, opacity: 1 },
  duration: 1.2,
  ease: 'back.out'
}"
```

---

### ViewportAnimationDirective

Triggers GSAP animations when elements enter the viewport using IntersectionObserver. Unlike `ScrollAnimationDirective` which links animations to scroll progress, this simply plays animations when elements become visible.

**Selector**: `[viewportAnimation]`

**Inputs**:

- `viewportConfig?: ViewportAnimationConfig` - Animation configuration

**Outputs**:

- `viewportEnter: void` - Emits when element enters viewport
- `viewportLeave: void` - Emits when element leaves viewport
- `animationComplete: void` - Emits when animation completes

**Public Methods**:

- `replay(): void` - Replay animation
- `reset(): void` - Reset element to initial hidden state

**Built-in Animations**:

- `fadeIn`, `fadeOut` - Opacity transitions
- `slideUp`, `slideDown`, `slideLeft`, `slideRight` - Slide animations
- `scaleIn`, `scaleOut` - Scale transitions
- `rotateIn` - Rotation animation
- `flipIn` - 3D flip animation
- `bounceIn` - Elastic bounce effect
- `custom` - Use custom `from`/`to` values

**Example - Simple fade-in**:

```typescript
import { Component } from '@angular/core';
import { ViewportAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ViewportAnimationDirective],
  template: ` <h1 viewportAnimation>I fade in when visible!</h1> `,
})
export class HeroComponent {}
```

**Example - Bounce-in effect**:

```html
<div
  viewportAnimation
  [viewportConfig]="{
    animation: 'bounceIn',
    duration: 0.8,
    threshold: 0.3
  }"
>
  ⚡ Bounces in when 30% visible
</div>
```

**Example - Staggered children**:

```html
<ul viewportAnimation [viewportConfig]="{ stagger: 0.1, staggerTarget: 'li' }">
  <li>Item 1 (appears first)</li>
  <li>Item 2 (0.1s delay)</li>
  <li>Item 3 (0.2s delay)</li>
</ul>
```

**ViewportAnimationConfig**:

```typescript
interface ViewportAnimationConfig {
  animation?: ViewportAnimationType; // 'fadeIn', 'slideUp', etc.
  duration?: number; // Default: 0.6
  delay?: number; // Default: 0
  ease?: string; // Default: 'power2.out'
  threshold?: number; // Visibility threshold 0-1, default: 0.1
  rootMargin?: string; // IntersectionObserver margin, default: '0px'
  once?: boolean; // Play once or reverse on leave, default: true
  stagger?: number; // Stagger delay for children
  staggerTarget?: string; // CSS selector for stagger targets
  from?: gsap.TweenVars; // Custom starting values
  to?: gsap.TweenVars; // Custom ending values
  distance?: number; // Slide distance in px, default: 50
  scale?: number; // Scale factor, default: 0.9
  rotation?: number; // Rotation degrees, default: 15
}
```

**When to use which directive**:

| Use Case                                 | Directive                    |
| ---------------------------------------- | ---------------------------- |
| Simple "appear when visible" animations  | `ViewportAnimationDirective` |
| Scroll-progress linked (parallax, scrub) | `ScrollAnimationDirective`   |
| Pinned/hijacked scroll sequences         | `HijackedScrollDirective`    |

---

### HijackedScrollDirective

Creates scroll-jacked sequences where viewport is pinned while scrolling through steps.

**Selector**: `[hijackedScroll]`

**Inputs**:

- `scrollHeightPerStep?: number` - Scroll height per step in vh (default: 100)
- `animationDuration?: number` - Animation duration in seconds (default: 0.3)
- `ease?: string` - GSAP easing function (default: 'power2.out')
- `markers?: boolean` - Show debug markers (default: false)
- `minHeight?: string` - Container minimum height (default: '100vh')
- `start?: string` - ScrollTrigger start point (default: 'top top')
- `end?: string` - ScrollTrigger end point (optional, auto-calculated)

**Outputs**:

- `currentStepChange: number` - Emits current step index
- `progressChange: number` - Emits scroll progress (0-1)

**Public Methods**:

- `refresh(): void` - Refresh ScrollTrigger calculations
- `getProgress(): number` - Get current progress
- `jumpToStep(index: number): void` - Jump to specific step

---

### HijackedScrollItemDirective

Marks elements as steps in a hijacked scroll sequence.

**Selector**: `[hijackedScrollItem]`

**Inputs**:

- `slideDirection?: 'left' | 'right' | 'up' | 'down' | 'none'` - Slide direction (default: 'none')
- `fadeIn?: boolean` - Enable fade animation (default: true)
- `scale?: boolean` - Enable scale animation (default: true)
- `customFrom?: Record<string, unknown>` - Custom GSAP from values
- `customTo?: Record<string, unknown>` - Custom GSAP to values

---

### HijackedScrollTimelineComponent

Convenience wrapper component for hijacked scroll with content projection.

**Selector**: `<agsp-hijacked-scroll-timeline>`

**Inputs**: Same as `HijackedScrollDirective` (pass-through)

**Outputs**: Same as `HijackedScrollDirective` (pass-through)

---

### ScrollTimelineComponent

Scroll-driven timeline with step indicators.

**Selector**: `<agsp-scroll-timeline>`

**Inputs**:

- `steps: StepData[]` - Array of step data
- `scrub?: boolean | number` - Link animation to scroll progress
- `markers?: boolean` - Show debug markers

---

### StepIndicatorComponent

Step indicator with progress visualization.

**Selector**: `<agsp-step-indicator>`

**Inputs**:

- `steps: StepData[]` - Array of step data
- `currentStep: number` - Currently active step index
- `progress: number` - Animation progress (0-1)

---

### Feature Showcase Components

#### FeatureShowcaseTimelineComponent

Scroll-driven feature showcase with alternating layouts.

**Selector**: `<agsp-feature-showcase-timeline>`

**Inputs**:

- `scrollHeightPerStep?: number` - Scroll height per feature (default: 150vh)
- `animationDuration?: number` - Animation duration in seconds
- `markers?: boolean` - Show debug markers

**Example**:

```html
<agsp-feature-showcase-timeline>
  <agsp-feature-step>
    <span featureBadge>1</span>
    <h3 featureTitle>Feature Title</h3>
    <p featureDescription>Feature description here.</p>
    <div featureNotes>
      <span>Note 1</span>
      <span>Note 2</span>
    </div>
    <img featureVisual src="feature.png" alt="Feature" />
    <div featureDecoration>
      <!-- Optional decorative element -->
    </div>
  </agsp-feature-step>
</agsp-feature-showcase-timeline>
```

#### FeatureStepComponent

Individual feature step container.

**Selector**: `<agsp-feature-step>`

---

### Split Panel Components

#### SplitPanelSectionComponent

Parallax split-panel layout with sticky positioning.

**Selector**: `<agsp-split-panel-section>`

**Inputs**:

- `imagePosition?: 'left' | 'right'` - Image side position
- `parallaxStrength?: number` - Parallax movement strength

**Example**:

```html
<agsp-split-panel-section [imagePosition]="'left'">
  <img splitPanelImage src="feature.png" alt="Feature" />
  <div splitPanelBadge>1</div>
  <h3 splitPanelTitle>Feature Title</h3>
  <p splitPanelDescription>Feature description.</p>
  <div splitPanelFeatures>
    <span>Feature 1</span>
    <span>Feature 2</span>
  </div>
</agsp-split-panel-section>
```

---

### ParallaxSplitScrollComponent

Container for parallax split-scroll sections.

**Selector**: `<agsp-parallax-split-scroll>`

---

## ⚙️ Configuration

### ScrollAnimationConfig

```typescript
interface ScrollAnimationConfig {
  // Animation type
  animation?: AnimationType;

  // ScrollTrigger settings
  trigger?: string; // CSS selector or 'self'
  start?: string; // e.g., 'top 80%'
  end?: string;
  scrub?: boolean | number; // Link to scroll
  pin?: boolean;
  markers?: boolean;

  // Animation properties
  duration?: number;
  delay?: number;
  ease?: string;

  // Parallax
  speed?: number;

  // Custom animations
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;

  // Callbacks
  onEnter?: () => void;
  onLeave?: () => void;
  onUpdate?: (progress: number) => void;

  // Performance
  once?: boolean; // Run only once
}
```

### SSR Compatibility

The library automatically handles server-side rendering:

- GSAP plugins register only in browser environment
- Animations initialize only after component renders
- No hydration mismatches

```typescript
// ✅ Safe - library handles SSR internally
<div scrollAnimation>Content</div>

// ✅ Safe - no additional guards needed
constructor() {
  // Library uses isPlatformBrowser() internally
}
```

---

## 🎯 Advanced Examples

### Staggered Animations

```typescript
<div
  *ngFor="let item of items; let i = index"
  scrollAnimation
  [scrollConfig]="{
    animation: 'fadeIn',
    delay: i * 0.1
  }"
>
  {{ item }}
</div>
```

### Scroll Progress Tracking

```typescript
import { Component } from '@angular/core';
import { HijackedScrollDirective, HijackedScrollItemDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-story',
  standalone: true,
  imports: [HijackedScrollDirective, HijackedScrollItemDirective],
  template: `
    <div hijackedScroll (currentStepChange)="onStepChange($event)" (progressChange)="onProgressChange($event)">
      <div hijackedScrollItem>Step 1</div>
      <div hijackedScrollItem>Step 2</div>
    </div>
    <div class="progress-bar" [style.width.%]="progress * 100"></div>
  `,
})
export class StoryComponent {
  currentStep = 0;
  progress = 0;

  onStepChange(step: number): void {
    this.currentStep = step;
    console.log('Current step:', step);
  }

  onProgressChange(progress: number): void {
    this.progress = progress;
  }
}
```

---

## 🎬 Live Demo

> Coming soon - Live demo application showcasing all animation types

---

## Directives Reference

### Scroll Directives

| Directive                   | Selector               | Description                      |
| --------------------------- | ---------------------- | -------------------------------- |
| ScrollAnimationDirective    | `[scrollAnimation]`    | Scroll-triggered GSAP animations |
| HijackedScrollDirective     | `[hijackedScroll]`     | Scroll hijacking container       |
| HijackedScrollItemDirective | `[hijackedScrollItem]` | Items within hijacked scroll     |
| ScrollSectionPinDirective   | `[scrollSectionPin]`   | Pin sections during scroll       |

### Other Directives

| Directive                  | Selector              | Description                     |
| -------------------------- | --------------------- | ------------------------------- |
| ViewportAnimationDirective | `[viewportAnimation]` | IntersectionObserver animations |
| SectionStickyDirective     | `[sectionSticky]`     | Sticky section behavior         |
| ParallaxSplitItemDirective | `[parallaxSplitItem]` | Parallax item in split layout   |
| LenisSmoothScrollDirective | `[lenisSmoothScroll]` | Enable Lenis smooth scrolling   |

### Feature Showcase Directives (Content Slots)

| Directive                   | Selector               | Description                   |
| --------------------------- | ---------------------- | ----------------------------- |
| FeatureBadgeDirective       | `[featureBadge]`       | Feature step badge slot       |
| FeatureTitleDirective       | `[featureTitle]`       | Feature step title slot       |
| FeatureDescriptionDirective | `[featureDescription]` | Feature step description slot |
| FeatureNotesDirective       | `[featureNotes]`       | Feature step notes slot       |
| FeatureVisualDirective      | `[featureVisual]`      | Feature step visual slot      |
| FeatureDecorationDirective  | `[featureDecoration]`  | Feature step decoration slot  |

### Split Panel Directives (Content Slots)

| Directive                      | Selector                  | Description                  |
| ------------------------------ | ------------------------- | ---------------------------- |
| SplitPanelImageDirective       | `[splitPanelImage]`       | Split panel image slot       |
| SplitPanelBadgeDirective       | `[splitPanelBadge]`       | Split panel badge slot       |
| SplitPanelTitleDirective       | `[splitPanelTitle]`       | Split panel title slot       |
| SplitPanelDescriptionDirective | `[splitPanelDescription]` | Split panel description slot |
| SplitPanelFeaturesDirective    | `[splitPanelFeatures]`    | Split panel features slot    |

---

## Services

### GsapCoreService

Core GSAP service for initialization and configuration.

**Methods**:

- `get gsap` - Access configured GSAP instance
- `registerPlugin(...plugins)` - Register additional GSAP plugins

**Example**:

```typescript
@Component({ ... })
export class MyComponent {
  private gsapCore = inject(GsapCoreService);

  animate() {
    this.gsapCore.gsap.to('.element', { x: 100, duration: 1 });
  }
}
```

---

### LenisSmoothScrollService

Lenis smooth scroll integration with GSAP.

**Methods**:

- `initialize(options?)` - Initialize Lenis with options
- `destroy()` - Clean up Lenis instance
- `scrollTo(target, options?)` - Scroll to target
- `stop()` / `start()` - Pause/resume smooth scrolling

**Properties**:

- `scroll$` - Observable of scroll events
- `progress$` - Observable of scroll progress (0-1)

**Example**:

```typescript
@Component({ ... })
export class MyComponent {
  private lenis = inject(LenisSmoothScrollService);

  scrollToSection() {
    this.lenis.scrollTo('#section-2', { duration: 1.5 });
  }
}
```

---

## Configuration Providers

### provideGsap()

Configures GSAP globally using Angular's modern provider pattern.

**Usage**:

```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideGsap } from '@hive-academy/angular-gsap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGsap({
      defaults: {
        ease: 'power2.out',
        duration: 1,
      },
    }),
  ],
};
```

**Options**:

```typescript
interface GsapConfig {
  defaults?: gsap.TweenVars; // Default tween properties
  plugins?: GSAPPlugin[]; // Additional plugins to register
}
```

---

### provideLenis()

Configures Lenis smooth scrolling globally.

**Usage**:

```typescript
// app.config.ts
import { provideGsap, provideLenis } from '@hive-academy/angular-gsap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGsap(), // GSAP must be provided first
    provideLenis({
      lerp: 0.1, // Smoothness (0.05-0.1 recommended)
      wheelMultiplier: 1, // Mouse wheel speed
      touchMultiplier: 2, // Touch swipe speed
      smoothWheel: true, // Smooth mouse wheel
    }),
  ],
};
```

**Options**:

```typescript
interface LenisServiceOptions {
  lerp?: number; // Smoothness factor
  wheelMultiplier?: number; // Mouse wheel sensitivity
  touchMultiplier?: number; // Touch sensitivity
  smoothWheel?: boolean; // Enable smooth wheel
  useGsapTicker?: boolean; // Sync with GSAP ticker
}
```

---

## 📖 Resources

- [GSAP Documentation](https://greensock.com/docs/)
- [ScrollTrigger Docs](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [Angular Documentation](https://angular.dev)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and follow the conventional commit format for all commits.

See [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for community guidelines.

---

## 📄 License

MIT © Hive Academy

---

## 🔗 Related Packages

- [`@hive-academy/angular-3d`](../angular-3d) - Three.js integration for Angular (for 3D object animations)
