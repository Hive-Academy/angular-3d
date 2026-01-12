# Implementation Plan - TASK_2025_015

## Goal

Refactor `@hive-academy/angular-3d` library to use **Tier 2: Signal Store + Directive-First Pattern** architecture, eliminating injection context errors, reducing effects by 80%, and enabling type-safe directive-component communication.

---

## Component 1: SceneGraphStore

**Purpose**: Central signal-based store for all Three.js Object3D instances

### [CREATE] `libs/angular-3d/src/lib/store/scene-graph.store.ts`

**Pattern Reference**: `component-registry.service.ts:93-170` (signal-based registry pattern)

**Full Implementation**:

```typescript
/**
 * SceneGraphStore - Central registry for Three.js Object3D instances
 *
 * Uses Angular signals for reactive state management.
 * Pattern follows ComponentRegistryService signal patterns.
 */

import { Injectable, signal, computed } from '@angular/core';
import type { Object3D, Scene, PerspectiveCamera, WebGLRenderer } from 'three';

// ============================================================================
// Interfaces
// ============================================================================

export type Object3DType = 'mesh' | 'light' | 'camera' | 'group' | 'particles' | 'fog';

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

@Injectable({ providedIn: 'root' })
export class SceneGraphStore {
  // Core Three.js objects (provided by Scene3dComponent)
  private readonly _scene = signal<Scene | null>(null);
  private readonly _camera = signal<PerspectiveCamera | null>(null);
  private readonly _renderer = signal<WebGLRenderer | null>(null);

  // Object registry
  private readonly _registry = signal<Map<string, ObjectEntry>>(new Map());

  // ============================================================================
  // Public Computed Signals
  // ============================================================================

  public readonly scene = this._scene.asReadonly();
  public readonly camera = this._camera.asReadonly();
  public readonly renderer = this._renderer.asReadonly();

  public readonly isReady = computed(() => !!this._scene() && !!this._camera() && !!this._renderer());

  public readonly objectCount = computed(() => this._registry().size);

  public readonly meshes = computed(() => [...this._registry()].filter(([_, e]) => e.type === 'mesh').map(([_, e]) => e.object));

  public readonly lights = computed(() => [...this._registry()].filter(([_, e]) => e.type === 'light').map(([_, e]) => e.object));

  // ============================================================================
  // Scene Initialization
  // ============================================================================

  public initScene(scene: Scene, camera: PerspectiveCamera, renderer: WebGLRenderer): void {
    this._scene.set(scene);
    this._camera.set(camera);
    this._renderer.set(renderer);
  }

  // ============================================================================
  // Object Registration
  // ============================================================================

  public register(id: string, object: Object3D, type: Object3DType, parentId?: string): void {
    // Add to parent or scene
    const parent = parentId ? this._registry().get(parentId)?.object : this._scene();
    if (parent) {
      parent.add(object);
    }

    // Update registry
    this._registry.update((registry) => {
      const newRegistry = new Map(registry);
      newRegistry.set(id, { object, type, parentId: parentId ?? null });
      return newRegistry;
    });
  }

  public update(id: string, transform?: TransformProps, material?: MaterialProps): void {
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
      const mat = obj.material as any;
      if (material.color !== undefined && mat.color) {
        mat.color.set(material.color);
      }
      if (material.wireframe !== undefined) {
        mat.wireframe = material.wireframe;
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
    const parent = parentId ? this._registry().get(parentId)?.object : this._scene();
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
    return [...this._registry()].filter(([_, entry]) => entry.type === type).map(([_, entry]) => entry.object);
  }

  public hasObject(id: string): boolean {
    return this._registry().has(id);
  }

  // ============================================================================
  // Disposal
  // ============================================================================

  private disposeObject(object: Object3D): void {
    // Dispose geometry
    if ('geometry' in object && object.geometry) {
      (object.geometry as any).dispose?.();
    }

    // Dispose material(s)
    if ('material' in object && object.material) {
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach((mat: any) => mat.dispose?.());
    }

    // Recursively dispose children
    object.children.forEach((child) => this.disposeObject(child));
  }

  public clear(): void {
    // Dispose all objects
    this._registry().forEach((entry) => this.disposeObject(entry.object));
    this._registry.set(new Map());
  }
}
```

---

## Component 2: DI Tokens

**Purpose**: InjectionTokens for component ID and geometry/material sharing

### [CREATE] `libs/angular-3d/src/lib/tokens/object-id.token.ts`

**Pattern Reference**: `tokens.ts:11-13` (existing token pattern)

```typescript
import { InjectionToken } from '@angular/core';

/**
 * Unique object ID for Three.js object registration.
 * Each component provides its own ID via this token.
 */
export const OBJECT_ID = new InjectionToken<string>('OBJECT_ID');
```

### [CREATE] `libs/angular-3d/src/lib/tokens/geometry.token.ts`

```typescript
import { InjectionToken, WritableSignal } from '@angular/core';
import type { BufferGeometry } from 'three';

/**
 * Writable signal for geometry sharing between directives.
 * Geometry directives write to this, MeshDirective reads from it.
 */
export const GEOMETRY_SIGNAL = new InjectionToken<WritableSignal<BufferGeometry | null>>('GEOMETRY_SIGNAL');
```

### [CREATE] `libs/angular-3d/src/lib/tokens/material.token.ts`

```typescript
import { InjectionToken, WritableSignal } from '@angular/core';
import type { Material } from 'three';

/**
 * Writable signal for material sharing between directives.
 * Material directives write to this, MeshDirective reads from it.
 */
export const MATERIAL_SIGNAL = new InjectionToken<WritableSignal<Material | null>>('MATERIAL_SIGNAL');
```

---

## Component 3: Core Directives

**Purpose**: Host directives that handle Three.js object creation

### [CREATE] `libs/angular-3d/src/lib/directives/mesh.directive.ts`

**Pattern Reference**: `float-3d.directive.ts:90-100` (directive structure)

```typescript
import { Directive, inject, DestroyRef, effect, signal } from '@angular/core';
import * as THREE from 'three';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import { GEOMETRY_SIGNAL } from '../tokens/geometry.token';
import { MATERIAL_SIGNAL } from '../tokens/material.token';

/**
 * MeshDirective - Creates and registers THREE.Mesh with SceneGraphStore
 *
 * This directive is the primary host directive for mesh-based primitives.
 * It reads geometry and material from sibling directives via DI signals.
 */
@Directive({
  selector: '[a3dMesh]',
  standalone: true,
  providers: [
    { provide: GEOMETRY_SIGNAL, useFactory: () => signal<THREE.BufferGeometry | null>(null) },
    { provide: MATERIAL_SIGNAL, useFactory: () => signal<THREE.Material | null>(null) },
  ],
})
export class MeshDirective {
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly destroyRef = inject(DestroyRef);

  public mesh: THREE.Mesh | null = null;

  constructor() {
    // Effect: Create mesh when geometry and material are ready
    effect(() => {
      const geometry = this.geometrySignal();
      const material = this.materialSignal();

      if (!geometry || !material) return;
      if (this.mesh) return; // Already created

      this.mesh = new THREE.Mesh(geometry, material);
      this.store.register(this.objectId, this.mesh, 'mesh');
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.store.remove(this.objectId);
    });
  }
}
```

### [CREATE] `libs/angular-3d/src/lib/directives/transform.directive.ts`

```typescript
import { Directive, inject, effect, input } from '@angular/core';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';

/**
 * TransformDirective - Syncs position/rotation/scale inputs to store
 */
@Directive({
  selector: '[a3dTransform]',
  standalone: true,
})
export class TransformDirective {
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);

  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);

  constructor() {
    // Single effect for all transform updates
    effect(() => {
      this.store.update(this.objectId, {
        position: this.position(),
        rotation: this.rotation(),
        scale: this.scale(),
      });
    });
  }
}
```

---

## Component 4: Geometry Directives

**Purpose**: Create specific geometry types and provide via DI signal

### [CREATE] `libs/angular-3d/src/lib/directives/geometries/box-geometry.directive.ts`

```typescript
import { Directive, inject, effect, input } from '@angular/core';
import * as THREE from 'three';
import { GEOMETRY_SIGNAL } from '../../tokens/geometry.token';

/**
 * BoxGeometryDirective - Creates BoxGeometry and provides via signal
 */
@Directive({
  selector: '[a3dBoxGeometry]',
  standalone: true,
})
export class BoxGeometryDirective {
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);

  public readonly args = input<[number, number, number]>([1, 1, 1]);

  constructor() {
    effect(() => {
      const [width, height, depth] = this.args();
      const geometry = new THREE.BoxGeometry(width, height, depth);
      this.geometrySignal.set(geometry);
    });
  }
}
```

### [CREATE] Similar files for:

- `cylinder-geometry.directive.ts` → CylinderGeometry
- `torus-geometry.directive.ts` → TorusGeometry
- `sphere-geometry.directive.ts` → SphereGeometry
- `polyhedron-geometry.directive.ts` → IcosahedronGeometry/DodecahedronGeometry

---

## Component 5: Material Directives

### [CREATE] `libs/angular-3d/src/lib/directives/materials/standard-material.directive.ts`

```typescript
import { Directive, inject, effect, input } from '@angular/core';
import * as THREE from 'three';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * StandardMaterialDirective - Creates MeshStandardMaterial and provides via signal
 */
@Directive({
  selector: '[a3dStandardMaterial]',
  standalone: true,
})
export class StandardMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly store = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);

  public readonly color = input<number | string>(0xffffff);
  public readonly wireframe = input<boolean>(false);
  public readonly metalness = input<number>(0.5);
  public readonly roughness = input<number>(0.5);

  private material: THREE.MeshStandardMaterial | null = null;

  constructor() {
    // Create material once
    effect(() => {
      if (!this.material) {
        this.material = new THREE.MeshStandardMaterial({
          color: this.color(),
          wireframe: this.wireframe(),
          metalness: this.metalness(),
          roughness: this.roughness(),
        });
        this.materialSignal.set(this.material);
      }
    });

    // Update material properties reactively
    effect(() => {
      if (this.material) {
        this.store.update(this.objectId, undefined, {
          color: this.color(),
          wireframe: this.wireframe(),
        });
      }
    });
  }
}
```

---

## Component 6: Refactored BoxComponent

**Purpose**: Example of pure Angular component using hostDirectives

### [MODIFY] `libs/angular-3d/src/lib/primitives/box.component.ts`

**Line Range**: 1-153 (complete rewrite)

**Pattern Reference**: See approved store-architecture.md Directive-First Pattern

```typescript
import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { OBJECT_ID } from '../tokens/object-id.token';
import { MeshDirective } from '../directives/mesh.directive';
import { BoxGeometryDirective } from '../directives/geometries/box-geometry.directive';
import { TransformDirective } from '../directives/transform.directive';
import { StandardMaterialDirective } from '../directives/materials/standard-material.directive';

/**
 * BoxComponent - Declarative 3D Box Primitive
 *
 * Uses hostDirectives composition pattern - NO Three.js imports!
 * All Three.js logic is delegated to directives.
 */
@Component({
  selector: 'a3d-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [{ provide: OBJECT_ID, useFactory: () => `box-${crypto.randomUUID()}` }],
  hostDirectives: [MeshDirective, { directive: BoxGeometryDirective, inputs: ['args'] }, { directive: TransformDirective, inputs: ['position', 'rotation', 'scale'] }, { directive: StandardMaterialDirective, inputs: ['color', 'wireframe'] }],
})
export class BoxComponent {
  // ✅ ZERO Three.js imports - all handled by directives!
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<[number, number, number]>([1, 1, 1]);
  public readonly args = input<[number, number, number]>([1, 1, 1]);
  public readonly color = input<number | string>(0xffffff);
  public readonly wireframe = input<boolean>(false);
}
```

**Quality Metrics**:

- **Before**: 153 lines, 6 effects, Three.js imports ❌
- **After**: ~35 lines, 0 effects, zero Three.js ✅

---

## Component 7: Animation Directive Updates

### [MODIFY] `libs/angular-3d/src/lib/directives/float-3d.directive.ts`

**Line Range**: 94-137 (constructor and ngAfterViewInit)

**Changes**: Replace MeshProvider injection with store + computed pattern

```typescript
// Replace lines 94-137 with:

@Directive({
  selector: '[float3d]',
  standalone: true,
})
export class Float3dDirective {
  private readonly store = inject(SceneGraphStore);
  private readonly hostId = inject(OBJECT_ID, { skipSelf: true, optional: true });
  private readonly destroyRef = inject(DestroyRef);

  public readonly floatConfig = input<FloatConfig | undefined>(undefined);

  private gsapTimeline: any | null = null;
  private originalPosition: [number, number, number] | null = null;

  constructor() {
    if (!this.hostId) return;

    // Computed signal - resolves when mesh is registered
    const mesh = computed(() => this.store.getObject<Mesh>(this.hostId!));

    // Effect runs when mesh and config are ready
    effect(() => {
      const m = mesh();
      const config = this.floatConfig();

      if (m && config && !this.gsapTimeline) {
        this.originalPosition = [m.position.x, m.position.y, m.position.z];
        this.createFloatingAnimation(m, config);
      }
    });

    this.destroyRef.onDestroy(() => this.cleanup());
  }

  // Keep existing animation methods...
}
```

### [MODIFY] `libs/angular-3d/src/lib/directives/rotate-3d.directive.ts`

**Apply same pattern as Float3dDirective**

---

## Component 8: Scene3dComponent Integration

### [MODIFY] `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`

**Line Range**: Add after line 22 (imports)

**Changes**: Inject SceneGraphStore and call initScene

```typescript
// Add import
import { SceneGraphStore } from '../store/scene-graph.store';

// In constructor or afterNextRender callback:
private readonly sceneStore = inject(SceneGraphStore);

// After scene/camera/renderer are created:
this.sceneStore.initScene(this.scene, this.camera, this.renderer);
```

---

## Integration Architecture

### Data Flow

```
Component Input Changes
       │
       ▼
hostDirective effects (TransformDirective, MaterialDirective)
       │
       ▼
SceneGraphStore.update(id, props)
       │
       ▼
Three.js Object3D mutations (position.set, color.set, etc.)
       │
       ▼
Render Loop (unchanged)
       │
       ▼
renderer.render(scene, camera)
```

### Directive Composition

```
BoxComponent
├── provides: OBJECT_ID
└── hostDirectives:
    ├── MeshDirective (creates Mesh, registers with store)
    │   └── provides: GEOMETRY_SIGNAL, MATERIAL_SIGNAL
    ├── BoxGeometryDirective (creates geometry, writes to GEOMETRY_SIGNAL)
    ├── TransformDirective (syncs position/rotation/scale to store)
    └── StandardMaterialDirective (creates material, writes to MATERIAL_SIGNAL)
```

---

## Verification Plan

### Automated Tests

```bash
# Unit tests for new services and directives
npx nx test angular-3d --testNamePattern="SceneGraphStore"
npx nx test angular-3d --testNamePattern="MeshDirective"
npx nx test angular-3d --testNamePattern="BoxComponent"

# Full library test
npx nx test angular-3d

# Build verification
npx nx build angular-3d
```

### Browser Verification

1. Navigate to `http://localhost:4200/angular-3d`
2. Verify boxes/meshes render correctly
3. Check console for:
   - ❌ No `NG0203` injection context errors
   - ❌ No `getMesh()` warnings
   - ✅ Scene graph logs (optional debug)
4. Test animations (float3d, rotate3d)
5. Resize browser - canvas resizes correctly

### Effect Count Verification

```bash
# Before refactoring
grep -r "effect(" libs/angular-3d/src/lib/primitives/*.ts | wc -l
# Expected: ~108 effects

# After refactoring
grep -r "effect(" libs/angular-3d/src/lib/primitives/*.ts | wc -l
# Expected: ~22 effects (80% reduction)
```

---

## Team-Leader Handoff

**Developer Type**: frontend-developer (Angular + Three.js)
**Complexity**: Complex
**Estimated Tasks**: 25-30 atomic tasks
**Batch Strategy**: Layer-based

### Suggested Batches

1. **Batch 1: Foundation** (~3hrs)

   - SceneGraphStore
   - OBJECT_ID token
   - GEOMETRY_SIGNAL/MATERIAL_SIGNAL tokens

2. **Batch 2: Core Directives** (~3hrs)

   - MeshDirective
   - TransformDirective
   - StandardMaterialDirective

3. **Batch 3: Geometry Directives** (~2hrs)

   - BoxGeometryDirective
   - CylinderGeometryDirective
   - TorusGeometryDirective
   - SphereGeometryDirective

4. **Batch 4: Proof of Concept** (~2hrs)

   - Refactor BoxComponent
   - Update Scene3dComponent
   - Browser verification

5. **Batch 5: Animation Directives** (~2hrs)

   - Update Float3dDirective
   - Update Rotate3dDirective

6. **Batch 6: Remaining Primitives** (~4hrs)

   - CylinderComponent
   - TorusComponent
   - PolyhedronComponent
   - GroupComponent

7. **Batch 7: Advanced Primitives** (~4hrs)

   - Light components (5 files)
   - GltfModelComponent
   - Other advanced primitives

8. **Batch 8: Final Verification** (~2hrs)
   - Full test suite
   - Demo app verification
   - Documentation updates
