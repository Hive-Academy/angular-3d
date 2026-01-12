/**
 * Scene Service - DI-based scene access for child components
 *
 * Provides reactive access to Three.js scene objects via Angular signals.
 * Provided at Scene3dComponent level for scene isolation.
 *
 * NOTE: This service is intentionally NOT providedIn: 'root' because it
 * should be scoped to the Scene3dComponent that provides it. Each scene
 * gets its own instance of this service.
 *
 * WebGPU Migration: Now uses WebGPURenderer with backend detection.
 * Use isWebGPU() to check which backend is active.
 */

import { Injectable, inject, signal } from '@angular/core';
import * as THREE from 'three/webgpu';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * Injectable service for accessing the active Three.js scene context.
 *
 * This service should be provided at the Scene3dComponent level,
 * allowing child components to inject and access scene objects.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'app-my-object',
 *   template: ''
 * })
 * export class MyObjectComponent implements AfterViewInit, OnDestroy {
 *   private sceneService = inject(SceneService);
 *   private mesh?: THREE.Mesh;
 *
 *   ngAfterViewInit() {
 *     this.mesh = new THREE.Mesh(geometry, material);
 *     this.sceneService.addToScene(this.mesh);
 *   }
 *
 *   ngOnDestroy() {
 *     if (this.mesh) {
 *       this.sceneService.removeFromScene(this.mesh);
 *     }
 *   }
 * }
 * ```
 */
/**
 * Backend type indicator for WebGPU/WebGL detection
 */
export type RenderBackend = 'webgpu' | 'webgl' | null;

// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class SceneService {
  // Inject RenderLoopService for invalidate() proxy
  private readonly renderLoop = inject(RenderLoopService);

  // Writable signals for internal updates
  private readonly _scene = signal<THREE.Scene | null>(null);
  private readonly _renderer = signal<THREE.WebGPURenderer | null>(null);
  private readonly _camera = signal<THREE.PerspectiveCamera | null>(null);
  private readonly _backend = signal<RenderBackend>(null);

  // Public readonly signals for consumers
  public readonly scene = this._scene.asReadonly();
  public readonly renderer = this._renderer.asReadonly();
  public readonly camera = this._camera.asReadonly();

  /** Current render backend ('webgpu' or 'webgl') */
  public readonly backend = this._backend.asReadonly();

  /**
   * Get the renderer's DOM element for controls like OrbitControls
   */
  public get domElement(): HTMLCanvasElement | null {
    return this._renderer()?.domElement ?? null;
  }

  /**
   * Set the active scene (called by Scene3dComponent)
   */
  public setScene(scene: THREE.Scene): void {
    this._scene.set(scene);
  }

  /**
   * Set the active renderer (called by Scene3dComponent)
   *
   * Automatically detects and sets the backend type (WebGPU or WebGL).
   */
  public setRenderer(renderer: THREE.WebGPURenderer): void {
    this._renderer.set(renderer);

    // Detect and set backend type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const backend = (renderer as any).backend;
    this._backend.set(backend?.isWebGPU ? 'webgpu' : 'webgl');
  }

  /**
   * Check if WebGPU backend is active
   *
   * @returns true if using WebGPU, false if using WebGL fallback
   *
   * @example
   * ```typescript
   * if (this.sceneService.isWebGPU()) {
   *   console.log('Running on WebGPU');
   * } else {
   *   console.log('Fell back to WebGL');
   * }
   * ```
   */
  public isWebGPU(): boolean {
    return this._backend() === 'webgpu';
  }

  /**
   * Check if WebGL fallback is active
   *
   * @returns true if using WebGL, false if using WebGPU or not initialized
   */
  public isWebGL(): boolean {
    return this._backend() === 'webgl';
  }

  /**
   * Set the active camera (called by Scene3dComponent)
   */
  public setCamera(camera: THREE.PerspectiveCamera): void {
    this._camera.set(camera);
  }

  /**
   * Add a Three.js object to the scene
   */
  public addToScene(object: THREE.Object3D): void {
    const sceneInstance = this._scene();
    if (sceneInstance) {
      sceneInstance.add(object);
    }
  }

  /**
   * Remove a Three.js object from the scene
   */
  public removeFromScene(object: THREE.Object3D): void {
    const sceneInstance = this._scene();
    if (sceneInstance) {
      sceneInstance.remove(object);
    }
  }

  /**
   * Traverse the scene and execute callback for each object
   */
  public traverseScene(callback: (object: THREE.Object3D) => void): void {
    const sceneInstance = this._scene();
    if (sceneInstance) {
      sceneInstance.traverse(callback);
    }
  }

  /**
   * Find an object in the scene by name
   */
  public findByName(name: string): THREE.Object3D | undefined {
    const sceneInstance = this._scene();
    return sceneInstance?.getObjectByName(name);
  }

  /**
   * Request a render frame in demand mode
   *
   * This is a convenience proxy to RenderLoopService.invalidate().
   * Use this method when updating the scene programmatically to ensure
   * the changes are rendered in demand mode.
   *
   * In 'always' mode, this is a no-op since rendering is continuous.
   * In 'demand' mode, this triggers a render on the next frame.
   *
   * @example
   * ```typescript
   * // After updating object transforms
   * mesh.position.set(x, y, z);
   * this.sceneService.invalidate();
   *
   * // After loading a new model
   * this.sceneService.addToScene(model);
   * this.sceneService.invalidate();
   *
   * // In animation callbacks
   * gsap.to(mesh.rotation, {
   *   y: Math.PI * 2,
   *   onUpdate: () => this.sceneService.invalidate()
   * });
   * ```
   */
  public invalidate(): void {
    this.renderLoop.invalidate();
  }

  /**
   * Clear all internal references (called on Scene3dComponent destroy)
   */
  public clear(): void {
    this._scene.set(null);
    this._renderer.set(null);
    this._camera.set(null);
    this._backend.set(null);
  }
}
