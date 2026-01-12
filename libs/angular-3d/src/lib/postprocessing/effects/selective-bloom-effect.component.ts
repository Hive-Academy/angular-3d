/**
 * Selective Bloom Effect Component - Bloom only specific objects
 *
 * Uses Three.js Layers to apply bloom only to objects on a specific layer.
 * Objects not on the bloom layer will NOT be affected by bloom.
 *
 * This creates a true "neon" effect where only the glowing objects bloom,
 * not the entire scene.
 *
 * @example
 * ```html
 * <a3d-selective-bloom-effect
 *   [layer]="1"
 *   [threshold]="0"
 *   [strength]="1.5"
 *   [radius]="0.4"
 * />
 * ```
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

@Component({
  selector: 'a3d-selective-bloom-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectiveBloomEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  /**
   * Layer number for bloom objects (1-31).
   * Only objects with this layer enabled will bloom.
   * Default: 1
   */
  public readonly layer = input<number>(1);

  /**
   * Bloom threshold - only objects with luminance > threshold will bloom
   * Default: 0 (all bright areas on the layer glow)
   */
  public readonly threshold = input<number>(0);

  /**
   * Bloom strength - intensity of the glow effect
   * Default: 1.5
   */
  public readonly strength = input<number>(1.5);

  /**
   * Bloom radius - spread of the glow effect
   * Default: 0.4
   */
  public readonly radius = input<number>(0.4);

  private effectAdded = false;

  public constructor() {
    // Add selective bloom effect when renderer is available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.effectAdded) {
        // Initialize the composer first (if not already done)
        this.composerService.init(renderer, scene, camera);

        // Add selective bloom effect using layer-based rendering
        this.composerService.addSelectiveBloom({
          layer: this.layer(),
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
        this.composerService.updateSelectiveBloom({
          layer: this.layer(),
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
      this.composerService.removeSelectiveBloom();
      this.effectAdded = false;
    }
  }
}
