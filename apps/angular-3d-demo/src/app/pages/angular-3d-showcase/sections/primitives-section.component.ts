import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  CylinderComponent,
  TorusComponent,
  FloatingSphereComponent,
  PolyhedronComponent,
  GltfModelComponent,
  GroupComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  EnvironmentComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Primitives Section - Grouped 3D scenes for basic geometry components.
 *
 * Contains 3 grouped scenes:
 * 1. Basic Geometries (Box, Cylinder, Torus, Sphere)
 * 2. Polyhedrons (Tetrahedron, Octahedron, Dodecahedron, Icosahedron)
 * 3. Advanced (GLTF, Group)
 */
@Component({
  selector: 'app-primitives-section',
  imports: [
    Scene3dComponent,
    BoxComponent,
    CylinderComponent,
    TorusComponent,
    FloatingSphereComponent,
    PolyhedronComponent,
    GltfModelComponent,
    GroupComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    EnvironmentComponent,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Basic Geometries Section -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Basic Geometries</h2>
          <p class="text-text-secondary">
            Box, Cylinder, Torus, and Floating Sphere
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 10]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

            <a3d-box
              [position]="[-4.5, 0, 0]"
              [color]="colors.indigo"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />
            <a3d-cylinder
              [position]="[-1.5, 0, 0]"
              [color]="colors.pink"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />
            <a3d-torus
              [position]="[1.5, 0, 0]"
              [color]="colors.amber"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />
            <a3d-floating-sphere
              [position]="[4.5, 0, 0]"
              [color]="colors.blue"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 15 }"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-4 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-primary-400">&lt;a3d-box /&gt;</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-pink-400">&lt;a3d-cylinder /&gt;</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-amber-400">&lt;a3d-torus /&gt;</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-blue-400">&lt;a3d-floating-sphere /&gt;</code>
          </div>
        </div>
      </section>

      <!-- Polyhedrons Section -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Polyhedrons</h2>
          <p class="text-text-secondary">
            Tetrahedron, Octahedron, Dodecahedron, Icosahedron
          </p>
        </div>

        <div
          class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 10]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

            <a3d-polyhedron
              [type]="'tetrahedron'"
              [position]="[-4.5, 0, 0]"
              [color]="colors.teal"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 18 }"
            />
            <a3d-polyhedron
              [type]="'octahedron'"
              [position]="[-1.5, 0, 0]"
              [color]="colors.red"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 18 }"
            />
            <a3d-polyhedron
              [type]="'dodecahedron'"
              [position]="[1.5, 0, 0]"
              [color]="colors.violet"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 18 }"
            />
            <a3d-polyhedron
              [type]="'icosahedron'"
              [position]="[4.5, 0, 0]"
              [color]="colors.emerald"
              rotate3d
              [rotateConfig]="{ axis: 'y', speed: 18 }"
            />
          </a3d-scene-3d>
        </div>

        <div class="mt-4x grid grid-cols-4 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-teal-400">tetrahedron</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-red-400">octahedron</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-violet-400">dodecahedron</code>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-emerald-400">icosahedron</code>
          </div>
        </div>
      </section>

      <!-- Advanced Components Section -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Advanced Components</h2>
          <p class="text-text-secondary">
            GLTF Models, Particles, SVG, Groups, and Environment
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- GLTF Model with HDRI -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <!-- Reduced manual lighting (environment provides IBL) -->
                <a3d-ambient-light [intensity]="0.2" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.4"
                />

                <!-- Studio HDRI for product-shot look -->
                <a3d-environment
                  [preset]="'studio'"
                  [intensity]="1.5"
                  [background]="true"
                  [blur]="0.5"
                />

                <a3d-gltf-model
                  [modelPath]="'3d/planet_earth/scene.gltf'"
                  [scale]="1.2"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-cyan-400"
                >&lt;a3d-gltf-model /&gt; + &lt;a3d-environment /&gt;</code
              >
            </div>
          </div>

          <!-- Grouped Objects -->
          <div>
            <div
              class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />
                <a3d-group rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }">
                  <a3d-box
                    [position]="[-1.2, 0, 0]"
                    [color]="colors.indigo"
                    [args]="[0.8, 0.8, 0.8]"
                  />
                  <a3d-cylinder
                    [position]="[0, 0, 0]"
                    [color]="colors.pink"
                    [args]="[0.4, 0.4, 0.8, 32]"
                  />
                  <a3d-torus
                    [position]="[1.2, 0, 0]"
                    [color]="colors.amber"
                    [args]="[0.4, 0.15, 16, 48]"
                  />
                </a3d-group>
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <code class="text-sm text-indigo-400"
                >&lt;a3d-group&gt; ... &lt;/a3d-group&gt;</code
              >
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class PrimitivesSectionComponent {
  public readonly colors = SCENE_COLORS;
}
