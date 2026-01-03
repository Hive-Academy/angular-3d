/**
 * GlassSphereComponent - Glossy Glass Sphere with TSL Fresnel Glow
 *
 * Creates a semi-transparent glass sphere with edge fresnel glow.
 * Uses MeshStandardNodeMaterial with TSL nodes for the effect.
 * Relies on scene.environment for reflections.
 *
 * Features:
 * - Configurable coral/glass color with transparency
 * - TSL fresnel edge glow (brighter at rim angles)
 * - Glossy surface (low roughness for reflections)
 * - Signal-based reactive inputs
 * - Reactive scale input for scroll animations
 *
 * @example
 * ```html
 * <a3d-glass-sphere
 *   [radius]="4.5"
 *   [position]="[0, 0, 0]"
 *   [scale]="1"
 *   [color]="'#ffc0a0'"
 *   [opacity]="0.95"
 *   [edgeGlowColor]="'#ff9070'"
 *   [edgeGlowIntensity]="0.4"
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
  Fn,
  abs,
  cameraPosition,
  dot,
  float,
  normalWorld,
  normalize,
  positionWorld,
  pow,
  vec3,
} from 'three/tsl';

import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';

@Component({
  selector: 'a3d-glass-sphere',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `glass-sphere-${crypto.randomUUID()}`,
    },
  ],
})
export class GlassSphereComponent {
  // ============================================================================
  // Geometry Inputs
  // ============================================================================

  /** Sphere radius (default: 4.5 for hero prominence) */
  public readonly radius = input<number>(4.5);

  /** Geometry segments for smooth curvature (default: 64) */
  public readonly segments = input<number>(64);

  /** World position as [x, y, z] tuple */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Uniform scale multiplier (default: 1) */
  public readonly scale = input<number>(1);

  // ============================================================================
  // Material Inputs
  // ============================================================================

  /** Glass color (default: coral '#ffc0a0') */
  public readonly color = input<string>('#ffc0a0');

  /** Opacity (0-1, default: 0.95 for nearly opaque glass) */
  public readonly opacity = input<number>(0.95);

  /** Surface roughness (0 = mirror, 1 = matte, default: 0.1 for glossy) */
  public readonly roughness = input<number>(0.1);

  /** Surface metalness (default: 0.0 for glass) */
  public readonly metalness = input<number>(0.0);

  // ============================================================================
  // Edge Glow Inputs
  // ============================================================================

  /** Fresnel edge glow color (default: warm coral '#ff9070') */
  public readonly edgeGlowColor = input<string>('#ff9070');

  /** Edge glow intensity multiplier (default: 0.4) */
  public readonly edgeGlowIntensity = input<number>(0.4);

  /** Fresnel power (higher = thinner glow line, default: 2.5) */
  public readonly edgeGlowPower = input<number>(2.5);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardNodeMaterial | null = null;
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
   * Create the glass sphere mesh with TSL fresnel material
   */
  private createMesh(): void {
    // Create geometry
    const radius = this.radius();
    const segments = this.segments();
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Parse color inputs
    const colorHex = new THREE.Color(this.color());
    const edgeColorHex = new THREE.Color(this.edgeGlowColor());
    const intensity = this.edgeGlowIntensity();
    const power = this.edgeGlowPower();

    // Create MeshStandardNodeMaterial with transparent glass properties
    this.material = new THREE.MeshStandardNodeMaterial({
      metalness: this.metalness(),
      roughness: this.roughness(),
      transparent: true,
      opacity: this.opacity(),
    });

    // Set base color via TSL node
    this.material.colorNode = vec3(colorHex.r, colorHex.g, colorHex.b);

    // TSL Fresnel edge glow for glass rim effect
    const fresnelEdgeGlow = Fn(() => {
      // Calculate view direction from camera to surface point
      const viewDir = normalize(cameraPosition.sub(positionWorld));

      // Rim factor: 1 at edges (perpendicular to view), 0 at center (facing camera)
      const rim = float(1).sub(abs(dot(normalWorld, viewDir)));

      // Power function to concentrate glow at edges
      const fresnelValue = pow(rim, float(power));

      // Edge glow color with intensity
      const edgeGlow = vec3(edgeColorHex.r, edgeColorHex.g, edgeColorHex.b)
        .mul(fresnelValue)
        .mul(intensity);

      return edgeGlow;
    });

    // Apply fresnel glow to emissive channel
    this.material.emissiveNode = fresnelEdgeGlow();

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set initial position
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    // Set initial scale
    this.mesh.scale.setScalar(this.scale());

    // Glass doesn't cast shadows well
    this.mesh.castShadow = false;
    this.mesh.receiveShadow = false;
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
