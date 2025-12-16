/**
 * Scene3D Component - Root scene container for Three.js
 *
 * Creates and manages WebGLRenderer, Scene, and PerspectiveCamera.
 * Provides SceneService for child component access via DI.
 */

import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  NgZone,
  DestroyRef,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  viewChild,
} from '@angular/core';
import * as THREE from 'three';
import { SceneService } from './scene.service';

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
 * Child components can inject `SceneService` to access these objects
 * and add their own Three.js objects to the scene.
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
  providers: [SceneService],
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
export class Scene3dComponent implements AfterViewInit, OnDestroy {
  // Use signal-based viewChild instead of decorator
  private readonly canvasRef =
    viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  // Dependency injection
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneService = inject(SceneService);

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
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private animationFrameId: number | null = null;
  private clock = new THREE.Clock();

  // Update callbacks registered by child components
  private readonly updateCallbacks = new Set<
    (delta: number, elapsed: number) => void
  >();

  public constructor() {
    // React to camera position changes
    effect(() => {
      const [x, y, z] = this.cameraPosition();
      if (this.camera) {
        this.camera.position.set(x, y, z);
      }
    });

    // React to camera FOV changes
    effect(() => {
      const fov = this.cameraFov();
      if (this.camera) {
        this.camera.fov = fov;
        this.camera.updateProjectionMatrix();
      }
    });

    // React to background color changes
    effect(() => {
      const color = this.backgroundColor();
      if (this.scene) {
        this.scene.background = color !== null ? new THREE.Color(color) : null;
      }
    });
  }

  public ngAfterViewInit(): void {
    this.initRenderer();
    this.initScene();
    this.initCamera();

    // Expose to child components via service
    this.sceneService.setScene(this.scene);
    this.sceneService.setRenderer(this.renderer);
    this.sceneService.setCamera(this.camera);

    // Start render loop
    this.startRenderLoop();

    // Setup resize handler
    this.setupResizeHandler();

    // Setup visibility change handler
    this.setupVisibilityHandler();

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
    this.updateCallbacks.add(callback);
    return () => {
      this.updateCallbacks.delete(callback);
    };
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
    this.scene = new THREE.Scene();

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

  private startRenderLoop(): void {
    this.clock.start();

    // Run outside Angular zone to prevent change detection on every frame
    this.ngZone.runOutsideAngular(() => {
      const render = (): void => {
        this.animationFrameId = requestAnimationFrame(render);

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        // Call all registered update callbacks
        this.updateCallbacks.forEach((callback) => {
          callback(delta, elapsed);
        });

        // Render the scene
        this.renderer.render(this.scene, this.camera);
      };

      render();
    });
  }

  private stopRenderLoop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.clock.stop();
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

  private setupVisibilityHandler(): void {
    const handleVisibilityChange = (): void => {
      if (document.hidden) {
        this.clock.stop();
      } else {
        this.clock.start();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  private dispose(): void {
    this.stopRenderLoop();

    // Clear update callbacks
    this.updateCallbacks.clear();

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
