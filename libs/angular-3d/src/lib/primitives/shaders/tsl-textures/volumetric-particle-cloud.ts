/**
 * TSL Volumetric Particle Cloud Texture
 *
 * Multi-scale particle system with size variation and depth.
 * Creates the dense, varied particle look seen in the reference screenshot.
 *
 * Key features:
 * - Multiple particle layers at different scales (tiny stars + large orbs)
 * - Different power curves for sharp vs soft particles
 * - Color variation from bright cores to dim edges
 * - Natural depth occlusion when combined with marble raymarching
 *
 * @module primitives/shaders/tsl-textures/volumetric-particle-cloud
 */

import * as TSL from 'three/tsl';
import { time } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM } from '../tsl-utilities';

const { float, vec3, add, abs, exp, pow, max, positionGeometry, sin, cos } =
  TSL;

// ============================================================================
// tslVolumetricParticleCloud - Multi-scale particles with depth variation
// ============================================================================

const volumetricParticleCloudDefaults: TslTextureParams = {
  $name: 'Volumetric Particle Cloud',
  scale: 2.5, // Base scale for particle distribution
  density: 2.5, // Overall particle density
  speed: 0.4, // Animation speed
  // Particle layer 1: Tiny sharp stars
  layer1Scale: 1.0, // Scale multiplier for layer 1
  layer1Power: 12, // High power = sharp tiny particles
  layer1Intensity: 8, // Brightness
  // Particle layer 2: Medium soft orbs
  layer2Scale: 0.6, // Different scale for variety
  layer2Power: 8, // Medium power = soft medium particles
  layer2Intensity: 6, // Brightness
  // Particle layer 3: Large glowing orbs
  layer3Scale: 0.35, // Even larger scale difference
  layer3Power: 5, // Low power = soft large particles
  layer3Intensity: 4, // Brightness
  // Particle layer 4: Very large ambient glow
  layer4Scale: 0.2, // Largest scale
  layer4Power: 3, // Very soft
  layer4Intensity: 2, // Subtle ambient
  // Colors
  coreColor: new Color(0xffffff), // Bright white cores
  midColor: new Color(0x88ddff), // Cyan mid-tones
  edgeColor: new Color(0x4488aa), // Dark teal edges
  seed: 0,
};

/**
 * TSL Volumetric Particle Cloud
 *
 * Creates a dense cloud of particles with size variation.
 * Combines 4 layers of particles at different scales and power curves
 * to create the varied particle look seen in the reference screenshot.
 *
 * Each layer uses the same noise function but at different scales,
 * creating particles of different sizes. High power exponents create
 * sharp tiny stars, low power exponents create soft large orbs.
 *
 * @example
 * ```typescript
 * const particles = tslVolumetricParticleCloud({
 *   scale: 2.5,
 *   density: 2.5,
 *   coreColor: new Color('#ffffff'),
 *   midColor: new Color('#88ddff'),
 *   edgeColor: new Color('#4488aa'),
 * });
 * material.colorNode = particles;
 * ```
 */
export const tslVolumetricParticleCloud = TSLFn(
  (userParams: TslTextureParams = {}) => {
    const p = convertToNodes(userParams, volumetricParticleCloudDefaults);

    const t = time.mul(p['speed'] as TSLNode);

    // Base position with scale
    const baseScale = exp((p['scale'] as TSLNode).div(2).add(3));

    // Animated drift for organic movement
    const animOffset = vec3(
      sin(t.mul(0.3)).mul(0.15),
      cos(t.mul(0.4)).mul(0.15),
      sin(t.mul(0.35)).mul(0.15)
    );

    const basePos = positionGeometry
      .mul(baseScale)
      .add(p['seed'])
      .add(animOffset);

    // Layer 1: Tiny sharp stars (high power, small scale)
    const pos1 = basePos.mul(p['layer1Scale'] as TSLNode);
    const noise1 = nativeFBM(pos1, float(3), float(2.0), float(0.5));
    const power1 = p['layer1Power'] as TSLNode;
    const k1 = abs(noise1)
      .pow(power1)
      .mul(p['layer1Intensity'] as TSLNode);

    // Layer 2: Medium soft orbs (medium power, medium scale)
    const pos2 = basePos
      .mul(p['layer2Scale'] as TSLNode)
      .add(vec3(50, 100, 150)); // Offset for different pattern
    const noise2 = nativeFBM(pos2, float(2), float(2.0), float(0.5));
    const power2 = p['layer2Power'] as TSLNode;
    const k2 = abs(noise2)
      .pow(power2)
      .mul(p['layer2Intensity'] as TSLNode);

    // Layer 3: Large glowing orbs (low power, large scale)
    const pos3 = basePos
      .mul(p['layer3Scale'] as TSLNode)
      .add(vec3(200, 300, 400)); // Different offset
    const noise3 = nativeFBM(pos3, float(2), float(2.0), float(0.5));
    const power3 = p['layer3Power'] as TSLNode;
    const k3 = abs(noise3)
      .pow(power3)
      .mul(p['layer3Intensity'] as TSLNode);

    // Layer 4: Very large ambient glow (very low power, very large scale)
    const pos4 = basePos
      .mul(p['layer4Scale'] as TSLNode)
      .add(vec3(500, 600, 700));
    const noise4 = nativeFBM(pos4, float(1), float(2.0), float(0.5));
    const power4 = p['layer4Power'] as TSLNode;
    const k4 = abs(noise4)
      .pow(power4)
      .mul(p['layer4Intensity'] as TSLNode);

    // Combine all layers additively
    const combined = add(k1, k2, k3, k4);

    // Apply global density multiplier
    const densityFactor = exp((p['density'] as TSLNode).sub(2));
    let intensity = combined.mul(densityFactor);

    // Pulse animation for organic feel
    const pulse = sin(t.mul(2.5)).mul(0.08).add(1);
    intensity = intensity.mul(pulse);

    // Clamp to valid range
    const clampedIntensity = intensity.clamp(0, 1);

    // Color gradient based on intensity
    // High intensity (bright particles) = core color (white)
    // Medium intensity = mid color (cyan)
    // Low intensity = edge color (dark teal)
    const colorStep1 = float(0.5); // Threshold between edge and mid
    const colorStep2 = float(0.8); // Threshold between mid and core

    // Three-way color gradient
    const edgeToMid = clampedIntensity.div(colorStep1).clamp(0, 1);
    const midToCore = clampedIntensity
      .sub(colorStep1)
      .div(colorStep2.sub(colorStep1))
      .clamp(0, 1);

    // Mix colors
    const edgeMidMix = vec3(p['edgeColor']).mix(vec3(p['midColor']), edgeToMid);
    const finalColor = edgeMidMix.mix(vec3(p['coreColor']), midToCore);

    // Multiply by intensity for brightness
    return finalColor.mul(clampedIntensity);
  },
  volumetricParticleCloudDefaults
);
