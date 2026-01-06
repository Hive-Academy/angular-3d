import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideGsap, provideLenis } from '@hive-academy/angular-gsap';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),

    // GSAP with global configuration
    provideGsap({
      defaults: { ease: 'power2.out', duration: 1 },
    }),

    // Lenis smooth scroll with configuration
    // PERF: useGsapTicker: false prevents dual RAF loop conflict
    // Lenis uses native RAF, Three.js uses setAnimationLoop - they don't compete
    provideLenis({
      lerp: 0.1,
      wheelMultiplier: 1.2,
      touchMultiplier: 2,
      smoothWheel: true,
      useGsapTicker: false, // Use native RAF to avoid conflict with Three.js
    }),
  ],
};
