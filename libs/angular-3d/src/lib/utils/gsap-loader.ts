/**
 * GSAP Loader Utility - Safe dynamic import for GSAP with error handling
 *
 * Provides a centralized utility for dynamically loading GSAP with proper
 * error handling and destroyed state checking. Used by animation directives
 * to ensure consistent GSAP import patterns.
 *
 * Features:
 * - Dynamic import for tree-shaking optimization
 * - Error handling with console logging
 * - Destroyed state checking for async safety
 *
 * @example
 * ```typescript
 * const result = await loadGsap(() => this.isDestroyed());
 * if (!result) {
 *   // Handle failure (either GSAP failed to load or directive was destroyed)
 *   this.handleGsapLoadFailure();
 *   return;
 * }
 * const { gsap } = result;
 * // Use gsap...
 * ```
 */

import type { gsap as GsapType } from 'gsap';

/**
 * Result of successful GSAP load
 */
export interface GsapLoadResult {
  /** The loaded GSAP instance */
  gsap: typeof GsapType;
}

/**
 * Safely load GSAP with error handling.
 *
 * Uses dynamic import for tree-shaking optimization and handles:
 * - Import failures (missing package, network error)
 * - Caller destroyed during async import
 *
 * @param isDestroyed - Function to check if caller is destroyed
 * @returns GSAP instance or null if loading failed or caller destroyed
 *
 * @example
 * ```typescript
 * // In a directive/component
 * const result = await loadGsap(() => this.isDestroyed());
 * if (!result) {
 *   this.skipToEnd();
 *   return;
 * }
 * const { gsap } = result;
 * gsap.timeline({ ... });
 * ```
 */
export async function loadGsap(
  isDestroyed: () => boolean
): Promise<GsapLoadResult | null> {
  try {
    const { gsap } = await import('gsap');

    // Check if caller was destroyed during async import
    if (isDestroyed()) {
      return null;
    }

    return { gsap };
  } catch (error) {
    console.error('[GSAP] Failed to load:', error);
    return null;
  }
}
