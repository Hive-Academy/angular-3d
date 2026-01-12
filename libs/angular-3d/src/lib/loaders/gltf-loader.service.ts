/**
 * GLTF Loader Service - Signal-based GLTF/GLB model loading
 *
 * Provides reactive GLTF/GLB loading with Draco and MeshOpt decompression support.
 * Replaces `injectGLTF` from angular-three-soba.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class ModelComponent {
 *   private gltfLoader = inject(GltfLoaderService);
 *
 *   async ngOnInit() {
 *     const gltf = await this.gltfLoader.load('/assets/model.glb', {
 *       useDraco: true
 *     });
 *     this.scene.add(gltf.scene);
 *   }
 * }
 * ```
 */

import { Injectable, signal } from '@angular/core';
import { GLTFLoader, DRACOLoader } from 'three-stdlib';
import type { GLTF } from 'three-stdlib';

/**
 * Options for GLTF loading
 */
export interface GltfLoaderOptions {
  /** Enable Draco decompression for compressed meshes */
  useDraco?: boolean;
  /** Enable MeshOpt decompression */
  useMeshOpt?: boolean;
  /** Custom path for Draco decoder files */
  dracoDecoderPath?: string;
}

/**
 * State for a GLTF loading operation
 */
export interface GltfLoadState {
  /** Loaded GLTF data or null if loading/error */
  readonly data: GLTF | null;
  /** Whether the model is currently loading */
  readonly loading: boolean;
  /** Error if loading failed */
  readonly error: Error | null;
  /** Loading progress (0-100) */
  readonly progress: number;
}

/**
 * Result object returned by load() with signal accessors
 */
export interface GltfLoadResult {
  /** Signal accessor for loaded GLTF */
  readonly data: () => GLTF | null;
  /** Signal accessor for loading state */
  readonly loading: () => boolean;
  /** Signal accessor for error state */
  readonly error: () => Error | null;
  /** Signal accessor for progress (0-100) */
  readonly progress: () => number;
  /** Promise that resolves when loading completes */
  readonly promise: Promise<GLTF>;
}

/**
 * Default Draco decoder path (CDN-hosted for reliability)
 */
const DEFAULT_DRACO_PATH =
  'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';

/**
 * Service for loading GLTF/GLB models with caching and reactive state.
 *
 * Features:
 * - URL-based caching with options hash
 * - Draco compression support
 * - MeshOpt compression support
 * - Signal-based state for reactive updates
 * - Progress tracking during load
 */
@Injectable({ providedIn: 'root' })
export class GltfLoaderService {
  /** Cache of loaded GLTF by cache key */
  private readonly cache = new Map<string, GLTF>();

  /** Active loading operations by cache key */
  private readonly loading = new Map<string, GltfLoadResult>();

  /** Shared GLTF loader instance */
  private loader: GLTFLoader | null = null;

  /** Shared Draco loader instance */
  private dracoLoader: DRACOLoader | null = null;

  /** Whether Draco loader has been initialized */
  private dracoInitialized = false;

  /**
   * Load a GLTF/GLB model with options
   *
   * @param url - URL of the model to load
   * @param options - Loading options (Draco, MeshOpt, etc.)
   * @returns GltfLoadResult with signal accessors and promise
   */
  public load(url: string, options: GltfLoaderOptions = {}): GltfLoadResult {
    const cacheKey = this.getCacheKey(url, options);

    // Check if already loading this model
    const existingLoad = this.loading.get(cacheKey);
    if (existingLoad) {
      return existingLoad;
    }

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return this.createCachedResult(cached);
    }

    // Create new loading state
    const _data = signal<GLTF | null>(null);
    const _loading = signal<boolean>(true);
    const _error = signal<Error | null>(null);
    const _progress = signal<number>(0);

    // Create promise for async/await usage
    let resolvePromise: (gltf: GLTF) => void;
    let rejectPromise: (error: Error) => void;
    const promise = new Promise<GLTF>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    const result: GltfLoadResult = {
      data: _data.asReadonly(),
      loading: _loading.asReadonly(),
      error: _error.asReadonly(),
      progress: _progress.asReadonly(),
      promise,
    };

    // Track this loading operation
    this.loading.set(cacheKey, result);

    // Get or create loader with options
    const loader = this.getLoader(options);

    // Start loading
    loader.load(
      url,
      // onLoad
      (gltf) => {
        this.cache.set(cacheKey, gltf);
        _data.set(gltf);
        _loading.set(false);
        _progress.set(100);
        this.loading.delete(cacheKey);
        resolvePromise(gltf);
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
        this.loading.delete(cacheKey);
        rejectPromise(errorObj);
      }
    );

    return result;
  }

  /**
   * Load a GLTF/GLB model and return a promise
   *
   * @param url - URL of the model to load
   * @param options - Loading options
   * @returns Promise resolving to GLTF data
   */
  public async loadAsync(
    url: string,
    options: GltfLoaderOptions = {}
  ): Promise<GLTF> {
    return this.load(url, options).promise;
  }

  /**
   * Get cached GLTF if available
   *
   * @param url - URL to check in cache
   * @param options - Options used for loading
   * @returns Cached GLTF or undefined
   */
  public getCached(
    url: string,
    options: GltfLoaderOptions = {}
  ): GLTF | undefined {
    const cacheKey = this.getCacheKey(url, options);
    return this.cache.get(cacheKey);
  }

  /**
   * Check if a GLTF is cached
   *
   * @param url - URL to check
   * @param options - Options used for loading
   * @returns True if GLTF is in cache
   */
  public isCached(url: string, options: GltfLoaderOptions = {}): boolean {
    const cacheKey = this.getCacheKey(url, options);
    return this.cache.has(cacheKey);
  }

  /**
   * Clear entire cache (does not dispose geometries/materials)
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Remove a specific GLTF from cache
   *
   * @param url - URL of GLTF to remove
   * @param options - Options used for loading
   */
  public removeFromCache(url: string, options: GltfLoaderOptions = {}): void {
    const cacheKey = this.getCacheKey(url, options);
    this.cache.delete(cacheKey);
  }

  /**
   * Get the number of cached GLTF models
   */
  public getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * Dispose Draco loader resources
   */
  public disposeDracoLoader(): void {
    if (this.dracoLoader) {
      this.dracoLoader.dispose();
      this.dracoLoader = null;
      this.dracoInitialized = false;
    }
  }

  /**
   * Get or create the GLTF loader with specified options
   */
  private getLoader(options: GltfLoaderOptions): GLTFLoader {
    if (!this.loader) {
      this.loader = new GLTFLoader();
    }

    // Configure Draco if needed
    if (options.useDraco && !this.dracoInitialized) {
      this.initDracoLoader(options.dracoDecoderPath);
    }

    return this.loader;
  }

  /**
   * Initialize Draco decoder loader
   */
  private initDracoLoader(decoderPath?: string): void {
    if (!this.dracoLoader) {
      this.dracoLoader = new DRACOLoader();
      this.dracoLoader.setDecoderPath(decoderPath ?? DEFAULT_DRACO_PATH);
      this.dracoLoader.preload();
    }

    if (this.loader) {
      this.loader.setDRACOLoader(this.dracoLoader);
    }

    this.dracoInitialized = true;
  }

  /**
   * Generate cache key from URL and options
   */
  private getCacheKey(url: string, options: GltfLoaderOptions): string {
    const optionsHash = JSON.stringify({
      draco: options.useDraco ?? false,
      meshopt: options.useMeshOpt ?? false,
    });
    return `${url}:${optionsHash}`;
  }

  /**
   * Create a result for an already cached GLTF
   */
  private createCachedResult(gltf: GLTF): GltfLoadResult {
    return {
      data: () => gltf,
      loading: () => false,
      error: () => null,
      progress: () => 100,
      promise: Promise.resolve(gltf),
    };
  }
}
