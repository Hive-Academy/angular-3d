import { Component } from '@angular/core';
import {
  Scene3dComponent,
  BoxComponent,
  SphereComponent,
  TorusComponent,
  CylinderComponent,
  PolyhedronComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-value-props-3d-scene',
  imports: [
    Scene3dComponent,
    BoxComponent,
    SphereComponent,
    TorusComponent,
    CylinderComponent,
    PolyhedronComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    Rotate3dDirective,
  ],
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <scene-3d [cameraPosition]="[0, 0, 15]" [cameraFov]="60">
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.6" />
        <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

        <!-- 11 Rotating Geometries representing library features -->
        <!-- Row 1 -->
        <a3d-box
          [position]="[-8, 4, 0]"
          [color]="'#6366F1'"
          rotate3d
          [rotationSpeed]="0.005"
        />
        <a3d-sphere
          [position]="[-4, 4, 0]"
          [color]="'#A1FF4F'"
          rotate3d
          [rotationSpeed]="0.006"
        />
        <a3d-torus
          [position]="[0, 4, 0]"
          [color]="'#EC4899'"
          rotate3d
          [rotationSpeed]="0.007"
        />
        <a3d-cylinder
          [position]="[4, 4, 0]"
          [color]="'#F59E0B'"
          rotate3d
          [rotationSpeed]="0.005"
        />
        <a3d-polyhedron
          [type]="'icosahedron'"
          [position]="[8, 4, 0]"
          [color]="'#10B981'"
          rotate3d
          [rotationSpeed]="0.008"
        />

        <!-- Row 2 -->
        <a3d-polyhedron
          [type]="'dodecahedron'"
          [position]="[-6, 0, 0]"
          [color]="'#8B5CF6'"
          rotate3d
          [rotationSpeed]="0.006"
        />
        <a3d-polyhedron
          [type]="'octahedron'"
          [position]="[-2, 0, 0]"
          [color]="'#EF4444'"
          rotate3d
          [rotationSpeed]="0.007"
        />
        <a3d-box
          [position]="[2, 0, 0]"
          [color]="'#3B82F6'"
          rotate3d
          [rotationSpeed]="0.005"
        />
        <a3d-sphere
          [position]="[6, 0, 0]"
          [color]="'#14B8A6'"
          rotate3d
          [rotationSpeed]="0.008"
        />

        <!-- Row 3 -->
        <a3d-torus
          [position]="[-4, -4, 0]"
          [color]="'#F97316'"
          rotate3d
          [rotationSpeed]="0.006"
        />
        <a3d-cylinder
          [position]="[0, -4, 0]"
          [color]="'#06B6D4'"
          rotate3d
          [rotationSpeed]="0.007"
        />
      </scene-3d>

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
