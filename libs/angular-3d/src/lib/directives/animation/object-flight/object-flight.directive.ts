/**
 * ObjectFlightDirective - Waypoint-based Object Animation for Three.js Scenes
 *
 * Provides smooth object animation between predefined waypoints.
 * Mirrors the CameraFlightDirective API for consistency, but animates
 * Object3D instances instead of the camera.
 *
 * Features:
 * - Sequential waypoint navigation
 * - Configurable duration and easing per waypoint
 * - Optional rotation and scale animation
 * - Signal-based reactive state management
 * - Progress events for driving visual effects (like warp lines)
 * - Reduced motion support (instant jumps instead of animated flight)
 * - Automatic lifecycle management with DestroyRef
 *
 * @example
 * ```html
 * <!-- Basic usage with waypoints -->
 * <a3d-sphere
 *   a3dObjectFlight
 *   [waypoints]="objectWaypoints"
 *   [defaultDuration]="1.5"
 *   (flightStart)="onFlightStart()"
 *   (flightEnd)="onFlightEnd()"
 *   (waypointReached)="onWaypointReached($event)"
 *   (progressChange)="onProgressChange($event)"
 * />
 * ```
 *
 * @example
 * ```typescript
 * // In component
 * @Component({
 *   template: `
 *     <a3d-scene-3d>
 *       <a3d-sphere
 *         #sphere
 *         a3dObjectFlight
 *         [waypoints]="waypoints"
 *         (waypointReached)="onWaypointReached($event)"
 *       />
 *     </a3d-scene-3d>
 *   `
 * })
 * export class MyComponent {
 *   @ViewChild('sphere', { read: ObjectFlightDirective })
 *   objectFlight!: ObjectFlightDirective;
 *
 *   waypoints: ObjectWaypoint[] = [
 *     { id: 'start', position: [0, 0, 0] },
 *     { id: 'center', position: [5, 2, 0], duration: 2 },
 *     { id: 'end', position: [10, 0, 0], duration: 1.5, ease: 'power3.out' },
 *   ];
 *
 *   flyToNext(): void {
 *     this.objectFlight.flyNext();
 *   }
 * }
 * ```
 *
 * @module object-flight
 */

import {
  Directive,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Object3D } from 'three/webgpu';
import { SceneService } from '../../../canvas/scene.service';
import { NG_3D_PARENT } from '../../../types/tokens';
import type {
  ObjectWaypoint,
  ObjectFlightState,
  ObjectWaypointReachedEvent,
  ObjectFlightProgressEvent,
} from './object-flight.types';

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * ObjectFlightDirective
 *
 * Applies waypoint-based animation to 3D objects.
 * The directive must be attached to a component that provides
 * an Object3D via the NG_3D_PARENT token or has a mesh property.
 */
@Directive({
  selector: '[a3dObjectFlight]',
  standalone: true,
})
export class ObjectFlightDirective {
  // ================================
  // Dependency Injection
  // ================================

  /** Scene service for demand-based rendering */
  private readonly sceneService = inject(SceneService, { optional: true });

  /** Parent Object3D to animate */
  private readonly parent = inject(NG_3D_PARENT, { optional: true });

  /** DestroyRef for cleanup registration */
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // Inputs (Signal-based)
  // ================================

  /**
   * Array of waypoints defining the flight path.
   * At least 2 waypoints are required for navigation.
   */
  public readonly waypoints = input.required<ObjectWaypoint[]>();

  /**
   * Enable/disable flight controls.
   * When disabled, flight methods are ignored.
   * @default true
   */
  public readonly enabled = input<boolean>(true);

  /**
   * Starting waypoint index.
   * Object will be positioned at this waypoint on initialization.
   * @default 0
   */
  public readonly startIndex = input<number>(0);

  /**
   * Default duration in seconds for waypoints without explicit duration.
   * @default 1.5
   */
  public readonly defaultDuration = input<number>(1.5);

  /**
   * Default easing for waypoints without explicit ease.
   * @default 'power2.inOut'
   */
  public readonly defaultEase = input<string>('power2.inOut');

  /**
   * Auto-play through all waypoints on initialization.
   * @default false
   */
  public readonly autoPlay = input<boolean>(false);

  /**
   * Loop back to start after reaching the last waypoint (only if autoPlay).
   * @default false
   */
  public readonly loop = input<boolean>(false);

  // ================================
  // Outputs
  // ================================

  /**
   * Emitted when flight begins.
   * Use to trigger visual effects like warp lines.
   */
  public readonly flightStart = output<void>();

  /**
   * Emitted when flight ends (waypoint reached).
   */
  public readonly flightEnd = output<void>();

  /**
   * Emitted when object arrives at a waypoint.
   * Contains waypoint index, data, and travel direction.
   */
  public readonly waypointReached = output<ObjectWaypointReachedEvent>();

  /**
   * Emitted during flight with progress updates (0-1).
   * Use to drive progress-dependent effects.
   */
  public readonly progressChange = output<ObjectFlightProgressEvent>();

  /**
   * Emitted when navigation state changes.
   * Provides complete snapshot for external state synchronization.
   */
  public readonly navigationStateChange = output<ObjectFlightState>();

  // ================================
  // Internal State (Signals)
  // ================================

  /** Current waypoint index (where object is or was last) */
  private readonly currentWaypointIndex = signal(0);

  /** Target waypoint index during flight */
  private readonly targetWaypointIndex = signal(0);

  /** Flight in progress flag */
  private readonly isFlying = signal(false);

  /** Current flight direction */
  private readonly flightDirection = signal<'forward' | 'backward' | 'none'>(
    'none'
  );

  /** Flight progress 0-1 within current segment */
  private readonly flightProgress = signal(0);

  /** Internal destroyed state for async safety checks */
  private readonly isDestroyed = signal(false);

  // ================================
  // Internal State (Mutable)
  // ================================

  /** GSAP timeline for object animation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;

  /** Reference to the Object3D being animated */
  private object3D: Object3D | null = null;

  /** Flag tracking initialization state */
  private initialized = false;

  // ================================
  // Constructor & Lifecycle
  // ================================

  public constructor() {
    // Effect: Validate waypoints on change
    effect(() => {
      const wps = this.waypoints();
      if (wps.length < 2) {
        console.warn(
          '[ObjectFlightDirective] At least 2 waypoints are required for navigation. Flight disabled.'
        );
      }
    });

    // Effect: Initialize object position
    effect(() => {
      const wps = this.waypoints();

      // Skip if already destroyed or invalid waypoints
      if (this.isDestroyed() || wps.length < 2) return;

      // Get Object3D reference
      if (!this.object3D) {
        this.object3D = this.parent?.() ?? null;
      }

      // Initialize at start index ONLY ONCE
      if (!this.initialized && this.object3D) {
        const startIdx = this.startIndex();
        if (startIdx >= 0 && startIdx < wps.length) {
          const startWp = wps[startIdx];
          this.currentWaypointIndex.set(startIdx);
          this.targetWaypointIndex.set(startIdx);

          // Set initial position
          this.object3D.position.set(
            startWp.position[0],
            startWp.position[1],
            startWp.position[2]
          );

          // Set initial rotation if specified
          if (startWp.rotation) {
            this.object3D.rotation.set(
              startWp.rotation[0],
              startWp.rotation[1],
              startWp.rotation[2]
            );
          }

          // Set initial scale if specified
          if (startWp.scale) {
            const scale =
              typeof startWp.scale === 'number'
                ? [startWp.scale, startWp.scale, startWp.scale]
                : startWp.scale;
            this.object3D.scale.set(scale[0], scale[1], scale[2]);
          }

          this.initialized = true;

          // Emit initial navigation state
          this.emitNavigationStateChange();

          // Auto-play if enabled
          if (this.autoPlay() && wps.length > 1) {
            this.flyNext();
          }
        }
      }
    });

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.isDestroyed.set(true);
      this.cleanup();
    });
  }

  // ================================
  // Public API
  // ================================

  /**
   * Get current navigation state (read-only snapshot).
   *
   * @returns Complete navigation state for external tracking
   *
   * @example
   * ```typescript
   * const state = this.objectFlight.getNavigationState();
   * if (state.canFlyForward) {
   *   console.log('Can fly to next waypoint');
   * }
   * ```
   */
  public getNavigationState(): ObjectFlightState {
    const wps = this.waypoints();
    const currentIdx = this.currentWaypointIndex();

    return {
      currentIndex: currentIdx,
      targetIndex: this.targetWaypointIndex(),
      direction: this.flightDirection(),
      isFlying: this.isFlying(),
      progress: this.flightProgress(),
      canFlyForward: currentIdx < wps.length - 1,
      canFlyBackward: currentIdx > 0,
    };
  }

  /**
   * Fly to next waypoint.
   *
   * @example
   * ```typescript
   * this.objectFlight.flyNext();
   * ```
   */
  public async flyNext(): Promise<void> {
    const currentIdx = this.currentWaypointIndex();
    const wps = this.waypoints();

    if (currentIdx >= wps.length - 1) {
      // At last waypoint - check for loop
      if (this.loop() && this.autoPlay()) {
        await this.flyToWaypoint(0);
      }
      return;
    }

    await this.flyToWaypoint(currentIdx + 1);
  }

  /**
   * Fly to previous waypoint.
   *
   * @example
   * ```typescript
   * this.objectFlight.flyPrevious();
   * ```
   */
  public async flyPrevious(): Promise<void> {
    const currentIdx = this.currentWaypointIndex();

    if (currentIdx <= 0) return;

    await this.flyToWaypoint(currentIdx - 1);
  }

  /**
   * Programmatically fly to a specific waypoint index.
   *
   * Useful for UI navigation buttons or external triggers.
   * Animates the object to the target waypoint.
   *
   * @param index - Target waypoint index
   *
   * @example
   * ```typescript
   * // Fly to waypoint 2
   * this.objectFlight.flyToWaypoint(2);
   * ```
   */
  public async flyToWaypoint(index: number): Promise<void> {
    if (!this.enabled()) return;

    const wps = this.waypoints();
    if (index < 0 || index >= wps.length) {
      console.warn(
        `[ObjectFlightDirective] Invalid waypoint index: ${index}. Valid range: 0-${
          wps.length - 1
        }`
      );
      return;
    }

    const currentIdx = this.currentWaypointIndex();
    if (index === currentIdx || this.isFlying()) return;

    const direction = index > currentIdx ? 'forward' : 'backward';
    const from = wps[currentIdx];
    const to = wps[index];

    this.targetWaypointIndex.set(index);
    this.isFlying.set(true);
    this.flightDirection.set(direction);

    this.flightStart.emit();
    this.emitNavigationStateChange();

    // Handle reduced motion
    if (this.prefersReducedMotion()) {
      this.jumpToWaypoint(index);
      return;
    }

    // Create and play timeline
    const timeline = await this.createFlightTimeline(
      from,
      to,
      direction,
      index
    );
    if (timeline) {
      this.timeline = timeline;
      this.timeline.play();
    }
  }

  /**
   * Instantly jump to a waypoint without animation.
   *
   * Useful for initial setup, reduced motion mode, or programmatic positioning.
   *
   * @param index - Target waypoint index
   *
   * @example
   * ```typescript
   * // Jump to waypoint 1 instantly
   * this.objectFlight.jumpToWaypoint(1);
   * ```
   */
  public jumpToWaypoint(index: number): void {
    const wps = this.waypoints();

    if (index < 0 || index >= wps.length || !this.object3D) return;

    const currentIdx = this.currentWaypointIndex();
    const direction =
      index === currentIdx
        ? 'none'
        : index > currentIdx
        ? 'forward'
        : 'backward';

    const waypoint = wps[index];

    // Set position instantly
    this.object3D.position.set(
      waypoint.position[0],
      waypoint.position[1],
      waypoint.position[2]
    );

    // Set rotation if specified
    if (waypoint.rotation) {
      this.object3D.rotation.set(
        waypoint.rotation[0],
        waypoint.rotation[1],
        waypoint.rotation[2]
      );
    }

    // Set scale if specified
    if (waypoint.scale) {
      const scale =
        typeof waypoint.scale === 'number'
          ? [waypoint.scale, waypoint.scale, waypoint.scale]
          : waypoint.scale;
      this.object3D.scale.set(scale[0], scale[1], scale[2]);
    }

    // Invalidate for demand-based rendering
    this.sceneService?.invalidate();

    // Trigger arrival handling
    this.onWaypointArrival(index, direction === 'none' ? 'forward' : direction);
  }

  /**
   * Pause the current flight animation.
   */
  public pauseFlight(): void {
    if (this.timeline && !this.timeline.paused()) {
      this.timeline.pause();
    }
  }

  /**
   * Resume a paused flight animation.
   */
  public resumeFlight(): void {
    if (this.timeline && this.timeline.paused() && this.isFlying()) {
      this.timeline.play();
    }
  }

  // ================================
  // Private Methods - GSAP Timeline
  // ================================

  /**
   * Create GSAP timeline for flying between two waypoints.
   */
  private async createFlightTimeline(
    _from: ObjectWaypoint,
    to: ObjectWaypoint,
    direction: 'forward' | 'backward',
    toIndex: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    if (!this.object3D) {
      console.error('[ObjectFlightDirective] Object3D not available');
      return null;
    }

    // Dynamic GSAP import for tree-shaking optimization
    let gsap: typeof import('gsap').gsap;
    try {
      const gsapModule = await import('gsap');
      gsap = gsapModule.gsap;
    } catch (error) {
      console.error('[ObjectFlightDirective] Failed to load GSAP:', error);
      // Fallback: jump to destination
      this.jumpToWaypoint(toIndex);
      return null;
    }

    // Safety check: directive may have been destroyed during async import
    if (this.isDestroyed()) {
      return null;
    }

    const duration = to.duration ?? this.defaultDuration();
    const ease = to.ease ?? this.defaultEase();

    // Create timeline
    const timeline = gsap.timeline({
      paused: true,
      onUpdate: () => {
        // Calculate and emit progress
        const progress = timeline.progress();
        this.flightProgress.set(progress);
        this.progressChange.emit({
          progress,
          fromIndex: this.currentWaypointIndex(),
          toIndex: this.targetWaypointIndex(),
        });

        // Invalidate for demand-based rendering
        this.sceneService?.invalidate();
      },
      onComplete: () => {
        // Use captured toIndex instead of reading signal (avoids timing issues)
        this.onWaypointArrival(toIndex, direction);
      },
    });

    // Animate position
    timeline.to(
      this.object3D.position,
      {
        x: to.position[0],
        y: to.position[1],
        z: to.position[2],
        duration,
        ease,
      },
      0
    );

    // Animate rotation if specified
    if (to.rotation) {
      timeline.to(
        this.object3D.rotation,
        {
          x: to.rotation[0],
          y: to.rotation[1],
          z: to.rotation[2],
          duration,
          ease,
        },
        0
      );
    }

    // Animate scale if specified
    if (to.scale) {
      const scale =
        typeof to.scale === 'number'
          ? { x: to.scale, y: to.scale, z: to.scale }
          : { x: to.scale[0], y: to.scale[1], z: to.scale[2] };

      timeline.to(
        this.object3D.scale,
        {
          ...scale,
          duration,
          ease,
        },
        0
      );
    }

    return timeline;
  }

  /**
   * Handle arrival at a waypoint.
   */
  private onWaypointArrival(
    index: number,
    direction: 'forward' | 'backward'
  ): void {
    const wps = this.waypoints();
    const waypoint = wps[index];

    if (!waypoint) return;

    // Update state signals
    this.currentWaypointIndex.set(index);
    this.isFlying.set(false);
    this.flightDirection.set('none');
    this.flightProgress.set(0);

    // Clean up timeline
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    // Emit events
    this.flightEnd.emit();
    this.waypointReached.emit({ index, waypoint, direction });
    this.emitNavigationStateChange();

    // Auto-play to next waypoint if enabled
    if (this.autoPlay()) {
      const canContinue =
        direction === 'forward' ? index < wps.length - 1 : index > 0;

      if (canContinue || this.loop()) {
        // Small delay before next flight
        setTimeout(() => {
          if (!this.isDestroyed()) {
            this.flyNext();
          }
        }, 100);
      }
    }
  }

  // ================================
  // Private Methods - Utilities
  // ================================

  /**
   * Emit current navigation state change event.
   */
  private emitNavigationStateChange(): void {
    this.navigationStateChange.emit(this.getNavigationState());
  }

  /**
   * Check if user prefers reduced motion.
   */
  private prefersReducedMotion(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    return (
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    );
  }

  /**
   * Cleanup all resources.
   */
  private cleanup(): void {
    // Kill GSAP timeline
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    // Clear references
    this.object3D = null;
  }
}
