import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { GroupDirective } from '../../directives/core/group.directive';
import { TransformDirective } from '../../directives/core/transform.directive';

/**
 * GroupComponent - Declarative 3D Group Container
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * Groups allow organizing and transforming multiple 3D objects together.
 *
 * @example
 * ```html
 * <a3d-group [position]="[10, 0, 0]" [rotation]="[0, Math.PI / 4, 0]">
 *   <a3d-box />
 *   <a3d-cylinder />
 * </a3d-group>
 * ```
 */
@Component({
  selector: 'a3d-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `group-${crypto.randomUUID()}` },
  ],
  hostDirectives: [
    GroupDirective,
    {
      directive: TransformDirective,
      inputs: ['position', 'rotation', 'scale'],
    },
  ],
})
export class GroupComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);
}
