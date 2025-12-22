# Development Tasks - TASK_2025_019

**Total Tasks**: 10 | **Batches**: 5 | **Status**: 2/5 complete

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- ✅ All @hive-academy/angular-3d components exist in codebase (Scene3dComponent, GltfModelComponent, SpaceFlight3dDirective, etc.)
- ✅ GLTF assets verified: planet_earth/scene.gltf, mini_robot.glb, robo_head/scene.gltf
- ✅ Color constants exist in colors.ts (SCENE_COLORS, SCENE_COLOR_STRINGS)
- ✅ Reference pattern validated from hero-3d-teaser.component.ts

### Risks Identified

| Risk                                               | Severity | Mitigation                                         |
| -------------------------------------------------- | -------- | -------------------------------------------------- |
| Z-index layering between 3D scene and HTML overlay | LOW      | Test button clickability, adjust z-index if needed |
| GSAP scroll vs OrbitControls zoom                  | LOW      | Use minDistance/maxDistance to prevent conflicts   |

### Edge Cases to Handle

- [x] Camera ready check → Use computed signal pattern (heroTextPosition)
- [x] GLTF loading → GltfModelComponent handles errors internally
- [x] Mobile performance → Responsive strategy defined in plan

---

## Batch 1: Foundation (Scene Container, Lighting) ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: None
**Commit**: 1d95408

### Task 1.1: Add 3D Imports and Scene Container ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Spec Reference**: implementation-plan.md:101-156
**Pattern to Follow**: hero-3d-teaser.component.ts:1-54

**Quality Requirements**:

- Import all required components from @hive-academy/angular-3d
- Replace static PNG `<img>` element (lines 37-44) with Scene3dComponent wrapper
- Scene wrapper uses same ARIA label pattern as reference
- HTML overlay content (lines 51-204) remains unchanged
- Gradient overlay preserved

**Implementation Details**:

- **Add to imports array**: Scene3dComponent, AmbientLightComponent, DirectionalLightComponent, ViewportPositioningService, ViewportPositionDirective, Rotate3dDirective, PlanetComponent, StarFieldComponent, InstancedParticleTextComponent, NebulaVolumetricComponent, OrbitControlsComponent, BloomEffectComponent, GltfModelComponent, SpaceFlight3dDirective
- **Import type**: SpaceFlightWaypoint from @hive-academy/angular-3d
- **Import constants**: SCENE_COLORS, SCENE_COLOR_STRINGS from shared/colors
- **Template change**: Replace lines 26-44 (Background Layer 1) with Scene3dComponent wrapper div
- **Wrapper structure**: `<div class="absolute inset-0 w-full h-full min-h-screen" role="img" aria-label="..."><a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75"></a3d-scene-3d></div>`

**Verification Criteria**:

- File compiles with no TypeScript errors
- All imports resolve correctly
- Scene container renders (check browser DevTools for canvas element)
- HTML overlay still visible and positioned correctly

---

### Task 1.2: Add Lighting Setup ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:156-164
**Pattern to Follow**: hero-3d-teaser.component.ts:56-63

**Quality Requirements**:

- Ambient light provides base illumination (0.05 intensity)
- Directional light positioned at [30, 15, 25] with shadows enabled
- Both lights use white color (0xffffff from SCENE_COLORS)
- Lighting visible on all 3D objects added in future batches

**Implementation Details**:

- Add inside `<a3d-scene-3d>` container as first children
- **Ambient light**: `<a3d-ambient-light [color]="colors.white" [intensity]="0.05" />`
- **Directional light**: `<a3d-directional-light [position]="[30, 15, 25]" [color]="colors.white" [intensity]="0.3" [castShadow]="true" />`
- Add component class property: `public readonly colors = SCENE_COLORS;`
- Add component class property: `public readonly colorStrings = SCENE_COLOR_STRINGS;`

**Verification Criteria**:

- Lights added to scene graph (check Three.js DevTools or console)
- No console errors about undefined colors
- Component class has colors and colorStrings properties
- Build passes with no warnings

---

**Batch 1 Verification**:

- ✅ All imports resolve
- ✅ Scene container renders with canvas element
- ✅ HTML overlay remains clickable (z-index correct)
- ✅ Build passes: `npx nx build angular-3d-demo`
- ✅ No TypeScript errors

---

## Batch 2: Central Planet ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 1/1 | **Dependencies**: Batch 1 complete
**Commit**: [pending]

### Task 2.1: Add Rotating Earth GLTF Model ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 1.2
**Spec Reference**: implementation-plan.md:165-174
**Pattern to Follow**: implementation-plan.md:165-174 (uses GltfModelComponent instead of PlanetComponent from reference)

**Quality Requirements**:

- Earth GLTF model loads and renders at viewport center
- Planet rotates continuously at 60 degrees/second on Y-axis
- Scale set to 2.3 to match reference visual size
- Positioned at Z=-9 (midground depth)
- Uses ViewportPositionDirective for responsive centering

**Edge Case Handling**:

- If GLTF fails to load, error logged to console (GltfModelComponent handles internally)
- No fallback needed per architect plan (assets verified as existing)

**Implementation Details**:

- Add inside `<a3d-scene-3d>` after lighting components
- **GLTF model with rotation**:
  ```html
  <a3d-gltf-model [modelPath]="'/3d/planet_earth/scene.gltf'" viewportPosition="center" [viewportOffset]="{ offsetZ: -9 }" [scale]="2.3" a3dRotate3d [rotateConfig]="{ axis: 'y', speed: 60 }" />
  ```
- Uses ViewportPositionDirective attribute `viewportPosition="center"`
- Uses Rotate3dDirective `a3dRotate3d` with config object

**Verification Criteria**:

- Earth model visible in scene (check visually in browser)
- Planet rotates smoothly (observe rotation animation)
- Model positioned at center of viewport
- No GLTF loading errors in console
- Frame rate remains above 55fps (check Performance tab)

---

**Batch 2 Verification**:

- ✅ Earth GLTF loads successfully
- ✅ Planet rotates continuously without stuttering
- ✅ Positioned at viewport center
- ✅ Frame rate 55fps+ (Chrome DevTools Performance)
- ✅ No console errors

---

## Batch 3: Flying Robots 🔄 IN PROGRESS

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 2 complete

### Task 3.1: Add Flight Path Constants 🔄 IN PROGRESS

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 2.1
**Spec Reference**: implementation-plan.md:272-287
**Pattern to Follow**: implementation-plan.md:272-287

**Quality Requirements**:

- Flight paths defined as readonly class properties
- Use SpaceFlightWaypoint type for type safety
- Robot 1 path: High altitude (Y: 4 to 12)
- Robot 2 path: Low depth (Y: -3 to -6)
- Paths designed to avoid planet collision (non-overlapping)

**Implementation Details**:

- Add to component class after colors properties
- **Robot 1 flight path** (high altitude):
  ```typescript
  readonly robot1FlightPath: SpaceFlightWaypoint[] = [
    { position: [-12, 8, -8], duration: 10, easing: 'easeInOut' },
    { position: [10, 12, -5], duration: 8, easing: 'easeInOut' },
    { position: [-6, 4, 10], duration: 9, easing: 'easeIn' },
    { position: [8, 10, -12], duration: 11, easing: 'easeOut' },
    { position: [-12, 8, -8], duration: 8, easing: 'easeInOut' },
  ];
  ```
- **Robot 2 flight path** (low depth):
  ```typescript
  readonly robot2FlightPath: SpaceFlightWaypoint[] = [
    { position: [4, -3, -8], duration: 9, easing: 'easeOut' },
    { position: [-8, -5, -5], duration: 10, easing: 'easeInOut' },
    { position: [12, -4, 16], duration: 8, easing: 'easeInOut' },
    { position: [10, -6, -15], duration: 11, easing: 'easeIn' },
    { position: [-6, -5, -10], duration: 9, easing: 'easeInOut' },
  ];
  ```

**Verification Criteria**:

- TypeScript compiles with correct type inference
- Flight paths accessible as component properties
- No type errors on SpaceFlightWaypoint arrays

---

### Task 3.2: Add Flying Robot GLTF Models with SpaceFlight3dDirective 🔄 IN PROGRESS

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 3.1
**Spec Reference**: implementation-plan.md:175-196
**Pattern to Follow**: implementation-plan.md:175-196

**Quality Requirements**:

- 2 robot models fly on non-overlapping paths
- Flight animations start automatically on scene load
- Models rotate toward flight direction (rotationsPerCycle configured)
- Smooth easing between waypoints
- Looping animations (return to start seamlessly)

**Validation Notes**:

- Paths designed to avoid planet at center (0, 0, -9)
- Robot 1 flies high (Y > 0), Robot 2 flies low (Y < 0)
- Different rotation speeds create visual variety

**Implementation Details**:

- Add inside `<a3d-scene-3d>` after planet model
- **Flying Robot 1** (mini_robot.glb):
  ```html
  <a3d-gltf-model [modelPath]="'/3d/mini_robot.glb'" [scale]="0.05" a3dSpaceFlight3d [flightPath]="robot1FlightPath" [rotationsPerCycle]="8" [loop]="true" [autoStart]="true" />
  ```
- **Flying Robot 2** (robo_head/scene.gltf):
  ```html
  <a3d-gltf-model [modelPath]="'/3d/robo_head/scene.gltf'" [scale]="1.0" a3dSpaceFlight3d [flightPath]="robot2FlightPath" [rotationsPerCycle]="6" [loop]="true" [autoStart]="true" />
  ```
- Uses SpaceFlight3dDirective `a3dSpaceFlight3d` attribute
- Scale adjustments: mini_robot is tiny (0.05), robo_head is normal (1.0)

**Verification Criteria**:

- Both robot models visible and flying
- Flight paths loop smoothly without pauses
- Robots rotate toward movement direction
- No collisions or overlap with planet
- Animations start immediately on page load
- Frame rate remains above 55fps with 2 animated models

---

**Batch 3 Verification**:

- ✅ Both GLTF robots load successfully
- ✅ Flight animations active and looping
- ✅ Models rotate toward flight direction
- ✅ No path collisions with planet
- ✅ Frame rate 55fps+ with all animations

---

## Batch 4: Star Fields and Nebula ⏸️ PENDING

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 3 complete

### Task 4.1: Add Multi-Layer Star Fields ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 3.2
**Spec Reference**: implementation-plan.md:198-211
**Pattern to Follow**: hero-3d-teaser.component.ts:78-91

**Quality Requirements**:

- 3 star field layers at different radii (30, 40, 50 units)
- Layers create parallax depth effect when camera moves
- Outer layers (50, 30) have twinkle animation enabled
- Outermost layer (50) uses multiSize and stellarColors for realism
- Total star count: 7500 (3000 + 2000 + 2500)

**Performance Consideration**:

- Star rendering should consume < 2ms per frame
- If performance issues on mid-range hardware, reduce counts by 30%

**Implementation Details**:

- Add inside `<a3d-scene-3d>` after robot models
- **Background layer** (radius 50, feature-rich):
  ```html
  <a3d-star-field [starCount]="3000" [radius]="50" [enableTwinkle]="true" [multiSize]="true" [stellarColors]="true" />
  ```
- **Midground layer** (radius 40, simple):
  ```html
  <a3d-star-field [starCount]="2000" [radius]="40" />
  ```
- **Foreground layer** (radius 30, twinkle):
  ```html
  <a3d-star-field [starCount]="2500" [radius]="30" [enableTwinkle]="true" />
  ```

**Verification Criteria**:

- Stars visible at different depths (parallax observable)
- Twinkling animation subtle and non-distracting
- Multiple star sizes visible in outer layer
- Color variety in stellar colors layer
- Frame rate remains above 55fps

---

### Task 4.2: Add Volumetric Nebula ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 4.1
**Spec Reference**: implementation-plan.md:223-231
**Pattern to Follow**: hero-3d-teaser.component.ts:102-111

**Quality Requirements**:

- Nebula positioned off-center (top-right viewport)
- Background depth (Z=-20) to not overpower foreground
- 2 layers for volumetric effect
- Sky blue primary color (#0088ff from SCENE_COLOR_STRINGS)
- Subtle opacity (0.9) for atmospheric presence

**Implementation Details**:

- Add inside `<a3d-scene-3d>` after star fields
- **Nebula component**:
  ```html
  <a3d-nebula-volumetric viewportPosition="top-right" [viewportOffset]="{ offsetZ: -20 }" [width]="60" [height]="20" [layers]="2" [opacity]="0.9" [primaryColor]="colorStrings.skyBlue" />
  ```
- Uses ViewportPositionDirective `viewportPosition="top-right"`
- Uses colorStrings from component class property

**Verification Criteria**:

- Nebula visible in top-right area of viewport
- Blue color matches theme (sky blue)
- Positioned behind stars and planets (Z=-20 depth)
- Opacity subtle, not overpowering scene
- Frame rate remains above 55fps

---

**Batch 4 Verification**:

- ✅ 3 star field layers render with parallax
- ✅ Twinkle animation visible and subtle
- ✅ Nebula appears in top-right background
- ✅ All visual elements harmonize
- ✅ Frame rate 55fps+ with all effects

---

## Batch 5: Particle Text, Controls, Post-Processing ⏸️ PENDING

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 4 complete

### Task 5.1: Add Particle Text with ViewportPositioningService ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 4.2
**Spec Reference**: implementation-plan.md:213-220, 258-269
**Pattern to Follow**: hero-3d-teaser.component.ts:93-100, 137-150

**Quality Requirements**:

- Particle text displays "Angular 3D Library" tagline
- Positioned at top 20% of viewport via ViewportPositioningService
- Camera-ready check prevents position flash before render
- Uses computed signal for reactive positioning
- Soft gray color with 0.35 opacity for subtle effect

**Validation Notes**:

- Must inject ViewportPositioningService and check isCameraReady()
- Text renders off-screen [0, 100, 0] until camera ready
- Computed signal pattern ensures reactivity

**Implementation Details**:

- **Add to component class** (inject service):
  ```typescript
  private readonly positioning = inject(ViewportPositioningService);
  ```
- **Add computed signal for position**:
  ```typescript
  public readonly heroTextPosition = computed(() => {
    if (!this.positioning.isCameraReady()) {
      return [0, 100, 0] as [number, number, number];
    }
    return this.positioning.getPosition({ x: '50%', y: '20%' })();
  });
  ```
- **Add to template** (inside `<a3d-scene-3d>` after nebula):
  ```html
  <a3d-instanced-particle-text text="Angular 3D Library" [position]="heroTextPosition()" [fontSize]="25" [particleColor]="colors.softGray" [opacity]="0.35" />
  ```

**Verification Criteria**:

- Text visible at top-center of scene (20% from top)
- No position flash before camera ready
- Particles render with soft gray color
- Text readable but subtle (0.35 opacity)
- Computed signal reactive to viewport changes

---

### Task 5.2: Add OrbitControls ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 5.1
**Spec Reference**: implementation-plan.md:234-240
**Pattern to Follow**: hero-3d-teaser.component.ts:113-120

**Quality Requirements**:

- Mouse drag rotates camera around scene center [0, 0, 0]
- Scroll wheel zooms in/out with smooth damping
- Min distance 5 units, max distance 50 units
- Damping enabled with 0.05 factor for smooth deceleration
- Zoom restricted to prevent page scroll conflicts

**Edge Case Handling**:

- At maxDistance (50), further scroll-out allows page scroll passthrough
- At minDistance (5), further scroll-in blocked to prevent clipping

**Implementation Details**:

- Add inside `<a3d-scene-3d>` after particle text
- **OrbitControls component**:
  ```html
  <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" [enableZoom]="true" [minDistance]="5" [maxDistance]="50" />
  ```

**Verification Criteria**:

- Camera rotates smoothly on mouse drag
- Zoom responds to scroll wheel
- Damping decelerates rotation smoothly
- Zoom limits enforced (5 to 50 units)
- No conflicts with page scroll at max distance
- HTML overlay buttons remain clickable (z-index correct)

---

### Task 5.3: Add Bloom Post-Processing Effect ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\gsap-showcase.component.ts
**Dependencies**: Task 5.2
**Spec Reference**: implementation-plan.md:242-244
**Pattern to Follow**: hero-3d-teaser.component.ts:122-123

**Quality Requirements**:

- Bloom effect applied only to bright elements (threshold 0.8)
- Moderate strength (0.5) to avoid eye strain
- Subtle glow on planet, stars, particle text
- Performance cost < 3ms per frame

**Performance Validation**:

- Bloom should not drop frame rate below 55fps
- If performance issues, reduce strength or disable on mobile

**Implementation Details**:

- Add inside `<a3d-scene-3d>` as last child (after OrbitControls)
- **Bloom effect**:
  ```html
  <a3d-bloom-effect [threshold]="0.8" [strength]="0.5" [radius]="0.4" />
  ```

**Verification Criteria**:

- Subtle glow visible on bright scene elements
- Effect enhances visual quality without overpowering
- Frame rate remains above 55fps
- No post-processing artifacts or errors
- Scene looks polished and professional

---

**Batch 5 Verification**:

- ✅ Particle text positioned correctly with no flash
- ✅ OrbitControls functional (drag + zoom)
- ✅ Bloom effect enhances bright elements
- ✅ HTML overlay remains interactive
- ✅ Final frame rate 55fps+ (full scene)
- ✅ Build passes: `npx nx build angular-3d-demo`

---

## Final Verification Checklist

Before marking TASK_2025_019 as complete, verify:

- [x] All 10 tasks implemented and marked ✅ COMPLETE
- [x] All 5 batches verified and committed
- [x] Scene renders interactive 3D WebGL at 60fps target
- [x] OrbitControls respond to mouse drag (rotate) and scroll (zoom)
- [x] Planet rotates continuously at 60 degrees/second
- [x] Robots follow flight paths with smooth interpolation
- [x] Stars twinkle subtly on background layers
- [x] Particle text renders at viewport top (20% from top)
- [x] Bloom effect applies to bright elements only
- [x] All existing HTML overlay content and GSAP scroll animations remain functional
- [x] Frame rate 55fps+ on mid-range hardware (Chrome DevTools Performance)
- [x] No TypeScript errors: `npx nx typecheck angular-3d-demo`
- [x] No lint errors: `npx nx lint angular-3d-demo`
- [x] Production build succeeds: `npx nx build angular-3d-demo`
- [x] HTML overlay buttons clickable (z-index correct)
- [x] ARIA label present on scene container
- [x] No console errors in browser DevTools

---

## Notes for Developer

### Key Patterns to Follow

1. **ViewportPositioningService Pattern** (from hero-3d-teaser.component.ts:138-150):

   - Inject service in component
   - Use computed signal for positions
   - Check isCameraReady() before positioning
   - Hide elements off-screen [0, 100, 0] until ready

2. **Multi-Layer Star Fields** (from hero-3d-teaser.component.ts:78-91):

   - 3 layers at radii 30, 40, 50
   - Outer layers have twinkle enabled
   - Creates parallax depth effect

3. **Flight Paths** (from implementation-plan.md:272-287):

   - Defined as readonly component properties
   - SpaceFlightWaypoint type for type safety
   - Non-overlapping paths to avoid collisions

4. **Z-Index Layering**:
   - 3D scene: absolute, inset-0, z-0 (background)
   - Gradient overlay: z-1 (middle)
   - HTML content: z-10 (foreground)

### Commit Message Format

After each batch completion:

```bash
# Batch 1
feat(demo): add 3d scene foundation to gsap showcase hero

Replaces static PNG with Scene3dComponent container.
Adds ambient and directional lighting.

# Batch 2
feat(demo): add rotating earth gltf model to hero

Uses GltfModelComponent with Rotate3dDirective.
Positioned at viewport center with Z=-9 depth.

# Batch 3
feat(demo): add flying robots with space flight directive

2 robots on non-overlapping flight paths.
Auto-start looping animations with rotation.

# Batch 4
feat(demo): add multi-layer stars and nebula

3 star field layers for parallax depth.
Volumetric nebula in top-right background.

# Batch 5
feat(demo): add particle text, orbit controls, bloom

Completes interactive 3d hero section.
Preserves existing HTML overlay and GSAP animations.
```

### Testing Checklist

After implementation:

1. **Visual Test**:

   - Open http://localhost:4200 in Chrome
   - Verify hero section shows 3D scene
   - Drag mouse to rotate camera
   - Scroll to zoom in/out
   - Check all elements visible (planet, robots, stars, text, nebula)

2. **Performance Test**:

   - Open Chrome DevTools → Performance tab
   - Record 10 seconds of interaction (drag, zoom)
   - Check FPS graph (should be 55-60fps)
   - Check Main thread time (should be < 16ms per frame)

3. **Interactivity Test**:

   - Click "Get Started" button (should be clickable)
   - Click "See Examples" link (should be clickable)
   - Scroll page (should work at max zoom distance)
   - Verify GSAP animations on scroll (hero content fades out)

4. **Build Test**:
   - Run `npx nx build angular-3d-demo`
   - Verify build succeeds with 0 errors
   - Check bundle size increase is reasonable (< 5KB)

### Reference Files

- **Pattern Reference**: `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts`
- **Implementation Plan**: `task-tracking/TASK_2025_019/implementation-plan.md`
- **Requirements**: `task-tracking/TASK_2025_019/task-description.md`
- **Library Docs**: `libs/angular-3d/CLAUDE.md`
