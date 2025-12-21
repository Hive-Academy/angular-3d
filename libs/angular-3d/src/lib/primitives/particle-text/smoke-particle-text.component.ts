import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../../types/tokens';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { TextSamplingService } from '../../services/text-sampling.service';

/**
 * SmokeParticleTextComponent - Dense Particle Cloud Forming Text
 *
 * Creates text where thousands of particles cluster to form letter shapes,
 * similar to volumetric smoke or particle clouds. Inspired by particle-based
 * logos and text effects where the density of particles creates the form.
 *
 * Features:
 * - Dense particle clustering forming recognizable text
 * - Organic drift animation using multi-octave noise
 * - Volumetric smoky appearance with additive blending
 * - GPU-friendly Points rendering for performance
 * - Real-time particle animation with drift effects
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy (no manual scene access)
 * - Signal-based inputs for reactive updates
 * - Effect-based initialization and cleanup
 * - Uses RenderLoopService for per-frame animation updates
 *
 * @example
 * ```html
 * <a3d-smoke-particle-text
 *   text="HELLO"
 *   [fontSize]="100"
 *   [particleDensity]="50"
 *   [smokeColor]="0x8a2be2"
 *   [driftSpeed]="0.02"
 * />
 * ```
 */

interface ParticleData {
  basePos: [number, number, number]; // Original position from text
  currentPos: [number, number, number]; // Current position with drift
  velocity: [number, number, number]; // Drift velocity
  life: number; // For respawn cycles
  maxLife: number;
}

@Component({
  selector: 'a3d-smoke-particle-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `smoke-particle-text-${crypto.randomUUID()}`,
    },
  ],
})
export class SmokeParticleTextComponent implements OnDestroy {
  // Signal inputs
  readonly text = input.required<string>();
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly fontSize = input<number>(100); // Canvas font size
  readonly particleDensity = input<number>(50); // Particles per 100 pixels
  readonly smokeColor = input<number>(0x8a2be2); // Purple smoke
  readonly particleSize = input<number>(0.02);
  readonly opacity = input<number>(0.8);
  readonly driftSpeed = input<number>(0.02);
  readonly driftAmount = input<number>(0.05);

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly textSampling = inject(TextSamplingService);

  // Internal state
  private particles: ParticleData[] = [];
  private particleSystem?: THREE.Points;
  private particleTexture?: THREE.CanvasTexture;
  private time = 0;

  // Particle count limit to prevent browser freezing
  private readonly MAX_PARTICLES = 10000;

  constructor() {
    // Effect: Initialize particle system when text changes
    effect(() => {
      const parent = this.parent();
      const text = this.text();
      const fontSize = this.fontSize();
      const density = this.particleDensity();

      if (!parent || !text) return;

      // Sample text pixels
      const positions = this.sampleTextPositions(text, fontSize);

      // Generate particles from sampled positions
      this.generateParticlesFromPositions(positions, density);

      // Create particle texture
      if (!this.particleTexture) {
        this.particleTexture = this.createParticleTexture();
      }

      // Create particle system
      this.createParticleSystem(parent);
    });

    // Frame loop animation using RenderLoopService
    const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
      this.animateParticles(delta);
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      cleanup();
      const parent = this.parent();
      if (this.particleSystem && parent) {
        parent.remove(this.particleSystem);
        this.particleSystem.geometry.dispose();
        (this.particleSystem.material as THREE.PointsMaterial).dispose();
      }
      if (this.particleTexture) {
        this.particleTexture.dispose();
      }
    });
  }

  /**
   * Sample pixel positions from canvas-rendered text using TextSamplingService
   */
  private sampleTextPositions(
    text: string,
    fontSize: number
  ): [number, number][] {
    // Use shared TextSamplingService (sample every 2nd pixel for smoke density)
    return this.textSampling.sampleTextPositions(text, fontSize, 2);
  }

  /**
   * Generate dense particles from sampled text positions
   */
  private generateParticlesFromPositions(
    positions: [number, number][],
    density: number
  ): void {
    this.particles = [];

    // For each sampled position, create multiple particles for density
    const particlesPerPoint = Math.max(1, Math.floor(density / 10));

    positions.forEach(([x, y]) => {
      for (let i = 0; i < particlesPerPoint; i++) {
        // Add small random offset for volumetric effect
        const offsetX = (Math.random() - 0.5) * 0.02;
        const offsetY = (Math.random() - 0.5) * 0.02;
        const offsetZ = (Math.random() - 0.5) * 0.05;

        const basePos: [number, number, number] = [
          x + offsetX,
          y + offsetY,
          offsetZ,
        ];

        this.particles.push({
          basePos,
          currentPos: [...basePos],
          velocity: [
            (Math.random() - 0.5) * this.driftSpeed(),
            (Math.random() - 0.5) * this.driftSpeed(),
            (Math.random() - 0.5) * this.driftSpeed(),
          ],
          life: Math.random() * 5,
          maxLife: 5,
        });
      }
    });

    // Validate particle count and warn if exceeding limit
    if (this.particles.length > this.MAX_PARTICLES) {
      console.warn(
        `[SmokeParticleText] Generated ${this.particles.length} particles (max ${this.MAX_PARTICLES}). ` +
          `Consider reducing fontSize or particleDensity for better performance. ` +
          `Truncating to ${this.MAX_PARTICLES} particles.`
      );
      this.particles = this.particles.slice(0, this.MAX_PARTICLES);
    }
  }

  /**
   * Create particle system
   */
  private createParticleSystem(parent: THREE.Object3D): void {
    // Cleanup existing
    if (this.particleSystem && parent) {
      parent.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      (this.particleSystem.material as THREE.PointsMaterial).dispose();
    }

    // Create geometry
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particles.length * 3);
    this.updatePositionBuffer(positions);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      size: this.particleSize(),
      color: new THREE.Color(this.smokeColor()),
      map: this.particleTexture!,
      transparent: true,
      opacity: this.opacity(),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    });

    // Create particle system
    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.position.set(...this.position());
    parent.add(this.particleSystem);
  }

  /**
   * Animate particles with organic drift using multi-octave noise
   */
  private animateParticles(delta: number): void {
    if (!this.particleSystem || this.particles.length === 0) return;

    this.time += delta;

    this.particles.forEach((particle) => {
      // Multi-octave noise for organic drift
      // First octave - large slow movements
      const noise1 =
        Math.sin(this.time + particle.basePos[0] * 10) *
        Math.cos(this.time + particle.basePos[1] * 10);

      // Second octave - medium movements
      const noise2 =
        Math.sin(this.time * 2 + particle.basePos[0] * 20) *
        Math.cos(this.time * 2 + particle.basePos[1] * 20) *
        0.5;

      // Third octave - small fast movements
      const noise3 =
        Math.sin(this.time * 4 + particle.basePos[0] * 40) *
        Math.cos(this.time * 4 + particle.basePos[1] * 40) *
        0.25;

      // Combine octaves for organic drift
      const combinedNoise = noise1 + noise2 + noise3;

      // Update position with drift
      particle.currentPos[0] =
        particle.basePos[0] + combinedNoise * this.driftAmount();
      particle.currentPos[1] =
        particle.basePos[1] +
        Math.sin(this.time * 0.5 + particle.basePos[1]) * this.driftAmount();
      particle.currentPos[2] =
        particle.basePos[2] +
        Math.cos(this.time * 0.3 + particle.basePos[0]) * this.driftAmount();

      // Update life for future respawn logic
      particle.life -= delta;
      if (particle.life <= 0) {
        particle.life = particle.maxLife;
      }
    });

    // Update geometry
    const positionAttr = this.particleSystem.geometry.attributes[
      'position'
    ] as THREE.BufferAttribute;
    this.updatePositionBuffer(positionAttr.array as Float32Array);
    positionAttr.needsUpdate = true;
  }

  /**
   * Update position buffer
   */
  private updatePositionBuffer(buffer: Float32Array): void {
    this.particles.forEach((particle, i) => {
      buffer[i * 3] = particle.currentPos[0];
      buffer[i * 3 + 1] = particle.currentPos[1];
      buffer[i * 3 + 2] = particle.currentPos[2];
    });
  }

  /**
   * Create soft circular particle texture
   */
  private createParticleTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Radial gradient for soft particle
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }

  ngOnDestroy(): void {
    // Cleanup handled by DestroyRef
  }
}
