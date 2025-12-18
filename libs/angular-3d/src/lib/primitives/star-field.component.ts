import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';

/**
 * Simple spherical distribution (replacing maath dependency)
 * Generates random positions uniformly distributed within a sphere
 */
function generateStarPositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI; // Azimuthal angle
    const phi = Math.acos(2 * Math.random() - 1); // Polar angle
    const r = Math.cbrt(Math.random()) * radius; // Cube root for uniform distribution
    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
}

@Component({
  selector: 'a3d-star-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class StarFieldComponent implements OnDestroy {
  // Pattern: temp/star-field.component.ts:62-66
  public readonly starCount = input<number>(3000);
  public readonly radius = input<number>(40);
  public readonly color = input<string | number>('#ffffff');
  public readonly size = input<number>(0.02);
  public readonly opacity = input<number>(0.8);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private points: THREE.Points | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private material: THREE.PointsMaterial | null = null;

  public constructor() {
    // Effect for rebuilding stars when config changes
    effect((onCleanup) => {
      // Track dependencies
      const count = this.starCount();
      const radius = this.radius();
      const color = this.color();
      const size = this.size();
      const opacity = this.opacity();

      this.rebuildStars(count, radius, color, size, opacity);

      onCleanup(() => {
        this.disposeResources();
      });
    });
  }

  private rebuildStars(
    count: number,
    radius: number,
    color: string | number,
    size: number,
    opacity: number
  ): void {
    // Dispose old resources
    this.disposeResources();

    // Remove old points from parent if exists
    if (this.points && this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.points);
    }

    // Create geometry with positions
    // Note: We don't rely on 'this.positions()' computed anymore to avoid circular dependency or timing issues,
    // just call the generator directly. Or we can keep using it if we track 'count' and 'radius'.
    // Let's call generator directly for simplicity as we have the values.
    const positions = generateStarPositions(count, radius);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create material
    this.material = new THREE.PointsMaterial({
      color: color,
      size: size,
      sizeAttenuation: true,
      transparent: true,
      opacity: opacity,
      depthWrite: false,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // Stars span entire scene

    // Add to parent
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.points);
      }
    }
  }

  private disposeResources(): void {
    this.geometry?.dispose();
    this.geometry = null;
    this.material?.dispose();
    this.material = null;
  }

  public ngOnDestroy(): void {
    if (this.parentFn && this.points) {
      const parent = this.parentFn();
      parent?.remove(this.points);
    }
    this.disposeResources();
  }
}
