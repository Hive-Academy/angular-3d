/**
 * ScrollZoomCoordinatorDirective - Coordinates 3D Orbit Zoom with Page Scrolling
 *
 * This directive bridges the gap between Three.js OrbitControls zoom and native page scrolling,
 * creating a seamless parallax experience where:
 * 1. Mouse wheel zooms the camera in 3D space (zoom in = closer to scene)
 * 2. When max zoom distance is reached, additional scroll triggers page scroll down
 * 3. When min zoom distance is reached while scrolling up, it scrolls page up
 *
 * Features:
 * - Smooth transition between 3D zoom and page scroll
 * - Prevents scroll conflicts when zoom limits are reached
 * - Configurable thresholds and sensitivity
 * - Works with Angular's zone and change detection
 * - Emits events for zoom enable/disable state changes
 *
 * Usage (Applied to OrbitControls):
 * ```html
 * <a3d-orbit-controls
 *   scrollZoomCoordinator
 *   [orbitControls]="orbitControlsInstance"
 *   [enableZoom]="isZoomEnabled"
 *   [minDistance]="5"
 *   [maxDistance]="50"
 *   [scrollThreshold]="0.5"
 *   (controlsChange)="onControlsChange($event)"
 *   (zoomEnabledChange)="onZoomEnabledChange($event)"
 * />
 * ```
 *
 * Alternative Usage (As separate element):
 * ```html
 * <a3d-scene-3d>
 *   <ng-container
 *     a3dScrollZoomCoordinator
 *     [maxDistance]="40"
 *     [scrollThreshold]="1"
 *     (zoomComplete)="onZoomComplete()" />
 *
 *   <a3d-orbit-controls
 *     [enableZoom]="true"
 *     [minDistance]="8"
 *     [maxDistance]="40" />
 * </a3d-scene-3d>
 * ```
 *
 * @see https://threejs.org/docs/#examples/en/controls/OrbitControls
 */

import {
  Directive,
  inject,
  DestroyRef,
  NgZone,
  afterNextRender,
  input,
  output,
  signal,
  computed,
  PLATFORM_ID,
  effect,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { OrbitControls } from 'three-stdlib';
import { SceneService } from '../../canvas/scene.service';

/**
 * Scroll/zoom state (simple mode)
 */
export type ScrollZoomState = 'zooming' | 'complete' | 'idle';

/**
 * Detailed scroll-zoom state (advanced mode with OrbitControls)
 */
export interface ScrollZoomDetailedState {
  /** Current camera distance from target */
  distance: number;
  /** Whether at minimum zoom distance (closest) */
  atMinDistance: boolean;
  /** Whether at maximum zoom distance (farthest) */
  atMaxDistance: boolean;
  /** Whether page scroll should be enabled */
  allowPageScroll: boolean;
  /** Scroll direction: 1 = down/zoom out, -1 = up/zoom in, 0 = none */
  scrollDirection: number;
}

/**
 * Zoom progress event with detailed state
 */
export interface ZoomProgressEvent {
  /** Current camera distance from origin */
  currentDistance: number;
  /** Progress from 0 (closest) to 1 (furthest) */
  progress: number;
  /** Current state of the zoom coordinator */
  state: ScrollZoomState;
}

/**
 * ScrollZoomCoordinatorDirective
 *
 * Coordinates between OrbitControls zoom and page scrolling.
 * Monitors camera distance and controls scroll pass-through.
 *
 * Two usage modes:
 * 1. Applied directly to a3d-orbit-controls with [orbitControls] input (advanced)
 * 2. As separate element using SceneService (simple)
 */
@Directive({
  selector: '[a3dScrollZoomCoordinator], [scrollZoomCoordinator]',
  standalone: true,
})
export class ScrollZoomCoordinatorDirective
  implements AfterViewInit, OnDestroy
{
  // Inject services
  private readonly sceneService = inject(SceneService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /**
   * OrbitControls instance to monitor (advanced mode)
   * When provided, directive will use controls.domElement for wheel events
   * and controls.minDistance/maxDistance for thresholds
   */
  public readonly orbitControls = input<OrbitControls | undefined>(undefined);

  /**
   * Maximum camera distance (should match OrbitControls maxDistance)
   * When reached, zoom is complete and page scrolling resumes
   * @default 40
   */
  public readonly maxDistance = input<number>(40);

  /**
   * Threshold distance from min/max before triggering page scroll
   * Value between 0-1, where 0.1 means trigger at 90% of limit
   * @default 0.5
   */
  public readonly scrollThreshold = input<number>(0.5);

  /**
   * Minimum time (ms) between scroll events to prevent jitter
   * @default 16 (~60fps)
   */
  public readonly scrollDebounceMs = input<number>(16);

  // ============================================================================
  // Outputs
  // ============================================================================

  /**
   * Emitted when zoom state changes (simple mode)
   */
  public readonly stateChange = output<ScrollZoomState>();

  /**
   * Emitted when detailed scroll-zoom state changes (advanced mode)
   */
  public readonly detailedStateChange = output<ScrollZoomDetailedState>();

  /**
   * Emitted continuously during zoom with progress info
   */
  public readonly zoomProgress = output<ZoomProgressEvent>();

  /**
   * Emitted once when camera reaches maxDistance
   */
  public readonly zoomComplete = output<void>();

  /**
   * Emits when zoom should be enabled or disabled (advanced mode)
   * Parent component should bind [enableZoom] to respond to this
   */
  public readonly zoomEnabledChange = output<boolean>();

  /**
   * Emits when transitioning from 3D zoom to page scroll
   */
  public readonly scrollTransition = output<{ direction: 'up' | 'down' }>();

  // ============================================================================
  // Internal State (Signals)
  // ============================================================================

  private readonly _currentDistance = signal<number>(0);
  private readonly _state = signal<ScrollZoomState>('idle');
  private readonly _zoomCompleted = signal<boolean>(false);

  /** Whether zoom is currently active (blocking page scroll) */
  public readonly isZooming = computed(() => this._state() === 'zooming');

  /** Whether zoom is complete (at max distance) */
  public readonly isComplete = computed(() => this._zoomCompleted());

  // ============================================================================
  // Private State
  // ============================================================================

  private destroyed = false;
  private wheelHandler: ((e: WheelEvent) => void) | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private controls: OrbitControls | null = null;
  private changeListener: (() => void) | null = null;
  private lastWheelTime = 0;
  private isPageScrolling = false;
  private lastZoomEnabled = true;
  private animationFrameId: number | null = null;
  private initialized = false;

  public constructor() {
    // Watch for orbitControls input and initialize when available (advanced mode)
    effect(() => {
      const controls = this.orbitControls();
      if (controls && !this.initialized && isPlatformBrowser(this.platformId)) {
        this.controls = controls;
        this.initializeWithControls();
      }
    });

    // Initialize after next render (browser-only) - for simple mode
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId) && !this.initialized) {
        this.initializeCoordinator();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cleanup();
    });
  }

  public ngAfterViewInit(): void {
    // Lifecycle handled by effect and afterNextRender in constructor
    // This empty implementation satisfies the AfterViewInit interface
    // while allowing the directive to work with components that expect it
    void 0; // Intentional no-op
  }

  public ngOnDestroy(): void {
    this.cleanup();
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initialize in advanced mode (with OrbitControls instance)
   * Uses controls.domElement for wheel events
   */
  private initializeWithControls(): void {
    if (this.initialized || !this.controls) return;

    this.initialized = true;

    // Run outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.setupControlsWheelListener();
      this.setupChangeListener();
      this.startMonitoring();
    });
  }

  /**
   * Initialize in simple mode (using SceneService)
   * Uses canvas element from SceneService
   *
   * Includes retry mechanism for cases where the canvas is not yet available
   * (e.g., when Scene3dComponent is still initializing its async WebGPU renderer)
   */
  private initializeCoordinator(): void {
    // Skip if already initialized in advanced mode
    if (this.initialized) return;

    // Get the canvas element from the scene service
    this.canvasElement = this.sceneService.domElement;
    if (!this.canvasElement) {
      // Canvas not ready yet - retry after a short delay
      // This handles the case where Scene3dComponent is still initializing
      this.retryInitialization();
      return;
    }

    this.completeInitialization();
  }

  /**
   * Retry initialization after a delay
   * Gives Scene3dComponent time to complete async renderer initialization
   */
  private retryInitialization(retryCount = 0): void {
    const maxRetries = 5;
    const retryDelayMs = 100;

    if (this.destroyed || this.initialized) return;

    setTimeout(() => {
      if (this.destroyed || this.initialized) return;

      this.canvasElement = this.sceneService.domElement;
      if (this.canvasElement) {
        this.completeInitialization();
      } else if (retryCount < maxRetries) {
        // Retry again
        this.retryInitialization(retryCount + 1);
      } else {
        console.warn(
          'ScrollZoomCoordinatorDirective: Canvas element not found after retries. Coordination disabled.'
        );
      }
    }, retryDelayMs);
  }

  /**
   * Complete initialization once canvas is available
   */
  private completeInitialization(): void {
    if (this.initialized || !this.canvasElement) return;

    this.initialized = true;

    // Initialize camera distance
    const camera = this.sceneService.camera();
    if (camera) {
      this._currentDistance.set(camera.position.length());
    }

    // Create wheel handler for simple mode
    const handler = (event: WheelEvent): void => {
      this.handleWheel(event);
    };
    this.wheelHandler = handler;

    // Add wheel listener to canvas
    // We capture the wheel event to decide if it should scroll the page or let OrbitControls zoom
    this.ngZone.runOutsideAngular(() => {
      this.canvasElement?.addEventListener('wheel', handler, {
        passive: false,
      });
    });
  }

  /**
   * Setup wheel listener on OrbitControls domElement (advanced mode)
   *
   * CRITICAL: We must directly manipulate controls.enableZoom in the capture phase
   * BEFORE OrbitControls processes the wheel event. Otherwise, OrbitControls will
   * call preventDefault() and block page scrolling even at the distance limits.
   */
  private setupControlsWheelListener(): void {
    if (!this.controls) return;

    this.wheelHandler = (event: WheelEvent): void => {
      const now = Date.now();
      const timeSinceLastWheel = now - this.lastWheelTime;

      // Debounce rapid wheel events
      if (timeSinceLastWheel < this.scrollDebounceMs()) {
        return;
      }

      this.lastWheelTime = now;
      const state = this.getDetailedState();

      // Determine scroll direction (deltaY > 0 = scroll down/zoom out)
      const direction = event.deltaY > 0 ? 1 : -1;

      // Check if we should transition to page scroll
      if (state.atMaxDistance && direction > 0) {
        // At max zoom distance, scrolling down → DIRECTLY disable zoom on controls
        // This MUST happen before OrbitControls processes this event
        this.controls!.enableZoom = false;
        this.disableZoom(); // Emit for parent component state sync
        this.transitionToPageScroll('down');
        // Wheel event will now bubble to page for native scrolling
      } else if (state.atMinDistance && direction < 0) {
        // At min zoom distance, scrolling up → DIRECTLY disable zoom on controls
        this.controls!.enableZoom = false;
        this.disableZoom();
        this.transitionToPageScroll('up');
        // Wheel event will now bubble to page for native scrolling
      } else {
        // Within zoom range - enable zoom for OrbitControls to handle
        this.controls!.enableZoom = true;
        this.enableZoom();
        this.isPageScrolling = false;
      }
    };

    // Attach wheel listener to the controls' DOM element
    // CRITICAL: capture: true ensures we run BEFORE OrbitControls
    // passive: true is fine - we don't need to preventDefault, we control zoom directly
    this.controls.domElement?.addEventListener('wheel', this.wheelHandler, {
      passive: true,
      capture: true,
    });
  }

  /**
   * Setup change listener on OrbitControls (advanced mode)
   */
  private setupChangeListener(): void {
    if (!this.controls) return;

    this.changeListener = (): void => {
      // Emit state change whenever controls update
      const state = this.getDetailedState();

      // If we've moved away from limits, reset page scrolling flag and re-enable zoom
      if (!state.atMaxDistance && !state.atMinDistance) {
        if (this.isPageScrolling) {
          this.isPageScrolling = false;
        }
        // Directly re-enable zoom on controls
        this.controls!.enableZoom = true;
        this.enableZoom();
      }

      this.ngZone.run(() => {
        this.detailedStateChange.emit(state);
      });
    };

    this.controls.addEventListener('change', this.changeListener);
  }

  /**
   * Start monitoring in animation loop (advanced mode)
   */
  private startMonitoring(): void {
    const monitor = (): void => {
      if (this.controls && !this.destroyed) {
        // Auto-enable zoom when not actively page scrolling
        if (!this.isPageScrolling) {
          // Directly enable on controls to ensure sync
          this.controls.enableZoom = true;
          this.enableZoom();
        }
      }

      if (!this.destroyed) {
        this.animationFrameId = requestAnimationFrame(monitor);
      }
    };

    monitor();
  }

  private cleanup(): void {
    // Cleanup simple mode
    if (this.wheelHandler && this.canvasElement) {
      this.canvasElement.removeEventListener('wheel', this.wheelHandler);
      this.canvasElement = null;
    }

    // Cleanup advanced mode
    if (this.wheelHandler && this.controls) {
      this.controls.domElement?.removeEventListener('wheel', this.wheelHandler);
    }

    if (this.changeListener && this.controls) {
      this.controls.removeEventListener('change', this.changeListener);
      this.changeListener = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.wheelHandler = null;
    this.controls = null;
    this.initialized = false;
  }

  // ============================================================================
  // Wheel Event Handler
  // ============================================================================

  /**
   * Handle wheel events for scroll/zoom coordination.
   *
   * Logic:
   * - OrbitControls will handle the actual zoom (we don't prevent that)
   * - We check current camera distance to determine if page should scroll
   * - At max distance + scrolling down → allow page scroll
   * - Otherwise → block page scroll, let OrbitControls zoom
   */
  private handleWheel(event: WheelEvent): void {
    if (this.destroyed) return;

    const camera = this.sceneService.camera();
    if (!camera) return;

    // Get current camera distance from scene center
    const currentDistance = camera.position.length();
    this._currentDistance.set(currentDistance);

    const maxDist = this.maxDistance();
    const threshold = this.scrollThreshold();
    const isScrollingDown = event.deltaY > 0;
    const isScrollingUp = event.deltaY < 0;

    // Check if camera is at max distance (or very close)
    const isAtMaxDistance = currentDistance >= maxDist - threshold;

    // ========================================
    // DECISION: Allow page scroll or block it?
    // ========================================

    // Case 1: Already completed zoom + scrolling down → SCROLL PAGE
    if (this._zoomCompleted() && isScrollingDown) {
      // Wheel event on canvas doesn't scroll the page naturally
      window.scrollBy({
        top: event.deltaY,
        behavior: 'auto',
      });
      event.preventDefault();
      return;
    }

    // Case 2: At max distance + scrolling down → Complete zoom, SCROLL PAGE
    if (isAtMaxDistance && isScrollingDown) {
      if (!this._zoomCompleted()) {
        this._zoomCompleted.set(true);
        this.updateState('complete');
        this.ngZone.run(() => {
          this.zoomComplete.emit();
        });
      }
      // Wheel event on canvas doesn't scroll the page naturally
      // We need to programmatically scroll the page
      window.scrollBy({
        top: event.deltaY,
        behavior: 'auto',
      });
      event.preventDefault(); // Prevent any OrbitControls zoom attempt
      return;
    }

    // Case 3: Was completed but now scrolling up → Re-engage zoom mode
    if (this._zoomCompleted() && isScrollingUp) {
      this._zoomCompleted.set(false);
      this.updateState('zooming');
    }

    // Case 4: Not at max distance → BLOCK page scroll, let OrbitControls zoom
    event.preventDefault();

    // Update state to zooming if idle
    if (this._state() === 'idle') {
      this.updateState('zooming');
    }

    // Emit progress
    this.ngZone.run(() => {
      this.zoomProgress.emit({
        currentDistance,
        progress: Math.min(1, currentDistance / maxDist),
        state: this._state(),
      });
    });
  }

  // ============================================================================
  // State Management
  // ============================================================================

  private updateState(newState: ScrollZoomState): void {
    if (this._state() !== newState) {
      this._state.set(newState);
      this.ngZone.run(() => {
        this.stateChange.emit(newState);
      });
    }
  }

  // ============================================================================
  // State Calculation (Advanced Mode)
  // ============================================================================

  /**
   * Get detailed state for advanced mode
   */
  private getDetailedState(): ScrollZoomDetailedState {
    if (!this.controls) {
      return this.getEmptyDetailedState();
    }

    // Calculate current distance from target
    const distance = this.controls.object.position.distanceTo(
      this.controls.target
    );

    const minDist = this.controls.minDistance;
    const maxDist = this.controls.maxDistance;
    const threshold = this.scrollThreshold();

    // Check if at limits (with threshold tolerance)
    const atMinDistance = distance <= minDist + threshold;
    const atMaxDistance = distance >= maxDist - threshold;

    return {
      distance,
      atMinDistance,
      atMaxDistance,
      allowPageScroll: atMinDistance || atMaxDistance,
      scrollDirection: this.isPageScrolling ? 1 : 0,
    };
  }

  private getEmptyDetailedState(): ScrollZoomDetailedState {
    return {
      distance: 0,
      atMinDistance: false,
      atMaxDistance: false,
      allowPageScroll: false,
      scrollDirection: 0,
    };
  }

  // ============================================================================
  // Zoom Control Helpers (Advanced Mode)
  // ============================================================================

  private disableZoom(): void {
    if (!this.controls) return;

    // Only emit if state changed
    if (this.lastZoomEnabled !== false) {
      this.lastZoomEnabled = false;
      this.ngZone.run(() => {
        this.zoomEnabledChange.emit(false);
      });
    }
  }

  private enableZoom(): void {
    if (!this.controls) return;

    // Only emit if state changed
    if (this.lastZoomEnabled !== true) {
      this.lastZoomEnabled = true;
      this.ngZone.run(() => {
        this.zoomEnabledChange.emit(true);
      });
    }
  }

  // ============================================================================
  // Page Scroll Transition (Advanced Mode)
  // ============================================================================

  private transitionToPageScroll(direction: 'up' | 'down'): void {
    if (!this.controls) return;

    this.isPageScrolling = true;

    // Emit transition event for analytics/UI feedback
    this.ngZone.run(() => {
      this.scrollTransition.emit({ direction });
    });

    // Emit zoom complete when scrolling down past max
    if (direction === 'down' && !this._zoomCompleted()) {
      this._zoomCompleted.set(true);
      this.updateState('complete');
      this.ngZone.run(() => {
        this.zoomComplete.emit();
      });
    }
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get current scroll/zoom state (simple mode)
   */
  public getCurrentState(): ScrollZoomState {
    return this._state();
  }

  /**
   * Get detailed scroll-zoom state (advanced mode)
   */
  public getState(): ScrollZoomDetailedState {
    return this.getDetailedState();
  }

  /**
   * Enable/disable page scroll coordination
   */
  public setEnabled(enabled: boolean): void {
    if (!enabled) {
      this.isPageScrolling = false;
      this.enableZoom();
    }
  }

  /**
   * Reset to initial state (re-engages zoom)
   */
  public reset(): void {
    this._zoomCompleted.set(false);
    this.isPageScrolling = false;
    this.enableZoom();
    this.updateState('idle');
  }
}
