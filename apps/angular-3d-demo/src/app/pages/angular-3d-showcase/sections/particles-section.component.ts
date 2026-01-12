import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  ParticleSystemComponent,
  MarbleParticleSystemComponent,
  GpuParticleSphereComponent,
  SparkleCoronaComponent,
  MarbleSphereComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Particles Section - Comprehensive Particle Systems Showcase
 *
 * Demonstrates all 4 particle system components available in @hive-academy/angular-3d:
 *
 * 1. ParticleSystemComponent - Basic configurable particle system
 *    - Distributions: sphere, box, cone
 *    - Use case: General-purpose particle effects
 *
 * 2. MarbleParticleSystemComponent - InstancedMesh with TSL glow
 *    - WebGPU-optimized with circular falloff
 *    - Use case: Interior particle clouds, marble effects
 *
 * 3. GpuParticleSphereComponent - High-performance 65k particles
 *    - Noise-based organic motion
 *    - Use case: Dense particle clouds with animation
 *
 * 4. SparkleCoronaComponent - Shell-distributed twinkling particles
 *    - Multi-color sparkles with twinkling animation
 *    - Use case: Corona/halo effects around objects
 */
@Component({
  selector: 'app-particles-section',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    ParticleSystemComponent,
    MarbleParticleSystemComponent,
    GpuParticleSphereComponent,
    SparkleCoronaComponent,
    MarbleSphereComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Section Header -->
      <section class="max-w-container mx-auto px-4x text-center">
        <h2 class="text-display-md font-bold mb-4x">Particle Systems</h2>
        <p class="text-headline-sm text-text-secondary max-w-prose mx-auto">
          Four specialized particle components for different effects: basic
          distributions, GPU-optimized clouds, glowing marble particles, and
          twinkling coronas
        </p>
      </section>

      <!-- 1. ParticleSystemComponent - Basic Distributions -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-lg font-bold mb-2x">
            ParticleSystem Component
          </h3>
          <p class="text-text-secondary">
            Basic particle system with sphere, box, and cone distributions
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6x">
          <!-- Sphere Distribution -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 15]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.5" />

                <a3d-particle-system
                  [count]="2000"
                  [spread]="8"
                  [color]="colors.indigo"
                  [size]="0.08"
                  [opacity]="0.7"
                  distribution="sphere"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Sphere Distribution</h4>
              <code
                class="text-xs px-3x py-1x bg-white/5 rounded-lg text-primary-400"
              >
                distribution="sphere"
              </code>
            </div>
          </div>

          <!-- Box Distribution -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 15]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.5" />

                <a3d-particle-system
                  [count]="2000"
                  [spread]="8"
                  [color]="colors.pink"
                  [size]="0.08"
                  [opacity]="0.7"
                  distribution="box"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Box Distribution</h4>
              <code
                class="text-xs px-3x py-1x bg-white/5 rounded-lg text-pink-400"
              >
                distribution="box"
              </code>
            </div>
          </div>

          <!-- Cone Distribution -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 15]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.5" />

                <a3d-particle-system
                  [count]="2000"
                  [spread]="8"
                  [color]="colors.amber"
                  [size]="0.08"
                  [opacity]="0.7"
                  distribution="cone"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Cone Distribution</h4>
              <code
                class="text-xs px-3x py-1x bg-white/5 rounded-lg text-amber-400"
              >
                distribution="cone"
              </code>
            </div>
          </div>
        </div>

        <!-- Code Example -->
        <div class="mt-6x p-4x bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold mb-2x">Usage Example:</h4>
          <pre
            class="text-xs text-text-secondary overflow-x-auto"
          ><code>&lt;a3d-particle-system
  [count]="2000"
  [spread]="8"
  [color]="'#6366f1'"
  [size]="0.08"
  [opacity]="0.7"
  distribution="sphere"
/&gt;</code></pre>
        </div>
      </section>

      <!-- 2. MarbleParticleSystemComponent -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-lg font-bold mb-2x">
            Marble Particle System
          </h3>
          <p class="text-text-secondary">
            GPU-optimized instanced particles with soft glow and optional
            twinkle
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6x">
          <!-- Static Glow -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 2]">
                <a3d-ambient-light [intensity]="0.2" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.4" />

                <a3d-marble-particle-system
                  [radius]="0.6"
                  [particleCount]="3000"
                  [color]="'#00d4ff'"
                  [size]="0.015"
                  [opacity]="0.6"
                  [blending]="'additive'"
                  [enableTwinkle]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Static Glow</h4>
              <code
                class="text-xs px-3x py-1x bg-white/5 rounded-lg text-cyan-400"
              >
                [enableTwinkle]="false"
              </code>
            </div>
          </div>

          <!-- With Twinkle Animation -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 2]">
                <a3d-ambient-light [intensity]="0.2" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.4" />

                <a3d-marble-particle-system
                  [radius]="0.6"
                  [particleCount]="3000"
                  [color]="'#ff66d4'"
                  [size]="0.015"
                  [opacity]="0.6"
                  [blending]="'additive'"
                  [enableTwinkle]="true"
                  [twinkleSpeed]="0.8"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Twinkling Glow</h4>
              <code
                class="text-xs px-3x py-1x bg-white/5 rounded-lg text-pink-400"
              >
                [enableTwinkle]="true"
              </code>
            </div>
          </div>
        </div>

        <!-- Code Example -->
        <div class="mt-6x p-4x bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold mb-2x">Usage Example:</h4>
          <pre
            class="text-xs text-text-secondary overflow-x-auto"
          ><code>&lt;a3d-marble-particle-system
  [radius]="0.6"
  [particleCount]="3000"
  [color]="'#ff66d4'"
  [size]="0.015"
  [opacity]="0.6"
  [blending]="'additive'"
  [enableTwinkle]="true"
  [twinkleSpeed]="0.8"
/&gt;</code></pre>
        </div>
      </section>

      <!-- 3. GpuParticleSphereComponent -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-lg font-bold mb-2x">
            GPU Particle Sphere
          </h3>
          <p class="text-text-secondary">
            High-performance particle cloud with 65k particles and organic
            noise-based motion
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
            <a3d-ambient-light [intensity]="0.2" />
            <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.4" />

            <a3d-gpu-particle-sphere
              [particleCount]="65536"
              [sphereRadius]="1.2"
              [color]="'#ff8866'"
              [pointSize]="0.012"
              [opacity]="0.5"
              [noiseSpeed]="0.3"
              [position]="[0, 0, 0]"
            />
          </a3d-scene-3d>
        </div>

        <!-- Code Example -->
        <div class="mt-6x p-4x bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold mb-2x">Usage Example:</h4>
          <pre
            class="text-xs text-text-secondary overflow-x-auto"
          ><code>&lt;a3d-gpu-particle-sphere
  [particleCount]="65536"
  [sphereRadius]="1.2"
  [color]="'#ff8866'"
  [pointSize]="0.012"
  [opacity]="0.5"
  [noiseSpeed]="0.3"
/&gt;</code></pre>
          <p class="text-xs text-text-secondary mt-2x">
            <strong>Note:</strong> Optimized for 65k+ particles with efficient
            GPU instancing and noise-based animation
          </p>
        </div>
      </section>

      <!-- 4. SparkleCoronaComponent -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-lg font-bold mb-2x">Sparkle Corona</h3>
          <p class="text-text-secondary">
            Shell-distributed twinkling particles creating halo effects around
            objects
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6x">
          <!-- Corona around Marble -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.6" />

                <!-- Center marble sphere -->
                <a3d-marble-sphere
                  [radius]="0.8"
                  [position]="[0, 0, 0]"
                  [colorA]="'#1a0025'"
                  [colorB]="'#ff66d4'"
                  [edgeColor]="'#ff99e6'"
                  [edgeIntensity]="1.0"
                  [animationSpeed]="0.5"
                  [iterations]="12"
                  [roughness]="0.05"
                />

                <!-- Sparkle corona around it -->
                <a3d-sparkle-corona
                  [count]="2000"
                  [innerRadius]="0.85"
                  [outerRadius]="1.1"
                  [baseSize]="0.025"
                  [twinkleSpeed]="2.5"
                  [position]="[0, 0, 0]"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Marble with Corona</h4>
              <code
                class="text-xs px-3x py-1x bg-white/5 rounded-lg text-pink-400"
              >
                Multi-color sparkles
              </code>
            </div>
          </div>

          <!-- Dense Sparkle Cloud -->
          <div class="space-y-3x">
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.6" />

                <a3d-sparkle-corona
                  [count]="4000"
                  [innerRadius]="0.5"
                  [outerRadius]="1.2"
                  [baseSize]="0.02"
                  [twinkleSpeed]="3.0"
                  [position]="[0, 0, 0]"
                  [colorWeights]="{ white: 0.6, peach: 0.25, gold: 0.15 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="text-center">
              <h4 class="font-semibold text-sm mb-1x">Dense Sparkle Cloud</h4>
              <code class="text-xs px-3x py-1x bg-white/5 rounded-lg text-amber-400">
                Custom color weights
              </code>
            </div>
          </div>
        </div>

        <!-- Code Example -->
        <div class="mt-6x p-4x bg-white/5 rounded-lg">
          <h4 class="text-sm font-semibold mb-2x">Usage Example:</h4>
          <pre
            class="text-xs text-text-secondary overflow-x-auto"
          ><code>&lt;a3d-sparkle-corona
  [count]="4000"
  [innerRadius]="0.85"
  [outerRadius]="1.1"
  [baseSize]="0.025"
  [twinkleSpeed]="2.5"
  [colorWeights]="{{ '{' }} white: 0.6, peach: 0.25, gold: 0.15 {{ '}' }}"
/&gt;</code></pre>
          <p class="text-xs text-text-secondary mt-2x">
            <strong>Note:</strong> Particles distributed on a shell surface
            (not volume) with per-particle twinkling animation
          </p>
        </div>
      </section>

      <!-- Comparison Table -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h3 class="text-headline-lg font-bold mb-2x">Component Comparison</h3>
          <p class="text-text-secondary">
            Choose the right particle system for your use case
          </p>
        </div>

        <div class="overflow-x-auto">
          <table
            class="w-full text-sm border-collapse bg-white/5 rounded-lg overflow-hidden"
          >
            <thead class="bg-white/10">
              <tr>
                <th class="px-4x py-3x text-left font-semibold">Component</th>
                <th class="px-4x py-3x text-left font-semibold">
                  Particle Count
                </th>
                <th class="px-4x py-3x text-left font-semibold">Performance</th>
                <th class="px-4x py-3x text-left font-semibold">Features</th>
                <th class="px-4x py-3x text-left font-semibold">Best For</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/10">
              <tr class="hover:bg-white/5">
                <td class="px-4x py-3x font-mono text-xs text-primary-400">
                  ParticleSystem
                </td>
                <td class="px-4x py-3x text-text-secondary">1k - 5k</td>
                <td class="px-4x py-3x text-text-secondary">Good</td>
                <td class="px-4x py-3x text-text-secondary">
                  3 distributions
                </td>
                <td class="px-4x py-3x text-text-secondary">
                  General effects
                </td>
              </tr>
              <tr class="hover:bg-white/5">
                <td class="px-4x py-3x font-mono text-xs text-cyan-400">
                  MarbleParticleSystem
                </td>
                <td class="px-4x py-3x text-text-secondary">3k - 10k</td>
                <td class="px-4x py-3x text-text-secondary">Excellent</td>
                <td class="px-4x py-3x text-text-secondary">
                  TSL glow, twinkle
                </td>
                <td class="px-4x py-3x text-text-secondary">Interior clouds</td>
              </tr>
              <tr class="hover:bg-white/5">
                <td class="px-4x py-3x font-mono text-xs text-orange-400">
                  GpuParticleSphere
                </td>
                <td class="px-4x py-3x text-text-secondary">65k+</td>
                <td class="px-4x py-3x text-text-secondary">Excellent</td>
                <td class="px-4x py-3x text-text-secondary">
                  Noise animation
                </td>
                <td class="px-4x py-3x text-text-secondary">Dense clouds</td>
              </tr>
              <tr class="hover:bg-white/5">
                <td class="px-4x py-3x font-mono text-xs text-amber-400">
                  SparkleCorona
                </td>
                <td class="px-4x py-3x text-text-secondary">2k - 5k</td>
                <td class="px-4x py-3x text-text-secondary">Good</td>
                <td class="px-4x py-3x text-text-secondary">
                  Multi-color, twinkle
                </td>
                <td class="px-4x py-3x text-text-secondary">
                  Halos, coronas
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      table {
        border-spacing: 0;
      }

      th {
        background: rgba(255, 255, 255, 0.1);
      }

      code {
        font-family: 'Courier New', monospace;
      }
    `,
  ],
})
export default class ParticlesSectionComponent {
  protected readonly colors = SCENE_COLORS;
}
