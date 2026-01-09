import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroSectionComponent } from './sections/hero-section.component';
import { LibraryOverviewSectionV2Component } from './sections/library-overview-section-v2.component';
import { CtaSectionComponent } from './sections/cta-section.component';
import { ClaudeSkillsShowcaseSectionComponent } from './sections/claude-skills-showcase-section.component';
import { PerformanceDebugComponent } from '../../shared/components/performance-debug.component';

/**
 * Home Page Component
 *
 * Landing page with four sections:
 * - Hero (eagerly loaded - above the fold)
 * - CTA section (deferred - lightweight CSS animations)
 * - Claude Skills Showcase (deferred - heavy 3D scene)
 * - Library Overview v2 (deferred - static content)
 *
 */
@Component({
  selector: 'app-home',
  imports: [
    HeroSectionComponent,
    ClaudeSkillsShowcaseSectionComponent,
    LibraryOverviewSectionV2Component,
    CtaSectionComponent,
    PerformanceDebugComponent,
  ],
  template: `
    <!-- Performance Debug Overlay (Press P to toggle, or add ?debug=perf to URL) -->
    <app-performance-debug />

    <!-- Hero Section - Eagerly loaded (above the fold) -->
    <app-hero-section />

    <!-- CTA Section - Deferred with 150px prefetch margin -->
    <section class="min-h-screen">
      <app-cta-section />
    </section>

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
