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

import {
  Directive,
  inject,
  DestroyRef,
  effect,
  input,
  signal,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';

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

  /**
   * Three.js render layer for this mesh (0-31), or null to leave layers untouched.
   *
   * Used with `a3d-selective-bloom-effect`: setting `[layer]="1"` puts the mesh
   * on layer 1 IN ADDITION to the default layer 0 (`layers.enable(n)`), so the
   * mesh stays visible in the base render AND is picked up by the bloom pass
   * (whose camera only sees the bloom layer).
   *
   * Setting back to null restores the default layer 0 only.
   *
   * @default null (layers untouched)
   */
  public readonly layer = input<number | null>(null);

  /** Reference to created mesh (null until both geometry and material are ready) */
  public mesh: THREE.Mesh | null = null;

  /** Internal reactive handle to the created mesh (drives the layer effect) */
  private readonly meshSignal = signal<THREE.Mesh | null>(null);

  /** Last layer applied via the `layer` input (for null-restore semantics) */
  private lastAppliedLayer: number | null = null;

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
        this.meshSignal.set(this.mesh);
      } catch (error) {
        console.error(`[MeshDirective] Failed to create mesh:`, error);
      }
    });

    // Effect: Sync `layer` input to mesh.layers (reactive, safe against the
    // mesh being created after the first run via meshSignal)
    effect(() => {
      const mesh = this.meshSignal();
      const layer = this.layer();

      if (!mesh) return;

      if (layer === null) {
        // Only reset if we previously modified layers - a default of null
        // must leave externally-configured layers untouched
        if (this.lastAppliedLayer !== null) {
          mesh.layers.set(0);
          this.lastAppliedLayer = null;
        }
        return;
      }

      // Reset to default layer 0, then ADD the requested layer so the mesh
      // remains visible in the main render pass AND the selective bloom pass
      mesh.layers.set(0);
      mesh.layers.enable(layer);
      this.lastAppliedLayer = layer;
    });

    // Cleanup: Remove mesh from store on destroy
    this.destroyRef.onDestroy(() => {
      if (this.objectId) {
        this.store.remove(this.objectId);
      }
    });
  }
}
