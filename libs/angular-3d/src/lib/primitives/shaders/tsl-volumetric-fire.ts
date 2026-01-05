/**
 * TSL Volumetric Fire Shader - Adapted from FireShaderTSL
 *
 * Complete volumetric ray marching fire implementation for spheres.
 * Based on working FireTSL example with proper coordinate transforms.
 *
 * Key features:
 * - Proper world→local space transformation
 * - Ray marching through spherical volume
 * - FBM turbulence for organic fire shapes
 * - Procedural fire texture generation
 */

import * as TSL from 'three/tsl';
import { time } from 'three/tsl';
import { Color, Matrix4, Vector3 } from 'three/webgpu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

const {
  Fn,
  Loop,
  float,
  vec2,
  vec3,
  vec4,
  int,
  abs,
  sqrt,
  dot,
  length,
  normalize,
  cameraPosition,
  positionWorld,
  mx_noise_float,
  uniform,
  max,
  min,
  pow,
  clamp,
  mix,
  smoothstep,
  select,
} = TSL;

/**
 * Turbulence function using FBM with Perlin noise (from FireShaderTSL)
 */
const turbulence3 = Fn(([p, lacunarity, gain]: [TSLNode, TSLNode, TSLNode]) => {
  const sum = float(0).toVar('turbSum');
  const freq = float(1).toVar('turbFreq');
  const amp = float(1).toVar('turbAmp');
  const pos = vec3(p).toVar('turbPos');

  Loop(int(3), () => {
    sum.addAssign(abs(mx_noise_float(pos.mul(freq))).mul(amp));
    freq.mulAssign(lacunarity);
    amp.mulAssign(gain);
  });

  return sum;
});

/**
 * Transform world position to local object space (from FireShaderTSL)
 */
const localize = Fn(([worldPos, invMatrix]: [TSLNode, TSLNode]) => {
  return invMatrix.mul(vec4(worldPos, 1.0)).xyz;
});

/**
 * Procedural sun texture sampler - PERFORMANCE OPTIMIZED
 * Creates bold sun with 4-5 large flame tendrils
 *
 * Optimizations:
 * - Single turbulence pass (not two)
 * - Lower frequency noise for bigger flame shapes
 * - Simplified core texture
 *
 * @param p - Local position (in sphere's local space)
 * @param sphereRadius - Actual sphere radius for proper scaling
 * @param noiseScale - Noise scale [x, y, z, timeSpeed]
 * @param lacunarity - FBM frequency multiplier
 * @param gain - FBM amplitude multiplier
 * @param magnitude - Turbulence intensity (higher = longer flames)
 * @param seed - Random seed for variation
 */
const samplerSphericalFire = Fn(
  ([p, sphereRadius, noiseScale, lacunarity, gain, magnitude, seed]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    // RADIAL DISTANCE from sphere center, normalized to 0-1 range
    const distFromCenter = length(p);
    const normalizedDist = distFromCenter.div(sphereRadius);

    // Animate fire - radial expansion outward over time
    const animP = vec3(p).toVar('animP');
    const timeOffset = seed.add(time).mul(noiseScale.w);

    // LOW FREQUENCY noise scaling for BIG flame shapes (fewer, larger flames)
    animP.assign(p.mul(vec3(noiseScale.x, noiseScale.y, noiseScale.z).mul(0.4)));
    // Add time-based animation (fire flows outward)
    animP.addAssign(normalize(p).mul(timeOffset.mul(0.4)));

    // ========================================
    // SINGLE TURBULENCE PASS - optimized for performance
    // Low frequency = 4-5 big flame tendrils instead of many small ones
    // ========================================
    const turbulenceValue = turbulence3(animP, lacunarity, gain);

    // ========================================
    // SIMPLE CORE TEXTURE - darker variation without extra noise
    // ========================================
    // Use existing turbulence for core texture (no extra noise call)
    const coreTexture = turbulenceValue.mul(0.3).add(0.7);

    // ========================================
    // RADIAL GRADIENT - MUCH BIGGER FLAMES
    // ========================================
    // High magnitude creates long flame tendrils
    const radialGradient = normalizedDist.add(turbulenceValue.mul(magnitude.mul(2.5)));

    // Fire intensity - small core, flames extend FAR outward
    const coreSize = float(0.25); // Very small core
    const flameReach = float(1.8); // Flames reach 1.8x radius
    const fireIntensity = smoothstep(flameReach, coreSize, radialGradient);

    // Apply core texture for variation
    const texturedIntensity = fireIntensity.mul(coreTexture);

    // Soft threshold for smooth flames
    const sunSurface = smoothstep(float(0.1), float(0.7), texturedIntensity);

    // ========================================
    // MULTI-COLOR GRADIENT (center → edge)
    // ========================================
    // Core: warm golden (not pure white)
    const coreColor = vec3(1.0, 0.92, 0.65);
    // Inner: golden yellow
    const innerColor = vec3(1.0, 0.75, 0.3);
    // Mid: deep orange
    const midColor = vec3(1.0, 0.45, 0.1);
    // Outer: red-orange for flame tips
    const outerColor = vec3(0.9, 0.2, 0.0);

    // Color based on distance - faster transition for smaller core
    const colorT = clamp(normalizedDist.mul(2.5), float(0.0), float(1.0));

    // Gradient with smaller bright core
    const color1 = mix(coreColor, innerColor, smoothstep(float(0.0), float(0.12), colorT));
    const color2 = mix(color1, midColor, smoothstep(float(0.12), float(0.35), colorT));
    const finalColor = mix(color2, outerColor, smoothstep(float(0.35), float(0.75), colorT));

    // Apply core texture darkness
    const texturedColor = finalColor.mul(coreTexture.mul(0.3).add(0.7));

    // Final colored sun
    const coloredSun = texturedColor.mul(sunSurface);

    // Alpha with extended flame fade
    const coronaFade = smoothstep(float(1.8), float(0.6), normalizedDist);
    const alpha = sunSurface.mul(coronaFade);

    return vec4(coloredSun.x, coloredSun.y, coloredSun.z, alpha);
  }
);

/**
 * Uniforms interface for volumetric fire (matching FireShaderTSL pattern)
 */
export interface VolumetricFireUniforms {
  color: TSLNode;
  invModelMatrix: TSLNode & { value: Matrix4 };
  scale: TSLNode & { value: Vector3 };
  sphereRadius: TSLNode & { value: number };
  noiseScale: TSLNode;
  magnitude: TSLNode & { value: number };
  lacunarity: TSLNode;
  gain: TSLNode & { value: number };
  seed: TSLNode & { value: number };
}

/**
 * Configuration for creating fire uniforms
 */
export interface VolumetricFireConfig {
  color?: Color | number;
  sphereRadius?: number;
  noiseScale?: [number, number, number, number];
  magnitude?: number;
  lacunarity?: number;
  gain?: number;
}

/**
 * Create uniforms for volumetric fire shader
 */
export const createVolumetricFireUniforms = (
  config: VolumetricFireConfig = {}
): VolumetricFireUniforms => {
  const colorValue =
    config.color instanceof Color ? config.color : new Color(config.color ?? 0xff6600);

  return {
    color: uniform(colorValue),
    invModelMatrix: uniform(new Matrix4()),
    scale: uniform(new Vector3(1, 1, 1)),
    sphereRadius: uniform(config.sphereRadius ?? 4.5),
    noiseScale: vec4(
      float(config.noiseScale?.[0] ?? 0.8),
      float(config.noiseScale?.[1] ?? 0.8),
      float(config.noiseScale?.[2] ?? 0.8),
      float(config.noiseScale?.[3] ?? 0.5)
    ),
    magnitude: uniform(config.magnitude ?? 0.4),
    lacunarity: uniform(config.lacunarity ?? 2.0),
    gain: uniform(config.gain ?? 0.5),
    seed: uniform(Math.random() * 19.19),
  };
};

/**
 * Create volumetric sun/fire fragment node
 *
 * Ray marching through spherical volume with corona extension.
 * The shader now generates multi-color gradient internally (sun mode).
 *
 * @param uniforms - Volumetric fire uniforms
 * @param iterations - Ray march steps (more = better quality, slower)
 * @param sunMode - If true, uses built-in sun colors. If false, tints with uniform color.
 */
export const createVolumetricFireNode = (
  uniforms: VolumetricFireUniforms,
  iterations: number = 40,
  sunMode: boolean = true
) => {
  return Fn(() => {
    const rayPos = vec3(positionWorld).toVar('rayPos');
    const rayDir = normalize(rayPos.sub(cameraPosition)).toVar('rayDir');

    // Extended diameter to include corona (15% beyond sphere)
    const coronaExtension = float(1.15);
    const extendedRadius = uniforms.sphereRadius.mul(coronaExtension);
    const diameter = extendedRadius.mul(2.0);
    const rayLen = diameter.div(float(iterations)).mul(length(uniforms.scale));

    const col = vec4(0.0).toVar('col');

    Loop(int(iterations), () => {
      rayPos.addAssign(rayDir.mul(rayLen));

      // Transform to local space (sphere centered at origin)
      const lp = localize(rayPos, uniforms.invModelMatrix).toVar('lp');

      // Sample within extended radius (includes corona)
      const distFromCenter = length(lp);
      const insideExtended = distFromCenter.lessThan(extendedRadius);

      // Sample sun/fire
      const fireSample = samplerSphericalFire(
        lp,
        uniforms.sphereRadius,
        uniforms.noiseScale,
        uniforms.lacunarity,
        uniforms.gain,
        uniforms.magnitude,
        uniforms.seed
      );

      // Accumulate within extended radius
      col.addAssign(select(insideExtended, fireSample, vec4(0.0)));
    });

    // In fire mode (not sun mode), apply color tint over the built-in colors
    // This allows customizing the fire color while sun mode uses realistic colors
    const colorVec = vec3(uniforms.color);
    const fireModeTint = sunMode ? float(0.0) : float(1.0);

    // Blend: sunMode=1 keeps original, fireMode=1 tints with uniform color
    // For sun mode, we skip tinting entirely
    // For fire mode, we multiply by the color
    const tintedR = mix(col.x, col.x.mul(colorVec.x), fireModeTint);
    const tintedG = mix(col.y, col.y.mul(colorVec.y), fireModeTint);
    const tintedB = mix(col.z, col.z.mul(colorVec.z), fireModeTint);

    col.x.assign(tintedR);
    col.y.assign(tintedG);
    col.z.assign(tintedB);

    // Clamp final color
    col.assign(clamp(col, vec4(0.0), vec4(1.0)));

    return col;
  })();
};
