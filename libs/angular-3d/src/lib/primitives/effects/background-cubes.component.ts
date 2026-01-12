import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { BackgroundCubeComponent } from '../scene/background-cube.component';

/**
 * CubeConfig - Configuration for a single background cube
 */
interface CubeConfig {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: number | string;
  rotation: [number, number, number];
}

/**
 * ZoneConfig - Distribution zone configuration
 */
interface ZoneConfig {
  x: { min: number; max: number };
  y: { min: number; max: number };
  z: { min: number; max: number };
}

/**
 * BackgroundCubesComponent - Collection manager for background cube decorations
 *
 * Generates multiple BackgroundCubeComponent instances distributed across defined zones
 * with an exclusion area to prevent overlapping with foreground content.
 *
 * Zone-based distribution:
 * - Top zone: Above exclusion area
 * - Bottom zone: Below exclusion area
 * - Left zone: Left of exclusion area
 * - Right zone: Right of exclusion area
 *
 * @example
 * ```html
 * <a3d-background-cubes
 *   [count]="180"
 *   [colorPalette]="[0x7b3ab3, 0x6a2ba7, 0x8a2be2]"
 *   [exclusionZone]="{ x: 12, y: 8 }"
 *   [sizeRange]="{ min: 0.8, max: 2.6 }"
 *   [depthRange]="{ min: -28, max: -8 }" />
 * ```
 */
@Component({
  selector: 'a3d-background-cubes',
  imports: [BackgroundCubeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (cube of cubes(); track cube.id) {
    <a3d-background-cube
      [position]="cube.position"
      [args]="cube.size"
      [color]="cube.color"
      [rotation]="cube.rotation"
    />
    }
  `,
})
export class BackgroundCubesComponent {
  /**
   * Total number of cubes to generate
   * Default: 180
   */
  public readonly count = input<number>(180);

  /**
   * Array of colors to randomly select from
   * Default: Purple/blue gradient palette
   */
  public readonly colorPalette = input<(number | string)[]>([
    0x7b3ab3, 0x6a2ba7, 0x8a2be2,
  ]);

  /**
   * Exclusion zone dimensions (foreground content area to avoid)
   * { x: half-width, y: half-height }
   * Default: { x: 12, y: 8 }
   */
  public readonly exclusionZone = input<{ x: number; y: number }>({
    x: 12,
    y: 8,
  });

  /**
   * Cube size range (random size between min and max)
   * Default: { min: 0.8, max: 2.6 }
   */
  public readonly sizeRange = input<{ min: number; max: number }>({
    min: 0.8,
    max: 2.6,
  });

  /**
   * Depth range (Z-axis position range)
   * Default: { min: -28, max: -8 }
   */
  public readonly depthRange = input<{ min: number; max: number }>({
    min: -28,
    max: -8,
  });

  /**
   * Distribution zones (viewport bounds)
   * Default: { x: [-30, 30], y: [-20, 20] }
   */
  public readonly viewportBounds = input<{ x: number; y: number }>({
    x: 30,
    y: 20,
  });

  /**
   * Computed cube configurations
   * Regenerates whenever inputs change
   */
  public readonly cubes = computed(() => this.generateCubes());

  /**
   * Generate cube configurations with zone-based distribution
   *
   * Zone Distribution System (Top View):
   *
   *     ┌─────────────────────────────────────────┐
   *     │                                         │
   *     │          TOP ZONE (Zone 0)              │ ← Full width viewport
   *     │                                         │
   *     ├───────┬─────────────────────┬───────────┤
   *     │       │                     │           │
   *     │ LEFT  │   EXCLUSION ZONE    │  RIGHT    │
   *     │ ZONE  │   (Content Area)    │  ZONE     │
   *     │ (Z 2) │   NO CUBES HERE     │  (Z 3)    │ ← Exclusion prevents
   *     │       │                     │           │   overlap with content
   *     ├───────┴─────────────────────┴───────────┤
   *     │                                         │
   *     │        BOTTOM ZONE (Zone 1)             │ ← Full width viewport
   *     │                                         │
   *     └─────────────────────────────────────────┘
   *
   * Coordinate System:
   * - X-axis: Horizontal (left-right), centered at 0
   * - Y-axis: Vertical (bottom-top), centered at 0
   * - Z-axis: Depth (back-front), configured via depthRange
   *
   * Zone Boundaries:
   * - TOP:    Y from exclusion.y to +bounds.y (above exclusion)
   * - BOTTOM: Y from -bounds.y to -exclusion.y (below exclusion)
   * - LEFT:   X from -bounds.x to -exclusion.x (left of exclusion)
   * - RIGHT:  X from exclusion.x to +bounds.x (right of exclusion)
   *
   * Distribution Algorithm:
   * 1. Divide total count evenly across 4 zones (floor division)
   * 2. Distribute remainder to first N zones (N = count % 4)
   * 3. Generate random positions within each zone's boundaries
   * 4. Each cube gets random size, color, rotation, float params
   *
   * Why 4 Zones?
   * - Ensures cubes surround content without overlap
   * - Maintains visual balance (top/bottom symmetry, left/right symmetry)
   * - Avoids clumping by distributing across viewport perimeter
   *
   * @returns Array of cube configurations with positions, sizes, colors, animations
   */
  private generateCubes(): CubeConfig[] {
    const count = this.count();
    const colorPalette = this.colorPalette();
    let exclusion = this.exclusionZone();
    const sizeRange = this.sizeRange();
    const depthRange = this.depthRange();
    const bounds = this.viewportBounds();

    // Validate and clamp exclusion zone to prevent invalid zones
    const maxExclusionPercent = 0.9; // Max 90% of viewport
    const maxExclusionX = bounds.x * maxExclusionPercent;
    const maxExclusionY = bounds.y * maxExclusionPercent;

    if (exclusion.x >= bounds.x || exclusion.y >= bounds.y) {
      console.warn(
        `[BackgroundCubes] Exclusion zone (${exclusion.x.toFixed(
          2
        )}, ${exclusion.y.toFixed(2)}) ` +
          `too large for viewport bounds (${bounds.x.toFixed(
            2
          )}, ${bounds.y.toFixed(2)}), ` +
          `clamping to 90% of viewport`
      );
    }

    // Clamp exclusion to safe values
    exclusion = {
      x: Math.min(exclusion.x, maxExclusionX),
      y: Math.min(exclusion.y, maxExclusionY),
    };

    const cubes: CubeConfig[] = [];

    // Define zones (areas outside exclusion zone - see JSDoc diagram above)
    const zones: ZoneConfig[] = [
      // Top zone
      {
        x: { min: -bounds.x, max: bounds.x },
        y: { min: exclusion.y, max: bounds.y },
        z: { min: depthRange.min, max: depthRange.max },
      },
      // Bottom zone
      {
        x: { min: -bounds.x, max: bounds.x },
        y: { min: -bounds.y, max: -exclusion.y },
        z: { min: depthRange.min, max: depthRange.max },
      },
      // Left zone
      {
        x: { min: -bounds.x, max: -exclusion.x },
        y: { min: -exclusion.y, max: exclusion.y },
        z: { min: depthRange.min, max: depthRange.max },
      },
      // Right zone
      {
        x: { min: exclusion.x, max: bounds.x },
        y: { min: -exclusion.y, max: exclusion.y },
        z: { min: depthRange.min, max: depthRange.max },
      },
    ];

    // Validate zones after creation (check for inverted ranges)
    zones.forEach((zone, index) => {
      const zoneName = ['TOP', 'BOTTOM', 'LEFT', 'RIGHT'][index];
      if (zone.x.min >= zone.x.max || zone.y.min >= zone.y.max) {
        console.error(
          `[BackgroundCubes] Zone ${index} (${zoneName}) has invalid range ` +
            `(X: ${zone.x.min.toFixed(2)} to ${zone.x.max.toFixed(2)}, ` +
            `Y: ${zone.y.min.toFixed(2)} to ${zone.y.max.toFixed(2)}). ` +
            `Check that exclusion zone is not larger than viewport bounds.`
        );
      }
    });

    // Distribute cubes across zones
    const cubesPerZone = Math.floor(count / zones.length);
    const remainder = count % zones.length;

    zones.forEach((zone, zoneIndex) => {
      // Add extra cube to first zones if there's a remainder
      const cubesInThisZone = cubesPerZone + (zoneIndex < remainder ? 1 : 0);

      for (let i = 0; i < cubesInThisZone; i++) {
        const size = this.randomInRange(sizeRange.min, sizeRange.max);
        const position: [number, number, number] = [
          this.randomInRange(zone.x.min, zone.x.max),
          this.randomInRange(zone.y.min, zone.y.max),
          this.randomInRange(zone.z.min, zone.z.max),
        ];

        const rotation: [number, number, number] = [
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ];

        const color =
          colorPalette[Math.floor(Math.random() * colorPalette.length)];

        cubes.push({
          id: `bg-cube-${zoneIndex}-${i}`,
          position,
          size: [size, size, size],
          color,
          rotation,
        });
      }
    });

    return cubes;
  }

  /**
   * Generate random number in range [min, max]
   */
  private randomInRange(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }
}
