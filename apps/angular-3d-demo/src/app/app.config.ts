import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideGsap } from '@hive-academy/angular-gsap';
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
    // provideLenis({
    //   lerp: 0.1,
    //   wheelMultiplier: 1,
    //   touchMultiplier: 2,
    //   smoothWheel: true,
    //   useGsapTicker: true,
    // }),
  ],
};
