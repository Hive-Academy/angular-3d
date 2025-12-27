/**
 * Angular-3D TSL Shader Utilities
 *
 * This module exports shared TSL (Three.js Shading Language) utilities
 * for use with WebGPU NodeMaterial shaders.
 *
 * Note on Complex Shaders:
 * Components like nebula-volumetric and cloud-layer use GLSL ShaderMaterial
 * with WebGPU's automatic fallback mechanism. This is intentional because:
 *
 * 1. Their shaders contain sophisticated algorithms (Simplex noise, FBM, domain warping)
 *    that don't have direct TSL equivalents with visual parity
 * 2. The WebGPU renderer automatically handles GLSL shaders via fallback
 * 3. This approach maintains visual quality while benefiting from WebGPU's
 *    performance improvements elsewhere in the rendering pipeline
 *
 * For simpler shader needs, use the TSL utilities exported here.
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

  // TSL Functions
  hash,
  simpleNoise3D,
  simpleFBM,
  fresnel,
  applyFog,
  radialFalloff,
  iridescence,
  clampForBloom,
} from './tsl-utilities';
