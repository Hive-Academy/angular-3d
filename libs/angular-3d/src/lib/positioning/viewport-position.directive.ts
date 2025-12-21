/**
 * ViewportPositionDirective - Declarative Viewport Positioning for Three.js Objects
 *
 * Positions 3D objects using CSS-like viewport coordinates (named positions, percentages, pixels).
 * Automatically integrates with ViewportPositioningService for reactive positioning.
 *
 * Features:
 * - Signal-based reactive configuration
 * - Automatic lifecycle management with DestroyRef
 * - Reactive position updates on camera/window resize changes
 * - Supports named positions (top-left, center, bottom-right, etc.)
 * - Supports percentage positions ('50%' or 0.5)
 * - Supports pixel positions (absolute screen coordinates)
 * - Supports Z-plane configuration for layered layouts
 * - Works with any Three.js Object3D (meshes, groups, etc.)
 * - Zero configuration required - smart defaults provided
 *
 * @example
 * ```html
 * <!-- Named position -->
 * <app-planet
 *   viewportPosition="top-right"
 *   [viewportOffset]="{ offsetX: -2, offsetY: -1 }"
 * />
 *
 * <!-- Percentage position -->
 * <app-text-3d
 *   [viewportPosition]="{ x: '50%', y: '38%' }"
 * />
 *
 * <!-- Pixel position -->
 * <app-logo
 *   [viewportPosition]="{ x: 100, y: 50 }"
 *   [viewportOffset]="{ offsetZ: -15 }"
 * />
 *
 * <!-- With viewport Z plane (depth layer) -->
 * <app-model
 *   viewportPosition="center"
 *   [viewportZ]="-10"
 * />
 * ```
 */

import {
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
} from '@angular/core';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import { ViewportPositioningService } from './viewport-positioning.service';
import type {
  NamedPosition,
  PercentagePosition,
  PixelPosition,
  PositionOffset,
} from './viewport-positioning.types';

/**
 * ViewportPositionDirective
 *
 * Applies viewport positioning to 3D objects by syncing with ViewportPositioningService
 * and updating the object's position in SceneGraphStore reactively.
 *
 * Position updates automatically when:
 * - Input bindings change (viewportPosition, viewportOffset, viewportZ)
 * - Camera FOV or position changes
 * - Window resize events occur
 */
@Directive({
  selector: '[viewportPosition]',
  standalone: true,
})
export class ViewportPositionDirective {
  // ============================================================================
  // Dependencies
  // ============================================================================

  // Inject SceneGraphStore and OBJECT_ID from host component
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly positioningService = inject(ViewportPositioningService);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // Signal Inputs
  // ============================================================================

  /**
   * Viewport position configuration
   *
   * Accepts:
   * - Named position: 'center', 'top-left', 'bottom-right', etc.
   * - Percentage position: { x: '50%', y: '50%' } or { x: 0.5, y: 0.5 }
   * - Pixel position: { x: 100, y: 50 }
   */
  public readonly viewportPosition = input.required<
    NamedPosition | PercentagePosition | PixelPosition
  >();

  /**
   * Position offset in world units
   *
   * Applied after base position calculation.
   * Useful for fine-tuning or creating depth layers.
   *
   * @default {}
   */
  public readonly viewportOffset = input<PositionOffset>({});

  /**
   * Viewport plane Z position (depth layer)
   *
   * Allows positioning objects at different Z depths while maintaining
   * viewport-relative positioning.
   *
   * @default 0
   */
  public readonly viewportZ = input<number>(0);

  // ============================================================================
  // Initialization
  // ============================================================================

  constructor() {
    // Effect: sync viewport position to SceneGraphStore
    // Reacts to changes in: viewportPosition, viewportOffset, viewportZ, camera, and window resize
    effect(() => {
      if (!this.objectId) return;

      const position = this.viewportPosition();
      const offset = this.viewportOffset();
      const z = this.viewportZ();

      // Configure service viewport plane
      this.positioningService.setViewportZ(z);

      // Get reactive position signal from service
      const positionSignal = this.positioningService.getPosition(
        position,
        offset
      );

      // Read the position signal (reactive to camera/window changes)
      // This effect will re-run when:
      // - Input bindings change (position, offset, z)
      // - Camera FOV/position changes (via positionSignal reactivity)
      // - Window resize occurs (via positionSignal reactivity)
      const pos = positionSignal();

      // Update object in store
      this.sceneStore.update(this.objectId!, { position: pos });
    });
  }
}
