/**
 * TSL Fire Clouds Texture
 *
 * Creates animated fire/smoke effect with upward-flowing turbulent flames.
 * Features customizable colors, turbulence, and animation speed.
 *
 * Key features:
 * - Upward-flowing flames (realistic fire physics)
 * - Turbulent FBM noise for organic flame shapes
 * - Smooth color gradient from hot core to cool smoke
 * - Time-based animation with flickering
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
} = TSL;

// ============================================================================
// tslFireClouds - Upward-flowing turbulent fire/smoke effect
// ============================================================================

const fireCloudsDefaults: TslTextureParams = {
  $name: 'Fire Clouds',
  scale: 2.0, // Base scale for noise patterns
  speed: 0.5, // Overall animation speed
  flowSpeed: 0.8, // Upward flow speed (flames rise)
  turbulence: 3.0, // Turbulence intensity (higher = more chaotic)
  flameHeight: 2.0, // Vertical gradient strength
  flickerSpeed: 8.0, // Flicker/pulse speed
  flickerAmount: 0.15, // Flicker intensity
  // Colors
  coreColor: new Color('#ffffff'), // White-hot core
  flameColor: new Color('#ff6600'), // Deep orange flames
  smokeColor: new Color('#f5f5dc'), // Smoked white/beige
  darkColor: new Color('#331100'), // Dark red-brown base
  seed: 0,
};

/**
 * TSL Fire Clouds Texture
 *
 * Creates realistic animated fire/smoke effect with upward flow.
 * Uses layered FBM noise for turbulent flame patterns.
 *
 * Color gradient: dark base → deep orange flames → white-hot core → smoked white smoke
 *
 * @example
 * ```typescript
 * const fire = tslFireClouds({
 *   scale: 2.0,
 *   speed: 0.5,
 *   flowSpeed: 0.8,
 *   turbulence: 3.0,
 *   flameColor: new Color('#ff6600'),  // Deep orange
 *   smokeColor: new Color('#f5f5dc'),  // Smoked white
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
  // UPWARD FLOW - Flames rise over time
  // ========================================================================

  // Vertical flow (flames move upward)
  const flowSpeed = p['flowSpeed'] as TSLNode;
  const upwardFlow = t.mul(flowSpeed);

  // Add horizontal drift for natural movement
  const horizontalDrift = vec3(
    sin(t.mul(0.3)).mul(0.2),
    float(0),
    cos(t.mul(0.25)).mul(0.2)
  );

  // Position with upward flow
  const flowingPos = positionGeometry
    .mul(baseScale)
    .add(p['seed'])
    .add(horizontalDrift);
  flowingPos.y.addAssign(upwardFlow); // Move texture upward over time

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

  // Apply turbulence multiplier
  const turbulentNoise = combinedNoise.mul(turbulence);

  // ========================================================================
  // VERTICAL GRADIENT - Flames fade upward into smoke
  // ========================================================================

  // Vertical position (-1 to 1 typically)
  const verticalPos = positionGeometry.y;

  // Height gradient (bottom = hot flames, top = cool smoke)
  const flameHeight = p['flameHeight'] as TSLNode;
  const heightFactor = verticalPos.mul(flameHeight).add(1.0).clamp(0, 2);

  // Invert for flame intensity (bottom hot, top cool)
  const flameIntensity = float(2.0).sub(heightFactor).clamp(0, 1);

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

  // Turbulent noise modulated by flame intensity and flicker
  let intensity = turbulentNoise.mul(flameIntensity).mul(flickerMultiplier);

  // Use power curve to create sharp flame edges and bright cores
  intensity = abs(intensity).pow(float(1.5));

  // Clamp to valid range
  const clampedIntensity = intensity.clamp(0, 1);

  // ========================================================================
  // COLOR GRADIENT - Dark → Orange → White → Smoke
  // ========================================================================

  // Color thresholds
  const darkToFlame = float(0.3); // Dark to orange transition
  const flameToCorelow = float(0.6); // Orange to white-hot transition
  const coreToSmoke = float(0.85); // White-hot to smoke transition

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

  // Apply intensity for brightness
  return finalColor.mul(clampedIntensity);
});
