import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  EnvironmentComponent,
  NebulaVolumetricComponent,
  NodeMaterialDirective,
  OrbitControlsComponent,
  Scene3dComponent,
  SphereComponent,
  StarFieldComponent,
  tslWaterMarble,
} from '@hive-academy/angular-3d';

/**
 * Hero Space Scene - Procedural Planet Showcase
 *
 * A cinematic 3D space scene featuring TSL-generated procedural planets:
 * - Earth-like planet with procedural land, water, and snow
 * - Gas Giant with Jupiter-like banded atmosphere
 * - Sun with photosphere granulation patterns
 * - Mouse tracking for interactive planet rotation
 * - Multi-layer star fields with parallax rotation
 * - Volumetric nebula backdrop with edge pulse animation
 * - Bloom effects for atmospheric glow
 */
@Component({
  selector: 'app-hero-space-scene',
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    SphereComponent,
    NodeMaterialDirective,
    OrbitControlsComponent,
    BloomEffectComponent,
    EnvironmentComponent,
    EffectComposerComponent,
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
        [frameloop]="'always'"
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

        <!-- Multi-Layer Star Fields for depth parallax with gentle rotation -->
        <!-- Layer 1: Close stars (larger, brighter) - slow rotation -->
        <a3d-star-field
          [starCount]="2000"
          [radius]="40"
          [size]="0.035"
          [multiSize]="true"
          [stellarColors]="true"
          [enableRotation]="true"
          [rotationSpeed]="0.008"
          [rotationAxis]="'y'"
        />

        <!-- Layer 2: Mid-range stars - slightly slower rotation -->
        <a3d-star-field
          [starCount]="1500"
          [radius]="55"
          [size]="0.025"
          [multiSize]="true"
          [stellarColors]="true"
          [enableRotation]="true"
          [rotationSpeed]="0.005"
          [rotationAxis]="'y'"
        />

        <!-- Layer 3: Distant stars (smaller, dimmer) - slowest rotation for parallax -->
        <a3d-star-field
          [starCount]="1500"
          [radius]="70"
          [size]="0.018"
          [opacity]="0.5"
          [multiSize]="true"
          [stellarColors]="true"
          [enableRotation]="true"
          [rotationSpeed]="0.003"
          [rotationAxis]="'y'"
        />

        <!-- Glossy animated marble sphere -->
        <a3d-sphere
          [args]="[4, 32, 32]"
          [position]="[0, 0, 0]"
          [roughness]="0.1"
          [metalness]="0.0"
          a3dNodeMaterial
          [colorNode]="marbleTexture"
        />

        <!-- Interactive controls -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.03"
          [minDistance]="10"
          [maxDistance]="40"
          [autoRotate]="false"
        />

        <a3d-nebula-volumetric
          [position]="[8, 4, -80]"
          [width]="250"
          [height]="80"
          [opacity]="0.75"
          [primaryColor]="'#3344aa'"
          [secondaryColor]="'#160805ff'"
          [enableFlow]="false"
          [noiseScale]="3.5"
          [density]="1.2"
          [glowIntensity]="0.6"
          [centerFalloff]="1.2"
          [erosionStrength]="0.65"
          [enableEdgePulse]="true"
          [edgePulseSpeed]="0.3"
          [edgePulseAmount]="0.2"
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
export class HeroSpaceSceneComponent {
  // TSL animated water marble texture - glossy with internal animation
  protected readonly marbleTexture = tslWaterMarble({
    scale: 2,
    turbulence: 0.6,
    speed: 0.5,
  });
}
