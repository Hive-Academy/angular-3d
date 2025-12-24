# Code Logic Review - TASK_2025_026

## Award-Winning Three.js Enhancements for @hive-academy/angular-3d

---

## Review Summary

| Metric              | Value          |
| ------------------- | -------------- |
| Overall Score       | 7.5/10         |
| Assessment          | NEEDS_REVISION |
| Critical Issues     | 2              |
| Serious Issues      | 5              |
| Moderate Issues     | 8              |
| Failure Modes Found | 12             |

---

## The 5 Paranoid Questions

### 1. How does this fail silently?

1. **InstancedMeshComponent - Parent not ready**: When `parentFn()` returns null (line 363-371 in instanced-mesh.component.ts), the component logs a warning but the mesh is never added to the scene. The user sees nothing rendered with no clear error.

2. **EnvironmentComponent - Network failures on presets**: When loading HDRI from polyhaven.com fails (CORS, 404, timeout), the error is logged but scene.environment remains null. PBR materials look flat with no visible indication why.

3. **ShaderMaterialDirective - Invalid GLSL silently fails**: If the vertex or fragment shader has syntax errors, Three.js throws in the WebGL context but the directive catches nothing. The mesh renders black or not at all.

4. **Post-processing effects - Pass not added**: If `renderer`, `scene`, or `camera` signals are null when effects initialize, the pass creation is silently skipped. The effect never appears.

5. **RenderLoopService - Idle timeout race**: The 100ms idle timeout may fire between invalidate() calls during slow operations, stopping the RAF loop prematurely.

### 2. What user action causes unexpected behavior?

1. **Rapid InstancedMesh count changes**: If a user dynamically changes `count` input, the mesh is NOT recreated (line 240: `if (this.instancedMesh) return;`). Old mesh persists with wrong instance count.

2. **Switching Environment presets rapidly**: Multiple concurrent HDRI loads cause race conditions. The `loadingAborted` flag helps but doesn't prevent multiple PMREMGenerator instances.

3. **Destroying component during HDRI load**: The abort flag prevents callback application, but the RGBELoader fetch continues consuming bandwidth.

4. **Tab switching during demand mode**: When document becomes hidden, pause() stops the clock but doesn't clear `_needsRender`. Resume may not trigger immediate render.

5. **Setting frameloop='demand' after scene has animations**: Existing GSAP animations continue but if a user stops all animations, they must manually invalidate to see final state.

### 3. What data makes this produce wrong results?

1. **InstancedMesh with count=0**: Creates `new THREE.InstancedMesh(geometry, material, 0)` which may cause WebGL errors on some drivers.

2. **instanceMatrix with wrong array length**: Validated (lines 249-257), but if user provides length > count\*16, extra data is silently accepted via `array.set()`.

3. **instanceColor with NaN values**: No validation of Float32Array contents. NaN colors produce black/undefined rendering.

4. **Environment blur values outside 0-1**: Clamped on background but not on input signal. Values like -0.5 or 2.0 are passed to Three.js which clamps internally.

5. **ShaderMaterial uniforms with null values**: `convertUniformValue(null)` returns null directly, which may crash shaders expecting specific types.

6. **ColorGrading with negative gamma**: `pow(color, vec3(1.0 / gamma))` produces NaN when gamma is negative or zero.

### 4. What happens when dependencies fail?

| Integration Point         | Failure Mode                   | Current Handling                               | Risk                   |
| ------------------------- | ------------------------------ | ---------------------------------------------- | ---------------------- |
| RGBELoader (HDRI)         | Network timeout                | Emits error event, stops loading               | OK, but no retry       |
| three-stdlib BokehPass    | Import missing                 | Build fails                                    | LOW                    |
| SSAOPass with WebGL 1.0   | Missing features               | Silent degradation                             | MEDIUM - no fallback   |
| PMREMGenerator            | WebGL context lost             | Unhandled exception                            | HIGH                   |
| GSAP dynamic import       | Network fail                   | Promise never resolves, animation never starts | MEDIUM                 |
| SceneService.invalidate() | RenderLoopService not injected | Method throws                                  | LOW - always available |
| GEOMETRY_SIGNAL null      | Mesh never created             | Silent - no mesh                               | MEDIUM                 |
| MATERIAL_SIGNAL null      | Mesh never created             | Silent - no mesh                               | MEDIUM                 |

### 5. What's missing that the requirements didn't mention?

1. **No LUT support in ColorGrading**: Requirements specify `[lut]` input for loading LUT textures, but implementation omits it entirely.

2. **No SSAOPass WebGL 1.0 fallback**: Requirements mention "graceful fallback for WebGL 1.0" but no feature detection exists.

3. **No `forceRender()` escape hatch**: Requirements mention this in risk assessment but it's not implemented.

4. **No radius/intensity reactive updates for SSAO**: Only kernelRadius, minDistance, maxDistance update reactively. The `radius` and `intensity` inputs exist but aren't connected to pass updates.

5. **EnvironmentComponent missing `encoding` input**: Requirements specify `encoding: 'linear' | 'srgb'` but implementation omits it.

6. **No validation for InstancedMesh geometry/material compatibility**: Some geometries may not work with instancing (e.g., indexed vs non-indexed).

7. **No `order` input for post-processing effects**: Requirements state effects "SHALL be applied in this order (configurable via `[order]` input)" but no ordering control exists.

---

## Failure Mode Analysis

### Failure Mode 1: InstancedMesh Count Change Ignored

- **Trigger**: User dynamically updates `[count]` input after initial render
- **Symptoms**: Instance count remains at original value, new instances not visible
- **Impact**: HIGH - Data visualization dashboards may show stale data
- **Current Handling**: Effect guard `if (this.instancedMesh) return;` prevents recreation
- **Recommendation**: Either recreate mesh on count change, or document this as immutable and use input setter to throw on change attempt

### Failure Mode 2: SSAO Input Parameters Not Applied

- **Trigger**: User sets `[radius]` or `[intensity]` inputs on SSAO component
- **Symptoms**: SSAO appearance doesn't change despite input updates
- **Impact**: MEDIUM - User cannot fine-tune SSAO effect strength
- **Current Handling**: Effect only updates `kernelRadius`, `minDistance`, `maxDistance` (lines 122-129)
- **Recommendation**: Add `this.pass.output.radius` and other property updates in the reactive effect

### Failure Mode 3: ColorGrading Missing LUT Support

- **Trigger**: User provides `[lut]="'/assets/lut.png'"` per requirements
- **Symptoms**: Input silently ignored, no cinematic color correction
- **Impact**: MEDIUM - Feature gap from requirements
- **Current Handling**: No handling - input doesn't exist
- **Recommendation**: Either implement LUT loading via TextureLoader or update requirements to defer

### Failure Mode 4: WebGL Context Lost During HDRI Processing

- **Trigger**: GPU driver crash, tab backgrounding on mobile, memory pressure
- **Symptoms**: PMREMGenerator throws, scene becomes blank, no recovery
- **Impact**: HIGH - Complete scene failure
- **Current Handling**: None
- **Recommendation**: Wrap PMREMGenerator operations in try-catch, emit error event, provide recovery path

### Failure Mode 5: Race Condition in Demand Mode Idle Timeout

- **Trigger**: invalidate() called, then 90ms passes, then invalidate() called again
- **Symptoms**: The 100ms timeout from first call may fire between second invalidate and render
- **Impact**: LOW - May cause extra RAF loop restarts
- **Current Handling**: Timeout cleared on new invalidate(), but RAF stop happens after check
- **Recommendation**: Consider debouncing invalidate() calls or extending idle period

### Failure Mode 6: ShaderMaterial GLSL Compilation Errors

- **Trigger**: User provides invalid GLSL syntax in vertex/fragment shader
- **Symptoms**: Mesh renders black or invisible, WebGL errors in console
- **Impact**: MEDIUM - Developer debugging difficulty
- **Current Handling**: None - errors thrown by Three.js to console
- **Recommendation**: Wrap ShaderMaterial creation in try-catch, emit error output

### Failure Mode 7: Post-Processing Effects Order Not Controllable

- **Trigger**: User needs specific effect order (e.g., DOF before SSAO)
- **Symptoms**: Effects applied in DOM order, may not match desired visual result
- **Impact**: LOW - Visual quality issue
- **Current Handling**: EffectComposerService.addPass() uses insertion order
- **Recommendation**: Add `[order]` input as specified in requirements, or document DOM order behavior

### Failure Mode 8: Environment Preset CDN Unavailable

- **Trigger**: polyhaven.com CDN blocked by corporate firewall, down, or CORS changes
- **Symptoms**: All preset environments fail to load, error events emitted
- **Impact**: HIGH for users relying on presets
- **Current Handling**: Error event emitted
- **Recommendation**: Consider bundled fallback presets (low-res) or local asset alternative

### Failure Mode 9: Dynamic Import of GSAP Fails

- **Trigger**: Network failure during lazy load, bundle splitting issues
- **Symptoms**: Float3d and Rotate3d animations never start, no errors visible
- **Impact**: MEDIUM - Animations silently missing
- **Current Handling**: Promise rejection not caught
- **Recommendation**: Add `.catch()` handler, emit warning or set error state

### Failure Mode 10: SceneService.invalidate() Before Scene Ready

- **Trigger**: Child component calls invalidate() before Scene3dComponent finishes initialization
- **Symptoms**: RenderLoopService.invalidate() called on uninitialized service
- **Impact**: LOW - Service exists but may not be "running" yet
- **Current Handling**: Method returns early if mode is 'always'
- **Recommendation**: Guard against `!this._isRunning()` in invalidate()

### Failure Mode 11: SSAO on Mobile/Low-End Devices

- **Trigger**: SSAO enabled on device without WebGL 2.0 depth texture support
- **Symptoms**: Rendering artifacts, incomplete occlusion, potential crashes
- **Impact**: MEDIUM - Mobile users affected
- **Current Handling**: None - no feature detection
- **Recommendation**: Add WebGL 2.0 check, disable SSAO or use simplified version on WebGL 1

### Failure Mode 12: InstancedMesh Material Array Not Handled

- **Trigger**: User applies multiple materials (material array) to instanced mesh
- **Symptoms**: Only first material applied, or runtime errors
- **Impact**: LOW - Edge case usage
- **Current Handling**: Dispose handles arrays (lines 645-649) but creation doesn't
- **Recommendation**: Document single-material limitation or handle multi-material

---

## Critical Issues

### Issue 1: SSAO `radius` and `intensity` Inputs Not Connected

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\ssao-effect.component.ts:121-129`
- **Scenario**: User sets `[radius]="8"` or `[intensity]="2"` expecting SSAO strength change
- **Impact**: Feature doesn't work as documented; user cannot control SSAO appearance
- **Evidence**:

```typescript
// Line 121-129: Only these properties are updated
effect(() => {
  if (this.pass) {
    this.pass.kernelRadius = this.kernelRadius();
    this.pass.minDistance = this.minDistance();
    this.pass.maxDistance = this.maxDistance();
    // MISSING: this.pass.output.radius = this.radius();
    // MISSING: intensity handling
    this.sceneService.invalidate();
  }
});
```

- **Fix**: SSAOPass uses `kernelRadius` for the radius concept. Either rename input to match, or map `radius()` to appropriate SSAOPass property. For intensity, SSAOPass doesn't have direct intensity - may need to modify output or blend factor.

### Issue 2: ColorGrading LUT Input Missing (Requirements Gap)

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\color-grading-effect.component.ts`
- **Scenario**: User follows requirements documentation to add `[lut]="/assets/film-look.png"`
- **Impact**: Documented feature missing, user cannot achieve cinematic color correction via LUT
- **Evidence**:

```typescript
// Requirements specify:
// readonly lut = input<string>(); // Path to LUT texture

// Implementation has NO lut input and shader doesn't support LUT sampling
```

- **Fix**: Either implement LUT loading/sampling or explicitly mark as "Not Implemented" in documentation

---

## Serious Issues

### Issue 1: InstancedMesh count is Immutable After Creation

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\instanced-mesh.component.ts:239-240`
- **Scenario**: Developer changes `[count]` dynamically to add/remove instances
- **Impact**: Count change silently ignored, data out of sync with visualization
- **Evidence**:

```typescript
// Line 239-240
if (this.instancedMesh) return; // Already created - count change ignored
```

- **Fix**: Either throw error on count change, log warning, or implement mesh recreation

### Issue 2: No WebGL 2.0 Feature Detection for SSAO

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\ssao-effect.component.ts`
- **Scenario**: User runs on WebGL 1.0 device (older iOS, low-end Android)
- **Impact**: Potential rendering failures, artifacts, or crashes
- **Evidence**: No renderer.capabilities check before SSAOPass creation
- **Fix**: Add feature detection, disable SSAO on WebGL 1.0, emit warning

### Issue 3: GSAP Import Rejection Not Handled

- **Files**:
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\float-3d.directive.ts:158`
  - `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\rotate-3d.directive.ts:171`
- **Scenario**: GSAP bundle fails to load (network, CSP, bundle error)
- **Impact**: Animations silently fail with no feedback to developer
- **Evidence**:

```typescript
// No .catch() handler
import('gsap').then(({ gsap }) => {
  // ... animation setup
});
```

- **Fix**: Add `.catch()` handler with console.error and potentially fallback state

### Issue 4: Environment Preset External CDN Dependency

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\environment.component.ts:103-121`
- **Scenario**: Production app used in enterprise with strict firewall blocking polyhaven.com
- **Impact**: All preset environments fail, users must use custom HDRI paths
- **Evidence**: ENVIRONMENT_PRESETS hardcodes polyhaven.com URLs
- **Fix**: Document dependency, consider bundled fallback or configurable CDN base URL

### Issue 5: PMREMGenerator Exception Not Caught

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\environment.component.ts:349-366`
- **Scenario**: WebGL context lost during PMREM processing
- **Impact**: Unhandled exception crashes scene
- **Evidence**:

```typescript
// Line 366 - no try-catch around PMREM operations
const pmremResult = this.pmremGenerator!.fromEquirectangular(texture);
this.envMap = pmremResult.texture;
```

- **Fix**: Wrap in try-catch, emit error event on failure

---

## Data Flow Analysis

```
Scene3dComponent
    |
    +-- sets frameloop mode --> RenderLoopService.setFrameloop('demand')
    |                               |
    |                               v
    |                         _frameloop signal = 'demand'
    |                         _needsRender signal = true
    |
    +-- Child Components:
        |
        +-- InstancedMeshComponent
        |     |
        |     +-- Effect: Wait for sceneStore.isReady() -------> [GAP: What if never ready?]
        |     +-- Effect: Wait for geometrySignal() --------> [GAP: What if child directive missing?]
        |     +-- Effect: Wait for materialSignal() --------> [GAP: What if child directive missing?]
        |     |
        |     +-- createInstancedMesh()
        |           |
        |           +-- parentFn() --------> [GAP: Returns null, mesh not added to scene]
        |           +-- sceneStore.register()
        |           +-- sceneService.invalidate() --> RenderLoopService
        |
        +-- EnvironmentComponent
        |     |
        |     +-- Effect: Determine URL (hdri > preset > null)
        |     +-- Check renderer/scene signals --------> [GAP: May not be ready on first effect run]
        |     |
        |     +-- loadEnvironment()
        |           |
        |           +-- PMREMGenerator.fromEquirectangular() --> [GAP: No try-catch]
        |           +-- scene.environment = envMap
        |           +-- sceneService.invalidate()
        |
        +-- ShaderMaterialDirective
        |     |
        |     +-- Effect: Create material
        |     +-- setupAutoUniforms() --> registerUpdateCallback()
        |           |
        |           +-- Per frame: update time/resolution uniforms
        |           +-- [GAP: No error handling for shader compilation]
        |
        +-- Post-Processing Effects (DOF, SSAO, ColorGrading)
              |
              +-- Effect: Wait for renderer/scene/camera
              +-- composerService.addPass() --------> [GAP: What if composer not initialized?]
              +-- Effect: Update uniforms
              +-- sceneService.invalidate()
```

### Gap Points Identified:

1. **SceneStore not ready**: Components depend on `sceneStore.isReady()` but there's no timeout or error handling
2. **Missing child directives**: If geometry/material signals are never set, mesh is never created with no feedback
3. **Parent not available**: parentFn() returning null leaves mesh floating, not in scene graph
4. **Renderer signals null**: First effect runs before Scene3dComponent initializes - effects silently skip
5. **Shader compilation errors**: No validation or error handling for custom GLSL

---

## Requirements Fulfillment

### Requirement 1: InstancedMeshComponent

| Criterion                    | Status   | Concern                                    |
| ---------------------------- | -------- | ------------------------------------------ |
| count input required         | COMPLETE | No validation for count <= 0               |
| instanceMatrix input         | COMPLETE | No validation for array length > expected  |
| instanceColor input          | COMPLETE | No validation for NaN values               |
| updateInstanceAt method      | COMPLETE | None                                       |
| setMatrixAt method           | COMPLETE | None                                       |
| setColorAt method            | COMPLETE | None                                       |
| frustumCulled input          | COMPLETE | None                                       |
| usage input (static/dynamic) | COMPLETE | None                                       |
| DestroyRef cleanup           | COMPLETE | Geometry/material not disposed (by design) |
| DynamicDrawUsage for dynamic | COMPLETE | None                                       |

### Requirement 2: ShaderMaterialDirective

| Criterion               | Status   | Concern                          |
| ----------------------- | -------- | -------------------------------- |
| vertexShader required   | COMPLETE | No compilation error handling    |
| fragmentShader required | COMPLETE | No compilation error handling    |
| uniforms reactive       | COMPLETE | Null values may crash shaders    |
| defines input           | COMPLETE | None                             |
| transparent input       | COMPLETE | None                             |
| wireframe input         | COMPLETE | None                             |
| side input              | COMPLETE | None                             |
| depthTest/depthWrite    | COMPLETE | None                             |
| blending input          | COMPLETE | None                             |
| Auto-inject time        | COMPLETE | None                             |
| Auto-inject resolution  | COMPLETE | None                             |
| Auto-inject mouse       | PARTIAL  | Requires external mouse tracking |
| Material disposal       | COMPLETE | None                             |

### Requirement 3: EnvironmentComponent

| Criterion         | Status   | Concern                                 |
| ----------------- | -------- | --------------------------------------- |
| hdri path input   | COMPLETE | No path validation                      |
| preset input      | COMPLETE | CDN dependency risk                     |
| background input  | COMPLETE | None                                    |
| blur input (0-1)  | COMPLETE | Input not clamped to range              |
| intensity input   | COMPLETE | Input not clamped to > 0                |
| loading event     | COMPLETE | None                                    |
| loaded event      | COMPLETE | None                                    |
| error event       | COMPLETE | None                                    |
| encoding input    | MISSING  | Requirements specified, not implemented |
| Resource disposal | COMPLETE | None                                    |

### Requirement 4: Demand-Based Rendering

| Criterion                           | Status   | Concern                                 |
| ----------------------------------- | -------- | --------------------------------------- |
| frameloop input on Scene3dComponent | COMPLETE | None                                    |
| invalidate() method                 | COMPLETE | None                                    |
| SceneService.invalidate() proxy     | COMPLETE | None                                    |
| OrbitControls auto-invalidate       | COMPLETE | None                                    |
| Animation directives invalidate     | COMPLETE | None                                    |
| RAF stops when idle                 | COMPLETE | 100ms timeout may be too short          |
| FPS reports actual renders          | COMPLETE | None                                    |
| forceRender() escape hatch          | MISSING  | Requirements mentioned, not implemented |

### Requirement 5: Post-Processing Effects

| Criterion                                   | Status   | Concern                                 |
| ------------------------------------------- | -------- | --------------------------------------- |
| DOF focus/aperture/maxblur                  | COMPLETE | None                                    |
| DOF reactive updates                        | COMPLETE | None                                    |
| SSAO radius/intensity                       | PARTIAL  | Inputs exist but not connected          |
| SSAO kernelRadius/minDistance/maxDistance   | COMPLETE | None                                    |
| SSAO WebGL 1.0 fallback                     | MISSING  | Requirements specified, not implemented |
| ColorGrading saturation/contrast/brightness | COMPLETE | None                                    |
| ColorGrading gamma/exposure/vignette        | COMPLETE | None                                    |
| ColorGrading LUT input                      | MISSING  | Requirements specified, not implemented |
| Effect order input                          | MISSING  | Requirements specified, not implemented |

### Implicit Requirements NOT Addressed:

1. **Input validation for numeric ranges** - blur, intensity, gamma etc. should be clamped
2. **Error boundaries for WebGL failures** - Context loss, shader errors, resource limits
3. **Loading state feedback for all async operations** - Shader compilation, GSAP import
4. **Cancellation of in-flight async operations** - HDRI loading can be aborted but still consumes bandwidth
5. **Multi-scene isolation verification** - Each Scene3dComponent provides own services, but cross-scene effects not tested

---

## Edge Case Analysis

| Edge Case                            | Handled | How                               | Concern                           |
| ------------------------------------ | ------- | --------------------------------- | --------------------------------- |
| count=0 for InstancedMesh            | NO      | Creates zero-count mesh           | WebGL driver behavior varies      |
| count=1000000 (million instances)    | NO      | Attempts to allocate              | Memory exhaustion, no limit check |
| Null/undefined instanceMatrix        | YES     | Skips array copy                  | None                              |
| instanceMatrix wrong length          | YES     | Logs warning, skips               | Should throw for strictness       |
| instanceColor without instanceMatrix | YES     | Works correctly                   | None                              |
| Environment preset typo              | YES     | Falls through to null URL         | Silently clears environment       |
| HDRI 404 error                       | YES     | Emits error event                 | None                              |
| HDRI CORS blocked                    | YES     | Emits error event                 | Error message may be opaque       |
| ShaderMaterial empty string shaders  | NO      | Creates invalid material          | Should validate                   |
| Uniforms with undefined values       | NO      | Passed through                    | May crash shader                  |
| DOF negative focus                   | NO      | Passed to BokehPass               | Visual oddity                     |
| SSAO on transparent objects          | PARTIAL | Requirements mention, no handling | Artifacts on glass/water          |
| ColorGrading gamma=0                 | NO      | Creates divide-by-zero in shader  | NaN colors                        |
| Rapid frameloop mode switching       | NO      | Timeout race condition            | RAF may stop unexpectedly         |
| Component destroyed during load      | YES     | loadingAborted flag               | None                              |
| Multiple Environment components      | NO      | Last wins for scene.environment   | No warning                        |

---

## Integration Risk Assessment

| Integration                               | Failure Probability | Impact | Mitigation Present | Mitigation Needed          |
| ----------------------------------------- | ------------------- | ------ | ------------------ | -------------------------- |
| InstancedMesh + child geometry directives | LOW                 | HIGH   | Token signals      | Document required children |
| InstancedMesh + SceneGraphStore           | LOW                 | MEDIUM | isReady() check    | Add timeout/error          |
| Environment + PMREMGenerator              | MEDIUM              | HIGH   | None               | Add try-catch              |
| Environment + RGBELoader                  | MEDIUM              | MEDIUM | Error event        | Add retry logic            |
| ShaderMaterial + MATERIAL_SIGNAL          | LOW                 | HIGH   | Token provision    | None                       |
| Post-effects + EffectComposerService      | LOW                 | MEDIUM | addPass() checks   | Verify composer exists     |
| Float3d/Rotate3d + GSAP import            | LOW                 | MEDIUM | None               | Add .catch() handler       |
| All components + SceneService             | LOW                 | LOW    | DI guarantees      | None                       |

---

## Verdict

**Recommendation**: NEEDS_REVISION

**Confidence**: HIGH

**Top Risks**:

1. SSAO radius/intensity inputs silently non-functional
2. ColorGrading LUT requirement not implemented
3. No WebGL 2.0 feature detection for SSAO
4. PMREMGenerator exceptions unhandled

---

## What Robust Implementation Would Include

A bulletproof implementation of these features would have:

1. **Input Validation Layer**

   - Clamp numeric inputs to valid ranges
   - Validate array lengths strictly
   - Check for NaN/Infinity in numeric arrays
   - Type guards for uniform values

2. **Error Boundaries**

   - Try-catch around all Three.js operations that can throw
   - Error output events on all components
   - Graceful degradation rather than silent failure

3. **Retry Logic**

   - Environment HDRI loading with exponential backoff
   - GSAP import retry with fallback
   - WebGL context lost recovery

4. **Feature Detection**

   - WebGL 2.0 check before SSAO
   - Renderer capabilities query
   - Mobile/low-end device detection

5. **Loading States**

   - Explicit loading signals on all async components
   - Progress indicators for long operations
   - Skeleton states while loading

6. **Comprehensive Logging**

   - Development mode warnings for common mistakes
   - Performance warnings (too many instances, etc.)
   - Integration errors (missing child components)

7. **Offline Fallbacks**

   - Bundled low-res preset HDRIs
   - Placeholder materials for loading states
   - Cached environment maps

8. **Testing Infrastructure**
   - Unit tests for edge cases
   - Integration tests for component composition
   - Visual regression tests for effects

---

## Recommended Actions Before Approval

### Must Fix (Critical/Serious):

1. **Connect SSAO radius/intensity inputs** - Either map to SSAOPass properties or remove/rename inputs
2. **Add WebGL 2.0 check for SSAO** - Disable with warning on WebGL 1.0
3. **Wrap PMREMGenerator in try-catch** - Emit error event on failure
4. **Add GSAP import .catch() handlers** - Prevent silent animation failures
5. **Document count immutability** - Or implement recreation logic

### Should Fix (Moderate):

1. Add encoding input to EnvironmentComponent
2. Implement LUT support or document as deferred
3. Add effect order input for post-processing
4. Validate instanceMatrix/instanceColor array lengths strictly
5. Clamp blur input to 0-1 range

### Could Fix (Minor):

1. Add forceRender() escape hatch to RenderLoopService
2. Document polyhaven.com CDN dependency
3. Add warning for count <= 0
4. Add shader compilation error handling/reporting

---

**Review Date**: 2025-12-24
**Reviewer**: Code Logic Reviewer Agent
**Task ID**: TASK_2025_026
**Document Version**: 1.0
