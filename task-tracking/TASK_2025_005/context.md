# TASK_2025_005 - Context

## User Intent

Create an Angular wrapper component for Three.js `OrbitControls` that integrates with the new `@hive-academy/angular-3d` library, replacing the dependency on `angular-three`'s `ngt-orbit-controls`.

## Background

- The library is migrating away from `angular-three` to a custom lightweight implementation
- `OrbitControls` is a critical UI component for 3D camera manipulation
- The existing reference implementation in `temp/angular-3d/components/orbit-controls.component.ts` uses angular-three patterns
- The new implementation must use `SceneService` for camera/domElement access and `RenderLoopService` for per-frame updates

## Key Constraints

- No dependency on `angular-three`, `angular-three-soba`, or `angular-three-postprocessing`
- Must expose `OrbitControls` instance in a typed way (output/signal/token)
- Must work with `ScrollZoomCoordinatorDirective` without DOM querying
- Angular best practices: signals, OnPush, no CUSTOM_ELEMENTS_SCHEMA

## Conversation Reference

- Previous task: TASK_2025_004 (Loader Utilities) - COMPLETE
- Similar patterns: SceneService, RenderLoopService integration
