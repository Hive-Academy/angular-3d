import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-cta-section',
  imports: [],
  template: `
    <section
      class="relative w-full px-4x bg-background-dark overflow-hidden min-h-screen py-30 flex "
    >
      <!-- Content -->
      <div class="relative z-10 max-w-content mx-auto text-center min-h-[70vh]">
        <h2 class="text-display-lg font-bold text-white mb-4x">
          Ready to Build?
        </h2>

        <p class="text-headline-md text-text-secondary mb-8x">
          Install both libraries and start creating stunning Angular
          applications today
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-wrap gap-4x justify-center mb-8x">
          <button
            class="px-10x py-4x bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 hover:shadow-neon-green transition-all duration-250"
          >
            Get Started
          </button>
          <button
            class="px-10x py-4x border-2 border-white text-white rounded-button font-semibold hover:bg-white hover:text-background-dark transition-all duration-250"
          >
            View Documentation
          </button>
        </div>

        <!-- Install Command -->
        <div
          class="inline-block bg-background-dark/80 border border-neon-green/30 px-6x py-3x rounded-lg relative group"
        >
          <code class="text-neon-green font-mono text-body-md">
            npm install &#64;hive-academy/angular-3d
            &#64;hive-academy/angular-gsap
          </code>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSectionComponent {}
