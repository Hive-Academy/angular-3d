import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  TorusComponent,
  BoxComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  SpotLightComponent,
  SceneLightingComponent,
  EnvironmentComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Lighting Section - Demonstrates all light types and scene lighting presets.
 *
 * Shows:
 * 1. Scene Lighting Presets comparison (studio, outdoor, dramatic, custom)
 * 2. Individual light types comparison
 * 3. Detailed examples of each light type
 */
@Component({
  selector: 'app-lighting-section',
  imports: [
    Scene3dComponent,
    TorusComponent,
    BoxComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    SpotLightComponent,
    SceneLightingComponent,
    EnvironmentComponent,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Scene Lighting Presets -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Scene Lighting Presets
          </h2>
          <p class="text-text-secondary">
            Pre-configured lighting setups for common scenarios
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- Studio Preset -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 1, 5]">
                <a3d-scene-lighting preset="studio" />
                <a3d-torus
                  [position]="[0, 0.5, 0]"
                  [color]="colors.indigo"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
                <a3d-box
                  [position]="[0, -0.8, 0]"
                  [args]="[2, 0.3, 2]"
                  [color]="colors.softGray"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-violet-400">preset="studio"</code>
              <p class="text-xs text-text-tertiary mt-1">
                Key + fill lights, balanced ambient
              </p>
            </div>
          </div>

          <!-- Outdoor Preset -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 1, 5]">
                <a3d-scene-lighting preset="outdoor" />
                <a3d-torus
                  [position]="[0, 0.5, 0]"
                  [color]="colors.neonGreen"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
                <a3d-box
                  [position]="[0, -0.8, 0]"
                  [args]="[2, 0.3, 2]"
                  [color]="colors.softGray"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-green-400">preset="outdoor"</code>
              <p class="text-xs text-text-tertiary mt-1">
                Sun simulation, sky-blue ambient
              </p>
            </div>
          </div>

          <!-- Dramatic Preset -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 1, 5]">
                <a3d-scene-lighting preset="dramatic" />
                <a3d-torus
                  [position]="[0, 0.5, 0]"
                  [color]="colors.pink"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
                <a3d-box
                  [position]="[0, -0.8, 0]"
                  [args]="[2, 0.3, 2]"
                  [color]="colors.softGray"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-pink-400">preset="dramatic"</code>
              <p class="text-xs text-text-tertiary mt-1">
                Single spotlight, dark ambient
              </p>
            </div>
          </div>

          <!-- Custom Preset -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 1, 5]">
                <a3d-scene-lighting
                  preset="custom"
                  [ambientIntensity]="0.8"
                  [ambientColor]="colors.cyan"
                />
                <a3d-torus
                  [position]="[0, 0.5, 0]"
                  [color]="colors.amber"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
                <a3d-box
                  [position]="[0, -0.8, 0]"
                  [args]="[2, 0.3, 2]"
                  [color]="colors.softGray"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-amber-400">preset="custom"</code>
              <p class="text-xs text-text-tertiary mt-1">
                Custom ambient overrides
              </p>
            </div>
          </div>
        </div>

        <!-- Code example -->
        <div class="mt-6x p-4x bg-white/5 rounded-lg text-center">
          <p class="text-sm text-text-secondary mb-2">
            One line of code for complete lighting setup:
          </p>
          <code class="text-xs text-violet-400">
            &lt;a3d-scene-lighting preset="studio" /&gt;
          </code>
        </div>
      </section>

      <!-- Light Types Comparison -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Individual Light Types
          </h2>
          <p class="text-text-secondary">
            Low-level control with individual light components
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 2, 16]">
            <!-- Base ambient for visibility -->
            <a3d-ambient-light [intensity]="0.15" />

            <!-- Torus 1: Ambient Light Only -->
            <a3d-torus [position]="[-7.5, 0, 0]" [color]="colors.indigo" />
            <a3d-ambient-light [intensity]="0.6" [color]="colors.white" />

            <!-- Torus 2: Directional Light -->
            <a3d-torus [position]="[-4.5, 0, 0]" [color]="colors.indigo" />
            <a3d-directional-light
              [position]="[-4.5, 3, 5]"
              [intensity]="1.5"
              [color]="colors.neonGreen"
            />

            <!-- Torus 3: Point Light -->
            <a3d-torus [position]="[-1.5, 0, 0]" [color]="colors.indigo" />
            <a3d-point-light
              [position]="[-1.5, 2, 2]"
              [intensity]="3"
              [color]="colors.cyan"
            />

            <!-- Torus 4: Spot Light -->
            <a3d-torus [position]="[1.5, 0, 0]" [color]="colors.indigo" />
            <a3d-spot-light
              [position]="[1.5, 3, 3]"
              [angle]="0.5"
              [intensity]="4"
              [color]="colors.amber"
              [target]="[1.5, 0, 0]"
            />

            <!-- Torus 5: Combined -->
            <a3d-torus [position]="[4.5, 0, 0]" [color]="colors.indigo" />
            <a3d-directional-light
              [position]="[4.5, 5, 5]"
              [intensity]="1"
              [color]="colors.pink"
            />

            <!-- Torus 6: Environment (HDRI/IBL) -->
            <a3d-torus [position]="[7.5, 0, 0]" [color]="colors.indigo" />
            <a3d-environment
              [preset]="'studio'"
              [intensity]="1.5"
              [background]="false"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-6 gap-4x text-center text-sm">
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
            <code class="text-pink-400">combined</code>
            <p class="text-xs text-text-tertiary mt-1">Mix & match</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-orange-400">environment</code>
            <p class="text-xs text-text-tertiary mt-1">HDRI/IBL</p>
          </div>
        </div>
      </section>

      <!-- NEW SECTION: Environment HDRI Presets Gallery -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Environment HDRI Presets
          </h2>
          <p class="text-text-secondary">
            10 built-in environment presets for photorealistic lighting
          </p>
        </div>

        <div class="grid md:grid-cols-5 gap-6x">
          <!-- Preset 1: Sunset -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'sunset'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Sunset</p>
              <code class="text-xs text-orange-400">preset="sunset"</code>
            </div>
          </div>

          <!-- Preset 2: Dawn -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'dawn'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Dawn</p>
              <code class="text-xs text-blue-300">preset="dawn"</code>
            </div>
          </div>

          <!-- Preset 3: Night -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'night'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Night</p>
              <code class="text-xs text-indigo-400">preset="night"</code>
            </div>
          </div>

          <!-- Preset 4: Warehouse -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'warehouse'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Warehouse</p>
              <code class="text-xs text-gray-400">preset="warehouse"</code>
            </div>
          </div>

          <!-- Preset 5: Forest -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'forest'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Forest</p>
              <code class="text-xs text-green-500">preset="forest"</code>
            </div>
          </div>

          <!-- Preset 6: Apartment -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'apartment'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Apartment</p>
              <code class="text-xs text-amber-300">preset="apartment"</code>
            </div>
          </div>

          <!-- Preset 7: Studio -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'studio'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Studio</p>
              <code class="text-xs text-cyan-300">preset="studio"</code>
            </div>
          </div>

          <!-- Preset 8: City -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'city'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">City</p>
              <code class="text-xs text-violet-400">preset="city"</code>
            </div>
          </div>

          <!-- Preset 9: Park -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'park'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Park</p>
              <code class="text-xs text-green-400">preset="park"</code>
            </div>
          </div>

          <!-- Preset 10: Lobby -->
          <div>
            <div
              class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus
                  [color]="colors.softGray"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-environment
                  [preset]="'lobby'"
                  [intensity]="1.2"
                  [background]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Lobby</p>
              <code class="text-xs text-pink-300">preset="lobby"</code>
            </div>
          </div>
        </div>
      </section>

      <!-- Individual Light Examples -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Light Details</h2>
          <p class="text-text-secondary">
            Isolated examples with configurable properties
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
                <a3d-torus
                  [color]="colors.indigo"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-3x bg-white/5 rounded-lg">
              <code class="text-sm text-green-400">
                &lt;a3d-directional-light /&gt;
              </code>
              <p class="text-xs text-text-tertiary mt-2">
                Parallel rays like sunlight. Best for outdoor scenes.
              </p>
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
                <a3d-torus
                  [color]="colors.indigo"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-3x bg-white/5 rounded-lg">
              <code class="text-sm text-cyan-400">
                &lt;a3d-point-light /&gt;
              </code>
              <p class="text-xs text-text-tertiary mt-2">
                Emits in all directions like a light bulb.
              </p>
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
                <a3d-torus
                  [color]="colors.indigo"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-3x bg-white/5 rounded-lg">
              <code class="text-sm text-amber-400">
                &lt;a3d-spot-light /&gt;
              </code>
              <p class="text-xs text-text-tertiary mt-2">
                Focused cone of light. Great for dramatic effects.
              </p>
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
