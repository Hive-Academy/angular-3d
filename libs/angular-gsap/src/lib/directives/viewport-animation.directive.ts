/**
 * ViewportAnimationDirective - Animate Elements When They Enter the Viewport
 *
 * A lightweight directive that triggers GSAP animations when an element
 * enters the viewport using IntersectionObserver. Unlike ScrollAnimationDirective
 * which ties animations to scroll progress, this simply plays animations
 * when elements become visible.
 *
 * Features:
 * - Uses native IntersectionObserver (no ScrollTrigger dependency)
 * - One-shot or reversible animations
 * - Configurable visibility threshold
 * - Multiple animation presets + custom animations
 * - SSR-compatible (browser-only execution)
 * - Stagger support for child elements
 *
 * Usage:
 * ```html
 * <!-- Simple fade-in when element enters viewport -->
 * <h1 viewportAnimation>Title</h1>
 *
 * <!-- Slide up with custom config -->
 * <div
 *   viewportAnimation
 *   [viewportConfig]="{
 *     animation: 'slideUp',
 *     duration: 0.8,
 *     threshold: 0.2,
 *     once: true
 *   }"
 * >
 *   Content
 * </div>
 *
 * <!-- Custom animation -->
 * <div
 *   viewportAnimation
 *   [viewportConfig]="{
 *     animation: 'custom',
 *     from: { opacity: 0, scale: 0.8, rotation: -10 },
 *     to: { opacity: 1, scale: 1, rotation: 0 }
 *   }"
 * >
 *   Custom animated element
 * </div>
 *
 * <!-- Staggered children -->
 * <ul viewportAnimation [viewportConfig]="{ stagger: 0.1, staggerTarget: 'li' }">
 *   <li>Item 1</li>
 *   <li>Item 2</li>
 *   <li>Item 3</li>
 * </ul>
 * ```
 */

import {
  Directive,
  ElementRef,
  input,
  output,
  type OnDestroy,
  inject,
  PLATFORM_ID,
  afterNextRender,
  Injector,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GsapCoreService } from '../services/gsap-core.service';

/**
 * Animation preset types available for viewport animations.
 */
export type ViewportAnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'scaleOut'
  | 'rotateIn'
  | 'flipIn'
  | 'bounceIn'
  | 'custom';

/**
 * Configuration options for viewport-triggered animations.
 */
export interface ViewportAnimationConfig {
  /**
   * Animation preset to use.
   * Use 'custom' with `from`/`to` for custom animations.
   * @default 'fadeIn'
   */
  animation?: ViewportAnimationType;

  /**
   * Animation duration in seconds.
   * @default 0.6
   */
  duration?: number;

  /**
   * Animation delay in seconds.
   * @default 0
   */
  delay?: number;

  /**
   * GSAP easing function.
   * @default 'power2.out'
   */
  ease?: string;

  /**
   * Visibility threshold (0-1) to trigger animation.
   * 0 = any part visible, 1 = fully visible.
   * @default 0.1
   */
  threshold?: number;

  /**
   * Root margin for IntersectionObserver.
   * Useful for triggering before element is visible.
   * @default '0px'
   */
  rootMargin?: string;

  /**
   * If true, animation only plays once.
   * If false, animation reverses when leaving viewport.
   * @default true
   */
  once?: boolean;

  /**
   * Stagger delay for animating children.
   * Only used when animating multiple elements.
   * @default 0
   */
  stagger?: number;

  /**
   * CSS selector for stagger targets.
   * If not specified, stagger applies to direct children.
   * @example 'li', '.card', '[data-animate]'
   */
  staggerTarget?: string;

  /**
   * Custom starting values (for 'custom' animation type).
   */
  from?: gsap.TweenVars;

  /**
   * Custom ending values (for 'custom' animation type).
   */
  to?: gsap.TweenVars;

  /**
   * Distance for slide animations in pixels.
   * @default 50
   */
  distance?: number;

  /**
   * Scale factor for scale animations.
   * @default 0.9
   */
  scale?: number;

  /**
   * Rotation angle for rotate animations in degrees.
   * @default 15
   */
  rotation?: number;

  /**
   * Optional signal or function that must return true before animation plays.
   * Useful for coordinating with loading states or other async conditions.
   * The animation will wait until this condition is met AND the element is in viewport.
   * @example waitFor: () => preloadState.isReady()
   */
  waitFor?: () => boolean;
}

@Directive({
  selector: '[viewportAnimation]',
  standalone: true,
})
export class ViewportAnimationDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly gsapCore = inject(GsapCoreService);

  private observer?: IntersectionObserver;
  private animation?: gsap.core.Tween | gsap.core.Timeline;
  private hasAnimated = false;
  private isInViewport = false; // Track if element is currently in viewport
  private waitForInterval?: ReturnType<typeof setInterval>; // Polling for waitFor condition

  /**
   * Configuration input for the viewport animation.
   */
  readonly viewportConfig = input<ViewportAnimationConfig>({
    animation: 'fadeIn',
    duration: 0.6,
    delay: 0,
    ease: 'power2.out',
    threshold: 0.1,
    rootMargin: '0px',
    once: true,
  });

  /**
   * Emits when element enters the viewport.
   */
  readonly viewportEnter = output<void>();

  /**
   * Emits when element leaves the viewport.
   */
  readonly viewportLeave = output<void>();

  /**
   * Emits when animation completes.
   */
  readonly animationComplete = output<void>();

  public constructor() {
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(
        () => {
          this.initializeObserver();
        },
        { injector: this.injector }
      );
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize IntersectionObserver for viewport detection.
   */
  private initializeObserver(): void {
    const element = this.elementRef.nativeElement;

    if (!element || !(element instanceof HTMLElement)) {
      console.warn(
        '[ViewportAnimation] Directive can only be applied to DOM elements'
      );
      return;
    }

    const config = this.viewportConfig();

    // Set initial state (hidden)
    this.setInitialState(element, config);

    // Create IntersectionObserver
    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries),
      {
        root: null,
        rootMargin: config.rootMargin ?? '0px',
        threshold: config.threshold ?? 0.1,
      }
    );

    this.observer.observe(element);
  }

  /**
   * Handle intersection changes.
   */
  private handleIntersection(entries: IntersectionObserverEntry[]): void {
    const config = this.viewportConfig();

    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        this.isInViewport = true;
        this.viewportEnter.emit();

        // Only animate if not already animated (for once: true)
        if (!this.hasAnimated || !config.once) {
          this.tryPlayAnimation();
        }
      } else {
        this.isInViewport = false;
        // Clear waitFor polling when leaving viewport
        this.clearWaitForPolling();

        if (!config.once && this.hasAnimated) {
          this.viewportLeave.emit();
          this.reverseAnimation();
        }
      }
    });
  }

  /**
   * Try to play animation, respecting waitFor condition.
   * If waitFor is defined and returns false, starts polling until it returns true.
   */
  private tryPlayAnimation(): void {
    const config = this.viewportConfig();

    // If no waitFor or waitFor returns true, play immediately
    if (!config.waitFor || config.waitFor()) {
      this.playAnimation();
      return;
    }

    // Start polling for waitFor condition (check every 100ms)
    this.clearWaitForPolling();
    this.waitForInterval = setInterval(() => {
      // Check if still in viewport and waitFor is now true
      if (this.isInViewport && config.waitFor?.()) {
        this.clearWaitForPolling();
        this.playAnimation();
      }
    }, 100);
  }

  /**
   * Clear waitFor polling interval.
   */
  private clearWaitForPolling(): void {
    if (this.waitForInterval) {
      clearInterval(this.waitForInterval);
      this.waitForInterval = undefined;
    }
  }

  /**
   * Set initial hidden state before animation.
   */
  private setInitialState(
    element: HTMLElement,
    config: ViewportAnimationConfig
  ): void {
    const gsap = this.gsapCore.gsap;
    if (!gsap) return;

    const props = this.getAnimationProperties(config);
    gsap.set(element, props.from);
  }

  /**
   * Play the enter animation.
   */
  private playAnimation(): void {
    const element = this.elementRef.nativeElement;
    const config = this.viewportConfig();
    const gsap = this.gsapCore.gsap;

    if (!gsap) return;

    const props = this.getAnimationProperties(config);

    // Handle staggered children
    if (config.stagger && config.stagger > 0) {
      const targets = config.staggerTarget
        ? element.querySelectorAll(config.staggerTarget)
        : element.children;

      if (targets.length > 0) {
        // Set initial state on all children
        gsap.set(targets, props.from);

        this.animation = gsap.to(targets, {
          ...props.to,
          stagger: config.stagger,
          onComplete: () => {
            this.animationComplete.emit();
          },
        });
      }
    } else {
      // Single element animation
      this.animation = gsap.to(element, {
        ...props.to,
        onComplete: () => {
          this.animationComplete.emit();
        },
      });
    }

    this.hasAnimated = true;
  }

  /**
   * Reverse animation when leaving viewport.
   */
  private reverseAnimation(): void {
    if (this.animation) {
      this.animation.reverse();
    }
  }

  /**
   * Get animation properties based on config.
   */
  private getAnimationProperties(config: ViewportAnimationConfig): {
    from: gsap.TweenVars;
    to: gsap.TweenVars;
  } {
    const duration = config.duration ?? 0.6;
    const delay = config.delay ?? 0;
    const ease = config.ease ?? 'power2.out';
    const distance = config.distance ?? 50;
    const scale = config.scale ?? 0.9;
    const rotation = config.rotation ?? 15;

    // Handle custom animations
    if (config.animation === 'custom' && config.from && config.to) {
      return {
        from: config.from,
        to: {
          ...config.to,
          duration,
          delay,
          ease,
        },
      };
    }

    // Predefined animations
    switch (config.animation) {
      case 'fadeIn':
        return {
          from: { opacity: 0 },
          to: { opacity: 1, duration, delay, ease },
        };

      case 'fadeOut':
        return {
          from: { opacity: 1 },
          to: { opacity: 0, duration, delay, ease },
        };

      case 'slideUp':
        return {
          from: { y: distance, opacity: 0 },
          to: { y: 0, opacity: 1, duration, delay, ease },
        };

      case 'slideDown':
        return {
          from: { y: -distance, opacity: 0 },
          to: { y: 0, opacity: 1, duration, delay, ease },
        };

      case 'slideLeft':
        return {
          from: { x: distance, opacity: 0 },
          to: { x: 0, opacity: 1, duration, delay, ease },
        };

      case 'slideRight':
        return {
          from: { x: -distance, opacity: 0 },
          to: { x: 0, opacity: 1, duration, delay, ease },
        };

      case 'scaleIn':
        return {
          from: { scale: scale, opacity: 0 },
          to: { scale: 1, opacity: 1, duration, delay, ease },
        };

      case 'scaleOut':
        return {
          from: { scale: 1 / scale, opacity: 0 },
          to: { scale: 1, opacity: 1, duration, delay, ease },
        };

      case 'rotateIn':
        return {
          from: { rotation: rotation, opacity: 0, transformOrigin: 'center' },
          to: {
            rotation: 0,
            opacity: 1,
            duration,
            delay,
            ease,
            transformOrigin: 'center',
          },
        };

      case 'flipIn':
        return {
          from: { rotationY: 90, opacity: 0, transformPerspective: 1000 },
          to: {
            rotationY: 0,
            opacity: 1,
            duration,
            delay,
            ease: 'power2.out',
            transformPerspective: 1000,
          },
        };

      case 'bounceIn':
        return {
          from: { scale: 0.3, opacity: 0 },
          to: {
            scale: 1,
            opacity: 1,
            duration,
            delay,
            ease: 'elastic.out(1, 0.5)',
          },
        };

      default:
        return {
          from: { opacity: 0 },
          to: { opacity: 1, duration, delay, ease },
        };
    }
  }

  /**
   * Cleanup resources.
   */
  private cleanup(): void {
    this.clearWaitForPolling();
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    if (this.animation) {
      this.animation.kill();
      this.animation = undefined;
    }
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Manually trigger the animation.
   * Useful for re-playing animations after initial trigger.
   *
   * @example
   * ```typescript
   * @ViewChild(ViewportAnimationDirective) animation!: ViewportAnimationDirective;
   *
   * replay(): void {
   *   this.animation.replay();
   * }
   * ```
   */
  public replay(): void {
    this.hasAnimated = false;
    this.playAnimation();
  }

  /**
   * Reset element to initial (hidden) state.
   *
   * @example
   * ```typescript
   * @ViewChild(ViewportAnimationDirective) animation!: ViewportAnimationDirective;
   *
   * reset(): void {
   *   this.animation.reset();
   * }
   * ```
   */
  public reset(): void {
    const element = this.elementRef.nativeElement;
    const config = this.viewportConfig();

    if (this.animation) {
      this.animation.kill();
      this.animation = undefined;
    }

    this.hasAnimated = false;
    this.setInitialState(element, config);
  }
}
