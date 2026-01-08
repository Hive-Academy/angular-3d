/**
 * Scene Loading Directive - Declarative loading coordination for Scene3dComponent
 *
 * Adds loading coordination behavior to a Scene3dComponent without requiring
 * manual service integration. Automatically detects SceneReadyService and
 * AssetPreloaderService to orchestrate the loading flow.
 *
 * Features:
 * - Auto-configure SceneReadyService detection
 * - Accept loadingConfig input for assets, overlay settings
 * - Emit outputs: sceneReady, loadingProgress, loadingComplete
 * - Coordinate with CinematicEntranceDirective if present
 * - Minimal configuration for basic usage
 * - Tree-shakable (no side effects on import)
 *
 * @example
 * ```html
 * <!-- Basic usage - auto-detects SceneReadyService -->
 * <a3d-scene-3d a3dSceneLoading>
 *   ...
 * </a3d-scene-3d>
 *
 * <!-- With asset preloading -->
 * <a3d-scene-3d
 *   a3dSceneLoading
 *   [loadingConfig]="{
 *     assets: [{ url: '/model.glb', type: 'gltf' }],
 *     skipEntrance: false
 *   }"
 *   (sceneReady)="onSceneReady()"
 *   (loadingProgress)="onProgress($event)"
 *   (loadingComplete)="onComplete()">
 *   ...
 * </a3d-scene-3d>
 * ```
 */

import {
  Directive,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { SceneReadyService } from './scene-ready.service';
import { createUnifiedLoadingState } from './unified-loading-coordinator';
import {
  AssetPreloaderService,
  type PreloadState,
} from '../loaders/asset-preloader.service';
import type { SceneLoadingConfig, UnifiedLoadingState } from './types';

/**
 * SceneLoadingDirective
 *
 * Declarative directive for adding loading coordination to Scene3dComponent.
 * Automatically integrates with SceneReadyService (per-scene) and
 * AssetPreloaderService (root) to provide unified loading state.
 */
@Directive({
  selector: '[a3dSceneLoading]',
  exportAs: 'a3dSceneLoading',
  standalone: true,
})
export class SceneLoadingDirective {
  // ================================
  // Dependency Injection
  // ================================

  /**
   * SceneReadyService - optional injection (may not be provided if Scene3dComponent
   * hasn't been updated with the loading module integration)
   */
  private readonly sceneReadyService = inject(SceneReadyService, {
    optional: true,
  });

  /**
   * AssetPreloaderService - root-level service for asset loading
   */
  private readonly preloader = inject(AssetPreloaderService);

  /**
   * DestroyRef for cleanup registration
   */
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // Inputs
  // ================================

  /**
   * Configuration for scene loading coordination.
   * If undefined, directive uses defaults (no assets, no entrance skip).
   */
  public readonly loadingConfig = input<SceneLoadingConfig | undefined>(
    undefined
  );

  // ================================
  // Outputs
  // ================================

  /**
   * Emitted when scene becomes ready (renderer ready + first frame rendered).
   * Only emits if SceneReadyService is available.
   */
  public readonly sceneReady = output<void>();

  /**
   * Emitted when unified loading progress changes (0-100).
   * Includes progress from scene init, asset loading, and entrance prep phases.
   */
  public readonly loadingProgress = output<number>();

  /**
   * Emitted when all loading phases are complete.
   * Scene is ready for full interaction.
   */
  public readonly loadingComplete = output<void>();

  // ================================
  // Internal State
  // ================================

  /**
   * Preload state from AssetPreloaderService.
   * Null if no assets configured or not yet initialized.
   */
  private preloadState: PreloadState | null = null;

  /**
   * Unified loading state combining all phases.
   * Null until loading is set up.
   */
  private unifiedState: UnifiedLoadingState | null = null;

  /**
   * Track if scene ready has been emitted (emit only once).
   */
  private readonly sceneReadyEmitted = signal<boolean>(false);

  /**
   * Track if loading complete has been emitted (emit only once).
   */
  private readonly loadingCompleteEmitted = signal<boolean>(false);

  /**
   * Track last emitted progress value to avoid duplicate emissions.
   */
  private lastEmittedProgress = -1;

  // ================================
  // Constructor & Lifecycle
  // ================================

  public constructor() {
    // Effect: setup loading when config changes
    effect(() => {
      const config = this.loadingConfig();
      this.setupLoading(config);
    });

    // Effect: emit progress updates
    effect(() => {
      if (this.unifiedState) {
        const progress = this.unifiedState.progress();

        // Only emit if progress has changed
        if (progress !== this.lastEmittedProgress) {
          this.lastEmittedProgress = progress;
          this.loadingProgress.emit(progress);
        }
      }
    });

    // Effect: emit scene ready event (once)
    effect(() => {
      const isSceneReady = this.sceneReadyService?.isSceneReady();

      if (isSceneReady && !this.sceneReadyEmitted()) {
        this.sceneReadyEmitted.set(true);
        this.sceneReady.emit();
      }
    });

    // Effect: emit loading complete event (once)
    effect(() => {
      const isFullyReady = this.unifiedState?.isFullyReady();

      if (isFullyReady && !this.loadingCompleteEmitted()) {
        this.loadingCompleteEmitted.set(true);
        this.loadingComplete.emit();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  // ================================
  // Public API
  // ================================

  /**
   * Get the unified loading state for template binding.
   *
   * Returns the UnifiedLoadingState object containing signals for:
   * - progress (0-100)
   * - currentPhase ('scene-init', 'asset-loading', 'entrance-prep', 'ready')
   * - isFullyReady (boolean)
   * - errors (Error[])
   *
   * @returns UnifiedLoadingState or null if not yet initialized
   */
  public getLoadingState(): UnifiedLoadingState | null {
    return this.unifiedState;
  }

  /**
   * Get the preload state for CinematicEntranceDirective integration.
   *
   * Returns the PreloadState from AssetPreloaderService if assets were
   * configured, or null if no assets to preload.
   *
   * @returns PreloadState or null
   */
  public getPreloadState(): PreloadState | null {
    return this.preloadState;
  }

  // ================================
  // Private Methods
  // ================================

  /**
   * Setup loading coordination based on config.
   *
   * Called reactively when loadingConfig input changes.
   * Creates PreloadState and UnifiedLoadingState based on configuration.
   */
  private setupLoading(config?: SceneLoadingConfig): void {
    // Cancel previous preload if exists
    if (this.preloadState) {
      this.preloadState.cancel();
      this.preloadState = null;
    }

    // Reset emission tracking for new loading cycle
    this.sceneReadyEmitted.set(false);
    this.loadingCompleteEmitted.set(false);
    this.lastEmittedProgress = -1;

    // Start preloading if assets configured
    if (config?.assets && config.assets.length > 0) {
      this.preloadState = this.preloader.preload(config.assets);
    }

    // Create unified loading state with available signals
    this.unifiedState = createUnifiedLoadingState({
      sceneReady: this.sceneReadyService?.isSceneReady,
      preloadState: this.preloadState ?? undefined,
      skipEntrance: config?.skipEntrance ?? false,
    });
  }

  /**
   * Cleanup resources on destroy.
   *
   * Cancels any active preload operations to prevent memory leaks
   * and orphaned signal subscriptions.
   */
  private cleanup(): void {
    if (this.preloadState) {
      this.preloadState.cancel();
      this.preloadState = null;
    }
    this.unifiedState = null;
  }
}
