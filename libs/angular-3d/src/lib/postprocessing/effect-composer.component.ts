/**
 * Effect Composer Component - Declarative post-processing container
 *
 * Sets up the EffectComposerService when scene resources are available.
 * Acts as a container for pass components.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
} from '@angular/core';
import { EffectComposerService } from './effect-composer.service';
import { SceneService } from '../canvas/scene.service';

/**
 * Declarative container for post-processing effects.
 *
 * Placed inside `a3d-scene-3d`.
 * Initializes the `EffectComposerService` with the parent scene's resources.
 *
 * @example
 * ```html
 * <a3d-effect-composer [enabled]="true">
 *   <a3d-bloom-effect />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-effect-composer',
  standalone: true,
  template: ` <ng-content /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectComposerComponent {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  /**
   * Enable/disable post-processing pipeline
   */
  public readonly enabled = input<boolean>(true);

  public constructor() {
    // Initialize composer when resources are available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera) {
        this.composerService.init(renderer, scene, camera);
      }
    });

    // Sync enabled state
    effect(() => {
      if (this.enabled()) {
        this.composerService.enable();
      } else {
        this.composerService.disable();
      }
    });
  }
}
