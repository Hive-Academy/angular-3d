/**
 * Depth of Field Effect Component - Bokeh DOF pass
 *
 * Simulates camera lens blur based on focus distance.
 * Objects outside the focus range appear blurred, creating
 * realistic depth perception similar to photography.
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  inject,
  effect,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three';
import { BokehPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * DepthOfFieldEffectComponent - Bokeh DOF effect
 *
 * Simulates camera lens blur based on focus distance.
 * Objects outside the focus range appear blurred, creating
 * realistic depth perception.
 *
 * Must be used inside `a3d-effect-composer`.
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

  private pass: BokehPass | null = null;

  /** Flag to prevent repeated aspect uniform warnings */
  private aspectUniformWarned = false;

  public constructor() {
    // Create pass when renderer, scene, and camera are available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.pass) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.pass = new BokehPass(scene, camera, {
          focus: this.focus(),
          aperture: this.aperture(),
          maxblur: this.maxblur(),
        });

        this.composerService.addPass(this.pass);
      }
    });

    // Update DOF parameters reactively
    effect(() => {
      if (this.pass) {
        const uniforms = this.pass.uniforms as Record<string, THREE.IUniform>;
        uniforms['focus'].value = this.focus();
        uniforms['aperture'].value = this.aperture();
        uniforms['maxblur'].value = this.maxblur();
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

      // BokehPass uses aspect ratio from camera, update uniforms if needed
      const uniforms = pass.uniforms as Record<string, THREE.IUniform>;
      if (uniforms['aspect']) {
        uniforms['aspect'].value = size.x / size.y;
      } else if (!this.aspectUniformWarned) {
        // Warn once if aspect uniform is missing (may indicate three-stdlib version incompatibility)
        console.warn(
          '[DepthOfFieldEffectComponent] BokehPass missing expected aspect uniform - check three-stdlib version'
        );
        this.aspectUniformWarned = true;
      }
    });

    // Cleanup on destroy using DestroyRef pattern
    this.destroyRef.onDestroy(() => {
      if (this.pass) {
        this.composerService.removePass(this.pass);
        // BokehPass doesn't have explicit dispose method
        this.pass = null;
      }
    });
  }
}
