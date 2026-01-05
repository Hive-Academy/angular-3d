/**
 * TSL Marble Raymarching Utilities
 *
 * GPU-accelerated volumetric marble effects using Three.js Shading Language.
 * Creates animated fake volume inside a glossy glass sphere.
 *
 * Based on the Codrops "Magical Marbles" technique, ported to TSL for
 * WebGPU-compatible MeshStandardNodeMaterial.
 *
 * Features:
 * - Raymarched volumetric interior with animated displacement
 * - Configurable two-color gradient based on accumulated volume
 * - Glossy fresnel edge glow for glass-like appearance
 * - Factory function for easy material creation
 *
 * @module primitives/shaders/tsl-marble
 *
 * @example
 * ```typescript
 * import { createMarbleMaterial } from './tsl-marble';
 *
 * const marble = createMarbleMaterial({
 *   colorA: '#001a13',
 *   colorB: '#66e5b3',
 *   edgeColor: '#4cd9a8',
 *   iterations: 16,
 * });
 *
 * const material = new THREE.MeshStandardNodeMaterial({
 *   metalness: marble.metalness,
 *   roughness: marble.roughness,
 * });
 * material.colorNode = marble.colorNode;
 * material.emissiveNode = marble.emissiveNode;
 * ```
 */

import * as TSL from 'three/tsl';
import { Color, ColorRepresentation } from 'three/webgpu';
import { nativeFBM } from './tsl-utilities';

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// Re-export commonly used TSL functions for this module
const {
  Fn,
  Loop,
  float,
  vec3,
  time,
  mix,
  smoothstep,
  clamp,
  pow,
  sin,
  cos,
  abs,
  dot,
  normalize,
  positionLocal,
  positionWorld,
  cameraPosition,
  normalWorld,
} = TSL;

// TSL Fn helper with proper typing to avoid arg type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSLFn = Fn as any;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for marble material creation
 */
export interface MarbleMaterialConfig {
  /** Dark interior color (default: '#001a13' dark emerald) */
  colorA?: ColorRepresentation;
  /** Bright interior color (default: '#66e5b3' bright teal-green) */
  colorB?: ColorRepresentation;
  /** Edge glow color (default: '#4cd9a8' teal) */
  edgeColor?: ColorRepresentation;
  /** Ray march iterations (8-32, default: 16) */
  iterations?: number;
  /** Ray march depth into sphere (0.5-1.0, default: 0.8) */
  depth?: number;
  /** Animation speed multiplier (default: 0.3) */
  timeScale?: number;
  /** Noise scale for FBM (default: 3.0) */
  noiseScale?: number;
  /** Slice smoothing factor (default: 0.15) */
  smoothing?: number;
  /** Fresnel power for edge effect (2-5, default: 3.0) */
  edgePower?: number;
  /** Fresnel intensity (default: 0.6) */
  edgeIntensity?: number;
}

/**
 * Default marble material configuration
 * Matches the reference implementation's emerald/teal color scheme
 */
export const MARBLE_DEFAULTS = {
  colorA: '#001a13', // Dark emerald
  colorB: '#66e5b3', // Bright teal-green
  edgeColor: '#4cd9a8', // Teal edge glow
  iterations: 16,
  depth: 0.8,
  timeScale: 0.3,
  noiseScale: 3.0,
  smoothing: 0.15,
  edgePower: 3.0,
  edgeIntensity: 0.6,
  interiorTexture: undefined,
  textureBlendMode: 'replace' as const,
  textureBlendAmount: 0.5,
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Clamps a number value to a valid range
 * @param value - Input value
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// Marble Raymarching Function
// ============================================================================

/**
 * TSL Marble Raymarching
 *
 * Creates animated volumetric interior effect inside a sphere.
 * Marches rays from the surface toward the center, sampling 3D noise
 * to accumulate volume that mixes between two colors.
 *
 * Based on Codrops "Magical Marbles" technique.
 *
 * @param iterations - Ray march steps (8-32). Higher = better quality, lower = better performance
 * @param depth - How deep into sphere to march (0.5-1.0)
 * @param colorA - Dark interior color (vec3)
 * @param colorB - Bright interior color (vec3)
 * @param timeScale - Animation speed multiplier
 * @param noiseScale - Scale for FBM noise sampling
 * @param smoothing - Slice smoothstep factor for softer transitions
 * @returns vec3 color node for use in material.colorNode
 *
 * @example
 * ```typescript
 * const marbleColor = tslMarbleRaymarch(
 *   float(16),                    // iterations
 *   float(0.8),                   // depth
 *   vec3(0.0, 0.2, 0.15),         // colorA (dark emerald)
 *   vec3(0.4, 0.9, 0.7),          // colorB (bright teal)
 *   float(0.3),                   // timeScale
 *   float(3.0),                   // noiseScale
 *   float(0.15)                   // smoothing
 * );
 * material.colorNode = marbleColor;
 * ```
 */
export const tslMarbleRaymarch = TSLFn(
  ([iterations, depth, colorA, colorB, timeScale, noiseScale, smoothing]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    // Ray direction from camera to surface point (inverted to go inward)
    const rayDir = normalize(positionWorld.sub(cameraPosition)).negate();

    // Start position (on sphere surface, in local space)
    const rayOrigin = positionLocal.normalize();

    // Per-iteration step size
    const perIteration = float(1.0).div(iterations);
    const deltaRay = rayDir.mul(perIteration).mul(depth);

    // Accumulate volume
    const totalVolume = float(0).toVar();
    const p = vec3(rayOrigin).toVar();

    // Time-based animation for wavy motion
    const t = time.mul(timeScale);

    // Ray march loop
    Loop(iterations, ({ i }: { i: TSLNode }) => {
      // Animated displacement using sine waves
      const displacement = vec3(
        sin(p.x.mul(5).add(t)),
        cos(p.y.mul(5).add(t.mul(0.7))),
        sin(p.z.mul(5).add(t.mul(1.2)))
      ).mul(0.15);

      const displacedP = p.add(displacement);

      // Sample 3D noise at current position (acts as heightmap)
      const noiseVal = nativeFBM(
        displacedP.mul(noiseScale),
        float(4),
        float(2.0),
        float(0.5)
      )
        .add(1)
        .div(2);

      // Calculate cutoff based on iteration depth
      const cutoff = float(1).sub(float(i).mul(perIteration));

      // Take a slice with smoothstep for soft edges
      const slice = smoothstep(cutoff, cutoff.add(smoothing), noiseVal);

      // Accumulate volume
      totalVolume.addAssign(slice.mul(perIteration));

      // March ray forward
      p.addAssign(deltaRay);
    });

    // Clamp total volume to valid range
    const volume = clamp(totalVolume, float(0), float(1));

    // Mix colors based on volume with gamma curve for richness
    const marbleColor = mix(colorA, colorB, pow(volume, float(0.7)));

    return marbleColor;
  }
);

// ============================================================================
// Glossy Fresnel Function
// ============================================================================

/**
 * TSL Glossy Fresnel Edge Glow
 *
 * Creates a rim lighting effect for glass-like appearance.
 * Enhanced fresnel specifically designed for glossy marble spheres.
 *
 * @param power - Fresnel power exponent (higher = sharper rim, 2-5 typical)
 * @param intensity - Glow intensity multiplier (0.3-1.0 typical)
 * @param color - Edge glow color (vec3)
 * @returns vec3 emissive color node for use in material.emissiveNode
 *
 * @example
 * ```typescript
 * const edgeGlow = tslGlossyFresnel(
 *   float(3.0),           // power
 *   float(0.6),           // intensity
 *   vec3(0.3, 0.8, 0.7)   // teal color
 * );
 * material.emissiveNode = edgeGlow;
 * ```
 */
export const tslGlossyFresnel = TSLFn(
  ([power, intensity, color]: [TSLNode, TSLNode, TSLNode]) => {
    // View direction from surface to camera
    const viewDir = normalize(cameraPosition.sub(positionWorld));

    // Rim is strongest when view direction is perpendicular to normal
    const rim = float(1).sub(abs(dot(normalWorld, viewDir)));

    // Apply power curve for sharper falloff
    const fresnelValue = pow(rim, power);

    // Return colored glow
    return color.mul(fresnelValue).mul(intensity);
  }
);

// ============================================================================
// Material Factory Function
// ============================================================================

/**
 * Create Marble Material Nodes
 *
 * Convenience factory that creates pre-configured TSL nodes for a marble material.
 * Returns both colorNode and emissiveNode ready for MeshStandardNodeMaterial.
 *
 * @param config - Optional configuration overrides
 * @returns Object with colorNode, emissiveNode, and recommended material settings
 *
 * @example
 * ```typescript
 * const marble = createMarbleMaterial({
 *   colorA: '#001a13',
 *   colorB: '#66e5b3',
 *   edgeColor: '#4cd9a8',
 *   iterations: 16,
 * });
 *
 * const material = new THREE.MeshStandardNodeMaterial({
 *   metalness: marble.metalness,
 *   roughness: marble.roughness,
 * });
 * material.colorNode = marble.colorNode;
 * material.emissiveNode = marble.emissiveNode;
 * ```
 */
export function createMarbleMaterial(config: MarbleMaterialConfig = {}): {
  colorNode: TSLNode;
  emissiveNode: TSLNode;
  roughness: number;
  metalness: number;
} {
  // Merge with defaults
  const cfg = { ...MARBLE_DEFAULTS, ...config };

  // Clamp iterations to valid range (8-32) for performance/quality balance
  const iterations = clampNumber(cfg.iterations, 8, 32);

  // Convert colors to THREE.Color then to vec3
  const colorAVal = new Color(cfg.colorA);
  const colorBVal = new Color(cfg.colorB);
  const edgeColorVal = new Color(cfg.edgeColor);

  // Create color nodes
  const colorANode = vec3(colorAVal.r, colorAVal.g, colorAVal.b);
  const colorBNode = vec3(colorBVal.r, colorBVal.g, colorBVal.b);
  const edgeColorNode = vec3(edgeColorVal.r, edgeColorVal.g, edgeColorVal.b);

  // Create raymarched interior gradient
  const colorNode = tslMarbleRaymarch(
    float(iterations),
    float(cfg.depth),
    colorANode,
    colorBNode,
    float(cfg.timeScale),
    float(cfg.noiseScale),
    float(cfg.smoothing)
  );

  // Create fresnel edge glow
  const emissiveNode = tslGlossyFresnel(
    float(cfg.edgePower),
    float(cfg.edgeIntensity),
    edgeColorNode
  );

  return {
    colorNode,
    emissiveNode,
    roughness: 0.1, // Low roughness for glossy reflections
    metalness: 0.0, // Non-metallic for correct fresnel behavior
  };
}
