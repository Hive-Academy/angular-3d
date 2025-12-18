# Development Tasks - TASK_2025_009

**Task Type**: Frontend (Library Finalization)  
**Total Tasks**: 5  
**Total Batches**: 2  
**Batching Strategy**: Quality Gates (Tests → Documentation)  
**Status**: 0/2 batches complete (0%)

---

## Context

The `@hive-academy/angular-gsap` library infrastructure is **complete**:

- ✅ All 4 directives/components migrated
- ✅ Build passing (3.6s)
- ✅ Public API exports correct
- ✅ GSAP peer dependency configured

**Remaining Work**: Quality gates (tests + docs)

**Note**: Consumer migration is **out of scope** for this task - that's TASK_2025_012

---

## Batch 1: Unit Tests & GSAP Mocking 🔄 IN PROGRESS

**Assigned To**: frontend-developer  
**Tasks in Batch**: 3  
**Dependencies**: None  
**Estimated Commits**: 1 (one commit per batch)

### Task 1.1: Fix GSAP Test Mocks 🔄 IN PROGRESS

**File(s)**: `libs/angular-gsap/src/test-setup.ts`

**Specification Reference**: implementation-plan.md:220-264

**Current Issue**:

```
FAIL scroll-animation.directive.spec.ts
ReferenceError: gsap is not defined
```

**Root Cause**: GSAP mock not properly set up for directive initialization

**Implementation Steps**:

1. **Verify mock structure** aligns with implementation plan pattern
2. **Add missing mock methods**:
   - Ensure `gsap.timeline()` returns mock with `fromTo()`, `kill()`, `pause()`
   - Ensure `ScrollTrigger.create()` returns mock with `kill()`, `refresh()`, `enable()`, `disable()`
3. **Test the mock** works with directive initialization

**Quality Requirements**:

- ✅ Directive tests pass without "gsap is not defined" error
- ✅ Mock covers all GSAP methods used by directives
- ✅ No actual GSAP animations run during tests

**Verification**:

```bash
npx nx test angular-gsap --testPathPattern=scroll-animation
# Expected: Tests pass
```

---

### Task 1.2: Implement HijackedScrollDirective Tests ⏸️ PENDING

**File(s)**: `libs/angular-gsap/src/lib/directives/hijacked-scroll.directive.spec.ts`

**Dependencies**: Task 1.1 (GSAP mocks must work first)

**Specification Reference**: task-description.md:96-98

**Implementation Steps**:

1. **Create test host component** that uses `HijackedScrollDirective`
2. **Test item discovery**: Verify directive discovers child `HijackedScrollItemDirective` instances via `contentChildren()`
3. **Test timeline creation**: Verify GSAP timeline created with correct step count
4. **Test event emissions**: Verify `currentStepChange` and `progressChange` emit correct values
5. **Test cleanup**: Verify timeline killed on destroy

**Test Cases**:

- ✅ Directive initializes with child items
- ✅ Timeline created with N steps for N items
- ✅ Decorations animate correctly
- ✅ Cleanup kills timeline on destroy

**Verification**:

```bash
npx nx test angular-gsap --testPathPattern=hijacked-scroll.directive
# Expected: All tests pass
```

---

### Task 1.3: Implement Component Tests ⏸️ PENDING

**File(s)**:

- `libs/angular-gsap/src/lib/directives/hijacked-scroll-item.directive.spec.ts`
- `libs/angular-gsap/src/lib/components/hijacked-scroll-timeline.component.spec.ts`

**Dependencies**: Task 1.2 (HijackedScrollDirective tests)

**Specification Reference**: task-description.md:95-100

**Implementation Steps**:

1. **HijackedScrollItemDirective tests**:

   - Verify slide direction calculations
   - Verify config generation for parent directive
   - Verify element reference access

2. **HijackedScrollTimelineComponent tests**:
   - Verify host directive binding works
   - Verify inputs/outputs passed through correctly
   - Verify content projection works

**Quality Requirements**:

- ✅ Item directive: config calculations tested
- ✅ Timeline component: host directive integration tested
- ✅ Overall coverage ≥80%

**Verification**:

```bash
npx nx test angular-gsap --coverage
# Expected: Coverage ≥80%, all tests pass
```

---

**Batch 1 Verification Requirements**:

- ✅ All 3 test files exist and pass
- ✅ Coverage ≥80% (per requirement 5)
- ✅ GSAP mocks work correctly (no "gsap is not defined" errors)
- ✅ One git commit for entire batch
- ✅ Build passes: `npx nx build angular-gsap`

**Batch 1 Commit Pattern**:

```
test(angular-gsap): implement comprehensive unit tests with gsap mocking
```

---

## Batch 2: Documentation ⏸️ PENDING

**Assigned To**: frontend-developer  
**Tasks in Batch**: 2  
**Dependencies**: None (can run parallel with Batch 1)  
**Estimated Commits**: 1

### Task 2.1: Create Comprehensive README ⏸️ PENDING

**File(s)**: `libs/angular-gsap/README.md`

**Specification Reference**: task-description.md:123-135, implementation-plan.md (architecture sections)

**Current State**: Boilerplate only (8 lines)

**Required Sections**:

1. **Library Overview** (2-3 paragraphs)

   - Purpose: DOM scroll animation utilities for Angular
   - Key features: ScrollTrigger, hijacked scroll, SSR-compatible
   - Scope clarification: "This library provides DOM scroll animation utilities. For Three.js object animations, see @hive-academy/angular-3d"

2. **Installation** (code snippet)

   ```bash
   npm install @hive-academy/angular-gsap gsap
   ```

3. **Usage Examples** (3 code examples minimum)

   - Example 1: Fade-in on scroll
   - Example 2: Parallax effects
   - Example 3: Hijacked scroll timeline

4. **API Reference**

   - `ScrollAnimationDirective`: inputs, outputs, methods
   - `HijackedScrollDirective`: inputs, outputs, methods
   - `HijackedScrollItemDirective`: inputs
   - `HijackedScrollTimelineComponent`: inputs, outputs

5. **Configuration**

   - GSAP version compatibility: ^3.12.0
   - Peer dependencies list
   - SSR compatibility notes

6. **License & Contributing**

**Quality Requirements**:

- ✅ README is comprehensive (≥100 lines with examples)
- ✅ All 3 usage examples are complete and runnable
- ✅ API reference covers all public APIs
- ✅ SSR compatibility clearly documented
- ✅ Scope separation mentioned (DOM vs 3D)

---

### Task 2.2: Add JSDoc Comments to Public APIs ⏸️ PENDING

**File(s)**: All directive/component files in `libs/angular-gsap/src/lib/`

**Dependencies**: Task 2.1 (README provides structure)

**Specification Reference**: task-description.md:130

**Implementation Steps**:

1. **ScrollAnimationDirective**:

   - Add comprehensive JSDoc to class
   - Document all inputs with usage examples
   - Document public methods (`refresh()`, `getProgress()`, `setEnabled()`)

2. **HijackedScrollDirective**:

   - Add comprehensive JSDoc to class
   - Document inputs/outputs with examples
   - Document public methods (`refresh()`, `getProgress()`, `jumpToStep()`)

3. **HijackedScrollItemDirective**:

   - Document inputs (slide direction, fade options)
   - Add usage example in JSDoc

4. **HijackedScrollTimelineComponent**:
   - Document inputs/outputs
   - Add content projection example

**Quality Requirements**:

- ✅ All public classes have JSDoc
- ✅ All inputs/outputs documented with types
- ✅ All public methods documented
- ✅ Usage examples in JSDoc comments

**Verification**:

```bash
npx nx build angular-gsap
# Expected: Build succeeds, generated d.ts files include JSDoc comments
```

---

**Batch 2 Verification Requirements**:

- ✅ README is ≥100 lines with 3+ examples
- ✅ All directives/components have comprehensive JSDoc
- ✅ One git commit for entire batch
- ✅ Build passes: `npx nx build angular-gsap`
- ✅ Documentation clearly states DOM-only scope

**Batch 2 Commit Pattern**:

```
docs(angular-gsap): add comprehensive readme and jsdoc comments
```

---

## Batch Execution Protocol

**For Each Batch**:

1. Team-leader assigns entire batch to frontend-developer
2. Developer executes ALL tasks in batch (in order)
3. Developer stages files progressively (`git add` after each task)
4. Developer creates ONE commit for entire batch
5. Developer returns with batch git commit SHA
6. Team-leader verifies entire batch
7. If verification passes: Assign next batch
8. If verification fails: Create fix batch

**Completion Criteria**:

- All batch statuses are "✅ COMPLETE"
- All batch commits verified
- All tests pass with ≥80% coverage
- README is comprehensive
- Build passes
- Lint passes
