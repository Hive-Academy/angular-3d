# Implementation Plan - TASK_2025_026

## Award-Winning Three.js Enhancements for @hive-academy/angular-3d

---

## Codebase Investigation Summary

### Libraries Discovered

**Core Library**: `@hive-academy/angular-3d` (path: `libs/angular-3d/src/lib/`)

- **Key exports verified**: SceneService, RenderLoopService, SceneGraphStore, EffectComposerService
- **Documentation**: `libs/angular-3d/CLAUDE.md`
- **Pattern examples**: 40+ component/directive files examined

**Dependencies Available** (verified in package.json):

- `three` ^0.182.0 - Core Three.js
- `three-stdlib` ^2.35.15 - Additional utilities (RGBELoader, passes, controls)
- `gsap` ^3.14.0 - Animation library

### Patterns Identified

#### 1. Component Pattern (Evidence: `box.component.ts:24-50`)

```typescript
@Component({
  selector: 'a3d-[name]',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `[name]-${crypto.randomUUID()}` },
  ],
  hostDirectives: [/* directive composition */],
})
```

#### 2. Effect Component Pattern (Evidence: `bloom-effect.component.ts:34-121`)

```typescript
@Component({
  selector: 'a3d-[effect]-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  // Signal inputs
  public readonly param = input<number>(defaultValue);

  private pass: Pass | null = null;

  constructor() {
    // Effect to create pass when renderer available
    effect(() => {
      const renderer = this.sceneService.renderer();
      if (renderer && !this.pass) {
        // Create pass, add to composer
        this.composerService.addPass(this.pass);
      }
    });

    // Effect to update pass properties
    effect(() => {
      if (this.pass) {
        this.pass.property = this.param();
      }
    });
  }

  ngOnDestroy() {
    if (this.pass) {
      this.composerService.removePass(this.pass);
      this.pass.dispose();
    }
  }
}
```

#### 3. Directive Pattern (Evidence: `standard-material.directive.ts:42-131`)

```typescript
@Directive({
  selector: '[a3d[Name]]',
  standalone: true,
})
export class NameDirective {
  private readonly destroyRef = inject(DestroyRef);

  public readonly inputName = input<Type>(defaultValue);

  constructor() {
    effect(() => {
      /* reactive logic */
    });
    this.destroyRef.onDestroy(() => {
      /* cleanup */
    });
  }
}
```

#### 4. Service Pattern (Evidence: `render-loop.service.ts:48-260`)

- Per-scene scoped services (NOT providedIn: 'root')
- Signal-based state management
- Zone.js bypass for performance
- Callback registration with cleanup functions

### Integration Points

| Service               | Purpose                      | Location                                       |
| --------------------- | ---------------------------- | ---------------------------------------------- |
| SceneService          | Scene/camera/renderer access | `canvas/scene.service.ts:46`                   |
| RenderLoopService     | Frame loop management        | `render-loop/render-loop.service.ts:49`        |
| EffectComposerService | Post-processing pipeline     | `postprocessing/effect-composer.service.ts:23` |
| SceneGraphStore       | Object registry              | `store/scene-graph.store.ts:111`               |
| NG_3D_PARENT          | Parent-child injection       | `types/tokens.ts:11`                           |

---

## Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Declarative Angular wrappers with signal-based reactivity

**Rationale**:

1. Matches existing library patterns (40+ components follow this)
2. Enables tree-shaking for unused features
3. Supports multi-scene isolation (per-scene DI)
4. Works with Angular's change detection (OnPush)

**Evidence**: All existing primitives and effects follow this pattern

---

## Component Specifications

### Feature A: Demand-Based Rendering (Priority 1)

**Purpose**: Enable battery-efficient rendering by only rendering when the scene changes, reducing GPU usage to near 0% when idle.

**Pattern**: Extension of existing RenderLoopService
**Evidence**: `render-loop.service.ts:88-106` shows existing start/stop/pause pattern

#### A.1 RenderLoopService Modifications

**File**: `libs/angular-3d/src/lib/render-loop/render-loop.service.ts` (MODIFY)

**Responsibilities**:

- Add `frameloop` mode signal ('always' | 'demand')
- Add `invalidate()` method to trigger single render
- Add `_needsRender` signal to track pending renders
- Modify RAF loop to check `frameloop` mode
- Add idle timeout to stop RAF when no invalidations

**Implementation Pattern**:

```typescript
// Evidence: render-loop.service.ts:57-64 (existing signal pattern)
private readonly _frameloop = signal<'always' | 'demand'>('always');
private readonly _needsRender = signal<boolean>(true);
private invalidateTimeout: number | null = null;

public readonly frameloop = this._frameloop.asReadonly();
public readonly needsRender = this._needsRender.asReadonly();

/**
 * Set the frame loop mode
 * @param mode 'always' for continuous rendering, 'demand' for on-change only
 */
public setFrameloop(mode: 'always' | 'demand'): void {
  this._frameloop.set(mode);
  if (mode === 'always') {
    this._needsRender.set(true);
  }
}

/**
 * Request a render in demand mode
 * In 'always' mode, this is a no-op
 */
public invalidate(): void {
  if (this._frameloop() === 'demand') {
    this._needsRender.set(true);

    // Clear existing timeout
    if (this.invalidateTimeout !== null) {
      clearTimeout(this.invalidateTimeout);
    }

    // Start RAF if not running
    if (!this.animationFrameId) {
      this.ngZone.runOutsideAngular(() => {
        this.loop();
      });
    }

    // Set timeout to stop RAF after idle period (100ms)
    this.invalidateTimeout = window.setTimeout(() => {
      if (this._frameloop() === 'demand' && !this._needsRender()) {
        // Stop RAF loop when idle
        if (this.animationFrameId !== null) {
          cancelAnimationFrame(this.animationFrameId);
          this.animationFrameId = null;
        }
      }
    }, 100);
  }
}

// Modify loop() - Evidence: render-loop.service.ts:188-219
private loop = (): void => {
  if (!this._isRunning()) {
    return;
  }

  // In demand mode, only render if needed
  const shouldRender = this._frameloop() === 'always' || this._needsRender();

  if (shouldRender) {
    this.animationFrameId = requestAnimationFrame(this.loop);

    if (this._isPaused()) {
      return;
    }

    const delta = this.clock.getDelta();
    const elapsed = this.clock.getElapsedTime();

    // Call update callbacks
    this.updateCallbacks.forEach((callback) => {
      try {
        callback(delta, elapsed);
      } catch (error) {
        console.error('Error in render loop callback:', error);
      }
    });

    // Call render function
    if (this.renderFn) {
      this.renderFn();
    }

    // Reset needsRender in demand mode
    if (this._frameloop() === 'demand') {
      this._needsRender.set(false);
    }

    this.updateFps();
  } else if (this._frameloop() === 'demand') {
    // In demand mode with no pending render, schedule next check
    this.animationFrameId = requestAnimationFrame(this.loop);
  }
};
```

**Quality Requirements**:

- Backward compatible (default 'always' mode)
- FPS signal must report actual render frequency in demand mode
- Idle timeout configurable (default 100ms)

#### A.2 Scene3dComponent Modifications

**File**: `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` (MODIFY)

**Responsibilities**:

- Add `frameloop` input signal
- Pass frameloop to RenderLoopService on init

**Implementation Pattern**:

```typescript
// Evidence: scene-3d.component.ts:145-159 (existing input pattern)
public readonly frameloop = input<'always' | 'demand'>('always');

// In afterNextRender callback - Evidence: scene-3d.component.ts:174-196
afterNextRender(() => {
  runInInjectionContext(injector, () => {
    // ... existing init code ...

    // Set frameloop mode
    this.renderLoop.setFrameloop(this.frameloop());

    // Start render loop
    this.renderLoop.start(() => {
      this.renderer.render(this.scene, this.camera);
    });
  });
});
```

#### A.3 SceneService Modifications

**File**: `libs/angular-3d/src/lib/canvas/scene.service.ts` (MODIFY)

**Responsibilities**:

- Add `invalidate()` method as proxy to RenderLoopService

**Implementation Pattern**:

```typescript
// Evidence: scene.service.ts:46 (existing service pattern)
// Add RenderLoopService injection
private readonly renderLoop = inject(RenderLoopService);

/**
 * Request a render frame in demand mode
 * Use this when updating scene programmatically
 */
public invalidate(): void {
  this.renderLoop.invalidate();
}
```

#### A.4 OrbitControlsComponent Modifications

**File**: `libs/angular-3d/src/lib/controls/orbit-controls.component.ts` (MODIFY)

**Responsibilities**:

- Auto-invalidate on 'change' event
- Continue rendering during user interaction

**Implementation Pattern**:

```typescript
// Evidence: orbit-controls.component.ts:203 (existing change listener)
private handleControlsChange = (): void => {
  if (!this.controls) return;

  // Invalidate for demand-based rendering
  this.sceneService.invalidate();

  const distance = this.controls.object.position.distanceTo(
    this.controls.target
  );
  this.controlsChange.emit({ distance, controls: this.controls });
};
```

#### A.5 Animation Directive Updates

**Files to MODIFY** (add invalidate() calls):

- `libs/angular-3d/src/lib/directives/float-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/rotate-3d.directive.ts`

**Pattern**: Inject SceneService and call invalidate() during animation updates

```typescript
// Evidence: float-3d.directive.ts:95 (existing directive)
// Add SceneService injection
private readonly sceneService = inject(SceneService);

// In animation update, call invalidate
// GSAP onUpdate callback:
{
  onUpdate: () => {
    this.sceneService.invalidate();
  }
}
```

---

### Feature B: InstancedMeshComponent (Priority 2)

**Purpose**: Enable rendering of thousands of similar objects with a single draw call for 100x performance improvement.

**Pattern**: New primitive component following existing patterns
**Evidence**: `star-field.component.ts:83-564` shows complex primitive with attributes

#### B.1 InstancedMeshComponent

**File**: `libs/angular-3d/src/lib/primitives/instanced-mesh.component.ts` (CREATE)

**Responsibilities**:

- Create THREE.InstancedMesh with configurable count
- Support external instanceMatrix and instanceColor arrays
- Provide methods for updating individual instances
- Support child geometry and material directives
- Register with SceneGraphStore

**Implementation Pattern**:

````typescript
import { Component, ChangeDetectionStrategy, input, effect, inject, DestroyRef, signal, output } from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import { GEOMETRY_SIGNAL } from '../tokens/geometry.token';
import { MATERIAL_SIGNAL } from '../tokens/material.token';
import { SceneService } from '../canvas/scene.service';

/**
 * InstancedMeshComponent - High-performance instanced rendering
 *
 * Renders thousands of similar objects with a single draw call.
 * Supports per-instance transforms and colors.
 *
 * @example
 * ```html
 * <a3d-instanced-mesh [count]="1000">
 *   <ng-container a3dBoxGeometry [args]="[0.5, 0.5, 0.5]" />
 *   <ng-container a3dStandardMaterial [color]="'#ff6b6b'" />
 * </a3d-instanced-mesh>
 * ```
 */
@Component({
  selector: 'a3d-instanced-mesh',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    { provide: OBJECT_ID, useFactory: () => `instanced-mesh-${crypto.randomUUID()}` },
    { provide: GEOMETRY_SIGNAL, useFactory: () => signal<THREE.BufferGeometry | null>(null) },
    { provide: MATERIAL_SIGNAL, useFactory: () => signal<THREE.Material | null>(null) },
  ],
})
export class InstancedMeshComponent {
  // Required inputs
  public readonly count = input.required<number>();

  // Optional transform arrays
  public readonly instanceMatrix = input<Float32Array | undefined>(undefined);
  public readonly instanceColor = input<Float32Array | undefined>(undefined);

  // Configuration
  public readonly frustumCulled = input<boolean>(true);
  public readonly usage = input<'static' | 'dynamic'>('static');
  public readonly castShadow = input<boolean>(false);
  public readonly receiveShadow = input<boolean>(false);

  // Events
  public readonly meshReady = output<THREE.InstancedMesh>();

  // Injections
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);
  private readonly geometrySignal = inject(GEOMETRY_SIGNAL);
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly sceneService = inject(SceneService);

  // Internal state
  private instancedMesh: THREE.InstancedMesh | null = null;
  private readonly _isReady = signal(false);
  public readonly isReady = this._isReady.asReadonly();

  // Temporary matrix for updates
  private readonly tempMatrix = new THREE.Matrix4();
  private readonly tempColor = new THREE.Color();

  constructor() {
    // Create instanced mesh when geometry and material are ready
    effect(() => {
      if (!this.sceneStore.isReady()) return;

      const geometry = this.geometrySignal();
      const material = this.materialSignal();
      const count = this.count();

      if (!geometry || !material || !count) return;
      if (this.instancedMesh) return; // Already created

      this.createInstancedMesh(geometry, material, count);
    });

    // Update instance matrices when input changes
    effect(() => {
      const matrix = this.instanceMatrix();
      if (matrix && this.instancedMesh) {
        this.instancedMesh.instanceMatrix.array.set(matrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.sceneService.invalidate();
      }
    });

    // Update instance colors when input changes
    effect(() => {
      const colors = this.instanceColor();
      if (colors && this.instancedMesh) {
        if (!this.instancedMesh.instanceColor) {
          this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.count() * 3), 3);
        }
        this.instancedMesh.instanceColor.array.set(colors);
        this.instancedMesh.instanceColor.needsUpdate = true;
        this.sceneService.invalidate();
      }
    });

    // Update frustum culling
    effect(() => {
      if (this.instancedMesh) {
        this.instancedMesh.frustumCulled = this.frustumCulled();
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  private createInstancedMesh(geometry: THREE.BufferGeometry, material: THREE.Material, count: number): void {
    this.instancedMesh = new THREE.InstancedMesh(geometry, material, count);

    // Configure usage
    if (this.usage() === 'dynamic') {
      this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    }

    // Configure shadows
    this.instancedMesh.castShadow = this.castShadow();
    this.instancedMesh.receiveShadow = this.receiveShadow();
    this.instancedMesh.frustumCulled = this.frustumCulled();

    // Initialize matrices to identity if no input provided
    const inputMatrix = this.instanceMatrix();
    if (inputMatrix) {
      this.instancedMesh.instanceMatrix.array.set(inputMatrix);
    } else {
      // Initialize all instances to identity matrix
      for (let i = 0; i < count; i++) {
        this.tempMatrix.identity();
        this.instancedMesh.setMatrixAt(i, this.tempMatrix);
      }
    }
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    // Initialize colors if provided
    const inputColors = this.instanceColor();
    if (inputColors) {
      this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(inputColors), 3);
    }

    // Add to parent
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.instancedMesh);
      }
    }

    // Register with store
    this.sceneStore.register(this.objectId, this.instancedMesh, 'mesh');

    this._isReady.set(true);
    this.meshReady.emit(this.instancedMesh);
  }

  /**
   * Update a specific instance's transform
   * @param index Instance index (0 to count-1)
   * @param matrix Transformation matrix
   * @param color Optional color override
   */
  public updateInstanceAt(index: number, matrix: THREE.Matrix4, color?: THREE.Color): void {
    if (!this.instancedMesh || index < 0 || index >= this.count()) return;

    this.instancedMesh.setMatrixAt(index, matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;

    if (color) {
      this.setColorAt(index, color);
    }

    this.sceneService.invalidate();
  }

  /**
   * Set matrix for a specific instance
   */
  public setMatrixAt(index: number, matrix: THREE.Matrix4): void {
    if (!this.instancedMesh || index < 0 || index >= this.count()) return;

    this.instancedMesh.setMatrixAt(index, matrix);
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.sceneService.invalidate();
  }

  /**
   * Set color for a specific instance
   */
  public setColorAt(index: number, color: THREE.Color): void {
    if (!this.instancedMesh || index < 0 || index >= this.count()) return;

    // Initialize instanceColor if not exists
    if (!this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.count() * 3), 3);
      // Initialize all to white
      for (let i = 0; i < this.count(); i++) {
        this.instancedMesh.instanceColor.setXYZ(i, 1, 1, 1);
      }
    }

    this.instancedMesh.setColorAt(index, color);
    this.instancedMesh.instanceColor.needsUpdate = true;
    this.sceneService.invalidate();
  }

  /**
   * Get the underlying InstancedMesh object
   */
  public getMesh(): THREE.InstancedMesh | null {
    return this.instancedMesh;
  }

  private dispose(): void {
    if (this.instancedMesh) {
      // Remove from parent
      if (this.parentFn) {
        const parent = this.parentFn();
        parent?.remove(this.instancedMesh);
      }

      // Remove from store
      this.sceneStore.remove(this.objectId);

      // Dispose resources
      this.instancedMesh.geometry?.dispose();
      if (Array.isArray(this.instancedMesh.material)) {
        this.instancedMesh.material.forEach((m) => m.dispose());
      } else {
        this.instancedMesh.material?.dispose();
      }

      this.instancedMesh = null;
    }

    this._isReady.set(false);
  }
}
````

**Quality Requirements**:

- Single draw call for all instances (verify via renderer.info.render.calls)
- Support 100,000+ instances at 60fps on mid-range GPU
- Memory efficient (reuse temp matrix/color objects)
- Tree-shakeable (independent import)

---

### Feature C: EnvironmentComponent (Priority 3)

**Purpose**: Load HDRI/EXR environment maps for image-based lighting, enabling photorealistic PBR material appearance.

**Pattern**: Primitive component with async loading
**Evidence**: `gltf-model.component.ts:17-228` shows async loader pattern

#### C.1 EnvironmentComponent

**File**: `libs/angular-3d/src/lib/primitives/environment.component.ts` (CREATE)

**Responsibilities**:

- Load HDRI/EXR using RGBELoader from three-stdlib
- Apply PMREMGenerator for environment map processing
- Set scene.environment for PBR materials
- Optionally set scene.background
- Support preset environments
- Handle loading states and errors

**Implementation Pattern**:

````typescript
import { Component, ChangeDetectionStrategy, input, effect, inject, DestroyRef, signal, output } from '@angular/core';
import * as THREE from 'three';
import { RGBELoader } from 'three-stdlib';
import { SceneService } from '../canvas/scene.service';

/**
 * Environment presets - URLs to commonly used HDRIs
 * Using polyhaven.com CDN for high-quality free HDRIs
 */
const ENVIRONMENT_PRESETS: Record<string, string> = {
  sunset: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_43d_clear_puresky_1k.hdr',
  dawn: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dikhololo_night_1k.hdr',
  night: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr',
  warehouse: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr',
  forest: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/forest_slope_1k.hdr',
  apartment: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/lebombo_1k.hdr',
  studio: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_03_1k.hdr',
  city: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/potsdamer_platz_1k.hdr',
  park: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/rooitou_park_1k.hdr',
  lobby: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/modern_buildings_2_1k.hdr',
};

export type EnvironmentPreset = keyof typeof ENVIRONMENT_PRESETS;

/**
 * EnvironmentComponent - HDRI/EXR environment loading
 *
 * Loads environment maps for image-based lighting (IBL).
 * PBR materials automatically reflect the environment.
 *
 * @example
 * ```html
 * <!-- Load custom HDRI -->
 * <a3d-environment [hdri]="'/assets/studio.hdr'" [background]="true" />
 *
 * <!-- Use preset -->
 * <a3d-environment [preset]="'sunset'" [intensity]="1.5" />
 * ```
 */
@Component({
  selector: 'a3d-environment',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class EnvironmentComponent {
  // Input sources (mutually exclusive - hdri takes precedence)
  public readonly hdri = input<string | undefined>(undefined);
  public readonly preset = input<EnvironmentPreset | undefined>(undefined);

  // Configuration
  public readonly background = input<boolean>(false);
  public readonly blur = input<number>(0); // 0-1
  public readonly intensity = input<number>(1);

  // Events
  public readonly loading = output<number>(); // Progress 0-100
  public readonly loaded = output<THREE.Texture>();
  public readonly error = output<Error>();

  // Injections
  private readonly sceneService = inject(SceneService);
  private readonly destroyRef = inject(DestroyRef);

  // Internal state
  private pmremGenerator: THREE.PMREMGenerator | null = null;
  private envMap: THREE.Texture | null = null;
  private loader: RGBELoader | null = null;

  public readonly isLoading = signal(false);
  public readonly loadError = signal<string | null>(null);

  constructor() {
    // Load environment when source changes
    effect((onCleanup) => {
      const hdriPath = this.hdri();
      const presetName = this.preset();

      // Determine URL to load
      let url: string | undefined;
      if (hdriPath) {
        url = hdriPath;
      } else if (presetName && ENVIRONMENT_PRESETS[presetName]) {
        url = ENVIRONMENT_PRESETS[presetName];
      }

      if (!url) {
        // Clear environment if no source
        this.clearEnvironment();
        return;
      }

      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();

      if (!renderer || !scene) return;

      this.loadEnvironment(url, renderer, scene);

      onCleanup(() => {
        this.clearEnvironment();
      });
    });

    // Update background setting
    effect(() => {
      const scene = this.sceneService.scene();
      const showBackground = this.background();
      const blurAmount = this.blur();

      if (!scene || !this.envMap) return;

      if (showBackground) {
        scene.background = this.envMap;
        scene.backgroundBlurriness = blurAmount;
      } else {
        scene.background = null;
      }

      this.sceneService.invalidate();
    });

    // Update intensity
    effect(() => {
      const scene = this.sceneService.scene();
      const intensityValue = this.intensity();

      if (!scene) return;

      scene.environmentIntensity = intensityValue;
      this.sceneService.invalidate();
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  private loadEnvironment(url: string, renderer: THREE.WebGLRenderer, scene: THREE.Scene): void {
    this.isLoading.set(true);
    this.loadError.set(null);

    // Initialize PMREMGenerator
    this.pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.pmremGenerator.compileEquirectangularShader();

    // Initialize loader
    this.loader = new RGBELoader();

    this.loader.load(
      url,
      // onLoad
      (texture) => {
        this.envMap = this.pmremGenerator!.fromEquirectangular(texture).texture;

        // Set as scene environment
        scene.environment = this.envMap;

        // Optionally set as background
        if (this.background()) {
          scene.background = this.envMap;
          scene.backgroundBlurriness = this.blur();
        }

        // Apply intensity
        scene.environmentIntensity = this.intensity();

        // Cleanup source texture
        texture.dispose();
        this.pmremGenerator?.dispose();

        this.isLoading.set(false);
        this.loaded.emit(this.envMap);
        this.sceneService.invalidate();
      },
      // onProgress
      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          this.loading.emit(percent);
        }
      },
      // onError
      (err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        this.isLoading.set(false);
        this.loadError.set(error.message);
        this.error.emit(error);
        console.error('[EnvironmentComponent] Failed to load HDRI:', error);
      }
    );
  }

  private clearEnvironment(): void {
    const scene = this.sceneService.scene();
    if (scene) {
      scene.environment = null;
      if (scene.background instanceof THREE.Texture) {
        scene.background = null;
      }
    }
  }

  private dispose(): void {
    this.clearEnvironment();

    if (this.envMap) {
      this.envMap.dispose();
      this.envMap = null;
    }

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }

    this.loader = null;
  }
}
````

**Quality Requirements**:

- Load time <2 seconds for 2K HDRI on 10Mbps connection
- Graceful error handling (no scene crash)
- Proper resource disposal
- Loading progress events
- Support both custom URLs and presets

---

### Feature D: ShaderMaterialDirective (Priority 4)

**Purpose**: Enable custom GLSL shaders for advanced visual effects like water caustics, ray marching, and procedural textures.

**Pattern**: Material directive following existing pattern
**Evidence**: `standard-material.directive.ts:42-131` shows material directive pattern

#### D.1 ShaderMaterialDirective

**File**: `libs/angular-3d/src/lib/directives/materials/shader-material.directive.ts` (CREATE)

**Responsibilities**:

- Create THREE.ShaderMaterial with custom GLSL code
- Convert uniform values to THREE.Uniform objects
- Auto-inject common uniforms (time, resolution, mouse)
- Support reactive uniform updates
- Handle defines for compile-time variants

**Implementation Pattern**:

````typescript
import { Directive, inject, effect, input, DestroyRef } from '@angular/core';
import * as THREE from 'three';
import { MATERIAL_SIGNAL } from '../../tokens/material.token';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';

/**
 * Uniform value types supported by the directive
 */
export type UniformValue = number | number[] | THREE.Vector2 | THREE.Vector3 | THREE.Vector4 | THREE.Matrix3 | THREE.Matrix4 | THREE.Color | THREE.Texture | string; // hex color

/**
 * ShaderMaterialDirective - Custom GLSL shaders
 *
 * Creates ShaderMaterial with reactive uniform updates.
 * Automatically injects time, resolution, and mouse uniforms.
 *
 * @example
 * ```html
 * <a3d-box
 *   [a3dShaderMaterial]="true"
 *   [vertexShader]="myVertexShader"
 *   [fragmentShader]="myFragmentShader"
 *   [uniforms]="{ color: '#ff0000', intensity: 1.0 }"
 * />
 * ```
 */
@Directive({
  selector: '[a3dShaderMaterial]',
  standalone: true,
})
export class ShaderMaterialDirective {
  private readonly materialSignal = inject(MATERIAL_SIGNAL);
  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Shader code
  public readonly vertexShader = input.required<string>();
  public readonly fragmentShader = input.required<string>();

  // Uniforms and defines
  public readonly uniforms = input<Record<string, UniformValue>>({});
  public readonly defines = input<Record<string, string>>({});

  // Material properties
  public readonly transparent = input<boolean>(false);
  public readonly wireframe = input<boolean>(false);
  public readonly side = input<'front' | 'back' | 'double'>('front');
  public readonly depthTest = input<boolean>(true);
  public readonly depthWrite = input<boolean>(true);
  public readonly blending = input<'normal' | 'additive' | 'subtractive' | 'multiply'>('normal');

  // Auto-inject common uniforms
  public readonly injectTime = input<boolean>(true);
  public readonly injectResolution = input<boolean>(true);
  public readonly injectMouse = input<boolean>(false);

  private material: THREE.ShaderMaterial | null = null;
  private cleanupRenderLoop: (() => void) | null = null;

  constructor() {
    // Create material
    effect(() => {
      const vs = this.vertexShader();
      const fs = this.fragmentShader();

      if (!vs || !fs) return;
      if (this.material) return; // Already created

      this.createMaterial(vs, fs);
    });

    // Update uniforms reactively
    effect(() => {
      if (!this.material) return;

      const userUniforms = this.uniforms();
      this.updateUniforms(userUniforms);
      this.sceneService.invalidate();
    });

    // Update material properties
    effect(() => {
      if (!this.material) return;

      this.material.transparent = this.transparent();
      this.material.wireframe = this.wireframe();
      this.material.depthTest = this.depthTest();
      this.material.depthWrite = this.depthWrite();

      // Side mapping
      const sideMap = {
        front: THREE.FrontSide,
        back: THREE.BackSide,
        double: THREE.DoubleSide,
      };
      this.material.side = sideMap[this.side()];

      // Blending mapping
      const blendMap = {
        normal: THREE.NormalBlending,
        additive: THREE.AdditiveBlending,
        subtractive: THREE.SubtractiveBlending,
        multiply: THREE.MultiplyBlending,
      };
      this.material.blending = blendMap[this.blending()];

      this.material.needsUpdate = true;
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  private createMaterial(vertexShader: string, fragmentShader: string): void {
    // Build uniform objects
    const uniformObjects: Record<string, THREE.IUniform> = {};

    // Auto-inject time uniform
    if (this.injectTime()) {
      uniformObjects['time'] = { value: 0 };
    }

    // Auto-inject resolution uniform
    if (this.injectResolution()) {
      uniformObjects['resolution'] = { value: new THREE.Vector2(1, 1) };
    }

    // Auto-inject mouse uniform
    if (this.injectMouse()) {
      uniformObjects['mouse'] = { value: new THREE.Vector2(0, 0) };
    }

    // User uniforms
    const userUniforms = this.uniforms();
    Object.entries(userUniforms).forEach(([key, value]) => {
      uniformObjects[key] = { value: this.convertUniformValue(value) };
    });

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: uniformObjects,
      defines: this.defines(),
      transparent: this.transparent(),
      wireframe: this.wireframe(),
      depthTest: this.depthTest(),
      depthWrite: this.depthWrite(),
    });

    // Set to material signal
    this.materialSignal.set(this.material);

    // Setup auto-updating uniforms
    this.setupAutoUniforms();
  }

  private setupAutoUniforms(): void {
    if (!this.material) return;

    // Register render callback for time/resolution/mouse updates
    this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta, elapsed) => {
      if (!this.material) return;

      // Update time
      if (this.injectTime() && this.material.uniforms['time']) {
        this.material.uniforms['time'].value = elapsed;
      }

      // Update resolution
      if (this.injectResolution() && this.material.uniforms['resolution']) {
        const renderer = this.sceneService.renderer();
        if (renderer) {
          const size = new THREE.Vector2();
          renderer.getSize(size);
          this.material.uniforms['resolution'].value = size;
        }
      }

      // Mouse uniform would need to be updated via external input or mouse tracking
    });
  }

  private convertUniformValue(value: UniformValue): unknown {
    // Handle hex color strings
    if (typeof value === 'string' && value.startsWith('#')) {
      return new THREE.Color(value);
    }

    // Handle number arrays
    if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          return new THREE.Vector2(value[0], value[1]);
        case 3:
          return new THREE.Vector3(value[0], value[1], value[2]);
        case 4:
          return new THREE.Vector4(value[0], value[1], value[2], value[3]);
        default:
          return value;
      }
    }

    return value;
  }

  private updateUniforms(userUniforms: Record<string, UniformValue>): void {
    if (!this.material) return;

    Object.entries(userUniforms).forEach(([key, value]) => {
      if (this.material!.uniforms[key]) {
        this.material!.uniforms[key].value = this.convertUniformValue(value);
      } else {
        // Add new uniform
        this.material!.uniforms[key] = { value: this.convertUniformValue(value) };
      }
    });
  }

  private dispose(): void {
    if (this.cleanupRenderLoop) {
      this.cleanupRenderLoop();
      this.cleanupRenderLoop = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
  }
}
````

**Quality Requirements**:

- Support all common uniform types
- Auto-inject time uniform with performance (per-frame update)
- Clean disposal of material and textures
- No material recreation on uniform update

---

### Feature E: Post-Processing Effects Expansion (Priority 5)

**Purpose**: Achieve cinematic visual quality with DOF, SSAO, and color grading effects.

**Pattern**: Effect component following existing BloomEffectComponent
**Evidence**: `bloom-effect.component.ts:34-121` shows effect pattern

#### E.1 DepthOfFieldEffectComponent

**File**: `libs/angular-3d/src/lib/postprocessing/effects/dof-effect.component.ts` (CREATE)

**Responsibilities**:

- Create BokehPass with configurable focus, aperture, maxblur
- Integrate with EffectComposerService
- Support demand-based rendering invalidation

**Implementation Pattern**:

````typescript
import { Component, ChangeDetectionStrategy, input, inject, effect, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { BokehPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * DepthOfFieldEffectComponent - Bokeh DOF effect
 *
 * Simulates camera lens blur based on focus distance.
 * Objects outside the focus range appear blurred.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-dof-effect [focus]="10" [aperture]="0.025" [maxblur]="0.01" />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-dof-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DepthOfFieldEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  // DOF parameters
  public readonly focus = input<number>(10);
  public readonly aperture = input<number>(0.025);
  public readonly maxblur = input<number>(0.01);

  private pass: BokehPass | null = null;

  constructor() {
    // Create pass when renderer is available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.pass) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.pass = new BokehPass(scene, camera, {
          focus: this.focus(),
          aperture: this.aperture(),
          maxblur: this.maxblur(),
        });

        this.composerService.addPass(this.pass);
      }
    });

    // Update DOF parameters
    effect(() => {
      if (this.pass) {
        const uniforms = this.pass.uniforms as Record<string, THREE.IUniform>;
        uniforms['focus'].value = this.focus();
        uniforms['aperture'].value = this.aperture();
        uniforms['maxblur'].value = this.maxblur();
        this.sceneService.invalidate();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pass) {
      this.composerService.removePass(this.pass);
      // BokehPass doesn't have explicit dispose
      this.pass = null;
    }
  }
}
````

#### E.2 SsaoEffectComponent

**File**: `libs/angular-3d/src/lib/postprocessing/effects/ssao-effect.component.ts` (CREATE)

**Implementation Pattern**:

````typescript
import { Component, ChangeDetectionStrategy, input, inject, effect, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { SSAOPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * SsaoEffectComponent - Screen Space Ambient Occlusion
 *
 * Adds realistic ambient shadows in crevices and corners.
 * Requires WebGL 2.0 for best results.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-ssao-effect [radius]="4" [intensity]="1" />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-ssao-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SsaoEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  // SSAO parameters
  public readonly radius = input<number>(4);
  public readonly intensity = input<number>(1);
  public readonly kernelRadius = input<number>(8);
  public readonly minDistance = input<number>(0.001);
  public readonly maxDistance = input<number>(0.1);

  private pass: SSAOPass | null = null;

  constructor() {
    effect(() => {
      const renderer = this.sceneService.renderer();
      const scene = this.sceneService.scene();
      const camera = this.sceneService.camera();

      if (renderer && scene && camera && !this.pass) {
        const size = new THREE.Vector2();
        renderer.getSize(size);

        this.pass = new SSAOPass(scene, camera, size.x, size.y);
        this.pass.kernelRadius = this.kernelRadius();
        this.pass.minDistance = this.minDistance();
        this.pass.maxDistance = this.maxDistance();

        this.composerService.addPass(this.pass);
      }
    });

    effect(() => {
      if (this.pass) {
        this.pass.kernelRadius = this.kernelRadius();
        this.pass.minDistance = this.minDistance();
        this.pass.maxDistance = this.maxDistance();
        this.sceneService.invalidate();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pass) {
      this.composerService.removePass(this.pass);
      this.pass = null;
    }
  }
}
````

#### E.3 ColorGradingEffectComponent

**File**: `libs/angular-3d/src/lib/postprocessing/effects/color-grading-effect.component.ts` (CREATE)

**Implementation Pattern**:

````typescript
import { Component, ChangeDetectionStrategy, input, inject, effect, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { ShaderPass } from 'three-stdlib';
import { EffectComposerService } from '../effect-composer.service';
import { SceneService } from '../../canvas/scene.service';

// Custom color grading shader
const ColorGradingShader = {
  uniforms: {
    tDiffuse: { value: null },
    saturation: { value: 1.0 },
    contrast: { value: 1.0 },
    brightness: { value: 1.0 },
    gamma: { value: 2.2 },
    exposure: { value: 1.0 },
    vignette: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float saturation;
    uniform float contrast;
    uniform float brightness;
    uniform float gamma;
    uniform float exposure;
    uniform float vignette;
    varying vec2 vUv;

    vec3 adjustSaturation(vec3 color, float sat) {
      vec3 luminanceWeights = vec3(0.2126, 0.7152, 0.0722);
      float luminance = dot(color, luminanceWeights);
      return mix(vec3(luminance), color, sat);
    }

    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      vec3 color = texel.rgb;

      // Exposure
      color *= exposure;

      // Saturation
      color = adjustSaturation(color, saturation);

      // Contrast
      color = (color - 0.5) * contrast + 0.5;

      // Brightness
      color *= brightness;

      // Gamma correction
      color = pow(color, vec3(1.0 / gamma));

      // Vignette
      if (vignette > 0.0) {
        vec2 center = vUv - 0.5;
        float dist = length(center);
        float vig = smoothstep(0.8, 0.2, dist * (1.0 + vignette));
        color *= mix(1.0, vig, vignette);
      }

      gl_FragColor = vec4(clamp(color, 0.0, 1.0), texel.a);
    }
  `,
};

/**
 * ColorGradingEffectComponent - Cinematic color correction
 *
 * Adjusts saturation, contrast, brightness, gamma, exposure, and vignette.
 *
 * @example
 * ```html
 * <a3d-effect-composer>
 *   <a3d-color-grading-effect
 *     [saturation]="1.2"
 *     [contrast]="1.1"
 *     [vignette]="0.3"
 *   />
 * </a3d-effect-composer>
 * ```
 */
@Component({
  selector: 'a3d-color-grading-effect',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorGradingEffectComponent implements OnDestroy {
  private readonly composerService = inject(EffectComposerService);
  private readonly sceneService = inject(SceneService);

  // Color grading parameters
  public readonly saturation = input<number>(1);
  public readonly contrast = input<number>(1);
  public readonly brightness = input<number>(1);
  public readonly gamma = input<number>(2.2);
  public readonly exposure = input<number>(1);
  public readonly vignette = input<number>(0);

  private pass: ShaderPass | null = null;

  constructor() {
    effect(() => {
      const renderer = this.sceneService.renderer();

      if (renderer && !this.pass) {
        this.pass = new ShaderPass(ColorGradingShader);
        this.composerService.addPass(this.pass);
      }
    });

    effect(() => {
      if (this.pass) {
        this.pass.uniforms['saturation'].value = this.saturation();
        this.pass.uniforms['contrast'].value = this.contrast();
        this.pass.uniforms['brightness'].value = this.brightness();
        this.pass.uniforms['gamma'].value = this.gamma();
        this.pass.uniforms['exposure'].value = this.exposure();
        this.pass.uniforms['vignette'].value = this.vignette();
        this.sceneService.invalidate();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.pass) {
      this.composerService.removePass(this.pass);
      this.pass = null;
    }
  }
}
````

---

## Export Updates

### libs/angular-3d/src/lib/postprocessing/index.ts (MODIFY)

```typescript
export * from './effect-composer.service';
export * from './effect-composer.component';
export * from './effects/bloom-effect.component';
export * from './effects/dof-effect.component'; // NEW
export * from './effects/ssao-effect.component'; // NEW
export * from './effects/color-grading-effect.component'; // NEW
```

### libs/angular-3d/src/lib/primitives/index.ts (MODIFY)

Add to existing exports:

```typescript
export * from './instanced-mesh.component'; // NEW
export * from './environment.component'; // NEW
```

### libs/angular-3d/src/lib/directives/index.ts (MODIFY)

Add to existing exports:

```typescript
export * from './materials/shader-material.directive'; // NEW
```

---

## Integration Architecture

### Integration Points

| Component               | Integration Method                     | Verified Pattern                      |
| ----------------------- | -------------------------------------- | ------------------------------------- |
| InstancedMeshComponent  | NG_3D_PARENT + SceneGraphStore         | `gltf-model.component.ts:113-120`     |
| EnvironmentComponent    | SceneService.scene() + invalidate()    | `effect-composer.component.ts:46-56`  |
| ShaderMaterialDirective | MATERIAL_SIGNAL token                  | `standard-material.directive.ts:47`   |
| Post-processing effects | EffectComposerService.addPass()        | `bloom-effect.component.ts:89`        |
| Demand rendering        | RenderLoopService + SceneService proxy | `orbit-controls.component.ts:196-199` |

### Data Flow

```
Scene3dComponent
  |
  +-- frameloop input --> RenderLoopService.setFrameloop()
  |
  +-- Child Components:
      |
      +-- InstancedMeshComponent
      |     |-- Uses GEOMETRY_SIGNAL, MATERIAL_SIGNAL
      |     |-- Registers with SceneGraphStore
      |     +-- Calls sceneService.invalidate() on updates
      |
      +-- EnvironmentComponent
      |     |-- Sets scene.environment
      |     +-- Calls sceneService.invalidate() on load
      |
      +-- EffectComposerComponent
            |-- Initializes EffectComposerService
            +-- Effect children (DOF, SSAO, ColorGrading)
                  |-- Register passes with EffectComposerService
                  +-- Call sceneService.invalidate() on property changes
```

### Demand-Based Rendering Flow

```
User Interaction (e.g., OrbitControls drag)
  --> OrbitControls 'change' event
  --> sceneService.invalidate()
  --> renderLoopService.invalidate()
  --> _needsRender.set(true)
  --> RAF loop renders frame
  --> _needsRender.set(false)
  --> 100ms timeout
  --> RAF loop stops (0% GPU when idle)
```

---

## Quality Requirements (Architecture-Level)

### Functional Requirements

- All new components use signal-based inputs
- All new components use OnPush change detection
- All new components properly dispose Three.js resources
- Demand-based rendering reduces GPU usage to 0% when idle
- InstancedMesh enables 100k+ instances at 60fps
- Environment loading completes in <2 seconds for 2K HDRI

### Non-Functional Requirements

- **Performance**: <10ms per frame for DOF+SSAO+ColorGrading combined
- **Memory**: <50MB additional for all new features
- **Bundle Size**: Tree-shakeable, ~30KB per feature when used
- **Compatibility**: WebGL 2.0 for SSAO, graceful degradation for WebGL 1.0

### Pattern Compliance

| Pattern                 | Evidence                            | Compliance         |
| ----------------------- | ----------------------------------- | ------------------ |
| Signal inputs           | `input<T>()`, `input.required<T>()` | All new components |
| OnPush change detection | `ChangeDetectionStrategy.OnPush`    | All new components |
| DestroyRef cleanup      | `destroyRef.onDestroy()`            | All new components |
| Zone.js bypass          | `ngZone.runOutsideAngular()`        | RenderLoopService  |
| Selector prefix         | `a3d-` components, `a3d` directives | All new exports    |

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: backend-developer (TypeScript focus, no UI/UX)

**Rationale**:

1. All work is TypeScript library code in libs/angular-3d
2. No HTML templates or CSS styling required
3. Heavy Three.js integration (3D graphics engine)
4. WebGL performance optimization focus
5. No browser UI component work

### Complexity Assessment

**Complexity**: HIGH
**Estimated Effort**: 16-24 hours

**Breakdown by Feature**:

- Demand-Based Rendering: 4-5 hours (service modifications)
- InstancedMeshComponent: 4-5 hours (new component)
- EnvironmentComponent: 3-4 hours (new component)
- ShaderMaterialDirective: 3-4 hours (new directive)
- Post-Processing Effects: 4-5 hours (3 new components)
- Testing & Integration: 2-3 hours

### Files Affected Summary

**CREATE** (8 files):

- `libs/angular-3d/src/lib/primitives/instanced-mesh.component.ts`
- `libs/angular-3d/src/lib/primitives/environment.component.ts`
- `libs/angular-3d/src/lib/directives/materials/shader-material.directive.ts`
- `libs/angular-3d/src/lib/postprocessing/effects/dof-effect.component.ts`
- `libs/angular-3d/src/lib/postprocessing/effects/ssao-effect.component.ts`
- `libs/angular-3d/src/lib/postprocessing/effects/color-grading-effect.component.ts`

**MODIFY** (9 files):

- `libs/angular-3d/src/lib/render-loop/render-loop.service.ts` - Demand rendering
- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` - frameloop input
- `libs/angular-3d/src/lib/canvas/scene.service.ts` - invalidate() proxy
- `libs/angular-3d/src/lib/controls/orbit-controls.component.ts` - Auto-invalidate
- `libs/angular-3d/src/lib/directives/float-3d.directive.ts` - Auto-invalidate
- `libs/angular-3d/src/lib/directives/rotate-3d.directive.ts` - Auto-invalidate
- `libs/angular-3d/src/lib/postprocessing/index.ts` - Export new effects
- `libs/angular-3d/src/lib/primitives/index.ts` - Export new components
- `libs/angular-3d/src/lib/directives/index.ts` - Export new directive

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **Three.js APIs exist**:

   - `THREE.InstancedMesh` - Core Three.js (verified)
   - `THREE.ShaderMaterial` - Core Three.js (verified)
   - `THREE.PMREMGenerator` - Core Three.js (verified)
   - `RGBELoader` - three-stdlib (verified)
   - `BokehPass` - three-stdlib (verified)
   - `SSAOPass` - three-stdlib (verified)
   - `ShaderPass` - three-stdlib (verified)

2. **Patterns verified from examples**:

   - Effect component: `bloom-effect.component.ts:34-121`
   - Primitive component: `box.component.ts:24-50`
   - Material directive: `standard-material.directive.ts:42-131`
   - Service modification: `render-loop.service.ts:88-106`

3. **Library documentation consulted**:

   - `libs/angular-3d/CLAUDE.md`

4. **No hallucinated APIs**:
   - All Three.js classes verified in official docs
   - All three-stdlib exports verified via import statements

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended
- [x] Complexity assessed
- [x] No step-by-step implementation (team-leader's job)

---

## Implementation Priority Order

Based on dependency analysis:

1. **Phase 1: Demand-Based Rendering** (Foundation)

   - RenderLoopService modifications
   - Scene3dComponent frameloop input
   - SceneService invalidate() proxy
   - Required by all other features for proper demand-mode integration

2. **Phase 2: InstancedMeshComponent** (Highest Performance Impact)

   - New component creation
   - Integration with GEOMETRY_SIGNAL/MATERIAL_SIGNAL
   - SceneGraphStore registration

3. **Phase 3: EnvironmentComponent** (Visual Quality)

   - HDRI/EXR loading
   - PMREMGenerator integration
   - Scene.environment setup

4. **Phase 4: ShaderMaterialDirective** (Custom Effects)

   - Uniform conversion
   - Auto-inject uniforms
   - Integration with MeshDirective

5. **Phase 5: Post-Processing Effects** (Final Polish)
   - DOF, SSAO, ColorGrading components
   - EffectComposerService integration
   - Effect ordering

---

**Document Version**: 1.0
**Created**: 2025-12-24
**Author**: Software Architect Agent
**Task ID**: TASK_2025_026
**Status**: READY FOR TEAM-LEADER DECOMPOSITION
