// Metaball Cursor Component - Mouse-following sphere with glow
import { Component, input, ChangeDetectionStrategy } from '@angular/core';

/**
 * MetaballCursorComponent - Cursor-following sphere with glow effect
 *
 * Defines a sphere that follows the mouse cursor and blends with
 * other metaball spheres. Features configurable glow effects.
 *
 * @example
 * ```html
 * <a3d-metaball-scene [preset]="'holographic'" [fullscreen]="true">
 *   <!-- Other spheres... -->
 *
 *   <!-- Cursor follower with glow -->
 *   <a3d-metaball-cursor
 *     [radiusMin]="0.08"
 *     [radiusMax]="0.15"
 *     [glowIntensity]="0.4"
 *     [glowRadius]="1.2"
 *   />
 * </a3d-metaball-scene>
 * ```
 */
@Component({
  selector: 'a3d-metaball-cursor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class MetaballCursorComponent {
  /**
   * Minimum cursor sphere radius (when far from other spheres)
   */
  public readonly radiusMin = input<number>(0.08);

  /**
   * Maximum cursor sphere radius (when near other spheres)
   */
  public readonly radiusMax = input<number>(0.15);

  /**
   * Glow effect intensity (0-2, higher = brighter glow)
   */
  public readonly glowIntensity = input<number>(0.4);

  /**
   * Glow effect radius (spread of the glow, 0.5-3)
   */
  public readonly glowRadius = input<number>(1.2);

  /**
   * Mouse movement smoothness (0.01-0.5, lower = smoother/slower)
   */
  public readonly smoothness = input<number>(0.1);

  /**
   * Blend smoothness with other spheres
   */
  public readonly blendSmoothness = input<number>(0.3);

  /**
   * Distance threshold for proximity-based radius scaling
   */
  public readonly proximityDistance = input<number>(1.5);
}
