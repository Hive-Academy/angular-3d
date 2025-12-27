import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../types/tokens';

/**
 * Simple uniform interface for ShaderMaterial uniforms.
 * Replaces THREE.IUniform which isn't exported from three/webgpu.
 * Uses `any` for value type since uniforms can be numbers, colors, vectors, etc.
 */
interface ShaderUniform {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
}
import { OBJECT_ID } from '../tokens/object-id.token';
import { RenderLoopService } from '../render-loop/render-loop.service';

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
  private material!: THREE.ShaderMaterial;
  private uniforms: Record<string, ShaderUniform> = {};
  private readonly group = new THREE.Group();

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
      if (!this.uniforms || Object.keys(this.uniforms).length === 0) return;

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

      // Update uniforms
      this.uniforms['uSphereCount'].value = sphereCount;
      this.uniforms['uSmoothness'].value = smoothness;
      this.uniforms['uAnimationSpeed'].value = animationSpeed;
      this.uniforms['uMovementScale'].value = movementScale;
      this.uniforms['uMouseProximityEffect'].value = mouseProximityEffect;
      this.uniforms['uMinMovementScale'].value = minMovementScale;
      this.uniforms['uMaxMovementScale'].value = maxMovementScale;
      this.uniforms['uFixedTopLeftRadius'].value = fixedTopLeftRadius;
      this.uniforms['uFixedBottomRightRadius'].value = fixedBottomRightRadius;
      this.uniforms['uSmallTopLeftRadius'].value = smallTopLeftRadius;
      this.uniforms['uSmallBottomRightRadius'].value = smallBottomRightRadius;
      this.uniforms['uMergeDistance'].value = mergeDistance;
    });

    // Animation loop - update time and mouse position
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (!this.uniforms || Object.keys(this.uniforms).length === 0) return;

      // Update time
      this.uniforms['uTime'].value += delta;

      // Smooth mouse movement with interpolation
      const smoothness = this.mouseSmoothness();
      this.mousePosition.x +=
        (this.targetMousePosition.x - this.mousePosition.x) * smoothness;
      this.mousePosition.y +=
        (this.targetMousePosition.y - this.mousePosition.y) * smoothness;

      this.uniforms['uMousePosition'].value = this.mousePosition;
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
   * Create the full-screen metaball mesh with ray marching shader
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

    this.uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
      uActualResolution: {
        value: new THREE.Vector2(width * pixelRatio, height * pixelRatio),
      },
      uPixelRatio: { value: pixelRatio },
      uMousePosition: { value: new THREE.Vector2(0.5, 0.5) },
      uCursorSphere: { value: new THREE.Vector3(0, 0, 0) },
      uCursorRadius: { value: this.cursorRadiusMin() },
      uSphereCount: { value: this.sphereCount() },
      uFixedTopLeftRadius: { value: this.fixedTopLeftRadius() },
      uFixedBottomRightRadius: { value: this.fixedBottomRightRadius() },
      uSmallTopLeftRadius: { value: this.smallTopLeftRadius() },
      uSmallBottomRightRadius: { value: this.smallBottomRightRadius() },
      uMergeDistance: { value: this.mergeDistance() },
      uSmoothness: { value: this.smoothness() },
      uAmbientIntensity: { value: currentPreset.ambientIntensity },
      uDiffuseIntensity: { value: currentPreset.diffuseIntensity },
      uSpecularIntensity: { value: currentPreset.specularIntensity },
      uSpecularPower: { value: currentPreset.specularPower },
      uFresnelPower: { value: currentPreset.fresnelPower },
      uBackgroundColor: { value: currentPreset.backgroundColor },
      uSphereColor: { value: currentPreset.sphereColor },
      uLightColor: { value: currentPreset.lightColor },
      uLightPosition: { value: currentPreset.lightPosition },
      uContrast: { value: currentPreset.contrast },
      uFogDensity: { value: currentPreset.fogDensity },
      uAnimationSpeed: { value: this.animationSpeed() },
      uMovementScale: { value: this.movementScale() },
      uMouseProximityEffect: { value: this.mouseProximityEffect() },
      uMinMovementScale: { value: this.minMovementScale() },
      uMaxMovementScale: { value: this.maxMovementScale() },
      uCursorGlowIntensity: { value: currentPreset.cursorGlowIntensity },
      uCursorGlowRadius: { value: currentPreset.cursorGlowRadius },
      uCursorGlowColor: { value: currentPreset.cursorGlowColor },
      uIsMobile: { value: this.isMobile ? 1.0 : 0.0 },
      uIsLowPower: { value: this.isLowPowerDevice ? 1.0 : 0.0 },
    };

    // Create shader material with ray marching
    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: this.vertexShader,
      fragmentShader: this.getFragmentShader(),
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });

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
    if (!preset || !this.uniforms) return;

    this.uniforms['uSphereCount'].value = preset.sphereCount;
    this.uniforms['uAmbientIntensity'].value = preset.ambientIntensity;
    this.uniforms['uDiffuseIntensity'].value = preset.diffuseIntensity;
    this.uniforms['uSpecularIntensity'].value = preset.specularIntensity;
    this.uniforms['uSpecularPower'].value = preset.specularPower;
    this.uniforms['uFresnelPower'].value = preset.fresnelPower;
    this.uniforms['uBackgroundColor'].value = preset.backgroundColor;
    this.uniforms['uSphereColor'].value = preset.sphereColor;
    this.uniforms['uLightColor'].value = preset.lightColor;
    this.uniforms['uLightPosition'].value = preset.lightPosition;
    this.uniforms['uSmoothness'].value = preset.smoothness;
    this.uniforms['uContrast'].value = preset.contrast;
    this.uniforms['uFogDensity'].value = preset.fogDensity;
    this.uniforms['uCursorGlowIntensity'].value = preset.cursorGlowIntensity;
    this.uniforms['uCursorGlowRadius'].value = preset.cursorGlowRadius;
    this.uniforms['uCursorGlowColor'].value = preset.cursorGlowColor;
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

    if (this.uniforms) {
      this.uniforms['uCursorSphere'].value.copy(this.cursorSphere3D);
      this.uniforms['uCursorRadius'].value = dynamicRadius;
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
    if (typeof window === 'undefined' || !this.uniforms) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      this.isMobile ? 1.5 : 2
    );

    this.uniforms['uResolution'].value.set(width, height);
    this.uniforms['uActualResolution'].value.set(
      width * pixelRatio,
      height * pixelRatio
    );
    this.uniforms['uPixelRatio'].value = pixelRatio;
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
   * Vertex Shader - Simple passthrough with UV
   */
  private readonly vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /**
   * Generate fragment shader with device-appropriate precision
   */
  private getFragmentShader(): string {
    const precisionDecl =
      this.isMobile || this.isLowPowerDevice
        ? 'precision mediump float;'
        : 'precision highp float;';

    return `
      ${precisionDecl}

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uActualResolution;
      uniform float uPixelRatio;
      uniform vec2 uMousePosition;
      uniform vec3 uCursorSphere;
      uniform float uCursorRadius;
      uniform int uSphereCount;
      uniform float uFixedTopLeftRadius;
      uniform float uFixedBottomRightRadius;
      uniform float uSmallTopLeftRadius;
      uniform float uSmallBottomRightRadius;
      uniform float uMergeDistance;
      uniform float uSmoothness;
      uniform float uAmbientIntensity;
      uniform float uDiffuseIntensity;
      uniform float uSpecularIntensity;
      uniform float uSpecularPower;
      uniform float uFresnelPower;
      uniform vec3 uBackgroundColor;
      uniform vec3 uSphereColor;
      uniform vec3 uLightColor;
      uniform vec3 uLightPosition;
      uniform float uContrast;
      uniform float uFogDensity;
      uniform float uAnimationSpeed;
      uniform float uMovementScale;
      uniform bool uMouseProximityEffect;
      uniform float uMinMovementScale;
      uniform float uMaxMovementScale;
      uniform float uCursorGlowIntensity;
      uniform float uCursorGlowRadius;
      uniform vec3 uCursorGlowColor;
      uniform float uIsMobile;
      uniform float uIsLowPower;

      varying vec2 vUv;

      const float PI = 3.14159265359;
      const float EPSILON = 0.001;
      const float MAX_DIST = 100.0;

      // Smooth minimum for organic blob blending
      float smin(float a, float b, float k) {
        float h = max(k - abs(a - b), 0.0) / k;
        return min(a, b) - h * h * k * 0.25;
      }

      // Sphere signed distance function
      float sdSphere(vec3 p, float r) {
        return length(p) - r;
      }

      // Convert normalized screen position to world coordinates
      vec3 screenToWorld(vec2 normalizedPos) {
        vec2 uv = normalizedPos * 2.0 - 1.0;
        uv.x *= uResolution.x / uResolution.y;
        return vec3(uv * 2.0, 0.0);
      }

      // Calculate distance from center for mouse proximity effect
      float getDistanceToCenter(vec2 pos) {
        float dist = length(pos - vec2(0.5, 0.5)) * 2.0;
        return smoothstep(0.0, 1.0, dist);
      }

      // Main scene SDF - combines all metaballs
      float sceneSDF(vec3 pos) {
        float result = MAX_DIST;

        // Fixed sphere positions using consistent coordinate system
        vec3 topLeftPos = screenToWorld(vec2(0.08, 0.92));
        float topLeft = sdSphere(pos - topLeftPos, uFixedTopLeftRadius);

        vec3 smallTopLeftPos = screenToWorld(vec2(0.25, 0.72));
        float smallTopLeft = sdSphere(pos - smallTopLeftPos, uSmallTopLeftRadius);

        vec3 bottomRightPos = screenToWorld(vec2(0.92, 0.08));
        float bottomRight = sdSphere(pos - bottomRightPos, uFixedBottomRightRadius);

        vec3 smallBottomRightPos = screenToWorld(vec2(0.72, 0.25));
        float smallBottomRight = sdSphere(pos - smallBottomRightPos, uSmallBottomRightRadius);

        float t = uTime * uAnimationSpeed;

        // Calculate dynamic movement scale based on mouse proximity
        float dynamicMovementScale = uMovementScale;
        if (uMouseProximityEffect) {
          float distToCenter = getDistanceToCenter(uMousePosition);
          float mixFactor = smoothstep(0.0, 1.0, distToCenter);
          dynamicMovementScale = mix(uMinMovementScale, uMaxMovementScale, mixFactor);
        }

        // Optimized iterations for performance
        int maxIter = uIsMobile > 0.5 ? 4 : (uIsLowPower > 0.5 ? 6 : min(uSphereCount, 10));
        for (int i = 0; i < 10; i++) {
          if (i >= uSphereCount || i >= maxIter) break;

          float fi = float(i);
          float speed = 0.4 + fi * 0.12;
          float radius = 0.12 + mod(fi, 3.0) * 0.06;
          float orbitRadius = (0.3 + mod(fi, 3.0) * 0.15) * dynamicMovementScale;
          float phaseOffset = fi * PI * 0.35;

          float distToCursor = length(vec3(0.0) - uCursorSphere);
          float proximityScale = 1.0 + (1.0 - smoothstep(0.0, 1.0, distToCursor)) * 0.5;
          orbitRadius *= proximityScale;

          vec3 offset;
          if (i == 0) {
            offset = vec3(
              sin(t * speed) * orbitRadius * 0.7,
              sin(t * 0.5) * orbitRadius,
              cos(t * speed * 0.7) * orbitRadius * 0.5
            );
          } else if (i == 1) {
            offset = vec3(
              sin(t * speed + PI) * orbitRadius * 0.5,
              -sin(t * 0.5) * orbitRadius,
              cos(t * speed * 0.7 + PI) * orbitRadius * 0.5
            );
          } else {
            offset = vec3(
              sin(t * speed + phaseOffset) * orbitRadius * 0.8,
              cos(t * speed * 0.85 + phaseOffset * 1.3) * orbitRadius * 0.6,
              sin(t * speed * 0.5 + phaseOffset) * 0.3
            );
          }

          // Attraction toward cursor
          vec3 toCursor = uCursorSphere - offset;
          float cursorDist = length(toCursor);
          if (cursorDist < uMergeDistance && cursorDist > 0.0) {
            float attraction = (1.0 - cursorDist / uMergeDistance) * 0.3;
            offset += normalize(toCursor) * attraction;
          }

          float movingSphere = sdSphere(pos - offset, radius);

          // Dynamic blend factor based on cursor proximity
          float blend = 0.05;
          if (cursorDist < uMergeDistance) {
            float influence = 1.0 - (cursorDist / uMergeDistance);
            blend = mix(0.05, uSmoothness, influence * influence * influence);
          }

          result = smin(result, movingSphere, blend);
        }

        // Cursor sphere
        float cursorBall = sdSphere(pos - uCursorSphere, uCursorRadius);

        // Group fixed spheres
        float topLeftGroup = smin(topLeft, smallTopLeft, 0.4);
        float bottomRightGroup = smin(bottomRight, smallBottomRight, 0.4);

        // Combine all spheres
        result = smin(result, topLeftGroup, 0.3);
        result = smin(result, bottomRightGroup, 0.3);
        result = smin(result, cursorBall, uSmoothness);

        return result;
      }

      // Calculate surface normal via gradient
      vec3 calcNormal(vec3 p) {
        float eps = uIsLowPower > 0.5 ? 0.002 : 0.001;
        return normalize(vec3(
          sceneSDF(p + vec3(eps, 0, 0)) - sceneSDF(p - vec3(eps, 0, 0)),
          sceneSDF(p + vec3(0, eps, 0)) - sceneSDF(p - vec3(0, eps, 0)),
          sceneSDF(p + vec3(0, 0, eps)) - sceneSDF(p - vec3(0, 0, eps))
        ));
      }

      // Ambient occlusion sampling
      float ambientOcclusion(vec3 p, vec3 n) {
        if (uIsLowPower > 0.5) {
          float h1 = sceneSDF(p + n * 0.03);
          float h2 = sceneSDF(p + n * 0.06);
          float occ = (0.03 - h1) + (0.06 - h2) * 0.5;
          return clamp(1.0 - occ * 2.0, 0.0, 1.0);
        } else {
          float occ = 0.0;
          float weight = 1.0;
          for (int i = 0; i < 6; i++) {
            float dist = 0.01 + 0.015 * float(i * i);
            float h = sceneSDF(p + n * dist);
            occ += (dist - h) * weight;
            weight *= 0.85;
          }
          return clamp(1.0 - occ, 0.0, 1.0);
        }
      }

      // Soft shadow calculation
      float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
        if (uIsLowPower > 0.5) {
          float result = 1.0;
          float t = mint;
          for (int i = 0; i < 3; i++) {
            t += 0.3;
            if (t >= maxt) break;
            float h = sceneSDF(ro + rd * t);
            if (h < EPSILON) return 0.0;
            result = min(result, k * h / t);
          }
          return result;
        } else {
          float result = 1.0;
          float t = mint;
          for (int i = 0; i < 20; i++) {
            if (t >= maxt) break;
            float h = sceneSDF(ro + rd * t);
            if (h < EPSILON) return 0.0;
            result = min(result, k * h / t);
            t += h;
          }
          return result;
        }
      }

      // Main ray marching loop
      float rayMarch(vec3 ro, vec3 rd) {
        float t = 0.0;
        int maxSteps = uIsMobile > 0.5 ? 16 : 48;

        for (int i = 0; i < 48; i++) {
          if (i >= maxSteps) break;

          vec3 p = ro + rd * t;
          float d = sceneSDF(p);

          if (d < EPSILON) {
            return t;
          }

          if (t > 5.0) {
            break;
          }

          t += d * (uIsLowPower > 0.5 ? 1.2 : 0.9);
        }

        return -1.0;
      }

      // Full lighting model
      vec3 lighting(vec3 p, vec3 rd, float t) {
        if (t < 0.0) {
          return vec3(0.0);
        }

        vec3 normal = calcNormal(p);
        vec3 viewDir = -rd;

        vec3 baseColor = uSphereColor;

        float ao = ambientOcclusion(p, normal);

        vec3 ambient = uLightColor * uAmbientIntensity * ao;

        vec3 lightDir = normalize(uLightPosition);
        float diff = max(dot(normal, lightDir), 0.0);

        float shadow = softShadow(p, lightDir, 0.01, 10.0, 20.0);

        vec3 diffuse = uLightColor * diff * uDiffuseIntensity * shadow;

        vec3 reflectDir = reflect(-lightDir, normal);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);

        vec3 specular = uLightColor * spec * uSpecularIntensity * fresnel;

        vec3 fresnelRim = uLightColor * fresnel * 0.4;

        // Cursor proximity highlight
        float distToCursor = length(p - uCursorSphere);
        if (distToCursor < uCursorRadius + 0.4) {
          float highlight = 1.0 - smoothstep(0.0, uCursorRadius + 0.4, distToCursor);
          specular += uLightColor * highlight * 0.2;

          float glow = exp(-distToCursor * 3.0) * 0.15;
          ambient += uLightColor * glow * 0.5;
        }

        vec3 color = (baseColor + ambient + diffuse + specular + fresnelRim) * ao;

        // Tone mapping
        color = pow(color, vec3(uContrast * 0.9));
        color = color / (color + vec3(0.8));

        return color;
      }

      // Calculate cursor glow effect
      float calculateCursorGlow(vec3 worldPos) {
        float dist = length(worldPos.xy - uCursorSphere.xy);
        float glow = 1.0 - smoothstep(0.0, uCursorGlowRadius, dist);
        glow = pow(glow, 2.0);
        return glow * uCursorGlowIntensity;
      }

      void main() {
        // Calculate UV coordinates using actual resolution for proper aspect ratio
        vec2 uv = (gl_FragCoord.xy * 2.0 - uActualResolution.xy) / uActualResolution.xy;
        uv.x *= uResolution.x / uResolution.y;

        // Ray origin and direction for orthographic-like projection
        vec3 ro = vec3(uv * 2.0, -1.0);
        vec3 rd = vec3(0.0, 0.0, 1.0);

        // Ray march to find surface
        float t = rayMarch(ro, rd);

        // Calculate hit point
        vec3 p = ro + rd * t;

        // Calculate lighting
        vec3 color = lighting(p, rd, t);

        // Calculate cursor glow
        float cursorGlow = calculateCursorGlow(ro);
        vec3 glowContribution = uCursorGlowColor * cursorGlow;

        if (t > 0.0) {
          // Hit surface - apply fog and glow
          float fogAmount = 1.0 - exp(-t * uFogDensity);
          color = mix(color, uBackgroundColor.rgb, fogAmount * 0.3);

          color += glowContribution * 0.3;

          gl_FragColor = vec4(color, 1.0);
        } else {
          // Background - show glow only
          if (cursorGlow > 0.01) {
            gl_FragColor = vec4(glowContribution, cursorGlow * 0.8);
          } else {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          }
        }
      }
    `;
  }
}
