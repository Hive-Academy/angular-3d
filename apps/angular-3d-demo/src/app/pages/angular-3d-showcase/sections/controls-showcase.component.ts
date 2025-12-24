import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  TorusComponent,
  BoxComponent,
  CylinderComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  OrbitControlsComponent,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SectionContainerComponent } from '../shared/section-container.component';
import { SCENE_COLORS } from '../../../shared/colors';

/**
 * ControlsShowcaseComponent
 *
 * Demonstrates OrbitControlsComponent with 3 interactive configuration variants.
 * Each card shows different orbit control settings for camera manipulation.
 *
 * Controls variants:
 * - Auto-Rotate: Camera automatically rotates with damping
 * - Manual Control: User-controlled orbit, zoom, pan (no auto-rotate)
 * - Restricted Zoom: Limited zoom range between 5 and 15 units
 *
 * All scenes use identical reference objects (box, torus, cylinder) for consistency.
 */
@Component({
  selector: 'app-controls-showcase',
  imports: [
    SectionContainerComponent,
    Scene3dComponent,
    TorusComponent,
    BoxComponent,
    CylinderComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    OrbitControlsComponent,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="3" background="light">
      <span heading>Camera <span class="text-primary-500">Controls</span></span>
      <span description
        >OrbitControls for interactive camera manipulation - click and drag to
        orbit, scroll to zoom</span
      >

      <!-- Auto-Rotate Enabled -->
      <div class="bg-white rounded-card shadow-card p-6x">
        <div
          class="h-96x mb-4x relative overflow-hidden rounded-lg bg-background-dark"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[3, 3, 3]" />

            <!-- Reference objects (same in all 3 cards) -->
            <a3d-box [position]="[-2, 0, 0]" [color]="colors.indigo" />
            <a3d-torus viewportPosition="center" [color]="colors.pink" />
            <a3d-cylinder [position]="[2, 0, 0]" [color]="colors.amber" />

            <!-- OrbitControls with auto-rotate -->
            <a3d-orbit-controls
              [enableDamping]="true"
              [dampingFactor]="0.05"
              [autoRotate]="true"
              [autoRotateSpeed]="2"
            />
          </a3d-scene-3d>
        </div>

        <h3 class="text-headline-md font-bold mb-2x">Auto-Rotate Enabled</h3>
        <p class="text-body-sm text-text-secondary mb-3x">
          Camera automatically rotates around the scene at 2 units/second. Click
          and drag to take manual control.
        </p>
        <pre
          class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"
        ><code class="language-html">&lt;a3d-orbit-controls
  [enableDamping]="true"
  [autoRotate]="true"
  [autoRotateSpeed]="2" /&gt;</code></pre>
      </div>

      <!-- Manual Control Only -->
      <div class="bg-white rounded-card shadow-card p-6x">
        <div
          class="h-96x mb-4x relative overflow-hidden rounded-lg bg-background-dark"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[3, 3, 3]" />

            <!-- Reference objects (same in all 3 cards) -->
            <a3d-box [position]="[-2, 0, 0]" [color]="colors.indigo" />
            <a3d-torus viewportPosition="center" [color]="colors.pink" />
            <a3d-cylinder [position]="[2, 0, 0]" [color]="colors.amber" />

            <!-- OrbitControls without auto-rotate -->
            <a3d-orbit-controls
              [enableDamping]="true"
              [dampingFactor]="0.05"
              [autoRotate]="false"
            />
          </a3d-scene-3d>
        </div>

        <h3 class="text-headline-md font-bold mb-2x">Manual Control Only</h3>
        <p class="text-body-sm text-text-secondary mb-3x">
          Click and drag to orbit, scroll to zoom, right-click drag to pan.
          Damping creates smooth, natural camera movement.
        </p>
        <pre
          class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"
        ><code class="language-html">&lt;a3d-orbit-controls
  [enableDamping]="true"
  [autoRotate]="false" /&gt;</code></pre>
      </div>

      <!-- Restricted Zoom Range -->
      <div class="bg-white rounded-card shadow-card p-6x">
        <div
          class="h-96x mb-4x relative overflow-hidden rounded-lg bg-background-dark"
        >
          <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[3, 3, 3]" />

            <!-- Reference objects (same in all 3 cards) -->
            <a3d-box [position]="[-2, 0, 0]" [color]="colors.indigo" />
            <a3d-torus viewportPosition="center" [color]="colors.pink" />
            <a3d-cylinder [position]="[2, 0, 0]" [color]="colors.amber" />

            <!-- OrbitControls with restricted zoom -->
            <a3d-orbit-controls
              [enableDamping]="true"
              [minDistance]="5"
              [maxDistance]="15"
            />
          </a3d-scene-3d>
        </div>

        <h3 class="text-headline-md font-bold mb-2x">Restricted Zoom Range</h3>
        <p class="text-body-sm text-text-secondary mb-3x">
          Zoom range limited between 5 and 15 units from center. Try scrolling
          to feel the boundaries.
        </p>
        <pre
          class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"
        ><code class="language-html">&lt;a3d-orbit-controls
  [minDistance]="5"
  [maxDistance]="15" /&gt;</code></pre>
      </div>
    </app-section-container>
  `,
})
export class ControlsShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
