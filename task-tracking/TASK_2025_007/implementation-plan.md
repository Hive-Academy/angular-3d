# Implementation Plan - TASK_2025_007

## Goal

Implement typesafe, signal-based Core Primitive components (Box, Cylinder, Torus, Polyhedron) and Scene Elements (Lights, Fog, Group) for `@hive-academy/angular-3d`. Establish a hierarchical Dependency Injection system (`NG_3D_PARENT`) to handle parent-child relationships like `Group > Box`.

## Proposed Changes

### Infrastructure: Hierarchy & Tokens

#### [NEW] [tokens.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/types/tokens.ts)

**Purpose**: Define the injection token for parent-child composition.

```typescript
import { InjectionToken } from '@angular/core';
import * as THREE from 'three';

/**
 * Injection token for the parent 3D object.
 * Used by child components to attach themselves to a parent (Group or Scene).
 */
export const NG_3D_PARENT = new InjectionToken<THREE.Object3D>('NG_3D_PARENT');
```

#### [MODIFY] [scene-3d.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/canvas/scene-3d.component.ts)

**Purpose**: Initialize `THREE.Scene` synchronously so it can be provided as the root `NG_3D_PARENT`.

**Changes**:

1.  Move `this.scene = new THREE.Scene()` to class property initializer.
2.  Add `providers: [{ provide: NG_3D_PARENT, useFactory: (c: Scene3dComponent) => c.getScene(), deps: [Scene3dComponent] }]`.
    - _Correction_: `Scene3dComponent` injection in its own providers array might be circular or unavailable.
    - _Better_: Use `forwardRef`, OR simpler: `Scene3dComponent` doesn't provide the token via decorator, but via `viewProviders` if used in template.
    - _Alternative_: `Scene3dComponent` sets the value in `SceneService`, and we provide `NG_3D_PARENT` via a factory that reads `SceneService`.
    - _Chosen_: `providers: [SceneService, { provide: NG_3D_PARENT, useFactory: (s: SceneService) => s.scene(), deps: [SceneService] }]`. Wait, `SceneService.scene` is a signal, might be null initially.
    - _Simplest_: Just initialize `scene` synchronously. Provide `NG_3D_PARENT` via `useFactory: (c: Scene3dComponent) => c.scene, deps: [Scene3dComponent]` ? No, component isn't available in its own providers.
    - _New Strategy_: `Scene3dComponent` creates the scene. It provides `SceneService`. `SceneService` holds the scene.
    - We define `NG_3D_PARENT` as `InjectionToken<() => THREE.Object3D | null>`.
    - Providers: `{ provide: NG_3D_PARENT, useFactory: (s: SceneService) => () => s.scene(), deps: [SceneService] }`.
    - Child components call `inject(NG_3D_PARENT)()`.

**Pattern Reference**: Canvas/Root setup.

### Grouping

#### [NEW] [group.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/group.component.ts)

**Purpose**: Renderless container that applies transforms to children.

```typescript
@Component({
  selector: 'a3d-group',
  providers: [{
    provide: NG_3D_PARENT,
    useFactory: (c: GroupComponent) => () => c.group,
    deps: [GroupComponent] // This works in component providers if we use forwardRef or just access the instance if provided
  }]
})
// ...
```

### Geometric Primitives

#### [NEW] [box.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/box.component.ts)

**Purpose**: Render a Cube.

**Inputs**:

- `position`, `rotation`, `scale`
- `args` (width, height, depth)
- `color`, `wireframe`

**Logic**:

- Inject `NG_3D_PARENT`.
- `parentFn()` gets parent.
- `effect()`: Create `THREE.Mesh`.
- `parent.add(mesh)`.
- Cleanup on destroy.

#### [NEW] [cylinder.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/cylinder.component.ts)

Wrapper for `CylinderGeometry`.

#### [NEW] [torus.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/torus.component.ts)

Wrapper for `TorusGeometry`.

#### [NEW] [polyhedron.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/polyhedron.component.ts)

Wrapper for `IcosahedronGeometry` / `DodecahedronGeometry` etc. or generic Polyhedron.

### Lighting

#### [NEW] [ambient-light.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/lights/ambient-light.component.ts)

Wrapper for `AmbientLight`.

#### [NEW] [point-light.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/lights/point-light.component.ts)

Wrapper for `PointLight`.

#### [NEW] [directional-light.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/lights/directional-light.component.ts)

Wrapper for `DirectionalLight`.

#### [NEW] [spot-light.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/lights/spot-light.component.ts)

Wrapper for `SpotLight`.

### Atmospheric

#### [NEW] [fog.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/fog.component.ts)

Logic: Inject `SceneService` and set `scene.fog`.

## Verification Plan

### Automated Tests

Run unit tests checking hierarchy:

```bash
npx nx test angular-3d --testFile=libs/angular-3d/src/lib/primitives/group.component.spec.ts
```

Verify `BoxComponent` adds to `GroupComponent` when nested.

## Team-Leader Handoff

**Developer Type**: Frontend (3D)
**Complexity**: Medium
**Batch Strategy**:

1.  **Batch 1**: Hierarchy Infrastructure (`tokens.ts`, `Scene3d`, `Group`).
2.  **Batch 2**: Primitives (`Box`, `Cylinder`, `Torus`, `Polyhedron`).
3.  **Batch 3**: Lights & Fog.
