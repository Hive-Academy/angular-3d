import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  StarFieldComponent,
  ParticleTextComponent,
  EffectComposerComponent,
  BloomEffectComponent,
  OrbitControlsComponent,
  Float3dDirective,
} from '@hive-academy/angular-3d';

/**
 * ParticleStormHeroSceneComponent - Dramatic Particle Text Effect
 *
 * Features:
 * - Multi-layer star fields for depth and atmosphere
 * - ParticleTextComponent displaying "PARTICLE STORM" in cyan
 * - Strong bloom effect for intense glow
 * - Dark space background for maximum contrast
 */
@Component({
  selector: 'app-particle-storm-hero-scene',
  standalone: true,
  imports: [
    Scene3dComponent,
    AmbientLightComponent,
    StarFieldComponent,
    ParticleTextComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    OrbitControlsComponent,
    Float3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 15]"
        [cameraFov]="60"
        [enableAntialiasing]="true"
        [backgroundColor]="backgroundColor"
      >
        <!-- Ambient lighting for subtle visibility -->
        <a3d-ambient-light [intensity]="0.1" />

        <!-- Multi-layer star fields for depth -->
        <!-- Layer 1: Dense foreground stars -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="50"
          [size]="0.03"
          [stellarColors]="true"
          float3d
          [floatConfig]="{
            height: 0.8,
            speed: 3000,
            delay: 500,
            ease: 'power1.inOut',
            autoStart: true
          }"
        />

        <!-- Layer 2: Distant background stars -->
        <a3d-star-field
          [starCount]="2000"
          [radius]="70"
          [size]="0.02"
          [opacity]="0.6"
          [stellarColors]="true"
          float3d
          [floatConfig]="{
            height: 0.8,
            speed: 3000,
            delay: 500,
            ease: 'power1.inOut',
            autoStart: true
          }"
        />

        <!-- Particle text hero element -->
        <a3d-particle-text
          [text]="'PARTICLE STORM'"
          [fontSize]="80"
          [sampleStep]="3"
          [fontScaleFactor]="0.08"
          [particleColor]="particleColor"
          [opacity]="0.25"
          [maxParticleScale]="0.4"
          [particlesPerPixel]="0.7"
          [position]="[0, 4, -10]"
          [skipInitialGrowth]="true"
          [lineHeightMultiplier]="2.5"
        />

        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.8" [strength]="0.6" [radius]="0.4" />
        </a3d-effect-composer>

        <!-- Interactive Controls with Auto-Rotation -->
        <a3d-orbit-controls
          [autoRotate]="false"
          [autoRotateSpeed]="0.3"
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [minDistance]="15"
          [maxDistance]="50"
        />
      </a3d-scene-3d>

      <!-- Scene info overlay -->
      <div class="absolute bottom-4 left-4 z-20 text-cyan-400/70 text-sm">
        <p class="font-medium">Particle Storm</p>
        <p class="text-xs text-cyan-300/50">
          Volumetric particle text with bloom
        </p>
      </div>
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
export class ParticleStormHeroSceneComponent {
  public readonly backgroundColor = 0x0a0a0f;
  public readonly particleColor = 0x00d4ff;
}
