import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  Injector,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';
import type { MeshProvider } from '../types/mesh-provider';

@Component({
  selector: 'a3d-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class BoxComponent implements OnDestroy, MeshProvider {
  // Transformation inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  // Geometry arguments: width, height, depth
  public readonly args = input<[number, number, number]>([1, 1, 1]);

  // Material inputs
  public readonly color = input<string | number>('orange');
  public readonly wireframe = input<boolean>(false);

  // Three.js objects
  public mesh!: THREE.Mesh;
  private geometry!: THREE.BoxGeometry;
  private material!: THREE.MeshStandardMaterial;

  // Parent injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    // Capture injector for effect() calls
    const injector = inject(Injector);

    effect(
      () => {
        if (this.mesh) {
          this.mesh.position.set(...this.position());
        }
      },
      { injector }
    );

    effect(
      () => {
        if (this.mesh) {
          this.mesh.rotation.set(...this.rotation());
        }
      },
      { injector }
    );

    effect(
      () => {
        if (this.mesh) {
          this.mesh.scale.set(...this.scale());
        }
      },
      { injector }
    );

    effect(
      () => {
        if (this.material) {
          this.material.color.set(this.color());
          this.material.wireframe = this.wireframe();
          this.material.needsUpdate = true;
        }
      },
      { injector }
    );

    effect(
      () => {
        // Re-create geometry and material if args or material props change
        const [width, height, depth] = this.args();
        const newGeometry = new THREE.BoxGeometry(width, height, depth);

        // Dispose old
        if (this.geometry) this.geometry.dispose();
        this.geometry = newGeometry;

        // Update mesh
        if (this.mesh) {
          this.mesh.geometry = this.geometry;
        } else {
          // First run - create mesh
          this.mesh = new THREE.Mesh(this.geometry, this.material);
          this.mesh.position.set(...this.position());
          this.mesh.rotation.set(...this.rotation());
          this.mesh.scale.set(...this.scale());
          this.addToParent();
        }
      },
      { injector }
    );

    effect(
      () => {
        // Material updates
        const color = this.color();
        const wireframe = this.wireframe();

        if (this.material) {
          this.material.color.set(color);
          this.material.wireframe = wireframe;
          this.material.needsUpdate = true;
        } else {
          this.material = new THREE.MeshStandardMaterial({ color, wireframe });
          if (this.mesh) this.mesh.material = this.material;
        }
      },
      { injector }
    );
  }

  // Helper to add to parent safely
  private addToParent(): void {
    if (this.parentFn && this.mesh) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.mesh);
      }
    }
  }

  /**
   * Public API: Get the Three.js mesh for directive access
   */
  public getMesh(): THREE.Mesh | null {
    return this.mesh || null;
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.mesh);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
