# Implementation Plan - Documentation Fixes (TASK_2026_005)

## Summary

This plan addresses critical (P0) and high-priority (P1) documentation issues identified in the code-logic-review.md. The fixes ensure documentation accurately reflects the actual codebase exports.

---

## Evidence-Based Component Counts (Verified from Filesystem)

### @hive-academy/angular-3d

| Category    | Count | Source                                                    |
| ----------- | ----- | --------------------------------------------------------- |
| Components  | 54    | `find libs/angular-3d/src/lib -name "*.component.ts"`     |
| Directives  | 24    | `find libs/angular-3d/src/lib -name "*.directive.ts"`     |
| Services    | 14    | `find libs/angular-3d/src/lib -name "*.service.ts"`       |
| Stores      | 2     | Angular3dStateStore, SceneGraphStore (signal-based)       |
| TSL Exports | 40+   | See `libs/angular-3d/src/lib/primitives/shaders/index.ts` |

### @hive-academy/angular-gsap

| Category   | Count | Source                                                         |
| ---------- | ----- | -------------------------------------------------------------- |
| Components | 7     | `find libs/angular-gsap/src/lib -name "*.component.ts"`        |
| Directives | 19    | 8 standalone files + 6 feature directives + 5 split-panel = 19 |
| Services   | 2     | GsapCoreService, LenisSmoothScrollService                      |
| Providers  | 2     | provideGsap(), provideLenis()                                  |

---

## P0 - Critical Fixes (Files to Modify)

### Fix 1: Update `libs/angular-3d/CLAUDE.md`

**Purpose**: Regenerate Structure section and Public API to match actual codebase

**Current Issues**:

- Structure section shows outdated paths (e.g., `text-3d.component.ts` doesn't exist)
- Public API section shows non-existent exports
- Missing entire directories (shaders, backgrounds, metaball)

**Action**: Complete rewrite of Structure and Public API sections

**New Structure Section** (replace lines 23-77):

```markdown
## Structure

\`\`\`
src/
├── lib/
│ ├── canvas/ # Scene container
│ │ ├── scene-3d.component.ts # Root scene component
│ │ └── scene.service.ts # Scene/camera/renderer access
│ ├── render-loop/ # Animation frame management
│ │ ├── render-loop.service.ts # Frame loop and callbacks
│ │ └── animation.service.ts # Flight waypoints, pulse animations
│ ├── controls/ # Camera controls
│ │ └── orbit-controls.component.ts
│ ├── loaders/ # Asset loading
│ │ ├── gltf-loader.service.ts # GLTF/GLB model loading
│ │ ├── texture-loader.service.ts # Texture loading with caching
│ │ ├── inject-gltf-loader.ts # Injectable function pattern
│ │ └── inject-texture-loader.ts # Injectable function pattern
│ ├── primitives/ # 3D components
│ │ ├── geometry/ # Basic shapes (6 components)
│ │ │ ├── box.component.ts
│ │ │ ├── sphere.component.ts
│ │ │ ├── cylinder.component.ts
│ │ │ ├── torus.component.ts
│ │ │ ├── polyhedron.component.ts
│ │ │ └── floating-sphere.component.ts
│ │ ├── lights/ # Light components (5 components)
│ │ │ ├── ambient-light.component.ts
│ │ │ ├── directional-light.component.ts
│ │ │ ├── point-light.component.ts
│ │ │ ├── spot-light.component.ts
│ │ │ └── scene-lighting.component.ts
│ │ ├── text/ # Text rendering (7 components)
│ │ │ ├── troika-text.component.ts
│ │ │ ├── responsive-troika-text.component.ts
│ │ │ ├── glow-troika-text.component.ts
│ │ │ ├── smoke-troika-text.component.ts
│ │ │ ├── particles-text.component.ts
│ │ │ ├── bubble-text.component.ts
│ │ │ └── extruded-text-3d.component.ts
│ │ ├── space/ # Space-themed (5 components)
│ │ │ ├── planet.component.ts
│ │ │ ├── star-field.component.ts
│ │ │ ├── nebula.component.ts
│ │ │ ├── nebula-volumetric.component.ts
│ │ │ └── cloud-layer.component.ts
│ │ ├── particles/ # Particle systems (5 components)
│ │ │ ├── particle-system.component.ts
│ │ │ ├── marble-particle-system.component.ts
│ │ │ ├── gpu-particle-sphere.component.ts
│ │ │ ├── sparkle-corona.component.ts
│ │ │ └── particle-cloud.component.ts
│ │ ├── effects/ # Visual effects (8 components)
│ │ │ ├── metaball/ # Compositional metaball system
│ │ │ │ ├── metaball-scene.component.ts
│ │ │ │ ├── metaball-sphere.component.ts
│ │ │ │ ├── metaball-cursor.component.ts
│ │ │ │ ├── mouse-tracker.service.ts
│ │ │ │ ├── tsl-metaball-sdf.ts
│ │ │ │ ├── tsl-metaball-lighting.ts
│ │ │ │ └── presets.ts
│ │ │ ├── metaball.component.ts # Deprecated - use compositional API
│ │ │ ├── marble-sphere.component.ts
│ │ │ ├── background-cubes.component.ts
│ │ │ ├── fire-sphere.component.ts
│ │ │ └── thruster-flame.component.ts
│ │ ├── scene/ # Scene organization (5 components)
│ │ │ ├── group.component.ts
│ │ │ ├── fog.component.ts
│ │ │ ├── environment.component.ts
│ │ │ ├── background-cube.component.ts
│ │ │ └── instanced-mesh.component.ts
│ │ ├── loaders/ # Asset loader components (2)
│ │ │ ├── gltf-model.component.ts
│ │ │ └── svg-icon.component.ts
│ │ ├── backgrounds/ # Background shaders (1 component)
│ │ │ └── hexagonal-background-instanced.component.ts
│ │ └── shaders/ # TSL utilities (40+ exports)
│ │ ├── tsl-utilities.ts # Fresnel, fog, caustics
│ │ ├── tsl-raymarching.ts # SDF, ray marching, shadows
│ │ ├── tsl-marble.ts # Marble material
│ │ └── tsl-textures/ # Procedural textures
│ │ ├── materials.ts # Marble, wood, rust
│ │ ├── patterns.ts # Grid, dots, voronoi, bricks
│ │ ├── shapes.ts # Supersphere, melter
│ │ ├── space.ts # Planet, stars, photosphere
│ │ └── organic.ts # Brain, veins, clay
│ ├── directives/ # Animation behaviors (24 total)
│ │ ├── animation/ # Animation directives (3)
│ │ │ ├── float-3d.directive.ts
│ │ │ ├── rotate-3d.directive.ts
│ │ │ └── space-flight-3d.directive.ts
│ │ ├── core/ # Core directives (3)
│ │ │ ├── mesh.directive.ts
│ │ │ ├── group.directive.ts
│ │ │ └── transform.directive.ts
│ │ ├── interaction/ # Interaction directives (3)
│ │ │ ├── mouse-tracking-3d.directive.ts
│ │ │ ├── scroll-zoom-coordinator.directive.ts
│ │ │ └── performance-3d.directive.ts
│ │ ├── effects/ # Effect directives (1)
│ │ │ └── glow-3d.directive.ts
│ │ ├── geometries/ # Geometry directives (5)
│ │ │ ├── box-geometry.directive.ts
│ │ │ ├── sphere-geometry.directive.ts
│ │ │ ├── cylinder-geometry.directive.ts
│ │ │ ├── torus-geometry.directive.ts
│ │ │ └── polyhedron-geometry.directive.ts
│ │ ├── materials/ # Material directives (3)
│ │ │ ├── standard-material.directive.ts
│ │ │ ├── physical-material.directive.ts
│ │ │ └── node-material.directive.ts
│ │ └── lights/ # Light directives (5)
│ │ ├── light.directive.ts # Base light directive
│ │ ├── ambient-light.directive.ts
│ │ ├── point-light.directive.ts
│ │ ├── directional-light.directive.ts
│ │ └── spot-light.directive.ts
│ ├── postprocessing/ # Effects (8 components, 1 service)
│ │ ├── effect-composer.component.ts
│ │ ├── effect-composer.service.ts
│ │ └── effects/
│ │ ├── bloom-effect.component.ts
│ │ ├── selective-bloom-effect.component.ts
│ │ ├── dof-effect.component.ts
│ │ ├── ssao-effect.component.ts
│ │ ├── color-grading-effect.component.ts
│ │ ├── chromatic-aberration-effect.component.ts
│ │ └── film-grain-effect.component.ts
│ ├── positioning/ # Viewport positioning
│ │ ├── viewport-positioning.service.ts
│ │ ├── viewport-positioning.types.ts
│ │ └── viewport-position.directive.ts
│ ├── store/ # State management
│ │ ├── angular-3d-state.store.ts
│ │ ├── scene-graph.store.ts
│ │ └── component-registry.service.ts
│ ├── services/ # Shared services
│ │ ├── advanced-performance-optimizer.service.ts
│ │ ├── render-callback-registry.service.ts
│ │ ├── visibility-observer.service.ts
│ │ ├── font-preload.service.ts
│ │ └── text-sampling.service.ts
│ ├── tokens/ # Injection tokens
│ │ ├── object-id.token.ts
│ │ ├── geometry.token.ts
│ │ └── material.token.ts
│ └── types/ # TypeScript types
│ ├── tokens.ts # NG_3D_PARENT token
│ └── attachable-3d-child.ts # NG_3D_CHILD token
└── index.ts # Public API exports
\`\`\`
```

**New Public API Section** (replace lines 212-239):

```markdown
## Public API

The library exports are organized by module. Import from `@hive-academy/angular-3d`:

\`\`\`typescript
// Canvas - Scene container
export { Scene3dComponent, SceneService, CameraConfig, RendererConfig } from '@hive-academy/angular-3d';

// Render Loop - Frame management
export {
RenderLoopService,
AnimationService,
UpdateCallback,
FrameContext,
FrameloopMode,
FlightWaypoint,
PulseConfig,
} from '@hive-academy/angular-3d';

// Controls
export { OrbitControlsComponent } from '@hive-academy/angular-3d';

// Store - State management
export { Angular3dStateStore, ComponentRegistryService, SceneGraphStore } from '@hive-academy/angular-3d';

// Tokens - DI tokens
export { NG_3D_PARENT, NG_3D_CHILD, OBJECT_ID, GEOMETRY_SIGNAL, MATERIAL_SIGNAL } from '@hive-academy/angular-3d';

// Loaders - Asset loading
export {
GltfLoaderService,
TextureLoaderService,
injectGltfLoader,
injectTextureLoader,
} from '@hive-academy/angular-3d';

// Primitives - All 54 components via barrel exports
export \* from '@hive-academy/angular-3d'; // Includes all geometry, lights, text, space, particles, effects, scene, loaders, backgrounds

// Directives - All 24 directives
export {
// Animation
Float3dDirective,
Rotate3dDirective,
SpaceFlight3dDirective,
// Core
MeshDirective,
GroupDirective,
TransformDirective,
// Interaction
MouseTracking3dDirective,
ScrollZoomCoordinatorDirective,
Performance3dDirective,
// Effects
Glow3dDirective,
// Geometries
BoxGeometryDirective,
SphereGeometryDirective,
CylinderGeometryDirective,
TorusGeometryDirective,
PolyhedronGeometryDirective,
// Materials
StandardMaterialDirective,
PhysicalMaterialDirective,
NodeMaterialDirective,
// Lights
LightDirective,
AmbientLightDirective,
PointLightDirective,
DirectionalLightDirective,
SpotLightDirective,
// Positioning
ViewportPositionDirective,
} from '@hive-academy/angular-3d';

// Postprocessing
export {
EffectComposerComponent,
EffectComposerService,
BloomEffectComponent,
SelectiveBloomEffectComponent,
DofEffectComponent,
SsaoEffectComponent,
ColorGradingEffectComponent,
ChromaticAberrationEffectComponent,
FilmGrainEffectComponent,
} from '@hive-academy/angular-3d';

// Positioning
export { ViewportPositioningService } from '@hive-academy/angular-3d';

// Services
export {
AdvancedPerformanceOptimizerService,
RenderCallbackRegistryService,
VisibilityObserverService,
FontPreloadService,
} from '@hive-academy/angular-3d';

// TSL Shaders - 40+ utilities for custom materials
export {
// Noise functions
nativeNoise3D,
nativeFBM,
nativeFBMVec3,
domainWarp,
cloudDensity,
// Lighting effects
tslFresnel,
tslIridescence,
tslCaustics,
tslVolumetricRay,
// Ray marching
tslSphereDistance,
tslSmoothUnion,
tslRayMarch,
tslNormal,
tslAmbientOcclusion,
tslSoftShadow,
// Marble materials
tslMarbleRaymarch,
tslGlossyFresnel,
createMarbleMaterial,
// Procedural textures
tslPlanet,
tslStars,
tslMarble,
tslWood,
tslRust,
tslPolkaDots,
tslGrid,
tslVoronoiCells,
tslBricks,
tslSupersphere,
tslMelter,
tslBrain,
tslReticularVeins,
tslWaterMarble,
tslRoughClay,
} from '@hive-academy/angular-3d';
\`\`\`
```

---

### Fix 2: Update `libs/angular-gsap/CLAUDE.md`

**Purpose**: Regenerate Structure section and Public API to match actual codebase

**Current Issues**:

- Structure shows only 4 items, actual is 30+ exports
- Missing entire directories (feature-showcase, split-panel, services, providers)
- No mention of services or providers

**Action**: Complete rewrite of Structure and Public API sections

**New Structure Section** (replace lines 22-34):

```markdown
## Structure

\`\`\`
src/
├── lib/
│ ├── directives/
│ │ ├── scroll/ # Scroll-based directives
│ │ │ ├── scroll-animation.directive.ts # Main scroll animation
│ │ │ ├── hijacked-scroll.directive.ts # Scroll hijacking container
│ │ │ ├── hijacked-scroll-item.directive.ts # Hijacked scroll items
│ │ │ └── scroll-section-pin.directive.ts # Section pinning
│ │ ├── viewport-animation.directive.ts # IntersectionObserver animations
│ │ ├── section-sticky.directive.ts # Sticky section behavior
│ │ ├── parallax-split-item.directive.ts # Parallax split items
│ │ └── lenis-smooth-scroll.directive.ts # Smooth scroll directive
│ ├── components/
│ │ ├── scroll-timeline/ # Timeline components
│ │ │ ├── hijacked-scroll-timeline.component.ts
│ │ │ ├── scroll-timeline.component.ts
│ │ │ └── step-indicator.component.ts
│ │ ├── feature-showcase/ # Feature showcase system
│ │ │ ├── feature-showcase-timeline.component.ts
│ │ │ ├── feature-step.component.ts
│ │ │ └── feature-step.directives.ts # 6 content directives
│ │ ├── split-panel/ # Split panel system
│ │ │ ├── split-panel-section.component.ts
│ │ │ └── split-panel.directives.ts # 5 content directives
│ │ └── parallax-split-scroll.component.ts
│ ├── services/
│ │ ├── gsap-core.service.ts # GSAP initialization & config
│ │ └── lenis-smooth-scroll.service.ts # Lenis smooth scroll service
│ └── providers/
│ ├── gsap.provider.ts # provideGsap() function
│ └── lenis.provider.ts # provideLenis() function
└── index.ts # Public API exports
\`\`\`
```

**New Public API Section** (replace lines 222-245):

```markdown
## Public API

Import from `@hive-academy/angular-gsap`:

\`\`\`typescript
// Scroll Directives (4 directives)
export {
ScrollAnimationDirective,
ScrollAnimationConfig,
AnimationType,
HijackedScrollDirective,
HijackedScrollConfig,
HijackedScrollItemDirective,
HijackedScrollItemConfig,
SlideDirection,
ScrollSectionPinDirective,
} from '@hive-academy/angular-gsap';

// Other Directives (4 directives)
export {
ViewportAnimationDirective,
ViewportAnimationConfig,
ViewportAnimationType,
SectionStickyDirective,
ParallaxSplitItemDirective,
ParallaxSplitItemConfig,
SplitLayout,
LenisSmoothScrollDirective,
LenisSmoothScrollConfig,
} from '@hive-academy/angular-gsap';

// Scroll Timeline Components (3 components)
export {
HijackedScrollTimelineComponent,
ScrollTimelineComponent,
StepIndicatorComponent,
StepData,
} from '@hive-academy/angular-gsap';

// Feature Showcase Components (2 components + 6 directives)
export {
FeatureShowcaseTimelineComponent,
FeatureStepComponent,
FeatureBadgeDirective,
FeatureTitleDirective,
FeatureDescriptionDirective,
FeatureNotesDirective,
FeatureVisualDirective,
FeatureDecorationDirective,
} from '@hive-academy/angular-gsap';

// Split Panel Components (1 component + 5 directives)
export {
SplitPanelSectionComponent,
SplitPanelImageDirective,
SplitPanelBadgeDirective,
SplitPanelTitleDirective,
SplitPanelDescriptionDirective,
SplitPanelFeaturesDirective,
} from '@hive-academy/angular-gsap';

// Other Components (1 component)
export { ParallaxSplitScrollComponent } from '@hive-academy/angular-gsap';

// Services (2 services)
export { GsapCoreService } from '@hive-academy/angular-gsap';
export {
LenisSmoothScrollService,
LenisServiceOptions,
LenisScrollEvent,
} from '@hive-academy/angular-gsap';

// Providers (Modern Angular pattern)
export {
provideGsap,
GSAP_CONFIG,
GsapConfig,
provideLenis,
LENIS_CONFIG,
} from '@hive-academy/angular-gsap';
\`\`\`
```

---

### Fix 3: Update Root `README.md`

**Purpose**: Correct component counts and add proper code examples

**Changes**:

1. **Line 18**: Change `44 components, 19 directives, 14 services` to `54 components, 24 directives, 14 services`
2. **Line 19**: Change `7 components, 22 directives` to `7 components, 19 directives, 2 services, 2 providers`
3. **Lines 31-41**: Add `standalone: true` and `imports` to code example
4. **Lines 49-55**: Add `standalone: true` and `imports` to code example
5. **Line 3**: Change `(LICENSE)` to `(https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE)` for absolute URL

**Updated Lines 16-20**:

```markdown
## Libraries

| Library                                           | Version                                                                                                                         | Description                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| [@hive-academy/angular-3d](./libs/angular-3d)     | [![npm](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)     | Declarative Three.js components - 54 components, 24 directives, 14 services   |
| [@hive-academy/angular-gsap](./libs/angular-gsap) | [![npm](https://img.shields.io/npm/v/@hive-academy/angular-gsap.svg)](https://www.npmjs.com/package/@hive-academy/angular-gsap) | GSAP scroll animations - 7 components, 19 directives, 2 services, 2 providers |
```

**Updated Lines 30-42** (3D Graphics example):

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, BoxComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-basic-scene',
  standalone: true,
  imports: [Scene3dComponent, BoxComponent],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
      <a3d-box [color]="'#ff6b6b'" />
    </a3d-scene-3d>
  `,
})
export class BasicSceneComponent {}
```

**Updated Lines 49-56** (Scroll Animation example):

```typescript
import { Component } from '@angular/core';
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `<h1 scrollAnimation>Animated on scroll</h1>`,
})
export class HeroComponent {}
```

---

### Fix 4: Update `.github/PULL_REQUEST_TEMPLATE.md`

**Purpose**: Fix relative path to CONTRIBUTING.md

**Change Line 33**:

- From: `[conventional commit format](./CONTRIBUTING.md)`
- To: `[conventional commit format](../CONTRIBUTING.md)`

---

## P1 - High Priority Fixes

### Fix 5: Update `libs/angular-3d/README.md`

**Changes**:

1. **Line 3**: Change LICENSE badge URL from `(../../LICENSE)` to `(https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE)`

2. **Line 14**: Change `44 Components` to `54 Components`

3. **Add ThrusterFlameComponent** to Visual Effects table (after line 252):

   | ThrusterFlameComponent | `<a3d-thruster-flame>` | Thruster/rocket flame effect |

4. **Add HexagonalBackgroundInstancedComponent** to new Backgrounds section (after Visual Effects):

```markdown
### Backgrounds

| Component                             | Selector                               | Description                        |
| ------------------------------------- | -------------------------------------- | ---------------------------------- |
| HexagonalBackgroundInstancedComponent | `<a3d-hexagonal-background-instanced>` | GPU-instanced hexagonal background |
```

5. **Add MetaballComponent deprecation note** in Visual Effects section:

```markdown
> **Note**: `MetaballComponent` (`<a3d-metaball>`) is deprecated. Use the compositional API with `MetaballSceneComponent`, `MetaballSphereComponent`, and `MetaballCursorComponent` instead.
```

6. **Add Directives section** after Animation Directives (document all 24 directives):

```markdown
## Directives Reference

### Core Directives

| Directive          | Selector         | Description                     |
| ------------------ | ---------------- | ------------------------------- |
| MeshDirective      | `[a3dMesh]`      | Creates a Three.js Mesh         |
| GroupDirective     | `[a3dGroup]`     | Creates a Three.js Group        |
| TransformDirective | `[a3dTransform]` | Applies position/rotation/scale |

### Geometry Directives

| Directive                   | Selector                  | Description                |
| --------------------------- | ------------------------- | -------------------------- |
| BoxGeometryDirective        | `[a3dBoxGeometry]`        | Creates BoxGeometry        |
| SphereGeometryDirective     | `[a3dSphereGeometry]`     | Creates SphereGeometry     |
| CylinderGeometryDirective   | `[a3dCylinderGeometry]`   | Creates CylinderGeometry   |
| TorusGeometryDirective      | `[a3dTorusGeometry]`      | Creates TorusGeometry      |
| PolyhedronGeometryDirective | `[a3dPolyhedronGeometry]` | Creates PolyhedronGeometry |

### Material Directives

| Directive                 | Selector                | Description                       |
| ------------------------- | ----------------------- | --------------------------------- |
| StandardMaterialDirective | `[a3dStandardMaterial]` | Creates MeshStandardMaterial      |
| PhysicalMaterialDirective | `[a3dPhysicalMaterial]` | Creates MeshPhysicalMaterial      |
| NodeMaterialDirective     | `[a3dNodeMaterial]`     | Creates TSL NodeMaterial (WebGPU) |

### Light Directives

| Directive                 | Selector                | Description            |
| ------------------------- | ----------------------- | ---------------------- |
| LightDirective            | `[a3dLight]`            | Base light directive   |
| AmbientLightDirective     | `[a3dAmbientLight]`     | Adds ambient light     |
| PointLightDirective       | `[a3dPointLight]`       | Adds point light       |
| DirectionalLightDirective | `[a3dDirectionalLight]` | Adds directional light |
| SpotLightDirective        | `[a3dSpotLight]`        | Adds spot light        |

### Effect Directives

| Directive       | Selector      | Description              |
| --------------- | ------------- | ------------------------ |
| Glow3dDirective | `[a3dGlow3d]` | Adds glow effect to mesh |

### Positioning Directives

| Directive                 | Selector                | Description                              |
| ------------------------- | ----------------------- | ---------------------------------------- |
| ViewportPositionDirective | `[a3dViewportPosition]` | Positions 3D object relative to viewport |
```

7. **Add Services section** (document all 14 services):

```markdown
## Services Reference

| Service                             | Description                             |
| ----------------------------------- | --------------------------------------- |
| SceneService                        | Access to scene, camera, renderer       |
| RenderLoopService                   | Frame loop management and callbacks     |
| AnimationService                    | Flight waypoints, pulse animations      |
| GltfLoaderService                   | GLTF/GLB model loading with caching     |
| TextureLoaderService                | Texture loading with caching            |
| EffectComposerService               | Postprocessing effect chain management  |
| ViewportPositioningService          | Viewport-relative positioning utilities |
| ComponentRegistryService            | Component registration and lookup       |
| Angular3dStateStore                 | Signal-based application state          |
| SceneGraphStore                     | Scene graph node registry               |
| AdvancedPerformanceOptimizerService | Performance monitoring and optimization |
| RenderCallbackRegistryService       | Render callback management              |
| VisibilityObserverService           | Intersection observer utilities         |
| FontPreloadService                  | Font preloading for text components     |

### Injectable Functions

| Function              | Description                          |
| --------------------- | ------------------------------------ |
| injectGltfLoader()    | Modern DI pattern for GLTF loader    |
| injectTextureLoader() | Modern DI pattern for texture loader |
```

---

### Fix 6: Update `libs/angular-gsap/README.md`

**Changes**:

1. **Line 3**: Change LICENSE badge URL from `(../../LICENSE)` to `(https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE)`

2. **Lines 32-38**: Convert peer dependencies to table format:

```markdown
**Peer Dependencies**:

| Package           | Version | Purpose                      |
| ----------------- | ------- | ---------------------------- |
| `@angular/core`   | ~20.3.0 | Angular framework            |
| `@angular/common` | ~20.3.0 | Angular common utilities     |
| `gsap`            | ^3.14.2 | GreenSock Animation Platform |
| `lenis`           | ^1.3.16 | Smooth scroll library        |
```

3. **Add missing components** after HijackedScrollTimelineComponent (line 314):

```markdown
### ScrollTimelineComponent

Scroll-driven timeline with step indicators.

**Selector**: `<agsp-scroll-timeline>`

**Inputs**:

- `steps: StepData[]` - Array of step data
- `scrub?: boolean | number` - Link animation to scroll progress
- `markers?: boolean` - Show debug markers

---

### StepIndicatorComponent

Step indicator with progress visualization.

**Selector**: `<agsp-step-indicator>`

**Inputs**:

- `steps: StepData[]` - Array of step data
- `currentStep: number` - Currently active step index
- `progress: number` - Animation progress (0-1)

---

### Feature Showcase Components

#### FeatureShowcaseTimelineComponent

Scroll-driven feature showcase with alternating layouts.

**Selector**: `<agsp-feature-showcase-timeline>`

**Inputs**:

- `scrollHeightPerStep?: number` - Scroll height per feature (default: 150vh)
- `animationDuration?: number` - Animation duration in seconds
- `markers?: boolean` - Show debug markers

**Example**:

\`\`\`html
<agsp-feature-showcase-timeline>
<agsp-feature-step>
<span featureBadge>1</span>
<h3 featureTitle>Feature Title</h3>
<p featureDescription>Feature description here.</p>
<div featureNotes>
<span>Note 1</span>
<span>Note 2</span>
</div>
<img featureVisual src="feature.png" alt="Feature" />
<div featureDecoration>
<!-- Optional decorative element -->
</div>
</agsp-feature-step>
</agsp-feature-showcase-timeline>
\`\`\`

#### FeatureStepComponent

Individual feature step container.

**Selector**: `<agsp-feature-step>`

---

### Split Panel Components

#### SplitPanelSectionComponent

Parallax split-panel layout with sticky positioning.

**Selector**: `<agsp-split-panel-section>`

**Inputs**:

- `imagePosition?: 'left' | 'right'` - Image side position
- `parallaxStrength?: number` - Parallax movement strength

**Example**:

\`\`\`html
<agsp-split-panel-section [imagePosition]="'left'">
<img splitPanelImage src="feature.png" alt="Feature" />

  <div splitPanelBadge>1</div>
  <h3 splitPanelTitle>Feature Title</h3>
  <p splitPanelDescription>Feature description.</p>
  <div splitPanelFeatures>
    <span>Feature 1</span>
    <span>Feature 2</span>
  </div>
</agsp-split-panel-section>
\`\`\`

---

### ParallaxSplitScrollComponent

Container for parallax split-scroll sections.

**Selector**: `<agsp-parallax-split-scroll>`
```

4. **Add missing directives section**:

```markdown
---

## Directives Reference

### Scroll Directives

| Directive                   | Selector               | Description                      |
| --------------------------- | ---------------------- | -------------------------------- |
| ScrollAnimationDirective    | `[scrollAnimation]`    | Scroll-triggered GSAP animations |
| HijackedScrollDirective     | `[hijackedScroll]`     | Scroll hijacking container       |
| HijackedScrollItemDirective | `[hijackedScrollItem]` | Items within hijacked scroll     |
| ScrollSectionPinDirective   | `[scrollSectionPin]`   | Pin sections during scroll       |

### Other Directives

| Directive                  | Selector              | Description                     |
| -------------------------- | --------------------- | ------------------------------- |
| ViewportAnimationDirective | `[viewportAnimation]` | IntersectionObserver animations |
| SectionStickyDirective     | `[sectionSticky]`     | Sticky section behavior         |
| ParallaxSplitItemDirective | `[parallaxSplitItem]` | Parallax item in split layout   |
| LenisSmoothScrollDirective | `[lenisSmoothScroll]` | Enable Lenis smooth scrolling   |

### Feature Showcase Directives (Content Slots)

| Directive                   | Selector               | Description                   |
| --------------------------- | ---------------------- | ----------------------------- |
| FeatureBadgeDirective       | `[featureBadge]`       | Feature step badge slot       |
| FeatureTitleDirective       | `[featureTitle]`       | Feature step title slot       |
| FeatureDescriptionDirective | `[featureDescription]` | Feature step description slot |
| FeatureNotesDirective       | `[featureNotes]`       | Feature step notes slot       |
| FeatureVisualDirective      | `[featureVisual]`      | Feature step visual slot      |
| FeatureDecorationDirective  | `[featureDecoration]`  | Feature step decoration slot  |

### Split Panel Directives (Content Slots)

| Directive                      | Selector                  | Description                  |
| ------------------------------ | ------------------------- | ---------------------------- |
| SplitPanelImageDirective       | `[splitPanelImage]`       | Split panel image slot       |
| SplitPanelBadgeDirective       | `[splitPanelBadge]`       | Split panel badge slot       |
| SplitPanelTitleDirective       | `[splitPanelTitle]`       | Split panel title slot       |
| SplitPanelDescriptionDirective | `[splitPanelDescription]` | Split panel description slot |
| SplitPanelFeaturesDirective    | `[splitPanelFeatures]`    | Split panel features slot    |
```

5. **Add Services section**:

```markdown
---

## Services

### GsapCoreService

Core GSAP service for initialization and configuration.

**Methods**:
- `get gsap` - Access configured GSAP instance
- `registerPlugin(...plugins)` - Register additional GSAP plugins

**Example**:

\`\`\`typescript
@Component({ ... })
export class MyComponent {
  private gsapCore = inject(GsapCoreService);

  animate() {
    this.gsapCore.gsap.to('.element', { x: 100, duration: 1 });
  }
}
\`\`\`

---

### LenisSmoothScrollService

Lenis smooth scroll integration with GSAP.

**Methods**:

- `initialize(options?)` - Initialize Lenis with options
- `destroy()` - Clean up Lenis instance
- `scrollTo(target, options?)` - Scroll to target
- `stop()` / `start()` - Pause/resume smooth scrolling

**Properties**:

- `scroll$` - Observable of scroll events
- `progress$` - Observable of scroll progress (0-1)

**Example**:

\`\`\`typescript
@Component({ ... })
export class MyComponent {
private lenis = inject(LenisSmoothScrollService);

scrollToSection() {
this.lenis.scrollTo('#section-2', { duration: 1.5 });
}
}
\`\`\`
```

6. **Add Providers section**:

```markdown
---

## Configuration Providers

### provideGsap()

Configures GSAP globally using Angular's modern provider pattern.

**Usage**:

\`\`\`typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideGsap } from '@hive-academy/angular-gsap';

export const appConfig: ApplicationConfig = {
  providers: [
    provideGsap({
      defaults: {
        ease: 'power2.out',
        duration: 1,
      },
    }),
  ],
};
\`\`\`

**Options**:

\`\`\`typescript
interface GsapConfig {
  defaults?: gsap.TweenVars;  // Default tween properties
  plugins?: GSAPPlugin[];      // Additional plugins to register
}
\`\`\`

---

### provideLenis()

Configures Lenis smooth scrolling globally.

**Usage**:

\`\`\`typescript
// app.config.ts
import { provideGsap, provideLenis } from '@hive-academy/angular-gsap';

export const appConfig: ApplicationConfig = {
providers: [
provideGsap(), // GSAP must be provided first
provideLenis({
lerp: 0.1, // Smoothness (0.05-0.1 recommended)
wheelMultiplier: 1, // Mouse wheel speed
touchMultiplier: 2, // Touch swipe speed
smoothWheel: true, // Smooth mouse wheel
}),
],
};
\`\`\`

**Options**:

\`\`\`typescript
interface LenisServiceOptions {
lerp?: number; // Smoothness factor
wheelMultiplier?: number;// Mouse wheel sensitivity
touchMultiplier?: number;// Touch sensitivity
smoothWheel?: boolean; // Enable smooth wheel
useGsapTicker?: boolean; // Sync with GSAP ticker
}
\`\`\`
```

7. **Add CONTRIBUTING.md and CODE_OF_CONDUCT.md links** after line 443:

```markdown
## Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and follow the conventional commit format for all commits.

See [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for community guidelines.
```

---

## Files to Modify Summary

| File                               | Priority | Type    | Changes                                                 |
| ---------------------------------- | -------- | ------- | ------------------------------------------------------- |
| `libs/angular-3d/CLAUDE.md`        | P0       | Rewrite | Structure section, Public API section                   |
| `libs/angular-gsap/CLAUDE.md`      | P0       | Rewrite | Structure section, Public API section                   |
| `README.md`                        | P0       | Modify  | Component counts, code examples, LICENSE URL            |
| `.github/PULL_REQUEST_TEMPLATE.md` | P0       | Modify  | Fix CONTRIBUTING.md path                                |
| `libs/angular-3d/README.md`        | P1       | Modify  | Add missing components, directives, services            |
| `libs/angular-gsap/README.md`      | P1       | Modify  | Add missing components, directives, services, providers |

---

## Developer Assignment Recommendation

**Recommended Developer**: frontend-developer OR backend-developer

**Rationale**: This is documentation work that doesn't require specialized domain knowledge. Any developer can execute these changes by following the exact specifications in this plan.

**Estimated Effort**: 2-3 hours

**Complexity**: LOW - All changes are copy/paste with specific line numbers and content provided.

---

## Validation Checklist

After implementation, verify:

- [ ] All component counts in documentation match filesystem counts
- [ ] All exports in CLAUDE.md match actual `index.ts` exports
- [ ] All file paths in Structure sections exist in filesystem
- [ ] All selectors in documentation match actual component selectors
- [ ] LICENSE badge URLs are absolute GitHub URLs
- [ ] Code examples include `standalone: true` and `imports` arrays
- [ ] CONTRIBUTING.md path is correct (`../CONTRIBUTING.md` from `.github/`)
