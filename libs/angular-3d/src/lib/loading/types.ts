/**
 * Loading Module Types - Shared interfaces for route-level scene loading coordination
 *
 * These types define the contract for the unified loading system that coordinates
 * scene initialization, asset preloading, and entrance animations.
 *
 * All interfaces are exported as types for tree-shaking optimization.
 */

import type { Signal } from '@angular/core';
import type { PreloadState } from '../loaders/asset-preloader.service';
import type { AssetDefinition } from '../loaders/asset-preloader.service';

/**
 * Loading phases in the unified loading flow.
 *
 * Phases progress in order:
 * 1. 'scene-init' - Waiting for renderer initialization and first frame
 * 2. 'asset-loading' - Preloading assets (GLTF, textures, etc.)
 * 3. 'entrance-prep' - Waiting for entrance animation to start
 * 4. 'ready' - All phases complete, scene fully interactive
 */
export type LoadingPhase =
  | 'scene-init'
  | 'asset-loading'
  | 'entrance-prep'
  | 'ready';

/**
 * Configuration for creating a unified loading state.
 *
 * All fields are optional - missing phases will be skipped in progress calculation.
 *
 * @example
 * ```typescript
 * // Full configuration
 * const config: UnifiedLoadingConfig = {
 *   sceneReady: sceneReadyService.isSceneReady,
 *   preloadState: preloader.preload([...]),
 *   entranceStarted: entranceStartedSignal,
 *   skipEntrance: false
 * };
 *
 * // Minimal configuration (scene init only)
 * const minimalConfig: UnifiedLoadingConfig = {
 *   sceneReady: sceneReadyService.isSceneReady
 * };
 * ```
 */
export interface UnifiedLoadingConfig {
  /**
   * Signal indicating scene is ready (from SceneReadyService.isSceneReady).
   * If not provided, scene init phase is skipped (treated as immediately ready).
   */
  sceneReady?: Signal<boolean>;

  /**
   * PreloadState from AssetPreloaderService.preload().
   * If not provided, asset loading phase is skipped.
   */
  preloadState?: PreloadState;

  /**
   * Signal indicating entrance animation has started.
   * If not provided and skipEntrance is false, entrance phase waits indefinitely.
   */
  entranceStarted?: Signal<boolean>;

  /**
   * Skip the entrance preparation phase entirely.
   * Set to true for scenes without CinematicEntranceDirective.
   * Default: false
   */
  skipEntrance?: boolean;
}

/**
 * Unified loading state returned from createUnifiedLoadingState().
 *
 * Provides reactive signals for tracking loading progress across all phases.
 * All signals are readonly - internal state is managed by the coordinator.
 *
 * @example
 * ```typescript
 * const state = createUnifiedLoadingState(config);
 *
 * // Track in template
 * @if (!state.isFullyReady()) {
 *   <div>Loading: {{ state.progress() }}%</div>
 *   <div>Phase: {{ state.currentPhase() }}</div>
 * }
 *
 * // React to completion
 * effect(() => {
 *   if (state.isFullyReady()) {
 *     console.log('All loading phases complete!');
 *   }
 * });
 * ```
 */
export interface UnifiedLoadingState {
  /**
   * Combined progress across all phases (0-100).
   * Progress is weighted based on which phases are configured:
   * - scene-init: ~33% (if sceneReady provided)
   * - asset-loading: ~33% (if preloadState provided)
   * - entrance-prep: ~34% (if not skipEntrance)
   */
  readonly progress: Signal<number>;

  /**
   * Current loading phase.
   * Progresses through: 'scene-init' -> 'asset-loading' -> 'entrance-prep' -> 'ready'
   */
  readonly currentPhase: Signal<LoadingPhase>;

  /**
   * True when all configured phases are complete.
   * Equivalent to currentPhase() === 'ready'.
   */
  readonly isFullyReady: Signal<boolean>;

  /**
   * Aggregated errors from all phases.
   * Currently only collects errors from preloadState (asset loading).
   */
  readonly errors: Signal<Error[]>;
}

/**
 * Configuration for SceneLoadingDirective.
 *
 * Provides declarative control over the loading coordination
 * when applied to a Scene3dComponent.
 *
 * @example
 * ```html
 * <a3d-scene-3d
 *   a3dSceneLoading
 *   [loadingConfig]="{
 *     assets: [{ url: '/model.glb', type: 'gltf' }],
 *     skipEntrance: false,
 *     timeout: 10000
 *   }">
 * </a3d-scene-3d>
 * ```
 */
export interface SceneLoadingConfig {
  /**
   * Assets to preload before scene is considered ready.
   * Passed to AssetPreloaderService.preload().
   */
  assets?: AssetDefinition[];

  /**
   * Whether to show a built-in loading overlay.
   * Default: false (user provides their own overlay)
   */
  showOverlay?: boolean;

  /**
   * Configuration for the built-in overlay (if showOverlay is true).
   */
  overlayConfig?: {
    /** Use fixed positioning (fullscreen) vs absolute (container) */
    fullscreen?: boolean;
    /** Show progress percentage */
    showProgress?: boolean;
    /** Show current phase text */
    showPhase?: boolean;
    /** Duration of fade-out animation in ms */
    fadeOutDuration?: number;
  };

  /**
   * Skip the entrance preparation phase.
   * Set to true if not using CinematicEntranceDirective.
   * Default: false
   */
  skipEntrance?: boolean;

  /**
   * Timeout in milliseconds for scene initialization.
   * If exceeded, loading will proceed anyway (fail-open).
   * Default: 10000 (10 seconds)
   */
  timeout?: number;
}
