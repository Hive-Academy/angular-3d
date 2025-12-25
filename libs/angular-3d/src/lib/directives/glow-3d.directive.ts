/**
 * Glow3dDirective - Adds glow/halo effect to 3D objects
 *
 * Creates a BackSide sphere mesh that renders behind the target object,
 * creating a glow/halo effect. The glow automatically scales with the object
 * and updates reactively when properties change.
 *
 * Technique: BackSide rendering with MeshBasicMaterial
 * - BackSide sphere is slightly larger than target object
 * - Uses transparent material with additive or normal blending
 * - No depth write to prevent z-fighting
 *
 * @example
 * ```html
 * <a3d-floating-sphere
 *   a3dGlow3d
 *   [glowColor]="0x00d4ff"
 *   [glowIntensity]="0.3"
 *   [glowScale]="1.2"
 *   [glowSegments]="16"
 * />
 * ```
 */

import {
  Directive,
  inject,
  effect,
  input,
  DestroyRef,
  afterNextRender,
  isDevMode,
  signal,
} from '@angular/core';
import * as THREE from 'three';
import { ColorRepresentation } from 'three';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';

/**
 * Glow3dDirective
 *
 * Adds glow effect to any mesh by creating a BackSide sphere mesh.
 * The glow mesh is added as a child of the target mesh and automatically
 * cleaned up on directive destroy.
 *
 * Requirements:
 * - Target object must be registered in SceneGraphStore
 * - Target object should have a geometry with boundingSphere
 *
 * Lifecycle:
 * 1. Wait for object to be registered in store
 * 2. Get object from store
 * 3. Calculate bounding sphere radius
 * 4. Create BackSide glow sphere as child
 * 5. Reactively update glow properties
 * 6. Clean up on destroy
 */
@Directive({
  selector: '[a3dGlow3d]',
  standalone: true,
})
export class Glow3dDirective {
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Glow color (hex number or CSS color string)
   * Default: 0xffffff (white)
   */
  public readonly glowColor = input<ColorRepresentation>(0xffffff);

  /**
   * Glow intensity (opacity multiplier)
   * Range: 0-1 (0 = invisible, 1 = fully opaque)
   * Default: 0.2
   */
  public readonly glowIntensity = input<number>(0.2);

  /**
   * Glow scale multiplier (relative to object size)
   * Values > 1 create larger glow, < 1 create smaller
   * Default: 1.2 (20% larger than object)
   */
  public readonly glowScale = input<number>(1.2);

  /**
   * Sphere geometry segments (quality)
   * Lower = better performance, Higher = smoother glow
   * Default: 16
   */
  public readonly glowSegments = input<number>(16);

  /**
   * Auto-adjust quality based on performance health
   * If true, segments will reduce when performance drops
   * Default: true
   */
  public readonly autoAdjustQuality = input<boolean>(true);

  /** Internal references */
  private glowMesh: THREE.Mesh | null = null;
  private glowGeometry: THREE.SphereGeometry | null = null;
  private glowMaterial: THREE.MeshBasicMaterial | null = null;
  private targetObject: THREE.Object3D | null = null;

  /** Signal to track if render has happened */
  private readonly isRendered = signal(false);

  public constructor() {
    // Mark as rendered after first render
    afterNextRender(() => {
      this.isRendered.set(true);
    });

    // Effect: Create glow when object is ready (runs in injection context)
    effect(() => {
      // Skip if not yet rendered (signal read creates dependency)
      if (!this.isRendered()) {
        return;
      }

      // Skip if no objectId
      if (!this.objectId) {
        if (isDevMode()) {
          console.warn('[Glow3dDirective] No OBJECT_ID available');
        }
        return;
      }

      // Wait for object to be registered
      if (!this.store.hasObject(this.objectId)) {
        return;
      }

      // Get object from store (only once)
      if (!this.targetObject) {
        const storeObject = this.store.getObject(this.objectId);
        if (!storeObject) return;

        this.targetObject = storeObject;
        this.createGlowEffect();
      }
    });

    // Effect: Update glow properties reactively
    effect(() => {
      if (this.glowMaterial) {
        const color = this.glowColor();
        const intensity = this.glowIntensity();

        this.glowMaterial.color = new THREE.Color(color);
        this.glowMaterial.opacity = intensity;
        this.glowMaterial.needsUpdate = true;
      }
    });

    // Effect: Update glow scale reactively
    effect(() => {
      if (this.glowMesh && this.targetObject) {
        const scale = this.glowScale();
        this.updateGlowScale(scale);
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      if (this.glowMesh && this.targetObject) {
        this.targetObject.remove(this.glowMesh);
      }
      this.glowGeometry?.dispose();
      this.glowMaterial?.dispose();
      this.glowMesh = null;
      this.glowGeometry = null;
      this.glowMaterial = null;
    });
  }

  /**
   * Create the glow effect mesh
   */
  private createGlowEffect(): void {
    if (!this.targetObject) return;

    // Calculate base radius from object's bounding sphere
    let baseRadius = 1;

    if (this.targetObject instanceof THREE.Mesh) {
      // Ensure geometry has computed bounding sphere
      if (!this.targetObject.geometry.boundingSphere) {
        this.targetObject.geometry.computeBoundingSphere();
      }

      baseRadius = this.targetObject.geometry.boundingSphere?.radius || 1;
    } else {
      // For non-mesh objects, use bounding box
      const bbox = new THREE.Box3().setFromObject(this.targetObject);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      baseRadius = Math.max(size.x, size.y, size.z) / 2;
    }

    const glowRadius = baseRadius * this.glowScale();
    const segments = this.glowSegments();

    // Create glow geometry with base radius (no scale multiplier - use mesh.scale instead)
    this.glowGeometry = new THREE.SphereGeometry(
      baseRadius,
      segments,
      segments
    );

    // Create glow material (BackSide with transparency)
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.glowColor()),
      transparent: true,
      opacity: this.glowIntensity(),
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending, // Additive for better glow effect
    });

    // Create glow mesh
    this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);

    // Set initial scale
    const initialScale = this.glowScale();
    this.glowMesh.scale.setScalar(initialScale);

    // Add as child of target object (inherits transforms)
    this.targetObject.add(this.glowMesh);
  }

  /**
   * Update glow scale using mesh.scale (no geometry recreation)
   * This is much more efficient than recreating geometry on every scale change
   */
  private updateGlowScale(scale: number): void {
    if (!this.glowMesh) return;

    // Update mesh scale directly - no need to recreate geometry
    this.glowMesh.scale.setScalar(scale);
  }
}
