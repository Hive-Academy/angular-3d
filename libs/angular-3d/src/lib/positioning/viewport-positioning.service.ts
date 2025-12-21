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

@Injectable({ providedIn: 'root' })
export class ViewportPositioningService {
  // ============================================================================
  // Dependencies
  // ============================================================================

  private readonly sceneStore = inject(SceneGraphStore);
  private readonly destroyRef = inject(DestroyRef);

  // ============================================================================
  // Reactive State Signals
  // ============================================================================

  /**
   * Z position of the viewport plane (depth layer)
   * Default: 0 (at world origin)
   */
  private readonly _viewportZ = signal<number>(0);

  /**
   * Window aspect ratio (width / height)
   * Updated reactively on window resize
   */
  private readonly _aspect = signal<number>(
    typeof window !== 'undefined'
      ? window.innerWidth / window.innerHeight
      : 16 / 9
  );

  // ============================================================================
  // Public Computed Signals (Reactive Viewport Dimensions)
  // ============================================================================

  /**
   * FIX TASK 5.4: Signal indicating whether camera is initialized and ready
   *
   * Use this to distinguish between "camera not initialized" and "valid zero position".
   *
   * @returns true if camera is initialized, false otherwise
   *
   * @example
   * ```typescript
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

  // ============================================================================
  // Initialization
  // ============================================================================

  constructor() {
    this.setupResizeListener();
  }

  // ============================================================================
  // Public API Methods (Position Calculations)
  // ============================================================================

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
   * Get 3D position from pixel coordinates
   *
   * Returns reactive signal that auto-updates on camera/window changes.
   * Converts absolute pixel coordinates to world units.
   *
   * **Note**: Despite the name, this returns world coordinates [x, y, z],
   * NOT pixel values. The input is in pixels, output is in world units.
   *
   * @param pos - Pixel position { x, y }
   * @param options - Optional configuration and offsets
   * @returns Signal of [x, y, z] world coordinates
   *
   * @example
   * ```typescript
   * // 100 pixels from left, 50 pixels from top
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
        (typeof window !== 'undefined' ? window.innerWidth : 1920);
      const screenHeight =
        options.viewportHeight ??
        (typeof window !== 'undefined' ? window.innerHeight : 1080);

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

  // ============================================================================
  // Configuration Methods
  // ============================================================================

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

  // ============================================================================
  // Utility Methods (Responsive Helpers)
  // ============================================================================

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
   * const worldDistance = 5;
   * const pixels = service.worldToPixels(worldDistance);
   * console.log(`${worldDistance} world units ≈ ${pixels}px`);
   * ```
   */
  public worldToPixels(worldUnits: number): number {
    const viewportHeight = this.viewportHeight();
    if (viewportHeight === 0) return 0;

    const screenHeight =
      typeof window !== 'undefined' ? window.innerHeight : 1080;
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
   * const pixels = 100;
   * const worldUnits = service.pixelsToWorld(pixels);
   * console.log(`${pixels}px ≈ ${worldUnits} world units`);
   * ```
   */
  public pixelsToWorld(pixels: number): number {
    const viewportHeight = this.viewportHeight();
    if (viewportHeight === 0) return 0;

    const screenHeight =
      typeof window !== 'undefined' ? window.innerHeight : 1080;
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
   * // 5% of viewport height
   * const fontSize = service.getResponsiveFontSize(5);
   * ```
   */
  public getResponsiveFontSize(vhPercent: number): number {
    return (this.viewportHeight() * vhPercent) / 100;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

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
