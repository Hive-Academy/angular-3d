/**
 * ViewportPositioningService - Reactive Viewport 3D Positioning
 *
 * Maps familiar CSS-like positioning to 3D world space coordinates.
 * Provides Angular-native reactive positioning that auto-syncs with camera and window changes.
 *
 * Features:
 * - Automatic reactivity (positions update on camera/window resize changes)
 * - Named positions (top-left, center, bottom-right, etc.)
 * - Percentage positions ('50%' or 0.5 for center)
 * - Pixel positions (absolute screen coordinates)
 * - Multiple viewport planes (Z-depth layers)
 * - Responsive utilities (worldToPixels, pixelsToWorld)
 * - SSR-safe (window access guarded)
 *
 * @example
 * ```typescript
 * import { effect, inject } from '@angular/core';
 * import { ViewportPositioningService } from '@hive-academy/angular-3d';
 *
 * class MyComponent {
 *   private readonly positioning = inject(ViewportPositioningService);
 *
 *   // Get reactive position signal
 *   readonly topRightPos = this.positioning.getNamedPosition('top-right', {
 *     offsetX: -2,
 *     offsetY: -1
 *   });
 *
 *   constructor() {
 *     effect(() => {
 *       const [x, y, z] = this.topRightPos();
 *       console.log('Position updates automatically:', x, y, z);
 *     });
 *   }
 * }
 * ```
 */

import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  signal,
  type Signal,
} from '@angular/core';
import { SceneGraphStore } from '../store/scene-graph.store';
import type {
  NamedPosition,
  PercentagePosition,
  PixelPosition,
  PositionOffset,
  PixelPositionOptions,
} from './viewport-positioning.types';

/**
 * Default viewport dimensions for SSR environment (Full HD resolution)
 * Used when window object is unavailable (server-side rendering)
 */
const DEFAULT_SSR_VIEWPORT_WIDTH = 1920;
const DEFAULT_SSR_VIEWPORT_HEIGHT = 1080;

/**
 * IMPORTANT: This service is NOT provided at root.
 * Each Scene3dComponent provides its own instance to ensure
 * multi-scene isolation (viewport calculations use correct camera).
 */
@Injectable()
export class ViewportPositioningService {
  private readonly sceneStore = inject(SceneGraphStore);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Z position of the viewport plane (depth layer)
   * Default: 0 (at world origin)
   */
  private readonly _viewportZ = signal<number>(0);

  /**
   * Window aspect ratio (width / height)
   * Updated reactively on window resize
   * Default: 16/9 for SSR environment (updated on first browser render)
   */
  private readonly _aspect = signal<number>(16 / 9);

  /**
   * FIX TASK 5.4: Signal indicating whether camera is initialized and ready
   *
   * Use this to distinguish between "camera not initialized" and "valid zero position".
   *
   * @returns true if camera is initialized, false otherwise
   *
   * @example
   * ```typescript
   * import { effect, inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * effect(() => {
   *   if (!service.isCameraReady()) {
   *     console.log('Camera not ready - position calculations will return [0, 0, 0]');
   *     return;
   *   }
   *   const pos = service.getNamedPosition('center')();
   *   console.log('Valid position:', pos);
   * });
   * ```
   */
  public readonly isCameraReady = computed(
    () => this.sceneStore.camera() !== null
  );

  /**
   * Viewport width in world units (reactive to camera FOV and aspect changes)
   *
   * Automatically recalculates when:
   * - Camera FOV changes
   * - Camera Z position changes
   * - Window aspect ratio changes
   * - Viewport Z plane changes
   *
   * **Note**: Returns 0 if camera not initialized. Check `isCameraReady()` to distinguish
   * from valid zero width.
   */
  public readonly viewportWidth = computed(() => {
    const camera = this.sceneStore.camera();
    if (!camera) return 0;

    const height = this.calculateViewportHeight(
      camera.fov,
      camera.position.z,
      this._viewportZ()
    );
    return height * this._aspect();
  });

  /**
   * Viewport height in world units (reactive to camera FOV changes)
   *
   * Automatically recalculates when:
   * - Camera FOV changes
   * - Camera Z position changes
   * - Viewport Z plane changes
   *
   * **Note**: Returns 0 if camera not initialized. Check `isCameraReady()` to distinguish
   * from valid zero height.
   */
  public readonly viewportHeight = computed(() => {
    const camera = this.sceneStore.camera();
    if (!camera) return 0;

    return this.calculateViewportHeight(
      camera.fov,
      camera.position.z,
      this._viewportZ()
    );
  });

  constructor() {
    this.setupResizeListener();
  }

  /**
   * Get 3D position from named position (e.g., 'top-center', 'bottom-right')
   *
   * Returns reactive signal that auto-updates on camera/window changes.
   *
   * @param name - Named position (9 variants: corners, edges, center)
   * @param options - Optional offsets and viewportZ in world units
   * @returns Signal of [x, y, z] world coordinates. Returns [0, 0, 0] if camera not initialized.
   *          Check `isCameraReady()` to distinguish uninitialized from valid zero position.
   *
   * @example
   * ```typescript
   * import { effect, inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * // Top-right corner with offset
   * const pos = service.getNamedPosition('top-right', {
   *   offsetX: -2,
   *   offsetY: -1
   * });
   *
   * effect(() => {
   *   if (!service.isCameraReady()) {
   *     console.log('Camera not ready');
   *     return;
   *   }
   *   const [x, y, z] = pos();
   *   console.log('Position:', x, y, z);
   * });
   * ```
   */
  public getNamedPosition(
    name: NamedPosition,
    options: PositionOffset & { viewportZ?: number } = {}
  ): Signal<[number, number, number]> {
    return computed(() => {
      const camera = this.sceneStore.camera();
      if (!camera) return [0, 0, 0];

      const viewportZ = options.viewportZ ?? this._viewportZ();

      const height = this.calculateViewportHeight(
        camera.fov,
        camera.position.z,
        viewportZ
      );
      const width = height * this._aspect();

      const halfW = width / 2;
      const halfH = height / 2;

      const positions: Record<NamedPosition, [number, number]> = {
        center: [0, 0],
        'top-left': [-halfW, halfH],
        'top-center': [0, halfH],
        'top-right': [halfW, halfH],
        'middle-left': [-halfW, 0],
        'middle-right': [halfW, 0],
        'bottom-left': [-halfW, -halfH],
        'bottom-center': [0, -halfH],
        'bottom-right': [halfW, -halfH],
      };

      const [x, y] = positions[name];
      return [
        x + (options.offsetX ?? 0),
        y + (options.offsetY ?? 0),
        viewportZ + (options.offsetZ ?? 0),
      ];
    });
  }

  /**
   * Get 3D position from percentage position (0-100% or 0-1)
   *
   * Returns reactive signal that auto-updates on camera/window changes.
   * Supports both string percentages ('50%') and decimal values (0.5).
   *
   * @param pos - Percentage position { x, y }
   * @param options - Optional offsets and viewportZ in world units
   * @returns Signal of [x, y, z] world coordinates
   *
   * @example
   * ```typescript
   * import { inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * // Center using percentages
   * const pos1 = service.getPercentagePosition({ x: '50%', y: '50%' });
   *
   * // Center using decimals
   * const pos2 = service.getPercentagePosition({ x: 0.5, y: 0.5 });
   *
   * // Quarter from left, three-quarters from top
   * const pos3 = service.getPercentagePosition({ x: '25%', y: '75%' });
   * ```
   */
  public getPercentagePosition(
    pos: PercentagePosition,
    options: PositionOffset & { viewportZ?: number } = {}
  ): Signal<[number, number, number]> {
    return computed(() => {
      const camera = this.sceneStore.camera();
      if (!camera) return [0, 0, 0];

      const viewportZ = options.viewportZ ?? this._viewportZ();

      const height = this.calculateViewportHeight(
        camera.fov,
        camera.position.z,
        viewportZ
      );
      const width = height * this._aspect();

      // Parse percentage strings or decimal values
      // FIX TASK 5.2: Validate percentage input to prevent NaN
      const parsePercent = (val: string | number, axis: 'x' | 'y'): number => {
        if (typeof val === 'string') {
          const parsed = parseFloat(val);
          if (isNaN(parsed)) {
            throw new Error(
              `Invalid percentage value for ${axis}: "${val}". Expected format: "50%" or 0.5`
            );
          }
          return parsed / 100;
        }
        if (isNaN(val)) {
          throw new Error(`Invalid percentage value for ${axis}: NaN`);
        }
        return val;
      };

      const xPercent = parsePercent(pos.x, 'x');
      const yPercent = parsePercent(pos.y, 'y');

      // Convert to world coordinates (-0.5 to 0.5 viewport space)
      const x = (xPercent - 0.5) * width;
      const y = (0.5 - yPercent) * height; // Invert Y (CSS is top-down)

      return [
        x + (options.offsetX ?? 0),
        y + (options.offsetY ?? 0),
        viewportZ + (options.offsetZ ?? 0),
      ];
    });
  }

  /**
   * Convert pixel screen coordinates to 3D world position
   *
   * Returns reactive signal that auto-updates on camera/window changes.
   * Converts absolute pixel coordinates to world units.
   *
   * **Note**: Despite the name "getPixelPosition", this returns world coordinates [x, y, z],
   * NOT pixel values. The INPUT is in pixels (screen coordinates), but the OUTPUT is in
   * Three.js world units. Use this to position 3D objects at specific screen pixel locations.
   *
   * @param pos - Pixel position { x, y } (screen coordinates from top-left)
   * @param options - Optional configuration and offsets
   * @returns Signal of world position [x, y, z] in Three.js world units
   *
   * @example
   * ```typescript
   * import { inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * // Position object at 100px from left, 50px from top (screen coordinates)
   * // Returns world coordinates like [2.3, -1.5, 0] in Three.js world units
   * const pos = service.getPixelPosition({ x: 100, y: 50 }, {
   *   offsetZ: -15
   * });
   * ```
   */
  public getPixelPosition(
    pos: PixelPosition,
    options: PixelPositionOptions = {}
  ): Signal<[number, number, number]> {
    return computed(() => {
      const camera = this.sceneStore.camera();
      if (!camera) return [0, 0, 0];

      const viewportZ = options.viewportZ ?? this._viewportZ();

      const height = this.calculateViewportHeight(
        camera.fov,
        camera.position.z,
        viewportZ
      );
      const width = height * this._aspect();

      const screenWidth =
        options.viewportWidth ??
        (typeof window !== 'undefined'
          ? window.innerWidth
          : DEFAULT_SSR_VIEWPORT_WIDTH);
      const screenHeight =
        options.viewportHeight ??
        (typeof window !== 'undefined'
          ? window.innerHeight
          : DEFAULT_SSR_VIEWPORT_HEIGHT);

      // Convert pixels to viewport percentage
      const xPercent = pos.x / screenWidth;
      const yPercent = pos.y / screenHeight;

      // FIX TASK 5.1: Inline calculation instead of creating signal inside computed
      // Convert to world coordinates (-0.5 to 0.5 viewport space)
      const x = (xPercent - 0.5) * width;
      const y = (0.5 - yPercent) * height; // Invert Y (CSS is top-down)

      return [
        x + (options.offsetX ?? 0),
        y + (options.offsetY ?? 0),
        viewportZ + (options.offsetZ ?? 0),
      ];
    });
  }

  /**
   * Get 3D position from any position format (unified method)
   *
   * Returns reactive signal that auto-updates on camera/window changes.
   * Automatically discriminates between named, percentage, and pixel positions.
   *
   * **IMPORTANT**: For pixel positions, you MUST specify `unit: 'px'` in options.
   * Without explicit unit, numeric positions default to percentage.
   *
   * @param position - Named, percentage, or pixel position
   * @param options - Optional configuration and offsets
   * @returns Signal of [x, y, z] world coordinates
   *
   * @example
   * ```typescript
   * import { inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * // Named position
   * const pos1 = service.getPosition('center');
   *
   * // Percentage position (default for numeric)
   * const pos2 = service.getPosition({ x: 0.5, y: 0.5 });  // 50%, 50%
   * const pos3 = service.getPosition({ x: 1, y: 1 });      // 100%, 100%
   *
   * // Pixel position (requires explicit unit)
   * const pos4 = service.getPosition({ x: 100, y: 50 }, { unit: 'px' });
   * ```
   */
  public getPosition(
    position: NamedPosition | PercentagePosition | PixelPosition,
    options: PixelPositionOptions = {}
  ): Signal<[number, number, number]> {
    // Type discrimination logic

    // Named position (string)
    if (typeof position === 'string') {
      return this.getNamedPosition(position, options);
    }

    // FIX TASK 5.3: Require explicit unit: 'px' for pixel positions (no heuristic)
    // Pixel position (EXPLICIT unit required)
    if (
      typeof position.x === 'number' &&
      typeof position.y === 'number' &&
      options.unit === 'px'
    ) {
      return this.getPixelPosition(position as PixelPosition, options);
    }

    // Default to percentage
    return this.getPercentagePosition(position as PercentagePosition, options);
  }

  /**
   * Set viewport Z plane (depth layer)
   *
   * @deprecated Use viewportZ parameter in getPosition() methods instead.
   * This method mutates shared service state and affects ALL directives.
   *
   * For per-directive Z-plane isolation, pass viewportZ in options:
   * ```typescript
   * service.getPosition('center', { viewportZ: -10 })
   * ```
   *
   * @param z - Z position of viewport plane
   */
  public setViewportZ(z: number): void {
    this._viewportZ.set(z);
  }

  /**
   * Convert world units to approximate pixels
   *
   * Useful for converting 3D distances to screen space for UI overlays.
   *
   * @param worldUnits - Distance in world units
   * @returns Approximate pixel distance
   *
   * @example
   * ```typescript
   * import { inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * const worldDistance = 5;
   * const pixels = service.worldToPixels(worldDistance);
   * console.log(`${worldDistance} world units ≈ ${pixels}px`);
   * ```
   */
  public worldToPixels(worldUnits: number): number {
    const viewportHeight = this.viewportHeight();
    if (viewportHeight === 0) return 0;

    const screenHeight =
      typeof window !== 'undefined'
        ? window.innerHeight
        : DEFAULT_SSR_VIEWPORT_HEIGHT;
    return (worldUnits / viewportHeight) * screenHeight;
  }

  /**
   * Convert pixels to world units
   *
   * Useful for converting screen space measurements to 3D coordinates.
   *
   * @param pixels - Distance in pixels
   * @returns World unit distance
   *
   * @example
   * ```typescript
   * import { inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * const pixels = 100;
   * const worldUnits = service.pixelsToWorld(pixels);
   * console.log(`${pixels}px ≈ ${worldUnits} world units`);
   * ```
   */
  public pixelsToWorld(pixels: number): number {
    const viewportHeight = this.viewportHeight();
    if (viewportHeight === 0) return 0;

    const screenHeight =
      typeof window !== 'undefined'
        ? window.innerHeight
        : DEFAULT_SSR_VIEWPORT_HEIGHT;
    return (pixels / screenHeight) * viewportHeight;
  }

  /**
   * Get responsive font size based on viewport height
   *
   * Similar to CSS vh units, scales with viewport height.
   *
   * @param vhPercent - Percentage of viewport height (1-100)
   * @returns Font size in world units
   *
   * @example
   * ```typescript
   * import { inject } from '@angular/core';
   * import { ViewportPositioningService } from '@hive-academy/angular-3d';
   *
   * const service = inject(ViewportPositioningService);
   *
   * // 5% of viewport height
   * const fontSize = service.getResponsiveFontSize(5);
   * ```
   */
  public getResponsiveFontSize(vhPercent: number): number {
    return (this.viewportHeight() * vhPercent) / 100;
  }

  /**
   * Set up window resize listener with cleanup
   *
   * Updates aspect ratio signal on window resize.
   * Cleanup registered with DestroyRef for automatic memory management.
   */
  private setupResizeListener(): void {
    // SSR-safe: Only add listener in browser environment
    if (typeof window !== 'undefined') {
      const updateAspect = () => {
        this._aspect.set(window.innerWidth / window.innerHeight);
      };

      // Initial update
      updateAspect();

      // Register listener
      window.addEventListener('resize', updateAspect);

      // Cleanup on service destroy
      this.destroyRef.onDestroy(() => {
        window.removeEventListener('resize', updateAspect);
      });
    }
  }

  /**
   * Calculate visible viewport height at viewport plane using FOV and distance
   *
   * Uses perspective projection math:
   * height = 2 * tan(fov/2) * distance
   *
   * FIX TASK 5.5: Validate that viewport plane is behind camera (positive distance)
   *
   * @param fov - Camera field of view in degrees
   * @param cameraZ - Camera Z position
   * @param viewportZ - Viewport plane Z position
   * @returns Viewport height in world units
   * @throws {Error} If viewport plane is in front of or at the same position as camera
   */
  private calculateViewportHeight(
    fov: number,
    cameraZ: number,
    viewportZ: number
  ): number {
    const distance = cameraZ - viewportZ;

    if (distance <= 0) {
      throw new Error(
        `Invalid viewport configuration: viewport plane (Z=${viewportZ}) ` +
          `must be behind camera (Z=${cameraZ}). ` +
          `Distance: ${distance}. ` +
          `Hint: Use negative viewportZ values (e.g., -5) to position viewport behind camera.`
      );
    }

    const fovRad = (fov * Math.PI) / 180;
    return 2 * Math.tan(fovRad / 2) * distance;
  }
}
