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
import {
  uv,
  float,
  smoothstep,
  sub,
  length,
  vec2,
  mul,
  instancedBufferAttribute,
} from 'three/tsl';

import { NG_3D_PARENT } from '../../types/tokens';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { OBJECT_ID } from '../../tokens/object-id.token';

/**
 * Box-Muller transform for Gaussian random numbers
 */
function gaussianRandom(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate particles with various distribution types
 * @returns { positions, normalizedRadii, sizes }
 */
function generateSphereParticles(
  count: number,
  maxRadius: number,
  minRadius: number,
  distribution: 'uniform' | 'gaussian' | 'shell',
  sizeVariation: [number, number]
): {
  positions: Float32Array;
  normalizedRadii: Float32Array; // 0-1 for color gradient
  sizes: Float32Array; // Per-particle size multipliers
} {
  const positions = new Float32Array(count * 3);
  const normalizedRadii = new Float32Array(count);
  const sizes = new Float32Array(count);

  const [sizeMin, sizeMax] = sizeVariation;

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);

    let r: number;

    if (distribution === 'gaussian') {
      // Gaussian (center-weighted): use Box-Muller transform
      // Clamp to 0-maxRadius range
      const gaussian = Math.abs(gaussianRandom()) * 0.3; // 0.3 = concentration factor
      r = Math.min(gaussian * maxRadius, maxRadius);
      if (r < minRadius) r = minRadius;
    } else if (distribution === 'shell') {
      // Shell: uniform distribution between minRadius and maxRadius
      r = minRadius + Math.random() * (maxRadius - minRadius);
    } else {
      // Uniform: cube root for volume distribution
      r =
        minRadius > 0
          ? minRadius + Math.random() * (maxRadius - minRadius)
          : Math.cbrt(Math.random()) * maxRadius;
    }

    // Store position
    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.cos(phi);
    positions[idx + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Store normalized radius (0 at center, 1 at maxRadius)
    normalizedRadii[i] = r / maxRadius;

    // Store random size multiplier
    sizes[i] = sizeMin + Math.random() * (sizeMax - sizeMin);
  }

  return { positions, normalizedRadii, sizes };
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

  /** Sphere radius for boundary constraint (maximum radius) */
  public readonly sphereRadius = input<number>(1.0);

  /** Minimum radius for exterior halo particles (0 = fill entire sphere) */
  public readonly minRadius = input<number>(0);

  /** Distribution type: uniform, gaussian (center-weighted), shell */
  public readonly distribution = input<'uniform' | 'gaussian' | 'shell'>(
    'uniform'
  );

  /** Base particle color (hex or THREE.Color) */
  public readonly color = input<string | number>('#ff8866');

  /** Color gradient from center to edge (if provided, overrides single color) */
  public readonly colorGradient = input<(string | number)[] | null>(null);

  /** Individual particle size (scale factor) */
  public readonly pointSize = input<number>(0.015);

  /** Size variation range: [min, max] multiplier (e.g., [0.5, 1.5]) */
  public readonly sizeVariation = input<[number, number]>([1.0, 1.0]);

  /** Particle opacity */
  public readonly opacity = input<number>(0.6);

  /** Noise-based motion speed */
  public readonly noiseSpeed = input<number>(0.3);

  /** Sphere world position */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Sphere uniform scale multiplier */
  public readonly scale = input<number>(1.0);

  /** Emission speed for exterior particles (0 = no emission, >0 = drift outward) */
  public readonly emissionSpeed = input<number>(0);

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
  private particleSizes: Float32Array | null = null; // Per-particle size multipliers
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

    // Effect: Update position reactively when it changes
    effect(() => {
      const [x, y, z] = this.position();
      if (this.instancedMesh) {
        this.instancedMesh.position.set(x, y, z);
      }
    });

    // Effect: Update scale reactively when it changes
    effect(() => {
      const s = this.scale();
      if (this.instancedMesh) {
        this.instancedMesh.scale.setScalar(s);
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
    const maxRadius = this.sphereRadius();
    const minRadius = this.minRadius();
    const distribution = this.distribution();
    const sizeVariation = this.sizeVariation();
    const colorGradient = this.colorGradient();

    // Generate particle positions, radii, and sizes
    const { positions, normalizedRadii, sizes } = generateSphereParticles(
      count,
      maxRadius,
      minRadius,
      distribution,
      sizeVariation
    );

    // Store sizes for instance transforms
    this.particleSizes = sizes;

    // Create instance colors from gradient or single color
    const instanceColors = new Float32Array(count * 3);
    if (colorGradient && colorGradient.length > 0) {
      // Gradient: interpolate colors based on normalized radius
      for (let i = 0; i < count; i++) {
        const t = normalizedRadii[i]; // 0 at center, 1 at edge
        const color = this.interpolateColorGradient(colorGradient, t);
        instanceColors[i * 3] = color.r;
        instanceColors[i * 3 + 1] = color.g;
        instanceColors[i * 3 + 2] = color.b;
      }
    } else {
      // Single color: use base color for all particles
      const baseColor = new THREE.Color(this.color());
      for (let i = 0; i < count; i++) {
        instanceColors[i * 3] = baseColor.r;
        instanceColors[i * 3 + 1] = baseColor.g;
        instanceColors[i * 3 + 2] = baseColor.b;
      }
    }

    // Create base geometry with positions
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Create quad geometry for each particle
    this.quadGeometry = new THREE.PlaneGeometry(1, 1);

    // Add instance color attribute to quad geometry
    this.quadGeometry.setAttribute(
      'instanceColor',
      new THREE.InstancedBufferAttribute(instanceColors, 3)
    );

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

    // Set instance transforms (with per-particle sizes)
    this.setupInstanceTransforms(positions, count);

    // Initialize particle data for animation
    this.initializeParticleData(count);

    // Setup animation loop
    this.setupAnimationLoop();
  }

  /**
   * Create TSL material with soft circular particles and instance colors
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

    // Use per-instance color from instanceColor attribute
    // This will be set per-particle in the geometry
    this.material.colorNode = instancedBufferAttribute(
      this.quadGeometry!.getAttribute(
        'instanceColor'
      ) as THREE.InstancedBufferAttribute
    );
  }

  /**
   * Setup instance transforms for all particles (with per-particle sizes)
   */
  private setupInstanceTransforms(
    positions: Float32Array,
    count: number
  ): void {
    if (!this.instancedMesh || !this.particleSizes) return;

    const matrix = new THREE.Matrix4();
    const baseSize = this.pointSize();

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];

      // Apply per-particle size multiplier
      const size = baseSize * this.particleSizes[i];

      // Set position and scale
      matrix.makeScale(size, size, size);
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
   * Setup animation loop for organic motion with emission
   */
  private setupAnimationLoop(): void {
    const maxRadius = this.sphereRadius();
    const minRadius = this.minRadius();
    const noiseSpeed = this.noiseSpeed();
    const emissionSpeed = this.emissionSpeed();
    const baseSize = this.pointSize();
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();

    this.updateCleanup = this.renderLoop.registerUpdateCallback((_delta) => {
      if (!this.instancedMesh || !this.particleSizes) return;

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

        // Update velocity from noise
        data.velocity.x += noiseX;
        data.velocity.y += noiseY;
        data.velocity.z += noiseZ;

        // Emission: Add radial outward force for exterior particles
        if (emissionSpeed > 0) {
          const dist = position.length();
          if (dist > 0.01) {
            // Normalize to get direction
            const dirX = position.x / dist;
            const dirY = position.y / dist;
            const dirZ = position.z / dist;

            // Add outward force
            data.velocity.x += dirX * emissionSpeed * 0.0001;
            data.velocity.y += dirY * emissionSpeed * 0.0001;
            data.velocity.z += dirZ * emissionSpeed * 0.0001;
          }
        }

        // Apply velocity
        position.x += data.velocity.x;
        position.y += data.velocity.y;
        position.z += data.velocity.z;

        // HARD CLAMPING: Enforce strict sphere/shell boundaries
        const dist = position.length();

        // Clamp to max radius (outer boundary)
        if (dist > maxRadius) {
          position.normalize().multiplyScalar(maxRadius);
        }

        // Clamp to min radius (inner boundary for exterior halo)
        if (minRadius > 0 && dist < minRadius) {
          position.normalize().multiplyScalar(minRadius);
        }

        // Damping
        data.velocity.multiplyScalar(0.98);

        // Update matrix with per-particle size
        const size = baseSize * this.particleSizes[i];
        matrix.makeScale(size, size, size);
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
   * Interpolate color gradient based on normalized radius (0-1)
   */
  private interpolateColorGradient(
    gradient: (string | number)[],
    t: number
  ): THREE.Color {
    if (gradient.length === 1) {
      return new THREE.Color(gradient[0]);
    }

    // Clamp t to 0-1
    t = Math.max(0, Math.min(1, t));

    // Find segment
    const segmentCount = gradient.length - 1;
    const segmentIndex = Math.floor(t * segmentCount);
    const segmentT = t * segmentCount - segmentIndex;

    // Clamp segment index
    const index1 = Math.min(segmentIndex, segmentCount - 1);
    const index2 = Math.min(index1 + 1, gradient.length - 1);

    // Interpolate between two colors
    const color1 = new THREE.Color(gradient[index1]);
    const color2 = new THREE.Color(gradient[index2]);

    return color1.lerp(color2, segmentT);
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
    this.particleSizes = null;
    this.instancedMesh = null;
  }

  public ngOnDestroy(): void {
    this.dispose();
  }
}
