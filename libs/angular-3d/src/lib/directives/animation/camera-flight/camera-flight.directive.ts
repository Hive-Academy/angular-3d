/**
 * CameraFlightDirective - Waypoint-based Camera Navigation for Three.js Scenes
 *
 * Provides hold-to-fly camera navigation between predefined waypoints.
 * Coordinates with OrbitControls to disable during flight and sync target after.
 * Uses GSAP for smooth camera animation with pause/resume capability.
 *
 * Features:
 * - Hold-to-fly forward navigation (left-click by default)
 * - Key-press backward navigation (Q key by default)
 * - Pause/resume flight on mouse release/hold
 * - Signal-based reactive state management
 * - OrbitControls coordination (disable during flight, sync target after)
 * - Progress events for driving visual effects (like warp lines)
 * - Reduced motion support (instant jumps instead of animated flight)
 * - Automatic lifecycle management with DestroyRef
 *
 * @example
 * ```html
 * <!-- Basic usage with waypoints -->
 * <a3d-orbit-controls
 *   a3dCameraFlight
 *   [waypoints]="waypoints"
 *   [enabled]="flightEnabled()"
 *   (flightStart)="onFlightStart()"
 *   (flightEnd)="onFlightEnd()"
 *   (waypointReached)="onWaypointReached($event)"
 *   (navigationStateChange)="onNavigationStateChange($event)"
 *   (controlsReady)="onControlsReady($event)"
 * />
 * ```
 *
 * @example
 * ```typescript
 * // In component with OrbitControls coordination
 * @Component({
 *   template: `
 *     <a3d-scene-3d>
 *       <a3d-orbit-controls
 *         a3dCameraFlight
 *         [waypoints]="waypoints"
 *         (controlsReady)="onControlsReady($event)"
 *         (waypointReached)="onWaypointReached($event)"
 *       />
 *     </a3d-scene-3d>
 *   `
 * })
 * export class HeroComponent {
 *   @ViewChild(CameraFlightDirective) flightDirective!: CameraFlightDirective;
 *
 *   waypoints: CameraWaypoint[] = [
 *     { id: 'start', position: [0, 0, 16], lookAt: [0, 0, 0] },
 *     { id: 'destination', position: [-15, 3, 8], lookAt: [-20, 2, -5], duration: 2.5 },
 *   ];
 *
 *   onControlsReady(controls: OrbitControls): void {
 *     this.flightDirective.setOrbitControls(controls);
 *   }
 *
 *   onWaypointReached(event: WaypointReachedEvent): void {
 *     this.activeWaypoint.set(event.index);
 *   }
 * }
 * ```
 *
 * @module camera-flight
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
import { PerspectiveCamera } from 'three/webgpu';
import { OrbitControls } from 'three-stdlib';
import { SceneService } from '../../../canvas/scene.service';
import type {
  CameraWaypoint,
  WaypointNavigationState,
  WaypointReachedEvent,
  FlightProgressEvent,
} from './camera-flight.types';

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * CameraFlightDirective
 *
 * Applies hold-to-fly camera navigation between waypoints.
 * Coordinates with OrbitControls by disabling them during flight
 * and syncing the target position after arrival.
 */
@Directive({
  selector: '[a3dCameraFlight]',
  standalone: true,
})
export class CameraFlightDirective {
  // ================================
  // Dependency Injection
  // ================================

  /** Scene service for camera access and demand-based rendering */
  private readonly sceneService = inject(SceneService, { optional: true });

  /** DestroyRef for cleanup registration */
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // Inputs (Signal-based)
  // ================================

  /**
   * Array of waypoints defining the flight path.
   * At least 2 waypoints are required for navigation.
   */
  public readonly waypoints = input.required<CameraWaypoint[]>();

  /**
   * Enable/disable flight controls.
   * When disabled, mouse and keyboard events are ignored.
   * @default true
   */
  public readonly enabled = input<boolean>(true);

  /**
   * Mouse button for forward flight (hold to fly).
   * - 0: Left mouse button
   * - 1: Middle mouse button
   * - 2: Right mouse button
   * @default 0 (left-click)
   */
  public readonly holdButton = input<number>(0);

  /**
   * Key code for backward navigation.
   * Uses KeyboardEvent.code format.
   * @default 'KeyQ'
   */
  public readonly backwardKey = input<string>('KeyQ');

  /**
   * Starting waypoint index.
   * Camera will be positioned at this waypoint on initialization.
   * @default 0
   */
  public readonly startIndex = input<number>(0);

  /**
   * Delay in milliseconds after arriving at a waypoint before
   * re-enabling OrbitControls.
   * Allows visual effects to fade out before user interaction.
   * @default 300
   */
  public readonly controlsEnableDelay = input<number>(300);

  // ================================
  // Outputs
  // ================================

  /**
   * Emitted when flight begins (mouse down hold or backward key press).
   * Use to trigger visual effects like warp lines.
   */
  public readonly flightStart = output<void>();

  /**
   * Emitted when flight ends (waypoint reached).
   * Note: Does NOT emit on pause (mouse release mid-flight).
   */
  public readonly flightEnd = output<void>();

  /**
   * Emitted when camera arrives at a waypoint.
   * Contains waypoint index, data, and travel direction.
   */
  public readonly waypointReached = output<WaypointReachedEvent>();

  /**
   * Emitted during flight with progress updates (0-1).
   * Use to drive progress-dependent effects.
   */
  public readonly progressChange = output<FlightProgressEvent>();

  /**
   * Emitted when navigation state changes.
   * Provides complete snapshot for external state synchronization.
   */
  public readonly navigationStateChange = output<WaypointNavigationState>();

  // ================================
  // Internal State (Signals)
  // ================================

  /** Current waypoint index (where camera is or was last) */
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

  /** GSAP timeline for camera animation - using any for dynamic import compatibility */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private timeline: any = null;

  /** OrbitControls reference for coordination */
  private orbitControls: OrbitControls | null = null;

  /** Original OrbitControls enabled state (to restore after flight) */
  private originalControlsEnabled = true;

  /** LookAt proxy object for smooth target interpolation during flight */
  private lookAtProxy = { x: 0, y: 0, z: 0 };

  /** Flag tracking if event listeners have been set up */
  private listenersSetup = false;

  // Event handler references for cleanup
  private contextMenuHandler: ((e: MouseEvent) => void) | null = null;
  private mouseDownHandler: ((e: MouseEvent) => void) | null = null;
  private mouseUpHandler: ((e: MouseEvent) => void) | null = null;
  private mouseLeaveHandler: (() => void) | null = null;
  private keyDownHandler: ((e: KeyboardEvent) => void) | null = null;

  // ================================
  // Constructor & Lifecycle
  // ================================

  public constructor() {
    // Effect: Validate waypoints on change
    effect(() => {
      const wps = this.waypoints();
      if (wps.length < 2) {
        console.warn(
          '[CameraFlightDirective] At least 2 waypoints are required for navigation. Flight disabled.'
        );
      }
    });

    // Effect: Initialize camera position and setup listeners
    effect(() => {
      const wps = this.waypoints();
      const camera = this.sceneService?.camera();

      // Skip if already destroyed, no camera, or invalid waypoints
      if (this.isDestroyed() || !camera || wps.length < 2) return;

      // Initialize at start index if not already positioned
      const startIdx = this.startIndex();
      if (startIdx >= 0 && startIdx < wps.length) {
        const startWp = wps[startIdx];
        this.currentWaypointIndex.set(startIdx);
        this.targetWaypointIndex.set(startIdx);

        // Initialize lookAt proxy
        this.lookAtProxy.x = startWp.lookAt[0];
        this.lookAtProxy.y = startWp.lookAt[1];
        this.lookAtProxy.z = startWp.lookAt[2];
      }

      // Setup event listeners once (only mark as setup if successful)
      if (!this.listenersSetup) {
        this.listenersSetup = this.setupEventListeners();
      }

      // Emit initial navigation state
      this.emitNavigationStateChange();
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
   * Set OrbitControls reference for coordination.
   *
   * Controls will be disabled during flight and re-enabled after,
   * with target synced to the final lookAt position.
   *
   * @param controls - OrbitControls instance from OrbitControlsComponent
   *
   * @example
   * ```typescript
   * onControlsReady(controls: OrbitControls): void {
   *   this.flightDirective.setOrbitControls(controls);
   * }
   * ```
   */
  public setOrbitControls(controls: OrbitControls): void {
    this.orbitControls = controls;
  }

  /**
   * Get current navigation state (read-only snapshot).
   *
   * @returns Complete navigation state for external tracking
   *
   * @example
   * ```typescript
   * const state = this.flightDirective.getNavigationState();
   * if (state.canFlyForward) {
   *   console.log('Can fly to next waypoint');
   * }
   * ```
   */
  public getNavigationState(): WaypointNavigationState {
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
   * Programmatically fly to a specific waypoint index.
   *
   * Useful for UI navigation buttons or external triggers.
   * Animates the camera to the target waypoint.
   *
   * @param index - Target waypoint index
   *
   * @example
   * ```typescript
   * // Fly to waypoint 2
   * this.flightDirective.flyToWaypoint(2);
   * ```
   */
  public async flyToWaypoint(index: number): Promise<void> {
    const wps = this.waypoints();
    if (index < 0 || index >= wps.length) {
      console.warn(
        `[CameraFlightDirective] Invalid waypoint index: ${index}. Valid range: 0-${
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

    this.disableOrbitControls();
    this.flightStart.emit();
    this.emitNavigationStateChange();

    // Handle reduced motion
    if (this.prefersReducedMotion()) {
      this.jumpToWaypoint(index);
      return;
    }

    // Create and play timeline (auto-plays, not hold-based)
    const timeline = await this.createFlightTimeline(from, to, direction);
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
   * this.flightDirective.jumpToWaypoint(1);
   * ```
   */
  public jumpToWaypoint(index: number): void {
    const wps = this.waypoints();
    const camera = this.sceneService?.camera();

    if (index < 0 || index >= wps.length || !camera) return;

    const currentIdx = this.currentWaypointIndex();
    const direction =
      index === currentIdx
        ? 'none'
        : index > currentIdx
        ? 'forward'
        : 'backward';

    const waypoint = wps[index];

    // Set camera position and lookAt instantly
    camera.position.set(
      waypoint.position[0],
      waypoint.position[1],
      waypoint.position[2]
    );
    camera.lookAt(waypoint.lookAt[0], waypoint.lookAt[1], waypoint.lookAt[2]);

    // Update lookAt proxy
    this.lookAtProxy.x = waypoint.lookAt[0];
    this.lookAtProxy.y = waypoint.lookAt[1];
    this.lookAtProxy.z = waypoint.lookAt[2];

    // Invalidate for demand-based rendering
    this.sceneService?.invalidate();

    // Trigger arrival handling
    this.onWaypointArrival(index, direction === 'none' ? 'forward' : direction);
  }

  // ================================
  // Private Methods - Flight Control
  // ================================

  /**
   * Start forward flight from current position toward next waypoint.
   * Called on mouse hold (left-click by default).
   */
  private async startForwardFlight(): Promise<void> {
    const wps = this.waypoints();
    const currentIdx = this.currentWaypointIndex();
    const nextIdx = currentIdx + 1;

    console.log('[CameraFlight] startForwardFlight called', {
      currentIdx,
      nextIdx,
      waypointCount: wps.length,
      orbitControlsAvailable: !!this.orbitControls,
    });

    // Validate we can fly forward
    if (nextIdx >= wps.length || wps.length < 2) {
      console.warn(
        '[CameraFlight] Cannot fly forward - invalid waypoint index'
      );
      return;
    }

    const from = wps[currentIdx];
    const to = wps[nextIdx];

    this.targetWaypointIndex.set(nextIdx);
    this.isFlying.set(true);
    this.flightDirection.set('forward');

    this.disableOrbitControls();
    this.flightStart.emit();
    this.emitNavigationStateChange();

    // Handle reduced motion
    if (this.prefersReducedMotion()) {
      console.log(
        '[CameraFlight] Reduced motion enabled - jumping to waypoint'
      );
      this.jumpToWaypoint(nextIdx);
      return;
    }

    // Create timeline (starts paused for hold-to-fly)
    console.log('[CameraFlight] Creating flight timeline...');
    try {
      const timelinePromise = this.createFlightTimeline(from, to, 'forward');
      console.log(
        '[CameraFlight] createFlightTimeline called, awaiting promise...'
      );

      timelinePromise.then(
        (result) =>
          console.log('[CameraFlight] Promise resolved with:', !!result),
        (err) => console.error('[CameraFlight] Promise rejected with:', err)
      );

      const timeline = await timelinePromise;
      console.log('[CameraFlight] await completed, timeline:', !!timeline);

      if (timeline) {
        this.timeline = timeline;
        console.log('[CameraFlight] About to call timeline.play()...');
        this.timeline.play();
        console.log('[CameraFlight] Timeline created and playing!');
      } else {
        console.error(
          '[CameraFlight] Failed to create timeline - returned null'
        );
      }
    } catch (error) {
      console.error(
        '[CameraFlight] Error in startForwardFlight after createFlightTimeline:',
        error
      );
    }
  }

  /**
   * Start backward flight from current position toward previous waypoint.
   * Called on backward key press (Q by default).
   * Note: Backward flight auto-plays (not hold-based for simpler UX).
   */
  private async startBackwardFlight(): Promise<void> {
    const wps = this.waypoints();
    const currentIdx = this.currentWaypointIndex();
    const prevIdx = currentIdx - 1;

    // Validate we can fly backward
    if (prevIdx < 0 || wps.length < 2) return;

    const from = wps[currentIdx];
    const to = wps[prevIdx];

    this.targetWaypointIndex.set(prevIdx);
    this.isFlying.set(true);
    this.flightDirection.set('backward');

    this.disableOrbitControls();
    this.flightStart.emit();
    this.emitNavigationStateChange();

    // Handle reduced motion
    if (this.prefersReducedMotion()) {
      this.jumpToWaypoint(prevIdx);
      return;
    }

    // Create and play timeline (auto-plays, not hold-based)
    const timeline = await this.createFlightTimeline(from, to, 'backward');
    if (timeline) {
      this.timeline = timeline;
      this.timeline.play();
    }
  }

  /**
   * Pause the current flight animation.
   * Called on mouse release during forward flight.
   * Note: Does NOT emit flightEnd - user can resume by holding again.
   */
  private pauseFlight(): void {
    if (this.timeline && !this.timeline.paused()) {
      this.timeline.pause();
      // Note: We don't emit flightEnd here because the camera is mid-flight
      // and the user can resume by holding the mouse button again
    }
  }

  /**
   * Resume a paused flight animation.
   * Called when mouse is held again after releasing mid-flight.
   */
  private resumeFlight(): void {
    if (this.timeline && this.timeline.paused() && this.isFlying()) {
      this.timeline.play();
    }
  }

  // ================================
  // Private Methods - GSAP Timeline
  // ================================

  /**
   * Create GSAP timeline for flying between two waypoints.
   *
   * Animates camera position and lookAt target in parallel.
   * Handles FOV animation if specified in target waypoint.
   * Emits progress events during animation.
   *
   * @param from - Starting waypoint
   * @param to - Target waypoint
   * @param direction - Flight direction for event payload
   * @returns Promise resolving to GSAP timeline, or null if creation failed
   */
  private async createFlightTimeline(
    from: CameraWaypoint,
    to: CameraWaypoint,
    direction: 'forward' | 'backward'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    console.log('[CameraFlight] createFlightTimeline', {
      from: from.id,
      to: to.id,
      direction,
      sceneServiceAvailable: !!this.sceneService,
    });

    const camera = this.sceneService?.camera();
    if (!camera) {
      console.error(
        '[CameraFlight] Camera not available - sceneService:',
        !!this.sceneService
      );
      return null;
    }

    console.log(
      '[CameraFlight] Camera available, position:',
      camera.position.toArray()
    );

    // Dynamic GSAP import for tree-shaking optimization
    let gsap: typeof import('gsap').gsap;
    try {
      const gsapModule = await import('gsap');
      gsap = gsapModule.gsap;
      console.log('[CameraFlight] GSAP loaded successfully');
    } catch (error) {
      console.error('[CameraFlight] Failed to load GSAP:', error);
      // Fallback: jump to destination
      const targetIdx = this.targetWaypointIndex();
      this.jumpToWaypoint(targetIdx);
      return null;
    }

    // Safety check: directive may have been destroyed during async import
    if (this.isDestroyed()) {
      console.warn('[CameraFlight] Directive destroyed during GSAP import');
      this.enableOrbitControls(to.lookAt);
      return null;
    }

    const duration = to.duration ?? 2;
    const ease = to.ease ?? 'power2.inOut';

    console.log('[CameraFlight] Creating timeline with', {
      duration,
      ease,
      fromPosition: from.position,
      toPosition: to.position,
      fromLookAt: from.lookAt,
      toLookAt: to.lookAt,
    });

    // =====================================================
    // QUATERNION-BASED CAMERA ROTATION (prevents flip)
    // =====================================================
    // Using SLERP instead of lookAt animation to prevent
    // the camera up-vector from flipping during flight.

    // Calculate starting quaternion (current camera orientation)
    const startQuaternion = camera.quaternion.clone();

    // Calculate ending quaternion (what orientation at destination?)
    // Temporarily move camera to destination to compute target orientation
    const originalPosition = camera.position.clone();
    camera.position.set(to.position[0], to.position[1], to.position[2]);
    camera.lookAt(to.lookAt[0], to.lookAt[1], to.lookAt[2]);
    const endQuaternion = camera.quaternion.clone();

    // Restore camera to original position and orientation
    camera.position.copy(originalPosition);
    camera.quaternion.copy(startQuaternion);

    // Animation progress proxy for SLERP
    const animProgress = { value: 0 };

    // Create timeline (starts paused for hold-to-fly control)
    console.log('[CameraFlight] About to create gsap.timeline...');

    try {
      const timeline = gsap.timeline({
        paused: true,
        onUpdate: () => {
          // SLERP camera rotation (smooth, no flip)
          camera.quaternion.slerpQuaternions(
            startQuaternion,
            endQuaternion,
            animProgress.value
          );

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
          console.log('[CameraFlight] Timeline onComplete fired');
          const targetIndex = this.targetWaypointIndex();
          this.onWaypointArrival(targetIndex, direction);
        },
      });

      console.log('[CameraFlight] gsap.timeline() created');

      // Animate camera position
      timeline.to(
        camera.position,
        {
          x: to.position[0],
          y: to.position[1],
          z: to.position[2],
          duration,
          ease,
        },
        0 // Start at timeline position 0
      );

      console.log('[CameraFlight] Camera position tween added');

      // Animate rotation progress for SLERP (0 to 1)
      timeline.to(
        animProgress,
        {
          value: 1,
          duration,
          ease,
        },
        0 // Start at timeline position 0 (parallel with position)
      );

      console.log('[CameraFlight] Rotation SLERP tween added');

      // Animate FOV if specified in waypoint
      if (to.fov !== undefined && camera instanceof PerspectiveCamera) {
        timeline.to(
          camera,
          {
            fov: to.fov,
            duration,
            ease,
            onUpdate: () => camera.updateProjectionMatrix(),
          },
          0 // Start at timeline position 0 (parallel)
        );
        console.log('[CameraFlight] FOV tween added');
      }

      console.log(
        '[CameraFlight] Timeline created successfully, duration:',
        timeline.duration()
      );

      // WORKAROUND: Play the timeline directly here since the promise
      // resolution back to startForwardFlight seems to be hanging
      console.log('[CameraFlight] Playing timeline directly...');
      this.timeline = timeline;
      timeline.play();
      console.log('[CameraFlight] Timeline.play() called!');

      return timeline;
    } catch (error) {
      console.error('[CameraFlight] Error creating timeline:', error);
      return null;
    }
  }

  /**
   * Handle arrival at a waypoint.
   *
   * Updates state, cleans up timeline, emits events,
   * and re-enables OrbitControls after delay.
   *
   * @param index - Arrived waypoint index
   * @param direction - Direction of travel that led here
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

    // Re-enable controls after delay (allows effects to fade)
    setTimeout(() => {
      if (!this.isDestroyed()) {
        this.enableOrbitControls(waypoint.lookAt);
      }
    }, this.controlsEnableDelay());
  }

  // ================================
  // Private Methods - Event Handling
  // ================================

  /**
   * Set up mouse and keyboard event listeners.
   *
   * Mouse events are scoped to canvas only.
   * Keyboard events are on document for global capture.
   *
   * @returns true if listeners were successfully set up, false otherwise
   */
  private setupEventListeners(): boolean {
    const canvas = this.sceneService?.renderer()?.domElement;
    if (!canvas) {
      // Canvas not ready yet - will retry on next effect run
      return false;
    }

    // Prevent context menu on right-click (scoped to canvas only)
    this.contextMenuHandler = (e: MouseEvent) => {
      if (this.enabled()) {
        e.preventDefault();
      }
    };
    canvas.addEventListener('contextmenu', this.contextMenuHandler);

    // Mouse down - start or resume forward flight
    this.mouseDownHandler = (e: MouseEvent) => {
      if (e.button !== this.holdButton() || !this.enabled()) return;
      e.preventDefault();

      const nav = this.getNavigationState();

      // If already flying and paused, resume
      if (this.isFlying() && this.timeline?.paused()) {
        this.resumeFlight();
        return;
      }

      // If not flying and can fly forward, start new flight
      if (!this.isFlying() && nav.canFlyForward) {
        this.startForwardFlight();
      }
    };
    canvas.addEventListener('mousedown', this.mouseDownHandler);

    // Mouse up - pause flight (don't stop completely)
    this.mouseUpHandler = (e: MouseEvent) => {
      if (e.button !== this.holdButton()) return;

      if (this.isFlying() && this.timeline && !this.timeline.paused()) {
        this.pauseFlight();
      }
    };
    canvas.addEventListener('mouseup', this.mouseUpHandler);

    // Mouse leave - also pause if mouse leaves canvas during flight
    this.mouseLeaveHandler = () => {
      if (this.isFlying() && this.timeline && !this.timeline.paused()) {
        this.pauseFlight();
      }
    };
    canvas.addEventListener('mouseleave', this.mouseLeaveHandler);

    // Keyboard - backward navigation (Q key by default)
    this.keyDownHandler = (e: KeyboardEvent) => {
      if (e.code !== this.backwardKey() || !this.enabled()) return;

      const nav = this.getNavigationState();

      // Can't go back if already flying or at first waypoint
      if (!nav.canFlyBackward || this.isFlying()) return;

      this.startBackwardFlight();
    };
    document.addEventListener('keydown', this.keyDownHandler);

    return true;
  }

  /**
   * Clean up all event listeners.
   * Called on directive destroy.
   */
  private cleanupEventListeners(): void {
    const canvas = this.sceneService?.renderer()?.domElement;

    if (canvas) {
      if (this.contextMenuHandler) {
        canvas.removeEventListener('contextmenu', this.contextMenuHandler);
      }
      if (this.mouseDownHandler) {
        canvas.removeEventListener('mousedown', this.mouseDownHandler);
      }
      if (this.mouseUpHandler) {
        canvas.removeEventListener('mouseup', this.mouseUpHandler);
      }
      if (this.mouseLeaveHandler) {
        canvas.removeEventListener('mouseleave', this.mouseLeaveHandler);
      }
    }

    if (this.keyDownHandler) {
      document.removeEventListener('keydown', this.keyDownHandler);
    }

    // Clear handler references
    this.contextMenuHandler = null;
    this.mouseDownHandler = null;
    this.mouseUpHandler = null;
    this.mouseLeaveHandler = null;
    this.keyDownHandler = null;
  }

  // ================================
  // Private Methods - OrbitControls
  // ================================

  /**
   * Disable OrbitControls during flight.
   * Stores original enabled state for restoration.
   */
  private disableOrbitControls(): void {
    if (this.orbitControls) {
      this.originalControlsEnabled = this.orbitControls.enabled;
      this.orbitControls.enabled = false;
    }
  }

  /**
   * Re-enable OrbitControls and sync target to lookAt position.
   *
   * @param lookAt - Final lookAt position to sync controls target
   */
  private enableOrbitControls(lookAt: [number, number, number]): void {
    if (this.orbitControls && this.originalControlsEnabled) {
      // Sync OrbitControls target to final lookAt position
      this.orbitControls.target.set(lookAt[0], lookAt[1], lookAt[2]);
      this.orbitControls.enabled = true;
      this.orbitControls.update();
    }
  }

  // ================================
  // Private Methods - Utilities
  // ================================

  /**
   * Emit current navigation state change event.
   * Called whenever navigation state updates.
   */
  private emitNavigationStateChange(): void {
    this.navigationStateChange.emit(this.getNavigationState());
  }

  /**
   * Check if user prefers reduced motion.
   *
   * Respects the 'prefers-reduced-motion: reduce' media query.
   * When enabled, camera jumps instantly instead of animated flight.
   *
   * @returns true if reduced motion is preferred
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
   * Called on directive destroy.
   */
  private cleanup(): void {
    // Kill GSAP timeline
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }

    // Clean up event listeners
    this.cleanupEventListeners();

    // Re-enable OrbitControls if they were disabled mid-flight
    if (this.orbitControls && !this.orbitControls.enabled) {
      this.orbitControls.enabled = true;
    }

    // Clear references
    this.orbitControls = null;
  }
}
