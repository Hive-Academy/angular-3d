import { InjectionToken } from '@angular/core';
import type { Object3D } from 'three';

/**
 * Injection token for the parent 3D object.
 * Used by child components to attach themselves to a parent (Group or Scene).
 *
 * It returns a function that returns the parent Object3D, or null if not yet ready.
 * This allows for lazy resolution or signal-based access.
 */
export const NG_3D_PARENT = new InjectionToken<() => Object3D | null>(
  'NG_3D_PARENT'
);
