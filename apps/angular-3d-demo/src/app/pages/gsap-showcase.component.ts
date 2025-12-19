import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-gsap-showcase',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- GSAP Hero -->
    <section
      class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-purple-600"
    >
      <div class="text-center text-white px-4x">
        <h1 class="text-display-xl font-bold mb-4x">Angular GSAP</h1>
        <p class="text-headline-md opacity-90">
          Scroll-driven animations for Angular
        </p>
      </div>
    </section>

    <!-- TODO: TASK_2025_012 - Add GSAP components here -->
    <!-- Placeholder sections - will be replaced with actual GSAP components -->

    <section class="py-16x bg-background-light">
      <div class="max-w-container mx-auto px-4x text-center">
        <h2 class="text-display-lg mb-8x font-bold">
          <span class="text-primary-500">Coming Soon:</span> GSAP Showcase
        </h2>
        <p class="text-headline-md text-text-secondary mb-8x">
          This page will showcase GSAP animations when TASK_2025_012 completes
          migration
        </p>

        <div
          class="bg-white rounded-card shadow-card p-8x max-w-content mx-auto"
        >
          <h3 class="text-headline-lg font-bold mb-4x">
            Components to be added:
          </h3>
          <ul class="text-left space-y-2x text-body-lg text-text-secondary">
            <li>✓ ScrollAnimationDirective demos</li>
            <li>✓ HijackedScrollTimeline component</li>
            <li>✓ ChromaDB section with scroll animations</li>
            <li>✓ Neo4j section with graph animations</li>
            <li>✓ Problem-Solution timeline</li>
          </ul>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-background-dark text-white py-20x text-center">
      <h2 class="text-display-lg mb-8x">Ready to Animate?</h2>
      <code
        class="inline-block bg-background-dark/80 border border-neon-green/30 px-6x py-3x rounded-lg text-neon-green font-mono"
      >
        npm install &#64;hive-academy/angular-gsap
      </code>

      <div class="mt-8x flex gap-4x justify-center">
        <button
          class="px-8x py-4x bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 transition-transform"
        >
          View Docs
        </button>
        <a
          href="https://github.com/hive-academy/angular-gsap"
          target="_blank"
          rel="noopener noreferrer"
          class="px-8x py-4x border-2 border-white text-white rounded-button font-semibold hover:bg-white hover:text-background-dark transition-all"
        >
          GitHub
        </a>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class GsapShowcaseComponent {}
