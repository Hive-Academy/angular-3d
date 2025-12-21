# Implementation Plan - TASK_2025_017: Angular-3D Component Completion & Fixes

## 📊 Codebase Investigation Summary

### Libraries Discovered

1. **@hive-academy/angular-3d** - Production library (libs/angular-3d/)

   - Key exports: SceneGraphStore (component-scoped), RenderLoopService (component-scoped), directive-first patterns
   - Architecture: Signal-based, hostDirectives composition, no direct Three.js in components
   - Evidence: libs/angular-3d/CLAUDE.md, libs/angular-3d/src/lib/primitives/box.component.ts

2. **angular-three** - External library used in temp/ components

   - Key exports: extend(), injectBeforeRender(), NgtArgs, CUSTOM_ELEMENTS_SCHEMA
   - Usage in temp: All particle text components, nebula, background components
   - **Migration Strategy**: Replace angular-three template patterns with @hive-academy/angular-3d directive patterns

3. **three-stdlib** - Three.js utilities (existing dependency)
   - Usage: UnrealBloomPass, OrbitControls, loaders
   - No changes needed - already available

### Patterns Identified

#### Pattern 1: Directive-First Component Architecture (Production Library)

**Evidence**: libs/angular-3d/src/lib/primitives/box.component.ts:1-51

```typescript
// Component has NO Three.js imports - delegates everything to directives
@Component({
  selector: 'a3d-box',
  template: '<ng-content />',
  hostDirectives: [MeshDirective, { directive: BoxGeometryDirective, inputs: ['args'] }, { directive: TransformDirective, inputs: ['position', 'rotation', 'scale'] }, { directive: StandardMaterialDirective, inputs: ['color', 'wireframe'] }],
})
export class BoxComponent {
  readonly position = input<[number, number, number]>([0, 0, 0]);
  // ... all inputs forwarded to directives
}
```

**Components using this pattern**:

- BoxComponent ✅ (production)
- CylinderComponent ✅ (production)
- TorusComponent ✅ (production)
- PolyhedronComponent ✅ (production)

**Components NOT using this pattern** (need migration):

- BackgroundCubeComponent ❌ (uses angular-three `<ngt-mesh>`)
- FloatingSphereComponent ❌ (uses angular-three `<ngt-mesh>`)

#### Pattern 2: Angular-Three Template-Based Pattern (Temp Components)

**Evidence**: temp/angular-3d/components/primitives/background-cube.component.ts:76-107

```typescript
// Uses angular-three declarative templates
@Component({
  imports: [Float3dDirective, Performance3dDirective, NgtArgs],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <ngt-mesh [position]="position()" [scale]="scale()" float3d performance3d>
      <ngt-box-geometry *args="boxGeometryArgs()" />
      <ngt-mesh-lambert-material [color]="color()" />
    </ngt-mesh>
  `,
})
export class BackgroundCubeComponent {}
```

**Migration Path**: Convert `<ngt-*>` templates to directive composition patterns.

#### Pattern 3: Direct Three.js with angular-three Integration (Particle Components)

**Evidence**: temp/angular-3d/components/primitives/smoke-particle-text.component.ts:60-127

```typescript
// Uses angular-three for frame loop + Three.js directly for complex logic
@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<ngt-group #groupRef><!-- Particles added programmatically --></ngt-group>`,
})
export class SmokeParticleTextComponent {
  private particleSystem?: Points;

  constructor() {
    effect(() => {
      const group = this.groupRef().nativeElement; // angular-three element ref
      this.createParticleSystem(group); // Direct Three.js manipulation
    });

    injectBeforeRender(({ delta }) => {
      // angular-three render loop
      this.animateParticles(delta);
    });
  }
}
```

**Migration Path**: Replace `injectBeforeRender` with `RenderLoopService.registerUpdateCallback()`.

### Integration Points

#### Integration 1: Per-Scene Services (CRITICAL)

**Evidence**: libs/angular-3d/src/lib/store/scene-graph.store.ts:54

```typescript
@Injectable() // Component-scoped, NOT providedIn: 'root'
export class SceneGraphStore {
  // Scene provided by Scene3dComponent via DI
}
```

**Pattern**:

- SceneGraphStore is provided by Scene3dComponent (NOT singleton)
- RenderLoopService is provided by Scene3dComponent (NOT singleton)
- Components inject these services and get per-scene instances

**Migration Requirement**: All components MUST inject SceneGraphStore/RenderLoopService (not assume singleton).

#### Integration 2: NG_3D_PARENT Token Pattern

**Evidence**: libs/angular-3d/CLAUDE.md:171-181

```typescript
// All primitives use NG_3D_PARENT for parent-child relationships
private readonly parent = inject(NG_3D_PARENT);

constructor() {
  afterNextRender(() => {
    this.parent().add(this.object3d);
  });
}
```

**Migration Requirement**: Particle text components must inject NG_3D_PARENT for proper scene hierarchy.

#### Integration 3: Signal-Based Reactivity

**Evidence**: All production library components use:

- `input<T>()` and `input.required<T>()` (NO @Input decorators)
- `viewChild()` and `contentChild()` (NO @ViewChild decorators)
- `effect()` for side effects (NO ngOnChanges)
- `DestroyRef.onDestroy()` for cleanup (ngOnDestroy only for interface)

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Hybrid Migration Strategy

1. **Simple Mesh Primitives**: Convert to directive-first pattern (no angular-three)
2. **Complex Particle Systems**: Retain minimal angular-three usage (injectBeforeRender) but remove template primitives
3. **Shader Components**: Keep angular-three NgtArgs for shader materials
4. **Services**: Pure Angular signals (no angular-three dependency)

**Rationale**:

- Directive-first pattern is production library standard (BoxComponent proves feasibility)
- Complex particle systems benefit from angular-three's frame loop utilities
- Removing angular-three entirely would require reimplementing features already available

**Evidence**:

- Directive pattern: libs/angular-3d/src/lib/primitives/box.component.ts:24-51
- Per-scene services: libs/angular-3d/src/lib/store/scene-graph.store.ts:54 (Injectable without providedIn)

---

## 📋 Component Specifications (Priority Order)

### PHASE 0: Critical Architecture Fixes (P0) - 5 hours

#### Fix 1: EffectComposerService - Component-Scoped

**Purpose**: Make EffectComposerService per-scene (not singleton) to support multiple independent scenes.

**Current Issue**: If providedIn: 'root', multiple scenes would share one composer.

**Pattern**:

```typescript
// Change from:
@Injectable({ providedIn: 'root' })
export class EffectComposerService {}

// To:
@Injectable() // Component-scoped - provided by Scene3dComponent
export class EffectComposerService {}
```

**Quality Requirements**:

- Must be component-scoped (like SceneGraphStore)
- Scene3dComponent must provide this service in its providers array
- Verify with 2 scenes in demo app (each has independent composer)

**Files Affected**:

- MODIFY: `libs/angular-3d/src/lib/postprocessing/effect-composer.service.ts`
- MODIFY: `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` (add to providers)

**Evidence**:

- Pattern: libs/angular-3d/src/lib/store/scene-graph.store.ts:54 (@Injectable without providedIn)
- Requirement: task-description.md:206-207 (CRITICAL: component-scoped)

---

#### Fix 2: BloomEffectComponent - Renderer Size Reactivity

**Purpose**: Ensure BloomPass updates when renderer size changes.

**Current Issue**: Pass may not react to viewport resizes.

**Pattern**:

```typescript
export class BloomEffectComponent {
  constructor() {
    // React to renderer size changes
    effect(() => {
      const renderer = this.sceneService.renderer();
      const pass = this.bloomPass;
      if (!renderer || !pass) return;

      const size = renderer.getSize(new THREE.Vector2());
      pass.resolution.set(size.x, size.y);
    });
  }
}
```

**Quality Requirements**:

- Reactive to renderer() signal changes
- Proper cleanup: removePass() and dispose() in DestroyRef.onDestroy()
- Works with component-scoped EffectComposerService

**Files Affected**:

- MODIFY: `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts`

**Evidence**:

- Requirement: task-description.md:197-201
- Pattern: Signal-based reactivity throughout libs/angular-3d

---

#### Fix 3: GltfModelComponent - Verify Per-Scene Integration

**Purpose**: Ensure GLTF loading works correctly with per-scene services and NG_3D_PARENT.

**Current Issue**: Component was commented out during TASK_2025_015 debugging.

**Pattern**:

```typescript
export class GltfModelComponent {
  private readonly parent = inject(NG_3D_PARENT);
  private readonly gltfLoader = inject(GltfLoaderService);
  private readonly destroyRef = inject(DestroyRef);

  private model: THREE.Group | null = null;

  constructor() {
    effect(() => {
      const modelPath = this.modelPath();
      const parent = this.parent();
      if (!modelPath || !parent) return;

      // Cleanup previous model
      if (this.model) {
        parent.remove(this.model);
        // Dispose model resources
      }

      // Load new model
      const data = this.gltfLoader.load(modelPath, { useDraco: this.useDraco() });
      effect(() => {
        const gltfData = data(); // Signal from GltfLoaderService
        if (!gltfData) return;

        this.model = gltfData.scene;
        parent.add(this.model);
        // Apply transforms, material overrides
      });
    });
  }
}
```

**Quality Requirements**:

- Proper model cleanup on path change (no memory leaks)
- Material overrides apply correctly (colorOverride, metalness, roughness)
- NG_3D_PARENT used for scene hierarchy

**Files Affected**:

- MODIFY: `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`

**Evidence**:

- Requirement: task-description.md:213-234
- NG_3D_PARENT pattern: libs/angular-3d/CLAUDE.md:171-181

---

### PHASE 1: High-Impact Particle Text Components (P1) - 25 hours

#### Component 1: InstancedParticleTextComponent

**Purpose**: Performant particle text using THREE.InstancedMesh with billboard rotation and smoke texture.

**Pattern**: Direct Three.js manipulation with angular-three frame loop.

**Architecture**:

- **NO angular-three template primitives** (no `<ngt-*>`)
- **YES angular-three utilities**: `injectBeforeRender()` for frame loop
- Inject NG_3D_PARENT for scene hierarchy
- Use RenderLoopService as fallback (if removing injectBeforeRender)

**Implementation Pattern**:

```typescript
import { Component, input, effect, viewChild, ElementRef, inject, DestroyRef } from '@angular/core';
import { injectBeforeRender } from 'angular-three'; // Frame loop utility
import { NG_3D_PARENT } from '@hive-academy/angular-3d';
import * as THREE from 'three';

@Component({
  selector: 'a3d-instanced-particle-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`, // No angular-three templates
  providers: [{ provide: OBJECT_ID, useFactory: () => `instanced-particle-text-${crypto.randomUUID()}` }],
})
export class InstancedParticleTextComponent implements OnDestroy {
  // Signal inputs
  readonly text = input.required<string>();
  readonly fontSize = input<number>(60);
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly particleColor = input<number>(0x00d4ff);
  readonly opacity = input<number>(0.15);
  readonly maxParticleScale = input<number>(0.15);
  readonly particlesPerPixel = input<number>(3);

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  // Internal state
  private instancedMesh?: THREE.InstancedMesh;
  private particles: ParticleData[] = [];
  private smokeTexture?: THREE.CanvasTexture;

  constructor() {
    // Effect: Initialize particle system when text changes
    effect(() => {
      const parent = this.parent();
      const text = this.text();
      if (!parent || !text) return;

      // Sample text, create particles, create InstancedMesh
      this.refreshText(text, this.fontSize());

      // Add to parent
      if (this.instancedMesh) {
        parent.add(this.instancedMesh);
      }
    });

    // Frame loop animation using angular-three utility
    injectBeforeRender(({ camera, delta }) => {
      this.animateParticles(camera);
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      const parent = this.parent();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as THREE.Material).dispose();
      }
      this.smokeTexture?.dispose();
    });
  }

  // Methods: sampleTextCoordinates, createParticle, animateParticles, createSmokeTexture
  // (same logic as temp/ version, just different initialization pattern)
}
```

**Quality Requirements**:

- **Functional**:

  - Render 10,000+ particles at 60fps
  - Billboard rotation (particles face camera)
  - Smoke texture with fractal noise (createSmokeTexture method)
  - Particle lifecycle: grow → pulse → shrink

- **Architectural**:
  - Use NG_3D_PARENT for scene hierarchy (no manual scene access)
  - Signal-based inputs (input<T>())
  - Effect-based reactivity (no ngOnChanges)
  - DestroyRef cleanup (dispose geometry, material, texture)
  - Minimal angular-three usage (only injectBeforeRender)

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/components/primitives/instanced-particle-text.component.ts:1-525
- Requirements: task-description.md:40-51 (InstancedMesh, billboard, lifecycle)
- NG_3D_PARENT: libs/angular-3d/CLAUDE.md:171-181

---

#### Component 2: SmokeParticleTextComponent

**Purpose**: Dense particle clouds forming text with organic drift animation.

**Pattern**: Same as InstancedParticleTextComponent (direct Three.js + angular-three frame loop).

**Implementation Pattern**:

```typescript
@Component({
  selector: 'a3d-smoke-particle-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [{ provide: OBJECT_ID, useFactory: () => `smoke-particle-text-${crypto.randomUUID()}` }],
})
export class SmokeParticleTextComponent implements OnDestroy {
  // Signal inputs
  readonly text = input.required<string>();
  readonly fontSize = input<number>(100);
  readonly particleDensity = input<number>(50);
  readonly smokeColor = input<number>(0x8a2be2); // Purple
  readonly driftSpeed = input<number>(0.02);

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  // Internal state
  private particleSystem?: THREE.Points;
  private particleTexture?: THREE.CanvasTexture;
  private particles: ParticleData[] = [];

  constructor() {
    // Effect: Initialize on text change
    effect(() => {
      const parent = this.parent();
      const text = this.text();
      if (!parent || !text) return;

      // Sample text pixels, generate particles, create Points system
      const positions = this.sampleTextPositions(text, this.fontSize());
      this.generateParticlesFromPositions(positions, this.particleDensity());
      this.createParticleSystem(parent);
    });

    // Animation: Organic drift using simplex noise
    injectBeforeRender(({ delta }) => {
      this.animateParticles(delta);
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      if (this.particleSystem) {
        this.parent().remove(this.particleSystem);
        this.particleSystem.geometry.dispose();
        (this.particleSystem.material as THREE.PointsMaterial).dispose();
      }
      this.particleTexture?.dispose();
    });
  }

  // Methods: sampleTextPositions, generateParticlesFromPositions, animateParticles
}
```

**Quality Requirements**:

- **Functional**:

  - Dense particle clustering (50+ particles per 100 pixels)
  - Organic drift using multi-octave noise
  - Additive blending for volumetric smoke appearance

- **Architectural**:
  - Same as InstancedParticleTextComponent
  - THREE.Points geometry (not InstancedMesh)

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/components/primitives/smoke-particle-text.component.ts:1-344
- Requirements: task-description.md:27-38

---

#### Component 3: GlowParticleTextComponent

**Purpose**: Neon tube-like glowing text with pulse/flow animation.

**Pattern**: Same as SmokeParticleTextComponent + bloom integration.

**Implementation Pattern**:

```typescript
@Component({
  selector: 'a3d-glow-particle-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [{ provide: OBJECT_ID, useFactory: () => `glow-particle-text-${crypto.randomUUID()}` }],
})
export class GlowParticleTextComponent implements OnDestroy {
  // Signal inputs
  readonly text = input.required<string>();
  readonly glowColor = input<number>(0x00d4ff); // Cyan
  readonly glowIntensity = input<number>(3.0);
  readonly pulseSpeed = input<number>(2.0);
  readonly flowSpeed = input<number>(1.0);

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  // Internal state
  private particleSystem?: THREE.Points;
  private time = 0;

  constructor() {
    // Similar to SmokeParticleText, but:
    // - Higher particle density (70+)
    // - Flow animation along text path
    // - Bright emissive colors (toneMapped: false)

    injectBeforeRender(({ delta }) => {
      this.animateGlow(delta);
      // Global pulse + flow wave animation
    });
  }
}
```

**Quality Requirements**:

- **Functional**:
  - Neon tube aesthetic (tight particle clustering)
  - Flow animation traveling along text (pathPosition-based pulse)
  - Bloom-ready (toneMapped: false, bright colors)

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Dependencies**: BloomEffectComponent (P0)

**Evidence**:

- Source: temp/angular-3d/components/primitives/glow-particle-text.component.ts:1-339
- Requirements: task-description.md:33-38

---

#### Component 4: NebulaVolumetricComponent

**Purpose**: Realistic shader-based nebula clouds with 3D Perlin noise and domain warping.

**Pattern**: Shader component using angular-three NgtArgs (keep angular-three for shader material bindings).

**Implementation Pattern**:

```typescript
import { Component, input, effect, inject, DestroyRef } from '@angular/core';
import { NgtArgs } from 'angular-three'; // For shader material args
import { NG_3D_PARENT } from '@hive-academy/angular-3d';
import * as THREE from 'three';

@Component({
  selector: 'a3d-nebula-volumetric',
  standalone: true,
  imports: [NgtArgs],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`, // No ngt-group, manage Three.js group directly
  providers: [{ provide: OBJECT_ID, useFactory: () => `nebula-${crypto.randomUUID()}` }],
})
export class NebulaVolumetricComponent implements OnDestroy {
  // Signal inputs
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly width = input<number>(120);
  readonly height = input<number>(60);
  readonly layers = input<number>(2);
  readonly opacity = input<number>(0.6);
  readonly enableFlow = input<boolean>(true);
  readonly primaryColor = input<string>('#0088ff');

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  // Internal state
  private readonly group = new THREE.Group();
  private readonly layer1Uniforms: { [uniform: string]: THREE.IUniform } = {
    /* ... */
  };
  private readonly layer2Uniforms: { [uniform: string]: THREE.IUniform } = {
    /* ... */
  };

  constructor() {
    // Add group to parent
    effect(() => {
      const parent = this.parent();
      if (parent) {
        parent.add(this.group);
        this.group.position.set(...this.position());
      }
    });

    // Create shader planes programmatically
    effect(() => {
      this.createNebulaLayers();
    });

    // React to color inputs
    effect(() => {
      const primary = new THREE.Color(this.primaryColor());
      this.layer1Uniforms['uPrimaryColor'].value = primary;
      this.layer2Uniforms['uPrimaryColor'].value = primary;
    });

    // Animation loop
    if (this.enableFlow()) {
      injectBeforeRender(({ delta }) => {
        this.layer1Uniforms['uTime'].value += delta;
        this.layer2Uniforms['uTime'].value += delta;
      });
    }

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.parent().remove(this.group);
      this.group.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.ShaderMaterial).dispose();
        }
      });
    });
  }

  private createNebulaLayers(): void {
    // Create layer 1 mesh with ShaderMaterial
    const planeGeometry = new THREE.PlaneGeometry(this.width(), this.height(), 256, 256);
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader: this.vertexShader,
      fragmentShader: this.fragmentShader,
      uniforms: this.layer1Uniforms,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const layer1Mesh = new THREE.Mesh(planeGeometry, shaderMaterial);
    this.group.add(layer1Mesh);

    // Create layer 2 if enabled
    if (this.layers() >= 2) {
      // Similar to layer 1
    }
  }

  // Shader code properties (same as temp/ version)
  private readonly vertexShader = `/* ... */`;
  private readonly fragmentShader = `/* GLSL with FBM, domain warping ... */`;
}
```

**Quality Requirements**:

- **Functional**:

  - Multi-layer shader planes with 3D Perlin noise
  - Domain warping for organic smoke tendrils
  - Ultra-soft edge falloff (no visible geometry boundaries)
  - Configurable colors, opacity, flow speed, density

- **Architectural**:
  - Direct Three.js group management (no `<ngt-group>`)
  - Minimal angular-three usage (only NgtArgs if needed, injectBeforeRender)
  - Shader material uniforms reactive to signal inputs

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/components/primitives/nebula-volumetric.component.ts:1-482
- Requirements: task-description.md:81-87

---

#### Component 5: FloatingSphereComponent

**Purpose**: Metallic sphere with MeshPhysicalMaterial and optional glow effect.

**Pattern**: Convert from angular-three template to directive-first pattern.

**Implementation Pattern**:

```typescript
@Component({
  selector: 'a3d-floating-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [{ provide: OBJECT_ID, useFactory: () => `floating-sphere-${crypto.randomUUID()}` }],
  hostDirectives: [MeshDirective, { directive: SphereGeometryDirective, inputs: ['radius', 'widthSegments', 'heightSegments'] }, { directive: TransformDirective, inputs: ['position', 'rotation', 'scale'] }, { directive: PhysicalMaterialDirective, inputs: ['color', 'metalness', 'roughness', 'clearcoat', 'transmission'] }],
})
export class FloatingSphereComponent {
  // Signal inputs - forwarded to directives
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly radius = input<number>(1);
  readonly color = input<number>(0xff0000);
  readonly metalness = input<number>(0.8);
  readonly roughness = input<number>(0.2);
  readonly clearcoat = input<number>(1.0);
  readonly transmission = input<number>(0.1);

  // Optional glow effect
  readonly glowConfig = input<{ color?: number; opacity?: number; scale?: number } | undefined>(undefined);
}
```

**Alternative (if PhysicalMaterialDirective doesn't exist)**: Create PhysicalMaterialDirective following StandardMaterialDirective pattern.

**Quality Requirements**:

- **Functional**:

  - MeshPhysicalMaterial with metalness, roughness, clearcoat, transmission, ior
  - Optional glow effect (BackSide sphere)
  - Float3D directive integration

- **Architectural**:
  - Directive-first pattern (like BoxComponent)
  - NO angular-three templates
  - Glow as nested mesh or via Glow3dDirective (P2 dependency)

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/floating-sphere.component.ts`
- CREATE (if needed): `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts`
- CREATE (if needed): `libs/angular-3d/src/lib/directives/geometries/sphere-geometry.directive.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Dependencies**: Glow3dDirective (P2) for glow effect

**Evidence**:

- Source: temp/angular-3d/components/primitives/floating-sphere.component.ts:1-299
- Requirements: task-description.md:74-80
- Directive pattern: libs/angular-3d/src/lib/primitives/box.component.ts:24-51

---

### PHASE 2: Background & Enhancement Directives (P2) - 12 hours

#### Component 6: BackgroundCubeComponent

**Purpose**: Single cube primitive with Lambert material for background decoration.

**Pattern**: Convert from angular-three to directive-first.

**Implementation Pattern**:

```typescript
@Component({
  selector: 'a3d-background-cube',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<ng-content />`,
  providers: [{ provide: OBJECT_ID, useFactory: () => `background-cube-${crypto.randomUUID()}` }],
  hostDirectives: [
    MeshDirective,
    { directive: BoxGeometryDirective, inputs: ['args'] }, // args = size array
    { directive: TransformDirective, inputs: ['position', 'rotation', 'scale'] },
    { directive: LambertMaterialDirective, inputs: ['color', 'transparent', 'opacity', 'emissive'] },
    // NOTE: Float3dDirective and Performance3dDirective applied by consumer
  ],
})
export class BackgroundCubeComponent {
  // Signal inputs
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly size = input<[number, number, number] | number>([1, 1, 1]);
  readonly color = input<number>(0x4a90e2);
  readonly transparent = input<boolean>(false);
  readonly opacity = input<number>(1.0);
}
```

**Note**: If LambertMaterialDirective doesn't exist, create it following StandardMaterialDirective pattern.

**Quality Requirements**:

- **Functional**:

  - Simple cube with Lambert material (performance-optimized)
  - Shadow casting/receiving support
  - Integrates with Float3dDirective and Performance3dDirective

- **Architectural**:
  - Directive-first pattern (like BoxComponent)
  - No angular-three templates

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/background-cube.component.ts`
- CREATE (if needed): `libs/angular-3d/src/lib/directives/materials/lambert-material.directive.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/components/primitives/background-cube.component.ts:1-286
- Requirements: task-description.md:67-73
- Directive pattern: libs/angular-3d/src/lib/primitives/box.component.ts:24-51

---

#### Component 7: BackgroundCubesComponent

**Purpose**: Collection manager generating multiple BackgroundCubeComponent instances.

**Pattern**: Computed signal-based generation + Angular @for template.

**Implementation Pattern**:

```typescript
@Component({
  selector: 'a3d-background-cubes',
  standalone: true,
  imports: [BackgroundCubeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (cube of cubes(); track $index) {
    <a3d-background-cube [position]="cube.position" [size]="cube.size" [color]="cube.color" [rotation]="cube.rotation" [transparent]="transparent()" [opacity]="opacity()" />
    }
  `,
})
export class BackgroundCubesComponent {
  // Configuration inputs
  readonly count = input<number>(180);
  readonly colorPalette = input<number[]>([0x7b3ab3, 0x6a2ba7, 0x8a2be2]);
  readonly exclusionZone = input<{ x: number; y: number }>({ x: 12, y: 8 });
  readonly sizeRange = input<{ min: number; max: number }>({ min: 0.8, max: 2.6 });
  readonly depthRange = input<{ min: number; max: number }>({ min: -28, max: -8 });

  // Computed cube configurations
  readonly cubes = computed(() => this.generateCubes());

  private generateCubes(): CubeConfig[] {
    // Same logic as temp/ version:
    // - Zone-based distribution (top, bottom, left, right)
    // - Exclusion zone avoidance
    // - Random size, color, rotation
  }
}
```

**Quality Requirements**:

- **Functional**:

  - Zone-based distribution (top/bottom/left/right areas)
  - Exclusion zone to avoid foreground content
  - Configurable count, colors, size range, depth range

- **Architectural**:
  - Pure Angular computed signals (no angular-three)
  - Uses BackgroundCubeComponent (P2 dependency)

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/primitives/background-cubes.component.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Dependencies**: BackgroundCubeComponent (P2)

**Evidence**:

- Source: temp/angular-3d/components/primitives/background-cubes.component.ts:1-199
- Requirements: task-description.md:60-66

---

#### Directive 8: Glow3dDirective

**Purpose**: Add glow/halo effect to any 3D object using BackSide sphere technique.

**Pattern**: Directive with getMesh() method access pattern.

**Implementation Pattern**:

```typescript
@Directive({
  selector: '[a3dGlow3d]',
  standalone: true,
})
export class Glow3dDirective implements AfterViewInit, OnDestroy {
  // DI
  private readonly elementRef = inject(ElementRef<THREE.Mesh>);
  private readonly destroyRef = inject(DestroyRef);

  // Configuration inputs
  readonly glowColor = input<number>(0xffffff);
  readonly glowIntensity = input<number>(0.2);
  readonly glowScale = input<number>(1.2);
  readonly glowSegments = input<number>(16);
  readonly autoAdjustQuality = input<boolean>(true);

  // Internal state
  private targetMesh: THREE.Mesh | null = null;
  private glowMesh: THREE.Mesh | null = null;

  ngAfterViewInit(): void {
    // Get mesh from component's getMesh() method (if available)
    const component = this.elementRef.nativeElement as any;
    if (typeof component.getMesh === 'function') {
      this.targetMesh = component.getMesh();
    }

    if (this.targetMesh) {
      this.createGlowEffect();
    }
  }

  private createGlowEffect(): void {
    // Create BackSide sphere mesh
    const baseRadius = this.targetMesh!.geometry.boundingSphere?.radius || 1;
    const glowRadius = baseRadius * this.glowScale();

    this.glowGeometry = new THREE.SphereGeometry(glowRadius, this.glowSegments(), this.glowSegments());
    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(this.glowColor()),
      transparent: true,
      opacity: this.glowIntensity(),
      side: THREE.BackSide,
      depthWrite: false,
    });

    this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);
    this.targetMesh!.add(this.glowMesh); // Add as child
  }

  constructor() {
    // Reactive effects for color/intensity changes
    effect(() => {
      if (this.glowMaterial) {
        this.glowMaterial.color.setHex(this.glowColor());
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      if (this.glowMesh && this.targetMesh) {
        this.targetMesh.remove(this.glowMesh);
      }
      this.glowGeometry?.dispose();
      this.glowMaterial?.dispose();
    });
  }
}
```

**Quality Requirements**:

- **Functional**:

  - Automatic glow mesh creation/cleanup
  - Configurable color, intensity, scale, segments
  - Auto-adjust quality based on performance health (optional)

- **Architectural**:
  - Works with any component exposing getMesh() method
  - Signal-based reactivity for inputs
  - DestroyRef cleanup

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/directives/glow-3d.directive.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/directives/glow-3d.directive.ts:1-339
- Requirements: task-description.md:96-101

---

#### Directive 9: SpaceFlight3dDirective

**Purpose**: Cinematic space flight animation with multi-phase waypoint navigation.

**Pattern**: Directive using injectBeforeRender for animation.

**Implementation Pattern**:

```typescript
@Directive({
  selector: '[a3dSpaceFlight3d]',
  standalone: true,
})
export class SpaceFlight3dDirective implements OnInit, AfterViewInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject<ElementRef<THREE.Object3D>>(ElementRef);

  // Configuration inputs
  readonly flightPath = input<SpaceFlightWaypoint[] | undefined>(undefined);
  readonly rotationsPerCycle = input<number>(8);
  readonly loop = input<boolean>(true);
  readonly autoStart = input<boolean>(true);
  readonly delay = input<number>(0);

  // Lifecycle outputs
  readonly animationStarted = output<void>();
  readonly animationComplete = output<void>();
  readonly waypointReached = output<{ index: number; position: [number, number, number] }>();

  // Internal state
  private object3D: THREE.Object3D | null = null;
  private isAnimating = false;
  private currentWaypointIndex = 0;

  constructor() {
    // Frame loop using angular-three utility
    injectBeforeRender(({ delta }) => {
      if (!this.isAnimating || !this.object3D) return;

      // Interpolate position between waypoints
      // Apply continuous rotation
      // Emit waypointReached events
    });
  }

  ngAfterViewInit(): void {
    this.object3D = this.elementRef.nativeElement as THREE.Object3D;

    // Auto-start if configured and flight path provided
    if (this.autoStart() && this.flightPath() && this.flightPath()!.length > 0) {
      setTimeout(() => this.start(), this.delay());
    }
  }

  start(): void {
    // Initialize animation state
    this.isAnimating = true;
    this.animationStarted.emit();
  }
}
```

**Quality Requirements**:

- **Functional**:

  - Multi-phase flight path with waypoints
  - Smooth interpolation with easing functions
  - Continuous rotation during flight
  - Infinite loop with seamless restart
  - Optional - no errors if flightPath not provided

- **Architectural**:
  - Directive composition pattern (like Float3dDirective)
  - injectBeforeRender for frame loop
  - Signal inputs and outputs

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/directives/space-flight-3d.directive.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/directives/space-flight-3d.directive.ts:1-300
- Requirements: task-description.md:102-110

---

### PHASE 3: Advanced Optimization Services (P3) - 15 hours

> **Note**: SpaceThemeStore removed from library scope - it's application-specific (space themes, nebula styles) and belongs in the demo app, not in the general-purpose @hive-academy/angular-3d library.

#### Service 10: AdvancedPerformanceOptimizerService

**Purpose**: Comprehensive performance optimizations with LOD, frustum culling, texture atlasing, memory management.

**Pattern**: Service integrating with Angular3DStateStore and PerformanceMonitorService.

**CRITICAL DECISION**: Component-scoped or singleton?

**Analysis**:

- Requirements say: "CRITICAL\*\*: Service MUST be component-scoped (NOT providedIn: 'root'), injected per-Scene3dComponent"
- BUT: Temp source code has `@Injectable({ providedIn: 'root' })`
- Decision: Follow requirements - make component-scoped for per-scene optimization

**Implementation Pattern**:

```typescript
@Injectable() // Component-scoped - provided by Scene3dComponent
export class AdvancedPerformanceOptimizerService {
  private readonly stateStore = inject(Angular3DStateStore);
  private readonly performanceMonitor = inject(PerformanceMonitorService);
  private readonly destroyRef = inject(DestroyRef);

  // Configuration signals
  private readonly frustumCullingConfig = signal<FrustumCullingConfig>({
    enabled: true,
    margin: 1.2,
    updateFrequency: 30,
    batchSize: 50,
  });

  private readonly performanceTarget = signal<PerformanceTarget>({
    targetFPS: 60,
    maxFrameTime: 16.67,
    qualityPreference: 'balanced',
    adaptiveScaling: true,
  });

  // Computed signals
  readonly performanceHealthScore = computed(() => {
    const metrics = this.stateStore.performanceStatus();
    const target = this.performanceTarget();

    const fpsScore = Math.min(metrics.fps / target.targetFPS, 1);
    const frameTimeScore = Math.min(target.maxFrameTime / (metrics.frameTime || target.maxFrameTime), 1);

    return Math.round(((fpsScore + frameTimeScore) / 2) * 100);
  });

  readonly shouldOptimize = computed(() => {
    const score = this.performanceHealthScore();
    return this.performanceTarget().adaptiveScaling && score < 80;
  });

  // Methods
  initialize(sceneId: string, camera?: THREE.Camera): void {
    // Initialize frustum culling, texture atlasing, memory management
  }

  optimize(): void {
    // Perform optimization pass
  }

  getPerformanceRecommendations(): Array<OptimizationRecommendation> {
    // Return actionable recommendations
  }
}
```

**Quality Requirements**:

- **Functional**:

  - Enhanced LOD system with distance-based quality scaling
  - Frustum culling with batch processing
  - Memory management with cleanup intervals
  - Real-time performance adaptation (adaptive scaling)
  - Performance health score (0-100) computed signal

- **Architectural**:
  - Component-scoped (provided by Scene3dComponent)
  - Integrates with Angular3DStateStore and PerformanceMonitorService
  - Signal-based configuration and metrics
  - RxJS for interval-based tasks (takeUntilDestroyed)

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/services/advanced-performance-optimizer.service.ts`
- MODIFY: `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` (add to providers)
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/services/advanced-performance-optimizer.service.ts:1-642
- Requirements: task-description.md:134-155 (component-scoped CRITICAL)

---

#### Directive 11: Performance3dDirective

**Purpose**: Register object for automatic optimization with AdvancedPerformanceOptimizerService.

**Pattern**: Directive integrating with AdvancedPerformanceOptimizerService.

**Implementation Pattern**:

```typescript
@Directive({
  selector: '[a3dPerformance3d]',
  standalone: true,
})
export class Performance3dDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<THREE.Object3D>);
  private readonly optimizer = inject(AdvancedPerformanceOptimizerService);
  private readonly destroyRef = inject(DestroyRef);

  // Configuration input
  readonly performanceConfig = input<{ enabled: boolean } | boolean>(true);

  private object3D: THREE.Object3D | null = null;

  ngAfterViewInit(): void {
    this.object3D = this.elementRef.nativeElement as THREE.Object3D;

    if (this.performanceConfig()) {
      this.optimizer.registerObject(this.object3D);
    }
  }

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.object3D) {
        this.optimizer.unregisterObject(this.object3D);
      }
    });
  }
}
```

**Quality Requirements**:

- **Functional**:

  - Register object with AdvancedPerformanceOptimizerService
  - Automatic frustum culling and LOD management
  - Lifecycle-aware cleanup on destroy

- **Architectural**:
  - Aligns with per-scene optimizer (not singleton)
  - Simple directive pattern

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/directives/performance-3d.directive.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Dependencies**: AdvancedPerformanceOptimizerService (P3)

**Evidence**:

- Source: temp/angular-3d/directives/performance-3d.directive.ts
- Requirements: task-description.md:111-117

---

#### Directive 12: ScrollZoomCoordinatorDirective

**Purpose**: Bridge 3D camera zoom and page scrolling with smooth transitions.

**Pattern**: Directive for OrbitControls with NgZone.runOutsideAngular for performance.

**Implementation Pattern**:

```typescript
@Directive({
  selector: '[a3dScrollZoomCoordinator]',
  standalone: true,
})
export class ScrollZoomCoordinatorDirective implements AfterViewInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly minZoom = input<number>(0.5);
  readonly maxZoom = input<number>(2.0);
  readonly scrollSensitivity = input<number>(0.001);
  readonly zoomThreshold = input<number>(0.01);

  // Outputs
  readonly stateChange = output<'zoom' | 'scroll'>();
  readonly scrollTransition = output<{ from: 'zoom'; to: 'scroll' }>();
  readonly zoomEnabledChange = output<boolean>();

  private controls: any; // OrbitControls

  ngAfterViewInit(): void {
    // Get controls from element

    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('wheel', this.handleWheel);
    });
  }

  private handleWheel = (event: WheelEvent): void => {
    // Check zoom limits
    // Transition between camera zoom and page scroll
    // Emit events
  };
}
```

**Quality Requirements**:

- **Functional**:

  - Smooth transition between camera zoom and page scrolling
  - Prevent scroll conflicts at zoom limits
  - Configurable thresholds and sensitivity
  - Delta time-aware for consistent behavior

- **Architectural**:
  - NgZone.runOutsideAngular for performance
  - Signal-based inputs and outputs
  - Proper event cleanup

**Files Affected**:

- CREATE: `libs/angular-3d/src/lib/directives/scroll-zoom-coordinator.directive.ts`
- MODIFY: `libs/angular-3d/src/index.ts` (export)

**Evidence**:

- Source: temp/angular-3d/directives/scroll-zoom-coordinator.directive.ts
- Requirements: task-description.md:118-125

---

## 🔗 Integration Architecture

### Integration Point 1: Per-Scene Service Provisioning

**Pattern**:

```typescript
// Scene3dComponent provides all per-scene services
@Component({
  selector: 'a3d-scene-3d',
  providers: [
    SceneGraphStore,
    RenderLoopService,
    EffectComposerService, // P0 fix
    AdvancedPerformanceOptimizerService, // P3 addition
  ],
})
export class Scene3dComponent {
  // Each scene instance has its own service instances
}
```

**Evidence**: libs/angular-3d/src/lib/store/scene-graph.store.ts:54 (@Injectable without providedIn)

---

### Integration Point 2: Component Registration Flow

**Pattern**:

```typescript
// 1. Component creates Three.js object
// 2. Injects NG_3D_PARENT for hierarchy
// 3. Adds object to parent in afterNextRender or effect

@Component({})
export class ParticleTextComponent {
  private readonly parent = inject(NG_3D_PARENT);

  constructor() {
    effect(() => {
      const parent = this.parent();
      const particleSystem = this.createParticleSystem();
      if (parent && particleSystem) {
        parent.add(particleSystem);
      }
    });
  }
}
```

**Evidence**: libs/angular-3d/CLAUDE.md:171-181

---

### Integration Point 3: Render Loop Registration

**Pattern**:

```typescript
// Components register update callbacks with RenderLoopService
constructor() {
  const cleanup = this.renderLoop.registerUpdateCallback((delta, elapsed) => {
    this.animateParticles(delta);
  });

  this.destroyRef.onDestroy(cleanup);
}
```

**Evidence**: libs/angular-3d/CLAUDE.md:200-210

**Alternative (temp/ pattern)**: Use injectBeforeRender from angular-three (acceptable for complex animations).

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

- **Performance**: Maintain 60fps with 100+ particle text characters (RTX 3060 equivalent)
- **Memory**: Particle systems < 200MB total memory
- **Instancing**: InstancedParticleTextComponent handles 10,000+ particles at 60fps
- **GLTF Loading**: Models < 5MB load within 2 seconds on 50Mbps connection
- **Culling**: Frustum culling reduces render cost by 50%+ for off-screen objects

### Non-Functional Requirements

- **TypeScript Strict Mode**: All code passes strict type checking with no 'any' (enforced by ESLint)
- **Signal-Based Reactivity**: ALL inputs use signal-based input<T>() and input.required<T>()
- **Directive-First Pattern**: Simple mesh-based primitives use hostDirectives (MeshDirective, GeometryDirective, MaterialDirective)
- **Resource Cleanup**: ALL Three.js objects disposed in DestroyRef.onDestroy() or ngOnDestroy()
- **No Singletons for Scene State**: SceneGraphStore, RenderLoopService, EffectComposerService, AdvancedPerformanceOptimizerService are component-scoped
- **Error Handling**: Graceful fallbacks for missing resources (models, textures), console warnings only
- **Naming Conventions**: All components use 'a3d-' selector prefix

### Pattern Compliance

- **Signal Inputs**: `readonly text = input.required<string>()` (NOT @Input())
- **Signal Queries**: `readonly groupRef = viewChild<ElementRef<Group>>('ref')` (NOT @ViewChild())
- **Effect-Based Side Effects**: `effect(() => { /* ... */ })` (NOT ngOnChanges)
- **DestroyRef Cleanup**: `this.destroyRef.onDestroy(() => { /* cleanup */ })` (NOT ngOnDestroy unless implementing OnDestroy interface)

**Evidence**: All production library components follow these patterns (libs/angular-3d/src/lib/primitives/\*.ts)

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: **backend-developer**

**Rationale**:

1. **Angular Architecture Work** (70% of effort):

   - Service architecture (SceneGraphStore integration, RenderLoopService usage)
   - Dependency injection patterns (NG_3D_PARENT, component-scoped services)
   - Signal-based state management (computed signals, effects)
   - TypeScript strict mode compliance

2. **Three.js Integration** (25% of effort):

   - Direct Three.js object manipulation (InstancedMesh, Points, ShaderMaterial)
   - Resource lifecycle management (geometry/material disposal)
   - Render loop integration

3. **UI/Visual Work** (5% of effort):
   - Minimal UI concerns (no DOM manipulation, CSS, or layouts)
   - Visual output is 3D graphics (programmatic, not template-based)

The backend-developer has expertise in Angular architecture, TypeScript, and complex service patterns, making them ideal for this migration work.

---

### Complexity Assessment

**Complexity**: **HIGH**

**Estimated Effort**: **57 hours** (~7 developer days)

**Breakdown**:

- **P0 (Critical Fixes)**: 5 hours (per-scene service fixes, GLTF verification)
- **P1 (Particle Text)**: 25 hours (complex particle systems, shader components)
- **P2 (Background/Directives)**: 12 hours (directive conversion, glow effect)
- **P3 (Optimization)**: 15 hours (advanced performance service, directives)

> SpaceThemeStore excluded - belongs in demo app, not library

**Complexity Factors**:

- **Architecture Migration**: Converting angular-three patterns to @hive-academy/angular-3d patterns
- **Per-Scene Service Integration**: Ensuring all components work with component-scoped services
- **Complex Particle Logic**: InstancedMesh management, shader materials, fractal noise
- **Signal-Based Reactivity**: Replacing lifecycle hooks with effects throughout

---

### Files Affected Summary

#### CREATE (14 new files):

**Primitives**:

- `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts`
- `libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts`
- `libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts`
- `libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts`
- `libs/angular-3d/src/lib/primitives/floating-sphere.component.ts`
- `libs/angular-3d/src/lib/primitives/background-cube.component.ts`
- `libs/angular-3d/src/lib/primitives/background-cubes.component.ts`

**Directives**:

- `libs/angular-3d/src/lib/directives/glow-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/space-flight-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/performance-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/scroll-zoom-coordinator.directive.ts`

**Services**:

- `libs/angular-3d/src/lib/services/advanced-performance-optimizer.service.ts`

**Supporting**:

- `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts` (if needed)
- `libs/angular-3d/src/lib/directives/materials/lambert-material.directive.ts` (if needed)

#### MODIFY (4 files):

- `libs/angular-3d/src/lib/postprocessing/effect-composer.service.ts` (make component-scoped)
- `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts` (renderer size reactivity)
- `libs/angular-3d/src/lib/primitives/gltf-model.component.ts` (verify per-scene integration)
- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` (add EffectComposerService, AdvancedPerformanceOptimizerService to providers)

#### MODIFY (1 public API file):

- `libs/angular-3d/src/index.ts` (export all new components, directives, services)

---

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **All imports exist in codebase**:

   - SceneGraphStore from `libs/angular-3d/src/lib/store/scene-graph.store.ts`
   - RenderLoopService from `libs/angular-3d/src/lib/render-loop/render-loop.service.ts`
   - NG_3D_PARENT token from `libs/angular-3d/src/lib/types/tokens.ts`
   - MeshDirective, GeometryDirectives, MaterialDirectives from `libs/angular-3d/src/lib/directives/`

2. **All patterns verified from examples**:

   - Directive-first pattern: libs/angular-3d/src/lib/primitives/box.component.ts:24-51
   - Per-scene services: libs/angular-3d/src/lib/store/scene-graph.store.ts:54
   - NG_3D_PARENT usage: libs/angular-3d/CLAUDE.md:171-181
   - Signal inputs: All production components use input<T>()

3. **Library documentation consulted**:

   - libs/angular-3d/CLAUDE.md (Component patterns, parent-child relationships, render loop integration)

4. **No hallucinated APIs**:
   - All angular-three imports verified: extend(), injectBeforeRender(), NgtArgs
   - All Three.js types verified: InstancedMesh, Points, ShaderMaterial, PlaneGeometry
   - All @hive-academy/angular-3d exports verified

---

### Architecture Delivery Checklist

- [x] All components specified with evidence (12 components/directives/services - SpaceThemeStore excluded as app-specific)
- [x] All patterns verified from codebase (directive-first, per-scene services, signal-based)
- [x] All imports/decorators verified as existing (SceneGraphStore, RenderLoopService, NG_3D_PARENT)
- [x] Quality requirements defined (functional, non-functional, pattern compliance)
- [x] Integration points documented (per-scene services, NG_3D_PARENT, render loop)
- [x] Files affected list complete (14 CREATE, 4 MODIFY, 1 public API)
- [x] Developer type recommended (backend-developer)
- [x] Complexity assessed (HIGH, 57 hours)
- [x] No step-by-step implementation (team-leader decomposes into atomic tasks)

---

## 📝 Implementation Notes

### Angular-Three Migration Strategy

**Decision**: **Hybrid Approach**

1. **Simple Mesh Primitives** (BackgroundCube, FloatingSphere):

   - Eliminate angular-three entirely
   - Use directive-first pattern (like BoxComponent)

2. **Complex Particle Systems** (InstancedParticleText, SmokeParticleText, GlowParticleText):

   - Remove `<ngt-*>` template primitives
   - Keep `injectBeforeRender()` for frame loop (acceptable exception)
   - Use NG_3D_PARENT for hierarchy (not manual scene access)

3. **Shader Components** (NebulaVolumetric):
   - Keep `NgtArgs` if needed for shader material bindings
   - Manage Three.js groups directly (no `<ngt-group>`)

**Rationale**: Full angular-three removal would require reimplementing frame loop utilities. Hybrid approach balances library purity with pragmatism.

---

### Testing Strategy

**Unit Tests** (Required for each component):

```typescript
describe('InstancedParticleTextComponent', () => {
  it('should create', () => {
    // Basic instantiation test
  });

  it('should sample text positions from canvas', () => {
    // Test sampleTextCoordinates logic
  });

  it('should dispose resources on destroy', () => {
    // Test cleanup
  });
});
```

**Integration Tests** (Demo app verification):

- Create demo scene with 2 scenes side-by-side
- Verify per-scene services work independently (meshes in correct scenes)
- Verify postprocessing works with multiple scenes

**Performance Tests**:

- Particle text with 1000+ characters
- Chrome DevTools heap snapshots for memory leak verification

---

### Risk Mitigations

**Risk 1**: Angular-three dependency removal breaks complex animations

**Mitigation**: Keep `injectBeforeRender()` for particle systems (exception to "no angular-three" rule).

---

**Risk 2**: Postprocessing breaks multiple scenes

**Mitigation**: Make EffectComposerService component-scoped (P0 critical fix). Test with 2+ scenes in demo app.

---

**Risk 3**: Performance degradation with complex particle systems

**Mitigation**: Implement AdvancedPerformanceOptimizerService (P3) with adaptive quality scaling. Profile with Chrome DevTools.

---

**Risk 4**: Memory leaks in particle systems

**Mitigation**: Strict cleanup protocol in DestroyRef.onDestroy() - dispose all geometries, materials, textures. Add heap snapshot tests.

---

## 🎯 Success Criteria

**Definition of Done**:

- All P0 and P1 components migrated and working
- All components follow directive-first pattern (or justified exception)
- All components work with per-scene services (tested with 2+ scenes)
- All Three.js resources properly disposed in cleanup
- All components have unit tests (basic instantiation + key features)
- Demo app showcases all components in working state
- Public API exports added to index.ts
- `npx nx build @hive-academy/angular-3d` succeeds with 0 errors/warnings
- `npx nx lint @hive-academy/angular-3d` succeeds with 0 errors/warnings
- `npx nx typecheck @hive-academy/angular-3d` succeeds with 0 type errors
- Performance benchmarks confirm 60fps targets met

**Stretch Goals (Optional)**:

- P2 and P3 components migrated (background decorations, advanced optimization)
- Visual regression tests automated
- Performance monitoring dashboard in demo app
