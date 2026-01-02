/**
 * MarbleSphereComponent - Animated Volumetric Marble Sphere
 *
 * Creates a glossy sphere with animated volumetric interior using TSL raymarching.
 * Based on the Codrops "Magical Marbles" technique.
 *
 * Features:
 * - Raymarched fake volume inside sphere
 * - Configurable interior colors (gradient from dark to bright)
 * - Glossy fresnel edge glow
 * - Environment map reflections (uses scene.environment)
 * - Signal-based reactive inputs
 *
 * @example
 * ```html
 * <a3d-marble-sphere
 *   [radius]="0.2"
 *   [position]="[0, 0.25, 0]"
 *   [colorA]="'#001a13'"
 *   [colorB]="'#66e5b3'"
 *   [edgeColor]="'#4cd9a8'"
 *   [animationSpeed]="0.3"
 *   [iterations]="16"
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

import { OBJECT_ID } from '../tokens/object-id.token';
import { NG_3D_PARENT } from '../types/tokens';
import {
  createMarbleMaterial,
  type MarbleMaterialConfig,
} from './shaders/tsl-marble';

@Component({
  selector: 'a3d-marble-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `marble-sphere-${crypto.randomUUID()}`,
    },
  ],
})
export class MarbleSphereComponent {
  // ============================================================================
  // Geometry Inputs
  // ============================================================================

  /** Sphere radius (default: 0.2) */
  public readonly radius = input<number>(0.2);

  /** Geometry segments for smooth curvature (default: 64) */
  public readonly segments = input<number>(64);

  /** World position as [x, y, z] tuple */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  // ============================================================================
  // Material Inputs
  // ============================================================================

  /** Outer shell roughness (0 = mirror, 1 = matte, default: 0.1 for glossy) */
  public readonly roughness = input<number>(0.1);

  /** Outer shell metalness (default: 0.0) */
  public readonly metalness = input<number>(0.0);

  // ============================================================================
  // Interior Color Inputs
  // ============================================================================

  /** Dark interior color (default: '#001a13' dark emerald) */
  public readonly colorA = input<string | number>('#001a13');

  /** Bright interior color (default: '#66e5b3' bright teal-green) */
  public readonly colorB = input<string | number>('#66e5b3');

  // ============================================================================
  // Edge Glow Inputs
  // ============================================================================

  /** Edge glow/fresnel color (default: '#4cd9a8' teal) */
  public readonly edgeColor = input<string | number>('#4cd9a8');

  /** Edge glow intensity (default: 0.6) */
  public readonly edgeIntensity = input<number>(0.6);

  /** Edge glow fresnel power (2-5, default: 3.0) */
  public readonly edgePower = input<number>(3.0);

  // ============================================================================
  // Animation Inputs
  // ============================================================================

  /** Interior animation speed multiplier (default: 0.3) */
  public readonly animationSpeed = input<number>(0.3);

  // ============================================================================
  // Quality Inputs
  // ============================================================================

  /** Ray march iterations (8=mobile, 16=default, 32=high) */
  public readonly iterations = input<number>(16);

  /** Ray march depth into sphere (0.5-1.0, default: 0.8) */
  public readonly depth = input<number>(0.8);

  // ============================================================================
  // Shadow Inputs
  // ============================================================================

  /** Whether mesh casts shadows (default: true) */
  public readonly castShadow = input<boolean>(true);

  /** Whether mesh receives shadows (default: true) */
  public readonly receiveShadow = input<boolean>(true);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardNodeMaterial | null = null;
  private isAddedToScene = false;

  constructor() {
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

    // Effect: Update shadow settings when they change
    effect(() => {
      const castShadow = this.castShadow();
      const receiveShadow = this.receiveShadow();
      if (this.mesh) {
        this.mesh.castShadow = castShadow;
        this.mesh.receiveShadow = receiveShadow;
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
   * Create the marble sphere mesh with TSL material
   */
  private createMesh(): void {
    // Create geometry
    const radius = this.radius();
    const segments = this.segments();
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Create material config from inputs
    const config: MarbleMaterialConfig = {
      colorA: this.colorA(),
      colorB: this.colorB(),
      edgeColor: this.edgeColor(),
      iterations: this.iterations(),
      depth: this.depth(),
      timeScale: this.animationSpeed(),
      edgePower: this.edgePower(),
      edgeIntensity: this.edgeIntensity(),
    };

    // Create marble material nodes
    const marble = createMarbleMaterial(config);

    // Create MeshStandardNodeMaterial with TSL nodes
    this.material = new THREE.MeshStandardNodeMaterial({
      metalness: this.metalness(),
      roughness: this.roughness(),
    });
    this.material.colorNode = marble.colorNode;
    this.material.emissiveNode = marble.emissiveNode;

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set position
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    // Set shadow properties
    this.mesh.castShadow = this.castShadow();
    this.mesh.receiveShadow = this.receiveShadow();
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
