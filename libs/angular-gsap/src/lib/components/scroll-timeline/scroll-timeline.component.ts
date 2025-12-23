import {
  Component,
  input,
  output,
  signal,
  computed,
  ChangeDetectionStrategy,
  ElementRef,
  inject,
  DestroyRef,
  afterNextRender,
  PLATFORM_ID,
  contentChildren,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StepIndicatorComponent } from './step-indicator.component';
import { HijackedScrollDirective } from '../../directives/scroll/hijacked-scroll.directive';
import { HijackedScrollItemDirective } from '../../directives/scroll/hijacked-scroll-item.directive';

/**
 * ScrollTimelineComponent - Unified Scroll Timeline with Step Indicator
 *
 * Combines hijacked scroll behavior with a built-in sticky step indicator.
 * Encapsulates IntersectionObserver visibility logic, step navigation, and
 * progress tracking.
 *
 * @example
 * ```html
 * <agsp-scroll-timeline
 *   [scrollHeightPerStep]="900"
 *   [showStepIndicator]="true"
 *   [stepIndicatorPosition]="'left'"
 *   (currentStepChange)="onStep($event)"
 * >
 *   <div hijackedScrollItem [slideDirection]="'left'">Slide 1</div>
 *   <div hijackedScrollItem [slideDirection]="'right'">Slide 2</div>
 *   <div hijackedScrollItem [slideDirection]="'left'">Slide 3</div>
 * </agsp-scroll-timeline>
 * ```
 */
@Component({
  selector: 'agsp-scroll-timeline',
  standalone: true,
  imports: [StepIndicatorComponent],
  hostDirectives: [
    {
      directive: HijackedScrollDirective,
      inputs: [
        'scrollHeightPerStep',
        'animationDuration',
        'ease',
        'start',
        'end',
        'scrub',
        'stepHold',
        'showFirstStepImmediately',
      ],
      outputs: ['currentStepChange', 'progressChange'],
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'scroll-timeline-container block relative',
  },
  template: `
    <!-- Built-in Step Indicator -->
    @if (showStepIndicator()) {
    <agsp-step-indicator
      [stepCount]="stepCount()"
      [currentStep]="currentStep()"
      [visible]="indicatorVisible()"
      [position]="stepIndicatorPosition()"
      (stepClick)="jumpToStep($event)"
    />
    }

    <!-- Content projection for hijacked scroll items -->
    <ng-content />
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }
  `,
})
export class ScrollTimelineComponent {
  private readonly elementRef = inject(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly hijackedScrollDirective = inject(HijackedScrollDirective);

  // Inputs
  /**
   * Show the step indicator
   */
  readonly showStepIndicator = input<boolean>(true);

  /**
   * Position of the step indicator
   */
  readonly stepIndicatorPosition = input<'left' | 'right'>('left');

  /**
   * Hide indicator at start/end of scroll
   * When true, hides indicator when progress is < 1% or > 99%
   */
  readonly hideAtEdges = input<boolean>(true);

  // Outputs
  /**
   * Emitted when step indicator is clicked
   */
  readonly stepClick = output<number>();

  // Query for hijacked scroll items to count steps
  private readonly scrollItems = contentChildren(HijackedScrollItemDirective);

  // Internal state
  private readonly _currentStep = signal(0);
  private readonly _progress = signal(0);
  private readonly _sectionInView = signal(false);

  private sectionObserver?: IntersectionObserver;

  /**
   * Current step (synced from HijackedScrollDirective)
   */
  readonly currentStep = computed(() => this._currentStep());

  /**
   * Current progress (0-1)
   */
  readonly progress = computed(() => this._progress());

  /**
   * Number of steps based on projected content
   */
  readonly stepCount = computed(() => this.scrollItems().length);

  /**
   * Whether the indicator should be visible
   */
  readonly indicatorVisible = computed(() => {
    const inView = this._sectionInView();
    const progress = this._progress();

    if (!inView) return false;
    if (this.hideAtEdges()) {
      return progress > 0.01 && progress < 0.99;
    }
    return true;
  });

  public constructor() {
    // Subscribe to directive outputs
    this.hijackedScrollDirective.currentStepChange.subscribe((step) => {
      this._currentStep.set(step);
    });

    this.hijackedScrollDirective.progressChange.subscribe((progress) => {
      this._progress.set(progress);
    });

    afterNextRender(() => {
      if (isPlatformBrowser(this.platformId)) {
        this.setupSectionObserver();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.sectionObserver?.disconnect();
    });
  }

  /**
   * Jump to a specific step
   */
  public jumpToStep(stepIndex: number): void {
    this.hijackedScrollDirective.jumpToStep(stepIndex);
    this.stepClick.emit(stepIndex);
  }

  /**
   * Setup IntersectionObserver for section visibility
   */
  private setupSectionObserver(): void {
    const options: IntersectionObserverInit = {
      root: null,
      rootMargin: '0px',
      threshold: [0, 0.1],
    };

    this.sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this._sectionInView.set(entry.isIntersecting);
      });
    }, options);

    this.sectionObserver.observe(this.elementRef.nativeElement);
  }
}
