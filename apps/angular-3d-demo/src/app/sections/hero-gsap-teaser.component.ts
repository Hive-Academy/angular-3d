import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-hero-gsap-teaser',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="h-screen flex flex-col items-center justify-center p-8x bg-gradient-to-br from-white to-primary-50"
    >
      <!-- Placeholder for GSAP animations -->
      <!-- TODO: Add scrollAnimation directive when TASK_2025_012 completes -->

      <h2 class="text-display-md font-bold text-primary-500 mb-4x">
        Scroll Animations
      </h2>

      <p class="text-headline-md text-text-secondary mb-8x">Built with GSAP</p>

      <div
        class="bg-background-dark p-4x rounded-lg border border-primary-500/30"
      >
        <code class="text-neon-green font-mono text-body-sm">
          &lt;div scrollAnimation&gt;...&lt;/div&gt;
        </code>
      </div>

      <div class="mt-12x animate-bounce">
        <svg
          class="w-6 h-6 text-primary-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>
  `,
})
export class HeroGsapTeaserComponent {}
