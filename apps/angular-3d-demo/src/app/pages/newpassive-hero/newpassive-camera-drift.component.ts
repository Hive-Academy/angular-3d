/**
 * NewpassiveCameraDriftComponent - Very slow cinematic camera drift
 *
 * Placed inside `a3d-scene-3d` so it can inject the per-scene SceneService and
 * RenderLoopService. Applies a subtle sinusoidal drift around the camera's
 * initial position while keeping it aimed at the scene focus point.
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { RenderLoopService, SceneService } from '@hive-academy/angular-3d';
import * as THREE from 'three/webgpu';

@Component({
  selector: 'app-newpassive-camera-drift',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class NewpassiveCameraDriftComponent {
  /** Maximum horizontal drift amplitude in world units */
  public readonly amplitude = input<number>(0.6);

  /** Point the camera keeps looking at while drifting */
  public readonly lookAt = input<[number, number, number]>([0, -0.5, 0]);

  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  private basePosition: THREE.Vector3 | null = null;
  private elapsed = 0;

  public constructor() {
    afterNextRender(() => {
      const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
        const camera = this.sceneService.camera();
        if (!camera) {
          return;
        }
        if (!this.basePosition) {
          this.basePosition = camera.position.clone();
        }

        this.elapsed += delta;
        const amp = this.amplitude();
        camera.position.x =
          this.basePosition.x + Math.sin(this.elapsed * 0.05) * amp;
        camera.position.y =
          this.basePosition.y + Math.sin(this.elapsed * 0.037) * amp * 0.45;
        camera.position.z =
          this.basePosition.z + Math.sin(this.elapsed * 0.021) * amp * 0.6;
        camera.lookAt(...this.lookAt());
      });

      this.destroyRef.onDestroy(cleanup);
    });
  }
}
