# Implementation Plan - TASK_2026_008

## Route-Level Scene Loading Coordinator

---

## 1. Architecture Overview

### 1.1 Problem Flow (Current vs Desired)

```
CURRENT FLOW (Black Screen Gap):
┌──────────────┐    ┌───────────────────────┐    ┌─────────────────┐    ┌────────────┐
│ Route Nav    │───>│ EMPTY BLACK SCREEN    │───>│ Preload Overlay │───>│ Entrance   │
│              │    │ (2-4 seconds)         │    │ Shows           │    │ Animation  │
└──────────────┘    └───────────────────────┘    └─────────────────┘    └────────────┘
                    ▲ WebGPU init + shaders
                    ▲ User sees freeze/emptiness

DESIRED FLOW (Seamless Loading):
┌──────────────┐    ┌───────────────────────┐    ┌─────────────────┐    ┌────────────┐
│ Route Nav    │───>│ LOADING UI VISIBLE    │───>│ Unified Loading │───>│ Entrance   │
│              │    │ (scene init phase)    │    │ (asset phase)   │    │ Animation  │
└──────────────┘    └───────────────────────┘    └─────────────────┘    └────────────┘
                    ▲ Shows immediately
                    ▲ Smooth progress throughout
```

### 1.2 Service Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                            ROUTE LAYER (Angular Router)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌──────────────────────┐     ┌─────────────────────────┐                       │
│  │ sceneLoadingGuard    │     │ scenePreloadResolver    │                       │
│  │ (CanActivateFn)      │     │ (ResolveFn)             │                       │
│  │                      │     │                         │                       │
│  │ - Waits for ready    │     │ - Returns PreloadState  │                       │
│  │ - Fail-open timeout  │     │ - Triggers preloading   │                       │
│  └─────────┬────────────┘     └───────────┬─────────────┘                       │
│            │                              │                                      │
│            │                              │ ActivatedRoute.data                  │
│            ▼                              ▼                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                            COMPONENT LAYER                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         LoadingOverlayComponent                          │   │
│  │  - Displays loading UI during all phases                                 │   │
│  │  - Accepts UnifiedLoadingState signals                                   │   │
│  │  - Smooth progress animation                                             │   │
│  │  - Fade-out on completion                                                │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                         Scene3dComponent                                 │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │              SceneLoadingDirective (a3dSceneLoading)            │   │   │
│  │   │  - Declarative loading coordination                             │   │   │
│  │   │  - Auto-configures SceneReadyService                            │   │   │
│  │   │  - Emits (sceneReady), (loadingProgress), (loadingComplete)     │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  │   ┌─────────────────────────────────────────────────────────────────┐   │   │
│  │   │              CinematicEntranceDirective (existing)              │   │   │
│  │   │  - Coordinates with loading via preloadState                    │   │   │
│  │   └─────────────────────────────────────────────────────────────────┘   │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                            SERVICE LAYER                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────┐   ┌─────────────────────────────────────┐ │
│  │ SceneReadyService               │   │ UnifiedLoadingCoordinator           │ │
│  │ (Per-scene scoped)              │   │ (Factory function pattern)          │ │
│  │                                 │   │                                     │ │
│  │ Signals:                        │   │ Factory:                            │ │
│  │ - rendererReady: Signal<bool>   │   │ - createUnifiedState(config)        │ │
│  │ - firstFrameRendered: Signal<>  │   │                                     │ │
│  │ - isSceneReady: computed<bool>  │   │ Returns UnifiedLoadingState:        │ │
│  │                                 │   │ - progress: Signal<number> (0-100)  │ │
│  │ Methods:                        │   │ - currentPhase: Signal<Phase>       │ │
│  │ - setRendererReady()            │   │ - isFullyReady: Signal<boolean>     │ │
│  │ - setFirstFrameRendered()       │   │ - errors: Signal<Error[]>           │ │
│  │                                 │   │                                     │ │
│  └───────────────┬─────────────────┘   └──────────────────┬──────────────────┘ │
│                  │                                        │                     │
│                  │      Observes (no control)             │                     │
│                  ▼                                        ▼                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      EXISTING SERVICES (TASK_2026_006)                   │   │
│  │                                                                          │   │
│  │  ┌──────────────────────┐  ┌──────────────────────┐  ┌────────────────┐ │   │
│  │  │ AssetPreloaderService│  │CinematicEntrance     │  │StaggerGroup    │ │   │
│  │  │                      │  │Directive             │  │Service         │ │   │
│  │  │ PreloadState:        │  │                      │  │                │ │   │
│  │  │ - progress: Signal   │  │ - entranceComplete   │  │ - revealGroup()│ │   │
│  │  │ - isReady: Signal    │  │ - autoStart          │  │ - hasGroup()   │ │   │
│  │  │ - errors: Signal     │  │ - preloadState       │  │                │ │   │
│  │  └──────────────────────┘  └──────────────────────┘  └────────────────┘ │   │
│  │                                                                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                         RENDER LAYER (Three.js)                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Scene3dComponent                                                                │
│  ├── afterNextRender() → initRendererAsync()                                    │
│  │   └── await renderer.init() ──────────────────────┐                          │
│  │       │                                           │                          │
│  │       ▼                                           ▼                          │
│  │   sceneService.setRenderer() ──────────► SceneReadyService.setRendererReady()│
│  │                                                                               │
│  └── renderer.setAnimationLoop()                                                │
│      └── renderLoop.tick()                                                      │
│          └── renderFn() [first call] ────────► SceneReadyService.setFirstFrame()│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Signal Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SIGNAL FLOW TIMELINE                               │
└─────────────────────────────────────────────────────────────────────────────┘

Time ─────────────────────────────────────────────────────────────────────────►

Phase 1: SCENE INIT (0-33% progress)
┌────────────────────────────────────────────────────────────────────────────┐
│ Scene3dComponent.afterNextRender()                                          │
│    │                                                                        │
│    ├─► WebGPURenderer.init() ──────────────────────────────────────────┐   │
│    │                                                                    │   │
│    │                           SceneReadyService                        ▼   │
│    │                              rendererReady: signal(false) ─► true      │
│    │                                                                        │
│    ├─► First renderer.render() call ───────────────────────────────────┐   │
│    │                                                                    │   │
│    │                           SceneReadyService                        ▼   │
│    │                              firstFrameRendered: signal(false) ─► true │
│    │                                                                        │
│    │                           SceneReadyService                            │
│    │                              isSceneReady: computed() ────────► true   │
│    │                                                                        │
└────┼────────────────────────────────────────────────────────────────────────┘
     │
     │  UnifiedLoadingCoordinator observes:
     │  ├─► currentPhase: 'scene-init' → 'asset-loading'
     │  └─► progress: 0-33 (scene init complete)
     │
     ▼
Phase 2: ASSET LOADING (34-66% progress)
┌────────────────────────────────────────────────────────────────────────────┐
│ AssetPreloaderService.preload([...])                                        │
│    │                                                                        │
│    ├─► PreloadState.progress: Signal<number> ─────► 0...50...100           │
│    │                                                                        │
│    │   UnifiedLoadingCoordinator observes:                                  │
│    │   └─► Maps preload 0-100 to unified 34-66                              │
│    │                                                                        │
│    └─► PreloadState.isReady: Signal<boolean> ─────► true                   │
│                                                                             │
└────┼────────────────────────────────────────────────────────────────────────┘
     │
     │  UnifiedLoadingCoordinator:
     │  ├─► currentPhase: 'asset-loading' → 'entrance-prep'
     │  └─► progress: 66 (assets complete)
     │
     ▼
Phase 3: ENTRANCE PREP (67-99% progress)
┌────────────────────────────────────────────────────────────────────────────┐
│ CinematicEntranceDirective                                                  │
│    │                                                                        │
│    ├─► Waits for preloadState.isReady() ─────────────────────────► start() │
│    │                                                                        │
│    │   UnifiedLoadingCoordinator observes:                                  │
│    │   └─► entranceStarted signal → progress jumps to 99                    │
│    │                                                                        │
│    └─► entranceComplete output ──────────────────────────────► emit()       │
│                                                                             │
└────┼────────────────────────────────────────────────────────────────────────┘
     │
     │  UnifiedLoadingCoordinator:
     │  ├─► currentPhase: 'entrance-prep' → 'ready'
     │  ├─► progress: 100
     │  └─► isFullyReady: true
     │
     ▼
Phase 4: READY (100% progress)
┌────────────────────────────────────────────────────────────────────────────┐
│ LoadingOverlayComponent                                                     │
│    │                                                                        │
│    └─► Fades out (GSAP animation) ─────────────────────────► hidden        │
│                                                                             │
│ Scene content fully interactive                                             │
└────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 File Structure

```
libs/angular-3d/src/lib/
├── loading/                                    # NEW - Route-level loading module
│   ├── index.ts                               # Module exports
│   ├── scene-ready.service.ts                 # Scene initialization detection
│   ├── unified-loading-coordinator.ts         # Multi-phase progress aggregation
│   ├── loading-overlay.component.ts           # Pre-built loading UI
│   ├── scene-loading.directive.ts             # Declarative directive
│   ├── guards/
│   │   └── scene-loading.guard.ts             # CanActivateFn guard
│   ├── resolvers/
│   │   └── scene-preload.resolver.ts          # ResolveFn resolver
│   └── types.ts                               # Shared types and interfaces
└── canvas/
    └── scene-3d.component.ts                  # MODIFY - Add ready state hooks
```

---

## 2. Component Specifications

### 2.1 SceneReadyService

**Purpose**: Detect when a Three.js scene is fully initialized (WebGPU ready, renderer created, first frame rendered).

**Location**: `libs/angular-3d/src/lib/loading/scene-ready.service.ts`

**Pattern Evidence**:

- SceneService pattern: `libs/angular-3d/src/lib/canvas/scene.service.ts` (per-scene scoped, signal-based)
- Injectable without providedIn: `scene.service.ts:54`

**Responsibilities**:

- Track renderer initialization state
- Track first frame rendered state
- Provide computed isSceneReady signal combining both conditions
- Per-scene isolation (each Scene3dComponent gets its own instance)

**Implementation Pattern**:

```typescript
// Pattern source: libs/angular-3d/src/lib/canvas/scene.service.ts:54-63
// Verified: Injectable without providedIn for per-scene scoping
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable()
export class SceneReadyService {
  // Writable signals for internal updates (pattern: scene.service.ts:60-64)
  private readonly _rendererReady = signal<boolean>(false);
  private readonly _firstFrameRendered = signal<boolean>(false);

  // Public readonly signals (pattern: scene.service.ts:66-68)
  public readonly rendererReady = this._rendererReady.asReadonly();
  public readonly firstFrameRendered = this._firstFrameRendered.asReadonly();

  // Computed signal for combined ready state
  public readonly isSceneReady = computed(() => this._rendererReady() && this._firstFrameRendered());

  // Methods called by Scene3dComponent hooks
  public setRendererReady(): void {
    this._rendererReady.set(true);
  }

  public setFirstFrameRendered(): void {
    this._firstFrameRendered.set(true);
  }

  // Reset for replay scenarios
  public reset(): void {
    this._rendererReady.set(false);
    this._firstFrameRendered.set(false);
  }

  // Cleanup (pattern: scene.service.ts:207-212)
  public clear(): void {
    this.reset();
  }
}
```

**Quality Requirements**:

- Must add less than 5ms to scene initialization time
- Must support multiple isolated instances (per-scene)
- Must work with both WebGPU and WebGL backends

**Files Affected**:

- `libs/angular-3d/src/lib/loading/scene-ready.service.ts` (CREATE)
- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` (MODIFY - add providers, call setters)

---

### 2.2 UnifiedLoadingCoordinator

**Purpose**: Combine scene initialization, asset preloading, and entrance readiness into a unified loading state.

**Location**: `libs/angular-3d/src/lib/loading/unified-loading-coordinator.ts`

**Pattern Evidence**:

- Factory function pattern from AssetPreloaderService: `libs/angular-3d/src/lib/loaders/asset-preloader.service.ts:152-239`
- Signal-based state object pattern: `asset-preloader.service.ts:72-85` (PreloadState interface)

**Responsibilities**:

- Accept configuration with optional signals for each phase
- Compute unified progress (0-100) across all phases
- Track current phase for phase-specific UI
- Aggregate errors from all phases
- Expose isFullyReady computed signal

**Implementation Pattern**:

```typescript
// Types (pattern: asset-preloader.service.ts:72-85)
export type LoadingPhase = 'scene-init' | 'asset-loading' | 'entrance-prep' | 'ready';

export interface UnifiedLoadingConfig {
  /** Signal indicating scene is ready (from SceneReadyService) */
  sceneReady?: Signal<boolean>;
  /** Optional PreloadState from AssetPreloaderService */
  preloadState?: PreloadState;
  /** Optional signal indicating entrance animation started */
  entranceStarted?: Signal<boolean>;
  /** Skip entrance phase entirely (for scenes without entrance animations) */
  skipEntrance?: boolean;
}

export interface UnifiedLoadingState {
  /** Combined progress across all phases (0-100) */
  readonly progress: Signal<number>;
  /** Current loading phase */
  readonly currentPhase: Signal<LoadingPhase>;
  /** True when all phases complete */
  readonly isFullyReady: Signal<boolean>;
  /** Aggregated errors from all phases */
  readonly errors: Signal<Error[]>;
}

// Factory function (pattern: not a service - just a function that creates signals)
export function createUnifiedLoadingState(config: UnifiedLoadingConfig): UnifiedLoadingState {
  // Phase weights for progress calculation
  const SCENE_INIT_WEIGHT = config.preloadState ? 33 : config.skipEntrance ? 100 : 50;
  const ASSET_LOADING_WEIGHT = config.preloadState ? 33 : 0;
  const ENTRANCE_PREP_WEIGHT = config.skipEntrance ? 0 : config.preloadState ? 34 : 50;

  // Computed: current phase
  const currentPhase = computed<LoadingPhase>(() => {
    const sceneReady = config.sceneReady?.() ?? true;
    const assetsReady = config.preloadState?.isReady() ?? true;
    const entranceStarted = config.entranceStarted?.() ?? config.skipEntrance ?? true;

    if (!sceneReady) return 'scene-init';
    if (!assetsReady) return 'asset-loading';
    if (!entranceStarted) return 'entrance-prep';
    return 'ready';
  });

  // Computed: unified progress
  const progress = computed(() => {
    const phase = currentPhase();

    if (phase === 'ready') return 100;

    if (phase === 'scene-init') {
      // Scene init phase: 0 to SCENE_INIT_WEIGHT
      // Since we don't have granular progress for init, use 0 until ready
      return 0;
    }

    if (phase === 'asset-loading') {
      // Asset loading: SCENE_INIT_WEIGHT to (SCENE_INIT_WEIGHT + ASSET_LOADING_WEIGHT)
      const assetProgress = config.preloadState?.progress() ?? 100;
      const phaseProgress = (assetProgress / 100) * ASSET_LOADING_WEIGHT;
      return Math.round(SCENE_INIT_WEIGHT + phaseProgress);
    }

    if (phase === 'entrance-prep') {
      // Entrance prep: waiting for entrance to start
      return SCENE_INIT_WEIGHT + ASSET_LOADING_WEIGHT;
    }

    return 0;
  });

  // Computed: fully ready
  const isFullyReady = computed(() => currentPhase() === 'ready');

  // Computed: aggregated errors
  const errors = computed(() => {
    return config.preloadState?.errors() ?? [];
  });

  return {
    progress,
    currentPhase,
    isFullyReady,
    errors,
  };
}
```

**Quality Requirements**:

- Progress signal updates throttled to max 60/second
- Must handle missing phases gracefully (skip if not configured)
- Must work without any phases configured (return immediately ready)

**Files Affected**:

- `libs/angular-3d/src/lib/loading/unified-loading-coordinator.ts` (CREATE)

---

### 2.3 sceneLoadingGuard (CanActivateFn)

**Purpose**: Prevent route activation until scene is ready to render.

**Location**: `libs/angular-3d/src/lib/loading/guards/scene-loading.guard.ts`

**Pattern Evidence**:

- Angular functional guards: https://angular.dev/guide/routing/data-resolvers (verified via MCP)
- inject() pattern: `libs/angular-3d/src/lib/loaders/inject-gltf-loader.ts`

**Responsibilities**:

- Wait for scene ready signal or timeout
- Fail-open on timeout (allow navigation, log warning)
- Support configurable timeout threshold
- Work with lazy-loaded routes

**Implementation Pattern**:

````typescript
// Pattern: Angular functional guards (from Angular docs)
import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

export interface SceneLoadingGuardConfig {
  /** Timeout in milliseconds before allowing navigation anyway (default: 10000) */
  timeout?: number;
  /** Custom scene ready signal to wait for */
  readySignal?: () => Signal<boolean>;
}

/**
 * Functional route guard that waits for scene readiness.
 *
 * Usage:
 * ```typescript
 * const routes: Routes = [
 *   {
 *     path: 'scene',
 *     loadComponent: () => import('./scene.component'),
 *     canActivate: [sceneLoadingGuard({ timeout: 8000 })]
 *   }
 * ];
 * ```
 */
export function sceneLoadingGuard(config: SceneLoadingGuardConfig = {}): CanActivateFn {
  return () => {
    const timeoutMs = config.timeout ?? 10000;

    // If custom ready signal provided, wait for it
    if (config.readySignal) {
      const readySignal = config.readySignal();

      // Convert signal to observable and wait for true
      return toObservable(readySignal).pipe(
        filter((ready) => ready === true),
        take(1),
        timeout(timeoutMs),
        catchError(() => {
          console.warn(`[sceneLoadingGuard] Timeout after ${timeoutMs}ms - allowing navigation anyway (fail-open)`);
          return of(true);
        })
      );
    }

    // No ready signal - allow navigation immediately
    return of(true);
  };
}
````

**Quality Requirements**:

- Must fail-open (never block navigation indefinitely)
- Must not block Angular change detection
- Must work with loadComponent() lazy loading
- Must be composable with other guards

**Files Affected**:

- `libs/angular-3d/src/lib/loading/guards/scene-loading.guard.ts` (CREATE)

---

### 2.4 scenePreloadResolver (ResolveFn)

**Purpose**: Trigger asset preloading before route activation and provide PreloadState via route data.

**Location**: `libs/angular-3d/src/lib/loading/resolvers/scene-preload.resolver.ts`

**Pattern Evidence**:

- Angular functional resolvers: https://angular.dev/guide/routing/data-resolvers (verified via MCP)
- AssetPreloaderService usage: `libs/angular-3d/src/lib/loaders/asset-preloader.service.ts:152`

**Responsibilities**:

- Accept asset list or factory function for route-based assets
- Trigger AssetPreloaderService.preload() before component init
- Return PreloadState for component access via ActivatedRoute.data
- Cleanup on navigation cancellation

**Implementation Pattern**:

````typescript
// Pattern: Angular functional resolvers (from Angular docs)
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AssetPreloaderService, AssetDefinition, PreloadState } from '../../loaders';

export type AssetListFactory = (route: ActivatedRouteSnapshot) => AssetDefinition[];

/**
 * Functional route resolver that preloads assets before route activation.
 *
 * Usage:
 * ```typescript
 * const routes: Routes = [
 *   {
 *     path: 'scene/:id',
 *     loadComponent: () => import('./scene.component'),
 *     resolve: {
 *       preloadState: scenePreloadResolver([
 *         { url: '/assets/model.glb', type: 'gltf' }
 *       ])
 *     }
 *   }
 * ];
 *
 * // With dynamic assets based on route params
 * const routes: Routes = [
 *   {
 *     path: 'scene/:id',
 *     resolve: {
 *       preloadState: scenePreloadResolver((route) => [
 *         { url: `/assets/scene-${route.paramMap.get('id')}.glb`, type: 'gltf' }
 *       ])
 *     }
 *   }
 * ];
 * ```
 */
export function scenePreloadResolver(assetsOrFactory: AssetDefinition[] | AssetListFactory): ResolveFn<PreloadState> {
  return (route: ActivatedRouteSnapshot) => {
    const preloader = inject(AssetPreloaderService);

    // Determine assets to load
    const assets = typeof assetsOrFactory === 'function' ? assetsOrFactory(route) : assetsOrFactory;

    // Start preloading and return the state object
    // Component will receive this via ActivatedRoute.data['preloadState']
    return preloader.preload(assets);
  };
}
````

**Quality Requirements**:

- Must start preloading before component initialization
- Must support both static and dynamic asset lists
- Must handle empty asset arrays (return immediately ready state)

**Files Affected**:

- `libs/angular-3d/src/lib/loading/resolvers/scene-preload.resolver.ts` (CREATE)

---

### 2.5 LoadingOverlayComponent

**Purpose**: Pre-built loading overlay that displays during scene initialization with smooth progress animation.

**Location**: `libs/angular-3d/src/lib/loading/loading-overlay.component.ts`

**Pattern Evidence**:

- Component pattern: `libs/angular-3d/src/lib/primitives/geometry/box.component.ts`
- Signal inputs: `input<T>()` pattern from codebase

**Responsibilities**:

- Display loading indicator during scene initialization
- Accept UnifiedLoadingState signals or individual signals
- Animate progress changes smoothly (no jumping)
- Fade out on completion with configurable duration
- Support full-screen or container positioning
- CSS custom properties for theming
- Accessibility (aria-live, reduced motion)

**Implementation Pattern**:

```typescript
@Component({
  selector: 'a3d-loading-overlay',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.a3d-loading-overlay--visible]': '!isHidden()',
    '[class.a3d-loading-overlay--fullscreen]': 'fullscreen()',
    '[attr.aria-busy]': '!isFullyReady()',
    '[attr.aria-live]': '"polite"',
    role: 'status',
  },
  template: `
    <div class="a3d-loading-overlay__backdrop">
      <div class="a3d-loading-overlay__content">
        <!-- Default loading indicator (can be replaced via projection) -->
        <ng-content select="[loading-indicator]">
          <div class="a3d-loading-overlay__spinner"></div>
        </ng-content>

        <!-- Progress display -->
        @if (showProgress()) {
        <div class="a3d-loading-overlay__progress">
          <div class="a3d-loading-overlay__progress-bar" [style.width.%]="smoothProgress()"></div>
        </div>
        <div class="a3d-loading-overlay__progress-text">{{ smoothProgress() }}%</div>
        }

        <!-- Phase text -->
        @if (showPhase()) {
        <div class="a3d-loading-overlay__phase">
          {{ phaseText() }}
        </div>
        }

        <!-- Custom content projection -->
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        /* CSS Custom Properties for theming */
        --a3d-loading-bg: rgba(0, 0, 0, 0.9);
        --a3d-loading-text: #ffffff;
        --a3d-loading-accent: #3b82f6;
        --a3d-loading-font: system-ui, sans-serif;

        display: block;
        position: absolute;
        inset: 0;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity var(--a3d-loading-fade-duration, 400ms) ease-out;
      }

      :host(.a3d-loading-overlay--visible) {
        pointer-events: auto;
        opacity: 1;
      }

      :host(.a3d-loading-overlay--fullscreen) {
        position: fixed;
      }

      .a3d-loading-overlay__backdrop {
        width: 100%;
        height: 100%;
        background: var(--a3d-loading-bg);
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .a3d-loading-overlay__content {
        text-align: center;
        color: var(--a3d-loading-text);
        font-family: var(--a3d-loading-font);
      }

      .a3d-loading-overlay__spinner {
        width: 48px;
        height: 48px;
        border: 3px solid transparent;
        border-top-color: var(--a3d-loading-accent);
        border-radius: 50%;
        animation: a3d-spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes a3d-spin {
        to {
          transform: rotate(360deg);
        }
      }

      .a3d-loading-overlay__progress {
        width: 200px;
        height: 4px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 2px;
        overflow: hidden;
        margin: 16px auto;
      }

      .a3d-loading-overlay__progress-bar {
        height: 100%;
        background: var(--a3d-loading-accent);
        transition: width 150ms ease-out;
      }

      .a3d-loading-overlay__progress-text {
        font-size: 14px;
        opacity: 0.8;
      }

      .a3d-loading-overlay__phase {
        font-size: 12px;
        opacity: 0.6;
        margin-top: 8px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        :host {
          transition: none;
        }
        .a3d-loading-overlay__spinner {
          animation: none;
          border: 3px solid var(--a3d-loading-accent);
        }
        .a3d-loading-overlay__progress-bar {
          transition: none;
        }
      }
    `,
  ],
})
export class LoadingOverlayComponent {
  // Inputs
  readonly loadingState = input<UnifiedLoadingState | undefined>(undefined);
  readonly progress = input<Signal<number> | undefined>(undefined);
  readonly isReady = input<Signal<boolean> | undefined>(undefined);
  readonly phase = input<Signal<LoadingPhase> | undefined>(undefined);
  readonly fullscreen = input<boolean>(false);
  readonly showProgress = input<boolean>(true);
  readonly showPhase = input<boolean>(true);
  readonly fadeOutDuration = input<number>(400);

  // Internal state
  private readonly _isHidden = signal(false);
  readonly isHidden = this._isHidden.asReadonly();

  // Computed: actual progress value
  readonly actualProgress = computed(() => {
    const state = this.loadingState();
    if (state) return state.progress();
    const progressSignal = this.progress();
    if (progressSignal) return progressSignal();
    return 0;
  });

  // Computed: smoothed progress for animation
  readonly smoothProgress = computed(() => {
    // Could add easing/interpolation here
    return this.actualProgress();
  });

  // Computed: is fully ready
  readonly isFullyReady = computed(() => {
    const state = this.loadingState();
    if (state) return state.isFullyReady();
    const readySignal = this.isReady();
    if (readySignal) return readySignal();
    return this.actualProgress() >= 100;
  });

  // Computed: current phase
  readonly currentPhase = computed(() => {
    const state = this.loadingState();
    if (state) return state.currentPhase();
    const phaseSignal = this.phase();
    if (phaseSignal) return phaseSignal();
    return 'scene-init' as LoadingPhase;
  });

  // Computed: phase display text
  readonly phaseText = computed(() => {
    const phase = this.currentPhase();
    switch (phase) {
      case 'scene-init':
        return 'Initializing Scene';
      case 'asset-loading':
        return 'Loading Assets';
      case 'entrance-prep':
        return 'Preparing Entrance';
      case 'ready':
        return 'Ready';
      default:
        return 'Loading';
    }
  });

  constructor() {
    // Effect: hide overlay when ready (with fade animation)
    effect(() => {
      if (this.isFullyReady()) {
        // Delay hiding until fade animation completes
        setTimeout(() => {
          this._isHidden.set(true);
        }, this.fadeOutDuration());
      }
    });
  }
}
```

**Quality Requirements**:

- Progress updates animate smoothly (CSS transition)
- Respects prefers-reduced-motion media query
- aria-live for screen reader support
- Works in SSR (static loading state)
- CSS custom properties for easy theming

**Files Affected**:

- `libs/angular-3d/src/lib/loading/loading-overlay.component.ts` (CREATE)

---

### 2.6 SceneLoadingDirective

**Purpose**: Declarative directive that adds loading coordination to Scene3dComponent without service integration code.

**Location**: `libs/angular-3d/src/lib/loading/scene-loading.directive.ts`

**Pattern Evidence**:

- Directive pattern: `libs/angular-3d/src/lib/directives/animation/cinematic-entrance.directive.ts`
- Signal inputs/outputs: `cinematic-entrance.directive.ts:225-241`

**Responsibilities**:

- Auto-configure SceneReadyService detection
- Accept loadingConfig for assets, overlay settings
- Emit sceneReady, loadingProgress, loadingComplete outputs
- Coordinate with CinematicEntranceDirective if present
- Minimal configuration for basic usage

**Implementation Pattern**:

```typescript
// Pattern: cinematic-entrance.directive.ts:202-206
@Directive({
  selector: '[a3dSceneLoading]',
  standalone: true,
})
export class SceneLoadingDirective {
  // Dependency injection (pattern: cinematic-entrance.directive.ts:212-215)
  private readonly sceneReadyService = inject(SceneReadyService, { optional: true });
  private readonly preloader = inject(AssetPreloaderService);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs (pattern: cinematic-entrance.directive.ts:225)
  readonly loadingConfig = input<SceneLoadingConfig | undefined>(undefined);

  // Outputs (pattern: cinematic-entrance.directive.ts:233-244)
  readonly sceneReady = output<void>();
  readonly loadingProgress = output<number>();
  readonly loadingComplete = output<void>();

  // Internal state
  private preloadState: PreloadState | null = null;
  private unifiedState: UnifiedLoadingState | null = null;

  constructor() {
    // Effect: setup loading coordination when config changes
    effect(() => {
      const config = this.loadingConfig();
      this.setupLoading(config);
    });

    // Effect: emit progress updates
    effect(() => {
      if (this.unifiedState) {
        this.loadingProgress.emit(this.unifiedState.progress());
      }
    });

    // Effect: emit ready events
    effect(() => {
      if (this.sceneReadyService?.isSceneReady()) {
        this.sceneReady.emit();
      }
    });

    // Effect: emit complete event
    effect(() => {
      if (this.unifiedState?.isFullyReady()) {
        this.loadingComplete.emit();
      }
    });

    // Cleanup (pattern: cinematic-entrance.directive.ts:324-328)
    this.destroyRef.onDestroy(() => {
      this.preloadState?.cancel();
    });
  }

  private setupLoading(config?: SceneLoadingConfig): void {
    // Start preloading if assets configured
    if (config?.assets && config.assets.length > 0) {
      this.preloadState = this.preloader.preload(config.assets);
    }

    // Create unified loading state
    this.unifiedState = createUnifiedLoadingState({
      sceneReady: this.sceneReadyService?.isSceneReady,
      preloadState: this.preloadState ?? undefined,
      skipEntrance: config?.skipEntrance ?? false,
    });
  }

  // Public API: get unified loading state for template binding
  getLoadingState(): UnifiedLoadingState | null {
    return this.unifiedState;
  }

  // Public API: get preload state for CinematicEntranceDirective integration
  getPreloadState(): PreloadState | null {
    return this.preloadState;
  }
}

export interface SceneLoadingConfig {
  /** Assets to preload */
  assets?: AssetDefinition[];
  /** Show built-in overlay (default: false - user provides their own) */
  showOverlay?: boolean;
  /** Overlay configuration */
  overlayConfig?: {
    fullscreen?: boolean;
    showProgress?: boolean;
    showPhase?: boolean;
    fadeOutDuration?: number;
  };
  /** Skip entrance phase (for scenes without CinematicEntranceDirective) */
  skipEntrance?: boolean;
  /** Timeout for scene initialization */
  timeout?: number;
}
```

**Quality Requirements**:

- Minimal configuration for basic case: `<a3d-scene-3d a3dSceneLoading>`
- Coordinates automatically with CinematicEntranceDirective
- Tree-shakable (no side effects on import)

**Files Affected**:

- `libs/angular-3d/src/lib/loading/scene-loading.directive.ts` (CREATE)

---

## 3. Integration Strategy

### 3.1 Scene3dComponent Modification (Minimal Changes)

**Goal**: Add SceneReadyService to providers and call setters at key lifecycle points.

**Pattern Evidence**:

- Provider pattern: `scene-3d.component.ts:84-95`
- Init sequence: `scene-3d.component.ts:237-297`

**Changes Required**:

```typescript
// In Scene3dComponent providers array (line 84-95):
providers: [
  SceneService,
  RenderLoopService,
  SceneGraphStore,
  ViewportPositioningService,
  EffectComposerService,
  AdvancedPerformanceOptimizerService,
  SceneReadyService, // ADD: Per-scene ready state tracking
  {
    provide: NG_3D_PARENT,
    useFactory: (sceneService: SceneService) => () => sceneService.scene(),
    deps: [SceneService],
  },
],

// In constructor, inject SceneReadyService:
private readonly sceneReadyService = inject(SceneReadyService);

// In afterNextRender(), after successful init (around line 280):
// After: this.rendererInitialized = true;
this.sceneReadyService.setRendererReady();

// Track first frame in render function (around line 267-269):
// One-time flag for first frame detection
private firstFrameRendered = false;

// In setRenderFunction callback:
this.renderLoop.setRenderFunction(() => {
  this.renderer.render(this.scene, this.camera);

  // Track first frame for loading coordination
  if (!this.firstFrameRendered) {
    this.firstFrameRendered = true;
    this.sceneReadyService.setFirstFrameRendered();
  }
});
```

**Impact Analysis**:

- Adds 1 provider (SceneReadyService)
- Adds 1 injection (sceneReadyService)
- Adds 2 method calls (setRendererReady, setFirstFrameRendered)
- No API changes to Scene3dComponent

### 3.2 CinematicEntranceDirective Coordination

**Goal**: LoadingOverlay should remain visible until CinematicEntranceDirective starts its animation.

**Pattern Evidence**:

- CinematicEntranceDirective already accepts preloadState: `cinematic-entrance.directive.ts:174`
- Emits entranceStart output: `cinematic-entrance.directive.ts:234`

**Coordination Strategy**:

1. UnifiedLoadingCoordinator observes CinematicEntranceDirective's entranceStart signal
2. When entrance starts, unified progress jumps to 99%
3. LoadingOverlay begins fade-out
4. CinematicEntranceDirective's animation plays over the fading overlay

**No changes required to CinematicEntranceDirective** - it already:

- Accepts preloadState for waiting on assets
- Emits entranceStart when animation begins
- Coordinates with OrbitControls

### 3.3 RenderLoopService Integration

**Goal**: Detect first frame rendered for SceneReadyService.

**Pattern Evidence**:

- tick() method: `render-loop.service.ts:254-295`
- Frame callback pattern: `render-loop.service.ts:272-278`

**Coordination Strategy**:
First frame detection will be done in Scene3dComponent (see 3.1) rather than modifying RenderLoopService. This is simpler and keeps the first-frame logic close to the scene initialization code.

### 3.4 Export Strategy

**Module Index** (`libs/angular-3d/src/lib/loading/index.ts`):

```typescript
// Scene Ready Detection
export { SceneReadyService } from './scene-ready.service';

// Unified Loading Coordination
export { createUnifiedLoadingState, type UnifiedLoadingConfig, type UnifiedLoadingState, type LoadingPhase } from './unified-loading-coordinator';

// Route Guards
export { sceneLoadingGuard, type SceneLoadingGuardConfig } from './guards/scene-loading.guard';

// Route Resolvers
export { scenePreloadResolver, type AssetListFactory } from './resolvers/scene-preload.resolver';

// Components
export { LoadingOverlayComponent } from './loading-overlay.component';

// Directives
export { SceneLoadingDirective, type SceneLoadingConfig } from './scene-loading.directive';
```

**Main Index Update** (`libs/angular-3d/src/index.ts`):

```typescript
// Add at end:
// Loading - Route-level loading coordination
export * from './lib/loading';
```

---

## 4. Implementation Phases

### Phase 1: Core Services (Batch 1)

**Goal**: Implement SceneReadyService and integrate with Scene3dComponent

**Tasks**:

1. Create `libs/angular-3d/src/lib/loading/` directory structure
2. Implement `scene-ready.service.ts`
3. Implement `types.ts` with shared interfaces
4. Modify `scene-3d.component.ts` to provide and use SceneReadyService
5. Create basic `index.ts` exports
6. Write unit tests for SceneReadyService

**Dependencies**: None (foundation layer)

**Files**:

- CREATE: `libs/angular-3d/src/lib/loading/scene-ready.service.ts`
- CREATE: `libs/angular-3d/src/lib/loading/types.ts`
- CREATE: `libs/angular-3d/src/lib/loading/index.ts`
- MODIFY: `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`
- MODIFY: `libs/angular-3d/src/index.ts`

**Verification**: Unit test that SceneReadyService signals update correctly

### Phase 2: Unified Coordinator (Batch 2)

**Goal**: Implement unified loading state aggregation

**Tasks**:

1. Implement `unified-loading-coordinator.ts` with factory function
2. Write unit tests for progress calculation
3. Test phase transitions
4. Verify error aggregation

**Dependencies**: Phase 1 (SceneReadyService)

**Files**:

- CREATE: `libs/angular-3d/src/lib/loading/unified-loading-coordinator.ts`
- MODIFY: `libs/angular-3d/src/lib/loading/index.ts`

**Verification**: Unit tests for all phase transitions and progress calculations

### Phase 3: Route Integration (Batch 3)

**Goal**: Implement Angular Router guard and resolver

**Tasks**:

1. Create `guards/` directory
2. Implement `scene-loading.guard.ts`
3. Create `resolvers/` directory
4. Implement `scene-preload.resolver.ts`
5. Write unit tests
6. Update exports

**Dependencies**: Phase 1 (SceneReadyService), Phase 2 (for unified state in guard)

**Files**:

- CREATE: `libs/angular-3d/src/lib/loading/guards/scene-loading.guard.ts`
- CREATE: `libs/angular-3d/src/lib/loading/resolvers/scene-preload.resolver.ts`
- MODIFY: `libs/angular-3d/src/lib/loading/index.ts`

**Verification**: Integration tests with Angular Router

### Phase 4: UI Components (Batch 4)

**Goal**: Implement LoadingOverlayComponent and SceneLoadingDirective

**Tasks**:

1. Implement `loading-overlay.component.ts`
2. Implement `scene-loading.directive.ts`
3. Write unit tests
4. Test accessibility (aria-live, reduced motion)
5. Update exports

**Dependencies**: Phase 1 (SceneReadyService), Phase 2 (UnifiedLoadingState)

**Files**:

- CREATE: `libs/angular-3d/src/lib/loading/loading-overlay.component.ts`
- CREATE: `libs/angular-3d/src/lib/loading/scene-loading.directive.ts`
- MODIFY: `libs/angular-3d/src/lib/loading/index.ts`

**Verification**: Visual tests, accessibility audit

### Phase 5: Demo Integration (Batch 5)

**Goal**: Integrate loading coordinator into demo app

**Tasks**:

1. Update demo app routes with guards/resolvers (optional demo)
2. Add LoadingOverlayComponent to home page
3. Configure SceneLoadingDirective on hero scene
4. Test full loading flow
5. Verify no black screen

**Dependencies**: All previous phases

**Files**:

- MODIFY: `apps/angular-3d-demo/src/app/app.routes.ts` (optional)
- MODIFY: `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`

**Verification**: Visual regression test confirming no black screen

---

## 5. Testing Strategy

### Unit Tests

| Component                 | Test Coverage                                              |
| ------------------------- | ---------------------------------------------------------- |
| SceneReadyService         | Signal state transitions, reset, cleanup                   |
| createUnifiedLoadingState | Progress calculation, phase transitions, error aggregation |
| sceneLoadingGuard         | Timeout behavior, fail-open, signal waiting                |
| scenePreloadResolver      | Asset list resolution, factory function support            |
| LoadingOverlayComponent   | Signal binding, accessibility attributes                   |
| SceneLoadingDirective     | Config parsing, output emissions                           |

### Integration Tests

| Scenario              | Test                                   |
| --------------------- | -------------------------------------- |
| Scene init to ready   | SceneReadyService + Scene3dComponent   |
| Full loading flow     | Route navigation with guard + resolver |
| Entrance coordination | LoadingOverlay + CinematicEntrance     |

### E2E Tests

| Scenario          | Test                                                    |
| ----------------- | ------------------------------------------------------- |
| No black screen   | Navigate to home, verify loading UI visible immediately |
| Progress accuracy | Verify progress updates during loading                  |
| Fade transition   | Verify smooth overlay fade-out                          |

---

## 6. Quality Requirements

### Performance

- Scene init detection: < 5ms overhead
- Memory: < 100KB additional
- Bundle size: < 8KB gzipped
- Signal updates: throttled to 60/sec

### Reliability

- Fail-open: All timeouts allow navigation
- Error recovery: One phase error doesn't block others
- SSR: Components render static loading state

### Accessibility

- aria-live="polite" on loading overlay
- prefers-reduced-motion respected
- Focus management on overlay close

### Developer Experience

- Tree-shakable exports
- Complete TypeScript types
- JSDoc on all public APIs
- Helpful error messages

---

## 7. Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. Angular-specific patterns (signals, directives, guards, resolvers)
2. Component styling with CSS custom properties
3. Browser APIs (IntersectionObserver integration, media queries)
4. UI/UX considerations (progress animation, accessibility)

### Complexity Assessment

**Complexity**: MEDIUM-HIGH
**Estimated Effort**: 16-24 hours

**Breakdown**:

- Phase 1 (Core Services): 4-5 hours
- Phase 2 (Coordinator): 3-4 hours
- Phase 3 (Route Integration): 4-5 hours
- Phase 4 (UI Components): 4-6 hours
- Phase 5 (Demo Integration): 2-4 hours

### Files Affected Summary

**CREATE**:

- `libs/angular-3d/src/lib/loading/scene-ready.service.ts`
- `libs/angular-3d/src/lib/loading/unified-loading-coordinator.ts`
- `libs/angular-3d/src/lib/loading/types.ts`
- `libs/angular-3d/src/lib/loading/index.ts`
- `libs/angular-3d/src/lib/loading/guards/scene-loading.guard.ts`
- `libs/angular-3d/src/lib/loading/resolvers/scene-preload.resolver.ts`
- `libs/angular-3d/src/lib/loading/loading-overlay.component.ts`
- `libs/angular-3d/src/lib/loading/scene-loading.directive.ts`

**MODIFY**:

- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`
- `libs/angular-3d/src/index.ts`
- `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **All imports exist in codebase**:

   - `signal`, `computed`, `inject`, `effect` from `@angular/core`
   - `CanActivateFn`, `ResolveFn` from `@angular/router`
   - `toObservable` from `@angular/core/rxjs-interop`
   - `AssetPreloaderService`, `PreloadState` from existing loaders

2. **All patterns verified from examples**:

   - Injectable without providedIn: `scene.service.ts:54`
   - Signal-based state: `scene.service.ts:60-68`
   - Directive pattern: `cinematic-entrance.directive.ts:202-206`
   - Provider pattern: `scene-3d.component.ts:84-95`

3. **Library documentation consulted**:

   - `libs/angular-3d/CLAUDE.md` - Component patterns, cleanup

4. **No hallucinated APIs**:
   - All decorators verified in Angular core
   - All Signal APIs verified in Angular signals
   - All Router APIs verified in Angular router

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended
- [x] Complexity assessed
- [x] Implementation phases defined for team-leader decomposition
