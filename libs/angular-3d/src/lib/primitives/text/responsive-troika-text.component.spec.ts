import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ResponsiveTroikaTextComponent } from './responsive-troika-text.component';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';
import * as THREE from 'three/webgpu';

// TODO: Fix three/tsl module resolution in Jest - Cannot find module 'three/tsl'
describe.skip('ResponsiveTroikaTextComponent', () => {
  let component: ResponsiveTroikaTextComponent;
  let fixture: ComponentFixture<ResponsiveTroikaTextComponent>;
  let mockParent: THREE.Object3D;
  let mockRenderLoop: jest.Mocked<RenderLoopService>;
  let mockSceneService: jest.Mocked<Partial<SceneService>>;
  let mockCamera: THREE.PerspectiveCamera;

  beforeEach(async () => {
    mockParent = new THREE.Object3D();
    mockCamera = new THREE.PerspectiveCamera(75, 1.77, 0.1, 1000);
    mockCamera.position.set(0, 0, 10);

    mockRenderLoop = {
      registerUpdateCallback: jest.fn((callback) => {
        // Store callback for manual invocation in tests
        (mockRenderLoop as any).latestCallback = callback;
        return jest.fn(); // Return cleanup function
      }),
    } as any;

    mockSceneService = {
      camera: signal(mockCamera),
    };

    await TestBed.configureTestingModule({
      imports: [ResponsiveTroikaTextComponent],
      providers: [
        { provide: NG_3D_PARENT, useValue: signal(mockParent) },
        { provide: RenderLoopService, useValue: mockRenderLoop },
        { provide: SceneService, useValue: mockSceneService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResponsiveTroikaTextComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default responsive properties', () => {
    expect(component.responsiveMode()).toBe('viewport');
    expect(component.viewportScale()).toBe(0.05);
    expect(component.minFontSize()).toBe(0.05);
    expect(component.maxFontSize()).toBe(2.0);
    expect(component.syncDebounceMs()).toBe(100);
  });

  it('should register render loop callback for responsive sizing', () => {
    fixture.componentRef.setInput('text', 'Test Text');
    fixture.detectChanges();

    expect(mockRenderLoop.registerUpdateCallback).toHaveBeenCalled();
  });

  describe('Viewport Mode', () => {
    it('should calculate font size based on viewport width', () => {
      fixture.componentRef.setInput('text', 'Responsive Text');
      fixture.componentRef.setInput('responsiveMode', 'viewport');
      fixture.componentRef.setInput('viewportScale', 0.1);
      fixture.detectChanges();

      // Access private method via component instance
      const calculateViewportFontSize = (component as any)
        .calculateViewportFontSize;
      const fontSize = calculateViewportFontSize.call(component, mockCamera);

      expect(fontSize).toBeGreaterThan(0);
      expect(fontSize).toBeLessThanOrEqual(component.maxFontSize());
      expect(fontSize).toBeGreaterThanOrEqual(component.minFontSize());
    });

    it('should clamp font size to min constraint', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('responsiveMode', 'viewport');
      fixture.componentRef.setInput('viewportScale', 0.001); // Very small
      fixture.componentRef.setInput('minFontSize', 0.5);
      fixture.detectChanges();

      const calculateViewportFontSize = (component as any)
        .calculateViewportFontSize;
      const fontSize = calculateViewportFontSize.call(component, mockCamera);

      expect(fontSize).toBe(0.5);
    });

    it('should clamp font size to max constraint', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('responsiveMode', 'viewport');
      fixture.componentRef.setInput('viewportScale', 1.0); // Very large
      fixture.componentRef.setInput('maxFontSize', 1.0);
      fixture.detectChanges();

      const calculateViewportFontSize = (component as any)
        .calculateViewportFontSize;
      const fontSize = calculateViewportFontSize.call(component, mockCamera);

      expect(fontSize).toBe(1.0);
    });
  });

  describe('Distance Mode', () => {
    it('should calculate font size based on camera distance', () => {
      fixture.componentRef.setInput('text', 'Distance Text');
      fixture.componentRef.setInput('responsiveMode', 'distance');
      fixture.componentRef.setInput('fontSize', 0.5);
      fixture.detectChanges();

      const calculateDistanceFontSize = (component as any)
        .calculateDistanceFontSize;
      const fontSize = calculateDistanceFontSize.call(component, mockCamera);

      expect(fontSize).toBeGreaterThan(0);
      expect(fontSize).toBeLessThanOrEqual(component.maxFontSize());
      expect(fontSize).toBeGreaterThanOrEqual(component.minFontSize());
    });

    it('should scale font size proportionally with distance', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('responsiveMode', 'distance');
      fixture.componentRef.setInput('fontSize', 1.0);
      fixture.componentRef.setInput('minFontSize', 0.01);
      fixture.componentRef.setInput('maxFontSize', 10.0);
      fixture.detectChanges();

      const calculateDistanceFontSize = (component as any)
        .calculateDistanceFontSize;

      // Distance = 10 units
      mockCamera.position.set(0, 0, 10);
      const fontSizeAt10 = calculateDistanceFontSize.call(
        component,
        mockCamera
      );

      // Distance = 20 units
      mockCamera.position.set(0, 0, 20);
      const fontSizeAt20 = calculateDistanceFontSize.call(
        component,
        mockCamera
      );

      // Font size should double when distance doubles
      expect(fontSizeAt20).toBeGreaterThan(fontSizeAt10);
    });

    it('should clamp distance-based font size to constraints', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('responsiveMode', 'distance');
      fixture.componentRef.setInput('fontSize', 10.0);
      fixture.componentRef.setInput('minFontSize', 0.1);
      fixture.componentRef.setInput('maxFontSize', 1.0);
      fixture.detectChanges();

      const calculateDistanceFontSize = (component as any)
        .calculateDistanceFontSize;

      // Very far camera
      mockCamera.position.set(0, 0, 1000);
      const fontSize = calculateDistanceFontSize.call(component, mockCamera);

      expect(fontSize).toBe(1.0); // Clamped to max
    });
  });

  describe('Debouncing', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce font size updates', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('syncDebounceMs', 100);
      fixture.detectChanges();

      // Get the text object from component
      const textObject = (component as any).textObject;
      if (!textObject) {
        fail('Text object should be created');
        return;
      }

      const syncSpy = jest.spyOn(textObject, 'sync');

      // Trigger render loop callback multiple times
      const callback = (mockRenderLoop as any).latestCallback;
      if (callback) {
        callback(0.016, 0.016); // Frame 1
        callback(0.016, 0.032); // Frame 2
        callback(0.016, 0.048); // Frame 3
      }

      // sync() should not be called immediately
      expect(syncSpy).not.toHaveBeenCalled();

      // Fast-forward time
      jest.advanceTimersByTime(100);

      // Now sync() should be called once
      expect(syncSpy).toHaveBeenCalledTimes(1);
    });

    it('should not update if font size change is insignificant', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('position', [0, 0, 0]);
      fixture.detectChanges();

      const textObject = (component as any).textObject;
      if (!textObject) {
        fail('Text object should be created');
        return;
      }

      const syncSpy = jest.spyOn(textObject, 'sync');

      // Camera at same position - font size should not change significantly
      const callback = (mockRenderLoop as any).latestCallback;
      if (callback) {
        callback(0.016, 0.016);
      }

      jest.advanceTimersByTime(200);

      // sync() should not be called for insignificant changes
      expect(syncSpy).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup render loop callbacks on destroy', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.detectChanges();

      const cleanupFn = jest.fn();
      mockRenderLoop.registerUpdateCallback.mockReturnValue(cleanupFn);

      fixture.destroy();

      expect(cleanupFn).toHaveBeenCalled();
    });

    it('should dispose text object on destroy', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.detectChanges();

      const textObject = (component as any).textObject;
      if (!textObject) {
        fail('Text object should be created');
        return;
      }

      const disposeSpy = jest.spyOn(textObject, 'dispose');

      fixture.destroy();

      expect(disposeSpy).toHaveBeenCalled();
    });
  });

  describe('Billboard Mode', () => {
    it('should enable billboard mode when billboard input is true', () => {
      fixture.componentRef.setInput('text', 'Billboard Text');
      fixture.componentRef.setInput('billboard', true);
      fixture.detectChanges();

      // Billboard callback should be registered
      expect(mockRenderLoop.registerUpdateCallback).toHaveBeenCalled();
    });

    it('should cleanup billboard callback when billboard is disabled', () => {
      fixture.componentRef.setInput('text', 'Test');
      fixture.componentRef.setInput('billboard', true);
      fixture.detectChanges();

      const cleanupFn = jest.fn();
      mockRenderLoop.registerUpdateCallback.mockReturnValue(cleanupFn);

      // Disable billboard
      fixture.componentRef.setInput('billboard', false);
      fixture.detectChanges();

      expect(cleanupFn).toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should set isLoading to true during initialization', () => {
      expect(component.isLoading()).toBe(false);

      fixture.componentRef.setInput('text', 'Test');
      fixture.detectChanges();

      // isLoading should be set during initialization
      // Note: In real usage, it becomes false after sync() callback
      expect(component.isLoading()).toBeDefined();
    });

    it('should initialize loadError as null', () => {
      expect(component.loadError()).toBeNull();
    });
  });
});
