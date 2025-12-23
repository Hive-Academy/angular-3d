/**
 * HijackedScrollDirective - Scroll-Jacking Container
 *
 * Creates scroll-jacked sequences where the viewport is pinned while
 * scrolling through steps. Core pattern for interactive presentations,
 * tutorials, and step-by-step content.
 *
 * **SSR Compatible**: Only initializes GSAP in browser environment
 *
 * Features:
 * - Pins viewport during scroll sequence
 * - Coordinates animations across multiple steps
 * - Emits current step and scroll progress
 * - Configurable scroll height and timing
 * - Works with any content type (not just code)
 *
 * Usage:
 * ```html
 * <div
 *   hijackedScroll
 *   [scrollHeightPerStep]="100"
 *   [animationDuration]="0.3"
 *   (currentStepChange)="onStepChange($event)"
 *   (progressChange)="onProgress($event)"
 * >
 *   <div hijackedScrollItem slideDirection="left">
 *     <h2>Step 1</h2>
 *     <p>Content...</p>
 *   </div>
 *   <div hijackedScrollItem slideDirection="right">
 *     <h2>Step 2</h2>
 *     <p>More content...</p>
 *   </div>
 * </div>
 * ```
 */

import {
  Directive,
  ElementRef,
  input,
  output,
  type OnDestroy,
  inject,
  effect,
  contentChildren,
  Injector,
  afterNextRender,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { GsapCoreService } from '../../services/gsap-core.service';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { HijackedScrollItemDirective } from './hijacked-scroll-item.directive';

export interface HijackedScrollConfig {
  scrollHeightPerStep?: number; // vh per step (default: 100)
  animationDuration?: number; // animation duration in seconds (default: 0.3)
  ease?: string; // GSAP easing function (default: 'power2.out')
  markers?: boolean; // show debug markers (default: false)
  minHeight?: string; // minimum container height (default: '70vh')
  start?: string; // ScrollTrigger start point (default: 'top top')
  end?: string; // ScrollTrigger end point (default: calculated from steps)
}

@Directive({
  selector: '[hijackedScroll]',
  standalone: true,
})
export class HijackedScrollDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly gsapCore = inject(GsapCoreService);
  private scrollTrigger?: ScrollTrigger;
  private masterTimeline?: gsap.core.Timeline;

  // Query all child step items using signal-based API
  readonly items = contentChildren(HijackedScrollItemDirective, {
    descendants: true,
  });

  // Configuration inputs
  readonly scrollHeightPerStep = input<number>(100); // vh per step
  readonly animationDuration = input<number>(0.3); // seconds
  readonly ease = input<string>('power2.out');
  readonly markers = input<boolean>(false);
  readonly minHeight = input<string>('100vh');
  readonly start = input<string>('top top'); // ScrollTrigger start point
  readonly end = input<string | undefined>(undefined); // ScrollTrigger end point (optional)
  readonly scrub = input<number>(1); // ScrollTrigger scrub value (default: 1)
  readonly stepHold = input<number>(0); // Multiplier of animation duration to hold after each step
  readonly showFirstStepImmediately = input<boolean>(true); // Show first step visible before scrolling

  // Event outputs
  readonly currentStepChange = output<number>();
  readonly progressChange = output<number>();

  constructor() {
    // React to items changes and initialize
    effect(() => {
      const itemsList = this.items();

      if (itemsList.length > 0 && isPlatformBrowser(this.platformId)) {
        // Clean up previous instance
        this.cleanup();

        // Initialize after next render to ensure DOM is ready
        afterNextRender(
          () => {
            this.initializeHijackedScroll();
          },
          { injector: this.injector }
        );
      }
    });

    // React to configuration changes (only re-init if already initialized)
    effect(() => {
      this.animationDuration();
      this.ease();
      this.markers();
      this.markers();
      this.scrub();
      this.stepHold();
      this.showFirstStepImmediately();

      // Re-initialize if already initialized and has items
      if (
        this.scrollTrigger &&
        this.items().length > 0 &&
        isPlatformBrowser(this.platformId)
      ) {
        this.cleanup();
        this.initializeHijackedScroll();
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeHijackedScroll(): void {
    const container = this.elementRef.nativeElement as HTMLElement;
    const items = this.items(); // Get signal value
    const totalSteps = items.length;

    if (totalSteps === 0) {
      console.warn('[HijackedScroll] No items found');
      return;
    }

    const gsap = this.gsapCore.gsap;
    const ScrollTrigger = this.gsapCore.scrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn(
        '[HijackedScroll] GSAP not available (SSR or not initialized)'
      );
      return;
    }

    // Set minimum height on container
    container.style.minHeight = this.minHeight();
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Create master timeline
    this.masterTimeline = gsap.timeline({
      paused: true,
    });

    // Track accumulated time for variable holds
    let currentTime = 0;
    const holdDuration = this.stepHold();
    const showFirstImmediately = this.showFirstStepImmediately();

    // Animate each step
    items.forEach((item, index) => {
      const element = item.getElement();
      const config = item.getConfig();
      const slideOffset = item.getSlideOffset();

      // Ensure absolute positioning
      element.style.position = 'absolute';
      element.style.inset = '0';
      element.style.display = 'flex';
      element.style.alignItems = 'flex-start';

      // Find decoration element for this step (if exists)
      const decoration = element.querySelector(
        `[data-decoration-index="${index}"]`
      ) as HTMLElement;
      const decorationInner = decoration?.querySelector(
        '.decoration-inner'
      ) as HTMLElement;

      // Build initial state (from)
      const fromState: gsap.TweenVars = {
        opacity: config.fadeIn ? 0 : 1,
        x: slideOffset.x,
        y: slideOffset.y,
        scale: config.scale ? 0.95 : 1,
        ...config.customFrom,
      };

      // Build target state (to)
      const toState: gsap.TweenVars = {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration: this.animationDuration(),
        ease: this.ease(),
        ...config.customTo,
      };

      // Build exit state
      const exitState: gsap.TweenVars = {
        opacity: config.fadeIn ? 0 : 1,
        x: -slideOffset.x,
        y: -slideOffset.y,
        scale: config.scale ? 0.95 : 1,
        duration: this.animationDuration(),
        ease: this.ease(),
      };

      // For the first step with showFirstStepImmediately, show it already visible
      if (index === 0 && showFirstImmediately) {
        // First step starts visible (no animation needed for entrance)
        this.masterTimeline?.set(
          element,
          {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
          },
          0
        );
      } else {
        // Set initial state for other steps (or first step if not immediate)
        this.masterTimeline?.set(element, fromState, 0);
      }

      // Add fade in animation
      const stepStartTime = currentTime;

      // For the first step with showFirstImmediately, skip the fade-in (already visible)
      // Just let it exit when scrolling starts
      if (index === 0 && showFirstImmediately) {
        // First step is already visible, no need to animate in
        // Timeline starts with first step visible, then transitions out
      } else {
        // Other steps fade in at their designated time
        this.masterTimeline?.to(element, toState, stepStartTime);
      }

      // Add fade out animation (except for last step)
      if (index < totalSteps - 1) {
        // Exit happens after hold
        this.masterTimeline?.to(
          element,
          exitState,
          stepStartTime + 0.7 + holdDuration
        );
      }

      // Animate decoration during the step's visible period
      if (decorationInner) {
        // Set initial decoration state
        this.masterTimeline?.set(
          decorationInner,
          {
            rotation: 0,
            scale: 0.8,
            opacity: 0,
          },
          0
        );

        // Fade in and scale up decoration as step appears
        this.masterTimeline?.to(
          decorationInner,
          {
            rotation: 10,
            scale: 1,
            opacity: 1,
            duration: 0.4,
            ease: 'power2.out',
          },
          stepStartTime
        );

        // Continue rotating/moving during step visibility
        this.masterTimeline?.to(
          decorationInner,
          {
            rotation: -10,
            scale: 1.1,
            duration: 0.5 + holdDuration, // Extend loop for hold
            ease: 'sine.inOut',
          },
          stepStartTime + 0.3
        );

        // Fade out decoration as step exits (if not last step)
        if (index < totalSteps - 1) {
          this.masterTimeline?.to(
            decorationInner,
            {
              rotation: 20,
              scale: 0.7,
              opacity: 0,
              duration: 0.3,
              ease: 'power2.in',
            },
            stepStartTime + 0.7 + holdDuration
          );
        }
      }

      // Increment time for next step
      // Base duration (1) + hold duration
      currentTime += 1 + holdDuration;
    });

    // Create ScrollTrigger
    this.scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: this.start(), // Configurable start point
      end: this.end() || `+=${totalSteps * this.scrollHeightPerStep()}vh`, // Configurable or calculated end
      pin: true,
      scrub: this.scrub(),
      animation: this.masterTimeline,
      markers: this.markers(),
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Calculate current step based on progress
        const currentStep = Math.floor(self.progress * totalSteps);
        const clampedStep = Math.min(currentStep, totalSteps - 1);

        this.currentStepChange.emit(clampedStep);
        this.progressChange.emit(self.progress);
      },
    });

    // Refresh ScrollTrigger
    ScrollTrigger.refresh();
  }

  private cleanup(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = undefined;
    }
    if (this.masterTimeline) {
      this.masterTimeline.kill();
      this.masterTimeline = undefined;
    }
  }

  /**
   * Public API: Manually refresh ScrollTrigger
   *
   * Recalculates ScrollTrigger measurements when container size changes.
   * Useful after window resize or dynamic content loading.
   *
   * @example
   * ```typescript
   * @ViewChild(HijackedScrollDirective) timeline!: HijackedScrollDirective;
   *
   * ngAfterViewInit(): void {
   *   window.addEventListener('resize', () => {
   *     this.timeline.refresh();
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
   * Returns the overall progress through the entire hijacked scroll sequence.
   *
   * @returns Current progress (0 = start, 1 = end)
   *
   * @example
   * ```typescript
   * @ViewChild(HijackedScrollDirective) timeline!: HijackedScrollDirective;
   *
   * getPercentComplete(): number {
   *   return Math.round(this.timeline.getProgress() * 100);
   * }
   * ```
   */
  public getProgress(): number {
    return this.scrollTrigger?.progress ?? 0;
  }

  /**
   * Public API: Jump to specific step
   *
   * Programmatically navigate to a specific step in the timeline.
   * Useful for skip buttons, progress nav, or keyboard shortcuts.
   *
   * @param stepIndex - Zero-based step index to jump to
   *
   * @example
   * ```typescript
   * @ViewChild(HijackedScrollDirective) timeline!: HijackedScrollDirective;
   *
   * skipToStep(index: number): void {
   *   this.timeline.jumpToStep(index);
   * }
   *
   * nextStep(): void {
   *   this.timeline.jumpToStep(this.currentStep + 1);
   * }
   * ```
   */
  public jumpToStep(stepIndex: number): void {
    const items = this.items(); // Get signal value
    if (stepIndex < 0 || stepIndex >= items.length) {
      console.warn('[HijackedScroll] Invalid step index:', stepIndex);
      return;
    }

    const progress = stepIndex / items.length;
    this.scrollTrigger?.scroll(progress);
  }
}
