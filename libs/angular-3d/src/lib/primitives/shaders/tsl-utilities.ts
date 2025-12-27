/**
 * TSL (Three.js Shading Language) Shader Utilities
 *
 * Shared utility functions for TSL-based shaders in WebGPU renderer.
 * Provides common noise functions, domain warping, and shader helpers.
 *
 * Note: These are utility functions that can be used with NodeMaterial
 * for simpler shaders. Complex shaders (like nebula-volumetric) may still
 * use GLSL ShaderMaterial with WebGPU's fallback mechanism.
 *
 * @example
 * ```typescript
 * import { createFogUniforms, applyFogToColor } from './tsl-utilities';
 *
 * const uniforms = createFogUniforms({ color: '#4584b4', near: -100, far: 3000 });
 * material.colorNode = applyFogToColor(baseColor, uniforms);
 * ```
 */

import {
  Fn,
  float,
  vec3,
  uniform,
  mix,
  smoothstep,
  clamp,
  pow,
  sin,
  dot,
  normalize,
  positionWorld,
  cameraPosition,
  normalLocal,
} from 'three/tsl';
import { Color, type UniformNode } from 'three/webgpu';

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// TSL Fn helper with proper typing to avoid arg type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSLFn = Fn as any;

// ============================================================================
// Type Definitions
// ============================================================================

export interface FogUniforms {
  fogColor: UniformNode<Color>;
  fogNear: UniformNode<number>;
  fogFar: UniformNode<number>;
}

export interface FogConfig {
  color: string | number;
  near: number;
  far: number;
}

export interface FresnelConfig {
  power: number;
  intensity: number;
  bias: number;
}

// ============================================================================
// Uniform Factory Functions
// ============================================================================

/**
 * Creates fog uniforms for use in TSL shaders
 */
export function createFogUniforms(config: FogConfig): FogUniforms {
  return {
    fogColor: uniform(new Color(config.color)),
    fogNear: uniform(float(config.near)),
    fogFar: uniform(float(config.far)),
  };
}

// ============================================================================
// TSL Shader Functions
// ============================================================================

/**
 * Simple pseudo-random function for TSL
 * Generates a pseudo-random value based on input position
 */
export const hash = TSLFn(([p]: [TSLNode]) => {
  const x = dot(p, vec3(127.1, 311.7, 74.7));
  return sin(x).mul(43758.5453123).fract();
});

/**
 * Simple 3D noise function using sine waves
 * Less sophisticated than Simplex noise but works in TSL
 */
export const simpleNoise3D = TSLFn(([p]: [TSLNode]) => {
  const i = p.floor();
  const f = p.fract();

  // Smooth interpolation
  const u = f.mul(f).mul(float(3.0).sub(f.mul(2.0)));

  // Corner noise values using hash
  const n000 = hash(i);
  const n100 = hash(i.add(vec3(1, 0, 0)));
  const n010 = hash(i.add(vec3(0, 1, 0)));
  const n110 = hash(i.add(vec3(1, 1, 0)));
  const n001 = hash(i.add(vec3(0, 0, 1)));
  const n101 = hash(i.add(vec3(1, 0, 1)));
  const n011 = hash(i.add(vec3(0, 1, 1)));
  const n111 = hash(i.add(vec3(1, 1, 1)));

  // Trilinear interpolation
  const nx00 = mix(n000, n100, u.x);
  const nx10 = mix(n010, n110, u.x);
  const nx01 = mix(n001, n101, u.x);
  const nx11 = mix(n011, n111, u.x);

  const nxy0 = mix(nx00, nx10, u.y);
  const nxy1 = mix(nx01, nx11, u.y);

  return mix(nxy0, nxy1, u.z);
});

/**
 * Fractal Brownian Motion using simple noise
 * Creates organic, cloud-like patterns
 */
export const simpleFBM = TSLFn(([p, octaves]: [TSLNode, number]) => {
  // Build up the FBM result using TSL operations
  // Using explicit octave unrolling for TSL compatibility
  const n1 = simpleNoise3D(p).mul(0.5);
  const n2 = simpleNoise3D(p.mul(2)).mul(0.25);
  const n3 = simpleNoise3D(p.mul(4)).mul(0.125);
  const n4 = simpleNoise3D(p.mul(8)).mul(0.0625);

  // Combine based on octave count
  if (octaves <= 1) return n1;
  if (octaves <= 2) return n1.add(n2);
  if (octaves <= 3) return n1.add(n2).add(n3);
  return n1.add(n2).add(n3).add(n4);
});

/**
 * Fresnel effect for rim lighting
 * Creates a glow effect at the edges of objects
 */
export const fresnel = TSLFn(
  ([config]: [{ power: number; intensity: number; bias: number }]) => {
    const viewDir = normalize(positionWorld.sub(cameraPosition));
    const dotProduct = dot(viewDir, normalLocal);
    const fresnelValue = pow(float(1).add(dotProduct), config.power);
    return float(config.bias).add(fresnelValue.mul(config.intensity));
  }
);

/**
 * Apply fog to a color based on depth
 */
export const applyFog = TSLFn(
  ([inputColor, fogColor, fogNear, fogFar, depth]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    const fogFactor = smoothstep(fogNear, fogFar, depth);
    return mix(inputColor, fogColor, fogFactor);
  }
);

/**
 * Smooth radial falloff for soft edges
 * Used for nebula and cloud effects
 */
export const radialFalloff = TSLFn(
  ([uv, innerRadius, outerRadius]: [TSLNode, TSLNode, TSLNode]) => {
    const centered = uv.sub(vec3(0.5, 0.5, 0));
    const dist = centered.length();
    return float(1).sub(smoothstep(innerRadius, outerRadius, dist));
  }
);

/**
 * Rainbow iridescence effect for bubble materials
 */
export const iridescence = TSLFn(([rimValue, intensity]: [TSLNode, number]) => {
  const rainbow = sin(rimValue.mul(6.28)).mul(0.5).add(0.5);
  return vec3(
    rainbow.mul(intensity),
    rainbow.mul(intensity * 0.5),
    rainbow.mul(intensity * 1.5)
  );
});

/**
 * Clamp color to prevent bloom on clouds
 */
export const clampForBloom = TSLFn(([color, maxValue]: [TSLNode, number]) => {
  const r = clamp(color.x, float(0), float(maxValue));
  const g = clamp(color.y, float(0), float(maxValue));
  const b = clamp(color.z, float(0), float(maxValue));
  return vec3(r, g, b);
});

// ============================================================================
// Export Documentation
// ============================================================================

/**
 * TSL Utilities Quick Reference:
 *
 * 1. Noise Functions:
 *    - simpleNoise3D(position) - Basic 3D noise
 *    - simpleFBM(position, octaves) - Fractal noise
 *    - hash(position) - Pseudo-random hash
 *
 * 2. Lighting Effects:
 *    - fresnel(config) - Rim lighting
 *    - iridescence(rimValue, intensity) - Rainbow effect
 *
 * 3. Environment Effects:
 *    - applyFog(color, fogColor, near, far, depth) - Distance fog
 *    - radialFalloff(uv, inner, outer) - Soft edge falloff
 *
 * 4. Uniform Factories:
 *    - createFogUniforms(config) - Fog uniform bundle
 *
 * 5. Post-processing:
 *    - clampForBloom(color, maxValue) - Prevent bloom overflow
 *
 * Note: For complex shaders like nebula-volumetric with Simplex noise,
 * domain warping, and multi-octave FBM, the GLSL ShaderMaterial approach
 * with WebGPU fallback is recommended for visual quality parity.
 */
