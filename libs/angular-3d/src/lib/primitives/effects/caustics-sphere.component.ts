/**
 * CausticsSphereComponent - Animated Caustics Sphere
 *
 * Creates a sphere with animated underwater caustic light patterns.
 * Uses uniforms for reactive color updates.
 *
 * @example
 * ```html
 * <a3d-caustics-sphere
 *   [radius]="2"
 *   [position]="[0, 0, 0]"
 *   [color]="'#88ddff'"
 *   [background]="'#002244'"
 *   [scale]="2"
 *   [speed]="1"
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
import * as TSL from 'three/tsl';
import { mx_worley_noise_float, mx_worley_noise_vec3, time } from 'three/tsl';

import { NG_3D_PARENT } from '../../types/tokens';

const { float, vec3, mix, positionGeometry, exp, uniform } = TSL;

/**
 * Uniforms interface for reactive caustics colors
 */
export interface CausticsUniforms {
  color: { value: THREE.Vector3 };
  background: { value: THREE.Vector3 };
}

@Component({
  selector: 'a3d-caustics-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class CausticsSphereComponent {
  // ============================================================================
  // Geometry Inputs
  // ============================================================================

  /** Sphere radius (default: 1) */
  public readonly radius = input<number>(1);

  /** Geometry segments for smooth curvature (default: 32) */
  public readonly segments = input<number>(32);

  /** World position as [x, y, z] tuple */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Scale multiplier */
  public readonly sphereScale = input<number>(1);

  // ============================================================================
  // Caustics Inputs
  // ============================================================================

  /** Bright caustic color (light areas) */
  public readonly color = input<string | number>('#88ddff');

  /** Dark background color (shadow areas) */
  public readonly background = input<string | number>('#002244');

  /** Pattern scale (1-5 typical, default: 2) */
  public readonly causticsScale = input<number>(2);

  /** Animation speed (0 = static, 1 = normal, 2 = fast, default: 1) */
  public readonly speed = input<number>(1);

  /** Contrast/intensity of caustics (0.5-2 typical, default: 1.5) */
  public readonly intensity = input<number>(1.5);

  // ============================================================================
  // Material Inputs
  // ============================================================================

  /** Material roughness (default: 0.1 for glossy) */
  public readonly roughness = input<number>(0.1);

  /** Material metalness (default: 0) */
  public readonly metalness = input<number>(0);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  public mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardNodeMaterial | null = null;
  private causticsUniforms: CausticsUniforms | null = null;
  private isAddedToScene = false;

  public constructor() {
    // Effect: Create mesh and add to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMesh();
        if (this.mesh) {
          parent.add(this.mesh);
          this.isAddedToScene = true;
        }
      }
    });

    // Effect: Update position when it changes
    effect(() => {
      const [x, y, z] = this.position();
      if (this.mesh) {
        this.mesh.position.set(x, y, z);
      }
    });

    // Effect: Update scale when it changes
    effect(() => {
      const scale = this.sphereScale();
      if (this.mesh) {
        this.mesh.scale.setScalar(scale);
      }
    });

    // Effect: Update color when it changes
    effect(() => {
      const colorInput = this.color();
      if (this.causticsUniforms) {
        const color = new THREE.Color(colorInput);
        this.causticsUniforms.color.value.set(color.r, color.g, color.b);
      }
    });

    // Effect: Update background when it changes
    effect(() => {
      const bgInput = this.background();
      if (this.causticsUniforms) {
        const bg = new THREE.Color(bgInput);
        this.causticsUniforms.background.value.set(bg.r, bg.g, bg.b);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      const parent = this.parent();
      if (parent && this.mesh && this.isAddedToScene) {
        parent.remove(this.mesh);
      }
      this.disposeMesh();
      this.isAddedToScene = false;
    });
  }

  /**
   * Create the caustics sphere mesh with TSL material
   */
  private createMesh(): void {
    // Create geometry
    const radius = this.radius();
    const segments = this.segments();
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Create uniforms for reactive color updates
    const colorVal = new THREE.Color(this.color());
    const bgVal = new THREE.Color(this.background());

    this.causticsUniforms = {
      color: { value: new THREE.Vector3(colorVal.r, colorVal.g, colorVal.b) },
      background: { value: new THREE.Vector3(bgVal.r, bgVal.g, bgVal.b) },
    };

    // Create uniform nodes
    const colorNode = uniform(this.causticsUniforms.color.value);
    const backgroundNode = uniform(this.causticsUniforms.background.value);

    // Create caustics shader inline with uniforms
    const scale = this.causticsScale();
    const speed = this.speed();
    const intensity = this.intensity();

    const causticsNode = this.createCausticsNode(
      colorNode,
      backgroundNode,
      scale,
      speed,
      intensity
    );

    // Create MeshStandardNodeMaterial with caustics
    this.material = new THREE.MeshStandardNodeMaterial({
      metalness: this.metalness(),
      roughness: this.roughness(),
    });
    this.material.colorNode = causticsNode;

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set position
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    // Set scale
    this.mesh.scale.setScalar(this.sphereScale());
  }

  /**
   * Create caustics TSL node with uniform support
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private createCausticsNode(
    colorNode: ReturnType<typeof uniform>,
    backgroundNode: ReturnType<typeof uniform>,
    scale: number,
    speed: number,
    intensity: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): any {
    // Position scaled by exponential
    const pos = positionGeometry.mul(exp(float(scale - 1))).toVar();

    // Time-based animation using TSL time uniform
    const t = time
      .mul(exp(float(speed - 1)))
      .add(vec3(0, (2 * Math.PI) / 3, (4 * Math.PI) / 3))
      .sin();

    // Worley noise displacement
    const worleyDisplacement = vec3(
      mx_worley_noise_float(pos.add(t.xyz)),
      mx_worley_noise_float(pos.add(t.yzx)),
      mx_worley_noise_float(pos.add(t.zxy))
    );

    // Final worley noise with displacement
    const noiseResult = mx_worley_noise_vec3(pos.add(worleyDisplacement));

    // Normalize to 0-1 range and apply intensity for contrast
    const k = noiseResult
      .length()
      .div(Math.sqrt(3))
      .mul(float(intensity))
      .clamp(0, 1);

    // Blend between background and color using mix with uniform nodes
    return mix(backgroundNode, colorNode, k);
  }

  /**
   * Dispose Three.js resources
   */
  private disposeMesh(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.mesh = null;
    this.causticsUniforms = null;
  }
}
