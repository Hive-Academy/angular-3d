import {
  Component,
  input,
  output,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Step navigation data structure
 */
export interface StepData {
  id?: string;
  label?: string;
}

/**
 * StepIndicatorComponent - Sticky Step Navigation for Scroll Sections
 *
 * Provides a numbered step indicator that shows the current position
 * within a scrollable section. Typically used alongside HijackedScrollTimeline
 * or ScrollTimelineComponent.
 *
 * @example
 * ```html
 * <agsp-step-indicator
 *   [stepCount]="5"
 *   [currentStep]="2"
 *   [visible]="true"
 *   [position]="'left'"
 *   (stepClick)="jumpToStep($event)"
 * />
 * ```
 */
@Component({
  selector: 'agsp-step-indicator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav
      class="fixed top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col gap-3 transition-all duration-500"
      [class]="positionClasses()"
      [class.opacity-100]="visible()"
      [class.opacity-0]="!visible()"
      [class.pointer-events-none]="!visible()"
    >
      @for (stepIdx of stepsArray(); track stepIdx; let i = $index) {
        <button
          type="button"
          (click)="onStepClick($event, stepIdx)"
          class="group flex items-center gap-3 transition-all duration-300 hover:translate-x-1"
          [attr.aria-label]="'Go to step ' + (stepIdx + 1)"
          [attr.aria-current]="currentStep() === stepIdx ? 'step' : null"
        >
          <!-- Number Badge -->
          <div
            class="relative flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold transition-all duration-300"
            [class.bg-gradient-to-br]="currentStep() === stepIdx"
            [class.from-indigo-500]="currentStep() === stepIdx"
            [class.to-violet-600]="currentStep() === stepIdx"
            [class.text-white]="currentStep() === stepIdx"
            [class.shadow-lg]="currentStep() === stepIdx"
            [class.shadow-indigo-500/40]="currentStep() === stepIdx"
            [class.scale-110]="currentStep() === stepIdx"
            [class.bg-slate-800/80]="currentStep() !== stepIdx"
            [class.text-slate-400]="currentStep() !== stepIdx"
          >
            {{ (stepIdx + 1).toString().padStart(2, '0') }}
            @if (currentStep() === stepIdx) {
              <div class="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 opacity-40 blur-md -z-10"></div>
            }
          </div>
          <!-- Active bar indicator -->
          <div
            class="h-0.5 rounded-full transition-all duration-300"
            [class.w-6]="currentStep() === stepIdx"
            [class.bg-gradient-to-r]="currentStep() === stepIdx"
            [class.from-indigo-500]="currentStep() === stepIdx"
            [class.to-violet-500]="currentStep() === stepIdx"
            [class.w-0]="currentStep() !== stepIdx"
          ></div>
        </button>
      }
    </nav>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class StepIndicatorComponent {
  /**
   * Total number of steps to display
   */
  readonly stepCount = input.required<number>();

  /**
   * Current active step (0-indexed)
   */
  readonly currentStep = input<number>(0);

  /**
   * Whether the indicator is visible
   */
  readonly visible = input<boolean>(true);

  /**
   * Position of the indicator: 'left' or 'right'
   */
  readonly position = input<'left' | 'right'>('left');

  /**
   * Custom steps data for labels (optional)
   */
  readonly steps = input<StepData[]>([]);

  /**
   * Emitted when a step is clicked
   */
  readonly stepClick = output<number>();

  /**
   * Generate array of step indices for iteration
   */
  protected stepsArray(): number[] {
    return Array.from({ length: this.stepCount() }, (_, i) => i);
  }

  /**
   * Get position CSS classes based on position input
   */
  protected positionClasses(): string {
    return this.position() === 'left'
      ? 'left-4 lg:left-8'
      : 'right-4 lg:right-8';
  }

  /**
   * Handle step click - prevents default and stops propagation to avoid
   * conflicts with Angular Router or parent handlers
   */
  protected onStepClick(event: MouseEvent, stepIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.stepClick.emit(stepIndex);
  }
}
