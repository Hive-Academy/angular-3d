import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DepthOfFieldEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  EnvironmentComponent,
  NebulaComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  PlanetComponent,
  Rotate3dDirective,
  Scene3dComponent,
  StarFieldComponent,
} from '@hive-academy/angular-3d';

/**
 * Hero Space Scene - Cinematic Earth and Moon showcase
 *
 * A clean 3D space scene featuring:
 * - Textured Earth with realistic surface and IBL reflections
 * - Textured Moon orbiting in the distance
 * - Multi-layer star fields for depth
 * - HDRI environment for realistic reflections
 * - DOF effect for cinematic focus
 * - Bloom effects for atmospheric glow
 */
@Component({
  selector: 'app-hero-space-scene',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    PlanetComponent,
    Rotate3dDirective,
    OrbitControlsComponent,
    BloomEffectComponent,
    EnvironmentComponent,
    EffectComposerComponent,
    DepthOfFieldEffectComponent,
    NebulaComponent,
    NebulaVolumetricComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative bg-background-dark overflow-hidden"
      style="height: calc(100vh - 180px);"
    >
      <a3d-scene-3d
        [cameraPosition]="[0, 2, 18]"
        [cameraFov]="60"
        [frameloop]="'demand'"
      >
        <!-- Ambient fill light -->
        <a3d-ambient-light [intensity]="0.12" />

        <!-- Main sun light from dramatic angle -->
        <a3d-directional-light
          [position]="[15, 8, 10]"
          [intensity]="1.6"
          [color]="'#fff8f0'"
        />

        <!-- Rim light for cinematic effect -->
        <a3d-directional-light
          [position]="[-10, 5, -5]"
          [intensity]="0.25"
          [color]="'#4a90d9'"
        />

        <!-- HDRI Environment for IBL reflections -->
        <a3d-environment
          [preset]="'night'"
          [intensity]="0.3"
          [background]="false"
        />

        <!-- Multi-Layer Star Fields for depth parallax -->
        <!-- Layer 1: Close stars (larger, brighter) -->
        <a3d-star-field
          [starCount]="4000"
          [radius]="40"
          [size]="0.035"
          [multiSize]="true"
          [stellarColors]="true"
        />

        <!-- Layer 2: Mid-range stars -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="55"
          [size]="0.025"
          [multiSize]="true"
          [stellarColors]="true"
        />

        <!-- Layer 3: Distant stars (smaller, dimmer) -->
        <a3d-star-field
          [starCount]="3500"
          [radius]="70"
          [size]="0.018"
          [opacity]="0.5"
          [multiSize]="true"
          [stellarColors]="true"
        />

        <!-- EARTH - Main focal point, slightly off-center -->
        <a3d-planet
          [position]="[-2, 0, 0]"
          [radius]="4"
          [segments]="128"
          [textureUrl]="'/earth.jpg'"
          [metalness]="0.1"
          [roughness]="0.8"
          [emissive]="'#001122'"
          [emissiveIntensity]="0.03"
          [glowIntensity]="0.5"
          [glowColor]="'#4da6ff'"
          [glowDistance]="12"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 3 }"
        />

        <!-- MOON - Upper right, smaller and distant -->
        <a3d-planet
          [position]="[8, 4, -8]"
          [radius]="1.2"
          [segments]="64"
          [textureUrl]="'/moon.jpg'"
          [metalness]="0.05"
          [roughness]="0.95"
          [emissive]="'#111111'"
          [emissiveIntensity]="0.01"
          [glowIntensity]="0.15"
          [glowColor]="'#aaaacc'"
          [glowDistance]="5"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 2 }"
        />

        <!-- Interactive controls -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.03"
          [minDistance]="10"
          [maxDistance]="40"
          [autoRotate]="true"
          [autoRotateSpeed]="0.3"
        />

        <a3d-nebula-volumetric
          [position]="[8, 4, -80]"
          [width]="250"
          [height]="80"
          [opacity]="0.75"
          [primaryColor]="'#3344aa'"
          [secondaryColor]="'#160805ff'"
          [enableFlow]="true"
          [flowSpeed]="0.15"
          [noiseScale]="3.5"
          [density]="1.2"
          [glowIntensity]="0.6"
          [centerFalloff]="1.2"
          [erosionStrength]="0.65"
        />

        <!-- Post-processing effects -->
        <a3d-effect-composer>
          <!-- Bloom for atmospheric glow -->
          <a3d-bloom-effect [threshold]="0.7" [strength]="0.5" [radius]="0.4" />
        </a3d-effect-composer>
      </a3d-scene-3d>

      <!-- Cinematic overlay text -->
      <div class="absolute bottom-8x left-8x z-10 pointer-events-none">
        <h1 class="text-display-lg text-white font-bold mb-2x drop-shadow-2xl">
          <span class="text-gradient-cosmic">Angular-3D</span>
        </h1>
        <p class="text-headline-md text-white/80 drop-shadow-lg">
          Stunning 3D experiences for Angular
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .text-gradient-cosmic {
        background: linear-gradient(
          135deg,
          #6366f1 0%,
          #8b5cf6 30%,
          #ec4899 60%,
          #f43f5e 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    `,
  ],
})
export class HeroSpaceSceneComponent {}
