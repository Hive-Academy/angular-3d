import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';

@Component({
  selector: 'a3d-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class BoxComponent implements OnInit, OnDestroy {
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
  private mesh!: THREE.Mesh;
  private geometry!: THREE.BoxGeometry;
  private material!: THREE.MeshStandardMaterial;

  // Parent injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    effect(() => {
      if (this.mesh) {
        this.mesh.position.set(...this.position());
      }
    });
    effect(() => {
      if (this.mesh) {
        this.mesh.rotation.set(...this.rotation());
      }
    });
    effect(() => {
      if (this.mesh) {
        this.mesh.scale.set(...this.scale());
      }
    });
    effect(() => {
      if (this.material) {
        this.material.color.set(this.color());
        this.material.wireframe = this.wireframe();
        this.material.needsUpdate = true;
      }
    });
    effect(() => {
      // Re-create geometry if args change (expensive but necessary for geometry params)
      const [width, height, depth] = this.args();
      if (this.geometry) {
        this.geometry.dispose();
      }
      this.geometry = new THREE.BoxGeometry(width, height, depth);
      if (this.mesh) {
        this.mesh.geometry = this.geometry;
      }
    });
  }

  public ngOnInit(): void {
    // Initialize geometry
    const [width, height, depth] = this.args();
    this.geometry = new THREE.BoxGeometry(width, height, depth);

    // Initialize material
    this.material = new THREE.MeshStandardMaterial({
      color: this.color(),
      wireframe: this.wireframe(),
    });

    // Initialize mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.rotation.set(...this.rotation());
    this.mesh.scale.set(...this.scale());

    // Add to parent
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.mesh);
      } else {
        console.warn('BoxComponent: Parent not ready');
      }
    } else {
      console.warn('BoxComponent: No parent found');
    }
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
