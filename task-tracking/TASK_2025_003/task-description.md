# Requirements Document - TASK_2025_003

## Introduction

This task implements the **State Store & Context Service** module for `@hive-academy/angular-3d`, providing a typed store/service accessible from injection context that replaces `injectStore` from angular-three. This is a foundational dependency for subsequent tasks (controls, loaders, primitives) that need scene/camera/renderer access.

## Task Classification

- **Type**: FEATURE (new capability)
- **Priority**: P1-High (blocks TASK_2025_004, TASK_2025_005)
- **Complexity**: Medium
- **Estimated Effort**: 4-6 hours

## Workflow Dependencies

- **Research Needed**: No (patterns established in reference implementation)
- **UI/UX Design Needed**: No (service layer, no UI)

## Requirements

### Requirement 1: Context Service Enhancement

**User Story**: As a component developer using angular-3d, I want to inject a service that provides typed access to scene, camera, and renderer objects, so that I can create components that interact with the 3D context without prop drilling.

#### Acceptance Criteria

1. WHEN a component injects `SceneService` THEN `scene()`, `camera()`, `renderer()` signals SHALL return the current Three.js objects
2. WHEN `SceneService` is used with `{ optional: true }` pattern THEN injection SHALL succeed even outside Scene3dComponent context
3. WHEN renderer is available THEN `domElement` getter SHALL return the canvas element for controls integration
4. WHEN scene objects change THEN signal consumers SHALL receive updates automatically

### Requirement 2: Application State Store

**User Story**: As an application developer, I want a centralized state store managing multiple scenes, cameras, lights, materials, and animations, so that I can build complex 3D applications with organized state management.

#### Acceptance Criteria

1. WHEN `Angular3DStateStore` is injected THEN it SHALL be available as a root-level singleton
2. WHEN a scene is created via `createScene()` THEN it SHALL be tracked in `state().scenes`
3. WHEN `setActiveScene(id)` is called THEN `activeScene()` computed signal SHALL return that scene
4. WHEN `updateCamera()` is called THEN `state().camera` SHALL reflect new camera configuration
5. WHEN scene objects are added/removed THEN `sceneObjects()` computed signal SHALL update automatically

### Requirement 3: Performance Monitoring Integration

**User Story**: As a developer debugging 3D performance, I want access to FPS, frame time, and memory metrics, so that I can identify and fix performance issues.

#### Acceptance Criteria

1. WHEN `performance()` signal is accessed THEN it SHALL return current FPS, frameTime, memoryUsage metrics
2. WHEN frame rate drops below 30fps THEN `performanceStatus().isHealthy` SHALL return `false`
3. WHEN performance monitoring runs THEN it SHALL NOT impact application FPS by more than 1%

### Requirement 4: Component Registry & Event Bus

**User Story**: As a complex application developer, I want to register components and communicate between them via events, so that I can coordinate scene graph changes across the application.

#### Acceptance Criteria

1. WHEN `registerComponent()` is called THEN component SHALL appear in `activeComponents()` signal
2. WHEN `unregisterComponent()` is called THEN component SHALL be removed and `node-removed` event emitted
3. WHEN `emitEvent()` is called THEN subscribers to `events$` observable SHALL receive the event
4. WHEN `sendMessage()` is called THEN target component's message stream SHALL receive the message

## Non-Functional Requirements

### Performance

- Response Time: Signal reads <1ms
- Memory Usage: State store overhead <1MB
- CPU Impact: <1% for performance monitoring

### Compatibility

- OnPush change detection compatible
- Tree-shakeable exports
- No runtime dependency on angular-three

### Type Safety

- No `any` types in public API
- Full TypeScript strict mode compliance
- Exported interfaces for all state types

### Testing

- Unit test coverage >80% for public methods
- Jest test framework (per workspace config)

## Stakeholder Analysis

- **End Users**: Angular developers building 3D applications
- **Business Owners**: Library maintainability, clean API
- **Development Team**: Integration with existing canvas/render-loop

## Risk Analysis

### Technical Risks

**Risk 1**: Signal reactivity performance with large state trees

- Probability: Low
- Impact: Medium
- Mitigation: Use computed() selectively, avoid deep nesting
- Contingency: Memoize selectors if needed

**Risk 2**: Memory leaks from unregistered components

- Probability: Medium
- Impact: High
- Mitigation: Automatic cleanup via DestroyRef
- Contingency: Add explicit cleanup() method

**Risk 3**: Optional injection pattern complexity

- Probability: Low
- Impact: Low
- Mitigation: Use Angular's built-in optional injection
- Contingency: Create factory function wrapper

## Dependencies

- **Technical**: Three.js, Angular signals, RxJS (for event streams)
- **Internal**: Existing `SceneService` in canvas module
- **External**: None

## Success Metrics

- All acceptance criteria pass
- Unit tests achieve >80% coverage
- Library builds without errors
- Demo app can access scene context from nested components
- No angular-three imports in library code

## Out of Scope

- UI components (future tasks)
- Animation service implementation (future task)
- OrbitControls integration (TASK_2025_005)
- Multi-renderer support
