# Task Context - TASK_2025_036

## User Intent

Extract the glossy marble raymarching effect from volumetric-caustics-scene.component.ts into reusable angular-3d library components. Goals:

1. **Create shared marble material/shader utilities** that can be applied to all TSL textures for glossy appearance
2. **Extract reusable scene components** (volumetric fog, caustics ground, environment setup) into the library
3. **Create a composable hero-ready scene component** that can be layered with HTML content

The user likes the "magical marble" effect (Codrops-style raymarching inside a glass sphere) and wants it generalized so all TSL textures can have this glossy marble appearance.

## Reference Implementation

Source: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/volumetric-caustics-scene.component.ts`

Key techniques:

- MeshStandardNodeMaterial with LOW roughness (0.1) for glossy reflections
- Environment map setup for glossy shell appearance
- TSL raymarching with Fn() and Loop() for fake volume inside sphere
- Fresnel rim/edge glow effect
- Animated 3D noise displacement
- Volumetric fog with tinted bloom post-processing
- Caustics ground texture

## Technical Context

- Branch: feature/TASK_2025_028-webgpu-migration (current)
- Created: 2026-01-02
- Type: FEATURE (library component extraction + generalization)
- Complexity: Complex (shader architecture, multiple components, API design)

## Execution Strategy

FEATURE: PM → Architect → Team Leader → Developers → QA → Modernization
