import { TestBed, ComponentFixture } from '@angular/core/testing';
import {
  OrbitControlsComponent,
  OrbitControlsChangeEvent,
} from './orbit-controls.component';
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
    it('should have default enableDamping as true', () => {
      expect(component.enableDamping()).toBe(true);
    });

    it('should have default dampingFactor as 0.05', () => {
      expect(component.dampingFactor()).toBe(0.05);
    });

    it('should have default enableZoom as true', () => {
      expect(component.enableZoom()).toBe(true);
    });

    it('should have default minDistance as 5', () => {
      expect(component.minDistance()).toBe(5);
    });

    it('should have default maxDistance as 30', () => {
      expect(component.maxDistance()).toBe(30);
    });

    it('should have default target as [0, 0, 0]', () => {
      expect(component.target()).toEqual([0, 0, 0]);
    });

    it('should have default enablePan as false', () => {
      expect(component.enablePan()).toBe(false);
    });

    it('should have default autoRotate as false', () => {
      expect(component.autoRotate()).toBe(false);
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
      (
        mockRenderLoopService.registerUpdateCallback as jest.Mock
      ).mockReturnValue(unregisterFn);

      fixture.detectChanges();
      TestBed.flushEffects();
      fixture.destroy();

      expect(unregisterFn).toHaveBeenCalled();
    });

    it('should remove event listener on destroy', () => {
      fixture.detectChanges();
      TestBed.flushEffects();

      const controls = component.getControls();
      fixture.destroy();

      expect(controls?.removeEventListener).toHaveBeenCalledWith(
        'change',
        expect.any(Function)
      );
    });
  });

  describe('with null camera', () => {
    it('should not initialize controls when camera is null', async () => {
      const nullCameraService = {
        camera: jest.fn(() => null) as unknown as SceneService['camera'],
        get domElement() {
          return mockDomElement;
        },
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [OrbitControlsComponent],
        providers: [
          { provide: SceneService, useValue: nullCameraService },
          { provide: RenderLoopService, useValue: mockRenderLoopService },
        ],
      }).compileComponents();

      const nullFixture = TestBed.createComponent(OrbitControlsComponent);
      const nullComponent = nullFixture.componentInstance;

      nullFixture.detectChanges();
      TestBed.flushEffects();

      expect(nullComponent.getControls()).toBeNull();
    });
  });
});
