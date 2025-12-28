/**
 * Depth of Field Effect Component - Bokeh DOF using TSL
 *
 * Simulates camera lens blur based on focus distance using native TSL dof node.
 * Objects outside the focus range appear blurred, creating realistic depth perception.
 *
 * Migration from three-stdlib BokehPass complete (TASK_2025_031 Batch 5).
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * DepthOfFieldEffectComponent - Bokeh DOF effect using TSL
 *
 * Simulates camera lens blur based on focus distance.
 * Objects outside the focus range appear blurred, creating
 * realistic depth perception.
 *
 * Must be used inside `a3d-effect-composer`.
 *
 * Uses native THREE.PostProcessing with TSL dof() node.
 * Replaces three-stdlib BokehPass.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-dof-effect
 *     [focus]="10"
 *     [aperture]="0.025"
 *     [maxblur]="0.01"
 *   />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Shallow depth of field for portrait-style focus -->
 * <a3d-effect-composer>
 *   <a3d-dof-effect
 *     [focus]="5"
 *     [aperture]="0.1"
 *     [maxblur]="0.02"
 *   />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-dof-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepthOfFieldEffectComponent {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Focus distance - distance at which objects are in sharp focus
   * Lower values focus on closer objects, higher on distant ones
   * Default: 10 (mid-range focus)
   */
  public readonly focus = input<number>(10);

  /**
   * Aperture size - controls depth of field range
   * Smaller values create wider focused area, larger values create more blur
   * Default: 0.025 (moderate bokeh effect)
   */
  public readonly aperture = input<number>(0.025);

  /**
   * Maximum blur amount - limits the blur intensity
   * Higher values allow more aggressive blur for out-of-focus areas
   * Default: 0.01 (subtle blur)
   */
  public readonly maxblur = input<number>(0.01);

  private effectAdded = false;

  public constructor() {
    // Add DOF effect when renderer, scene, and camera are available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.effectAdded) {
        // Initialize the composer first (if not already done)
        this.composerService.init(renderer, scene, camera);

        // Add DOF effect using TSL dof node
        this.composerService.addDepthOfField({
          focus: this.focus(),
          aperture: this.aperture(),
          maxBlur: this.maxblur(),
        });

        this.effectAdded = true;

        // Enable the composer to switch render function
        this.composerService.enable();
      }
    });

    // Update DOF parameters reactively
    effect(() => {
      if (this.effectAdded) {
        this.composerService.updateDepthOfField({
          focus: this.focus(),
          aperture: this.aperture(),
          maxBlur: this.maxblur(),
        });
        this.sceneService.invalidate();
      }
    });

    // Cleanup on destroy using DestroyRef pattern
    this.destroyRef.onDestroy(() => {
      if (this.effectAdded) {
        this.composerService.removeDepthOfField();
        this.effectAdded = false;
      }
    });
  }
}
