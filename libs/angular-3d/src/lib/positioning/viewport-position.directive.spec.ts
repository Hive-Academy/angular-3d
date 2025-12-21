/**
 * ViewportPositionDirective Unit Tests
 *
 * Tests directive functionality:
 * - Directive creation
 * - Named position application
 * - Percentage position application
 * - Pixel position application
 * - Offset application
 * - ViewportZ configuration
 * - Reactive updates when inputs change
 * - Graceful handling when OBJECT_ID is missing
 */

import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  Mesh,
  MeshBasicMaterial,
  BoxGeometry,
  PerspectiveCamera,
  Scene,
} from 'three';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import { ViewportPositionDirective } from './viewport-position.directive';
import { ViewportPositioningService } from './viewport-positioning.service';
import type {
  NamedPosition,
  PercentagePosition,
  PixelPosition,
  PositionOffset,
} from './viewport-positioning.types';

/**
 * Test host component with OBJECT_ID provider
 */
@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [ViewportPositionDirective],
  template: `
    <div
      [viewportPosition]="position()"
      [viewportOffset]="offset()"
      [viewportZ]="z()"
    ></div>
  `,
  providers: [
    {
      provide: OBJECT_ID,
      useValue: 'test-object-id',
    },
  ],
})
class TestHostComponent {
  // Signal inputs for reactive testing
  position = signal<NamedPosition | PercentagePosition | PixelPosition>(
    'center'
  );
  offset = signal<PositionOffset>({});
  z = signal<number>(0);
}

/**
 * Test host component WITHOUT OBJECT_ID (for graceful degradation test)
 */
@Component({
  selector: 'app-test-host-no-id',
  standalone: true,
  imports: [ViewportPositionDirective],
  template: `<div viewportPosition="center"></div>`,
})
class TestHostNoIdComponent {}

describe('ViewportPositionDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;
  let sceneStore: SceneGraphStore;
  let positioningService: ViewportPositioningService;
  let camera: PerspectiveCamera;
  let testMesh: Mesh;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [SceneGraphStore, ViewportPositioningService],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    sceneStore = TestBed.inject(SceneGraphStore);
    positioningService = TestBed.inject(ViewportPositioningService);

    // Setup test scene with camera
    camera = new PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    camera.position.z = 20;
    const scene = new Scene();

    // Initialize scene store
    sceneStore.initScene(scene, camera, {} as any);

    // Create test mesh
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0xffffff });
    testMesh = new Mesh(geometry, material);

    // Register test object in store
    sceneStore.register('test-object-id', testMesh, 'mesh');
  });

  afterEach(() => {
    fixture.destroy();
  });

  describe('directive creation', () => {
    it('should create directive successfully', () => {
      fixture.detectChanges();
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should inject dependencies correctly', () => {
      fixture.detectChanges();
      expect(sceneStore).toBeTruthy();
      expect(positioningService).toBeTruthy();
    });
  });

  describe('named position application', () => {
    it('should apply center position correctly', (done) => {
      component.position.set('center');
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.x).toBe(0);
        expect(obj?.position.y).toBe(0);
        expect(obj?.position.z).toBe(0);
        done();
      }, 50);
    });

    it('should apply top-left position correctly', (done) => {
      component.position.set('top-left');
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.x).toBeLessThan(0); // Left side
        expect(obj?.position.y).toBeGreaterThan(0); // Top
        done();
      }, 50);
    });

    it('should apply bottom-right position correctly', (done) => {
      component.position.set('bottom-right');
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.x).toBeGreaterThan(0); // Right side
        expect(obj?.position.y).toBeLessThan(0); // Bottom
        done();
      }, 50);
    });
  });

  describe('percentage position application', () => {
    it('should handle string percentages', (done) => {
      component.position.set({ x: '50%', y: '50%' });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        // 50% should be center (0, 0)
        expect(obj?.position.x).toBeCloseTo(0, 2);
        expect(obj?.position.y).toBeCloseTo(0, 2);
        done();
      }, 50);
    });

    it('should handle decimal percentages', (done) => {
      component.position.set({ x: 0.5, y: 0.5 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        // 0.5 should be center (0, 0)
        expect(obj?.position.x).toBeCloseTo(0, 2);
        expect(obj?.position.y).toBeCloseTo(0, 2);
        done();
      }, 50);
    });

    it('should calculate non-center percentages correctly', (done) => {
      component.position.set({ x: '25%', y: '75%' });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        // 25% x should be left of center
        expect(obj?.position.x).toBeLessThan(0);
        // 75% y should be below center (CSS top-down)
        expect(obj?.position.y).toBeLessThan(0);
        done();
      }, 50);
    });
  });

  describe('pixel position application', () => {
    it('should convert pixel coordinates to world units', (done) => {
      component.position.set({ x: 100, y: 50 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        // Should produce valid world coordinates
        expect(typeof obj?.position.x).toBe('number');
        expect(typeof obj?.position.y).toBe('number');
        expect(typeof obj?.position.z).toBe('number');
        done();
      }, 50);
    });
  });

  describe('offset application', () => {
    it('should apply offsetX correctly', (done) => {
      component.position.set('center');
      component.offset.set({ offsetX: 5 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.x).toBe(5);
        done();
      }, 50);
    });

    it('should apply offsetY correctly', (done) => {
      component.position.set('center');
      component.offset.set({ offsetY: 3 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.y).toBe(3);
        done();
      }, 50);
    });

    it('should apply offsetZ correctly', (done) => {
      component.position.set('center');
      component.offset.set({ offsetZ: -10 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.z).toBe(-10);
        done();
      }, 50);
    });

    it('should apply multiple offsets correctly', (done) => {
      component.position.set('center');
      component.offset.set({ offsetX: 2, offsetY: -1, offsetZ: -5 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.x).toBe(2);
        expect(obj?.position.y).toBe(-1);
        expect(obj?.position.z).toBe(-5);
        done();
      }, 50);
    });
  });

  describe('viewportZ configuration', () => {
    it('should apply viewportZ to position', (done) => {
      component.position.set('center');
      component.z.set(-15);
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.z).toBe(-15);
        done();
      }, 50);
    });

    it('should combine viewportZ with offsetZ', (done) => {
      component.position.set('center');
      component.z.set(-10);
      component.offset.set({ offsetZ: -5 });
      fixture.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj = sceneStore.getObject('test-object-id');
        expect(obj?.position.z).toBe(-15); // -10 + -5
        done();
      }, 50);
    });
  });

  describe('reactive updates', () => {
    it('should update position when viewportPosition input changes', (done) => {
      component.position.set('center');
      fixture.detectChanges();

      // Allow initial effect to run
      setTimeout(() => {
        const obj1 = sceneStore.getObject('test-object-id');
        const initialX = obj1?.position.x ?? 0;

        // Change position
        component.position.set('top-right');
        fixture.detectChanges();

        // Allow effect to run again
        setTimeout(() => {
          const obj2 = sceneStore.getObject('test-object-id');
          expect(obj2?.position.x).not.toBe(initialX);
          done();
        }, 50);
      }, 50);
    });

    it('should update position when viewportOffset input changes', (done) => {
      component.position.set('center');
      component.offset.set({ offsetX: 0 });
      fixture.detectChanges();

      // Allow initial effect to run
      setTimeout(() => {
        component.offset.set({ offsetX: 10 });
        fixture.detectChanges();

        // Allow effect to run again
        setTimeout(() => {
          const obj = sceneStore.getObject('test-object-id');
          expect(obj?.position.x).toBe(10);
          done();
        }, 50);
      }, 50);
    });

    it('should update position when viewportZ input changes', (done) => {
      component.position.set('center');
      component.z.set(0);
      fixture.detectChanges();

      // Allow initial effect to run
      setTimeout(() => {
        component.z.set(-20);
        fixture.detectChanges();

        // Allow effect to run again
        setTimeout(() => {
          const obj = sceneStore.getObject('test-object-id');
          expect(obj?.position.z).toBe(-20);
          done();
        }, 50);
      }, 50);
    });
  });

  describe('edge cases', () => {
    it('should handle missing OBJECT_ID gracefully (no errors)', () => {
      const noIdFixture = TestBed.createComponent(TestHostNoIdComponent);

      // Should not throw
      expect(() => {
        noIdFixture.detectChanges();
      }).not.toThrow();

      noIdFixture.destroy();
    });

    it('should not update store when OBJECT_ID is missing', (done) => {
      const noIdFixture = TestBed.createComponent(TestHostNoIdComponent);
      noIdFixture.detectChanges();

      // Verify store object count doesn't change
      const initialCount = sceneStore.objectCount();

      // Allow effects to run
      setTimeout(() => {
        const newCount = sceneStore.objectCount();
        expect(newCount).toBe(initialCount); // No new objects added
        noIdFixture.destroy();
        done();
      }, 50);
    });
  });

  describe('multi-directive viewportZ isolation', () => {
    it('should isolate viewportZ between multiple directives', (done) => {
      // Create second mesh for object-2
      const testMesh2 = new Mesh(
        new BoxGeometry(1, 1, 1),
        new MeshBasicMaterial()
      );
      sceneStore.register('object-2', testMesh2, 'mesh');

      // Create first directive with viewportZ = -5
      @Component({
        selector: 'app-directive-1',
        standalone: true,
        imports: [ViewportPositionDirective],
        template: `<div [viewportPosition]="'center'" [viewportZ]="-5"></div>`,
        providers: [{ provide: OBJECT_ID, useValue: 'test-object-id' }],
      })
      class Directive1Component {}

      // Create second directive with viewportZ = -10
      @Component({
        selector: 'app-directive-2',
        standalone: true,
        imports: [ViewportPositionDirective],
        template: `<div [viewportPosition]="'center'" [viewportZ]="-10"></div>`,
        providers: [{ provide: OBJECT_ID, useValue: 'object-2' }],
      })
      class Directive2Component {}

      const fixture1 = TestBed.createComponent(Directive1Component);
      const fixture2 = TestBed.createComponent(Directive2Component);

      fixture1.detectChanges();
      fixture2.detectChanges();

      // Allow effects to run
      setTimeout(() => {
        const obj1 = sceneStore.getObject('test-object-id');
        const obj2 = sceneStore.getObject('object-2');

        // Verify each directive has its own viewportZ
        expect(obj1?.position.z).toBe(-5);
        expect(obj2?.position.z).toBe(-10);

        // Verify they don't interfere with each other
        expect(obj1?.position.z).not.toBe(obj2?.position.z);

        fixture1.destroy();
        fixture2.destroy();
        done();
      }, 100);
    });
  });
});
