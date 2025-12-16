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
  selector: 'a3d-torus',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class TorusComponent implements OnInit, OnDestroy {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  // radius, tube, radialSegments, tubularSegments
  public readonly args = input<[number, number, number, number]>([
    10, 3, 16, 100,
  ]);
  public readonly color = input<string | number>('blue');
  public readonly wireframe = input<boolean>(false);

  private mesh!: THREE.Mesh;
  private geometry!: THREE.TorusGeometry;
  private material!: THREE.MeshStandardMaterial;

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    effect(() => {
      if (this.mesh) {
        this.mesh.position.set(...this.position());
        this.mesh.rotation.set(...this.rotation());
        this.mesh.scale.set(...this.scale());
      }
    });

    effect(() => {
      if (this.material) {
        this.material.color.set(this.color());
        this.material.wireframe = this.wireframe();
      }
    });

    effect(() => {
      const [radius, tube, radialSegments, tubularSegments] = this.args();
      if (this.geometry) this.geometry.dispose();
      this.geometry = new THREE.TorusGeometry(
        radius,
        tube,
        radialSegments,
        tubularSegments
      );
      if (this.mesh) this.mesh.geometry = this.geometry;
    });
  }

  public ngOnInit(): void {
    const [radius, tube, radialSegments, tubularSegments] = this.args();
    this.geometry = new THREE.TorusGeometry(
      radius,
      tube,
      radialSegments,
      tubularSegments
    );
    this.material = new THREE.MeshStandardMaterial({
      color: this.color(),
      wireframe: this.wireframe(),
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.rotation.set(...this.rotation());
    this.mesh.scale.set(...this.scale());

    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.add(this.mesh);
    }
  }

  public ngOnDestroy(): void {
    if (this.parentFn) this.parentFn()?.remove(this.mesh);
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
