# Task Description - TASK_2026_001

## Title

Glass Sphere Flocking Animation System

## Overview

Replace the current smooth wave-based particle animation in the glass sphere component with a sophisticated flocking/boids algorithm that creates organic, cluster-based motion patterns similar to bird flocks or underwater currents.

## User Request

> Implement flocking/boids animation for the glass sphere particle system with the following requirements:
>
> - Replace wave motion with flocking behavior (separation, alignment, cohesion)
> - **Three independent particle groups** with distinct visual characteristics:
>   - Group 1: Tiny dust particles (50,000) - subtle, background ambient
>   - Group 2: Medium core particles (30,000) - main visual mass
>   - Group 3: Large bright spots (10,000) - accent highlights
> - Per-group configuration: size, size variation, color palette, opacity
> - Total 90,000 particles at 60fps
> - Use spatial partitioning for performance
> - Maintain smooth, organic motion with boundary constraints
>
> **Visual Reference**: `docs\Screenshot 2026-01-03 205300.png` shows the target aesthetic with multiple particle sizes and coral-to-cream color gradient

## Business Value

- **Visual Impact**: More dynamic and organic particle behavior increases visual appeal
- **Performance**: Spatial partitioning ensures smooth performance at scale
- **Reusability**: Flocking system can be applied to other particle effects
- **User Engagement**: Natural clustering patterns are more engaging than repetitive waves

## Requirements

### Functional Requirements

#### FR-1: Flocking Algorithm Implementation

**Priority**: MUST HAVE

- **FR-1.1**: Implement Separation Force

  - Particles detect neighbors within configurable distance threshold
  - Steer away from neighbors that are too close
  - Prevent overcrowding and collision

- **FR-1.2**: Implement Alignment Force

  - Calculate average velocity of nearby particles
  - Gradually align particle velocity with neighbors
  - Create cohesive group movement

- **FR-1.3**: Implement Cohesion Force

  - Calculate center of mass for nearby particles
  - Steer particles toward the average position of neighbors
  - Create clustering behavior

- **FR-1.4**: Velocity and Speed Management

  - Constrain particle velocity to maximum speed limit
  - Apply damping factor to prevent jittery motion
  - Use delta time for frame-rate independent animation

- **FR-1.5**: Boundary Constraints
  - Keep particles within sphere radius
  - Use existing soft boundary system or improve
  - Prevent particles from escaping the sphere

#### FR-2: Spatial Partitioning System

**Priority**: MUST HAVE

- **FR-2.1**: Grid-Based Spatial Hash

  - Divide sphere volume into voxel grid
  - Assign particles to grid cells based on position
  - Update grid assignments each frame

- **FR-2.2**: Neighbor Lookup Optimization
  - Only check particles in same voxel or adjacent voxels
  - Avoid O(n²) all-to-all particle checks
  - Maintain performance with 40,000-100,000 particles

#### FR-3: Three-Group Particle System

**Priority**: MUST HAVE

- **FR-3.1**: Group 1 - Tiny Dust Particles (Background Ambient)

  - Count: 50,000 particles (55% of total)
  - Size: 0.08 base with variation [0.5, 1.0]
  - Colors: ['#ffffff', '#fff5e6'] (white to cream)
  - Opacity: 0.3 (subtle, atmospheric)
  - Visual role: Fills space, creates depth

- **FR-3.2**: Group 2 - Medium Core Particles (Main Visual Mass)

  - Count: 30,000 particles (33% of total)
  - Size: 0.15 base with variation [1.0, 1.5]
  - Colors: ['#ffccaa', '#ff8866'] (coral to peach)
  - Opacity: 0.6 (visible, but not dominant)
  - Visual role: Primary particle layer

- **FR-3.3**: Group 3 - Large Bright Spots (Accent Highlights)

  - Count: 10,000 particles (12% of total)
  - Size: 0.25 base with variation [1.5, 2.5]
  - Colors: ['#ff6644', '#ff4422'] (bright coral to red-orange)
  - Opacity: 0.85 (prominent highlights)
  - Visual role: Visual accents, creates focal points

- **FR-3.4**: Multi-Material Architecture

  - Use 3 separate InstancedMesh instances (one per group)
  - Independent materials for clean opacity/color control
  - Proper render order (group 1 → group 2 → group 3)

- **FR-3.5**: Configurable Group Inputs

  - Each group has signal inputs for: count, size, sizeVariation, colors, opacity
  - Backward compatibility: Legacy single-group inputs remain functional
  - If group inputs are customized, they override legacy inputs

- **FR-3.6**: Configurable Flocking Parameters
  - Neighbor distance: ~0.8 units
  - Separation weight: Strong (suggest 1.5)
  - Alignment weight: Medium (suggest 0.5)
  - Cohesion weight: Medium (suggest 0.8)
  - Max speed: ~0.015 units/frame
  - Damping factor: 0.95

### Non-Functional Requirements

#### NFR-1: Performance

- **NFR-1.1**: Maintain 60 FPS with 90,000 particles (50k + 30k + 10k)
- **NFR-1.2**: Spatial partitioning must reduce neighbor checks to O(k) per particle
- **NFR-1.3**: No frame drops or stuttering during animation
- **NFR-1.4**: 3 InstancedMesh instances should have minimal render overhead

#### NFR-2: Code Quality

- **NFR-2.1**: Follow Angular component patterns (standalone, signals, OnPush)
- **NFR-2.2**: Type-safe implementation (no 'any' types)
- **NFR-2.3**: Clean separation of concerns (flocking logic, rendering, parameters)

#### NFR-3: Maintainability

- **NFR-3.1**: Flocking parameters configurable via component inputs
- **NFR-3.2**: Clear documentation of algorithm and parameters
- **NFR-3.3**: Reusable spatial partitioning system

## Acceptance Criteria

### AC-1: Visual Behavior

```gherkin
Given the glass sphere component is rendered
When the flocking animation runs
Then particles should cluster together in organic groups
And clusters should drift and swirl smoothly
And there should be visible areas of high density (packed) and low density (sparse)
And particle motion should resemble bird flocks or underwater currents
```

### AC-2: Three-Group Visual Hierarchy

```gherkin
Given the glass sphere component is rendered with 3 particle groups
When observing the particle system
Then three distinct size tiers should be visible:
  - Tiny background dust (group 1, size ~0.08)
  - Medium core particles (group 2, size ~0.15)
  - Large bright spots (group 3, size ~0.25)
And color gradient should span coral/orange → peach → cream → white
And opacity layering should create visual depth (0.3 → 0.6 → 0.85)
And the visual should match the reference image (docs\Screenshot 2026-01-03 205300.png)
```

### AC-3: Performance

```gherkin
Given the glass sphere has 90,000 particles (50k + 30k + 10k across 3 groups)
When the flocking animation runs
Then the frame rate should maintain 60 FPS
And there should be no visible stuttering or lag
And spatial partitioning should be active
And 3 InstancedMesh instances should render efficiently
And console shows no performance warnings
```

### AC-4: Flocking Forces

```gherkin
Given particles are within neighbor distance of each other
When flocking forces are calculated
Then separation force should prevent overcrowding
And alignment force should create cohesive group movement
And cohesion force should create visible clustering
And all three forces should work together smoothly
```

### AC-5: Boundary Constraints

```gherkin
Given particles are near the sphere boundary
When flocking animation runs
Then particles should remain within the sphere radius
And no particles should escape or disappear
And boundary interaction should be smooth, not abrupt
```

### AC-6: Build and Compilation

```gherkin
Given the implementation is complete
When running `npx nx build angular-3d-demo`
Then the build should succeed without errors
And there should be no TypeScript compilation errors
And there should be no console errors at runtime
```

## Technical Scope

### Files to Modify

1. `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`

   - Add 15 new signal inputs for 3-group configuration
   - Replace single InstancedMesh with 3 group-specific InstancedMesh instances
   - Replace wave animation logic (lines 552-605) with flocking algorithm
   - Add spatial partitioning system for neighbor lookups
   - Add configurable flocking parameters
   - Maintain backward compatibility with legacy single-group inputs

2. `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`
   - Update template to use new 3-group input structure
   - Configure group 1: 50k tiny dust particles (0.08 size, white/cream)
   - Configure group 2: 30k medium particles (0.15 size, coral/peach)
   - Configure group 3: 10k large highlights (0.25 size, bright coral/red-orange)
   - Test visual output against reference image

### Implementation Approach

- **Algorithm**: Standard boids/flocking (Reynolds, 1987) - all 90k particles share same simulation
- **Architecture**: 3 separate InstancedMesh instances (Option A - cleaner than single mesh)
- **Optimization**: 3D grid spatial hash for neighbor lookup (critical for 90k particles)
- **Animation**: Frame-rate independent using delta time
- **Integration**: Backward compatible - legacy inputs work, new group inputs override when set

## Risks and Mitigations

### Risk 1: Performance Degradation

- **Likelihood**: Medium
- **Impact**: High (user experience)
- **Mitigation**:
  - Implement spatial partitioning from start (not as optimization)
  - Profile with 100k particles before considering complete
  - Adjust grid resolution for optimal balance

### Risk 2: Parameter Tuning Difficulty

- **Likelihood**: Medium
- **Impact**: Medium (visual quality)
- **Mitigation**:
  - Use proven initial parameter values from research
  - Make all parameters easily configurable
  - Document visual effects of each parameter

### Risk 3: Boundary Behavior Issues

- **Likelihood**: Low
- **Impact**: Medium (visual quality)
- **Mitigation**:
  - Leverage existing boundary system if functional
  - Add soft force repelling particles from boundaries
  - Test edge cases (all particles near boundary)

## Out of Scope

- Predator/prey behavior (extended boids)
- Obstacle avoidance (no obstacles in sphere)
- Dynamic particle count changes at runtime
- User-controllable parameters (UI sliders)
- Different flocking behaviors per group (all groups share same simulation)

## Success Metrics

- Three distinct particle size tiers visible (0.08, 0.15, 0.25)
- Color gradient matches reference image (coral → peach → cream → white)
- Opacity layering creates visual depth (0.3 → 0.6 → 0.85)
- Visible clustering and organic flocking motion patterns
- 60 FPS maintained with 90,000 particles
- No console errors or performance warnings
- Build succeeds without compilation errors
- All acceptance criteria pass visual and performance tests

## Dependencies

- Three.js particle system (existing)
- Glass sphere component architecture (existing)
- Render loop service (existing)
- No new external libraries required

## Timeline Estimate

- 3-group input system: 1-2 hours
- 3-mesh architecture refactor: 2-3 hours
- Flocking algorithm implementation: 3-4 hours
- Spatial partitioning: 2-3 hours
- Visual parameter tuning: 1-2 hours
- Testing and optimization: 1-2 hours
- **Total**: 10-16 hours

## References

- Reynolds, C. W. (1987). "Flocks, herds and schools: A distributed behavioral model"
- Three.js BufferGeometry performance patterns
- Spatial hashing algorithms for 3D particle systems
