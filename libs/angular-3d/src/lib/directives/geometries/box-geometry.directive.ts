import { Directive, inject, input, effect, DestroyRef } from '@angular/core';
import { BoxGeometry } from 'three';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';

/**
 * BoxGeometryDirective - Creates BoxGeometry and provides via signal
 *
 * Creates a THREE.BoxGeometry with configurable dimensions and writes it to
 * the GEOMETRY_SIGNAL for consumption by MeshDirective.
 *
 * @example
 * ```html
 * <div a3dMesh>
 *   <div a3dBoxGeometry [args]="[2, 2, 2]"></div>
 *   <div a3dStandardMaterial [color]="'#ff6b6b'"></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[a3dBoxGeometry]',
  standalone: true,
})
export class BoxGeometryDirective {
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Box dimensions [width, height, depth]
   * Default: [1, 1, 1]
   */
  public readonly args = input<[number, number, number]>([1, 1, 1]);

  public constructor() {
    let currentGeometry: BoxGeometry | null = null;

    effect(() => {
      // Dispose previous geometry
      currentGeometry?.dispose();

      // Create new geometry
      const [width, height, depth] = this.args();
      currentGeometry = new BoxGeometry(width, height, depth);
      this.geometrySignal.set(currentGeometry);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      currentGeometry?.dispose();
    });
  }
}
