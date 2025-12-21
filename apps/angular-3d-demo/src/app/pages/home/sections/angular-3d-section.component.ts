import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  Scene3dComponent,
  PolyhedronComponent,
  BoxComponent,
  TorusComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  Rotate3dDirective,
  Float3dDirective,
} from '@hive-academy/angular-3d';

/**
 * Angular-3D Library Section Component
 *
 * Full-width showcase section for the @hive-academy/angular-3d library.
 * Full viewport height with 3D scene and content in two columns.
 */
@Component({
  selector: 'app-angular-3d-section',
  imports: [
    RouterLink,
    Scene3dComponent,
    PolyhedronComponent,
    BoxComponent,
    TorusComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    Rotate3dDirective,
    Float3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="min-h-screen bg-gradient-to-b from-background-dark to-gray-900 text-white relative overflow-hidden"
    >
      <!-- Background gradient -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-neon-green/5 pointer-events-none"
      ></div>

      <!-- Main Content -->
      <div class="relative z-10 max-w-7xl mx-auto px-4x py-20x">
        <div class="grid lg:grid-cols-2 gap-16x items-center min-h-[80vh]">
          <!-- LEFT: 3D Scene -->
          <div
            class="relative rounded-2xl overflow-hidden border border-primary-500/20 bg-background-dark/50 backdrop-blur-sm"
            style="min-height: 500px"
          >
            <a3d-scene-3d [cameraPosition]="[0, 0, 8]" [cameraFov]="60">
              <!-- Lighting -->
              <a3d-ambient-light [intensity]="0.4" />
              <a3d-directional-light
                [position]="[5, 5, 5]"
                [intensity]="1"
                [color]="'#A1FF4F'"
              />

              <!-- Enhanced Star Field with depth layers -->
              <a3d-star-field
                [starCount]="2000"
                [radius]="50"
                [enableTwinkle]="true"
                [stellarColors]="true"
                [multiSize]="true"
              />

              <!-- Floating Geometric Shapes -->
              <a3d-polyhedron
                [type]="'icosahedron'"
                [position]="[0, 0, 0]"
                [args]="[1, 0]"
                [color]="'#6366F1'"
                [wireframe]="true"
                rotate3d
                [rotateConfig]="{ axis: 'y', speed: 1.5 }"
              />

              <a3d-box
                [position]="[-2.5, 1.5, -1]"
                [args]="[0.8, 0.8, 0.8]"
                [color]="'#A1FF4F'"
                rotate3d
                [rotateConfig]="{ axis: 'xyz', speed: 2 }"
                float3d
                [floatConfig]="{ height: 0.3, speed: 3000 }"
              />

              <a3d-torus
                [position]="[2.5, -1, -1]"
                [args]="[0.6, 0.2, 16, 100]"
                [color]="'#D946EF'"
                float3d
                [floatConfig]="{ height: 0.4, speed: 4000 }"
              />

              <a3d-torus
                [position]="[-1.5, -1.5, 0]"
                [args]="[0.5, 0.12, 16, 100]"
                [color]="'#4FFFDF'"
                rotate3d
                [rotateConfig]="{ axis: 'x', speed: 1 }"
              />

              <a3d-polyhedron
                [type]="'octahedron'"
                [position]="[1.5, 1.5, -2]"
                [args]="[0.6, 0]"
                [color]="'#FF6BD4'"
                [wireframe]="true"
                rotate3d
                [rotateConfig]="{ axis: 'z', speed: 1.2 }"
                float3d
                [floatConfig]="{ height: 0.25, speed: 3500 }"
              />
            </a3d-scene-3d>

            <!-- Overlay gradient -->
            <div
              class="absolute inset-0 bg-gradient-to-t from-background-dark/80 via-transparent to-transparent pointer-events-none"
            ></div>
          </div>

          <!-- RIGHT: Content -->
          <div class="flex flex-col justify-center">
            <!-- Package Badge -->
            <div class="flex items-center gap-3 mb-6x">
              <span
                class="px-3x py-1x bg-primary-500/20 border border-primary-500/40 rounded-full text-primary-400 text-body-sm font-mono"
              >
                @hive-academy/angular-3d
              </span>
            </div>

            <!-- Headline -->
            <h2
              class="text-display-md lg:text-display-lg font-bold text-white leading-tight mb-6x"
            >
              Build <span class="text-neon-green">Stunning 3D</span> Experiences
              with Angular
            </h2>

            <!-- Description -->
            <p class="text-body-lg text-gray-300 leading-relaxed mb-8x">
              Pure Angular wrapper for Three.js. Create immersive 3D scenes
              using declarative components, not imperative code. Signal-based
              reactivity with automatic resource cleanup.
            </p>

            <!-- Capabilities Grid -->
            <div class="grid grid-cols-2 gap-3x mb-8x">
              @for (capability of capabilities; track capability) {
              <div
                class="flex items-center gap-3x py-3x px-4x rounded-xl bg-white/5 border border-white/10 hover:border-neon-green/30 transition-colors group"
              >
                <div
                  class="flex items-center justify-center w-8 h-8 rounded-lg bg-neon-green/20 text-neon-green"
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
                  class="text-body-md text-gray-200 group-hover:text-white transition-colors"
                >
                  {{ capability }}
                </span>
              </div>
              }
            </div>

            <!-- Metric Badge -->
            <div
              class="inline-flex items-center gap-4x px-6x py-4x bg-gradient-to-r from-primary-500/20 to-neon-green/20 rounded-xl border border-primary-500/30 mb-8x"
            >
              <div
                class="text-display-md font-bold bg-gradient-to-br from-primary-400 to-neon-green bg-clip-text text-transparent"
              >
                27+
              </div>
              <div>
                <div class="text-body-lg font-bold text-white">Primitives</div>
                <div class="text-body-sm text-gray-400">
                  Ready-to-use 3D components
                </div>
              </div>
            </div>

            <!-- CTA Button -->
            <a
              routerLink="/angular-3d"
              class="inline-flex items-center gap-2x px-8x py-4x bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 hover:shadow-neon-green transition-all duration-250 w-fit"
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
        </div>
      </div>
    </section>
  `,
})
export class Angular3dSectionComponent {
  public readonly capabilities = [
    '27+ Primitives',
    'GLTF Model Loading',
    'Post-processing Effects',
    'OrbitControls',
    'Signal-based State',
    'Animation Directives',
    'Scene Lighting',
    'Texture Support',
  ];
}
