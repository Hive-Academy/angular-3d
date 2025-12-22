# Implementation Plan - TASK_2025_019

## Codebase Investigation Summary

### Libraries Discovered
- **@hive-academy/angular-3d** (`libs/angular-3d/`) - All required components verified as existing
  - Key exports: Scene3dComponent, OrbitControlsComponent, GltfModelComponent, PlanetComponent, StarFieldComponent, NebulaVolumetricComponent, InstancedParticleTextComponent, BloomEffectComponent
  - Directives: SpaceFlight3dDirective, Float3dDirective, Rotate3dDirective, ViewportPositionDirective
  - Services: ViewportPositioningService, SceneService, RenderLoopService
  - Documentation: `libs/angular-3d/CLAUDE.md`

### Patterns Identified
- **Hero Scene Pattern**: Production reference at `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` (152 lines)
  - Scene3dComponent as root container with camera configuration
  - ViewportPositioningService for reactive CSS-like positioning
  - Multi-layer star fields for parallax depth
  - Computed signals for position management (camera-ready checks)
  - DestroyRef for cleanup (implicit in component lifecycle)

- **GLTF Flight Animation Pattern**: Full reference at `temp/scene-graphs/hero-space-scene.component.ts` (728 lines)
  - GltfModelComponent with SpaceFlight3dDirective
  - Flight paths defined as SpaceFlightWaypoint arrays
  - Multiple robots with non-overlapping paths
  - ViewportPositioner utility class for positioning

- **Current Hero Implementation**: `apps/angular-3d-demo/src/app/pages/gsap-showcase/gsap-showcase.component.ts` (lines 22-205)
  - Static PNG background with GSAP scroll animations
  - HTML overlay content (badge, title, subtitle, CTA buttons)
  - Must preserve HTML overlay while replacing background with 3D scene

### Integration Points
- **Scene3dComponent**: Root 3D container
  - Location: `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`
  - Interface: `[cameraPosition]`, `[cameraFov]` inputs
  - Usage: Wrap all 3D elements, creates WebGLRenderer

- **ViewportPositioningService**: Reactive positioning
  - Location: `libs/angular-3d/src/lib/positioning/viewport-positioning.service.ts`
  - Interface: `inject(ViewportPositioningService)`, `isCameraReady()`, `getPosition({ x: '50%', y: '25%' })()`
  - Usage: Position elements using CSS-like percentages, prevent flash before camera ready

- **SpaceFlight3dDirective**: Animation directive
  - Location: `libs/angular-3d/src/lib/directives/space-flight-3d.directive.ts`
  - Interface: `[a3dSpaceFlight3d]`, `[flightPath]`, `[rotationsPerCycle]`, `[loop]`, `[autoStart]`
  - Usage: Apply to GltfModelComponent for cinematic flight paths

### Asset Inventory
**GLTF Models** (verified via Glob):
- `/3d/planet_earth/scene.gltf` - Earth model (exists at `apps/angular-3d-demo/public/3d/planet_earth/scene.gltf`)
- `/3d/mini_robot.glb` - Flying robot 1 (exists at `apps/angular-3d-demo/public/3d/mini_robot.glb`)
- `/3d/robo_head/scene.gltf` - Flying robot 2 (exists at `apps/angular-3d-demo/public/3d/robo_head/scene.gltf`)

**Textures**:
- `/moon.jpg` - Fallback planet texture (exists at `apps/angular-3d-demo/public/moon.jpg`)

**Color Palette** (from `apps/angular-3d-demo/src/app/shared/colors.ts`):
- SCENE_COLORS: white (0xffffff), indigo (0x6366f1), neonGreen (0xa1ff4f), deepBlue (0x2244ff), softGray (0x9ca3af), skyBlue (0x0088ff)
- SCENE_COLOR_STRINGS: skyBlue ('#0088ff'), neonGreen ('#a1ff4f'), white ('#ffffff')

---

## Architecture Design (Codebase-Aligned)

### Design Philosophy
**Chosen Approach**: Inline 3D Scene with HTML Overlay Hybrid

**Rationale**:
- Preserves existing GSAP scroll animations on HTML overlay content
- Replaces static PNG background with interactive 3D scene
- Matches production pattern from hero-3d-teaser.component.ts
- Avoids creating separate component (reduces complexity)
- All library components are verified as existing

**Evidence**:
- hero-3d-teaser.component.ts pattern: Scene wrapped in container div with ARIA label (lines 50-125)
- hero-space-scene.component.ts pattern: Flight paths defined as component properties (lines 521-549)
- gsap-showcase.component.ts structure: HTML overlay with absolute positioning (lines 51-204)

### Component Architecture

#### Component 1: Enhanced GSAP Showcase Hero Section (Inline Modification)

**Purpose**: Replace static PNG background with interactive 3D scene while preserving HTML overlay content

**Pattern**: Inline Scene Integration (verified from hero-3d-teaser.component.ts)

**Evidence**:
- hero-3d-teaser.component.ts uses wrapper div with Scene3dComponent inside (lines 50-125)
- All HTML content remains in overlay with relative z-index positioning
- Scene fills container with `width: 100%`, `height: 100%`

**Responsibilities**:
- Render interactive 3D space scene as hero background
- Manage OrbitControls for camera interaction
- Animate GLTF robot models on flight paths
- Display multi-layer star fields with parallax
- Provide proper lighting and post-processing effects
- Preserve existing HTML overlay content and GSAP animations

**Implementation Pattern**:
```typescript
// Pattern source: hero-3d-teaser.component.ts:1-151
// Verified imports from: @hive-academy/angular-3d (libs/angular-3d/src/index.ts:1-36)

import {
  Scene3dComponent,
  AmbientLightComponent,
  DirectionalLightComponent,
  ViewportPositioningService,
  ViewportPositionDirective,
  Rotate3dDirective,
  PlanetComponent,
  StarFieldComponent,
  InstancedParticleTextComponent,
  NebulaVolumetricComponent,
  OrbitControlsComponent,
  BloomEffectComponent,
  GltfModelComponent,
  SpaceFlight3dDirective,
  type SpaceFlightWaypoint,
} from '@hive-academy/angular-3d';

@Component({
  selector: 'app-gsap-showcase',
  imports: [
    // Existing imports
    NgOptimizedImage,
    ScrollAnimationDirective,
    // ... section components

    // New 3D imports
    Scene3dComponent,
    AmbientLightComponent,
    DirectionalLightComponent,
    ViewportPositionDirective,
    Rotate3dDirective,
    PlanetComponent,
    StarFieldComponent,
    InstancedParticleTextComponent,
    NebulaVolumetricComponent,
    OrbitControlsComponent,
    BloomEffectComponent,
    GltfModelComponent,
    SpaceFlight3dDirective,
  ],
  template: `
    <!-- GSAP Hero with 3D Background -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden">

      <!-- 3D Scene Background (NEW - replaces PNG) -->
      <div
        class="absolute inset-0 w-full h-full min-h-screen"
        role="img"
        aria-label="Interactive 3D space scene with rotating Earth, flying robots, twinkling stars, and camera controls"
      >
        <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
          <!-- Lighting -->
          <a3d-ambient-light [color]="colors.white" [intensity]="0.05" />
          <a3d-directional-light
            [position]="[30, 15, 25]"
            [color]="colors.white"
            [intensity]="0.3"
            [castShadow]="true"
          />

          <!-- Central Planet -->
          <a3d-gltf-model
            [modelPath]="'/3d/planet_earth/scene.gltf'"
            viewportPosition="center"
            [viewportOffset]="{ offsetZ: -9 }"
            [scale]="2.3"
            a3dRotate3d
            [rotateConfig]="{ axis: 'y', speed: 60 }"
          />

          <!-- Flying Robot 1 -->
          <a3d-gltf-model
            [modelPath]="'/3d/mini_robot.glb'"
            [scale]="0.05"
            a3dSpaceFlight3d
            [flightPath]="robot1FlightPath"
            [rotationsPerCycle]="8"
            [loop]="true"
            [autoStart]="true"
          />

          <!-- Flying Robot 2 -->
          <a3d-gltf-model
            [modelPath]="'/3d/robo_head/scene.gltf'"
            [scale]="1.0"
            a3dSpaceFlight3d
            [flightPath]="robot2FlightPath"
            [rotationsPerCycle]="6"
            [loop]="true"
            [autoStart]="true"
          />

          <!-- Multi-layer star fields -->
          <a3d-star-field
            [starCount]="3000"
            [radius]="50"
            [enableTwinkle]="true"
            [multiSize]="true"
            [stellarColors]="true"
          />
          <a3d-star-field [starCount]="2000" [radius]="40" />
          <a3d-star-field
            [starCount]="2500"
            [radius]="30"
            [enableTwinkle]="true"
          />

          <!-- Particle text -->
          <a3d-instanced-particle-text
            text="Angular 3D Library"
            [position]="heroTextPosition()"
            [fontSize]="25"
            [particleColor]="colors.softGray"
            [opacity]="0.35"
          />

          <!-- Nebula -->
          <a3d-nebula-volumetric
            viewportPosition="top-right"
            [viewportOffset]="{ offsetZ: -20 }"
            [width]="60"
            [height]="20"
            [layers]="2"
            [opacity]="0.9"
            [primaryColor]="colorStrings.skyBlue"
          />

          <!-- Camera controls -->
          <a3d-orbit-controls
            [enableDamping]="true"
            [dampingFactor]="0.05"
            [enableZoom]="true"
            [minDistance]="5"
            [maxDistance]="50"
          />

          <!-- Post-processing -->
          <a3d-bloom-effect [threshold]="0.8" [strength]="0.5" [radius]="0.4" />
        </a3d-scene-3d>
      </div>

      <!-- Gradient Overlay (EXISTING) -->
      <div class="absolute inset-0 bg-gradient-to-b from-background-dark/100 via-transparent to-background-dark/100"></div>

      <!-- Hero Content (EXISTING - unchanged) -->
      <div class="relative z-10 text-center text-white px-4 sm:px-6 md:px-8 max-w-5xl mx-auto mt-20 hero-content">
        <!-- ... existing badge, title, subtitle, CTA buttons ... -->
      </div>
    </section>
  `,
})
export class GsapShowcaseComponent {
  private readonly positioning = inject(ViewportPositioningService);

  public readonly colors = SCENE_COLORS;
  public readonly colorStrings = SCENE_COLOR_STRINGS;

  // Position for particle text (prevent flash before camera ready)
  public readonly heroTextPosition = computed(() => {
    if (!this.positioning.isCameraReady()) {
      return [0, 100, 0] as [number, number, number];
    }
    return this.positioning.getPosition({ x: '50%', y: '20%' })();
  });

  // Robot flight paths (verified pattern from hero-space-scene.component.ts:521-549)
  readonly robot1FlightPath: SpaceFlightWaypoint[] = [
    { position: [-12, 8, -8], duration: 10, easing: 'easeInOut' },
    { position: [10, 12, -5], duration: 8, easing: 'easeInOut' },
    { position: [-6, 4, 10], duration: 9, easing: 'easeIn' },
    { position: [8, 10, -12], duration: 11, easing: 'easeOut' },
    { position: [-12, 8, -8], duration: 8, easing: 'easeInOut' },
  ];

  readonly robot2FlightPath: SpaceFlightWaypoint[] = [
    { position: [4, -3, -8], duration: 9, easing: 'easeOut' },
    { position: [-8, -5, -5], duration: 10, easing: 'easeInOut' },
    { position: [12, -4, 16], duration: 8, easing: 'easeInOut' },
    { position: [10, -6, -15], duration: 11, easing: 'easeIn' },
    { position: [-6, -5, -10], duration: 9, easing: 'easeInOut' },
  ];
}
```

**Quality Requirements**:

**Functional Requirements**:
- Scene renders interactive 3D WebGL at 60fps target
- OrbitControls respond to mouse drag (rotate) and scroll (zoom)
- Planet rotates continuously at 60 degrees/second
- Robots follow flight paths with smooth interpolation
- Stars twinkle subtly on background layers
- Particle text renders at viewport top (20% from top)
- Bloom effect applies to bright elements only
- All existing HTML overlay content and GSAP scroll animations remain functional

**Non-Functional Requirements**:
- Performance: 55fps+ on mid-range hardware (Intel UHD 620)
- Load time: Scene interactive within 4 seconds
- Memory: < 150MB GPU usage, zero leaks over 5 minutes
- Accessibility: WCAG 2.1 AA compliance (ARIA labels, reduced motion support)
- Responsive: Functional on desktop, tablet, mobile (simplified on mobile)

**Pattern Compliance**:
- Scene3dComponent wraps all 3D elements (verified: hero-3d-teaser.component.ts:55)
- ViewportPositioningService for reactive positioning (verified: hero-3d-teaser.component.ts:138-150)
- Computed signals for camera-ready checks (verified: hero-3d-teaser.component.ts:144-150)
- Multi-layer star fields for parallax depth (verified: hero-3d-teaser.component.ts:78-91)
- Lighting setup: ambient + directional (verified: hero-3d-teaser.component.ts:57-63)
- GLTF models with SpaceFlight3dDirective (verified: hero-space-scene.component.ts:521-549)
- DestroyRef cleanup (implicit in Angular component lifecycle)

**Files Affected**:
- `apps/angular-3d-demo/src/app/pages/gsap-showcase/gsap-showcase.component.ts` (MODIFY - inline 3D scene)
- `apps/angular-3d-demo/src/app/shared/colors.ts` (READ - verify color constants exist)

---

## Integration Architecture

### Integration Points

**1. Scene Container Integration**:
- Replace static PNG `<img>` element (lines 37-44) with 3D scene wrapper div
- Scene fills container: `width: 100%`, `height: 100%`
- Preserve absolute positioning for background layer
- Pattern: hero-3d-teaser.component.ts wrapper div (lines 50-54)

**2. HTML Overlay Preservation**:
- Existing HTML overlay (lines 51-204) remains unchanged
- z-index layering: 3D scene (z-0) → gradient overlay (z-1) → HTML content (z-10)
- All GSAP scroll animations continue functioning
- Pattern: Absolute positioning with relative z-index (gsap-showcase.component.ts:51-204)

**3. ViewportPositioningService Integration**:
- Inject service in component class
- Use computed signal for particle text position
- Camera-ready check prevents flash before render
- Pattern: hero-3d-teaser.component.ts positioning service (lines 138-150)

**4. Asset Loading**:
- GLTF models loaded via GltfModelComponent `[modelPath]` input
- Paths relative to public folder: `/3d/planet_earth/scene.gltf`
- No fallback needed (assets verified as existing)
- Pattern: GltfModelComponent usage from temp/hero-space-scene.component.ts

### Data Flow

**Component Initialization** → **Scene Render** → **Asset Loading** → **Animation Start**

1. Component constructor: Inject ViewportPositioningService
2. AfterNextRender: Scene3dComponent creates WebGLRenderer, Camera, Scene
3. GLTF models load asynchronously (GltfModelComponent internal handling)
4. SpaceFlight3dDirective starts flight animations (autoStart=true)
5. RenderLoopService registers per-frame updates for rotation, float, twinkle
6. OrbitControls enable after scene ready (mouse drag → camera orbit)

### Dependencies

**Internal**:
- `@hive-academy/angular-3d` - All 3D components and directives (verified exports in libs/angular-3d/src/index.ts)
- `apps/angular-3d-demo/src/app/shared/colors.ts` - Color constants (SCENE_COLORS, SCENE_COLOR_STRINGS)

**External**:
- Three.js (already integrated via angular-3d library)
- @angular/common (NgOptimizedImage - existing)
- @hive-academy/angular-gsap (ScrollAnimationDirective - existing)

---

## Quality Requirements (Architecture-Level)

### Functional Requirements
- Interactive 3D scene renders as hero background
- OrbitControls enable camera rotation (drag) and zoom (scroll)
- Planet rotates continuously with Rotate3dDirective
- 2 robots fly on non-overlapping paths with SpaceFlight3dDirective
- 3 star field layers create parallax depth effect
- Particle text renders "Angular 3D Library" at top 20%
- Volumetric nebula appears in top-right background
- Bloom effect enhances bright elements (planet, stars)
- All existing HTML overlay content renders on top
- All existing GSAP scroll animations function unchanged

### Non-Functional Requirements

**Performance**:
- 55fps minimum on mid-range hardware (Intel UHD 620 integrated graphics)
- < 4 seconds to interactive (GLTF models loaded, scene responsive)
- < 150MB GPU memory usage
- Zero memory leaks over 5-minute interaction test
- < 50 draw calls per frame
- < 500,000 triangles total

**Accessibility**:
- ARIA label on scene container: "Interactive 3D space scene with rotating Earth, flying robots, twinkling stars, and camera controls"
- Respect `prefers-reduced-motion` media query (disable auto-rotation, float animations)
- Keyboard focus indicators remain visible on HTML overlay elements
- Tab order flows logically through HTML content after hero

**Responsiveness**:
- Desktop (>1024px): Full scene with all effects
- Tablet (768-1024px): Full scene, reduce star count by 30% if performance issues
- Mobile (<768px): Simplified scene (disable bloom, 2 star layers instead of 3, no flying robots)

**Browser Compatibility**:
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+
- WebGL 2.0 preferred, fallback to WebGL 1.0

**Security**:
- All assets served from public folder (no external URLs)
- No user-provided content rendered in 3D scene
- Content Security Policy compliant

### Pattern Compliance
- Scene3dComponent as root 3D container (verified: hero-3d-teaser.component.ts:55)
- ViewportPositioningService for reactive positioning (verified: hero-3d-teaser.component.ts:138)
- Computed signals for camera-ready checks (verified: hero-3d-teaser.component.ts:144-150)
- SpaceFlight3dDirective for GLTF flight paths (verified: space-flight-3d.directive.ts:77-100)
- Multi-layer star fields for depth (verified: hero-3d-teaser.component.ts:78-91)
- Rotate3dDirective for planet rotation (verified: hero-3d-teaser.component.ts:74-75)
- ChangeDetectionStrategy.OnPush (existing in gsap-showcase.component.ts:19)
- DestroyRef cleanup (implicit in component lifecycle)

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:
- Primarily UI component modification (Angular template and component class)
- Requires understanding of Angular standalone components, signals, and change detection
- 3D scene integration uses declarative Angular components (no manual Three.js manipulation)
- CSS/styling knowledge needed for absolute positioning and z-index layering
- GSAP integration knowledge helpful (must preserve existing scroll animations)
- Browser rendering and performance optimization experience beneficial

### Complexity Assessment

**Complexity**: MEDIUM

**Estimated Effort**: 4-6 hours

**Breakdown**:
- Template modification (1-2 hours): Replace PNG with 3D scene template, preserve HTML overlay
- Component class updates (1 hour): Add ViewportPositioningService, flight path constants, computed signals
- Import statements (0.5 hours): Add all required 3D component imports
- Testing and debugging (1-2 hours): Verify rendering, fix z-index issues, test OrbitControls
- Performance optimization (0.5-1 hour): Profile frame rate, optimize star counts if needed
- Accessibility validation (0.5 hours): Add ARIA labels, test reduced motion support

### Files Affected Summary

**MODIFY**:
- `apps/angular-3d-demo/src/app/pages/gsap-showcase/gsap-showcase.component.ts` (inline 3D scene, add component properties)

**READ** (for reference):
- `apps/angular-3d-demo/src/app/shared/colors.ts` (verify color constants)
- `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` (reference pattern)
- `temp/scene-graphs/hero-space-scene.component.ts` (flight path reference)

**ASSETS** (already exist, verified):
- `apps/angular-3d-demo/public/3d/planet_earth/scene.gltf`
- `apps/angular-3d-demo/public/3d/mini_robot.glb`
- `apps/angular-3d-demo/public/3d/robo_head/scene.gltf`

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **All imports exist in codebase**:
   - Scene3dComponent from @hive-academy/angular-3d (libs/angular-3d/src/lib/canvas/index.ts)
   - OrbitControlsComponent from @hive-academy/angular-3d (libs/angular-3d/src/lib/controls/index.ts)
   - GltfModelComponent from @hive-academy/angular-3d (libs/angular-3d/src/lib/primitives/index.ts)
   - SpaceFlight3dDirective from @hive-academy/angular-3d (libs/angular-3d/src/lib/directives/index.ts)
   - All other 3D components verified in libs/angular-3d/src/index.ts

2. **All patterns verified from examples**:
   - ViewportPositioningService usage: hero-3d-teaser.component.ts:138-150
   - Camera-ready computed signal: hero-3d-teaser.component.ts:144-150
   - Flight path definition: hero-space-scene.component.ts:521-549
   - Multi-layer star fields: hero-3d-teaser.component.ts:78-91

3. **Library documentation consulted**:
   - `libs/angular-3d/CLAUDE.md` (component patterns, cleanup guidelines)
   - `apps/angular-3d-demo/CLAUDE.md` (demo app structure)

4. **No hallucinated APIs**:
   - All component selectors verified: a3d-scene-3d, a3d-orbit-controls, a3d-gltf-model, etc.
   - All directive selectors verified: a3dSpaceFlight3d, a3dRotate3d, viewportPosition
   - All inputs verified: [modelPath], [flightPath], [rotateConfig], etc.
   - SpaceFlightWaypoint interface verified: space-flight-3d.directive.ts:61-68

### Implementation Phases

**Phase 1: Foundation (P0 - Critical)**
- Scene3dComponent integration
- Camera configuration ([0, 0, 20] position, 75° FOV)
- Lighting setup (ambient + directional)
- Central planet (GLTF Earth or PlanetComponent fallback)
- OrbitControls (drag to rotate, scroll to zoom)
- Verify HTML overlay still renders on top

**Phase 2: Core Features (P1 - High)**
- Flying robots with SpaceFlight3dDirective (2 models, flight paths)
- Multi-layer star fields (3 layers at radii 30, 40, 50)
- Particle text with ViewportPositioningService
- Bloom post-processing effect
- Performance validation (55fps target)

**Phase 3: Polish (P2 - Medium)**
- Volumetric nebula (top-right, background layer)
- Reduced motion support (disable animations if user prefers)
- Mobile responsiveness (simplify scene on small viewports)
- ARIA labels and accessibility audit
- Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Risk Mitigations

**Risk 1: GLTF Model Loading Failures**
- **Mitigation**: Use PlanetComponent as fallback for Earth (verified: hero-3d-teaser.component.ts:66-76)
- **Detection**: Monitor console for Three.js GLTF loader errors
- **Fallback**: Render primitive blue sphere (0x2244ff) if model fails to load

**Risk 2: Performance Degradation on Low-End Hardware**
- **Mitigation**: Implement progressive degradation (disable bloom, reduce star count)
- **Detection**: Monitor frame rate via Chrome DevTools Performance tab
- **Fallback**: Provide "Simplified Mode" button to disable effects

**Risk 3: OrbitControls Conflicts with Page Scroll**
- **Mitigation**: Use minDistance/maxDistance to limit zoom range (5-50 units)
- **Detection**: Test scroll behavior at max zoom distance
- **Fallback**: Disable zoom if conflicts occur, keep rotation only

**Risk 4: Z-Index Layering Issues**
- **Mitigation**: Verify 3D scene renders below HTML overlay (z-index 0 vs z-10)
- **Detection**: Check if buttons/text are clickable after implementation
- **Fallback**: Adjust z-index values or add `pointer-events: none` to scene container

**Risk 5: Memory Leaks from Three.js Resources**
- **Mitigation**: Component cleanup handled by angular-3d library components (DestroyRef patterns built-in)
- **Detection**: Chrome DevTools Memory tab, heap snapshot comparison before/after navigation
- **Fallback**: Manually dispose resources if leaks detected (not expected with library components)

### Architecture Delivery Checklist

- [x] All components specified with evidence (Scene3dComponent, OrbitControlsComponent, GltfModelComponent, etc.)
- [x] All patterns verified from codebase (ViewportPositioningService, SpaceFlight3dDirective, multi-layer stars)
- [x] All imports/decorators verified as existing (libs/angular-3d/src/index.ts exports confirmed)
- [x] Quality requirements defined (functional, non-functional, pattern compliance)
- [x] Integration points documented (scene container, HTML overlay, positioning service, asset loading)
- [x] Files affected list complete (MODIFY gsap-showcase.component.ts, READ colors.ts and references)
- [x] Developer type recommended (frontend-developer with Angular + 3D experience)
- [x] Complexity assessed (MEDIUM, 4-6 hours)
- [x] No step-by-step implementation (architecture-level design, team-leader decomposes)

---

## Appendix

### Reference Implementation Locations

- **Production Pattern**: `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` (152 lines)
- **Full Featured Reference**: `temp/scene-graphs/hero-space-scene.component.ts` (728 lines)
- **Current Implementation**: `apps/angular-3d-demo/src/app/pages/gsap-showcase/gsap-showcase.component.ts` (310 lines)
- **Library Documentation**: `libs/angular-3d/CLAUDE.md`
- **Demo App Documentation**: `apps/angular-3d-demo/CLAUDE.md`

### Component API Quick Reference

**Scene3dComponent**:
```html
<a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
  <!-- child components -->
</a3d-scene-3d>
```

**OrbitControlsComponent**:
```html
<a3d-orbit-controls
  [enableDamping]="true"
  [dampingFactor]="0.05"
  [minDistance]="5"
  [maxDistance]="50"
/>
```

**GltfModelComponent with SpaceFlight3dDirective**:
```html
<a3d-gltf-model
  [modelPath]="'/3d/mini_robot.glb'"
  [scale]="0.05"
  a3dSpaceFlight3d
  [flightPath]="robot1FlightPath"
  [rotationsPerCycle]="8"
  [loop]="true"
  [autoStart]="true"
/>
```

**PlanetComponent with Rotate3dDirective**:
```html
<a3d-planet
  viewportPosition="center"
  [viewportOffset]="{ offsetZ: -9 }"
  [radius]="2.3"
  a3dRotate3d
  [rotateConfig]="{ axis: 'y', speed: 60 }"
/>
```

**StarFieldComponent**:
```html
<a3d-star-field
  [starCount]="3000"
  [radius]="50"
  [enableTwinkle]="true"
  [multiSize]="true"
  [stellarColors]="true"
/>
```

**InstancedParticleTextComponent**:
```html
<a3d-instanced-particle-text
  text="Angular 3D Library"
  [position]="heroTextPosition()"
  [fontSize]="25"
  [particleColor]="colors.softGray"
  [opacity]="0.35"
/>
```

**ViewportPositioningService Pattern**:
```typescript
private readonly positioning = inject(ViewportPositioningService);

public readonly heroTextPosition = computed(() => {
  if (!this.positioning.isCameraReady()) {
    return [0, 100, 0] as [number, number, number];
  }
  return this.positioning.getPosition({ x: '50%', y: '20%' })();
});
```

**SpaceFlightWaypoint Interface**:
```typescript
interface SpaceFlightWaypoint {
  position: [number, number, number];
  duration: number; // seconds
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
}
```

### Color Constants (from colors.ts)

```typescript
SCENE_COLORS = {
  white: 0xffffff,
  indigo: 0x6366f1,
  neonGreen: 0xa1ff4f,
  deepBlue: 0x2244ff,
  softGray: 0x9ca3af,
  skyBlue: 0x0088ff,
}

SCENE_COLOR_STRINGS = {
  skyBlue: '#0088ff',
  neonGreen: '#a1ff4f',
  white: '#ffffff',
}
```

### Flight Path Examples (from hero-space-scene.component.ts)

**Robot 1 - High Altitude Path**:
```typescript
readonly robot1FlightPath: SpaceFlightWaypoint[] = [
  { position: [-12, 8, -8], duration: 10, easing: 'easeInOut' },
  { position: [10, 12, -5], duration: 8, easing: 'easeInOut' },
  { position: [-6, 4, 10], duration: 9, easing: 'easeIn' },
  { position: [8, 10, -12], duration: 11, easing: 'easeOut' },
  { position: [-12, 8, -8], duration: 8, easing: 'easeInOut' },
];
```

**Robot 2 - Low Depth Path**:
```typescript
readonly robot2FlightPath: SpaceFlightWaypoint[] = [
  { position: [4, -3, -8], duration: 9, easing: 'easeOut' },
  { position: [-8, -5, -5], duration: 10, easing: 'easeInOut' },
  { position: [12, -4, 16], duration: 8, easing: 'easeInOut' },
  { position: [10, -6, -15], duration: 11, easing: 'easeIn' },
  { position: [-6, -5, -10], duration: 9, easing: 'easeInOut' },
];
```

### Performance Testing Commands

```bash
# Development server
npx nx serve angular-3d-demo --open

# Production build (for performance testing)
npx nx build angular-3d-demo --configuration=production
npx nx serve angular-3d-demo --configuration=production

# Chrome DevTools Performance Profiling:
# 1. Open DevTools (F12)
# 2. Performance tab → Record
# 3. Interact with hero (drag, scroll, wait 10 seconds)
# 4. Stop recording
# 5. Analyze: FPS graph (target: 55-60fps), Main thread time, GPU time
# 6. Memory tab → Take heap snapshot → Interact 5 minutes → Compare snapshots (check for leaks)
```

### Accessibility Testing

```bash
# Manual testing
# 1. Enable screen reader (NVDA on Windows, VoiceOver on Mac)
# 2. Tab through page, verify hero scene ARIA label is announced
# 3. Enable OS "Reduce motion" setting
# 4. Verify auto-rotation and float animations are disabled
# 5. Test keyboard navigation (Tab, Shift+Tab, Enter, Space)

# Browser DevTools Accessibility Audit
# 1. Chrome DevTools → Lighthouse tab
# 2. Select "Accessibility" category
# 3. Generate report
# 4. Verify WCAG 2.1 AA compliance
```

### Commit Message Format

```bash
# Feature implementation
feat(demo): add interactive 3d hero section with orbit controls

Replaces static PNG background with full 3D scene:
- Interactive WebGL scene with OrbitControls
- Rotating Earth GLTF model with Rotate3dDirective
- 2 flying robots with SpaceFlight3dDirective
- Multi-layer star fields for parallax depth
- Particle text rendering
- Bloom post-processing effect

Preserves existing HTML overlay and GSAP scroll animations.

# Performance optimization
perf(demo): optimize hero scene for mobile devices

Reduces star count by 50% on viewport < 768px,
disables bloom effect and flying robots on mobile.

# Accessibility fix
fix(demo): add aria labels and reduced motion support to hero

Adds descriptive ARIA label to 3D scene container,
respects prefers-reduced-motion media query.
```
