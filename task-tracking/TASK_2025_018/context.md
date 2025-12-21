# Task Context - TASK_2025_018

## User Intent

Enhance the demo application's hero section to properly showcase the advanced 3D capabilities of the `@hive-academy/angular-3d` library. The current implementation uses basic wireframe polyhedrons which fail to demonstrate the library's true potential for creating production-quality 3D scenes.

## Problem Statement

**Current State:**

- Hero section (`apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts`) displays simple rotating wireframe polyhedrons
- Limited visual impact and does not reflect the advanced features available in the library
- Lacks advanced elements: GLTF models, particle effects, multi-layer star fields, volumetric effects

**Desired State:**

- Hero section showcases comprehensive 3D scene composition with advanced features
- Demonstrates real-world usage patterns developers can reference
- Creates immersive, production-quality visual experience
- Serves as both marketing tool and technical reference

## Reference Implementation

**Source:** `D:\projects\angular-3d-workspace\temp\scene-graphs\hero-space-scene.component.ts`

This comprehensive component demonstrates:

1. **GLTF Model Integration:**

   - Realistic Earth planet model with rotation
   - Multiple robot models with space flight animations
   - Proper material handling (emissive, metalness, roughness)

2. **Particle Text Effects:**

   - `InstancedParticleTextComponent` - Performance-optimized instanced rendering
   - `SmokeParticleTextComponent` - Drift effects for atmospheric messaging
   - Multiple text layers with different colors/opacities

3. **Enhanced Star Fields:**

   - Multi-layer star field (3 layers: background, midground, foreground)
   - Twinkle effects for realism
   - 7,500+ total stars across all layers

4. **Volumetric Effects:**

   - `NebulaVolumetricComponent` - Layered volumetric clouds
   - `NebulaComponent` - Particle-based nebula
   - Bloom post-processing for glow effects

5. **ViewportPositioner Integration:**

   - CSS-like positioning (`top-left`, `50%`, percentages)
   - Responsive layout that adapts to viewport
   - Proper Z-depth layering

6. **Advanced Lighting:**

   - Theme-based lighting configuration via `SceneLightingComponent`
   - Multiple light sources (ambient, directional)
   - Shadow mapping support

7. **Interactive Controls:**
   - OrbitControls with scroll-zoom coordination
   - Smooth transitions between 3D zoom and page scroll
   - Configurable zoom limits and damping

## Technical Context

**Dependencies:**

- TASK_2025_016 (Viewport 3D Positioning Feature) - ✅ **COMPLETE**
  - `ViewportPositioningService` - Core reactive positioning service
  - `ViewportPositionDirective` - Declarative template positioning
  - All types exported: `NamedPosition`, `PercentagePosition`, `PixelPosition`, etc.
  - 73 unit tests passing
- TASK_2025_017 (Component Completion) - ✅ COMPLETE

**Affected Files:**

- `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` - Main target for enhancement
- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/*.component.ts` - Migration to standardized positioning
- Potential new components if scene complexity requires extraction

**Expanded Scope (Added 2025-12-21):**

- Standardize ALL positioning in demo components using ViewportPositioningService
- Establish positioning best practices and patterns for library users
- Create reference implementation demonstrating both service and directive usage

**Migration Strategy:**

1. Analyze reference component for applicable features
2. Identify which advanced components to integrate
3. Use ViewportPositioningService/Directive for ALL positioning (no hardcoded coords)
4. Audit existing demo scenes and migrate to standardized positioning
5. Simplify/remove features not suitable for hero section
6. Maintain performance (60fps target)
7. Document positioning patterns with inline comments

## Success Criteria

1. Hero section showcases minimum 5 advanced 3D features
2. Maintains 60fps performance on modern hardware
3. Responsive design works across viewport sizes
4. Visual impact significantly improved from current state
5. Code demonstrates best practices for library usage
6. Proper cleanup prevents memory leaks

## User Experience Goals

**For Visitors:**

- Immediate "wow factor" visual impact
- Smooth, performant 3D experience
- Clear demonstration of library capabilities

**For Developers:**

- Reference implementation for advanced features
- Clear code patterns for composing complex scenes
- Demonstrates integration between multiple components

## Timeline & Priority

**Priority:** High - Hero section is first impression for library demo
**Estimated Effort:** 10 hours (expanded scope includes positioning standardization)
**Dependencies:**

- ✅ TASK_2025_016 - ViewportPositioningService/Directive available
- ✅ TASK_2025_017 - All 3D components available

## Positioning Standards (New)

This task will establish positioning standards for the entire demo:

**Z-Depth Layering Convention:**

- Foreground: Z = 0 to -5 (text, UI elements)
- Midground: Z = -5 to -15 (logos, secondary elements)
- Background: Z = -15+ (nebula, distant objects)

**Positioning Method Priority:**

1. Named positions for corners/center: `viewportPosition="top-right"`
2. Percentages for custom placement: `[viewportPosition]="{ x: '50%', y: '38%' }"`
3. Offsets for fine-tuning: `[viewportOffset]="{ offsetX: -2, offsetZ: -10 }"`

**Usage Pattern:**

```html
<!-- Declarative (preferred for templates) -->
<a3d-planet viewportPosition="center" [viewportOffset]="{ offsetZ: -9 }" />

<!-- Programmatic (for computed positions) -->
readonly position = this.positioningService.getPosition('top-right', { offsetX: -2 });
```
