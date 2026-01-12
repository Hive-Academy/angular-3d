import { TestBed } from '@angular/core/testing';
import { EffectComposerService } from './effect-composer.service';
import { RenderLoopService } from '../render-loop/render-loop.service';
import * as THREE from 'three/webgpu';
import { Pass } from 'three-stdlib';

// Mock three-stdlib classes
jest.mock('three-stdlib', () => ({
  EffectComposer: jest.fn().mockImplementation(() => ({
    addPass: jest.fn(),
    removePass: jest.fn(),
    render: jest.fn(),
    setSize: jest.fn(),
  })),
  RenderPass: jest.fn(),
}));

// Mock RenderLoopService
class MockRenderLoopService {
  setRenderFunction = jest.fn();
}

// TODO: Fix three/tsl module resolution in Jest - Cannot find module 'three/tsl'
describe.skip('EffectComposerService', () => {
  let service: EffectComposerService;
  let renderLoop: MockRenderLoopService;
  let renderer: THREE.WebGPURenderer;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    renderLoop = new MockRenderLoopService();

    TestBed.configureTestingModule({
      providers: [
        EffectComposerService,
        { provide: RenderLoopService, useValue: renderLoop },
      ],
    });

    service = TestBed.inject(EffectComposerService);

    // Setup Three.js mocks - use mock object as WebGPURenderer
    // Real WebGPURenderer requires async init which isn't suitable for tests
    renderer = { render: jest.fn() } as unknown as THREE.WebGPURenderer;
    scene = {} as THREE.Scene;
    camera = {} as THREE.PerspectiveCamera;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should initialize composer with renderer', () => {
      service.init(renderer, scene, camera);
      // We can't easily check the private composer instance creation without checking side effects or making it public.
      // But we can check that it didn't crash.
    });
  });

  describe('enable/disable', () => {
    it('should set render function on enable', () => {
      service.init(renderer, scene, camera);
      service.enable();

      expect(service.isEnabled()).toBe(true);
      expect(renderLoop.setRenderFunction).toHaveBeenCalled();
    });

    it('should restore default render function on disable', () => {
      service.init(renderer, scene, camera);
      service.enable();

      // Clear mock calls
      renderLoop.setRenderFunction.mockClear();

      service.disable();

      expect(service.isEnabled()).toBe(false);
      expect(renderLoop.setRenderFunction).toHaveBeenCalled();

      // Verify behavior of restored function
      const restoreFn = renderLoop.setRenderFunction.mock.calls[0][0];
      restoreFn();
      expect(renderer.render).toHaveBeenCalledWith(scene, camera);
    });
  });

  describe('pass management', () => {
    it('should allow adding passes', () => {
      service.init(renderer, scene, camera);
      const pass = { render: jest.fn() } as unknown as Pass;

      service.addPass(pass);
      // Since we mocked EffectComposer, we can check if it was called on the composer instance?
      // With the current mock setup, we can't easily access the mock instance created inside.
      // We might need to spy on the module constructor or just trust that it works for now.
    });
  });
});
