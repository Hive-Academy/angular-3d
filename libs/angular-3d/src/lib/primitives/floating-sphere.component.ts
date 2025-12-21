import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../tokens/object-id.token';
import { MeshDirective } from '../directives/mesh.directive';
import { SphereGeometryDirective } from '../directives/geometries/sphere-geometry.directive';
import { TransformDirective } from '../directives/transform.directive';
import { PhysicalMaterialDirective } from '../directives/materials/physical-material.directive';

/**
 * FloatingSphereComponent - Declarative 3D Sphere with Physical Material
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 *
 * MeshPhysicalMaterial provides advanced PBR features:
 * - Clearcoat: Thin translucent layer (car paint effect)
 * - Transmission: Glass-like transparency with refraction
 * - IOR: Index of refraction for realistic glass
 *
 * @example
 * ```html
 * <a3d-floating-sphere
 *   [position]="[0, 2, 0]"
 *   [radius]="1.5"
 *   [color]="'#ff6b6b'"
 *   [metalness]="0.8"
 *   [roughness]="0.2"
 *   [clearcoat]="1.0"
 *   [transmission]="0.1"
 *   [ior]="1.5" />
 * ```
 */
@Component({
  selector: 'a3d-floating-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `floating-sphere-${crypto.randomUUID()}`,
    },
  ],
  hostDirectives: [
    MeshDirective,
    {
      directive: SphereGeometryDirective,
      inputs: ['args'],
    },
    {
      directive: TransformDirective,
      inputs: ['position', 'rotation', 'scale'],
    },
    {
      directive: PhysicalMaterialDirective,
      inputs: [
        'color',
        'metalness',
        'roughness',
        'clearcoat',
        'clearcoatRoughness',
        'transmission',
        'ior',
        'wireframe',
      ],
    },
  ],
})
export class FloatingSphereComponent {
  // Transform inputs - forwarded to TransformDirective
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  /**
   * Sphere geometry parameters forwarded to SphereGeometryDirective
   * @param args - Tuple of [radius, widthSegments, heightSegments]
   * @default [1, 32, 16] - Unit sphere with 32x16 segments
   * @example
   * ```html
   * <a3d-floating-sphere [args]="[2.5, 64, 32]" />
   * ```
   */
  public readonly args = input<[number, number, number]>([1, 32, 16]);

  // Material inputs - forwarded to PhysicalMaterialDirective
  public readonly color = input<number | string>(0xff6b6b);
  public readonly metalness = input<number>(0.8);
  public readonly roughness = input<number>(0.2);
  public readonly clearcoat = input<number>(1.0);
  public readonly clearcoatRoughness = input<number>(0.0);
  public readonly transmission = input<number>(0.1);
  public readonly ior = input<number>(1.5);
  public readonly wireframe = input<boolean>(false);
}
