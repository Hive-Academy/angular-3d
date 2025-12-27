import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three/webgpu';
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
export class FogComponent implements OnDestroy {
  public readonly color = input<string | number>('white');
  public readonly near = input<number | undefined>(undefined);
  public readonly far = input<number>(1000);
  public readonly density = input<number | undefined>(undefined);

  private readonly sceneService = inject(SceneService);

  public constructor() {
    effect((onCleanup) => {
      const scene = this.sceneService.scene();
      if (!scene) return;

      const color = this.color();
      const density = this.density();
      const near = this.near();
      const far = this.far();

      // Determine fog type based on density presence
      if (density !== undefined) {
        // FogExp2
        if (!(scene.fog instanceof THREE.FogExp2)) {
          scene.fog = new THREE.FogExp2(color, density);
        } else {
          // Update existing
          scene.fog.color.set(color);
          scene.fog.density = density;
        }
      } else {
        // Fog (Linear)
        if (!(scene.fog instanceof THREE.Fog)) {
          scene.fog = new THREE.Fog(color, near ?? 1, far);
        } else {
          // Update existing
          scene.fog.color.set(color);
          scene.fog.near = near ?? 1;
          scene.fog.far = far;
        }
      }

      onCleanup(() => {
        const currentScene = this.sceneService.scene();
        if (currentScene && currentScene.fog === scene.fog) {
          // Only clear if it's still our fog?
          // Actually, if we destroy the component, we typically want to remove the fog.
          currentScene.fog = null;
        }
      });
    });
  }

  public ngOnDestroy(): void {
    const scene = this.sceneService.scene();
    if (scene) {
      scene.fog = null;
    }
  }
}
