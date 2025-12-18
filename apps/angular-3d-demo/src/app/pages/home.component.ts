import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Hero3dTeaserComponent } from '../sections/hero-3d-teaser.component';
import { HeroGsapTeaserComponent } from '../sections/hero-gsap-teaser.component';
import { LibraryOverviewComponent } from '../sections/library-overview.component';
import { CtaSectionComponent } from '../sections/cta-section.component';

@Component({
  selector: 'app-home',
  imports: [
    RouterLink,
    Hero3dTeaserComponent,
    HeroGsapTeaserComponent,
    LibraryOverviewComponent,
    CtaSectionComponent,
  ],
  template: `
    <!-- Dual Hero Section -->
    <section class="mt-[72px] min-h-screen grid lg:grid-cols-2 relative">
      <app-hero-3d-teaser />
      <app-hero-gsap-teaser />

      <!-- Center Overlay -->
      <div
        class="absolute inset-0 flex items-center justify-center pointer-events-none px-4x"
      >
        <div
          class="pointer-events-auto bg-white/90 backdrop-blur-md p-8x md:p-12x rounded-card shadow-card max-w-content text-center"
        >
          <h1 class="text-display-md md:text-display-xl font-bold mb-4x">
            Two Libraries, <span class="text-neon-green">One Ecosystem</span>
          </h1>
          <p
            class="text-headline-sm md:text-headline-md text-text-secondary mb-8x"
          >
            Build stunning 3D experiences and scroll animations with Angular
          </p>
          <div class="flex gap-4x justify-center flex-wrap">
            <a
              routerLink="/angular-3d"
              class="px-8x py-4x bg-primary-500 text-white rounded-button font-semibold hover:scale-105 transition-transform"
            >
              Explore 3D →
            </a>
            <a
              routerLink="/angular-gsap"
              class="px-8x py-4x border-2 border-neon-green text-neon-green rounded-button font-semibold hover:bg-neon-green hover:text-background-dark transition-all"
            >
              See Animations →
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- Library Overview -->
    <app-library-overview />

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
