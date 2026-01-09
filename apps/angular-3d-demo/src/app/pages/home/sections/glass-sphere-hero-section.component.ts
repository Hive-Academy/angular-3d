/**
 * GlassSphereHeroSectionComponent - Stunning Space Sun Hero with Flight Navigation
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
 * - Camera flight navigation between waypoints (hold right-click to fly)
 * - Warp lines effect during flight transitions
 * - Dynamic content switching based on active waypoint
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  AmbientLightComponent,
  AssetPreloaderService,
  BloomEffectComponent,
  CameraFlightDirective,
  CameraWaypoint,
  CinematicEntranceConfig,
  CinematicEntranceDirective,
  DirectionalLightComponent,
  EffectComposerComponent,
  EnvironmentComponent,
  FireSphereComponent,
  GltfModelComponent,
  GroundFogComponent,
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
  WarpLinesComponent,
  WaypointNavigationState,
  WaypointReachedEvent,
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
    CameraFlightDirective,
    SceneRevealDirective,
    LoadingOverlayComponent,
    GroundFogComponent,
    WarpLinesComponent,
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
      <div class="gradient-layer absolute inset-0 z-0 bg-background-dark">
        <!-- 3D Scene (no SceneLoadingDirective needed for now) -->
        <a3d-scene-3d
          [cameraPosition]="[0, 0, 16]"
          [cameraFov]="55"
          [backgroundColor]="spaceBackgroundColor"
        >
          <!-- OrbitControls with Cinematic Entrance and Camera Flight -->
          <a3d-orbit-controls
            a3dCinematicEntrance
            [entranceConfig]="entranceConfig"
            (entranceComplete)="onEntranceComplete()"
            (controlsReady)="onControlsReady($event)"
            a3dCameraFlight
            [waypoints]="waypoints"
            [enabled]="flightEnabled()"
            (flightStart)="onFlightStart()"
            (flightEnd)="onFlightEnd()"
            (waypointReached)="onWaypointReached($event)"
            (navigationStateChange)="onNavigationStateChange($event)"
            [enableDamping]="true"
            [dampingFactor]="0.05"
            [minDistance]="10"
            [maxDistance]="30"
            [enableZoom]="false"
          />

          <!-- Warp Lines Effect (controlled by isFlying signal) -->
          <a3d-warp-lines
            [intensity]="isFlying() ? 1 : 0"
            [lineCount]="250"
            [color]="'#00ffff'"
            [lineLength]="2.5"
            [stretchMultiplier]="6"
            [spreadRadius]="25"
          />

          <!-- Ambient fill light - reduced for deeper shadows -->
          <a3d-ambient-light [intensity]="0.05" />

          <!-- Main sun light from dramatic angle - reduced for more contrast -->
          <a3d-directional-light
            [position]="[15, 8, 10]"
            [intensity]="1.2"
            [color]="'#fff8f0'"
          />

          <!-- Rim light for cinematic effect - enhanced for dramatic edge lighting -->
          <a3d-directional-light
            [position]="[14, 5, -10]"
            [intensity]="0.35"
            [color]="'#4a90d9'"
          />

          <!-- HDRI Environment for IBL reflections - reduced for deeper shadows -->
          <a3d-environment
            [preset]="'night'"
            [intensity]="0.15"
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
            [sunMode]="false"
            [fireColor]="'#A1FF4F'"
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

          <!-- Atmospheric ground fog - far left, closer to camera -->
          <a3d-ground-fog
            [position]="[-25, 0, -5]"
            [width]="40"
            [depth]="30"
            [height]="20"
            [color]="groundFogColor"
            [opacity]="0.6"
            [density]="1.5"
            [noiseScale]="0.02"
            [edgeSoftness]="0.35"
            [enableDrift]="true"
            [driftSpeed]="0.15"
            [driftDirection]="[0.3, 0.05, 0.1]"
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

          <!-- Destination Sphere - visible when not at waypoint 1 -->
          @if (activeWaypoint() !== 1) {
          <a3d-sphere
            [args]="[1.5, 32, 32]"
            [position]="waypoints[1].lookAt"
            [color]="'#4a90d9'"
            [emissive]="'#1a3050'"
            [emissiveIntensity]="0.5"
          />
          }

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
        <!-- Waypoint 0: Angular 3D Content -->
        @if (showContent() && activeWaypoint() === 0) {
        <!-- Badge -->
        <div
          class="mb-6"
          viewportAnimation
          [viewportConfig]="viewportBadgeConfig"
        >
          <span
            class="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-neon-green/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-medium border border-neon-green/30 shadow-lg shadow-neon-green/10"
          >
            <span class="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-neon-green"
              ></span>
            </span>
            <span class="text-neon-green">Angular 3D</span>
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
            class="block bg-gradient-to-r from-neon-green via-primary-500 to-neon-blue bg-clip-text text-transparent"
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
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 text-neon-green rounded-full text-xs sm:text-sm font-semibold border border-neon-green/20"
          >
            {{ pill }}
          </span>
          }
        </div>
        }

        <!-- Waypoint 1: GSAP ScrollTrigger Content -->
        @if (showContent() && activeWaypoint() === 1) {
        <!-- Badge -->
        <div
          class="mb-6"
          viewportAnimation
          [viewportConfig]="viewportBadgeConfig"
        >
          <span
            class="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-purple-500/10 backdrop-blur-md rounded-full text-xs sm:text-sm font-medium border border-purple-500/30 shadow-lg shadow-purple-500/10"
          >
            <span class="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-purple-500"
              ></span>
            </span>
            <span class="text-purple-400">Angular + GSAP ScrollTrigger</span>
          </span>
        </div>

        <!-- Main Title -->
        <h1
          class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-none tracking-tight"
          viewportAnimation
          [viewportConfig]="viewportTitleConfig"
        >
          <span class="block p-2 text-white drop-shadow-lg">
            Scroll-Driven
          </span>
          <span
            class="block bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 bg-clip-text text-transparent"
          >
            Animations
          </span>
        </h1>

        <!-- Subtitle -->
        <p
          class="text-base font-medium sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed"
          viewportAnimation
          [viewportConfig]="viewportSubtitleConfig"
        >
          Create stunning scroll-driven animations with declarative directives.
        </p>

        <!-- Feature Pills -->
        <div
          class="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-12"
          viewportAnimation
          [viewportConfig]="viewportPillsConfig"
        >
          @for (pill of gsapFeaturePills; track pill) {
          <span
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 text-purple-400 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/20"
          >
            {{ pill }}
          </span>
          }
        </div>
        }
      </div>

      <!-- Flight Hint - shows after entrance, before first flight -->
      @if (showFlightHint()) {
      <div
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
        viewportAnimation
        [viewportConfig]="viewportHintConfig"
      >
        <span
          class="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-sm text-white/70 border border-white/10 shadow-lg"
        >
          Hold
          <kbd
            class="px-2 py-0.5 mx-1 bg-white/10 rounded text-white/90 font-mono text-xs"
            >Right Click</kbd
          >
          to explore
        </span>
      </div>
      }
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
  /** Feature pills for hero section - waypoint 0 */
  protected readonly featurePills = ['WebGPU', 'TSL Shaders', 'Signals'];

  /** Feature pills for GSAP section - waypoint 1 */
  protected readonly gsapFeaturePills = [
    '10+ Built-in Effects',
    'SSR-Safe',
    'TypeScript-First',
  ];

  // =========================================================================
  // FLIGHT NAVIGATION STATE (Signal-based)
  // =========================================================================

  /** Current active waypoint index */
  protected readonly activeWaypoint = signal(0);

  /** Whether camera is currently in flight */
  protected readonly isFlying = signal(false);

  /** Whether user can fly forward to next waypoint */
  protected readonly canFlyForward = signal(true);

  /** Whether user can fly backward to previous waypoint */
  protected readonly canFlyBackward = signal(false);

  /** Track if user has flown at least once (for hint visibility) */
  protected readonly hasFlownOnce = signal(false);

  /** Enable flight after entrance animation completes */
  protected readonly flightEnabled = signal(false);

  /** Computed: show content only when not actively flying */
  protected readonly showContent = computed(() => !this.isFlying());

  /** Computed: show flight hint before first flight and after entrance completes */
  protected readonly showFlightHint = computed(
    () =>
      !this.hasFlownOnce() &&
      this.flightEnabled() &&
      this.preloadState.isReady()
  );

  // =========================================================================
  // WAYPOINT CONFIGURATION
  // =========================================================================

  /** Camera waypoints for flight navigation */
  protected readonly waypoints: CameraWaypoint[] = [
    {
      id: 'hero-main',
      position: [0, 0, 16],
      lookAt: [0, 0, 0],
      duration: 2,
      ease: 'power2.inOut',
    },
    {
      id: 'gsap-destination',
      position: [-15, 3, 8],
      lookAt: [-20, 2, -5],
      duration: 2.5,
      ease: 'power2.inOut',
    },
  ];

  /** Content configuration for each waypoint */
  protected readonly waypointContent: Record<
    number,
    {
      badge: string;
      badgeColor: string;
      title: [string, string];
      subtitle: string;
      pills: string[];
      gradient: string;
    }
  > = {
    0: {
      badge: 'Angular 3D',
      badgeColor: 'neon-green',
      title: ['Build Stunning', '3D Experiences'],
      subtitle:
        'Create immersive web experiences with WebGPU-powered 3D graphics and smooth scroll animations.',
      pills: ['WebGPU', 'TSL Shaders', 'Signals'],
      gradient: 'from-neon-green via-primary-500 to-neon-blue',
    },
    1: {
      badge: 'Angular + GSAP ScrollTrigger',
      badgeColor: 'purple-500',
      title: ['Scroll-Driven', 'Animations'],
      subtitle:
        'Create stunning scroll-driven animations with declarative directives.',
      pills: ['10+ Built-in Effects', 'SSR-Safe', 'TypeScript-First'],
      gradient: 'from-purple-500 via-pink-500 to-cyan-500',
    },
  };

  // =========================================================================
  // SCENE COLORS AND POSITIONS
  // =========================================================================

  /** Dark space background color (hex number for Three.js) */
  protected readonly spaceBackgroundColor = SCENE_COLORS.darkBlueGray;
  protected readonly primaryColor = SCENE_COLORS.neonGreen;
  protected readonly secondaryColor = SCENE_COLORS.indigo;

  /** Scene-level atmospheric fog (FogExp2 for space depth) */
  protected readonly fogColor = SCENE_COLORS.spaceFog;
  protected readonly fogDensity = 0.012; // Subtle atmospheric depth

  /** Ground fog color - blue-gray for atmospheric depth */
  protected readonly groundFogColor = SCENE_COLORS.fogBlueGray;

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
    speed: 0.7,
    scale: 0.4,
    intensity: 1.4,
    color: new THREE.Color('#A1FF4F'), // Neon green caustics
    background: new THREE.Color('#0A1A0F'), // Dark green-black
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

  // ViewChild for camera flight directive (to set orbit controls)
  private readonly cameraFlight = viewChild(CameraFlightDirective);

  /** Preload state for the robot model */
  protected readonly preloadState = this.preloader.preload([
    { url: '3d/mini_robot.glb', type: 'gltf' },
  ]);

  /** Shared viewport animation configs - all wait for preload to complete */
  /**
   * Helper to create viewport animation configs with shared base settings.
   * All configs wait for preload to complete and use threshold 0.1.
   */
  private createViewportConfig(
    animation: 'scaleIn' | 'slideUp' | 'fadeIn',
    duration: number,
    delay: number
  ) {
    return {
      animation,
      duration,
      delay,
      threshold: 0.1,
      waitFor: () => this.preloadState.isReady(),
    };
  }

  /** Viewport animation configs - generated with shared base settings */
  protected readonly viewportBadgeConfig = this.createViewportConfig(
    'scaleIn',
    0.6,
    0.1
  );
  protected readonly viewportTitleConfig = this.createViewportConfig(
    'slideUp',
    0.8,
    0.2
  );
  protected readonly viewportSubtitleConfig = this.createViewportConfig(
    'fadeIn',
    0.8,
    0.4
  );
  protected readonly viewportPillsConfig = this.createViewportConfig(
    'slideUp',
    0.6,
    0.5
  );
  protected readonly viewportButtonsConfig = this.createViewportConfig(
    'slideUp',
    0.6,
    0.6
  );

  /** Viewport config for flight hint - appears after entrance with delay */
  protected readonly viewportHintConfig = {
    animation: 'fadeIn' as const,
    duration: 0.6,
    delay: 1.5, // Delay after entrance completes
    threshold: 0.1,
    staggerGroup: 'hero',
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
   * Handle OrbitControls ready event - connect to cinematic entrance and camera flight directives
   */
  protected onControlsReady(
    controls: import('three-stdlib').OrbitControls
  ): void {
    const entrance = this.cinematicEntrance();
    if (entrance) {
      entrance.setOrbitControls(controls);
    }

    // Also set controls on camera flight directive
    const flight = this.cameraFlight();
    if (flight) {
      flight.setOrbitControls(controls);
    }
  }

  /**
   * Handle entrance animation complete - trigger staggered reveal of scene elements
   */
  protected async onEntranceComplete(): Promise<void> {
    // Trigger staggered reveal of scene elements
    await this.staggerService.revealGroup('hero', 200);

    // Enable camera flight after entrance animation completes
    this.flightEnabled.set(true);
  }

  // =========================================================================
  // FLIGHT NAVIGATION EVENT HANDLERS
  // =========================================================================

  /** Handle flight start event */
  protected onFlightStart(): void {
    this.isFlying.set(true);
    this.hasFlownOnce.set(true);
  }

  /** Handle flight end event */
  protected onFlightEnd(): void {
    // isFlying stays true until waypointReached to prevent content flash
    // This is intentionally left here for documentation purposes
  }

  /** Handle waypoint arrival */
  protected onWaypointReached(event: WaypointReachedEvent): void {
    this.activeWaypoint.set(event.index);
    this.isFlying.set(false);
    this.canFlyForward.set(event.index < this.waypoints.length - 1);
    this.canFlyBackward.set(event.index > 0);
  }

  /** Handle navigation state changes */
  protected onNavigationStateChange(state: WaypointNavigationState): void {
    this.canFlyForward.set(state.canFlyForward);
    this.canFlyBackward.set(state.canFlyBackward);
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
