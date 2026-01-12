# Implementation Plan - TASK_2025_021: Hero Section 3D Text Redesign

## 📊 Codebase Investigation Summary

### Libraries Discovered

- **@hive-academy/angular-3d**: Three.js Angular wrapper library
  - Key exports: `InstancedParticleTextComponent`, `GltfModelComponent`, `ViewportPositionDirective`, `SCENE_COLORS`
  - Documentation: libs/angular-3d/CLAUDE.md
  - Usage examples: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts

### Patterns Identified

- **Particle Text Pattern**: `InstancedParticleTextComponent` for smoke/cloud text effects
  - Evidence: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts
  - Components: Single-line text input, signal-based configuration, billboard rotation
  - Conventions: Uses `fontSize`, `particleColor`, `opacity`, `maxParticleScale`, `particlesPerPixel`, `skipInitialGrowth`

- **Static Positioning Pattern**: Manual position calculation for components that don't register with SceneGraphStore
  - Evidence: InstancedParticleTextComponent does NOT use SceneGraphStore (lines 1-574, no mention of SceneGraphStore)
  - Components: Direct `[position]` input with calculated world coordinates
  - Conventions: Calculate positions from camera FOV and Z-distance

- **Viewport Positioning Pattern**: `viewportPosition` directive for reactive positioning
  - Evidence: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:74-157
  - Components: Named positions ('center', 'top-left'), percentage positions, pixel positions
  - **CRITICAL CONSTRAINT**: Requires component to register with SceneGraphStore (line 84, 154)
  - **LIMITATION**: `InstancedParticleTextComponent` does NOT register with SceneGraphStore, therefore `viewportPosition` directive will NOT work on it

### Integration Points

- **Color System**: `SCENE_COLORS` from `apps/angular-3d-demo/src/app/shared/colors.ts`
  - Location: apps/angular-3d-demo/src/app/shared/colors.ts:7-30
  - Interface: `neonGreen: 0xa1ff4f`, `white: 0xffffff`, `softGray: 0x9ca3af`
  - Usage: Pass as `[particleColor]` input to particle text components

- **Camera Configuration**: FOV 75°, position [0, 0, 20]
  - Location: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:58
  - Interface: `[cameraPosition]="[0, 0, 20]" [cameraFov]="75"`
  - Usage: Required for position calculations when using static positioning

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Static Position Calculation with Multi-Instance Particle Text
**Rationale**:
- `InstancedParticleTextComponent` does NOT register with SceneGraphStore
- Therefore `viewportPosition` directive cannot be used on particle text
- Must calculate static world positions from camera FOV mathematics
- Earth can use `viewportPosition` (GltfModelComponent DOES register with SceneGraphStore)

**Evidence**:
- InstancedParticleTextComponent: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:90-574 (no SceneGraphStore injection)
- ViewportPositionDirective requirement: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:84 (requires SceneGraphStore)
- GltfModelComponent usage with viewportPosition: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:79-86

### Position Calculation Mathematics

**Camera Configuration**:
- FOV: 75° vertical
- Position: [0, 0, 20] (Z = 20 units from origin)
- Aspect ratio: Dynamic (window width/height)

**Visible Height Calculation** (at Z = 0 plane):
```
visibleHeight = 2 * tan(FOV/2 * π/180) * cameraZ
visibleHeight = 2 * tan(75°/2) * 20
visibleHeight = 2 * tan(37.5°) * 20
visibleHeight = 2 * 0.7673 * 20
visibleHeight ≈ 30.69 units
```

**Visible Width Calculation** (at Z = 0 plane, assuming 16:9 aspect):
```
visibleWidth = visibleHeight * aspectRatio
visibleWidth ≈ 30.69 * (16/9)
visibleWidth ≈ 54.56 units (at 1920x1080)
```

**Left Side Position (30% from left edge)**:
```
leftX = -(visibleWidth/2) + (visibleWidth * 0.30)
leftX ≈ -(54.56/2) + (54.56 * 0.30)
leftX ≈ -27.28 + 16.37
leftX ≈ -10.91 units
```

**Right Side Position (70% from left edge)**:
```
rightX = -(visibleWidth/2) + (visibleWidth * 0.70)
rightX ≈ -(54.56/2) + (54.56 * 0.70)
rightX ≈ -27.28 + 38.19
rightX ≈ 10.91 units
```

**Vertical Positions**:
- Top 40% (heading): `y = (visibleHeight/2) - (visibleHeight * 0.40) ≈ 15.35 - 12.28 ≈ 3.07`
- Middle 50% (line 2): `y = (visibleHeight/2) - (visibleHeight * 0.50) ≈ 15.35 - 15.35 ≈ 0`
- Middle 60% (description): `y = (visibleHeight/2) - (visibleHeight * 0.60) ≈ 15.35 - 18.41 ≈ -3.06`

**CRITICAL NOTE**: These calculations assume 16:9 aspect ratio. For true responsive positioning, would need to calculate at runtime using `ViewportPositioningService.getPosition()`, but since `InstancedParticleTextComponent` doesn't support `viewportPosition` directive, we use static positions optimized for desktop viewports.

### Component Specifications

#### Component 1: Earth Model Repositioning

**Purpose**: Reposition Earth to right side of viewport (~70% from left) to create space for left-aligned text

**Pattern**: Viewport Positioning with Directive
**Evidence**:
- Pattern source: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:79-86
- Current Earth implementation uses `viewportPosition="center"`
- Directive definition: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:74-157

**Responsibilities**:
- Maintain Earth rotation animation
- Maintain Earth scale (2.3)
- Maintain Z-depth (offsetZ: -9)
- Reposition to right side using percentage positioning

**Implementation Pattern**:
```typescript
// Pattern source: hero-3d-teaser.component.ts:79-86
// Modified to use percentage positioning instead of named position
<a3d-gltf-model
  [modelPath]="'3d/planet_earth/scene.gltf'"
  [viewportPosition]="{ x: '70%', y: '50%' }"
  [viewportOffset]="{ offsetZ: -9 }"
  [scale]="2.3"
  rotate3d
  [rotateConfig]="{ axis: 'y', speed: 120, direction: 1 }"
/>
```

**Quality Requirements**:
- **Functional**: Earth must remain centered vertically at 50% Y position
- **Functional**: Earth must position at 70% from left edge of viewport
- **Functional**: Rotation animation must continue unchanged
- **Non-Functional**: Responsive to window resize via ViewportPositioningService
- **Pattern Compliance**: Must use `viewportPosition` directive with percentage object `{ x: string, y: string }`

**Files Affected**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts (MODIFY lines 79-86)

---

#### Component 2: Remove Existing Smoke Text

**Purpose**: Remove "Angular 3D Library" particle text above Earth to declutter scene

**Pattern**: Template Deletion
**Evidence**: Current smoke text at apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:209-215

**Responsibilities**:
- Remove entire `<a3d-instanced-particle-text>` element
- Ensure no orphaned imports or dependencies

**Implementation Pattern**:
```typescript
// DELETE LINES 209-215
// <a3d-instanced-particle-text
//   text="Angular 3D Library"
//   [position]="[0, 7.5, 0]"
//   [fontSize]="25"
//   [particleColor]="colors.softGray"
//   [opacity]="0.35"
// />
```

**Quality Requirements**:
- **Functional**: Text must be completely removed from rendered scene
- **Non-Functional**: No performance impact (removing elements improves performance)

**Files Affected**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts (MODIFY lines 209-215, DELETE)

---

#### Component 3: Left-Side Heading - Line 1 ("Build ")

**Purpose**: First part of heading displayed as 3D particle text on left side

**Pattern**: Static Positioned Particle Text
**Evidence**:
- Component: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:78-574
- Inputs: text, position, fontSize, particleColor, opacity, maxParticleScale, particlesPerPixel, skipInitialGrowth
- Static position example: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:209-215

**Responsibilities**:
- Render "Build " in white particle text
- Position at left side, top 40% of viewport
- Use static calculated position (no viewport directive)

**Implementation Pattern**:
```typescript
// Pattern source: instanced-particle-text.component.ts:42-53
// Position calculation: leftX ≈ -10.91, topY ≈ 3.07
<a3d-instanced-particle-text
  text="Build "
  [position]="[-10.91, 3.07, 0]"
  [fontSize]="45"
  [particleColor]="colors.white"
  [opacity]="0.5"
  [maxParticleScale]="0.25"
  [particlesPerPixel]="3"
  [skipInitialGrowth]="true"
  [blendMode]="'additive'"
/>
```

**Quality Requirements**:
- **Functional**: Text "Build " must be visible and readable
- **Functional**: Must use white color from SCENE_COLORS.white
- **Functional**: Must appear on left side at approximately 30% from left edge
- **Non-Functional**: Particles must billboard (face camera) for readability
- **Pattern Compliance**: Must use InstancedParticleTextComponent with skipInitialGrowth=true

**Files Affected**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts (CREATE new element after line 215)

---

#### Component 4: Left-Side Heading - Line 1 ("Stunning")

**Purpose**: Highlight word in heading displayed as neon green particle text

**Pattern**: Static Positioned Particle Text (Multi-Color Strategy)
**Evidence**: Same as Component 3
**Rationale**: InstancedParticleTextComponent accepts single color per instance, so multi-color text requires multiple instances positioned side-by-side

**Responsibilities**:
- Render "Stunning" in neon green particle text
- Position immediately after "Build " on same line
- Calculate X offset based on "Build " text width

**Text Width Calculation**:
```typescript
// Canvas measurement approach (runtime calculation needed in actual implementation)
// fontSize = 45, text = "Build "
// Approximate width: 45 * 6 characters * 0.6 (average char width ratio) = 162 canvas pixels
// World units: 162 * 0.08 (fontScaleFactor) ≈ 12.96 world units
// Position: [-10.91 + 12.96, 3.07, 0] ≈ [2.05, 3.07, 0]
```

**Implementation Pattern**:
```typescript
// Position calculation: leftX + buildWidth ≈ 2.05, topY ≈ 3.07
<a3d-instanced-particle-text
  text="Stunning"
  [position]="[2.05, 3.07, 0]"
  [fontSize]="45"
  [particleColor]="colors.neonGreen"
  [opacity]="0.5"
  [maxParticleScale]="0.25"
  [particlesPerPixel]="3"
  [skipInitialGrowth]="true"
  [blendMode]="'additive'"
/>
```

**Quality Requirements**:
- **Functional**: Text "Stunning" must be neon green color
- **Functional**: Must align horizontally with "Build " on same baseline
- **Functional**: Must appear immediately after "Build " with minimal gap
- **Non-Functional**: Color must use SCENE_COLORS.neonGreen (0xa1ff4f)
- **Pattern Compliance**: Same particle configuration as "Build " for visual consistency

**Files Affected**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts (CREATE new element after Component 3)

---

#### Component 5: Left-Side Heading - Line 2 ("Angular Experiences")

**Purpose**: Second line of heading displayed as white particle text

**Pattern**: Static Positioned Particle Text (Multi-Line Strategy)
**Evidence**: Same as Component 3
**Rationale**: InstancedParticleTextComponent accepts single-line text, so multi-line requires multiple instances with Y-offset

**Responsibilities**:
- Render "Angular Experiences" in white particle text
- Position below first line with appropriate line height spacing
- Align with left edge of "Build "

**Line Height Calculation**:
```typescript
// Line height: fontSize * 1.5 (standard typography practice)
// lineHeight = 45 * 1.5 = 67.5 canvas pixels
// World units: 67.5 * 0.08 (fontScaleFactor) ≈ 5.4 world units
// Position: [-10.91, 3.07 - 5.4, 0] ≈ [-10.91, -2.33, 0]
```

**Implementation Pattern**:
```typescript
// Position calculation: leftX ≈ -10.91, topY - lineHeight ≈ -2.33
<a3d-instanced-particle-text
  text="Angular Experiences"
  [position]="[-10.91, -2.33, 0]"
  [fontSize]="45"
  [particleColor]="colors.white"
  [opacity]="0.5"
  [maxParticleScale]="0.25"
  [particlesPerPixel]="3"
  [skipInitialGrowth]="true"
  [blendMode]="'additive'"
/>
```

**Quality Requirements**:
- **Functional**: Text "Angular Experiences" must be visible and readable
- **Functional**: Must align left with "Build " from first line
- **Functional**: Must have clear vertical spacing below first line
- **Non-Functional**: Line height spacing must feel natural (1.5x fontSize)
- **Pattern Compliance**: Same particle configuration as other heading words

**Files Affected**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts (CREATE new element after Component 4)

---

#### Component 6: Left-Side Description Text

**Purpose**: Description paragraph displayed as subtle 3D particle text below heading

**Pattern**: Static Positioned Particle Text (Smaller Font)
**Evidence**: Same as Component 3, with reduced fontSize and opacity for hierarchy

**Responsibilities**:
- Render description paragraph in soft gray particle text
- Position below heading with adequate spacing
- Use smaller font size for visual hierarchy
- Text content: "Discover a powerful Angular library that seamlessly integrates Three.js for stunning 3D graphics and GSAP for smooth scroll animations."

**Position Calculation**:
```typescript
// Description Y position: 60% from top
// descY = (visibleHeight/2) - (visibleHeight * 0.60)
// descY ≈ 15.35 - 18.41 ≈ -3.06
// Position: [-10.91, -6.0, 0] (adjusted downward for spacing)
```

**Implementation Pattern**:
```typescript
// Position calculation: leftX ≈ -10.91, descY ≈ -6.0
<a3d-instanced-particle-text
  text="Discover a powerful Angular library that seamlessly integrates"
  [position]="[-10.91, -6.0, 0]"
  [fontSize]="20"
  [particleColor]="colors.softGray"
  [opacity]="0.3"
  [maxParticleScale]="0.15"
  [particlesPerPixel]="2"
  [skipInitialGrowth]="true"
  [blendMode]="'additive'"
/>
<a3d-instanced-particle-text
  text="Three.js for stunning 3D graphics and GSAP for smooth animations."
  [position]="[-10.91, -8.0, 0]"
  [fontSize]="20"
  [particleColor]="colors.softGray"
  [opacity]="0.3"
  [maxParticleScale]="0.15"
  [particlesPerPixel]="2"
  [skipInitialGrowth]="true"
  [blendMode]="'additive'"
/>
```

**Quality Requirements**:
- **Functional**: Description must be readable but more subtle than heading
- **Functional**: Must wrap to multiple lines naturally (manual line breaks)
- **Functional**: Must align left with heading
- **Non-Functional**: Visual hierarchy must be clear (smaller, lower opacity than heading)
- **Non-Functional**: Text should not exceed ~60 characters per line for readability
- **Pattern Compliance**: Reduced particlesPerPixel (2) and maxParticleScale (0.15) for subtlety

**Files Affected**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts (CREATE new elements after Component 5)

---

## 🔗 Integration Architecture

### Integration Points

- **Color Integration**: All particle text uses `this.colors` property from component
  - Pattern: `[particleColor]="colors.neonGreen"`, `[particleColor]="colors.white"`, `[particleColor]="colors.softGray"`
  - Evidence: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:272

- **Earth Model Integration**: GltfModelComponent uses ViewportPositionDirective
  - Pattern: `[viewportPosition]="{ x: '70%', y: '50%' }"`
  - Evidence: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:97-103

### Data Flow

1. **Scene Initialization**:
   - Scene3dComponent creates camera with FOV 75°, position [0, 0, 20]
   - GltfModelComponent loads Earth model
   - ViewportPositioningService calculates Earth position at 70% X, 50% Y
   - InstancedParticleTextComponent instances render text with static positions

2. **Runtime Rendering**:
   - RenderLoopService triggers per-frame updates
   - InstancedParticleTextComponent billboards particles to face camera
   - Earth rotates via Rotate3dDirective
   - All other scene elements (stars, robots, spheres, nebula) render unchanged

3. **Responsive Behavior**:
   - Earth repositions on window resize via ViewportPositioningService
   - Particle text remains at static positions (no resize response)
   - **RISK**: Text may appear misaligned on extreme aspect ratios (ultrawide, vertical)

### Dependencies

**External Dependencies**:
- Three.js (existing) - 3D rendering
- SCENE_COLORS (existing) - Color palette

**Internal Dependencies**:
- ViewportPositionDirective (existing) - Earth positioning
- InstancedParticleTextComponent (existing) - Text rendering
- GltfModelComponent (existing) - Earth model

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

- All text content must be readable at desktop resolutions (1920x1080, 1440x900, 1280x720)
- "Stunning" word must appear in neon green color distinct from other words
- Earth must position at approximately 70% from left edge responsively
- Existing scene elements must remain unchanged (stars, robots, spheres, nebula, lights)
- HTML buttons must remain functional (not converted to 3D)

### Non-Functional Requirements

- **Performance**: Total particle count must not exceed 15,000 (estimated: ~8,000-10,000 for heading + description)
- **Performance**: Frame rate must maintain 60 FPS (particle text uses InstancedMesh for efficiency)
- **Readability**: Minimum 3:1 contrast ratio against star field background (achieved via opacity and additive blending)
- **Maintainability**: Text content must be easily editable via component template (no hardcoded positions in TypeScript)
- **Testability**: Component must compile without TypeScript errors and match ESLint standards

### Pattern Compliance

- **Static Positioning Pattern**: All particle text must use calculated `[position]` inputs (verified no SceneGraphStore integration)
  - Evidence: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:1-574 (no SceneGraphStore injection)
- **Viewport Positioning Pattern**: Earth model must use `viewportPosition` directive with percentage object
  - Evidence: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:97-103
- **Color System Pattern**: All colors must use SCENE_COLORS constants
  - Evidence: apps/angular-3d-demo/src/app/shared/colors.ts:7-30
- **Signal-Based Configuration**: All component inputs must use signal-based bindings
  - Evidence: InstancedParticleTextComponent inputs defined as `input<T>()` signals (lines 92-104)

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. **UI Component Work**: Task involves modifying Angular component templates with 3D elements
2. **Browser Rendering**: Requires understanding of Three.js rendering, particle systems, and WebGL
3. **No Backend Logic**: Zero backend API changes, database modifications, or server-side logic
4. **Frontend Expertise Required**:
   - Angular standalone components and signal-based inputs
   - Three.js Object3D positioning and camera mathematics
   - InstancedMesh particle rendering
   - Template syntax and data binding

### Complexity Assessment

**Complexity**: MEDIUM

**Estimated Effort**: 3-4 hours

**Breakdown**:
- Remove existing smoke text: 5 minutes (simple deletion)
- Reposition Earth model: 15 minutes (update viewportPosition binding)
- Create heading particle text (3 instances): 1.5 hours (position calculation, multi-instance alignment)
- Create description particle text (2 instances): 1 hour (text wrapping, line breaks, alignment)
- Testing and readability adjustments: 1 hour (contrast testing, position fine-tuning, performance profiling)

**Complexity Factors**:
- **MEDIUM**: Static position calculations from camera FOV mathematics (not complex, but requires precision)
- **MEDIUM**: Multi-instance text alignment (horizontal alignment of "Build " + "Stunning", vertical alignment of lines)
- **LOW**: Earth repositioning (simple directive change)
- **LOW**: Color highlighting (multiple instances with different colors)
- **RISK**: Readability testing may require iterative opacity/color adjustments

---

### Files Affected Summary

**MODIFY**:
- apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts

**CREATE**: None (all changes within existing file)

**REWRITE** (Direct Replacement): None

---

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **All imports exist in codebase**:
   - InstancedParticleTextComponent from '@hive-academy/angular-3d' (line 13)
   - ViewportPositionDirective from '@hive-academy/angular-3d' (line 7)
   - GltfModelComponent from '@hive-academy/angular-3d' (line 11)
   - SCENE_COLORS from '../../../shared/colors' (line 20)

2. **All patterns verified from examples**:
   - Particle text pattern: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:42-53
   - Viewport positioning pattern: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:79-86
   - Static positioning pattern: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:209-215

3. **Library documentation consulted**:
   - libs/angular-3d/CLAUDE.md (component patterns, signal inputs, cleanup)

4. **No hallucinated APIs**:
   - All InstancedParticleTextComponent inputs verified: text, position, fontSize, particleColor, opacity, maxParticleScale, particlesPerPixel, skipInitialGrowth, blendMode (lines 92-104)
   - ViewportPositionDirective inputs verified: viewportPosition (percentage object supported), viewportOffset (line 97-113)
   - SCENE_COLORS verified: neonGreen, white, softGray (apps/angular-3d-demo/src/app/shared/colors.ts:11,9,24)

---

### Implementation Approach

#### Batch 1: Earth Repositioning + Remove Old Text (Low Risk)

**Steps**:
1. Remove `<a3d-instanced-particle-text>` element at lines 209-215
2. Modify `<a3d-gltf-model>` element at lines 79-86:
   - Change `viewportPosition="center"` to `[viewportPosition]="{ x: '70%', y: '50%' }"`
   - Keep all other properties unchanged (scale, rotateConfig, viewportOffset)

**Verification**:
- Earth appears on right side of screen at ~70% from left
- Earth continues rotating
- No "Angular 3D Library" text visible above Earth

**Risk Level**: LOW (simple property changes)

---

#### Batch 2: Left-Side Heading Text (Medium Risk - Alignment Required)

**Steps**:
1. Add 3 `<a3d-instanced-particle-text>` instances for heading:
   - Instance 1: "Build " at position [-10.91, 3.07, 0]
   - Instance 2: "Stunning" at position [2.05, 3.07, 0] (neon green)
   - Instance 3: "Angular Experiences" at position [-10.91, -2.33, 0]
2. Use fontSize=45, opacity=0.5, maxParticleScale=0.25, particlesPerPixel=3

**Position Calculation Reference**:
```typescript
// Camera: FOV 75°, Z = 20
// Visible height: 2 * tan(37.5°) * 20 ≈ 30.69
// Visible width (16:9): 30.69 * 1.778 ≈ 54.56
// Left 30%: -(54.56/2) + (54.56 * 0.30) ≈ -10.91
// Top 40%: (30.69/2) - (30.69 * 0.40) ≈ 3.07
// Line height: 45 * 1.5 * 0.08 ≈ 5.4 world units
```

**Verification**:
- "Build Stunning" appears on first line with "Stunning" in green
- "Angular Experiences" appears on second line below
- Text appears on left side of screen (~30% from left edge)
- Horizontal alignment of "Build " and "Angular Experiences" matches

**Risk Level**: MEDIUM (horizontal alignment of multi-color text, vertical line spacing)

**Mitigation**:
- If horizontal alignment is off, adjust X position of "Stunning" incrementally (±0.5 units)
- If vertical spacing too tight/loose, adjust Y position of "Angular Experiences" (±0.5 units)
- **CRITICAL**: Text width calculation may vary by browser font rendering - expect need for manual fine-tuning

---

#### Batch 3: Left-Side Description Text (Medium Risk - Readability)

**Steps**:
1. Add 2 `<a3d-instanced-particle-text>` instances for description (split to 2 lines):
   - Line 1: "Discover a powerful Angular library that seamlessly integrates" at [-10.91, -6.0, 0]
   - Line 2: "Three.js for stunning 3D graphics and GSAP for smooth animations." at [-10.91, -8.0, 0]
2. Use fontSize=20, opacity=0.3, maxParticleScale=0.15, particlesPerPixel=2
3. Use softGray color for subtle appearance

**Verification**:
- Description text appears below heading with clear visual hierarchy
- Text is readable but more subtle than heading
- Line wrapping feels natural (no awkward word breaks)
- Alignment with heading is consistent

**Risk Level**: MEDIUM (readability on dark backgrounds, line wrapping)

**Mitigation**:
- If text too faint, increase opacity to 0.35-0.4
- If particles too sparse, increase particlesPerPixel to 3
- If line breaks awkward, adjust text split point manually
- **Alternative**: Shorten description to 1 line if readability insufficient ("Discover powerful Angular integration with Three.js and GSAP")

---

#### Batch 4: Testing and Polish (Required for Acceptance)

**Steps**:
1. **Performance Testing**:
   - Open Chrome DevTools Performance tab
   - Record 10 seconds of scene rendering
   - Verify frame time < 16.67ms (60 FPS)
   - Check particle count in InstancedParticleTextComponent warnings (should be < 15,000 total)

2. **Visual Readability Testing**:
   - Test at 1920x1080 (full HD desktop)
   - Test at 1440x900 (laptop)
   - Test at 1280x720 (small desktop)
   - Verify text readable at all resolutions
   - Check contrast against star field background

3. **Responsiveness Testing**:
   - Resize browser window width
   - Verify Earth repositions responsively
   - **KNOWN LIMITATION**: Particle text positions are static (will not reposition)
   - Document limitation if text misaligns at extreme aspect ratios

4. **Interaction Testing**:
   - Verify orbit controls still functional
   - Verify HTML buttons still clickable
   - Verify Earth rotation continues
   - Verify all existing scene elements render correctly

**Acceptance Criteria** (from task-description.md):
- [ ] "Angular 3D Library" smoke text removed
- [ ] Earth at 70% from left using viewport directive
- [ ] Heading "Build Stunning Angular Experiences" as 3D text on left
- [ ] "Stunning" highlighted in neon green
- [ ] Description paragraph as 3D text below heading
- [ ] HTML buttons unchanged and functional
- [ ] All scene elements unchanged (stars, robots, spheres, nebula)
- [ ] 60 FPS performance maintained
- [ ] Readability confirmed at desktop resolutions
- [ ] No TypeScript/ESLint errors

**Risk Level**: LOW (testing only, no code changes)

---

### Risk Mitigation Strategies

#### Risk 1: Particle Text Unreadable on Star Field Background

**Probability**: HIGH
**Impact**: CRITICAL
**Mitigation**:
- Use additive blending mode for glow effect
- Increase opacity to 0.5-0.6 for heading, 0.3-0.4 for description
- Test multiple color combinations (white vs softGray)
- Ensure sufficient particlesPerPixel density (3 for heading, 2-3 for description)

**Contingency**:
- If unreadable, fall back to HTML text overlay with 3D background elements
- Alternative: Add dark semi-transparent backdrop behind text area
- Alternative: Increase particle density to 4 particlesPerPixel (may impact performance)

---

#### Risk 2: Multi-Instance Text Misalignment (Horizontal/Vertical)

**Probability**: MEDIUM
**Impact**: HIGH
**Mitigation**:
- Provide calculated positions based on FOV mathematics as starting point
- Document adjustment strategy in implementation plan
- Allow ±0.5 unit incremental adjustments during testing
- **CRITICAL**: Text width calculations are approximate (font rendering varies by browser)

**Contingency**:
- If horizontal alignment impossible, use single color for entire heading (simplify to 2 instances)
- If vertical spacing awkward, adjust line height multiplier (1.5x to 1.3x or 1.7x)
- **Last Resort**: Implement runtime text width measurement using Canvas measureText() API

---

#### Risk 3: Static Positions Break on Non-16:9 Aspect Ratios

**Probability**: MEDIUM
**Impact**: MEDIUM
**Mitigation**:
- Optimize positions for most common desktop aspect ratios (16:9, 16:10)
- Document known limitation: "Particle text positions optimized for 16:9 aspect ratio viewports"
- Test at 1920x1080 (16:9), 1440x900 (16:10), 1280x720 (16:9)

**Contingency**:
- If misalignment severe, recommend viewport positioning enhancement to library (future task)
- Short-term: Detect aspect ratio and apply conditional position offsets
- Alternative: Use single-line heading to reduce vertical complexity

---

#### Risk 4: Particle Animation Distracts from Readability

**Probability**: LOW
**Impact**: MEDIUM
**Mitigation**:
- Use `skipInitialGrowth=true` to eliminate growth animation
- InstancedParticleTextComponent has subtle pulse animation (0.2 scale variation)
- Pulse is inherent to component, cannot be disabled without modification

**Contingency**:
- If pulse too distracting, file library enhancement request to add `disablePulse` input
- Short-term: Accept subtle animation as intentional "alive" effect
- Alternative: Use SmokeParticleTextComponent instead (different particle behavior)

---

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (MEDIUM, 3-4 hours)
- [x] Implementation batches defined with risk levels
- [x] Risk mitigation strategies documented
- [x] Acceptance criteria mapped from requirements
- [x] Critical verification points listed
- [x] No step-by-step implementation (team-leader's responsibility to decompose into atomic tasks)

---

## 📋 Architecture Notes for Team-Leader

### Key Architectural Decisions

1. **Static Positioning Strategy**: Due to `InstancedParticleTextComponent` not registering with `SceneGraphStore`, we MUST use static calculated positions. This is not a workaround - it's the only viable approach given current library capabilities.

2. **Multi-Instance Multi-Color Text**: To achieve "Stunning" in green while other words are white, we use 3 separate component instances for the heading. This is the standard pattern when inline color spans are not supported.

3. **Earth Viewport Positioning**: `GltfModelComponent` DOES support `viewportPosition` directive because it registers with `SceneGraphStore`. This provides responsive positioning for Earth.

4. **Manual Text Wrapping**: Description text requires manual line breaks across 2 component instances since InstancedParticleTextComponent doesn't support automatic text wrapping.

### Known Limitations to Communicate to Developer

1. **Non-Responsive Text Positions**: Particle text will not reposition on window resize. Acceptable for desktop-first demo site, but document this limitation.

2. **Approximate Position Calculations**: FOV mathematics provide starting positions, but font rendering varies. Developer MUST visually verify and adjust positions incrementally.

3. **No Inline Color Spans**: Highlighting "Stunning" requires 3 separate component instances, not a single component with rich text formatting.

4. **Inherent Pulse Animation**: InstancedParticleTextComponent has built-in subtle pulse (scale variation). This cannot be disabled without library modification.

### Success Metrics for Team-Leader Validation

- **Visual Balance**: Left text and right Earth create harmonious composition
- **Readability**: All text readable at 1920x1080, 1440x900, 1280x720
- **Performance**: Frame time < 16.67ms (60 FPS) in Chrome Performance profiler
- **Particle Count**: Total < 15,000 particles (check console warnings)
- **Code Quality**: Zero TypeScript errors, zero ESLint warnings
- **Pattern Compliance**: Matches existing angular-3d component patterns (signals, OnPush, cleanup)

---

## 🔍 Evidence Provenance (Complete Citations)

**Decision**: Use InstancedParticleTextComponent for text rendering
**Evidence**:
- Component definition: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:78-574
- Input API: lines 92-104 (text, position, fontSize, particleColor, opacity, maxParticleScale, particlesPerPixel, skipInitialGrowth, blendMode)
- Usage example: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:209-215
- Documentation: Component JSDoc comments lines 20-53

**Decision**: Use static position calculation (NOT viewportPosition directive)
**Evidence**:
- InstancedParticleTextComponent does NOT inject SceneGraphStore: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:106-111 (only parent, destroyRef, renderLoop, sceneService, textSampling)
- ViewportPositionDirective REQUIRES SceneGraphStore: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:84 (private readonly sceneStore = inject(SceneGraphStore))
- Therefore: viewportPosition directive cannot be used on InstancedParticleTextComponent

**Decision**: Use viewportPosition directive for Earth model
**Evidence**:
- GltfModelComponent supports viewport positioning: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:79-86 (current usage)
- Percentage position support: libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:97-103 (PercentagePosition type accepted)
- Documentation: Directive JSDoc examples lines 18-42

**Decision**: Use SCENE_COLORS constants for all colors
**Evidence**:
- Color constants: apps/angular-3d-demo/src/app/shared/colors.ts:7-30
- Exports: neonGreen (0xa1ff4f line 11), white (0xffffff line 9), softGray (0x9ca3af line 24)
- Usage pattern: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:272 (public readonly colors = SCENE_COLORS)

**Decision**: Multi-instance approach for multi-color and multi-line text
**Evidence**:
- Single text input: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:92 (readonly text = input.required<string>())
- Single color input: line 96 (readonly particleColor = input<number>(0x00d4ff))
- No rich text support: Entire component architecture assumes single-line, single-color text
- Rationale: Multiple instances required for multi-color ("Build " white + "Stunning" green) and multi-line (Line 1 + Line 2)
