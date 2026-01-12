# Implementation Plan - TASK_2025_005

## Goal

Implement an OrbitControls wrapper component for `@hive-academy/angular-3d` that creates and manages Three.js OrbitControls, exposing the instance via typed outputs for consumer access (e.g., ScrollZoomCoordinatorDirective).

---

## Proposed Changes

### Component: Controls Module

**Purpose**: Provide Angular-wrapped camera controls for 3D scenes

---

#### [CREATE] `libs/angular-3d/src/lib/controls/orbit-controls.component.ts`

**Purpose**: Angular component wrapping three-stdlib OrbitControls

**Pattern Reference**: [scene-3d.component.ts:114-179](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/canvas/scene-3d.component.ts#L114-L179) - Component structure, DI, lifecycle

**Template**:

```typescript
/**
 * OrbitControls Component - Camera Controls for Angular 3D
 *
 * Creates and manages OrbitControls for camera interaction.
 * Uses SceneService for camera/domElement access.
 */

import { Component, ChangeDetectionStrategy, OnDestroy, inject, input, output, effect, DestroyRef } from '@angular/core';
import { OrbitControls } from 'three-stdlib';
import * as THREE from 'three';
import { SceneService } from '../canvas/scene.service';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * Event emitted when controls change (camera moves, zooms, etc.)
 */
export interface OrbitControlsChangeEvent {
  /** Current camera distance from target */
  distance: number;
  /** The OrbitControls instance */
  controls: OrbitControls;
}

@Component({
  selector: 'a3d-orbit-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class OrbitControlsComponent implements OnDestroy {
  // DI
  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // INPUTS - Target & Damping
  // ================================
  readonly target = input<[number, number, number]>([0, 0, 0]);
  readonly enableDamping = input<boolean>(true);
  readonly dampingFactor = input<number>(0.05);

  // ================================
  // INPUTS - Auto-rotation
  // ================================
  readonly autoRotate = input<boolean>(false);
  readonly autoRotateSpeed = input<number>(2.0);

  // ================================
  // INPUTS - Zoom
  // ================================
  readonly enableZoom = input<boolean>(true);
  readonly minDistance = input<number>(5);
  readonly maxDistance = input<number>(30);
  readonly zoomSpeed = input<number>(1.0);

  // ================================
  // INPUTS - Pan
  // ================================
  readonly enablePan = input<boolean>(false);
  readonly panSpeed = input<number>(1.0);

  // ================================
  // INPUTS - Rotation
  // ================================
  readonly enableRotate = input<boolean>(true);
  readonly rotateSpeed = input<number>(1.0);
  readonly minPolarAngle = input<number>(0);
  readonly maxPolarAngle = input<number>(Math.PI);
  readonly minAzimuthAngle = input<number>(-Infinity);
  readonly maxAzimuthAngle = input<number>(Infinity);

  // ================================
  // OUTPUTS - Instance Access
  // ================================

  /** Emitted when OrbitControls is initialized and ready */
  readonly controlsReady = output<OrbitControls>();

  /** Emitted when controls change (camera moves, zooms, rotates) */
  readonly controlsChange = output<OrbitControlsChangeEvent>();

  // Private state
  private controls: OrbitControls | null = null;
  private cleanupRenderLoop: (() => void) | null = null;

  constructor() {
    // Initialize controls when camera and domElement are available
    effect(() => {
      const camera = this.sceneService.camera();
      const domElement = this.sceneService.domElement;

      if (camera && domElement && !this.controls) {
        this.initControls(camera, domElement);
      }
    });

    // React to input changes
    effect(() => {
      if (this.controls) {
        this.updateControlsFromInputs();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  ngOnDestroy(): void {
    this.dispose();
  }

  /**
   * Get the OrbitControls instance (for programmatic access)
   */
  public getControls(): OrbitControls | null {
    return this.controls;
  }

  private initControls(camera: THREE.PerspectiveCamera, domElement: HTMLCanvasElement): void {
    // Create OrbitControls
    this.controls = new OrbitControls(camera, domElement);

    // Apply initial configuration
    this.updateControlsFromInputs();

    // Register render loop callback for damping updates
    this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback(() => {
      if (this.controls && this.enableDamping()) {
        this.controls.update();
      }
    });

    // Setup change event listener
    this.controls.addEventListener('change', this.handleControlsChange);

    // Emit ready event
    this.controlsReady.emit(this.controls);
  }

  private handleControlsChange = (): void => {
    if (!this.controls) return;

    const distance = this.controls.object.position.distanceTo(this.controls.target);

    this.controlsChange.emit({
      distance,
      controls: this.controls,
    });
  };

  private updateControlsFromInputs(): void {
    if (!this.controls) return;

    // Target
    const [tx, ty, tz] = this.target();
    this.controls.target.set(tx, ty, tz);

    // Damping
    this.controls.enableDamping = this.enableDamping();
    this.controls.dampingFactor = this.dampingFactor();

    // Auto-rotation
    this.controls.autoRotate = this.autoRotate();
    this.controls.autoRotateSpeed = this.autoRotateSpeed();

    // Zoom
    this.controls.enableZoom = this.enableZoom();
    this.controls.minDistance = this.minDistance();
    this.controls.maxDistance = this.maxDistance();
    this.controls.zoomSpeed = this.zoomSpeed();

    // Pan
    this.controls.enablePan = this.enablePan();
    this.controls.panSpeed = this.panSpeed();

    // Rotation
    this.controls.enableRotate = this.enableRotate();
    this.controls.rotateSpeed = this.rotateSpeed();
    this.controls.minPolarAngle = this.minPolarAngle();
    this.controls.maxPolarAngle = this.maxPolarAngle();
    this.controls.minAzimuthAngle = this.minAzimuthAngle();
    this.controls.maxAzimuthAngle = this.maxAzimuthAngle();

    // Apply update
    this.controls.update();
  }

  private dispose(): void {
    if (this.cleanupRenderLoop) {
      this.cleanupRenderLoop();
      this.cleanupRenderLoop = null;
    }

    if (this.controls) {
      this.controls.removeEventListener('change', this.handleControlsChange);
      this.controls.dispose();
      this.controls = null;
    }
  }
}
```

**Quality Requirements**:

- ✅ Uses SceneService DI pattern (scene-3d.component.ts:122)
- ✅ Uses DestroyRef for cleanup (scene-3d.component.ts:121)
- ✅ Uses effect() for reactive initialization
- ✅ OnPush change detection
- ✅ Typed outputs for instance access
- ✅ No CUSTOM_ELEMENTS_SCHEMA

---

#### [CREATE] `libs/angular-3d/src/lib/controls/orbit-controls.component.spec.ts`

**Purpose**: Unit tests for OrbitControlsComponent

**Pattern Reference**: [texture-loader.service.spec.ts:1-49](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/loaders/texture-loader.service.spec.ts#L1-L49) - Three.js mocking pattern

**Template**:

```typescript
import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { OrbitControlsComponent, OrbitControlsChangeEvent } from './orbit-controls.component';
import { SceneService } from '../canvas/scene.service';
import { RenderLoopService } from '../render-loop/render-loop.service';
import * as THREE from 'three';

// Mock OrbitControls from three-stdlib
jest.mock('three-stdlib', () => {
  return {
    OrbitControls: jest.fn().mockImplementation(() => ({
      target: new (jest.requireActual('three').Vector3)(),
      object: {
        position: new (jest.requireActual('three').Vector3)(0, 0, 20),
      },
      enableDamping: false,
      dampingFactor: 0.05,
      autoRotate: false,
      autoRotateSpeed: 2.0,
      enableZoom: true,
      minDistance: 5,
      maxDistance: 30,
      zoomSpeed: 1.0,
      enablePan: false,
      panSpeed: 1.0,
      enableRotate: true,
      rotateSpeed: 1.0,
      minPolarAngle: 0,
      maxPolarAngle: Math.PI,
      minAzimuthAngle: -Infinity,
      maxAzimuthAngle: Infinity,
      update: jest.fn(),
      dispose: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })),
  };
});

describe('OrbitControlsComponent', () => {
  let component: OrbitControlsComponent;
  let fixture: ComponentFixture<OrbitControlsComponent>;
  let mockSceneService: Partial<SceneService>;
  let mockRenderLoopService: Partial<RenderLoopService>;
  let mockCamera: THREE.PerspectiveCamera;
  let mockDomElement: HTMLCanvasElement;

  beforeEach(async () => {
    mockCamera = new THREE.PerspectiveCamera();
    mockDomElement = document.createElement('canvas');

    mockSceneService = {
      camera: jest.fn(() => mockCamera) as unknown as SceneService['camera'],
      get domElement() {
        return mockDomElement;
      },
    };

    mockRenderLoopService = {
      registerUpdateCallback: jest.fn(() => jest.fn()),
    };

    await TestBed.configureTestingModule({
      imports: [OrbitControlsComponent],
      providers: [
        { provide: SceneService, useValue: mockSceneService },
        { provide: RenderLoopService, useValue: mockRenderLoopService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrbitControlsComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create component', () => {
      expect(component).toBeTruthy();
    });

    it('should emit controlsReady when initialized', () => {
      const readySpy = jest.fn();
      component.controlsReady.subscribe(readySpy);

      fixture.detectChanges();
      TestBed.flushEffects();

      expect(readySpy).toHaveBeenCalled();
    });

    it('should register render loop callback', () => {
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(mockRenderLoopService.registerUpdateCallback).toHaveBeenCalled();
    });
  });

  describe('inputs', () => {
    it('should have default input values', () => {
      expect(component.enableDamping()).toBe(true);
      expect(component.dampingFactor()).toBe(0.05);
      expect(component.enableZoom()).toBe(true);
      expect(component.minDistance()).toBe(5);
      expect(component.maxDistance()).toBe(30);
    });
  });

  describe('getControls', () => {
    it('should return null before initialization', () => {
      expect(component.getControls()).toBeNull();
    });

    it('should return controls after initialization', () => {
      fixture.detectChanges();
      TestBed.flushEffects();

      expect(component.getControls()).toBeTruthy();
    });
  });

  describe('cleanup', () => {
    it('should dispose controls on destroy', () => {
      fixture.detectChanges();
      TestBed.flushEffects();

      const controls = component.getControls();
      fixture.destroy();

      expect(controls?.dispose).toHaveBeenCalled();
    });

    it('should unregister render loop callback on destroy', () => {
      const unregisterFn = jest.fn();
      (mockRenderLoopService.registerUpdateCallback as jest.Mock).mockReturnValue(unregisterFn);

      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.destroy();

      expect(unregisterFn).toHaveBeenCalled();
    });
  });
});
```

**Quality Requirements**:

- ✅ Uses jest.mock for three-stdlib
- ✅ Tests initialization, inputs, cleanup
- ✅ Uses TestBed pattern

---

#### [MODIFY] `libs/angular-3d/src/lib/controls/index.ts`

**Line Range**: 1-6
**Changes**: Replace placeholder with actual exports

**Pattern Reference**: [loaders/index.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/loaders/index.ts)

```typescript
// @hive-academy/angular-3d - Controls module
// OrbitControls wrapper

export * from './orbit-controls.component';
```

---

## Verification Plan

### Automated Tests

```bash
# Run OrbitControls unit tests
npx nx test angular-3d --testPathPattern=orbit-controls --skip-nx-cache

# Run all library tests to ensure no regressions
npx nx test angular-3d --skip-nx-cache

# Lint check
npx nx lint angular-3d

# Build check
npx nx build angular-3d
```

### Test Coverage Targets

| Test                     | Purpose                 |
| ------------------------ | ----------------------- |
| Component creates        | Basic instantiation     |
| controlsReady emits      | Typed instance exposure |
| Inputs apply to controls | Configuration works     |
| Render loop registered   | Damping updates work    |
| Cleanup on destroy       | No memory leaks         |

---

## Team-Leader Handoff

**Developer Type**: frontend-developer
**Complexity**: Medium
**Estimated Tasks**: 2-3 atomic tasks
**Batch Strategy**: Single batch (all files are interdependent)

### Batch Structure

**Batch 1**: OrbitControls Implementation

- Create orbit-controls.component.ts
- Create orbit-controls.component.spec.ts
- Update controls/index.ts exports
- Run tests + lint + build

---

## File Summary

| File                                        | Action | Lines (Est.) |
| ------------------------------------------- | ------ | ------------ |
| `controls/orbit-controls.component.ts`      | CREATE | ~200         |
| `controls/orbit-controls.component.spec.ts` | CREATE | ~120         |
| `controls/index.ts`                         | MODIFY | 4            |

**Total Files**: 3
**Total Estimated Lines**: ~324
