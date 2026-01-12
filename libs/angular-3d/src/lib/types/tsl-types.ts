/**
 * TSL Type Definitions
 *
 * Comprehensive TypeScript types for Three.js Shading Language (TSL).
 * Provides semantic type hints for shader nodes, uniforms, and expressions.
 *
 * Note: TSL types use `any` internally because the actual Three.js TSL API
 * returns complex dynamic node types that aren't fully exported. These types
 * provide semantic meaning and documentation while maintaining flexibility.
 *
 * @packageDocumentation
 */

/**
 * TSL Uniform Node - represents a uniform value
 * Uniforms are created with `uniform(value)` from 'three/tsl'
 *
 * @example
 * ```typescript
 * const { uniform } = getTSL();
 * private uTime: TSLUniform<number>;
 * this.uTime = uniform(0);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
export type TSLUniform<T = any> = any;

/**
 * TSL Float Node - numeric shader value
 *
 * @example
 * ```typescript
 * private uAlpha: TSLFloat;
 * this.uAlpha = uniform(1.0);
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLFloat = any;

/**
 * TSL Vec2 Node - 2D vector shader value
 *
 * @example
 * ```typescript
 * private uResolution: TSLVec2;
 * this.uResolution = uniform(new THREE.Vector2(width, height));
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLVec2 = any;

/**
 * TSL Vec3 Node - 3D vector shader value
 *
 * @example
 * ```typescript
 * private uLightPosition: TSLVec3;
 * this.uLightPosition = uniform(new THREE.Vector3(1, 1, 1));
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLVec3 = any;

/**
 * TSL Vec4 Node - 4D vector shader value
 *
 * @example
 * ```typescript
 * private uColorWithAlpha: TSLVec4;
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLVec4 = any;

/**
 * TSL Color Node - color shader value
 *
 * @example
 * ```typescript
 * private uBackgroundColor: TSLColor;
 * this.uBackgroundColor = uniform(new THREE.Color(0x000000));
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLColor = any;

/**
 * Generic TSL Node - base type for any shader node
 * Use this when the specific node type is unknown or for function parameters
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLNode = any;

/**
 * TSL Node Representation - return type for TSL expressions
 * Used for shader function returns and complex expressions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLNodeRepresentation = any;

/**
 * TSL Function - shader function wrapper
 * Used for creating reusable shader functions
 */
export type TSLFunction<
  TArgs extends unknown[] = unknown[],
  TReturn = TSLNodeRepresentation
> = (...args: TArgs) => TReturn;

/**
 * TSL Material Node - used for material node properties
 * (colorNode, opacityNode, etc.)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLMaterialNode = any;
