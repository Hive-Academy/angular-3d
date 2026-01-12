/**
 * TSL Pattern Textures (Tier 3)
 *
 * GPU-accelerated procedural pattern generators.
 *
 * @module primitives/shaders/tsl-textures/patterns
 */

import * as TSL from 'three/tsl';
import { time } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { nativeFBM, tslSpherical } from '../tsl-utilities';

const {
  float,
  vec3,
  mix,
  smoothstep,
  positionGeometry,
  If,
  Loop,
  exp,
  pow,
  abs,
  add,
  mul,
  floor,
  fract,
  distance,
  mod,
  min,
  max,
  acos,
  sin,
  cos,
  oneMinus,
} = TSL;

/** Noise wrapper using MaterialX FBM */
const noise = (pos: TSLNode): TSLNode => {
  return nativeFBM(pos, float(4), float(2.0), float(0.5));
};

// Golden ratio for spherical point distribution
const goldenRatio = (1 + Math.sqrt(5)) / 2;

// ============================================================================
// tslPolkaDots
// ============================================================================

const polkaDotsDefaults: TslTextureParams = {
  $name: 'Polka Dots',
  count: 2,
  size: 0.5,
  blur: 0.25,
  color: new Color(0x000000),
  background: new Color(0xffffff),
  flat: 0,
};

/**
 * TSL Polka Dots Texture
 * Creates repeating dot patterns (flat or spherical distribution).
 */
export const tslPolkaDots = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, polkaDotsDefaults);

  const dist = float(1).toVar();

  If((p['flat'] as TSLNode).equal(1), () => {
    const cnt = (p['count'] as TSLNode).pow(2).sub(0.5).toVar();
    const posScaled = positionGeometry.xy.mul(cnt);
    const posTo = posScaled.round().toVar();
    dist.assign(posScaled.distance(posTo).div(cnt));
  }).Else(() => {
    const cnt = pow(10, p['count']).toVar();
    const vec = positionGeometry.normalize().toVar();
    const besti = oneMinus(vec.y).mul(cnt).sub(1).div(2);
    const span = max(10, cnt.pow(0.5));
    const mini = besti.sub(span).floor().clamp(0, cnt);
    const maxi = besti.add(span).floor().clamp(0, cnt);

    dist.assign(1).toVar();

    Loop(maxi.sub(mini), ({ i }: { i: TSLNode }) => {
      const j = add(i, mini);
      const theta = mod(mul((2 * Math.PI) / goldenRatio, j), 2 * Math.PI);
      const phi = acos(oneMinus(float(j).mul(2).add(1).div(cnt)));
      const pnt = tslSpherical(phi, theta);
      dist.assign(min(dist, distance(vec, pnt)));
    });
  });

  const size = exp((p['size'] as TSLNode).mul(5).sub(5)).toVar();
  const blur = (p['blur'] as TSLNode).pow(4).toVar();
  const k = smoothstep(size.sub(blur), size.add(blur), dist);

  return mix(p['color'], p['background'], k);
}, polkaDotsDefaults);

// ============================================================================
// tslGrid
// ============================================================================

const gridDefaults: TslTextureParams = {
  $name: 'Grid',
  scale: 5,
  thickness: 0.05,
  blur: 0.01,
  color: new Color(0x00ffff),
  background: new Color(0x001122),
};

/**
 * TSL Tech Grid Texture
 * Creates holographic/tech grid patterns.
 */
export const tslGrid = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, gridDefaults);

  const pos = positionGeometry.xy.mul(p['scale'] as TSLNode);
  const gridX = fract(pos.x);
  const gridY = fract(pos.y);

  const halfThick = (p['thickness'] as TSLNode).div(2);
  const blurVal = p['blur'] as TSLNode;

  const lineX = smoothstep(
    halfThick.add(blurVal),
    halfThick.sub(blurVal),
    abs(gridX.sub(0.5))
  );
  const lineY = smoothstep(
    halfThick.add(blurVal),
    halfThick.sub(blurVal),
    abs(gridY.sub(0.5))
  );

  const lines = max(lineX, lineY);

  return mix(p['background'], p['color'], lines);
}, gridDefaults);

// ============================================================================
// tslVoronoiCells
// ============================================================================

const voronoiDefaults: TslTextureParams = {
  $name: 'Voronoi',
  scale: 3,
  edgeWidth: 0.1,
  speed: 0.3, // Animation speed
  color: new Color(0xffffff),
  background: new Color(0x333333),
  seed: 0,
};

/**
 * TSL Voronoi Cell Texture
 * Creates animated cellular voronoi patterns with edge detection.
 */
export const tslVoronoiCells = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, voronoiDefaults);

  // Time-based flowing animation
  const t = time.mul(p['speed']);
  const flow = vec3(sin(t), cos(t.mul(0.8)), sin(t.mul(1.2))).mul(0.2);

  const pos = positionGeometry
    .mul(p['scale'] as TSLNode)
    .add(p['seed'])
    .add(flow);

  const n1 = noise(pos);
  const n2 = noise(pos.add(0.01));
  const gradient = abs(n1.sub(n2)).mul(100);

  const edge = smoothstep(0, p['edgeWidth'], gradient);

  return mix(p['color'], p['background'], edge);
}, voronoiDefaults);

// ============================================================================
// tslBricks
// ============================================================================

const bricksDefaults: TslTextureParams = {
  $name: 'Bricks',
  scaleX: 4,
  scaleY: 8,
  mortarWidth: 0.05,
  blur: 0.02,
  color: new Color(0xb22222),
  background: new Color(0x888888),
};

/**
 * TSL Brick Wall Texture
 * Creates offset brick patterns with mortar.
 */
export const tslBricks = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, bricksDefaults);

  const posX = positionGeometry.x.mul(p['scaleX'] as TSLNode);
  const posY = positionGeometry.y.mul(p['scaleY'] as TSLNode);

  const row = floor(posY);
  const offset = mod(row, 2).mul(0.5);
  const brickX = fract(posX.add(offset));
  const brickY = fract(posY);

  const mortarHalf = (p['mortarWidth'] as TSLNode).div(2);
  const blurVal = p['blur'] as TSLNode;

  const mortarX = smoothstep(
    mortarHalf.add(blurVal),
    mortarHalf.sub(blurVal),
    abs(brickX.sub(0.5))
  );
  const mortarY = smoothstep(
    mortarHalf.add(blurVal),
    mortarHalf.sub(blurVal),
    abs(brickY.sub(0.5))
  );

  const isBrick = mortarX.mul(mortarY);

  return mix(p['background'], p['color'], isBrick);
}, bricksDefaults);

// ============================================================================
// tslFabric
// ============================================================================

const fabricDefaults: TslTextureParams = {
  $name: 'Fabric',
  scale: 10,
  color1: new Color(0xdddddd),
  color2: new Color(0x999999),
};

/**
 * Procedural Fabric/Grid
 * Woven pattern logic.
 */
export const tslFabric = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, fabricDefaults);

  const uv = positionGeometry.xy.mul(p['scale'] as TSLNode);

  // Basic basket weave pattern
  const cx = floor(uv.x);
  const cy = floor(uv.y);
  const checker = mod(add(cx, cy), 2.0);

  // Sub-thread gradients
  const tx = fract(uv.x).sub(0.5).abs().mul(2);
  const ty = fract(uv.y).sub(0.5).abs().mul(2);

  // Mix based on weave orientation
  const pattern = mix(tx, ty, checker);

  // Shadowing for depth
  const shadow = float(1.0).sub(pattern.mul(0.5));

  return mix(p['color1'], p['color2'], checker).mul(shadow);
}, fabricDefaults);
