import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../tokens/object-id.token';
import { MeshDirective } from '../directives/mesh.directive';
import {
  PolyhedronGeometryDirective,
  PolyhedronType,
} from '../directives/geometries/polyhedron-geometry.directive';
import { TransformDirective } from '../directives/transform.directive';
import { StandardMaterialDirective } from '../directives/materials/standard-material.directive';

/**
 * PolyhedronComponent - Declarative 3D Polyhedron Primitive
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 *
 * @example
 * ```html
 * <a3d-polyhedron
 *   [type]="'icosahedron'"
 *   [position]="[0, 0, 0]"
 *   [rotation]="[0, 0, 0]"
 *   [args]="[1, 0]"
 *   [color]="'purple'"
 *   [wireframe]="false" />
 * ```
 */
@Component({
  selector: 'a3d-polyhedron',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `polyhedron-${crypto.randomUUID()}`,
    },
  ],
  hostDirectives: [
    MeshDirective,
    { directive: PolyhedronGeometryDirective, inputs: ['type', 'args'] },
    {
      directive: TransformDirective,
      inputs: ['position', 'rotation', 'scale'],
    },
    { directive: StandardMaterialDirective, inputs: ['color', 'wireframe'] },
  ],
})
export class PolyhedronComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly type = input<PolyhedronType>('icosahedron');
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);
  public readonly args = input<[number, number]>([1, 0]);
  public readonly color = input<number | string>('purple');
  public readonly wireframe = input<boolean>(false);
}
