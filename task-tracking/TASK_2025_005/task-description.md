# Requirements Document - TASK_2025_005

## Introduction

This task implements the **OrbitControls Wrapper Component** for the `@hive-academy/angular-3d` library. OrbitControls enables users to rotate, zoom, and pan the camera around a target point in 3D space - a fundamental feature for interactive 3D scenes.

The component replaces `angular-three`'s `ngt-orbit-controls` with a typed, standalone Angular component that:

- Creates and manages `OrbitControls(camera, domElement)` directly
- Exposes the `OrbitControls` instance via typed output/signal for consumer access
- Eliminates DOM querying patterns used by `ScrollZoomCoordinatorDirective`

## Task Classification

- **Type**: FEATURE
- **Priority**: P1-High (Required for scene interactivity)
- **Complexity**: Medium
- **Estimated Effort**: 4-6 hours

## Workflow Dependencies

- **Research Needed**: No (Three.js OrbitControls is well-documented; reference implementation exists)
- **UI/UX Design Needed**: No (Transparent infrastructure component)

---

## Requirements

### Requirement 1: OrbitControls Component

**User Story**: As a scene developer using `@hive-academy/angular-3d`, I want an Angular component that creates and manages OrbitControls, so that users can interactively rotate, zoom, and pan the camera around my 3D scene.

#### Acceptance Criteria

1. WHEN `<a3d-orbit-controls />` is added to a scene THEN the component SHALL create an `OrbitControls` instance using camera and domElement from `SceneService`

2. WHEN damping is enabled (`enableDamping=true`) THEN the component SHALL call `controls.update()` in the render loop via `RenderLoopService.registerUpdateCallback()`

3. WHEN the component is destroyed THEN the controls SHALL be properly disposed and the render loop callback SHALL be unregistered

4. WHEN configuration inputs change (target, zoom limits, rotation constraints) THEN the OrbitControls SHALL update reactively via `effect()`

---

### Requirement 2: Typed Instance Exposure

**User Story**: As a directive author (e.g., ScrollZoomCoordinator), I want typed access to the OrbitControls instance without DOM querying, so that I can coordinate behavior without fragile element queries.

#### Acceptance Criteria

1. WHEN the OrbitControls is initialized THEN the component SHALL emit a `controlsReady` output with the typed `OrbitControls` instance

2. WHEN the camera distance changes THEN the component SHALL emit a `controlsChange` output with `{ distance: number, controls: OrbitControls }`

3. WHEN consumers access controls via output/signal THEN TypeScript SHALL provide full `OrbitControls` type inference

---

### Requirement 3: Configuration Inputs

**User Story**: As a scene developer, I want configurable OrbitControls behavior via Angular inputs, so that I can customize camera interaction without writing imperative code.

#### Acceptance Criteria

1. WHEN I set `[target]="[0, 0, 0]"` THEN the OrbitControls target SHALL be configured to that Vector3

2. WHEN I set `[minDistance]="5"` and `[maxDistance]="30"` THEN zoom limits SHALL be enforced

3. WHEN I set `[enableDamping]="true"` and `[dampingFactor]="0.05"` THEN smooth inertial motion SHALL be applied

4. WHEN I set `[enablePan]="false"` THEN right-click panning SHALL be disabled

5. WHEN I set polar angle constraints THEN vertical rotation limits SHALL be enforced

The component SHALL support these inputs (matching three-stdlib OrbitControls API):

- `target: [number, number, number]` (default: `[0, 0, 0]`)
- `enableDamping: boolean` (default: `true`)
- `dampingFactor: number` (default: `0.05`)
- `autoRotate: boolean` (default: `false`)
- `autoRotateSpeed: number` (default: `2.0`)
- `enableZoom: boolean` (default: `true`)
- `minDistance: number` (default: `5`)
- `maxDistance: number` (default: `30`)
- `zoomSpeed: number` (default: `1.0`)
- `enablePan: boolean` (default: `false`)
- `panSpeed: number` (default: `1.0`)
- `enableRotate: boolean` (default: `true`)
- `rotateSpeed: number` (default: `1.0`)
- `minPolarAngle: number` (default: `0`)
- `maxPolarAngle: number` (default: `Math.PI`)
- `minAzimuthAngle: number` (default: `-Infinity`)
- `maxAzimuthAngle: number` (default: `Infinity`)

---

## Non-Functional Requirements

### Performance

- Frame Impact: OrbitControls update SHALL add <0.1ms per frame
- Memory: Control disposal SHALL prevent memory leaks
- Zone Optimization: Render loop updates SHALL run outside Angular zone

### Reliability

- Graceful Degradation: Component SHALL handle missing SceneService (log warning, disable)
- Lifecycle Safety: Controls SHALL not be accessed before scene initialization

### Compatibility

- Three.js Version: SHALL work with `three@^0.182.0` and `three-stdlib@^2.36.1`
- Angular Version: SHALL work with Angular 20.3+

---

## Stakeholder Analysis

- **Scene Developers**: Need intuitive camera controls API
- **Directive Authors**: Need typed instance access (ScrollZoomCoordinator)
- **Demo Application**: Needs functional camera interaction for scene graphs

---

## Risk Analysis

### Technical Risks

**Risk 1**: SceneService not available when OrbitControls initializes

- Probability: Medium (component added before scene initialization)
- Impact: Medium (controls don't work)
- Mitigation: Use `effect()` to wait for camera/domElement availability
- Contingency: Log warning if resources unavailable after timeout

**Risk 2**: Multiple OrbitControls in same scene

- Probability: Low
- Impact: Low (only first controls will work, expected Three.js behavior)
- Mitigation: Document single-controls-per-scene limitation

---

## Dependencies

- **Technical**:
  - `three-stdlib` (OrbitControls)
  - `SceneService` (camera, domElement access)
  - `RenderLoopService` (per-frame update registration)
- **Prior Tasks**:
  - TASK_2025_002 (Canvas & Render Loop) ✅
  - TASK_2025_003 (State Store & Context Service) ✅

---

## Success Metrics

1. All unit tests pass for OrbitControls component
2. Lint and build pass without errors
3. OrbitControls works in demo application (camera rotation/zoom functional)
4. ScrollZoomCoordinatorDirective can access controls without DOM querying
5. No `CUSTOM_ELEMENTS_SCHEMA` required

---

## Deliverables Checklist

- [ ] `libs/angular-3d/src/lib/controls/orbit-controls.component.ts`
- [ ] `libs/angular-3d/src/lib/controls/orbit-controls.component.spec.ts`
- [ ] `libs/angular-3d/src/lib/controls/index.ts` (update exports)
- [ ] Library exports updated in `src/index.ts`
