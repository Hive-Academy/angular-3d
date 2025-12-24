import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  TorusComponent,
  CylinderComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  OrbitControlsComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * Controls Section - OrbitControls variants.
 *
 * Demonstrates different OrbitControls configurations.
 */
@Component({
  selector: 'app-controls-section',
  imports: [
    Scene3dComponent,
    BoxComponent,
    TorusComponent,
    CylinderComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    OrbitControlsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- OrbitControls Variants -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Camera Controls</h2>
          <p class="text-text-secondary">
            OrbitControls for interactive camera manipulation
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- Auto-Rotate -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 2, 8]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />

                <a3d-box [position]="[-1.5, 0, 0]" [color]="colors.indigo" />
                <a3d-torus [position]="[0, 0, 0]" [color]="colors.pink" />
                <a3d-cylinder [position]="[1.5, 0, 0]" [color]="colors.amber" />

                <a3d-orbit-controls
                  [enableDamping]="true"
                  [dampingFactor]="0.05"
                  [autoRotate]="true"
                  [autoRotateSpeed]="2"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg text-center">
              <h3 class="font-semibold mb-1">Auto-Rotate</h3>
              <p class="text-xs text-text-secondary mb-2">
                Camera rotates automatically
              </p>
              <code class="text-xs text-green-400">[autoRotate]="true"</code>
            </div>
          </div>

          <!-- Manual Control -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 2, 8]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />

                <a3d-box [position]="[-1.5, 0, 0]" [color]="colors.indigo" />
                <a3d-torus [position]="[0, 0, 0]" [color]="colors.pink" />
                <a3d-cylinder [position]="[1.5, 0, 0]" [color]="colors.amber" />

                <a3d-orbit-controls
                  [enableDamping]="true"
                  [dampingFactor]="0.05"
                  [autoRotate]="false"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg text-center">
              <h3 class="font-semibold mb-1">Manual Control</h3>
              <p class="text-xs text-text-secondary mb-2">
                Drag to orbit, scroll to zoom
              </p>
              <code class="text-xs text-cyan-400">[enableDamping]="true"</code>
            </div>
          </div>

          <!-- Restricted Zoom -->
          <div>
            <div
              class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl"
            >
              <a3d-scene-3d [cameraPosition]="[0, 2, 8]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light
                  [position]="[3, 3, 3]"
                  [intensity]="0.8"
                />

                <a3d-box [position]="[-1.5, 0, 0]" [color]="colors.indigo" />
                <a3d-torus [position]="[0, 0, 0]" [color]="colors.pink" />
                <a3d-cylinder [position]="[1.5, 0, 0]" [color]="colors.amber" />

                <a3d-orbit-controls
                  [enableDamping]="true"
                  [minDistance]="5"
                  [maxDistance]="15"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg text-center">
              <h3 class="font-semibold mb-1">Restricted Zoom</h3>
              <p class="text-xs text-text-secondary mb-2">
                Zoom limited to 5-15 units
              </p>
              <code class="text-xs text-amber-400"
                >[minDistance]="5" [maxDistance]="15"</code
              >
            </div>
          </div>
        </div>
      </section>

      <!-- Usage Instructions -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Interaction Guide</h2>
          <p class="text-text-secondary">How to use the orbit controls</p>
        </div>

        <div class="grid md:grid-cols-3 gap-6x max-w-3xl mx-auto text-center">
          <div class="p-6x bg-white/5 rounded-xl">
            <div class="text-3xl mb-3x">🖱️</div>
            <h3 class="font-semibold mb-2">Left Drag</h3>
            <p class="text-sm text-text-secondary">Orbit around the scene</p>
          </div>
          <div class="p-6x bg-white/5 rounded-xl">
            <div class="text-3xl mb-3x">⚙️</div>
            <h3 class="font-semibold mb-2">Scroll</h3>
            <p class="text-sm text-text-secondary">Zoom in and out</p>
          </div>
          <div class="p-6x bg-white/5 rounded-xl">
            <div class="text-3xl mb-3x">👆</div>
            <h3 class="font-semibold mb-2">Right Drag</h3>
            <p class="text-sm text-text-secondary">Pan the camera</p>
          </div>
        </div>
      </section>
    </div>
  `,
})
export default class ControlsSectionComponent {
  public readonly colors = SCENE_COLORS;
}
