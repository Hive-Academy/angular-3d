# Implementation Plan - TASK_2025_020

## 📊 Codebase Investigation Summary

### Research Context

**Research Report**: D:\projects\angular-3d-workspace\task-tracking\TASK_2025_020\research-report.md
**Analysis Date**: 2025-12-22
**Scope**: 12 components analyzed (Priority 1 + Priority 2)

### Key Findings from Research

The researcher-expert performed a systematic audit comparing temp folder reference implementations with library components. The audit revealed **parameter-level discrepancies** (default values, missing inputs) rather than architectural mismatches.

**Components with MAJOR Issues** (Priority 1 fixes):
1. **StarFieldComponent** - Stars appear as flat squares (enableGlow defaults to false, no texture in simple mode)
2. **BloomEffectComponent** - Parameter mismatches affecting bloom quality
3. **PlanetComponent** - Missing material features and glow configuration

**Components with MINOR Issues** (Priority 2 fixes):
3. **GlowParticleTextComponent** - Font size and animation parameter differences
4. **FloatingSphereComponent** - Geometry detail and material property gaps

**Evidence Sources**:
- All parameter comparisons documented in research-report.md (lines 1-632)
- Temp folder implementations: `temp/angular-3d/components/`
- Library implementations: `libs/angular-3d/src/lib/`

---

## 🏗️ Architecture Design (Evidence-Based)

### Design Philosophy

**Chosen Approach**: Surgical Parameter Corrections
**Rationale**:
- Library architecture is sound (directives, signals, services)
- Issues are **configuration-level**, not structural
- Fix defaults and add missing inputs to match temp folder quality
- Maintain library's modernized patterns (no architectural changes)

**Evidence**: Research report lines 9-12 confirm architectural differences are intentional (directive composition vs angular-three primitives) and NOT the root cause.

---

## Component Specifications

### Component 1: StarFieldComponent (CRITICAL VISUAL FIX)

**Purpose**: Create realistic star field with glowing star appearance

**Pattern**: Points-based or Sprite-based star rendering
**Evidence**:
- Current implementation: `libs/angular-3d/src/lib/primitives/star-field.component.ts`
- Temp reference: `temp/angular-3d/components/primitives/star-field-enhanced.component.ts`
- User observation: "Stars look like plain flat squares" in live demo

**The Problem**:
The library component has `enableGlow = input<boolean>(false)` by default. When false:
- Uses `THREE.PointsMaterial` WITHOUT any texture map
- Results in flat square pixels instead of soft glowing stars
- Completely different appearance from temp folder reference

The temp component ALWAYS uses sprites with radial gradient texture (lines 47-64).

**Root Cause Analysis**:
```typescript
// Library (line 99) - DEFAULT IS FALSE
public readonly enableGlow = input<boolean>(false);

// When false, uses buildSimpleStars() which creates:
this.material = new THREE.PointsMaterial({
  color: color,
  size: starSize,
  // NO MAP TEXTURE - causes flat square appearance!
});
```

**Required Fixes**:

| Issue | Current | Required | Rationale |
|-------|---------|----------|-----------|
| enableGlow default | `false` | `true` | Stars should glow by default |
| Simple mode texture | None | Add radial gradient map | Even without sprites, points should have glow texture |
| multiSize default | `false` | `true` | Varied sizes look more realistic |
| stellarColors default | `false` | `true` | Temperature-based colors look better |

**Alternative Approach (Better Performance)**:
Instead of changing defaults to sprite-based (expensive for many stars), add a texture map to `buildSimpleStars()`:

```typescript
// In buildSimpleStars(), ADD texture map:
private buildSimpleStars(...): void {
  // Generate glow texture (reuse createGlowTexture logic)
  const glowTexture = this.generatePointsGlowTexture();

  this.material = new THREE.PointsMaterial({
    color: color,
    size: starSize,
    map: glowTexture,  // ADD THIS - makes points round/glowing
    sizeAttenuation: true,
    transparent: true,
    opacity: starOpacity,
    depthWrite: false,
    alphaMap: glowTexture, // Also use as alpha for smooth edges
  });
}
```

**Implementation Strategy**:
1. Add a glow texture to the simple (Points-based) mode so ALL stars have soft glow appearance
2. Change `enableGlow` default to keep it `false` (sprites are expensive) but ensure simple mode looks good
3. Change `multiSize` and `stellarColors` defaults to `true` for better appearance

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/star-field.component.ts` (MODIFY)

**Change Details**:
- Line 100: Change `enableGlow = input<boolean>(false)` → stays false (sprites expensive)
- Line 100-101: Change `multiSize = input<boolean>(false)` → `input<boolean>(true)`
- Line 101-102: Change `stellarColors = input<boolean>(false)` → `input<boolean>(true)`
- In `buildSimpleStars()`: Add texture map to PointsMaterial for glow effect
- Create new helper method `generatePointsGlowTexture()` that returns a simpler glow texture suitable for Points

**Visual Quality Target**:
- Stars should appear as soft glowing circles, not flat squares
- Larger stars should be brighter
- Color variation should be visible (blue, white, yellow stars)

---

### Component 2: BloomEffectComponent

**Purpose**: Post-processing bloom effect for glowing objects

**Pattern**: UnrealBloomPass wrapper component
**Evidence**:
- Current implementation: `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts`
- Temp reference: `temp/angular-3d/components/effects/bloom-effect.component.ts`
- Research findings: research-report.md:15-48

**Responsibilities**:
- Provide bloom post-processing via UnrealBloomPass
- Expose threshold, strength, radius, kernelSize parameters
- React to renderer size changes for multi-scene support

**Parameter Corrections Needed** (research-report.md:29-35):

| Parameter | Current Default | Required Default | Evidence |
|-----------|----------------|------------------|----------|
| threshold | 0 | 0.3 | research-report.md:32 |
| strength | 1.5 | 1.8 | research-report.md:33 |
| kernelSize | N/A (missing) | 3 | research-report.md:34 |

**Quality Requirements**:

**Functional Requirements**:
- Bloom threshold of 0.3 ensures only bright objects (>30% luminance) glow
- Bloom strength of 1.8 provides noticeable but not overwhelming glow
- kernelSize parameter controls blur quality (higher = smoother, more expensive)

**Non-Functional Requirements**:
- Must not break existing scenes (all changes are additive or default tweaks)
- kernelSize parameter should be optional (UnrealBloomPass may not support it - requires verification)

**Pattern Compliance**:
- Use signal-based inputs: `threshold = input<number>(0.3)` (pattern: line 50-52)
- Pass parameters to UnrealBloomPass constructor (pattern: lines 64-69)
- Update pass properties reactively via effect (pattern: lines 76-82)

**Implementation Notes**:

**CRITICAL - kernelSize Validation Required**:
The research report (line 34-39) mentions kernelSize from temp folder's NgtpBloom wrapper, but UnrealBloomPass may not directly support this parameter. Developer MUST:

1. Check UnrealBloomPass API documentation
2. If kernelSize is supported, add as input
3. If NOT supported, document this as intentional difference (temp used wrapper with extra features)

**Files Affected**:
- `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts` (MODIFY)

**Change Details**:
- Line 50: Change `threshold = input<number>(0)` → `threshold = input<number>(0.3)`
- Line 51: Change `strength = input<number>(1.5)` → `strength = input<number>(1.8)`
- After line 52: Add `kernelSize = input<number | undefined>(undefined)` (if UnrealBloomPass supports it)
- Lines 64-69: Pass kernelSize to constructor if supported

---

### Component 2: PlanetComponent

**Purpose**: Sphere primitive representing planets with textures, glow, and material properties

**Pattern**: NG_3D_PARENT-based primitive with texture loading
**Evidence**:
- Current implementation: `libs/angular-3d/src/lib/primitives/planet.component.ts`
- Temp reference: `temp/angular-3d/components/primitives/planet.component.ts`
- Research findings: research-report.md:235-308

**Responsibilities**:
- Create textured sphere geometry
- Support emissive self-illumination
- Apply bump mapping for texture detail
- Conditional material properties based on texture presence
- Point light glow effect
- Scale and rotation inputs

**Missing Features** (research-report.md:288-295):

| Feature | Current State | Required State | Evidence |
|---------|--------------|----------------|----------|
| emissive | N/A (missing) | Input: 0x000000 default | research-report.md:252 |
| emissiveIntensity | N/A (missing) | Input: 0.2 default | research-report.md:253 |
| bumpMap | Not applied | Apply texture as bumpMap | research-report.md:269 |
| bumpScale | N/A | 1 | research-report.md:270 |
| scale | N/A (missing) | Input: 1 default | research-report.md:249 |
| glowDistance | Hardcoded: 15 | Input: 15 default | research-report.md:258 |
| glowIntensity default | 0 | 0.8 | research-report.md:257 |
| Conditional metalness | Always uses input | texture ? 0.1 : metalness | research-report.md:273 |
| Conditional roughness | Always uses input | texture ? 0.9 : roughness | research-report.md:274 |

**Quality Requirements**:

**Functional Requirements**:
- Emissive properties enable self-illumination (glowing planets, lava surfaces)
- Bump mapping adds surface detail from texture without geometry changes
- Conditional metalness/roughness: Textured planets should look less metallic (0.1 vs 0.3), rougher (0.9 vs 0.7) for realistic appearance
- Default glow intensity of 0.8 creates visible atmosphere/aura effect
- Scale input allows easy size adjustment without changing radius
- glowDistance input controls point light range

**Non-Functional Requirements**:
- All new inputs must be optional (defaults preserve existing behavior for non-textured planets)
- Texture loading must remain reactive (current pattern is correct)
- No performance regression (bump map uses existing texture, no new asset load)

**Pattern Compliance**:
- Add signal inputs for new parameters (pattern: lines 21-35)
- Update rebuildPlanet signature and material creation (pattern: lines 101-130)
- Apply bumpMap when texture is loaded (line 127)
- Conditional material properties in material constructor

**Implementation Pattern**:

```typescript
// Add new inputs (after line 35)
public readonly emissive = input<string | number>(0x000000);
public readonly emissiveIntensity = input<number>(0.2);
public readonly scale = input<number>(1);
public readonly glowDistance = input<number>(15);

// Change glowIntensity default (line 34)
public readonly glowIntensity = input<number>(0.8); // was: 0

// Update rebuildPlanet material creation (lines 124-130)
this.material = new THREE.MeshStandardMaterial({
  color: color,
  map: texture,
  bumpMap: texture, // NEW: use texture as bump map
  bumpScale: texture ? 1 : 0, // NEW: only apply bump when textured
  emissive: this.emissive(), // NEW
  emissiveIntensity: this.emissiveIntensity(), // NEW
  metalness: texture ? 0.1 : metalness, // CONDITIONAL
  roughness: texture ? 0.9 : roughness, // CONDITIONAL
});

// Update mesh scale (after line 136)
this.mesh.scale.set(this.scale(), this.scale(), this.scale());

// Update light constructor (line 140)
this.light = new THREE.PointLight(
  glowColor,
  glowIntensity,
  this.glowDistance(), // was: hardcoded 15
  2
);
```

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/planet.component.ts` (MODIFY)

**Change Details**:
- Line 34: Change `glowIntensity = input<number>(0)` → `input<number>(0.8)`
- After line 35: Add 4 new inputs (emissive, emissiveIntensity, scale, glowDistance)
- Lines 101-109: Update rebuildPlanet signature to accept new parameters
- Lines 124-130: Update MeshStandardMaterial constructor with conditional logic
- After line 136: Apply scale to mesh
- Line 140: Use glowDistance input instead of hardcoded 15
- Line 59-82: Update effect to pass new parameters to rebuildPlanet

---

### Component 3: GlowParticleTextComponent

**Purpose**: Neon tube-like glowing text effect using particle system

**Pattern**: Points-based particle text with flow animation
**Evidence**:
- Current implementation: `libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts`
- Temp reference: `temp/angular-3d/components/primitives/glow-particle-text.component.ts`
- Research findings: research-report.md:50-119

**Responsibilities**:
- Sample text pixels from canvas
- Generate particle system with glow effect
- Animate with global pulse and flow wave
- Provide configurable font size and pulse amount

**Parameter Corrections Needed** (research-report.md:64-71):

| Parameter | Current Default | Required Default | Evidence |
|-----------|----------------|------------------|----------|
| fontSize | 80 | 100 | research-report.md:65 |
| pulseAmount | Hardcoded 0.3 | Input with default 0.3 | research-report.md:71, 93 |

**Quality Requirements**:

**Functional Requirements**:
- fontSize of 100 produces larger, more readable text (25% larger than current 80)
- pulseAmount input allows users to control breathing intensity (currently hardcoded)

**Non-Functional Requirements**:
- No visual change for existing users (new pulseAmount default matches hardcoded value)
- Maintains performance (no algorithm changes)

**Pattern Compliance**:
- Add signal input for pulseAmount (pattern: lines 70-78)
- Use pulseAmount() in animation logic (pattern: line 261)

**Implementation Pattern**:

```typescript
// Change fontSize default (line 72)
readonly fontSize = input<number>(100); // was: 80

// Add pulseAmount input (after line 78)
readonly pulseAmount = input<number>(0.3);

// Update animation logic (line 261)
const globalPulse = Math.sin(this.time * this.pulseSpeed()) * this.pulseAmount() + 1.0;
// was: hardcoded 0.3
```

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts` (MODIFY)

**Change Details**:
- Line 72: Change `fontSize = input<number>(80)` → `input<number>(100)`
- After line 78: Add `pulseAmount = input<number>(0.3)`
- Line 261: Replace hardcoded 0.3 with `this.pulseAmount()`

---

### Component 4: FloatingSphereComponent

**Purpose**: Sphere with advanced physical material (clearcoat, transmission, IOR)

**Pattern**: hostDirectives composition (MeshDirective + SphereGeometryDirective + PhysicalMaterialDirective)
**Evidence**:
- Current implementation: `libs/angular-3d/src/lib/primitives/floating-sphere.component.ts`
- Temp reference: `temp/angular-3d/components/primitives/floating-sphere.component.ts`
- Research findings: research-report.md:310-358

**Responsibilities**:
- Provide sphere geometry with configurable detail
- Expose physical material properties (clearcoat, transmission, thickness)
- Support emissive properties for self-illumination

**Parameter Corrections Needed** (research-report.md:324-336):

| Parameter | Current Default | Required Default | Evidence |
|-----------|----------------|------------------|----------|
| heightSegments | 16 | 32 | research-report.md:328 |
| clearcoatRoughness | 0.0 | 0.1 | research-report.md:333 |
| thickness | N/A (missing) | 0.5 | research-report.md:336 |

**Quality Requirements**:

**Functional Requirements**:
- heightSegments of 32 (vs 16) doubles vertical detail for smoother spheres
- clearcoatRoughness of 0.1 (vs 0.0) adds slight roughness to clearcoat layer for more realistic appearance
- thickness parameter controls subsurface scattering depth for transmission materials

**Non-Functional Requirements**:
- heightSegments change increases triangle count by 2x (acceptable for quality improvement)
- thickness parameter only affects transmission materials (no impact on opaque materials)
- Must verify PhysicalMaterialDirective supports thickness parameter

**Pattern Compliance**:
- Update args input default (pattern: line 83)
- Update clearcoatRoughness default (pattern: line 90)
- Add thickness to PhysicalMaterialDirective inputs (pattern: lines 54-64)
- Add thickness signal input (pattern: line 93)

**Implementation Pattern**:

```typescript
// Change heightSegments in args default (line 83)
public readonly args = input<[number, number, number]>([1, 32, 32]);
// was: [1, 32, 16] - note: third value is heightSegments

// Change clearcoatRoughness default (line 90)
public readonly clearcoatRoughness = input<number>(0.1); // was: 0.0

// Add thickness input (after line 92)
public readonly thickness = input<number>(0.5);

// Add thickness to hostDirectives inputs (line 62)
directive: PhysicalMaterialDirective,
inputs: [
  'color',
  'metalness',
  'roughness',
  'clearcoat',
  'clearcoatRoughness',
  'transmission',
  'thickness', // NEW
  'ior',
  'wireframe',
],
```

**CRITICAL - PhysicalMaterialDirective Verification**:
Developer MUST verify that PhysicalMaterialDirective supports the `thickness` input by checking:
1. `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts`
2. If thickness is NOT currently supported, add it to the directive BEFORE modifying FloatingSphereComponent
3. If MeshPhysicalMaterial doesn't support thickness, document this as intentional difference

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/floating-sphere.component.ts` (MODIFY)
- `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts` (VERIFY/MODIFY if needed)

**Change Details**:
- Line 83: Change args default from `[1, 32, 16]` → `[1, 32, 32]`
- Line 90: Change clearcoatRoughness default from `0.0` → `0.1`
- After line 92: Add `thickness = input<number>(0.5)`
- Line 62: Add `'thickness'` to PhysicalMaterialDirective inputs array

---

## 🔗 Integration Architecture

### Integration Points

**No integration changes required** - All fixes are isolated parameter changes within components.

### Batched Implementation Strategy

**Batch 1: Visual Effects (CRITICAL IMPACT)** - Most noticeable quality improvements
- **StarFieldComponent** (CRITICAL: Add glow texture to fix flat square appearance)
- BloomEffectComponent (threshold/strength corrections)
- PlanetComponent (emissive, glow, bump map)

**Batch 2: Text & Primitives (MEDIUM IMPACT)** - Polish improvements
- GlowParticleTextComponent (fontSize, pulseAmount)
- FloatingSphereComponent (geometry detail, material properties)

**Batch 3: Demo App Hero Scene (HIGH IMPACT)** - Showcase enhancement
- hero-space-scene.component.ts (angular-3d-showcase)
- Add multi-layer stars, nebula, robots, particle text, moon

**Rationale**:
- Batch 1 affects post-processing and major scene elements (most visible)
- Batch 2 refines text and secondary primitives
- Batch 3 showcases all library capabilities in a visually impressive demo
- Batching allows git commits per batch for easier rollback if issues arise

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

**Visual Quality**:
- Bloom effect produces glow matching temp folder reference (threshold 0.3, strength 1.8)
- Planets have realistic material appearance (emissive, bump mapping, conditional properties)
- Planet glow is visible by default (intensity 0.8 vs 0)
- Particle text is readable and prominent (fontSize 100 vs 80)
- Spheres have smooth curvature (32 vs 16 height segments)

**Configurability**:
- All new parameters exposed as inputs (pulseAmount, emissive, scale, thickness)
- Defaults match temp folder quality without requiring user configuration

### Non-Functional Requirements

**Performance**:
- No significant performance regression (bump map reuses texture, segment increase is acceptable)
- Particle text maintains same particle count logic

**Backward Compatibility**:
- All changes are default value updates or new optional inputs
- Existing code using these components continues to work
- Breaking changes: NONE (all inputs optional, defaults carefully chosen)

**Maintainability**:
- Code remains readable and follows library patterns
- New inputs documented in component JSDoc
- Conditional logic clearly commented

### Pattern Compliance

**Signal Inputs** (verified pattern):
- All new inputs use `input<T>(defaultValue)` pattern
- Reactive updates via effects (existing patterns maintained)

**Evidence Citations**:
- All parameter values verified from research-report.md
- Temp folder file locations documented
- Research methodology followed (parameter comparison tables)

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:
1. **3D Graphics Domain**: Changes involve Three.js materials, geometries, and post-processing
2. **Visual Quality Focus**: Requires understanding of visual effects (bloom, emissive, bump mapping)
3. **Angular Component Work**: Modifying Angular components with signal inputs
4. **No Backend Logic**: No API calls, database, or server-side logic
5. **Browser-Based**: All work runs in browser (WebGL, Three.js)

### Complexity Assessment

**Complexity**: LOW-MEDIUM
**Estimated Effort**: 2-3 hours

**Breakdown**:
- **Batch 1** (BloomEffectComponent + PlanetComponent): 1.5-2 hours
  - BloomEffectComponent: 20-30 minutes (simple default changes + kernelSize verification)
  - PlanetComponent: 1-1.5 hours (multiple inputs, conditional logic, material updates)
- **Batch 2** (GlowParticleTextComponent + FloatingSphereComponent): 0.5-1 hour
  - GlowParticleTextComponent: 15-20 minutes (two simple changes)
  - FloatingSphereComponent: 20-30 minutes (geometry args, material defaults, thickness verification)

**Risk Factors**:
- kernelSize and thickness parameters may not be supported by Three.js APIs (requires verification + decision)
- Conditional material logic in PlanetComponent requires careful testing (textured vs non-textured)

### Files Affected Summary

**MODIFY** (6 files):
- `libs/angular-3d/src/lib/primitives/star-field.component.ts` (CRITICAL: Fix flat square stars)
- `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts`
- `libs/angular-3d/src/lib/primitives/planet.component.ts`
- `libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts`
- `libs/angular-3d/src/lib/primitives/floating-sphere.component.ts`
- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-space-scene.component.ts` (ENHANCE)

**VERIFY** (1 file - may require modification):
- `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts` (thickness support)

**CREATE**: None

**REWRITE**: None

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **UnrealBloomPass API**:
   - Check if `kernelSize` parameter exists in UnrealBloomPass constructor
   - Source: `node_modules/three-stdlib/postprocessing/UnrealBloomPass.d.ts` OR Three.js documentation
   - If NOT supported: Document as intentional difference (temp used wrapper with extra features)

2. **MeshPhysicalMaterial API**:
   - Check if `thickness` property exists in MeshPhysicalMaterial
   - Source: `node_modules/three/src/materials/MeshPhysicalMaterial.d.ts` OR Three.js documentation
   - If supported: Verify PhysicalMaterialDirective exposes it as input

3. **PhysicalMaterialDirective Implementation**:
   - Read: `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts`
   - Verify current inputs list
   - Add `thickness` input if missing and MeshPhysicalMaterial supports it

4. **Research Report Alignment**:
   - All parameter values match research-report.md findings exactly
   - No assumptions made beyond research findings
   - Conditional logic in PlanetComponent matches temp folder pattern (lines 273-274)

5. **Visual Testing**:
   - After changes, test in demo app (`apps/angular-3d-demo`)
   - Verify bloom looks correct (not too weak or too strong)
   - Verify planets have visible glow and emissive properties
   - Verify particle text is readable
   - Verify spheres look smooth

### Validation Strategy

**Per-Component Testing**:

**BloomEffectComponent**:
- [ ] Create test scene with bright object (emissive color)
- [ ] Verify bloom appears on bright areas only (threshold 0.3)
- [ ] Verify glow strength is noticeable but not overpowering (1.8)
- [ ] If kernelSize added, test quality difference (3 vs default)

**PlanetComponent**:
- [ ] Test non-textured planet (verify emissive visible, glow visible, scale works)
- [ ] Test textured planet (verify bump map applied, metalness=0.1, roughness=0.9)
- [ ] Verify glow light range matches glowDistance input
- [ ] Verify scale input resizes planet without changing radius parameter

**GlowParticleTextComponent**:
- [ ] Verify text is larger (fontSize 100 vs 80)
- [ ] Verify pulseAmount input controls breathing intensity
- [ ] Test with different pulseAmount values (0, 0.3, 0.6) to confirm reactivity

**FloatingSphereComponent**:
- [ ] Verify sphere is smoother (32 vs 16 height segments)
- [ ] Verify clearcoat looks slightly rough (0.1 vs 0.0)
- [ ] If thickness added, verify transmission effect is stronger

**Integration Testing**:
- [ ] Run demo app hero section (if it uses these components)
- [ ] Verify no console errors or warnings
- [ ] Verify no performance degradation (check FPS)

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase (signal inputs, effects, NG_3D_PARENT)
- [x] All parameters verified from research-report.md
- [x] Quality requirements defined (visual, performance, compatibility)
- [x] Integration points documented (none - isolated changes)
- [x] Files affected list complete (4 MODIFY, 1 VERIFY)
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (LOW-MEDIUM, 2-3 hours)
- [x] No step-by-step implementation (team-leader decomposes into tasks)
- [x] Evidence citations provided (research-report.md line references)
- [x] Verification points defined (kernelSize, thickness API checks)
- [x] Batched strategy specified (Batch 1: visual effects, Batch 2: text/primitives)

---

## 📋 Evidence Provenance

### Research Report Citations

All technical decisions based on:
- **Document**: `task-tracking/TASK_2025_020/research-report.md`
- **Created**: 2025-12-22
- **Methodology**: Line-by-line parameter comparison of temp folder vs library implementations

**Citation Index**:
- BloomEffectComponent: research-report.md lines 15-48
- PlanetComponent: research-report.md lines 235-308
- GlowParticleTextComponent: research-report.md lines 50-119
- FloatingSphereComponent: research-report.md lines 310-358
- Parameter tables: research-report.md lines 29-35, 244-260, 64-71, 324-336

### Codebase Evidence

**Current Library Implementations**:
- BloomEffectComponent: `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts` (read during planning)
- PlanetComponent: `libs/angular-3d/src/lib/primitives/planet.component.ts` (read during planning)
- GlowParticleTextComponent: `libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts` (read during planning)
- FloatingSphereComponent: `libs/angular-3d/src/lib/primitives/floating-sphere.component.ts` (read during planning)

**Temp Folder References**:
- All temp files documented in research-report.md "Files Compared" sections
- Temp folder structure: context.md lines 39-80

### No Hallucinated APIs

**All APIs Verified**:
- ✅ `input<T>(default)` - Signal input pattern (verified in all component files)
- ✅ `NG_3D_PARENT` - Parent injection token (verified: planet.component.ts:10)
- ✅ `MeshStandardMaterial` - Three.js material (verified: planet.component.ts:125)
- ✅ `UnrealBloomPass` - Three-stdlib postprocessing (verified: bloom-effect.component.ts:16)
- ✅ `PointLight` - Three.js light (verified: planet.component.ts:140)
- ✅ `SphereGeometryDirective` - Library directive (verified: floating-sphere.component.ts:4)
- ✅ `PhysicalMaterialDirective` - Library directive (verified: floating-sphere.component.ts:6)

**Parameters Requiring Verification** (not hallucinated, but needs check):
- ⚠️ `kernelSize` - UnrealBloomPass parameter (temp used wrapper, need to verify core API)
- ⚠️ `thickness` - MeshPhysicalMaterial property (common in Three.js, need to verify current version)

---

## Component 5: Hero Space Scene Enhancement (Demo App)

**Purpose**: Enhance the demo app's hero-space-scene.component.ts to match the temp folder's feature-rich reference implementation.

**Pattern**: Scene composition using library components
**Evidence**:
- Current implementation: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-space-scene.component.ts` (79 lines - minimal)
- Temp reference: `temp/scene-graphs/hero-space-scene.component.ts` (727 lines - full-featured)
- User request: "create our hero-space-scene.component.ts similar to our temp hero scene"

**Responsibilities**:
- Showcase all library capabilities in a visually impressive scene
- Demonstrate multi-layer star fields, volumetric nebula, robots, particle text
- Provide interactive camera controls
- Use viewport positioning for consistent layout

**Current State vs Temp Reference**:

| Feature | Current (Demo) | Temp Reference | Required |
|---------|---------------|----------------|----------|
| Star Fields | 1 layer (3000 stars) | 3 layers (3000+2000+2500) | Multi-layer |
| Nebula Volumetric | ❌ None | ✅ Full shader effects | Add |
| Flying Robots | ❌ None | ✅ 2 robots with SpaceFlight paths | Add |
| Particle Text | ❌ None | ✅ InstancedParticleText (3 lines) | Add |
| Planet | 1 Earth GLTF | Earth GLTF + Moon with PlanetComponent | Add Moon |
| Bloom Effect | Basic (0.9 threshold) | Advanced (0.8 threshold) | Update |
| Camera Controls | Basic orbit | Scroll-zoom coordinator | Enhance |

**Quality Requirements**:

**Functional Requirements**:
- Multi-layer star fields create depth parallax (3 layers at different radii)
- Flying robots demonstrate SpaceFlight3dDirective with waypoint animations
- Volumetric nebula adds atmospheric depth
- Particle text shows library text rendering capabilities
- Scene feels "alive" not static

**Non-Functional Requirements**:
- Maintain 60fps on mid-range hardware
- Use library components only (no temp folder dependencies)
- Follow ViewportPositioningService patterns for layout

**Pattern Compliance**:
- Use ViewportPositionDirective for positioned elements
- Use Float3dDirective and Rotate3dDirective for animations
- Use SpaceFlight3dDirective for robot flight paths
- Follow demo app CLAUDE.md guidelines

**Implementation Approach**:

The demo hero-space-scene should be a **simplified but impressive** version of temp reference:

```typescript
// Key elements to add (not all temp features needed for demo)
@Component({
  selector: 'app-hero-space-scene',
  imports: [
    Scene3dComponent,
    // Lighting
    AmbientLightComponent, DirectionalLightComponent, PointLightComponent,
    // Stars
    StarFieldComponent,
    // Nebula
    NebulaVolumetricComponent,
    // Models
    GltfModelComponent, PlanetComponent,
    // Directives
    Rotate3dDirective, Float3dDirective, SpaceFlight3dDirective,
    ViewportPositionDirective,
    // Text
    InstancedParticleTextComponent,
    // Controls & Effects
    OrbitControlsComponent, BloomEffectComponent,
  ],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
      <!-- Lighting -->
      <!-- Multi-layer star fields (3 layers) -->
      <!-- Volumetric nebula (top-right) -->
      <!-- Earth GLTF with rotation -->
      <!-- Moon with PlanetComponent -->
      <!-- Flying robots with SpaceFlight paths -->
      <!-- Particle text showcase -->
      <!-- Bloom effect -->
      <!-- Orbit controls -->
    </a3d-scene-3d>
  `,
})
```

**Files Affected**:
- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/hero-space-scene.component.ts` (MODIFY - enhance from 79 to ~250 lines)

**Elements to Add**:
1. Multi-layer star fields (3 layers at radius 35, 45, 60)
2. NebulaVolumetricComponent (top-right, using viewport positioning)
3. Flying robots (2 GLTF models with SpaceFlight3dDirective)
4. PlanetComponent for Moon
5. InstancedParticleTextComponent (1-2 text displays)
6. Enhanced lighting (ambient + directional + point)
7. Updated bloom parameters

**NOT Required** (temp-only features we skip):
- SVG tech logos (library doesn't have SVGIconComponent)
- SmokeParticleText (optional, keep simple)
- GlowParticleText (optional, instanced is enough)
- ScrollZoomCoordinator (optional, basic orbit is fine)
- SpaceThemeStore (temp-specific, not in library)

---

## 🚀 Implementation Success Criteria

### Visual Quality Targets

**Bloom Effect**:
- ✅ Only objects with luminance > 0.3 bloom (threshold enforcement)
- ✅ Glow strength is noticeable on bright objects (1.8 intensity)
- ✅ No performance regression vs current bloom

**Planets**:
- ✅ Textured planets show surface detail (bump mapping visible)
- ✅ Planets have visible glow by default (point light halo)
- ✅ Emissive areas self-illuminate (visible in dark scenes)
- ✅ Textured planets look less metallic/more rough than plain spheres

**Particle Text**:
- ✅ Text is 25% larger (fontSize 100 vs 80)
- ✅ Pulse effect is configurable and visible
- ✅ No particle count explosion (MAX_PARTICLES limit enforced)

**Spheres**:
- ✅ Spheres appear smoother (no visible faceting)
- ✅ Clearcoat has subtle roughness (not perfectly mirror-like)
- ✅ Transmission materials show depth (if thickness supported)

### Code Quality Targets

- ✅ All new inputs have JSDoc comments
- ✅ Default values documented with rationale (why 0.3, why 1.8, etc.)
- ✅ Conditional logic clearly commented
- ✅ No linter errors introduced
- ✅ TypeScript strict mode passes
- ✅ All effects use proper cleanup (DestroyRef patterns)

### Testing Targets

- ✅ Unit tests pass (existing tests still work)
- ✅ Visual regression testing in demo app
- ✅ No console errors or warnings
- ✅ Git commits follow conventional commits format
- ✅ Each batch committed separately for rollback safety

---

## 📝 Notes for Team Leader

### Task Decomposition Guidance

**Recommended Task Breakdown**:

1. **Task 1**: **CRITICAL** - Fix StarFieldComponent (add glow texture to simple mode, change defaults)
2. **Task 2**: Verify Three.js API support (kernelSize, thickness)
3. **Task 3**: Update PhysicalMaterialDirective (if thickness needs adding)
4. **Task 4**: Fix BloomEffectComponent parameters
5. **Task 5**: Fix PlanetComponent (emissive, bump map, conditional material)
6. **Task 6**: Fix GlowParticleTextComponent (fontSize, pulseAmount)
7. **Task 7**: Fix FloatingSphereComponent (geometry, material)
8. **Task 8**: Enhance hero-space-scene.component.ts in demo app
9. **Task 9**: Visual testing and validation in demo app

**Git Commit Strategy**:
- Commit after Task 1: `fix(angular-3d): add glow texture to star field for proper star appearance`
- Commit after Task 4: `fix(angular-3d): update bloom effect defaults to match temp folder reference`
- Commit after Task 5: `feat(angular-3d): add emissive properties and bump mapping to planet component`
- Commit after Task 6+7: `fix(angular-3d): correct particle text and sphere defaults`
- Commit after Task 8: `feat(demo): enhance hero-space-scene with multi-layer stars, nebula, robots`
- Commit after Task 9: `test(demo): validate component fixes in showcase`

### Risk Mitigation

**If kernelSize NOT supported**:
- Document in code comment: "kernelSize parameter from temp folder's NgtpBloom wrapper not available in UnrealBloomPass core API"
- Skip adding this input (acceptable difference)

**If thickness NOT supported**:
- Check Three.js version in package.json
- Thickness added in Three.js r126+ (verify version)
- If missing, upgrade Three.js OR skip this parameter

**If conditional material logic breaks existing scenes**:
- Add feature flag input: `useConditionalMaterial = input<boolean>(true)`
- Allow users to opt-out if needed
- Default to true (new behavior)

### Performance Monitoring

**Before/After Metrics to Track**:
- Bloom pass render time (should be similar)
- Planet component initialization time (should be similar)
- Particle text particle count (should match existing)
- Sphere triangle count (will increase 2x - acceptable)
- Overall scene FPS (should not degrade)

If any metric degrades >10%, investigate optimization or rollback specific change.
