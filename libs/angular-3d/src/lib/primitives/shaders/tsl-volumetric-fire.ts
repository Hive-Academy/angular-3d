/**
 * TSL Volumetric Fire Shader - Adapted from FireShaderTSL
 *
 * Complete volumetric ray marching fire implementation for spheres.
 * Based on working FireTSL example with proper coordinate transforms.
 *
 * Key features:
 * - Proper world→local space transformation
 * - Ray marching through spherical volume
 * - FBM turbulence for organic fire shapes
 * - Procedural fire texture generation
 */

import * as TSL from 'three/tsl';
import { time } from 'three/tsl';
import { Color, Matrix4, Vector3 } from 'three/webgpu';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

const {
  Fn,
  Loop,
  float,
  vec3,
  vec4,
  int,
  abs,
  length,
  normalize,
  cameraPosition,
  positionWorld,
  mx_noise_float,
  uniform,
  clamp,
  mix,
  smoothstep,
  select,
} = TSL;

/**
 * Turbulence function using FBM with Perlin noise (from FireShaderTSL)
 */
const turbulence3 = Fn(([p, lacunarity, gain]: [TSLNode, TSLNode, TSLNode]) => {
  const sum = float(0).toVar('turbSum');
  const freq = float(1).toVar('turbFreq');
  const amp = float(1).toVar('turbAmp');
  const pos = vec3(p).toVar('turbPos');

  Loop(int(3), () => {
    sum.addAssign(abs(mx_noise_float(pos.mul(freq))).mul(amp));
    freq.mulAssign(lacunarity);
    amp.mulAssign(gain);
  });

  return sum;
});

/**
 * Transform world position to local object space (from FireShaderTSL)
 */
const localize = Fn(([worldPos, invMatrix]: [TSLNode, TSLNode]) => {
  return invMatrix.mul(vec4(worldPos, 1.0)).xyz;
});

/**
 * Procedural sun texture sampler - PERFORMANCE OPTIMIZED
 * Creates bold sun with 4-5 large flame tendrils
 *
 * Optimizations:
 * - Single turbulence pass (not two)
 * - Lower frequency noise for bigger flame shapes
 * - Simplified core texture
 *
 * @param p - Local position (in sphere's local space)
 * @param sphereRadius - Actual sphere radius for proper scaling
 * @param innerRadius - Inner radius for hollow shell (0 = solid)
 * @param noiseScale - Noise scale [x, y, z, timeSpeed]
 * @param lacunarity - FBM frequency multiplier
 * @param gain - FBM amplitude multiplier
 * @param magnitude - Turbulence intensity (higher = longer flames)
 * @param seed - Random seed for variation
 */
const samplerSphericalFire = Fn(
  ([
    p,
    sphereRadius,
    innerRadius,
    noiseScale,
    lacunarity,
    gain,
    magnitude,
    seed,
  ]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    // RADIAL DISTANCE from sphere center
    const distFromCenter = length(p);
    const hasHollow = innerRadius.greaterThan(float(0.001));

    // For hollow shell: DON'T remap distance - let fire pattern extend naturally from center
    // We'll just cut off everything inside innerRadius with the hollowMask
    // This avoids putting the "bright core" at the inner boundary
    const normalizedDist = distFromCenter.div(sphereRadius);

    // Animate fire - radial expansion outward over time
    // NOTE: fract() was removed to prevent visible "reset" jumps in animation.
    // If flames degrade after extended viewing (10+ min), consider adding
    // a very long cycle: mod(rawTime, 1000.0) or similar.
    const animP = vec3(p).toVar('animP');
    const timeOffset = seed.add(time).mul(noiseScale.w); // Continuous time, no cycling

    // VERY LOW FREQUENCY noise for LARGE, SEPARATED flame shapes
    // Lower multiplier (0.25) = bigger, more distinct flame tendrils
    animP.assign(
      p.mul(vec3(noiseScale.x, noiseScale.y, noiseScale.z).mul(0.25))
    );
    // Add time-based animation (fire flows outward)
    animP.addAssign(normalize(p).mul(timeOffset.mul(0.5)));

    // ========================================
    // SINGLE TURBULENCE PASS - optimized for performance
    // Very low frequency = 3-4 big distinct flame tendrils
    // ========================================
    const turbulenceValue = turbulence3(animP, lacunarity, gain);

    // ========================================
    // CORE TEXTURE - more variation for organic look
    // ========================================
    const coreTexture = turbulenceValue.mul(0.4).add(0.6);

    // ========================================
    // RADIAL GRADIENT - MASSIVE FLAMES, TINY CORE
    // ========================================
    // Very high magnitude multiplier creates extremely long flame tendrils
    const radialGradient = normalizedDist.add(
      turbulenceValue.mul(magnitude.mul(4.0))
    );

    // Fire intensity - TINY core, flames extend VERY FAR outward
    const coreSize = float(0.12); // Tiny bright core (was 0.25)
    const flameReach = float(2.5); // Flames reach 2.5x radius (was 1.8)
    const fireIntensity = smoothstep(flameReach, coreSize, radialGradient);

    // Apply core texture for variation
    const texturedIntensity = fireIntensity.mul(coreTexture);

    // Higher threshold contrast for more distinct flames
    const sunSurface = smoothstep(float(0.05), float(0.65), texturedIntensity);

    // ========================================
    // MULTI-COLOR GRADIENT (center → edge)
    // TINY CORE, FAST TRANSITION TO FLAME COLORS
    // ========================================
    // Core: warm golden (very small area)
    const coreColor = vec3(1.0, 0.95, 0.75);
    // Inner: golden yellow
    const innerColor = vec3(1.0, 0.7, 0.25);
    // Mid: deep orange
    const midColor = vec3(1.0, 0.4, 0.08);
    // Outer: red-orange for flame tips
    const outerColor = vec3(0.85, 0.15, 0.0);

    // Color based on distance - VERY fast transition for tiny core
    // Higher multiplier = faster color change from center
    const colorT = clamp(normalizedDist.mul(4.0), float(0.0), float(1.0));

    // Gradient with TINY bright core - transitions happen at smaller distances
    const color1 = mix(
      coreColor,
      innerColor,
      smoothstep(float(0.0), float(0.06), colorT)
    );
    const color2 = mix(
      color1,
      midColor,
      smoothstep(float(0.06), float(0.2), colorT)
    );
    const finalColor = mix(
      color2,
      outerColor,
      smoothstep(float(0.2), float(0.5), colorT)
    );

    // Apply core texture darkness
    const texturedColor = finalColor.mul(coreTexture.mul(0.3).add(0.7));

    // Final colored sun
    const coloredSun = texturedColor.mul(sunSurface);

    // Alpha with extended flame fade - matches larger flame reach
    const coronaFade = smoothstep(float(2.5), float(0.4), normalizedDist);
    const alpha = sunSurface.mul(coronaFade);

    // For hollow shell: hard cutoff at innerRadius
    // Anything inside innerRadius = 0, outside = 1
    // Ray termination in the marching loop handles the visual transition
    const insideHollow = distFromCenter.lessThan(innerRadius);
    const hollowMask = select(
      hasHollow.and(insideHollow),
      float(0.0),
      float(1.0)
    );

    return vec4(
      coloredSun.x.mul(hollowMask),
      coloredSun.y.mul(hollowMask),
      coloredSun.z.mul(hollowMask),
      alpha.mul(hollowMask)
    );
  }
);

/**
 * Uniforms interface for volumetric fire (matching FireShaderTSL pattern)
 */
export interface VolumetricFireUniforms {
  color: TSLNode;
  invModelMatrix: TSLNode & { value: Matrix4 };
  scale: TSLNode & { value: Vector3 };
  sphereRadius: TSLNode & { value: number };
  innerRadius: TSLNode & { value: number };
  noiseScale: TSLNode;
  magnitude: TSLNode & { value: number };
  lacunarity: TSLNode;
  gain: TSLNode & { value: number };
  seed: TSLNode & { value: number };
}

/**
 * Configuration for creating fire uniforms
 */
export interface VolumetricFireConfig {
  color?: Color | number;
  sphereRadius?: number;
  innerRadius?: number;
  noiseScale?: [number, number, number, number];
  magnitude?: number;
  lacunarity?: number;
  gain?: number;
}

/**
 * Create uniforms for volumetric fire shader
 */
export const createVolumetricFireUniforms = (
  config: VolumetricFireConfig = {}
): VolumetricFireUniforms => {
  const colorValue =
    config.color instanceof Color
      ? config.color
      : new Color(config.color ?? 0xff6600);

  return {
    color: uniform(colorValue),
    invModelMatrix: uniform(new Matrix4()),
    scale: uniform(new Vector3(1, 1, 1)),
    sphereRadius: uniform(config.sphereRadius ?? 4.5),
    innerRadius: uniform(config.innerRadius ?? 0),
    noiseScale: vec4(
      float(config.noiseScale?.[0] ?? 0.8),
      float(config.noiseScale?.[1] ?? 0.8),
      float(config.noiseScale?.[2] ?? 0.8),
      float(config.noiseScale?.[3] ?? 0.5)
    ),
    magnitude: uniform(config.magnitude ?? 0.4),
    lacunarity: uniform(config.lacunarity ?? 2.0),
    gain: uniform(config.gain ?? 0.5),
    seed: uniform(Math.random() * 19.19),
  };
};

/**
 * Create volumetric sun/fire fragment node
 *
 * Ray marching through spherical volume with corona extension.
 * The shader now generates multi-color gradient internally (sun mode).
 *
 * @param uniforms - Volumetric fire uniforms
 * @param iterations - Ray march steps (more = better quality, slower)
 * @param sunMode - If true, uses built-in sun colors. If false, tints with uniform color.
 */
export const createVolumetricFireNode = (
  uniforms: VolumetricFireUniforms,
  iterations = 40,
  sunMode = true
) => {
  return Fn(() => {
    const rayPos = vec3(positionWorld).toVar('rayPos');
    const rayDir = normalize(rayPos.sub(cameraPosition)).toVar('rayDir');

    // Extended diameter to include corona and large flames (40% beyond sphere)
    const coronaExtension = float(1.4);
    const extendedRadius = uniforms.sphereRadius.mul(coronaExtension);
    const diameter = extendedRadius.mul(2.0);
    const rayLen = diameter.div(float(iterations)).mul(length(uniforms.scale));

    const col = vec4(0.0).toVar('col');

    // Track if ray has entered hollow region - once true, stop accumulating
    // This prevents back-shell fire from filling the hollow center
    const hasHollow = uniforms.innerRadius.greaterThan(float(0.001));
    const enteredHollow = float(0.0).toVar('enteredHollow');

    // Calculate ray's closest approach to sphere center (in local space)
    // This determines if the ray passes THROUGH the hollow or just grazes the shell
    // Formula: closestDist = |rayOrigin - rayDir * dot(rayOrigin, rayDir)|
    // We use camera position relative to sphere center (approximated by inverse model matrix)
    const localCamPos = localize(cameraPosition, uniforms.invModelMatrix);
    const localRayDir = normalize(
      localize(rayPos, uniforms.invModelMatrix).sub(localCamPos)
    );
    const tClosest = TSL.dot(localCamPos.negate(), localRayDir);
    const closestPoint = localCamPos.add(localRayDir.mul(tClosest));
    const closestDist = length(closestPoint);

    // If ray passes through hollow center, make entire pixel transparent
    // This prevents front-shell fire from creating haze in the hollow view
    const rayPassesThroughHollow = hasHollow.and(
      closestDist.lessThan(uniforms.innerRadius)
    );

    Loop(int(iterations), () => {
      rayPos.addAssign(rayDir.mul(rayLen));

      // Transform to local space (sphere centered at origin)
      const lp = localize(rayPos, uniforms.invModelMatrix).toVar('lp');

      // Sample within extended radius (includes corona)
      const distFromCenter = length(lp);
      const insideExtended = distFromCenter.lessThan(extendedRadius);

      // Check if this sample is inside the hollow region
      const isInHollow = distFromCenter.lessThan(uniforms.innerRadius);

      // Once ray enters hollow, set flag (stays set for rest of ray march)
      // This implements ray termination for hollow center
      enteredHollow.assign(
        TSL.max(
          enteredHollow,
          select(hasHollow.and(isInHollow), float(1.0), float(0.0))
        )
      );

      // Stop accumulating once we've passed through hollow (back shell cutoff)
      const shouldAccumulate = float(1.0).sub(enteredHollow);

      // Hollow shell fade for soft edge at inner boundary
      const fadeWidth = uniforms.innerRadius.mul(0.3);
      const fadeEnd = uniforms.innerRadius.add(fadeWidth).add(float(0.001));
      const rawShellFade = smoothstep(
        uniforms.innerRadius,
        fadeEnd,
        distFromCenter
      );
      const shellFade = select(hasHollow, rawShellFade, float(1.0));

      // Sample sun/fire (pass innerRadius for hollow shell support)
      const fireSample = samplerSphericalFire(
        lp,
        uniforms.sphereRadius,
        uniforms.innerRadius,
        uniforms.noiseScale,
        uniforms.lacunarity,
        uniforms.gain,
        uniforms.magnitude,
        uniforms.seed
      );

      // Apply hollow shell fade AND ray termination mask
      // Also skip ALL accumulation if ray passes through hollow center
      const skipForHollow = select(
        rayPassesThroughHollow,
        float(0.0),
        float(1.0)
      );
      const combinedMask = shellFade.mul(shouldAccumulate).mul(skipForHollow);
      const fadedSample = vec4(
        fireSample.x.mul(combinedMask),
        fireSample.y.mul(combinedMask),
        fireSample.z.mul(combinedMask),
        fireSample.w.mul(combinedMask)
      );

      // Accumulate within extended radius
      col.addAssign(select(insideExtended, fadedSample, vec4(0.0)));
    });

    // In fire mode (not sun mode), apply color tint over the built-in colors
    // This allows customizing the fire color while sun mode uses realistic colors
    const colorVec = vec3(uniforms.color);
    const fireModeTint = sunMode ? float(0.0) : float(1.0);

    // Blend: sunMode=1 keeps original, fireMode=1 tints with uniform color
    // For sun mode, we skip tinting entirely
    // For fire mode, we multiply by the color
    const tintedR = mix(col.x, col.x.mul(colorVec.x), fireModeTint);
    const tintedG = mix(col.y, col.y.mul(colorVec.y), fireModeTint);
    const tintedB = mix(col.z, col.z.mul(colorVec.z), fireModeTint);

    col.x.assign(tintedR);
    col.y.assign(tintedG);
    col.z.assign(tintedB);

    // Clamp final color
    col.assign(clamp(col, vec4(0.0), vec4(1.0)));

    return col;
  })();
};
