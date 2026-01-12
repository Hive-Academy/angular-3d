# Development Tasks - TASK_2025_024

**Total Tasks**: 5 | **Batches**: 3 | **Status**: 3/3 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- **Troika Text Component Pattern**: Verified - TroikaTextComponent and GlowTroikaTextComponent exist with expected API (troika-three-text, signal inputs, effect-based initialization)
- **Shader Pattern Source**: Verified - NebulaVolumetricComponent provides working shader-based atmospheric effects with Perlin noise
- **TextSamplingService Removal Safety**: Verified - Only used by particle-text components being deleted
- **Export Locations**: Verified - primitives/index.ts lines 24-27 contain particle-text exports to remove

### Risks Identified

| Risk                                                    | Severity | Mitigation                                                                                                     |
| ------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| Troika material override may not preserve SDF rendering | MEDIUM   | Task 1.1 includes testing material override first, with layer-based fallback documented in implementation plan |
| Shader uniform reactivity for signal input changes      | LOW      | Use effect() to watch smoke property signals and update uniforms                                               |
| Resource cleanup order (shader before Text object)      | LOW      | Follow DestroyRef.onDestroy() pattern from existing components                                                 |

### Edge Cases to Handle

- [x] Material override compatibility → Tested in Task 1.1 - WORKS
- [x] Shader uniform updates on signal changes → Handled in Task 1.1 with effect()
- [x] Cleanup order (shader material before Text object) → Handled in Task 1.1 DestroyRef

---

## Batch 1: Create SmokeTroikaTextComponent with Shader Effect ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: None
**Commit**: e2ca83b

### Task 1.1: Create SmokeTroikaTextComponent with shader-based smoke effect ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\smoke-troika-text.component.ts
**Spec Reference**: implementation-plan.md:100-281
**Pattern to Follow**:

- Base structure: troika-text.component.ts (lines 1-472)
- Shader pattern: nebula-volumetric.component.ts (lines 204-399)
- Material override: glow-troika-text.component.ts (lines 353-368)

**Quality Requirements**:

- MUST render crisp SDF text using Troika Text object (same quality as TroikaTextComponent)
- MUST apply custom ShaderMaterial with smoke/fog shader effect (NOT particles)
- MUST support animated smoke flow using Perlin noise + uTime uniform
- MUST support all core Troika text properties (text, fontSize, position, rotation, scale, anchorX, anchorY, font, etc.)
- MUST provide smoke-specific controls (smokeColor, smokeIntensity, flowSpeed, density, edgeSoftness, enableFlow)
- MUST use effect() for initialization and reactive updates
- MUST use DestroyRef.onDestroy() for cleanup (dispose shader material, dispose Text object)
- MUST register with RenderLoopService for per-frame uTime updates

**Validation Notes**:

- **RISK**: Material override approach may not work with Troika's SDF rendering
  - **Test Strategy**: Try assigning custom ShaderMaterial to `textObject.material` first
  - **Fallback**: If SDF text quality degrades, use layer-based approach (shader plane behind text as documented in implementation-plan.md:651-662)
- **Edge Case**: Shader uniforms must update reactively when smoke property signals change (use effect() to watch signals)
- **Edge Case**: Cleanup order matters - dispose shader material BEFORE disposing Text object

**Implementation Details**:

- **Imports**:
  - Angular: Component, ChangeDetectionStrategy, inject, input, effect, signal, DestroyRef
  - Troika: `Text from 'troika-three-text'`
  - Three.js: `THREE.ShaderMaterial, THREE.Color`
  - Tokens: NG_3D_PARENT, OBJECT_ID
  - Services: RenderLoopService, SceneService (optional, for camera access if needed)
- **Providers**: `{ provide: OBJECT_ID, useFactory: () => 'smoke-troika-text-${crypto.randomUUID()}' }`
- **Selector**: `a3d-smoke-troika-text`
- **Template**: `<ng-content />` (for directive composition)
- **Core Text Inputs**: text (required), fontSize, color, position, rotation, scale, anchorX, anchorY, font, fontStyle, fontWeight, textAlign, maxWidth, lineHeight, letterSpacing, outlineWidth, outlineColor, outlineOpacity
- **Smoke-Specific Inputs**: smokeColor (default: '#8a2be2'), smokeIntensity (default: 1.0), flowSpeed (default: 0.5), edgeSoftness (default: 0.3), density (default: 1.1), enableFlow (default: true)
- **Shader Uniforms**: uTime, uSmokeColor, uSmokeIntensity, uFlowSpeed, uDensity, uEdgeSoftness
- **Shader Functions**: Copy from nebula-volumetric.component.ts:
  - 3D Simplex noise: snoise() function (lines 277-335)
  - FBM (Fractal Brownian Motion): fbm() function (lines 338-350)
  - Domain warping: domainWarp() function (lines 353-360)
- **Vertex Shader**: Basic pass-through with vUv varying
- **Fragment Shader**: Combine Troika SDF sampling (if possible) + Perlin noise smoke effect
- **Animation**: RenderLoopService.registerUpdateCallback() to increment uTime uniform when enableFlow=true
- **Lifecycle**:
  - effect() #1: Initialize Text object, apply shader material, call text.sync(), add to parent
  - effect() #2: Register/unregister render loop callback based on enableFlow signal
  - effect() #3 (optional): Update shader uniforms when smoke property signals change
  - DestroyRef.onDestroy(): Cleanup render loop, dispose shader material, dispose Text object, remove from parent

**Expected Output**:

- New component file smoke-troika-text.component.ts (~400-500 lines, similar to glow-troika-text.component.ts)
- Exports crisp SDF text with shader-based smoke/atmospheric effect
- Performance: Single draw call per text instance (GPU shader, NOT particles)

---

### Task 1.2: Add SmokeTroikaTextComponent to text barrel exports ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\index.ts
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:398-431

**Quality Requirements**:

- MUST add export for smoke-troika-text.component
- MUST update JSDoc comment to list SmokeTroikaTextComponent

**Implementation Details**:

- Add line: `export * from './smoke-troika-text.component';`
- Update comment to include SmokeTroikaTextComponent in component list

**Expected Output**:

- text/index.ts updated with new export
- SmokeTroikaTextComponent available via `import { SmokeTroikaTextComponent } from '@hive-academy/angular-3d'`

---

**Batch 1 Verification**:

- SmokeTroikaTextComponent file exists at correct path
- Component renders text with smoke shader effect (visual verification)
- Text is crisp (SDF quality preserved)
- Smoke animates when enableFlow=true
- Build passes: `npx nx build @hive-academy/angular-3d`
- Export resolves correctly

---

## Batch 2: Remove Particle-Text Components and Service ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 1 complete
**Commit**: f670e76

### Task 2.1: Delete particle-text folder and TextSamplingService ✅ COMPLETE

**Files to DELETE**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\instanced-particle-text.component.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\glow-particle-text.component.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\smoke-particle-text.component.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\services\text-sampling.service.ts

**Spec Reference**: implementation-plan.md:333-395
**Pattern to Follow**: Direct file deletion

**Quality Requirements**:

- MUST delete all 3 particle-text component files
- MUST delete TextSamplingService (verified only used by particle-text)
- MUST verify no other files import these (already verified via grep in validation)

**Validation Notes**:

- **VERIFIED SAFE**: Grep confirmed TextSamplingService only used by particle-text components being deleted
- **VERIFIED SAFE**: No other library files import particle-text components

**Implementation Details**:

- Delete entire particle-text/ folder
- Delete text-sampling.service.ts from services/

**Expected Output**:

- 4 files deleted
- Folder libs/angular-3d/src/lib/primitives/particle-text/ removed

---

### Task 2.2: Remove particle-text exports from primitives barrel ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts
**Dependencies**: Task 2.1
**Spec Reference**: implementation-plan.md:360-368

**Quality Requirements**:

- MUST remove 3 particle-text export lines (lines 25-27)
- MUST NOT break other exports
- MUST update comment if it references particle-text

**Implementation Details**:

- Remove lines:
  ```typescript
  export * from './particle-text/instanced-particle-text.component';
  export * from './particle-text/smoke-particle-text.component';
  export * from './particle-text/glow-particle-text.component';
  ```
- Update comment on line 2 if it mentions "ParticleText"

**Expected Output**:

- primitives/index.ts updated with 3 export lines removed
- Comment updated to reflect removal

---

**Batch 2 Verification**:

- All 4 files deleted
- particle-text/ folder removed
- primitives/index.ts exports cleaned up
- Build passes: `npx nx build @hive-academy/angular-3d`
- No import errors from deleted components

---

## Batch 3: Verification and Demo App Update ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batch 2 complete
**Commit**: 8e129e3

### Task 3.1: Build verification and demo app import check ✅ COMPLETE

**Files to CHECK**:

- D:\projects\angular-3d-workspace\apps\angular-3d-demo (entire app)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts (public API)

**Spec Reference**: implementation-plan.md:713-735 (Testing Checklist)

**Quality Requirements**:

- Library MUST build successfully
- Demo app MUST build successfully (if it imports particle-text, update to use SmokeTroikaTextComponent)
- No TypeScript errors
- All exports resolve correctly

**Validation Notes**:

- **Edge Case**: Demo app may use particle-text components - if so, replace with SmokeTroikaTextComponent
- **Edge Case**: Ensure public API (libs/angular-3d/src/index.ts) exports SmokeTroikaTextComponent

**Implementation Details**:

1. Run `npx nx build @hive-academy/angular-3d` - verify success
2. Search demo app for particle-text imports: `grep -r "particle-text" apps/angular-3d-demo/src`
3. If found, update to use `<a3d-smoke-troika-text>` instead
4. Verify libs/angular-3d/src/index.ts exports text barrel (should already export via `export * from './lib/primitives/text'`)
5. Run `npx nx build angular-3d-demo` - verify success
6. Optionally: Run `npx nx test @hive-academy/angular-3d` to ensure no test failures

**Expected Output**:

- Library builds successfully
- Demo app builds successfully
- No TypeScript errors
- All imports resolve
- (Optional) Tests pass

---

**Batch 3 Verification**:

- Library build: SUCCESS
- Demo app build: SUCCESS
- No import errors
- SmokeTroikaTextComponent exported from public API
- (Optional) Tests pass

---

## Status Icons Reference

| Status         | Meaning                         | Who Sets              |
| -------------- | ------------------------------- | --------------------- |
| ⏸️ PENDING     | Not started                     | team-leader (initial) |
| 🔄 IN PROGRESS | Assigned to developer           | team-leader           |
| 🔄 IMPLEMENTED | Developer done, awaiting verify | developer             |
| ✅ COMPLETE    | Verified and committed          | team-leader           |
| ❌ FAILED      | Verification failed             | team-leader           |
