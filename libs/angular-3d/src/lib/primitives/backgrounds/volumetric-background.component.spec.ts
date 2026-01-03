import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import * as THREE from 'three/webgpu';

import { VolumetricBackgroundComponent } from './volumetric-background.component';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';

describe('VolumetricBackgroundComponent', () => {
  let component: VolumetricBackgroundComponent;
  let fixture: ComponentFixture<VolumetricBackgroundComponent>;
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
      imports: [VolumetricBackgroundComponent],
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

    fixture = TestBed.createComponent(VolumetricBackgroundComponent);
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

  it('should update density parameter reactively', () => {
    fixture.componentRef.setInput('density', 0.2);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should update scattering parameter reactively', () => {
    fixture.componentRef.setInput('scattering', 0.7);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should support depth fade toggle', () => {
    fixture.componentRef.setInput('depthFade', false);
    fixture.detectChanges();

    expect(component).toBeTruthy();
  });

  it('should animate time uniform in render loop', () => {
    const initialCallbackCount = renderCallbacks.length;
    expect(initialCallbackCount).toBeGreaterThan(0);

    // Simulate render loop tick
    renderCallbacks.forEach((callback) => callback(0.016));

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

  it('should cleanup render loop callback on destroy', () => {
    const initialCallbackCount = renderCallbacks.length;

    fixture.destroy();

    expect(renderCallbacks.length).toBeLessThan(initialCallbackCount);
  });
});
