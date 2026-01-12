// Metaball Sphere Component - Declarative sphere definition
import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { MetaballPositionPreset, POSITION_PRESET_COORDS } from './presets';

/**
 * Orbit configuration for animated spheres
 */
export interface MetaballOrbitConfig {
  /** Orbit radius (0-1 normalized, scaled by movement settings) */
  radius: number;
  /** Animation speed multiplier */
  speed: number;
  /** Phase offset in radians (0 = default, Math.PI = opposite phase) */
  phase?: number;
}

/**
 * MetaballSphereComponent - Declarative sphere definition for metaball scenes
 *
 * Can define spheres in three ways:
 * 1. **Position preset**: Use named positions like 'top-left', 'center'
 * 2. **Custom position**: Exact normalized coordinates [x, y] (0-1 range)
 * 3. **Animated orbit**: Moving sphere with configurable orbit
 *
 * Priority: orbit > position > positionPreset
 *
 * @example
 * ```html
 * <!-- Fixed corner sphere -->
 * <a3d-metaball-sphere positionPreset="top-left" [radius]="1.2" />
 *
 * <!-- Custom positioned sphere -->
 * <a3d-metaball-sphere [position]="[0.3, 0.7]" [radius]="0.4" />
 *
 * <!-- Animated orbiting sphere -->
 * <a3d-metaball-sphere [orbit]="{ radius: 0.5, speed: 0.4 }" [radius]="0.15" />
 * ```
 */
@Component({
  selector: 'a3d-metaball-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class MetaballSphereComponent {
  /**
   * Named position preset (e.g., 'top-left', 'center', 'bottom-right')
   * Lowest priority - used only if position and orbit are not set
   */
  public readonly positionPreset = input<MetaballPositionPreset>();

  /**
   * Custom position as normalized screen coordinates [x, y]
   * Range: 0-1 where [0,0] = bottom-left, [1,1] = top-right
   * Medium priority - overrides positionPreset
   */
  public readonly position = input<[number, number]>();

  /**
   * Animated orbit configuration
   * Highest priority - if set, sphere will animate in an orbit pattern
   */
  public readonly orbit = input<MetaballOrbitConfig>();

  /**
   * Sphere radius (in world units, typical range 0.1 - 1.5)
   */
  public readonly radius = input<number>(0.15);

  /**
   * Blend smoothness with other spheres (0.01 - 1.0)
   * Higher values create smoother, more organic connections
   */
  public readonly blendSmoothness = input<number>(0.05);

  /**
   * Get the resolved normalized position for this sphere
   * Returns null if sphere is animated (uses orbit)
   */
  public getPosition(): [number, number] | null {
    // Check orbit first (animated spheres don't have static position)
    if (this.orbit()) {
      return null;
    }

    // Check custom position
    const pos = this.position();
    if (pos) {
      return pos;
    }

    // Fall back to position preset
    const preset = this.positionPreset();
    if (preset) {
      return POSITION_PRESET_COORDS[preset];
    }

    // Default to center if nothing specified
    return [0.5, 0.5];
  }

  /**
   * Check if this sphere is animated
   */
  public isAnimated(): boolean {
    return !!this.orbit();
  }
}
