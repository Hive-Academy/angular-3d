/**
 * GlassSphereHeroComponent - Production-Quality Glass Sphere Hero Section
 *
 * A reusable hero section with:
 * - **Three-layer composition**: CSS gradient (z-0) -> 3D scene (z-1) -> content (z-10)
 * - **Transparent 3D canvas** overlaying CSS gradient background
 * - **ViewportAnimationDirective** for staggered load animations
 * - **ScrollAnimationDirective** for content fade-out on scroll
 * - **Signal-based inputs** for full content customization
 *
 * Design Pattern:
 * - Light cream/peach gradient background (warm, inviting)
 * - Glass sphere with sparkle corona in 3D layer
 * - Dark text for light background (contrast with GSAP showcase dark theme)
 *
 * @example
 * ```html
 * <app-glass-sphere-hero
 *   [scrollProgress]="scrollProgress()"
 *   [badgeText]="'Angular 3D'"
 *   [titleLine1]="'Build Stunning'"
 *   [titleLine2]="'3D Experiences'"
 *   (primaryAction)="onGetStarted()"
 * />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  ScrollAnimationDirective,
  ViewportAnimationDirective,
} from '@hive-academy/angular-gsap';
import { Scene3dComponent } from '@hive-academy/angular-3d';
import { GlassSphereSceneComponent } from './glass-sphere-scene.component';

@Component({
  selector: 'app-glass-sphere-hero',
  imports: [
    Scene3dComponent,
    ScrollAnimationDirective,
    ViewportAnimationDirective,
    GlassSphereSceneComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Container with three-layer composition -->
    <section
      class="hero-container relative w-full overflow-hidden"
      [style.height]="height()"
    >
      <!-- Layer 1: CSS Gradient Background (z-index: 0) -->
      <div
        class="gradient-layer absolute inset-0 z-0"
        [style.background]="gradient()"
      ></div>

      <!-- Layer 2: 3D Scene with transparent canvas (z-index: 1) -->
      <div class="scene-layer absolute inset-0 z-[1] pointer-events-none">
        <a3d-scene-3d
          [cameraPosition]="[0, 0, 12]"
          [cameraFov]="50"
          [backgroundColor]="null"
        >
          <app-glass-sphere-scene [scrollProgress]="scrollProgress()" />
        </a3d-scene-3d>
      </div>

      <!-- Layer 3: Hero Content with GSAP animations (z-index: 10) -->
      <div
        class="content-layer relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 md:px-8 max-w-5xl mx-auto"
        scrollAnimation
        [scrollConfig]="{
          animation: 'custom',
          start: 'top 20%',
          end: 'bottom 60%',
          scrub: 1.2,
          from: { opacity: 1, y: 0 },
          to: { opacity: 0, y: -100 }
        }"
      >
        <!-- Badge - scaleIn animation, delay 0.1 -->
        <div
          class="pt-8 mb-6"
          viewportAnimation
          [viewportConfig]="{
            animation: 'scaleIn',
            duration: 0.6,
            delay: 0.1,
            threshold: 0.1
          }"
        >
          <span
            class="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-amber-900/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-medium border border-amber-900/20 shadow-lg"
          >
            <span class="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-amber-500"
              ></span>
            </span>
            <span class="text-amber-900">{{ badgeText() }}</span>
          </span>
        </div>

        <!-- Main Title - slideUp animation, delay 0.2 -->
        <h1
          class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-none tracking-tight"
          viewportAnimation
          [viewportConfig]="{
            animation: 'slideUp',
            duration: 0.8,
            delay: 0.2,
            threshold: 0.1
          }"
        >
          <span class="block p-2 text-amber-950 drop-shadow-sm">
            {{ titleLine1() }}
          </span>
          <span
            class="block bg-gradient-to-r from-amber-600 via-orange-500 to-rose-500 bg-clip-text text-transparent"
          >
            {{ titleLine2() }}
          </span>
        </h1>

        <!-- Subtitle - fadeIn animation, delay 0.4 -->
        <p
          class="text-base font-medium sm:text-lg md:text-xl text-amber-900/70 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed"
          viewportAnimation
          [viewportConfig]="{
            animation: 'fadeIn',
            duration: 0.8,
            delay: 0.4,
            threshold: 0.1
          }"
        >
          {{ subtitle() }}
        </p>

        <!-- Feature Pills - slideUp animation, delay 0.5 -->
        <div
          class="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-12"
          viewportAnimation
          [viewportConfig]="{
            animation: 'slideUp',
            duration: 0.6,
            delay: 0.5,
            threshold: 0.1
          }"
        >
          @for (pill of featurePills(); track pill) {
          <span
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500/20 text-amber-800 rounded-full text-xs sm:text-sm font-semibold border border-amber-500/30"
          >
            {{ pill }}
          </span>
          }
        </div>

        <!-- CTA Buttons - slideUp animation, delay 0.6 -->
        <div
          class="flex flex-wrap gap-4 sm:gap-6 justify-center mb-12 sm:mb-16"
          viewportAnimation
          [viewportConfig]="{
            animation: 'slideUp',
            duration: 0.6,
            delay: 0.6,
            threshold: 0.1
          }"
        >
          <button
            type="button"
            class="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full font-bold text-sm sm:text-base md:text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-amber-500/30"
            (click)="primaryAction.emit()"
          >
            <span class="relative z-10">{{ primaryButtonText() }}</span>
            <div
              class="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
            ></div>
          </button>
          <a
            [href]="secondaryButtonHref()"
            class="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-amber-900/5 backdrop-blur-md text-amber-900 rounded-full font-bold text-sm sm:text-base md:text-lg border border-amber-900/20 hover:bg-amber-900/10 hover:border-amber-900/40 transition-all duration-300"
          >
            {{ secondaryButtonText() }}
          </a>
        </div>

        <!-- Scroll Indicator - fadeIn animation, delay 0.8 -->
        <div
          class="flex flex-col items-center gap-2 sm:gap-3 text-amber-900/50"
          viewportAnimation
          [viewportConfig]="{
            animation: 'fadeIn',
            duration: 0.6,
            delay: 0.8,
            threshold: 0.1
          }"
        >
          <span class="text-xs sm:text-sm font-medium tracking-widest uppercase"
            >Scroll to explore</span
          >
          <div
            class="w-5 h-8 sm:w-6 sm:h-10 border-2 border-amber-900/30 rounded-full flex justify-center pt-1.5 sm:pt-2"
          >
            <div
              class="w-1 h-2.5 sm:w-1.5 sm:h-3 bg-amber-900/50 rounded-full animate-bounce"
            ></div>
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

      /* Ensure 3D scene fills container */
      .scene-layer ::ng-deep a3d-scene-3d {
        width: 100%;
        height: 100%;
      }

      /* Bounce animation for scroll indicator */
      @keyframes bounce {
        0%,
        100% {
          transform: translateY(-25%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }

      .animate-bounce {
        animation: bounce 1s infinite;
      }
    `,
  ],
})
export class GlassSphereHeroComponent {
  // ============================================================
  // SCROLL & LAYOUT INPUTS
  // ============================================================

  /**
   * External scroll progress from 0 (top) to 1 (scrolled)
   * Controls sphere position and content fade-out
   */
  public readonly scrollProgress = input<number>(0);

  /**
   * CSS gradient start color (top of gradient)
   * Default: light cream for warm, inviting feel
   */
  public readonly gradientStart = input<string>('#FFF8F0');

  /**
   * CSS gradient end color (bottom of gradient)
   * Default: bisque/peach for warmth
   */
  public readonly gradientEnd = input<string>('#FFE4C4');

  /**
   * Container height (CSS value)
   * Default: full viewport height
   */
  public readonly height = input<string>('100vh');

  // ============================================================
  // CONTENT INPUTS
  // ============================================================

  /**
   * Badge text shown at top of hero
   */
  public readonly badgeText = input<string>('Angular 3D');

  /**
   * First line of main title (solid color)
   */
  public readonly titleLine1 = input<string>('Build Stunning');

  /**
   * Second line of main title (gradient color)
   */
  public readonly titleLine2 = input<string>('3D Experiences');

  /**
   * Subtitle text below main title
   */
  public readonly subtitle = input<string>(
    'Create immersive web experiences with WebGPU-powered 3D graphics and smooth scroll animations.'
  );

  /**
   * Feature pills displayed below subtitle
   * Empty array renders nothing (handled by @for)
   */
  public readonly featurePills = input<string[]>([
    'WebGPU',
    'TSL Shaders',
    'Signals',
  ]);

  /**
   * Primary CTA button text
   */
  public readonly primaryButtonText = input<string>('Get Started');

  /**
   * Secondary button text
   */
  public readonly secondaryButtonText = input<string>('See Examples');

  /**
   * Secondary button href
   */
  public readonly secondaryButtonHref = input<string>('#features');

  // ============================================================
  // OUTPUTS
  // ============================================================

  /**
   * Emits scroll progress when using internal scroll tracking
   */
  public readonly progressChange = output<number>();

  /**
   * Emits when primary CTA button is clicked
   */
  public readonly primaryAction = output<void>();

  // ============================================================
  // COMPUTED PROPERTIES
  // ============================================================

  /**
   * CSS linear gradient from gradientStart to gradientEnd
   * Creates the warm cream/peach background
   */
  public readonly gradient = computed(
    () =>
      `linear-gradient(to bottom, ${this.gradientStart()}, ${this.gradientEnd()})`
  );
}
