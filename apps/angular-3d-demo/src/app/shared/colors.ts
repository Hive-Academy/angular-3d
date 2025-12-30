/**
 * Color constants for 3D scenes
 *
 * Using number literals (0xRRGGBB) for Three.js color inputs.
 * These are decimal representations of hex colors.
 */
export const SCENE_COLORS = {
  // Primary palette
  black: 0x000000,
  white: 0xffffff,
  indigo: 0x6366f1,
  neonGreen: 0xa1ff4f,
  pink: 0xec4899,
  amber: 0xf59e0b,
  emerald: 0x10b981,
  violet: 0x8b5cf6,
  red: 0xef4444,
  blue: 0x3b82f6,
  teal: 0x14b8a6,
  orange: 0xf97316,
  cyan: 0x06b6d4,

  // Space scene specific
  deepBlue: 0x2244ff,
  softGray: 0x9ca3af,
  skyBlue: 0x0088ff,
  magenta: 0xd946ef,
  mintGreen: 0x4fffdf,
  hotPink: 0xff6bd4,
  purple: 0x8b5cf6,
} as const;

/**
 * Color strings for components that require CSS hex format (e.g., NebulaVolumetricComponent)
 */
export const SCENE_COLOR_STRINGS = {
  skyBlue: '#0088ff',
  neonGreen: '#a1ff4f',
  white: '#ffffff',
  purple: '#8b5cf6',
  hotPink: '#ff6bd4',
  cyan: '#06b6d4',
} as const;

export type SceneColor = (typeof SCENE_COLORS)[keyof typeof SCENE_COLORS];
