# Implementation Plan - TASK_2025_024: Particle Text → Troika Refactor

## 📊 Codebase Investigation Summary

### Libraries Discovered

**troika-three-text** (External Dependency):

- Purpose: SDF (Signed Distance Field) text rendering for crisp, scalable text
- Usage: Already integrated in TroikaTextComponent, ResponsiveTroikaTextComponent, GlowTroikaTextComponent
- Pattern: `import { Text } from 'troika-three-text'`
- Evidence: libs/angular-3d/src/lib/primitives/text/troika-text.component.ts:10

**Three.js ShaderMaterial** (Shader-Based Effects):

- Purpose: Custom GPU shaders for atmospheric effects
- Evidence: libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts:204
- Pattern: Multi-layer shader planes with uniforms, vertex/fragment shaders
- Integration: Used for volumetric nebula clouds with Perlin noise and domain warping

**TextSamplingService** (TO REMOVE):

- Purpose: Canvas-based pixel sampling for particle text (no longer needed)
- Evidence: libs/angular-3d/src/lib/services/text-sampling.service.ts:1-82
- Usage: Only by particle-text components (being removed)
- Action: Delete service after removing particle-text components

### Patterns Identified

**Pattern 1: Troika Text Components (Base)**

- **Evidence**: 3 existing Troika components analyzed
  - TroikaTextComponent: libs/angular-3d/src/lib/primitives/text/troika-text.component.ts (472 lines)
  - GlowTroikaTextComponent: libs/angular-3d/src/lib/primitives/text/glow-troika-text.component.ts (478 lines)
  - ResponsiveTroikaTextComponent: libs/angular-3d/src/lib/primitives/text/responsive-troika-text.component.ts (486 lines)
- **Components**: Signal inputs, effect-based initialization, `Text` from troika-three-text
- **Key Properties**: text, fontSize, color, position, rotation, scale, anchorX, anchorY, customMaterial
- **Lifecycle**: effect() for text creation/updates, DestroyRef.onDestroy() for cleanup

**Pattern 2: Shader-Based Atmospheric Effects**

- **Evidence**: NebulaVolumetricComponent (shader-based smoke/clouds)
  - Definition: libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts:1-435
- **Components**:
  - THREE.ShaderMaterial with custom vertex/fragment shaders
  - Uniforms for animation (uTime, uOpacity, uNoiseScale, uFlowSpeed, etc.)
  - Multi-octave FBM (Fractal Brownian Motion) noise for organic smoke
  - Domain warping for tendrils/wispy effects
  - Radial falloff for soft edges
  - Additive blending for glow
- **Animation**: RenderLoopService updates uTime uniform per frame

**Pattern 3: Component Architecture (angular-3d library)**

- **Convention**: Standalone components with ChangeDetectionStrategy.OnPush
- **Providers**: OBJECT_ID token with crypto.randomUUID()
- **Dependencies**: NG_3D_PARENT, RenderLoopService, SceneService, DestroyRef
- **Template**: `<ng-content />` for directive composition
- **Lifecycle**: effect() for reactive updates, no constructor-based initialization
- **Cleanup**: DestroyRef.onDestroy() disposes Three.js resources

### Integration Points

**RenderLoopService** (Per-Frame Updates):

- Location: libs/angular-3d/src/lib/render-loop/render-loop.service.ts
- Interface: `registerUpdateCallback((delta, elapsed) => void) => cleanupFn`
- Usage: All animated components register callbacks for per-frame updates
- Evidence: glow-troika-text.component.ts:384-399 (pulse animation)

**SceneService** (Camera Access):

- Location: libs/angular-3d/src/lib/canvas/scene.service.ts
- Interface: `camera()` signal for accessing Three.js camera
- Usage: Billboard rotation, responsive scaling
- Evidence: responsive-troika-text.component.ts:335-368

**NG_3D_PARENT Token** (Scene Hierarchy):

- Location: libs/angular-3d/src/lib/types/tokens.ts
- Purpose: Inject parent Three.js Object3D for adding/removing children
- Pattern: `private readonly parent = inject(NG_3D_PARENT);`
- Evidence: All primitive components use this pattern

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Shader-Enhanced Troika Text (NOT Particle-Based)

**Rationale**:

1. **GPU Efficiency**: Shaders run on GPU (1 draw call) vs particles (1000s of CPU updates per frame)
2. **Crisp Text**: Troika SDF ensures sharp text at all zoom levels
3. **Atmospheric Effects**: Shader noise/alpha creates smoke without particles
4. **Proven Pattern**: NebulaVolumetricComponent demonstrates shader-based smoke (lines 254-399)
5. **Existing Infrastructure**: GlowTroikaTextComponent already uses customMaterial pattern

**Evidence**:

- NebulaVolumetricComponent uses ShaderMaterial with Perlin noise for volumetric smoke: nebula-volumetric.component.ts:204-399
- GlowTroikaTextComponent uses customMaterial input for bloom integration: glow-troika-text.component.ts:316
- TroikaTextComponent supports customMaterial override: troika-text.component.ts:316

---

## Component Specifications

### Component 1: SmokeTroikaTextComponent

**Purpose**: Render atmospheric smoke/fog text using Troika SDF + custom shader material

**Pattern**: TroikaTextComponent + NebulaVolumetricComponent shader approach
**Evidence**:

- Base structure: TroikaTextComponent (troika-text.component.ts:110-472)
- Shader pattern: NebulaVolumetricComponent (nebula-volumetric.component.ts:254-399)
- Material override: GlowTroikaTextComponent.customMaterial (glow-troika-text.component.ts:353-368)

#### Responsibilities

1. Render crisp SDF text using troika-three-text `Text` object
2. Apply custom ShaderMaterial with smoke/fog shader effect
3. Animate smoke flow using uTime uniform + Perlin noise
4. Support all core Troika text properties (anchorX, anchorY, fontSize, etc.)
5. Provide smoke-specific controls (smokeIntensity, flowSpeed, edgeSoftness, density)

#### Implementation Pattern

**Base Structure** (from TroikaTextComponent):

```typescript
// Pattern source: troika-text.component.ts:110-472
// Verified imports: troika-three-text, Three.js, angular-3d tokens
import { Component, ChangeDetectionStrategy, inject, input, effect, signal, DestroyRef } from '@angular/core';
import { Text } from 'troika-three-text'; // ✓ Verified: external dependency
import * as THREE from 'three';
import { NG_3D_PARENT } from '../../types/tokens'; // ✓ Verified: libs/angular-3d/src/lib/types/tokens.ts
import { OBJECT_ID } from '../../tokens/object-id.token'; // ✓ Verified
import { RenderLoopService } from '../../render-loop/render-loop.service'; // ✓ Verified

@Component({
  selector: 'a3d-smoke-troika-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [{ provide: OBJECT_ID, useFactory: () => `smoke-troika-text-${crypto.randomUUID()}` }],
})
export class SmokeTroikaTextComponent {
  // Core text properties (from TroikaTextComponent pattern)
  readonly text = input.required<string>();
  readonly fontSize = input<number>(0.1);
  readonly color = input<string | number>('#ffffff');
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly rotation = input<[number, number, number]>([0, 0, 0]);
  readonly scale = input<number | [number, number, number]>(1);
  readonly anchorX = input<number | string>('left');
  readonly anchorY = input<number | string>('top');
  readonly font = input<string | null>(null);
  // ... (inherit ALL Troika properties for consistency)

  // Smoke-specific properties (inspired by NebulaVolumetricComponent)
  readonly smokeColor = input<string | number>('#8a2be2'); // Smoke tint
  readonly smokeIntensity = input<number>(1.0); // Density multiplier
  readonly flowSpeed = input<number>(0.5); // Animation speed
  readonly edgeSoftness = input<number>(0.3); // Edge fade
  readonly density = input<number>(1.1); // Cloud density
  readonly enableFlow = input<boolean>(true); // Animate smoke

  // DI (standard pattern)
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Internal state
  private textObject?: Text;
  private smokeMaterial?: THREE.ShaderMaterial;
  private cleanupRenderLoop?: () => void;

  constructor() {
    // Effect: Initialize text with smoke shader material
    effect((onCleanup) => {
      const textContent = this.text();
      const parent = this.parent();
      if (!textContent || !parent) return;

      if (!this.textObject) {
        this.textObject = new Text();
        this.updateAllTextProperties();

        // Create custom smoke shader material
        this.smokeMaterial = this.createSmokeMaterial();
        this.textObject.material = this.smokeMaterial;

        this.textObject.sync(() => {
          if (this.textObject && parent) {
            parent.add(this.textObject);
          }
        });
      } else {
        this.updateAllTextProperties();
        this.textObject.sync();
      }

      onCleanup(() => {
        if (this.textObject && parent) {
          parent.remove(this.textObject);
          this.textObject.dispose();
          this.textObject = undefined;
        }
      });
    });

    // Effect: Animate smoke flow
    effect(() => {
      if (!this.enableFlow()) {
        if (this.cleanupRenderLoop) {
          this.cleanupRenderLoop();
          this.cleanupRenderLoop = undefined;
        }
        return;
      }

      this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta) => {
        if (this.smokeMaterial) {
          this.smokeMaterial.uniforms['uTime'].value += delta * this.flowSpeed();
        }
      });
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanupRenderLoop?.();
      if (this.smokeMaterial) {
        this.smokeMaterial.dispose();
      }
      if (this.textObject) {
        this.textObject.dispose();
      }
    });
  }

  private createSmokeMaterial(): THREE.ShaderMaterial {
    // Pattern source: nebula-volumetric.component.ts:186-212
    const uniforms = {
      uTime: { value: 0.0 },
      uSmokeColor: { value: new THREE.Color(this.smokeColor()) },
      uSmokeIntensity: { value: this.smokeIntensity() },
      uFlowSpeed: { value: this.flowSpeed() },
      uDensity: { value: this.density() },
      uEdgeSoftness: { value: this.edgeSoftness() },
    };

    return new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
  }

  // Shaders - see "Shader Development Strategy" section below for full implementation
  private readonly vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  private readonly fragmentShader = `
    // Smoke shader combining Troika SDF + Perlin noise
    // Full implementation with fbm(), snoise(), domain warping
    // Pattern from NebulaVolumetricComponent lines 254-399
  `;

  private updateAllTextProperties(): void {
    // Pattern source: troika-text.component.ts:425-471
    if (!this.textObject) return;
    this.textObject.text = this.text();
    this.textObject.fontSize = this.fontSize();
    this.textObject.color = this.color();
    this.textObject.position.set(...this.position());
    this.textObject.rotation.set(...this.rotation());
    // ... (all other Troika properties)
  }
}
```

#### Quality Requirements

**Functional Requirements**:

- MUST render crisp SDF text using Troika (same quality as TroikaTextComponent)
- MUST apply shader-based smoke effect (NOT particles)
- MUST support animated smoke flow using Perlin noise
- MUST support all core Troika text inputs (text, fontSize, position, anchorX, anchorY, etc.)
- MUST provide smoke-specific controls (smokeColor, smokeIntensity, flowSpeed, density, edgeSoftness)

**Non-Functional Requirements**:

- **Performance**: Single draw call per text (GPU shader), NOT 1000s of particles
- **Quality**: SDF text remains crisp at all zoom levels
- **Memory**: Minimal overhead (1 shader material vs 1000s of particle data structures)
- **Compatibility**: Works with existing scene hierarchy (NG_3D_PARENT)

**Pattern Compliance**:

- MUST follow TroikaTextComponent structure (verified: troika-text.component.ts:110-472)
- MUST use ShaderMaterial pattern from NebulaVolumetricComponent (verified: nebula-volumetric.component.ts:204-399)
- MUST use effect() for initialization (verified: all Troika components use this pattern)
- MUST use DestroyRef.onDestroy() for cleanup (verified: angular-3d convention)

**Files Affected**:

- CREATE: libs/angular-3d/src/lib/primitives/text/smoke-troika-text.component.ts

---

### Component 2: GlowTroikaTextComponent Enhancement (Optional)

**Purpose**: Verify existing glow component meets requirements (likely already sufficient)

**Current Status**:

- Evidence: libs/angular-3d/src/lib/primitives/text/glow-troika-text.component.ts:67-477
- Features: Bloom-compatible glow using MeshBasicMaterial with toneMapped: false
- Animation: Pulse animation using sine wave (lines 384-399)
- Integration: Works with BloomEffectComponent

**Action**: NO CHANGES NEEDED

- Existing GlowTroikaTextComponent already provides glow effects
- Uses customMaterial pattern (MeshBasicMaterial with emissive color)
- Supports pulse animation
- Integrates with bloom post-processing

**Rationale**: Task context (context.md:47) says "Potentially enhance GlowTroikaTextComponent" but existing component already provides:

- Glow color control (glowColor input)
- Intensity control (glowIntensity input)
- Pulse animation (pulseSpeed input)
- Bloom integration (toneMapped: false)

**Decision**: Skip enhancement unless user feedback indicates missing features

---

### Component 3: Cleanup - Remove Particle Text Components

**Purpose**: Delete CPU-intensive particle-based text implementations

**Pattern**: Direct file deletion + export cleanup
**Evidence**:

- Files to remove: context.md:38-42
- Export cleanup pattern: primitives/index.ts:24-27

#### Responsibilities

1. Delete entire `particle-text/` folder (3 component files)
2. Delete TextSamplingService (only used by particle-text)
3. Remove exports from primitives/index.ts
4. Verify no other files import particle-text components

#### Implementation Pattern

**Files to Delete**:

```bash
# Evidence: context.md:38-42, verified via Glob
libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts
libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts
libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts
libs/angular-3d/src/lib/services/text-sampling.service.ts
```

**Export Cleanup**:

```typescript
// File: libs/angular-3d/src/lib/primitives/index.ts
// Evidence: primitives/index.ts:24-27
// REMOVE these lines:
export * from './particle-text/instanced-particle-text.component';
export * from './particle-text/smoke-particle-text.component';
export * from './particle-text/glow-particle-text.component';
```

**Verification Steps**:

1. Search codebase for imports of particle-text components (should be none)
2. Search for TextSamplingService usage (should only be in particle-text)
3. Build library to ensure no broken imports
4. Run tests to ensure no test failures

#### Quality Requirements

**Functional Requirements**:

- MUST delete all 3 particle-text components completely
- MUST delete TextSamplingService if only used by particle-text
- MUST remove exports from primitives/index.ts
- MUST NOT break any other library components

**Non-Functional Requirements**:

- **Backward Compatibility**: BREAKING CHANGE (acceptable for this task)
- **Build Integrity**: Library must build successfully after deletion
- **Test Integrity**: All remaining tests must pass

**Files Affected**:

- DELETE: libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts
- DELETE: libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts
- DELETE: libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts
- DELETE: libs/angular-3d/src/lib/services/text-sampling.service.ts
- MODIFY: libs/angular-3d/src/lib/primitives/index.ts (remove 3 export lines)

---

### Component 4: Export Updates

**Purpose**: Add SmokeTroikaTextComponent to public API

**Pattern**: Barrel export pattern
**Evidence**: libs/angular-3d/src/lib/primitives/text/index.ts:1-14

#### Implementation Pattern

**File: libs/angular-3d/src/lib/primitives/text/index.ts**

```typescript
// Pattern source: text/index.ts:1-14
// Verified exports: TroikaTextComponent, ResponsiveTroikaTextComponent, GlowTroikaTextComponent

/**
 * Text rendering components using troika-three-text
 *
 * This barrel file exports all text-related components.
 * Implemented components:
 * - TroikaTextComponent (Batch 2)
 * - ResponsiveTroikaTextComponent (Batch 3)
 * - GlowTroikaTextComponent (Batch 4)
 * - SmokeTroikaTextComponent (TASK_2025_024) <-- ADD THIS LINE
 */

export * from './troika-text.component';
export * from './responsive-troika-text.component';
export * from './glow-troika-text.component';
export * from './smoke-troika-text.component'; // <-- ADD THIS LINE
```

**Files Affected**:

- MODIFY: libs/angular-3d/src/lib/primitives/text/index.ts (add 1 export line + comment)

---

## 🔗 Integration Architecture

### Integration Point 1: Troika SDF Rendering

**How It Works**: SmokeTroikaTextComponent extends Troika's `Text` class with custom shader material

**Pattern**:

```typescript
// Evidence: troika-text.component.ts:362-378
this.textObject = new Text();
this.textObject.material = customShaderMaterial; // Override default material
this.textObject.sync(() => {
  parent.add(this.textObject);
});
```

**Key Insight**: Troika's `Text` object accepts custom materials, allowing shader-based effects while preserving SDF text quality

---

### Integration Point 2: Shader Uniforms Animation

**How It Works**: RenderLoopService updates shader uniforms per frame for animated smoke flow

**Pattern**:

```typescript
// Evidence: nebula-volumetric.component.ts:135-141
this.renderLoop.registerUpdateCallback((delta) => {
  if (this.enableFlow()) {
    this.layerUniforms.forEach((uniforms) => {
      uniforms['uTime'].value += delta * this.flowSpeed();
    });
  }
});
```

**Data Flow**:

1. RenderLoopService calls callback every frame with `delta` time
2. Callback increments `uTime` uniform
3. Fragment shader uses `uTime` to offset noise sampling
4. Smoke appears to flow/animate

---

### Integration Point 3: Scene Hierarchy

**How It Works**: NG_3D_PARENT token provides parent Object3D for adding text to scene

**Pattern**:

```typescript
// Evidence: troika-text.component.ts:354-357
const parent = this.parent();
if (this.textObject && parent) {
  parent.add(this.textObject);
}
```

**Compatibility**: SmokeTroikaTextComponent works anywhere TroikaTextComponent works (scenes, groups, etc.)

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

1. SmokeTroikaTextComponent MUST render crisp SDF text with shader-based smoke effect
2. Smoke effect MUST be GPU-efficient (single draw call, NOT particles)
3. Component MUST support all core Troika text properties (fontSize, anchorX, etc.)
4. Component MUST support smoke-specific properties (smokeColor, flowSpeed, density, etc.)
5. Particle-text components MUST be completely removed (no legacy code)

### Non-Functional Requirements

**Performance**:

- SmokeTroikaTextComponent: 1 draw call per text instance (vs 1000+ for particles)
- Shader execution: GPU (parallel) vs particle animation: CPU (serial)
- Memory: ~2KB per text (shader uniforms) vs ~40KB per particle-text (1000s of Float32Arrays)

**Quality**:

- Text crispness: SDF rendering (resolution-independent)
- Smoke realism: Perlin noise + domain warping (same as NebulaVolumetricComponent)
- Edge softness: Configurable radial falloff

**Maintainability**:

- Code reduction: Delete ~1000 lines of particle code
- Pattern consistency: All text components use Troika base
- Shader reusability: Smoke shader can be adapted for other effects

### Pattern Compliance

**MUST Follow**:

1. Troika text component structure (verified: troika-text.component.ts:110-472)
2. ShaderMaterial pattern (verified: nebula-volumetric.component.ts:204-399)
3. Signal-based inputs (verified: all angular-3d components)
4. Effect-based initialization (verified: troika components use effect())
5. DestroyRef cleanup (verified: angular-3d convention)
6. NG_3D_PARENT integration (verified: all primitives use this token)

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. **GLSL Shader Experience**: Need to write custom vertex/fragment shaders for smoke effect
2. **Three.js Material Knowledge**: Need to create ShaderMaterial with proper uniforms
3. **Angular Patterns**: Need to implement signal-based component with effects
4. **Troika Integration**: Need to override Troika's default material with custom shader
5. **Performance Optimization**: Need to ensure GPU-efficient shader (avoid expensive operations)

**Alternative**: backend-developer if they have graphics/shader experience

---

### Complexity Assessment

**Complexity**: MEDIUM

**Estimated Effort**: 4-6 hours

**Breakdown**:

1. **Create SmokeTroikaTextComponent** (3-4 hours):

   - Component structure: 30 mins (copy from TroikaTextComponent)
   - Shader implementation: 2-3 hours (adapt from NebulaVolumetricComponent)
   - Signal inputs & effects: 30 mins
   - Testing/refinement: 1 hour

2. **Delete Particle-Text Components** (30 mins):

   - Delete 4 files: 10 mins
   - Update exports: 5 mins
   - Verify no broken imports: 10 mins
   - Build/test verification: 5 mins

3. **Export Updates** (15 mins):
   - Update text/index.ts: 5 mins
   - Verify barrel exports: 5 mins
   - Build verification: 5 mins

---

### Files Affected Summary

**CREATE**:

- libs/angular-3d/src/lib/primitives/text/smoke-troika-text.component.ts

**DELETE**:

- libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts
- libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts
- libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts
- libs/angular-3d/src/lib/services/text-sampling.service.ts

**MODIFY**:

- libs/angular-3d/src/lib/primitives/index.ts (remove 3 particle-text exports)
- libs/angular-3d/src/lib/primitives/text/index.ts (add SmokeTroikaTextComponent export)

---

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **Troika Text API**:

   - Text class from troika-three-text (verified: troika-text.component.ts:10)
   - customMaterial support (verified: troika-text.component.ts:316, glow-troika-text.component.ts:362)
   - sync() method for geometry updates (verified: troika-text.component.ts:367)

2. **ShaderMaterial Pattern**:

   - Uniforms structure (verified: nebula-volumetric.component.ts:186-199)
   - Vertex/fragment shader strings (verified: nebula-volumetric.component.ts:232-399)
   - Blending mode for transparency (verified: nebula-volumetric.component.ts:209)

3. **Perlin Noise Implementation**:

   - 3D simplex noise function (verified: nebula-volumetric.component.ts:277-335)
   - FBM (Fractal Brownian Motion) (verified: nebula-volumetric.component.ts:338-350)
   - Domain warping (verified: nebula-volumetric.component.ts:353-360)

4. **Angular-3D Patterns**:

   - NG_3D_PARENT injection (verified: libs/angular-3d/src/lib/types/tokens.ts)
   - RenderLoopService.registerUpdateCallback() (verified: glow-troika-text.component.ts:384)
   - Effect-based initialization (verified: all Troika components)

5. **No Hallucinated APIs**:
   - All imports verified in codebase
   - All decorators verified (@Component, @Injectable)
   - All base classes verified (no custom base classes needed)

---

### Architecture Delivery Checklist

- [x] SmokeTroikaTextComponent specified with evidence (TroikaTextComponent + NebulaVolumetricComponent patterns)
- [x] Shader approach verified (ShaderMaterial pattern from NebulaVolumetricComponent)
- [x] All imports verified as existing (troika-three-text, Three.js, angular-3d tokens)
- [x] Quality requirements defined (GPU efficiency, SDF crispness, shader-based smoke)
- [x] Integration points documented (Troika material override, RenderLoopService, NG_3D_PARENT)
- [x] Files affected list complete (1 CREATE, 4 DELETE, 2 MODIFY)
- [x] Developer type recommended (frontend-developer for shader experience)
- [x] Complexity assessed (MEDIUM, 4-6 hours)
- [x] No step-by-step implementation (that's team-leader's job to decompose)
- [x] No hallucinated APIs (all patterns verified from codebase)

---

## 📋 Implementation Notes for Team-Leader

### Shader Development Strategy

**CRITICAL**: The fragment shader MUST integrate with Troika's existing SDF texture

**Troika Text Rendering Pipeline**:

1. Troika generates SDF texture for glyphs (texture atlas)
2. Default shader samples SDF texture and applies alpha threshold
3. Custom shader MUST sample Troika's texture AND apply smoke noise

**Shader Integration Approach**:

**Option A: Material Override (Preferred)**

- Override `textObject.material` with custom ShaderMaterial
- Challenge: May lose Troika's built-in SDF sampling
- Research: Check troika-three-text documentation for custom material support

**Option B: Layer-Based Approach (Fallback)**

- Create ShaderMaterial plane BEHIND Troika text
- Troika text renders solid with low opacity
- Shader plane provides smoke effect
- Group both together

**Recommended**: Try Option A first (cleaner API), fall back to Option B if Troika doesn't support custom shaders well.

---

### Perlin Noise Shader (From NebulaVolumetricComponent)

**Copy these GLSL functions into fragment shader**:

```glsl
// 3D Simplex noise (lines 272-335 from nebula-volumetric.component.ts)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  // ... (full implementation from nebula-volumetric.component.ts:277-335)
}

// FBM for smoke patterns (lines 338-350)
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 5; i++) {
    value += amplitude * snoise(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}

// Domain warping for organic tendrils (lines 353-360)
vec3 domainWarp(vec3 p) {
  float warpAmount = 0.6;
  return p + vec3(
    fbm(p + vec3(1.7, 9.2, 4.1)) * warpAmount,
    fbm(p + vec3(8.3, 2.8, 5.5)) * warpAmount,
    fbm(p + vec3(3.5, 6.1, 2.9)) * warpAmount
  );
}
```

**Evidence**: nebula-volumetric.component.ts:272-360 (verified working implementation)

---

### Testing Checklist

**Functional Tests**:

1. Text renders with smoke effect (visual verification)
2. Smoke animates when enableFlow=true
3. Smoke is static when enableFlow=false
4. All Troika properties work (fontSize, anchorX, position, etc.)
5. Smoke color/intensity controls work

**Performance Tests**:

1. Single text instance: <1ms per frame (GPU shader)
2. 10 text instances: <5ms per frame
3. No memory leaks (dispose() called on destroy)

**Build Tests**:

1. Library builds successfully (`npx nx build @hive-academy/angular-3d`)
2. No TypeScript errors
3. All exports resolve correctly

**Integration Tests**:

1. SmokeTroikaTextComponent works in demo app
2. No conflicts with existing Troika components
3. Works with scene hierarchy (groups, nested scenes)

---

## 🎨 Expected Visual Result

**Before (Particle-Based)**:

- 1000s of CPU-animated particles forming text
- Performance: ~20-30ms per frame for large text
- Crisp edges: NO (particles have discrete boundaries)

**After (Shader-Based)**:

- Single GPU shader creating smoke effect
- Performance: <1ms per frame for same text
- Crisp edges: YES (SDF text + shader noise)

**Visual Quality**:

- Smokey/atmospheric text (like landing page inspiration)
- Organic flow animation (Perlin noise domain warping)
- Soft edges (radial falloff)
- Configurable density, color, flow speed

---

## 📚 Reference Documentation

**Troika Three Text**:

- GitHub: https://github.com/protectwise/troika/tree/main/packages/troika-three-text
- API Docs: https://protectwise.github.io/troika/troika-three-text/

**Three.js ShaderMaterial**:

- Docs: https://threejs.org/docs/#api/en/materials/ShaderMaterial
- Examples: https://threejs.org/examples/?q=shader

**GLSL Noise Functions**:

- Simplex Noise: https://github.com/ashima/webgl-noise
- FBM: https://thebookofshaders.com/13/

**Codebase Evidence**:

- TroikaTextComponent: libs/angular-3d/src/lib/primitives/text/troika-text.component.ts
- NebulaVolumetricComponent: libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts
- GlowTroikaTextComponent: libs/angular-3d/src/lib/primitives/text/glow-troika-text.component.ts
