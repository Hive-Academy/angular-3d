# Implementation Plan - TASK_2025_018

## 📊 Codebase Investigation Summary

### Libraries Discovered

**@hive-academy/angular-3d** (`libs/angular-3d/src/lib/`)

- **Key Components Verified**:

  - `Scene3dComponent` - Root 3D scene container
  - `GltfModelComponent` - GLTF model loading with material controls
  - `StarFieldComponent` - Configurable star field with twinkle, multi-size, stellar colors
  - `PlanetComponent` - Spherical planet with texture, emissive, and glow
  - `NebulaComponent` - Particle-based nebula clouds
  - `NebulaVolumetricComponent` - Layered volumetric nebula effects
  - `InstancedParticleTextComponent` - Performance-optimized particle text (instanced rendering)
  - `SmokeParticleTextComponent` - Particle text with drift effects
  - `GlowParticleTextComponent` - Particle text with glow effects
  - `SceneLightingComponent` - Theme-based lighting configuration
  - `OrbitControlsComponent` - Camera controls with zoom/pan/rotate
  - `BloomEffectComponent` - Post-processing bloom glow
  - `SvgIconComponent` - Extruded 3D SVG icons
  - `Rotate3dDirective` - Rotation animation
  - `Float3dDirective` - Floating animation
  - `ScrollZoomCoordinatorDirective` - Scroll-to-zoom coordination

- **Positioning System** (TASK_2025_016 - COMPLETE):

  - `ViewportPositioningService` - Reactive CSS-like positioning service
  - `ViewportPositionDirective` - Declarative template positioning
  - Types: `NamedPosition`, `PercentagePosition`, `PixelPosition`, `PositionOffset`
  - 73 unit tests passing

- **Documentation**: `libs/angular-3d/CLAUDE.md`, `libs/angular-3d/src/lib/positioning/*.ts`

### Patterns Identified

**Pattern 1: Viewport-Driven Positioning** (NEW - from TASK_2025_016)

- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:414-510`
- **Components**: `ViewportPositioningService`, `ViewportPositionDirective`
- **Convention**:
  - Programmatic: `positioner.getPosition('center')` returns reactive signal
  - Declarative: `viewportPosition="top-right"` directive on components
  - Supports named (`'center'`), percentage (`{ x: '50%', y: '38%' }`), pixel (`{ x: 100, y: 50 }`) positions
  - Z-depth layering via `viewportZ` or `offsetZ` parameters

**Pattern 2: Component Composition in Templates**

- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:72-393`
- **Components**: Declarative template syntax, no imperative Three.js code
- **Convention**: Parent `<a3d-scene-3d>` wraps child primitives, signal-based inputs, automatic cleanup via DestroyRef

**Pattern 3: Theme-Based Lighting**

- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:426-442`
- **Components**: `SceneLightingComponent` with `SceneLighting` interface
- **Convention**: Pass config object with `ambient` and `directional` light arrays

**Pattern 4: Multi-Layer Star Fields**

- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:334-352`
- **Components**: Multiple `<a3d-star-field>` at different radii (50, 40, 30)
- **Convention**: Background (largest radius) → Midground → Foreground (smallest) for parallax depth

**Pattern 5: GLTF Model Animation**

- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:107-136`
- **Components**: `GltfModelComponent` with `spaceFlightPath`, `spaceFlightRotations`, `spaceFlightAutoStart`
- **Convention**: Waypoint-based animation with `SpaceFlightWaypoint[]` type

**Pattern 6: Particle Text Positioning**

- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:175-215`
- **Components**: `InstancedParticleTextComponent`, `SmokeParticleTextComponent`
- **Convention**: Use `ViewportPositioningService.getPosition()` for reactive positions, bind to `[position]` input

### Integration Points

**ViewportPositioningService** (`libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts`)

- **Location**: Injectable service (`providedIn: 'root'`)
- **Interface**:
  - `getPosition(position, options)` - Unified position getter (returns `Signal<[x, y, z]>`)
  - `getNamedPosition(name, options)` - Named positions ('center', 'top-right', etc.)
  - `getPercentagePosition(pos, options)` - Percentage positions ({ x: '50%', y: '38%' })
  - `viewportWidth`, `viewportHeight` - Reactive viewport dimensions (computed signals)
  - `isCameraReady()` - Check if camera initialized
- **Usage**: Inject in component, call `getPosition()` methods, store returned signals, bind to template

**ViewportPositionDirective** (`libs/angular-3d/src/lib/positioning/viewport-position.directive.ts`)

- **Location**: Standalone directive, selector `[viewportPosition]`
- **Interface**:
  - `viewportPosition` - Required input (NamedPosition | PercentagePosition | PixelPosition)
  - `viewportOffset` - Optional offsets ({ offsetX, offsetY, offsetZ })
  - `viewportZ` - Optional Z-plane (default: 0)
- **Usage**: Apply to any 3D component with Three.js Object3D

**SceneLightingComponent** (`libs/angular-3d/src/lib/primitives/lights/scene-lighting.component.ts`)

- **Location**: Standalone component, selector `a3d-scene-lighting` (verified in primitives/lights/)
- **Interface**: `[config]` input expects `SceneLighting` type
- **Usage**: Single component replaces multiple light components

**StarFieldComponent** (`libs/angular-3d/src/lib/primitives/star-field.component.ts`)

- **Location**: Standalone component, selector `a3d-star-field`
- **Interface**:
  - `starCount` - Number of stars (default: 3000)
  - `radius` - Sphere radius (default: 40)
  - `enableTwinkle` - Twinkling animation (default: false)
  - `multiSize` - Multi-size distribution (default: false)
  - `stellarColors` - Temperature-based colors (default: false)
  - `enableGlow` - Glow texture (default: false)
- **Usage**: Create multiple instances at different radii for parallax layers

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Direct Replacement with Feature Parity Enhancement

**Rationale**:

1. Current implementation (`hero-3d-teaser.component.ts`) uses basic wireframe polyhedrons which fail to showcase library's advanced capabilities
2. Reference implementation (`hero-space-scene.component.ts`) demonstrates comprehensive feature set but is designed for full-page scene, needs adaptation for hero section
3. Requirements specify enhancing hero section + migrating ALL demo positioning to ViewportPositioningService
4. Anti-backward compatibility mandate: NO parallel implementations, direct replacement only

**Evidence**:

- Current: `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:78-128` (wireframe polyhedrons only)
- Reference: `temp/scene-graphs/hero-space-scene.component.ts:1-727` (comprehensive space scene)
- Requirements: `task-tracking/TASK_2025_018/task-description.md:11-131` (10 requirements)

### Component Specifications

---

#### Component 1: Enhanced Hero 3D Teaser Scene

**Purpose**: Transform hero section from basic wireframe demo to production-quality 3D scene showcasing advanced library capabilities

**Pattern**: Component Composition with Viewport Positioning
**Evidence**: Reference implementation pattern at `temp/scene-graphs/hero-space-scene.component.ts:72-393`

**Responsibilities**:

- Provide immersive space-themed background for hero section
- Demonstrate 5+ advanced library features (GLTF, particles, multi-layer stars, volumetric effects, positioning)
- Maintain 60fps performance on modern hardware
- Showcase ViewportPositioningService usage patterns for library users

**Base Classes/Interfaces** (verified):

- Extends: Angular `Component` (standalone)
- Implements: None (lifecycle managed via `DestroyRef`)
- Selector: `app-hero-3d-teaser` (preserve existing selector - direct replacement)

**Key Dependencies** (verified):

- `Scene3dComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/canvas/scene-3d.component.ts:21`)
- `ViewportPositioningService` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:65`)
- `ViewportPositionDirective` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:74`)
- `GltfModelComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`)
- `StarFieldComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/primitives/star-field.component.ts:84`)
- `InstancedParticleTextComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/primitives/particle-text/`)
- `NebulaVolumetricComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts`)
- `SceneLightingComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/primitives/lights/scene-lighting.component.ts`)
- `OrbitControlsComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/controls/orbit-controls.component.ts`)
- `BloomEffectComponent` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts`)
- `Rotate3dDirective` (import from: `@hive-academy/angular-3d` - `libs/angular-3d/src/lib/directives/rotate-3d.directive.ts`)

**Implementation Pattern**:

```typescript
// Pattern source: temp/scene-graphs/hero-space-scene.component.ts:54-396
// Verified imports from: libs/angular-3d/src/index.ts:1-36

import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Scene3dComponent, GltfModelComponent, StarFieldComponent, InstancedParticleTextComponent, NebulaVolumetricComponent, SceneLightingComponent, OrbitControlsComponent, BloomEffectComponent, Rotate3dDirective, ViewportPositioningService, ViewportPositionDirective } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-3d-teaser',
  standalone: true,
  imports: [Scene3dComponent, GltfModelComponent, StarFieldComponent, InstancedParticleTextComponent, NebulaVolumetricComponent, SceneLightingComponent, OrbitControlsComponent, BloomEffectComponent, Rotate3dDirective, ViewportPositionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="w-full h-full">
      <!-- POSITIONING PATTERN: All elements use ViewportPositioningService -->
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
        <!-- LIGHTING: Theme-based configuration -->
        <a3d-scene-lighting [config]="sceneLighting" />

        <!-- CAMERA CONTROLS: Orbit controls with scroll coordination -->
        <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" [enableZoom]="true" [minDistance]="5" [maxDistance]="50" />

        <!-- GLTF MODEL: Realistic Earth planet with rotation -->
        <!-- POSITIONING PATTERN: Directive-based positioning -->
        <a3d-gltf-model viewportPosition="center" [viewportOffset]="{ offsetZ: -9 }" [modelPath]="'/assets/3d/planet_earth/scene.gltf'" [scale]="2.3" [emissiveIntensity]="0.05" rotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />

        <!-- PARTICLE TEXT: Instanced rendering for performance -->
        <!-- POSITIONING PATTERN: Programmatic positioning via service -->
        <a3d-instanced-particle-text text="Build Production Grade AI Apps" [position]="topTextPosition()" [fontSize]="25" [particleColor]="'#9CA3AF'" [opacity]="0.35" />

        <!-- MULTI-LAYER STAR FIELDS: 3 layers for parallax depth -->
        <a3d-star-field [starCount]="3000" [radius]="50" [enableTwinkle]="true" [multiSize]="true" [stellarColors]="true" />
        <a3d-star-field [starCount]="2000" [radius]="40" />
        <a3d-star-field [starCount]="2500" [radius]="30" [enableTwinkle]="true" />

        <!-- VOLUMETRIC NEBULA: Layered atmospheric effects -->
        <!-- POSITIONING PATTERN: Named position with directive -->
        <a3d-nebula-volumetric viewportPosition="top-right" [width]="60" [height]="20" [layers]="2" [opacity]="0.9" [primaryColor]="'#0088ff'" />

        <!-- BLOOM POST-PROCESSING: Subtle glow without eye strain -->
        <a3d-bloom-effect [intensity]="0.5" [luminanceThreshold]="0.8" />
      </a3d-scene-3d>
    </div>
  `,
})
export class Hero3dTeaserComponent {
  // POSITIONING SERVICE: Inject for programmatic positioning
  private readonly positioning = inject(ViewportPositioningService);

  // REACTIVE POSITIONS: Store signals from positioning service
  readonly topTextPosition = this.positioning.getPosition({ x: '50%', y: '38%' });

  // LIGHTING CONFIGURATION: Theme-based setup
  readonly sceneLighting = {
    ambient: { color: 0xffffff, intensity: 0.05 },
    directional: [
      {
        color: 0xffffff,
        intensity: 0.3,
        position: [30, 15, 25] as [number, number, number],
        castShadow: true,
      },
    ],
  };
}
```

**Quality Requirements**:

**Functional Requirements**:

- SHALL render minimum 5 advanced features: GLTF model, particle text, multi-layer stars, volumetric nebula, lighting
- SHALL use ViewportPositioningService/Directive for ALL positioning (no hardcoded coordinates)
- SHALL provide interactive camera controls (orbit, zoom)
- SHALL handle GLTF loading states gracefully
- SHALL demonstrate both programmatic (`getPosition()`) and declarative (`viewportPosition` directive) positioning patterns

**Non-Functional Requirements**:

- **Performance**: Maintain 60fps on modern GPU (RTX 2060 equivalent)
- **Memory**: Total scene memory < 100MB
- **Load Time**: Initial render within 2 seconds on 50Mbps connection
- **Resource Cleanup**: Zero memory leaks via DestroyRef cleanup
- **Code Quality**: Zero `any` types, full TypeScript coverage

**Pattern Compliance**:

- MUST follow Angular 20 standalone component pattern (verified: `@angular/core@20.3`)
- MUST use signal-based inputs: `input<T>()`, `input.required<T>()` (verified in reference)
- MUST use `inject()` for dependency injection (verified: `temp/scene-graphs/hero-space-scene.component.ts:398`)
- MUST use `DestroyRef` for cleanup instead of `ngOnDestroy` (Angular pattern)
- MUST use `ChangeDetectionStrategy.OnPush` (verified in reference)
- MUST use ViewportPositioningService for ALL positioning (requirement 9)
- MUST document positioning strategies with inline comments (requirement 9.6)

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` (**REWRITE**)

---

#### Component 2: Scene Migration from temp/scene-graphs

**Purpose**: Migrate remaining 2 scenes from temp/scene-graphs to the demo app, updating to use modern library patterns

**Pattern**: Full Migration with Modern Library Patterns
**Evidence**: User feedback during architecture review (Option C: Prioritized Hybrid)

**Scenes to Migrate**:

1. **CTASceneGraphComponent** (`temp/scene-graphs/cta-scene-graph.component.ts`)

   - **Current State**: Uses old `ngt-*` elements, old import paths (`../../../../core/angular-3d/`)
   - **Migration Target**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/cta-scene.component.ts`
   - **Features**: 3 floating polyhedrons with subtle animations, ambient/directional lighting
   - **Complexity**: Simple (113 lines)

2. **HeroSceneGraphComponent** (`temp/scene-graphs/hero-scene-graph.component.ts`)
   - **Current State**: Uses old `ngt-*` elements, old import paths, `app-*` selectors
   - **Migration Target**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-scene.component.ts`
   - **Features**: Multiple primitives, 3D text keywords, background cubes, GLTF robot, multi-light setup
   - **Complexity**: Medium (420 lines)

**Migration Requirements**:

- Replace `angular-three` imports with `@hive-academy/angular-3d`
- Replace `ngt-*` elements with `a3d-*` components
- Replace `app-*` selectors with `a3d-*` selectors
- Replace hardcoded `[position]` with ViewportPositionDirective or service
- Update `Colors3D` import path to library export
- Add inline comments explaining positioning strategy

---

#### Component 3: Positioning Migration for angular-3d-showcase Scenes

**Purpose**: Standardize ALL demo components to use ViewportPositioningService, establishing best practices for library users

**Pattern**: Gradual Migration with Service Injection
**Evidence**: Requirement 10 (`task-tracking/TASK_2025_018/task-description.md:121-131`)

**Responsibilities**:

- Identify all hardcoded position values in showcase scenes
- Replace with ViewportPositioningService.getPosition() or ViewportPositionDirective
- Document positioning strategy with inline comments
- Ensure no regression in visual presentation

**Implementation Pattern**:

```typescript
// BEFORE (Hardcoded positioning - ANTI-PATTERN)
@Component({
  template: ` <a3d-box [position]="[5, 3, -10]" /> `,
})
export class OldSceneComponent {}

// AFTER (ViewportPositioningService - CORRECT PATTERN)
@Component({
  template: `
    <!-- Directive approach: Preferred for static positions -->
    <a3d-box viewportPosition="top-right" [viewportOffset]="{ offsetX: -2, offsetZ: -10 }" />

    <!-- Service approach: Preferred for computed positions -->
    <a3d-sphere [position]="dynamicPosition()" />
  `,
})
export class NewSceneComponent {
  private readonly positioning = inject(ViewportPositioningService);

  // Reactive position signal
  readonly dynamicPosition = this.positioning.getPosition('center', {
    offsetZ: -5,
  });
}
```

**Quality Requirements**:

**Functional Requirements**:

- SHALL migrate ALL showcase scenes to use ViewportPositioningService
- SHALL prefer named positions over percentages for clarity
- SHALL use directive syntax for template-based positions
- SHALL use service syntax for programmatic/computed positions
- SHALL maintain existing visual layout after migration

**Non-Functional Requirements**:

- **Maintainability**: Inline comments explain positioning strategy
- **Consistency**: All demo code follows same positioning pattern
- **Documentation**: Serves as reference implementation for library users

**Pattern Compliance**:

- MUST use named positions ('center', 'top-right') where possible (requirement 9.2)
- MUST use directive `[viewportPosition]` for template positions (requirement 9.3)
- MUST use Z-depth layering consistently: foreground (0 to -5), midground (-5 to -15), background (-15+) (requirement 9.4)
- MUST add inline comments explaining positioning (requirement 9.6)

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/value-props-3d-scene.component.ts` (**MODIFY**)
- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-space-scene.component.ts` (**MODIFY** - if not already using positioning service)
- Any other scene components discovered during implementation (**MODIFY**)

---

## 🔗 Integration Architecture

### Integration Points

**Integration 1: ViewportPositioningService → 3D Components**

- **How**: Service provides reactive position signals, components bind via `[position]` input or directive applies positions directly
- **Pattern**: Dependency injection + signal reactivity
- **Evidence**: `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:194-233`, `libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:74-157`

**Integration 2: SceneLightingComponent → Theme Configuration**

- **How**: Single component replaces multiple light components, accepts `SceneLighting` config object
- **Pattern**: Configuration-driven composition
- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:104`, `temp/scene-graphs/hero-space-scene.component.ts:426-442`

**Integration 3: OrbitControlsComponent → ScrollZoomCoordinatorDirective**

- **How**: Directive coordinates scroll events between 3D zoom and page scroll
- **Pattern**: Directive enhancement of component behavior
- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:83-99`

**Integration 4: GltfModelComponent → Space Flight Animation**

- **How**: Component accepts `spaceFlightPath` waypoint array for animation
- **Pattern**: Declarative animation configuration
- **Evidence**: `temp/scene-graphs/hero-space-scene.component.ts:116-119`, `temp/scene-graphs/hero-space-scene.component.ts:521-552`

### Data Flow

```
User loads hero section
  ↓
Scene3dComponent initializes WebGL renderer + camera
  ↓
ViewportPositioningService detects camera ready (isCameraReady() → true)
  ↓
Position signals compute based on camera FOV + viewport size
  ↓
Components receive reactive positions via:
  - Direct binding: [position]="positionSignal()"
  - Directive: viewportPosition="center"
  ↓
RenderLoopService starts requestAnimationFrame loop
  ↓
Components update per frame:
  - StarField twinkle animation
  - GLTF model rotation (Rotate3dDirective)
  - Particle text pulse/growth
  ↓
User resizes window
  ↓
ViewportPositioningService aspect ratio signal updates
  ↓
All position signals recompute reactively
  ↓
Components update positions automatically (signal reactivity)
```

### Dependencies

**External Dependencies** (from package.json - VERIFIED):

- `three@0.182.0` - Three.js core (VERIFIED in package.json)
- `three-stdlib` - Three.js utilities (VERIFIED in package.json)
- `@angular/core@20.3` - Angular framework (VERIFIED in package.json)

**Internal Dependencies** (within workspace):

- `@hive-academy/angular-3d` - All 3D components and positioning service
- No new library additions required (all features exist in codebase)

**Asset Dependencies** (REQUIRED for hero section):

- `/assets/3d/planet_earth/scene.gltf` - Earth planet model (VERIFY EXISTS)
- `/assets/3d/mini_robot.glb` - Robot model (optional for initial version)
- Font for particle text rendering (system fonts OK)

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

**Feature Completeness**:

- Hero section MUST showcase minimum 5 advanced features (Req 1-4)
- ALL demo components MUST use ViewportPositioningService (Req 9-10)
- Camera controls MUST provide smooth orbit/zoom interactions (Req 8)
- GLTF models MUST load gracefully without blocking render (Req 1.4)
- Particle text MUST demonstrate performance-optimized rendering (Req 2.1)

**Positioning Standards** (NEW - Req 9):

- ALL elements MUST use ViewportPositioningService or ViewportPositionDirective
- Named positions preferred over percentages for clarity
- Z-depth layering MUST follow convention: foreground (0 to -5), midground (-5 to -15), background (-15+)
- Inline comments MUST explain positioning strategy

### Non-Functional Requirements

**Performance** (Req 7):

- Frame rate: Maintain 60fps minimum on RTX 2060 equivalent GPU
- Memory: Total scene memory < 100MB
- Load time: Initial render within 2 seconds on 50Mbps connection
- Draw calls: Minimize to <50 through instancing (particle text uses instanced rendering)

**Maintainability**:

- Code organization: Declarative template syntax, no imperative Three.js manipulation
- Type safety: Full TypeScript coverage, zero `any` types
- Documentation: Inline comments for complex positioning and animation logic
- Component composition: Reusable patterns extracted to library (already done)

**Reliability**:

- Resource cleanup: Zero memory leaks via DestroyRef cleanup
- Error handling: Graceful degradation if GLTF fails to load
- Browser support: Latest 2 versions Chrome, Firefox, Safari, Edge
- WebGL compatibility: Scene3dComponent handles WebGL detection

**Usability**:

- Visual clarity: Text elements readable against background (sufficient contrast)
- Loading states: Display loading indicator during asset loading (if time permits)
- Accessibility: Canvas has `aria-label` describing scene content
- Mobile support: Disable resource-intensive effects on mobile (future enhancement)

### Pattern Compliance

**Angular 20 Patterns** (VERIFIED in reference implementation):

- Standalone components: `standalone: true` in all components
- Signal-based inputs: `input<T>()`, `input.required<T>()`
- Signal-based queries: `viewChild()`, `viewChildren()` (if needed)
- Dependency injection: `inject()` function (not constructor injection)
- Lifecycle: `DestroyRef.onDestroy()` (not `ngOnDestroy()`)
- Browser-only code: `afterNextRender()` for WebGL initialization
- Change detection: `ChangeDetectionStrategy.OnPush`

**Library Patterns** (VERIFIED in codebase):

- All 3D components use `NG_3D_PARENT` token for parent-child relationships
- All animations use `RenderLoopService.registerUpdateCallback()`
- All positions use `ViewportPositioningService.getPosition()` or `ViewportPositionDirective`
- All cleanup uses `DestroyRef.onDestroy()` for Three.js resource disposal

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: **frontend-developer**

**Rationale**:

1. **Component Work**: Implementation primarily involves Angular component development, template syntax, and signal-based reactivity
2. **Three.js Abstraction**: All Three.js complexity abstracted by library components - no low-level mesh/geometry manipulation required
3. **Positioning Logic**: ViewportPositioningService provides high-level API similar to CSS positioning - web developer friendly
4. **Integration Pattern**: Declarative template composition (like React/Vue component composition) rather than imperative 3D programming
5. **Browser Environment**: Relies on browser APIs (window resize, requestAnimationFrame) - frontend developer familiar territory

**NOT backend-developer because**:

- No NestJS services, controllers, or database interactions
- No server-side rendering concerns (positioning service is SSR-safe already)
- No API integration or GraphQL queries

### Complexity Assessment

**Complexity**: **MEDIUM-HIGH**

**Estimated Effort**: **12 hours** (expanded from 10 hours to include scene migrations)

**Breakdown**:

**Phase 1: Core Structure (2 hours)**

1. REWRITE hero-3d-teaser.component.ts with new template structure
2. Set up ViewportPositioningService injection
3. Add GLTF Earth planet model with rotation
4. Implement basic lighting configuration via SceneLightingComponent

**Phase 2: Visual Effects (3 hours)** 5. Add multi-layer star fields (3 layers: 50, 40, 30 radius) 6. Integrate instanced particle text (3+ text elements) with ViewportPositioningService 7. Add volumetric nebula with bloom post-processing 8. Configure camera orbit controls

**Phase 3: Scene Migration from temp/scene-graphs (2 hours) [NEW]** 9. Migrate CTASceneGraphComponent → cta-scene.component.ts

- Update imports to @hive-academy/angular-3d
- Replace ngt-_ with a3d-_ components
- Apply ViewportPositionDirective for all positions

10. Migrate HeroSceneGraphComponent → hero-scene.component.ts
    - Update imports to @hive-academy/angular-3d
    - Replace app-_ selectors with a3d-_ selectors
    - Convert hardcoded positions to ViewportPositioner
    - Verify GLTF robot model path

**Phase 4: Positioning Standardization (2 hours)** 11. Audit showcase scenes for hardcoded positions 12. Migrate existing showcase scenes to ViewportPositioningService/Directive 13. Add inline documentation for positioning patterns 14. Verify no visual regression after migration

**Phase 5: Advanced Features (2 hours - OPTIONAL)** 15. Add robot models with space flight animations (if time permits) 16. Fine-tune performance (texture sizes, particle counts, draw call optimization) 17. Add loading states for GLTF models (if time permits)

**Phase 6: Polish & Testing (1 hour)** 18. Implement comprehensive resource cleanup in DestroyRef 19. Add accessibility labels (aria-label on canvas) 20. Performance profiling (verify 60fps target) 21. Manual testing across browsers

### Files Affected Summary

**REWRITE** (Direct Replacement):

- `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts`
  - **Description**: Complete rewrite from wireframe polyhedrons to comprehensive space scene
  - **Impact**: High - main deliverable for task
  - **Pattern**: Component composition with ViewportPositioningService integration

**CREATE** (Scene Migrations from temp/scene-graphs):

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/cta-scene.component.ts`

  - **Source**: `temp/scene-graphs/cta-scene-graph.component.ts`
  - **Description**: CTA section background with 3 floating polyhedrons
  - **Impact**: Medium - adds new showcase scene
  - **Migration**: ngt-_ → a3d-_, old imports → @hive-academy/angular-3d, hardcoded positions → ViewportPositioner

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-scene.component.ts`
  - **Source**: `temp/scene-graphs/hero-scene-graph.component.ts`
  - **Description**: Full hero scene with primitives, 3D text, background cubes, GLTF robot
  - **Impact**: High - comprehensive showcase scene
  - **Migration**: app-_ → a3d-_, ngt-_ lights → a3d-_ lights, Colors3D import path, hardcoded positions → ViewportPositioner

**MODIFY** (Positioning Migration):

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/value-props-3d-scene.component.ts`

  - **Description**: Replace hardcoded positions with ViewportPositioningService
  - **Impact**: Medium - standardization work
  - **Pattern**: Inject service, replace `[position]="[x, y, z]"` with `[position]="positionSignal()"` or `viewportPosition` directive

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-space-scene.component.ts` (IF NEEDED)

  - **Description**: Verify already uses positioning service (reference implementation), migrate if not
  - **Impact**: Low - may already be compliant
  - **Pattern**: Audit for consistency with standards

- **Additional scene components** (TO BE DISCOVERED)
  - **Description**: Find via `Glob(apps/angular-3d-demo/src/app/pages/**/scenes/*.component.ts)` and audit
  - **Impact**: Low-Medium per component
  - **Pattern**: Same as above

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **All library components exist in codebase**:

   - ✅ `GltfModelComponent` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/primitives/gltf-model.component.ts`)
   - ✅ `StarFieldComponent` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/primitives/star-field.component.ts:84`)
   - ✅ `InstancedParticleTextComponent` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts`)
   - ✅ `NebulaVolumetricComponent` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts`)
   - ✅ `SceneLightingComponent` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/primitives/lights/scene-lighting.component.ts`)
   - ✅ `ViewportPositioningService` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:65`)
   - ✅ `ViewportPositionDirective` from `@hive-academy/angular-3d` (`libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:74`)

2. **All patterns verified from reference implementation**:

   - ✅ Viewport positioning pattern: `temp/scene-graphs/hero-space-scene.component.ts:414-510`
   - ✅ Component composition pattern: `temp/scene-graphs/hero-space-scene.component.ts:72-393`
   - ✅ Theme-based lighting pattern: `temp/scene-graphs/hero-space-scene.component.ts:426-442`
   - ✅ Multi-layer star field pattern: `temp/scene-graphs/hero-space-scene.component.ts:334-352`
   - ✅ GLTF animation pattern: `temp/scene-graphs/hero-space-scene.component.ts:107-136`

3. **All positioning service methods exist**:

   - ✅ `getPosition(position, options)` - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:416-439`
   - ✅ `getNamedPosition(name, options)` - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:194-233`
   - ✅ `getPercentagePosition(pos, options)` - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:262-310`
   - ✅ `viewportWidth` signal - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:123-133`
   - ✅ `viewportHeight` signal - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:146-155`
   - ✅ `isCameraReady()` signal - `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts:107-109`

4. **Required assets exist**:

   - ⚠️ **VERIFY**: `/assets/3d/planet_earth/scene.gltf` exists in `apps/angular-3d-demo/public/assets/3d/`
   - ⚠️ **OPTIONAL**: `/assets/3d/mini_robot.glb` (for robot animation, can be deferred to Phase 3)
   - ✅ Fonts: System fonts used for particle text (no asset dependency)

5. **No hallucinated APIs**:
   - All components verified in `libs/angular-3d/src/lib/primitives/index.ts:1-39`
   - All directives verified in `libs/angular-3d/src/lib/directives/index.ts`
   - All positioning types verified in `libs/angular-3d/src/lib/positioning/viewport-positioning.types.ts:1-154`
   - ViewportPositioningService methods verified in source file
   - All patterns extracted from real reference implementation

### Architecture Delivery Checklist

- [x] All components specified with evidence (Components 1-2)
- [x] All patterns verified from codebase (6 patterns identified)
- [x] All imports/decorators verified as existing (all components verified in library exports)
- [x] Quality requirements defined (Functional + Non-functional + Pattern compliance)
- [x] Integration points documented (4 integration points + data flow)
- [x] Files affected list complete (1 REWRITE + 2+ MODIFY)
- [x] Developer type recommended (frontend-developer with rationale)
- [x] Complexity assessed (MEDIUM, 10 hours, 5 phases)
- [x] No step-by-step implementation (WHAT to build specified, not HOW)
- [x] Evidence citations for all decisions (file:line references throughout)
- [x] Asset dependencies identified (GLTF models - requires verification)
- [x] Anti-backward compatibility enforced (direct replacement, no parallel implementations)
- [x] Positioning standardization scope defined (Req 9-10 migration plan)

---

## 📋 Additional Notes for Team-Leader

### Asset Verification Required

**CRITICAL**: Before task assignment, verify these assets exist:

```bash
# Check if planet GLTF exists
ls apps/angular-3d-demo/public/assets/3d/planet_earth/scene.gltf

# If missing, developer must:
# 1. Find free/open-source planet GLTF model
# 2. Place in public/assets/3d/planet_earth/
# 3. Or use fallback: Basic sphere with PlanetComponent
```

**Fallback Strategy** (if GLTF missing):

- Use `PlanetComponent` with Earth texture instead of GLTF model
- Still demonstrates advanced features (particle text, stars, nebula, positioning)
- GLTF requirement becomes Phase 3 (optional)

### Performance Budget

**Target Hardware**: RTX 2060 or equivalent (verified in requirements)

**Performance Monitoring** (developer should profile):

- Frame rate: Chrome DevTools Performance panel → should stay at 60fps
- Memory: Chrome DevTools Memory panel → Total JS heap < 100MB
- Draw calls: Three.js renderer.info.render.calls < 50
- Geometry count: renderer.info.memory.geometries < 100

**Optimization Levers** (if performance below target):

1. Reduce star count: 7500 → 5000 total stars
2. Disable twinkle on background layer (largest star count)
3. Reduce nebula particle count: 60 → 40 particles
4. Reduce particle text density: particlesPerPixel 3 → 2
5. Disable bloom post-processing (most expensive effect)

### Positioning Migration Strategy

**Discovery Phase** (developer should run):

```bash
# Find all scene components
Glob(apps/angular-3d-demo/src/app/pages/**/scenes/*.component.ts)
Glob(apps/angular-3d-demo/src/app/pages/**/sections/*.component.ts)

# Search for hardcoded positions
Grep([position]="[", output_mode: "files_with_matches")
Grep(position: [, output_mode: "files_with_matches")
```

**Migration Checklist** (per component):

- [ ] Inject `ViewportPositioningService`
- [ ] Replace `[position]="[x, y, z]"` with `[position]="signal()"`
- [ ] OR add `viewportPosition` directive for static positions
- [ ] Add inline comment explaining positioning strategy
- [ ] Verify no visual regression (compare before/after screenshots)

### Z-Depth Layering Convention

**Standard Established by This Task** (Req 9.4):

```typescript
// Foreground layer (UI elements, text): 0 to -5
viewportPosition = 'center'[viewportOffset] = '{ offsetZ: -2 }';

// Midground layer (logos, secondary elements): -5 to -15
viewportPosition = 'top-right'[viewportOffset] = '{ offsetZ: -10 }';

// Background layer (nebula, distant objects): -15+
viewportPosition = 'top-left'[viewportOffset] = '{ offsetZ: -20 }';
```

**Document in Code** (inline comments required):

```typescript
// Z-DEPTH LAYERING CONVENTION:
// - Foreground: 0 to -5 (text, UI elements)
// - Midground: -5 to -15 (logos, secondary elements)
// - Background: -15+ (nebula, distant objects)
```

---

## 🏛️ Architecture Summary

This implementation plan specifies **WHAT** to build and **WHY**, not **HOW** to build it step-by-step.

**Key Architectural Decisions**:

1. **Direct Replacement**: REWRITE hero-3d-teaser.component.ts (no backward compatibility)
2. **Positioning Standard**: ALL demo components use ViewportPositioningService (Req 9-10)
3. **Feature Showcase**: Minimum 5 advanced features (GLTF, particles, stars, nebula, lighting)
4. **Performance First**: Instanced rendering, texture optimization, <50 draw calls
5. **Developer-Friendly**: CSS-like positioning API, declarative templates, no imperative Three.js

**Team-Leader Decomposition Guidance**:

- Break into 5 phases (Core → Effects → Advanced → Migration → Polish)
- Verify asset availability before assignment (GLTF planet model)
- Frontend-developer best suited (Angular + Three.js abstraction + browser APIs)
- Medium complexity (10 hours estimated)
- Git-verifiable milestones after each phase

**Success Criteria**:

- Hero section has "wow factor" visual impact (stakeholder: visitors)
- Code demonstrates positioning best practices (stakeholder: library users)
- 60fps performance maintained (stakeholder: all)
- Zero memory leaks (stakeholder: maintainers)
- All demo components use standardized positioning (stakeholder: maintainers)
- All temp/scene-graphs scenes migrated to demo app (2 scenes)

---

## 📌 Future Task: TASK_2025_019 - Primitives Playground

**Deferred to Separate Task** (per user decision: Option C)

**Scope**:

- Create comprehensive Primitives Playground component
- Showcase ALL 25+ library primitives (not just 4)
- Add interactive controls (sliders, toggles) for component properties
- Organize by category: Shapes, Text, Effects, Lights, Models

**Why Deferred**:

- Significant scope (10+ hours estimated)
- Current primitives-showcase only shows 4 of 25+ primitives
- Interactive playground requires UI controls infrastructure
- Better as focused task after TASK_2025_018 completes
