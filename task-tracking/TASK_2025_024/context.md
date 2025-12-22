# TASK_2025_024 - Angular-3D Provider Architecture & Configuration

## User Intent

The user wants to implement a modern Angular provider pattern (`provideAngular3d()`) for the `@hive-academy/angular-3d` library, following the same architectural thinking applied in TASK_2025_022 for GSAP. This will centralize configuration and eliminate redundant per-scene settings in the demo application.

## Conversation Summary

The discussion began when the user asked to audit the angular-3d library for Three.js integration patterns, applying the same thinking from TASK_2025_022 (GSAP Service Centralization).

### Key Findings from Audit

**Current State (angular-3d):**
- Per-scene services are correctly architected (SceneService, RenderLoopService, SceneGraphStore)
- Comprehensive cleanup with SceneGraphStore and DestroyRef
- Signal-based reactivity with modern Angular patterns
- SSR safety via `afterNextRender` pattern

**Gap Identified:**
- No `provideAngular3d()` provider function for app-level configuration
- Renderer/camera/shadow settings must be repeated on every `<a3d-scene-3d>` component
- Asset paths (Draco decoder, model base paths) not configurable at app level
- Pattern doesn't match modern Angular providers like `provideRouter()`, `provideGsap()`

### Comparison: GSAP vs Three.js

| Aspect | GSAP (Task 022) | Three.js (This Task) |
|--------|-----------------|----------------------|
| Problem | Redundant plugin registration (4 files) | Redundant configuration (per-scene) |
| Solution | Centralized GsapCoreService | Centralized config token + provider |
| Per-scene? | No (singleton GSAP) | Yes (per-scene services remain) |
| Goal | Eliminate redundant init | Provide app-wide defaults |

## Scope

### In Scope

1. **Create `provideAngular3d()` provider function**
   - `Angular3dConfig` interface with TypeScript types
   - `ANGULAR_3D_CONFIG` injection token
   - Provider factory with `makeEnvironmentProviders()`

2. **Update Scene3dComponent to read config**
   - Inject optional config token
   - Priority: Component Input > App Config > Library Default

3. **Configure asset loaders**
   - GltfLoaderService reads base path from config
   - Draco decoder path configurable

4. **Simplify demo app scenes**
   - Remove redundant renderer/shadow/camera settings
   - Use centralized configuration
   - Keep only scene-specific overrides

5. **Document the pattern**
   - JSDoc on provider function
   - Usage examples in config interface

### Out of Scope

- Changing per-scene service architecture (already correct)
- Adding new Three.js features
- Performance optimizations beyond configuration

## Files Affected

### @hive-academy/angular-3d (Library)

| File | Action | Description |
|------|--------|-------------|
| `src/lib/providers/angular-3d.provider.ts` | CREATE | Provider function + config interface |
| `src/lib/canvas/scene-3d.component.ts` | MODIFY | Read config token, merge with inputs |
| `src/lib/loaders/gltf-loader.service.ts` | MODIFY | Read asset config for paths |
| `src/index.ts` | MODIFY | Export provider and types |

### Demo App (Simplification)

| File | Action | Description |
|------|--------|-------------|
| `apps/angular-3d-demo/src/app/app.config.ts` | MODIFY | Add `provideAngular3d()` |
| `apps/angular-3d-demo/src/app/pages/home/scenes/*.ts` | MODIFY | Remove redundant config |
| `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/*.ts` | MODIFY | Remove redundant config |

## Task Type

- **Type**: FEATURE + REFACTORING
- **Priority**: Medium (architectural improvement, DX enhancement)
- **Scope**: `@hive-academy/angular-3d` library + demo app cleanup

## Related Tasks

- **TASK_2025_022**: GSAP Service Centralization (same pattern, different library)
- **TASK_2025_002**: Core Infrastructure - Canvas & Render Loop (created Scene3dComponent)

## Created

- **Date**: 2025-12-22
- **Source**: User request after angular-3d audit
