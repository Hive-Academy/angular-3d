/**
 * GlassShellComponent - Realistic Glass Bubble Shell
 *
 * Creates a realistic glass sphere with refraction, reflection, and fresnel effects
 * that can wrap around other 3D objects to create an "air bubble glass" enclosure.
 *
 * Uses MeshPhysicalNodeMaterial with transmission for true glass-like appearance:
 * - Refraction (IOR) distorts objects visible through the glass
 * - High reflectivity on edges via fresnel
 * - Transmission allows light through with realistic absorption
 *
 * @example
 * ```html
 * <!-- Wrap around a fire sphere -->
 * <a3d-fire-sphere [radius]="4" [position]="[0, 0, 0]" />
 * <a3d-glass-shell
 *   [radius]="4.5"
 *   [position]="[0, 0, 0]"
 *   [ior]="1.5"
 *   [thickness]="0.5"
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

import { NG_3D_PARENT } from '../../types/tokens';
import { tslGlossyFresnel } from '../shaders/tsl-marble';

// TSL imports for shader nodes
import * as TSL from 'three/tsl';
const { vec3, float } = TSL;

@Component({
  selector: 'a3d-glass-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class GlassShellComponent {
  // ============================================================================
  // Geometry Inputs
  // ============================================================================

  /** Sphere radius (default: 1.0) */
  public readonly radius = input<number>(1.0);

  /** Geometry segments for smooth curvature (default: 64) */
  public readonly segments = input<number>(64);

  /** World position as [x, y, z] tuple */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Scale multiplier */
  public readonly scale = input<number>(1.0);

  // ============================================================================
  // Glass Material Inputs
  // ============================================================================

  /** Glass roughness (0 = mirror, 1 = frosted, default: 0.05) */
  public readonly roughness = input<number>(0.05);

  /** Glass metalness (default: 0.0 for dielectric glass) */
  public readonly metalness = input<number>(0.0);

  /**
   * Index of Refraction (IOR) - controls how much light bends through glass.
   * - 1.0 = no refraction (like air)
   * - 1.5 = typical glass
   * - 2.4 = diamond
   * Default: 1.5
   */
  public readonly ior = input<number>(1.5);

  /**
   * Glass transmission (0 = opaque, 1 = fully transparent).
   * Higher values let more light through.
   * Default: 0.95
   */
  public readonly transmission = input<number>(0.95);

  /**
   * Glass thickness for absorption calculations.
   * Affects how much light is absorbed passing through.
   * Default: 0.5
   */
  public readonly thickness = input<number>(0.5);

  /**
   * Glass color tint when light passes through.
   * Default: white (no tint)
   */
  public readonly color = input<string | number>('#ffffff');

  /**
   * Specular intensity for reflections.
   * Default: 1.0
   */
  public readonly specularIntensity = input<number>(1.0);

  // ============================================================================
  // Edge Glow Inputs (Fresnel rim lighting)
  // ============================================================================

  /** Enable fresnel edge glow (default: true) */
  public readonly enableEdgeGlow = input<boolean>(true);

  /** Edge glow/fresnel color (default: '#88ccff' light blue) */
  public readonly edgeColor = input<string | number>('#88ccff');

  /** Edge glow intensity (default: 0.3) */
  public readonly edgeIntensity = input<number>(0.3);

  /** Edge glow fresnel power (2-5, default: 3.0) */
  public readonly edgePower = input<number>(3.0);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  /** Internal mesh */
  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshPhysicalNodeMaterial | null = null;
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
      const s = this.scale();
      if (this.mesh) {
        this.mesh.scale.setScalar(s);
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
   * Create the glass shell mesh with physical glass material
   */
  private createMesh(): void {
    // Create geometry
    const radius = this.radius();
    const segments = this.segments();
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Create physical glass material with transmission
    this.material = new THREE.MeshPhysicalNodeMaterial({
      // Surface properties
      metalness: this.metalness(),
      roughness: this.roughness(),

      // Glass transmission properties
      transmission: this.transmission(),
      ior: this.ior(),
      thickness: this.thickness(),

      // Reflections
      specularIntensity: this.specularIntensity(),

      // Color
      color: new THREE.Color(this.color()),

      // Rendering
      transparent: true,
      side: THREE.FrontSide,
      depthWrite: false,
    });

    // Add fresnel edge glow if enabled
    if (this.enableEdgeGlow()) {
      const edgeColorVal = new THREE.Color(this.edgeColor());
      const edgeColorNode = vec3(
        edgeColorVal.r,
        edgeColorVal.g,
        edgeColorVal.b
      );

      const emissiveNode = tslGlossyFresnel(
        float(this.edgePower()),
        float(this.edgeIntensity()),
        edgeColorNode
      );
      this.material.emissiveNode = emissiveNode;
    }

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set position
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    // Set scale
    this.mesh.scale.setScalar(this.scale());

    // Render after opaque objects
    this.mesh.renderOrder = 10;
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
  }
}
