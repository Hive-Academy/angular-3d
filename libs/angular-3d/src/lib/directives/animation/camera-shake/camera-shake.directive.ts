/**
 * CameraShakeDirective - Configurable Camera Shake Effects for Three.js Scenes
 *
 * Provides smooth, organic camera shake effects that can be triggered
 * programmatically or enabled via inputs. Works independently or
 * alongside flight directives (CameraFlightDirective, ObjectFlightDirective).
 *
 * Features:
 * - Configurable intensity, frequency, and decay
 * - Per-axis control (X, Y, Z)
 * - One-shot triggers with auto-stop
 * - Continuous shake with manual control
 * - Signal-based reactive inputs
 * - Automatic position restoration
 * - Integrates with demand-based rendering
 *
 * @example
 * ```html
 * <!-- Basic usage - controlled via inputs -->
 * <div
 *   a3dCameraShake
 *   [shakeEnabled]="isTransitioning()"
 *   [shakeIntensity]="0.08"
 *   [shakeFrequency]="12"
 * />
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic control
 * @Component({
 *   template: `
 *     <a3d-scene-3d>
 *       <div #shaker a3dCameraShake />
 *       <!-- Scene content -->
 *     </a3d-scene-3d>
 *   `
 * })
 * export class MyComponent {
 *   @ViewChild('shaker', { read: CameraShakeDirective })
 *   cameraShake!: CameraShakeDirective;
 *
 *   onImpact(): void {
 *     // Trigger a 0.5 second shake
 *     this.cameraShake.triggerShake({ duration: 0.5, intensity: 0.15 });
 *   }
 *
 *   startContinuousShake(): void {
 *     this.cameraShake.startShake({ intensity: 0.05, frequency: 8 });
 *   }
 *
 *   stopShake(): void {
 *     this.cameraShake.stopShake();
 *   }
 * }
 * ```
 *
 * @module camera-shake
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
import { Vector3 } from 'three/webgpu';
import { SceneService } from '../../../canvas/scene.service';
import { RenderLoopService } from '../../../render-loop/render-loop.service';
import type {
  CameraShakeConfig,
  CameraShakeEvent,
  ShakeTriggerOptions,
} from './camera-shake.types';

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * CameraShakeDirective
 *
 * Applies organic camera shake effects to the scene camera.
 * Can be placed on any element within a Scene3dComponent.
 */
@Directive({
  selector: '[a3dCameraShake]',
  standalone: true,
})
export class CameraShakeDirective {
  // ================================
  // Dependency Injection
  // ================================

  /** Scene service for camera access and demand-based rendering */
  private readonly sceneService = inject(SceneService, { optional: true });

  /** Render loop service for per-frame updates */
  private readonly renderLoop = inject(RenderLoopService, { optional: true });

  /** DestroyRef for cleanup registration */
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // Inputs (Signal-based)
  // ================================

  /**
   * Enable/disable shake via input binding.
   * When true, shake starts automatically with current settings.
   * When false, shake stops and camera position is restored.
   * @default false
   */
  public readonly shakeEnabled = input<boolean>(false);

  /**
   * Shake intensity in scene units.
   * Higher values = more violent shake.
   * @default 0.05
   */
  public readonly shakeIntensity = input<number>(0.05);

  /**
   * Shake frequency (higher = faster oscillation).
   * Controls how rapidly the camera oscillates.
   * @default 10
   */
  public readonly shakeFrequency = input<number>(10);

  /**
   * Decay rate per second (0 = no decay, 1 = instant decay).
   * When > 0, shake intensity decreases over time.
   * @default 0
   */
  public readonly shakeDecay = input<number>(0);

  /**
   * Maximum offset in X axis.
   * If not specified, uses the intensity value.
   */
  public readonly shakeMaxX = input<number | undefined>(undefined);

  /**
   * Maximum offset in Y axis.
   * If not specified, uses intensity * 0.8 for slightly less vertical shake.
   */
  public readonly shakeMaxY = input<number | undefined>(undefined);

  /**
   * Maximum offset in Z axis.
   * @default 0 (no Z shake by default)
   */
  public readonly shakeMaxZ = input<number>(0);

  // ================================
  // Outputs
  // ================================

  /**
   * Emitted when shake state changes.
   * Contains current shake status, intensity, and elapsed time.
   */
  public readonly shakeChange = output<CameraShakeEvent>();

  // ================================
  // Internal State (Signals)
  // ================================

  /** Whether shake is currently active */
  private readonly isShaking = signal(false);

  /** Internal destroyed state for async safety checks */
  private readonly isDestroyed = signal(false);

  // ================================
  // Internal State (Mutable)
  // ================================

  /** Original camera position to restore after shake */
  private originalPosition: Vector3 | null = null;

  /** Shake start time for elapsed calculation */
  private shakeStartTime = 0;

  /** Current shake elapsed time */
  private shakeElapsedTime = 0;

  /** Render loop cleanup function */
  private renderLoopCleanup: (() => void) | null = null;

  /** Timeout for auto-stop (triggered shakes) */
  private autoStopTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Active shake configuration */
  private activeConfig: CameraShakeConfig = {
    intensity: 0.05,
    frequency: 10,
    decay: 0,
  };

  /** Random seeds for organic shake (different per axis) */
  private readonly shakeSeedsX = [1.0, 2.3, 3.7];
  private readonly shakeSeedsY = [1.5, 2.7, 4.1];
  private readonly shakeSeedsZ = [1.2, 2.9, 3.5];

  // ================================
  // Constructor & Lifecycle
  // ================================

  public constructor() {
    // Effect: React to shakeEnabled input changes
    effect(() => {
      const enabled = this.shakeEnabled();
      const currentlyShaking = this.isShaking();

      if (enabled && !currentlyShaking) {
        this.startShake();
      } else if (!enabled && currentlyShaking) {
        this.stopShake();
      }
    });

    // Effect: Update active config when inputs change (if shaking)
    effect(() => {
      if (!this.isShaking()) return;

      this.activeConfig = {
        intensity: this.shakeIntensity(),
        frequency: this.shakeFrequency(),
        decay: this.shakeDecay(),
        maxX: this.shakeMaxX(),
        maxY: this.shakeMaxY(),
        maxZ: this.shakeMaxZ(),
      };
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
   * Start camera shake with optional config override.
   *
   * @param config - Optional configuration to override inputs
   *
   * @example
   * ```typescript
   * // Start with default settings from inputs
   * this.cameraShake.startShake();
   *
   * // Start with custom settings
   * this.cameraShake.startShake({ intensity: 0.1, frequency: 15 });
   * ```
   */
  public startShake(config?: Partial<CameraShakeConfig>): void {
    if (this.isShaking() || this.isDestroyed()) return;

    // Build active config from inputs and overrides
    this.activeConfig = {
      intensity: config?.intensity ?? this.shakeIntensity(),
      frequency: config?.frequency ?? this.shakeFrequency(),
      decay: config?.decay ?? this.shakeDecay(),
      maxX: config?.maxX ?? this.shakeMaxX(),
      maxY: config?.maxY ?? this.shakeMaxY(),
      maxZ: config?.maxZ ?? this.shakeMaxZ(),
    };

    // Store original camera position
    const camera = this.sceneService?.camera();
    if (camera) {
      this.originalPosition = camera.position.clone();
    }

    // Reset timing
    this.shakeStartTime = performance.now() / 1000;
    this.shakeElapsedTime = 0;

    // Start shake
    this.isShaking.set(true);
    this.registerShakeLoop();

    // Emit start event
    this.emitShakeChange();
  }

  /**
   * Stop camera shake and restore camera position.
   *
   * @example
   * ```typescript
   * this.cameraShake.stopShake();
   * ```
   */
  public stopShake(): void {
    if (!this.isShaking()) return;

    // Clear auto-stop timeout if present
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }

    // Stop render loop
    if (this.renderLoopCleanup) {
      this.renderLoopCleanup();
      this.renderLoopCleanup = null;
    }

    // Restore camera position
    const camera = this.sceneService?.camera();
    if (camera && this.originalPosition) {
      camera.position.copy(this.originalPosition);
      this.sceneService?.invalidate();
    }

    // Reset state
    this.isShaking.set(false);
    this.originalPosition = null;

    // Emit stop event
    this.emitShakeChange();
  }

  /**
   * Trigger a one-shot shake that automatically stops after duration.
   *
   * @param options - Shake trigger options (duration required)
   *
   * @example
   * ```typescript
   * // Quick impact shake
   * this.cameraShake.triggerShake({ duration: 0.3, intensity: 0.12 });
   *
   * // Longer rumble with fadeout
   * this.cameraShake.triggerShake({
   *   duration: 2,
   *   intensity: 0.08,
   *   fadeOut: true
   * });
   * ```
   */
  public triggerShake(options: ShakeTriggerOptions): void {
    // Stop any existing shake
    if (this.isShaking()) {
      this.stopShake();
    }

    // Start with trigger options
    this.startShake({
      intensity: options.intensity,
      frequency: options.frequency,
      // If fadeOut is true, calculate decay to reach ~0 at duration end
      // decay = 1/duration makes intensity decay to ~37% at end (exponential)
      // Using 3/duration for faster decay to near 0
      decay: options.fadeOut !== false ? 3 / options.duration : 0,
    });

    // Set auto-stop timeout
    this.autoStopTimeout = setTimeout(() => {
      if (!this.isDestroyed()) {
        this.stopShake();
      }
    }, options.duration * 1000);
  }

  /**
   * Get current shake state.
   *
   * @returns Whether shake is currently active
   */
  public getIsShaking(): boolean {
    return this.isShaking();
  }

  // ================================
  // Private Methods - Shake Logic
  // ================================

  /**
   * Register the shake update loop with RenderLoopService.
   */
  private registerShakeLoop(): void {
    if (!this.renderLoop) {
      console.warn('[CameraShakeDirective] RenderLoopService not available');
      return;
    }

    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(
      (_delta, elapsed) => {
        this.updateShake(elapsed);
      }
    );
  }

  /**
   * Update camera position with shake offset each frame.
   */
  private updateShake(elapsed: number): void {
    if (!this.isShaking() || this.isDestroyed()) return;

    const camera = this.sceneService?.camera();
    if (!camera || !this.originalPosition) return;

    // Calculate elapsed time since shake started
    this.shakeElapsedTime = elapsed - this.shakeStartTime;

    // Calculate current intensity (with decay)
    const { intensity, frequency, decay, maxX, maxY, maxZ } = this.activeConfig;
    const currentIntensity =
      decay > 0
        ? intensity * Math.exp(-decay * this.shakeElapsedTime)
        : intensity;

    // If intensity decayed to near-zero, stop shake
    if (currentIntensity < 0.0001) {
      this.stopShake();
      return;
    }

    // Calculate shake offsets using multiple sine waves for organic feel
    const time = elapsed * frequency;
    const offsetX = this.calculateShakeOffset(
      time,
      this.shakeSeedsX,
      maxX ?? currentIntensity
    );
    const offsetY = this.calculateShakeOffset(
      time,
      this.shakeSeedsY,
      maxY ?? currentIntensity * 0.8
    );
    const offsetZ = this.calculateShakeOffset(
      time,
      this.shakeSeedsZ,
      maxZ ?? 0
    );

    // Apply intensity multiplier
    const intensityMultiplier = currentIntensity / intensity; // Normalize to 0-1 range

    // Apply shake offset to camera
    camera.position.set(
      this.originalPosition.x + offsetX * intensityMultiplier,
      this.originalPosition.y + offsetY * intensityMultiplier,
      this.originalPosition.z + offsetZ * intensityMultiplier
    );

    // Invalidate for demand-based rendering
    this.sceneService?.invalidate();

    // Emit update event
    this.emitShakeChange();
  }

  /**
   * Calculate shake offset for one axis using layered sine waves.
   * Creates more organic, less predictable shake than a single sine wave.
   */
  private calculateShakeOffset(
    time: number,
    seeds: number[],
    maxOffset: number
  ): number {
    if (maxOffset === 0) return 0;

    // Layer 3 sine waves with different frequencies and phases
    const wave1 = Math.sin(time * seeds[0]) * 0.5;
    const wave2 = Math.sin(time * seeds[1] * 1.3) * 0.3;
    const wave3 = Math.sin(time * seeds[2] * 1.7) * 0.2;

    // Combine waves and scale by max offset
    return (wave1 + wave2 + wave3) * maxOffset;
  }

  // ================================
  // Private Methods - Utilities
  // ================================

  /**
   * Emit current shake state change event.
   */
  private emitShakeChange(): void {
    this.shakeChange.emit({
      isShaking: this.isShaking(),
      currentIntensity: this.isShaking()
        ? this.activeConfig.decay > 0
          ? this.activeConfig.intensity *
            Math.exp(-this.activeConfig.decay * this.shakeElapsedTime)
          : this.activeConfig.intensity
        : 0,
      elapsedTime: this.shakeElapsedTime,
    });
  }

  /**
   * Cleanup all resources.
   */
  private cleanup(): void {
    // Stop shake if active
    if (this.isShaking()) {
      // Don't emit events during cleanup
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
        this.renderLoopCleanup = null;
      }

      // Restore camera position
      const camera = this.sceneService?.camera();
      if (camera && this.originalPosition) {
        camera.position.copy(this.originalPosition);
      }
    }

    // Clear timeout
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }

    // Clear references
    this.originalPosition = null;
  }
}
