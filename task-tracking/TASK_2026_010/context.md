# Task Context - TASK_2026_010

## User Intent

Create an interactive camera flight navigation system that allows users to fly between multiple destination spheres in 3D space using right-click hold input. The system should integrate with GSAP for synchronized text content transitions.

### Core Requirements (from user)

1. **Second Sphere**: Create a NEW second sphere as a flight destination
2. **Flight Trigger**: Hold right-click to fly (release to stop)
3. **Effects**: Speed lines / motion blur + Stars streaking past (warp-like effect)
4. **Text Content**:
   - Design new GSAP-specific copy (title, subtitle, pills)
   - Use text from gsap-showcase page hero section as reference
   - Animate text AFTER arriving at destination
5. **Reversibility**: Bidirectional - user can fly back. Support multiple flight spots (not just 2), with forward and backward navigation
6. **Architecture**:
   - Define each component in respective library as "lego blocks"
   - angular-3d library: camera flight, effects, spheres
   - angular-gsap library: text animations, transitions
   - NO hard coupling between libraries
   - Demo combines them together

## Conversation Summary

The user wants to extend the current hero section (`glass-sphere-hero-section.component.ts`) which already features:

- A flying robot with mouse-tracking (`MouseTracking3dDirective`)
- Cinematic entrance animations (`CinematicEntranceDirective`)
- Fire sphere and marble sphere
- Star fields with rotation

The new feature adds:

- Interactive camera flight control (right-click hold)
- Multiple destination "waypoints" (spheres)
- Visual effects during flight (speed lines, star streaking)
- Synchronized text content transitions via GSAP
- Forward/backward navigation between waypoints

## Technical Context

- Branch: feature/TASK_2026_010-interactive-camera-flight
- Created: 2026-01-08
- Type: FEATURE
- Complexity: Complex (multi-library, multiple new components/directives)

### Existing Patterns to Follow

1. **MouseTracking3dDirective**: Shows how to handle mouse input, track visibility, use RAF for smooth updates
2. **CinematicEntranceDirective**: Shows GSAP integration, camera animation, OrbitControls coordination
3. **GSAP Showcase Hero**: Has the text content structure to reference

### Key Integration Points

- `OrbitControlsComponent` - Must coordinate with flight (disable during flight)
- `SceneService` - Camera access
- `RenderLoopService` - Per-frame updates
- `angular-gsap` - Text content animations (ViewportAnimationDirective, custom animations)

## Execution Strategy

FEATURE: researcher-expert → PM → architect → team-leader → developers → QA → modernization

## Reference Files

- `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`
- `libs/angular-3d/src/lib/directives/interaction/mouse-tracking-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/animation/cinematic-entrance.directive.ts`
- `apps/angular-3d-demo/src/app/pages/gsap-showcase/sections/gsap-showcase-hero-section.component.ts`
