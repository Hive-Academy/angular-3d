/**
 * TransformDirective - Syncs position/rotation/scale inputs to SceneGraphStore
 *
 * This directive handles all transform-related updates (position, rotation, scale)
 * for Three.js objects. It reactively syncs input changes to the SceneGraphStore,
 * which applies them to the actual Three.js Object3D.
 *
 * Pattern: Signal-based reactive transform synchronization
 *
 * @example
 * ```html
 * <a3d-box
 *   [position]="[0, 2, 0]"
 *   [rotation]="[0, Math.PI / 4, 0]"
 *   [scale]="[1.5, 1.5, 1.5]"
 * />
 * ```
 */

import { Directive, inject, effect, input, untracked } from '@angular/core';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * TransformDirective
 *
 * Provides reactive inputs for position, rotation, and scale.
 * Single effect monitors all three inputs and updates the store whenever any change.
 *
 * Injects OBJECT_ID from host component to access the component's
 * unique identifier for store updates.
 *
 * Note: Requires host element to provide OBJECT_ID token.
 */
@Directive({
  selector: '[a3dTransform]',
  standalone: true,
})
export class TransformDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });

  /**
   * Position in 3D space as [x, y, z] tuple
   * Default: [0, 0, 0] (origin)
   */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /**
   * Rotation in radians as [x, y, z] Euler angles
   * Default: [0, 0, 0] (no rotation)
   */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /**
   * Scale as [x, y, z] multipliers
   * Default: [1, 1, 1] (original size)
   */
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  public constructor() {
    // Single effect for all transform updates
    // Runs whenever position, rotation, or scale changes
    effect(() => {
      const objectId = this.objectId;
      // DEBUG: Skip if no OBJECT_ID
      if (!objectId) {
        return;
      }

      const pos = this.position();
      const rot = this.rotation();
      const scl = this.scale();

      // The store applies the transform immediately when the object is
      // registered, and queues it otherwise (flushed on registration).
      // This avoids a race where objects created in afterNextRender
      // (e.g. GroupDirective's THREE.Group) register AFTER this effect's
      // first run and silently never receive their transform.
      // untracked: the store read of its registry signal must not become
      // a dependency of this effect (inputs are the only triggers).
      untracked(() => {
        this.store.update(objectId, {
          position: pos,
          rotation: rot,
          scale: scl,
        });
      });
    });
  }
}
