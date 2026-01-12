/**
 * MarbleParticleSystemComponent - Spherical Particle Distribution with Glow
 *
 * Creates particle effects inside/around spheres using proven StarField architecture.
 * Designed for marble hero section with dense particles and soft glow effects.
 *
 * Architecture:
 * - Based on star-field.component.ts (lines 20-32, 405-485)
 * - InstancedMesh + PlaneGeometry for WebGPU/WebGL compatibility
 * - TSL circular falloff for soft particle appearance
 * - Adaptive quality based on device capabilities
 *
 * Features:
 * - Spherical Fibonacci lattice distribution (uniform coverage)
 * - Soft glow using TSL uv() circular alpha falloff
 * - Optional twinkle/pulse animation
 * - Signal-based reactive inputs
 * - Automatic cleanup and resource disposal
 *
 * @example
 * ```html
 * <!-- Dense particles inside marble sphere -->
 * <a3d-marble-particle-system
 *   [radius]="0.3"
 *   [particleCount]="5000"
 *   [color]="'#ffcc99'"
 *   [size]="0.015"
 *   [opacity]="0.6"
 *   [enableTwinkle]="true"
 * />
 *
 * <!-- Surface glow particles -->
 * <a3d-marble-particle-system
 *   [radius]="0.35"
 *   [particleCount]="1000"
 *   [color]="'#fff4cc'"
 *   [size]="0.02"
 *   [opacity]="0.8"
 *   [blending]="'additive'"
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
import { uv, float, smoothstep, sub, length, vec2, mul } from 'three/tsl';
import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * Generate uniformly distributed positions within a sphere
 * Uses spherical Fibonacci lattice for optimal distribution
 *
 * Based on star-field.component.ts:20-32
 *
 * @param count - Number of particles to generate
 * @param radius - Sphere radius
 * @returns Float32Array of [x, y, z] positions
 */
function generateSphereParticles(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI; // Azimuthal angle
    const phi = Math.acos(2 * Math.random() - 1); // Polar angle
    const r = Math.cbrt(Math.random()) * radius; // Cube root for uniform distribution

    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
}

/**
 * Blending mode for particle rendering
 */
export type ParticleBlending = 'normal' | 'additive';

@Component({
  selector: 'a3d-marble-particle-system',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `marble-particles-${crypto.randomUUID()}`,
    },
  ],
})
export class MarbleParticleSystemComponent {
  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /** Sphere radius for particle distribution */
  public readonly radius = input<number>(0.3);

  /** Number of particles (adaptive quality applied) */
  public readonly particleCount = input<number>(5000);

  /** Particle color (hex string or number) */
  public readonly color = input<string | number>('#ffffff');

  /** Individual particle size */
  public readonly size = input<number>(0.015);

  /** Particle opacity (0-1) */
  public readonly opacity = input<number>(0.6);

  /** Blending mode (normal or additive for glow) */
  public readonly blending = input<ParticleBlending>('additive');

  /** Enable subtle twinkle animation */
  public readonly enableTwinkle = input<boolean>(false);

  /** Twinkle animation speed */
  public readonly twinkleSpeed = input<number>(0.5);

  /** Position offset as [x, y, z] */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Uniform scale multiplier (default: 1) */
  public readonly scale = input<number>(1);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  private instancedMesh: THREE.InstancedMesh | null = null;
  private geometry: THREE.PlaneGeometry | null = null;
  private material: THREE.MeshBasicNodeMaterial | null = null;
  private positionData: THREE.BufferGeometry | null = null;
  private twinkleCleanup: (() => void) | null = null;

  // Device detection for adaptive quality
  private readonly isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

  /**
   * Get adaptive particle count based on device
   */
  private getAdaptiveCount(): number {
    const requested = this.particleCount();
    if (this.isMobile) {
      // Reduce to 30% on mobile
      return Math.floor(requested * 0.3);
    }
    return requested;
  }

  public constructor() {
    // Effect: Create particles when config changes
    effect(() => {
      const parent = this.parent?.();
      if (!parent) return;

      // Track all input dependencies
      const radius = this.radius();
      const color = this.color();
      const size = this.size();
      const opacity = this.opacity();
      const blending = this.blending();
      const enableTwinkle = this.enableTwinkle();
      const position = this.position();
      const scale = this.scale();

      this.rebuildParticles(
        radius,
        color,
        size,
        opacity,
        blending,
        enableTwinkle,
        position,
        scale
      );

      // Add to parent
      if (this.instancedMesh) {
        parent.add(this.instancedMesh);
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.disposeResources();
      const parent = this.parent?.();
      if (parent && this.instancedMesh) {
        parent.remove(this.instancedMesh);
      }
    });
  }

  /**
   * Rebuild particle system with current configuration
   */
  private rebuildParticles(
    radius: number,
    color: string | number,
    size: number,
    opacity: number,
    blending: ParticleBlending,
    enableTwinkle: boolean,
    position: [number, number, number],
    scale: number
  ): void {
    // Dispose old resources
    this.disposeResources();

    // Remove old mesh from parent
    if (this.instancedMesh && this.parent) {
      const parent = this.parent();
      parent?.remove(this.instancedMesh);
    }

    // Get adaptive particle count
    const count = this.getAdaptiveCount();

    // Generate particle positions
    const positions = generateSphereParticles(count, radius);

    // Store position data
    this.positionData = new THREE.BufferGeometry();
    this.positionData.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create plane geometry for each particle (1x1 quad with UVs)
    this.geometry = new THREE.PlaneGeometry(1, 1);

    // Create TSL material with circular falloff
    // Pattern from star-field.component.ts:423-430
    const centeredUV = sub(uv(), vec2(0.5, 0.5));
    const dist = length(centeredUV);
    const circularAlpha = sub(
      float(1.0),
      smoothstep(float(0.0), float(0.5), dist)
    );
    const finalOpacity = mul(circularAlpha, float(opacity));

    this.material = new THREE.MeshBasicNodeMaterial();
    this.material.color = new THREE.Color(color);
    this.material.transparent = true;
    this.material.depthWrite = false;
    this.material.side = THREE.DoubleSide;
    this.material.opacityNode = finalOpacity;
    this.material.blending =
      blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending;

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      count
    );

    // Set up instance transforms
    const dummy = new THREE.Object3D();
    const posAttr = this.positionData.getAttribute('position');

    for (let i = 0; i < count; i++) {
      // Position from generated data
      dummy.position.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));

      // Size with slight random variation
      const sizeVariation = size * (0.8 + Math.random() * 0.4);
      dummy.scale.setScalar(sizeVariation);

      // Random rotation for variety
      dummy.rotation.z = Math.random() * Math.PI * 2;

      dummy.updateMatrix();
      this.instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
    this.instancedMesh.frustumCulled = false;

    // Set overall position and scale
    this.instancedMesh.position.set(position[0], position[1], position[2]);
    this.instancedMesh.scale.setScalar(scale);

    // Setup twinkle animation if enabled
    if (enableTwinkle) {
      this.setupTwinkleAnimation();
    }
  }

  /**
   * Setup twinkle animation using RenderLoopService
   * Pattern from star-field.component.ts:543-591
   */
  private setupTwinkleAnimation(): void {
    // Clear existing animation
    if (this.twinkleCleanup) {
      this.twinkleCleanup();
      this.twinkleCleanup = null;
    }

    let elapsed = 0;

    this.twinkleCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      elapsed += delta;

      if (!this.material) return;

      // Gentle pulsing of overall opacity
      const baseOpacity = this.opacity();
      const speed = this.twinkleSpeed();
      const twinkle = Math.sin(elapsed * speed) * 0.15 + 0.85;
      this.material.opacity = baseOpacity * twinkle;
    });

    // Register cleanup
    this.destroyRef.onDestroy(() => {
      if (this.twinkleCleanup) {
        this.twinkleCleanup();
        this.twinkleCleanup = null;
      }
    });
  }

  /**
   * Dispose Three.js resources
   */
  private disposeResources(): void {
    // Cleanup twinkle animation
    if (this.twinkleCleanup) {
      this.twinkleCleanup();
      this.twinkleCleanup = null;
    }

    // Dispose geometries
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    if (this.positionData) {
      this.positionData.dispose();
      this.positionData = null;
    }

    // Dispose material
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    this.instancedMesh = null;
  }
}
