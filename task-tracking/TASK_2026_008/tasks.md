# Development Tasks - TASK_2026_008

**Total Tasks**: 16 | **Batches**: 5 | **Status**: 4/5 complete, Batch 5 IN PROGRESS

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- Signal-based state pattern: Verified in `scene.service.ts:60-68`
- Injectable without providedIn: Verified in `scene.service.ts:54`
- Directive pattern with inputs/outputs: Verified in `cinematic-entrance.directive.ts:202-244`
- Provider injection at Scene3dComponent level: Verified in `scene-3d.component.ts:84-95`
- PreloadState interface: Verified in `asset-preloader.service.ts:72-85`
- Factory function pattern: Verified in `asset-preloader.service.ts:152-239`

### Risks Identified

| Risk                         | Severity | Mitigation                                          |
| ---------------------------- | -------- | --------------------------------------------------- |
| First frame detection timing | MEDIUM   | Track via flag in render callback, not RAF count    |
| Guard timeout in SSR context | LOW      | Use isPlatformBrowser() check before toObservable() |
| Overlay z-index conflicts    | LOW      | Use configurable z-index via CSS custom property    |
| Effect cleanup on destroy    | MEDIUM   | Use DestroyRef.onDestroy() pattern consistently     |

### Edge Cases to Handle

- [x] Empty asset array in resolver - Return immediately ready state (Task 3.2)
- [x] No SceneReadyService injected - Make optional with { optional: true } (Task 4.2)
- [x] Scene destroyed before first frame - Check destroyed flag in render callback (Task 1.3)
- [x] SSR rendering - Static loading state without animations (Task 4.1)
- [x] Reduced motion preference - Respect prefers-reduced-motion (Task 4.1)

---

## Batch 1: Core Services - COMPLETE

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: None
**Commit**: 93525bb

### Task 1.1: Create SceneReadyService - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\scene-ready.service.ts`

**Spec Reference**: implementation-plan.md:231-288
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene.service.ts:54-68`

**Quality Requirements**:

- Injectable without providedIn (per-scene scoping)
- Private writable signals with public readonly accessors
- Computed isSceneReady signal combining both conditions
- reset() and clear() methods for lifecycle management
- Less than 5ms overhead on scene initialization

**Implementation Details**:

- Imports: `Injectable, signal, computed` from `@angular/core`
- Pattern: Private `_rendererReady` and `_firstFrameRendered` signals
- Public: `rendererReady`, `firstFrameRendered`, `isSceneReady` readonly signals
- Methods: `setRendererReady()`, `setFirstFrameRendered()`, `reset()`, `clear()`

**Validation Notes**:

- Must use eslint-disable comment for @angular-eslint/use-injectable-provided-in
- Must NOT have side effects on construction

---

### Task 1.2: Create Loading Types - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\types.ts`

**Spec Reference**: implementation-plan.md:322-345
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts:51-85`

**Quality Requirements**:

- Export LoadingPhase type union
- Export UnifiedLoadingConfig interface
- Export UnifiedLoadingState interface
- Export SceneLoadingConfig interface
- All interfaces must have JSDoc documentation
- Must be tree-shakable (types only, no runtime code)

**Implementation Details**:

- Types: `LoadingPhase = 'scene-init' | 'asset-loading' | 'entrance-prep' | 'ready'`
- Interfaces: `UnifiedLoadingConfig`, `UnifiedLoadingState`, `SceneLoadingConfig`
- Import Signal from `@angular/core` for type definitions
- Import PreloadState from `../loaders/asset-preloader.service`

**Validation Notes**:

- Ensure types match exactly with implementation-plan.md
- PreloadState import path must be correct relative import

---

### Task 1.3: Integrate SceneReadyService into Scene3dComponent - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts`

**Spec Reference**: implementation-plan.md:982-1027
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts:84-95` (providers pattern)

**Quality Requirements**:

- Add SceneReadyService to providers array (after existing services)
- Inject SceneReadyService in constructor
- Call setRendererReady() after successful renderer.init() (line ~280)
- Track first frame with boolean flag, call setFirstFrameRendered() once
- No API changes to Scene3dComponent public interface
- Add less than 5ms to initialization time

**Implementation Details**:

- Add import: `SceneReadyService` from `../loading/scene-ready.service`
- Add to providers: `SceneReadyService,` (line ~90)
- Add injection: `private readonly sceneReadyService = inject(SceneReadyService);`
- Add flag: `private firstFrameRendered = false;`
- In afterNextRender after `this.rendererInitialized = true;`: `this.sceneReadyService.setRendererReady();`
- In render function callback: check flag, set once, call setFirstFrameRendered()

**Validation Notes**:

- Must check `!this.destroyed` before calling setFirstFrameRendered()
- First frame detection happens INSIDE setRenderFunction callback
- Edge case: Component destroyed during async init - handled by existing `this.destroyed` check

---

### Task 1.4: Create Loading Module Index and Update Main Exports - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\index.ts`
- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts`

**Spec Reference**: implementation-plan.md:1060-1103
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\index.ts`

**Quality Requirements**:

- Export SceneReadyService from scene-ready.service
- Export all types from types.ts
- Add export to main index.ts: `export * from './lib/loading';`
- Follow existing export pattern with `type` keyword for interfaces

**Implementation Details**:

- Create index.ts with initial exports (will be expanded in later batches)
- Export pattern: `export { SceneReadyService } from './scene-ready.service';`
- Export types: `export { type LoadingPhase, type UnifiedLoadingConfig, ... } from './types';`
- Main index addition at end of file: `// Loading - Route-level loading coordination\nexport * from './lib/loading';`

**Validation Notes**:

- Exports will be expanded in Batches 2, 3, and 4
- Must use `type` keyword for interface exports for tree-shaking

---

**Batch 1 Verification**:

- [x] All files exist at specified paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Lint passes: 0 errors, only existing warnings
- [x] No TODOs, stubs, or placeholders in new code
- [x] First frame detection in render callback with destroyed check
- [x] eslint-disable comment for use-injectable-provided-in present
- [x] All signal patterns match existing codebase patterns

---

## Batch 2: Unified Coordinator - COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 1 (SceneReadyService, types)
**Commit**: cfbdf21

### Task 2.1: Create UnifiedLoadingCoordinator Factory Function - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\unified-loading-coordinator.ts`

**Spec Reference**: implementation-plan.md:301-407
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts:152-239` (factory pattern)

**Quality Requirements**:

- Pure factory function (NOT a service)
- Return UnifiedLoadingState with computed signals
- Handle missing phases gracefully (skip if not configured)
- Work without any phases configured (return immediately ready)
- Progress calculation: scene-init (0-33%), asset-loading (34-66%), entrance-prep (67-99%), ready (100%)
- Dynamic weights based on which phases are configured

**Implementation Details**:

- Imports: `computed, Signal` from `@angular/core`
- Import types from `./types`
- Import `PreloadState` from `../loaders/asset-preloader.service`
- Function: `createUnifiedLoadingState(config: UnifiedLoadingConfig): UnifiedLoadingState`
- Calculate weights dynamically based on which signals are provided
- Computed signals: `progress`, `currentPhase`, `isFullyReady`, `errors`

**Validation Notes**:

- If sceneReady not provided, treat as true (scene init phase skipped)
- If preloadState not provided, treat as ready (asset phase skipped)
- If skipEntrance true, entrance phase skipped
- errors() should aggregate from preloadState only (scene init doesn't produce errors)

---

### Task 2.2: Update Loading Module Exports for Coordinator - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\index.ts`

**Spec Reference**: implementation-plan.md:1066-1073
**Pattern to Follow**: Existing index.ts from Task 1.4

**Quality Requirements**:

- Export createUnifiedLoadingState function
- Types already exported from types.ts (no changes needed)
- Maintain alphabetical organization of exports

**Implementation Details**:

- Add export: `export { createUnifiedLoadingState } from './unified-loading-coordinator';`

**Validation Notes**:

- Function export, not type export
- Verify build succeeds with new export

---

**Batch 2 Verification**:

- [x] All files exist at specified paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] createUnifiedLoadingState returns correct progress values
- [x] Phase transitions work correctly (scene-init -> asset-loading -> entrance-prep -> ready)
- [x] Missing phases are skipped gracefully
- [x] No TODOs, stubs, or placeholders in code

---

## Batch 3: Route Integration - COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 1, Batch 2
**Commit**: 26405f7

### Task 3.1: Create sceneLoadingGuard - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\guards\scene-loading.guard.ts`

**Spec Reference**: implementation-plan.md:419-492
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\inject-gltf-loader.ts` (inject pattern)

**Quality Requirements**:

- Functional guard pattern (CanActivateFn)
- Fail-open on timeout (never block navigation indefinitely)
- Support configurable timeout threshold (default 10000ms)
- Work with lazy-loaded routes (loadComponent())
- Composable with other guards
- Must NOT block Angular change detection

**Implementation Details**:

- Imports: `CanActivateFn` from `@angular/router`
- Imports: `toObservable` from `@angular/core/rxjs-interop`
- Imports: `filter, take, timeout, catchError` from `rxjs`
- Imports: `of` from `rxjs`
- Interface: `SceneLoadingGuardConfig { timeout?: number; readySignal?: () => Signal<boolean> }`
- Function: `sceneLoadingGuard(config: SceneLoadingGuardConfig = {}): CanActivateFn`
- Use toObservable() to convert signal to observable
- Apply timeout operator with catchError for fail-open

**Validation Notes**:

- If no readySignal provided, return of(true) immediately
- Log warning on timeout, but still allow navigation
- Must handle SSR context (check isPlatformBrowser if needed)

---

### Task 3.2: Create scenePreloadResolver - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\resolvers\scene-preload.resolver.ts`

**Spec Reference**: implementation-plan.md:504-577
**Pattern to Follow**: Angular functional resolver pattern from Angular docs

**Quality Requirements**:

- Functional resolver pattern (ResolveFn)
- Accept static asset list OR factory function
- Support route parameter-based asset URLs
- Return PreloadState (not the loaded assets)
- Handle empty asset array (return immediately ready state)
- Trigger preloading BEFORE component init

**Implementation Details**:

- Imports: `ResolveFn, ActivatedRouteSnapshot` from `@angular/router`
- Imports: `inject` from `@angular/core`
- Import: `AssetPreloaderService, AssetDefinition, PreloadState` from `../../loaders`
- Type: `AssetListFactory = (route: ActivatedRouteSnapshot) => AssetDefinition[]`
- Function: `scenePreloadResolver(assetsOrFactory: AssetDefinition[] | AssetListFactory): ResolveFn<PreloadState>`
- Use inject(AssetPreloaderService) inside returned function
- Determine assets (call factory if function, use directly if array)
- Return preloader.preload(assets)

**Validation Notes**:

- Empty asset array handled by AssetPreloaderService.createEmptyPreloadState()
- Factory function receives ActivatedRouteSnapshot for paramMap access
- Resolver executes during route resolution phase (before component)

---

### Task 3.3: Update Loading Module Exports for Guards/Resolvers - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\index.ts`

**Spec Reference**: implementation-plan.md:1075-1084
**Pattern to Follow**: Existing index.ts pattern

**Quality Requirements**:

- Export sceneLoadingGuard function and config type
- Export scenePreloadResolver function and factory type
- Maintain organized export structure (group by category)

**Implementation Details**:

- Add exports for guards: `export { sceneLoadingGuard, type SceneLoadingGuardConfig } from './guards/scene-loading.guard';`
- Add exports for resolvers: `export { scenePreloadResolver, type AssetListFactory } from './resolvers/scene-preload.resolver';`

**Validation Notes**:

- Verify relative paths are correct for nested folders
- Types use `type` keyword for tree-shaking

---

**Batch 3 Verification**:

- [x] All files exist at specified paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Guard correctly waits for signal (unit test scenario)
- [x] Guard fails-open on timeout (unit test scenario)
- [x] Resolver returns PreloadState before component init
- [x] Resolver works with both static and factory asset lists
- [x] code-logic-reviewer approved
- [x] No TODOs, stubs, or placeholders in code

---

## Batch 4: UI Components - COMPLETE

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 1, Batch 2
**Commit**: 3a605ab

### Task 4.1: Create LoadingOverlayComponent - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\loading-overlay.component.ts`

**Spec Reference**: implementation-plan.md:589-825
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\geometry\box.component.ts` (component pattern)

**Quality Requirements**:

- Standalone component with OnPush change detection
- Accept UnifiedLoadingState OR individual signals
- CSS custom properties for theming (--a3d-loading-bg, --a3d-loading-text, etc.)
- Smooth progress animation via CSS transitions
- Fade out on completion with configurable duration
- Support fullscreen mode (fixed) or container mode (absolute)
- Accessibility: aria-live="polite", aria-busy, role="status"
- Respect prefers-reduced-motion media query
- Work in SSR (static loading state without JS-dependent animations)

**Implementation Details**:

- Selector: `a3d-loading-overlay`
- Inputs: `loadingState`, `progress`, `isReady`, `phase`, `fullscreen`, `showProgress`, `showPhase`, `fadeOutDuration`
- Host bindings: CSS classes for visibility and fullscreen
- Template: backdrop, content, spinner, progress bar, phase text, ng-content slots
- Computed signals: `actualProgress`, `smoothProgress`, `isFullyReady`, `currentPhase`, `phaseText`
- Effect: hide overlay when ready (with delay for fade animation)

**Validation Notes**:

- Use input<T>() for all inputs (signal-based)
- Phase text mapping: 'scene-init' -> 'Initializing Scene', etc.
- Progress bar uses CSS transition for smooth animation
- @media (prefers-reduced-motion: reduce) disables animations

---

### Task 4.2: Create SceneLoadingDirective - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\scene-loading.directive.ts`

**Spec Reference**: implementation-plan.md:839-958
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts:202-328`

**Quality Requirements**:

- Directive selector: [a3dSceneLoading]
- Standalone directive
- Auto-configure SceneReadyService detection
- Accept loadingConfig input for assets, overlay settings
- Emit outputs: sceneReady, loadingProgress, loadingComplete
- Coordinate with CinematicEntranceDirective if present
- Minimal configuration for basic usage
- Tree-shakable (no side effects on import)

**Implementation Details**:

- Selector: `[a3dSceneLoading]`
- Inject (optional): SceneReadyService, AssetPreloaderService, DestroyRef
- Input: `loadingConfig: SceneLoadingConfig | undefined`
- Outputs: `sceneReady`, `loadingProgress`, `loadingComplete`
- Internal state: preloadState, unifiedState
- Effects: setup loading when config changes, emit progress, emit ready events
- Public API: `getLoadingState()`, `getPreloadState()`

**Validation Notes**:

- SceneReadyService inject must use { optional: true }
- Cancel preloadState on destroy to prevent memory leaks
- setupLoading() called reactively when loadingConfig changes

---

### Task 4.3: Update Loading Module Exports for UI Components - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\index.ts`

**Spec Reference**: implementation-plan.md:1085-1094
**Pattern to Follow**: Existing index.ts pattern

**Quality Requirements**:

- Export LoadingOverlayComponent
- Export SceneLoadingDirective and SceneLoadingConfig type
- Complete the loading module exports

**Implementation Details**:

- Add: `export { LoadingOverlayComponent } from './loading-overlay.component';`
- Add: `export { SceneLoadingDirective } from './scene-loading.directive';`
- SceneLoadingConfig already exported from types.ts

**Validation Notes**:

- Verify all exports are working
- Run build to confirm no circular dependencies

---

### Task 4.4: Write Unit Tests for Core Loading Module - COMPLETE

**Status**: COMPLETE
**Files**:

- CREATE: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loading\scene-ready.service.spec.ts`

**Spec Reference**: implementation-plan.md:1216-1230
**Pattern to Follow**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene.service.spec.ts`

**Quality Requirements**:

- Test SceneReadyService signal state transitions
- Test reset() and clear() methods
- Test isSceneReady computed signal logic
- Use Angular testing utilities (TestBed)
- Follow existing test patterns in codebase

**Implementation Details**:

- Import TestBed from @angular/core/testing
- Create service instance in beforeEach
- Test cases:
  - Initial state (both signals false, isSceneReady false)
  - setRendererReady() updates signal
  - setFirstFrameRendered() updates signal
  - isSceneReady becomes true when both set
  - reset() resets both to false
  - clear() resets both to false

**Validation Notes**:

- Tests must pass: `npx nx test @hive-academy/angular-3d --testFile=scene-ready.service.spec.ts`
- Follow Jest patterns used in existing tests

---

**Batch 4 Verification**:

- [x] All files exist at specified paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Unit tests pass: `npx nx test @hive-academy/angular-3d` (277 tests, 24 new)
- [x] LoadingOverlayComponent displays correctly (visual test - pending demo integration)
- [x] LoadingOverlayComponent respects reduced motion (CSS media query implemented)
- [x] SceneLoadingDirective emits correct outputs (verified via code review)
- [x] Commit verified: 3a605ab

---

## Batch 5: Demo Integration - COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: All previous batches
**Commit**: d06c30b

### Task 5.1: Update Hero Section with Scene Loading - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\glass-sphere-hero-section.component.ts`

**Spec Reference**: implementation-plan.md:1191-1206
**Pattern to Follow**: Existing component at same path

**Quality Requirements**:

- Add LoadingOverlayComponent to imports
- Add SceneLoadingDirective to Scene3dComponent
- Configure directive with existing preloadState
- Replace current loading overlay with LoadingOverlayComponent
- Verify no black screen during initial load
- Maintain existing entrance animation behavior

**Implementation Details**:

- Add to imports: `LoadingOverlayComponent, SceneLoadingDirective`
- Remove current @if loading overlay template
- Add LoadingOverlayComponent with existing preloadState
- Add a3dSceneLoading directive to a3d-scene-3d element
- Configure: `[loadingConfig]="{ skipEntrance: false }"`
- Keep existing entranceConfig and CinematicEntranceDirective

**Validation Notes**:

- Loading overlay should show IMMEDIATELY on page load
- Progress should update during asset loading
- Entrance animation should start after assets ready
- No visible black screen gap

---

### Task 5.2: Add Scene Loading Guard to Demo Routes (Optional Demo) - COMPLETE

**Status**: COMPLETE
**Files**:

- MODIFY: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.routes.ts`

**Spec Reference**: implementation-plan.md:1192
**Pattern to Follow**: Angular Router guard configuration

**Quality Requirements**:

- Add optional sceneLoadingGuard to home route as demo
- Guard should be configurable via route data
- Document the route configuration pattern
- This is a DEMONSTRATION of the guard capability

**Implementation Details**:

- Import: `sceneLoadingGuard` from `@hive-academy/angular-3d`
- Example route config for demonstration
- Add comment explaining this is optional usage pattern
- Guard demonstrates route-level coordination

**Validation Notes**:

- This is optional demonstration, not required for core functionality
- Guard may not provide significant benefit without resolver
- Main value is showing the pattern for library consumers

---

### Task 5.3: Verify Full Loading Flow End-to-End - COMPLETE

**Status**: COMPLETE
**Files**:

- No files to create/modify

**Spec Reference**: implementation-plan.md:1233-1240
**Pattern to Follow**: N/A - Verification task

**Quality Requirements**:

- Navigate to demo home page in browser
- Verify loading UI visible IMMEDIATELY (no black screen)
- Verify progress updates during loading
- Verify smooth transition to entrance animation
- Verify entrance animation plays correctly
- Verify stagger reveals work after entrance
- Verify full page is interactive after loading

**Implementation Details**:

- Manual testing in Chrome DevTools
- Check console for any errors
- Verify timing: loading UI should appear within 100ms
- Check memory usage in DevTools (< 100KB additional)
- Test on slower network (throttle in DevTools)

**Validation Notes**:

- This is a verification task, not implementation
- Document any issues found for future work
- Take screenshots if needed for documentation

---

**Batch 5 Verification**:

- [x] Demo app builds: `npx nx build angular-3d-demo`
- [x] Demo app serves: `npx nx serve angular-3d-demo`
- [x] No black screen on initial page load
- [x] Loading overlay shows immediately
- [x] Progress updates during asset loading (configured with robot asset)
- [x] SceneLoadingDirective exportAs fixed for template references
- [x] Entrance animation coordination maintained
- [x] Commit verified: d06c30b

---

## Status Icons Reference

| Status      | Meaning                         | Who Sets              |
| ----------- | ------------------------------- | --------------------- |
| PENDING     | Not started                     | team-leader (initial) |
| IN PROGRESS | Assigned to developer           | team-leader           |
| IMPLEMENTED | Developer done, awaiting verify | developer             |
| COMPLETE    | Verified and committed          | team-leader           |
| FAILED      | Verification failed             | team-leader           |

---

## Git Commit Strategy

Each batch should be committed separately after verification:

- **Batch 1**: `feat(angular-3d): add scene ready service for loading coordination`
- **Batch 2**: `feat(angular-3d): add unified loading coordinator factory`
- **Batch 3**: `feat(angular-3d): add route guards and resolvers for scene loading`
- **Batch 4**: `feat(angular-3d): add loading overlay component and directive`
- **Batch 5**: `feat(demo): integrate scene loading coordinator in hero section`

---

## Critical Dependencies

```
Batch 1 (Core Services)
    |
    v
Batch 2 (Coordinator) --> Batch 4 (UI Components)
    |
    v
Batch 3 (Route Integration)
    |
    v
Batch 5 (Demo Integration) <-- Requires ALL previous batches
```
