/**
 * Volumetric Fog Shader (TSL)
 *
 * Creates realistic volumetric fog inside a sphere using raymarching.
 * Uses 3D noise for organic density variation and accumulates opacity along view rays.
 *
 * Features:
 * - Raymarching through sphere volume
 * - 3D noise-based density field
 * - Density gradient (denser in center)
 * - Color variation based on depth
 * - Smooth opacity accumulation
 *
 * @example
 * ```typescript
 * import { tslVolumetricFog } from './tsl-volumetric-fog';
 *
 * const fogNode = tslVolumetricFog({
 *   radius: 1.0,
 *   centerColor: '#ffffff',
 *   edgeColor: '#ff8866',
 *   densityScale: 3.0,
 *   noiseScale: 2.0,
 *   steps: 32
 * });
 *
 * material.colorNode = fogNode;
 * ```
 */

import {
  Fn,
  float,
  vec3,
  vec4,
  positionLocal,
  cameraPosition,
  normalize,
  length,
  mix,
  smoothstep,
  dot,
  min,
  max,
  pow,
  sin,
  cos,
  add,
  mul,
  sub,
  select,
} from 'three/tsl';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

export interface VolumetricFogConfig {
  /** Sphere radius */
  radius?: number;
  /** Center fog color (dense areas) */
  centerColor?: string;
  /** Edge fog color (sparse areas) */
  edgeColor?: string;
  /** Density scale factor (higher = denser fog) */
  densityScale?: number;
  /** Noise scale for 3D variation */
  noiseScale?: number;
  /** Number of raymarching steps (32-64) */
  steps?: number;
  /** Animation time multiplier */
  animationSpeed?: number;
}

/**
 * 3D Simplex-like Noise
 * Simplified procedural noise for fog density variation
 */
const noise3D = Fn(([p]: [TSLNode]): TSLNode => {
  // Simple pseudo-random 3D noise using sin functions
  // This creates organic variation in fog density
  const K = vec3(127.1, 311.7, 74.7);
  const p1 = sin(dot(p, K));
  const p2 = sin(dot(p.add(vec3(1.3, 0.7, 2.1)), K));
  const p3 = sin(dot(p.add(vec3(2.7, 1.9, 0.3)), K));

  // Combine sine waves to create noise pattern
  const n = sin(p1.mul(43758.5453).add(p2.mul(12345.6789)).add(p3.mul(98765.4321)));
  return n.mul(0.5).add(0.5); // Remap to 0-1 range
});

/**
 * Fractal Brownian Motion (FBM) Noise
 * Layered noise for more detailed density variation
 */
const fbm = Fn(([p, octaves]: [TSLNode, TSLNode]): TSLNode => {
  const value = float(0).toVar();
  const amplitude = float(0.5).toVar();
  const frequency = float(1.0).toVar();
  const pos = p.toVar();

  // Layer multiple octaves of noise
  // Each octave adds finer detail at half the amplitude
  for (let i = 0; i < 3; i++) {
    value.addAssign(noise3D(pos.mul(frequency)).mul(amplitude));
    pos.mulAssign(2.0);
    amplitude.mulAssign(0.5);
  }

  return value;
});

/**
 * Sphere SDF - Signed distance to sphere surface
 */
const sphereSDF = Fn(([p, radius]: [TSLNode, TSLNode]): TSLNode => {
  return length(p).sub(radius);
});

/**
 * Raymarch through sphere volume accumulating fog density
 */
const raymarchFog = Fn(
  ([rayOrigin, rayDir, sphereRadius, densityScale, noiseScale, maxSteps]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]): TSLNode => {
    const accumulatedDensity = float(0).toVar();
    const t = float(0).toVar();
    const stepSize = sphereRadius.mul(2.0).div(maxSteps); // Adaptive step size

    // March through the sphere volume
    for (let i = 0; i < 64; i++) {
      // Early exit if we've reached max steps
      const shouldContinue = float(i).lessThan(maxSteps);

      // Current position along ray
      const pos = rayOrigin.add(rayDir.mul(t));

      // Distance from sphere center
      const distFromCenter = length(pos);

      // Check if inside sphere
      const insideSphere = distFromCenter.lessThan(sphereRadius);

      // Density gradient (denser in center, sparser at edges)
      // Use power function for smooth falloff
      const normalizedDist = distFromCenter.div(sphereRadius); // 0 (center) to 1 (edge)
      const densityGradient = pow(float(1.0).sub(normalizedDist), float(2.5)); // Quadratic falloff

      // Sample 3D noise for organic variation
      const noiseDensity = fbm(pos.mul(noiseScale), float(3));

      // Combine gradient and noise
      const localDensity = densityGradient.mul(noiseDensity).mul(densityScale);

      // Accumulate density only if inside sphere and should continue
      const contribution = localDensity.mul(stepSize).mul(0.1); // Scale contribution
      const validContribution = select(shouldContinue.and(insideSphere), contribution, float(0));
      accumulatedDensity.addAssign(validContribution);

      // Advance ray
      t.addAssign(stepSize);

      // Early exit if density saturates or exited sphere
      const saturated = accumulatedDensity.greaterThan(1.0);
      const exitedSphere = distFromCenter.greaterThan(sphereRadius.mul(1.1));
      // Break not available in TSL, so we just stop accumulating
    }

    // Clamp accumulated density to valid range
    return accumulatedDensity.clamp(0.0, 1.0);
  }
);

/**
 * Create volumetric fog material node
 */
export const tslVolumetricFog = (config: VolumetricFogConfig = {}): TSLNode => {
  const {
    radius = 1.0,
    centerColor = '#ffffff',
    edgeColor = '#ff8866',
    densityScale = 3.0,
    noiseScale = 2.0,
    steps = 32,
    animationSpeed = 0.3,
  } = config;

  // Convert hex colors to vec3
  const parseColor = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return [r, g, b];
  };

  const [cr, cg, cb] = parseColor(centerColor);
  const [er, eg, eb] = parseColor(edgeColor);

  return Fn((): TSLNode => {
    // Ray origin (camera position in local space)
    const rayOrigin = cameraPosition;

    // Ray direction (from camera to fragment)
    const rayDir = normalize(positionLocal.sub(cameraPosition));

    // Raymarch through volume
    const density = raymarchFog(
      rayOrigin,
      rayDir,
      float(radius),
      float(densityScale),
      float(noiseScale),
      float(steps)
    );

    // Calculate color based on density (denser = center color, sparser = edge color)
    const fogColorCenter = vec3(cr, cg, cb);
    const fogColorEdge = vec3(er, eg, eb);
    const fogColor = mix(fogColorEdge, fogColorCenter, density);

    // Return final color with accumulated density as alpha
    return vec4(fogColor, density);
  })();
};
