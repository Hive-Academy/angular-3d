/**
 * Render Loop Service - Frame loop management
 *
 * Manages requestAnimationFrame loop outside Angular zone.
 * Provides callback registration for per-frame updates.
 *
 * Supports two rendering modes:
 * - 'always': Continuous rendering at 60fps (default, backward compatible)
 * - 'demand': Only render when invalidate() is called, saving battery
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
 * Frame loop mode for rendering optimization
 * - 'always': Continuous rendering at 60fps (default)
 * - 'demand': Only render when scene changes (battery efficient)
 */
export type FrameloopMode = 'always' | 'demand';

/**
 * Service for managing the Three.js render loop.
 *
 * Runs the animation frame loop outside Angular zone for optimal performance.
 * Components can register callbacks to be called each frame with delta time.
 *
 * Supports demand-based rendering for battery efficiency:
 * - Set frameloop to 'demand' to only render when scene changes
 * - Call invalidate() to request a render frame
 * - GPU usage drops to 0% when idle in demand mode
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
 *
 * @example
 * ```typescript
 * // Demand-based rendering for static scenes
 * this.renderLoop.setFrameloop('demand');
 *
 * // Request render when scene changes
 * this.renderLoop.invalidate();
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

  // Demand-based rendering state
  private readonly _frameloop = signal<FrameloopMode>('always');
  private readonly _needsRender = signal<boolean>(true);
  private invalidateTimeout: ReturnType<typeof setTimeout> | null = null;

  // Public readonly signals
  public readonly isRunning = this._isRunning.asReadonly();
  public readonly isPaused = this._isPaused.asReadonly();
  public readonly fps = this._fps.asReadonly();

  /** Current frameloop mode ('always' or 'demand') */
  public readonly frameloop = this._frameloop.asReadonly();

  /** Whether a render is pending in demand mode */
  public readonly needsRender = this._needsRender.asReadonly();

  // Render function reference (set by Scene3dComponent)
  private renderFn: (() => void) | null = null;

  // FPS calculation
  private frameCount = 0;
  private lastFpsUpdate = 0;
  private renderCount = 0; // Actual renders for FPS in demand mode

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

  /**
   * Set the frame loop mode
   *
   * @param mode - 'always' for continuous rendering, 'demand' for on-change only
   *
   * @example
   * ```typescript
   * // Enable demand-based rendering for battery efficiency
   * renderLoop.setFrameloop('demand');
   *
   * // Switch back to continuous rendering
   * renderLoop.setFrameloop('always');
   * ```
   */
  public setFrameloop(mode: FrameloopMode): void {
    this._frameloop.set(mode);

    if (mode === 'always') {
      // Always mode needs continuous rendering
      this._needsRender.set(true);

      // Clear any pending idle timeout
      if (this.invalidateTimeout !== null) {
        clearTimeout(this.invalidateTimeout);
        this.invalidateTimeout = null;
      }
    }
  }

  /**
   * Request a render frame in demand mode
   *
   * In 'always' mode, this is a no-op since rendering is continuous.
   * In 'demand' mode, this marks the scene as needing a render and
   * restarts the RAF loop if it was stopped.
   *
   * Call this method whenever the scene changes:
   * - Object transforms updated
   * - Camera moved (OrbitControls)
   * - Animations running (GSAP)
   * - Properties changed
   *
   * @example
   * ```typescript
   * // After updating object position
   * mesh.position.set(x, y, z);
   * this.renderLoop.invalidate();
   *
   * // In OrbitControls change handler
   * controls.addEventListener('change', () => {
   *   this.renderLoop.invalidate();
   * });
   * ```
   */
  public invalidate(): void {
    // In 'always' mode, we're already rendering continuously
    if (this._frameloop() === 'always') {
      return;
    }

    // Mark that we need to render
    this._needsRender.set(true);

    // Clear existing idle timeout
    if (this.invalidateTimeout !== null) {
      clearTimeout(this.invalidateTimeout);
      this.invalidateTimeout = null;
    }

    // Restart RAF loop if it was stopped
    if (this._isRunning() && this.animationFrameId === null) {
      this.ngZone.runOutsideAngular(() => {
        this.loop();
      });
    }

    // Set timeout to stop RAF after idle period (100ms)
    this.invalidateTimeout = setTimeout(() => {
      if (
        this._frameloop() === 'demand' &&
        !this._needsRender() &&
        this.animationFrameId !== null
      ) {
        // Stop RAF loop when idle in demand mode
        cancelAnimationFrame(this.animationFrameId);
        this.animationFrameId = null;
      }
      this.invalidateTimeout = null;
    }, 100);
  }

  private loop = (): void => {
    if (!this._isRunning()) {
      return;
    }

    // Check if we should render in demand mode
    const shouldRender = this._frameloop() === 'always' || this._needsRender();

    // In demand mode with no pending render, still schedule next check
    // but don't render or call callbacks
    if (!shouldRender) {
      this.animationFrameId = requestAnimationFrame(this.loop);
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

    // Track actual renders for FPS in demand mode
    this.renderCount++;

    // Reset needsRender flag after rendering in demand mode
    if (this._frameloop() === 'demand') {
      this._needsRender.set(false);
    }

    // Update FPS
    this.updateFps();
  };

  private updateFps(): void {
    this.frameCount++;
    const now = performance.now();

    if (now - this.lastFpsUpdate >= 1000) {
      // In demand mode, report actual render count (not RAF calls)
      // This shows 0fps when idle, reflecting actual GPU usage
      const actualFrames =
        this._frameloop() === 'demand' ? this.renderCount : this.frameCount;

      this._fps.set(
        Math.round((actualFrames * 1000) / (now - this.lastFpsUpdate))
      );
      this.frameCount = 0;
      this.renderCount = 0;
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

    // Clear idle timeout
    if (this.invalidateTimeout !== null) {
      clearTimeout(this.invalidateTimeout);
      this.invalidateTimeout = null;
    }

    if (typeof document !== 'undefined') {
      document.removeEventListener(
        'visibilitychange',
        this.handleVisibilityChange
      );
    }
  }
}
