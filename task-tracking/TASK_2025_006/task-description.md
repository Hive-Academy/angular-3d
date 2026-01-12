# TASK_2025_006: Postprocessing Pipeline

## 🎯 Objective

Implement a robust, signal-based postprocessing pipeline for `@hive-academy/angular-3d`, enabling cinematic effects (Bloom, Glitch, etc.) without external `angular-three` dependencies. Architecture must integrate with the unified `RenderLoopService`.

## 📋 Context

- **Current State**: `Scene3dComponent` manages its own render loop, disconnecting it from `RenderLoopService`. Effects in `temp/` use `angular-three-postprocessing`.
- **Target State**: `Scene3dComponent` delegates loop to `RenderLoopService`. `PostProcessingService` manages `EffectComposer` and overrides the render function when active.
- **Dependencies**: `three`, `three-stdlib`.

## ✅ Requirements

### 1. Core Infrastructure Refactor

- **Refactor `Scene3dComponent`**:
  - Remove internal `requestAnimationFrame` loop.
  - Inject `RenderLoopService`.
  - Set default render function: `renderer.render(scene, camera)`.
  - Start/Stop loop via service.

### 2. PostProcessing Architecture

- **Create `EffectComposerService`**:
  - Manage `EffectComposer` instance.
  - Provide `addPass(pass, order)`, `removePass(pass)` methods.
  - Handle resizing (connect to `Scene3dComponent` resize observable or service).
  - when enabled, override `RenderLoopService` render function with `composer.render()`.
- **Create `EffectComposerComponent`** (Declarative Container):
  - Selector: `a3d-effect-composer`.
  - Inputs: `enabled` (boolean).
  - Content projection for effect passes.

### 3. Bloom Effect

- **Create `BloomEffectComponent`**:
  - Selector: `a3d-bloom-effect`.
  - Wrapper for `UnrealBloomPass` from `three-stdlib`.
  - Inputs: `threshold`, `strength`, `radius`.
  - Must register itself with `EffectComposerService`.

### 4. Quality & Performance

- **Zone Agnostic**: All rendering and pass updates must run outside Angular zone.
- **Reactivity**: Inputs must be signal-based (update pass properties on change).
- **Cleanup**: Auto-dispose passes and composer on destroy.
- **Typed**: strict TypeScript typing for all passes.

## ⛔ Constraints

- No `angular-three` dependencies.
- No `CUSTOM_ELEMENTS_SCHEMA`; use native components.
- Must use `three-stdlib` for passes.

## 📅 Deliverables

- `RenderLoopService` integration in `Scene3dComponent`.
- `EffectComposerService` & `EffectComposerComponent`.
- `BloomEffectComponent`.
- Unit tests for all services and components.
