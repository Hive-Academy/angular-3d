/**
 * Scene3D Component - Root scene container for Three.js
 *
 * Creates and manages WebGLRenderer, Scene, and PerspectiveCamera.
 * Provides SceneService for child component access via DI.
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
  Injector,
  runInInjectionContext,
} from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';
import { RenderLoopService } from '../render-loop/render-loop.service';
import { SceneGraphStore } from '../store/scene-graph.store';
import { EffectComposerService } from '../postprocessing/effect-composer.service';
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
 */
export interface RendererConfig {
  antialias?: boolean;
  alpha?: boolean;
  powerPreference?: 'high-performance' | 'low-power' | 'default';
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
    SceneGraphStore, // Per-scene instance for isolated scene graphs
    RenderLoopService, // Per-scene instance for independent render loops
    EffectComposerService, // Per-scene instance for independent post-processing
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
  public readonly powerPreference = input<
    'high-performance' | 'low-power' | 'default'
  >('high-performance');

  // Scene inputs
  public readonly backgroundColor = input<number | null>(null);
  public readonly enableShadows = input<boolean>(false);

  // Three.js objects
  private renderer!: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private camera!: THREE.PerspectiveCamera;

  public constructor() {
    // Capture injector for use in afterNextRender callback
    const injector = inject(Injector);

    // Expose scene immediately so children can access it in ngOnInit
    this.sceneService.setScene(this.scene);

    // Setup initialization after first render (browser-only)
    afterNextRender(() => {
      // Wrap in injection context so child components can use effect()
      runInInjectionContext(injector, () => {
        this.initRenderer();
        this.initScene(); // Sets background color
        this.initCamera();

        // Expose renderer and camera (available after init)
        this.sceneService.setRenderer(this.renderer);
        this.sceneService.setCamera(this.camera);

        // Initialize scene graph store with core Three.js objects
        this.sceneStore.initScene(this.scene, this.camera, this.renderer);

        // Start render loop delegating to RenderLoopService
        this.renderLoop.start(() => {
          this.renderer.render(this.scene, this.camera);
        });

        // Setup resize handler
        this.setupResizeHandler();
      });
    });

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
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
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Get the current camera instance
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  private initRenderer(): void {
    const canvas = this.canvasRef().nativeElement;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.enableAntialiasing(),
      alpha: this.alpha(),
      powerPreference: this.powerPreference(),
    });

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
