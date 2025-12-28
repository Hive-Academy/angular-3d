import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';
import { NG_3D_PARENT } from '../types/tokens';
import { OBJECT_ID } from '../tokens/object-id.token';
import { RenderLoopService } from '../render-loop/render-loop.service';
import {
  tslSphereDistance,
  tslSmoothUnion,
  tslRayMarch,
  tslNormal,
  tslAmbientOcclusion,
  tslSoftShadow,
  RAY_MARCH_EPSILON,
} from './shaders/tsl-raymarching';

// Extract TSL functions we'll use
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
} = TSL;

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// TSL Fn helper with proper typing to avoid arg type mismatch
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSLFn = Fn as any;

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
    this.targetMousePosition.x = event.clientX / window.innerWidth;
    this.targetMousePosition.y = 1.0 - event.clientY / window.innerHeight;

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
  }

  /**
   * Convert normalized screen coordinates to world coordinates
   * Matches the shader's screenToWorld function for consistent positioning
   */
  private screenToWorldJS(
    normalizedX: number,
    normalizedY: number
  ): THREE.Vector3 {
    const uv_x = normalizedX * 2.0 - 1.0;
    const uv_y = normalizedY * 2.0 - 1.0;
    const aspect =
      typeof window !== 'undefined'
        ? window.innerWidth / window.innerHeight
        : 16 / 9;
    return new THREE.Vector3(uv_x * aspect * 2.0, uv_y * 2.0, 0.0);
  }

  /**
   * Create TSL Material with Ray Marching Shader
   * Ports 600+ lines of GLSL to TSL using ray marching utilities
   */
  private createTSLMaterial(): MeshBasicNodeMaterial {
    // Define TSL screen coordinate helper
    const screenToWorld = TSLFn(([normalizedPos]: [TSLNode]) => {
      const uv = normalizedPos.mul(2).sub(1);
      const aspect = this.uResolution.x.div(this.uResolution.y);
      return vec3(uv.x.mul(aspect).mul(2), uv.y.mul(2), float(0));
    });

    // Define scene SDF combining all metaballs
    const sceneSDF = TSLFn(([pos]: [TSLNode]) => {
      let result = float(100).toVar();

      // Fixed corner spheres
      const topLeftPos = screenToWorld(vec2(0.08, 0.92));
      const topLeft = tslSphereDistance(
        pos,
        topLeftPos,
        this.uFixedTopLeftRadius
      );

      const smallTopLeftPos = screenToWorld(vec2(0.25, 0.72));
      const smallTopLeft = tslSphereDistance(
        pos,
        smallTopLeftPos,
        this.uSmallTopLeftRadius
      );

      const bottomRightPos = screenToWorld(vec2(0.92, 0.08));
      const bottomRight = tslSphereDistance(
        pos,
        bottomRightPos,
        this.uFixedBottomRightRadius
      );

      const smallBottomRightPos = screenToWorld(vec2(0.72, 0.25));
      const smallBottomRight = tslSphereDistance(
        pos,
        smallBottomRightPos,
        this.uSmallBottomRightRadius
      );

      const t = this.uTime.mul(this.uAnimationSpeed);

      // Dynamic movement scale based on mouse proximity
      const distToCenter = length(this.uMousePosition.sub(vec2(0.5, 0.5))).mul(
        2
      );
      const mixFactor = smoothstep(float(0), float(1), distToCenter);
      const dynamicMovementScale = If(this.uMouseProximityEffect, () =>
        mix(this.uMinMovementScale, this.uMaxMovementScale, mixFactor)
      ).Else(() => this.uMovementScale);

      // Animated metaball spheres (up to 10)
      const maxIter = If(this.uIsMobile.greaterThan(0.5), () => float(4))
        .ElseIf(this.uIsLowPower.greaterThan(0.5), () => float(6))
        .Else(() => min(this.uSphereCount, float(10)));

      Loop(float(10), ({ i }) => {
        // Break if beyond sphere count or max iterations
        If(
          i.greaterThanEqual(this.uSphereCount).or(i.greaterThanEqual(maxIter)),
          () => {
            Break();
          }
        );

        const fi = float(i);
        const speed = float(0.4).add(fi.mul(0.12));
        const radius = float(0.12).add(fi.mod(3).mul(0.06));
        const baseOrbitRadius = float(0.3).add(fi.mod(3).mul(0.15));

        const distToCursor = length(vec3(0, 0, 0).sub(this.uCursorSphere));
        const proximityScale = float(1).add(
          float(1)
            .sub(smoothstep(float(0), float(1), distToCursor))
            .mul(0.5)
        );
        const orbitRadius = baseOrbitRadius
          .mul(dynamicMovementScale)
          .mul(proximityScale);
        const phaseOffset = fi.mul(3.14159265359).mul(0.35);

        // Calculate sphere offset position (orbital animation)
        const offset = If(i.equal(0), () =>
          vec3(
            sin(t.mul(speed)).mul(orbitRadius).mul(0.7),
            sin(t.mul(0.5)).mul(orbitRadius),
            cos(t.mul(speed).mul(0.7)).mul(orbitRadius).mul(0.5)
          )
        )
          .ElseIf(i.equal(1), () =>
            vec3(
              sin(t.mul(speed).add(3.14159)).mul(orbitRadius).mul(0.5),
              sin(t.mul(0.5)).mul(orbitRadius).negate(),
              cos(t.mul(speed).mul(0.7).add(3.14159)).mul(orbitRadius).mul(0.5)
            )
          )
          .Else(() =>
            vec3(
              sin(t.mul(speed).add(phaseOffset)).mul(orbitRadius).mul(0.8),
              cos(t.mul(speed).mul(0.85).add(phaseOffset.mul(1.3)))
                .mul(orbitRadius)
                .mul(0.6),
              sin(t.mul(speed).mul(0.5).add(phaseOffset)).mul(0.3)
            )
          )
          .toVar();

        // Cursor attraction
        const toCursor = this.uCursorSphere.sub(offset);
        const cursorDist = length(toCursor);
        If(
          cursorDist
            .lessThan(this.uMergeDistance)
            .and(cursorDist.greaterThan(0)),
          () => {
            const attraction = float(1)
              .sub(cursorDist.div(this.uMergeDistance))
              .mul(0.3);
            offset.assign(offset.add(normalize(toCursor).mul(attraction)));
          }
        );

        const movingSphere = tslSphereDistance(pos, offset, radius);

        // Dynamic blend factor based on cursor proximity
        const blend = If(cursorDist.lessThan(this.uMergeDistance), () => {
          const influence = float(1).sub(cursorDist.div(this.uMergeDistance));
          return mix(
            float(0.05),
            this.uSmoothness,
            influence.mul(influence).mul(influence)
          );
        }).Else(() => float(0.05));

        result.assign(tslSmoothUnion(result, movingSphere, blend));
      });

      // Cursor sphere
      const cursorBall = tslSphereDistance(
        pos,
        this.uCursorSphere,
        this.uCursorRadius
      );

      // Group fixed spheres with smooth blending
      const topLeftGroup = tslSmoothUnion(topLeft, smallTopLeft, float(0.4));
      const bottomRightGroup = tslSmoothUnion(
        bottomRight,
        smallBottomRight,
        float(0.4)
      );

      // Combine all spheres
      result.assign(tslSmoothUnion(result, topLeftGroup, float(0.3)));
      result.assign(tslSmoothUnion(result, bottomRightGroup, float(0.3)));
      result.assign(tslSmoothUnion(result, cursorBall, this.uSmoothness));

      return result;
    });

    // Adaptive ray march step count
    const stepCount = If(this.uIsMobile.greaterThan(0.5), () => float(16))
      .ElseIf(this.uIsLowPower.greaterThan(0.5), () => float(32))
      .Else(() => float(64));

    // Adaptive AO sample count
    const aoSamples = If(this.uIsLowPower.greaterThan(0.5), () =>
      float(3)
    ).Else(() => float(6));

    // Define lighting function
    const lighting = TSLFn(
      ([hitPoint, rayDir, hitDist]: [TSLNode, TSLNode, TSLNode]) => {
        return If(hitDist.lessThan(0), () => vec3(0, 0, 0)).Else(() => {
          const normal = tslNormal(hitPoint, sceneSDF);
          const viewDir = rayDir.negate();

          const baseColor = this.uSphereColor;

          // Ambient occlusion
          const ao = tslAmbientOcclusion(hitPoint, normal, sceneSDF, aoSamples);

          const ambient = this.uLightColor
            .mul(this.uAmbientIntensity)
            .mul(ao)
            .toVar();

          // Diffuse lighting
          const lightDir = normalize(this.uLightPosition);
          const diff = max(dot(normal, lightDir), float(0));

          // Soft shadows
          const shadow = tslSoftShadow(
            hitPoint,
            lightDir,
            sceneSDF,
            float(0.01),
            float(10),
            float(20)
          );

          const diffuse = this.uLightColor
            .mul(diff)
            .mul(this.uDiffuseIntensity)
            .mul(shadow);

          // Specular with fresnel
          const reflectDir = lightDir.negate().reflect(normal);
          const spec = pow(
            max(dot(viewDir, reflectDir), float(0)),
            this.uSpecularPower
          );
          const fresnel = pow(
            float(1).sub(max(dot(viewDir, normal), float(0))),
            this.uFresnelPower
          );

          let specular = this.uLightColor
            .mul(spec)
            .mul(this.uSpecularIntensity)
            .mul(fresnel)
            .toVar();

          const fresnelRim = this.uLightColor.mul(fresnel).mul(0.4);

          // Cursor proximity highlight
          const distToCursor = length(hitPoint.sub(this.uCursorSphere));
          If(distToCursor.lessThan(this.uCursorRadius.add(0.4)), () => {
            const highlight = float(1).sub(
              smoothstep(float(0), this.uCursorRadius.add(0.4), distToCursor)
            );
            specular.assign(
              specular.add(this.uLightColor.mul(highlight).mul(0.2))
            );

            const glow = exp(distToCursor.negate().mul(3)).mul(0.15);
            ambient.assign(ambient.add(this.uLightColor.mul(glow).mul(0.5)));
          });

          let color = baseColor
            .add(ambient)
            .add(diffuse)
            .add(specular)
            .add(fresnelRim)
            .mul(ao)
            .toVar();

          // Tone mapping
          color.assign(pow(color, vec3(this.uContrast.mul(0.9))));
          color.assign(color.div(color.add(vec3(0.8, 0.8, 0.8))));

          return color;
        });
      }
    );

    // Cursor glow effect
    const calculateCursorGlow = TSLFn(([worldPos]: [TSLNode]) => {
      const dist = length(worldPos.xy.sub(this.uCursorSphere.xy));
      const glow = float(1).sub(
        smoothstep(float(0), this.uCursorGlowRadius, dist)
      );
      return pow(glow, float(2)).mul(this.uCursorGlowIntensity);
    });

    // Main shader function using TSL.uv() and TSL.viewportCoordinate
    const metaballShader = TSLFn(([]: []) => {
      // Calculate UV using fragment coordinates
      const fragCoord = TSL.viewportCoordinate.mul(this.uActualResolution);
      let uv = fragCoord
        .mul(2)
        .sub(this.uActualResolution)
        .div(this.uActualResolution)
        .toVar();
      uv.x.assign(uv.x.mul(this.uResolution.x.div(this.uResolution.y)));

      // Ray setup (orthographic projection)
      const rayOrigin = vec3(uv.mul(2), float(-1));
      const rayDirection = vec3(0, 0, 1);

      // Ray march
      const hitDist = tslRayMarch(rayOrigin, rayDirection, sceneSDF, stepCount);
      const hitPoint = rayOrigin.add(rayDirection.mul(hitDist));

      // Calculate lighting
      const color = lighting(hitPoint, rayDirection, hitDist).toVar();

      // Cursor glow
      const cursorGlow = calculateCursorGlow(rayOrigin);
      const glowContribution = this.uCursorGlowColor.mul(cursorGlow);

      // Final color with fog and glow
      const finalColor = If(hitDist.greaterThan(0), () => {
        // Surface hit - apply fog and glow
        const fogAmount = float(1).sub(
          exp(hitDist.negate().mul(this.uFogDensity))
        );
        const colorWithFog = mix(
          color,
          this.uBackgroundColor,
          fogAmount.mul(0.3)
        );
        return colorWithFog.add(glowContribution.mul(0.3));
      }).Else(() => {
        // Background - show glow only
        return glowContribution;
      });

      const alpha = If(hitDist.greaterThan(0), () => float(1))
        .ElseIf(cursorGlow.greaterThan(0.01), () => cursorGlow.mul(0.8))
        .Else(() => float(0));

      return vec4(finalColor, alpha);
    });

    // Create material
    const material = new MeshBasicNodeMaterial();
    material.colorNode = metaballShader();
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
  }
}
