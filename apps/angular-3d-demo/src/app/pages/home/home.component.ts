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
