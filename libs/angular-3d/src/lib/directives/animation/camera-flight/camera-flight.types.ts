/**
 * @fileoverview Type definitions for the CameraFlightDirective.
 *
 * This module defines the interfaces for camera waypoint navigation,
 * including waypoint configuration, navigation state, and event payloads.
 *
 * @module camera-flight/types
 */

/**
 * Defines a camera waypoint for flight navigation.
 *
 * A waypoint represents a specific camera position and orientation
 * that the camera can fly to. Waypoints are connected sequentially
 * to form a navigable flight path.
 *
 * @example
 * ```typescript
 * const waypoint: CameraWaypoint = {
 *   id: 'hero-main',
 *   position: [0, 0, 16],
 *   lookAt: [0, 0, 0],
 *   duration: 2,
 *   ease: 'power2.inOut',
 * };
 * ```
 */
export interface CameraWaypoint {
  /**
   * Unique identifier for this waypoint.
   * Used for tracking, event payloads, and debugging.
   */
  id: string;

  /**
   * Camera position at this waypoint as [x, y, z] tuple.
   * This is where the camera will be positioned when arriving at this waypoint.
   */
  position: [number, number, number];

  /**
   * Camera lookAt target as [x, y, z] tuple.
   * This is the point the camera will focus on when at this waypoint.
   * Also used to sync OrbitControls target after arrival.
   */
  lookAt: [number, number, number];

  /**
   * Duration in seconds to fly TO this waypoint from the previous one.
   * Controls the speed of the camera animation.
   * @default 2
   */
  duration?: number;

  /**
   * GSAP easing function name for the flight animation to this waypoint.
   * Supports all standard GSAP easing functions.
   * @default 'power2.inOut'
   * @see https://gsap.com/docs/v3/Eases
   */
  ease?: string;

  /**
   * Optional FOV (Field of View) override for this waypoint.
   * Useful for creating zoom effects at specific destinations.
   * If not specified, camera FOV remains unchanged during flight.
   * Only applies to PerspectiveCamera.
   */
  fov?: number;
}

/**
 * Current state of waypoint navigation.
 *
 * Exposed via the directive's navigationStateChange output for external
 * state tracking and UI synchronization. This interface provides a
 * complete snapshot of the current navigation state.
 *
 * @example
 * ```typescript
 * onNavigationStateChange(state: WaypointNavigationState) {
 *   this.canFlyForward.set(state.canFlyForward);
 *   this.canFlyBackward.set(state.canFlyBackward);
 *   this.isFlying.set(state.isFlying);
 * }
 * ```
 */
export interface WaypointNavigationState {
  /**
   * Current waypoint index.
   * Represents where the camera is currently located or was last at.
   * Updated when a waypoint is reached.
   */
  currentIndex: number;

  /**
   * Target waypoint index.
   * Represents where the camera is flying to during active navigation.
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
 * Payload emitted when a waypoint is reached.
 *
 * Emitted via the waypointReached output after the camera completes
 * its flight animation and arrives at a waypoint.
 *
 * @example
 * ```typescript
 * onWaypointReached(event: WaypointReachedEvent) {
 *   console.log(`Arrived at waypoint ${event.index}: ${event.waypoint.id}`);
 *   this.activeWaypoint.set(event.index);
 * }
 * ```
 */
export interface WaypointReachedEvent {
  /**
   * Index of the reached waypoint in the waypoints array.
   */
  index: number;

  /**
   * The complete waypoint data for the reached waypoint.
   */
  waypoint: CameraWaypoint;

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
 * onProgressChange(event: FlightProgressEvent) {
 *   this.warpIntensity.set(event.progress);
 * }
 * ```
 */
export interface FlightProgressEvent {
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
 * Configuration options for CameraFlightDirective.
 *
 * This interface defines all available configuration options for
 * the camera flight directive. While the directive uses individual
 * inputs, this interface is useful for type-safe configuration objects.
 *
 * @example
 * ```typescript
 * const flightConfig: CameraFlightConfig = {
 *   waypoints: [
 *     { id: 'start', position: [0, 0, 16], lookAt: [0, 0, 0] },
 *     { id: 'destination', position: [-15, 3, 8], lookAt: [-20, 2, -5] },
 *   ],
 *   holdButton: 2,      // right-click
 *   backwardKey: 'KeyQ',
 *   initAtFirstWaypoint: true,
 *   controlsEnableDelay: 300,
 * };
 * ```
 */
export interface CameraFlightConfig {
  /**
   * Waypoints defining the flight path.
   * At least 2 waypoints are required for navigation.
   * The camera will start at waypoints[0] if initAtFirstWaypoint is true.
   */
  waypoints: CameraWaypoint[];

  /**
   * Mouse button for forward flight (hold to fly).
   * - 0: Left mouse button
   * - 1: Middle mouse button
   * - 2: Right mouse button
   * @default 2 (right-click)
   */
  holdButton?: number;

  /**
   * Key code for backward navigation.
   * Uses the KeyboardEvent.code format.
   * @default 'KeyQ'
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code
   */
  backwardKey?: string;

  /**
   * Whether to position the camera at the first waypoint on initialization.
   * If false, the camera's current position is preserved on init.
   * @default true
   */
  initAtFirstWaypoint?: boolean;

  /**
   * Delay in milliseconds after arriving at a waypoint before
   * re-enabling OrbitControls.
   *
   * This delay allows visual effects (like warp lines) to fade out
   * and content to settle before the user can interact with the scene.
   * @default 300
   */
  controlsEnableDelay?: number;
}
