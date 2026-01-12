import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { MeshDirective } from '../../directives/core/mesh.directive';
import { BoxGeometryDirective } from '../../directives/geometries/box-geometry.directive';
import { TransformDirective } from '../../directives/core/transform.directive';
import { StandardMaterialDirective } from '../../directives/materials/standard-material.directive';

/**
 * BoxComponent - Declarative 3D Box Primitive
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 *
 * @example
 * ```html
 * <a3d-box
 *   [position]="[0, 2, 0]"
 *   [rotation]="[0, Math.PI / 4, 0]"
 *   [args]="[2, 2, 2]"
 *   [color]="'orange'"
 *   [wireframe]="false"
 *   [emissive]="'orange'"
 *   [emissiveIntensity]="2" />
 * ```
 */
@Component({
  selector: 'a3d-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `box-${crypto.randomUUID()}` },
  ],
  hostDirectives: [
    MeshDirective,
    { directive: BoxGeometryDirective, inputs: ['args'] },
    {
      directive: TransformDirective,
      inputs: ['position', 'rotation', 'scale'],
    },
    {
      directive: StandardMaterialDirective,
      inputs: ['color', 'wireframe', 'emissive', 'emissiveIntensity'],
    },
  ],
})
export class BoxComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);
  public readonly args = input<[number, number, number]>([1, 1, 1]);
  public readonly color = input<number | string>(0xffffff);
  public readonly wireframe = input<boolean>(false);
  public readonly emissive = input<number | string>(0x000000);
  public readonly emissiveIntensity = input<number>(1);
}
