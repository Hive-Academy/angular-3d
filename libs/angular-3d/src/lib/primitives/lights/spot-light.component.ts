import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { SpotLightDirective } from '../../directives/lights/spot-light.directive';
import { TransformDirective } from '../../directives/transform.directive';

/**
 * SpotLightComponent - Declarative Spot Light
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * Emits light from a single point in a cone shape toward a target,
 * like a flashlight or stage spotlight. Supports cone angle, penumbra
 * (soft edge), distance falloff, decay, and shadow casting.
 *
 * @example
 * ```html
 * <a3d-spot-light
 *   [position]="[5, 10, 5]"
 *   [target]="[0, 0, 0]"
 *   color="yellow"
 *   [intensity]="2"
 *   [distance]="50"
 *   [angle]="Math.PI / 4"
 *   [penumbra]="0.2"
 *   [castShadow]="true" />
 * ```
 */
@Component({
  selector: 'a3d-spot-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `spot-light-${crypto.randomUUID()}`,
    },
  ],
  hostDirectives: [
    {
      directive: SpotLightDirective,
      inputs: [
        'color',
        'intensity',
        'distance',
        'angle',
        'penumbra',
        'decay',
        'target',
        'castShadow',
      ],
    },
    {
      directive: TransformDirective,
      inputs: ['position'],
    },
  ],
})
export class SpotLightComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly target = input<[number, number, number]>([0, 0, 0]);
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
  public readonly distance = input<number>(0);
  public readonly angle = input<number>(Math.PI / 3);
  public readonly penumbra = input<number>(0);
  public readonly decay = input<number>(2);
  public readonly castShadow = input<boolean>(false);
}
