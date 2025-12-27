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
    {
      provide: NG_3D_PARENT,
      useFactory: (sceneService: SceneService) => () => sceneService.scene(),
      deps: [SceneService],
    },
  ],
  template: `
    <div class="scene-container">
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
      }

      .scene-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
      }

      canvas {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: block;
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

  // Flag to track when renderer is ready for reactive effects
  private rendererInitialized = false;

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
      if (!this.rendererInitialized) {
        return;
      }
      if (bgColor !== null) {
        this.scene.background = new THREE.Color(bgColor);
      } else {
        this.scene.background = null;
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
          this.renderLoop.setRenderFunction(() => {
            this.renderer.render(this.scene, this.camera);
          });

          // Mark render loop as running (without starting internal RAF loop)
          this.renderLoop.markAsRunning();

          // Setup resize handler
          this.setupResizeHandler();

          // Mark renderer as initialized - this triggers the background effect above
          this.rendererInitialized = true;
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

    this.renderer = new THREE.WebGPURenderer({
      canvas,
      antialias: this.enableAntialiasing(),
      alpha: this.alpha(),
      powerPreference: this.powerPreference(),
    });

    // CRITICAL: Must await init() before first render
    // This initializes the WebGPU adapter/device or falls back to WebGL
    await this.renderer.init();

    // Log backend detection for debugging
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backend = (this.renderer as any).backend;
    if (backend?.isWebGPU) {
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
            object.material.forEach((m) => m.dispose());
          } else {
            object.material?.dispose();
          }
        }
      });
      this.scene.clear();
    }

    // Clear service references
    this.sceneService.clear();
  }
}
