# Development Tasks - TASK_2026_006

**Total Tasks**: 12 | **Batches**: 4 | **Status**: 4/4 complete
**Commits**: Batch 1: d590352, Batch 2: 2766f66, Batch 3: 1f61f72, Batch 4: 4c3857a

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

## Summary

| Batch | Name                         | Tasks | Developer          | Dependencies    |
| ----- | ---------------------------- | ----- | ------------------ | --------------- |
| 1     | Foundation Services          | 3     | frontend-developer | None            |
| 2     | Cinematic Entrance Directive | 3     | frontend-developer | Batch 1         |
| 3     | Scene Reveal Directive       | 3     | frontend-developer | Batch 1         |
| 4     | Exports and Demo Integration | 3     | frontend-developer | Batches 1, 2, 3 |

**Total Estimated Time**: 10-12 hours (per architect assessment)

**Critical Paths**:

- Batch 1 blocks all other batches (foundation services)
- Batches 2 and 3 can be done in parallel after Batch 1
- Batch 4 requires all previous batches complete
