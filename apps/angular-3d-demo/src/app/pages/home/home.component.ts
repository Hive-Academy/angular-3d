import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassSphereHeroSectionComponent } from './sections/glass-sphere-hero-section.component';
import { LibraryOverviewSectionV2Component } from './sections/library-overview-section-v2.component';
import { CtaSectionComponent } from './sections/cta-section.component';
import { ClaudeSkillsShowcaseSectionComponent } from './sections/claude-skills-showcase-section.component';

/**
 * Home Page Component
 *
 * Landing page with four sections:
 * - Glass Sphere Hero (eagerly loaded - above the fold)
 * - CTA section (deferred - lightweight CSS animations)
 * - Claude Skills Showcase (deferred - heavy 3D scene)
 * - Library Overview v2 (deferred - static content)
 *
 * Performance optimizations:
 * - @defer with viewport triggers delays heavy section initialization
 * - Prefetch margins ensure smooth transitions (150-200px lead time)
 * - Placeholder skeletons prevent layout shift
 */
@Component({
  selector: 'app-home',
  imports: [
    GlassSphereHeroSectionComponent,
    ClaudeSkillsShowcaseSectionComponent,
    LibraryOverviewSectionV2Component,
    CtaSectionComponent,
  ],
  template: `
    <!-- Hero Section - Eagerly loaded (above the fold) -->
    <app-glass-sphere-hero-section />

    <!-- CTA Section - Deferred with 150px prefetch margin -->
    <section class="min-h-screen">
      @defer (on viewport; prefetch on viewport) {
      <app-cta-section />
      } @placeholder {
      <div
        class="cta-skeleton min-h-screen flex items-center justify-center"
        style="background: linear-gradient(to bottom, rgb(15, 23, 42), rgb(10, 20, 35), rgb(15, 23, 42))"
      >
        <div class="animate-pulse text-center">
          <div class="h-8 w-64 bg-white/10 rounded-full mx-auto mb-4"></div>
          <div class="h-16 w-96 bg-white/5 rounded-lg mx-auto mb-6"></div>
          <div class="h-4 w-80 bg-white/5 rounded mx-auto"></div>
        </div>
      </div>
      }
    </section>

    <!-- Claude Skills Showcase - Deferred with 200px prefetch margin (heavy 3D scene) -->
    <section class="min-h-screen">
      @defer (on viewport; prefetch on viewport) {
      <app-claude-skills-showcase-section />
      } @placeholder {
      <div
        class="skills-skeleton min-h-screen flex items-center justify-center"
        style="background: linear-gradient(135deg, #0a0515 0%, #1a0a2e 50%, #0a0515 100%)"
      >
        <div class="animate-pulse text-center">
          <div
            class="h-6 w-48 bg-purple-500/20 rounded-full mx-auto mb-6"
          ></div>
          <div
            class="h-24 w-72 bg-purple-500/10 rounded-2xl mx-auto mb-8"
          ></div>
          <div class="flex gap-4 justify-center">
            <div class="h-40 w-64 bg-white/5 rounded-xl"></div>
            <div class="h-40 w-64 bg-white/5 rounded-xl"></div>
          </div>
        </div>
      </div>
      }
    </section>

    <!-- Library Overview - Deferred (static content) -->
    <section class="min-h-screen">
      @defer (on viewport) {
      <app-library-overview-section-v2 />
      } @placeholder {
      <div
        class="overview-skeleton min-h-screen flex items-center justify-center bg-slate-900"
      >
        <div class="animate-pulse text-center">
          <div class="h-8 w-56 bg-white/10 rounded-full mx-auto mb-4"></div>
          <div class="h-4 w-96 bg-white/5 rounded mx-auto"></div>
        </div>
      </div>
      }
    </section>
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
