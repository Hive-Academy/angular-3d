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
 * Procedural sun texture sampler with multi-color gradient
 * Creates realistic sun surface with granulation and color temperature gradient
 *
 * @param p - Local position (in sphere's local space)
 * @param sphereRadius - Actual sphere radius for proper scaling
 * @param noiseScale - Noise scale [x, y, z, timeSpeed]
 * @param lacunarity - FBM frequency multiplier
 * @param gain - FBM amplitude multiplier
 * @param magnitude - Turbulence intensity
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

    // Apply noise scaling
    animP.assign(p.mul(vec3(noiseScale.x, noiseScale.y, noiseScale.z)));
    // Add time-based animation (fire flows outward)
    animP.addAssign(normalize(p).mul(timeOffset.mul(0.5)));

    // Sample primary turbulence for flame shapes
    const turbulenceValue = turbulence3(animP, lacunarity, gain);

    // Sample secondary noise for surface granulation (higher frequency)
    const granulationP = p.mul(vec3(2.5, 2.5, 2.5)).add(time.mul(0.1));
    const granulation = mx_noise_float(granulationP).mul(0.15).add(0.85);

    // RADIAL GRADIENT with turbulence for organic edge
    const radialGradient = normalizedDist.add(turbulenceValue.mul(magnitude));

    // Sun fills entire sphere with soft corona edge
    // Fire extends to 95% of radius with soft falloff beyond
    const fireIntensity = smoothstep(float(1.1), float(0.0), radialGradient);

    // Apply granulation for mottled surface texture
    const texturedIntensity = fireIntensity.mul(granulation);

    // Soft threshold for continuous sun surface (not flames with gaps)
    const sunSurface = smoothstep(float(0.1), float(0.6), texturedIntensity);

    // ========================================
    // MULTI-COLOR GRADIENT (center → edge)
    // Based on sun's temperature gradient
    // ========================================
    // Core: bright yellow-white (6000K)
    const coreColor = vec3(1.0, 1.0, 0.85);
    // Inner: golden yellow (5500K)
    const innerColor = vec3(1.0, 0.85, 0.4);
    // Mid: orange (5000K)
    const midColor = vec3(1.0, 0.55, 0.1);
    // Outer: red-orange (4500K) - corona edge
    const outerColor = vec3(0.9, 0.25, 0.0);

    // Create smooth color transitions based on distance from center
    const colorT = clamp(normalizedDist.mul(1.2), float(0.0), float(1.0));

    // 4-stop gradient using nested mix
    const color1 = mix(coreColor, innerColor, smoothstep(float(0.0), float(0.3), colorT));
    const color2 = mix(color1, midColor, smoothstep(float(0.3), float(0.6), colorT));
    const finalColor = mix(color2, outerColor, smoothstep(float(0.6), float(1.0), colorT));

    // Apply intensity to color
    const coloredSun = finalColor.mul(sunSurface);

    // Alpha: sun surface with soft corona fade
    // Corona extends slightly beyond sphere (up to 1.15x radius)
    const coronaFade = smoothstep(float(1.15), float(0.8), normalizedDist);
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
