/**
 * Animation Constants - Centralized defaults for reveal and entrance animations
 *
 * Provides named constants for magic numbers used in animation directives.
 * Improves code readability and makes tuning easier.
 *
 * @example
 * ```typescript
 * import { REVEAL_ANIMATION_DEFAULTS } from './animation-constants';
 *
 * // Use in scale-pop animation
 * obj.scale.setScalar(REVEAL_ANIMATION_DEFAULTS.HIDDEN_SCALE);
 *
 * // Use in rise-up animation
 * obj.position.y -= REVEAL_ANIMATION_DEFAULTS.RISE_UP_OFFSET;
 * ```
 */

/**
 * Default values for reveal animations (SceneRevealDirective)
 */
export const REVEAL_ANIMATION_DEFAULTS = {
  /**
   * Scale used for hidden state in scale-pop animation.
   * Near-zero but not zero to avoid rendering issues.
   */
  HIDDEN_SCALE: 0.01,

  /**
   * Y offset in world units for rise-up animation.
   * Object starts this many units below its final position.
   */
  RISE_UP_OFFSET: 2,

  /**
   * Default delay between staggered items in milliseconds.
   * Used by StaggerGroupService when no custom delay is provided.
   */
  STAGGER_DELAY_MS: 150,

  /**
   * Default duration for reveal animations in seconds.
   */
  FADE_DURATION: 0.8,

  /**
   * Back easing overshoot amount for scale-pop effect.
   * Creates the characteristic "pop" bounce.
   */
  SCALE_POP_OVERSHOOT: 1.4,

  /**
   * Default easing function for reveal animations.
   */
  DEFAULT_EASING: 'power2.out',
} as const;

/**
 * Default values for camera entrance animations (CinematicEntranceDirective)
 */
export const ENTRANCE_ANIMATION_DEFAULTS = {
  /**
   * Default duration for entrance animations in seconds.
   */
  DURATION: 2.5,

  /**
   * Default easing function for camera entrance.
   */
  EASING: 'power2.inOut',

  /**
   * Camera offset for dolly-in preset (units behind end position).
   */
  DOLLY_IN_OFFSET: 10,

  /**
   * Camera offset for orbit-drift preset (units right/up/back from end).
   */
  ORBIT_DRIFT_OFFSET: { x: 5, y: 2, z: 5 },

  /**
   * Camera offset for crane-up preset (units below end position).
   */
  CRANE_UP_OFFSET: 5,

  /**
   * Camera offset for fade-drift preset (units left of end position).
   */
  FADE_DRIFT_OFFSET: 3,

  /**
   * Subtle dolly-in offset for default/unspecified preset.
   */
  DEFAULT_DOLLY_OFFSET: 3,
} as const;
