/**
 * Viewport 3D Positioning Type Definitions
 *
 * Maps familiar CSS-like positioning to 3D world space coordinates.
 * Designed for web developers who think in viewport dimensions, not arbitrary 3D coordinates.
 */

/**
 * Named viewport positions (CSS-like)
 *
 * Provides 9 pre-defined position anchors similar to CSS positioning:
 * - Corners: top-left, top-right, bottom-left, bottom-right
 * - Edges: top-center, middle-left, middle-right, bottom-center
 * - Center: center
 *
 * @example
 * ```typescript
 * const position: NamedPosition = 'top-right';
 * ```
 */
export type NamedPosition =
  | 'center'
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'middle-left'
  | 'middle-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

/**
 * Percentage-based position (0-1 or '0%'-'100%')
 *
 * Supports both string percentage ('50%') and decimal (0.5) formats.
 * Origin is top-left corner (like CSS), with positive Y going down.
 *
 * @example
 * ```typescript
 * // Center using percentages
 * const pos1: PercentagePosition = { x: '50%', y: '50%' };
 *
 * // Center using decimals
 * const pos2: PercentagePosition = { x: 0.5, y: 0.5 };
 *
 * // Quarter from left, three-quarters from top
 * const pos3: PercentagePosition = { x: 0.25, y: 0.75 };
 * ```
 */
export interface PercentagePosition {
  /** X position: '50%' or 0.5 for center */
  x: string | number;
  /** Y position: '25%' or 0.25 for quarter from top */
  y: string | number;
}

/**
 * Pixel-based position (absolute screen coordinates)
 *
 * Uses absolute pixel coordinates from top-left corner.
 * Coordinates are converted to world units based on viewport dimensions.
 *
 * @example
 * ```typescript
 * // 100 pixels from left, 50 pixels from top
 * const pos: PixelPosition = { x: 100, y: 50 };
 * ```
 */
export interface PixelPosition {
  /** Pixels from left edge */
  x: number;
  /** Pixels from top edge */
  y: number;
}

/**
 * Position offset in world units
 *
 * Additional displacement applied after base position calculation.
 * Useful for fine-tuning positions or creating depth layers.
 *
 * @example
 * ```typescript
 * // Offset 2 units right, 1 unit up, 5 units back
 * const offset: PositionOffset = {
 *   offsetX: 2,
 *   offsetY: 1,
 *   offsetZ: -5
 * };
 * ```
 */
export interface PositionOffset {
  /** Additional X offset in world units */
  offsetX?: number;
  /** Additional Y offset in world units */
  offsetY?: number;
  /** Additional Z offset in world units */
  offsetZ?: number;
}

/**
 * Options for pixel-based positioning
 *
 * Extends PositionOffset with pixel-specific configuration.
 * Controls unit interpretation and viewport size reference.
 *
 * @example
 * ```typescript
 * const options: PixelPositionOptions = {
 *   unit: 'viewport',
 *   offsetX: 2,
 *   offsetZ: -10
 * };
 * ```
 */
export interface PixelPositionOptions extends PositionOffset {
  /** Unit interpretation (default: 'viewport') */
  unit?: 'px' | 'viewport' | 'world';
  /** Override viewport width (default: window.innerWidth) */
  viewportWidth?: number;
  /** Override viewport height (default: window.innerHeight) */
  viewportHeight?: number;
}

/**
 * Viewport configuration for advanced usage
 *
 * Provides full control over viewport calculations.
 * Typically not needed when using SceneGraphStore integration.
 *
 * @example
 * ```typescript
 * const config: ViewportConfig = {
 *   fov: 75,
 *   cameraZ: 20,
 *   viewportZ: 0,
 *   aspect: 16 / 9
 * };
 * ```
 */
export interface ViewportConfig {
  /** Camera field of view in degrees */
  fov: number;
  /** Camera Z position */
  cameraZ: number;
  /** Viewport plane Z position (default: 0) */
  viewportZ?: number;
  /** Aspect ratio (default: window aspect) */
  aspect?: number;
}
