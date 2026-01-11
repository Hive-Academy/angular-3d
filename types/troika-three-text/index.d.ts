/**
 * Type declarations for troika-three-text
 *
 * This library provides high-quality 3D text rendering for Three.js using SDF fonts.
 * Since there are no official @types/troika-three-text definitions, we provide our own.
 *
 * @see https://protectwise.github.io/troika/troika-three-text/
 */
declare module 'troika-three-text' {
  import * as THREE from 'three';

  /**
   * Text class for rendering 3D text using Signed Distance Fields (SDF).
   * Extends THREE.Mesh and provides high-quality, performant text rendering.
   */
  export class Text extends THREE.Mesh {
    // Core text properties
    public text: string;
    public font: string | null;
    public fontSize: number;
    public fontStyle: 'normal' | 'italic';
    public fontWeight: string | number;
    public color: string | number | THREE.Color;

    // Layout properties
    public maxWidth: number;
    public textAlign: 'left' | 'right' | 'center' | 'justify';
    public anchorX: number | string;
    public anchorY: number | string;
    public lineHeight: number | string;
    public letterSpacing: number;
    public whiteSpace: 'normal' | 'nowrap';
    public overflowWrap: 'normal' | 'break-word';

    // Styling properties
    public fillOpacity: number;
    public outlineWidth: number | string;
    public outlineColor: string | number | THREE.Color;
    public outlineBlur: number | string;
    public outlineOpacity: number;

    // Advanced rendering properties
    public sdfGlyphSize: number;
    public glyphGeometryDetail: number;
    public gpuAccelerateSDF: boolean;
    public depthOffset: number;

    // Custom material override
    public material: THREE.Material;

    /**
     * Synchronizes the text rendering after property changes.
     * Call this after modifying text properties to update the mesh.
     * @param callback - Optional callback invoked when sync is complete
     */
    public sync(callback?: () => void): void;

    /**
     * Disposes of all resources used by this Text instance.
     */
    public dispose(): void;
  }

  /**
   * Preload a font and optionally pre-generate glyph SDF textures.
   *
   * @param options - Font preload configuration
   * @param callback - Called when preloading is complete
   */
  export function preloadFont(
    options: {
      font: string;
      characters?: string;
      sdfGlyphSize?: number;
    },
    callback?: () => void
  ): void;
}
