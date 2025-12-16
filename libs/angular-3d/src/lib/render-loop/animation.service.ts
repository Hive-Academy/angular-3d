/**
 * Animation Service - GSAP animation integration
 *
 * Provides reusable animation methods for Three.js objects.
 * Tracks animations by object UUID for cleanup.
 */

import { Injectable } from '@angular/core';
import * as THREE from 'three';
import gsap from 'gsap';

/**
 * Configuration for float animation
 */
export interface FloatConfig {
  /** Maximum vertical displacement */
  height?: number;
  /** Duration of one float cycle in milliseconds */
  speed?: number;
  /** Delay before starting in milliseconds */
  delay?: number;
  /** GSAP easing function */
  ease?: string;
}

/**
 * Configuration for rotation animation
 */
export interface RotateConfig {
  /** Axis to rotate around */
  axis?: 'x' | 'y' | 'z';
  /** Rotation speed in degrees per second */
  speed?: number;
  /** GSAP easing function */
  ease?: string;
}

/**
 * Waypoint for flight path animation
 */
export interface FlightWaypoint {
  /** Target position */
  position: [number, number, number];
  /** Duration to reach this position in seconds */
  duration: number;
  /** Optional easing for this segment */
  ease?: string;
}

/**
 * Configuration for glow/pulse animation
 */
export interface PulseConfig {
  /** Minimum scale */
  minScale?: number;
  /** Maximum scale */
  maxScale?: number;
  /** Pulse duration in seconds */
  duration?: number;
  /** GSAP easing function */
  ease?: string;
}

/**
 * Service for creating and managing GSAP animations on Three.js objects.
 *
 * Animations are tracked by object UUID for proper cleanup.
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class FloatingPlanetComponent implements AfterViewInit, OnDestroy {
 *   private animationService = inject(AnimationService);
 *   private mesh?: THREE.Mesh;
 *
 *   ngAfterViewInit() {
 *     this.mesh = new THREE.Mesh(geometry, material);
 *     this.animationService.floatAnimation(this.mesh, { height: 0.5 });
 *   }
 *
 *   ngOnDestroy() {
 *     if (this.mesh) {
 *       this.animationService.killAnimation(this.mesh.uuid);
 *     }
 *   }
 * }
 * ```
 */
@Injectable({ providedIn: 'root' })
export class AnimationService {
  private readonly animations = new Map<
    string,
    gsap.core.Tween | gsap.core.Timeline
  >();

  /**
   * Create a floating/bobbing animation on an object
   *
   * @param object - Three.js object to animate
   * @param config - Float animation configuration
   * @returns GSAP Tween for additional control
   */
  public floatAnimation(
    object: THREE.Object3D,
    config: FloatConfig = {}
  ): gsap.core.Tween {
    const {
      height = 0.3,
      speed = 2000,
      delay = 0,
      ease = 'sine.inOut',
    } = config;

    const originalY = object.position.y;
    const durationSeconds = speed / 1000;

    // Kill any existing animation on this object
    this.killAnimation(object.uuid);

    const tween = gsap.to(object.position, {
      y: originalY + height,
      duration: durationSeconds,
      delay: delay / 1000,
      repeat: -1,
      yoyo: true,
      ease,
    });

    this.animations.set(object.uuid, tween);
    return tween;
  }

  /**
   * Create a continuous rotation animation
   *
   * @param object - Three.js object to animate
   * @param config - Rotation configuration
   * @returns GSAP Tween for additional control
   */
  public rotateAnimation(
    object: THREE.Object3D,
    config: RotateConfig = {}
  ): gsap.core.Tween {
    const { axis = 'y', speed = 30, ease = 'none' } = config;

    // Convert degrees/second to radians for one full rotation
    const fullRotation = Math.PI * 2;
    const durationForFullRotation = 360 / speed;

    // Kill any existing animation
    this.killAnimation(object.uuid);

    const tween = gsap.to(object.rotation, {
      [axis]: `+=${fullRotation}`,
      duration: durationForFullRotation,
      repeat: -1,
      ease,
    });

    this.animations.set(object.uuid, tween);
    return tween;
  }

  /**
   * Create a flight path animation through waypoints
   *
   * @param object - Three.js object to animate
   * @param waypoints - Array of positions and durations
   * @param loop - Whether to loop the animation
   * @returns GSAP Timeline for additional control
   */
  public flightPath(
    object: THREE.Object3D,
    waypoints: FlightWaypoint[],
    loop = true
  ): gsap.core.Timeline {
    // Kill any existing animation
    this.killAnimation(object.uuid);

    const timeline = gsap.timeline({
      repeat: loop ? -1 : 0,
    });

    waypoints.forEach((waypoint, index) => {
      timeline.to(
        object.position,
        {
          x: waypoint.position[0],
          y: waypoint.position[1],
          z: waypoint.position[2],
          duration: waypoint.duration,
          ease: waypoint.ease ?? 'power1.inOut',
        },
        index === 0 ? 0 : '>'
      );
    });

    this.animations.set(object.uuid, timeline);
    return timeline;
  }

  /**
   * Create a scale pulse animation
   *
   * @param object - Three.js object to animate
   * @param config - Pulse configuration
   * @returns GSAP Tween for additional control
   */
  public pulseAnimation(
    object: THREE.Object3D,
    config: PulseConfig = {}
  ): gsap.core.Tween {
    const {
      minScale = 1,
      maxScale = 1.2,
      duration = 1,
      ease = 'sine.inOut',
    } = config;

    // Kill any existing animation
    this.killAnimation(object.uuid);

    // Set initial scale
    object.scale.setScalar(minScale);

    const tween = gsap.to(object.scale, {
      x: maxScale,
      y: maxScale,
      z: maxScale,
      duration,
      repeat: -1,
      yoyo: true,
      ease,
    });

    this.animations.set(object.uuid, tween);
    return tween;
  }

  /**
   * Animate camera to a new position and target
   *
   * @param camera - Camera to animate
   * @param position - Target position
   * @param lookAt - Target look-at point
   * @param duration - Animation duration in seconds
   * @returns GSAP Timeline for additional control
   */
  public animateCamera(
    camera: THREE.Camera,
    position: [number, number, number],
    lookAt?: [number, number, number],
    duration = 2
  ): gsap.core.Timeline {
    const timeline = gsap.timeline();

    timeline.to(camera.position, {
      x: position[0],
      y: position[1],
      z: position[2],
      duration,
      ease: 'power2.inOut',
    });

    if (lookAt && camera instanceof THREE.PerspectiveCamera) {
      // Note: For smooth look-at animation, you'd need to animate via a target object
      // This is a simple immediate update at end of animation
      timeline.call(() => {
        camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
      });
    }

    return timeline;
  }

  /**
   * Kill animation for a specific object
   */
  public killAnimation(objectId: string): void {
    const animation = this.animations.get(objectId);
    if (animation) {
      animation.kill();
      this.animations.delete(objectId);
    }
  }

  /**
   * Kill all tracked animations
   */
  public killAll(): void {
    this.animations.forEach((animation) => animation.kill());
    this.animations.clear();
  }

  /**
   * Pause animation for a specific object
   */
  public pauseAnimation(objectId: string): void {
    this.animations.get(objectId)?.pause();
  }

  /**
   * Resume animation for a specific object
   */
  public resumeAnimation(objectId: string): void {
    this.animations.get(objectId)?.resume();
  }

  /**
   * Pause all tracked animations
   */
  public pauseAll(): void {
    this.animations.forEach((animation) => animation.pause());
  }

  /**
   * Resume all tracked animations
   */
  public resumeAll(): void {
    this.animations.forEach((animation) => animation.resume());
  }

  /**
   * Check if an object has an active animation
   */
  public hasAnimation(objectId: string): boolean {
    return this.animations.has(objectId);
  }

  /**
   * Get count of active animations
   */
  public getActiveCount(): number {
    return this.animations.size;
  }
}
