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
  selector: 'a3d-cylinder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class CylinderComponent implements OnInit, OnDestroy {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  // radiusTop, radiusBottom, height, radialSegments
  public readonly args = input<[number, number, number, number]>([1, 1, 1, 32]);
  public readonly color = input<string | number>('green');
  public readonly wireframe = input<boolean>(false);

  private mesh!: THREE.Mesh;
  private geometry!: THREE.CylinderGeometry;
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
      const [radiusTop, radiusBottom, height, radialSegments] = this.args();
      if (this.geometry) this.geometry.dispose();
      this.geometry = new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        radialSegments
      );
      if (this.mesh) this.mesh.geometry = this.geometry;
    });
  }

  public ngOnInit(): void {
    const [radiusTop, radiusBottom, height, radialSegments] = this.args();
    this.geometry = new THREE.CylinderGeometry(
      radiusTop,
      radiusBottom,
      height,
      radialSegments
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
