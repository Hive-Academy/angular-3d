import { getTSLFunctions } from './tsl-metaball-sdf';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * Calculate surface normal using central differences
 * @param sceneSDF - The scene SDF function to evaluate
 * @param pos - Surface position
 */
export function createCalcNormalFn(sceneSDF: (pos: TSLNode) => TSLNode) {
  const { Fn, vec3, normalize, float } = getTSLFunctions();

  return Fn(([pos]: [TSLNode]) => {
    const eps = float(0.001);
    const dx = sceneSDF(pos.add(vec3(eps, float(0), float(0)))).sub(
      sceneSDF(pos.sub(vec3(eps, float(0), float(0))))
    );
    const dy = sceneSDF(pos.add(vec3(float(0), eps, float(0)))).sub(
      sceneSDF(pos.sub(vec3(float(0), eps, float(0))))
    );
    const dz = sceneSDF(pos.add(vec3(float(0), float(0), eps))).sub(
      sceneSDF(pos.sub(vec3(float(0), float(0), eps)))
    );
    return normalize(vec3(dx, dy, dz));
  });
}

/**
 * Simplified ambient occlusion (2 samples to reduce shader complexity)
 * @param sceneSDF - The scene SDF function
 */
export function createAmbientOcclusionFn(sceneSDF: (pos: TSLNode) => TSLNode) {
  const { Fn, float, clamp } = getTSLFunctions();

  return Fn(([p, n]: [TSLNode, TSLNode]) => {
    const h1 = sceneSDF(p.add(n.mul(0.03)));
    const h2 = sceneSDF(p.add(n.mul(0.06)));
    const occ = float(0.03).sub(h1).add(float(0.06).sub(h2).mul(0.5));
    return clamp(float(1).sub(occ.mul(2)), float(0), float(1));
  });
}

/**
 * Calculate cursor glow effect for background
 * @param cursorPosition - Cursor world position uniform
 * @param glowRadius - Glow spread radius uniform
 * @param glowIntensity - Glow strength uniform
 */
export function createCursorGlowFn(
  cursorPosition: TSLNode,
  glowRadius: TSLNode,
  glowIntensity: TSLNode
) {
  const { Fn, float, length, smoothstep, pow } = getTSLFunctions();

  return Fn(([worldPos]: [TSLNode]) => {
    const dist = length(worldPos.xy.sub(cursorPosition.xy));
    const glow = float(1).sub(smoothstep(float(0), glowRadius, dist));
    return pow(glow, float(2)).mul(glowIntensity);
  });
}

/**
 * Soft shadow calculation (disabled by default for performance)
 * Returns 1.0 (no shadow) as TSL Loop is expensive
 */
export function createSoftShadowFn() {
  const { Fn, float } = getTSLFunctions();

  return Fn(
    ([_ro, _rd, _mint, _maxt, _k]: [
      TSLNode,
      TSLNode,
      TSLNode,
      TSLNode,
      TSLNode
    ]) => {
      // Return 1.0 (no shadow) to avoid expensive Loop + sceneSDF calls
      return float(1);
    }
  );
}
