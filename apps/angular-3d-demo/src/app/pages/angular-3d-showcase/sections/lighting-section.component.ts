import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  TorusComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
  SceneLightingComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Lighting Section - Demonstrates all light types in one scene.
 *
 * Shows a row of torus objects, each lit by a different light type
 * for direct comparison.
 */
@Component({
  selector: 'app-lighting-section',
  imports: [
    Scene3dComponent,
    TorusComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    SpotLightComponent,
    SceneLightingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Light Types Comparison -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Light Types Comparison
          </h2>
          <p class="text-text-secondary">
            Side-by-side comparison of 5 different light types
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 2, 14]">
            <!-- Base ambient for visibility -->
            <a3d-ambient-light [intensity]="0.15" />

            <!-- Torus 1: Ambient Light Only -->
            <a3d-torus [position]="[-6, 0, 0]" [color]="colors.indigo" />
            <a3d-ambient-light [intensity]="0.6" [color]="colors.white" />

            <!-- Torus 2: Directional Light -->
            <a3d-torus [position]="[-3, 0, 0]" [color]="colors.indigo" />
            <a3d-directional-light
              [position]="[-3, 3, 5]"
              [intensity]="1.5"
              [color]="colors.neonGreen"
            />

            <!-- Torus 3: Point Light -->
            <a3d-torus [position]="[0, 0, 0]" [color]="colors.indigo" />
            <a3d-point-light
              [position]="[0, 2, 2]"
              [intensity]="3"
              [color]="colors.cyan"
            />

            <!-- Torus 4: Spot Light -->
            <a3d-torus [position]="[3, 0, 0]" [color]="colors.indigo" />
            <a3d-spot-light
              [position]="[3, 3, 3]"
              [angle]="0.5"
              [intensity]="4"
              [color]="colors.amber"
              [target]="[3, 0, 0]"
            />

            <!-- Torus 5: Scene Lighting (pre-configured) -->
            <a3d-torus [position]="[6, 0, 0]" [color]="colors.indigo" />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-5 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-white/60">ambient</code>
            <p class="text-xs text-text-tertiary mt-1">Global</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-green-400">directional</code>
            <p class="text-xs text-text-tertiary mt-1">Sun-like</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-cyan-400">point</code>
            <p class="text-xs text-text-tertiary mt-1">Omnidirectional</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-amber-400">spot</code>
            <p class="text-xs text-text-tertiary mt-1">Cone-shaped</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-violet-400">scene</code>
            <p class="text-xs text-text-tertiary mt-1">Pre-configured</p>
          </div>
        </div>
      </section>

      <!-- Individual Light Examples -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Individual Light Details
          </h2>
          <p class="text-text-secondary">
            Isolated examples of each light type
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- Directional Light -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.1" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="1.5"
                  [color]="colors.neonGreen"
                />
                <a3d-torus [color]="colors.indigo" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-green-400"
                >&lt;a3d-directional-light /&gt;</code
              >
            </div>
          </div>

          <!-- Point Light -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.1" />
                <a3d-point-light
                  [position]="[1.5, 1.5, 1.5]"
                  [intensity]="3"
                  [color]="colors.cyan"
                />
                <a3d-torus [color]="colors.indigo" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-cyan-400"
                >&lt;a3d-point-light /&gt;</code
              >
            </div>
          </div>

          <!-- Spot Light -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.1" />
                <a3d-spot-light
                  [position]="[0, 3, 2]"
                  [angle]="0.4"
                  [intensity]="4"
                  [color]="colors.amber"
                  [target]="[0, 0, 0]"
                />
                <a3d-torus [color]="colors.indigo" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-amber-400"
                >&lt;a3d-spot-light /&gt;</code
              >
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class LightingSectionComponent {
  public readonly colors = SCENE_COLORS;
}
