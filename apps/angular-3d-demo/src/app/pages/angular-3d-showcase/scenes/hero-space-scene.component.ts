import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  StarFieldComponent,
  NebulaVolumetricComponent,
  PlanetComponent,
  Rotate3dDirective,
  GltfModelComponent,
  OrbitControlsComponent,
  BloomEffectComponent,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-hero-space-scene',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    NebulaVolumetricComponent,
    PlanetComponent,
    Rotate3dDirective,
    GltfModelComponent,
    OrbitControlsComponent,
    BloomEffectComponent,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.5" />
        <a3d-directional-light
          [position]="[10, 10, 5]"
          [intensity]="1"
          [color]="colors.neonGreen"
        />

        <!-- Multi-Layer Star Fields (creates depth parallax effect) -->
        <!-- Layer 1: Close stars (larger, brighter) -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="35"
          [size]="0.03"
          [multiSize]="true"
          [stellarColors]="true"
        />

        <!-- Layer 2: Mid-range stars -->
        <a3d-star-field
          [starCount]="2000"
          [radius]="45"
          [size]="0.02"
          [multiSize]="true"
          [stellarColors]="true"
        />

        <!-- Layer 3: Distant stars (smaller, dimmer) -->
        <a3d-star-field
          [starCount]="2500"
          [radius]="60"
          [size]="0.015"
          [opacity]="0.6"
          [multiSize]="true"
          [stellarColors]="true"
        />

        <!-- Volumetric Nebula (atmospheric depth in top-right background) -->
        <a3d-nebula-volumetric
          [position]="[15, 10, -20]"
          [scale]="[8, 8, 8]"
          [color]="'#4a0080'"
          [opacity]="0.3"
        />

        <!-- Moon (showcases PlanetComponent with glow and emissive features) -->
        <a3d-planet
          [position]="[-8, 3, -5]"
          [radius]="1.2"
          [color]="0xaaaaaa"
          [emissive]="0x222222"
          [emissiveIntensity]="0.1"
          [glowIntensity]="0.5"
          [glowColor]="0xccccff"
        />

        <!-- Earth Model -->
        <a3d-gltf-model
          [modelPath]="'/3d/planet_earth/scene.gltf'"
          viewportPosition="center"
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
        <a3d-bloom-effect [threshold]="0.8" [strength]="0.8" [radius]="0.4" />
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
export class HeroSpaceSceneComponent {
  public readonly colors = SCENE_COLORS;
}
