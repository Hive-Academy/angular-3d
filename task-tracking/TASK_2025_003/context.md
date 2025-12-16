# TASK_2025_003 Context

## User Intent

Implement the State Store & Context Service module for `@hive-academy/angular-3d` library.

## Task Origin

- **Source**: Task registry from workspace setup (TASK_2025_001)
- **Created**: 2025-12-16
- **Predecessor**: TASK_2025_002 (Core Infrastructure - Canvas & Render Loop) - COMPLETE

## Scope

Replace `injectStore` from angular-three with a native Angular solution providing:

- Typed store/service accessible from injection context
- Access to camera, renderer, scene objects
- Optional injection pattern support
- Integration with existing `SceneService`

## Key References

- Requirements: `docs/angular-3d-library/05-angular-3d-package-requirements.md` (Section C)
- Reference impl: `temp/angular-3d/services/angular-3d-state.store.ts`
- Existing: `libs/angular-3d/src/lib/canvas/scene.service.ts`

## Critical Constraints

- No dependency on `angular-three`
- Signal-based state management
- OnPush change detection compatible
- Type-safe (no `any`)
