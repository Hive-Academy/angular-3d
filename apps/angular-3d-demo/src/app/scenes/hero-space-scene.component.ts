import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  Rotate3dDirective,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-space-scene',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    Rotate3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <scene-3d [cameraPosition]="[0, 0, 10]" [cameraFov]="75">
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.5" />
        <a3d-directional-light
          [position]="[10, 10, 5]"
          [intensity]="1"
          [color]="'#A1FF4F'"
        />

        <!-- Star Field (3 layers) -->
        <a3d-star-field
          [count]="3000"
          [colors]="['#FFFFFF', '#A1FF4F', '#6366F1']"
        />

        <!-- TODO: Add remaining 3D elements when components are ready:
             - Earth GLTF model
             - Nebula
             - Tech logos (SVGIcon)
             - Particle text
             - Flying robots (with SpaceFlight3d directive)
             - OrbitControls
             - Bloom effect
        -->
      </scene-3d>

      <!-- Overlay Text -->
      <div class="absolute bottom-10x left-10x z-10">
        <h1 class="text-display-lg text-white mb-2x">Angular-3D</h1>
        <p class="text-headline-md text-text-secondary">
          Component-based Three.js for Angular
        </p>
      </div>
    </div>
  `,
})
export class HeroSpaceSceneComponent {}
