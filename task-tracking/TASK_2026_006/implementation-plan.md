# Implementation Plan - TASK_2026_006

## Scene Loading & Cinematic Entrance Animation System

---

## 1. Architecture Overview

### 1.1 Component Diagram

```
                        +------------------------+
                        |   AssetPreloaderService |
                        |    (providedIn: 'root') |
                        +------------------------+
                                    |
                                    | delegates to
                                    v
             +--------------+---------------+
             |                              |
    +------------------+         +---------------------+
    | GltfLoaderService |         | TextureLoaderService |
    +------------------+         +---------------------+
             |                              |
             +----------- returns -----------+
                     progress signals
                            |
                            v
                    +----------------+
                    |  PreloadState  |
                    | (aggregated)   |
                    +----------------+
                            |
                            | isReady() === true
                            v
              +---------------------------+
              | CinematicEntranceDirective |
              |   (selector: [a3dCinematic |
              |    Entrance])              |
              +---------------------------+
                            |
                            | coordinates with
                            v
              +---------------------------+
              |  OrbitControlsComponent   |
              |  (disables during anim)   |
              +---------------------------+
                            |
                            | entranceComplete event
                            v
              +---------------------------+
              |   SceneRevealDirective    |
              |   (selector: [a3dScene    |
              |    Reveal])               |
              +---------------------------+
```

### 1.2 Data Flow Diagram

```
Phase 1: LOADING
  AssetPreloaderService.preload(assets[])
    --> GltfLoaderService.load() --> progress signal
    --> TextureLoaderService.load() --> progress signal
    --> Aggregated progress() signal (0-100)
    --> isReady() becomes true when all complete

Phase 2: ENTRANCE (when isReady() === true)
  CinematicEntranceDirective
    --> Disable OrbitControls (enabled = false)
    --> Animate camera position/lookAt via GSAP
    --> Call sceneService.invalidate() on each frame
    --> Re-enable OrbitControls + sync target
    --> Emit entranceComplete event

Phase 3: REVEAL (when entranceComplete emitted)
  SceneRevealDirective instances
    --> Stagger group coordinator collects directives
    --> GSAP animates objects in stagger order
    --> Each object: opacity/scale/position from hidden to original
    --> Emit revealComplete when all done
```

### 1.3 Signal Flow Architecture

```typescript
// AssetPreloaderService signal composition
const assetSignals: { progress: Signal<number> }[] = assets.map(loadAsset);
const combinedProgress = computed(() => {
  const progresses = assetSignals.map((s) => s.progress());
  return progresses.reduce((sum, p) => sum + p, 0) / progresses.length;
});
const isReady = computed(() => combinedProgress() === 100);

// CinematicEntranceDirective effect-based triggering
effect(() => {
  const ready = preloadState?.isReady();
  if (ready && autoStart && !animationStarted) {
    this.startEntrance();
  }
});

// SceneRevealDirective stagger coordination via service
// StaggerGroupService manages groups of reveal directives
```

---

## 2. File Structure

### 2.1 New Files to Create

```
libs/angular-3d/src/lib/
├── loaders/
│   └── asset-preloader.service.ts       # NEW: Multi-asset loading orchestration
│
├── directives/
│   └── animation/
│       ├── cinematic-entrance.directive.ts  # NEW: Camera entrance animations
│       ├── scene-reveal.directive.ts        # NEW: Object reveal animations
│       ├── stagger-group.service.ts         # NEW: Stagger coordination service
│       └── index.ts                         # UPDATE: Add new exports
```

### 2.2 Files to Update

```
libs/angular-3d/src/lib/
├── loaders/
│   └── index.ts                         # UPDATE: Export AssetPreloaderService
│
├── directives/
│   └── animation/
│       └── index.ts                     # UPDATE: Export new directives
│
└── index.ts                             # No change - barrel already re-exports
```

### 2.3 Public API Additions

The following will be exported from `@hive-academy/angular-3d`:

```typescript
// From loaders/index.ts
export { AssetPreloaderService, type AssetDefinition, type PreloadState } from './asset-preloader.service';

// From directives/animation/index.ts
export { CinematicEntranceDirective, type CinematicEntranceConfig, type EntrancePreset } from './cinematic-entrance.directive';

export { SceneRevealDirective, type SceneRevealConfig, type RevealAnimation } from './scene-reveal.directive';

export { StaggerGroupService } from './stagger-group.service';
```

---

## 3. Detailed Component Designs

### 3.1 AssetPreloaderService

#### TypeScript Interfaces

```typescript
/**
 * Definition of an asset to preload
 */
export interface AssetDefinition {
  /** URL of the asset to load */
  url: string;
  /** Type of asset (determines which loader to use) */
  type: 'gltf' | 'texture' | 'hdri';
  /** Optional weight for progress calculation (default: 1) */
  weight?: number;
  /** Optional loader options (for GLTF: useDraco, etc.) */
  options?: GltfLoaderOptions;
}

/**
 * State object returned from preload() with reactive signals
 */
export interface PreloadState {
  /** Combined progress across all assets (0-100) */
  readonly progress: Signal<number>;
  /** True when all assets have loaded successfully */
  readonly isReady: Signal<boolean>;
  /** Array of any errors encountered during loading */
  readonly errors: Signal<Error[]>;
  /** Count of successfully loaded assets */
  readonly loadedCount: Signal<number>;
  /** Total number of assets being loaded */
  readonly totalCount: Signal<number>;
  /** Cancel loading and cleanup resources */
  readonly cancel: () => void;
}

/**
 * Internal tracking for a single asset load operation
 */
interface AssetLoadOperation {
  url: string;
  type: AssetDefinition['type'];
  weight: number;
  progress: Signal<number>;
  error: Signal<Error | null>;
  loaded: Signal<boolean>;
}
```

#### Signal Architecture

```typescript
@Injectable({ providedIn: 'root' })
export class AssetPreloaderService {
  private readonly gltfLoader = inject(GltfLoaderService);
  private readonly textureLoader = inject(TextureLoaderService);

  // Track active preload operations by unique ID
  private readonly activeOperations = new Map<string, PreloadState>();
  private operationCounter = 0;

  /**
   * Preload multiple assets with unified progress tracking
   *
   * @param assets - Array of asset definitions to load
   * @returns PreloadState with reactive signals
   */
  public preload(assets: AssetDefinition[]): PreloadState {
    const operationId = `preload_${++this.operationCounter}`;
    const operations: AssetLoadOperation[] = [];

    // Create writable signals for aggregation
    const _errors = signal<Error[]>([]);
    const _cancelled = signal(false);

    // Start loading each asset
    for (const asset of assets) {
      const weight = asset.weight ?? 1;
      const operation = this.startAssetLoad(asset);
      operations.push({ ...operation, weight });
    }

    // Computed signal: weighted average progress
    const progress = computed(() => {
      if (_cancelled()) return 0;

      const totalWeight = operations.reduce((sum, op) => sum + op.weight, 0);
      if (totalWeight === 0) return 100;

      const weightedProgress = operations.reduce((sum, op) => {
        return sum + op.progress() * op.weight;
      }, 0);

      return Math.round(weightedProgress / totalWeight);
    });

    // Computed signal: all assets loaded
    const isReady = computed(() => {
      if (_cancelled()) return false;
      return operations.every((op) => op.loaded());
    });

    // Computed signal: count of loaded assets
    const loadedCount = computed(() => {
      return operations.filter((op) => op.loaded()).length;
    });

    // Computed signal: total asset count
    const totalCount = computed(() => assets.length);

    // Collect errors from all operations
    const errors = computed(() => {
      const allErrors: Error[] = [..._errors()];
      for (const op of operations) {
        const err = op.error();
        if (err) allErrors.push(err);
      }
      return allErrors;
    });

    // Cancel function
    const cancel = () => {
      _cancelled.set(true);
      this.activeOperations.delete(operationId);
      // Note: Underlying loaders don't support cancellation,
      // but we mark state as cancelled to prevent further updates
    };

    const state: PreloadState = {
      progress: progress.asReadonly(),
      isReady: isReady.asReadonly(),
      errors: errors.asReadonly(),
      loadedCount: loadedCount.asReadonly(),
      totalCount: totalCount.asReadonly(),
      cancel,
    };

    this.activeOperations.set(operationId, state);
    return state;
  }

  /**
   * Start loading a single asset
   */
  private startAssetLoad(asset: AssetDefinition): Omit<AssetLoadOperation, 'weight'> {
    const _progress = signal(0);
    const _error = signal<Error | null>(null);
    const _loaded = signal(false);

    switch (asset.type) {
      case 'gltf': {
        const result = this.gltfLoader.load(asset.url, asset.options);
        // Create effect to sync progress
        effect(
          () => {
            _progress.set(result.progress());
            if (result.error()) _error.set(result.error());
            if (result.data()) _loaded.set(true);
          },
          { allowSignalWrites: true }
        );
        break;
      }
      case 'texture': {
        const result = this.textureLoader.load(asset.url);
        effect(
          () => {
            _progress.set(result.progress());
            if (result.error()) _error.set(result.error());
            if (result.data()) _loaded.set(true);
          },
          { allowSignalWrites: true }
        );
        break;
      }
      case 'hdri': {
        // HDRI not yet implemented - mark as loaded immediately
        // Future: integrate with environment loader
        console.warn('[AssetPreloaderService] HDRI loading not yet implemented');
        _progress.set(100);
        _loaded.set(true);
        break;
      }
    }

    return {
      url: asset.url,
      type: asset.type,
      progress: _progress.asReadonly(),
      error: _error.asReadonly(),
      loaded: _loaded.asReadonly(),
    };
  }
}
```

#### Integration with Existing Loader Services

**Evidence from codebase:**

- `GltfLoaderService.load()` returns `GltfLoadResult` with `progress()`, `data()`, `error()`, `loading()` signals (verified: `gltf-loader.service.ts:56-67`)
- `TextureLoaderService.load()` returns `TextureLoadResult` with same signal pattern (verified: `texture-loader.service.ts:40-50`)
- Both services use internal caching - cached assets return 100% progress immediately (verified: `gltf-loader.service.ts:119-121`, `texture-loader.service.ts:87-89`)

#### Caching Strategy

The service leverages existing caching in `GltfLoaderService` and `TextureLoaderService`:

- When a cached URL is requested, the underlying loader immediately returns `progress: 100` and `loading: false`
- `AssetPreloaderService` does not implement additional caching - it delegates entirely
- Multiple calls to `preload()` with the same URLs will benefit from cache hits in underlying loaders

---

### 3.2 CinematicEntranceDirective

#### Directive Structure (Following Float3dDirective Pattern)

**Evidence from codebase:**

- `Float3dDirective` pattern: signal inputs, effect(), DestroyRef cleanup, dynamic GSAP import (verified: `float-3d.directive.ts:54-139`)
- Inject pattern: `inject(SceneService, { optional: true })` for demand rendering (verified: `float-3d.directive.ts:99-100`)
- GSAP timeline storage and cleanup pattern (verified: `float-3d.directive.ts:113, 221-226`)

```typescript
/**
 * Entrance animation preset type
 */
export type EntrancePreset = 'dolly-in' | 'orbit-drift' | 'crane-up' | 'fade-drift';

/**
 * Configuration for CinematicEntranceDirective
 */
export interface CinematicEntranceConfig {
  /** Animation preset name */
  preset?: EntrancePreset;
  /** Animation duration in seconds (default: 2.5) */
  duration?: number;
  /** Starting camera position [x, y, z] */
  startPosition?: [number, number, number];
  /** Ending camera position [x, y, z] */
  endPosition?: [number, number, number];
  /** Starting look-at target [x, y, z] */
  startLookAt?: [number, number, number];
  /** Ending look-at target [x, y, z] */
  endLookAt?: [number, number, number];
  /** GSAP easing function (default: 'power2.inOut') */
  easing?: string;
  /** Delay before starting in seconds (default: 0) */
  delay?: number;
  /** Start automatically when preload is ready (default: true) */
  autoStart?: boolean;
  /** Optional PreloadState to wait for before starting */
  preloadState?: PreloadState;
}

@Directive({
  selector: '[a3dCinematicEntrance]',
  standalone: true,
})
export class CinematicEntranceDirective {
  // DI - following Float3dDirective pattern
  private readonly sceneService = inject(SceneService, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // Input for configuration
  public readonly entranceConfig = input<CinematicEntranceConfig | undefined>(undefined);

  // Output events
  public readonly entranceStart = output<void>();
  public readonly entranceComplete = output<void>();

  // Internal state
  private gsapTimeline: gsap.core.Timeline | null = null;
  private orbitControls: OrbitControls | null = null;
  private animationStarted = false;
  private originalCameraPosition: THREE.Vector3 | null = null;

  constructor() {
    // Effect: Watch for preload ready state OR immediate start
    effect(() => {
      const config = this.entranceConfig();
      if (!config) return;

      const camera = this.sceneService?.camera();
      if (!camera) return;

      // Check if we should auto-start
      const autoStart = config.autoStart ?? true;
      if (!autoStart) return;

      // Check preload state if provided
      if (config.preloadState) {
        const ready = config.preloadState.isReady();
        if (ready && !this.animationStarted) {
          this.startEntrance();
        }
      } else if (!this.animationStarted) {
        // No preload state - start immediately
        this.startEntrance();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Start the entrance animation (public for manual triggering)
   */
  public start(): void {
    if (!this.animationStarted) {
      this.startEntrance();
    }
  }

  /**
   * Set OrbitControls reference for coordination
   */
  public setOrbitControls(controls: OrbitControls): void {
    this.orbitControls = controls;
  }

  private async startEntrance(): Promise<void> {
    const config = this.entranceConfig();
    const camera = this.sceneService?.camera();
    if (!config || !camera) return;

    this.animationStarted = true;
    this.entranceStart.emit();

    // Store original camera position for cleanup
    this.originalCameraPosition = camera.position.clone();

    // Disable OrbitControls during animation
    if (this.orbitControls) {
      this.orbitControls.enabled = false;
    }

    // Get preset values or custom values
    const presetValues = this.getPresetValues(config.preset, camera);
    const startPos = config.startPosition ?? presetValues.startPosition;
    const endPos = config.endPosition ?? presetValues.endPosition;
    const startLookAt = config.startLookAt ?? presetValues.startLookAt;
    const endLookAt = config.endLookAt ?? presetValues.endLookAt;
    const duration = config.duration ?? 2.5;
    const easing = config.easing ?? 'power2.inOut';
    const delay = config.delay ?? 0;

    // Set camera to start position
    camera.position.set(startPos[0], startPos[1], startPos[2]);
    if (startLookAt) {
      camera.lookAt(startLookAt[0], startLookAt[1], startLookAt[2]);
    }

    // Dynamic GSAP import (tree-shaking pattern from Float3dDirective)
    const { gsap } = await import('gsap');

    // Check if destroyed during async import
    if (!this.entranceConfig()) return;

    // Create animation timeline
    this.gsapTimeline = gsap.timeline({
      delay,
      onComplete: () => this.onEntranceComplete(),
    });

    // Animate camera position
    this.gsapTimeline.to(
      camera.position,
      {
        x: endPos[0],
        y: endPos[1],
        z: endPos[2],
        duration,
        ease: easing,
        onUpdate: () => {
          // Interpolate lookAt if both start and end are specified
          if (startLookAt && endLookAt) {
            const progress = this.gsapTimeline!.progress();
            const lookX = startLookAt[0] + (endLookAt[0] - startLookAt[0]) * progress;
            const lookY = startLookAt[1] + (endLookAt[1] - startLookAt[1]) * progress;
            const lookZ = startLookAt[2] + (endLookAt[2] - startLookAt[2]) * progress;
            camera.lookAt(lookX, lookY, lookZ);
          } else if (endLookAt) {
            camera.lookAt(endLookAt[0], endLookAt[1], endLookAt[2]);
          }
          // Invalidate for demand-based rendering
          this.sceneService?.invalidate();
        },
      },
      0
    );

    // Handle prefers-reduced-motion
    if (this.prefersReducedMotion()) {
      this.gsapTimeline.progress(1); // Skip to end
    }
  }

  private onEntranceComplete(): void {
    const config = this.entranceConfig();
    const endLookAt = config?.endLookAt ?? this.getPresetValues(config?.preset, this.sceneService?.camera() ?? null).endLookAt;

    // Re-enable OrbitControls and sync target
    if (this.orbitControls) {
      this.orbitControls.enabled = true;
      if (endLookAt) {
        this.orbitControls.target.set(endLookAt[0], endLookAt[1], endLookAt[2]);
        this.orbitControls.update();
      }
    }

    this.entranceComplete.emit();
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private cleanup(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }

    // Re-enable OrbitControls if animation was interrupted
    if (this.orbitControls && !this.orbitControls.enabled) {
      this.orbitControls.enabled = true;
    }
  }

  // ...getPresetValues() method defined below...
}
```

#### Preset Definitions

```typescript
interface PresetValues {
  startPosition: [number, number, number];
  endPosition: [number, number, number];
  startLookAt?: [number, number, number];
  endLookAt?: [number, number, number];
}

private getPresetValues(
  preset: EntrancePreset | undefined,
  camera: THREE.PerspectiveCamera | null
): PresetValues {
  // Get current camera position as default end position
  const currentPos = camera?.position ?? new THREE.Vector3(0, 2, 8);
  const endPos: [number, number, number] = [currentPos.x, currentPos.y, currentPos.z];

  switch (preset) {
    case 'dolly-in':
      // Move camera from far to close along Z-axis
      return {
        startPosition: [endPos[0], endPos[1], endPos[2] + 10],
        endPosition: endPos,
        startLookAt: [0, 0, 0],
        endLookAt: [0, 0, 0],
      };

    case 'orbit-drift':
      // Subtle orbit rotation combined with dolly
      // Start offset to the right and farther back
      return {
        startPosition: [endPos[0] + 5, endPos[1] + 2, endPos[2] + 5],
        endPosition: endPos,
        startLookAt: [0, 0, 0],
        endLookAt: [0, 0, 0],
      };

    case 'crane-up':
      // Move camera upward while looking down at scene
      return {
        startPosition: [endPos[0], endPos[1] - 5, endPos[2]],
        endPosition: endPos,
        startLookAt: [0, -3, 0],
        endLookAt: [0, 0, 0],
      };

    case 'fade-drift':
      // Gentle horizontal drift (camera starts slightly to the left)
      return {
        startPosition: [endPos[0] - 3, endPos[1], endPos[2]],
        endPosition: endPos,
        startLookAt: [0, 0, 0],
        endLookAt: [0, 0, 0],
      };

    default:
      // Default: subtle dolly-in
      return {
        startPosition: [endPos[0], endPos[1], endPos[2] + 3],
        endPosition: endPos,
        startLookAt: [0, 0, 0],
        endLookAt: [0, 0, 0],
      };
  }
}
```

#### OrbitControls Coordination Mechanism

**Evidence from codebase:**

- `OrbitControlsComponent` exposes `getControls()` method returning `OrbitControls | null` (verified: `orbit-controls.component.ts:182-184`)
- `OrbitControls` has `enabled` property and `target` Vector3 (three-stdlib standard)
- Component emits `controlsReady` output with the OrbitControls instance (verified: `orbit-controls.component.ts:142`)

**Coordination Pattern:**

```typescript
// In consuming component template:
<a3d-orbit-controls
  #orbitControls
  a3dCinematicEntrance
  [entranceConfig]="entranceConfig"
  (controlsReady)="onControlsReady($event)"
  (entranceComplete)="onEntranceComplete()">
</a3d-orbit-controls>

// In component class:
@ViewChild(CinematicEntranceDirective) entranceDirective!: CinematicEntranceDirective;

onControlsReady(controls: OrbitControls): void {
  this.entranceDirective.setOrbitControls(controls);
}
```

**Alternative: Automatic Discovery via ContentChild**

The directive could auto-discover OrbitControls by querying the host:

```typescript
// In CinematicEntranceDirective
private readonly orbitControlsComponent = inject(OrbitControlsComponent, {
  optional: true,
  host: true,
});

constructor() {
  // Effect to capture controls when ready
  effect(() => {
    const controls = this.orbitControlsComponent?.getControls();
    if (controls) {
      this.orbitControls = controls;
    }
  });
}
```

---

### 3.3 SceneRevealDirective

#### Object State Management

```typescript
/**
 * Reveal animation type
 */
export type RevealAnimation = 'fade-in' | 'scale-pop' | 'rise-up';

/**
 * Configuration for SceneRevealDirective
 */
export interface SceneRevealConfig {
  /** Animation type */
  animation?: RevealAnimation;
  /** Animation duration in seconds (default: 0.8) */
  duration?: number;
  /** Delay before starting in seconds (default: 0) */
  delay?: number;
  /** GSAP easing function (default: 'power2.out') */
  easing?: string;
  /** Stagger group name for coordinated animations */
  staggerGroup?: string;
  /** Index within stagger group (for manual ordering) */
  staggerIndex?: number;
  /** Automatically reveal when entrance completes (default: true) */
  autoReveal?: boolean;
}

/**
 * Original state captured for restoration
 */
interface OriginalState {
  position: THREE.Vector3;
  scale: THREE.Vector3;
  opacity: Map<THREE.Material, number>;
  visible: boolean;
}

@Directive({
  selector: '[a3dSceneReveal]',
  standalone: true,
})
export class SceneRevealDirective {
  // DI - following Float3dDirective pattern
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly sceneService = inject(SceneService, { optional: true });
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly staggerService = inject(StaggerGroupService, { optional: true });

  // Configuration input
  public readonly revealConfig = input<SceneRevealConfig | undefined>(undefined);

  // Output events
  public readonly revealStart = output<void>();
  public readonly revealComplete = output<void>();

  // Internal state
  private gsapTimeline: gsap.core.Timeline | null = null;
  private originalState: OriginalState | null = null;
  private isHidden = false;

  // Computed signal for object access (from Float3dDirective pattern)
  private readonly object3D = computed(() => {
    if (!this.objectId) return null;
    return this.sceneStore.getObject<THREE.Object3D>(this.objectId);
  });

  constructor() {
    // Effect: Initialize hidden state when object and config are ready
    effect(() => {
      const obj = this.object3D();
      const config = this.revealConfig();

      if (obj && config && !this.originalState) {
        this.captureOriginalState(obj);
        this.setHiddenState(obj, config);
        this.registerWithStaggerGroup(config);
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Capture original object state for restoration
   */
  private captureOriginalState(obj: THREE.Object3D): void {
    const opacityMap = new Map<THREE.Material, number>();

    // Traverse object to capture all material opacities
    obj.traverse((child) => {
      if ('material' in child && child.material) {
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.forEach((mat: THREE.Material) => {
          opacityMap.set(mat, mat.opacity);
        });
      }
    });

    this.originalState = {
      position: obj.position.clone(),
      scale: obj.scale.clone(),
      opacity: opacityMap,
      visible: obj.visible,
    };
  }

  /**
   * Set object to hidden/initial state based on animation type
   */
  private setHiddenState(obj: THREE.Object3D, config: SceneRevealConfig): void {
    const animation = config.animation ?? 'fade-in';
    this.isHidden = true;

    switch (animation) {
      case 'fade-in':
        // Set all materials to transparent with 0 opacity
        obj.traverse((child) => {
          if ('material' in child && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach((mat: THREE.Material) => {
              mat.transparent = true;
              mat.opacity = 0;
              mat.needsUpdate = true;
            });
          }
        });
        break;

      case 'scale-pop':
        // Set scale to near-zero
        obj.scale.setScalar(0.01);
        break;

      case 'rise-up':
        // Offset position downward
        obj.position.y -= 2;
        break;
    }

    this.sceneService?.invalidate();
  }

  /**
   * Register with stagger group if specified
   */
  private registerWithStaggerGroup(config: SceneRevealConfig): void {
    if (config.staggerGroup && this.staggerService) {
      this.staggerService.register(config.staggerGroup, this, config.staggerIndex ?? 0);
    }
  }

  /**
   * Public API: Trigger reveal animation
   */
  public async reveal(): Promise<void> {
    if (!this.isHidden) return;

    const obj = this.object3D();
    const config = this.revealConfig();
    if (!obj || !config || !this.originalState) return;

    this.revealStart.emit();

    const animation = config.animation ?? 'fade-in';
    const duration = config.duration ?? 0.8;
    const delay = config.delay ?? 0;
    const easing = config.easing ?? 'power2.out';

    // Dynamic GSAP import
    const { gsap } = await import('gsap');

    // Check if destroyed during async import
    if (!this.revealConfig()) return;

    // Handle prefers-reduced-motion
    if (this.prefersReducedMotion()) {
      this.restoreOriginalState(obj);
      this.isHidden = false;
      this.revealComplete.emit();
      return;
    }

    this.gsapTimeline = gsap.timeline({
      delay,
      onComplete: () => {
        this.isHidden = false;
        this.revealComplete.emit();
      },
    });

    switch (animation) {
      case 'fade-in':
        this.animateFadeIn(obj, duration, easing);
        break;

      case 'scale-pop':
        this.animateScalePop(obj, duration, easing);
        break;

      case 'rise-up':
        this.animateRiseUp(obj, duration, easing);
        break;
    }
  }

  /**
   * Public API: Hide object (reverse reveal)
   */
  public async hide(): Promise<void> {
    if (this.isHidden) return;

    const obj = this.object3D();
    const config = this.revealConfig();
    if (!obj || !config) return;

    // Kill any running animation
    this.gsapTimeline?.kill();

    // Set back to hidden state
    this.setHiddenState(obj, config);
    this.isHidden = true;
  }

  private animateFadeIn(obj: THREE.Object3D, duration: number, easing: string): void {
    const materials: THREE.Material[] = [];
    obj.traverse((child) => {
      if ('material' in child && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        materials.push(...mats);
      }
    });

    materials.forEach((mat) => {
      const originalOpacity = this.originalState!.opacity.get(mat) ?? 1;
      this.gsapTimeline!.to(
        mat,
        {
          opacity: originalOpacity,
          duration,
          ease: easing,
          onUpdate: () => {
            mat.needsUpdate = true;
            this.sceneService?.invalidate();
          },
        },
        0
      );
    });
  }

  private animateScalePop(obj: THREE.Object3D, duration: number, easing: string): void {
    const targetScale = this.originalState!.scale;
    this.gsapTimeline!.to(obj.scale, {
      x: targetScale.x,
      y: targetScale.y,
      z: targetScale.z,
      duration,
      ease: 'back.out(1.4)', // Overshoot for "pop" effect
      onUpdate: () => this.sceneService?.invalidate(),
    });
  }

  private animateRiseUp(obj: THREE.Object3D, duration: number, easing: string): void {
    const targetY = this.originalState!.position.y;
    this.gsapTimeline!.to(obj.position, {
      y: targetY,
      duration,
      ease: easing,
      onUpdate: () => this.sceneService?.invalidate(),
    });
  }

  private restoreOriginalState(obj: THREE.Object3D): void {
    if (!this.originalState) return;

    obj.position.copy(this.originalState.position);
    obj.scale.copy(this.originalState.scale);

    this.originalState.opacity.forEach((opacity, mat) => {
      mat.opacity = opacity;
      mat.needsUpdate = true;
    });

    this.sceneService?.invalidate();
  }

  private prefersReducedMotion(): boolean {
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }

  private cleanup(): void {
    if (this.gsapTimeline) {
      this.gsapTimeline.kill();
      this.gsapTimeline = null;
    }

    // Restore original state on destroy
    const obj = this.object3D();
    if (obj && this.originalState) {
      this.restoreOriginalState(obj);
    }

    // Unregister from stagger group
    const config = this.revealConfig();
    if (config?.staggerGroup && this.staggerService) {
      this.staggerService.unregister(config.staggerGroup, this);
    }
  }
}
```

#### Stagger Group Coordination Service

```typescript
/**
 * Service for coordinating staggered reveal animations across multiple directives
 */
@Injectable({ providedIn: 'root' })
export class StaggerGroupService {
  /** Map of group name to registered directives with their indices */
  private readonly groups = new Map<string, Map<SceneRevealDirective, number>>();

  /** Default stagger delay between items (ms) */
  private readonly defaultStaggerDelay = 150;

  /**
   * Register a directive with a stagger group
   */
  public register(groupName: string, directive: SceneRevealDirective, index: number): void {
    if (!this.groups.has(groupName)) {
      this.groups.set(groupName, new Map());
    }
    this.groups.get(groupName)!.set(directive, index);
  }

  /**
   * Unregister a directive from a stagger group
   */
  public unregister(groupName: string, directive: SceneRevealDirective): void {
    const group = this.groups.get(groupName);
    if (group) {
      group.delete(directive);
      if (group.size === 0) {
        this.groups.delete(groupName);
      }
    }
  }

  /**
   * Trigger reveal for all directives in a stagger group
   *
   * @param groupName - Name of the stagger group
   * @param staggerDelay - Delay between each item in milliseconds (default: 150)
   * @returns Promise that resolves when all reveals complete
   */
  public async revealGroup(groupName: string, staggerDelay = this.defaultStaggerDelay): Promise<void> {
    const group = this.groups.get(groupName);
    if (!group) return;

    // Sort directives by stagger index
    const sortedDirectives = [...group.entries()].sort((a, b) => a[1] - b[1]).map(([directive]) => directive);

    // Reveal with stagger delay
    const promises = sortedDirectives.map((directive, i) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          directive.reveal().then(resolve);
        }, i * staggerDelay);
      });
    });

    await Promise.all(promises);
  }

  /**
   * Hide all directives in a stagger group
   */
  public async hideGroup(groupName: string): Promise<void> {
    const group = this.groups.get(groupName);
    if (!group) return;

    const promises = [...group.keys()].map((directive) => directive.hide());
    await Promise.all(promises);
  }

  /**
   * Check if a stagger group exists
   */
  public hasGroup(groupName: string): boolean {
    return this.groups.has(groupName);
  }

  /**
   * Get count of directives in a stagger group
   */
  public getGroupSize(groupName: string): number {
    return this.groups.get(groupName)?.size ?? 0;
  }
}
```

---

## 4. Integration Architecture

### 4.1 Component Discovery Mechanism

**Services use dependency injection (providedIn: 'root'):**

- `AssetPreloaderService` - root-level singleton
- `StaggerGroupService` - root-level singleton for cross-component coordination

**Directives inject from host hierarchy:**

- `SceneService` - provided at Scene3dComponent level (per-scene instance)
- `SceneGraphStore` - provided at Scene3dComponent level (per-scene instance)
- `OBJECT_ID` token - provided by host primitive component

### 4.2 Event Coordination Pattern

```typescript
// In consuming component:
@Component({
  template: `
    <a3d-scene-3d>
      <a3d-orbit-controls #orbitControls a3dCinematicEntrance [entranceConfig]="entranceConfig" (entranceComplete)="onEntranceComplete()"> </a3d-orbit-controls>

      <a3d-gltf-model a3dSceneReveal [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'models', staggerIndex: 0 }" [src]="'/model1.glb'"> </a3d-gltf-model>

      <a3d-box a3dSceneReveal [revealConfig]="{ animation: 'fade-in', staggerGroup: 'models', staggerIndex: 1 }" [position]="[2, 0, 0]"> </a3d-box>
    </a3d-scene-3d>
  `,
})
export class HeroSectionComponent {
  private preloader = inject(AssetPreloaderService);
  private staggerService = inject(StaggerGroupService);

  preloadState = this.preloader.preload([
    { url: '/model1.glb', type: 'gltf' },
    { url: '/texture.jpg', type: 'texture' },
  ]);

  entranceConfig: CinematicEntranceConfig = {
    preset: 'dolly-in',
    duration: 2.5,
    preloadState: this.preloadState,
  };

  async onEntranceComplete(): Promise<void> {
    // Trigger staggered reveal of all objects in 'models' group
    await this.staggerService.revealGroup('models', 150);
  }
}
```

### 4.3 Error Handling Strategy

**AssetPreloaderService Errors:**

- Errors from individual loaders are aggregated into `errors()` signal
- `isReady()` remains `false` if any asset fails (unless all others succeed)
- Consumers can check `errors().length > 0` before starting entrance

**CinematicEntranceDirective Errors:**

- If camera is null during animation, gracefully skip animation
- If OrbitControls is null, proceed without control coordination
- If GSAP import fails, catch and log error

**SceneRevealDirective Errors:**

- If object is null, skip reveal
- If original state capture fails, log warning and proceed
- Material opacity animation handles missing/disposed materials gracefully

---

## 5. Implementation Phases

### Phase 1: AssetPreloaderService (Estimated: 2 hours)

**Dependencies:** None (uses existing loader services)

**Tasks:**

1. Create `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`
2. Implement interfaces: `AssetDefinition`, `PreloadState`
3. Implement `preload()` method with signal aggregation
4. Implement `startAssetLoad()` for each asset type
5. Add HDRI placeholder (logs warning, returns 100%)
6. Update `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\index.ts` with exports
7. Write unit tests

**Complexity:** MEDIUM

### Phase 2: StaggerGroupService (Estimated: 1 hour)

**Dependencies:** None

**Tasks:**

1. Create `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\stagger-group.service.ts`
2. Implement registration/unregistration methods
3. Implement `revealGroup()` with stagger timing
4. Implement `hideGroup()` for reversing reveals
5. Update `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\index.ts` with exports
6. Write unit tests

**Complexity:** LOW

### Phase 3: CinematicEntranceDirective (Estimated: 3 hours)

**Dependencies:** Phase 1 (for PreloadState integration)

**Tasks:**

1. Create `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
2. Implement interfaces: `CinematicEntranceConfig`, `EntrancePreset`
3. Implement preset values for all 4 presets
4. Implement `startEntrance()` with GSAP timeline
5. Implement OrbitControls coordination
6. Implement `prefersReducedMotion()` handling
7. Implement cleanup and lifecycle management
8. Update `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\index.ts` with exports
9. Write unit tests

**Complexity:** HIGH

### Phase 4: SceneRevealDirective (Estimated: 3 hours)

**Dependencies:** Phase 2 (for stagger group integration)

**Tasks:**

1. Create `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
2. Implement interfaces: `SceneRevealConfig`, `RevealAnimation`, `OriginalState`
3. Implement `captureOriginalState()` with material opacity handling
4. Implement `setHiddenState()` for each animation type
5. Implement `reveal()` with animations for each type
6. Implement `hide()` for reversing
7. Implement stagger group registration
8. Implement cleanup with state restoration
9. Update `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\index.ts` with exports
10. Write unit tests

**Complexity:** HIGH

### Phase 5: Demo Application Updates (Estimated: 2 hours)

**Dependencies:** Phases 1-4

**Tasks:**

1. Create demo section showcasing loading -> entrance -> reveal flow
2. Implement example with multiple assets and staggered reveals
3. Add UI for displaying loading progress
4. Test with WebGPU and WebGL backends
5. Verify 60 FPS performance on desktop

**Complexity:** MEDIUM

---

## 6. Testing Strategy

### 6.1 Unit Tests

**AssetPreloaderService Tests:**

```typescript
describe('AssetPreloaderService', () => {
  it('should aggregate progress from multiple assets', () => {});
  it('should set isReady to true when all assets load', () => {});
  it('should collect errors from failed assets', () => {});
  it('should handle cached assets immediately', () => {});
  it('should support cancel() to stop tracking', () => {});
  it('should handle empty asset array', () => {});
  it('should calculate weighted progress correctly', () => {});
});
```

**CinematicEntranceDirective Tests:**

```typescript
describe('CinematicEntranceDirective', () => {
  it('should start animation when preloadState isReady', () => {});
  it('should use preset values when no custom positions provided', () => {});
  it('should override preset with custom positions', () => {});
  it('should disable OrbitControls during animation', () => {});
  it('should re-enable OrbitControls and sync target after animation', () => {});
  it('should emit entranceComplete when animation finishes', () => {});
  it('should skip animation for prefers-reduced-motion', () => {});
  it('should cleanup GSAP timeline on destroy', () => {});
});
```

**SceneRevealDirective Tests:**

```typescript
describe('SceneRevealDirective', () => {
  it('should capture original state on init', () => {});
  it('should set object to hidden state based on animation type', () => {});
  it('should animate opacity for fade-in', () => {});
  it('should animate scale with overshoot for scale-pop', () => {});
  it('should animate position for rise-up', () => {});
  it('should restore original state on cleanup', () => {});
  it('should register with stagger group when configured', () => {});
  it('should skip animation for prefers-reduced-motion', () => {});
});
```

**StaggerGroupService Tests:**

```typescript
describe('StaggerGroupService', () => {
  it('should register directives with group and index', () => {});
  it('should unregister directives from group', () => {});
  it('should reveal group in stagger order', () => {});
  it('should apply stagger delay between items', () => {});
  it('should hide all items in group', () => {});
});
```

### 6.2 Integration Test Scenarios

1. **Full Loading-to-Reveal Flow:**

   - Load 3 assets (2 GLTF, 1 texture)
   - Verify progress signal updates correctly
   - Verify entrance animation triggers when isReady() is true
   - Verify stagger group reveals after entrance completes

2. **Error Handling:**

   - Attempt to load non-existent asset
   - Verify errors signal contains error
   - Verify entrance still triggers if other assets succeed

3. **OrbitControls Coordination:**

   - Verify controls disabled during entrance
   - Verify controls re-enabled after entrance
   - Verify target synced to final lookAt position

4. **Reduced Motion:**
   - Set prefers-reduced-motion: reduce
   - Verify entrance skips to end state
   - Verify reveal animations skip to end state

### 6.3 Demo Application Updates

**New Demo Section:** "Scene Loading & Cinematic Entrance"

Features to demonstrate:

- Loading progress bar (using preloadState.progress())
- Dolly-in entrance animation
- Staggered object reveals
- Toggle for reduced motion testing

---

## 7. Quality Requirements

### 7.1 Functional Requirements Verification

| Requirement               | Implementation                   | Verification                     |
| ------------------------- | -------------------------------- | -------------------------------- |
| FR-1.1 Asset Registration | AssetPreloaderService.preload()  | Unit test: progress aggregation  |
| FR-1.2 Signal-Based State | PreloadState interface           | Unit test: all signals reactive  |
| FR-1.3 Loader Integration | startAssetLoad() delegates       | Unit test: correct loader called |
| FR-2.1 Directive Config   | CinematicEntranceConfig          | Unit test: config parsing        |
| FR-2.2 Camera Animation   | GSAP timeline in startEntrance() | Integration test: camera moves   |
| FR-2.3 OrbitControls      | setOrbitControls() coordination  | Integration test: enabled toggle |
| FR-2.4 Presets            | getPresetValues()                | Unit test: preset values         |
| FR-3.1 Reveal Config      | SceneRevealConfig                | Unit test: config parsing        |
| FR-3.2 Animation Types    | animateFadeIn/ScalePop/RiseUp    | Unit test: each animation        |
| FR-3.3 Stagger Groups     | StaggerGroupService              | Unit test: stagger timing        |
| FR-4.1 Coordination       | effect() watching isReady()      | Integration test: full flow      |

### 7.2 Non-Functional Requirements Verification

| Requirement             | Implementation               | Verification                 |
| ----------------------- | ---------------------------- | ---------------------------- |
| NFR-1.1 Bundle Size     | Dynamic GSAP imports         | Measure: < 15KB gzipped      |
| NFR-1.2 Animation FPS   | onUpdate calls invalidate()  | Profile: 60 FPS desktop      |
| NFR-1.3 Memory          | cleanup() kills timelines    | Profile: no leaks            |
| NFR-2.1 Browser Support | WebGPU + WebGL tested        | E2E: Chrome, Firefox, Safari |
| NFR-3.1 Reduced Motion  | prefersReducedMotion() check | Manual test: skip animations |

---

## 8. Team-Leader Handoff

### 8.1 Developer Type Recommendation

**Recommended Developer:** `frontend-developer`

**Rationale:**

- All work is in `@hive-academy/angular-3d` library (Angular + Three.js)
- Requires Angular signals, directives, and services patterns
- Requires GSAP animation knowledge
- No backend/NestJS work involved
- No database or API integration

### 8.2 Complexity Assessment

**Overall Complexity:** HIGH

**Breakdown:**

- AssetPreloaderService: MEDIUM (signal aggregation, async coordination)
- StaggerGroupService: LOW (simple registry pattern)
- CinematicEntranceDirective: HIGH (camera animation, controls coordination)
- SceneRevealDirective: HIGH (material handling, state management)
- Demo Integration: MEDIUM (component composition)

**Estimated Total Effort:** 10-12 hours

### 8.3 Files Affected Summary

**CREATE (5 files):**

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\asset-preloader.service.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\cinematic-entrance.directive.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\scene-reveal.directive.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\stagger-group.service.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\loading-entrance-demo-section.component.ts`

**MODIFY (2 files):**

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\index.ts`
- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\index.ts`

### 8.4 Critical Verification Points

**Before Implementation, Developer Must Verify:**

1. **All imports exist in codebase:**

   - `GltfLoaderService` from `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\gltf-loader.service.ts:86`
   - `TextureLoaderService` from `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\loaders\texture-loader.service.ts:61`
   - `SceneService` from `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene.service.ts:55`
   - `SceneGraphStore` from `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\store\scene-graph.store.ts:111`
   - `OBJECT_ID` from `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\tokens\object-id.token.ts`
   - `OrbitControls` from `three-stdlib`

2. **All patterns verified from examples:**

   - Dynamic GSAP import: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\float-3d.directive.ts:158`
   - Signal-based configuration: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\float-3d.directive.ts:110`
   - DestroyRef cleanup: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\animation\float-3d.directive.ts:136`
   - SceneService invalidate: `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene.service.ts:200`

3. **Library documentation consulted:**

   - `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md`

4. **No hallucinated APIs:**
   - All decorators verified: `@Directive`, `@Injectable` (Angular standard)
   - All signals verified: `signal()`, `computed()`, `effect()` (Angular standard)
   - All Three.js APIs verified: `Vector3`, `Object3D`, `Material` (three/webgpu)
   - GSAP APIs verified: `gsap.timeline()`, `gsap.to()` (GSAP standard)

---

## Document Metadata

| Field      | Value                    |
| ---------- | ------------------------ |
| Task ID    | TASK_2026_006            |
| Created    | 2026-01-07               |
| Author     | Software Architect Agent |
| Status     | Architecture Complete    |
| Next Phase | Task Decomposition       |
| Next Agent | team-leader              |
