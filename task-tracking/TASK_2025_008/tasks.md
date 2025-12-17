# Development Tasks - TASK_2025_008

**Task Type**: Frontend (3D Graphics)
**Total Tasks**: 18
**Total Batches**: 5
**Batching Strategy**: Component-based (Related components grouped together)
**Status**: 2/5 batches complete (40%)

---

## Batch 1: Foundation - GLTF Model + Star Field ✅ COMPLETE

**Assigned To**: Frontend Developer
**Tasks in Batch**: 4
**Dependencies**: None (builds on existing loaders from TASK_2025_004)
**Estimated Commits**: 1 (one commit for entire batch)

### Task 1.1: Implement GLTF Model Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`
**Specification Reference**: implementation-plan.md:11-148
**Pattern to Follow**:

- `box.component.ts:1-115` (lifecycle, signals, NG_3D_PARENT)
- `gltf-loader.service.ts:109-182` (loader API)

**Expected Commit Pattern**: `feat(angular-3d): add gltf model and star field components`

**Quality Requirements**:

- ✅ Signal inputs: `modelPath` (required), `position`, `rotation`, `scale`, `useDraco`
- ✅ Material override inputs: `colorOverride`, `metalness`, `roughness`
- ✅ Inject `GltfLoaderService` and `NG_3D_PARENT`
- ✅ Load model in `ngOnInit` with polling pattern
- ✅ Apply transforms via `effect()` (reactive)
- ✅ Apply material overrides via traversal
- ✅ Clone GLTF scene for multiple instances
- ✅ Proper disposal in `ngOnDestroy`
- ✅ OnPush change detection

**Implementation Details**:

- **Imports**: `GltfLoaderService`, `NG_3D_PARENT`, `THREE`
- **Decorators**: `@Component({ selector: 'a3d-gltf-model', standalone: true, changeDetection: OnPush, template: '' })`
- **Example Files**: `box.component.ts`, `inject-texture-loader.ts:105-125`

---

### Task 1.2: Implement GLTF Model Component Tests ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/gltf-model.component.spec.ts`
**Dependencies**: Task 1.1 (GltfModelComponent must exist)
**Pattern to Follow**: `box.component.spec.ts`

**Quality Requirements**:

- ✅ Test component creation
- ✅ Test NG_3D_PARENT injection
- ✅ Test loader service injection
- ✅ Mock GltfLoaderService.load()
- ✅ Test group added to parent
- ✅ Test disposal in ngOnDestroy

---

### Task 1.3: Implement Star Field Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/star-field.component.ts`
**Specification Reference**: implementation-plan.md:151-251
**Pattern to Follow**: `box.component.ts:1-115`

**Quality Requirements**:

- ✅ Signal inputs: `starCount`, `radius`, `color`, `size`, `opacity`
- ✅ Inline spherical distribution function (no `maath` dependency)
- ✅ Computed positions signal
- ✅ Create `BufferGeometry` with position attribute
- ✅ Create `PointsMaterial` with transparency
- ✅ Create `Points` object
- ✅ Set `frustumCulled = false`
- ✅ Inject `NG_3D_PARENT` and add to parent
- ✅ Proper disposal of geometry and material

**Implementation Details**:

- **Helper Function**: `generateStarPositions(count, radius): Float32Array`
- **Three.js Objects**: `BufferGeometry`, `PointsMaterial`, `Points`
- **No External Deps**: Inline sphere distribution using Math.random()

---

### Task 1.4: Implement Star Field Component Tests ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/star-field.component.spec.ts`
**Dependencies**: Task 1.3 (StarFieldComponent must exist)

**Quality Requirements**:

- ✅ Test component creation
- ✅ Test Points object created
- ✅ Test BufferGeometry has position attribute
- ✅ Test material properties (color, size, opacity)
- ✅ Test added to parent
- ✅ Test disposal

---

**Batch 1 Verification Requirements**:

- ✅ All 4 files exist at specified paths
- ✅ One git commit for entire batch
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Tests pass: `npx nx test angular-3d --testNamePattern="(GltfModel|StarField)Component"`
- ✅ No compilation errors
- ✅ No `angular-three` imports (lint check)

---

## Batch 2: Celestial Objects - Planet + Nebula ✅ COMPLETE

**Assigned To**: Frontend Developer
**Tasks in Batch**: 4
**Dependencies**: Batch 1 complete (shares patterns)
**Estimated Commits**: 1

### Task 2.1: Implement Planet Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/planet.component.ts`
**Specification Reference**: implementation-plan.md:254-348
**Pattern to Follow**:

- `box.component.ts:1-115` (mesh creation)
- `inject-texture-loader.ts:62-142` (texture loading)

**Expected Commit Pattern**: `feat(angular-3d): add planet and nebula components`

**Quality Requirements**:

- ✅ Signal inputs: `position`, `radius`, `segments`, `textureUrl`, `color`, `metalness`, `roughness`
- ✅ Glow inputs: `glowIntensity`, `glowColor`
- ✅ Use `injectTextureLoader()` for reactive texture loading
- ✅ Create `SphereGeometry` with segments
- ✅ Create `MeshStandardMaterial` with texture map
- ✅ Optional `PointLight` for glow effect
- ✅ Shadow casting/receiving enabled
- ✅ Inject `NG_3D_PARENT`, add mesh and light
- ✅ Dispose geometry, material, light

**Implementation Details**:

- **Texture Loading**: `const texture = computed(() => this.textureUrl() ? injectTextureLoader(() => this.textureUrl()!) : null)`
- **Conditional Glow**: Create `PointLight` only if `glowIntensity() > 0`

---

### Task 2.2: Implement Planet Component Tests ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/planet.component.spec.ts`
**Dependencies**: Task 2.1

**Quality Requirements**:

- ✅ Test SphereGeometry creation
- ✅ Mock texture loader
- ✅ Test PointLight creation when glow > 0
- ✅ Test no light when glow = 0
- ✅ Test disposal

---

### Task 2.3: Implement Nebula Component ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/nebula.component.ts`
**Specification Reference**: implementation-plan.md:355-358
**Pattern to Follow**: `temp/nebula.component.ts:72-221` (simplified)

**Quality Requirements**:

- ✅ Signal inputs: `position`, `cloudCount`, `radius`, `color`, `opacity`, `minSize`, `maxSize`
- ✅ Generated procedural cloud texture (canvas-based)
- ✅ Create multiple `Sprite` objects with cloud texture
- ✅ Use `SpriteMaterial` with additive blending
- ✅ Group sprites in `THREE.Group`
- ✅ Spherical distribution for sprite positions
- ✅ Inject `NG_3D_PARENT`, add group
- ✅ Dispose sprites, materials, texture

**Implementation Details**:

- **Texture Generation**: Canvas-based fractal noise (no `maath.random.noise`, use simple gradient)
- **Sprite Creation**: Loop to create multiple sprites with varying sizes/opacity
- **Simplified Approach**: Radial gradient falloff instead of complex fractal noise

---

### Task 2.4: Implement Nebula Component Tests ✅ COMPLETE

**File(s)**: `libs/angular-3d/src/lib/primitives/nebula.component.spec.ts`
**Dependencies**: Task 2.3

**Quality Requirements**:

- ✅ Test Group creation
- ✅ Test sprites created based on cloudCount
- ✅ Test texture generation
- ✅ Test additive blending
- ✅ Test disposal

---

**Batch 2 Verification Requirements**:

- ✅ All 4 files exist
- ✅ One git commit for entire batch
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Tests pass: `npx nx test angular-3d --testNamePattern="(Planet|Nebula)Component"`

---

## Batch 3: Asset Loaders - Text3D + SVG Icon ⏸️ PENDING

**Assigned To**: Frontend Developer
**Tasks in Batch**: 4
**Dependencies**: Batch 1 complete (shares component patterns)
**Estimated Commits**: 1

### Task 3.1: Implement Text3D Component ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/text-3d.component.ts`
**Specification Reference**: implementation-plan.md:365-369
**Pattern to Follow**: `box.component.ts:1-115`

**Expected Commit Pattern**: `feat(angular-3d): add text3d and svg icon components`

**Quality Requirements**:

- ✅ Signal inputs: `text` (required), `font`, `fontSize`, `height`, `bevelEnabled`, `bevelThickness`, `bevelSize`
- ✅ Material inputs: `color`, `metalness`, `roughness`
- ✅ Import `TextGeometry` from `three/addons/geometries/TextGeometry.js`
- ✅ Import `FontLoader` from `three/addons/loaders/FontLoader.js`
- ✅ Load font asynchronously in `ngOnInit`
- ✅ Create `TextGeometry` with loaded font
- ✅ Create `MeshStandardMaterial`
- ✅ Create `Mesh` and add to parent
- ✅ Dispose geometry and material

**Implementation Details**:

- **Font URL**: Default to Three.js helvetiker typeface JSON
- **Async Loading**: Use `FontLoader.load()` with callback
- **Geometry Creation**: `new TextGeometry(text, { font, size, height, bevelEnabled, ... })`

---

### Task 3.2: Implement Text3D Component Tests ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/text-3d.component.spec.ts`
**Dependencies**: Task 3.1

**Quality Requirements**:

- ✅ Mock FontLoader
- ✅ Test TextGeometry creation
- ✅ Test mesh creation after font loads
- ✅ Test disposal

---

### Task 3.3: Implement SVG Icon Component ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/svg-icon.component.ts`
**Specification Reference**: implementation-plan.md:371-375
**Pattern to Follow**: `box.component.ts:1-115`

**Quality Requirements**:

- ✅ Signal inputs: `svgPath` (required), `depth`, `color`, `scale`
- ✅ Import `SVGLoader` from `three/addons/loaders/SVGLoader.js`
- ✅ Load SVG asynchronously in `ngOnInit`
- ✅ Extrude SVG paths to 3D using `ExtrudeGeometry`
- ✅ Create meshes for each path
- ✅ Group meshes in `THREE.Group`
- ✅ Inject `NG_3D_PARENT`, add group
- ✅ Dispose geometries and materials

**Implementation Details**:

- **SVG Loading**: `SVGLoader.load(svgPath, callback)`
- **Path Extrusion**: Loop through `data.paths`, create `Shape`, extrude with `ExtrudeGeometry`
- **Group**: Contains all path meshes

---

### Task 3.4: Implement SVG Icon Component Tests ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/svg-icon.component.spec.ts`
**Dependencies**: Task 3.3

**Quality Requirements**:

- ✅ Mock SVGLoader
- ✅ Test group creation
- ✅ Test meshes created from paths
- ✅ Test disposal

---

**Batch 3 Verification Requirements**:

- ✅ All 4 files exist
- ✅ One git commit for entire batch
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Tests pass: `npx nx test angular-3d --testNamePattern="(Text3D|SvgIcon)Component"`

---

## Batch 4: Utilities - Particle System + Scene Lighting ⏸️ PENDING

**Assigned To**: Frontend Developer
**Tasks in Batch**: 4
**Dependencies**: Batch 1 complete (ParticleSystem similar to StarField)
**Estimated Commits**: 1

### Task 4.1: Implement Particle System Component ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/particle-system.component.ts`
**Specification Reference**: implementation-plan.md:360-363
**Pattern to Follow**: `star-field.component.ts` (same structure)

**Expected Commit Pattern**: `feat(angular-3d): add particle system and scene lighting components`

**Quality Requirements**:

- ✅ Signal inputs: `count`, `size`, `color`, `opacity`, `spread`, `distribution`
- ✅ Customizable distribution patterns (sphere, box, cone)
- ✅ Create `BufferGeometry` with positions
- ✅ Create `PointsMaterial`
- ✅ Create `Points`
- ✅ Inject `NG_3D_PARENT`, add to parent
- ✅ Dispose geometry and material

**Implementation Details**:

- **Distribution Functions**: `generateSpherePositions()`, `generateBoxPositions()`, `generateConePositions()`
- **Computed Positions**: Based on `distribution` input

---

### Task 4.2: Implement Particle System Component Tests ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/particle-system.component.spec.ts`
**Dependencies**: Task 4.1

**Quality Requirements**:

- ✅ Test Points creation
- ✅ Test different distributions (sphere, box, cone)
- ✅ Test disposal

---

### Task 4.3: Implement Scene Lighting Component ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/scene-lighting.component.ts`
**Specification Reference**: implementation-plan.md:377-381
**Pattern to Follow**: Composite pattern (uses existing light components)

**Quality Requirements**:

- ✅ Signal input: `preset` ('studio' | 'outdoor' | 'dramatic' | 'custom')
- ✅ Override inputs: `ambientIntensity`, `directionalIntensity`, `pointLights`
- ✅ Create light objects based on preset
- ✅ Studio: Ambient + 2 DirectionalLights (key, fill)
- ✅ Outdoor: Ambient + 1 DirectionalLight (sun)
- ✅ Dramatic: Low ambient + 1 SpotLight
- ✅ Apply overrides to preset values
- ✅ Inject `NG_3D_PARENT`, add all lights
- ✅ Dispose all lights

**Implementation Details**:

- **Preset Configurations**: Object mapping preset names to light configs
- **Light Creation**: Create `AmbientLight`, `DirectionalLight`, `SpotLight` based on config
- **Group**: All lights in array for disposal

---

### Task 4.4: Implement Scene Lighting Component Tests ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/scene-lighting.component.spec.ts`
**Dependencies**: Task 4.3

**Quality Requirements**:

- ✅ Test preset configurations
- ✅ Test studio preset creates correct lights
- ✅ Test outdoor preset
- ✅ Test overrides applied
- ✅ Test disposal of all lights

---

**Batch 4 Verification Requirements**:

- ✅ All 4 files exist
- ✅ One git commit for entire batch
- ✅ Build passes: `npx nx build angular-3d`
- ✅ Tests pass: `npx nx test angular-3d --testNamePattern="(ParticleSystem|SceneLighting)Component"`

---

## Batch 5: Library Exports & Build Verification ⏸️ PENDING

**Assigned To**: Frontend Developer
**Tasks in Batch**: 2
**Dependencies**: Batches 1-4 complete (all components implemented)
**Estimated Commits**: 1

### Task 5.1: Update Primitives Index ⏸️ PENDING

**File(s)**: `libs/angular-3d/src/lib/primitives/index.ts`
**Specification Reference**: implementation-plan.md:387-408

**Expected Commit Pattern**: `feat(angular-3d): export advanced primitive components`

**Quality Requirements**:

- ✅ Add exports for all 8 new components
- ✅ Maintain alphabetical order
- ✅ No duplicate exports

**Changes**:

```typescript
// Add after existing exports
export * from './gltf-model.component';
export * from './nebula.component';
export * from './particle-system.component';
export * from './planet.component';
export * from './scene-lighting.component';
export * from './star-field.component';
export * from './svg-icon.component';
export * from './text-3d.component';
```

---

### Task 5.2: Verify Build & Lint ⏸️ PENDING

**File(s)**: N/A (verification only)
**Dependencies**: Task 5.1

**Quality Requirements**:

- ✅ Library builds successfully: `npx nx build angular-3d`
- ✅ All tests pass: `npx nx test angular-3d`
- ✅ Lint passes: `npx nx lint angular-3d`
- ✅ No `angular-three` imports detected
- ✅ All 8 components exported from library

**Verification Commands**:

```bash
# Build
npx nx build angular-3d

# Test all new components
npx nx test angular-3d --testNamePattern="(GltfModel|StarField|Planet|Nebula|Text3D|SvgIcon|ParticleSystem|SceneLighting)Component"

# Lint
npx nx lint angular-3d

# Check for angular-three imports (should return nothing)
grep -r "angular-three" libs/angular-3d/src/lib/primitives/*.ts || echo "✅ No angular-three imports"
```

---

**Batch 5 Verification Requirements**:

- ✅ Exports file updated
- ✅ One git commit for batch
- ✅ Build passes without errors
- ✅ All tests pass (100% of new component tests)
- ✅ Lint passes with no errors
- ✅ Library can be imported by consumers

---

## Batch Execution Protocol

**For Each Batch**:

1. Team-leader assigns entire batch to frontend developer
2. Developer executes ALL tasks in batch (in sequential order)
3. Developer stages files progressively: `git add <file>` after each task
4. Developer creates ONE commit for entire batch after all tasks complete
5. Developer returns with batch git commit SHA
6. Team-leader verifies entire batch
7. If verification passes: Mark batch complete, assign next batch
8. If verification fails: Create fix tasks

**Commit Strategy**:

- ONE commit per batch (not per task)
- Commit message follows conventional commits
- Example: `feat(angular-3d): add gltf model and star field components`
- Avoids running pre-commit hooks multiple times

**Completion Criteria**:

- All batch statuses are "✅ COMPLETE"
- All batch commits verified and in git history
- All 18 files exist at specified paths
- Build passes: `npx nx build angular-3d`
- All tests pass: `npx nx test angular-3d`
- Lint passes: `npx nx lint angular-3d`
