import {
  Injectable,
  inject,
  PLATFORM_ID,
  signal,
  InjectionToken,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Configuration options for GSAP initialization.
 *
 * @example
 * ```typescript
 * const config: GsapConfig = {
 *   defaults: { ease: 'power2.out', duration: 1 },
 *   plugins: [Flip, Draggable],
 * };
 * ```
 */
export interface GsapConfig {
  /**
   * Global GSAP defaults applied to all tweens.
   * See https://gsap.com/docs/v3/GSAP/gsap.defaults()
   */
  defaults?: gsap.TweenVars;

  /**
   * Additional GSAP plugins to register beyond ScrollTrigger.
   * ScrollTrigger is always registered automatically.
   */
  plugins?: gsap.RegisterablePlugins[];
}

/**
 * Injection token for providing GSAP configuration.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: GSAP_CONFIG, useValue: { defaults: { ease: 'power2.out' } } }
 * ]
 * ```
 */
export const GSAP_CONFIG = new InjectionToken<GsapConfig>('GSAP_CONFIG');

/**
 * GsapCoreService - Centralized GSAP Access and Plugin Management
 *
 * This singleton service provides centralized access to GSAP core and plugins.
 * It ensures plugins are registered only once and provides SSR-safe access
 * to GSAP functionality.
 *
 * ## Key Features
 * - **Singleton Pattern**: Plugins registered once on first browser access
 * - **SSR-Safe**: Guards all browser-only operations
 * - **Lazy Initialization**: Only initializes when properties are accessed
 * - **Configurable**: Reads optional GSAP_CONFIG token for defaults
 *
 * ## Usage
 *
 * ### With provideGsap() (Recommended)
 * ```typescript
 * // app.config.ts
 * import { provideGsap } from '@hive-academy/angular-gsap';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideGsap({ defaults: { ease: 'power2.out', duration: 1 } }),
 *   ],
 * };
 * ```
 *
 * ### Direct Injection
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private readonly gsapCore = inject(GsapCoreService);
 *
 *   animate() {
 *     if (this.gsapCore.gsap) {
 *       this.gsapCore.gsap.to('.element', { x: 100 });
 *     }
 *   }
 * }
 * ```
 *
 * @publicApi
 */
@Injectable({
  providedIn: 'root',
})
export class GsapCoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(GSAP_CONFIG, { optional: true });

  private readonly _isInitialized = signal(false);
  private _gsap: typeof gsap | null = null;
  private _scrollTrigger: typeof ScrollTrigger | null = null;

  /**
   * Signal indicating whether GSAP has been initialized.
   * Useful for conditional rendering or waiting for initialization.
   */
  public readonly isInitialized = this._isInitialized.asReadonly();

  /**
   * Get the GSAP instance.
   * Returns null if not in browser environment.
   *
   * @example
   * ```typescript
   * if (this.gsapCore.gsap) {
   *   this.gsapCore.gsap.to('.element', { x: 100, duration: 1 });
   * }
   * ```
   */
  public get gsap(): typeof gsap | null {
    this.ensureInitialized();
    return this._gsap;
  }

  /**
   * Get the ScrollTrigger plugin instance.
   * Returns null if not in browser environment.
   *
   * @example
   * ```typescript
   * if (this.gsapCore.scrollTrigger) {
   *   this.gsapCore.scrollTrigger.create({
   *     trigger: '.section',
   *     start: 'top center',
   *     onEnter: () => console.log('Entered'),
   *   });
   * }
   * ```
   */
  public get scrollTrigger(): typeof ScrollTrigger | null {
    this.ensureInitialized();
    return this._scrollTrigger;
  }

  /**
   * Check if running in a browser environment.
   * Useful for SSR-safe conditionals.
   */
  public get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  /**
   * Create a GSAP context for scoped animations.
   * Contexts automatically handle cleanup when reverted.
   *
   * @param func - Context function containing animations
   * @param scope - Optional scope element or selector
   * @returns GSAP Context or undefined if not in browser
   *
   * @example
   * ```typescript
   * // In component
   * private ctx?: gsap.Context;
   *
   * ngAfterViewInit() {
   *   this.ctx = this.gsapCore.createContext((self) => {
   *     self.add('animate', () => {
   *       gsap.to('.box', { x: 100 });
   *     });
   *   }, this.elementRef.nativeElement);
   * }
   *
   * ngOnDestroy() {
   *   this.ctx?.revert();
   * }
   * ```
   */
  public createContext(
    func: gsap.ContextFunc,
    scope?: Element | string
  ): gsap.Context | undefined {
    if (!this.isBrowser || !this._gsap) {
      return undefined;
    }
    return this._gsap.context(func, scope);
  }

  /**
   * Ensures GSAP is initialized on first access.
   * This is called automatically when accessing gsap or scrollTrigger properties.
   */
  private ensureInitialized(): void {
    if (this._isInitialized() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    // Store references
    this._gsap = gsap;
    this._scrollTrigger = ScrollTrigger;

    // Register ScrollTrigger plugin (always needed)
    gsap.registerPlugin(ScrollTrigger);

    // Apply global defaults if provided
    if (this.config?.defaults) {
      gsap.defaults(this.config.defaults);
    }

    // Register additional plugins if provided
    if (this.config?.plugins && this.config.plugins.length > 0) {
      gsap.registerPlugin(...this.config.plugins);
    }

    this._isInitialized.set(true);
  }
}
