/**
 * GpuParticleSphereComponent - High-Performance Particle Sphere
 *
 * Uses InstancedMesh with TSL for 65k particles in a spherical cloud.
 * Based on the proven StarFieldComponent architecture.
 *
 * Key Implementation:
 * - InstancedMesh with PlaneGeometry quads (WebGPU compatible)
 * - TSL circular falloff for soft particles
 * - CPU-based animation (simple noise motion)
 * - Additive blending for glow effect
 *
 * @example
 * ```html
 * <a3d-gpu-particle-sphere
 *   [particleCount]="65536"
 *   [sphereRadius]="2.5"
 *   [color]="'#ff8866'"
 *   [pointSize]="0.015"
 *   [position]="[0, 0, 0]"
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
  OnDestroy,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { uv, float, smoothstep, sub, length, vec2, mul } from 'three/tsl';

import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * Generate particles uniformly distributed in a sphere
 */
function generateSphereParticles(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * radius; // Cube root for volume distribution

    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.cos(phi);
    positions[idx + 2] = r * Math.sin(phi) * Math.sin(theta);
  }

  return positions;
}

/**
 * Per-particle data for animation
 */
interface ParticleData {
  velocity: THREE.Vector3;
  noiseOffset: THREE.Vector3;
}

@Component({
  selector: 'a3d-gpu-particle-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `gpu-particles-${crypto.randomUUID()}`,
    },
  ],
})
export class GpuParticleSphereComponent implements OnDestroy {
  // ============================================================================
  // Configuration Inputs
  // ============================================================================

  /** Number of particles (default: 65536 for good density) */
  public readonly particleCount = input<number>(65536);

  /** Sphere radius for boundary constraint */
  public readonly sphereRadius = input<number>(1.0);

  /** Particle color (hex or THREE.Color) */
  public readonly color = input<string | number>('#ff8866');

  /** Individual particle size (scale factor) */
  public readonly pointSize = input<number>(0.015);

  /** Particle opacity */
  public readonly opacity = input<number>(0.6);

  /** Noise-based motion speed */
  public readonly noiseSpeed = input<number>(0.3);

  /** Sphere world position */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  private instancedMesh: THREE.InstancedMesh | null = null;
  private geometry: THREE.BufferGeometry | null = null;
  private quadGeometry: THREE.PlaneGeometry | null = null;
  private material: THREE.MeshBasicNodeMaterial | null = null;

  private particleData: ParticleData[] = [];
  private updateCleanup: (() => void) | null = null;

  public constructor() {
    // Effect: Build particle system when parent is ready
    effect(() => {
      const parent = this.parent?.();
      if (!parent) return;

      this.buildParticleSystem();

      if (this.instancedMesh) {
        parent.add(this.instancedMesh);
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      this.dispose();
      const parent = this.parent?.();
      if (parent && this.instancedMesh) {
        parent.remove(this.instancedMesh);
      }
    });
  }

  /**
   * Build complete particle system
   */
  private buildParticleSystem(): void {
    this.dispose();

    const count = this.particleCount();
    const radius = this.sphereRadius();

    // Generate particle positions
    const positions = generateSphereParticles(count, radius);

    // Create base geometry with positions
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create quad geometry for each particle
    this.quadGeometry = new THREE.PlaneGeometry(1, 1);

    // Create TSL material with circular falloff
    this.createMaterial();

    // Create instanced mesh
    if (!this.material) return;

    this.instancedMesh = new THREE.InstancedMesh(
      this.quadGeometry,
      this.material,
      count
    );
    this.instancedMesh.frustumCulled = false;

    // Set world position
    const [x, y, z] = this.position();
    this.instancedMesh.position.set(x, y, z);

    // Set instance transforms
    this.setupInstanceTransforms(positions, count);

    // Initialize particle data for animation
    this.initializeParticleData(count);

    // Setup animation loop
    this.setupAnimationLoop();
  }

  /**
   * Create TSL material with soft circular particles
   */
  private createMaterial(): void {
    // TSL circular falloff (same pattern as StarFieldComponent)
    const centeredUV = sub(uv(), vec2(0.5, 0.5));
    const dist = length(centeredUV);
    const circularAlpha = sub(
      float(1.0),
      smoothstep(float(0.0), float(0.5), dist)
    );
    const finalOpacity = mul(circularAlpha, float(this.opacity()));

    // Create material
    this.material = new THREE.MeshBasicNodeMaterial();
    this.material.transparent = true;
    this.material.depthWrite = false;
    this.material.blending = THREE.AdditiveBlending;
    this.material.side = THREE.DoubleSide;
    this.material.opacityNode = finalOpacity;
    this.material.color = new THREE.Color(this.color());
  }

  /**
   * Setup instance transforms for all particles
   */
  private setupInstanceTransforms(
    positions: Float32Array,
    count: number
  ): void {
    if (!this.instancedMesh) return;

    const matrix = new THREE.Matrix4();
    const particleSize = this.pointSize();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];

      // Set position and scale
      matrix.makeScale(particleSize, particleSize, particleSize);
      matrix.setPosition(x, y, z);

      this.instancedMesh.setMatrixAt(i, matrix);
    }

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Initialize per-particle data for animation
   */
  private initializeParticleData(count: number): void {
    this.particleData = [];

    for (let i = 0; i < count; i++) {
      this.particleData.push({
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.0001,
          (Math.random() - 0.5) * 0.0001,
          (Math.random() - 0.5) * 0.0001
        ),
        noiseOffset: new THREE.Vector3(
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100
        ),
      });
    }
  }

  /**
   * Setup animation loop for organic motion
   */
  private setupAnimationLoop(): void {
    const radius = this.sphereRadius();
    const noiseSpeed = this.noiseSpeed();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const particleSize = this.pointSize();

    this.updateCleanup = this.renderLoop.registerUpdateCallback((_delta) => {
      if (!this.instancedMesh) return;

      const time = performance.now() * 0.001;

      for (let i = 0; i < this.particleData.length; i++) {
        const data = this.particleData[i];

        // Get current position
        this.instancedMesh.getMatrixAt(i, matrix);
        position.setFromMatrixPosition(matrix);

        // Simple noise-based motion (sin waves)
        const noiseX =
          Math.sin((position.y + data.noiseOffset.x) * 5 + time * noiseSpeed) *
          0.0005;
        const noiseY =
          Math.sin((position.z + data.noiseOffset.y) * 5 + time * noiseSpeed) *
          0.0005;
        const noiseZ =
          Math.sin((position.x + data.noiseOffset.z) * 5 + time * noiseSpeed) *
          0.0005;

        // Update velocity
        data.velocity.x += noiseX;
        data.velocity.y += noiseY;
        data.velocity.z += noiseZ;

        // Apply velocity
        position.x += data.velocity.x;
        position.y += data.velocity.y;
        position.z += data.velocity.z;

        // Sphere boundary constraint
        const dist = position.length();
        if (dist > radius) {
          const force = (dist - radius) * 0.01;
          position.normalize().multiplyScalar(dist - force);
        }

        // Damping
        data.velocity.multiplyScalar(0.98);

        // Update matrix
        matrix.makeScale(particleSize, particleSize, particleSize);
        matrix.setPosition(position);
        this.instancedMesh.setMatrixAt(i, matrix);
      }

      this.instancedMesh.instanceMatrix.needsUpdate = true;
    });

    this.destroyRef.onDestroy(() => {
      if (this.updateCleanup) {
        this.updateCleanup();
        this.updateCleanup = null;
      }
    });
  }

  /**
   * Dispose resources
   */
  private dispose(): void {
    if (this.updateCleanup) {
      this.updateCleanup();
      this.updateCleanup = null;
    }

    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }

    if (this.quadGeometry) {
      this.quadGeometry.dispose();
      this.quadGeometry = null;
    }

    if (this.material) {
      this.material.dispose();
      this.material = null;
    }

    this.particleData = [];
    this.instancedMesh = null;
  }

  public ngOnDestroy(): void {
    this.dispose();
  }
}
