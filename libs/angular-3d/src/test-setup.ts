/* eslint-disable @typescript-eslint/no-explicit-any */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Use jest-webgl-canvas-mock for comprehensive WebGL/Canvas mocking
import 'jest-webgl-canvas-mock';

// Mock THREE.WebGLRenderer since it requires a real WebGL context
jest.mock('three', () => {
  const originalModule = jest.requireActual('three');

  // Create a mock WebGLRenderer class
  class MockWebGLRenderer {
    public domElement = document.createElement('canvas');
    public shadowMap = { enabled: false, type: 0 };
    public capabilities = { isWebGL2: true };
    public info = { memory: {}, render: {} };

    public setSize = jest.fn();
    public setPixelRatio = jest.fn();
    public render = jest.fn();
    public dispose = jest.fn();
    public setClearColor = jest.fn();
    public getClearColor = jest.fn(() => new originalModule.Color());
    public getClearAlpha = jest.fn(() => 1);
    public clear = jest.fn();
    public setRenderTarget = jest.fn();
    public getRenderTarget = jest.fn(() => null);
    public getContext = jest.fn(() => ({}));
    public getPixelRatio = jest.fn(() => 1);
    public getSize = jest.fn(() => ({ width: 800, height: 600 }));
    public setViewport = jest.fn();
    public setScissor = jest.fn();
    public setScissorTest = jest.fn();

    public constructor(params?: any) {
      if (params?.canvas) {
        this.domElement = params.canvas;
      }
    }
  }

  return {
    ...originalModule,
    WebGLRenderer: MockWebGLRenderer,
  };
});

// Mock GSAP for animation tests (handles default import: `import gsap from 'gsap'`)
jest.mock('gsap', () => {
  const mockTween = {
    kill: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
  };

  const mockTimeline = {
    kill: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    to: jest.fn().mockReturnThis(),
    call: jest.fn().mockReturnThis(),
  };

  const gsapMock = {
    to: jest.fn(() => mockTween),
    timeline: jest.fn(() => mockTimeline),
  };

  return {
    __esModule: true,
    default: gsapMock,
    ...gsapMock,
  };
});

// Mock requestAnimationFrame for render loop tests
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  (window as any).requestAnimationFrame = jest.fn(
    (callback: FrameRequestCallback) => {
      return setTimeout(
        () => callback(performance.now()),
        16
      ) as unknown as number;
    }
  );
  (window as any).cancelAnimationFrame = jest.fn((id: number) => {
    clearTimeout(id);
  });
}

// Mock ResizeObserver
if (typeof window !== 'undefined' && !(window as any).ResizeObserver) {
  (window as any).ResizeObserver = class ResizeObserver {
    public observe = jest.fn();
    public unobserve = jest.fn();
    public disconnect = jest.fn();
  };
}

setupZoneTestEnv({
  errorOnUnknownElements: true,
  errorOnUnknownProperties: true,
});
