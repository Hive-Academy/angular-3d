# Task Context - TASK_2025_013

## User Intent

Create Three.js-specific animation directives and components within the `@hive-academy/angular-3d` library that utilize GSAP for animating 3D objects.

## Background

The `@hive-academy/angular-3d` library currently has some Three.js components in the `temp/angular-3d/` folder that use GSAP for 3D object animations:

- `temp/angular-3d/directives/float-3d.directive.ts` - Floating animation for 3D objects
- `temp/angular-3d/directives/rotate-3d.directive.ts` - Continuous rotation for 3D objects
- `temp/angular-3d/directives/space-flight-3d.directive.ts` - Cinematic flight paths
- `temp/angular-3d/services/animation.service.ts` - GSAP animation service for Three.js objects

**Architectural Decision**: These components should remain in `@hive-academy/angular-3d` (NOT moved to `angular-gsap`) because they are Three.js-specific effects that belong in the 3D domain. The `angular-3d` library will import GSAP as a dependency for internal use.

## Scope

1. **Migrate 3D Animation Directives**:

   - `Float3dDirective` - Floating/bobbing animation
   - `Rotate3dDirective` - Continuous rotation
   - `SpaceFlight3dDirective` - Flight path animation

2. **Migrate Animation Service**:

   - `AnimationService` - GSAP wrapper for Three.js objects
   - Methods: `floatAnimation()`, `rotateAnimation()`, `flightPath()`, `pulseAnimation()`, `animateCamera()`

3. **Package Configuration**:

   - Add GSAP as a peer dependency to `angular-3d/package.json`
   - Ensure proper tree-shaking

4. **Unit Tests**:

   - Migrate and adapt existing tests
   - Mock GSAP properly in test environment

5. **Documentation**:
   - JSDoc comments for all public APIs
   - Usage examples for each directive

## Technical Context

- **Source**: `temp/angular-3d/directives/` and `temp/angular-3d/services/`
- **Target**: `libs/angular-3d/src/lib/directives/3d/` and `libs/angular-3d/src/lib/services/`
- **Library**: `@hive-academy/angular-3d`
- **Dependencies**: Three.js, GSAP 3.x, angular-three (for `injectBeforeRender()`)
- **Framework**: Angular 20.3, signals, standalone directives

## Key Differences from DOM Directives

- **DOM Directives** (`angular-gsap`): Animate HTML elements, use ScrollTrigger
- **3D Directives** (`angular-3d`): Animate Three.js Object3D instances, use render loop
- **Separation**: Clear domain boundaries - DOM animations vs 3D object manipulation

## Success Criteria

1. All 3 directives migrated to `angular-3d` library
2. `AnimationService` migrated with all methods functional
3. Unit tests passing with proper GSAP mocks
4. Build succeeds for `angular-3d` library
5. No circular dependencies between `angular-3d` and `angular-gsap`
6. Public API properly exported

## Dependencies

- **Parallel To**: TASK_2025_009 (Angular GSAP Library)
- **Depends On**: TASK_2025_008 (Primitive Components - Advanced, for testing integration)
