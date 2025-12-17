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
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import { NG_3D_PARENT } from '../types/tokens';

@Component({
  selector: 'a3d-svg-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SvgIconComponent implements OnInit, OnDestroy {
  // Transformation inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<number | [number, number, number]>(1);

  // SVG inputs
  public readonly svgPath = input.required<string>();
  public readonly depth = input<number>(0.1);
  public readonly center = input<boolean>(true);
  public readonly flipY = input<boolean>(true);

  // Bevel options for extrusion
  public readonly bevelEnabled = input<boolean>(false);
  public readonly bevelThickness = input<number>(0.02);
  public readonly bevelSize = input<number>(0.01);

  // Material inputs
  public readonly color = input<string | number>(0xffd700);
  public readonly metalness = input<number>(0.7);
  public readonly roughness = input<number>(0.2);
  public readonly emissive = input<number>(0x000000);
  public readonly emissiveIntensity = input<number>(0);

  // Three.js objects
  private group: THREE.Group | null = null;
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.MeshStandardMaterial[] = [];

  // Parent injection
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  // SVG loader
  private readonly svgLoader = new SVGLoader();

  public constructor() {
    // Reactive effects for transforms
    effect(() => {
      if (this.group) {
        this.group.position.set(...this.position());
      }
    });
    effect(() => {
      if (this.group) {
        this.group.rotation.set(...this.rotation());
      }
    });
    effect(() => {
      if (this.group) {
        const s = this.scale();
        const scale: [number, number, number] =
          typeof s === 'number' ? [s, s, s] : s;
        this.group.scale.set(scale[0], scale[1], scale[2]);
      }
    });
    // Material update effect
    effect(() => {
      if (this.materials.length > 0) {
        const color = this.color();
        const metalness = this.metalness();
        const roughness = this.roughness();
        const emissive = this.emissive();
        const emissiveIntensity = this.emissiveIntensity();

        this.materials.forEach((material) => {
          material.color.set(color);
          material.metalness = metalness;
          material.roughness = roughness;
          material.emissive.set(emissive);
          material.emissiveIntensity = emissiveIntensity;
          material.needsUpdate = true;
        });
      }
    });
  }

  public ngOnInit(): void {
    // Create group
    this.group = new THREE.Group();

    // Load SVG
    this.svgLoader.load(
      this.svgPath(),
      (data) => {
        // Create extrude settings
        const extrudeSettings: THREE.ExtrudeGeometryOptions = {
          depth: this.depth(),
          bevelEnabled: this.bevelEnabled(),
          bevelThickness: this.bevelThickness(),
          bevelSize: this.bevelSize(),
        };

        // Process SVG paths
        data.paths.forEach((path) => {
          const shapes = SVGLoader.createShapes(path);

          shapes.forEach((shape) => {
            let geometry: THREE.BufferGeometry;

            if (this.depth() > 0) {
              geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            } else {
              geometry = new THREE.ShapeGeometry(shape);
            }

            const material = new THREE.MeshStandardMaterial({
              color: this.color(),
              metalness: this.metalness(),
              roughness: this.roughness(),
              emissive: this.emissive(),
              emissiveIntensity: this.emissiveIntensity(),
            });

            const mesh = new THREE.Mesh(geometry, material);
            this.group!.add(mesh);

            // Store for disposal
            this.geometries.push(geometry);
            this.materials.push(material);
          });
        });

        // Center the group if requested
        if (this.center()) {
          this.centerGroup();
        }

        // Flip Y-axis (SVG coordinate system is inverted)
        if (this.flipY()) {
          this.group!.scale.y = -1;
        }

        // Apply transforms
        this.group!.position.set(...this.position());
        this.group!.rotation.set(...this.rotation());
        const s = this.scale();
        const scale = typeof s === 'number' ? [s, s, s] : s;
        this.group!.scale.set(
          scale[0],
          scale[1] * (this.flipY() ? -1 : 1),
          scale[2]
        );

        // Add to parent
        if (this.parentFn) {
          const parent = this.parentFn();
          if (parent) {
            parent.add(this.group!);
          } else {
            console.warn('SvgIconComponent: Parent not ready');
          }
        } else {
          console.warn('SvgIconComponent: No parent found');
        }
      },
      undefined,
      (error) => {
        console.error('SvgIconComponent: SVG loading error:', error);
      }
    );
  }

  private centerGroup(): void {
    if (!this.group) return;

    const box = new THREE.Box3().setFromObject(this.group);
    const center = box.getCenter(new THREE.Vector3());

    // Offset all children
    this.group.children.forEach((child) => {
      child.position.sub(center);
    });
  }

  public ngOnDestroy(): void {
    if (this.parentFn && this.group) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }

    // Dispose geometries and materials
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());

    // Clear arrays
    this.geometries = [];
    this.materials = [];
  }
}
