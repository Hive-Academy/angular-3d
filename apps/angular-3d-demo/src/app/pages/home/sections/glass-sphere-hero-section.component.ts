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
 * - Loading progress overlay with cinematic entrance animation
 * - Staggered scene reveals for dramatic effect
 */
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  viewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  AmbientLightComponent,
  AssetPreloaderService,
  BloomEffectComponent,
  CinematicEntranceConfig,
  CinematicEntranceDirective,
  DirectionalLightComponent,
  EffectComposerComponent,
  EnvironmentComponent,
  FireSphereComponent,
  GltfModelComponent,
  LoadingOverlayComponent,
  MouseTracking3dDirective,
  NebulaVolumetricComponent,
  NodeMaterialDirective,
  OrbitControlsComponent,
  Scene3dComponent,
  SceneRevealDirective,
  SphereComponent,
  StaggerGroupService,
  StarFieldComponent,
  ThrusterFlameComponent,
  tslCausticsTexture,
} from '@hive-academy/angular-3d';
import {
  ScrollAnimationDirective,
  ViewportAnimationDirective,
} from '@hive-academy/angular-gsap';
import * as THREE from 'three/webgpu';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-glass-sphere-hero-section',
  imports: [
    DecimalPipe,
    ScrollAnimationDirective,
    ViewportAnimationDirective,
    Scene3dComponent,
    FireSphereComponent,
    StarFieldComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    NebulaVolumetricComponent,
    EnvironmentComponent,
    SphereComponent,
    MouseTracking3dDirective,
    AmbientLightComponent,
    DirectionalLightComponent,
    GltfModelComponent,
    ThrusterFlameComponent,
    NodeMaterialDirective,
    OrbitControlsComponent,
    CinematicEntranceDirective,
    SceneRevealDirective,
    LoadingOverlayComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Overlay - shows until scene and assets ready -->
    <!-- Uses existing preloadState directly (directive only tracks scene ready) -->
    <a3d-loading-overlay
      [progress]="preloadState.progress"
      [isReady]="preloadState.isReady"
      [fullscreen]="true"
      [showProgress]="true"
      [showPhase]="false"
    />

    <!-- Hero Container - no scroll animation on container -->
    <section
      data-lenis-prevent
      class="hero-container relative w-full overflow-hidden"
      style="height: 100vh"
    >
      <!-- Layer 1: Dark Space Background with FIXED Sun -->
      <div
        class="gradient-layer absolute inset-0 z-0"
        style="background: linear-gradient(to bottom, #030310, #0a0a1a)"
      >
        <!-- 3D Scene (no SceneLoadingDirective needed for now) -->
        <a3d-scene-3d
          [cameraPosition]="[0, 0, 16]"
          [cameraFov]="55"
          [backgroundColor]="spaceBackgroundColor"
        >
          <!-- OrbitControls with Cinematic Entrance Animation -->
          <a3d-orbit-controls
            a3dCinematicEntrance
            [entranceConfig]="entranceConfig"
            (entranceComplete)="onEntranceComplete()"
            (controlsReady)="onControlsReady($event)"
            [enableDamping]="true"
            [dampingFactor]="0.05"
            [minDistance]="10"
            [maxDistance]="30"
            [enableZoom]="false"
          />

          <!-- Ambient fill light -->
          <a3d-ambient-light [intensity]="0.12" />

          <!-- Main sun light from dramatic angle -->
          <a3d-directional-light
            [position]="[15, 8, 10]"
            [intensity]="1.6"
            [color]="'#fff8f0'"
          />

          <!-- Rim light for cinematic effect -->
          <a3d-directional-light
            [position]="[14, 5, -10]"
            [intensity]="0.25"
            [color]="'#4a90d9'"
          />

          <!-- HDRI Environment for IBL reflections -->
          <a3d-environment
            [preset]="'night'"
            [intensity]="0.3"
            [background]="false"
          />

          <!-- Multi-Layer Star Fields for depth parallax with gentle rotation -->
          <!-- Layer 1: Close stars (larger, brighter) - slow rotation -->
          <a3d-star-field
            [starCount]="2000"
            [radius]="40"
            [size]="0.035"
            [multiSize]="true"
            [stellarColors]="true"
            [enableRotation]="true"
            [rotationSpeed]="0.008"
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

          <!-- Layer 3: Distant stars (smaller, dimmer) - slowest rotation for parallax -->
          <a3d-star-field
            [starCount]="1500"
            [radius]="70"
            [size]="0.018"
            [opacity]="0.5"
            [multiSize]="true"
            [stellarColors]="true"
            [enableRotation]="true"
            [rotationSpeed]="0.003"
            [rotationAxis]="'y'"
          />

          <!-- Glossy animated marble sphere with scene reveal -->
          <a3d-sphere
            a3dSceneReveal
            [revealConfig]="{
              animation: 'fade-in',
              staggerGroup: 'hero',
              staggerIndex: 1,
              duration: 1.2
            }"
            [args]="[4, 52, 52]"
            [position]="sunPosition"
            [roughness]="0.1"
            [metalness]="0.04"
            a3dNodeMaterial
            [colorNode]="causticsTexture"
          />

          <!-- Sun - FIXED at center-bottom (volumetric with large separated flames) -->
          <a3d-fire-sphere
            [radius]="8"
            [position]="firePosition"
            [quality]="'quality'"
            [sunMode]="true"
            [fireSpeed]="0.35"
            [fireMagnitude]="1.7"
            [fireNoiseScale]="1.4"
            [lacunarity]="1.2"
            [iterations]="20"
          />

          <a3d-nebula-volumetric
            a3dSceneReveal
            [revealConfig]="{
              animation: 'fade-in',
              staggerGroup: 'hero',
              staggerIndex: 1,
              duration: 1.2
            }"
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

          <!-- Flying Robot with scene reveal - uses (loaded) event for manual thruster attachment -->
          <a3d-gltf-model
            a3dSceneReveal
            [revealConfig]="{
              animation: 'scale-pop',
              staggerGroup: 'hero',
              staggerIndex: 0,
              duration: 1.0
            }"
            modelPath="3d/mini_robot.glb"
            [scale]="[0.04, 0.04, 0.04]"
            [position]="angularLogoPosition"
            mouseTracking3d
            [trackingConfig]="{
              followCursor: true,
              cursorDepth: 20,
              smoothness: 0.08,
              lockZ: true,
              flightBehavior: true,
              maxBankAngle: 0.6,
              maxPitchAngle: 0.4,
              flightDamping: 0.06,
              velocityMultiplier: 20
            }"
            (loaded)="onRobotLoaded($event)"
          />

          <!-- Thruster Flames - GPU Particle-based for realistic effect -->
          <!-- Parent scale is 0.07, so local values are multiplied by 0.07 for world size -->
          <!-- Positioned under each foot of the robot -->
          <a3d-thruster-flame
            #leftThruster
            [offset]="[-5, -62, 0]"
            color="#00ccff"
            coreColor="#ffffff"
            [intensity]="2.2"
            [size]="60"
            [flameLength]="60"
            [speed]="1.5"
            [turbulence]="0.4"
            [particleCount]="900"
            [nozzleRadius]="15"
          />
          <a3d-thruster-flame
            #rightThruster
            [offset]="[5, -62, 0]"
            color="#00ccff"
            coreColor="#ffffff"
            [intensity]="2.2"
            [size]="60"
            [flameLength]="60"
            [speed]="1.5"
            [turbulence]="0.4"
            [particleCount]="900"
            [nozzleRadius]="15"
          />

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
        [scrollConfig]="scrollContentConfig"
      >
        <!-- Badge -->
        <div
          class="mb-6"
          viewportAnimation
          [viewportConfig]="viewportBadgeConfig"
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
          [viewportConfig]="viewportTitleConfig"
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
          [viewportConfig]="viewportSubtitleConfig"
        >
          Create immersive web experiences with WebGPU-powered 3D graphics and
          smooth scroll animations.
        </p>

        <!-- Feature Pills -->
        <div
          class="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-12"
          viewportAnimation
          [viewportConfig]="viewportPillsConfig"
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
          [viewportConfig]="viewportButtonsConfig"
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
  protected readonly firePosition: [number, number, number] = [0, -9, 0];
  protected readonly sunPosition: [number, number, number] = [0, -9, -2];

  /** Angular logo position: centered, floating above sun */
  protected readonly angularLogoPosition: [number, number, number] = [
    -25, 8, -8,
  ];

  /** Spotlight position: above and in front of the logo */
  protected readonly spotlightPosition: [number, number, number] = [-20, 18, 5];

  /** Warm spotlight color (cinematic golden light) */
  protected readonly spotlightColor = '#ffeedd';

  protected readonly causticsTexture = tslCausticsTexture({
    speed: 1.2,
    scale: 0.4,
    intensity: 1.4,
    color: new THREE.Color('#ff6600'), // Bright orange caustics
    background: new THREE.Color('#1a0a00'), // Dark burnt orange/brown
  });

  // Inject services for preloading and stagger animations
  private readonly preloader = inject(AssetPreloaderService);
  private readonly staggerService = inject(StaggerGroupService);

  // ViewChild references for thruster flames
  private readonly leftThruster =
    viewChild<ThrusterFlameComponent>('leftThruster');
  private readonly rightThruster =
    viewChild<ThrusterFlameComponent>('rightThruster');

  // ViewChild for cinematic entrance directive (to set orbit controls)
  private readonly cinematicEntrance = viewChild(CinematicEntranceDirective);

  /** Preload state for the robot model */
  protected readonly preloadState = this.preloader.preload([
    { url: '3d/mini_robot.glb', type: 'gltf' },
  ]);

  /** Shared viewport animation configs - all wait for preload to complete */
  protected readonly viewportBadgeConfig = {
    animation: 'scaleIn' as const,
    duration: 0.6,
    delay: 0.1,
    threshold: 0.1,
    waitFor: () => this.preloadState.isReady(),
  };

  protected readonly viewportTitleConfig = {
    animation: 'slideUp' as const,
    duration: 0.8,
    delay: 0.2,
    threshold: 0.1,
    waitFor: () => this.preloadState.isReady(),
  };

  protected readonly viewportSubtitleConfig = {
    animation: 'fadeIn' as const,
    duration: 0.8,
    delay: 0.4,
    threshold: 0.1,
    waitFor: () => this.preloadState.isReady(),
  };

  protected readonly viewportPillsConfig = {
    animation: 'slideUp' as const,
    duration: 0.6,
    delay: 0.5,
    threshold: 0.1,
    waitFor: () => this.preloadState.isReady(),
  };

  protected readonly viewportButtonsConfig = {
    animation: 'slideUp' as const,
    duration: 0.6,
    delay: 0.6,
    threshold: 0.1,
    waitFor: () => this.preloadState.isReady(),
  };

  /** Shared scroll animation config - waits for preload to complete */
  protected readonly scrollContentConfig = {
    animation: 'custom' as const,
    start: 'top top',
    end: 'bottom top',
    scrub: 0.5,
    from: { y: 0 },
    to: { y: -80 },
    waitFor: () => this.preloadState.isReady(),
  };

  /** Cinematic entrance configuration */
  protected readonly entranceConfig: CinematicEntranceConfig = {
    preset: 'orbit-drift', // Dramatic sweep-in effect
    duration: 3,
    startPosition: [10, 5, 25], // Start offset right, up, and far
    endPosition: [0, 0, 16], // Current camera position from component
    preloadState: this.preloadState,
  };

  /**
   * Handle OrbitControls ready event - connect to cinematic entrance directive
   */
  protected onControlsReady(
    controls: import('three-stdlib').OrbitControls
  ): void {
    const entrance = this.cinematicEntrance();
    if (entrance) {
      entrance.setOrbitControls(controls);
    }
  }

  /**
   * Handle entrance animation complete - trigger staggered reveal of scene elements
   */
  protected async onEntranceComplete(): Promise<void> {
    // Trigger staggered reveal of scene elements
    await this.staggerService.revealGroup('hero', 200);
  }

  /**
   * Handle robot model loaded event - attach thruster flames manually.
   * This bypasses the contentChildren timing issue where inputs aren't
   * bound during construction.
   */
  protected onRobotLoaded(group: THREE.Group): void {
    // Get thruster components
    const left = this.leftThruster();
    const right = this.rightThruster();

    // Attach left thruster
    if (left?.isReady()) {
      const leftMesh = left.getMesh();
      if (leftMesh) {
        group.add(leftMesh);
      }
    }

    // Attach right thruster
    if (right?.isReady()) {
      const rightMesh = right.getMesh();
      if (rightMesh) {
        group.add(rightMesh);
      }
    }
  }
}
