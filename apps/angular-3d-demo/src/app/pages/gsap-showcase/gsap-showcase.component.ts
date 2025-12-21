import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';
import { ChromadbSectionComponent } from './sections/chromadb-section.component';
import { Neo4jSectionComponent } from './sections/neo4j-section.component';
import { ProblemSolutionSectionComponent } from './sections/problem-solution-section.component';
import { ValuePropositionsSectionComponent } from './sections/value-propositions-section.component';

@Component({
  selector: 'app-gsap-showcase',
  imports: [
    NgOptimizedImage,
    ScrollAnimationDirective,
    ChromadbSectionComponent,
    Neo4jSectionComponent,
    ProblemSolutionSectionComponent,
    ValuePropositionsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- GSAP Hero with Parallax Backgrounds -->
    <section
      class="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <!-- Background Layer 1 - Slow Parallax (Back) -->
      <div
        class="absolute inset-0 w-full h-full"
        scrollAnimation
        [scrollConfig]="{
          animation: 'parallax',
          speed: 0.3,
          scrub: true,
          start: 'top top',
          end: 'bottom top'
        }"
      >
        <img
          ngSrc="images/showcase/hero-bg-back.png"
          alt=""
          fill
          priority
          class="object-cover scale-110"
        />
      </div>

      <!-- Background Layer 2 - Fast Parallax (Front) -->
      <div
        class="absolute inset-0 w-full h-full"
        scrollAnimation
        [scrollConfig]="{
          animation: 'parallax',
          speed: 0.6,
          scrub: true,
          start: 'top top',
          end: 'bottom top'
        }"
      >
        <img
          ngSrc="images/showcase/hero-bg-front.png"
          alt=""
          fill
          class="object-cover mix-blend-screen opacity-70"
        />
      </div>

      <!-- Gradient Overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-dark/80"
      ></div>

      <!-- Hero Content -->
      <div class="relative z-10 text-center text-white px-8">
        <!-- Badge -->
        <div
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            duration: 1,
            delay: 0.2
          }"
        >
          <span
            class="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6 border border-white/20"
          >
            <span
              class="w-2 h-2 rounded-full bg-neon-green animate-pulse"
            ></span>
            Angular + GSAP ScrollTrigger
          </span>
        </div>

        <!-- Main Title with Scale Animation -->
        <h1
          class="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent"
          scrollAnimation
          [scrollConfig]="{
            animation: 'custom',
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5,
            from: { opacity: 0, scale: 0.8, y: 50 },
            to: { opacity: 1, scale: 1, y: 0 }
          }"
        >
          Angular GSAP
        </h1>

        <!-- Subtitle -->
        <p
          class="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto mb-8"
          scrollAnimation
          [scrollConfig]="{
            animation: 'slideUp',
            duration: 0.8,
            delay: 0.4
          }"
        >
          Create stunning scroll-driven animations with declarative directives.
          <span class="block mt-2 text-cyan-300 font-semibold">
            10+ built-in effects • SSR-safe • TypeScript-first
          </span>
        </p>

        <!-- CTA Buttons -->
        <div
          class="flex flex-wrap gap-4 justify-center"
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            duration: 0.8,
            delay: 0.6
          }"
        >
          <button
            class="px-8 py-4 bg-neon-green text-background-dark rounded-full font-semibold hover:scale-105 transition-transform shadow-lg shadow-neon-green/20"
          >
            Get Started
          </button>
          <a
            href="#features"
            class="px-8 py-4 border-2 border-white/30 text-white rounded-full font-semibold hover:bg-white/10 transition-all backdrop-blur-sm"
          >
            See Examples
          </a>
        </div>

        <!-- Scroll Indicator -->
        <div
          class="absolute bottom-8 left-1/2 -translate-x-1/2"
          scrollAnimation
          [scrollConfig]="{
            animation: 'custom',
            start: 'top top',
            end: 'top -100',
            scrub: true,
            from: { opacity: 1, y: 0 },
            to: { opacity: 0, y: 20 }
          }"
        >
          <div class="flex flex-col items-center gap-2 text-white/60">
            <span class="text-sm">Scroll to explore</span>
            <svg
              class="w-6 h-6 animate-bounce"
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
      </div>
    </section>

    <!-- Problem/Solution Section -->
    <app-problem-solution-section />

    <!-- ChromaDB Section (Angular 3D) -->
    <app-chromadb-section />

    <!-- Neo4j Section (Angular GSAP) -->
    <app-neo4j-section />

    <!-- Value Propositions Section -->
    <app-value-propositions-section />

    <!-- CTA Section -->
    <section class="bg-background-dark text-white py-24 text-center">
      <h2
        class="text-5xl md:text-6xl font-bold mb-8"
        scrollAnimation
        [scrollConfig]="{
          animation: 'slideUp',
          start: 'top 80%',
          duration: 0.8
        }"
      >
        Ready to Animate?
      </h2>
      <code
        class="inline-block bg-background-dark/80 border border-neon-green/30 px-6 py-3 rounded-lg text-neon-green font-mono mb-8"
        scrollAnimation
        [scrollConfig]="{
          animation: 'scaleIn',
          start: 'top 75%',
          duration: 0.6,
          delay: 0.2
        }"
      >
        npm install &#64;hive-academy/angular-gsap
      </code>

      <div
        class="mt-8 flex gap-4 justify-center"
        scrollAnimation
        [scrollConfig]="{
          animation: 'fadeIn',
          start: 'top 70%',
          duration: 0.6,
          delay: 0.4
        }"
      >
        <button
          class="px-8 py-4 bg-neon-green text-background-dark rounded-full font-semibold hover:scale-105 transition-transform"
        >
          View Docs
        </button>
        <a
          href="https://github.com/hive-academy/angular-gsap"
          target="_blank"
          rel="noopener noreferrer"
          class="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white hover:text-background-dark transition-all"
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

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
      }

      .animate-pulse {
        animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }

      @keyframes bounce {
        0%,
        100% {
          transform: translateY(-25%);
          animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
        }
        50% {
          transform: translateY(0);
          animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
        }
      }

      .animate-bounce {
        animation: bounce 1s infinite;
      }
    `,
  ],
})
export class GsapShowcaseComponent {}
