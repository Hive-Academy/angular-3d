import { Component, ElementRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Float3dDirective, FloatConfig } from './float-3d.directive';
import { SceneGraphStore } from '../store/scene-graph.store';
import { OBJECT_ID } from '../tokens/object-id.token';
import * as THREE from 'three/webgpu';

// Mock GSAP - uses the global mock from test-setup.ts
// The mock is already configured but we reference it for clarity

describe('Float3dDirective', () => {
  let mockTimeline: any;
  let mockGsap: any;
  let mockSceneStore: Partial<SceneGraphStore>;

  beforeEach(() => {
    // Get references to mocked GSAP objects
    const gsapModule = require('gsap');
    mockGsap = gsapModule.gsap || gsapModule.default;
    mockTimeline = {
      to: jest.fn().mockReturnThis(),
      kill: jest.fn(),
      pause: jest.fn(),
      play: jest.fn(),
      progress: jest.fn(() => 0),
      isActive: jest.fn(() => false),
    };
    mockGsap.timeline = jest.fn(() => mockTimeline);

    // Mock SceneGraphStore
    mockSceneStore = {
      getObject: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: SceneGraphStore, useValue: mockSceneStore }],
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization Tests', () => {
    it('should create directive instance', () => {
      @Component({
        template: `<div></div>`,
        standalone: true,
        imports: [Float3dDirective],
      })
      class TestComponent {}

      const fixture = TestBed.createComponent(TestComponent);
      expect(fixture).toBeTruthy();
    });

    it('should skip initialization if no config provided', () => {
      @Component({
        template: `<div float3d></div>`,
        standalone: true,
        imports: [Float3dDirective],
      })
      class TestComponent {}

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      // Timeline should not be created when no config is provided
      expect(mockGsap.timeline).not.toHaveBeenCalled();
    });

    it('should access mesh from SceneGraphStore', async () => {
      const mesh = new THREE.Mesh();
      const testObjectId = 'test-mesh-1';

      // Mock getObject to return our mesh
      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: testObjectId }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.5 };
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      // Wait for async GSAP import
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockSceneStore.getObject).toHaveBeenCalledWith(testObjectId);
      expect(mesh).toBeTruthy();
    });
  });

  describe('Animation Creation Tests', () => {
    it('should create GSAP timeline via dynamic import', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);
      const testObjectId = 'test-mesh-2';

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: testObjectId }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.3 };
      }

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      // Wait for async GSAP import
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(mockGsap.timeline).toHaveBeenCalled();
    });

    it('should use default config values (height: 0.3, speed: 2000)', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 1, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = {}; // Empty config, should use defaults
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check timeline.to was called with correct default values
      expect(mockTimeline.to).toHaveBeenCalledWith(
        mesh.position,
        expect.objectContaining({
          y: 1.3, // original(1) + default height(0.3)
          duration: 1, // default speed(2000ms) / 2000
          ease: 'sine.inOut',
        })
      );
    });

    it('should use custom config values', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 2, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = {
          height: 1.5,
          speed: 3000,
          delay: 500,
          ease: 'power2.inOut',
        };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check timeline created with custom delay
      expect(mockGsap.timeline).toHaveBeenCalledWith(
        expect.objectContaining({
          repeat: -1,
          delay: 0.5, // 500ms / 1000
        })
      );

      // Check UP phase with custom values
      expect(mockTimeline.to).toHaveBeenCalledWith(
        mesh.position,
        expect.objectContaining({
          y: 3.5, // original(2) + custom height(1.5)
          duration: 1.5, // custom speed(3000ms) / 2000
          ease: 'power2.inOut',
        })
      );
    });

    it('should create UP/DOWN phases (not yoyo)', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.5, speed: 2000 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Should have two .to() calls: UP phase and DOWN phase
      expect(mockTimeline.to).toHaveBeenCalledTimes(2);

      // UP phase
      expect(mockTimeline.to).toHaveBeenNthCalledWith(
        1,
        mesh.position,
        expect.objectContaining({ y: 0.5 })
      );

      // DOWN phase (back to original)
      expect(mockTimeline.to).toHaveBeenNthCalledWith(
        2,
        mesh.position,
        expect.objectContaining({ y: 0 })
      );
    });

    it('should respect autoStart: false', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.3, autoStart: false };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Timeline should be paused when autoStart is false
      expect(mockTimeline.pause).toHaveBeenCalled();
    });
  });

  describe('Lifecycle Tests', () => {
    it('should cleanup timeline on destroy via destroyRef.onDestroy()', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.3 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Destroy the component
      fixture.destroy();

      // Timeline should be killed
      expect(mockTimeline.kill).toHaveBeenCalled();
    });

    it('should reset mesh position to original on cleanup', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(1, 2, 3);
      const originalPosition = { x: 1, y: 2, z: 3 };

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.5 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Modify position to simulate animation
      mesh.position.set(1, 3, 3);

      // Destroy the component
      fixture.destroy();

      // Position should be reset to original
      expect(mesh.position.x).toBe(originalPosition.x);
      expect(mesh.position.y).toBe(originalPosition.y);
      expect(mesh.position.z).toBe(originalPosition.z);
    });
  });

  describe('Public API Tests', () => {
    it('play() should call timeline.play()', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.3, autoStart: false };
        @ViewChild(Float3dDirective) directive!: Float3dDirective;
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Float3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      jest.clearAllMocks();

      // Call play()
      directiveInstance.play();

      expect(mockTimeline.play).toHaveBeenCalled();
    });

    it('pause() should call timeline.pause()', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.3 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Float3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      jest.clearAllMocks();

      // Call pause()
      directiveInstance.pause();

      expect(mockTimeline.pause).toHaveBeenCalled();
    });

    it('stop() should reset progress and pause', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 1, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.5 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Float3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      jest.clearAllMocks();

      // Call stop()
      directiveInstance.stop();

      expect(mockTimeline.progress).toHaveBeenCalledWith(0);
      expect(mockTimeline.pause).toHaveBeenCalled();
      expect(mesh.position.y).toBe(1); // Reset to original
    });

    it('isPlaying() should return timeline.isActive() state', async () => {
      const mesh = new THREE.Mesh();
      mesh.position.set(0, 0, 0);

      @Component({
        template: `<div float3d [floatConfig]="config"></div>`,
        standalone: true,
        imports: [Float3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: FloatConfig = { height: 0.3 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(mesh);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Float3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Mock isActive to return true
      mockTimeline.isActive.mockReturnValue(true);

      expect(directiveInstance.isPlaying()).toBe(true);

      // Mock isActive to return false
      mockTimeline.isActive.mockReturnValue(false);

      expect(directiveInstance.isPlaying()).toBe(false);
    });
  });
});
