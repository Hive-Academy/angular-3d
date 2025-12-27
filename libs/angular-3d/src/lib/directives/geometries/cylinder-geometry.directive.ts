import { Directive, inject, input, effect, DestroyRef } from '@angular/core';
import { CylinderGeometry } from 'three/webgpu';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';

/**
 * CylinderGeometryDirective - Creates CylinderGeometry and provides via signal
 *
 * Creates a THREE.CylinderGeometry with configurable dimensions and writes it to
 * the GEOMETRY_SIGNAL for consumption by MeshDirective.
 *
 * @example
 * ```html
 * <div a3dMesh>
 *   <div a3dCylinderGeometry [args]="[1, 1, 2, 32]"></div>
 *   <div a3dStandardMaterial [color]="'#4ecdc4'"></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[a3dCylinderGeometry]',
  standalone: true,
})
export class CylinderGeometryDirective {
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Cylinder parameters [radiusTop, radiusBottom, height, radialSegments]
   * Default: [1, 1, 1, 32]
   */
  public readonly args = input<[number, number, number, number]>([1, 1, 1, 32]);

  public constructor() {
    let currentGeometry: CylinderGeometry | null = null;

    effect(() => {
      // Dispose OLD geometry safely - clear reference before disposing
      if (currentGeometry) {
        const oldGeometry = currentGeometry;
        currentGeometry = null; // Prevent double-disposal
        queueMicrotask(() => oldGeometry.dispose()); // Defer disposal
      }

      // Create new geometry
      const [radiusTop, radiusBottom, height, radialSegments] = this.args();
      currentGeometry = new CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        radialSegments
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
