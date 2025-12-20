import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { DirectionalLightDirective } from '../../directives/lights/directional-light.directive';
import { TransformDirective } from '../../directives/transform.directive';

/**
 * DirectionalLightComponent - Declarative Directional Light
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * Emits parallel light rays in a specific direction, simulating sunlight.
 * Light position determines where it comes from, target determines direction.
 *
 * @example
 * ```html
 * <a3d-directional-light
 *   [position]="[10, 20, 10]"
 *   [target]="[0, 0, 0]"
 *   color="white"
 *   [intensity]="1.5"
 *   [castShadow]="true" />
 * ```
 */
@Component({
  selector: 'a3d-directional-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `directional-light-${crypto.randomUUID()}`,
    },
  ],
  hostDirectives: [
    {
      directive: DirectionalLightDirective,
      inputs: ['color', 'intensity', 'target', 'castShadow'],
    },
    {
      directive: TransformDirective,
      inputs: ['position'],
    },
  ],
})
export class DirectionalLightComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly target = input<[number, number, number]>([0, 0, 0]);
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
  public readonly castShadow = input<boolean>(false);
}
