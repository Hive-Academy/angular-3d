/**
 * Unified Loading Coordinator - Multi-phase progress aggregation
 *
 * Factory function that creates a unified loading state combining:
 * - Scene initialization (WebGPU/WebGL renderer ready, first frame rendered)
 * - Asset preloading (GLTF models, textures)
 * - Entrance animation preparation
 *
 * Each phase contributes to overall progress based on dynamic weights.
 * Missing phases are automatically skipped in the calculation.
 *
 * @example
 * ```typescript
 * // Full configuration with all phases
 * const state = createUnifiedLoadingState({
 *   sceneReady: sceneReadyService.isSceneReady,
 *   preloadState: preloader.preload([...]),
 *   entranceStarted: entranceSignal,
 *   skipEntrance: false
 * });
 *
 * // Minimal configuration (scene init only)
 * const minimalState = createUnifiedLoadingState({
 *   sceneReady: sceneReadyService.isSceneReady,
 *   skipEntrance: true
 * });
 *
 * // No configuration (immediately ready)
 * const emptyState = createUnifiedLoadingState({});
 * ```
 */

import { computed } from '@angular/core';
import type {
  LoadingPhase,
  UnifiedLoadingConfig,
  UnifiedLoadingState,
} from './types';

/**
 * Internal interface for phase weight configuration
 */
interface PhaseWeights {
  sceneInit: number;
  assetLoading: number;
  entrancePrep: number;
}

/**
 * Calculate dynamic phase weights based on which phases are configured.
 *
 * The total weight always equals 100. Weights are distributed proportionally
 * among configured phases:
 * - All 3 phases: 33/33/34
 * - 2 phases: 50/50
 * - 1 phase: 100
 * - No phases: all zero (immediately ready)
 *
 * @param config - Unified loading configuration
 * @returns Object with weights for each phase
 */
function calculatePhaseWeights(config: UnifiedLoadingConfig): PhaseWeights {
  const hasScenePhase = config.sceneReady !== undefined;
  const hasAssetPhase = config.preloadState !== undefined;
  const hasEntrancePhase = !config.skipEntrance;

  const phaseCount = [hasScenePhase, hasAssetPhase, hasEntrancePhase].filter(
    Boolean
  ).length;

  // No phases configured - return zeros (will be immediately ready)
  if (phaseCount === 0) {
    return { sceneInit: 0, assetLoading: 0, entrancePrep: 0 };
  }

  // Calculate per-phase weight with rounding to ensure total is 100
  const baseWeight = Math.floor(100 / phaseCount);
  const remainder = 100 - baseWeight * phaseCount;

  // Distribute weights to configured phases
  let sceneInit = 0;
  let assetLoading = 0;
  let entrancePrep = 0;
  let remainderAssigned = false;

  if (hasScenePhase) {
    sceneInit = baseWeight;
    if (!remainderAssigned && remainder > 0) {
      sceneInit += remainder;
      remainderAssigned = true;
    }
  }

  if (hasAssetPhase) {
    assetLoading = baseWeight;
    if (!remainderAssigned && remainder > 0) {
      assetLoading += remainder;
      remainderAssigned = true;
    }
  }

  if (hasEntrancePhase) {
    entrancePrep = baseWeight;
    if (!remainderAssigned && remainder > 0) {
      entrancePrep += remainder;
      // remainderAssigned = true; // Not needed at end
    }
  }

  return { sceneInit, assetLoading, entrancePrep };
}

/**
 * Create a unified loading state from multiple loading signals.
 *
 * Factory function pattern (not a service) that creates computed signals
 * for tracking loading progress across multiple phases.
 *
 * Pattern source: libs/angular-3d/src/lib/loaders/asset-preloader.service.ts:152-239
 *
 * @param config - Configuration specifying which phases to track
 * @returns UnifiedLoadingState with reactive signals
 *
 * @remarks
 * Phase behavior:
 * - If sceneReady not provided, scene init phase is skipped
 * - If preloadState not provided, asset loading phase is skipped
 * - If skipEntrance is true, entrance phase is skipped
 * - If no phases configured, returns immediately ready state (progress: 100)
 *
 * Error aggregation:
 * - Only preloadState produces errors (scene init doesn't produce errors)
 * - Errors from preloadState are passed through to the errors signal
 *
 * @example
 * ```typescript
 * // Create unified state
 * const state = createUnifiedLoadingState({
 *   sceneReady: sceneReadyService.isSceneReady,
 *   preloadState: preloadState,
 *   skipEntrance: false
 * });
 *
 * // Use in template
 * @if (!state.isFullyReady()) {
 *   <loading-overlay [progress]="state.progress()" [phase]="state.currentPhase()" />
 * }
 *
 * // React to errors
 * effect(() => {
 *   const errors = state.errors();
 *   if (errors.length > 0) {
 *     console.error('Loading errors:', errors);
 *   }
 * });
 * ```
 */
export function createUnifiedLoadingState(
  config: UnifiedLoadingConfig
): UnifiedLoadingState {
  // Calculate dynamic weights based on configured phases
  const weights = calculatePhaseWeights(config);

  // Computed: current phase based on signal states
  const currentPhase = computed<LoadingPhase>(() => {
    // Phase 1: Scene initialization
    // If sceneReady signal provided, check its value; otherwise treat as ready
    const sceneReady = config.sceneReady?.() ?? true;
    if (!sceneReady) {
      return 'scene-init';
    }

    // Phase 2: Asset loading
    // If preloadState provided, check its isReady signal; otherwise treat as ready
    const assetsReady = config.preloadState?.isReady() ?? true;
    if (!assetsReady) {
      return 'asset-loading';
    }

    // Phase 3: Entrance preparation
    // If skipEntrance is true, skip this phase
    // If entranceStarted signal provided, check its value; otherwise treat as ready
    const entranceStarted =
      config.skipEntrance || (config.entranceStarted?.() ?? true);
    if (!entranceStarted) {
      return 'entrance-prep';
    }

    // All phases complete
    return 'ready';
  });

  // Computed: unified progress (0-100)
  const progress = computed(() => {
    const phase = currentPhase();

    // If ready, progress is 100
    if (phase === 'ready') {
      return 100;
    }

    // Calculate cumulative progress based on completed phases
    let cumulativeProgress = 0;

    // Phase 1: Scene initialization
    if (phase === 'scene-init') {
      // Scene init phase doesn't have granular progress
      // Return 0 until scene is ready
      return 0;
    }

    // Scene init phase is complete, add its weight
    cumulativeProgress += weights.sceneInit;

    // Phase 2: Asset loading
    if (phase === 'asset-loading') {
      // Get granular progress from preloadState
      const assetProgress = config.preloadState?.progress() ?? 100;
      // Map asset progress (0-100) to the asset loading weight
      const phaseContribution = (assetProgress / 100) * weights.assetLoading;
      return Math.round(cumulativeProgress + phaseContribution);
    }

    // Asset loading phase is complete, add its weight
    cumulativeProgress += weights.assetLoading;

    // Phase 3: Entrance preparation
    if (phase === 'entrance-prep') {
      // Entrance prep doesn't have granular progress
      // Return cumulative progress from completed phases
      return Math.round(cumulativeProgress);
    }

    // Should not reach here, but return cumulative progress as fallback
    return Math.round(cumulativeProgress);
  });

  // Computed: fully ready state
  const isFullyReady = computed(() => currentPhase() === 'ready');

  // Computed: aggregated errors
  // Only preloadState produces errors (scene init doesn't produce errors)
  const errors = computed<Error[]>(() => {
    return config.preloadState?.errors() ?? [];
  });

  return {
    progress,
    currentPhase,
    isFullyReady,
    errors,
  };
}
