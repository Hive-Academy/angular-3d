/**
 * ParticleSystemComponent - Configurable Particle System
 *
 * A reusable particle system component using Three.js Points for efficient rendering
 * of many small particles. Supports multiple distribution patterns for different
 * visual effects.
 *
 * @example
 * ```html
 * <!-- Spherical particle cloud -->
 * <a3d-particle-system
 *   [count]="5000"
 *   [spread]="15"
 *   [color]="0x00ffff"
 *   distribution="sphere"
 * />
 *
 * <!-- Box-shaped particle volume -->
 * <a3d-particle-system
 *   [count]="1000"
 *   [spread]="10"
 *   distribution="box"
 * />
 *
 * <!-- Cone-shaped particle emitter -->
 * <a3d-particle-system
 *   [count]="2000"
 *   [spread]="8"
 *   distribution="cone"
 * />
 * ```
 *
 * Distribution types:
 * - **sphere**: Particles uniformly distributed within a sphere (default)
 * - **box**: Particles uniformly distributed within a cube
 * - **cone**: Particles distributed within a cone shape (apex at origin)
 */

import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  afterNextRender,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';

/** Distribution types for particle system */
export type ParticleDistribution = 'sphere' | 'box' | 'cone';

/**
 * Generate positions uniformly distributed within a sphere
 */
function generateSpherePositions(count: number, spread: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * spread;
    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
}

/**
 * Generate positions uniformly distributed within a box
 */
function generateBoxPositions(count: number, spread: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    positions[idx] = (Math.random() - 0.5) * spread;
    positions[idx + 1] = (Math.random() - 0.5) * spread;
    positions[idx + 2] = (Math.random() - 0.5) * spread;
  }
  return positions;
}

/**
 * Generate positions within a cone shape (apex at origin, opening upward)
 */
function generateConePositions(count: number, spread: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const y = Math.random() * spread;
    const radiusAtHeight = (y / spread) * (spread / 2);
    const r = Math.sqrt(Math.random()) * radiusAtHeight;
    const idx = i * 3;
    positions[idx] = r * Math.cos(theta);
    positions[idx + 1] = y;
    positions[idx + 2] = r * Math.sin(theta);
  }
  return positions;
}

@Component({
  selector: 'a3d-particle-system',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class ParticleSystemComponent implements OnDestroy {
  // Particle configuration
  public readonly count = input<number>(1000);
  public readonly size = input<number>(0.05);
  public readonly color = input<string | number>('#ffffff');
  public readonly opacity = input<number>(0.8);
  public readonly spread = input<number>(10);
  public readonly distribution = input<ParticleDistribution>('sphere');

  // Transform inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;

  // Computed positions based on distribution type
  private readonly positions = computed(() => {
    const count = this.count();
    const spread = this.spread();
    const dist = this.distribution();

    switch (dist) {
      case 'box':
        return generateBoxPositions(count, spread);
      case 'cone':
        return generateConePositions(count, spread);
      case 'sphere':
      default:
        return generateSpherePositions(count, spread);
    }
  });

  public constructor() {
    // Reactive effect for geometry and material generation
    afterNextRender(() => {
      effect((onCleanup) => {
        // Dependencies to track
        const positions = this.positions();
        const color = this.color();
        const size = this.size();
        const opacity = this.opacity();

        this.rebuildParticles(positions, { color, size, opacity });

        onCleanup(() => {
          // No explicit cleanup needed here as rebuildParticles handles geometry disposal
          // and reuse of material variable. But for completeness, we could dispose.
          // The main cleanup happens in ngOnDestroy.
        });
      });
    });

    // Transform effect
    effect(() => {
      if (this.points) {
        this.points.position.set(...this.position());
      }
    });
  }

  private rebuildParticles(
    positions: Float32Array,
    options: { color: string | number; size: number; opacity: number }
  ): void {
    // Dispose old geometry
    if (this.geometry) {
      this.geometry.dispose();
    }
    // Dispose old material if needed (though we could reuse it, let's recreate for simplicity of updates)
    if (this.material) {
      this.material.dispose();
    }

    // Create new geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create new material
    this.material = new THREE.PointsMaterial({
      color: options.color,
      size: options.size,
      sizeAttenuation: true,
      transparent: true,
      opacity: options.opacity,
      depthWrite: false,
    });

    // If points object exists, update it; otherwise create it
    if (!this.points) {
      this.points = new THREE.Points(this.geometry, this.material);
      this.points.position.set(...this.position());

      // Add to parent
      if (this.parentFn) {
        const parent = this.parentFn();
        if (parent) {
          parent.add(this.points);
        } else {
          console.warn('ParticleSystemComponent: Parent not ready');
        }
      } else {
        console.warn('ParticleSystemComponent: No parent found');
      }
    } else {
      this.points.geometry = this.geometry;
      this.points.material = this.material;
    }
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.points);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
