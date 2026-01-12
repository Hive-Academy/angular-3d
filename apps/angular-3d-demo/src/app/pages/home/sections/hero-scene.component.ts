/**
 * HeroSceneComponent - 3D Scene for Hero Section
 *
 * A reusable 3D scene component that contains:
 * - OrbitControls with Cinematic Entrance
 * - Warp Lines effect for transitions
 * - Camera Shake effect for flight rumble
 * - Lighting setup (ambient, directional, HDRI environment)
 * - Star fields for space backdrop
 * - Nebula volumetric background
 * - Fire sphere with animated position/color
 * - Flying robot with mouse tracking and thrusters
 * - Bloom post-processing
 *
 * This component is controlled by the parent HeroSectionComponent
 * which manages waypoint navigation and state.
 */
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  AmbientLightComponent,
  BloomEffectComponent,
  CameraShakeDirective,
  CausticsSphereComponent,
  CinematicEntranceConfig,
  CinematicEntranceDirective,
  DirectionalLightComponent,
  EffectComposerComponent,
  EnvironmentComponent,
  FireSphereComponent,
  Float3dDirective,
  GltfModelComponent,
  MouseTracking3dDirective,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  Scene3dComponent,
  SceneRevealDirective,
  StarFieldComponent,
  SvgIconComponent,
  ThrusterFlameComponent,
  WarpLinesComponent,
} from '@hive-academy/angular-3d';
import * as THREE from 'three/webgpu';
import { SCENE_COLOR_STRINGS } from '../../../shared/colors';

@Component({
  selector: 'app-hero-scene',
  imports: [
    Scene3dComponent,
    FireSphereComponent,
    StarFieldComponent,
    EffectComposerComponent,
    BloomEffectComponent,
    EnvironmentComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    OrbitControlsComponent,
    WarpLinesComponent,
    CinematicEntranceDirective,
    SceneRevealDirective,
    GltfModelComponent,
    ThrusterFlameComponent,
    MouseTracking3dDirective,
    NebulaVolumetricComponent,
    CameraShakeDirective,
    CausticsSphereComponent,
    SvgIconComponent,
    Float3dDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a3d-scene-3d
      [cameraPosition]="cameraPosition()"
      [cameraFov]="cameraFov()"
      [backgroundColor]="backgroundColor()"
    >
      <!-- OrbitControls with Cinematic Entrance -->
      <a3d-orbit-controls
        a3dCinematicEntrance
        [entranceConfig]="entranceConfig()"
        (entranceComplete)="entranceComplete.emit()"
        (controlsReady)="onControlsReady($event)"
        [enableRotate]="false"
        [enableZoom]="false"
        [enablePan]="false"
      />

      <!-- Warp Lines Effect during transitions -->
      <a3d-warp-lines
        [intensity]="warpIntensity()"
        [direction]="warpDirection()"
        [lineCount]="250"
        [color]="warpColor()"
        [lineLength]="2"
        [stretchMultiplier]="10"
        [spreadRadius]="35"
        [depthRange]="50"
        [speed]="warpSpeed()"
        [focalShift]="12"
      />

      <!-- Camera Shake Effect during transitions (MUST be inside Scene3dComponent for SceneService access) -->
      <div
        a3dCameraShake
        [shakeEnabled]="shakeEnabled()"
        [shakeIntensity]="shakeIntensity()"
        [shakeFrequency]="shakeFrequency()"
        [shakeDecay]="0"
      ></div>

      <!-- Lighting -->
      <a3d-ambient-light [intensity]="0.08" />
      <a3d-directional-light
        [position]="[15, 10, 10]"
        [intensity]="1.0"
        [color]="'#ffffffff'"
      />
      <a3d-directional-light
        [position]="[-10, 5, -10]"
        [intensity]="0.3"
        [color]="'#4a90d9'"
      />

      <a3d-svg-icon
        [svgPath]="'/images/logos/angular.svg'"
        [position]="[-14, 25, -70]"
        [scale]="0.04"
        [color]="colors.indigo"
        [emissiveIntensity]="0.3"
        [metalness]="0.2"
        [roughness]="0.6"
        float3d
        [floatConfig]="{
          height: 0.2,
          speed: 2000,
          delay: 0,
          ease: 'sine.inOut',
          autoStart: true
        }"
      />

      <!-- Star Fields -->
      <a3d-star-field
        [starCount]="2000"
        [radius]="50"
        [size]="0.035"
        [multiSize]="true"
        [stellarColors]="true"
        [enableRotation]="true"
        [rotationSpeed]="0.006"
        [rotationAxis]="'y'"
      />
      <a3d-star-field
        [starCount]="1500"
        [radius]="70"
        [size]="0.02"
        [opacity]="0.5"
        [multiSize]="true"
        [stellarColors]="true"
        [enableRotation]="true"
        [rotationSpeed]="0.009"
        [rotationAxis]="'y'"
      />

      <!-- Nebula Background (position/color controlled by waypoints) -->
      <a3d-nebula-volumetric
        [position]="nebulaPosition()"
        [width]="120"
        [height]="60"
        [opacity]="0.75"
        [primaryColor]="nebulaPrimaryColor()"
        [secondaryColor]="nebulaSecondaryColor()"
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

      <!-- Fire Sphere with Hollow Center -->
      <a3d-fire-sphere
        [radius]="10"
        [innerRadius]="6"
        [quality]="'quality'"
        [sunMode]="false"
        [iterations]="15"
        [position]="firePosition()"
        [fireMagnitude]="0.7"
        [fireNoiseScale]="2.8"
        [fireColor]="fireColor()"
        [densityFalloff]="16.0"
      />

      <!-- Caustics Sphere Inside the Fire -->
      <a3d-caustics-sphere
        [radius]="6.4"
        [position]="[
          firePosition()[0],
          firePosition()[1],
          firePosition()[2] + 1
        ]"
        [color]="innerSphereColor()"
        [background]="innerSphereBackground()"
        [causticsScale]="0.7"
        [speed]="1"
        [intensity]="1.5"
        [roughness]="0.07"
        [metalness]="0.7"
      />

      <!-- Flying Robot with Mouse Tracking -->
      <a3d-gltf-model
        a3dSceneReveal
        [revealConfig]="{
          animation: 'scale-pop',
          staggerGroup: 'hero',
          staggerIndex: 0,
          duration: 1.0
        }"
        modelPath="3d/mini_robot.glb"
        [scale]="[0.04, 0.04, 0.04]"
        [position]="robotPosition()"
        mouseTracking3d
        [trackingConfig]="{
          followCursor: true,
          cursorDepth: 20,
          smoothness: 0.08,
          lockZ: true,
          flightBehavior: true,
          maxBankAngle: 0.6,
          maxPitchAngle: 0.4,
          flightDamping: 0.06,
          velocityMultiplier: 20
        }"
        (loaded)="onRobotLoaded($event)"
      />

      <!-- Thruster Flames for Robot -->
      <a3d-thruster-flame
        #leftThruster
        [offset]="[-5, -62, 0]"
        color="#00ccff"
        coreColor="#ffffff"
        [intensity]="2.2"
        [size]="60"
        [flameLength]="60"
        [speed]="1.5"
        [turbulence]="0.4"
        [particleCount]="900"
        [nozzleRadius]="15"
      />
      <a3d-thruster-flame
        #rightThruster
        [offset]="[5, -62, 0]"
        color="#00ccff"
        coreColor="#ffffff"
        [intensity]="2.2"
        [size]="60"
        [flameLength]="60"
        [speed]="1.5"
        [turbulence]="0.4"
        [particleCount]="900"
        [nozzleRadius]="15"
      />

      <!-- HDRI Environment -->
      <a3d-environment
        [preset]="'dawn'"
        [intensity]="0.15"
        [background]="false"
        [blur]="0.5"
      />

      <!-- Bloom Effect - TEMPORARILY DISABLED FOR TESTING -->
      <a3d-effect-composer [enabled]="true">
        <a3d-bloom-effect [threshold]="0.25" [strength]="0.7" [radius]="0.5" />
      </a3d-effect-composer>
    </a3d-scene-3d>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      :host ::ng-deep a3d-scene-3d {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class HeroSceneComponent {
  // =========================================================================
  // INPUTS - Scene Configuration
  // =========================================================================

  public readonly Math = Math;
  public readonly colors = SCENE_COLOR_STRINGS;
  /** Camera position in 3D space */
  public readonly cameraPosition = input<[number, number, number]>([0, 0, 18]);

  /** Camera field of view */
  public readonly cameraFov = input<number>(55);

  /** Scene background color (hex number) */
  public readonly backgroundColor = input<number | null>(null);

  // =========================================================================
  // INPUTS - Cinematic Entrance
  // =========================================================================

  /** Cinematic entrance configuration */
  public readonly entranceConfig = input.required<CinematicEntranceConfig>();

  // =========================================================================
  // INPUTS - Warp Lines Effect
  // =========================================================================

  /** Warp effect intensity (0 = off, 1 = full) */
  public readonly warpIntensity = input<number>(0);

  /** Warp direction: -1 = left, 0 = none, 1 = right */
  public readonly warpDirection = input<number>(0);

  /** Warp effect color */
  public readonly warpColor = input<string>('#A1FF4F');

  /** Warp effect speed */
  public readonly warpSpeed = input<number>(50);

  // =========================================================================
  // INPUTS - Camera Shake Effect
  // =========================================================================

  /** Enable camera shake during transitions (controlled by parent via isFlying) */
  public readonly shakeEnabled = input<boolean>(false);

  /** Camera shake intensity (subtle by default for flight rumble) */
  public readonly shakeIntensity = input<number>(0.03);

  /** Camera shake frequency (higher = faster oscillation) */
  public readonly shakeFrequency = input<number>(15);

  // =========================================================================
  // INPUTS - Fire Sphere
  // =========================================================================

  /** Fire sphere position */
  public readonly firePosition = input<[number, number, number]>([0, -12, 0]);

  /** Fire sphere color */
  public readonly fireColor = input<string>('#A1FF4F');

  // =========================================================================
  // INPUTS - Inner Caustics Sphere (inside fire)
  // =========================================================================

  /** Inner sphere bright caustic color (light areas) */
  public readonly innerSphereColor = input<string>('#66ffaa');

  /** Inner sphere dark background color (shadow areas) */
  public readonly innerSphereBackground = input<string>('#001a0d');

  // =========================================================================
  // INPUTS - Robot
  // =========================================================================

  /** Robot position */
  public readonly robotPosition = input<[number, number, number]>([-25, 8, -8]);

  // =========================================================================
  // INPUTS - Nebula
  // =========================================================================

  /** Nebula position (animated, opposite to fire sphere) */
  public readonly nebulaPosition = input<[number, number, number]>([
    60, 40, -110,
  ]);

  /** Nebula primary color (hex number) */
  public readonly nebulaPrimaryColor = input<number>(0x39ff14);

  /** Nebula secondary color (hex number) */
  public readonly nebulaSecondaryColor = input<number>(0x4f46e5);

  // =========================================================================
  // OUTPUTS
  // =========================================================================

  /** Emitted when cinematic entrance animation completes */
  public readonly entranceComplete = output<void>();

  /** Emitted when orbit controls are ready */
  public readonly controlsReady =
    output<import('three-stdlib').OrbitControls>();

  /** Emitted when robot model is loaded */
  public readonly robotLoaded = output<THREE.Group>();

  // =========================================================================
  // VIEW CHILDREN
  // =========================================================================

  /** ViewChild for cinematic entrance directive */
  private readonly cinematicEntrance = viewChild(CinematicEntranceDirective);

  /** ViewChild references for thruster flames */
  private readonly leftThruster =
    viewChild<ThrusterFlameComponent>('leftThruster');
  private readonly rightThruster =
    viewChild<ThrusterFlameComponent>('rightThruster');

  // =========================================================================
  // EVENT HANDLERS
  // =========================================================================

  /**
   * Handle OrbitControls ready event - connect to cinematic entrance directive
   */
  protected onControlsReady(
    controls: import('three-stdlib').OrbitControls
  ): void {
    // Connect to cinematic entrance directive
    const entrance = this.cinematicEntrance();
    if (entrance) {
      entrance.setOrbitControls(controls);
    }

    // Emit to parent
    this.controlsReady.emit(controls);
  }

  /**
   * Handle robot model loaded event - attach thruster flames
   */
  protected onRobotLoaded(group: THREE.Group): void {
    // Get thruster components
    const left = this.leftThruster();
    const right = this.rightThruster();

    // Attach left thruster
    if (left?.isReady()) {
      const leftMesh = left.getMesh();
      if (leftMesh) {
        group.add(leftMesh);
      }
    }

    // Attach right thruster
    if (right?.isReady()) {
      const rightMesh = right.getMesh();
      if (rightMesh) {
        group.add(rightMesh);
      }
    }

    // Emit to parent
    this.robotLoaded.emit(group);
  }
}
