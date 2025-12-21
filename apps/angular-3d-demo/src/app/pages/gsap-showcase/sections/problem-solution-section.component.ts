import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

/**
 * Problem/Solution Section - Enhanced Visual Design
 * Establishes pain points developers face when building 3D and animated Angular apps
 * Positions solution with 4 proof metrics using enhanced visual components
 */
@Component({
  selector: 'app-problem-solution-section',
  imports: [CommonModule, ScrollAnimationDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="relative m-h-screen p-16 bg-white overflow-hidden flex items-center"
    >
      <!-- Gradient Background (Initially hidden, fades in with solution) -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-accent-primary/5 via-accent-secondary/5 to-accent-success/5"
        scrollAnimation
        [scrollConfig]="{
          animation: 'fadeIn',
          start: 'top 50%',
          duration: 1.5,
          once: false
        }"
      ></div>

      <!-- Subtle decorative blur circles -->
      <div
        class="absolute -top-40 -right-40 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute -bottom-40 -left-40 w-96 h-96 bg-accent-success/10 rounded-full blur-3xl"
      ></div>

      <div class="relative max-w-6xl mx-auto w-full space-y-16">
        <!-- Problem Section - Fades in first, then fades out -->
        <div
          class="text-center"
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            start: 'top 80%',
            end: 'top 30%',
            scrub: true,
            once: false
          }"
        >
          <h2
            class="text-4xl md:text-5xl font-bold text-text-headline mb-6 leading-tight"
          >
            The Challenge
          </h2>
          <p
            class="text-xl md:text-2xl text-text-secondary max-w-4xl mx-auto leading-relaxed mb-8"
          >
            Angular developers want immersive 3D experiences and scroll-driven
            animations without the steep learning curve of Three.js and GSAP.
            Existing wrappers are outdated, lack proper typing, or don't follow
            Angular patterns.
          </p>

          <!-- Problem bullets - minimal style -->
          <div
            class="flex flex-wrap justify-center gap-6 text-lg text-text-secondary"
          >
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent-danger"></span>
              Complex Three.js setup
            </span>
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent-danger"></span>
              Manual lifecycle management
            </span>
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-accent-danger"></span>
              No Angular patterns
            </span>
          </div>
        </div>

        <!-- Divider Line with Icon - appears between problem and solution -->
        <div
          class="flex items-center justify-center"
          scrollAnimation
          [scrollConfig]="{
            animation: 'scaleIn',
            start: 'top 60%',
            duration: 0.8,
            once: false
          }"
        >
          <div
            class="h-px bg-gradient-to-r from-transparent via-accent-primary/30 to-transparent w-full max-w-2xl"
          ></div>
          <div
            class="absolute w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-card-elevated"
          >
            <span class="text-3xl">⚡</span>
          </div>
        </div>

        <!-- Solution Section - Fades in as problem fades out -->
        <div
          class="text-center"
          scrollAnimation
          [scrollConfig]="{
            animation: 'fadeIn',
            start: 'top 50%',
            duration: 1.2,
            once: false
          }"
        >
          <h2
            class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-success bg-clip-text text-transparent mb-6 leading-tight"
          >
            Our Solution
          </h2>
          <h3 class="text-4xl md:text-5xl font-bold text-text-headline mb-6">
            Angular-First 3D & Animation Libraries
          </h3>
          <p
            class="text-xl md:text-2xl text-text-primary max-w-4xl mx-auto leading-relaxed mb-8"
          >
            Declarative components for Three.js and GSAP that feel native to
            Angular. Signal-based reactivity, OnPush change detection, SSR-safe,
            and full TypeScript support out of the box.
          </p>

          <!-- Tech stack - minimal badges -->
          <div
            class="flex flex-wrap justify-center gap-4 text-base font-medium"
          >
            <span class="text-accent-primary">@hive-academy/angular-3d</span>
            <span class="text-text-secondary">•</span>
            <span class="text-accent-secondary"
              >@hive-academy/angular-gsap</span
            >
            <span class="text-text-secondary">•</span>
            <span class="text-accent-success">Angular 20+</span>
          </div>
        </div>

        <!-- Stats Grid - Minimal, no cards, just numbers on gradient background -->
        <div
          class="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 max-w-5xl mx-auto pt-8"
        >
          @for (metric of metrics; track $index) {
          <div
            class="text-center"
            scrollAnimation
            [scrollConfig]="{
              animation: 'slideUp',
              start: 'top 80%',
              duration: 0.6,
              delay: $index * 0.15,
              ease: 'back.out',
              once: false
            }"
          >
            <!-- Large number with gradient -->
            <div
              class="text-5xl md:text-6xl font-bold bg-gradient-to-br from-accent-primary to-accent-secondary bg-clip-text text-transparent mb-2"
            >
              {{ metric.value }}
            </div>
            <!-- Label -->
            <div
              class="text-sm md:text-base font-semibold text-text-headline mb-1"
            >
              {{ metric.label }}
            </div>
            <!-- Description -->
            <div class="text-xs md:text-sm text-text-secondary leading-snug">
              {{ metric.description }}
            </div>
          </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: [],
})
export class ProblemSolutionSectionComponent {
  public readonly metrics = [
    {
      value: '10+',
      label: '3D Primitives',
      description: 'Box, Sphere, Torus, GLTF, StarField & more',
    },
    {
      value: '10+',
      label: 'Animations',
      description: 'Fade, slide, scale, parallax, hijacked scroll',
    },
    {
      value: '100%',
      label: 'Type Safe',
      description: 'Full TypeScript support with IntelliSense',
    },
    {
      value: 'SSR',
      label: 'Safe',
      description: 'Works with Angular Universal out of the box',
    },
  ];
}
