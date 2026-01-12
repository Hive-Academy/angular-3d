// @hive-academy/angular-3d - Loading module
// Route-level scene loading coordination

// Services
export { SceneReadyService } from './scene-ready.service';

// Unified Loading Coordination
export { createUnifiedLoadingState } from './unified-loading-coordinator';

// Route Guards
export {
  sceneLoadingGuard,
  type SceneLoadingGuardConfig,
} from './guards/scene-loading.guard';

// Route Resolvers
export {
  scenePreloadResolver,
  type AssetListFactory,
} from './resolvers/scene-preload.resolver';

// Components
export { LoadingOverlayComponent } from './loading-overlay.component';

// Directives
export { SceneLoadingDirective } from './scene-loading.directive';

// Types
export {
  type LoadingPhase,
  type UnifiedLoadingConfig,
  type UnifiedLoadingState,
  type SceneLoadingConfig,
} from './types';
