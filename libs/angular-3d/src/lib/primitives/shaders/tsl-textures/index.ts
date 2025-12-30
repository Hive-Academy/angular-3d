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
} from './space';

// Natural materials (Tier 2)
export { tslMarble, tslWood, tslRust } from './materials';

// Patterns (Tier 3)
export { tslPolkaDots, tslGrid, tslVoronoiCells, tslBricks } from './patterns';

// Shape modifiers
export { tslSupersphere, tslMelter } from './shapes';

// Organic textures
export {
  tslBrain,
  tslReticularVeins,
  tslWaterMarble,
  tslRoughClay,
} from './organic';
