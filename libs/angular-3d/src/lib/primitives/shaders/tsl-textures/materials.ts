/**
 * TSL Natural Material Textures (Tier 2)
 *
 * GPU-accelerated procedural textures for natural surfaces.
 * All textures support time-based animation via the 'speed' parameter.
 *
 * @module primitives/shaders/tsl-textures/materials
 */

import * as TSL from 'three/tsl';
import { time, mx_noise_float } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM } from '../tsl-utilities';

const {
  float,
  vec3,
  mix,
  positionGeometry,
  If,
  exp,
  pow,
  abs,
  add,
  mul,
  div,
  sin,
  cos,
  oneMinus,
} = TSL;

/** Noise wrapper using MaterialX FBM */
const noise = (pos: TSLNode): TSLNode => {
  return nativeFBM(pos, float(4), float(2.0), float(0.5));
};

// ============================================================================
// tslMarble - Animated flowing marble veins
// ============================================================================

const marbleDefaults: TslTextureParams = {
  $name: 'Marble',
  scale: 1.2,
  thinness: 5,
  noise: 0.3,
  speed: 0.2, // Slow flowing veins
  color: new Color(0x4545d3),
  background: new Color(0xf0f8ff),
  seed: 0,
};

/**
 * TSL Marble Texture
 * Creates animated veined marble patterns.
 */
export const tslMarble = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, marbleDefaults);

  // Time-based flowing effect for veins
  const t = time.mul(p['speed']);
  const flow = vec3(sin(t), cos(t.mul(0.7)), sin(t.mul(1.2))).mul(0.15);

  const pos = positionGeometry
    .mul(exp(p['scale'] as TSLNode))
    .add(p['seed'])
    .add(flow)
    .toVar();

  const noiseSum = add(
    noise(pos),
    noise(pos.mul(2)).mul(0.5),
    noise(pos.mul(6)).mul(0.1)
  );

  const k = oneMinus(abs(noiseSum).pow(2.5)).toVar();

  const maxSmooth = oneMinus(
    pow(0.5, (p['thinness'] as TSLNode).add(7))
  ).toVar();
  const minSmooth = oneMinus(
    pow(0.5, (p['thinness'] as TSLNode).add(7).mul(0.5))
  ).toVar();

  If(k.greaterThan(maxSmooth), () => {
    k.assign(1);
  })
    .ElseIf(k.lessThan(minSmooth), () => {
      k.assign(0);
    })
    .Else(() => {
      const a = k.sub(minSmooth);
      const b = maxSmooth.sub(minSmooth);
      k.assign(pow(div(a, b), 5).mul(0.75));
      k.assign(k.mul(add(0.5, noise(pos.mul(2)).mul(1.5))));
    });

  k.assign(k.add(mul(p['noise'], abs(noise(pos.mul(150))).pow(3))));

  return mix(p['background'], p['color'], k);
}, marbleDefaults);

// ============================================================================
// tslWood - Animated wood grain
// ============================================================================

const woodDefaults: TslTextureParams = {
  $name: 'Wood',
  scale: 2,
  rings: 10,
  noise: 0.3,
  speed: 0.15, // Subtle grain movement
  color: new Color(0x8b4513),
  background: new Color(0xdeb887),
  seed: 0,
};

/**
 * TSL Wood Grain Texture
 * Creates animated wood grain with ring patterns.
 */
export const tslWood = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, woodDefaults);

  // Time-based subtle movement
  const t = time.mul(p['speed']);
  const sway = sin(t).mul(0.1);

  const pos = positionGeometry
    .mul(exp(p['scale'] as TSLNode))
    .add(p['seed'])
    .add(vec3(sway, 0, sway.mul(0.5)));

  const dist = pos.xz.length();
  const noiseVal = noise(pos.mul(0.5)).mul(p['noise']);
  const rings = sin(dist.mul(p['rings']).add(noiseVal.mul(10)).add(t))
    .mul(0.5)
    .add(0.5);

  return mix(p['background'], p['color'], rings.pow(0.5));
}, woodDefaults);

// ============================================================================
// tslRust - Animated spreading rust
// ============================================================================

const rustDefaults: TslTextureParams = {
  $name: 'Rust',
  scale: 2,
  intensity: 0.6,
  speed: 0.1, // Slow spreading effect
  color: new Color(0xb7410e),
  background: new Color(0x5c4033),
  seed: 0,
};

/**
 * TSL Rust/Oxidation Texture
 * Creates animated rust and corrosion patterns.
 */
export const tslRust = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, rustDefaults);

  // Time-based spreading animation
  const t = time.mul(p['speed']);
  const spread = vec3(sin(t), cos(t.mul(0.8)), sin(t.mul(1.1))).mul(0.2);

  const pos = positionGeometry
    .mul(exp(p['scale'] as TSLNode))
    .add(p['seed'])
    .add(spread);

  const n1 = noise(pos).add(0.5);
  const n2 = noise(pos.mul(3)).mul(0.5).add(0.5);
  const n3 = noise(pos.mul(10)).mul(0.25).add(0.5);

  const rustLevel = n1.mul(n2).mul(n3).mul(p['intensity']);

  return mix(p['background'], p['color'], rustLevel);
}, rustDefaults);

// ============================================================================
// tslConcrete
// ============================================================================

const concreteDefaults: TslTextureParams = {
  $name: 'Concrete',
  scale: 1,
  roughness: 0.5,
  color1: new Color(0x808080), // Grey
  color2: new Color(0x606060), // Darker grey
  seed: 0,
};

/**
 * Procedural Concrete/Asphalt
 * Rough surface with high frequency noise speckles.
 */
export const tslConcrete = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, concreteDefaults);

  const pos = positionGeometry.mul(p['scale'] as TSLNode).add(p['seed']);

  // High frequency noise for grain
  const noise1 = mx_noise_float(pos.mul(50));
  const noise2 = mx_noise_float(pos.mul(100).add(100));

  // Combine for granular look
  const grain = noise1.mul(noise2).mul(p['roughness']).add(0.5);

  return mix(p['color1'], p['color2'], grain.clamp(0, 1));
}, concreteDefaults);
