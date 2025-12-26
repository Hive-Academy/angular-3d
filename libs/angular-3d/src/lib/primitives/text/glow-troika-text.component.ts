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
 * Glow-enabled 3D text component using Troika's NATIVE glow capabilities.
 *
 * Uses Troika's built-in `outlineColor`, `outlineWidth`, and `outlineBlur`
 * properties for proper neon glow effect WITHOUT bloom post-processing!
 *
 * @example
 * ```html
 * <a3d-glow-troika-text
 *   text="NEON GLOW"
 *   [fontSize]="1.0"
 *   glowColor="#00ffff"
 *   [glowIntensity]="1.5"
 *   [glowBlur]="0.5"
 * />
 * ```
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
  // CORE TEXT PROPERTIES
  // ========================================

  /** The text string to render. */
  public readonly text = input.required<string>();

  /** Font size in 3D world units. */
  public readonly fontSize = input<number>(0.1);

  /** URL or path to custom font file. */
  public readonly font = input<string | null>(null);

  /** Font style: 'normal' or 'italic'. */
  public readonly fontStyle = input<'normal' | 'italic'>('normal');

  /** Font weight: 'normal', 'bold', or numeric (100-900). */
  public readonly fontWeight = input<string | number>('normal');

  // ========================================
  // TRANSFORM PROPERTIES
  // ========================================

  /** Position in 3D space [x, y, z]. */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Rotation in radians [x, y, z]. */
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);

  /** Scale factor. Can be uniform or per-axis [x, y, z]. */
  public readonly scale = input<number | [number, number, number]>(1);

  // ========================================
  // LAYOUT PROPERTIES
  // ========================================

  /** Maximum width for text wrapping. */
  public readonly maxWidth = input<number>(Infinity);

  /** Horizontal text alignment. */
  public readonly textAlign = input<'left' | 'right' | 'center' | 'justify'>(
    'left'
  );

  /** Horizontal anchor point. */
  public readonly anchorX = input<number | string>('left');

  /** Vertical anchor point. */
  public readonly anchorY = input<number | string>('top');

  /** Line height as multiple of fontSize. */
  public readonly lineHeight = input<number | string>(1.2);

  /** Letter spacing in world units. */
  public readonly letterSpacing = input<number>(0);

  /** CSS white-space behavior. */
  public readonly whiteSpace = input<'normal' | 'nowrap'>('normal');

  /** CSS overflow-wrap behavior. */
  public readonly overflowWrap = input<'normal' | 'break-word'>('normal');

  // ========================================
  // VISUAL STYLING
  // ========================================

  /** Fill opacity (0-1). */
  public readonly fillOpacity = input<number>(1);

  // ========================================
  // GLOW PROPERTIES (Using Troika's native outline system)
  // ========================================

  /**
   * Glow/outline color - the neon glow color.
   * @default '#00ffff' (cyan)
   */
  public readonly glowColor = input<string | number>('#00ffff');

  /**
   * Main text fill color.
   * If null, uses glowColor (solid neon look).
   * @default '#ffffff' (white text with colored glow)
   */
  public readonly textColor = input<string | number | null>('#ffffff');

  /**
   * Glow blur amount - creates the soft glow effect!
   * Value is relative to fontSize (e.g., 0.3 = 30% of fontSize blur).
   * CRITICAL: This is the key property for the "glow" look!
   * @default 0.3
   */
  public readonly glowBlur = input<number | string>('30%');

  /**
   * Glow/outline width - how thick the glow extends.
   * Value is relative to fontSize (e.g., 0.15 = 15% of fontSize width).
   * @default '15%'
   */
  public readonly glowWidth = input<number | string>('15%');

  /**
   * Glow opacity (0-1).
   * @default 1
   */
  public readonly glowOpacity = input<number>(1);

  /**
   * Glow intensity multiplier (for emissive material).
   * Higher values make the glow brighter (works with bloom!).
   * @default 1.5
   */
  public readonly glowIntensity = input<number>(1.5);

  /**
   * Pulse animation speed (0 = disabled).
   * @default 0
   */
  public readonly pulseSpeed = input<number>(0);

  /**
   * Enable billboard mode - text always faces the camera.
   * @default false
   */
  public readonly billboard = input<boolean>(false);

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
  // STATE
  // ========================================

  public readonly isLoading = signal(false);
  public readonly loadError = signal<string | null>(null);

  private textObject?: Text;
  private cleanupRenderLoop?: () => void;
  private cleanupPulseLoop?: () => void;

  public constructor() {
    // Effect: Initialize and update text with glow properties
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

    // Effect: Apply glow material
    effect(() => {
      if (!this.textObject) return;

      // Create emissive material for bloom support + natural brightness
      const glowColorValue = new THREE.Color(this.glowColor());
      const textColorValue = this.textColor()
        ? new THREE.Color(this.textColor() as string | number)
        : glowColorValue.clone();

      // Use MeshBasicMaterial with color multiplier for emissive look
      const material = new THREE.MeshBasicMaterial({
        color: textColorValue.clone().multiplyScalar(this.glowIntensity()),
        transparent: true,
        opacity: this.fillOpacity(),
        toneMapped: false, // Allow HDR values for extra brightness
      });

      this.textObject.material = material;

      // CRITICAL: Apply Troika's native outline properties for REAL glow!
      this.textObject.outlineColor = glowColorValue;
      this.textObject.outlineWidth = this.glowWidth();
      this.textObject.outlineBlur = this.glowBlur(); // This creates the soft glow!
      this.textObject.outlineOpacity = this.glowOpacity();

      this.textObject.sync();
    });

    // Effect: Pulse animation
    effect(() => {
      if (this.pulseSpeed() === 0) {
        if (this.cleanupPulseLoop) {
          this.cleanupPulseLoop();
          this.cleanupPulseLoop = undefined;
        }
        return;
      }

      if (!this.textObject) return;

      this.cleanupPulseLoop = this.renderLoop.registerUpdateCallback(
        (_delta, elapsed) => {
          if (!this.textObject) return;

          // Pulse outline opacity for glow breathing effect
          const pulse =
            Math.sin(elapsed * this.pulseSpeed() * Math.PI * 2) * 0.2 + 0.8;
          this.textObject.outlineOpacity = this.glowOpacity() * pulse;
        }
      );
    });

    // Effect: Billboard
    effect(() => {
      if (!this.billboard()) {
        if (this.cleanupRenderLoop) {
          this.cleanupRenderLoop();
          this.cleanupRenderLoop = undefined;
        }
        return;
      }

      const camera = this.sceneService.camera();
      if (!camera || !this.textObject) return;

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

  private updateAllTextProperties(): void {
    if (!this.textObject) return;

    // Core text properties
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

    // Transform
    this.textObject.position.set(...this.position());
    this.textObject.rotation.set(...this.rotation());
    const s = this.scale();
    const scale: [number, number, number] =
      typeof s === 'number' ? [s, s, s] : s;
    this.textObject.scale.set(...scale);
  }
}
