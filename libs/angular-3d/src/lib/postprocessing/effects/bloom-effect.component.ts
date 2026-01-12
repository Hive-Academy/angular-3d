/**
 * Bloom Effect Component - Declarative Bloom effect using TSL
 *
 * Adds post-processing bloom effect using native TSL bloom node.
 * TSL nodes automatically transpile to WGSL (WebGPU) or GLSL (WebGL fallback).
 *
 * Migration from three-stdlib UnrealBloomPass complete (TASK_2025_031 Batch 5).
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  OnDestroy,
} from '@angular/core';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * Declarative Bloom effect using native TSL bloom node.
 *
 * Must be used inside `a3d-effect-composer`.
 *
 * Uses native THREE.PostProcessing with TSL bloom() node.
 * Replaces three-stdlib UnrealBloomPass.
 *
 * @example
 * ```html
 * <a3d-bloom-effect
 *   [threshold]="0"
 *   [strength]="1.5"
 *   [radius]="0.4"
 * />
 * ```
 *
 * @example
 * ```html
 * <!-- Strong bloom for glowing UI elements -->
 * <a3d-bloom-effect
 *   [threshold]="0.8"
 *   [strength]="2.5"
 *   [radius]="0.6"
 * />
 * ```
 */
@Component({
  selector: 'a3d-bloom-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BloomEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  /**
   * Bloom threshold - only objects with luminance > threshold will bloom
   * Default: 0.3 (only bright objects glow, not all objects)
   */
  public readonly threshold = input<number>(0.3);

  /**
   * Bloom strength - intensity of the glow effect
   * Default: 1.8 (noticeable but not overwhelming glow)
   */
  public readonly strength = input<number>(1.8);

  /**
   * Bloom radius - spread of the glow effect
   * Default: 0.4 (balanced spread)
   */
  public readonly radius = input<number>(0.4);

  private effectAdded = false;

  public constructor() {
    // Add bloom effect when renderer is available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.effectAdded) {
        // Initialize the composer first (if not already done)
        this.composerService.init(renderer, scene, camera);

        // Add bloom effect using TSL bloom node
        this.composerService.addBloom({
          threshold: this.threshold(),
          strength: this.strength(),
          radius: this.radius(),
        });

        this.effectAdded = true;

        // Enable the composer to switch render function
        this.composerService.enable();
      }
    });

    // Update bloom parameters reactively
    effect(() => {
      if (this.effectAdded) {
        this.composerService.updateBloom({
          threshold: this.threshold(),
          strength: this.strength(),
          radius: this.radius(),
        });
        this.sceneService.invalidate();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.effectAdded) {
      this.composerService.removeBloom();
      this.effectAdded = false;
    }
  }
}
