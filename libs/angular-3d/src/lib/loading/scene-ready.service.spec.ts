/**
 * Unit tests for SceneReadyService
 *
 * Tests signal state transitions and lifecycle methods.
 */

import { TestBed } from '@angular/core/testing';
import { SceneReadyService } from './scene-ready.service';

describe('SceneReadyService', () => {
  let service: SceneReadyService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SceneReadyService],
    });
    service = TestBed.inject(SceneReadyService);
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have false initial values', () => {
      expect(service.rendererReady()).toBe(false);
      expect(service.firstFrameRendered()).toBe(false);
      expect(service.isSceneReady()).toBe(false);
    });
  });

  describe('setRendererReady', () => {
    it('should update rendererReady signal to true', () => {
      service.setRendererReady();
      expect(service.rendererReady()).toBe(true);
    });

    it('should not update firstFrameRendered signal', () => {
      service.setRendererReady();
      expect(service.firstFrameRendered()).toBe(false);
    });

    it('should not make isSceneReady true when only rendererReady is set', () => {
      service.setRendererReady();
      expect(service.isSceneReady()).toBe(false);
    });
  });

  describe('setFirstFrameRendered', () => {
    it('should update firstFrameRendered signal to true', () => {
      service.setFirstFrameRendered();
      expect(service.firstFrameRendered()).toBe(true);
    });

    it('should not update rendererReady signal', () => {
      service.setFirstFrameRendered();
      expect(service.rendererReady()).toBe(false);
    });

    it('should not make isSceneReady true when only firstFrameRendered is set', () => {
      service.setFirstFrameRendered();
      expect(service.isSceneReady()).toBe(false);
    });
  });

  describe('isSceneReady computed signal', () => {
    it('should be false when neither signal is set', () => {
      expect(service.isSceneReady()).toBe(false);
    });

    it('should be false when only rendererReady is true', () => {
      service.setRendererReady();
      expect(service.isSceneReady()).toBe(false);
    });

    it('should be false when only firstFrameRendered is true', () => {
      service.setFirstFrameRendered();
      expect(service.isSceneReady()).toBe(false);
    });

    it('should be true when both signals are true', () => {
      service.setRendererReady();
      service.setFirstFrameRendered();
      expect(service.isSceneReady()).toBe(true);
    });

    it('should be true regardless of order signals are set', () => {
      // Set in reverse order
      service.setFirstFrameRendered();
      service.setRendererReady();
      expect(service.isSceneReady()).toBe(true);
    });
  });

  describe('reset', () => {
    it('should reset rendererReady to false', () => {
      service.setRendererReady();
      service.reset();
      expect(service.rendererReady()).toBe(false);
    });

    it('should reset firstFrameRendered to false', () => {
      service.setFirstFrameRendered();
      service.reset();
      expect(service.firstFrameRendered()).toBe(false);
    });

    it('should reset isSceneReady to false', () => {
      service.setRendererReady();
      service.setFirstFrameRendered();
      expect(service.isSceneReady()).toBe(true);

      service.reset();
      expect(service.isSceneReady()).toBe(false);
    });

    it('should reset both signals to false', () => {
      service.setRendererReady();
      service.setFirstFrameRendered();

      service.reset();

      expect(service.rendererReady()).toBe(false);
      expect(service.firstFrameRendered()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should reset rendererReady to false', () => {
      service.setRendererReady();
      service.clear();
      expect(service.rendererReady()).toBe(false);
    });

    it('should reset firstFrameRendered to false', () => {
      service.setFirstFrameRendered();
      service.clear();
      expect(service.firstFrameRendered()).toBe(false);
    });

    it('should reset isSceneReady to false', () => {
      service.setRendererReady();
      service.setFirstFrameRendered();
      expect(service.isSceneReady()).toBe(true);

      service.clear();
      expect(service.isSceneReady()).toBe(false);
    });

    it('should behave identically to reset', () => {
      service.setRendererReady();
      service.setFirstFrameRendered();

      service.clear();

      expect(service.rendererReady()).toBe(false);
      expect(service.firstFrameRendered()).toBe(false);
      expect(service.isSceneReady()).toBe(false);
    });
  });

  describe('signal isolation', () => {
    it('should allow multiple set calls without error', () => {
      expect(() => {
        service.setRendererReady();
        service.setRendererReady();
        service.setFirstFrameRendered();
        service.setFirstFrameRendered();
      }).not.toThrow();

      expect(service.isSceneReady()).toBe(true);
    });

    it('should maintain state after multiple reset calls', () => {
      service.setRendererReady();
      service.reset();
      service.reset();

      expect(service.rendererReady()).toBe(false);
      expect(service.firstFrameRendered()).toBe(false);
    });
  });

  describe('per-scene scoping', () => {
    it('should allow multiple independent instances', () => {
      // Create second instance manually (simulates per-scene scoping)
      const service2 = new SceneReadyService();

      // Set state on first service
      service.setRendererReady();
      service.setFirstFrameRendered();

      // Second service should be independent
      expect(service.isSceneReady()).toBe(true);
      expect(service2.isSceneReady()).toBe(false);

      // Set state on second service
      service2.setRendererReady();
      service2.setFirstFrameRendered();

      // Both should now be ready
      expect(service.isSceneReady()).toBe(true);
      expect(service2.isSceneReady()).toBe(true);

      // Reset first service - second should be unaffected
      service.reset();
      expect(service.isSceneReady()).toBe(false);
      expect(service2.isSceneReady()).toBe(true);
    });
  });
});
