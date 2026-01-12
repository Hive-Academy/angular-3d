# TASK_2026_001: Glass Sphere Flocking Animation

## User Intent

Implement flocking/boids animation system for the glass sphere particle system to create organic, cluster-based motion similar to bird flocks or wave patterns.

## Original Request Summary

Replace the current smooth wave motion in `glass-sphere.component.ts` with a flocking algorithm (boids) that includes:

1. **Increased Particle Size**: Base size from 0.06 to 0.12-0.15
2. **Flocking Behaviors**:
   - Separation: Avoid crowding neighbors
   - Alignment: Match neighbor heading
   - Cohesion: Move toward neighbor center of mass
3. **Performance Optimization**: Spatial partitioning (grid-based) for 40k-100k particles
4. **Visual Parameters**: Neighbor distance ~0.5-1.0, tunable weights for each behavior
5. **Smooth Animation**: Frame-rate independent, damping, boundary constraints

## Technical Context

**Current Implementation**:

- File: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
- Lines 552-605: Current wave-based animation logic
- Particle count: 40,000-100,000
- Current size: 0.06 with variation

**Expected Outcome**:

- Organic clustering behavior
- Drift and swirl patterns
- Variable density (sparse/dense areas)
- 60fps performance maintained
- No console errors

## Files to Modify

1. `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts` - Core flocking implementation
2. `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts` - Update size parameters

## Conversation Context

- User request date: 2026-01-04
- Task type: FEATURE (animation algorithm enhancement)
- Complexity: Medium (algorithm design + performance optimization)
