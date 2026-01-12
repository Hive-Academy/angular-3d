# Development Tasks - TASK_2025_025

**Total Tasks**: 29 | **Batches**: 7 | **Status**: 7/7 complete

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- All component imports exist in @hive-academy/angular-3d public API: VERIFIED (cross-referenced with libs/angular-3d/src/index.ts)
- Showcase card pattern exists and is reusable: VERIFIED (primitives-showcase.component.ts:37-54)
- SCENE_COLORS system has all required colors: VERIFIED (shared/colors.ts contains all referenced colors)
- Existing scenes (hero-space-scene, value-props-3d-scene) work correctly: VERIFIED (already implemented)

### Risks Identified

| Risk                                  | Severity | Mitigation                                                           |
| ------------------------------------- | -------- | -------------------------------------------------------------------- |
| Performance with 37+ active 3D scenes | MEDIUM   | Implemented in shared ShowcaseCardComponent with optimized rendering |
| Mobile device performance degradation | MEDIUM   | Developer must test on mobile and optimize particle counts if needed |

### Edge Cases to Handle

- [x] Scene card components must handle missing/failed GLTF model loads - Handled with error boundaries in implementation
- [x] Code snippet component must handle special characters in code - Handled with proper HTML encoding
- [x] All Three.js resources must be properly disposed - Handled with DestroyRef.onDestroy() pattern

---

## Batch 1: Shared Components Foundation ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None
**Commit**: 79062b0

### Task 1.1: Create ShowcaseCardComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\shared\showcase-card.component.ts
**Spec Reference**: implementation-plan.md:246-306
**Pattern to Follow**: primitives-showcase.component.ts:37-54 (extract and enhance this pattern)

**Quality Requirements**:

- Must use content projection for 3D scene content (ng-content select="[sceneContent]")
- Must support configurable camera position and FOV via signal inputs
- Card must be responsive (full-width mobile, adapts to grid on tablet/desktop)
- Must include standard lighting setup (ambient + directional)
- Must integrate CodeSnippetComponent for code display
- OnPush change detection strategy required

**Validation Notes**:

- This component eliminates duplication across all showcase sections
- Performance: Each card scene should target 30fps minimum

**Implementation Details**:

- Imports: Scene3dComponent, AmbientLightComponent, DirectionalLightComponent, CodeSnippetComponent
- Signal Inputs: componentName (required), description (optional), codeExample (required), cameraPosition (default [0,0,3]), cameraFov (default 75)
- Template Structure: Card wrapper > 3D preview container > ng-content projection > Component info > Code snippet

---

### Task 1.2: Create CodeSnippetComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\shared\code-snippet.component.ts
**Spec Reference**: implementation-plan.md:310-361
**Dependencies**: None

**Quality Requirements**:

- Must implement copy-to-clipboard functionality using navigator.clipboard API
- Must show visual feedback on copy (button text changes to "Copied!" for 2 seconds)
- Must support syntax highlighting (use Prism.js or highlight.js - developer choice)
- Code block must be scrollable for long snippets
- OnPush change detection strategy required

**Validation Notes**:

- Will be used by ShowcaseCardComponent and ServicesDocumentationComponent
- Must handle HTML special characters properly (escape < > & symbols)

**Implementation Details**:

- Imports: CommonModule (for signal state)
- Signal Inputs: code (required), language (default 'html', options: 'html' | 'typescript')
- Signal State: copied (boolean signal for feedback)
- Method: copyToClipboard() - uses navigator.clipboard.writeText(), sets copied=true, setTimeout to reset after 2s

---

### Task 1.3: Create SectionContainerComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\shared\section-container.component.ts
**Spec Reference**: implementation-plan.md:366-427
**Dependencies**: None

**Quality Requirements**:

- Must provide consistent section padding (py-16x) and max-width container
- Must support light/dark background variants
- Must generate responsive grid classes based on columns input (2, 3, or 4)
- Must use content projection for heading and description
- OnPush change detection strategy required

**Validation Notes**:

- Ensures visual consistency across all showcase sections
- Grid must collapse to 1 column on mobile (< 768px)

**Implementation Details**:

- Imports: None (pure template component)
- Signal Inputs: background ('light' | 'dark', default 'light'), columns (2 | 3 | 4, default 3)
- Method: getGridClasses() - returns appropriate Tailwind grid classes based on columns input
- Template Structure: Section wrapper > max-w-container > heading/description slot > grid content slot

---

**Batch 1 Verification**:

- All 3 files created at specified paths
- Build passes: `npx nx build angular-3d-demo`
- All components use OnPush change detection
- ShowcaseCardComponent successfully renders a test primitive (box)
- CodeSnippetComponent copy-to-clipboard works in browser
- SectionContainerComponent renders with all 3 column variants

---

## Batch 2: Primitives Part 1 - Basic Geometries ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batch 1 (requires ShowcaseCardComponent)
**Commit**: 3598c99

### Task 2.1: Rewrite PrimitivesShowcaseComponent (Basic Geometries Section) ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\primitives-showcase.component.ts
**Spec Reference**: implementation-plan.md:431-793 (focus on Basic Geometries section lines 471-594)
**Pattern to Follow**: implementation-plan.md:471-594 (architect's template for basic geometries)

**Quality Requirements**:

- REWRITE the existing file (currently has 4 cards, expand to full implementation)
- Must showcase 9 basic geometry cards: Box, Cylinder, Torus, FloatingSphere, 5 Polyhedron types (tetrahedron, octahedron, dodecahedron, icosahedron)
- Each card must use ShowcaseCardComponent with proper cameraPosition
- All geometries must rotate using rotate3d directive with varying speeds
- Must use SCENE_COLORS from shared/colors.ts
- Code examples must match actual component API
- Use SectionContainerComponent with columns=4

**Validation Notes**:

- This is a REWRITE, not a modification - replace entire file content
- Polyhedrons need 5 separate cards showing each type variant
- Group component will be added in Batch 3 (Advanced section)

**Implementation Details**:

- Imports: SectionContainerComponent, ShowcaseCardComponent, all basic geometry components (Box, Cylinder, Torus, FloatingSphere, Polyhedron), directives (Rotate3d, ViewportPosition)
- Structure: SectionContainer > "Basic Geometries" subsection heading > grid of 9 ShowcaseCard components
- Colors: Use different color for each card (indigo, pink, amber, blue, teal, red, violet, emerald, etc.)
- Rotation configs: Vary rotation axis (x, y, z) and speed (8-15) for visual variety

---

**Batch 2 Verification**:

- primitives-showcase.component.ts rewritten with Basic Geometries section
- 9 geometry cards render correctly
- All geometries rotate smoothly at 30fps minimum
- Code snippets show correct component usage
- Build passes: `npx nx build angular-3d-demo`

---

## Batch 3: Primitives Part 2 - Space, Advanced, Environment ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batch 2 (extends primitives-showcase.component.ts)
**Commit**: e914d2c

### Task 3.1: Expand PrimitivesShowcaseComponent (Space + Advanced + Environment Sections) ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\primitives-showcase.component.ts
**Spec Reference**: implementation-plan.md:596-773 (Space, Advanced, Environment sections)
**Dependencies**: Task 2.1 (modifies same file)

**Quality Requirements**:

- ADD three new subsections to existing primitives-showcase.component.ts: Space Elements (4 cards), Advanced Components (4 cards), Environment Components (3 cards)
- Space Elements: Planet, StarField, Nebula, NebulaVolumetric - use appropriate camera distances (larger for nebula/starfield)
- Advanced Components: GltfModel (use /3d/planet_earth/scene.gltf), ParticleSystem, SvgIcon (use Angular logo path from implementation-plan.md:780), Group (2 child components)
- Environment Components: Fog (show fog effect on multiple boxes at different distances), BackgroundCube, BackgroundCubes
- Total primitives: 17+ components across all 4 subsections

**Validation Notes**:

- GLTF model path must be correct: '/3d/planet_earth/scene.gltf'
- Fog demo needs multiple objects at varying z-positions to show effect
- Group component demonstrates nesting pattern (important API example)
- NebulaVolumetric uses SCENE_COLOR_STRINGS (CSS hex format), not SCENE_COLORS

**Implementation Details**:

- New Imports: PlanetComponent, StarFieldComponent, NebulaComponent, NebulaVolumetricComponent, GltfModelComponent, ParticleSystemComponent, SvgIconComponent, GroupComponent, FogComponent, BackgroundCubeComponent, BackgroundCubesComponent
- Angular SVG Path: 'M250 50L30 120l35 300 185 100 185-100 35-300z' (simplified Angular logo)
- Camera Positions: StarField/Nebula use [0,0,10] or [0,0,20], Planet uses [0,0,5]
- Structure: Add 3 subsection divs with col-span-full class, each with h3 heading and grid layout

---

**Batch 3 Verification**:

- primitives-showcase.component.ts now has 17+ primitive cards across 4 subsections
- All sections render correctly with appropriate camera positioning
- GLTF model loads successfully (or shows placeholder if file missing)
- Fog effect visibly affects distant objects
- Group component shows nested components pattern
- Build passes: `npx nx build angular-3d-demo`

---

## Batch 4: Text & Lighting Showcases ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 1 (requires shared components)
**Commit**: d9d2e03

### Task 4.1: Create TextShowcaseComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\text-showcase.component.ts
**Spec Reference**: implementation-plan.md:795-934
**Pattern to Follow**: implementation-plan.md:809-929 (architect's template)

**Quality Requirements**:

- Must showcase all 6 text components: TroikaText, ResponsiveTroikaText, GlowTroikaText, SmokeTroikaText, ParticlesText, BubbleText
- Each text component must render the text "Angular 3D" or similar short phrase
- Use SectionContainerComponent with columns=3, background="light"
- Each text effect must be visually distinct and clearly visible
- Code examples must show text-specific configuration (fontSize, glowIntensity, particleCount, etc.)

**Validation Notes**:

- Text components may require FontPreloadService - if fonts fail to load, add loading state
- ParticlesText may need higher particle count (5000+) to be readable
- Use appropriate camera distances for text size (typically [0,0,5])

**Implementation Details**:

- Imports: SectionContainerComponent, ShowcaseCardComponent, Scene3dComponent, AmbientLight, DirectionalLight, all 6 text components
- Colors: Use vibrant colors for each text type (indigo, neonGreen, cyan, violet, pink, amber)
- Text String: "Angular 3D", "Responsive", "Glowing", "Smokey", "Particles", "Bubbles" (one per card)
- Camera: [0,0,5] for most, [0,0,8] for ParticlesText (needs more distance)

---

### Task 4.2: Create LightingShowcaseComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\lighting-showcase.component.ts
**Spec Reference**: implementation-plan.md:946-1054
**Pattern to Follow**: implementation-plan.md:962-1042 (architect's template)

**Quality Requirements**:

- Must showcase all 5 light types: AmbientLight, DirectionalLight, PointLight, SpotLight, SceneLighting
- Use SAME reference object (Torus) in all 5 cards for visual comparison
- Each light card must have ONLY that light type active (plus minimal ambient 0.2 for visibility, except AmbientLight-only card)
- Use SectionContainerComponent with columns=3, background="dark"
- Light configuration parameters must be visible in code examples

**Validation Notes**:

- DirectionalLight, PointLight, SpotLight cards need low ambient (0.2) to show light directionality
- SpotLight needs target=[0,0,0] to point at center torus
- Use colored lights to show light color effects (neonGreen directional, cyan point, amber spot)

**Implementation Details**:

- Imports: SectionContainerComponent, ShowcaseCardComponent, TorusComponent, all 5 light components, ViewportPositionDirective
- Reference Object: Torus with color=indigo, viewportPosition="center" (same in all 5 cards)
- Light Colors: Use colors.neonGreen, colors.cyan, colors.amber for directional/point/spot to show color effect
- Spot Light Config: [position]="[0, 3, 3]" [angle]="0.5" [target]="[0, 0, 0]"

---

**Batch 4 Verification**:

- text-showcase.component.ts created with 6 text component cards
- lighting-showcase.component.ts created with 5 light comparison cards
- All text effects are visually distinct and visible
- Lighting comparison clearly shows differences between light types
- Build passes: `npx nx build angular-3d-demo`

---

## Batch 5: Directives & Postprocessing Showcases ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 1 (requires shared components)
**Commit**: 301c0a0

### Task 5.1: Create DirectivesShowcaseComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\directives-showcase.component.ts
**Spec Reference**: implementation-plan.md:1060-1246
**Pattern to Follow**: implementation-plan.md:1075-1241 (architect's template)

**Quality Requirements**:

- Must showcase 9+ directives: Float3d (2 variants), Rotate3d (2 variants), Glow3d, SpaceFlight3d, MouseTracking3d, Performance3d, Combined example
- Each directive card must clearly show the directive's effect
- Float3d: Show slow (speed=1, intensity=0.2) and fast (speed=3, intensity=0.5) variants
- Rotate3d: Show Y-axis and X-axis rotation variants
- Glow3d: Must include BloomEffectComponent to make glow visible
- Combined example: Show Float3d + Rotate3d + Glow3d on one object
- Use SectionContainerComponent with columns=3, background="light"

**Validation Notes**:

- MouseTracking3d requires user interaction - add instruction text "Hover over card"
- Glow3d and Combined cards MUST include `<a3d-bloom-effect>` child or glow won't be visible
- SpaceFlight3d may need larger camera distance [0,0,8]

**Implementation Details**:

- Imports: SectionContainerComponent, ShowcaseCardComponent, BoxComponent, TorusComponent, all directive types, BloomEffectComponent
- Directive Configs: Float speeds (1, 3), Rotate speeds (15-20), axis variants ('x', 'y', 'z')
- Glow Cards: Include `<a3d-bloom-effect sceneContent [threshold]="0.5" [strength]="1.5" />` as sibling to glowing object
- Combined Card: Box with all 3 directives: float (speed=2), rotate (y-axis, speed=15), glow (intensity=1.5) + bloom effect

---

### Task 5.2: Create PostprocessingShowcaseComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\postprocessing-showcase.component.ts
**Spec Reference**: implementation-plan.md:1260-1383
**Pattern to Follow**: implementation-plan.md:1275-1378 (architect's template)

**Quality Requirements**:

- Must show before/after comparison: 2 cards side-by-side (without bloom vs with bloom)
- Both cards must render IDENTICAL scenes (same objects, same positions, same colors)
- Without Bloom card: No BloomEffectComponent
- With Bloom card: Includes `<a3d-bloom-effect [threshold]="0.5" [strength]="1.5" [radius]="0.5" />`
- Use SectionContainerComponent with columns=2, background="dark"
- Scene must have glowing objects (use Glow3dDirective) to show bloom effect clearly

**Validation Notes**:

- Scene complexity: Use 3 objects (torus center, 2 boxes on sides) for clear comparison
- All objects should use Glow3dDirective with glowIntensity=2 to show bloom impact
- Without bloom card should still look good (objects just won't have glow halo)

**Implementation Details**:

- Imports: SectionContainerComponent, Scene3dComponent, TorusComponent, BoxComponent, AmbientLight, DirectionalLight, BloomEffectComponent, Glow3dDirective, Rotate3dDirective, ViewportPositionDirective
- Scene Config: Torus (center, cyan, glow, rotate), Box left (pink, rotate), Box right (neonGreen, rotate)
- Bloom Params: threshold=0.5 (only bright objects glow), strength=1.5, radius=0.5
- Card Structure: Custom cards (not ShowcaseCardComponent) with h-96x scenes for larger comparison

---

**Batch 5 Verification**:

- directives-showcase.component.ts created with 9+ directive cards
- postprocessing-showcase.component.ts created with 2-card bloom comparison
- All directive effects are visible and working
- Bloom before/after comparison clearly shows visual difference
- MouseTracking3d responds to cursor movement
- Build passes: `npx nx build angular-3d-demo`

---

## Batch 6: Controls & Services ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 1 (requires shared components)
**Commit**: fef7680

### Task 6.1: Create ControlsShowcaseComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\controls-showcase.component.ts
**Spec Reference**: implementation-plan.md:1397-1519
**Pattern to Follow**: implementation-plan.md:1412-1514 (architect's template)

**Quality Requirements**:

- Must showcase OrbitControlsComponent with 3 configuration variants: Auto-Rotate, Manual Control, Restricted Zoom
- Each card must have INTERACTIVE scene (user can orbit, zoom, pan)
- Use SectionContainerComponent with columns=2, background="light"
- Each scene must have 3 objects (box, torus, cylinder) for spatial reference
- Usage instructions must be included in description text

**Validation Notes**:

- OrbitControls must be added as child of Scene3dComponent
- Auto-rotate card: enableDamping=true, autoRotate=true, autoRotateSpeed=2
- Manual card: enableDamping=true, autoRotate=false
- Restricted card: minDistance=5, maxDistance=15

**Implementation Details**:

- Imports: SectionContainerComponent, Scene3dComponent, BoxComponent, TorusComponent, CylinderComponent, AmbientLight, DirectionalLight, OrbitControlsComponent, ViewportPositionDirective
- Scene Config: Box at [-2,0,0], Torus at center, Cylinder at [2,0,0] (same in all 3 cards)
- Camera: [0,0,8] for all 3 scenes
- Custom Card Structure: Use custom div cards (not ShowcaseCardComponent) with h-96x scenes for larger interaction area

---

### Task 6.2: Create ServicesDocumentationComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\services-documentation.component.ts
**Spec Reference**: implementation-plan.md:1532-1750
**Pattern to Follow**: implementation-plan.md:1547-1750 (architect's template with code examples)

**Quality Requirements**:

- Must document all 6 services: SceneService, RenderLoopService, GltfLoaderService, TextureLoaderService, FontPreloadService, AdvancedPerformanceOptimizerService
- Use SectionContainerComponent with columns=1 (full-width documentation section)
- Each service card must include: service name, description, key methods list, usage example with CodeSnippetComponent
- Usage examples must use inject() pattern (modern Angular DI)
- All TypeScript code examples must use language="typescript" for syntax highlighting

**Validation Notes**:

- This is text-heavy documentation, no 3D previews required
- Code examples are embedded as string literals (see implementation-plan.md:1668-1749)
- Use 2-column grid for service cards (grid md:grid-cols-2)

**Implementation Details**:

- Imports: SectionContainerComponent, CodeSnippetComponent
- Structure: SectionContainer > 2-column grid > 6 service cards
- Each Card: div.bg-white.rounded-card.shadow-card.p-6x > h3 (service name) > description > methods list > h4 "Usage Example" > CodeSnippetComponent
- Code Examples: Define as readonly string properties (sceneServiceExample, renderLoopServiceExample, etc.) - copy from implementation-plan.md:1668-1749

---

**Batch 6 Verification**:

- controls-showcase.component.ts created with 3 orbit controls variants
- services-documentation.component.ts created with 6 service documentation cards
- All orbit controls are interactive and respond to mouse/touch
- All service code examples are syntax-highlighted and copyable
- Build passes: `npx nx build angular-3d-demo`

---

## Batch 7: Main Page Integration & Polish ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batches 2-6 (all section components must exist)
**Commit**: 2c8adba

### Task 7.1: Modify Angular3dShowcaseComponent (Main Page Integration) ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\angular-3d-showcase.component.ts
**Spec Reference**: implementation-plan.md:1764-1838
**Pattern to Follow**: implementation-plan.md:1779-1831 (architect's integration template)

**Quality Requirements**:

- MODIFY existing angular-3d-showcase.component.ts to import and integrate ALL new section components
- Section order (9 sections total): HeroSpaceScene, PrimitivesShowcase, TextShowcase, LightingShowcase, DirectivesShowcase, PostprocessingShowcase, ControlsShowcase, ServicesDocumentation, ValueProps3dScene
- Remove any old placeholder content
- Use OnPush change detection strategy
- Clean template structure (one component per line)

**Validation Notes**:

- HeroSpaceScene and ValueProps3dScene already exist - just ensure they're included in correct order
- PrimitivesShowcaseComponent will be heavily modified from original - ensure new version is imported
- Final page should have logical flow: intro -> building blocks (primitives, text, lighting) -> behaviors (directives, effects, controls) -> technical (services) -> conclusion (value props)

**Implementation Details**:

- Imports: All 7 showcase sections + 2 existing scenes (9 total components)
- Template: Simple vertical stack of components (no wrapper divs needed, each section handles own padding/background)
- Order: hero-space-scene, primitives-showcase, text-showcase, lighting-showcase, directives-showcase, postprocessing-showcase, controls-showcase, services-documentation, value-props-3d-scene
- Remove: Any old stub content or placeholder sections

---

**Batch 7 Verification**:

- angular-3d-showcase.component.ts modified with all 9 sections integrated
- Page loads successfully with all sections visible
- Scroll through entire page confirms: hero scene -> primitives (17+ cards) -> text (6) -> lighting (5) -> directives (9+) -> postprocessing (2) -> controls (3) -> services (6) -> value props
- Build passes: `npx nx build angular-3d-demo`
- Final responsive testing: mobile (1-col), tablet (2-col), desktop (3-4 col)
- No console errors, no memory leaks (check browser DevTools)
- Page performance acceptable (all scenes render at 30fps minimum)

---

## Final Deliverables Checklist

After Batch 7 completion, verify:

- [ ] 10 NEW files created (3 shared + 7 sections)
- [ ] 1 file REWRITTEN (primitives-showcase.component.ts)
- [ ] 1 file MODIFIED (angular-3d-showcase.component.ts)
- [ ] Total components showcased: 40+ (17+ primitives, 6 text, 5 lights, 9+ directives, 2 postprocessing, 1 controls, 6 services)
- [ ] All code examples use correct library API
- [ ] All components use OnPush change detection
- [ ] All Three.js resources properly disposed (DestroyRef.onDestroy pattern)
- [ ] Responsive layout works on mobile, tablet, desktop
- [ ] Build passes with zero TypeScript errors
- [ ] All showcase sections use SCENE_COLORS from shared/colors.ts

---

## Status Icons Reference

| Status         | Meaning                         | Who Sets              |
| -------------- | ------------------------------- | --------------------- |
| ⏸️ PENDING     | Not started                     | team-leader (initial) |
| 🔄 IN PROGRESS | Assigned to developer           | team-leader           |
| 🔄 IMPLEMENTED | Developer done, awaiting verify | developer             |
| ✅ COMPLETE    | Verified and committed          | team-leader           |
| ❌ FAILED      | Verification failed             | team-leader           |

---

**Ready for Team-Leader MODE 2: ASSIGNMENT**
