import { Directive, inject, input, effect, DestroyRef } from '@angular/core';
import { TorusGeometry } from 'three';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';

/**
 * TorusGeometryDirective - Creates TorusGeometry and provides via signal
 *
 * Creates a THREE.TorusGeometry with configurable dimensions and writes it to
 * the GEOMETRY_SIGNAL for consumption by MeshDirective.
 *
 * @example
 * ```html
 * <div a3dMesh>
 *   <div a3dTorusGeometry [args]="[1, 0.4, 16, 100]"></div>
 *   <div a3dStandardMaterial [color]="'#95e1d3'"></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[a3dTorusGeometry]',
  standalone: true,
})
export class TorusGeometryDirective {
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Torus parameters [radius, tube, radialSegments, tubularSegments]
   * Default: [1, 0.4, 16, 100]
   */
  public readonly args = input<[number, number, number, number]>([
    1, 0.4, 16, 100,
  ]);

  public constructor() {
    let currentGeometry: TorusGeometry | null = null;

    effect(() => {
      // Dispose OLD geometry safely - clear reference before disposing
      if (currentGeometry) {
        const oldGeometry = currentGeometry;
        currentGeometry = null; // Prevent double-disposal
        queueMicrotask(() => oldGeometry.dispose()); // Defer disposal
      }

      // Create new geometry
      const [radius, tube, radialSegments, tubularSegments] = this.args();
      currentGeometry = new TorusGeometry(
        radius,
        tube,
        radialSegments,
        tubularSegments
      );
      this.geometrySignal.set(currentGeometry);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (currentGeometry) {
        currentGeometry.dispose();
        currentGeometry = null;
      }
    });
  }
}
