# Tasks - TASK_2025_036

## Marble Sphere Component Extraction

**Total Tasks**: 9 | **Batches**: 3 | **Status**: 3/3 complete

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- `nativeFBM` exists in `tsl-utilities.ts` line 200+: VERIFIED
- `NG_3D_PARENT` token exists in `types/tokens.ts`: VERIFIED
- `OBJECT_ID` token exists in `tokens/object-id.token.ts`: VERIFIED
- TSLFn pattern used in `tsl-utilities.ts` line 351+: VERIFIED
- Component pattern from `metaball.component.ts`: VERIFIED
- Route at `volumetric-caustics` path exists: VERIFIED

### Risks Identified

| Risk                             | Severity | Mitigation                                                  |
| -------------------------------- | -------- | ----------------------------------------------------------- |
| Route update may break bookmarks | LOW      | Keep same route path, just update component                 |
| TSL import timing issues         | LOW      | Follow metaball.component.ts pattern for runtime TSL access |

### Edge Cases to Handle

- [x] Empty/invalid color inputs -> Use defaults from MARBLE_DEFAULTS
- [x] Zero/negative iterations -> Clamp to valid range (8-32)
- [x] Component destroyed before mesh created -> Guard in cleanup

---

## Batch 1: TSL Shader Utilities

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None
**Status**: COMPLETE
**Commit**: 31eb135

| #   | Task                                                 | Status   | Assignee           |
| --- | ---------------------------------------------------- | -------- | ------------------ |
| 1.1 | Create `tsl-marble.ts` with TSL shader utilities     | COMPLETE | frontend-developer |
| 1.2 | Update `shaders/index.ts` to export marble utilities | COMPLETE | frontend-developer |
| 1.3 | Verify build passes with new exports                 | COMPLETE | frontend-developer |

### Task 1.1: Create tsl-marble.ts with TSL shader utilities

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-marble.ts` (CREATE)
**Spec Reference**: implementation-plan.md lines 154-468
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-utilities.ts` lines 351-362

**Quality Requirements**:

- Use TSLFn wrapper pattern (verified at tsl-utilities.ts:70)
- Import `nativeFBM` from `./tsl-utilities`
- Provide TypeScript interfaces for all configs
- Follow JSDoc documentation pattern from existing utilities
- Export: `tslMarbleRaymarch`, `tslGlossyFresnel`, `createMarbleMaterial`, `MarbleMaterialConfig`, `MARBLE_DEFAULTS`

**Implementation Details**:

- `tslMarbleRaymarch(iterations, depth, colorA, colorB, timeScale, noiseScale, smoothing)` -> vec3 colorNode
- `tslGlossyFresnel(power, intensity, color)` -> vec3 emissiveNode
- `createMarbleMaterial(config?)` -> { colorNode, emissiveNode, roughness, metalness }
- Use `THREE.Color` for color conversion to vec3 nodes

---

### Task 1.2: Update shaders/index.ts to export marble utilities

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\index.ts` (MODIFY)
**Spec Reference**: implementation-plan.md line 479
**Pattern to Follow**: Existing export block pattern at lines 14-51

**Quality Requirements**:

- Add exports for `tslMarbleRaymarch`, `tslGlossyFresnel`, `createMarbleMaterial`
- Export `MarbleMaterialConfig` type and `MARBLE_DEFAULTS` constant
- Group exports with descriptive comment (e.g., "// Marble raymarching effects")

**Implementation Details**:

- Add new export block after line 50 (after tslVolumetricRay)
- Use `export { ... } from './tsl-marble';` pattern

---

### Task 1.3: Verify build passes with new exports

**File**: N/A (verification task)
**Command**: `npx nx build @hive-academy/angular-3d`

**Quality Requirements**:

- Build completes without errors
- No TypeScript type errors
- Exports accessible from library public API

---

**Batch 1 Verification Checklist**:

- [x] `tsl-marble.ts` exists at path
- [x] All 5 exports (tslMarbleRaymarch, tslGlossyFresnel, createMarbleMaterial, MarbleMaterialConfig, MARBLE_DEFAULTS) present
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] code-logic-reviewer approved

---

## Batch 2: MarbleSphereComponent

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 1
**Status**: COMPLETE
**Commit**: 0da6aff

| #   | Task                                                   | Status   | Assignee           |
| --- | ------------------------------------------------------ | -------- | ------------------ |
| 2.1 | Create `marble-sphere.component.ts` with signal inputs | COMPLETE | frontend-developer |
| 2.2 | Update `primitives/index.ts` to export component       | COMPLETE | frontend-developer |
| 2.3 | Verify component builds and exports correctly          | COMPLETE | frontend-developer |

### Task 2.1: Create marble-sphere.component.ts with signal inputs

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\marble-sphere.component.ts` (CREATE)
**Spec Reference**: implementation-plan.md lines 483-738
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts` lines 160-451

**Quality Requirements**:

- Use `NG_3D_PARENT` token for parent injection (metaball.component.ts:219)
- Use `DestroyRef` for cleanup (metaball.component.ts:220)
- Use signal-based inputs with `input<T>()` pattern
- Provide OBJECT_ID via provider factory
- Dispose geometry and material on destroy
- Support shadow casting/receiving

**Implementation Details**:

- Selector: `a3d-marble-sphere`
- Inputs: radius, segments, position, roughness, metalness, colorA, colorB, edgeColor, edgeIntensity, edgePower, animationSpeed, iterations, depth, castShadow, receiveShadow
- Create SphereGeometry with configurable radius/segments
- Apply MeshStandardNodeMaterial with marble shader nodes from tsl-marble.ts
- Use effects for reactive position/shadow updates

---

### Task 2.2: Update primitives/index.ts to export component

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts` (MODIFY)
**Spec Reference**: implementation-plan.md line 751
**Pattern to Follow**: Existing export pattern at lines 46-49

**Quality Requirements**:

- Export MarbleSphereComponent alongside other primitive components
- Add descriptive comment for the new export

**Implementation Details**:

- Add `export * from './marble-sphere.component';` after metaball export (line 46)

---

### Task 2.3: Verify component builds and exports correctly

**File**: N/A (verification task)
**Command**: `npx nx build @hive-academy/angular-3d`

**Quality Requirements**:

- Build completes without errors
- MarbleSphereComponent accessible from `@hive-academy/angular-3d`
- No circular dependency warnings

---

**Batch 2 Verification Checklist**:

- [x] `marble-sphere.component.ts` exists at path
- [x] Component has selector `a3d-marble-sphere`
- [x] All inputs defined with signal pattern
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] code-logic-reviewer approved

---

## Batch 3: Hero Scene Example

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 2
**Status**: COMPLETE
**Commit**: 06d3d16

| #   | Task                                                          | Status   | Assignee           |
| --- | ------------------------------------------------------------- | -------- | ------------------ |
| 3.1 | Rename and refactor scene to `marble-hero-scene.component.ts` | COMPLETE | frontend-developer |
| 3.2 | Update route in `app.routes.ts`                               | COMPLETE | frontend-developer |
| 3.3 | Verify demo app builds and scene renders                      | COMPLETE | frontend-developer |

### Task 3.1: Rename and refactor scene to marble-hero-scene.component.ts

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\volumetric-caustics-scene.component.ts` -> `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\marble-hero-scene.component.ts` (RENAME + REWRITE)
**Spec Reference**: implementation-plan.md lines 754-989
**Pattern to Follow**: implementation-plan.md example template

**Quality Requirements**:

- Replace inline raymarching code with `<a3d-marble-sphere>` component
- Rename selectors: `app-marble-hero-content`, `app-marble-hero-scene`
- Rename component classes: `MarbleHeroContentComponent`, `MarbleHeroSceneComponent`
- Add HTML overlay section demonstrating hero pattern
- Keep existing lighting setup (spotlight, point lights)
- Keep auto-rotating orbit controls
- Remove environment map setup (handled internally by component now)
- Keep caustics ground as decoration (optional, can simplify if needed)
- Keep volumetric fog for atmospheric effect (optional)

**Implementation Details**:

- Import `MarbleSphereComponent` from `@hive-academy/angular-3d`
- Use `<a3d-marble-sphere [position]="[0, 0.25, 0]" [colorA]="'#001a13'" [colorB]="'#66e5b3'" [edgeColor]="'#4cd9a8'" />`
- Add hero overlay div with title, subtitle, CTA buttons
- Style overlay with proper z-index layering and pointer-events

---

### Task 3.2: Update route in app.routes.ts

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.routes.ts` (MODIFY)
**Spec Reference**: implementation-plan.md line 999
**Pattern to Follow**: Existing route pattern at lines 142-148

**Quality Requirements**:

- Update import path to new filename
- Update component name in .then() to `MarbleHeroSceneComponent`
- Keep same route path `volumetric-caustics` OR rename to `marble-hero` (prefer keeping path for backward compatibility)
- Update title to "Marble Hero | Angular-3D"

**Implementation Details**:

- Change: `import('./pages/angular-3d-showcase/scenes/volumetric-caustics-scene.component')`
- To: `import('./pages/angular-3d-showcase/scenes/marble-hero-scene.component')`
- Change: `.then((m) => m.VolumetricCausticsSceneComponent)`
- To: `.then((m) => m.MarbleHeroSceneComponent)`

---

### Task 3.3: Verify demo app builds and scene renders

**File**: N/A (verification task)
**Commands**:

- `npx nx build angular-3d-demo`
- `npx nx serve angular-3d-demo` (manual visual verification)

**Quality Requirements**:

- Build completes without errors
- Scene renders marble sphere with animated interior
- HTML overlay displays correctly above 3D canvas
- Auto-rotation works
- No console errors

---

**Batch 3 Verification Checklist**:

- [x] Old file deleted: `volumetric-caustics-scene.component.ts`
- [x] New file exists: `marble-hero-scene.component.ts`
- [x] Route updated in `app.routes.ts`
- [x] Uses `<a3d-marble-sphere>` component (NOT inline shader code)
- [x] HTML overlay section present
- [x] Build passes: `npx nx build angular-3d-demo`
- [x] code-logic-reviewer approved

---

## Completion Criteria

All batches complete when:

1. Library exports new marble shader utilities
2. Library exports MarbleSphereComponent
3. Demo scene uses new component instead of inline shader
4. All builds pass
5. Visual quality matches original scene

---

## Git Commit Plan

| Batch | Commit Message                                                         |
| ----- | ---------------------------------------------------------------------- |
| 1     | `feat(angular-3d): add tsl marble raymarching shader utilities`        |
| 2     | `feat(angular-3d): add marble sphere component with signal inputs`     |
| 3     | `feat(demo): refactor volumetric scene to use marble sphere component` |
