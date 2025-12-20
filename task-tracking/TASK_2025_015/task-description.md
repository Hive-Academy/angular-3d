# Requirements Document - TASK_2025_015

## Introduction

The `@hive-academy/angular-3d` library currently suffers from architectural issues that prevent proper 3D scene rendering in the demo application. The core problems stem from excessive `effect()` usage in components, injection context errors, and broken directive-component communication.

This task implements **Tier 2: Signal Store + Directive-First Pattern** - an architectural refactoring that:

- Centralizes Three.js object management in a signal-based store
- Moves Three.js object creation from components to directives
- Reduces `effect()` calls by ~80%
- Enables type-safe directive-component communication

**Business Value**: Unblocks TASK_2025_010 (Demo App) and creates a maintainable foundation for the library.

---

## Task Classification

- **Type**: REFACTORING (architectural)
- **Priority**: P0-Critical (blocks demo app and downstream tasks)
- **Complexity**: Complex (affects 18 components, 2 directives, 7 services)
- **Estimated Effort**: 16-24 hours (2-3 days)

## Workflow Dependencies

- **Research Needed**: No (architecture already designed and approved)
- **UI/UX Design Needed**: No (internal refactoring only)

---

## Requirements

### Requirement 1: SceneGraphStore Implementation

**User Story**: As a library developer, I want a centralized signal store for all Three.js objects, so that components and directives can access 3D objects without lifecycle timing issues.

#### Acceptance Criteria

1. WHEN `SceneGraphStore` is injected THEN it SHALL provide signal-based state for scene, camera, renderer, and object registry
2. WHEN `register(id, object, type)` is called THEN the object SHALL be added to the scene and indexed in the registry
3. WHEN `update(id, props)` is called THEN the Three.js object properties SHALL be updated directly (position, rotation, scale, material)
4. WHEN `remove(id)` is called THEN the object SHALL be disposed, removed from parent, and deleted from registry
5. WHEN `getObject<T>(id)` is called THEN it SHALL return the typed Object3D or null if not found
6. WHEN `queryByType(type)` is called THEN it SHALL return all registered objects of that type

### Requirement 2: Directive-First Object Creation

**User Story**: As a library developer, I want Three.js object creation handled by directives (not components), so that components remain pure Angular without Three.js dependencies.

#### Acceptance Criteria

1. WHEN `MeshDirective` is applied THEN it SHALL create THREE.Mesh and register with store
2. WHEN geometry directives (`BoxGeometryDirective`, `SphereGeometryDirective`, etc.) are applied THEN they SHALL provide geometry to parent MeshDirective via DI token
3. WHEN material directives (`StandardMaterialDirective`, etc.) are applied THEN they SHALL provide material to parent MeshDirective via DI token
4. WHEN `TransformDirective` is applied THEN it SHALL sync position/rotation/scale inputs to the mesh
5. WHEN component is destroyed THEN host directives SHALL automatically clean up via DestroyRef

### Requirement 3: Component Refactoring

**User Story**: As a library developer, I want components to use `hostDirectives` composition instead of directly creating Three.js objects, so that testing is simplified and concerns are separated.

#### Acceptance Criteria

1. WHEN `BoxComponent` is rendered THEN it SHALL use hostDirectives: [MeshDirective, BoxGeometryDirective, TransformDirective, StandardMaterialDirective]
2. WHEN any primitive component loads THEN it SHALL NOT import Three.js directly
3. WHEN component inputs change THEN directive effects SHALL react and update the store
4. WHEN component has ZERO lifecycle hooks (ngOnInit, ngAfterViewInit, ngOnDestroy) THEN it SHALL be considered properly refactored

### Requirement 4: Directive Communication Fix

**User Story**: As a library developer, I want animation directives (float3d, rotate3d) to access meshes via the store, so that they can animate 3D objects without timing issues.

#### Acceptance Criteria

1. WHEN `Float3dDirective` needs mesh access THEN it SHALL use computed signal from store.getObject(hostId)
2. WHEN `Rotate3dDirective` needs mesh access THEN it SHALL use computed signal from store.getObject(hostId)
3. WHEN mesh is not yet registered THEN directive effect SHALL wait until mesh signal resolves
4. WHEN animation directives run THEN NO console warnings or errors SHALL be logged

### Requirement 5: Demo Application Fixes

**User Story**: As a demo application user, I want 3D scenes to render correctly, so that I can see the library capabilities.

#### Acceptance Criteria

1. WHEN navigating to `/angular-3d` THEN all 3D scenes SHALL render without errors
2. WHEN page loads THEN NO `NG0203` injection context errors SHALL appear in console
3. WHEN animations are configured THEN float3d and rotate3d SHALL animate smoothly
4. WHEN resizing browser THEN 3D canvas SHALL resize appropriately

---

## Non-Functional Requirements

### Performance

- **Effect Reduction**: 80% fewer effect() calls (from ~108 to ~22 across all components)
- **Memory**: No memory leaks from undisposed Three.js objects
- **Frame Rate**: Maintain 60fps render loop
- **Bundle Size**: Signal store dependency (@ngrx/signals) adds ~5KB gzipped

### Reliability

- **Error Handling**: All store operations SHALL have null checks
- **Disposal**: All geometries, materials, textures SHALL be properly disposed
- **Injection Context**: All effects SHALL work within Angular's injection context

### Maintainability

- **Separation of Concerns**: Components = Pure Angular, Directives = Three.js
- **Testability**: Components testable without Three.js mocks
- **Documentation**: All public APIs SHALL have JSDoc comments

---

## Technical Scope

### Files to Create (New)

| File                                                   | Purpose                                   |
| ------------------------------------------------------ | ----------------------------------------- |
| `store/scene-graph.store.ts`                           | Central signalStore for Object3D registry |
| `tokens/object-id.token.ts`                            | InjectionToken for component ID           |
| `tokens/geometry.token.ts`                             | InjectionToken for geometry sharing       |
| `tokens/material.token.ts`                             | InjectionToken for material sharing       |
| `directives/mesh.directive.ts`                         | Creates THREE.Mesh                        |
| `directives/transform.directive.ts`                    | Syncs position/rotation/scale             |
| `directives/geometries/box-geometry.directive.ts`      | Creates BoxGeometry                       |
| `directives/geometries/sphere-geometry.directive.ts`   | Creates SphereGeometry                    |
| `directives/geometries/cylinder-geometry.directive.ts` | Creates CylinderGeometry                  |
| `directives/geometries/torus-geometry.directive.ts`    | Creates TorusGeometry                     |
| `directives/materials/standard-material.directive.ts`  | Creates MeshStandardMaterial              |

### Files to Modify (Refactor)

| File                                      | Changes                                 |
| ----------------------------------------- | --------------------------------------- |
| `primitives/box.component.ts`             | Remove Three.js, add hostDirectives     |
| `primitives/cylinder.component.ts`        | Remove Three.js, add hostDirectives     |
| `primitives/torus.component.ts`           | Remove Three.js, add hostDirectives     |
| `primitives/polyhedron.component.ts`      | Remove Three.js, add hostDirectives     |
| `primitives/group.component.ts`           | Remove Three.js, add hostDirectives     |
| `primitives/lights/*.component.ts`        | Refactor to use store pattern (5 files) |
| `primitives/gltf-model.component.ts`      | Refactor to use store pattern           |
| `primitives/star-field.component.ts`      | Refactor to use store pattern           |
| `primitives/nebula.component.ts`          | Refactor to use store pattern           |
| `primitives/planet.component.ts`          | Refactor to use store pattern           |
| `primitives/particle-system.component.ts` | Refactor to use store pattern           |
| `primitives/text-3d.component.ts`         | Refactor to use store pattern           |
| `primitives/svg-icon.component.ts`        | Refactor to use store pattern           |
| `primitives/fog.component.ts`             | Refactor to use store pattern           |
| `directives/float-3d.directive.ts`        | Use computed + store pattern            |
| `directives/rotate-3d.directive.ts`       | Use computed + store pattern            |

### Files to Keep (Unchanged)

| File                                 | Reason                                       |
| ------------------------------------ | -------------------------------------------- |
| `canvas/scene-3d.component.ts`       | Already manages scene, will provide to store |
| `render-loop/render-loop.service.ts` | Animation loop unchanged                     |
| `render-loop/animation.service.ts`   | GSAP integration unchanged                   |

---

## Risk Analysis

### Technical Risks

**Risk 1**: Host directives composition complexity

- Probability: Medium
- Impact: High
- Mitigation: Start with BoxComponent as proof-of-concept before full migration
- Contingency: Fall back to Option D (constructor-based) if hostDirectives prove problematic

**Risk 2**: @ngrx/signals dependency

- Probability: Low
- Impact: Medium
- Mitigation: Can implement custom signalStore if dependency unacceptable
- Contingency: Use plain @Injectable service with signals

**Risk 3**: Breaking changes to component API

- Probability: Low
- Impact: Low
- Mitigation: Keep same input() signatures, only internals change
- Contingency: N/A - public API unchanged

---

## Dependencies

### Technical

- `@ngrx/signals` - Signal store implementation (optional, can use custom)
- `three` - Three.js library (existing)
- `gsap` - Animation library (existing)

### Tasks

- **Blocked by**: None (prerequisites complete)
- **Blocks**: TASK_2025_010 (Demo App), TASK_2025_011 (Testing)

---

## Success Metrics

| Metric             | Target         | Measurement                |
| ------------------ | -------------- | -------------------------- |
| Effect reduction   | ≥80%           | Count effects before/after |
| Console errors     | 0              | Browser console check      |
| 3D scene rendering | All scenes     | Visual verification        |
| Animation working  | Float + Rotate | Browser test               |
| Unit tests passing | 100%           | `nx test angular-3d`       |
| Build passing      | No errors      | `nx build angular-3d`      |

---

## Stakeholder Analysis

- **Library Users**: Internal (demo app) - need working 3D scenes
- **Developers**: Core team - need maintainable architecture
- **Future Maintainers**: Need clean separation of concerns
