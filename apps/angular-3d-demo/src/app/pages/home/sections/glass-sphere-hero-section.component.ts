/**
 * SunHeroSectionComponent - Stunning Space Sun Hero
 *
 * Self-contained hero section with optimized sun effect fixed at center-bottom.
 * Creates a dramatic space scene with smooth 60fps performance.
 *
 * Features:
 * - Texture-based sun shader (fast, 60fps friendly)
 * - Sun FIXED at center-bottom (no scroll animation)
 * - Simple parallax effect on hero content only
 * - Dark space background with subtle star field
 * - Bloom effect for luminous sun glow
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
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
  NebulaVolumetricComponent,
  SvgIconComponent,
  SpotLightComponent,
  MouseTracking3dDirective,
  AmbientLightComponent,
  DirectionalLightComponent,
  GltfModelComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

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
    NebulaVolumetricComponent,
    SvgIconComponent,
    SpotLightComponent,
    MouseTracking3dDirective,
    AmbientLightComponent,
    DirectionalLightComponent,
    GltfModelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Hero Container - no scroll animation on container -->
    <section
      class="hero-container relative w-full overflow-hidden"
      style="height: 100vh"
    >
      <!-- Layer 1: Dark Space Background with FIXED Sun -->
      <div
        class="gradient-layer absolute inset-0 z-0"
        style="background: linear-gradient(to bottom, #030310, #0a0a1a)"
      >
        <!-- 3D Scene -->
        <a3d-scene-3d
          [cameraPosition]="[0, 0, 16]"
          [cameraFov]="55"
          [backgroundColor]="spaceBackgroundColor"
        >
          <!-- Scene Lighting for Metallic Materials -->
          <a3d-ambient-light color="#ffeedd" [intensity]="0.4" />
          <a3d-directional-light
            [position]="[10, 15, 10]"
            color="white"
            [intensity]="1.5"
          />

          <!-- Subtle Star Field -->
          <a3d-star-field
            [starCount]="1200"
            [radius]="100"
            [enableTwinkle]="true"
            [multiSize]="true"
            [stellarColors]="true"
            [enableRotation]="true"
            [rotationSpeed]="0.005"
            [rotationAxis]="'y'"
          />

          <!-- Layer 2: Mid-range stars - slightly slower rotation -->
          <a3d-star-field
            [starCount]="1500"
            [radius]="55"
            [size]="0.025"
            [multiSize]="true"
            [stellarColors]="true"
            [enableRotation]="true"
            [rotationSpeed]="0.005"
            [rotationAxis]="'y'"
          />

          <!-- Sun - FIXED at center-bottom (volumetric with large separated flames) -->
          <a3d-fire-sphere
            [radius]="6"
            [position]="sunPosition"
            [quality]="'quality'"
            [sunMode]="true"
            [fireSpeed]="0.35"
            [fireMagnitude]="1.7"
            [fireNoiseScale]="0.4"
            [lacunarity]="1.2"
            [iterations]="24"
          />

          <a3d-nebula-volumetric
            [position]="[60, 40, -110]"
            [width]="120"
            [height]="60"
            [opacity]="0.75"
            [primaryColor]="primaryColor"
            [secondaryColor]="secondaryColor"
            [enableFlow]="false"
            [noiseScale]="3.5"
            [density]="1.2"
            [glowIntensity]="0.6"
            [centerFalloff]="1.2"
            [erosionStrength]="0.65"
            [enableEdgePulse]="true"
            [edgePulseSpeed]="0.3"
            [edgePulseAmount]="0.2"
          />

          <!-- Floating Angular Logo at Center with Spotlight 
          <a3d-svg-icon
            [svgPath]="'/images/logos/angular-gold.svg'"
            [position]="angularLogoPosition"
            [scale]="0.07"
            [depth]="0.6"
            [metalness]="0.3"
            [roughness]="0.4"
            [emissiveIntensity]="0.6"
            [bevelEnabled]="true"
            [bevelThickness]="0.04"
            [bevelSize]="0.03"
            mouseTracking3d
            [trackingConfig]="{
              sensitivity: 0.8,
              limit: 0.5,
              damping: 0.05,
              invertX: true,
              translationRange: [10, 5],
              invertPosX: true
            }"
          />-->

          <a3d-gltf-model
            modelPath="3d/mini_robot.glb"
            [scale]="[0.07, 0.07, 0.07]"
            [position]="angularLogoPosition"
            mouseTracking3d
            [trackingConfig]="{
              followCursor: true,
              cursorDepth: 20,
              smoothness: 0.08,
              lockZ: true,
              disableRotation: false,
              sensitivity: 0.3,
              limit: 0.4,
              damping: 0.05
            }"
          />

          <!-- Cinematic Spotlight on Angular Logo
          <a3d-spot-light
            [position]="spotlightPosition"
            [target]="angularLogoPosition"
            [color]="spotlightColor"
            [intensity]="15"
            [distance]="50"
            [angle]="0.6"
            [penumbra]="0.5"
            [decay]="1.2"
          /> -->

          <!-- Bloom for luminous sun glow -->
          <a3d-effect-composer [enabled]="true">
            <a3d-bloom-effect
              [threshold]="0.25"
              [strength]="0.7"
              [radius]="0.5"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- Layer 2: Hero Content with SIMPLE PARALLAX -->
      <div
        class="content-layer relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 sm:px-6 md:px-8 max-w-5xl mx-auto"
        scrollAnimation
        [scrollConfig]="{
          animation: 'custom',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.5,
          from: { y: 0 },
          to: { y: -80 }
        }"
      >
        <!-- Badge -->
        <div
          class="mb-6"
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
  /** Feature pills for hero section */
  protected readonly featurePills = ['WebGPU', 'TSL Shaders', 'Signals'];

  /** Dark space background color (hex number for Three.js) */
  protected readonly spaceBackgroundColor = SCENE_COLORS.darkBlueGray;
  protected readonly primaryColor = SCENE_COLORS.honeyGold;
  protected readonly secondaryColor = SCENE_COLORS.emerald;

  /**
   * Sun position: FIXED at center-bottom
   * y=-9 places sun so top half is visible above bottom edge
   * Centered horizontally (x=0)
   */
  protected readonly sunPosition: [number, number, number] = [0, -9, 0];

  /** Angular logo position: centered, floating above sun */
  protected readonly angularLogoPosition: [number, number, number] = [
    -25, 8, -8,
  ];

  /** Spotlight position: above and in front of the logo */
  protected readonly spotlightPosition: [number, number, number] = [-20, 18, 5];

  /** Warm spotlight color (cinematic golden light) */
  protected readonly spotlightColor = '#ffeedd';
}
