import { InjectionToken, WritableSignal } from '@angular/core';
import type { Material } from 'three/webgpu';

/**
 * Writable signal for material sharing between directives.
 * Material directives write to this, MeshDirective reads from it.
 */
export const MATERIAL_SIGNAL = new InjectionToken<
  WritableSignal<Material | null>
>('MATERIAL_SIGNAL');
