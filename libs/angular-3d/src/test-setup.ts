/* eslint-disable @typescript-eslint/no-explicit-any */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Use jest-webgl-canvas-mock for comprehensive WebGL/Canvas mocking
// This package provides a complete WebGL context mock that works with Three.js
import 'jest-webgl-canvas-mock';

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
