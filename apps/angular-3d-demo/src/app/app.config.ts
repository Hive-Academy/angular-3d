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
    // Optimized for 3D content - lerp 0.1 provides smooth scrolling
    // without interfering with Three.js render loops
    provideLenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      smoothWheel: true,
      useGsapTicker: true,
    }),
  ],
};
