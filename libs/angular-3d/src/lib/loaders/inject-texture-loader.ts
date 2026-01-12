/**
 * Inject Texture Loader - Composable texture loading function
 *
 * Provides a reactive texture loader that integrates with Angular's
 * injection system and automatically handles cleanup.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class PlanetComponent {
 *   readonly textureUrl = input<string>('/assets/earth.jpg');
 *
 *   // Reactive texture loading - reloads when URL changes
 *   readonly texture = injectTextureLoader(() => this.textureUrl());
 *
 *   // Access loaded texture in template or code
 *   ngAfterViewInit() {
 *     const tex = this.texture.data(); // THREE.Texture | null
 *     const isLoading = this.texture.loading(); // boolean
 *   }
 * }
 * ```
 */

import { inject, DestroyRef, signal, effect, untracked } from '@angular/core';
import type * as THREE from 'three/webgpu';
import { TextureLoaderService } from './texture-loader.service';

/**
 * Result interface for injectTextureLoader
 */
export interface TextureLoaderResult {
  /** Signal accessor for loaded texture */
  readonly data: () => THREE.Texture | null;
  /** Signal accessor for loading state */
  readonly loading: () => boolean;
  /** Signal accessor for error state */
  readonly error: () => Error | null;
  /** Signal accessor for progress (0-100) */
  readonly progress: () => number;
}

/**
 * Composable function for reactive texture loading.
 *
 * Must be called in an injection context (constructor, field initializer, or inject()).
 * Automatically reloads when the URL signal changes and handles cleanup on destroy.
 *
 * @param urlFn - Function returning the texture URL (can be a signal)
 * @returns TextureLoaderResult with signal accessors for data, loading, error, progress
 *
 * @example
 * ```typescript
 * // With signal input
 * readonly textureUrl = input<string>();
 * readonly texture = injectTextureLoader(() => this.textureUrl());
 *
 * // With static URL
 * readonly texture = injectTextureLoader(() => '/assets/texture.jpg');
 * ```
 */
export function injectTextureLoader(
  urlFn: () => string | null | undefined
): TextureLoaderResult {
  const textureService = inject(TextureLoaderService);
  const destroyRef = inject(DestroyRef);

  // Internal state signals
  const _data = signal<THREE.Texture | null>(null);
  const _loading = signal<boolean>(false);
  const _error = signal<Error | null>(null);
  const _progress = signal<number>(0);

  // Request ID for stale request protection
  let currentRequestId = 0;

  // Effect to watch URL changes and reload
  effect(() => {
    const url = urlFn();

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

    // Load texture
    const result = textureService.load(url);

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

  // Cleanup on destroy (optional: textures are cached, so we don't dispose by default)
  destroyRef.onDestroy(() => {
    // Mark as stale to prevent any pending updates
    currentRequestId++;
  });

  return {
    data: _data.asReadonly(),
    loading: _loading.asReadonly(),
    error: _error.asReadonly(),
    progress: _progress.asReadonly(),
  };
}
