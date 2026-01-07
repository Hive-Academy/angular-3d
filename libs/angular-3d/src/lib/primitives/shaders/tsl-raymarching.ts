/**
 * TSL Ray Marching Utilities
 *
 * Ray marching and signed distance function (SDF) utilities for TSL-based shaders.
 * Used for volumetric rendering effects like metaballs, where geometry is defined
 * procedurally using distance fields rather than traditional polygons.
 *
 * This module provides core SDF primitives and ray marching algorithms that work
 * on both WebGPU (via WGSL) and WebGL (via GLSL) backends through TSL auto-transpilation.
 *
 * @example
 * ```typescript
 * import { tslSphereDistance, tslSmoothUnion, tslRayMarch, tslNormal } from './tsl-raymarching';
 *
 * // Define scene SDF combining multiple metaballs
 * const sceneSDF = Fn(([pos]: [TSLNode]) => {
 *   const sphere1 = tslSphereDistance(pos, vec3(0,0,0), float(0.5));
 *   const sphere2 = tslSphereDistance(pos, vec3(1,0,0), float(0.5));
 *   return tslSmoothUnion(sphere1, sphere2, float(0.3));
 * });
 *
 * // Ray march the scene
 * const hitDistance = tslRayMarch(rayOrigin, rayDirection, sceneSDF, float(64));
 * const hitPoint = rayOrigin.add(rayDirection.mul(hitDistance));
 * const normal = tslNormal(hitPoint, sceneSDF);
 * ```
 */

// Import TSL as namespace (standard pattern from Three.js examples)

import * as TSL from 'three/tsl';

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * Helper to safely access TSL functions at runtime rather than module load time.
 * This avoids race conditions where WebGPU context isn't ready when module loads.
 */
function getTSL() {
  const {
    Fn,
    Loop,
    float,
    vec3,
    vec4,
    min,
    max,
    abs,
    length,
    normalize,
    smoothstep,
    pow,
    clamp,
    select,
  } = TSL;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Fn: Fn as any,
    Loop,
    float,
    vec3,
    vec4,
    min,
    max,
    abs,
    length,
    normalize,
    smoothstep,
    pow,
    clamp,
    select,
  };
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Epsilon value for ray marching hit detection
 * Defines how close a ray must be to a surface to be considered a hit
 */
export const RAY_MARCH_EPSILON = 0.001;

/**
 * Maximum distance for ray marching
 * Rays beyond this distance are considered misses
 */
export const RAY_MARCH_MAX_DIST = 100.0;

// ============================================================================
// Signed Distance Functions (SDFs)
// ============================================================================

// Cached TSL function instances (created on first use)
let _tslSphereDistance: TSLNode;
let _tslSmoothUnion: TSLNode;

/**
 * Sphere SDF - Distance from point to sphere surface
 *
 * Returns signed distance: negative inside sphere, positive outside, zero on surface.
 * This is the fundamental building block for metaball rendering.
 *
 * @param point - 3D position to sample distance at
 * @param center - Sphere center position
 * @param radius - Sphere radius
 * @returns Signed distance to sphere surface
 *
 * @example
 * ```typescript
 * const dist = tslSphereDistance(positionLocal, vec3(0, 0, 0), float(0.5));
 * ```
 */
export const tslSphereDistance = (
  point: TSLNode,
  center: TSLNode,
  radius: TSLNode
): TSLNode => {
  if (!_tslSphereDistance) {
    const { Fn, length } = getTSL();
    _tslSphereDistance = Fn(([p, c, r]: [TSLNode, TSLNode, TSLNode]) => {
      return length(p.sub(c)).sub(r);
    });
  }
  return _tslSphereDistance(point, center, radius);
};

/**
 * Smooth Minimum (smin) - Smooth union of two distance fields
 *
 * Blends two SDFs smoothly instead of using a sharp min() operation.
 * This creates organic "blob" blending effects for metaballs.
 *
 * Based on Inigo Quilez's polynomial smooth minimum:
 * https://iquilezles.org/articles/smin/
 *
 * @param d1 - First distance value
 * @param d2 - Second distance value
 * @param k - Smoothing factor (higher = more blending, typical range: 0.1-0.5)
 * @returns Smoothly blended minimum distance
 *
 * @example
 * ```typescript
 * const sphere1 = tslSphereDistance(pos, center1, radius1);
 * const sphere2 = tslSphereDistance(pos, center2, radius2);
 * const blended = tslSmoothUnion(sphere1, sphere2, float(0.3));
 * ```
 */
export const tslSmoothUnion = (
  d1: TSLNode,
  d2: TSLNode,
  k: TSLNode
): TSLNode => {
  if (!_tslSmoothUnion) {
    const { Fn, float, min, max, abs } = getTSL();
    _tslSmoothUnion = Fn(([a, b, smoothK]: [TSLNode, TSLNode, TSLNode]) => {
      // Polynomial smooth minimum (Inigo Quilez)
      const h = max(smoothK.sub(abs(a.sub(b))), float(0)).div(smoothK);
      return min(a, b).sub(h.mul(h).mul(smoothK).mul(0.25));
    });
  }
  return _tslSmoothUnion(d1, d2, k);
};

// ============================================================================
// Ray Marching Algorithm
// ============================================================================

// Cached TSL function instances for ray marching
let _tslRayMarch: TSLNode;

/**
 * Ray March - Sphere tracing through a signed distance field
 *
 * Marches a ray through a 3D scene defined by an SDF, finding the intersection point.
 * Uses sphere tracing: at each step, advance the ray by the minimum distance to any surface.
 *
 * This is the core algorithm for rendering metaballs and other volumetric effects.
 * Uses TSL Loop node for iteration, which compiles to WGSL/GLSL loops.
 *
 * Performance Notes:
 * - Desktop/WebGPU: 64 steps recommended
 * - Mobile/WebGL: 32 steps recommended
 * - Adjust stepCount based on device capabilities
 *
 * @param rayOrigin - Starting point of the ray
 * @param rayDirection - Normalized ray direction vector
 * @param sceneSDF - Function that returns distance to nearest surface at a point
 * @param stepCount - Maximum number of ray march steps (balance quality vs performance)
 * @returns Distance traveled along ray to hit point (negative if no hit)
 *
 * @example
 * ```typescript
 * const sceneSDF = Fn(([pos]: [TSLNode]) => {
 *   return tslSphereDistance(pos, vec3(0,0,0), float(0.5));
 * });
 *
 * const hitDist = tslRayMarch(rayOrigin, rayDir, sceneSDF, float(64));
 * If(hitDist.greaterThan(0), () => {
 *   const hitPoint = rayOrigin.add(rayDir.mul(hitDist));
 *   // Calculate lighting, color, etc.
 * });
 * ```
 */
export const tslRayMarch = (
  rayOrigin: TSLNode,
  rayDirection: TSLNode,
  sceneSDF: TSLNode,
  stepCount: TSLNode
): TSLNode => {
  if (!_tslRayMarch) {
    const { Fn, Loop, float, select, min } = getTSL();
    _tslRayMarch = Fn(
      ([origin, direction, sdf, steps]: [
        TSLNode,
        TSLNode,
        TSLNode,
        TSLNode
      ]) => {
        // Initialize accumulated distance traveled
        const t = float(0).toVar();
        // Use a large value initially - we'll track when we hit
        // Use 999999 to indicate "no hit found yet"
        const resultT = float(999999).toVar();

        // Ray marching loop - simplified approach
        Loop(steps, () => {
          // Current position along ray
          const currentPos = origin.add(direction.mul(t));

          // Sample distance field at current position
          const distance = sdf(currentPos);

          // If we're close to surface and this is the closest hit so far, record it
          // Use min to track the first t value where distance < EPSILON
          const isHit = distance.lessThan(float(RAY_MARCH_EPSILON));
          const isFirstHit = resultT.greaterThan(float(999998));
          const shouldRecord = isHit.and(isFirstHit);
          resultT.assign(select(shouldRecord, t, resultT));

          // Always advance (even after hit - but result is captured)
          // Use safe step to prevent getting stuck
          const safeStep = distance.max(float(0.001));
          // Only advance if not past max distance
          const newT = t.add(safeStep);
          t.assign(select(t.lessThan(float(RAY_MARCH_MAX_DIST)), newT, t));
        });

        // Return hit distance, or -1 if no hit was found
        return select(resultT.lessThan(float(999998)), resultT, float(-1));
      }
    );
  }
  return _tslRayMarch(rayOrigin, rayDirection, sceneSDF, stepCount);
};

// ============================================================================
// Surface Normal Calculation
// ============================================================================

// Cached TSL function instances for normal calculation
let _tslNormal: TSLNode;

/**
 * Calculate Surface Normal via Central Difference Gradient
 *
 * Computes the surface normal at a point on an SDF by sampling the distance field
 * in a small neighborhood and calculating the gradient. Uses central differences
 * for better accuracy than forward differences.
 *
 * The normal points outward from the surface (away from the interior of the object).
 *
 * @param point - Surface point to calculate normal at
 * @param sceneSDF - Function that returns distance to nearest surface at a point
 * @param epsilon - Sampling distance for gradient calculation (default: 0.001)
 * @returns Normalized surface normal vector
 *
 * @example
 * ```typescript
 * const sceneSDF = Fn(([pos]: [TSLNode]) => {
 *   return tslSphereDistance(pos, vec3(0,0,0), float(0.5));
 * });
 *
 * const hitPoint = rayOrigin.add(rayDir.mul(hitDistance));
 * const normal = tslNormal(hitPoint, sceneSDF);
 * const lightDir = normalize(uLightPosition);
 * const diffuse = max(dot(normal, lightDir), float(0));
 * ```
 */
export const tslNormal = (
  point: TSLNode,
  sceneSDF: TSLNode,
  epsilon?: TSLNode
): TSLNode => {
  if (!_tslNormal) {
    const { Fn, float, vec3, normalize } = getTSL();
    _tslNormal = Fn(([pt, sdf, eps]: [TSLNode, TSLNode, TSLNode]) => {
      // Use default epsilon if not provided
      const epsVal = eps || float(0.001);

      // Sample SDF at offset positions along each axis
      const offsetX = vec3(epsVal, float(0), float(0));
      const offsetY = vec3(float(0), epsVal, float(0));
      const offsetZ = vec3(float(0), float(0), epsVal);

      // Central difference gradient calculation
      // gradient.x = (f(x+eps) - f(x-eps)) / (2*eps)
      const gradX = sdf(pt.add(offsetX)).sub(sdf(pt.sub(offsetX)));
      const gradY = sdf(pt.add(offsetY)).sub(sdf(pt.sub(offsetY)));
      const gradZ = sdf(pt.add(offsetZ)).sub(sdf(pt.sub(offsetZ)));

      // Combine gradients into normal vector and normalize
      return normalize(vec3(gradX, gradY, gradZ));
    });
  }
  return _tslNormal(point, sceneSDF, epsilon);
};

// ============================================================================
// Lighting Utilities for Ray Marched Surfaces
// ============================================================================

// Cached TSL function instances for lighting
let _tslAmbientOcclusion: TSLNode;
let _tslSoftShadow: TSLNode;

/**
 * Ambient Occlusion via Distance Field Sampling
 *
 * Approximates ambient occlusion by sampling the distance field near the surface.
 * Points in crevices or near other geometry will have smaller distances, creating
 * darkening effects in occluded areas.
 *
 * @param point - Surface point to calculate AO at
 * @param normal - Surface normal vector
 * @param sceneSDF - Function that returns distance to nearest surface at a point
 * @param sampleCount - Number of AO samples (balance quality vs performance)
 * @returns Ambient occlusion factor (0 = fully occluded, 1 = no occlusion)
 *
 * @example
 * ```typescript
 * const ao = tslAmbientOcclusion(hitPoint, normal, sceneSDF, float(5));
 * const finalColor = baseColor.mul(ao);
 * ```
 */
export const tslAmbientOcclusion = (
  point: TSLNode,
  normal: TSLNode,
  sceneSDF: TSLNode,
  sampleCount: TSLNode
): TSLNode => {
  if (!_tslAmbientOcclusion) {
    const { Fn, Loop, float } = getTSL();
    _tslAmbientOcclusion = Fn(
      ([pt, norm, sdf, samples]: [TSLNode, TSLNode, TSLNode, TSLNode]) => {
        const occ = float(0).toVar();
        const weight = float(1).toVar();

        // Sample along the normal at increasing distances
        Loop(samples, ({ i }: { i: TSLNode }) => {
          const iFloat = float(i);

          // Distance increases quadratically for better near-surface detail
          const dist = float(0.01).add(float(0.015).mul(iFloat).mul(iFloat));

          // Sample SDF at offset position
          const h = sdf(pt.add(norm.mul(dist)));

          // Accumulate occlusion (difference between expected and actual distance)
          occ.addAssign(dist.sub(h).mul(weight));

          // Reduce weight for distant samples (exponential falloff)
          weight.mulAssign(0.85);
        });

        // Clamp result to valid range [0, 1]
        return float(1).sub(occ).clamp(0, 1);
      }
    );
  }
  return _tslAmbientOcclusion(point, normal, sceneSDF, sampleCount);
};

/**
 * Soft Shadows via Ray Marching
 *
 * Casts a shadow ray from the surface point toward the light source.
 * Tracks the minimum penumbra value during the march to create soft shadow edges.
 *
 * Based on Inigo Quilez's soft shadow technique:
 * https://iquilezles.org/articles/rmshadows/
 *
 * @param rayOrigin - Surface point (start of shadow ray)
 * @param rayDirection - Direction toward light source (normalized)
 * @param sceneSDF - Function that returns distance to nearest surface at a point
 * @param minT - Minimum travel distance (avoid self-shadowing, typical: 0.01)
 * @param maxT - Maximum shadow ray distance (typical: 10.0)
 * @param softness - Shadow softness factor (higher = softer, typical: 8-32)
 * @returns Shadow factor (0 = fully shadowed, 1 = fully lit)
 *
 * @example
 * ```typescript
 * const lightDir = normalize(uLightPosition.sub(hitPoint));
 * const shadow = tslSoftShadow(hitPoint, lightDir, sceneSDF, float(0.01), float(10), float(20));
 * const diffuse = max(dot(normal, lightDir), float(0)).mul(shadow);
 * ```
 */
export const tslSoftShadow = (
  rayOrigin: TSLNode,
  rayDirection: TSLNode,
  sceneSDF: TSLNode,
  minT: TSLNode,
  maxT: TSLNode,
  softness: TSLNode
): TSLNode => {
  if (!_tslSoftShadow) {
    const { Fn, Loop, float, min, select } = getTSL();
    _tslSoftShadow = Fn(
      ([origin, direction, sdf, tMin, tMax, soft]: [
        TSLNode,
        TSLNode,
        TSLNode,
        TSLNode,
        TSLNode,
        TSLNode
      ]) => {
        const result = float(1).toVar();
        const t = tMin.toVar();
        const stopped = float(0).toVar();

        // Ray march toward light
        Loop(float(20), () => {
          // Check stop conditions
          const reachedMax = t.greaterThanEqual(tMax);
          const h = sdf(origin.add(direction.mul(t)));
          const hitSurface = h.lessThan(float(RAY_MARCH_EPSILON));

          // Mark as stopped if any condition met
          const shouldStop = reachedMax.or(hitSurface).and(stopped.equal(0));
          stopped.assign(select(shouldStop, float(1), stopped));

          // Set result to 0 for hard shadow (only on first hit)
          result.assign(
            select(hitSurface.and(stopped.equal(1)), float(0), result)
          );

          // Update soft shadow factor (only if not stopped)
          const penumbra = min(result, soft.mul(h).div(t));
          result.assign(select(stopped.equal(0), penumbra, result));

          // Advance ray by the safe distance (only if not stopped)
          const newT = t.add(h);
          t.assign(select(stopped.equal(0), newT, t));
        });

        return result;
      }
    );
  }
  return _tslSoftShadow(
    rayOrigin,
    rayDirection,
    sceneSDF,
    minT,
    maxT,
    softness
  );
};

// ============================================================================
// Export Documentation
// ============================================================================

/**
 * TSL Ray Marching Utilities Quick Reference:
 *
 * 1. Signed Distance Functions (SDFs):
 *    - tslSphereDistance(point, center, radius) - Sphere SDF primitive
 *    - tslSmoothUnion(d1, d2, k) - Smooth minimum blending
 *
 * 2. Ray Marching Core:
 *    - tslRayMarch(origin, direction, sceneSDF, steps) - Main ray marching loop
 *    - Returns distance to hit point (negative if miss)
 *
 * 3. Surface Normals:
 *    - tslNormal(point, sceneSDF, epsilon?) - Calculate surface normal via gradient
 *
 * 4. Lighting Effects:
 *    - tslAmbientOcclusion(point, normal, sceneSDF, samples) - AO approximation
 *    - tslSoftShadow(origin, dir, sceneSDF, minT, maxT, softness) - Soft shadows
 *
 * Pattern for Ray Marched Materials:
 * ```typescript
 * // 1. Define scene SDF
 * const sceneSDF = Fn(([pos]: [TSLNode]) => {
 *   const sphere1 = tslSphereDistance(pos, center1, radius1);
 *   const sphere2 = tslSphereDistance(pos, center2, radius2);
 *   return tslSmoothUnion(sphere1, sphere2, smoothness);
 * });
 *
 * // 2. Ray march to find intersection
 * const hitDist = tslRayMarch(rayOrigin, rayDir, sceneSDF, stepCount);
 *
 * // 3. Calculate surface properties
 * const hitPoint = rayOrigin.add(rayDir.mul(hitDist));
 * const normal = tslNormal(hitPoint, sceneSDF);
 *
 * // 4. Apply lighting
 * const ao = tslAmbientOcclusion(hitPoint, normal, sceneSDF, float(5));
 * const shadow = tslSoftShadow(hitPoint, lightDir, sceneSDF, float(0.01), float(10), float(20));
 * const diffuse = max(dot(normal, lightDir), float(0)).mul(shadow);
 *
 * // 5. Combine into final color
 * const finalColor = baseColor.mul(ao).mul(diffuse);
 * ```
 *
 * Performance Tuning:
 * - Desktop/WebGPU: 64 ray march steps, 5-6 AO samples
 * - Mobile/WebGL: 32 ray march steps, 3 AO samples
 * - Disable soft shadows on low-power devices
 * - Use adaptive quality based on device capabilities
 */
