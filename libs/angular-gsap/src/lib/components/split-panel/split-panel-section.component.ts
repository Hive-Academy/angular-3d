import { Component, input, computed } from '@angular/core';
import { NgClass } from '@angular/common';
import { ScrollAnimationDirective } from '../../directives/scroll/scroll-animation.directive';

/**
 * SplitPanelSectionComponent - 50/50 Split Layout with Parallax and Animations
 *
 * A pre-made component for creating full-height split layouts with
 * a parallax background image on one side and animated text content
 * on the other. Perfect for feature showcases and product pages.
 *
 * Features:
 * - Full-height 50/50 split layout
 * - Parallax scrolling on image side (image scrolls faster than page)
 * - Staggered scroll animations for text content via scrollAnimation directive
 * - Gradient overlay for text readability
 * - Configurable layout direction
 * - Theme-aware accent colors
 *
 * @example
 * ```html
 * <agsp-split-panel-section
 *   [layout]="'image-right'"
 *   [parallaxSpeed]="0.3"
 *   [colorTheme]="'emerald'"
 * >
 *   <img splitPanelImage [ngSrc]="'feature.png'" fill alt="Feature" />
 *
 *   <div splitPanelBadge>
 *     <span>1</span>
 *   </div>
 *
 *   <h3 splitPanelTitle>ScrollAnimationDirective</h3>
 *
 *   <p splitPanelDescription>
 *     Apply scroll-triggered animations to any element...
 *   </p>
 *
 *   <div splitPanelFeatures>
 *     <div>10+ built-in animation types</div>
 *     <div>Custom from/to with GSAP TweenVars</div>
 *   </div>
 * </agsp-split-panel-section>
 * ```
 */
@Component({
  selector: 'agsp-split-panel-section',
  standalone: true,
  imports: [NgClass, ScrollAnimationDirective],
  template: `
    <!-- Full-Height Split Container -->
    <div class="relative min-h-screen flex w-full overflow-hidden">
      <!-- Image Side (Absolute positioned with parallax) -->
      <div
        class="absolute inset-y-0 w-1/2"
        [ngClass]="{
          'right-0': layout() === 'image-right',
          'left-0': layout() === 'image-left'
        }"
        scrollAnimation
        [scrollConfig]="{
          animation: 'custom',
          start: 'top 80%',
          end: 'top 30%',
          scrub: scrub(),
          from: { opacity: 0, scale: 1.1 },
          to: { opacity: 1, scale: 1 }
        }"
      >
        <!-- Parallax Image Container -->
        <div class="absolute inset-0 overflow-hidden">
          <!-- Gradient overlay for text readability -->
          <div
            class="absolute inset-0 z-10"
            [ngClass]="overlayGradientClasses()"
          ></div>

          <!-- Projected image content with parallax wrapper -->
          <div
            class="absolute inset-[-20%]"
            scrollAnimation
            [scrollConfig]="{
              animation: 'parallax',
              speed: parallaxSpeed(),
              scrub: true
            }"
          >
            <ng-content select="[splitPanelImage]" />
          </div>

          <!-- Accent glow overlay -->
          <div
            [ngClass]="accentOverlayClasses()"
            class="absolute inset-0 z-5"
          ></div>
        </div>
      </div>

      <!-- Text Content Side -->
      <div
        class="relative z-20 w-1/2 min-h-screen flex items-center"
        [ngClass]="{
          'ml-0': layout() === 'image-right',
          'ml-auto': layout() === 'image-left'
        }"
      >
        <div
          class="px-8 lg:px-16 py-20 max-w-2xl"
          [ngClass]="{
            'ml-auto': layout() === 'image-right',
            'mr-auto': layout() === 'image-left'
          }"
        >
          <!-- Badge -->
          <div class="mb-8" scrollAnimation [scrollConfig]="badgeAnimConfig()">
            <ng-content select="[splitPanelBadge]" />
          </div>

          <!-- Title -->
          <div class="mb-6" scrollAnimation [scrollConfig]="titleAnimConfig()">
            <ng-content select="[splitPanelTitle]" />
          </div>

          <!-- Description -->
          <div
            class="mb-8"
            scrollAnimation
            [scrollConfig]="descriptionAnimConfig()"
          >
            <ng-content select="[splitPanelDescription]" />
          </div>

          <!-- Features/Notes -->
          <div scrollAnimation [scrollConfig]="featuresAnimConfig()">
            <ng-content select="[splitPanelFeatures]" />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class SplitPanelSectionComponent {
  // Configuration inputs
  /**
   * Layout direction
   * 'image-right' = text on left, image on right
   * 'image-left' = text on right, image on left
   */
  readonly layout = input<'image-right' | 'image-left'>('image-right');

  /**
   * Parallax scroll speed (0.1 - 1.0)
   * Higher values = image scrolls faster relative to page
   */
  readonly parallaxSpeed = input<number>(0.5);

  /**
   * Color theme for accent colors
   */
  readonly colorTheme = input<'indigo' | 'emerald' | 'custom'>('emerald');

  /**
   * Scrub value for content animations (smaller = snappier)
   */
  readonly scrub = input<number>(0.8);

  // Computed: animation direction based on layout
  private readonly animationDirection = computed(() =>
    this.layout() === 'image-right' ? -1 : 1
  );

  // Computed animation configs for each content element
  readonly badgeAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 85%',
    end: 'top 45%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 60, scale: 0.8 },
    to: { opacity: 1, x: 0, scale: 1 },
  }));

  readonly titleAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 82%',
    end: 'top 40%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 80, y: 20 },
    to: { opacity: 1, x: 0, y: 0 },
  }));

  readonly descriptionAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 79%',
    end: 'top 35%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 60, y: 15 },
    to: { opacity: 1, x: 0, y: 0 },
  }));

  readonly featuresAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 76%',
    end: 'top 30%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 40, y: 10 },
    to: { opacity: 1, x: 0, y: 0 },
  }));

  // Computed classes
  readonly overlayGradientClasses = computed(() => {
    return this.layout() === 'image-right'
      ? 'bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent'
      : 'bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent';
  });

  readonly accentOverlayClasses = computed(() => {
    switch (this.colorTheme()) {
      case 'emerald':
        return 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10';
      case 'indigo':
        return 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10';
      default:
        return 'bg-gradient-to-br from-emerald-500/10 to-cyan-500/10';
    }
  });
}
