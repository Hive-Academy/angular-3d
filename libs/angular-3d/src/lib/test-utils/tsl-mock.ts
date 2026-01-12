/**
 * TSL Mock for Jest Tests
 *
 * Provides mock implementations of Three.js TSL (Three Shading Language)
 * functions for unit testing. These mocks return simple objects that
 * satisfy the type requirements without actual shader compilation.
 *
 * Usage: Mapped via jest.config.ts moduleNameMapper
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockNode = any;

/**
 * Mock uniform node creator
 */
export const uniform = (value: unknown): MockNode => ({
  value,
  node: { type: 'uniform' },
});

/**
 * Mock Fn (shader function) creator
 */
export const Fn = (fn: (...args: unknown[]) => unknown): MockNode => fn;

/**
 * Mock float node
 */
export const float = (value: number): MockNode => ({
  value,
  node: { type: 'float' },
  mul: (n: unknown) => float(value * (typeof n === 'number' ? n : 1)),
  add: (n: unknown) => float(value + (typeof n === 'number' ? n : 0)),
  sub: (n: unknown) => float(value - (typeof n === 'number' ? n : 0)),
  div: (n: unknown) => float(value / (typeof n === 'number' ? n : 1)),
});

/**
 * Mock vec2 node
 */
export const vec2 = (x: number, y: number): MockNode => ({
  x,
  y,
  node: { type: 'vec2' },
});

/**
 * Mock vec3 node
 */
export const vec3 = (x: number, y: number, z: number): MockNode => ({
  x,
  y,
  z,
  node: { type: 'vec3' },
  mul: () => vec3(x, y, z),
  add: () => vec3(x, y, z),
});

/**
 * Mock vec4 node
 */
export const vec4 = (x: number, y: number, z: number, w: number): MockNode => ({
  x,
  y,
  z,
  w,
  node: { type: 'vec4' },
});

/**
 * Mock color node
 */
export const color = (c: unknown): MockNode => ({
  value: c,
  node: { type: 'color' },
});

/**
 * Math operations
 */
export const sin = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'sin' },
});

export const cos = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'cos' },
});

export const pow = (base: MockNode, exp: MockNode): MockNode => ({
  base,
  exp,
  node: { type: 'pow' },
});

export const mix = (a: MockNode, b: MockNode, t: MockNode): MockNode => ({
  a,
  b,
  t,
  node: { type: 'mix' },
});

export const smoothstep = (
  edge0: MockNode,
  edge1: MockNode,
  x: MockNode
): MockNode => ({
  edge0,
  edge1,
  x,
  node: { type: 'smoothstep' },
});

export const clamp = (x: MockNode, min: MockNode, max: MockNode): MockNode => ({
  x,
  min,
  max,
  node: { type: 'clamp' },
});

export const dot = (a: MockNode, b: MockNode): MockNode => ({
  a,
  b,
  node: { type: 'dot' },
});

export const normalize = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'normalize' },
});

export const length = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'length' },
});

export const fract = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'fract' },
});

export const floor = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'floor' },
});

export const abs = (n: MockNode): MockNode => ({
  ...n,
  node: { type: 'abs' },
});

export const max = (a: MockNode, b: MockNode): MockNode => ({
  a,
  b,
  node: { type: 'max' },
});

export const min = (a: MockNode, b: MockNode): MockNode => ({
  a,
  b,
  node: { type: 'min' },
});

/**
 * Built-in TSL nodes
 */
export const positionWorld: MockNode = {
  node: { type: 'positionWorld' },
  mul: () => positionWorld,
  add: () => positionWorld,
};

export const positionLocal: MockNode = {
  node: { type: 'positionLocal' },
};

export const normalLocal: MockNode = {
  node: { type: 'normalLocal' },
};

export const normalWorld: MockNode = {
  node: { type: 'normalWorld' },
};

export const cameraPosition: MockNode = {
  node: { type: 'cameraPosition' },
};

export const uv: MockNode = {
  node: { type: 'uv' },
};

/**
 * MaterialX noise functions (commonly used in TSL)
 */
export const mx_noise_float = (p: MockNode): MockNode => ({
  p,
  node: { type: 'mx_noise_float' },
});

export const mx_fractal_noise_float = (
  p: MockNode,
  octaves: number,
  lacunarity: number,
  diminish: number
): MockNode => ({
  p,
  octaves,
  lacunarity,
  diminish,
  node: { type: 'mx_fractal_noise_float' },
});

/**
 * Post-processing TSL functions
 */
export const pass = (scene: unknown, camera: unknown): MockNode => ({
  scene,
  camera,
  node: { type: 'pass' },
});

export const bloom = (input: MockNode): MockNode => ({
  input,
  strength: uniform(1),
  threshold: uniform(0),
  radius: uniform(0),
  node: { type: 'bloom' },
});

export const dof = (color: MockNode, depth: MockNode): MockNode => ({
  color,
  depth,
  focus: uniform(10),
  aperture: uniform(0.025),
  maxBlur: uniform(0.01),
  node: { type: 'dof' },
});
