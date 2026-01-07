# @hive-academy/angular-3d

[Back to Main](../../CLAUDE.md)

## Purpose

Angular library wrapping Three.js for declarative 3D graphics. Provides components, directives, and services for building 3D experiences in Angular applications.

## Boundaries

**Belongs here**:

- Three.js component wrappers (scene, primitives, lights)
- Animation directives (float, rotate)
- Services (scene management, render loop, loaders)
- Postprocessing effects (bloom, composer)
- Orbit controls

**Does NOT belong**:

- GSAP/scroll animations (use `@hive-academy/angular-gsap`)
- Application-specific 3D scenes
- Demo/showcase code

## Structure

```
src/
├── lib/
│   ├── canvas/                      # Scene container
│   │   ├── scene-3d.component.ts    # Root scene component
│   │   └── scene.service.ts         # Scene/camera/renderer access
│   ├── render-loop/                 # Animation frame management
│   │   ├── render-loop.service.ts   # Frame loop and callbacks
│   │   └── animation.service.ts     # Flight waypoints, pulse animations
│   ├── controls/                    # Camera controls
│   │   └── orbit-controls.component.ts
│   ├── loaders/                     # Asset loading
│   │   ├── gltf-loader.service.ts   # GLTF/GLB model loading
│   │   ├── texture-loader.service.ts # Texture loading with caching
│   │   ├── inject-gltf-loader.ts    # Injectable function pattern
│   │   └── inject-texture-loader.ts # Injectable function pattern
│   ├── primitives/                  # 3D components
│   │   ├── geometry/                # Basic shapes (6 components)
│   │   │   ├── box.component.ts
│   │   │   ├── sphere.component.ts
│   │   │   ├── cylinder.component.ts
│   │   │   ├── torus.component.ts
│   │   │   ├── polyhedron.component.ts
│   │   │   └── floating-sphere.component.ts
│   │   ├── lights/                  # Light components (5 components)
│   │   │   ├── ambient-light.component.ts
│   │   │   ├── directional-light.component.ts
│   │   │   ├── point-light.component.ts
│   │   │   ├── spot-light.component.ts
│   │   │   └── scene-lighting.component.ts
│   │   ├── text/                    # Text rendering (7 components)
│   │   │   ├── troika-text.component.ts
│   │   │   ├── responsive-troika-text.component.ts
│   │   │   ├── glow-troika-text.component.ts
│   │   │   ├── smoke-troika-text.component.ts
│   │   │   ├── particles-text.component.ts
│   │   │   ├── bubble-text.component.ts
│   │   │   └── extruded-text-3d.component.ts
│   │   ├── space/                   # Space-themed (5 components)
│   │   │   ├── planet.component.ts
│   │   │   ├── star-field.component.ts
│   │   │   ├── nebula.component.ts
│   │   │   ├── nebula-volumetric.component.ts
│   │   │   └── cloud-layer.component.ts
│   │   ├── particles/               # Particle systems (5 components)
│   │   │   ├── particle-system.component.ts
│   │   │   ├── marble-particle-system.component.ts
│   │   │   ├── gpu-particle-sphere.component.ts
│   │   │   ├── sparkle-corona.component.ts
│   │   │   └── particle-cloud.component.ts
│   │   ├── effects/                 # Visual effects (8 components)
│   │   │   ├── metaball/            # Compositional metaball system
│   │   │   │   ├── metaball-scene.component.ts
│   │   │   │   ├── metaball-sphere.component.ts
│   │   │   │   ├── metaball-cursor.component.ts
│   │   │   │   ├── mouse-tracker.service.ts
│   │   │   │   ├── tsl-metaball-sdf.ts
│   │   │   │   ├── tsl-metaball-lighting.ts
│   │   │   │   └── presets.ts
│   │   │   ├── metaball.component.ts  # Deprecated - use compositional API
│   │   │   ├── marble-sphere.component.ts
│   │   │   ├── background-cubes.component.ts
│   │   │   ├── fire-sphere.component.ts
│   │   │   └── thruster-flame.component.ts
│   │   ├── scene/                   # Scene organization (5 components)
│   │   │   ├── group.component.ts
│   │   │   ├── fog.component.ts
│   │   │   ├── environment.component.ts
│   │   │   ├── background-cube.component.ts
│   │   │   └── instanced-mesh.component.ts
│   │   ├── loaders/                 # Asset loader components (2)
│   │   │   ├── gltf-model.component.ts
│   │   │   └── svg-icon.component.ts
│   │   ├── backgrounds/             # Background shaders (1 component)
│   │   │   └── hexagonal-background-instanced.component.ts
│   │   └── shaders/                 # TSL utilities (40+ exports)
│   │       ├── tsl-utilities.ts     # Fresnel, fog, caustics
│   │       ├── tsl-raymarching.ts   # SDF, ray marching, shadows
│   │       ├── tsl-marble.ts        # Marble material
│   │       └── tsl-textures/        # Procedural textures
│   │           ├── materials.ts     # Marble, wood, rust
│   │           ├── patterns.ts      # Grid, dots, voronoi, bricks
│   │           ├── shapes.ts        # Supersphere, melter
│   │           ├── space.ts         # Planet, stars, photosphere
│   │           └── organic.ts       # Brain, veins, clay
│   ├── directives/                  # Animation behaviors (27 total)
│   │   ├── animation/               # Animation directives (6)
│   │   │   ├── float-3d.directive.ts
│   │   │   ├── rotate-3d.directive.ts
│   │   │   ├── space-flight-3d.directive.ts
│   │   │   ├── cinematic-entrance.directive.ts  # Camera entrance animations
│   │   │   ├── scene-reveal.directive.ts        # Object reveal animations
│   │   │   └── stagger-group.service.ts         # Stagger coordination
│   │   ├── core/                    # Core directives (3)
│   │   │   ├── mesh.directive.ts
│   │   │   ├── group.directive.ts
│   │   │   └── transform.directive.ts
│   │   ├── interaction/             # Interaction directives (3)
│   │   │   ├── mouse-tracking-3d.directive.ts
│   │   │   ├── scroll-zoom-coordinator.directive.ts
│   │   │   └── performance-3d.directive.ts
│   │   ├── effects/                 # Effect directives (1)
│   │   │   └── glow-3d.directive.ts
│   │   ├── geometries/              # Geometry directives (5)
│   │   │   ├── box-geometry.directive.ts
│   │   │   ├── sphere-geometry.directive.ts
│   │   │   ├── cylinder-geometry.directive.ts
│   │   │   ├── torus-geometry.directive.ts
│   │   │   └── polyhedron-geometry.directive.ts
│   │   ├── materials/               # Material directives (3)
│   │   │   ├── standard-material.directive.ts
│   │   │   ├── physical-material.directive.ts
│   │   │   └── node-material.directive.ts
│   │   └── lights/                  # Light directives (5)
│   │       ├── light.directive.ts   # Base light directive
│   │       ├── ambient-light.directive.ts
│   │       ├── point-light.directive.ts
│   │       ├── directional-light.directive.ts
│   │       └── spot-light.directive.ts
│   ├── postprocessing/              # Effects (8 components, 1 service)
│   │   ├── effect-composer.component.ts
│   │   ├── effect-composer.service.ts
│   │   └── effects/
│   │       ├── bloom-effect.component.ts
│   │       ├── selective-bloom-effect.component.ts
│   │       ├── dof-effect.component.ts
│   │       ├── ssao-effect.component.ts
│   │       ├── color-grading-effect.component.ts
│   │       ├── chromatic-aberration-effect.component.ts
│   │       └── film-grain-effect.component.ts
│   ├── positioning/                 # Viewport positioning
│   │   ├── viewport-positioning.service.ts
│   │   ├── viewport-positioning.types.ts
│   │   └── viewport-position.directive.ts
│   ├── store/                       # State management
│   │   ├── angular-3d-state.store.ts
│   │   ├── scene-graph.store.ts
│   │   └── component-registry.service.ts
│   ├── services/                    # Shared services
│   │   ├── advanced-performance-optimizer.service.ts
│   │   ├── render-callback-registry.service.ts
│   │   ├── visibility-observer.service.ts
│   │   ├── font-preload.service.ts
│   │   └── text-sampling.service.ts
│   ├── tokens/                      # Injection tokens
│   │   ├── object-id.token.ts
│   │   ├── geometry.token.ts
│   │   └── material.token.ts
│   └── types/                       # TypeScript types
│       ├── tokens.ts                # NG_3D_PARENT token
│       └── attachable-3d-child.ts   # NG_3D_CHILD token
└── index.ts                         # Public API exports
```

## Key Files

- `canvas/scene-3d.component.ts` - Root container, creates WebGLRenderer, Scene, Camera
- `render-loop/render-loop.service.ts` - Manages requestAnimationFrame loop
- `canvas/scene.service.ts` - Provides access to Three.js objects via DI
- `types/tokens.ts` - `NG_3D_PARENT` token for parent-child relationships

## Dependencies

**External**:

- `three` - Three.js core
- `three-stdlib` - Additional Three.js utilities
- `maath` - Math utilities for 3D

## Commands

```bash
# Building
npx nx build @hive-academy/angular-3d          # Production build
npx nx build @hive-academy/angular-3d:development

# Testing
npx nx test @hive-academy/angular-3d           # Run tests
npx nx test @hive-academy/angular-3d --watch   # Watch mode

# Linting
npx nx lint @hive-academy/angular-3d
npx nx typecheck @hive-academy/angular-3d

# Publishing
npx nx run @hive-academy/angular-3d:nx-release-publish
```

## Guidelines

### Component Pattern

All primitives follow this pattern:

```typescript
@Component({
  selector: 'a3d-box',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
})
export class BoxComponent {
  // Signal inputs for reactive updates
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly color = input<string | number>('#ffffff');

  // Inject parent and services
  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Three.js object
  private mesh!: THREE.Mesh;

  constructor() {
    afterNextRender(() => {
      this.createMesh();
      this.parent().add(this.mesh);

      // Register for per-frame updates
      const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
        // Animation logic
      });

      this.destroyRef.onDestroy(() => {
        cleanup();
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
        this.parent().remove(this.mesh);
      });
    });
  }
}
```

### Animation Directives

Directives add behavior to primitives:

```html
<a3d-box a3dFloat3d [floatSpeed]="1.5" [floatIntensity]="0.2" />
```

### Parent-Child Relationships

Use `NG_3D_PARENT` token:

```typescript
// Child component
private readonly parent = inject(NG_3D_PARENT);

constructor() {
  afterNextRender(() => {
    this.parent().add(this.object3d);
  });
}
```

### Resource Cleanup

Always dispose Three.js resources:

```typescript
this.destroyRef.onDestroy(() => {
  this.mesh.geometry.dispose();
  if (Array.isArray(this.mesh.material)) {
    this.mesh.material.forEach((m) => m.dispose());
  } else {
    this.mesh.material.dispose();
  }
  this.parent().remove(this.mesh);
});
```

### Render Loop Integration

Use `RenderLoopService` for animations:

```typescript
const cleanup = this.renderLoop.registerUpdateCallback((delta, elapsed) => {
  this.mesh.rotation.y += delta * this.rotationSpeed();
});

this.destroyRef.onDestroy(cleanup);
```

### Loading & Entrance Animations

Orchestrate asset loading with cinematic camera entrances:

```typescript
// In component
private preloader = inject(AssetPreloaderService);
private stagger = inject(StaggerGroupService);

preloadState = this.preloader.preload([
  { url: '/model.glb', type: 'gltf' },
  { url: '/texture.jpg', type: 'texture' }
]);

entranceConfig: CinematicEntranceConfig = {
  preset: 'dolly-in',  // or 'orbit-drift', 'crane-up', 'fade-drift'
  duration: 2.5,
  preloadState: this.preloadState,
};

async onEntranceComplete() {
  await this.stagger.revealGroup('myGroup', 150);
}
```

```html
<a3d-orbit-controls a3dCinematicEntrance [entranceConfig]="entranceConfig" (entranceComplete)="onEntranceComplete()"> </a3d-orbit-controls>

<a3d-box a3dSceneReveal [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'myGroup' }"> </a3d-box>
```

## Public API

The library exports are organized by module. Import from `@hive-academy/angular-3d`:

```typescript
// Canvas - Scene container
export { Scene3dComponent, SceneService, CameraConfig, RendererConfig } from '@hive-academy/angular-3d';

// Render Loop - Frame management
export { RenderLoopService, AnimationService, UpdateCallback, FrameContext, FrameloopMode, FlightWaypoint, PulseConfig } from '@hive-academy/angular-3d';

// Controls
export { OrbitControlsComponent } from '@hive-academy/angular-3d';

// Store - State management
export { Angular3dStateStore, ComponentRegistryService, SceneGraphStore } from '@hive-academy/angular-3d';

// Tokens - DI tokens
export { NG_3D_PARENT, NG_3D_CHILD, OBJECT_ID, GEOMETRY_SIGNAL, MATERIAL_SIGNAL } from '@hive-academy/angular-3d';

// Loaders - Asset loading
export { GltfLoaderService, TextureLoaderService, injectGltfLoader, injectTextureLoader } from '@hive-academy/angular-3d';

// Loading & Entrance Animations
export { AssetPreloaderService, type AssetDefinition, type AssetType, type PreloadState, CinematicEntranceDirective, type CinematicEntranceConfig, type EntrancePreset, SceneRevealDirective, type SceneRevealConfig, type RevealAnimation, StaggerGroupService, type RevealableDirective } from '@hive-academy/angular-3d';

// Primitives - All 54 components via barrel exports
export * from '@hive-academy/angular-3d'; // Includes all geometry, lights, text, space, particles, effects, scene, loaders, backgrounds

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
export { EffectComposerComponent, EffectComposerService, BloomEffectComponent, SelectiveBloomEffectComponent, DofEffectComponent, SsaoEffectComponent, ColorGradingEffectComponent, ChromaticAberrationEffectComponent, FilmGrainEffectComponent } from '@hive-academy/angular-3d';

// Positioning
export { ViewportPositioningService } from '@hive-academy/angular-3d';

// Services
export { AdvancedPerformanceOptimizerService, RenderCallbackRegistryService, VisibilityObserverService, FontPreloadService } from '@hive-academy/angular-3d';

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
```
