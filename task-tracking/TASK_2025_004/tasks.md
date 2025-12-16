# Development Tasks - TASK_2025_004

**Task Type**: Backend (service layer)
**Total Tasks**: 7
**Total Batches**: 2
**Batching Strategy**: Layer-based (services first, then tests)
**Status**: 1/2 batches complete (50%)

---

## Batch 1: Loader Services & Inject Functions ✅ COMPLETE

**Git Commit**: `2310701` - feat(angular-3d): add loader utilities - batch 1

**Assigned To**: backend-developer
**Tasks in Batch**: 4
**Dependencies**: None
**Estimated Commits**: 1

### Task 1.1: Create TextureLoaderService ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/loaders/texture-loader.service.ts`
**Specification Reference**: implementation-plan.md:17-70
**Pattern to Follow**: `render-loop/animation.service.ts:89-94`
**Expected Commit Pattern**: `feat(angular-3d): add texture loader service with caching`

**Quality Requirements**:

- ✅ @Injectable({ providedIn: 'root' })
- ✅ Map-based URL caching
- ✅ Signal-based load state (data, loading, error, progress)
- ✅ load(), clearCache(), getCached() methods
- ✅ Proper texture disposal on cache clear

**Implementation Details**:

- **Imports**: `Injectable, signal` from `@angular/core`, `THREE` from `three`
- **Interface**: `TextureLoadState` with readonly properties
- **Methods**: See implementation-plan.md template

---

### Task 1.2: Create injectTextureLoader ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/loaders/inject-texture-loader.ts`
**Dependencies**: Task 1.1 (TextureLoaderService)
**Specification Reference**: implementation-plan.md:73-104
**Pattern to Follow**: Angular's composable `inject()` pattern
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Function returns TextureLoaderResult interface
- ✅ Uses effect() to watch URL signal
- ✅ Implements stale request protection
- ✅ Auto-cleanup via DestroyRef
- ✅ Returns signal accessors for data, loading, error

**Implementation Details**:

- **Imports**: `inject, DestroyRef, signal, effect` from `@angular/core`
- **Pattern**: Use requestId counter for stale protection

---

### Task 1.3: Create GltfLoaderService ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/loaders/gltf-loader.service.ts`
**Dependencies**: None (parallel with Task 1.1)
**Specification Reference**: implementation-plan.md:114-167
**Pattern to Follow**: `store/angular-3d-state.store.ts:194-199`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ @Injectable({ providedIn: 'root' })
- ✅ Support for Draco compression (DRACOLoader)
- ✅ Support for MeshOpt compression (MeshoptDecoder)
- ✅ Map-based caching with options hash
- ✅ Promise-based load API

**Implementation Details**:

- **Imports**: `GLTFLoader, GLTF, DRACOLoader` from `three-stdlib`
- **Interfaces**: `GltfLoaderOptions`, `GltfLoadState`
- **Cache Key**: `${url}:${JSON.stringify(options)}`

---

### Task 1.4: Create injectGltfLoader ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/loaders/inject-gltf-loader.ts`
**Dependencies**: Task 1.3 (GltfLoaderService)
**Specification Reference**: implementation-plan.md:171-204
**Pattern to Follow**: Same as injectTextureLoader
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Function returns GltfLoaderResult interface
- ✅ Uses effect() to watch URL signal
- ✅ Supports both static and signal-based options
- ✅ Provides scene() accessor for convenience
- ✅ Auto-cleanup via DestroyRef

---

**Batch 1 Verification Requirements**:

- ✅ All 4 files exist at specified paths
- ✅ One git commit for entire batch
- ✅ TypeScript compilation passes (no errors)
- ✅ No lint errors: `npx nx lint angular-3d`

---

## Batch 2: Unit Tests & Exports 🔄 IN PROGRESS

**Assigned To**: backend-developer
**Tasks in Batch**: 3
**Dependencies**: Batch 1 complete
**Estimated Commits**: 1

### Task 2.1: Create TextureLoaderService Tests 🔄 IN PROGRESS

**File(s)**: `libs/angular-3d/src/lib/loaders/texture-loader.service.spec.ts`
**Dependencies**: Task 1.1 (TextureLoaderService)
**Specification Reference**: implementation-plan.md:214-250
**Pattern to Follow**: `render-loop/animation.service.spec.ts:1-25`
**Expected Commit Pattern**: `test(angular-3d): add loader service unit tests`

**Quality Requirements**:

- ✅ Jest mock for THREE.TextureLoader
- ✅ Test: service creation
- ✅ Test: load returns texture
- ✅ Test: caching works (same URL returns cached)
- ✅ Test: clearCache disposes textures
- ✅ Test: error handling

---

### Task 2.2: Create GltfLoaderService Tests 🔄 IN PROGRESS

**File(s)**: `libs/angular-3d/src/lib/loaders/gltf-loader.service.spec.ts`
**Dependencies**: Task 1.3 (GltfLoaderService)
**Specification Reference**: implementation-plan.md:254-292
**Pattern to Follow**: `render-loop/animation.service.spec.ts:1-25`
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Jest mock for three-stdlib (GLTFLoader, DRACOLoader)
- ✅ Test: service creation
- ✅ Test: load returns GLTF
- ✅ Test: Draco loader integration
- ✅ Test: caching with options hash
- ✅ Test: error handling

---

### Task 2.3: Update Module Exports ✅ COMPLETE (done in Batch 1)

**File(s)**: `libs/angular-3d/src/lib/loaders/index.ts`
**Dependencies**: All previous tasks
**Specification Reference**: implementation-plan.md:302-323
**Pattern to Follow**: `render-loop/index.ts` export pattern
**Expected Commit Pattern**: (included in batch commit)

**Quality Requirements**:

- ✅ Export TextureLoaderService and TextureLoadState
- ✅ Export GltfLoaderService, GltfLoaderOptions, GltfLoadState
- ✅ Export injectTextureLoader and TextureLoaderResult
- ✅ Export injectGltfLoader and GltfLoaderResult
- ✅ Remove placeholder export

---

**Batch 2 Verification Requirements**:

- ✅ All 3 files exist at specified paths
- ✅ One git commit for entire batch
- ✅ Tests pass: `npx nx test angular-3d --skip-nx-cache --no-watch`
- ✅ Lint passes: `npx nx lint angular-3d`
- ✅ Build passes: `npx nx build angular-3d`

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
- Commit message lists primary changes
- Reduces pre-commit hook execution

**Completion Criteria**:

- All batch statuses are "✅ COMPLETE"
- All batch commits verified
- All files exist
- Build passes
