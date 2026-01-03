/**
 * Marble Hero Scene - Example Hero Section with 3D Background
 *
 * Demonstrates how to combine <a3d-marble-sphere> with HTML overlays
 * for a hero section with 3D background.
 *
 * Key patterns demonstrated:
 * 1. Using MarbleSphereComponent for animated marble effect
 * 2. Layering HTML content above 3D canvas with image background
 * 3. Environment-based reflections on glossy marbles
 * 4. Auto-rotating orbit controls for ambient movement
 * 5. Dramatic lighting setup for product visualization
 */
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  OnDestroy,
} from '@angular/core';
import {
  AmbientLightComponent,
  MarbleSphereComponent,
  MarbleParticleSystemComponent,
  OrbitControlsComponent,
  PointLightComponent,
  Scene3dComponent,
  SpotLightComponent,
  SceneService,
} from '@hive-academy/angular-3d';
import { GsapCoreService } from '@hive-academy/angular-gsap';
import * as THREE from 'three/webgpu';

/**
 * Content Component - Contains 3D elements with environment reflections
 */
@Component({
  selector: 'app-marble-hero-content',
  standalone: true,
  imports: [
    AmbientLightComponent,
    SpotLightComponent,
    PointLightComponent,
    OrbitControlsComponent,
    MarbleSphereComponent,
    MarbleParticleSystemComponent,
  ],
  template: `
    <!-- Environment reflections loaded from JPG background -->

    <!-- Main marble sphere (emerald/teal) - center right -->
    <a3d-marble-sphere
      [radius]="0.35"
      [position]="[0.2, 0.15, 0]"
      [colorA]="'#ff6644'"
      [colorB]="'#ff8866'"
      [edgeColor]="'#ffcc99'"
      [edgeIntensity]="1.0"
      [animationSpeed]="0.4"
      [iterations]="16"
      [roughness]="0.05"
    >
      <!-- Interior particles (dense coral/orange cloud) -->
      <a3d-marble-particle-system
        [radius]="0.3"
        [particleCount]="5000"
        [color]="'#ff8866'"
        [size]="0.012"
        [opacity]="0.5"
        [blending]="'additive'"
        [enableTwinkle]="true"
        [twinkleSpeed]="0.3"
      />

      <!-- Surface glow particles (bright peach halo) -->
      <a3d-marble-particle-system
        [radius]="0.34"
        [particleCount]="800"
        [color]="'#fff4cc'"
        [size]="0.018"
        [opacity]="0.7"
        [blending]="'additive'"
        [enableTwinkle]="true"
        [twinkleSpeed]="0.5"
      />
    </a3d-marble-sphere>

    <!-- Second marble sphere (purple/magenta) - top left, smaller -->
    <a3d-marble-sphere
      [radius]="0.18"
      [position]="[-0.35, 0.5, -0.1]"
      [colorA]="'#1a0025'"
      [colorB]="'#ff66d4'"
      [edgeColor]="'#ff99e6'"
      [edgeIntensity]="1.0"
      [animationSpeed]="0.6"
      [iterations]="12"
      [roughness]="0.05"
    />

    <!-- Third marble sphere (cyan) - bottom left, tiny accent -->
    <a3d-marble-sphere
      [radius]="0.08"
      [position]="[-0.5, -0.1, 0.15]"
      [colorA]="'#001525'"
      [colorB]="'#00ffff'"
      [edgeColor]="'#66ffff'"
      [edgeIntensity]="1.2"
      [animationSpeed]="0.8"
      [iterations]="10"
      [roughness]="0.03"
    />

    <!-- Ambient light for base illumination -->
    <a3d-ambient-light [color]="ambientColor" [intensity]="0.4" />

    <!-- Key light - cool white from top (simulating ceiling light) -->
    <a3d-spot-light
      [position]="[0, 1.2, 0.5]"
      [angle]="Math.PI / 4"
      [penumbra]="0.9"
      [decay]="1.2"
      [distance]="5"
      [intensity]="8"
      [castShadow]="true"
      [color]="keyLightColor"
    />

    <!-- Fill light - cyan accent from left -->
    <a3d-point-light
      [position]="[-0.8, 0.3, 0.5]"
      [color]="cyanAccent"
      [intensity]="4"
      [distance]="3"
    />

    <!-- Rim light - bright cyan from behind -->
    <a3d-point-light
      [position]="[0.3, 0.2, -0.6]"
      [color]="cyanRim"
      [intensity]="3"
      [distance]="2"
    />

    <!-- Top accent light for the smaller marble -->
    <a3d-point-light
      [position]="[-0.3, 0.8, 0.2]"
      [color]="pinkHighlight"
      [intensity]="2.5"
      [distance]="1.5"
    />

    <!-- Floor reflection light (simulating ground bounce) -->
    <a3d-point-light
      [position]="[0, -0.5, 0.3]"
      [color]="floorBounce"
      [intensity]="1.5"
      [distance]="2"
    />

    <!-- Auto-rotating orbit controls -->
    <a3d-orbit-controls
      [target]="[0, 0.25, 0]"
      [maxDistance]="1.5"
      [minDistance]="0.4"
      [autoRotate]="true"
      [autoRotateSpeed]="0.3"
      [enableDamping]="true"
    />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarbleHeroContentComponent implements AfterViewInit {
  protected readonly Math = Math;

  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);
  private envTexture: THREE.Texture | null = null;

  // Light colors - matching the dark room blue theme
  protected readonly ambientColor = 0x0a1525; // Dark blue ambient
  protected readonly keyLightColor = 0xc0e0ff; // Cool white with blue tint
  protected readonly cyanAccent = 0x00b8ff; // Bright cyan
  protected readonly cyanRim = 0x00d4ff; // Cyan rim light
  protected readonly pinkHighlight = 0xff66d4; // Pink/magenta accent
  protected readonly floorBounce = 0x1a3a4d; // Subtle blue floor reflection

  public ngAfterViewInit(): void {
    // Load environment map after scene is initialized
    this.loadEnvironmentMap();

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.envTexture) {
        this.envTexture.dispose();
        this.envTexture = null;
      }
    });
  }

  /**
   * Load the JPG background as an environment map for reflections
   */
  private loadEnvironmentMap(): void {
    const scene = this.sceneService.scene();
    if (!scene) {
      // Scene not ready yet, retry after a short delay
      setTimeout(() => this.loadEnvironmentMap(), 50);
      return;
    }

    // Load the same background image used in CSS
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      '/background-marble.png',
      (texture) => {
        // Configure texture for environment mapping
        texture.mapping = THREE.EquirectangularReflectionMapping;
        texture.colorSpace = THREE.SRGBColorSpace;

        // Apply to scene environment for reflections
        scene.environment = texture;
        scene.environmentIntensity = 0.8;

        // Store reference for cleanup
        this.envTexture = texture;

        console.log(
          'Environment texture loaded - marbles should now reflect the background'
        );
      },
      undefined,
      (error) => {
        console.error('Error loading environment texture:', error);
      }
    );
  }
}

/**
 * Parent Container with Image Background and 3D Overlay with Scroll Animations
 */
@Component({
  selector: 'app-marble-hero-scene',
  standalone: true,
  imports: [Scene3dComponent, MarbleHeroContentComponent],
  template: `
    <div class="hero-container">
      <!-- Background Image Layer -->
      <div class="background-image"></div>

      <!-- 3D Scene Layer (transparent background) -->
      <a3d-scene-3d
        [cameraPosition]="[0, 0.3, 0.8]"
        [cameraNear]="0.025"
        [cameraFar]="5"
        [frameloop]="'always'"
        [enableShadows]="true"
      >
        <app-marble-hero-content />
      </a3d-scene-3d>

      <!-- HTML Overlay Content -->
      <div class="hero-overlay">
        <h1 class="hero-title">Magical Marble</h1>
        <p class="hero-subtitle">
          Raymarched volumetric interior with glossy glass shell
        </p>
        <div class="hero-cta">
          <button class="cta-button">Get Started</button>
          <button class="cta-button secondary">Learn More</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 85vh;
        min-height: 500px;
        position: relative;
      }

      .hero-container {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }

      .background-image {
        position: absolute;
        inset: 0;
        z-index: 0;
        background-image: url('/background-marble.png');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }

      a3d-scene-3d {
        position: absolute;
        inset: 0;
        z-index: 1;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        pointer-events: none;
        text-align: center;
      }

      .hero-title {
        font-size: clamp(2.5rem, 8vw, 5rem);
        font-weight: 700;
        color: white;
        margin: 0 0 1rem;
        text-shadow: 0 4px 20px rgba(0, 0, 0, 0.8),
          0 0 40px rgba(0, 180, 255, 0.3);
      }

      .hero-subtitle {
        font-size: clamp(1rem, 3vw, 1.5rem);
        color: rgba(255, 255, 255, 0.85);
        margin: 0 0 2rem;
        max-width: 600px;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.7);
      }

      .hero-cta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
        pointer-events: auto;
      }

      .cta-button {
        padding: 0.875rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        background: linear-gradient(135deg, #00b8ff, #0088cc);
        color: white;
      }

      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 30px rgba(0, 184, 255, 0.5);
      }

      .cta-button.secondary {
        background: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(0, 184, 255, 0.6);
        color: white;
        backdrop-filter: blur(4px);
      }

      .cta-button.secondary:hover {
        background: rgba(0, 184, 255, 0.15);
        border-color: #00b8ff;
        box-shadow: 0 8px 30px rgba(0, 184, 255, 0.3);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarbleHeroSceneComponent implements AfterViewInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly gsapCore = inject(GsapCoreService);
  private readonly elementRef = inject(ElementRef);
  private scrollTimeline: gsap.core.Timeline | null = null;

  public ngAfterViewInit(): void {
    // Setup scroll-triggered animations after view is initialized
    this.setupScrollAnimations();
  }

  public ngOnDestroy(): void {
    // Cleanup GSAP scroll trigger
    if (this.scrollTimeline) {
      this.scrollTimeline.scrollTrigger?.kill();
      this.scrollTimeline.kill();
      this.scrollTimeline = null;
    }
  }

  /**
   * Setup GSAP ScrollTrigger animations for marble and text
   */
  private setupScrollAnimations(): void {
    const gsap = this.gsapCore.gsap;
    const ScrollTrigger = this.gsapCore.scrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn('[MarbleHeroScene] GSAP not available');
      return;
    }

    const container =
      this.elementRef.nativeElement.querySelector('.hero-container');
    const marbleScene = container?.querySelector('a3d-scene-3d');
    const title = container?.querySelector('.hero-title');
    const subtitle = container?.querySelector('.hero-subtitle');
    const cta = container?.querySelector('.hero-cta');

    if (!container || !marbleScene || !title || !subtitle || !cta) {
      console.warn('[MarbleHeroScene] Required elements not found');
      return;
    }

    // Initially hide text elements
    gsap.set([title, subtitle, cta], { opacity: 0, y: 30 });

    // Create scroll timeline
    this.scrollTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '+=100vh',
        scrub: 1, // 1 second smoothing
        markers: false, // Set to true for debugging
      },
    });

    // Marble transformation: Note - we can't directly animate Three.js objects from GSAP
    // in the template. Instead, we'd need to expose the marble mesh reference or
    // use a directive. For now, we'll focus on text reveal which works perfectly.

    // Progressive text reveal with stagger
    this.scrollTimeline
      .to(
        title,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        },
        0.4
      ) // Start at 40% of scroll
      .to(
        subtitle,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        },
        0.5
      ) // Start at 50% of scroll
      .to(
        cta,
        {
          opacity: 1,
          y: 0,
          duration: 0.3,
          ease: 'power2.out',
        },
        0.6
      ); // Start at 60% of scroll
  }
}
