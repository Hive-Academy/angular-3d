/**
 * @fileoverview WarpLinesComponent - Speed line effect for camera flight navigation.
 *
 * Creates a dynamic warp speed line effect using InstancedMesh with TSL materials.
 * Lines are distributed in a cylinder around the camera path and stretch based
 * on the intensity input, creating a sense of high-speed movement.
 *
 * Features:
 * - WebGPU-compatible using MeshBasicNodeMaterial with TSL opacity nodes
 * - InstancedMesh for single draw call performance (200+ lines)
 * - Smooth intensity transitions with configurable duration
 * - Additive blending for glow effect
 * - Lazy resource creation (mesh created only when intensity > 0)
 * - Proper resource disposal when intensity returns to 0
 *
 * @module warp-lines
 */

import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  effect,
  DestroyRef,
} from '@angular/core';
import { afterNextRender } from '@angular/core';
import * as THREE from 'three/webgpu';
import { uv, float, smoothstep, sub, length, vec2, mul, abs } from 'three/tsl';
import { NG_3D_PARENT } from '../../../types/tokens';
import { RenderLoopService } from '../../../render-loop/render-loop.service';

/**
 * WarpLinesComponent - Speed line effect for camera flight navigation.
 *
 * Creates elongated lines that stretch based on intensity, simulating
 * the classic sci-fi "warp speed" visual effect. Uses InstancedMesh
 * for optimal performance with hundreds of lines.
 *
 * The component lazily creates Three.js resources when intensity first
 * goes above 0, and disposes them when intensity returns to 0 and the
 * fade-out completes. This ensures minimal memory usage when the effect
 * is not active.
 *
 * @example
 * ```html
 * <!-- Basic usage - intensity controlled by signal -->
 * <a3d-warp-lines
 *   [intensity]="isFlying() ? 1 : 0"
 * />
 *
 * <!-- Customized appearance -->
 * <a3d-warp-lines
 *   [intensity]="flightProgress()"
 *   [lineCount]="250"
 *   [color]="'#00ffff'"
 *   [lineLength]="2.5"
 *   [stretchMultiplier]="6"
 *   [spreadRadius]="25"
 *   [transitionDuration]="400"
 * />
 * ```
 *
 * @selector a3d-warp-lines
 * @standalone true
 */
@Component({
  selector: 'a3d-warp-lines',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class WarpLinesComponent {
  // ─────────────────────────────────────────────────────────────────────────
  // INPUTS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Effect intensity from 0 (off) to 1 (full).
   * Controls both opacity and line stretch.
   *
   * - 0: Lines are invisible and resources may be disposed
   * - 0.5: Lines at 50% opacity with moderate stretch
   * - 1: Full opacity with maximum stretch (lineLength * stretchMultiplier)
   *
   * @default 0
   */
  readonly intensity = input<number>(0);

  /**
   * Number of speed lines to render.
   *
   * Higher values create a denser effect but may impact performance.
   * Uses InstancedMesh so performance impact is minimal.
   *
   * @default 200
   */
  readonly lineCount = input<number>(200);

  /**
   * Line color (hex string or CSS color).
   *
   * Works with any valid CSS color format:
   * - Hex: '#ffffff', '#00ffcc'
   * - Named: 'white', 'cyan'
   *
   * @default '#ffffff'
   */
  readonly color = input<string>('#ffffff');

  /**
   * Base length of lines in world units.
   *
   * This is the line length at rest (before stretch is applied).
   *
   * @default 2
   */
  readonly lineLength = input<number>(2);

  /**
   * Maximum stretch multiplier when intensity is 1.
   *
   * Final line length = lineLength * (1 + (stretchMultiplier - 1) * intensity)
   *
   * @default 5
   */
  readonly stretchMultiplier = input<number>(5);

  /**
   * Spread radius around camera path (cylinder radius).
   *
   * Lines are distributed evenly within a cylinder of this radius.
   *
   * @default 20
   */
  readonly spreadRadius = input<number>(20);

  /**
   * Depth range in which lines are distributed.
   *
   * Lines spawn randomly within this Z-range.
   *
   * @default 50
   */
  readonly depthRange = input<number>(50);

  /**
   * Fade duration when intensity changes (milliseconds).
   *
   * Controls how quickly lines fade in/out when intensity changes.
   *
   * @default 300
   */
  readonly transitionDuration = input<number>(300);

  // ─────────────────────────────────────────────────────────────────────────
  // INJECTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /** Parent 3D object provider (Scene or Group) */
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  /** Render loop service for per-frame updates */
  private readonly renderLoop = inject(RenderLoopService);

  /** Destroy reference for cleanup registration */
  private readonly destroyRef = inject(DestroyRef);

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────

  /** InstancedMesh containing all warp lines */
  private mesh: THREE.InstancedMesh | null = null;

  /** Plane geometry used for each line instance */
  private geometry: THREE.PlaneGeometry | null = null;

  /** TSL-based material with opacity node for soft edges */
  private material: THREE.MeshBasicNodeMaterial | null = null;

  /** Current interpolated intensity (for smooth transitions) */
  private currentIntensity = 0;

  /** Target intensity from input (what we're transitioning toward) */
  private targetIntensity = 0;

  /** Cleanup function for render loop callback */
  private updateCleanup: (() => void) | null = null;

  /** Base transformation matrices for each line (before stretch) */
  private baseMatrices: THREE.Matrix4[] = [];

  /** Z-depth of each line (for potential depth-based effects) */
  private lineDepths: number[] = [];

  /** Flag to track if render loop is set up */
  private renderLoopSetup = false;

  /**
   * Check if user prefers reduced motion.
   *
   * When enabled, warp effects are disabled entirely for accessibility.
   * The intensity is forced to 0 visually, preventing any motion.
   */
  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────────────────────────────────────

  constructor() {
    // Effect: Watch intensity input and create/update mesh as needed
    effect(() => {
      // Skip warp effects entirely if user prefers reduced motion
      // This respects accessibility preferences by preventing motion effects
      if (this.prefersReducedMotion) {
        this.targetIntensity = 0;
        return;
      }

      this.targetIntensity = this.intensity();

      // Create lines mesh when intensity first goes above 0
      if (this.targetIntensity > 0 && !this.mesh) {
        this.createLines();
      }
    });

    // Setup render loop after next render (browser-only)
    afterNextRender(() => {
      this.setupRenderLoop();
    });

    // Register cleanup on component destroy
    this.destroyRef.onDestroy(() => {
      this.updateCleanup?.();
      this.disposeResources();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE METHODS - MATERIAL CREATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates the TSL-based material for warp lines.
   *
   * Uses MeshBasicNodeMaterial with a custom opacity node that creates
   * soft-edged lines with circular falloff at the edges and lengthwise
   * fade for a more natural appearance.
   *
   * @returns Configured MeshBasicNodeMaterial
   */
  private createMaterial(): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.side = THREE.DoubleSide;
    material.color = new THREE.Color(this.color());

    // TSL opacity node: creates soft-edged lines
    // Center UV coordinates (0,0 at center instead of corner)
    const centeredUV = sub(uv(), vec2(0.5, 0.5));

    // Circular distance from center
    const dist = length(centeredUV);

    // Edge fade: opaque at center, transparent at edges (circular falloff)
    const edgeFade = sub(float(1.0), smoothstep(float(0.0), float(0.5), dist));

    // Lengthwise fade: stronger at center of line, fades toward ends
    // This creates tapered line ends for a more natural look
    const lengthFade = sub(
      float(1.0),
      smoothstep(float(0.3), float(0.5), abs(sub(uv().y, float(0.5))))
    );

    // Combine edge and length fades
    const finalOpacity = mul(edgeFade, lengthFade);
    material.opacityNode = finalOpacity;

    return material;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE METHODS - LINE CREATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates the warp lines mesh with InstancedMesh.
   *
   * Lines are distributed in a cylindrical volume around the camera path.
   * Each line is a thin plane oriented to face the camera direction.
   * Uses sqrt() for radius distribution to ensure even coverage.
   */
  private createLines(): void {
    const count = this.lineCount();
    const radius = this.spreadRadius();
    const depthRangeValue = this.depthRange();

    // Create elongated quad geometry for each line
    // Width is thin (0.03), height is lineLength
    this.geometry = new THREE.PlaneGeometry(0.03, this.lineLength());

    // Create TSL material with soft edges
    this.material = this.createMaterial();

    // Create instanced mesh for single draw call
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
    this.mesh.frustumCulled = false; // Lines span entire view

    // Distribute lines in a cylinder around the camera path
    const dummy = new THREE.Object3D();
    this.baseMatrices = [];
    this.lineDepths = [];

    for (let i = 0; i < count; i++) {
      // Random angle around the cylinder (0 to 2*PI)
      const angle = Math.random() * Math.PI * 2;

      // Random radius with sqrt for even distribution across area
      // Without sqrt, lines would cluster at the center
      const r = Math.sqrt(Math.random()) * radius;

      // Random Z position within depth range (centered at 0)
      const z = (Math.random() - 0.5) * depthRangeValue;

      // Set position in cylindrical coordinates
      dummy.position.set(Math.cos(angle) * r, Math.sin(angle) * r, z);

      // Orient line to point toward camera (along negative Z-axis)
      // lookAt a point further back along Z creates forward-facing lines
      dummy.lookAt(dummy.position.x, dummy.position.y, z - 10);

      // Update and store the transformation matrix
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);

      // Store base matrix for animation (before stretch is applied)
      this.baseMatrices.push(dummy.matrix.clone());
      this.lineDepths.push(z);
    }

    // Mark instance matrix as needing update
    this.mesh.instanceMatrix.needsUpdate = true;

    // Add to parent scene/group
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.mesh);
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE METHODS - ANIMATION
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Sets up the render loop callback for animation.
   *
   * Called once after next render. Handles:
   * - Smooth intensity transitions
   * - Line stretching based on intensity
   * - Resource disposal when fully faded out
   */
  private setupRenderLoop(): void {
    if (this.renderLoopSetup) return;
    this.renderLoopSetup = true;

    // Reusable objects for matrix decomposition (avoid allocation per frame)
    const matrix = new THREE.Matrix4();
    const scale = new THREE.Vector3();
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();

    this.updateCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      // Skip if mesh not created yet
      if (!this.mesh || !this.material) return;

      // Calculate transition speed based on delta and configured duration
      // transitionDuration is in ms, delta is in seconds
      const transitionSpeed = delta / (this.transitionDuration() / 1000);

      // Smoothly interpolate current intensity toward target
      this.currentIntensity +=
        (this.targetIntensity - this.currentIntensity) *
        Math.min(transitionSpeed, 1);

      // Update material opacity based on current intensity
      this.material.opacity = this.currentIntensity;

      // Stretch lines based on intensity (only if visible)
      if (this.currentIntensity > 0.01) {
        // Calculate stretch factor: 1 at intensity=0, stretchMultiplier at intensity=1
        const stretchFactor =
          1 + (this.stretchMultiplier() - 1) * this.currentIntensity;

        const lineCountValue = this.lineCount();
        for (let i = 0; i < lineCountValue; i++) {
          // Get the original base matrix
          matrix.copy(this.baseMatrices[i]);

          // Decompose into position, rotation, scale
          matrix.decompose(position, quaternion, scale);

          // Apply stretch to Y axis (line length direction)
          scale.y = stretchFactor;

          // Recompose the matrix with new scale
          matrix.compose(position, quaternion, scale);

          // Update the instance
          this.mesh.setMatrixAt(i, matrix);
        }

        // Mark instance matrix as needing update
        this.mesh.instanceMatrix.needsUpdate = true;
      }

      // Dispose resources when fully faded out
      if (this.currentIntensity < 0.01 && this.targetIntensity === 0) {
        this.disposeResources();
      }
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE METHODS - CLEANUP
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Disposes all Three.js resources.
   *
   * Called when:
   * - Component is destroyed
   * - Intensity fades to 0 (lazy cleanup)
   *
   * Safely handles resources that may already be disposed.
   */
  private disposeResources(): void {
    // Remove mesh from parent
    if (this.mesh && this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.remove(this.mesh);
      }
    }

    // Dispose geometry (wrap in try-catch for WebGPU safety)
    if (this.geometry) {
      try {
        this.geometry.dispose();
      } catch {
        // Geometry may already be disposed
      }
      this.geometry = null;
    }

    // Dispose material (wrap in try-catch for WebGPU safety)
    if (this.material) {
      try {
        this.material.dispose();
      } catch {
        // Material may already be disposed
      }
      this.material = null;
    }

    // Clear mesh reference
    this.mesh = null;

    // Clear stored matrices
    this.baseMatrices = [];
    this.lineDepths = [];
  }
}
