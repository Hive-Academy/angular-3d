/**
 * Angular-3D TSL Shader Utilities
 *
 * This module exports shared TSL (Three.js Shading Language) utilities
 * for use with WebGPU NodeMaterial shaders.
 *
 * The utilities provide native MaterialX noise functions, domain warping,
 * fresnel effects, and other shader helpers that work on both WebGPU
 * (via WGSL) and WebGL (via GLSL) backends through TSL's auto-transpilation.
 *
 * @module primitives/shaders
 */

export {
  // Uniform factories
  createFogUniforms,

  // Types
  type FogUniforms,
  type FogConfig,
  type FresnelConfig,

  // Legacy Noise Functions (simple implementations)
  hash,
  simpleNoise3D,
  simpleFBM,

  // Native MaterialX Noise Functions (GPU-Optimized)
  nativeNoise3D,
  nativeFBM,
  nativeFBMVec3,
  domainWarp,
  cloudDensity,

  // TSL Lighting Effects (modern, TSL-node inputs)
  tslFresnel,
  tslIridescence,

  // Legacy Lighting Effects (config-based, deprecated)
  fresnel,
  iridescence,

  // Environment Effects
  applyFog,
  radialFalloff,
  clampForBloom,

  // Caustic Light Patterns
  tslCaustics,
  tslVolumetricRay,
} from './tsl-utilities';

export {
  // Constants
  RAY_MARCH_EPSILON,
  RAY_MARCH_MAX_DIST,

  // Signed Distance Functions (SDFs)
  tslSphereDistance,
  tslSmoothUnion,

  // Ray Marching Core
  tslRayMarch,

  // Surface Normals
  tslNormal,

  // Lighting Effects for Ray Marched Surfaces
  tslAmbientOcclusion,
  tslSoftShadow,
} from './tsl-raymarching';

// TSL Procedural Textures
export {
  // Types and helpers
  type TslTextureParams,
  type TSLNode,
  convertToNodes,

  // Space/Sci-Fi textures
  tslPlanet,
  tslStars,
  tslCausticsTexture,
  tslPhotosphere,

  // Natural materials
  tslMarble,
  tslWood,
  tslRust,

  // Patterns
  tslPolkaDots,
  tslGrid,
  tslVoronoiCells,
  tslBricks,

  // Shape modifiers
  tslSupersphere,
  tslMelter,

  // Organic textures
  tslBrain,
  tslReticularVeins,
  tslWaterMarble,
  tslRoughClay,
} from './tsl-textures';
