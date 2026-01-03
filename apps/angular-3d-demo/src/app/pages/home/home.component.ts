import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  signal,
} from '@angular/core';
import { GlassSphereHeroComponent } from '../../shared/components/glass-sphere-hero';
import { LibraryOverviewSectionComponent } from './sections/library-overview-section.component';
import { CtaSectionComponent } from './sections/cta-section.component';

/**
 * Home Page Component
 *
 * Landing page with:
 * - Glass Sphere Hero section with 3D glass sphere, sparkle corona, and scroll animations
 * - CTA section with 3D background
 * - Combined Library Overview (Hijacked Scroll)
 *
 * The glass sphere hero features:
 * - Warm cream/peach gradient background
 * - Glossy glass sphere with PMREMGenerator reflections
 * - SparkleCorona twinkling particles around the sphere edge
 * - Scroll-driven sphere movement (bottom-center to top-right)
 * - Content fade-out on scroll with GSAP ScrollTrigger
 */
@Component({
  selector: 'app-home',
  imports: [
    GlassSphereHeroComponent,
    LibraryOverviewSectionComponent,
    CtaSectionComponent,
  ],
  template: `
    <!-- Glass Sphere Hero Section -->
    <app-glass-sphere-hero
      [scrollProgress]="scrollProgress()"
      [badgeText]="'Angular 3D'"
      [titleLine1]="'Build Stunning'"
      [titleLine2]="'3D Experiences'"
      [subtitle]="
        'Create immersive web experiences with WebGPU-powered 3D graphics and smooth scroll animations.'
      "
      [featurePills]="['WebGPU', 'TSL Shaders', 'Signals']"
      [primaryButtonText]="'Get Started'"
      [secondaryButtonText]="'See Examples'"
      [secondaryButtonHref]="'/angular-3d-showcase'"
      (primaryAction)="onGetStarted()"
    />

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
export class HomeComponent {
  /**
   * Scroll progress signal (0 = top, 1 = bottom)
   * Used to control glass sphere position and content fade-out
   */
  public readonly scrollProgress = signal(0);

  /**
   * Track scroll position and update scrollProgress signal
   * Calculates normalized scroll position (0-1) based on page scroll
   */
  @HostListener('window:scroll')
  public onScroll(): void {
    const max = document.body.scrollHeight - window.innerHeight;
    this.scrollProgress.set(max > 0 ? window.scrollY / max : 0);
  }

  /**
   * Handle primary CTA button click
   * Navigates to getting started or documentation
   */
  public onGetStarted(): void {
    // Navigate to Angular 3D showcase as the primary action
    window.location.href = '/angular-3d-showcase';
  }
}
