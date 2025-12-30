/**
 * TSL Natural Material Textures (Tier 2)
 *
 * GPU-accelerated procedural textures for natural surfaces.
 *
 * @module primitives/shaders/tsl-textures/materials
 */

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM } from '../tsl-utilities';

const {
  float,
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
  oneMinus,
} = TSL;

/** Noise wrapper using MaterialX FBM */
const noise = (pos: TSLNode): TSLNode => {
  return nativeFBM(pos, float(4), float(2.0), float(0.5));
};

// ============================================================================
// tslMarble
// ============================================================================

const marbleDefaults: TslTextureParams = {
  $name: 'Marble',
  scale: 1.2,
  thinness: 5,
  noise: 0.3,
  color: new Color(0x4545d3),
  background: new Color(0xf0f8ff),
  seed: 0,
};

/**
 * TSL Marble Texture
 * Creates veined marble patterns for stone surfaces.
 */
export const tslMarble = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, marbleDefaults);

  const pos = positionGeometry
    .mul(exp(p['scale'] as TSLNode))
    .add(p['seed'])
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
});

// ============================================================================
// tslWood
// ============================================================================

const woodDefaults: TslTextureParams = {
  $name: 'Wood',
  scale: 2,
  rings: 10,
  noise: 0.3,
  color: new Color(0x8b4513),
  background: new Color(0xdeb887),
  seed: 0,
};

/**
 * TSL Wood Grain Texture
 * Creates wood grain with ring patterns.
 */
export const tslWood = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, woodDefaults);

  const pos = positionGeometry.mul(exp(p['scale'] as TSLNode)).add(p['seed']);
  const dist = pos.xz.length();
  const noiseVal = noise(pos.mul(0.5)).mul(p['noise']);
  const rings = sin(dist.mul(p['rings']).add(noiseVal.mul(10)))
    .mul(0.5)
    .add(0.5);

  return mix(p['background'], p['color'], rings.pow(0.5));
});

// ============================================================================
// tslRust
// ============================================================================

const rustDefaults: TslTextureParams = {
  $name: 'Rust',
  scale: 2,
  intensity: 0.6,
  color: new Color(0xb7410e),
  background: new Color(0x5c4033),
  seed: 0,
};

/**
 * TSL Rust/Oxidation Texture
 * Creates rust and corrosion patterns.
 */
export const tslRust = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, rustDefaults);

  const pos = positionGeometry.mul(exp(p['scale'] as TSLNode)).add(p['seed']);

  const n1 = noise(pos).add(0.5);
  const n2 = noise(pos.mul(3)).mul(0.5).add(0.5);
  const n3 = noise(pos.mul(10)).mul(0.25).add(0.5);

  const rustLevel = n1.mul(n2).mul(n3).mul(p['intensity']);

  return mix(p['background'], p['color'], rustLevel);
});
