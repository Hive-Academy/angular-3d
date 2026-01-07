/**
 * SceneRevealDirective - Declarative Object Reveal Animations for Three.js
 *
 * Adds reveal animations to 3D objects with multiple animation types:
 * fade-in, scale-pop, and rise-up. Integrates with StaggerGroupService
 * for coordinated cascade reveal effects across multiple objects.
 *
 * Features:
 * - 3 animation types: fade-in, scale-pop, rise-up
 * - Signal-based reactive configuration
 * - Automatic state capture and restoration
 * - Stagger group integration for coordinated reveals
 * - Reduced motion support (skips to end state)
 * - Automatic lifecycle management with DestroyRef
 * - Public API for programmatic control (reveal, hide)
 *
 * @example
 * ```html
 * <!-- Simple usage with fade-in -->
 * <a3d-box
 *   a3dSceneReveal
 *   [revealConfig]="{ animation: 'fade-in' }"
 *   (revealComplete)="onRevealComplete()"
 * />
 *
 * <!-- With stagger group coordination -->
 * <a3d-sphere
 *   a3dSceneReveal
 *   [revealConfig]="{
 *     animation: 'scale-pop',
 *     staggerGroup: 'hero-items',
 *     staggerIndex: 0,
 *     duration: 0.8
 *   }"
 * />
 *
 * <a3d-box
 *   a3dSceneReveal
 *   [revealConfig]="{
 *     animation: 'rise-up',
 *     staggerGroup: 'hero-items',
 *     staggerIndex: 1,
 *     duration: 0.8
 *   }"
 * />
 * ```
 *
 * @example
 * ```typescript
 * // Triggering stagger group reveal after entrance animation
 * @Component({...})
 * export class HeroComponent {
 *   private staggerService = inject(StaggerGroupService);
 *
 *   async onEntranceComplete(): Promise<void> {
 *     await this.staggerService.revealGroup('hero-items', 150);
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
  output,
  signal,
} from '@angular/core';
import { Material, Object3D, Vector3 } from 'three/webgpu';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { SceneService } from '../../canvas/scene.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import {
  StaggerGroupService,
  type RevealableDirective,
} from './stagger-group.service';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Available reveal animation types.
 *
 * - `fade-in`: Material opacity animates from 0 to original
 * - `scale-pop`: Scale animates from near-zero with overshoot effect
 * - `rise-up`: Position animates upward from below original position
 */
export type RevealAnimation = 'fade-in' | 'scale-pop' | 'rise-up';

/**
 * Configuration for SceneRevealDirective
 */
export interface SceneRevealConfig {
  /**
   * Animation type for the reveal effect.
   * @default 'fade-in'
   */
  animation?: RevealAnimation;

  /**
   * Animation duration in seconds.
   * @default 0.8
   */
  duration?: number;

  /**
   * Delay before starting animation in seconds.
   * @default 0
   */
  delay?: number;

  /**
   * GSAP easing function name.
   * Note: scale-pop uses 'back.out(1.4)' by default for overshoot effect.
   * @default 'power2.out'
   * @see https://greensock.com/docs/v3/Eases
   */
  easing?: string;

  /**
   * Stagger group name for coordinated animations.
   * Objects with the same group name can be revealed together with stagger delay.
   */
  staggerGroup?: string;

  /**
   * Index within stagger group for ordering.
   * Lower indices reveal first.
   * @default 0
   */
  staggerIndex?: number;

  /**
   * Automatically reveal when directive initializes.
   * Set to false to manually trigger reveal via reveal() method.
   * @default false
   */
  autoReveal?: boolean;
}

/**
 * Original state captured for restoration
 */
interface OriginalState {
  /** Original position */
  position: Vector3;
  /** Original scale */
  scale: Vector3;
  /** Map of materials to their original opacity values */
  opacity: Map<Material, number>;
  /** Original visibility state */
  visible: boolean;
}

// ============================================================================
// Directive Implementation
// ============================================================================

/**
 * SceneRevealDirective
 *
 * Applies reveal animations to 3D objects by capturing their original state,
 * setting a hidden state, and animating back to the original state on reveal.
 *
 * Implements RevealableDirective interface for StaggerGroupService integration.
 */
@Directive({
  selector: '[a3dSceneReveal]',
  standalone: true,
})
export class SceneRevealDirective implements RevealableDirective {
  // ================================
  // Dependency Injection
  // ================================

  /** Scene graph store for object access */
  private readonly sceneStore = inject(SceneGraphStore);

  /** Scene service for demand-based rendering invalidation */
  private readonly sceneService = inject(SceneService, { optional: true });

  /** Object ID token from host component */
  private readonly objectId = inject(OBJECT_ID, { optional: true });

  /** DestroyRef for cleanup registration */
  private readonly destroyRef = inject(DestroyRef);

  /** Stagger group service for coordinated animations */
  private readonly staggerService = inject(StaggerGroupService, {
    optional: true,
  });

  // ================================
  // Inputs
  // ================================

  /**
   * Configuration for the reveal animation.
   * If undefined, directive is inactive (allows optional usage).
   */
  public readonly revealConfig = input<SceneRevealConfig | undefined>(
    undefined
  );

  // ================================
  // Outputs
  // ================================

  /** Emitted when reveal animation starts */
  public readonly revealStart = output<void>();

  /** Emitted when reveal animation completes */
  public readonly revealComplete = output<void>();

  // ================================
  // Internal State
  // ================================

  /** GSAP timeline reference for cleanup */
  private gsapTimeline: gsap.core.Timeline | null = null;

  /** Captured original state for restoration */
  private originalState: OriginalState | null = null;

  /** Whether the object is currently in hidden state */
  private isHidden = false;

  /** Whether initialization has completed */
  private isInitialized = false;

  /** Internal destroyed state for async safety checks */
  private readonly isDestroyed = signal(false);

  // ================================
  // Computed Signals
  // ================================

  /**
   * Computed signal for accessing the 3D object.
   * Uses SceneGraphStore pattern from Float3dDirective.
   */
  private readonly object3D = computed(() => {
    if (!this.objectId) return null;
    return this.sceneStore.getObject<Object3D>(this.objectId);
  });

  // ================================
  // Constructor & Lifecycle
  // ================================

  public constructor() {
    // Effect: Initialize hidden state when object and config are ready
    effect(() => {
      const obj = this.object3D();
      const config = this.revealConfig();

      // Don't proceed if destroyed or already initialized
      if (this.isDestroyed() || this.isInitialized) return;

      if (obj && config) {
        // Capture original state
        this.captureOriginalState(obj);

        // Set object to hidden state
        this.setHiddenState(obj, config);

        // Register with stagger group if configured
        this.registerWithStaggerGroup(config);

        // Mark as initialized
        this.isInitialized = true;

        // Auto-reveal if configured
        if (config.autoReveal) {
          this.reveal();
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
  // Public API (RevealableDirective)
  // ================================

  /**
   * Trigger the reveal animation.
   *
   * Animates the object from hidden state back to its original state.
   * Returns a Promise that resolves when animation completes.
   *
   * @example
   * ```typescript
   * @ViewChild(SceneRevealDirective) revealDir!: SceneRevealDirective;
   *
   * async triggerReveal(): Promise<void> {
   *   await this.revealDir.reveal();
   *   console.log('Reveal complete!');
   * }
   * ```
   */
  public async reveal(): Promise<void> {
    // Guard: Already visible or not initialized
    if (!this.isHidden || !this.isInitialized) {
      return;
    }

    const obj = this.object3D();
    const config = this.revealConfig();

    if (!obj || !config || !this.originalState) {
      return;
    }

    this.revealStart.emit();

    const animation = config.animation ?? 'fade-in';
    const duration = config.duration ?? 0.8;
    const delay = config.delay ?? 0;
    const easing = config.easing ?? 'power2.out';

    // Handle prefers-reduced-motion - skip to end state immediately
    if (this.prefersReducedMotion()) {
      this.restoreOriginalState(obj);
      this.isHidden = false;
      this.revealComplete.emit();
      return;
    }

    // Dynamic GSAP import for tree-shaking optimization
    const { gsap } = await import('gsap');

    // Safety check: directive may have been destroyed during async import
    if (this.isDestroyed() || !this.revealConfig()) {
      return;
    }

    // Create a Promise that resolves when animation completes
    return new Promise<void>((resolve) => {
      this.gsapTimeline = gsap.timeline({
        delay,
        onComplete: () => {
          this.isHidden = false;
          this.revealComplete.emit();
          resolve();
        },
      });

      // Execute animation based on type
      switch (animation) {
        case 'fade-in':
          this.animateFadeIn(obj, duration, easing);
          break;

        case 'scale-pop':
          this.animateScalePop(obj, duration);
          break;

        case 'rise-up':
          this.animateRiseUp(obj, duration, easing);
          break;
      }
    });
  }

  /**
   * Hide the object (reverse of reveal).
   *
   * Returns the object to its hidden state. Useful for re-revealing
   * or resetting scenes.
   *
   * @example
   * ```typescript
   * await revealDir.hide();
   * // Object is now hidden, can reveal again
   * await revealDir.reveal();
   * ```
   */
  public async hide(): Promise<void> {
    // Guard: Already hidden or not initialized
    if (this.isHidden || !this.isInitialized) {
      return;
    }

    const obj = this.object3D();
    const config = this.revealConfig();

    if (!obj || !config) {
      return;
    }

    // Kill any running animation
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }

    // Set back to hidden state
    this.setHiddenState(obj, config);
  }

  /**
   * Check if the object is currently in hidden state.
   */
  public isCurrentlyHidden(): boolean {
    return this.isHidden;
  }

  /**
   * Check if reveal animation is currently playing.
   */
  public isPlaying(): boolean {
    return this.gsapTimeline?.isActive() ?? false;
  }

  // ================================
  // Private Methods - State Management
  // ================================

  /**
   * Capture original object state for later restoration.
   *
   * Traverses the object hierarchy to capture:
   * - Position
   * - Scale
   * - Material opacities (handles arrays and single materials)
   * - Visibility
   */
  private captureOriginalState(obj: Object3D): void {
    const opacityMap = new Map<Material, number>();

    // Traverse object to capture all material opacities
    obj.traverse((child) => {
      if ('material' in child && child.material) {
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materials.forEach((mat: Material) => {
          // Only capture if not already in map (avoid duplicates)
          if (!opacityMap.has(mat)) {
            opacityMap.set(mat, mat.opacity);
          }
        });
      }
    });

    this.originalState = {
      position: obj.position.clone(),
      scale: obj.scale.clone(),
      opacity: opacityMap,
      visible: obj.visible,
    };
  }

  /**
   * Set object to hidden state based on animation type.
   *
   * @param obj - The 3D object to hide
   * @param config - Configuration specifying animation type
   */
  private setHiddenState(obj: Object3D, config: SceneRevealConfig): void {
    const animation = config.animation ?? 'fade-in';
    this.isHidden = true;

    switch (animation) {
      case 'fade-in':
        // Set all materials to transparent with 0 opacity
        obj.traverse((child) => {
          if ('material' in child && child.material) {
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            materials.forEach((mat: Material) => {
              mat.transparent = true;
              mat.opacity = 0;
              mat.needsUpdate = true;
            });
          }
        });
        break;

      case 'scale-pop':
        // Set scale to near-zero (not 0 to avoid rendering issues)
        obj.scale.setScalar(0.01);
        break;

      case 'rise-up':
        // Offset position downward
        obj.position.y -= 2;
        break;
    }

    // Invalidate for demand-based rendering
    this.sceneService?.invalidate();
  }

  /**
   * Register with stagger group service if configured.
   */
  private registerWithStaggerGroup(config: SceneRevealConfig): void {
    if (config.staggerGroup && this.staggerService) {
      this.staggerService.register(
        config.staggerGroup,
        this,
        config.staggerIndex ?? 0
      );
    }
  }

  // ================================
  // Private Methods - Animations
  // ================================

  /**
   * Animate fade-in effect (opacity 0 to original).
   *
   * Traverses all materials in the object and animates their opacity
   * back to the captured original values.
   */
  private animateFadeIn(obj: Object3D, duration: number, easing: string): void {
    // Collect all materials
    const materials: Material[] = [];

    obj.traverse((child) => {
      if ('material' in child && child.material) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        materials.push(...mats);
      }
    });

    // Animate each material's opacity
    materials.forEach((mat) => {
      const originalOpacity = this.originalState?.opacity.get(mat) ?? 1;

      this.gsapTimeline!.to(
        mat,
        {
          opacity: originalOpacity,
          duration,
          ease: easing,
          onUpdate: () => {
            mat.needsUpdate = true;
            this.sceneService?.invalidate();
          },
        },
        0 // All start at position 0 (parallel)
      );
    });
  }

  /**
   * Animate scale-pop effect (scale 0.01 to original with overshoot).
   *
   * Uses 'back.out(1.4)' easing for the characteristic "pop" overshoot effect.
   */
  private animateScalePop(obj: Object3D, duration: number): void {
    const targetScale = this.originalState!.scale;

    this.gsapTimeline!.to(obj.scale, {
      x: targetScale.x,
      y: targetScale.y,
      z: targetScale.z,
      duration,
      ease: 'back.out(1.4)', // Overshoot for "pop" effect
      onUpdate: () => {
        this.sceneService?.invalidate();
      },
    });
  }

  /**
   * Animate rise-up effect (position y offset to original).
   *
   * Animates the object upward from its offset position to the original.
   */
  private animateRiseUp(obj: Object3D, duration: number, easing: string): void {
    const targetY = this.originalState!.position.y;

    this.gsapTimeline!.to(obj.position, {
      y: targetY,
      duration,
      ease: easing,
      onUpdate: () => {
        this.sceneService?.invalidate();
      },
    });
  }

  // ================================
  // Private Methods - Utilities
  // ================================

  /**
   * Restore object to its original captured state.
   *
   * Used for reduced motion (instant jump to end) and cleanup.
   */
  private restoreOriginalState(obj: Object3D): void {
    if (!this.originalState) return;

    // Restore position
    obj.position.copy(this.originalState.position);

    // Restore scale
    obj.scale.copy(this.originalState.scale);

    // Restore material opacities
    this.originalState.opacity.forEach((opacity, mat) => {
      mat.opacity = opacity;
      mat.needsUpdate = true;
    });

    // Invalidate for demand-based rendering
    this.sceneService?.invalidate();
  }

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
   * Called on destroy. Kills GSAP timeline, restores original state,
   * and unregisters from stagger group.
   */
  private cleanup(): void {
    // Kill GSAP timeline
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }

    // Restore original state if object still exists
    const obj = this.object3D();
    if (obj && this.originalState) {
      this.restoreOriginalState(obj);
    }

    // Unregister from stagger group
    const config = this.revealConfig();
    if (config?.staggerGroup && this.staggerService) {
      this.staggerService.unregister(config.staggerGroup, this);
    }

    // Clear state
    this.originalState = null;
  }
}
