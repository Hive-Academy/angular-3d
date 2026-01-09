/**
 * @fileoverview WarpLinesComponent - Hyperspace tunnel effect for navigation.
 *
 * Creates a dynamic warp speed line effect using InstancedMesh with TSL materials.
 * Lines radiate from a focal point (center or shifted by direction), creating
 * the classic sci-fi "hyperspace tunnel" visual effect.
 *
 * Features:
 * - WebGPU-compatible using MeshBasicNodeMaterial with TSL opacity nodes
 * - InstancedMesh for single draw call performance (200+ lines)
 * - Radial lines that emanate from a focal point
 * - Direction-aware: focal point shifts based on movement direction
 * - Smooth intensity transitions with configurable duration
 * - Additive blending for glow effect
 * - Lines move radially outward for true 3D depth feeling
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
import { uv, float, smoothstep, sub, abs, mul } from 'three/tsl';
import { NG_3D_PARENT } from '../../../types/tokens';
import { RenderLoopService } from '../../../render-loop/render-loop.service';

/**
 * Line data for radial warp effect.
 */
interface WarpLine {
  /** Angle from center (radians) */
  angle: number;
  /** Distance from center (0-1 normalized, then scaled by radius) */
  distance: number;
  /** Z depth position */
  z: number;
  /** Random offset for variation */
  angleOffset: number;
  /** Speed multiplier for this line */
  speedMult: number;
}

/**
 * WarpLinesComponent - Hyperspace tunnel effect for navigation.
 *
 * Creates lines that radiate from a focal point, simulating the classic
 * sci-fi "warp speed" or "hyperspace jump" visual effect.
 *
 * @example
 * ```html
 * <!-- Basic usage -->
 * <a3d-warp-lines
 *   [intensity]="isFlying() ? 1 : 0"
 *   [direction]="flyingRight ? 1 : -1"
 * />
 *
 * <!-- Customized appearance -->
 * <a3d-warp-lines
 *   [intensity]="flightProgress()"
 *   [direction]="navigationDirection()"
 *   [lineCount]="300"
 *   [color]="'#00ffff'"
 *   [speed]="60"
 * />
 * ```
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
   * Controls opacity, line stretch, and movement speed.
   * @default 0
   */
  readonly intensity = input<number>(0);

  /**
   * Movement direction for focal point shift.
   * - -1: Moving left (focal point shifts right)
   * - 0: No direction (centered focal point)
   * - 1: Moving right (focal point shifts left)
   * @default 0
   */
  readonly direction = input<number>(0);

  /**
   * Number of speed lines to render.
   * @default 200
   */
  readonly lineCount = input<number>(200);

  /**
   * Line color (hex string or CSS color).
   * @default '#ffffff'
   */
  readonly color = input<string>('#ffffff');

  /**
   * Base length of lines in world units.
   * @default 1.5
   */
  readonly lineLength = input<number>(1.5);

  /**
   * Maximum stretch multiplier when intensity is 1.
   * @default 6
   */
  readonly stretchMultiplier = input<number>(6);

  /**
   * Maximum spread radius from center.
   * @default 25
   */
  readonly spreadRadius = input<number>(25);

  /**
   * Depth range for lines.
   * @default 40
   */
  readonly depthRange = input<number>(40);

  /**
   * Fade duration when intensity changes (ms).
   * @default 300
   */
  readonly transitionDuration = input<number>(300);

  /**
   * Speed of radial outward movement.
   * @default 40
   */
  readonly speed = input<number>(40);

  /**
   * How much the focal point shifts based on direction (-1 to 1).
   * Higher values = more dramatic shift.
   * @default 8
   */
  readonly focalShift = input<number>(8);

  // ─────────────────────────────────────────────────────────────────────────
  // INJECTIONS
  // ─────────────────────────────────────────────────────────────────────────

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE PROPERTIES
  // ─────────────────────────────────────────────────────────────────────────

  private mesh: THREE.InstancedMesh | null = null;
  private geometry: THREE.PlaneGeometry | null = null;
  private material: THREE.MeshBasicNodeMaterial | null = null;
  private currentIntensity = 0;
  private targetIntensity = 0;
  private updateCleanup: (() => void) | null = null;
  private renderLoopSetup = false;

  /** Line data for animation */
  private lines: WarpLine[] = [];

  /** Current focal point X offset */
  private focalX = 0;

  private readonly prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  // ─────────────────────────────────────────────────────────────────────────
  // CONSTRUCTOR
  // ─────────────────────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      if (this.prefersReducedMotion) {
        this.targetIntensity = 0;
        return;
      }

      this.targetIntensity = this.intensity();

      if (this.targetIntensity > 0 && !this.mesh) {
        this.createLines();
      }
    });

    afterNextRender(() => {
      this.setupRenderLoop();
    });

    this.destroyRef.onDestroy(() => {
      this.updateCleanup?.();
      this.disposeResources();
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PRIVATE METHODS
  // ─────────────────────────────────────────────────────────────────────────

  private createMaterial(): THREE.MeshBasicNodeMaterial {
    const material = new THREE.MeshBasicNodeMaterial();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.side = THREE.DoubleSide;
    material.color = new THREE.Color(this.color());

    // Soft edges with fade at both ends
    const lengthFade = sub(
      float(1.0),
      smoothstep(float(0.3), float(0.5), abs(sub(uv().y, float(0.5))))
    );
    const widthFade = sub(
      float(1.0),
      smoothstep(float(0.3), float(0.5), abs(sub(uv().x, float(0.5))))
    );
    material.opacityNode = mul(lengthFade, widthFade);

    return material;
  }

  private createLines(): void {
    const count = this.lineCount();

    // Thin, elongated quad for each line
    this.geometry = new THREE.PlaneGeometry(0.04, this.lineLength());
    this.material = this.createMaterial();
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, count);
    this.mesh.frustumCulled = false;

    this.lines = [];
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      // Distribute lines in rings at various distances
      // More lines at outer edges for better coverage
      const ring = Math.pow(Math.random(), 0.7); // Bias toward outer
      const angle = Math.random() * Math.PI * 2;
      const z = -Math.random() * this.depthRange();

      this.lines.push({
        angle,
        distance: ring,
        z,
        angleOffset: (Math.random() - 0.5) * 0.3,
        speedMult: 0.7 + Math.random() * 0.6,
      });

      // Initial position (will be updated in render loop)
      dummy.position.set(0, 0, z);
      dummy.updateMatrix();
      this.mesh.setMatrixAt(i, dummy.matrix);
    }

    this.mesh.instanceMatrix.needsUpdate = true;

    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.mesh);
      }
    }
  }

  private setupRenderLoop(): void {
    if (this.renderLoopSetup) return;
    this.renderLoopSetup = true;

    const dummy = new THREE.Object3D();
    const lookTarget = new THREE.Vector3();

    this.updateCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      if (!this.mesh || !this.material) return;

      // Smooth intensity transition
      const transitionSpeed = delta / (this.transitionDuration() / 1000);
      this.currentIntensity +=
        (this.targetIntensity - this.currentIntensity) *
        Math.min(transitionSpeed, 1);

      this.material.opacity = this.currentIntensity;

      if (this.currentIntensity > 0.01) {
        const dir = this.direction();
        const speedValue = this.speed() * this.currentIntensity;
        const radius = this.spreadRadius();
        const depthRangeValue = this.depthRange();
        const stretchFactor =
          1 + (this.stretchMultiplier() - 1) * this.currentIntensity;

        // Smoothly interpolate focal point shift based on direction
        const targetFocalX = -dir * this.focalShift();
        this.focalX += (targetFocalX - this.focalX) * delta * 5;

        for (let i = 0; i < this.lines.length; i++) {
          const line = this.lines[i];

          // Move line outward radially and toward camera
          line.distance += (speedValue * delta * line.speedMult) / radius;
          line.z += speedValue * delta * 0.5;

          // Wrap around when line goes too far
          if (line.distance > 1.2 || line.z > 5) {
            line.distance = 0.05 + Math.random() * 0.1;
            line.z = -depthRangeValue * (0.8 + Math.random() * 0.2);
            line.angle = Math.random() * Math.PI * 2;
          }

          // Calculate position: radial from focal point
          const effectiveAngle =
            line.angle + line.angleOffset * this.currentIntensity;
          const dist = line.distance * radius;

          const x = this.focalX + Math.cos(effectiveAngle) * dist;
          const y = Math.sin(effectiveAngle) * dist;
          const z = line.z;

          dummy.position.set(x, y, z);

          // Orient line to point FROM focal point (radial direction)
          // Line should point outward from the center
          lookTarget.set(
            this.focalX + Math.cos(effectiveAngle) * (dist + 10),
            Math.sin(effectiveAngle) * (dist + 10),
            z
          );
          dummy.lookAt(lookTarget);

          // Rotate 90 degrees so the long axis points radially
          dummy.rotateZ(Math.PI / 2);

          // Scale: stretch based on intensity and distance from center
          const distanceScale = 0.5 + line.distance * 1.5;
          dummy.scale.set(1, stretchFactor * distanceScale, 1);

          dummy.updateMatrix();
          this.mesh.setMatrixAt(i, dummy.matrix);
        }

        this.mesh.instanceMatrix.needsUpdate = true;
      }

      if (this.currentIntensity < 0.01 && this.targetIntensity === 0) {
        this.disposeResources();
      }
    });
  }

  private disposeResources(): void {
    if (this.mesh && this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.remove(this.mesh);
      }
    }

    if (this.geometry) {
      try {
        this.geometry.dispose();
      } catch {
        // Geometry may already be disposed
      }
      this.geometry = null;
    }

    if (this.material) {
      try {
        this.material.dispose();
      } catch {
        // Material may already be disposed
      }
      this.material = null;
    }

    this.mesh = null;
    this.lines = [];
  }
}
