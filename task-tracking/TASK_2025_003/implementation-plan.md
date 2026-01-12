# Implementation Plan - TASK_2025_003

## Goal Description

Implement the **State Store & Context Service** module for `@hive-academy/angular-3d`, providing centralized signal-based state management and typed access to Three.js scene context.

## Proposed Changes

### Store Module

Primary focus: Centralized state management with Angular signals.

---

#### [NEW] [angular-3d-state.store.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/store/angular-3d-state.store.ts)

**Purpose**: Root-level singleton state store for application-wide 3D state.

**Implementation**:

```typescript
// Key interfaces (exported)
export interface SceneState { id, name, isActive, backgroundColor, objects... }
export interface CameraState { type, position, target, fov, zoom... }
export interface LightState { id, type, color, intensity... }
export interface PerformanceState { fps, frameTime, memoryUsage... }
export interface Angular3DAppState { scenes, camera, lights, animations, performance... }

@Injectable({ providedIn: 'root' })
export class Angular3DStateStore {
  private readonly _state = signal<Angular3DAppState>(initialState);

  // Public readonly accessors
  readonly state = this._state.asReadonly();
  readonly activeScene = computed(() => ...);
  readonly performance = computed(() => ...);

  // Update methods
  updateScene(sceneId, updates): void
  updateCamera(updates): void
  setActiveScene(sceneId): void

  // Performance monitoring
  private setupPerformanceMonitoring(): void
}
```

**Size estimate**: ~400 lines (streamlined from 794-line reference)

---

#### [NEW] [component-registry.service.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/store/component-registry.service.ts)

**Purpose**: Component registration and cross-component event communication.

**Implementation**:

```typescript
export interface ComponentRegistration { componentId, componentType, isActive, dependencies }
export interface SceneGraphEvent { type, source, target?, data, timestamp }

@Injectable({ providedIn: 'root' })
export class ComponentRegistryService {
  private readonly registry = signal<Map<string, ComponentRegistration>>(new Map());
  private readonly eventBus$ = new Subject<SceneGraphEvent>();

  readonly activeComponents = computed(() => ...);
  readonly events$ = this.eventBus$.asObservable();

  registerComponent(registration): void
  unregisterComponent(componentId): void
  emitEvent(event): void
}
```

**Size estimate**: ~150 lines

---

#### [MODIFY] [index.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/store/index.ts)

**Purpose**: Export store module public API.

```typescript
export * from './angular-3d-state.store';
export * from './component-registry.service';
```

---

### Test Files

---

#### [NEW] [angular-3d-state.store.spec.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/store/angular-3d-state.store.spec.ts)

**Purpose**: Unit tests for state store following existing patterns.

**Test coverage**:

- Initialization with default state
- Scene CRUD operations (create, read, update, setActive)
- Camera updates
- Light management
- Performance monitoring integration
- State immutability verification

**Size estimate**: ~200 lines

---

#### [NEW] [component-registry.service.spec.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/store/component-registry.service.spec.ts)

**Purpose**: Unit tests for component registry.

**Test coverage**:

- Component registration/unregistration
- Event emission and subscription
- Active components computed signal
- Cleanup behavior

**Size estimate**: ~150 lines

---

### Library Exports

---

#### [MODIFY] [index.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/index.ts)

**Purpose**: Re-export store module from library root.

Add: `export * from './lib/store';`

---

## Architecture Decisions

1. **Separation of Concerns**: Split state store and component registry into separate services (unlike monolithic reference implementation) for better tree-shaking and testability.

2. **Keep SceneService**: The existing `SceneService` (scene-scoped DI) remains for component-level scene access. The new `Angular3DStateStore` (root-level) handles application-wide state.

3. **Streamlined State**: Remove unused reference implementation features (RxJS BehaviorSubject duplicate, animation streams) - focus on signals.

4. **No angular-three dependency**: Removed `injectStore` integration from reference; our `SceneService` replaces it.

---

## Verification Plan

### Automated Tests

**Command to run all library tests**:

```bash
npx nx test angular-3d --skip-nx-cache
```

**Expected results**:

- All existing tests continue passing (scene.service.spec.ts, render-loop.service.spec.ts)
- New tests pass: angular-3d-state.store.spec.ts, component-registry.service.spec.ts

### Build Verification

**Command**:

```bash
npx nx build angular-3d
```

**Expected**: Successful build with no errors.

### Lint Verification

**Command**:

```bash
npx nx lint angular-3d
```

**Expected**: No lint errors.

### Manual Verification

1. **Inject in demo app**: Create a simple component in demo app that injects `Angular3DStateStore` and `ComponentRegistryService`, verify they are accessible
2. **Signal reactivity**: Call `updateCamera()` and verify `state().camera` reflects changes
