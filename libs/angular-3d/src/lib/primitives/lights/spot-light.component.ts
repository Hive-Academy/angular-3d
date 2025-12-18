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
  selector: 'a3d-spot-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SpotLightComponent implements OnDestroy {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly target = input<[number, number, number]>([0, 0, 0]);
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
  public readonly distance = input<number>(0);
  public readonly angle = input<number>(Math.PI / 3);
  public readonly penumbra = input<number>(0);
  public readonly decay = input<number>(2);
  public readonly castShadow = input<boolean>(false);

  private light!: THREE.SpotLight;
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    effect(() => {
      if (this.light) {
        this.light.position.set(...this.position());
        this.light.target.position.set(...this.target());
        this.light.target.updateMatrixWorld();
      }
    });

    effect(() => {
      if (this.light) {
        this.light.color.set(this.color());
        this.light.intensity = this.intensity();
        this.light.distance = this.distance();
        this.light.angle = this.angle();
        this.light.penumbra = this.penumbra();
        this.light.decay = this.decay();
        this.light.castShadow = this.castShadow();
      }
    });

    afterNextRender(() => {
      this.light = new THREE.SpotLight(
        this.color(),
        this.intensity(),
        this.distance(),
        this.angle(),
        this.penumbra(),
        this.decay()
      );
      this.light.position.set(...this.position());
      this.light.target.position.set(...this.target());
      this.light.castShadow = this.castShadow();

      if (this.parentFn) {
        const parent = this.parentFn();
        if (parent) {
          parent.add(this.light);
          parent.add(this.light.target);
        }
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.light);
      parent?.remove(this.light.target);
    }
    this.light.dispose();
  }
}
