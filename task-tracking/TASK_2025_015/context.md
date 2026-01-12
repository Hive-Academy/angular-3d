# Task Context - TASK_2025_015

## Metadata

- **Created**: 2025-12-20
- **Type**: REFACTORING (architectural)
- **Priority**: P0 (Critical - blocks TASK_2025_010)
- **Complexity**: HIGH

## User Intent

Implement **Tier 2 (Signal Store + SceneGraph)** architecture pattern for Angular Three.js integration to:

1. Eliminate excessive `effect()` usage (6 per component → 1)
2. Fix injection context errors (`NG0203`)
3. Enable clean directive-component communication
4. Centralize Three.js object management

## Background Context

### Current Problems

- 5-6 `effect()` calls per primitive component
- `effect()` injection context errors in `afterNextRender`
- Directives cannot access mesh from components
- Scattered Three.js object mutations
- Demo app not rendering 3D scenes

### Approved Solution

Based on architecture research, user approved **Tier 2: Signal Store + SceneGraph pattern**:

- `SceneGraphService` - Central registry of all Object3D
- Components register with store, use 1 effect for updates
- Directives query store by ID to get meshes
- 80% reduction in effects

## Scope

### In Scope

- Create `SceneGraphService` with object registry
- Refactor all primitive components to new pattern
- Update directives to use store pattern
- Migrate demo app scenes
- Fix all runtime errors

### Out of Scope

- Custom Angular Renderer (Tier 1)
- UI/UX visual design updates (separate task)
- New feature additions

## Dependencies

- Depends on: TASK_2025_007 (Primitives Core), TASK_2025_008 (Primitives Adv)
- Blocks: TASK_2025_010 (Demo App), TASK_2025_011 (Testing)

## Research References

- Architecture plan: `implementation_plan.md` (approved)
- angular-three patterns: [angularthree.org](https://angularthree.org)
- Reference code: `temp/angular-3d/components/primitives/`
