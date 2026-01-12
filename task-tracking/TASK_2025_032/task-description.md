# Requirements Document - TASK_2025_032

## Introduction

This document defines the requirements for implementing **native TSL (Three.js Shading Language) procedural texture generators** in the `@hive-academy/angular-3d` library. TSL textures enable real-time, GPU-accelerated procedural material generation without pre-baked texture files, working on both WebGPU (via WGSL) and WebGL (via GLSL) backends through TSL auto-transpilation.

**Business Value**: Provides library users with a rich collection of procedural textures (marble, wood, rust, space effects, patterns) that enable unique, dynamic 3D materials without requiring external texture assets, reducing load times and enabling infinite variation.

**Reference Implementation**: [tsl-textures](https://github.com/boytchev/tsl-textures) by boytchev (50+ procedural textures)

---

## Task Classification

| Attribute            | Value                                                |
| -------------------- | ---------------------------------------------------- |
| **Type**             | FEATURE                                              |
| **Priority**         | P1 - High (Library Enhancement)                      |
| **Complexity**       | Complex (>8h - multiple textures + utilities + demo) |
| **Estimated Effort** | 16-24 hours                                          |

---

## Workflow Dependencies

| Dependency              | Required? | Rationale                                                  |
| ----------------------- | --------- | ---------------------------------------------------------- |
| **Research Needed**     | No        | Reference implementation (tsl-textures) is well-documented |
| **UI/UX Design Needed** | No        | Textures are code utilities, not visual components         |

---

## Requirements

### Requirement 1: TSL Texture Utilities Module

**User Story**: As a library developer using `@hive-academy/angular-3d`, I want access to TSL utility functions from tsl-textures, so that I can create procedural texture generators that match tsl-textures patterns.

#### Acceptance Criteria

1. WHEN importing from `@hive-academy/angular-3d` THEN the following TSL utilities SHALL be available:

   - `hsl(h, s, l)` - Convert HSL to RGB color
   - `toHsl(rgb)` - Convert RGB to HSL color
   - `spherical(phi, theta)` - Convert angles to point on unit sphere
   - `vnoise(v)` - Simple vector noise function
   - `matRotX/Y/Z(angle)` - Rotation matrix generators
   - `remapExp(x, fromMin, fromMax, toMin, toMax)` - Exponential remap

2. WHEN using TSL texture utilities THEN all functions SHALL:

   - Accept TSL node inputs (float, vec3, etc.)
   - Return TSL nodes for shader composition
   - Work on both WebGPU and WebGL backends

3. WHEN texture utilities are exported THEN TypeScript types SHALL provide full IntelliSense support with JSDoc documentation.

---

### Requirement 2: Space/Sci-Fi Procedural Textures (Priority Tier 1)

**User Story**: As a 3D application developer using `@hive-academy/angular-3d`, I want procedural space/sci-fi textures, so that I can create planets, stars, and cosmic effects without texture files.

#### Acceptance Criteria

1. WHEN using `tslPlanet` texture THEN it SHALL:

   - Generate procedural planet surface with land/water color separation
   - Support configurable `waterLevel`, `landColor`, `waterColor`, `cloudCoverage`
   - Return a colorNode compatible with `MeshStandardNodeMaterial`

2. WHEN using `tslStars` texture THEN it SHALL:

   - Generate starfield with configurable `density`, `size`, `brightness`
   - Support color variation via `colorVariation` parameter
   - Work as background or sprite material colorNode

3. WHEN using `tslCaustics` texture THEN it SHALL:

   - Generate underwater caustic light patterns
   - Support `scale`, `time` (for animation), and `intensity` parameters
   - Animate smoothly when time uniform is updated

4. WHEN using `tslPhotosphere` texture THEN it SHALL:

   - Generate sun/star surface texture with granulation
   - Support `scale`, `temperature` (affects color), and turbulence parameters

5. WHEN any space texture is applied THEN it SHALL render without console errors on both WebGPU and WebGL fallback modes.

---

### Requirement 3: Natural Material Procedural Textures (Priority Tier 2)

**User Story**: As a 3D application developer using `@hive-academy/angular-3d`, I want procedural natural material textures like marble and wood, so that I can create realistic materials without texture files.

#### Acceptance Criteria

1. WHEN using `tslMarble` texture THEN it SHALL:

   - Generate realistic veined marble patterns
   - Support `scale`, `thinness`, `noise`, `color`, `background`, `seed` parameters
   - Match visual quality of reference tsl-textures marble implementation

2. WHEN using `tslWood` texture THEN it SHALL:

   - Generate wood grain with configurable ring patterns
   - Support `scale`, `ringCount`, `color`, `ringColor`, `seed` parameters

3. WHEN using `tslRust` texture THEN it SHALL:

   - Generate oxidation/corrosion patterns
   - Support `amount`, `color`, `pitScale` parameters

4. WHEN using `tslConcrete` texture THEN it SHALL:

   - Generate rough concrete surface texture
   - Support `scale`, `noise`, `color` parameters

5. WHEN any natural material texture is applied THEN output color values SHALL be clamped to valid ranges [0, 1].

---

### Requirement 4: Pattern Procedural Textures (Priority Tier 3)

**User Story**: As a 3D application developer using `@hive-academy/angular-3d`, I want procedural pattern textures, so that I can create decorative and technical surfaces.

#### Acceptance Criteria

1. WHEN using `tslPolkaDots` texture THEN it SHALL:

   - Generate repeating dot patterns on surfaces
   - Support `count`, `size`, `blur`, `color`, `background`, `flat` parameters
   - Work on both 3D surfaces and flat 2D planes

2. WHEN using `tslGrid` texture THEN it SHALL:

   - Generate tech/hologram grid patterns
   - Support `count`, `thickness`, `blur`, `color`, `background` parameters

3. WHEN using `tslVoronoiCells` texture THEN it SHALL:

   - Generate cell-like Voronoi structures
   - Support `scale`, `edgeWidth`, `cellColor`, `edgeColor` parameters

4. WHEN using `tslBricks` texture THEN it SHALL:
   - Generate brick wall patterns
   - Support `scaleX`, `scaleY`, `mortarWidth`, `brickColor`, `mortarColor` parameters

---

### Requirement 5: Shape Modifier Textures (Priority Tier 4)

**User Story**: As a 3D application developer using `@hive-academy/angular-3d`, I want procedural shape modifiers, so that I can deform mesh geometry in real-time.

#### Acceptance Criteria

1. WHEN using `tslSupersphere` shape modifier THEN it SHALL:

   - Deform mesh vertices into supersphere shapes
   - Support `power` parameter controlling curvature
   - Return a positionNode compatible with NodeMaterial

2. WHEN using `tslMelter` shape modifier THEN it SHALL:

   - Create melting/dripping effect on mesh vertices
   - Support `amount`, `direction`, `seed` parameters

3. WHEN any shape modifier is applied THEN normals SHALL be automatically recalculated for correct lighting.

---

### Requirement 6: Demo Showcase Integration

**User Story**: As a library evaluator viewing the demo application, I want to see all procedural textures in action, so that I can understand their capabilities and usage.

#### Acceptance Criteria

1. WHEN navigating to the demo showcase THEN a "TSL Textures" section SHALL display:

   - At least 8 different texture examples
   - Interactive controls for texture parameters
   - Live preview of parameter changes

2. WHEN viewing texture examples THEN each texture SHALL include:
   - Texture name and description
   - Code example showing usage
   - Parameter sliders/inputs for experimentation

---

## Non-Functional Requirements

### Performance Requirements

| Metric                 | Target                                  |
| ---------------------- | --------------------------------------- |
| **Texture Generation** | <16ms per frame at 60fps                |
| **Shader Compilation** | <500ms on first load                    |
| **Memory Usage**       | <5MB additional GPU memory per texture  |
| **Bundle Size**        | <20KB gzipped for all texture utilities |

### Compatibility Requirements

| Platform            | Requirement                              |
| ------------------- | ---------------------------------------- |
| **WebGPU**          | Full functionality with WGSL output      |
| **WebGL**           | Full functionality via TSL GLSL fallback |
| **Browser Support** | Chrome 113+, Firefox 120+, Safari 17+    |

### Code Quality Requirements

| Metric            | Target                                    |
| ----------------- | ----------------------------------------- |
| **TypeScript**    | Strict mode, no `any` types in public API |
| **Documentation** | JSDoc for all exported functions          |
| **Test Coverage** | >80% for texture utility functions        |
| **Lint**          | Zero ESLint errors                        |

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder       | Needs                                | Success Criteria                |
| ----------------- | ------------------------------------ | ------------------------------- |
| **Library Users** | Easy-to-use procedural textures      | <5 min to apply first texture   |
| **3D Developers** | Customizable, high-quality materials | Visual parity with tsl-textures |
| **Demo Visitors** | Impressive showcase of capabilities  | "Wow" factor on first view      |

### Secondary Stakeholders

| Stakeholder             | Needs                    | Success Criteria         |
| ----------------------- | ------------------------ | ------------------------ |
| **Library Maintainers** | Clean, maintainable code | Easy to add new textures |
| **Documentation Team**  | Clear API reference      | Complete JSDoc coverage  |

---

## Risk Analysis

### Technical Risks

| Risk                       | Probability | Impact | Mitigation                            | Contingency                      |
| -------------------------- | ----------- | ------ | ------------------------------------- | -------------------------------- |
| **TSL API Changes**        | Low         | High   | Pin Three.js version, test on updates | Fork critical utilities locally  |
| **WebGL Fallback Issues**  | Medium      | Medium | Test all textures on WebGL            | Document WebGL-only limitations  |
| **Performance Bottleneck** | Low         | High   | Profile during development            | Provide LOD/quality options      |
| **MaterialX Noise Limits** | Low         | Medium | Use proven tsl-textures patterns      | Implement custom noise if needed |

### Technical Complexity

| Component             | Complexity | Notes                         |
| --------------------- | ---------- | ----------------------------- |
| **Utility Functions** | Medium     | Direct port from tsl-textures |
| **Simple Textures**   | Low        | Well-documented reference     |
| **Complex Textures**  | Medium     | May need optimization         |
| **Shape Modifiers**   | High       | Vertex shader modifications   |

---

## Dependencies

### Technical Dependencies

| Dependency      | Version   | Purpose                              |
| --------------- | --------- | ------------------------------------ |
| Three.js        | ^0.170.0  | WebGPU/TSL runtime                   |
| `three/tsl`     | (bundled) | TSL function imports                 |
| `three/webgpu`  | (bundled) | Node material types                  |
| MaterialX Noise | (bundled) | `mx_noise_float`, `mx_fractal_noise` |

### Task Dependencies

| Task ID       | Title                         | Relationship                                        |
| ------------- | ----------------------------- | --------------------------------------------------- |
| TASK_2025_031 | Complete WebGPU TSL Migration | Should complete first for stable TSL infrastructure |

---

## Success Metrics

| Metric                   | Target                       | Measurement Method                  |
| ------------------------ | ---------------------------- | ----------------------------------- |
| **Textures Implemented** | ≥12 procedural textures      | Count of exported texture functions |
| **Documentation**        | 100% JSDoc coverage          | TSDoc validation                    |
| **Demo Showcase**        | ≥8 interactive examples      | Visual inspection                   |
| **Zero Errors**          | No console errors in demo    | Browser console check               |
| **Visual Quality**       | Match tsl-textures reference | Side-by-side comparison             |

---

## Implementation Scope

### In Scope (Prioritized Texture List)

**Tier 1 - Space/Sci-Fi (4 textures)**:

1. `tslPlanet` - Planet surfaces
2. `tslStars` - Starfield backgrounds
3. `tslCaustics` - Underwater light patterns
4. `tslPhotosphere` - Sun surface

**Tier 2 - Natural Materials (4 textures)**: 5. `tslMarble` - Veined marble 6. `tslWood` - Wood grain 7. `tslRust` - Oxidation patterns 8. `tslConcrete` - Rough concrete

**Tier 3 - Patterns (4 textures)**: 9. `tslPolkaDots` - Dot patterns 10. `tslGrid` - Tech grids 11. `tslVoronoiCells` - Cell structures 12. `tslBricks` - Brick walls

**Tier 4 - Shape Modifiers (2 modifiers)**: 13. `tslSupersphere` - Supersphere deformation 14. `tslMelter` - Melting effect

**Core Utilities**:

- `hsl`, `toHsl`, `spherical`, `vnoise`, `matRotX/Y/Z`, `remapExp`

### Out of Scope

- Video generation tools
- Equirectangular texture baking
- Non-Angular pure JavaScript API
- Textures beyond the prioritized 14 (future task)

---

## Architecture Notes

### File Structure

```
libs/angular-3d/src/lib/primitives/shaders/
├── index.ts                 # Updated exports
├── tsl-utilities.ts         # Existing + new utilities
├── tsl-raymarching.ts       # Existing (unchanged)
└── tsl-textures.ts          # NEW: All texture generators
```

### Usage Pattern (Reference: NebulaComponent)

```typescript
// Import texture function
import { tslMarble } from '@hive-academy/angular-3d';

// Create node material
const material = new MeshStandardNodeMaterial();

// Apply texture to colorNode
material.colorNode = tslMarble({
  scale: float(1.2),
  thinness: float(5),
  color: vec3(...new Color('#4545D3').toArray()),
  background: vec3(...new Color('#F0F8FF').toArray()),
  seed: float(0),
});
```

---

## Approval

- [ ] Requirements reviewed by user
- [ ] Scope confirmed as achievable
- [ ] Priority textures agreed upon
