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
import type { MeshProvider } from '../types/mesh-provider';

@Component({
  selector: 'a3d-polyhedron',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PolyhedronComponent implements OnDestroy, MeshProvider {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  // radius, detail
  public readonly args = input<[number, number]>([1, 0]);
  public readonly type = input<
    'icosahedron' | 'dodecahedron' | 'tetrahedron' | 'octahedron'
  >('icosahedron');
  public readonly color = input<string | number>('purple');
  public readonly wireframe = input<boolean>(false);

  public mesh: THREE.Mesh | null = null;
  private geometry: THREE.PolyhedronGeometry | null = null;
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
      const [radius, detail] = this.args();
      let newGeometry: THREE.BufferGeometry;

      // Handle different polyhedron types
      switch (this.type()) {
        case 'icosahedron':
          newGeometry = new THREE.IcosahedronGeometry(radius, detail);
          break;
        case 'dodecahedron':
          newGeometry = new THREE.DodecahedronGeometry(radius, detail);
          break;
        case 'octahedron':
          newGeometry = new THREE.OctahedronGeometry(radius, detail);
          break;
        case 'tetrahedron':
          newGeometry = new THREE.TetrahedronGeometry(radius, detail);
          break;
        default:
          newGeometry = new THREE.IcosahedronGeometry(radius, detail);
      }

      if (this.geometry) this.geometry.dispose();
      this.geometry = newGeometry as THREE.PolyhedronGeometry;

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

  /**
   * Public API: Get the Three.js mesh for directive access
   */
  public getMesh(): THREE.Mesh | null {
    return this.mesh || null;
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
