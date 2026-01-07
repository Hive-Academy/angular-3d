// @hive-academy/angular-3d - Loading module
// Route-level scene loading coordination

// Services
export { SceneReadyService } from './scene-ready.service';

// Unified Loading Coordination
export { createUnifiedLoadingState } from './unified-loading-coordinator';

// Types
export {
  type LoadingPhase,
  type UnifiedLoadingConfig,
  type UnifiedLoadingState,
  type SceneLoadingConfig,
} from './types';
