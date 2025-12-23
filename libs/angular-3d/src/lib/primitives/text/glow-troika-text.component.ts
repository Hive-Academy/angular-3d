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
import { SceneGraphStore } from '../../store/scene-graph.store';

/**
 * Glow-enabled 3D text component for bloom post-processing effects.
 *
 * Creates text with emissive glow that integrates with Three.js bloom.
 * Supports animated pulsing and configurable glow intensity.
 *
 * @example
 * Static glow text:
 * ```html
 * <a3d-glow-troika-text
 *   text="GLOW EFFECT"
 *   [fontSize]="1.0"
 *   glowColor="#00ffff"
 *   [glowIntensity]="3.0"
 *   [pulseSpeed]="0"
 *   [position]="[0, 0, 0]"
 * />
 * ```
 *
 * @example
 * Pulsing glow text:
 * ```html
 * <a3d-glow-troika-text
 *   text="PULSE"
 *   [fontSize]="0.8"
 *   glowColor="#ff00ff"
 *   [glowIntensity]="2.5"
 *   [pulseSpeed]="0.5"
 *   [outlineWidthInput]="0.02"
 * />
 * ```
 *
 * @remarks
 * - REQUIRES bloom post-processing to be visible (BloomEffectComponent)
 * - Uses toneMapped: false material for values > 1.0
 * - Higher glowIntensity = brighter bloom pickup
 * - pulseSpeed of 0 disables pulsing animation
 */
@Component({
  selector: 'a3d-glow-troika-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `glow-troika-text-${crypto.randomUUID()}`,
    },
  ],
})
export class GlowTroikaTextComponent {
  // ========================================
  // CORE TEXT PROPERTIES (from TroikaTextComponent)
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
   * Outline blur radius in world units (number) or as percentage string.
   * @default 0 (sharp outline)
   */
  public readonly outlineBlur = input<number | string>(0);

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

  // ========================================
  // GLOW-SPECIFIC PROPERTIES
  // ========================================

  /**
   * Glow color as CSS string or numeric hex value.
   * This color will be multiplied by glowIntensity for bloom effect.
   * @default '#00ffff'
   */
  public readonly glowColor = input<string | number>('#00ffff');

  /**
   * Glow intensity multiplier for bloom post-processing.
   * Values > 1.0 are required for bloom to pick up the glow.
   * Higher values = brighter bloom effect.
   * @default 2.5
   */
  public readonly glowIntensity = input<number>(2.5);

  /**
   * Pulse animation speed in cycles per second.
   * Set to 0 to disable pulsing animation.
   * @default 1.0
   */
  public readonly pulseSpeed = input<number>(1.0);

  /**
   * Outline/stroke width in world units (number) or as percentage string.
   * Provides definition against bright backgrounds.
   * @default 0.02
   */
  public readonly glowOutlineWidth = input<number | string>(0.02);

  // ========================================
  // DEPENDENCY INJECTION
  // ========================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService);
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly objectId = inject(OBJECT_ID);

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
  private cleanupPulseLoop?: () => void;

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
            this.sceneStore.register(this.objectId, this.textObject, 'mesh');
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
          this.sceneStore.remove(this.objectId);
          this.textObject.dispose();
          this.textObject = undefined;
        }
      });
    });

    // Effect: Create glow material with bloom support
    effect(() => {
      if (!this.textObject) return;

      // Create glow material with toneMapped: false (CRITICAL for bloom)
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color(this.glowColor()),
        toneMapped: false, // Allows values > 1.0 for bloom
      });

      // Apply intensity multiplier for bloom effect
      const baseIntensity = this.glowIntensity();
      glowMaterial.color.multiplyScalar(baseIntensity);

      this.textObject.material = glowMaterial;
      this.textObject.outlineWidth = this.glowOutlineWidth();
      this.textObject.outlineColor = '#000000';
      this.textObject.outlineOpacity = 1;

      this.textObject.sync();
    });

    // Effect: Pulse animation
    effect(() => {
      if (this.pulseSpeed() === 0) {
        // No pulsing - cleanup if active
        if (this.cleanupPulseLoop) {
          this.cleanupPulseLoop();
          this.cleanupPulseLoop = undefined;
        }
        return;
      }

      if (!this.textObject) return;

      // Register pulse animation callback
      this.cleanupPulseLoop = this.renderLoop.registerUpdateCallback(
        (_delta, elapsed) => {
          const material = this.textObject?.material;
          if (!material || !(material instanceof THREE.MeshBasicMaterial))
            return;

          // Sine wave pulse: oscillates between 0.7 and 1.3 of base intensity
          const pulse =
            Math.sin(elapsed * this.pulseSpeed() * Math.PI * 2) * 0.3 + 1.0;
          const intensity = this.glowIntensity() * pulse;

          // Reset color and apply new intensity
          const baseColor = new THREE.Color(this.glowColor());
          material.color.copy(baseColor).multiplyScalar(intensity);
        }
      );
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
      this.cleanupPulseLoop?.();
      this.sceneStore.remove(this.objectId);
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
    this.textObject.outlineBlur = this.outlineBlur();

    // Advanced
    this.textObject.sdfGlyphSize = this.sdfGlyphSize();
    this.textObject.glyphGeometryDetail = this.glyphGeometryDetail();
    this.textObject.gpuAccelerateSDF = this.gpuAccelerateSDF();
    this.textObject.depthOffset = this.depthOffset();

    // Transform
    this.textObject.position.set(...this.position());
    this.textObject.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] =
      typeof s === 'number' ? [s, s, s] : s;
    this.textObject.scale.set(...scale);
  }
}
