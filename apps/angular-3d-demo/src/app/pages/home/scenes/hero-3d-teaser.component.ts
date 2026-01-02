import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DepthOfFieldEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  EnvironmentComponent,
  Float3dDirective,
  FloatingSphereComponent,
  FogComponent,
  GltfModelComponent,
  LightingPreset,
  MouseTracking3dDirective,
  NebulaComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  ParticleTextComponent,
  PointLightComponent,
  Rotate3dDirective,
  Scene3dComponent,
  SceneLightingComponent,
  ScrollZoomCoordinatorDirective,
  SpaceFlight3dDirective,
  StarFieldComponent,
  SvgIconComponent,
  ViewportPositionDirective,
  type SpaceFlightWaypoint,
} from '@hive-academy/angular-3d';
import { OrbitControls } from 'three-stdlib';
import { SCENE_COLORS, SCENE_COLOR_STRINGS } from '../../../shared/colors';

/**
 * Hero 3D Teaser - Production-quality space scene
 *
 * Demonstrates ViewportPositioningService (reactive CSS-like positioning),
 * multi-layer star fields, instanced particle text, volumetric effects.
 *
 * **Scroll Behavior:**
 * - Initial scroll zooms the camera out (9 → 25 units)
 * - Description text appears as camera zooms out (positioned at z=22)
 * - Once zoom is complete, page scroll resumes normally
 * - Scrolling back up re-engages camera zoom
 *
 * Z-depth: Foreground (0 to -5), Midground (-5 to -15), Background (-15+)
 * @see libs/angular-3d/docs/POSITIONING_GUIDE.md for positioning patterns
 */
@Component({
  selector: 'app-hero-3d-teaser',
  standalone: true,
  imports: [
    Scene3dComponent,
    SceneLightingComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
    EnvironmentComponent,
    ViewportPositionDirective,
    Rotate3dDirective,
    Float3dDirective,
    SpaceFlight3dDirective,
    GltfModelComponent,
    StarFieldComponent,
    NebulaComponent,
    NebulaVolumetricComponent,
    OrbitControlsComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    DepthOfFieldEffectComponent,
    FloatingSphereComponent,
    ScrollZoomCoordinatorDirective,
    ParticleTextComponent,
    SvgIconComponent,
    MouseTracking3dDirective,
    FogComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="scene-container"
      [style.background-color]="backgroundColor()"
      role="img"
      aria-label="Interactive 3D space scene with rotating Earth, twinkling stars, and camera controls"
    >
      <!-- Lighting Mode Switcher UI -->
      <div class="lighting-switcher">
        <div class="switcher-label">Lighting Mode</div>
        @for (preset of presetList; track preset) {
        <button
          class="preset-btn"
          [class.active]="currentPreset() === preset"
          (click)="setPreset(preset)"
        >
          {{ formatPresetName(preset) }}
        </button>
        }
      </div>

      <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="75">
        <!-- ================================ -->
        <!-- CINEMATIC LIGHTING - Dynamic Preset -->
        <!-- ================================ -->
        <a3d-scene-lighting
          [preset]="currentPreset()"
          (backgroundColorChange)="onBackgroundColorChange($event)"
        />

        <!-- HDRI Environment for IBL on PBR materials -->
        <a3d-environment
          [preset]="'night'"
          [intensity]="0.3"
          [background]="false"
          [blur]="0.3"
        />

        <!-- ================================ -->
        <!-- REALISTIC EARTH (GLTF Model with Rotation) -->
        <!-- Pushed further right for better text balance -->
        <!-- ================================
        <a3d-gltf-model
          [modelPath]="'3d/planet_earth/scene.gltf'"
          [viewportPosition]="{ x: '78%', y: '50%' }"
          [viewportOffset]="{ offsetZ: -9 }"
          [scale]="2.3"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 120, direction: 1 }"
        />-->

        <a3d-fog [color]="colors.black" />

        <!-- Hero Text - Left side, stacked vertically with proper spacing -->
        <a3d-particle-text
          text="Build Stunning"
          [position]="[-12, 5, 0]"
          [fontSize]="30"
          [particleColor]="colors.white"
          [opacity]="0.3"
          [maxParticleScale]="0.03"
          [particlesPerPixel]="3"
          [blendMode]="'normal'"
          [skipInitialGrowth]="true"
          [particleGrowSpeed]="0.02"
          [pulseSpeed]="0.005"
          [texturePath]="'3d/textures/smoke.png'"
        />

        <!-- Glowing Text - Angular 3D Experiences -->
        <a3d-particle-text
          text="Angular 3D Experiences"
          [position]="[-12, 0, 0]"
          [fontSize]="30"
          [particleColor]="colors.neonGreen"
          [opacity]="0.3"
          [maxParticleScale]="0.03"
          [particlesPerPixel]="3"
          [blendMode]="'normal'"
          [skipInitialGrowth]="true"
          [particleGrowSpeed]="0.02"
          [pulseSpeed]="0.005"
          [texturePath]="'3d/textures/smoke.png'"
        />

        <a3d-particle-text
          text="You Already Know"
          [position]="[-12, -5, 0]"
          [fontSize]="30"
          [particleColor]="colors.white"
          [opacity]="0.3"
          [maxParticleScale]="0.03"
          [particlesPerPixel]="3"
          [blendMode]="'normal'"
          [skipInitialGrowth]="true"
          [particleGrowSpeed]="0.02"
          [pulseSpeed]="0.005"
          [texturePath]="'3d/textures/smoke.png'"
        />

        <!-- ================================ -->
        <!-- FLYING ROBOTS (With SpaceFlight Animation) -->
        <!-- ================================ -->
        <!-- Mini Robot #1 - High altitude orbital path -->
        <a3d-gltf-model
          [modelPath]="'3d/robo_head/scene.gltf'"
          [position]="[0, 0, -2]"
          [scale]="1"
          a3dSpaceFlight3d
          [flightPath]="robot2FlightPath"
          [rotationsPerCycle]="3"
          [autoStart]="true"
          [loop]="true"
        />

        <!-- Robo Head - Lower depth orbital path -->
        <a3d-gltf-model
          modelPath="3d/mini_robot.glb"
          [scale]="[0.2, 0.2, 0.2]"
          viewportPosition="center"
          mouseTracking3d
          [trackingConfig]="{
            sensitivity: 0.8,
            limit: 0.5,
            damping: 0.05,
            invertX: true,
            translationRange: [10, 5],
            invertPosX: true
          }"
          float3d
          [floatConfig]="{ height: 0.2, speed: 2 }"
        />

        <!-- Tiny sphere cluster - near earth -->
        <a3d-floating-sphere
          [position]="[4, 3, -6]"
          [args]="[0.15, 16, 8]"
          [color]="colors.white"
          [metalness]="0.5"
          [roughness]="0.4"
          float3d
          [floatConfig]="{ height: 0.2, speed: 1800, ease: 'sine.inOut' }"
        />

        <a3d-floating-sphere
          [position]="[-5, -3, -7]"
          [args]="[0.2, 16, 8]"
          [color]="colors.softGray"
          [metalness]="0.6"
          [roughness]="0.3"
          float3d
          [floatConfig]="{ height: 0.35, speed: 2200, ease: 'sine.inOut' }"
        />

        <!-- ================================ -->
        <!-- MULTI-LAYER STAR FIELDS -->
        <!-- Creates depth parallax effect -->
        <!-- ================================ -->
        <!-- Background stars (distant) -->
        <a3d-star-field
          [starCount]="4000"
          [radius]="60"
          [enableTwinkle]="true"
          [multiSize]="true"
          [stellarColors]="true"
        />
        <!-- Midground stars (brighter) -->
        <a3d-star-field
          [starCount]="2500"
          [radius]="45"
          [enableTwinkle]="false"
          [multiSize]="true"
        />
        <!-- Foreground stars (closest, brightest) -->
        <a3d-star-field
          [starCount]="3000"
          [radius]="35"
          [enableTwinkle]="true"
          [stellarColors]="true"
        />

        <!-- Volumetric Nebula with Layered Billboards
        <a3d-nebula-volumetric
          [position]="[140, 70, -120]"
          [width]="150"
          [height]="50"
          [opacity]="0.75"
          [primaryColor]="'#3344aa'"
          [secondaryColor]="'#160805ff'"
          [enableFlow]="true"
          [flowSpeed]="0.15"
          [noiseScale]="3.5"
          [density]="1.2"
          [glowIntensity]="0.6"
        /> -->

        <a3d-orbit-controls
          scrollZoomCoordinator
          [orbitControls]="orbitControlsInstance"
          [target]="[0, 0, 0]"
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [enableZoom]="isZoomEnabled"
          [minDistance]="15"
          [maxDistance]="30"
          [rotateSpeed]="0.5"
          [enablePan]="false"
          [scrollThreshold]="0.5"
          (controlsReady)="onControlsReady($event)"
          (zoomEnabledChange)="onZoomEnabledChange($event)"
        />

        <!-- ================================ -->
        <!-- POST-PROCESSING - Bloom Only (DOF disabled pending fix) -->
        <!-- ================================
        <a3d-effect-composer [enabled]="true">
          <a3d-dof-effect [focus]="20" [aperture]="0.3" [maxblur]="0.0002" />
        </a3d-effect-composer>-->

        <!-- Bloom for glowing effects-->
        <a3d-effect-composer [enabled]="true">
          <a3d-bloom-effect
            [threshold]="0.2"
            [strength]="0.5"
            [radius]="0.07"
          />
        </a3d-effect-composer>
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

      .scene-container {
        width: 100%;
        height: 100%;
        position: relative;
        transition: background-color 0.5s ease;
      }

      .lighting-switcher {
        position: absolute;
        top: 16px;
        right: 16px;
        z-index: 100;
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(8px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .switcher-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.6);
        margin-bottom: 4px;
      }

      .preset-btn {
        padding: 8px 14px;
        font-size: 13px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.8);
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
      }

      .preset-btn:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.3);
      }

      .preset-btn.active {
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        border-color: #8b5cf6;
        color: white;
      }
    `,
  ],
})
export class Hero3dTeaserComponent {
  public readonly colors = SCENE_COLORS;
  public readonly colorStrings = SCENE_COLOR_STRINGS;

  /** Current lighting preset */
  public readonly currentPreset = signal<LightingPreset>('cinematic-space');

  /** Background color for the scene container (CSS hex) */
  public readonly backgroundColor = signal<string>('#020208');

  /** Available presets for the UI switcher */
  public readonly presetList: LightingPreset[] = [
    'cinematic-space',
    'neon-cyberpunk',
    'rim-light',
    'three-point',
    'dramatic',
    'studio',
  ];

  // ✅ Store orbit controls reference for scroll coordinator
  public orbitControlsInstance?: OrbitControls;

  // ✅ Reactive zoom enable/disable for scroll coordination
  public isZoomEnabled = true;

  /**
   * Robot 1 (Mini Robot) - HIGH ALTITUDE PATH
   * Flies in upper regions with dramatic height changes
   */
  public readonly robot1FlightPath: SpaceFlightWaypoint[] = [
    { position: [-12, 8, -8], duration: 10, easing: 'easeInOut' },
    { position: [10, 12, -5], duration: 8, easing: 'easeInOut' },
    { position: [-6, 4, 10], duration: 9, easing: 'easeIn' },
    { position: [8, 10, -12], duration: 11, easing: 'easeOut' },
    { position: [-12, 8, -8], duration: 8, easing: 'easeInOut' },
  ];

  /**
   * Robot 2 (Robo Head) - LOW DEPTH PATH
   * Flies in lower regions with deep forward/backward movement
   */
  public readonly robot2FlightPath: SpaceFlightWaypoint[] = [
    { position: [4, -3, -8], duration: 9, easing: 'easeOut' },
    { position: [-8, -5, -5], duration: 10, easing: 'easeInOut' },
    { position: [12, -4, 16], duration: 8, easing: 'easeInOut' },
    { position: [10, -6, -15], duration: 11, easing: 'easeIn' },
    { position: [-6, -5, -10], duration: 9, easing: 'easeInOut' },
    { position: [4, -3, -8], duration: 8, easing: 'easeInOut' },
  ];

  /** Set the lighting preset */
  public setPreset(preset: LightingPreset): void {
    this.currentPreset.set(preset);
  }

  /** Handle background color change from SceneLightingComponent */
  public onBackgroundColorChange(colorHex: number): void {
    // Convert hex number to CSS hex string
    const cssHex = '#' + colorHex.toString(16).padStart(6, '0');
    this.backgroundColor.set(cssHex);
  }

  /** Format preset name for display */
  public formatPresetName(preset: LightingPreset): string {
    return preset
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Handles zoom enable/disable changes from the scroll coordinator
   * Updates the reactive property that's bound to [enableZoom]
   */
  public onZoomEnabledChange(enabled: boolean): void {
    this.isZoomEnabled = enabled;
    console.log(`🎮 Zoom ${enabled ? 'enabled' : 'disabled'} via binding`);
  }

  /**
   * Captures the OrbitControls instance when controls are ready
   * This is needed to pass it to the scroll coordinator directive
   */
  public onControlsReady(controls: OrbitControls): void {
    this.orbitControlsInstance = controls;
    console.log('✅ OrbitControls instance captured for scroll coordinator');
  }
}
