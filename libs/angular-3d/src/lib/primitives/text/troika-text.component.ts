import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  signal,
  DestroyRef,
} from '@angular/core';
import { Text } from 'troika-three-text';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * Production-grade 3D text component using troika-three-text SDF rendering.
 *
 * Provides sharp, scalable text at any zoom level with full Unicode support.
 * Text is rendered using SDF (Signed Distance Field) technique, ensuring crisp
 * quality regardless of camera distance or zoom level.
 *
 * @example
 * Basic usage:
 * ```html
 * <a3d-troika-text
 *   text="Hello Three.js!"
 *   [fontSize]="0.5"
 *   color="#00ffff"
 *   [position]="[0, 0, 0]"
 *   anchorX="center"
 *   anchorY="middle"
 * />
 * ```
 *
 * @example
 * Multi-line text with layout:
 * ```html
 * <a3d-troika-text
 *   text="Line 1&#10;Line 2&#10;Line 3"
 *   [fontSize]="0.3"
 *   [maxWidth]="5"
 *   textAlign="center"
 *   [lineHeight]="1.5"
 *   anchorX="center"
 *   anchorY="middle"
 * />
 * ```
 *
 * @example
 * Text with outline and custom font:
 * ```html
 * <a3d-troika-text
 *   text="OUTLINED"
 *   [fontSize]="0.8"
 *   color="#ffffff"
 *   font="/assets/fonts/Roboto-Bold.ttf"
 *   [outlineWidth]="0.05"
 *   outlineColor="#000000"
 * />
 * ```
 *
 * @example
 * Billboard text that always faces camera:
 * ```html
 * <a3d-troika-text
 *   text="BILLBOARD"
 *   [fontSize]="0.5"
 *   [billboard]="true"
 *   [position]="[0, 2, 0]"
 * />
 * ```
 *
 * @example
 * With animation directives:
 * ```html
 * <a3d-troika-text
 *   text="Floating Text"
 *   [fontSize]="0.3"
 *   a3dFloat3d
 *   [floatSpeed]="1.5"
 *   [floatIntensity]="0.2"
 * />
 * ```
 *
 * @remarks
 * - Text is rendered using SDF (Signed Distance Field) for sharp quality at all scales
 * - Font loading is async with loading state feedback via isLoading() signal
 * - Supports ng-content for directive composition (a3dFloat3d, a3dRotate3d)
 * - Integrates with bloom post-processing when using customMaterial
 * - Full Unicode support (Latin, Arabic, Chinese, Japanese, Emoji)
 * - Text updates are reactive via signal inputs
 * - All Three.js resources are properly disposed on component destruction
 *
 * @see https://protectwise.github.io/troika/troika-three-text/
 */
@Component({
  selector: 'a3d-troika-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `troika-text-${crypto.randomUUID()}`,
    },
  ],
})
export class TroikaTextComponent {
  // ========================================
  // CORE TEXT PROPERTIES
  // ========================================

  /**
   * The text string to render.
   * Supports multi-line text using newline characters (\n).
   * @required
   */
  public readonly text = input.required<string>();

  /**
   * Font size in 3D world units.
   * @default 0.1
   */
  public readonly fontSize = input<number>(0.1);

  /**
   * Text color as CSS string or numeric hex value.
   * @default '#ffffff'
   */
  public readonly color = input<string | number>('#ffffff');

  /**
   * URL or path to custom font file (TTF, OTF, WOFF).
   * If null, uses the default font.
   * @default null
   */
  public readonly font = input<string | null>(null);

  /**
   * Font style: 'normal' or 'italic'.
   * @default 'normal'
   */
  public readonly fontStyle = input<'normal' | 'italic'>('normal');

  /**
   * Font weight: 'normal', 'bold', or numeric (100-900).
   * @default 'normal'
   */
  public readonly fontWeight = input<string | number>('normal');

  // ========================================
  // TRANSFORM PROPERTIES
  // ========================================

  /**
   * Position in 3D space [x, y, z].
   * @default [0, 0, 0]
   */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /**
   * Rotation in radians [x, y, z].
   * @default [0, 0, 0]
   */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /**
   * Scale factor. Can be uniform (number) or per-axis [x, y, z].
   * @default 1
   */
  public readonly scale = input<number | [number, number, number]>(1);

  // ========================================
  // LAYOUT PROPERTIES
  // ========================================

  /**
   * Maximum width for text wrapping in world units.
   * Text will wrap to multiple lines if it exceeds this width.
   * @default Infinity (no wrapping)
   */
  public readonly maxWidth = input<number>(Infinity);

  /**
   * Horizontal text alignment within the maxWidth.
   * @default 'left'
   */
  public readonly textAlign = input<'left' | 'right' | 'center' | 'justify'>(
    'left'
  );

  /**
   * Horizontal anchor point as percentage string ('left', 'center', 'right')
   * or numeric value (0 = left edge, 0.5 = center, 1 = right edge).
   * @default 'left'
   */
  public readonly anchorX = input<number | string>('left');

  /**
   * Vertical anchor point as percentage string ('top', 'middle', 'bottom')
   * or numeric value (0 = top edge, 0.5 = middle, 1 = bottom edge).
   * @default 'top'
   */
  public readonly anchorY = input<number | string>('top');

  /**
   * Line height as multiple of fontSize (number) or absolute value (string with units).
   * @default 1.2
   */
  public readonly lineHeight = input<number | string>(1.2);

  /**
   * Letter spacing adjustment in world units.
   * Positive values increase spacing, negative values decrease.
   * @default 0
   */
  public readonly letterSpacing = input<number>(0);

  /**
   * CSS white-space behavior: 'normal' or 'nowrap'.
   * @default 'normal'
   */
  public readonly whiteSpace = input<'normal' | 'nowrap'>('normal');

  /**
   * CSS overflow-wrap behavior: 'normal' or 'break-word'.
   * @default 'normal'
   */
  public readonly overflowWrap = input<'normal' | 'break-word'>('normal');

  // ========================================
  // VISUAL STYLING PROPERTIES
  // ========================================

  /**
   * Fill opacity (0 = transparent, 1 = opaque).
   * @default 1
   */
  public readonly fillOpacity = input<number>(1);

  /**
   * Outline/stroke width in world units (number) or as percentage string.
   * Set to 0 to disable outline.
   * @default 0
   */
  public readonly outlineWidth = input<number | string>(0);

  /**
   * Outline color as CSS string or numeric hex value.
   * @default '#000000'
   */
  public readonly outlineColor = input<string | number>('#000000');

  /**
   * Outline blur radius in world units (number) or as percentage string.
   * @default 0 (sharp outline)
   */
  public readonly outlineBlur = input<number | string>(0);

  /**
   * Outline opacity (0 = transparent, 1 = opaque).
   * @default 1
   */
  public readonly outlineOpacity = input<number>(1);

  // ========================================
  // ADVANCED RENDERING PROPERTIES
  // ========================================

  /**
   * Size of SDF glyph texture atlas in pixels.
   * Higher values = better quality but more memory.
   * @default 64
   */
  public readonly sdfGlyphSize = input<number>(64);

  /**
   * Level of detail for glyph geometry (1-4).
   * Higher values = smoother curves but more vertices.
   * @default 1
   */
  public readonly glyphGeometryDetail = input<number>(1);

  /**
   * Enable GPU-accelerated SDF generation (requires WebGL2).
   * Falls back to CPU if unavailable.
   * @default true
   */
  public readonly gpuAccelerateSDF = input<boolean>(true);

  /**
   * Depth offset for depth testing.
   * Useful for preventing z-fighting.
   * @default 0
   */
  public readonly depthOffset = input<number>(0);

  // ========================================
  // BEHAVIOR PROPERTIES
  // ========================================

  /**
   * Enable billboard mode - text always faces the camera.
   * Useful for labels and UI elements in 3D space.
   * @default false
   */
  public readonly billboard = input<boolean>(false);

  /**
   * Custom Three.js material to override default material.
   * Useful for glow effects, bloom integration, or custom shaders.
   * @default null (uses troika's default material)
   */
  public readonly customMaterial = input<THREE.Material | null>(null);

  // ========================================
  // DEPENDENCY INJECTION
  // ========================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService);

  // ========================================
  // STATE SIGNALS
  // ========================================

  /**
   * Loading state signal - true while font is being loaded.
   * Useful for displaying loading indicators in UI.
   */
  public readonly isLoading = signal(false);

  /**
   * Load error signal - contains error message if font loading failed.
   * Null if no error or font loaded successfully.
   */
  public readonly loadError = signal<string | null>(null);

  // ========================================
  // INTERNAL STATE
  // ========================================

  private textObject?: Text;
  private cleanupRenderLoop?: () => void;

  public constructor() {
    // Effect: Initialize and update text
    effect((onCleanup) => {
      const textContent = this.text();
      const parent = this.parent();

      if (!textContent || !parent) return;

      this.isLoading.set(true);
      this.loadError.set(null);

      // Create or update text object
      if (!this.textObject) {
        this.textObject = new Text();
        this.updateAllTextProperties();

        // Sync and add to parent
        this.textObject.sync(() => {
          if (this.textObject && parent) {
            parent.add(this.textObject);
            this.isLoading.set(false);
          }
        });
      } else {
        this.updateAllTextProperties();
        this.textObject.sync(() => {
          this.isLoading.set(false);
        });
      }

      onCleanup(() => {
        if (this.textObject && parent) {
          parent.remove(this.textObject);
          this.textObject.dispose();
          this.textObject = undefined;
        }
      });
    });

    // Effect: Billboard rotation (optional)
    effect(() => {
      if (!this.billboard()) {
        // Billboard disabled - cleanup if active
        if (this.cleanupRenderLoop) {
          this.cleanupRenderLoop();
          this.cleanupRenderLoop = undefined;
        }
        return;
      }

      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

      // Billboard enabled - register render loop callback
      this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback(() => {
        if (this.textObject && camera) {
          this.textObject.quaternion.copy(camera.quaternion);
        }
      });
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.cleanupRenderLoop?.();
      if (this.textObject) {
        this.textObject.dispose();
      }
    });
  }

  /**
   * Update all text properties from signal inputs.
   * Called whenever text is created or signal inputs change.
   * @private
   */
  private updateAllTextProperties(): void {
    if (!this.textObject) return;

    // Text content & font
    this.textObject.text = this.text();
    this.textObject.fontSize = this.fontSize();
    this.textObject.color = this.color();
    if (this.font()) this.textObject.font = this.font();
    this.textObject.fontStyle = this.fontStyle();
    this.textObject.fontWeight = this.fontWeight();

    // Layout
    this.textObject.maxWidth = this.maxWidth();
    this.textObject.textAlign = this.textAlign();
    this.textObject.anchorX = this.anchorX();
    this.textObject.anchorY = this.anchorY();
    this.textObject.lineHeight = this.lineHeight();
    this.textObject.letterSpacing = this.letterSpacing();
    this.textObject.whiteSpace = this.whiteSpace();
    this.textObject.overflowWrap = this.overflowWrap();

    // Styling
    this.textObject.fillOpacity = this.fillOpacity();
    this.textObject.outlineWidth = this.outlineWidth();
    this.textObject.outlineColor = this.outlineColor();
    this.textObject.outlineBlur = this.outlineBlur();
    this.textObject.outlineOpacity = this.outlineOpacity();

    // Advanced
    this.textObject.sdfGlyphSize = this.sdfGlyphSize();
    this.textObject.glyphGeometryDetail = this.glyphGeometryDetail();
    this.textObject.gpuAccelerateSDF = this.gpuAccelerateSDF();
    this.textObject.depthOffset = this.depthOffset();

    // Custom material
    if (this.customMaterial()) {
      this.textObject.material = this.customMaterial()!;
    }

    // Transform
    this.textObject.position.set(...this.position());
    this.textObject.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] =
      typeof s === 'number' ? [s, s, s] : s;
    this.textObject.scale.set(...scale);
  }
}
