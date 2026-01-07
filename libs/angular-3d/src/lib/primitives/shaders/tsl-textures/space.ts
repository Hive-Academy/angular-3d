/**
 * TSL Space/Sci-Fi Textures (Tier 1)
 *
 * GPU-accelerated procedural textures for cosmic and sci-fi scenes.
 * Ported from tsl-textures library.
 *
 * @module primitives/shaders/tsl-textures/space
 */

import * as TSL from 'three/tsl';
import { mx_worley_noise_float, mx_worley_noise_vec3, time } from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import {
  tslHsl,
  tslToHsl,
  nativeFBM,
  tslApplyEuler,
  domainWarp,
} from '../tsl-utilities';

const {
  float,
  vec3,
  mix,
  smoothstep,
  positionGeometry,
  If,
  Loop,
  exp,
  remap,
  abs,
  add,
  mul,
  select,
} = TSL;

/** Noise wrapper using MaterialX FBM - optimized for performance */
const noise = (pos: TSLNode): TSLNode => {
  // Reduced from 4 to 2 octaves for better performance
  return nativeFBM(pos, float(2), float(2.0), float(0.5));
};

// ============================================================================
// tslPlanet
// ============================================================================

const planetDefaults: TslTextureParams = {
  $name: 'Planet',
  scale: 2,
  iterations: 5,
  levelSea: 0.3,
  levelMountain: 0.7,
  balanceWater: 0.3,
  balanceSand: 0.2,
  balanceSnow: 0.8,
  colorDeep: new Color(0x123a59).convertLinearToSRGB(),
  colorShallow: new Color(0x87ceeb).convertLinearToSRGB(),
  colorBeach: new Color(0xfffacd).convertLinearToSRGB(),
  colorGrass: new Color(0x3cb371).convertLinearToSRGB(),
  colorForest: new Color(0x003000).convertLinearToSRGB(),
  colorSnow: new Color(0xf0ffff).convertLinearToSRGB(),
  seed: 0,
};

/**
 * TSL Planet Surface Texture
 * Creates procedural planet with land, water, and snow zones.
 */
export const tslPlanet = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, planetDefaults);

  const k = float(0).toVar();
  const sum = float(0).toVar();
  const scale = exp((p['scale'] as TSLNode).sub(2)).toVar();
  const power = float(2).toVar();

  // Reduced from iterations+10 to just iterations for performance
  Loop(p['iterations'] as TSLNode, () => {
    k.addAssign(mul(power, noise(positionGeometry.mul(scale).add(p['seed']))));
    sum.addAssign(power);
    scale.mulAssign(1.5);
    power.mulAssign(0.8);
  });

  k.assign(mul(k, k, 0.5).div(sum));

  const levelSea = (p['levelSea'] as TSLNode).pow(2).toVar();
  const levelMountain = (p['levelMountain'] as TSLNode).pow(2).toVar();
  const levelSand = mix(levelSea, levelMountain, p['balanceSand']).toVar();
  const levelCoast = mix(levelSea, levelSand, 0.4).toVar();
  const levelGrass = mix(levelSea, levelSand, 0.6).toVar();

  const color = vec3().toVar();

  If(k.lessThan(levelSea), () => {
    color.assign(
      mix(
        p['colorDeep'],
        p['colorShallow'],
        remap(k, 0, levelSea, 0, 1).pow(
          exp((p['balanceWater'] as TSLNode).mul(-8).add(4))
        )
      )
    );
  })
    .ElseIf(k.lessThan(levelCoast), () => {
      color.assign(
        mix(p['colorShallow'], p['colorBeach'], remap(k, levelSea, levelCoast))
      );
    })
    .ElseIf(k.lessThan(levelGrass), () => {
      color.assign(p['colorBeach']);
    })
    .ElseIf(k.lessThan(levelSand), () => {
      color.assign(
        mix(p['colorBeach'], p['colorGrass'], remap(k, levelGrass, levelSand))
      );
    })
    .ElseIf(k.lessThan(levelMountain), () => {
      color.assign(
        mix(
          p['colorGrass'],
          p['colorForest'],
          remap(k, levelSand, levelMountain).pow(0.75)
        )
      );
    })
    .Else(() => {
      const levelSnow = mix(1, levelMountain, p['balanceSnow']);
      color.assign(
        mix(
          p['colorForest'],
          p['colorSnow'],
          smoothstep(
            mix(
              levelSnow,
              levelMountain,
              (p['balanceSnow'] as TSLNode).pow(0.5)
            ),
            levelSnow,
            k
          )
        )
      );
    });

  return color;
}, planetDefaults);

// ============================================================================
// tslStars
// ============================================================================

const starsDefaults: TslTextureParams = {
  $name: 'Stars',
  scale: 2,
  density: 2,
  variation: 0,
  color: new Color(0xfff5f0),
  background: new Color(0x000060),
  seed: 0,
};

/**
 * TSL Starfield Texture
 * Creates procedural starfield with density and color variation.
 */
export const tslStars = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, starsDefaults);

  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).div(2).add(3)))
    .add(p['seed']);

  let k = abs(noise(pos)).pow(10).mul(10);
  k = k.mul(exp((p['density'] as TSLNode).sub(2)));

  const dS = select(
    k.greaterThan(0.1),
    (p['variation'] as TSLNode).mul(noise(pos)),
    0
  );
  const col = tslToHsl(mix(p['background'], p['color'], k));

  return tslHsl(add(col.x, dS), col.y, col.z);
}, starsDefaults);

// ============================================================================
// tslCausticsTexture
// ============================================================================

const causticsDefaults: TslTextureParams = {
  $name: 'Caustics',
  scale: 2,
  speed: 1, // Animation speed (0 = static, 1 = normal)
  color: new Color(0x88ddff), // Bright caustic color (light areas)
  background: new Color(0x002244), // Dark background color (dark areas)
  intensity: 1.5, // Contrast/intensity of caustics
  seed: 0,
};

/**
 * TSL Caustics Texture
 * Creates animated underwater caustic light patterns using Worley noise.
 *
 * @param color - The bright caustic color (light areas)
 * @param background - The dark background color (shadows)
 * @param scale - Pattern scale (1-5 typical)
 * @param speed - Animation speed (0 = static, 1 = normal, 2 = fast)
 * @param intensity - Contrast/brightness of caustics (0.5-2 typical)
 */
export const tslCausticsTexture = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, causticsDefaults);

  // Position scaled by exponential
  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).sub(1)))
    .add(p['seed'])
    .toVar();

  // Time-based animation using TSL time uniform
  const t = time
    .mul(exp((p['speed'] as TSLNode).sub(1)))
    .add(vec3(0, (2 * Math.PI) / 3, (4 * Math.PI) / 3))
    .sin();

  // Worley noise displacement
  const worleyDisplacement = vec3(
    mx_worley_noise_float(pos.add(t.xyz)),
    mx_worley_noise_float(pos.add(t.yzx)),
    mx_worley_noise_float(pos.add(t.zxy))
  );

  // Final worley noise with displacement
  const noiseResult = mx_worley_noise_vec3(pos.add(worleyDisplacement));

  // Normalize to 0-1 range and apply intensity for contrast
  const k = noiseResult
    .length()
    .div(Math.sqrt(3))
    .mul(p['intensity'])
    .clamp(0, 1);

  // Properly blend between background and color using mix
  return mix(p['background'], p['color'], k);
}, causticsDefaults);

// ============================================================================
// tslPhotosphere
// ============================================================================

const photosphereDefaults: TslTextureParams = {
  $name: 'Photosphere',
  scale: 2,
  color: new Color(0xffff00),
  background: new Color(0xff0000),
  seed: 0,
};

/**
 * TSL Photosphere Texture
 * Creates sun/star surface with granulation patterns.
 * Uses Euler rotation for domain distortion like the original tsl-textures.
 */
export const tslPhotosphere = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, photosphereDefaults);

  const scale = exp((p['scale'] as TSLNode).add(1)).toVar();
  const pos = positionGeometry.toVar();
  const vec = vec3(pos).toVar();

  // Apply Euler rotation for granulation distortion (matches original)
  Loop(6, () => {
    vec.assign(tslApplyEuler(vec, pos.mul(scale)));
    scale.mulAssign((p['seed'] as TSLNode).mul(scale).sin().mul(0.05).add(1.1));
  });

  const k = noise(vec).add(1).div(2);
  return mix(p['background'], p['color'], k);
}, photosphereDefaults);

// ============================================================================
// tslGasGiant
// ============================================================================

const gasGiantDefaults: TslTextureParams = {
  $name: 'Gas Giant',
  scale: 2,
  bands: 10,
  color1: new Color(0xff0000), // Red
  color2: new Color(0xffff00), // Yellow
  color3: new Color(0x0000ff), // Blue
  seed: 0,
};

/**
 * Procedural Gas Giant
 * Banded atmospheric noise
 */
export const tslGasGiant = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, gasGiantDefaults);

  const pos = positionGeometry.mul(p['scale'] as TSLNode);

  // Distortion (using domain warp from utilities)
  const warped = domainWarp(pos, float(0.2));

  // Banded noise (Y axis dominance) - reduced octaves for performance
  const bands = p['bands'] as TSLNode;
  const bandNoise = nativeFBM(
    vec3(warped.x.mul(2), warped.y.mul(bands), warped.z.mul(2)),
    float(3),
    float(2.0),
    float(0.5)
  );

  // Color mapping
  const n = bandNoise.mul(0.5).add(0.5); // 0..1

  // Tri-color gradient
  const mix1 = mix(p['color1'], p['color2'], n.mul(2));
  const mix2 = mix(p['color2'], p['color3'], n.sub(0.5).mul(2));

  return select(n.lessThan(0.5), mix1, mix2);
}, gasGiantDefaults);
