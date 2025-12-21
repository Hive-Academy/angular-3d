import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChromadbSectionComponent } from './sections/chromadb-section.component';
import { Neo4jSectionComponent } from './sections/neo4j-section.component';

@Component({
  selector: 'app-gsap-showcase',
  imports: [ChromadbSectionComponent, Neo4jSectionComponent],
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

    <!-- ChromaDB Section -->
    <app-chromadb-section />

    <!-- Neo4j Section -->
    <app-neo4j-section />

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
