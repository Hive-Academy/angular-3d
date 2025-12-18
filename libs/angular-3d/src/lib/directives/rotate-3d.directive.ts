/**
 * Rotate3dDirective - Declarative Rotation Animation for Three.js Objects
 *
 * Adds continuous rotation animation to 3D objects using GSAP.
 * Automatically integrates with component lifecycle and cleans up animations on destroy.
 *
 * Features:
 * - Signal-based reactive configuration
 * - Automatic lifecycle management with DestroyRef
 * - Single-axis rotation (x, y, z)
 * - Multi-axis rotation (xyz) with independent speeds for tumbling effect
 * - Configurable rotation speed, direction, and easing
 * - Works with any Three.js Object3D (meshes, groups, GLTF models)
 * - Smooth continuous rotation using relative rotation (+=PI*2)
 * - Public API for programmatic control (play, pause, setSpeed, reverse)
 *
 * @example
 * ```html
 * <!-- Simple Y-axis rotation (Earth) -->
 * <app-planet rotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />
 *
 * <!-- Multi-axis tumble (Asteroid) -->
 * <app-asteroid
 *   rotate3d
 *   [rotateConfig]="{
 *     axis: 'xyz',
 *     xSpeed: 10,
 *     ySpeed: 20,
 *     zSpeed: 5,
 *     direction: 1
 *   }"
 * />
 *
 * <!-- Fast rotation with reverse direction -->
 * <app-model
 *   rotate3d
 *   [rotateConfig]="{
 *     axis: 'y',
 *     speed: 30,
 *     direction: -1,
 *     ease: 'none'
 *   }"
 * />
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic control via ViewChild
 * @Component({
 *   template: `<app-cube rotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />`
 * })
 * export class MyComponent {
 *   @ViewChild(Rotate3dDirective) rotateDir!: Rotate3dDirective;
 *
 *   ngAfterViewInit() {
 *     this.rotateDir.setSpeed(30); // Speed up rotation
 *     setTimeout(() => this.rotateDir.reverse(), 2000); // Reverse after 2s
 *   }
 * }
 * ```
 */

import {
  AfterViewInit,
  DestroyRef,
  Directive,
  inject,
  input,
  OnDestroy,
  ElementRef,
} from '@angular/core';
import type { Object3D } from 'three';

/**
 * Configuration for Rotate3dDirective
 */
export interface RotateConfig {
  /** Rotation axis: 'x', 'y', 'z', or 'xyz' for multi-axis (default: 'y') */
  axis?: 'x' | 'y' | 'z' | 'xyz';
  /** Rotation speed in seconds for 360° rotation (lower = faster, default: 60) */
  speed?: number;
  /** Individual X-axis speed in seconds (only used if axis='xyz') */
  xSpeed?: number;
  /** Individual Y-axis speed in seconds (only used if axis='xyz') */
  ySpeed?: number;
  /** Individual Z-axis speed in seconds (only used if axis='xyz') */
  zSpeed?: number;
  /** Rotation direction: 1 = clockwise, -1 = counter-clockwise (default: 1) */
  direction?: 1 | -1;
  /** Auto-start animation on init (default: true) */
  autoStart?: boolean;
  /** GSAP easing function (default: 'none' for linear continuous rotation) */
  ease?: string;
}

/**
 * Rotate3dDirective
 *
 * Applies continuous rotation animation to 3D objects using GSAP.
 * Creates smooth, infinite rotation on specified axes with relative rotation (+=PI*2)
 * to ensure seamless continuous looping.
 *
 * Supports both single-axis rotation (e.g., planets) and multi-axis tumbling (e.g., asteroids).
 */
@Directive({
  selector: '[rotate3d]',
  standalone: true,
})
export class Rotate3dDirective implements AfterViewInit, OnDestroy {
  // Dependency injection
  private readonly elementRef = inject(ElementRef<Object3D>);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Rotation animation configuration
   *
   * If undefined, directive is inactive (allows optional usage).
   */
  public readonly rotateConfig = input<RotateConfig | undefined>(undefined);

  // Internal state
  private gsapTimeline: any | null = null;
  private object3D: Object3D | null = null;

  public ngAfterViewInit(): void {
    // Skip if no configuration provided (directive is optional)
    const config = this.rotateConfig();
    if (!config) {
      return;
    }

    // Get 3D object from ElementRef nativeElement
    this.object3D = this.elementRef.nativeElement;

    if (!this.object3D) {
      console.warn(
        '[Rotate3dDirective] Could not access object from nativeElement'
      );
      return;
    }

    // Delay initialization to ensure GLTF model is fully loaded
    setTimeout(() => {
      this.initializeAnimation();
    }, 100);

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  public ngOnDestroy(): void {
    this.cleanup();
  }

  /**
   * Initialize the rotation animation
   */
  private initializeAnimation(): void {
    if (!this.object3D) return;

    this.createRotationAnimation();
  }

  /**
   * Create the rotation animation timeline
   *
   * Uses GSAP for smooth, continuous rotation with relative rotation (+=PI*2).
   * Supports single-axis rotation (x, y, z) and multi-axis tumbling (xyz).
   */
  private createRotationAnimation(): void {
    if (!this.object3D) {
      console.warn(
        '[Rotate3dDirective] object3D is null in createRotationAnimation'
      );
      return;
    }

    const config = this.rotateConfig();
    if (!config) return;

    // Default configuration
    const axis = config.axis ?? 'y';
    const speed = config.speed ?? 60; // 60 seconds for full rotation
    const direction = config.direction ?? 1;
    const autoStart = config.autoStart ?? true;
    const ease = config.ease ?? 'none'; // 'none' for linear continuous rotation

    // Dynamic import for tree-shaking
    import('gsap').then(({ gsap }) => {
      if (!this.object3D) {
        console.warn(
          '[Rotate3dDirective] object3D became null after GSAP import'
        );
        return;
      }

      // Additional safety check for rotation property
      if (!this.object3D.rotation) {
        console.warn('[Rotate3dDirective] object3D.rotation is undefined');
        return;
      }

      const timeline = gsap.timeline({
        repeat: -1, // Infinite loop
      });

      // Single-axis rotation
      if (axis === 'x' || axis === 'y' || axis === 'z') {
        const fullRotation = Math.PI * 2 * direction;

        timeline.to(this.object3D.rotation, {
          [axis]: `+=${fullRotation}`, // Relative rotation for seamless looping
          duration: speed,
          ease: ease,
        });
      }
      // Multi-axis rotation (tumbling effect)
      else if (axis === 'xyz') {
        const xSpeed = config.xSpeed ?? speed;
        const ySpeed = config.ySpeed ?? speed;
        const zSpeed = config.zSpeed ?? speed;

        // Create simultaneous rotations on all axes
        timeline.to(
          this.object3D.rotation,
          {
            x: `+=${Math.PI * 2 * direction}`,
            duration: xSpeed,
            ease: ease,
            repeat: -1,
          },
          0
        ); // Start at time 0

        timeline.to(
          this.object3D.rotation,
          {
            y: `+=${Math.PI * 2 * direction}`,
            duration: ySpeed,
            ease: ease,
            repeat: -1,
          },
          0
        ); // Start at time 0

        timeline.to(
          this.object3D.rotation,
          {
            z: `+=${Math.PI * 2 * direction}`,
            duration: zSpeed,
            ease: ease,
            repeat: -1,
          },
          0
        ); // Start at time 0
      }

      // Store timeline reference for cleanup and control
      this.gsapTimeline = timeline;

      // Auto-start if configured
      if (!autoStart) {
        timeline.pause();
      }
    });
  }

  /**
   * Cleanup animation resources
   */
  private cleanup(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }
  }

  /**
   * Public API: Play the rotation animation
   */
  public play(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.play();
    }
  }

  /**
   * Public API: Pause the rotation animation
   */
  public pause(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.pause();
    }
  }

  /**
   * Public API: Stop and reset the rotation animation
   */
  public stop(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.progress(0).pause();
    }
  }

  /**
   * Public API: Check if animation is playing
   */
  public isPlaying(): boolean {
    return this.gsapTimeline ? this.gsapTimeline.isActive() : false;
  }

  /**
   * Public API: Set rotation speed dynamically
   *
   * @param speed - New speed in seconds for 360° rotation
   */
  public setSpeed(speed: number): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.timeScale(60 / speed); // Adjust time scale relative to default 60s
    }
  }

  /**
   * Public API: Reverse rotation direction
   */
  public reverse(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.timeScale(this.gsapTimeline.timeScale() * -1);
    }
  }
}
