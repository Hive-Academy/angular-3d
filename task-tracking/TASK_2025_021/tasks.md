# Development Tasks - TASK_2025_021

**Total Tasks**: 8 | **Batches**: 4 | **Status**: 1/4 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- InstancedParticleTextComponent does NOT use SceneGraphStore: Verified (libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:106-111)
- GltfModelComponent DOES support viewportPosition directive: Verified (current usage at hero-3d-teaser.component.ts:79-86)
- SCENE_COLORS available from shared/colors.ts: Verified (apps/angular-3d-demo/src/app/shared/colors.ts:7-30)

### Risks Identified

| Risk                                                                                         | Severity | Mitigation                                                                                                   |
| -------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| Multi-instance text horizontal alignment may be off due to browser font rendering variations | MEDIUM   | Provide calculated positions as starting point, allow ±0.5 unit manual adjustments in Batch 2                |
| Particle text may be unreadable on star field background                                     | HIGH     | Use additive blending, test opacity ranges 0.3-0.6, ensure adequate particlesPerPixel density in Batch 2 & 3 |
| Static positions break on non-16:9 aspect ratios                                             | MEDIUM   | Optimize for 16:9/16:10, document limitation, verify at 1920x1080, 1440x900, 1280x720 in Batch 4             |

### Edge Cases to Handle

- [ ] Text width calculation approximate - handled in Batch 2 Task 2.2 with adjustment instructions
- [ ] Line height spacing may need tuning - handled in Batch 2 Task 2.3 with multiplier adjustment
- [ ] Description readability on dark background - handled in Batch 3 with opacity/density testing

---

## Batch 1: Remove Old Text + Reposition Earth (LOW Risk) ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: None
**Commit**: [pending]

### Task 1.1: Remove "Angular 3D Library" Particle Text ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Spec Reference**: implementation-plan.md:146-177
**Pattern to Follow**: Simple template deletion

**Quality Requirements**:

- Text element completely removed from scene
- No orphaned imports or dependencies
- Scene renders without "Angular 3D Library" text above Earth

**Validation Notes**:

- No edge cases - straightforward deletion

**Implementation Details**:

- DELETE lines 209-215 (entire `<a3d-instanced-particle-text>` element)
- Element to remove:
  ```html
  <a3d-instanced-particle-text text="Angular 3D Library" [position]="[0, 7.5, 0]" [fontSize]="25" [particleColor]="colors.softGray" [opacity]="0.35" />
  ```

**Acceptance Criteria**:

- [ ] Lines 209-215 deleted from template
- [ ] Component compiles without errors
- [ ] Scene renders with Earth visible, no text above it

---

### Task 1.2: Reposition Earth to Right Side (70% from Left) ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:106-145
**Pattern to Follow**: apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts:79-86 (current Earth implementation)

**Quality Requirements**:

- Earth positioned at 70% from left edge of viewport
- Earth centered vertically at 50% Y position
- Rotation animation continues unchanged
- Responsive to window resize via ViewportPositioningService

**Validation Notes**:

- ViewportPositionDirective percentage positioning verified at libs/angular-3d/src/lib/positioning/viewport-position.directive.ts:97-103

**Implementation Details**:

- MODIFY lines 79-86:
  - CHANGE line 81: `viewportPosition="center"` TO `[viewportPosition]="{ x: '70%', y: '50%' }"`
  - KEEP all other properties unchanged: scale, rotateConfig, viewportOffset, modelPath
- Current element (line 79-86):
  ```html
  <a3d-gltf-model [modelPath]="'3d/planet_earth/scene.gltf'" viewportPosition="center" [viewportOffset]="{ offsetZ: -9 }" [scale]="2.3" rotate3d [rotateConfig]="{ axis: 'y', speed: 120, direction: 1 }" />
  ```
- Updated element should be:
  ```html
  <a3d-gltf-model [modelPath]="'3d/planet_earth/scene.gltf'" [viewportPosition]="{ x: '70%', y: '50%' }" [viewportOffset]="{ offsetZ: -9 }" [scale]="2.3" rotate3d [rotateConfig]="{ axis: 'y', speed: 120, direction: 1 }" />
  ```

**Acceptance Criteria**:

- [ ] viewportPosition changed from string "center" to object `{ x: '70%', y: '50%' }`
- [ ] Earth appears on right side of screen (~70% from left edge)
- [ ] Earth rotation animation continues
- [ ] All other Earth properties unchanged

---

**Batch 1 Verification**:

- [x] All files exist at paths
- [x] Build passes: `npx nx build angular-3d-demo`
- [x] Scene renders with Earth on right, no old text
- [x] Earth rotation functional

---

## Batch 2: Left-Side Heading Text (MEDIUM Risk) 🔄 IN PROGRESS

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 1 complete

### Task 2.1: Create Heading Line 1 - "Build " (White Particle Text) 🔄 IN PROGRESS

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Spec Reference**: implementation-plan.md:180-221
**Pattern to Follow**: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:42-53 (API inputs)

**Quality Requirements**:

- Text "Build " (with trailing space) visible and readable
- White color using SCENE_COLORS.white
- Positioned on left side at ~30% from left edge
- Particles billboard (face camera) for readability

**Validation Notes**:

- Position calculation based on FOV 75°, camera Z=20, 16:9 aspect ratio
- Static position may need ±0.5 unit adjustment for alignment with "Stunning"

**Implementation Details**:

- CREATE new element AFTER line 215 (where old particle text was deleted)
- INSERT before nebula effects section (line 217)
- Position calculation:
  - Camera: FOV 75°, Z = 20
  - Visible height: 2 _ tan(37.5°) _ 20 ≈ 30.69 units
  - Visible width (16:9): 30.69 \* 1.778 ≈ 54.56 units
  - Left 30%: -(54.56/2) + (54.56 \* 0.30) ≈ -10.91 units
  - Top 40%: (30.69/2) - (30.69 \* 0.40) ≈ 3.07 units
- Element to create:
  ```html
  <a3d-instanced-particle-text text="Build " [position]="[-10.91, 3.07, 0]" [fontSize]="45" [particleColor]="colors.white" [opacity]="0.5" [maxParticleScale]="0.25" [particlesPerPixel]="3" [skipInitialGrowth]="true" [blendMode]="'additive'" />
  ```

**Acceptance Criteria**:

- [ ] Element inserted after old particle text location
- [ ] Text "Build " renders on left side of screen
- [ ] White color applied
- [ ] Readability confirmed visually

---

### Task 2.2: Create Heading Line 1 - "Stunning" (Neon Green Particle Text) 🔄 IN PROGRESS

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Dependencies**: Task 2.1
**Spec Reference**: implementation-plan.md:224-271
**Pattern to Follow**: Same as Task 2.1

**Quality Requirements**:

- Text "Stunning" in neon green color (SCENE_COLORS.neonGreen)
- Horizontally aligned with "Build " on same baseline
- Positioned immediately after "Build " with minimal gap
- Same particle configuration as "Build " for visual consistency

**Validation Notes**:

- CRITICAL: Text width calculation is approximate - browser font rendering varies
- If horizontal alignment is off, adjust X position by ±0.5 units incrementally
- Text width estimate: fontSize=45, text="Build " (6 chars) ≈ 45 _ 6 _ 0.6 \* 0.08 ≈ 12.96 world units

**Implementation Details**:

- CREATE new element IMMEDIATELY AFTER Task 2.1 element
- Position calculation:
  - Start X: -10.91 (same as "Build ")
  - Estimated "Build " width: ~12.96 world units
  - "Stunning" X position: -10.91 + 12.96 ≈ 2.05 units
  - Y position: 3.07 (same as "Build " for baseline alignment)
- Element to create:
  ```html
  <a3d-instanced-particle-text text="Stunning" [position]="[2.05, 3.07, 0]" [fontSize]="45" [particleColor]="colors.neonGreen" [opacity]="0.5" [maxParticleScale]="0.25" [particlesPerPixel]="3" [skipInitialGrowth]="true" [blendMode]="'additive'" />
  ```
- ADJUSTMENT INSTRUCTIONS if alignment is off:
  - Too far right: Decrease X position (try 1.5, 1.0, 0.5)
  - Too far left: Increase X position (try 2.5, 3.0, 3.5)
  - Vertical misalignment: Adjust Y position by ±0.1 units

**Acceptance Criteria**:

- [ ] Text "Stunning" renders in neon green
- [ ] Horizontally aligned with "Build " on first line
- [ ] Appears immediately after "Build " with natural spacing
- [ ] Color matches SCENE_COLORS.neonGreen (0xa1ff4f)

---

### Task 2.3: Create Heading Line 2 - "Angular Experiences" (White Particle Text) 🔄 IN PROGRESS

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Dependencies**: Task 2.2
**Spec Reference**: implementation-plan.md:274-319
**Pattern to Follow**: Same as Task 2.1

**Quality Requirements**:

- Text "Angular Experiences" visible and readable
- Positioned below first line with appropriate line height spacing
- Left-aligned with "Build " from first line
- Same particle configuration as other heading words

**Validation Notes**:

- Line height: fontSize _ 1.5 = 45 _ 1.5 = 67.5 canvas pixels ≈ 5.4 world units
- If vertical spacing too tight/loose, adjust line height multiplier (1.3x to 1.7x)

**Implementation Details**:

- CREATE new element IMMEDIATELY AFTER Task 2.2 element
- Position calculation:
  - X position: -10.91 (same as "Build " for left alignment)
  - Y position: 3.07 - 5.4 ≈ -2.33 units
  - Z position: 0 (same depth as other heading text)
- Element to create:
  ```html
  <a3d-instanced-particle-text text="Angular Experiences" [position]="[-10.91, -2.33, 0]" [fontSize]="45" [particleColor]="colors.white" [opacity]="0.5" [maxParticleScale]="0.25" [particlesPerPixel]="3" [skipInitialGrowth]="true" [blendMode]="'additive'" />
  ```
- ADJUSTMENT INSTRUCTIONS if spacing is off:
  - Too tight: Decrease Y position (more negative, e.g., -2.8, -3.3)
  - Too loose: Increase Y position (less negative, e.g., -1.8, -1.3)

**Acceptance Criteria**:

- [ ] Text "Angular Experiences" renders below first line
- [ ] Left-aligned with "Build " from first line
- [ ] Natural line height spacing (not cramped or excessive)
- [ ] Readability confirmed visually

---

**Batch 2 Verification**:

- [ ] All 3 text elements created
- [ ] Build passes: `npx nx build angular-3d-demo`
- [ ] Heading "Build Stunning Angular Experiences" readable
- [ ] "Stunning" appears in neon green
- [ ] Horizontal alignment of "Build " + "Stunning" acceptable
- [ ] Vertical alignment of lines acceptable
- [ ] Edge case: Text width calculation verified visually (adjust if needed)

---

## Batch 3: Left-Side Description Text (MEDIUM Risk) ⏸️ PENDING

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 2 complete

### Task 3.1: Create Description Line 1 (Soft Gray Particle Text) ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Spec Reference**: implementation-plan.md:323-381
**Pattern to Follow**: Same as Batch 2, with reduced fontSize and opacity

**Quality Requirements**:

- Description text readable but more subtle than heading
- Soft gray color for visual hierarchy
- Positioned below heading with adequate spacing
- Text content: "Discover a powerful Angular library that seamlessly integrates"

**Validation Notes**:

- RISK: Text may be too faint on star field background
- If unreadable, increase opacity to 0.35-0.4 or particlesPerPixel to 3
- Font size 20 (smaller than heading 45) for clear hierarchy

**Implementation Details**:

- CREATE new element AFTER Task 2.3 element (after heading)
- Position calculation:
  - X position: -10.91 (same as heading for left alignment)
  - Y position: -6.0 (below heading with spacing)
  - Z position: 0 (same depth as heading)
- Element to create:
  ```html
  <a3d-instanced-particle-text text="Discover a powerful Angular library that seamlessly integrates" [position]="[-10.91, -6.0, 0]" [fontSize]="20" [particleColor]="colors.softGray" [opacity]="0.3" [maxParticleScale]="0.15" [particlesPerPixel]="2" [skipInitialGrowth]="true" [blendMode]="'additive'" />
  ```
- ADJUSTMENT INSTRUCTIONS if readability is poor:
  - Too faint: Increase opacity to 0.35 or 0.4
  - Too sparse: Increase particlesPerPixel to 3
  - Test against star field and nebula backgrounds

**Acceptance Criteria**:

- [ ] Description line 1 renders below heading
- [ ] Soft gray color applied (SCENE_COLORS.softGray)
- [ ] Readable but more subtle than heading
- [ ] Left-aligned with heading
- [ ] Edge case: Readability on dark background verified

---

### Task 3.2: Create Description Line 2 (Soft Gray Particle Text) ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts
**Dependencies**: Task 3.1
**Spec Reference**: implementation-plan.md:323-381
**Pattern to Follow**: Same as Task 3.1

**Quality Requirements**:

- Second line of description below first
- Same visual styling as Task 3.1 for consistency
- Natural word break with first line
- Text content: "Three.js for stunning 3D graphics and GSAP for smooth animations."

**Validation Notes**:

- Same readability risk as Task 3.1 - apply same mitigation if needed
- Line spacing: 20 _ 1.5 _ 0.08 ≈ 2.4 world units (smaller than heading line height)

**Implementation Details**:

- CREATE new element IMMEDIATELY AFTER Task 3.1 element
- Position calculation:
  - X position: -10.91 (same as first line)
  - Y position: -6.0 - 2.0 = -8.0 (below first line with spacing)
  - Z position: 0 (same depth)
- Element to create:
  ```html
  <a3d-instanced-particle-text text="Three.js for stunning 3D graphics and GSAP for smooth animations." [position]="[-10.91, -8.0, 0]" [fontSize]="20" [particleColor]="colors.softGray" [opacity]="0.3" [maxParticleScale]="0.15" [particlesPerPixel]="2" [skipInitialGrowth]="true" [blendMode]="'additive'" />
  ```
- ADJUSTMENT INSTRUCTIONS if needed:
  - Line spacing too tight: Decrease Y position (e.g., -8.5, -9.0)
  - Line spacing too loose: Increase Y position (e.g., -7.5, -7.0)
  - Same readability adjustments as Task 3.1

**Acceptance Criteria**:

- [ ] Description line 2 renders below line 1
- [ ] Same styling as line 1 for consistency
- [ ] Natural line wrapping with no awkward word breaks
- [ ] Left-aligned with line 1
- [ ] Edge case: Readability verified, adjustments made if needed

---

**Batch 3 Verification**:

- [ ] Both description lines created
- [ ] Build passes: `npx nx build angular-3d-demo`
- [ ] Description readable but subtle (clear hierarchy with heading)
- [ ] Natural line wrapping
- [ ] Alignment with heading consistent
- [ ] Edge case: Readability on dark background acceptable (opacity/density adjusted if needed)

---

## Batch 4: Testing & Polish (Verification) ⏸️ PENDING

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batch 3 complete

### Task 4.1: Comprehensive Testing & Acceptance Verification ⏸️ PENDING

**File**: N/A (testing only, no code changes)
**Spec Reference**: implementation-plan.md:612-653
**Pattern to Follow**: Chrome DevTools Performance profiling, visual testing

**Quality Requirements**:

- 60 FPS performance maintained (< 16.67ms frame time)
- Particle count < 15,000 total
- Readability confirmed at desktop resolutions
- All existing scene elements functional
- No TypeScript or ESLint errors

**Validation Notes**:

- KNOWN LIMITATION: Particle text positions are static (will not reposition on window resize)
- Document limitation if text misaligns at extreme aspect ratios
- Acceptable for desktop-first demo site

**Implementation Details**:

**STEP 1: Performance Testing**

- Open Chrome DevTools → Performance tab
- Record 10 seconds of scene rendering
- Verify frame time < 16.67ms (60 FPS)
- Check console for particle count warnings (should be < 15,000 total)

**STEP 2: Visual Readability Testing**

- Test at 1920x1080 (full HD desktop)
- Test at 1440x900 (laptop)
- Test at 1280x720 (small desktop)
- Verify all text readable at all resolutions
- Check contrast against star field and nebula backgrounds

**STEP 3: Responsiveness Testing**

- Resize browser window width
- Verify Earth repositions responsively to 70% from left
- KNOWN LIMITATION: Particle text positions are static (document if misaligned)

**STEP 4: Interaction Testing**

- Verify orbit controls still functional (rotate, zoom)
- Verify HTML buttons still clickable (if present on page)
- Verify Earth rotation continues
- Verify all scene elements render correctly (stars, robots, spheres, nebula, lights)

**STEP 5: Code Quality**

- Run `npx nx build angular-3d-demo` - verify zero errors
- Run `npx nx lint angular-3d-demo` - verify zero warnings
- Run `npx nx typecheck angular-3d-demo` - verify zero errors

**Acceptance Criteria** (from task-description.md):

- [ ] "Angular 3D Library" smoke text removed (Batch 1, Task 1.1)
- [ ] Earth at 70% from left using viewport directive (Batch 1, Task 1.2)
- [ ] Heading "Build Stunning Angular Experiences" as 3D text on left (Batch 2, Tasks 2.1-2.3)
- [ ] "Stunning" highlighted in neon green (Batch 2, Task 2.2)
- [ ] Description paragraph as 3D text below heading (Batch 3, Tasks 3.1-3.2)
- [ ] HTML buttons unchanged and functional (if present)
- [ ] All scene elements unchanged (stars, robots, spheres, nebula, lights)
- [ ] 60 FPS performance maintained (Chrome Performance profiler)
- [ ] Readability confirmed at 1920x1080, 1440x900, 1280x720
- [ ] No TypeScript/ESLint errors
- [ ] Particle count < 15,000 (check console warnings)
- [ ] Earth responsive positioning functional
- [ ] Orbit controls functional
- [ ] KNOWN LIMITATION documented: Particle text positions static (not responsive)

---

**Batch 4 Verification**:

- [ ] All acceptance criteria verified
- [ ] Performance metrics met
- [ ] Code quality checks passed
- [ ] Readability confirmed across resolutions
- [ ] Limitations documented

---

## Task Completion Summary

**Batch 1**: Remove old text + reposition Earth (2 tasks)
**Batch 2**: Left-side heading text - 3 instances (3 tasks)
**Batch 3**: Left-side description text - 2 instances (2 tasks)
**Batch 4**: Testing & acceptance verification (1 task)

**Total**: 8 tasks across 4 batches

**Developer Type**: frontend-developer (all batches)

**Estimated Effort**: 3-4 hours

- Batch 1: 20 minutes (simple deletions/changes)
- Batch 2: 1.5 hours (position calculation, alignment)
- Batch 3: 1 hour (text wrapping, readability)
- Batch 4: 1 hour (testing, verification, adjustments)

**File Modified**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\hero-3d-teaser.component.ts

---

## Next Steps

1. Team-leader assigns Batch 1 to frontend-developer
2. Developer implements Batch 1 tasks in order
3. Developer updates tasks to 🔄 IMPLEMENTED
4. Developer returns implementation report
5. Team-leader verifies, invokes code-logic-reviewer, creates git commit
6. Repeat for Batches 2, 3, 4
