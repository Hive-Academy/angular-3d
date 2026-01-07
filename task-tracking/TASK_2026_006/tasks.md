# Development Tasks - TASK_2026_006

**Total Tasks**: 24 | **Batches**: 5 | **Status**: 5/5 complete
**Commits**: Batch 1: d590352, Batch 2: 2766f66, Batch 3: 1f61f72, Batch 4: 4c3857a, Batch 5: 50a5228

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- GltfLoaderService.load() returns GltfLoadResult with progress(), data(), error(), loading() signals - VERIFIED
- TextureLoaderService.load() returns TextureLoadResult with same signal pattern - VERIFIED
- SceneService.camera() returns Signal<PerspectiveCamera | null> - VERIFIED
- SceneService.invalidate() exists and proxies to RenderLoopService - VERIFIED
- OBJECT_ID token and SceneGraphStore.getObject() pattern - VERIFIED in Float3dDirective
- effect() pattern with async GSAP import and cleanup - VERIFIED in Float3dDirective

### Risks Identified

| Risk                                                   | Severity | Mitigation                                                                |
| ------------------------------------------------------ | -------- | ------------------------------------------------------------------------- |
| effect() signal dependencies may not capture correctly | MEDIUM   | Follow Float3dDirective pattern exactly - read all signals in effect body |
| HDRI asset type not implemented                        | LOW      | Logs warning, documented in plan - consumer aware                         |
| StaggerGroupService Map without WeakMap                | LOW      | unregister() called in directive cleanup                                  |

### Edge Cases to Handle

- [x] Empty asset array to preload() - returns 100% progress, isReady = true
- [x] Same URL registered multiple times - leverages existing loader caching
- [x] Component destroyed during GSAP async import - check config signal validity
- [x] Multiple CinematicEntranceDirectives - each has independent state

---

## Batch 1: Foundation Services COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None
**Commit**: d590352

### Task 1.1: Create AssetPreloaderService Interfaces and Types

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`

**Spec Reference**: implementation-plan.md:176-220

**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\gltf-loader.service.ts:30-67`

**Quality Requirements**:

- Define AssetDefinition interface with url, type ('gltf' | 'texture' | 'hdri'), weight?, options?
- Define PreloadState interface with progress, isReady, errors, loadedCount, totalCount, cancel signals
- Define internal AssetLoadOperation interface
- Use proper JSDoc documentation matching existing service patterns
- Export types from the file

**Validation Notes**:

- Interface must match exactly what's in implementation-plan.md
- Signal types must use () => T pattern for read-only accessors

**Implementation Details**:

- Imports: `Signal` from `@angular/core`
- Key interfaces: AssetDefinition, PreloadState, AssetLoadOperation
- All signals should be readonly in PreloadState

---

### Task 1.2: Implement AssetPreloaderService Core Logic

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`

**Spec Reference**: implementation-plan.md:225-361

**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\gltf-loader.service.ts:86-182`

**Quality Requirements**:

- Injectable with providedIn: 'root'
- Inject GltfLoaderService and TextureLoaderService
- Implement preload(assets: AssetDefinition[]): PreloadState method
- Implement startAssetLoad() private method for each asset type
- Use computed() signals for progress aggregation
- Handle weighted progress calculation
- Support cancel() functionality
- HDRI type logs warning and returns 100% immediately

**Validation Notes**:

- effect() calls must have { allowSignalWrites: true } option
- Follow exact signal composition pattern from plan
- Errors from individual loaders aggregated into errors() signal

**Implementation Details**:

- Imports: Injectable, inject, signal, computed, effect from @angular/core
- Inject: GltfLoaderService, TextureLoaderService
- Track operations via Map<string, PreloadState>
- Operation counter for unique IDs

---

### Task 1.3: Create StaggerGroupService

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\stagger-group.service.ts`

**Spec Reference**: implementation-plan.md:1041-1129

**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\gltf-loader.service.ts` (service pattern)

**Quality Requirements**:

- Injectable with providedIn: 'root'
- Implement register(groupName, directive, index) method
- Implement unregister(groupName, directive) method
- Implement revealGroup(groupName, staggerDelay?) async method
- Implement hideGroup(groupName) async method
- Implement hasGroup(groupName) and getGroupSize(groupName) helper methods
- Default stagger delay: 150ms

**Validation Notes**:

- Service must handle forward reference to SceneRevealDirective type
- Use Map<string, Map<SceneRevealDirective, number>> for groups
- Sort by stagger index before revealing

**Implementation Details**:

- Imports: Injectable from @angular/core
- Uses setTimeout for stagger delays
- Returns Promise<void> from revealGroup/hideGroup

---

**Batch 1 Verification**:

- [x] All files exist at specified paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Types exported correctly
- [x] No TypeScript errors
- [x] code-logic-reviewer approved

---

## Batch 2: Cinematic Entrance Directive - COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 1
**Commit**: 2766f66

### Task 2.1: Create CinematicEntranceDirective Structure

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`

**Spec Reference**: implementation-plan.md:388-465

**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\float-3d.directive.ts:54-139`

**Quality Requirements**:

- Standalone directive with selector '[a3dCinematicEntrance]'
- Define EntrancePreset type and CinematicEntranceConfig interface
- Signal inputs: entranceConfig
- Output events: entranceStart, entranceComplete
- Inject SceneService with { optional: true }
- Inject DestroyRef for cleanup
- Internal state: gsapTimeline, orbitControls, animationStarted, originalCameraPosition

**Validation Notes**:

- Must follow Float3dDirective pattern exactly for DI and lifecycle
- Optional injection for SceneService allows directive to work without scene context

**Implementation Details**:

- Imports: Directive, input, output, inject, effect, DestroyRef from @angular/core
- Imports: SceneService from canvas module
- OrbitControls type from three-stdlib

---

### Task 2.2: Implement Preset Definitions

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`

**Spec Reference**: implementation-plan.md:600-664

**Quality Requirements**:

- Implement getPresetValues(preset, camera) private method
- Define 4 presets: 'dolly-in', 'orbit-drift', 'crane-up', 'fade-drift'
- Each preset returns startPosition, endPosition, startLookAt, endLookAt
- Use current camera position as default end position
- Sensible offset values for each preset type

**Validation Notes**:

- Default preset (when undefined) should use subtle dolly-in
- Camera may be null - handle gracefully with fallback position

**Implementation Details**:

- PresetValues interface with position/lookAt tuples
- All positions as [number, number, number] tuples
- Import THREE.Vector3 from 'three/webgpu'

---

### Task 2.3: Implement Camera Animation and OrbitControls Coordination

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`

**Spec Reference**: implementation-plan.md:489-596

**Quality Requirements**:

- Implement startEntrance() async method with dynamic GSAP import
- Implement setOrbitControls(controls) public method
- Disable OrbitControls during animation (enabled = false)
- Re-enable and sync target after animation
- Call sceneService.invalidate() on each GSAP update
- Implement prefersReducedMotion() check
- Implement cleanup() with timeline.kill()
- Public start() method for manual triggering

**Validation Notes**:

- Dynamic GSAP import: `const { gsap } = await import('gsap')`
- Check if destroyed during async import before proceeding
- Handle lookAt interpolation during animation via onUpdate

**Implementation Details**:

- GSAP timeline with position animation
- Interpolate lookAt manually in onUpdate callback
- timeline.progress() for calculating lookAt progress
- Re-enable controls and sync target in onComplete callback

---

**Batch 2 Verification**:

- [x] Directive compiles without errors
- [x] All 4 presets defined and working
- [x] GSAP dynamically imported (tree-shaking)
- [x] OrbitControls coordination works
- [x] prefersReducedMotion handling works
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] code-logic-reviewer approved

---

## Batch 3: Scene Reveal Directive - COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 1 (StaggerGroupService)
**Commit**: 1f61f72

### Task 3.1: Create SceneRevealDirective Structure

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: implementation-plan.md:717-805

**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\float-3d.directive.ts:92-139`

**Quality Requirements**:

- Standalone directive with selector '[a3dSceneReveal]'
- Define RevealAnimation type ('fade-in' | 'scale-pop' | 'rise-up')
- Define SceneRevealConfig interface
- Define OriginalState internal interface
- Signal inputs: revealConfig
- Output events: revealStart, revealComplete
- Inject SceneGraphStore, SceneService, OBJECT_ID, DestroyRef, StaggerGroupService (all optional where appropriate)
- Computed signal for object3D access

**Validation Notes**:

- Must use same object access pattern as Float3dDirective
- OBJECT_ID may be null - handle gracefully

**Implementation Details**:

- Imports from @angular/core, store, canvas, tokens, stagger-group.service
- OriginalState tracks position, scale, opacity Map, visible

---

### Task 3.2: Implement State Capture and Hidden State Setup

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: implementation-plan.md:806-880

**Quality Requirements**:

- Implement captureOriginalState(obj) - traverse for material opacities
- Implement setHiddenState(obj, config) for each animation type:
  - fade-in: set all material.opacity = 0, transparent = true
  - scale-pop: set scale to 0.01
  - rise-up: offset position.y by -2
- Implement registerWithStaggerGroup(config)
- Effect to initialize when object and config ready

**Validation Notes**:

- Material may be array or single - handle both
- Set material.needsUpdate = true after opacity change
- Call sceneService.invalidate() after state changes

**Implementation Details**:

- Traverse obj.traverse() for all children
- Check 'material' in child to detect meshes
- Use Map<Material, number> for original opacities

---

### Task 3.3: Implement Reveal Animations and Public API

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: implementation-plan.md:886-1036

**Quality Requirements**:

- Implement reveal() public async method
- Implement hide() public async method
- Implement animateFadeIn(), animateScalePop(), animateRiseUp() private methods
- Handle prefersReducedMotion - skip to end state immediately
- Implement restoreOriginalState() for cleanup
- Implement cleanup() with timeline.kill() and state restoration
- Unregister from stagger group in cleanup

**Validation Notes**:

- scale-pop uses 'back.out(1.4)' easing for overshoot effect
- Each animation type has its own GSAP tween
- Call sceneService.invalidate() in onUpdate for demand rendering

**Implementation Details**:

- Dynamic GSAP import: `const { gsap } = await import('gsap')`
- Check destroyed state after async import
- Timeline onComplete sets isHidden = false and emits event

---

**Batch 3 Verification**:

- [x] Directive compiles without errors
- [x] All 3 animation types work correctly
- [x] Original state captured and restored on cleanup
- [x] Stagger group registration works
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] code-logic-reviewer approved

---

## Batch 4: Exports and Demo Integration - COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batches 1, 2, 3
**Commit**: 4c3857a

### Task 4.1: Update Barrel Exports

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\index.ts`
- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\index.ts`

**Spec Reference**: implementation-plan.md:140-166

**Quality Requirements**:

- Export AssetPreloaderService, AssetDefinition, PreloadState from loaders/index.ts
- Export CinematicEntranceDirective, CinematicEntranceConfig, EntrancePreset from animation/index.ts
- Export SceneRevealDirective, SceneRevealConfig, RevealAnimation from animation/index.ts
- Export StaggerGroupService from animation/index.ts

**Validation Notes**:

- Use `export type` for interfaces to ensure tree-shaking
- Verify exports work from @hive-academy/angular-3d

**Implementation Details**:

- Follow existing export patterns in both index.ts files
- Use named exports with type keyword for interfaces

---

### Task 4.2: Create Demo Section Component

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\loading-entrance-demo-section.component.ts`

**Spec Reference**: implementation-plan.md:1133-1194, task-description.md:355-402

**Pattern to Follow**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\glass-sphere-hero-section.component.ts`

**Quality Requirements**:

- Standalone component with OnPush change detection
- Demonstrate full loading -> entrance -> reveal flow
- Use AssetPreloaderService to preload a GLTF model and texture
- Show loading progress in UI
- Apply CinematicEntranceDirective with dolly-in preset
- Apply SceneRevealDirective to multiple objects with stagger group
- Emit entranceComplete to trigger stagger reveal

**Validation Notes**:

- Must work with both WebGPU and WebGL backends
- Use existing demo app styling patterns
- Include inline documentation explaining the demo

**Implementation Details**:

- Imports: Scene3dComponent, OrbitControlsComponent, BoxComponent, etc.
- Imports: AssetPreloaderService, CinematicEntranceDirective, SceneRevealDirective, StaggerGroupService
- Template with 3D scene and UI overlay for progress
- Uses inject() for services

---

### Task 4.3: Integration Verification and Final Testing

**Status**: COMPLETE
**Files**:

- No new files - verification task

**Quality Requirements**:

- Run `npx nx build @hive-academy/angular-3d` - must pass
- Run `npx nx build angular-3d-demo` - must pass
- Run `npx nx serve angular-3d-demo` - demo must work
- Verify loading progress displays correctly
- Verify entrance animation plays after loading
- Verify stagger reveal triggers after entrance
- Verify OrbitControls disabled during entrance and re-enabled after
- Test with multiple refresh cycles to ensure cleanup works

**Validation Notes**:

- Test both fresh load and cached load scenarios
- Verify no console errors
- Check memory does not grow with repeated loads (no leaks)

**Implementation Details**:

- Manual testing in browser
- Verify 60 FPS during animations
- Test reduced motion preference (browser setting)

---

**Batch 4 Verification**:

- [x] All exports accessible from @hive-academy/angular-3d
- [x] Demo section displays and functions correctly
- [x] Full flow works: loading -> entrance -> reveal
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Demo build passes: `npx nx build angular-3d-demo`
- [x] code-logic-reviewer approved
- [x] All edge cases from validation handled

---

## Batch 5: QA Fixes and Space Station Demo - COMPLETE

**Developer**: frontend-developer
**Tasks**: 12 | **Dependencies**: Batches 1-4
**Priority**: Critical fixes from QA review + New demo scene
**Commit**: 50a5228

### Task 5.1: GSAP Import Error Handling [CRITICAL] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`

**Spec Reference**: future-enhancements.md:24-76 (Section 1.1)

**Pattern to Follow**: Existing try/catch pattern in the codebase

**Quality Requirements**:

- Wrap GSAP dynamic import in try/catch block at lines 416-422
- Re-enable OrbitControls on failure via reEnableControls() helper method
- Add skipToEnd() fallback when GSAP fails to load
- Log error to console with clear message prefix [CinematicEntrance]

**Validation Notes**:

- CRITICAL: Without this fix, users lose all scene interactivity permanently if GSAP fails
- Must handle the case where orbitControls is already disabled when import fails

**Implementation Details**:

- Add private reEnableControls() helper method
- Modify startEntrance() to wrap GSAP import in try/catch
- On catch: log error, call skipToEnd with fallback, re-enable controls

---

### Task 5.2: Material Transparency State Restoration [CRITICAL] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: future-enhancements.md:79-132 (Section 1.2)

**Quality Requirements**:

- Add `transparent: Map<Material, boolean>` to OriginalState interface (line 148)
- Capture original transparent value in captureOriginalState() method
- Restore transparent flag in restoreOriginalState() method
- Ensure mat.needsUpdate = true after restoration

**Validation Notes**:

- CRITICAL: Materials that should be opaque remain transparent causing Z-fighting
- Must capture BEFORE setting transparent = true in setHiddenState()

**Implementation Details**:

- Update OriginalState interface with transparent Map
- In captureOriginalState(): add transparentMap.set(mat, mat.transparent)
- In restoreOriginalState(): add mat.transparent = this.originalState.transparent.get(mat) ?? false

---

### Task 5.3: Effect Cleanup in AssetPreloaderService [CRITICAL] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`

**Spec Reference**: future-enhancements.md:135-195 (Section 1.3)

**Quality Requirements**:

- Import EffectRef from @angular/core
- Add effectRef field to AssetLoadOperation interface (line 89-102)
- Store EffectRef from effect() calls in startAssetLoad() (lines 256-271)
- Destroy effects in cancel() method (lines 210-215)
- Return effectRef in the operation object

**Validation Notes**:

- CRITICAL: Memory accumulates over time in SPAs with dynamic asset loading
- Service is providedIn: 'root', so effects persist for application lifetime

**Implementation Details**:

- Import: `type EffectRef` from '@angular/core'
- Update interface: `effectRef?: EffectRef`
- In startAssetLoad: `const effectRef = effect(...)`; return it in operation object
- In cancel(): `operations.forEach(op => op.effectRef?.destroy())`

---

### Task 5.4: Promise Resolution on hide() [CRITICAL] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: future-enhancements.md:199-267 (Section 1.4)

**Quality Requirements**:

- Add private revealResolve: (() => void) | null = null field
- Store resolve reference in reveal() method's Promise constructor
- Call resolve and clear reference when timeline completes
- In hide(): resolve pending reveal promise before killing timeline

**Validation Notes**:

- CRITICAL: Code like `await reveal(); doSomething()` will never execute doSomething()
- Must handle case where hide() is called during reveal animation

**Implementation Details**:

- Add field: `private revealResolve: (() => void) | null = null`
- In reveal(): `this.revealResolve = resolve`; in onComplete: `this.revealResolve = null; resolve()`
- In hide(): before killing timeline, `if (this.revealResolve) { this.revealResolve(); this.revealResolve = null; }`

---

### Task 5.5: Add Event Outputs (FR-4.2) [HIGH] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`

**Spec Reference**: future-enhancements.md:271-330 (Section 2.1)

**Quality Requirements**:

- Add `loadProgress = output<number>()` output
- Add `loadComplete = output<void>()` output
- Create effect in constructor to watch preloadState and emit events
- Emit loadProgress when progress changes
- Emit loadComplete when isReady() becomes true (emit only once)

**Validation Notes**:

- Requirements FR-4.2 specify these outputs but were not implemented
- Should only emit loadComplete once per preload cycle

**Implementation Details**:

- Import output from @angular/core (already imported)
- Add outputs in Outputs section
- Add effect with tracking signal to avoid duplicate loadComplete emissions
- Effect watches `this.entranceConfig()?.preloadState` signals

---

### Task 5.6: Entrance Reset Capability [HIGH] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`

**Spec Reference**: future-enhancements.md:334-382 (Section 2.2)

**Quality Requirements**:

- Add public reset() method
- Kill any running animation timeline
- Restore camera to original position (stored in originalCameraPosition)
- Reset animationStarted flag to false
- Call sceneService.invalidate() after camera restoration
- Add JSDoc documentation for the method

**Validation Notes**:

- Currently, once entrance has played, calling start() again does nothing
- The demo's replayDemo() relies on being able to re-trigger the entrance

**Implementation Details**:

- Check and kill gsapTimeline
- Copy originalCameraPosition back to camera.position
- Set animationStarted = false
- Call sceneService?.invalidate()

---

### Task 5.7: autoReveal Default Value Fix [HIGH] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: future-enhancements.md:452-475 (Section 2.4)

**Quality Requirements**:

- Change autoReveal default comment from `@default false` to `@default true` (line 141-142)
- Update JSDoc comment to reflect the intended behavior per FR-3.1
- NOTE: The actual runtime default is already `false` via `config.autoReveal` check - keep as false since stagger groups typically control reveal

**Validation Notes**:

- Requirements FR-3.1 states autoReveal should default to true
- However, current implementation uses false which is safer for stagger group patterns
- Update documentation to document intentional design decision

**Implementation Details**:

- Update JSDoc to explain why default is false: "Set to false by default to allow StaggerGroupService coordination. Set to true for standalone use."

---

### Task 5.8: Extract GSAP Loader Utility [MEDIUM] - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\utils\gsap-loader.ts`
- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: future-enhancements.md:481-537 (Section 3.1)

**Quality Requirements**:

- Create gsap-loader.ts utility in new utils folder
- Export loadGsap(isDestroyed: () => boolean): Promise<GsapLoadResult | null>
- Include proper try/catch error handling
- Return null if caller destroyed during async import
- Update both directives to use the shared utility

**Validation Notes**:

- Reduces code duplication across 3 files
- Ensures consistent error handling pattern

**Implementation Details**:

- Create utils/ directory
- Define GsapLoadResult interface with gsap property
- Export async function with error handling
- Update imports and usage in both directives

---

### Task 5.9: Animation Constants [MEDIUM] - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\animation-constants.ts`
- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\stagger-group.service.ts`

**Spec Reference**: future-enhancements.md:540-573 (Section 3.2)

**Quality Requirements**:

- Create animation-constants.ts with REVEAL_ANIMATION_DEFAULTS object
- Define: HIDDEN_SCALE (0.01), RISE_UP_OFFSET (2), STAGGER_DELAY_MS (150), SCALE_POP_OVERSHOOT (1.4)
- Add JSDoc for each constant
- Update scene-reveal.directive.ts lines 495, 500 to use constants
- Update stagger-group.service.ts line 75 to use STAGGER_DELAY_MS

**Validation Notes**:

- Improves code readability and maintainability
- Makes values easily discoverable and modifiable

**Implementation Details**:

- Use `as const` for type safety
- Export object with descriptive JSDoc comments
- Import and use in both files

---

### Task 5.10: Developer Warnings [MEDIUM] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: future-enhancements.md:576-614 (Section 3.3)

**Quality Requirements**:

- Add console.warn when OBJECT_ID is missing and config is provided
- Add console.warn when SceneService is missing during animation attempt
- Only warn once per directive instance (use flag)
- Prefix warnings with [SceneRevealDirective]
- Include actionable guidance in warning messages

**Validation Notes**:

- Improves developer experience with actionable error messages
- SceneService missing causes frozen render with no indication

**Implementation Details**:

- Add private hasWarnedObjectId = false and hasWarnedSceneService = false flags
- Add warnings in constructor effect when conditions are met
- Clear and specific warning messages with suggested fixes

---

### Task 5.11: Type Safety - Remove Non-Null Assertions [MEDIUM] - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`

**Spec Reference**: future-enhancements.md:617-649 (Section 3.4)

**Quality Requirements**:

- Replace non-null assertions (!) with proper null guards at lines 548, 570-576, 590
- Use early returns with type narrowing
- Store narrowed values in local constants for TypeScript inference
- No functional changes, only type safety improvements

**Validation Notes**:

- Prevents potential runtime errors from race conditions
- Improves code quality and maintainability

**Implementation Details**:

- In animateFadeIn: `if (!this.gsapTimeline || !this.originalState) return;`
- Create local const `timeline = this.gsapTimeline`; `originalState = this.originalState`
- Use local consts instead of ! assertions

---

### Task 5.12: Create Space Station Demo Scene [NEW FEATURE] - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\space-station-demo-section.component.ts`
- MODIFY: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase.component.ts` (add to route)

**Spec Reference**: User request for additional demo

**Pattern to Follow**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\loading-entrance-demo-section.component.ts`

**Quality Requirements**:

- Create new demo section component with OnPush change detection
- Use different entrance preset: 'crane-up' or 'orbit-drift'
- Use different reveal animations: 'scale-pop' as primary, 'rise-up' as secondary
- Include multiple stagger groups demonstrating coordination (e.g., 'station-core', 'station-modules')
- Add to angular-3d-showcase route imports
- Style consistent with existing demo sections
- Include feature cards explaining the demo

**Validation Notes**:

- Demonstrates variety of presets and animation combinations
- Shows multiple stagger group coordination

**Implementation Details**:

- Use SphereComponent and TorusComponent for space station parts
- Two stagger groups: core (center sphere) and modules (surrounding shapes)
- Different timing for each group (core reveals first, then modules)
- Include planet/nebula background for theme

---

**Batch 5 Verification**:

- [x] All CRITICAL fixes (5.1-5.4) implemented and tested
- [x] All HIGH priority fixes (5.5-5.7) implemented
- [x] All MEDIUM priority improvements (5.8-5.11) implemented
- [x] Space station demo works correctly
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Demo build passes: `npx nx build angular-3d-demo`
- [x] code-logic-reviewer approved (awaiting team-leader)
- [x] No regression in existing functionality

---

## Summary

| Batch | Name                         | Tasks | Developer          | Dependencies    |
| ----- | ---------------------------- | ----- | ------------------ | --------------- |
| 1     | Foundation Services          | 3     | frontend-developer | None            |
| 2     | Cinematic Entrance Directive | 3     | frontend-developer | Batch 1         |
| 3     | Scene Reveal Directive       | 3     | frontend-developer | Batch 1         |
| 4     | Exports and Demo Integration | 3     | frontend-developer | Batches 1, 2, 3 |
| 5     | QA Fixes and Space Station   | 12    | frontend-developer | Batches 1-4     |

**Total Estimated Time**: 18-22 hours (original 10-12 + 8-10 for Batch 5)

**Critical Paths**:

- Batch 1 blocks all other batches (foundation services)
- Batches 2 and 3 can be done in parallel after Batch 1
- Batch 4 requires all previous batches complete
- Batch 5 requires all previous batches complete (QA fixes)
