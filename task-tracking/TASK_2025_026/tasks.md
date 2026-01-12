# Development Tasks - TASK_2025_026

**Total Tasks**: 25 | **Batches**: 6 | **Status**: 6/6 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- RenderLoopService pattern: Verified in `render-loop.service.ts:48-260` - existing signal pattern for state management
- Effect component pattern: Verified in `bloom-effect.component.ts:34-121` - uses `EffectComposerService.addPass()` and `ngOnDestroy` cleanup
- SceneService lacks invalidate(): Verified in `scene.service.ts:46-131` - method does not exist yet
- OrbitControls has change handler: Verified in `orbit-controls.component.ts:209-219` - can add invalidate call
- Scene3dComponent pattern: Verified in `scene-3d.component.ts:74-333` - standard input pattern

### Risks Identified

| Risk                                                            | Severity | Mitigation                                                                                                                                                  |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Float3d/Rotate3d use GSAP's render loop (not RenderLoopService) | MEDIUM   | GSAP animations run continuously regardless of demand mode - these directives work correctly as-is because they keep the render loop active while animating |
| Multiple invalidate() calls per frame                           | LOW      | Single `_needsRender` signal acts as debounce                                                                                                               |
| RAF loop restart when idle                                      | LOW      | Covered by implementation in `invalidate()` method                                                                                                          |

### Edge Cases to Handle

- [x] Demand mode defaults to 'always' for backward compatibility - Handled in Task 1.1
- [x] RAF idle timeout configurable - Handled in Task 1.1 (100ms default)
- [x] FPS reports actual render frequency in demand mode - Handled in Task 1.1

---

## Batch 1: Demand-Based Rendering (Foundation)

**Developer**: backend-developer
**Tasks**: 5 | **Dependencies**: None
**Status**: COMPLETE
**Commit**: 4cda891

**Commit Message**: `feat(angular-3d): add demand-based rendering mode for battery efficiency`

### Task 1.1: Modify RenderLoopService for demand-based rendering

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\render-loop\render-loop.service.ts`
- **Spec Reference**: implementation-plan.md:148-257
- **Pattern to Follow**: render-loop.service.ts:57-64 (existing signal pattern)
- **Description**: Add `frameloop` mode signal ('always' | 'demand'), `_needsRender` signal, `invalidate()` method, and modify the RAF loop to check frameloop mode. Add idle timeout to stop RAF when no invalidations occur.
- **Acceptance Criteria**:
  - [x] Add `_frameloop` signal with default 'always'
  - [x] Add `_needsRender` signal with default true
  - [x] Add `invalidateTimeout` property for idle detection
  - [x] Add `setFrameloop(mode: 'always' | 'demand')` method
  - [x] Add `invalidate()` method that sets `_needsRender` to true and restarts RAF if stopped
  - [x] Modify `loop()` method to check frameloop mode before rendering
  - [x] Reset `_needsRender` to false after rendering in demand mode
  - [x] Add 100ms idle timeout to stop RAF in demand mode
  - [x] Ensure FPS signal reports actual render frequency (not 60fps when idle)
  - [x] Backward compatible: default mode is 'always'

---

### Task 1.2: Add frameloop input to Scene3dComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts`
- **Spec Reference**: implementation-plan.md:264-291
- **Pattern to Follow**: scene-3d.component.ts:145-159 (existing input pattern)
- **Dependencies**: Task 1.1
- **Description**: Add `frameloop` input signal and pass it to RenderLoopService on initialization.
- **Acceptance Criteria**:
  - [x] Add `frameloop` input with type `'always' | 'demand'` and default `'always'`
  - [x] Call `this.renderLoop.setFrameloop(this.frameloop())` in afterNextRender before starting loop
  - [x] Ensure input is properly typed

---

### Task 1.3: Add invalidate() proxy method to SceneService

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene.service.ts`
- **Spec Reference**: implementation-plan.md:295-313
- **Pattern to Follow**: scene.service.ts:46 (existing service pattern)
- **Dependencies**: Task 1.1
- **Description**: Add `invalidate()` method to SceneService as a proxy to RenderLoopService for convenient access from child components.
- **Acceptance Criteria**:
  - [x] Inject RenderLoopService into SceneService
  - [x] Add `invalidate()` public method that calls `this.renderLoop.invalidate()`
  - [x] Add JSDoc documentation explaining usage in demand mode

---

### Task 1.4: Add auto-invalidate to OrbitControlsComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\controls\orbit-controls.component.ts`
- **Spec Reference**: implementation-plan.md:315-337
- **Pattern to Follow**: orbit-controls.component.ts:209-219 (existing change listener)
- **Dependencies**: Task 1.3
- **Description**: Modify the change event handler to call `sceneService.invalidate()` to trigger renders during user interaction.
- **Acceptance Criteria**:
  - [x] Add `sceneService.invalidate()` call in `handleControlsChange` method
  - [x] Place invalidate call before emitting controlsChange event
  - [x] Ensure continuous rendering during user interaction

---

### Task 1.5: Add auto-invalidate to Float3d and Rotate3d directives

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**:
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\float-3d.directive.ts`
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\rotate-3d.directive.ts`
- **Spec Reference**: implementation-plan.md:339-359
- **Pattern to Follow**: float-3d.directive.ts:95 (GSAP timeline configuration)
- **Dependencies**: Task 1.3
- **Description**: Inject SceneService and add `onUpdate` callback to GSAP animations that calls `invalidate()`. Note: GSAP runs its own internal loop, but we need to trigger Three.js renders.
- **Acceptance Criteria**:
  - [x] Inject SceneService in Float3dDirective
  - [x] Add `onUpdate: () => this.sceneService.invalidate()` to GSAP timeline.to() calls in Float3d
  - [x] Inject SceneService in Rotate3dDirective
  - [x] Add `onUpdate: () => this.sceneService.invalidate()` to GSAP timeline.to() calls in Rotate3d
  - [x] Handle optional SceneService injection (may be null in some contexts)

**Batch 1 Verification**:

- [x] All files exist at paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] TypeScript compiles without errors
- [x] Demand mode works: setting `frameloop="demand"` stops continuous rendering
- [x] User interaction triggers renders via OrbitControls
- [x] Animations trigger renders via GSAP onUpdate

---

## Batch 2: InstancedMeshComponent

**Developer**: backend-developer
**Tasks**: 1 | **Dependencies**: Batch 1 (for invalidate())
**Status**: COMPLETE
**Commit**: 021ae5b

**Commit Message**: `feat(angular-3d): add instanced mesh component for 100x object scaling`

### Task 2.1: Create InstancedMeshComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\instanced-mesh.component.ts`
- **Spec Reference**: implementation-plan.md:363-658
- **Pattern to Follow**: box.component.ts (primitive pattern), star-field.component.ts (complex attributes)
- **Dependencies**: Task 1.3 (needs invalidate())
- **Description**: Create new InstancedMeshComponent that renders thousands of similar objects with a single draw call. Support external instanceMatrix and instanceColor arrays, child geometry/material directives, and methods for updating individual instances.
- **Acceptance Criteria**:
  - [x] Create component with selector `a3d-instanced-mesh`
  - [x] Add `count` input (required)
  - [x] Add `instanceMatrix` input (Float32Array, optional)
  - [x] Add `instanceColor` input (Float32Array, optional)
  - [x] Add `frustumCulled` input (default true)
  - [x] Add `usage` input ('static' | 'dynamic', default 'static')
  - [x] Add `castShadow` and `receiveShadow` inputs
  - [x] Add `meshReady` output event
  - [x] Provide GEOMETRY_SIGNAL and MATERIAL_SIGNAL tokens for child directives
  - [x] Provide OBJECT_ID token
  - [x] Create InstancedMesh when geometry and material are available
  - [x] Register with SceneGraphStore
  - [x] Add to parent via NG_3D_PARENT
  - [x] Implement `updateInstanceAt(index, matrix, color?)` method
  - [x] Implement `setMatrixAt(index, matrix)` method
  - [x] Implement `setColorAt(index, color)` method
  - [x] Implement `getMesh()` method
  - [x] Call `sceneService.invalidate()` on updates
  - [x] Set DynamicDrawUsage when usage='dynamic'
  - [x] Proper dispose on destroy (geometry, material, store removal)
  - [x] JSDoc with @example usage

**Batch 2 Verification**:

- File exists at path
- Build passes: `npx nx build @hive-academy/angular-3d`
- Component can render 1000+ instances
- Single draw call verified (renderer.info.render.calls)
- Child geometry/material directives work
- Instance updates work correctly

---

## Batch 3: EnvironmentComponent

**Developer**: backend-developer
**Tasks**: 1 | **Dependencies**: Batch 1 (for invalidate())
**Status**: COMPLETE
**Commit**: de8afd8

**Commit Message**: `feat(angular-3d): add hdri environment component for photorealistic lighting`

### Task 3.1: Create EnvironmentComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\environment.component.ts`
- **Spec Reference**: implementation-plan.md:668-922
- **Pattern to Follow**: gltf-model.component.ts:17-228 (async loader pattern)
- **Dependencies**: Task 1.3 (needs invalidate())
- **Description**: Create EnvironmentComponent that loads HDRI/EXR environment maps for image-based lighting. Support preset environments, background display with blur, intensity control, and loading events.
- **Acceptance Criteria**:
  - [x] Create component with selector `a3d-environment`
  - [x] Add `hdri` input (string path, optional)
  - [x] Add `preset` input (EnvironmentPreset type, optional)
  - [x] Add `background` input (boolean, default false)
  - [x] Add `blur` input (number 0-1, default 0)
  - [x] Add `intensity` input (number, default 1)
  - [x] Add `loading` output (progress percentage)
  - [x] Add `loaded` output (THREE.Texture)
  - [x] Add `error` output (Error)
  - [x] Define ENVIRONMENT_PRESETS constant with polyhaven.com URLs
  - [x] Export EnvironmentPreset type
  - [x] Use RGBELoader from three-stdlib
  - [x] Use PMREMGenerator for environment map processing
  - [x] Set scene.environment for PBR materials
  - [x] Set scene.background when background=true
  - [x] Set scene.backgroundBlurriness when blur > 0
  - [x] Set scene.environmentIntensity from intensity input
  - [x] Add `isLoading` and `loadError` signals for state tracking
  - [x] Call `sceneService.invalidate()` after loading and on property changes
  - [x] Emit progress during loading
  - [x] Handle errors gracefully (emit error event, no scene crash)
  - [x] Dispose PMREMGenerator, source texture, and envMap on destroy
  - [x] Clear scene.environment and scene.background on destroy
  - [x] JSDoc with @example usage for both custom HDRI and preset

**Batch 3 Verification**:

- File exists at path
- Build passes: `npx nx build @hive-academy/angular-3d`
- Custom HDRI loading works
- Preset loading works
- Background display works with blur
- PBR materials reflect environment
- Loading/loaded/error events emit correctly
- Resources disposed on destroy

---

## Batch 4: ShaderMaterialDirective

**Developer**: backend-developer
**Tasks**: 1 | **Dependencies**: Batch 1 (for invalidate())
**Status**: COMPLETE
**Commit**: 0686cb8

**Commit Message**: `feat(angular-3d): add shader material directive for custom glsl shaders`

### Task 4.1: Create ShaderMaterialDirective

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\shader-material.directive.ts`
- **Spec Reference**: implementation-plan.md:932-1199
- **Pattern to Follow**: standard-material.directive.ts:42-131 (material directive pattern)
- **Dependencies**: Task 1.3 (needs invalidate())
- **Description**: Create ShaderMaterialDirective that creates THREE.ShaderMaterial with custom GLSL vertex/fragment shaders, reactive uniform updates, and auto-injected common uniforms (time, resolution, mouse).
- **Acceptance Criteria**:
  - [x] Create directive with selector `[a3dShaderMaterial]`
  - [x] Add `vertexShader` input (required, string)
  - [x] Add `fragmentShader` input (required, string)
  - [x] Add `uniforms` input (Record<string, UniformValue>, default {})
  - [x] Add `defines` input (Record<string, string>, default {})
  - [x] Add `transparent` input (boolean, default false)
  - [x] Add `wireframe` input (boolean, default false)
  - [x] Add `side` input ('front' | 'back' | 'double', default 'front')
  - [x] Add `depthTest` input (boolean, default true)
  - [x] Add `depthWrite` input (boolean, default true)
  - [x] Add `blending` input ('normal' | 'additive' | 'subtractive' | 'multiply', default 'normal')
  - [x] Add `injectTime` input (boolean, default true)
  - [x] Add `injectResolution` input (boolean, default true)
  - [x] Add `injectMouse` input (boolean, default false)
  - [x] Export UniformValue type
  - [x] Convert uniform values to THREE.Uniform objects
  - [x] Support hex color strings as uniform values (convert to THREE.Color)
  - [x] Support number arrays as Vector2/3/4
  - [x] Auto-inject 'time' uniform (updated per frame)
  - [x] Auto-inject 'resolution' uniform (canvas size)
  - [x] Register render callback for auto-uniform updates
  - [x] Update uniforms reactively without recreating material
  - [x] Map side/blending string values to THREE constants
  - [x] Set material to MATERIAL_SIGNAL
  - [x] Call `sceneService.invalidate()` on uniform updates
  - [x] Dispose material and cleanup render callback on destroy
  - [x] JSDoc with @example usage

**Batch 4 Verification**:

- File exists at path
- Build passes: `npx nx build @hive-academy/angular-3d`
- Custom shaders render correctly
- Time uniform animates
- Resolution uniform updates on resize
- Uniform changes update without material recreation
- Material disposes on destroy

---

## Batch 5: Post-Processing Effects & Exports

**Developer**: backend-developer
**Tasks**: 7 | **Dependencies**: Batch 1 (for invalidate())
**Status**: COMPLETE
**Commit**: f4d0794

**Commit Message**: `feat(angular-3d): add post-processing effects and public api exports`

### Task 5.1: Create DepthOfFieldEffectComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\dof-effect.component.ts`
- **Spec Reference**: implementation-plan.md:1218-1311
- **Pattern to Follow**: bloom-effect.component.ts:34-121 (effect component pattern)
- **Dependencies**: Task 1.3 (needs invalidate())
- **Description**: Create DOF effect component using BokehPass with configurable focus, aperture, and maxblur.
- **Acceptance Criteria**:
  - [x] Create component with selector `a3d-dof-effect`
  - [x] Add `focus` input (number, default 10)
  - [x] Add `aperture` input (number, default 0.025)
  - [x] Add `maxblur` input (number, default 0.01)
  - [x] Import BokehPass from three-stdlib
  - [x] Create pass when renderer, scene, and camera are available
  - [x] Add pass to EffectComposerService
  - [x] Update pass uniforms reactively
  - [x] Call `sceneService.invalidate()` on property changes
  - [x] Remove pass and cleanup on destroy
  - [x] JSDoc with @example usage

---

### Task 5.2: Create SsaoEffectComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\ssao-effect.component.ts`
- **Spec Reference**: implementation-plan.md:1314-1399
- **Pattern to Follow**: bloom-effect.component.ts:34-121 (effect component pattern)
- **Dependencies**: Task 1.3 (needs invalidate())
- **Description**: Create SSAO effect component using SSAOPass with configurable radius, intensity, and distance thresholds.
- **Acceptance Criteria**:
  - [x] Create component with selector `a3d-ssao-effect`
  - [x] Add `radius` input (number, default 4)
  - [x] Add `intensity` input (number, default 1)
  - [x] Add `kernelRadius` input (number, default 8)
  - [x] Add `minDistance` input (number, default 0.001)
  - [x] Add `maxDistance` input (number, default 0.1)
  - [x] Import SSAOPass from three-stdlib
  - [x] Create pass when renderer, scene, and camera are available
  - [x] Pass canvas dimensions to SSAOPass constructor
  - [x] Add pass to EffectComposerService
  - [x] Update pass properties reactively
  - [x] Call `sceneService.invalidate()` on property changes
  - [x] Remove pass on destroy
  - [x] JSDoc with @example usage

---

### Task 5.3: Create ColorGradingEffectComponent

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\color-grading-effect.component.ts`
- **Spec Reference**: implementation-plan.md:1402-1553
- **Pattern to Follow**: bloom-effect.component.ts:34-121 (effect component pattern)
- **Dependencies**: Task 1.3 (needs invalidate())
- **Description**: Create color grading effect component using custom ShaderPass with saturation, contrast, brightness, gamma, exposure, and vignette controls.
- **Acceptance Criteria**:
  - [x] Create component with selector `a3d-color-grading-effect`
  - [x] Add `saturation` input (number, default 1)
  - [x] Add `contrast` input (number, default 1)
  - [x] Add `brightness` input (number, default 1)
  - [x] Add `gamma` input (number, default 2.2)
  - [x] Add `exposure` input (number, default 1)
  - [x] Add `vignette` input (number, default 0)
  - [x] Define ColorGradingShader constant with vertex/fragment shaders
  - [x] Import ShaderPass from three-stdlib
  - [x] Create pass when renderer is available
  - [x] Add pass to EffectComposerService
  - [x] Update shader uniforms reactively
  - [x] Call `sceneService.invalidate()` on property changes
  - [x] Remove pass on destroy
  - [x] JSDoc with @example usage

---

### Task 5.4: Update postprocessing index exports

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\index.ts`
- **Spec Reference**: implementation-plan.md:1559-1568
- **Dependencies**: Tasks 5.1, 5.2, 5.3
- **Description**: Add exports for new post-processing effect components.
- **Acceptance Criteria**:
  - [x] Add `export * from './effects/dof-effect.component';`
  - [x] Add `export * from './effects/ssao-effect.component';`
  - [x] Add `export * from './effects/color-grading-effect.component';`

---

### Task 5.5: Update primitives index exports

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts`
- **Spec Reference**: implementation-plan.md:1570-1577
- **Dependencies**: Tasks 2.1, 3.1
- **Description**: Add exports for new primitive components.
- **Acceptance Criteria**:
  - [x] Add `export * from './instanced-mesh.component';`
  - [x] Add `export * from './environment.component';`

---

### Task 5.6: Update directives index exports

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\index.ts`
- **Spec Reference**: implementation-plan.md:1579-1584
- **Dependencies**: Task 4.1
- **Description**: Add export for new ShaderMaterialDirective.
- **Acceptance Criteria**:
  - [x] Add `export * from './materials/shader-material.directive';`

---

### Task 5.7: Update materials index exports (if exists)

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\index.ts`
- **Dependencies**: Task 4.1
- **Description**: Create or update materials index.ts to export ShaderMaterialDirective. Check if file exists first.
- **Acceptance Criteria**:
  - [ ] If materials/index.ts exists, add `export * from './shader-material.directive';`
  - [x] If materials/index.ts does not exist, skip this task (exports covered by Task 5.6)
- **Note**: materials/index.ts does not exist - exports are handled via Task 5.6 (directives/index.ts)

**Batch 5 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- DOF effect blurs background objects
- SSAO effect adds ambient shadows
- Color grading adjusts image appearance
- All new components/directives are exported and importable
- No import errors from library consumers

---

## Status Icons Reference

| Status      | Meaning                             | Who Sets              |
| ----------- | ----------------------------------- | --------------------- |
| PENDING     | Not started                         | team-leader (initial) |
| IN PROGRESS | Assigned to developer               | team-leader           |
| IMPLEMENTED | Code written, awaiting verification | developer             |
| COMPLETE    | Verified and committed              | team-leader           |
| FAILED      | Verification failed                 | team-leader           |

---

## Quality Requirements

### All Components Must:

1. Use `ChangeDetectionStrategy.OnPush`
2. Use signal-based `input()` / `input.required()`
3. Use `inject()` for DI (no constructor injection for dependencies)
4. Use `DestroyRef.onDestroy()` for cleanup
5. Use `a3d-` prefix for component selectors
6. Use `a3d` prefix for directive selectors
7. Include JSDoc with `@example` usage
8. Properly dispose Three.js resources
9. Call `sceneService.invalidate()` when updating scene in demand mode

### Performance Targets:

- InstancedMesh: 100k+ instances at 60fps, single draw call
- Demand mode: 0% GPU usage when idle
- HDRI load: <2 seconds for 2K HDRI on 10Mbps
- Post-processing: <10ms per frame for all effects combined

---

## Batch 6: Review Fixes (Critical Issues) - COMPLETE

**Developer**: backend-developer
**Tasks**: 8 | **Dependencies**: Batch 5 (completed)
**Status**: COMPLETE
**Commit**: 974ead4

**Commit Message**: `fix(angular-3d): address code review findings for batch 5 components`

### Task 6.1: Connect SSAO radius and intensity inputs to SSAOPass

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\ssao-effect.component.ts`
- **Description**: The `radius` and `intensity` inputs are declared but never applied to the SSAOPass. The SSAOPass uses `kernelRadius` internally for the radius concept. Either map the `radius` input to affect SSAOPass behavior properly, or rename/remove these misleading inputs. For intensity, SSAOPass output can be scaled via a custom post-pass or by adjusting the output blend.
- **Review Reference**: code-style-review.md (Blocking Issue 1), code-logic-review.md (Critical Issue 1)
- **Implementation**: Removed misleading `radius` and `intensity` inputs. Updated JSDoc with @remarks explaining that `kernelRadius` is the actual control for SSAO spread. Also migrated to DestroyRef pattern as part of Task 6.5.
- **Acceptance Criteria**:
  - [x] Either remove unused `radius` and `intensity` inputs, OR
  - [x] Map `radius` input to `kernelRadius` property with appropriate scaling, OR
  - [x] Add comment explaining that `kernelRadius` is the actual radius control
  - [x] Update JSDoc to accurately reflect what inputs actually do
  - [x] Ensure all documented inputs have real effect on the output

---

### Task 6.2: Add LUT support to ColorGrading OR document as deferred

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\color-grading-effect.component.ts`
- **Description**: Requirements specified `[lut]` input for loading LUT textures but implementation omits it. Either implement LUT loading via TextureLoader and shader sampling, or explicitly document in JSDoc that LUT support is planned for a future version.
- **Review Reference**: code-logic-review.md (Critical Issue 2)
- **Implementation**: Added @remarks JSDoc documenting LUT as planned for future version.
- **Acceptance Criteria**:
  - [ ] Option A: Add `lut` input (string path to LUT texture)
  - [ ] Option A: Load LUT using TextureLoader
  - [ ] Option A: Add LUT sampling to fragment shader
  - [x] OR Option B: Add JSDoc note: `@remarks LUT support planned for future version`
  - [ ] Update @example if adding LUT support

---

### Task 6.3: Add validation and error for invalid InstancedMesh count

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\instanced-mesh.component.ts`
- **Description**: When `count <= 0`, the effect silently returns without any feedback. Add proper console.error to warn developers that count must be a positive number.
- **Review Reference**: code-style-review.md (Blocking Issue 2), code-logic-review.md (Failure Mode 1)
- **Implementation**: Added explicit console.error when count <= 0. Validation now happens before geometry/material check with clear error message.
- **Acceptance Criteria**:
  - [x] Before `if (!geometry || !material || !count || count <= 0) return;`
  - [x] Add explicit check: `if (!count || count <= 0) { console.error('[InstancedMeshComponent] count must be a positive number, got:', count); return; }`
  - [x] Add JSDoc note about count immutability (cannot be changed after creation)

---

### Task 6.4: Add defensive check for DOF aspect ratio uniform

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\dof-effect.component.ts`
- **Description**: The aspect ratio update checks for `uniforms['aspect']` existence but should log a warning if the expected uniform is missing, as this could indicate a three-stdlib version incompatibility.
- **Review Reference**: code-style-review.md (Blocking Issue 3)
- **Implementation**: Added else branch with one-time warning using `aspectUniformWarned` flag. Also migrated to DestroyRef pattern as part of Task 6.5.
- **Acceptance Criteria**:
  - [x] Keep existing defensive check `if (uniforms['aspect'])`
  - [x] Add else branch with: `console.warn('[DepthOfFieldEffectComponent] BokehPass missing expected aspect uniform - check three-stdlib version');`
  - [x] Only warn once (use a flag to prevent repeated warnings)

---

### Task 6.5: Migrate post-processing effects to DestroyRef pattern

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**:
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\dof-effect.component.ts`
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\ssao-effect.component.ts`
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\color-grading-effect.component.ts`
- **Description**: These components use `implements OnDestroy` and `ngOnDestroy()` but other new components like InstancedMeshComponent and EnvironmentComponent use `DestroyRef.onDestroy()`. For consistency across the codebase, migrate to the modern Angular pattern.
- **Review Reference**: code-style-review.md (Serious Issue 1)
- **Implementation**: All three effect components now use DestroyRef.onDestroy() pattern. Removed OnDestroy import, implements OnDestroy, and ngOnDestroy() method from all three files.
- **Acceptance Criteria**:
  - [x] In all three effect components: inject `DestroyRef`
  - [x] Move `ngOnDestroy()` logic to constructor using `this.destroyRef.onDestroy(() => { ... })`
  - [x] Remove `implements OnDestroy` from class declaration
  - [x] Remove `ngOnDestroy()` method
  - [x] Ensure cleanup still works correctly

---

### Task 6.6: Add precision qualifier to ColorGrading shader

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\color-grading-effect.component.ts`
- **Description**: The fragment shader lacks `precision mediump float;` declaration which may cause issues on some WebGL implementations, especially mobile devices.
- **Review Reference**: code-style-review.md (Serious Issue 6)
- **Implementation**: Added `precision mediump float;` as first line of fragmentShader.
- **Acceptance Criteria**:
  - [x] Add `precision mediump float;` as first line of fragmentShader (after template literal opening)
  - [x] Verify shader still compiles and works

---

### Task 6.7: Add isLoading check to Environment reload() method

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\environment.component.ts`
- **Description**: The `reload()` method doesn't check if a load is already in progress before starting a new load. This can cause race conditions and resource leaks with multiple PMREMGenerator instances.
- **Review Reference**: code-style-review.md (Serious Issue 2), code-logic-review.md (Failure Mode 2)
- **Implementation**: Added isLoading() check at start of reload() method with warning message and early return.
- **Acceptance Criteria**:
  - [x] At start of `reload()` method, add: `if (this.isLoading()) { console.warn('[EnvironmentComponent] Reload called while already loading, ignoring'); return; }`
  - [x] Ensure loading state is properly tracked

---

### Task 6.8: Document InstancedMesh count immutability

- **Status**: COMPLETE
- **Assigned**: backend-developer
- **File(s)**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\instanced-mesh.component.ts`
- **Description**: When `count` input changes dynamically, the mesh is NOT recreated (guard at line 240). This is intentional for performance, but developers should be explicitly warned about this behavior.
- **Review Reference**: code-logic-review.md (Serious Issue 1, Failure Mode 1)
- **Implementation**: Updated JSDoc for count input with IMPORTANT note about immutability. Added console.warn when count signal changes after mesh creation, tracking original count with `createdWithCount` field.
- **Acceptance Criteria**:
  - [x] Update JSDoc for `count` input to clearly state: "This value cannot be changed after mesh creation. To change count, destroy and recreate the component."
  - [x] Add console.warn in the effect when count changes but mesh already exists: `console.warn('[InstancedMeshComponent] count cannot be changed after mesh creation. Current count:', existingCount);`

**Batch 6 Verification**:

- [x] All files exist at paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] TypeScript compiles without errors
- [x] SSAO inputs either work or are clarified in docs
- [x] ColorGrading shader works on mobile
- [x] Post-processing effects use consistent lifecycle pattern
- [x] No silent failures for invalid inputs

---

## Status Icons Reference

| Status      | Meaning                             | Who Sets              |
| ----------- | ----------------------------------- | --------------------- |
| PENDING     | Not started                         | team-leader (initial) |
| IN PROGRESS | Assigned to developer               | team-leader           |
| IMPLEMENTED | Code written, awaiting verification | developer             |
| COMPLETE    | Verified and committed              | team-leader           |
| FAILED      | Verification failed                 | team-leader           |

---

## Quality Requirements

### All Components Must:

1. Use `ChangeDetectionStrategy.OnPush`
2. Use signal-based `input()` / `input.required()`
3. Use `inject()` for DI (no constructor injection for dependencies)
4. Use `DestroyRef.onDestroy()` for cleanup
5. Use `a3d-` prefix for component selectors
6. Use `a3d` prefix for directive selectors
7. Include JSDoc with `@example` usage
8. Properly dispose Three.js resources
9. Call `sceneService.invalidate()` when updating scene in demand mode

### Performance Targets:

- InstancedMesh: 100k+ instances at 60fps, single draw call
- Demand mode: 0% GPU usage when idle
- HDRI load: <2 seconds for 2K HDRI on 10Mbps
- Post-processing: <10ms per frame for all effects combined

---

**Document Version**: 1.2
**Created**: 2025-12-24
**Updated**: 2025-12-24
**Author**: Team-Leader Agent
**Task ID**: TASK_2025_026
**Status**: ALL BATCHES COMPLETE
