/**
 * TSL Procedural Texture Generators
 *
 * GPU-accelerated procedural textures using Three.js Shading Language.
 * Works on both WebGPU (WGSL) and WebGL (GLSL) through TSL auto-transpilation.
 *
 * Ported from tsl-textures library: https://github.com/boytchev/tsl-textures
 *
 * @module primitives/shaders/tsl-textures
 */

// Types and helpers
// Types and helpers
export type { TslTextureParams, TSLNode, TSLFn } from './types';
export { convertToNodes } from './types';

// Space/Sci-Fi textures (Tier 1)
export {
  tslPlanet,
  tslStars,
  tslCausticsTexture,
  tslPhotosphere,
  tslGasGiant,
} from './space';

// Natural materials (Tier 2)
export { tslMarble, tslWood, tslRust, tslConcrete } from './materials';

// Patterns (Tier 3)
export {
  tslPolkaDots,
  tslGrid,
  tslVoronoiCells,
  tslBricks,
  tslFabric,
} from './patterns';

// Shape modifiers
export { tslSupersphere, tslMelter } from './shapes';

// Organic textures
export {
  tslBrain,
  tslReticularVeins,
  tslWaterMarble,
  tslRoughClay,
} from './organic';

// BlueYard-style particles (starfield approach with coral colors + animation)
export {
  tslBlueYardParticles,
  tslBlueYardParticlesEmissive,
} from './blueyard-particles';

// Volumetric particle cloud (multi-scale particles with depth variation)
export { tslVolumetricParticleCloud } from './volumetric-particle-cloud';
