import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  PlanetComponent,
  StarFieldComponent,
  NebulaComponent,
  NebulaVolumetricComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Space Section - Space-themed 3D components.
 *
 * Contains 2 grouped scenes:
 * 1. Planetary (Planet with starfield background)
 * 2. Nebulae (Particle and volumetric nebulas)
 */
@Component({
  selector: 'app-space-section',
  imports: [
    Scene3dComponent,
    PlanetComponent,
    StarFieldComponent,
    NebulaComponent,
    NebulaVolumetricComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Planetary Scene -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Planetary Scene</h2>
          <p class="text-text-secondary">
            Planet with atmospheric glow and star field backdrop
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 12]">
            <a3d-ambient-light [intensity]="0.3" />
            <a3d-directional-light [position]="[10, 5, 5]" [intensity]="1" />

            <!-- Starfield background -->
            <a3d-star-field [starCount]="3000" />

            <!-- Planet -->
            <a3d-planet
              [position]="[0, 0, 0]"
              [radius]="2"
              [color]="colors.cyan"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 5 }"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-2 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-cyan-400">&lt;a3d-planet /&gt;</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-white/60">&lt;a3d-star-field /&gt;</code>
          </div>
        </div>
      </section>

      <!-- Nebula Scene -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Nebula Effects</h2>
          <p class="text-text-secondary">
            Particle-based and volumetric nebula clouds
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Particle Nebula -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 15]">
                <a3d-nebula
                  [cloudCount]="80"
                  [colorPalette]="['#8b5cf6', '#ec4899', '#06b6d4']"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-violet-400">&lt;a3d-nebula /&gt;</code>
              <p class="text-xs text-text-tertiary mt-1x">
                Particle-based clouds
              </p>
            </div>
          </div>

          <!-- Volumetric Nebula -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 25]">
                <a3d-nebula-volumetric
                  [position]="[0, 0, 0]"
                  [width]="50"
                  [height]="25"
                  [primaryColor]="'#8b5cf6'"
                  [secondaryColor]="'#d946ef'"
                  [opacity]="0.5"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-fuchsia-400"
                >&lt;a3d-nebula-volumetric /&gt;</code
              >
              <p class="text-xs text-text-tertiary mt-1x">
                Shader-based volume
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class SpaceSectionComponent {
  public readonly colors = SCENE_COLORS;
}
