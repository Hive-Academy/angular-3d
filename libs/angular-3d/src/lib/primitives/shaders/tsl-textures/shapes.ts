/**
 * TSL Shape Modifiers
 *
 * GPU-accelerated geometry modifiers for advanced effects.
 *
 * @module primitives/shaders/tsl-textures/shapes
 */

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';

const { float, pow, abs, sin, mul, add, positionLocal } = TSL;

// ============================================================================
// tslSupersphere
// ============================================================================

const supersphereDefaults: TslTextureParams = {
  $name: 'Supersphere',
  exponent: 2, // 2 = sphere, higher = more cubic
};

/**
 * TSL Supersphere Position Modifier
 * Morphs sphere geometry toward cube shape based on exponent.
 *
 * @example
 * ```typescript
 * material.positionNode = tslSupersphere({ exponent: 4 });
 * ```
 */
export const tslSupersphere = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, supersphereDefaults);
  const exp = p['exponent'] as TSLNode;

  const pos = positionLocal.toVar();

  // Apply superellipsoid equation: |x|^n + |y|^n + |z|^n = 1
  const fx = pow(abs(pos.x), exp);
  const fy = pow(abs(pos.y), exp);
  const fz = pow(abs(pos.z), exp);
  const sum = add(fx, add(fy, fz));
  const factor = pow(sum, float(1).div(exp).negate());

  return pos.mul(factor);
});

// ============================================================================
// tslMelter
// ============================================================================

const melterDefaults: TslTextureParams = {
  $name: 'Melter',
  intensity: 0.5,
  frequency: 2,
  time: 0,
};

/**
 * TSL Melter Position Modifier
 * Creates melting/dripping effect by displacing vertices.
 *
 * @example
 * ```typescript
 * material.positionNode = positionLocal.add(tslMelter({ intensity: 1, time: uTime }));
 * ```
 */
export const tslMelter = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, melterDefaults);

  const pos = positionLocal;
  const time = p['time'] as TSLNode;
  const freq = p['frequency'] as TSLNode;
  const intensity = p['intensity'] as TSLNode;

  // Vertical drip based on position and time
  const drip = sin(mul(pos.x, freq).add(time))
    .mul(sin(mul(pos.z, freq).add(time.mul(0.7))))
    .mul(intensity);

  // More drip at bottom
  const yFactor = float(1).sub(pos.y.add(1).div(2));

  return TSL.vec3(0, drip.mul(yFactor), 0);
});
