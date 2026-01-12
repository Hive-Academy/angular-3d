import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { MeshDirective } from '../../directives/core/mesh.directive';
import { BoxGeometryDirective } from '../../directives/geometries/box-geometry.directive';
import { TransformDirective } from '../../directives/core/transform.directive';
import { StandardMaterialDirective } from '../../directives/materials/standard-material.directive';

/**
 * BackgroundCubeComponent - Simple cube primitive for background decoration
 *
 * Uses hostDirectives composition pattern with MeshStandardMaterial.
 * This component is designed for background decorations and environment elements.
 *
 * Features:
 * - Designed to work with Float3dDirective and Performance3dDirective (applied by consumer)
 * - Supports emissive glow effects
 *
 * @example
 * ```html
 * <a3d-background-cube
 *   [position]="[5, 2, -10]"
 *   [args]="[1.5, 1.5, 1.5]"
 *   [color]="'#4a90e2'"
 *   [emissive]="'#4a90e2'"
 *   [emissiveIntensity]="2"
 *   a3dFloat3d
 *   a3dPerformance3d />
 * ```
 */
@Component({
  selector: 'a3d-background-cube',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `background-cube-${crypto.randomUUID()}`,
    },
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
      inputs: ['color', 'emissive', 'emissiveIntensity'],
    },
  ],
})
export class BackgroundCubeComponent {
  /**
   * Position in 3D space as [x, y, z] tuple
   * Default: [0, 0, 0]
   */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /**
   * Rotation in radians as [x, y, z] Euler angles
   * Default: [0, 0, 0]
   */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /**
   * Scale as [x, y, z] multipliers
   * Default: [1, 1, 1]
   */
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  /**
   * Box dimensions [width, height, depth]
   * Default: [1, 1, 1]
   */
  public readonly args = input<[number, number, number]>([1, 1, 1]);

  /**
   * Material color (hex number or CSS color string)
   * Default: 0x4a90e2 (blue)
   */
  public readonly color = input<number | string>(0x4a90e2);

  /**
   * Emissive color (self-illumination color)
   * Default: 0x000000 (no emission)
   */
  public readonly emissive = input<number | string>(0x000000);

  /**
   * Emissive intensity multiplier
   * Default: 0
   */
  public readonly emissiveIntensity = input<number>(0);
}
