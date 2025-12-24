# Implementation Plan - TASK_2025_025

# Angular-3D Showcase Page Redesign

## 📊 Codebase Investigation Summary

### Libraries Discovered

- **@hive-academy/angular-3d**: Complete Three.js Angular wrapper library
  - Location: `D:\projects\angular-3d-workspace\libs\angular-3d\`
  - Public API: `libs\angular-3d\src\index.ts`
  - Documentation: `libs\angular-3d\CLAUDE.md`

### Components Available (100% Verified from Public API)

#### Primitives (17 components verified)

**Evidence**: `libs\angular-3d\src\lib\primitives\index.ts`

**Basic Geometries (6)**:

- BoxComponent (line 4)
- CylinderComponent (line 5)
- TorusComponent (line 15)
- PolyhedronComponent (line 12) - 5 types: tetrahedron, octahedron, dodecahedron, icosahedron, custom
- FloatingSphereComponent (line 31)
- GroupComponent (line 8)

**Space Elements (4)**:

- PlanetComponent (line 11)
- StarFieldComponent (line 13)
- NebulaComponent (line 9)
- NebulaVolumetricComponent (line 28)

**Advanced Components (4)**:

- GltfModelComponent (line 7)
- ParticleSystemComponent (line 10)
- SvgIconComponent (line 14)
- FogComponent (line 6)

**Environment Components (2)**:

- BackgroundCubeComponent (line 34)
- BackgroundCubesComponent (line 35)

#### Text Components (6 components verified)

**Evidence**: `libs\angular-3d\src\lib\primitives\text\index.ts`

- TroikaTextComponent (line 14)
- ResponsiveTroikaTextComponent (line 15)
- GlowTroikaTextComponent (line 16)
- SmokeTroikaTextComponent (line 17)
- ParticlesTextComponent (line 18)
- BubbleTextComponent (line 19)

#### Light Components (5 components verified)

**Evidence**: `libs\angular-3d\src\lib\primitives\index.ts` lines 18-22

- AmbientLightComponent
- DirectionalLightComponent
- PointLightComponent
- SpotLightComponent
- SceneLightingComponent

#### Directives (15+ verified)

**Evidence**: `libs\angular-3d\src\lib\directives\index.ts`

**Animation Directives**:

- Float3dDirective (line 4)
- Rotate3dDirective (line 5)
- SpaceFlight3dDirective (line 35)

**Visual Effect Directives**:

- Glow3dDirective (line 32)

**Interaction Directives**:

- MouseTracking3dDirective (line 40)

**Performance Directives**:

- Performance3dDirective (line 38)
- ScrollZoomCoordinatorDirective (line 39)

**Core Directives**:

- MeshDirective (line 8)
- GroupDirective (line 9)
- TransformDirective (line 10)

**Positioning Directives**:

- ViewportPositionDirective (`libs\angular-3d\src\lib\positioning\index.ts:4`)

**Geometry/Material Directives**: (lines 13-22, 20-28)

- BoxGeometryDirective, CylinderGeometryDirective, TorusGeometryDirective, SphereGeometryDirective, PolyhedronGeometryDirective
- StandardMaterialDirective, PhysicalMaterialDirective, LambertMaterialDirective

#### Controls (1 component verified)

**Evidence**: `libs\angular-3d\src\lib\controls\index.ts:4`

- OrbitControlsComponent

#### Postprocessing (2 components verified)

**Evidence**: `libs\angular-3d\src\lib\postprocessing\index.ts`

- EffectComposerComponent (line 2)
- BloomEffectComponent (line 3)

#### Services (6 services verified)

**Core Services** (`libs\angular-3d\src\lib\canvas\index.ts:6`):

- SceneService

**Render Services** (`libs\angular-3d\src\lib\render-loop\index.ts`):

- RenderLoopService (line 4)
- AnimationService (line 8)

**Loader Services** (`libs\angular-3d\src\lib\loaders\index.ts`):

- GltfLoaderService (line 11)
- TextureLoaderService (line 5)

**Utility Services** (`libs\angular-3d\src\lib\services\index.ts`):

- FontPreloadService (line 8)
- AdvancedPerformanceOptimizerService (line 5)

### Existing Patterns Identified

#### Pattern 1: Showcase Card Component

**Evidence**: `apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\primitives-showcase.component.ts:37-54`

Current pattern for primitive cards:

```typescript
<div class="bg-white rounded-card shadow-card p-6x">
  <div class="h-48x mb-4x">
    <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
      <a3d-ambient-light [intensity]="0.5" />
      <a3d-directional-light [position]="[2, 2, 2]" />
      <a3d-box
        viewportPosition="center"
        [color]="colors.indigo"
        rotate3d
        [rotateConfig]="{ axis: 'y', speed: 10 }"
      />
    </a3d-scene-3d>
  </div>
  <h3 class="text-headline-md font-bold mb-2x">Box</h3>
  <code class="text-body-sm text-text-secondary">&lt;a3d-box /&gt;</code>
</div>
```

**Identified Improvement**: This pattern is repeated 4 times - needs extraction into reusable component.

#### Pattern 2: Full-Viewport Scene

**Evidence**: `apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\hero-space-scene.component.ts:34-124`

```typescript
<div class="relative min-h-screen bg-background-dark overflow-hidden">
  <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
    <!-- 3D content -->
  </a3d-scene-3d>

  <!-- Overlay Text -->
  <div class="absolute bottom-10x left-10x z-10">
    <h1 class="text-display-lg text-white mb-2x">Angular-3D</h1>
    <p class="text-headline-md text-text-secondary">
      Component-based Three.js for Angular
    </p>
  </div>
</div>
```

**Pattern**: Full-viewport scenes use `min-h-screen`, absolute-positioned overlay text.

#### Pattern 3: Component Imports

**Evidence**: All existing showcase components

```typescript
import {
  Scene3dComponent,
  BoxComponent,
  // ... other components
  Rotate3dDirective,
  ViewportPositionDirective,
} from '@hive-academy/angular-3d';
```

**Pattern**: Import only what's needed from `@hive-academy/angular-3d`.

#### Pattern 4: Color System

**Evidence**: `apps\angular-3d-demo\src\app\shared\colors.ts`

- SCENE_COLORS object with numeric literals (0xRRGGBB) for Three.js
- SCENE_COLOR_STRINGS object with CSS hex strings for components requiring string colors
- Used via `public readonly colors = SCENE_COLORS;`

### Integration Points

**Navigation Integration**:

- Parent component: `apps\angular-3d-demo\src\app\pages\angular-3d-showcase\angular-3d-showcase.component.ts`
- Current structure: 3 sections (hero, primitives, value-props)
- Integration pattern: Import section components, add to template

**Styling Integration**:

- TailwindCSS utility classes
- Design tokens: `text-display-lg`, `text-headline-md`, `bg-background-light`, `p-6x`, `mb-4x`, etc.
- Card styling: `bg-white rounded-card shadow-card`
- Grid layouts: `grid md:grid-cols-2 lg:grid-cols-4 gap-8x`

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Modular Section-Based Architecture with Shared Component Reuse

**Rationale**:

- **Matches codebase**: Current showcase already uses section-based organization (`sections/`, `scenes/`)
- **Performance**: Each section can be lazy-loaded if needed in future
- **Maintainability**: Each section component focuses on one category (primitives, text, lighting, etc.)
- **Reusability**: Extract common card pattern into shared component eliminates duplication

**Evidence**:

- Existing structure: `angular-3d-showcase.component.ts` imports and composes section components
- Section pattern: `primitives-showcase.component.ts` (lines 1-123)
- Scene pattern: `hero-space-scene.component.ts`, `value-props-3d-scene.component.ts`

### Component Architecture

#### Folder Structure

```
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/
├── angular-3d-showcase.component.ts        # Main page (MODIFY)
├── scenes/                                 # Full-viewport 3D scenes
│   ├── hero-space-scene.component.ts       # EXISTS - use as-is
│   └── value-props-3d-scene.component.ts   # EXISTS - use as-is
├── sections/                               # Showcase sections
│   ├── primitives-showcase.component.ts    # EXISTS - REWRITE (expand 4→17+ cards)
│   ├── text-showcase.component.ts          # CREATE (6 text components)
│   ├── lighting-showcase.component.ts      # CREATE (5 light comparisons)
│   ├── directives-showcase.component.ts    # CREATE (9+ directives)
│   ├── postprocessing-showcase.component.ts # CREATE (bloom before/after)
│   ├── controls-showcase.component.ts      # CREATE (orbit controls variants)
│   └── services-documentation.component.ts # CREATE (6 services docs)
└── shared/                                 # Reusable components
    ├── showcase-card.component.ts          # CREATE (reusable 3D preview card)
    ├── code-snippet.component.ts           # CREATE (syntax-highlighted code)
    └── section-container.component.ts      # CREATE (consistent section wrapper)
```

---

### Component Specifications

#### Component 1: ShowcaseCardComponent (Shared)

**Purpose**: Reusable card component for displaying 3D primitives/components with code examples

**Pattern**: Extract from `primitives-showcase.component.ts:37-54`

**Responsibilities**:

- Render 3D scene in fixed-size container
- Display component name and description
- Show code snippet (basic usage)
- Provide consistent card styling

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/showcase-card.component.ts
@Component({
  selector: 'app-showcase-card',
  imports: [Scene3dComponent, AmbientLightComponent, DirectionalLightComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="bg-white rounded-card shadow-card p-6x hover:shadow-lg transition-shadow">
      <!-- 3D Preview Container -->
      <div class="h-48x mb-4x relative overflow-hidden rounded-lg bg-background-dark">
        <a3d-scene-3d [cameraPosition]="cameraPosition()" [cameraFov]="cameraFov()">
          <a3d-ambient-light [intensity]="0.5" />
          <a3d-directional-light [position]="[2, 2, 2]" [intensity]="0.8" />

          <!-- Content Projection for 3D Object -->
          <ng-content select="[sceneContent]" />
        </a3d-scene-3d>
      </div>

      <!-- Component Info -->
      <h3 class="text-headline-md font-bold mb-2x">{{ componentName() }}</h3>

      @if (description()) {
      <p class="text-body-sm text-text-secondary mb-3x">{{ description() }}</p>
      }

      <!-- Code Snippet -->
      <app-code-snippet [code]="codeExample()" language="html" />
    </div>
  `,
})
export class ShowcaseCardComponent {
  // Signal inputs
  readonly componentName = input.required<string>();
  readonly description = input<string>('');
  readonly codeExample = input.required<string>();
  readonly cameraPosition = input<[number, number, number]>([0, 0, 3]);
  readonly cameraFov = input<number>(75);
}
```

**Quality Requirements**:

- **Functional**: Must render any 3D component via content projection
- **Responsive**: Card must scale on mobile (full-width), tablet (2-col), desktop (3-4 col)
- **Performance**: 3D scene must render at 30fps minimum
- **Accessibility**: Proper ARIA labels for code blocks

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/showcase-card.component.ts` (CREATE)

---

#### Component 2: CodeSnippetComponent (Shared)

**Purpose**: Syntax-highlighted code block with copy-to-clipboard functionality

**Pattern**: New component (no existing pattern in codebase)

**Responsibilities**:

- Display syntax-highlighted code
- Provide copy-to-clipboard button
- Support multiple languages (html, typescript)
- Expandable/collapsible for longer snippets

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/code-snippet.component.ts
@Component({
  selector: 'app-code-snippet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative bg-background-dark rounded-lg overflow-hidden">
      <pre class="p-4x text-sm overflow-x-auto"><code [class]="'language-' + language()">{{ code() }}</code></pre>

      <button (click)="copyToClipboard()" class="absolute top-2x right-2x px-3x py-1x bg-primary-500 text-white rounded-md text-xs hover:bg-primary-600 transition-colors" [attr.aria-label]="copied() ? 'Copied!' : 'Copy code'">
        {{ copied() ? 'Copied!' : 'Copy' }}
      </button>
    </div>
  `,
})
export class CodeSnippetComponent {
  readonly code = input.required<string>();
  readonly language = input<'html' | 'typescript'>('html');

  readonly copied = signal(false);

  copyToClipboard(): void {
    navigator.clipboard.writeText(this.code());
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
```

**Quality Requirements**:

- **Functional**: Must copy code to clipboard successfully
- **UX**: Visual feedback when copied (button text change)
- **Accessibility**: Proper button labels and focus states
- **Syntax Highlighting**: Use Prism.js or highlight.js (defer to implementation)

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/code-snippet.component.ts` (CREATE)

---

#### Component 3: SectionContainerComponent (Shared)

**Purpose**: Consistent section wrapper with heading, description, and responsive grid

**Pattern**: Extract from repeated section structure

**Responsibilities**:

- Provide consistent section padding and background
- Display section heading and description
- Support responsive grid layouts (2-col, 3-col, 4-col)
- Handle light/dark backgrounds

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/section-container.component.ts
@Component({
  selector: 'app-section-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="'py-16x ' + (background() === 'light' ? 'bg-background-light' : 'bg-background-dark')">
      <div class="max-w-container mx-auto px-4x">
        <!-- Section Header -->
        <div class="text-center mb-12x">
          <h2 class="text-display-lg font-bold mb-4x">
            <ng-content select="[heading]" />
          </h2>
          <p class="text-headline-md text-text-secondary max-w-prose mx-auto">
            <ng-content select="[description]" />
          </p>
        </div>

        <!-- Grid Content -->
        <div [class]="getGridClasses()">
          <ng-content />
        </div>
      </div>
    </section>
  `,
})
export class SectionContainerComponent {
  readonly background = input<'light' | 'dark'>('light');
  readonly columns = input<2 | 3 | 4>(3);

  getGridClasses(): string {
    const colsMap = {
      2: 'grid md:grid-cols-2 gap-8x',
      3: 'grid md:grid-cols-2 lg:grid-cols-3 gap-8x',
      4: 'grid md:grid-cols-2 lg:grid-cols-4 gap-8x',
    };
    return colsMap[this.columns()];
  }
}
```

**Quality Requirements**:

- **Consistency**: All sections use same padding, heading size, grid gaps
- **Responsive**: Grid adapts to screen size (mobile: 1-col, tablet: 2-col, desktop: 3-4 col)
- **Accessibility**: Proper heading hierarchy (h2 for section titles)

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/section-container.component.ts` (CREATE)

---

#### Component 4: PrimitivesShowcaseComponent (REWRITE)

**Purpose**: Showcase ALL 17+ primitive components with visual previews and code examples

**Pattern**: Expand existing `primitives-showcase.component.ts` from 4 cards to 17+

**Current Coverage**: 4 components (Box, Cylinder, Torus, Icosahedron)
**Target Coverage**: 17+ components (all primitives from library)

**Responsibilities**:

- Display all primitive components grouped by category
- Each primitive has visual preview (rotating 3D object)
- Each primitive has code snippet showing basic usage
- Polyhedron shows all 5 types (tetrahedron, octahedron, dodecahedron, icosahedron)
- Responsive grid layout (4 columns desktop, 2 tablet, 1 mobile)

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/primitives-showcase.component.ts
@Component({
  selector: 'app-primitives-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    // All primitives
    BoxComponent,
    CylinderComponent,
    TorusComponent,
    PolyhedronComponent,
    FloatingSphereComponent,
    GroupComponent,
    PlanetComponent,
    StarFieldComponent,
    NebulaComponent,
    NebulaVolumetricComponent,
    GltfModelComponent,
    ParticleSystemComponent,
    SvgIconComponent,
    FogComponent,
    BackgroundCubeComponent,
    BackgroundCubesComponent,
    // Directives
    Rotate3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="4">
      <span heading>Built-in <span class="text-primary-500">Primitives</span></span>
      <span description>17+ ready-to-use 3D components for rapid prototyping</span>

      <!-- Basic Geometries Section -->
      <div class="col-span-full mb-8x">
        <h3 class="text-headline-lg font-bold mb-6x">Basic Geometries</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- Box -->
          <app-showcase-card componentName="Box" description="3D rectangular prism" codeExample='<a3d-box [color]="0x6366f1" />'>
            <a3d-box sceneContent viewportPosition="center" [color]="colors.indigo" rotate3d [rotateConfig]="{ axis: 'y', speed: 10 }" />
          </app-showcase-card>

          <!-- Cylinder -->
          <app-showcase-card componentName="Cylinder" description="Cylindrical geometry" codeExample='<a3d-cylinder [color]="0xec4899" />'>
            <a3d-cylinder sceneContent viewportPosition="center" [color]="colors.pink" rotate3d [rotateConfig]="{ axis: 'y', speed: 10 }" />
          </app-showcase-card>

          <!-- Torus -->
          <app-showcase-card componentName="Torus" description="Donut-shaped geometry" codeExample='<a3d-torus [color]="0xf59e0b" />'>
            <a3d-torus sceneContent viewportPosition="center" [color]="colors.amber" rotate3d [rotateConfig]="{ axis: 'y', speed: 10 }" />
          </app-showcase-card>

          <!-- Floating Sphere -->
          <app-showcase-card componentName="Floating Sphere" description="Sphere with physical material" codeExample='<a3d-floating-sphere [color]="0x3b82f6" />'>
            <a3d-floating-sphere sceneContent viewportPosition="center" [color]="colors.blue" rotate3d [rotateConfig]="{ axis: 'y', speed: 8 }" />
          </app-showcase-card>

          <!-- Polyhedrons (5 types) - show in expandable carousel or sub-grid -->
          <app-showcase-card componentName="Polyhedron (Tetrahedron)" description="4-sided polyhedron" codeExample='<a3d-polyhedron type="tetrahedron" />'>
            <a3d-polyhedron sceneContent [type]="'tetrahedron'" viewportPosition="center" [color]="colors.teal" rotate3d [rotateConfig]="{ axis: 'y', speed: 14 }" />
          </app-showcase-card>

          <app-showcase-card componentName="Polyhedron (Octahedron)" description="8-sided polyhedron" codeExample='<a3d-polyhedron type="octahedron" />'>
            <a3d-polyhedron sceneContent [type]="'octahedron'" viewportPosition="center" [color]="colors.red" rotate3d [rotateConfig]="{ axis: 'y', speed: 12 }" />
          </app-showcase-card>

          <app-showcase-card componentName="Polyhedron (Dodecahedron)" description="12-sided polyhedron" codeExample='<a3d-polyhedron type="dodecahedron" />'>
            <a3d-polyhedron sceneContent [type]="'dodecahedron'" viewportPosition="center" [color]="colors.violet" rotate3d [rotateConfig]="{ axis: 'y', speed: 10 }" />
          </app-showcase-card>

          <app-showcase-card componentName="Polyhedron (Icosahedron)" description="20-sided polyhedron" codeExample='<a3d-polyhedron type="icosahedron" />'>
            <a3d-polyhedron sceneContent [type]="'icosahedron'" viewportPosition="center" [color]="colors.emerald" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
          </app-showcase-card>
        </div>
      </div>

      <!-- Space Elements Section -->
      <div class="col-span-full mb-8x">
        <h3 class="text-headline-lg font-bold mb-6x">Space Elements</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- Planet -->
          <app-showcase-card componentName="Planet" description="Planet with glow and emissive properties" codeExample='<a3d-planet [radius]="1.2" [glowIntensity]="0.5" />' [cameraPosition]="[0, 0, 5]">
            <a3d-planet sceneContent viewportPosition="center" [radius]="1.2" [color]="'#4a90e2'" [glowIntensity]="0.8" [glowColor]="'#88ccff'" />
          </app-showcase-card>

          <!-- Star Field -->
          <app-showcase-card componentName="Star Field" description="Procedural starfield with stellar colors" codeExample='<a3d-star-field [starCount]="2000" [stellarColors]="true" />' [cameraPosition]="[0, 0, 10]">
            <a3d-star-field sceneContent [starCount]="2000" [radius]="15" [stellarColors]="true" [multiSize]="true" />
          </app-showcase-card>

          <!-- Nebula -->
          <app-showcase-card componentName="Nebula" description="Particle-based nebula cloud" codeExample='<a3d-nebula [particleCount]="3000" />' [cameraPosition]="[0, 0, 20]">
            <a3d-nebula sceneContent viewportPosition="center" [particleCount]="3000" [colors]="['#8b5cf6', '#ec4899', '#06b6d4']" />
          </app-showcase-card>

          <!-- Nebula Volumetric -->
          <app-showcase-card componentName="Nebula Volumetric" description="Volumetric atmospheric nebula effect" codeExample='<a3d-nebula-volumetric [width]="40" [height]="20" />' [cameraPosition]="[0, 0, 15]">
            <a3d-nebula-volumetric sceneContent [position]="[0, 0, -5]" [width]="40" [height]="20" [primaryColor]="'#4a0080'" [secondaryColor]="'#2a0050'" [opacity]="0.4" />
          </app-showcase-card>
        </div>
      </div>

      <!-- Advanced Components Section -->
      <div class="col-span-full mb-8x">
        <h3 class="text-headline-lg font-bold mb-6x">Advanced Components</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6x">
          <!-- GLTF Model -->
          <app-showcase-card componentName="GLTF Model" description="Load and display 3D models" codeExample='<a3d-gltf-model modelPath="/3d/model.gltf" />'>
            <a3d-gltf-model sceneContent [modelPath]="'/3d/planet_earth/scene.gltf'" viewportPosition="center" [scale]="1.5" rotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />
          </app-showcase-card>

          <!-- Particle System -->
          <app-showcase-card componentName="Particle System" description="Customizable particle effects" codeExample='<a3d-particle-system [particleCount]="1000" />' [cameraPosition]="[0, 0, 15]">
            <a3d-particle-system sceneContent [particleCount]="1000" [colors]="[colors.neonGreen, colors.cyan, colors.pink]" [size]="0.1" />
          </app-showcase-card>

          <!-- SVG Icon -->
          <app-showcase-card componentName="SVG Icon" description="3D extruded SVG paths" codeExample='<a3d-svg-icon [svgPath]="iconPath" />'>
            <a3d-svg-icon sceneContent viewportPosition="center" [svgPath]="angularLogoPath" [color]="colors.red" [scale]="0.01" rotate3d [rotateConfig]="{ axis: 'y', speed: 20 }" />
          </app-showcase-card>

          <!-- Group -->
          <app-showcase-card componentName="Group" description="Container for organizing 3D objects" codeExample="<a3d-group><a3d-box /><a3d-cylinder /></a3d-group>">
            <a3d-group sceneContent viewportPosition="center" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }">
              <a3d-box [position]="[-0.8, 0, 0]" [color]="colors.indigo" [size]="[0.5, 0.5, 0.5]" />
              <a3d-cylinder [position]="[0.8, 0, 0]" [color]="colors.pink" [radius]="0.3" [height]="0.8" />
            </a3d-group>
          </app-showcase-card>
        </div>
      </div>

      <!-- Environment Components Section -->
      <div class="col-span-full">
        <h3 class="text-headline-lg font-bold mb-6x">Environment Components</h3>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6x">
          <!-- Fog -->
          <app-showcase-card componentName="Fog" description="Atmospheric fog effect" codeExample='<a3d-fog [color]="0xcccccc" [near]="5" [far]="20" />' [cameraPosition]="[0, 0, 8]">
            <a3d-fog sceneContent [color]="0x88ccff" [near]="3" [far]="15" />
            <a3d-box sceneContent [position]="[0, 0, -5]" [color]="colors.indigo" />
            <a3d-box sceneContent [position]="[-2, 0, -8]" [color]="colors.pink" />
            <a3d-box sceneContent [position]="[2, 0, -8]" [color]="colors.amber" />
          </app-showcase-card>

          <!-- Background Cube -->
          <app-showcase-card componentName="Background Cube" description="Single decorative background cube" codeExample='<a3d-background-cube [color]="0x6366f1" />' [cameraPosition]="[0, 0, 5]">
            <a3d-background-cube sceneContent [color]="colors.violet" [size]="2" />
          </app-showcase-card>

          <!-- Background Cubes -->
          <app-showcase-card componentName="Background Cubes" description="Grid of decorative background cubes" codeExample='<a3d-background-cubes [count]="9" />' [cameraPosition]="[0, 0, 10]">
            <a3d-background-cubes sceneContent [count]="9" [spacing]="2.5" />
          </app-showcase-card>
        </div>
      </div>
    </app-section-container>
  `,
})
export class PrimitivesShowcaseComponent {
  public readonly colors = SCENE_COLORS;

  // Angular logo SVG path for SvgIconComponent demo
  public readonly angularLogoPath = 'M250 50L30 120l35 300 185 100 185-100 35-300z';
}
```

**Quality Requirements**:

- **Component Coverage**: All 17+ primitives displayed
- **Visual Quality**: Each 3D preview rotates smoothly at 30fps minimum
- **Code Accuracy**: All code examples must use actual library API
- **Responsive**: Grid adapts from 1 col (mobile) to 4 cols (desktop)
- **Accessibility**: Each card has descriptive heading and code alt text

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/primitives-showcase.component.ts` (REWRITE)

---

#### Component 5: TextShowcaseComponent (CREATE)

**Purpose**: Showcase all 6 text rendering components with visual effects

**Pattern**: Similar to PrimitivesShowcaseComponent, but focused on text components

**Responsibilities**:

- Display all 6 text components with "Angular 3D" text
- Show distinct visual effects for each type
- Provide code snippets for configuration
- Demonstrate responsive text component's viewport-responsive behavior

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/text-showcase.component.ts
@Component({
  selector: 'app-text-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    // Text components
    TroikaTextComponent,
    ResponsiveTroikaTextComponent,
    GlowTroikaTextComponent,
    SmokeTroikaTextComponent,
    ParticlesTextComponent,
    BubbleTextComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="3" background="light">
      <span heading>3D <span class="text-primary-500">Text Rendering</span></span>
      <span description>6 text components with SDF-based rendering and visual effects</span>

      <!-- Troika Text (Basic) -->
      <app-showcase-card componentName="Troika Text" description="High-quality SDF text rendering" codeExample='<a3d-troika-text text="Angular 3D" [fontSize]="1" />' [cameraPosition]="[0, 0, 5]">
        <a3d-troika-text sceneContent text="Angular 3D" [fontSize]="1" [color]="colors.indigo" viewportPosition="center" />
      </app-showcase-card>

      <!-- Responsive Troika Text -->
      <app-showcase-card componentName="Responsive Text" description="Viewport-responsive text sizing" codeExample='<a3d-responsive-troika-text text="Responsive" />' [cameraPosition]="[0, 0, 5]">
        <a3d-responsive-troika-text sceneContent text="Responsive" [color]="colors.neonGreen" viewportPosition="center" />
      </app-showcase-card>

      <!-- Glow Text -->
      <app-showcase-card componentName="Glow Text" description="Text with emissive glow effect" codeExample='<a3d-glow-troika-text text="Glowing" [glowIntensity]="2" />' [cameraPosition]="[0, 0, 5]">
        <a3d-glow-troika-text sceneContent text="Glowing" [fontSize]="1" [color]="colors.cyan" [glowIntensity]="2" viewportPosition="center" />
      </app-showcase-card>

      <!-- Smoke Text -->
      <app-showcase-card componentName="Smoke Text" description="Text with smoke/fog effect" codeExample='<a3d-smoke-troika-text text="Smokey" />' [cameraPosition]="[0, 0, 5]">
        <a3d-smoke-troika-text sceneContent text="Smokey" [fontSize]="1" [color]="colors.violet" viewportPosition="center" />
      </app-showcase-card>

      <!-- Particles Text -->
      <app-showcase-card componentName="Particles Text" description="Text formed from particle cloud" codeExample='<a3d-particles-text text="Particles" [particleCount]="5000" />' [cameraPosition]="[0, 0, 8]">
        <a3d-particles-text sceneContent text="Particles" [particleCount]="5000" [color]="colors.pink" viewportPosition="center" />
      </app-showcase-card>

      <!-- Bubble Text -->
      <app-showcase-card componentName="Bubble Text" description="Text with bubble effect" codeExample='<a3d-bubble-text text="Bubbles" />' [cameraPosition]="[0, 0, 5]">
        <a3d-bubble-text sceneContent text="Bubbles" [fontSize]="1" [color]="colors.amber" viewportPosition="center" />
      </app-showcase-card>
    </app-section-container>
  `,
})
export class TextShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
```

**Quality Requirements**:

- **Component Coverage**: All 6 text components displayed
- **Visual Distinction**: Each effect clearly visible and differentiated
- **Performance**: Text renders at 30fps minimum
- **Font Loading**: Use FontPreloadService to prevent race conditions

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/text-showcase.component.ts` (CREATE)

---

#### Component 6: LightingShowcaseComponent (CREATE)

**Purpose**: Side-by-side comparison of all 5 light types illuminating the same reference object

**Pattern**: Similar card-based layout, but each card demonstrates a different light type on same object

**Responsibilities**:

- Display all 5 light types
- Use same reference object (sphere or torus) for comparison
- Show light configuration parameters
- Provide code snippets for each light type

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/lighting-showcase.component.ts
@Component({
  selector: 'app-lighting-showcase',
  imports: [SectionContainerComponent, ShowcaseCardComponent, Scene3dComponent, TorusComponent, AmbientLightComponent, DirectionalLightComponent, PointLightComponent, SpotLightComponent, SceneLightingComponent, ViewportPositionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="3" background="dark">
      <span heading>Lighting <span class="text-neon-green">Comparison</span></span>
      <span description>5 light types demonstrating different illumination techniques</span>

      <!-- Ambient Light -->
      <app-showcase-card componentName="Ambient Light" description="Global illumination (no shadows)" codeExample='<a3d-ambient-light [intensity]="0.8" [color]="0xffffff" />'>
        <a3d-ambient-light sceneContent [intensity]="0.8" [color]="colors.white" />
        <a3d-torus sceneContent viewportPosition="center" [color]="colors.indigo" />
      </app-showcase-card>

      <!-- Directional Light -->
      <app-showcase-card componentName="Directional Light" description="Sun-like parallel rays" codeExample='<a3d-directional-light [position]="[5, 5, 5]" [intensity]="1" />'>
        <a3d-ambient-light sceneContent [intensity]="0.2" />
        <a3d-directional-light sceneContent [position]="[5, 5, 5]" [intensity]="1.2" [color]="colors.neonGreen" />
        <a3d-torus sceneContent viewportPosition="center" [color]="colors.indigo" />
      </app-showcase-card>

      <!-- Point Light -->
      <app-showcase-card componentName="Point Light" description="Omnidirectional point source" codeExample='<a3d-point-light [position]="[2, 2, 2]" [intensity]="2" />'>
        <a3d-ambient-light sceneContent [intensity]="0.2" />
        <a3d-point-light sceneContent [position]="[2, 2, 2]" [intensity]="2" [color]="colors.cyan" />
        <a3d-torus sceneContent viewportPosition="center" [color]="colors.indigo" />
      </app-showcase-card>

      <!-- Spot Light -->
      <app-showcase-card componentName="Spot Light" description="Cone-shaped light (adjustable angle)" codeExample='<a3d-spot-light [position]="[0, 3, 3]" [angle]="0.5" />'>
        <a3d-ambient-light sceneContent [intensity]="0.2" />
        <a3d-spot-light sceneContent [position]="[0, 3, 3]" [angle]="0.5" [intensity]="2" [color]="colors.amber" [target]="[0, 0, 0]" />
        <a3d-torus sceneContent viewportPosition="center" [color]="colors.indigo" />
      </app-showcase-card>

      <!-- Scene Lighting (Pre-configured) -->
      <app-showcase-card componentName="Scene Lighting" description="Pre-configured multi-light setup" codeExample="<a3d-scene-lighting />">
        <a3d-scene-lighting sceneContent />
        <a3d-torus sceneContent viewportPosition="center" [color]="colors.indigo" />
      </app-showcase-card>
    </app-section-container>
  `,
})
export class LightingShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
```

**Quality Requirements**:

- **Component Coverage**: All 5 light types displayed
- **Visual Comparison**: Same reference object (torus) used for all comparisons
- **Lighting Accuracy**: Each light type's unique characteristics visible
- **Performance**: Each scene renders at 30fps minimum

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/lighting-showcase.component.ts` (CREATE)

---

#### Component 7: DirectivesShowcaseComponent (CREATE)

**Purpose**: Demonstrate all animation and behavior directives with interactive examples

**Pattern**: Similar card-based layout with directive-enhanced objects

**Responsibilities**:

- Display all 9+ directives (Float3d, Rotate3d, Glow3d, SpaceFlight3d, MouseTracking3d, Performance3d, etc.)
- Show before/after or isolated directive effect
- Provide configuration examples (slow vs fast float, different rotation axes)
- Code snippets showing directive usage

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/directives-showcase.component.ts
@Component({
  selector: 'app-directives-showcase',
  imports: [
    SectionContainerComponent,
    ShowcaseCardComponent,
    Scene3dComponent,
    BoxComponent,
    TorusComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    BloomEffectComponent,
    // Directives
    Float3dDirective,
    Rotate3dDirective,
    Glow3dDirective,
    SpaceFlight3dDirective,
    MouseTracking3dDirective,
    Performance3dDirective,
    ViewportPositionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="3" background="light">
      <span heading>Animation <span class="text-primary-500">Directives</span></span>
      <span description>9+ directives for adding behavior to 3D objects</span>

      <!-- Float3d Directive (Slow) -->
      <app-showcase-card
        componentName="Float3d (Slow)"
        description="Gentle floating animation"
        codeExample='<a3d-box a3dFloat3d [floatSpeed]="1" [floatIntensity]="0.2" />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.indigo"
          a3dFloat3d
          [floatSpeed]="1"
          [floatIntensity]="0.2"
        />
      </app-showcase-card>

      <!-- Float3d Directive (Fast) -->
      <app-showcase-card
        componentName="Float3d (Fast)"
        description="Rapid floating animation"
        codeExample='<a3d-box a3dFloat3d [floatSpeed]="3" [floatIntensity]="0.5" />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.pink"
          a3dFloat3d
          [floatSpeed]="3"
          [floatIntensity]="0.5"
        />
      </app-showcase-card>

      <!-- Rotate3d Directive (Y-axis) -->
      <app-showcase-card
        componentName="Rotate3d (Y-axis)"
        description="Rotation on Y-axis"
        codeExample='<a3d-torus rotate3d [rotateConfig]="{ axis: \'y\', speed: 20 }" />'
      >
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.amber"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 20 }"
        />
      </app-showcase-card>

      <!-- Rotate3d Directive (X-axis) -->
      <app-showcase-card
        componentName="Rotate3d (X-axis)"
        description="Rotation on X-axis"
        codeExample='<a3d-torus rotate3d [rotateConfig]="{ axis: \'x\', speed: 20 }" />'
      >
        <a3d-torus
          sceneContent
          viewportPosition="center"
          [color]="colors.emerald"
          rotate3d
          [rotateConfig]="{ axis: 'x', speed: 20 }"
        />
      </app-showcase-card>

      <!-- Glow3d Directive -->
      <app-showcase-card
        componentName="Glow3d"
        description="Glowing/bloom effect on object"
        codeExample='<a3d-box a3dGlow3d [glowIntensity]="2" />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.cyan"
          a3dGlow3d
          [glowIntensity]="2"
        />
        <a3d-bloom-effect sceneContent [threshold]="0.5" [strength]="1.5" [radius]="0.5" />
      </app-showcase-card>

      <!-- SpaceFlight3d Directive -->
      <app-showcase-card
        componentName="SpaceFlight3d"
        description="Space-flight motion pattern"
        codeExample='<a3d-box a3dSpaceFlight3d />'
        [cameraPosition]="[0, 0, 8]"
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.violet"
          a3dSpaceFlight3d
        />
      </app-showcase-card>

      <!-- MouseTracking3d Directive -->
      <app-showcase-card
        componentName="MouseTracking3d"
        description="Follows mouse cursor (hover over card)"
        codeExample='<a3d-box a3dMouseTracking3d />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.orange"
          a3dMouseTracking3d
        />
      </app-showcase-card>

      <!-- Performance3d Directive -->
      <app-showcase-card
        componentName="Performance3d"
        description="Performance optimization for complex scenes"
        codeExample='<a3d-box a3dPerformance3d [lod]="medium" />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.teal"
          a3dPerformance3d
        />
      </app-showcase-card>

      <!-- Combined Directives Example -->
      <app-showcase-card
        componentName="Combined (Float + Rotate + Glow)"
        description="Multiple directives on one object"
        codeExample='<a3d-box a3dFloat3d rotate3d a3dGlow3d />'
      >
        <a3d-box
          sceneContent
          viewportPosition="center"
          [color]="colors.hotPink"
          a3dFloat3d
          [floatSpeed]="2"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 15 }"
          a3dGlow3d
          [glowIntensity]="1.5"
        />
        <a3d-bloom-effect sceneContent [threshold]="0.5" [strength]="1.2" />
      </app-showcase-card>
    </app-section-container>
  `,
})
export class DirectivesShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
```

**Quality Requirements**:

- **Directive Coverage**: All 9+ directives demonstrated
- **Visual Clarity**: Each directive's effect clearly visible
- **Configuration Examples**: Show 2+ variants per directive (slow/fast, different axes)
- **Interactive**: MouseTracking3d directive actually responds to mouse movement

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/directives-showcase.component.ts` (CREATE)

---

#### Component 8: PostprocessingShowcaseComponent (CREATE)

**Purpose**: Demonstrate postprocessing effects with before/after comparison

**Pattern**: Split-screen or toggle-based comparison showing bloom effect

**Responsibilities**:

- Display EffectComposerComponent explanation
- Show BloomEffectComponent with before/after comparison
- Provide interactive controls (threshold, strength, radius sliders - optional MVP)
- Code snippets showing effect nesting pattern

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/postprocessing-showcase.component.ts
@Component({
  selector: 'app-postprocessing-showcase',
  imports: [SectionContainerComponent, Scene3dComponent, TorusComponent, BoxComponent, AmbientLightComponent, DirectionalLightComponent, BloomEffectComponent, Glow3dDirective, Rotate3dDirective, ViewportPositionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="2" background="dark">
      <span heading>Postprocessing <span class="text-neon-green">Effects</span></span>
      <span description>EffectComposer and BloomEffect for high-quality visuals</span>

      <!-- Without Bloom -->
      <div class="bg-background-light rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg">
          <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
            <a3d-ambient-light [intensity]="0.3" />
            <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />

            <a3d-torus viewportPosition="center" [color]="colors.cyan" a3dGlow3d [glowIntensity]="2" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
            <a3d-box [position]="[-2, 0, 0]" [color]="colors.pink" rotate3d [rotateConfig]="{ axis: 'x', speed: 20 }" />
            <a3d-box [position]="[2, 0, 0]" [color]="colors.neonGreen" rotate3d [rotateConfig]="{ axis: 'z', speed: 18 }" />
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">Without Bloom</h3>
        <p class="text-body-sm text-text-secondary mb-3x">Standard rendering without postprocessing effects</p>
        <pre class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"><code class="language-html">&lt;a3d-scene-3d&gt;
  &lt;!-- No bloom effect --&gt;
  &lt;a3d-box a3dGlow3d /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
      </div>

      <!-- With Bloom -->
      <div class="bg-background-light rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg">
          <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
            <a3d-ambient-light [intensity]="0.3" />
            <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />

            <a3d-torus viewportPosition="center" [color]="colors.cyan" a3dGlow3d [glowIntensity]="2" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
            <a3d-box [position]="[-2, 0, 0]" [color]="colors.pink" rotate3d [rotateConfig]="{ axis: 'x', speed: 20 }" />
            <a3d-box [position]="[2, 0, 0]" [color]="colors.neonGreen" rotate3d [rotateConfig]="{ axis: 'z', speed: 18 }" />

            <!-- Bloom Effect -->
            <a3d-bloom-effect [threshold]="0.5" [strength]="1.5" [radius]="0.5" />
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">With Bloom</h3>
        <p class="text-body-sm text-text-secondary mb-3x">Bloom effect creates glow around bright objects (threshold: 0.5, strength: 1.5)</p>
        <pre class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"><code class="language-html">&lt;a3d-scene-3d&gt;
  &lt;a3d-box a3dGlow3d /&gt;
  &lt;a3d-bloom-effect
    [threshold]="0.5"
    [strength]="1.5"
    [radius]="0.5" /&gt;
&lt;/a3d-scene-3d&gt;</code></pre>
      </div>
    </app-section-container>
  `,
})
export class PostprocessingShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
```

**Quality Requirements**:

- **Visual Comparison**: Clear before/after difference visible
- **Parameter Documentation**: Show key parameters (threshold, strength, radius)
- **Performance Note**: Mention performance impact in description (deferred to implementation)
- **Nesting Pattern**: Code examples show proper nesting within Scene3dComponent

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/postprocessing-showcase.component.ts` (CREATE)

---

#### Component 9: ControlsShowcaseComponent (CREATE)

**Purpose**: Demonstrate OrbitControlsComponent with various configurations

**Pattern**: Multiple scenes showing different orbit control configurations

**Responsibilities**:

- Show interactive OrbitControlsComponent demo
- Display configuration variants (auto-rotate on/off, damping on/off, zoom restrictions)
- Provide usage instructions ("Click and drag to rotate, scroll to zoom")
- Code snippets for each configuration

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/controls-showcase.component.ts
@Component({
  selector: 'app-controls-showcase',
  imports: [SectionContainerComponent, Scene3dComponent, TorusComponent, BoxComponent, CylinderComponent, AmbientLightComponent, DirectionalLightComponent, OrbitControlsComponent, ViewportPositionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="2" background="light">
      <span heading>Camera <span class="text-primary-500">Controls</span></span>
      <span description>OrbitControls for interactive camera manipulation</span>

      <!-- Auto-Rotate Enabled -->
      <div class="bg-white rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg bg-background-dark">
          <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[3, 3, 3]" />

            <a3d-box [position]="[-2, 0, 0]" [color]="colors.indigo" />
            <a3d-torus viewportPosition="center" [color]="colors.pink" />
            <a3d-cylinder [position]="[2, 0, 0]" [color]="colors.amber" />

            <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" [autoRotate]="true" [autoRotateSpeed]="2" />
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">Auto-Rotate Enabled</h3>
        <p class="text-body-sm text-text-secondary mb-3x">Camera automatically rotates around the scene. Click and drag to take manual control.</p>
        <pre class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"><code class="language-html">&lt;a3d-orbit-controls
  [enableDamping]="true"
  [autoRotate]="true"
  [autoRotateSpeed]="2" /&gt;</code></pre>
      </div>

      <!-- Manual Control Only -->
      <div class="bg-white rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg bg-background-dark">
          <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[3, 3, 3]" />

            <a3d-box [position]="[-2, 0, 0]" [color]="colors.indigo" />
            <a3d-torus viewportPosition="center" [color]="colors.pink" />
            <a3d-cylinder [position]="[2, 0, 0]" [color]="colors.amber" />

            <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" [autoRotate]="false" />
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">Manual Control Only</h3>
        <p class="text-body-sm text-text-secondary mb-3x">Click and drag to orbit, scroll to zoom, right-click drag to pan.</p>
        <pre class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"><code class="language-html">&lt;a3d-orbit-controls
  [enableDamping]="true"
  [autoRotate]="false" /&gt;</code></pre>
      </div>

      <!-- Restricted Zoom Range -->
      <div class="bg-white rounded-card shadow-card p-6x">
        <div class="h-96x mb-4x relative overflow-hidden rounded-lg bg-background-dark">
          <a3d-scene-3d [cameraPosition]="[0, 0, 8]">
            <a3d-ambient-light [intensity]="0.5" />
            <a3d-directional-light [position]="[3, 3, 3]" />

            <a3d-box [position]="[-2, 0, 0]" [color]="colors.indigo" />
            <a3d-torus viewportPosition="center" [color]="colors.pink" />
            <a3d-cylinder [position]="[2, 0, 0]" [color]="colors.amber" />

            <a3d-orbit-controls [enableDamping]="true" [minDistance]="5" [maxDistance]="15" />
          </a3d-scene-3d>
        </div>
        <h3 class="text-headline-md font-bold mb-2x">Restricted Zoom Range</h3>
        <p class="text-body-sm text-text-secondary mb-3x">Zoom range limited between 5 and 15 units from center.</p>
        <pre class="bg-background-dark rounded-lg p-3x text-sm overflow-x-auto"><code class="language-html">&lt;a3d-orbit-controls
  [minDistance]="5"
  [maxDistance]="15" /&gt;</code></pre>
      </div>
    </app-section-container>
  `,
})
export class ControlsShowcaseComponent {
  public readonly colors = SCENE_COLORS;
}
```

**Quality Requirements**:

- **Interactivity**: All orbit controls must respond to mouse/touch input
- **Configuration Variants**: Show 3+ configuration examples
- **Instructions**: Clear usage instructions for users
- **Touch Support**: Controls work on mobile/tablet devices

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/controls-showcase.component.ts` (CREATE)

---

#### Component 10: ServicesDocumentationComponent (CREATE)

**Purpose**: Document all 6 core services with usage examples and TypeScript signatures

**Pattern**: Documentation-focused component (text-heavy, no 3D previews)

**Responsibilities**:

- Document all 6 services (SceneService, RenderLoopService, AnimationService, GltfLoaderService, TextureLoaderService, FontPreloadService, AdvancedPerformanceOptimizerService)
- Show injection pattern (`inject(ServiceName)`)
- Provide TypeScript method signatures
- Include usage examples with code snippets

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/services-documentation.component.ts
@Component({
  selector: 'app-services-documentation',
  imports: [SectionContainerComponent, CodeSnippetComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-section-container [columns]="1" background="light">
      <span heading>Core <span class="text-primary-500">Services</span></span>
      <span description>6 injectable services for scene management, rendering, and asset loading</span>

      <div class="grid md:grid-cols-2 gap-8x">
        <!-- SceneService -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <h3 class="text-headline-lg font-bold mb-3x">SceneService</h3>
          <p class="text-body-md text-text-secondary mb-4x">Provides access to Three.js Scene, Camera, and Renderer instances.</p>
          <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
          <ul class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1">
            <li><code>getScene(): THREE.Scene</code> - Get current scene</li>
            <li><code>getCamera(): THREE.Camera</code> - Get active camera</li>
            <li><code>getRenderer(): THREE.WebGLRenderer</code> - Get renderer</li>
          </ul>
          <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
          <app-code-snippet language="typescript" [code]="sceneServiceExample" />
        </div>

        <!-- RenderLoopService -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <h3 class="text-headline-lg font-bold mb-3x">RenderLoopService</h3>
          <p class="text-body-md text-text-secondary mb-4x">Manages the requestAnimationFrame render loop and per-frame callbacks.</p>
          <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
          <ul class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1">
            <li><code>registerUpdateCallback(callback: UpdateCallback): () => void</code></li>
            <li><code>start(): void</code> - Start render loop</li>
            <li><code>stop(): void</code> - Stop render loop</li>
          </ul>
          <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
          <app-code-snippet language="typescript" [code]="renderLoopServiceExample" />
        </div>

        <!-- GltfLoaderService -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <h3 class="text-headline-lg font-bold mb-3x">GltfLoaderService</h3>
          <p class="text-body-md text-text-secondary mb-4x">Loads GLTF/GLB 3D models with caching and progress callbacks.</p>
          <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
          <ul class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1">
            <li><code>load(url: string, onProgress?: (progress: number) => void): Promise&lt;GLTF&gt;</code></li>
          </ul>
          <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
          <app-code-snippet language="typescript" [code]="gltfLoaderServiceExample" />
        </div>

        <!-- TextureLoaderService -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <h3 class="text-headline-lg font-bold mb-3x">TextureLoaderService</h3>
          <p class="text-body-md text-text-secondary mb-4x">Loads textures with caching support.</p>
          <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
          <ul class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1">
            <li><code>load(url: string): Promise&lt;THREE.Texture&gt;</code></li>
          </ul>
          <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
          <app-code-snippet language="typescript" [code]="textureLoaderServiceExample" />
        </div>

        <!-- FontPreloadService -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <h3 class="text-headline-lg font-bold mb-3x">FontPreloadService</h3>
          <p class="text-body-md text-text-secondary mb-4x">Preloads fonts for Troika text components to prevent race conditions.</p>
          <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
          <ul class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1">
            <li><code>preloadFont(url: string): Promise&lt;void&gt;</code></li>
          </ul>
          <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
          <app-code-snippet language="typescript" [code]="fontPreloadServiceExample" />
        </div>

        <!-- AdvancedPerformanceOptimizerService -->
        <div class="bg-white rounded-card shadow-card p-6x">
          <h3 class="text-headline-lg font-bold mb-3x">AdvancedPerformanceOptimizerService</h3>
          <p class="text-body-md text-text-secondary mb-4x">Provides performance optimization utilities for complex scenes.</p>
          <h4 class="text-headline-sm font-semibold mb-2x">Key Methods</h4>
          <ul class="list-disc list-inside text-body-sm text-text-secondary mb-4x space-y-1">
            <li><code>optimizeScene(scene: THREE.Scene): void</code></li>
            <li><code>enableFrustumCulling(): void</code></li>
          </ul>
          <h4 class="text-headline-sm font-semibold mb-2x">Usage Example</h4>
          <app-code-snippet language="typescript" [code]="performanceOptimizerServiceExample" />
        </div>
      </div>
    </app-section-container>
  `,
})
export class ServicesDocumentationComponent {
  readonly sceneServiceExample = `import { inject } from '@angular/core';
import { SceneService } from '@hive-academy/angular-3d';

export class MyComponent {
  private sceneService = inject(SceneService);

  ngAfterViewInit() {
    const scene = this.sceneService.getScene();
    const camera = this.sceneService.getCamera();
    // Manipulate scene directly
  }
}`;

  readonly renderLoopServiceExample = `import { inject, DestroyRef } from '@angular/core';
import { RenderLoopService } from '@hive-academy/angular-3d';

export class MyComponent {
  private renderLoop = inject(RenderLoopService);
  private destroyRef = inject(DestroyRef);

  constructor() {
    const cleanup = this.renderLoop.registerUpdateCallback((delta, elapsed) => {
      // Per-frame animation logic
      this.mesh.rotation.y += delta;
    });

    this.destroyRef.onDestroy(cleanup);
  }
}`;

  readonly gltfLoaderServiceExample = `import { inject } from '@angular/core';
import { GltfLoaderService } from '@hive-academy/angular-3d';

export class MyComponent {
  private gltfLoader = inject(GltfLoaderService);

  async loadModel() {
    const gltf = await this.gltfLoader.load(
      '/3d/model.gltf',
      (progress) => console.log(\`\${progress}% loaded\`)
    );
    scene.add(gltf.scene);
  }
}`;

  readonly textureLoaderServiceExample = `import { inject } from '@angular/core';
import { TextureLoaderService } from '@hive-academy/angular-3d';

export class MyComponent {
  private textureLoader = inject(TextureLoaderService);

  async loadTexture() {
    const texture = await this.textureLoader.load('/textures/diffuse.jpg');
    material.map = texture;
  }
}`;

  readonly fontPreloadServiceExample = `import { inject } from '@angular/core';
import { FontPreloadService } from '@hive-academy/angular-3d';

export class MyComponent {
  private fontPreload = inject(FontPreloadService);

  async preloadFonts() {
    await this.fontPreload.preloadFont('/fonts/roboto.woff');
    // Now safe to use TroikaTextComponent
  }
}`;

  readonly performanceOptimizerServiceExample = `import { inject } from '@angular/core';
import { AdvancedPerformanceOptimizerService, SceneService } from '@hive-academy/angular-3d';

export class MyComponent {
  private optimizer = inject(AdvancedPerformanceOptimizerService);
  private sceneService = inject(SceneService);

  optimizeMyScene() {
    const scene = this.sceneService.getScene();
    this.optimizer.optimizeScene(scene);
    this.optimizer.enableFrustumCulling();
  }
}`;
}
```

**Quality Requirements**:

- **Service Coverage**: All 6 services documented
- **Method Signatures**: TypeScript signatures provided for key methods
- **Usage Examples**: Working code snippets for each service
- **Injection Pattern**: Demonstrate proper `inject()` usage

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/services-documentation.component.ts` (CREATE)

---

#### Component 11: Angular3dShowcaseComponent (MODIFY)

**Purpose**: Main page component that composes all showcase sections

**Pattern**: Expand existing component to import and display all new sections

**Responsibilities**:

- Import all section components
- Compose sections in logical order
- Maintain hero and value-props scenes
- Ensure responsive layout

**Implementation Pattern**:

```typescript
// File: apps/angular-3d-demo/src/app/pages/angular-3d-showcase/angular-3d-showcase.component.ts
@Component({
  selector: 'app-angular-3d-showcase',
  imports: [
    // Existing scenes
    HeroSpaceSceneComponent,
    ValueProps3dSceneComponent,
    // Showcase sections
    PrimitivesShowcaseComponent,
    TextShowcaseComponent,
    LightingShowcaseComponent,
    DirectivesShowcaseComponent,
    PostprocessingShowcaseComponent,
    ControlsShowcaseComponent,
    ServicesDocumentationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 1. Hero Space Scene -->
    <app-hero-space-scene />

    <!-- 2. Primitives (17+ components) -->
    <app-primitives-showcase />

    <!-- 3. Text Components (6 components) -->
    <app-text-showcase />

    <!-- 4. Lighting (5 light types) -->
    <app-lighting-showcase />

    <!-- 5. Directives (9+ directives) -->
    <app-directives-showcase />

    <!-- 6. Postprocessing (Bloom before/after) -->
    <app-postprocessing-showcase />

    <!-- 7. Controls (OrbitControls variants) -->
    <app-controls-showcase />

    <!-- 8. Services (6 services documentation) -->
    <app-services-documentation />

    <!-- 9. Value Props Scene (11 geometries) -->
    <app-value-props-3d-scene />
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class Angular3dShowcaseComponent {}
```

**Quality Requirements**:

- **Section Order**: Logical progression (primitives → text → lighting → directives → effects → controls → services → value-props)
- **Integration**: All sections properly imported and rendered
- **Performance**: Page maintains 60fps on desktop with lazy loading (deferred to implementation)

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/angular-3d-showcase.component.ts` (MODIFY)

---

## 🔗 Integration Architecture

### Integration Points

1. **Main Page Integration**:

   - Pattern: Import section components, add to template
   - Location: `angular-3d-showcase.component.ts`
   - Evidence: Current implementation already uses this pattern (lines 8-26)

2. **Shared Components Integration**:

   - Pattern: All section components import shared components (ShowcaseCardComponent, CodeSnippetComponent, SectionContainerComponent)
   - Location: Each section component's imports array
   - Benefit: Consistency and DRY principle

3. **Color System Integration**:

   - Pattern: All components import and use `SCENE_COLORS` from `shared/colors.ts`
   - Usage: `public readonly colors = SCENE_COLORS;`
   - Evidence: Current pattern in all existing showcase components

4. **Library API Integration**:
   - Pattern: Import only needed components from `@hive-academy/angular-3d`
   - All imports verified from `libs/angular-3d/src/index.ts`
   - No hallucinated components

### Data Flow

```
User Navigation
  ↓
angular-3d-showcase.component.ts (Main Page)
  ↓
├─→ HeroSpaceSceneComponent (existing)
├─→ PrimitivesShowcaseComponent (rewrite)
│     ├─→ ShowcaseCardComponent (shared) × 17
│     │     ├─→ Scene3dComponent (library)
│     │     └─→ CodeSnippetComponent (shared)
│     └─→ SectionContainerComponent (shared)
├─→ TextShowcaseComponent (new)
│     ├─→ ShowcaseCardComponent × 6
│     └─→ SectionContainerComponent
├─→ LightingShowcaseComponent (new)
├─→ DirectivesShowcaseComponent (new)
├─→ PostprocessingShowcaseComponent (new)
├─→ ControlsShowcaseComponent (new)
├─→ ServicesDocumentationComponent (new)
└─→ ValueProps3dSceneComponent (existing)
```

### Dependencies

**Internal Dependencies**:

- `@hive-academy/angular-3d` - All components, directives, services (verified from public API)
- `apps/angular-3d-demo/src/app/shared/colors.ts` - SCENE_COLORS

**External Dependencies**:

- Three.js 0.182 (peer dependency of @hive-academy/angular-3d)
- TailwindCSS (styling)
- Syntax highlighter library for CodeSnippetComponent (Prism.js or highlight.js - deferred to implementation)

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

1. **Component Coverage**: 100% of public API components showcased

   - 17+ primitives ✓
   - 6 text components ✓
   - 5 light types ✓
   - 9+ directives ✓
   - 2 postprocessing components ✓
   - 1 controls component ✓
   - 6 services ✓

2. **Visual Quality**: All 3D scenes render smoothly

   - Card scenes: 30fps minimum
   - Full-viewport scenes: 60fps desktop, 30fps mobile

3. **Code Examples**: All code snippets are copy-to-clipboard enabled and syntax-highlighted

4. **Responsive Layout**: Grid layouts adapt to screen size (1-col mobile, 2-col tablet, 3-4 col desktop)

### Non-Functional Requirements

- **Performance**: Lazy loading for off-screen scenes (optional enhancement - deferred to implementation)
- **Accessibility**: Proper ARIA labels, keyboard navigation, semantic HTML
- **Code Quality**: TypeScript strict mode, zero `any` types, OnPush change detection
- **Pattern Compliance**: All components follow Angular 20 patterns (standalone, signals, inject, DestroyRef)
- **Resource Cleanup**: All Three.js resources properly disposed in DestroyRef.onDestroy()

### Pattern Compliance

All components MUST follow these verified patterns:

1. **Standalone Components**: No NgModules

   - Evidence: All existing showcase components are standalone

2. **Signal Inputs**: Use `input<T>()` or `input.required<T>()`

   - Evidence: Angular 20 signal-based inputs

3. **OnPush Change Detection**: All components use `ChangeDetectionStrategy.OnPush`

   - Evidence: All existing showcase components use OnPush

4. **Dependency Injection**: Use `inject()` function

   - Evidence: Library components use `inject(RenderLoopService)`, etc.

5. **Resource Cleanup**: Use `DestroyRef.onDestroy()` for Three.js cleanup
   - Evidence: `libs/angular-3d/CLAUDE.md:122-128` shows cleanup pattern

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: **frontend-developer**

**Rationale**:

1. **UI Component Work**: 90% of work involves creating UI components (cards, sections, layouts)
2. **TailwindCSS Styling**: Extensive styling work with Tailwind utility classes
3. **Angular Expertise**: Requires Angular 20 knowledge (standalone components, signals, OnPush)
4. **Three.js Integration**: Uses library components declaratively (no low-level Three.js programming)
5. **Browser APIs**: Code snippet component uses `navigator.clipboard` API

**NOT backend-developer** because:

- No NestJS services or API endpoints
- No database entities or repositories
- No server-side logic

### Complexity Assessment

**Complexity**: **MEDIUM-HIGH**

**Estimated Effort**: **16-24 hours**

**Breakdown**:

- Shared Components (3 components): 4-6 hours
  - ShowcaseCardComponent: 1.5 hours
  - CodeSnippetComponent: 1.5 hours
  - SectionContainerComponent: 1 hour
- Primitives Showcase (rewrite): 4-5 hours (17+ cards)
- Text Showcase: 2 hours (6 cards)
- Lighting Showcase: 2 hours (5 cards)
- Directives Showcase: 3 hours (9+ cards)
- Postprocessing Showcase: 2 hours (before/after comparison)
- Controls Showcase: 2 hours (3 variants)
- Services Documentation: 2-3 hours (6 services, text-heavy)
- Main Page Integration: 1 hour

**Complexity Factors**:

- **High Card Count**: 17+ primitive cards + 6 text + 5 lighting + 9+ directives = 37+ cards
- **Reusable Components**: Must extract shared components correctly
- **Code Examples**: All code snippets must be accurate and working
- **Responsive Design**: Must work on mobile, tablet, desktop
- **Performance**: 37+ 3D scenes on one page requires optimization

### Files Affected Summary

**CREATE** (10 files):

```
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/showcase-card.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/code-snippet.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/shared/section-container.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/text-showcase.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/lighting-showcase.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/directives-showcase.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/postprocessing-showcase.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/controls-showcase.component.ts
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/services-documentation.component.ts
```

**REWRITE** (1 file):

```
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/primitives-showcase.component.ts
```

**MODIFY** (1 file):

```
apps/angular-3d-demo/src/app/pages/angular-3d-showcase/angular-3d-showcase.component.ts
```

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **All imports exist in codebase**:

   - All components verified from `libs/angular-3d/src/index.ts`
   - All directives verified from `libs/angular-3d/src/lib/directives/index.ts`
   - All services verified from library service exports

2. **All patterns verified from examples**:

   - Showcase card pattern from `primitives-showcase.component.ts:37-54`
   - Full-viewport scene pattern from `hero-space-scene.component.ts:34-124`
   - Section structure pattern from existing components

3. **Library documentation consulted**:

   - `libs/angular-3d/CLAUDE.md` for component usage patterns
   - `libs/angular-3d/src/index.ts` for complete public API

4. **No hallucinated APIs**:

   - All component names verified in primitives/index.ts
   - All directive names verified in directives/index.ts
   - All service names verified in services/index.ts, loaders/index.ts, canvas/index.ts, render-loop/index.ts

5. **Color system usage**:

   - All components use `SCENE_COLORS` from `shared/colors.ts`
   - No hardcoded color values

6. **TailwindCSS design tokens**:
   - Use existing tokens: `text-display-lg`, `p-6x`, `gap-8x`, `bg-background-light`, etc.
   - No custom CSS (except component-specific styles)

### Batch Breakdown Recommendation

The team-leader should break this architecture into **5-7 batches** for git-verifiable incremental delivery:

**Batch 1: Shared Components Foundation**

- Create ShowcaseCardComponent
- Create CodeSnippetComponent
- Create SectionContainerComponent
- Verification: Components render correctly in isolation

**Batch 2: Primitives Showcase (Part 1 - Basic Geometries)**

- Rewrite PrimitivesShowcaseComponent with basic geometries section (Box, Cylinder, Torus, FloatingSphere, 5 Polyhedrons)
- Verification: 9 basic geometry cards render correctly

**Batch 3: Primitives Showcase (Part 2 - Space & Advanced & Environment)**

- Add space elements section (Planet, StarField, Nebula, NebulaVolumetric)
- Add advanced components section (GLTF, ParticleSystem, SvgIcon, Group)
- Add environment section (Fog, BackgroundCube, BackgroundCubes)
- Verification: All 17+ primitives showcased

**Batch 4: Text & Lighting Showcases**

- Create TextShowcaseComponent (6 text components)
- Create LightingShowcaseComponent (5 light types)
- Verification: Text and lighting sections render correctly

**Batch 5: Directives & Postprocessing Showcases**

- Create DirectivesShowcaseComponent (9+ directives)
- Create PostprocessingShowcaseComponent (bloom before/after)
- Verification: Directives and effects demonstrated

**Batch 6: Controls & Services**

- Create ControlsShowcaseComponent (orbit controls variants)
- Create ServicesDocumentationComponent (6 services docs)
- Verification: Controls interactive, services documented

**Batch 7: Main Page Integration & Polish**

- Modify Angular3dShowcaseComponent to integrate all sections
- Add smooth scrolling navigation (optional enhancement)
- Final responsive testing
- Verification: Complete page works on mobile, tablet, desktop

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined (functional + non-functional)
- [x] Integration points documented
- [x] Files affected list complete (12 files: 10 CREATE, 1 REWRITE, 1 MODIFY)
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (MEDIUM-HIGH, 16-24 hours)
- [x] Batch breakdown suggested (7 batches)
- [x] No step-by-step implementation (that's team-leader's job)
- [x] All component APIs verified from library source
- [x] Zero assumptions without evidence
- [x] Architecture ready for team-leader decomposition

---

## 📋 Implementation Notes

### Performance Optimization Strategy

**Problem**: 37+ active 3D scenes on one page could degrade performance

**Solution** (deferred to implementation):

1. **Lazy Rendering**: Only render scenes in viewport (Intersection Observer API)
2. **Reduced Frame Rate**: Card scenes render at 30fps instead of 60fps
3. **Scene Complexity**: Card scenes use simpler geometries and fewer particles than hero scenes
4. **Code Splitting**: Lazy-load section components if needed (Angular route-level lazy loading)

**Evidence**: This is a common pattern for performance-heavy pages (no existing implementation in codebase - new pattern)

### Syntax Highlighting Library

**Requirement**: CodeSnippetComponent needs syntax highlighting

**Options**:

1. Prism.js (lightweight, popular)
2. highlight.js (auto-detection)
3. Monaco Editor (full IDE features - overkill)

**Recommendation**: Prism.js with Angular integration

**Implementation**: Deferred to frontend-developer (not specified in architecture)

### Navigation Component (Future Enhancement)

**Out of Scope for MVP**: Sticky navigation bar with anchor links (Requirement 12)

**Rationale**: Not critical for component showcase functionality

**Future Work**: Create NavigationComponent with smooth-scroll anchor links

- Use `ViewportScroller` service for programmatic scrolling
- Use Intersection Observer for active section highlighting

---

## 🎨 Design System Compliance

All components MUST use existing TailwindCSS design tokens:

**Typography**:

- `text-display-lg` - Large display text (section headings)
- `text-headline-lg`, `text-headline-md` - Headlines (subsection headings, card titles)
- `text-body-md`, `text-body-sm` - Body text (descriptions, code)

**Spacing**:

- `p-6x`, `p-4x`, `p-3x` - Padding (6 × 0.25rem = 1.5rem)
- `mb-4x`, `mb-2x` - Margin bottom
- `gap-8x`, `gap-6x` - Grid gaps

**Colors**:

- `bg-background-light` - Light background (#f9fafb equivalent)
- `bg-background-dark` - Dark background (#1a1a1a equivalent)
- `bg-white` - White cards
- `text-primary-500` - Primary accent color
- `text-text-secondary` - Secondary text color
- `text-neon-green` - Neon green accent

**Layout**:

- `max-w-container mx-auto` - Container max-width with centered alignment
- `grid md:grid-cols-2 lg:grid-cols-4` - Responsive grid
- `rounded-card` - Card border radius
- `shadow-card` - Card shadow

**Evidence**: Used consistently in all existing showcase components

---

## 🚀 Success Criteria

**Architecture is successful if**:

1. ✅ All 40+ components, directives, and services are showcased
2. ✅ Zero hallucinated APIs (all verified from library source)
3. ✅ Reusable components eliminate duplication (ShowcaseCard, CodeSnippet, SectionContainer)
4. ✅ Clear separation of concerns (sections/, scenes/, shared/)
5. ✅ Team-leader can decompose into 5-7 git-verifiable batches
6. ✅ Frontend-developer has complete component specifications
7. ✅ All patterns extracted from existing codebase (no invented patterns)
8. ✅ Evidence citations for every architectural decision

---

**End of Implementation Plan**
