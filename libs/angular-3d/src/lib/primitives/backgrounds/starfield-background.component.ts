/**
 * StarfieldBackgroundComponent - Space Starfield Background with Parallax
 *
 * Creates space starfield backgrounds with optional mouse parallax effect
 * using TSL procedural textures from tsl-textures/space.ts.
 *
 * Features:
 * - Procedural star generation with adjustable density and size
 * - Optional mouse/touch parallax effect for depth perception
 * - Adjustable parallax strength for subtle or dramatic effects
 * - Fullscreen mode (fills camera frustum) or positioned mode (3D positioning)
 * - Responsive scaling on window resize and camera FOV changes
 * - Lightweight (60+ FPS on both desktop and mobile)
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy
 * - Signal-based inputs for reactive updates
 * - TSL procedural texture (MeshBasicNodeMaterial)
 * - Window event listeners for mouse tracking (NOT MouseTracking3dDirective)
 * - Mouse position smoothing with lerp for fluid parallax
 * - ViewportPositionDirective for depth layering via hostDirectives
 *
 * @example
 * ```html
 * <a3d-starfield-background
 *   [density]="100"
 *   [starSize]="0.5"
 *   [enableParallax]="true"
 *   [parallaxStrength]="0.2"
 *   viewportPosition="center"
 *   [viewportZ]="-50"
 * />
 * ```
 */

import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { MeshBasicNodeMaterial } from 'three/webgpu';
import * as TSL from 'three/tsl';

import { RenderLoopService } from '../../render-loop/render-loop.service';
import { NG_3D_PARENT } from '../../types/tokens';
import { SceneService } from '../../canvas/scene.service';
import { ViewportPositionDirective } from '../../positioning/viewport-position.directive';
import { tslStars } from '../shaders/tsl-textures';

/**
 * Helper to safely access TSL functions at runtime
 */
function getTSL() {
  const { uniform, screenUV, uv } = TSL;

  if (!uniform) {
    throw new Error(
      'TSL functions not available. Ensure WebGPU context is initialized.'
    );
  }

  return { uniform, screenUV, uv };
}

@Component({
  selector: 'a3d-starfield-background',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  hostDirectives: [
    {
      directive: ViewportPositionDirective,
      inputs: ['viewportPosition', 'viewportOffset', 'viewportZ'],
    },
  ],
})
export class StarfieldBackgroundComponent {
  // ========================================================================
  // Signal Inputs - Configuration
  // ========================================================================

  /**
   * Star density (number of stars, typical range: 50-200)
   */
  public readonly density = input<number>(100);

  /**
   * Star size (typical range: 0.3-1.0)
   * Smaller values = smaller, more distant-looking stars
   */
  public readonly starSize = input<number>(0.5);

  /**
   * Enable mouse/touch parallax effect
   */
  public readonly enableParallax = input<boolean>(false);

  /**
   * Parallax effect strength (typical range: 0.1-0.5)
   * Higher values create more pronounced parallax movement
   */
  public readonly parallaxStrength = input<number>(0.2);

  /**
   * Fullscreen mode
   * When true: Plane scales to fill camera frustum, uses screenUV
   * When false: Standard 3D positioning with geometry UV
   */
  public readonly fullscreen = input<boolean>(true);

  /**
   * Enable transparency
   */
  public readonly transparent = input<boolean>(true);

  /**
   * Opacity level (0-1)
   */
  public readonly opacity = input<number>(1.0);

  // ========================================================================
  // Dependency Injection
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly sceneService = inject(SceneService, { optional: true });

  // ========================================================================
  // Three.js Objects
  // ========================================================================

  private mesh!: THREE.Mesh;
  private material!: MeshBasicNodeMaterial;

  // ========================================================================
  // TSL Uniform Nodes
  // ========================================================================

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uDensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uStarSize!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uMousePosition!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uParallaxStrength!: any;

  // ========================================================================
  // Mouse Tracking State
  // ========================================================================

  private readonly mousePosition = new THREE.Vector2(0.5, 0.5);
  private readonly targetMousePosition = new THREE.Vector2(0.5, 0.5);

  // ========================================================================
  // Lifecycle & Event Management
  // ========================================================================

  private renderLoopCleanup!: () => void;
  private isAddedToScene = false;

  // Event listener references for cleanup
  private boundOnPointerMove!: (event: MouseEvent) => void;
  private boundOnTouchStart!: (event: TouchEvent) => void;
  private boundOnTouchMove!: (event: TouchEvent) => void;
  private boundOnResize!: () => void;

  // ========================================================================
  // Constructor & Lifecycle
  // ========================================================================

  public constructor() {
    // Bind event handlers
    this.boundOnPointerMove = this.onPointerMove.bind(this);
    this.boundOnTouchStart = this.onTouchStart.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnResize = this.onWindowResize.bind(this);

    // Effect: Add mesh to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMesh();
        parent.add(this.mesh);
        this.isAddedToScene = true;

        // Setup mouse tracking if parallax enabled
        if (this.enableParallax()) {
          this.setupEventListeners();
        }

        // Setup resize listener
        if (typeof window !== 'undefined') {
          window.addEventListener('resize', this.boundOnResize, {
            passive: true,
          });
        }
      }
    });

    // Effect: Update texture parameters when inputs change
    effect(() => {
      if (!this.uDensity) return;

      this.uDensity.value = this.density();
      this.uStarSize.value = this.starSize();
      this.uParallaxStrength.value = this.parallaxStrength();
    });

    // Effect: Update fullscreen scale when camera becomes available
    effect(() => {
      const camera = this.sceneService?.camera();
      const isFullscreen = this.fullscreen();

      if (camera && this.mesh && isFullscreen) {
        this.updateFullscreenScale();
      }
    });

    // Effect: Setup/teardown mouse listeners when enableParallax changes
    effect(() => {
      if (this.enableParallax() && this.isAddedToScene) {
        this.setupEventListeners();
      } else {
        this.removeMouseListeners();
      }
    });

    // Animation loop - update mouse position smoothly
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(() => {
      if (!this.uMousePosition || !this.enableParallax()) return;

      // Smooth mouse movement with interpolation (lerp)
      const smoothness = 0.1;
      this.mousePosition.x +=
        (this.targetMousePosition.x - this.mousePosition.x) * smoothness;
      this.mousePosition.y +=
        (this.targetMousePosition.y - this.mousePosition.y) * smoothness;

      this.uMousePosition.value = this.mousePosition;
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      // Cleanup render loop callback
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
      }

      // Remove event listeners
      this.removeMouseListeners();
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', this.boundOnResize);
      }

      // Remove from parent
      const parent = this.parent();
      if (parent && this.isAddedToScene) {
        parent.remove(this.mesh);
      }
      this.isAddedToScene = false;

      // Dispose Three.js resources
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.material.dispose();
      }
    });
  }

  // ========================================================================
  // Mesh Creation & Material
  // ========================================================================

  /**
   * Create the background mesh with starfield texture
   */
  private createMesh(): void {
    const { uniform } = getTSL();

    // Create TSL uniform nodes
    this.uDensity = uniform(this.density());
    this.uStarSize = uniform(this.starSize());
    this.uMousePosition = uniform(new THREE.Vector2(0.5, 0.5));
    this.uParallaxStrength = uniform(this.parallaxStrength());

    // Create TSL material with starfield texture
    this.material = this.createTSLMaterial();

    // Create full-screen 2x2 plane geometry
    const geometry = new THREE.PlaneGeometry(2, 2);

    // Create mesh
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.frustumCulled = false;

    // Fullscreen mode: scale plane to fill viewport
    if (this.fullscreen()) {
      this.updateFullscreenScale();
    }
  }

  /**
   * Create TSL Material with Starfield Procedural Texture
   */
  private createTSLMaterial(): MeshBasicNodeMaterial {
    const { screenUV, uv } = getTSL();

    // Capture fullscreen mode at material creation time
    const isFullscreen = this.fullscreen();

    // Choose UV source based on fullscreen mode
    const uvSource = isFullscreen ? screenUV : uv();

    // Apply starfield texture
    const starsNode = tslStars({
      uv: uvSource,
      density: this.uDensity,
      starSize: this.uStarSize,
      parallax: this.enableParallax() ? this.uMousePosition : null,
      parallaxStrength: this.uParallaxStrength,
    });

    const material = new MeshBasicNodeMaterial();
    material.colorNode = starsNode;
    material.transparent = this.transparent();
    material.opacity = this.opacity();
    material.depthWrite = false;
    material.depthTest = false;

    return material;
  }

  // ========================================================================
  // Fullscreen Scaling
  // ========================================================================

  /**
   * Scale plane geometry to fill camera frustum
   */
  private updateFullscreenScale(): void {
    const camera = this.sceneService?.camera();
    if (!camera || !this.mesh) return;

    const distance = camera.position.length();
    const vFov = (camera.fov * Math.PI) / 180;
    const planeHeight = 2 * Math.tan(vFov / 2) * distance;
    const planeWidth = planeHeight * camera.aspect;

    // 10% overflow to prevent edge artifacts
    const scale = 1.1;
    this.mesh.scale.set(planeWidth * scale, planeHeight * scale, 1);
    this.mesh.position.set(0, 0, -distance + 0.01);
  }

  // ========================================================================
  // Event Listeners - Mouse/Touch Tracking
  // ========================================================================

  /**
   * Setup event listeners for mouse/touch tracking
   */
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('mousemove', this.boundOnPointerMove, {
      passive: true,
    });
    window.addEventListener('touchstart', this.boundOnTouchStart, {
      passive: false,
    });
    window.addEventListener('touchmove', this.boundOnTouchMove, {
      passive: false,
    });
  }

  /**
   * Remove mouse tracking event listeners
   */
  private removeMouseListeners(): void {
    if (typeof window === 'undefined') return;

    window.removeEventListener('mousemove', this.boundOnPointerMove);
    window.removeEventListener('touchstart', this.boundOnTouchStart);
    window.removeEventListener('touchmove', this.boundOnTouchMove);
  }

  /**
   * Handle mouse move events
   */
  private onPointerMove(event: MouseEvent): void {
    if (typeof window === 'undefined') return;

    // Convert to normalized coordinates (0-1)
    this.targetMousePosition.x = event.clientX / window.innerWidth;
    this.targetMousePosition.y = 1.0 - event.clientY / window.innerHeight;
  }

  /**
   * Handle touch start events
   */
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.targetMousePosition.x = touch.clientX / window.innerWidth;
      this.targetMousePosition.y = 1.0 - touch.clientY / window.innerHeight;
    }
  }

  /**
   * Handle touch move events
   */
  private onTouchMove(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length > 0) {
      const touch = event.touches[0];
      this.targetMousePosition.x = touch.clientX / window.innerWidth;
      this.targetMousePosition.y = 1.0 - touch.clientY / window.innerHeight;
    }
  }

  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    if (this.fullscreen() && this.mesh) {
      this.updateFullscreenScale();
    }
  }
}
