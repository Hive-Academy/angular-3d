/**
 * Color Grading Effect Component - Cinematic color correction using TSL
 *
 * Provides comprehensive color grading controls including saturation,
 * exposure, gamma, and vignette effects.
 * Uses native TSL color operations for real-time color manipulation.
 *
 * Note: contrast/brightness are implemented manually since they don't
 * exist as standalone TSL functions.
 *
 * Migration to TSL color nodes (TASK_2025_031 Batch 5).
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
 * ColorGradingEffectComponent - Cinematic color correction using TSL
 *
 * Adjusts saturation, gamma, exposure, and vignette.
 * Perfect for creating cinematic looks or correcting scene colors.
 *
 * Must be used inside a3d-scene-3d.
 *
 * Uses native TSL color operations:
 * - saturation() for color intensity
 * - Manual contrast/brightness via math operations
 * - Custom TSL functions for gamma, exposure, vignette
 *
 * @example
 * ```html
 * <a3d-scene-3d>
 *   <a3d-color-grading-effect
 *     [saturation]="1.2"
 *     [contrast]="1.1"
 *     [vignette]="0.3"
 *   />
 * </a3d-scene-3d>
 * ```
 */
@Component({
  selector: 'a3d-color-grading-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorGradingEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  /**
   * Saturation level - controls color intensity
   * 0 = grayscale, 1 = normal, >1 = more vibrant colors
   * Default: 1 (no change)
   */
  public readonly saturation = input<number>(1);

  /**
   * Contrast level - difference between light and dark areas
   * <1 = flatter image, 1 = normal, >1 = more contrast
   * Default: 1 (no change)
   */
  public readonly contrast = input<number>(1);

  /**
   * Brightness multiplier - overall lightness
   * <1 = darker, 1 = normal, >1 = brighter
   * Default: 1 (no change)
   */
  public readonly brightness = input<number>(1);

  /**
   * Gamma value - non-linear brightness curve
   * Lower values = brighter midtones, higher = darker midtones
   * Default: 2.2 (standard sRGB gamma)
   */
  public readonly gamma = input<number>(2.2);

  /**
   * Exposure level - simulates camera exposure
   * Applied before other adjustments, affects overall brightness
   * Default: 1 (no change)
   */
  public readonly exposure = input<number>(1);

  /**
   * Vignette intensity - darkens image corners
   * 0 = no vignette, higher values = stronger corner darkening
   * Default: 0 (disabled)
   */
  public readonly vignette = input<number>(0);

  private effectAdded = false;

  public constructor() {
    // Add color grading effect when renderer is available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.effectAdded) {
        // Initialize the composer first (if not already done)
        this.composerService.init(renderer, scene, camera);

        // Add color grading effect through the service
        this.composerService.addColorGrading({
          saturation: this.saturation(),
          contrast: this.contrast(),
          brightness: this.brightness(),
          gamma: this.gamma(),
          exposure: this.exposure(),
          vignette: this.vignette(),
        });

        this.effectAdded = true;

        // Enable the composer to switch render function
        this.composerService.enable();
      }
    });

    // Update color grading parameters reactively
    effect(() => {
      if (this.effectAdded) {
        this.composerService.updateColorGrading({
          saturation: this.saturation(),
          contrast: this.contrast(),
          brightness: this.brightness(),
          gamma: this.gamma(),
          exposure: this.exposure(),
          vignette: this.vignette(),
        });
        this.sceneService.invalidate();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.effectAdded) {
      this.composerService.removeColorGrading();
      this.effectAdded = false;
    }
  }
}
