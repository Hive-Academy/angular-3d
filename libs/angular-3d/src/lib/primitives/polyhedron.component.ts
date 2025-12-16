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
  selector: 'a3d-polyhedron',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PolyhedronComponent implements OnInit, OnDestroy {
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

  private mesh!: THREE.Mesh;
  private geometry!: THREE.PolyhedronGeometry;
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
      this.updateGeometry();
    });
  }

  private updateGeometry(): void {
    const [radius, detail] = this.args();
    const type = this.type();

    if (this.geometry) this.geometry.dispose();

    switch (type) {
      case 'icosahedron':
        this.geometry = new THREE.IcosahedronGeometry(radius, detail);
        break;
      case 'dodecahedron':
        this.geometry = new THREE.DodecahedronGeometry(radius, detail);
        break;
      case 'tetrahedron':
        this.geometry = new THREE.TetrahedronGeometry(radius, detail);
        break;
      case 'octahedron':
        this.geometry = new THREE.OctahedronGeometry(radius, detail);
        break;
      default:
        this.geometry = new THREE.IcosahedronGeometry(radius, detail);
    }

    if (this.mesh) this.mesh.geometry = this.geometry;
  }

  public ngOnInit(): void {
    this.updateGeometry();
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
