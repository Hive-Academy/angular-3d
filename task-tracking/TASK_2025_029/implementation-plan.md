# Implementation Plan - TASK_2025_029

## Prebuilt Hero Section Showcases

---

## Codebase Investigation Summary

### Libraries Discovered

**@hive-academy/angular-3d** (`D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\`)

- **Key Exports**: Scene3dComponent, SceneService, RenderLoopService, all primitives/directives
- **Documentation**: `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md`
- **Pattern**: NG_3D_PARENT token for parent-child relationships, DestroyRef for cleanup

### Patterns Identified

#### 1. Shader-Based Component Pattern (NebulaVolumetricComponent)

**Evidence**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts`

**Key Architecture**:

- Uses `NG_3D_PARENT` injection token for scene hierarchy (lines 84-86)
- Creates THREE.Group as container for meshes (line 89)
- Uses `effect()` for reactive updates to uniforms (lines 100-181)
- Uses `RenderLoopService.registerUpdateCallback()` for animation (lines 185-191)
- ShaderMaterial with uniforms object pattern (lines 244-272)
- Proper cleanup in `destroyRef.onDestroy()` (lines 194-208)

#### 2. Scene Component Pattern (HeroSpaceSceneComponent)

**Evidence**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\hero-space-scene.component.ts`

**Key Architecture**:

- Standalone Angular component with `ChangeDetectionStrategy.OnPush` (lines 29-30)
- Imports library components directly (Scene3dComponent, primitives, effects)
- Template-based composition using library components (lines 47-177)
- Host styles for display block (lines 190-194)

#### 3. Routing Pattern

**Evidence**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.routes.ts`

**Key Architecture**:

- Lazy-loaded scene components (lines 78-91)
- Routes nested under `/angular-3d/` path
- Pattern: `loadComponent: () => import(...).then((m) => m.ComponentName)`

### Integration Points

**SceneService** (`D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene.service.ts`)

- `scene()`, `camera()`, `renderer()` - readonly signals for Three.js objects
- `addToScene(object)`, `removeFromScene(object)` - object management
- `invalidate()` - request render in demand mode

**RenderLoopService** (`D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\render-loop\render-loop.service.ts`)

- `registerUpdateCallback((delta, elapsed) => void)` - per-frame updates
- Returns cleanup function for DestroyRef integration
- Supports 'always' and 'demand' frameloop modes

---

## Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Shader-Based Full-Screen Primitive (like NebulaVolumetricComponent)
**Rationale**: MetaballComponent requires custom fragment shader for ray marching; cannot use hostDirectives composition pattern
**Evidence**:

- NebulaVolumetricComponent uses same pattern (lines 48-537)
- Example code uses ShaderMaterial with full-screen quad (lines 786-1169)

### Component Specifications

---

### Component 1: MetaballComponent (Library Primitive)

**Purpose**: Render ray-marched metaballs with interactive cursor effects and configurable color presets

**Location**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts`

**Pattern**: Shader-based component with THREE.PlaneGeometry + ShaderMaterial
**Evidence**:

- NebulaVolumetricComponent pattern: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts:262`
- Example shader implementation: `D:\projects\angular-3d-workspace\temp\examples\hero-section-example\index.html:840-1169`

#### Responsibilities

1. Create full-screen PlaneGeometry (2x2) with ShaderMaterial
2. Manage shader uniforms for animation, mouse position, and presets
3. Handle mouse/touch events for cursor sphere tracking
4. Support adaptive quality detection (mobile vs desktop)
5. Provide 6 color presets with lighting configurations
6. Clean up all Three.js resources on destroy

#### Implementation Pattern

```typescript
// Pattern source: nebula-volumetric.component.ts:48-62
@Component({
  selector: 'a3d-metaball',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `metaball-${crypto.randomUUID()}`,
    },
  ],
})
export class MetaballComponent {
  // Signal inputs (from requirements)
  public readonly preset = input<MetaballPreset>('holographic');
  public readonly sphereCount = input<number>(6);
  public readonly smoothness = input<number>(0.3);
  public readonly animationSpeed = input<number>(0.6);
  public readonly movementScale = input<number>(1.2);

  // Cursor interaction
  public readonly cursorRadiusMin = input<number>(0.08);
  public readonly cursorRadiusMax = input<number>(0.15);
  public readonly cursorGlowIntensity = input<number>(0.4);
  public readonly cursorGlowRadius = input<number>(1.2);
  public readonly mouseProximityEffect = input<boolean>(true);
  public readonly mouseSmoothness = input<number>(0.1);

  // Performance
  public readonly enableAdaptiveQuality = input<boolean>(true);
  public readonly maxRayMarchSteps = input<number>(48);
  public readonly mobileRayMarchSteps = input<number>(16);

  // DI - Pattern source: nebula-volumetric.component.ts:84-86
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Internal Three.js objects
  private mesh!: THREE.Mesh;
  private material!: THREE.ShaderMaterial;
  private uniforms: Record<string, THREE.IUniform> = {};

  // Mouse tracking state
  private mousePosition = new THREE.Vector2(0.5, 0.5);
  private targetMousePosition = new THREE.Vector2(0.5, 0.5);
  private cursorSphere3D = new THREE.Vector3(0, 0, 0);
}
```

#### Shader Architecture

**Vertex Shader** (simple passthrough):

```glsl
// Pattern source: nebula-volumetric.component.ts:312-322
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
```

**Fragment Shader** (ray marching implementation from example):

```glsl
// Core functions from example (index.html:890-1080)
float smin(float a, float b, float k);      // Smooth minimum for blob blending
float sdSphere(vec3 p, float r);            // Sphere SDF
float sceneSDF(vec3 pos);                   // Combined scene distance field
vec3 calcNormal(vec3 p);                    // Normal calculation via gradient
float ambientOcclusion(vec3 p, vec3 n);     // 6-step AO sampling
float softShadow(vec3 ro, vec3 rd, ...);    // 20-step soft shadows
float rayMarch(vec3 ro, vec3 rd);           // Main ray marching loop
vec3 lighting(vec3 p, vec3 rd, float t);    // Full lighting model
```

#### Preset Configuration

```typescript
// Pattern source: index.html:517-716
export type MetaballPreset = 'moody' | 'cosmic' | 'neon' | 'sunset' | 'holographic' | 'minimal';

export interface MetaballPresetConfig {
  sphereCount: number;
  ambientIntensity: number;
  diffuseIntensity: number;
  specularIntensity: number;
  specularPower: number;
  fresnelPower: number;
  backgroundColor: THREE.Color;
  sphereColor: THREE.Color;
  lightColor: THREE.Color;
  lightPosition: THREE.Vector3;
  smoothness: number;
  contrast: number;
  fogDensity: number;
  cursorGlowIntensity: number;
  cursorGlowRadius: number;
  cursorGlowColor: THREE.Color;
}
```

#### Quality Requirements

**Functional Requirements**:

- Render ray-marched metaballs at 60fps (desktop) / 30fps (mobile)
- Cursor sphere follows mouse/touch with smooth interpolation
- Metaballs blend smoothly when approaching each other
- Support all 6 color presets with instant switching
- Adaptive quality reduces ray march steps on mobile/low-power devices

**Non-Functional Requirements**:

- Memory cleanup: Dispose geometry, material, textures on destroy
- Performance: Use adaptive quality detection via navigator.userAgent
- Browser compatibility: WebGL 2.0 required (Chrome 90+, Firefox 88+, Safari 15+)

**Pattern Compliance**:

- Must follow NG_3D_PARENT pattern (verified at nebula-volumetric.component.ts:84-86)
- Must use RenderLoopService for animation (verified at nebula-volumetric.component.ts:185-191)
- Must use DestroyRef for cleanup (verified at nebula-volumetric.component.ts:194-208)

#### Files Affected

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts` (CREATE)
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts` (MODIFY - add export)

---

### Component 2: MetaballHeroSceneComponent

**Purpose**: Demo scene showcasing MetaballComponent with preset selector UI

**Location**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\metaball-hero-scene.component.ts`

**Pattern**: Scene component pattern
**Evidence**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\cloud-hero-scene.component.ts`

#### Implementation Pattern

```typescript
// Pattern source: cloud-hero-scene.component.ts:25-143
@Component({
  selector: 'app-metaball-hero-scene',
  imports: [Scene3dComponent, MetaballComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d [cameraPosition]="[0, 0, 1]" [cameraFov]="75" [enableAntialiasing]="true" [alpha]="true" [backgroundColor]="backgroundColor()">
        <a3d-metaball [preset]="selectedPreset()" [sphereCount]="6" [mouseProximityEffect]="true" />
      </a3d-scene-3d>

      <!-- Preset Selector UI -->
      <div class="absolute bottom-4 left-4 z-20 flex gap-2">
        @for (preset of presets; track preset) {
        <button (click)="selectPreset(preset)" [class.active]="selectedPreset() === preset" class="preset-button">
          {{ preset }}
        </button>
        }
      </div>
    </div>
  `,
  styles: [
    /* ... */
  ],
})
export class MetaballHeroSceneComponent {
  public readonly selectedPreset = signal<MetaballPreset>('holographic');
  public readonly presets: MetaballPreset[] = ['moody', 'cosmic', 'neon', 'sunset', 'holographic', 'minimal'];

  public readonly backgroundColor = computed(() => {
    const presetColors = {
      moody: 0x050505,
      cosmic: 0x000011,
      neon: 0x000505,
      sunset: 0x150505,
      holographic: 0x0a0a15,
      minimal: 0x0a0a0a,
    };
    return presetColors[this.selectedPreset()];
  });

  public selectPreset(preset: MetaballPreset): void {
    this.selectedPreset.set(preset);
  }
}
```

#### Files Affected

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\metaball-hero-scene.component.ts` (CREATE)

---

### Component 3: CosmicPortalHeroSceneComponent

**Purpose**: Cinematic space scene with nebula, planet, and glowing text

**Location**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\cosmic-portal-hero-scene.component.ts`

**Pattern**: Scene component pattern with multiple existing primitives
**Evidence**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\hero-space-scene.component.ts`

#### Implementation Pattern

```typescript
// Pattern source: hero-space-scene.component.ts:29-211
@Component({
  selector: 'app-cosmic-portal-hero-scene',
  imports: [Scene3dComponent, AmbientLightComponent, DirectionalLightComponent, StarFieldComponent, PlanetComponent, NebulaVolumetricComponent, GlowTroikaTextComponent, Rotate3dDirective, OrbitControlsComponent, EffectComposerComponent, BloomEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative bg-background-dark overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="60">
        <!-- Lighting -->
        <a3d-ambient-light [intensity]="0.15" />
        <a3d-directional-light [position]="[10, 5, 10]" [intensity]="1.5" />

        <!-- Background -->
        <a3d-star-field [starCount]="4000" [radius]="60" [stellarColors]="true" />
        <a3d-nebula-volumetric [position]="[0, 0, -20]" [width]="80" [height]="40" [primaryColor]="'#8b5cf6'" [secondaryColor]="'#ec4899'" [opacity]="0.3" />

        <!-- Focal Elements -->
        <a3d-planet [position]="[-5, 0, 0]" [radius]="3" [textureUrl]="'/earth.jpg'" [glowIntensity]="0.6" rotate3d [rotateConfig]="{ axis: 'y', speed: 2 }" />

        <a3d-glow-troika-text [text]="'COSMIC PORTAL'" [fontSize]="2" [position]="[0, 5, 0]" [glowColor]="'#ec4899'" [glowIntensity]="3" />

        <!-- Post-processing -->
        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.8" [strength]="0.6" [radius]="0.4" />
        </a3d-effect-composer>

        <a3d-orbit-controls [autoRotate]="true" [autoRotateSpeed]="0.3" />
      </a3d-scene-3d>
    </div>
  `,
})
export class CosmicPortalHeroSceneComponent {}
```

#### Files Affected

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\cosmic-portal-hero-scene.component.ts` (CREATE)

---

### Component 4: FloatingGeometryHeroSceneComponent

**Purpose**: Interactive scene with floating polyhedrons and mouse tracking

**Location**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\floating-geometry-hero-scene.component.ts`

**Pattern**: Scene component with directives
**Evidence**:

- Float3dDirective: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\float-3d.directive.ts`
- MouseTracking3dDirective: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\mouse-tracking-3d.directive.ts`

#### Implementation Pattern

```typescript
@Component({
  selector: 'app-floating-geometry-hero-scene',
  imports: [Scene3dComponent, AmbientLightComponent, DirectionalLightComponent, PolyhedronComponent, EnvironmentComponent, Float3dDirective, MouseTracking3dDirective, OrbitControlsComponent, EffectComposerComponent, BloomEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="50">
        <a3d-ambient-light [intensity]="0.2" />
        <a3d-directional-light [position]="[5, 10, 5]" [intensity]="1.2" />
        <a3d-environment [preset]="'sunset'" [intensity]="0.5" />

        <!-- Floating Polyhedrons -->
        <a3d-polyhedron [type]="'icosahedron'" [position]="[-6, 2, 0]" [args]="[1.5, 0]" [color]="'#6366f1'" a3dFloat3d [floatSpeed]="1.2" [floatIntensity]="0.3" a3dMouseTracking3d />
        <!-- ... more polyhedrons ... -->

        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.9" [strength]="0.3" [radius]="0.5" />
        </a3d-effect-composer>

        <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" />
      </a3d-scene-3d>
    </div>
  `,
})
export class FloatingGeometryHeroSceneComponent {}
```

#### Files Affected

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\floating-geometry-hero-scene.component.ts` (CREATE)

---

### Component 5: ParticleStormHeroSceneComponent

**Purpose**: Dramatic particle text with star field background

**Location**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\particle-storm-hero-scene.component.ts`

**Pattern**: Scene component with text primitives
**Evidence**:

- ParticlesTextComponent: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\particles-text.component.ts`

#### Implementation Pattern

```typescript
@Component({
  selector: 'app-particle-storm-hero-scene',
  imports: [Scene3dComponent, AmbientLightComponent, StarFieldComponent, ParticlesTextComponent, EffectComposerComponent, BloomEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d [cameraPosition]="[0, 0, 15]" [cameraFov]="60" [backgroundColor]="0x0a0a0f">
        <a3d-ambient-light [intensity]="0.1" />

        <!-- Multi-layer star fields -->
        <a3d-star-field [starCount]="3000" [radius]="50" [size]="0.03" [stellarColors]="true" />
        <a3d-star-field [starCount]="2000" [radius]="70" [size]="0.02" [opacity]="0.6" />

        <!-- Particle text hero -->
        <a3d-particles-text [text]="'PARTICLE STORM'" [fontSize]="80" [fontScaleFactor]="0.06" [particleColor]="0x00d4ff" [opacity]="0.25" [maxParticleScale]="0.12" [particlesPerPixel]="2" [blendMode]="'additive'" [position]="[0, 0, 0]" />

        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.6" [strength]="0.8" [radius]="0.5" />
        </a3d-effect-composer>
      </a3d-scene-3d>
    </div>
  `,
})
export class ParticleStormHeroSceneComponent {}
```

#### Files Affected

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\particle-storm-hero-scene.component.ts` (CREATE)

---

### Component 6: BubbleDreamHeroSceneComponent

**Purpose**: Whimsical bubble text with volumetric nebula background

**Location**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\bubble-dream-hero-scene.component.ts`

**Pattern**: Scene component with text primitives
**Evidence**:

- BubbleTextComponent: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\bubble-text.component.ts`

#### Implementation Pattern

```typescript
@Component({
  selector: 'app-bubble-dream-hero-scene',
  imports: [Scene3dComponent, AmbientLightComponent, DirectionalLightComponent, NebulaVolumetricComponent, BubbleTextComponent, EffectComposerComponent, BloomEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d [cameraPosition]="[0, 0, 12]" [cameraFov]="55" [backgroundColor]="0x0f0520">
        <a3d-ambient-light [intensity]="0.3" />
        <a3d-directional-light [position]="[0, 5, 5]" [intensity]="0.8" />

        <!-- Dreamy nebula background -->
        <a3d-nebula-volumetric [position]="[0, 0, -15]" [width]="40" [height]="25" [primaryColor]="'#d946ef'" [secondaryColor]="'#8b5cf6'" [opacity]="0.4" />

        <!-- Bubble text -->
        <a3d-bubble-text [text]="'BUBBLE DREAM'" [fontSize]="70" [fontScaleFactor]="0.07" [bubbleRadius]="0.15" [maxBubbleScale]="0.8" [enableFlying]="true" [flyingRatio]="0.08" [position]="[0, 0, 0]" />

        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.7" [strength]="0.4" [radius]="0.6" />
        </a3d-effect-composer>
      </a3d-scene-3d>
    </div>
  `,
})
export class BubbleDreamHeroSceneComponent {}
```

#### Files Affected

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\bubble-dream-hero-scene.component.ts` (CREATE)

---

### Component 7: CrystalGridHeroSceneComponent

**Purpose**: Geometric torus shapes with wireframe and glow effects

**Location**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\crystal-grid-hero-scene.component.ts`

**Pattern**: Scene component with directives
**Evidence**:

- TorusComponent: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\torus.component.ts`
- Rotate3dDirective: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\rotate-3d.directive.ts`
- Glow3dDirective: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\glow-3d.directive.ts`

#### Implementation Pattern

```typescript
@Component({
  selector: 'app-crystal-grid-hero-scene',
  imports: [Scene3dComponent, AmbientLightComponent, PointLightComponent, TorusComponent, Rotate3dDirective, Glow3dDirective, OrbitControlsComponent, EffectComposerComponent, BloomEffectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative overflow-hidden" style="height: calc(100vh - 180px);">
      <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="50" [backgroundColor]="0x050510">
        <a3d-ambient-light [intensity]="0.15" />
        <a3d-point-light [position]="[0, 0, 10]" [intensity]="1" [color]="'#00ffff'" />

        <!-- Crystal grid of rotating torus shapes -->
        <a3d-torus [position]="[-8, 4, 0]" [args]="[2, 0.5, 16, 50]" [color]="'#00ffff'" [wireframe]="true" [emissive]="'#00ffff'" [emissiveIntensity]="2" rotate3d [rotateConfig]="{ axis: 'y', speed: 1 }" a3dGlow3d [glowColor]="0x00ffff" [glowIntensity]="0.3" />

        <!-- More torus shapes with different colors/positions -->

        <a3d-effect-composer>
          <a3d-bloom-effect [threshold]="0.5" [strength]="1.2" [radius]="0.4" />
        </a3d-effect-composer>

        <a3d-orbit-controls [autoRotate]="true" [autoRotateSpeed]="0.5" />
      </a3d-scene-3d>
    </div>
  `,
})
export class CrystalGridHeroSceneComponent {}
```

#### Files Affected

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\crystal-grid-hero-scene.component.ts` (CREATE)

---

## Integration Architecture

### Route Integration

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.routes.ts`

```typescript
// Add routes under angular-3d children (after existing routes)
{
  path: 'metaball',
  loadComponent: () =>
    import('./pages/angular-3d-showcase/scenes/metaball-hero-scene.component')
      .then((m) => m.MetaballHeroSceneComponent),
  title: 'Metaball Hero | Angular-3D',
},
{
  path: 'cosmic-portal',
  loadComponent: () =>
    import('./pages/angular-3d-showcase/scenes/cosmic-portal-hero-scene.component')
      .then((m) => m.CosmicPortalHeroSceneComponent),
  title: 'Cosmic Portal | Angular-3D',
},
{
  path: 'floating-geometry',
  loadComponent: () =>
    import('./pages/angular-3d-showcase/scenes/floating-geometry-hero-scene.component')
      .then((m) => m.FloatingGeometryHeroSceneComponent),
  title: 'Floating Geometry | Angular-3D',
},
{
  path: 'particle-storm',
  loadComponent: () =>
    import('./pages/angular-3d-showcase/scenes/particle-storm-hero-scene.component')
      .then((m) => m.ParticleStormHeroSceneComponent),
  title: 'Particle Storm | Angular-3D',
},
{
  path: 'bubble-dream',
  loadComponent: () =>
    import('./pages/angular-3d-showcase/scenes/bubble-dream-hero-scene.component')
      .then((m) => m.BubbleDreamHeroSceneComponent),
  title: 'Bubble Dream | Angular-3D',
},
{
  path: 'crystal-grid',
  loadComponent: () =>
    import('./pages/angular-3d-showcase/scenes/crystal-grid-hero-scene.component')
      .then((m) => m.CrystalGridHeroSceneComponent),
  title: 'Crystal Grid | Angular-3D',
},
```

### Library Export Integration

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts`

```typescript
// Add at end of file
export * from './metaball.component';
```

---

## Quality Requirements (Architecture-Level)

### Functional Requirements

1. All 6 hero scenes render without errors on desktop and mobile
2. MetaballComponent supports all 6 color presets with smooth switching
3. Mouse/touch interaction works correctly in MetaballComponent
4. All existing components (ParticlesText, BubbleText, etc.) integrate correctly
5. Routes are lazy-loaded and accessible at specified paths

### Non-Functional Requirements

**Performance**:

- Desktop: 60 FPS sustained
- Mobile: 30 FPS minimum
- MetaballComponent: Adaptive ray march steps (48 desktop, 16 mobile)
- Memory usage: < 150MB (desktop), < 100MB (mobile)

**Security**:

- No external script loading
- All shaders are inline GLSL strings

**Maintainability**:

- Follow existing component patterns (NebulaVolumetricComponent)
- Use signal-based inputs for reactive updates
- Proper resource cleanup via DestroyRef

**Testability**:

- All components can be rendered in isolation
- MetaballComponent presets can be programmatically switched

### Pattern Compliance

**All components must follow verified patterns**:

1. **NG_3D_PARENT Token** (verified: nebula-volumetric.component.ts:84-86)

   ```typescript
   private readonly parent = inject(NG_3D_PARENT);
   ```

2. **RenderLoopService Integration** (verified: nebula-volumetric.component.ts:185-191)

   ```typescript
   this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => { ... });
   ```

3. **DestroyRef Cleanup** (verified: nebula-volumetric.component.ts:194-208)

   ```typescript
   this.destroyRef.onDestroy(() => {
     if (this.renderLoopCleanup) this.renderLoopCleanup();
     // Dispose geometry, material, textures
   });
   ```

4. **Signal-Based Inputs** (verified: nebula-volumetric.component.ts:64-81)

   ```typescript
   public readonly position = input<[number, number, number]>([0, 0, 0]);
   ```

5. **Effect-Based Reactive Updates** (verified: nebula-volumetric.component.ts:100-181)
   ```typescript
   effect(() => {
     const parent = this.parent();
     if (parent && !this.isAddedToScene) {
       parent.add(this.group);
       this.isAddedToScene = true;
     }
   });
   ```

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. Primary work is Angular component creation (6 scene components)
2. Shader code is provided in example - needs porting, not invention
3. All patterns are established (NebulaVolumetricComponent reference)
4. No backend/API integration required
5. Browser APIs for mouse/touch events
6. Three.js integration patterns already established

### Complexity Assessment

**Complexity**: HIGH
**Estimated Effort**: 16-24 hours

**Breakdown**:

- MetaballComponent (new shader primitive): 6-8 hours
  - Shader porting from example: 3-4 hours
  - Angular integration: 2-3 hours
  - Mouse/touch events: 1 hour
- 6 Scene Components: 8-12 hours (1-2 hours each)
  - Template composition with existing components
  - Styling and UI overlays
  - Testing and adjustments
- Route Integration: 1 hour
- Testing & Polish: 2-4 hours

### Files Affected Summary

**CREATE**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\metaball-hero-scene.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\cosmic-portal-hero-scene.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\floating-geometry-hero-scene.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\particle-storm-hero-scene.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\bubble-dream-hero-scene.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\crystal-grid-hero-scene.component.ts`

**MODIFY**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts` (add export)
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.routes.ts` (add 6 routes)

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **All imports exist in codebase**:

   - `NG_3D_PARENT` from `@hive-academy/angular-3d` (lib/types/tokens.ts)
   - `RenderLoopService` from `@hive-academy/angular-3d` (lib/render-loop/render-loop.service.ts)
   - `OBJECT_ID` from `@hive-academy/angular-3d` (lib/tokens/object-id.token.ts)
   - All primitive components (Scene3dComponent, StarFieldComponent, etc.)

2. **All patterns verified from examples**:

   - NebulaVolumetricComponent shader pattern
   - HeroSpaceSceneComponent scene composition pattern
   - CloudHeroSceneComponent UI overlay pattern

3. **Library documentation consulted**:

   - `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md`

4. **No hallucinated APIs**:
   - All THREE.js APIs verified against three@0.182 types
   - All Angular APIs verified against Angular 20.3

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended
- [x] Complexity assessed
- [x] No step-by-step implementation (that's team-leader's job)

---

## Risk Mitigations

### Technical Risks

| Risk                                  | Probability | Impact | Mitigation                                                    | Contingency                                    |
| ------------------------------------- | ----------- | ------ | ------------------------------------------------------------- | ---------------------------------------------- |
| Shader compilation fails on some GPUs | Medium      | High   | Test on multiple GPU vendors; use mediump precision on mobile | Simple material fallback without ray marching  |
| Performance issues on low-end mobile  | High        | Medium | Aggressive quality reduction; early device detection          | Static image fallback for very low-end devices |
| Memory leaks from improper cleanup    | Medium      | High   | Strict DestroyRef usage; follow NebulaVolumetric pattern      | Add explicit dispose() methods                 |
| Ray marching precision issues         | Low         | Medium | Use appropriate EPSILON values (0.001); test edge cases       | Increase EPSILON or reduce complexity          |

### Implementation Risks

| Risk                            | Probability | Impact | Mitigation                                                  | Contingency                      |
| ------------------------------- | ----------- | ------ | ----------------------------------------------------------- | -------------------------------- |
| MetaballComponent complexity    | Medium      | High   | Incremental implementation; reference example code directly | Simplify shader, reduce features |
| Component integration conflicts | Low         | Medium | Test with existing demo scenes; isolated development        | Namespace shader uniforms        |
| Build/bundle size increase      | Medium      | Low    | Tree-shaking; lazy loading                                  | Code splitting by route          |

---

## Appendix: Key Shader Code Reference

The MetaballComponent shader must implement these core functions from the reference example (`D:\projects\angular-3d-workspace\temp\examples\hero-section-example\index.html`):

### Core SDF Functions (lines 890-900)

```glsl
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

float sdSphere(vec3 p, float r) {
  return length(p) - r;
}
```

### Scene SDF (lines 913-1002)

```glsl
float sceneSDF(vec3 pos) {
  float result = MAX_DIST;

  // Fixed spheres at corners
  vec3 topLeftPos = screenToWorld(vec2(0.08, 0.92));
  float topLeft = sdSphere(pos - topLeftPos, uFixedTopLeftRadius);
  // ... more fixed spheres ...

  // Moving spheres with orbital animation
  for (int i = 0; i < 10; i++) {
    if (i >= uSphereCount) break;
    // ... orbital motion calculation ...
    float movingSphere = sdSphere(pos - offset, radius);
    result = smin(result, movingSphere, blend);
  }

  // Cursor sphere
  float cursorBall = sdSphere(pos - uCursorSphere, uCursorRadius);
  result = smin(result, cursorBall, uSmoothness);

  return result;
}
```

### Lighting Model (lines 1082-1126)

```glsl
vec3 lighting(vec3 p, vec3 rd, float t) {
  vec3 normal = calcNormal(p);
  vec3 viewDir = -rd;

  float ao = ambientOcclusion(p, normal);
  vec3 ambient = uLightColor * uAmbientIntensity * ao;

  vec3 lightDir = normalize(uLightPosition);
  float diff = max(dot(normal, lightDir), 0.0);
  float shadow = softShadow(p, lightDir, 0.01, 10.0, 20.0);
  vec3 diffuse = uLightColor * diff * uDiffuseIntensity * shadow;

  vec3 reflectDir = reflect(-lightDir, normal);
  float spec = pow(max(dot(viewDir, reflectDir), 0.0), uSpecularPower);
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), uFresnelPower);
  vec3 specular = uLightColor * spec * uSpecularIntensity * fresnel;

  vec3 fresnelRim = uLightColor * fresnel * 0.4;

  return (uSphereColor + ambient + diffuse + specular + fresnelRim) * ao;
}
```

### Ray Marching Main Loop (lines 1058-1080)

```glsl
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  int maxSteps = uIsMobile > 0.5 ? 16 : 48;

  for (int i = 0; i < 48; i++) {
    if (i >= maxSteps) break;
    vec3 p = ro + rd * t;
    float d = sceneSDF(p);

    if (d < EPSILON) return t;
    if (t > 5.0) break;

    t += d * (uIsLowPower > 0.5 ? 1.2 : 0.9);
  }

  return -1.0;
}
```

---

## Document History

| Version | Date       | Author                   | Changes                     |
| ------- | ---------- | ------------------------ | --------------------------- |
| 1.0     | 2025-12-26 | Software Architect Agent | Initial implementation plan |
