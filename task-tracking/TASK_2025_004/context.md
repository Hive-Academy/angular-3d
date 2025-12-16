# TASK_2025_004 Context

## User Intent

Implement the Loader Utilities module for `@hive-academy/angular-3d` library.

## Task Origin

- **Source**: Task registry from workspace setup (TASK_2025_001)
- **Created**: 2025-12-16
- **Predecessors**: TASK_2025_002 (Canvas), TASK_2025_003 (Store) - COMPLETE

## Scope

Replace `injectLoader` and `injectGLTF` from angular-three with native Angular solutions providing:

- Texture loading via `THREE.TextureLoader`
- GLTF loading via `GLTFLoader` from three-stdlib with caching by URL
- Cancellation/stale-request protection when input URLs change
- Signal-based reactive API

## Key References

- Requirements: `docs/angular-3d-library/05-angular-3d-package-requirements.md` (Section D)
- Reference impl: `temp/angular-3d/components/primitives/gltf-model.component.ts`
- Reference impl: `temp/angular-3d/components/primitives/planet.component.ts`
- Existing placeholder: `libs/angular-3d/src/lib/loaders/index.ts`

## Critical Constraints

- No dependency on `angular-three` or `angular-three-soba`
- Signal-based state management
- OnPush change detection compatible
- Type-safe (no `any`)
- Automatic cleanup on DestroyRef
