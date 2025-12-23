import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Hero3dTeaserComponent } from './scenes/hero-3d-teaser.component';
import { LibraryOverviewSectionComponent } from './sections/library-overview-section.component';
import { CtaSectionComponent } from './sections/cta-section.component';

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
    Hero3dTeaserComponent,
    LibraryOverviewSectionComponent,
    CtaSectionComponent,
  ],
  template: `
    <!-- Hero Section with 3D Background -->
    <section
      class="pt-30 min-h-screen relative overflow-hidden bg-background-dark"
    >
      <!-- 3D Scene Background -->
      <div class="absolute inset-0 z-0">
        <app-hero-3d-teaser />
      </div>
    </section>

    <section class="min-h-screen">
      <!-- CTA Section -->
      <app-cta-section />
    </section>

    <section class="min-h-screen">
      <!-- Combined Library Overview Section (Hijacked Scroll) -->
      <app-library-overview-section />
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
