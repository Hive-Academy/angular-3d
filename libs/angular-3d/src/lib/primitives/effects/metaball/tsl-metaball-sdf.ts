// TSL SDF Primitives for Metaball Ray Marching
import * as TSL from 'three/tsl';

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * Get TSL functions at runtime to avoid race conditions with WebGPU init
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getTSLFunctions(): any {
  const {
    Fn,
    Loop,
    float,
    vec2,
    vec3,
    vec4,
    uniform,
    min,
    max,
    abs,
    dot,
    pow,
    sin,
    cos,
    length,
    normalize,
    smoothstep,
    clamp,
    mix,
    exp,
    select,
    screenUV,
    screenSize,
  } = TSL;

  if (!Fn || !select) {
    throw new Error(
      'TSL functions not available. Ensure WebGPU context is initialized.'
    );
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Fn: Fn as any,
    Loop,
    float,
    vec2,
    vec3,
    vec4,
    uniform,
    min,
    max,
    abs,
    dot,
    pow,
    sin,
    cos,
    length,
    normalize,
    smoothstep,
    clamp,
    mix,
    exp,
    select,
    screenUV,
    screenSize,
  };
}

/**
 * SDF for a single sphere
 * @param p - Point to evaluate
 * @param center - Sphere center position
 * @param radius - Sphere radius
 */
export function tslSphereSDF(
  p: TSLNode,
  center: TSLNode,
  radius: TSLNode
): TSLNode {
  const { length } = getTSLFunctions();
  return length(p.sub(center)).sub(radius);
}

/**
 * Smooth minimum for metaball blending (Inigo Quilez technique)
 * Creates organic, blobby connections between shapes
 * @param a - First distance
 * @param b - Second distance
 * @param k - Smoothness factor (higher = smoother blend)
 */
export function tslSmin(a: TSLNode, b: TSLNode, k: TSLNode): TSLNode {
  const { max, min, float } = getTSLFunctions();
  const { abs } = TSL;
  const h = max(k.sub(abs(a.sub(b))), float(0)).div(k);
  return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
}

/**
 * Convert normalized screen coordinates (0-1) to world space
 * Must match ray marching coordinate system:
 * - Ray origin: screenCoords = uvSource - 0.5, adjustedUV = screenCoords * aspect, rayOrigin = adjustedUV * 2
 * - So normalized 0→world -aspect, normalized 1→world +aspect for X
 * @param resolution - Screen resolution uniform
 */
export function createScreenToWorldFn(resolution: TSLNode) {
  const { Fn, vec3, float } = getTSLFunctions();

  return Fn(([normalizedX, normalizedY]: [TSLNode, TSLNode]) => {
    // Convert 0-1 to -0.5 to +0.5 (same as uvSource - 0.5 in ray march)
    const screenX = normalizedX.sub(float(0.5));
    const screenY = normalizedY.sub(float(0.5));
    // Apply aspect ratio (same as adjustedUV = screenCoords * aspect)
    const aspect = resolution.x.div(resolution.y);
    // Scale by 2 (same as rayOrigin = adjustedUV * 2)
    return vec3(screenX.mul(aspect).mul(2), screenY.mul(2), float(0));
  });
}

/**
 * JavaScript version of screenToWorld for CPU-side calculations
 * Must match TSL createScreenToWorldFn exactly
 */
export function screenToWorldJS(
  normalizedX: number,
  normalizedY: number,
  aspectRatio?: number
): [number, number, number] {
  const aspect =
    aspectRatio ??
    (typeof window !== 'undefined'
      ? window.innerWidth / window.innerHeight
      : 16 / 9);

  // Match TSL: screenX = normalizedX - 0.5, then * aspect * 2
  const screenX = normalizedX - 0.5;
  const screenY = normalizedY - 0.5;

  return [screenX * aspect * 2.0, screenY * 2.0, 0.0];
}
