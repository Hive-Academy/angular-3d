import { Injectable } from '@angular/core';

/**
 * TextSamplingService - Shared text pixel sampling for particle text components
 *
 * Provides reusable text sampling logic to eliminate ~450 lines of duplicated code
 * across InstancedParticleText, SmokeParticleText, and GlowParticleText components.
 *
 * Features:
 * - Canvas-based text rendering and pixel sampling
 * - Configurable sampling density (every pixel vs every Nth pixel)
 * - Normalized coordinate output for 3D positioning
 * - Memory-efficient (no canvas pooling - components use different params)
 *
 * @example
 * ```typescript
 * const positions = textSamplingService.sampleTextPositions('HELLO', 100, 2);
 * // Returns [[x1, y1], [x2, y2], ...] in normalized coordinates
 * ```
 */
@Injectable({ providedIn: 'root' })
export class TextSamplingService {
  /**
   * Sample pixel positions from canvas-rendered text
   *
   * @param text - Text string to sample
   * @param fontSize - Canvas font size in pixels
   * @param sampleStep - Pixel sampling step (1 = every pixel, 2 = every 2nd pixel)
   * @returns Array of [x, y] positions in normalized coordinates
   */
  public sampleTextPositions(
    text: string,
    fontSize: number,
    sampleStep = 2
  ): [number, number][] {
    // Create temporary canvas for text rendering
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    // Calculate canvas dimensions
    const padding = 20;
    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Render text to canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Sample pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const positions: [number, number][] = [];

    // Sample based on step parameter
    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];

        // Check if pixel is part of text (alpha > threshold)
        if (alpha > 128) {
          // Normalize to centered coordinates relative to font size
          const nx = (x - canvas.width / 2) / fontSize;
          const ny = -(y - canvas.height / 2) / fontSize; // Invert Y for 3D space
          positions.push([nx, ny]);
        }
      }
    }

    return positions;
  }
}
