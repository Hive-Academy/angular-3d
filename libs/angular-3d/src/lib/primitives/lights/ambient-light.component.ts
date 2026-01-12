import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { AmbientLightDirective } from '../../directives/lights/ambient-light.directive';

/**
 * AmbientLightComponent - Declarative Ambient Light
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * Provides uniform illumination across the entire scene from all directions.
 *
 * @example
 * ```html
 * <a3d-ambient-light color="white" [intensity]="0.5" />
 * ```
 */
@Component({
  selector: 'a3d-ambient-light',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `ambient-light-${crypto.randomUUID()}`,
    },
  ],
  hostDirectives: [
    {
      directive: AmbientLightDirective,
      inputs: ['color', 'intensity'],
    },
  ],
})
export class AmbientLightComponent {
  // Signal inputs - forwarded to directive via hostDirectives
  public readonly color = input<string | number>('white');
  public readonly intensity = input<number>(1);
}
