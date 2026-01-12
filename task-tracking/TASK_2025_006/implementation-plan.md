# Implementation Plan - TASK_2025_006

## Goal

Implement a robust, signal-based postprocessing pipeline `EffectComposerService` and `BloomEffectComponent` integrated with the core `RenderLoopService`. Refactor `Scene3dComponent` to delegate render loop management to `RenderLoopService` to enable pipeline overrides.

---

## Proposed Changes

### Core Canvas Refactor

#### [MODIFY] `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`

**Goal**: Delegate render loop to `RenderLoopService`.

**Changes**:

- Inject `RenderLoopService`.
- Remove internal `animationFrameId`, `clock`, `startRenderLoop`, `stopRenderLoop`.
- In `afterNextRender`, call `this.renderLoop.start(() => this.renderer.render(this.scene, this.camera))`.
- Update `registerUpdateCallback` to delegate to `renderLoop.registerUpdateCallback`.
- In `dispose`, call `renderLoop.stop()`.

**Pattern Reference**:

- `RenderLoopService` usage in `orbit-controls.component.ts` (already injecting it).

---

### Postprocessing Module

#### [CREATE] `libs/angular-3d/src/lib/postprocessing/effect-composer.service.ts`

**Purpose**: Manage `EffectComposer` and render passes.

**Features**:

- Manages `EffectComposer` instance from `three-stdlib`.
- `init(renderer, scene, camera)`: Initializes composer and default `RenderPass`.
- `addPass(pass, order)`: Adds a custom pass (e.g., Bloom).
- `removePass(pass)`: Removes a pass.
- `enable()`: Switches `RenderLoopService.renderFn` to `composer.render()`.
- `disable()`: Reverts `RenderLoopService.renderFn` to default.
- Handles resizing via `setSize`.

#### [CREATE] `libs/angular-3d/src/lib/postprocessing/effect-composer.component.ts`

**Purpose**: Declarative container for postprocessing.

**Selector**: `a3d-effect-composer`
**Inputs**: `enabled` (boolean, default true).
**Logic**:

- Injects `EffectComposerService` and `SceneService`.
- In `constructor`, effects `sceneService.renderer/scene/camera` to call `composerService.init`.
- Synchronizes `enabled` signal with service.
- Renders `<ng-content />` for pass components.

---

### Bloom Effect

#### [CREATE] `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts`

**Purpose**: Declarative Bloom effect.

**Selector**: `a3d-bloom-effect`
**Inputs**:

- `components`: `threshold` (number), `strength` (number), `radius` (number).
  **Logic**:
- Creates `UnrealBloomPass` from `three-stdlib`.
- Registers pass with `EffectComposerService`.
- Updates pass properties on input change (using `effect()`).
- Removes pass on destroy.

---

### Module Exports

#### [CREATE] `libs/angular-3d/src/lib/postprocessing/index.ts`

- Export services and components.

#### [MODIFY] `libs/angular-3d/src/index.ts`

- Export `postprocessing` module.

---

## Verification Plan

### Automated Tests

1.  **Scene3dComponent Tests**:

    - Verify `RenderLoopService.start` is called.
    - Verify `renderer.render` is called via the callback.

2.  **EffectComposerService Tests**:

    - Mock `three-stdlib` (`EffectComposer`, `RenderPass`).
    - Test `addPass`, `removePass`.
    - Verify interaction with `RenderLoopService` (swapping render function).

3.  **BloomEffectComponent Tests**:
    - Verify `UnrealBloomPass` creation.
    - Verify registration with service.

### Commands

```bash
# Run new tests
npx nx test angular-3d --testPathPattern=postprocessing --skip-nx-cache

# Run scene tests (regression)
npx nx test angular-3d --testPathPattern=scene-3d --skip-nx-cache
```

### Manual Verification

- Update `apps/angular-3d-demo` to include `<a3d-bloom-effect>` in a scene.
- Verify bloom visual effect.
- Verify toggling `enabled` works.
- Verify resizing updates composer.

---

## Team-Leader Handoff

**Developer Type**: frontend-developer
**Complexity**: High (Core Refactor involves risk)
**Estimated Tasks**: 4-5 atomic tasks
**Batch Strategy**:

- **Batch 1**: Scene3d Refactor (Critical Path).
- **Batch 2**: Postprocessing Infrastructure (`EffectComposerService`, `Component`).
- **Batch 3**: Bloom Implementation.
