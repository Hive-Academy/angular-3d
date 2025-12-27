import { InjectionToken, WritableSignal } from '@angular/core';
import type { BufferGeometry } from 'three/webgpu';

/**
 * Writable signal for geometry sharing between directives.
 * Geometry directives write to this, MeshDirective reads from it.
 */
export const GEOMETRY_SIGNAL = new InjectionToken<
  WritableSignal<BufferGeometry | null>
>('GEOMETRY_SIGNAL');
