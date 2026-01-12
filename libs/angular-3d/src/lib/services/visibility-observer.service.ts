/**
 * VisibilityAware Mixin - Automatic visibility detection for components
 *
 * Provides IntersectionObserver-based visibility tracking that components
 * can use to pause expensive operations when off-screen.
 *
 * @example
 * ```typescript
 * // Option 1: Use as a base class
 * @Component({...})
 * export class MyComponent extends VisibilityAwareComponent {
 *   constructor() {
 *     super();
 *
 *     // React to visibility changes
 *     effect(() => {
 *       if (this.isVisible()) {
 *         this.startAnimations();
 *       } else {
 *         this.stopAnimations();
 *       }
 *     });
 *   }
 *
 *   ngAfterViewInit() {
 *     this.initVisibilityObserver(this.hostElement);
 *   }
 * }
 *
 * // Option 2: Use the utility function
 * export class MyComponent {
 *   private visibility = useVisibilityObserver();
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.visibility.observe(this.elementRef.nativeElement);
 *     });
 *   }
 * }
 * ```
 */
import {
  signal,
  computed,
  DestroyRef,
  inject,
  Injectable,
} from '@angular/core';

/**
 * Configuration for visibility observer
 */
export interface VisibilityObserverConfig {
  /**
   * Intersection threshold (0-1) - how much must be visible
   * Default: 0.01 (1% visible triggers)
   */
  threshold?: number;

  /**
   * Root margin to extend/contract the viewport
   * Default: '100px' (trigger 100px before entering)
   */
  rootMargin?: string;

  /**
   * Whether to disconnect after first intersection
   * Default: false
   */
  once?: boolean;
}

/**
 * Base component class providing visibility tracking
 */
export abstract class VisibilityAwareComponent {
  private visibilityObserver: IntersectionObserver | null = null;
  private readonly destroyRef = inject(DestroyRef);

  protected readonly _isVisible = signal(false);

  /** Signal indicating if the component is currently visible */
  public readonly isVisible = this._isVisible.asReadonly();

  /** Computed signal, true when component just became visible */
  public readonly wasHidden = computed(() => !this._isVisible());

  /**
   * Initialize visibility observer on an element
   *
   * @param element Element to observe (usually host or container)
   * @param config Optional configuration
   */
  protected initVisibilityObserver(
    element: HTMLElement,
    config: VisibilityObserverConfig = {}
  ): void {
    const { threshold = 0.01, rootMargin = '100px', once = false } = config;

    if (this.visibilityObserver) {
      this.visibilityObserver.disconnect();
    }

    this.visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        this._isVisible.set(isVisible);

        if (once && isVisible) {
          this.visibilityObserver?.disconnect();
          this.visibilityObserver = null;
        }
      },
      { threshold, rootMargin }
    );

    this.visibilityObserver.observe(element);

    this.destroyRef.onDestroy(() => {
      this.visibilityObserver?.disconnect();
      this.visibilityObserver = null;
    });
  }

  /**
   * Manually clean up the observer
   */
  protected cleanupVisibilityObserver(): void {
    this.visibilityObserver?.disconnect();
    this.visibilityObserver = null;
  }
}

/**
 * Standalone utility for visibility tracking
 *
 * Use in components that can't extend a base class
 */
@Injectable({ providedIn: 'root' })
export class VisibilityObserverService {
  private observer: IntersectionObserver | null = null;
  private readonly destroyRef = inject(DestroyRef);

  private readonly _isVisible = signal(false);
  public readonly isVisible = this._isVisible.asReadonly();

  /**
   * Start observing an element for visibility changes
   */
  public observe(
    element: HTMLElement,
    config: VisibilityObserverConfig = {}
  ): void {
    const { threshold = 0.01, rootMargin = '100px', once = false } = config;

    if (this.observer) {
      this.observer.disconnect();
    }

    this.observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        this._isVisible.set(isVisible);

        if (once && isVisible) {
          this.observer?.disconnect();
          this.observer = null;
        }
      },
      { threshold, rootMargin }
    );

    this.observer.observe(element);

    this.destroyRef.onDestroy(() => {
      this.observer?.disconnect();
    });
  }

  /**
   * Stop observing
   */
  public disconnect(): void {
    this.observer?.disconnect();
    this.observer = null;
  }
}

/**
 * Factory function to create visibility observer in component
 *
 * @example
 * ```typescript
 * @Component({...})
 * export class MyComponent {
 *   private elementRef = inject(ElementRef);
 *   private visibility = createVisibilityObserver();
 *
 *   constructor() {
 *     afterNextRender(() => {
 *       this.visibility.observe(this.elementRef.nativeElement);
 *     });
 *
 *     effect(() => {
 *       if (this.visibility.isVisible()) {
 *         console.log('Component is visible!');
 *       }
 *     });
 *   }
 * }
 * ```
 */
export function createVisibilityObserver(
  config: VisibilityObserverConfig = {}
): {
  isVisible: ReturnType<typeof signal<boolean>>;
  observe: (element: HTMLElement) => void;
  disconnect: () => void;
} {
  const destroyRef = inject(DestroyRef);
  let observer: IntersectionObserver | null = null;
  const _isVisible = signal(false);

  const { threshold = 0.01, rootMargin = '100px', once = false } = config;

  const observe = (element: HTMLElement): void => {
    if (observer) {
      observer.disconnect();
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;
        _isVisible.set(isVisible);

        if (once && isVisible) {
          observer?.disconnect();
          observer = null;
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
  };

  const disconnect = (): void => {
    observer?.disconnect();
    observer = null;
  };

  destroyRef.onDestroy(disconnect);

  return {
    isVisible: _isVisible,
    observe,
    disconnect,
  };
}
