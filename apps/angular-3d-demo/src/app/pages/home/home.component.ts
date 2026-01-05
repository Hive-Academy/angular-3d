import { ChangeDetectionStrategy, Component } from '@angular/core';
import { GlassSphereHeroSectionComponent } from './sections/glass-sphere-hero-section.component';
import { LibraryOverviewSectionComponent } from './sections/library-overview-section.component';
import { CtaSectionComponent } from './sections/cta-section.component';
import { ClaudeSkillsShowcaseSectionComponent } from './sections/claude-skills-showcase-section.component';

/**
 * Home Page Component
 *
 * Landing page with four sections:
 * - Glass Sphere Hero (self-contained scroll animation)
 * - Claude Skills Showcase (AI-enhanced development)
 * - CTA section
 * - Library Overview (hijacked scroll)
 */
@Component({
  selector: 'app-home',
  imports: [
    GlassSphereHeroSectionComponent,
    ClaudeSkillsShowcaseSectionComponent,
    LibraryOverviewSectionComponent,
    CtaSectionComponent,
  ],
  template: `
    <app-glass-sphere-hero-section />

    <section class="min-h-screen">
      <app-cta-section />
    </section>

    <section class="min-h-screen">
      <app-claude-skills-showcase-section />
    </section>

    <!-- <section class="min-h-screen">
      <app-library-overview-section />
    </section> -->
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
