import {
  EnvironmentProviders,
  makeEnvironmentProviders,
  APP_INITIALIZER,
  InjectionToken,
  inject,
} from '@angular/core';
import {
  LenisSmoothScrollService,
  LenisServiceOptions,
} from '../services/lenis-smooth-scroll.service';

/**
 * Injection token for providing Lenis configuration.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: LENIS_CONFIG, useValue: { lerp: 0.1, wheelMultiplier: 1 } }
 * ]
 * ```
 */
export const LENIS_CONFIG = new InjectionToken<LenisServiceOptions>(
  'LENIS_CONFIG'
);

/**
 * Provides Lenis smooth scroll with configuration.
 *
 * This function follows Angular's modern provider pattern (like `provideRouter()`)
 * and initializes Lenis smooth scrolling on application startup.
 *
 * ## Features
 * - **Auto-Initialization**: Lenis starts automatically via APP_INITIALIZER
 * - **GSAP Integration**: Syncs with GSAP ticker for butter-smooth animations
 * - **ScrollTrigger Sync**: Automatically updates ScrollTrigger on scroll
 * - **Configurable**: Full control over lerp, multipliers, and behavior
 *
 * @param config - Optional Lenis configuration
 * @returns Environment providers for Lenis smooth scroll
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { ApplicationConfig } from '@angular/core';
 * import { provideGsap, provideLenis } from '@hive-academy/angular-gsap';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     // GSAP must be provided first
 *     provideGsap({ defaults: { ease: 'power2.out' } }),
 *
 *     // Then Lenis for smooth scrolling
 *     provideLenis({
 *       lerp: 0.1,           // Smoothness (0.05-0.1 for smooth, 0.1-0.2 for responsive)
 *       wheelMultiplier: 1,  // Mouse wheel speed
 *       touchMultiplier: 2,  // Touch swipe speed
 *       smoothWheel: true,   // Smooth mouse wheel scrolling
 *       useGsapTicker: true, // Use GSAP's RAF for synced animations
 *     }),
 *   ],
 * };
 * ```
 *
 * @example
 * ```typescript
 * // Minimal configuration
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideGsap(),
 *     provideLenis(), // Uses sensible defaults
 *   ],
 * };
 * ```
 *
 * @publicApi
 */
export function provideLenis(
  config?: LenisServiceOptions
): EnvironmentProviders {
  return makeEnvironmentProviders([
    // Provide configuration token
    { provide: LENIS_CONFIG, useValue: config ?? {} },

    // Initialize Lenis on app startup (async)
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const lenis = inject(LenisSmoothScrollService);
        const lenisConfig = inject(LENIS_CONFIG, { optional: true });

        return async () => {
          await lenis.initialize(lenisConfig ?? {});
        };
      },
      multi: true,
    },
  ]);
}

// Re-export types for convenience
export type { LenisServiceOptions } from '../services/lenis-smooth-scroll.service';
