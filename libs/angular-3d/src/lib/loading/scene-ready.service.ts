/**
 * Scene Ready Service - Detects when a Three.js scene is fully initialized
 *
 * Tracks two key initialization milestones:
 * 1. Renderer ready - WebGPU/WebGL renderer has completed async initialization
 * 2. First frame rendered - The first frame has been drawn to the canvas
 *
 * Provides a computed `isSceneReady` signal that becomes true when both
 * conditions are met, enabling loading overlays to coordinate their fade-out
 * with actual scene readiness.
 *
 * NOTE: This service is intentionally NOT providedIn: 'root' because it
 * should be scoped to the Scene3dComponent that provides it. Each scene
 * gets its own instance of this service for proper isolation.
 *
 * @example
 * ```typescript
 * // In Scene3dComponent providers array:
 * providers: [SceneReadyService, ...]
 *
 * // In component:
 * private readonly sceneReadyService = inject(SceneReadyService);
 *
 * // After renderer.init() completes:
 * this.sceneReadyService.setRendererReady();
 *
 * // After first render frame:
 * this.sceneReadyService.setFirstFrameRendered();
 *
 * // In template or consumer:
 * @if (sceneReadyService.isSceneReady()) {
 *   <div>Scene is ready!</div>
 * }
 * ```
 */

import { Injectable, signal, computed } from '@angular/core';

// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class SceneReadyService {
  // Private writable signals for internal state management
  // Pattern source: libs/angular-3d/src/lib/canvas/scene.service.ts:60-64
  private readonly _rendererReady = signal<boolean>(false);
  private readonly _firstFrameRendered = signal<boolean>(false);

  // Public readonly signals for consumers
  // Pattern source: libs/angular-3d/src/lib/canvas/scene.service.ts:66-68

  /**
   * Signal indicating whether the renderer has completed async initialization.
   * Becomes true after WebGPURenderer.init() completes successfully.
   */
  public readonly rendererReady = this._rendererReady.asReadonly();

  /**
   * Signal indicating whether the first frame has been rendered.
   * Becomes true after the first render callback execution.
   */
  public readonly firstFrameRendered = this._firstFrameRendered.asReadonly();

  /**
   * Computed signal combining both conditions.
   * True when renderer is ready AND first frame has been rendered.
   *
   * Use this signal to coordinate loading overlay fade-out timing.
   */
  public readonly isSceneReady = computed(
    () => this._rendererReady() && this._firstFrameRendered()
  );

  /**
   * Mark the renderer as ready.
   * Called by Scene3dComponent after successful renderer.init() completion.
   *
   * This should be called AFTER:
   * - WebGPURenderer.init() promise resolves
   * - sceneService.setRenderer() is called
   * - Scene and camera are configured
   */
  public setRendererReady(): void {
    this._rendererReady.set(true);
  }

  /**
   * Mark the first frame as rendered.
   * Called by Scene3dComponent on the first render callback execution.
   *
   * This should be called ONCE when the first frame is drawn:
   * - Inside the render function callback
   * - Use a flag to ensure single execution
   * - Check destroyed state before calling
   */
  public setFirstFrameRendered(): void {
    this._firstFrameRendered.set(true);
  }

  /**
   * Reset the service state for replay scenarios.
   * Useful when re-initializing a scene without destroying the component.
   *
   * Sets both signals back to false, requiring a new initialization cycle.
   */
  public reset(): void {
    this._rendererReady.set(false);
    this._firstFrameRendered.set(false);
  }

  /**
   * Clear all internal state.
   * Called when Scene3dComponent is destroyed.
   *
   * Pattern source: libs/angular-3d/src/lib/canvas/scene.service.ts:207-212
   */
  public clear(): void {
    this.reset();
  }
}
