/**
 * GroundFogComponent - Atmospheric Ground Fog Effect
 *
 * Creates realistic ground-hugging fog volumes using TSL shaders.
 * Place these anywhere in your scene to add atmospheric depth.
 *
 * Features:
 * - Soft edges with smooth falloff (no hard boundaries)
 * - Procedural noise for organic variation
 * - Optional drift animation
 * - Proper depth handling (obscures objects behind it)
 * - Configurable density, color, and size
 *
 * @example
 * ```html
 * <!-- Basic ground fog -->
 * <a3d-ground-fog
 *   [position]="[0, -5, 0]"
 *   [width]="100"
 *   [depth]="100"
 *   [height]="8"
 *   [color]="0x0a0e11"
 *   [opacity]="0.4"
 * />
 *
 * <!-- Animated drifting fog -->
 * <a3d-ground-fog
 *   [position]="[0, 0, -20]"
 *   [enableDrift]="true"
 *   [driftSpeed]="0.3"
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
import * as THREE from 'three/webgpu';
import {
  abs,
  float,
  mix,
  mul,
  positionLocal,
  pow,
  smoothstep,
  sub,
  uniform,
  vec3,
} from 'three/tsl';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { nativeFBMVec3 } from '../shaders/tsl-utilities';

@Component({
  selector: 'a3d-ground-fog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class GroundFogComponent {
  // ========================================================================
  // Position & Size Inputs
  // ========================================================================

  /** Position of the fog volume center [x, y, z] */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Width of the fog volume (X axis) */
  public readonly width = input<number>(50);

  /** Depth of the fog volume (Z axis) */
  public readonly depth = input<number>(50);

  /** Height of the fog volume (Y axis) */
  public readonly height = input<number>(5);

  // ========================================================================
  // Visual Configuration
  // ========================================================================

  /** Fog color (hex number or CSS color) */
  public readonly color = input<number | string>(0x1a1a2e);

  /** Overall fog opacity (0-1) */
  public readonly opacity = input<number>(0.4);

  /** Fog density - affects how thick/opaque the fog appears (0.5-3.0) */
  public readonly density = input<number>(1.0);

  /** Noise scale - larger values = smaller, more detailed fog patterns */
  public readonly noiseScale = input<number>(0.02);

  /** Edge softness - how gradual the fog fades at boundaries (0.1-0.5) */
  public readonly edgeSoftness = input<number>(0.3);

  // ========================================================================
  // Animation Configuration
  // ========================================================================

  /** Enable slow drifting animation */
  public readonly enableDrift = input<boolean>(false);

  /** Drift speed multiplier */
  public readonly driftSpeed = input<number>(0.5);

  /** Drift direction as normalized vector [x, y, z] */
  public readonly driftDirection = input<[number, number, number]>([1, 0, 0.3]);

  // ========================================================================
  // Scene Integration
  // ========================================================================

  /**
   * Enable scene fog support for this material.
   * When true, the material will be affected by scene.fog.
   * Default: false
   */
  public readonly fog = input<boolean>(false);

  // ========================================================================
  // Internal State
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  private fogMesh: THREE.Mesh | null = null;
  private fogGeometry: THREE.BoxGeometry | null = null;
  private fogMaterial: THREE.MeshBasicNodeMaterial | null = null;
  private timeUniform = uniform(float(0));
  private driftCleanup: (() => void) | null = null;

  // ========================================================================
  // Component Initialization
  // ========================================================================

  public constructor() {
    // Create fog when parent is available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.fogMesh) {
        this.createFog();
        parent.add(this.fogMesh!);
      }
    });

    // Update position reactively
    effect(() => {
      const pos = this.position();
      if (this.fogMesh) {
        this.fogMesh.position.set(pos[0], pos[1], pos[2]);
      }
    });

    // Update size reactively
    effect(() => {
      const w = this.width();
      const h = this.height();
      const d = this.depth();
      if (this.fogMesh) {
        this.fogMesh.scale.set(w, h, d);
      }
    });

    // Handle drift animation
    effect(() => {
      const enableDrift = this.enableDrift();
      const speed = this.driftSpeed();

      // Cleanup previous
      if (this.driftCleanup) {
        this.driftCleanup();
        this.driftCleanup = null;
      }

      if (enableDrift) {
        this.driftCleanup = this.renderLoop.registerUpdateCallback((delta) => {
          this.timeUniform.value += delta * speed;
        });
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.driftCleanup) {
        this.driftCleanup();
      }

      const parent = this.parent();
      if (parent && this.fogMesh) {
        parent.remove(this.fogMesh);
      }

      this.fogGeometry?.dispose();
      this.fogMaterial?.dispose();
    });
  }

  // ========================================================================
  // Fog Creation
  // ========================================================================

  private createFog(): void {
    // Use unit box, scale with inputs
    this.fogGeometry = new THREE.BoxGeometry(1, 1, 1);

    // Create TSL fog material
    this.fogMaterial = this.createFogMaterial();

    this.fogMesh = new THREE.Mesh(this.fogGeometry, this.fogMaterial);

    // Set initial transform
    const pos = this.position();
    this.fogMesh.position.set(pos[0], pos[1], pos[2]);
    this.fogMesh.scale.set(this.width(), this.height(), this.depth());

    // Render order for proper transparency
    this.fogMesh.renderOrder = 998;
  }

  private createFogMaterial(): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial();

    // Get config values
    const colorValue = this.color();
    const opacityValue = this.opacity();
    const densityValue = this.density();
    const noiseScaleValue = this.noiseScale();
    const edgeSoftnessValue = this.edgeSoftness();
    const driftDir = this.driftDirection();

    // Parse color
    const fogColor = new THREE.Color(colorValue);
    const uColor = uniform(vec3(fogColor.r, fogColor.g, fogColor.b));
    const uOpacity = uniform(float(opacityValue));
    const uDensity = uniform(float(densityValue));
    const uNoiseScale = uniform(float(noiseScaleValue));
    const uEdgeSoftness = uniform(float(edgeSoftnessValue));
    const uDriftDir = uniform(vec3(driftDir[0], driftDir[1], driftDir[2]));

    // Local position in unit box (-0.5 to 0.5)
    const localPos = positionLocal;

    // Add time-based drift offset to noise sampling
    const driftOffset = mul(uDriftDir, this.timeUniform);
    const noisePos = mul(localPos.add(driftOffset), uNoiseScale);

    // Sample FBM noise for organic fog density variation
    const noise = nativeFBMVec3(
      noisePos.mul(float(50)), // Scale up for visible variation
      float(4), // octaves
      float(2.0), // lacunarity
      float(0.5) // gain
    );

    // Normalize noise to 0-1 range
    const noiseValue = mul(noise.x.add(float(1)), float(0.5));

    // Calculate edge falloff - soft fade at all boundaries
    // X edges
    const xFade = mul(
      smoothstep(float(0), uEdgeSoftness, localPos.x.add(float(0.5))),
      smoothstep(float(0), uEdgeSoftness, sub(float(0.5), localPos.x))
    );

    // Y edges (vertical - important for ground fog look)
    // Stronger falloff at top, denser at bottom
    const yNormalized = localPos.y.add(float(0.5)); // 0 at bottom, 1 at top
    const yFade = pow(sub(float(1), yNormalized), float(1.5)); // Denser at bottom

    // Z edges
    const zFade = mul(
      smoothstep(float(0), uEdgeSoftness, localPos.z.add(float(0.5))),
      smoothstep(float(0), uEdgeSoftness, sub(float(0.5), localPos.z))
    );

    // Combine all edge falloffs
    const edgeFalloff = mul(mul(xFade, yFade), zFade);

    // Add wispy variation using turbulence (absolute noise)
    const turbulencePos = mul(
      localPos.add(driftOffset),
      uNoiseScale.mul(float(2))
    );
    const turbulence = abs(
      nativeFBMVec3(
        turbulencePos.mul(float(80)),
        float(3),
        float(2.0),
        float(0.5)
      )
    );
    const wispyFactor = mul(turbulence.x, float(0.3)).add(float(0.7));

    // Final density calculation
    const baseDensity = mul(mul(noiseValue, edgeFalloff), wispyFactor);
    const finalDensity = mul(baseDensity, uDensity);

    // Final alpha with opacity control
    const alpha = mul(finalDensity, uOpacity).clamp(0, 1);

    // Slight color variation based on density (lighter in denser areas)
    const colorVariation = mix(
      uColor,
      uColor.mul(float(1.2)),
      finalDensity.mul(float(0.3))
    );

    // Assign to material
    material.colorNode = colorVariation;
    material.opacityNode = alpha;

    // Material properties for fog-like appearance
    material.transparent = true;
    material.depthWrite = false;
    material.depthTest = true;
    material.side = THREE.DoubleSide;
    material.blending = THREE.NormalBlending; // Normal blending for obscuring effect
    material.fog = this.fog();

    return material;
  }
}
