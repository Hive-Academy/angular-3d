import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  TorusComponent,
  SphereComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  BloomEffectComponent,
  ColorGradingEffectComponent,
  ChromaticAberrationEffectComponent,
  FilmGrainEffectComponent,
  SelectiveBloomEffectComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Postprocessing Advanced Effects Section
 *
 * Showcases cinematic postprocessing effects:
 * - Chromatic Aberration (lens distortion)
 * - Film Grain (vintage cinema aesthetics)
 * - Selective Bloom (layer-based glow)
 */
@Component({
  selector: 'app-postprocessing-advanced-section',
  imports: [
    Scene3dComponent,
    BoxComponent,
    TorusComponent,
    SphereComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    BloomEffectComponent,
    ColorGradingEffectComponent,
    ChromaticAberrationEffectComponent,
    FilmGrainEffectComponent,
    SelectiveBloomEffectComponent,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Chromatic Aberration -->
      @defer (on viewport) {
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Chromatic Aberration</h2>
          <p class="text-text-secondary">
            RGB channel offset for cinematic lens distortion
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- No Aberration -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-torus
                  [color]="colors.cyan"
                  [emissive]="colors.cyan"
                  [emissiveIntensity]="1"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect [threshold]="0.5" [strength]="1" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">No Aberration</p>
              <code class="text-xs text-text-tertiary">Default</code>
            </div>
          </div>

          <!-- Subtle Radial -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-torus
                  [color]="colors.pink"
                  [emissive]="colors.pink"
                  [emissiveIntensity]="1"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect [threshold]="0.5" [strength]="1" />
                <a3d-chromatic-aberration-effect
                  [intensity]="0.02"
                  direction="radial"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Subtle Radial</p>
              <code class="text-xs text-pink-400">intensity: 0.02</code>
            </div>
          </div>

          <!-- Strong Horizontal -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-torus
                  [color]="colors.neonGreen"
                  [emissive]="colors.neonGreen"
                  [emissiveIntensity]="1"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect [threshold]="0.5" [strength]="1" />
                <a3d-chromatic-aberration-effect
                  [intensity]="0.05"
                  direction="horizontal"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Anamorphic</p>
              <code class="text-xs text-green-400">horizontal: 0.05</code>
            </div>
          </div>
        </div>
      </section>
      } @placeholder {
      <div
        class="max-w-container mx-auto px-4x h-96 flex items-center justify-center"
      >
        <p class="text-text-tertiary">Loading Chromatic Aberration demos...</p>
      </div>
      }

      <!-- Film Grain -->
      @defer (on viewport) {
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Film Grain</h2>
          <p class="text-text-secondary">
            Animated noise overlay for vintage cinema aesthetics
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- No Grain -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-sphere
                  [position]="[0, 0, 0]"
                  [color]="colors.cyan"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Clean</p>
              <code class="text-xs text-text-tertiary">No grain</code>
            </div>
          </div>

          <!-- Subtle Grain -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-sphere
                  [position]="[0, 0, 0]"
                  [color]="colors.pink"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
                <a3d-film-grain-effect [intensity]="0.08" [speed]="1" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Modern Digital</p>
              <code class="text-xs text-pink-400">intensity: 0.08</code>
            </div>
          </div>

          <!-- Heavy Grain -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-sphere
                  [position]="[0, 0, 0]"
                  [color]="colors.neonGreen"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
                <a3d-film-grain-effect [intensity]="0.25" [speed]="1.5" />
                <a3d-color-grading-effect
                  [saturation]="0.7"
                  [vignette]="0.35"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Vintage Film</p>
              <code class="text-xs text-green-400">intensity: 0.25</code>
            </div>
          </div>
        </div>
      </section>
      } @placeholder {
      <div
        class="max-w-container mx-auto px-4x h-96 flex items-center justify-center"
      >
        <p class="text-text-tertiary">Loading Film Grain demos...</p>
      </div>
      }

      <!-- Selective Bloom -->
      @defer (on viewport) {
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Selective Bloom</h2>
          <p class="text-text-secondary">
            Layer-based bloom - only specific objects glow
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Regular Bloom (all objects) -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-amber-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                Regular Bloom
              </div>
              <div
                class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
              >
                <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                  <a3d-ambient-light [intensity]="0.3" />
                  <a3d-directional-light
                    [position]="[3, 3, 3]"
                    [intensity]="0.5"
                  />

                  <!-- Center glowing torus -->
                  <a3d-torus
                    [position]="[0, 0, 0]"
                    [color]="colors.cyan"
                    [emissive]="colors.cyan"
                    [emissiveIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <!-- Non-glowing boxes -->
                  <a3d-box
                    [position]="[-2, 0, 0]"
                    [color]="colors.softGray"
                    rotate3d
                    [rotateConfig]="{ axis: 'x', speed: 12 }"
                  />
                  <a3d-box
                    [position]="[2, 0, 0]"
                    [color]="colors.softGray"
                    rotate3d
                    [rotateConfig]="{ axis: 'z', speed: 12 }"
                  />

                  <!-- Regular bloom affects everything -->
                  <a3d-bloom-effect
                    [threshold]="0.5"
                    [strength]="1.5"
                    [radius]="0.5"
                  />
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">
                Bloom affects all emissive objects equally
              </p>
              <code class="text-xs text-amber-400"
                >&lt;a3d-bloom-effect /&gt;</code
              >
            </div>
          </div>

          <!-- Selective Bloom (layer-based) -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                Selective Bloom
              </div>
              <div
                class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
              >
                <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                  <a3d-ambient-light [intensity]="0.3" />
                  <a3d-directional-light
                    [position]="[3, 3, 3]"
                    [intensity]="0.5"
                  />

                  <!-- Center glowing torus (on bloom layer) -->
                  <a3d-torus
                    [position]="[0, 0, 0]"
                    [color]="colors.pink"
                    [emissive]="colors.pink"
                    [emissiveIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <!-- Non-glowing boxes (regular layer) -->
                  <a3d-box
                    [position]="[-2, 0, 0]"
                    [color]="colors.softGray"
                    rotate3d
                    [rotateConfig]="{ axis: 'x', speed: 12 }"
                  />
                  <a3d-box
                    [position]="[2, 0, 0]"
                    [color]="colors.softGray"
                    rotate3d
                    [rotateConfig]="{ axis: 'z', speed: 12 }"
                  />

                  <!-- Selective bloom only affects layer 1 -->
                  <a3d-selective-bloom-effect
                    [layer]="1"
                    [threshold]="0"
                    [strength]="2"
                    [radius]="0.4"
                  />
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">
                Only objects on layer 1 bloom - true neon effect
              </p>
              <code class="text-xs text-green-400"
                >&lt;a3d-selective-bloom-effect [layer]="1" /&gt;</code
              >
            </div>
          </div>
        </div>
      </section>
      } @placeholder {
      <div
        class="max-w-container mx-auto px-4x h-96 flex items-center justify-center"
      >
        <p class="text-text-tertiary">Loading Selective Bloom demos...</p>
      </div>
      }
    </div>
  `,
})
export default class PostprocessingAdvancedSectionComponent {
  public readonly colors = SCENE_COLORS;
}
