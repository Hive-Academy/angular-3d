/**
 * MeshDirective - Creates and registers THREE.Mesh with SceneGraphStore
 *
 * This directive is the primary host directive for mesh-based primitives.
 * It reads geometry and material from sibling directives via DI signals
 * and creates a THREE.Mesh when both are ready.
 *
 * Pattern: Signal-based reactive mesh creation with store registration
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'a3d-box',
 *   hostDirectives: [
 *     MeshDirective,
 *     BoxGeometryDirective,
 *     StandardMaterialDirective
 *   ]
 * })
 * export class BoxComponent {}
 * ```
 */

import { Directive, inject, DestroyRef, effect, signal } from '@angular/core';
import * as THREE from 'three';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import { GEOMETRY_SIGNAL } from '../tokens/geometry.token';
import { MATERIAL_SIGNAL } from '../tokens/material.token';

/**
 * MeshDirective
 *
 * Creates THREE.Mesh from geometry and material signals provided by sibling directives.
 * Registers mesh with SceneGraphStore for centralized object management.
 *
 * Lifecycle:
 * 1. Geometry/material directives set their respective signals
 * 2. Effect triggers when both signals are non-null
 * 3. Creates THREE.Mesh and registers with store
 * 4. On destroy, removes mesh from store (store handles disposal)
 */
@Directive({
  selector: '[a3dMesh]',
  standalone: true,
  providers: [
    {
      provide: GEOMETRY_SIGNAL,
      useFactory: () => signal<THREE.BufferGeometry | null>(null),
    },
    {
      provide: MATERIAL_SIGNAL,
      useFactory: () => signal<THREE.Material | null>(null),
    },
  ],
})
export class MeshDirective {
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Make optional to trace injection issue
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  /** Reference to created mesh (null until both geometry and material are ready) */
  public mesh: THREE.Mesh | null = null;

  public constructor() {
    // Effect: Create mesh when geometry and material are ready
    effect(() => {
      // Wait for scene to be initialized
      if (!this.store.isReady()) return;

      const geometry = this.geometrySignal();
      const material = this.materialSignal();

      // Wait for both geometry and material to be available
      if (!geometry || !material) return;

      // Only create mesh once
      if (this.mesh) return;

      // DEBUG: Skip if no OBJECT_ID (will show in console)
      if (!this.objectId) {
        console.error(
          '[MeshDirective] No OBJECT_ID available - cannot register mesh'
        );
        return;
      }

      try {
        // Create mesh and register with store
        this.mesh = new THREE.Mesh(geometry, material);
        this.store.register(this.objectId, this.mesh, 'mesh');
      } catch (error) {
        console.error(`[MeshDirective] Failed to create mesh:`, error);
      }
    });

    // Cleanup: Remove mesh from store on destroy
    this.destroyRef.onDestroy(() => {
      if (this.objectId) {
        this.store.remove(this.objectId);
      }
    });
  }
}
