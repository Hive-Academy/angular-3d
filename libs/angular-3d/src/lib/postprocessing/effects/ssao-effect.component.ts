/**
 * SSAO Effect Component - Screen Space Ambient Occlusion
 *
 * Adds realistic ambient shadows in crevices and corners,
 * enhancing depth perception and visual realism.
 * Requires WebGL 2.0 for best results.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  OnDestroy,
} from '@angular/core';
import * as THREE from 'three';
import { SSAOPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * SsaoEffectComponent - Screen Space Ambient Occlusion
 *
 * Adds realistic ambient shadows in crevices and corners.
 * Requires WebGL 2.0 for best results.
 *
 * Must be used inside `a3d-effect-composer`.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-ssao-effect
 *     [radius]="4"
 *     [intensity]="1"
 *   />
 * </a3d-effect-composer>
 * ```
 *
 * @example
 * ```html
 * <!-- Strong ambient occlusion for architectural visualization -->
 * <a3d-effect-composer>
 *   <a3d-ssao-effect
 *     [radius]="8"
 *     [intensity]="1.5"
 *     [kernelRadius]="16"
 *     [minDistance]="0.0005"
 *     [maxDistance]="0.15"
 *   />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-ssao-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsaoEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  /**
   * Sampling radius - affects the spread of ambient occlusion
   * Larger values sample further from each point
   * Default: 4
   */
  public readonly radius = input<number>(4);

  /**
   * Effect intensity - multiplier for the occlusion strength
   * Higher values create darker shadows in occluded areas
   * Default: 1
   */
  public readonly intensity = input<number>(1);

  /**
   * Kernel radius - number of samples used for occlusion calculation
   * More samples = better quality but higher GPU cost
   * Default: 8
   */
  public readonly kernelRadius = input<number>(8);

  /**
   * Minimum distance threshold - prevents self-occlusion artifacts
   * Objects closer than this distance won't occlude themselves
   * Default: 0.001
   */
  public readonly minDistance = input<number>(0.001);

  /**
   * Maximum distance threshold - limits occlusion range
   * Objects beyond this distance won't contribute to occlusion
   * Default: 0.1
   */
  public readonly maxDistance = input<number>(0.1);

  private pass: SSAOPass | null = null;

  public constructor() {
    // Create pass when renderer, scene, and camera are available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.pass) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.pass = new SSAOPass(scene, camera, size.x, size.y);
        this.pass.kernelRadius = this.kernelRadius();
        this.pass.minDistance = this.minDistance();
        this.pass.maxDistance = this.maxDistance();

        this.composerService.addPass(this.pass);
      }
    });

    // Update SSAO parameters reactively
    effect(() => {
      if (this.pass) {
        this.pass.kernelRadius = this.kernelRadius();
        this.pass.minDistance = this.minDistance();
        this.pass.maxDistance = this.maxDistance();
        this.sceneService.invalidate();
      }
    });

    // React to renderer size changes for proper resolution
    effect(() => {
      const renderer = this.sceneService.renderer();
      const pass = this.pass;
      if (!renderer || !pass) return;

      const size = new THREE.Vector2();
      renderer.getSize(size);
      pass.setSize(size.x, size.y);
    });
  }

  public ngOnDestroy(): void {
    if (this.pass) {
      this.composerService.removePass(this.pass);
      this.pass = null;
    }
  }
}
