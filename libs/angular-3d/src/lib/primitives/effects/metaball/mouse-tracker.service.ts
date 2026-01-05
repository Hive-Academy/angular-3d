// Mouse Tracker Service for Metaball Cursor Interaction
import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import * as THREE from 'three/webgpu';
import { RenderLoopService } from '../../../render-loop/render-loop.service';
import { screenToWorldJS } from './tsl-metaball-sdf';

/**
 * Service that tracks mouse/touch position with smooth interpolation.
 * Provides normalized (0-1) and world-space coordinates for shader use.
 *
 * @example
 * ```typescript
 * // In component
 * private readonly mouseTracker = inject(MouseTrackerService);
 *
 * // Access current position
 * const normalized = this.mouseTracker.normalizedPosition();
 * const world = this.mouseTracker.worldPosition();
 * ```
 */
// eslint-disable-next-line @angular-eslint/use-injectable-provided-in
@Injectable() // Provided at component level in MetaballSceneComponent
export class MouseTrackerService {
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Normalized mouse position (0-1 range)
   * X: 0 = left, 1 = right
   * Y: 0 = bottom, 1 = top (3D space convention)
   */
  public readonly normalizedPosition = signal<[number, number]>([0.5, 0.5]);

  /**
   * Mouse position in world space coordinates
   */
  public readonly worldPosition = signal<THREE.Vector3>(new THREE.Vector3());

  /**
   * Whether to use screen-space Y (true) or 3D-space Y (false)
   * Screen-space: Y=0 at top (for fullscreen shaders)
   * 3D-space: Y=0 at bottom (for positioned 3D objects)
   */
  public readonly useScreenSpaceY = signal<boolean>(true);

  /**
   * Interpolation smoothness (0-1, higher = faster response)
   * Set to 1.0 for instant (no interpolation)
   */
  public readonly smoothness = signal<number>(1.0);

  // Internal state
  private readonly targetPosition: [number, number] = [0.5, 0.5];
  private readonly currentPosition: [number, number] = [0.5, 0.5];
  private renderLoopCleanup?: () => void;
  private isInitialized = false;

  // Bound event handlers
  private readonly boundOnPointerMove = this.onPointerMove.bind(this);
  private readonly boundOnTouchStart = this.onTouchStart.bind(this);
  private readonly boundOnTouchMove = this.onTouchMove.bind(this);

  /**
   * Initialize mouse tracking (call once when component mounts)
   */
  public initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;

    // Setup event listeners
    window.addEventListener('mousemove', this.boundOnPointerMove, {
      passive: true,
    });
    window.addEventListener('touchstart', this.boundOnTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.boundOnTouchMove, {
      passive: false,
    });

    // Initialize at center
    this.onPointerMove({
      clientX: window.innerWidth / 2,
      clientY: window.innerHeight / 2,
    } as MouseEvent);

    // Register render loop for smooth interpolation
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(() => {
      this.updateInterpolation();
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => this.dispose());
  }

  /**
   * Clean up event listeners and render loop
   */
  public dispose(): void {
    if (!this.isInitialized || typeof window === 'undefined') return;

    window.removeEventListener('mousemove', this.boundOnPointerMove);
    window.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);

    if (this.renderLoopCleanup) {
      this.renderLoopCleanup();
    }

    this.isInitialized = false;
  }

  /**
   * Update interpolation each frame
   */
  private updateInterpolation(): void {
    const s = this.smoothness();

    // Instant mode when smoothness is 1.0
    if (s >= 1.0) {
      this.currentPosition[0] = this.targetPosition[0];
      this.currentPosition[1] = this.targetPosition[1];
    } else {
      this.currentPosition[0] +=
        (this.targetPosition[0] - this.currentPosition[0]) * s;
      this.currentPosition[1] +=
        (this.targetPosition[1] - this.currentPosition[1]) * s;
    }

    this.normalizedPosition.set([...this.currentPosition] as [number, number]);

    // Update world position
    const [wx, wy, wz] = screenToWorldJS(
      this.currentPosition[0],
      this.currentPosition[1]
    );
    this.worldPosition.set(new THREE.Vector3(wx, wy, wz));
  }

  /**
   * Handle pointer move events
   */
  private onPointerMove(
    event: MouseEvent | { clientX: number; clientY: number }
  ): void {
    if (typeof window === 'undefined') return;

    const normalizedX = event.clientX / window.innerWidth;
    const normalizedY = this.useScreenSpaceY()
      ? event.clientY / window.innerHeight
      : 1.0 - event.clientY / window.innerHeight;

    this.targetPosition[0] = normalizedX;
    this.targetPosition[1] = normalizedY;
  }

  /**
   * Handle touch start events
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.onPointerMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }
  }

  /**
   * Handle touch move events
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.onPointerMove({
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
    }
  }
}
