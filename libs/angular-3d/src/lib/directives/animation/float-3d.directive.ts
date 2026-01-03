/**
 * Float3dDirective - Declarative Floating Animation for Three.js Objects
 *
 * Adds smooth floating/bobbing animation to 3D objects using GSAP.
 * Automatically integrates with component lifecycle and cleans up animations on destroy.
 *
 * Features:
 * - Signal-based reactive configuration
 * - Automatic lifecycle management with DestroyRef
 * - Seamless continuous loop (UP/DOWN phases, no jarring transitions)
 * - Configurable float height, speed, delay, and easing
 * - Works with any Three.js Object3D (meshes, groups, etc.)
 * - Zero configuration required - smart defaults provided
 * - Public API for programmatic control (play, pause, stop)
 *
 * @example
 * ```html
 * <!-- Simple usage with defaults -->
 * <app-sphere float3d [floatConfig]="{ height: 0.5 }" />
 *
 * <!-- Complete configuration -->
 * <app-planet
 *   float3d
 *   [floatConfig]="{
 *     height: 0.8,
 *     speed: 3000,
 *     delay: 500,
 *     ease: 'power1.inOut',
 *     autoStart: true
 *   }"
 * />
 *
 * <!-- With ViewChild for programmatic control -->
 * <app-model #model float3d [floatConfig]="{ height: 0.3, speed: 2000 }" />
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic control via ViewChild
 * @Component({
 *   template: `<app-sphere float3d />`
 * })
 * export class MyComponent implements AfterViewInit {
 *   @ViewChild(Float3dDirective) floatDir!: Float3dDirective;
 *
 *   ngAfterViewInit() {
 *     this.floatDir.pause();
 *     setTimeout(() => this.floatDir.play(), 1000);
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
import { Mesh } from 'three/webgpu';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { SceneService } from '../../canvas/scene.service';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * Configuration for Float3dDirective
 */
export interface FloatConfig {
  /** Vertical displacement in Three.js units (default: 0.3) */
  height?: number;
  /** Full cycle duration in milliseconds (default: 2000) */
  speed?: number;
  /** Delay before starting in milliseconds (default: 0) */
  delay?: number;
  /** GSAP easing function (default: 'sine.inOut') */
  ease?: string;
  /** Auto-start animation on init (default: true) */
  autoStart?: boolean;
}

/**
 * Float3dDirective
 *
 * Applies floating animation to 3D objects by creating a GSAP timeline
 * that animates the object's position in a gentle up-and-down motion.
 *
 * The animation uses separate UP and DOWN phases (not yoyo) to ensure
 * seamless continuous looping without jarring transitions at loop boundaries.
 */
@Directive({
  selector: '[float3d]',
  standalone: true,
})
export class Float3dDirective {
  // Inject SceneGraphStore and OBJECT_ID from host component
  private readonly sceneStore = inject(SceneGraphStore);
  // SceneService for demand-based rendering invalidation
  private readonly sceneService = inject(SceneService, { optional: true });
  // DEBUG: Try without skipSelf - directive should see component's providers
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Float animation configuration
   *
   * If undefined, directive is inactive (allows optional usage).
   */
  public readonly floatConfig = input<FloatConfig | undefined>(undefined);

  // Internal state
  private gsapTimeline: any | null = null; // GSAP timeline reference
  private originalPosition: [number, number, number] | null = null;

  // Computed signal for mesh access
  private readonly mesh = computed(() => {
    if (!this.objectId) return null;
    const obj = this.sceneStore.getObject(this.objectId);
    return obj instanceof Mesh ? (obj as Mesh) : null;
  });

  public constructor() {
    // Effect runs when mesh and config are ready
    effect(() => {
      const m = this.mesh();
      const config = this.floatConfig();

      if (m && config && !this.gsapTimeline) {
        this.originalPosition = [m.position.x, m.position.y, m.position.z];
        this.createFloatingAnimation(m, config);
      }
    });

    // Register cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Create the floating animation timeline
   *
   * Uses a seamless continuous loop animation instead of yoyo to avoid jarring transitions.
   * Creates a smooth sine-wave-like motion by animating UP and DOWN as separate sequential steps
   * within a repeating timeline, ensuring no sudden drops at loop boundaries.
   */
  private createFloatingAnimation(mesh: Mesh, config: FloatConfig): void {
    if (!this.originalPosition) return;

    const height = config.height ?? 0.3;
    const speed = config.speed ?? 2000;
    const delay = config.delay ?? 0;
    const ease = config.ease ?? 'sine.inOut';
    const autoStart = config.autoStart ?? true;

    // Dynamic import for tree-shaking
    import('gsap').then(({ gsap }) => {
      // Check if directive was destroyed during async import
      if (!this.originalPosition) {
        console.warn(
          '[Float3dDirective] directive destroyed during GSAP import'
        );
        return;
      }

      // Additional safety check for position property
      if (!mesh.position) {
        console.warn('[Float3dDirective] mesh.position is undefined');
        return;
      }

      const [_x, y, _z] = this.originalPosition;

      // Create a seamless continuous loop timeline
      // Instead of yoyo (which causes sudden drops), we create a smooth cycle:
      // 1. Start at original position
      // 2. Animate UP to (y + height) with easeInOut
      // 3. Animate DOWN back to original y with easeInOut
      // 4. Repeat infinitely - seamless loop, no jarring transitions
      const timeline = gsap.timeline({
        repeat: -1, // Infinite loop
        delay: delay / 1000, // Convert ms to seconds
      });

      // Phase 1: Float UP (smooth acceleration and deceleration)
      timeline.to(mesh.position, {
        y: y + height,
        duration: speed / 2000, // Half the total speed for up phase (convert ms to s)
        ease: ease,
        onUpdate: () => {
          // Invalidate for demand-based rendering
          this.sceneService?.invalidate();
        },
      });

      // Phase 2: Float DOWN (smooth acceleration and deceleration)
      timeline.to(mesh.position, {
        y: y,
        duration: speed / 2000, // Half the total speed for down phase
        ease: ease,
        onUpdate: () => {
          // Invalidate for demand-based rendering
          this.sceneService?.invalidate();
        },
      });

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

    // Reset position to original if mesh still exists
    const m = this.mesh();
    if (m && this.originalPosition) {
      const [x, y, z] = this.originalPosition;
      m.position.set(x, y, z);
    }
  }

  /**
   * Public API: Play the floating animation
   */
  public play(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.play();
    }
  }

  /**
   * Public API: Pause the floating animation
   */
  public pause(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.pause();
    }
  }

  /**
   * Public API: Stop and reset the floating animation
   */
  public stop(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.progress(0).pause();
      const m = this.mesh();
      if (m && this.originalPosition) {
        const [x, y, z] = this.originalPosition;
        m.position.set(x, y, z);
      }
    }
  }

  /**
   * Public API: Check if animation is playing
   */
  public isPlaying(): boolean {
    return this.gsapTimeline ? this.gsapTimeline.isActive() : false;
  }
}
