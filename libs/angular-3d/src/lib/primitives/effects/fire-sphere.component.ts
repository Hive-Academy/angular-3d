import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop';
import {
  createVolumetricFireNode,
  createVolumetricFireUniforms,
  type VolumetricFireUniforms,
} from '../shaders/tsl-volumetric-fire';
import { createOptimizedFireNode } from '../shaders/tsl-fire-texture';

/**
 * Render quality mode for fire effect
 * - 'fast': Texture-based shader (~10-20x faster, good for most uses)
 * - 'quality': Volumetric ray-marching (expensive but more realistic flames)
 */
export type FireQuality = 'fast' | 'quality';

/**
 * FireSphereComponent - Optimized Sun/Fire Sphere
 *
 * Single-mesh fire/sun effect with two rendering modes:
 * - **fast** (default): Texture-based shader, 60fps friendly
 * - **quality**: Volumetric ray-marching for realistic flames
 *
 * @example Fast mode (default, performant):
 * <a3d-fire-sphere
 *   [radius]="6"
 *   [sunMode]="true"
 *   [fireSpeed]="0.3"
 * />
 *
 * @example Quality mode (expensive but detailed):
 * <a3d-fire-sphere
 *   [radius]="6"
 *   [quality]="'quality'"
 *   [sunMode]="true"
 *   [iterations]="15"
 * />
 */
@Component({
  selector: 'a3d-fire-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class FireSphereComponent {
  // ========================================================================
  // Sphere Configuration Inputs
  // ========================================================================

  /** Sphere radius (default: 4.5) */
  public readonly radius = input<number>(4.5);

  /** Sphere position [x, y, z] */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Sphere scale multiplier */
  public readonly scale = input<number>(1.0);

  // ========================================================================
  // Quality & Mode Selection
  // ========================================================================

  /**
   * Render quality mode:
   * - 'fast' (default): Texture-based, 60fps friendly
   * - 'quality': Volumetric ray-marching, more realistic but expensive
   */
  public readonly quality = input<FireQuality>('fast');

  /**
   * Sun mode: true = realistic sun colors (white→yellow→orange→red)
   * Fire mode: false = uses fireColor for tinting
   */
  public readonly sunMode = input<boolean>(true);

  // ========================================================================
  // Fire Configuration (works for both modes)
  // ========================================================================

  /** Fire color - only used when sunMode=false (default: orange) */
  public readonly fireColor = input<string>('#ff6600');

  /** Fire animation speed (default: 0.3) */
  public readonly fireSpeed = input<number>(0.3);

  // ========================================================================
  // Fast Mode Configuration (texture-based)
  // ========================================================================

  /** UV distortion amount for texture mode (default: 0.5) */
  public readonly distortion = input<number>(0.5);

  /** Texture scale for fast mode (default: 2.0) */
  public readonly textureScale = input<number>(2.0);

  // ========================================================================
  // Quality Mode Configuration (volumetric)
  // ========================================================================

  /**
   * Inner radius for hollow fire shell effect - volumetric only (default: 0)
   * When > 0, creates a hollow fire shell that can surround other objects.
   * The fire fades smoothly from innerRadius outward.
   * Example: radius=6, innerRadius=4 creates a fire shell 2 units thick.
   */
  public readonly innerRadius = input<number>(0);

  /** Fire turbulence magnitude - volumetric only (default: 0.4) */
  public readonly fireMagnitude = input<number>(0.4);

  /** Fire noise scale - volumetric only (default: 0.8) */
  public readonly fireNoiseScale = input<number>(0.8);

  /** Ray march iterations - volumetric only, lower = faster (default: 15) */
  public readonly iterations = input<number>(15);

  /** Lacunarity - volumetric only, lower = larger/more separated flames (default: 1.8) */
  public readonly lacunarity = input<number>(1.8);

  /**
   * Density falloff - volumetric only (default: 1.0)
   * 1.0 = uniform density, >1.0 = denser at inner edge
   */
  public readonly densityFalloff = input<number>(1.0);

  // ========================================================================
  // Scene Integration
  // ========================================================================

  /**
   * Enable scene fog support for this material.
   * When true, the material will be affected by scene.fog.
   * Default: false (fire effects typically don't use fog)
   */
  public readonly fog = input<boolean>(false);

  /**
   * Render order for controlling draw order with other transparent objects.
   * Lower values render first (behind), higher values render last (in front).
   * Default: 0
   */
  public readonly renderOrder = input<number>(0);

  // ========================================================================
  // Internal State
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  private sphereMesh: THREE.Mesh | null = null;
  private sphereGeometry: THREE.SphereGeometry | null = null;
  private sphereMaterial: THREE.MeshBasicNodeMaterial | null = null;
  private volumetricFireUniforms: VolumetricFireUniforms | null = null;
  private fireUpdateCleanup: (() => void) | null = null;

  // ========================================================================
  // Component Initialization
  // ========================================================================

  public constructor() {
    effect(() => {
      const parent = this.parent();
      if (parent && !this.sphereMesh) {
        this.createFireSphere();

        // Only need update callback for volumetric mode
        if (this.quality() === 'quality') {
          this.setupFireUpdates();
        }

        parent.add(this.sphereMesh!);
      }
    });

    effect(() => {
      const [x, y, z] = this.position();
      if (this.sphereMesh) this.sphereMesh.position.set(x, y, z);
    });

    effect(() => {
      const s = this.scale();
      if (this.sphereMesh) this.sphereMesh.scale.setScalar(s);
    });

    // Effect: Update fire color when it changes (quality mode only)
    effect(() => {
      const color = this.fireColor();
      if (this.volumetricFireUniforms) {
        this.volumetricFireUniforms.color.value.set(color);
      }
    });

    // Effect: Update render order when it changes
    effect(() => {
      const order = this.renderOrder();
      if (this.sphereMesh) {
        this.sphereMesh.renderOrder = order;
      }
    });

    this.destroyRef.onDestroy(() => this.dispose());
  }

  // ========================================================================
  // Fire Sphere Creation
  // ========================================================================

  private createFireSphere(): void {
    const radius = this.radius();
    const qualityMode = this.quality();
    const isSunMode = this.sunMode();

    // Geometry size depends on mode
    // Quality mode uses 1.5x for corona/flame extension (ray marching with large flames)
    // Fast mode uses exact radius (texture-based)
    const extendedRadius = qualityMode === 'quality' ? radius * 1.5 : radius;
    const segments = qualityMode === 'quality' ? 32 : 64;

    this.sphereGeometry = new THREE.SphereGeometry(
      extendedRadius,
      segments,
      segments
    );

    // Create material based on quality mode
    this.sphereMaterial = new THREE.MeshBasicNodeMaterial();

    if (qualityMode === 'fast') {
      // Fast mode: 3D position-based shader with flame tendrils
      const fireNode = createOptimizedFireNode(
        this.fireSpeed(),
        this.distortion(),
        this.textureScale(),
        isSunMode
      );
      this.sphereMaterial.colorNode = fireNode;
    } else {
      // Quality mode: volumetric ray-marching
      const noiseScale = this.fireNoiseScale();
      const speed = this.fireSpeed();

      this.volumetricFireUniforms = createVolumetricFireUniforms({
        color: new THREE.Color(this.fireColor()),
        sphereRadius: radius,
        innerRadius: this.innerRadius(),
        noiseScale: [noiseScale, noiseScale, noiseScale, speed],
        magnitude: this.fireMagnitude(),
        lacunarity: this.lacunarity(),
        gain: 0.5,
        densityFalloff: this.densityFalloff(),
      });

      const volumetricNode = createVolumetricFireNode(
        this.volumetricFireUniforms,
        this.iterations(),
        isSunMode
      );
      this.sphereMaterial.fragmentNode = volumetricNode;
    }

    // Common material settings
    this.sphereMaterial.transparent = true;
    this.sphereMaterial.depthWrite = false;
    this.sphereMaterial.blending = THREE.AdditiveBlending;
    this.sphereMaterial.side =
      qualityMode === 'quality' ? THREE.DoubleSide : THREE.FrontSide;
    this.sphereMaterial.fog = this.fog(); // Controlled by parent input

    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphereMesh.renderOrder = this.renderOrder();
  }

  private setupFireUpdates(): void {
    if (!this.volumetricFireUniforms) return;

    this.fireUpdateCleanup = this.renderLoop.registerUpdateCallback(() => {
      if (this.sphereMesh && this.volumetricFireUniforms) {
        this.sphereMesh.updateMatrixWorld();
        this.volumetricFireUniforms.invModelMatrix.value
          .copy(this.sphereMesh.matrixWorld)
          .invert();
        this.volumetricFireUniforms.scale.value.copy(this.sphereMesh.scale);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.fireUpdateCleanup) {
        this.fireUpdateCleanup();
        this.fireUpdateCleanup = null;
      }
    });
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  private dispose(): void {
    const parent = this.parent();

    if (this.fireUpdateCleanup) {
      this.fireUpdateCleanup();
      this.fireUpdateCleanup = null;
    }

    if (parent && this.sphereMesh) {
      parent.remove(this.sphereMesh);
    }

    try {
      this.sphereGeometry?.dispose();
      this.sphereMaterial?.dispose();
    } catch (e) {
      console.warn('FireSphere: dispose warning', e);
    }

    this.sphereMesh = null;
    this.sphereGeometry = null;
    this.sphereMaterial = null;
    this.volumetricFireUniforms = null;
  }
}
