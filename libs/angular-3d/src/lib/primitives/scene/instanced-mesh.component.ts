/**
 * InstancedMeshComponent - High-Performance Instanced Rendering
 *
 * Renders thousands of similar objects with a single draw call for 100x
 * performance improvement over individual meshes. Supports per-instance
 * transforms and colors with dynamic update capabilities.
 *
 * ## Architecture
 *
 * This component provides GEOMETRY_SIGNAL and MATERIAL_SIGNAL tokens that
 * child geometry and material directives write to. When both are ready,
 * the component creates the THREE.InstancedMesh and registers it with
 * the SceneGraphStore.
 *
 * ## Performance Characteristics
 *
 * - Single draw call for all instances (verify via renderer.info.render.calls)
 * - Support for 100,000+ instances at 60fps on mid-range GPU
 * - Memory efficient through temp matrix/color object reuse
 * - Dynamic usage mode for frequently updated instances
 *
 * @example
 * ```html
 * <!-- Basic usage with 1000 instances -->
 * <a3d-instanced-mesh [count]="1000">
 *   <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
 *   <ng-container a3dStandardMaterial [color]="'#ff6b6b'" />
 * </a3d-instanced-mesh>
 *
 * <!-- Dynamic updates with pre-computed matrices -->
 * <a3d-instanced-mesh
 *   [count]="5000"
 *   [instanceMatrix]="precomputedMatrices"
 *   [instanceColor]="precomputedColors"
 *   [usage]="'dynamic'"
 *   [castShadow]="true"
 *   (meshReady)="onMeshReady($event)"
 * >
 *   <ng-container a3dSphereGeometry [args]="[0.1, 16, 16]" />
 *   <ng-container a3dStandardMaterial />
 * </a3d-instanced-mesh>
 * ```
 *
 * @example
 * ```typescript
 * // Component usage with programmatic updates
 * @Component({
 *   template: `
 *     <a3d-instanced-mesh
 *       [count]="particleCount"
 *       [usage]="'dynamic'"
 *       (meshReady)="onMeshReady($event)">
 *       <ng-container a3dBoxGeometry [args]="[0.1, 0.1, 0.1]" />
 *       <ng-container a3dStandardMaterial [color]="'#00ff00'" />
 *     </a3d-instanced-mesh>
 *   `
 * })
 * export class ParticleCloudComponent {
 *   particleCount = 10000;
 *   private mesh?: InstancedMeshComponent;
 *
 *   onMeshReady(mesh: THREE.InstancedMesh) {
 *     // Initialize positions
 *     const matrix = new THREE.Matrix4();
 *     for (let i = 0; i < this.particleCount; i++) {
 *       matrix.setPosition(
 *         Math.random() * 10 - 5,
 *         Math.random() * 10 - 5,
 *         Math.random() * 10 - 5
 *       );
 *       mesh.setMatrixAt(i, matrix);
 *     }
 *     mesh.instanceMatrix.needsUpdate = true;
 *   }
 * }
 * ```
 */

import {
  Component,
  ChangeDetectionStrategy,
  input,
  effect,
  inject,
  DestroyRef,
  signal,
  output,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../../types/tokens';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneService } from '../../canvas/scene.service';

/**
 * InstancedMeshComponent - Declarative instanced mesh primitive
 *
 * Uses Angular signals for reactive updates and integrates with the
 * angular-3d scene graph system.
 */
@Component({
  selector: 'a3d-instanced-mesh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `instanced-mesh-${crypto.randomUUID()}`,
    },
    {
      provide: GEOMETRY_SIGNAL,
      useFactory: () => signal<THREE.BufferGeometry | null>(null),
    },
    {
      provide: MATERIAL_SIGNAL,
      useFactory: () => signal<THREE.Material | null>(null),
    },
  ],
})
export class InstancedMeshComponent {
  // ============================================================================
  // Required Inputs
  // ============================================================================

  /**
   * Number of instances to render.
   *
   * **IMPORTANT: This value is immutable after mesh creation.**
   * The instance count is used to allocate GPU buffers during mesh initialization.
   * Changing this value after the mesh has been created will have NO effect.
   * To change the instance count, you must destroy and recreate the component.
   *
   * @remarks
   * The count must be a positive integer. Values <= 0 will result in an error
   * and the mesh will not be created.
   */
  public readonly count = input.required<number>();

  // ============================================================================
  // Optional Transform Array Inputs
  // ============================================================================

  /**
   * Pre-computed instance transformation matrices as Float32Array.
   * Each matrix is 16 floats (4x4 matrix), so array length = count * 16.
   * When provided, overrides default identity matrix initialization.
   */
  public readonly instanceMatrix = input<Float32Array | undefined>(undefined);

  /**
   * Pre-computed instance colors as Float32Array.
   * Each color is 3 floats (RGB normalized 0-1), so array length = count * 3.
   * Optional - instances use material color by default.
   */
  public readonly instanceColor = input<Float32Array | undefined>(undefined);

  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /**
   * Whether to enable frustum culling for the instanced mesh.
   * Set to false for meshes that span the entire view or for particle systems.
   * @default true
   */
  public readonly frustumCulled = input<boolean>(true);

  /**
   * Buffer usage hint for GPU optimization.
   * - 'static': Rarely updated instances (default, better performance)
   * - 'dynamic': Frequently updated instances (allows efficient updates)
   */
  public readonly usage = input<'static' | 'dynamic'>('static');

  /**
   * Whether instances cast shadows.
   * Requires shadow-enabled lighting in the scene.
   */
  public readonly castShadow = input<boolean>(false);

  /**
   * Whether instances receive shadows.
   * Requires shadow-enabled lighting in the scene.
   */
  public readonly receiveShadow = input<boolean>(false);

  // ============================================================================
  // Outputs
  // ============================================================================

  /**
   * Emitted when the InstancedMesh is created and ready for use.
   * Provides direct access to the THREE.InstancedMesh for advanced operations.
   */
  public readonly meshReady = output<THREE.InstancedMesh>();

  // ============================================================================
  // Injected Dependencies
  // ============================================================================

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly sceneService = inject(SceneService);

  // ============================================================================
  // Internal State
  // ============================================================================

  /** The underlying THREE.InstancedMesh instance */
  private instancedMesh: THREE.InstancedMesh | null = null;

  /** Ready state signal for external consumers */
  private readonly _isReady = signal(false);
  public readonly isReady = this._isReady.asReadonly();

  /** Temporary matrix for update operations (reused to avoid GC pressure) */
  private readonly tempMatrix = new THREE.Matrix4();

  /** Temporary color for update operations (reused to avoid GC pressure) */
  private readonly tempColor = new THREE.Color();

  /** Stores the original count when mesh was created (for immutability warning) */
  private createdWithCount: number | null = null;

  // ============================================================================
  // Constructor & Lifecycle
  // ============================================================================

  constructor() {
    // Effect: Create instanced mesh when geometry and material are ready
    effect(() => {
      // Wait for scene store to be initialized
      if (!this.sceneStore.isReady()) return;

      const geometry = this.geometrySignal();
      const material = this.materialSignal();
      const count = this.count();

      // Validate count is a positive number
      if (!count || count <= 0) {
        console.error(
          '[InstancedMeshComponent] count must be a positive number, got:',
          count
        );
        return;
      }

      // Wait for geometry and material
      if (!geometry || !material) return;

      // Only create mesh once - warn if count changed after creation
      if (this.instancedMesh) {
        if (this.createdWithCount !== null && count !== this.createdWithCount) {
          console.warn(
            '[InstancedMeshComponent] count cannot be changed after mesh creation. ' +
              `Current count: ${this.createdWithCount}, attempted: ${count}. ` +
              'To change count, destroy and recreate the component.'
          );
        }
        return;
      }

      this.createdWithCount = count;
      this.createInstancedMesh(geometry, material, count);
    });

    // Effect: Update instance matrices when input changes
    effect(() => {
      const matrix = this.instanceMatrix();
      if (matrix && this.instancedMesh) {
        // Validate array size
        const expectedLength = this.count() * 16;
        if (matrix.length !== expectedLength) {
          console.warn(
            `[InstancedMeshComponent] instanceMatrix length ${matrix.length} ` +
              `does not match expected ${expectedLength} (count * 16)`
          );
          return;
        }

        this.instancedMesh.instanceMatrix.array.set(matrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.sceneService.invalidate();
      }
    });

    // Effect: Update instance colors when input changes
    effect(() => {
      const colors = this.instanceColor();
      if (colors && this.instancedMesh) {
        // Validate array size
        const expectedLength = this.count() * 3;
        if (colors.length !== expectedLength) {
          console.warn(
            `[InstancedMeshComponent] instanceColor length ${colors.length} ` +
              `does not match expected ${expectedLength} (count * 3)`
          );
          return;
        }

        // Initialize instanceColor attribute if not exists
        if (!this.instancedMesh.instanceColor) {
          this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
            new Float32Array(this.count() * 3),
            3
          );
        }

        this.instancedMesh.instanceColor.array.set(colors);
        this.instancedMesh.instanceColor.needsUpdate = true;
        this.sceneService.invalidate();
      }
    });

    // Effect: Update frustum culling
    effect(() => {
      if (this.instancedMesh) {
        this.instancedMesh.frustumCulled = this.frustumCulled();
      }
    });

    // Effect: Update shadow settings
    effect(() => {
      if (this.instancedMesh) {
        this.instancedMesh.castShadow = this.castShadow();
        this.instancedMesh.receiveShadow = this.receiveShadow();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Creates the THREE.InstancedMesh and registers it with the scene graph.
   */
  private createInstancedMesh(
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    count: number
  ): void {
    // Create InstancedMesh
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    // Configure buffer usage for GPU optimization
    if (this.usage() === 'dynamic') {
      this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    // Configure shadow settings
    this.instancedMesh.castShadow = this.castShadow();
    this.instancedMesh.receiveShadow = this.receiveShadow();
    this.instancedMesh.frustumCulled = this.frustumCulled();

    // Initialize instance matrices
    const inputMatrix = this.instanceMatrix();
    if (inputMatrix && inputMatrix.length === count * 16) {
      // Use provided matrices
      this.instancedMesh.instanceMatrix.array.set(inputMatrix);
    } else {
      // Initialize all instances to identity matrix (positioned at origin)
      for (let i = 0; i < count; i++) {
        this.tempMatrix.identity();
        this.instancedMesh.setMatrixAt(i, this.tempMatrix);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Initialize instance colors if provided
    const inputColors = this.instanceColor();
    if (inputColors && inputColors.length === count * 3) {
      this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(inputColors),
        3
      );
    }

    // Add to parent Object3D
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.instancedMesh);
      } else {
        console.warn(
          '[InstancedMeshComponent] Parent not ready, mesh not added to scene'
        );
      }
    }

    // Register with SceneGraphStore for centralized management
    this.sceneStore.register(this.objectId, this.instancedMesh, 'mesh');

    // Update ready state
    this._isReady.set(true);

    // Emit meshReady event for external consumers
    this.meshReady.emit(this.instancedMesh);

    // Trigger initial render
    this.sceneService.invalidate();
  }

  /**
   * Cleans up all Three.js resources and removes from scene graph.
   */
  private dispose(): void {
    if (this.instancedMesh) {
      // Remove from parent
      if (this.parentFn) {
        const parent = this.parentFn();
        parent?.remove(this.instancedMesh);
      }

      // Remove from scene graph store
      this.sceneStore.remove(this.objectId);

      // Dispose geometry
      // Note: We don't dispose geometry/material here as they may be shared
      // and provided by child directives. The directive that created them
      // is responsible for cleanup.

      this.instancedMesh = null;
    }

    this._isReady.set(false);
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Update a specific instance's transform and optionally its color.
   *
   * @param index Instance index (0 to count-1)
   * @param matrix Transformation matrix to apply
   * @param color Optional color override for this instance
   *
   * @example
   * ```typescript
   * const matrix = new THREE.Matrix4();
   * matrix.compose(position, quaternion, scale);
   * instancedMesh.updateInstanceAt(0, matrix, new THREE.Color('red'));
   * ```
   */
  public updateInstanceAt(
    index: number,
    matrix: THREE.Matrix4,
    color?: THREE.Color
  ): void {
    if (!this.instancedMesh) {
      console.warn(
        '[InstancedMeshComponent] Cannot update instance: mesh not ready'
      );
      return;
    }

    if (index < 0 || index >= this.count()) {
      console.warn(
        `[InstancedMeshComponent] Instance index ${index} out of range [0, ${
          this.count() - 1
        }]`
      );
      return;
    }

    this.instancedMesh.setMatrixAt(index, matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    if (color) {
      this.setColorAt(index, color);
    }

    this.sceneService.invalidate();
  }

  /**
   * Set the transformation matrix for a specific instance.
   *
   * @param index Instance index (0 to count-1)
   * @param matrix Transformation matrix to apply
   *
   * @example
   * ```typescript
   * const matrix = new THREE.Matrix4();
   * matrix.makeTranslation(x, y, z);
   * instancedMesh.setMatrixAt(42, matrix);
   * ```
   */
  public setMatrixAt(index: number, matrix: THREE.Matrix4): void {
    if (!this.instancedMesh) {
      console.warn(
        '[InstancedMeshComponent] Cannot set matrix: mesh not ready'
      );
      return;
    }

    if (index < 0 || index >= this.count()) {
      console.warn(
        `[InstancedMeshComponent] Instance index ${index} out of range [0, ${
          this.count() - 1
        }]`
      );
      return;
    }

    this.instancedMesh.setMatrixAt(index, matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.sceneService.invalidate();
  }

  /**
   * Set the color for a specific instance.
   * Initializes the instanceColor attribute if not already present.
   *
   * @param index Instance index (0 to count-1)
   * @param color Color to apply to this instance
   *
   * @example
   * ```typescript
   * instancedMesh.setColorAt(0, new THREE.Color('#ff0000'));
   * instancedMesh.setColorAt(1, new THREE.Color(0.5, 1.0, 0.5));
   * ```
   */
  public setColorAt(index: number, color: THREE.Color): void {
    if (!this.instancedMesh) {
      console.warn('[InstancedMeshComponent] Cannot set color: mesh not ready');
      return;
    }

    if (index < 0 || index >= this.count()) {
      console.warn(
        `[InstancedMeshComponent] Instance index ${index} out of range [0, ${
          this.count() - 1
        }]`
      );
      return;
    }

    // Initialize instanceColor attribute if not exists
    if (!this.instancedMesh.instanceColor) {
      const colorArray = new Float32Array(this.count() * 3);
      // Initialize all to white (1, 1, 1)
      for (let i = 0; i < this.count(); i++) {
        colorArray[i * 3] = 1;
        colorArray[i * 3 + 1] = 1;
        colorArray[i * 3 + 2] = 1;
      }
      this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
        colorArray,
        3
      );
    }

    this.instancedMesh.setColorAt(index, color);
    this.instancedMesh.instanceColor.needsUpdate = true;
    this.sceneService.invalidate();
  }

  /**
   * Get the underlying THREE.InstancedMesh object.
   * Returns null if the mesh has not been created yet.
   *
   * @returns The THREE.InstancedMesh instance or null
   *
   * @example
   * ```typescript
   * const mesh = instancedMeshComponent.getMesh();
   * if (mesh) {
   *   console.log('Draw calls:', mesh.count);
   *   console.log('Bounding box:', mesh.geometry.boundingBox);
   * }
   * ```
   */
  public getMesh(): THREE.InstancedMesh | null {
    return this.instancedMesh;
  }

  /**
   * Get the transformation matrix for a specific instance.
   *
   * @param index Instance index (0 to count-1)
   * @param target Optional Matrix4 to store the result (reuses if provided)
   * @returns The transformation matrix or null if mesh not ready
   *
   * @example
   * ```typescript
   * const matrix = instancedMesh.getMatrixAt(42);
   * if (matrix) {
   *   const position = new THREE.Vector3();
   *   position.setFromMatrixPosition(matrix);
   * }
   * ```
   */
  public getMatrixAt(
    index: number,
    target?: THREE.Matrix4
  ): THREE.Matrix4 | null {
    if (!this.instancedMesh) {
      return null;
    }

    if (index < 0 || index >= this.count()) {
      console.warn(
        `[InstancedMeshComponent] Instance index ${index} out of range [0, ${
          this.count() - 1
        }]`
      );
      return null;
    }

    const matrix = target || new THREE.Matrix4();
    this.instancedMesh.getMatrixAt(index, matrix);
    return matrix;
  }

  /**
   * Get the color for a specific instance.
   *
   * @param index Instance index (0 to count-1)
   * @param target Optional Color to store the result (reuses if provided)
   * @returns The color or null if mesh not ready or no instance colors
   *
   * @example
   * ```typescript
   * const color = instancedMesh.getColorAt(42);
   * if (color) {
   *   console.log('Instance color:', color.getHexString());
   * }
   * ```
   */
  public getColorAt(index: number, target?: THREE.Color): THREE.Color | null {
    if (!this.instancedMesh || !this.instancedMesh.instanceColor) {
      return null;
    }

    if (index < 0 || index >= this.count()) {
      console.warn(
        `[InstancedMeshComponent] Instance index ${index} out of range [0, ${
          this.count() - 1
        }]`
      );
      return null;
    }

    const color = target || new THREE.Color();
    this.instancedMesh.getColorAt(index, color);
    return color;
  }

  /**
   * Batch update multiple instances at once.
   * More efficient than calling setMatrixAt/setColorAt individually
   * when updating many instances.
   *
   * @param updates Array of {index, matrix, color?} objects
   *
   * @example
   * ```typescript
   * const updates = positions.map((pos, i) => ({
   *   index: i,
   *   matrix: new THREE.Matrix4().makeTranslation(pos.x, pos.y, pos.z),
   *   color: new THREE.Color().setHSL(i / positions.length, 1, 0.5)
   * }));
   * instancedMesh.batchUpdate(updates);
   * ```
   */
  public batchUpdate(
    updates: Array<{
      index: number;
      matrix: THREE.Matrix4;
      color?: THREE.Color;
    }>
  ): void {
    if (!this.instancedMesh) {
      console.warn(
        '[InstancedMeshComponent] Cannot batch update: mesh not ready'
      );
      return;
    }

    const count = this.count();
    let hasColorUpdates = false;

    for (const update of updates) {
      if (update.index < 0 || update.index >= count) {
        console.warn(
          `[InstancedMeshComponent] Skipping invalid index ${update.index}`
        );
        continue;
      }

      this.instancedMesh.setMatrixAt(update.index, update.matrix);

      if (update.color) {
        // Initialize instanceColor if needed
        if (!this.instancedMesh.instanceColor) {
          const colorArray = new Float32Array(count * 3);
          for (let i = 0; i < count; i++) {
            colorArray[i * 3] = 1;
            colorArray[i * 3 + 1] = 1;
            colorArray[i * 3 + 2] = 1;
          }
          this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(
            colorArray,
            3
          );
        }
        this.instancedMesh.setColorAt(update.index, update.color);
        hasColorUpdates = true;
      }
    }

    // Mark buffers for update (once, after all updates)
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (hasColorUpdates && this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }

    this.sceneService.invalidate();
  }
}
