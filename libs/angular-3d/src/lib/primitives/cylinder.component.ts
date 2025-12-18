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

@Component({
  selector: 'a3d-cylinder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class CylinderComponent implements OnDestroy {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  // radiusTop, radiusBottom, height, radialSegments
  public readonly args = input<[number, number, number, number]>([1, 1, 1, 32]);
  public readonly color = input<string | number>('green');
  public readonly wireframe = input<boolean>(false);

  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.CylinderGeometry | null = null;
  private material: THREE.MeshStandardMaterial | null = null;

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    // Transform effects
    effect(() => {
      if (this.mesh) {
        this.mesh.position.set(...this.position());
        this.mesh.rotation.set(...this.rotation());
        this.mesh.scale.set(...this.scale());
      }
    });

    // Material effect
    effect(() => {
      const color = this.color();
      const wireframe = this.wireframe();

      if (this.material) {
        this.material.color.set(color);
        this.material.wireframe = wireframe;
        this.material.needsUpdate = true;
      } else {
        this.material = new THREE.MeshStandardMaterial({ color, wireframe });
        if (this.mesh) {
          this.mesh.material = this.material;
        } else {
          this.rebuildMesh();
        }
      }
    });

    // Geometry effect
    effect(() => {
      const [radiusTop, radiusBottom, height, radialSegments] = this.args();

      const newGeometry = new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        radialSegments
      );

      if (this.geometry) this.geometry.dispose();
      this.geometry = newGeometry;

      if (this.mesh) {
        this.mesh.geometry = this.geometry;
      } else {
        this.rebuildMesh();
      }
    });
  }

  private rebuildMesh(): void {
    if (this.geometry && this.material && !this.mesh) {
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.mesh.position.set(...this.position());
      this.mesh.rotation.set(...this.rotation());
      this.mesh.scale.set(...this.scale());
      this.addToParent();
    }
  }

  private addToParent(): void {
    if (this.parentFn && this.mesh) {
      const parent = this.parentFn();
      if (parent) parent.add(this.mesh);
    }
  }

  public ngOnDestroy(): void {
    if (this.parentFn && this.mesh) {
      const parent = this.parentFn();
      parent?.remove(this.mesh);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
