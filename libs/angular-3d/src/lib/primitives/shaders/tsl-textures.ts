/**
 * TSL Procedural Texture Generators
 *
 * GPU-accelerated procedural textures using Three.js Shading Language.
 * Works on both WebGPU (WGSL) and WebGL (GLSL) through TSL auto-transpilation.
 *
 * Ported from tsl-textures library: https://github.com/boytchev/tsl-textures
 *
 * @module primitives/shaders/tsl-textures
 */

import * as TSL from 'three/tsl';
import { Color, Vector3 } from 'three/webgpu';

// Re-export required TSL functions
const {
  Fn,
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
  div,
  sin,
  select,
  oneMinus,
  floor,
  fract,
  distance,
  mod,
  min,
  max,
  acos,
} = TSL;

// TSL Fn helper with proper typing to avoid arg type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSLFn = Fn as any;

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// Import utilities from tsl-utilities
import { tslHsl, tslToHsl, nativeFBM, tslSpherical } from './tsl-utilities';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Parameters for TSL texture generators.
 * Supports numbers, Colors, and Vector3 values.
 */
export interface TslTextureParams {
  [key: string]: TSLNode | number | Color | Vector3 | string | undefined;
}

// ============================================================================
// Helper: Convert user params to TSL nodes (from tsl-utils.js)
// ============================================================================

/**
 * Converts user-provided parameters to TSL nodes.
 * Numbers become float nodes, Colors become vec3 nodes.
 *
 * @param userParams - User-provided parameters
 * @param defaults - Default parameter values
 * @returns Merged parameters with TSL node conversions
 */
function convertToNodes(
  userParams: TslTextureParams,
  defaults: TslTextureParams
): TslTextureParams {
  // Start with defaults
  const params: TslTextureParams = { ...defaults };

  // Override with user params
  for (const [key, value] of Object.entries(userParams)) {
    if (typeof value !== 'undefined') {
      params[key] = value;
    }
  }

  // Convert to TSL nodes
  for (const name of Object.keys(params)) {
    // Skip internal properties starting with $
    if (name.startsWith('$')) continue;

    const value = params[name];
    if (typeof value === 'number') {
      params[name] = float(value);
    } else if (value instanceof Color) {
      params[name] = vec3(value.r, value.g, value.b);
    } else if (value instanceof Vector3) {
      params[name] = vec3(value.x, value.y, value.z);
    }
  }

  return params;
}

/**
 * Simple noise function using MaterialX fractal noise
 * @internal
 */
const noise = (pos: TSLNode): TSLNode => {
  return nativeFBM(pos, float(4), float(2.0), float(0.5));
};

// ============================================================================
// TIER 1: Space/Sci-Fi Textures
// ============================================================================

/**
 * Default parameters for tslPlanet texture
 */
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
 * Creates a procedural planet surface with land, water, and snow zones.
 *
 * Uses multi-octave noise to generate terrain height, then maps it to
 * color zones (deep water, shallow water, beach, grass, forest, snow).
 *
 * @param params - Configuration parameters
 * @param params.scale - Terrain scale (default: 2)
 * @param params.iterations - Noise octaves (default: 5)
 * @param params.levelSea - Sea level threshold (default: 0.3)
 * @param params.levelMountain - Mountain level threshold (default: 0.7)
 * @param params.balanceWater - Water depth gradient (default: 0.3)
 * @param params.balanceSand - Sand zone size (default: 0.2)
 * @param params.balanceSnow - Snow coverage (default: 0.8)
 * @param params.colorDeep - Deep water color
 * @param params.colorShallow - Shallow water color
 * @param params.colorBeach - Beach/sand color
 * @param params.colorGrass - Grass/lowland color
 * @param params.colorForest - Forest/highland color
 * @param params.colorSnow - Snow/peak color
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 *
 * @example
 * ```typescript
 * const planetColor = tslPlanet({ scale: 2.5, balanceSnow: 0.9 });
 * material.colorNode = planetColor;
 * ```
 */
export const tslPlanet = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, planetDefaults);

  const k = float(0).toVar();
  const sum = float(0).toVar();
  const scale = exp((p['scale'] as TSLNode).sub(2)).toVar();
  const power = float(2).toVar();

  // Multi-octave noise accumulation
  Loop((p['iterations'] as TSLNode).add(10), () => {
    k.addAssign(mul(power, noise(positionGeometry.mul(scale).add(p['seed']))));
    sum.addAssign(power);
    scale.mulAssign(1.5);
    power.mulAssign(0.8);
  });

  k.assign(mul(k, k, 0.5).div(sum));

  // Calculate level thresholds
  const levelSea = (p['levelSea'] as TSLNode).pow(2).toVar();
  const levelMountain = (p['levelMountain'] as TSLNode).pow(2).toVar();
  const levelSand = mix(levelSea, levelMountain, p['balanceSand']).toVar();
  const levelCoast = mix(levelSea, levelSand, 0.4).toVar();
  const levelGrass = mix(levelSea, levelSand, 0.6).toVar();

  const color = vec3().toVar();

  // Process water zones
  If(k.lessThan(levelSea), () => {
    // Deep to shallow water
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
      // Shallow to sand
      color.assign(
        mix(p['colorShallow'], p['colorBeach'], remap(k, levelSea, levelCoast))
      );
    })
    .ElseIf(k.lessThan(levelGrass), () => {
      // Sand zone
      color.assign(p['colorBeach']);
    })
    .ElseIf(k.lessThan(levelSand), () => {
      // Sand to grass
      color.assign(
        mix(p['colorBeach'], p['colorGrass'], remap(k, levelGrass, levelSand))
      );
    })
    .ElseIf(k.lessThan(levelMountain), () => {
      // Grass to forest
      color.assign(
        mix(
          p['colorGrass'],
          p['colorForest'],
          remap(k, levelSand, levelMountain).pow(0.75)
        )
      );
    })
    .Else(() => {
      // Forest to snow
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

/**
 * Default parameters for tslStars texture
 */
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
 * Creates a procedural starfield with configurable density and color variation.
 *
 * Uses high-power noise to create sparse bright points that appear as stars.
 * Supports color variation for more realistic star distributions.
 *
 * @param params - Configuration parameters
 * @param params.scale - Star pattern scale (default: 2)
 * @param params.density - Star density (default: 2)
 * @param params.variation - Color hue variation (default: 0)
 * @param params.color - Star color
 * @param params.background - Background color
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 *
 * @example
 * ```typescript
 * const stars = tslStars({ density: 3, variation: 0.2 });
 * material.colorNode = stars;
 * ```
 */
export const tslStars = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, starsDefaults);

  const pos = positionGeometry
    .mul(exp((p['scale'] as TSLNode).div(2).add(3)))
    .add(p['seed']);

  // High power noise creates sparse bright points
  let k = abs(noise(pos)).pow(10).mul(10);
  k = k.mul(exp((p['density'] as TSLNode).sub(2)));

  // Color variation based on noise
  const dS = select(
    k.greaterThan(0.1),
    (p['variation'] as TSLNode).mul(noise(pos)),
    0
  );

  // Convert to HSL, apply variation, convert back to RGB
  const col = tslToHsl(mix(p['background'], p['color'], k));

  return tslHsl(add(col.x, dS), col.y, col.z);
});

/**
 * Default parameters for tslCausticsTexture
 */
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
 *
 * Uses sine wave interference to create web-like patterns of light
 * that shimmer and move over time, simulating light refracted through water.
 *
 * @param params - Configuration parameters
 * @param params.scale - Pattern scale (default: 2)
 * @param params.time - Animation time (default: 0)
 * @param params.intensity - Light intensity (default: 1)
 * @param params.sharpness - Contrast sharpness (default: 2.5)
 * @param params.color - Caustic light color
 * @param params.background - Background color
 * @returns vec3 color node for material.colorNode
 *
 * @example
 * ```typescript
 * const caustics = tslCausticsTexture({ time: uniformTime, scale: 3 });
 * material.colorNode = caustics;
 * ```
 */
export const tslCausticsTexture = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, causticsDefaults);

  const pos = positionGeometry.xy.mul(exp(p['scale'] as TSLNode));
  const t = (p['time'] as TSLNode).mul(0.3);

  // Layer 1: Primary caustic waves
  const c1x = pos.x.add(sin(pos.y.add(t))).mul(2);
  const c1y = pos.y.add(sin(pos.x.add(t.mul(0.8)))).mul(2);
  const caustic1 = sin(c1x).mul(0.5).add(0.5);
  const caustic2 = sin(c1y).mul(0.5).add(0.5);

  // Layer 2: Secondary smaller waves for detail
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

  // Combine layers with multiplication for sharp bright bands
  const rawCaustic = caustic1.mul(caustic2).mul(caustic3).mul(caustic4);

  // Apply power curve for sharp contrast
  const causticValue = pow(rawCaustic, p['sharpness']).mul(p['intensity']);

  return mix(p['background'], p['color'], causticValue);
});

/**
 * Default parameters for tslPhotosphere texture
 */
const photosphereDefaults: TslTextureParams = {
  $name: 'Photosphere',
  scale: 2,
  color: new Color(0xffff00),
  background: new Color(0xff0000),
  seed: 0,
};

/**
 * TSL Photosphere Texture
 * Creates a sun/star surface with granulation patterns.
 *
 * Uses iterated rotation and noise to create the turbulent,
 * granular appearance of a stellar photosphere.
 *
 * @param params - Configuration parameters
 * @param params.scale - Pattern scale (default: 2)
 * @param params.color - Hot spot color (default: yellow)
 * @param params.background - Cool region color (default: red)
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 *
 * @example
 * ```typescript
 * const sun = tslPhotosphere({ scale: 2.5 });
 * material.colorNode = sun;
 * ```
 */
export const tslPhotosphere = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, photosphereDefaults);

  const scale = exp((p['scale'] as TSLNode).add(1)).toVar();
  const pos = positionGeometry.toVar();

  const vec = vec3(pos).toVar();

  // Iterative turbulence through rotation
  Loop(6, () => {
    // Apply pseudo-rotation by modulating components
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

// ============================================================================
// TIER 2: Natural Materials
// ============================================================================

/**
 * Default parameters for tslMarble texture
 */
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
 *
 * Uses multi-octave noise with abs().pow() to create the characteristic
 * vein patterns found in natural marble.
 *
 * @param params - Configuration parameters
 * @param params.scale - Pattern scale (default: 1.2)
 * @param params.thinness - Vein thinness (default: 5)
 * @param params.noise - Surface noise amount (default: 0.3)
 * @param params.color - Vein color
 * @param params.background - Base marble color
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 *
 * @example
 * ```typescript
 * const marble = tslMarble({ color: new Color(0x333333), thinness: 7 });
 * material.colorNode = marble;
 * ```
 */
export const tslMarble = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, marbleDefaults);

  const pos = positionGeometry
    .mul(exp(p['scale'] as TSLNode))
    .add(p['seed'])
    .toVar();

  // Multi-octave noise for vein pattern
  const noiseSum = add(
    noise(pos),
    noise(pos.mul(2)).mul(0.5),
    noise(pos.mul(6)).mul(0.1)
  );

  // Create vein pattern with abs and pow
  const k = oneMinus(abs(noiseSum).pow(2.5)).toVar();

  // Smoothing thresholds based on thinness
  const maxSmooth = oneMinus(
    pow(0.5, (p['thinness'] as TSLNode).add(7))
  ).toVar();
  const minSmooth = oneMinus(
    pow(0.5, (p['thinness'] as TSLNode).add(7).mul(0.5))
  ).toVar();

  // Apply smoothing zones
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

  // Add surface noise
  k.assign(k.add(mul(p['noise'], abs(noise(pos.mul(150))).pow(3))));

  return mix(p['background'], p['color'], k);
});

/**
 * Default parameters for tslWood texture
 */
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
 *
 * Uses radial distance combined with noise to create natural wood ring patterns.
 *
 * @param params - Configuration parameters
 * @param params.scale - Pattern scale (default: 2)
 * @param params.rings - Number of rings (default: 10)
 * @param params.noise - Grain variation (default: 0.3)
 * @param params.color - Ring color
 * @param params.background - Wood base color
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 */
export const tslWood = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, woodDefaults);

  const pos = positionGeometry.mul(exp(p['scale'] as TSLNode)).add(p['seed']);

  // Radial distance for rings
  const dist = pos.xz.length();
  const noiseVal = noise(pos.mul(0.5)).mul(p['noise']);

  // Create ring pattern
  const rings = sin(dist.mul(p['rings']).add(noiseVal.mul(10)))
    .mul(0.5)
    .add(0.5);

  return mix(p['background'], p['color'], rings.pow(0.5));
});

/**
 * Default parameters for tslRust texture
 */
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
 *
 * Uses multi-scale noise to create pitting and oxidation effects.
 *
 * @param params - Configuration parameters
 * @param params.scale - Pattern scale (default: 2)
 * @param params.intensity - Rust intensity (default: 0.6)
 * @param params.color - Rust color
 * @param params.background - Metal base color
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 */
export const tslRust = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, rustDefaults);

  const pos = positionGeometry.mul(exp(p['scale'] as TSLNode)).add(p['seed']);

  // Multi-scale noise for rust patterns
  const n1 = noise(pos).add(0.5);
  const n2 = noise(pos.mul(3)).mul(0.5).add(0.5);
  const n3 = noise(pos.mul(10)).mul(0.25).add(0.5);

  const rustLevel = n1.mul(n2).mul(n3).mul(p['intensity']);

  return mix(p['background'], p['color'], rustLevel);
});

// ============================================================================
// TIER 3: Patterns
// ============================================================================

/**
 * Default parameters for tslPolkaDots texture
 */
const polkaDotsDefaults: TslTextureParams = {
  $name: 'Polka Dots',
  count: 2,
  size: 0.5,
  blur: 0.25,
  color: new Color(0x000000),
  background: new Color(0xffffff),
  flat: 0,
};

// Golden ratio for spherical point distribution
const goldenRatio = (1 + Math.sqrt(5)) / 2;

/**
 * TSL Polka Dots Texture
 * Creates repeating dot patterns (flat or spherical distribution).
 *
 * Uses golden ratio for uniform spherical distribution of dots.
 *
 * @param params - Configuration parameters
 * @param params.count - Dot density (default: 2)
 * @param params.size - Dot size (default: 0.5)
 * @param params.blur - Edge blur (default: 0.25)
 * @param params.color - Dot color
 * @param params.background - Background color
 * @param params.flat - Use flat UV distribution (default: 0 = spherical)
 * @returns vec3 color node for material.colorNode
 */
export const tslPolkaDots = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, polkaDotsDefaults);

  const dist = float(1).toVar();

  If((p['flat'] as TSLNode).equal(1), () => {
    // Flat UV-based dots using simple grid
    const cnt = (p['count'] as TSLNode).pow(2).sub(0.5).toVar();
    const posScaled = positionGeometry.xy.mul(cnt);
    const posTo = posScaled.round().toVar();
    dist.assign(posScaled.distance(posTo).div(cnt));
  }).Else(() => {
    // Spherical golden ratio distribution
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
});

/**
 * Default parameters for tslGrid texture
 */
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
 *
 * Uses UV-based grid with smoothstep blur for clean lines.
 *
 * @param params - Configuration parameters
 * @param params.scale - Grid cell size (default: 5)
 * @param params.thickness - Line thickness (default: 0.05)
 * @param params.blur - Line blur (default: 0.01)
 * @param params.color - Line color
 * @param params.background - Background color
 * @returns vec3 color node for material.colorNode
 */
export const tslGrid = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, gridDefaults);

  const pos = positionGeometry.xy.mul(p['scale'] as TSLNode);

  // Grid lines using fract
  const gridX = fract(pos.x);
  const gridY = fract(pos.y);

  const halfThick = (p['thickness'] as TSLNode).div(2);
  const blurVal = p['blur'] as TSLNode;

  // Smoothstep for X and Y lines
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

  // Combine lines
  const lines = max(lineX, lineY);

  return mix(p['background'], p['color'], lines);
});

/**
 * Default parameters for tslVoronoiCells texture
 */
const voronoiDefaults: TslTextureParams = {
  $name: 'Voronoi',
  scale: 3,
  edgeWidth: 0.1,
  color: new Color(0xffffff),
  background: new Color(0x333333),
  seed: 0,
};

/**
 * TSL Voronoi Cell Texture
 * Creates cellular voronoi patterns with edge detection.
 *
 * Uses noise-based pseudo-voronoi for organic cell structures.
 *
 * @param params - Configuration parameters
 * @param params.scale - Cell size (default: 3)
 * @param params.edgeWidth - Edge thickness (default: 0.1)
 * @param params.color - Cell color
 * @param params.background - Edge color
 * @param params.seed - Random seed offset
 * @returns vec3 color node for material.colorNode
 */
export const tslVoronoiCells = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, voronoiDefaults);

  const pos = positionGeometry.mul(p['scale'] as TSLNode).add(p['seed']);

  // Simulate voronoi with noise gradient
  const n1 = noise(pos);
  const n2 = noise(pos.add(0.01));
  const gradient = abs(n1.sub(n2)).mul(100);

  const edge = smoothstep(0, p['edgeWidth'], gradient);

  return mix(p['color'], p['background'], edge);
});

/**
 * Default parameters for tslBricks texture
 */
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
 *
 * Uses offset grid pattern for classic brick layout.
 *
 * @param params - Configuration parameters
 * @param params.scaleX - Horizontal brick count (default: 4)
 * @param params.scaleY - Vertical brick count (default: 8)
 * @param params.mortarWidth - Mortar thickness (default: 0.05)
 * @param params.blur - Edge blur (default: 0.02)
 * @param params.color - Brick color
 * @param params.background - Mortar color
 * @returns vec3 color node for material.colorNode
 */
export const tslBricks = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, bricksDefaults);

  const posX = positionGeometry.x.mul(p['scaleX'] as TSLNode);
  const posY = positionGeometry.y.mul(p['scaleY'] as TSLNode);

  // Offset every other row
  const row = floor(posY);
  const offset = mod(row, 2).mul(0.5);
  const brickX = fract(posX.add(offset));
  const brickY = fract(posY);

  const mortarHalf = (p['mortarWidth'] as TSLNode).div(2);
  const blurVal = p['blur'] as TSLNode;

  // Mortar lines
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
});
