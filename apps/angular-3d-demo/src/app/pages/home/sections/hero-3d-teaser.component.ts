import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  ViewportPositioningService,
  ViewportPositionDirective,
  Rotate3dDirective,
  PlanetComponent,
  StarFieldComponent,
  InstancedParticleTextComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  BloomEffectComponent,
} from '@hive-academy/angular-3d';
import { SCENE_COLORS, SCENE_COLOR_STRINGS } from '../../../shared/colors';

/**
 * Hero 3D Teaser - Production-quality space scene
 *
 * Demonstrates ViewportPositioningService (reactive CSS-like positioning),
 * multi-layer star fields, instanced particle text, volumetric effects.
 *
 * Z-depth: Foreground (0 to -5), Midground (-5 to -15), Background (-15+)
 * @see libs/angular-3d/docs/POSITIONING_GUIDE.md for positioning patterns
 */
@Component({
  selector: 'app-hero-3d-teaser',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    ViewportPositionDirective,
    Rotate3dDirective,
    PlanetComponent,
    StarFieldComponent,
    InstancedParticleTextComponent,
    NebulaVolumetricComponent,
    OrbitControlsComponent,
    BloomEffectComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full h-full"
      role="img"
      aria-label="Interactive 3D space scene with rotating Earth, twinkling stars, and camera controls"
    >
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
        <!-- Lighting -->
        <a3d-ambient-light [color]="colors.white" [intensity]="0.05" />
        <a3d-directional-light
          [position]="[30, 15, 25]"
          [color]="colors.white"
          [intensity]="0.3"
          [castShadow]="true"
        />

        <!-- Planet: Midground (-9) -->
        <a3d-planet
          viewportPosition="center"
          [viewportOffset]="{ offsetZ: -9 }"
          [radius]="2.3"
          [segments]="64"
          [color]="colors.deepBlue"
          [metalness]="0.4"
          [roughness]="0.6"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 60 }"
        />

        <!-- Multi-layer star fields for parallax depth -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="50"
          [enableTwinkle]="true"
          [multiSize]="true"
          [stellarColors]="true"
        />
        <a3d-star-field [starCount]="2000" [radius]="40" />
        <a3d-star-field
          [starCount]="2500"
          [radius]="30"
          [enableTwinkle]="true"
        />

        <!-- Particle text: Foreground (0), positioned via service -->
        <a3d-instanced-particle-text
          text="Angular 3D Library"
          [position]="topTextPosition()"
          [fontSize]="25"
          [particleColor]="colors.softGray"
          [opacity]="0.35"
        />

        <!-- Nebula: Background (-20) -->
        <a3d-nebula-volumetric
          viewportPosition="top-right"
          [viewportOffset]="{ offsetZ: -20 }"
          [width]="60"
          [height]="20"
          [layers]="2"
          [opacity]="0.9"
          [primaryColor]="colorStrings.skyBlue"
        />

        <!-- Camera controls -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [enableZoom]="true"
          [minDistance]="5"
          [maxDistance]="50"
        />

        <!-- Post-processing -->
        <a3d-bloom-effect [threshold]="0.8" [strength]="0.5" [radius]="0.4" />
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
export class Hero3dTeaserComponent {
  private readonly positioning = inject(ViewportPositioningService);

  public readonly colors = SCENE_COLORS;
  public readonly colorStrings = SCENE_COLOR_STRINGS;

  /** Position for particle text via service (percentage-based positioning) */
  public readonly topTextPosition = this.positioning.getPosition({
    x: '50%',
    y: '25%',
  });
}
