# Requirements Document - TASK_2025_013

## Introduction

The `@hive-academy/angular-3d` library currently has core infrastructure complete (canvas, render loop, state store, primitives) but lacks declarative animation directives for animating Three.js objects. The `temp/angular-3d/` folder contains production-ready GSAP-powered animation directives that provide floating, rotation, and cinematic flight path animations for 3D objects.

This task migrates these Three.js-specific animation utilities from `temp/` to the `@hive-academy/angular-3d` library, completing the library's animation capabilities before demo application integration.

**Business Value**:

- **Developer Experience**: Declarative, signal-based animation directives for Three.js objects
- **Reusability**: Share 3D animation patterns across all components
- **Performance**: Optimized GSAP integration with Three.js render loop
- **Maintainability**: Centralized, tested animation utilities vs scattered implementations

## Task Classification

- **Type**: FEATURE (library enhancement)
- **Priority**: P1-High (blocks demo app integration)
- **Complexity**: Medium
- **Estimated Effort**: 6-8 hours

## Workflow Dependencies

- **Research Needed**: No (existing implementations verified, GSAP patterns established)
- **UI/UX Design Needed**: No (internal library utilities)

## Requirements

### Requirement 1: Float3dDirective Migration

**User Story**: As a Three.js developer using `@hive-academy/angular-3d`, I want a declarative `float3d` directive to apply floating animation to 3D objects, so that I can create engaging hover effects without manual GSAP setup.

#### Acceptance Criteria

1. WHEN Float3dDirective applied to 3D component THEN seamless up-down floating animation SHALL execute using GSAP timeline
2. WHEN floatHeight input provided THEN animation amplitude SHALL match specified value in Three.js units
3. WHEN floatSpeed input provided THEN full cycle duration SHALL match specified milliseconds
4. WHEN directive destroyed THEN GSAP timeline SHALL be killed and object SHALL return to original position
5. WHEN autoStart=false THEN animation SHALL remain paused until manually started via public API
6. WHEN play()/pause()/stop() called THEN animation SHALL respond immediately with smooth transitions

**Technical Details**:

- Source: `temp/angular-3d/directives/float-3d.directive.ts` (265 lines)
- Target: `libs/angular-3d/src/lib/directives/3d/float-3d.directive.ts`
- Pattern: Seamless continuous loop (UP phase → DOWN phase → repeat)
- Dependencies: GSAP, Three.js Mesh/Object3D, ElementRef, DestroyRef

---

### Requirement 2: Rotate3dDirective Migration

**User Story**: As a Three.js developer using `@hive-academy/angular-3d`, I want a declarative `rotate3d` directive to apply continuous rotation to 3D objects, so that I can create spinning planets, tumbling asteroids, and rotating models without manual animation code.

#### Acceptance Criteria

1. WHEN Rotate3dDirective applied with axis='y' THEN continuous Y-axis rotation SHALL execute smoothly
2. WHEN axis='xyz' configured THEN simultaneous multi-axis rotation SHALL create tumbling effect
3. WHEN xSpeed/ySpeed/zSpeed provided THEN each axis SHALL rotate independently at specified rates
4. WHEN direction=-1 specified THEN rotation SHALL reverse (counter-clockwise)
5. WHEN setSpeed() called THEN rotation speed SHALL adjust dynamically without restart
6. WHEN reverse() called THEN rotation direction SHALL invert immediately
7. WHEN directive destroyed THEN GSAP timeline SHALL be killed and resources SHALL be released

**Technical Details**:

- Source: `temp/angular-3d/directives/rotate-3d.directive.ts` (324 lines)
- Target: `libs/angular-3d/src/lib/directives/3d/rotate-3d.directive.ts`
- Pattern: Infinite timeline with relative rotation (`+=Math.PI*2`)
- Dependencies: GSAP, Three.js Object3D, ElementRef, DestroyRef

---

### Requirement 3: AnimationService Migration

**User Story**: As a Three.js developer using `@hive-academy/angular-3d`, I want a centralized AnimationService to create and manage complex GSAP animations for 3D objects, so that I can coordinate multi-object sequences and track performance metrics.

#### Acceptance Criteria

1. WHEN AnimationService injected THEN reactive animation state management SHALL be available via signals
2. WHEN createTimeline() called THEN new GSAP timeline registered SHALL be returned with unique ID
3. WHEN playTimeline()/pauseTimeline()/stopTimeline() called THEN timeline SHALL respond immediately
4. WHEN animations execute THEN performance metrics (FPS, animation count, memory) SHALL update reactively
5. WHEN dispose() called THEN all GSAP timelines SHALL be killed and resources SHALL be released
6. WHEN animationState() signal accessed THEN current playback status SHALL be available reactively

**Technical Details**:

- Source: `temp/angular-3d/services/animation.service.ts` (574 lines)
- Target: `libs/angular-3d/src/lib/services/animation.service.ts`
- Pattern: Signal-based state store with GSAP timeline registry
- Dependencies: GSAP, Three.js, angular-three (injectStore)

---

### Requirement 4: Library Configuration

**User Story**: As a developer installing `@hive-academy/angular-3d`, I want GSAP peer dependency clearly specified, so that I can manage GSAP versions independently and avoid bundle size inflation.

#### Acceptance Criteria

1. WHEN package.json viewed THEN `gsap: ^3.12.0` SHALL be listed as peer dependency (✅ already exists as ^3.14.2)
2. WHEN library built THEN sideEffects: false SHALL enable tree-shaking (✅ already configured)
3. WHEN animations imported THEN only used GSAP modules SHALL be included in bundle
4. WHEN README viewed THEN installation instructions SHALL include `npm install gsap`

---

### Requirement 5: Unit Tests Migration

**User Story**: As a library maintainer, I want comprehensive unit tests for animation directives, so that I can verify correct behavior and prevent regressions during future changes.

#### Acceptance Criteria

1. WHEN tests run THEN Float3dDirective SHALL have ≥80% code coverage
2. WHEN tests run THEN Rotate3dDirective SHALL have ≥80% code coverage
3. WHEN tests run THEN AnimationService SHALL have ≥80% code coverage
4. WHEN GSAP mocked in tests THEN directives SHALL initialize without errors
5. WHEN all tests run THEN build SHALL pass without errors
6. WHEN tests verify lifecycle THEN DestroyRef cleanup SHALL be tested

**Technical Details**:

- Test files: `*.directive.spec.ts`, `animation.service.spec.ts`
- Mock setup: `test-setup.ts` with GSAP mock (reuse from angular-gsap)
- Coverage target: ≥80% per file

---

### Requirement 6: Public API Exports

**User Story**: As a developer using `@hive-academy/angular-3d`, I want clean barrel exports for animation utilities, so that I can import directives and services with minimal path complexity.

#### Acceptance Criteria

1. WHEN importing from `@hive-academy/angular-3d` THEN Float3dDirective SHALL be available
2. WHEN importing from `@hive-academy/angular-3d` THEN Rotate3dDirective SHALL be available
3. WHEN importing from `@hive-academy/angular-3d` THEN AnimationService SHALL be available
4. WHEN importing from `@hive-academy/angular-3d` THEN related TypeScript interfaces SHALL be available
5. WHEN library built THEN generated .d.ts files SHALL include JSDoc comments

**Technical Details**:

- Export location: `libs/angular-3d/src/index.ts`
- Pattern: Barrel exports with type re-exports

---

### Requirement 7: Documentation

**User Story**: As a developer learning `@hive-academy/angular-3d`, I want comprehensive JSDoc comments and usage examples, so that I can quickly understand how to use animation directives.

#### Acceptance Criteria

1. WHEN Float3dDirective viewed in IDE THEN JSDoc SHALL explain all inputs and public methods
2. WHEN Rotate3dDirective viewed in IDE THEN JSDoc SHALL include axis/speed configuration examples
3. WHEN AnimationService viewed in IDE THEN JSDoc SHALL document createTimeline() workflow
4. WHEN README viewed THEN animation directives section SHALL exist with 3 examples
5. WHEN JSDoc viewed THEN usage examples SHALL be runnable code snippets

---

## Non-Functional Requirements

### Performance

- **Animation Frame Rate**: 60fps target for all animations, graceful degradation to 30fps under load
- **Memory Usage**: GSAP timelines cleaned up immediately on component destroy, zero memory leaks
- **Timeline Overhead**: <1ms per directive initialization
- **Bundle Size**: Animation directives add ≤15KB to minified bundle (tree-shakeable)

### Code Quality

- **Test Coverage**: ≥80% per file (directives and service)
- **TypeScript Strict Mode**: All files pass strict type checking
- **Linter**: Zero ESLint warnings/errors
- **Angular Patterns**: Signal-based inputs, inject() function, standalone directives

### Compatibility

- **Angular Version**: 20.3+
- **Three.js Version**: Compatible with angular-three peer dependency (≥1.0.0)
- **GSAP Version**: ^3.12.0+
- **SSR**: Not applicable (Three.js client-only)

### Maintainability

- **Code Style**: Consistent with existing angular-3d patterns
- **Comments**: JSDoc on all public APIs
- **Examples**: 3+ usage examples in JSDoc and README
- **Migration Path**: Zero breaking changes (new features only)

---

## Stakeholder Analysis

- **End Users (Angular + Three.js Developers)**: Need declarative animation directives vs manual GSAP code
- **Library Maintainers**: Need test coverage ≥80%, clear JSDoc, no memory leaks
- **Demo App Developers (TASK_2025_010)**: Blocked on these animation utilities for hero sections

---

## Risk Analysis

### Technical Risks

**Risk 1: GSAP Dynamic Import Failures**

- **Probability**: Low
- **Impact**: High (animations break)
- **Mitigation**: Test dynamic `import('gsap')` in both dev/prod builds
- **Contingency**: Fallback to static import if dynamic fails

**Risk 2: angular-three Dependency Breaking Changes**

- **Probability**: Low
- **Impact**: Medium (injectStore() fails)
- **Mitigation**: Use optional injection `injectStore({ optional: true })`
- **Contingency**: Remove angular-three dependency if incompatible

**Risk 3: Memory Leaks from Uncleaned GSAP Timelines**

- **Probability**: Medium
- **Impact**: High (performance degradation)
- **Mitigation**: Comprehensive DestroyRef tests, manual QA for all directives
- **Contingency**: Add Finalization Registry fallback for cleanup

**Risk 4: Test Mock Complexity**

- **Probability**: Low
- **Impact**: Medium (flaky tests)
- **Mitigation**: Reuse proven GSAP mock pattern from angular-gsap
- **Contingency**: Simplify tests to focus on directive lifecycle only

---

## Dependencies

### Technical Dependencies

- **Required**: GSAP 3.12+, Three.js, Angular 20.3+, angular-three
- **Build**: Nx build tools, Jest test runner
- **Testing**: GSAP test mocks from angular-gsap (reuse pattern)

### Task Dependencies

- **Depends On**: TASK_2025_008 (Primitive Components - must have components to test directives on)
- **Parallel With**: TASK_2025_009 (Angular GSAP Library - shares GSAP mock patterns)
- **Blocks**: TASK_2025_010 (Demo App Integration - needs animation directives)

---

## Success Metrics

### Quantitative Metrics

- **Metric 1**: All 3 directives migrated with ≥80% test coverage
- **Metric 2**: Build passes: `npx nx build angular-3d` in <5 seconds
- **Metric 3**: Zero ESLint/TypeScript errors
- **Metric 4**: All 32+ tests passing (estimated final count)

### Qualitative Metrics

- **Metric 5**: Developer feedback: "Animation directives are easy to use"
- **Metric 6**: Code review: "JSDoc examples are clear and runnable"

---

## Scope Boundaries

### In Scope

- ✅ Float3dDirective migration and tests
- ✅ Rotate3dDirective migration and tests
- ✅ AnimationService migration and tests
- ✅ GSAP peer dependency configuration
- ✅ Public API barrel exports
- ✅ JSDoc documentation with examples

### Out of Scope (Deferred)

- ❌ SpaceFlight3dDirective (optional, defer to future task if time constrained)
- ❌ Glow3dDirective (shader-based, not GSAP-related)
- ❌ Performance3dDirective (diagnostics, not animation)
- ❌ Consumer migration in temp/ (handled by TASK_2025_010)
- ❌ Demo app integration (TASK_2025_010)

---

## Implementation Notes

### GSAP Mock Pattern (Reuse from TASK_2025_009)

```typescript
// libs/angular-3d/src/test-setup.ts (reuse angular-gsap pattern)
jest.mock('gsap', () => ({
  gsap: {
    timeline: jest.fn(() => mockTimeline),
    to: jest.fn(),
    killTweensOf: jest.fn(),
  },
}));
```

### Migration Checklist

1. Copy directive files to `libs/angular-3d/src/lib/directives/3d/`
2. Copy AnimationService to `libs/angular-3d/src/lib/services/`
3. Update imports (remove angular-three if breaking)
4. Create test files with GSAP mocks
5. Add barrel exports to `src/index.ts`
6. Run tests: `npx nx test angular-3d`
7. Build: `npx nx build angular-3d`
8. Update README with animation section

---

## Acceptance Checklist

- [ ] Float3dDirective migrated with ≥80% test coverage
- [ ] Rotate3dDirective migrated with ≥80% test coverage
- [ ] AnimationService migrated with ≥80% test coverage
- [ ] GSAP peer dependency verified in package.json (already exists ✅)
- [ ] Public API exports updated in `src/index.ts`
- [ ] All tests passing: `npx nx test angular-3d`
- [ ] Build passing: `npx nx build angular-3d`
- [ ] Lint passing: `npx nx lint angular-3d`
- [ ] JSDoc comments added to all public APIs
- [ ] README updated with animation examples (3+)
- [ ] Zero memory leaks verified via manual testing
