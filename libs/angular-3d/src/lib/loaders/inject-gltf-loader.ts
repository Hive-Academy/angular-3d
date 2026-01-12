/**
 * Inject GLTF Loader - Composable GLTF/GLB loading function
 *
 * Provides a reactive GLTF loader that integrates with Angular's
 * injection system and automatically handles cleanup.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ModelComponent {
 *   readonly modelPath = input<string>('/assets/model.glb');
 *   readonly useDraco = input<boolean>(true);
 *
 *   // Reactive GLTF loading - reloads when URL changes
 *   readonly gltf = injectGltfLoader(
 *     () => this.modelPath(),
 *     { useDraco: true }
 *   );
 *
 *   // Access loaded model in template or code
 *   ngAfterViewInit() {
 *     const scene = this.gltf.scene(); // THREE.Group | null
 *     const isLoading = this.gltf.loading(); // boolean
 *   }
 * }
 * ```
 */

import { inject, DestroyRef, signal, effect, untracked } from '@angular/core';
import type { GLTF } from 'three-stdlib';
import type { Group } from 'three/webgpu';
import {
  GltfLoaderService,
  type GltfLoaderOptions,
} from './gltf-loader.service';

/**
 * Result interface for injectGltfLoader
 */
export interface GltfLoaderResult {
  /** Signal accessor for loaded GLTF data */
  readonly data: () => GLTF | null;
  /** Signal accessor for loading state */
  readonly loading: () => boolean;
  /** Signal accessor for error state */
  readonly error: () => Error | null;
  /** Signal accessor for progress (0-100) */
  readonly progress: () => number;
  /** Convenience accessor for GLTF scene (Group) */
  readonly scene: () => Group | null;
  /** Convenience accessor for GLTF animations */
  readonly animations: () => GLTF['animations'] | null;
}

/**
 * Composable function for reactive GLTF/GLB loading.
 *
 * Must be called in an injection context (constructor, field initializer, or inject()).
 * Automatically reloads when the URL signal changes and handles cleanup on destroy.
 *
 * @param urlFn - Function returning the model URL (can be a signal)
 * @param options - Static options or signal-based options function
 * @returns GltfLoaderResult with signal accessors for data, loading, error, progress, scene
 *
 * @example
 * ```typescript
 * // With signal input and static options
 * readonly modelPath = input<string>();
 * readonly gltf = injectGltfLoader(() => this.modelPath(), { useDraco: true });
 *
 * // With static URL
 * readonly gltf = injectGltfLoader(() => '/assets/robot.glb');
 *
 * // Access the scene
 * const scene = this.gltf.scene(); // THREE.Group | null
 * ```
 */
export function injectGltfLoader(
  urlFn: () => string | null | undefined,
  options?: GltfLoaderOptions | (() => GltfLoaderOptions)
): GltfLoaderResult {
  const gltfService = inject(GltfLoaderService);
  const destroyRef = inject(DestroyRef);

  // Internal state signals
  const _data = signal<GLTF | null>(null);
  const _loading = signal<boolean>(false);
  const _error = signal<Error | null>(null);
  const _progress = signal<number>(0);

  // Request ID for stale request protection
  let currentRequestId = 0;

  // Effect to watch URL changes and reload
  effect(() => {
    const url = urlFn();

    // Get options (support both static and signal-based)
    const resolvedOptions: GltfLoaderOptions =
      typeof options === 'function' ? options() : options ?? {};

    // Skip if no URL
    if (!url) {
      untracked(() => {
        _data.set(null);
        _loading.set(false);
        _error.set(null);
        _progress.set(0);
      });
      return;
    }

    // Increment request ID for stale protection
    const requestId = ++currentRequestId;

    untracked(() => {
      _loading.set(true);
      _error.set(null);
      _progress.set(0);
    });

    // Load GLTF
    const result = gltfService.load(url, resolvedOptions);

    // Poll for completion (signals are reactive)
    const checkCompletion = (): void => {
      // Stale request protection
      if (requestId !== currentRequestId) {
        return;
      }

      const data = result.data();
      const loading = result.loading();
      const error = result.error();
      const progress = result.progress();

      _data.set(data);
      _loading.set(loading);
      _error.set(error);
      _progress.set(progress);

      // Continue polling if still loading
      if (loading) {
        requestAnimationFrame(checkCompletion);
      }
    };

    checkCompletion();
  });

  // Cleanup on destroy
  destroyRef.onDestroy(() => {
    // Mark as stale to prevent any pending updates
    currentRequestId++;
  });

  return {
    data: _data.asReadonly(),
    loading: _loading.asReadonly(),
    error: _error.asReadonly(),
    progress: _progress.asReadonly(),
    scene: () => _data()?.scene ?? null,
    animations: () => _data()?.animations ?? null,
  };
}
