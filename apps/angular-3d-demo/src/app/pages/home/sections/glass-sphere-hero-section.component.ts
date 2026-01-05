/**
 * SunHeroSectionComponent - Stunning Space Sun Hero
 *
 * Self-contained hero section with volumetric sun rising from bottom.
 * Creates a dramatic space scene with realistic sun effect.
 *
 * Features:
 * - Volumetric ray-marched sun with multi-color gradient
 * - Corona glow extending beyond sun surface
 * - Dark space background with subtle star field
 * - Bloom effect for luminous sun glow
 * - Sun positioned at center-bottom (rising sun effect)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import type { ScrollAnimationConfig } from '@hive-academy/angular-gsap';
import {
  ScrollAnimationDirective,
  ViewportAnimationDirective,
} from '@hive-academy/angular-gsap';
import {
  Scene3dComponent,
  FireSphereComponent,
  StarFieldComponent,
  EffectComposerComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-glass-sphere-hero-section',
  imports: [
    ScrollAnimationDirective,
    ViewportAnimationDirective,
    Scene3dComponent,
    FireSphereComponent,
    StarFieldComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Container with scroll-driven 3D animation -->
    <section
      class="hero-container relative w-full overflow-hidden"
      style="height: 100vh"
      scrollAnimation
      [scrollConfig]="scrollConfig"
    >
      <!-- Layer 1: Dark Space Background -->
      <div
        class="gradient-layer absolute inset-0 z-0"
        style="background: linear-gradient(to bottom, #020208, #0a0a18)"
      >
        <!-- 3D Scene -->
        <a3d-scene-3d
          [cameraPosition]="[0, 0, 14]"
          [cameraFov]="60"
          [backgroundColor]="spaceBackgroundColor"
        >
          <!-- Subtle Star Field - not too many stars -->
          <a3d-star-field
            [starCount]="1500"
            [radius]="80"
            [enableTwinkle]="true"
            [multiSize]="true"
          />

          <!-- Sun Sphere - positioned at center-bottom (rising sun) -->
          <a3d-fire-sphere
            [radius]="5"
            [position]="sunPosition()"
            [sunMode]="true"
            [fireMagnitude]="0.35"
            [fireSpeed]="0.25"
            [fireNoiseScale]="0.6"
            [showShell]="false"
            [showCorona]="true"
            [coronaScale]="1.4"
            [coronaColor]="'#ff3300'"
            [coronaIntensity]="0.5"
            [particleCount]="0"
          />

          <!-- Bloom for luminous sun glow -->
          <a3d-effect-composer [enabled]="true">
            <a3d-bloom-effect
              [threshold]="0.3"
              [strength]="0.8"
              [radius]="0.4"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- Layer 2: Hero Content (updated for dark theme) -->
      <div
        class="content-layer pt-24 relative z-10 flex flex-col items-center justify-start min-h-screen text-center px-4 sm:px-6 md:px-8 max-w-5xl mx-auto"
        scrollAnimation
        [scrollConfig]="{
          animation: 'custom',
          start: 'top 20%',
          end: 'bottom 60%',
          scrub: 1.2,
          from: { opacity: 1, y: 0 },
          to: { opacity: 0, y: -150 }
        }"
      >
        <!-- Badge -->
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
            class="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-orange-500/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-medium border border-orange-500/30 shadow-lg shadow-orange-500/10"
          >
            <span class="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-orange-500"
              ></span>
            </span>
            <span class="text-orange-300">Angular 3D</span>
          </span>
        </div>

        <!-- Main Title -->
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
          <span class="block p-2 text-white drop-shadow-lg">
            Build Stunning
          </span>
          <span
            class="block bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent"
          >
            3D Experiences
          </span>
        </h1>

        <!-- Subtitle -->
        <p
          class="text-base font-medium sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed"
          viewportAnimation
          [viewportConfig]="{
            animation: 'fadeIn',
            duration: 0.8,
            delay: 0.4,
            threshold: 0.1
          }"
        >
          Create immersive web experiences with WebGPU-powered 3D graphics and
          smooth scroll animations.
        </p>

        <!-- Feature Pills -->
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
          @for (pill of featurePills; track pill) {
          <span
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 text-orange-300 rounded-full text-xs sm:text-sm font-semibold border border-white/10"
          >
            {{ pill }}
          </span>
          }
        </div>

        <!-- CTA Buttons -->
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
          <a
            href="/angular-3d-showcase"
            class="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full font-bold text-sm sm:text-base md:text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-orange-500/30"
          >
            <span class="relative z-10">Get Started</span>
            <div
              class="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 to-red-500 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
            ></div>
          </a>
          <a
            href="/angular-3d-showcase"
            class="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white/5 backdrop-blur-md text-white rounded-full font-bold text-sm sm:text-base md:text-lg border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300"
          >
            See Examples
          </a>
        </div>

        <!-- Scroll Indicator -->
        <div
          class="flex flex-col items-center gap-2 sm:gap-3 text-white/40"
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
            class="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/30 rounded-full flex justify-center pt-1.5 sm:pt-2"
          >
            <div
              class="w-1 h-2.5 sm:w-1.5 sm:h-3 bg-white/50 rounded-full animate-bounce"
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

      .gradient-layer ::ng-deep a3d-scene-3d {
        width: 100%;
        height: 100%;
      }

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
export class GlassSphereHeroSectionComponent {
  /** Internal scroll progress (0-1) driven by GSAP ScrollTrigger */
  private readonly scrollProgress = signal(0);

  /** Feature pills for hero section */
  protected readonly featurePills = ['WebGPU', 'TSL Shaders', 'Signals'];

  /** Dark space background color (hex number for Three.js) */
  protected readonly spaceBackgroundColor = 0x020208;

  /** ScrollTrigger config for sun animation */
  public readonly scrollConfig: ScrollAnimationConfig = {
    animation: 'custom',
    start: 'top top',
    end: 'bottom top',
    scrub: 1,
    from: {},
    to: {},
    onUpdate: (progress) => this.scrollProgress.set(progress),
  };

  /**
   * Sun position: center-bottom (rising sun effect)
   * Starts at y=-7 (half visible at bottom) → rises to y=3 on scroll
   */
  public readonly sunPosition = computed((): [number, number, number] => {
    const p = Math.max(0, Math.min(1, this.scrollProgress()));
    const eased = 1 - Math.pow(1 - p, 3);
    const x = 0; // Center horizontally
    const y = -7 + 10 * eased; // -7 → 3 (rises from bottom)
    return [x, y, 0];
  });

  /** Sun scale: 1.0 → 0.6 on scroll */
  public readonly sunScale = computed((): number => {
    const p = Math.max(0, Math.min(1, this.scrollProgress()));
    const eased = 1 - Math.pow(1 - p, 3);
    return 1.0 - 0.4 * eased;
  });
}
