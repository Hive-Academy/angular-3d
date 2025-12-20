import { Directive, inject, input, effect, DestroyRef } from '@angular/core';
import { SphereGeometry } from 'three';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';

/**
 * SphereGeometryDirective - Creates SphereGeometry and provides via signal
 *
 * Creates a THREE.SphereGeometry with configurable dimensions and writes it to
 * the GEOMETRY_SIGNAL for consumption by MeshDirective.
 *
 * @example
 * ```html
 * <div a3dMesh>
 *   <div a3dSphereGeometry [args]="[1, 32, 16]"></div>
 *   <div a3dStandardMaterial [color]="'#f38181'"></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[a3dSphereGeometry]',
  standalone: true,
})
export class SphereGeometryDirective {
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Sphere parameters [radius, widthSegments, heightSegments]
   * Default: [1, 32, 16]
   */
  public readonly args = input<[number, number, number]>([1, 32, 16]);

  public constructor() {
    let currentGeometry: SphereGeometry | null = null;

    effect(() => {
      // Dispose previous geometry
      currentGeometry?.dispose();

      // Create new geometry
      const [radius, widthSegments, heightSegments] = this.args();
      currentGeometry = new SphereGeometry(
        radius,
        widthSegments,
        heightSegments
      );
      this.geometrySignal.set(currentGeometry);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      currentGeometry?.dispose();
    });
  }
}
