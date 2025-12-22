/**
 * ParallaxSplitScrollComponent - Parallax Split-Screen Timeline
 *
 * Creates a pinned scroll sequence with 50/50 split layout where one side
 * shows a full-height parallax image and the other shows animated text content.
 *
 * **Key Differences from HijackedScrollTimeline:**
 * - Full-viewport-width split (not constrained by container)
 * - Persistent image background with parallax effect
 * - Crossfade between step images
 * - Alternating layout per step (text-left/image-right or vice-versa)
 *
 * **SSR Compatible**: Only initializes GSAP in browser environment
 *
 * Features:
 * - Pins viewport during scroll sequence
 * - 50/50 split with full-height image
 * - Parallax movement on both image and text
 * - Crossfade transitions for images
 * - Animated text entrance/exit
 * - Configurable scroll height and timing
 *
 * Usage:
 * ```html
 * <agsp-parallax-split-scroll [scrollHeightPerStep]="1200">
 *   <div parallaxSplitItem [imageSrc]="'/assets/step1.jpg'" [layout]="'left'">
 *     <h3>Step 1 Title</h3>
 *     <p>Description...</p>
 *   </div>
 *   <div parallaxSplitItem [imageSrc]="'/assets/step2.jpg'" [layout]="'right'">
 *     <h3>Step 2 Title</h3>
 *     <p>Description...</p>
 *   </div>
 * </agsp-parallax-split-scroll>
 * ```
 */

import {
  Component,
  ElementRef,
  input,
  output,
  inject,
  effect,
  contentChildren,
  Injector,
  afterNextRender,
  PLATFORM_ID,
  signal,
  type OnDestroy,
} from '@angular/core';
import { isPlatformBrowser, NgOptimizedImage, NgClass } from '@angular/common';
import { GsapCoreService } from '../services/gsap-core.service';
import type { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ParallaxSplitItemDirective } from '../directives/parallax-split-item.directive';

@Component({
  selector: 'agsp-parallax-split-scroll',
  standalone: true,
  imports: [NgOptimizedImage, NgClass],
  template: `
    <!-- Pinned container for split layout -->
    <div class="relative w-full min-h-screen">
      <!-- Image Side - Full width half, persistent during scroll -->
      @for (item of items(); track $index) {
      <div
        class="absolute inset-y-0 w-1/2 overflow-hidden transition-opacity duration-500"
        [class.right-0]="item.getConfig().layout === 'left'"
        [class.left-0]="item.getConfig().layout === 'right'"
        [class.opacity-100]="currentStep() === $index"
        [class.opacity-0]="currentStep() !== $index"
        [class.pointer-events-none]="currentStep() !== $index"
        [attr.data-step-image]="$index"
      >
        <!-- Parallax image container -->
        <div
          class="absolute inset-0 scale-110"
          [attr.data-parallax-image]="$index"
        >
          <img
            [ngSrc]="item.getConfig().imageSrc"
            [alt]="item.getConfig().imageAlt"
            fill
            priority
            class="object-cover"
          />
          <!-- Gradient overlay for text readability -->
          <div
            class="absolute inset-0 z-10"
            [ngClass]="
              item.getConfig().layout === 'left'
                ? 'bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent'
                : 'bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent'
            "
          ></div>
          <!-- Accent glow overlay -->
          <div
            class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 z-5"
          ></div>
        </div>
      </div>
      }

      <!-- Text Content Side -->
      @for (item of items(); track $index) {
      <div
        class="absolute z-20 w-1/2 min-h-screen flex items-center transition-opacity duration-500"
        [class.left-0]="item.getConfig().layout === 'left'"
        [class.right-0]="item.getConfig().layout === 'right'"
        [class.opacity-100]="currentStep() === $index"
        [class.opacity-0]="currentStep() !== $index"
        [class.pointer-events-none]="currentStep() !== $index"
        [attr.data-step-content]="$index"
      >
        <div
          class="px-16 py-20 max-w-2xl"
          [class.ml-auto]="item.getConfig().layout === 'left'"
          [class.mr-auto]="item.getConfig().layout === 'right'"
          [attr.data-text-content]="$index"
        >
          <!-- Projected content from parallaxSplitItem -->
          <ng-content
            [select]="'[parallaxSplitItem]:nth-child(' + ($index + 1) + ')'"
          />
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        position: relative;
      }
    `,
  ],
})
export class ParallaxSplitScrollComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly injector = inject(Injector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly gsapCore = inject(GsapCoreService);
  private scrollTrigger?: ScrollTrigger;
  private masterTimeline?: gsap.core.Timeline;

  // Query all child step items
  readonly items = contentChildren(ParallaxSplitItemDirective, {
    descendants: true,
  });

  // Configuration inputs
  readonly scrollHeightPerStep = input<number>(1200); // vh per step
  readonly animationDuration = input<number>(0.5); // seconds
  readonly ease = input<string>('power2.out');
  readonly markers = input<boolean>(false);
  readonly start = input<string>('top top');
  readonly end = input<string | undefined>(undefined);
  readonly parallaxSpeed = input<number>(0.3); // Image parallax movement speed

  // State
  readonly currentStep = signal(0);
  readonly progress = signal(0);

  // Event outputs
  readonly currentStepChange = output<number>();
  readonly progressChange = output<number>();

  constructor() {
    // React to items changes
    effect(() => {
      const itemsList = this.items();

      if (itemsList.length > 0 && isPlatformBrowser(this.platformId)) {
        this.cleanup();

        afterNextRender(
          () => {
            this.initializeParallaxScroll();
          },
          { injector: this.injector }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeParallaxScroll(): void {
    const container = this.elementRef.nativeElement as HTMLElement;
    const items = this.items();
    const totalSteps = items.length;

    if (totalSteps === 0) {
      console.warn('[ParallaxSplitScroll] No items found');
      return;
    }

    const gsap = this.gsapCore.gsap;
    const ScrollTrigger = this.gsapCore.scrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn(
        '[ParallaxSplitScroll] GSAP not available (SSR or not initialized)'
      );
      return;
    }

    // Set container styles
    container.style.minHeight = '100vh';
    container.style.position = 'relative';

    // Create master timeline
    this.masterTimeline = gsap.timeline({ paused: true });

    // Set up parallax animations for each image
    items.forEach((item, index) => {
      const imageEl = container.querySelector(
        `[data-parallax-image="${index}"]`
      ) as HTMLElement;
      const textEl = container.querySelector(
        `[data-text-content="${index}"]`
      ) as HTMLElement;

      if (imageEl) {
        // Calculate the scroll range for this step
        const stepStart = index / totalSteps;
        const stepEnd = (index + 1) / totalSteps;
        const stepDuration = stepEnd - stepStart;

        // Parallax effect: image moves slower than scroll
        const parallaxRange = 100 * this.parallaxSpeed();
        if (this.masterTimeline) {
          this.masterTimeline.fromTo(
            imageEl,
            { y: -parallaxRange },
            { y: parallaxRange, duration: stepDuration, ease: 'none' },
            stepStart
          );
        }
      }

      if (textEl) {
        // Text entrance animation at step start
        const stepStart = index / totalSteps;
        const entranceDuration = 0.15 / totalSteps;

        // Slide in from direction based on layout
        const layout = item.getConfig().layout;
        const xOffset = layout === 'left' ? -60 : 60;

        if (this.masterTimeline) {
          this.masterTimeline.fromTo(
            textEl,
            { opacity: 0, x: xOffset, y: 30 },
            {
              opacity: 1,
              x: 0,
              y: 0,
              duration: entranceDuration,
              ease: this.ease(),
            },
            stepStart
          );

          // Text exit animation before next step
          if (index < totalSteps - 1) {
            const exitStart = stepStart + 0.7 / totalSteps;
            const exitDuration = 0.15 / totalSteps;

            this.masterTimeline.to(
              textEl,
              {
                opacity: 0,
                x: -xOffset,
                y: -30,
                duration: exitDuration,
                ease: 'power2.in',
              },
              exitStart
            );
          }
        }
      }
    });

    // Create ScrollTrigger
    this.scrollTrigger = ScrollTrigger.create({
      trigger: container,
      start: this.start(),
      end: this.end() || `+=${totalSteps * this.scrollHeightPerStep()}`,
      pin: true,
      scrub: 1,
      animation: this.masterTimeline,
      markers: this.markers(),
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Calculate current step
        const stepProgress = self.progress * totalSteps;
        const newStep = Math.min(Math.floor(stepProgress), totalSteps - 1);

        if (newStep !== this.currentStep()) {
          this.currentStep.set(newStep);
          this.currentStepChange.emit(newStep);
        }

        this.progress.set(self.progress);
        this.progressChange.emit(self.progress);
      },
    });

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

  /** Public API: Refresh ScrollTrigger */
  public refresh(): void {
    this.scrollTrigger?.refresh();
  }

  /** Public API: Get current progress (0-1) */
  public getProgress(): number {
    return this.scrollTrigger?.progress ?? 0;
  }

  /** Public API: Jump to step */
  public jumpToStep(stepIndex: number): void {
    const items = this.items();
    if (stepIndex < 0 || stepIndex >= items.length) {
      console.warn('[ParallaxSplitScroll] Invalid step index:', stepIndex);
      return;
    }

    const progress = stepIndex / items.length;
    this.scrollTrigger?.scroll(progress);
  }
}
