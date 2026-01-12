# Implementation Plan - TASK_2025_023

## 📊 Codebase Investigation Summary

### Libraries Discovered

**troika-three-text** (To be installed): v0.49.1
- Purpose: High-quality SDF text rendering for Three.js
- Key exports: Text class, preloadFont function, configureTextBuilder
- Documentation: https://protectwise.github.io/troika/troika-three-text/
- Architecture: Web worker-based font parsing, GPU-accelerated SDF generation

**Existing angular-3d Infrastructure**:
- **SceneService**: `libs/angular-3d/src/lib/canvas/scene.service.ts`
  - Provides camera access via signal: `scene()`, `camera()`, `renderer()`
- **RenderLoopService**: `libs/angular-3d/src/lib/render-loop/render-loop.service.ts`
  - Registers per-frame callbacks: `registerUpdateCallback(callback)`
  - Returns cleanup function
- **NG_3D_PARENT Token**: `libs/angular-3d/src/lib/types/tokens.ts:11`
  - Type: `InjectionToken<() => Object3D | null>`
  - Purpose: Inject parent for scene hierarchy
- **OBJECT_ID Token**: `libs/angular-3d/src/lib/tokens/object-id.token.ts`
  - Provides unique component identification

### Patterns Identified

**Pattern 1: Simple Component (Light Component Pattern)**
- **Evidence**: `libs/angular-3d/src/lib/primitives/lights/ambient-light.component.ts:16-38`
- **Structure**:
  - ChangeDetectionStrategy.OnPush
  - Signal inputs using `input<T>()`
  - OBJECT_ID provider with crypto.randomUUID()
  - hostDirectives composition (NO Three.js imports in component)
  - Delegate to directive for Three.js logic

**Pattern 2: Complex Component (Async Loading Pattern)**
- **Evidence**: `libs/angular-3d/src/lib/primitives/gltf-model.component.ts:29-228`
- **Structure**:
  - Signal inputs with `input.required<T>()` and `input<T>()`
  - effect() in constructor for async initialization
  - Loading state signals: `isLoading`, `loadError`
  - DestroyRef.onDestroy() for cleanup
  - Resource disposal (geometry, material)
  - Parent integration via NG_3D_PARENT token

**Pattern 3: Advanced Particle Component (Render Loop Integration)**
- **Evidence**: `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:90-574`
- **Structure**:
  - RenderLoopService.registerUpdateCallback() for per-frame animation
  - SceneService for camera access
  - TextSamplingService for canvas-based text sampling
  - Manual Three.js object creation and management
  - Cleanup callback returned from registerUpdateCallback

### Integration Points

**SceneService** (Camera Access):
- Location: `libs/angular-3d/src/lib/canvas/scene.service.ts`
- Usage: `this.sceneService.camera()` returns `THREE.Camera | null`
- Purpose: Billboard rotation (particles face camera)

**RenderLoopService** (Animation):
- Location: `libs/angular-3d/src/lib/render-loop/render-loop.service.ts`
- Usage: `const cleanup = this.renderLoop.registerUpdateCallback((delta, elapsed) => { ... })`
- Purpose: Per-frame text updates (responsive sizing, animations)

**NG_3D_PARENT Token** (Scene Hierarchy):
- Location: `libs/angular-3d/src/lib/types/tokens.ts:11`
- Usage: `private readonly parent = inject(NG_3D_PARENT);`
- Purpose: Add text to parent scene/group

**Bloom Post-Processing**:
- Location: `libs/angular-3d/src/lib/postprocessing/`
- Integration: Text with `toneMapped: false` materials works with bloom
- Pattern: Set material.color intensity > 1.0 for glow effect

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Hybrid Pattern - Combine async loading (GltfModel pattern) with render loop integration (ParticleText pattern)

**Rationale**:
- Troika text requires async font loading (like GLTF models)
- Responsive text requires per-frame camera distance calculations
- Text updates require sync() calls (managed reactively via effects)

**Evidence**:
- Async pattern: `gltf-model.component.ts:66-153` (effect-based loading)
- Render loop pattern: `instanced-particle-text.component.ts:170-188` (per-frame updates)

### Component Specifications

#### Component 1: TroikaTextComponent

**Purpose**: Primary production-grade 3D text component with full troika-three-text API surface

**Pattern**: Async Loading Component with Render Loop Integration (Hybrid)

**Evidence**:
- Base pattern: `gltf-model.component.ts` (async resource loading)
- Animation pattern: `instanced-particle-text.component.ts` (render loop integration)

**Responsibilities**:
- Async font loading with loading state signals
- Reactive text property updates via effects
- Billboard rotation (text always faces camera) - OPTIONAL
- Resource cleanup (Text.dispose(), texture disposal)
- Integration with NG_3D_PARENT for scene hierarchy

**Implementation Pattern**:

```typescript
// Pattern source: gltf-model.component.ts:29-228 (async loading)
// Pattern source: instanced-particle-text.component.ts:90-209 (render loop)
import { Component, ChangeDetectionStrategy, input, inject, effect, signal, DestroyRef } from '@angular/core';
import { Text } from 'troika-three-text';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';

@Component({
  selector: 'a3d-troika-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `troika-text-${crypto.randomUUID()}` }
  ],
})
export class TroikaTextComponent {
  // Core text properties
  readonly text = input.required<string>();
  readonly fontSize = input<number>(0.1);
  readonly color = input<string | number>('#ffffff');
  readonly font = input<string | null>(null);

  // Transform properties
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly rotation = input<[number, number, number]>([0, 0, 0]);
  readonly scale = input<number | [number, number, number]>(1);

  // Layout properties
  readonly maxWidth = input<number>(Infinity);
  readonly textAlign = input<'left' | 'right' | 'center' | 'justify'>('left');
  readonly anchorX = input<number | string>('left');
  readonly anchorY = input<number | string>('top');
  readonly lineHeight = input<number | string>(1.2);
  readonly letterSpacing = input<number>(0);

  // Visual styling
  readonly outlineWidth = input<number | string>(0);
  readonly outlineColor = input<string | number>('#000000');
  readonly outlineBlur = input<number | string>(0);
  readonly fillOpacity = input<number>(1);

  // Advanced rendering
  readonly sdfGlyphSize = input<number>(64);
  readonly glyphGeometryDetail = input<number>(1);
  readonly gpuAccelerateSDF = input<boolean>(true);
  readonly depthOffset = input<number>(0);

  // Billboard mode (optional - faces camera)
  readonly billboard = input<boolean>(false);

  // Material override
  readonly customMaterial = input<THREE.Material | null>(null);

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService);
  private readonly objectId = inject(OBJECT_ID);

  // State signals
  readonly isLoading = signal(false);
  readonly loadError = signal<string | null>(null);

  // Three.js objects
  private textObject?: Text;
  private cleanupRenderLoop?: () => void;

  constructor() {
    // Effect: Initialize and update text
    effect((onCleanup) => {
      const textContent = this.text();
      const parent = this.parent();

      if (!textContent || !parent) return;

      // Create or update text object
      if (!this.textObject) {
        this.textObject = new Text();
        this.updateAllTextProperties();

        // Sync and add to parent
        this.textObject.sync(() => {
          if (this.textObject && parent) {
            parent.add(this.textObject);
            this.isLoading.set(false);
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

    // Effect: Billboard rotation (optional)
    effect(() => {
      if (!this.billboard()) return;

      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

      this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback(() => {
        if (this.textObject && camera) {
          this.textObject.quaternion.copy(camera.quaternion);
        }
      });
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanupRenderLoop?.();
      if (this.textObject) {
        this.textObject.dispose();
      }
    });
  }

  private updateAllTextProperties(): void {
    if (!this.textObject) return;

    // Text content & font
    this.textObject.text = this.text();
    this.textObject.fontSize = this.fontSize();
    this.textObject.color = this.color();
    if (this.font()) this.textObject.font = this.font();

    // Layout
    this.textObject.maxWidth = this.maxWidth();
    this.textObject.textAlign = this.textAlign();
    this.textObject.anchorX = this.anchorX();
    this.textObject.anchorY = this.anchorY();
    this.textObject.lineHeight = this.lineHeight();
    this.textObject.letterSpacing = this.letterSpacing();

    // Styling
    this.textObject.outlineWidth = this.outlineWidth();
    this.textObject.outlineColor = this.outlineColor();
    this.textObject.outlineBlur = this.outlineBlur();
    this.textObject.fillOpacity = this.fillOpacity();

    // Advanced
    this.textObject.sdfGlyphSize = this.sdfGlyphSize();
    this.textObject.glyphGeometryDetail = this.glyphGeometryDetail();
    this.textObject.gpuAccelerateSDF = this.gpuAccelerateSDF();
    this.textObject.depthOffset = this.depthOffset();

    // Custom material
    if (this.customMaterial()) {
      this.textObject.material = this.customMaterial()!;
    }

    // Transform
    this.textObject.position.set(...this.position());
    this.textObject.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] = typeof s === 'number' ? [s, s, s] : s;
    this.textObject.scale.set(...scale);
  }
}
```

**Quality Requirements**:

**Functional**:
- Text must render with sharp quality at all zoom levels
- Font loading must be async with loading state feedback
- All troika-three-text properties must be configurable
- Text must support Unicode (all languages, emoji)
- Text must integrate with bloom post-processing

**Non-Functional**:
- Performance: <50ms sync time, <2ms per-frame overhead
- Memory: <5MB per text instance
- Code quality: ChangeDetectionStrategy.OnPush, strict types, comprehensive JSDoc

**Pattern Compliance**:
- Must use ChangeDetectionStrategy.OnPush (verified: gltf-model.component.ts:20)
- Must use signal inputs with `input()` and `input.required()` (verified: gltf-model.component.ts:31-42)
- Must use DestroyRef for cleanup (verified: gltf-model.component.ts:186-192)
- Must provide OBJECT_ID token (verified: gltf-model.component.ts:22-26)

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/text/troika-text.component.ts` (CREATE)
- `libs/angular-3d/src/lib/primitives/text/troika-text.component.spec.ts` (CREATE)
- `libs/angular-3d/src/index.ts` (MODIFY - add export)

---

#### Component 2: ResponsiveTroikaTextComponent

**Purpose**: Viewport-aware text that automatically scales based on camera FOV and distance

**Pattern**: TroikaTextComponent + RenderLoop Integration

**Evidence**: `instanced-particle-text.component.ts:170-188` (render loop pattern)

**Responsibilities**:
- Extend TroikaTextComponent functionality
- Calculate viewport-relative font size based on camera
- Debounce sync() calls to prevent excessive updates
- Support min/max font size constraints

**Implementation Pattern**:

```typescript
// Pattern source: troika-text.component.ts (base component)
// Pattern source: instanced-particle-text.component.ts:170-188 (render loop)
@Component({
  selector: 'a3d-responsive-troika-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `responsive-troika-text-${crypto.randomUUID()}` }
  ],
})
export class ResponsiveTroikaTextComponent {
  // Inherit all TroikaTextComponent inputs
  // ... (same as TroikaTextComponent)

  // Responsive-specific inputs
  readonly responsiveMode = input<'viewport' | 'distance'>('viewport');
  readonly viewportScale = input<number>(0.05); // 5% of viewport width
  readonly minFontSize = input<number>(0.05);
  readonly maxFontSize = input<number>(2.0);
  readonly syncDebounceMs = input<number>(100);

  // DI (same as TroikaTextComponent)

  constructor() {
    // Base text initialization (same as TroikaTextComponent)

    // Effect: Responsive sizing
    effect(() => {
      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

      let lastFontSize = this.fontSize();
      let debounceTimer: number | null = null;

      this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback(() => {
        if (!this.textObject || !camera) return;

        const newFontSize = this.responsiveMode() === 'viewport'
          ? this.calculateViewportFontSize(camera)
          : this.calculateDistanceFontSize(camera);

        // Only update if changed significantly
        if (Math.abs(newFontSize - lastFontSize) > 0.01) {
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            this.textObject!.fontSize = newFontSize;
            this.textObject!.sync();
            lastFontSize = newFontSize;
          }, this.syncDebounceMs());
        }
      });
    });
  }

  private calculateViewportFontSize(camera: THREE.PerspectiveCamera): number {
    const fov = camera.fov * (Math.PI / 180);
    const distance = camera.position.distanceTo(this.textObject!.position);
    const viewportHeight = 2 * Math.tan(fov / 2) * distance;
    const viewportWidth = viewportHeight * camera.aspect;

    const fontSize = viewportWidth * this.viewportScale();
    return this.clamp(fontSize, this.minFontSize(), this.maxFontSize());
  }

  private calculateDistanceFontSize(camera: THREE.Camera): number {
    const distance = camera.position.distanceTo(this.textObject!.position);
    const baseFontSize = this.fontSize();
    const scaleFactor = distance / 10;

    const fontSize = baseFontSize * scaleFactor;
    return this.clamp(fontSize, this.minFontSize(), this.maxFontSize());
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }
}
```

**Quality Requirements**:

**Functional**:
- Text size must adapt smoothly to camera changes
- Sync debouncing must prevent excessive re-layout
- Min/max constraints must be enforced
- Two responsive modes must work correctly

**Non-Functional**:
- Performance: <100ms debounce delay, <1ms per-frame overhead
- Smooth scaling transitions

**Pattern Compliance**:
- Same as TroikaTextComponent
- Must use RenderLoopService.registerUpdateCallback (verified: instanced-particle-text.component.ts:170)

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/text/responsive-troika-text.component.ts` (CREATE)
- `libs/angular-3d/src/lib/primitives/text/responsive-troika-text.component.spec.ts` (CREATE)
- `libs/angular-3d/src/index.ts` (MODIFY - add export)

---

#### Component 3: GlowTroikaTextComponent

**Purpose**: Text with animated glow effect for use with bloom post-processing

**Pattern**: TroikaTextComponent + Material Override + RenderLoop Animation

**Evidence**:
- Base: `troika-text.component.ts` (custom material input)
- Research: `docs/research/troika-three-text-deep-dive.md:1357-1465` (glow implementation)

**Responsibilities**:
- Create emissive material for bloom effect
- Animate glow intensity (pulsing)
- Support configurable glow color and speed
- toneMapped: false for values > 1.0

**Implementation Pattern**:

```typescript
// Pattern source: troika-text.component.ts (base)
// Pattern source: troika-three-text-deep-dive.md:1357-1465 (glow logic)
@Component({
  selector: 'a3d-glow-troika-text',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `glow-troika-text-${crypto.randomUUID()}` }
  ],
})
export class GlowTroikaTextComponent {
  // Inherit base text inputs
  // ... (same as TroikaTextComponent)

  // Glow-specific inputs
  readonly glowColor = input<string | number>('#00ffff');
  readonly glowIntensity = input<number>(2.5); // >1.0 for bloom
  readonly pulseSpeed = input<number>(1.0); // 0 = no pulse
  readonly outlineWidth = input<number>(0.02);

  // DI (same as TroikaTextComponent)

  constructor() {
    // Effect: Create glow material
    effect(() => {
      if (!this.textObject) return;

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.glowColor() as any),
        toneMapped: false // CRITICAL: Allows values > 1.0
      });

      this.textObject.material = glowMaterial;
      this.textObject.color = this.glowColor();
      this.textObject.outlineWidth = this.outlineWidth();
      this.textObject.outlineColor = '#000000';

      const baseIntensity = this.glowIntensity();
      glowMaterial.color.multiplyScalar(baseIntensity);

      this.textObject.sync();
    });

    // Effect: Pulse animation
    effect(() => {
      if (this.pulseSpeed() === 0 || !this.textObject) return;

      this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta, elapsed) => {
        if (!this.textObject?.material || !(this.textObject.material instanceof THREE.MeshBasicMaterial)) {
          return;
        }

        const pulse = Math.sin(elapsed * this.pulseSpeed() * Math.PI * 2) * 0.3 + 1.0;
        const intensity = this.glowIntensity() * pulse;

        const baseColor = new THREE.Color(this.glowColor() as any);
        this.textObject.material.color.copy(baseColor).multiplyScalar(intensity);
      });
    });
  }
}
```

**Quality Requirements**:

**Functional**:
- Glow effect must work with bloom post-processing
- Pulse animation must be smooth
- Glow intensity must be configurable
- Outline must provide definition

**Non-Functional**:
- Performance: <1ms per-frame for pulse animation
- Visual quality: No color banding, smooth transitions

**Pattern Compliance**:
- Same as TroikaTextComponent

**Files Affected**:
- `libs/angular-3d/src/lib/primitives/text/glow-troika-text.component.ts` (CREATE)
- `libs/angular-3d/src/lib/primitives/text/glow-troika-text.component.spec.ts` (CREATE)
- `libs/angular-3d/src/index.ts` (MODIFY - add export)

---

#### Utility 1: Font Preloading Service

**Purpose**: Preload fonts during app initialization to prevent loading delays

**Pattern**: Angular Service with Promise-based API

**Evidence**: Research document Section 1.2 (preloadFont API)

**Implementation Pattern**:

```typescript
// Pattern source: troika-three-text-deep-dive.md:158-167 (preloadFont API)
import { Injectable } from '@angular/core';
import { preloadFont } from 'troika-three-text';

@Injectable({ providedIn: 'root' })
export class FontPreloadService {
  /**
   * Preload a font file with specific character set
   */
  preload(options: {
    font: string;
    characters?: string;
    sdfGlyphSize?: number;
  }): Promise<void> {
    return new Promise((resolve) => {
      preloadFont(options, () => resolve());
    });
  }

  /**
   * Preload multiple fonts in parallel
   */
  preloadMultiple(fonts: Array<{ font: string }>): Promise<void[]> {
    return Promise.all(fonts.map(f => this.preload(f)));
  }
}
```

**Files Affected**:
- `libs/angular-3d/src/lib/services/font-preload.service.ts` (CREATE)
- `libs/angular-3d/src/index.ts` (MODIFY - add export)

---

## 🔗 Integration Architecture

### Integration Points

**Integration 1: NG_3D_PARENT Token**
- **How components connect**: Text components inject NG_3D_PARENT to get parent scene/group
- **Pattern**: `private readonly parent = inject(NG_3D_PARENT);`
- **Evidence**: `gltf-model.component.ts:45`, `tokens.ts:11`

**Integration 2: RenderLoopService**
- **How components connect**: Register per-frame callback for animations/responsive sizing
- **Pattern**: `const cleanup = this.renderLoop.registerUpdateCallback((delta, elapsed) => { ... })`
- **Evidence**: `instanced-particle-text.component.ts:170`

**Integration 3: Bloom Post-Processing**
- **How components connect**: Use toneMapped: false material, set color intensity > 1.0
- **Pattern**: `material.toneMapped = false; material.color.multiplyScalar(2.5);`
- **Evidence**: Research document lines 214-239

**Integration 4: Directive Composition (ng-content)**
- **How components connect**: Support ng-content to allow float3d, rotate3d directives
- **Pattern**: `template: '<ng-content />'`
- **Evidence**: All primitive components use this pattern

### Data Flow

```
User Input (text property change)
  ↓
Signal input updates
  ↓
effect() detects change
  ↓
textObject.text = newValue
  ↓
textObject.sync() - Web Worker
  ↓
SDF textures generated
  ↓
Geometry updated
  ↓
Shader patched
  ↓
Rendered to scene
```

### Dependencies

**External Dependencies** (npm install required):
- `troika-three-text@^0.49.1` - Core text rendering library

**Internal Dependencies** (existing):
- `three@^0.182.0` - Three.js core
- `@angular/core@^20.3.0` - Angular framework

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

**Text Rendering**:
- Sharp text at all zoom levels (SDF quality)
- Full Unicode support (tested with: Latin, Arabic, Chinese, Japanese, Emoji)
- Dynamic text updates (reactive via signals)
- Multi-line text with proper layout

**Font Loading**:
- Async font loading with loading states
- Fallback fonts for missing glyphs
- Preloading utility for app initialization
- CSP compatibility (main-thread fallback)

**Visual Features**:
- Outline/stroke support
- Fill opacity control
- Bloom/glow integration
- Custom material support

**Responsive Behavior**:
- Viewport-based scaling
- Distance-based scaling
- Min/max constraints
- Debounced updates

### Non-Functional Requirements

**Performance**:
- Target: 60 FPS with 50 text instances
- Font load: <500ms
- Sync call: <50ms
- Per-frame: <2ms per text instance

**Security**:
- CSP compatibility (detect and fallback)
- No eval() usage in main thread
- Safe font loading from trusted sources

**Maintainability**:
- Comprehensive JSDoc documentation
- Unit tests for all components
- Integration tests with directives
- Example components in demo app

**Testability**:
- Mockable services
- Signal-based state (testable)
- Isolated component logic

### Pattern Compliance

**Angular Standards** (verified from codebase):
- ChangeDetectionStrategy.OnPush (All components: gltf-model.ts:20, ambient-light.ts:19)
- Signal inputs with `input()` and `input.required()` (gltf-model.ts:31-42)
- DestroyRef for cleanup (gltf-model.ts:46, 186-192)
- effect() for reactive logic (gltf-model.ts:69-153)
- afterNextRender() not needed (effects run in constructor, safe for SSR)

**Three.js Integration** (verified from codebase):
- NG_3D_PARENT token for scene hierarchy (tokens.ts:11)
- RenderLoopService for animations (instanced-particle-text.ts:170)
- SceneService for camera access (instanced-particle-text.ts:110)
- Proper resource disposal (gltf-model.ts:138-148)

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: **frontend-developer**

**Rationale**:
1. **Angular Component Work**: Primary work is creating Angular components (90% of effort)
2. **Three.js Integration**: Requires Three.js knowledge but follows established patterns
3. **Browser APIs**: Uses web workers, async font loading, canvas rendering
4. **UI Integration**: Demo app integration requires frontend skills
5. **TypeScript Heavy**: Complex type definitions, signal-based reactivity

**Why NOT backend-developer**:
- No NestJS or backend services
- No database/API work
- Frontend-heavy integration (demo app)

### Complexity Assessment

**Complexity**: **MEDIUM-HIGH**

**Estimated Effort**: **24-48 hours**

**Breakdown**:
1. **Phase 1 - Core TroikaTextComponent** (8-16 hours)
   - Install dependencies
   - Create base component with all properties
   - Implement async font loading
   - Resource cleanup
   - Unit tests

2. **Phase 2 - Advanced Components** (8-16 hours)
   - ResponsiveTroikaTextComponent
   - GlowTroikaTextComponent
   - FontPreloadService
   - Integration tests

3. **Phase 3 - Demo Integration** (4-8 hours)
   - Replace home page HTML overlay
   - Create showcase examples
   - Update existing particle text usage
   - Visual testing

4. **Phase 4 - Documentation & Polish** (4-8 hours)
   - JSDoc documentation
   - README with examples
   - Migration guide
   - Performance optimization

### Files Affected Summary

**CREATE** (New Files):
```
libs/angular-3d/src/lib/primitives/text/
├── troika-text.component.ts
├── troika-text.component.spec.ts
├── responsive-troika-text.component.ts
├── responsive-troika-text.component.spec.ts
├── glow-troika-text.component.ts
└── glow-troika-text.component.spec.ts

libs/angular-3d/src/lib/services/
└── font-preload.service.ts

apps/angular-3d-demo/src/app/examples/
└── troika-text-showcase.component.ts
```

**MODIFY** (Existing Files):
```
libs/angular-3d/src/index.ts
  - Add exports for new components and service

package.json
  - Add troika-three-text dependency

apps/angular-3d-demo/src/app/pages/home/home.component.ts
  - Replace HTML overlay with troika text (lines 25-211)

apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts
  - Integrate troika text for 3D headings
```

**NO REWRITE** (Keep existing):
```
libs/angular-3d/src/lib/primitives/particle-text/
├── instanced-particle-text.component.ts (Keep for artistic effects)
├── smoke-particle-text.component.ts (Keep for smoke effects)
└── glow-particle-text.component.ts (Keep for particle animations)
```

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **All imports exist in codebase**:
   - ✅ `NG_3D_PARENT` from `libs/angular-3d/src/lib/types/tokens.ts:11`
   - ✅ `OBJECT_ID` from `libs/angular-3d/src/lib/tokens/object-id.token.ts`
   - ✅ `RenderLoopService` from `libs/angular-3d/src/lib/render-loop/render-loop.service.ts`
   - ✅ `SceneService` from `libs/angular-3d/src/lib/canvas/scene.service.ts`
   - ⚠️ `troika-three-text` - REQUIRES npm install first

2. **All patterns verified from examples**:
   - ✅ Signal inputs: `gltf-model.component.ts:31-42`
   - ✅ effect() in constructor: `gltf-model.component.ts:69-153`
   - ✅ DestroyRef cleanup: `gltf-model.component.ts:186-192`
   - ✅ RenderLoop integration: `instanced-particle-text.component.ts:170-188`

3. **Troika-three-text API verified**:
   - ✅ All properties documented in research: `docs/research/troika-three-text-deep-dive.md:82-131`
   - ✅ sync() method: `troika-three-text-deep-dive.md:137-141`
   - ✅ dispose() method: `troika-three-text-deep-dive.md:143-145`
   - ✅ preloadFont function: `troika-three-text-deep-dive.md:158-167`

4. **No hallucinated APIs**:
   - All Three.js types verified (Camera, PerspectiveCamera, MeshBasicMaterial, Color)
   - All Angular APIs verified (inject, effect, signal, DestroyRef)
   - All troika-three-text APIs verified in research document

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (MEDIUM-HIGH, 24-48 hours)
- [x] No step-by-step implementation (that's team-leader's job)

---

## 📋 Implementation Phases (High-Level)

### Phase 1: Core Foundation (8-16 hours)

**Goal**: Working TroikaTextComponent with full API surface

**Deliverables**:
1. Install troika-three-text dependency
2. Create TroikaTextComponent with:
   - All signal inputs (text, font, layout, styling, advanced)
   - Async font loading with loading states
   - effect() for text initialization and updates
   - Resource cleanup in DestroyRef
3. Unit tests for component lifecycle
4. Export in library index

**Success Criteria**:
- Text renders with sharp quality
- Font loading is async
- All properties work correctly
- Resources disposed properly

### Phase 2: Advanced Features (8-16 hours)

**Goal**: Responsive and glow text components

**Deliverables**:
1. ResponsiveTroikaTextComponent:
   - Viewport-based sizing
   - Distance-based sizing
   - Debounced sync calls
2. GlowTroikaTextComponent:
   - Emissive material creation
   - Pulse animation
   - Bloom integration
3. FontPreloadService:
   - Single font preload
   - Multiple font preload
4. Integration tests with directives

**Success Criteria**:
- Responsive text scales correctly
- Glow effect works with bloom
- Fonts preload successfully
- Directives (float3d, rotate3d) work

### Phase 3: Demo Integration (4-8 hours)

**Goal**: Showcase troika text in demo app

**Deliverables**:
1. Replace home page HTML overlay with troika text
2. Create showcase examples:
   - Basic text rendering
   - Responsive text
   - Glow text
   - Multi-line layout
   - Outline effects
3. Update particle text usage where appropriate
4. Visual regression testing

**Success Criteria**:
- Home page hero text uses troika
- Showcase demonstrates all features
- Performance acceptable (60 FPS)
- No visual regressions

### Phase 4: Documentation & Polish (4-8 hours)

**Goal**: Production-ready documentation and optimization

**Deliverables**:
1. Comprehensive JSDoc for all components
2. README with:
   - Installation instructions
   - Usage examples
   - API reference
   - Performance best practices
3. Migration guide from particle text
4. Performance optimization:
   - Debounce tuning
   - Memory profiling
   - FPS benchmarking

**Success Criteria**:
- All public APIs documented
- Examples run correctly
- Performance meets targets
- Migration guide clear

---

## 🎨 Example Usage (For Demo App)

### Basic Text

```html
<a3d-troika-text
  text="Hello Three.js!"
  [fontSize]="0.5"
  color="#00ffff"
  [position]="[0, 0, 0]"
  anchorX="center"
  anchorY="middle"
/>
```

### Responsive Text

```html
<a3d-responsive-troika-text
  text="Responsive Heading"
  responsiveMode="viewport"
  [viewportScale]="0.08"
  [minFontSize]="0.2"
  [maxFontSize]="2.0"
  [position]="[0, 2, 0]"
/>
```

### Glow Text with Bloom

```html
<a3d-glow-troika-text
  text="GLOW EFFECT"
  [fontSize]="1.0"
  glowColor="#ff00ff"
  [glowIntensity]="3.0"
  [pulseSpeed]="0.5"
  [outlineWidth]="0.02"
  [position]="[0, -2, 0]"
/>
```

### With Directives

```html
<a3d-troika-text
  text="Floating Text"
  [fontSize]="0.3"
  color="white"
  a3dFloat3d
  [floatSpeed]="1.5"
  [floatIntensity]="0.2"
/>
```

---

## 🚨 Risk Mitigation Summary

### Risk 1: Performance with Many Instances
**Mitigation**:
- Document limits (50 instances target)
- Warn at 10,000 particles
- Provide LOD utility (future)

### Risk 2: CSP Restrictions
**Mitigation**:
- Auto-detect CSP
- Fallback to main thread
- Document CSP config

### Risk 3: Font Loading Delays
**Mitigation**:
- Provide preloadFont service
- Show loading states
- Lazy load fonts

### Risk 4: Unicode Rendering
**Mitigation**:
- Test with multiple scripts
- Document recommended fonts
- Increase sdfGlyphSize if needed

---

## 📚 References

**Codebase Evidence**:
- GltfModelComponent (async loading pattern): `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`
- InstancedParticleTextComponent (render loop pattern): `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts`
- AmbientLightComponent (simple component pattern): `libs/angular-3d/src/lib/primitives/lights/ambient-light.component.ts`
- Tokens: `libs/angular-3d/src/lib/types/tokens.ts`

**Research Documentation**:
- Troika Deep Dive: `docs/research/troika-three-text-deep-dive.md`
- API Reference: Lines 82-167
- Glow Implementation: Lines 1357-1465
- Performance: Lines 265-291

**External Resources**:
- troika-three-text docs: https://protectwise.github.io/troika/troika-three-text/
- npm package: https://www.npmjs.com/package/troika-three-text

---

**End of Implementation Plan**

*This plan provides WHAT to build and WHY. The team-leader will decompose this into HOW (atomic tasks) and assign to developers.*
