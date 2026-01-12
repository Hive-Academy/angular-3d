import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

/**
 * CTA Section with Premium Design
 *
 * Features:
 * - Decorative ambient glow effects using neon-green theme
 * - GSAP viewport animations for elements entering view
 * - Scroll-linked animations for parallax depth effect
 * - Properly centered content with responsive design
 */
@Component({
  selector: 'app-cta-section',
  imports: [ScrollAnimationDirective],
  template: `
    <section
      class="relative w-full overflow-hidden min-h-screen flex items-center justify-center py-24"
      style="background: linear-gradient(to bottom, rgb(15, 23, 42), rgb(10, 20, 35), rgb(15, 23, 42))"
    >
      <!-- Decorative Background Elements -->
      <div class="absolute inset-0 pointer-events-none" aria-hidden="true">
        <!-- Main Glow - Top Left -->
        <div
          class="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full blur-[150px] opacity-20"
          style="background: radial-gradient(circle, rgba(161, 255, 79, 0.4) 0%, transparent 70%)"
        ></div>

        <!-- Secondary Glow - Bottom Right -->
        <div
          class="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15"
          style="background: radial-gradient(circle, rgba(161, 255, 79, 0.35) 0%, transparent 70%)"
        ></div>

        <!-- Center Accent Glow -->
        <div
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] rounded-full blur-[180px] opacity-10"
          style="background: radial-gradient(ellipse, rgba(161, 255, 79, 0.3) 0%, transparent 60%)"
        ></div>

        <!-- Floating Particles - Layer 1 (Fast parallax) -->
        <div
          class="absolute inset-0"
          scrollAnimation
          [scrollConfig]="{
            animation: 'parallax',
            speed: 0.4,
            scrub: 1,
            start: 'top bottom',
            end: 'bottom top'
          }"
        >
          <div
            class="absolute top-[15%] left-[8%] w-4 h-4 rounded-full bg-neon-green/50 animate-pulse blur-[1px]"
          ></div>
          <div
            class="absolute top-[25%] right-[12%] w-5 h-5 rounded-full bg-neon-green/40 animate-pulse blur-[1px]"
            style="animation-delay: 0.3s"
          ></div>
          <div
            class="absolute bottom-[20%] left-[15%] w-3 h-3 rounded-full bg-neon-green/60 animate-pulse"
            style="animation-delay: 0.6s"
          ></div>
          <div
            class="absolute bottom-[30%] right-[8%] w-6 h-6 rounded-full bg-neon-green/35 animate-pulse blur-[2px]"
            style="animation-delay: 0.9s"
          ></div>
          <div
            class="absolute top-[50%] left-[3%] w-4 h-4 rounded-full bg-neon-green/45 animate-pulse blur-[1px]"
            style="animation-delay: 1.2s"
          ></div>
        </div>

        <!-- Floating Particles - Layer 2 (Medium parallax) -->
        <div
          class="absolute inset-0"
          scrollAnimation
          [scrollConfig]="{
            animation: 'parallax',
            speed: 0.25,
            scrub: 1.5,
            start: 'top bottom',
            end: 'bottom top'
          }"
        >
          <div
            class="absolute top-[35%] left-[25%] w-5 h-5 rounded-full bg-neon-green/30 animate-pulse blur-[1px]"
            style="animation-delay: 0.4s"
          ></div>
          <div
            class="absolute top-[10%] right-[30%] w-4 h-4 rounded-full bg-neon-green/45 animate-pulse"
            style="animation-delay: 0.7s"
          ></div>
          <div
            class="absolute bottom-[40%] left-[35%] w-6 h-6 rounded-full bg-neon-green/25 animate-pulse blur-[2px]"
            style="animation-delay: 1s"
          ></div>
          <div
            class="absolute top-[70%] right-[20%] w-3 h-3 rounded-full bg-neon-green/55 animate-pulse"
            style="animation-delay: 1.3s"
          ></div>
          <div
            class="absolute bottom-[15%] right-[35%] w-5 h-5 rounded-full bg-neon-green/35 animate-pulse blur-[1px]"
            style="animation-delay: 0.2s"
          ></div>
        </div>

        <!-- Floating Particles - Layer 3 (Slow parallax) -->
        <div
          class="absolute inset-0"
          scrollAnimation
          [scrollConfig]="{
            animation: 'parallax',
            speed: 0.15,
            scrub: 2,
            start: 'top bottom',
            end: 'bottom top'
          }"
        >
          <div
            class="absolute top-[45%] right-[5%] w-7 h-7 rounded-full bg-neon-green/20 animate-pulse blur-[3px]"
            style="animation-delay: 0.5s"
          ></div>
          <div
            class="absolute bottom-[55%] left-[45%] w-4 h-4 rounded-full bg-neon-green/40 animate-pulse blur-[1px]"
            style="animation-delay: 0.8s"
          ></div>
          <div
            class="absolute top-[80%] left-[55%] w-5 h-5 rounded-full bg-neon-green/30 animate-pulse blur-[2px]"
            style="animation-delay: 1.1s"
          ></div>
          <div
            class="absolute top-[5%] left-[40%] w-6 h-6 rounded-full bg-neon-green/25 animate-pulse blur-[2px]"
            style="animation-delay: 1.4s"
          ></div>
          <div
            class="absolute bottom-[10%] left-[60%] w-4 h-4 rounded-full bg-neon-green/50 animate-pulse"
            style="animation-delay: 0.1s"
          ></div>
          <div
            class="absolute top-[60%] right-[45%] w-3 h-3 rounded-full bg-neon-green/55 animate-pulse"
            style="animation-delay: 1.6s"
          ></div>
        </div>

        <!-- Grid Pattern Overlay -->
        <div
          class="absolute inset-0 opacity-[0.02]"
          style="background-image: linear-gradient(rgba(161, 255, 79, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(161, 255, 79, 0.3) 1px, transparent 1px); background-size: 60px 60px"
        ></div>
      </div>

      <!-- Content Container with Staggered Scroll Animation -->
      <div
        class="relative z-10 max-w-4xl mx-auto text-center px-6"
        scrollAnimation
        [scrollConfig]="{
          animation: 'custom',
          stagger: 0.12,
          staggerTarget: '.stagger-item',
          scrub: 0.6,
          start: 'top 90%',
          end: 'top 40%',
          from: { opacity: 0, y: 50 },
          to: { opacity: 1, y: 0 }
        }"
      >
        <!-- Badge -->
        <div class="mb-8 stagger-item">
          <span
            class="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm"
            style="background: linear-gradient(135deg, rgba(161, 255, 79, 0.15) 0%, rgba(16, 185, 129, 0.1) 100%); border-color: rgba(161, 255, 79, 0.3); color: rgb(161, 255, 79)"
          >
            <span class="relative flex h-2 w-2">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style="background: rgb(161, 255, 79)"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2"
                style="background: rgb(161, 255, 79)"
              ></span>
            </span>
            Ready to Build Amazing Experiences
          </span>
        </div>

        <!-- Main Headline -->
        <h2
          class="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight stagger-item"
        >
          <span class="block">Start Building</span>
          <span
            class="block bg-clip-text text-transparent"
            style="background-image: linear-gradient(135deg, rgb(161, 255, 79) 0%, rgb(16, 185, 129) 50%, rgb(6, 182, 212) 100%)"
          >
            Today
          </span>
        </h2>

        <!-- Subtitle -->
        <p
          class="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed stagger-item"
        >
          Install both libraries and start creating stunning Angular
          applications with immersive 3D experiences and smooth animations.
        </p>

        <!-- CTA Buttons -->
        <div class="flex flex-wrap gap-4 justify-center mb-12 stagger-item">
          <button
            class="group relative px-10 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:scale-105"
            style="background: linear-gradient(135deg, rgb(161, 255, 79) 0%, rgb(16, 185, 129) 100%); color: rgb(15, 23, 42)"
          >
            <span class="relative z-10">Get Started</span>
            <div
              class="absolute inset-0 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity"
              style="background: linear-gradient(135deg, rgb(161, 255, 79) 0%, rgb(16, 185, 129) 100%)"
            ></div>
          </button>
          <button
            class="px-10 py-4 rounded-full font-bold text-lg text-white border-2 border-white/30 hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm"
          >
            View Documentation
          </button>
        </div>

        <!-- Install Command -->
        <div class="inline-block max-w-full stagger-item">
          <div
            class="relative group px-6 py-4 rounded-xl border backdrop-blur-sm overflow-hidden"
            style="background: rgba(15, 23, 42, 0.8); border-color: rgba(161, 255, 79, 0.25)"
          >
            <!-- Glow effect on hover -->
            <div
              class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
              style="background: linear-gradient(135deg, rgba(161, 255, 79, 0.05) 0%, transparent 50%)"
            ></div>

            <div
              class="relative flex items-center gap-3 flex-wrap justify-center"
            >
              <span class="text-gray-400 text-sm font-mono">$</span>
              <code
                class="font-mono text-sm md:text-base"
                style="color: rgb(161, 255, 79)"
              >
                npm install &#64;hive-academy/angular-3d
                &#64;hive-academy/angular-gsap
              </code>

              <!-- Copy Button -->
              <button
                class="p-2 rounded-lg transition-all duration-200 hover:scale-110"
                style="background: rgba(161, 255, 79, 0.1)"
                title="Copy to clipboard"
              >
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  style="color: rgb(161, 255, 79)"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Library Pills -->
        <div class="flex flex-wrap justify-center gap-3 mt-10 stagger-item">
          <span
            class="px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm"
            style="background: rgba(161, 255, 79, 0.1); border-color: rgba(161, 255, 79, 0.2); color: rgba(161, 255, 79, 0.9)"
          >
            &#64;hive-academy/angular-3d
          </span>
          <span class="text-gray-500 flex items-center">+</span>
          <span
            class="px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm"
            style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.2); color: rgba(6, 182, 212, 0.9)"
          >
            &#64;hive-academy/angular-gsap
          </span>
          <span class="text-gray-500 flex items-center">→</span>
          <span
            class="px-4 py-2 rounded-full text-sm font-semibold border backdrop-blur-sm"
            style="background: rgba(139, 92, 246, 0.1); border-color: rgba(139, 92, 246, 0.2); color: rgba(139, 92, 246, 0.9)"
          >
            ✨ Amazing Apps
          </span>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 0.3;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.2);
        }
      }

      .animate-pulse {
        animation: pulse 3s ease-in-out infinite;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtaSectionComponent {}
