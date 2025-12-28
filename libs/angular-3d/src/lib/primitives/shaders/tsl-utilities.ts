/**
 * TSL (Three.js Shading Language) Shader Utilities
 *
 * Shared utility functions for TSL-based shaders in WebGPU renderer.
 * Provides common noise functions, domain warping, fresnel effects, and shader helpers.
 *
 * This module uses native MaterialX noise functions for GPU-optimized noise generation
 * that works on both WebGPU (via WGSL) and WebGL (via GLSL) backends.
 *
 * @example
 * ```typescript
 * import { createFogUniforms, applyFog, tslFresnel, cloudDensity } from './tsl-utilities';
 *
 * const uniforms = createFogUniforms({ color: '#4584b4', near: -100, far: 3000 });
 * const fresnel = tslFresnel(float(2.0), float(0.6), float(0.2));
 * const density = cloudDensity(position, time, float(0.5));
 * ```
 */

// Import TSL as namespace (standard pattern from Three.js examples)

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';
import { Color, type UniformNode } from 'three/webgpu';

// Re-export commonly used TSL functions for convenience
const {
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
  abs,
  normalize,
  positionWorld,
  cameraPosition,
  normalLocal,
  // MaterialX noise functions (GPU-optimized)
  mx_noise_vec3,
  mx_fractal_noise_float,
  mx_fractal_noise_vec3,
} = TSL;

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
// Noise Utility Functions
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
 * Less sophisticated than MaterialX noise but useful for simple patterns
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
 * @deprecated Use nativeFBM with MaterialX noise for better quality
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

// ============================================================================
// Native MaterialX Noise Functions (GPU-Optimized)
// ============================================================================

/**
 * Native 3D noise using MaterialX implementation
 * GPU-optimized and works on both WebGPU and WebGL backends
 *
 * @param position - 3D position to sample noise at
 * @returns vec3 noise value in range [-1, 1]
 */
export const nativeNoise3D = TSLFn(([position]: [TSLNode]) => {
  return mx_noise_vec3(position);
});

/**
 * Native Fractal Brownian Motion using MaterialX implementation
 * Multi-octave FBM noise with configurable parameters
 *
 * @param position - 3D position to sample noise at
 * @param octaves - Number of noise octaves (1-8, default 4)
 * @param lacunarity - Frequency multiplier per octave (default 2.0)
 * @param diminish - Amplitude reduction per octave (default 0.5)
 * @returns float noise value
 */
export const nativeFBM = TSLFn(
  ([position, octaves, lacunarity, diminish]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    return mx_fractal_noise_float(position, octaves, lacunarity, diminish);
  }
);

/**
 * Native FBM returning vec3 for color-based noise effects
 *
 * @param position - 3D position to sample noise at
 * @param octaves - Number of noise octaves (1-8, default 4)
 * @param lacunarity - Frequency multiplier per octave (default 2.0)
 * @param diminish - Amplitude reduction per octave (default 0.5)
 * @returns vec3 noise value
 */
export const nativeFBMVec3 = TSLFn(
  ([position, octaves, lacunarity, diminish]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    return mx_fractal_noise_vec3(position, octaves, lacunarity, diminish);
  }
);

/**
 * Domain Warping for organic cloud distortion
 * Creates tendril-like patterns by offsetting coordinates with noise
 *
 * Uses MaterialX fractal noise to warp x, y, z coordinates independently,
 * creating smooth organic distortion effects suitable for clouds and nebulae.
 *
 * @param position - Input 3D position
 * @param amount - Warp strength (0.0 - 1.0 recommended)
 * @returns Warped position vec3
 *
 * @example
 * ```typescript
 * const warpedPos = domainWarp(positionLocal, float(0.5));
 * const noise = nativeFBM(warpedPos, float(4), float(2.0), float(0.5));
 * ```
 */
export const domainWarp = TSLFn(([position, amount]: [TSLNode, TSLNode]) => {
  // Sample noise at offset positions for each axis to avoid symmetry
  const warpX = mx_fractal_noise_float(
    position.add(vec3(1.7, 9.2, 0)),
    float(3),
    float(2.0),
    float(0.5)
  );
  const warpY = mx_fractal_noise_float(
    position.add(vec3(8.3, 2.8, 0)),
    float(3),
    float(2.0),
    float(0.5)
  );
  const warpZ = mx_fractal_noise_float(
    position.add(vec3(5.1, 4.3, 0)),
    float(3),
    float(2.0),
    float(0.5)
  );

  return position.add(vec3(warpX, warpY, warpZ).mul(amount));
});

/**
 * Cloud Density with soft radial falloff
 * Used for volumetric nebula and cloud effects
 *
 * Combines domain warping with fractal noise and applies a soft radial falloff
 * to create natural-looking cloud density patterns.
 *
 * @param position - 3D position to sample density at
 * @param time - Animation time for slow movement
 * @param falloffRadius - Radius at which density falls off to zero
 * @returns Density value clamped to [0, 1]
 *
 * @example
 * ```typescript
 * const density = cloudDensity(positionLocal.mul(noiseScale()), uTime, float(0.5));
 * material.opacityNode = density.mul(baseOpacity);
 * ```
 */
export const cloudDensity = TSLFn(
  ([position, time, falloffRadius]: [TSLNode, TSLNode, TSLNode]) => {
    // Animate position slowly over time
    const animatedPos = position.add(vec3(time.mul(0.02), float(0), float(0)));

    // Apply domain warping for organic shapes
    const warped = domainWarp(animatedPos, float(0.5));

    // Sample fractal noise with 5 octaves for detailed clouds
    const noise = mx_fractal_noise_float(
      warped,
      float(5),
      float(2.0),
      float(0.5)
    );

    // Soft radial falloff from center
    const dist = position.length();
    const falloff = float(1).sub(smoothstep(float(0), falloffRadius, dist));

    // Combine noise with falloff and clamp to valid range
    return noise.mul(falloff).clamp(0, 1);
  }
);

// ============================================================================
// Lighting Effects
// ============================================================================

/**
 * Fresnel effect for rim lighting (legacy config-based version)
 * Creates a glow effect at the edges of objects
 * @deprecated Use tslFresnel for more flexible TSL-node inputs
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
 * TSL Fresnel Effect (replaces GLSL fresnel)
 * Creates rim lighting for bubble and glass effects
 *
 * Uses view direction and surface normal to calculate a rim effect
 * that's strongest at grazing angles.
 *
 * @param power - Fresnel power exponent (higher = sharper rim)
 * @param intensity - Multiply factor for the rim effect
 * @param bias - Minimum value added to the fresnel
 * @returns Fresnel value as a float node
 *
 * @example
 * ```typescript
 * const rim = tslFresnel(float(2.0), float(0.6), float(0.2));
 * material.colorNode = mix(baseColor, rimColor, rim);
 * ```
 */
export const tslFresnel = TSLFn(
  ([power, intensity, bias]: [TSLNode, TSLNode, TSLNode]) => {
    // Calculate view direction from world position to camera
    const viewDir = normalize(cameraPosition.sub(positionWorld));

    // Rim is strongest when view direction is perpendicular to normal
    const rim = float(1).sub(abs(dot(normalLocal, viewDir)));

    // Apply power curve and intensity, add bias
    return bias.add(pow(rim, power).mul(intensity));
  }
);

/**
 * TSL Rainbow Iridescence Effect
 * Creates soap-bubble color shift based on viewing angle
 *
 * Uses a sine function to create smooth rainbow color transitions
 * based on the input rim value (typically from tslFresnel).
 *
 * @param rimValue - Input value (usually from tslFresnel)
 * @param intensity - Strength of the iridescence effect
 * @returns vec3 color offset to add to base color
 *
 * @example
 * ```typescript
 * const rim = tslFresnel(float(2.0), float(0.6), float(0.2));
 * const iridescent = tslIridescence(rim, float(0.1));
 * material.colorNode = baseColor.add(iridescent);
 * ```
 */
export const tslIridescence = TSLFn(
  ([rimValue, intensity]: [TSLNode, TSLNode]) => {
    // Create rainbow effect using sine wave
    const rainbow = sin(rimValue.mul(6.28)).mul(0.5).add(0.5);

    // Return RGB with phase shifts for rainbow effect
    return vec3(
      rainbow.mul(intensity),
      rainbow.mul(intensity).mul(0.5),
      rainbow.mul(intensity).mul(1.5)
    );
  }
);

// ============================================================================
// Environment Effects
// ============================================================================

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
 * Rainbow iridescence effect for bubble materials (legacy version)
 * @deprecated Use tslIridescence for more flexible TSL-node inputs
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
 * 1. Native MaterialX Noise Functions (GPU-Optimized):
 *    - nativeNoise3D(position) - MaterialX 3D noise
 *    - nativeFBM(position, octaves, lacunarity, diminish) - Fractal noise
 *    - nativeFBMVec3(position, octaves, lacunarity, diminish) - FBM with vec3 output
 *    - domainWarp(position, amount) - Organic coordinate warping
 *    - cloudDensity(position, time, falloffRadius) - Cloud/nebula density
 *
 * 2. Legacy Noise Functions:
 *    - simpleNoise3D(position) - Basic 3D noise using sine
 *    - simpleFBM(position, octaves) - Simple FBM implementation
 *    - hash(position) - Pseudo-random hash
 *
 * 3. Lighting Effects:
 *    - tslFresnel(power, intensity, bias) - Rim lighting (TSL nodes)
 *    - tslIridescence(rimValue, intensity) - Rainbow effect (TSL nodes)
 *    - fresnel(config) - Rim lighting (config-based, deprecated)
 *    - iridescence(rimValue, intensity) - Rainbow effect (deprecated)
 *
 * 4. Environment Effects:
 *    - applyFog(color, fogColor, near, far, depth) - Distance fog
 *    - radialFalloff(uv, inner, outer) - Soft edge falloff
 *
 * 5. Uniform Factories:
 *    - createFogUniforms(config) - Fog uniform bundle
 *
 * 6. Post-processing:
 *    - clampForBloom(color, maxValue) - Prevent bloom overflow
 *
 * Note: The native MaterialX noise functions (nativeNoise3D, nativeFBM, etc.)
 * are recommended for all new shader development as they're GPU-optimized and
 * automatically work on both WebGPU (via WGSL) and WebGL (via GLSL) backends.
 */
