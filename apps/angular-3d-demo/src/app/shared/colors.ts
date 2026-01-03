/**
 * Color definitions for 3D scenes
 *
 * Single source of truth - hex strings that can be converted to numbers.
 * Three.js accepts both hex strings and numbers for colors.
 */
const COLOR_DEFINITIONS = {
  // Neutrals
  black: '#000000',
  white: '#ffffff',
  softGray: '#9ca3af',

  // Primary palette (Tailwind-inspired)
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  pink: '#ec4899',
  magenta: '#d946ef',

  // Space/neon accents
  neonGreen: '#a1ff4f',
  mintGreen: '#4fffdf',
  hotPink: '#ff6bd4',
  skyBlue: '#0088ff',
  deepBlue: '#2244ff',
  electricPurple: '#6b21a8',
} as const;

/**
 * Convert hex string to number for Three.js
 */
function hexToNumber(hex: string): number {
  return parseInt(hex.slice(1), 16);
}

/**
 * Color strings for components that require CSS hex format
 * (e.g., NebulaVolumetricComponent, CSS styles)
 */
export const SCENE_COLOR_STRINGS = COLOR_DEFINITIONS;

/**
 * Color numbers for Three.js components that prefer numeric input
 * (e.g., MeshBasicMaterial, lights)
 */
export const SCENE_COLORS = Object.fromEntries(
  Object.entries(COLOR_DEFINITIONS).map(([key, value]) => [
    key,
    hexToNumber(value),
  ])
) as { [K in keyof typeof COLOR_DEFINITIONS]: number };

export type SceneColorName = keyof typeof COLOR_DEFINITIONS;
export type SceneColor = (typeof SCENE_COLORS)[SceneColorName];
export type SceneColorString = (typeof SCENE_COLOR_STRINGS)[SceneColorName];
