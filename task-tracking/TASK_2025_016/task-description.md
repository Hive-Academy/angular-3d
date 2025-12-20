# Task Description: Viewport 3D Positioning Feature

## Summary

Migrate and enhance the `ViewportPositioner` utility from `temp/` to `@hive-academy/angular-3d` as a first-class Angular feature. This enables web developers to position 3D objects using familiar CSS-like coordinates (percentages, pixels, named positions) instead of arbitrary 3D world coordinates.

## Problem Statement

Web developers think in CSS coordinates:

- `position: top-right`
- `left: 50%`
- `margin-top: 100px`

Three.js requires 3D world coordinates:

- `position.set(-17.75, 10, 0)`

This creates a significant mental model gap. The `ViewportPositioner` utility bridges this gap but currently exists only as an un-migrated class in `temp/`.

## Goals

1. **Migrate** the `ViewportPositioner` concept to the main library
2. **Make it Angular-native** with DI and reactive signals
3. **Sync with camera** automatically via SceneGraphStore
4. **Handle responsive resize** reactively
5. **Provide declarative API** via optional directive
6. **Export utilities** for advanced usage patterns

## Deliverables

### Required

- [ ] `ViewportPositioningService` - Core reactive service
- [ ] `viewport-positioning.types.ts` - Shared type definitions
- [ ] Unit tests with comprehensive coverage
- [ ] Updated library exports in `index.ts`
- [ ] README documentation

### Optional (Based on User Feedback)

- [ ] `ViewportPositionDirective` - Declarative template syntax
- [ ] Migration of `hero-space-scene.component.ts` to new API
- [ ] Multiple viewport plane support

## Acceptance Criteria

1. Service correctly calculates world positions from viewport coordinates
2. Named positions (`top-left`, `center`, etc.) work correctly
3. Percentage positions (`50%`, `0.5`) work correctly
4. Offsets (X, Y, Z) are applied correctly
5. Positions update reactively on camera changes
6. Positions update on window resize
7. All existing functionality from `ViewportPositioner` is preserved
8. Unit tests pass with >80% coverage

## Dependencies

- TASK_2025_003 (State Store) - For SceneGraphStore access
- TASK_2025_002 (Canvas) - For Scene3dComponent integration

## Estimated Effort

- **Service + Types**: 2 hours
- **Unit Tests**: 1.5 hours
- **Directive (optional)**: 1 hour
- **Documentation**: 0.5 hours
- **Migration of demo**: 1 hour

**Total: ~6 hours**

## Priority

Medium-High - Key differentiating feature for the library's developer experience.
