/**
 * CinematicEntranceDirective - Camera Entrance Animations for Three.js Scenes
 *
 * Provides cinematic camera entrance animations with preset patterns.
 * Coordinates with OrbitControls to disable during animation and sync target after.
 * Integrates with AssetPreloaderService for loading-aware auto-start.
 *
 * Features:
 * - 4 built-in presets: dolly-in, orbit-drift, crane-up, fade-drift
 * - Signal-based reactive configuration
 * - OrbitControls coordination (disable during animation, sync target after)
 * - Preload state integration for automatic triggering when assets ready
 * - Reduced motion support (skips to end state)
 * - Automatic lifecycle management with DestroyRef
 * - Public API for manual control (start)
 *
 * @example
 * ```html
 * <!-- Simple usage with preset -->
 * <a3d-scene-3d a3dCinematicEntrance [entranceConfig]="{ preset: 'dolly-in' }">
 *   ...
 * </a3d-scene-3d>
 *
 * <!-- With preload state integration -->
 * <a3d-scene-3d
 *   a3dCinematicEntrance
 *   [entranceConfig]="{
 *     preset: 'orbit-drift',
 *     duration: 3,
 *     preloadState: preloadState,
 *     autoStart: true
 *   }"
 *   (entranceComplete)="onEntranceComplete()"
 * >
 *   ...
 * </a3d-scene-3d>
 * ```
 *
 * @example
 * ```typescript
 * // In component with OrbitControls coordination
 * @Component({
 *   template: `
 *     <a3d-scene-3d>
 *       <a3d-orbit-controls
 *         a3dCinematicEntrance
 *         [entranceConfig]="entranceConfig"
 *         (controlsReady)="onControlsReady($event)"
 *         (entranceComplete)="onEntranceComplete()"
 *       />
 *     </a3d-scene-3d>
 *   `
 * })
 * export class HeroComponent {
 *   @ViewChild(CinematicEntranceDirective) entranceDirective!: CinematicEntranceDirective;
 *   preloadState = this.preloader.preload([...]);
 *
 *   entranceConfig: CinematicEntranceConfig = {
 *     preset: 'dolly-in',
 *     duration: 2.5,
 *     preloadState: this.preloadState,
 *   };
 *
 *   onControlsReady(controls: OrbitControls): void {
 *     this.entranceDirective.setOrbitControls(controls);
 *   }
 *
 *   async onEntranceComplete(): Promise<void> {
 *     await this.staggerService.revealGroup('scene-objects');
 *   }
 * }
 * ```
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
import { PerspectiveCamera, Vector3 } from 'three/webgpu';
import { OrbitControls } from 'three-stdlib';
import { SceneService } from '../../canvas/scene.service';
import type { PreloadState } from '../../loaders/asset-preloader.service';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Available entrance animation presets.
 *
 * - `dolly-in`: Camera moves forward along Z-axis toward scene center
 * - `orbit-drift`: Camera moves from offset position with combined horizontal/vertical drift
 * - `crane-up`: Camera rises from below, like a crane shot in film
 * - `fade-drift`: Gentle horizontal drift from the left
 */
export type EntrancePreset =
  | 'dolly-in'
  | 'orbit-drift'
  | 'crane-up'
  | 'fade-drift';

/**
 * Configuration for CinematicEntranceDirective
 */
export interface CinematicEntranceConfig {
  /**
   * Animation preset name.
   * If not specified, uses a subtle dolly-in as default.
   */
  preset?: EntrancePreset;

  /**
   * Animation duration in seconds.
   * @default 2.5
   */
  duration?: number;

  /**
   * Starting camera position [x, y, z].
   * Overrides preset start position if specified.
   */
  startPosition?: [number, number, number];

  /**
   * Ending camera position [x, y, z].
   * Overrides preset end position if specified.
   * @default Current camera position when animation starts
   */
  endPosition?: [number, number, number];

  /**
   * Starting look-at target [x, y, z].
   * Overrides preset start lookAt if specified.
   */
  startLookAt?: [number, number, number];

  /**
   * Ending look-at target [x, y, z].
   * Overrides preset end lookAt if specified.
   * @default [0, 0, 0]
   */
  endLookAt?: [number, number, number];

  /**
   * GSAP easing function name.
   * @default 'power2.inOut'
   * @see https://greensock.com/docs/v3/Eases
   */
  easing?: string;

  /**
   * Delay before starting animation in seconds.
   * @default 0
   */
  delay?: number;

  /**
   * Automatically start animation when ready.
   * If preloadState is provided, waits for isReady() to be true.
   * If no preloadState, starts immediately on init.
   * @default true
   */
  autoStart?: boolean;

  /**
   * Optional PreloadState to wait for before auto-starting.
   * When provided, animation waits until isReady() is true.
   */
  preloadState?: PreloadState;
}

/**
 * Internal interface for preset calculated values
 */
interface PresetValues {
  /** Start position as [x, y, z] tuple */
  startPosition: [number, number, number];
  /** End position as [x, y, z] tuple */
  endPosition: [number, number, number];
  /** Start look-at target as [x, y, z] tuple */
  startLookAt: [number, number, number];
  /** End look-at target as [x, y, z] tuple */
  endLookAt: [number, number, number];
}

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * CinematicEntranceDirective
 *
 * Applies cinematic camera entrance animations to 3D scenes.
 * Coordinates with OrbitControls by disabling them during animation
 * and syncing the target position after animation completes.
 */
@Directive({
  selector: '[a3dCinematicEntrance]',
  standalone: true,
})
export class CinematicEntranceDirective {
  // ================================
  // Dependency Injection
  // ================================

  /** Scene service for camera access and demand-based rendering */
  private readonly sceneService = inject(SceneService, { optional: true });

  /** DestroyRef for cleanup registration */
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // Inputs
  // ================================

  /**
   * Configuration for the entrance animation.
   * If undefined, directive is inactive (allows optional usage).
   */
  public readonly entranceConfig = input<CinematicEntranceConfig | undefined>(
    undefined
  );

  // ================================
  // Outputs
  // ================================

  /** Emitted when entrance animation starts */
  public readonly entranceStart = output<void>();

  /** Emitted when entrance animation completes */
  public readonly entranceComplete = output<void>();

  // ================================
  // Internal State
  // ================================

  /** GSAP timeline reference for cleanup */
  private gsapTimeline: gsap.core.Timeline | null = null;

  /** OrbitControls reference for coordination */
  private orbitControls: OrbitControls | null = null;

  /** Flag to prevent multiple animation starts */
  private animationStarted = false;

  /** Original camera position stored for cleanup/recovery */
  private originalCameraPosition: Vector3 | null = null;

  /** Internal destroyed state for async safety checks */
  private readonly isDestroyed = signal(false);

  // ================================
  // Constructor & Lifecycle
  // ================================

  public constructor() {
    // Effect: Watch for preload ready state OR immediate start conditions
    effect(() => {
      const config = this.entranceConfig();
      if (!config) return;

      // Don't proceed if already started or destroyed
      if (this.animationStarted || this.isDestroyed()) return;

      const camera = this.sceneService?.camera();
      if (!camera) return;

      // Check if we should auto-start
      const autoStart = config.autoStart ?? true;
      if (!autoStart) return;

      // Check preload state if provided
      if (config.preloadState) {
        const ready = config.preloadState.isReady();
        if (ready) {
          this.startEntrance();
        }
      } else {
        // No preload state - start immediately
        this.startEntrance();
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
   * Manually start the entrance animation.
   *
   * Use this for manual control when autoStart is false, or to
   * re-trigger the animation after completion.
   *
   * @example
   * ```typescript
   * @ViewChild(CinematicEntranceDirective) entrance!: CinematicEntranceDirective;
   *
   * triggerEntrance(): void {
   *   this.entrance.start();
   * }
   * ```
   */
  public start(): void {
    if (!this.animationStarted) {
      this.startEntrance();
    }
  }

  /**
   * Set OrbitControls reference for coordination.
   *
   * Controls will be disabled during animation and re-enabled after,
   * with target synced to the final lookAt position.
   *
   * @param controls - OrbitControls instance from OrbitControlsComponent
   *
   * @example
   * ```typescript
   * // In component
   * @ViewChild(CinematicEntranceDirective) entrance!: CinematicEntranceDirective;
   *
   * onControlsReady(controls: OrbitControls): void {
   *   this.entrance.setOrbitControls(controls);
   * }
   * ```
   */
  public setOrbitControls(controls: OrbitControls): void {
    this.orbitControls = controls;
  }

  /**
   * Check if the entrance animation has started.
   */
  public hasStarted(): boolean {
    return this.animationStarted;
  }

  /**
   * Check if the entrance animation is currently playing.
   */
  public isPlaying(): boolean {
    return this.gsapTimeline?.isActive() ?? false;
  }

  // ================================
  // Private Methods - Animation
  // ================================

  /**
   * Start the entrance animation.
   *
   * Handles:
   * - Dynamic GSAP import for tree-shaking
   * - Preset value calculation
   * - OrbitControls coordination
   * - Camera position/lookAt animation
   * - Reduced motion preference
   * - Demand-based rendering invalidation
   */
  private async startEntrance(): Promise<void> {
    const config = this.entranceConfig();
    const camera = this.sceneService?.camera();

    if (!config || !camera) {
      return;
    }

    // Prevent multiple starts
    this.animationStarted = true;
    this.entranceStart.emit();

    // Store original camera position for cleanup/recovery
    this.originalCameraPosition = camera.position.clone();

    // Disable OrbitControls during animation
    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }

    // Get preset values (or defaults)
    const presetValues = this.getPresetValues(config.preset, camera);

    // Override preset with custom values if provided
    const startPos = config.startPosition ?? presetValues.startPosition;
    const endPos = config.endPosition ?? presetValues.endPosition;
    const startLookAt = config.startLookAt ?? presetValues.startLookAt;
    const endLookAt = config.endLookAt ?? presetValues.endLookAt;
    const duration = config.duration ?? 2.5;
    const easing = config.easing ?? 'power2.inOut';
    const delay = config.delay ?? 0;

    // Set camera to start position immediately
    camera.position.set(startPos[0], startPos[1], startPos[2]);
    camera.lookAt(startLookAt[0], startLookAt[1], startLookAt[2]);
    this.sceneService?.invalidate();

    // Handle prefers-reduced-motion - skip animation, jump to end
    if (this.prefersReducedMotion()) {
      this.skipToEnd(camera, endPos, endLookAt);
      return;
    }

    // Dynamic GSAP import for tree-shaking optimization
    const { gsap } = await import('gsap');

    // Safety check: directive may have been destroyed during async import
    if (this.isDestroyed() || !this.entranceConfig()) {
      return;
    }

    // Create animation timeline
    this.gsapTimeline = gsap.timeline({
      delay,
      onComplete: () => this.onEntranceComplete(endLookAt),
    });

    // Create an animation proxy object for lookAt interpolation
    const lookAtProxy = {
      x: startLookAt[0],
      y: startLookAt[1],
      z: startLookAt[2],
    };

    // Animate camera position
    this.gsapTimeline.to(
      camera.position,
      {
        x: endPos[0],
        y: endPos[1],
        z: endPos[2],
        duration,
        ease: easing,
        onUpdate: () => {
          // Apply current lookAt position (interpolated separately)
          camera.lookAt(lookAtProxy.x, lookAtProxy.y, lookAtProxy.z);
          // Invalidate for demand-based rendering
          this.sceneService?.invalidate();
        },
      },
      0 // Start at timeline position 0
    );

    // Animate lookAt target in parallel
    this.gsapTimeline.to(
      lookAtProxy,
      {
        x: endLookAt[0],
        y: endLookAt[1],
        z: endLookAt[2],
        duration,
        ease: easing,
      },
      0 // Start at timeline position 0 (parallel with position)
    );
  }

  /**
   * Skip animation and jump to end state (for reduced motion).
   */
  private skipToEnd(
    camera: PerspectiveCamera,
    endPos: [number, number, number],
    endLookAt: [number, number, number]
  ): void {
    camera.position.set(endPos[0], endPos[1], endPos[2]);
    camera.lookAt(endLookAt[0], endLookAt[1], endLookAt[2]);
    this.sceneService?.invalidate();
    this.onEntranceComplete(endLookAt);
  }

  /**
   * Handle entrance animation completion.
   *
   * Re-enables OrbitControls and syncs target to final lookAt position.
   */
  private onEntranceComplete(endLookAt: [number, number, number]): void {
    // Re-enable OrbitControls and sync target
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
      this.orbitControls.target.set(endLookAt[0], endLookAt[1], endLookAt[2]);
      this.orbitControls.update();
    }

    this.entranceComplete.emit();
  }

  // ================================
  // Private Methods - Presets
  // ================================

  /**
   * Get preset animation values based on preset name and current camera.
   *
   * @param preset - Preset name or undefined for default
   * @param camera - Current camera for position reference
   * @returns Calculated preset values
   */
  private getPresetValues(
    preset: EntrancePreset | undefined,
    camera: PerspectiveCamera | null
  ): PresetValues {
    // Get current camera position as default end position
    const currentPos = camera?.position ?? new Vector3(0, 2, 8);
    const endPos: [number, number, number] = [
      currentPos.x,
      currentPos.y,
      currentPos.z,
    ];

    switch (preset) {
      case 'dolly-in':
        // Move camera from far to close along Z-axis toward scene center
        // Creates a classic film "push in" effect
        return {
          startPosition: [endPos[0], endPos[1], endPos[2] + 10],
          endPosition: endPos,
          startLookAt: [0, 0, 0],
          endLookAt: [0, 0, 0],
        };

      case 'orbit-drift':
        // Camera starts offset to the right and higher, drifting into position
        // Creates a sweeping reveal effect
        return {
          startPosition: [endPos[0] + 5, endPos[1] + 2, endPos[2] + 5],
          endPosition: endPos,
          startLookAt: [0, 0, 0],
          endLookAt: [0, 0, 0],
        };

      case 'crane-up':
        // Camera rises from below, like a crane shot in cinematography
        // Creates dramatic upward reveal
        return {
          startPosition: [endPos[0], endPos[1] - 5, endPos[2]],
          endPosition: endPos,
          startLookAt: [0, -3, 0],
          endLookAt: [0, 0, 0],
        };

      case 'fade-drift':
        // Gentle horizontal drift from the left
        // Creates subtle, elegant entrance
        return {
          startPosition: [endPos[0] - 3, endPos[1], endPos[2]],
          endPosition: endPos,
          startLookAt: [0, 0, 0],
          endLookAt: [0, 0, 0],
        };

      default:
        // Default: subtle dolly-in (less dramatic than 'dolly-in' preset)
        return {
          startPosition: [endPos[0], endPos[1], endPos[2] + 3],
          endPosition: endPos,
          startLookAt: [0, 0, 0],
          endLookAt: [0, 0, 0],
        };
    }
  }

  // ================================
  // Private Methods - Utilities
  // ================================

  /**
   * Check if user prefers reduced motion.
   *
   * Respects the 'prefers-reduced-motion: reduce' media query.
   * When enabled, animations skip to end state immediately.
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
   * Cleanup animation resources.
   *
   * Called on destroy. Kills GSAP timeline and re-enables OrbitControls
   * if animation was interrupted.
   */
  private cleanup(): void {
    // Kill GSAP timeline
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }

    // Re-enable OrbitControls if animation was interrupted
    if (this.orbitControls && !this.orbitControls.enabled) {
      this.orbitControls.enabled = true;
    }

    // Clear references
    this.orbitControls = null;
    this.originalCameraPosition = null;
  }
}
