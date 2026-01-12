# Task Context - TASK_2025_025

## User Intent

Redesign the Angular-3D Showcase page to properly demonstrate the extensive list of components and features available in the @hive-academy/angular-3d library. Currently, the showcase page is a stub with incomplete coverage and 2 built scenes (hero-space-scene and value-props-3d-scene) that are not properly displayed.

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop (existing)
- Created: 2025-12-23
- Type: FEATURE
- Complexity: Complex

## Current State Analysis

### Showcase Page Structure

- `angular-3d-showcase.component.ts` - Main page with 3 sections
- `hero-space-scene.component.ts` - Space scene with stars, nebula, planets, GLTF model
- `value-props-3d-scene.component.ts` - Rotating geometries grid
- `primitives-showcase.component.ts` - Simple 4-card primitives grid (very limited)

### Components Available in Library (NOT all showcased)

**Primitives (17 components):**

1. BoxComponent
2. CylinderComponent
3. TorusComponent
4. PolyhedronComponent (5 types: tetrahedron, octahedron, dodecahedron, icosahedron)
5. PlanetComponent (with glow)
6. StarFieldComponent (multi-layer, stellar colors)
7. NebulaComponent
8. NebulaVolumetricComponent
9. GltfModelComponent
10. GroupComponent
11. FogComponent
12. SvgIconComponent
13. ParticleSystemComponent
14. FloatingSphereComponent
15. BackgroundCubeComponent
16. BackgroundCubesComponent

**Text Components (6):**

1. TroikaTextComponent
2. ResponsiveTroikaTextComponent
3. GlowTroikaTextComponent
4. SmokeTroikaTextComponent
5. ParticlesTextComponent
6. BubbleTextComponent

**Light Components (5):**

1. AmbientLightComponent
2. DirectionalLightComponent
3. PointLightComponent
4. SpotLightComponent
5. SceneLightingComponent

**Directives (15+):**

1. Float3dDirective
2. Rotate3dDirective
3. MeshDirective
4. GroupDirective
5. TransformDirective
6. Glow3dDirective
7. SpaceFlight3dDirective
8. Performance3dDirective
9. MouseTracking3dDirective
10. ScrollZoomCoordinatorDirective
11. ViewportPositionDirective
12. Various geometry directives (box, cylinder, torus, sphere, polyhedron)
13. Various material directives (standard, physical, lambert)
14. Various light directives

**Controls:**

- OrbitControlsComponent

**Postprocessing:**

- EffectComposerComponent
- BloomEffectComponent

**Services:**

- SceneService
- RenderLoopService
- GltfLoaderService
- TextureLoaderService
- FontPreloadService
- AdvancedPerformanceOptimizerService

### Gap Analysis

- Primitives showcase only shows 4 of 17+ primitives
- No text components showcased
- No directive showcase (Float3d, Rotate3d, Glow3d, SpaceFlight3d, etc.)
- No postprocessing showcase beyond basic bloom
- No service usage examples
- No light types comparison
- Hero scenes exist but layout may need improvement

## Execution Strategy

FEATURE workflow: PM → Architect → Team-Leader (3 modes) → QA → Modernization
