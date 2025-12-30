/**
 * TSL Space/Sci-Fi Textures (Tier 1)
 *
 * GPU-accelerated procedural textures for cosmic and sci-fi scenes.
 * Ported from tsl-textures library.
 *
 * @module primitives/shaders/tsl-textures/space
 */

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';
import { Color } from 'three/webgpu';

import { TSLFn, TSLNode, TslTextureParams, convertToNodes } from './types';
import { tslHsl, tslToHsl, nativeFBM } from '../tsl-utilities';

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
  remap,
  abs,
  add,
  mul,
  sin,
  select,
} = TSL;

/** Noise wrapper using MaterialX FBM */
const noise = (pos: TSLNode): TSLNode => {
  return nativeFBM(pos, float(4), float(2.0), float(0.5));
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

  Loop((p['iterations'] as TSLNode).add(10), () => {
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
});

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
});

// ============================================================================
// tslCausticsTexture
// ============================================================================

const causticsDefaults: TslTextureParams = {
  $name: 'Caustics',
  scale: 2,
  time: 0,
  intensity: 1,
  sharpness: 2.5,
  color: new Color(0xaaddff),
  background: new Color(0x001133),
};

/**
 * TSL Caustics Texture
 * Creates animated underwater caustic light patterns.
 */
export const tslCausticsTexture = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, causticsDefaults);

  const pos = positionGeometry.xy.mul(exp(p['scale'] as TSLNode));
  const t = (p['time'] as TSLNode).mul(0.3);

  const c1x = pos.x.add(sin(pos.y.add(t))).mul(2);
  const c1y = pos.y.add(sin(pos.x.add(t.mul(0.8)))).mul(2);
  const caustic1 = sin(c1x).mul(0.5).add(0.5);
  const caustic2 = sin(c1y).mul(0.5).add(0.5);

  const c2x = pos.x
    .mul(2.3)
    .add(sin(pos.y.mul(1.7).add(t)))
    .mul(2);
  const c2y = pos.y
    .mul(2.1)
    .add(sin(pos.x.mul(1.9).add(t)))
    .mul(2);
  const caustic3 = sin(c2x).mul(0.5).add(0.5);
  const caustic4 = sin(c2y).mul(0.5).add(0.5);

  const rawCaustic = caustic1.mul(caustic2).mul(caustic3).mul(caustic4);
  const causticValue = pow(rawCaustic, p['sharpness']).mul(p['intensity']);

  return mix(p['background'], p['color'], causticValue);
});

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
 */
export const tslPhotosphere = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, photosphereDefaults);

  const scale = exp((p['scale'] as TSLNode).add(1)).toVar();
  const pos = positionGeometry.toVar();
  const vec = vec3(pos).toVar();

  Loop(6, () => {
    const rotated = vec3(
      vec.x.add(sin(vec.y.mul(scale)).mul(0.2)),
      vec.y.add(sin(vec.z.mul(scale)).mul(0.2)),
      vec.z.add(sin(vec.x.mul(scale)).mul(0.2))
    );
    vec.assign(rotated);
    scale.mulAssign((p['seed'] as TSLNode).mul(scale).sin().mul(0.05).add(1.1));
  });

  const k = noise(vec).add(1).div(2);
  return mix(p['background'], p['color'], k);
});
