import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { PointLightDirective } from '../../directives/lights/point-light.directive';
import { TransformDirective } from '../../directives/transform.directive';

/**
 * PointLightComponent - Declarative Point Light
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * Emits light in all directions from a single point, like a light bulb.
 * Supports distance falloff, decay, and shadow casting.
 *
 * @example
 * ```html
 * <a3d-point-light
 *   [position]="[5, 10, 5]"
 *   color="yellow"
 *   [intensity]="2"
 *   [distance]="50"
 *   [castShadow]="true" />
 * ```
 */
@Component({
  selector: 'a3d-point-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `point-light-${crypto.randomUUID()}`,
    },
  ],
  hostDirectives: [
    {
      directive: PointLightDirective,
      inputs: ['color', 'intensity', 'distance', 'decay', 'castShadow'],
    },
    {
      directive: TransformDirective,
      inputs: ['position'],
    },
  ],
})
export class PointLightComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
  public readonly distance = input<number>(0);
  public readonly decay = input<number>(2);
  public readonly castShadow = input<boolean>(false);
}
