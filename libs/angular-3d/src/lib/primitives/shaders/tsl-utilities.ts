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

import * as TSL from 'three/tsl';
import { Color, type UniformNode } from 'three/webgpu';

// Re-export commonly used TSL functions for convenience
const {
  Fn,
  float,
  vec3,
  vec4,
  uniform,
  mix,
  smoothstep,
  clamp,
  pow,
  sin,
  cos,
  dot,
  abs,
  normalize,
  cross,
  positionWorld,
  cameraPosition,
  normalLocal,
  // Control flow for conditional logic
  If,
  select,
  // Matrix types
  mat4,
  // Math functions
  log2,
  remap,
  min,
  max,
  add,
  sub,
  mul,
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
// Caustic Light Pattern Functions
// ============================================================================

/**
 * TSL Caustic Pattern Generator
 * Creates animated underwater-style caustic light patterns using sine wave interference.
 *
 * Generates sharp, web-like patterns of light that shimmer and move over time,
 * similar to light refracted through water.
 *
 * @param position - 2D or 3D position to sample caustic pattern at
 * @param time - Animation time value for movement
 * @param scale - Pattern scale (higher = smaller patterns)
 * @param sharpness - Power curve for contrast (2.0-4.0 typical)
 * @returns Caustic intensity value in range [0, 1]
 *
 * @example
 * ```typescript
 * const caustic = tslCaustics(positionLocal.xy, uTime, float(2.0), float(2.5));
 * material.colorNode = mix(darkColor, brightColor, caustic);
 * ```
 */
export const tslCaustics = TSLFn(
  ([position, time, scale, sharpness]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    const p = position;
    const t = time.mul(0.3);

    // Layer 1: Primary caustic waves
    const c1x = p.x.add(sin(p.y.add(t))).mul(scale);
    const c1y = p.y.add(sin(p.x.add(t.mul(0.8)))).mul(scale);
    const caustic1 = sin(c1x).mul(0.5).add(0.5);
    const caustic2 = sin(c1y).mul(0.5).add(0.5);

    // Layer 2: Secondary smaller waves for detail
    const c2x = p.x
      .mul(2.3)
      .add(sin(p.y.mul(1.7).add(t)))
      .mul(scale);
    const c2y = p.y
      .mul(2.1)
      .add(sin(p.x.mul(1.9).add(t)))
      .mul(scale);
    const caustic3 = sin(c2x).mul(0.5).add(0.5);
    const caustic4 = sin(c2y).mul(0.5).add(0.5);

    // Combine layers with multiplication for sharp bright bands
    const rawCaustic = caustic1.mul(caustic2).mul(caustic3).mul(caustic4);

    // Apply power curve for sharp contrast
    return pow(rawCaustic, sharpness);
  }
);

/**
 * TSL Volumetric Ray Intensity
 * Calculates light ray intensity at a point based on light direction and caustic pattern.
 *
 * Combines directional light influence with caustic patterns to create
 * volumetric god ray effects.
 *
 * @param position - 3D position in the volume
 * @param lightDirection - Normalized light direction vector
 * @param causticValue - Pre-calculated caustic pattern value
 * @param density - Fog/particle density for scattering
 * @returns Light ray intensity at this point
 *
 * @example
 * ```typescript
 * const caustic = tslCaustics(pos.xy, uTime, float(2.0), float(2.5));
 * const ray = tslVolumetricRay(pos, lightDir, caustic, float(0.5));
 * material.opacityNode = ray;
 * ```
 */
export const tslVolumetricRay = TSLFn(
  ([position, lightDirection, causticValue, density]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    // Calculate directional light influence
    const lightDot = dot(normalize(position), lightDirection);
    const lightInfluence = lightDot.mul(0.3).add(0.7).clamp(0, 1);

    // Combine with caustic pattern and density
    return causticValue.mul(lightInfluence).mul(density);
  }
);

// ============================================================================
// HSL Color Conversion Functions (ported from tsl-textures/tsl-utils.js)
// ============================================================================

/**
 * Helper function for HSL to RGB conversion
 * Implements the HSL to RGB algorithm component calculation
 *
 * @internal
 * @param h - Hue (0-1)
 * @param s - Saturation (0-1)
 * @param l - Lightness (0-1)
 * @param n - Component offset (0 for R, 8 for G, 4 for B)
 * @returns RGB component value
 */
const tslHslHelper = TSLFn(
  ([h, s, l, n]: [TSLNode, TSLNode, TSLNode, TSLNode]) => {
    const k = n.add(h.mul(12)).mod(12);
    const a = s.mul(min(l, sub(1, l)));
    return l.sub(a.mul(max(-1, min(min(k.sub(3), sub(9, k)), 1))));
  }
);

/**
 * TSL HSL to RGB Color Conversion
 * Converts HSL color values to RGB color values.
 *
 * Uses the standard HSL to RGB algorithm, with hue wrapping and
 * saturation/lightness clamping for robust color handling.
 *
 * @param h - Hue value (0-1, wraps around)
 * @param s - Saturation value (0-1)
 * @param l - Lightness value (0-1)
 * @returns vec3 RGB color
 *
 * @example
 * ```typescript
 * const color = tslHsl(float(0.6), float(0.8), float(0.5)); // Blue-ish color
 * material.colorNode = color;
 * ```
 */
export const tslHsl = TSLFn(([h, s, l]: [TSLNode, TSLNode, TSLNode]) => {
  // Wrap hue to 0-1 range
  const hWrapped = h.fract().add(1).fract();
  // Clamp saturation and lightness
  const sClamped = s.clamp(0, 1);
  const lClamped = l.clamp(0, 1);

  const r = tslHslHelper(hWrapped, sClamped, lClamped, 0);
  const g = tslHslHelper(hWrapped, sClamped, lClamped, 8);
  const b = tslHslHelper(hWrapped, sClamped, lClamped, 4);

  return vec3(r, g, b);
});

/**
 * TSL RGB to HSL Color Conversion
 * Converts RGB color values to HSL color values.
 *
 * Handles edge cases like achromatic colors (when min equals max)
 * and correctly calculates hue based on which RGB component is maximum.
 *
 * @param rgb - RGB color as vec3 (components 0-1)
 * @returns vec3 with (hue, saturation, lightness) in 0-1 range
 *
 * @example
 * ```typescript
 * const hsl = tslToHsl(textureColor);
 * // Modify hue: hsl.x
 * // Modify saturation: hsl.y
 * // Modify lightness: hsl.z
 * ```
 */
export const tslToHsl = TSLFn(([rgb]: [TSLNode]) => {
  const R = float(rgb.x).toVar();
  const G = float(rgb.y).toVar();
  const B = float(rgb.z).toVar();

  const mx = max(R, max(G, B)).toVar();
  const mn = min(R, min(G, B)).toVar();

  const H = float(0).toVar();
  const S = float(0).toVar();
  const L = add(mx, mn).div(2);

  If(mn.notEqual(mx), () => {
    const delta = sub(mx, mn).toVar();

    S.assign(
      select(
        L.lessThanEqual(0.5),
        delta.div(add(mn, mx)),
        delta.div(sub(2, add(mn, mx)))
      )
    );

    If(mx.equal(R), () => {
      H.assign(
        sub(G, B)
          .div(delta)
          .add(select(G.lessThanEqual(B), 6, 0))
      );
    })
      .ElseIf(mx.equal(G), () => {
        H.assign(sub(B, R).div(delta).add(2));
      })
      .Else(() => {
        H.assign(sub(R, G).div(delta).add(4));
      });

    H.divAssign(6);
  });

  return vec3(H, S, L);
});

// ============================================================================
// Spherical Coordinate Functions
// ============================================================================

/**
 * TSL Spherical Coordinate Conversion
 * Converts phi-theta angles to a point on the unit sphere.
 *
 * Uses standard spherical coordinate convention where:
 * - phi is the polar angle from the positive Y-axis (0 to PI)
 * - theta is the azimuthal angle in the XZ-plane from the positive Z-axis
 *
 * @param phi - Polar angle (radians, 0 to PI)
 * @param theta - Azimuthal angle (radians, 0 to 2*PI)
 * @returns vec3 point on unit sphere
 *
 * @example
 * ```typescript
 * // Random point distribution on sphere
 * const point = tslSpherical(float(PI * 0.5), float(PI * 0.25));
 * ```
 */
export const tslSpherical = TSLFn(([phi, theta]: [TSLNode, TSLNode]) => {
  return vec3(sin(theta).mul(sin(phi)), cos(phi), cos(theta).mul(sin(phi)));
});

// ============================================================================
// Simple Noise Functions
// ============================================================================

/**
 * TSL Simple Vector Noise
 * Fast pseudo-random noise function based on dot product with magic numbers.
 *
 * Much faster than MaterialX noise but lower quality. Useful for quick
 * randomization where visual quality isn't critical.
 *
 * @param v - Input vector (vec3)
 * @returns float noise value in range [-1, 1]
 *
 * @example
 * ```typescript
 * const noise = tslVnoise(positionLocal);
 * const randomOffset = noise.mul(0.1);
 * ```
 */
export const tslVnoise = TSLFn(([v]: [TSLNode]) => {
  return v
    .dot(vec3(12.9898, 78.233, -97.5123))
    .sin()
    .mul(43758.5453)
    .fract()
    .mul(2)
    .sub(1);
});

// ============================================================================
// Rotation Matrix Functions
// ============================================================================

/**
 * TSL X-Axis Rotation Matrix
 * Creates a 4x4 rotation matrix for rotation around the X-axis.
 *
 * @param angle - Rotation angle in radians
 * @returns mat4 rotation matrix
 *
 * @example
 * ```typescript
 * const rotatedPos = tslMatRotX(uTime.mul(0.5)).mul(vec4(position, 1)).xyz;
 * ```
 */
export const tslMatRotX = TSLFn(([angle]: [TSLNode]) => {
  const c = angle.cos().toVar();
  const s = angle.sin().toVar();

  return mat4(1, 0, 0, 0, 0, c, s, 0, 0, s.negate(), c, 0, 0, 0, 0, 1);
});

/**
 * TSL Y-Axis Rotation Matrix
 * Creates a 4x4 rotation matrix for rotation around the Y-axis.
 *
 * @param angle - Rotation angle in radians
 * @returns mat4 rotation matrix
 *
 * @example
 * ```typescript
 * const rotatedPos = tslMatRotY(uTime).mul(vec4(position, 1)).xyz;
 * ```
 */
export const tslMatRotY = TSLFn(([angle]: [TSLNode]) => {
  const c = angle.cos().toVar();
  const s = angle.sin().toVar();

  return mat4(c, 0, s.negate(), 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1);
});

/**
 * TSL Z-Axis Rotation Matrix
 * Creates a 4x4 rotation matrix for rotation around the Z-axis.
 *
 * @param angle - Rotation angle in radians
 * @returns mat4 rotation matrix
 *
 * @example
 * ```typescript
 * const rotatedPos = tslMatRotZ(float(PI / 4)).mul(vec4(position, 1)).xyz;
 * ```
 */
export const tslMatRotZ = TSLFn(([angle]: [TSLNode]) => {
  const c = angle.cos().toVar();
  const s = angle.sin().toVar();

  return mat4(c, s, 0, 0, s.negate(), c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
});

// ============================================================================
// Remapping Functions
// ============================================================================

/**
 * TSL Exponential Remap
 * Remaps a value from one range to another using exponential interpolation.
 *
 * Unlike linear remap, this preserves multiplicative relationships and is
 * useful for parameters like frequency or scale where doubling matters
 * more than absolute differences.
 *
 * @param x - Input value
 * @param fromMin - Input range minimum
 * @param fromMax - Input range maximum
 * @param toMin - Output range minimum (must be > 0)
 * @param toMax - Output range maximum (must be > 0)
 * @returns Exponentially remapped value
 *
 * @example
 * ```typescript
 * // Remap 0-1 slider to 0.1-10 frequency range with exponential scaling
 * const freq = tslRemapExp(sliderValue, float(0), float(1), float(0.1), float(10));
 * ```
 */
export const tslRemapExp = TSLFn(
  ([x, fromMin, fromMax, toMin, toMax]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    // First remap to 0-1 range
    const normalized = remap(x, fromMin, fromMax, 0, 1);
    // Apply exponential interpolation in log space
    const result = pow(
      2,
      mul(normalized, log2(toMax.div(toMin))).add(log2(toMin))
    );
    return result;
  }
);

// ============================================================================
// Quaternion and Euler Rotation Utilities
// ============================================================================

/**
 * Convert Euler XYZ angles to quaternion
 * Used internally by applyEuler for rotation calculations.
 *
 * @param eu - vec3 of Euler angles (x, y, z) in radians
 * @returns vec4 quaternion (x, y, z, w)
 */
export const tslQuaternionFromEuler = TSLFn(([eu]: [TSLNode]) => {
  const c1 = cos(eu.x.div(2));
  const c2 = cos(eu.y.div(2));
  const c3 = cos(eu.z.div(2));

  const s1 = sin(eu.x.div(2));
  const s2 = sin(eu.y.div(2));
  const s3 = sin(eu.z.div(2));

  return vec4(
    add(mul(s1, c2, c3), mul(c1, s2, s3)),
    sub(mul(c1, s2, c3), mul(s1, c2, s3)),
    add(mul(c1, c2, s3), mul(s1, s2, c3)),
    sub(mul(c1, c2, c3), mul(s1, s2, s3))
  );
});

/**
 * Apply quaternion rotation to a vector
 * Used internally by applyEuler to rotate vectors.
 *
 * @param vec - vec3 to rotate
 * @param quat - vec4 quaternion (x, y, z, w)
 * @returns vec3 rotated vector
 */
export const tslApplyQuaternion = TSLFn(([vec, quat]: [TSLNode, TSLNode]) => {
  const t = cross(quat.xyz, vec).mul(2).toVar();
  return add(vec, t.mul(quat.w), cross(quat.xyz, t));
});

/**
 * Apply Euler rotation to a vector
 * Ported from tsl-textures library.
 * Used for animated domain distortion in textures like photosphere.
 *
 * @param vec - vec3 vector to rotate
 * @param eu - vec3 Euler angles (x, y, z) in radians
 * @returns vec3 rotated vector
 *
 * @example
 * ```typescript
 * Loop(6, () => {
 *   vec.assign(tslApplyEuler(vec, pos.mul(scale)));
 *   scale.mulAssign(1.1);
 * });
 * ```
 */
export const tslApplyEuler = TSLFn(([vec, eu]: [TSLNode, TSLNode]) => {
  const quat = tslQuaternionFromEuler(eu);
  return tslApplyQuaternion(vec, quat);
});

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
 *    - tslVnoise(v) - Fast vector noise [-1, 1]
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
 * 7. Color Conversions (ported from tsl-textures):
 *    - tslHsl(h, s, l) - HSL to RGB conversion
 *    - tslToHsl(rgb) - RGB to HSL conversion
 *
 * 8. Coordinate Transformations:
 *    - tslSpherical(phi, theta) - Angles to unit sphere point
 *    - tslMatRotX(angle) - X-axis rotation matrix (mat4)
 *    - tslMatRotY(angle) - Y-axis rotation matrix (mat4)
 *    - tslMatRotZ(angle) - Z-axis rotation matrix (mat4)
 *
 * 9. Value Remapping:
 *    - tslRemapExp(x, fromMin, fromMax, toMin, toMax) - Exponential remap
 *
 * Note: The native MaterialX noise functions (nativeNoise3D, nativeFBM, etc.)
 * are recommended for all new shader development as they're GPU-optimized and
 * automatically work on both WebGPU (via WGSL) and WebGL (via GLSL) backends.
 */
