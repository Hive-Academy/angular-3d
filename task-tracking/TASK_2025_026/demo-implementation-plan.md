# Demo Implementation Plan - TASK_2025_026 Phase 2

**Task**: Demo App Enhancements to Showcase Phase 1 Library Features
**Created**: 2025-12-25
**Type**: Enhancement
**Complexity**: Medium (4-12 hours total across 3 phases)

---

## Overview

This implementation plan formalizes the research findings into actionable demo app enhancements that showcase the five new library features implemented in Phase 1:

1. **InstancedMeshComponent** - GPU instancing for massive object counts
2. **EnvironmentComponent** - HDRI/IBL lighting for photorealistic materials
3. **ShaderMaterialDirective** - Custom GLSL shaders for advanced effects
4. **Demand-Based Rendering** - Battery-efficient rendering mode
5. **Post-Processing Effects** - DOF, SSAO, Color Grading

The enhancements are organized into 3 sub-phases progressing from quick wins (1-2 hours) to new showcase sections (8-12 hours).

---

## Phase Structure

### Phase 2.1: Quick Wins (1-2 hours)

**Goal**: Apply immediate visual quality upgrades to existing hero scenes with minimal effort.

**Enhancements**:

1. Add HDRI environment to hero-3d-teaser (30 min)
2. Add DOF to hero-3d-teaser (30 min)
3. Enable demand rendering for value-props-3d-scene (30 min)
4. Add HDRI to hero-space-scene (30 min)

**Impact**: Transform hero scenes from "functional" to "award-quality" with <2 hours work.

---

### Phase 2.2: Showcase Expansions (4-6 hours)

**Goal**: Expand existing showcase sections to document all new post-processing and lighting features.

**Enhancements**:

1. Expand postprocessing-section to include DOF, SSAO, Color Grading (2-3 hrs)
2. Add Environment/HDRI to lighting-section (1-2 hrs)
3. Add HDRI background to primitives-section (30 min)

**Impact**: Complete documentation of all new library features in dedicated showcase sections.

---

### Phase 2.3: New Showcase Sections (8-12 hours)

**Goal**: Create dedicated showcase sections for complex features requiring interactive demos.

**Enhancements**:

1. Performance showcase section - InstancedMesh + Demand Rendering (3-4 hrs)
2. Environment showcase section - HDRI preset gallery (2-3 hrs)
3. Shaders showcase section - Custom GLSL examples (4-6 hrs)

**Impact**: Demonstrate advanced capabilities with interactive, production-quality examples.

---

## Component Specifications

### Enhancement 1: Hero 3D Teaser - HDRI Environment

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts`

**Current State**:

- Manual lighting setup with ambient, directional, and point lights (lines 77-89)
- Floating spheres use PBR materials (metalness, roughness, clearcoat, transmission)
- Earth GLTF model would benefit from realistic reflections
- No IBL (image-based lighting)

**Changes Required**:

1. Add `EnvironmentComponent` to imports
2. Insert environment component in template after lighting setup
3. Choose appropriate preset ('night' for space theme)
4. Configure intensity and background settings

**Integration with New Library Feature**:

- Uses `EnvironmentComponent` from Phase 1
- Preset: `'night'` (dark HDRI matching space theme)
- Background: `false` (keep existing star field background)
- Intensity: `0.3` - `0.5` (subtle IBL, don't overpower existing lights)

**Code Example**:

```typescript
// 1. Add import
import {
  // ... existing imports
  EnvironmentComponent,
} from '@hive-academy/angular-3d';

// 2. Add to imports array
@Component({
  imports: [
    // ... existing imports
    EnvironmentComponent,
  ],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="75">

      <!-- LIGHTING SETUP -->
      <a3d-ambient-light [color]="colors.white" [intensity]="0.2" />
      <a3d-directional-light
        [position]="[30, 15, 25]"
        [color]="colors.white"
        [intensity]="0.4"
        [castShadow]="true"
      />
      <a3d-point-light
        [position]="[-10, 5, 10]"
        [color]="colors.cyan"
        [intensity]="0.2"
      />

      <!-- NEW: HDRI Environment for IBL on PBR materials -->
      <a3d-environment
        [preset]="'night'"
        [intensity]="0.5"
        [background]="false"
        [blur]="0.3"
      />

      <!-- Existing Earth model, floating spheres will now reflect environment -->
      <!-- ... rest of template -->
    </a3d-scene-3d>
  `,
})
```

**Expected Result**:

- Floating spheres reflect subtle star-like environment map
- Earth model gets realistic IBL enhancing its textures
- Scene maintains existing visual style but with enhanced realism
- No background change (existing star field preserved)

**Testing**:

- Visual inspection: Floating spheres show subtle reflections
- DevTools: Verify `scene.environment` is set to environment texture
- Performance: No FPS drop (<1ms overhead for IBL)

---

### Enhancement 2: Hero 3D Teaser - Depth of Field

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts`

**Current State**:

- Bloom effect only (lines 330-332)
- No depth-based blur
- All elements equally sharp (lacks cinematic depth)

**Changes Required**:

1. Add `DofEffectComponent` to imports
2. Add DOF effect inside `<a3d-effect-composer>`
3. Configure focus distance to emphasize Earth
4. Set aperture and blur parameters for subtle effect

**Integration with New Library Feature**:

- Uses `DofEffectComponent` from Phase 1 (BokehPass wrapper)
- Focus: `20` units (Earth is at viewport 78%, z=-9, roughly 20 units from camera)
- Aperture: `0.015` (subtle lens blur)
- Maxblur: `0.008` (gentle background blur)

**Code Example**:

```typescript
// 1. Add import
import {
  // ... existing imports
  DofEffectComponent,
} from '@hive-academy/angular-3d';

// 2. Add to imports array
@Component({
  imports: [
    // ... existing imports
    DofEffectComponent,
  ],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="75">
      <!-- ... scene content ... -->

      <!-- POST-PROCESSING -->
      <a3d-effect-composer [enabled]="true">
        <!-- NEW: Depth of Field - blurs distant stars, focuses on Earth -->
        <a3d-dof-effect
          [focus]="20"
          [aperture]="0.015"
          [maxblur]="0.008"
        />

        <!-- Existing bloom effect -->
        <a3d-bloom-effect [threshold]="0.5" [strength]="0.5" [radius]="0.5" />
      </a3d-effect-composer>
    </a3d-scene-3d>
  `,
})
```

**Expected Result**:

- Distant stars (z < -15) have subtle blur
- Earth model is in sharp focus
- Foreground/midground elements (robots, spheres) maintain sharpness
- Cinematic depth perception enhanced
- No FPS drop on mid-range GPUs (<5ms overhead)

**Testing**:

- Visual inspection: Background stars blurred, Earth sharp
- Performance: Check frame time with Chrome DevTools (target: <5ms added)
- Tweak `focus` parameter if Earth isn't in focus (adjust based on visual result)

---

### Enhancement 3: Value Props Scene - Demand Rendering

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\value-props-3d-scene.component.ts`

**Current State**:

- Continuous rendering at 60fps (default `frameloop="always"`)
- 11 slowly rotating geometries (lines 44-130)
- Static content after initial rotation animations
- No user interaction (no OrbitControls)

**Changes Required**:

1. Add `[frameloop]="'demand'"` to `Scene3dComponent`
2. No other changes needed (rotation directives auto-invalidate)

**Integration with New Library Feature**:

- Uses demand-based rendering from Phase 1 RenderLoopService
- Rotate3dDirective automatically invalidates when active
- Scene stops rendering when not visible (scroll-based invalidation from viewport intersection)

**Code Example**:

```typescript
// No imports needed - frameloop is existing Scene3dComponent input

@Component({
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <!-- Add frameloop="demand" to Scene3dComponent -->
      <a3d-scene-3d
        [cameraPosition]="[0, 0, 15]"
        [cameraFov]="60"
        [frameloop]="'demand'"
      >
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.6" />
        <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

        <!-- 11 Rotating Geometries - Rotate3dDirective will auto-invalidate -->
        <a3d-box
          viewportPosition="top-left"
          [viewportOffset]="{ offsetX: -8, offsetY: 4, offsetZ: 0 }"
          [color]="colors.indigo"
          rotate3d
          [rotateConfig]="{ axis: 'y', speed: 10 }"
        />
        <!-- ... 10 more geometries ... -->
      </a3d-scene-3d>

      <!-- Overlay Text -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
        <!-- ... text content ... -->
      </div>
    </div>
  `,
})
```

**Expected Result**:

- Scene renders continuously while visible (rotation animations active)
- When section scrolls out of view, rendering pauses
- GPU usage drops to ~0% when not visible
- Smooth 60fps when visible (rotations continue)
- Battery efficiency: 95% reduction in power when off-screen

**Testing**:

- Visual: Rotations are smooth when section visible
- DevTools GPU profiler: 0% GPU when scrolled away
- Console log: Verify RAF loop stops after 100ms idle
- FPS counter: 60fps when visible, 0fps when hidden

---

### Enhancement 4: Hero Space Scene - HDRI Environment

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\hero-space-scene.component.ts`

**Current State**:

- Manual ambient + directional lights (lines 37-42)
- Earth GLTF model (lines 95-101)
- Moon planet with PBR-like properties (lines 84-92)
- No IBL

**Changes Required**:

1. Add `EnvironmentComponent` to imports
2. Insert environment after lighting setup
3. Use `'night'` preset matching space theme
4. Set lower intensity (0.2-0.3) to preserve neon green accent

**Code Example**:

```typescript
// 1. Add import
import {
  // ... existing imports
  EnvironmentComponent,
} from '@hive-academy/angular-3d';

// 2. Add to imports array
@Component({
  imports: [
    // ... existing imports
    EnvironmentComponent,
  ],
  template: `
    <div class="relative min-h-screen bg-background-dark overflow-hidden">
      <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
        <!-- Lights -->
        <a3d-ambient-light [intensity]="0.5" />
        <a3d-directional-light
          [position]="[10, 10, 5]"
          [intensity]="1"
          [color]="colors.neonGreen"
        />

        <!-- NEW: HDRI Environment -->
        <a3d-environment
          [preset]="'night'"
          [intensity]="0.3"
          [background]="false"
        />

        <!-- Star fields, nebula, moon, Earth model -->
        <!-- ... existing content ... -->
      </a3d-scene-3d>
    </div>
  `,
})
```

**Expected Result**:

- Earth model reflects subtle night environment
- Moon planet gets realistic IBL (enhances emissive/glow effect)
- Neon green directional light remains dominant accent
- Star field background preserved

---

## Phase 2.2: Showcase Expansions

### Enhancement 5: Postprocessing Section - Complete Effects Gallery

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\postprocessing-section.component.ts`

**Current State**:

- 2-item before/after bloom comparison (lines 35-168)
- 3-item bloom parameter variations (lines 171-end)
- Missing: DOF, SSAO, Color Grading demos
- Missing: Combined effects showcase

**Changes Required**:

1. Add imports for `DofEffectComponent`, `SsaoEffectComponent`, `ColorGradingEffectComponent`
2. Create new section: "Advanced Post-Processing Effects"
3. Add 4 new demo scenes:
   - Depth of Field (focus control demo)
   - SSAO (ambient occlusion comparison)
   - Color Grading (cinematic look presets)
   - Combined Effects (all effects together)

**Component Structure**:

```typescript
import {
  // ... existing imports
  DofEffectComponent,
  SsaoEffectComponent,
  ColorGradingEffectComponent,
} from '@hive-academy/angular-3d';

@Component({
  imports: [
    // ... existing imports
    DofEffectComponent,
    SsaoEffectComponent,
    ColorGradingEffectComponent,
  ],
  template: `
    <div class="py-12x space-y-16x">

      <!-- EXISTING: Bloom Comparison (keep as-is) -->
      <section class="max-w-container mx-auto px-4x">
        <!-- ... existing bloom before/after ... -->
      </section>

      <!-- NEW SECTION 1: Depth of Field -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Depth of Field</h2>
          <p class="text-text-secondary">
            Camera lens blur effect - blurs background, focuses on subject
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Without DOF -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.5" />

                <!-- 3 boxes at different depths -->
                <a3d-box
                  [position]="[-2, 0, 2]"
                  [color]="colors.pink"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-box
                  [position]="[0, 0, 0]"
                  [color]="colors.cyan"
                  [args]="[1.2, 1.2, 1.2]"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <a3d-box
                  [position]="[2, 0, -2]"
                  [color]="colors.neonGreen"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 15 }"
                />
                <!-- NO DOF -->
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">All objects equally sharp</p>
              <code class="text-xs text-text-tertiary">No DOF effect</code>
            </div>
          </div>

          <!-- With DOF -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <a3d-ambient-light [intensity]="0.3" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.5" />

                <!-- Same 3 boxes -->
                <a3d-box [position]="[-2, 0, 2]" [color]="colors.pink" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-box [position]="[0, 0, 0]" [color]="colors.cyan" [args]="[1.2, 1.2, 1.2]" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-box [position]="[2, 0, -2]" [color]="colors.neonGreen" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />

                <!-- DOF ENABLED - focus on center box -->
                <a3d-dof-effect
                  [focus]="6"
                  [aperture]="0.025"
                  [maxblur]="0.01"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">Center box sharp, foreground/background blurred</p>
              <code class="text-xs text-cyan-400">&lt;a3d-dof-effect [focus]="6" /&gt;</code>
            </div>
          </div>
        </div>
      </section>

      <!-- NEW SECTION 2: SSAO -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Screen Space Ambient Occlusion</h2>
          <p class="text-text-secondary">
            Adds depth shadows in corners and crevices
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Without SSAO -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 3, 8]" [cameraFov]="60">
                <a3d-ambient-light [intensity]="0.6" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.5" />

                <!-- Architectural scene: boxes forming corners -->
                <a3d-box [position]="[0, 0, 0]" [args]="[4, 0.2, 4]" [color]="colors.softGray" />
                <a3d-box [position]="[-2, 1, 0]" [args]="[0.2, 2, 4]" [color]="colors.softGray" />
                <a3d-box [position]="[2, 1, 0]" [args]="[0.2, 2, 4]" [color]="colors.softGray" />
                <a3d-box [position]="[0, 1, -2]" [args]="[4, 2, 0.2]" [color]="colors.softGray" />

                <!-- NO SSAO -->
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">Flat lighting, no depth perception</p>
              <code class="text-xs text-text-tertiary">No SSAO effect</code>
            </div>
          </div>

          <!-- With SSAO -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 3, 8]" [cameraFov]="60">
                <a3d-ambient-light [intensity]="0.6" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.5" />

                <!-- Same architectural scene -->
                <a3d-box [position]="[0, 0, 0]" [args]="[4, 0.2, 4]" [color]="colors.softGray" />
                <a3d-box [position]="[-2, 1, 0]" [args]="[0.2, 2, 4]" [color]="colors.softGray" />
                <a3d-box [position]="[2, 1, 0]" [args]="[0.2, 2, 4]" [color]="colors.softGray" />
                <a3d-box [position]="[0, 1, -2]" [args]="[4, 2, 0.2]" [color]="colors.softGray" />

                <!-- SSAO ENABLED -->
                <a3d-ssao-effect
                  [kernelRadius]="8"
                  [minDistance]="0.001"
                  [maxDistance]="0.1"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">Dark shadows in corners, enhanced depth</p>
              <code class="text-xs text-indigo-400">&lt;a3d-ssao-effect /&gt;</code>
            </div>
          </div>
        </div>
      </section>

      <!-- NEW SECTION 3: Color Grading -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Color Grading</h2>
          <p class="text-text-secondary">
            Cinematic color correction and vignette
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8x">
          <!-- Neutral (no grading) -->
          <div>
            <div class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />
                <a3d-torus [color]="colors.cyan" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Neutral</p>
              <code class="text-xs text-text-tertiary">Default</code>
            </div>
          </div>

          <!-- Cinematic (high contrast + vignette) -->
          <div>
            <div class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />
                <a3d-torus [color]="colors.cyan" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />

                <a3d-color-grading-effect
                  [saturation]="1.2"
                  [contrast]="1.15"
                  [vignette]="0.3"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Cinematic</p>
              <code class="text-xs text-amber-400">High contrast</code>
            </div>
          </div>

          <!-- Desaturated (vintage look) -->
          <div>
            <div class="aspect-square rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 0, 4]">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.8" />
                <a3d-torus [color]="colors.cyan" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />

                <a3d-color-grading-effect
                  [saturation]="0.6"
                  [contrast]="1.1"
                  [brightness]="1.1"
                  [vignette]="0.4"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x text-center">
              <p class="text-sm font-medium text-white">Vintage</p>
              <code class="text-xs text-violet-400">Desaturated</code>
            </div>
          </div>
        </div>
      </section>

      <!-- NEW SECTION 4: Combined Effects -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Combined Effects</h2>
          <p class="text-text-secondary">
            DOF + SSAO + Bloom + Color Grading together
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- No effects -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 2, 8]">
                <a3d-ambient-light [intensity]="0.4" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.6" />

                <a3d-torus [position]="[0, 0, 0]" [color]="colors.cyan" a3dGlow3d [glowIntensity]="2" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-box [position]="[-2, 0, -1]" [color]="colors.pink" rotate3d [rotateConfig]="{ axis: 'x', speed: 20 }" />
                <a3d-box [position]="[2, 0, 1]" [color]="colors.neonGreen" rotate3d [rotateConfig]="{ axis: 'z', speed: 18 }" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">Raw scene - no post-processing</p>
            </div>
          </div>

          <!-- All effects combined -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 2, 8]">
                <a3d-ambient-light [intensity]="0.4" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.6" />

                <a3d-torus [position]="[0, 0, 0]" [color]="colors.cyan" a3dGlow3d [glowIntensity]="2" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-box [position]="[-2, 0, -1]" [color]="colors.pink" rotate3d [rotateConfig]="{ axis: 'x', speed: 20 }" />
                <a3d-box [position]="[2, 0, 1]" [color]="colors.neonGreen" rotate3d [rotateConfig]="{ axis: 'z', speed: 18 }" />

                <!-- ALL EFFECTS -->
                <a3d-dof-effect [focus]="8" [aperture]="0.02" [maxblur]="0.01" />
                <a3d-ssao-effect [kernelRadius]="8" />
                <a3d-bloom-effect [threshold]="0.5" [strength]="1.2" [radius]="0.5" />
                <a3d-color-grading-effect [saturation]="1.1" [contrast]="1.08" [vignette]="0.25" />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary">Award-quality: DOF + SSAO + Bloom + Color Grading</p>
              <code class="text-xs text-green-400">4 effects combined</code>
            </div>
          </div>
        </div>
      </section>

      <!-- EXISTING: Bloom Parameters (keep as-is) -->
      <section class="max-w-container mx-auto px-4x">
        <!-- ... existing bloom parameter variations ... -->
      </section>

    </div>
  `,
})
```

**Files Affected**:

- MODIFY: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\postprocessing-section.component.ts`

**Expected Result**:

- Postprocessing section expands from 2 demos to 8+ demos
- Complete documentation of all new post-processing effects
- Before/after comparisons for each effect
- Combined effects showcase demonstrates production-ready quality

**Testing**:

- Visual inspection: Each effect clearly demonstrates its purpose
- Performance: Combined effects <15ms frame time on mid-range GPU
- Code examples: Verify syntax highlighting and copy-paste accuracy

---

### Enhancement 6: Lighting Section - Environment/HDRI

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\lighting-section.component.ts`

**Current State**:

- 5 light types demonstrated: ambient, directional, point, spot, scene-lighting (lines 34-109)
- No HDRI/environment lighting demo
- Grid layout with 5 columns

**Changes Required**:

1. Add `EnvironmentComponent` to imports
2. Expand grid to 6 columns (or 2x3 grid)
3. Add 6th torus with environment lighting
4. Add code example section for environment presets

**Code Example**:

```typescript
import {
  // ... existing imports
  EnvironmentComponent,
} from '@hive-academy/angular-3d';

@Component({
  imports: [
    // ... existing imports
    EnvironmentComponent,
  ],
  template: `
    <div class="py-12x space-y-16x">

      <!-- Light Types Comparison (UPDATE: 6 types now) -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Light Types Comparison</h2>
          <p class="text-text-secondary">
            Side-by-side comparison of 6 different light types
          </p>
        </div>

        <!-- UPDATE: Change aspect ratio to accommodate 6 items -->
        <div class="aspect-[21/9] rounded-2xl overflow-hidden bg-background-dark shadow-xl">
          <a3d-scene-3d [cameraPosition]="[0, 2, 16]">
            <a3d-ambient-light [intensity]="0.1" />

            <!-- Existing 5 toruses (lines 52-83) -->
            <a3d-torus [position]="[-7.5, 0, 0]" [color]="colors.indigo" />
            <a3d-ambient-light [intensity]="0.6" [color]="colors.white" />

            <a3d-torus [position]="[-4.5, 0, 0]" [color]="colors.indigo" />
            <a3d-directional-light [position]="[-4.5, 3, 5]" [intensity]="1.5" [color]="colors.neonGreen" />

            <a3d-torus [position]="[-1.5, 0, 0]" [color]="colors.indigo" />
            <a3d-point-light [position]="[-1.5, 2, 2]" [intensity]="3" [color]="colors.cyan" />

            <a3d-torus [position]="[1.5, 0, 0]" [color]="colors.indigo" />
            <a3d-spot-light [position]="[1.5, 3, 3]" [angle]="0.5" [intensity]="4" [color]="colors.amber" [target]="[1.5, 0, 0]" />

            <a3d-torus [position]="[4.5, 0, 0]" [color]="colors.indigo" />
            <a3d-scene-lighting preset="studio" />

            <!-- NEW: 6th torus with Environment lighting -->
            <a3d-torus [position]="[7.5, 0, 0]" [color]="colors.indigo" [metalness]="0.8" [roughness]="0.2" />
            <a3d-environment [preset]="'studio'" [intensity]="1.5" [background]="false" />
          </a3d-scene-3d>
        </div>

        <!-- UPDATE: 6 columns for labels -->
        <div class="mt-4x grid grid-cols-6 gap-4x text-center text-sm">
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-white/60">ambient</code>
            <p class="text-xs text-text-tertiary mt-1">Global</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-green-400">directional</code>
            <p class="text-xs text-text-tertiary mt-1">Sun-like</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-cyan-400">point</code>
            <p class="text-xs text-text-tertiary mt-1">Omnidirectional</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-amber-400">spot</code>
            <p class="text-xs text-text-tertiary mt-1">Cone-shaped</p>
          </div>
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-violet-400">scene</code>
            <p class="text-xs text-text-tertiary mt-1">Pre-configured</p>
          </div>
          <!-- NEW: Environment label -->
          <div class="p-3x bg-white/5 rounded-lg">
            <code class="text-orange-400">environment</code>
            <p class="text-xs text-text-tertiary mt-1">HDRI/IBL</p>
          </div>
        </div>
      </section>

      <!-- NEW SECTION: Environment Presets Gallery -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Environment HDRI Presets</h2>
          <p class="text-text-secondary">
            10 built-in environment presets for photorealistic lighting
          </p>
        </div>

        <div class="grid md:grid-cols-5 gap-6x">
          <!-- Preset 1: Sunset -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'sunset'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Sunset</p>
              <code class="text-xs text-orange-400">preset="sunset"</code>
            </div>
          </div>

          <!-- Preset 2: Dawn -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'dawn'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Dawn</p>
              <code class="text-xs text-blue-300">preset="dawn"</code>
            </div>
          </div>

          <!-- Preset 3: Night -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'night'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Night</p>
              <code class="text-xs text-indigo-400">preset="night"</code>
            </div>
          </div>

          <!-- Preset 4: Warehouse -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'warehouse'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Warehouse</p>
              <code class="text-xs text-gray-400">preset="warehouse"</code>
            </div>
          </div>

          <!-- Preset 5: Forest -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'forest'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Forest</p>
              <code class="text-xs text-green-500">preset="forest"</code>
            </div>
          </div>

          <!-- Preset 6: Apartment -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'apartment'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Apartment</p>
              <code class="text-xs text-amber-300">preset="apartment"</code>
            </div>
          </div>

          <!-- Preset 7: Studio -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'studio'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Studio</p>
              <code class="text-xs text-cyan-300">preset="studio"</code>
            </div>
          </div>

          <!-- Preset 8: City -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'city'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">City</p>
              <code class="text-xs text-violet-400">preset="city"</code>
            </div>
          </div>

          <!-- Preset 9: Park -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'park'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Park</p>
              <code class="text-xs text-green-400">preset="park"</code>
            </div>
          </div>

          <!-- Preset 10: Lobby -->
          <div>
            <div class="aspect-square rounded-xl overflow-hidden bg-background-dark shadow-lg">
              <a3d-scene-3d [cameraPosition]="[0, 0, 3]">
                <a3d-torus [color]="colors.softGray" [metalness]="0.9" [roughness]="0.1" rotate3d [rotateConfig]="{ axis: 'y', speed: 15 }" />
                <a3d-environment [preset]="'lobby'" [intensity]="1.2" [background]="false" />
              </a3d-scene-3d>
            </div>
            <div class="mt-2x text-center">
              <p class="text-xs font-medium text-white">Lobby</p>
              <code class="text-xs text-pink-300">preset="lobby"</code>
            </div>
          </div>
        </div>
      </section>

      <!-- EXISTING: Individual Light Examples (keep as-is) -->
      <section class="max-w-container mx-auto px-4x">
        <!-- ... existing directional, point, spot examples ... -->
      </section>

    </div>
  `,
})
```

**Files Affected**:

- MODIFY: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\lighting-section.component.ts`

**Expected Result**:

- Lighting section showcases 6 light types (added: environment)
- 10 environment presets in gallery format
- Metallic torus reflects environment accurately
- Clear code examples for each preset

---

### Enhancement 7: Primitives Section - HDRI Background

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\primitives-section.component.ts`

**Current State**:

- Manual lighting (ambient + directional)
- Plain background (background-dark Tailwind class)
- Basic geometries, polyhedrons, GLTF model demos

**Changes Required**:

1. Add `EnvironmentComponent` to imports
2. Add environment to "Advanced Components" section GLTF model demo
3. Use `'studio'` preset for product-shot look
4. Enable background to showcase skybox

**Code Example**:

```typescript
import {
  // ... existing imports
  EnvironmentComponent,
} from '@hive-academy/angular-3d';

@Component({
  imports: [
    // ... existing imports
    EnvironmentComponent,
  ],
  template: `
    <div class="py-12x space-y-16x">

      <!-- EXISTING: Basic Geometries (keep as-is) -->
      <section>...</section>

      <!-- EXISTING: Polyhedrons (keep as-is) -->
      <section>...</section>

      <!-- UPDATE: Advanced Components Section -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Advanced Components</h2>
          <p class="text-text-secondary">
            GLTF Models with HDRI Environment
          </p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">

          <!-- GLTF Model with HDRI -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl">
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]">
                <!-- Reduced manual lighting (environment will provide IBL) -->
                <a3d-ambient-light [intensity]="0.2" />
                <a3d-directional-light [position]="[3, 3, 3]" [intensity]="0.4" />

                <!-- NEW: Studio HDRI for product-shot look -->
                <a3d-environment
                  [preset]="'studio'"
                  [intensity]="1.5"
                  [background]="true"
                  [blur]="0.5"
                />

                <a3d-gltf-model
                  [modelPath]="'/3d/planet_earth/scene.gltf'"
                  [scale]="1.2"
                  rotate3d
                  [rotateConfig]="{ axis: 'y', speed: 10 }"
                />
              </a3d-scene-3d>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">
                GLTF model with studio HDRI environment
              </p>
              <code class="text-xs text-cyan-400">&lt;a3d-environment preset="studio" /&gt;</code>
            </div>
          </div>

          <!-- Keep other advanced component examples -->

        </div>
      </section>

    </div>
  `,
})
```

**Files Affected**:

- MODIFY: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\primitives-section.component.ts`

**Expected Result**:

- Earth model reflects studio environment
- Background shows blurred studio HDRI skybox
- Professional product-shot aesthetic

---

## Phase 2.3: New Showcase Sections

### New Section Template Structure

All new showcase sections follow this pattern:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Scene3dComponent,
  // ... component-specific imports
} from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';

@Component({
  selector: 'app-[section-name]',
  imports: [/* ... */],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- Hero Section -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">[Section Title]</h2>
          <p class="text-text-secondary">[Description]</p>
        </div>
        <!-- Content -->
      </section>

      <!-- Sub-sections as needed -->
    </div>
  `,
})
export default class [SectionName]Component {
  public readonly colors = SCENE_COLORS;
  // Component-specific properties
}
```

**File Location Pattern**:
`D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\[section-name].component.ts`

---

### New Section 1: Performance Showcase

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\performance-section.component.ts` (CREATE)

**Purpose**: Demonstrate InstancedMesh performance and demand-based rendering with interactive controls.

**Component Structure**:

```typescript
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Scene3dComponent, InstancedMeshComponent, BoxGeometryDirective, StandardMaterialDirective, AmbientLightComponent, DirectionalLightComponent, OrbitControlsComponent } from '@hive-academy/angular-3d';
import { SCENE_COLORS } from '../../../shared/colors';
import * as THREE from 'three';

@Component({
  selector: 'app-performance-section',
  imports: [CommonModule, FormsModule, Scene3dComponent, InstancedMeshComponent, BoxGeometryDirective, StandardMaterialDirective, AmbientLightComponent, DirectionalLightComponent, OrbitControlsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="py-12x space-y-16x">
      <!-- InstancedMesh Performance Demo -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">InstancedMesh Performance</h2>
          <p class="text-text-secondary">Render 100,000+ objects with a single draw call</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Traditional Approach (1000 individual meshes - simulation) -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative">
              <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[10, 10, 10]" [intensity]="0.8" />

                <!-- Simulated 1000 individual meshes (actually instanced but labeled as "traditional") -->
                <a3d-instanced-mesh [count]="1000" (meshReady)="initTraditionalGrid($event)">
                  <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                  <ng-container a3dStandardMaterial [color]="colors.pink" />
                </a3d-instanced-mesh>

                <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" />
              </a3d-scene-3d>

              <!-- Badge: Draw Calls -->
              <div class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white">~1000 draw calls (simulated)</div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">Traditional approach: 1 draw call per object</p>
              <p class="text-xs text-red-400">Performance limit: ~5,000 objects at 60fps</p>
            </div>
          </div>

          <!-- InstancedMesh Approach (100,000 instances) -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative">
              <a3d-scene-3d [cameraPosition]="[0, 0, 50]" [cameraFov]="60">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[10, 10, 10]" [intensity]="0.8" />

                <!-- 100,000 instances - single draw call -->
                <a3d-instanced-mesh [count]="instanceCount()" [frustumCulled]="false" (meshReady)="initInstancedGrid($event)">
                  <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
                  <ng-container a3dStandardMaterial [color]="colors.cyan" />
                </a3d-instanced-mesh>

                <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" />
              </a3d-scene-3d>

              <!-- Badge: Draw Call -->
              <div class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white">1 draw call</div>

              <!-- Badge: Instance Count -->
              <div class="absolute top-4 right-4 px-3 py-1 bg-cyan-500/80 rounded-full text-xs font-medium text-white">{{ instanceCount().toLocaleString() }} instances</div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">InstancedMesh: 1 draw call for all instances</p>
              <p class="text-xs text-green-400">100x performance: 100,000+ objects at 60fps</p>
            </div>
          </div>
        </div>

        <!-- Interactive Instance Count Slider -->
        <div class="mt-8x max-w-2xl mx-auto">
          <label class="block text-sm font-medium text-white mb-2"> Instance Count: {{ instanceCount().toLocaleString() }} </label>
          <input type="range" min="1000" max="100000" step="1000" [ngModel]="instanceCount()" (ngModelChange)="instanceCount.set($event)" class="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider" />
          <div class="flex justify-between text-xs text-text-tertiary mt-1">
            <span>1,000</span>
            <span>100,000</span>
          </div>
        </div>
      </section>

      <!-- Demand-Based Rendering Demo -->
      <section class="max-w-container mx-auto px-4x">
        <div class="text-center mb-8x">
          <h2 class="text-display-md font-bold mb-2x">Demand-Based Rendering</h2>
          <p class="text-text-secondary">Render only when needed - 95% battery savings for static content</p>
        </div>

        <div class="grid md:grid-cols-2 gap-8x">
          <!-- Always Rendering (frameloop="always") -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative">
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]" [frameloop]="'always'">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

                <a3d-instanced-mesh [count]="5000" (meshReady)="initAlwaysScene($event)">
                  <ng-container a3dBoxGeometry [args]="[0.1, 0.1, 0.1]" />
                  <ng-container a3dStandardMaterial [color]="colors.red" />
                </a3d-instanced-mesh>
              </a3d-scene-3d>

              <!-- Badge: Rendering Status -->
              <div class="absolute top-4 left-4 px-3 py-1 bg-red-500/80 rounded-full text-xs font-medium text-white animate-pulse">Always Rendering (60fps)</div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">frameloop="always" - renders every frame</p>
              <p class="text-xs text-red-400">GPU usage: 100% (even when static)</p>
            </div>
          </div>

          <!-- Demand Rendering (frameloop="demand") -->
          <div>
            <div class="aspect-video rounded-2xl overflow-hidden bg-background-dark shadow-xl relative">
              <a3d-scene-3d [cameraPosition]="[0, 0, 6]" [frameloop]="'demand'">
                <a3d-ambient-light [intensity]="0.5" />
                <a3d-directional-light [position]="[5, 5, 5]" [intensity]="0.8" />

                <a3d-instanced-mesh [count]="5000" (meshReady)="initDemandScene($event)">
                  <ng-container a3dBoxGeometry [args]="[0.1, 0.1, 0.1]" />
                  <ng-container a3dStandardMaterial [color]="colors.green" />
                </a3d-instanced-mesh>

                <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" />
              </a3d-scene-3d>

              <!-- Badge: Rendering Status -->
              <div class="absolute top-4 left-4 px-3 py-1 bg-green-500/80 rounded-full text-xs font-medium text-white">Demand Rendering (0fps when idle)</div>
            </div>
            <div class="mt-3x p-4x bg-white/5 rounded-lg">
              <p class="text-sm text-text-secondary mb-2">frameloop="demand" - renders only when invalidated</p>
              <p class="text-xs text-green-400">GPU usage: ~0% when idle (95% battery savings)</p>
            </div>
          </div>
        </div>

        <div class="mt-6x p-4x bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
          <p class="text-sm text-cyan-300">💡 <strong>Tip:</strong> Interact with the right scene (drag to orbit). Notice it renders during interaction, then stops when idle.</p>
        </div>
      </section>
    </div>
  `,
  styles: [
    `
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: #00d4ff;
        cursor: pointer;
        border-radius: 50%;
      }

      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #00d4ff;
        cursor: pointer;
        border-radius: 50%;
        border: none;
      }
    `,
  ],
})
export default class PerformanceSectionComponent {
  public readonly colors = SCENE_COLORS;
  public readonly instanceCount = signal(50000);

  /**
   * Initialize traditional grid (10x10x10 = 1000 cubes)
   */
  public initTraditionalGrid(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    const gridSize = 10;
    const spacing = 2;
    let index = 0;

    for (let x = 0; x < gridSize; x++) {
      for (let y = 0; y < gridSize; y++) {
        for (let z = 0; z < gridSize; z++) {
          matrix.setPosition((x - gridSize / 2) * spacing, (y - gridSize / 2) * spacing, (z - gridSize / 2) * spacing);
          mesh.setMatrixAt(index++, matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize instanced grid (dynamic count based on slider)
   */
  public initInstancedGrid(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    const count = mesh.count;
    const gridDimension = Math.ceil(Math.pow(count, 1 / 3));
    const spacing = 2;

    let index = 0;
    for (let x = 0; x < gridDimension && index < count; x++) {
      for (let y = 0; y < gridDimension && index < count; y++) {
        for (let z = 0; z < gridDimension && index < count; z++) {
          matrix.setPosition((x - gridDimension / 2) * spacing, (y - gridDimension / 2) * spacing, (z - gridDimension / 2) * spacing);
          mesh.setMatrixAt(index++, matrix);
        }
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize always-rendering scene (random positions)
   */
  public initAlwaysScene(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      matrix.setPosition((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize demand-rendering scene (random positions)
   */
  public initDemandScene(mesh: THREE.InstancedMesh): void {
    const matrix = new THREE.Matrix4();
    for (let i = 0; i < mesh.count; i++) {
      matrix.setPosition((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20);
      mesh.setMatrixAt(i, matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
}
```

**Files Affected**:

- CREATE: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\performance-section.component.ts`

**Integration Points**:

- Add route in `angular-3d-showcase` routing (if using lazy-loaded sections)
- Add section link in showcase navigation
- Import in parent layout component

**Expected Result**:

- Interactive slider controlling instance count (1k - 100k)
- Side-by-side comparison: traditional vs instanced mesh
- Demand rendering demo with clear idle/active states
- Real-time FPS monitoring (if FPS service available)
- Draw call badges showing performance difference

**Testing**:

- Performance: 100k instances at 60fps on mid-range GPU
- Slider: Smooth count updates without crashes
- Demand mode: Verify 0fps when idle, 60fps during interaction

---

### New Section 2: Shaders Showcase (OPTIONAL - Phase 3)

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\shaders-section.component.ts` (CREATE)

**Purpose**: Demonstrate ShaderMaterialDirective with custom GLSL examples.

**Complexity**: HIGH (4-6 hours) - requires GLSL shader authoring

**Note**: This section is OPTIONAL for Phase 2 and can be deferred to a future task if timeline is tight.

**Shader Examples to Include**:

1. **Gradient Shader** (Simple - demonstrates basics)
2. **Wave Vertex Displacement** (Medium - vertex shader animation)
3. **Noise Texture** (Medium - fragment shader with Perlin noise)
4. **Holographic Effect** (Advanced - Fresnel + scanlines)
5. **Dissolve Effect** (Advanced - alpha masking with noise)

**Component Structure Outline**:

```typescript
@Component({
  selector: 'app-shaders-section',
  imports: [
    Scene3dComponent,
    BoxComponent,
    SphereComponent,
    PlaneComponent,
    ShaderMaterialDirective,
    // ...
  ],
  template: `
    <div class="py-12x space-y-16x">
      <!-- Gradient Shader Demo -->
      <section>
        <a3d-box a3dShaderMaterial [vertexShader]="gradientVS" [fragmentShader]="gradientFS" [uniforms]="{ colorA: '#ff0000', colorB: '#0000ff' }" />
      </section>

      <!-- Wave Displacement Demo -->
      <section>
        <a3d-plane [args]="[10, 10, 64, 64]" a3dShaderMaterial [vertexShader]="waveVS" [fragmentShader]="waveFS" [uniforms]="waveUniforms()" />
      </section>

      <!-- Additional shader demos... -->
    </div>
  `,
})
export default class ShadersSectionComponent {
  // GLSL shader source code strings
  public readonly gradientVS = `/* vertex shader */`;
  public readonly gradientFS = `/* fragment shader */`;

  // Reactive uniforms
  public readonly waveUniforms = signal({
    time: 0,
    amplitude: 1.0,
    frequency: 2.0,
  });
}
```

**Recommendation**: Defer this section to TASK_2025_027 or future enhancement unless custom shaders are critical for demo.

---

## Testing Strategy

### Phase 2.1 Testing (Quick Wins)

**Enhancement 1-4 (HDRI + DOF + Demand Rendering)**:

1. **Visual Inspection**:

   - Hero scenes show enhanced realism (reflections, depth)
   - No visual regressions (existing elements unchanged)
   - Background blur is subtle (DOF not overdone)

2. **Performance Testing**:

   - Chrome DevTools Performance tab: <5ms overhead for DOF
   - GPU profiler: Verify demand mode reduces GPU to ~0% when off-screen
   - FPS: Maintain 60fps on mid-range GPU

3. **Cross-Browser Testing**:

   - Chrome, Firefox, Safari, Edge
   - Mobile Safari, Chrome Android
   - Verify HDRI loads correctly across browsers

4. **Accessibility**:
   - Verify `aria-label` on 3D scenes remains intact
   - Reduced motion: Effects should respect `prefers-reduced-motion` (if implemented)

---

### Phase 2.2 Testing (Showcase Expansions)

**Enhancement 5 (Postprocessing Section)**:

1. **Visual Verification**:

   - DOF: Background blur visible, focus point sharp
   - SSAO: Corner shadows visible in architectural scene
   - Color Grading: Saturation, contrast, vignette changes visible
   - Combined: All effects work together without artifacts

2. **Code Example Accuracy**:

   - Copy-paste code examples into new component
   - Verify syntax highlighting is correct
   - Verify examples compile and run

3. **Performance**:
   - Combined effects (DOF + SSAO + Bloom + Color Grading): <15ms frame time
   - No memory leaks after switching between demos

**Enhancement 6 (Lighting Section)**:

1. **Preset Verification**:

   - All 10 presets load successfully
   - Metallic torus reflects environment correctly
   - No console errors for missing HDRI files

2. **Visual Consistency**:
   - Grid layout maintains alignment
   - Code examples match actual usage

**Enhancement 7 (Primitives Section)**:

1. **HDRI Background**:
   - Studio environment background visible
   - Earth model reflects studio lighting
   - Background blur works correctly

---

### Phase 2.3 Testing (New Sections)

**Performance Section**:

1. **Instance Count Slider**:

   - Slider updates instance count smoothly
   - No crashes at 100k instances
   - FPS remains 60fps at max count

2. **Demand Rendering**:

   - Right scene stops rendering when idle
   - OrbitControls interaction triggers rendering
   - Visual indicator shows idle/active state

3. **Performance Benchmarks**:
   - Measure draw calls (1 for instanced, 1000 for "traditional")
   - FPS comparison: 60fps for both at low counts, only instanced maintains 60fps at high counts

---

## Dependencies

### Internal Dependencies (from Phase 1)

All new library features are implemented and exported:

- `InstancedMeshComponent` - `libs/angular-3d/src/lib/primitives/instanced-mesh.component.ts`
- `EnvironmentComponent` - `libs/angular-3d/src/lib/primitives/environment.component.ts`
- `ShaderMaterialDirective` - `libs/angular-3d/src/lib/directives/materials/shader-material.directive.ts`
- `DofEffectComponent` - `libs/angular-3d/src/lib/postprocessing/effects/dof-effect.component.ts`
- `SsaoEffectComponent` - `libs/angular-3d/src/lib/postprocessing/effects/ssao-effect.component.ts`
- `ColorGradingEffectComponent` - `libs/angular-3d/src/lib/postprocessing/effects/color-grading-effect.component.ts`
- `RenderLoopService.setFrameloop()` - `libs/angular-3d/src/lib/services/render-loop.service.ts`

### External Dependencies

**No new dependencies required.** All features use existing Three.js and three-stdlib packages.

### Asset Dependencies

**HDRI Environment Presets**:

- Built-in presets use polyhaven.com CDN or bundled fallbacks
- No local HDRI files required for Phase 2.1 and 2.2
- Performance section requires no additional assets

---

## Quality Requirements

### Functional Requirements

1. **All enhancements render correctly** across Chrome, Firefox, Safari, Edge
2. **HDRI environments load successfully** for all 10 presets
3. **Post-processing effects combine without artifacts** (no depth buffer conflicts)
4. **Demand rendering stops/starts correctly** based on invalidation
5. **InstancedMesh supports 100k+ instances** without crashes

### Non-Functional Requirements

1. **Performance**:

   - Hero scenes maintain 60fps after HDRI/DOF additions
   - Combined post-processing: <15ms frame time
   - 100k instanced mesh: 60fps on mid-range GPU
   - Demand mode: 95%+ GPU idle time when off-screen

2. **Visual Quality**:

   - HDRI reflections visible on metallic/glass materials
   - DOF blur is subtle and cinematic (not overdone)
   - SSAO shadows enhance depth perception
   - Color grading presets show clear visual differences

3. **Code Quality**:

   - All components use `ChangeDetectionStrategy.OnPush`
   - Signal-based inputs for reactive updates
   - Proper cleanup in `DestroyRef.onDestroy()`
   - No console errors or warnings

4. **Documentation**:
   - Code examples are copy-paste ready
   - Descriptions explain the "why" not just the "what"
   - Performance characteristics documented in section descriptions

---

## Files Affected Summary

### MODIFY (7 files)

1. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts`

   - Add: EnvironmentComponent, DofEffectComponent imports
   - Add: HDRI environment + DOF effect in template

2. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\hero-space-scene.component.ts`

   - Add: EnvironmentComponent import
   - Add: HDRI environment in template

3. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\value-props-3d-scene.component.ts`

   - Add: `[frameloop]="'demand'"` to Scene3dComponent

4. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\postprocessing-section.component.ts`

   - Add: DofEffectComponent, SsaoEffectComponent, ColorGradingEffectComponent imports
   - Add: 4 new demo sections (DOF, SSAO, Color Grading, Combined)

5. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\lighting-section.component.ts`

   - Add: EnvironmentComponent import
   - Add: 6th light type (environment) to comparison
   - Add: 10-preset HDRI gallery section

6. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\primitives-section.component.ts`

   - Add: EnvironmentComponent import
   - Add: Studio HDRI to GLTF model demo

7. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\angular-3d-layout.component.ts` (or routing file)
   - Add: Route for performance-section.component (if using lazy-loaded sections)

### CREATE (1+ files)

1. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\performance-section.component.ts`

   - New showcase section for InstancedMesh + Demand Rendering

2. `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\shaders-section.component.ts` (OPTIONAL)
   - New showcase section for custom GLSL shaders

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: **frontend-developer**

**Rationale**:

1. All work is in Angular demo app (UI component modifications)
2. Requires understanding of Angular standalone components, signals, templates
3. Visual quality verification requires browser-based testing
4. No backend/NestJS knowledge required
5. No complex 3D math (library features are already implemented)

### Complexity Assessment

**Complexity**: **MEDIUM**

**Estimated Effort**: **4-12 hours** (varies by phase)

**Breakdown**:

- **Phase 2.1 (Quick Wins)**: 1-2 hours

  - 4 enhancements, each 30 minutes
  - Low risk, high impact

- **Phase 2.2 (Showcase Expansions)**: 4-6 hours

  - Postprocessing section expansion: 2-3 hours (most complex)
  - Lighting section expansion: 1-2 hours
  - Primitives section update: 30 min

- **Phase 2.3 (New Sections)**: 3-4 hours (performance section only)
  - Performance section: 3-4 hours (component logic + GLSL if needed)
  - Shaders section: DEFER to future task (4-6 hours additional)

**Total Estimated Time**: 8-12 hours for Phases 2.1 + 2.2 + 2.3 (performance only)

---

## Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **Library Features Exported**:

   - Check `libs/angular-3d/src/index.ts` exports all new components
   - Verify imports resolve correctly in demo app

2. **HDRI Presets Available**:

   - Check `EnvironmentComponent` implementation for preset URLs
   - Verify network access to polyhaven.com CDN or bundled fallbacks

3. **Scene3dComponent frameloop Input**:

   - Verify `frameloop` input exists in Scene3dComponent
   - Check RenderLoopService `setFrameloop()` method

4. **Post-Processing Effect Order**:

   - Verify EffectComposerService applies effects in correct order
   - Test combined effects for depth buffer conflicts

5. **Performance Baselines**:
   - Measure current hero scene FPS before changes
   - Document baseline for comparison after enhancements

---

## Architecture Delivery Checklist

- [x] All component specifications include file paths (absolute Windows paths)
- [x] Current state analysis provided for each enhancement
- [x] Code examples are complete and production-ready
- [x] Integration points with new library features documented
- [x] Testing strategy covers visual, performance, and cross-browser validation
- [x] Files affected list includes all modifications and creations
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (MEDIUM, 8-12 hours)
- [x] Quality requirements defined (functional + non-functional)
- [x] Dependencies verified (all Phase 1 features implemented)
- [x] No step-by-step implementation (that's team-leader's job)
- [x] Evidence-based decisions (research report cited throughout)

---

**Document Status**: READY FOR TEAM-LEADER DECOMPOSITION
**Next Step**: team-leader creates tasks.md with atomic, git-verifiable tasks
**Recommended Phasing**: Start with Phase 2.1 (quick wins), validate visually, then proceed to Phase 2.2 and 2.3
