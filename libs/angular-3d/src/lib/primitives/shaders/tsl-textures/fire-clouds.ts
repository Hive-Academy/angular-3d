/**
 * TSL Fire Clouds Texture
 *
 * Creates animated fire effect emanating radially from sphere center to edges.
 * Features customizable colors, turbulence, and animation speed.
 *
 * Key features:
 * - Radial fire emanation from center (hottest core to cooler edges)
 * - Turbulent FBM noise for organic flame shapes
 * - Smooth color gradient: white-hot core → orange flames → smoke edges
 * - Time-based animation with flickering and swirling motion
 * - Highly configurable parameters
 *
 * @module primitives/shaders/tsl-textures/fire-clouds
 */

import * as TSL from 'three/tsl';
import { time } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM } from '../tsl-utilities';

const {
  float,
  vec3,
  add,
  abs,
  pow,
  max,
  positionGeometry,
  sin,
  cos,
  mul,
  sub,
  length,
} = TSL;

// ============================================================================
// tslFireClouds - Upward-flowing turbulent fire/smoke effect
// ============================================================================

const fireCloudsDefaults: TslTextureParams = {
  $name: 'Fire Clouds',
  scale: 2.0, // Base scale for noise patterns
  speed: 0.5, // Overall animation speed
  flowSpeed: 0.8, // Radial expansion speed (flames expand from center)
  turbulence: 3.0, // Turbulence intensity (higher = more chaotic)
  flameHeight: 2.0, // (Unused - kept for backwards compatibility)
  flickerSpeed: 8.0, // Flicker/pulse speed
  flickerAmount: 0.15, // Flicker intensity
  // Colors - Radial gradient from center to edge
  coreColor: new Color('#ffffff'), // White-hot core (center)
  flameColor: new Color('#ff6600'), // Deep orange flames (mid-radius)
  smokeColor: new Color('#f5f5dc'), // Smoked white/beige (outer edge)
  darkColor: new Color('#cc4400'), // Bright orange-red base (darkest areas)
  seed: 0,
};

/**
 * TSL Fire Clouds Texture
 *
 * Creates realistic animated fire effect emanating radially from sphere center.
 * Uses layered FBM noise for turbulent flame patterns with radial intensity gradient.
 *
 * Color gradient: white-hot core (center) → deep orange flames → smoked edges (surface)
 *
 * @example
 * ```typescript
 * const fire = tslFireClouds({
 *   scale: 2.0,
 *   speed: 0.5,
 *   flowSpeed: 0.8,           // Radial expansion speed
 *   turbulence: 3.0,
 *   coreColor: new Color('#ffffff'),   // White-hot center
 *   flameColor: new Color('#ff6600'),  // Deep orange mid-radius
 *   smokeColor: new Color('#f5f5dc'),  // Smoked white edges
 * });
 * material.colorNode = fire;
 * ```
 */
export const tslFireClouds = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, fireCloudsDefaults);

  const t = time.mul(p['speed'] as TSLNode);

  // Base scale
  const baseScale = (p['scale'] as TSLNode).mul(2.0);

  // ========================================================================
  // RADIAL OUTWARD FLOW - Flames expand from center outward
  // ========================================================================

  // CRITICAL: Normalize position first (sphere vertices range from -radius to +radius)
  // Without normalization, large spheres sample noise at huge coordinates (all same value = dark)
  const normalizedPos = positionGeometry.normalize();

  // RADIAL EXPANSION - Flames expand from center like a real fire sphere
  const flowSpeed = p['flowSpeed'] as TSLNode;

  // CRITICAL: Calculate distance from sphere CENTER (0,0,0) once for both flow and gradient
  // For normalized position, length ranges from 0 (center) to 1 (surface)
  const distanceFromSphereCenter = length(normalizedPos);

  // Radial expansion: move texture outward from center over time
  const radialFlow = t.mul(flowSpeed).mul(0.5);

  // Add swirling/circulation around the sphere
  const circulationSpeed = t.mul(0.4);
  const swirl = vec3(
    sin(circulationSpeed.add(normalizedPos.y.mul(3.0))).mul(0.3),
    cos(circulationSpeed.add(normalizedPos.x.mul(3.0))).mul(0.3),
    sin(circulationSpeed.add(normalizedPos.z.mul(3.0))).mul(0.3)
  );

  // Position with radial outward flow (from center outward)
  const flowingPos = normalizedPos
    .mul(baseScale)
    .add(normalizedPos.mul(radialFlow)) // Push texture outward radially
    .add(swirl) // Add circulation
    .add(p['seed']);

  // ========================================================================
  // TURBULENT NOISE - Multiple octaves for flame detail
  // ========================================================================

  const turbulence = p['turbulence'] as TSLNode;

  // Layer 1: Large flame shapes
  const noise1 = nativeFBM(flowingPos, float(4), float(2.0), float(0.5));

  // Layer 2: Medium turbulence (offset for variation)
  const pos2 = flowingPos.add(vec3(50, 100, 150));
  const noise2 = nativeFBM(pos2, float(3), float(2.0), float(0.5));

  // Layer 3: Fine detail
  const pos3 = flowingPos.mul(2.5).add(vec3(200, 300, 400));
  const noise3 = nativeFBM(pos3, float(2), float(2.0), float(0.5));

  // Combine noise layers with different weights
  const combinedNoise = noise1
    .mul(0.5)
    .add(noise2.mul(0.3))
    .add(noise3.mul(0.2));

  // Apply turbulence multiplier and ADD base intensity to ensure visibility
  const turbulentNoise = combinedNoise.mul(turbulence).add(0.3); // +0.3 base intensity

  // ========================================================================
  // RADIAL GRADIENT - Fire emanates from CENTER to EDGES
  // ========================================================================

  // Create radial gradient using distance from center in texture space
  // This simulates volumetric depth where center = bright core, edges = dim
  const textureDepth = length(flowingPos);

  // Strong radial falloff: bright core → dim edges
  const depthFactor = textureDepth.div(baseScale.mul(1.5)).clamp(0, 2);
  const radialIntensity = float(2.0).sub(depthFactor).clamp(0, 1);

  // Apply strong power curve for concentrated core
  const coreIntensity = pow(radialIntensity, float(2.5)); // 2.5 = sharp bright core

  // ========================================================================
  // FLAME STREAMS - Create gaps with noise threshold
  // ========================================================================

  // Combine turbulent noise with core intensity
  const flamePattern = turbulentNoise.mul(coreIntensity);

  // CRITICAL: Threshold to create gaps (flame streams instead of solid sphere)
  // Below threshold = transparent/invisible, above = visible flames
  const flameThreshold = float(0.4); // Adjust this to control flame density
  const thresholdMask = flamePattern.sub(flameThreshold).clamp(0, 1);

  // Apply threshold mask to create distinct flame streams
  const flameIntensity = flamePattern.mul(thresholdMask);

  // ========================================================================
  // FLICKERING - Random intensity variation
  // ========================================================================

  const flickerSpeed = p['flickerSpeed'] as TSLNode;
  const flickerAmount = p['flickerAmount'] as TSLNode;

  // Multi-frequency flicker for realistic flame behavior
  const flicker1 = sin(t.mul(flickerSpeed)).mul(0.5).add(0.5);
  const flicker2 = sin(t.mul(flickerSpeed.mul(1.7)))
    .mul(0.3)
    .add(0.5);
  const flicker3 = sin(t.mul(flickerSpeed.mul(2.3)))
    .mul(0.2)
    .add(0.5);

  const combinedFlicker = flicker1
    .mul(0.5)
    .add(flicker2.mul(0.3))
    .add(flicker3.mul(0.2));
  const flickerMultiplier = float(1.0)
    .sub(flickerAmount)
    .add(combinedFlicker.mul(flickerAmount));

  // ========================================================================
  // FINAL INTENSITY - Combine all factors
  // ========================================================================

  // Apply flicker to flame intensity
  let intensity = flameIntensity.mul(flickerMultiplier);

  // Use power curve to create sharp flame edges and bright cores
  // Reduced power from 1.5 to 1.2 for more visible mid-tones
  intensity = abs(intensity).pow(float(1.2));

  // Clamp to valid range
  const clampedIntensity = intensity.clamp(0, 1);

  // ========================================================================
  // COLOR GRADIENT - Dark → Orange → White → Smoke
  // ========================================================================

  // Color thresholds - adjusted for more visible orange flames
  const darkToFlame = float(0.2); // Dark to orange transition (was 0.3)
  const flameToCorelow = float(0.5); // Orange to white-hot transition (was 0.6)
  const coreToSmoke = float(0.8); // White-hot to smoke transition (was 0.85)

  // Calculate blend factors
  const darkFlameMix = clampedIntensity.div(darkToFlame).clamp(0, 1);
  const flameCoreMix = clampedIntensity
    .sub(darkToFlame)
    .div(flameToCorelow.sub(darkToFlame))
    .clamp(0, 1);
  const coreSmokeMix = clampedIntensity
    .sub(flameToCorelow)
    .div(coreToSmoke.sub(flameToCorelow))
    .clamp(0, 1);

  // Mix colors through gradient
  const darkFlameColor = vec3(p['darkColor']).mix(
    vec3(p['flameColor']),
    darkFlameMix
  );
  const flameCoreColor = darkFlameColor.mix(vec3(p['coreColor']), flameCoreMix);
  const finalColor = flameCoreColor.mix(vec3(p['smokeColor']), coreSmokeMix);

  // CRITICAL FIX: Return color directly without multiplying by intensity again
  // The intensity is already incorporated through the color gradient blending above
  // Multiplying by intensity again was causing double-darkening (intensity squared effect)
  // This was making the fire texture appear nearly black inside the sphere
  return finalColor;
}, fireCloudsDefaults);
