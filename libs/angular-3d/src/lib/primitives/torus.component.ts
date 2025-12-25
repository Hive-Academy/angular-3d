import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../tokens/object-id.token';
import { MeshDirective } from '../directives/mesh.directive';
import { TorusGeometryDirective } from '../directives/geometries/torus-geometry.directive';
import { TransformDirective } from '../directives/transform.directive';
import { StandardMaterialDirective } from '../directives/materials/standard-material.directive';

/**
 * TorusComponent - Declarative 3D Torus Primitive
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 *
 * @example
 * ```html
 * <a3d-torus
 *   [position]="[0, 0, 0]"
 *   [rotation]="[Math.PI / 2, 0, 0]"
 *   [args]="[10, 3, 16, 100]"
 *   [color]="'blue'"
 *   [wireframe]="false"
 *   [emissive]="'blue'"
 *   [emissiveIntensity]="2" />
 * ```
 */
@Component({
  selector: 'a3d-torus',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `torus-${crypto.randomUUID()}` },
  ],
  hostDirectives: [
    MeshDirective,
    { directive: TorusGeometryDirective, inputs: ['args'] },
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
export class TorusComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);
  public readonly args = input<[number, number, number, number]>([
    10, 3, 16, 100,
  ]);
  public readonly color = input<number | string>('blue');
  public readonly wireframe = input<boolean>(false);
  public readonly emissive = input<number | string>(0x000000);
  public readonly emissiveIntensity = input<number>(1);
}
