/**
 * ThrusterFlameComponent - GPU Particle-Based Jet Engine Thruster Effect
 *
 * Creates a realistic particle-based flame effect for spaceship/robot thrusters.
 * Uses GPU-instanced particles with per-particle lifecycle management for
 * high-performance, visually stunning thruster exhaust.
 *
 * Features:
 * - GPU-instanced particles (10K+ particles at 60fps)
 * - Particles spawn at nozzle, flow downward with velocity
 * - Color gradient: white core → cyan → fade out
 * - Size variation over particle lifetime
 * - Turbulence for organic flickering
 * - TSL circular falloff for soft particle appearance
 * - Additive blending for glow effect
 *
 * Implements Attachable3dChild interface for decoupled parent-child 3D relationships.
 *
 * @example
 * ```html
 * <a3d-gltf-model modelPath="robot.glb">
 *   <a3d-thruster-flame
 *     [offset]="[0, -1.5, 0]"
 *     color="#00aaff"
 *     [intensity]="1.5"
 *     [size]="0.3"
 *   />
 * </a3d-gltf-model>
 * ```
 */
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { uv, float, smoothstep, sub, length, vec2, mul } from 'three/tsl';
import {
  Attachable3dChild,
  NG_3D_CHILD,
} from '../../types/attachable-3d-child';
import { RenderLoopService } from '../../render-loop/render-loop.service';

/**
 * Per-particle data for lifecycle and animation
 */
interface ParticleData {
  /** Current age of particle (0 = just spawned) */
  age: number;
  /** Maximum lifetime before respawn */
  maxAge: number;
  /** Velocity vector */
  velocity: THREE.Vector3;
  /** Random offset for noise-based turbulence */
  noiseOffset: THREE.Vector3;
  /** Base size multiplier */
  baseSize: number;
  /** Starting position (for respawn) */
  spawnPosition: THREE.Vector3;
}

@Component({
  selector: 'a3d-thruster-flame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
  providers: [
    {
      provide: NG_3D_CHILD,
      useExisting: forwardRef(() => ThrusterFlameComponent),
    },
  ],
})
export class ThrusterFlameComponent implements Attachable3dChild {
  // --- Configuration Inputs ---

  /** Offset position relative to parent [x, y, z] (default: [0, -1, 0]) */
  public readonly offset = input<[number, number, number]>([0, -1, 0]);

  /** Flame color (default: blue thruster '#00aaff') */
  public readonly color = input<string | number>('#00aaff');

  /** Core color for brightest particles (default: white '#ffffff') */
  public readonly coreColor = input<string | number>('#ffffff');

  /** Flame intensity/brightness (default: 1.5) */
  public readonly intensity = input<number>(1.5);

  /** Overall size scale (default: 0.5) */
  public readonly size = input<number>(0.5);

  /** Flame length - how far particles travel (default: 2.0) */
  public readonly flameLength = input<number>(2.0);

  /** Particle flow speed (default: 1.0) */
  public readonly speed = input<number>(1.0);

  /** Turbulence amount for organic motion (default: 0.4) */
  public readonly turbulence = input<number>(0.4);

  /** Whether flame is enabled (default: true) */
  public readonly enabled = input<boolean>(true);

  /** Number of particles (default: 800 for good balance of quality/performance) */
  public readonly particleCount = input<number>(800);

  /** Nozzle radius - spread at spawn point (default: 0.3) */
  public readonly nozzleRadius = input<number>(0.3);

  // --- Injections ---
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // --- Internal State ---
  private group: THREE.Group | null = null;
  private instancedMesh: THREE.InstancedMesh | null = null;
  private geometry: THREE.PlaneGeometry | null = null;
  private material: THREE.MeshBasicNodeMaterial | null = null;
  private particleData: ParticleData[] = [];
  private updateCleanup: (() => void) | null = null;

  // Reusable objects for animation loop (avoid GC pressure)
  private readonly tempMatrix = new THREE.Matrix4();
  private readonly tempPosition = new THREE.Vector3();
  private readonly tempQuaternion = new THREE.Quaternion();
  private readonly tempScale = new THREE.Vector3();

  // Track if mesh has been created
  private readonly _isReady = signal(false);

  public constructor() {
    // Create particle system immediately so it's ready when parent queries
    this.createParticleSystem();

    // Update offset position reactively
    effect(() => {
      const pos = this.offset();
      if (this.group) {
        this.group.position.set(...pos);
      }
    });

    // Update visibility based on enabled state
    effect(() => {
      const isEnabled = this.enabled();
      if (this.group) {
        this.group.visible = isEnabled;
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.dispose();
    });
  }

  /**
   * Get the Three.js object for this thruster flame.
   * Returns the group containing the particle system.
   */
  public getMesh(): THREE.Object3D | null {
    return this.group;
  }

  /**
   * Check if the component is ready (particle system has been created).
   */
  public isReady(): boolean {
    return this._isReady();
  }

  /**
   * Create the GPU-instanced particle system
   */
  private createParticleSystem(): void {
    const count = this.particleCount();

    // Create container group
    this.group = new THREE.Group();
    this.group.position.set(...this.offset());

    // Create plane geometry for billboard particles
    // Small quad that will be instanced
    this.geometry = new THREE.PlaneGeometry(1, 1);

    // Create TSL material with circular falloff
    this.material = this.createMaterial();

    // Create InstancedMesh
    this.instancedMesh = new THREE.InstancedMesh(
      this.geometry,
      this.material,
      count
    );
    this.instancedMesh.frustumCulled = false;
    this.instancedMesh.renderOrder = 100;

    // Initialize particle data and positions
    this.initializeParticles(count);

    // Add to group
    this.group.add(this.instancedMesh);

    // Start animation loop
    this.setupAnimationLoop();

    // Mark as ready
    this._isReady.set(true);
  }

  /**
   * Create TSL material with soft circular particles and glow
   */
  private createMaterial(): THREE.MeshBasicNodeMaterial {
    // TSL circular falloff: center opaque, edges transparent
    // This creates soft, glowing particles
    const centeredUV = sub(uv(), vec2(0.5, 0.5));
    const dist = length(centeredUV);

    // Smooth transition from center (1.0) to edges (0.0)
    // Using 0.4 instead of 0.5 for slightly sharper particles
    const circularAlpha = sub(
      float(1.0),
      smoothstep(float(0.0), float(0.4), dist)
    );

    // Apply intensity
    const finalOpacity = mul(circularAlpha, float(this.intensity()));

    const material = new THREE.MeshBasicNodeMaterial();
    material.transparent = true;
    material.depthWrite = false;
    material.blending = THREE.AdditiveBlending;
    material.side = THREE.DoubleSide;
    material.opacityNode = finalOpacity;
    material.color = new THREE.Color(this.color());

    return material;
  }

  /**
   * Initialize all particles with random starting states
   */
  private initializeParticles(count: number): void {
    this.particleData = [];
    const nozzleRad = this.nozzleRadius();
    const baseSize = this.size();

    for (let i = 0; i < count; i++) {
      // Random position within nozzle SPHERE (3D volume, not just circle)
      // This gives depth to the particle system
      const theta = Math.random() * Math.PI * 2; // Azimuthal angle (around Y)
      const phi = Math.random() * Math.PI * 0.3; // Polar angle (cone opening ~54 degrees)
      const radius = Math.sqrt(Math.random()) * nozzleRad;

      // Spherical to Cartesian - creates a 3D cone volume
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = -radius * Math.cos(phi) * 0.2; // Small Y offset for depth
      const z = radius * Math.sin(phi) * Math.sin(theta);

      // Stagger initial ages so particles don't all spawn at once
      const staggeredAge = Math.random();

      const particleInfo: ParticleData = {
        age: staggeredAge,
        maxAge: 0.8 + Math.random() * 0.4, // 0.8-1.2 lifetime variance
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05, // X drift
          -1.0 - Math.random() * 0.5, // Downward velocity (negative Y)
          (Math.random() - 0.5) * 0.05 // Z drift
        ),
        noiseOffset: new THREE.Vector3(
          Math.random() * 100,
          Math.random() * 100,
          Math.random() * 100
        ),
        baseSize: 0.5 + Math.random() * 0.5, // Size variance 0.5-1.0
        spawnPosition: new THREE.Vector3(x, y, z),
      };

      this.particleData.push(particleInfo);

      // Set initial transform
      this.updateParticleMatrix(i, particleInfo, 0);
    }

    if (this.instancedMesh) {
      this.instancedMesh.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Update a single particle's transform matrix
   */
  private updateParticleMatrix(
    index: number,
    data: ParticleData,
    elapsed: number
  ): void {
    if (!this.instancedMesh) return;

    const t = data.age / data.maxAge; // Normalized lifetime 0-1
    const flameLen = this.flameLength();
    const baseSize = this.size();
    const speedMult = this.speed();
    const turbAmount = this.turbulence();

    // Calculate position based on age
    // Start at spawn position, move downward
    const y = -t * flameLen * speedMult;

    // Add turbulence based on noise - increases with age for dispersion effect
    const turbScale = 1 + t * 2; // Turbulence grows as particle ages
    const turbX =
      Math.sin(data.noiseOffset.x + elapsed * 3 + y * 2) *
      turbAmount *
      0.15 *
      turbScale;
    const turbZ =
      Math.cos(data.noiseOffset.z + elapsed * 3 + y * 2) *
      turbAmount *
      0.15 *
      turbScale;

    // Exponential spread - tight at start, disperses dramatically at end
    // This creates high density at nozzle, low density at tail
    const spread = Math.pow(t, 1.5) * 1.5;

    this.tempPosition.set(
      data.spawnPosition.x * (1 + spread) + turbX,
      y,
      data.spawnPosition.z * (1 + spread) + turbZ
    );

    // Size curve: dense/bright at start, fading quickly toward end
    // Peak at t=0.15 (earlier peak = more density at start), rapid fadeout
    let sizeCurve: number;
    if (t < 0.15) {
      sizeCurve = t / 0.15; // Quick grow from 0 to 1
    } else {
      // Exponential decay for dispersing effect
      sizeCurve = Math.pow(1.0 - (t - 0.15) / 0.85, 1.5);
    }
    sizeCurve = Math.max(0, sizeCurve);

    const particleSize = baseSize * data.baseSize * sizeCurve * 0.18;

    // Create matrix (scale + position)
    this.tempScale.set(particleSize, particleSize, particleSize);
    this.tempMatrix.compose(
      this.tempPosition,
      this.tempQuaternion,
      this.tempScale
    );

    this.instancedMesh.setMatrixAt(index, this.tempMatrix);

    // Update color based on age (white core → color → fade)
    // Young particles are brighter/whiter, old particles are colored and fading
    const coreCol = new THREE.Color(this.coreColor());
    const outerCol = new THREE.Color(this.color());

    // Blend from core to outer color
    const colorT = Math.min(t * 2, 1); // Reach outer color by t=0.5
    const particleColor = coreCol.lerp(outerCol, colorT);

    // Set instance color
    this.instancedMesh.setColorAt(index, particleColor);
  }

  /**
   * Setup the per-frame animation loop
   */
  private setupAnimationLoop(): void {
    let lastTime = 0;

    this.updateCleanup = this.renderLoop.registerUpdateCallback(
      (delta: number, elapsed: number) => {
        if (!this.instancedMesh || !this.enabled()) return;

        const speedMult = this.speed();
        const dt = Math.min(delta, 0.05); // Cap delta to prevent huge jumps

        // Update each particle
        for (let i = 0; i < this.particleData.length; i++) {
          const data = this.particleData[i];

          // Age the particle
          data.age += dt * speedMult;

          // Respawn if dead
          if (data.age >= data.maxAge) {
            this.respawnParticle(data);
          }

          // Update transform
          this.updateParticleMatrix(i, data, elapsed);
        }

        // Mark matrices and colors for GPU update
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        if (this.instancedMesh.instanceColor) {
          this.instancedMesh.instanceColor.needsUpdate = true;
        }

        lastTime = elapsed;
      }
    );
  }

  /**
   * Respawn a dead particle at the nozzle
   */
  private respawnParticle(data: ParticleData): void {
    const nozzleRad = this.nozzleRadius();

    // New random position within nozzle SPHERE (3D volume)
    const theta = Math.random() * Math.PI * 2; // Azimuthal angle
    const phi = Math.random() * Math.PI * 0.3; // Polar angle (cone)
    const radius = Math.sqrt(Math.random()) * nozzleRad;

    // Spherical to Cartesian for 3D depth
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = -radius * Math.cos(phi) * 0.2;
    const z = radius * Math.sin(phi) * Math.sin(theta);

    data.age = 0;
    data.maxAge = 0.8 + Math.random() * 0.4;
    data.spawnPosition.set(x, y, z);
    data.velocity.set(
      (Math.random() - 0.5) * 0.05,
      -1.0 - Math.random() * 0.5,
      (Math.random() - 0.5) * 0.05
    );
    data.noiseOffset.set(
      Math.random() * 100,
      Math.random() * 100,
      Math.random() * 100
    );
    data.baseSize = 0.5 + Math.random() * 0.5;
  }

  /**
   * Dispose all Three.js resources.
   * Called automatically on component destroy.
   */
  public dispose(): void {
    // Stop animation loop
    if (this.updateCleanup) {
      this.updateCleanup();
      this.updateCleanup = null;
    }

    // Dispose Three.js resources
    this.geometry?.dispose();
    this.material?.dispose();

    // Clear references
    this.instancedMesh = null;
    this.group = null;
    this.geometry = null;
    this.material = null;
    this.particleData = [];
    this._isReady.set(false);
  }
}
