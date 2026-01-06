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
      <app-cta-section />
    </section>

    <!-- Claude Skills Showcase - Deferred with 200px prefetch margin (heavy 3D scene) -->
    <section class="min-h-screen">
      <app-claude-skills-showcase-section />
    </section>

    <!-- Library Overview - Deferred (static content) -->
    <section class="min-h-screen">
      <app-library-overview-section-v2 />
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
