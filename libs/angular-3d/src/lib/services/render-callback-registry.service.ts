/**
 * RenderCallbackRegistry - Centralized render callback management
 *
 * Manages per-component render callbacks with:
 * - Priority-based execution order
 * - Active/paused state per callback
 * - Automatic cleanup via returned unsubscribe function
 *
 * This service integrates with Angular's lifecycle to enable
 * visibility-aware rendering - components can pause their
 * render callbacks when off-screen.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private registry = inject(RenderCallbackRegistry);
 *   private componentId = `my-component-${crypto.randomUUID()}`;
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       const cleanup = this.registry.register(
 *         this.componentId,
 *         (delta) => this.animate(delta),
 *         { priority: 10 }
 *       );
 *       inject(DestroyRef).onDestroy(cleanup);
 *     });
 *   }
 *
 *   // Pause when off-screen
 *   onVisibilityChange(visible: boolean) {
 *     if (visible) {
 *       this.registry.resume(this.componentId);
 *     } else {
 *       this.registry.pause(this.componentId);
 *     }
 *   }
 * }
 * ```
 */
import { Injectable, signal, computed } from '@angular/core';

/**
 * Options for registering a render callback
 */
export interface RenderCallbackOptions {
  /**
   * Priority for execution order (higher = runs first)
   * Default: 0
   */
  priority?: number;

  /**
   * Start in paused state
   * Default: false (active)
   */
  startPaused?: boolean;
}

/**
 * Internal callback entry
 */
interface CallbackEntry {
  callback: (delta: number, elapsed: number) => void;
  active: boolean;
  priority: number;
}

@Injectable({ providedIn: 'root' })
export class RenderCallbackRegistry {
  private readonly callbacks = new Map<string, CallbackEntry>();

  // Signals for reactive state
  private readonly _activeCount = signal(0);
  private readonly _totalCount = signal(0);

  /** Number of currently active (non-paused) callbacks */
  public readonly activeCount = this._activeCount.asReadonly();

  /** Total number of registered callbacks */
  public readonly totalCount = this._totalCount.asReadonly();

  /** Whether any callbacks are active */
  public readonly hasActiveCallbacks = computed(() => this._activeCount() > 0);

  /**
   * Register a callback to be called each frame
   *
   * @param id Unique identifier for this callback (use component ID)
   * @param callback Function to call with delta time (seconds) and elapsed time
   * @param options Optional configuration
   * @returns Cleanup function to unregister the callback
   */
  public register(
    id: string,
    callback: (delta: number, elapsed: number) => void,
    options: RenderCallbackOptions = {}
  ): () => void {
    const { priority = 0, startPaused = false } = options;

    // Remove existing if re-registering
    if (this.callbacks.has(id)) {
      this.unregister(id);
    }

    this.callbacks.set(id, {
      callback,
      active: !startPaused,
      priority,
    });

    this.updateCounts();

    // Return cleanup function
    return () => this.unregister(id);
  }

  /**
   * Unregister a callback
   */
  public unregister(id: string): void {
    this.callbacks.delete(id);
    this.updateCounts();
  }

  /**
   * Pause a callback (stops it from being called)
   */
  public pause(id: string): void {
    const entry = this.callbacks.get(id);
    if (entry && entry.active) {
      entry.active = false;
      this.updateCounts();
    }
  }

  /**
   * Resume a paused callback
   */
  public resume(id: string): void {
    const entry = this.callbacks.get(id);
    if (entry && !entry.active) {
      entry.active = true;
      this.updateCounts();
    }
  }

  /**
   * Check if a callback is currently active
   */
  public isActive(id: string): boolean {
    return this.callbacks.get(id)?.active ?? false;
  }

  /**
   * Process one frame - call all active callbacks
   *
   * @param delta Time since last frame in seconds
   * @param elapsed Total elapsed time in seconds
   */
  public tick(delta: number, elapsed: number): void {
    // Get active callbacks sorted by priority (descending)
    const activeCallbacks = [...this.callbacks.entries()]
      .filter(([, entry]) => entry.active)
      .sort((a, b) => b[1].priority - a[1].priority);

    // Call each active callback
    for (const [id, entry] of activeCallbacks) {
      try {
        entry.callback(delta, elapsed);
      } catch (error) {
        console.error(
          `[RenderCallbackRegistry] Error in callback "${id}":`,
          error
        );
      }
    }
  }

  /**
   * Pause all callbacks (useful for page visibility changes)
   */
  public pauseAll(): void {
    for (const entry of this.callbacks.values()) {
      entry.active = false;
    }
    this.updateCounts();
  }

  /**
   * Resume all callbacks
   */
  public resumeAll(): void {
    for (const entry of this.callbacks.values()) {
      entry.active = true;
    }
    this.updateCounts();
  }

  /**
   * Get debug info about registered callbacks
   */
  public getDebugInfo(): { id: string; active: boolean; priority: number }[] {
    return [...this.callbacks.entries()].map(([id, entry]) => ({
      id,
      active: entry.active,
      priority: entry.priority,
    }));
  }

  private updateCounts(): void {
    this._totalCount.set(this.callbacks.size);
    this._activeCount.set(
      [...this.callbacks.values()].filter((e) => e.active).length
    );
  }
}
