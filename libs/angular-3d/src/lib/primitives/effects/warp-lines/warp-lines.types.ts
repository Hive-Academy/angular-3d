/**
 * @fileoverview Type definitions for the WarpLinesComponent.
 *
 * This module defines the configuration interface for the warp speed lines
 * effect used during camera flight navigation.
 *
 * @module warp-lines/types
 */

/**
 * Configuration for WarpLinesComponent.
 *
 * Defines the visual properties of the warp speed lines effect.
 * All properties are optional with sensible defaults for typical use cases.
 * The effect is designed to create a sense of high-speed movement during
 * camera flight animations.
 *
 * @example
 * ```typescript
 * const warpConfig: WarpLinesConfig = {
 *   lineCount: 250,
 *   color: '#00ffff',
 *   lineLength: 2.5,
 *   stretchMultiplier: 6,
 *   spreadRadius: 25,
 * };
 * ```
 *
 * @example
 * ```html
 * <a3d-warp-lines
 *   [intensity]="isFlying() ? 1 : 0"
 *   [lineCount]="250"
 *   [color]="'#00ffff'"
 *   [lineLength]="2.5"
 *   [stretchMultiplier]="6"
 *   [spreadRadius]="25"
 * />
 * ```
 */
export interface WarpLinesConfig {
  /**
   * Number of speed lines to render.
   *
   * Higher values create a denser effect but may impact performance.
   * Recommended range: 100-400 for most use cases.
   *
   * @default 200
   */
  lineCount?: number;

  /**
   * Line color as a CSS color string or hex value.
   *
   * Works with any valid CSS color format:
   * - Hex: '#ffffff', '#00ffcc'
   * - Named: 'white', 'cyan'
   * - RGB: 'rgb(255, 255, 255)'
   *
   * @default '#ffffff'
   */
  color?: string;

  /**
   * Base length of lines in world units.
   *
   * This is the line length at rest (intensity = 0).
   * Lines stretch based on stretchMultiplier when intensity > 0.
   *
   * @default 2
   */
  lineLength?: number;

  /**
   * Maximum stretch multiplier at full intensity.
   *
   * When intensity = 1, line length becomes lineLength * stretchMultiplier.
   * Higher values create a more dramatic speed effect.
   *
   * @default 5
   */
  stretchMultiplier?: number;

  /**
   * Spread radius around the camera path (cylinder radius).
   *
   * Lines are distributed in a cylindrical area around the camera's
   * flight path. Larger values spread lines further from the center.
   *
   * @default 20
   */
  spreadRadius?: number;

  /**
   * Depth range in which lines are distributed.
   *
   * Lines spawn randomly within this Z-range relative to the camera.
   * Larger values create depth but may affect performance.
   *
   * @default 50
   */
  depthRange?: number;

  /**
   * Fade duration when intensity changes (milliseconds).
   *
   * Controls how quickly lines fade in/out when intensity changes.
   * Lower values create snappier transitions; higher values are smoother.
   *
   * @default 300
   */
  transitionDuration?: number;
}
