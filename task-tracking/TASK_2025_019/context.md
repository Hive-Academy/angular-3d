# Task Context - TASK_2025_019

## User Intent

Create a killer hero section for the angular-3d-demo that truly showcases the 3D library capabilities. The current hero uses a static PNG background instead of actual 3D. We need to implement:

1. Use the full interactive 3D scene with GLTF Earth model, flying robots using SpaceFlight3dDirective
2. Add OrbitControls with mouse interactivity (drag to rotate, scroll to zoom)
3. Include multi-layer star fields, volumetric nebula effects
4. Add floating elements (geometric shapes or tech-related icons)
5. Dynamic particle text that demonstrates text rendering
6. Proper lighting and bloom post-processing
7. The hero should feel alive - not static like the current PNG background approach

## Reference Materials

- **Design Reference**: `temp/scene-graphs/hero-space-scene.component.ts` - Full featured scene with Earth, robots, logos
- **Wrapper Reference**: `temp/hero-section-space.component.ts` - How to integrate scene with DOM overlay
- **Current Implementation**: `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` - Basic version
- **Current Broken State**: `apps/angular-3d-demo/src/app/pages/gsap-showcase/gsap-showcase.component.ts` - Uses static PNG

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop (current)
- Created: 2025-12-22
- Type: FEATURE
- Complexity: Medium-High

## Available Library Components

From `@hive-academy/angular-3d`:
- Scene3dComponent, SceneService
- OrbitControlsComponent (with scroll-zoom coordination potential)
- SpaceFlight3dDirective (flying animation paths)
- Float3dDirective, Rotate3dDirective
- PlanetComponent, StarFieldComponent, NebulaVolumetricComponent
- GltfModelComponent (for Earth model, robots)
- InstancedParticleTextComponent
- AmbientLightComponent, DirectionalLightComponent
- BloomEffectComponent
- ViewportPositioningService, ViewportPositionDirective

## Execution Strategy

FEATURE workflow:
1. Project Manager - Define requirements and acceptance criteria
2. Software Architect - Design implementation approach
3. Team Leader - Decompose into tasks and coordinate development
4. Frontend Developer - Implement the hero section
5. QA - Test and review

## Key Constraints

- Must use existing library components (no new library code needed)
- Should work with current demo app structure
- Must be visually impressive to showcase library capabilities
- Performance consideration: Keep frame rate smooth (60fps target)
