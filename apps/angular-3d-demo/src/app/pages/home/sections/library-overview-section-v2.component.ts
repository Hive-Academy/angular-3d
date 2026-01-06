import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  FeatureShowcaseTimelineComponent,
  FeatureStepComponent,
  FeatureBadgeDirective,
  FeatureTitleDirective,
  FeatureDescriptionDirective,
  FeatureNotesDirective,
  FeatureVisualDirective,
  FeatureDecorationDirective,
  ViewportAnimationDirective,
} from '@hive-academy/angular-gsap';
import { DecorativePatternComponent } from '../../../shared/components/decorative-pattern.component';
import type { TimelineStep } from '../../../shared/types/timeline-step.interface';

/**
 * Library Overview Section V2 - Unified Library Showcase
 *
 * Showcases both libraries with the FeatureShowcaseTimeline design:
 * - @hive-academy/angular-3d (3D Visualization)
 * - @hive-academy/angular-gsap (Scroll Animations)
 *
 * Design Pattern: Feature Showcase Timeline with Pre-Made Components
 * - Uses agsp-feature-showcase-timeline for container theming
 * - Uses agsp-feature-step for individual steps with built-in pinning & animations
 */
@Component({
  selector: 'app-library-overview-section-v2',
  imports: [
    CommonModule,
    NgOptimizedImage,
    RouterLink,
    FeatureShowcaseTimelineComponent,
    FeatureStepComponent,
    FeatureBadgeDirective,
    FeatureTitleDirective,
    FeatureDescriptionDirective,
    FeatureNotesDirective,
    FeatureVisualDirective,
    FeatureDecorationDirective,
    ViewportAnimationDirective,
    DecorativePatternComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <agsp-feature-showcase-timeline [colorTheme]="'emerald'">
      <!-- Hero Section -->
      <div
        featureHero
        class="relative text-center py-16 flex flex-col justify-center"
      >
        <!-- Hero Content -->
        <div class="relative z-10">
          <!-- Layer Badge -->
          <div
            class="inline-block"
            viewportAnimation
            [viewportConfig]="{
              animation: 'scaleIn',
              duration: 0.6,
              threshold: 0.3
            }"
          >
            <span
              class="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-full text-sm font-semibold text-emerald-300 mb-6 backdrop-blur-sm"
            >
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fill-rule="evenodd"
                  d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                  clip-rule="evenodd"
                />
              </svg>
              HIVE ACADEMY LIBRARIES
            </span>
          </div>

          <!-- Main Headline -->
          <h2
            class="text-7xl font-bold text-white mb-6 leading-tight"
            viewportAnimation
            [viewportConfig]="{
              animation: 'slideUp',
              duration: 0.8,
              delay: 0.1,
              threshold: 0.2
            }"
          >
            <span
              class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent"
            >
              Angular Libraries
            </span>
          </h2>

          <!-- Subtitle -->
          <p
            class="text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto"
            viewportAnimation
            [viewportConfig]="{
              animation: 'fadeIn',
              duration: 0.8,
              delay: 0.2,
              threshold: 0.2
            }"
          >
            Production-ready Angular packages for building immersive web
            experiences.
            <span class="block mt-2 text-emerald-400 font-semibold">
              3D Visualization & Scroll-Driven Animations
            </span>
          </p>

          <!-- Floating Metrics -->
          <div
            class="flex justify-center gap-12 mt-12"
            viewportAnimation
            [viewportConfig]="{
              animation: 'slideUp',
              duration: 0.8,
              delay: 0.3,
              threshold: 0.2
            }"
          >
            <div class="text-center">
              <div class="text-4xl font-bold text-emerald-400 mb-2">
                2 Packages
              </div>
              <div class="text-sm text-gray-400 uppercase tracking-wide">
                Angular Libraries
              </div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-cyan-400 mb-2">30+</div>
              <div class="text-sm text-gray-400 uppercase tracking-wide">
                Components
              </div>
            </div>
            <div class="text-center">
              <div class="text-4xl font-bold text-teal-400 mb-2">
                Signal-Based
              </div>
              <div class="text-sm text-gray-400 uppercase tracking-wide">
                Reactive State
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Steps - Library Overview -->
      @for (step of librarySteps(); track step.id; let i = $index) {
      <agsp-feature-step
        [layout]="step.layout === 'left' ? 'left' : 'right'"
        [stepNumber]="step.step"
        [pinDuration]="'400px'"
        [pinStart]="'top 15%'"
      >
        <!-- Decorations -->
        <div
          featureDecoration
          class="w-full h-full"
          [class.text-emerald-400]="i === 0"
          [class.text-cyan-400]="i === 1"
        >
          @if (i === 0) {
          <app-decorative-pattern [pattern]="'network-nodes'" />
          } @else if (i === 1) {
          <app-decorative-pattern [pattern]="'data-flow'" />
          }
        </div>

        <!-- Step Badge -->
        <span
          featureBadge
          class="flex items-center justify-center w-14 h-14 rounded-full text-white font-bold text-xl shadow-lg"
          [class.bg-gradient-to-br]="true"
          [class.from-emerald-500]="i === 0"
          [class.to-cyan-600]="i === 0"
          [class.from-cyan-500]="i === 1"
          [class.to-teal-600]="i === 1"
          [class.shadow-emerald-500/30]="i === 0"
          [class.shadow-cyan-500/30]="i === 1"
        >
          {{ step.step }}
        </span>

        <!-- Title -->
        <h3
          featureTitle
          class="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight"
        >
          {{ step.title }}
        </h3>

        <!-- Description -->
        <p
          featureDescription
          class="text-lg text-gray-300 leading-relaxed mb-8"
        >
          {{ step.description }}
        </p>

        <!-- Notes -->
        <div featureNotes class="space-y-4">
          @for (note of step.notes; track $index) {
          <div class="flex items-start gap-3">
            <svg
              class="w-5 h-5 mt-0.5 flex-shrink-0"
              [class.text-emerald-400]="i === 0"
              [class.text-cyan-400]="i === 1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p class="text-sm text-gray-400">{{ note }}</p>
          </div>
          }

          <!-- CTA Button -->
          <div class="pt-6">
            <a
              [routerLink]="step.ctaLink"
              class="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105"
              [class.bg-gradient-to-r]="true"
              [class.from-emerald-500]="i === 0"
              [class.to-cyan-500]="i === 0"
              [class.from-cyan-500]="i === 1"
              [class.to-teal-500]="i === 1"
              [class.text-white]="true"
              [class.shadow-lg]="true"
              [class.shadow-emerald-500/30]="i === 0"
              [class.shadow-cyan-500/30]="i === 1"
            >
              {{ step.ctaText }}
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </a>
          </div>
        </div>

        <!-- Visual -->
        <div featureVisual class="relative group overflow-hidden rounded-2xl">
          <!-- Glow backdrop -->
          <div
            class="absolute inset-0 rounded-3xl blur-2xl scale-110 group-hover:scale-115 transition-transform duration-500"
            [class.bg-gradient-to-br]="true"
            [class.from-emerald-500/20]="i === 0"
            [class.to-cyan-500/20]="i === 0"
            [class.from-cyan-500/20]="i === 1"
            [class.to-teal-500/20]="i === 1"
          ></div>
          <div
            class="relative aspect-[4/3] w-[110%] rounded-2xl overflow-hidden shadow-2xl"
            [class.ml-auto]="step.layout === 'left'"
            [class.mr-auto]="step.layout === 'right'"
            [class.shadow-emerald-500/20]="i === 0"
            [class.shadow-cyan-500/20]="i === 1"
          >
            <img
              [ngSrc]="step.code"
              [alt]="step.title"
              fill
              class="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <!-- Subtle overlay gradient -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none"
            ></div>
          </div>
        </div>
      </agsp-feature-step>
      }

      <!-- Footer Section - Ecosystem Overview -->
      <div featureFooter class="py-16">
        <div class="max-w-5xl mx-auto">
          <h3
            class="text-3xl font-bold text-center text-white mb-10"
            viewportAnimation
            [viewportConfig]="{
              animation: 'slideUp',
              duration: 0.6,
              threshold: 0.3
            }"
          >
            Built for Modern Angular
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            @for (feature of ecosystemFeatures(); track feature.name) {
            <div
              class="bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
            >
              <div class="text-4xl mb-3">{{ feature.icon }}</div>
              <h4 class="text-lg font-bold text-white mb-2">
                {{ feature.name }}
              </h4>
              <p class="text-sm text-gray-400">
                {{ feature.description }}
              </p>
            </div>
            }
          </div>
        </div>
      </div>
    </agsp-feature-showcase-timeline>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class LibraryOverviewSectionV2Component {
  /**
   * Library overview steps - showcasing both Angular 3D and Angular GSAP
   */
  public readonly librarySteps = signal<
    (TimelineStep & { ctaText: string; ctaLink: string })[]
  >([
    {
      id: 'angular-3d',
      step: 1,
      title: 'Angular 3D - Immersive 3D Experiences',
      description:
        'Pure Angular wrapper for Three.js. Create stunning 3D scenes using declarative components, not imperative code. Signal-based reactivity with automatic resource cleanup and SSR compatibility.',
      code: 'images/showcase/angular-3d-hero.png',
      language: 'image',
      layout: 'left',
      notes: [
        '27+ Ready-to-use 3D primitives',
        'GLTF/GLB model loading with animations',
        'Post-processing effects & bloom',
        'Signal-based state management',
        'Animation directives (float, rotate, mouse tracking)',
        'Full Three.js access when needed',
      ],
      ctaText: 'Explore Angular 3D',
      ctaLink: '/angular-3d',
    },
    {
      id: 'angular-gsap',
      step: 2,
      title: 'Angular GSAP - Scroll-Driven Animations',
      description:
        'Signal-based GSAP directives for Angular. Create stunning scroll animations, hijacked scroll sections, and timeline orchestration with SSR compatibility and automatic cleanup.',
      code: 'images/showcase/angular-gsap-hero.png',
      language: 'image',
      layout: 'right',
      notes: [
        'ScrollTrigger integration out of the box',
        'Hijacked scroll sections with pinning',
        'Timeline orchestration & sequencing',
        'Viewport animation directives',
        'Feature showcase components',
        '60% less code vs manual GSAP setup',
      ],
      ctaText: 'View Animations',
      ctaLink: '/angular-gsap',
    },
  ]);

  /**
   * Ecosystem features - shared benefits of both libraries
   */
  public readonly ecosystemFeatures = signal([
    {
      icon: '⚡',
      name: 'Signal-Based',
      description:
        'Both libraries use Angular signals for reactive state management and optimal change detection.',
    },
    {
      icon: '🚀',
      name: 'SSR Compatible',
      description:
        'Server-side rendering ready with platform detection and graceful fallbacks.',
    },
    {
      icon: '🎯',
      name: 'TypeScript First',
      description:
        'Full type safety with comprehensive TypeScript definitions and IntelliSense support.',
    },
  ]);
}
