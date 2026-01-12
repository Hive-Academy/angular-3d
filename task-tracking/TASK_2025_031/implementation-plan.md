# Implementation Plan - TASK_2025_031: WebGPU-Native Component Elevation

## Goal

Elevate 6 shader components and 4 post-processing effects from GLSL `ShaderMaterial` to native TSL (Three.js Shading Language) implementations. This migration provides:

1. **Native WebGPU Support**: TSL compiles to WGSL for WebGPU, GLSL for WebGL automatically
2. **Improved Visual Quality**: GPU-native noise, ray marching, and fresnel effects
3. **Maintainability**: JavaScript-based shaders with IDE support
4. **Future-Proofing**: Aligns with Three.js's official shader development path

---

## Background & Evidence

### Research Findings

| Finding                                     | Source            | Citation                      |
| ------------------------------------------- | ----------------- | ----------------------------- |
| TSL auto-transpiles to WGSL/GLSL            | Three.js docs     | research-findings.md:L78-92   |
| `mx_fractal_noise_vec3` provides native FBM | THREE/tsl module  | research-findings.md:L45-65   |
| `THREE.PostProcessing` is WebGPU-native     | Three.js docs     | research-findings.md:L120-145 |
| Procedural ray marching via `Loop` node     | Three.js examples | research-findings.md:L95-110  |

### Existing Codebase Patterns

| Pattern                   | File Location                                                       | Citation |
| ------------------------- | ------------------------------------------------------------------- | -------- |
| TSL utilities structure   | `libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts`       | L1-241   |
| Service injection pattern | `libs/angular-3d/src/lib/postprocessing/effect-composer.service.ts` | L56-78   |
| Component signal inputs   | `libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts` | L73-91   |
| ShaderMaterial usage      | `libs/angular-3d/src/lib/primitives/text/bubble-text.component.ts`  | L278-329 |

### Components Requiring Migration

| Component                   | Current Implementation      | Lines of GLSL | Migration Complexity |
| --------------------------- | --------------------------- | ------------- | -------------------- |
| `BubbleTextComponent`       | ShaderMaterial + Fresnel    | ~45           | **Low**              |
| `SmokeTroikaTextComponent`  | ShaderMaterial + noise      | ~80           | **Medium**           |
| `CloudLayerComponent`       | ShaderMaterial + fog        | ~60           | **Low**              |
| `NebulaVolumetricComponent` | ShaderMaterial + FBM        | ~180          | **High**             |
| `NebulaComponent`           | Canvas textures (CPU noise) | ~120          | **Medium**           |
| `MetaballComponent`         | ShaderMaterial + ray march  | ~600          | **High**             |

---

## Proposed Changes

### Batch 1: TSL Utilities Enhancement (Foundation)

**Purpose**: Extend existing `tsl-utilities.ts` with native MaterialX noise functions

---

#### [MODIFY] [tsl-utilities.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts)

**Line Range**: Full file refactor
**Changes**:

1. Add MaterialX noise imports (`mx_noise_vec3`, `mx_fractal_noise_vec3`)
2. Replace `simpleNoise3D` with native `mx_noise_vec3`
3. Replace `simpleFBM` with native `mx_fractal_noise_vec3`
4. Add `domainWarp` function for organic distortion
5. Add `cloudDensity` function for volumetrics
6. Add TSL fresnel implementation using `normalLocal`, `cameraPosition`

**Pattern Reference**: Existing `tsl-utilities.ts:85-127`

**Enhanced Implementation**:

```typescript
// libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts

import { Fn, float, vec3, uniform, mix, smoothstep, clamp, pow, sin, dot, abs, normalize, positionWorld, cameraPosition, normalLocal, Loop, mx_noise_vec3, mx_fractal_noise_float, mx_fractal_noise_vec3 } from 'three/tsl';

// ============================================================================
// Native MaterialX Noise Functions (GPU-Optimized)
// ============================================================================

/**
 * Domain Warping for organic cloud distortion
 * Creates tendril-like patterns by offsetting coordinates with noise
 */
export const domainWarp = Fn(([position, amount]) => {
  const offset = mx_fractal_noise_vec3(position, 3, 2.0, 0.5);
  return position.add(offset.mul(amount));
});

/**
 * Cloud Density with soft falloff
 * Used for volumetric nebula and cloud effects
 */
export const cloudDensity = Fn(([position, time, falloffRadius]) => {
  const animatedPos = position.add(vec3(time.mul(0.02), 0, 0));
  const warped = domainWarp(animatedPos, float(0.5));
  const noise = mx_fractal_noise_float(warped, 5, 2.0, 0.5);

  // Soft radial falloff
  const dist = position.length();
  const falloff = float(1).sub(smoothstep(float(0), falloffRadius, dist));

  return noise.mul(falloff).clamp(0, 1);
});

/**
 * TSL Fresnel Effect (replaces GLSL fresnel)
 * Creates rim lighting for bubble and glass effects
 */
export const tslFresnel = Fn(([power, intensity, bias]) => {
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const rim = float(1).sub(abs(dot(normalLocal, viewDir)));
  return bias.add(pow(rim, power).mul(intensity));
});

/**
 * TSL Rainbow Iridescence
 * Creates soap-bubble color shift effect
 */
export const tslIridescence = Fn(([rimValue, intensity]) => {
  const rainbow = sin(rimValue.mul(6.28)).mul(0.5).add(0.5);
  return vec3(rainbow.mul(intensity), rainbow.mul(intensity).mul(0.5), rainbow.mul(intensity).mul(1.5));
});
```

**Quality Requirements**:

- ✅ Uses native `mx_fractal_noise_*` instead of custom implementations
- ✅ Provides domain warping for organic shapes
- ✅ Includes fresnel for rim-lighting effects
- ✅ Maintains backward compatibility with existing `FogUniforms`

---

### Batch 2: Simple Component Migrations

**Purpose**: Migrate low-complexity components to validate TSL patterns

---

#### [MODIFY] [bubble-text.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/text/bubble-text.component.ts)

**Line Range**: L278-329 (shader material creation)
**Changes**:

1. Replace `THREE.ShaderMaterial` with `THREE.MeshStandardNodeMaterial`
2. Use TSL `tslFresnel` and `tslIridescence` from utilities
3. Configure `colorNode`, `opacityNode`, `emissiveNode`

**Pattern Reference**: `tsl-utilities.ts:150-165` (fresnel pattern)

**Before (GLSL)**:

```typescript
// Current: bubble-text.component.ts:278-329
private createBubbleShaderMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: `...`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      void main() {
        vec3 viewDir = normalize(vViewPosition);
        float rim = 1.0 - abs(dot(vNormal, viewDir));
        rim = pow(rim, 2.0);
        // ... fresnel and color mixing
      }
    `,
    transparent: true,
    side: THREE.DoubleSide,
  });
}
```

**After (TSL)**:

```typescript
import { MeshStandardNodeMaterial } from 'three/webgpu';
import { tslFresnel, tslIridescence } from '../shaders/tsl-utilities';
import { color, float, mix, vec3 } from 'three/tsl';

private createBubbleMaterial(): MeshStandardNodeMaterial {
  const baseColor = color(this.bubbleColor());
  const fresnelValue = tslFresnel(float(2.0), float(0.6), float(0.2));

  // Mix white center with colored rim
  const centerColor = vec3(1, 1, 1);
  const finalColor = mix(centerColor, baseColor, fresnelValue.mul(0.7));
  const iridescent = tslIridescence(fresnelValue, float(0.1));

  const material = new MeshStandardNodeMaterial();
  material.colorNode = finalColor.add(iridescent);
  material.opacityNode = float(0.2).add(fresnelValue.mul(0.6)).mul(this.opacity());
  material.transparent = true;
  material.side = THREE.DoubleSide;
  material.depthWrite = false;

  return material;
}
```

**Quality Requirements**:

- ✅ Visual parity with GLSL version
- ✅ Uses extracted TSL utility functions
- ✅ Maintains all existing inputs (bubbleColor, opacity)
- ✅ Works on both WebGPU and WebGL

---

#### [MODIFY] [cloud-layer.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/cloud-layer.component.ts)

**Line Range**: L99-L200 (material creation)
**Changes**:

1. Replace `THREE.ShaderMaterial` with `THREE.SpriteNodeMaterial`
2. Use `applyFog` from TSL utilities
3. Use `clampForBloom` for color clamping

**Pattern Reference**: `tsl-utilities.ts:163-175` (fog pattern)

**Implementation Strategy**:

```typescript
import { SpriteNodeMaterial } from 'three/webgpu';
import { applyFog, clampForBloom, createFogUniforms } from '../shaders/tsl-utilities';
import { texture, uv, positionWorld, cameraPosition } from 'three/tsl';

private createCloudMaterial(cloudTexture: THREE.Texture): SpriteNodeMaterial {
  const fogConfig = createFogUniforms({
    color: '#4584b4',
    near: -100,
    far: 3000,
  });

  const material = new SpriteNodeMaterial();

  // Sample cloud texture
  const texColor = texture(cloudTexture, uv());

  // Calculate depth for fog
  const depth = positionWorld.z;

  // Apply fog and clamp for bloom prevention
  const fogged = applyFog(texColor, fogConfig.fogColor, fogConfig.fogNear, fogConfig.fogFar, depth);
  const clamped = clampForBloom(fogged, 0.98);

  material.colorNode = clamped;
  material.opacityNode = texColor.a;
  material.transparent = true;
  material.depthWrite = false;

  return material;
}
```

---

### Batch 3: Complex Volumetric Migrations

**Purpose**: Migrate high-complexity components using advanced TSL patterns

---

#### [MODIFY] [nebula-volumetric.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts)

**Line Range**: L258-L525 (shader material and GLSL shaders)
**Changes**:

1. Replace `THREE.ShaderMaterial` with `THREE.MeshBasicNodeMaterial`
2. Replace GLSL simplex noise with `mx_fractal_noise_vec3`
3. Replace GLSL FBM with native `mx_fractal_noise_float`
4. Use `domainWarp` from utilities for organic tendrils
5. Remove 300+ lines of GLSL shader strings

**Pattern Reference**:

- `tsl-utilities.ts:cloudDensity` (volumetric pattern)
- `nebula-volumetric.component.ts:299-515` (current GLSL to replace)

**Implementation Strategy**:

```typescript
import { MeshBasicNodeMaterial } from 'three/webgpu';
import {
  cloudDensity,
  domainWarp,
  radialFalloff
} from '../shaders/tsl-utilities';
import {
  color,
  float,
  mix,
  vec3,
  uv,
  positionLocal,
  uniform
} from 'three/tsl';

private createNebulaLayerMaterial(layerIndex: number): MeshBasicNodeMaterial {
  // Uniforms as TSL uniform nodes
  const uTime = uniform(float(0));
  const uPrimary = uniform(color(this.primaryColor()));
  const uSecondary = uniform(color(this.secondaryColor()));
  const uTertiary = uniform(color(this.tertiaryColor()));
  const uOpacity = uniform(float(this.opacity()));

  // Position with layer offset
  const basePos = positionLocal.mul(this.noiseScale());
  const animatedPos = basePos.add(vec3(uTime.mul(0.02), 0, 0));

  // Domain warping for organic shapes
  const warpedPos = domainWarp(animatedPos, float(0.5));

  // Multi-layer noise accumulation
  const noise = cloudDensity(warpedPos, uTime, float(0.5));

  // Color mixing with noise influence
  const colorMix = mix(uPrimary, uSecondary, noise);
  const finalColor = mix(colorMix, uTertiary, noise.mul(0.5));

  // Soft edge falloff
  const falloff = radialFalloff(uv(), float(0.2), float(0.5));

  const material = new MeshBasicNodeMaterial();
  material.colorNode = finalColor.mul(this.colorIntensity());
  material.opacityNode = noise.mul(falloff).mul(uOpacity);
  material.transparent = true;
  material.blending = THREE.AdditiveBlending;
  material.depthWrite = false;
  material.side = THREE.DoubleSide;

  // Store uniform refs for animation updates
  this.layerTimeUniforms.push(uTime);

  return material;
}
```

**Quality Requirements**:

- ✅ Visual parity with current GLSL (soft edges, color mixing, glow)
- ✅ Removes 300+ lines of GLSL shader code
- ✅ Animation via uniform updates in render loop
- ✅ Works on both WebGPU and WebGL

---

#### [MODIFY] [smoke-troika-text.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/text/smoke-troika-text.component.ts)

**Line Range**: L348-L520 (smoke material)
**Changes**:

1. Replace `THREE.ShaderMaterial` with TSL-based material
2. Use `mx_fractal_noise_float` for smoke distortion
3. Apply noise-based opacity modulation

**Pattern Reference**: `tsl-utilities.ts:128-140` (FBM pattern)

---

### Batch 4: Infrastructure Migrations

**Purpose**: Migrate Metaball (complex) and directive APIs

---

#### [MODIFY] [metaball.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/metaball.component.ts)

**Line Range**: L458-L1020 (shader material and ray marching GLSL)
**Changes**:

1. Replace `THREE.ShaderMaterial` with TSL-based full-screen material
2. Port ray marching algorithm to TSL using `Loop` node
3. Port metaball SDF evaluation to TSL
4. Use TSL `smoothstep` for smooth union of spheres

**Complexity**: HIGH - 600+ lines of GLSL ray marching

**Pattern Reference**: Three.js `webgpu_volume_cloud` example

**Implementation Strategy**:

```typescript
import { Fn, Loop, float, vec3, vec4, uniform } from 'three/tsl';

/**
 * TSL Ray March Function for Metaballs
 */
const rayMarchMetaballs = Fn(([rayOrigin, rayDir, spherePositions, sphereRadii, maxSteps]) => {
  let t = float(0);
  let color = vec4(0, 0, 0, 0);

  Loop({ start: 0, end: maxSteps }, ({ i }) => {
    const pos = rayOrigin.add(rayDir.mul(t));

    // Evaluate SDF for all spheres with smooth union
    // ... sphere evaluation and smooth blending

    t.addAssign(0.02);
  });

  return color;
});
```

> [!WARNING]
> Metaball migration is the highest-complexity item. May need 15-20h dedicated time.
> Consider breaking into sub-tasks: SDF utilities, ray marching loop, material integration.

---

### Batch 5: Post-Processing Native Migration

**Purpose**: Replace `three-stdlib` EffectComposer with native `THREE.PostProcessing`

---

#### [MODIFY] [effect-composer.service.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/postprocessing/effect-composer.service.ts)

**Line Range**: L1-228 (full refactor)
**Changes**:

1. Replace `EffectComposer` from `three-stdlib` with `THREE.PostProcessing`
2. Replace `RenderPass` with `pass()` from `three/tsl`
3. Replace `UnrealBloomPass` with `bloom()` from `three/tsl`
4. Remove `FlipShader` (native PostProcessing handles orientation)
5. Update `addPass`/`removePass` API to work with node composition

**Pattern Reference**: Three.js PostProcessing docs

**Before (three-stdlib)**:

```typescript
// effect-composer.service.ts:14-45 (current)
import { EffectComposer, RenderPass, Pass, ShaderPass } from 'three-stdlib';

public init(renderer, scene, camera): void {
  this.composer = new EffectComposer(renderer);
  this.renderPass = new RenderPass(scene, camera);
  this.composer.addPass(this.renderPass);
}
```

**After (Native TSL)**:

```typescript
import * as THREE from 'three/webgpu';
import { pass, bloom, dof } from 'three/tsl';

@Injectable()
export class EffectComposerService implements OnDestroy {
  private postProcessing: THREE.PostProcessing | null = null;
  private scenePassNode: ReturnType<typeof pass> | null = null;
  private effectNodes: Map<string, TSLNode> = new Map();

  public init(renderer: THREE.WebGPURenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera): void {
    this.postProcessing = new THREE.PostProcessing(renderer);
    this.scenePassNode = pass(scene, camera);
    this.postProcessing.outputNode = this.scenePassNode;
  }

  public addBloom(config: BloomConfig): void {
    const bloomNode = bloom(this.getCurrentOutput(), {
      threshold: config.threshold,
      strength: config.strength,
      radius: config.radius,
    });
    this.effectNodes.set('bloom', bloomNode);
    this.rebuildOutputChain();
  }

  public addDepthOfField(config: DOFConfig): void {
    const dofNode = dof(this.getCurrentOutput(), {
      focus: config.focus,
      aperture: config.aperture,
      maxBlur: config.maxBlur,
    });
    this.effectNodes.set('dof', dofNode);
    this.rebuildOutputChain();
  }

  private rebuildOutputChain(): void {
    let output = this.scenePassNode;
    for (const [, effectNode] of this.effectNodes) {
      output = effectNode; // Chain effects
    }
    this.postProcessing!.outputNode = output;
  }

  public render(): void {
    this.postProcessing?.render();
  }
}
```

**Quality Requirements**:

- ✅ No Y-flip correction needed (native handles this)
- ✅ Supports dynamic effect addition/removal
- ✅ Works on both WebGPU and WebGL (TSL auto-transpiles)
- ✅ API remains declarative for effect components

---

#### [MODIFY] [bloom-effect.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts)

**Line Range**: L1-131
**Changes**:

1. Remove `UnrealBloomPass` import from `three-stdlib`
2. Use `EffectComposerService.addBloom()` with TSL bloom node
3. Update effect on input changes via `effect()`

**Pattern Reference**: Current component structure (L57-131)

---

#### [MODIFY] [dof-effect.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/postprocessing/effects/dof-effect.component.ts)

**Changes**: Similar to bloom - use `EffectComposerService.addDepthOfField()`

---

#### [MODIFY] [color-grading-effect.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/postprocessing/effects/color-grading-effect.component.ts)

**Changes**:

1. Implement using TSL color operations: `saturation()`, `contrast()`, `brightness()`
2. These functions are available in `three/tsl`

---

#### SSAO Decision Point

> [!IMPORTANT] > **SSAO Not Available in Native TSL**
>
> The `ssao-effect.component.ts` cannot be migrated to native TSL as no SSAO node exists.
> **Options**:
>
> 1. Keep `SSAOPass` via `three-stdlib` (compatibility mode) - 2h
> 2. Use `GTAOPass` from `three/addons` - 4h
> 3. Disable SSAO entirely in WebGPU mode - 1h
>
> **Recommendation**: Option 3 for now, with TODO for future SSAO TSL implementation.

---

## Integration Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Angular Component                         │
│                   (BubbleText, Nebula, etc.)                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Signal Inputs ──▶ effect() ──▶ TSL Uniform Updates             │
│       │                              │                           │
│       ▼                              ▼                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  TSL Utilities                           │   │
│  │  (mx_fractal_noise, domainWarp, tslFresnel)             │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           NodeMaterial (MeshBasicNodeMaterial, etc.)     │   │
│  │      colorNode, opacityNode, positionNode configured     │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                   │
└──────────────────────────────│───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                      THREE.WebGPURenderer                        │
│  TSL auto-compiles to: WGSL (WebGPU) or GLSL (WebGL fallback)   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                     THREE.PostProcessing                         │
│       pass() ──▶ bloom() ──▶ dof() ──▶ outputNode               │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure Changes

```
libs/angular-3d/src/lib/
├── primitives/
│   ├── shaders/
│   │   ├── index.ts
│   │   ├── tsl-utilities.ts       [MODIFY] Extend with MX noise, fresnel
│   │   └── tsl-noise.ts           [NEW] Dedicated noise functions if large
│   ├── text/
│   │   ├── bubble-text.component.ts      [MODIFY] TSL material
│   │   └── smoke-troika-text.component.ts [MODIFY] TSL material
│   ├── nebula-volumetric.component.ts    [MODIFY] TSL material
│   ├── nebula.component.ts               [MODIFY] TSL procedural billboards
│   ├── cloud-layer.component.ts          [MODIFY] TSL material
│   └── metaball.component.ts             [MODIFY] TSL ray marching
├── postprocessing/
│   ├── effect-composer.service.ts        [MODIFY] Native PostProcessing
│   ├── effects/
│   │   ├── bloom-effect.component.ts     [MODIFY] TSL bloom node
│   │   ├── dof-effect.component.ts       [MODIFY] TSL dof node
│   │   ├── color-grading-effect.component.ts [MODIFY] TSL color ops
│   │   └── ssao-effect.component.ts      [KEEP or DISABLE] Not in TSL
│   └── index.ts
└── index.ts                              [NO CHANGE] Exports unchanged
```

---

## Verification Plan

### Automated Tests

```bash
# Unit tests for TSL utilities
npx nx test angular-3d --testPathPattern=tsl-utilities

# Unit tests for migrated components
npx nx test angular-3d --testPathPattern=bubble-text
npx nx test angular-3d --testPathPattern=cloud-layer
npx nx test angular-3d --testPathPattern=nebula-volumetric

# Full library test suite
npx nx test angular-3d

# Demo application build
npx nx build angular-3d-demo

# Demo application serve (visual verification)
npx nx serve angular-3d-demo
```

### Visual Verification Checklist

For each migrated component:

- [ ] Renders without console errors
- [ ] Visual appearance matches pre-migration quality
- [ ] Animation/flow effects work correctly
- [ ] Inputs (color, opacity, etc.) update reactively
- [ ] Works in Chrome (WebGPU native)
- [ ] Works in Firefox (WebGL fallback)
- [ ] Works in Safari (WebGL fallback)

### Post-Processing Verification

- [ ] Bloom effect renders bright objects with glow
- [ ] DoF effect blurs based on focus distance
- [ ] Color grading adjusts saturation/contrast
- [ ] Effects can be enabled/disabled dynamically
- [ ] Multiple effects chain correctly

### Performance Benchmarks

| Component        | Before (fps) | After (fps) | Target |
| ---------------- | ------------ | ----------- | ------ |
| StarField        | -            | -           | 60 fps |
| NebulaVolumetric | -            | -           | 60 fps |
| Metaball         | -            | -           | 45 fps |
| CloudLayer       | -            | -           | 60 fps |

---

## Team-Leader Handoff

**Developer Type**: frontend-developer  
**Complexity**: Complex  
**Estimated Tasks**: 12-15 atomic tasks  
**Batch Strategy**: Layer-based (foundation → simple → complex → infrastructure)

### Suggested Task Decomposition

| Batch                  | Tasks           | Estimated Hours |
| ---------------------- | --------------- | --------------- |
| 1. TSL Utilities       | 1-2 tasks       | 4-6h            |
| 2. Simple Components   | 2-3 tasks       | 8-12h           |
| 3. Complex Volumetrics | 3-4 tasks       | 16-24h          |
| 4. Metaball Special    | 2-3 tasks       | 15-20h          |
| 5. Post-Processing     | 3-4 tasks       | 12-16h          |
| **Total**              | **12-16 tasks** | **55-78h**      |

### Dependencies

```
Batch 1 (TSL Utilities)
    │
    ▼
Batch 2 (Simple Components) ────┐
    │                           │
    ▼                           │
Batch 3 (Complex Volumetrics) ◀─┤
    │                           │
    ▼                           │
Batch 4 (Metaball) ◀────────────┘
    │
    ▼
Batch 5 (Post-Processing)
```

---

## Risk Mitigation

| Risk                        | Probability | Impact | Mitigation                                |
| --------------------------- | ----------- | ------ | ----------------------------------------- |
| MX noise visual differences | 40%         | Medium | Parameter tuning, visual comparison tests |
| Ray marching perf on WebGL  | 30%         | High   | Reduce steps on WebGL, LOD approach       |
| PostProcessing API changes  | 20%         | Medium | Pin Three.js version, abstraction layer   |
| SSAO unavailable            | 100%        | Low    | Graceful disable, document for future     |

---

## References

- **Research Findings**: [research-findings.md](file:///d:/projects/angular-3d-workspace/task-tracking/TASK_2025_031/research-findings.md)
- **Requirements**: [task-description.md](file:///d:/projects/angular-3d-workspace/task-tracking/TASK_2025_031/task-description.md)
- **Existing TSL Utils**: [tsl-utilities.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts)
- **Three.js TSL Docs**: https://threejs.org/docs/#manual/en/introduction/TSL
- **PostProcessing Docs**: https://threejs.org/docs/#api/en/postprocessing/PostProcessing
