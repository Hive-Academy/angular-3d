import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  BoxComponent,
  ColorGradingEffectComponent,
  DepthOfFieldEffectComponent,
  DirectionalLightComponent,
  Rotate3dDirective,
  Scene3dComponent,
  SsaoEffectComponent,
  TorusComponent,
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
    DepthOfFieldEffectComponent,
    SsaoEffectComponent,
    ColorGradingEffectComponent,
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
                    [emissive]="colors.cyan"
                    [emissiveIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[-1.8, 0, 0]"
                    [color]="colors.pink"
                    [emissive]="colors.pink"
                    [emissiveIntensity]="2"
                    [args]="[0.8, 0.8, 0.8]"
                    rotate3d
                    [rotateConfig]="{ axis: 'x', speed: 20 }"
                  />
                  <a3d-box
                    [position]="[1.8, 0, 0]"
                    [color]="colors.neonGreen"
                    [emissive]="colors.neonGreen"
                    [emissiveIntensity]="2"
                    [args]="[0.8, 0.8, 0.8]"
                    rotate3d
                    [rotateConfig]="{ axis: 'z', speed: 18 }"
                  />
                  <!-- NO BLOOM - emissive materials but no post-processing -->
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                Objects have
                <code class="text-cyan-400">emissive</code> materials but no
                bloom postprocessing.
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
                    [emissive]="colors.cyan"
                    [emissiveIntensity]="2"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[-1.8, 0, 0]"
                    [color]="colors.pink"
                    [emissive]="colors.pink"
                    [emissiveIntensity]="2"
                    [args]="[0.8, 0.8, 0.8]"
                    rotate3d
                    [rotateConfig]="{ axis: 'x', speed: 20 }"
                  />
                  <a3d-box
                    [position]="[1.8, 0, 0]"
                    [color]="colors.neonGreen"
                    [emissive]="colors.neonGreen"
                    [emissiveIntensity]="2"
                    [args]="[0.8, 0.8, 0.8]"
                    rotate3d
                    [rotateConfig]="{ axis: 'z', speed: 18 }"
                  />
                  <!-- BLOOM ENABLED - amplifies emissive into visible halo -->
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
                Bloom amplifies emissive materials into visible halos.
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
                  [emissive]="colors.cyan"
                  [emissiveIntensity]="2"
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
                  [emissive]="colors.pink"
                  [emissiveIntensity]="2"
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
                  [emissive]="colors.neonGreen"
                  [emissiveIntensity]="3"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-bloom-effect
                  [threshold]="0.5"
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

      <!-- NEW SECTION 1: Depth of Field -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Depth of Field</h2>
          <p class="text-text-secondary">
            Camera lens blur effect - blurs background, focuses on subject
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Without DOF -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                Without DOF
              </div>
              <div
                class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
              >
                <a3d-scene-3d [cameraPosition]="[0, 0, 10]">
                  <a3d-ambient-light [intensity]="0.3" />
                  <a3d-directional-light
                    [position]="[3, 3, 3]"
                    [intensity]="0.5"
                  />

                  <!-- 3 boxes at VERY different depths for visible DOF -->
                  <a3d-box
                    [position]="[-2.5, 0, 4]"
                    [color]="colors.pink"
                    [args]="[1.5, 1.5, 1.5]"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[0, 0, 0]"
                    [color]="colors.cyan"
                    [args]="[1.8, 1.8, 1.8]"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[2.5, 0, -5]"
                    [color]="colors.neonGreen"
                    [args]="[1.5, 1.5, 1.5]"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <!-- NO DOF -->
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">
                All objects equally sharp at all depths
              </p>
              <code class="text-xs text-text-tertiary">No DOF effect</code>
            </div>
          </div>

          <!-- With DOF -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                With DOF
              </div>
              <div
                class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
              >
                <a3d-scene-3d [cameraPosition]="[0, 0, 10]">
                  <a3d-ambient-light [intensity]="0.3" />
                  <a3d-directional-light
                    [position]="[3, 3, 3]"
                    [intensity]="0.5"
                  />

                  <!-- Same 3 boxes at different depths -->
                  <a3d-box
                    [position]="[-2.5, 0, 4]"
                    [color]="colors.pink"
                    [args]="[1.5, 1.5, 1.5]"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[0, 0, 0]"
                    [color]="colors.cyan"
                    [args]="[1.8, 1.8, 1.8]"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />
                  <a3d-box
                    [position]="[2.5, 0, -5]"
                    [color]="colors.neonGreen"
                    [args]="[1.5, 1.5, 1.5]"
                    rotate3d
                    [rotateConfig]="{ axis: 'y', speed: 15 }"
                  />

                  <!-- DOF ENABLED - focus on center box (10 units from camera) -->
                  <a3d-dof-effect
                    [focus]="10"
                    [aperture]="0.15"
                    [maxblur]="0.05"
                  />
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">
                Center box sharp, near/far objects blurred
              </p>
              <code class="text-xs text-cyan-400"
                >&lt;a3d-dof-effect [focus]="10" [aperture]="0.15" /&gt;</code
              >
            </div>
          </div>
        </div>
      </section>

      <!-- NEW SECTION 2: SSAO -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">
            Screen Space Ambient Occlusion
            <span
              class="ml-2 px-2 py-1 text-xs font-medium bg-amber-500/20 text-amber-400 rounded-full"
            >
              Coming Soon
            </span>
          </h2>
          <p class="text-text-secondary">
            Adds depth shadows in corners and crevices
          </p>
          <p class="text-sm text-text-tertiary mt-2">
            SSAO requires native TSL depth buffer support (not yet available in
            WebGPU PostProcessing)
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Without SSAO -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                Without SSAO
              </div>
              <div
                class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
              >
                <a3d-scene-3d [cameraPosition]="[0, 3, 8]" [cameraFov]="60">
                  <a3d-ambient-light [intensity]="0.6" />
                  <a3d-directional-light
                    [position]="[5, 5, 5]"
                    [intensity]="0.5"
                  />

                  <!-- Architectural scene: boxes forming corners -->
                  <a3d-box
                    [position]="[0, 0, 0]"
                    [args]="[4, 0.2, 4]"
                    [color]="colors.softGray"
                  />
                  <a3d-box
                    [position]="[-2, 1, 0]"
                    [args]="[0.2, 2, 4]"
                    [color]="colors.softGray"
                  />
                  <a3d-box
                    [position]="[2, 1, 0]"
                    [args]="[0.2, 2, 4]"
                    [color]="colors.softGray"
                  />
                  <a3d-box
                    [position]="[0, 1, -2]"
                    [args]="[4, 2, 0.2]"
                    [color]="colors.softGray"
                  />

                  <!-- NO SSAO -->
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">
                Flat lighting, no depth perception
              </p>
              <code class="text-xs text-text-tertiary">No SSAO effect</code>
            </div>
          </div>

          <!-- With SSAO -->
          <div>
            <div class="relative">
              <div
                class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white z-10"
              >
                With SSAO
              </div>
              <div
                class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
              >
                <a3d-scene-3d [cameraPosition]="[0, 3, 8]" [cameraFov]="60">
                  <a3d-ambient-light [intensity]="0.6" />
                  <a3d-directional-light
                    [position]="[5, 5, 5]"
                    [intensity]="0.5"
                  />

                  <!-- Same architectural scene -->
                  <a3d-box
                    [position]="[0, 0, 0]"
                    [args]="[4, 0.2, 4]"
                    [color]="colors.softGray"
                  />
                  <a3d-box
                    [position]="[-2, 1, 0]"
                    [args]="[0.2, 2, 4]"
                    [color]="colors.softGray"
                  />
                  <a3d-box
                    [position]="[2, 1, 0]"
                    [args]="[0.2, 2, 4]"
                    [color]="colors.softGray"
                  />
                  <a3d-box
                    [position]="[0, 1, -2]"
                    [args]="[4, 2, 0.2]"
                    [color]="colors.softGray"
                  />

                  <!-- SSAO ENABLED -->
                  <a3d-ssao-effect
                    [kernelRadius]="8"
                    [minDistance]="0.001"
                    [maxDistance]="0.1"
                  />
                </a3d-scene-3d>
              </div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">
                Dark shadows in corners, enhanced depth
              </p>
              <code class="text-xs text-indigo-400"
                >&lt;a3d-ssao-effect /&gt;</code
              >
            </div>
          </div>
        </div>
      </section>

      <!-- NEW SECTION 3: Color Grading -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Color Grading</h2>
          <p class="text-text-secondary">
            Cinematic color correction and vignette
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- Neutral (no grading) -->
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
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Neutral</p>
              <code class="text-xs text-text-tertiary">Default</code>
            </div>
          </div>

          <!-- Cinematic (high contrast + vignette) -->
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
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />

                <a3d-color-grading-effect
                  [saturation]="1.5"
                  [contrast]="1.4"
                  [vignette]="0.6"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Cinematic</p>
              <code class="text-xs text-amber-400">High contrast</code>
            </div>
          </div>

          <!-- Desaturated (vintage look) -->
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
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />

                <a3d-color-grading-effect
                  [saturation]="0.3"
                  [contrast]="1.2"
                  [brightness]="0.9"
                  [vignette]="0.5"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Vintage</p>
              <code class="text-xs text-violet-400">Desaturated</code>
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
