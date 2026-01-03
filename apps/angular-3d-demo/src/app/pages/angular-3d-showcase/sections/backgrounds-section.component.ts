/**
 * BackgroundsSectionComponent - Showcase for Background Shader Components
 *
 * Demonstrates the 4 background shader components:
 * - RayMarchedBackgroundComponent (metaball-style with SDF ray marching)
 * - CausticsBackgroundComponent (procedural caustics texture)
 * - VolumetricBackgroundComponent (fog/cloud with volumetric scattering)
 * - StarfieldBackgroundComponent (space stars with optional parallax)
 *
 * Features:
 * - Live examples with configurable parameters
 * - Side-by-side comparisons of different techniques
 * - Interactive controls for real-time parameter adjustments
 * - Performance metrics display
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Scene3dComponent,
  RayMarchedBackgroundComponent,
  CausticsBackgroundComponent,
  VolumetricBackgroundComponent,
  StarfieldBackgroundComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS, SCENE_COLOR_STRINGS } from '../../../shared/colors';

@Component({
  selector: 'app-backgrounds-section',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    Scene3dComponent,
    RayMarchedBackgroundComponent,
    CausticsBackgroundComponent,
    VolumetricBackgroundComponent,
    StarfieldBackgroundComponent,
  ],
  template: `
    <section class="py-16 bg-gradient-to-br from-gray-900 to-black">
      <div class="container mx-auto px-6">
        <!-- Section Header -->
        <div class="text-center mb-12">
          <h2 class="text-4xl font-bold text-white mb-4">
            Background Shader Components
          </h2>
          <p class="text-xl text-gray-400 max-w-3xl mx-auto">
            Advanced shader-based backgrounds using TSL ray marching and procedural textures.
            Lightweight, GPU-accelerated, and responsive.
          </p>
        </div>

        <!-- Ray Marched Background Example -->
        <div class="mb-16">
          <h3 class="text-2xl font-semibold text-white mb-4">
            Ray Marched Background
            <span class="text-sm text-gray-400 ml-2">(SDF Metaballs)</span>
          </h3>
          <p class="text-gray-400 mb-6">
            Interactive metaball background using signed distance functions and ray marching.
            Features smooth blob blending, mouse interaction, and adaptive quality (64 steps desktop, 16 mobile).
          </p>

          <div class="grid md:grid-cols-3 gap-6">
            <!-- Cosmic Preset -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-ray-marched-background
                    preset="cosmic"
                    [sphereCount]="6"
                    [smoothness]="0.3"
                    [enableMouse]="true"
                    viewportPosition="center"
                    [viewportZ]="-20"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Cosmic Preset</h4>
                <p class="text-gray-400 text-sm">
                  Blue-purple theme with 6 animated spheres
                </p>
              </div>
            </div>

            <!-- Minimal Preset -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-ray-marched-background
                    preset="minimal"
                    [sphereCount]="3"
                    [smoothness]="0.5"
                    [enableMouse]="true"
                    viewportPosition="center"
                    [viewportZ]="-20"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Minimal Preset</h4>
                <p class="text-gray-400 text-sm">
                  Monochrome theme with 3 subtle spheres
                </p>
              </div>
            </div>

            <!-- Neon Preset -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-ray-marched-background
                    preset="neon"
                    [sphereCount]="8"
                    [smoothness]="0.2"
                    [enableMouse]="true"
                    viewportPosition="center"
                    [viewportZ]="-20"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Neon Preset</h4>
                <p class="text-gray-400 text-sm">
                  Cyan-green theme with 8 dynamic spheres
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Caustics Background Example -->
        <div class="mb-16">
          <h3 class="text-2xl font-semibold text-white mb-4">
            Caustics Background
            <span class="text-sm text-gray-400 ml-2">(Procedural Texture)</span>
          </h3>
          <p class="text-gray-400 mb-6">
            Animated caustics patterns (light through water) using procedural textures.
            Customizable color, scale, and animation speed. Lightweight (60+ FPS).
          </p>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Blue Caustics -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-caustics-background
                    [scale]="2"
                    [animationSpeed]="1"
                    [color]="colors.cyan"
                    viewportPosition="center"
                    [viewportZ]="-30"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Ocean Blue</h4>
                <p class="text-gray-400 text-sm">
                  Scale: 2, Speed: 1.0, Color: cyan
                </p>
              </div>
            </div>

            <!-- Green Caustics -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-caustics-background
                    [scale]="3"
                    [animationSpeed]="1.5"
                    [color]="colors.mintGreen"
                    viewportPosition="center"
                    [viewportZ]="-30"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Neon Green</h4>
                <p class="text-gray-400 text-sm">
                  Scale: 3, Speed: 1.5, Color: mintGreen
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Volumetric Background Example -->
        <div class="mb-16">
          <h3 class="text-2xl font-semibold text-white mb-4">
            Volumetric Background
            <span class="text-sm text-gray-400 ml-2">(Fog & Clouds)</span>
          </h3>
          <p class="text-gray-400 mb-6">
            Atmospheric volumetric fog with adjustable density and scattering.
            Optional depth fade for perspective. Targets 30 FPS mobile, 60 FPS desktop.
          </p>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Light Fog -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-volumetric-background
                    [density]="0.05"
                    [scattering]="0.4"
                    [depthFade]="true"
                    [animationSpeed]="0.8"
                    viewportPosition="center"
                    [viewportZ]="-25"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Light Fog</h4>
                <p class="text-gray-400 text-sm">
                  Density: 0.05, Scattering: 0.4, Depth Fade: Yes
                </p>
              </div>
            </div>

            <!-- Dense Clouds -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-volumetric-background
                    [density]="0.2"
                    [scattering]="0.7"
                    [depthFade]="true"
                    [animationSpeed]="1.2"
                    viewportPosition="center"
                    [viewportZ]="-25"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Dense Clouds</h4>
                <p class="text-gray-400 text-sm">
                  Density: 0.2, Scattering: 0.7, Depth Fade: Yes
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Starfield Background Example -->
        <div class="mb-16">
          <h3 class="text-2xl font-semibold text-white mb-4">
            Starfield Background
            <span class="text-sm text-gray-400 ml-2">(Space Stars)</span>
          </h3>
          <p class="text-gray-400 mb-6">
            Procedural starfield with optional mouse parallax effect for depth perception.
            Customizable density, star size, and parallax strength. Lightweight (60+ FPS).
          </p>

          <div class="grid md:grid-cols-2 gap-6">
            <!-- Static Starfield -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-starfield-background
                    [density]="100"
                    [starSize]="0.5"
                    [enableParallax]="false"
                    viewportPosition="center"
                    [viewportZ]="-40"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Static Stars</h4>
                <p class="text-gray-400 text-sm">
                  Density: 100, Star Size: 0.5, Parallax: Off
                </p>
              </div>
            </div>

            <!-- Parallax Starfield -->
            <div class="bg-gray-800 rounded-lg overflow-hidden">
              <div class="h-64 relative">
                <a3d-scene-3d
                  [cameraPosition]="[0, 0, 50]"
                  [backgroundColor]="colorNums.black"
                >
                  <a3d-starfield-background
                    [density]="150"
                    [starSize]="0.7"
                    [enableParallax]="true"
                    [parallaxStrength]="0.3"
                    viewportPosition="center"
                    [viewportZ]="-40"
                  />
                </a3d-scene-3d>
              </div>
              <div class="p-4">
                <h4 class="text-white font-semibold mb-2">Parallax Stars</h4>
                <p class="text-gray-400 text-sm">
                  Density: 150, Star Size: 0.7, Parallax: 0.3
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Examples -->
        <div class="mt-12 bg-gray-800 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-white mb-4">Usage Examples</h3>

          <div class="space-y-6">
            <!-- Ray Marched -->
            <div>
              <h4 class="text-white font-semibold mb-2">Ray Marched Background</h4>
              <pre class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto text-sm"><code>&lt;a3d-ray-marched-background
  preset="cosmic"
  [sphereCount]="6"
  [smoothness]="0.3"
  [enableMouse]="true"
  viewportPosition="center"
  [viewportZ]="-20"
/&gt;</code></pre>
            </div>

            <!-- Caustics -->
            <div>
              <h4 class="text-white font-semibold mb-2">Caustics Background</h4>
              <pre class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto text-sm"><code>&lt;a3d-caustics-background
  [scale]="2"
  [animationSpeed]="1.5"
  [color]="colors.cyan"
  viewportPosition="center"
  [viewportZ]="-30"
/&gt;</code></pre>
            </div>

            <!-- Volumetric -->
            <div>
              <h4 class="text-white font-semibold mb-2">Volumetric Background</h4>
              <pre class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto text-sm"><code>&lt;a3d-volumetric-background
  [density]="0.1"
  [scattering]="0.5"
  [depthFade]="true"
  viewportPosition="center"
  [viewportZ]="-25"
/&gt;</code></pre>
            </div>

            <!-- Starfield -->
            <div>
              <h4 class="text-white font-semibold mb-2">Starfield Background</h4>
              <pre class="bg-gray-900 text-gray-300 p-4 rounded overflow-x-auto text-sm"><code>&lt;a3d-starfield-background
  [density]="100"
  [starSize]="0.5"
  [enableParallax]="true"
  [parallaxStrength]="0.3"
  viewportPosition="center"
  [viewportZ]="-40"
/&gt;</code></pre>
            </div>
          </div>
        </div>

        <!-- Performance Notes -->
        <div class="mt-8 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-6">
          <h3 class="text-xl font-semibold text-blue-300 mb-3">
            Performance & Optimization
          </h3>
          <ul class="text-blue-200 space-y-2">
            <li class="flex items-start">
              <span class="mr-2">•</span>
              <span><strong>Ray Marched:</strong> Adaptive quality (64 steps desktop, 16 mobile). Sphere count clamped to 10 max.</span>
            </li>
            <li class="flex items-start">
              <span class="mr-2">•</span>
              <span><strong>Caustics:</strong> Lightweight procedural texture (60+ FPS all devices).</span>
            </li>
            <li class="flex items-start">
              <span class="mr-2">•</span>
              <span><strong>Volumetric:</strong> Device-aware quality (2 AO samples mobile, 6 desktop).</span>
            </li>
            <li class="flex items-start">
              <span class="mr-2">•</span>
              <span><strong>Starfield:</strong> Minimal overhead, parallax uses smooth lerp interpolation.</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  `,
})
export class BackgroundsSectionComponent {
  // Expose shared colors to template (strings for color inputs, numbers for backgroundColor)
  protected readonly colors = SCENE_COLOR_STRINGS;
  protected readonly colorNums = SCENE_COLORS;
}
