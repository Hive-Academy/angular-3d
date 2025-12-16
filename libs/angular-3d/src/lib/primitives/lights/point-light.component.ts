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
import { NG_3D_PARENT } from '../../types/tokens';

@Component({
  selector: 'a3d-point-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PointLightComponent implements OnInit, OnDestroy {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
  public readonly distance = input<number>(0);
  public readonly decay = input<number>(2);
  public readonly castShadow = input<boolean>(false);

  private light!: THREE.PointLight;
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  public constructor() {
    effect(() => {
      if (this.light) {
        this.light.position.set(...this.position());
      }
    });
    effect(() => {
      if (this.light) {
        this.light.color.set(this.color());
        this.light.intensity = this.intensity();
        this.light.distance = this.distance();
        this.light.decay = this.decay();
        this.light.castShadow = this.castShadow();
      }
    });
  }

  public ngOnInit(): void {
    this.light = new THREE.PointLight(
      this.color(),
      this.intensity(),
      this.distance(),
      this.decay()
    );
    this.light.position.set(...this.position());
    this.light.castShadow = this.castShadow();

    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.add(this.light);
    }
  }

  public ngOnDestroy(): void {
    if (this.parentFn) this.parentFn()?.remove(this.light);
    this.light.dispose();
  }
}
