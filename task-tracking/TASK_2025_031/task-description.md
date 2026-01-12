# Requirements Document - TASK_2025_031

## Introduction

### Business Context

The Angular 3D library's production demo is broken due to incomplete WebGPU migration, but **the larger issue is that several components were never properly elevated to modern WebGPU-native quality**. Instead, they use legacy WebGL-era techniques (canvas textures on sprites, GLSL string shaders, CPU-based noise).

During TASK_2025_028, the developer made an unauthorized architectural decision to skip Category C (GLSL→TSL shader conversion) and Category D (post-processing migration) work. This caused **11 components** to use incompatible `ShaderMaterial` with the WebGPU renderer.

**However**, simply porting these components to TSL would preserve their outdated quality. The proper approach is to **elevate them to WebGPU-native implementations** that leverage modern GPU compute capabilities for dramatically better visuals.

### Value Proposition

Completing this **elevation** (not just migration) will:

1. **Fix production demo** - Critical for showcasing the library
2. **Dramatically improve visual quality** - GPU compute particles, ray-marched volumetrics, physically-accurate effects
3. **Showcase WebGPU's capabilities** - Demonstrate what Angular 3D can achieve with modern GPUs
4. **Future-proof the library** - Native WebGPU implementations, not WebGL compatibility hacks
5. **Match/exceed Three.js showcase quality** - Professional-grade effects

---

## Task Classification

| Field                | Value                                            |
| -------------------- | ------------------------------------------------ |
| **Type**             | ENHANCEMENT (Architectural Elevation + Bug Fix)  |
| **Priority**         | P0 - Critical (Broken Demo + Quality Gap)        |
| **Complexity**       | Complex (GPU compute, ray marching, TSL shaders) |
| **Estimated Effort** | 60-80 hours                                      |

---

## Workflow Dependencies

| Dependency       | Required? | Rationale                                                                         |
| ---------------- | --------- | --------------------------------------------------------------------------------- |
| **Research**     | **Yes**   | Investigate WebGPU compute particles, ray-marched volumetrics, TSL noise patterns |
| **UI/UX Design** | No        | Visual quality target: Match/exceed Three.js examples                             |

---

## Components Requiring WebGPU Elevation

### Analysis: Current Implementation Quality

| Component                     | Current Technique                     | Quality | WebGPU-Native Alternative               |
| ----------------------------- | ------------------------------------- | ------- | --------------------------------------- |
| **NebulaVolumetricComponent** | GLSL ShaderMaterial on planes         | ⭐⭐    | GPU ray-marched volumetrics             |
| **NebulaComponent**           | Canvas textures on sprites            | ⭐      | TSL procedural billboards               |
| **CloudLayerComponent**       | GLSL ShaderMaterial + merged geometry | ⭐⭐    | GPU compute clouds or TSL volumetrics   |
| **SmokeTroikaTextComponent**  | GLSL ShaderMaterial overlay           | ⭐⭐    | TSL animated smoke with proper blending |
| **BubbleTextComponent**       | GLSL fresnel shader                   | ⭐⭐⭐  | TSL fresnel + physics-based reflection  |
| **MetaballComponent**         | GLSL ray marching                     | ⭐⭐⭐  | TSL metaballs (already decent)          |
| **StarFieldComponent**        | Canvas glow texture + Points          | ⭐⭐    | TSL procedural stars with GPU twinkle   |
| **ParticleSystemComponent**   | PointsNodeMaterial (basic)            | ⭐⭐⭐  | Already uses NodeMaterial ✓             |
| **Post-Processing**           | three-stdlib GLSL passes              | ⭐⭐    | Native THREE.PostProcessing + TSL       |

---

## Requirements

### Requirement 1: TSL Utilities Library (Foundation)

**User Story**: As a library developer, I want a comprehensive TSL utilities module with noise, FBM, and procedural functions, so that all effects can use consistent, GPU-native generation.

#### Acceptance Criteria

1. WHEN `simplexNoise3D(position)` is called THEN it SHALL return GPU-computed noise values in range [-1, 1]
2. WHEN `fbm(position, octaves)` is called THEN it SHALL produce fractal brownian motion with configurable octaves (default: 5)
3. WHEN `domainWarp(position, amount)` is called THEN it SHALL apply organic warping using FBM
4. WHEN `voronoi(position)` is called THEN it SHALL return cell-based noise for crystal/cell effects
5. WHEN shaders compile THEN no WebGPU or WebGL errors SHALL appear
6. WHEN `perlinNoise3D(position)` is called THEN it SHALL return classic Perlin values

#### Research Focus

- Three.js TSL `mx_noise_float`, `mx_fractal_noise_float` functions
- Custom TSL noise implementations matching GLSL quality
- Performance comparison with CPU-generated noise

---

### Requirement 2: NebulaVolumetricComponent - GPU Ray-Marched Volumetrics

**User Story**: As a demo viewer, I want nebula clouds that look like real space nebulae with proper depth, volumetric lighting, and organic motion.

#### Current State (to be replaced)

- Multi-layer PlaneGeometry with GLSL ShaderMaterial
- CPU-limited noise computation (5-octave FBM)
- Fake volumetric look via transparency stacking

#### Target State (WebGPU-native)

- **GPU Ray Marching** through volumetric density field
- **TSL-computed noise** for organic cloud patterns
- **Light absorption/scattering** for realistic depth
- **Animated flow** via GPU time uniforms
- **Color gradients** based on density

#### Acceptance Criteria

1. WHEN nebula renders THEN it SHALL use GPU ray marching for true volumetric depth
2. WHEN camera moves THEN parallax depth effect SHALL be visible
3. WHEN light passes through THEN absorption/scattering SHALL affect color
4. WHEN `enableFlow=true` THEN flow animation SHALL run at 60fps
5. WHEN on WebGL fallback THEN graceful degradation to simplified version SHALL occur

#### Visual Reference

- Three.js WebGPU examples: `webgpu_tsl_raging_sea`, `webgpu_compute_particles_rain`
- Shadertoy: "Nebula" by iq, "Clouds" by nimitz

---

### Requirement 3: NebulaComponent - TSL Procedural Billboards

**User Story**: As a demo viewer, I want cloud sprites that have organic, procedurally-generated textures instead of canvas-rendered static textures.

#### Current State (to be replaced)

- Canvas-generated fractal noise textures (CPU)
- Static texture applied to sprites
- Fixed appearance after generation

#### Target State (WebGPU-native)

- **TSL-generated procedural texture** in shader
- **Animated noise** for living, breathing clouds
- **Per-sprite variation** via instance attributes
- No Canvas API dependency

#### Acceptance Criteria

1. WHEN sprite renders THEN texture SHALL be procedurally generated in TSL
2. WHEN time progresses THEN cloud appearance SHALL subtly animate
3. WHEN multiple sprites exist THEN each SHALL have unique variation
4. WHEN disposed THEN no texture resources SHALL leak

---

### Requirement 4: CloudLayerComponent - GPU Compute Clouds

**User Story**: As a demo viewer, I want atmospheric clouds that flow realistically with proper fog integration and depth.

#### Current State (to be replaced)

- Merged geometry with GLSL ShaderMaterial
- Fog calculated in fragment shader
- Static cloud positions

#### Target State (WebGPU-native)

- **TSL fog integration** with scene fog
- **GPU-computed cloud density** via noise
- **Animated positions** for endless scrolling
- **Depth-based alpha** for proper layering

#### Acceptance Criteria

1. WHEN clouds render THEN fog blending SHALL match scene fog color
2. WHEN time progresses THEN clouds SHALL scroll seamlessly
3. WHEN camera moves THEN parallax effect SHALL be visible
4. WHEN depth varies THEN nearer clouds SHALL be more opaque

---

### Requirement 5: SmokeTroikaTextComponent - TSL Animated Smoke

**User Story**: As a demo viewer, I want text that emerges dramatically from flowing smoke with proper volumetric appearance.

#### Current State (to be replaced)

- Plane overlay with GLSL smoke shader
- Domain-warped noise (same as nebula)
- Fixed relationship to text

#### Target State (WebGPU-native)

- **TSL smoke generation** using shared noise utilities
- **Text-aware density** that wraps around letters
- **Animated flow** that responds to text shape
- **Proper depth sorting** with text mesh

#### Acceptance Criteria

1. WHEN smoke renders THEN it SHALL flow around text boundaries
2. WHEN time progresses THEN smoke SHALL animate continuously
3. WHEN color settings change THEN smoke color SHALL update reactively
4. WHEN text changes THEN smoke SHALL adapt to new shape

---

### Requirement 6: BubbleTextComponent - TSL Physics-Based Reflection

**User Story**: As a demo viewer, I want bubble text that has realistic glass-like reflections and refractions.

#### Current State

- GLSL fresnel shader on instances
- Basic rim lighting effect
- Per-instance random variation

#### Target State (WebGPU-native)

- **TSL fresnel** with proper IOR
- **Environment reflection** sampling
- **Subsurface scattering** for glass effect
- **Rainbow iridescence** option

#### Acceptance Criteria

1. WHEN bubbles render THEN fresnel reflections SHALL appear realistic
2. WHEN camera moves THEN reflection angle SHALL update correctly
3. WHEN environment map provided THEN reflections SHALL sample it
4. WHEN `enableIridescence=true` THEN rainbow effect SHALL appear

---

### Requirement 7: MetaballComponent - TSL Ray Marching

**User Story**: As a demo viewer, I want metaballs with smooth isosurface blending and proper lighting.

#### Current State

- GLSL ray marching (already decent quality)
- Full-screen plane with fragment shader

#### Target State (WebGPU-native)

- **TSL ray marching** port of existing GLSL
- **Enhanced lighting** with proper normals
- **Configurable ball count** via uniforms
- **Interactive ball positions** via signals

#### Acceptance Criteria

1. WHEN metaballs render THEN isosurface blending SHALL appear smooth
2. WHEN ball positions change THEN field SHALL update reactively
3. WHEN lighting enabled THEN proper surface normals SHALL be calculated
4. WHEN on WebGL fallback THEN effect SHALL degrade gracefully

---

### Requirement 8: StarFieldComponent - GPU Procedural Stars

**User Story**: As a demo viewer, I want a star field with GPU-computed twinkle, varied sizes, and stellar colors that performs efficiently.

#### Current State

- Canvas glow texture generation (CPU)
- Points or Sprites with static texture
- Animation via render loop callback

#### Target State (WebGPU-native)

- **TSL procedural glow** in fragment shader
- **GPU-computed twinkle** via time uniform
- **No Canvas API** dependency
- **Per-star attributes** for size/color/twinkle

#### Acceptance Criteria

1. WHEN stars render THEN glow SHALL be generated procedurally in TSL
2. WHEN `enableTwinkle=true` THEN twinkle SHALL be computed on GPU
3. WHEN 10,000+ stars exist THEN performance SHALL remain 60fps
4. WHEN colors vary THEN stellar temperature colors SHALL appear correct

---

### Requirement 9: ShaderMaterialDirective - TSL Node API

**User Story**: As a library user, I want an easy way to create custom TSL materials using Angular inputs.

#### Current State

- Accepts GLSL vertex/fragment strings
- Deprecated but still used

#### Target State (WebGPU-native)

- **NodeMaterial-based** directive
- Accepts **TSL node inputs** for color, position, alpha
- Documentation for custom TSL creation
- Deprecation warning for old API

#### Acceptance Criteria

1. WHEN `a3dNodeMaterial` is used THEN it SHALL accept `[colorNode]` input
2. WHEN `[positionNode]` provided THEN vertex displacement SHALL apply
3. WHEN `a3dShaderMaterial` used THEN deprecation warning SHALL log
4. WHEN custom TSL provided THEN material SHALL compile correctly

---

### Requirement 10: EffectComposerService - Native PostProcessing

**User Story**: As a library developer, I want post-processing that uses native Three.js WebGPU PostProcessing API.

#### Current State

- Uses `three-stdlib` EffectComposer
- GLSL-based passes
- Manual Y-flip correction for WebGL

#### Target State (WebGPU-native)

- **THREE.PostProcessing** class
- **TSL-based nodes** for effects
- Native WebGPU pipeline
- Automatic WebGL fallback

#### Acceptance Criteria

1. WHEN effects enabled THEN `THREE.PostProcessing` SHALL be used
2. WHEN `bloom()` added THEN TSL bloom node SHALL apply
3. WHEN disabled THEN standard rendering SHALL resume
4. WHEN on WebGL THEN fallback implementation SHALL work

---

### Requirement 11-13: Bloom, DOF, ColorGrading Effects

**User Story**: As a demo viewer, I want post-processing effects that work natively with WebGPU.

#### Bloom Effect

- Use TSL `bloom(scenePass, { threshold, strength, radius })`
- HDR-aware glow on bright objects

#### DOF Effect

- Use TSL `dof(scenePass, { focus, aperture, maxBlur })`
- Cinematic depth blur

#### Color Grading Effect

- Use TSL `saturation()`, `contrast()`, `brightness()` nodes
- Film-like color manipulation

#### Acceptance Criteria

1. WHEN bloom enabled THEN bright objects SHALL glow
2. WHEN DOF enabled THEN out-of-focus areas SHALL blur
3. WHEN color grading enabled THEN colors SHALL be adjusted
4. WHEN all combined THEN effects SHALL compose correctly

---

### Requirement 14: SSAO Effect Decision

**User Story**: As a library developer, I want a clear decision on SSAO for WebGPU.

#### Options

- **A**: Custom TSL SSAO (HIGH effort, 15-20h)
- **B**: WebGL-only with graceful disable on WebGPU
- **C**: Remove for v1, document as future enhancement

#### Recommendation

**Option B** for now - SSAO is complex and TSL doesn't have built-in support. Log warning and disable on WebGPU, keep three-stdlib implementation for WebGL.

---

## Non-Functional Requirements

### Performance Requirements

| Metric              | Target                   | Measurement Method           |
| ------------------- | ------------------------ | ---------------------------- |
| Frame rate          | ≥60 FPS with all effects | Browser DevTools FPS counter |
| GPU utilization     | <70% on mid-range GPUs   | GPU profiler                 |
| Memory usage        | No increase from current | Browser memory profiler      |
| Shader compile time | <1s for all components   | Console timing logs          |

### Visual Quality Requirements

| Component          | Current Quality | Target Quality | Reference         |
| ------------------ | --------------- | -------------- | ----------------- |
| Nebula volumetrics | ⭐⭐            | ⭐⭐⭐⭐⭐     | Three.js examples |
| Cloud layers       | ⭐⭐            | ⭐⭐⭐⭐       | MrDoob reference  |
| Smoke effects      | ⭐⭐            | ⭐⭐⭐⭐       | Organic, flowing  |
| Star field         | ⭐⭐            | ⭐⭐⭐⭐       | Natural twinkle   |
| Post-processing    | ⭐⭐            | ⭐⭐⭐⭐⭐     | Cinematic quality |

### Compatibility Requirements

| Browser      | WebGPU | WebGL Fallback | Expected Quality |
| ------------ | ------ | -------------- | ---------------- |
| Chrome 113+  | Yes    | Yes            | Full quality     |
| Edge 113+    | Yes    | Yes            | Full quality     |
| Firefox 118+ | Exp.   | Yes            | Reduced quality  |
| Safari 18+   | Ltd.   | Yes            | Reduced quality  |

---

## Risk Analysis

### Technical Risks

| Risk                         | Probability | Impact | Mitigation                               |
| ---------------------------- | ----------- | ------ | ---------------------------------------- |
| TSL noise doesn't match GLSL | Medium      | Medium | Research phase, extensive testing        |
| Ray marching too slow        | Low         | High   | LOD system, reduce march steps           |
| WebGL fallback visual gap    | High        | Medium | Accept differences, document             |
| GPU compute not available    | Low         | Medium | Fallback to fragment-only implementation |

### Research Unknowns

| Unknown                      | Research Focus                           |
| ---------------------------- | ---------------------------------------- |
| TSL noise functions          | `mx_noise`, custom implementations       |
| GPU ray marching in TSL      | Three.js examples, custom implementation |
| PostProcessing API stability | Three.js r173+ documentation             |
| WebGL fallback behavior      | Test all components without WebGPU       |

---

## Success Metrics

| Metric                      | Target                  | Measurement             |
| --------------------------- | ----------------------- | ----------------------- |
| Demo renders without errors | 100%                    | No console errors       |
| Visual quality improvement  | Noticeable "wow factor" | User feedback           |
| WebGPU quality level        | Match Three.js examples | Side-by-side comparison |
| Performance maintained      | ≥60 FPS                 | Performance panel       |
| WebGL fallback works        | All components render   | Firefox testing         |

---

## Implementation Order (Recommended)

1. **Research Phase** (8-12h)

   - TSL noise patterns and functions
   - GPU ray marching techniques
   - PostProcessing API

2. **TSL Utilities** (8-10h)

   - Noise functions
   - Common helpers
   - Export architecture

3. **Effect Elevation - Wave 1** (20-25h)

   - NebulaVolumetricComponent (GPU volumetrics)
   - CloudLayerComponent (TSL fog integration)
   - StarFieldComponent (GPU procedural)

4. **Effect Elevation - Wave 2** (15-20h)

   - SmokeTroikaTextComponent (TSL smoke)
   - BubbleTextComponent (TSL fresnel)
   - NebulaComponent (TSL billboards)

5. **Directive & Infrastructure** (10-12h)

   - MetaballComponent (TSL port)
   - ShaderMaterialDirective (NodeMaterial API)

6. **Post-Processing** (12-15h)
   - EffectComposerService (native API)
   - Bloom, DOF, ColorGrading effects
   - SSAO decision implementation

---

## Verification Plan

### Automated Tests

```bash
# Unit tests for all migrated components
npx nx test angular-3d

# Build verification
npx nx build angular-3d

# E2E test
npx nx e2e angular-3d-demo-e2e
```

### Manual Verification

1. **Visual Quality Assessment**: Compare before/after screenshots
2. **Performance Benchmarking**: FPS comparison in Performance panel
3. **Cross-Browser Testing**: Chrome (WebGPU), Firefox (WebGL)
4. **Effect Comparison**: Side-by-side with Three.js examples

---

## Document History

| Version | Date       | Author          | Changes                                                 |
| ------- | ---------- | --------------- | ------------------------------------------------------- |
| 1.0     | 2025-12-28 | Project Manager | Initial requirements (migration focus)                  |
| 2.0     | 2025-12-28 | Project Manager | **Enhanced scope: WebGPU elevation, research required** |
