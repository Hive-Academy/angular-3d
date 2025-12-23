/**
 * GroupDirective - Creates and registers THREE.Group with SceneGraphStore
 *
 * This directive creates a THREE.Group container for grouping 3D objects.
 * Groups allow transforming multiple objects together as a single unit.
 * Similar to MeshDirective but creates Group instead of Mesh (no geometry/material).
 *
 * Pattern: Signal-based reactive group creation with store registration
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'a3d-group',
 *   hostDirectives: [
 *     GroupDirective,
 *     TransformDirective
 *   ]
 * })
 * export class GroupComponent {}
 * ```
 */

import { Directive, inject, DestroyRef, afterNextRender } from '@angular/core';
import * as THREE from 'three';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';

/**
 * GroupDirective
 *
 * Creates THREE.Group and registers with SceneGraphStore.
 * Groups are containers for other 3D objects, enabling hierarchical transformations.
 *
 * Lifecycle:
 * 1. Creates THREE.Group in afterNextRender
 * 2. Registers group with store (type='group')
 * 3. On destroy, removes group from store (store handles disposal)
 */
@Directive({
  selector: '[a3dGroup]',
  standalone: true,
})
export class GroupDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** Reference to created group (null until initialized) */
  public group: THREE.Group | null = null;

  public constructor() {
    // Create and register group after render
    afterNextRender(() => {
      // DEBUG: Skip if no OBJECT_ID
      if (!this.objectId) {
        console.error(
          '[GroupDirective] No OBJECT_ID available - cannot register group'
        );
        return;
      }

      // Create THREE.Group
      this.group = new THREE.Group();

      // Register with store as 'group' type
      this.store.register(this.objectId, this.group, 'group');
    });

    // Cleanup: Remove group from store on destroy
    this.destroyRef.onDestroy(() => {
      if (this.objectId) {
        this.store.remove(this.objectId);
      }
    });
  }
}
