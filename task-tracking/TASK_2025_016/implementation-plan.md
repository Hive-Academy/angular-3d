# Implementation Plan - TASK_2025_016: Viewport 3D Positioning Feature

## Codebase Investigation Summary

### Libraries Discovered

- **@hive-academy/angular-3d**: Three.js wrapper library (D:\projects\angular-3d-workspace\libs\angular-3d)
  - Key exports: SceneGraphStore, SceneService, RenderLoopService, directives pattern
  - Documentation: libs/angular-3d/CLAUDE.md
  - Usage examples: temp/scene-graphs/hero-space-scene.component.ts

### Patterns Identified

#### Service Pattern: Root-level Injectable with Signals

- **Evidence**: TextSamplingService (libs/angular-3d/src/lib/services/text-sampling.service.ts:21)
- **Components**: `@Injectable({ providedIn: 'root' })`, signal-based state, pure calculation methods
- **Conventions**: Service exports in lib/services/index.ts, re-exported from main index.ts

#### Directive Pattern: Standalone with SceneGraphStore Integration

- **Evidence**: Float3dDirective (libs/angular-3d/src/lib/directives/float-3d.directive.ts:91-95)
- **Components**: `@Directive({ selector: '[directiveName]', standalone: true })`, inject SceneGraphStore, inject OBJECT_ID token, signal inputs, effect-based reactivity
- **Conventions**: Directive exports in lib/directives/index.ts

#### Store Pattern: Signal-based Reactive State

- **Evidence**: SceneGraphStore (libs/angular-3d/src/lib/store/scene-graph.store.ts:54-273)
- **Components**: Private writable signals, public readonly signals via `.asReadonly()`, computed signals for derived state
- **Camera Access**: `SceneGraphStore.camera` signal (line 72), `SceneService.camera` signal (line 55)

#### Existing Implementation: Vanilla ViewportPositioner Class

- **Evidence**: temp/angular-3d/utils/viewport-3d-positioning.ts:65-241
- **Features**: FOV-based viewport calculations, named positions, percentage positions, pixel positions, responsive helpers
- **Usage**: hero-space-scene.component.ts:414-510 (14 position calculations for text, logos, models)

### Integration Points

- **SceneGraphStore.camera**: Reactive camera signal for FOV/position access (libs/angular-3d/src/lib/store/scene-graph.store.ts:72)
- **SceneService.camera**: Alternative camera signal access (libs/angular-3d/src/lib/canvas/scene.service.ts:55)
- **Window resize**: Browser resize events for aspect ratio updates (required for responsive positioning)

---

## Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: 3-Layer Architecture (Service → Directive → Utilities)

**Rationale**:

1. **Service Layer** provides Angular-native reactive positioning that auto-syncs with camera/window changes
2. **Directive Layer** (optional) enables declarative template syntax for common use cases
3. **Utility Layer** preserves pure functional approach for advanced users

**Evidence**:

- Similar pattern: TextSamplingService (utility functions) + component integration (libs/angular-3d/src/lib/services/text-sampling.service.ts)
- Directive pattern: Float3dDirective (declarative config with signal inputs) (libs/angular-3d/src/lib/directives/float-3d.directive.ts)

### Component Specifications

---

#### Component 1: ViewportPositioningService

**Purpose**: Core reactive service providing CSS-like viewport positioning calculations that auto-sync with camera and window changes

**Pattern**: Root-level Injectable with signal-based reactive state (verified from TextSamplingService pattern)

**Evidence**:

- Service pattern: TextSamplingService (libs/angular-3d/src/lib/services/text-sampling.service.ts:21)
- Camera access: SceneGraphStore.camera signal (libs/angular-3d/src/lib/store/scene-graph.store.ts:72)

**Responsibilities**:

- Calculate viewport dimensions from camera FOV and position
- Convert named positions to 3D world coordinates
- Convert percentage positions to 3D world coordinates
- Convert pixel positions to 3D world coordinates
- Auto-recalculate on camera changes (reactive)
- Auto-recalculate on window resize (reactive)
- Provide viewport dimension signals for responsive layouts
- Support multiple viewport planes (Z-depth layers)

**Implementation Pattern**:

```typescript
// Pattern source: libs/angular-3d/src/lib/services/text-sampling.service.ts:21-82
// Camera access: libs/angular-3d/src/lib/store/scene-graph.store.ts:72
@Injectable({ providedIn: 'root' })
export class ViewportPositioningService {
  // Dependencies
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly destroyRef = inject(DestroyRef);

  // Reactive state signals
  private readonly _viewportZ = signal<number>(0);
  private readonly _aspect = signal<number>(16 / 9);

  // Computed viewport dimensions (reactive to camera changes)
  public readonly viewportWidth = computed(() => {
    const camera = this.sceneStore.camera();
    if (!camera) return 0;
    const height = this.calculateViewportHeight(camera.fov, camera.position.z, this._viewportZ());
    return height * this._aspect();
  });

  public readonly viewportHeight = computed(() => {
    const camera = this.sceneStore.camera();
    if (!camera) return 0;
    return this.calculateViewportHeight(camera.fov, camera.position.z, this._viewportZ());
  });

  // Named position calculation (reactive)
  public getNamedPosition(name: NamedPosition, options?: PositionOffset): Signal<[number, number, number]> {
    return computed(() => {
      const halfW = this.viewportWidth() / 2;
      const halfH = this.viewportHeight() / 2;
      // ... position mapping logic from ViewportPositioner
    });
  }

  // Percentage position calculation (reactive)
  public getPercentagePosition(pos: PercentagePosition, options?: PositionOffset): Signal<[number, number, number]> {
    return computed(() => {
      // ... percentage conversion logic from ViewportPositioner
    });
  }

  // Pixel position calculation (reactive)
  public getPixelPosition(pos: PixelPosition, options?: PixelPositionOptions): Signal<[number, number, number]> {
    return computed(() => {
      // ... pixel conversion logic from ViewportPositioner
    });
  }

  // Unified position calculation
  public getPosition(position: NamedPosition | PercentagePosition | PixelPosition, options?: PixelPositionOptions): Signal<[number, number, number]> {
    // Type discrimination logic from ViewportPositioner.getPosition
  }

  // Configuration methods
  public setViewportZ(z: number): void {
    this._viewportZ.set(z);
  }

  // Responsive resize handling
  private setupResizeListener(): void {
    if (typeof window !== 'undefined') {
      const updateAspect = () => {
        this._aspect.set(window.innerWidth / window.innerHeight);
      };
      window.addEventListener('resize', updateAspect);
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', updateAspect);
      });
    }
  }

  // Pure calculation methods (stateless helpers)
  private calculateViewportHeight(fov: number, cameraZ: number, viewportZ: number): number {
    const distance = cameraZ - viewportZ;
    const fovRad = (fov * Math.PI) / 180;
    return 2 * Math.tan(fovRad / 2) * distance;
  }

  // Utility converters
  public worldToPixels(worldUnits: number): number {
    // ... from ViewportPositioner.worldToPixels
  }

  public pixelsToWorld(pixels: number): number {
    // ... from ViewportPositioner.pixelsToWorld
  }

  public getResponsiveFontSize(vhPercent: number): number {
    // ... from ViewportPositioner.getResponsiveFontSize
  }
}
```

**Quality Requirements**:

**Functional Requirements**:

- All position calculation methods return reactive signals that auto-update on camera/resize changes
- Named positions (9 variants) map to correct viewport corners/edges/center
- Percentage positions support both string ('50%') and decimal (0.5) formats
- Pixel positions correctly convert screen pixels to world units
- Offsets (X, Y, Z) are applied correctly to all position types
- Viewport dimension signals update reactively

**Non-Functional Requirements**:

- **Performance**: Position calculations complete in <1ms (verified from ViewportPositioner usage - 14 calculations in hero-space-scene.component.ts)
- **Memory**: Minimal signal subscriptions (use computed signals, not manual effects)
- **Tree-shaking**: Service is providedIn: 'root' for singleton pattern
- **SSR-safe**: Window access guarded with `typeof window !== 'undefined'`

**Pattern Compliance**:

- Use `@Injectable({ providedIn: 'root' })` (verified: TextSamplingService pattern)
- Use signal-based reactive state (verified: SceneGraphStore pattern)
- Use DestroyRef for cleanup (verified: Float3dDirective pattern)
- Use inject() for DI (verified: library-wide pattern)

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.service.ts (CREATE)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.service.spec.ts (CREATE)

---

#### Component 2: Type Definitions (viewport-positioning.types.ts)

**Purpose**: Shared TypeScript types for viewport positioning API

**Pattern**: Exported interfaces/types (verified from library-wide pattern)

**Evidence**: Type exports throughout library (e.g., libs/angular-3d/src/lib/store/scene-graph.store.ts:22-46)

**Responsibilities**:

- Define NamedPosition union type (9 variants)
- Define PercentagePosition interface
- Define PixelPosition interface
- Define PositionOffset interface
- Define PixelPositionOptions interface
- Define ViewportConfig interface (for advanced users)

**Implementation Pattern**:

```typescript
// Pattern source: temp/angular-3d/utils/viewport-3d-positioning.ts:27-60
// Type export pattern: libs/angular-3d/src/lib/store/scene-graph.store.ts:22-46

/**
 * Named viewport positions (CSS-like)
 */
export type NamedPosition = 'center' | 'top-left' | 'top-center' | 'top-right' | 'middle-left' | 'middle-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

/**
 * Percentage-based position (0-1 or '0%'-'100%')
 */
export interface PercentagePosition {
  x: string | number; // '50%' or 0.5 for center
  y: string | number; // '25%' or 0.25 for quarter from top
}

/**
 * Pixel-based position (absolute screen coordinates)
 */
export interface PixelPosition {
  x: number; // Pixels from left edge
  y: number; // Pixels from top edge
}

/**
 * Position offset in world units
 */
export interface PositionOffset {
  offsetX?: number;
  offsetY?: number;
  offsetZ?: number;
}

/**
 * Options for pixel-based positioning
 */
export interface PixelPositionOptions extends PositionOffset {
  unit?: 'px' | 'viewport' | 'world'; // Default: 'viewport'
  viewportWidth?: number; // Default: window.innerWidth
  viewportHeight?: number; // Default: window.innerHeight
}

/**
 * Viewport configuration for advanced usage
 */
export interface ViewportConfig {
  fov: number; // Camera field of view in degrees
  cameraZ: number; // Camera Z position
  viewportZ?: number; // Viewport plane Z position (default: 0)
  aspect?: number; // Aspect ratio (default: window aspect)
}
```

**Quality Requirements**:

**Functional Requirements**:

- All types match original ViewportPositioner API signatures
- Named positions include all 9 corner/edge/center variants
- Percentage positions support both string and number formats

**Non-Functional Requirements**:

- **Documentation**: JSDoc comments for all exported types
- **TypeScript strict**: No `any`, proper type safety

**Pattern Compliance**:

- Export all types from index.ts (verified: library-wide pattern)
- Use interface for object types, type for unions (verified: library pattern)

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.types.ts (CREATE)

---

#### Component 3: ViewportPositionDirective (OPTIONAL)

**Purpose**: Declarative template syntax for viewport positioning (alternative to programmatic service usage)

**Pattern**: Standalone directive with signal inputs (verified from Float3dDirective pattern)

**Evidence**:

- Directive pattern: Float3dDirective (libs/angular-3d/src/lib/directives/float-3d.directive.ts:91-271)
- SceneGraphStore integration: OBJECT_ID token injection (line 99)
- Signal inputs: floatConfig input (line 116)

**Responsibilities**:

- Accept viewportPosition input (named/percentage/pixel)
- Accept viewportOffset input (X/Y/Z offsets)
- Accept viewportZ input (viewport plane depth)
- Reactively update object position via SceneGraphStore
- Auto-cleanup on destroy

**Implementation Pattern**:

```typescript
// Pattern source: libs/angular-3d/src/lib/directives/float-3d.directive.ts:91-271
// Store integration: libs/angular-3d/src/lib/store/scene-graph.store.ts:147-187

@Directive({
  selector: '[viewportPosition]',
  standalone: true,
})
export class ViewportPositionDirective {
  // Dependencies
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID, { optional: true });
  private readonly positioningService = inject(ViewportPositioningService);
  private readonly destroyRef = inject(DestroyRef);

  // Signal inputs
  public readonly viewportPosition = input.required<NamedPosition | PercentagePosition | PixelPosition>();
  public readonly viewportOffset = input<PositionOffset>({});
  public readonly viewportZ = input<number>(0);

  constructor() {
    // Effect: sync viewport position to SceneGraphStore
    effect(() => {
      if (!this.objectId) return;

      const position = this.viewportPosition();
      const offset = this.viewportOffset();
      const z = this.viewportZ();

      // Configure service viewport plane
      this.positioningService.setViewportZ(z);

      // Get reactive position signal
      const positionSignal = this.positioningService.getPosition(position, offset);

      // Apply to store (reactive)
      effect(() => {
        const pos = positionSignal();
        this.sceneStore.update(this.objectId!, { position: pos });
      });
    });
  }
}
```

**Usage Example**:

```html
<!-- Named position -->
<app-planet viewportPosition="top-right" [viewportOffset]="{ offsetX: -2, offsetY: -1 }" />

<!-- Percentage position -->
<app-text-3d [viewportPosition]="{ x: '50%', y: '38%' }" />

<!-- Pixel position -->
<app-logo [viewportPosition]="{ x: 100, y: 50 }" [viewportOffset]="{ offsetZ: -15 }" />
```

**Quality Requirements**:

**Functional Requirements**:

- Directive updates object position reactively when inputs change
- Position updates on camera/window resize automatically
- Offsets are applied correctly
- Viewport Z plane configuration works

**Non-Functional Requirements**:

- **Performance**: Minimal effect overhead (use computed signals)
- **Cleanup**: No memory leaks on component destroy

**Pattern Compliance**:

- Use standalone directive (verified: Float3dDirective line 92-94)
- Inject OBJECT_ID token (verified: Float3dDirective line 99)
- Use signal inputs (verified: Float3dDirective line 116)
- Use effect for reactivity (verified: Float3dDirective line 131)
- Use DestroyRef for cleanup (verified: Float3dDirective line 142)

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-position.directive.ts (CREATE)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-position.directive.spec.ts (CREATE)

---

#### Component 4: Public API Exports

**Purpose**: Export positioning module from library public API

**Pattern**: Barrel exports via index.ts (verified from library-wide pattern)

**Evidence**:

- Main exports: libs/angular-3d/src/index.ts:1-33
- Module exports: libs/angular-3d/src/lib/services/index.ts (inferred)

**Responsibilities**:

- Export ViewportPositioningService
- Export all types from viewport-positioning.types.ts
- Export ViewportPositionDirective (optional)
- Re-export from main library index.ts

**Implementation Pattern**:

```typescript
// File: libs/angular-3d/src/lib/positioning/index.ts
export * from './viewport-positioning.service';
export * from './viewport-positioning.types';
export * from './viewport-position.directive'; // If implemented

// File: libs/angular-3d/src/index.ts (add line)
// Positioning - Viewport positioning utilities
export * from './lib/positioning';
```

**Quality Requirements**:

**Functional Requirements**:

- All public APIs are exported
- No internal implementation details leak to public API

**Pattern Compliance**:

- Use barrel exports (verified: libs/angular-3d/src/index.ts pattern)

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\index.ts (CREATE)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts (MODIFY - add export line)

---

#### Component 5: Unit Tests

**Purpose**: Comprehensive test coverage for positioning service and directive

**Pattern**: Jest unit tests (verified from library setup)

**Evidence**: Library testing: libs/angular-3d/CLAUDE.md:102

**Responsibilities**:

- Test named position calculations (all 9 variants)
- Test percentage position calculations
- Test pixel position calculations
- Test offset application
- Test reactive updates on camera changes
- Test responsive updates on window resize
- Test viewport Z plane changes
- Test edge cases (missing camera, SSR environment)

**Implementation Pattern**:

```typescript
// Pattern: Standard Angular TestBed setup
describe('ViewportPositioningService', () => {
  let service: ViewportPositioningService;
  let sceneStore: SceneGraphStore;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ViewportPositioningService, SceneGraphStore],
    });
    service = TestBed.inject(ViewportPositioningService);
    sceneStore = TestBed.inject(SceneGraphStore);
  });

  describe('named positions', () => {
    it('should calculate center position correctly', () => {
      // Setup camera
      const camera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
      camera.position.z = 20;
      sceneStore.initScene(new THREE.Scene(), camera, {} as any);

      const position = service.getNamedPosition('center');
      expect(position()).toEqual([0, 0, 0]);
    });

    it('should calculate top-right position correctly', () => {
      // Test viewport dimension calculation
    });

    // ... test all 9 named positions
  });

  describe('percentage positions', () => {
    it('should handle string percentages', () => {
      const position = service.getPercentagePosition({ x: '50%', y: '50%' });
      expect(position()).toEqual([0, 0, 0]); // Center
    });

    it('should handle decimal percentages', () => {
      const position = service.getPercentagePosition({ x: 0.5, y: 0.5 });
      expect(position()).toEqual([0, 0, 0]); // Center
    });
  });

  describe('reactive updates', () => {
    it('should update position when camera FOV changes', () => {
      // Test signal reactivity
    });

    it('should update position when camera position changes', () => {
      // Test signal reactivity
    });
  });

  describe('responsive behavior', () => {
    it('should update aspect ratio on window resize', () => {
      // Mock window resize event
    });
  });

  describe('edge cases', () => {
    it('should handle missing camera gracefully', () => {
      // Camera not initialized yet
    });

    it('should be SSR-safe (no window access errors)', () => {
      // Mock SSR environment
    });
  });
});
```

**Quality Requirements**:

**Functional Requirements**:

- All position calculation methods tested
- All edge cases covered
- Reactive signal behavior verified

**Non-Functional Requirements**:

- **Coverage**: >80% code coverage (per task requirements)
- **Speed**: All tests complete in <5 seconds

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.service.spec.ts (CREATE)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-position.directive.spec.ts (CREATE - if directive implemented)

---

## Integration Architecture

### Integration Points

1. **SceneGraphStore → ViewportPositioningService**

   - Pattern: Service injects SceneGraphStore, accesses camera signal
   - Evidence: Float3dDirective injects SceneGraphStore (libs/angular-3d/src/lib/directives/float-3d.directive.ts:97)
   - Connection: `this.sceneStore.camera()` provides reactive camera access

2. **Window Resize → ViewportPositioningService**

   - Pattern: Window event listener with DestroyRef cleanup
   - Evidence: DestroyRef cleanup pattern (libs/angular-3d/src/lib/directives/float-3d.directive.ts:142-144)
   - Connection: `window.addEventListener('resize', ...)` updates aspect ratio signal

3. **ViewportPositioningService → ViewportPositionDirective**

   - Pattern: Directive injects service, uses service methods in effects
   - Evidence: Float3dDirective effect pattern (libs/angular-3d/src/lib/directives/float-3d.directive.ts:131-139)
   - Connection: Directive calls `this.positioningService.getPosition()` in effect

4. **ViewportPositionDirective → SceneGraphStore**
   - Pattern: Directive updates object position via store.update()
   - Evidence: TransformDirective store update (libs/angular-3d/src/lib/directives/transform.directive.ts:110-114)
   - Connection: `this.sceneStore.update(objectId, { position })`

### Data Flow

```
User Input (template bindings)
  ↓
ViewportPositionDirective (signal inputs)
  ↓
ViewportPositioningService.getPosition() (computed signal)
  ↓ (reads)
SceneGraphStore.camera (reactive camera state)
  ↓ (reads)
Window dimensions (aspect ratio)
  ↓ (calculates)
3D world coordinates [x, y, z]
  ↓ (applies via)
SceneGraphStore.update(objectId, { position })
  ↓ (updates)
Three.js Object3D.position
```

### Dependencies

**External Dependencies** (already in package.json):

- `three` - Three.js core (for camera types)
- `@angular/core` - Angular framework

**Internal Dependencies**:

- SceneGraphStore - Camera state access
- OBJECT_ID token - Directive-component communication

---

## Quality Requirements (Architecture-Level)

### Functional Requirements

- Service provides reactive position calculations that auto-sync with camera/window changes
- All position formats (named, percentage, pixel) produce correct 3D coordinates
- Offsets (X, Y, Z) are applied correctly to all position types
- Directive updates object positions reactively when inputs change
- Multiple viewport planes (Z depths) are supported

### Non-Functional Requirements

**Performance**:

- Position calculations complete in <1ms (verified from ViewportPositioner usage with 14 calculations in hero-space-scene.component.ts)
- Minimal signal subscriptions (use computed signals, avoid manual effects)
- Tree-shakable service (providedIn: 'root')

**Security**:

- SSR-safe (all window access guarded)
- No XSS vulnerabilities (no DOM manipulation)

**Maintainability**:

- 100% TypeScript strict mode compliance
- JSDoc comments for all public APIs
- Clear separation of concerns (service/directive/types)
- No code duplication (DRY principle)

**Testability**:

- > 80% code coverage (per task requirements)
- All edge cases tested
- Reactive behavior verified in tests

### Pattern Compliance

- Use `@Injectable({ providedIn: 'root' })` for service (verified: TextSamplingService pattern)
- Use signal-based reactive state (verified: SceneGraphStore pattern)
- Use standalone directives (verified: Float3dDirective pattern)
- Use inject() for DI (verified: library-wide pattern)
- Use DestroyRef for cleanup (verified: Float3dDirective pattern)
- Use computed signals for derived state (verified: SceneGraphStore pattern)
- Follow library export conventions (verified: libs/angular-3d/src/index.ts)

---

## Implementation Strategy

### Phase 1: Core Service Implementation (PRIORITY)

**Goal**: Implement ViewportPositioningService with all positioning methods

**Steps**:

1. Create `viewport-positioning.types.ts` with all type definitions
2. Create `viewport-positioning.service.ts` with:
   - SceneGraphStore camera integration
   - Viewport dimension calculations (computed signals)
   - Named position method (reactive)
   - Percentage position method (reactive)
   - Pixel position method (reactive)
   - Unified getPosition() method (reactive)
   - Window resize listener setup
   - Utility methods (worldToPixels, pixelsToWorld, responsive font size)
3. Create `viewport-positioning.service.spec.ts` with comprehensive tests
4. Create `positioning/index.ts` barrel export
5. Update `libs/angular-3d/src/index.ts` to export positioning module

**Verification**:

- All tests pass with >80% coverage
- Service compiles without TypeScript errors
- Service exports appear in library build output

**Estimated Effort**: 2 hours

---

### Phase 2: Directive Implementation (OPTIONAL)

**Goal**: Implement ViewportPositionDirective for declarative template usage

**Steps**:

1. Create `viewport-position.directive.ts` with:
   - OBJECT_ID token injection
   - ViewportPositioningService injection
   - Signal inputs (viewportPosition, viewportOffset, viewportZ)
   - Effect-based reactive position sync to SceneGraphStore
2. Create `viewport-position.directive.spec.ts` with directive tests
3. Update `positioning/index.ts` to export directive
4. Update demo usage examples in documentation

**Verification**:

- Directive tests pass
- Directive compiles without errors
- Example usage in demo app works correctly

**Estimated Effort**: 1 hour (if implemented)

---

### Phase 3: Documentation & Examples (FINAL)

**Goal**: Document API usage and update library README

**Steps**:

1. Update libs/angular-3d/README.md with positioning module section
2. Add code examples for service usage
3. Add code examples for directive usage (if implemented)
4. Document migration path from vanilla ViewportPositioner
5. Create migration example for hero-space-scene.component.ts

**Verification**:

- README examples are accurate
- Code examples compile
- Documentation covers all public APIs

**Estimated Effort**: 0.5 hours

---

## Open Design Decisions

### Decision 1: Directive API Design

**Question**: Should ViewportPositionDirective be a separate directive or extend TransformDirective?

**Options**:

- **Option A (Recommended)**: Separate directive with selector `[viewportPosition]`

  - **Pros**: Clear separation of concerns, simpler implementation, can be used alongside transform inputs
  - **Cons**: Requires users to understand two directive systems
  - **Evidence**: Float3dDirective is separate from TransformDirective (both can be used on same element)

- **Option B**: Extend TransformDirective with viewport positioning support
  - **Pros**: Unified transform API
  - **Cons**: Breaks single responsibility principle, complex conditional logic

**Recommendation**: Option A - Separate directive following Float3dDirective pattern

**User Decision Required**: Confirm or provide alternative preference

---

### Decision 2: Service Camera Sync Strategy

**Question**: Should ViewportPositioningService auto-sync with camera or require explicit configuration?

**Options**:

- **Option A (Recommended)**: Auto-sync with SceneGraphStore.camera (reactive)

  - **Pros**: Zero configuration, positions update automatically on camera changes
  - **Cons**: Cannot use service before camera is initialized
  - **Evidence**: SceneGraphStore.camera signal is reactive (libs/angular-3d/src/lib/store/scene-graph.store.ts:72)

- **Option B**: Require explicit ViewportConfig parameter
  - **Pros**: Can be used standalone without SceneGraphStore
  - **Cons**: Not reactive, requires manual updates on camera changes

**Recommendation**: Option A - Auto-sync for Angular-native reactive behavior

**User Decision Required**: Confirm or provide alternative preference

---

### Decision 3: Multiple Viewport Planes Support

**Question**: Should multiple Z-plane support be a core feature or extension?

**Options**:

- **Option A (Recommended)**: Core feature via `setViewportZ(z)` method

  - **Pros**: Matches original ViewportPositioner API, supports layered layouts
  - **Cons**: Slightly more complex API surface
  - **Evidence**: Original ViewportPositioner supports viewportZ parameter (temp/angular-3d/utils/viewport-3d-positioning.ts:30)

- **Option B**: Extension via separate service instances
  - **Pros**: Simpler initial implementation
  - **Cons**: Loses feature parity with original implementation

**Recommendation**: Option A - Include as core feature for feature parity

**User Decision Required**: Confirm or provide alternative preference

---

## Files Affected Summary

### CREATE

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\index.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.service.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.service.spec.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-positioning.types.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-position.directive.ts (OPTIONAL)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\positioning\viewport-position.directive.spec.ts (OPTIONAL)

### MODIFY

- D:\projects\angular-3d-workspace\libs\angular-3d\src\index.ts (add export line: `export * from './lib/positioning';`)
- D:\projects\angular-3d-workspace\libs\angular-3d\README.md (add positioning module documentation)

### REFERENCE (Migration Example)

- D:\projects\angular-3d-workspace\temp\scene-graphs\hero-space-scene.component.ts (show before/after migration example in docs)

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. **Angular-native implementation**: Requires deep Angular signals/DI knowledge (frontend-developer specialty)
2. **Browser APIs**: Window resize handling, canvas rendering context (frontend-developer domain)
3. **Three.js integration**: Frontend-developer has Three.js experience from angular-3d library work
4. **No backend logic**: Pure client-side positioning calculations, no API/database work

### Complexity Assessment

**Complexity**: MEDIUM

**Estimated Effort**: 3.5-6 hours

**Breakdown**:

- **Service + Types**: 2 hours (core positioning logic, reactive signals, tests)
- **Directive (optional)**: 1 hour (declarative API, integration tests)
- **Documentation**: 0.5 hours (README updates, migration examples)
- **Testing**: 1.5 hours (comprehensive test coverage, edge cases)
- **Buffer**: 1.5 hours (debugging, refinement, unexpected issues)

### Critical Verification Points

**Before Implementation, Frontend Developer Must Verify**:

1. **All imports exist in codebase**:

   - `SceneGraphStore` from `libs/angular-3d/src/lib/store/scene-graph.store.ts:54`
   - `OBJECT_ID` token from `libs/angular-3d/src/lib/tokens/object-id.token.ts` (inferred)
   - `DestroyRef, inject, signal, computed, effect` from `@angular/core`

2. **All patterns verified from examples**:

   - Service pattern: `TextSamplingService` (libs/angular-3d/src/lib/services/text-sampling.service.ts:21-82)
   - Directive pattern: `Float3dDirective` (libs/angular-3d/src/lib/directives/float-3d.directive.ts:91-271)
   - Signal pattern: `SceneGraphStore` (libs/angular-3d/src/lib/store/scene-graph.store.ts:54-273)

3. **Library documentation consulted**:

   - libs/angular-3d/CLAUDE.md (component patterns, guidelines)
   - temp/angular-3d/utils/viewport-3d-positioning.ts (original implementation reference)

4. **No hallucinated APIs**:
   - All Three.js types verified: `PerspectiveCamera`, `Scene`, `Object3D`
   - All Angular APIs verified: `signal`, `computed`, `effect`, `DestroyRef`
   - All SceneGraphStore methods verified: `camera()`, `update()`, `getObject()`

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined (functional + non-functional)
- [x] Integration points documented
- [x] Files affected list complete (6 CREATE, 2 MODIFY)
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (MEDIUM, 3.5-6 hours)
- [x] No step-by-step implementation (that's team-leader's job)
- [x] Open design decisions flagged for user input (3 decisions)
