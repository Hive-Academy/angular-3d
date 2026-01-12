# TASK_2025_016 - Viewport 3D Positioning Feature

## User Intent

The user wants to formalize and properly generalize the `ViewportPositioner` utility across the `@hive-academy/angular-3d` library. This is positioned as a **key feature** to introduce to the Angular community as a way to bridge the gap between:

- **Camera/3D positioning** (arbitrary world coordinates)
- **2D viewport positioning** (CSS-like: percentages, pixels, named positions)

The goal is to reduce the mental model gap for web developers who think in CSS coordinates but work with 3D space.

## Conversation Summary

### Initial Request

- User asked to evaluate the `viewport-3d-positioning.ts` utility in the `temp/` folder
- Wanted to know if it was copied to the main library
- Requested architecture recommendations for generalized usage and proper integration

### Key Findings

1. **Migration Status**: The `ViewportPositioner` class has NOT been migrated to `libs/angular-3d/`
2. **Current Usage**: Used extensively in `hero-space-scene.component.ts` for positioning text, planets, logos, and nebulae
3. **Existing Documentation**: Comprehensive vanilla Three.js guide at `docs/angular-3d-library/threejs-vanilla/11-viewport-positioning.md`

### Proposed Solution

A 3-layer Angular-native architecture:

1. **ViewportPositioningService** - Core reactive service syncing with SceneGraphStore camera
2. **ViewportPositionDirective** - Optional declarative directive for `viewportPosition="top-right"` syntax
3. **Type Exports & Utilities** - Pure functions for standalone usage

### User Confirmation

User agreed to create formal task tracking with `context.md` and task description.

## Technical Context

### Source Files

- `temp/angular-3d/utils/viewport-3d-positioning.ts` - Original implementation
- `temp/scene-graphs/hero-space-scene.component.ts` - Primary usage example
- `docs/angular-3d-library/threejs-vanilla/11-viewport-positioning.md` - Documentation

### Target Location

- `libs/angular-3d/src/lib/positioning/` - New module directory

### Key Integration Points

- `SceneGraphStore` - Provides reactive camera state
- `SceneService` - Provides camera/renderer access
- `TransformDirective` - Existing transform system (not modified, work alongside)

## Open Questions (Awaiting User Input)

1. Should the directive be separate or extend `TransformDirective`?
2. Should the service auto-sync with camera or require explicit config?
3. Should multiple viewport planes (Z depths) be a core feature?

## Date Created

2025-12-20
