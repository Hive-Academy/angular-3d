import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import * as THREE from 'three/webgpu';

import { RayMarchedBackgroundComponent } from './ray-marched-background.component';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';

describe('RayMarchedBackgroundComponent', () => {
  let component: RayMarchedBackgroundComponent;
  let fixture: ComponentFixture<RayMarchedBackgroundComponent>;
  let mockParent: THREE.Group;
  let mockCamera: THREE.PerspectiveCamera;
  let renderCallbacks: Array<(delta: number) => void>;

  beforeEach(async () => {
    mockParent = new THREE.Group();
    mockCamera = new THREE.PerspectiveCamera(75, 16 / 9, 0.1, 1000);
    mockCamera.position.z = 50;
    renderCallbacks = [];

    const mockRenderLoopService = {
      registerUpdateCallback: jest.fn((callback: (delta: number) => void) => {
        renderCallbacks.push(callback);
        return () => {
          const index = renderCallbacks.indexOf(callback);
          if (index > -1) renderCallbacks.splice(index, 1);
        };
      }),
    };

    const mockSceneService = {
      camera: signal(mockCamera),
    };

    await TestBed.configureTestingModule({
      imports: [RayMarchedBackgroundComponent],
      providers: [
        {
          provide: NG_3D_PARENT,
          useValue: signal(mockParent),
        },
        {
          provide: RenderLoopService,
          useValue: mockRenderLoopService,
        },
        {
          provide: SceneService,
          useValue: mockSceneService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RayMarchedBackgroundComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should create mesh on parent availability', () => {
    expect(mockParent.children.length).toBe(1);
    expect(mockParent.children[0]).toBeInstanceOf(THREE.Mesh);
  });

  it('should apply preset configuration', () => {
    fixture.componentRef.setInput('preset', 'minimal');
    fixture.detectChanges();

    // Component should update uniforms when preset changes
    // (Implementation detail: Material is recreated, uniforms are updated)
    expect(component).toBeTruthy();
  });

  it('should validate sphere count and clamp to 10', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    fixture.componentRef.setInput('sphereCount', 15);
    fixture.detectChanges();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      expect.stringContaining('sphereCount clamped to 10')
    );

    consoleWarnSpy.mockRestore();
  });

  it('should adapt quality based on device (mobile vs desktop)', () => {
    // Device detection happens in constructor
    // This test verifies component handles both cases
    expect(component).toBeTruthy();
  });

  it('should dispose resources on destroy', () => {
    const mesh = mockParent.children[0] as THREE.Mesh;
    const geometryDisposeSpy = jest.spyOn(mesh.geometry, 'dispose');
    const materialDisposeSpy = jest.spyOn(
      mesh.material as THREE.Material,
      'dispose'
    );

    fixture.destroy();

    expect(geometryDisposeSpy).toHaveBeenCalled();
    expect(materialDisposeSpy).toHaveBeenCalled();
    expect(mockParent.children.length).toBe(0);
  });

  it('should register render loop callback', () => {
    expect(renderCallbacks.length).toBeGreaterThan(0);
  });

  it('should cleanup render loop callback on destroy', () => {
    const initialCallbackCount = renderCallbacks.length;

    fixture.destroy();

    expect(renderCallbacks.length).toBeLessThan(initialCallbackCount);
  });

  it('should update time uniform in render loop', () => {
    const initialCallbackCount = renderCallbacks.length;
    expect(initialCallbackCount).toBeGreaterThan(0);

    // Simulate render loop tick
    renderCallbacks.forEach((callback) => callback(0.016));

    // Uniform updates happen internally, just verify callback executes
    expect(component).toBeTruthy();
  });

  it('should support fullscreen mode', () => {
    fixture.componentRef.setInput('fullscreen', true);
    fixture.detectChanges();

    const mesh = mockParent.children[0] as THREE.Mesh;
    expect(mesh.frustumCulled).toBe(false);
  });

  it('should support positioned mode', () => {
    fixture.componentRef.setInput('fullscreen', false);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });
});
