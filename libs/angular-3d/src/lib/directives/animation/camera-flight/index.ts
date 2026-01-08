/**
 * Camera Flight Module Public API
 *
 * Provides waypoint-based camera navigation with hold-to-fly controls.
 * Coordinates with OrbitControls for seamless user experience.
 *
 * @module camera-flight
 */

// Main directive
export { CameraFlightDirective } from './camera-flight.directive';

// Type definitions
export type {
  CameraWaypoint,
  WaypointNavigationState,
  WaypointReachedEvent,
  FlightProgressEvent,
  CameraFlightConfig,
} from './camera-flight.types';
