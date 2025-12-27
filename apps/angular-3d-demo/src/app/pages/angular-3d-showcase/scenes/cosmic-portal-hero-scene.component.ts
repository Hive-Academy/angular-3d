import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  GlowTroikaTextComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  PlanetComponent,
  Rotate3dDirective,
  Scene3dComponent,
  StarFieldComponent,
} from '@hive-academy/angular-3d';

/**
 * Cosmic Portal Hero Scene - Cinematic Space Experience
 *
 * A visually stunning 3D scene featuring:
 * - Dense star field with stellar colors for deep space atmosphere
 * - Volumetric nebula with purple/pink gradient creating a portal effect
 * - Rotating Earth planet with atmospheric glow
 * - Glowing "COSMIC PORTAL" text as focal point
 * - Bloom post-processing for ethereal glow effects
 * - Auto-rotating orbit controls for cinematic experience
 */
@Component({
  selector: 'app-cosmic-portal-hero-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    StarFieldComponent,
    PlanetComponent,
    NebulaVolumetricComponent,
    GlowTroikaTextComponent,
    Rotate3dDirective,
    OrbitControlsComponent,
    EffectComposerComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="relative bg-background-dark overflow-hidden"
      style="height: calc(100vh - 180px);"
    >
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 25]"
        [cameraFov]="60"
        [backgroundColor]="17"
      >
        <!-- Lighting Setup -->
        <a3d-ambient-light [intensity]="0.15" />
        <a3d-directional-light
          [position]="[10, 5, 10]"
          [intensity]="1.5"
          [color]="'#fff8f0'"
        />

        <!-- Deep Space Star Field Background -->
        <a3d-star-field
          [starCount]="4000"
          [radius]="60"
          [size]="0.03"
          [stellarColors]="true"
          [multiSize]="true"
        />

        <!-- Volumetric Nebula - Creates the "Portal" Effect -->
        <a3d-nebula-volumetric
          [position]="[0, 0, -20]"
          [width]="80"
          [height]="40"
          [primaryColor]="'#8b5cf6'"
          [secondaryColor]="'#ec4899'"
          [opacity]="0.3"
        />

        <!-- Earth Planet - Left Side Focal Element -->
        <a3d-planet
          [position]="[-5, 0, 0]"
          [radius]="3"
          [segments]="96"
          [textureUrl]="'/earth.jpg'"
          [metalness]="0.1"
          [roughness]="0.8"
          [glowIntensity]="0.6"
          [glowColor]="'#4da6ff'"
          [glowDistance]="10"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 2 }"
        />

        <!-- Glowing Title Text -->
        <a3d-glow-troika-text
          [text]="'COSMIC PORTAL'"
          [fontSize]="2"
          [position]="[0, 5, 0]"
          [anchorX]="'center'"
          [anchorY]="'middle'"
          [glowColor]="'#ec4899'"
          [textColor]="'#ffffff'"
          [glowIntensity]="3"
          [glowBlur]="'40%'"
          [glowWidth]="'20%'"
        />

        <!-- Post-processing Effects -->
        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.8" [strength]="0.6" [radius]="0.4" />
        </a3d-effect-composer>

        <!-- Interactive Controls with Auto-Rotation -->
        <a3d-orbit-controls
          [autoRotate]="true"
          [autoRotateSpeed]="0.3"
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [minDistance]="15"
          [maxDistance]="50"
        />
      </a3d-scene-3d>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class CosmicPortalHeroSceneComponent {}
