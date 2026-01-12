import { TestBed } from '@angular/core/testing';
import { SceneService } from './scene.service';
import { RenderLoopService } from '../render-loop/render-loop.service';
import * as THREE from 'three/webgpu';

// Mock RenderLoopService
class MockRenderLoopService {
  requestFrame = jest.fn();
  registerUpdateCallback = jest.fn(() => jest.fn());
}

describe('SceneService', () => {
  let service: SceneService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SceneService,
        { provide: RenderLoopService, useClass: MockRenderLoopService },
      ],
    });
    service = TestBed.inject(SceneService);
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have null initial values', () => {
      expect(service.scene()).toBeNull();
      expect(service.renderer()).toBeNull();
      expect(service.camera()).toBeNull();
      expect(service.domElement).toBeNull();
    });
  });

  describe('setScene', () => {
    it('should update scene signal', () => {
      const scene = new THREE.Scene();
      service.setScene(scene);
      expect(service.scene()).toBe(scene);
    });
  });

  describe('setRenderer', () => {
    it('should update renderer signal', () => {
      const canvas = document.createElement('canvas');
      // Mock WebGPURenderer for tests - real renderer requires async init
      const renderer = {
        domElement: canvas,
        dispose: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
      } as unknown as THREE.WebGPURenderer;
      service.setRenderer(renderer);
      expect(service.renderer()).toBe(renderer);
    });

    it('should expose domElement', () => {
      const canvas = document.createElement('canvas');
      const renderer = {
        domElement: canvas,
        dispose: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
      } as unknown as THREE.WebGPURenderer;
      service.setRenderer(renderer);
      expect(service.domElement).toBe(canvas);
    });
  });

  describe('setCamera', () => {
    it('should update camera signal', () => {
      const camera = new THREE.PerspectiveCamera();
      service.setCamera(camera);
      expect(service.camera()).toBe(camera);
    });
  });

  describe('addToScene', () => {
    it('should add object to scene', () => {
      const scene = new THREE.Scene();
      service.setScene(scene);

      const mesh = new THREE.Mesh();
      service.addToScene(mesh);

      expect(scene.children).toContain(mesh);
    });

    it('should not throw if scene is null', () => {
      const mesh = new THREE.Mesh();
      expect(() => service.addToScene(mesh)).not.toThrow();
    });
  });

  describe('removeFromScene', () => {
    it('should remove object from scene', () => {
      const scene = new THREE.Scene();
      service.setScene(scene);

      const mesh = new THREE.Mesh();
      scene.add(mesh);
      expect(scene.children).toContain(mesh);

      service.removeFromScene(mesh);
      expect(scene.children).not.toContain(mesh);
    });

    it('should not throw if scene is null', () => {
      const mesh = new THREE.Mesh();
      expect(() => service.removeFromScene(mesh)).not.toThrow();
    });
  });

  describe('findByName', () => {
    it('should find object by name', () => {
      const scene = new THREE.Scene();
      service.setScene(scene);

      const mesh = new THREE.Mesh();
      mesh.name = 'testMesh';
      scene.add(mesh);

      expect(service.findByName('testMesh')).toBe(mesh);
    });

    it('should return undefined if not found', () => {
      const scene = new THREE.Scene();
      service.setScene(scene);

      expect(service.findByName('nonexistent')).toBeUndefined();
    });
  });

  describe('traverseScene', () => {
    it('should traverse all objects in scene', () => {
      const scene = new THREE.Scene();
      service.setScene(scene);

      const mesh1 = new THREE.Mesh();
      const mesh2 = new THREE.Mesh();
      scene.add(mesh1);
      scene.add(mesh2);

      const visited: THREE.Object3D[] = [];
      service.traverseScene((obj) => visited.push(obj));

      expect(visited).toContain(scene);
      expect(visited).toContain(mesh1);
      expect(visited).toContain(mesh2);
    });
  });

  describe('clear', () => {
    it('should reset all signals to null', () => {
      const scene = new THREE.Scene();
      const canvas = document.createElement('canvas');
      const renderer = {
        domElement: canvas,
        dispose: jest.fn(),
        render: jest.fn(),
        setSize: jest.fn(),
      } as unknown as THREE.WebGPURenderer;
      const camera = new THREE.PerspectiveCamera();

      service.setScene(scene);
      service.setRenderer(renderer);
      service.setCamera(camera);

      service.clear();

      expect(service.scene()).toBeNull();
      expect(service.renderer()).toBeNull();
      expect(service.camera()).toBeNull();
    });
  });
});
