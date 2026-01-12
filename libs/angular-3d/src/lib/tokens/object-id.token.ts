import { InjectionToken } from '@angular/core';

/**
 * Unique object ID for Three.js object registration.
 * Each component provides its own ID via this token.
 */
export const OBJECT_ID = new InjectionToken<string>('OBJECT_ID');
