import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  PolyhedronComponent,
  GltfModelComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  StarFieldComponent,
  Rotate3dDirective,
  Float3dDirective,
} from '@hive-academy/angular-3d';

/**
 * Hero 3D Teaser Component
 *
 * Immersive 3D background scene for the hero section.
 * Features:
 * - Dense star field (3000+ stars)
 * - GLTF robot model with floating animation
 * - Rotating wireframe polyhedrons for visual interest
 * - Multiple light sources for dramatic effect
 */
@Component({
  selector: 'app-hero-3d-teaser',
  imports: [
    Scene3dComponent,
    PolyhedronComponent,
    GltfModelComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    StarFieldComponent,
    Rotate3dDirective,
    Float3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-full">
      <a3d-scene-3d [cameraPosition]="[0, 0, 6]" [cameraFov]="70">
        <!-- Dramatic Lighting Setup -->
        <a3d-ambient-light [intensity]="0.3" />
        <a3d-directional-light
          [position]="[5, 5, 5]"
          [intensity]="1.2"
          [color]="'#A1FF4F'"
        />
        <a3d-directional-light
          [position]="[-5, 3, 2]"
          [intensity]="0.6"
          [color]="'#6366F1'"
        />
        <a3d-point-light
          [position]="[0, 2, 3]"
          [intensity]="0.8"
          [color]="'#D946EF'"
        />

        <!-- Enhanced Star Field with multiple layers -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="50"
          [enableTwinkle]="true"
          [stellarColors]="true"
          [multiSize]="true"
        />

        <!-- GLTF Robot Model - Main Hero Element with floating animation 
        <a3d-gltf-model
          float3d
          [floatConfig]="{ speed: 2500, height: 0.3 }"
          [modelPath]="'/3d/mini_robot.glb'"
          [position]="[2.5, -0.5, 0]"
          [scale]="[1.5, 1.5, 1.5]"
          [rotation]="[0, -0.5, 0]"
        />-->

        <!-- Rotating Icosahedron - Secondary focal point -->
        <a3d-polyhedron
          [type]="'icosahedron'"
          [position]="[-1, 1, -2]"
          [args]="[1.2, 0]"
          [color]="'#6366F1'"
          [wireframe]="true"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 1.5 }"
        />

        <!-- Floating polyhedrons for atmosphere -->
        <a3d-polyhedron
          [type]="'octahedron'"
          [position]="[4, 2.5, -4]"
          [args]="[0.7, 0]"
          [color]="'#A1FF4F'"
          [wireframe]="true"
          rotate3d
          [rotateConfig]="{ axis: 'xyz', speed: 1.2 }"
        />

        <a3d-polyhedron
          [type]="'dodecahedron'"
          [position]="[3.5, -2, -3]"
          [args]="[0.5, 0]"
          [color]="'#D946EF'"
          [wireframe]="true"
          rotate3d
          [rotateConfig]="{ axis: 'z', speed: 0.8 }"
        />

        <a3d-polyhedron
          [type]="'tetrahedron'"
          [position]="[-2, -1.5, -1]"
          [args]="[0.6, 0]"
          [color]="'#4FFFDF'"
          [wireframe]="true"
          rotate3d
          [rotateConfig]="{ axis: 'x', speed: 1 }"
        />

        <a3d-polyhedron
          [type]="'icosahedron'"
          [position]="[5, 0, -5]"
          [args]="[0.4, 0]"
          [color]="'#FF6BD4'"
          [wireframe]="true"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 2 }"
        />
      </a3d-scene-3d>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class Hero3dTeaserComponent {}
