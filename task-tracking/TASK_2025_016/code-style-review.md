# Code Style Review - TASK_2025_016: Viewport 3D Positioning Feature

## Review Summary

| Metric          | Value          |
| --------------- | -------------- |
| Overall Score   | 7.5/10         |
| Assessment      | NEEDS_REVISION |
| Blocking Issues | 2              |
| Serious Issues  | 4              |
| Minor Issues    | 3              |
| Files Reviewed  | 4              |

## The 5 Critical Questions

### 1. What could break in 6 months?

**ViewportPositioningService.setupResizeListener() - Memory Leak Risk**

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.service.ts:436-454`
- **Issue**: Resize listener added in constructor but service is `providedIn: 'root'` - this singleton lives forever
- **Consequence**: If service is instantiated early (e.g., in app bootstrap), the resize listener runs for entire app lifetime even if positioning is never used again
- **Impact**: Memory leak + unnecessary resize calculations when feature isn't active

**ViewportPositionDirective Nested Effect Anti-Pattern**

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-position.directive.ts:132-157`
- **Issue**: Effect creates another effect inside itself (lines 143-156 nested inside 132-157)
- **Consequence**: Each input change creates a NEW effect subscription that's never cleaned up until directive destroy
- **Impact**: With frequent input changes (e.g., animation loop updating viewportPosition), this creates hundreds of orphaned effects, causing memory leaks and performance degradation

### 2. What would confuse a new team member?

**Type Discrimination Logic in getPosition() is Fragile**

- **File**: `viewport-positioning.service.ts:308-330`
- **Issue**: Line 323 uses heuristic `position.x > 1` to distinguish pixels from percentages
- **Code**:
  ```typescript
  if (
    typeof position.x === 'number' &&
    typeof position.y === 'number' &&
    (options.unit === 'px' || (!options.unit && position.x > 1))
  ) {
  ```
- **Confusion**: What if user wants pixel position `{ x: 0.5, y: 0.5 }`? This would be interpreted as percentage (0.5, 0.5) instead
- **Why confusing**: No documentation explains this magic threshold, and it's not obvious from the types

**Inconsistent Reactive Pattern**

- **File**: `viewport-positioning.service.ts:260-284`
- **Issue**: `getPixelPosition()` returns a computed signal but immediately calls `percentageSignal()` on line 282
- **Code**:
  ```typescript
  public getPixelPosition(...): Signal<[number, number, number]> {
    return computed(() => {
      // ... setup code
      const percentageSignal = this.getPercentagePosition(...);
      return percentageSignal();  // Calling signal inside computed - why?
    });
  }
  ```
- **Confusion**: Why create a signal just to immediately call it? This breaks the reactive chain. Changes to camera won't propagate because `percentageSignal` is created fresh each time.

### 3. What's the hidden complexity cost?

**O(1) Viewport Calculations Become O(n) with Multiple Objects**

- **Issue**: Every directive instance calls `setViewportZ()` which mutates shared service state
- **File**: `viewport-position.directive.ts:140` + `viewport-positioning.service.ts:352-354`
- **Consequence**: If 10 objects use different viewport Z planes, the last one "wins" and all previous objects get positioned incorrectly
- **Example**:
  ```html
  <planet viewportPosition="center" [viewportZ]="-5" />
  <logo viewportPosition="center" [viewportZ]="-10" />
  <!-- Both use center position, but logo's setViewportZ(-10) affects planet too! -->
  ```
- **Hidden Cost**: This API looks independent but has global shared state mutation

**Signal Creation Explosion**

- **Issue**: `getNamedPosition()`, `getPercentagePosition()`, `getPixelPosition()` all return NEW computed signals on every call
- **File**: Lines 163-189, 214-239, 260-284
- **Consequence**: If directive inputs change frequently, each change creates new signal instances
- **Cost**: Memory allocation churn, no signal reuse, potential GC pressure

### 4. What pattern inconsistencies exist?

**Service Initialization Pattern Mismatch**

- **Pattern**: `TextSamplingService` has NO constructor, just pure methods
- **This Code**: `ViewportPositioningService` has constructor with side effects (resize listener setup)
- **File**: `viewport-positioning.service.ts:132-134` vs `text-sampling.service.ts:22-82`
- **Inconsistency**: Library services should be stateless utilities OR explicit lifecycle-managed stores, not hybrid

**Signal Readonly Exposure Inconsistency**

- **Pattern**: `SceneGraphStore` exposes readonly signals via `.asReadonly()` (line 70-72)
- **This Code**: `ViewportPositioningService` exposes computed signals directly (lines 97-126)
- **File**: `viewport-positioning.service.ts` vs `scene-graph.store.ts:70-72`
- **Why it matters**: Computed signals are already readonly, but `.asReadonly()` pattern is more explicit and self-documenting

**Directive Effect Pattern Deviation**

- **Pattern**: `Float3dDirective` uses single effect with computed signals for reactivity (line 131-139)
- **This Code**: `ViewportPositionDirective` uses nested effects (effect inside effect)
- **File**: `viewport-position.directive.ts:132-157` vs `float-3d.directive.ts:131-139`
- **Critical Difference**: Float3d creates animation timeline ONCE, this creates effects repeatedly

### 5. What would I do differently?

**Alternative 1: Stateless Service with Explicit Configuration**

```typescript
@Injectable({ providedIn: 'root' })
export class ViewportPositioningService {
  private readonly sceneStore = inject(SceneGraphStore);

  // NO constructor, NO resize listener, NO mutable state

  // Accept viewportZ as parameter, not global state
  public getNamedPosition(name: NamedPosition, viewportZ: number = 0, options: PositionOffset = {}): Signal<[number, number, number]> {
    return computed(() => {
      const camera = this.sceneStore.camera();
      const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;
      // Calculate dimensions and position here
    });
  }
}
```

**Benefits**: No shared mutable state, no memory leaks, multiple objects can have different viewportZ values safely

**Alternative 2: Directive Without Nested Effects**

```typescript
constructor() {
  // Single effect that reads all inputs and updates position
  effect(() => {
    if (!this.objectId) return;

    const position = this.viewportPosition();
    const offset = this.viewportOffset();
    const z = this.viewportZ();

    // Get position directly (computed signal handles reactivity)
    const pos = this.calculatePosition(position, offset, z);
    this.sceneStore.update(this.objectId, { position: pos });
  });
}

private calculatePosition(
  position: NamedPosition | PercentagePosition | PixelPosition,
  offset: PositionOffset,
  z: number
): [number, number, number] {
  // Inline calculation, no service.getPosition() call
}
```

**Benefits**: One effect, no nested subscriptions, clear reactivity model

---

## Blocking Issues

### Issue 1: Nested Effect Memory Leak in ViewportPositionDirective

- **File**: `viewport-position.directive.ts:132-157`
- **Problem**: Effect at line 132 creates nested effect at line 149 on EVERY outer effect execution
- **Code**:

  ```typescript
  constructor() {
    effect(() => {  // Outer effect
      if (!this.objectId) return;

      const position = this.viewportPosition();
      const offset = this.viewportOffset();
      const z = this.viewportZ();

      this.positioningService.setViewportZ(z);

      const positionSignal = this.positioningService.getPosition(position, offset);

      // BUG: Creating new effect on every outer effect execution!
      effect(() => {  // Inner effect - NEVER CLEANED UP
        const pos = positionSignal();
        this.sceneStore.update(this.objectId!, { position: pos });
      });
    });
  }
  ```

- **Impact**:
  - Input change → outer effect runs → creates NEW inner effect
  - Previous inner effect still exists, not cleaned up
  - 10 input changes = 10 orphaned inner effects running forever
  - Memory leak grows with every interaction
- **Fix**: Remove nested effect, read `positionSignal()` directly in outer effect

  ```typescript
  constructor() {
    effect(() => {
      if (!this.objectId) return;

      const position = this.viewportPosition();
      const offset = this.viewportOffset();
      const z = this.viewportZ();

      this.positioningService.setViewportZ(z);

      const positionSignal = this.positioningService.getPosition(position, offset);

      // FIX: Read signal directly, no nested effect
      const pos = positionSignal();
      this.sceneStore.update(this.objectId!, { position: pos });
    });
  }
  ```

### Issue 2: getPixelPosition() Breaks Reactive Chain

- **File**: `viewport-positioning.service.ts:260-284`
- **Problem**: Creates computed signal that immediately calls another signal, breaking reactivity
- **Code**:

  ```typescript
  public getPixelPosition(
    pos: PixelPosition,
    options: PixelPositionOptions = {}
  ): Signal<[number, number, number]> {
    return computed(() => {
      const viewportWidth = options.viewportWidth ??
        (typeof window !== 'undefined' ? window.innerWidth : 1920);
      const viewportHeight = options.viewportHeight ??
        (typeof window !== 'undefined' ? window.innerHeight : 1080);

      const xPercent = pos.x / viewportWidth;
      const yPercent = pos.y / viewportHeight;

      // BUG: Creating signal inside computed and immediately calling it
      const percentageSignal = this.getPercentagePosition(
        { x: xPercent, y: yPercent },
        options
      );

      return percentageSignal();  // This defeats the purpose of signals!
    });
  }
  ```

- **Impact**:
  - Window resize happens → `_aspect` signal updates
  - `getPercentagePosition()` creates new computed signal with updated dimensions
  - BUT the returned value is already evaluated (`percentageSignal()`), so changes don't propagate
  - Position doesn't update reactively as expected
- **Fix**: Don't create intermediate signal, calculate directly

  ```typescript
  public getPixelPosition(
    pos: PixelPosition,
    options: PixelPositionOptions = {}
  ): Signal<[number, number, number]> {
    return computed(() => {
      const viewportWidth = options.viewportWidth ??
        (typeof window !== 'undefined' ? window.innerWidth : 1920);
      const viewportHeight = options.viewportHeight ??
        (typeof window !== 'undefined' ? window.innerHeight : 1080);

      const xPercent = pos.x / viewportWidth;
      const yPercent = pos.y / viewportHeight;

      // FIX: Inline the calculation from getPercentagePosition
      const x = (xPercent - 0.5) * this.viewportWidth();
      const y = (0.5 - yPercent) * this.viewportHeight();

      return [
        x + (options.offsetX ?? 0),
        y + (options.offsetY ?? 0),
        this._viewportZ() + (options.offsetZ ?? 0),
      ];
    });
  }
  ```

---

## Serious Issues

### Issue 1: setViewportZ() Shared State Mutation

- **File**: `viewport-positioning.service.ts:352-354`
- **Problem**: Service method mutates shared singleton state, affecting all directive instances
- **Tradeoff**: Simple API but hidden coupling between unrelated objects
- **Code**:
  ```typescript
  public setViewportZ(z: number): void {
    this._viewportZ.set(z);  // Mutates shared state!
  }
  ```
- **Impact**:

  ```html
  <!-- Object 1 sets viewportZ to -5 -->
  <planet viewportPosition="center" [viewportZ]="-5" />

  <!-- Object 2 sets viewportZ to -10, OVERWRITING object 1's setting -->
  <logo viewportPosition="center" [viewportZ]="-10" />

  <!-- Now both objects use Z = -10, planet's -5 is lost -->
  ```

- **Recommendation**: Remove `setViewportZ()` and `_viewportZ` signal. Accept `viewportZ` as parameter to position methods.
  ```typescript
  // RECOMMENDED API
  public getNamedPosition(
    name: NamedPosition,
    viewportZ: number = 0,
    options: PositionOffset = {}
  ): Signal<[number, number, number]> {
    return computed(() => {
      // Use viewportZ parameter, not shared state
      const [x, y] = this.calculateNamedXY(name);
      return [
        x + (options.offsetX ?? 0),
        y + (options.offsetY ?? 0),
        viewportZ + (options.offsetZ ?? 0),
      ];
    });
  }
  ```

### Issue 2: Type Discrimination Heuristic is Fragile

- **File**: `viewport-positioning.service.ts:320-326`
- **Problem**: Uses `position.x > 1` to guess if input is pixels vs percentage
- **Tradeoff**: Convenient auto-detection but unpredictable edge cases
- **Code**:
  ```typescript
  if (typeof position.x === 'number' && typeof position.y === 'number' && (options.unit === 'px' || (!options.unit && position.x > 1))) {
    return this.getPixelPosition(position as PixelPosition, options);
  }
  ```
- **Edge Cases**:
  - `{ x: 0.5, y: 0.5 }` → Interpreted as percentage (50%, 50%) ✓
  - `{ x: 1, y: 1 }` → Interpreted as percentage (100%, 100%) ✓
  - `{ x: 1.1, y: 1.1 }` → Interpreted as **pixels** (wrong for 110% percentage!)
  - `{ x: 0.8, y: 400 }` → Interpreted as percentage (y > 1 check only checks x!)
- **Recommendation**: Require explicit `unit` parameter or use branded types

  ```typescript
  // Option 1: Explicit unit (recommended)
  service.getPosition({ x: 100, y: 50 }, { unit: 'px' }); // Clear intent

  // Option 2: Branded types (TypeScript only)
  type PixelCoord = number & { __brand: 'pixel' };
  type PercentCoord = number & { __brand: 'percent' };

  interface StrictPixelPosition {
    x: PixelCoord;
    y: PixelCoord;
  }
  ```

### Issue 3: Resize Listener Lifecycle Mismatch

- **File**: `viewport-positioning.service.ts:436-454`
- **Problem**: Root-scoped singleton service creates resize listener in constructor, runs forever
- **Tradeoff**: Auto-updates aspect ratio but wastes resources when positioning unused
- **Code**:

  ```typescript
  constructor() {
    this.setupResizeListener();  // Runs immediately on service creation
  }

  private setupResizeListener(): void {
    if (typeof window !== 'undefined') {
      const updateAspect = () => {
        this._aspect.set(window.innerWidth / window.innerHeight);
      };
      updateAspect();
      window.addEventListener('resize', updateAspect);

      // Cleanup on service destroy - BUT service never destroys (providedIn: 'root')!
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', updateAspect);
      });
    }
  }
  ```

- **Issue**: Service is singleton, constructor runs ONCE at app startup, listener lives forever
- **Scenario**: User visits page with 3D scene → service created, resize listener added → user navigates away → listener still running, updating unused `_aspect` signal forever
- **Recommendation**: Lazy initialization - add listener only when first position calculation requested

  ```typescript
  private resizeListenerActive = false;

  public getNamedPosition(...): Signal<[number, number, number]> {
    // Lazy-init resize listener
    if (!this.resizeListenerActive) {
      this.setupResizeListener();
      this.resizeListenerActive = true;
    }

    return computed(() => { /* ... */ });
  }
  ```

### Issue 4: Signal Creation on Every Method Call

- **File**: `viewport-positioning.service.ts:163-189, 214-239, 260-284`
- **Problem**: Every call to `getNamedPosition()`, `getPercentagePosition()`, `getPixelPosition()` creates NEW computed signal
- **Tradeoff**: Simple implementation but inefficient memory usage
- **Code**:
  ```typescript
  public getNamedPosition(
    name: NamedPosition,
    options: PositionOffset = {}
  ): Signal<[number, number, number]> {
    return computed(() => {  // NEW signal created EVERY call
      // ...
    });
  }
  ```
- **Impact**:
  ```typescript
  // Directive effect runs 10 times (input changes)
  effect(() => {
    const positionSignal = service.getNamedPosition('center'); // 10 different signals created
    const pos = positionSignal();
  });
  // Result: 10 computed signals in memory, all calculating same thing
  ```
- **Recommendation**: Memoize signals by cache key

  ```typescript
  private positionCache = new Map<string, Signal<[number, number, number]>>();

  public getNamedPosition(
    name: NamedPosition,
    options: PositionOffset = {}
  ): Signal<[number, number, number]> {
    const cacheKey = `named:${name}:${options.offsetX}:${options.offsetY}:${options.offsetZ}`;

    if (!this.positionCache.has(cacheKey)) {
      this.positionCache.set(cacheKey, computed(() => {
        // ... calculation
      }));
    }

    return this.positionCache.get(cacheKey)!;
  }
  ```

---

## Minor Issues

### Issue 1: JSDoc @example Blocks Missing Import Statements

- **File**: `viewport-positioning.service.ts:16-34, viewport-positioning.types.ts:16-48`
- **Problem**: Documentation examples show usage but don't show required imports
- **Impact**: New developers copy examples, get compilation errors, confusion about where types come from
- **Example**:
  ````typescript
  /**
   * @example
   * ```typescript
   * class MyComponent {
   *   private readonly positioning = inject(ViewportPositioningService);
   *   // ^^^^ Where does inject come from? Where does ViewportPositioningService come from?
   * }
   * ```
   */
  ````
- **Recommendation**: Add imports to examples
  ````typescript
  /**
   * @example
   * ```typescript
   * import { inject, effect } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * class MyComponent {
   *   private readonly positioning = inject(ViewportPositioningService);
   * }
   * ```
   */
  ````

### Issue 2: Magic Number 1920x1080 Default

- **File**: `viewport-positioning.service.ts:267-270, 380, 404`
- **Problem**: Hardcoded fallback `1920x1080` appears in multiple places, no explanation why
- **Impact**: Works but arbitrary choice, no documentation on when this is used
- **Code**:
  ```typescript
  const viewportWidth = options.viewportWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1920); // Why 1920?
  const viewportHeight = options.viewportHeight ?? (typeof window !== 'undefined' ? window.innerHeight : 1080); // Why 1080?
  ```
- **Recommendation**: Extract to named constants with documentation
  ```typescript
  /**
   * Default viewport dimensions for SSR environment (Full HD)
   * Used when window object is unavailable (server-side rendering)
   */
  private readonly DEFAULT_VIEWPORT_WIDTH = 1920;
  private readonly DEFAULT_VIEWPORT_HEIGHT = 1080;
  ```

### Issue 3: Inconsistent Comment Style

- **File**: `viewport-positioning.service.ts` (throughout)
- **Problem**: Mixes block separators (`// ========`) with JSDoc comments (`/** */`)
- **Comparison**:
  - `TextSamplingService`: Simple JSDoc only, no decorative separators
  - `Float3dDirective`: JSDoc only, no decorative separators
  - This code: Heavy use of `// ============` separators (lines 57, 64, 84, 128, 136, etc.)
- **Impact**: Visual clutter, inconsistent with library style
- **Recommendation**: Remove separator comments, use JSDoc only (match library pattern)

---

## File-by-File Analysis

### viewport-positioning.types.ts

**Score**: 9/10
**Issues Found**: 0 blocking, 0 serious, 1 minor

**Analysis**:
This file is excellent. Type definitions are clear, well-documented, and comprehensive. JSDoc examples are helpful. Pattern matches library conventions perfectly.

**Specific Concerns**:

1. JSDoc examples could include import statements (minor issue - see Minor Issue 1)

**Strengths**:

- All 9 named positions properly defined
- PercentagePosition supports both string and number correctly
- PositionOffset and PixelPositionOptions properly structured
- ViewportConfig provides advanced usage option
- JSDoc is thorough and includes examples
- No `any` types, full TypeScript strict compliance
- Follows library type export pattern exactly

---

### viewport-positioning.service.ts

**Score**: 6/10
**Issues Found**: 2 blocking, 4 serious, 2 minor

**Analysis**:
This file has significant architectural issues. While the core logic is sound, the reactive patterns are broken (getPixelPosition), shared state mutation (setViewportZ) creates coupling, and lifecycle management (resize listener) is mismatched with service scope.

**Specific Concerns**:

1. **getPixelPosition() reactive chain breakage** (line 260-284) - BLOCKING

   - Creates signal inside computed and immediately calls it
   - Window resize won't propagate to pixel position calculations
   - Defeats the purpose of reactive signals

2. **setViewportZ() shared state mutation** (line 352-354) - SERIOUS

   - Multiple directives with different viewportZ values will interfere
   - Last directive wins, previous values overwritten
   - Hidden coupling between unrelated objects

3. **Resize listener lifecycle** (line 436-454) - SERIOUS

   - Constructor adds listener immediately
   - Service is singleton, listener runs forever
   - Wastes resources when positioning not actively used

4. **Type discrimination heuristic** (line 320-326) - SERIOUS

   - `position.x > 1` fragile for edge cases
   - `{ x: 1.1, y: 0 }` would be pixels (unexpected)
   - No clear documentation on threshold

5. **Signal creation explosion** (lines 163-189, 214-239, 260-284) - SERIOUS

   - Every method call creates new computed signal
   - No memoization or caching
   - Memory allocation churn with frequent calls

6. **Comment style inconsistency** (throughout) - MINOR

   - Decorative `// ========` separators not used in other services
   - Visual clutter vs library pattern

7. **Magic numbers** (lines 267, 380, 404) - MINOR
   - Hardcoded 1920x1080 fallback
   - No named constants or explanation

**What Excellence Would Look Like**:

- Stateless service with no constructor side effects
- Accept viewportZ as parameter, not shared state
- Inline calculations instead of signal-creates-signal pattern
- Signal memoization for repeated calls with same params
- Lazy resize listener activation
- Named constants for SSR defaults

---

### viewport-position.directive.ts

**Score**: 5/10
**Issues Found**: 1 blocking, 0 serious, 0 minor

**Analysis**:
This directive has a critical nested effect anti-pattern that creates memory leaks. The effect-inside-effect structure (line 149 inside line 132) violates Angular's reactive programming model. Each outer effect execution creates a NEW inner effect that never gets cleaned up.

**Specific Concerns**:

1. **Nested effect memory leak** (line 132-157) - BLOCKING

   - Outer effect runs on input change
   - Inner effect created at line 149, INSIDE outer effect
   - Previous inner effects never cleaned up
   - 10 input changes = 10 orphaned effects = memory leak

2. **setViewportZ() mutation side effect** (line 140) - INHERITED SERIOUS ISSUE
   - Calls service.setViewportZ() which mutates shared state
   - Multiple directives interfere with each other
   - But this is service API design issue, not directive bug

**Pattern Deviation**:
Float3dDirective (reference pattern) uses single effect that creates timeline ONCE:

```typescript
// Float3d pattern (CORRECT)
effect(() => {
  const m = this.mesh();
  const config = this.floatConfig();
  if (m && config && !this.gsapTimeline) {
    this.createFloatingAnimation(m, config); // Creates timeline ONCE
  }
});
```

This directive uses nested effects (INCORRECT):

```typescript
// Viewport position pattern (WRONG)
effect(() => {
  // ... input reads

  effect(() => {
    // NEW effect created on EVERY outer effect run!
    const pos = positionSignal();
    this.sceneStore.update(this.objectId!, { position: pos });
  });
});
```

**What Excellence Would Look Like**:

```typescript
constructor() {
  // Single effect, no nesting
  effect(() => {
    if (!this.objectId) return;

    const position = this.viewportPosition();
    const offset = this.viewportOffset();
    const z = this.viewportZ();

    // Calculate position inline or use service WITHOUT creating intermediate signals
    const pos = this.calculatePosition(position, offset, z);
    this.sceneStore.update(this.objectId, { position: pos });
  });
}
```

---

### index.ts

**Score**: 10/10
**Issues Found**: 0 blocking, 0 serious, 0 minor

**Analysis**:
Perfect barrel export file. Follows library conventions exactly. Clean, simple, correct.

**Specific Concerns**:
None. This file is exemplary.

**Strengths**:

- Exports service, types, and directive
- Comment follows library pattern
- Clean and minimal
- Matches pattern from other modules exactly

---

## Pattern Compliance

| Pattern                 | Status | Concern                                                              |
| ----------------------- | ------ | -------------------------------------------------------------------- |
| Signal-based state      | FAIL   | getPixelPosition breaks reactive chain                               |
| Type safety             | PASS   | No `any` types, full strict compliance                               |
| DI patterns             | PASS   | inject() used correctly throughout                                   |
| Layer separation        | PASS   | Service/directive/types properly separated                           |
| Service pattern         | FAIL   | Constructor side effects (resize listener) vs TextSamplingService    |
| Directive effect        | FAIL   | Nested effects vs Float3dDirective single-effect pattern             |
| Cleanup pattern         | FAIL   | DestroyRef used but service is singleton (never destroyed)           |
| Readonly signal pattern | WARN   | Uses computed (correct) but not `.asReadonly()` like SceneGraphStore |

---

## Technical Debt Assessment

**Introduced**:

1. **Nested effect anti-pattern** - Future directives may copy this broken pattern
2. **Shared mutable state** (`setViewportZ`) - Coupling between directives, hard to debug
3. **Signal creation explosion** - Memory inefficiency if used frequently
4. **Lifecycle mismatch** - Singleton service with per-use semantics (resize listener)

**Mitigated**:

1. **Viewport positioning logic centralized** - No longer duplicated across components
2. **Type safety** - Strong types prevent runtime errors
3. **Reactive updates** - Positions auto-update on camera changes (when not broken)

**Net Impact**: **NEGATIVE** - The blocking issues (nested effects, broken reactive chain) create more problems than the feature solves. These issues will cause production bugs (memory leaks, incorrect positions) that are hard to diagnose.

---

## Verdict

**Recommendation**: **NEEDS REVISION**
**Confidence**: **HIGH**
**Key Concern**: Nested effect memory leak in directive (BLOCKING) and broken reactive chain in getPixelPosition (BLOCKING)

### Must Fix Before Merge

1. **Remove nested effect** in `ViewportPositionDirective.constructor()` (line 149)

   - Replace with single effect that reads positionSignal() directly
   - Verify with test: rapid input changes don't create effect leaks

2. **Fix getPixelPosition() reactive chain** (line 260-284)
   - Inline calculation from getPercentagePosition instead of calling it
   - Verify with test: window resize updates pixel positions correctly

### Should Fix (Blocking for Future Maintainability)

3. **Remove setViewportZ() shared state mutation** (line 352-354)

   - Accept viewportZ as parameter to getPosition() methods
   - Update directive to pass viewportZ to service methods, not call setViewportZ()
   - Verify with test: multiple directives with different viewportZ don't interfere

4. **Fix type discrimination heuristic** (line 320-326)
   - Require explicit `unit` parameter in options
   - Remove `position.x > 1` magic threshold
   - Update docs with migration guide

---

## What Excellence Would Look Like

A 10/10 implementation would:

1. **Stateless Service Pattern**

   - No constructor side effects (no resize listener in constructor)
   - All configuration passed as method parameters (viewportZ, aspect ratio)
   - Pure computed signals with proper reactive chains
   - Signal memoization for repeated calls with same parameters

2. **Clean Directive Pattern**

   - Single effect reading all inputs
   - No nested effects
   - Inline position calculation or memoized service call
   - Zero memory leaks on rapid input changes

3. **Explicit APIs**

   - No type discrimination heuristics (require explicit unit parameter)
   - No shared mutable state (no setViewportZ)
   - Clear documentation of all assumptions (why 1920x1080 fallback)

4. **Library Consistency**

   - Match TextSamplingService stateless pattern
   - Match Float3dDirective single-effect pattern
   - Match SceneGraphStore .asReadonly() pattern
   - No decorative comment separators (match library style)

5. **Comprehensive Edge Case Handling**
   - Lazy resize listener activation (only when needed)
   - Signal cache cleanup on app destroy
   - SSR-safe with documented fallbacks
   - Clear error messages when camera not initialized

**Example of Excellence**:

```typescript
@Injectable({ providedIn: 'root' })
export class ViewportPositioningService {
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly signalCache = new Map<string, Signal<[number, number, number]>>();

  // NO constructor, NO resize listener, NO mutable state

  public getNamedPosition(
    name: NamedPosition,
    viewportZ: number = 0, // Parameter, not shared state
    options: PositionOffset = {}
  ): Signal<[number, number, number]> {
    const cacheKey = this.getCacheKey('named', name, viewportZ, options);

    if (!this.signalCache.has(cacheKey)) {
      this.signalCache.set(
        cacheKey,
        computed(() => {
          const camera = this.sceneStore.camera();
          if (!camera) return [0, 0, viewportZ];

          // Get aspect ratio on-demand (reactive to window.innerWidth if used in effect)
          const aspect = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9;

          const height = this.calculateViewportHeight(camera.fov, camera.position.z, viewportZ);
          const width = height * aspect;

          const [x, y] = this.mapNamedPosition(name, width, height);
          return [x + (options.offsetX ?? 0), y + (options.offsetY ?? 0), viewportZ + (options.offsetZ ?? 0)];
        })
      );
    }

    return this.signalCache.get(cacheKey)!;
  }
}
```

This would:

- ✅ No shared mutable state
- ✅ No constructor side effects
- ✅ Memoized signals (cache key based on inputs)
- ✅ Reactive to window resize (if signal read in effect)
- ✅ Multiple objects can have different viewportZ safely
- ✅ Clean separation of concerns
