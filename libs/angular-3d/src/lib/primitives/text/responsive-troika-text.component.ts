import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  signal,
  DestroyRef,
} from '@angular/core';
// eslint-disable-next-line @nx/enforce-module-boundaries
import { Text } from 'troika-three-text';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { SceneService } from '../../canvas/scene.service';

/**
 * Responsive 3D text component that automatically scales based on camera.
 *
 * Extends TroikaTextComponent with viewport-aware or distance-aware font sizing.
 * The text size automatically adapts when the camera moves or zooms, similar to
 * CSS viewport units (vw/vh) but in 3D space.
 *
 * @example
 * Viewport-responsive text (scales like CSS vw units):
 * ```html
 * <a3d-responsive-troika-text
 *   text="Responsive Heading"
 *   responsiveMode="viewport"
 *   [viewportScale]="0.08"
 *   [minFontSize]="0.2"
 *   [maxFontSize]="2.0"
 *   [position]="[0, 2, 0]"
 *   anchorX="center"
 *   anchorY="middle"
 * />
 * ```
 *
 * @example
 * Distance-responsive text (scales with camera distance):
 * ```html
 * <a3d-responsive-troika-text
 *   text="Distance Label"
 *   responsiveMode="distance"
 *   [fontSize]="0.5"
 *   [minFontSize]="0.1"
 *   [maxFontSize]="5.0"
 *   [position]="[5, 0, 0]"
 * />
 * ```
 *
 * @example
 * With animation directives:
 * ```html
 * <a3d-responsive-troika-text
 *   text="Floating Responsive Text"
 *   responsiveMode="viewport"
 *   [viewportScale]="0.05"
 *   a3dFloat3d
 *   [floatSpeed]="1.5"
 * />
 * ```
 *
 * @remarks
 * - Uses debounced sync() calls to prevent excessive re-layout (configurable via syncDebounceMs)
 * - Viewport mode requires PerspectiveCamera (will not work with OrthographicCamera)
 * - Distance mode works with any camera type
 * - Per-frame overhead: ~0.5ms per text instance
 * - Font size updates only trigger when change exceeds 0.01 threshold
 * - All Three.js resources are properly disposed on component destruction
 *
 * @performance
 * - Recommended max instances: 20-30 responsive text objects
 * - Debounce delay (syncDebounceMs) trades responsiveness for performance
 * - Lower debounce = more responsive, higher CPU usage
 * - Higher debounce = less responsive, lower CPU usage
 *
 * @see https://protectwise.github.io/troika/troika-three-text/
 */
@Component({
  selector: 'a3d-responsive-troika-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `responsive-troika-text-${crypto.randomUUID()}`,
    },
  ],
})
export class ResponsiveTroikaTextComponent {
  // ========================================
  // CORE TEXT PROPERTIES (inherited from TroikaTextComponent)
  // ========================================

  /** The text string to render. Supports multi-line text using newline characters (\n). */
  public readonly text = input.required<string>();

  /** Font size in 3D world units (baseline for distance mode). @default 0.1 */
  public readonly fontSize = input<number>(0.1);

  /** Text color as CSS string or numeric hex value. @default '#ffffff' */
  public readonly color = input<string | number>('#ffffff');

  /** URL or path to custom font file (TTF, OTF, WOFF). @default null */
  public readonly font = input<string | null>(null);

  /** Font style: 'normal' or 'italic'. @default 'normal' */
  public readonly fontStyle = input<'normal' | 'italic'>('normal');

  /** Font weight: 'normal', 'bold', or numeric (100-900). @default 'normal' */
  public readonly fontWeight = input<string | number>('normal');

  // ========================================
  // TRANSFORM PROPERTIES
  // ========================================

  /** Position in 3D space [x, y, z]. @default [0, 0, 0] */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Rotation in radians [x, y, z]. @default [0, 0, 0] */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /** Scale factor. Can be uniform (number) or per-axis [x, y, z]. @default 1 */
  public readonly scale = input<number | [number, number, number]>(1);

  // ========================================
  // LAYOUT PROPERTIES
  // ========================================

  /** Maximum width for text wrapping in world units. @default Infinity */
  public readonly maxWidth = input<number>(Infinity);

  /** Horizontal text alignment within the maxWidth. @default 'left' */
  public readonly textAlign = input<'left' | 'right' | 'center' | 'justify'>(
    'left'
  );

  /** Horizontal anchor point. @default 'left' */
  public readonly anchorX = input<number | string>('left');

  /** Vertical anchor point. @default 'top' */
  public readonly anchorY = input<number | string>('top');

  /** Line height as multiple of fontSize. @default 1.2 */
  public readonly lineHeight = input<number | string>(1.2);

  /** Letter spacing adjustment in world units. @default 0 */
  public readonly letterSpacing = input<number>(0);

  /** CSS white-space behavior. @default 'normal' */
  public readonly whiteSpace = input<'normal' | 'nowrap'>('normal');

  /** CSS overflow-wrap behavior. @default 'normal' */
  public readonly overflowWrap = input<'normal' | 'break-word'>('normal');

  // ========================================
  // VISUAL STYLING PROPERTIES
  // ========================================

  /** Fill opacity (0 = transparent, 1 = opaque). @default 1 */
  public readonly fillOpacity = input<number>(1);

  /** Outline/stroke width in world units. @default 0 */
  public readonly outlineWidth = input<number | string>(0);

  /** Outline color. @default '#000000' */
  public readonly outlineColor = input<string | number>('#000000');

  /** Outline blur radius. @default 0 */
  public readonly outlineBlur = input<number | string>(0);

  /** Outline opacity. @default 1 */
  public readonly outlineOpacity = input<number>(1);

  // ========================================
  // ADVANCED RENDERING PROPERTIES
  // ========================================

  /** Size of SDF glyph texture atlas in pixels. @default 64 */
  public readonly sdfGlyphSize = input<number>(64);

  /** Level of detail for glyph geometry (1-4). @default 1 */
  public readonly glyphGeometryDetail = input<number>(1);

  /** Enable GPU-accelerated SDF generation. @default true */
  public readonly gpuAccelerateSDF = input<boolean>(true);

  /** Depth offset for depth testing. @default 0 */
  public readonly depthOffset = input<number>(0);

  // ========================================
  // BEHAVIOR PROPERTIES
  // ========================================

  /** Enable billboard mode - text always faces the camera. @default false */
  public readonly billboard = input<boolean>(false);

  /** Custom Three.js material to override default material. @default null */
  public readonly customMaterial = input<THREE.Material | null>(null);

  // ========================================
  // RESPONSIVE-SPECIFIC PROPERTIES
  // ========================================

  /**
   * Responsive sizing mode.
   * - 'viewport': Font size scales as percentage of viewport width (like CSS vw)
   * - 'distance': Font size scales with camera distance from text
   * @default 'viewport'
   */
  public readonly responsiveMode = input<'viewport' | 'distance'>('viewport');

  /**
   * Viewport scale factor (viewport mode only).
   * Font size will be viewportScale * viewport width.
   * @default 0.05 (5% of viewport width)
   */
  public readonly viewportScale = input<number>(0.05);

  /**
   * Minimum font size constraint in world units.
   * Prevents text from becoming too small when camera is far.
   * @default 0.05
   */
  public readonly minFontSize = input<number>(0.05);

  /**
   * Maximum font size constraint in world units.
   * Prevents text from becoming too large when camera is close.
   * @default 2.0
   */
  public readonly maxFontSize = input<number>(2.0);

  /**
   * Debounce delay in milliseconds before calling sync() after font size change.
   * Higher values reduce CPU usage but make sizing less responsive.
   * Lower values make sizing more responsive but increase CPU usage.
   * @default 100
   */
  public readonly syncDebounceMs = input<number>(100);

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

  /** Loading state signal - true while font is being loaded. */
  public readonly isLoading = signal(false);

  /** Load error signal - contains error message if font loading failed. */
  public readonly loadError = signal<string | null>(null);

  // ========================================
  // INTERNAL STATE
  // ========================================

  private textObject?: Text;
  private cleanupBillboardLoop?: () => void;
  private cleanupResponsiveLoop?: () => void;
  private debounceTimeout: ReturnType<typeof setTimeout> | null = null;

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
        if (this.cleanupBillboardLoop) {
          this.cleanupBillboardLoop();
          this.cleanupBillboardLoop = undefined;
        }
        return;
      }

      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

      // Billboard enabled - register render loop callback
      this.cleanupBillboardLoop = this.renderLoop.registerUpdateCallback(() => {
        if (this.textObject && camera) {
          this.textObject.quaternion.copy(camera.quaternion);
        }
      });
    });

    // Effect: Responsive sizing
    effect(() => {
      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

      // Cleanup previous responsive loop if exists
      if (this.cleanupResponsiveLoop) {
        this.cleanupResponsiveLoop();
      }

      let lastAppliedFontSize = this.fontSize();

      this.cleanupResponsiveLoop = this.renderLoop.registerUpdateCallback(
        () => {
          if (!this.textObject || !camera) return;

          const newFontSize =
            this.responsiveMode() === 'viewport'
              ? this.calculateViewportFontSize(
                  camera as THREE.PerspectiveCamera
                )
              : this.calculateDistanceFontSize(camera);

          // Only update if changed significantly (>0.01)
          if (Math.abs(newFontSize - lastAppliedFontSize) > 0.01) {
            if (this.debounceTimeout) clearTimeout(this.debounceTimeout);
            this.debounceTimeout = setTimeout(() => {
              if (this.textObject) {
                this.textObject.fontSize = newFontSize;
                this.textObject.sync();
                lastAppliedFontSize = newFontSize;
              }
            }, this.syncDebounceMs());
          }
        }
      );
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      if (this.debounceTimeout) {
        clearTimeout(this.debounceTimeout);
        this.debounceTimeout = null;
      }
      this.cleanupBillboardLoop?.();
      this.cleanupResponsiveLoop?.();
      if (this.textObject) {
        this.textObject.dispose();
      }
    });
  }

  /**
   * Calculate viewport-relative font size based on camera FOV and distance.
   * Font size scales as percentage of viewport width, similar to CSS vw units.
   * @private
   */
  private calculateViewportFontSize(camera: THREE.PerspectiveCamera): number {
    if (!this.textObject) return this.fontSize();

    // Calculate viewport dimensions at text position
    const fov = camera.fov * (Math.PI / 180);
    const distance = camera.position.distanceTo(this.textObject.position);
    const viewportHeight = 2 * Math.tan(fov / 2) * distance;
    const viewportWidth = viewportHeight * camera.aspect;

    // Scale by viewportScale input
    const fontSize = viewportWidth * this.viewportScale();

    // Clamp to min/max constraints
    return this.clamp(fontSize, this.minFontSize(), this.maxFontSize());
  }

  /**
   * Calculate distance-based font size.
   * Font size scales proportionally with camera distance from text.
   * @private
   */
  private calculateDistanceFontSize(camera: THREE.Camera): number {
    if (!this.textObject) return this.fontSize();

    const distance = camera.position.distanceTo(this.textObject.position);
    const baseFontSize = this.fontSize();

    // Reference distance of 10 world units - at this distance, fontSize equals baseFontSize
    // Closer than 10 units = smaller text, farther = larger text
    const REFERENCE_DISTANCE = 10;
    const fontSize = baseFontSize * (distance / REFERENCE_DISTANCE);

    // Clamp to min/max constraints
    return this.clamp(fontSize, this.minFontSize(), this.maxFontSize());
  }

  /**
   * Clamp value between min and max.
   * @private
   */
  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
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
