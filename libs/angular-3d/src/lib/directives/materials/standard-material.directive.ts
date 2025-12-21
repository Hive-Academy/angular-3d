/**
 * StandardMaterialDirective - Creates MeshStandardMaterial and provides via signal
 *
 * This directive creates a THREE.MeshStandardMaterial with configurable properties
 * and writes it to the MATERIAL_SIGNAL for consumption by MeshDirective.
 *
 * MeshStandardMaterial is a physically-based material (PBR) that responds to scene
 * lighting with realistic shading. It supports metalness/roughness workflow.
 *
 * Pattern: Signal-based reactive material creation and updates
 *
 * @example
 * ```html
 * <a3d-box
 *   [color]="'#ff6b6b'"
 *   [metalness]="0.8"
 *   [roughness]="0.2"
 *   [wireframe]="false"
 * />
 * ```
 */

import { Directive, inject, effect, input, DestroyRef } from '@angular/core';
import * as THREE from 'three';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * StandardMaterialDirective
 *
 * Creates MeshStandardMaterial and provides it via MATERIAL_SIGNAL.
 * Reactively updates material properties when inputs change.
 *
 * Lifecycle:
 * 1. First effect creates material and sets signal
 * 2. Second effect updates material properties reactively via store
 *
 * Note: Uses store.update() for property changes to ensure centralized
 * material management and proper needsUpdate handling.
 */
@Directive({
  selector: '[a3dStandardMaterial]',
  standalone: true,
})
export class StandardMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly store = inject(SceneGraphStore);
  // DEBUG: Removed skipSelf, added optional to trace injection issue
  // skipSelf was WRONG - it skips the component's providers where OBJECT_ID is defined!
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // DEBUG: Log injection result
  private readonly _debug = (() => {
    console.log(
      '[StandardMaterialDirective] OBJECT_ID injection result:',
      this.objectId
    );
    return true;
  })();

  /**
   * Material color (hex number or CSS color string)
   * Default: 0xffffff (white)
   */
  public readonly color = input<number | string>(0xffffff);

  /**
   * Render geometry as wireframe
   * Default: false
   */
  public readonly wireframe = input<boolean>(false);

  /**
   * Metalness level (0 = dielectric, 1 = metal)
   * Default: 0.5 (semi-metallic)
   */
  public readonly metalness = input<number>(0.5);

  /**
   * Roughness level (0 = smooth/reflective, 1 = rough/diffuse)
   * Default: 0.5 (semi-rough)
   */
  public readonly roughness = input<number>(0.5);

  /** Internal reference to created material */
  private material: THREE.MeshStandardMaterial | null = null;

  public constructor() {
    // Effect 1: Create material once and set signal
    effect(() => {
      const color = this.color();
      const wireframe = this.wireframe();
      const metalness = this.metalness();
      const roughness = this.roughness();

      console.log(
        '[StandardMaterialDirective] Effect1: Creating material with',
        'color=',
        color,
        'wireframe=',
        wireframe,
        'id=',
        this.objectId
      );

      if (!this.material) {
        this.material = new THREE.MeshStandardMaterial({
          color,
          wireframe,
          metalness,
          roughness,
        });
        this.materialSignal.set(this.material);
        console.log(
          '[StandardMaterialDirective] Effect1: Material created and signal set'
        );
      }
    });

    // Effect 2: Update material properties reactively
    // This effect runs whenever color or wireframe inputs change
    // Uses store.update() to ensure proper material.needsUpdate handling
    effect(() => {
      if (this.material) {
        const color = this.color();
        const wireframe = this.wireframe();

        console.log(
          '[StandardMaterialDirective] Effect2: Updating material',
          'color=',
          color,
          'wireframe=',
          wireframe,
          'id=',
          this.objectId
        );

        // DEBUG: Skip store update if no OBJECT_ID
        if (this.objectId) {
          this.store.update(this.objectId, undefined, {
            color,
            wireframe,
          });
        }

        // Update metalness and roughness directly (not in store interface yet)
        this.material.metalness = this.metalness();
        this.material.roughness = this.roughness();
        this.material.needsUpdate = true;
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.material) {
        this.material.dispose();
        this.material = null;
      }
    });
  }
}
