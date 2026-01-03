/**
 * VolumetricBackgroundComponent - Volumetric Fog/Cloud Background
 *
 * Creates atmospheric volumetric fog and cloud backgrounds using
 * TSL procedural textures from tsl-textures/volumetric-particle-cloud.ts.
 *
 * Features:
 * - Volumetric particle cloud with adjustable density and scattering
 * - Optional depth fade for atmospheric perspective
 * - Animated fog movement with adjustable speed
 * - Fullscreen mode (fills camera frustum) or positioned mode (3D positioning)
 * - Responsive scaling on window resize and camera FOV changes
 * - Adaptive quality (targets 30 FPS mobile, 60 FPS desktop)
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy
 * - Signal-based inputs for reactive updates
 * - TSL procedural texture (MeshBasicNodeMaterial)
 * - Uses RenderLoopService for time animation
 * - ViewportPositionDirective for depth layering via hostDirectives
 *
 * @example
 * ```html
 * <a3d-volumetric-background
 *   [density]="0.1"
 *   [scattering]="0.5"
 *   [depthFade]="true"
 *   [animationSpeed]="1.0"
 *   viewportPosition="center"
 *   [viewportZ]="-30"
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
import { tslVolumetricParticleCloud } from '../shaders/tsl-textures';

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
  selector: 'a3d-volumetric-background',
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
export class VolumetricBackgroundComponent {
  // ========================================================================
  // Signal Inputs - Configuration
  // ========================================================================

  /**
   * Particle density (typical range: 0.05-0.2)
   * Higher values create denser fog
   */
  public readonly density = input<number>(0.1);

  /**
   * Light scattering amount (typical range: 0.3-0.7)
   * Controls how light interacts with fog particles
   */
  public readonly scattering = input<number>(0.5);

  /**
   * Enable depth fade for atmospheric perspective
   */
  public readonly depthFade = input<boolean>(true);

  /**
   * Animation speed multiplier (higher = faster fog movement)
   */
  public readonly animationSpeed = input<number>(1.0);

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
  private uTime!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uDensity!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uScattering!: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private uSpeed!: any;

  // ========================================================================
  // Lifecycle & Event Management
  // ========================================================================

  private renderLoopCleanup!: () => void;
  private isAddedToScene = false;

  private boundOnResize!: () => void;

  // ========================================================================
  // Constructor & Lifecycle
  // ========================================================================

  public constructor() {
    // Bind event handlers
    this.boundOnResize = this.onWindowResize.bind(this);

    // Effect: Add mesh to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMesh();
        parent.add(this.mesh);
        this.isAddedToScene = true;

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
      this.uScattering.value = this.scattering();
      this.uSpeed.value = this.animationSpeed();
    });

    // Effect: Update fullscreen scale when camera becomes available
    effect(() => {
      const camera = this.sceneService?.camera();
      const isFullscreen = this.fullscreen();

      if (camera && this.mesh && isFullscreen) {
        this.updateFullscreenScale();
      }
    });

    // Animation loop - update time
    this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (!this.uTime) return;
      this.uTime.value += delta * this.animationSpeed();
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      // Cleanup render loop callback
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
      }

      // Remove resize listener
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
   * Create the background mesh with volumetric texture
   */
  private createMesh(): void {
    const { uniform } = getTSL();

    // Create TSL uniform nodes
    this.uTime = uniform(0);
    this.uDensity = uniform(this.density());
    this.uScattering = uniform(this.scattering());
    this.uSpeed = uniform(this.animationSpeed());

    // Create TSL material with volumetric texture
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
   * Create TSL Material with Volumetric Particle Cloud Texture
   */
  private createTSLMaterial(): MeshBasicNodeMaterial {
    const { screenUV, uv } = getTSL();

    // Capture fullscreen mode at material creation time
    const isFullscreen = this.fullscreen();

    // Choose UV source based on fullscreen mode
    const uvSource = isFullscreen ? screenUV : uv();

    // Apply volumetric particle cloud texture
    const volumetricNode = tslVolumetricParticleCloud({
      uv: uvSource,
      density: this.uDensity,
      scattering: this.uScattering,
      depthFade: this.depthFade(),
      time: this.uTime,
      speed: this.uSpeed,
    });

    const material = new MeshBasicNodeMaterial();
    material.colorNode = volumetricNode;
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
  // Event Handlers
  // ========================================================================

  /**
   * Handle window resize events
   */
  private onWindowResize(): void {
    if (this.fullscreen() && this.mesh) {
      this.updateFullscreenScale();
    }
  }
}
