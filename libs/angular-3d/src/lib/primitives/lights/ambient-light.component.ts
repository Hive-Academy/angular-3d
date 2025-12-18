import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  afterNextRender,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../../types/tokens';

@Component({
  selector: 'a3d-ambient-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class AmbientLightComponent implements OnDestroy {
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);

  private light!: THREE.AmbientLight;
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    effect(() => {
      if (this.light) {
        this.light.color.set(this.color());
        this.light.intensity = this.intensity();
      }
    });

    afterNextRender(() => {
      this.light = new THREE.AmbientLight(this.color(), this.intensity());

      if (this.parentFn) {
        const parent = this.parentFn();
        parent?.add(this.light);
      } else {
        console.warn('AmbientLight: No parent found');
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.parentFn) this.parentFn()?.remove(this.light);
    this.light.dispose();
  }
}
