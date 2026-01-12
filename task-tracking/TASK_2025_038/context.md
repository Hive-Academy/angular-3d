# TASK_2025_038 - Angular-3D Library Structure Reorganization

## User Intent

Reorganize the angular-3d library's `directives/` and `primitives/` folders into logical subfolders to improve code organization and maintainability.

## Current State

Both folders have grown with root-level files mixed with existing subfolders, creating a flat structure that's difficult to navigate.

**Directives folder** has:

- 11 root-level directive files
- 3 existing subfolders (geometries, materials, lights)

**Primitives folder** has:

- 25 root-level component files
- 4 existing subfolders (lights, text, shaders)

## Desired Outcome

Organized folder structure with logical grouping:

**Directives**:

- `core/` - mesh, group, transform
- `animation/` - float-3d, rotate-3d, space-flight-3d
- `interaction/` - mouse-tracking-3d, scroll-zoom-coordinator, performance-3d
- `effects/` - glow-3d
- Existing: geometries, materials, lights (light.directive.ts moved to lights/)

**Primitives**:

- `geometry/` - box, sphere, cylinder, torus, polyhedron, floating-sphere
- `particles/` - particle-system, marble-particle-system, gpu-particle-sphere, sparkle-corona
- `space/` - planet, star-field, nebula, nebula-volumetric, cloud-layer
- `effects/` - metaball, marble-sphere, background-cubes
- `scene/` - group, fog, environment, background-cube, instanced-mesh
- `loaders/` - gltf-model, svg-icon
- Existing: lights, text, shaders

## Constraints

- Use `git mv` to preserve file history
- Update ALL import paths (library + demo app)
- Use absolute Windows paths for all operations
- Verify library builds after changes
- Keep .spec.ts files alongside components

## Task Type

REFACTORING - Code organization, no logic changes
