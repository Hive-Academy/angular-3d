/**
 * ScrollZoomCoordinatorDirective - Bridge 3D camera zoom and page scrolling
 *
 * Provides smooth transitions between camera zoom and page scroll:
 * - When zooming in/out, prevents page scroll
 * - At zoom limits, enables page scroll
 * - Configurable thresholds and sensitivity
 *
 * Features:
 * - NgZone.runOutsideAngular for performance
 * - Delta time-aware for consistent behavior
 * - Signal-based configuration
 * - Lifecycle events (stateChange, scrollTransition)
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <a3d-scene-3d a3dScrollZoomCoordinator>
 *   <a3d-orbit-controls />
 * </a3d-scene-3d>
 *
 * <!-- With configuration -->
 * <a3d-scene-3d
 *   a3dScrollZoomCoordinator
 *   [minZoom]="0.5"
 *   [maxZoom]="2.0"
 *   [scrollSensitivity]="0.001">
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
} from '@angular/core';
import { SceneService } from '../canvas/scene.service';

/**
 * Scroll/zoom state
 */
type ScrollZoomState = 'zoom' | 'scroll';

/**
 * Scroll transition event
 */
export interface ScrollTransitionEvent {
  from: 'zoom';
  to: 'scroll';
}

/**
 * ScrollZoomCoordinatorDirective
 *
 * Coordinates between camera zoom (OrbitControls) and page scrolling.
 * Provides smooth transitions at zoom limits.
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

  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /**
   * Minimum zoom level (camera.position.z)
   * When reached, enables page scroll
   */
  public readonly minZoom = input<number>(0.5);

  /**
   * Maximum zoom level (camera.position.z)
   * When reached, enables page scroll
   */
  public readonly maxZoom = input<number>(2.0);

  /**
   * Scroll sensitivity multiplier
   * Higher = more sensitive to wheel events
   */
  public readonly scrollSensitivity = input<number>(0.001);

  /**
   * Threshold for zoom limit detection
   * Distance from limit to trigger scroll transition
   */
  public readonly zoomThreshold = input<number>(0.01);

  // ============================================================================
  // Outputs
  // ============================================================================

  /**
   * Emitted when state changes between 'zoom' and 'scroll'
   */
  public readonly stateChange = output<ScrollZoomState>();

  /**
   * Emitted when transitioning from zoom to scroll
   */
  public readonly scrollTransition = output<ScrollTransitionEvent>();

  /**
   * Emitted when zoom enabled/disabled
   */
  public readonly zoomEnabledChange = output<boolean>();

  // ============================================================================
  // Internal State
  // ============================================================================

  private currentState: ScrollZoomState = 'zoom';
  private isZoomEnabled = true;
  private destroyed = false;

  constructor() {
    // Initialize after next render (browser-only)
    afterNextRender(() => {
      this.ngZone.runOutsideAngular(() => {
        window.addEventListener('wheel', this.handleWheel, { passive: false });
      });
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      window.removeEventListener('wheel', this.handleWheel);
    });
  }

  // ============================================================================
  // Wheel Event Handler
  // ============================================================================

  /**
   * Handle wheel events for zoom/scroll coordination
   * Runs outside Angular zone for performance
   */
  private handleWheel = (event: WheelEvent): void => {
    // Early exit if destroyed to prevent accessing destroyed state
    if (this.destroyed) return;

    const camera = this.sceneService.camera();
    if (!camera) return;

    const currentZoom = camera.position.z;
    const delta = event.deltaY * this.scrollSensitivity();
    const newZoom = currentZoom + delta;

    const min = this.minZoom();
    const max = this.maxZoom();
    const threshold = this.zoomThreshold();

    // Check if at zoom limits
    const atMinLimit = newZoom <= min + threshold && delta < 0;
    const atMaxLimit = newZoom >= max - threshold && delta > 0;

    if (atMinLimit || atMaxLimit) {
      // At zoom limit - enable page scroll
      if (this.currentState !== 'scroll') {
        this.transitionToScroll();
      }
      // Allow default scroll behavior
      return;
    }

    // Within zoom range - prevent page scroll and apply zoom
    event.preventDefault();

    if (this.currentState !== 'zoom') {
      this.transitionToZoom();
    }

    // Clamp zoom to limits
    camera.position.z = Math.max(min, Math.min(max, newZoom));
  };

  // ============================================================================
  // State Transitions
  // ============================================================================

  /**
   * Transition from zoom to scroll
   */
  private transitionToScroll(): void {
    this.currentState = 'scroll';
    this.isZoomEnabled = false;

    // Emit events inside Angular zone
    this.ngZone.run(() => {
      this.stateChange.emit('scroll');
      this.scrollTransition.emit({ from: 'zoom', to: 'scroll' });
      this.zoomEnabledChange.emit(false);
    });
  }

  /**
   * Transition from scroll to zoom
   */
  private transitionToZoom(): void {
    this.currentState = 'zoom';
    this.isZoomEnabled = true;

    // Emit events inside Angular zone
    this.ngZone.run(() => {
      this.stateChange.emit('zoom');
      this.zoomEnabledChange.emit(true);
    });
  }

  // ============================================================================
  // Public API
  // ============================================================================

  /**
   * Get current state
   */
  public getCurrentState(): ScrollZoomState {
    return this.currentState;
  }

  /**
   * Check if zoom is enabled
   */
  public isZoomActive(): boolean {
    return this.isZoomEnabled;
  }
}
