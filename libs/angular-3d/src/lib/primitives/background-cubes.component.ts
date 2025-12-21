import {
  Component,
  ChangeDetectionStrategy,
  input,
  computed,
} from '@angular/core';
import { BackgroundCubeComponent } from './background-cube.component';
import { ColorRepresentation } from 'three';

/**
 * CubeConfig - Configuration for a single background cube
 */
interface CubeConfig {
  id: string;
  position: [number, number, number];
  size: [number, number, number];
  color: ColorRepresentation;
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
 *   [depthRange]="{ min: -28, max: -8 }"
 *   [transparent]="true"
 *   [opacity]="0.7" />
 * ```
 */
@Component({
  selector: 'a3d-background-cubes',
  standalone: true,
  imports: [BackgroundCubeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (cube of cubes(); track cube.id) {
    <a3d-background-cube
      [position]="cube.position"
      [args]="cube.size"
      [color]="cube.color"
      [rotation]="cube.rotation"
      [transparent]="transparent()"
      [opacity]="opacity()"
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
  public readonly colorPalette = input<ColorRepresentation[]>([
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
   * Enable transparency for all cubes
   * Default: true
   */
  public readonly transparent = input<boolean>(true);

  /**
   * Opacity for all cubes (0 = fully transparent, 1 = fully opaque)
   * Default: 0.7
   */
  public readonly opacity = input<number>(0.7);

  /**
   * Computed cube configurations
   * Regenerates whenever inputs change
   */
  public readonly cubes = computed(() => this.generateCubes());

  /**
   * Generate cube configurations with zone-based distribution
   */
  private generateCubes(): CubeConfig[] {
    const count = this.count();
    const colorPalette = this.colorPalette();
    const exclusion = this.exclusionZone();
    const sizeRange = this.sizeRange();
    const depthRange = this.depthRange();
    const bounds = this.viewportBounds();

    const cubes: CubeConfig[] = [];

    // Define zones (areas outside exclusion zone)
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
