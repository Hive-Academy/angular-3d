import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  Rotate3dDirective,
  GltfModelComponent,
  OrbitControlsComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-space-scene',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    Rotate3dDirective,
    GltfModelComponent,
    OrbitControlsComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <a3d-scene-3d [cameraPosition]="[0, 0, 10]" [cameraFov]="75">
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.5" />
        <a3d-directional-light
          [position]="[10, 10, 5]"
          [intensity]="1"
          [color]="'#A1FF4F'"
        />

        <!-- Star Field -->
        <a3d-star-field [starCount]="3000" [color]="'#FFFFFF'" />

        <!-- Earth Model -->
        <a3d-gltf-model
          [modelPath]="'/3d/planet_earth/scene.gltf'"
          [position]="[0, 0, 0]"
          [scale]="2.5"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 60 }"
        />

        <!-- Controls -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [minDistance]="5"
          [maxDistance]="30"
          [autoRotate]="true"
          [autoRotateSpeed]="1.0"
        />

        <!-- Effects -->
        <a3d-bloom-effect [threshold]="0.9" [strength]="0.8" [radius]="0.4" />
      </a3d-scene-3d>

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
