# @hive-academy/angular-gsap

> 🎬 **GSAP-powered scroll animations for Angular applications**

A modern Angular library providing declarative, scroll-triggered animations using GSAP and ScrollTrigger. Create stunning scroll experiences with minimal code.

## ✨ Features

- 🎯 **Declarative API** - Configure animations via simple inputs
- 📜 **Scroll Triggers** - Animate elements based on scroll position
- 🎭 **Hijacked Scroll** - Create scroll-jacked step-by-step sequences
- 🌐 **SSR Compatible** - Safely handles server-side rendering
- 🎨 **10+ Built-in Animations** - Fade, slide, scale, parallax, and more
- 🔧 **Fully Customizable** - Use GSAP TweenVars for complete control
- 📦 **Tree-Shakeable** - Import only what you need
- 🎓 **TypeScript First** - Full type safety and IntelliSense support

> **Scope**: This library provides **DOM scroll animation utilities**. For Three.js object animations, see [`@hive-academy/angular-3d`](../angular-3d).

---

## 📦 Installation

```bash
npm install @hive-academy/angular-gsap gsap
```

**Peer Dependencies**:

- `@angular/core`: ^20.3.0
- `@angular/common`: ^20.3.0
- `gsap`: ^3.12.0

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

## 📖 Resources

- [GSAP Documentation](https://greensock.com/docs/)
- [ScrollTrigger Docs](https://greensock.com/docs/v3/Plugins/ScrollTrigger)
- [Angular Documentation](https://angular.dev)

---

## 🤝 Contributing

Contributions are welcome! Please follow the conventional commit format for all commits.

---

## 📄 License

MIT © Hive Academy

---

## 🔗 Related Packages

- [`@hive-academy/angular-3d`](../angular-3d) - Three.js integration for Angular (for 3D object animations)
