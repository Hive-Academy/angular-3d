/* eslint-disable @typescript-eslint/no-explicit-any */

import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

// Mock WebGL context for Three.js
// Jest/jsdom doesn't provide WebGL, so we need to mock it
const mockWebGLContext = {
  canvas: document.createElement('canvas'),
  getExtension: jest.fn(() => null),
  getParameter: jest.fn(() => 0),
  getShaderPrecisionFormat: jest.fn(() => ({
    rangeMin: 127,
    rangeMax: 127,
    precision: 23,
  })),
  createShader: jest.fn(() => ({})),
  shaderSource: jest.fn(),
  compileShader: jest.fn(),
  getShaderParameter: jest.fn(() => true),
  createProgram: jest.fn(() => ({})),
  attachShader: jest.fn(),
  linkProgram: jest.fn(),
  getProgramParameter: jest.fn(() => true),
  useProgram: jest.fn(),
  createBuffer: jest.fn(() => ({})),
  bindBuffer: jest.fn(),
  bufferData: jest.fn(),
  createTexture: jest.fn(() => ({})),
  bindTexture: jest.fn(),
  texImage2D: jest.fn(),
  texParameteri: jest.fn(),
  createFramebuffer: jest.fn(() => ({})),
  bindFramebuffer: jest.fn(),
  framebufferTexture2D: jest.fn(),
  createRenderbuffer: jest.fn(() => ({})),
  bindRenderbuffer: jest.fn(),
  renderbufferStorage: jest.fn(),
  framebufferRenderbuffer: jest.fn(),
  viewport: jest.fn(),
  clearColor: jest.fn(),
  clear: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  blendFunc: jest.fn(),
  depthFunc: jest.fn(),
  cullFace: jest.fn(),
  frontFace: jest.fn(),
  scissor: jest.fn(),
  getContextAttributes: jest.fn(() => ({
    alpha: true,
    antialias: true,
    depth: true,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: false,
  })),
  drawArrays: jest.fn(),
  drawElements: jest.fn(),
  getUniformLocation: jest.fn(() => ({})),
  getAttribLocation: jest.fn(() => 0),
  uniformMatrix4fv: jest.fn(),
  uniform1i: jest.fn(),
  uniform1f: jest.fn(),
  uniform2f: jest.fn(),
  uniform3f: jest.fn(),
  uniform4f: jest.fn(),
  enableVertexAttribArray: jest.fn(),
  vertexAttribPointer: jest.fn(),
  activeTexture: jest.fn(),
  pixelStorei: jest.fn(),
  deleteShader: jest.fn(),
  deleteProgram: jest.fn(),
  deleteBuffer: jest.fn(),
  deleteTexture: jest.fn(),
  deleteFramebuffer: jest.fn(),
  deleteRenderbuffer: jest.fn(),
  generateMipmap: jest.fn(),
  checkFramebufferStatus: jest.fn(() => 36053),
  isContextLost: jest.fn(() => false),
  drawingBufferWidth: 800,
  drawingBufferHeight: 600,
};

// Mock canvas getContext to return WebGL context
const originalGetContext = HTMLCanvasElement.prototype.getContext;
(HTMLCanvasElement.prototype as any).getContext = function (
  contextId: string,
  options?: any
): any {
  if (contextId === 'webgl' || contextId === 'webgl2') {
    return mockWebGLContext;
  }
  return originalGetContext.call(this, contextId, options);
};

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
