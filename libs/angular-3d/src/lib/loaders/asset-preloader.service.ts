/**
 * Asset Preloader Service - Multi-asset loading orchestration with unified progress tracking
 *
 * Provides coordinated loading of multiple assets (GLTF, textures) with aggregated progress
 * signals. Useful for preloading scene assets before cinematic entrance animations.
 *
 * Features:
 * - Unified progress tracking across multiple asset types
 * - Signal-based reactive state (progress, isReady, errors)
 * - Weighted progress calculation for varied asset sizes
 * - Leverages existing loader service caching
 * - Support for cancellation
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class HeroSectionComponent {
 *   private preloader = inject(AssetPreloaderService);
 *
 *   // Start preloading assets
 *   preloadState = this.preloader.preload([
 *     { url: '/assets/model.glb', type: 'gltf', weight: 3 },
 *     { url: '/assets/texture.jpg', type: 'texture' },
 *   ]);
 *
 *   // Use in template: {{ preloadState.progress() }}%
 *   // Check ready state: preloadState.isReady()
 * }
 * ```
 */

import {
  Injectable,
  inject,
  signal,
  computed,
  effect,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import {
  GltfLoaderService,
  type GltfLoaderOptions,
} from './gltf-loader.service';
import { TextureLoaderService } from './texture-loader.service';

/**
 * Supported asset types for preloading
 */
export type AssetType = 'gltf' | 'texture' | 'hdri';

/**
 * Definition of an asset to preload
 */
export interface AssetDefinition {
  /** URL of the asset to load */
  url: string;
  /** Type of asset (determines which loader to use) */
  type: AssetType;
  /** Optional weight for progress calculation (default: 1) - use higher values for larger assets */
  weight?: number;
  /** Optional loader options (for GLTF: useDraco, etc.) */
  options?: GltfLoaderOptions;
}

/**
 * State object returned from preload() with reactive signals
 *
 * All signals are readonly - internal state is managed by the service.
 */
export interface PreloadState {
  /** Combined progress across all assets (0-100) */
  readonly progress: Signal<number>;
  /** True when all assets have loaded successfully */
  readonly isReady: Signal<boolean>;
  /** Array of any errors encountered during loading */
  readonly errors: Signal<Error[]>;
  /** Count of successfully loaded assets */
  readonly loadedCount: Signal<number>;
  /** Total number of assets being loaded */
  readonly totalCount: Signal<number>;
  /** Cancel loading and cleanup resources */
  readonly cancel: () => void;
}

/**
 * Internal tracking for a single asset load operation
 */
interface AssetLoadOperation {
  /** URL of the asset */
  url: string;
  /** Type of asset being loaded */
  type: AssetType;
  /** Weight for progress calculation */
  weight: number;
  /** Signal tracking loading progress (0-100) */
  progress: Signal<number>;
  /** Signal tracking error state */
  error: Signal<Error | null>;
  /** Signal tracking loaded state */
  loaded: Signal<boolean>;
}

/**
 * Service for loading multiple assets with unified progress tracking.
 *
 * Delegates actual loading to GltfLoaderService and TextureLoaderService,
 * while providing aggregated progress signals for UI display.
 *
 * Features:
 * - Weighted progress calculation for varied asset sizes
 * - Leverages existing loader caching (cached assets return 100% immediately)
 * - Support for cancellation via cancel() method
 * - Aggregated error collection from all load operations
 */
@Injectable({ providedIn: 'root' })
export class AssetPreloaderService {
  private readonly gltfLoader = inject(GltfLoaderService);
  private readonly textureLoader = inject(TextureLoaderService);

  /** Track active preload operations by unique ID */
  private readonly activeOperations = new Map<string, PreloadState>();

  /** Counter for generating unique operation IDs */
  private operationCounter = 0;

  /**
   * Preload multiple assets with unified progress tracking
   *
   * @param assets - Array of asset definitions to load
   * @returns PreloadState with reactive signals for progress tracking
   *
   * @example
   * ```typescript
   * const state = preloader.preload([
   *   { url: '/model.glb', type: 'gltf', weight: 3 },
   *   { url: '/texture.jpg', type: 'texture' },
   * ]);
   *
   * // Track progress in template
   * effect(() => {
   *   console.log(`Loading: ${state.progress()}%`);
   *   if (state.isReady()) {
   *     console.log('All assets loaded!');
   *   }
   * });
   * ```
   */
  public preload(assets: AssetDefinition[]): PreloadState {
    const operationId = `preload_${++this.operationCounter}`;

    // Handle empty asset array - return immediately ready state
    if (assets.length === 0) {
      return this.createEmptyPreloadState();
    }

    const operations: AssetLoadOperation[] = [];

    // Create writable signals for aggregation
    const _cancelled = signal(false);

    // Start loading each asset and collect operations
    for (const asset of assets) {
      const weight = asset.weight ?? 1;
      const operation = this.startAssetLoad(asset);
      operations.push({ ...operation, weight });
    }

    // Computed signal: weighted average progress
    const progress = computed(() => {
      if (_cancelled()) return 0;

      const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
      if (totalWeight === 0) return 100;

      const weightedProgress = operations.reduce((sum, op) => {
        return sum + op.progress() * op.weight;
      }, 0);

      return Math.round(weightedProgress / totalWeight);
    });

    // Computed signal: all assets loaded
    const isReady = computed(() => {
      if (_cancelled()) return false;
      return operations.every((op) => op.loaded());
    });

    // Computed signal: count of loaded assets
    const loadedCount = computed(() => {
      return operations.filter((op) => op.loaded()).length;
    });

    // Computed signal: total asset count
    const totalCount = computed(() => assets.length);

    // Computed signal: collect errors from all operations
    const errors = computed(() => {
      const allErrors: Error[] = [];
      for (const op of operations) {
        const err = op.error();
        if (err) {
          allErrors.push(err);
        }
      }
      return allErrors;
    });

    // Cancel function to stop tracking updates
    const cancel = (): void => {
      _cancelled.set(true);
      this.activeOperations.delete(operationId);
      // Note: Underlying loaders don't support cancellation,
      // but we mark state as cancelled to prevent further signal updates from affecting consumers
    };

    const state: PreloadState = {
      progress,
      isReady,
      errors,
      loadedCount,
      totalCount,
      cancel,
    };

    this.activeOperations.set(operationId, state);
    return state;
  }

  /**
   * Get the number of active preload operations
   */
  public getActiveOperationCount(): number {
    return this.activeOperations.size;
  }

  /**
   * Start loading a single asset and return tracking signals
   *
   * @param asset - Asset definition to load
   * @returns Operation tracking object with progress, error, and loaded signals
   */
  private startAssetLoad(
    asset: AssetDefinition
  ): Omit<AssetLoadOperation, 'weight'> {
    const _progress: WritableSignal<number> = signal(0);
    const _error: WritableSignal<Error | null> = signal(null);
    const _loaded: WritableSignal<boolean> = signal(false);

    switch (asset.type) {
      case 'gltf': {
        const result = this.gltfLoader.load(asset.url, asset.options);

        // Create effect to sync loader signals to our tracking signals
        // All signal reads must be in the same execution context
        effect(
          () => {
            const progressValue = result.progress();
            const errorValue = result.error();
            const dataValue = result.data();

            _progress.set(progressValue);
            if (errorValue) {
              _error.set(errorValue);
            }
            if (dataValue) {
              _loaded.set(true);
            }
          },
          { allowSignalWrites: true }
        );
        break;
      }

      case 'texture': {
        const result = this.textureLoader.load(asset.url);

        // Create effect to sync loader signals to our tracking signals
        effect(
          () => {
            const progressValue = result.progress();
            const errorValue = result.error();
            const dataValue = result.data();

            _progress.set(progressValue);
            if (errorValue) {
              _error.set(errorValue);
            }
            if (dataValue) {
              _loaded.set(true);
            }
          },
          { allowSignalWrites: true }
        );
        break;
      }

      case 'hdri': {
        // HDRI loading not yet implemented - log warning and mark as complete
        // Future: integrate with HDRCubeTextureLoader or RGBELoader
        console.warn(
          `[AssetPreloaderService] HDRI loading not yet implemented for: ${asset.url}`
        );
        _progress.set(100);
        _loaded.set(true);
        break;
      }

      default: {
        // Handle unknown asset type
        const unknownType = asset.type as string;
        console.error(
          `[AssetPreloaderService] Unknown asset type: ${unknownType}`
        );
        _error.set(new Error(`Unknown asset type: ${unknownType}`));
        _progress.set(100);
        _loaded.set(true);
      }
    }

    return {
      url: asset.url,
      type: asset.type,
      progress: _progress.asReadonly(),
      error: _error.asReadonly(),
      loaded: _loaded.asReadonly(),
    };
  }

  /**
   * Create a preload state for empty asset array
   *
   * Returns immediately ready state with 100% progress
   */
  private createEmptyPreloadState(): PreloadState {
    return {
      progress: computed(() => 100),
      isReady: computed(() => true),
      errors: computed(() => []),
      loadedCount: computed(() => 0),
      totalCount: computed(() => 0),
      cancel: () => {
        // No-op for empty state
      },
    };
  }
}
