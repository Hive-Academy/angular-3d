/**
 * SpaceFlight3dDirective - Cinematic Space Flight Animation
 *
 * Creates smooth, cinematic flight paths with multi-phase waypoint navigation.
 * Perfect for camera movements, object flybys, or guided tours through 3D scenes.
 *
 * Features:
 * - Multi-waypoint flight paths with configurable duration and easing per segment
 * - Smooth interpolation between waypoints with easing functions
 * - Continuous rotation during flight for cinematic effect
 * - Infinite loop support with seamless restart
 * - Lifecycle events: animationStarted, animationComplete, waypointReached
 * - Optional auto-start with configurable delay
 * - Programmatic control: start(), stop()
 *
 * @example
 * ```html
 * <!-- Simple circular flight path -->
 * <a3d-box
 *   a3dSpaceFlight3d
 *   [flightPath]="[
 *     { position: [5, 0, 0], duration: 2 },
 *     { position: [0, 0, 5], duration: 2 },
 *     { position: [-5, 0, 0], duration: 2 },
 *     { position: [0, 0, -5], duration: 2 }
 *   ]"
 *   [rotationsPerCycle]="8"
 *   [loop]="true"
 * />
 *
 * <!-- With easing and events -->
 * <a3d-gltf-model
 *   a3dSpaceFlight3d
 *   [flightPath]="complexPath"
 *   [autoStart]="false"
 *   [delay]="1000"
 *   (animationStarted)="onFlightStart()"
 *   (waypointReached)="onWaypointReached($event)"
 *   (animationComplete)="onFlightComplete()"
 * />
 * ```
 */

import {
  Directive,
  input,
  output,
  inject,
  DestroyRef,
  afterNextRender,
  computed,
} from '@angular/core';
import type { Object3D } from 'three/webgpu';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * Waypoint configuration for space flight path
 */
export interface SpaceFlightWaypoint {
  /** Target position [x, y, z] in Three.js units */
  position: [number, number, number];
  /** Duration to reach this waypoint from previous position (in seconds) */
  duration: number;
  /** Easing function for this segment (default: 'easeInOut') */
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}

/**
 * SpaceFlight3dDirective
 *
 * Animates 3D objects along a multi-waypoint flight path with smooth interpolation,
 * continuous rotation, and lifecycle events. Integrates with RenderLoopService for
 * per-frame updates and SceneGraphStore for direct object manipulation.
 */
@Directive({
  selector: '[a3dSpaceFlight3d]',
  standalone: true,
})
export class SpaceFlight3dDirective {
  // Configuration inputs
  public readonly flightPath = input<SpaceFlightWaypoint[]>([]);
  public readonly rotationsPerCycle = input<number>(8);
  public readonly loop = input<boolean>(true);
  public readonly autoStart = input<boolean>(true);
  public readonly delay = input<number>(0);

  // Event outputs
  public readonly animationStarted = output<void>();
  public readonly animationComplete = output<void>();
  public readonly waypointReached = output<{
    index: number;
    position: [number, number, number];
  }>();

  // DI
  private readonly renderLoop = inject(RenderLoopService);
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // Animation state
  private isAnimating = false;
  private currentWaypointIndex = 0;
  private waypointProgress = 0; // 0-1 progress to current waypoint
  private totalRotation = 0; // Accumulated rotation
  private startPosition: [number, number, number] | null = null;

  // Computed signal for object access
  private readonly object3D = computed(() => {
    if (!this.objectId) return null;
    return this.store.getObject<Object3D>(this.objectId);
  });

  public constructor() {
    afterNextRender(() => {
      // Auto-start if configured and flight path provided
      if (this.autoStart() && this.flightPath().length > 0) {
        setTimeout(() => this.start(), this.delay() * 1000);
      }

      // Register render loop callback
      const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
        if (!this.isAnimating) return;
        this.updateFlight(delta);
      });

      this.destroyRef.onDestroy(() => {
        cleanup();
        this.stop();
      });
    });
  }

  /**
   * Start the flight animation
   */
  public start(): void {
    const path = this.flightPath();
    if (path.length === 0) {
      console.warn(
        '[SpaceFlight3dDirective] Cannot start: flightPath is empty'
      );
      return;
    }

    // Store initial position if not already set
    if (!this.startPosition) {
      const obj = this.object3D();
      if (obj) {
        this.startPosition = [obj.position.x, obj.position.y, obj.position.z];
      }
    }

    this.isAnimating = true;
    this.currentWaypointIndex = 0;
    this.waypointProgress = 0;
    this.totalRotation = 0;
    this.animationStarted.emit();
  }

  /**
   * Stop the flight animation and reset to start position
   */
  public stop(): void {
    this.isAnimating = false;

    // Reset position to start if available
    if (this.startPosition) {
      const obj = this.object3D();
      if (obj) {
        obj.position.set(...this.startPosition);
        obj.rotation.y = 0;
      }
    }
  }

  /**
   * Update flight animation per frame
   */
  private updateFlight(delta: number): void {
    const obj = this.object3D();
    if (!obj) return;

    const path = this.flightPath();
    if (path.length === 0) return;

    const currentWaypoint = path[this.currentWaypointIndex];
    const nextWaypointIndex = (this.currentWaypointIndex + 1) % path.length;
    const nextWaypoint = path[nextWaypointIndex];

    // Update progress (0 to 1)
    this.waypointProgress += delta / currentWaypoint.duration;

    // Apply easing to progress
    const easedProgress = this.applyEasing(
      Math.min(this.waypointProgress, 1),
      currentWaypoint.easing || 'easeInOut'
    );

    // Determine start position for interpolation
    let startPos: [number, number, number];
    if (
      this.currentWaypointIndex === 0 &&
      this.waypointProgress < delta / currentWaypoint.duration
    ) {
      // First frame of first waypoint - use initial position or last waypoint
      startPos =
        this.startPosition ||
        (path.length > 1
          ? path[path.length - 1].position
          : currentWaypoint.position);
    } else {
      startPos = currentWaypoint.position;
    }

    // Interpolate position
    const newPosition: [number, number, number] = [
      startPos[0] + (nextWaypoint.position[0] - startPos[0]) * easedProgress,
      startPos[1] + (nextWaypoint.position[1] - startPos[1]) * easedProgress,
      startPos[2] + (nextWaypoint.position[2] - startPos[2]) * easedProgress,
    ];

    // Update rotation (continuous rotation based on total cycle duration)
    const totalDuration = this.getTotalDuration();
    const rotationSpeed =
      (Math.PI * 2 * this.rotationsPerCycle()) / totalDuration;
    this.totalRotation += delta * rotationSpeed;

    // Update object position and rotation directly
    obj.position.set(...newPosition);
    obj.rotation.y = this.totalRotation;

    // Check waypoint completion
    if (this.waypointProgress >= 1) {
      this.waypointReached.emit({
        index: nextWaypointIndex,
        position: nextWaypoint.position,
      });

      this.currentWaypointIndex = nextWaypointIndex;
      this.waypointProgress = 0;

      // Check cycle completion (reached start again)
      if (this.currentWaypointIndex === 0) {
        if (!this.loop()) {
          this.isAnimating = false;
          this.animationComplete.emit();
        } else {
          // Reset rotation for seamless loop
          // Optional: you can reset or let it accumulate
        }
      }
    }
  }

  /**
   * Apply easing function to linear progress (0-1)
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return 1 - (1 - t) * (1 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }

  /**
   * Calculate total duration of all waypoints
   * Guards against zero/invalid duration to prevent division by zero
   */
  private getTotalDuration(): number {
    const duration = this.flightPath().reduce(
      (sum, wp) => sum + wp.duration,
      0
    );

    if (duration <= 0) {
      console.warn(
        '[SpaceFlight3d] Invalid total duration (zero or negative), using default 1s. ' +
          'Check flightPath waypoints have positive duration values.'
      );
      return 1; // Minimum 1 second to prevent division by zero
    }

    return duration;
  }

  /**
   * Check if animation is currently playing
   */
  public isPlaying(): boolean {
    return this.isAnimating;
  }
}
