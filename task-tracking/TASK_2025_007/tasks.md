# Development Tasks - TASK_2025_007

**Task Type**: Frontend (3D)
**Total Tasks**: 13
**Total Batches**: 3
**Batching Strategy**: Layer-based (Infrastructure -> Primitives -> Lights)
**Status**: 3/3 batches complete (100%) ✅

---

## Batch 1: Hierarchy Infrastructure ✅ COMPLETE

**Assigned To**: Frontend Developer
**Tasks in Batch**: 4
**Dependencies**: None
**Estimated Commits**: 1

### Task 1.1: Define Injection Token ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/types/tokens.ts`
**Specification Reference**: implementation-plan.md
**Expected Commit Pattern**: `feat(angular-3d): define NG_3D_PARENT injection token`

**Quality Requirements**:

- ✅ Token is typed as `InjectionToken<() => THREE.Object3D | null>`
- ✅ Exported for public use

### Task 1.2: Update Scene3D Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`
**Specification Reference**: implementation-plan.md
**Changes**:

- Initialize `scene` synchronously
- Provide `NG_3D_PARENT` using `useFactory` and `SceneService` (or direct signal access)

### Task 1.3: Implement Group Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/group.component.ts`
**Specification Reference**: implementation-plan.md
**Quality Requirements**:

- ✅ Wraps `THREE.Group`
- ✅ Provides `NG_3D_PARENT` for its children
- ✅ Injects `NG_3D_PARENT` to attach itself to parent

### Task 1.4: Update Primitives Module ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/index.ts`
**Changes**:

- Export `GroupComponent`
- Remove placeholder if ready

---

## Batch 2: Geometric Primitives ✅ COMPLETE

**Assigned To**: Frontend Developer
**Tasks in Batch**: 4
**Dependencies**: Batch 1
**Estimated Commits**: 1

### Task 2.1: Implement Box Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/box.component.ts`
**Specification Reference**: implementation-plan.md
**Pattern**: `GroupComponent` (for hierarchy injection)
**Quality Requirements**:

- ✅ Signal inputs for args/transforms
- ✅ OnPush change detection
- ✅ Proper disposal of geometry/material

### Task 2.2: Implement Cylinder Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/cylinder.component.ts`
**Specification Reference**: implementation-plan.md

### Task 2.3: Implement Torus Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/torus.component.ts`
**Specification Reference**: implementation-plan.md

### Task 2.4: Implement Polyhedron Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/polyhedron.component.ts`
**Specification Reference**: implementation-plan.md

---

## Batch 3: Lights & Fog ✅ COMPLETE

**Assigned To**: Frontend Developer
**Tasks in Batch**: 5
**Dependencies**: Batch 1
**Estimated Commits**: 1

### Task 3.1: Ambient Light ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/lights/ambient-light.component.ts`

### Task 3.2: Point Light ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/lights/point-light.component.ts`

### Task 3.3: Directional Light ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/lights/directional-light.component.ts`

### Task 3.4: Spot Light ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/lights/spot-light.component.ts`

### Task 3.5: Fog Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/fog.component.ts`

---

## Batch Execution Protocol

**For Each Batch**:

1. Team-leader assigns batch
2. Developer executes ALL tasks in batch
3. Developer creates ONE commit for entire batch
4. Team-leader verifies batch
