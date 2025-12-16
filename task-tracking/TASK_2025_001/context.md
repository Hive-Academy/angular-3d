# TASK_2025_001: Workspace Setup & Library Scaffolding

## User Intent

Set up the foundational infrastructure for the `@hive-academy/angular-3d` library by:

1. Installing all required Three.js dependencies
2. Generating a publishable Angular library using Nx
3. Configuring TypeScript path mappings
4. Setting up the library folder structure

## Context

- **Documentation Source**: `docs/angular-3d-library/05-angular-3d-package-requirements.md`, `06-new-workspace-blueprint.md`
- **Reference Implementation**: `temp/angular-3d/` folder contains existing components/services to be migrated
- **Strategy**: Template Migration (Option A) - no CUSTOM_ELEMENTS_SCHEMA needed

## Dependencies to Install

```json
{
  "three": ">=0.160.0",
  "@types/three": ">=0.160.0",
  "gsap": ">=3.12.0",
  "three-stdlib": ">=2.28.0",
  "maath": ">=0.10.0"
}
```

## Expected Deliverables

1. `libs/angular-3d/` folder with proper Nx library structure
2. Updated `package.json` with Three.js dependencies
3. Updated `tsconfig.base.json` with path mapping
4. Library compiles without errors

## Verification

- `npx nx build angular-3d` should succeed
- `npx nx serve angular-3d-demo` should still work

## Blockers

None - this is the first task

## Created

2025-12-16
