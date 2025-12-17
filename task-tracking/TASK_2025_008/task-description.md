# Requirements Document - TASK_2025_008

## Introduction

This task implements **Advanced Primitive Components** for the `@hive-academy/angular-3d` library. Building on TASK_2025_007 (Core Primitives: Box, Cylinder, Torus, Polyhedron, Lights, Fog, Group), this phase adds complex 3D elements: GLTF models, SVG icons, 3D text, celestial bodies (planets, star fields, nebulae), and particle systems.

These components enable rich 3D scenes for the demo application and provide migration targets for the existing `temp/angular-3d/components/primitives/` implementations that currently depend on `angular-three`.

## Task Classification

- **Type**: FEATURE (New functionality / Porting)
- **Priority**: P1-High (Required for demo app and full library capability)
- **Complexity**: Medium-Complex
- **Estimated Effort**: 6-10 hours

## Workflow Dependencies

- **Research Needed**: No (Patterns established in `temp/` and docs; loaders exist from TASK_2025_004)
- **UI/UX Design Needed**: No
- **Prerequisites**:
  - `TASK_2025_002` (Canvas/Render Loop) ✅
  - `TASK_2025_004` (Loaders - GltfLoaderService, TextureLoaderService) ✅
  - `TASK_2025_007` (Core Primitives - `NG_3D_PARENT` infrastructure) ✅

## Requirements

### Requirement 1: GLTF Model Component

**User Story**: As a developer, I want to declaratively load and display GLTF/GLB 3D models so that I can use external assets in my scenes.

#### Acceptance Criteria

1. WHEN a `modelPath` input is provided THEN the component SHALL load the GLTF model using `GltfLoaderService`
2. WHEN the model loads successfully THEN the model SHALL be added to the parent `Object3D` via `NG_3D_PARENT`
3. WHEN `scale`, `position`, or `rotation` inputs change THEN the model transform SHALL update reactively
4. WHEN the component is destroyed THEN all model resources (geometries, materials, textures) SHALL be disposed
5. WHEN loading fails THEN the error SHALL be handled gracefully without crashing the scene

**Reference**: `temp/angular-3d/components/primitives/gltf-model.component.ts`

---

### Requirement 2: SVG Icon Component

**User Story**: As a developer, I want to render SVG files as 3D extruded shapes so that I can use vector graphics in my 3D scenes.

#### Acceptance Criteria

1. WHEN an `svgPath` input is provided THEN the SVG SHALL be loaded and converted to 3D geometry using `SVGLoader`
2. WHEN `depth` input is specified THEN the SVG paths SHALL be extruded to that depth
3. WHEN `color` or `fillMaterials` are specified THEN the SVG shapes SHALL use those materials
4. WHEN the component is destroyed THEN all geometries and materials SHALL be disposed

**Reference**: `temp/angular-3d/components/primitives/svg-icon.component.ts`

---

### Requirement 3: 3D Text Component

**User Story**: As a developer, I want to render 3D text with proper fonts and beveling so that I can add labels and titles to my scenes.

#### Acceptance Criteria

1. WHEN `text` and `font` inputs are provided THEN the component SHALL render 3D text using `TextGeometry`
2. WHEN `fontSize`, `height`, `bevelEnabled`, `bevelThickness`, `bevelSize` inputs are specified THEN the text geometry SHALL reflect those parameters
3. WHEN material properties (`color`, `metalness`, `roughness`) are specified THEN the text material SHALL use those values
4. WHEN the component is destroyed THEN geometry and material SHALL be disposed

**Reference**: `temp/angular-3d/components/primitives/text-3d.component.ts`

---

### Requirement 4: Planet Component

**User Story**: As a developer, I want to create celestial bodies with optional textures and glow effects so that I can build space-themed scenes.

#### Acceptance Criteria

1. WHEN `radius`, `position`, and `segments` are provided THEN a sphere mesh SHALL be created
2. WHEN `textureUrl` is provided THEN the texture SHALL be loaded via `TextureLoaderService` and applied
3. WHEN `glowIntensity` > 0 THEN a point light SHALL be added around the planet
4. WHEN `rotationSpeed` > 0 THEN the planet SHALL rotate continuously (consider using render loop or GSAP)
5. WHEN the component is destroyed THEN geometry, material, and textures SHALL be disposed

**Reference**: `temp/angular-3d/components/primitives/planet.component.ts`

---

### Requirement 5: Star Field Component

**User Story**: As a developer, I want to create a background of stars using efficient particle systems so that I can build immersive space environments.

#### Acceptance Criteria

1. WHEN `starCount` and `radius` inputs are provided THEN positions SHALL be generated using spherical distribution
2. WHEN rendered THEN the component SHALL use `THREE.Points` with `PointsMaterial` for efficiency
3. WHEN `size`, `opacity`, and `color` inputs are specified THEN the point material SHALL reflect those values
4. WHEN the component is destroyed THEN geometry and material SHALL be disposed

**Reference**: `temp/angular-3d/components/primitives/star-field.component.ts`

---

### Requirement 6: Nebula Component

**User Story**: As a developer, I want to add volumetric nebula effects so that I can create atmospheric cosmic scenes.

#### Acceptance Criteria

1. WHEN `position`, `scale`, and `color` inputs are provided THEN a nebula effect SHALL be rendered
2. WHEN `opacity` and `density` are specified THEN the nebula appearance SHALL reflect those parameters
3. WHEN the component is destroyed THEN all resources SHALL be disposed

**Reference**: `temp/angular-3d/components/primitives/nebula.component.ts`

---

### Requirement 7: Particle System Component

**User Story**: As a developer, I want a reusable particle system component for visual effects.

#### Acceptance Criteria

1. WHEN `count`, `size`, `color` inputs are provided THEN a particle system SHALL render using `THREE.Points`
2. WHEN `spread` and `speed` inputs are specified THEN particles SHALL be distributed and animated accordingly
3. WHEN the component is destroyed THEN geometry and material SHALL be disposed

**Reference**: `temp/angular-3d/components/primitives/particle-system.component.ts`

---

### Requirement 8: Scene Lighting Component (Composite)

**User Story**: As a developer, I want a high-level lighting component that provides preset lighting configurations so that I can quickly set up common lighting scenarios.

#### Acceptance Criteria

1. WHEN `preset` input is provided (e.g., `'studio'`, `'outdoor'`, `'dramatic'`) THEN appropriate lights SHALL be configured
2. WHEN individual light properties are overridden THEN those values SHALL take precedence over preset defaults
3. WHEN the component is destroyed THEN all light resources SHALL be cleaned up

**Reference**: `temp/angular-3d/components/primitives/scene-lighting.component.ts`

---

## Non-Functional Requirements

### Performance

- **OnPush**: All components MUST use `ChangeDetectionStrategy.OnPush`
- **Disposal**: Strict disposal of all Three.js resources (geometries, materials, textures) on component destroy
- **Reactivity**: Use `effect()` for reactive input changes; avoid creating/disposing on every signal change
- **Instancing**: StarField and ParticleSystems should use efficient particle rendering (BufferGeometry + Points)

### Standards

- **Signals**: Use `input()`, `viewChild()`, `computed()`, `effect()`
- **No NGT**: No dependencies on `angular-three` or `angular-three-soba`
- **Hierarchy**: Use `NG_3D_PARENT` injection token for parent-child relationships
- **Selectors**: Use `a3d-` prefix (e.g., `a3d-gltf-model`, `a3d-planet`, `a3d-star-field`)

### Security

- **Asset Loading**: GLTF, SVG, and texture loading should handle CORS and invalid URLs gracefully

### Reliability

- **Error Handling**: All loaders must have try/catch with graceful fallbacks
- **Null Safety**: Guard against undefined parent or missing refs in lifecycle hooks

## Stakeholder Analysis

- **Developers**: Need declarative, typed components for complex 3D elements
- **End Users**: Need smooth, visually appealing 3D scenes (space themes, models, text)

## Risk Analysis

### Technical Risks

**Risk 1**: Font Loading for Text3D

- Probability: Medium
- Impact: Medium
- Mitigation: Use Three.js FontLoader with default bundled font; document font path requirements
- Contingency: Provide simple geometric fallback

**Risk 2**: SVG Complexity

- Probability: Medium
- Impact: Low
- Mitigation: Support basic paths only; document unsupported SVG features
- Contingency: Recommend pre-converted GLTF models for complex icons

**Risk 3**: Particle Performance

- Probability: Low
- Impact: High
- Mitigation: Use BufferGeometry and PointsMaterial; limit default particle counts
- Contingency: Provide `maxParticles` input to cap performance impact

## Dependencies

- **Technical**:
  - `GltfLoaderService` (TASK_2025_004) ✅
  - `TextureLoaderService` (TASK_2025_004) ✅
  - `NG_3D_PARENT` token (TASK_2025_007) ✅
  - Three.js `SVGLoader`, `FontLoader`, `TextGeometry` addons
- **External**: Three.js r150+

## Success Metrics

- All 8 component types implemented and exported from library
- Unit tests verify creation, input reactivity, and disposal for each component
- Build passes without `angular-three` imports
- Demo app can render a scene with GLTF model, 3D text, planet, and star field
