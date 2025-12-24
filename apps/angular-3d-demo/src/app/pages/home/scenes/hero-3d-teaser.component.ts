import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  DirectionalLightComponent,
  EffectComposerComponent,
  Float3dDirective,
  FloatingSphereComponent,
  GltfModelComponent,
  NebulaComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  ParticleTextComponent,
  PointLightComponent,
  Rotate3dDirective,
  Scene3dComponent,
  ScrollZoomCoordinatorDirective,
  SpaceFlight3dDirective,
  StarFieldComponent,
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
    AmbientLightComponent,
    DirectionalLightComponent,
    PointLightComponent,
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
    FloatingSphereComponent,
    ScrollZoomCoordinatorDirective,
    ParticleTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full h-full"
      role="img"
      aria-label="Interactive 3D space scene with rotating Earth, twinkling stars, and camera controls"
    >
      <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="75">
        <!-- Scroll-Zoom Coordinator (observes zoom state, coordinates page scroll) -->

        <!-- ================================ -->
        <!-- LIGHTING SETUP - Clean Space Scene -->
        <!-- ================================ -->
        <a3d-ambient-light [color]="colors.white" [intensity]="0.2" />
        <a3d-directional-light
          [position]="[30, 15, 25]"
          [color]="colors.white"
          [intensity]="0.4"
          [castShadow]="true"
        />
        <!-- Subtle blue accent for depth -->
        <a3d-point-light
          [position]="[-10, 5, 10]"
          [color]="colors.cyan"
          [intensity]="0.2"
        />

        <!-- ================================ -->
        <!-- REALISTIC EARTH (GLTF Model with Rotation) -->
        <!-- Pushed further right for better text balance -->
        <!-- ================================ -->
        <a3d-gltf-model
          [modelPath]="'3d/planet_earth/scene.gltf'"
          [viewportPosition]="{ x: '78%', y: '50%' }"
          [viewportOffset]="{ offsetZ: -9 }"
          [scale]="2.3"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 120, direction: 1 }"
        />

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
          [modelPath]="'3d/mini_robot.glb'"
          [position]="[3, 6, -8]"
          [scale]="0.05"
          a3dSpaceFlight3d
          [flightPath]="robot1FlightPath"
          [rotationsPerCycle]="4"
          [autoStart]="true"
          [loop]="true"
        />

        <!-- Robo Head - Lower depth orbital path -->
        <a3d-gltf-model
          [modelPath]="'3d/robo_head/scene.gltf'"
          [position]="[4, -3, -6]"
          [scale]="1"
          a3dSpaceFlight3d
          [flightPath]="robot2FlightPath"
          [rotationsPerCycle]="3"
          [autoStart]="true"
          [loop]="true"
        />

        <!-- ================================ -->
        <!-- FLOATING SPHERES (With Float3d Animation) -->
        <!-- Creates visual depth and "alive" feeling -->
        <!-- ================================ -->
        <!-- Large glowing sphere - top left -->
        <a3d-floating-sphere
          [position]="[-8, 6, -12]"
          [args]="[0.6, 32, 16]"
          [color]="colors.cyan"
          [metalness]="0.9"
          [roughness]="0.1"
          [clearcoat]="1.0"
          [transmission]="0.3"
          float3d
          [floatConfig]="{ height: 0.4, speed: 3000, ease: 'sine.inOut' }"
        />

        <!-- Medium sphere - bottom right -->
        <a3d-floating-sphere
          [position]="[7, -4, -10]"
          [args]="[0.4, 32, 16]"
          [color]="colors.magenta"
          [metalness]="0.8"
          [roughness]="0.2"
          [clearcoat]="0.8"
          [transmission]="0.2"
          float3d
          [floatConfig]="{ height: 0.3, speed: 2500, ease: 'sine.inOut' }"
        />

        <!-- Small sphere - top right -->
        <a3d-floating-sphere
          [position]="[10, 5, -8]"
          [args]="[0.25, 24, 12]"
          [color]="colors.purple"
          [metalness]="0.7"
          [roughness]="0.3"
          [clearcoat]="0.6"
          float3d
          [floatConfig]="{ height: 0.5, speed: 2000, ease: 'sine.inOut' }"
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

        <!-- ================================ -->
        <!-- NEBULA EFFECTS - Two-Layer Approach (Top-Right Position) -->
        <!-- Layer 1: Sprite-based gray smoke (organic, fractal noise) -->
        <!-- Layer 2: Volumetric blue glow (shader-based inner light) -->
        <!-- Positioned at top-right to match temp scene configuration -->
        <!-- ================================ -->

        <!-- Gray smoke cloud - soft, wispy, organic shapes -->
        <!-- Position: top-right viewport (x: ~10, y: ~5) 
        with z-offset for depth-->
        <a3d-nebula
          [position]="[90, 40, -60]"
          [cloudCount]="2"
          [radius]="60"
          [colorPalette]="['#ffffff', '#dfdbdb']"
          [minSize]="40"
          [maxSize]="60"
          [minOpacity]="0.05"
          [maxOpacity]="0.15"
          [enableFlow]="false"
        />

        <!-- Blue volumetric glow - inner illumination -->
        <!-- Same top-right position, slightly forward for glow effect -->
        <a3d-nebula-volumetric
          [position]="[90, 40, -60]"
          [width]="100"
          [height]="30"
          [layers]="2"
          [opacity]="0.9"
          [primaryColor]="'#0088ff'"
          [secondaryColor]="'#00d4ff'"
          [tertiaryColor]="'#ff6bd4'"
          [enableFlow]="false"
          [flowSpeed]="0.8"
          [noiseScale]="0.03"
          [density]="1.2"
          [edgeSoftness]="0.5"
          [contrast]="1.0"
          [glowIntensity]="20"
          [colorIntensity]="2"
        />

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
        <!-- POST-PROCESSING - Subtle Bloom for Smoke Effect -->
        <!-- ================================ -->
        <a3d-effect-composer [enabled]="true">
          <a3d-bloom-effect [threshold]="0.5" [strength]="0.5" [radius]="0.5" />
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
    `,
  ],
})
export class Hero3dTeaserComponent {
  public readonly colors = SCENE_COLORS;
  public readonly colorStrings = SCENE_COLOR_STRINGS;
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
