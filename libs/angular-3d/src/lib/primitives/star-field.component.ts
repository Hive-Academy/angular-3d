import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  input,
  computed,
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
export class StarFieldComponent implements OnInit, OnDestroy {
  // Pattern: temp/star-field.component.ts:62-66
  public readonly starCount = input<number>(3000);
  public readonly radius = input<number>(40);
  public readonly color = input<string | number>('#ffffff');
  public readonly size = input<number>(0.02);
  public readonly opacity = input<number>(0.8);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;

  // Pattern: temp/star-field.component.ts:71-77 (computed positions)
  private readonly positions = computed(() => {
    return generateStarPositions(this.starCount(), this.radius());
  });

  public ngOnInit(): void {
    // Create geometry with positions (pattern: temp/star-field.component.ts:41-44)
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.positions(), 3)
    );

    // Create material (pattern: temp/star-field.component.ts:46-54)
    this.material = new THREE.PointsMaterial({
      color: this.color(),
      size: this.size(),
      sizeAttenuation: true,
      transparent: true,
      opacity: this.opacity(),
      depthWrite: false,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // Stars span entire scene

    // Add to parent (pattern: box.component.ts:94-103)
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.points);
      } else {
        console.warn('StarFieldComponent: Parent not ready');
      }
    } else {
      console.warn('StarFieldComponent: No parent found');
    }
  }

  public ngOnDestroy(): void {
    // Pattern: box.component.ts:106-113
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.points);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
