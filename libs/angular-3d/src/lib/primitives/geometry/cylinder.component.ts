import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { MeshDirective } from '../../directives/core/mesh.directive';
import { CylinderGeometryDirective } from '../../directives/geometries/cylinder-geometry.directive';
import { TransformDirective } from '../../directives/core/transform.directive';
import { StandardMaterialDirective } from '../../directives/materials/standard-material.directive';

/**
 * CylinderComponent - Declarative 3D Cylinder Primitive
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 *
 * @example
 * ```html
 * <a3d-cylinder
 *   [position]="[0, 2, 0]"
 *   [rotation]="[0, Math.PI / 4, 0]"
 *   [args]="[1, 1, 2, 32]"
 *   [color]="'green'"
 *   [wireframe]="false" />
 * ```
 */
@Component({
  selector: 'a3d-cylinder',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `cylinder-${crypto.randomUUID()}` },
  ],
  hostDirectives: [
    MeshDirective,
    { directive: CylinderGeometryDirective, inputs: ['args'] },
    {
      directive: TransformDirective,
      inputs: ['position', 'rotation', 'scale'],
    },
    { directive: StandardMaterialDirective, inputs: ['color', 'wireframe'] },
  ],
})
export class CylinderComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);
  public readonly args = input<[number, number, number, number]>([1, 1, 1, 32]);
  public readonly color = input<number | string>('green');
  public readonly wireframe = input<boolean>(false);
}
