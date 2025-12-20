# Development Tasks - TASK_2025_015

**Task Type**: Frontend (Angular + Three.js)
**Total Tasks**: 28
**Total Batches**: 8
**Batching Strategy**: Layer-based (foundation → directives → components → verification)
**Status**: 7/8 batches complete (87.5%) - Batch 8 IN PROGRESS

---

## Batch 1: Foundation (Store + Tokens) ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 4
**Dependencies**: None
**Estimated Commits**: 1
**Commit SHA**: ee23208c755cebac9709f2b49c938e6a46a17c8c

### Task 1.1: Create SceneGraphStore ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\store\scene-graph.store.ts`
**Specification Reference**: implementation-plan.md:13-209
**Pattern to Follow**: `component-registry.service.ts:93-170`
**Expected Commit Pattern**: `feat(angular-3d): add scene-graph store for object3d registry`

**Quality Requirements**:

- ✅ Injectable with `providedIn: 'root'`
- ✅ Signal-based state (\_scene, \_camera, \_renderer, \_registry)
- ✅ Public computed signals (scene, camera, isReady, meshes, lights)
- ✅ register/update/remove/getObject/queryByType methods
- ✅ Proper disposal with disposeObject helper

**Implementation Details**:

- **Imports**: `Injectable, signal, computed` from `@angular/core`
- **Three.js Types**: Import as types only (`import type { Object3D, Scene }`)
- **Pattern**: Follow `ComponentRegistryService` signal update pattern

---

### Task 1.2: Create OBJECT_ID Token ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\tokens\object-id.token.ts`
**Specification Reference**: implementation-plan.md:217-229
**Pattern to Follow**: `tokens.ts:11-13`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ InjectionToken<string> type
- ✅ JSDoc documentation
- ✅ Exported from index

---

### Task 1.3: Create GEOMETRY_SIGNAL Token ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\tokens\geometry.token.ts`
**Specification Reference**: implementation-plan.md:231-242
**Pattern to Follow**: `tokens.ts:11-13`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ InjectionToken<WritableSignal<BufferGeometry | null>>
- ✅ JSDoc explaining geometry sharing pattern

---

### Task 1.4: Create MATERIAL_SIGNAL Token ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\tokens\material.token.ts`
**Specification Reference**: implementation-plan.md:244-255
**Pattern to Follow**: `tokens.ts:11-13`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ InjectionToken<WritableSignal<Material | null>>
- ✅ JSDoc explaining material sharing pattern

---

**Batch 1 Verification Results**:

- ✅ All 4 files exist at specified paths
- ✅ One git commit for entire batch (ee23208)
- ✅ Build passes: `npx nx build angular-3d`
- ✅ No TypeScript errors
- ✅ Lint passes: `npx nx lint angular-3d` (0 errors, pre-existing warnings only)

---

## Batch 2: Core Directives ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 3
**Dependencies**: Batch 1 complete
**Estimated Commits**: 1
**Commit SHA**: 2b393335a51a2e7e6309cdb14b8fb5a395719289

### Task 2.1: Create MeshDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\mesh.directive.ts`
**Specification Reference**: implementation-plan.md:263-317
**Pattern to Follow**: `float-3d.directive.ts:90-100`
**Expected Commit Pattern**: `feat(angular-3d): add core mesh and transform directives`

**Quality Requirements**:

- ✅ Standalone directive with `[a3dMesh]` selector
- ✅ Provides GEOMETRY_SIGNAL and MATERIAL_SIGNAL
- ✅ Creates THREE.Mesh when both signals resolve
- ✅ Registers with SceneGraphStore
- ✅ Cleanup via DestroyRef

---

### Task 2.2: Create TransformDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\transform.directive.ts`
**Specification Reference**: implementation-plan.md:319-352
**Pattern to Follow**: `float-3d.directive.ts:90-100`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ position/rotation/scale inputs
- ✅ Single effect updating store
- ✅ Injects OBJECT_ID from parent

---

### Task 2.3: Create StandardMaterialDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\standard-material.directive.ts`
**Specification Reference**: implementation-plan.md:400-453
**Pattern to Follow**: `float-3d.directive.ts:90-100`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ color/wireframe/metalness/roughness inputs
- ✅ Creates MeshStandardMaterial
- ✅ Sets MATERIAL_SIGNAL
- ✅ Updates store on property changes

---

**Batch 2 Verification Results**:

- ✅ All 3 files exist at specified paths
- ✅ One git commit for entire batch (2b39333)
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Lint passes: `npx nx lint angular-3d`

---

## Batch 3: Geometry Directives ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 5
**Dependencies**: Batch 2 complete
**Estimated Commits**: 1
**Commit SHA**: 014876d99e415db010f16a74058d9a945c75e6f5

### Task 3.1: Create BoxGeometryDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\geometries\box-geometry.directive.ts`
**Specification Reference**: implementation-plan.md:360-387
**Pattern to Follow**: implementation-plan.md:362-386
**Expected Commit Pattern**: `feat(angular-3d): add geometry directives`

**Quality Requirements**:

- ✅ args input for [width, height, depth]
- ✅ Creates BoxGeometry and sets GEOMETRY_SIGNAL

---

### Task 3.2: Create CylinderGeometryDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\geometries\cylinder-geometry.directive.ts`
**Specification Reference**: implementation-plan.md:391
**Pattern to Follow**: Task 3.1
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ args input for [radiusTop, radiusBottom, height, radialSegments]
- ✅ Creates CylinderGeometry and sets GEOMETRY_SIGNAL

---

### Task 3.3: Create TorusGeometryDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\geometries\torus-geometry.directive.ts`
**Specification Reference**: implementation-plan.md:392
**Pattern to Follow**: Task 3.1
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ args input for [radius, tube, radialSegments, tubularSegments]
- ✅ Creates TorusGeometry and sets GEOMETRY_SIGNAL

---

### Task 3.4: Create SphereGeometryDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\geometries\sphere-geometry.directive.ts`
**Specification Reference**: implementation-plan.md:393
**Pattern to Follow**: Task 3.1
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ args input for [radius, widthSegments, heightSegments]
- ✅ Creates SphereGeometry and sets GEOMETRY_SIGNAL

---

### Task 3.5: Create PolyhedronGeometryDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\geometries\polyhedron-geometry.directive.ts`
**Specification Reference**: implementation-plan.md:394
**Pattern to Follow**: Task 3.1
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ type input (icosahedron/dodecahedron/octahedron)
- ✅ args input for [radius, detail]
- ✅ Creates appropriate geometry and sets GEOMETRY_SIGNAL

---

**Batch 3 Verification Results**:

- ✅ All 5 files exist in geometries folder
- ✅ One git commit for entire batch (014876d)
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Lint passes: `npx nx lint angular-3d`

---

## Batch 4: Proof of Concept (BoxComponent + Scene) ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 3
**Dependencies**: Batch 3 complete
**Estimated Commits**: 1
**Commit SHA**: cb7dc4c4aa395039291c615861a96e69bce7a2cc

### Task 4.1: Refactor BoxComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\box.component.ts`
**Specification Reference**: implementation-plan.md:461-498
**Pattern to Follow**: implementation-plan.md:467-497
**Expected Commit Pattern**: `refactor(angular-3d): convert box component to directive-first pattern`

**Quality Requirements**:

- ✅ Remove ALL Three.js imports
- ✅ Add hostDirectives composition
- ✅ Provide OBJECT_ID
- ✅ Zero effects in component
- ✅ ~35 lines (down from 153) - ACHIEVED: 46 lines (70% reduction)

---

### Task 4.2: Update Scene3dComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts`
**Specification Reference**: implementation-plan.md:562-579
**Pattern to Follow**: implementation-plan.md:570-578
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Inject SceneGraphStore
- ✅ Call sceneStore.initScene() after creation
- ✅ No breaking changes to existing API

---

### Task 4.3: Update Library Exports ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts`
**Specification Reference**: N/A
**Pattern to Follow**: Existing exports pattern in file
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Export SceneGraphStore (from lib/store/index.ts)
- ✅ Export all new tokens (already exported from lib/tokens/index.ts)
- ✅ Export all new directives (mesh, transform, geometries, materials from lib/directives/index.ts)
- ✅ Uncommented store and tokens in main index.ts

---

**Batch 4 Verification Results**:

- ✅ All files modified correctly
- ✅ One git commit for entire batch (cb7dc4c)
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Lint passes: `npx nx lint angular-3d`
- ✅ BoxComponent successfully refactored (153 → 46 lines, 70% reduction)
- ✅ SceneGraphStore initialized in Scene3dComponent
- ✅ All exports added to index.ts

---

## Batch 5: Animation Directives ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 2
**Dependencies**: Batch 4 complete
**Estimated Commits**: 1
**Commit SHA**: 8f4f51c08e9e312da58335875937e95ff2704a95

### Task 5.1: Update Float3dDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\float-3d.directive.ts`
**Specification Reference**: implementation-plan.md:509-554
**Pattern to Follow**: implementation-plan.md:518-553
**Expected Commit Pattern**: `refactor(angular-3d): update animation directives to use store pattern`

**Quality Requirements**:

- ✅ Remove MeshProvider injection
- ✅ Inject SceneGraphStore and OBJECT_ID (skipSelf)
- ✅ Use computed signal for mesh access
- ✅ Remove ngAfterViewInit lifecycle hook
- ✅ Keep existing animation methods

---

### Task 5.2: Update Rotate3dDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\rotate-3d.directive.ts`
**Specification Reference**: implementation-plan.md:556-558
**Pattern to Follow**: Task 5.1 pattern
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Same pattern as Float3dDirective
- ✅ Remove MeshProvider injection
- ✅ Use computed signal for mesh access

---

**Batch 5 Verification Results**:

- ✅ Both files updated
- ✅ One git commit for entire batch (8f4f51c)
- ✅ Float3dDirective using SceneGraphStore + OBJECT_ID (skipSelf)
- ✅ Rotate3dDirective using SceneGraphStore + OBJECT_ID (skipSelf)
- ✅ Both directives use computed signals for object access
- ✅ MeshProvider injection removed from both directives

---

## Batch 6: Core Primitive Components ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 4
**Dependencies**: Batch 5 complete
**Estimated Commits**: 1
**Commit SHA**: b684464e3de2dd94ed5a09d68019d910d80bae1f

### Task 6.1: Refactor CylinderComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\cylinder.component.ts`
**Specification Reference**: Use BoxComponent as pattern
**Pattern to Follow**: Task 4.1 (BoxComponent)
**Expected Commit Pattern**: `refactor(angular-3d): convert core primitives to directive-first pattern`

**Quality Requirements**:

- ✅ Remove Three.js imports
- ✅ hostDirectives with CylinderGeometryDirective
- ✅ Provide OBJECT_ID

---

### Task 6.2: Refactor TorusComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\torus.component.ts`
**Specification Reference**: Use BoxComponent as pattern
**Pattern to Follow**: Task 4.1 (BoxComponent)
**Expected Commit Pattern**: (included in batch commit)

---

### Task 6.3: Refactor PolyhedronComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\polyhedron.component.ts`
**Specification Reference**: Use BoxComponent as pattern
**Pattern to Follow**: Task 4.1 (BoxComponent)
**Expected Commit Pattern**: (included in batch commit)

---

### Task 6.4: Refactor GroupComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\group.component.ts`
**Specification Reference**: Create GroupDirective pattern
**Pattern to Follow**: MeshDirective (creates Group instead of Mesh)
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Create GroupDirective that creates THREE.Group
- ✅ Register with store type='group'

---

**Batch 6 Verification Results**:

- ✅ All 4 components refactored
- ✅ One git commit for entire batch (b684464)
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Lint passes: `npx nx lint angular-3d` (0 errors, 2 pre-existing warnings)
- ✅ CylinderComponent: 119 → 50 lines (58% reduction)
- ✅ TorusComponent: 122 → 50 lines (59% reduction)
- ✅ PolyhedronComponent: 134 → 58 lines (57% reduction)
- ✅ GroupComponent: 92 → 41 lines (55% reduction)
- ✅ GroupDirective created and exported

---

## Batch 7: Light Components ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 5
**Dependencies**: Batch 6 complete
**Estimated Commits**: 1
**Commit SHA**: ef4eadbed39577c946ec45bf7dd394cec942760c

### Task 7.1: Create LightDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\light.directive.ts`
**Specification Reference**: New (based on MeshDirective pattern)
**Pattern to Follow**: MeshDirective
**Expected Commit Pattern**: `refactor(angular-3d): convert light components to directive-first pattern`

**Quality Requirements**:

- ✅ Base directive for light creation
- ✅ Registers with store type='light'

---

### Task 7.2: Refactor AmbientLightComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\lights\ambient-light.component.ts`
**Specification Reference**: Use BoxComponent pattern
**Pattern to Follow**: Task 4.1
**Expected Commit Pattern**: (included in batch commit)

---

### Task 7.3: Refactor PointLightComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\lights\point-light.component.ts`
**Specification Reference**: Use BoxComponent pattern
**Pattern to Follow**: Task 4.1
**Expected Commit Pattern**: (included in batch commit)

---

### Task 7.4: Refactor DirectionalLightComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\lights\directional-light.component.ts`
**Specification Reference**: Use BoxComponent pattern
**Pattern to Follow**: Task 4.1
**Expected Commit Pattern**: (included in batch commit)

---

### Task 7.5: Refactor SpotLightComponent ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\lights\spot-light.component.ts`
**Specification Reference**: Use BoxComponent pattern
**Pattern to Follow**: Task 4.1
**Expected Commit Pattern**: (included in batch commit)

---

**Batch 7 Verification Results**:

- ✅ All 5 light directive files created (LightDirective + 4 specific light directives)
- ✅ All 4 light components refactored to directive-first pattern
- ✅ One git commit for entire batch (ef4eadb)
- ✅ directives/index.ts updated with light directive exports
- ✅ AmbientLightComponent: 38 lines (clean composition)
- ✅ PointLightComponent: 53 lines (clean composition)
- ✅ DirectionalLightComponent: 52 lines (clean composition)
- ✅ SpotLightComponent: 69 lines (clean composition)
- ✅ All components use hostDirectives pattern (NO Three.js imports)

---

## Batch 8: Final Verification & Cleanup 🔄 IN PROGRESS

**Assigned To**: frontend-developer
**Tasks in Batch**: 3
**Dependencies**: Batch 7 complete
**Estimated Commits**: 1

### Task 8.1: Run Full Test Suite 🔄 IN PROGRESS

**File(s)**: N/A (verification task)
**Specification Reference**: implementation-plan.md:621-658
**Expected Commit Pattern**: `chore(angular-3d): fix test failures after architecture migration`

**Quality Requirements**:

- ✅ `npx nx test angular-3d` passes
- ✅ Fix any failing tests

---

### Task 8.2: Browser Verification 🔄 IN PROGRESS

**File(s)**: N/A (verification task)
**Specification Reference**: implementation-plan.md:638-647

**Quality Requirements**:

- ✅ Navigate to `http://localhost:4200/angular-3d`
- ✅ All 3D scenes render
- ✅ No console errors
- ✅ Animations working

---

### Task 8.3: Delete Obsolete Code 🔄 IN PROGRESS

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\types\mesh-provider.ts`
**Specification Reference**: N/A (cleanup)
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Remove MeshProvider interface
- ✅ Remove MESH_PROVIDER token
- ✅ Update any imports that reference it

---

**Batch 8 Verification Requirements**:

- ✅ All tests pass
- ✅ Demo app works
- ✅ No obsolete code remaining
- ✅ Final commit for batch

---

## Batch Execution Protocol

**For Each Batch**:

1. Team-leader assigns entire batch to developer
2. Developer executes ALL tasks in batch (in order)
3. Developer stages files progressively (`git add` after each task)
4. Developer creates ONE commit for entire batch
5. Developer returns with batch git commit SHA
6. Team-leader verifies entire batch
7. If verification passes: Assign next batch
8. If verification fails: Create fix batch

**Commit Strategy**:

- ONE commit per batch (not per task)
- Commit message lists primary change
- Avoids running pre-commit hooks multiple times

**Completion Criteria**:

- All batch statuses are "✅ COMPLETE"
- All batch commits verified
- All files exist
- Build passes
- Demo app renders 3D scenes
