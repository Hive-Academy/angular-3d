/**
 * Render Loop Service - Frame loop management
 *
 * Manages requestAnimationFrame loop outside Angular zone.
 * Provides callback registration for per-frame updates.
 */

import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import * as THREE from 'three';

/**
 * Callback function type for per-frame updates
 */
export type UpdateCallback = (delta: number, elapsed: number) => void;

/**
 * Frame context passed to registered callbacks
 */
export interface FrameContext {
  delta: number;
  elapsed: number;
  clock: THREE.Clock;
}

/**
 * Service for managing the Three.js render loop.
 *
 * Runs the animation frame loop outside Angular zone for optimal performance.
 * Components can register callbacks to be called each frame with delta time.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class RotatingCubeComponent implements AfterViewInit {
 *   private renderLoop = inject(RenderLoopService);
 *   private destroyRef = inject(DestroyRef);
 *
 *   ngAfterViewInit() {
 *     const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
 *       this.mesh.rotation.y += delta * this.speed;
 *     });
 *
 *     this.destroyRef.onDestroy(cleanup);
 *   }
 * }
 * ```
 */
@Injectable()
export class RenderLoopService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  private animationFrameId: number | null = null;
  private readonly updateCallbacks = new Set<UpdateCallback>();
  private readonly clock = new THREE.Clock(false);

  // State signals
  private readonly _isRunning = signal<boolean>(false);
  private readonly _isPaused = signal<boolean>(false);
  private readonly _fps = signal<number>(0);

  // Public readonly signals
  public readonly isRunning = this._isRunning.asReadonly();
  public readonly isPaused = this._isPaused.asReadonly();
  public readonly fps = this._fps.asReadonly();

  // Render function reference (set by Scene3dComponent)
  private renderFn: (() => void) | null = null;

  // FPS calculation
  private frameCount = 0;
  private lastFpsUpdate = 0;

  public constructor() {
    // Setup visibility change handler
    if (typeof document !== 'undefined') {
      document.addEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }
  }

  /**
   * Start the render loop
   *
   * @param renderFn - Optional render function to call each frame
   */
  public start(renderFn?: () => void): void {
    if (this._isRunning()) {
      return;
    }

    if (renderFn) {
      this.renderFn = renderFn;
    }

    this._isRunning.set(true);
    this._isPaused.set(false);
    this.clock.start();
    this.lastFpsUpdate = performance.now();
    this.frameCount = 0;

    this.ngZone.runOutsideAngular(() => {
      this.loop();
    });
  }

  /**
   * Stop the render loop completely
   */
  public stop(): void {
    this._isRunning.set(false);
    this._isPaused.set(false);
    this.clock.stop();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Pause the render loop (keeps running but doesn't update)
   */
  public pause(): void {
    if (!this._isRunning() || this._isPaused()) {
      return;
    }

    this._isPaused.set(true);
    this.clock.stop();
  }

  /**
   * Resume a paused render loop
   */
  public resume(): void {
    if (!this._isRunning() || !this._isPaused()) {
      return;
    }

    this._isPaused.set(false);
    this.clock.start();
  }

  /**
   * Register a callback to be called each frame
   *
   * @param callback - Function to call with delta and elapsed time
   * @returns Cleanup function to unregister the callback
   */
  public registerUpdateCallback(callback: UpdateCallback): () => void {
    this.updateCallbacks.add(callback);

    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Unregister a previously registered callback
   */
  public unregisterUpdateCallback(callback: UpdateCallback): void {
    this.updateCallbacks.delete(callback);
  }

  /**
   * Clear all registered callbacks
   */
  public clearCallbacks(): void {
    this.updateCallbacks.clear();
  }

  /**
   * Set the render function to call each frame
   */
  public setRenderFunction(fn: () => void): void {
    this.renderFn = fn;
  }

  /**
   * Get all registered callback count (useful for debugging)
   */
  public getCallbackCount(): number {
    return this.updateCallbacks.size;
  }

  private loop = (): void => {
    if (!this._isRunning()) {
      return;
    }

    this.animationFrameId = requestAnimationFrame(this.loop);

    // Skip updates if paused
    if (this._isPaused()) {
      return;
    }

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Call all registered update callbacks
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(delta, elapsed);
      } catch (error) {
        console.error('Error in render loop callback:', error);
      }
    });

    // Call render function if set
    if (this.renderFn) {
      this.renderFn();
    }

    // Update FPS
    this.updateFps();
  };

  private updateFps(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      this._fps.set(
        Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate))
      );
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  private handleVisibilityChange = (): void => {
    if (typeof document === 'undefined') {
      return;
    }

    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  /**
   * Cleanup on service destroy
   */
  public ngOnDestroy(): void {
    this.stop();
    this.clearCallbacks();

    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }
  }
}
