/**
 * PhysicalMaterialDirective - Creates MeshPhysicalMaterial and provides via signal
 *
 * This directive creates a THREE.MeshPhysicalMaterial with configurable properties
 * and writes it to the MATERIAL_SIGNAL for consumption by MeshDirective.
 *
 * MeshPhysicalMaterial extends MeshStandardMaterial with additional physically-based
 * rendering features: clearcoat, transmission (glass/transparency), and IOR.
 *
 * Pattern: Signal-based reactive material creation and updates
 *
 * @example
 * ```html
 * <a3d-floating-sphere
 *   [color]="'#ff6b6b'"
 *   [metalness]="0.8"
 *   [roughness]="0.2"
 *   [clearcoat]="1.0"
 *   [transmission]="0.1"
 *   [ior]="1.5"
 * />
 * ```
 */

import { Directive, inject, effect, input, DestroyRef } from '@angular/core';
import * as THREE from 'three';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * PhysicalMaterialDirective
 *
 * Creates MeshPhysicalMaterial and provides it via MATERIAL_SIGNAL.
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
  selector: '[a3dPhysicalMaterial]',
  standalone: true,
})
export class PhysicalMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Material color (hex number or CSS color string)
   * Default: 0xffffff (white)
   */
  public readonly color = input<number | string>(0xffffff);

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

  /**
   * Clearcoat layer intensity (0 = none, 1 = full)
   * Simulates thin translucent layer on top (car paint effect)
   * Default: 0.0
   */
  public readonly clearcoat = input<number>(0.0);

  /**
   * Clearcoat roughness (0 = smooth, 1 = rough)
   * Default: 0.0
   */
  public readonly clearcoatRoughness = input<number>(0.0);

  /**
   * Transmission level (0 = opaque, 1 = fully transparent like glass)
   * Enables realistic glass/transparency with refraction
   * Default: 0.0
   */
  public readonly transmission = input<number>(0.0);

  /**
   * Index of Refraction (IOR)
   * Controls light bending through transparent materials
   * Water: 1.333, Glass: 1.5, Diamond: 2.42
   * Default: 1.5 (glass)
   */
  public readonly ior = input<number>(1.5);

  /**
   * Render geometry as wireframe
   * Default: false
   */
  public readonly wireframe = input<boolean>(false);

  /** Internal reference to created material */
  private material: THREE.MeshPhysicalMaterial | null = null;

  public constructor() {
    // Effect 1: Create material once and set signal
    effect(() => {
      const color = this.color();
      const wireframe = this.wireframe();
      const metalness = this.metalness();
      const roughness = this.roughness();
      const clearcoat = this.clearcoat();
      const clearcoatRoughness = this.clearcoatRoughness();
      const transmission = this.transmission();
      const ior = this.ior();

      if (!this.material) {
        this.material = new THREE.MeshPhysicalMaterial({
          color,
          wireframe,
          metalness,
          roughness,
          clearcoat,
          clearcoatRoughness,
          transmission,
          ior,
        });
        this.materialSignal.set(this.material);
      }
    });

    // Effect 2: Update material properties reactively
    // This effect runs whenever inputs change
    // Uses store.update() to ensure proper material.needsUpdate handling
    effect(() => {
      if (this.material) {
        const color = this.color();
        const wireframe = this.wireframe();

        // Update via store if OBJECT_ID available
        if (this.objectId) {
          this.store.update(this.objectId, undefined, {
            color,
            wireframe,
          });
        }

        // Update physical material properties directly
        this.material.metalness = this.metalness();
        this.material.roughness = this.roughness();
        this.material.clearcoat = this.clearcoat();
        this.material.clearcoatRoughness = this.clearcoatRoughness();
        this.material.transmission = this.transmission();
        this.material.ior = this.ior();
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
