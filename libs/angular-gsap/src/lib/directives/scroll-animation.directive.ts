/**
 * ScrollAnimationDirective - GSAP ScrollTrigger Integration
 *
 * Reusable directive for scroll-based animations using GSAP ScrollTrigger.
 * Provides declarative scroll animations with configurable options.
 *
 * Features:
 * - Scroll-triggered animations (fade, slide, scale, parallax, custom)
 * - SSR-compatible (browser-only plugin registration)
 * - Configurable trigger points and animation properties
 * - Automatic cleanup and performance optimization
 * - Works with DOM elements only
 *
 * Usage:
 * ```html
 * <!-- Simple fade-in on scroll -->
 * <h1 scrollAnimation>Title</h1>
 *
 * <!-- Custom animation -->
 * <div
 *   scrollAnimation
 *   [scrollConfig]="{
 *     animation: 'slideUp',
 *     start: 'top 80%',
 *     duration: 1.2,
 *     ease: 'power3.out'
 *   }"
 * >
 *   Content
 * </div>
 *
 * <!-- Parallax effect -->
 * <div
 *   scrollAnimation
 *   [scrollConfig]="{
 *     animation: 'parallax',
 *     speed: 0.5,
 *     scrub: true
 *   }"
 * >
 *   Parallax element
 * </div>
 * ```
 */

import {
  Directive,
  ElementRef,
  input,
  type OnDestroy,
  inject,
  effect,
  PLATFORM_ID,
  afterNextRender,
  Injector,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GsapCoreService } from '../services/gsap-core.service';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';

export type AnimationType =
  | 'fadeIn'
  | 'fadeOut'
  | 'slideUp'
  | 'slideDown'
  | 'slideLeft'
  | 'slideRight'
  | 'scaleIn'
  | 'scaleOut'
  | 'parallax'
  | 'custom';

export interface ScrollAnimationConfig {
  // Animation type
  animation?: AnimationType;

  // ScrollTrigger settings
  trigger?: string; // CSS selector or 'self' for the element itself
  start?: string; // e.g., 'top 80%', 'center center'
  end?: string; // e.g., 'bottom 20%'
  scrub?: boolean | number; // Link animation to scroll progress
  pin?: boolean; // Pin the element during scroll
  pinSpacing?: boolean; // Add spacing when pinning (default: true)
  markers?: boolean; // Show debug markers (dev only)

  // Animation properties
  duration?: number; // Animation duration in seconds
  delay?: number; // Animation delay in seconds
  ease?: string; // GSAP easing function
  stagger?: number; // Stagger delay for child elements

  // Parallax settings
  speed?: number; // Parallax speed (0.5 = half speed, 2 = double speed)
  yPercent?: number; // Y-axis movement percentage
  xPercent?: number; // X-axis movement percentage

  // Custom animation properties
  from?: gsap.TweenVars; // Starting values
  to?: gsap.TweenVars; // Ending values

  // Callbacks
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
  onUpdate?: (progress: number) => void;

  // Performance
  once?: boolean; // Run animation only once
  toggleActions?: string; // 'play pause resume reset' etc.
}

@Directive({
  selector: '[scrollAnimation]',
  standalone: true,
})
export class ScrollAnimationDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private readonly gsapCore = inject(GsapCoreService);
  private scrollTrigger?: ScrollTrigger;
  private animation?: gsap.core.Tween | gsap.core.Timeline;
  private isInitialized = false;

  // Configuration input
  readonly scrollConfig = input<ScrollAnimationConfig>({
    animation: 'fadeIn',
    start: 'top 80%',
    duration: 1,
    ease: 'power2.out',
  });

  constructor() {
    // React to config changes
    effect(() => {
      const config = this.scrollConfig();
      if (!config) {
        console.warn(
          '[ScrollAnimation] Config is undefined, skipping animation'
        );
        return;
      }

      if (this.isInitialized && isPlatformBrowser(this.platformId)) {
        this.cleanup();
        afterNextRender(() => this.initializeAnimation(config), {
          injector: this.injector,
        });
      }
    });

    // Initialize after render (browser only)
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(
        () => {
          const config = this.scrollConfig();
          if (config) {
            this.initializeAnimation(config);
          }
        },
        { injector: this.injector }
      );
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeAnimation(config: ScrollAnimationConfig): void {
    const element = this.elementRef.nativeElement;

    // Safety check: Ensure this is a DOM element, not a Three.js object
    if (!element || !(element instanceof HTMLElement)) {
      console.warn(
        '[ScrollAnimation] Directive can only be applied to DOM elements'
      );
      return;
    }

    // Determine animation based on type
    const animationProps = this.getAnimationProperties(config);

    // Create GSAP timeline (paused by default to prevent auto-play)
    const gsap = this.gsapCore.gsap;
    const ScrollTrigger = this.gsapCore.scrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn(
        '[ScrollAnimation] GSAP not available (SSR or not initialized)'
      );
      return;
    }

    const timeline = gsap.timeline({
      paused: true,
    });
    timeline.fromTo(element, animationProps.from, animationProps.to);
    this.animation = timeline;

    // Create ScrollTrigger with the timeline
    this.scrollTrigger = ScrollTrigger.create({
      trigger:
        config.trigger === 'self' || !config.trigger ? element : config.trigger,
      start: config.start ?? 'top 80%',
      end: config.end,
      scrub: config.scrub ?? false,
      pin: config.pin ?? false,
      pinSpacing: config.pinSpacing ?? true, // Default to true (GSAP default)
      markers: config.markers ?? false, // Enable with markers: true in config
      animation: timeline,
      once: config.once ?? false,
      toggleActions: config.toggleActions ?? 'play none none none',
      onEnter: () => {
        config.onEnter?.();
      },
      onLeave: () => {
        config.onLeave?.();
      },
      onEnterBack: () => {
        config.onEnterBack?.();
      },
      onLeaveBack: () => {
        config.onLeaveBack?.();
      },
      onUpdate: (self) => {
        config.onUpdate?.(self.progress);
      },
      onRefresh: () => {
        // Optional: Add refresh handler if needed
      },
    });

    this.isInitialized = true;
  }

  private getAnimationProperties(config: ScrollAnimationConfig): {
    from: gsap.TweenVars;
    to: gsap.TweenVars;
  } {
    // Safety check: Validate config object
    if (!config || typeof config !== 'object') {
      console.error('[ScrollAnimation] Invalid config object:', config);
      return {
        from: { opacity: 0 },
        to: { opacity: 1, duration: 1, ease: 'power2.out' },
      };
    }

    const duration = config.duration ?? 1;
    const delay = config.delay ?? 0;
    const ease = config.ease ?? 'power2.out';

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
          from: { y: 100, opacity: 0 },
          to: { y: 0, opacity: 1, duration, delay, ease },
        };

      case 'slideDown':
        return {
          from: { y: -100, opacity: 0 },
          to: { y: 0, opacity: 1, duration, delay, ease },
        };

      case 'slideLeft':
        return {
          from: { x: 100, opacity: 0 },
          to: { x: 0, opacity: 1, duration, delay, ease },
        };

      case 'slideRight':
        return {
          from: { x: -100, opacity: 0 },
          to: { x: 0, opacity: 1, duration, delay, ease },
        };

      case 'scaleIn':
        return {
          from: { scale: 0.8, opacity: 0 },
          to: { scale: 1, opacity: 1, duration, delay, ease },
        };

      case 'scaleOut':
        return {
          from: { scale: 1.2, opacity: 0 },
          to: { scale: 1, opacity: 1, duration, delay, ease },
        };

      case 'parallax': {
        // True parallax: element moves at a different speed than scroll
        // speed < 1: moves slower (background effect)
        // speed > 1: moves faster (foreground effect)
        const speed = config.speed ?? 0.5;
        const movement = (1 - speed) * 100; // Calculate movement based on speed differential
        return {
          from: {
            yPercent: -movement / 2,
            xPercent: config.xPercent ?? 0,
          },
          to: {
            yPercent: movement / 2,
            xPercent: config.xPercent ?? 0,
            ease: 'none', // Parallax should be linear
          },
        };
      }

      default:
        return {
          from: { opacity: 0 },
          to: { opacity: 1, duration, delay, ease },
        };
    }
  }

  private cleanup(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = undefined;
    }
    if (this.animation) {
      this.animation.kill();
      this.animation = undefined;
    }
    this.isInitialized = false;
  }

  /**
   * Public API: Manually refresh ScrollTrigger
   *
   * Useful when content changes dynamically or container size changes.
   * Call this method to recalculate ScrollTrigger start/end points.
   *
   * @example
   * ```typescript
   * // In component after data loads
   * @ViewChild(ScrollAnimationDirective) animation!: Scroll AnimationDirective;
   *
   * ngAfterViewInit(): void {
   *   this.dataService.load().subscribe(() => {
   *     this.animation.refresh(); // Recalculate triggers
   *   });
   * }
   * ```
   */
  public refresh(): void {
    this.scrollTrigger?.refresh();
  }

  /**
   * Public API: Get current scroll progress (0-1)
   *
   * Returns the current scroll progress as a number between 0 and 1.
   * Useful for creating custom progress indicators or syncing other animations.
   *
   * @returns Current scroll progress (0 = start, 1 = end)
   *
   * @example
   * ```typescript
   * @ViewChild(ScrollAnimationDirective) animation!: ScrollAnimationDirective;
   *
   * ngAfterViewInit(): void {
   *   setInterval(() => {
   *     const progress = this.animation.getProgress();
   *     console.log(`Animation is ${(progress * 100).toFixed(0)}% complete`);
   *   }, 1000);
   * }
   * ```
   */
  public getProgress(): number {
    return this.scrollTrigger?.progress ?? 0;
  }

  /**
   * Public API: Enable/disable the scroll trigger
   *
   * Allows you to dynamically enable or disable the animation based on
   * application state, user preferences, or other conditions.
   *
   * @param enabled - True to enable the animation, false to disable
   *
   * @example
   * ```typescript
   * @ViewChild(ScrollAnimationDirective) animation!: ScrollAnimationDirective;
   *
   * toggleAnimations(enabled: boolean): void {
   *   this.animation.setEnabled(enabled);
   * }
   * ```
   */
  public setEnabled(enabled: boolean): void {
    if (enabled) {
      this.scrollTrigger?.enable();
    } else {
      this.scrollTrigger?.disable();
    }
  }
}
