import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { MeshDirective } from '../../directives/core/mesh.directive';
import { SphereGeometryDirective } from '../../directives/geometries/sphere-geometry.directive';
import { TransformDirective } from '../../directives/core/transform.directive';
import { StandardMaterialDirective } from '../../directives/materials/standard-material.directive';

/**
 * SphereComponent - Declarative 3D Sphere Primitive
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 *
 * Spheres are ideal for demonstrating lighting effects because their
 * curved surface shows smooth gradients between lit and shadowed areas.
 *
 * @example
 * ```html
 * <a3d-sphere
 *   [position]="[0, 2, 0]"
 *   [args]="[1.5, 32, 32]"
 *   [color]="'#ff6b6b'"
 *   [emissive]="'#ff6b6b'"
 *   [emissiveIntensity]="0.5"
 *   [metalness]="0.3"
 *   [roughness]="0.5" />
 * ```
 */
@Component({
  selector: 'a3d-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `sphere-${crypto.randomUUID()}` },
  ],
  hostDirectives: [
    MeshDirective,
    { directive: SphereGeometryDirective, inputs: ['args'] },
    {
      directive: TransformDirective,
      inputs: ['position', 'rotation', 'scale'],
    },
    {
      directive: StandardMaterialDirective,
      inputs: [
        'color',
        'wireframe',
        'metalness',
        'roughness',
        'emissive',
        'emissiveIntensity',
      ],
    },
  ],
})
export class SphereComponent {
  // Signal inputs - forwarded to directives via hostDirectives
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  /**
   * Sphere geometry parameters [radius, widthSegments, heightSegments]
   * Default: [1, 32, 32] for smooth appearance
   */
  public readonly args = input<[number, number, number]>([1, 32, 32]);

  // Material properties
  public readonly color = input<number | string>(0xffffff);
  public readonly wireframe = input<boolean>(false);
  public readonly metalness = input<number>(0.3);
  public readonly roughness = input<number>(0.5);
  public readonly emissive = input<number | string>(0x000000);
  public readonly emissiveIntensity = input<number>(1);
}
