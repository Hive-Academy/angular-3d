import { Component, input, computed } from '@angular/core';
import { ScrollSectionPinDirective } from '../../directives/scroll/scroll-section-pin.directive';
import { ScrollAnimationDirective } from '../../directives/scroll/scroll-animation.directive';

/**
 * FeatureStepComponent - Individual Feature Step with Staggered Animations
 *
 * A pre-made component that encapsulates the pattern of a pinned section
 * with staggered scroll animations for badge, title, description, notes,
 * and visual content.
 *
 * Features:
 * - Built-in section pinning via ScrollSectionPinDirective
 * - Staggered scroll animations via scrollAnimation directive
 * - Layout control (left/right alternating)
 * - Theme-aware styling
 * - Content projection with directive markers
 *
 * @example
 * ```html
 * <agsp-feature-step [layout]="'left'" [stepNumber]="1">
 *   <span featureBadge>1</span>
 *   <h3 featureTitle>Scene3D - Zero-Config 3D Canvas</h3>
 *   <p featureDescription>The Scene3D component handles...</p>
 *   <div featureNotes>
 *     <span>Automatic WebGL context management</span>
 *     <span>Built-in render loop</span>
 *   </div>
 *   <img featureVisual [src]="'image.png'" alt="Scene3D" />
 *   <div featureDecoration>
 *     <app-decorative-pattern [pattern]="'data-flow'" />
 *   </div>
 * </agsp-feature-step>
 * ```
 */
@Component({
  selector: 'agsp-feature-step',
  standalone: true,
  imports: [ScrollSectionPinDirective, ScrollAnimationDirective],
  template: `
    <section
      class="relative min-h-[80vh] py-24 flex items-center"
      scrollSectionPin
      [pinDuration]="pinDuration()"
      [start]="pinStart()"
      [anticipatePin]="anticipatePin()"
      [pinSpacing]="pinSpacing()"
    >
      <!-- Decoration slot (absolute positioned background) -->
      <div
        class="absolute inset-0 pointer-events-none overflow-hidden"
        scrollAnimation
        [scrollConfig]="decorationAnimConfig()"
      >
        <ng-content select="[featureDecoration]" />
      </div>

      <!-- Content Grid -->
      <div class="container mx-auto px-8 relative z-10">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <!-- Content Side -->
          <div [class]="contentOrderClasses()" class="space-y-0">
            <!-- Badge -->
            <div
              class="inline-flex items-center gap-3 mb-6"
              scrollAnimation
              [scrollConfig]="badgeAnimConfig()"
            >
              <ng-content select="[featureBadge]" />
            </div>

            <!-- Title -->
            <div scrollAnimation [scrollConfig]="titleAnimConfig()">
              <ng-content select="[featureTitle]" />
            </div>

            <!-- Description -->
            <div scrollAnimation [scrollConfig]="descriptionAnimConfig()">
              <ng-content select="[featureDescription]" />
            </div>

            <!-- Notes -->
            <div scrollAnimation [scrollConfig]="notesAnimConfig()">
              <ng-content select="[featureNotes]" />
            </div>
          </div>

          <!-- Visual Side -->
          <div
            [class]="visualOrderClasses()"
            scrollAnimation
            [scrollConfig]="visualAnimConfig()"
          >
            <ng-content select="[featureVisual]" />
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class FeatureStepComponent {
  // Configuration inputs
  /**
   * Layout direction - controls which side content appears on
   * 'left' = content on left, visual on right
   * 'right' = content on right, visual on left
   */
  readonly layout = input<'left' | 'right'>('left');

  /**
   * Step number for ordering and potential display
   */
  readonly stepNumber = input<number>(1);

  /**
   * Duration of the pin in scroll distance
   */
  readonly pinDuration = input<string>('400px');

  /**
   * ScrollTrigger start position for pinning
   */
  readonly pinStart = input<string>('top 15%');

  /**
   * Anticipate pin value
   */
  readonly anticipatePin = input<number>(1);

  /**
   * Enable pin spacing - pushes content below during pin
   * Default: true for proper layout during pinning
   */
  readonly pinSpacing = input<boolean>(true);

  /**
   * Color theme for accent colors
   */
  readonly colorTheme = input<'indigo' | 'emerald' | 'custom'>('indigo');

  /**
   * Scrub value for scroll animations
   */
  readonly scrub = input<number>(0.5);

  // Computed CSS classes for layout ordering
  readonly contentOrderClasses = computed(() =>
    this.layout() === 'left' ? 'lg:order-1' : 'lg:order-2'
  );

  readonly visualOrderClasses = computed(() =>
    this.layout() === 'left' ? 'lg:order-2' : 'lg:order-1'
  );

  // Animation configs computed from layout
  private readonly animationDirection = computed(() =>
    this.layout() === 'left' ? -1 : 1
  );

  // Computed animation configs for each content element
  readonly badgeAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 90%',
    end: 'top 55%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 60, scale: 0.8 },
    to: { opacity: 1, x: 0, scale: 1 },
  }));

  readonly titleAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 88%',
    end: 'top 50%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 80, y: 20 },
    to: { opacity: 1, x: 0, y: 0 },
  }));

  readonly descriptionAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 85%',
    end: 'top 45%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 60, y: 15 },
    to: { opacity: 1, x: 0, y: 0 },
  }));

  readonly notesAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 82%',
    end: 'top 40%',
    scrub: this.scrub(),
    from: { opacity: 0, x: this.animationDirection() * 40, y: 10 },
    to: { opacity: 1, x: 0, y: 0 },
  }));

  readonly visualAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 90%',
    end: 'top 40%',
    scrub: this.scrub(),
    from: {
      opacity: 0,
      x: this.animationDirection() * -120,
      scale: 0.85,
      rotation: this.animationDirection() * -5,
    },
    to: { opacity: 1, x: 0, scale: 1, rotation: 0 },
  }));

  readonly decorationAnimConfig = computed(() => ({
    animation: 'custom' as const,
    start: 'top 90%',
    end: 'bottom 10%',
    scrub: this.scrub(),
    from: {
      opacity: 0,
      scale: 0.6,
      rotation: this.animationDirection() * -20,
      y: 80,
    },
    to: {
      opacity: 0.25,
      scale: 1.1,
      rotation: this.animationDirection() * 5,
      y: -80,
    },
  }));
}
