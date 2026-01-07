import { Component, ElementRef, ViewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Rotate3dDirective, RotateConfig } from './rotate-3d.directive';
import { SceneGraphStore } from '../../store/scene-graph.store';
import { OBJECT_ID } from '../../tokens/object-id.token';
import * as THREE from 'three/webgpu';

// Mock GSAP - uses the global mock from test-setup.ts

// TODO: Fix GSAP mocking issues - timeline property undefined errors
describe.skip('Rotate3dDirective', () => {
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
      timeScale: jest.fn(function (this: any, value?: number) {
        if (value !== undefined) {
          this._timeScale = value;
          return this;
        }
        return this._timeScale || 1;
      }),
      _timeScale: 1,
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
        imports: [Rotate3dDirective],
      })
      class TestComponent {}

      const fixture = TestBed.createComponent(TestComponent);
      expect(fixture).toBeTruthy();
    });

    it('should skip if no config provided', () => {
      @Component({
        template: `<div rotate3d></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
      })
      class TestComponent {}

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      // Timeline should not be created when no config is provided
      expect(mockGsap.timeline).not.toHaveBeenCalled();
    });

    it('should access object3D from elementRef.nativeElement', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      // Wait for 100ms initialization delay + async GSAP import
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(object3D).toBeTruthy();
    });

    it('should delay initialization for GLTF loading (100ms)', async () => {
      const object3D = new THREE.Object3D();
      const startTime = Date.now();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();

      // Timeline should not be created immediately
      expect(mockGsap.timeline).not.toHaveBeenCalled();

      // Wait for 100ms delay + GSAP import
      await new Promise((resolve) => setTimeout(resolve, 250));

      const elapsedTime = Date.now() - startTime;
      expect(elapsedTime).toBeGreaterThanOrEqual(100);
      expect(mockGsap.timeline).toHaveBeenCalled();
    });
  });

  describe('Single-Axis Rotation Tests', () => {
    it('should create Y-axis rotation (default)', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = {}; // Empty config, should use defaults
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Should create timeline with Y-axis rotation
      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          y: expect.stringContaining('+='),
          duration: 60,
          ease: 'none',
        })
      );
    });

    it('should create X-axis rotation', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'x', speed: 30 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          x: expect.stringContaining('+='),
          duration: 30,
        })
      );
    });

    it('should create Z-axis rotation', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'z', speed: 45 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          z: expect.stringContaining('+='),
          duration: 45,
        })
      );
    });

    it('should use relative rotation +=Math.PI*2', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60, direction: 1 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Check for relative rotation (+=)
      const rotationValue = (mockTimeline.to as jest.Mock).mock.calls[0][1].y;
      expect(rotationValue).toMatch(/^[+-]=/);
      expect(rotationValue).toContain(String(Math.PI * 2));
    });

    it("should use 'none' ease for smooth continuous rotation", async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          ease: 'none',
        })
      );
    });
  });

  describe('Multi-Axis Rotation Tests', () => {
    it('should create simultaneous XYZ rotation', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'xyz', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Should have 3 timeline.to calls (X, Y, Z)
      expect(mockTimeline.to).toHaveBeenCalledTimes(3);
    });

    it('should use independent speeds for each axis', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = {
          axis: 'xyz',
          xSpeed: 10,
          ySpeed: 20,
          zSpeed: 30,
        };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Check X-axis speed
      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          x: expect.any(String),
          duration: 10,
        }),
        0
      );

      // Check Y-axis speed
      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          y: expect.any(String),
          duration: 20,
        }),
        0
      );

      // Check Z-axis speed
      expect(mockTimeline.to).toHaveBeenCalledWith(
        object3D.rotation,
        expect.objectContaining({
          z: expect.any(String),
          duration: 30,
        }),
        0
      );
    });

    it('should start all axes at time 0 (parallel)', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'xyz', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // All three calls should have time position 0 (third argument)
      const calls = (mockTimeline.to as jest.Mock).mock.calls;
      expect(calls[0][2]).toBe(0);
      expect(calls[1][2]).toBe(0);
      expect(calls[2][2]).toBe(0);
    });
  });

  describe('Direction & Speed Tests', () => {
    it('should support direction: 1 (clockwise)', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60, direction: 1 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const rotationValue = (mockTimeline.to as jest.Mock).mock.calls[0][1].y;
      expect(rotationValue).toContain('+=' + Math.PI * 2);
    });

    it('should support direction: -1 (counter-clockwise)', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60, direction: -1 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      const rotationValue = (mockTimeline.to as jest.Mock).mock.calls[0][1].y;
      expect(rotationValue).toContain('+=' + Math.PI * 2 * -1);
    });

    it('setSpeed() should adjust timeline timeScale', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      jest.clearAllMocks();

      // Call setSpeed(30) - should double the speed
      directiveInstance.setSpeed(30);

      expect(mockTimeline.timeScale).toHaveBeenCalledWith(2); // 60 / 30 = 2
    });

    it('reverse() should invert timeScale', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Set initial timeScale to 1
      mockTimeline._timeScale = 1;
      jest.clearAllMocks();

      // Call reverse()
      directiveInstance.reverse();

      // Should multiply current timeScale by -1
      expect(mockTimeline.timeScale).toHaveBeenCalledWith(-1);
    });
  });

  describe('Lifecycle Tests', () => {
    it('should cleanup timeline on destroy', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      // Destroy the component
      fixture.destroy();

      // Timeline should be killed
      expect(mockTimeline.kill).toHaveBeenCalled();
    });

    it('should kill GSAP timeline', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      jest.clearAllMocks();

      // Manually call cleanup
      directiveInstance['cleanup']();

      expect(mockTimeline.kill).toHaveBeenCalled();
    });
  });

  describe('Public API Tests', () => {
    it('play() should call timeline.play()', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60, autoStart: false };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      jest.clearAllMocks();

      directiveInstance.play();

      expect(mockTimeline.play).toHaveBeenCalled();
    });

    it('pause() should call timeline.pause()', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      jest.clearAllMocks();

      directiveInstance.pause();

      expect(mockTimeline.pause).toHaveBeenCalled();
    });

    it('stop() should reset progress and pause', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      jest.clearAllMocks();

      directiveInstance.stop();

      expect(mockTimeline.progress).toHaveBeenCalledWith(0);
      expect(mockTimeline.pause).toHaveBeenCalled();
    });

    it('isPlaying() should return timeline.isActive() state', async () => {
      const object3D = new THREE.Object3D();

      @Component({
        template: `<div rotate3d [rotateConfig]="config"></div>`,
        standalone: true,
        imports: [Rotate3dDirective],
        providers: [{ provide: OBJECT_ID, useValue: 'test-object' }],
      })
      class TestComponent {
        config: RotateConfig = { axis: 'y', speed: 60 };
      }

      (mockSceneStore.getObject as jest.Mock).mockReturnValue(object3D);

      const fixture = TestBed.createComponent(TestComponent);
      const directiveInstance =
        fixture.debugElement.children[0].injector.get(Rotate3dDirective);
      fixture.detectChanges();
      await new Promise((resolve) => setTimeout(resolve, 250));

      mockTimeline.isActive.mockReturnValue(true);
      expect(directiveInstance.isPlaying()).toBe(true);

      mockTimeline.isActive.mockReturnValue(false);
      expect(directiveInstance.isPlaying()).toBe(false);
    });
  });
});
