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
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { NG_3D_PARENT } from '../types/tokens';

@Component({
  selector: 'a3d-text-3d',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class Text3DComponent implements OnInit, OnDestroy {
  // Transformation inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<number | [number, number, number]>(1);

  // Text inputs
  public readonly text = input.required<string>();
  public readonly font = input<string>(
    'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json'
  );

  // Text geometry options
  public readonly fontSize = input<number>(1);
  public readonly height = input<number>(0.2);
  public readonly curveSegments = input<number>(12);
  public readonly bevelEnabled = input<boolean>(false);
  public readonly bevelThickness = input<number>(0.03);
  public readonly bevelSize = input<number>(0.02);
  public readonly bevelOffset = input<number>(0);
  public readonly bevelSegments = input<number>(3);

  // Material inputs
  public readonly color = input<string | number>(0xffffff);
  public readonly metalness = input<number>(0.5);
  public readonly roughness = input<number>(0.5);
  public readonly emissive = input<number>(0x000000);
  public readonly emissiveIntensity = input<number>(0);

  // Three.js objects
  private mesh: THREE.Mesh | null = null;
  private geometry: TextGeometry | null = null;
  private material!: THREE.MeshStandardMaterial;

  // Parent injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  // Font loader
  private readonly fontLoader = new FontLoader();

  public constructor() {
    // Reactive effects for transforms
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
        const s = this.scale();
        const scale: [number, number, number] =
          typeof s === 'number' ? [s, s, s] : s;
        this.mesh.scale.set(scale[0], scale[1], scale[2]);
      }
    });
    effect(() => {
      if (this.material) {
        this.material.color.set(this.color());
        this.material.metalness = this.metalness();
        this.material.roughness = this.roughness();
        this.material.emissive.set(this.emissive());
        this.material.emissiveIntensity = this.emissiveIntensity();
        this.material.needsUpdate = true;
      }
    });
  }

  public ngOnInit(): void {
    // Initialize material
    this.material = new THREE.MeshStandardMaterial({
      color: this.color(),
      metalness: this.metalness(),
      roughness: this.roughness(),
      emissive: this.emissive(),
      emissiveIntensity: this.emissiveIntensity(),
    });

    // Load font and create text geometry
    this.fontLoader.load(
      this.font(),
      (font) => {
        // Create text geometry
        this.geometry = new TextGeometry(this.text(), {
          font,
          size: this.fontSize(),
          height: this.height(),
          curveSegments: this.curveSegments(),
          bevelEnabled: this.bevelEnabled(),
          bevelThickness: this.bevelThickness(),
          bevelSize: this.bevelSize(),
          bevelOffset: this.bevelOffset(),
          bevelSegments: this.bevelSegments(),
        } as any); // Type assertion for TextGeometry options

        // Create mesh
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set(...this.position());
        this.mesh.rotation.set(...this.rotation());
        const s = this.scale();
        const scale: [number, number, number] =
          typeof s === 'number' ? [s, s, s] : s;
        this.mesh.scale.set(scale[0], scale[1], scale[2]);

        // Add to parent
        if (this.parentFn) {
          const parent = this.parentFn();
          if (parent) {
            parent.add(this.mesh);
          } else {
            console.warn('Text3DComponent: Parent not ready');
          }
        } else {
          console.warn('Text3DComponent: No parent found');
        }
      },
      undefined,
      (error) => {
        console.error('Text3DComponent: Font loading error:', error);
      }
    );
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
