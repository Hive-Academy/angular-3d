import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  TorusComponent,
  CylinderComponent,
  PolyhedronComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Rotate3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-value-props-3d-scene',
  imports: [
    Scene3dComponent,
    BoxComponent,
    TorusComponent,
    CylinderComponent,
    PolyhedronComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Rotate3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <a3d-scene-3d [cameraPosition]="[0, 0, 15]" [cameraFov]="60">
        <!--
          Z-DEPTH LAYERING CONVENTION:
          - Foreground (0 to -5): UI elements, text
          - Midground (-5 to -15): Logos, secondary elements
          - Background (-15+): Nebula, distant objects
        -->

        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.6" />
        <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

        <!-- 11 Rotating Geometries representing library features -->
        <!-- Row 1: Top row with 5 geometries (foreground layer) -->
        <a3d-box
          viewportPosition="top-left"
          [viewportOffset]="{ offsetX: -8, offsetY: 4, offsetZ: 0 }"
          [color]="'#6366F1'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 10 }"
        />
        <a3d-polyhedron
          [type]="'dodecahedron'"
          viewportPosition="top-left"
          [viewportOffset]="{ offsetX: -4, offsetY: 4, offsetZ: 0 }"
          [color]="'#A1FF4F'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 12 }"
        />
        <a3d-torus
          viewportPosition="top-center"
          [viewportOffset]="{ offsetY: 4, offsetZ: 0 }"
          [color]="'#EC4899'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 8 }"
        />
        <a3d-cylinder
          viewportPosition="top-right"
          [viewportOffset]="{ offsetX: 4, offsetY: 4, offsetZ: 0 }"
          [color]="'#F59E0B'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 10 }"
        />
        <a3d-polyhedron
          [type]="'icosahedron'"
          viewportPosition="top-right"
          [viewportOffset]="{ offsetX: 8, offsetY: 4, offsetZ: 0 }"
          [color]="'#10B981'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 15 }"
        />

        <!-- Row 2: Middle row with 4 geometries (foreground layer) -->
        <a3d-polyhedron
          [type]="'dodecahedron'"
          viewportPosition="center-left"
          [viewportOffset]="{ offsetX: -6, offsetZ: 0 }"
          [color]="'#8B5CF6'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 12 }"
        />
        <a3d-polyhedron
          [type]="'octahedron'"
          viewportPosition="center-left"
          [viewportOffset]="{ offsetX: -2, offsetZ: 0 }"
          [color]="'#EF4444'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 14 }"
        />
        <a3d-box
          viewportPosition="center-right"
          [viewportOffset]="{ offsetX: 2, offsetZ: 0 }"
          [color]="'#3B82F6'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 10 }"
        />
        <a3d-polyhedron
          [type]="'tetrahedron'"
          viewportPosition="center-right"
          [viewportOffset]="{ offsetX: 6, offsetZ: 0 }"
          [color]="'#14B8A6'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 16 }"
        />

        <!-- Row 3: Bottom row with 2 geometries (foreground layer) -->
        <a3d-torus
          viewportPosition="bottom-left"
          [viewportOffset]="{ offsetX: -4, offsetY: -4, offsetZ: 0 }"
          [color]="'#F97316'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 12 }"
        />
        <a3d-cylinder
          viewportPosition="bottom-center"
          [viewportOffset]="{ offsetY: -4, offsetZ: 0 }"
          [color]="'#06B6D4'"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 14 }"
        />
      </a3d-scene-3d>

      <!-- Overlay Text -->
      <div
        class="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <div class="text-center text-white">
          <h2 class="text-display-lg font-bold mb-4x">
            11 <span class="text-neon-green">Value Propositions</span>
          </h2>
          <p class="text-headline-md text-text-secondary">
            Each geometry represents a powerful feature
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ValueProps3dSceneComponent {}
