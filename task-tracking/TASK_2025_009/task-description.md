# Requirements Document - TASK_2025_009 (FINAL)

## Introduction

The `@hive-academy/angular-3d-workspace` currently contains GSAP-based **DOM scroll animations** incorrectly located within the Angular 3D feature domain or application code. These scroll directives (`ScrollAnimationDirective`, `HijackedScrollDirective`, etc.) provide generic scroll-based animation capabilities for standard DOM elements and have no dependency on Three.js or 3D rendering.

This misplacement violates separation of concerns. By extracting **DOM scroll animations** into a dedicated `@hive-academy/angular-gsap` library, we will:

1. **Clear domain separation**: `@hive-academy/angular-gsap` handles DOM scroll animations; `@hive-academy/angular-3d` handles Three.js scene management and 3D-specific effects
2. **Enable cross-project reuse**: Any application can use scroll animations without depending on 3D infrastructure
3. **Proper layering**: 3D library can optionally use GSAP internally for Three.js effects, but that's an implementation detail, not exported API
4. **Prevent circular dependencies**: One-way dependency only (3D may reference GSAP for utilities, but GSAP never references 3D)

**Business Value**: This refactoring establishes clean domain boundaries, enables building scroll-rich applications without 3D overhead, and follows industry best practices for library separation of concerns.

**Architectural Principle**: `angular-gsap` provides **DOM animation primitives**. The `angular-3d` library may use GSAP internally for Three.js object animations, but those are 3D-specific effects that belong in the 3D library, not the GSAP library.

## Task Classification

- **Type**: REFACTORING
- **Priority**: P2-Medium
- **Complexity**: Medium
- **Estimated Effort**: 8-12 hours

## Workflow Dependencies

- **Research Needed**: No (established patterns exist in workspace)
- **UI/UX Design Needed**: No (preserving existing functionality)

## Requirements

### Requirement 1: Library Scaffolding

**User Story**: As a workspace architect, I want to create a new `@hive-academy/angular-gsap` library following the established workspace patterns, so that the library integrates seamlessly with existing infrastructure.

#### Acceptance Criteria

1. WHEN executing library generation THEN the library SHALL be created at `libs/angular-gsap/` with Nx-standard project structure
2. WHEN reviewing package configuration THEN `package.json` SHALL specify `"name": "@hive-academy/angular-gsap"` with version `0.1.0`
3. WHEN verifying build configuration THEN `project.json` SHALL include buildable library target with Angular 20.3 compatibility
4. WHEN checking TypeScript configuration THEN `tsconfig.lib.json` SHALL extend workspace TypeScript config with library-specific compiler options
5. WHEN validating exports THEN `src/index.ts` SHALL be created as the public API entry point
6. WHEN running initial build THEN build SHALL complete successfully without errors
7. WHEN checking GSAP dependencies THEN `gsap` SHALL be added as a dependency (or peer dependency for publishing)
8. WHEN reviewing scope THEN library SHALL contain ONLY DOM animation utilities, NO Three.js dependencies

### Requirement 2: ScrollAnimation Directive Migration

**User Story**: As a frontend developer, I want to use the `ScrollAnimationDirective` from the GSAP library, so that I can add scroll-based animations to any DOM element without 3D dependencies.

#### Acceptance Criteria

1. WHEN migrating the directive THEN `ScrollAnimationDirective` SHALL be moved from `temp/directives/scroll-animation.directive.ts` to `libs/angular-gsap/src/lib/directives/scroll-animation.directive.ts`
2. WHEN initializing GSAP plugins THEN `ScrollTrigger.register()` SHALL only execute when `isPlatformBrowser()` returns true (SSR compatibility)
3. WHEN configuring animations THEN all existing animation types SHALL be preserved: `fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `slideLeft`, `slideRight`, `scaleIn`, `scaleOut`, `parallax`, `custom`
4. WHEN using signal-based inputs THEN `scrollConfig` input SHALL remain a signal with proper reactive behavior
5. WHEN cleaning up THEN `ngOnDestroy()` SHALL kill both `scrollTrigger` and `animation` instances to prevent memory leaks
6. WHEN exporting types THEN `AnimationType` and `ScrollAnimationConfig` interfaces SHALL be exported from `src/index.ts` for consumer use
7. WHEN using public API THEN methods SHALL be exposed: `refresh()`, `getProgress()`, `setEnabled()`
8. WHEN verifying scope THEN directive SHALL work ONLY with HTMLElement, NOT Three.js objects

### Requirement 3: HijackedScroll Directives Migration

**User Story**: As a content creator, I want to use hijacked scroll sequences from the GSAP library, so that I can create step-by-step scroll-driven presentations.

#### Acceptance Criteria

1. WHEN migrating directives THEN both `HijackedScrollDirective` and `HijackedScrollItemDirective` SHALL be moved to `libs/angular-gsap/src/lib/directives/`
2. WHEN initializing scroll sequences THEN directive SHALL use `contentChildren()` signal query to discover step items
3. WHEN coordinating animations THEN directive SHALL create GSAP master timeline with proper step sequencing (fade in/out, slide animations)
4. WHEN handling decorations THEN elements with `[data-decoration-index]` and `.decoration-inner` SHALL animate as defined
5. WHEN emitting events THEN `currentStepChange` and `progressChange` outputs SHALL emit correct values during scroll
6. WHEN exporting types THEN `HijackedScrollConfig`, `HijackedScrollItemConfig`, and `SlideDirection` SHALL be exported from public API
7. WHEN using public API THEN methods SHALL be exposed: `refresh()`, `getProgress()`, `jumpToStep()`
8. WHEN verifying scope THEN directives SHALL work ONLY with DOM elements, NOT Three.js objects

### Requirement 4: HijackedScrollTimeline Component Migration

**User Story**: As a developer, I want a convenience wrapper component for hijacked scroll, so that I can use content projection for custom step layouts.

#### Acceptance Criteria

1. WHEN migrating component THEN `HijackedScrollTimelineComponent` SHALL be moved to `libs/angular-gsap/src/lib/components/hijacked-scroll-timeline.component.ts`
2. WHEN using host directives THEN component SHALL use `hostDirectives` to bind `HijackedScrollDirective` with pass-through inputs/outputs
3. WHEN projecting content THEN component template SHALL use `<ng-content />` for child hijackedScrollItem elements
4. WHEN configuring options THEN all inputs SHALL be exposed: `scrollHeightPerStep`, `animationDuration`, `ease`, `markers`, `minHeight`, `start`, `end`
5. WHEN handling events THEN all outputs SHALL be exposed: `currentStepChange`, `progressChange`

### Requirement 5: Unit Test Migration

**User Story**: As a quality engineer, I want comprehensive unit tests for all migrated directives, so that we maintain code quality and prevent regressions.

#### Acceptance Criteria

1. WHEN creating test files THEN each directive/component SHALL have a corresponding `.spec.ts` file
2. WHEN testing ScrollAnimationDirective THEN tests SHALL verify animation initialization, config reactivity, cleanup, and public API methods (`refresh()`, `getProgress()`, `setEnabled()`)
3. WHEN testing HijackedScrollDirective THEN tests SHALL verify item discovery, timeline creation, step transitions, and event emissions
4. WHEN testing HijackedScrollItemDirective THEN tests SHALL verify slide offset calculations, config generation, and element access
5. WHEN mocking GSAP THEN tests SHALL use Jest mocks for `gsap` and `ScrollTrigger` to prevent actual DOM animations
6. WHEN running tests THEN `nx test angular-gsap` SHALL achieve minimum 80% code coverage

### Requirement 6: Consumer Migration

**User Story**: As an application developer, I want existing consumers to import from the new library, so that the transition is complete and dependencies are correctly aligned.

#### Acceptance Criteria

1. WHEN updating imports THEN all 10+ consumer components SHALL change imports from old paths to `@hive-academy/angular-gsap`
2. WHEN verifying consumers THEN the following MUST be updated:
   - `temp/chromadb-section.component.ts`
   - `temp/neo4j-section.component.ts`
   - `temp/langgraph-core-section.component.ts`
   - `temp/langgraph-memory-section.component.ts`
   - `temp/hero-section.component.ts`
   - `temp/cta-section.component.ts`
   - `temp/problem-solution-section.component.ts`
   - `temp/value-propositions-section.component.ts`
   - `temp/hijacked-scroll-timeline.component.ts`
   - `temp/scrolling-code-timeline.component.ts`
3. WHEN removing old files THEN original directive files in application code SHALL be deleted after migration verified
4. WHEN building workspace THEN all consumer projects SHALL build successfully with new import paths

### Requirement 7: Documentation

**User Story**: As a library consumer, I want clear documentation on how to use the library, so that I can integrate scroll animations into my applications.

#### Acceptance Criteria

1. WHEN creating README THEN `libs/angular-gsap/README.md` SHALL include library overview, installation, usage examples, and API reference
2. WHEN documenting directives THEN each directive SHALL have inline JSDoc comments with usage examples
3. WHEN providing examples THEN README SHALL include code snippets for common use cases: fade-in on scroll, parallax effects, hijacked scroll timelines
4. WHEN listing dependencies THEN README SHALL specify GSAP version compatibility and peer dependencies
5. WHEN noting platform support THEN documentation SHALL mention SSR compatibility requirements
6. WHEN clarifying scope THEN README SHALL state: "This library provides DOM scroll animation utilities. For Three.js object animations, see @hive-academy/angular-3d"

## Non-Functional Requirements

### Performance

- **Build Time**: Library build SHALL complete in <10 seconds
- **Bundle Size**: Compiled library SHALL be <50KB (minified, before gzip)
- **Import Cost**: Consumers SHALL import only required directives (tree-shakeable exports)

### Security

- **Dependency Audit**: GSAP dependency SHALL be scanned for known vulnerabilities (npm audit)
- **XSS Protection**: Directives SHALL NOT use `innerHTML` or inject unsanitized content
- **CSP Compatibility**: Animations SHALL work with Content Security Policy restrictions

### Scalability

- **Concurrent Instances**: Multiple directive instances SHALL operate independently without interference
- **Memory Management**: Proper cleanup SHALL prevent memory leaks in single-page applications with route changes
- **Performance Monitoring**: No performance degradation with 10+ active scroll triggers per page

### Reliability

- **Error Handling**: Graceful fallbacks when GSAP fails to load or browser lacks support
- **Platform Detection**: Proper detection of server vs. browser environment for SSR
- **Lifecycle Safety**: No errors when directives are destroyed during route transitions

## Stakeholder Analysis

- **End Users (Frontend Developers)**: Need simple, declarative API for scroll animations without deep GSAP knowledge
- **Library Maintainers**: Need clear separation of concerns, independent versioning, and comprehensive tests
- **Application Teams**: Need backward-compatible migration path with minimal disruption
- **DevOps/CI**: Need reliable builds, automated testing, and clear dependency management

## Risk Analysis

### Technical Risks

**Risk 1**: Breaking Changes During Migration

- **Probability**: Medium
- **Impact**: High (could break 10+ consumer components)
- **Mitigation**: Preserve exact API surface; create migration checklist; test each consumer before deletion
- **Contingency**: Keep original files until all consumers verified working

**Risk 2**: SSR Compatibility Issues

- **Probability**: Low
- **Impact**: Medium (affects server-side rendering)
- **Mitigation**: Use `isPlatformBrowser()` guards; test SSR build explicitly
- **Contingency**: Add warning documentation if SSR limitations discovered

**Risk 3**: GSAP Version Conflicts

- **Probability**: Low
- **Impact**: Medium (could cause runtime errors)
- **Mitigation**: Use peer dependencies; document version requirements
- **Contingency**: Pin specific GSAP version if conflicts arise

**Risk 4**: Test Coverage Gaps

- **Probability**: Medium
- **Impact**: Medium (regressions may slip through)
- **Mitigation**: Achieve 80%+ coverage; manual testing of visual animations
- **Contingency**: Add integration tests with browser automation if needed

## Dependencies

### Technical Dependencies

- **Build System**: Nx 22.2.6 with Angular library builder
- **Framework**: Angular 20.3 with standalone component support
- **Animation Library**: GSAP 3.x with ScrollTrigger plugin
- **Testing**: Jest for unit tests, compatibility with existing workspace test infrastructure
- **TypeScript**: 5.9+ for signal-based APIs

### Workspace Dependencies

- **Template**: Existing `@hive-academy/angular-3d` library structure as reference
- **Configuration**: Shared TypeScript, ESLint, Jest configurations
- **Build Pipeline**: Nx task orchestration and caching

### External Dependencies

- **GSAP License**: Verify project has appropriate GSAP license (business license if required)
- **NPM Packages**: `gsap` package must be added to library dependencies or peer dependencies

## Success Metrics

### Completion Metrics

- **Metric 1**: 4 directives/components successfully migrated to new library (100% of DOM scroll animation code)
- **Metric 2**: All 10+ consumers updated to use new import paths (100% of consumers)
- **Metric 3**: Unit test coverage ≥80% for library code
- **Metric 4**: Zero build errors across workspace after migration
- **Metric 5**: Documentation README created with examples and API reference

### Quality Metrics

- **Metric 6**: All existing visual animations function identically after migration (pixel-perfect parity)
- **Metric 7**: No memory leaks detected during route navigation stress testing
- **Metric 8**: Library buildable and publishable as standalone NPM package
- **Metric 9**: TypeScript compilation with strict mode enabled, zero errors
- **Metric 10**: ESLint passes with zero warnings using workspace rules
- **Metric 11**: Zero Three.js dependencies in angular-gsap (confirms proper separation)

## Out of Scope

The following are explicitly **NOT** included in this task and remain in `@hive-academy/angular-3d`:

- **AnimationService** - Three.js object animation service (stays in angular-3d)
- **Float3dDirective** - Three.js floating animation directive (stays in angular-3d)
- **Rotate3dDirective** - Three.js rotation animation directive (stays in angular-3d)
- **SpaceFlight3dDirective** - Three.js flight path animation directive (stays in angular-3d)
- **Glow3dDirective** - Three.js glow effect directive (stays in angular-3d)

These components use GSAP internally for Three.js object animations, which is an implementation detail of the 3D library. They are Three.js-specific effects and belong in the domain of 3D rendering, not generic DOM animations.
