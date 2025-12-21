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

/**
 * GlowParticleTextComponent - Neon Tube-Like Glowing Text
 *
 * Creates text where particles cluster tightly to form glowing letter shapes,
 * similar to neon tube signs or glowing wireframes. Features pulsing and flowing
 * light effects that travel along the text path.
 *
 * Features:
 * - Tight particle clustering (70+ density) for neon tube aesthetic
 * - Flow animation traveling along text (pathPosition-based pulse)
 * - Bloom-ready (toneMapped: false, bright emissive colors)
 * - Global pulse + local flow wave effects
 * - GPU-friendly Points rendering for performance
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy (no manual scene access)
 * - Signal-based inputs for reactive updates
 * - Effect-based initialization and cleanup
 * - Uses RenderLoopService for per-frame animation updates
 * - Works best with BloomEffectComponent for glow post-processing
 *
 * @example
 * ```html
 * <a3d-glow-particle-text
 *   text="NEON"
 *   [fontSize]="80"
 *   [glowColor]="0x00d4ff"
 *   [glowIntensity]="3.0"
 *   [pulseSpeed]="2.0"
 *   [flowSpeed]="1.0"
 * />
 * ```
 */

interface ParticleData {
  basePos: [number, number, number]; // Original position from text
  pathPosition: number; // Position along text path (0-1) for flow animation
  size: number; // Base particle size
}

@Component({
  selector: 'a3d-glow-particle-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `glow-particle-text-${crypto.randomUUID()}`,
    },
  ],
})
export class GlowParticleTextComponent implements OnDestroy {
  // Signal inputs
  readonly text = input.required<string>();
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly fontSize = input<number>(80); // Canvas font size
  readonly particleDensity = input<number>(70); // Particles per 100 pixels (high for tight clustering)
  readonly glowColor = input<number>(0x00d4ff); // Cyan glow
  readonly baseParticleSize = input<number>(0.025);
  readonly glowIntensity = input<number>(3.0); // Brightness multiplier for bloom
  readonly pulseSpeed = input<number>(2.0); // Global pulse speed
  readonly flowSpeed = input<number>(1.0); // Flow animation speed

  // DI
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  // Internal state
  private particles: ParticleData[] = [];
  private particleSystem?: THREE.Points;
  private particleTexture?: THREE.CanvasTexture;
  private time = 0;

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

      // Generate particles from sampled positions with path information
      this.generateParticlesFromPositions(positions, density);

      // Create particle texture
      if (!this.particleTexture) {
        this.particleTexture = this.createGlowTexture();
      }

      // Create particle system
      this.createParticleSystem(parent);
    });

    // Frame loop animation using RenderLoopService
    const cleanup = this.renderLoop.registerUpdateCallback((delta) => {
      this.animateGlow(delta);
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
   * Sample pixel positions from canvas-rendered text
   */
  private sampleTextPositions(
    text: string,
    fontSize: number
  ): [number, number][] {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    // Setup canvas
    const padding = 20;
    ctx.font = `bold ${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;

    // Render text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Sample pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const positions: [number, number][] = [];

    // Sample every pixel for high density (neon tube effect requires tight clustering)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const index = (y * canvas.width + x) * 4;
        const alpha = data[index + 3];

        // If pixel is part of text
        if (alpha > 128) {
          // Normalize to centered coordinates
          const nx = (x - canvas.width / 2) / fontSize;
          const ny = -(y - canvas.height / 2) / fontSize;
          positions.push([nx, ny]);
        }
      }
    }

    return positions;
  }

  /**
   * Generate particles from sampled text positions with path information
   */
  private generateParticlesFromPositions(
    positions: [number, number][],
    density: number
  ): void {
    this.particles = [];

    // For high density, create multiple particles per position
    const particlesPerPoint = Math.max(1, Math.floor(density / 20));

    positions.forEach(([x, y], index) => {
      // Calculate path position (0-1) based on index for flow animation
      const pathPosition = index / positions.length;

      for (let i = 0; i < particlesPerPoint; i++) {
        // Very small random offset for tight clustering (neon tube effect)
        const offsetX = (Math.random() - 0.5) * 0.005;
        const offsetY = (Math.random() - 0.5) * 0.005;
        const offsetZ = (Math.random() - 0.5) * 0.01;

        const basePos: [number, number, number] = [
          x + offsetX,
          y + offsetY,
          offsetZ,
        ];

        // Vary particle size slightly for depth
        const sizeVariation = 0.8 + Math.random() * 0.4;

        this.particles.push({
          basePos,
          pathPosition,
          size: this.baseParticleSize() * sizeVariation,
        });
      }
    });
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
    const sizes = new Float32Array(this.particles.length);

    this.particles.forEach((particle, i) => {
      positions[i * 3] = particle.basePos[0];
      positions[i * 3 + 1] = particle.basePos[1];
      positions[i * 3 + 2] = particle.basePos[2];
      sizes[i] = particle.size;
    });

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create material with bright emissive color for bloom
    const color = new THREE.Color(this.glowColor());
    const material = new THREE.PointsMaterial({
      size: this.baseParticleSize(),
      color: color.multiplyScalar(this.glowIntensity()), // Bright color for bloom
      map: this.particleTexture!,
      transparent: true,
      opacity: 1.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
      toneMapped: false, // CRITICAL: Disable tone mapping for bloom post-processing
    });

    // Create particle system
    this.particleSystem = new THREE.Points(geometry, material);
    this.particleSystem.position.set(...this.position());
    parent.add(this.particleSystem);
  }

  /**
   * Animate glow with pulse and flow effects
   */
  private animateGlow(delta: number): void {
    if (!this.particleSystem || this.particles.length === 0) return;

    this.time += delta;

    const material = this.particleSystem.material as THREE.PointsMaterial;
    const sizeAttr = this.particleSystem.geometry.attributes[
      'size'
    ] as THREE.BufferAttribute;

    // Global pulse effect (all particles breathe together)
    const globalPulse = Math.sin(this.time * this.pulseSpeed()) * 0.3 + 1.0; // 0.7 to 1.3

    this.particles.forEach((particle, i) => {
      // Flow animation: wave traveling along text path
      const flowPhase = particle.pathPosition * Math.PI * 2;
      const flowWave =
        Math.sin(this.time * this.flowSpeed() + flowPhase) * 0.5 + 0.5; // 0 to 1

      // Combine global pulse + local flow for dynamic effect
      const combinedIntensity = globalPulse * (0.7 + flowWave * 0.6);

      // Update particle size based on intensity
      sizeAttr.array[i] = particle.size * combinedIntensity;
    });

    sizeAttr.needsUpdate = true;

    // Update material opacity with pulse (subtle breathing)
    const baseBrightness = this.glowIntensity();
    const pulseBrightness = baseBrightness * globalPulse;
    const color = new THREE.Color(this.glowColor());
    material.color.copy(color.multiplyScalar(pulseBrightness));
  }

  /**
   * Create glowing circular particle texture with bright center
   */
  private createGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const size = 64;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Radial gradient for bright glow particle
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)'); // Bright center
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // Soft falloff

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return new THREE.CanvasTexture(canvas);
  }

  ngOnDestroy(): void {
    // Cleanup handled by DestroyRef
  }
}
