import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero3dTeaserComponent } from './sections/hero-3d-teaser.component';
import { LibraryOverviewSectionComponent } from './sections/library-overview-section.component';
import { CtaSectionComponent } from './sections/cta-section.component';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

/**
 * Home Page Component
 *
 * Landing page with:
 * - Hero section with 3D background, GLTF robot, and parallax scroll animations
 * - Combined Library Overview (Hijacked Scroll)
 * - CTA section with 3D background
 */
@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    Hero3dTeaserComponent,
    LibraryOverviewSectionComponent,
    CtaSectionComponent,
    ScrollAnimationDirective,
  ],
  template: `
    <!-- Hero Section with 3D Background -->
    <section
      class="mt-[72px] min-h-screen relative overflow-hidden bg-background-dark"
    >
      <!-- 3D Scene Background -->
      <div class="absolute inset-0 z-0">
        <app-hero-3d-teaser />
      </div>

      <!-- Gradient Overlay for text readability 
      <div
        class="absolute inset-0 z-10 bg-gradient-to-r from-background-dark/95 via-background-dark/70 to-transparent"
      ></div>-->

      <!-- Hero Content with Parallax Scroll Animations -->
      <div
        class="relative z-20 max-w-7xl mx-auto px-4x py-20x flex items-center min-h-screen"
      >
        <div class="max-w-2xl">
          <!-- Eyebrow with scroll animation -->
          <div
            scrollAnimation
            [scrollConfig]="{
              animation: 'slideUp',
              start: 'top 90%',
              duration: 0.8,
              delay: 0,
              once: true
            }"
            class="inline-flex items-center gap-2x px-4x py-2x bg-neon-green/10 border border-neon-green/30 rounded-full text-neon-green text-body-sm font-medium mb-8x"
          >
            <span
              class="w-2 h-2 rounded-full bg-neon-green animate-pulse"
            ></span>
            Two Libraries, One Ecosystem
          </div>

          <!-- Headline with staggered scroll animation -->
          <h1
            scrollAnimation
            [scrollConfig]="{
              animation: 'slideUp',
              start: 'top 85%',
              duration: 1,
              delay: 0.1,
              once: true
            }"
            class="text-display-lg lg:text-display-xl font-bold text-white mb-6x leading-tight"
          >
            Build <span class="text-neon-green">Stunning</span> Angular
            Experiences
          </h1>

          <!-- Subheadline with scroll animation -->
          <p
            scrollAnimation
            [scrollConfig]="{
              animation: 'slideUp',
              start: 'top 80%',
              duration: 1,
              delay: 0.2,
              once: true
            }"
            class="text-headline-sm text-gray-300 mb-10x leading-relaxed"
          >
            Create immersive 3D scenes and scroll-driven animations with
            signal-based Angular libraries. Production-ready components with
            automatic cleanup.
          </p>

          <!-- CTA Buttons with scroll animation -->
          <div
            scrollAnimation
            [scrollConfig]="{
              animation: 'slideUp',
              start: 'top 75%',
              duration: 0.8,
              delay: 0.3,
              once: true
            }"
            class="flex gap-4x flex-wrap mb-12x"
          >
            <a
              routerLink="/angular-3d"
              class="px-8x py-4x bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 hover:shadow-neon-green transition-all duration-250"
            >
              Explore 3D →
            </a>
            <a
              routerLink="/angular-gsap"
              class="px-8x py-4x border-2 border-white/30 text-white rounded-button font-semibold hover:bg-white/10 transition-all duration-250"
            >
              See Animations →
            </a>
          </div>

          <!-- Quick Stats with scroll animation -->
          <div
            scrollAnimation
            [scrollConfig]="{
              animation: 'slideUp',
              start: 'top 70%',
              duration: 0.8,
              delay: 0.4,
              once: true
            }"
            class="flex gap-8x"
          >
            <div
              scrollAnimation
              [scrollConfig]="{
                animation: 'scaleIn',
                start: 'top 70%',
                duration: 0.6,
                delay: 0.5,
                once: true
              }"
              class="text-center"
            >
              <div class="text-display-md font-bold text-neon-green">27+</div>
              <div class="text-body-sm text-gray-400">3D Primitives</div>
            </div>
            <div
              scrollAnimation
              [scrollConfig]="{
                animation: 'scaleIn',
                start: 'top 70%',
                duration: 0.6,
                delay: 0.6,
                once: true
              }"
              class="text-center"
            >
              <div class="text-display-md font-bold text-primary-400">4</div>
              <div class="text-body-sm text-gray-400">GSAP Directives</div>
            </div>
            <div
              scrollAnimation
              [scrollConfig]="{
                animation: 'scaleIn',
                start: 'top 70%',
                duration: 0.6,
                delay: 0.7,
                once: true
              }"
              class="text-center"
            >
              <div class="text-display-md font-bold text-white">100%</div>
              <div class="text-body-sm text-gray-400">Signal-based</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll Indicator with animation -->
      <div
        scrollAnimation
        [scrollConfig]="{
          animation: 'fadeIn',
          start: 'top 60%',
          duration: 1,
          delay: 0.8,
          once: true
        }"
        class="absolute bottom-8x left-1/2 -translate-x-1/2 z-20"
      >
        <div class="animate-bounce">
          <svg
            class="w-6 h-6 text-white/50"
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
        <p class="text-body-sm text-white/40 mt-2x text-center">
          Scroll to explore
        </p>
      </div>
    </section>

    <!-- Combined Library Overview Section (Hijacked Scroll) -->
    <app-library-overview-section />

    <!-- CTA Section -->
    <app-cta-section />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {}
