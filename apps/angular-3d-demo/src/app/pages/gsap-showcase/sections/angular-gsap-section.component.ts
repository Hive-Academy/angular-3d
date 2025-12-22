import { CommonModule, NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';
import { DecorativePatternComponent } from '../../../shared/components/decorative-pattern.component';
import type { TimelineStep } from '../../../shared/types/timeline-step.interface';

/**
 * Angular GSAP Section - Scroll Animation Library Showcase
 *
 * Design Pattern: 50/50 Split-Screen with Parallax
 * - Dark theme matching Angular 3D section
 * - 50/50 grid layout with image on one side, text on other
 * - Alternating layout per step (left/right)
 * - Parallax effect on images
 * - Animated text content with scroll triggers
 * - Emerald/Cyan accents (distinct from Angular 3D's indigo/purple)
 */
@Component({
  selector: 'app-angular-gsap-section',
  imports: [
    CommonModule,
    DecorativePatternComponent,
    ScrollAnimationDirective,
    NgOptimizedImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Dark themed section matching Angular 3D -->
    <div
      class="relative w-full bg-gradient-to-b from-slate-900 via-emerald-950/30 to-slate-900 overflow-hidden"
    >
      <!-- Ambient glow effects - Emerald/Cyan theme -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          class="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"
        ></div>
        <div
          class="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px]"
        ></div>
      </div>

      <!-- Content Container -->
      <div class="container mx-auto px-8 py-12 relative z-10">
        <!-- Section Hero - Dark Theme -->
        <div
          class="relative text-center py-16 flex flex-col justify-center"
          scrollAnimation
          [scrollConfig]="{
            animation: 'custom',
            start: 'top top',
            end: '+=4000',
            scrub: 0.5,
            from: { scale: 1, y: 0 },
            to: { scale: 0.8, y: -20, opacity: 0.6 }
          }"
        >
          <!-- Decorative Pattern -->
          <div
            class="absolute inset-0 flex items-center justify-end pointer-events-none"
            scrollAnimation
            [scrollConfig]="{
              animation: 'custom',
              start: 'top 90%',
              end: 'bottom 30%',
              scrub: 0.5,
              from: { scale: 0.6, opacity: 0, rotation: -20, y: 50 },
              to: { scale: 1, opacity: 0.4, rotation: 0, y: -50 }
            }"
          >
            <div class="w-[800px] h-[800px] text-emerald-400/30 pt-18">
              <app-decorative-pattern [pattern]="'network-nodes'" />
            </div>
          </div>

          <!-- Hero Content -->
          <div class="relative z-10">
            <!-- Layer Badge -->
            <div
              class="inline-block"
              scrollAnimation
              [scrollConfig]="{
                animation: 'custom',
                start: 'top 80%',
                end: 'top 40%',
                scrub: 0.8,
                from: { opacity: 0, scale: 0.8 },
                to: { opacity: 1, scale: 1 }
              }"
            >
              <span
                class="inline-flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-400/30 rounded-full text-sm font-semibold text-emerald-300 mb-6 backdrop-blur-sm"
              >
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z"
                  />
                  <path
                    d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z"
                  />
                  <path
                    d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z"
                  />
                </svg>
                SCROLL ANIMATION LAYER
              </span>
            </div>

            <!-- Main Headline -->
            <h2
              class="text-7xl font-bold text-white mb-6 leading-tight"
              scrollAnimation
              [scrollConfig]="{
                animation: 'custom',
                start: 'top 75%',
                end: 'top 35%',
                scrub: 1,
                from: { opacity: 0, y: 50 },
                to: { opacity: 1, y: 0 }
              }"
            >
              <span
                class="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
              >
                Angular GSAP
              </span>
            </h2>

            <!-- Subtitle -->
            <p
              class="text-2xl text-gray-300 leading-relaxed max-w-3xl mx-auto"
              scrollAnimation
              [scrollConfig]="{
                animation: 'custom',
                start: 'top 70%',
                end: 'top 30%',
                scrub: 1,
                from: { opacity: 0, y: 30 },
                to: { opacity: 1, y: 0 }
              }"
            >
              GSAP-powered scroll animations for Angular applications.
              <span class="block mt-2 text-emerald-400 font-semibold">
                Create stunning scroll experiences with minimal code.
              </span>
            </p>

            <!-- Floating Metrics -->
            <div
              class="flex justify-center gap-12 mt-12"
              scrollAnimation
              [scrollConfig]="{
                animation: 'custom',
                start: 'top 65%',
                end: 'top 25%',
                scrub: 0.8,
                from: { opacity: 0, y: 40 },
                to: { opacity: 1, y: 0 }
              }"
            >
              <div class="text-center">
                <div class="text-4xl font-bold text-emerald-400 mb-2">
                  10+ Animations
                </div>
                <div class="text-sm text-gray-400 uppercase tracking-wide">
                  Built-in Effects
                </div>
              </div>
              <div class="text-center">
                <div class="text-4xl font-bold text-cyan-400 mb-2">
                  ScrollTrigger
                </div>
                <div class="text-sm text-gray-400 uppercase tracking-wide">
                  GSAP-Powered
                </div>
              </div>
              <div class="text-center">
                <div class="text-4xl font-bold text-blue-400 mb-2">
                  SSR-Safe
                </div>
                <div class="text-sm text-gray-400 uppercase tracking-wide">
                  Server Ready
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progressive Feature Sections - Natural scroll with parallax -->
      @for (step of codeTimeline(); track step.id; let i = $index) {
      <!-- Step Container - Full Height 50/50 Split with Parallax Background -->
      <div class="relative min-h-screen flex w-full">
        <!-- Full-Height Image Side (Background Cover with Parallax) -->
        <div
          class="absolute inset-y-0 w-1/2"
          [class.right-0]="step.layout === 'left'"
          [class.left-0]="step.layout === 'right'"
        >
          @if (step.language === 'image') {
          <!-- Full-height parallax image background -->
          <div
            class="absolute inset-0 overflow-hidden"
            scrollAnimation
            [scrollConfig]="{
              animation: 'parallax',
              speed: 0.3,
              scrub: 0.5
            }"
          >
            <!-- Gradient overlay for text readability -->
            <div
              class="absolute inset-0 z-10"
              [class]="
                step.layout === 'left'
                  ? 'bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent'
                  : 'bg-gradient-to-l from-slate-900 via-slate-900/80 to-transparent'
              "
            ></div>
            <!-- Full cover image -->
            <img
              [ngSrc]="step.code"
              [alt]="step.title"
              fill
              priority
              class="object-cover scale-110"
            />
            <!-- Accent glow overlay -->
            <div
              class="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 z-5"
            ></div>
          </div>
          }
        </div>

        <!-- Text Content Side -->
        <div
          class="relative z-20 w-1/2 min-h-screen flex items-center"
          [class.ml-0]="step.layout === 'left'"
          [class.ml-auto]="step.layout === 'right'"
        >
          <div
            class="px-16 py-20 max-w-2xl"
            [class.ml-auto]="step.layout === 'left'"
            [class.mr-auto]="step.layout === 'right'"
            scrollAnimation
            [scrollConfig]="{
              animation: 'custom',
              start: 'top 80%',
              end: 'top 30%',
              scrub: 1,
              from: {
                opacity: 0,
                x: step.layout === 'left' ? -60 : 60,
                y: 20
              },
              to: { opacity: 1, x: 0, y: 0 }
            }"
          >
            <!-- Step Number Badge -->
            <div class="inline-flex items-center gap-3 mb-8">
              <span
                class="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-600 text-white font-bold text-2xl shadow-lg shadow-emerald-500/30"
              >
                {{ step.step }}
              </span>
              <div
                class="h-px flex-1 bg-gradient-to-r from-emerald-500/50 to-transparent max-w-[150px]"
              ></div>
            </div>

            <!-- Title with animation -->
            <h3
              class="text-5xl font-bold text-white mb-6 leading-tight"
              scrollAnimation
              [scrollConfig]="{
                animation: 'slideUp',
                start: 'top 85%',
                duration: 0.6,
                delay: 0.1
              }"
            >
              {{ step.title }}
            </h3>

            <!-- Description with animation -->
            <p
              class="text-xl text-gray-300 leading-relaxed mb-8"
              scrollAnimation
              [scrollConfig]="{
                animation: 'fadeIn',
                start: 'top 80%',
                duration: 0.8,
                delay: 0.2
              }"
            >
              {{ step.description }}
            </p>

            <!-- Notes with staggered animation -->
            @if (step.notes && step.notes.length > 0) {
            <div class="space-y-4">
              @for (note of step.notes; track $index) {
              <div
                class="flex items-start gap-3"
                scrollAnimation
                [scrollConfig]="{
                  animation: 'slideUp',
                  start: 'top 85%',
                  duration: 0.5,
                  delay: 0.3 + $index * 0.1
                }"
              >
                <svg
                  class="w-6 h-6 text-emerald-400 mt-0.5 flex-shrink-0"
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
                <p class="text-base text-gray-400">{{ note }}</p>
              </div>
              }
            </div>
            }
          </div>
        </div>
      </div>
      }
    </div>
  `,
  styles: [
    `
      @keyframes fade-in-up {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .animate-fade-in-up {
        animation: fade-in-up 0.6s ease-out forwards;
        opacity: 0;
      }
    `,
  ],
})
export class AngularGsapSectionComponent {
  /**
   * Ecosystem section opacity control
   */
  public readonly ecosystemOpacity = signal(0);

  public constructor() {
    // Fade in ecosystem after mount
    setTimeout(() => {
      this.ecosystemOpacity.set(1);
    }, 500);
  }

  /**
   * Angular GSAP feature timeline
   * Based on @hive-academy/angular-gsap library capabilities
   */
  public readonly codeTimeline = signal<TimelineStep[]>([
    {
      id: 'scroll-animation',
      step: 1,
      title: 'ScrollAnimationDirective - Declarative Animations',
      description:
        'Apply scroll-triggered animations to any DOM element with a simple directive. Choose from 10+ built-in animations (fadeIn, slideUp, scaleIn, parallax) or create custom animations with GSAP TweenVars. Full control over start/end triggers, duration, easing, and scrub behavior.',
      code: 'images/showcase/angular-gsap-step1.png',
      language: 'image',
      layout: 'left',
      notes: [
        '10+ built-in animation types',
        'Custom from/to with GSAP TweenVars',
        'Configurable ScrollTrigger options',
        'once: true/false for repeat control',
      ],
    },
    {
      id: 'hijacked-scroll',
      step: 2,
      title: 'Hijacked Scroll - Step-by-Step Sequences',
      description:
        'Create scroll-jacked experiences where the viewport is pinned while users scroll through content steps. Perfect for tutorials, product showcases, and storytelling. HijackedScrollDirective and HijackedScrollItemDirective work together for seamless step transitions.',
      code: 'images/showcase/angular-gsap-step2.png',
      language: 'image',
      layout: 'right',
      notes: [
        'Pinned viewport during scroll',
        'Step-by-step content transitions',
        'currentStepChange and progressChange outputs',
        'Configurable scroll height per step',
      ],
    },
    {
      id: 'timeline-component',
      step: 3,
      title: 'HijackedScrollTimeline Component',
      description:
        'Convenience wrapper component with content projection for building timeline-style showcases. Simply drop in your content items with hijackedScrollItem directive and the component handles all the animation orchestration, progress tracking, and cleanup automatically.',
      code: 'images/showcase/angular-gsap-hero.png',
      language: 'image',
      layout: 'left',
      notes: [
        '<agsp-hijacked-scroll-timeline> wrapper',
        'Content projection for child items',
        'Automatic animation orchestration',
        'Built-in progress and step tracking',
      ],
    },
    {
      id: 'section-sticky',
      step: 4,
      title: 'SectionStickyDirective - Smart Sticky Navigation',
      description:
        'Create sticky navigation elements that appear only when their parent section is in view. Uses IntersectionObserver for performance-optimized visibility detection. Perfect for sidebar navigation, progress indicators, and contextual UI elements.',
      code: 'images/showcase/angular-3d-hero.png',
      language: 'image',
      layout: 'right',
      notes: [
        'IntersectionObserver-based detection',
        'Position: fixed when section in view',
        'Configurable root margin',
        'Automatic visibility management',
      ],
    },
  ]);
}
