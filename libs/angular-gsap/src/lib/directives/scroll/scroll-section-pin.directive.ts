import {
  Directive,
  ElementRef,
  inject,
  input,
  output,
  DestroyRef,
  afterNextRender,
  PLATFORM_ID,
  signal,
  computed,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { GsapCoreService } from '../../services/gsap-core.service';

/**
 * ScrollSectionPinDirective - Brief Section Pinning During Scroll
 *
 * A modern alternative to heavy scroll hijacking. Pins a section briefly
 * (configurable scroll distance) while content animates, then releases
 * for natural scroll continuation.
 *
 * Use Case: Show entrance animation → brief hold → scroll continues
 *
 * @example
 * ```html
 * <!-- Pin section for 300px of scroll -->
 * <section scrollSectionPin [pinDuration]="'300px'">
 *   <div class="content">Content that animates while pinned</div>
 * </section>
 *
 * <!-- Custom start position and callbacks -->
 * <section
 *   scrollSectionPin
 *   [pinDuration]="'500px'"
 *   [start]="'top center'"
 *   (pinProgress)="onProgress($event)"
 *   (pinned)="onPinnedChange($event)"
 * >
 * </section>
 * ```
 */
@Directive({
  selector: '[scrollSectionPin]',
  standalone: true,
})
export class ScrollSectionPinDirective {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly gsapCore = inject(GsapCoreService);

  // Configuration inputs
  /**
   * Duration of the pin in scroll distance (e.g., '300px', '50vh')
   * Default: '300px' - Content remains pinned for 300px of scroll
   */
  readonly pinDuration = input<string>('300px');

  /**
   * ScrollTrigger start position
   * Default: 'top top' - Pin starts when element top reaches viewport top
   */
  readonly start = input<string>('top top');

  /**
   * ScrollTrigger end position (computed from pinDuration if not specified)
   */
  readonly end = input<string | undefined>(undefined);

  /**
   * Anticipate pin: number of pixels before start to begin anticipating pin
   * Helps smooth the transition into pinned state
   */
  readonly anticipatePin = input<number>(1);

  /**
   * Enable pin spacing - pushes content below the pinned element
   * Default: true
   */
  readonly pinSpacing = input<boolean>(true);

  /**
   * Scrub setting for smooth animation linking to scroll
   * Default: true for smooth scrubbing
   */
  readonly scrub = input<boolean | number>(true);

  /**
   * Enable debug markers
   */
  readonly markers = input<boolean>(false);

  // Outputs
  /**
   * Emits progress (0-1) during pin phase
   */
  readonly pinProgress = output<number>();

  /**
   * Emits true when pinned, false when unpinned
   */
  readonly pinned = output<boolean>();

  /**
   * Emits when pin phase completes
   */
  readonly pinComplete = output<void>();

  // Internal state
  private readonly _isPinned = signal(false);
  private readonly _progress = signal(0);
  private scrollTrigger: ScrollTrigger | null = null;

  /**
   * Computed signal for current pinned state
   */
  readonly isPinned = computed(() => this._isPinned());

  /**
   * Computed signal for current progress
   */
  readonly progress = computed(() => this._progress());

  public constructor() {
    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.initializePinning();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Initialize ScrollTrigger-based pinning
   */
  private initializePinning(): void {
    const ScrollTrigger = this.gsapCore.scrollTrigger;

    if (!ScrollTrigger) {
      console.warn('[ScrollSectionPinDirective] ScrollTrigger not available');
      return;
    }

    const element = this.elementRef.nativeElement as HTMLElement;

    // Calculate end position from pinDuration or use provided end
    const endPosition = this.end() || `+=${this.pinDuration()}`;

    // Create ScrollTrigger with pin
    this.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: this.start(),
      end: endPosition,
      pin: true,
      pinSpacing: this.pinSpacing(),
      anticipatePin: this.anticipatePin(),
      scrub: this.scrub(),
      markers: this.markers(),
      onUpdate: (self: { progress: number }) => {
        this._progress.set(self.progress);
        this.pinProgress.emit(self.progress);
      },
      onToggle: (self: { isActive: boolean }) => {
        const isPinned = self.isActive;
        if (this._isPinned() !== isPinned) {
          this._isPinned.set(isPinned);
          this.pinned.emit(isPinned);
        }
      },
      onLeave: () => {
        this.pinComplete.emit();
      },
    }) as unknown as ScrollTrigger;

    // Add element class for styling hooks
    element.classList.add('scroll-section-pin');
  }

  /**
   * Cleanup ScrollTrigger on destroy
   */
  private cleanup(): void {
    if (this.scrollTrigger) {
      // ScrollTrigger uses kill() method
      (this.scrollTrigger as unknown as { kill: () => void }).kill?.();
      this.scrollTrigger = null;
    }

    const element = this.elementRef.nativeElement as HTMLElement;
    element.classList.remove('scroll-section-pin');
  }

  /**
   * Manually refresh the ScrollTrigger
   * Useful after dynamic content changes
   */
  public refresh(): void {
    if (this.scrollTrigger) {
      (this.scrollTrigger as unknown as { refresh: () => void }).refresh?.();
    }
  }
}
