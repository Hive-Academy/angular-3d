# Blueyard.com Technical Analysis Report

## Executive Summary

This report details the technical implementation of blueyard.com's 3D visual experience, providing a comprehensive breakdown of technologies, assets, animations, and effects used. The goal is to map these techniques to our `@hive-academy/angular-3d` and `@hive-academy/angular-gsap` libraries for replication.

---

## 1. Technology Stack

### Framework

- **Nuxt.js 3** (Vue.js SSR framework)
- **TailwindCSS** for styling
- **TypeScript** (bundled)

### 3D Engine

- **Three.js** (bundled, not globally exposed)
- **WebGL 2.0** (OpenGL ES 3.0)
- **GLSL ES 3.00** shaders

### Scroll Library

- **Lenis v1.2.3** - Smooth scroll library
- "Hijacked scroll" pattern (body overflow: hidden)
- Virtual scroll progress tracking

### Asset Loaders

- **Draco Decoder** - Compressed GLB geometry
- **Basis Transcoder** - KTX2 GPU-compressed textures

---

## 2. Page Sections & Visual Themes

| Section                              | CSS Gradient             | Background Colors           | 3D Sphere Style                         |
| ------------------------------------ | ------------------------ | --------------------------- | --------------------------------------- |
| **Landing**                          | Warm peach               | #ffcf9e                     | Glowing orb with particle corona        |
| **Computation & Intelligence**       | `--gradient-computing`   | #6344d5 → #7ba5e6 → #bab8e4 | Plasma/crystalline with swirling trails |
| **Engineering, Aerospace & Defense** | `--gradient-engineering` | #279cfb → #dae6e2 → #ebd7ce | Metallic tech-pattern sphere            |
| **Biology & Chemistry**              | `--gradient-biology`     | #19c9c9 → #c2e7e0 → #119898 | Organic honeycomb/cell sphere           |
| **Crypto**                           | `--gradient-crypto`      | #af7fd2 → #f9aab8 → #ede8e9 | Network constellation sphere            |
| **Who We Are**                       | `--gradient-team`        | #f3cdff → #ff86f4 → #c489fa | Disco ball with reflective facets       |

---

## 3. 3D Assets

### 3D Models (.glb with Draco compression)

| Asset                            | Section     | Description                    |
| -------------------------------- | ----------- | ------------------------------ |
| `computing.glb`                  | Computation | Main sphere with plasma effect |
| `engineering-orb.glb`            | Engineering | Tech-patterned metallic sphere |
| `engineering-orb-gaps.glb`       | Engineering | Sphere with circuit-like gaps  |
| `eye.glb`                        | Biology     | Organic eye/cell structure     |
| `crypto-inner-sphere-points.glb` | Crypto      | Inner particle point cloud     |
| `crypto-outer-sphere-points.glb` | Crypto      | Outer particle constellation   |
| `team-ball.glb`                  | Team        | Disco ball mesh                |
| `team-cube.glb`                  | Team        | Cube element                   |

### Textures (.ktx2 GPU-compressed)

| Texture                         | Purpose                                |
| ------------------------------- | -------------------------------------- |
| `normalMapSphere.ktx2`          | Surface detail normal mapping          |
| `studio-env.ktx2`               | Environment map for reflections        |
| `blurry_silver_mirrorball.ktx2` | Disco ball environment reflections     |
| `chrome-ring.ktx2`              | Metallic/chrome material               |
| `hex-normal.ktx2`               | Hexagonal pattern normal map (Biology) |
| `hex-ao.ktx2`                   | Hexagonal ambient occlusion (Biology)  |

---

## 4. Scroll Animation System

### Architecture

```
User Scroll Input
      ↓
Lenis Smooth Scroll (v1.2.3)
      ↓
Virtual Scroll Progress (0-1)
      ↓
Section Detection (data-webgl-section)
      ↓
3D Scene Updates (sphere morph, particles, camera)
      ↓
CSS Gradient Transition (background-color)
```

### Key Observations

1. **Hijacked Scroll**: `body { overflow: hidden }` - DOM doesn't actually scroll
2. **Section Markers**: `data-webgl-section="landing|computing|engineering|biology|crypto|team"`
3. **Progress-Based Animation**: Scroll progress drives:

   - Sphere vertical position (rises with scroll)
   - Particle emission/behavior
   - Background gradient interpolation
   - Sphere morph between states
   - Text reveal animations (SplitText-style transforms)

4. **Section Heights**: `my-75vh` (75% viewport height per section)

---

## 5. Post-Processing Pipeline

### Active Shader Uniforms (from WebGL inspection)

```glsl
// Chromatic Aberration
uniform bool uChromaticAberration;
uniform float uMaxDistort;
uniform float uBendAmount;

// Vignette
uniform bool uVignette;
uniform float uVignetteStrength;
uniform float uVignetteInnerStrength;
uniform float uVignetteOuterStrength;
uniform vec3 uVignetteColor;

// Film Grain
uniform bool uNoise;
uniform float uNoiseStrength;

// Resolution
uniform vec2 uResolution;
uniform vec2 uTexelSize;

// Input texture
uniform sampler2D tDiffuse;
```

### Effects Stack

1. **Render Scene** → tDiffuse texture
2. **Chromatic Aberration** - RGB channel offset (subtle)
3. **Vignette** - Edge darkening with custom color
4. **Film Grain** - Animated noise overlay

---

## 6. Visual Effects Breakdown

### Landing Section - Particle Corona

- **Effect**: Particles emanate from sphere surface
- **Behavior**: Rise upward with scroll, spread outward
- **Color**: Warm peach/orange tones
- **Implementation Approach**:
  - GPU particle system (Points geometry)
  - Velocity based on scroll progress
  - Fade out with distance from sphere

### Computing Section - Plasma Swirls

- **Effect**: Energy trails wrapping around sphere
- **Behavior**: Continuous rotation, intensity tied to scroll
- **Material**: Emissive with fresnel edge glow
- **Implementation Approach**:
  - Line geometry or tube following curves
  - Animated UV offset for flow
  - Bloom post-processing

### Engineering Section - Tech Sphere

- **Effect**: Metallic sphere with circuit patterns
- **Material**: PBR metallic with normal map details
- **Implementation Approach**:
  - Pre-baked normal map for circuit details
  - Environment map reflections
  - Subtle rotation animation

### Biology Section - Organic Cell

- **Effect**: Hexagonal pattern with bioluminescent glow
- **Textures**: hex-normal.ktx2, hex-ao.ktx2
- **Implementation Approach**:
  - Hexagonal normal map
  - Subsurface scattering effect (or fake with fresnel)
  - Inner glow shader

### Crypto Section - Network Constellation

- **Effect**: Points connected by lines, network visualization
- **Assets**: Inner + outer point clouds
- **Implementation Approach**:
  - Points geometry for nodes
  - Line segments for connections
  - Glow/bloom on nodes

### Team Section - Disco Ball

- **Effect**: Mirror ball with light reflections
- **Material**: Highly reflective cubemap
- **Implementation Approach**:
  - Environment map: blurry_silver_mirrorball.ktx2
  - Faceted geometry
  - Light scatter effect

---

## 7. Implementation Mapping to Angular-3D

### ✅ ALREADY AVAILABLE - angular-gsap

| Blueyard Feature         | angular-gsap Component        | Status           |
| ------------------------ | ----------------------------- | ---------------- |
| Lenis smooth scroll      | `LenisSmoothScrollService`    | ✅ **AVAILABLE** |
| Hijacked/virtual scroll  | `HijackedScrollDirective`     | ✅ **AVAILABLE** |
| Scroll step items        | `HijackedScrollItemDirective` | ✅ **AVAILABLE** |
| ScrollTrigger animations | `ScrollAnimationDirective`    | ✅ **AVAILABLE** |
| Section pinning          | `ScrollSectionPinDirective`   | ✅ **AVAILABLE** |
| Scroll progress events   | `progressChange` output       | ✅ **AVAILABLE** |
| Step change events       | `currentStepChange` output    | ✅ **AVAILABLE** |

### ✅ ALREADY AVAILABLE - angular-3d

| Blueyard Feature          | angular-3d Component                      | Status           |
| ------------------------- | ----------------------------------------- | ---------------- |
| Canvas/Renderer           | `Scene3dComponent`                        | ✅ **AVAILABLE** |
| GLB/GLTF Loading          | `GltfLoaderService`                       | ✅ **AVAILABLE** |
| **Draco Compression**     | `GltfLoaderService` (useDraco: true)      | ✅ **AVAILABLE** |
| Particle Systems          | `ParticleSystemComponent`                 | ✅ **AVAILABLE** |
| Post-processing Pipeline  | `EffectComposerService`                   | ✅ **AVAILABLE** |
| Bloom/Glow Effect         | `BloomEffectComponent`                    | ✅ **AVAILABLE** |
| Depth of Field            | `DofEffectComponent`                      | ✅ **AVAILABLE** |
| Ambient Occlusion         | `SsaoEffectComponent`                     | ✅ **AVAILABLE** |
| **Vignette Effect**       | `ColorGradingEffectComponent`             | ✅ **AVAILABLE** |
| Saturation/Contrast       | `ColorGradingEffectComponent`             | ✅ **AVAILABLE** |
| Environment Maps          | `EnvironmentComponent`                    | ✅ **AVAILABLE** |
| Fog                       | `FogComponent`                            | ✅ **AVAILABLE** |
| **Noise Functions (TSL)** | `mx_fractal_noise_float`, `mx_noise_vec3` | ✅ **AVAILABLE** |
| Fresnel Effects           | `tslFresnel` in tsl-utilities             | ✅ **AVAILABLE** |
| Sphere/Box/Primitives     | All primitive components                  | ✅ **AVAILABLE** |
| Glow Effects              | `Glow3dDirective`                         | ✅ **AVAILABLE** |

### ❌ Components Needed (Minimal)

| Feature              | Proposed Component                   | Priority | Effort                          |
| -------------------- | ------------------------------------ | -------- | ------------------------------- |
| Chromatic Aberration | `ChromaticAberrationEffectComponent` | LOW      | Small (TSL shader)              |
| Film Grain Effect    | `FilmGrainEffectComponent`           | LOW      | Small (use existing noise)      |
| KTX2 Texture Loader  | `Ktx2LoaderService`                  | LOW      | Small (Three.js has KTX2Loader) |

### Usage Examples

**Hijacked Scroll (like Blueyard):**

```html
<div hijackedScroll [scrollHeightPerStep]="100" (progressChange)="onScrollProgress($event)" (currentStepChange)="onSectionChange($event)">
  <div hijackedScrollItem slideDirection="up">Section 1</div>
  <div hijackedScrollItem slideDirection="left">Section 2</div>
</div>
```

**Lenis Smooth Scroll:**

```typescript
constructor() {
  afterNextRender(() => {
    this.lenis.initialize({ lerp: 0.08 });
  });
}
```

**Post-Processing with Vignette:**

```html
<a3d-effect-composer>
  <a3d-bloom-effect [intensity]="0.5" />
  <a3d-color-grading-effect [vignette]="0.3" [saturation]="1.1" />
</a3d-effect-composer>
```

**Particle System:**

```html
<a3d-particle-system [count]="5000" [spread]="15" distribution="sphere" [color]="0xff9966" />
```

**GLTF with Draco:**

```typescript
const gltf = await this.gltfLoader.loadAsync('/assets/model.glb', {
  useDraco: true,
});
```

---

## 8. Performance Considerations

### Current Blueyard Performance

- **Canvas Size**: 1920x893 (full viewport)
- **WebGL 2.0**: Modern features enabled
- **Asset Compression**: KTX2 + Draco = fast loading
- **Single Canvas**: All scenes rendered to one canvas

### Optimization Strategies

1. **Lazy Section Loading**: Only load assets for visible/near sections
2. **LOD System**: Reduce geometry detail when scrolling fast
3. **Texture Compression**: Use KTX2/Basis for all textures
4. **Object Pooling**: Reuse particles across sections
5. **RAF Throttling**: Limit updates during rapid scroll

---

## 9. Recommended Implementation Plan

### ✅ Phase 1: Already Complete!

Most functionality is **already available** in our libraries:

- ✅ `HijackedScrollDirective` with Lenis - **DONE**
- ✅ `LenisSmoothScrollService` - **DONE**
- ✅ `ParticleSystemComponent` - **DONE**
- ✅ `GltfLoaderService` with Draco - **DONE**
- ✅ `ColorGradingEffectComponent` with Vignette - **DONE**
- ✅ `BloomEffectComponent` - **DONE**
- ✅ TSL noise functions - **DONE**

### Phase 2: Minor Additions (Priority: LOW, ~1-2 days)

1. **ChromaticAberrationEffectComponent** - TSL shader for RGB channel offset
2. **FilmGrainEffectComponent** - Wrapper around existing `mx_noise_vec3`
3. **Ktx2LoaderService** - Wrap Three.js `KTX2Loader`

### Phase 3: Demo Scene (Priority: MEDIUM)

4. Create Blueyard-inspired demo scene combining:
   - Hijacked scroll with section transitions
   - 3D sphere with particle corona
   - Background gradient transitions tied to scroll progress
   - Post-processing (bloom + vignette + grain)

### Phase 4: Polish (Priority: LOW)

5. Scroll-linked 3D position/rotation helpers
6. Section-based gradient interpolation
7. Performance optimization for mobile

### Estimated Effort

| Item                      | Effort        |
| ------------------------- | ------------- |
| ChromaticAberrationEffect | 2-4 hours     |
| FilmGrainEffect           | 2-4 hours     |
| Ktx2LoaderService         | 2-4 hours     |
| Demo scene                | 1-2 days      |
| **Total**                 | **~3-4 days** |

---

## 10. Key Takeaways

1. **Single 3D Canvas**: One WebGL context, multiple "virtual" scenes
2. **Scroll = Animation Progress**: Everything tied to scroll position
3. **Pre-modeled Assets**: Complex spheres are pre-made GLB files, not procedural
4. **Heavy Post-processing**: 3+ effects stacked (aberration, vignette, grain)
5. **Environment-based Materials**: Reflections via HDR environment maps
6. **Compressed Assets**: KTX2 + Draco for optimal loading
7. **Lenis for Scroll**: Industry-standard smooth scroll library

---

## Appendix: WebGL Capabilities

```json
{
  "renderer": "NVIDIA GeForce RTX 3070",
  "version": "WebGL 2.0 (OpenGL ES 3.0)",
  "shadingLanguage": "WebGL GLSL ES 3.00",
  "maxTextureSize": 16384,
  "maxVertexAttribs": 16,
  "maxTextureImageUnits": 16,
  "supportsFloatTextures": true,
  "supportsFloatLinear": true,
  "extensions": ["EXT_color_buffer_float", "EXT_texture_filter_anisotropic", "OES_texture_float_linear", "WEBGL_compressed_texture_s3tc"]
}
```
