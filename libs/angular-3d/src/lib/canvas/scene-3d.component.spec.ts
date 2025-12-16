import { TestBed } from '@angular/core/testing';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Scene3dComponent } from './scene-3d.component';
import { SceneService } from './scene.service';

// Mock component for testing content projection
@Component({
  selector: 'test-child',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestChildComponent {}

describe('Scene3dComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Scene3dComponent],
    }).compileComponents();
  });

  describe('creation', () => {
    it('should create the component', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      const component = fixture.componentInstance;
      expect(component).toBeTruthy();
    });

    it('should have default input values', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      const component = fixture.componentInstance;

      expect(component.cameraPosition()).toEqual([0, 0, 20]);
      expect(component.cameraFov()).toBe(75);
      expect(component.cameraNear()).toBe(0.1);
      expect(component.cameraFar()).toBe(1000);
      expect(component.enableAntialiasing()).toBe(true);
      expect(component.alpha()).toBe(true);
      expect(component.powerPreference()).toBe('high-performance');
      expect(component.backgroundColor()).toBeNull();
      expect(component.enableShadows()).toBe(false);
    });
  });

  describe('initialization', () => {
    it('should initialize Three.js objects after view init', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.getScene()).toBeTruthy();
      expect(component.getRenderer()).toBeTruthy();
      expect(component.getCamera()).toBeTruthy();
    });

    it('should set camera position from input', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.componentRef.setInput('cameraPosition', [5, 10, 15]);
      fixture.detectChanges();

      const camera = fixture.componentInstance.getCamera();
      expect(camera.position.x).toBe(5);
      expect(camera.position.y).toBe(10);
      expect(camera.position.z).toBe(15);
    });

    it('should set camera FOV from input', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.componentRef.setInput('cameraFov', 90);
      fixture.detectChanges();

      const camera = fixture.componentInstance.getCamera();
      expect(camera.fov).toBe(90);
    });
  });

  describe('SceneService integration', () => {
    it('should provide SceneService at component level', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const sceneService = fixture.debugElement.injector.get(SceneService);
      expect(sceneService).toBeTruthy();
    });

    it('should populate SceneService with scene objects', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const sceneService = fixture.debugElement.injector.get(SceneService);
      expect(sceneService.scene()).toBeTruthy();
      expect(sceneService.renderer()).toBeTruthy();
      expect(sceneService.camera()).toBeTruthy();
    });
  });

  describe('render loop', () => {
    it('should register update callbacks', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      const callback = jest.fn();

      const cleanup = component.registerUpdateCallback(callback);
      expect(typeof cleanup).toBe('function');

      cleanup();
    });
  });

  describe('cleanup', () => {
    it('should dispose resources on destroy', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const component = fixture.componentInstance;
      const renderer = component.getRenderer();
      const disposeSpy = jest.spyOn(renderer, 'dispose');

      fixture.destroy();

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should clear SceneService on destroy', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const sceneService = fixture.debugElement.injector.get(SceneService);

      fixture.destroy();

      expect(sceneService.scene()).toBeNull();
      expect(sceneService.renderer()).toBeNull();
      expect(sceneService.camera()).toBeNull();
    });
  });

  describe('DOM structure', () => {
    it('should render canvas element', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const canvas = fixture.nativeElement.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('should have scene-container class', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const container = fixture.nativeElement.querySelector('.scene-container');
      expect(container).toBeTruthy();
    });

    it('should have scene-content for ng-content', () => {
      const fixture = TestBed.createComponent(Scene3dComponent);
      fixture.detectChanges();

      const content = fixture.nativeElement.querySelector('.scene-content');
      expect(content).toBeTruthy();
    });
  });
});
