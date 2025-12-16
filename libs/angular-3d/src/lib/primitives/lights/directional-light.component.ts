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
  selector: 'a3d-directional-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class DirectionalLightComponent implements OnInit, OnDestroy {
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly target = input<[number, number, number]>([0, 0, 0]);
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
  public readonly castShadow = input<boolean>(false);

  private light!: THREE.DirectionalLight;
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
        this.light.castShadow = this.castShadow();
      }
    });
  }

  public ngOnInit(): void {
    this.light = new THREE.DirectionalLight(this.color(), this.intensity());
    this.light.position.set(...this.position());
    this.light.target.position.set(...this.target());
    this.light.castShadow = this.castShadow();

    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.light);
        // Usually directional light target must be added to scene to work if it's not at 0,0,0, but Three.js handles it if added to scene graph?
        // Actually target is Object3D, needs to be in scene graph for its matrixWorld to update if it moves.
        parent.add(this.light.target);
      }
    }
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
