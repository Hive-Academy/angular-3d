# Future Enhancements - TASK_2026_006

## Scene Loading & Cinematic Entrance Animation System

---

## Executive Summary

This document consolidates all future work recommendations from the code reviews and identifies modernization opportunities for the Scene Loading & Cinematic Entrance Animation System implemented in TASK_2026_006.

**QA Review Summary**:
| Reviewer | Score | Assessment |
|----------|-------|------------|
| Code Style Reviewer | 6.5/10 | NEEDS_REVISION |
| Code Logic Reviewer | 6.5/10 | NEEDS_REVISION |

**Total Issues Identified**: 24 (4 Critical, 10 Serious, 10 Moderate)

---

## Priority 1: Critical Fixes (MUST Address Before Production)

### 1.1 OrbitControls Not Re-enabled on GSAP Import Failure

**Priority**: CRITICAL
**Effort**: 1-2 hours
**Business Value**: Prevents complete loss of scene interactivity

**Context**: If GSAP fails to load (missing package, CDN failure), the camera entrance animation disables OrbitControls but never re-enables them because the import throws before reaching re-enable code.

**Affected Files**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts:416-422`

**Current Pattern**:

```typescript
// Dynamic GSAP import for tree-shaking optimization
const { gsap } = await import('gsap'); // <-- No try/catch

// Safety check: directive may have been destroyed during async import
if (this.isDestroyed() || !this.entranceConfig()) {
  return;
}
```

**Recommended Pattern**:

```typescript
private async startEntrance(): Promise<void> {
  // ... existing code to disable OrbitControls at line 390 ...

  try {
    const { gsap } = await import('gsap');

    if (this.isDestroyed() || !this.entranceConfig()) {
      this.reEnableControls();
      return;
    }

    // ... animation code ...
  } catch (error) {
    console.error('[CinematicEntrance] Failed to load GSAP:', error);
    this.skipToEnd(camera, endPos, endLookAt);
    return;
  }
}

private reEnableControls(): void {
  if (this.orbitControls && !this.orbitControls.enabled) {
    this.orbitControls.enabled = true;
  }
}
```

**Impact**: Without this fix, users lose all scene interactivity permanently if GSAP fails to load.

**Source**: Code Logic Review - Critical Issue #1

---

### 1.2 Material Transparency State Not Restored

**Priority**: CRITICAL
**Effort**: 1-2 hours
**Business Value**: Prevents visual rendering artifacts in shared material scenarios

**Context**: When `setHiddenState()` enables `transparent: true` on materials for fade-in animation, the `restoreOriginalState()` method only restores opacity but NOT the transparent flag. If materials were originally opaque, they remain transparent after cleanup.

**Affected Files**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts:484-488, 611-627`

**Current Pattern**:

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

**Recommended Pattern**:

```typescript
// Updated OriginalState interface
interface OriginalState {
  position: Vector3;
  scale: Vector3;
  opacity: Map<Material, number>;
  transparent: Map<Material, boolean>; // ADD THIS
  visible: boolean;
}

// In captureOriginalState:
materials.forEach((mat: Material) => {
  opacityMap.set(mat, mat.opacity);
  transparentMap.set(mat, mat.transparent); // ADD THIS
});

// In restoreOriginalState:
this.originalState.opacity.forEach((opacity, mat) => {
  mat.opacity = opacity;
  mat.transparent = this.originalState.transparent.get(mat) ?? false; // ADD THIS
  mat.needsUpdate = true;
});
```

**Impact**: Materials that should be opaque remain transparent, causing Z-fighting and incorrect rendering order.

**Source**: Code Logic Review - Critical Issue #2, Code Style Review - Minor Issue #4

---

### 1.3 Effect Cleanup Not Handled in AssetPreloaderService

**Priority**: CRITICAL
**Effort**: 2-3 hours
**Business Value**: Prevents memory leaks in long-running applications

**Context**: The `startAssetLoad()` method creates `effect()` instances to sync progress from loader services, but these effects are never explicitly cleaned up. The service is `providedIn: 'root'`, meaning effects persist for the application lifetime.

**Affected Files**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts:256-271`

**Current Pattern**:

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
); // No cleanup reference stored
```

**Recommended Pattern**:

```typescript
// Track effect references for cleanup
interface AssetLoadOperation {
  url: string;
  type: AssetType;
  weight: number;
  progress: Signal<number>;
  error: Signal<Error | null>;
  loaded: Signal<boolean>;
  effectRef: EffectRef; // ADD THIS
}

// In startAssetLoad:
const effectRef = effect(
  () => {
    /* sync signals */
  },
  { allowSignalWrites: true }
);

// In cancel():
const cancel = (): void => {
  _cancelled.set(true);
  operations.forEach((op) => op.effectRef.destroy()); // ADD THIS
  this.activeOperations.delete(operationId);
};
```

**Impact**: Memory will accumulate over time in SPAs with dynamic asset loading.

**Source**: Code Style Review - Blocking Issue #1, Code Logic Review - Failure Mode #1

---

### 1.4 Promise Hangs When hide() Interrupts reveal()

**Priority**: CRITICAL
**Effort**: 1-2 hours
**Business Value**: Prevents application logic deadlocks

**Context**: If user calls `reveal()` then immediately calls `hide()` while animation is in progress, the Promise from `reveal()` never resolves because `onComplete` callback never fires after timeline.kill().

**Affected Files**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts:348-356, 401-405`

**Current Pattern**:

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

**Recommended Pattern**:

```typescript
private revealResolve: (() => void) | null = null;

public async reveal(): Promise<void> {
  // ... guards ...

  return new Promise<void>((resolve) => {
    this.revealResolve = resolve;

    this.gsapTimeline = gsap.timeline({
      onComplete: () => {
        this.revealResolve = null;
        this.isHidden = false;
        this.revealComplete.emit();
        resolve();
      },
    });
    // ... animation setup ...
  });
}

public async hide(): Promise<void> {
  // Kill any running animation
  if (this.gsapTimeline) {
    this.gsapTimeline.kill();
    this.gsapTimeline = null;
  }

  // Resolve pending reveal promise
  if (this.revealResolve) {
    this.revealResolve();
    this.revealResolve = null;
  }

  this.setHiddenState(obj, config);
}
```

**Impact**: Code like `await reveal(); doSomething()` will never execute `doSomething()`.

**Source**: Code Logic Review - Serious Issue #1, Failure Mode #3

---

## Priority 2: High Priority (Should Address Soon)

### 2.1 Missing Required Event Outputs (FR-4.2)

**Priority**: HIGH
**Effort**: 2-3 hours
**Business Value**: Fulfills requirements specification

**Context**: Requirements FR-4.2 specify `loadProgress` and `loadComplete` outputs that were not implemented.

**Requirements**:

- "WHEN loading progress changes THEN the `loadProgress` output SHALL emit the current percentage (0-100)"
- "WHEN loading completes THEN the `loadComplete` output SHALL emit"

**Implementation Options**:

**Option A: Add outputs to CinematicEntranceDirective**

```typescript
@Directive({...})
export class CinematicEntranceDirective {
  public readonly loadProgress = output<number>();
  public readonly loadComplete = output<void>();

  constructor() {
    effect(() => {
      const config = this.entranceConfig();
      if (config?.preloadState) {
        this.loadProgress.emit(config.preloadState.progress());
        if (config.preloadState.isReady()) {
          this.loadComplete.emit();
        }
      }
    });
  }
}
```

**Option B: Create LoadingStateDirective wrapper**

```typescript
@Directive({
  selector: '[a3dLoadingState]',
  standalone: true,
})
export class LoadingStateDirective {
  public readonly preloadState = input.required<PreloadState>();
  public readonly loadProgress = output<number>();
  public readonly loadComplete = output<void>();

  constructor() {
    effect(() => {
      const state = this.preloadState();
      this.loadProgress.emit(state.progress());
      if (state.isReady()) {
        this.loadComplete.emit();
      }
    });
  }
}
```

**Source**: Code Logic Review - Requirements Analysis FR-4.2

---

### 2.2 No Entrance Replay Capability

**Priority**: HIGH
**Effort**: 1-2 hours
**Business Value**: Improves API flexibility for demo/replay scenarios

**Context**: The `start()` method checks `!this.animationStarted` but there's no way to reset this flag. Once the entrance has played, calling `start()` again does nothing.

**Affected Files**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts:316-320`

**Current Pattern**:

```typescript
private animationStarted = false;

public start(): void {
  if (!this.animationStarted) {  // Once true, blocks forever
    this.startEntrance();
  }
}
```

**Recommended Pattern**:

```typescript
/**
 * Reset the entrance animation for replay.
 *
 * Restores camera to original position and allows start() to be called again.
 */
public reset(): void {
  // Kill any running animation
  if (this.gsapTimeline) {
    this.gsapTimeline.kill();
    this.gsapTimeline = null;
  }

  // Restore camera to original position
  const camera = this.sceneService?.camera();
  if (camera && this.originalCameraPosition) {
    camera.position.copy(this.originalCameraPosition);
    this.sceneService?.invalidate();
  }

  // Reset flag to allow restart
  this.animationStarted = false;
}
```

**Source**: Code Logic Review - Serious Issue #3, Failure Mode #4

---

### 2.3 Missing ARIA Accessibility (NFR-3.2)

**Priority**: HIGH
**Effort**: 3-4 hours
**Business Value**: Meets accessibility requirements, improves UX for assistive technology users

**Requirements**:

- "Loading progress SHALL be exposed via ARIA attributes for screen readers"
- "Loading completion SHALL be announced to assistive technologies"

**Recommended Implementation**:
Create a companion component for accessibility:

```typescript
@Component({
  selector: 'a3d-loading-progress',
  standalone: true,
  template: `
    <div role="progressbar" [attr.aria-valuenow]="progress()" aria-valuemin="0" aria-valuemax="100" [attr.aria-label]="ariaLabel()" [attr.aria-busy]="!isReady()">
      <ng-content />
    </div>

    <div aria-live="polite" aria-atomic="true" class="sr-only">@if (isReady()) { Loading complete. Scene ready. }</div>
  `,
  styles: [
    `
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
    `,
  ],
})
export class LoadingProgressComponent {
  public readonly preloadState = input.required<PreloadState>();
  public readonly ariaLabel = input('Loading 3D scene');

  protected readonly progress = computed(() => this.preloadState().progress());
  protected readonly isReady = computed(() => this.preloadState().isReady());
}
```

**Source**: Code Logic Review - Requirements Analysis NFR-3.2

---

### 2.4 autoReveal Default Value Mismatch

**Priority**: HIGH
**Effort**: 30 minutes
**Business Value**: Aligns implementation with documented requirements

**Context**: Requirements FR-3.1 states `autoReveal` should default to `true`, but implementation defaults to `false`.

**Affected Files**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts:141-142`

**Current**:

```typescript
/**
 * @default false  // Should be true per FR-3.1
 */
autoReveal?: boolean;
```

**Action Required**: Either:

1. Change default to `true` and update documentation
2. Update requirements to reflect intentional design decision with rationale

**Source**: Code Logic Review - Serious Issue #5

---

## Priority 3: Medium Priority (Technical Debt)

### 3.1 Extract GSAP Import Pattern to Shared Utility

**Priority**: MEDIUM
**Effort**: 2-3 hours
**Business Value**: Reduces code duplication, ensures consistent error handling

**Context**: The dynamic GSAP import pattern with destroyed checks appears in multiple files.

**Affected Files**:

- `cinematic-entrance.directive.ts:417-422`
- `scene-reveal.directive.ts:340-345`
- `float-3d.directive.ts:158`

**Recommended Pattern**:

```typescript
// libs/angular-3d/src/lib/utils/gsap-loader.ts

import type { gsap as GsapType } from 'gsap';

export interface GsapLoadResult {
  gsap: typeof GsapType;
}

/**
 * Safely load GSAP with error handling.
 *
 * @param isDestroyed - Function to check if caller is destroyed
 * @returns GSAP instance or null if loading failed or caller destroyed
 */
export async function loadGsap(isDestroyed: () => boolean): Promise<GsapLoadResult | null> {
  try {
    const { gsap } = await import('gsap');

    // Check if caller was destroyed during async import
    if (isDestroyed()) {
      return null;
    }

    return { gsap };
  } catch (error) {
    console.error('[GSAP] Failed to load:', error);
    return null;
  }
}

// Usage in directives:
const result = await loadGsap(() => this.isDestroyed());
if (!result) {
  this.handleGsapLoadFailure();
  return;
}
const { gsap } = result;
```

**Source**: Code Style Review - Question 5 ("What would I do differently?")

---

### 3.2 Magic Numbers Should Be Constants

**Priority**: MEDIUM
**Effort**: 1 hour
**Business Value**: Improves code readability and maintainability

**Affected Files**:

- `scene-reveal.directive.ts:495` - `obj.scale.setScalar(0.01)`
- `scene-reveal.directive.ts:500` - `obj.position.y -= 2`
- `stagger-group.service.ts:75` - `150` (default stagger delay)

**Recommended Pattern**:

```typescript
// libs/angular-3d/src/lib/directives/animation/animation-constants.ts

export const REVEAL_ANIMATION_DEFAULTS = {
  /** Scale used for hidden state in scale-pop animation */
  HIDDEN_SCALE: 0.01,

  /** Y offset in world units for rise-up animation */
  RISE_UP_OFFSET: 2,

  /** Default duration for reveal animations in seconds */
  FADE_DURATION: 0.8,

  /** Default delay between staggered items in milliseconds */
  STAGGER_DELAY_MS: 150,

  /** Back easing overshoot amount for scale-pop */
  SCALE_POP_OVERSHOOT: 1.4,
} as const;
```

**Source**: Code Style Review - Serious Issue #3, Minor Issue #2

---

### 3.3 Add Developer Warnings for Misconfiguration

**Priority**: MEDIUM
**Effort**: 2 hours
**Business Value**: Improves developer experience with actionable error messages

**Issues to Address**:

1. SceneService missing causes frozen render (no warning)
2. OBJECT_ID missing causes silent no-op (no warning)

**Recommended Pattern**:

```typescript
// In SceneRevealDirective constructor effect:
effect(() => {
  const obj = this.object3D();
  const config = this.revealConfig();

  if (config && !obj) {
    if (!this.objectId) {
      console.warn('[SceneRevealDirective] No OBJECT_ID found. ' + 'Ensure directive is applied to a component that provides OBJECT_ID token ' + '(e.g., a3d-box, a3d-sphere, a3d-gltf-model).');
    }
  }

  if (config && !this.sceneService) {
    console.warn('[SceneRevealDirective] SceneService not found. ' + 'Directive should be used within a Scene3dComponent context. ' + 'Animations will run but scene may not re-render.');
  }
});
```

**Source**: Code Logic Review - Failure Mode #6, #7, Moderate Issue #1, #2

---

### 3.4 Type Safety - Remove Non-Null Assertions

**Priority**: MEDIUM
**Effort**: 2 hours
**Business Value**: Prevents potential runtime errors from race conditions

**Affected Files**:

- `scene-reveal.directive.ts:548, 570-576, 590`

**Current Pattern**:

```typescript
this.gsapTimeline!.to(mat, {...}, 0);
const targetScale = this.originalState!.scale;
```

**Recommended Pattern**:

```typescript
private animateFadeIn(obj: Object3D, duration: number, easing: string): void {
  if (!this.gsapTimeline || !this.originalState) return;

  // Now TypeScript knows these are non-null
  const timeline = this.gsapTimeline;
  const originalState = this.originalState;

  materials.forEach((mat) => {
    const originalOpacity = originalState.opacity.get(mat) ?? 1;
    timeline.to(mat, {...}, 0);
  });
}
```

**Source**: Code Style Review - Blocking Issue #2

---

### 3.5 Computed Signal for Static Value

**Priority**: MEDIUM
**Effort**: 30 minutes
**Business Value**: Reduces unnecessary signal overhead

**Affected Files**:

- `asset-preloader.service.ts:195`

**Current Pattern**:

```typescript
const totalCount = computed(() => assets.length);
```

**Issue**: Creates reactive signal for a value that never changes.

**Recommended Pattern**:

```typescript
// Option A: Direct property
const totalCount = signal(assets.length).asReadonly();

// Option B: Closure (non-reactive but consistent API)
const totalCount = (): number => assets.length;
```

**Source**: Code Style Review - Serious Issue #1

---

## Priority 4: Low Priority (Nice-to-Have Enhancements)

### 4.1 SSR-Safe Initialization

**Priority**: LOW
**Effort**: 2-3 hours
**Business Value**: Enables Angular Universal SSR compatibility

**Context**: Directives check `typeof window === 'undefined'` for reduced motion but don't use `afterNextRender()` pattern from library conventions.

**Recommended Enhancement**:

```typescript
constructor() {
  afterNextRender(() => {
    // All browser-only initialization here
    this.initializeAnimation();
  });
}
```

**Source**: Code Style Review - Serious Issue #6

---

### 4.2 Preset Values Should Consider Scene Scale

**Priority**: LOW
**Effort**: 3-4 hours
**Business Value**: Better out-of-box experience for varied scene sizes

**Context**: Preset camera offsets (e.g., `endPos[2] + 10` for dolly-in) are fixed world units. Scenes with very large or very small scale may have too subtle or too dramatic animations.

**Recommended Enhancement**:

```typescript
private getPresetValues(
  preset: EntrancePreset | undefined,
  camera: PerspectiveCamera | null,
  sceneBounds?: Box3  // Optional scene bounding box
): PresetValues {
  const sceneSize = sceneBounds
    ? sceneBounds.getSize(new Vector3()).length()
    : 10; // Default scene size

  const scaleFactor = Math.max(sceneSize / 10, 0.5);

  switch (preset) {
    case 'dolly-in':
      return {
        startPosition: [endPos[0], endPos[1], endPos[2] + 10 * scaleFactor],
        // ...
      };
  }
}
```

**Source**: Code Style Review - Moderate Issue #6

---

### 4.3 Make rise-up Offset Configurable

**Priority**: LOW
**Effort**: 1 hour
**Business Value**: More flexible API for varied scene scales

**Context**: The rise-up animation uses hardcoded `y -= 2` which may not suit all scenes.

**Recommended Enhancement**:

```typescript
interface SceneRevealConfig {
  // ... existing properties ...

  /**
   * Y offset for rise-up animation in world units.
   * Negative values make object start below final position.
   * @default -2
   */
  riseUpOffset?: number;
}

// Usage:
case 'rise-up':
  const offset = config.riseUpOffset ?? -2;
  obj.position.y += offset;
  break;
```

**Source**: Code Style Review - Serious Issue #3

---

### 4.4 Add Debug Mode for Troubleshooting

**Priority**: LOW
**Effort**: 2-3 hours
**Business Value**: Improves developer experience during integration

**Recommended Enhancement**:

```typescript
interface CinematicEntranceConfig {
  // ... existing properties ...

  /**
   * Enable debug logging for troubleshooting.
   * Logs animation state changes and timing.
   * @default false
   */
  debug?: boolean;
}

// In directive:
private log(message: string, data?: unknown): void {
  if (this.entranceConfig()?.debug) {
    console.log(`[CinematicEntrance] ${message}`, data ?? '');
  }
}

// Usage:
this.log('Starting entrance animation', { preset, duration, startPos, endPos });
this.log('Animation complete');
```

**Source**: Code Logic Review - Implicit Requirements Analysis

---

### 4.5 HDRI Loader Implementation

**Priority**: LOW
**Effort**: 4-6 hours
**Business Value**: Complete asset preloading capabilities

**Context**: HDRI asset type logs warning and returns 100% immediately without actual loading.

**Recommended Enhancement**:

```typescript
// libs/angular-3d/src/lib/loaders/hdri-loader.service.ts

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

@Injectable({ providedIn: 'root' })
export class HdriLoaderService {
  private readonly rgbeLoader = new RGBELoader();
  private readonly cache = new Map<string, DataTexture>();

  public load(url: string): HdriLoadResult {
    // Similar pattern to GltfLoaderService
    // Returns progress, data, error, loading signals
  }
}
```

**Source**: Requirements FR-1.3, Implementation Plan Section 3.1 "HDRI placeholder"

---

## Modernization Opportunities

### M1: Adopt Angular Resource API (When Stable)

**Priority**: FUTURE
**Effort**: 4-6 hours
**Dependencies**: Angular Resource API stable release

**Context**: Angular is developing a Resource API for async data loading that could replace the current signal-based preloader pattern.

**Current Pattern**:

```typescript
const preloadState = this.preloader.preload([...]);
// Manual signal composition
```

**Future Pattern**:

```typescript
const assets = resource({
  request: () => this.assetUrls,
  loader: (urls) => this.loadAssets(urls),
});
// Built-in isLoading, value, error signals
```

---

### M2: Consider RxJS Interop for Complex Async Flows

**Priority**: FUTURE
**Effort**: 2-3 hours

**Context**: Complex async coordination (stagger timing, cancellation) could benefit from RxJS operators while maintaining signal-based API surface.

**Example**:

```typescript
import { toSignal, toObservable } from '@angular/core/rxjs-interop';

// Internal implementation with RxJS
const staggeredReveals$ = from(sortedDirectives).pipe(
  concatMap((directive, i) =>
    timer(i * staggerDelay).pipe(
      switchMap(() => from(directive.reveal()))
    )
  ),
  takeUntil(this.cancel$)
);

// Public API remains signal-based
public readonly isRevealing = toSignal(this.revealing$);
```

---

### M3: WebGPU Compute Shaders for Particle Reveals

**Priority**: FUTURE
**Effort**: 8-12 hours
**Dependencies**: Stable WebGPU compute shader support

**Context**: Particle-based reveal effects (dissolve, assemble) could leverage WebGPU compute shaders for massive parallelism.

**Potential Feature**:

```typescript
interface SceneRevealConfig {
  animation?: RevealAnimation | 'particle-dissolve' | 'particle-assemble';
  particleCount?: number; // For particle animations
}
```

---

## Implementation Priority Matrix

| Priority | Items    | Total Effort | Timeline                      |
| -------- | -------- | ------------ | ----------------------------- |
| Critical | 4 issues | 6-9 hours    | Immediate (before production) |
| High     | 4 issues | 8-11 hours   | Next sprint                   |
| Medium   | 5 issues | 8-11 hours   | Within 2 sprints              |
| Low      | 5 issues | 12-17 hours  | Backlog                       |
| Future   | 3 items  | 14-21 hours  | Research/planning             |

**Recommended Immediate Actions**:

1. Fix GSAP import error handling (1.1)
2. Fix material transparency restoration (1.2)
3. Fix effect cleanup in preloader (1.3)
4. Fix promise resolution on hide() (1.4)

---

## Document Metadata

| Field              | Value                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------- |
| Task ID            | TASK_2026_006                                                                           |
| Created            | 2026-01-07                                                                              |
| Author             | Modernization Detector Agent                                                            |
| Source Documents   | code-style-review.md, code-logic-review.md, implementation-plan.md, task-description.md |
| Total Issues       | 24 (4 Critical, 10 Serious, 10 Moderate)                                                |
| Recommended Status | NEEDS_REVISION                                                                          |
