# Development Tasks - TASK_2025_031

**Task Type**: Frontend (Angular 3D Library)
**Total Tasks**: 14 | **Batches**: 5 | **Status**: 5/5 complete (100%)
**Batching Strategy**: Layer-based (Foundation → Simple → Complex → Infrastructure → Polish)

---

## Plan Validation Summary

**Validation Status**: ✅ PASSED WITH RISKS

### Assumptions Verified

- ✅ TSL auto-transpiles to WGSL/GLSL → Verified in Three.js docs
- ✅ `mx_fractal_noise_*` functions available in `three/tsl` → Verified in research
- ✅ `THREE.PostProcessing` works with `WebGPURenderer` → Verified in docs
- ✅ Existing `tsl-utilities.ts` can be extended → Verified in codebase

### Risks Identified

| Risk                                         | Severity | Mitigation                                                      |
| -------------------------------------------- | -------- | --------------------------------------------------------------- |
| MX noise visual difference from GLSL simplex | Medium   | Parameter tuning in Task 1.2, visual comparison in verification |
| Ray marching performance on WebGL fallback   | High     | Reduce march steps in Task 4.2, add LOD detection               |
| SSAO unavailable in native TSL               | Low      | Graceful disable in Task 5.4                                    |
| PostProcessing API may change                | Medium   | Abstraction layer in Task 5.1                                   |

### Edge Cases to Handle

- [ ] WebGL fallback rendering → Verify in Batch 2+ verification
- [ ] Mobile GPU performance for ray marching → LOD in Task 4.2
- [ ] Empty text input to BubbleText → Handled in existing code (no change)
- [ ] Missing textures in CloudLayer → Handled in existing code (no change)

---

## Batch 1: TSL Utilities Enhancement ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: None
**Estimated Commits**: 1 (one commit per batch)
**Commit**: 189bf2d

### Task 1.1: Extend TSL Utilities with MaterialX Noise ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-utilities.ts`  
**Specification Reference**: implementation-plan.md:L95-145  
**Pattern to Follow**: tsl-utilities.ts:85-127 (existing noise patterns)  
**Expected Commit Pattern**: `feat(angular-3d): add materialx noise functions to tsl utilities`

**Quality Requirements**:

- ✅ Import `mx_noise_vec3`, `mx_fractal_noise_float`, `mx_fractal_noise_vec3` from `three/tsl`
- ✅ Create `domainWarp` function using native MX noise
- ✅ Create `cloudDensity` function with soft radial falloff
- ✅ Maintain backward compatibility with existing exports
- ✅ No GLSL strings - pure TSL nodes

**Implementation Details**:

- **Imports to Add**: `mx_noise_vec3`, `mx_fractal_noise_float`, `mx_fractal_noise_vec3`, `Loop`
- **New Functions**: `domainWarp`, `cloudDensity`, `tslFresnel`, `tslIridescence`
- **Pattern**: Use `Fn()` wrapper for all TSL functions

---

### Task 1.2: Add TSL Fresnel and Iridescence Effects ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-utilities.ts`  
**Specification Reference**: implementation-plan.md:L148-165  
**Dependencies**: Task 1.1 (extends same file)  
**Pattern to Follow**: tsl-utilities.ts:150-165 (existing fresnel pattern)  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ `tslFresnel(power, intensity, bias)` → Returns rim lighting effect
- ✅ `tslIridescence(rimValue, intensity)` → Returns rainbow color shift
- ✅ Uses `normalLocal`, `cameraPosition`, `positionWorld` from `three/tsl`
- ✅ Matches visual quality of existing GLSL fresnel

**Validation Notes**:

- ⚠️ RISK: Verify fresnel output matches GLSL version visually
- Test with BubbleText component in Batch 2

---

**Batch 1 Verification Requirements**:

- ✅ File exists at `libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts`
- ✅ All new functions exported
- ✅ Build passes: `npx nx build angular-3d`
- ✅ No TypeScript errors
- ✅ Existing tests still pass: `npx nx test angular-3d`

---

## Batch 2: Simple Component Migrations ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 1 complete
**Estimated Commits**: 1
**Commit**: 8d7837f

### Task 2.1: Migrate BubbleText to TSL Material ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\bubble-text.component.ts`  
**Specification Reference**: implementation-plan.md:L175-225  
**Pattern to Follow**: tsl-utilities.ts (tslFresnel, tslIridescence)  
**Expected Commit Pattern**: `feat(angular-3d): migrate bubble-text to tsl material`

**Quality Requirements**:

- ✅ Replace `THREE.ShaderMaterial` with `THREE.MeshStandardNodeMaterial`
- ✅ Use `tslFresnel` and `tslIridescence` from utilities
- ✅ Configure `colorNode`, `opacityNode`
- ✅ Maintain all existing inputs (bubbleColor, opacity, etc.)
- ✅ Visual parity with GLSL version
- ✅ Works on both WebGPU and WebGL

**Implementation Details**:

- **Import Changes**: Add `MeshStandardNodeMaterial` from `three/webgpu`
- **Import Changes**: Add `tslFresnel`, `tslIridescence` from `../shaders/tsl-utilities`
- **Remove**: 45 lines of GLSL shader strings
- **Method to Modify**: `createBubbleShaderMaterial()` → `createBubbleMaterial()`

---

### Task 2.2: Migrate CloudLayer to TSL Material ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\cloud-layer.component.ts`  
**Specification Reference**: implementation-plan.md:L230-265  
**Pattern to Follow**: tsl-utilities.ts (applyFog, clampForBloom)  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Replace `THREE.ShaderMaterial` with `THREE.SpriteNodeMaterial`
- ✅ Use `applyFog` and `clampForBloom` from utilities
- ✅ Maintain texture-based cloud rendering
- ✅ Preserve fog effect with configurable parameters
- ✅ Visual parity with GLSL version

**Implementation Details**:

- **Import Changes**: Add `SpriteNodeMaterial` from `three/webgpu`
- **Import Changes**: Add `texture`, `uv`, `positionWorld` from `three/tsl`
- **Line Range to Modify**: L99-200 (material creation)

---

### Task 2.3: Update Shaders Index Export ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\index.ts`  
**Specification Reference**: implementation-plan.md (file structure section)  
**Dependencies**: Task 1.1, Task 1.2  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Export all new TSL utility functions
- ✅ Update documentation comments
- ✅ Remove deprecated GLSL references from comments

---

**Batch 2 Verification Requirements**:

- ✅ BubbleText renders without console errors
- ✅ CloudLayer renders with fog effect
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Visual spot-check in demo app: `npx nx serve angular-3d-demo`
- ✅ Works in Chrome (WebGPU) AND Firefox (WebGL fallback)

---

## Batch 3: Complex Volumetric Migrations ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 2 complete
**Estimated Commits**: 1
**Commit**: 8ef3c2e

### Task 3.1: Migrate NebulaVolumetric to TSL Material ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts`  
**Specification Reference**: implementation-plan.md:L275-340  
**Pattern to Follow**: tsl-utilities.ts (cloudDensity, domainWarp, radialFalloff)  
**Expected Commit Pattern**: `feat(angular-3d): migrate nebula-volumetric to tsl`

**Quality Requirements**:

- ✅ Replace `THREE.ShaderMaterial` with `THREE.MeshBasicNodeMaterial`
- ✅ Replace GLSL simplex noise with `mx_fractal_noise_vec3`
- ✅ Replace GLSL FBM with `cloudDensity` utility
- ✅ Use `domainWarp` for organic tendrils
- ✅ Remove 300+ lines of GLSL shader strings
- ✅ Maintain all inputs (primaryColor, secondaryColor, tertiaryColor, etc.)
- ✅ Animation via uniform updates in render loop

**Implementation Details**:

- **Import Changes**: Add `MeshBasicNodeMaterial` from `three/webgpu`
- **Import Changes**: Add `cloudDensity`, `domainWarp`, `radialFalloff` from `./shaders/tsl-utilities`
- **Line Range to Modify**: L258-525 (shader material and GLSL shaders)
- **Delete**: `vertexShader` and `fragmentShader` string properties

**Validation Notes**:

- ⚠️ RISK: MX noise may produce slightly different visual texture
- Parameter tuning may be needed for visual parity
- Test with multiple color combinations

---

### Task 3.2: Migrate SmokeTroikaText to TSL Material ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\smoke-troika-text.component.ts`  
**Specification Reference**: implementation-plan.md:L345-360  
**Pattern to Follow**: tsl-utilities.ts (simpleFBM, cloudDensity)  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Replace `THREE.ShaderMaterial` with TSL-based material
- ✅ Use `mx_fractal_noise_float` for smoke distortion
- ✅ Apply noise-based opacity modulation
- ✅ Maintain smoke animation effect
- ✅ Visual parity with GLSL version

**Implementation Details**:

- **Line Range to Modify**: L348-520 (smoke material)
- **Properties to Remove**: `smokeMaterial` as `THREE.ShaderMaterial`

---

### Task 3.3: Migrate Nebula Component (CPU Noise to TSL) ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula.component.ts`  
**Specification Reference**: implementation-plan.md (component analysis)  
**Pattern to Follow**: tsl-utilities.ts (domainWarp, cloudDensity)  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Replace CPU canvas texture generation with TSL procedural material
- ✅ Use `SpriteNodeMaterial` with procedural color
- ✅ Eliminate CPU-based FBM and turbulence calculations
- ✅ Maintain color palette support
- ✅ Significant performance improvement (GPU vs CPU noise)

**Implementation Details**:

- **Current**: Uses `CanvasTexture` with CPU-computed FBM
- **Target**: Use `SpriteNodeMaterial` with `mx_fractal_noise_vec3` colorNode
- **Line Range**: L120-300 (texture generation methods)

---

**Batch 3 Verification Requirements**:

- ✅ NebulaVolumetric renders with soft glow effects
- ✅ SmokeTroikaText renders with smoke animation
- ✅ Nebula renders with procedural colors (no canvas textures)
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Performance check: FPS >= 45 in demo scenes
- ✅ Visual spot-check in demo app

---

## Batch 4: Metaball TSL Migration ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 3 complete
**Estimated Commits**: 1
**Commit**: 76bd872

> ⚠️ **HIGH COMPLEXITY BATCH**: Metaball has 600+ lines of GLSL ray marching.
> This batch may take 15-20 hours. Consider splitting if needed.

### Task 4.1: Create TSL Ray Marching Utilities ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-raymarching.ts`
**Specification Reference**: implementation-plan.md:L365-395
**Pattern to Follow**: Three.js webgpu_volume_cloud example
**Expected Commit Pattern**: `feat(angular-3d): add tsl ray marching utilities`

**Quality Requirements**:

- ✅ Create `tslSphereDistance(point, center, radius)` SDF function
- ✅ Create `tslSmoothUnion(d1, d2, k)` for smooth blending
- ✅ Create `tslRayMarch(origin, direction, sceneSDF, steps)` loop using `Loop` node
- ✅ Create `tslNormal(point, sdf, epsilon?)` for normal calculation
- ✅ All functions use pure TSL nodes
- ✅ Added bonus: `tslAmbientOcclusion` and `tslSoftShadow` for lighting effects

**Implementation Details**:

- **New File**: Created `tsl-raymarching.ts` (350+ lines)
- **Imports Used**: `Fn`, `Loop`, `If`, `Break`, `float`, `vec3`, `vec4`, `normalize`, etc.
- **Reference**: Three.js `webgpu_volume_cloud` example for Loop pattern
- **Exports**: All functions exported via `shaders/index.ts`

---

### Task 4.2: Migrate Metaball SDF and Lighting to TSL ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts`
**Specification Reference**: implementation-plan.md:L365-395
**Dependencies**: Task 4.1
**Pattern to Follow**: tsl-raymarching.ts (new utilities)
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Port metaball SDF evaluation to TSL (all 10 metaballs + 4 fixed spheres)
- ✅ Port lighting calculation (ambient, diffuse, specular, fresnel) to TSL
- ✅ Port cursor glow effect to TSL
- ✅ Maintain all 6 presets (moody, cosmic, neon, sunset, holographic, minimal)
- ✅ Maintain all inputs (sphereCount, smoothness, animationSpeed, etc.)
- ✅ Adaptive step count: 64 (WebGPU), 32 (WebGL fallback), 16 (mobile)

**Implementation Details**:

- **Lines Replaced**: L656-L1020 (365 lines of GLSL vertex/fragment shaders)
- **New Method**: `createTSLMaterial()` - 280 lines of TSL shader logic
- **SDF Functions**: Uses `tslSphereDistance`, `tslSmoothUnion` from utilities
- **Ray Marching**: Uses `tslRayMarch` with adaptive step counts
- **Lighting**: Uses `tslNormal`, `tslAmbientOcclusion`, `tslSoftShadow`
- **Uniform Updates**: All uniforms converted to TSL uniform nodes

**Validation Notes**:

- ⚠️ Performance: Adaptive step counts implemented (64/32/16)
- ⚠️ AO samples: 6 (desktop), 3 (low-power)
- ⚠️ Soft shadows: Disabled on low-power via reduced iterations

---

### Task 4.3: Update Metaball Material Creation ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts`
**Specification Reference**: implementation-plan.md:L365-395
**Dependencies**: Task 4.2
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Replace `THREE.ShaderMaterial` with `MeshBasicNodeMaterial`
- ✅ Configure `colorNode` with TSL ray marching shader
- ✅ Update `createMetaballMesh()` method with TSL uniforms
- ✅ Ensure uniform updates work in render loop (all effects updated)
- ✅ Remove 365+ lines of GLSL shader strings (vertexShader, getFragmentShader)

---

**Batch 4 Verification Requirements**:

- ✅ Metaball renders with all presets working
- ✅ Mouse interaction (cursor glow) works
- ✅ Animation smooth at >= 45 FPS on desktop
- ✅ Build passes: `npx nx build angular-3d`
- ✅ WebGL fallback works (verify in Firefox)
- ✅ No console errors

---

## Batch 5: Post-Processing Native Migration ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 4 complete
**Estimated Commits**: 1

### Task 5.1: Migrate EffectComposerService to Native PostProcessing ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effect-composer.service.ts`  
**Specification Reference**: implementation-plan.md:L405-470  
**Pattern to Follow**: Three.js PostProcessing docs  
**Expected Commit Pattern**: `feat(angular-3d): migrate to native webgpu postprocessing`

**Quality Requirements**:

- ✅ Replace `EffectComposer` from `three-stdlib` with `THREE.PostProcessing`
- ✅ Replace `RenderPass` with `pass()` from `three/tsl`
- ✅ Create `addBloom(config)` method using `bloom()` node
- ✅ Create `addDepthOfField(config)` method using `dof()` node
- ✅ Remove `FlipShader` (native handles orientation)
- ✅ Update `render()` method for new API
- ✅ Maintain declarative component API

**Implementation Details**:

- **Imports to Remove**: `EffectComposer`, `RenderPass`, `ShaderPass` from `three-stdlib`
- **Imports to Add**: `pass`, `bloom`, `dof` from `three/tsl`
- **New Property**: `postProcessing: THREE.PostProcessing`
- **New Map**: `effectNodes: Map<string, TSLNode>` for effect chaining

---

### Task 5.2: Migrate BloomEffect to TSL Bloom Node ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\bloom-effect.component.ts`  
**Specification Reference**: implementation-plan.md:L475-490  
**Dependencies**: Task 5.1  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Remove `UnrealBloomPass` import from `three-stdlib`
- ✅ Use `EffectComposerService.addBloom()` with TSL bloom node
- ✅ Update effect on input changes via `effect()`
- ✅ Maintain all existing inputs (threshold, strength, radius)

---

### Task 5.3: Migrate DOFEffect to TSL DOF Node ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\dof-effect.component.ts`  
**Specification Reference**: implementation-plan.md:L492-505  
**Dependencies**: Task 5.1  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ Remove `BokehPass` import from `three-stdlib`
- ✅ Use `EffectComposerService.addDepthOfField()` with TSL dof node
- ✅ Maintain all existing inputs (focus, aperture, maxBlur)

---

### Task 5.4: Update ColorGrading and Handle SSAO ✅ COMPLETE

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\color-grading-effect.component.ts`  
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\ssao-effect.component.ts`  
**Specification Reference**: implementation-plan.md:L507-525  
**Dependencies**: Task 5.1  
**Expected Commit Pattern**: (part of batch commit)

**Quality Requirements**:

- ✅ ColorGrading: Implement using TSL `saturation()`, `contrast()`, `brightness()`
- ✅ SSAO: Add graceful disable with console warning
- ✅ SSAO: Document that native TSL doesn't support SSAO
- ✅ SSAO: Keep component but make it no-op in WebGPU mode

**Validation Notes**:

- ⚠️ SSAO will be disabled - this is expected and documented

---

**Batch 5 Verification Requirements**:

- ✅ Bloom effect renders bright objects with glow
- ✅ DOF effect blurs based on focus distance
- ✅ ColorGrading adjusts saturation/contrast
- ✅ SSAO gracefully disabled (console warning, no crash)
- ✅ Effects can be enabled/disabled dynamically
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Demo app works with all effects: `npx nx serve angular-3d-demo`

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
- Commit message lists all completed tasks
- Avoids running pre-commit hooks multiple times

**Completion Criteria**:

- All batch statuses are "✅ COMPLETE"
- All batch commits verified
- All files exist
- Build passes
- Demo app works

---

## Summary

| Batch     | Name                             | Tasks  | Est. Hours | Dependencies |
| --------- | -------------------------------- | ------ | ---------- | ------------ |
| 1         | TSL Utilities Enhancement        | 2      | 4-6h       | None         |
| 2         | Simple Component Migrations      | 3      | 8-12h      | Batch 1      |
| 3         | Complex Volumetric Migrations    | 3      | 16-24h     | Batch 2      |
| 4         | Metaball TSL Migration           | 3      | 15-20h     | Batch 3      |
| 5         | Post-Processing Native Migration | 4      | 12-16h     | Batch 4      |
| **Total** |                                  | **14** | **55-78h** |              |
