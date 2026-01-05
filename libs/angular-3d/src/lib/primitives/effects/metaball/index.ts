// Metaball Module Public API
// Compositional metaball system with flexible positioning

// Components
export { MetaballSceneComponent } from './metaball-scene.component';
export { MetaballSphereComponent } from './metaball-sphere.component';
export type { MetaballOrbitConfig } from './metaball-sphere.component';
export { MetaballCursorComponent } from './metaball-cursor.component';

// Types and Presets
export type {
  MetaballPreset,
  MetaballPresetConfig,
  MetaballPositionPreset,
} from './presets';
export {
  POSITION_PRESET_COORDS,
  createMetaballPresets,
  getPresetBackgroundHex,
  getPresetLightColor,
} from './presets';

// Services
export { MouseTrackerService } from './mouse-tracker.service';

// TSL Utilities (for advanced customization)
export {
  getTSLFunctions,
  tslSphereSDF,
  tslSmin,
  createScreenToWorldFn,
  screenToWorldJS,
} from './tsl-metaball-sdf';

export {
  createCalcNormalFn,
  createAmbientOcclusionFn,
  createCursorGlowFn,
  createSoftShadowFn,
} from './tsl-metaball-lighting';
