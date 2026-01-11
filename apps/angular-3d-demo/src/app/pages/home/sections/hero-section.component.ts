/**
 * HeroSectionComponent - Main Hero Section with Animated Layout
 *
 * A hero section where:
 * - Camera stays STATIC
 * - Sphere/Fire animate in 3D world space (X position) between waypoints
 * - Text animates to different screen positions
 * - Smooth transitions with warp lines effect
 * - Color/theme changes at each waypoint
 *
 * Layout per waypoint:
 * - WP0: Sphere bottom-center, Text center
 * - WP1: Sphere LEFT (3D), Text RIGHT (screen)
 * - WP2: Sphere RIGHT (3D), Text CENTER (screen)
 *
 * Uses HeroSceneComponent for the 3D scene rendering.
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  AssetPreloaderService,
  CinematicEntranceConfig,
  LoadingOverlayComponent,
  StaggerGroupService,
} from '@hive-academy/angular-3d';
import * as THREE from 'three/webgpu';
import { SCENE_COLORS } from '../../../shared/colors';
import { HeroSceneComponent } from './hero-scene.component';

/** Waypoint configuration */
interface WaypointConfig {
  id: string;
  /** 3D position for sphere/fire */
  spherePosition: [number, number, number];
  /** 3D position for nebula (opposite side of sphere) */
  nebulaPosition: [number, number, number];
  /** Text alignment on screen */
  textPosition: 'center' | 'left' | 'right';
  /** Theme colors */
  theme: {
    fireColor: string;
    badgeColor: string;
    gradientClasses: string;
    pillClasses: string;
    warpColor: string;
    /** Nebula primary color (hex number) */
    nebulaPrimaryColor: number;
    /** Nebula secondary color (hex number) */
    nebulaSecondaryColor: number;
    /** Inner sphere bright caustic color */
    innerSphereColor: string;
    /** Inner sphere dark background color */
    innerSphereBackground: string;
  };
  /** Content */
  content: {
    badge: string;
    title: [string, string];
    subtitle: string;
    pills: string[];
  };
}

@Component({
  selector: 'app-hero-section',
  imports: [LoadingOverlayComponent, HeroSceneComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Loading Overlay -->
    <a3d-loading-overlay
      [progress]="preloadState.progress"
      [isReady]="preloadState.isReady"
      [fullscreen]="true"
      [showProgress]="true"
      [showPhase]="false"
    />

    <!-- Hero Container -->
    <section
      data-lenis-prevent
      class="hero-container relative w-full overflow-hidden"
      style="height: 100vh"
    >
      <!-- Layer 1: 3D Scene (camera shake is inside HeroSceneComponent for proper SceneService access) -->
      <div class="gradient-layer absolute inset-0 z-0 bg-background-dark">
        <app-hero-scene
          [cameraPosition]="cameraPosition"
          [backgroundColor]="spaceBackgroundColor"
          [entranceConfig]="entranceConfig"
          [warpIntensity]="isTransitioning() ? 1 : 0"
          [warpDirection]="navigationDirection()"
          [warpColor]="currentWarpColor()"
          [warpSpeed]="warpSpeed()"
          [shakeEnabled]="isTransitioning()"
          [shakeIntensity]="shakeIntensity()"
          [shakeFrequency]="shakeFrequency()"
          [firePosition]="currentFirePosition()"
          [fireColor]="currentFireColor()"
          [innerSphereColor]="currentInnerSphereColor()"
          [innerSphereBackground]="currentInnerSphereBackground()"
          [robotPosition]="robotPosition"
          [nebulaPosition]="currentNebulaPosition()"
          [nebulaPrimaryColor]="currentNebulaPrimaryColor()"
          [nebulaSecondaryColor]="currentNebulaSecondaryColor()"
          (entranceComplete)="onEntranceComplete()"
          (controlsReady)="onControlsReady($event)"
          (robotLoaded)="onRobotLoaded($event)"
        />
      </div>

      <!-- Layer 2: Content (pointer-events-none for click-through) -->
      <div
        class="content-layer absolute inset-0 z-10 flex items-center pointer-events-none"
        [class]="getContentContainerClass()"
      >
        <!-- Text Content Container -->
        <div
          class="text-content transition-all duration-700 ease-out px-4 sm:px-6 md:px-8"
          [class]="getTextContainerClass()"
        >
          @if (!isTransitioning()) {
          <!-- Badge -->
          <div class="mb-6">
            <span
              class="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 backdrop-blur-md rounded-full text-xs sm:text-sm font-medium border shadow-lg"
              [class]="currentBadgeClasses()"
            >
              <span class="relative flex h-2 w-2 sm:h-3 sm:w-3">
                <span
                  class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  [class]="currentPingClass()"
                ></span>
                <span
                  class="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3"
                  [class]="currentDotClass()"
                ></span>
              </span>
              <span [class]="currentBadgeTextClass()">
                {{ currentContent().badge }}
              </span>
            </span>
          </div>

          <!-- Title -->
          <h1
            class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-none tracking-tight"
          >
            <span class="block p-2 text-white drop-shadow-lg">
              {{ currentContent().title[0] }}
            </span>
            <span
              class="block bg-gradient-to-r bg-clip-text text-transparent"
              [class]="currentGradientClasses()"
            >
              {{ currentContent().title[1] }}
            </span>
          </h1>

          <!-- Subtitle -->
          <p
            class="text-base font-medium sm:text-lg md:text-xl text-gray-300 max-w-2xl mb-4 sm:mb-6 leading-relaxed"
          >
            {{ currentContent().subtitle }}
          </p>

          <!-- Pills -->
          <div
            class="flex flex-wrap gap-2 sm:gap-3 mb-8 sm:mb-12 justify-center"
          >
            @for (pill of currentContent().pills; track pill) {
            <span
              class="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/5 rounded-full text-xs sm:text-sm font-semibold border"
              [class]="currentPillClasses()"
            >
              {{ pill }}
            </span>
            }
          </div>
          }
        </div>
      </div>

      <!-- Flight Controls Hint -->
      @if (showHint() && !isTransitioning()) {
      <div
        class="fixed bottom-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      >
        <span
          class="inline-flex items-center gap-2 px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-sm text-white/70 border border-white/10 shadow-lg"
        >
          Hold
          <kbd
            class="px-2 py-0.5 bg-white/10 rounded text-white/90 font-mono text-xs"
            >Click</kbd
          >
          <span class="text-white/50">+</span>
          <kbd
            class="px-2 py-0.5 bg-white/10 rounded text-white/90 font-mono text-xs"
            >Drag</kbd
          >
          left/right to navigate
        </span>
      </div>
      }

      <!-- Waypoint Indicator (clickable) -->
      <div class="fixed bottom-8 right-8 z-20">
        <div class="flex gap-3">
          @for (wp of waypoints; track wp.id; let i = $index) {
          <button
            type="button"
            class="w-4 h-4 rounded-full border-2 transition-all duration-300 cursor-pointer hover:scale-150 focus:outline-none focus:ring-2 focus:ring-white/30 focus:ring-offset-2 focus:ring-offset-transparent"
            [class]="getWaypointIndicatorClass(i)"
            [attr.aria-label]="'Navigate to ' + wp.content.badge"
            [disabled]="isTransitioning()"
            (click)="navigateToWaypoint(i)"
          ></button>
          }
        </div>
      </div>

      <!-- Interaction area for click-hold + drag navigation -->
      <div
        class="absolute inset-0 z-5"
        (mousedown)="onMouseDown($event)"
        (mouseup)="onMouseUp()"
        (mousemove)="onMouseMove($event)"
        (mouseleave)="onMouseLeave()"
      ></div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .gradient-layer ::ng-deep app-hero-scene {
        width: 100%;
        height: 100%;
      }

      .z-5 {
        z-index: 5;
      }
    `,
  ],
})
export class HeroSectionComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly preloader = inject(AssetPreloaderService);
  private readonly staggerService = inject(StaggerGroupService);

  /** Store orbit controls reference */
  private orbitControlsRef: import('three-stdlib').OrbitControls | null = null;

  protected readonly spaceBackgroundColor = SCENE_COLORS.darkBlueGray;
  protected readonly cameraPosition: [number, number, number] = [0, 0, 18];

  /** Robot position */
  protected readonly robotPosition: [number, number, number] = [-25, 8, -8];

  /** Preload state for the robot model */
  protected readonly preloadState = this.preloader.preload([
    { url: '3d/mini_robot.glb', type: 'gltf' },
  ]);

  /** Cinematic entrance configuration */
  protected readonly entranceConfig: CinematicEntranceConfig = {
    preset: 'orbit-drift',
    duration: 3,
    startPosition: [12, 6, 28],
    endPosition: [0, 0, 18],
    preloadState: this.preloadState,
  };

  // =========================================================================
  // ANIMATION CONFIGURATION (configurable inputs!)
  // =========================================================================

  /** Animation duration in seconds for transitioning between waypoints */
  protected readonly animationDuration = signal(2.5);

  /** Warp lines speed - how fast lines fly toward camera during transitions */
  protected readonly warpSpeed = signal(50);

  // =========================================================================
  // CAMERA SHAKE CONFIGURATION
  // =========================================================================

  /** Shake intensity in scene units - adjust this to change shake strength */
  protected readonly shakeIntensity = signal(0.09);

  /** Shake frequency - adjust this to change shake speed */
  protected readonly shakeFrequency = signal(15);

  // =========================================================================
  // WAYPOINT CONFIGURATION
  // =========================================================================

  protected readonly waypoints: WaypointConfig[] = [
    {
      id: 'wp0-nghive',
      spherePosition: [0, -8, -10], // Bottom center (like original)
      nebulaPosition: [60, 40, -120], // Top-right background
      textPosition: 'center',
      theme: {
        fireColor: '#A1FF4F',
        badgeColor: 'neon-green',
        gradientClasses: 'from-neon-green via-primary-500 to-neon-blue',
        pillClasses: 'text-neon-green border-neon-green/20',
        warpColor: '#A1FF4F',
        nebulaPrimaryColor: 0xa1ff4f, // Neon green
        nebulaSecondaryColor: 0x6366f1, // Indigo
        innerSphereColor: '#66ffaa', // Bright neon green-teal
        innerSphereBackground: '#001a0d', // Dark green
      },
      content: {
        badge: 'ngHive Academy',
        title: ['High-End Angular', 'Components'],
        subtitle:
          'Premium, production-ready Angular components built with modern best practices and cutting-edge technologies.',
        pills: ['Standalone', 'Signals', 'TypeScript-First'],
      },
    },
    {
      id: 'wp1-angular3d',
      spherePosition: [-10, 0, -2], // LEFT side
      nebulaPosition: [80, 30, -120], // RIGHT side (opposite)
      textPosition: 'right',
      theme: {
        fireColor: '#9B59B6',
        badgeColor: 'purple-500',
        gradientClasses: 'from-purple-500 via-pink-500 to-indigo-500',
        pillClasses: 'text-purple-400 border-purple-500/20',
        warpColor: '#9B59B6',
        nebulaPrimaryColor: 0x9b59b6, // Purple
        nebulaSecondaryColor: 0xec4899, // Pink
        innerSphereColor: '#dd88ff', // Bright purple-pink
        innerSphereBackground: '#1a001a', // Dark purple
      },
      content: {
        badge: 'Angular 3D',
        title: ['Stunning 3D', 'Experiences'],
        subtitle:
          'Create immersive web experiences with WebGPU-powered 3D graphics using declarative Angular components.',
        pills: ['WebGPU', 'TSL Shaders', 'Three.js'],
      },
    },
    {
      id: 'wp2-gsap',
      spherePosition: [12, 0, -2], // RIGHT side
      nebulaPosition: [-60, 30, -120], // LEFT side (opposite)
      textPosition: 'left',
      theme: {
        fireColor: '#00FFFF',
        badgeColor: 'cyan-500',
        gradientClasses: 'from-cyan-400 via-blue-500 to-indigo-500',
        pillClasses: 'text-cyan-400 border-cyan-500/20',
        warpColor: '#00FFFF',
        nebulaPrimaryColor: 0x00ffff, // Cyan
        nebulaSecondaryColor: 0x3b82f6, // Blue
        innerSphereColor: '#88ddff', // Bright cyan
        innerSphereBackground: '#001a22', // Dark cyan/blue
      },
      content: {
        badge: 'Angular GSAP',
        title: ['Scroll-Driven', 'Animations'],
        subtitle:
          'Build smooth, performant scroll animations with declarative directives powered by GSAP ScrollTrigger.',
        pills: ['ScrollTrigger', 'SSR-Safe', '10+ Effects'],
      },
    },
  ];

  // =========================================================================
  // STATE
  // =========================================================================

  protected readonly activeWaypoint = signal(0);
  protected readonly isTransitioning = signal(false);
  protected readonly isReady = signal(false);
  protected readonly hasInteracted = signal(false);

  /** Navigation direction: -1 = going left, 0 = none, 1 = going right */
  protected readonly navigationDirection = signal<number>(0);

  /** Animated sphere position (interpolated during transition) */
  protected readonly animatedSphereX = signal(0);
  protected readonly animatedSphereY = signal(-9);

  /** Animated nebula position (interpolated during transition) */
  protected readonly animatedNebulaX = signal(60);
  protected readonly animatedNebulaY = signal(40);
  protected readonly animatedNebulaZ = signal(-110);

  // Navigation state
  private gsapInstance: typeof import('gsap').gsap | null = null;

  // Click-and-drag navigation state
  /** Whether mouse button is currently held down */
  private isMouseHeld = false;
  /** Starting X position when mouse was pressed */
  private dragStartX = 0;
  /** Cooldown for navigation to prevent rapid firing */
  private navigationCooldown = false;
  /** Minimum drag distance (in pixels) to trigger navigation */
  private readonly DRAG_THRESHOLD = 100;

  // =========================================================================
  // COMPUTED VALUES
  // =========================================================================

  protected readonly showHint = computed(
    () => this.isReady() && !this.hasInteracted()
  );

  protected readonly currentWaypoint = computed(
    () => this.waypoints[this.activeWaypoint()]
  );

  protected readonly currentContent = computed(
    () => this.currentWaypoint().content
  );

  protected readonly currentFireColor = computed(
    () => this.currentWaypoint().theme.fireColor
  );

  protected readonly currentWarpColor = computed(
    () => this.currentWaypoint().theme.warpColor
  );

  /** Fire position (animated) */
  protected readonly currentFirePosition = computed(
    (): [number, number, number] => [
      this.animatedSphereX(),
      this.animatedSphereY(),
      0,
    ]
  );

  /** Nebula position (animated) */
  protected readonly currentNebulaPosition = computed(
    (): [number, number, number] => [
      this.animatedNebulaX(),
      this.animatedNebulaY(),
      this.animatedNebulaZ(),
    ]
  );

  /** Nebula primary color (from current waypoint) */
  protected readonly currentNebulaPrimaryColor = computed(
    () => this.currentWaypoint().theme.nebulaPrimaryColor
  );

  /** Nebula secondary color (from current waypoint) */
  protected readonly currentNebulaSecondaryColor = computed(
    () => this.currentWaypoint().theme.nebulaSecondaryColor
  );

  /** Inner sphere bright color (from current waypoint) */
  protected readonly currentInnerSphereColor = computed(
    () => this.currentWaypoint().theme.innerSphereColor
  );

  /** Inner sphere dark background (from current waypoint) */
  protected readonly currentInnerSphereBackground = computed(
    () => this.currentWaypoint().theme.innerSphereBackground
  );

  // =========================================================================
  // STYLE CLASSES
  // =========================================================================

  protected readonly currentGradientClasses = computed(
    () => this.currentWaypoint().theme.gradientClasses
  );

  protected readonly currentPillClasses = computed(
    () => this.currentWaypoint().theme.pillClasses
  );

  protected currentBadgeClasses(): string {
    const color = this.currentWaypoint().theme.badgeColor;
    return `bg-${color}/10 border-${color}/30 shadow-${color}/10`;
  }

  protected currentBadgeTextClass(): string {
    const color = this.currentWaypoint().theme.badgeColor;
    if (color === 'neon-green') return 'text-neon-green';
    if (color === 'purple-500') return 'text-purple-400';
    if (color === 'cyan-500') return 'text-cyan-400';
    return 'text-white';
  }

  protected currentPingClass(): string {
    const color = this.currentWaypoint().theme.badgeColor;
    if (color === 'neon-green') return 'bg-neon-green';
    if (color === 'purple-500') return 'bg-purple-500';
    if (color === 'cyan-500') return 'bg-cyan-500';
    return 'bg-white';
  }

  protected currentDotClass(): string {
    return this.currentPingClass();
  }

  /** Content container alignment */
  protected getContentContainerClass(): string {
    const pos = this.currentWaypoint().textPosition;
    if (pos === 'right') return 'justify-end';
    if (pos === 'left') return 'justify-start';
    return 'justify-center';
  }

  /** Text container classes based on position */
  protected getTextContainerClass(): string {
    const pos = this.currentWaypoint().textPosition;
    if (pos === 'right') return 'text-left max-w-2xl mr-8 md:mr-16 lg:mr-24';
    if (pos === 'left') return 'text-left max-w-2xl ml-8 md:ml-16 lg:ml-24';
    return 'text-center max-w-3xl mx-auto';
  }

  /** Waypoint indicator styling */
  protected getWaypointIndicatorClass(index: number): string {
    const colors = [
      'border-neon-green',
      'border-purple-500',
      'border-cyan-500',
    ];
    const currentIdx = this.activeWaypoint();

    if (index === currentIdx) {
      return `${colors[index]} bg-current scale-125`;
    } else if (index < currentIdx) {
      return `${colors[index]} bg-current opacity-60`;
    }
    return `${colors[index]} bg-transparent opacity-40`;
  }

  public constructor() {
    // Load GSAP dynamically
    this.loadGsap();

    // Initialize sphere position
    this.animatedSphereX.set(this.waypoints[0].spherePosition[0]);
    this.animatedSphereY.set(this.waypoints[0].spherePosition[1]);

    // Initialize nebula position
    this.animatedNebulaX.set(this.waypoints[0].nebulaPosition[0]);
    this.animatedNebulaY.set(this.waypoints[0].nebulaPosition[1]);
    this.animatedNebulaZ.set(this.waypoints[0].nebulaPosition[2]);
  }

  private async loadGsap(): Promise<void> {
    try {
      const gsapModule = await import('gsap');
      this.gsapInstance = gsapModule.gsap;
    } catch (e) {
      console.error('[HeroSection] Failed to load GSAP:', e);
    }
  }

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle OrbitControls ready event from scene component
   */
  protected onControlsReady(
    controls: import('three-stdlib').OrbitControls
  ): void {
    // Store controls reference
    this.orbitControlsRef = controls;

    // Mark as ready after a short delay for smooth entrance
    setTimeout(() => {
      this.isReady.set(true);
    }, 500);
  }

  /**
   * Handle entrance animation complete - trigger staggered reveal of scene elements
   */
  protected async onEntranceComplete(): Promise<void> {
    // Trigger staggered reveal of scene elements
    await this.staggerService.revealGroup('hero', 200);
  }

  /**
   * Handle robot model loaded event from scene component
   */
  protected onRobotLoaded(_group: THREE.Group): void {
    // Robot loaded and thrusters attached by HeroSceneComponent
    // Can add additional logic here if needed
  }

  /** Handle mouse leaving the container - release hold state */
  protected onMouseLeave(): void {
    this.isMouseHeld = false;
  }

  // =========================================================================
  // CLICK-AND-DRAG NAVIGATION
  // =========================================================================

  /**
   * Handle mouse button down - start tracking drag.
   * Navigation only happens when mouse is held AND dragged left/right.
   */
  protected onMouseDown(event: MouseEvent): void {
    // Only track left mouse button
    if (event.button === 0) {
      this.isMouseHeld = true;
      this.dragStartX = event.clientX;
      this.hasInteracted.set(true);
    }
  }

  /** Handle mouse button up - release hold state */
  protected onMouseUp(): void {
    this.isMouseHeld = false;
  }

  /**
   * Handle mouse movement - navigate when dragged while holding click.
   * Drag right (positive deltaX) = next waypoint
   * Drag left (negative deltaX) = previous waypoint
   */
  protected onMouseMove(event: MouseEvent): void {
    // Only navigate if mouse is held AND not in cooldown/transition
    if (
      !this.isMouseHeld ||
      this.navigationCooldown ||
      this.isTransitioning()
    ) {
      return;
    }

    const deltaX = event.clientX - this.dragStartX;

    // Check if drag distance exceeds threshold
    if (Math.abs(deltaX) >= this.DRAG_THRESHOLD) {
      // Start cooldown
      this.navigationCooldown = true;

      // Determine direction based on drag
      if (deltaX > 0) {
        // Drag right = next waypoint
        this.flyToNextWaypoint();
      } else {
        // Drag left = previous waypoint
        this.flyToPreviousWaypoint();
      }

      // Reset drag start position for next navigation
      this.dragStartX = event.clientX;

      // Reset cooldown after animation completes
      setTimeout(() => {
        this.navigationCooldown = false;
      }, (this.animationDuration() + 0.5) * 1000);
    }
  }

  // =========================================================================
  // FLIGHT ANIMATION
  // =========================================================================

  private flyToNextWaypoint(): void {
    const currentIdx = this.activeWaypoint();
    if (currentIdx >= this.waypoints.length - 1) return;

    this.animateToWaypoint(currentIdx + 1);
  }

  private flyToPreviousWaypoint(): void {
    const currentIdx = this.activeWaypoint();
    if (currentIdx <= 0) return;

    this.animateToWaypoint(currentIdx - 1);
  }

  /**
   * Navigate directly to a specific waypoint by index.
   * Called when user clicks on waypoint indicator dots.
   */
  protected navigateToWaypoint(targetIndex: number): void {
    const currentIdx = this.activeWaypoint();

    // Don't navigate if already at target or transitioning
    if (targetIndex === currentIdx || this.isTransitioning()) {
      return;
    }

    // Mark as interacted (hides the hint)
    this.hasInteracted.set(true);

    // Animate to target waypoint
    this.animateToWaypoint(targetIndex);
  }

  private async animateToWaypoint(targetIndex: number): Promise<void> {
    if (!this.gsapInstance) {
      console.warn('[HeroSection] GSAP not loaded');
      return;
    }

    const gsap = this.gsapInstance;
    const currentIdx = this.activeWaypoint();
    const targetWp = this.waypoints[targetIndex];

    // Set navigation direction: 1 = going right (next), -1 = going left (prev)
    this.navigationDirection.set(targetIndex > currentIdx ? 1 : -1);

    this.isTransitioning.set(true);
    // Camera shake is now controlled via [shakeEnabled]="isTransitioning()" input

    // Create animation object for sphere and nebula positions
    const animObj = {
      // Sphere position
      sphereX: this.animatedSphereX(),
      sphereY: this.animatedSphereY(),
      // Nebula position (animates opposite to sphere)
      nebulaX: this.animatedNebulaX(),
      nebulaY: this.animatedNebulaY(),
      nebulaZ: this.animatedNebulaZ(),
    };

    await new Promise<void>((resolve) => {
      gsap.to(animObj, {
        // Target sphere position
        sphereX: targetWp.spherePosition[0],
        sphereY: targetWp.spherePosition[1],
        // Target nebula position (opposite side)
        nebulaX: targetWp.nebulaPosition[0],
        nebulaY: targetWp.nebulaPosition[1],
        nebulaZ: targetWp.nebulaPosition[2],
        duration: this.animationDuration(),
        ease: 'power2.inOut',
        onUpdate: () => {
          // Update sphere position
          this.animatedSphereX.set(animObj.sphereX);
          this.animatedSphereY.set(animObj.sphereY);
          // Update nebula position
          this.animatedNebulaX.set(animObj.nebulaX);
          this.animatedNebulaY.set(animObj.nebulaY);
          this.animatedNebulaZ.set(animObj.nebulaZ);
        },
        onComplete: () => {
          resolve();
        },
      });
    });

    // Update waypoint after animation
    // Camera shake stops automatically when isTransitioning becomes false
    this.activeWaypoint.set(targetIndex);
    this.isTransitioning.set(false);
    this.navigationDirection.set(0); // Reset direction
  }
}
