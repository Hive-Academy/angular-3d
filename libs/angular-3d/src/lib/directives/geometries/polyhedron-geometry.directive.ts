import { Directive, inject, input, effect, DestroyRef } from '@angular/core';
import {
  IcosahedronGeometry,
  DodecahedronGeometry,
  OctahedronGeometry,
  BufferGeometry,
} from 'three';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';

/**
 * Supported polyhedron types
 */
export type PolyhedronType = 'icosahedron' | 'dodecahedron' | 'octahedron';

/**
 * PolyhedronGeometryDirective - Creates polyhedron geometries and provides via signal
 *
 * Creates THREE polyhedron geometries (Icosahedron, Dodecahedron, Octahedron)
 * with configurable dimensions and writes it to the GEOMETRY_SIGNAL for
 * consumption by MeshDirective.
 *
 * @example
 * ```html
 * <div a3dMesh>
 *   <div a3dPolyhedronGeometry
 *        [type]="'icosahedron'"
 *        [args]="[1, 0]"></div>
 *   <div a3dStandardMaterial [color]="'#aa96da'"></div>
 * </div>
 * ```
 */
@Directive({
  selector: '[a3dPolyhedronGeometry]',
  standalone: true,
})
export class PolyhedronGeometryDirective {
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Polyhedron type
   * Default: 'icosahedron'
   */
  public readonly type = input<PolyhedronType>('icosahedron');

  /**
   * Polyhedron parameters [radius, detail]
   * Default: [1, 0]
   */
  public readonly args = input<[number, number]>([1, 0]);

  public constructor() {
    let currentGeometry: BufferGeometry | null = null;

    effect(() => {
      // Dispose previous geometry
      currentGeometry?.dispose();

      // Create new geometry based on type
      const [radius, detail] = this.args();
      const polyType = this.type();

      switch (polyType) {
        case 'icosahedron':
          currentGeometry = new IcosahedronGeometry(radius, detail);
          break;
        case 'dodecahedron':
          currentGeometry = new DodecahedronGeometry(radius, detail);
          break;
        case 'octahedron':
          currentGeometry = new OctahedronGeometry(radius, detail);
          break;
        default:
          console.warn(
            `Unknown polyhedron type: ${polyType}. Defaulting to icosahedron.`
          );
          currentGeometry = new IcosahedronGeometry(radius, detail);
      }

      this.geometrySignal.set(currentGeometry);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      currentGeometry?.dispose();
    });
  }
}
