/**
 * Type declarations for troika-three-text
 *
 * troika-three-text v0.52.4 doesn't ship with TypeScript declarations,
 * so we provide our own based on the library's API.
 *
 * @see https://protectwise.github.io/troika/troika-three-text/
 */

declare module 'troika-three-text' {
  import type { Mesh, Material, Color, Vector3, Euler } from 'three';

  export interface TextSyncCallback {
    (): void;
  }

  /**
   * The Text class creates a single 3D text block.
   * It extends THREE.Mesh with additional text-specific properties.
   */
  export class Text extends Mesh {
    // Core text properties
    text: string;
    font: string | null;
    fontSize: number;
    fontStyle: 'normal' | 'italic';
    fontWeight: string | number;

    // Color properties
    color: string | number | Color;
    fillOpacity: number;

    // Layout properties
    maxWidth: number;
    textAlign: 'left' | 'right' | 'center' | 'justify';
    anchorX: number | string;
    anchorY: number | string;
    lineHeight: number | string;
    letterSpacing: number;
    whiteSpace: 'normal' | 'nowrap';
    overflowWrap: 'normal' | 'break-word';

    // Outline properties
    outlineWidth: number | string;
    outlineColor: string | number | Color;
    outlineBlur: number | string;
    outlineOpacity: number;

    // Advanced rendering properties
    sdfGlyphSize: number;
    glyphGeometryDetail: number;
    gpuAccelerateSDF: boolean;
    depthOffset: number;

    // Material override (redeclared for proper typing)
    material: Material;

    /**
     * Synchronize the text rendering.
     * Call this after changing properties to update the rendered text.
     * @param callback - Optional callback fired when sync completes
     */
    sync(callback?: TextSyncCallback): void;

    /**
     * Dispose of all resources used by the text object.
     */
    dispose(): void;
  }

  export interface PreloadFontOptions {
    font: string;
    characters?: string;
    sdfGlyphSize?: number;
  }

  export interface PreloadFontCallback {
    (): void;
  }

  /**
   * Preload a font file to cache it for future use.
   * @param options - Font preload configuration
   * @param callback - Called when preloading is complete
   */
  export function preloadFont(
    options: PreloadFontOptions,
    callback: PreloadFontCallback
  ): void;

  /**
   * Configure the text builder with custom settings.
   */
  export function configureTextBuilder(config: {
    sdfGlyphSize?: number;
    sdfExponent?: number;
  }): void;
}
