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
import { GltfLoaderService } from '../loaders/gltf-loader.service';

@Component({
  selector: 'a3d-gltf-model',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class GltfModelComponent implements OnInit, OnDestroy {
  // Transform inputs (pattern: box.component.ts:21-30)
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<number | [number, number, number]>(1);

  // Model loading inputs
  public readonly modelPath = input.required<string>();
  public readonly useDraco = input<boolean>(false);

  // Material override inputs (pattern: temp/gltf-model.component.ts:150-155)
  public readonly colorOverride = input<string | number | undefined>(undefined);
  public readonly metalness = input<number | undefined>(undefined);
  public readonly roughness = input<number | undefined>(undefined);

  private readonly gltfLoader = inject(GltfLoaderService);
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private group: THREE.Group | null = null;

  public constructor() {
    // Pattern: box.component.ts:41-62 (reactive effects for transforms)
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
        this.group.scale.set(...scale);
      }
    });
    // Pattern: temp/gltf-model.component.ts:196-208 (material update effect)
    effect(() => {
      if (this.group) {
        // Trigger material update when any material input changes
        const _color = this.colorOverride();
        const _metal = this.metalness();
        const _rough = this.roughness();
        this.applyMaterialOverrides(this.group);
      }
    });
  }

  public ngOnInit(): void {
    // Pattern: gltf-loader.service.ts:109 (load API)
    const result = this.gltfLoader.load(this.modelPath(), {
      useDraco: this.useDraco(),
    });

    // Poll for completion (pattern: inject-texture-loader.ts:105-125)
    const checkLoad = (): void => {
      const data = result.data();
      if (data && !this.group) {
        this.group = data.scene.clone(); // Clone to allow multiple instances
        this.group.position.set(...this.position());
        this.group.rotation.set(...this.rotation());
        const s = this.scale();
        const scale: [number, number, number] =
          typeof s === 'number' ? [s, s, s] : s;
        this.group.scale.set(...scale);

        // Add to parent (pattern: box.component.ts:94-103)
        if (this.parentFn) {
          const parent = this.parentFn();
          parent?.add(this.group);
        } else {
          console.warn('GltfModelComponent: No parent found');
        }

        this.applyMaterialOverrides(this.group);
      } else if (result.loading()) {
        requestAnimationFrame(checkLoad);
      }
    };
    checkLoad();
  }

  // Pattern: temp/gltf-model.component.ts:247-292 (material override traversal)
  private applyMaterialOverrides(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ('material' in child && child.material) {
        const material = child.material as THREE.Material;
        if ('color' in material) {
          const pbr = material as THREE.MeshStandardMaterial;
          const color = this.colorOverride();
          if (color !== undefined) {
            pbr.color.set(color);
          }
          const metalness = this.metalness();
          if (metalness !== undefined) {
            pbr.metalness = metalness;
          }
          const roughness = this.roughness();
          if (roughness !== undefined) {
            pbr.roughness = roughness;
          }
          pbr.needsUpdate = true;
        }
      }
    });
  }

  public ngOnDestroy(): void {
    // Pattern: box.component.ts:106-113 (disposal)
    if (this.parentFn && this.group) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }
    // Note: Don't dispose loader cache, just remove from scene
  }
}
