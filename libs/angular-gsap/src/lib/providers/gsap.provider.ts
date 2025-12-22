import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  APP_INITIALIZER,
  inject,
} from '@angular/core';
import {
  GsapCoreService,
  GSAP_CONFIG,
  GsapConfig,
} from '../services/gsap-core.service';

/**
 * Provides GSAP with optional configuration.
 *
 * This function follows Angular's modern provider pattern (like `provideRouter()`)
 * and ensures GSAP is initialized before the application starts.
 *
 * ## Features
 * - **Early Initialization**: Uses APP_INITIALIZER to ensure GSAP is ready
 * - **Global Defaults**: Configure ease, duration, and other tween defaults
 * - **Plugin Registration**: Register additional GSAP plugins (ScrollTrigger is automatic)
 * - **Type-Safe**: Full TypeScript support for configuration
 *
 * @param config - Optional GSAP configuration
 * @returns Environment providers for GSAP
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideGsap } from '@hive-academy/angular-gsap';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideGsap({
 *       defaults: {
 *         ease: 'power2.out',
 *         duration: 1,
 *       },
 *     }),
 *   ],
 * };
 * ```
 *
 * @example
 * ```typescript
 * // With additional plugins
 * import { Flip, Draggable } from 'gsap/all';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideGsap({
 *       defaults: { ease: 'power3.inOut' },
 *       plugins: [Flip, Draggable],
 *     }),
 *   ],
 * };
 * ```
 *
 * @publicApi
 */
export function provideGsap(config?: GsapConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Provide configuration token
    { provide: GSAP_CONFIG, useValue: config ?? {} },

    // Initialize GSAP on app startup
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const gsapCore = inject(GsapCoreService);
        return () => {
          // Access gsap property to trigger lazy initialization
          gsapCore.gsap;
        };
      },
      multi: true,
    },
  ]);
}

// Re-export types for convenience
export { GSAP_CONFIG, GsapConfig } from '../services/gsap-core.service';
