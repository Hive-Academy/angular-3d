# Task Context - TASK_2025_012

## User Intent

Migrate existing components from the `temp/` folder to the `apps/angular-3d-demo` application to showcase the newly created `@hive-academy/angular-gsap` library directives and components.

## Background

The `@hive-academy/angular-gsap` library has been successfully created with 4 DOM scroll animation components:

- `ScrollAnimationDirective`
- `HijackedScrollDirective`
- `HijackedScrollItemDirective`
- `HijackedScrollTimelineComponent`

Multiple components in the `temp/` folder currently use these directives:

- `temp/chromadb-section.component.ts`
- `temp/neo4j-section.component.ts`
- `temp/langgraph-core-section.component.ts`
- `temp/hero-section.component.ts`
- `temp/cta-section.component.ts`
- `temp/problem-solution-section.component.ts`
- `temp/scrolling-code-timeline.component.ts`
- And others...

## Scope

1. **Migrate Components**: Move relevant components from `temp/` to `apps/angular-3d-demo/src/app/`
2. **Update Imports**: Change all imports to use `@hive-academy/angular-gsap`
3. **Integration**: Create demo pages showcasing each GSAP directive/component
4. **Documentation**: Add inline documentation and comments explaining usage
5. **Build Verification**: Ensure demo app builds and runs successfully

## Technical Context

- **Source**: `temp/` folder with existing implementations
- **Target**: `apps/angular-3d-demo/src/app/`
- **Library**: `@hive-academy/angular-gsap` (newly created)
- **Framework**: Angular 20.3, standalone components
- **Dependencies**: GSAP 3.x, ScrollTrigger plugin

## Success Criteria

1. Demo app showcases all 4 GSAP components
2. All imports use `@hive-academy/angular-gsap`
3. Build succeeds with no errors
4. Visual animations work correctly
5. Code examples are clear and well-documented

## Dependencies

- **Depends On**: TASK_2025_009 (Angular GSAP Library migration complete)
- **Blocks**: TASK_2025_011 (Testing & Validation)
