# TASK_2025_039 - Advanced Shader Background System

## Task ID
TASK_2025_039

## Created
2026-01-03

## Type
FEATURE

## User Request

Implement an advanced shader-based background effect system for the @hive-academy/angular-3d library with the following requirements:

1. **Shader-Driven Backgrounds**
   - Support ray marching effects (metaballs, SDFs, volumetric fog) using existing `tsl-raymarching.ts`
   - Support TSL procedural textures (caustics, organic patterns, space effects) from `tsl-textures/`
   - Full-screen or positioned background planes

2. **Reusable Component Architecture**
   - Shared components that work across different scenes/routes
   - Configurable shader selection
   - Shader parameter controls
   - Utilize existing components where applicable

3. **Positioning Integration**
   - Integrate with existing `@libs/angular-3d/src/lib/positioning/` system
   - Support viewport positioning for true background layer placement (far Z-depth)
   - Enable multiple backgrounds at different depth layers

4. **Mouse Interaction**
   - Shader uniforms react to mouse position
   - Parallax effects
   - Interactive distortion/displacement
   - Leverage existing `MouseTracking3dDirective` or create mouse uniform system

## Context from Conversation

**Existing Infrastructure:**
- `BackgroundCubeComponent` - Simple cube primitive (libs/angular-3d/src/lib/primitives/scene/)
- `BackgroundCubesComponent` - Zone-based distribution manager (libs/angular-3d/src/lib/primitives/effects/)
- `ViewportPositionDirective` - CSS-like viewport positioning (libs/angular-3d/src/lib/positioning/)
- `MouseTracking3dDirective` - Mouse interaction system (libs/angular-3d/src/lib/directives/interaction/)
- `tsl-raymarching.ts` - SDF primitives, ray marching algorithms (libs/angular-3d/src/lib/primitives/shaders/)
- `tsl-textures/` - Procedural texture library (libs/angular-3d/src/lib/primitives/shaders/tsl-textures/)
- `ShaderMaterialDirective` - Existing shader integration (libs/angular-3d/src/lib/directives/materials/)

**Folder Structure to Follow:**
```
libs/angular-3d/src/lib/
├── primitives/
│   ├── backgrounds/          # NEW - Background shader components
│   ├── effects/              # Existing - Effect compositions
│   ├── scene/                # Existing - Basic primitives
│   └── shaders/              # Existing - TSL shaders
├── directives/
│   ├── interaction/          # Existing - Mouse tracking
│   └── materials/            # Existing - Shader materials
└── positioning/              # Existing - Viewport positioning
```

**Key Requirements:**
- Follow existing component patterns (signal inputs, hostDirectives composition)
- Reuse existing mouse tracking and positioning infrastructure
- Leverage TSL shader utilities already implemented
- Ensure proper folder grouping per library structure
- Support multiple shader types with consistent API

## Success Criteria

1. ✅ New background component system created in proper folder structure
2. ✅ Integration with existing positioning system for depth layering
3. ✅ Integration with existing mouse tracking for interactivity
4. ✅ Support for multiple shader types (ray marching, caustics, volumetric, etc.)
5. ✅ Reusable across different scenes in demo app
6. ✅ Consistent with existing library API patterns
7. ✅ Documentation and examples provided
8. ✅ Performance optimized for background rendering

## Related Tasks

- TASK_2025_028 - WebGPU Migration (shader foundation)
- TASK_2025_032 - Native TSL Procedural Textures (shader library)
- TASK_2025_033 - Blueyard.com Replication Analysis (visual effects inspiration)
- TASK_2025_038 - Angular-3D Library Structure Reorganization (folder structure)
