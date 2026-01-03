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
  computed,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
} from '@angular/core';
import type { Object3D } from 'three/webgpu';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { SceneService } from '../../canvas/scene.service';
import { OBJECT_ID } from '../../tokens/object-id.token';

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
export class Rotate3dDirective {
  // Inject SceneGraphStore and OBJECT_ID from host component
  private readonly sceneStore = inject(SceneGraphStore);
  // SceneService for demand-based rendering invalidation
  private readonly sceneService = inject(SceneService, { optional: true });
  // DEBUG: Try without skipSelf - directive should see component's providers
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Rotation animation configuration
   *
   * If undefined, directive is inactive (allows optional usage).
   */
  public readonly rotateConfig = input<RotateConfig | undefined>(undefined);

  // Internal state
  private gsapTimeline: any | null = null;

  // Computed signal for object access
  private readonly object3D = computed(() => {
    if (!this.objectId) return null;
    return this.sceneStore.getObject<Object3D>(this.objectId);
  });

  public constructor() {
    // Effect runs when object and config are ready
    effect(() => {
      const obj = this.object3D();
      const config = this.rotateConfig();

      if (obj && config && !this.gsapTimeline) {
        this.createRotationAnimation(obj, config);
      }
    });

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Create the rotation animation timeline
   *
   * Uses GSAP for smooth, continuous rotation with relative rotation (+=PI*2).
   * Supports single-axis rotation (x, y, z) and multi-axis tumbling (xyz).
   */
  private createRotationAnimation(obj: Object3D, config: RotateConfig): void {
    // Store configuration locally to prevent it from becoming undefined during async import
    const axis = config.axis ?? 'y';
    const speed = config.speed ?? 60; // 60 seconds for full rotation
    const xSpeed = config.xSpeed ?? speed;
    const ySpeed = config.ySpeed ?? speed;
    const zSpeed = config.zSpeed ?? speed;
    const direction = config.direction ?? 1;
    const autoStart = config.autoStart ?? true;
    const ease = config.ease ?? 'none'; // 'none' for linear continuous rotation

    // Dynamic import for tree-shaking
    import('gsap').then(({ gsap }) => {
      // Additional safety check for rotation property
      if (!obj.rotation) {
        console.warn('[Rotate3dDirective] object3D.rotation is undefined');
        return;
      }

      const timeline = gsap.timeline({
        repeat: -1, // Infinite loop
      });

      // Single-axis rotation
      if (axis === 'x' || axis === 'y' || axis === 'z') {
        const fullRotation = Math.PI * 2 * direction;

        timeline.to(obj.rotation, {
          [axis]: `+=${fullRotation}`, // Relative rotation for seamless looping
          duration: speed,
          ease: ease,
          onUpdate: () => {
            // Invalidate for demand-based rendering
            this.sceneService?.invalidate();
          },
        });
      }
      // Multi-axis rotation (tumbling effect)
      else if (axis === 'xyz') {
        // Use locally stored speeds from closure
        // Create simultaneous rotations on all axes
        timeline.to(
          obj.rotation,
          {
            x: `+=${Math.PI * 2 * direction}`,
            duration: xSpeed,
            ease: ease,
            repeat: -1,
            onUpdate: () => {
              // Invalidate for demand-based rendering
              this.sceneService?.invalidate();
            },
          },
          0
        ); // Start at time 0

        timeline.to(
          obj.rotation,
          {
            y: `+=${Math.PI * 2 * direction}`,
            duration: ySpeed,
            ease: ease,
            repeat: -1,
            onUpdate: () => {
              // Invalidate for demand-based rendering
              this.sceneService?.invalidate();
            },
          },
          0
        ); // Start at time 0

        timeline.to(
          obj.rotation,
          {
            z: `+=${Math.PI * 2 * direction}`,
            duration: zSpeed,
            ease: ease,
            repeat: -1,
            onUpdate: () => {
              // Invalidate for demand-based rendering
              this.sceneService?.invalidate();
            },
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
