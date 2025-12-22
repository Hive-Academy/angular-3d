/**
 * SceneGraphStore - Central registry for Three.js Object3D instances
 *
 * Uses Angular signals for reactive state management.
 * Pattern follows ComponentRegistryService signal patterns.
 */

import { Injectable, signal, computed } from '@angular/core';
import type {
  Object3D,
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Material,
  BufferGeometry,
} from 'three';

// ============================================================================
// Interfaces
// ============================================================================

export type Object3DType =
  | 'mesh'
  | 'light'
  | 'camera'
  | 'group'
  | 'particles'
  | 'fog';

export interface ObjectEntry {
  readonly object: Object3D;
  readonly type: Object3DType;
  readonly parentId: string | null;
}

export interface TransformProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export interface MaterialProps {
  color?: number | string;
  wireframe?: boolean;
  opacity?: number;
  transparent?: boolean;
}

// ============================================================================
// SceneGraphStore
// ============================================================================

/**
 * IMPORTANT: This service is NOT provided at root.
 * Each Scene3dComponent provides its own instance to ensure
 * multi-scene isolation (objects register with the correct scene).
 */
@Injectable()
export class SceneGraphStore {
  // Core Three.js objects (provided by Scene3dComponent)
  private readonly _scene = signal<Scene | null>(null);
  private readonly _camera = signal<PerspectiveCamera | null>(null);
  private readonly _renderer = signal<WebGLRenderer | null>(null);

  // Ready state - signals when scene initialization is complete
  private readonly _isReady = signal(false);

  // Object registry
  private readonly _registry = signal<Map<string, ObjectEntry>>(new Map());

  // ============================================================================
  // Public Computed Signals
  // ============================================================================

  public readonly scene = this._scene.asReadonly();
  public readonly camera = this._camera.asReadonly();
  public readonly renderer = this._renderer.asReadonly();

  // Signal indicating scene is ready for object registration
  public readonly isReady = this._isReady.asReadonly();

  public readonly objectCount = computed(() => this._registry().size);

  public readonly meshes = computed(() =>
    [...this._registry()]
      .filter(([_, e]) => e.type === 'mesh')
      .map(([_, e]) => e.object)
  );

  public readonly lights = computed(() =>
    [...this._registry()]
      .filter(([_, e]) => e.type === 'light')
      .map(([_, e]) => e.object)
  );

  // ============================================================================
  // Scene Initialization
  // ============================================================================

  public initScene(
    scene: Scene,
    camera: PerspectiveCamera,
    renderer: WebGLRenderer
  ): void {
    this._scene.set(scene);
    this._camera.set(camera);
    this._renderer.set(renderer);
    // Signal ready AFTER all core objects are set
    this._isReady.set(true);
  }

  // ============================================================================
  // Object Registration
  // ============================================================================

  public register(
    id: string,
    object: Object3D,
    type: Object3DType,
    parentId?: string
  ): boolean {
    try {
      // Add to parent or scene
      const parent = parentId
        ? this._registry().get(parentId)?.object
        : this._scene();

      if (!parent) {
        console.warn(
          `[SceneGraphStore] Cannot add ${id} to scene - scene not initialized yet`
        );
        // Still add to registry so component is tracked
        // Scene will be available on next registration attempt
      } else {
        parent.add(object);
      }

      // Update registry
      this._registry.update((registry) => {
        const newRegistry = new Map(registry);
        newRegistry.set(id, { object, type, parentId: parentId ?? null });
        return newRegistry;
      });

      return true;
    } catch (error) {
      console.error(`[SceneGraphStore] Failed to register ${id}:`, error);
      return false;
    }
  }

  public update(
    id: string,
    transform?: TransformProps,
    material?: MaterialProps
  ): void {
    const entry = this._registry().get(id);
    if (!entry) return;

    const obj = entry.object;

    // Apply transform updates
    if (transform?.position) {
      obj.position.set(...transform.position);
    }
    if (transform?.rotation) {
      obj.rotation.set(...transform.rotation);
    }
    if (transform?.scale) {
      obj.scale.set(...transform.scale);
    }

    // Apply material updates (if mesh with material)
    if (material && 'material' in obj && obj.material) {
      const mat = obj.material as Material;
      if (material.color !== undefined && 'color' in mat && mat.color) {
        (mat.color as { set: (value: number | string) => void }).set(
          material.color
        );
      }
      if (material.wireframe !== undefined && 'wireframe' in mat) {
        (mat as { wireframe: boolean }).wireframe = material.wireframe;
      }
      if (material.opacity !== undefined) {
        mat.opacity = material.opacity;
      }
      if (material.transparent !== undefined) {
        mat.transparent = material.transparent;
      }
      mat.needsUpdate = true;
    }
  }

  public remove(id: string): void {
    const entry = this._registry().get(id);
    if (!entry) return;

    const { object, parentId } = entry;

    // Remove from parent
    const parent = parentId
      ? this._registry().get(parentId)?.object
      : this._scene();
    parent?.remove(object);

    // Dispose resources
    this.disposeObject(object);

    // Remove from registry
    this._registry.update((registry) => {
      const newRegistry = new Map(registry);
      newRegistry.delete(id);
      return newRegistry;
    });
  }

  public getObject<T extends Object3D>(id: string): T | null {
    return (this._registry().get(id)?.object as T) ?? null;
  }

  public queryByType(type: Object3DType): Object3D[] {
    return [...this._registry()]
      .filter(([_, entry]) => entry.type === type)
      .map(([_, entry]) => entry.object);
  }

  public hasObject(id: string): boolean {
    return this._registry().has(id);
  }

  // ============================================================================
  // Disposal
  // ============================================================================

  private disposeObject(object: Object3D): void {
    // Dispose geometry with error boundary
    try {
      if ('geometry' in object && object.geometry) {
        (object.geometry as BufferGeometry).dispose?.();
      }
    } catch (error) {
      console.error('[SceneGraphStore] Error disposing geometry:', error);
    }

    // Dispose material(s) with error boundary
    try {
      if ('material' in object && object.material) {
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((mat: Material) => {
          try {
            mat.dispose?.();
          } catch (e) {
            console.error('[SceneGraphStore] Error disposing material:', e);
          }
        });
      }
    } catch (error) {
      console.error('[SceneGraphStore] Error processing materials:', error);
    }

    // Recursively dispose children with error boundary for each
    object.children.forEach((child) => {
      try {
        this.disposeObject(child);
      } catch (error) {
        console.error('[SceneGraphStore] Error disposing child:', error);
      }
    });
  }

  public clear(): void {
    // Dispose all objects
    this._registry().forEach((entry) => this.disposeObject(entry.object));
    this._registry.set(new Map());
  }
}
