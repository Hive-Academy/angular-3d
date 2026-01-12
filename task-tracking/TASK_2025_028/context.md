# Task Context - TASK_2025_028

## User Intent

Full WebGPU migration for @hive-academy/angular-3d library. Migrate all components and services from WebGLRenderer to WebGPURenderer with TSL (Three.js Shading Language) support.

## Conversation Summary

Prior discussion established:

- Current state: Using `THREE.WebGLRenderer` with standard Three.js imports
- Browser support (Dec 2025): WebGPU now at ~85% coverage (Chrome, Edge, Firefox 141+, Safari 26+)
- Three.js WebGPU status: Active development, used in production (Expo 2025 Osaka), but not officially "stable"
- Migration requires: New imports (`three/webgpu`, `three/tsl`), NodeMaterial variants, async rendering
- Key benefits: TSL type-safe shaders, compute shaders, 100k+ GPU particles, better instancing

User chose "full WebGPU migration" approach over phased/hybrid strategy.

## Technical Context

- Branch: feature/TASK_2025_028-webgpu-migration
- Created: 2025-12-26
- Type: FEATURE (major architectural migration)
- Complexity: Complex (affects entire library architecture)

## Execution Strategy

FEATURE strategy with researcher-expert (technical unknowns on WebGPU/TSL specifics)

## Key Technical Decisions

1. Replace `THREE.WebGLRenderer` with `THREE.WebGPURenderer`
2. Add automatic WebGL fallback for older browsers
3. Convert materials to NodeMaterial variants
4. Implement TSL shader system for custom effects
5. Update all components to support async rendering
6. Maintain backward compatibility where possible

## Research Requirements

- Three.js r170+ WebGPU API specifics
- TSL syntax and patterns
- NodeMaterial conversion patterns
- Async rendering patterns
- Compute shader integration for particles

## Files Likely Affected

- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` - Renderer creation
- `libs/angular-3d/src/lib/canvas/scene.service.ts` - Renderer type updates
- `libs/angular-3d/src/lib/render-loop/render-loop.service.ts` - Async render support
- `libs/angular-3d/src/lib/directives/materials/*.ts` - NodeMaterial variants
- `libs/angular-3d/src/lib/primitives/*.ts` - All primitive components
- `libs/angular-3d/src/lib/postprocessing/*.ts` - WebGPU post-processing
- `package.json` - Three.js import updates
