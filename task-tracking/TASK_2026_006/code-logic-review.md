# Code Logic Review - TASK_2026_006

## Scene Loading & Cinematic Entrance Animation System

---

## Review Summary

| Metric              | Value          |
| ------------------- | -------------- |
| Overall Score       | 6.5/10         |
| Assessment          | NEEDS_REVISION |
| Critical Issues     | 2              |
| Serious Issues      | 5              |
| Moderate Issues     | 6              |
| Failure Modes Found | 11             |

---

## The 5 Paranoid Questions

### 1. How does this fail silently?

**AssetPreloaderService - Effect cleanup not handled:**
The `startAssetLoad` method creates `effect()` instances to sync progress from loader services, but these effects are never explicitly cleaned up. While Angular may handle this via injection context, the effects are created in a method call context, not component constructor context.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`
**Lines:** 256-271

```typescript
effect(
  () => {
    const progressValue = result.progress();
    const errorValue = result.error();
    const dataValue = result.data();

    _progress.set(progressValue);
    if (errorValue) {
      _error.set(errorValue);
    }
    if (dataValue) {
      _loaded.set(true);
    }
  },
  { allowSignalWrites: true }
);
```

**Impact:** Effects created outside injection context may leak or fail silently without proper cleanup. The effect may continue running even after `cancel()` is called.

**SceneRevealDirective - Materials may not restore transparency:**
When `setHiddenState` enables `transparent: true` on materials for fade-in, the `restoreOriginalState` method does NOT restore the original `transparent` property. If a material was originally opaque (`transparent: false`), it remains transparent after cleanup.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
**Lines:** 484-488 (setHiddenState), 611-627 (restoreOriginalState)

```typescript
// setHiddenState enables transparency:
mat.transparent = true;
mat.opacity = 0;

// restoreOriginalState only restores opacity, NOT transparent flag:
this.originalState.opacity.forEach((opacity, mat) => {
  mat.opacity = opacity;
  mat.needsUpdate = true;
});
// MISSING: mat.transparent = originalTransparent;
```

**Impact:** Visual rendering artifacts - materials that should be opaque remain transparent, causing Z-fighting and incorrect rendering order.

---

### 2. What user action causes unexpected behavior?

**Rapid reveal/hide toggle:**
If user rapidly calls `reveal()` then `hide()` while animation is in progress, the state becomes inconsistent. The `hide()` method kills the timeline but doesn't wait for completion, and the Promise from `reveal()` may never resolve.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
**Lines:** 388-409

```typescript
public async hide(): Promise<void> {
  if (this.isHidden || !this.isInitialized) {
    return;
  }

  // Kill any running animation
  if (this.gsapTimeline) {
    this.gsapTimeline.kill();  // <-- onComplete never fires
    this.gsapTimeline = null;
  }

  this.setHiddenState(obj, config);  // <-- Sets isHidden = true
}
```

**Impact:** The Promise returned from `reveal()` hangs forever because `onComplete` never fires. Code like `await reveal(); doSomething()` will never execute `doSomething()`.

**Entrance re-trigger:**
The `start()` method on `CinematicEntranceDirective` checks `!this.animationStarted` but there's no way to reset this flag. Once the entrance has played, calling `start()` again does nothing.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
**Lines:** 316-320

```typescript
public start(): void {
  if (!this.animationStarted) {  // <-- Once true, always true
    this.startEntrance();
  }
}
```

**Impact:** Users who want to replay the entrance animation (e.g., after navigating away and back) cannot do so without destroying and recreating the component.

---

### 3. What data makes this produce wrong results?

**Zero-weight assets break progress calculation:**
If ALL assets have `weight: 0`, the progress calculation returns 100 immediately even though loading hasn't started.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`
**Lines:** 173-174

```typescript
const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
if (totalWeight === 0) return 100; // <-- Returns 100% even if nothing loaded
```

**Impact:** `isReady()` returns true immediately, entrance animation starts before any assets are actually loaded.

**Negative stagger index:**
The `StaggerGroupService.register` accepts any number for index. Negative indices sort before positive ones, which may be intentional but isn't documented.

**Missing objectId produces null object:**
If `OBJECT_ID` token is not provided (directive applied to wrong element), `object3D()` returns null and the directive silently does nothing.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
**Lines:** 186-187, 246-248

```typescript
private readonly objectId = inject(OBJECT_ID, { optional: true });

private readonly object3D = computed(() => {
  if (!this.objectId) return null;  // <-- Silent null
  return this.sceneStore.getObject<Object3D>(this.objectId);
});
```

**Impact:** User applies directive to wrong element, expects reveal animation, nothing happens. No error, no warning.

---

### 4. What happens when dependencies fail?

**SceneService injection fails:**
Both directives inject `SceneService` with `{ optional: true }`. If not in a scene context, animations silently fail to invalidate the render.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
**Line:** 212

```typescript
private readonly sceneService = inject(SceneService, { optional: true });
```

**Impact:** Camera moves but scene doesn't re-render until next interaction. User sees frozen frame during animation.

**GSAP import fails:**
Dynamic GSAP import is wrapped in async function but errors aren't caught.

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
**Lines:** 416-422

```typescript
// Dynamic GSAP import for tree-shaking optimization
const { gsap } = await import('gsap'); // <-- No try/catch

// Safety check: directive may have been destroyed during async import
if (this.isDestroyed() || !this.entranceConfig()) {
  return;
}
```

**Impact:** If GSAP is not installed or import fails, unhandled Promise rejection. Camera is stuck at start position, OrbitControls remain disabled forever.

**Underlying loader service failures:**
If `GltfLoaderService.load()` or `TextureLoaderService.load()` throws synchronously (not just async error), `AssetPreloaderService.startAssetLoad()` crashes.

---

### 5. What's missing that the requirements didn't mention?

**FR-4.2 Event Flow - Missing `loadProgress` and `loadComplete` outputs:**
Requirements specify:

- "WHEN loading progress changes THEN the `loadProgress` output SHALL emit"
- "WHEN loading completes THEN the `loadComplete` output SHALL emit"

Neither directive implements these outputs. The `AssetPreloaderService` provides signals but no event emitters.

**FR-3.4 External Trigger API - Missing on SceneRevealDirective:**
Requirements state `autoReveal` defaults to `true`. Implementation defaults to `false`:

**File:** `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
**Line:** 141-142

```typescript
 * @default false  // <-- Should be true per FR-3.1
 */
autoReveal?: boolean;
```

**FR-4.4 Manual Control Mode:**
Requirements specify entrance directive should expose `start()` method when `autoStart: false`. This is implemented, but missing ability to re-start after completion (no reset functionality).

**NFR-3.2 Accessibility - Missing ARIA attributes:**
Requirements state:

- "Loading progress SHALL be exposed via ARIA attributes for screen readers"
- "Loading completion SHALL be announced to assistive technologies"

No ARIA implementation in any of the services or directives.

**Cleanup of StaggerGroupService registrations on group clear:**
When `clearGroup()` or `clearAllGroups()` is called, directives don't know they've been unregistered. They may try to unregister again on destroy (harmless but wasteful).

---

## Failure Mode Analysis

### Failure Mode 1: Effect Leak in AssetPreloaderService

- **Trigger**: Creating multiple preload operations, then calling cancel()
- **Symptoms**: Memory grows over time, console shows unexpected signal updates after cancel
- **Impact**: HIGH - Memory leak in long-running applications
- **Current Handling**: None - effects are not tracked or cleaned up
- **Recommendation**: Store effect cleanup functions in operation tracking, call them on cancel()

### Failure Mode 2: Material Transparency Not Restored

- **Trigger**: Apply SceneRevealDirective with fade-in to opaque material, then destroy component
- **Symptoms**: Material remains transparent after cleanup, visual artifacts in scene
- **Impact**: MEDIUM - Visual corruption that persists after component lifecycle
- **Current Handling**: Only opacity is restored, not transparent flag
- **Recommendation**: Store original transparent state in OriginalState, restore on cleanup

### Failure Mode 3: Hanging Promise on hide() During reveal()

- **Trigger**: Call reveal(), then immediately call hide() before animation completes
- **Symptoms**: Promise from reveal() never resolves, async code hangs
- **Impact**: HIGH - Application logic can deadlock waiting for animation
- **Current Handling**: Timeline killed but Promise resolve never called
- **Recommendation**: Store resolve/reject functions, call resolve on kill with partial state

### Failure Mode 4: Entrance Cannot Be Replayed

- **Trigger**: Entrance completes, user wants to replay it
- **Symptoms**: Calling start() does nothing
- **Impact**: MEDIUM - Limited API flexibility
- **Current Handling**: Flag prevents restart
- **Recommendation**: Add reset() method or make animationStarted resettable

### Failure Mode 5: OrbitControls Left Disabled on GSAP Import Failure

- **Trigger**: GSAP not installed, startEntrance() called
- **Symptoms**: Camera stuck, user cannot interact with scene at all
- **Impact**: CRITICAL - Complete loss of interactivity
- **Current Handling**: No try/catch around dynamic import
- **Recommendation**: Wrap GSAP import in try/catch, re-enable controls on error

### Failure Mode 6: Silent No-Op When Applied to Wrong Element

- **Trigger**: Apply a3dSceneReveal to element without OBJECT_ID token
- **Symptoms**: Nothing happens, no console warning, no error
- **Impact**: MEDIUM - Confusing developer experience
- **Current Handling**: Silent null return
- **Recommendation**: Log warning when objectId is null but config is provided

### Failure Mode 7: SceneService Missing Causes Frozen Render

- **Trigger**: Use directives outside Scene3dComponent context
- **Symptoms**: Camera/object moves but scene never re-renders
- **Impact**: MEDIUM - Animation appears broken to user
- **Current Handling**: Optional injection with null-safe calls
- **Recommendation**: Log warning when sceneService is null but animation is attempted

### Failure Mode 8: Zero Total Weight Returns 100% Progress

- **Trigger**: Call preload([]) or all assets with weight: 0
- **Symptoms**: isReady() immediately true, entrance starts with nothing loaded
- **Impact**: LOW - Edge case, unlikely in practice
- **Current Handling**: Returns 100 to avoid division by zero
- **Recommendation**: Handle as empty array case, return isReady: true only if totalCount is 0

### Failure Mode 9: Stagger Group Reveal During Component Destruction

- **Trigger**: Call revealGroup() while directives are being destroyed
- **Symptoms**: Some reveals fail silently, Promise.all may hang
- **Impact**: LOW - Race condition during navigation
- **Current Handling**: Individual reveal catches errors but doesn't prevent scheduling
- **Recommendation**: Check isDestroyed before scheduling reveals

### Failure Mode 10: Camera Not Available on First Effect Run

- **Trigger**: Effect runs before Scene3dComponent creates camera
- **Symptoms**: Entrance doesn't auto-start, requires manual start()
- **Impact**: LOW - Effect re-runs when camera becomes available
- **Current Handling**: Guards against null camera
- **Recommendation**: Document timing requirements or add retry mechanism

### Failure Mode 11: Disposed Materials in Animation

- **Trigger**: Material disposed externally while fade-in animation is running
- **Symptoms**: Error when trying to set opacity on disposed material
- **Impact**: LOW - Edge case with improper resource management elsewhere
- **Current Handling**: No check for disposed materials
- **Recommendation**: Check material.disposed before animating

---

## Critical Issues

### Issue 1: OrbitControls Permanently Disabled on GSAP Import Failure

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
- **Line**: 416-422
- **Scenario**: GSAP package not installed or CDN unreachable during dynamic import
- **Impact**: User cannot interact with scene at all - complete loss of functionality
- **Evidence**:

```typescript
// No try/catch around dynamic import
const { gsap } = await import('gsap');

// If import fails, this code never runs:
if (this.isDestroyed() || !this.entranceConfig()) {
  return;
}

// OrbitControls were disabled at line 390:
if (this.orbitControls) {
  this.orbitControls.enabled = false; // <-- Never re-enabled on error
}
```

- **Fix**: Wrap GSAP import in try/catch, call `onEntranceComplete()` or at minimum re-enable OrbitControls on error

### Issue 2: Material Transparency State Not Restored

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
- **Lines**: 484-488 (sets transparent=true), 611-627 (restores only opacity)
- **Scenario**: Any object with originally opaque materials using fade-in animation, then component destroys
- **Impact**: Permanent visual corruption - materials remain transparent affecting all scenes using same material
- **Evidence**:

```typescript
// In setHiddenState:
mat.transparent = true; // SETS transparent
mat.opacity = 0;

// In restoreOriginalState:
this.originalState.opacity.forEach((opacity, mat) => {
  mat.opacity = opacity;
  mat.needsUpdate = true;
  // MISSING: mat.transparent = originalTransparent;
});
```

- **Fix**: Store original `transparent` value in `OriginalState` interface, restore it in `restoreOriginalState()`

---

## Serious Issues

### Issue 1: Promise Hangs When hide() Interrupts reveal()

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
- **Lines**: 348-356 (reveal creates Promise), 401-405 (hide kills timeline)
- **Scenario**: User clicks reveal button, then immediately clicks hide button
- **Impact**: Promise from `reveal()` never resolves, `await reveal()` hangs forever
- **Evidence**:

```typescript
// reveal() creates Promise:
return new Promise<void>((resolve) => {
  this.gsapTimeline = gsap.timeline({
    onComplete: () => {
      resolve(); // Only called on natural completion
    },
  });
});

// hide() kills timeline without resolving:
this.gsapTimeline.kill(); // onComplete never fires
```

- **Fix**: Store resolve function reference, call it when timeline is killed

### Issue 2: Effect Cleanup Not Handled in AssetPreloaderService

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`
- **Lines**: 256-271
- **Scenario**: Multiple preload operations created and cancelled
- **Impact**: Potential memory leak, effects may continue running after cancel
- **Evidence**:

```typescript
effect(
  () => {
    /* syncs signals */
  },
  { allowSignalWrites: true }
); // No cleanup reference stored
```

- **Fix**: Store EffectRef from effect(), call destroy() on cancel

### Issue 3: No Entrance Replay Capability

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
- **Lines**: 250, 316-320
- **Scenario**: User wants to replay entrance animation (e.g., for demo purposes)
- **Impact**: Limited API - must destroy and recreate component to replay
- **Evidence**:

```typescript
private animationStarted = false;

public start(): void {
  if (!this.animationStarted) {  // Once true, blocks forever
    this.startEntrance();
  }
}
```

- **Fix**: Add `reset()` method that sets `animationStarted = false` and restores camera position

### Issue 4: Missing Required Event Outputs Per Requirements

- **File**: Multiple - directives should implement these
- **Scenario**: Consumer needs loading progress events per FR-4.2
- **Impact**: Requirements not met - missing `loadProgress` and `loadComplete` outputs
- **Evidence**: Requirements specify:
  - "WHEN loading progress changes THEN the `loadProgress` output SHALL emit the current percentage (0-100)"
  - "WHEN loading completes THEN the `loadComplete` output SHALL emit"
- **Fix**: Add `loadProgress = output<number>()` and `loadComplete = output<void>()` to appropriate directive or create wrapper component

### Issue 5: SceneRevealDirective autoReveal Default Wrong

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
- **Line**: 141-142
- **Scenario**: User expects autoReveal: true per requirements
- **Impact**: Deviation from requirements FR-3.1 which states "autoReveal: true" as default behavior
- **Evidence**:

```typescript
/**
 * @default false  // Should be true per FR-3.1
 */
autoReveal?: boolean;
```

- **Fix**: Change default documentation and implementation to true (or verify this was an intentional design decision)

---

## Moderate Issues

### Issue 1: No Warning When SceneService Missing

- **File**: Both directives
- **Scenario**: Directive used outside Scene3dComponent
- **Impact**: Animations run but scene doesn't re-render
- **Fix**: Log warning when sceneService is null during animation

### Issue 2: No Warning When OBJECT_ID Missing

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
- **Lines**: 246-248
- **Scenario**: Directive applied to element without OBJECT_ID token
- **Impact**: Silent failure - confusing DX
- **Fix**: Log warning when objectId is null but config is provided

### Issue 3: StaggerGroupService clearGroup Doesn't Notify Directives

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\stagger-group.service.ts`
- **Lines**: 268-270
- **Scenario**: Service consumer calls clearGroup(), directives still think they're registered
- **Impact**: Minor - directives may try to unregister already-cleared entries
- **Fix**: Consider WeakMap or event emission for group clearing

### Issue 4: Missing NFR-3.2 Accessibility Requirements

- **Files**: All implementation files
- **Scenario**: Screen reader users need loading progress information
- **Impact**: Accessibility requirements not met
- **Fix**: Add ARIA live regions for progress updates

### Issue 5: No JSDoc on Many Public Methods

- **Files**: Various
- **Scenario**: Consumers need API documentation
- **Impact**: Developer experience degraded
- **Fix**: Add comprehensive JSDoc to all public API methods

### Issue 6: Preset Values Don't Consider Scene Scale

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
- **Lines**: 511-573
- **Scenario**: Scene with very large or very small scale
- **Impact**: Preset animations may be too subtle or too dramatic
- **Fix**: Consider scene bounding box for adaptive presets

---

## Data Flow Analysis

```
User Request: Load Scene with Entrance Animation
        |
        v
+------------------------+
| AssetPreloaderService  |
| preload(assets[])      |
+------------------------+
        |
        | Creates effects to sync from loaders
        | [GAP: Effects not cleaned up on cancel]
        v
+-------------------+     +---------------------+
| GltfLoaderService |     | TextureLoaderService|
| load(url)         |     | load(url)           |
+-------------------+     +---------------------+
        |                         |
        | progress signals        | progress signals
        |_________________________|
                    |
                    v
           +----------------+
           | PreloadState   |
           | progress()     |
           | isReady()      |
           | errors()       |
           +----------------+
                    |
                    | isReady() becomes true
                    | [GAP: What if errors.length > 0?]
                    v
     +--------------------------+
     | CinematicEntranceDirective|
     | effect() watching isReady |
     +--------------------------+
                    |
                    | Disables OrbitControls
                    | [GAP: Not re-enabled on GSAP import failure]
                    v
            +----------------+
            | GSAP import()  |
            | [GAP: No try/catch]
            +----------------+
                    |
                    v
            +----------------+
            | Camera Animation|
            | invalidate() calls
            +----------------+
                    |
                    | Animation completes
                    v
     +----------------------+
     | onEntranceComplete() |
     | Re-enable OrbitControls
     | Emit entranceComplete
     +----------------------+
                    |
                    v
    +------------------------+
    | Component Handler      |
    | onEntranceComplete()   |
    | calls revealGroup()    |
    +------------------------+
                    |
                    v
     +------------------------+
     | StaggerGroupService    |
     | revealGroup('hero')    |
     +------------------------+
                    |
                    | setTimeout stagger
                    v
     +------------------------+
     | SceneRevealDirective[] |
     | reveal() called        |
     | [GAP: What if destroyed during setTimeout?]
     +------------------------+
                    |
                    | Sets hidden state
                    | [GAP: transparent flag not restored]
                    v
            +----------------+
            | GSAP Animation |
            | Opacity/Scale/Y|
            +----------------+
                    |
                    | Animation completes
                    v
          +------------------+
          | revealComplete   |
          | emit             |
          +------------------+
```

### Gap Points Identified:

1. **Effect Cleanup**: Effects in AssetPreloaderService not cleaned up on cancel
2. **Error Handling**: isReady() becomes true even if some assets failed - entrance starts
3. **GSAP Import Failure**: No try/catch, OrbitControls left disabled
4. **Destruction During Stagger**: setTimeout may fire after directive destroyed
5. **Material Transparency**: Original transparent flag not stored/restored
6. **Promise Resolution**: hide() doesn't resolve pending reveal() Promise

---

## Requirements Fulfillment

| Requirement                  | Status       | Concern                                      |
| ---------------------------- | ------------ | -------------------------------------------- |
| FR-1.1 Asset Registration    | COMPLETE     | Works correctly                              |
| FR-1.2 Signal-Based State    | COMPLETE     | Works correctly                              |
| FR-1.3 Loader Integration    | COMPLETE     | Works correctly                              |
| FR-1.4 Service Configuration | COMPLETE     | providedIn: 'root' implemented               |
| FR-2.1 Directive Config      | COMPLETE     | All config options implemented               |
| FR-2.2 Camera Animation      | COMPLETE     | GSAP timeline works                          |
| FR-2.3 OrbitControls Coord   | PARTIAL      | Not re-enabled on error paths                |
| FR-2.4 Preset Definitions    | COMPLETE     | All 4 presets implemented                    |
| FR-2.5 Lifecycle/Cleanup     | PARTIAL      | GSAP import error not handled                |
| FR-3.1 Reveal Config         | PARTIAL      | autoReveal default is wrong                  |
| FR-3.2 Animation Types       | COMPLETE     | All 3 types implemented                      |
| FR-3.3 Stagger Groups        | COMPLETE     | Works correctly                              |
| FR-3.4 External Trigger      | COMPLETE     | reveal()/hide() exposed                      |
| FR-3.5 Reveal Lifecycle      | PARTIAL      | transparent flag not restored                |
| FR-4.1 Preloader-Entrance    | COMPLETE     | Effect-based coordination works              |
| FR-4.2 Event Flow            | MISSING      | loadProgress/loadComplete not implemented    |
| FR-4.3 Error Handling        | PARTIAL      | Errors collected but entrance still triggers |
| FR-4.4 Manual Control        | COMPLETE     | start() method exposed                       |
| NFR-1.1 Bundle Size          | NOT VERIFIED | Need measurement                             |
| NFR-1.2 Animation FPS        | NOT VERIFIED | Need profiling                               |
| NFR-1.3 Memory Management    | PARTIAL      | Effects may leak                             |
| NFR-3.1 Reduced Motion       | COMPLETE     | prefersReducedMotion() implemented           |
| NFR-3.2 ARIA Accessibility   | MISSING      | No ARIA implementation                       |

### Implicit Requirements NOT Addressed:

1. **Entrance replay capability** - Users expect to be able to replay entrance
2. **Error recovery for GSAP import** - Should gracefully handle missing GSAP
3. **Logging/debugging support** - No debug mode or logging for troubleshooting
4. **Entrance cancellation** - No way to stop entrance mid-animation

---

## Edge Case Analysis

| Edge Case                            | Handled | How                             | Concern                      |
| ------------------------------------ | ------- | ------------------------------- | ---------------------------- |
| Empty asset array                    | YES     | Returns immediately ready state | None                         |
| Null camera                          | YES     | Guards in effect                | None                         |
| Null objectId                        | YES     | Returns null from computed      | Silent failure - no warning  |
| Zero weights                         | PARTIAL | Returns 100%                    | May not be intended behavior |
| Negative stagger index               | YES     | Sorts before positive           | Not documented               |
| Rapid reveal/hide                    | NO      | Promise hangs                   | Serious issue                |
| GSAP import failure                  | NO      | Unhandled rejection             | Critical issue               |
| Component destroyed during animation | YES     | isDestroyed checks              | Works correctly              |
| Network failure during load          | YES     | Errors captured                 | Entrance still triggers      |
| Material disposal during animation   | NO      | No check                        | Edge case - low impact       |
| Tab switch during animation          | YES     | GSAP handles                    | requestAnimationFrame pauses |
| Reduced motion preference            | YES     | Skips to end                    | Works correctly              |

---

## Integration Risk Assessment

| Integration                        | Failure Probability | Impact   | Mitigation                        |
| ---------------------------------- | ------------------- | -------- | --------------------------------- |
| AssetPreloader -> GltfLoader       | LOW                 | HIGH     | Effect sync pattern works         |
| AssetPreloader -> TextureLoader    | LOW                 | HIGH     | Effect sync pattern works         |
| CinematicEntrance -> OrbitControls | MEDIUM              | CRITICAL | Need error handling for GSAP      |
| CinematicEntrance -> SceneService  | MEDIUM              | MEDIUM   | Optional injection handled        |
| SceneReveal -> SceneGraphStore     | LOW                 | HIGH     | Computed pattern works            |
| SceneReveal -> StaggerGroupService | LOW                 | LOW      | Clean registration/unregistration |
| StaggerGroupService -> Directives  | MEDIUM              | MEDIUM   | Need destruction checks           |
| Hero Component Integration         | LOW                 | MEDIUM   | Works in demo                     |

---

## Verdict

**Recommendation**: NEEDS_REVISION

**Confidence**: HIGH

**Top Risk**: OrbitControls permanently disabled on GSAP import failure - users lose all scene interactivity with no way to recover.

---

## What Robust Implementation Would Include

A bulletproof implementation of this system would have:

1. **Error Boundaries for GSAP Import**:

   ```typescript
   try {
     const { gsap } = await import('gsap');
   } catch (error) {
     console.error('[CinematicEntrance] Failed to load GSAP:', error);
     this.skipToEnd(camera, endPos, endLookAt);
     return;
   }
   ```

2. **Promise Resolution on Animation Kill**:

   ```typescript
   private resolveCurrentReveal: (() => void) | null = null;

   public async hide(): Promise<void> {
     if (this.gsapTimeline) {
       this.gsapTimeline.kill();
       this.resolveCurrentReveal?.();  // Resolve hanging promise
     }
   }
   ```

3. **Complete State Restoration**:

   ```typescript
   interface OriginalState {
     position: Vector3;
     scale: Vector3;
     opacity: Map<Material, number>;
     transparent: Map<Material, boolean>; // ADD THIS
     visible: boolean;
   }
   ```

4. **Effect Cleanup Tracking**:

   ```typescript
   private readonly effectCleanups: (() => void)[] = [];

   const effectRef = effect(() => { ... });
   this.effectCleanups.push(() => effectRef.destroy());

   cancel(): void {
     this.effectCleanups.forEach(cleanup => cleanup());
   }
   ```

5. **Developer Warnings**:

   ```typescript
   if (!this.objectId) {
     console.warn('[SceneRevealDirective] No OBJECT_ID found. Ensure directive is applied to a component that provides OBJECT_ID token.');
   }
   ```

6. **Entrance Reset Capability**:

   ```typescript
   public reset(): void {
     this.animationStarted = false;
     if (this.originalCameraPosition) {
       this.sceneService?.camera()?.position.copy(this.originalCameraPosition);
     }
   }
   ```

7. **Loading Event Outputs** (per requirements):

   ```typescript
   public readonly loadProgress = output<number>();
   public readonly loadComplete = output<void>();

   effect(() => {
     this.loadProgress.emit(this.preloadState.progress());
     if (this.preloadState.isReady()) {
       this.loadComplete.emit();
     }
   });
   ```

8. **ARIA Accessibility**:
   ```html
   <div role="progressbar" aria-valuenow="{{progress}}" aria-valuemin="0" aria-valuemax="100" aria-label="Loading 3D scene"></div>
   ```

---

## Document Metadata

| Field          | Value                                  |
| -------------- | -------------------------------------- |
| Task ID        | TASK_2026_006                          |
| Review Date    | 2026-01-07                             |
| Reviewer       | Code Logic Reviewer Agent              |
| Files Reviewed | 5                                      |
| Lines Analyzed | ~1500                                  |
| Issues Found   | 13 (2 Critical, 5 Serious, 6 Moderate) |
| Recommendation | NEEDS_REVISION before production use   |
