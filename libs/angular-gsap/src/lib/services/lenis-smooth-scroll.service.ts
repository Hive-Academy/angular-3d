import {
  Injectable,
  inject,
  PLATFORM_ID,
  signal,
  computed,
  OnDestroy,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import type Lenis from 'lenis';
import type { LenisOptions, ScrollToOptions } from 'lenis';
import type { gsap as GsapType } from 'gsap';
import type { ScrollTrigger as ScrollTriggerType } from 'gsap/ScrollTrigger';

/**
 * Extended Lenis options with GSAP integration settings
 */
export interface LenisServiceOptions extends LenisOptions {
  /**
   * Use GSAP ticker for raf loop (recommended when using GSAP)
   * @default true
   */
  useGsapTicker?: boolean;
}

/**
 * Scroll event data from Lenis
 */
export interface LenisScrollEvent {
  scroll: number;
  limit: number;
  velocity: number;
  direction: 1 | -1 | 0;
  progress: number;
  isScrolling: boolean | 'native' | 'smooth';
}

/**
 * LenisSmoothScrollService - Centralized Smooth Scroll Management
 *
 * Provides a singleton service for managing Lenis smooth scrolling
 * with GSAP ScrollTrigger integration.
 *
 * @example
 * ```typescript
 * // Recommended: Use afterNextRender in Angular 19+
 * export class AppComponent {
 *   private lenis = inject(LenisSmoothScrollService);
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.lenis.initialize({
 *         lerp: 0.08,
 *         wheelMultiplier: 0.7,
 *       });
 *     });
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Programmatic scroll
 * this.lenis.scrollTo('#section-2', { duration: 1.5 });
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class LenisSmoothScrollService implements OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);

  // Lenis instance
  private lenisInstance: Lenis | null = null;

  // GSAP references
  private gsap: typeof GsapType | null = null;
  private ScrollTrigger: typeof ScrollTriggerType | null = null;
  private gsapTickerCallback: ((time: number) => void) | null = null;

  // State signals
  private readonly _isInitialized = signal(false);
  private readonly _scroll = signal(0);
  private readonly _progress = signal(0);
  private readonly _velocity = signal(0);
  private readonly _direction = signal<1 | -1 | 0>(0);
  private readonly _isScrolling = signal<boolean | 'native' | 'smooth'>(false);

  // Public readonly signals
  public readonly isInitialized = this._isInitialized.asReadonly();
  public readonly scroll = this._scroll.asReadonly();
  public readonly progress = this._progress.asReadonly();
  public readonly velocity = this._velocity.asReadonly();
  public readonly direction = this._direction.asReadonly();
  public readonly isScrolling = this._isScrolling.asReadonly();

  /** Computed: whether scroll is at the top */
  public readonly isAtTop = computed(() => this._scroll() <= 0);

  /** Computed: whether scroll is at the bottom */
  public readonly isAtBottom = computed(() => this._progress() >= 1);

  public ngOnDestroy(): void {
    this.destroy();
  }

  /**
   * Initialize Lenis smooth scroll
   *
   * @param options Lenis configuration options
   * @returns Promise that resolves when Lenis is initialized
   */
  public async initialize(options: LenisServiceOptions = {}): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (this.lenisInstance) {
      console.warn('Lenis is already initialized. Call destroy() first.');
      return;
    }

    try {
      // Dynamic imports for SSR safety
      const [LenisModule, gsapModule] = await Promise.all([
        import('lenis'),
        import('gsap'),
      ]);

      const LenisClass = LenisModule.default;
      this.gsap = gsapModule.gsap;

      // Try to import ScrollTrigger if available
      try {
        const scrollTriggerModule = await import('gsap/ScrollTrigger');
        this.ScrollTrigger = scrollTriggerModule.ScrollTrigger;
        this.gsap.registerPlugin(this.ScrollTrigger);
      } catch {
        console.warn(
          'LenisSmoothScrollService: ScrollTrigger not available, skipping integration'
        );
      }

      // Extract our custom option
      const { useGsapTicker = true, ...lenisOptions } = options;

      // Create Lenis instance
      this.lenisInstance = new LenisClass({
        lerp: 0.1,
        duration: 1.2,
        smoothWheel: true,
        ...lenisOptions,
      });

      // Sync with GSAP ScrollTrigger
      if (this.ScrollTrigger) {
        this.lenisInstance.on('scroll', this.ScrollTrigger.update);
      }

      // Setup RAF loop
      if (useGsapTicker && this.gsap) {
        this.setupGsapTicker();
      } else {
        this.setupNativeRaf();
      }

      // Subscribe to scroll events and update signals
      this.lenisInstance.on('scroll', (lenis: Lenis) => {
        this._scroll.set(lenis.scroll);
        this._progress.set(lenis.progress);
        this._velocity.set(lenis.velocity);
        this._direction.set(lenis.direction);
        this._isScrolling.set(lenis.isScrolling);
      });

      // Inject Lenis CSS
      this.injectStyles();

      this._isInitialized.set(true);
    } catch (error) {
      console.error('Failed to initialize Lenis smooth scroll:', error);
      throw error;
    }
  }

  /**
   * Get the raw Lenis instance for advanced usage
   */
  public get lenis(): Lenis | null {
    return this.lenisInstance;
  }

  /**
   * Scroll to a target element or position
   *
   * @param target CSS selector, element, or scroll position
   * @param options Scroll options
   */
  public scrollTo(
    target: string | number | HTMLElement,
    options?: ScrollToOptions
  ): void {
    this.lenisInstance?.scrollTo(target, options);
  }

  /**
   * Stop smooth scrolling
   */
  public stop(): void {
    this.lenisInstance?.stop();
  }

  /**
   * Start smooth scrolling (after stop)
   */
  public start(): void {
    this.lenisInstance?.start();
  }

  /**
   * Force a resize calculation
   */
  public resize(): void {
    this.lenisInstance?.resize();
  }

  /**
   * Destroy the Lenis instance and cleanup
   */
  public destroy(): void {
    if (this.lenisInstance) {
      this.lenisInstance.destroy();
      this.lenisInstance = null;
    }

    if (this.gsapTickerCallback && this.gsap) {
      this.gsap.ticker.remove(this.gsapTickerCallback);
      this.gsapTickerCallback = null;
    }

    this._isInitialized.set(false);
    this.gsap = null;
    this.ScrollTrigger = null;
  }

  /**
   * Setup GSAP ticker for RAF loop (recommended)
   */
  private setupGsapTicker(): void {
    if (!this.gsap || !this.lenisInstance) return;

    this.gsapTickerCallback = (time: number) => {
      // GSAP ticker time is in seconds, Lenis expects milliseconds
      this.lenisInstance?.raf(time * 1000);
    };

    this.gsap.ticker.add(this.gsapTickerCallback);
    // Disable lag smoothing for butter-smooth animations
    this.gsap.ticker.lagSmoothing(0);
  }

  /**
   * Fallback to native requestAnimationFrame
   */
  private setupNativeRaf(): void {
    if (!this.lenisInstance) return;

    const raf = (time: number): void => {
      this.lenisInstance?.raf(time);
      if (this.lenisInstance) {
        requestAnimationFrame(raf);
      }
    };
    requestAnimationFrame(raf);
  }

  /**
   * Inject Lenis CSS styles
   */
  private injectStyles(): void {
    const styleId = 'lenis-smooth-scroll-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        html.lenis, html.lenis body {
          height: auto;
        }

        .lenis.lenis-smooth {
          scroll-behavior: auto !important;
        }

        .lenis.lenis-smooth [data-lenis-prevent] {
          overscroll-behavior: contain;
        }

        .lenis.lenis-stopped {
          overflow: hidden;
        }

        .lenis.lenis-scrolling iframe {
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }
  }
}
