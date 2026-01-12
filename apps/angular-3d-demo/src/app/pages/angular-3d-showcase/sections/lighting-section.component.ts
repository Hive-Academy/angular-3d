import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BoxComponent,
  DirectionalLightComponent,
  PointLightComponent,
  Scene3dComponent,
  SceneLightingComponent,
  SphereComponent,
  SpotLightComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Lighting Section - Demonstrates scene lighting presets and individual light types.
 *
 * OPTIMIZED: Reduced to 3 WebGL contexts by combining demos.
 * Uses spheres for better lighting visualization (curved surfaces show light gradients).
 */
@Component({
  selector: 'app-lighting-section',
  imports: [
    Scene3dComponent,
    SphereComponent,
    BoxComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    SpotLightComponent,
    SceneLightingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Scene Lighting Presets - ONE COMBINED SCENE with SPHERES -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Scene Lighting Presets
          </h2>
          <p class="text-text-secondary">
            Pre-configured lighting setups for common scenarios
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 3, 16]">
            <!-- Studio Lighting (leftmost) -->
            <a3d-scene-lighting preset="studio" />

            <!-- Ground platform for shadow visualization -->
            <a3d-box
              [position]="[0, -2, 0]"
              [args]="[30, 0.2, 10]"
              [color]="colors.softGray"
            />

            <!-- Sphere 1: Shows studio lighting -->
            <a3d-sphere
              [position]="[-9, 0.5, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.indigo"
              [metalness]="0.3"
              [roughness]="0.4"
            />
            <a3d-box
              [position]="[-9, -1.2, 0]"
              [args]="[0.8, 0.8, 0.8]"
              [color]="colors.pink"
              [rotation]="[0.5, 0.5, 0]"
            />

            <!-- Sphere 2: Shows outdoor lighting -->
            <a3d-sphere
              [position]="[-3, 0.5, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.neonGreen"
              [metalness]="0.2"
              [roughness]="0.5"
            />
            <a3d-box
              [position]="[-3, -1.2, 0]"
              [args]="[0.8, 0.8, 0.8]"
              [color]="colors.cyan"
              [rotation]="[0.5, 0.5, 0]"
            />

            <!-- Sphere 3: Shows dramatic lighting -->
            <a3d-sphere
              [position]="[3, 0.5, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.pink"
              [metalness]="0.4"
              [roughness]="0.3"
            />
            <a3d-box
              [position]="[3, -1.2, 0]"
              [args]="[0.8, 0.8, 0.8]"
              [color]="colors.amber"
              [rotation]="[0.5, 0.5, 0]"
            />

            <!-- Sphere 4: Shows custom lighting -->
            <a3d-sphere
              [position]="[9, 0.5, 0]"
              [args]="[1.5, 64, 64]"
              [color]="colors.amber"
              [metalness]="0.5"
              [roughness]="0.2"
            />
            <a3d-box
              [position]="[9, -1.2, 0]"
              [args]="[0.8, 0.8, 0.8]"
              [color]="colors.violet"
              [rotation]="[0.5, 0.5, 0]"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-4 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-sm text-violet-400">preset="studio"</code>
            <p class="text-xs text-text-tertiary mt-1">Key + fill lights</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-sm text-green-400">preset="outdoor"</code>
            <p class="text-xs text-text-tertiary mt-1">Sun simulation</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-sm text-pink-400">preset="dramatic"</code>
            <p class="text-xs text-text-tertiary mt-1">Single spotlight</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-sm text-amber-400">preset="custom"</code>
            <p class="text-xs text-text-tertiary mt-1">Full control</p>
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

      <!-- Individual Light Types - SPHERES WITH COLORED LIGHTS -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Individual Light Types
          </h2>
          <p class="text-text-secondary">
            See how each light type affects a sphere's surface
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 2, 14]">
            <!-- Very low base ambient for contrast -->
            <a3d-ambient-light [intensity]="0.08" />

            <!-- Ground for context -->
            <a3d-box
              [position]="[0, -2.5, 0]"
              [args]="[20, 0.2, 8]"
              [color]="'#222222'"
            />

            <!-- Sphere 1: Ambient Only (barely visible) -->
            <a3d-sphere
              [position]="[-6, 0, 0]"
              [args]="[1.2, 64, 64]"
              [color]="colors.white"
              [metalness]="0.2"
              [roughness]="0.6"
            />

            <!-- Sphere 2: Directional Light (sun-like parallel rays) -->
            <a3d-sphere
              [position]="[-3, 0, 0]"
              [args]="[1.2, 64, 64]"
              [color]="colors.white"
              [metalness]="0.2"
              [roughness]="0.6"
            />
            <a3d-directional-light
              [position]="[-3, 4, 5]"
              [intensity]="2"
              [color]="colors.neonGreen"
            />

            <!-- Sphere 3: Point Light (omnidirectional) -->
            <a3d-sphere
              [position]="[0, 0, 0]"
              [args]="[1.2, 64, 64]"
              [color]="colors.white"
              [metalness]="0.2"
              [roughness]="0.6"
            />
            <a3d-point-light
              [position]="[0, 2.5, 2]"
              [intensity]="4"
              [color]="colors.cyan"
            />

            <!-- Sphere 4: Spot Light (cone of light) -->
            <a3d-sphere
              [position]="[3, 0, 0]"
              [args]="[1.2, 64, 64]"
              [color]="colors.white"
              [metalness]="0.2"
              [roughness]="0.6"
            />
            <a3d-spot-light
              [position]="[3, 4, 3]"
              [angle]="0.4"
              [intensity]="6"
              [color]="colors.amber"
              [target]="[3, 0, 0]"
            />

            <!-- Sphere 5: Multiple combined lights -->
            <a3d-sphere
              [position]="[6, 0, 0]"
              [args]="[1.2, 64, 64]"
              [color]="colors.white"
              [metalness]="0.2"
              [roughness]="0.6"
            />
            <a3d-directional-light
              [position]="[6, 3, 4]"
              [intensity]="1.2"
              [color]="colors.pink"
            />
            <a3d-point-light
              [position]="[6.5, 1, 2]"
              [intensity]="2"
              [color]="colors.cyan"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-5 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-white/60">ambient</code>
            <p class="text-xs text-text-tertiary mt-1">Global (dim)</p>
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
            <p class="text-xs text-text-tertiary mt-1">Multi-light</p>
          </div>
        </div>
      </section>

      <!-- Light Details - ROTATING SPHERES with different materials -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Light Details</h2>
          <p class="text-text-secondary">
            Material properties affect how light interacts with surfaces
          </p>
        </div>

        <div
          class="aspect-[21/7] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 1, 9]">
            <a3d-ambient-light [intensity]="0.1" />

            <!-- Ground -->
            <a3d-box
              [position]="[0, -2, 0]"
              [args]="[16, 0.2, 6]"
              [color]="colors.indigo"
            />

            <!-- Matte sphere (high roughness) -->
            <a3d-directional-light
              [position]="[-5, 4, 4]"
              [intensity]="2"
              [color]="colors.neonGreen"
            />
            <a3d-sphere
              [position]="[-4, 0, 0]"
              [args]="[1.3, 64, 64]"
              [color]="colors.indigo"
              [metalness]="0.0"
              [roughness]="0.9"
            />

            <!-- Semi-glossy sphere (medium roughness) -->
            <a3d-point-light
              [position]="[0, 3, 3]"
              [intensity]="5"
              [color]="colors.cyan"
            />
            <a3d-sphere
              [position]="[0, 0, 0]"
              [args]="[1.3, 64, 64]"
              [color]="colors.indigo"
              [metalness]="0.3"
              [roughness]="0.4"
            />

            <!-- Metallic sphere (high metalness, low roughness) -->
            <a3d-spot-light
              [position]="[4, 4, 3]"
              [angle]="0.4"
              [intensity]="6"
              [color]="colors.amber"
              [target]="[4, 0, 0]"
            />
            <a3d-sphere
              [position]="[4, 0, 0]"
              [args]="[1.3, 64, 64]"
              [color]="colors.indigo"
              [metalness]="0.9"
              [roughness]="0.1"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-3 gap-8x">
          <div class="p-3x bg-white/5 rounded-lg text-center">
            <code class="text-sm text-green-400">roughness: 0.9</code>
            <p class="text-xs text-text-tertiary mt-2">
              Matte surface - diffuse light scattering
            </p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg text-center">
            <code class="text-sm text-cyan-400">roughness: 0.4</code>
            <p class="text-xs text-text-tertiary mt-2">
              Semi-glossy - balanced reflection
            </p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg text-center">
            <code class="text-sm text-amber-400">metalness: 0.9</code>
            <p class="text-xs text-text-tertiary mt-2">
              Metallic - sharp specular highlights
            </p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class LightingSectionComponent {
  public readonly colors = SCENE_COLORS;
}
