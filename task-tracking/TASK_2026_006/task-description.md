# Requirements Document - TASK_2026_006

## Scene Loading & Cinematic Entrance Animation System

---

## Introduction

This task delivers a professional scene loading and cinematic entrance animation system for the `@hive-academy/angular-3d` library. The system enables developers to create premium 3D web experiences with orchestrated loading-to-reveal transitions, following patterns observed in award-winning Three.js websites.

**Business Value**: Premium 3D websites achieve their "wow" factor through seamless loading-to-reveal transitions. This system brings that capability to Angular developers through declarative directives that follow established library patterns.

**Approved Direction**: Directive-Based System (Option B from research phase), creating declarative directives for loading orchestration and entrance animations consistent with existing `Float3dDirective` and `Rotate3dDirective` patterns.

---

## Requirements

### Requirement 1: Asset Preloader Service (FR-1.x)

**User Story:** As an Angular developer using @hive-academy/angular-3d, I want to preload multiple assets with unified progress tracking, so that I can display accurate loading progress and coordinate scene entrance after all assets are ready.

#### Acceptance Criteria

**FR-1.1: Asset Registration and Progress Aggregation**

1. WHEN the service receives an array of asset URLs with types THEN the service SHALL initiate loading for all assets using appropriate loader services (GltfLoaderService, TextureLoaderService)
2. WHEN multiple assets are loading simultaneously THEN the service SHALL expose a combined `progress()` signal (0-100) representing weighted average progress across all assets
3. WHEN all registered assets complete loading THEN the `isReady()` signal SHALL become `true`

**FR-1.2: Signal-Based Reactive State**

1. WHEN an asset is registered for preloading THEN the service SHALL return a PreloadState object containing:
   - `progress()` - Combined progress signal (0-100)
   - `isReady()` - Boolean signal indicating all assets loaded
   - `errors()` - Array signal of any loading errors
   - `loadedCount()` - Number of successfully loaded assets
   - `totalCount()` - Total number of registered assets
2. WHEN any asset fails to load THEN the `errors()` signal SHALL update with the error details
3. WHEN the consumer component is destroyed THEN the preload state SHALL be cleanable via a `cancel()` method

**FR-1.3: Loader Service Integration**

1. WHEN a GLTF/GLB asset is registered THEN the service SHALL delegate to `GltfLoaderService.load()`
2. WHEN a texture asset is registered THEN the service SHALL delegate to `TextureLoaderService.load()`
3. WHEN an HDRI/environment map is registered THEN the service SHALL support future loader extension
4. WHEN cached assets are registered THEN the service SHALL immediately report them as loaded (leveraging existing caching in loader services)

**FR-1.4: Service Configuration**

1. WHEN the service is used THEN it SHALL be `providedIn: 'root'` for singleton behavior across scenes
2. WHEN multiple scenes request preloading THEN the service SHALL track separate preload operations via unique identifiers

#### Interface Definition

```typescript
interface AssetDefinition {
  url: string;
  type: 'gltf' | 'texture' | 'hdri';
  weight?: number; // Optional weight for progress calculation (default: 1)
}

interface PreloadState {
  readonly progress: () => number; // 0-100
  readonly isReady: () => boolean;
  readonly errors: () => Error[];
  readonly loadedCount: () => number;
  readonly totalCount: () => number;
  readonly cancel: () => void;
}
```

---

### Requirement 2: Cinematic Entrance Directive (FR-2.x)

**User Story:** As an Angular developer, I want to apply cinematic camera entrance animations to my 3D scenes using a declarative directive, so that I can create professional reveal experiences without manual GSAP configuration.

#### Acceptance Criteria

**FR-2.1: Directive Declaration and Configuration**

1. WHEN the directive `a3dCinematicEntrance` is applied to a component THEN the directive SHALL accept an `entranceConfig` input with the following properties:
   - `preset`: Animation preset name ('dolly-in' | 'orbit-drift' | 'crane-up' | 'fade-drift')
   - `duration`: Animation duration in seconds (default: 2.5)
   - `startPosition`: Starting camera position [x, y, z] (optional)
   - `endPosition`: Ending camera position [x, y, z] (optional)
   - `startLookAt`: Starting look-at target [x, y, z] (optional)
   - `endLookAt`: Ending look-at target [x, y, z] (optional)
   - `easing`: GSAP easing function (default: 'power2.inOut')
   - `delay`: Delay before starting in seconds (default: 0)
   - `autoStart`: Start automatically when scene is ready (default: true)
2. WHEN a preset is specified without explicit positions THEN the directive SHALL use predefined start/end positions for that preset
3. WHEN custom positions are provided alongside a preset THEN custom positions SHALL override preset defaults

**FR-2.2: Camera Animation Execution**

1. WHEN the entrance animation starts THEN the directive SHALL animate the camera position from startPosition to endPosition using GSAP
2. WHEN `startLookAt` and `endLookAt` are specified THEN the directive SHALL smoothly interpolate the camera look-at target
3. WHEN the animation is active THEN the directive SHALL call `SceneService.invalidate()` on each GSAP update to trigger renders in demand mode
4. WHEN the animation completes THEN the directive SHALL emit an `entranceComplete` output event

**FR-2.3: OrbitControls Coordination**

1. WHEN the entrance animation starts THEN the directive SHALL disable OrbitControls (if present) by setting `enabled = false`
2. WHEN the entrance animation completes THEN the directive SHALL re-enable OrbitControls and sync its target to the final camera look-at position
3. WHEN OrbitControls is not present in the scene THEN the directive SHALL proceed without control coordination

**FR-2.4: Preset Definitions**

1. WHEN preset 'dolly-in' is selected THEN the animation SHALL move camera from far to close along the Z-axis
2. WHEN preset 'orbit-drift' is selected THEN the animation SHALL combine subtle orbit rotation with dolly movement
3. WHEN preset 'crane-up' is selected THEN the animation SHALL move camera upward while looking down at scene
4. WHEN preset 'fade-drift' is selected THEN the animation SHALL combine gentle horizontal drift with opacity fade

**FR-2.5: Lifecycle and Cleanup**

1. WHEN the host component is destroyed during animation THEN the directive SHALL kill the GSAP animation and restore camera/controls state
2. WHEN GSAP is imported THEN it SHALL use dynamic import for tree-shaking consistency with existing directives

#### Interface Definition

```typescript
type EntrancePreset = 'dolly-in' | 'orbit-drift' | 'crane-up' | 'fade-drift';

interface CinematicEntranceConfig {
  preset?: EntrancePreset;
  duration?: number;
  startPosition?: [number, number, number];
  endPosition?: [number, number, number];
  startLookAt?: [number, number, number];
  endLookAt?: [number, number, number];
  easing?: string;
  delay?: number;
  autoStart?: boolean;
}
```

---

### Requirement 3: Scene Reveal Directive (FR-3.x)

**User Story:** As an Angular developer, I want to apply staggered reveal animations to 3D objects in my scene, so that objects appear sequentially creating a polished reveal experience.

#### Acceptance Criteria

**FR-3.1: Directive Declaration and Configuration**

1. WHEN the directive `a3dSceneReveal` is applied to a 3D component THEN the directive SHALL accept a `revealConfig` input with:
   - `animation`: Animation type ('fade-in' | 'scale-pop' | 'rise-up')
   - `duration`: Animation duration in seconds (default: 0.8)
   - `delay`: Delay before starting in seconds (default: 0)
   - `easing`: GSAP easing function (default: 'power2.out')
   - `staggerGroup`: Optional group name for coordinated stagger animations
   - `staggerIndex`: Optional index within stagger group (for manual ordering)
2. WHEN the directive is applied THEN the target object SHALL start in hidden/initial state
3. WHEN `autoReveal` is true THEN the directive SHALL reveal when the scene entrance completes

**FR-3.2: Animation Type Implementations**

1. WHEN animation type 'fade-in' is selected THEN the directive SHALL animate material opacity from 0 to original value
2. WHEN animation type 'scale-pop' is selected THEN the directive SHALL animate object scale from 0.01 to original scale with overshoot
3. WHEN animation type 'rise-up' is selected THEN the directive SHALL animate object position from below to original position
4. WHEN the target object uses transparent materials THEN opacity animation SHALL work correctly

**FR-3.3: Stagger Group Coordination**

1. WHEN multiple directives share the same `staggerGroup` THEN they SHALL coordinate reveal timing with automatic stagger offset (default: 150ms)
2. WHEN `staggerIndex` is provided THEN objects SHALL reveal in index order rather than DOM order
3. WHEN a stagger group is triggered THEN all objects in the group SHALL animate sequentially

**FR-3.4: External Trigger API**

1. WHEN `autoReveal` is false THEN the directive SHALL expose a `reveal()` method for programmatic triggering
2. WHEN `reveal()` is called THEN the directive SHALL play the configured animation
3. WHEN `hide()` is called THEN the directive SHALL reverse the animation back to hidden state

**FR-3.5: Lifecycle and Cleanup**

1. WHEN the host component is destroyed THEN the directive SHALL restore original object state and kill animations
2. WHEN the directive initializes THEN it SHALL store original position/scale/opacity for restoration

#### Interface Definition

```typescript
type RevealAnimation = 'fade-in' | 'scale-pop' | 'rise-up';

interface SceneRevealConfig {
  animation?: RevealAnimation;
  duration?: number;
  delay?: number;
  easing?: string;
  staggerGroup?: string;
  staggerIndex?: number;
  autoReveal?: boolean;
}
```

---

### Requirement 4: Integration Requirements (FR-4.x)

**User Story:** As an Angular developer, I want the loading and entrance systems to work together seamlessly, so that assets preload and then the scene reveals with cinematic animation.

#### Acceptance Criteria

**FR-4.1: Preloader-to-Entrance Coordination**

1. WHEN `AssetPreloaderService.isReady()` becomes true AND a `CinematicEntranceDirective` is present with `autoStart: true` THEN the entrance animation SHALL automatically begin
2. WHEN multiple entrance directives exist THEN they SHALL be executed in parallel unless explicit sequencing is configured
3. WHEN the entrance animation completes AND `SceneRevealDirective` instances exist with `autoReveal: true` THEN reveal animations SHALL begin

**FR-4.2: Event Flow**

1. WHEN loading progress changes THEN the `loadProgress` output SHALL emit the current percentage (0-100)
2. WHEN loading completes THEN the `loadComplete` output SHALL emit
3. WHEN entrance animation completes THEN the `entranceComplete` output SHALL emit
4. WHEN all reveal animations complete THEN the `sceneReady` output SHALL emit

**FR-4.3: Error Handling**

1. WHEN an asset fails to load THEN the `loadError` output SHALL emit with error details
2. WHEN loading fails THEN entrance animations SHALL NOT auto-start
3. WHEN entrance animation is interrupted THEN the system SHALL gracefully handle cleanup

**FR-4.4: Manual Control Mode**

1. WHEN `autoStart: false` is set on entrance directive THEN the directive SHALL expose a `start()` method
2. WHEN `autoReveal: false` is set on reveal directives THEN they SHALL wait for programmatic `reveal()` calls
3. WHEN manual control is used THEN all coordination SHALL still function correctly

---

## Non-Functional Requirements

### Performance Requirements (NFR-1.x)

**NFR-1.1: Bundle Size**

- The combined size of all new components SHALL NOT exceed 15KB gzipped
- Dynamic imports SHALL be used for GSAP to enable tree-shaking
- No duplicate GSAP imports across directives

**NFR-1.2: Animation Performance**

- Entrance animations SHALL maintain 60 FPS on desktop (Chrome, Firefox, Safari, Edge)
- Entrance animations SHALL maintain 30+ FPS on mid-range mobile devices
- Camera position updates SHALL NOT cause frame drops when combined with scene rendering

**NFR-1.3: Memory Management**

- All GSAP timelines SHALL be killed on component destroy
- Original object states SHALL be restored on cleanup
- No memory leaks from orphaned animation callbacks

### Compatibility Requirements (NFR-2.x)

**NFR-2.1: Browser Support**

- Chrome 90+ (WebGPU and WebGL)
- Firefox 90+ (WebGL fallback)
- Safari 15.4+ (WebGPU experimental, WebGL fallback)
- Edge 90+ (WebGPU and WebGL)

**NFR-2.2: Mobile Support**

- iOS Safari 15.4+
- Android Chrome 90+
- Touch interactions SHALL NOT conflict with entrance animations

**NFR-2.3: Framework Compatibility**

- Angular 18+
- Three.js 0.160+ (WebGPU renderer)
- GSAP 3.12+

### Accessibility Requirements (NFR-3.x)

**NFR-3.1: Motion Preferences**

- WHEN user has `prefers-reduced-motion: reduce` set THEN entrance animations SHALL:
  - Skip directly to end state OR
  - Use minimal duration (0.1s) with no easing
- Loading progress SHALL remain functional regardless of motion preferences

**NFR-3.2: Loading State Communication**

- Loading progress SHALL be exposed via ARIA attributes for screen readers
- Loading completion SHALL be announced to assistive technologies

### Reliability Requirements (NFR-4.x)

**NFR-4.1: Error Recovery**

- Partial asset load failures SHALL NOT crash the application
- Failed animations SHALL gracefully restore to end state
- OrbitControls SHALL always be re-enabled after entrance, even on error

---

## Out of Scope

The following features are explicitly NOT included in this task:

1. **Loading Overlay Component** - Custom loading UI (progress bars, splash screens) is consumer responsibility
2. **Skeleton Loaders** - Pre-rendered placeholder geometry during loading
3. **HDRI Loader Service** - Environment map loading (future enhancement)
4. **Audio Asset Preloading** - Sound file coordination
5. **Scene State Machine** - Full lifecycle management (LOADING -> ENTRANCE -> IDLE -> INTERACTIVE)
6. **Fly-through Animations** - Path-based camera animations with multiple waypoints
7. **Custom Preset Registration** - User-defined animation presets (beyond built-in presets)
8. **Server-Side Rendering** - SSR compatibility for preloader (browser-only APIs)
9. **Backwards Compatibility** - No migration paths or version bridging required

---

## Dependencies

### Existing Services (Must Integrate With)

| Service                | Location                                                     | Integration Point                       |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------- |
| `GltfLoaderService`    | `libs/angular-3d/src/lib/loaders/gltf-loader.service.ts`     | Asset preloading for GLTF/GLB models    |
| `TextureLoaderService` | `libs/angular-3d/src/lib/loaders/texture-loader.service.ts`  | Asset preloading for textures           |
| `SceneService`         | `libs/angular-3d/src/lib/canvas/scene.service.ts`            | Camera access, invalidate() for renders |
| `AnimationService`     | `libs/angular-3d/src/lib/render-loop/animation.service.ts`   | Reference for animation patterns        |
| `RenderLoopService`    | `libs/angular-3d/src/lib/render-loop/render-loop.service.ts` | Frame callbacks if needed               |
| `SceneGraphStore`      | `libs/angular-3d/src/lib/store/scene-graph.store.ts`         | Object access for reveal directives     |

### Existing Components (Must Coordinate With)

| Component                | Location                                                       | Coordination Point             |
| ------------------------ | -------------------------------------------------------------- | ------------------------------ |
| `OrbitControlsComponent` | `libs/angular-3d/src/lib/controls/orbit-controls.component.ts` | Disable/enable during entrance |
| `Scene3dComponent`       | `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`         | Scene container context        |

### Existing Patterns (Must Follow)

| Pattern           | Reference File           | Key Aspects                                                      |
| ----------------- | ------------------------ | ---------------------------------------------------------------- |
| Directive Pattern | `Float3dDirective`       | Signal inputs, effect(), DestroyRef cleanup, dynamic GSAP import |
| Service Pattern   | `GltfLoaderService`      | Signal-based state, caching, progress tracking                   |
| Component Pattern | `OrbitControlsComponent` | SceneService injection, output events                            |

### External Dependencies

| Library  | Version | Purpose                               |
| -------- | ------- | ------------------------------------- |
| GSAP     | 3.14+   | Animation engine (already in project) |
| Three.js | 0.182+  | 3D engine (already in project)        |
| Angular  | 20.3+   | Framework (already in project)        |

---

## Success Metrics

### Functional Validation

- [ ] AssetPreloaderService correctly aggregates progress from multiple loader services
- [ ] CinematicEntranceDirective plays all 4 preset animations correctly
- [ ] SceneRevealDirective implements all 3 reveal animation types
- [ ] OrbitControls is disabled during entrance and re-enabled after
- [ ] Stagger groups coordinate multiple reveal animations
- [ ] All outputs emit at correct lifecycle points

### Performance Validation

- [ ] Entrance animations maintain 60 FPS on desktop
- [ ] Bundle size increase is under 15KB gzipped
- [ ] No memory leaks after component destroy

### Integration Validation

- [ ] Demo application shows loading -> entrance -> reveal flow
- [ ] Existing Float3dDirective and Rotate3dDirective work alongside new directives
- [ ] WebGPU and WebGL backends both work correctly

---

## Example Usage (Target API)

```html
<!-- Scene with loading and cinematic entrance -->
<a3d-scene>
  <!-- Camera entrance animation -->
  <a3d-orbit-controls
    a3dCinematicEntrance
    [entranceConfig]="{
      preset: 'dolly-drift',
      duration: 2.5,
      startPosition: [0, 5, 15],
      endPosition: [0, 2, 8]
    }"
    (entranceComplete)="onEntranceComplete()"
  >
  </a3d-orbit-controls>

  <!-- Objects with staggered reveal -->
  <a3d-gltf-model a3dSceneReveal [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'hero', staggerIndex: 0 }" [src]="'/assets/model.glb'"> </a3d-gltf-model>

  <a3d-box a3dSceneReveal [revealConfig]="{ animation: 'fade-in', staggerGroup: 'hero', staggerIndex: 1 }" [position]="[2, 0, 0]"> </a3d-box>
</a3d-scene>
```

```typescript
// Component using AssetPreloaderService
@Component({...})
export class HeroSectionComponent {
  private preloader = inject(AssetPreloaderService);

  preloadState = this.preloader.preload([
    { url: '/assets/hero-model.glb', type: 'gltf' },
    { url: '/assets/environment.hdr', type: 'hdri' },
    { url: '/assets/texture.jpg', type: 'texture' }
  ]);

  // Reactive loading progress
  progress = this.preloadState.progress;
  isReady = this.preloadState.isReady;
}
```

---

## Document Metadata

| Field      | Value                 |
| ---------- | --------------------- |
| Task ID    | TASK_2026_006         |
| Created    | 2026-01-07            |
| Author     | Project Manager Agent |
| Status     | Requirements Complete |
| Next Phase | Architecture Design   |
| Next Agent | software-architect    |
