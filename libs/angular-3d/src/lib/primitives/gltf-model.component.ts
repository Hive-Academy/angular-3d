import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  signal,
  DestroyRef,
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
  private readonly destroyRef = inject(DestroyRef);
  private group: THREE.Group | null = null;

  // Track if model has been added to scene (for browser-only operations)
  private readonly isInitialized = signal(false);

  /**
   * Loading state signal - true while model is being fetched
   * Useful for displaying loading spinners in UI
   */
  public readonly isLoading = signal(false);

  /**
   * Load error signal - contains error message if loading failed
   * Null if no error or model loaded successfully
   */
  public readonly loadError = signal<string | null>(null);

  public constructor() {
    // Model Loading Effect - runs in injection context (constructor)
    // This effect will react to modelPath/useDraco changes and load the model
    effect((onCleanup) => {
      const path = this.modelPath();
      const useDraco = this.useDraco();

      // Set loading state
      this.isLoading.set(true);
      this.loadError.set(null);

      // Initiate load
      const result = this.gltfLoader.load(path, {
        useDraco: useDraco,
      });

      // Handle loading completion
      // Since result.data and result.error are signals, reading them here creates dependencies
      // When they update, this effect re-runs
      const data = result.data();
      const error = result.error();

      if (error) {
        // Loading failed
        this.isLoading.set(false);
        this.loadError.set(error.message || 'Failed to load GLTF model');
        console.error('[GltfModelComponent] Load error:', error);
      } else if (data) {
        // Loading succeeded
        this.isLoading.set(false);
        this.loadError.set(null);

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
            this.isInitialized.set(true);
          } else {
            console.warn('GltfModelComponent: Parent not ready');
          }
        } else {
          console.warn('GltfModelComponent: No parent found');
        }
      }
      // else: still loading (data and error both null)

      onCleanup(() => {
        if (this.group && this.parentFn) {
          const parent = this.parentFn();
          parent?.remove(this.group);

          // Dispose all resources to prevent memory leaks
          this.group.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.geometry?.dispose();
              if (Array.isArray(child.material)) {
                child.material.forEach((m) => m.dispose());
              } else {
                child.material?.dispose();
              }
            }
          });
        }
        this.group = null;
        this.isInitialized.set(false);
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

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.parentFn && this.group) {
        const parent = this.parentFn();
        parent?.remove(this.group);
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
