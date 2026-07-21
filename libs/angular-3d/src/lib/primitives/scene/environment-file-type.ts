/**
 * Environment source file-type detection.
 *
 * Extracted from EnvironmentComponent so the routing logic is unit-testable
 * without importing three-stdlib loaders.
 */

/**
 * Supported environment file types and their loaders:
 * - 'hdr'  -> RGBELoader (Radiance HDR)
 * - 'exr'  -> EXRLoader (OpenEXR)
 * - 'ldr'  -> THREE.TextureLoader (jpg/jpeg/png/webp equirectangular images)
 */
export type EnvironmentFileType = 'hdr' | 'exr' | 'ldr';

/** LDR image extensions loaded via THREE.TextureLoader */
const LDR_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'] as const;

/**
 * Detects environment file type from URL/path extension.
 *
 * Query strings and hash fragments are ignored so CDN URLs like
 * `/env.jpg?v=2` route correctly.
 *
 * Defaults to 'hdr' for `.hdr` files or URLs without a recognized
 * extension (backward-compatible with the previous behavior).
 */
export function detectFileType(url: string): EnvironmentFileType {
  // Strip query string / fragment before extension matching
  const lowerUrl = url.toLowerCase().split(/[?#]/)[0];

  if (lowerUrl.endsWith('.exr')) {
    return 'exr';
  }

  if (LDR_EXTENSIONS.some((ext) => lowerUrl.endsWith(ext))) {
    return 'ldr';
  }

  // Default to HDR for .hdr files or URLs without clear extension
  return 'hdr';
}
