import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Angular-GSAP Library Section Component
 *
 * Full-width showcase section for the @hive-academy/angular-gsap library.
 * Inspired by value-propositions-section.component.ts pattern with:
 * - Full viewport height
 * - Two-column layout (animation demo left, content right)
 * - Scroll-triggered animations
 * - Light/gradient theme to contrast with dark 3D section
 */
@Component({
  selector: 'app-angular-gsap-section',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white relative overflow-hidden"
    >
      <!-- Background decorative elements -->
      <div
        class="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-primary-500/10 to-neon-green/10 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-neon-green/10 to-primary-500/10 rounded-full blur-3xl"
      ></div>

      <!-- Main Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4x py-20x">
        <div class="grid lg:grid-cols-2 gap-16x items-center min-h-[80vh]">
          <!-- LEFT: Animation Demo Area -->
          <div
            class="relative rounded-2xl overflow-hidden border border-primary-500/20 bg-white shadow-card"
            style="min-height: 500px"
          >
            <!-- Animated Demo Content -->
            <div class="p-8x h-full flex flex-col justify-center">
              <!-- Example animated elements -->
              <div class="space-y-6x">
                <!-- Scroll trigger demo -->
                <div class="relative">
                  <div class="text-body-sm font-mono text-primary-500/60 mb-2x">
                    scrollAnimation directive
                  </div>
                  <div class="flex gap-4x overflow-hidden">
                    @for (i of [1,2,3,4]; track i) {
                    <div
                      class="w-20 h-20 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg animate-pulse"
                      [style.animation-delay.ms]="i * 200"
                    ></div>
                    }
                  </div>
                </div>

                <!-- Timeline demo -->
                <div class="relative mt-8x">
                  <div class="text-body-sm font-mono text-primary-500/60 mb-2x">
                    hijackedScroll directive
                  </div>
                  <div
                    class="relative h-3 bg-gray-200 rounded-full overflow-hidden"
                  >
                    <div
                      class="absolute inset-y-0 left-0 bg-gradient-to-r from-neon-green to-primary-500 rounded-full animate-slide-progress"
                      style="width: 70%"
                    ></div>
                  </div>
                  <div
                    class="flex justify-between mt-2x text-body-sm text-gray-500"
                  >
                    <span>0%</span>
                    <span>Section Progress</span>
                    <span>100%</span>
                  </div>
                </div>

                <!-- Code preview -->
                <div
                  class="mt-8x bg-background-dark rounded-xl p-6x border border-gray-800"
                >
                  <div class="flex items-center gap-2x mb-4x">
                    <div class="w-3 h-3 rounded-full bg-red-500"></div>
                    <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div class="w-3 h-3 rounded-full bg-green-500"></div>
                    <span class="ml-4x text-body-sm text-gray-500 font-mono"
                      >component.html</span
                    >
                  </div>
                  <pre
                    class="text-neon-green font-mono text-body-sm overflow-x-auto"
                  ><code>&lt;div scrollAnimation
     [animationType]="'fadeInUp'"
     [duration]="0.8"&gt;
  Content reveals on scroll...
&lt;/div&gt;</code></pre>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Content -->
          <div class="flex flex-col justify-center">
            <!-- Package Badge -->
            <div class="flex items-center gap-3 mb-6x">
              <span
                class="px-3x py-1x bg-primary-500/10 border border-primary-500/30 rounded-full text-primary-600 text-body-sm font-mono"
              >
                @hive-academy/angular-gsap
              </span>
            </div>

            <!-- Headline -->
            <h2
              class="text-display-md lg:text-display-lg font-bold text-text-primary leading-tight mb-6x"
            >
              Scroll-Driven <span class="text-primary-500">Animations</span>
              Made Simple
            </h2>

            <!-- Description -->
            <p class="text-body-lg text-text-secondary leading-relaxed mb-8x">
              Signal-based GSAP directives for Angular. Create stunning scroll
              animations, hijacked scroll sections, and timeline orchestration
              with SSR compatibility.
            </p>

            <!-- Capabilities Grid -->
            <div class="grid grid-cols-2 gap-3x mb-8x">
              @for (capability of capabilities; track capability) {
              <div
                class="flex items-center gap-3x py-3x px-4x rounded-xl bg-primary-50 border border-primary-100 hover:border-primary-300 transition-colors group"
              >
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg bg-primary-500 text-white"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <span
                  class="text-body-md text-text-primary group-hover:text-primary-600 transition-colors"
                >
                  {{ capability }}
                </span>
              </div>
              }
            </div>

            <!-- Metric Badge -->
            <div
              class="inline-flex items-center gap-4x px-6x py-4x bg-gradient-to-r from-primary-50 to-neon-green/10 rounded-xl border border-primary-200 mb-8x"
            >
              <div class="text-display-md font-bold text-primary-500">60%</div>
              <div>
                <div class="text-body-lg font-bold text-text-primary">
                  Less Animation Code
                </div>
                <div class="text-body-sm text-text-secondary">
                  vs manual GSAP setup
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <a
              routerLink="/angular-gsap"
              class="inline-flex items-center gap-2x px-8x py-4x bg-primary-500 text-white rounded-button font-semibold hover:scale-105 hover:shadow-button-hover transition-all duration-250 w-fit"
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
  styles: [
    `
      @keyframes slide-progress {
        0%,
        100% {
          width: 20%;
        }
        50% {
          width: 80%;
        }
      }

      .animate-slide-progress {
        animation: slide-progress 3s ease-in-out infinite;
      }
    `,
  ],
})
export class AngularGsapSectionComponent {
  public readonly capabilities = [
    'ScrollTrigger Integration',
    'Hijacked Scroll Sections',
    'Timeline Orchestration',
    'SSR Compatible',
    'Signal-based State',
    'Automatic Cleanup',
    'GSAP Directives',
    'Scroll Progress',
  ];
}
