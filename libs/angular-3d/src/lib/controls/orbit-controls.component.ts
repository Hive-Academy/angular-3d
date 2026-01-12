/**
 * OrbitControls Component - Camera Controls for Angular 3D
 *
 * Creates and manages OrbitControls for camera interaction.
 * Uses SceneService for camera/domElement access.
 *
 * WebGPU Compatibility: OrbitControls from three-stdlib works with
 * WebGPURenderer. The controls update via the render loop's tick() method.
 *
 * @example
 * ```html
 * <a3d-orbit-controls
 *   [target]="[0, 0, 0]"
 *   [enableDamping]="true"
 *   [dampingFactor]="0.05"
 *   [enableZoom]="true"
 *   [minDistance]="5"
 *   [maxDistance]="30"
 *   (controlsReady)="onControlsReady($event)"
 * />
 * ```
 */

import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  output,
  effect,
  DestroyRef,
} from '@angular/core';
import { OrbitControls } from 'three-stdlib';
import * as THREE from 'three/webgpu';
import { SceneService } from '../canvas/scene.service';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * Event emitted when controls change (camera moves, zooms, etc.)
 */
export interface OrbitControlsChangeEvent {
  /** Current camera distance from target */
  distance: number;
  /** The OrbitControls instance */
  controls: OrbitControls;
}

/**
 * Angular component wrapping Three.js OrbitControls.
 *
 * Provides declarative camera controls with typed outputs
 * for consumer access (e.g., ScrollZoomCoordinatorDirective).
 */
@Component({
  selector: 'a3d-orbit-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class OrbitControlsComponent implements OnDestroy {
  // DI
  private readonly sceneService = inject(SceneService);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // ================================
  // INPUTS - Target & Damping
  // ================================

  /** Target point to orbit around (typically [0, 0, 0] for scene center) */
  public readonly target = input<[number, number, number]>([0, 0, 0]);

  /** Enable smooth inertial camera movement */
  public readonly enableDamping = input<boolean>(true);

  /** Damping factor (0.05 = smooth, 0.2 = snappy) */
  public readonly dampingFactor = input<number>(0.05);

  // ================================
  // INPUTS - Auto-rotation
  // ================================

  /** Enable automatic camera rotation */
  public readonly autoRotate = input<boolean>(false);

  /** Auto-rotation speed in degrees per second */
  public readonly autoRotateSpeed = input<number>(2.0);

  // ================================
  // INPUTS - Zoom
  // ================================

  /** Enable mouse wheel zoom */
  public readonly enableZoom = input<boolean>(true);

  /** Minimum camera distance from target (closest zoom) */
  public readonly minDistance = input<number>(5);

  /** Maximum camera distance from target (farthest zoom) */
  public readonly maxDistance = input<number>(30);

  /** Zoom speed multiplier */
  public readonly zoomSpeed = input<number>(1.0);

  // ================================
  // INPUTS - Pan
  // ================================

  /** Enable right-click panning */
  public readonly enablePan = input<boolean>(false);

  /** Pan speed multiplier */
  public readonly panSpeed = input<number>(1.0);

  // ================================
  // INPUTS - Rotation
  // ================================

  /** Enable left-click rotation */
  public readonly enableRotate = input<boolean>(true);

  /** Rotation speed multiplier */
  public readonly rotateSpeed = input<number>(1.0);

  /** Minimum vertical angle (0 = looking straight down) */
  public readonly minPolarAngle = input<number>(0);

  /** Maximum vertical angle (Math.PI = looking straight up) */
  public readonly maxPolarAngle = input<number>(Math.PI);

  /** Minimum horizontal angle */
  public readonly minAzimuthAngle = input<number>(-Infinity);

  /** Maximum horizontal angle */
  public readonly maxAzimuthAngle = input<number>(Infinity);

  // ================================
  // OUTPUTS - Instance Access
  // ================================

  /** Emitted when OrbitControls is initialized and ready */
  public readonly controlsReady = output<OrbitControls>();

  /** Emitted when controls change (camera moves, zooms, rotates) */
  public readonly controlsChange = output<OrbitControlsChangeEvent>();

  // Private state
  private controls: OrbitControls | null = null;
  private cleanupRenderLoop: (() => void) | null = null;
  private initialized = false;

  public constructor() {
    // Initialize controls when camera and domElement are available
    effect(() => {
      const camera = this.sceneService.camera();
      const domElement = this.sceneService.domElement;

      if (camera && domElement && !this.initialized) {
        this.initialized = true;
        this.initControls(camera, domElement);
      }
    });

    // React to input changes
    effect(() => {
      if (this.controls) {
        this.updateControlsFromInputs();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  public ngOnDestroy(): void {
    this.dispose();
  }

  /**
   * Get the OrbitControls instance (for programmatic access)
   */
  public getControls(): OrbitControls | null {
    return this.controls;
  }

  private initControls(
    camera: THREE.PerspectiveCamera,
    domElement: HTMLCanvasElement
  ): void {
    // Create OrbitControls
    this.controls = new OrbitControls(camera, domElement);

    // Apply initial configuration
    this.updateControlsFromInputs();

    // Register render loop callback for damping updates
    this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback(() => {
      if (this.controls && this.enableDamping()) {
        this.controls.update();
      }
    });

    // Setup change event listener
    this.controls.addEventListener('change', this.handleControlsChange);

    // Emit ready event
    this.controlsReady.emit(this.controls);
  }

  private handleControlsChange = (): void => {
    if (!this.controls) return;

    // Invalidate for demand-based rendering
    // This ensures the scene re-renders during user interaction
    this.sceneService.invalidate();

    const distance = this.controls.object.position.distanceTo(
      this.controls.target
    );

    this.controlsChange.emit({
      distance,
      controls: this.controls,
    });
  };

  private updateControlsFromInputs(): void {
    if (!this.controls) return;

    // Target
    const [tx, ty, tz] = this.target();
    this.controls.target.set(tx, ty, tz);

    // Damping
    this.controls.enableDamping = this.enableDamping();
    this.controls.dampingFactor = this.dampingFactor();

    // Auto-rotation
    this.controls.autoRotate = this.autoRotate();
    this.controls.autoRotateSpeed = this.autoRotateSpeed();

    // Zoom
    this.controls.enableZoom = this.enableZoom();
    this.controls.minDistance = this.minDistance();
    this.controls.maxDistance = this.maxDistance();
    this.controls.zoomSpeed = this.zoomSpeed();

    // Pan
    this.controls.enablePan = this.enablePan();
    this.controls.panSpeed = this.panSpeed();

    // Rotation
    this.controls.enableRotate = this.enableRotate();
    this.controls.rotateSpeed = this.rotateSpeed();
    this.controls.minPolarAngle = this.minPolarAngle();
    this.controls.maxPolarAngle = this.maxPolarAngle();
    this.controls.minAzimuthAngle = this.minAzimuthAngle();
    this.controls.maxAzimuthAngle = this.maxAzimuthAngle();

    // Apply update
    this.controls.update();
  }

  private dispose(): void {
    if (this.cleanupRenderLoop) {
      this.cleanupRenderLoop();
      this.cleanupRenderLoop = null;
    }

    if (this.controls) {
      this.controls.removeEventListener('change', this.handleControlsChange);
      this.controls.dispose();
      this.controls = null;
    }

    this.initialized = false;
  }
}
