/**
 * Bloom Effect Component - Declarative Bloom pass
 *
 * Adds post-processing bloom effect using UnrealBloomPass.
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
import { UnrealBloomPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * Declarative Bloom effect.
 *
 * Must be used inside `a3d-effect-composer`.
 *
 * @example
 * ```html
 * <a3d-bloom-effect
 *   [threshold]="0"
 *   [strength]="1.5"
 *   [radius]="0.4"
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

  // Stats:
  // Using UnrealBloomPass from three-stdlib.
  // Reference: temp/angular-3d/components/effects/bloom-effect.component.ts
  // Temp used: NgtpBloom (angular-three-postprocessing).
  // We are using three-stdlib directly to avoid dependencies as per architecture.

  public readonly threshold = input<number>(0);
  public readonly strength = input<number>(1.5);
  public readonly radius = input<number>(0.4);

  private pass: UnrealBloomPass | null = null;

  public constructor() {
    effect(() => {
      // Create pass when resolution is available
      const renderer = this.sceneService.renderer();
      if (renderer && !this.pass) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.pass = new UnrealBloomPass(
          size,
          this.strength(),
          this.radius(),
          this.threshold()
        );

        this.composerService.addPass(this.pass);
      }
    });

    // Update pass properties
    effect(() => {
      if (this.pass) {
        this.pass.strength = this.strength();
        this.pass.threshold = this.threshold();
        this.pass.radius = this.radius();
      }
    });

    // React to renderer size changes (CRITICAL for multi-scene support)
    effect(() => {
      const renderer = this.sceneService.renderer();
      const pass = this.pass;
      if (!renderer || !pass) return;

      const size = new THREE.Vector2();
      renderer.getSize(size);
      pass.resolution.set(size.x, size.y);
    });
  }

  public ngOnDestroy(): void {
    if (this.pass) {
      this.composerService.removePass(this.pass);
      this.pass.dispose();
      this.pass = null;
    }
  }
}
