import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  TorusComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  BloomEffectComponent,
  Glow3dDirective,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Postprocessing Section - Before/after bloom comparison.
 *
 * Side-by-side comparison of scenes with and without bloom effect.
 */
@Component({
  selector: 'app-postprocessing-section',
  imports: [
    Scene3dComponent,
    BoxComponent,
    TorusComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    BloomEffectComponent,
    Glow3dDirective,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Before/After Comparison -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Bloom Effect Comparison
          </h2>
          <p class="text-text-secondary">
            Before and after applying postprocessing bloom
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Without Bloom -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                Without Bloom
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

                  <a3d-torus
                    [position]="[0, 0, 0]"
                    [color]="colors.cyan"
                    a3dGlow3d
                    [glowIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[-1.8, 0, 0]"
                    [color]="colors.pink"
                    [args]="[0.8, 0.8, 0.8]"
                    a3dGlow3d
                    [glowIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'x', speed: 20 }"
                  />
                  <a3d-box
                    [position]="[1.8, 0, 0]"
                    [color]="colors.neonGreen"
                    [args]="[0.8, 0.8, 0.8]"
                    a3dGlow3d
                    [glowIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'z', speed: 18 }"
                  />
                  <!-- NO BLOOM -->
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                Objects have
                <code class="text-cyan-400">a3dGlow3d</code> directive but no
                halo effect.
              </p>
              <code class="text-xs text-text-tertiary"
                >No &lt;a3d-bloom-effect /&gt;</code
              >
            </div>
          </div>

          <!-- With Bloom -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                With Bloom
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

                  <a3d-torus
                    [position]="[0, 0, 0]"
                    [color]="colors.cyan"
                    a3dGlow3d
                    [glowIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[-1.8, 0, 0]"
                    [color]="colors.pink"
                    [args]="[0.8, 0.8, 0.8]"
                    a3dGlow3d
                    [glowIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'x', speed: 20 }"
                  />
                  <a3d-box
                    [position]="[1.8, 0, 0]"
                    [color]="colors.neonGreen"
                    [args]="[0.8, 0.8, 0.8]"
                    a3dGlow3d
                    [glowIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'z', speed: 18 }"
                  />
                  <!-- BLOOM ENABLED -->
                  <a3d-bloom-effect
                    [threshold]="0.5"
                    [strength]="1.5"
                    [radius]="0.5"
                  />
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                Bloom creates glow halo around bright objects.
              </p>
              <code class="text-xs text-green-400"
                >&lt;a3d-bloom-effect [strength]="1.5" /&gt;</code
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Bloom Parameters -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Bloom Parameters</h2>
          <p class="text-text-secondary">
            Different strength and radius values
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- Low Bloom -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-torus
                  [color]="colors.cyan"
                  a3dGlow3d
                  [glowIntensity]="2"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect
                  [threshold]="0.5"
                  [strength]="0.5"
                  [radius]="0.3"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-text-secondary">strength: 0.5</code>
              <p class="text-xs text-text-tertiary mt-1">Subtle glow</p>
            </div>
          </div>

          <!-- Medium Bloom -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-torus
                  [color]="colors.pink"
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
              <code class="text-sm text-pink-400">strength: 1.5</code>
              <p class="text-xs text-text-tertiary mt-1">Balanced glow</p>
            </div>
          </div>

          <!-- High Bloom -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-torus
                  [color]="colors.neonGreen"
                  a3dGlow3d
                  [glowIntensity]="2"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect
                  [threshold]="0.3"
                  [strength]="2.5"
                  [radius]="0.8"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-green-400">strength: 2.5</code>
              <p class="text-xs text-text-tertiary mt-1">Intense glow</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class PostprocessingSectionComponent {
  public readonly colors = SCENE_COLORS;
}
