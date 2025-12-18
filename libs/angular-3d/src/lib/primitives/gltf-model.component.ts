import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  afterNextRender,
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
export class GltfModelComponent implements OnDestroy {
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
    // Model Loading Effect
    afterNextRender(() => {
      effect((onCleanup) => {
        const path = this.modelPath();
        const useDraco = this.useDraco();

        // Initiate load
        const result = this.gltfLoader.load(path, {
          useDraco: useDraco,
        });

        // Handle loading completion
        // Since result.data is a signal, we can just watch it!
        // But we are inside an effect already.
        // Ideally we would trigger side effect when data becomes available.
        // We can create a computed or just poll inside an effect? No, polling is bad.
        // If result.data is a signal, we can read it here.
        // If it's undefined, we do nothing. When it updates, this effect re-runs.
        const data = result.data();

        // Clean up previous model if specific to this run?
        // Actually onCleanup handles the "previous effect run" cleanup.
        // So if 'path' changes, onCleanup runs, extracting old model.
        // If 'data' changes (loaded), onCleanup runs, extracting old model (if any), then we add new.

        if (data) {
          // Clone to allow multiple instances
          this.group = data.scene.clone();

          // Apply transforms immediately
          this.group.position.set(...this.position());
          this.group.rotation.set(...this.rotation());
          const s = this.scale();
          const scale: [number, number, number] =
            typeof s === 'number' ? [s, s, s] : s;
          this.group.scale.set(...scale);

          // Apply material overrides
          this.applyMaterialOverrides(this.group);

          // Add to parent
          if (this.parentFn) {
            const parent = this.parentFn();
            if (parent) {
              parent.add(this.group);
            } else {
              console.warn('GltfModelComponent: Parent not ready');
            }
          } else {
            console.warn('GltfModelComponent: No parent found');
          }
        }

        onCleanup(() => {
          if (this.group && this.parentFn) {
            const parent = this.parentFn();
            parent?.remove(this.group);
          }
          // Dispose clone if needed? The original is cached in service.
          // We might want to dispose locally cloned materials if we modified them?
          // But we only modified properties, not replaced materials.
          this.group = null;
        });
      });
    });

    // Transform Effects
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
    // Material Override Effect
    effect(() => {
      if (this.group) {
        // Trigger material update when any material input changes
        // Read signals to register dependency
        this.colorOverride();
        this.metalness();
        this.roughness();
        this.applyMaterialOverrides(this.group);
      }
    });
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
    if (this.parentFn && this.group) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }
  }
}
