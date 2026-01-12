/**
 * HeroLoadingComponent - Stunning SVG Animated Loading Overlay
 *
 * A premium, ngHive Academy branded loading animation featuring:
 * - Animated hexagonal logo with neon glow effects
 * - Orbiting particles around the logo
 * - Circular progress ring
 * - Glassmorphism backdrop
 * - Smooth fade out on completion
 *
 * @example
 * ```html
 * <app-hero-loading
 *   [progress]="preloadState.progress()"
 *   [isReady]="preloadState.isReady()"
 *   (loadingComplete)="onLoadingComplete()"
 * />
 * ```
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-hero-loading',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (!isHidden()) {
    <div
      class="loading-overlay fixed inset-0 z-50 flex flex-col items-center justify-center bg-background-dark"
      [class.fade-out]="isReady()"
      role="status"
      aria-live="polite"
      [attr.aria-busy]="!isReady()"
    >
      <!-- Animated Hexagon Logo Container -->
      <div class="logo-container relative w-40 h-40 mb-8">
        <!-- Outer Glow Ring -->
        <div class="glow-ring absolute inset-0 rounded-full"></div>

        <!-- Orbiting Particles -->
        <div class="orbital-particles absolute inset-0">
          <div class="particle particle-1"></div>
          <div class="particle particle-2"></div>
          <div class="particle particle-3"></div>
          <div class="particle particle-4"></div>
          <div class="particle particle-5"></div>
          <div class="particle particle-6"></div>
        </div>

        <!-- Hexagon SVG -->
        <svg
          class="hexagon-logo absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <!-- Definitions -->
          <defs>
            <!-- Neon Green Gradient -->
            <linearGradient
              id="neonGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#A1FF4F" />
              <stop offset="50%" stop-color="#4FFFDF" />
              <stop offset="100%" stop-color="#6366F1" />
            </linearGradient>

            <!-- Glow Filter -->
            <filter
              id="glowFilter"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <!-- Background Hexagon (dark) -->
          <polygon
            class="hex-bg"
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="rgba(99, 102, 241, 0.1)"
            stroke="rgba(99, 102, 241, 0.3)"
            stroke-width="1"
          />

          <!-- Animated Stroke Hexagon -->
          <polygon
            class="hex-stroke"
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            fill="none"
            stroke="url(#neonGradient)"
            stroke-width="2"
            filter="url(#glowFilter)"
          />

          <!-- Inner Honeycomb Pattern -->
          <g class="honeycomb" filter="url(#glowFilter)">
            <polygon
              class="hex-inner hex-inner-1"
              points="50,25 65,35 65,55 50,65 35,55 35,35"
              fill="none"
              stroke="#A1FF4F"
              stroke-width="1"
            />
            <polygon
              class="hex-inner hex-inner-2"
              points="50,30 60,37.5 60,52.5 50,60 40,52.5 40,37.5"
              fill="rgba(161, 255, 79, 0.1)"
              stroke="#4FFFDF"
              stroke-width="0.5"
            />
          </g>

          <!-- Center Dot (pulsing) -->
          <circle
            class="center-dot"
            cx="50"
            cy="50"
            r="4"
            fill="#A1FF4F"
            filter="url(#glowFilter)"
          />
        </svg>

        <!-- Progress Ring (circular) -->
        <svg
          class="progress-ring absolute inset-0 w-full h-full -rotate-90"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <circle
            class="progress-bg"
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            stroke-width="2"
          />
          <circle
            class="progress-bar"
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="url(#progressGradient)"
            stroke-width="2"
            stroke-linecap="round"
            [style.stroke-dasharray]="progressCircumference"
            [style.stroke-dashoffset]="progressOffset()"
          />
          <defs>
            <linearGradient
              id="progressGradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stop-color="#A1FF4F" />
              <stop offset="100%" stop-color="#4FFFDF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <!-- Brand Text -->
      <div class="brand-text text-center mb-6">
        <h2 class="text-2xl font-bold text-white mb-2">
          <span class="text-neon-green">ng</span
          ><span class="text-primary-400">Hive</span>
          <span class="text-white/80 font-normal">Academy</span>
        </h2>
        <p class="text-sm text-white/50 loading-text">Loading experience</p>
      </div>

      <!-- Progress Percentage -->
      <div class="progress-display flex items-center gap-3">
        <div class="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            class="h-full bg-gradient-to-r from-neon-green to-neon-blue rounded-full transition-all duration-300 ease-out"
            [style.width.%]="progress()"
          ></div>
        </div>
        <span class="text-sm font-mono text-neon-green min-w-[3rem] text-right">
          {{ progress() | number : '1.0-0' }}%
        </span>
      </div>

      <!-- Screen reader announcement -->
      <span class="sr-only">
        Loading {{ progress() | number : '1.0-0' }} percent complete
      </span>
    </div>
    }
  `,
  styles: [
    `
      :host {
        display: contents;
      }

      /* Screen reader only */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* ============================================
         STUNNING LOADING ANIMATION STYLES
         ============================================ */

      .loading-overlay {
        transition: opacity 0.6s ease-out, visibility 0.6s ease-out;
      }

      .loading-overlay.fade-out {
        opacity: 0;
        pointer-events: none;
      }

      /* Glow Ring */
      .glow-ring {
        background: radial-gradient(
          circle,
          rgba(161, 255, 79, 0.15) 0%,
          transparent 70%
        );
        animation: glow-pulse 2s ease-in-out infinite;
      }

      @keyframes glow-pulse {
        0%,
        100% {
          opacity: 0.5;
          transform: scale(1);
        }
        50% {
          opacity: 1;
          transform: scale(1.1);
        }
      }

      /* Orbital Particles */
      .orbital-particles {
        animation: orbit-container 20s linear infinite;
      }

      .particle {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #a1ff4f;
        box-shadow: 0 0 10px #a1ff4f, 0 0 20px #a1ff4f;
      }

      .particle-1 {
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        animation: particle-glow 1.5s ease-in-out infinite;
      }
      .particle-2 {
        top: 25%;
        right: 5%;
        background: #4fffdf;
        box-shadow: 0 0 10px #4fffdf, 0 0 20px #4fffdf;
        animation: particle-glow 1.5s ease-in-out infinite 0.25s;
      }
      .particle-3 {
        bottom: 25%;
        right: 5%;
        background: #6366f1;
        box-shadow: 0 0 10px #6366f1, 0 0 20px #6366f1;
        animation: particle-glow 1.5s ease-in-out infinite 0.5s;
      }
      .particle-4 {
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        animation: particle-glow 1.5s ease-in-out infinite 0.75s;
      }
      .particle-5 {
        bottom: 25%;
        left: 5%;
        background: #4fffdf;
        box-shadow: 0 0 10px #4fffdf, 0 0 20px #4fffdf;
        animation: particle-glow 1.5s ease-in-out infinite 1s;
      }
      .particle-6 {
        top: 25%;
        left: 5%;
        background: #6366f1;
        box-shadow: 0 0 10px #6366f1, 0 0 20px #6366f1;
        animation: particle-glow 1.5s ease-in-out infinite 1.25s;
      }

      @keyframes particle-glow {
        0%,
        100% {
          opacity: 0.4;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1.2);
        }
      }

      @keyframes orbit-container {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* Hexagon Stroke Animation */
      .hex-stroke {
        stroke-dasharray: 340;
        stroke-dashoffset: 340;
        animation: hex-draw 2s ease-out forwards,
          hex-glow 2s ease-in-out infinite 2s;
      }

      @keyframes hex-draw {
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes hex-glow {
        0%,
        100% {
          filter: url(#glowFilter) drop-shadow(0 0 5px rgba(161, 255, 79, 0.5));
        }
        50% {
          filter: url(#glowFilter) drop-shadow(0 0 15px rgba(161, 255, 79, 0.8));
        }
      }

      /* Inner Hexagons */
      .hex-inner-1 {
        stroke-dasharray: 180;
        stroke-dashoffset: 180;
        animation: hex-draw 1.5s ease-out 0.5s forwards;
      }

      .hex-inner-2 {
        opacity: 0;
        animation: fade-in-scale 0.8s ease-out 1s forwards;
      }

      @keyframes fade-in-scale {
        from {
          opacity: 0;
          transform: scale(0.8);
        }
        to {
          opacity: 1;
          transform: scale(1);
        }
      }

      /* Center Dot */
      .center-dot {
        animation: dot-pulse 1.5s ease-in-out infinite;
      }

      @keyframes dot-pulse {
        0%,
        100% {
          r: 4;
          opacity: 1;
        }
        50% {
          r: 6;
          opacity: 0.7;
        }
      }

      /* Progress Ring */
      .progress-bar {
        transition: stroke-dashoffset 0.3s ease-out;
      }

      /* Loading Text Animation */
      .loading-text {
        animation: text-pulse 2s ease-in-out infinite;
      }

      @keyframes text-pulse {
        0%,
        100% {
          opacity: 0.5;
        }
        50% {
          opacity: 1;
        }
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .loading-overlay,
        .glow-ring,
        .orbital-particles,
        .particle,
        .hex-stroke,
        .hex-inner-1,
        .hex-inner-2,
        .center-dot,
        .loading-text {
          animation: none !important;
          transition: none !important;
        }

        .hex-stroke,
        .hex-inner-1 {
          stroke-dashoffset: 0;
        }

        .hex-inner-2 {
          opacity: 1;
        }
      }
    `,
  ],
})
export class HeroLoadingComponent {
  // ================================
  // Inputs
  // ================================

  /** Loading progress (0-100) */
  public readonly progress = input.required<number>();

  /** Whether loading is complete */
  public readonly isReady = input.required<boolean>();

  // ================================
  // Outputs
  // ================================

  /** Emitted when loading overlay has finished fading out */
  public readonly loadingComplete = output<void>();

  // ================================
  // Internal State
  // ================================

  /** Whether the loading overlay should be completely hidden from DOM */
  protected readonly isHidden = signal(false);

  /** Progress ring circumference (2 * PI * radius where radius = 46) */
  protected readonly progressCircumference = 2 * Math.PI * 46;

  /** Progress ring offset computed from progress percentage */
  protected readonly progressOffset = computed(() => {
    const progress = this.progress();
    return this.progressCircumference * (1 - progress / 100);
  });

  // ================================
  // Constructor
  // ================================

  public constructor() {
    // Effect: Hide loading overlay after fade animation completes
    effect(() => {
      const ready = this.isReady();
      if (ready) {
        // Wait for CSS fade transition (600ms) before removing from DOM
        setTimeout(() => {
          this.isHidden.set(true);
          this.loadingComplete.emit();
        }, 700);
      }
    });
  }
}
