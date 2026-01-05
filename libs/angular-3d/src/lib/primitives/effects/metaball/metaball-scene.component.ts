// Metaball Scene Component - Container with ray marching shader
import {
  ChangeDetectionStrategy,
  Component,
  contentChildren,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import * as TSL from 'three/tsl';

import { RenderLoopService } from '../../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../../types/tokens';
import { SceneService } from '../../../canvas/scene.service';

import {
  MetaballPreset,
  MetaballPresetConfig,
  createMetaballPresets,
} from './presets';
import {
  getTSLFunctions,
  tslSphereSDF,
  tslSmin,
  createScreenToWorldFn,
  screenToWorldJS,
} from './tsl-metaball-sdf';
import {
  createCalcNormalFn,
  createAmbientOcclusionFn,
  createCursorGlowFn,
  createSoftShadowFn,
} from './tsl-metaball-lighting';
import { MetaballSphereComponent } from './metaball-sphere.component';
import { MetaballCursorComponent } from './metaball-cursor.component';
import { MouseTrackerService } from './mouse-tracker.service';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

/**
 * MetaballSceneComponent - Container for compositional metaball scenes
 *
 * Collects child sphere definitions and renders them using ray marching.
 * Supports flexible positioning via child components.
 *
 * @example
 * ```html
 * <a3d-metaball-scene [preset]="'holographic'" [fullscreen]="true">
 *   <a3d-metaball-sphere positionPreset="top-left" [radius]="1.2" />
 *   <a3d-metaball-sphere [position]="[0.3, 0.7]" [radius]="0.4" />
 *   <a3d-metaball-sphere [orbit]="{ radius: 0.5, speed: 0.4 }" [radius]="0.15" />
 *   <a3d-metaball-cursor [glowRadius]="0.5" [glowIntensity]="0.25" />
 * </a3d-metaball-scene>
 * ```
 */
@Component({
  selector: 'a3d-metaball-scene',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    MouseTrackerService,
    {
      provide: OBJECT_ID,
      useFactory: () => `metaball-scene-${crypto.randomUUID()}`,
    },
  ],
})
export class MetaballSceneComponent {
  // === INPUTS ===

  /** Color/lighting preset */
  public readonly preset = input<MetaballPreset>('holographic');

  /** Fullscreen mode - scales to fill camera frustum */
  public readonly fullscreen = input<boolean>(true);

  /** Global blend smoothness between all spheres */
  public readonly smoothness = input<number>(0.3);

  /** Animation speed multiplier */
  public readonly animationSpeed = input<number>(0.6);

  /** Movement scale for animated spheres */
  public readonly movementScale = input<number>(1.2);

  /** Enable mouse proximity effect on movement scale */
  public readonly mouseProximityEffect = input<boolean>(true);

  /** Minimum movement scale (when mouse is at edge) */
  public readonly minMovementScale = input<number>(0.3);

  /** Maximum movement scale (when mouse is at center) */
  public readonly maxMovementScale = input<number>(1.0);

  /** Camera distance for fullscreen calculations (null = auto) */
  public readonly cameraDistance = input<number | null>(null);

  /** Enable adaptive quality for mobile devices */
  public readonly enableAdaptiveQuality = input<boolean>(true);

  // === CONTENT CHILDREN ===

  /** Child sphere definitions */
  private readonly sphereChildren = contentChildren(MetaballSphereComponent);

  /** Child cursor definitions (usually only one) */
  private readonly cursorChildren = contentChildren(MetaballCursorComponent);

  // === DEPENDENCIES ===

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService, { optional: true });
  private readonly mouseTracker = inject(MouseTrackerService);

  // === INTERNAL STATE ===

  private mesh!: THREE.Mesh;
  private material!: MeshBasicNodeMaterial;
  private readonly group = new THREE.Group();
  private isAddedToScene = false;
  private renderLoopCleanup!: () => void;

  // Device detection
  private readonly isMobile: boolean;
  private readonly isLowPowerDevice: boolean;

  // Presets
  private readonly presets: Record<MetaballPreset, MetaballPresetConfig>;

  // TSL Uniforms
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uTime!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uResolution!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMousePosition!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorSphere!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSmoothness!: any;
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

  // Lighting uniforms
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
  private uCursorGlowIntensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorGlowRadius!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uCursorGlowColor!: any;

  // Sphere data uniforms (arrays for up to 16 spheres)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSpherePositions!: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSphereRadii!: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSphereCount!: any;

  // Orbit data for animated spheres (arrays)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uOrbitRadii!: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uOrbitSpeeds!: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uOrbitPhases!: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uAnimatedSphereCount!: any;

  // Window resize handler
  private boundOnResize: () => void;

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

    // Initialize presets
    this.presets = createMetaballPresets(this.isMobile);

    // Bind resize handler
    this.boundOnResize = this.onWindowResize.bind(this);

    // Effect: Add to scene when parent is available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.initializeScene();
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

    // Effect: Update uniforms when inputs change
    effect(() => {
      if (!this.uSmoothness) return;

      this.uSmoothness.value = this.smoothness();
      this.uAnimationSpeed.value = this.animationSpeed();
      this.uMovementScale.value = this.movementScale();
      this.uMouseProximityEffect.value = this.mouseProximityEffect();
      this.uMinMovementScale.value = this.minMovementScale();
      this.uMaxMovementScale.value = this.maxMovementScale();
    });

    // Effect: Update sphere uniforms when content children change
    effect(() => {
      const spheres = this.sphereChildren();
      if (!this.uSpherePositions || this.uSpherePositions.length === 0) return;

      // Update static sphere uniforms
      const staticSpheres = spheres.filter((s) => !s.isAnimated());
      for (let i = 0; i < 4; i++) {
        const sphere = staticSpheres[i];
        const pos = sphere?.getPosition() ?? [0.5, 0.5];
        const radius = sphere?.radius() ?? 0;
        if (this.uSpherePositions[i]) {
          this.uSpherePositions[i].value.set(pos[0], pos[1]);
        }
        if (this.uSphereRadii[i]) {
          this.uSphereRadii[i].value = radius;
        }
      }
      if (this.uSphereCount) {
        this.uSphereCount.value = staticSpheres.length;
      }

      // Update animated sphere uniforms
      const animatedSpheres = spheres.filter((s) => s.isAnimated());
      for (let i = 0; i < 4; i++) {
        const sphere = animatedSpheres[i];
        const orbit = sphere?.orbit();
        if (this.uOrbitRadii[i]) {
          this.uOrbitRadii[i].value = orbit?.radius ?? 0;
        }
        if (this.uOrbitSpeeds[i]) {
          this.uOrbitSpeeds[i].value = orbit?.speed ?? 0;
        }
        if (this.uOrbitPhases[i]) {
          this.uOrbitPhases[i].value = orbit?.phase ?? i * 1.1;
        }
      }
      if (this.uAnimatedSphereCount) {
        this.uAnimatedSphereCount.value = animatedSpheres.length;
      }
    });

    // Effect: Update fullscreen scale when camera is available
    effect(() => {
      const camera = this.sceneService?.camera();
      const isFullscreen = this.fullscreen();
      if (camera && this.mesh && isFullscreen) {
        this.updateFullscreenScale();
      }
    });

    // Animation loop
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(
      (delta: number) => {
        if (!this.uTime) return;
        this.uTime.value += delta;

        // Update cursor position from mouse tracker
        const worldPos = this.mouseTracker.worldPosition();
        if (this.uCursorSphere) {
          this.uCursorSphere.value.copy(worldPos);
        }

        if (this.uMousePosition) {
          const [x, y] = this.mouseTracker.normalizedPosition();
          this.uMousePosition.value.set(x, y);
        }

        // Update dynamic cursor radius based on proximity
        this.updateCursorRadius();
      }
    );

    // Cleanup
    this.destroyRef.onDestroy(() => {
      if (this.renderLoopCleanup) this.renderLoopCleanup();
      this.removeEventListeners();

      const parent = this.parent();
      if (parent && this.isAddedToScene) {
        parent.remove(this.group);
      }
      this.isAddedToScene = false;

      if (this.mesh) {
        this.group.remove(this.mesh);
        this.mesh.geometry.dispose();
        this.material.dispose();
      }
    });
  }

  /**
   * Initialize the scene with mesh and material
   */
  private initializeScene(): void {
    const { uniform } = getTSLFunctions();

    // Get initial dimensions
    const width = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const height = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const _pixelRatio = Math.min(
      typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      this.isMobile ? 1.5 : 2
    );

    // Get current preset
    const currentPreset = this.presets[this.preset()];

    // Initialize cursor config from first cursor child or defaults
    const cursorChild = this.cursorChildren()[0];
    const cursorRadiusMin = cursorChild?.radiusMin() ?? 0.08;
    const cursorGlowIntensity =
      cursorChild?.glowIntensity() ?? currentPreset.cursorGlowIntensity;
    const cursorGlowRadius =
      cursorChild?.glowRadius() ?? currentPreset.cursorGlowRadius;

    // Initialize mouse tracker with cursor smoothness
    const cursorSmoothness = cursorChild?.smoothness() ?? 0.1;
    this.mouseTracker.smoothness.set(cursorSmoothness);
    this.mouseTracker.initialize();

    // Create TSL uniforms
    this.uTime = uniform(0);
    this.uResolution = uniform(new THREE.Vector2(width, height));
    this.uMousePosition = uniform(new THREE.Vector2(0.5, 0.5));
    this.uCursorSphere = uniform(new THREE.Vector3(0, 0, 0));
    this.uCursorRadius = uniform(cursorRadiusMin);
    this.uSmoothness = uniform(this.smoothness());
    this.uAnimationSpeed = uniform(this.animationSpeed());
    this.uMovementScale = uniform(this.movementScale());
    this.uMouseProximityEffect = uniform(this.mouseProximityEffect());
    this.uMinMovementScale = uniform(this.minMovementScale());
    this.uMaxMovementScale = uniform(this.maxMovementScale());

    // Lighting uniforms from preset
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
    this.uCursorGlowIntensity = uniform(cursorGlowIntensity);
    this.uCursorGlowRadius = uniform(cursorGlowRadius);
    this.uCursorGlowColor = uniform(currentPreset.cursorGlowColor);

    // Initialize sphere data from children
    this.initializeSphereUniforms(uniform);

    // Create material and mesh
    this.material = this.createTSLMaterial();
    const geometry = new THREE.PlaneGeometry(2, 2);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);

    if (this.fullscreen()) {
      this.updateFullscreenScale();
    }
  }

  /**
   * Initialize sphere uniforms from child components
   */
  private initializeSphereUniforms(uniform: (value: unknown) => TSLNode): void {
    const spheres = this.sphereChildren();

    // Separate static and animated spheres
    const staticSpheres = spheres.filter((s) => !s.isAnimated());
    const animatedSpheres = spheres.filter((s) => s.isAnimated());

    // Initialize arrays for up to 4 static spheres (reduced for shader complexity)
    this.uSpherePositions = [];
    this.uSphereRadii = [];
    for (let i = 0; i < 4; i++) {
      const sphere = staticSpheres[i];
      const pos = sphere?.getPosition() ?? [0.5, 0.5];
      const radius = sphere?.radius() ?? 0;
      this.uSpherePositions.push(uniform(new THREE.Vector2(pos[0], pos[1])));
      this.uSphereRadii.push(uniform(radius));
    }
    this.uSphereCount = uniform(staticSpheres.length);

    // Initialize arrays for up to 4 animated spheres (reduced for shader complexity)
    this.uOrbitRadii = [];
    this.uOrbitSpeeds = [];
    this.uOrbitPhases = [];
    for (let i = 0; i < 4; i++) {
      const sphere = animatedSpheres[i];
      const orbit = sphere?.orbit();
      this.uOrbitRadii.push(uniform(orbit?.radius ?? 0));
      this.uOrbitSpeeds.push(uniform(orbit?.speed ?? 0));
      this.uOrbitPhases.push(uniform(orbit?.phase ?? i * 1.1));
    }
    this.uAnimatedSphereCount = uniform(animatedSpheres.length);
  }

  /**
   * Apply a preset configuration
   */
  private applyPreset(presetName: MetaballPreset): void {
    const preset = this.presets[presetName];
    if (!preset || !this.uAmbientIntensity) return;

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
    this.uCursorGlowColor.value = preset.cursorGlowColor;
  }

  /**
   * Update fullscreen scale to fill camera frustum
   */
  private updateFullscreenScale(): void {
    const camera = this.sceneService?.camera();
    if (!camera || !this.mesh) return;

    const distance = this.cameraDistance() ?? camera.position.length();
    const vFov = (camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * distance;
    const planeWidth = planeHeight * camera.aspect;

    const scale = 1.1;
    this.mesh.scale.set(planeWidth * scale, planeHeight * scale, 1);
    this.mesh.position.set(0, 0, -distance + 0.01);
  }

  /**
   * Update cursor radius based on proximity to static spheres
   */
  private updateCursorRadius(): void {
    const cursorChild = this.cursorChildren()[0];
    if (!cursorChild || !this.uCursorRadius) return;

    const cursorPos = this.mouseTracker.worldPosition();
    const staticSpheres = this.sphereChildren().filter((s) => !s.isAnimated());
    const proximityDist = cursorChild.proximityDistance();

    let closestDistance = 1000;
    for (const sphere of staticSpheres) {
      const pos = sphere.getPosition();
      if (!pos) continue;
      const [wx, wy, wz] = screenToWorldJS(pos[0], pos[1]);
      const worldPos = new THREE.Vector3(wx, wy, wz);
      const dist = cursorPos.distanceTo(worldPos);
      closestDistance = Math.min(closestDistance, dist);
    }

    const proximityFactor = Math.max(0, 1.0 - closestDistance / proximityDist);
    const smoothFactor =
      proximityFactor * proximityFactor * (3.0 - 2.0 * proximityFactor);
    const minR = cursorChild.radiusMin();
    const maxR = cursorChild.radiusMax();
    this.uCursorRadius.value = minR + (maxR - minR) * smoothFactor;
  }

  /**
   * Setup window event listeners
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('resize', this.boundOnResize, { passive: true });
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('resize', this.boundOnResize);
  }

  /**
   * Handle window resize
   */
  private onWindowResize(): void {
    if (typeof window === 'undefined' || !this.uResolution) return;
    this.uResolution.value.set(window.innerWidth, window.innerHeight);
    if (this.fullscreen() && this.mesh) {
      this.updateFullscreenScale();
    }
  }

  /**
   * Create TSL material with ray marching shader
   */
  private createTSLMaterial(): MeshBasicNodeMaterial {
    const {
      Fn,
      Loop,
      float,
      vec2,
      vec3,
      vec4,
      max,
      min: _tslMin,
      dot,
      pow,
      length,
      normalize,
      smoothstep,
      clamp: _clamp,
      mix,
      exp,
      select,
      screenUV: tslScreenUV,
      screenSize: tslScreenSize,
    } = getTSLFunctions();

    const { uv } = TSL;
    const isFullscreen = this.fullscreen();

    // Create screen to world converter
    const screenToWorld = createScreenToWorldFn(this.uResolution);

    // Distance from center for proximity effect
    const getDistanceToCenter = Fn(([pos]: [TSLNode]) => {
      const center = vec2(float(0.5), float(0.5));
      const dist = length(pos.sub(center)).mul(2);
      return smoothstep(float(0), float(1), dist);
    });

    // SDF helper - wraps imported function
    const sphereSDF = (p: TSLNode, center: TSLNode, radius: TSLNode) => {
      return tslSphereSDF(p, center, radius);
    };

    // Smooth min helper
    const smin = (a: TSLNode, b: TSLNode, k: TSLNode) => {
      return tslSmin(a, b, k);
    };

    // Scene SDF - all spheres
    const sceneSDF = Fn(([pos]: [TSLNode]) => {
      const result = float(100).toVar();
      const t = this.uTime.mul(this.uAnimationSpeed);

      // Dynamic movement scale based on mouse position
      const distToCenter = getDistanceToCenter(this.uMousePosition);
      const dynamicMovementScale = select(
        this.uMouseProximityEffect.greaterThan(0.5),
        mix(this.uMinMovementScale, this.uMaxMovementScale, distToCenter),
        this.uMovementScale
      );

      // Process static spheres (up to 4 - reduced for shader complexity)
      for (let i = 0; i < 4; i++) {
        const spherePos = screenToWorld(
          this.uSpherePositions[i].x,
          this.uSpherePositions[i].y
        );
        const sphereRadius = this.uSphereRadii[i];
        const sphereDist = sphereSDF(pos, spherePos, sphereRadius);
        const shouldAdd = float(i).lessThan(this.uSphereCount);
        result.assign(
          select(shouldAdd, smin(result, sphereDist, float(0.3)), result)
        );
      }

      // Process animated spheres (up to 4 to keep shader lightweight)
      for (let i = 0; i < 4; i++) {
        const orbitRadius = this.uOrbitRadii[i].mul(dynamicMovementScale);
        const speed = this.uOrbitSpeeds[i];
        const phase = this.uOrbitPhases[i];
        const animRadius = float(0.12).add(float(i).mul(0.02));

        const offset = vec3(
          TSL.sin(t.mul(speed).add(phase)).mul(orbitRadius).mul(0.8),
          TSL.cos(t.mul(speed).mul(0.85).add(phase.mul(1.3)))
            .mul(orbitRadius)
            .mul(0.6),
          TSL.sin(t.mul(speed).mul(0.5).add(phase)).mul(0.3)
        );

        const animDist = sphereSDF(pos, offset, animRadius);
        const shouldAdd = float(i).lessThan(this.uAnimatedSphereCount);
        result.assign(
          select(shouldAdd, smin(result, animDist, float(0.05)), result)
        );
      }

      // Cursor sphere
      const cursorDist = sphereSDF(pos, this.uCursorSphere, this.uCursorRadius);
      result.assign(smin(result, cursorDist, this.uSmoothness));

      return result;
    });

    // Create lighting functions
    const calcNormal = createCalcNormalFn(sceneSDF);
    const ambientOcclusion = createAmbientOcclusionFn(sceneSDF);
    const softShadow = createSoftShadowFn();
    const calculateCursorGlow = createCursorGlowFn(
      this.uCursorSphere,
      this.uCursorGlowRadius,
      this.uCursorGlowIntensity
    );

    // Main ray marching function
    const rayMarch = Fn(() => {
      const uvSource = isFullscreen ? tslScreenUV : uv();
      const screenCoords = uvSource.sub(vec2(float(0.5), float(0.5)));
      const aspect = isFullscreen
        ? tslScreenSize.x.div(tslScreenSize.y)
        : this.uResolution.x.div(this.uResolution.y);

      const adjustedUV = vec2(screenCoords.x.mul(aspect), screenCoords.y);
      const rayOrigin = vec3(
        adjustedUV.x.mul(2),
        adjustedUV.y.mul(2),
        float(-1)
      );
      const rayDir = vec3(float(0), float(0), float(1));

      const totalDist = float(0).toVar();
      const hitPoint = vec3(float(0), float(0), float(0)).toVar();
      const hit = float(0).toVar();

      Loop(16, () => {
        const p = rayOrigin.add(rayDir.mul(totalDist));
        hitPoint.assign(p);
        const dist = sceneSDF(p);
        const isHit = dist.lessThan(0.001);
        const tooFar = totalDist.greaterThan(5);
        hit.assign(select(isHit, float(1), hit));
        totalDist.addAssign(select(isHit.or(tooFar), float(0), dist.mul(0.9)));
      });

      // Lighting
      const normal = calcNormal(hitPoint);
      const viewDir = rayDir.negate();
      const lightDir = normalize(this.uLightPosition);
      const ao = ambientOcclusion(hitPoint, normal);
      const diff = max(dot(normal, lightDir), float(0));
      const shadow = softShadow(
        hitPoint,
        lightDir,
        float(0.01),
        float(10),
        float(20)
      );

      const halfDir = normalize(lightDir.add(viewDir));
      const spec = pow(
        max(dot(normal, halfDir), float(0)),
        this.uSpecularPower
      );
      const fresnel = pow(
        float(1).sub(max(dot(viewDir, normal), float(0))),
        this.uFresnelPower
      );

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

      const distToCursor = length(hitPoint.sub(this.uCursorSphere));
      const highlight = float(1).sub(
        smoothstep(float(0), this.uCursorRadius.add(0.4), distToCursor)
      );
      const cursorHighlight = this.uLightColor.mul(highlight).mul(0.2);

      let color = this.uSphereColor
        .add(ambient)
        .add(diffuse)
        .add(specular)
        .add(fresnelRim)
        .add(cursorHighlight);
      color = color.mul(ao);
      color = pow(color, vec3(this.uContrast.mul(0.9)));
      color = color.div(color.add(vec3(0.8)));

      const fogAmount = float(1).sub(
        exp(totalDist.negate().mul(this.uFogDensity))
      );
      color = mix(color, this.uBackgroundColor, fogAmount.mul(0.3));

      const cursorGlow = calculateCursorGlow(rayOrigin);
      const glowContribution = this.uCursorGlowColor.mul(cursorGlow);

      const finalColor = select(
        hit.greaterThan(0.5),
        color.add(glowContribution.mul(0.3)),
        glowContribution
      );

      const finalAlpha = select(
        hit.greaterThan(0.5),
        float(1),
        cursorGlow.mul(0.8)
      );

      return vec4(finalColor, finalAlpha);
    });

    const material = new MeshBasicNodeMaterial();
    material.colorNode = rayMarch();
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
  }
}
