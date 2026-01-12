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
import * as THREE from 'three/webgpu';
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
   *
   * Note: IOR must be >= 1.0 (physically valid range)
   * Values < 1 will be clamped to 1.0
   */
  public readonly ior = input(1.5, {
    transform: (value: number) => {
      if (value < 1) {
        console.warn(
          `[PhysicalMaterial] IOR must be >= 1.0 (physically valid). Clamping from ${value} to 1.0. ` +
            `Common values: air=1.0, water=1.333, glass=1.5, diamond=2.42`
        );
        return 1.0;
      }
      if (value > 3) {
        console.warn(
          `[PhysicalMaterial] IOR > 3.0 is unusual (diamond=2.42). Using ${value} but verify this is correct.`
        );
      }
      return value;
    },
  });

  /**
   * Thickness of the volume beneath the surface (for transmission materials)
   * Controls subsurface scattering depth - higher values make light penetrate deeper
   * Only affects materials with transmission > 0
   * Default: 0
   */
  public readonly thickness = input<number>(0);

  /**
   * Render geometry as wireframe
   * Default: false
   */
  public readonly wireframe = input<boolean>(false);

  /** Internal reference to created material */
  private material: THREE.MeshPhysicalNodeMaterial | null = null;

  public constructor() {
    // Single effect: Create material on first run, update on subsequent runs
    // This eliminates the double-effect anti-pattern and redundant runs
    effect(() => {
      const color = this.color();
      const wireframe = this.wireframe();
      const metalness = this.metalness();
      const roughness = this.roughness();
      const clearcoat = this.clearcoat();
      const clearcoatRoughness = this.clearcoatRoughness();
      const transmission = this.transmission();
      const ior = this.ior();
      const thickness = this.thickness();

      if (!this.material) {
        // First run: create material with NodeMaterial pattern (direct property assignment)
        this.material = new THREE.MeshPhysicalNodeMaterial();
        this.material.color = new THREE.Color(color);
        this.material.wireframe = wireframe;
        this.material.metalness = metalness;
        this.material.roughness = roughness;
        this.material.clearcoat = clearcoat;
        this.material.clearcoatRoughness = clearcoatRoughness;
        this.material.transmission = transmission;
        this.material.ior = ior;
        this.material.thickness = thickness;
        this.materialSignal.set(this.material);
      } else {
        // Subsequent runs: update existing material properties
        this.material.color = new THREE.Color(color);
        this.material.wireframe = wireframe;
        this.material.metalness = metalness;
        this.material.roughness = roughness;
        this.material.clearcoat = clearcoat;
        this.material.clearcoatRoughness = clearcoatRoughness;
        this.material.transmission = transmission;
        this.material.ior = ior;
        this.material.thickness = thickness;
        this.material.needsUpdate = true;
      }

      // Update via store if OBJECT_ID available (every run)
      if (this.objectId) {
        this.store.update(this.objectId, undefined, {
          color,
          wireframe,
        });
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
