import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  TorusComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  BloomEffectComponent,
  Float3dDirective,
  Rotate3dDirective,
  Glow3dDirective,
  SpaceFlight3dDirective,
  MouseTracking3dDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Directives Section - Animation and behavior directives.
 *
 * Contains 2 grouped scenes:
 * 1. Float & Rotate (basic animation directives)
 * 2. Advanced (glow, mouse tracking, space flight)
 */
@Component({
  selector: 'app-directives-section',
  imports: [
    Scene3dComponent,
    BoxComponent,
    TorusComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    BloomEffectComponent,
    Float3dDirective,
    Rotate3dDirective,
    Glow3dDirective,
    SpaceFlight3dDirective,
    MouseTracking3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Basic Animation Directives -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Basic Animations</h2>
          <p class="text-text-secondary">
            Float and rotate directives for simple motion
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 10]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

            <!-- Float slow -->
            <a3d-box
              [position]="[-4, 0, 0]"
              [color]="colors.indigo"
              float3d
              [floatConfig]="{ height: 0.3, speed: 4000 }"
            />

            <!-- Float fast -->
            <a3d-box
              [position]="[-1.3, 0, 0]"
              [color]="colors.pink"
              float3d
              [floatConfig]="{ height: 0.5, speed: 1500 }"
            />

            <!-- Rotate Y-axis -->
            <a3d-torus
              [position]="[1.3, 0, 0]"
              [color]="colors.amber"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 25 }"
            />

            <!-- Rotate X-axis -->
            <a3d-torus
              [position]="[4, 0, 0]"
              [color]="colors.emerald"
              rotate3d
              [rotateConfig]="{ axis: 'x', speed: 25 }"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-4 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-indigo-400">float3d (slow)</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-pink-400">float3d (fast)</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-amber-400">rotate3d (Y)</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-emerald-400">rotate3d (X)</code>
          </div>
        </div>
      </section>

      <!-- Advanced Directives -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Advanced Effects</h2>
          <p class="text-text-secondary">
            Glow, mouse tracking, and combined animations
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Glow Effect -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.5"
                />
                <a3d-box
                  [color]="colors.cyan"
                  a3dGlow3d
                  [glowIntensity]="2"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect
                  [threshold]="0.5"
                  [strength]="1.5"
                  [radius]="0.5"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-cyan-400"
                >a3dGlow3d + bloom-effect</code
              >
            </div>
          </div>

          <!-- Combined Directives -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.5"
                />
                <a3d-box
                  [color]="colors.hotPink"
                  float3d
                  [floatConfig]="{ height: 0.3, speed: 2000 }"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                  a3dGlow3d
                  [glowIntensity]="1.5"
                />
                <a3d-bloom-effect [threshold]="0.5" [strength]="1.2" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-pink-400"
                >float3d + rotate3d + glow</code
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Mouse Tracking Demo -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Interactive Directives
          </h2>
          <p class="text-text-secondary">
            Mouse tracking - hover over the scene
          </p>
        </div>

        <div class="max-w-2xl mx-auto">
          <div
            class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
          >
            <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
              <a3d-ambient-light [intensity]="0.5" />
              <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />
              <a3d-box
                [color]="colors.orange"
                mouseTracking3d
                [trackingConfig]="{ sensitivity: 0.5, damping: 0.1 }"
              />
            </a3d-scene-3d>
          </div>
          <div class="mt-3x text-center">
            <code class="text-sm text-orange-400"
              >&lt;a3d-box mouseTracking3d /&gt;</code
            >
            <p class="text-xs text-text-tertiary mt-1">
              Object follows mouse cursor
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class DirectivesSectionComponent {
  public readonly colors = SCENE_COLORS;
}
