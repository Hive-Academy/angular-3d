/**
 * LambertMaterialDirective - Creates MeshLambertMaterial and provides via signal
 *
 * This directive creates a THREE.MeshLambertMaterial with configurable properties
 * and writes it to the MATERIAL_SIGNAL for consumption by MeshDirective.
 *
 * MeshLambertMaterial is a non-physically based material with diffuse shading,
 * providing good performance for non-reflective surfaces. It's ideal for
 * background decorations and performance-critical scenarios.
 *
 * Pattern: Signal-based reactive material creation and updates
 *
 * @example
 * ```html
 * <a3d-background-cube
 *   [color]="'#4a90e2'"
 *   [emissive]="'#000000'"
 *   [emissiveIntensity]="0"
 *   [transparent]="true"
 *   [opacity]="0.8"
 * />
 * ```
 */

import { Directive, inject, effect, input, DestroyRef } from '@angular/core';
import * as THREE from 'three';
import { ColorRepresentation } from 'three';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * LambertMaterialDirective
 *
 * Creates MeshLambertMaterial and provides it via MATERIAL_SIGNAL.
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
  selector: '[a3dLambertMaterial]',
  standalone: true,
})
export class LambertMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Material color (hex number or CSS color string)
   * Default: 0xffffff (white)
   */
  public readonly color = input<ColorRepresentation>(0xffffff);

  /**
   * Emissive color (self-illumination color)
   * Default: 0x000000 (no emission)
   */
  public readonly emissive = input<ColorRepresentation>(0x000000);

  /**
   * Emissive intensity multiplier
   * Default: 1
   */
  public readonly emissiveIntensity = input<number>(1);

  /**
   * Enable transparency rendering
   * Default: false
   */
  public readonly transparent = input<boolean>(false);

  /**
   * Opacity level (0 = fully transparent, 1 = fully opaque)
   * Default: 1
   */
  public readonly opacity = input<number>(1);

  /** Internal reference to created material */
  private material: THREE.MeshLambertMaterial | null = null;

  public constructor() {
    // Effect 1: Create material once and set signal
    effect(() => {
      const color = this.color();
      const emissive = this.emissive();
      const emissiveIntensity = this.emissiveIntensity();
      const transparent = this.transparent();
      const opacity = this.opacity();

      if (!this.material) {
        this.material = new THREE.MeshLambertMaterial({
          color,
          emissive,
          emissiveIntensity,
          transparent,
          opacity,
        });
        this.materialSignal.set(this.material);
      }
    });

    // Effect 2: Update material properties reactively
    // This effect runs whenever any material input changes
    // Uses store.update() to ensure proper material.needsUpdate handling
    effect(() => {
      if (this.material) {
        const color = this.color();
        const emissive = this.emissive();
        const emissiveIntensity = this.emissiveIntensity();
        const transparent = this.transparent();
        const opacity = this.opacity();

        // Update material properties directly
        this.material.color = new THREE.Color(color);
        this.material.emissive = new THREE.Color(emissive);
        this.material.emissiveIntensity = emissiveIntensity;
        this.material.transparent = transparent;
        this.material.opacity = opacity;
        this.material.needsUpdate = true;

        // Update via store if objectId is available (only color, transparent, opacity supported)
        if (this.objectId) {
          this.store.update(this.objectId, undefined, {
            color:
              typeof color === 'number' || typeof color === 'string'
                ? color
                : color.getHex(),
            transparent,
            opacity,
          });
        }
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
