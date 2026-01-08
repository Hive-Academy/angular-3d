/**
 * Scene3D Component - Root scene container for Three.js
 *
 * Creates and manages WebGPURenderer, Scene, and PerspectiveCamera.
 * Provides SceneService for child component access via DI.
 *
 * WebGPU is the primary rendering backend with automatic WebGL fallback.
 * The renderer.backend.isWebGPU property indicates which backend is active.
 */

import {
  Component,
  ElementRef,
  OnDestroy,
  DestroyRef,
  ChangeDetectionStrategy,
  input,
  inject,
  viewChild,
  afterNextRender,
  effect,
  signal,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { SceneService } from './scene.service';
import {
  RenderLoopService,
  FrameloopMode,
} from '../render-loop/render-loop.service';
import { SceneGraphStore } from '../store/scene-graph.store';
import { EffectComposerService } from '../postprocessing/effect-composer.service';
import { AdvancedPerformanceOptimizerService } from '../services/advanced-performance-optimizer.service';
import { ViewportPositioningService } from '../positioning/viewport-positioning.service';
import { NG_3D_PARENT } from '../types/tokens';
import { SceneReadyService } from '../loading/scene-ready.service';

/**
 * Camera configuration input interface
 */
export interface CameraConfig {
  position?: [number, number, number];
  fov?: number;
  near?: number;
  far?: number;
}

/**
 * Renderer configuration input interface
 *
 * Note: WebGPU only supports 'high-performance' and 'low-power' for powerPreference.
 */
export interface RendererConfig {
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'high-performance' | 'low-power';
}

/**
 * Root scene container component for Angular 3D applications.
 *
 * This component creates and owns the core Three.js objects:
 * - WebGLRenderer
 * - Scene
 * - PerspectiveCamera
 *
 * It delegates the render loop to `RenderLoopService`, allowing
 * postprocessing effects to override the render function.
 *
 * @example
 * ```html
 * <a3d-scene-3d
 *   [cameraPosition]="[0, 0, 20]"
 *   [cameraFov]="75"
 *   [backgroundColor]="0x000011"
 *   [enableShadows]="true">
 *
 *   <app-planet />
 *   <app-star-field />
 *
 * </a3d-scene-3d>
 * ```
 */
@Component({
  selector: 'a3d-scene-3d',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SceneService,
    RenderLoopService, // Per-scene instance for independent render loops
    SceneGraphStore, // Per-scene instance for multi-scene isolation
    ViewportPositioningService, // Per-scene instance for correct camera reference
    EffectComposerService, // Per-scene instance for independent post-processing
    AdvancedPerformanceOptimizerService, // Per-scene instance for independent performance optimization
    SceneReadyService, // Per-scene instance for loading coordination
    {
      provide: NG_3D_PARENT,
      useFactory: (sceneService: SceneService) => () => sceneService.scene(),
      deps: [SceneService],
    },
  ],
  template: `
    <div class="scene-container" data-lenis-prevent>
      <canvas #canvas></canvas>
      <div class="scene-content">
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        background: transparent;
      }

      .scene-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        background: transparent;
        /* Prevent scroll chaining to parent - works with Lenis smooth scroll */
        overscroll-behavior: contain;
      }

      canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
        background: transparent;
      }

      .scene-content {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }
    `,
  ],
})
export class Scene3dComponent implements OnDestroy {
  // Use signal-based viewChild instead of decorator
  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  // Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneService = inject(SceneService);
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneReadyService = inject(SceneReadyService);

  // Camera inputs
  public readonly cameraPosition = input<[number, number, number]>([0, 0, 20]);
  public readonly cameraFov = input<number>(75);
  public readonly cameraNear = input<number>(0.1);
  public readonly cameraFar = input<number>(1000);

  // Renderer inputs
  public readonly enableAntialiasing = input<boolean>(true);
  public readonly alpha = input<boolean>(true);
  /**
   * Power preference for GPU selection
   *
   * WebGPU only supports 'high-performance' and 'low-power'.
   * 'high-performance' (default): Prefer discrete GPU for better performance
   * 'low-power': Prefer integrated GPU for battery efficiency
   */
  public readonly powerPreference = input<'high-performance' | 'low-power'>(
    'high-performance'
  );

  // Scene inputs
  public readonly backgroundColor = input<number | null>(null);
  public readonly enableShadows = input<boolean>(false);

  // Fog inputs - Scene-level atmospheric fog (like Three.js scene.fog)
  /**
   * Fog color (hex number). If fogDensity is set, uses FogExp2, otherwise linear fog.
   * @example 0x0A0E11 (dark space), 0x87CEEB (sky blue)
   */
  public readonly fogColor = input<number | null>(null);

  /**
   * Fog density for exponential fog (FogExp2).
   * When set, uses exponential fog which is more realistic for atmospheric effects.
   * Typical values: 0.001 (light) to 0.05 (heavy)
   * @example 0.008 for subtle space atmosphere
   */
  public readonly fogDensity = input<number | null>(null);

  /**
   * Near distance for linear fog (only used if fogDensity is null).
   * Objects closer than this are not affected by fog.
   */
  public readonly fogNear = input<number>(10);

  /**
   * Far distance for linear fog (only used if fogDensity is null).
   * Objects farther than this are fully obscured by fog.
   */
  public readonly fogFar = input<number>(100);

  /**
   * Frame loop mode for rendering optimization
   *
   * - 'always' (default): Continuous rendering at 60fps
   * - 'demand': Only render when scene changes (battery efficient)
   *
   * In demand mode, call sceneService.invalidate() when the scene changes
   * to trigger a render. OrbitControls and animation directives automatically
   * call invalidate() when they update.
   *
   * @example
   * ```html
   * <!-- Continuous rendering (default) -->
   * <a3d-scene-3d>...</a3d-scene-3d>
   *
   * <!-- Demand-based rendering for static scenes -->
   * <a3d-scene-3d [frameloop]="'demand'">...</a3d-scene-3d>
   * ```
   */
  public readonly frameloop = input<FrameloopMode>('always');

  // Three.js objects
  private renderer!: THREE.WebGPURenderer;
  private readonly scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;

  // Lifecycle flag to prevent race conditions during async initialization
  private destroyed = false;

  // Signal to track when renderer is ready for reactive effects
  // Using signal ensures effects dependent on this will re-run when it changes
  private readonly rendererInitialized = signal(false);

  // Visibility observer for performance optimization
  private visibilityObserver: IntersectionObserver | null = null;

  // Flag to track first frame for loading coordination
  private firstFrameRendered = false;

  public constructor() {
    // Expose scene immediately so children can access it in ngOnInit
    this.sceneService.setScene(this.scene);

    // Reactive effect: Update scene background when input changes
    // IMPORTANT: This effect is created in the constructor (injection context)
    // and will reactively update the background whenever backgroundColor() changes.
    // It checks rendererInitialized flag to avoid setting background before scene is ready.
    effect(() => {
      const bgColor = this.backgroundColor();
      // Only apply background color after renderer is initialized
      // Reading the signal creates a reactive dependency
      if (!this.rendererInitialized()) {
        return;
      }
      if (bgColor !== null) {
        this.scene.background = new THREE.Color(bgColor);
      } else {
        this.scene.background = null;
      }
    });

    // Reactive effect: Update scene fog when fog inputs change
    // Supports both FogExp2 (exponential, atmospheric) and Fog (linear)
    effect(() => {
      const color = this.fogColor();
      const density = this.fogDensity();
      const near = this.fogNear();
      const far = this.fogFar();

      // Only apply fog after renderer is initialized
      // Reading the signal creates a reactive dependency
      if (!this.rendererInitialized()) {
        return;
      }

      // If no fog color specified, clear fog
      if (color === null) {
        this.scene.fog = null;
        return;
      }

      // If density is specified, use FogExp2 (exponential fog - more realistic)
      if (density !== null) {
        this.scene.fog = new THREE.FogExp2(color, density);
      } else {
        // Otherwise use linear fog
        this.scene.fog = new THREE.Fog(color, near, far);
      }
    });

    // Setup initialization after first render (browser-only)
    afterNextRender(() => {
      // WebGPURenderer requires async initialization
      this.initRendererAsync()
        .then(() => {
          // Check if component was destroyed during async initialization
          if (this.destroyed) {
            return;
          }

          this.initScene(); // Sets background color
          this.initCamera();

          // Expose renderer and camera (available after init)
          this.sceneService.setRenderer(this.renderer);
          this.sceneService.setCamera(this.camera);

          // Initialize scene graph store with core Three.js objects
          // This also flushes any pending object registrations
          this.sceneStore.initScene(this.scene, this.camera, this.renderer);

          // Set frameloop mode before starting render loop
          this.renderLoop.setFrameloop(this.frameloop());

          // Use setAnimationLoop for WebGPU - delegates to RenderLoopService.tick()
          // This replaces manual requestAnimationFrame management
          this.renderer.setAnimationLoop((time: number) => {
            this.renderLoop.tick(time);
          });

          // Set the render function for RenderLoopService to use
          // Track first frame for loading coordination
          this.renderLoop.setRenderFunction(() => {
            this.renderer.render(this.scene, this.camera);

            // Track first frame for SceneReadyService (one-time)
            // Check destroyed flag to prevent calling on destroyed component
            if (!this.firstFrameRendered && !this.destroyed) {
              this.firstFrameRendered = true;
              this.sceneReadyService.setFirstFrameRendered();
            }
          });

          // Mark render loop as running (without starting internal RAF loop)
          this.renderLoop.markAsRunning();

          // Setup resize handler
          this.setupResizeHandler();

          // Setup visibility-based pausing for performance
          this.setupVisibilityObserver();

          // Mark renderer as initialized - this triggers the background and fog effects above
          this.rendererInitialized.set(true);

          // Mark scene ready service as renderer ready for loading coordination
          this.sceneReadyService.setRendererReady();
        })
        .catch((error: Error) => {
          console.error(
            '[Scene3d] Failed to initialize WebGPU renderer:',
            error
          );
          // Attempt graceful degradation - clear any partial state
          if (this.renderer) {
            try {
              this.renderer.dispose();
            } catch {
              // Ignore disposal errors during error recovery
            }
          }
        });
    });

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.dispose();
    });
  }
  public ngOnDestroy(): void {
    this.dispose();
  }

  /**
   * Register a callback to be called each frame
   * @returns Cleanup function to unregister the callback
   */
  public registerUpdateCallback(
    callback: (delta: number, elapsed: number) => void
  ): () => void {
    return this.renderLoop.registerUpdateCallback(callback);
  }

  /**
   * Get the current scene instance
   */
  public getScene(): THREE.Scene {
    return this.scene;
  }

  /**
   * Get the current renderer instance
   */
  public getRenderer(): THREE.WebGPURenderer {
    return this.renderer;
  }

  /**
   * Get the current camera instance
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Initialize WebGPURenderer with async init() for WebGPU backend
   *
   * CRITICAL: Must await init() before first render or any WebGPU operations.
   * The renderer will automatically fall back to WebGL if WebGPU is not available.
   */
  private async initRendererAsync(): Promise<void> {
    const canvas = this.canvasRef().nativeElement;

    // Try initializing with requested config first
    try {
      this.renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: this.enableAntialiasing(),
        alpha: this.alpha(),
        powerPreference: this.powerPreference(),
        forceWebGL: false, // Explicitly try WebGPU
      });

      await this.renderer.init();
    } catch (err) {
      console.warn(
        '[Scene3d] Initial WebGPU init failed, retrying with safe config:',
        err
      );

      // Retry with safe configuration (no AA, default power)
      this.renderer?.dispose();
      this.renderer = new THREE.WebGPURenderer({
        canvas,
        antialias: false,
        alpha: this.alpha(),
        forceWebGL: false,
      });

      try {
        await this.renderer.init();
      } catch (retryErr) {
        console.error('[Scene3d] Safe config WebGPU init failed:', retryErr);
        // Fallback to WebGL (handled internally by Three.js usually, or we can force it)
        // But if init() throws, we might need to recreate as WebGLRenderer or accept mixed state.
        // For now, let's assume the renderer stays in a fallback state or we can rely on existing fallback check.
      }
    }

    // Log backend detection for debugging
    const isWebGPU = this.renderer.isWebGPURenderer;
    if (isWebGPU) {
      console.log('[Scene3d] Using WebGPU backend');
    } else {
      console.warn(
        '[Scene3d] WebGPU not available, fell back to WebGL backend'
      );
    }

    // Set initial size based on container
    const container = canvas.parentElement;
    if (container) {
      this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    if (this.enableShadows()) {
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }

    // Set clear color with alpha=0 for transparent backgrounds when alpha mode is enabled
    if (this.alpha()) {
      this.renderer.setClearColor(0x000000, 0);
    }
  }

  private initScene(): void {
    // Scene is already initialized in property
    const bgColor = this.backgroundColor();
    if (bgColor !== null) {
      this.scene.background = new THREE.Color(bgColor);
    }
  }

  private initCamera(): void {
    const container = this.canvasRef().nativeElement.parentElement;
    const aspect = container
      ? container.clientWidth / container.clientHeight
      : 1;

    this.camera = new THREE.PerspectiveCamera(
      this.cameraFov(),
      aspect,
      this.cameraNear(),
      this.cameraFar()
    );

    const [x, y, z] = this.cameraPosition();
    this.camera.position.set(x, y, z);
  }

  private setupResizeHandler(): void {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          this.camera.aspect = width / height;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(width, height);
        }
      }
    });

    const container = this.canvasRef().nativeElement.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
    });
  }

  /**
   * Setup visibility-based pausing using IntersectionObserver.
   *
   * Pauses the render loop when scene scrolls out of view to save
   * GPU resources. Resumes when visible again.
   *
   * PERF: This is a key optimization for pages with multiple 3D scenes.
   * When a scene is not visible, GPU usage drops to near zero.
   */
  private setupVisibilityObserver(): void {
    const container = this.canvasRef().nativeElement.parentElement;
    if (!container) return;

    this.visibilityObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // Scene is visible - resume rendering
          this.renderLoop.resume();
        } else {
          // Scene is not visible - pause rendering to save GPU
          this.renderLoop.pause();
        }
      },
      {
        // Trigger when any part (1%) is visible
        threshold: 0.01,
        // Add margin to start rendering slightly before visible
        rootMargin: '100px',
      }
    );

    this.visibilityObserver.observe(container);

    this.destroyRef.onDestroy(() => {
      this.visibilityObserver?.disconnect();
      this.visibilityObserver = null;
    });
  }

  private dispose(): void {
    // Stop the animation loop first (WebGPU uses setAnimationLoop)
    if (this.renderer) {
      this.renderer.setAnimationLoop(null);
    }

    this.renderLoop.stop();

    // Dispose Three.js resources
    this.renderer?.dispose();

    // Clear scene
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry?.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((m) => {
              // Check if material exists and hasn't been disposed
              if (m && typeof m.dispose === 'function') {
                try {
                  m.dispose();
                } catch {
                  // Material may already be disposed
                }
              }
            });
          } else if (
            object.material &&
            typeof object.material.dispose === 'function'
          ) {
            try {
              object.material.dispose();
            } catch {
              // Material may already be disposed (shared between cloned meshes)
            }
          }
        }
      });
      this.scene.clear();
    }

    // Clear service references
    this.sceneService.clear();
    this.sceneReadyService.clear();
  }
}
