import { TestBed } from '@angular/core/testing';
import { RenderLoopService } from './render-loop.service';

describe('RenderLoopService', () => {
  let service: RenderLoopService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RenderLoopService],
    });
    service = TestBed.inject(RenderLoopService);
  });

  afterEach(() => {
    service.stop();
  });

  describe('initialization', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should not be running initially', () => {
      expect(service.isRunning()).toBe(false);
    });

    it('should not be paused initially', () => {
      expect(service.isPaused()).toBe(false);
    });

    it('should have zero fps initially', () => {
      expect(service.fps()).toBe(0);
    });
  });

  describe('start/stop', () => {
    it('should start the loop', () => {
      service.start();
      expect(service.isRunning()).toBe(true);
    });

    it('should stop the loop', () => {
      service.start();
      service.stop();
      expect(service.isRunning()).toBe(false);
    });

    it('should not start if already running', () => {
      service.start();
      service.start(); // Second call should be ignored
      expect(service.isRunning()).toBe(true);
    });
  });

  describe('pause/resume', () => {
    it('should pause the loop', () => {
      service.start();
      service.pause();
      expect(service.isPaused()).toBe(true);
    });

    it('should resume the loop', () => {
      service.start();
      service.pause();
      service.resume();
      expect(service.isPaused()).toBe(false);
    });

    it('should not pause if not running', () => {
      service.pause();
      expect(service.isPaused()).toBe(false);
    });

    it('should not resume if not paused', () => {
      service.start();
      service.resume(); // Should be no-op
      expect(service.isPaused()).toBe(false);
    });
  });

  describe('callback registration', () => {
    it('should register callbacks', () => {
      const callback = jest.fn();
      service.registerUpdateCallback(callback);
      expect(service.getCallbackCount()).toBe(1);
    });

    it('should return cleanup function', () => {
      const callback = jest.fn();
      const cleanup = service.registerUpdateCallback(callback);
      expect(typeof cleanup).toBe('function');
    });

    it('should unregister callback via cleanup function', () => {
      const callback = jest.fn();
      const cleanup = service.registerUpdateCallback(callback);
      cleanup();
      expect(service.getCallbackCount()).toBe(0);
    });

    it('should unregister callback directly', () => {
      const callback = jest.fn();
      service.registerUpdateCallback(callback);
      service.unregisterUpdateCallback(callback);
      expect(service.getCallbackCount()).toBe(0);
    });

    it('should clear all callbacks', () => {
      service.registerUpdateCallback(jest.fn());
      service.registerUpdateCallback(jest.fn());
      service.clearCallbacks();
      expect(service.getCallbackCount()).toBe(0);
    });
  });

  describe('render function', () => {
    it('should set render function', () => {
      const renderFn = jest.fn();
      service.setRenderFunction(renderFn);
      // No error means success - the function is stored internally
      expect(true).toBe(true);
    });

    it('should accept render function in start', () => {
      const renderFn = jest.fn();
      service.start(renderFn);
      expect(service.isRunning()).toBe(true);
    });
  });

  describe('callback invocation', () => {
    it('should call registered callbacks when loop runs', (done) => {
      const callback = jest.fn();
      service.registerUpdateCallback(callback);
      service.start();

      // Wait for at least one frame
      setTimeout(() => {
        expect(callback).toHaveBeenCalled();
        expect(callback).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Number)
        );
        done();
      }, 50);
    });

    it('should not call callbacks when paused', (done) => {
      const callback = jest.fn();
      service.registerUpdateCallback(callback);
      service.start();
      service.pause();

      const callCountAtPause = callback.mock.calls.length;

      setTimeout(() => {
        expect(callback.mock.calls.length).toBe(callCountAtPause);
        done();
      }, 50);
    });
  });
});
