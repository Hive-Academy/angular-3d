# Requirements Document - TASK_2026_008

## Route-Level Scene Loading Coordinator

### Introduction

This document defines the requirements for implementing a Route-Level Scene Loading Coordinator for the `@hive-academy/angular-3d` library. The coordinator addresses a critical user experience gap where users experience a 2-4 second empty black screen during WebGPU context initialization and shader compilation - before the existing `AssetPreloaderService` tracking begins.

**Business Context**: Users currently experience a jarring "freeze" when navigating to routes containing Three.js scenes. The page shows an empty black screen with only the navigation header visible before entrance animations begin. This creates a poor first impression and undermines the value of the existing polished entrance animation system.

**Value Proposition**: Eliminate the black screen gap by providing seamless loading coordination from route transition through scene initialization, asset preloading, and entrance animations - delivering a premium visual experience that matches production-quality web applications.

---

## Problem Statement

### Current Loading Flow (Broken Experience)

```
Route Navigation -> [EMPTY BLACK SCREEN 2-4s] -> Scene Init -> Preload Overlay Shows -> Entrance -> Content
                    ^^^^^^^^^^^^^^^^^^^^^^^^^
                    THIS GAP IS UNACCEPTABLE
```

### Desired Loading Flow (Smooth Experience)

```
Route Navigation -> [LOADING UI VISIBLE] -> Scene Ready -> Asset Preload -> Entrance -> Content
                    ^^^^^^^^^^^^^^^^^^^^
                    SMOOTH LOADING INDICATOR THROUGHOUT
```

### Root Cause Analysis

1. **WebGPU Initialization is Async**: `Scene3dComponent` uses `afterNextRender()` and `await renderer.init()` for WebGPU initialization. During this period (500ms-2000ms depending on hardware), no scene content is visible.

2. **Shader Compilation Overhead**: First render triggers shader compilation, causing additional 500ms-1500ms of processing before first meaningful frame.

3. **No Route-Level Coordination**: Current `AssetPreloaderService` only tracks asset loading after the scene is already initialized. There is no mechanism to delay route activation until the scene is ready to render.

4. **Content Renders Before Scene**: DOM content (hero text, CTAs) may render before the 3D scene background, causing a visible "pop-in" effect.

---

## Requirements

### Requirement 1: Scene Ready State Detection Service

**User Story:** As a library consumer, I want to detect when a Three.js scene is fully initialized (WebGPU ready, renderer created, first frame rendered), so that I can coordinate loading UI and route transitions accordingly.

#### Acceptance Criteria

1. WHEN `Scene3dComponent` completes WebGPU renderer initialization THEN `SceneReadyService` SHALL emit a `rendererReady` signal with value `true`

2. WHEN the first frame is successfully rendered (after `renderer.render()` completes) THEN `SceneReadyService` SHALL emit a `firstFrameRendered` signal with value `true`

3. WHEN all readiness conditions are met (renderer ready + first frame rendered) THEN `SceneReadyService` SHALL emit an `isSceneReady` computed signal with value `true`

4. WHEN the scene component is destroyed before initialization completes THEN `SceneReadyService` SHALL clean up all pending state and emit appropriate signals

5. WHEN accessing scene ready state from a component THEN the service SHALL be injectable at the Scene3dComponent provider level for proper scoping

6. WHEN multiple scenes exist on a page THEN each scene SHALL have its own isolated ready state

---

### Requirement 2: Unified Loading State Coordinator

**User Story:** As a library consumer, I want a unified loading state that combines scene initialization, asset preloading, and entrance readiness, so that I can show appropriate loading UI throughout the entire loading sequence.

#### Acceptance Criteria

1. WHEN creating a unified loading state THEN `UnifiedLoadingCoordinator` SHALL accept configuration for scene ready signals, optional preload state, and optional entrance dependency

2. WHEN scene is not ready THEN `unifiedProgress` signal SHALL reflect scene initialization phase (0-33%)

3. WHEN scene is ready but assets are loading THEN `unifiedProgress` signal SHALL reflect asset preload phase (34-66%)

4. WHEN assets are ready but entrance has not started THEN `unifiedProgress` signal SHALL reflect entrance preparation phase (67-99%)

5. WHEN all phases complete THEN `unifiedProgress` signal SHALL emit `100` and `isFullyReady` signal SHALL emit `true`

6. WHEN any phase encounters an error THEN `errors` signal SHALL contain error information and loading SHALL continue gracefully where possible

7. WHEN querying current phase THEN `currentPhase` signal SHALL return one of: `'scene-init'` | `'asset-loading'` | `'entrance-prep'` | `'ready'`

---

### Requirement 3: Route Guard for Scene Loading

**User Story:** As an Angular developer, I want a functional route guard (`CanActivateFn`) that prevents route activation until the scene is ready to render, so that users never see an empty black screen.

#### Acceptance Criteria

1. WHEN using `sceneLoadingGuard` on a route THEN route activation SHALL wait until scene ready conditions are met

2. WHEN scene readiness is determined by a resolver (data passed from parent route) THEN the guard SHALL support reading ready state from route data

3. WHEN a timeout threshold (configurable, default 10 seconds) is exceeded THEN the guard SHALL allow navigation and log a warning (fail-open for reliability)

4. WHEN the guard is waiting for scene readiness THEN it SHALL NOT block Angular's change detection or cause application freezing

5. WHEN using with lazy-loaded routes THEN the guard SHALL work correctly with `loadComponent()` route configurations

6. WHEN multiple guards are on a route THEN the scene loading guard SHALL be composable with other guards

---

### Requirement 4: Route Resolver for Scene Preloading

**User Story:** As an Angular developer, I want a functional route resolver (`ResolveFn`) that triggers scene preloading before route activation, so that assets start loading during navigation transition.

#### Acceptance Criteria

1. WHEN using `scenePreloadResolver` THEN it SHALL return a `PreloadState` that components can access via `ActivatedRoute.data`

2. WHEN configuring the resolver THEN it SHALL accept an asset list or factory function to determine assets based on route parameters

3. WHEN the resolver executes THEN asset preloading SHALL begin immediately (before component initialization)

4. WHEN the route component initializes THEN it SHALL have access to the already-in-progress preload state

5. WHEN route navigation is cancelled THEN the resolver SHALL cleanup any started preload operations

---

### Requirement 5: Loading Overlay Component

**User Story:** As a library consumer, I want a pre-built loading overlay component that displays during scene initialization, so that I have a polished solution without building custom loading UI.

#### Acceptance Criteria

1. WHEN `LoadingOverlayComponent` is used THEN it SHALL accept a `UnifiedLoadingState` or individual signals for progress, phase, and ready state

2. WHEN scene is initializing THEN the overlay SHALL display a loading indicator (spinner, progress bar, or custom content via projection)

3. WHEN progress updates THEN the overlay SHALL smoothly animate progress changes (no jumping)

4. WHEN all loading completes THEN the overlay SHALL fade out with configurable exit animation (default: 400ms fade)

5. WHEN using the overlay THEN it SHALL support full-screen mode (fixed positioning) or container mode (absolute within parent)

6. WHEN customizing appearance THEN the overlay SHALL accept CSS custom properties for colors, fonts, and transitions

7. WHEN using the overlay in SSR context THEN it SHALL render a static loading state without JavaScript-dependent animations

---

### Requirement 6: Integration with Existing Animation System

**User Story:** As a library consumer using `CinematicEntranceDirective` and `SceneRevealDirective`, I want the loading coordinator to seamlessly integrate with these existing animations, so that loading and entrance form one cohesive experience.

#### Acceptance Criteria

1. WHEN `CinematicEntranceDirective` has `preloadState` configured THEN the loading coordinator SHALL recognize this and coordinate accordingly

2. WHEN entrance animation completes THEN the unified loading state SHALL reflect `'ready'` phase

3. WHEN using `StaggerGroupService` for reveals THEN the loading overlay SHALL remain visible until stagger group reveal begins

4. WHEN entrance animations use `autoStart: true` with unified loading THEN animations SHALL wait for loading overlay exit animation to complete

5. WHEN the scene has no entrance animation configured THEN the loading coordinator SHALL still function correctly (entrance phase skipped)

---

### Requirement 7: Declarative Scene Loading Directive

**User Story:** As a library consumer, I want a declarative directive that I can apply to `Scene3dComponent` to enable loading coordination without writing service integration code, so that I can quickly add loading behavior to existing scenes.

#### Acceptance Criteria

1. WHEN applying `a3dSceneLoading` directive to `<a3d-scene-3d>` THEN scene ready detection SHALL be automatically enabled

2. WHEN configuring the directive with `[loadingConfig]` THEN it SHALL accept: assets to preload, show overlay (boolean), overlay options, timeout settings

3. WHEN the directive is active THEN it SHALL emit `(sceneReady)`, `(loadingProgress)`, and `(loadingComplete)` output events

4. WHEN using minimal configuration `<a3d-scene-3d a3dSceneLoading>` THEN it SHALL provide scene ready detection with default settings

5. WHEN combining with `CinematicEntranceDirective` THEN the directive SHALL coordinate automatically (no double-configuration needed)

---

## Non-Functional Requirements

### Performance Requirements

- **Initialization Overhead**: Scene ready detection SHALL add less than 5ms to scene initialization time
- **Memory Usage**: Loading coordinator services SHALL use less than 100KB additional memory
- **Bundle Size**: New loading features SHALL add less than 8KB gzipped to the library bundle
- **Signal Updates**: Progress signal updates SHALL be throttled to maximum 60 updates per second

### Reliability Requirements

- **Fail-Open Behavior**: All timeouts SHALL fail-open (allow navigation) rather than fail-closed (block navigation)
- **Error Recovery**: Errors in one loading phase SHALL NOT prevent subsequent phases from executing
- **SSR Compatibility**: All components and services SHALL support Angular SSR without errors

### Accessibility Requirements

- **Screen Reader Support**: Loading overlay SHALL announce loading state changes via `aria-live` regions
- **Reduced Motion**: Loading animations SHALL respect `prefers-reduced-motion` media query
- **Focus Management**: When overlay closes, focus SHALL return to appropriate element (configurable)

### Developer Experience Requirements

- **Tree-Shakable**: All new exports SHALL be tree-shakable (no side effects on import)
- **Type Safety**: All public APIs SHALL have complete TypeScript types with JSDoc documentation
- **Error Messages**: Invalid configurations SHALL produce helpful error messages with suggested fixes

---

## Integration Points

### With Existing TASK_2026_006 Services

| Existing Service             | Integration Approach                                       |
| ---------------------------- | ---------------------------------------------------------- |
| `AssetPreloaderService`      | Unified coordinator accepts `PreloadState` from preloader  |
| `CinematicEntranceDirective` | Coordinator observes entrance config and completion events |
| `SceneRevealDirective`       | Overlay remains until stagger reveal begins                |
| `StaggerGroupService`        | Coordinator can query group registration status            |

### With Angular Router

| Angular Feature       | Integration Approach                                   |
| --------------------- | ------------------------------------------------------ |
| `CanActivateFn`       | Functional guard exported from library                 |
| `ResolveFn`           | Functional resolver exported from library              |
| `ActivatedRoute.data` | Resolver provides preload state via route data         |
| Router events         | Optional integration for navigation loading indicators |

### With Scene3dComponent

| Integration Point      | Approach                                     |
| ---------------------- | -------------------------------------------- |
| WebGPU init completion | Emit event/signal from Scene3dComponent      |
| First frame rendered   | Track via RenderLoopService callback         |
| Visibility state       | Coordinate with existing visibility observer |

---

## Out of Scope

The following items are explicitly NOT part of this task:

1. **Skeleton Screens**: Pre-rendered placeholder content mimicking final layout
2. **Progressive Loading**: Loading low-quality assets first, then high-quality
3. **Service Worker Integration**: Caching strategies for offline support
4. **Analytics Integration**: Tracking loading performance metrics
5. **A/B Testing Support**: Multiple loading UI variants
6. **Custom Loading Animations**: Complex branded loading animations (basic spinner/progress only)
7. **Multi-Scene Coordination**: Coordinating loading across multiple independent scenes on one page
8. **Network Quality Detection**: Adapting loading behavior based on connection speed

---

## Success Metrics

### Quantitative Metrics

| Metric                     | Target                        | Measurement Method              |
| -------------------------- | ----------------------------- | ------------------------------- |
| Time-to-visible-loading-UI | < 100ms from route navigation | Performance timing API          |
| Black screen duration      | 0ms (eliminated)              | Visual regression testing       |
| Bundle size increase       | < 8KB gzipped                 | Build analysis                  |
| Memory overhead            | < 100KB                       | Chrome DevTools memory profiler |

### Qualitative Metrics

| Metric                               | Target                                      | Measurement Method |
| ------------------------------------ | ------------------------------------------- | ------------------ |
| Developer adoption friction          | Minimal (< 5 lines to implement basic case) | Code review        |
| Integration with existing animations | Seamless (no visible coordination issues)   | Manual QA testing  |
| Loading experience smoothness        | Professional quality (no janky transitions) | User testing       |

---

## Technical Constraints

### Angular Version Compatibility

- Minimum Angular version: 17.0 (standalone components, signals)
- Recommended Angular version: 19.0+ (stable signals API)

### Three.js/WebGPU Considerations

- Must work with both WebGPU and WebGL fallback backends
- Must handle async `renderer.init()` correctly
- Must not interfere with existing visibility-based render loop pausing

### Browser Support

- Chrome 113+ (WebGPU support)
- Firefox 121+ (WebGPU support)
- Safari 18+ (WebGPU support)
- Fallback to WebGL for older browsers (graceful degradation)

---

## Dependencies

### Required Dependencies (Already in Project)

- `@angular/core` (signals, DI)
- `@angular/router` (guards, resolvers)
- `three` (Three.js core)
- `gsap` (animations for overlay transitions)

### No New Dependencies Required

This feature should be implementable using existing project dependencies.

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder           | Needs                                    | Success Criteria                                 |
| --------------------- | ---------------------------------------- | ------------------------------------------------ |
| **Library Consumers** | Eliminate black screen, easy integration | < 5 lines to implement, zero black screen        |
| **Demo Application**  | Showcase loading capabilities            | Polished loading experience on home page         |
| **Development Team**  | Maintainable, testable code              | Clear separation of concerns, 80%+ test coverage |

### Secondary Stakeholders

| Stakeholder                          | Needs                     | Success Criteria                             |
| ------------------------------------ | ------------------------- | -------------------------------------------- |
| **End Users**                        | Smooth loading experience | No perceived "freeze" or jarring transitions |
| **Performance-conscious Developers** | Minimal overhead          | < 8KB bundle, < 100KB memory                 |

---

## Risk Assessment

### Technical Risks

| Risk                             | Probability | Impact | Mitigation Strategy                                     |
| -------------------------------- | ----------- | ------ | ------------------------------------------------------- |
| WebGPU timing varies by hardware | High        | Medium | Use multiple readiness signals (renderer + first frame) |
| Route guard blocks too long      | Medium      | High   | Fail-open timeout with configurable threshold           |
| Signal subscription leaks        | Medium      | Medium | Comprehensive cleanup in DestroyRef handlers            |
| SSR compatibility issues         | Low         | High   | Test SSR scenarios early, use browser-only guards       |

### Implementation Risks

| Risk                                            | Probability | Impact | Mitigation Strategy                                              |
| ----------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------- |
| Integration complexity with existing animations | Medium      | Medium | Design coordinator to observe, not control, existing services    |
| Bundle size exceeds target                      | Low         | Medium | Use dynamic imports for optional features                        |
| Breaking changes to existing APIs               | Low         | High   | Additive API changes only, no modifications to existing services |

---

## Appendix: Example Usage Patterns

### Pattern A: Minimal Integration (Directive-Based)

```typescript
@Component({
  template: `
    <a3d-scene-3d a3dSceneLoading [loadingConfig]="{ showOverlay: true }">
      <!-- scene content -->
    </a3d-scene-3d>
  `,
})
export class MinimalSceneComponent {}
```

### Pattern B: Route-Level Integration

```typescript
// app.routes.ts
export const routes: Routes = [
  {
    path: 'hero',
    loadComponent: () => import('./hero.component'),
    canActivate: [sceneLoadingGuard({ timeout: 8000 })],
    resolve: {
      preloadState: scenePreloadResolver([
        { url: '/model.glb', type: 'gltf' }
      ])
    }
  }
];

// hero.component.ts
@Component({...})
export class HeroComponent {
  private route = inject(ActivatedRoute);
  preloadState = this.route.data.pipe(map(d => d['preloadState']));
}
```

### Pattern C: Full Control (Service-Based)

```typescript
@Component({...})
export class AdvancedSceneComponent {
  private coordinator = inject(UnifiedLoadingCoordinator);
  private preloader = inject(AssetPreloaderService);
  private sceneReady = inject(SceneReadyService);

  loadingState = this.coordinator.create({
    sceneReady: this.sceneReady.isSceneReady,
    preloadState: this.preloader.preload([...]),
    entranceComplete: this.entranceComplete$
  });
}
```
