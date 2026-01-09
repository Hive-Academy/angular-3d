/**
 * @fileoverview Type definitions for the ObjectFlightDirective.
 *
 * This module defines the interfaces for object waypoint navigation,
 * including waypoint configuration, navigation state, and event payloads.
 *
 * @module object-flight/types
 */

/**
 * Defines an object waypoint for flight animation.
 *
 * A waypoint represents a specific position (and optionally rotation/scale)
 * that an object can fly to. Waypoints are connected sequentially
 * to form a navigable flight path.
 *
 * @example
 * ```typescript
 * const waypoint: ObjectWaypoint = {
 *   id: 'center',
 *   position: [0, 0, 0],
 *   duration: 2,
 *   ease: 'power2.inOut',
 * };
 * ```
 */
export interface ObjectWaypoint {
  /**
   * Unique identifier for this waypoint.
   * Used for tracking, event payloads, and debugging.
   */
  id: string;

  /**
   * Target position at this waypoint as [x, y, z] tuple.
   * This is where the object will be positioned when arriving at this waypoint.
   */
  position: [number, number, number];

  /**
   * Optional rotation at this waypoint as [x, y, z] Euler angles (in radians).
   * If not specified, rotation remains unchanged during flight.
   */
  rotation?: [number, number, number];

  /**
   * Optional scale at this waypoint.
   * Can be a uniform number or [x, y, z] tuple for non-uniform scaling.
   * If not specified, scale remains unchanged during flight.
   */
  scale?: [number, number, number] | number;

  /**
   * Duration in seconds to fly TO this waypoint from the previous one.
   * Controls the speed of the object animation.
   * @default Uses directive's defaultDuration (1.5)
   */
  duration?: number;

  /**
   * GSAP easing function name for the flight animation to this waypoint.
   * Supports all standard GSAP easing functions.
   * @default Uses directive's defaultEase ('power2.inOut')
   * @see https://gsap.com/docs/v3/Eases
   */
  ease?: string;
}

/**
 * Current state of object flight navigation.
 *
 * Exposed via the directive's navigationStateChange output for external
 * state tracking and UI synchronization. This interface provides a
 * complete snapshot of the current navigation state.
 *
 * @example
 * ```typescript
 * onNavigationStateChange(state: ObjectFlightState) {
 *   this.canFlyForward.set(state.canFlyForward);
 *   this.canFlyBackward.set(state.canFlyBackward);
 *   this.isFlying.set(state.isFlying);
 * }
 * ```
 */
export interface ObjectFlightState {
  /**
   * Current waypoint index.
   * Represents where the object is currently located or was last at.
   * Updated when a waypoint is reached.
   */
  currentIndex: number;

  /**
   * Target waypoint index.
   * Represents where the object is flying to during active navigation.
   * Same as currentIndex when not flying.
   */
  targetIndex: number;

  /**
   * Direction of current or last flight.
   * - 'forward': Flying to a higher-indexed waypoint
   * - 'backward': Flying to a lower-indexed waypoint
   * - 'none': No flight in progress or has occurred
   */
  direction: 'forward' | 'backward' | 'none';

  /**
   * Whether a flight animation is currently in progress.
   * True from flightStart until waypointReached.
   */
  isFlying: boolean;

  /**
   * Progress within current flight segment (0-1).
   * 0 at flight start, 1 when arriving at destination.
   * Only meaningful when isFlying is true.
   */
  progress: number;

  /**
   * Whether forward navigation is available.
   * False when at the last waypoint.
   */
  canFlyForward: boolean;

  /**
   * Whether backward navigation is available.
   * False when at the first waypoint.
   */
  canFlyBackward: boolean;
}

/**
 * Payload emitted when an object reaches a waypoint.
 *
 * Emitted via the waypointReached output after the object completes
 * its flight animation and arrives at a waypoint.
 *
 * @example
 * ```typescript
 * onWaypointReached(event: ObjectWaypointReachedEvent) {
 *   console.log(`Arrived at waypoint ${event.index}: ${event.waypoint.id}`);
 *   this.activeWaypoint.set(event.index);
 * }
 * ```
 */
export interface ObjectWaypointReachedEvent {
  /**
   * Index of the reached waypoint in the waypoints array.
   */
  index: number;

  /**
   * The complete waypoint data for the reached waypoint.
   */
  waypoint: ObjectWaypoint;

  /**
   * Direction of travel that led to this waypoint.
   * Indicates whether the user flew forward or backward to reach this point.
   */
  direction: 'forward' | 'backward';
}

/**
 * Payload emitted when flight progress changes.
 *
 * Emitted via the progressChange output during flight animation.
 * Useful for driving progress indicators, warp effects, or other
 * progress-dependent visuals.
 *
 * @example
 * ```typescript
 * onProgressChange(event: ObjectFlightProgressEvent) {
 *   this.warpIntensity.set(event.progress);
 * }
 * ```
 */
export interface ObjectFlightProgressEvent {
  /**
   * Progress within current segment (0-1).
   * 0 at the start of flight, 1 upon arrival at destination.
   */
  progress: number;

  /**
   * Starting waypoint index for this flight segment.
   */
  fromIndex: number;

  /**
   * Target waypoint index for this flight segment.
   */
  toIndex: number;
}

/**
 * Configuration options for ObjectFlightDirective.
 *
 * This interface defines all available configuration options for
 * the object flight directive. While the directive uses individual
 * inputs, this interface is useful for type-safe configuration objects.
 *
 * @example
 * ```typescript
 * const flightConfig: ObjectFlightConfig = {
 *   waypoints: [
 *     { id: 'start', position: [0, 0, 0] },
 *     { id: 'end', position: [10, 0, 0], duration: 2 },
 *   ],
 *   defaultDuration: 1.5,
 *   defaultEase: 'power2.inOut',
 * };
 * ```
 */
export interface ObjectFlightConfig {
  /**
   * Waypoints defining the flight path.
   * At least 2 waypoints are required for navigation.
   * The object will start at waypoints[startIndex] on initialization.
   */
  waypoints: ObjectWaypoint[];

  /**
   * Default duration in seconds for waypoints without explicit duration.
   * @default 1.5
   */
  defaultDuration?: number;

  /**
   * Default easing for waypoints without explicit ease.
   * @default 'power2.inOut'
   */
  defaultEase?: string;

  /**
   * Starting waypoint index.
   * @default 0
   */
  startIndex?: number;

  /**
   * Auto-play through all waypoints on initialization.
   * @default false
   */
  autoPlay?: boolean;

  /**
   * Loop back to start after reaching the last waypoint (only if autoPlay).
   * @default false
   */
  loop?: boolean;
}
