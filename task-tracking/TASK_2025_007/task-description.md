# Requirements Document - TASK_2025_007

## Introduction

The goal of this task is to implement the **Core Primitive Components** for the `@hive-academy/angular-3d` library. These components are the building blocks for 3D scenes and must replace the dependency on `angular-three`'s `ngt-*` custom elements. These components will provide typesafe, signal-based Angular wrappers around Three.js primitives (meshes, lights, fog).

## Task Classification

- **Type**: FEATURE (New functionality / Porting)
- **Priority**: P1-High (Required for migration)
- **Complexity**: Medium
- **Estimated Effort**: 4-6 hours

## Workflow Dependencies

- **Research Needed**: No (Patterns established in `temp/` and docs)
- **UI/UX Design Needed**: No
- **Prerequisites**: `TASK_2025_002` (Canvas/Loop), `TASK_2025_004` (Loaders - if textures needed, but core prims usually don't depend on complex loaders yet).

## Requirements

### Requirement 1: Geometric Primitives

**User Story**: As a developer, I want to use declarative Angular components for basic shapes (Box, Cylinder, Torus, Polyhedron) so that I can construct 3D scenes easily.

#### Acceptance Criteria

1.  **Components**: Implement `BoxComponent`, `CylinderComponent`, `TorusComponent`, `PolyhedronComponent`.
2.  **Implementation Details**:
    - MUST use `ChangeDetectionStrategy.OnPush`.
    - MUST use Signal inputs for properties (`position`, `rotation`, `scale`, `color`, `args`).
    - MUST create Three.js meshes directly in `ngAfterViewInit` (or `effect`) and add to scene.
    - MUST properly dispose of `geometry` and `material` on destroy.
3.  **Validation**:
    - Unit tests explicitly verifying mesh creation and disposal.
    - Visual verification in Demo App (later task, but components must be runnable).

### Requirement 2: Core Lighting

**User Story**: As a developer, I want components to add standard lights to my scene.

#### Acceptance Criteria

1.  **Components**: Implement `AmbientLightComponent`, `DirectionalLightComponent`, `PointLightComponent`, `SpotLightComponent`.
2.  **SceneLighting Wrapper**: Implement `SceneLightingComponent` that uses the above atomic components (or manages them internally) to support the existing configuration API/presets pattern found in `temp/scene-lighting.component.ts`.
    - _Note_: The `temp` component is a composite. We should probably keep that abstraction for high-level use, but build it on top of atomic inputs or atomic components.
    - _Decision_: Implement the atomic light components first. Then, if time permits or as a separate requirement, implement the composite `SceneLightingComponent`. For _Core Primitives_, the atomic lights are the requirement.
3.  **Functionality**:
    - Support `intensity`, `color`, `position` inputs.
    - Support `castShadow` for applicable lights.
    - Auto-add to scene on init, remove on destroy.

### Requirement 3: Fog

**User Story**: As a developer, I want to add fog to my scene to create depth.

#### Acceptance Criteria

1.  **Component**: Implement `FogComponent`.
2.  **Functionality**:
    - Attach `THREE.Fog` or `THREE.FogExp2` to the `scene.fog` property.
    - Inputs: `color`, `near`, `far` (or `density`).
    - Cleanup: Remove fog from scene on destroy.

### Requirement 4: Grouping

**User Story**: As a developer, I want to group components to transform them together.

#### Acceptance Criteria

1.  **Component**: Implement `GroupComponent`.
2.  **Functionality**:
    - Wraps `THREE.Group`.
    - Allows content projection (rendering children).
    - Handles parent-child relationship for nested components (children add themselves to this group, not the scene).
    - _Technical Detail_: This might require a `ParentToken` or DI mechanism so children know where to add themselves.

## Non-Functional Requirements

### Performance

- **OnPush**: All components must use OnPush.
- **Disposal**: strict checks for memory leaks (calling `.dispose()` on geometries/materials).
- **Reactivity**: Updates to inputs (e.g., position signal) should update the Three.js object efficiently.

### Standards

- **Signals**: Use `input()`, `viewChild()`.
- **No NGT**: No dependencies on `angular-three` classes.

## Stakeholder Analysis

- **Developers**: Need clear, typed API.
- **End Users**: Need performant 3D rendering.

## Risk Analysis

### Technical Risks

- **Risk 1**: Hierarchy/Parenting.
  - _Challenge_: `angular-three` handles parenting via `NgtCanvas` providing a "Scene or Group" injector.
  - _Mitigation_: We need a standard DI token (e.g., `OBJECT_3D_PARENT`) that `Scene3D` (root) and `GroupComponent` (node) both provide.
  - _Action_: The `Canvas` task (`TASK_2025_002`) should have established the root. `GroupComponent` must adhere to this.
  - _Constraint_: If `TASK_2025_002` didn't provide this, this task must implement the `OBJECT_3D_PARENT` token infrastructure.

## Success Metrics

- Components build without `angular-three` imports.
- Tests pass with 100% coverage for creation/disposal logic.
