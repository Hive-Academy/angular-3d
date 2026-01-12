import {
  Directive,
  inject,
  input,
  DestroyRef,
  afterNextRender,
  output,
} from '@angular/core';
import {
  LenisSmoothScrollService,
  type LenisServiceOptions,
  type LenisScrollEvent,
} from '../services/lenis-smooth-scroll.service';

// Re-export for convenience
export type { LenisServiceOptions as LenisSmoothScrollConfig };

/**
 * LenisSmoothScrollDirective - Declarative Smooth Scroll
 *
 * A declarative way to initialize Lenis smooth scrolling.
 * Uses the centralized LenisSmoothScrollService under the hood.
 *
 * For most use cases, you can use the service directly for more control.
 * This directive is useful for quick initialization in templates.
 *
 * @example
 * ```html
 * <!-- In your root component or page component -->
 * <main lenisSmoothScroll [lenisConfig]="{ lerp: 0.08, wheelMultiplier: 0.7 }">
 *   <section>...</section>
 *   <section>...</section>
 * </main>
 * ```
 *
 * @example
 * ```typescript
 * // Preferred approach: Use the service directly with afterNextRender
 * export class AppComponent {
 *   private lenis = inject(LenisSmoothScrollService);
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.lenis.initialize({ lerp: 0.08 });
 *     });
 *   }
 * }
 * ```
 */
@Directive({
  selector: '[lenisSmoothScroll]',
  standalone: true,
})
export class LenisSmoothScrollDirective {
  private readonly lenisService = inject(LenisSmoothScrollService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Configuration for Lenis smooth scroll
   */
  public readonly lenisConfig = input<LenisServiceOptions>({});

  /**
   * Emits scroll events from Lenis
   */
  public readonly lenisScroll = output<LenisScrollEvent>();

  private scrollUnsubscribe?: () => void;

  public constructor() {
    // afterNextRender is the Angular 19+ pattern for browser-only initialization
    // It automatically handles SSR and only runs in browser after first render
    afterNextRender(() => {
      void this.initializeLenis();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.scrollUnsubscribe?.();
    });
  }

  /**
   * Get the Lenis service for programmatic control
   */
  public get service(): LenisSmoothScrollService {
    return this.lenisService;
  }

  /**
   * Initialize Lenis via the service
   */
  private async initializeLenis(): Promise<void> {
    try {
      await this.lenisService.initialize(this.lenisConfig());

      // Subscribe to scroll events and emit via output
      const lenis = this.lenisService.lenis;
      if (lenis) {
        this.scrollUnsubscribe = lenis.on('scroll', () => {
          this.lenisScroll.emit({
            scroll: this.lenisService.scroll(),
            limit: lenis.limit,
            velocity: this.lenisService.velocity(),
            direction: this.lenisService.direction(),
            progress: this.lenisService.progress(),
            isScrolling: this.lenisService.isScrolling(),
          });
        });
      }
    } catch (error) {
      console.error('LenisSmoothScrollDirective: Failed to initialize:', error);
    }
  }
}
