# Implementation Plan - TASK_2025_028

## Full WebGPU Migration for @hive-academy/angular-3d

### Document Information

| Field            | Value                                            |
| ---------------- | ------------------------------------------------ |
| Task ID          | TASK_2025_028                                    |
| Type             | FEATURE (Major Architectural Migration)          |
| Priority         | P1 - High                                        |
| Complexity       | XXL (Extra Extra Large)                          |
| Estimated Effort | 80-100 hours                                     |
| Created          | 2025-12-26                                       |
| Revised          | 2025-12-26 (Complete file inventory - 60+ files) |

---

## 1. Complete File Inventory

### 1.1 Total Files Requiring Migration

**Source files importing from 'three'**: 60 files (excluding spec files)
**Spec files importing from 'three'**: 19 files

### 1.2 Migration Categories

Files are categorized by complexity of migration:

| Category | Description                          | File Count | Complexity |
| -------- | ------------------------------------ | ---------- | ---------- |
| **A**    | Import-only changes                  | 31         | LOW        |
| **B**    | Standard Material to NodeMaterial    | 10         | MEDIUM     |
| **C**    | Custom GLSL to TSL Shader Conversion | 5          | HIGH       |
| **D**    | Post-Processing API Changes          | 5          | HIGH       |
| **E**    | Core Infrastructure                  | 3          | CRITICAL   |

---

## 2. Category A: Import-Only Changes (31 files)

These files only use `import * as THREE from 'three'` for basic THREE.js types (Object3D, Vector3, Color, etc.) and do not create materials. They require only import path changes.

### 2.1 Light Directives (5 files)

| File                                               | Current Import                   | Change Required                         |
| -------------------------------------------------- | -------------------------------- | --------------------------------------- |
| `directives/lights/ambient-light.directive.ts`     | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| `directives/lights/directional-light.directive.ts` | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| `directives/lights/point-light.directive.ts`       | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| `directives/lights/spot-light.directive.ts`        | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| `directives/light.directive.ts`                    | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |

### 2.2 Light Components (1 file with THREE import)

| File                                               | Notes                                              |
| -------------------------------------------------- | -------------------------------------------------- |
| `primitives/lights/ambient-light.component.ts`     | No THREE import (uses directive)                   |
| `primitives/lights/directional-light.component.ts` | No THREE import (uses directive)                   |
| `primitives/lights/point-light.component.ts`       | No THREE import (uses directive)                   |
| `primitives/lights/spot-light.component.ts`        | No THREE import (uses directive)                   |
| `primitives/lights/scene-lighting.component.ts`    | `import * as THREE from 'three'` -> `three/webgpu` |

**Note**: Light components use hostDirectives pattern - most have no THREE imports. Only `scene-lighting.component.ts` needs import update.

### 2.3 Core Directives (6 files)

| File                                        | Current Import                   | Change Required                         |
| ------------------------------------------- | -------------------------------- | --------------------------------------- |
| `directives/mesh.directive.ts`              | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| `directives/group.directive.ts`             | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'` |
| `directives/float-3d.directive.ts`          | Uses `Euler` from 'three'        | `import { Euler } from 'three/webgpu'`  |
| `directives/rotate-3d.directive.ts`         | Uses `Euler` from 'three'        | `import { Euler } from 'three/webgpu'`  |
| `directives/space-flight-3d.directive.ts`   | Uses Vector3, Quaternion         | `import * as THREE from 'three/webgpu'` |
| `directives/mouse-tracking-3d.directive.ts` | Uses Vector2                     | `import * as THREE from 'three/webgpu'` |

### 2.4 Geometry Directives (5 files)

| File                                                     | Current Import      | Change Required                         |
| -------------------------------------------------------- | ------------------- | --------------------------------------- |
| `directives/geometries/box-geometry.directive.ts`        | Uses BufferGeometry | `import * as THREE from 'three/webgpu'` |
| `directives/geometries/cylinder-geometry.directive.ts`   | Uses BufferGeometry | `import * as THREE from 'three/webgpu'` |
| `directives/geometries/sphere-geometry.directive.ts`     | Uses BufferGeometry | `import * as THREE from 'three/webgpu'` |
| `directives/geometries/torus-geometry.directive.ts`      | Uses BufferGeometry | `import * as THREE from 'three/webgpu'` |
| `directives/geometries/polyhedron-geometry.directive.ts` | Uses BufferGeometry | `import * as THREE from 'three/webgpu'` |

### 2.5 Loaders (3 files)

| File                                | Current Import                   | Change Required                                |
| ----------------------------------- | -------------------------------- | ---------------------------------------------- |
| `loaders/texture-loader.service.ts` | `import * as THREE from 'three'` | `import * as THREE from 'three/webgpu'`        |
| `loaders/inject-texture-loader.ts`  | Uses TextureLoader               | `import { TextureLoader } from 'three/webgpu'` |
| `loaders/inject-gltf-loader.ts`     | Uses GLTF types                  | May need type updates                          |

### 2.6 Store & Tokens (4 files)

| File                         | Current Import      | Change Required                                 |
| ---------------------------- | ------------------- | ----------------------------------------------- |
| `store/scene-graph.store.ts` | Uses Object3D types | `import * as THREE from 'three/webgpu'`         |
| `tokens/geometry.token.ts`   | Uses BufferGeometry | `import { BufferGeometry } from 'three/webgpu'` |
| `tokens/material.token.ts`   | Uses Material       | `import { Material } from 'three/webgpu'`       |
| `types/tokens.ts`            | Uses Object3D       | `import { Object3D } from 'three/webgpu'`       |

### 2.7 Services (3 files)

| File                                                 | Current Import        | Change Required                         |
| ---------------------------------------------------- | --------------------- | --------------------------------------- |
| `render-loop/animation.service.ts`                   | Uses Camera, Object3D | `import * as THREE from 'three/webgpu'` |
| `services/advanced-performance-optimizer.service.ts` | Uses various types    | `import * as THREE from 'three/webgpu'` |
| `positioning/viewport-positioning.service.ts`        | Uses Vector3, Box3    | `import * as THREE from 'three/webgpu'` |

### 2.8 Other Components (4 files)

| File                                     | Current Import     | Change Required                         |
| ---------------------------------------- | ------------------ | --------------------------------------- |
| `primitives/fog.component.ts`            | Uses Fog, FogExp2  | `import * as THREE from 'three/webgpu'` |
| `primitives/gltf-model.component.ts`     | Uses GLTF types    | `import * as THREE from 'three/webgpu'` |
| `primitives/environment.component.ts`    | Various types      | `import * as THREE from 'three/webgpu'` |
| `primitives/instanced-mesh.component.ts` | Uses InstancedMesh | `import * as THREE from 'three/webgpu'` |

---

## 3. Category B: Standard Material to NodeMaterial (10 files)

These files create standard materials that need to be replaced with NodeMaterial variants.

### 3.1 Material Directives (3 files)

| File                                                  | Current Material       | Target Material            |
| ----------------------------------------------------- | ---------------------- | -------------------------- |
| `directives/materials/lambert-material.directive.ts`  | `MeshLambertMaterial`  | `MeshLambertNodeMaterial`  |
| `directives/materials/standard-material.directive.ts` | `MeshStandardMaterial` | `MeshStandardNodeMaterial` |
| `directives/materials/physical-material.directive.ts` | `MeshPhysicalMaterial` | `MeshPhysicalNodeMaterial` |

**Migration Pattern**:

```typescript
// OLD
this.material = new THREE.MeshStandardMaterial({
  color,
  metalness,
  roughness,
});

// NEW
import * as THREE from 'three/webgpu';

this.material = new THREE.MeshStandardNodeMaterial();
this.material.color = new THREE.Color(color);
this.material.metalness = metalness;
this.material.roughness = roughness;
```

### 3.2 Glow Directive (1 file)

| File                              | Current Material    | Target Material         |
| --------------------------------- | ------------------- | ----------------------- |
| `directives/glow-3d.directive.ts` | `MeshBasicMaterial` | `MeshBasicNodeMaterial` |

### 3.3 Primitive Components with Standard Materials (6 files)

| File                                      | Current Material                   | Target Material                            | Notes            |
| ----------------------------------------- | ---------------------------------- | ------------------------------------------ | ---------------- |
| `primitives/planet.component.ts`          | `MeshStandardMaterial`             | `MeshStandardNodeMaterial`                 | Texture mapping  |
| `primitives/svg-icon.component.ts`        | `MeshStandardMaterial`             | `MeshStandardNodeMaterial`                 | SVG to mesh      |
| `primitives/star-field.component.ts`      | `PointsMaterial`, `SpriteMaterial` | `PointsNodeMaterial`, `SpriteNodeMaterial` | Points + Sprites |
| `primitives/particle-system.component.ts` | `PointsMaterial`                   | `PointsNodeMaterial`                       | Points           |
| `primitives/nebula.component.ts`          | `SpriteMaterial`                   | `SpriteNodeMaterial`                       | Sprites          |

---

## 4. Category C: Custom GLSL to TSL Shader Conversion (5 files)

These files contain custom GLSL shaders that must be converted to TSL (Three.js Shading Language).

### 4.1 Nebula Volumetric Component (VERY HIGH complexity)

| File                                        | Shader Complexity | Lines of GLSL |
| ------------------------------------------- | ----------------- | ------------- |
| `primitives/nebula-volumetric.component.ts` | VERY HIGH         | ~220 lines    |

**Current GLSL Features**:

- 3D Simplex noise implementation
- FBM (Fractal Brownian Motion) with 5 octaves
- Domain warping for organic smoke
- Multi-stage radial falloff
- Custom color mixing and glow

**TSL Migration**:

- Use `mx_fractal_noise_float` for FBM
- Use `mx_noise_float` for simplex noise
- Create separate TSL file: `primitives/shaders/nebula-volumetric.tsl.ts`

### 4.2 Cloud Layer Component (HIGH complexity)

| File                                  | Shader Complexity | Lines of GLSL |
| ------------------------------------- | ----------------- | ------------- |
| `primitives/cloud-layer.component.ts` | HIGH              | ~100 lines    |

**Current GLSL Features**:

- Cloud density calculation
- UV-based noise sampling
- Transparency with edge falloff
- Animated flow

### 4.3 Bubble Text Component (MEDIUM complexity)

| File                                       | Shader Complexity | Lines of GLSL |
| ------------------------------------------ | ----------------- | ------------- |
| `primitives/text/bubble-text.component.ts` | MEDIUM            | ~35 lines     |

**Current GLSL Features**:

- Fresnel-based rim lighting
- Instance-aware reflection
- Random per-instance variation

**Migration Pattern**:

```typescript
// OLD GLSL
vertexShader: `
  vReflectionFactor = 0.2 + 2.0 * pow(
    1.0 + dot(normalize(worldPosition.xyz - cameraPosition), normal),
    3.0
  );
`,

// NEW TSL
import { Fn, positionWorld, cameraPosition, normalLocal, pow, dot, normalize } from 'three/tsl';

const fresnelFactor = Fn(() => {
  const viewDir = normalize(positionWorld.sub(cameraPosition));
  const fresnel = pow(float(1.0).add(dot(viewDir, normalLocal)), 3.0);
  return float(0.2).add(fresnel.mul(2.0));
});
```

### 4.4 Smoke Troika Text Component (HIGH complexity)

| File                                             | Shader Complexity | Lines of GLSL |
| ------------------------------------------------ | ----------------- | ------------- |
| `primitives/text/smoke-troika-text.component.ts` | HIGH              | ~170 lines    |

**Current GLSL Features**:

- Same noise/FBM as nebula-volumetric
- Domain warping
- Animated smoke flow
- Brightness/glow calculation

**Migration Strategy**: Share TSL noise utilities with nebula-volumetric.

### 4.5 Shader Material Directive (API Redesign)

| File                                                | Complexity | Notes                |
| --------------------------------------------------- | ---------- | -------------------- |
| `directives/materials/shader-material.directive.ts` | VERY HIGH  | Generic GLSL wrapper |

**Challenge**: This directive accepts arbitrary GLSL strings from consumers.

**Options**:

1. **Deprecate** - Mark as deprecated, document TSL alternative
2. **Keep for WebGL fallback** - Only works in WebGL mode
3. **Convert to NodeMaterial** - Accept TSL node graphs instead

**Recommended**: Option 3 - Convert to accept TSL function nodes:

```typescript
// OLD API
<a3d-box
  a3dShaderMaterial
  [vertexShader]="glslVertexString"
  [fragmentShader]="glslFragmentString"
/>

// NEW API
<a3d-box
  a3dNodeMaterial
  [colorNode]="myTslColorNode"
  [positionNode]="myTslPositionNode"
/>
```

---

## 5. Category D: Post-Processing API Changes (5 files)

WebGPU uses completely different post-processing API: `PostProcessing` class with TSL nodes instead of `EffectComposer` with passes.

### 5.1 Effect Composer Service (REWRITE)

| File                                        | Current API                        | Target API                         |
| ------------------------------------------- | ---------------------------------- | ---------------------------------- |
| `postprocessing/effect-composer.service.ts` | `EffectComposer` from three-stdlib | `PostProcessing` from three/webgpu |

**API Changes**:

- `new EffectComposer(renderer)` -> `new THREE.PostProcessing(renderer)`
- `RenderPass(scene, camera)` -> `pass(scene, camera)`
- `UnrealBloomPass` -> `bloom()` TSL function
- `composer.render()` -> `postProcessing.render()`

### 5.2 Effect Composer Component

| File                                          | Notes                               |
| --------------------------------------------- | ----------------------------------- |
| `postprocessing/effect-composer.component.ts` | Wrapper component - minimal changes |

### 5.3 Bloom Effect Component (REWRITE)

| File                                               | Current           | Target                 |
| -------------------------------------------------- | ----------------- | ---------------------- |
| `postprocessing/effects/bloom-effect.component.ts` | `UnrealBloomPass` | TSL `bloom()` function |

### 5.4 SSAO Effect Component (REWRITE)

| File                                              | Current    | Target                  |
| ------------------------------------------------- | ---------- | ----------------------- |
| `postprocessing/effects/ssao-effect.component.ts` | `SSAOPass` | TSL SSAO implementation |

**Challenge**: No built-in TSL SSAO function. Options:

1. Implement custom TSL SSAO
2. Remove feature for v1
3. Use different AO technique (screen-space ground truth AO)

**Recommendation**: Implement basic TSL SSAO or mark as "WebGL-only" for v1.

### 5.5 DOF Effect Component (REWRITE)

| File                                             | Current     | Target               |
| ------------------------------------------------ | ----------- | -------------------- |
| `postprocessing/effects/dof-effect.component.ts` | `BokehPass` | TSL `dof()` function |

### 5.6 Color Grading Effect Component (REWRITE)

| File                                                       | Current                | Target               |
| ---------------------------------------------------------- | ---------------------- | -------------------- |
| `postprocessing/effects/color-grading-effect.component.ts` | Custom GLSL ShaderPass | TSL color operations |

---

## 6. Category E: Core Infrastructure (3 files)

These are the critical foundation files that must be migrated first.

### 6.1 Scene3dComponent (CRITICAL)

| File                           | Key Changes                                  |
| ------------------------------ | -------------------------------------------- |
| `canvas/scene-3d.component.ts` | WebGPURenderer, async init, setAnimationLoop |

**Required Changes**:

1. **Import update**:

```typescript
import * as THREE from 'three/webgpu';
```

2. **Renderer type change**:

```typescript
private renderer!: THREE.WebGPURenderer;
```

3. **Async initialization**:

```typescript
private async initRenderer(): Promise<void> {
  this.renderer = new THREE.WebGPURenderer({
    canvas,
    antialias: this.enableAntialiasing(),
    alpha: this.alpha(),
    powerPreference: this.powerPreference(),
  });

  // CRITICAL: Must await init() before first render
  await this.renderer.init();

  // Log backend for debugging
  if (this.renderer.backend.isWebGPU) {
    console.log('[Scene3d] Using WebGPU backend');
  } else {
    console.warn('[Scene3d] Fell back to WebGL backend');
  }
}
```

4. **Animation loop change**:

```typescript
// Use setAnimationLoop instead of manual RAF
this.renderer.setAnimationLoop((time) => {
  this.renderLoop.tick(time);
});
```

### 6.2 SceneService

| File                      | Key Changes                   |
| ------------------------- | ----------------------------- |
| `canvas/scene.service.ts` | Renderer type, backend signal |

**Required Changes**:

```typescript
import * as THREE from 'three/webgpu';

private readonly _renderer = signal<THREE.WebGPURenderer | null>(null);
private readonly _backend = signal<'webgpu' | 'webgl' | null>(null);

public setRenderer(renderer: THREE.WebGPURenderer): void {
  this._renderer.set(renderer);
  this._backend.set(renderer.backend?.isWebGPU ? 'webgpu' : 'webgl');
}

public isWebGPU(): boolean {
  return this._backend() === 'webgpu';
}
```

### 6.3 RenderLoopService

| File                                 | Key Changes                     |
| ------------------------------------ | ------------------------------- |
| `render-loop/render-loop.service.ts` | tick() method for external loop |

**Required Changes**:

```typescript
/**
 * Process a single frame tick (called by renderer.setAnimationLoop)
 */
public tick(time: number): void {
  if (!this._isRunning() || this._isPaused()) return;

  const shouldRender = this._frameloop() === 'always' || this._needsRender();
  if (!shouldRender) return;

  const delta = this.clock.getDelta();
  const elapsed = this.clock.getElapsedTime();

  // Call all registered update callbacks
  this.updateCallbacks.forEach((callback) => {
    try {
      callback(delta, elapsed);
    } catch (error) {
      console.error('Error in render loop callback:', error);
    }
  });

  // Call render function if set
  if (this.renderFn) {
    this.renderFn();
  }

  this.renderCount++;
  if (this._frameloop() === 'demand') {
    this._needsRender.set(false);
  }
  this.updateFps();
}
```

---

## 7. Text Components Migration

### 7.1 Troika Text Components (5 files)

Troika-three-text is a third-party library. Need to verify WebGPU compatibility.

| File                                                  | Material Type          | Migration Notes                |
| ----------------------------------------------------- | ---------------------- | ------------------------------ |
| `primitives/text/troika-text.component.ts`            | Uses THREE imports     | Import update + material check |
| `primitives/text/responsive-troika-text.component.ts` | Uses THREE imports     | Import update                  |
| `primitives/text/glow-troika-text.component.ts`       | `MeshBasicMaterial`    | `MeshBasicNodeMaterial`        |
| `primitives/text/extruded-text-3d.component.ts`       | `MeshStandardMaterial` | `MeshStandardNodeMaterial`     |
| `primitives/text/particles-text.component.ts`         | `MeshBasicMaterial`    | `MeshBasicNodeMaterial`        |

**Troika Compatibility**:

- Troika generates its own shader material for SDF text
- May need to use `material` property override with NodeMaterial
- Test thoroughly with WebGPU backend

---

## 8. Migration Phases (Revised)

### Phase 1: Core Infrastructure (Critical Path)

**Priority**: HIGHEST
**Effort**: 10-14 hours

| Task | File                                 | Complexity |
| ---- | ------------------------------------ | ---------- |
| 1.1  | `canvas/scene-3d.component.ts`       | HIGH       |
| 1.2  | `canvas/scene.service.ts`            | MEDIUM     |
| 1.3  | `render-loop/render-loop.service.ts` | MEDIUM     |
| 1.4  | Verify OrbitControls compatibility   | LOW        |

**Exit Criteria**:

- Scene renders with WebGPURenderer
- Console shows "Using WebGPU backend" (or WebGL fallback)
- Basic scene with primitives works

### Phase 2: Category A - Import-Only Changes

**Priority**: HIGH
**Effort**: 8-10 hours

| Task | Files               | Count |
| ---- | ------------------- | ----- |
| 2.1  | Light directives    | 5     |
| 2.2  | Core directives     | 6     |
| 2.3  | Geometry directives | 5     |
| 2.4  | Loaders             | 3     |
| 2.5  | Store & Tokens      | 4     |
| 2.6  | Services            | 3     |
| 2.7  | Light components    | 1     |
| 2.8  | Other primitives    | 4     |

**Total**: 31 files

**Exit Criteria**:

- All import-only files updated
- No TypeScript errors
- Existing functionality preserved

### Phase 3: Category B - Standard Materials to NodeMaterials

**Priority**: HIGH
**Effort**: 10-12 hours

| Task | Files                | Count |
| ---- | -------------------- | ----- |
| 3.1  | Material directives  | 3     |
| 3.2  | Glow directive       | 1     |
| 3.3  | Primitive components | 6     |

**Total**: 10 files

**Exit Criteria**:

- All NodeMaterial components render correctly
- Material properties reactive
- Visual parity with WebGL version

### Phase 4: Points & Sprites

**Priority**: MEDIUM
**Effort**: 6-8 hours

| Task | Files                   | Count |
| ---- | ----------------------- | ----- |
| 4.1  | StarFieldComponent      | 1     |
| 4.2  | ParticleSystemComponent | 1     |
| 4.3  | NebulaComponent         | 1     |

**Total**: 3 files

**Exit Criteria**:

- Points render with proper size/attenuation
- Sprites render with proper blending
- Additive blending works correctly

### Phase 5: Text Components

**Priority**: MEDIUM
**Effort**: 8-10 hours

| Task | Files                         | Notes                              |
| ---- | ----------------------------- | ---------------------------------- |
| 5.1  | TroikaTextComponent           | Verify Troika WebGPU compatibility |
| 5.2  | ResponsiveTroikaTextComponent | Import update                      |
| 5.3  | GlowTroikaTextComponent       | NodeMaterial for glow              |
| 5.4  | ExtrudedText3dComponent       | NodeMaterial                       |
| 5.5  | ParticlesTextComponent        | NodeMaterial                       |

**Total**: 5 files (excluding bubble-text and smoke-text which are Phase 6)

**Exit Criteria**:

- Text renders correctly
- Custom fonts load
- Glow/outline effects work

### Phase 6: Custom Shaders (TSL)

**Priority**: HIGH (but complex)
**Effort**: 20-25 hours

| Task | File                      | GLSL Lines | TSL Complexity  |
| ---- | ------------------------- | ---------- | --------------- |
| 6.1  | Create TSL utilities      | NEW FILE   | Setup noise/FBM |
| 6.2  | NebulaVolumetricComponent | 220        | VERY HIGH       |
| 6.3  | CloudLayerComponent       | 100        | HIGH            |
| 6.4  | BubbleTextComponent       | 35         | MEDIUM          |
| 6.5  | SmokeTroikaTextComponent  | 170        | HIGH            |
| 6.6  | ShaderMaterialDirective   | N/A        | Redesign API    |

**New Files to Create**:

- `primitives/shaders/tsl-utilities.ts` - Shared noise functions
- `primitives/shaders/nebula-volumetric.tsl.ts` - Nebula shader
- `primitives/shaders/cloud-layer.tsl.ts` - Cloud shader
- `primitives/shaders/bubble-text.tsl.ts` - Bubble shader
- `primitives/shaders/smoke-text.tsl.ts` - Smoke shader
- `primitives/shaders/index.ts` - Exports

**Exit Criteria**:

- All shader effects work
- Animation/flow working
- No shader compilation errors

### Phase 7: Post-Processing

**Priority**: HIGH
**Effort**: 12-15 hours

| Task | File                        | Notes                   |
| ---- | --------------------------- | ----------------------- |
| 7.1  | EffectComposerService       | Complete rewrite        |
| 7.2  | EffectComposerComponent     | Minimal changes         |
| 7.3  | BloomEffectComponent        | TSL bloom()             |
| 7.4  | DOFEffectComponent          | TSL dof()               |
| 7.5  | SSAOEffectComponent         | Custom TSL or deprecate |
| 7.6  | ColorGradingEffectComponent | TSL operations          |

**Exit Criteria**:

- Bloom effect works
- DOF effect works
- Color grading works
- Effects composable

### Phase 8: Testing & Verification

**Priority**: HIGH
**Effort**: 8-10 hours

| Task | Description                                    |
| ---- | ---------------------------------------------- |
| 8.1  | Update all spec files with new imports         |
| 8.2  | Run full test suite                            |
| 8.3  | Manual browser testing (Chrome, Edge, Firefox) |
| 8.4  | WebGL fallback testing                         |
| 8.5  | Performance benchmarking                       |
| 8.6  | Demo app verification                          |

---

## 9. Complete File Change Summary

### Files to CREATE (7 files)

```
libs/angular-3d/src/lib/primitives/shaders/
  tsl-utilities.ts          # Shared TSL noise functions
  nebula-volumetric.tsl.ts  # Nebula TSL shader
  cloud-layer.tsl.ts        # Cloud TSL shader
  bubble-text.tsl.ts        # Bubble TSL shader
  smoke-text.tsl.ts         # Smoke TSL shader
  index.ts                  # Barrel export

libs/angular-3d/src/lib/directives/materials/
  node-material.directive.ts  # New TSL-based shader directive (replaces shader-material)
```

### Files to MODIFY (Import-only: 31 files)

**Light Directives (5 files)**:

- `directives/lights/ambient-light.directive.ts`
- `directives/lights/directional-light.directive.ts`
- `directives/lights/point-light.directive.ts`
- `directives/lights/spot-light.directive.ts`
- `directives/light.directive.ts`

**Core Directives (6 files)**:

- `directives/mesh.directive.ts`
- `directives/group.directive.ts`
- `directives/float-3d.directive.ts`
- `directives/rotate-3d.directive.ts`
- `directives/space-flight-3d.directive.ts`
- `directives/mouse-tracking-3d.directive.ts`

**Geometry Directives (5 files)**:

- `directives/geometries/box-geometry.directive.ts`
- `directives/geometries/cylinder-geometry.directive.ts`
- `directives/geometries/sphere-geometry.directive.ts`
- `directives/geometries/torus-geometry.directive.ts`
- `directives/geometries/polyhedron-geometry.directive.ts`

**Loaders (3 files)**:

- `loaders/texture-loader.service.ts`
- `loaders/inject-texture-loader.ts`
- `loaders/inject-gltf-loader.ts`

**Store & Tokens (4 files)**:

- `store/scene-graph.store.ts`
- `tokens/geometry.token.ts`
- `tokens/material.token.ts`
- `types/tokens.ts`

**Services (3 files)**:

- `render-loop/animation.service.ts`
- `services/advanced-performance-optimizer.service.ts`
- `positioning/viewport-positioning.service.ts`

**Light Components (1 file)**:

- `primitives/lights/scene-lighting.component.ts`

**Other Primitives (4 files)**:

- `primitives/fog.component.ts`
- `primitives/gltf-model.component.ts`
- `primitives/environment.component.ts`
- `primitives/instanced-mesh.component.ts`

### Files to MODIFY (Material changes: 15 files)

**Material Directives (4 files)**:

- `directives/materials/lambert-material.directive.ts`
- `directives/materials/standard-material.directive.ts`
- `directives/materials/physical-material.directive.ts`
- `directives/glow-3d.directive.ts`

**Primitive Components (6 files)**:

- `primitives/planet.component.ts`
- `primitives/svg-icon.component.ts`
- `primitives/star-field.component.ts`
- `primitives/particle-system.component.ts`
- `primitives/nebula.component.ts`

**Text Components (5 files)**:

- `primitives/text/troika-text.component.ts`
- `primitives/text/responsive-troika-text.component.ts`
- `primitives/text/glow-troika-text.component.ts`
- `primitives/text/extruded-text-3d.component.ts`
- `primitives/text/particles-text.component.ts`

### Files to REWRITE (13 files)

**Core Infrastructure (3 files)**:

- `canvas/scene-3d.component.ts`
- `canvas/scene.service.ts`
- `render-loop/render-loop.service.ts`

**Custom Shader Components (5 files)**:

- `primitives/nebula-volumetric.component.ts`
- `primitives/cloud-layer.component.ts`
- `primitives/text/bubble-text.component.ts`
- `primitives/text/smoke-troika-text.component.ts`
- `directives/materials/shader-material.directive.ts`

**Post-Processing (5 files)**:

- `postprocessing/effect-composer.service.ts`
- `postprocessing/effects/bloom-effect.component.ts`
- `postprocessing/effects/dof-effect.component.ts`
- `postprocessing/effects/ssao-effect.component.ts`
- `postprocessing/effects/color-grading-effect.component.ts`

### Files to UPDATE (Spec files: 19 files)

All spec files need import updates to use mocks for `three/webgpu`.

---

## 10. TSL Shader Architecture

### 10.1 Shared TSL Utilities

```typescript
// primitives/shaders/tsl-utilities.ts

import { Fn, float, vec3, mx_fractal_noise_float, mx_noise_float } from 'three/tsl';

/**
 * Domain warping for organic smoke distortion
 */
export const domainWarp = Fn(([pos, warpAmount]) => {
  const warpX = mx_fractal_noise_float(pos.add(vec3(1.7, 9.2, 4.1)), 4, 2.0, 0.5).mul(warpAmount);

  const warpY = mx_fractal_noise_float(pos.add(vec3(8.3, 2.8, 5.5)), 4, 2.0, 0.5).mul(warpAmount);

  const warpZ = mx_fractal_noise_float(pos.add(vec3(3.5, 6.1, 2.9)), 4, 2.0, 0.5).mul(warpAmount);

  return pos.add(vec3(warpX, warpY, warpZ));
});

/**
 * Multi-scale smoke density using FBM
 */
export const smokeDensity = Fn(([pos]) => {
  const smoke1 = mx_fractal_noise_float(pos, 5, 2.0, 0.5);
  const smoke2 = mx_fractal_noise_float(pos.mul(1.5).add(vec3(5.2, 3.7, 8.1)), 5, 2.0, 0.5);
  const smoke3 = mx_fractal_noise_float(pos.mul(0.6).add(vec3(2.3, 7.1, 4.6)), 5, 2.0, 0.5);

  return smoke1.mul(0.45).add(smoke2.mul(0.35)).add(smoke3.mul(0.2));
});
```

### 10.2 Uniform Pattern

```typescript
// Pattern for exposing uniforms to Angular components

export interface NebulaUniforms {
  uOpacity: ReturnType<typeof uniform>;
  uFlowSpeed: ReturnType<typeof uniform>;
  uPrimaryColor: ReturnType<typeof uniform>;
  // ... other uniforms
}

export function createNebulaUniforms(config: NebulaConfig): NebulaUniforms {
  return {
    uOpacity: uniform(float(config.opacity)),
    uFlowSpeed: uniform(float(config.flowSpeed)),
    uPrimaryColor: uniform(color(config.primaryColor)),
  };
}

// In Angular component
effect(() => {
  this.uniforms.uOpacity.value = this.opacity();
  this.uniforms.uFlowSpeed.value = this.flowSpeed();
});
```

---

## 11. Risk Mitigation

### 11.1 Technical Risks

| Risk                          | Impact | Mitigation                             |
| ----------------------------- | ------ | -------------------------------------- |
| Troika WebGPU incompatibility | HIGH   | Test early, prepare fallback or fork   |
| TSL complexity underestimated | MEDIUM | Start with simplest shaders, iterate   |
| three-stdlib breaking         | MEDIUM | Pin versions, test OrbitControls first |
| Performance regression        | MEDIUM | Benchmark each phase                   |
| Type definition gaps          | LOW    | Use type assertions, file issues       |

### 11.2 Fallback Strategy

WebGPURenderer has built-in WebGL fallback. Additional considerations:

```typescript
// Consumer can check backend
if (!sceneService.isWebGPU()) {
  console.warn('Running in WebGL fallback mode');
  // Optionally adjust quality settings
}
```

### 11.3 Rollback Points

- **After Phase 1**: Core infrastructure working
- **After Phase 3**: All standard materials migrated
- **After Phase 6**: All custom shaders migrated
- **After Phase 7**: Post-processing complete

Create git tags at each rollback point.

---

## 12. Team-Leader Handoff

### 12.1 Developer Recommendation

**Recommended Developer**: backend-developer (with Three.js/WebGL experience)

**Rationale**:

- TSL is TypeScript-based shader authoring
- Service architecture changes (async, state management)
- Material system is directive-based patterns
- Post-processing is service-layer code

### 12.2 Skill Requirements

- Strong TypeScript
- Understanding of Three.js material system
- Shader programming concepts (not GLSL syntax, but concepts)
- Angular signals and effects
- Async/await patterns

### 12.3 Complexity Assessment

| Phase                        | Complexity | Hours      |
| ---------------------------- | ---------- | ---------- |
| Phase 1: Core Infrastructure | HIGH       | 10-14      |
| Phase 2: Import-only         | LOW        | 8-10       |
| Phase 3: NodeMaterials       | MEDIUM     | 10-12      |
| Phase 4: Points/Sprites      | MEDIUM     | 6-8        |
| Phase 5: Text                | MEDIUM     | 8-10       |
| Phase 6: TSL Shaders         | VERY HIGH  | 20-25      |
| Phase 7: Post-Processing     | HIGH       | 12-15      |
| Phase 8: Testing             | MEDIUM     | 8-10       |
| **TOTAL**                    | **XXL**    | **82-104** |

### 12.4 Critical Verification Points

Before implementation:

1. **Verify three.js version supports WebGPU**:

   ```bash
   npm ls three
   # Should be r170+ for stable WebGPU
   ```

2. **Verify NodeMaterial classes exist**:

   - MeshLambertNodeMaterial
   - MeshStandardNodeMaterial
   - MeshPhysicalNodeMaterial
   - MeshBasicNodeMaterial
   - PointsNodeMaterial
   - SpriteNodeMaterial

3. **Verify TSL functions exist**:

   - `mx_fractal_noise_float`
   - `mx_noise_float`
   - `bloom`
   - `dof`
   - `pass`

4. **Verify three-stdlib compatibility**:
   - OrbitControls
   - SSAOPass (or understand deprecation)
   - BokehPass (or understand deprecation)

---

## 13. Architecture Delivery Checklist

- [x] Complete file inventory (60+ source files)
- [x] All files categorized by migration complexity
- [x] All phases defined with clear scope
- [x] TSL shader architecture documented
- [x] Risk mitigation strategies defined
- [x] Testing strategy outlined
- [x] Developer recommendation provided
- [x] Effort estimates revised (80-100 hours)
- [x] No backward compatibility (direct replacement)

---

## Appendix A: TSL Quick Reference

```typescript
// Types
float(1.0), int(1), bool(true);
vec2(1, 2), vec3(1, 2, 3), vec4(1, 2, 3, 4);
color('#ff0000'), mat3(), mat4();

// Operations (chained)
value.add(other), value.sub(other);
value.mul(other), value.div(other);
value.max(other), value.min(other);

// Functions
sin(x), cos(x), pow(x, y);
mix(a, b, t), smoothstep(e0, e1, x);
normalize(v), length(v), distance(a, b);
dot(a, b), cross(a, b);

// Noise (MaterialX)
mx_noise_float(position);
mx_fractal_noise_float(position, octaves, lacunarity, diminish);

// Uniforms
const u = uniform(float(0));
u.value = 1.0; // update

// Functions
const myFn = Fn(([param]) => {
  return result;
});
const result = myFn(arg);

// Control
If(condition, thenBlock, elseBlock);
Discard(condition);
```

## Appendix B: WebGPU PostProcessing Reference

```typescript
import * as THREE from 'three/webgpu';
import { pass, bloom, dof, fxaa, gaussianBlur } from 'three/tsl';

// Setup
const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
const sceneColor = scenePass.getTextureNode('output');
const sceneDepth = scenePass.getTextureNode('depth');

// Bloom
const bloomPass = bloom(sceneColor);
bloomPass.strength.value = 1.5;
bloomPass.threshold.value = 0.3;
bloomPass.radius.value = 0.4;

// Compose
postProcessing.outputNode = sceneColor.add(bloomPass);

// Render
postProcessing.render();
```

---

**Document Status**: COMPLETE - Ready for team-leader task decomposition
