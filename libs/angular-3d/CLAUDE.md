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
│   ├── canvas/                   # Scene container
│   │   ├── scene-3d.component.ts # Root scene component
│   │   └── scene.service.ts      # Scene/camera/renderer access
│   ├── render-loop/              # Animation frame management
│   │   ├── render-loop.service.ts
│   │   └── animation.service.ts
│   ├── primitives/               # 3D objects
│   │   ├── box.component.ts
│   │   ├── cylinder.component.ts
│   │   ├── torus.component.ts
│   │   ├── polyhedron.component.ts
│   │   ├── planet.component.ts
│   │   ├── star-field.component.ts
│   │   ├── nebula.component.ts
│   │   ├── text-3d.component.ts
│   │   ├── gltf-model.component.ts
│   │   ├── particle-system.component.ts
│   │   ├── group.component.ts
│   │   ├── fog.component.ts
│   │   ├── svg-icon.component.ts
│   │   └── lights/               # Light components
│   │       ├── ambient-light.component.ts
│   │       ├── directional-light.component.ts
│   │       ├── point-light.component.ts
│   │       ├── spot-light.component.ts
│   │       └── scene-lighting.component.ts
│   ├── directives/               # Animation behaviors
│   │   ├── float-3d.directive.ts
│   │   └── rotate-3d.directive.ts
│   ├── controls/                 # Camera controls
│   │   └── orbit-controls.component.ts
│   ├── loaders/                  # Asset loaders
│   │   ├── gltf-loader.service.ts
│   │   ├── texture-loader.service.ts
│   │   ├── inject-gltf-loader.ts
│   │   └── inject-texture-loader.ts
│   ├── postprocessing/           # Effects
│   │   ├── effect-composer.component.ts
│   │   ├── effect-composer.service.ts
│   │   └── effects/bloom-effect.component.ts
│   ├── store/                    # State management
│   │   ├── angular-3d-state.store.ts
│   │   └── component-registry.service.ts
│   ├── services/                 # Shared services
│   │   └── index.ts
│   └── types/                    # TypeScript types
│       ├── tokens.ts             # Injection tokens
│       └── mesh-provider.ts
└── index.ts                      # Public API exports
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
<a3d-box
  a3dFloat3d
  [floatSpeed]="1.5"
  [floatIntensity]="0.2" />
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
    this.mesh.material.forEach(m => m.dispose());
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

## Public API

```typescript
// Canvas
export { Scene3dComponent, CameraConfig, RendererConfig } from './lib/canvas';
export { SceneService } from './lib/canvas';

// Render Loop
export { RenderLoopService, UpdateCallback, FrameContext } from './lib/render-loop';

// Primitives
export { BoxComponent, CylinderComponent, TorusComponent } from './lib/primitives';
export { PlanetComponent, StarFieldComponent, NebulaComponent } from './lib/primitives';
export { GltfModelComponent, Text3dComponent, ParticleSystemComponent } from './lib/primitives';
export { AmbientLightComponent, DirectionalLightComponent } from './lib/primitives';

// Directives
export { Float3dDirective, Rotate3dDirective } from './lib/directives';

// Controls
export { OrbitControlsComponent } from './lib/controls';

// Loaders
export { GltfLoaderService, TextureLoaderService } from './lib/loaders';

// Postprocessing
export { EffectComposerComponent, BloomEffectComponent } from './lib/postprocessing';
```
