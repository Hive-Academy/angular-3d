/**
 * Texture Loader Service - Signal-based texture loading
 *
 * Provides reactive texture loading with caching and cleanup.
 * Replaces `injectLoader` from angular-three.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class PlanetComponent {
 *   private textureLoader = inject(TextureLoaderService);
 *
 *   ngOnInit() {
 *     const result = this.textureLoader.load('/assets/earth.jpg');
 *     // result contains data, loading, error, progress signals
 *   }
 * }
 * ```
 */

import { Injectable, signal } from '@angular/core';
import * as THREE from 'three';

/**
 * State for a texture loading operation
 */
export interface TextureLoadState {
  /** Loaded texture or null if loading/error */
  readonly data: THREE.Texture | null;
  /** Whether the texture is currently loading */
  readonly loading: boolean;
  /** Error if loading failed */
  readonly error: Error | null;
  /** Loading progress (0-100) */
  readonly progress: number;
}

/**
 * Result object returned by load() with signal accessors
 */
export interface TextureLoadResult {
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
 * Service for loading textures with caching and reactive state.
 *
 * Features:
 * - URL-based caching to avoid duplicate network requests
 * - Signal-based state for reactive updates
 * - Progress tracking during load
 * - Proper disposal on cache clear
 */
@Injectable({ providedIn: 'root' })
export class TextureLoaderService {
  /** Cache of loaded textures by URL */
  private readonly cache = new Map<string, THREE.Texture>();

  /** Active loading operations by URL */
  private readonly loading = new Map<string, TextureLoadResult>();

  /** Three.js texture loader instance */
  private readonly loader = new THREE.TextureLoader();

  /**
   * Load a texture from URL with caching
   *
   * @param url - URL of the texture to load
   * @returns TextureLoadResult with signal accessors
   */
  public load(url: string): TextureLoadResult {
    // Check if already loading this URL
    const existingLoad = this.loading.get(url);
    if (existingLoad) {
      return existingLoad;
    }

    // Check cache first
    const cached = this.cache.get(url);
    if (cached) {
      return this.createCachedResult(cached);
    }

    // Create new loading state
    const _data = signal<THREE.Texture | null>(null);
    const _loading = signal<boolean>(true);
    const _error = signal<Error | null>(null);
    const _progress = signal<number>(0);

    const result: TextureLoadResult = {
      data: _data.asReadonly(),
      loading: _loading.asReadonly(),
      error: _error.asReadonly(),
      progress: _progress.asReadonly(),
    };

    // Track this loading operation
    this.loading.set(url, result);

    // Start loading
    this.loader.load(
      url,
      // onLoad
      (texture) => {
        this.cache.set(url, texture);
        _data.set(texture);
        _loading.set(false);
        _progress.set(100);
        this.loading.delete(url);
      },
      // onProgress
      (event) => {
        if (event.lengthComputable) {
          _progress.set(Math.round((event.loaded / event.total) * 100));
        }
      },
      // onError
      (error) => {
        const errorObj =
          error instanceof Error ? error : new Error(String(error));
        _error.set(errorObj);
        _loading.set(false);
        this.loading.delete(url);
      }
    );

    return result;
  }

  /**
   * Get cached texture if available
   *
   * @param url - URL to check in cache
   * @returns Cached texture or undefined
   */
  public getCached(url: string): THREE.Texture | undefined {
    return this.cache.get(url);
  }

  /**
   * Check if a texture is cached
   *
   * @param url - URL to check
   * @returns True if texture is in cache
   */
  public isCached(url: string): boolean {
    return this.cache.has(url);
  }

  /**
   * Clear cache and dispose all textures
   */
  public clearCache(): void {
    this.cache.forEach((texture) => {
      texture.dispose();
    });
    this.cache.clear();
  }

  /**
   * Remove a specific texture from cache and dispose it
   *
   * @param url - URL of texture to remove
   */
  public removeFromCache(url: string): void {
    const texture = this.cache.get(url);
    if (texture) {
      texture.dispose();
      this.cache.delete(url);
    }
  }

  /**
   * Get the number of cached textures
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Create a result for an already cached texture
   */
  private createCachedResult(texture: THREE.Texture): TextureLoadResult {
    return {
      data: () => texture,
      loading: () => false,
      error: () => null,
      progress: () => 100,
    };
  }
}
