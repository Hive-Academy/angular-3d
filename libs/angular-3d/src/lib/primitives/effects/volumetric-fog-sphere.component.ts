/**
 * Volumetric Fog Sphere Component
 *
 * Renders a sphere filled with volumetric fog using raymarching.
 * Uses TSL shaders for realistic fog density with 3D noise variation.
 *
 * Features:
 * - True volumetric rendering (not discrete particles)
 * - 3D noise-based density variation
 * - Density gradient (denser in center)
 * - Color variation based on depth
 * - Single draw call (efficient)
 *
 * @example
 * ```html
 * <a3d-volumetric-fog-sphere
 *   [radius]="4.5"
 *   [position]="[0, 0, 0]"
 *   [centerColor]="'#ffffff'"
 *   [edgeColor]="'#ff8866'"
 *   [densityScale]="3.0"
 *   [steps]="32"
 * />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import { tslVolumetricFog } from '../shaders/tsl-textures/volumetric-fog';
import { NG_3D_PARENT } from '../../types/tokens';

@Component({
  selector: 'a3d-volumetric-fog-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class VolumetricFogSphereComponent {
  /** Parent Three.js object (scene, group, or other Object3D) */
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Sphere radius */
  readonly radius = input<number>(1.0);

  /** Position [x, y, z] */
  readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Rotation [x, y, z] in radians */
  readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /** Center fog color (dense areas) */
  readonly centerColor = input<string>('#ffffff');

  /** Edge fog color (sparse areas) */
  readonly edgeColor = input<string>('#ff8866');

  /** Density scale factor (higher = denser fog) */
  readonly densityScale = input<number>(3.0);

  /** 3D noise scale for organic variation */
  readonly noiseScale = input<number>(2.0);

  /** Number of raymarching steps (balance quality vs performance) */
  readonly steps = input<number>(32);

  /** Animation speed multiplier */
  readonly animationSpeed = input<number>(0.3);

  /** Internal mesh */
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: MeshBasicNodeMaterial | null = null;

  constructor() {
    afterNextRender(() => {
      this.createMesh();
      this.setupReactivity();
    });
  }

  /**
   * Create volumetric fog sphere mesh
   */
  private createMesh(): void {
    const radius = this.radius();

    // Create sphere geometry (high detail for smooth fog)
    this.geometry = new THREE.SphereGeometry(radius, 64, 64);

    // Create volumetric fog material using TSL shader
    this.material = new MeshBasicNodeMaterial();
    this.material.transparent = true;
    this.material.depthWrite = false;
    this.material.side = THREE.DoubleSide; // Render both sides for volumetric effect
    this.material.blending = THREE.NormalBlending;

    // Apply volumetric fog shader
    const fogNode = tslVolumetricFog({
      radius: radius,
      centerColor: this.centerColor(),
      edgeColor: this.edgeColor(),
      densityScale: this.densityScale(),
      noiseScale: this.noiseScale(),
      steps: this.steps(),
      animationSpeed: this.animationSpeed(),
    });

    this.material.colorNode = fogNode;

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set initial transform
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    const [rx, ry, rz] = this.rotation();
    this.mesh.rotation.set(rx, ry, rz);

    // Add to parent
    const parent = this.parent();
    if (parent) {
      parent.add(this.mesh);
    }

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.disposeMesh();
    });
  }

  /**
   * Setup reactive updates for input changes
   */
  private setupReactivity(): void {
    // Note: For signal inputs, we'd need effects to react to changes
    // For now, initial values are applied during creation
    // Future enhancement: Add effect() to watch input signals and update mesh
  }

  /**
   * Dispose mesh and resources
   */
  private disposeMesh(): void {
    if (this.mesh) {
      const parent = this.parent();
      if (parent) {
        parent.remove(this.mesh);
      }
    }

    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    this.mesh = null;
  }
}
