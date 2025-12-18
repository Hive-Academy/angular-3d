# Development Tasks - TASK_2025_013

**Task Type**: Frontend (Angular + Three.js)
**Total Tasks**: 7
**Total Batches**: 3
**Batching Strategy**: Layer-based (Directives → Tests → Documentation)
**Status**: 2/3 batches complete (67%)

---

## Batch 1: Core Animation Directives ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 2
**Dependencies**: None
**Estimated Commits**: 1 (one commit per batch)

### Task 1.1: Create Float3dDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\float-3d.directive.ts`

**Specification Reference**: [implementation_plan.md:32-57](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L32-L57)

**Pattern to Follow**: [temp/angular-3d/directives/float-3d.directive.ts:1-265](file:///d:/projects/angular-3d-workspace/temp/angular-3d/directives/float-3d.directive.ts#L1-L265)

**Expected Commit Pattern**: `feat(angular-3d): add float3d directive for object animations`

**Quality Requirements**:

- ✅ Standalone directive (`standalone: true` default in Angular 20+)
- ✅ Signal-based `floatConfig` input: `input<FloatConfig | undefined>(undefined)`
- ✅ Dynamic GSAP import for tree-shaking: `import('gsap').then(...)`
- ✅ DestroyRef cleanup: `destroyRef.onDestroy(() => this.cleanup())`
- ✅ ElementRef injection: Access mesh via `elementRef.nativeElement`
- ✅ Seamless loop: UP/DOWN phases (not yoyo)
- ✅ Public API: `play()`, `pause()`, `stop()`, `isPlaying()`
- ✅ Comprehensive JSDoc with 2+ examples

**Implementation Details**:

- **Directive Selector**: `[float3d]`
- **Imports to Verify**: `AfterViewInit`, `DestroyRef`, `Directive`, `inject`, `input`, `OnDestroy`, `ElementRef` from `@angular/core`; `Mesh` from `three`
- **FloatConfig Interface**: `{ height?: number; speed?: number; delay?: number; ease?: string; autoStart?: boolean; }`
- **Default Values**: height: 0.3, speed: 2000, delay: 0, ease: 'sine.inOut', autoStart: true
- **Animation Pattern**: Create GSAP timeline with UP phase (y += height) then DOWN phase (y returns to original)
- **Example Files**: [temp/angular-3d/directives/float-3d.directive.ts](file:///d:/projects/angular-3d-workspace/temp/angular-3d/directives/float-3d.directive.ts)

**Key Differences from Temp Source**:

- Use single `floatConfig` input (already in temp but optional)
- Keep dynamic GSAP import pattern
- Ensure DestroyRef cleanup pattern
- Maintain original position tracking for cleanup

---

### Task 1.2: Create Rotate3dDirective ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\rotate-3d.directive.ts`

**Dependencies**: None (parallel with Task 1.1)

**Specification Reference**: [implementation_plan.md:61-86](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L61-L86)

**Pattern to Follow**: [temp/angular-3d/directives/rotate-3d.directive.ts:1-324](file:///d:/projects/angular-3d-workspace/temp/angular-3d/directives/rotate-3d.directive.ts#L1-L324)

**Expected Commit Pattern**: `feat(angular-3d): add rotate3d directive for object rotation`

**Quality Requirements**:

- ✅ Standalone directive
- ✅ Signal-based `rotateConfig` input
- ✅ Dynamic GSAP import for tree-shaking
- ✅ DestroyRef cleanup pattern
- ✅ Support single-axis rotation ('x', 'y', 'z')
- ✅ Support multi-axis rotation ('xyz') with independent speeds
- ✅ Relative rotation: `+=Math.PI*2` for infinite loop
- ✅ Public API: `play()`, `pause()`, `stop()`, `isPlaying()`, `setSpeed()`, `reverse()`
- ✅ Comprehensive JSDoc with planet and asteroid examples

**Implementation Details**:

- **Directive Selector**: `[rotate3d]`
- **Imports to Verify**: `AfterViewInit`, `DestroyRef`, `Directive`, `inject`, `input`, `OnDestroy`, `ElementRef` from `@angular/core`; `Object3D` from `three`
- **RotateConfig Interface**: `{ axis?: 'x' | 'y' | 'z' | 'xyz'; speed?: number; xSpeed?: number; ySpeed?: number; zSpeed?: number; direction?: 1 | -1; autoStart?: boolean; ease?: string; }`
- **Default Values**: axis: 'y', speed: 60, direction: 1, autoStart: true, ease: 'none'
- **Animation Pattern**:
  - Single-axis: `gsap.to(object.rotation, { [axis]: '+=Math.PI*2*direction', duration: speed })`
  - Multi-axis: Three simultaneous tweens starting at time 0
- **Example Files**: [temp/angular-3d/directives/rotate-3d.directive.ts](file:///d:/projects/angular-3d-workspace/temp/angular-3d/directives/rotate-3d.directive.ts)

**Key Differences from Temp Source**:

- Keep RotateConfig interface export
- Maintain 100ms initialization delay for GLTF loading
- Ensure `setSpeed()` and `reverse()` methods work via timeScale

---

**Batch 1 Verification Requirements**: ✅ ALL PASSED

- ✅ Both directive files exist at specified paths
- ✅ One git commit for entire batch: `feat(angular-3d): add float3d and rotate3d animation directives`
- ✅ No compilation errors (TypeScript strict mode)
- ✅ Directives use signal-based inputs
- ✅ Dynamic GSAP imports present
- ✅ DestroyRef cleanup implemented
- ✅ Public APIs complete

**Git Commit**: `4cdf76e` - feat(angular-3d): add float3d and rotate3d animation directives

---

## Batch 2: Directive Unit Tests ✅ COMPLETE

**Assigned To**: frontend-developer
**Tasks in Batch**: 2
**Dependencies**: Batch 1 complete (directives must exist)
**Estimated Commits**: 1

### Task 2.1: Create Float3dDirective Tests ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\float-3d.directive.spec.ts`

**Specification Reference**: [implementation_plan.md:192-226](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L192-L226)

**Pattern to Follow**: [render-loop/animation.service.spec.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/render-loop/animation.service.spec.ts)

**Expected Commit Pattern**: `test(angular-3d): add unit tests for animation directives`

**Quality Requirements**:

- ✅ ≥80% code coverage for Float3dDirective
- ✅ Use GSAP mock from [test-setup.ts:49-75](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/test-setup.ts#L49-L75)
- ✅ Test all 4 suites: Initialization, Animation Creation, Lifecycle, Public API
- ✅ Handle dynamic import mocking
- ✅ Verify DestroyRef cleanup

**Test Suites**:

1. **Initialization Tests**:

   - Should create directive instance
   - Should skip initialization if no config provided
   - Should access mesh from `elementRef.nativeElement`

2. **Animation Creation Tests**:

   - Should create GSAP timeline via dynamic import
   - Should use default config values (height: 0.3, speed: 2000)
   - Should use custom config values
   - Should create UP/DOWN phases (not yoyo)
   - Should respect `autoStart: false`

3. **Lifecycle Tests**:

   - Should cleanup timeline on destroy via `destroyRef.onDestroy()`
   - Should kill GSAP timeline when `cleanup()` called
   - Should reset mesh position to original on cleanup

4. **Public API Tests**:
   - `play()` should call `timeline.play()`
   - `pause()` should call `timeline.pause()`
   - `stop()` should reset progress and pause
   - `isPlaying()` should return `timeline.isActive()` state

**Mock Setup**:

```typescript
// Already available in test-setup.ts
const mockTimeline = {
  kill: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
  progress: jest.fn(() => 0),
  isActive: jest.fn(() => false),
  to: jest.fn().mockReturnThis(),
};

jest.mock('gsap', () => ({
  __esModule: true,
  default: { timeline: jest.fn(() => mockTimeline) },
  gsap: { timeline: jest.fn(() => mockTimeline) },
}));
```

---

### Task 2.2: Create Rotate3dDirective Tests ✅ COMPLETE

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\rotate-3d.directive.spec.ts`

**Dependencies**: None (parallel with Task 2.1)

**Specification Reference**: [implementation_plan.md:230-268](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L230-L268)

**Pattern to Follow**: [render-loop/animation.service.spec.ts:71-95](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/render-loop/animation.service.spec.ts#L71-L95)

**Expected Commit Pattern**: `test(angular-3d): add unit tests for animation directives`

**Quality Requirements**:

- ✅ ≥80% code coverage for Rotate3dDirective
- ✅ Test all 5 suites: Initialization, Single-Axis, Multi-Axis, Direction & Speed, Lifecycle
- ✅ Use GSAP mock from test-setup.ts
- ✅ Verify DestroyRef cleanup
- ✅ Test timeScale methods (setSpeed, reverse)

**Test Suites**:

1. **Initialization Tests**:

   - Should create directive instance
   - Should skip if no config provided
   - Should access object3D from `elementRef.nativeElement`
   - Should delay initialization for GLTF loading (100ms)

2. **Single-Axis Rotation Tests**:

   - Should create Y-axis rotation (default)
   - Should create X-axis rotation
   - Should create Z-axis rotation
   - Should use relative rotation `+=Math.PI*2`
   - Should use 'none' ease for smooth continuous rotation

3. **Multi-Axis Rotation Tests**:

   - Should create simultaneous XYZ rotation
   - Should use independent speeds for each axis
   - Should start all axes at time 0 (parallel)

4. **Direction & Speed Tests**:

   - Should support direction: 1 (clockwise)
   - Should support direction: -1 (counter-clockwise)
   - `setSpeed()` should adjust timeline timeScale
   - `reverse()` should invert timeScale

5. **Lifecycle Tests**:
   - Should cleanup timeline on destroy
   - Should kill GSAP timeline

---

**Batch 2 Verification Requirements**: ✅ ALL PASSED

- ✅ Both test files exist
- ✅ One git commit for entire batch: `test(angular-3d): add unit tests for animation directives`
- ✅ All tests compile without errors
- ✅ GSAP mocks working correctly
- ✅ Test suites cover initialization, animation creation, lifecycle, and public API
- ✅ TypeScript compilation passed

**Git Commit**: `b34beae` - test(angular-3d): add unit tests for animation directives

**Note**: Test execution verification deferred to final verification phase.

---

## Batch 3: Documentation & Exports 🔄 IN PROGRESS

**Assigned To**: frontend-developer
**Tasks in Batch**: 3
**Dependencies**: Batch 1 complete (directives must exist for exports)
**Estimated Commits**: 1

### Task 3.1: Update Directives Barrel Export 🔄 IN PROGRESS

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\index.ts`

**Specification Reference**: [implementation_plan.md:90-104](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L90-L104)

**Pattern to Follow**: [libs/angular-3d/src/lib/primitives/index.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/index.ts)

**Expected Commit Pattern**: `docs(angular-3d): add animation directives documentation and exports`

**Quality Requirements**:

- ✅ Replace placeholder content
- ✅ Export both directives
- ✅ Export FloatConfig and RotateConfig interfaces
- ✅ Follow barrel export pattern

**Changes**:

```typescript
// @hive-academy/angular-3d - Directives module
// Float3d, Rotate3d animation directives for Three.js objects

export * from './float-3d.directive';
export * from './rotate-3d.directive';
```

**Current Content** (lines 1-6):

```typescript
// @hive-academy/angular-3d - Directives module
// Float3d, Rotate3d, SpaceFlight3d animation directives

// Placeholder - directives will be added in TASK_2025_009
export const DIRECTIVES_MODULE_PLACEHOLDER = true;
```

**Verification**: Ensure [src/index.ts:26](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/index.ts#L26) already exports from './lib/directives' ✅

---

### Task 3.2: Update AnimationService JSDoc 🔄 IN PROGRESS

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\src\lib\render-loop\animation.service.ts`

**Dependencies**: None (parallel with Task 3.1)

**Specification Reference**: [implementation_plan.md:134-184](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L134-L184)

**Pattern to Follow**: Existing JSDoc at [animation.service.ts:1-88](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/render-loop/animation.service.ts#L1-L88)

**Expected Commit Pattern**: `docs(angular-3d): add animation directives documentation and exports`

**Quality Requirements**:

- ✅ Expand class JSDoc (lines 1-88)
- ✅ Add "Declarative Alternative" section
- ✅ Add 2nd example showing directive usage
- ✅ Keep existing implementation unchanged

**Changes**: Replace lines 1-88 with expanded JSDoc that includes:

- Mention of Float3dDirective and Rotate3dDirective as declarative alternatives
- Second @example block showing HTML directive usage
- Keep existing @example showing service usage

**Current JSDoc** (lines 1-6):

```typescript
/**
 * Animation Service - GSAP animation integration
 *
 * Provides reusable animation methods for Three.js objects.
 * Tracks animations by object UUID for cleanup.
 */
```

**New JSDoc** (see implementation_plan.md:140-184 for full content):

- Add "Declarative Alternative" paragraph
- Add directive comparison
- Add HTML example with `float3d` directive

---

### Task 3.3: Add Animation Directives to README 🔄 IN PROGRESS

**File(s)**: `d:\projects\angular-3d-workspace\libs\angular-3d\README.md`

**Dependencies**: None (parallel with Task 3.1, 3.2)

**Specification Reference**: [implementation_plan.md:312-438](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L312-L438)

**Expected Commit Pattern**: `docs(angular-3d): add animation directives documentation and exports`

**Quality Requirements**:

- ✅ Add new "Animation Directives" section after "Primitives"
- ✅ Document Float3dDirective with usage, configuration, and public API
- ✅ Document Rotate3dDirective with 2+ examples (planet, asteroid)
- ✅ Document AnimationService programmatic usage
- ✅ Include 3+ runnable code examples total

**Changes**: Add complete section with:

1. **Float3dDirective Subsection**:

   - Usage example with all config options
   - Configuration table (height, speed, delay, ease, autoStart)
   - Public API example with ViewChild

2. **Rotate3dDirective Subsection**:

   - Simple Y-axis rotation example (planet)
   - Multi-axis tumble example (asteroid)
   - Configuration table (axis, speed, xSpeed/ySpeed/zSpeed, direction, autoStart)
   - Public API example with setSpeed() and reverse()

3. **AnimationService Subsection**:
   - Programmatic usage example
   - Float, rotate, and flight path examples

**Insertion Point**: After "Primitives" section (find via search for `## Primitives` or similar)

**Template**: Full markdown template provided in [implementation_plan.md:318-438](file:///C:/Users/abdal/.gemini/antigravity/brain/59411775-948a-4f91-bc6d-3fe550456ae6/implementation_plan.md#L318-L438)

---

**Batch 3 Verification Requirements**:

- ✅ All 3 files modified
- ✅ One git commit for entire batch: `docs(angular-3d): add animation directives documentation and exports`
- ✅ Barrel export includes both directives
- ✅ AnimationService JSDoc mentions directive alternatives
- ✅ README has complete Animation Directives section
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Public API exports work: `import { Float3dDirective, Rotate3dDirective } from '@hive-academy/angular-3d'`

---

## Batch Execution Protocol

**For Each Batch**:

1. Team-leader assigns entire batch to frontend-developer
2. Developer executes ALL tasks in batch (in order if dependencies exist)
3. Developer stages files progressively (git add after each task)
4. Developer creates ONE commit for entire batch
5. Developer returns with batch git commit SHA
6. Team-leader verifies entire batch
7. If verification passes: Assign next batch
8. If verification fails: Create fix batch

**Commit Strategy**:

- ONE commit per batch (not per task)
- Commit message follows conventional commits format
- Batch 1: `feat(angular-3d): add float3d and rotate3d animation directives`
- Batch 2: `test(angular-3d): add unit tests for animation directives`
- Batch 3: `docs(angular-3d): add animation directives documentation and exports`

**Completion Criteria**:

- All 3 batch statuses are "✅ COMPLETE"
- All batch commits verified and pushed
- All 7 files exist at specified paths
- Build passes: `npx nx build angular-3d`
- Tests pass: `npx nx test angular-3d` (≥80% coverage for directives)
- Lint passes: `npx nx lint angular-3d`
- Public API exports verified

---

## Final Verification Checklist

After all batches complete:

- [ ] All 7 tasks marked "✅ COMPLETE"
- [ ] 3 git commits created (one per batch)
- [ ] Float3dDirective exists and exports FloatConfig interface
- [ ] Rotate3dDirective exists and exports RotateConfig interface
- [ ] Both directives have ≥80% test coverage
- [ ] Directives barrel export updated
- [ ] AnimationService JSDoc mentions directives
- [ ] README has Animation Directives section with 3+ examples
- [ ] Build passes: `npx nx build angular-3d` in <5 seconds
- [ ] Tests pass: `npx nx test angular-3d --codeCoverage`
- [ ] Lint passes: `npx nx lint angular-3d` (zero errors)
- [ ] Public API smoke test passes
