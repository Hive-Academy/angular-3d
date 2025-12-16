import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { SceneService } from '../canvas/scene.service';

/**
 * Fog Component - Apply fog to the scene
 *
 * Usage:
 * <a3d-fog color="black" [near]="10" [far]="100" />
 * OR
 * <a3d-fog color="black" [density]="0.01" />
 */
@Component({
  selector: 'a3d-fog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class FogComponent implements OnInit, OnDestroy {
  public readonly color = input<string | number>('white');
  public readonly near = input<number | undefined>(undefined);
  public readonly far = input<number>(1000);
  public readonly density = input<number | undefined>(undefined);

  private readonly sceneService = inject(SceneService);

  public constructor() {
    effect(() => {
      const scene = this.sceneService.scene();
      if (scene && scene.fog) {
        // Update existing fog if possible
        if (scene.fog instanceof THREE.Fog) {
          scene.fog.color.set(this.color());
          const near = this.near();
          if (near !== undefined) scene.fog.near = near;
          scene.fog.far = this.far();
        } else if (scene.fog instanceof THREE.FogExp2) {
          scene.fog.color.set(this.color());
          const density = this.density();
          if (density !== undefined) scene.fog.density = density;
        }
      }
    });
  }

  public ngOnInit(): void {
    const scene = this.sceneService.scene();
    if (scene) {
      if (this.density() !== undefined) {
        scene.fog = new THREE.FogExp2(this.color(), this.density());
      } else {
        scene.fog = new THREE.Fog(this.color(), this.near() ?? 1, this.far());
      }
    }
  }

  public ngOnDestroy(): void {
    const scene = this.sceneService.scene();
    if (scene) {
      scene.fog = null;
    }
  }
}
