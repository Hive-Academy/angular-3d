import {
  Component,
  ChangeDetectionStrategy,
  inject,
  computed,
} from '@angular/core';
import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  PointLightComponent,
  ViewportPositioningService,
  ViewportPositionDirective,
  Rotate3dDirective,
  Float3dDirective,
  SpaceFlight3dDirective,
  GltfModelComponent,
  StarFieldComponent,
  InstancedParticleTextComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  BloomEffectComponent,
  FloatingSphereComponent,
  type SpaceFlightWaypoint,
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
    PointLightComponent,
    ViewportPositionDirective,
    Rotate3dDirective,
    Float3dDirective,
    SpaceFlight3dDirective,
    GltfModelComponent,
    StarFieldComponent,
    InstancedParticleTextComponent,
    NebulaVolumetricComponent,
    OrbitControlsComponent,
    BloomEffectComponent,
    FloatingSphereComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full h-full"
      role="img"
      aria-label="Interactive 3D space scene with rotating Earth, twinkling stars, and camera controls"
    >
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
        <!-- ================================ -->
        <!-- LIGHTING SETUP -->
        <!-- ================================ -->
        <a3d-ambient-light [color]="colors.white" [intensity]="0.08" />
        <a3d-directional-light
          [position]="[30, 15, 25]"
          [color]="colors.white"
          [intensity]="0.4"
          [castShadow]="true"
        />
        <!-- Accent light for atmosphere -->
        <a3d-point-light
          [position]="[-15, 10, 15]"
          [color]="colors.cyan"
          [intensity]="0.3"
        />

        <!-- ================================ -->
        <!-- REALISTIC EARTH (GLTF Model with Rotation) -->
        <!-- ================================ -->
        <a3d-gltf-model
          [modelPath]="'3d/planet_earth/scene.gltf'"
          [position]="earthPosition()"
          [scale]="2.3"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 120, direction: 1 }"
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
        <!-- PARTICLE TEXT -->
        <!-- ================================ -->
        <a3d-instanced-particle-text
          text="Angular 3D Library"
          [position]="topTextPosition()"
          [fontSize]="25"
          [particleColor]="colors.softGray"
          [opacity]="0.35"
        />

        <!-- ================================ -->
        <!-- NEBULA EFFECTS -->
        <!-- ================================ -->
        <!-- Primary nebula - top right -->
        <a3d-nebula-volumetric
          viewportPosition="top-right"
          [viewportOffset]="{ offsetZ: -25 }"
          [width]="70"
          [height]="25"
          [layers]="3"
          [opacity]="0.85"
          [primaryColor]="colorStrings.skyBlue"
        />
        <!-- Secondary nebula - bottom left for balance -->
        <a3d-nebula-volumetric
          viewportPosition="bottom-left"
          [viewportOffset]="{ offsetZ: -30 }"
          [width]="50"
          [height]="18"
          [layers]="2"
          [opacity]="0.6"
          [primaryColor]="colorStrings.purple"
        />

        <!-- ================================ -->
        <!-- CAMERA CONTROLS -->
        <!-- ================================ -->
        <a3d-orbit-controls
          [enableDamping]="true"
          [dampingFactor]="0.05"
          [enableZoom]="true"
          [minDistance]="8"
          [maxDistance]="40"
          [rotateSpeed]="0.5"
          [enablePan]="false"
        />

        <!-- ================================ -->
        <!-- POST-PROCESSING -->
        <!-- ================================ -->
        <a3d-bloom-effect [threshold]="0.7" [strength]="0.6" [radius]="0.5" />
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
  public readonly topTextPosition = computed(() => {
    // Hide text off-screen until camera is ready to prevent position flash
    if (!this.positioning.isCameraReady()) {
      return [0, 100, 0] as [number, number, number];
    }
    return this.positioning.getPosition({ x: '50%', y: '25%' })();
  });

  /** Position for Earth model - centered in viewport with Z offset */
  public readonly earthPosition = computed(() => {
    if (!this.positioning.isCameraReady()) {
      return [0, 0, -9] as [number, number, number];
    }
    return this.positioning.getPosition({ x: '50%', y: '50%' }, { offsetZ: -9 })();
  });

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
}
