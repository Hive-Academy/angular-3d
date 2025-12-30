/**
 * TSL Texture Types and Shared Utilities
 *
 * @module primitives/shaders/tsl-textures/types
 */

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as TSL from 'three/tsl';
import { Color, Vector3 } from 'three/webgpu';

const { float, vec3 } = TSL;

// TSL Fn helper with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TSLFn = TSL.Fn as any;

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
 * Converts user-provided parameters to TSL nodes.
 * Numbers become float nodes, Colors become vec3 nodes.
 *
 * @param userParams - User-provided parameters
 * @param defaults - Default parameter values
 * @returns Merged parameters with TSL node conversions
 */
export function convertToNodes(
  userParams: TslTextureParams,
  defaults: TslTextureParams
): TslTextureParams {
  const params: TslTextureParams = { ...defaults };

  // Override with user params
  for (const [key, value] of Object.entries(userParams)) {
    if (typeof value !== 'undefined') {
      params[key] = value;
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
