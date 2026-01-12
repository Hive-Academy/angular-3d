# Task Context - TASK_2025_017

## User Intent

Implement missing Angular-3D components and fix postprocessing/soba integrations. Tasks include:

1. Migrate missing components from temp/angular-3d (background-cubes, smoke-particle-text, glow-particle-text, floating-sphere, nebula-volumetric, instanced-particle-text)
2. Migrate missing directives (glow-3d, space-flight-3d, performance-3d, scroll-zoom-coordinator)
3. Migrate missing services (advanced-performance-optimizer, space-theme.store)
4. Fix postprocessing integration (bloom-effect, effect-composer)
5. Fix GLTF model loading issues
6. Ensure all Three.js components work correctly with the new per-scene SceneGraphStore and RenderLoopService architecture

## Conversation Summary

Prior to this task (TASK_2025_015 Architecture Migration):

- Fixed critical singleton issue: SceneGraphStore and RenderLoopService were `providedIn: 'root'`, causing multiple scenes to share state
- Changed both services to component-scoped (provided per Scene3dComponent)
- This fixed the issue where meshes were being added to wrong scenes
- StarFieldComponent enhanced with enableTwinkle, stellarColors, multiSize features
- Fixed star rendering issue (sizes were too large, now properly scaled)
- GLTF model component was commented out during debugging - needs fixing
- Scene is now rendering polyhedrons correctly but stars appear as squares (fixed in star-field)

Key architectural decisions:

- Per-scene isolation via component-level DI providers
- hostDirectives pattern for mesh-based primitives
- Signal-based reactivity throughout

## Technical Context

- Branch: feature/TASK_2025_017-angular3d-completion
- Created: 2025-12-21
- Type: FEATURE
- Complexity: Complex (multiple components, architecture alignment, postprocessing)

## Missing Components Analysis

### From temp/angular-3d (NOT in library):

**Components:**

- `background-cubes.component.ts` / `background-cube.component.ts`
- `smoke-particle-text.component.ts`
- `glow-particle-text.component.ts`
- `floating-sphere.component.ts`
- `nebula-volumetric.component.ts`
- `instanced-particle-text.component.ts`

**Directives:**

- `glow-3d.directive.ts`
- `space-flight-3d.directive.ts`
- `performance-3d.directive.ts`
- `scroll-zoom-coordinator.directive.ts`

**Services:**

- `advanced-performance-optimizer.service.ts`
- `space-theme.store.ts`

### Existing but needs fixing:

- `postprocessing/effect-composer.component.ts`
- `postprocessing/effects/bloom-effect.component.ts`
- `primitives/gltf-model.component.ts`

## Execution Strategy

FEATURE workflow:

1. project-manager → requirements
2. researcher-expert → analyze temp components and postprocessing patterns
3. software-architect → implementation plan
4. team-leader → task decomposition and development coordination
5. QA review
6. modernization-detector → future enhancements
