import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';
import { Angular3dSectionComponent } from './sections/angular-3d-section.component';
import { AngularGsapSectionComponent } from './sections/angular-gsap-section.component';
import { ProblemSolutionSectionComponent } from './sections/problem-solution-section.component';
import { ValuePropositionsSectionComponent } from './sections/value-propositions-section.component';

@Component({
  selector: 'app-gsap-showcase',
  imports: [
    NgOptimizedImage,
    ScrollAnimationDirective,
    Angular3dSectionComponent,
    AngularGsapSectionComponent,
    ProblemSolutionSectionComponent,
    ValuePropositionsSectionComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- GSAP Hero with Parallax Backgrounds -->
    <section
      class="relative min-h-screen flex items-center justify-center overflow-hidden"
    >
      <!-- Background Layer 1 - Smooth Parallax (Back) -->
      <div
        class="absolute inset-0 w-full h-full min-h-screen"
        scrollAnimation
        [scrollConfig]="{
          animation: 'parallax',
          speed: 0.3,
          scrub: 1.5,
          start: '-10% top',
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

      <!-- Gradient Overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-b from-background-dark/100 via-transparent to-background-dark/100"
      ></div>

      <!-- Hero Content - Scroll Up & Fade Effect -->
      <div
        class="relative z-10 text-center text-white px-4 sm:px-6 md:px-8 max-w-5xl mx-auto mt-20 hero-content"
        scrollAnimation
        [scrollConfig]="{
          animation: 'custom',
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
          from: { opacity: 1, y: 0 },
          to: { opacity: 0, y: -150 }
        }"
      >
        <!-- Badge -->
        <div
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            duration: 1,
            delay: 0.2
          }"
          class="pt-8"
        >
          <span
            class="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 backdrop-blur-md rounded-full text-xs sm:text-sm font-medium border border-white/10 shadow-lg"
          >
            <span class="relative flex h-2 w-2 sm:h-3 sm:w-3">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-green opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-neon-green"
              ></span>
            </span>
            <span class="text-white/90">Angular + GSAP ScrollTrigger</span>
          </span>
        </div>

        <!-- Main Title - Reduced by 2 scale steps with responsive sizing -->
        <h1
          class="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 leading-none tracking-tight"
          scrollAnimation
          [scrollConfig]="{
            animation: 'custom',
            start: 'top 80%',
            end: 'top 20%',
            scrub: 0.5,
            from: { opacity: 0, scale: 0.9, y: 60 },
            to: { opacity: 1, scale: 1, y: 0 }
          }"
        >
          <span
            class="block bg-gradient-to-r p-4 from-white via-white to-white/80 bg-clip-text text-transparent drop-shadow-2xl"
          >
            Angular
          </span>
          <span
            class="block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent"
          >
            GSAP
          </span>
        </h1>

        <!-- Subtitle - Reduced by 2 scale steps -->
        <p
          class="text-base font-medium sm:text-lg md:text-xl text-white/70 max-w-3xl mx-auto mb-4 sm:mb-6 leading-relaxed font-light"
          scrollAnimation
          [scrollConfig]="{
            animation: 'slideUp',
            duration: 0.8,
            delay: 0.4
          }"
        >
          Create stunning scroll-driven animations with declarative directives.
        </p>

        <!-- Feature Pills - Responsive sizing -->
        <div
          class="flex flex-wrap gap-2 sm:gap-3 justify-center mb-8 sm:mb-12"
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            duration: 0.6,
            delay: 0.5
          }"
        >
          <span
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-cyan-500/20 text-cyan-300 rounded-full text-xs sm:text-sm font-semibold border border-cyan-500/30"
          >
            10+ Built-in Effects
          </span>
          <span
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-500/20 text-purple-300 rounded-full text-xs sm:text-sm font-semibold border border-purple-500/30"
          >
            SSR-Safe
          </span>
          <span
            class="px-3 sm:px-4 py-1.5 sm:py-2 bg-pink-500/20 text-pink-300 rounded-full text-xs sm:text-sm font-semibold border border-pink-500/30"
          >
            TypeScript-First
          </span>
        </div>

        <!-- CTA Buttons - Responsive sizing -->
        <div
          class="flex flex-wrap gap-4 sm:gap-6 justify-center mb-12 sm:mb-16"
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            duration: 0.8,
            delay: 0.6
          }"
        >
          <button
            class="group relative px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-neon-green to-emerald-400 text-background-dark rounded-full font-bold text-sm sm:text-base md:text-lg hover:scale-105 transition-all duration-300 shadow-xl shadow-neon-green/30"
          >
            <span class="relative z-10">Get Started</span>
            <div
              class="absolute inset-0 rounded-full bg-gradient-to-r from-neon-green to-emerald-400 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
            ></div>
          </button>
          <a
            href="#features"
            class="px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-white/5 backdrop-blur-md text-white rounded-full font-bold text-sm sm:text-base md:text-lg border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all duration-300"
          >
            See Examples
          </a>
        </div>

        <!-- Scroll Indicator - Enhanced fade out -->
        <div
          class="flex flex-col items-center gap-2 sm:gap-3 text-white/50"
          scrollAnimation
          [scrollConfig]="{
            animation: 'custom',
            start: 'top top',
            end: 'top -150',
            scrub: 1,
            from: { opacity: 1, y: 0 },
            to: { opacity: 0, y: 30 }
          }"
        >
          <span class="text-xs sm:text-sm font-medium tracking-widest uppercase"
            >Scroll to explore</span
          >
          <div
            class="w-5 h-8 sm:w-6 sm:h-10 border-2 border-white/30 rounded-full flex justify-center pt-1.5 sm:pt-2"
          >
            <div
              class="w-1 h-2.5 sm:w-1.5 sm:h-3 bg-white/50 rounded-full animate-bounce"
            ></div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problem/Solution Section -->
    <app-problem-solution-section />

    <!-- Angular 3D Section (Option A - Dark Theme + Oversized Images) -->
    <app-angular-3d-section />

    <!-- Angular GSAP Section (Option C - Parallax Split-Screen) -->
    <app-angular-gsap-section />

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
