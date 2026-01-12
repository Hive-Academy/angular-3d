# Task Context - TASK_2025_029

## User Intent

Create 6 prebuilt hero section showcases for angular-3d-demo:

1. **Metaball Hero** - Custom shader replicating temp/examples/hero-section-example with ray marching, SDF blending, cursor interaction
2. **Cosmic Portal** - Nebula + Planet + GlowText + Bloom
3. **Floating Geometry** - Multiple polyhedrons + Float3d + MouseTracking
4. **Particle Storm** - ParticleText + StarField + Bloom
5. **Bubble Dream** - BubbleText + NebulaVolumetric
6. **Crystal Grid** - TorusKnot + Wireframe + Glow

Each hero should be a standalone scene component in `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/` following existing patterns.

The Metaball hero requires creating a new MetaballComponent in `libs/angular-3d` with the shader techniques from the example.

## Conversation Summary

- User provided a hero-section-example in temp/examples with advanced metaball shader effects
- Explored entire angular-3d library capabilities (20+ components, directives, services)
- Web research identified 2025 trends: scroll-triggered 3D, cursor effects, oversized typography
- User confirmed wanting ALL 6 hero types created

## Technical Context

- Branch: feature/TASK_2025_029-prebuilt-hero-sections
- Created: 2025-12-26
- Type: FEATURE
- Complexity: Complex (new shader component + 6 scene components)

## Key Technical Insights from Example Analysis

### Shader Techniques to Replicate (MetaballComponent)

- Ray marching with Signed Distance Functions (SDFs)
- Smooth minimum (`smin`) for organic blob blending
- Interactive cursor sphere with proximity effects
- Adaptive quality (mobile vs desktop)
- Multiple color presets (11 schemes)
- Advanced lighting: Ambient + Diffuse + Specular + Fresnel + AO + Soft Shadows

### Existing Components Available

- StarFieldComponent, NebulaComponent, PlanetComponent
- TroikaTextComponent, GlowTroikaTextComponent, ParticleTextComponent, BubbleTextComponent
- Float3dDirective, Rotate3dDirective, MouseTracking3dDirective
- EffectComposerComponent, BloomEffectComponent
- OrbitControlsComponent

## Execution Strategy

FEATURE workflow:

1. Project Manager → Requirements
2. Researcher → Shader technical details (optional - already researched)
3. Software Architect → Implementation plan
4. Team Leader → Task decomposition
5. Developers → Implementation
6. QA → Testing/Review
7. Modernization Detector → Future enhancements

## Reference Materials

- Example code: `temp/examples/hero-section-example/index.html`
- Existing scenes: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/`
- Angular-3d lib: `libs/angular-3d/src/lib/`
