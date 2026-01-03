/**
 * TSL BlueYard Particles Texture
 *
 * Animated floating particles based on the tslStars pattern.
 * Uses noise + high power exponent for sharp bright spots, with
 * coral colors and animation for BlueYard-style effect.
 *
 * @module primitives/shaders/tsl-textures/blueyard-particles
 */

import * as TSL from 'three/tsl';
import { time } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM } from '../tsl-utilities';

const { float, vec3, mix, abs, exp, add, positionGeometry, sin, cos } = TSL;

// ============================================================================
// tslBlueYardParticles - Based on tslStars but with animation + coral colors
// ============================================================================

const blueyardParticlesDefaults: TslTextureParams = {
  $name: 'BlueYard Particles',
  scale: 2.5, // Particle distribution scale
  density: 2, // Particle density (higher = more particles)
  size: 0.5, // Size variation (affects power exponent)
  speed: 0.5, // Animation speed
  color1: new Color(0xffddcc), // Bright particle color (peach/white)
  color2: new Color(0xff9966), // Dimmer particle color (coral)
  background: new Color(0x000000), // Background (transparent black for overlay)
  seed: 0,
};

/**
 * TSL BlueYard Particles
 *
 * Creates animated coral-colored particle effect like BlueYard.com.
 * Based on tslStars but with:
 * - Animation (particles drift and pulse)
 * - Coral/peach color palette
 * - Different size variations
 * - Transparent background for overlay use
 *
 * @example
 * ```typescript
 * const particles = tslBlueYardParticles({
 *   scale: 3,
 *   density: 2.5,
 *   speed: 0.4,
 *   color1: new Color('#ffccaa'),
 * });
 * material.emissiveNode = particles;
 * ```
 */
export const tslBlueYardParticles = TSLFn(
  (userParams: TslTextureParams = {}) => {
    const p = convertToNodes(userParams, blueyardParticlesDefaults);

    const t = time.mul(p['speed'] as TSLNode);

    // Base position with scale (like tslStars)
    const scaleVal = exp((p['scale'] as TSLNode).div(2).add(3));

    // Animated position - gentle drift
    const animOffset = vec3(
      sin(t.mul(0.3)).mul(0.2),
      cos(t.mul(0.4)).mul(0.2),
      sin(t.mul(0.35)).mul(0.2)
    );

    const pos = positionGeometry.mul(scaleVal).add(p['seed']).add(animOffset);

    // Noise for particle distribution (like tslStars)
    const noise = nativeFBM(pos, float(3), float(2.0), float(0.5));

    // High power exponent for sharp bright spots (key to starfield effect)
    // Lower size = higher power = smaller sharper particles
    const sizeVal = p['size'] as TSLNode;
    const powerExp = float(8).sub(sizeVal.mul(6)); // Range 2-8

    let k = abs(noise).pow(powerExp).mul(15);

    // Apply density
    k = k.mul(exp((p['density'] as TSLNode).sub(2)));

    // Pulse animation
    const pulse = sin(t.mul(2)).mul(0.15).add(1);
    k = k.mul(pulse);

    // Mix colors based on intensity (brighter particles = color1, dimmer = color2)
    const particleColor = mix(p['color2'], p['color1'], k.clamp(0, 1));

    // Final output with intensity
    return mix(p['background'], particleColor, k.clamp(0, 1));
  }
);

// ============================================================================
// tslBlueYardParticlesEmissive - Returns just the emissive contribution
// ============================================================================

const blueyardEmissiveDefaults: TslTextureParams = {
  $name: 'BlueYard Particles Emissive',
  scale: 3,
  density: 2.5,
  size: 0.4,
  speed: 0.4,
  color: new Color(0xffcc99), // Bright coral
  seed: 0,
};

/**
 * TSL BlueYard Particles Emissive
 *
 * Returns just the emissive color contribution (no background).
 * Use this to ADD to existing emissive node.
 */
export const tslBlueYardParticlesEmissive = TSLFn(
  (userParams: TslTextureParams = {}) => {
    const p = convertToNodes(userParams, blueyardEmissiveDefaults);

    const t = time.mul(p['speed'] as TSLNode);

    // Base position with scale
    const scaleVal = exp((p['scale'] as TSLNode).div(2).add(3));

    // Animated position - gentle drift
    const animOffset = vec3(
      sin(t.mul(0.3)).mul(0.15),
      cos(t.mul(0.4)).mul(0.15),
      sin(t.mul(0.35)).mul(0.15)
    );

    const pos = positionGeometry.mul(scaleVal).add(p['seed']).add(animOffset);

    // Multi-layer particles for density
    const noise1 = nativeFBM(pos, float(3), float(2.0), float(0.5));
    const noise2 = nativeFBM(
      pos.mul(1.7).add(vec3(50, 100, 150)),
      float(2),
      float(2.0),
      float(0.5)
    );

    // Different power for different particle sizes
    const sizeVal = p['size'] as TSLNode;
    const power1 = float(10).sub(sizeVal.mul(4)); // Smaller bright particles
    const power2 = float(6).sub(sizeVal.mul(2)); // Larger dimmer particles

    const k1 = abs(noise1).pow(power1).mul(8);
    const k2 = abs(noise2).pow(power2).mul(4);

    // Combine layers
    let k = add(k1, k2);

    // Apply density
    k = k.mul(exp((p['density'] as TSLNode).sub(2)));

    // Pulse animation
    const pulse = sin(t.mul(2.5)).mul(0.1).add(1);
    k = k.mul(pulse);

    // Return colored particles as emissive (multiply by intensity)
    const color = p['color'] as TSLNode;
    return vec3(color.x, color.y, color.z).mul(k.clamp(0, 1));
  }
);
