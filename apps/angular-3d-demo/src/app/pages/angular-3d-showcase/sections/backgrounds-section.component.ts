import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  HexagonalBackgroundInstancedComponent,
  OrbitControlsComponent,
  Scene3dComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-backgrounds-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Scene3dComponent,
    HexagonalBackgroundInstancedComponent,
    OrbitControlsComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    BloomEffectComponent,
    EffectComposerComponent,
  ],
  template: `
    <section class="py-16 bg-gradient-to-br from-gray-900 to-black">
      <div class="container mx-auto px-6">
        <!-- Section Header -->
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">
            Live Hexagonal Cloud Backgrounds
          </h2>
          <p class="text-xl text-gray-400 max-w-3xl mx-auto">
            Mesmerizing 3D hexagonal clouds with continuous depth bobbing,
            rotation wobble, and color pulsing. Optimized with InstancedMesh
            rendering (single draw call). Inspired by live-clouds effect.
          </p>
        </div>

        <!-- Demo Scenes -->
        <div class="space-y-12 mb-12">
          <!-- Scene 1: Live-Clouds Style (Cyan/Green/Pink) -->
          <div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div class="h-[600px] relative">
              <a3d-scene-3d
                [cameraPosition]="[0, -3, 4]"
                [backgroundColor]="darkMagenta"
              >
                <!-- Lighting -->
                <a3d-ambient-light
                  [color]="colorNums.white"
                  [intensity]="0.5"
                />
                <a3d-directional-light
                  [color]="colorNums.blue"
                  [intensity]="1.5"
                  [position]="[100, -50, 50]"
                />

                <!-- Instanced Hexagonal Cloud -->
                <a3d-hexagonal-background-instanced
                  [circleCount]="10"
                  [colorPalette]="[
                    colorNums.cyan,
                    colorNums.mintGreen,
                    colorNums.hotPink,
                    colorNums.white
                  ]"
                  [hexRadius]="0.5"
                  [hexHeight]="0.1"
                  [baseColor]="colorNums.darkBlueGray"
                  [roughness]="0.75"
                  [metalness]="0.25"
                  [animationSpeed]="0.5"
                  [depthAmplitude]="0.125"
                  [rotationAmplitude]="0.0625"
                  [bloomLayer]="1"
                />

                <!-- NOTE: Reference achieves neon look through shader alone, no bloom! -->

                <a3d-orbit-controls [enableDamping]="true" />
              </a3d-scene-3d>
            </div>
            <div class="p-6">
              <h4 class="text-white font-bold text-lg mb-2">
                Live Clouds - Cyan/Green/Pink Palette
              </h4>
              <p class="text-gray-400">
                Circular dome of ~331 hexagons with continuous depth bobbing,
                rotation wobble, and color pulsing. Optimized with InstancedMesh
                (single draw call). Orbit to explore the 3D structure.
              </p>
            </div>
          </div>

          <!-- Scene 2: Live-Clouds Style (Red/Green/Blue) -->
          <div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div class="h-[600px] relative">
              <a3d-scene-3d
                [cameraPosition]="[0, -3, 4]"
                [backgroundColor]="darkMagenta"
              >
                <!-- Lighting -->
                <a3d-ambient-light
                  [color]="colorNums.white"
                  [intensity]="0.6"
                />
                <a3d-directional-light
                  [color]="colorNums.blue"
                  [intensity]="1.8"
                  [position]="[100, -50, 50]"
                />

                <!-- Instanced Hexagonal Cloud -->
                <a3d-hexagonal-background-instanced
                  [circleCount]="12"
                  [colorPalette]="[
                    colorNums.red,
                    colorNums.emerald,
                    colorNums.blue,
                    colorNums.white
                  ]"
                  [hexRadius]="0.5"
                  [hexHeight]="0.1"
                  [baseColor]="colorNums.darkNavy"
                  [roughness]="0.8"
                  [metalness]="0.3"
                  [animationSpeed]="0.7"
                  [depthAmplitude]="0.15"
                  [rotationAmplitude]="0.08"
                  [bloomLayer]="1"
                />

                <!-- NOTE: Reference achieves neon look through shader alone, no bloom! -->

                <a3d-orbit-controls [enableDamping]="true" />
              </a3d-scene-3d>
            </div>
            <div class="p-6">
              <h4 class="text-white font-bold text-lg mb-2">
                Live Clouds - RGB Spectrum (Larger Grid)
              </h4>
              <p class="text-gray-400">
                Larger dome with ~469 hexagons. Faster animation and more
                pronounced movement. Classic RGB color palette with blue-tinted
                lighting creates a futuristic atmosphere.
              </p>
            </div>
          </div>

          <!-- Scene 3: NEW - Static Cyan Edges + Diamond Shape -->
          <div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div class="h-[600px] relative">
              <a3d-scene-3d
                [cameraPosition]="[0, -3, 4]"
                [backgroundColor]="darkMagenta"
              >
                <a3d-ambient-light
                  [color]="colorNums.white"
                  [intensity]="0.5"
                />
                <a3d-directional-light
                  [color]="colorNums.blue"
                  [intensity]="1.5"
                  [position]="[100, -50, 50]"
                />

                <!-- NEW: Diamond shape with static cyan edges -->
                <a3d-hexagonal-background-instanced
                  [circleCount]="10"
                  [shape]="'diamond'"
                  [edgeColor]="colorNums.cyan"
                  [edgePulse]="false"
                  [hoverColor]="colorNums.hotPink"
                  [baseColor]="colorNums.darkBlueGray"
                  [hexRadius]="0.5"
                  [hexHeight]="0.1"
                  [mouseInfluenceRadius]="3.0"
                  [bloomLayer]="1"
                />

                <a3d-orbit-controls [enableDamping]="true" />
              </a3d-scene-3d>
            </div>
            <div class="p-6">
              <h4 class="text-white font-bold text-lg mb-2">
                Diamond Grid - Static Cyan Edges
              </h4>
              <p class="text-gray-400">
                Diamond-shaped instances with static cyan edge glow (no
                pulsing). Move mouse to reveal hot pink faces. Demonstrates
                separate edge/face color control and geometry flexibility.
              </p>
            </div>
          </div>

          <!-- Scene 4: NEW - Glowing Neon with Bloom Effect -->
          <div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div class="h-[600px] relative">
              <a3d-scene-3d
                [cameraPosition]="[0, -3, 4]"
                [backgroundColor]="colorNums.black"
              >
                <a3d-ambient-light
                  [color]="colorNums.white"
                  [intensity]="0.3"
                />
                <a3d-directional-light
                  [color]="colorNums.purple"
                  [intensity]="1.0"
                  [position]="[100, -50, 50]"
                />

                <!-- NEW: Octagon shape with neon purple edges + BLOOM -->
                <a3d-hexagonal-background-instanced
                  [circleCount]="10"
                  [shape]="'octagon'"
                  [edgeColor]="colorNums.neonPurple"
                  [edgePulse]="true"
                  [hoverColor]="colorNums.neonOrange"
                  [baseColor]="colorNums.black"
                  [hexRadius]="0.5"
                  [hexHeight]="0.1"
                  [mouseInfluenceRadius]="3.0"
                  [bloomLayer]="1"
                />

                <!-- Effect Composer with Bloom -->
                <a3d-effect-composer>
                  <a3d-bloom-effect
                    [strength]="1.5"
                    [threshold]="0.5"
                    [radius]="0.4"
                  />
                </a3d-effect-composer>

                <a3d-orbit-controls [enableDamping]="true" />
              </a3d-scene-3d>
            </div>
            <div class="p-6">
              <h4 class="text-white font-bold text-lg mb-2">
                Neon Octagons with Bloom Glow
              </h4>
              <p class="text-gray-400">
                Octagon-shaped grid with pulsing neon purple edges enhanced by
                bloom post-processing. Creates an intense cyberpunk aesthetic.
                Move mouse to reveal orange glow. This demonstrates the full
                power of custom colors + bloom effects.
              </p>
            </div>
          </div>

          <!-- Scene 5: NEW - Golden Honeycomb (Light Theme) -->
          <div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
            <div class="h-[600px] relative">
              <a3d-scene-3d
                [cameraPosition]="[0, -3, 4]"
                [backgroundColor]="colorNums.warmWhite"
              >
                <!-- Warm, natural lighting -->
                <a3d-ambient-light
                  [color]="colorNums.warmWhite"
                  [intensity]="1.2"
                />
                <a3d-directional-light
                  [color]="colorNums.amber"
                  [intensity]="0.8"
                  [position]="[100, -50, 50]"
                />

                <!-- Golden Honeycomb: Light theme with honey colors -->
                <a3d-hexagonal-background-instanced
                  [circleCount]="10"
                  [shape]="'hexagon'"
                  [edgeColor]="colorNums.honeyGold"
                  [edgePulse]="false"
                  [hoverColor]="colorNums.darkHoney"
                  [baseColor]="colorNums.cream"
                  [hexRadius]="0.5"
                  [hexHeight]="0.1"
                  [roughness]="0.3"
                  [metalness]="0.1"
                  [mouseInfluenceRadius]="3.0"
                  [bloomLayer]="0"
                />

                <a3d-orbit-controls [enableDamping]="true" />
              </a3d-scene-3d>
            </div>
            <div class="p-6">
              <h4 class="text-white font-bold text-lg mb-2">
                Golden Honeycomb - Natural Light Theme
              </h4>
              <p class="text-gray-400">
                True honeycomb aesthetic with warm golden edges and cream faces.
                Static honey-gold borders create a natural, organic appearance.
                Move mouse to reveal darker honey glow. Perfect for light-themed
                interfaces and natural product showcases.
              </p>
            </div>
          </div>
        </div>

        <!-- Code Examples -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <!-- Example 1: Dark Neon Theme -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-white mb-4">
              Dark Neon Theme
            </h3>
            <pre
              class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto text-sm"
            ><code>&lt;a3d-scene-3d [backgroundColor]="0x000000"&gt;
  &lt;a3d-ambient-light [intensity]="0.3" /&gt;
  &lt;a3d-directional-light
    [intensity]="1.0"
    [position]="[100, -50, 50]"
  /&gt;

  &lt;a3d-hexagonal-background-instanced
    [shape]="'octagon'"
    [edgeColor]="0xb24bf3"
    [edgePulse]="true"
    [hoverColor]="0xff9500"
    [baseColor]="0x000000"
    [bloomLayer]="1"
  /&gt;

  &lt;a3d-effect-composer&gt;
    &lt;a3d-bloom-effect
      [threshold]="0.5"
      [strength]="1.5"
    /&gt;
  &lt;/a3d-effect-composer&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
          </div>

          <!-- Example 2: Golden Honeycomb -->
          <div class="bg-gray-800 rounded-lg p-6">
            <h3 class="text-xl font-semibold text-white mb-4">
              Golden Honeycomb
            </h3>
            <pre
              class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto text-sm"
            ><code>&lt;a3d-scene-3d [backgroundColor]="0xfaf6f0"&gt;
  &lt;a3d-ambient-light
    [color]="0xfaf6f0"
    [intensity]="1.2"
  /&gt;
  &lt;a3d-directional-light
    [color]="0xf59e0b"
    [intensity]="0.8"
    [position]="[100, -50, 50]"
  /&gt;

  &lt;a3d-hexagonal-background-instanced
    [shape]="'hexagon'"
    [edgeColor]="0xffb03b"
    [edgePulse]="false"
    [hoverColor]="0xd4860d"
    [baseColor]="0xfff8e7"
    [roughness]="0.3"
    [metalness]="0.1"
  /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
          </div>
        </div>

        <!-- Features List -->
        <div
          class="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-6"
        >
          <h3 class="text-xl font-semibold text-blue-300 mb-3">
            Features & Effects
          </h3>
          <ul class="text-blue-200 space-y-2">
            <li class="flex items-start">
              <span class="mr-2">🌀</span>
              <span
                ><strong>Circular Dome Layout:</strong> Radial hexagonal grid in
                6-fold symmetry</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">⚡</span>
              <span
                ><strong>InstancedMesh Optimization:</strong> Single draw call
                for hundreds of hexagons</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">🌊</span>
              <span
                ><strong>Continuous Depth Bobbing:</strong> Sine wave animation
                creates organic movement</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">🎭</span>
              <span
                ><strong>Rotation Wobble:</strong> Subtle rotation on X and Y
                axes</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">🎨</span>
              <span
                ><strong>Custom Edge Colors:</strong> Static or pulsing neon
                edge glow with edgeColor input</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">🖱️</span>
              <span
                ><strong>Interactive Mouse Hover:</strong> Faces light up with
                custom color when cursor approaches</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">🔷</span>
              <span
                ><strong>Geometry Flexibility:</strong> Hexagon, diamond,
                octagon, or square shapes</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">✨</span>
              <span
                ><strong>Bloom Post-Processing:</strong> Intense glow effects
                with effect composer integration</span
              >
            </li>
            <li class="flex items-start">
              <span class="mr-2">🎬</span>
              <span
                ><strong>WebGPU Compatible:</strong> TSL-based shaders for
                modern rendering</span
              >
            </li>
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class BackgroundsSectionComponent {
  // Expose colors for template
  protected readonly colorNums = SCENE_COLORS;

  // Dark magenta background matching reference (0x220011)
  protected readonly darkMagenta = 0x220011;
}
