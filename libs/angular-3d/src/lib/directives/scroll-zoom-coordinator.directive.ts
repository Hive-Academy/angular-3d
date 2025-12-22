/**
 * ScrollZoomCoordinatorDirective - Coordinate 3D zoom and page scrolling
 *
 * IMPORTANT: This directive works WITH OrbitControls, not instead of it.
 * Place this directive inside a a3d-scene-3d that has OrbitControls.
 *
 * Behavior:
 * - OrbitControls handles the actual zoom (mouse wheel)
 * - This directive monitors camera distance and:
 *   - Blocks page scroll while camera is zooming (between min/max)
 *   - Allows page scroll when camera reaches maxDistance and user scrolls down
 *   - Re-engages zoom mode when user scrolls up (zooming back in)
 *
 * Features:
 * - Works transparently with OrbitControls
 * - NgZone.runOutsideAngular for performance
 * - Signal-based state tracking
 * - Emits events for zoom progress and completion
 *
 * @example
 * ```html
 * <a3d-scene-3d>
 *   <!-- Coordinator observes zoom state -->
 *   <ng-container
 *     a3dScrollZoomCoordinator
 *     [maxDistance]="40"
 *     [scrollThreshold]="1"
 *     (zoomComplete)="onZoomComplete()" />
 *
 *   <!-- OrbitControls handles actual zooming -->
 *   <a3d-orbit-controls
 *     [enableZoom]="true"
 *     [minDistance]="8"
 *     [maxDistance]="40" />
 * </a3d-scene-3d>
 * ```
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
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SceneService } from '../canvas/scene.service';

/**
 * Scroll/zoom state
 */
export type ScrollZoomState = 'zooming' | 'complete' | 'idle';

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
 */
@Directive({
  selector: '[a3dScrollZoomCoordinator]',
  standalone: true,
})
export class ScrollZoomCoordinatorDirective {
  // Inject services
  private readonly sceneService = inject(SceneService);
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /**
   * Maximum camera distance (should match OrbitControls maxDistance)
   * When reached, zoom is complete and page scrolling resumes
   * @default 40
   */
  public readonly maxDistance = input<number>(40);

  /**
   * Threshold distance from max to consider zoom "complete"
   * Accounts for damping/floating point precision
   * @default 1
   */
  public readonly scrollThreshold = input<number>(1);

  // ============================================================================
  // Outputs
  // ============================================================================

  /**
   * Emitted when zoom state changes
   */
  public readonly stateChange = output<ScrollZoomState>();

  /**
   * Emitted continuously during zoom with progress info
   */
  public readonly zoomProgress = output<ZoomProgressEvent>();

  /**
   * Emitted once when camera reaches maxDistance
   */
  public readonly zoomComplete = output<void>();

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

  public constructor() {
    // Initialize after next render (browser-only)
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.initializeCoordinator();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.cleanup();
    });
  }

  // ============================================================================
  // Initialization
  // ============================================================================

  private initializeCoordinator(): void {
    // Get the canvas element from the scene service
    this.canvasElement = this.sceneService.domElement;
    if (!this.canvasElement) {
      console.warn(
        'ScrollZoomCoordinatorDirective: Canvas element not found. Coordination disabled.'
      );
      return;
    }

    // Initialize camera distance
    const camera = this.sceneService.camera();
    if (camera) {
      this._currentDistance.set(camera.position.length());
    }

    // Create wheel handler
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

  private cleanup(): void {
    if (this.wheelHandler && this.canvasElement) {
      this.canvasElement.removeEventListener('wheel', this.wheelHandler);
      this.wheelHandler = null;
      this.canvasElement = null;
    }
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
  // Public API
  // ============================================================================

  /**
   * Get current scroll/zoom state
   */
  public getCurrentState(): ScrollZoomState {
    return this._state();
  }

  /**
   * Reset to initial state (re-engages zoom)
   */
  public reset(): void {
    this._zoomCompleted.set(false);
    this.updateState('idle');
  }
}
