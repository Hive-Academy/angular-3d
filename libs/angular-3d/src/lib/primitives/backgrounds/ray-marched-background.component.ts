/**
 * RayMarchedBackgroundComponent - Generic Ray-Marched Background using TSL Shaders
 *
 * Creates interactive metaball-style backgrounds using signed distance functions (SDF)
 * and ray marching via Three.js TSL (Three.js Shading Language).
 *
 * Features:
 * - Ray marching with signed distance functions
 * - Smooth minimum (smin) for organic blob blending
 * - Interactive mouse/touch tracking with shader uniform integration
 * - 3 color presets: cosmic, minimal, neon
 * - Adaptive quality: 64 ray march steps (desktop), 16 (mobile)
 * - Full lighting model with ambient occlusion, fresnel, fog
 * - Fullscreen mode (fills camera frustum) or positioned mode (3D positioning)
 * - Responsive scaling on window resize and camera FOV changes
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy
 * - Signal-based inputs for reactive updates
 * - TSL-based ray marching (MeshBasicNodeMaterial, NOT ShaderMaterial)
 * - Uses RenderLoopService for animation updates
 * - Full-screen 2x2 PlaneGeometry with viewport positioning
 * - ViewportPositionDirective for depth layering via hostDirectives
 *
 * @example
 * ```html
 * <a3d-ray-marched-background
 *   preset="cosmic"
 *   [sphereCount]="6"
 *   [smoothness]="0.3"
 *   [enableMouse]="true"
 *   [fullscreen]="true"
 *   viewportPosition="center"
 *   [viewportZ]="-20"
 * />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as TSL from 'three/tsl';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';

import { SceneService } from '../../canvas/scene.service';
import { ViewportPositionDirective } from '../../positioning/viewport-position.directive';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { NG_3D_PARENT } from '../../types/tokens';
import {
  tslAmbientOcclusion,
  tslNormal,
  tslRayMarch,
  tslSmoothUnion,
  tslSphereDistance,
} from '../shaders/tsl-raymarching';

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * Color preset type for RayMarchedBackgroundComponent
 */
export type RayMarchedPreset = 'cosmic' | 'minimal' | 'neon';

/**
 * Configuration interface for ray marched presets
 */
export interface RayMarchedPresetConfig {
  sphereCount: number;
  smoothness: number;
  backgroundColor: THREE.Color;
  sphereColor: THREE.Color;
  lightColor: THREE.Color;
  lightPosition: THREE.Vector3;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  specularPower: number;
  fresnelPower: number;
  fogDensity: number;
}

/**
 * Helper to safely access TSL functions at runtime rather than module load time.
 * This avoids race conditions where WebGPU context isn't ready when module loads.
 */
function getTSL() {
  const {
    Fn,
    Loop,
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
    select,
    screenUV,
    uv,
  } = TSL;

  // Validate that critical TSL functions are available
  if (!Fn || !select) {
    throw new Error(
      'TSL functions not available. Ensure WebGPU context is initialized.'
    );
  }

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Fn: Fn as any,
    Loop,
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
    select,
    screenUV,
    uv,
  };
}

@Component({
  selector: 'a3d-ray-marched-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  hostDirectives: [
    {
      directive: ViewportPositionDirective,
      inputs: ['viewportPosition', 'viewportOffset', 'viewportZ'],
    },
  ],
})
export class RayMarchedBackgroundComponent {
  // ========================================================================
  // Signal Inputs - Configuration
  // ========================================================================

  /**
   * Preset configuration (cosmic, minimal, neon)
   */
  public readonly preset = input<RayMarchedPreset>('cosmic');

  /**
   * Number of animated spheres (recommended max: 6)
   * IMPORTANT: TSL Loop unrolls all iterations at compile time.
   * Values > 10 will cause shader compilation hang. Clamped with warning.
   */
  public readonly sphereCount = input<number>(6);

  /**
   * Smoothness of metaball blending (0-1 range)
   * Higher values = more organic blending
   */
  public readonly smoothness = input<number>(0.3);

  /**
   * Enable mouse/touch interaction (shader uniform updates)
   */
  public readonly enableMouse = input<boolean>(false);

  /**
   * Fullscreen mode for hero sections
   * When true: Plane scales to fill camera frustum, uses screenUV for rendering
   * When false: Standard 3D positioning with geometry UV
   */
  public readonly fullscreen = input<boolean>(true);

  /**
   * Enable transparency for background blending
   */
  public readonly transparent = input<boolean>(true);

  /**
   * Opacity level (0-1)
   */
  public readonly opacity = input<number>(1.0);

  // ========================================================================
  // Dependency Injection
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  // SceneService is optional to support usage outside Scene3dComponent
  private readonly sceneService = inject(SceneService, { optional: true });

  // ========================================================================
  // Three.js Objects
  // ========================================================================

  private mesh!: THREE.Mesh;
  private material!: MeshBasicNodeMaterial;

  // ========================================================================
  // TSL Uniform Nodes
  // ========================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uTime!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uResolution!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMousePosition!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSphereCount!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSmoothness!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uBackgroundColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSphereColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uLightColor!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uLightPosition!: any;
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
  private uFogDensity!: any;

  // ========================================================================
  // Mouse Tracking State
  // ========================================================================

  private readonly mousePosition = new THREE.Vector2(0.5, 0.5);
  private readonly targetMousePosition = new THREE.Vector2(0.5, 0.5);

  // ========================================================================
  // Device Detection
  // ========================================================================

  private readonly isMobile: boolean;
  private readonly isLowPowerDevice: boolean;

  // ========================================================================
  // Lifecycle & Event Management
  // ========================================================================

  private renderLoopCleanup!: () => void;
  private isAddedToScene = false;

  // Event listener references for cleanup
  private boundOnPointerMove!: (event: MouseEvent) => void;
  private boundOnTouchStart!: (event: TouchEvent) => void;
  private boundOnTouchMove!: (event: TouchEvent) => void;
  private boundOnResize!: () => void;

  // ========================================================================
  // Preset Configurations
  // ========================================================================

  private readonly presets: Record<RayMarchedPreset, RayMarchedPresetConfig>;

  // ========================================================================
  // Constructor & Lifecycle
  // ========================================================================

  public constructor() {
    // Device detection (pattern from MetaballComponent)
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
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnResize = this.onWindowResize.bind(this);

    // Effect: Add mesh to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMesh();
        parent.add(this.mesh);
        this.isAddedToScene = true;

        // Setup mouse tracking if enabled
        if (this.enableMouse()) {
          this.setupEventListeners();
        }
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

      // Validation: Clamp sphere count to prevent shader compilation hang
      const clampedSphereCount = Math.min(sphereCount, 10);
      if (sphereCount > 10) {
        console.warn(
          `[RayMarchedBackground] sphereCount clamped to 10 (was ${sphereCount}). TSL Loop unrolling limits prevent higher counts.`
        );
      }

      // Update TSL uniform nodes
      this.uSphereCount.value = clampedSphereCount;
      this.uSmoothness.value = Math.max(0, Math.min(1, smoothness));
    });

    // Effect: Update fullscreen scale when camera becomes available
    effect(() => {
      const camera = this.sceneService?.camera();
      const isFullscreen = this.fullscreen();

      // Only update if we have camera, mesh, and fullscreen mode
      if (camera && this.mesh && isFullscreen) {
        this.updateFullscreenScale();
      }
    });

    // Effect: Setup/teardown mouse listeners when enableMouse changes
    effect(() => {
      if (this.enableMouse() && this.isAddedToScene) {
        this.setupEventListeners();
      } else {
        this.removeEventListeners();
      }
    });

    // Animation loop - update time and mouse position
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (!this.uTime) return;

      // Update time
      this.uTime.value += delta;

      // Smooth mouse movement with interpolation
      const smoothness = 0.1;
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
        parent.remove(this.mesh);
      }
      this.isAddedToScene = false;

      // Dispose Three.js resources
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.material.dispose();
      }
    });
  }

  // ========================================================================
  // Preset Configuration
  // ========================================================================

  /**
   * Initialize preset configurations with device-aware sphere counts
   */
  private initializePresets(): Record<
    RayMarchedPreset,
    RayMarchedPresetConfig
  > {
    return {
      cosmic: {
        sphereCount: this.isMobile ? 4 : 6,
        smoothness: 0.3,
        backgroundColor: new THREE.Color(0x000522),
        sphereColor: new THREE.Color(0x001144),
        lightColor: new THREE.Color(0x88aaff),
        lightPosition: new THREE.Vector3(0.5, 1, 0.5),
        ambientIntensity: 0.03,
        diffuseIntensity: 0.8,
        specularIntensity: 1.6,
        specularPower: 6,
        fresnelPower: 1.4,
        fogDensity: 0.15,
      },
      minimal: {
        sphereCount: this.isMobile ? 2 : 3,
        smoothness: 0.5,
        backgroundColor: new THREE.Color(0x0a0a0a),
        sphereColor: new THREE.Color(0x000000),
        lightColor: new THREE.Color(0xffffff),
        lightPosition: new THREE.Vector3(1, 0.5, 0.8),
        ambientIntensity: 0.0,
        diffuseIntensity: 0.25,
        specularIntensity: 1.3,
        specularPower: 11,
        fresnelPower: 1.7,
        fogDensity: 0.1,
      },
      neon: {
        sphereCount: this.isMobile ? 4 : 8,
        smoothness: 0.2,
        backgroundColor: new THREE.Color(0x000808),
        sphereColor: new THREE.Color(0x001010),
        lightColor: new THREE.Color(0x00ffcc),
        lightPosition: new THREE.Vector3(0.7, 1.3, 0.8),
        ambientIntensity: 0.04,
        diffuseIntensity: 1.0,
        specularIntensity: 2.0,
        specularPower: 4,
        fresnelPower: 1.0,
        fogDensity: 0.08,
      },
    };
  }

  /**
   * Apply a preset configuration to the uniforms
   */
  private applyPreset(presetName: RayMarchedPreset): void {
    const preset = this.presets[presetName];
    if (!preset || !this.uSphereCount) return;

    this.uSphereCount.value = preset.sphereCount;
    this.uSmoothness.value = preset.smoothness;
    this.uBackgroundColor.value = preset.backgroundColor;
    this.uSphereColor.value = preset.sphereColor;
    this.uLightColor.value = preset.lightColor;
    this.uLightPosition.value = preset.lightPosition;
    this.uAmbientIntensity.value = preset.ambientIntensity;
    this.uDiffuseIntensity.value = preset.diffuseIntensity;
    this.uSpecularIntensity.value = preset.specularIntensity;
    this.uSpecularPower.value = preset.specularPower;
    this.uFresnelPower.value = preset.fresnelPower;
    this.uFogDensity.value = preset.fogDensity;
  }

  // ========================================================================
  // Mesh Creation & Material
  // ========================================================================

  /**
   * Create the full-screen background mesh with TSL ray marching shader
   */
  private createMesh(): void {
    // Get TSL uniform function at runtime
    const { uniform } = getTSL();

    // Get initial viewport dimensions
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;

    // Initialize uniforms with current preset
    const currentPreset = this.presets[this.preset()];

    // Create TSL uniform nodes
    this.uTime = uniform(0);
    this.uResolution = uniform(new THREE.Vector2(width, height));
    this.uMousePosition = uniform(new THREE.Vector2(0.5, 0.5));
    this.uSphereCount = uniform(this.sphereCount());
    this.uSmoothness = uniform(this.smoothness());
    this.uBackgroundColor = uniform(currentPreset.backgroundColor);
    this.uSphereColor = uniform(currentPreset.sphereColor);
    this.uLightColor = uniform(currentPreset.lightColor);
    this.uLightPosition = uniform(currentPreset.lightPosition);
    this.uAmbientIntensity = uniform(currentPreset.ambientIntensity);
    this.uDiffuseIntensity = uniform(currentPreset.diffuseIntensity);
    this.uSpecularIntensity = uniform(currentPreset.specularIntensity);
    this.uSpecularPower = uniform(currentPreset.specularPower);
    this.uFresnelPower = uniform(currentPreset.fresnelPower);
    this.uFogDensity = uniform(currentPreset.fogDensity);

    // Create TSL material with ray marching shader
    this.material = this.createTSLMaterial();

    // Create full-screen 2x2 plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;

    // Fullscreen mode: scale plane to fill viewport
    if (this.fullscreen()) {
      this.updateFullscreenScale();
    }
  }

  /**
   * Create TSL Material with Ray Marching Shader
   *
   * Implements ray marching using TSL utilities from tsl-raymarching.ts
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
      dot,
      pow,
      normalize,
      mix,
      exp,
      select,
      screenUV,
      uv,
      sin,
      cos,
    } = getTSL();

    // Capture fullscreen mode at material creation time (not reactive)
    const isFullscreen = this.fullscreen();

    // ========================================================================
    // SCENE SDF - Procedural sphere animation
    // ========================================================================

    const sceneSDF = Fn(([pos]: [TSLNode]) => {
      const result = float(100).toVar(); // MAX_DIST
      const t = this.uTime;

      // Animate spheres in circular orbits with different speeds and phases
      Loop(6, ({ i }: { i: TSLNode }) => {
        const shouldAdd = float(i).lessThan(this.uSphereCount);

        // Each sphere has unique orbit parameters
        const iFloat = float(i);
        const speed = float(0.3).add(iFloat.mul(0.15));
        const phase = iFloat.mul(1.047); // ~PI/3 radians for phase distribution
        const orbitRadius = float(0.4).add(iFloat.mul(0.1));

        // Circular orbit positions
        const angle = t.mul(speed).add(phase);
        const offset = vec3(
          sin(angle).mul(orbitRadius),
          cos(angle).mul(orbitRadius),
          float(0)
        );

        // Sphere radius varies by index
        const radius = float(0.12).add(iFloat.mul(0.03));

        // Use TSL ray marching utilities
        const sphereDist = tslSphereDistance(pos, offset, radius);

        // Smooth blend with existing result
        const blended = tslSmoothUnion(result, sphereDist, this.uSmoothness);
        result.assign(select(shouldAdd, blended, result));
      });

      return result;
    });

    // ========================================================================
    // MAIN RAY MARCHING SHADER
    // ========================================================================

    const rayMarch = Fn(() => {
      // Choose UV source based on fullscreen mode
      const uvSource = isFullscreen ? screenUV : uv();

      // Screen coordinates centered at origin (-0.5 to +0.5)
      const screenCoords = uvSource.sub(vec2(float(0.5), float(0.5)));

      // Aspect ratio correction
      const aspect = this.uResolution.x.div(this.uResolution.y);
      const adjustedUV = vec2(screenCoords.x.mul(aspect), screenCoords.y);

      // Orthographic-style camera (rays parallel to z-axis)
      const rayOrigin = vec3(
        adjustedUV.x.mul(2),
        adjustedUV.y.mul(2),
        float(-1)
      );
      const rayDir = vec3(float(0), float(0), float(1));

      // Adaptive ray march steps based on device capability
      const stepCount = this.isLowPowerDevice ? float(16) : float(64);

      // Ray march using TSL utilities
      const hitDist = tslRayMarch(rayOrigin, rayDir, sceneSDF, stepCount);
      const hit = hitDist.greaterThan(0);

      // Calculate surface point and normal
      const hitPoint = rayOrigin.add(rayDir.mul(hitDist));
      const normal = tslNormal(hitPoint, sceneSDF);

      // Lighting calculations
      const viewDir = rayDir.negate();
      const lightDir = normalize(this.uLightPosition);

      // Ambient occlusion (2 samples for mobile, 6 for desktop)
      const aoSamples = this.isLowPowerDevice ? float(2) : float(6);
      const ao = tslAmbientOcclusion(hitPoint, normal, sceneSDF, aoSamples);

      // Diffuse lighting
      const diff = max(dot(normal, lightDir), float(0));

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
      const diffuse = this.uLightColor.mul(diff).mul(this.uDiffuseIntensity);
      const specular = this.uLightColor.mul(spec).mul(this.uSpecularIntensity);
      const fresnelRim = this.uLightColor.mul(fresnel).mul(0.4);

      // Base color + all lighting
      let color = this.uSphereColor
        .add(ambient)
        .add(diffuse)
        .add(specular)
        .add(fresnelRim);
      color = color.mul(ao);

      // Fog
      const fogAmount = float(1).sub(
        exp(hitDist.negate().mul(this.uFogDensity))
      );
      color = mix(color, this.uBackgroundColor, fogAmount.mul(0.3));

      // Final color: lit surface or background
      const finalColor = select(hit, color, this.uBackgroundColor);

      // Alpha: opaque for hit, transparent for background (based on opacity input)
      const finalAlpha = select(hit, float(1), float(this.opacity()));

      return vec4(finalColor, finalAlpha);
    });

    // ========================================================================
    // CREATE MATERIAL
    // ========================================================================

    const material = new MeshBasicNodeMaterial();
    material.colorNode = rayMarch();
    material.transparent = this.transparent();
    material.opacity = this.opacity();
    material.depthWrite = false;
    material.depthTest = false;

    return material;
  }

  // ========================================================================
  // Fullscreen Scaling
  // ========================================================================

  /**
   * Scale plane geometry to fill camera frustum
   * Uses camera FOV and distance to calculate required plane dimensions.
   * Only used when fullscreen=true.
   */
  private updateFullscreenScale(): void {
    // Handle cases where camera is not available yet or SceneService is not injected
    const camera = this.sceneService?.camera();
    if (!camera || !this.mesh) return;

    // Get camera distance from camera position
    const distance = camera.position.length();

    // Calculate frustum dimensions at plane distance
    const vFov = (camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * distance;
    const planeWidth = planeHeight * camera.aspect;

    // Scale plane to fill viewport with 10% overflow to prevent edge artifacts
    const scale = 1.1;
    this.mesh.scale.set(planeWidth * scale, planeHeight * scale, 1);

    // Position plane at camera distance (slightly in front to avoid z-fighting)
    this.mesh.position.set(0, 0, -distance + 0.01);
  }

  // ========================================================================
  // Event Listeners - Mouse/Touch Tracking
  // ========================================================================

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
  private onPointerMove(event: MouseEvent): void {
    if (typeof window === 'undefined') return;

    // Convert to normalized coordinates (0-1)
    this.targetMousePosition.x = event.clientX / window.innerWidth;
    this.targetMousePosition.y = 1.0 - event.clientY / window.innerHeight;
  }

  /**
   * Handle touch start events
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.targetMousePosition.x = touch.clientX / window.innerWidth;
      this.targetMousePosition.y = 1.0 - touch.clientY / window.innerHeight;
    }
  }

  /**
   * Handle touch move events
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.targetMousePosition.x = touch.clientX / window.innerWidth;
      this.targetMousePosition.y = 1.0 - touch.clientY / window.innerHeight;
    }
  }

  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    if (typeof window === 'undefined' || !this.uResolution) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    this.uResolution.value.set(width, height);

    // Update fullscreen scaling when viewport changes
    if (this.fullscreen() && this.mesh) {
      this.updateFullscreenScale();
    }
  }
}
