import {
  Directive,
  ElementRef,
  Renderer2,
  afterNextRender,
  effect,
  inject,
  input,
  signal,
  untracked,
  output,
  DestroyRef,
} from '@angular/core';

/**
 * SectionStickyDirective - Makes child elements sticky only when parent section is in viewport.
 *
 * This directive uses IntersectionObserver to monitor when a section enters/exits the viewport
 * and toggles a data attribute that CSS can use to control sticky positioning.
 *
 * @usageNotes
 * ```html
 * <!-- Basic usage -->
 * <section sectionSticky>
 *   <nav class="section-sticky-target">Sidebar</nav>
 *   <div class="content">Main content</div>
 * </section>
 *
 * <!-- With configuration -->
 * <section
 *   sectionSticky
 *   [stickyThreshold]="0.2"
 *   [stickyRootMargin]="'100px'"
 *   (inViewChange)="onViewportChange($event)"
 * >
 *   <nav class="section-sticky-target">Sidebar</nav>
 * </section>
 * ```
 *
 * @css
 * ```css
 * .section-sticky-target {
 *   position: absolute;
 *   opacity: 0;
 *   pointer-events: none;
 * }
 *
 * [data-section-in-view="true"] .section-sticky-target {
 *   position: fixed;
 *   opacity: 1;
 *   pointer-events: auto;
 * }
 * ```
 */
@Directive({
  selector: '[sectionSticky]',
})
export class SectionStickyDirective {
  /** Percentage of section that must be visible to trigger (0-1). Default: 0 */
  public readonly stickyThreshold = input<number>(0.0);

  /** Margin around viewport for triggering (e.g., '-100px'). Default: '0px' */
  public readonly stickyRootMargin = input<string>('0px');

  /** Debounce time in milliseconds for intersection updates. Default: 50 */
  public readonly stickyDebounce = input<number>(50);

  /** Enable debug logging. Default: false */
  public readonly stickyDebug = input<boolean>(false);

  /** Emits when the section enters or exits the viewport */
  public readonly inViewChange = output<boolean>();

  private readonly isInView = signal<boolean>(false);
  private readonly isInitialized = signal<boolean>(false);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly renderer = inject(Renderer2);
  private readonly destroyRef = inject(DestroyRef);

  private observer?: IntersectionObserver;
  private debounceTimer?: ReturnType<typeof setTimeout>;

  public constructor() {
    // Setup observer after render (SSR-safe)
    afterNextRender(() => {
      this.setupIntersectionObserver();
      this.isInitialized.set(true);
    });

    // React to input changes using effect
    effect(() => {
      const currentThreshold = this.stickyThreshold();
      const currentRootMargin = this.stickyRootMargin();
      const initialized = this.isInitialized();

      if (initialized) {
        untracked(() => {
          this.reconnectObserver();
        });

        if (this.stickyDebug()) {
          console.log('[SectionStickyDirective] Config updated:', {
            threshold: currentThreshold,
            rootMargin: currentRootMargin,
          });
        }
      }
    });

    // React to view state changes
    effect(() => {
      const inView = this.isInView();

      untracked(() => {
        this.updateStickyState(inView);
        this.inViewChange.emit(inView);
      });
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }
      if (this.observer) {
        this.observer.disconnect();
        this.observer = undefined;
      }
    });
  }

  private setupIntersectionObserver(): void {
    if (
      typeof window === 'undefined' ||
      typeof IntersectionObserver === 'undefined'
    ) {
      if (this.stickyDebug()) {
        console.warn(
          '[SectionStickyDirective] IntersectionObserver not available'
        );
      }
      return;
    }

    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: this.stickyRootMargin(),
      threshold: this.stickyThreshold(),
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.debouncedUpdate(entry.isIntersecting);
      });
    }, options);

    this.observer.observe(this.elementRef.nativeElement);

    if (this.stickyDebug()) {
      console.log('[SectionStickyDirective] Observer initialized', {
        element: this.elementRef.nativeElement.tagName,
        threshold: this.stickyThreshold(),
        rootMargin: this.stickyRootMargin(),
      });
    }
  }

  private reconnectObserver(): void {
    this.observer?.disconnect();
    this.setupIntersectionObserver();
  }

  private debouncedUpdate(isIntersecting: boolean): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    const debounceMs = this.stickyDebounce();

    if (debounceMs > 0) {
      this.debounceTimer = setTimeout(() => {
        this.isInView.set(isIntersecting);
      }, debounceMs);
    } else {
      this.isInView.set(isIntersecting);
    }
  }

  private updateStickyState(isIntersecting: boolean): void {
    const element = this.elementRef.nativeElement;

    if (isIntersecting) {
      this.renderer.setAttribute(element, 'data-section-in-view', 'true');
      this.renderer.addClass(element, 'section-in-view');
    } else {
      this.renderer.setAttribute(element, 'data-section-in-view', 'false');
      this.renderer.removeClass(element, 'section-in-view');
    }

    if (this.stickyDebug()) {
      console.log('[SectionStickyDirective] State updated:', {
        isIntersecting,
        element: element.tagName,
        classes: element.className,
      });
    }
  }
}
