import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-library-overview',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="bg-background-light py-16x">
      <div class="max-w-container mx-auto px-4x">
        <!-- Section Header -->
        <h2 class="text-display-lg text-center mb-12x font-bold">
          Two Libraries,
          <span class="text-primary-500">Infinite Possibilities</span>
        </h2>

        <!-- Cards Grid -->
        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Angular-3D Card -->
          <div
            class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300"
          >
            <div
              class="w-16x h-16x mb-4x bg-primary-50 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5"
                />
              </svg>
            </div>

            <h3 class="text-headline-lg font-bold text-primary-500 mb-3x">
              &#64;hive-academy/angular-3d
            </h3>

            <p class="text-body-lg text-text-secondary mb-4x">
              Pure Angular wrapper for Three.js. Build 3D scenes with
              components, not imperative code.
            </p>

            <!-- Features List -->
            <div class="grid grid-cols-2 gap-2x mb-4x">
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">27+ Primitives</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">GLTF Loading</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">Post-processing</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">OrbitControls</span>
              </div>
            </div>

            <a
              routerLink="/angular-3d"
              class="text-primary-500 hover:text-neon-green font-semibold inline-flex items-center gap-1x transition-colors duration-250"
            >
              Explore Components
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>

          <!-- Angular-GSAP Card -->
          <div
            class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover hover:-translate-y-2 transition-all duration-300"
          >
            <div
              class="w-16x h-16x mb-4x bg-primary-50 rounded-lg flex items-center justify-center"
            >
              <svg
                class="w-10 h-10 text-primary-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>

            <h3 class="text-headline-lg font-bold text-primary-500 mb-3x">
              &#64;hive-academy/angular-gsap
            </h3>

            <p class="text-body-lg text-text-secondary mb-4x">
              Signal-based GSAP directives for scroll-driven animations and
              timeline orchestration.
            </p>

            <!-- Features List -->
            <div class="grid grid-cols-2 gap-2x mb-4x">
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">ScrollTrigger</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">Hijacked Scroll</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">Timelines</span>
              </div>
              <div class="flex items-center gap-1x">
                <svg
                  class="w-5 h-5 text-success"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="text-body-md">SSR Compatible</span>
              </div>
            </div>

            <a
              routerLink="/angular-gsap"
              class="text-primary-500 hover:text-neon-green font-semibold inline-flex items-center gap-1x transition-colors duration-250"
            >
              View Animations
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class LibraryOverviewComponent {}
