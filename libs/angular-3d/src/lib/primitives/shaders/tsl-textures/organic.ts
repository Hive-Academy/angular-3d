/**
 * TSL Organic Textures
 *
 * GPU-accelerated procedural textures for organic/biological effects.
 * All textures support time-based animation via the 'speed' parameter.
 *
 * @module primitives/shaders/tsl-textures/organic
 */

import * as TSL from 'three/tsl';
import { mx_worley_noise_float, mx_fractal_noise_float, time } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM } from '../tsl-utilities';

const { float, vec3, mix, positionGeometry, exp, sin, cos } = TSL;

/** Noise wrapper using MaterialX FBM */
const noise = (pos: TSLNode): TSLNode => {
  return nativeFBM(pos, float(4), float(2.0), float(0.5));
};

// ============================================================================
// tslBrain - Animated brain folds
// ============================================================================

const brainDefaults: TslTextureParams = {
  $name: 'Brain',
  scale: 2,
  smooth: 0.5,
  speed: 0.5, // Animation speed
  color: new Color(0xffd0d0),
  background: new Color(0x500000),
  seed: 0,
};

/**
 * TSL Brain Texture
 * Creates animated brain-like folded surface patterns.
 */
export const tslBrain = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, brainDefaults);

  // Time-based position offset for pulsing animation
  const t = time.mul(p['speed']);
  const pulse = sin(t).mul(0.1).add(1);

  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).div(3)))
    .add(p['seed'])
    .mul(pulse)
    .toVar();

  const octaves = exp((p['smooth'] as TSLNode).oneMinus().mul(2));

  const n = mx_fractal_noise_float(pos.mul(5), octaves)
    .add(1)
    .div(2)
    .clamp(0, 1)
    .pow(2);

  return mix(p['color'], p['background'], n);
}, brainDefaults);

// ============================================================================
// tslReticularVeins - Animated cell network
// ============================================================================

const reticularVeinsDefaults: TslTextureParams = {
  $name: 'Reticular Veins',
  scale: 2,
  reticulation: 5,
  strength: 0.2,
  organelles: 0.2,
  speed: 0.3, // Animation speed
  color: new Color(0xfffff0),
  background: new Color(0x208020),
  seed: 0,
};

/**
 * TSL Reticular Veins Texture
 * Creates animated organic vein/cell network patterns.
 */
export const tslReticularVeins = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, reticularVeinsDefaults);

  // Time-based animation for flowing cells
  const t = time.mul(p['speed']);
  const flow = vec3(sin(t), cos(t.mul(0.7)), sin(t.mul(1.3))).mul(0.3);

  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).div(2).add(0.5)))
    .add(p['seed'])
    .add(flow)
    .toVar();

  const k1 = mx_worley_noise_float(pos.mul(1));
  const k2 = mx_worley_noise_float(pos.add(100).mul(p['reticulation'])).mul(
    p['strength']
  );
  const dots = noise(pos.mul(100)).mul(p['strength'], p['organelles']);

  const k = k1.add(k2).add(dots);

  return mix(p['background'], p['color'], k);
}, reticularVeinsDefaults);

// ============================================================================
// tslWaterMarble - Animated swirling water marble
// ============================================================================

const waterMarbleDefaults: TslTextureParams = {
  $name: 'Water Marble',
  scale: 2,
  turbulence: 0.5,
  speed: 0.5, // Animation speed for swirling
  color: new Color(0x88ccff),
  background: new Color(0x001133),
  seed: 0,
};

/**
 * TSL Water Marble Texture
 * Creates animated glass-like water marble with flowing swirls.
 */
export const tslWaterMarble = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, waterMarbleDefaults);

  // Time-based swirling animation
  const t = time.mul(p['speed']);
  const swirl = vec3(sin(t), cos(t.mul(0.8)), sin(t.mul(1.2))).mul(0.5);

  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).sub(1)))
    .add(p['seed'])
    .add(swirl)
    .toVar();

  // Multi-layer swirling pattern
  const n1 = noise(pos.mul(2));
  const n2 = noise(pos.mul(4).add(n1.mul(p['turbulence'])));
  const n3 = noise(pos.mul(8).add(n2.mul(p['turbulence'])));

  const swirlPattern = n1.add(n2.mul(0.5)).add(n3.mul(0.25)).add(1).div(2);
  const glassEffect = swirlPattern.pow(0.5).mul(0.7).add(0.3);

  return mix(p['background'], p['color'], glassEffect);
}, waterMarbleDefaults);

// ============================================================================
// tslRoughClay - Animated rough clay surface
// ============================================================================

const roughClayDefaults: TslTextureParams = {
  $name: 'Rough Clay',
  scale: 2,
  roughness: 0.5,
  speed: 0.2, // Slow subtle animation
  color: new Color(0xc4a484),
  background: new Color(0x8b7355),
  seed: 0,
};

/**
 * TSL Rough Clay Texture
 * Creates animated rough clay-like surface.
 */
export const tslRoughClay = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, roughClayDefaults);

  // Subtle time-based movement
  const t = time.mul(p['speed']);
  const movement = sin(t).mul(0.1);

  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).div(2)))
    .add(p['seed'])
    .add(movement)
    .toVar();

  const k1 = mx_worley_noise_float(pos.add(noise(pos).mul(p['roughness'])))
    .add(0.8)
    .pow(2);

  const detail = noise(pos.mul(10)).mul(0.1).add(1);
  const k = k1.mul(detail).clamp(0, 1);

  return mix(p['background'], p['color'], k);
}, roughClayDefaults);
