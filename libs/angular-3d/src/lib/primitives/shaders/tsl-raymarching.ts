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
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';

// Re-export commonly used TSL functions for convenience
const {
  Fn,
  Loop,
  float,
  vec3,
  vec4,
  If,
  min,
  max,
  abs,
  length,
  normalize,
  smoothstep,
  pow,
  clamp,
  Break,
} = TSL;

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// TSL Fn helper with proper typing to avoid arg type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSLFn = Fn as any;

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
export const tslSphereDistance = TSLFn(
  ([point, center, radius]: [TSLNode, TSLNode, TSLNode]) => {
    return length(point.sub(center)).sub(radius);
  }
);

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
export const tslSmoothUnion = TSLFn(
  ([d1, d2, k]: [TSLNode, TSLNode, TSLNode]) => {
    // Polynomial smooth minimum (Inigo Quilez)
    const h = max(k.sub(abs(d1.sub(d2))), float(0)).div(k);
    return min(d1, d2).sub(h.mul(h).mul(k).mul(0.25));
  }
);

// ============================================================================
// Ray Marching Algorithm
// ============================================================================

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
export const tslRayMarch = TSLFn(
  ([rayOrigin, rayDirection, sceneSDF, stepCount]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    // Initialize accumulated distance traveled
    const t = float(0).toVar();

    // Ray marching loop using TSL Loop node
    // Pattern based on Three.js webgpu_volume_cloud example
    Loop(stepCount, ({ i }) => {
      // Current position along ray
      const currentPos = rayOrigin.add(rayDirection.mul(t));

      // Sample distance field at current position
      const distance = sceneSDF(currentPos);

      // Check if we hit the surface (within epsilon tolerance)
      If(distance.lessThan(float(RAY_MARCH_EPSILON)), () => {
        // Surface hit - exit loop early and return positive distance
        Break();
      });

      // Check if we've exceeded maximum distance
      If(t.greaterThan(float(RAY_MARCH_MAX_DIST)), () => {
        // No hit - exit loop and return negative to indicate miss
        t.assign(float(-1));
        Break();
      });

      // Advance ray by the safe distance (sphere tracing principle)
      t.addAssign(distance);
    });

    return t;
  }
);

// ============================================================================
// Surface Normal Calculation
// ============================================================================

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
export const tslNormal = TSLFn(
  ([point, sceneSDF, epsilon]: [TSLNode, TSLNode, TSLNode]) => {
    // Use default epsilon if not provided
    const eps = epsilon || float(0.001);

    // Sample SDF at offset positions along each axis
    const offsetX = vec3(eps, float(0), float(0));
    const offsetY = vec3(float(0), eps, float(0));
    const offsetZ = vec3(float(0), float(0), eps);

    // Central difference gradient calculation
    // gradient.x = (f(x+eps) - f(x-eps)) / (2*eps)
    const gradX = sceneSDF(point.add(offsetX)).sub(
      sceneSDF(point.sub(offsetX))
    );
    const gradY = sceneSDF(point.add(offsetY)).sub(
      sceneSDF(point.sub(offsetY))
    );
    const gradZ = sceneSDF(point.add(offsetZ)).sub(
      sceneSDF(point.sub(offsetZ))
    );

    // Combine gradients into normal vector and normalize
    return normalize(vec3(gradX, gradY, gradZ));
  }
);

// ============================================================================
// Lighting Utilities for Ray Marched Surfaces
// ============================================================================

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
export const tslAmbientOcclusion = TSLFn(
  ([point, normal, sceneSDF, sampleCount]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    const occ = float(0).toVar();
    const weight = float(1).toVar();

    // Sample along the normal at increasing distances
    Loop(sampleCount, ({ i }) => {
      const iFloat = float(i);

      // Distance increases quadratically for better near-surface detail
      const dist = float(0.01).add(float(0.015).mul(iFloat).mul(iFloat));

      // Sample SDF at offset position
      const h = sceneSDF(point.add(normal.mul(dist)));

      // Accumulate occlusion (difference between expected and actual distance)
      occ.addAssign(dist.sub(h).mul(weight));

      // Reduce weight for distant samples (exponential falloff)
      weight.mulAssign(0.85);
    });

    // Clamp result to valid range [0, 1]
    return float(1).sub(occ).clamp(0, 1);
  }
);

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
export const tslSoftShadow = TSLFn(
  ([rayOrigin, rayDirection, sceneSDF, minT, maxT, softness]: [
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode,
    TSLNode
  ]) => {
    const result = float(1).toVar();
    const t = minT.toVar();

    // Ray march toward light
    Loop(float(20), ({ i }) => {
      // Stop if we've reached max distance
      If(t.greaterThanEqual(maxT), () => {
        Break();
      });

      // Sample distance field
      const h = sceneSDF(rayOrigin.add(rayDirection.mul(t)));

      // Check for hard shadow (hit surface)
      If(h.lessThan(float(RAY_MARCH_EPSILON)), () => {
        result.assign(0);
        Break();
      });

      // Update soft shadow factor (penumbra calculation)
      result.assign(min(result, softness.mul(h).div(t)));

      // Advance ray by the safe distance
      t.addAssign(h);
    });

    return result;
  }
);

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
