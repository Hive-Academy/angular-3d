import { InjectionToken } from '@angular/core';
import * as THREE from 'three/webgpu';

/**
 * Interface for 3D child components that can be attached to parent 3D objects.
 *
 * Components implementing this interface can be used as children of
 * GltfModelComponent, Scene3dComponent, or any other parent that queries
 * for NG_3D_CHILD tokens.
 *
 * @example
 * ```typescript
 * @Component({
 *   selector: 'my-3d-child',
 *   providers: [
 *     { provide: NG_3D_CHILD, useExisting: forwardRef(() => My3dChildComponent) }
 *   ]
 * })
 * export class My3dChildComponent implements Attachable3dChild {
 *   getMesh(): THREE.Object3D | null { return this.mesh; }
 *   isReady(): boolean { return this.mesh !== null; }
 *   dispose(): void { this.mesh?.dispose(); }
 * }
 * ```
 */
export interface Attachable3dChild {
  /**
   * Get the Three.js object to attach to the parent.
   * Returns null if not yet ready.
   */
  getMesh(): THREE.Object3D | null;

  /**
   * Check if the component is ready to be attached.
   */
  isReady(): boolean;

  /**
   * Dispose all Three.js resources.
   */
  dispose(): void;
}

/**
 * Injection token for 3D child components.
 *
 * Parent components use contentChildren(NG_3D_CHILD) to query for all
 * child components that provide this token, then attach their meshes.
 */
export const NG_3D_CHILD = new InjectionToken<Attachable3dChild>('NG_3D_CHILD');
