# Development Tasks - TASK_2025_039: Advanced Shader Background System

**Total Tasks**: 8 | **Batches**: 1 | **Status**: 0/1 complete

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- **TSL Shader Utilities Exist**: Verified `tslRayMarch`, `tslSphereDistance`, `tslSmoothUnion`, `tslNormal`, `tslAmbientOcclusion` exist in `libs/angular-3d/src/lib/primitives/shaders/tsl-raymarching.ts`
- **TSL Texture Functions Exist**: Verified `tslCausticsTexture`, `tslStars`, `tslVolumetricParticleCloud` exist in `libs/angular-3d/src/lib/primitives/shaders/tsl-textures/`
- **ViewportPositionDirective Integration**: Verified hostDirective pattern supported in `libs/angular-3d/src/lib/positioning/viewport-position.directive.ts`
- **MetaballComponent Pattern**: Verified TSL material creation pattern exists and can be followed

### Risks Identified

| Risk | Severity | Mitigation |
|------|----------|------------|
| TSL Loop Unrolling Shader Compilation Hang | HIGH | Limit ray march steps to 64 (desktop) / 16 (mobile), max 10 spheres with warnings |
| Fullscreen Scaling Not Reactive to Camera Changes | MEDIUM | Use effect() to watch sceneService.camera() signal, handled in Task 1 |
| Mouse Event Listener Leaks | MEDIUM | Store bound handlers, remove in DestroyRef.onDestroy, handled in all tasks |
| Multiple Ray-Marched Backgrounds Performance | MEDIUM | Document MAX 2 ray-marched backgrounds per scene recommendation |

### Edge Cases to Handle

- [ ] SSR safety (window !== undefined guards) → Handled in all tasks
- [ ] Invalid numeric inputs (sphere count > 10, negative values) → Handled in Task 1 with validation
- [ ] Camera service not available (optional injection) → Handled in all tasks
- [ ] Parent not available (effect guards) → Handled in all tasks

---

## Batch 1: Background Shader Components Implementation 🔄 IMPLEMENTED

**Developer**: frontend-developer
**Tasks**: 8/8 | **Dependencies**: None

### Task 1.1: Create folder structure and barrel export 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\index.ts`
**Spec Reference**: implementation-plan.md:819-833
**Pattern to Follow**: `libs/angular-3d/src/lib/primitives/effects/index.ts`

**Quality Requirements**:

- Create `backgrounds/` folder in correct location (`libs/angular-3d/src/lib/primitives/`)
- Create barrel export file with placeholder exports (will add component exports as they're created)
- Follow existing library barrel export conventions

**Validation Notes**:

- This is the foundation task - all component tasks depend on this folder existing
- Barrel export will initially be empty (exports added incrementally)

**Implementation Details**:

1. Create folder: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\`
2. Create `index.ts` with comment: `// Background shader components will be exported here`
3. Verify folder structure matches library convention (backgrounds/ alongside effects/, shaders/, etc.)

**Files Created**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\index.ts`

**Success Criteria**:

- [ ] Folder created at correct path
- [ ] `index.ts` file created with placeholder comment
- [ ] Folder visible in file explorer
- [ ] Git commit: `feat(angular-3d): add backgrounds folder structure for shader background system`
- [ ] TypeScript compilation succeeds: `npx nx typecheck @hive-academy/angular-3d`

**Acceptance Test**:

```bash
# Verify folder exists
ls "D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds"
# Should show: index.ts
```

---

### Task 1.2: Implement RayMarchedBackgroundComponent 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\ray-marched-background.component.ts`
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:108-326
**Pattern to Follow**: `libs/angular-3d/src/lib/primitives/effects/metaball.component.ts:574-1346`

**Quality Requirements**:

- MUST use `MeshBasicNodeMaterial` with TSL node graphs (NOT `ShaderMaterial` with GLSL)
- MUST import ray marching utilities from `tsl-raymarching.ts`: `tslRayMarch`, `tslSphereDistance`, `tslSmoothUnion`, `tslNormal`, `tslAmbientOcclusion`
- MUST use `ViewportPositionDirective` as hostDirective
- MUST implement device detection for adaptive quality (64 steps desktop, 16 mobile)
- MUST implement fullscreen scaling using camera frustum math
- MUST support mouse tracking with window event listeners (NOT MouseTracking3dDirective)
- MUST dispose all Three.js resources in DestroyRef.onDestroy

**Validation Notes**:

- **Risk**: TSL loop unrolling - MUST limit sphere count to max 10 with console warning
- **Risk**: Event listener leaks - MUST store bound handlers and remove in cleanup
- **Edge Case**: Handle camera service optional injection (fullscreen mode may fail gracefully)
- **Edge Case**: Guard all window access with `typeof window !== 'undefined'`

**Implementation Details**:

1. Create component file with selector `a3d-ray-marched-background`
2. Import TSL utilities: `import * as TSL from 'three/tsl'` and `import { tslRayMarch, tslSphereDistance, tslSmoothUnion, tslNormal, tslAmbientOcclusion } from '../../shaders/tsl-raymarching'`
3. Import directive: `import { ViewportPositionDirective } from '../../../positioning/viewport-position.directive'`
4. Add hostDirective: `hostDirectives: [ViewportPositionDirective]`
5. Define signal inputs:
   - `preset = input<'cosmic' | 'minimal' | 'neon'>('cosmic')`
   - `sphereCount = input<number>(6)`
   - `smoothness = input<number>(0.3)`
   - `enableMouse = input<boolean>(false)`
   - `fullscreen = input<boolean>(true)`
   - `transparent = input<boolean>(true)`
   - `opacity = input<number>(1.0)`
6. Inject dependencies: `NG_3D_PARENT`, `RenderLoopService`, `SceneService (optional: true)`, `DestroyRef`
7. Implement device detection: `isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)`, `isLowPowerDevice = this.isMobile || navigator.hardwareConcurrency <= 4`
8. Create TSL uniform nodes in `createMesh()`:
   - `uTime = uniform(0)`
   - `uResolution = uniform(new Vector2(window.innerWidth, window.innerHeight))`
   - `uMousePosition = uniform(new Vector2(0.5, 0.5))`
   - `uSphereCount = uniform(this.sphereCount())`
   - `uSmoothness = uniform(this.smoothness())`
9. Implement `createTSLMaterial()` method:
   - Choose UV source: `fullscreen() ? screenUV : uv()`
   - Define scene SDF using `tslSphereDistance` and `tslSmoothUnion` with sphere count loop
   - Implement ray marching with adaptive steps: `stepCount = isLowPowerDevice ? float(16) : float(64)`
   - Calculate normals with `tslNormal(hitPoint, sceneSDF)`
   - Calculate ambient occlusion with `tslAmbientOcclusion(hitPoint, normal, sceneSDF, samples)` (2 samples mobile, 6 desktop)
   - Return `MeshBasicNodeMaterial` with `colorNode` assigned
10. Implement mouse tracking (only if `enableMouse()` is true):
    - Store bound handlers: `boundOnPointerMove = this.onPointerMove.bind(this)`
    - Add window event listeners in effect watching `enableMouse()` signal
    - Normalize coordinates: `targetMousePosition.x = event.clientX / window.innerWidth`, `targetMousePosition.y = 1.0 - event.clientY / window.innerHeight`
    - Smooth interpolation in render loop: `mousePosition.lerp(targetMousePosition, 0.1)`
11. Implement fullscreen scaling with `updateFullscreenScale()` method:
    - Get camera from `sceneService?.camera()`
    - Calculate frustum: `planeHeight = 2 * tan(vFov / 2) * distance`, `planeWidth = planeHeight * aspect`
    - Scale mesh: `mesh.scale.set(planeWidth * 1.1, planeHeight * 1.1, 1)` (10% overflow)
    - Position mesh: `mesh.position.set(0, 0, -distance + 0.01)`
    - Use effect to watch camera signal for reactive updates
12. Implement preset configurations:
    - `cosmic`: Dark blue/purple palette, 6 spheres, 0.3 smoothness
    - `minimal`: White/gray palette, 3 spheres, 0.5 smoothness
    - `neon`: Pink/cyan palette, 8 spheres, 0.2 smoothness
13. Add input validation with console warnings:
    - If `sphereCount() > 10`: `console.warn('[RayMarchedBackground] sphereCount clamped to 10')` and clamp to 10
    - If `smoothness() < 0 || smoothness() > 1`: clamp to 0-1 range
14. Implement cleanup in `DestroyRef.onDestroy()`:
    - Call `renderLoopCleanup()` if exists
    - Remove window event listeners (mousemove, touchstart, touchmove, resize)
    - Remove mesh from parent: `this.parent().remove(this.mesh)`
    - Dispose geometry: `this.mesh.geometry.dispose()`
    - Dispose material: `this.material.dispose()`

**Files Created**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\ray-marched-background.component.ts`

**Files Modified**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\index.ts` (add export)

**Success Criteria**:

- [ ] Component file created with 500-600 lines
- [ ] All signal inputs defined with correct types
- [ ] TSL material using `MeshBasicNodeMaterial` (NOT `ShaderMaterial`)
- [ ] Ray marching scene SDF with `tslSphereDistance` and `tslSmoothUnion`
- [ ] `ViewportPositionDirective` in hostDirectives
- [ ] Mouse tracking with window event listeners (only when enableMouse is true)
- [ ] Fullscreen scaling with camera frustum math and reactive effect
- [ ] Device detection reduces steps on mobile (16 vs 64)
- [ ] Input validation with console warnings for sphere count > 10
- [ ] Preset configurations implemented (cosmic, minimal, neon)
- [ ] Resource cleanup in DestroyRef.onDestroy (geometry, material, listeners, parent removal)
- [ ] Export added to `backgrounds/index.ts`
- [ ] Git commit: `feat(angular-3d): add ray marched background component with TSL shaders`
- [ ] TypeScript compilation succeeds: `npx nx typecheck @hive-academy/angular-3d`

**Acceptance Test**:

```typescript
// Developer can test by adding to any scene:
<a3d-ray-marched-background
  preset="cosmic"
  [sphereCount]="6"
  [smoothness]="0.3"
  [enableMouse]="true"
  [fullscreen]="true"
  viewportPosition="center"
  [viewportZ]="-20"
/>
```

---

### Task 1.3: Implement CausticsBackgroundComponent 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\caustics-background.component.ts`
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:329-492
**Pattern to Follow**: `libs/angular-3d/src/lib/primitives/effects/metaball.component.ts:574-645` (TSL texture pattern)

**Quality Requirements**:

- MUST use `tslCausticsTexture` from `tsl-textures/` (verified export)
- MUST use `MeshBasicNodeMaterial` with texture node assigned to `colorNode`
- MUST animate texture using `uTime` uniform updated in render loop
- MUST support color, scale, and speed customization
- MUST use `ViewportPositionDirective` as hostDirective
- MUST implement fullscreen scaling (same pattern as Task 1.2)

**Validation Notes**:

- **Edge Case**: Handle camera service optional injection
- **Edge Case**: Guard window access for SSR safety
- Procedural textures are cheaper than ray marching (60+ FPS expected)

**Implementation Details**:

1. Create component file with selector `a3d-caustics-background`
2. Import texture function: `import { tslCausticsTexture } from '../../shaders/tsl-textures'`
3. Import directive: `import { ViewportPositionDirective } from '../../../positioning/viewport-position.directive'`
4. Add hostDirective: `hostDirectives: [ViewportPositionDirective]`
5. Define signal inputs:
   - `scale = input<number>(2)`
   - `animationSpeed = input<number>(1)`
   - `color = input<string>('#50a8c0')`
   - `fullscreen = input<boolean>(true)`
   - `transparent = input<boolean>(true)`
   - `opacity = input<number>(1.0)`
6. Inject dependencies: `NG_3D_PARENT`, `RenderLoopService`, `SceneService (optional: true)`, `DestroyRef`
7. Create TSL uniform nodes:
   - `uTime = uniform(0)`
   - `uScale = uniform(this.scale())`
   - `uSpeed = uniform(this.animationSpeed())`
   - `uColor = uniform(new Color(this.color()))`
8. Implement `createTSLMaterial()` method:
   - Call `tslCausticsTexture({ scale: uScale, speed: uSpeed, color: uColor, time: uTime, seed: 0 })`
   - Assign result to `material.colorNode`
   - Set material properties: `transparent`, `opacity`, `depthWrite: false`, `depthTest: false`
9. Implement render loop time update: `uTime.value += delta * this.animationSpeed()`
10. Implement effect to update texture parameters when inputs change:
    - Watch `scale()`, `animationSpeed()`, `color()` signals
    - Update corresponding uniform values
11. Implement fullscreen scaling (same as Task 1.2)
12. Implement cleanup (same pattern as Task 1.2)

**Files Created**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\caustics-background.component.ts`

**Files Modified**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\index.ts` (add export)

**Success Criteria**:

- [ ] Component file created with 200-300 lines
- [ ] All signal inputs defined with correct types
- [ ] `tslCausticsTexture` applied to `material.colorNode`
- [ ] Time uniform animated in render loop
- [ ] Color/scale/speed changes update reactively via effect
- [ ] `ViewportPositionDirective` in hostDirectives
- [ ] Fullscreen scaling implemented
- [ ] Resource cleanup in DestroyRef.onDestroy
- [ ] Export added to `backgrounds/index.ts`
- [ ] Git commit: `feat(angular-3d): add caustics background component with procedural texture`
- [ ] TypeScript compilation succeeds: `npx nx typecheck @hive-academy/angular-3d`

**Acceptance Test**:

```typescript
<a3d-caustics-background
  [scale]="2"
  [animationSpeed]="1.5"
  [color]="'#50a8c0'"
  viewportPosition="center"
  [viewportZ]="-50"
/>
```

---

### Task 1.4: Implement VolumetricBackgroundComponent 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\volumetric-background.component.ts`
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:495-584
**Pattern to Follow**: `libs/angular-3d/src/lib/primitives/effects/metaball.component.ts:574-645` (TSL texture pattern)

**Quality Requirements**:

- MUST use `tslVolumetricParticleCloud` from `tsl-textures/` (verified export)
- MUST support density, scattering, and depthFade parameters
- MUST animate fog movement using time uniforms
- MUST use `MeshBasicNodeMaterial`
- MUST use `ViewportPositionDirective` as hostDirective

**Validation Notes**:

- **Performance**: Volumetric textures can be expensive - target 30 FPS mobile, 60 FPS desktop
- Consider adaptive quality (reduce particle density on low-power devices)

**Implementation Details**:

1. Create component file with selector `a3d-volumetric-background`
2. Import texture function: `import { tslVolumetricParticleCloud } from '../../shaders/tsl-textures'`
3. Import directive: `import { ViewportPositionDirective } from '../../../positioning/viewport-position.directive'`
4. Add hostDirective: `hostDirectives: [ViewportPositionDirective]`
5. Define signal inputs:
   - `density = input<number>(0.1)`
   - `scattering = input<number>(0.5)`
   - `depthFade = input<boolean>(true)`
   - `animationSpeed = input<number>(1.0)`
   - `fullscreen = input<boolean>(true)`
   - `transparent = input<boolean>(true)`
   - `opacity = input<number>(1.0)`
6. Inject dependencies (same as Task 1.3)
7. Create TSL uniform nodes:
   - `uTime = uniform(0)`
   - `uDensity = uniform(this.density())`
   - `uScattering = uniform(this.scattering())`
   - `uSpeed = uniform(this.animationSpeed())`
8. Implement `createTSLMaterial()` method:
   - Call `tslVolumetricParticleCloud({ density: uDensity, scattering: uScattering, depthFade: this.depthFade(), time: uTime, speed: uSpeed })`
   - Assign result to `material.colorNode`
9. Implement render loop time update
10. Implement effect for parameter reactivity
11. Implement fullscreen scaling
12. Implement cleanup

**Files Created**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\volumetric-background.component.ts`

**Files Modified**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\index.ts` (add export)

**Success Criteria**:

- [ ] Component file created with 200-300 lines
- [ ] All signal inputs defined with correct types
- [ ] `tslVolumetricParticleCloud` applied to `material.colorNode`
- [ ] Density/scattering/depthFade parameters work
- [ ] Time animation in render loop
- [ ] `ViewportPositionDirective` in hostDirectives
- [ ] Fullscreen scaling implemented
- [ ] Resource cleanup in DestroyRef.onDestroy
- [ ] Export added to `backgrounds/index.ts`
- [ ] Git commit: `feat(angular-3d): add volumetric background component with fog effects`
- [ ] TypeScript compilation succeeds: `npx nx typecheck @hive-academy/angular-3d`

**Acceptance Test**:

```typescript
<a3d-volumetric-background
  [density]="0.1"
  [scattering]="0.5"
  [depthFade]="true"
  viewportPosition="center"
  [viewportZ]="-30"
/>
```

---

### Task 1.5: Implement StarfieldBackgroundComponent 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\starfield-background.component.ts`
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:587-705
**Pattern to Follow**: `libs/angular-3d/src/lib/primitives/effects/metaball.component.ts:706-790` (mouse tracking pattern)

**Quality Requirements**:

- MUST use `tslStars` from `tsl-textures/space.ts` (verified export)
- MUST support density and star size controls
- MUST support optional mouse parallax effect
- MUST integrate mouse position into shader uniforms (NOT use MouseTracking3dDirective)
- MUST implement mouse smoothing with lerp for fluid parallax

**Validation Notes**:

- **Risk**: Event listener leaks - MUST store bound handlers and remove in cleanup
- **Edge Case**: Only add mouse listeners when enableParallax is true
- **Edge Case**: Guard window access for SSR safety

**Implementation Details**:

1. Create component file with selector `a3d-starfield-background`
2. Import texture function: `import { tslStars } from '../../shaders/tsl-textures'`
3. Import directive: `import { ViewportPositionDirective } from '../../../positioning/viewport-position.directive'`
4. Add hostDirective: `hostDirectives: [ViewportPositionDirective]`
5. Define signal inputs:
   - `density = input<number>(100)`
   - `starSize = input<number>(0.5)`
   - `enableParallax = input<boolean>(false)`
   - `parallaxStrength = input<number>(0.2)`
   - `fullscreen = input<boolean>(true)`
   - `transparent = input<boolean>(true)`
   - `opacity = input<number>(1.0)`
6. Inject dependencies (same as Task 1.2)
7. Create mouse tracking state:
   - `mousePosition = new Vector2(0.5, 0.5)`
   - `targetMousePosition = new Vector2(0.5, 0.5)`
8. Create TSL uniform nodes:
   - `uDensity = uniform(this.density())`
   - `uStarSize = uniform(this.starSize())`
   - `uMousePosition = uniform(new Vector2(0.5, 0.5))`
   - `uParallaxStrength = uniform(this.parallaxStrength())`
9. Implement `createTSLMaterial()` method:
   - Call `tslStars({ density: uDensity, starSize: uStarSize, parallax: enableParallax() ? uMousePosition : null, parallaxStrength: uParallaxStrength })`
   - Assign result to `material.colorNode`
10. Implement mouse tracking (only if `enableParallax()` is true):
    - Store bound handlers: `boundOnPointerMove = this.onPointerMove.bind(this)`
    - Add window event listeners in effect watching `enableParallax()` signal
    - Normalize coordinates: `targetMousePosition.x = event.clientX / window.innerWidth`, `targetMousePosition.y = 1.0 - event.clientY / window.innerHeight`
    - Smooth interpolation in render loop: `mousePosition.lerp(targetMousePosition, 0.1)`, `uMousePosition.value = mousePosition`
11. Implement effect for parameter reactivity
12. Implement fullscreen scaling
13. Implement cleanup (including mouse listener removal)

**Files Created**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\starfield-background.component.ts`

**Files Modified**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\index.ts` (add export)

**Success Criteria**:

- [ ] Component file created with 250-350 lines
- [ ] All signal inputs defined with correct types
- [ ] `tslStars` applied to `material.colorNode`
- [ ] Mouse parallax works when enableParallax is true
- [ ] Mouse tracking with window event listeners (only when enabled)
- [ ] Smooth mouse interpolation with lerp
- [ ] `ViewportPositionDirective` in hostDirectives
- [ ] Fullscreen scaling implemented
- [ ] Resource cleanup including mouse listeners
- [ ] Export added to `backgrounds/index.ts`
- [ ] Git commit: `feat(angular-3d): add starfield background component with parallax support`
- [ ] TypeScript compilation succeeds: `npx nx typecheck @hive-academy/angular-3d`

**Acceptance Test**:

```typescript
<a3d-starfield-background
  [density]="100"
  [starSize]="0.5"
  [enableParallax]="true"
  [parallaxStrength]="0.2"
  viewportPosition="center"
  [viewportZ]="-50"
/>
```

---

### Task 1.6: Update main library exports 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts`
**Dependencies**: Tasks 1.2, 1.3, 1.4, 1.5
**Spec Reference**: implementation-plan.md:836-847

**Quality Requirements**:

- MUST add all background component exports to main library index
- MUST follow existing export conventions
- MUST maintain alphabetical ordering within primitives section

**Implementation Details**:

1. Open `libs/angular-3d/src/index.ts`
2. Find the primitives export section
3. Add new export block:
   ```typescript
   // Background shader components
   export {
     RayMarchedBackgroundComponent,
     CausticsBackgroundComponent,
     VolumetricBackgroundComponent,
     StarfieldBackgroundComponent,
   } from './lib/primitives/backgrounds';
   ```
4. Verify all component names match actual exports from `backgrounds/index.ts`

**Files Modified**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts`

**Success Criteria**:

- [ ] All 4 background components exported from main index
- [ ] Export statement uses correct path `'./lib/primitives/backgrounds'`
- [ ] Export names match component exports
- [ ] No duplicate exports
- [ ] Git commit: `feat(angular-3d): export background components from main library index`
- [ ] TypeScript compilation succeeds: `npx nx typecheck @hive-academy/angular-3d`
- [ ] Library builds successfully: `npx nx build @hive-academy/angular-3d`

**Acceptance Test**:

```typescript
// Verify import from library package works:
import { RayMarchedBackgroundComponent, CausticsBackgroundComponent } from '@hive-academy/angular-3d';
```

---

### Task 1.7: Add unit tests for background components 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\*.spec.ts`
**Dependencies**: Tasks 1.2, 1.3, 1.4, 1.5
**Spec Reference**: implementation-plan.md:1050-1101

**Quality Requirements**:

- MUST create spec files for all 4 components
- MUST test component lifecycle (creation, parameter updates, cleanup)
- MUST test resource disposal (geometry, material, event listeners)
- MUST test reactive uniform updates when inputs change
- MUST test device detection (adaptive quality)

**Implementation Details**:

1. Create `ray-marched-background.component.spec.ts`:
   - Test mesh creation on parent availability
   - Test preset configuration applies correctly
   - Test fullscreen scaling calculations
   - Test mouse tracking updates uniforms (when enableMouse is true)
   - Test sphere count validation (warns and clamps > 10)
   - Test adaptive quality (16 steps mobile, 64 desktop)
   - Test resource disposal on destroy
2. Create `caustics-background.component.spec.ts`:
   - Test texture node creation
   - Test color/scale/speed parameter reactivity
   - Test time animation in render loop
   - Test resource disposal
3. Create `volumetric-background.component.spec.ts`:
   - Test density/scattering/depthFade parameters
   - Test volumetric texture node creation
   - Test resource disposal
4. Create `starfield-background.component.spec.ts`:
   - Test density/starSize parameters
   - Test parallax mouse tracking (when enabled)
   - Test mouse listener cleanup
   - Test resource disposal

**Files Created**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\ray-marched-background.component.spec.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\caustics-background.component.spec.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\volumetric-background.component.spec.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\starfield-background.component.spec.ts`

**Success Criteria**:

- [ ] 4 spec files created (one per component)
- [ ] Each spec has minimum 5 test cases
- [ ] Tests verify component lifecycle (create, update, destroy)
- [ ] Tests verify resource cleanup (no memory leaks)
- [ ] Tests verify reactive uniform updates
- [ ] Git commit: `test(angular-3d): add unit tests for background shader components`
- [ ] All tests pass: `npx nx test @hive-academy/angular-3d`

**Acceptance Test**:

```bash
npx nx test @hive-academy/angular-3d
# Should show all background component tests passing
```

---

### Task 1.8: Integrate backgrounds into demo app 🔄 IMPLEMENTED

**File**: `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\backgrounds-showcase\backgrounds-showcase.component.ts`
**Dependencies**: Task 1.6
**Spec Reference**: implementation-plan.md:971-988

**Quality Requirements**:

- MUST create showcase route demonstrating all background types
- MUST show multiple backgrounds at different depth layers
- MUST include interactive parameter controls (sliders, color pickers)
- MUST demonstrate real-world use cases (hero sections, layered compositions)
- MUST verify performance targets (60 FPS desktop, 30 FPS mobile)

**Implementation Details**:

1. Create `backgrounds-showcase.component.ts` in demo app
2. Import all 4 background components from `@hive-academy/angular-3d`
3. Create template sections:
   - **Section 1**: Ray-marched background with preset selector (cosmic/minimal/neon)
   - **Section 2**: Caustics background with color picker and speed slider
   - **Section 3**: Volumetric background with density/scattering controls
   - **Section 4**: Starfield background with parallax toggle
   - **Section 5**: Layered composition (multiple backgrounds at different viewportZ)
4. Add route to demo app: `/backgrounds-showcase`
5. Add navigation link in demo app menu
6. Create interactive controls:
   - Use Angular forms for sliders (sphere count, smoothness, speed, density)
   - Use color input for color customization
   - Use checkboxes for toggles (enableMouse, enableParallax, fullscreen)
7. Add performance monitoring display (show FPS counter)

**Files Created**:

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\backgrounds-showcase\backgrounds-showcase.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\backgrounds-showcase\backgrounds-showcase.component.html`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\backgrounds-showcase\backgrounds-showcase.component.css`

**Files Modified**:

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.routes.ts` (add route)
- Demo app navigation component (add link)

**Success Criteria**:

- [ ] Showcase route created and accessible
- [ ] All 4 background types render correctly
- [ ] Interactive controls update background parameters reactively
- [ ] Multiple backgrounds work at different depth layers (no Z-fighting)
- [ ] Performance meets targets (60 FPS desktop verified in Chrome DevTools)
- [ ] Navigation link added to demo app
- [ ] Git commit: `feat(demo): add backgrounds showcase page with interactive controls`
- [ ] Demo app runs: `npx nx serve angular-3d-demo`
- [ ] Navigate to `/backgrounds-showcase` shows all backgrounds

**Acceptance Test**:

```bash
npx nx serve angular-3d-demo
# Navigate to http://localhost:4200/backgrounds-showcase
# Verify all backgrounds render
# Verify interactive controls work
# Open Chrome DevTools > Performance > Record 5 seconds
# Verify FPS >= 60 (desktop)
```

---

## Batch 1 Verification

**Completion Checklist**:

- [ ] All 8 tasks completed
- [ ] All files created at correct paths
- [ ] All exports added to barrel files
- [ ] Library builds successfully: `npx nx build @hive-academy/angular-3d`
- [ ] All unit tests pass: `npx nx test @hive-academy/angular-3d`
- [ ] Demo app runs: `npx nx serve angular-3d-demo`
- [ ] Backgrounds visible in demo at `/backgrounds-showcase`
- [ ] Code review passed (code-logic-reviewer approved)
- [ ] All git commits created with correct commit message format

---

## Task Summary

| Task ID | Title | Estimated Effort | Dependencies |
|---------|-------|-----------------|--------------|
| 1.1 | Create folder structure | 0.5 hours | None |
| 1.2 | RayMarchedBackgroundComponent | 6 hours | 1.1 |
| 1.3 | CausticsBackgroundComponent | 2 hours | 1.1 |
| 1.4 | VolumetricBackgroundComponent | 2 hours | 1.1 |
| 1.5 | StarfieldBackgroundComponent | 2.5 hours | 1.1 |
| 1.6 | Update library exports | 0.5 hours | 1.2-1.5 |
| 1.7 | Unit tests | 3 hours | 1.2-1.5 |
| 1.8 | Demo integration | 3 hours | 1.6 |

**Total Estimated Effort**: 19.5 hours

---

## Critical Path

```
Task 1.1 (Folder structure)
    ├─→ Task 1.2 (RayMarched) ─┐
    ├─→ Task 1.3 (Caustics) ───┤
    ├─→ Task 1.4 (Volumetric) ─┼─→ Task 1.6 (Exports) ─→ Task 1.8 (Demo)
    └─→ Task 1.5 (Starfield) ──┤                           ↑
                                └─────→ Task 1.7 (Tests) ──┘
```

**Sequential Dependencies**:

1. Task 1.1 MUST complete first (creates folder)
2. Tasks 1.2-1.5 can execute in parallel (independent components)
3. Task 1.6 depends on Tasks 1.2-1.5 (needs components to export)
4. Task 1.7 depends on Tasks 1.2-1.5 (needs components to test)
5. Task 1.8 depends on Task 1.6 (needs library exports)

**Recommended Execution Order**:

1. Task 1.1 (foundation)
2. Task 1.2 (most complex, reference for others)
3. Tasks 1.3, 1.4, 1.5 (simpler, follow same pattern)
4. Task 1.6 (wire up exports)
5. Task 1.7 (add tests)
6. Task 1.8 (demo integration)
