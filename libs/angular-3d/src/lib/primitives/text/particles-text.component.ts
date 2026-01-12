import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { SceneService } from '../../canvas/scene.service';
import { RenderLoopService } from '../../render-loop/render-loop.service';
import { TextSamplingService } from '../../services/text-sampling.service';
import { OBJECT_ID } from '../../tokens/object-id.token';
import { NG_3D_PARENT } from '../../types/tokens';

/**
 * InstancedParticleTextComponent - Smoke Cloud Text using Instanced Meshes
 *
 * Creates realistic smoke/cloud particle text using THREE.InstancedMesh with billboard
 * rotation. Each particle is a plane that rotates to face the camera, creating a
 * volumetric smoke effect.
 *
 * Features:
 * - InstancedMesh rendering (better performance than Points for complex particles)
 * - Billboard rotation (particles always face camera)
 * - Individual particle lifecycle (grow → pulse → shrink)
 * - Smoke texture alpha mapping for realistic clouds
 * - Particle recycling for smooth text transitions
 * - Random scale variation for organic depth
 *
 * Architecture Notes:
 * - Uses NG_3D_PARENT for scene hierarchy (no manual scene access)
 * - Signal-based inputs for reactive updates
 * - Effect-based initialization and cleanup
 * - Uses RenderLoopService for per-frame animation updates
 * - Uses SceneService to access camera for billboard rotation
 *
 * @example
 * ```html
 * <a3d-particle-text
 *   text="CLOUDS"
 *   [fontSize]="60"
 *   [particleColor]="0x00d4ff"
 *   [opacity]="0.3"
 *   [maxParticleScale]="0.15"
 *   [particlesPerPixel]="3"
 *   [skipInitialGrowth]="true"
 * />
 * ```
 */

interface TextureCoordinate {
  x: number;
  y: number;
  old: boolean; // Reused from previous frame
  toDelete: boolean; // Marked for fade-out
}

interface ParticleData {
  x: number;
  y: number;
  z: number;
  isGrowing: boolean;
  toDelete: boolean;
  scale: number;
  maxScale: number;
  deltaScale: number;
  age: number;
  ageDelta: number;
  rotationZ: number;
  deltaRotation: number;
}

@Component({
  selector: 'a3d-particle-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `particle-text-${crypto.randomUUID()}`,
    },
  ],
})
export class ParticleTextComponent {
  // Signal inputs
  public readonly text = input.required<string>();
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly fontSize = input<number>(60); // Canvas font size
  public readonly fontScaleFactor = input<number>(0.08); // Scale from canvas to 3D scene
  public readonly particleColor = input<number>(0x00d4ff);
  public readonly opacity = input<number>(0.15);
  public readonly maxParticleScale = input<number>(0.15);
  public readonly particlesPerPixel = input<number>(3);
  public readonly particleGrowSpeed = input<number>(0.03);
  public readonly pulseSpeed = input<number>(0.01);
  public readonly smokeIntensity = input<number>(1.0);
  public readonly skipInitialGrowth = input<boolean>(true);
  public readonly blendMode = input<'additive' | 'normal'>('additive');
  public readonly texturePath = input<string | undefined>(undefined); // Path to external smoke texture
  public readonly lineHeightMultiplier = input<number>(2.5); // Canvas height multiplier for text rendering
  public readonly sampleStep = input<number>(2);
  // DI
  private readonly parent = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService, { optional: true });
  private readonly sceneService = inject(SceneService);
  private readonly textSampling = inject(TextSamplingService);

  // Internal state
  private textCanvas!: HTMLCanvasElement;
  private textCtx!: CanvasRenderingContext2D;
  private particleGeometry?: THREE.PlaneGeometry;
  private particleMaterial?: THREE.MeshBasicNodeMaterial;
  private instancedMesh?: THREE.InstancedMesh;
  private smokeTexture?: THREE.Texture; // Can be CanvasTexture or loaded Texture
  private readonly textureLoaded = signal(false);
  private dummy = new THREE.Object3D();

  private textureCoordinates: TextureCoordinate[] = [];
  private particles: ParticleData[] = [];

  private stringBox = {
    wTexture: 0,
    wScene: 0,
    hTexture: 0,
    hScene: 0,
  };

  // Billboarding state tracking
  private readonly billboardingActive = signal(false);

  // Particle count limit to prevent browser freezing
  private readonly MAX_PARTICLES = 10000;

  public constructor() {
    // Initialize canvas for text rendering
    this.textCanvas = document.createElement('canvas');
    this.textCanvas.width = 0;
    this.textCanvas.height = 0;
    const ctx = this.textCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Failed to get 2D context');
    this.textCtx = ctx;

    // Effect: Initialize particle system when text or settings change
    effect(() => {
      const parent = this.parent?.();
      const text = this.text();
      const fontSize = this.fontSize();
      const texturePath = this.texturePath();

      if (!parent || !text) return;

      // Load external texture or create procedural one
      if (!this.smokeTexture) {
        if (texturePath) {
          // Load external smoke texture
          const loader = new THREE.TextureLoader();
          loader.load(
            texturePath,
            (loadedTexture) => {
              this.smokeTexture = loadedTexture;
              this.smokeTexture.needsUpdate = true;
              this.textureLoaded.set(true);
              // Recreate particles with loaded texture
              this.refreshText(text, fontSize);
              if (this.instancedMesh && parent) {
                parent.add(this.instancedMesh);
              }
            },
            undefined,
            (error) => {
              console.warn(
                `[ParticleText] Failed to load texture: ${texturePath}`,
                error
              );
              // Fallback to procedural texture
              this.smokeTexture = this.createSmokeTexture();
              this.textureLoaded.set(true);
            }
          );
          return; // Wait for texture to load
        } else {
          // Create procedural smoke texture
          this.smokeTexture = this.createSmokeTexture();
          this.textureLoaded.set(true);
        }
      }

      // Only proceed if texture is ready
      if (!this.textureLoaded()) return;

      // Sample text and create particles
      this.refreshText(text, fontSize);

      // Add to parent
      if (this.instancedMesh && parent) {
        parent.add(this.instancedMesh);
      }
    });

    // Frame loop animation using RenderLoopService (skip if renderLoop not available)
    const cleanup = this.renderLoop?.registerUpdateCallback(() => {
      const camera = this.sceneService.camera();
      if (camera) {
        // Camera is available - enable billboarding if not already active
        if (!this.billboardingActive()) {
          this.billboardingActive.set(true);
        }
        this.animateParticles(camera);
      } else if (this.billboardingActive()) {
        // Camera lost - disable billboarding
        console.warn(
          '[InstancedParticleText] Camera lost - billboarding disabled'
        );
        this.billboardingActive.set(false);
      }
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      cleanup?.();
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as THREE.MeshBasicNodeMaterial).dispose();
      }
      if (this.particleGeometry) {
        this.particleGeometry.dispose();
      }
      if (this.particleMaterial) {
        this.particleMaterial.dispose();
      }
      if (this.smokeTexture) {
        this.smokeTexture.dispose();
      }
    });
  }

  /**
   * Refresh text rendering and particle system
   */
  private refreshText(text: string, fontSize: number): void {
    // Handle empty text - skip mesh creation and clean up existing mesh
    if (!text || text.trim().length === 0) {
      const parent = this.parent?.();
      if (this.instancedMesh && parent) {
        parent.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        (this.instancedMesh.material as THREE.MeshBasicNodeMaterial).dispose();
        this.instancedMesh = undefined;
      }
      this.particles = [];
      this.textureCoordinates = [];
      return;
    }

    this.sampleTextCoordinates(text, fontSize);
    this.updateParticles();
    this.recreateInstancedMesh();
  }

  /**
   * Sample pixel positions from canvas-rendered text using TextSamplingService
   */
  private sampleTextCoordinates(text: string, fontSize: number): void {
    // Setup canvas dimensions
    const fontName = 'Arial, sans-serif';
    this.textCtx.font = `bold ${fontSize}px ${fontName}`;
    const metrics = this.textCtx.measureText(text);
    const textWidth = Math.ceil(metrics.width);
    const multiplier = this.lineHeightMultiplier();
    const textHeight = Math.ceil(fontSize * multiplier);

    this.stringBox.wTexture = textWidth;
    this.stringBox.hTexture = textHeight;
    this.stringBox.wScene = textWidth * this.fontScaleFactor();
    this.stringBox.hScene = textHeight * this.fontScaleFactor();

    // Resize canvas for later use
    this.textCanvas.width = textWidth;
    this.textCanvas.height = textHeight;

    // Use TextSamplingService for pixel sampling with same multiplier
    const positions = this.textSampling.sampleTextPositions(
      text,
      fontSize,
      this.sampleStep(),
      multiplier
    );

    // Convert normalized positions to pixel coordinates and build recycling structure
    if (positions.length > 0) {
      // Build 2D mask from sampled positions for recycling logic
      const imageMask: boolean[][] = Array.from(
        Array(this.textCanvas.height),
        () => new Array(this.textCanvas.width).fill(false)
      );

      // Convert normalized positions back to pixel coordinates
      const pixelCoords: Array<{ x: number; y: number }> = [];
      positions.forEach(([nx, ny]) => {
        // Reverse the normalization from TextSamplingService
        const padding = 20;
        const canvasWidth = textWidth + padding * 2;
        const canvasHeight = textHeight + padding * 2;
        const x = Math.round(nx * fontSize + canvasWidth / 2);
        const y = Math.round(-ny * fontSize + canvasHeight / 2);

        // Adjust for padding offset to get texture coordinates
        const texX = x - padding;
        const texY = y - padding;

        if (texX >= 0 && texX < textWidth && texY >= 0 && texY < textHeight) {
          imageMask[texY][texX] = true;
          pixelCoords.push({ x: texX, y: texY });
        }
      });

      if (this.textureCoordinates.length !== 0) {
        // Clean up deleted coordinates from previous frame
        this.textureCoordinates = this.textureCoordinates.filter(
          (c) => !c.toDelete
        );
        this.particles = this.particles.filter((p) => !p.toDelete);

        // Mark existing coordinates as old or toDelete
        this.textureCoordinates.forEach((c) => {
          if (imageMask[c.y] && imageMask[c.y][c.x]) {
            c.old = true;
            if (!c.toDelete) {
              imageMask[c.y][c.x] = false; // Mark as processed
            }
          } else {
            c.toDelete = true;
          }
        });
      }

      // Add new coordinates from remaining pixels in mask
      for (let i = 0; i < this.textCanvas.height; i++) {
        for (let j = 0; j < this.textCanvas.width; j++) {
          if (imageMask[i][j]) {
            this.textureCoordinates.push({
              x: j,
              y: i,
              old: false,
              toDelete: false,
            });
          }
        }
      }
    } else {
      this.textureCoordinates = [];
    }
  }

  /**
   * Update particles based on sampled coordinates
   * Creates multiple particles per coordinate for density
   */
  private updateParticles(): void {
    const scaleFactor = this.fontScaleFactor();
    const particlesPerPixel = this.particlesPerPixel();
    const newParticles: ParticleData[] = [];

    this.textureCoordinates.forEach((c, cIdx) => {
      const baseX = c.x * scaleFactor;
      const baseY = c.y * scaleFactor;

      // Create multiple particles per coordinate for smoke density
      for (let i = 0; i < particlesPerPixel; i++) {
        const particleIdx = cIdx * particlesPerPixel + i;

        // Reuse existing particle if coordinate is old
        const p =
          c.old && this.particles[particleIdx]
            ? this.particles[particleIdx]
            : this.createParticle(baseX, baseY);

        // Mark for deletion
        if (c.toDelete) {
          p.toDelete = true;
          p.scale = p.maxScale;
        }

        newParticles.push(p);
      }
    });

    this.particles = newParticles;

    // Validate particle count and warn if exceeding limit
    if (this.particles.length > this.MAX_PARTICLES) {
      console.warn(
        `[InstancedParticleText] Generated ${this.particles.length} particles (max ${this.MAX_PARTICLES}). ` +
          `Consider reducing fontSize or particlesPerPixel for better performance. ` +
          `Truncating to ${this.MAX_PARTICLES} particles.`
      );
      this.particles = this.particles.slice(0, this.MAX_PARTICLES);
    }
  }

  /**
   * Create new particle with random properties
   * Uses pow(10) distribution scaled by maxParticleScale input
   * Creates many small particles with occasional larger puffs
   */
  private createParticle(x: number, y: number): ParticleData {
    // pow(10) distribution: most particles small, few larger
    // Scale by maxParticleScale() input for scene-appropriate sizing
    // Base: 10% of max, Peak: 100% of max (rare due to pow(10))
    const baseScale = this.maxParticleScale() * 0.3;
    const maxRandom = this.maxParticleScale() * 0.7;
    const maxScale = baseScale + maxRandom * Math.pow(Math.random(), 5);
    const skipGrowth = this.skipInitialGrowth();

    // Tight jitter for text readability
    const jitter = 0.12;

    return {
      x: x + jitter * (Math.random() - 0.5),
      y: y + jitter * (Math.random() - 0.5),
      z: (Math.random() - 0.5) * 0.08,
      isGrowing: !skipGrowth,
      toDelete: false,
      scale: skipGrowth ? maxScale : 0,
      maxScale: maxScale,
      deltaScale:
        this.particleGrowSpeed() + this.particleGrowSpeed() * Math.random(),
      age: Math.PI * Math.random(),
      ageDelta: this.pulseSpeed() + this.pulseSpeed() * 2 * Math.random(),
      rotationZ: Math.random() * Math.PI * 2,
      deltaRotation: 0.01 * (Math.random() - 0.5),
    };
  }

  /**
   * Recreate instanced mesh with current particle count
   */
  private recreateInstancedMesh(): void {
    const parent = this.parent?.();

    // Cleanup existing mesh
    if (this.instancedMesh && parent) {
      parent.remove(this.instancedMesh);
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.MeshBasicMaterial).dispose();
    }

    // Create geometry if needed
    if (!this.particleGeometry) {
      this.particleGeometry = new THREE.PlaneGeometry(1, 1);
    }

    // Create or update material
    if (!this.particleMaterial) {
      const blending =
        this.blendMode() === 'additive'
          ? THREE.AdditiveBlending
          : THREE.NormalBlending;

      // Using MeshBasicNodeMaterial with direct property assignment for WebGPU
      this.particleMaterial = new THREE.MeshBasicNodeMaterial();
      this.particleMaterial.color = new THREE.Color(this.particleColor());
      this.particleMaterial.alphaMap = this.smokeTexture!;
      this.particleMaterial.depthTest = false;
      this.particleMaterial.opacity = this.opacity();
      this.particleMaterial.transparent = true;
      this.particleMaterial.blending = blending;
      this.particleMaterial.depthWrite = false;
    }

    // Create instanced mesh
    this.instancedMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      this.particles.length
    );

    // Position mesh to center text
    const [baseX, baseY, baseZ] = this.position();
    this.instancedMesh.position.set(
      baseX - 0.5 * this.stringBox.wScene,
      baseY - 0.5 * this.stringBox.hScene,
      baseZ
    );

    if (parent) {
      parent.add(this.instancedMesh);
    }
  }

  /**
   * Animate particles and update instance matrices
   */
  private animateParticles(camera: THREE.Camera): void {
    if (!this.instancedMesh || this.particles.length === 0) return;

    this.particles.forEach((p, idx) => {
      // Grow particle
      this.growParticle(p);

      // Billboard rotation (face camera)
      this.dummy.quaternion.copy(camera.quaternion);
      this.dummy.rotation.z += p.rotationZ;

      // Update scale and position
      this.dummy.scale.set(p.scale, p.scale, p.scale);
      this.dummy.position.set(p.x, this.stringBox.hScene - p.y, p.z);

      // Update matrix
      this.dummy.updateMatrix();
      this.instancedMesh!.setMatrixAt(idx, this.dummy.matrix);
    });

    this.instancedMesh.instanceMatrix.needsUpdate = true;
  }

  /**
   * Update particle growth/shrink animation
   */
  private growParticle(p: ParticleData): void {
    p.age += p.ageDelta;
    p.rotationZ += p.deltaRotation;

    if (p.isGrowing) {
      // Growing phase
      p.scale += p.deltaScale;
      if (p.scale >= p.maxScale) {
        p.isGrowing = false;
      }
    } else if (p.toDelete) {
      // Shrinking phase (fade out)
      p.scale -= p.deltaScale;
      if (p.scale <= 0) {
        p.scale = 0;
        p.deltaScale = 0;
      }
    } else {
      // Gentle pulsing for subtle animation
      p.scale = p.maxScale + 0.15 * Math.sin(p.age);
    }
  }

  /**
   * Create soft smoke/cloud texture with smooth falloff
   * Uses Gaussian-like distribution for natural soft edges
   */
  private createSmokeTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const size = 128; // Smaller for softer appearance when scaled
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    const center = size / 2;

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Distance from center normalized to 0-1
        const dx = (x - center) / center;
        const dy = (y - center) / center;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Gaussian-like soft falloff
        // exp(-dist^2 * factor) creates smooth bell curve
        const gaussian = Math.exp(-dist * dist * 3);

        // Add subtle noise variation for organic look
        const noise = 0.8 + Math.random() * 0.4;

        // Combine gaussian with noise
        let alpha = gaussian * noise;

        // Ensure smooth falloff at edges
        if (dist > 0.8) {
          alpha *= 1 - (dist - 0.8) / 0.2;
        }

        // Clamp and apply
        alpha = Math.max(0, Math.min(1, alpha));

        const idx = (y * size + x) * 4;
        data[idx] = 255; // R
        data[idx + 1] = 255; // G
        data[idx + 2] = 255; // B
        data[idx + 3] = Math.floor(alpha * 255); // A
      }
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }
}
