# Requirements Document - TASK_2025_022

## Introduction

This task addresses an architectural concern in the `@hive-academy/angular-gsap` and `@hive-academy/angular-3d` libraries: **scattered GSAP imports and redundant plugin registration**. Currently, 4 different files directly import GSAP and call `gsap.registerPlugin(ScrollTrigger)` in their constructors. This creates:

1. **Redundant plugin registration** - ScrollTrigger is registered 4x on first page load
2. **Testing friction** - Each component must mock GSAP separately
3. **SSR safety gaps** - Each file handles SSR checks independently
4. **Maintenance burden** - Adding new plugins requires touching multiple files

The solution is to create a centralized `GsapCoreService` that provides singleton access to GSAP, registers plugins once, and offers `gsap.context()` for automatic cleanup.

## Task Classification

- **Type**: REFACTORING
- **Priority**: P2-Medium (architectural improvement, no user-facing changes)
- **Complexity**: Medium
- **Estimated Effort**: 4-6 hours

## Workflow Dependencies

- **Research Needed**: No (GSAP patterns well-understood)
- **UI/UX Design Needed**: No (internal service, no visual changes)

---

## Requirements

### Requirement 1: GsapCoreService - Singleton Access to GSAP

**User Story**: As a library developer using `@hive-academy/angular-gsap`, I want a centralized service that provides access to GSAP and its plugins, so that I don't need to manage imports and registration in every directive/component.

#### Acceptance Criteria

1. WHEN `GsapCoreService` is injected THEN it SHALL provide access to the GSAP core object via a `gsap` property
2. WHEN `GsapCoreService` is injected THEN it SHALL provide access to `ScrollTrigger` via a `scrollTrigger` property
3. WHEN `GsapCoreService` is first injected in a browser context THEN plugins SHALL be registered exactly once
4. WHEN `GsapCoreService` is injected in an SSR context THEN GSAP operations SHALL be safely no-ops
5. WHEN `GsapCoreService.createContext()` is called THEN it SHALL return a `gsap.Context` for automatic cleanup

### Requirement 2: Plugin Registration Consolidation

**User Story**: As a library maintainer, I want all GSAP plugins registered in a single location, so that I can add new plugins without modifying multiple files.

#### Acceptance Criteria

1. WHEN the application starts in browser THEN `ScrollTrigger` SHALL be registered exactly once
2. WHEN `LenisSmoothScrollService.initialize()` is called THEN it SHALL use `GsapCoreService` instead of dynamic imports
3. WHEN future plugins are needed THEN adding them to `GsapCoreService` SHALL make them available application-wide
4. WHEN `gsap.registerPlugin()` is searched in codebase THEN it SHALL only exist in `GsapCoreService`

### Requirement 3: Directive Refactoring

**User Story**: As a library consumer, I want scroll animation directives that work correctly without redundant GSAP initialization, so that my application initializes faster and is easier to test.

#### Acceptance Criteria

1. WHEN `ScrollAnimationDirective` is used THEN it SHALL inject `GsapCoreService` instead of direct GSAP import
2. WHEN `HijackedScrollDirective` is used THEN it SHALL inject `GsapCoreService` instead of direct GSAP import
3. WHEN `ParallaxSplitScrollComponent` is used THEN it SHALL inject `GsapCoreService` instead of direct GSAP import
4. WHEN any directive is tested THEN mocking `GsapCoreService` SHALL be sufficient (no GSAP module mocking needed)

### Requirement 4: Angular-3D AnimationService Alignment

**User Story**: As a developer using both `@hive-academy/angular-3d` and `@hive-academy/angular-gsap`, I want consistent GSAP access across both libraries, so that animations are initialized correctly regardless of which library initializes first.

#### Acceptance Criteria

1. WHEN `AnimationService` in angular-3d is used THEN it SHALL inject GSAP via a shared pattern (either re-export from angular-gsap or internal equivalent)
2. WHEN both libraries are used together THEN GSAP SHALL only be initialized once
3. WHEN only `angular-3d` is used THEN it SHALL still function correctly without requiring `angular-gsap`

### Requirement 5: Test Infrastructure Update

**User Story**: As a developer writing tests, I want a simple way to mock GSAP for unit tests, so that I can test components without complex module mocking.

#### Acceptance Criteria

1. WHEN a component using `GsapCoreService` is tested THEN providing a mock via `TestBed` SHALL work
2. WHEN `test-setup.ts` is updated THEN it SHALL provide helper utilities for GSAP mocking
3. WHEN existing tests are run after refactoring THEN they SHALL continue to pass

---

## Non-Functional Requirements

### Performance Requirements

- **Initialization Time**: Plugin registration SHALL complete in <10ms
- **Bundle Impact**: Refactoring SHALL not increase bundle size by more than 1KB
- **Memory**: No additional memory overhead from service layer

### Reliability Requirements

- **SSR Safety**: All GSAP operations SHALL be safely skipped during SSR
- **Error Handling**: Failed plugin registration SHALL log warning but not crash application
- **Cleanup**: `gsap.context()` usage SHALL ensure all animations are killed on component destroy

### Maintainability Requirements

- **Single Registration Point**: All plugins registered in one location
- **Testability**: All GSAP-using components testable via DI mocking
- **Documentation**: `GsapCoreService` SHALL have comprehensive JSDoc

### Compatibility Requirements

- **Existing API**: All public APIs of directives SHALL remain unchanged
- **Consumer Code**: Applications using these libraries SHALL require zero code changes

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder         | Impact Level | Involvement   | Success Criteria         |
| ------------------- | ------------ | ------------- | ------------------------ |
| Library Consumers   | Low          | None required | Zero breaking changes    |
| Library Maintainers | High         | Code review   | Easier plugin management |
| Test Authors        | Medium       | Test updates  | Simpler mocking          |

### Secondary Stakeholders

| Stakeholder         | Impact Level | Involvement   | Success Criteria         |
| ------------------- | ------------ | ------------- | ------------------------ |
| Future Contributors | Medium       | Documentation | Clear patterns to follow |

---

## Risk Analysis

### Technical Risks

| Risk                          | Probability | Impact | Mitigation                                    | Contingency                                   |
| ----------------------------- | ----------- | ------ | --------------------------------------------- | --------------------------------------------- |
| Service initialization timing | Medium      | High   | Use eager initialization or `APP_INITIALIZER` | Fall back to lazy per-directive registration  |
| Cross-library dependency      | Low         | Medium | Keep `angular-3d` independent                 | Internal GSAP wrapper in angular-3d if needed |
| Test regressions              | Low         | Medium | Run full test suite before PR                 | Rollback if critical failures                 |

### Implementation Risks

| Risk                   | Probability | Impact   | Mitigation                                       |
| ---------------------- | ----------- | -------- | ------------------------------------------------ |
| Circular dependency    | Low         | High     | Service in separate file, lazy inject if needed  |
| Breaking existing apps | Very Low    | Critical | No public API changes, only internal refactoring |

---

## Dependencies

### Technical Dependencies

- `gsap` (v3.x) - Already a dependency
- `gsap/ScrollTrigger` - Already used
- Angular DI system - For singleton pattern

### Library Dependencies

- `@hive-academy/angular-gsap` - Primary library being refactored
- `@hive-academy/angular-3d` - Secondary library for alignment (optional)

---

## Success Metrics

| Metric                           | Target          | Measurement Method     |
| -------------------------------- | --------------- | ---------------------- |
| `gsap.registerPlugin` call sites | 1 (down from 4) | grep search            |
| Test complexity                  | Simpler mocks   | Qualitative review     |
| Bundle size change               | <1KB increase   | Build size comparison  |
| Existing tests passing           | 100%            | CI pipeline            |
| Public API changes               | 0               | TypeScript compilation |

---

## Out of Scope

- Adding new GSAP plugins (beyond ScrollTrigger)
- Changing any public APIs of directives
- Performance optimizations beyond registration consolidation
- Changes to demo application code (only library code)

---

## Files to Modify

### @hive-academy/angular-gsap

| File                                                    | Action | Description                                  |
| ------------------------------------------------------- | ------ | -------------------------------------------- |
| `src/lib/services/gsap-core.service.ts`                 | CREATE | New centralized GSAP service                 |
| `src/lib/services/lenis-smooth-scroll.service.ts`       | MODIFY | Use GsapCoreService, remove dynamic imports  |
| `src/lib/directives/scroll-animation.directive.ts`      | MODIFY | Remove direct import, inject GsapCoreService |
| `src/lib/directives/hijacked-scroll.directive.ts`       | MODIFY | Remove direct import, inject GsapCoreService |
| `src/lib/components/parallax-split-scroll.component.ts` | MODIFY | Remove direct import, inject GsapCoreService |
| `src/index.ts`                                          | MODIFY | Export GsapCoreService                       |
| `src/test-setup.ts`                                     | MODIFY | Update mocking strategy                      |

### @hive-academy/angular-3d (Optional)

| File                                       | Action | Description                                                          |
| ------------------------------------------ | ------ | -------------------------------------------------------------------- |
| `src/lib/render-loop/animation.service.ts` | MODIFY | Consider importing from angular-gsap or creating internal equivalent |
