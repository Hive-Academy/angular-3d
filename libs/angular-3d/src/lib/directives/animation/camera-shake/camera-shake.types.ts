/**
 * @fileoverview Type definitions for the CameraShakeDirective.
 *
 * This module defines the interfaces for camera shake effects,
 * including configuration options and event payloads.
 *
 * @module camera-shake/types
 */

/**
 * Configuration options for camera shake effect.
 *
 * Controls the intensity, frequency, and behavior of the shake.
 * Can be passed to startShake() or triggerShake() methods.
 *
 * @example
 * ```typescript
 * const shakeConfig: CameraShakeConfig = {
 *   intensity: 0.1,
 *   frequency: 15,
 *   decay: 0.5,
 * };
 * ```
 */
export interface CameraShakeConfig {
  /**
   * Shake intensity in scene units.
   * Controls the maximum displacement of the camera.
   * Higher values = more violent shake.
   * @default 0.05
   */
  intensity: number;

  /**
   * Shake frequency (higher = faster oscillation).
   * Controls how rapidly the camera oscillates.
   * @default 10
   */
  frequency: number;

  /**
   * Decay rate per second (0 = no decay, 1 = instant decay).
   * When > 0, shake intensity decreases over time.
   * @default 0
   */
  decay: number;

  /**
   * Maximum offset in X axis.
   * If not specified, uses the intensity value.
   * @default intensity
   */
  maxX?: number;

  /**
   * Maximum offset in Y axis.
   * If not specified, uses intensity * 0.8 for slightly less vertical shake.
   * @default intensity * 0.8
   */
  maxY?: number;

  /**
   * Maximum offset in Z axis.
   * If not specified, no Z shake is applied.
   * @default 0
   */
  maxZ?: number;
}

/**
 * Shake event payload.
 *
 * Emitted when shake state changes (starts, stops, or updates).
 */
export interface CameraShakeEvent {
  /**
   * Whether shake is currently active.
   */
  isShaking: boolean;

  /**
   * Current shake intensity (may decrease if decay > 0).
   */
  currentIntensity: number;

  /**
   * Elapsed time since shake started (in seconds).
   */
  elapsedTime: number;
}

/**
 * Shake trigger options for one-shot shakes.
 *
 * Used with the triggerShake() method.
 */
export interface ShakeTriggerOptions {
  /**
   * Duration of the shake in seconds.
   * Shake will automatically stop after this time.
   */
  duration: number;

  /**
   * Override intensity for this trigger.
   * If not specified, uses directive's shakeIntensity input.
   */
  intensity?: number;

  /**
   * Override frequency for this trigger.
   * If not specified, uses directive's shakeFrequency input.
   */
  frequency?: number;

  /**
   * Apply decay over the duration.
   * If true, intensity fades to 0 over the duration.
   * @default true
   */
  fadeOut?: boolean;
}
