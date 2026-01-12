import {
  Directive,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  afterNextRender,
  effect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';
import type { Object3D, Camera } from 'three/webgpu';
import { Vector2, Euler, Vector3, Raycaster, Plane } from 'three/webgpu';

export interface MouseTrackingConfig {
  /** Movement sensitivity (default: 0.5) */
  sensitivity?: number;
  /** Damping factor 0-1 (default: 0.1) - lower = smoother */
  damping?: number;
  /** Max rotation in radians (default: Math.PI / 4) */
  limit?: number;
  /** Invert X axis rotation (default: false) */
  invertX?: boolean;
  /** Invert Y axis rotation (default: false) */
  invertY?: boolean;
  /** Translation range [x, y] in units (default: [0, 0] / disabled) */
  translationRange?: [number, number];
  /** Invert X axis position (default: false) */
  invertPosX?: boolean;
  /** Invert Y axis position (default: false) */
  invertPosY?: boolean;

  // --- Cursor Following Mode ---
  /**
   * When true, object follows cursor in world space using camera unprojection.
   * Overrides translationRange behavior - object moves directly to cursor position.
   * Similar to metaball cursor tracking.
   */
  followCursor?: boolean;
  /**
   * Depth (Z distance from camera) for cursor unprojection (default: 10).
   * Larger values = cursor movement covers more world space.
   */
  cursorDepth?: number;
  /**
   * Lock Z position to maintain original depth (default: true).
   * When false, Z will be set based on cursorDepth.
   */
  lockZ?: boolean;
  /**
   * Interpolation smoothness for cursor following (0-1, default: 0.1).
   * Set to 1.0 for instant following (no interpolation).
   */
  smoothness?: number;
  /**
   * Offset from cursor world position [x, y, z] (default: [0, 0, 0]).
   * Useful for positioning objects relative to cursor.
   */
  cursorOffset?: [number, number, number];
  /**
   * Disable rotation when following cursor (default: false).
   * Set to true if you only want position tracking.
   */
  disableRotation?: boolean;

  // --- Flight Behavior Mode ---
  /**
   * Enable flight behavior: bank and pitch based on movement velocity.
   * Creates a realistic flying/spaceship feel where the object tilts
   * in the direction of movement.
   */
  flightBehavior?: boolean;
  /**
   * Maximum bank angle in radians when moving horizontally (default: Math.PI / 6 = 30°).
   * Banking rotates the object on its Z-axis based on X velocity.
   */
  maxBankAngle?: number;
  /**
   * Maximum pitch angle in radians when moving vertically (default: Math.PI / 8 = 22.5°).
   * Pitching rotates the object on its X-axis based on Y velocity.
   */
  maxPitchAngle?: number;
  /**
   * Flight rotation responsiveness (0-1, default: 0.08).
   * Lower = smoother banking/pitching, higher = more responsive.
   */
  flightDamping?: number;
  /**
   * Maximum heading/yaw angle in radians when moving horizontally (default: Math.PI / 4 = 45°).
   * Yaw rotates the object on its Y-axis to face the direction of travel.
   */
  maxYawAngle?: number;
  /**
   * Velocity multiplier for flight calculations (default: 15).
   * Higher values make the object respond more dramatically to small movements.
   */
  velocityMultiplier?: number;
}

@Directive({
  selector: '[mouseTracking3d]',
})
export class MouseTracking3dDirective implements OnDestroy {
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly ngZone = inject(NgZone);
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef);

  public readonly trackingConfig = input<MouseTrackingConfig | undefined>(
    undefined
  );

  private object3D: Object3D | null = null;
  private camera: Camera | null = null;

  // Mouse state (normalized -1 to 1)
  private mouse = new Vector2();
  private targetMouse = new Vector2();

  // Rotation state
  private targetRotation = new Euler();
  private currentRotation = new Euler();

  // Position state
  private basePosition: Vector3 | null = null;
  private targetPosition = new Vector3();
  private currentPosition = new Vector3();
  private previousPosition = new Vector3();

  // Flight behavior state
  private velocity = new Vector2();
  private currentBankAngle = 0;
  private currentPitchAngle = 0;
  private currentYawAngle = 0;

  // Cursor following utilities
  private raycaster = new Raycaster();
  private cursorPlane = new Plane(new Vector3(0, 0, 1), 0);
  private intersectionPoint = new Vector3();

  // Animation & visibility
  private rafId: number | null = null;
  private observer: IntersectionObserver | null = null;
  private isVisible = false;

  // Touch support
  private readonly boundOnTouchStart = this.onTouchStart.bind(this);
  private readonly boundOnTouchMove = this.onTouchMove.bind(this);

  public constructor() {
    effect(() => {
      if (this.objectId) {
        this.object3D = this.sceneStore.getObject<Object3D>(this.objectId);
        if (this.object3D) {
          // Store initial rotation as base
          this.currentRotation.copy(this.object3D.rotation);
          this.targetRotation.copy(this.object3D.rotation);
          // Store initial position as base
          this.basePosition = this.object3D.position.clone();
          this.currentPosition.copy(this.object3D.position);
          this.targetPosition.copy(this.object3D.position);
        }
      }

      // Try to get camera from scene store
      const cam = this.sceneStore.camera();
      if (cam) {
        this.camera = cam as Camera;
      }
    });

    afterNextRender(() => {
      this.setupIntersectionObserver();
      this.startTracking();
    });
  }

  public ngOnDestroy(): void {
    this.stopTracking();
    this.observer?.disconnect();
  }

  private setupIntersectionObserver(): void {
    const targetElement =
      this.elementRef.nativeElement.parentElement || this.document.body;

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          this.isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0 }
    );

    this.observer.observe(targetElement);
  }

  private startTracking(): void {
    this.ngZone.runOutsideAngular(() => {
      // Mouse events
      this.document.addEventListener('mousemove', this.onMouseMove);

      // Touch events
      this.document.addEventListener('touchstart', this.boundOnTouchStart, {
        passive: false,
      });
      this.document.addEventListener('touchmove', this.boundOnTouchMove, {
        passive: false,
      });

      this.tick();
    });
  }

  private stopTracking(): void {
    this.document.removeEventListener('mousemove', this.onMouseMove);
    this.document.removeEventListener('touchstart', this.boundOnTouchStart);
    this.document.removeEventListener('touchmove', this.boundOnTouchMove);

    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private onMouseMove = (event: MouseEvent) => {
    this.updateMousePosition(event.clientX, event.clientY);
  };

  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);
    }
  }

  private onTouchMove(event: TouchEvent): void {
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.updateMousePosition(touch.clientX, touch.clientY);
    }
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    if (!this.isVisible) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Normalize to -1 to 1 range (NDC)
    this.targetMouse.x = (clientX / width) * 2 - 1;
    this.targetMouse.y = -(clientY / height) * 2 + 1;
  }

  /**
   * Convert NDC mouse coordinates to world position using camera unprojection.
   * Projects a ray from camera through mouse position and intersects with a plane.
   */
  private unprojectToWorld(ndc: Vector2, depth: number): Vector3 {
    if (!this.camera) {
      // Fallback: simple aspect-ratio based conversion (similar to metaball)
      const aspect = window.innerWidth / window.innerHeight;
      return new Vector3(ndc.x * aspect * depth * 0.5, ndc.y * depth * 0.5, 0);
    }

    // Set up raycaster from camera through mouse position
    this.raycaster.setFromCamera(ndc, this.camera);

    // Create a plane at the specified depth, facing the camera
    const cameraDirection = new Vector3();
    this.camera.getWorldDirection(cameraDirection);

    // Position plane at depth distance from camera
    const planeOrigin = this.camera.position
      .clone()
      .add(cameraDirection.multiplyScalar(depth));
    this.cursorPlane.setFromNormalAndCoplanarPoint(
      cameraDirection.negate(),
      planeOrigin
    );

    // Intersect ray with plane
    const intersection = this.raycaster.ray.intersectPlane(
      this.cursorPlane,
      this.intersectionPoint
    );

    return intersection || new Vector3(0, 0, 0);
  }

  private tick = () => {
    if (this.object3D && this.isVisible) {
      const config = this.trackingConfig() || {};
      const damping = config.damping ?? 0.1;
      const smoothness = config.smoothness ?? damping;
      const obj = this.object3D;

      // Store previous position for velocity calculation
      this.previousPosition.copy(obj.position);

      // Smooth mouse interpolation
      this.mouse.x += (this.targetMouse.x - this.mouse.x) * smoothness;
      this.mouse.y += (this.targetMouse.y - this.mouse.y) * smoothness;

      // --- CURSOR FOLLOWING MODE ---
      if (config.followCursor) {
        const cursorDepth = config.cursorDepth ?? 10;
        const lockZ = config.lockZ ?? true;
        const offset = config.cursorOffset ?? [0, 0, 0];

        // Get world position under cursor
        const worldPos = this.unprojectToWorld(this.mouse, cursorDepth);

        // Apply offset
        this.targetPosition.set(
          worldPos.x + offset[0],
          worldPos.y + offset[1],
          lockZ && this.basePosition
            ? this.basePosition.z
            : worldPos.z + offset[2]
        );

        // Smooth interpolation to target
        obj.position.x += (this.targetPosition.x - obj.position.x) * smoothness;
        obj.position.y += (this.targetPosition.y - obj.position.y) * smoothness;
        if (!lockZ) {
          obj.position.z +=
            (this.targetPosition.z - obj.position.z) * smoothness;
        }
      }
      // --- LEGACY TRANSLATION RANGE MODE ---
      else {
        const translationRange = config.translationRange ?? [0, 0];
        const invertPosX = config.invertPosX ?? false;
        const invertPosY = config.invertPosY ?? false;

        if (!this.basePosition) {
          this.basePosition = obj.position.clone();
        }

        const xRange = translationRange[0];
        const yRange = translationRange[1];

        if (xRange > 0 || yRange > 0) {
          const targetPosX =
            this.basePosition.x + this.mouse.x * xRange * (invertPosX ? -1 : 1);
          const targetPosY =
            this.basePosition.y + this.mouse.y * yRange * (invertPosY ? -1 : 1);

          obj.position.x += (targetPosX - obj.position.x) * damping;
          obj.position.y += (targetPosY - obj.position.y) * damping;
        }
      }

      // Calculate velocity after position update
      this.velocity.x = obj.position.x - this.previousPosition.x;
      this.velocity.y = obj.position.y - this.previousPosition.y;

      // --- FLIGHT BEHAVIOR MODE ---
      if (config.flightBehavior) {
        const maxBankAngle = config.maxBankAngle ?? Math.PI / 6; // 30 degrees
        const maxPitchAngle = config.maxPitchAngle ?? Math.PI / 8; // 22.5 degrees
        const maxYawAngle = config.maxYawAngle ?? Math.PI / 4; // 45 degrees
        const flightDamping = config.flightDamping ?? 0.08;
        const velocityMultiplier = config.velocityMultiplier ?? 15;

        // Calculate target bank angle (Z rotation) based on X velocity
        // Negative because moving right should bank right (negative Z rotation)
        const targetBankAngle = Math.max(
          -maxBankAngle,
          Math.min(maxBankAngle, -this.velocity.x * velocityMultiplier)
        );

        // Calculate target pitch angle (X rotation) based on Y velocity
        // Moving up should pitch up (negative X rotation)
        const targetPitchAngle = Math.max(
          -maxPitchAngle,
          Math.min(maxPitchAngle, -this.velocity.y * velocityMultiplier)
        );

        // Calculate target yaw/heading angle (Y rotation) based on X velocity
        // Moving right should turn/yaw right (positive Y rotation)
        const targetYawAngle = Math.max(
          -maxYawAngle,
          Math.min(maxYawAngle, this.velocity.x * velocityMultiplier)
        );

        // Smooth interpolation of flight angles
        this.currentBankAngle +=
          (targetBankAngle - this.currentBankAngle) * flightDamping;
        this.currentPitchAngle +=
          (targetPitchAngle - this.currentPitchAngle) * flightDamping;
        this.currentYawAngle +=
          (targetYawAngle - this.currentYawAngle) * flightDamping;

        // Apply flight rotations
        obj.rotation.z = this.currentBankAngle;
        obj.rotation.x = this.currentPitchAngle;
        obj.rotation.y = this.currentYawAngle;
      }
      // --- STANDARD ROTATION LOGIC (mouse-based look-at) ---
      else if (!config.disableRotation) {
        const sensitivity = config.sensitivity ?? 0.5;
        const limit = config.limit ?? Math.PI / 4;
        const invertX = config.invertX ?? false;
        const invertY = config.invertY ?? false;

        const targetRotY =
          this.mouse.x * limit * sensitivity * (invertX ? -1 : 1);
        const targetRotX =
          this.mouse.y * limit * sensitivity * (invertY ? -1 : 1);

        obj.rotation.x += (targetRotX - obj.rotation.x) * damping;
        obj.rotation.y += (targetRotY - obj.rotation.y) * damping;
      }
    }

    this.rafId = requestAnimationFrame(this.tick);
  };
}
