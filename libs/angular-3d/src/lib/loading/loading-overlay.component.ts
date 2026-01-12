/**
 * Loading Overlay Component - Pre-built loading UI for scene initialization
 *
 * Displays a loading indicator during scene initialization with smooth progress animation.
 * Supports both UnifiedLoadingState signals and individual signal inputs.
 *
 * Features:
 * - CSS custom properties for theming
 * - Smooth progress animation via CSS transitions
 * - Fade out on completion with configurable duration
 * - Fullscreen mode (fixed) or container mode (absolute)
 * - Accessibility: aria-live, aria-busy, role="status"
 * - Respects prefers-reduced-motion media query
 * - Works in SSR (static loading state)
 *
 * @example
 * ```html
 * <!-- With UnifiedLoadingState -->
 * <a3d-loading-overlay [loadingState]="unifiedState" />
 *
 * <!-- With individual signals -->
 * <a3d-loading-overlay
 *   [progress]="progressSignal"
 *   [isReady]="readySignal"
 *   [phase]="phaseSignal"
 *   [showProgress]="true"
 *   [showPhase]="true"
 *   [fullscreen]="false" />
 *
 * <!-- With custom loading indicator -->
 * <a3d-loading-overlay [loadingState]="state">
 *   <div loading-indicator>
 *     <custom-spinner />
 *   </div>
 * </a3d-loading-overlay>
 * ```
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
  signal,
  effect,
  type Signal,
} from '@angular/core';
import type { LoadingPhase, UnifiedLoadingState } from './types';

/**
 * LoadingOverlayComponent
 *
 * Pre-built loading overlay that displays during scene initialization.
 * Coordinates with UnifiedLoadingState for multi-phase progress tracking.
 */
@Component({
  selector: 'a3d-loading-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.a3d-loading-overlay--visible]': '!isHidden()',
    '[class.a3d-loading-overlay--fullscreen]': 'fullscreen()',
    '[attr.aria-busy]': '!isFullyReady()',
    '[attr.aria-live]': '"polite"',
    role: 'status',
  },
  template: `
    <div class="a3d-loading-overlay__backdrop">
      <div class="a3d-loading-overlay__content">
        <!-- Default loading indicator (can be replaced via projection) -->
        <ng-content select="[loading-indicator]">
          <span class="a3d-loading-overlay__spinner" aria-hidden="true"></span>
        </ng-content>

        <!-- Progress display -->
        @if (showProgress()) {
        <div
          class="a3d-loading-overlay__progress"
          role="progressbar"
          [attr.aria-valuenow]="displayProgress()"
          [attr.aria-valuemin]="0"
          [attr.aria-valuemax]="100"
        >
          <div
            class="a3d-loading-overlay__progress-bar"
            [style.width.%]="displayProgress()"
          ></div>
        </div>
        <div class="a3d-loading-overlay__progress-text" aria-live="off">
          {{ displayProgress() }}%
        </div>
        }

        <!-- Phase text -->
        @if (showPhase()) {
        <div class="a3d-loading-overlay__phase">
          {{ phaseText() }}
        </div>
        }

        <!-- Custom content projection -->
        <ng-content />
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        /* CSS Custom Properties for theming */
        --a3d-loading-bg: rgba(0, 0, 0, 0.9);
        --a3d-loading-text: #ffffff;
        --a3d-loading-accent: #3b82f6;
        --a3d-loading-font: system-ui, sans-serif;
        --a3d-loading-fade-duration: 400ms;

        display: block;
        position: absolute;
        inset: 0;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity var(--a3d-loading-fade-duration) ease-out;
      }

      :host(.a3d-loading-overlay--visible) {
        pointer-events: auto;
        opacity: 1;
      }

      :host(.a3d-loading-overlay--fullscreen) {
        position: fixed;
      }

      .a3d-loading-overlay__backdrop {
        width: 100%;
        height: 100%;
        background: var(--a3d-loading-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .a3d-loading-overlay__content {
        text-align: center;
        color: var(--a3d-loading-text);
        font-family: var(--a3d-loading-font);
      }

      .a3d-loading-overlay__spinner {
        display: block;
        width: 48px;
        height: 48px;
        border: 3px solid transparent;
        border-top-color: var(--a3d-loading-accent);
        border-radius: 50%;
        animation: a3d-spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes a3d-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .a3d-loading-overlay__progress {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin: 16px auto;
      }

      .a3d-loading-overlay__progress-bar {
        height: 100%;
        background: var(--a3d-loading-accent);
        transition: width 150ms ease-out;
      }

      .a3d-loading-overlay__progress-text {
        font-size: 14px;
        opacity: 0.8;
      }

      .a3d-loading-overlay__phase {
        font-size: 12px;
        opacity: 0.6;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        :host {
          transition: none;
        }
        .a3d-loading-overlay__spinner {
          animation: none;
          border: 3px solid var(--a3d-loading-accent);
        }
        .a3d-loading-overlay__progress-bar {
          transition: none;
        }
      }
    `,
  ],
})
export class LoadingOverlayComponent {
  // ================================
  // Inputs
  // ================================

  /**
   * Unified loading state from createUnifiedLoadingState().
   * If provided, takes precedence over individual signals.
   */
  public readonly loadingState = input<UnifiedLoadingState | null>(null);

  /**
   * Progress signal (0-100).
   * Used when loadingState is not provided.
   */
  public readonly progress = input<Signal<number> | undefined>(undefined);

  /**
   * Ready state signal.
   * Used when loadingState is not provided.
   */
  public readonly isReady = input<Signal<boolean> | undefined>(undefined);

  /**
   * Current phase signal.
   * Used when loadingState is not provided.
   */
  public readonly phase = input<Signal<LoadingPhase> | undefined>(undefined);

  /**
   * Whether to use fixed positioning (fullscreen) vs absolute (container).
   * Default: false (absolute positioning within parent container)
   */
  public readonly fullscreen = input<boolean>(false);

  /**
   * Whether to show the progress bar and percentage.
   * Default: true
   */
  public readonly showProgress = input<boolean>(true);

  /**
   * Whether to show the current phase text.
   * Default: true
   */
  public readonly showPhase = input<boolean>(true);

  /**
   * Duration of fade-out animation in milliseconds.
   * Default: 400
   */
  public readonly fadeOutDuration = input<number>(400);

  // ================================
  // Internal State
  // ================================

  /**
   * Internal hidden state - set after fade-out animation completes.
   */
  private readonly _isHidden = signal<boolean>(false);

  /**
   * Public readonly accessor for hidden state.
   */
  public readonly isHidden = this._isHidden.asReadonly();

  // ================================
  // Computed Signals
  // ================================

  /**
   * Computed: actual progress value from loadingState or individual signal.
   */
  public readonly actualProgress = computed(() => {
    const state = this.loadingState();
    if (state) {
      return state.progress();
    }
    const progressSignal = this.progress();
    if (progressSignal) {
      return progressSignal();
    }
    return 0;
  });

  /**
   * Computed: display progress value (for smooth animation in template).
   * Uses CSS transition for smooth visual updates.
   */
  public readonly displayProgress = computed(() => {
    return this.actualProgress();
  });

  /**
   * Computed: is fully ready from loadingState or individual signal.
   */
  public readonly isFullyReady = computed(() => {
    const state = this.loadingState();
    if (state) {
      return state.isFullyReady();
    }
    const readySignal = this.isReady();
    if (readySignal) {
      return readySignal();
    }
    // Fall back to progress-based completion
    return this.actualProgress() >= 100;
  });

  /**
   * Computed: current phase from loadingState or individual signal.
   */
  public readonly currentPhase = computed<LoadingPhase>(() => {
    const state = this.loadingState();
    if (state) {
      return state.currentPhase();
    }
    const phaseSignal = this.phase();
    if (phaseSignal) {
      return phaseSignal();
    }
    // Default phase based on progress
    const progress = this.actualProgress();
    if (progress < 33) return 'scene-init';
    if (progress < 66) return 'asset-loading';
    if (progress < 100) return 'entrance-prep';
    return 'ready';
  });

  /**
   * Computed: human-readable phase text for display.
   */
  public readonly phaseText = computed(() => {
    const phase = this.currentPhase();
    switch (phase) {
      case 'scene-init':
        return 'Initializing Scene';
      case 'asset-loading':
        return 'Loading Assets';
      case 'entrance-prep':
        return 'Preparing Entrance';
      case 'ready':
        return 'Ready';
      default:
        return 'Loading';
    }
  });

  // ================================
  // Constructor
  // ================================

  public constructor() {
    // Effect: hide overlay when ready (with delay for fade animation)
    effect(() => {
      const ready = this.isFullyReady();

      if (ready) {
        // Get fade duration (must be outside setTimeout to respect signal reactivity)
        const fadeDuration = this.fadeOutDuration();

        // Delay hiding until fade animation completes
        // Use setTimeout to allow CSS transition to play
        setTimeout(() => {
          this._isHidden.set(true);
        }, fadeDuration);
      } else {
        // Reset hidden state when not ready (e.g., during replay)
        this._isHidden.set(false);
      }
    });
  }
}
