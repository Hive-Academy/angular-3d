/**
 * HexagonalCTADemoComponent - Neon Honeycomb with CSS 3D Text
 *
 * Showcases stunning neon honeycomb background with:
 * - Vibrant electric neon colors (cyan, magenta, purple)
 * - Shiny metallic hexagons with bloom glow
 * - Edge-pulsing animation
 * - Mouse-interactive with color shifts
 * - HTML text with CSS 3D transforms
 * - Pure eye candy!
 *
 * NOTE: Uses `data-lenis-prevent` on parent section to prevent
 * Lenis smooth scroll conflict with OrbitControls zoom/rotate.
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  HexagonalBackgroundInstancedComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  OrbitControlsComponent,
  EffectComposerComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-hexagonal-features-demo',
  standalone: true,
  imports: [
    Scene3dComponent,
    HexagonalBackgroundInstancedComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    OrbitControlsComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="cta-section relative min-h-screen overflow-hidden bg-black"
      data-lenis-prevent
    >
      <!-- NEON HONEYCOMB 3D Background (z-0) -->
      <div class="absolute inset-0 z-0">
        <a3d-scene-3d
          [cameraPosition]="[0, -2, 4]"
          [backgroundColor]="colorNums.black"
        >
          <!-- NEON LIGHTING SETUP - Multiple colored lights for metallic reflections -->
          <!-- Base ambient illumination -->
          <a3d-ambient-light [color]="colorNums.white" [intensity]="0.3" />

          <!-- Key light - Cyan from front-top-left -->
          <a3d-point-light
            [color]="colorNums.neonCyan"
            [intensity]="80"
            [distance]="50"
            [decay]="2"
            [position]="[-5, 3, 5]"
          />

          <!-- Fill light - Pink from front-top-right -->
          <a3d-point-light
            [color]="colorNums.neonPink"
            [intensity]="120"
            [distance]="50"
            [decay]="2"
            [position]="[5, 3, 5]"
          />

          <!-- Rim light - Purple from back -->
          <a3d-point-light
            [color]="colorNums.neonPurple"
            [intensity]="100"
            [distance]="50"
            [decay]="2"
            [position]="[0, -3, -5]"
          />

          <!-- Side accent - Magenta from left -->
          <a3d-point-light
            [color]="colorNums.magenta"
            [intensity]="80"
            [distance]="40"
            [decay]="2"
            [position]="[-8, 0, 0]"
          />

          <!-- Side accent - Cyan from right -->
          <a3d-point-light
            [color]="colorNums.cyan"
            [intensity]="50"
            [distance]="40"
            [decay]="2"
            [position]="[8, 0, 0]"
          />

          <!-- Top directional for overall shaping -->
          <a3d-directional-light
            [color]="colorNums.white"
            [intensity]="0.5"
            [position]="[0, 10, 0]"
          />

          <!-- ELECTRIC NEON HONEYCOMB -->
          <a3d-hexagonal-background-instanced
            [circleCount]="12"
            [shape]="'hexagon'"
            [baseColor]="colorNums.black"
            [edgeColor]="colorNums.neonCyan"
            [edgePulse]="true"
            [hoverColor]="colorNums.neonPink"
            [hexRadius]="0.5"
            [hexHeight]="0.2"
            [roughness]="0.1"
            [metalness]="0.9"
            [animationSpeed]="0.5"
            [depthAmplitude]="0.15"
            [rotationAmplitude]="0.08"
            [mouseInfluenceRadius]="3.5"
            [bloomLayer]="1"
          />

          <!-- Orbit controls -->
          <a3d-orbit-controls
            [enableDamping]="false"
            [dampingFactor]="0.05"
            [enableZoom]="true"
            [minDistance]="2"
            [maxDistance]="10"
            [autoRotate]="true"
            [autoRotateSpeed]="0.4"
          />

          <!-- Bloom Effect - Subtle neon glow -->
          <a3d-effect-composer>
            <a3d-bloom-effect
              [threshold]="0.5"
              [strength]="1.2"
              [radius]="0.4"
            />
          </a3d-effect-composer>
        </a3d-scene-3d>
      </div>

      <!-- HTML TEXT with CSS 3D Effects (z-10) -->
      <div
        class="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6"
      >
        <!-- Top hint -->
        <div class="absolute top-8 left-1/2 -translate-x-1/2">
          <div class="hint-badge">
            <span class="ping-dot">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"
              ></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"
              ></span>
            </span>
            <span>Move your mouse • Drag to rotate • Scroll to zoom</span>
          </div>
        </div>

        <!-- Main Content -->
        <div class="text-center space-y-8">
          <!-- Headline -->
          <h1 class="headline">
            <span class="headline-text">BUILD THE FUTURE</span>
          </h1>

          <!-- Subtitle -->
          <h2 class="subtitle">
            <span class="subtitle-text">with Angular 3D</span>
          </h2>

          <!-- CTA -->
          <div class="cta-wrapper">
            <h3 class="cta-text">GET STARTED</h3>
            <a href="/angular-3d/primitives" class="cta-button">
              <span>Explore Components</span>
              <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="3"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
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
      :host {
        display: block;
      }

      .cta-section ::ng-deep a3d-scene-3d {
        width: 100%;
        height: 100%;
      }

      /* Hint Badge */
      .hint-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.5rem;
        background: rgba(6, 182, 212, 0.1);
        backdrop-filter: blur(12px);
        border-radius: 9999px;
        font-size: 0.875rem;
        font-weight: 500;
        color: rgb(103, 232, 249);
        border: 1px solid rgba(6, 182, 212, 0.3);
        box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
      }

      .ping-dot {
        position: relative;
        display: flex;
        height: 0.5rem;
        width: 0.5rem;
      }

      @keyframes ping {
        75%,
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      .animate-ping {
        animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
      }

      /* Headline - Massive 3D text */
      .headline {
        margin: 0;
        padding: 0;
        perspective: 1000px;
      }

      .headline-text {
        display: inline-block;
        font-size: clamp(3rem, 12vw, 9rem);
        font-weight: 900;
        line-height: 1;
        letter-spacing: -0.05em;
        font-style: italic;
        color: #06b6d4;
        text-shadow: 0 0 10px rgba(6, 182, 212, 0.8),
          0 0 20px rgba(6, 182, 212, 0.6), 0 0 30px rgba(6, 182, 212, 0.4),
          0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6),
          0 8px 16px rgba(0, 0, 0, 0.4);
        transform: rotateX(15deg) scale(1);
        transform-style: preserve-3d;
        animation: float 3s ease-in-out infinite;
      }

      @keyframes float {
        0%,
        100% {
          transform: rotateX(15deg) translateY(0) scale(1);
        }
        50% {
          transform: rotateX(15deg) translateY(-10px) scale(1.02);
        }
      }

      /* Subtitle - Elegant glow */
      .subtitle {
        margin: 1rem 0;
        padding: 0;
      }

      .subtitle-text {
        display: inline-block;
        font-size: clamp(1.5rem, 4vw, 3rem);
        font-weight: 600;
        color: #ec4899;
        text-shadow: 0 0 10px rgba(236, 72, 153, 0.8),
          0 0 20px rgba(236, 72, 153, 0.6), 0 2px 4px rgba(0, 0, 0, 0.6);
        animation: pulse 2s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.85;
          transform: scale(0.98);
        }
      }

      /* CTA Section */
      .cta-wrapper {
        margin-top: 3rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2rem;
      }

      .cta-text {
        margin: 0;
        font-size: clamp(2rem, 6vw, 4rem);
        font-weight: 900;
        font-style: italic;
        color: #a78bfa;
        text-shadow: 0 0 10px rgba(167, 139, 250, 0.8),
          0 0 20px rgba(167, 139, 250, 0.6), 0 0 30px rgba(167, 139, 250, 0.4),
          0 2px 4px rgba(0, 0, 0, 0.8);
        transform: scale(1);
        animation: bounce 2s ease-in-out infinite;
      }

      @keyframes bounce {
        0%,
        100% {
          transform: scale(1);
        }
        50% {
          transform: scale(1.05);
        }
      }

      .cta-button {
        display: inline-flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1.25rem 3rem;
        background: linear-gradient(135deg, #06b6d4, #a78bfa, #ec4899);
        background-size: 200% 200%;
        color: white;
        font-size: 1.25rem;
        font-weight: 800;
        border-radius: 9999px;
        text-decoration: none;
        box-shadow: 0 0 30px rgba(6, 182, 212, 0.5),
          0 10px 40px rgba(0, 0, 0, 0.6);
        transition: all 0.3s ease;
        animation: gradientShift 3s ease infinite;
      }

      @keyframes gradientShift {
        0%,
        100% {
          background-position: 0% 50%;
        }
        50% {
          background-position: 100% 50%;
        }
      }

      .cta-button:hover {
        transform: scale(1.1) translateY(-2px);
        box-shadow: 0 0 50px rgba(6, 182, 212, 0.8),
          0 15px 50px rgba(0, 0, 0, 0.8);
      }

      /* Responsive adjustments */
      @media (max-width: 640px) {
        .hint-badge {
          font-size: 0.75rem;
          padding: 0.5rem 1rem;
        }

        .cta-button {
          padding: 1rem 2rem;
          font-size: 1rem;
        }
      }
    `,
  ],
})
export class HexagonalFeaturesDemoComponent {
  protected readonly colorNums = SCENE_COLORS;
}
