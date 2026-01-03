import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';

import * as TSL from 'three/tsl';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';
import { SceneService } from '../../canvas/scene.service';
// Note: Ray marching utilities available in tsl-raymarching.ts if needed

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * Helper to safely access TSL functions at runtime rather than module load time.
 * This avoids race conditions where WebGPU context isn't ready when module loads.
 */
function getTSL() {
  const {
    Fn,
    Loop,
    If,
    float,
    vec2,
    vec3,
    vec4,
    uniform,
    min,
    max,
    abs,
    dot,
    pow,
    sin,
    cos,
    length,
    normalize,
    smoothstep,
    clamp,
    mix,
    exp,
    Break,
    select,
    screenUV,
    screenSize,
  } = TSL;

  // Validate that critical TSL functions are available
  // Note: If may be null in some WebGPU init states, use select as fallback
  if (!Fn || !select) {
    throw new Error(
      'TSL functions not available. Ensure WebGPU context is initialized.'
    );
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Fn: Fn as any,
    Loop,
    If,
    float,
    vec2,
    vec3,
    vec4,
    uniform,
    min,
    max,
    abs,
    dot,
    pow,
    sin,
    cos,
    length,
    normalize,
    smoothstep,
    clamp,
    mix,
    exp,
    Break,
    select,
    screenUV,
    screenSize,
  };
}

/**
 * MetaballComponent - Ray-Marched Metaball Shader Component
 *
 * Creates interactive metaballs using signed distance functions (SDF) and ray marching.
 * Features smooth blob blending, cursor interaction, and multiple color presets.
 *
 * Features:
 * - Ray marching with signed distance functions
 * - Smooth minimum (smin) for organic blob blending
 * - Interactive cursor sphere with mouse/touch tracking
 * - 6 color presets: moody, cosmic, neon, sunset, holographic, minimal
 * - Adaptive quality: 48 ray march steps (desktop), 16 (mobile)
 * - Full lighting model with ambient occlusion, soft shadows, fresnel
 * - Smooth cursor interpolation for fluid motion
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy
 * - Signal-based inputs for reactive updates
 * - Custom GLSL ray marching shader
 * - Uses RenderLoopService for animation updates
 * - Full-screen 2x2 PlaneGeometry with ShaderMaterial
 *
 * @example
 * ```html
 * <a3d-metaball
 *   [preset]="'holographic'"
 *   [sphereCount]="6"
 *   [smoothness]="0.3"
 *   [mouseProximityEffect]="true"
 * />
 * ```
 */

/**
 * Color preset type for MetaballComponent
 */
export type MetaballPreset =
  | 'moody'
  | 'cosmic'
  | 'neon'
  | 'sunset'
  | 'holographic'
  | 'minimal';

/**
 * Configuration interface for metaball presets
 */
export interface MetaballPresetConfig {
  sphereCount: number;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  specularPower: number;
  fresnelPower: number;
  backgroundColor: THREE.Color;
  sphereColor: THREE.Color;
  lightColor: THREE.Color;
  lightPosition: THREE.Vector3;
  smoothness: number;
  contrast: number;
  fogDensity: number;
  cursorGlowIntensity: number;
  cursorGlowRadius: number;
  cursorGlowColor: THREE.Color;
}

@Component({
  selector: 'a3d-metaball',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `metaball-${crypto.randomUUID()}`,
    },
  ],
})
export class MetaballComponent {
  // Signal inputs - Preset and configuration
  public readonly preset = input<MetaballPreset>('holographic');
  public readonly sphereCount = input<number>(6);
  public readonly smoothness = input<number>(0.3);
  public readonly animationSpeed = input<number>(0.6);
  public readonly movementScale = input<number>(1.2);

  /**
   * Fullscreen mode for hero sections
   * When true: Plane scales to fill camera frustum, uses screenUV for rendering
   * When false: Standard 3D positioning (legacy behavior with geometry UV)
   */
  public readonly fullscreen = input<boolean>(true);

  /**
   * Camera distance for fullscreen mode calculations
   * When null, uses the camera's current position distance from origin
   * Only used when fullscreen=true
   */
  public readonly cameraDistance = input<number | null>(null);

  // Cursor interaction
  public readonly cursorRadiusMin = input<number>(0.08);
  public readonly cursorRadiusMax = input<number>(0.15);
  public readonly cursorGlowIntensity = input<number>(0.4);
  public readonly cursorGlowRadius = input<number>(1.2);
  public readonly mouseProximityEffect = input<boolean>(true);
  public readonly mouseSmoothness = input<number>(0.1);

  // Fixed sphere sizes (corner blobs)
  public readonly fixedTopLeftRadius = input<number>(0.8);
  public readonly fixedBottomRightRadius = input<number>(0.9);
  public readonly smallTopLeftRadius = input<number>(0.3);
  public readonly smallBottomRightRadius = input<number>(0.35);
  public readonly mergeDistance = input<number>(1.5);

  // Movement scale range
  public readonly minMovementScale = input<number>(0.3);
  public readonly maxMovementScale = input<number>(1.0);

  // Performance
  public readonly enableAdaptiveQuality = input<boolean>(true);
  public readonly maxRayMarchSteps = input<number>(48);
  public readonly mobileRayMarchSteps = input<number>(16);

  // DI - Pattern from nebula-volumetric.component.ts
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  // SceneService is optional to support usage outside Scene3dComponent (e.g., testing)
  private readonly sceneService = inject(SceneService, { optional: true });

  // Internal Three.js objects
  private mesh!: THREE.Mesh;
  private material!: MeshBasicNodeMaterial;
  private readonly group = new THREE.Group();

  // TSL Uniform Nodes (use any type as UniformNode is not exported)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uTime!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uResolution!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uActualResolution!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uPixelRatio!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMousePosition!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorSphere!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSphereCount!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uFixedTopLeftRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uFixedBottomRightRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSmallTopLeftRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSmallBottomRightRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMergeDistance!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSmoothness!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uAmbientIntensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uDiffuseIntensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSpecularIntensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSpecularPower!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uFresnelPower!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uBackgroundColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSphereColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uLightColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uLightPosition!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uContrast!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uFogDensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uAnimationSpeed!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMovementScale!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMouseProximityEffect!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMinMovementScale!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMaxMovementScale!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorGlowIntensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorGlowRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorGlowColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uIsMobile!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uIsLowPower!: any;

  // Mouse tracking state
  private readonly mousePosition = new THREE.Vector2(0.5, 0.5);
  private readonly targetMousePosition = new THREE.Vector2(0.5, 0.5);
  private readonly cursorSphere3D = new THREE.Vector3(0, 0, 0);

  // Device detection
  private readonly isMobile: boolean;
  private readonly isLowPowerDevice: boolean;

  // Render loop cleanup
  private renderLoopCleanup!: () => void;
  private isAddedToScene = false;

  // Event listeners reference for cleanup
  private boundOnPointerMove: (event: MouseEvent) => void;
  private boundOnTouchStart: (event: TouchEvent) => void;
  private boundOnTouchMove: (event: TouchEvent) => void;
  private boundOnResize: () => void;

  // Preset configurations
  private readonly presets: Record<MetaballPreset, MetaballPresetConfig>;

  public constructor() {
    // Device detection
    this.isMobile =
      typeof navigator !== 'undefined' &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    this.isLowPowerDevice =
      this.isMobile ||
      (typeof navigator !== 'undefined' && navigator.hardwareConcurrency <= 4);

    // Initialize presets with device-aware sphere counts
    this.presets = this.initializePresets();

    // Bind event handlers
    this.boundOnPointerMove = this.onPointerMove.bind(this) as (
      event: MouseEvent
    ) => void;
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnResize = this.onWindowResize.bind(this);

    // Effect: Add group to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMetaballMesh();
        parent.add(this.group);
        this.isAddedToScene = true;
        this.setupEventListeners();
      }
    });

    // Effect: Update preset when it changes
    effect(() => {
      const presetName = this.preset();
      if (this.material && this.presets[presetName]) {
        this.applyPreset(presetName);
      }
    });

    // Effect: Update individual uniforms when inputs change
    effect(() => {
      if (!this.uSphereCount) return;

      // Read inputs to create dependencies
      const sphereCount = this.sphereCount();
      const smoothness = this.smoothness();
      const animationSpeed = this.animationSpeed();
      const movementScale = this.movementScale();
      const mouseProximityEffect = this.mouseProximityEffect();
      const minMovementScale = this.minMovementScale();
      const maxMovementScale = this.maxMovementScale();
      const fixedTopLeftRadius = this.fixedTopLeftRadius();
      const fixedBottomRightRadius = this.fixedBottomRightRadius();
      const smallTopLeftRadius = this.smallTopLeftRadius();
      const smallBottomRightRadius = this.smallBottomRightRadius();
      const mergeDistance = this.mergeDistance();

      // Update TSL uniform nodes
      this.uSphereCount.value = sphereCount;
      this.uSmoothness.value = smoothness;
      this.uAnimationSpeed.value = animationSpeed;
      this.uMovementScale.value = movementScale;
      this.uMouseProximityEffect.value = mouseProximityEffect;
      this.uMinMovementScale.value = minMovementScale;
      this.uMaxMovementScale.value = maxMovementScale;
      this.uFixedTopLeftRadius.value = fixedTopLeftRadius;
      this.uFixedBottomRightRadius.value = fixedBottomRightRadius;
      this.uSmallTopLeftRadius.value = smallTopLeftRadius;
      this.uSmallBottomRightRadius.value = smallBottomRightRadius;
      this.uMergeDistance.value = mergeDistance;
    });

    // Effect: Update fullscreen scale when camera becomes available
    // This is needed because camera may not be ready when mesh is first created
    effect(() => {
      const camera = this.sceneService?.camera();
      const isFullscreen = this.fullscreen();

      // Only update if we have camera, mesh, and fullscreen mode
      if (camera && this.mesh && isFullscreen) {
        this.updateFullscreenScale();
      }
    });

    // Animation loop - update time and mouse position
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (!this.uTime) return;

      // Update time
      this.uTime.value += delta;

      // Smooth mouse movement with interpolation
      const smoothness = this.mouseSmoothness();
      this.mousePosition.x +=
        (this.targetMousePosition.x - this.mousePosition.x) * smoothness;
      this.mousePosition.y +=
        (this.targetMousePosition.y - this.mousePosition.y) * smoothness;

      this.uMousePosition.value = this.mousePosition;
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      // Cleanup render loop callback
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
      }

      // Remove event listeners
      this.removeEventListeners();

      // Remove from parent
      const parent = this.parent();
      if (parent && this.isAddedToScene) {
        parent.remove(this.group);
      }
      this.isAddedToScene = false;

      // Dispose Three.js resources
      if (this.mesh) {
        this.group.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
      }
    });
  }

  /**
   * Initialize preset configurations with device-aware sphere counts
   */
  private initializePresets(): Record<MetaballPreset, MetaballPresetConfig> {
    const isMobile = this.isMobile;

    return {
      moody: {
        sphereCount: isMobile ? 4 : 6,
        ambientIntensity: 0.02,
        diffuseIntensity: 0.6,
        specularIntensity: 1.8,
        specularPower: 8,
        fresnelPower: 1.2,
        backgroundColor: new THREE.Color(0x050505),
        sphereColor: new THREE.Color(0x000000),
        lightColor: new THREE.Color(0xffffff),
        lightPosition: new THREE.Vector3(1, 1, 1),
        smoothness: 0.3,
        contrast: 2.0,
        fogDensity: 0.12,
        cursorGlowIntensity: 0.4,
        cursorGlowRadius: 1.2,
        cursorGlowColor: new THREE.Color(0xffffff),
      },
      cosmic: {
        sphereCount: isMobile ? 5 : 8,
        ambientIntensity: 0.03,
        diffuseIntensity: 0.8,
        specularIntensity: 1.6,
        specularPower: 6,
        fresnelPower: 1.4,
        backgroundColor: new THREE.Color(0x000011),
        sphereColor: new THREE.Color(0x000022),
        lightColor: new THREE.Color(0x88aaff),
        lightPosition: new THREE.Vector3(0.5, 1, 0.5),
        smoothness: 0.4,
        contrast: 2.0,
        fogDensity: 0.15,
        cursorGlowIntensity: 0.8,
        cursorGlowRadius: 1.5,
        cursorGlowColor: new THREE.Color(0x4477ff),
      },
      neon: {
        sphereCount: isMobile ? 4 : 7,
        ambientIntensity: 0.04,
        diffuseIntensity: 1.0,
        specularIntensity: 2.0,
        specularPower: 4,
        fresnelPower: 1.0,
        backgroundColor: new THREE.Color(0x000505),
        sphereColor: new THREE.Color(0x000808),
        lightColor: new THREE.Color(0x00ffcc),
        lightPosition: new THREE.Vector3(0.7, 1.3, 0.8),
        smoothness: 0.7,
        contrast: 2.0,
        fogDensity: 0.08,
        cursorGlowIntensity: 0.8,
        cursorGlowRadius: 1.4,
        cursorGlowColor: new THREE.Color(0x00ffaa),
      },
      sunset: {
        sphereCount: isMobile ? 3 : 5,
        ambientIntensity: 0.04,
        diffuseIntensity: 0.7,
        specularIntensity: 1.4,
        specularPower: 7,
        fresnelPower: 1.5,
        backgroundColor: new THREE.Color(0x150505),
        sphereColor: new THREE.Color(0x100000),
        lightColor: new THREE.Color(0xff6622),
        lightPosition: new THREE.Vector3(1.2, 0.4, 0.6),
        smoothness: 0.35,
        contrast: 2.0,
        fogDensity: 0.1,
        cursorGlowIntensity: 0.8,
        cursorGlowRadius: 1.4,
        cursorGlowColor: new THREE.Color(0xff4422),
      },
      holographic: {
        sphereCount: isMobile ? 4 : 6,
        ambientIntensity: 0.12,
        diffuseIntensity: 1.2,
        specularIntensity: 2.5,
        specularPower: 3,
        fresnelPower: 0.8,
        backgroundColor: new THREE.Color(0x0a0a15),
        sphereColor: new THREE.Color(0x050510),
        lightColor: new THREE.Color(0xccaaff),
        lightPosition: new THREE.Vector3(0.9, 0.9, 1.2),
        smoothness: 0.8,
        contrast: 1.6,
        fogDensity: 0.06,
        cursorGlowIntensity: 1.2,
        cursorGlowRadius: 2.2,
        cursorGlowColor: new THREE.Color(0xaa77ff),
      },
      minimal: {
        sphereCount: isMobile ? 2 : 3,
        ambientIntensity: 0.0,
        diffuseIntensity: 0.25,
        specularIntensity: 1.3,
        specularPower: 11,
        fresnelPower: 1.7,
        backgroundColor: new THREE.Color(0x0a0a0a),
        sphereColor: new THREE.Color(0x000000),
        lightColor: new THREE.Color(0xffffff),
        lightPosition: new THREE.Vector3(1, 0.5, 0.8),
        smoothness: 0.25,
        contrast: 2.0,
        fogDensity: 0.1,
        cursorGlowIntensity: 0.3,
        cursorGlowRadius: 1.0,
        cursorGlowColor: new THREE.Color(0xffffff),
      },
    };
  }

  /**
   * Create the full-screen metaball mesh with TSL ray marching shader
   */
  private createMetaballMesh(): void {
    // Get TSL uniform function at runtime
    const { uniform } = getTSL();

    // Get initial viewport dimensions
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const pixelRatio = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      this.isMobile ? 1.5 : 2
    );

    // Initialize uniforms with current preset
    const currentPreset = this.presets[this.preset()];

    // Create TSL uniform nodes
    this.uTime = uniform(0);
    this.uResolution = uniform(new THREE.Vector2(width, height));
    this.uActualResolution = uniform(
      new THREE.Vector2(width * pixelRatio, height * pixelRatio)
    );
    this.uPixelRatio = uniform(pixelRatio);
    this.uMousePosition = uniform(new THREE.Vector2(0.5, 0.5));
    this.uCursorSphere = uniform(new THREE.Vector3(0, 0, 0));
    this.uCursorRadius = uniform(this.cursorRadiusMin());
    this.uSphereCount = uniform(this.sphereCount());
    this.uFixedTopLeftRadius = uniform(this.fixedTopLeftRadius());
    this.uFixedBottomRightRadius = uniform(this.fixedBottomRightRadius());
    this.uSmallTopLeftRadius = uniform(this.smallTopLeftRadius());
    this.uSmallBottomRightRadius = uniform(this.smallBottomRightRadius());
    this.uMergeDistance = uniform(this.mergeDistance());
    this.uSmoothness = uniform(this.smoothness());
    this.uAmbientIntensity = uniform(currentPreset.ambientIntensity);
    this.uDiffuseIntensity = uniform(currentPreset.diffuseIntensity);
    this.uSpecularIntensity = uniform(currentPreset.specularIntensity);
    this.uSpecularPower = uniform(currentPreset.specularPower);
    this.uFresnelPower = uniform(currentPreset.fresnelPower);
    this.uBackgroundColor = uniform(currentPreset.backgroundColor);
    this.uSphereColor = uniform(currentPreset.sphereColor);
    this.uLightColor = uniform(currentPreset.lightColor);
    this.uLightPosition = uniform(currentPreset.lightPosition);
    this.uContrast = uniform(currentPreset.contrast);
    this.uFogDensity = uniform(currentPreset.fogDensity);
    this.uAnimationSpeed = uniform(this.animationSpeed());
    this.uMovementScale = uniform(this.movementScale());
    this.uMouseProximityEffect = uniform(this.mouseProximityEffect());
    this.uMinMovementScale = uniform(this.minMovementScale());
    this.uMaxMovementScale = uniform(this.maxMovementScale());
    this.uCursorGlowIntensity = uniform(currentPreset.cursorGlowIntensity);
    this.uCursorGlowRadius = uniform(currentPreset.cursorGlowRadius);
    this.uCursorGlowColor = uniform(currentPreset.cursorGlowColor);
    this.uIsMobile = uniform(this.isMobile ? 1.0 : 0.0);
    this.uIsLowPower = uniform(this.isLowPowerDevice ? 1.0 : 0.0);

    // Create TSL material with ray marching shader
    this.material = this.createTSLMaterial();

    // Create full-screen 2x2 plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;

    // Add to group
    this.group.add(this.mesh);

    // Fullscreen mode: scale plane to fill viewport
    if (this.fullscreen()) {
      this.updateFullscreenScale();
    }
  }

  /**
   * Apply a preset configuration to the uniforms
   */
  private applyPreset(presetName: MetaballPreset): void {
    const preset = this.presets[presetName];
    if (!preset || !this.uSphereCount) return;

    this.uSphereCount.value = preset.sphereCount;
    this.uAmbientIntensity.value = preset.ambientIntensity;
    this.uDiffuseIntensity.value = preset.diffuseIntensity;
    this.uSpecularIntensity.value = preset.specularIntensity;
    this.uSpecularPower.value = preset.specularPower;
    this.uFresnelPower.value = preset.fresnelPower;
    this.uBackgroundColor.value = preset.backgroundColor;
    this.uSphereColor.value = preset.sphereColor;
    this.uLightColor.value = preset.lightColor;
    this.uLightPosition.value = preset.lightPosition;
    this.uSmoothness.value = preset.smoothness;
    this.uContrast.value = preset.contrast;
    this.uFogDensity.value = preset.fogDensity;
    this.uCursorGlowIntensity.value = preset.cursorGlowIntensity;
    this.uCursorGlowRadius.value = preset.cursorGlowRadius;
    this.uCursorGlowColor.value = preset.cursorGlowColor;
  }

  /**
   * Scale plane geometry to fill camera frustum
   * Uses camera FOV and distance to calculate required plane dimensions.
   * Only used when fullscreen=true.
   *
   * Handles edge cases:
   * - Camera may be null during initialization (early return)
   * - SceneService may not be provided (component outside Scene3dComponent)
   */
  private updateFullscreenScale(): void {
    // Handle cases where camera is not available yet or SceneService is not injected
    const camera = this.sceneService?.camera();
    if (!camera || !this.mesh) return;

    // Get camera distance from input, or calculate from camera position
    const distance = this.cameraDistance() ?? camera.position.length();

    // Calculate frustum dimensions at plane distance
    // Formula: height = 2 * tan(fov/2) * distance
    const vFov = (camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * distance;
    const planeWidth = planeHeight * camera.aspect;

    // Scale plane to fill viewport with 10% overflow to prevent edge artifacts
    const scale = 1.1;
    this.mesh.scale.set(planeWidth * scale, planeHeight * scale, 1);

    // Position plane at camera distance (slightly in front to avoid z-fighting)
    this.mesh.position.set(0, 0, -distance + 0.01);
  }

  /**
   * Setup event listeners for mouse/touch tracking
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('mousemove', this.boundOnPointerMove, {
      passive: true,
    });
    window.addEventListener('touchstart', this.boundOnTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.boundOnTouchMove, {
      passive: false,
    });
    window.addEventListener('resize', this.boundOnResize, { passive: true });

    // Initialize cursor at center
    this.onPointerMove({
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    } as MouseEvent);
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('mousemove', this.boundOnPointerMove);
    window.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
    window.removeEventListener('resize', this.boundOnResize);
  }

  /**
   * Handle mouse/touch move events
   */
  private onPointerMove(
    event: MouseEvent | { clientX: number; clientY: number }
  ): void {
    if (typeof window === 'undefined') return;

    // Convert to normalized coordinates (0-1)
    // In fullscreen mode: screenUV uses screen space (Y=0 at top), so don't invert
    // In positioned mode: Use 3D space (Y=0 at bottom), so invert Y
    this.targetMousePosition.x = event.clientX / window.innerWidth;
    this.targetMousePosition.y = this.fullscreen()
      ? event.clientY / window.innerHeight // Screen space for fullscreen
      : 1.0 - event.clientY / window.innerHeight; // 3D space for positioned

    // Convert to world coordinates
    const worldPos = this.screenToWorldJS(
      this.targetMousePosition.x,
      this.targetMousePosition.y
    );
    this.cursorSphere3D.copy(worldPos);

    // Calculate dynamic cursor radius based on proximity to fixed spheres
    let closestDistance = 1000.0;
    const fixedPositions = [
      this.screenToWorldJS(0.08, 0.92), // top left
      this.screenToWorldJS(0.25, 0.72), // small top left
      this.screenToWorldJS(0.92, 0.08), // bottom right
      this.screenToWorldJS(0.72, 0.25), // small bottom right
    ];

    fixedPositions.forEach((pos) => {
      const dist = this.cursorSphere3D.distanceTo(pos);
      closestDistance = Math.min(closestDistance, dist);
    });

    const proximityFactor = Math.max(
      0,
      1.0 - closestDistance / this.mergeDistance()
    );
    const smoothFactor =
      proximityFactor * proximityFactor * (3.0 - 2.0 * proximityFactor);
    const dynamicRadius =
      this.cursorRadiusMin() +
      (this.cursorRadiusMax() - this.cursorRadiusMin()) * smoothFactor;

    if (this.uCursorSphere) {
      this.uCursorSphere.value.copy(this.cursorSphere3D);
      this.uCursorRadius.value = dynamicRadius;
    }
  }

  /**
   * Handle touch start events
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.onPointerMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  }

  /**
   * Handle touch move events
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.onPointerMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      } as MouseEvent);
    }
  }

  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    if (typeof window === 'undefined' || !this.uResolution) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      this.isMobile ? 1.5 : 2
    );

    this.uResolution.value.set(width, height);
    this.uActualResolution.value.set(width * pixelRatio, height * pixelRatio);
    this.uPixelRatio.value = pixelRatio;

    // Update fullscreen scaling when viewport changes
    if (this.fullscreen() && this.mesh) {
      this.updateFullscreenScale();
    }
  }

  /**
   * Convert normalized screen coordinates to world coordinates
   * Matches the shader's screenToWorld function for consistent positioning
   */
  private screenToWorldJS(
    normalizedX: number,
    normalizedY: number
  ): THREE.Vector3 {
    // Match shader's screenToWorld calculation exactly:
    // screenCoords = uvSource - 0.5 (range: -0.5 to 0.5)
    // adjustedUV = screenCoords * aspect
    // rayOrigin = adjustedUV * 2
    const uv_x = normalizedX - 0.5; // range: -0.5 to 0.5
    const uv_y = normalizedY - 0.5; // range: -0.5 to 0.5
    const aspect =
      typeof window !== 'undefined'
        ? window.innerWidth / window.innerHeight
        : 16 / 9;
    return new THREE.Vector3(uv_x * aspect * 2.0, uv_y * 2.0, 0.0);
  }

  /**
   * Create TSL Material with Ray Marching Shader
   * Full-screen quad ray marching using uv() coordinates
   *
   * Features:
   * - 4 fixed corner spheres + up to 10 animated spheres
   * - 6-sample ambient occlusion
   * - 12-iteration soft shadows
   * - Fog with configurable density
   * - Device-adaptive ray march steps (48 desktop, 16 mobile)
   * - Cursor glow on background
   */
  private createTSLMaterial(): MeshBasicNodeMaterial {
    // Get TSL functions at runtime to avoid race conditions with WebGPU init
    const {
      Fn,
      Loop,
      float,
      vec2,
      vec3,
      vec4,
      max,
      min: tslMin,
      abs: tslAbs,
      dot,
      pow,
      length,
      normalize,
      smoothstep,
      clamp,
      mix,
      exp,
      select,
      screenUV: tslScreenUV,
      screenSize: tslScreenSize,
    } = getTSL();

    // Get uv from TSL for positioned mode (geometry UV)
    const { uv } = TSL;

    // Capture fullscreen mode at material creation time (not reactive)
    const isFullscreen = this.fullscreen();

    // ========================================================================
    // FULL-SCREEN QUAD RAY MARCHING
    // Matches the GLSL hero-section-example with:
    // - Fixed corner spheres
    // - Up to 10 animated spheres with complex orbits
    // - Full lighting: AO, soft shadows, fresnel, fog
    // - Device-adaptive quality
    // ========================================================================

    // ========================================================================
    // HELPER FUNCTIONS
    // ========================================================================

    // Convert normalized screen coordinates (0-1) to world space
    const screenToWorld = Fn(
      ([normalizedX, normalizedY]: [TSLNode, TSLNode]) => {
        const uvX = normalizedX.mul(2).sub(1);
        const uvY = normalizedY.mul(2).sub(1);
        const aspect = this.uResolution.x.div(this.uResolution.y);
        return vec3(uvX.mul(aspect).mul(2), uvY.mul(2), float(0));
      }
    );

    // Distance from center for mouse proximity effect
    const getDistanceToCenter = Fn(([pos]: [TSLNode]) => {
      const center = vec2(float(0.5), float(0.5));
      const dist = length(pos.sub(center)).mul(2);
      return smoothstep(float(0), float(1), dist);
    });

    // ========================================================================
    // SDF PRIMITIVES
    // ========================================================================

    // SDF for a single sphere
    const sphereSDF = (p: TSLNode, center: TSLNode, radius: TSLNode) => {
      return length(p.sub(center)).sub(radius);
    };

    // Smooth minimum for metaball blending (Inigo Quilez)
    const smin = (a: TSLNode, b: TSLNode, k: TSLNode) => {
      const h = max(k.sub(tslAbs(a.sub(b))), float(0)).div(k);
      return tslMin(a, b).sub(h.mul(h).mul(k).mul(0.25));
    };

    // ========================================================================
    // SCENE SDF - ALL SPHERES
    // ========================================================================

    const sceneSDF = Fn(([pos]: [TSLNode]) => {
      const result = float(100).toVar(); // MAX_DIST
      const t = this.uTime.mul(this.uAnimationSpeed);

      // === FIXED CORNER SPHERES (matching GLSL example) ===
      const topLeftPos = screenToWorld(float(0.08), float(0.92));
      const topLeft = sphereSDF(pos, topLeftPos, this.uFixedTopLeftRadius);

      const smallTopLeftPos = screenToWorld(float(0.25), float(0.72));
      const smallTopLeft = sphereSDF(
        pos,
        smallTopLeftPos,
        this.uSmallTopLeftRadius
      );

      const bottomRightPos = screenToWorld(float(0.92), float(0.08));
      const bottomRight = sphereSDF(
        pos,
        bottomRightPos,
        this.uFixedBottomRightRadius
      );

      const smallBottomRightPos = screenToWorld(float(0.72), float(0.25));
      const smallBottomRight = sphereSDF(
        pos,
        smallBottomRightPos,
        this.uSmallBottomRightRadius
      );

      // Group corner spheres with soft blend
      const topLeftGroup = smin(topLeft, smallTopLeft, float(0.4));
      const bottomRightGroup = smin(bottomRight, smallBottomRight, float(0.4));

      // === ANIMATED SPHERES (up to 10 with complex orbits) ===

      // Calculate dynamic movement scale based on mouse position
      const distToCenter = getDistanceToCenter(this.uMousePosition);
      const dynamicMovementScale = select(
        this.uMouseProximityEffect.greaterThan(0.5),
        mix(this.uMinMovementScale, this.uMaxMovementScale, distToCenter),
        this.uMovementScale
      );

      // Distance from origin to cursor for proximity effects
      const distToCursorOrigin = length(this.uCursorSphere);
      const proximityScale = float(1).add(
        float(1)
          .sub(smoothstep(float(0), float(1), distToCursorOrigin))
          .mul(0.5)
      );

      // Sphere 0: Special orbit pattern
      const speed0 = float(0.4);
      const orbitRadius0 = float(0.3)
        .mul(dynamicMovementScale)
        .mul(proximityScale);
      const offset0 = vec3(
        TSL.sin(t.mul(speed0)).mul(orbitRadius0).mul(0.7),
        TSL.sin(t.mul(0.5)).mul(orbitRadius0),
        TSL.cos(t.mul(speed0).mul(0.7)).mul(orbitRadius0).mul(0.5)
      );
      const sphere0 = sphereSDF(pos, offset0, float(0.12));
      const shouldAdd0 = float(0).lessThan(this.uSphereCount);
      result.assign(
        select(shouldAdd0, smin(result, sphere0, float(0.05)), result)
      );

      // Sphere 1: Opposite orbit
      const speed1 = float(0.52);
      const orbitRadius1 = float(0.45)
        .mul(dynamicMovementScale)
        .mul(proximityScale);
      const offset1 = vec3(
        TSL.sin(t.mul(speed1).add(3.14159)).mul(orbitRadius1).mul(0.5),
        TSL.sin(t.mul(0.5)).negate().mul(orbitRadius1),
        TSL.cos(t.mul(speed1).mul(0.7).add(3.14159)).mul(orbitRadius1).mul(0.5)
      );
      const sphere1 = sphereSDF(pos, offset1, float(0.18));
      const shouldAdd1 = float(1).lessThan(this.uSphereCount);
      result.assign(
        select(shouldAdd1, smin(result, sphere1, float(0.05)), result)
      );

      // Sphere 2
      const speed2 = float(0.64);
      const phaseOffset2 = float(1.0996); // 0.35 * PI
      const orbitRadius2 = float(0.6)
        .mul(dynamicMovementScale)
        .mul(proximityScale);
      const offset2 = vec3(
        TSL.sin(t.mul(speed2).add(phaseOffset2)).mul(orbitRadius2).mul(0.8),
        TSL.cos(t.mul(speed2).mul(0.85).add(phaseOffset2.mul(1.3)))
          .mul(orbitRadius2)
          .mul(0.6),
        TSL.sin(t.mul(speed2).mul(0.5).add(phaseOffset2)).mul(0.3)
      );
      const sphere2 = sphereSDF(pos, offset2, float(0.12));
      const shouldAdd2 = float(2).lessThan(this.uSphereCount);
      result.assign(
        select(shouldAdd2, smin(result, sphere2, float(0.05)), result)
      );

      // Sphere 3
      const speed3 = float(0.76);
      const phaseOffset3 = float(2.199);
      const orbitRadius3 = float(0.45)
        .mul(dynamicMovementScale)
        .mul(proximityScale);
      const offset3 = vec3(
        TSL.sin(t.mul(speed3).add(phaseOffset3)).mul(orbitRadius3).mul(0.8),
        TSL.cos(t.mul(speed3).mul(0.85).add(phaseOffset3.mul(1.3)))
          .mul(orbitRadius3)
          .mul(0.6),
        TSL.sin(t.mul(speed3).mul(0.5).add(phaseOffset3)).mul(0.3)
      );
      const sphere3 = sphereSDF(pos, offset3, float(0.18));
      const shouldAdd3 = float(3).lessThan(this.uSphereCount);
      result.assign(
        select(shouldAdd3, smin(result, sphere3, float(0.05)), result)
      );

      // Sphere 4
      const speed4 = float(0.88);
      const phaseOffset4 = float(3.299);
      const orbitRadius4 = float(0.3)
        .mul(dynamicMovementScale)
        .mul(proximityScale);
      const offset4 = vec3(
        TSL.sin(t.mul(speed4).add(phaseOffset4)).mul(orbitRadius4).mul(0.8),
        TSL.cos(t.mul(speed4).mul(0.85).add(phaseOffset4.mul(1.3)))
          .mul(orbitRadius4)
          .mul(0.6),
        TSL.sin(t.mul(speed4).mul(0.5).add(phaseOffset4)).mul(0.3)
      );
      const sphere4 = sphereSDF(pos, offset4, float(0.12));
      const shouldAdd4 = float(4).lessThan(this.uSphereCount);
      result.assign(
        select(shouldAdd4, smin(result, sphere4, float(0.05)), result)
      );

      // Sphere 5
      const speed5 = float(1.0);
      const phaseOffset5 = float(4.398);
      const orbitRadius5 = float(0.6)
        .mul(dynamicMovementScale)
        .mul(proximityScale);
      const offset5 = vec3(
        TSL.sin(t.mul(speed5).add(phaseOffset5)).mul(orbitRadius5).mul(0.8),
        TSL.cos(t.mul(speed5).mul(0.85).add(phaseOffset5.mul(1.3)))
          .mul(orbitRadius5)
          .mul(0.6),
        TSL.sin(t.mul(speed5).mul(0.5).add(phaseOffset5)).mul(0.3)
      );
      const sphere5 = sphereSDF(pos, offset5, float(0.18));
      const shouldAdd5 = float(5).lessThan(this.uSphereCount);
      result.assign(
        select(shouldAdd5, smin(result, sphere5, float(0.05)), result)
      );

      // NOTE: Spheres 6-9 removed to reduce TSL shader complexity
      // TSL Loop unrolls all iterations at compile time, making too many
      // spheres cause shader compilation to hang or crash

      // === CURSOR SPHERE ===
      const cursorBall = sphereSDF(pos, this.uCursorSphere, this.uCursorRadius);

      // === COMBINE ALL ===
      result.assign(smin(result, topLeftGroup, float(0.3)));
      result.assign(smin(result, bottomRightGroup, float(0.3)));
      result.assign(smin(result, cursorBall, this.uSmoothness));

      return result;
    });

    // ========================================================================
    // NORMAL CALCULATION
    // ========================================================================

    const calcNormal = Fn(([pos]: [TSLNode]) => {
      const eps = float(0.001);
      const dx = sceneSDF(pos.add(vec3(eps, float(0), float(0)))).sub(
        sceneSDF(pos.sub(vec3(eps, float(0), float(0))))
      );
      const dy = sceneSDF(pos.add(vec3(float(0), eps, float(0)))).sub(
        sceneSDF(pos.sub(vec3(float(0), eps, float(0))))
      );
      const dz = sceneSDF(pos.add(vec3(float(0), float(0), eps))).sub(
        sceneSDF(pos.sub(vec3(float(0), float(0), eps)))
      );
      return normalize(vec3(dx, dy, dz));
    });

    // ========================================================================
    // AMBIENT OCCLUSION (2 samples - simplified to avoid shader bloat)
    // ========================================================================

    const ambientOcclusion = Fn(([p, n]: [TSLNode, TSLNode]) => {
      // Simplified 2-sample AO to reduce sceneSDF calls
      const h1 = sceneSDF(p.add(n.mul(0.03)));
      const h2 = sceneSDF(p.add(n.mul(0.06)));
      const occ = float(0.03).sub(h1).add(float(0.06).sub(h2).mul(0.5));
      return clamp(float(1).sub(occ.mul(2)), float(0), float(1));
    });

    // ========================================================================
    // SOFT SHADOWS (DISABLED - too expensive for TSL)
    // Each Loop iteration calls sceneSDF, causing shader bloat
    // ========================================================================

    const softShadow = Fn(
      ([_ro, _rd, _mint, _maxt, _k]: [
        TSLNode,
        TSLNode,
        TSLNode,
        TSLNode,
        TSLNode
      ]) => {
        // Return 1.0 (no shadow) to avoid expensive Loop + sceneSDF calls
        return float(1);
      }
    );

    // ========================================================================
    // CURSOR GLOW FOR BACKGROUND
    // ========================================================================

    const calculateCursorGlow = Fn(([worldPos]: [TSLNode]) => {
      const dist = length(worldPos.xy.sub(this.uCursorSphere.xy));
      const glow = float(1).sub(
        smoothstep(float(0), this.uCursorGlowRadius, dist)
      );
      return pow(glow, float(2)).mul(this.uCursorGlowIntensity);
    });

    // ========================================================================
    // MAIN RAY MARCHING FUNCTION
    // ========================================================================

    const rayMarch = Fn(() => {
      // Choose UV source based on fullscreen mode (captured at material creation)
      // - Fullscreen: Use screenUV (0-1 screen-space coordinates)
      // - Positioned: Use uv() (geometry-based UV from PlaneGeometry)
      const uvSource = isFullscreen ? tslScreenUV : uv();

      // Screen coordinates centered at origin (-0.5 to +0.5)
      const screenCoords = uvSource.sub(vec2(float(0.5), float(0.5)));

      // Use screenSize for aspect in fullscreen mode, uResolution for positioned mode
      const aspect = isFullscreen
        ? tslScreenSize.x.div(tslScreenSize.y)
        : this.uResolution.x.div(this.uResolution.y);

      const adjustedUV = vec2(screenCoords.x.mul(aspect), screenCoords.y);

      // Orthographic-style camera (rays parallel to z-axis)
      const rayOrigin = vec3(
        adjustedUV.x.mul(2),
        adjustedUV.y.mul(2),
        float(-1)
      );
      const rayDir = vec3(float(0), float(0), float(1));

      // Ray marching state
      const totalDist = float(0).toVar();
      const hitPoint = vec3(float(0), float(0), float(0)).toVar();
      const hit = float(0).toVar();

      // Ray march with 16 steps (TSL Loop unrolls ALL iterations at compile time,
      // so we must keep this small to avoid shader compilation hang)
      Loop(16, () => {
        const p = rayOrigin.add(rayDir.mul(totalDist));
        hitPoint.assign(p);

        const dist = sceneSDF(p);
        const isHit = dist.lessThan(0.001);
        const tooFar = totalDist.greaterThan(5);

        hit.assign(select(isHit, float(1), hit));
        totalDist.addAssign(select(isHit.or(tooFar), float(0), dist.mul(0.9)));
      });

      // ========================================================================
      // LIGHTING CALCULATION
      // ========================================================================

      const normal = calcNormal(hitPoint);
      const viewDir = rayDir.negate();
      const lightDir = normalize(this.uLightPosition);

      // Ambient occlusion
      const ao = ambientOcclusion(hitPoint, normal);

      // Diffuse
      const diff = max(dot(normal, lightDir), float(0));

      // Soft shadow
      const shadow = softShadow(
        hitPoint,
        lightDir,
        float(0.01),
        float(10),
        float(20)
      );

      // Specular (Blinn-Phong)
      const halfDir = normalize(lightDir.add(viewDir));
      const spec = pow(
        max(dot(normal, halfDir), float(0)),
        this.uSpecularPower
      );

      // Fresnel rim
      const fresnel = pow(
        float(1).sub(max(dot(viewDir, normal), float(0))),
        this.uFresnelPower
      );

      // Combine lighting components
      const ambient = this.uLightColor.mul(this.uAmbientIntensity).mul(ao);
      const diffuse = this.uLightColor
        .mul(diff)
        .mul(this.uDiffuseIntensity)
        .mul(shadow);
      const specular = this.uLightColor
        .mul(spec)
        .mul(this.uSpecularIntensity)
        .mul(fresnel);
      const fresnelRim = this.uLightColor.mul(fresnel).mul(0.4);

      // Cursor highlight on surface
      const distToCursor = length(hitPoint.sub(this.uCursorSphere));
      const highlight = float(1).sub(
        smoothstep(float(0), this.uCursorRadius.add(0.4), distToCursor)
      );
      const cursorHighlight = this.uLightColor.mul(highlight).mul(0.2);

      // Base color + all lighting
      let color = this.uSphereColor
        .add(ambient)
        .add(diffuse)
        .add(specular)
        .add(fresnelRim)
        .add(cursorHighlight);
      color = color.mul(ao);

      // Contrast adjustment (tone mapping)
      color = pow(color, vec3(this.uContrast.mul(0.9)));
      color = color.div(color.add(vec3(0.8)));

      // Fog
      const fogAmount = float(1).sub(
        exp(totalDist.negate().mul(this.uFogDensity))
      );
      color = mix(color, this.uBackgroundColor, fogAmount.mul(0.3));

      // ========================================================================
      // CURSOR GLOW (for background and surface)
      // ========================================================================

      const cursorGlow = calculateCursorGlow(rayOrigin);
      const glowContribution = this.uCursorGlowColor.mul(cursorGlow);

      // Final color: lit surface + glow, or just glow for background
      const finalColor = select(
        hit.greaterThan(0.5),
        color.add(glowContribution.mul(0.3)),
        glowContribution
      );

      // Alpha: 1 for hit, glow intensity for background
      const finalAlpha = select(
        hit.greaterThan(0.5),
        float(1),
        cursorGlow.mul(0.8)
      );

      return vec4(finalColor, finalAlpha);
    });

    // ========================================================================
    // CREATE MATERIAL
    // ========================================================================

    const material = new MeshBasicNodeMaterial();
    material.colorNode = rayMarch();
    material.transparent = true; // Enable for cursor glow on background
    material.depthWrite = false;
    material.depthTest = false;

    return material;
  }
}
