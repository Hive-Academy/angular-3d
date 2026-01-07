/**
 * TSL Texture Types and Shared Utilities
 *
 * @module primitives/shaders/tsl-textures/types
 */

import * as TSL from 'three/tsl';
import { Color, Vector3 } from 'three/webgpu';

const { float, vec3 } = TSL;

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TSLNode = any;

/**
 * Parameters for TSL texture generators.
 * Supports numbers, Colors, and Vector3 values.
 */
export interface TslTextureParams {
  [key: string]: TSLNode | number | Color | Vector3 | string | undefined;
}

/**
 * TSL Fn wrapper that properly passes parameters through.
 *
 * This wrapper solves the Three.js v0.180.0+ compatibility issue where
 * the Proxy wrapping FnNode instances blocks parameter access.
 *
 * @param fn - The shader function
 * @param defaults - Default parameter values (stored on wrapper.defaults)
 * @param layout - Optional layout for the Fn call
 * @returns Wrapper function that calls Fn with proper parameter passing
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TSLFn = (
  fn: any,
  defaults?: TslTextureParams,
  layout: any = null
) => {
  // Create wrapper that calls Fn(fn, layout) and invokes with args
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wrapper = (...args: any[]) =>
    (TSL.Fn(fn, layout) as (...a: any[]) => any)(...args);
  // Store defaults on wrapper for external access
  if (defaults) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (wrapper as any).defaults = defaults;
  }
  return wrapper;
};

/**
 * Converts user-provided parameters to TSL nodes.
 * Numbers become float nodes, Colors become vec3 nodes.
 *
 * This function matches the original tsl-textures library behavior where
 * userParams may be a TSL-specific iterable object, not a plain object.
 *
 * @param userParams - User-provided parameters (may be iterable or plain object)
 * @param defaults - Default parameter values
 * @returns Merged parameters with TSL node conversions
 */
export function convertToNodes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userParams: any,
  defaults: TslTextureParams
): TslTextureParams {
  // Extract property names from userParams (handles TSL's iterable format)
  // Original library: for (var item of userParams) { propertyNames = Object.keys(item); }
  let propertyNames: string[] = [];

  if (userParams && typeof userParams === 'object') {
    // Check if it's iterable (TSL may pass params as iterable)
    if (typeof userParams[Symbol.iterator] === 'function') {
      for (const item of userParams) {
        if (item && typeof item === 'object') {
          propertyNames = Object.keys(item);
          break;
        }
      }
    } else {
      // Plain object - get keys directly
      propertyNames = Object.keys(userParams);
    }
  }

  // Start with defaults
  const params: TslTextureParams = { ...defaults };

  // Apply user overrides (original library: params[key] = userParams[key])
  for (const key of propertyNames) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (userParams as any)[key] !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      params[key] = (userParams as any)[key];
    }
  }

  // Convert to TSL nodes
  for (const name of Object.keys(params)) {
    if (name.startsWith('$')) continue;

    const value = params[name];
    if (typeof value === 'number') {
      params[name] = float(value);
    } else if (value instanceof Color) {
      params[name] = vec3(value.r, value.g, value.b);
    } else if (value instanceof Vector3) {
      params[name] = vec3(value.x, value.y, value.z);
    }
  }

  return params;
}
