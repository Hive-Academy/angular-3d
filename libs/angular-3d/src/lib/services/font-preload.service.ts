import { Injectable } from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries -- troika-three-text is external npm package, not an app
import { preloadFont } from 'troika-three-text';

/**
 * Service for preloading fonts before text components are rendered.
 *
 * Use this service to preload fonts during application initialization
 * to prevent loading delays when text components are first displayed.
 *
 * @example
 * Preload single font in APP_INITIALIZER:
 * ```typescript
 * export function initializeApp(fontPreload: FontPreloadService) {
 *   return () => fontPreload.preload({
 *     font: '/assets/fonts/Roboto-Regular.ttf'
 *   });
 * }
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     {
 *       provide: APP_INITIALIZER,
 *       useFactory: initializeApp,
 *       deps: [FontPreloadService],
 *       multi: true
 *     }
 *   ]
 * };
 * ```
 *
 * @example
 * Preload multiple fonts:
 * ```typescript
 * await fontPreload.preloadMultiple([
 *   { font: '/assets/fonts/Roboto-Regular.ttf' },
 *   { font: '/assets/fonts/Roboto-Bold.ttf' }
 * ]);
 * ```
 *
 * @example
 * Preload with specific character set:
 * ```typescript
 * await fontPreload.preload({
 *   font: '/assets/fonts/Roboto-Regular.ttf',
 *   characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
 * });
 * ```
 */
@Injectable({ providedIn: 'root' })
export class FontPreloadService {
  /**
   * Preload a font file with optional character set.
   *
   * @param options - Font preload configuration
   * @param options.font - URL or path to font file (TTF, OTF, WOFF)
   * @param options.characters - Optional character set to preload (e.g., 'ABC123')
   * @param options.sdfGlyphSize - Optional SDF glyph size (default: 64)
   * @returns Promise that resolves when font is loaded
   */
  public preload(options: {
    font: string;
    characters?: string;
    sdfGlyphSize?: number;
  }): Promise<void> {
    return new Promise((resolve) => {
      preloadFont(options, () => resolve());
    });
  }

  /**
   * Preload multiple fonts in parallel.
   *
   * @param fonts - Array of font configurations
   * @returns Promise that resolves when all fonts are loaded
   */
  public preloadMultiple(
    fonts: Array<{ font: string; characters?: string; sdfGlyphSize?: number }>
  ): Promise<void[]> {
    return Promise.all(fonts.map((f) => this.preload(f)));
  }
}
