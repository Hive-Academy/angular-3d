import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  afterNextRender,
  DestroyRef,
} from '@angular/core';
import { random } from 'maath';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../types/tokens';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * FBM (Fractal Brownian Motion) using simplex noise
 * Creates organic, self-similar patterns
 */
function fbm(
  x: number,
  y: number,
  octaves: number,
  lacunarity: number,
  gain: number
): number {
  let value = 0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value += amplitude * random.noise.simplex2(x * frequency, y * frequency);
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

/**
 * Turbulence - FBM with absolute values for sharp wispy details
 */
function turbulence(
  x: number,
  y: number,
  octaves: number,
  lacunarity: number,
  gain: number
): number {
  let value = 0;
  let amplitude = 1.0;
  let frequency = 1.0;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    value +=
      amplitude * Math.abs(random.noise.simplex2(x * frequency, y * frequency));
    maxValue += amplitude;
    amplitude *= gain;
    frequency *= lacunarity;
  }

  return value / maxValue;
}

/**
 * Domain warping - distort coordinates using noise for organic shapes
 */
function domainWarp(x: number, y: number, amount: number): [number, number] {
  const warpX = fbm(x + 1.7, y + 9.2, 4, 2.0, 0.5) * amount;
  const warpY = fbm(x + 8.3, y + 2.8, 4, 2.0, 0.5) * amount;
  return [x + warpX, y + warpY];
}

/**
 * Generate a procedural cloud texture using domain warping and FBM
 * Creates realistic wispy clouds with irregular, organic edges
 *
 * Techniques used:
 * - Domain warping for organic shape distortion
 * - Multi-octave FBM for cloud density
 * - Turbulence for wispy edge details
 * - Noise-based edge falloff (not circular!)
 */
function generateFractalCloudTexture(size: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  // Random seed offset for variety
  const seedX = Math.random() * 100;
  const seedY = Math.random() * 100;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      // Normalize coordinates to -0.5 to 0.5
      const nx = x / size - 0.5;
      const ny = y / size - 0.5;

      // Scale for noise sampling
      const scale = 3.0;
      let px = nx * scale + seedX;
      let py = ny * scale + seedY;

      // Apply domain warping for organic distortion
      [px, py] = domainWarp(px, py, 0.8);

      // Main cloud density using FBM (6 octaves for detail)
      const cloudDensity = fbm(px, py, 6, 2.0, 0.5);

      // Wispy detail using turbulence
      const wispyDetail = turbulence(px * 2, py * 2, 4, 2.0, 0.5);

      // Combine for final density
      let density = cloudDensity * 0.7 + wispyDetail * 0.3;
      density = (density + 1.0) * 0.5; // Normalize to 0-1

      // NOISE-BASED edge falloff (not circular!)
      // Use noise to create irregular edges
      const dist = Math.sqrt(nx * nx + ny * ny);

      // Create irregular edge using noise
      const edgeNoise = fbm(px * 1.5 + 5.0, py * 1.5 + 5.0, 3, 2.0, 0.5);
      const edgeThreshold = 0.35 + edgeNoise * 0.15; // Varies between 0.2 and 0.5

      // Soft falloff from noise-varied edge
      let edgeFalloff =
        1.0 - smoothstep(edgeThreshold - 0.15, edgeThreshold + 0.1, dist);

      // Add wispy tendrils at edges using turbulence
      const tendrilNoise = turbulence(px * 3 + 10, py * 3 + 10, 4, 2.0, 0.6);
      edgeFalloff += tendrilNoise * 0.3 * (1.0 - dist * 1.5);
      edgeFalloff = Math.max(0, Math.min(1, edgeFalloff));

      // Final alpha calculation
      let alpha = density * edgeFalloff;

      // Enhance contrast for more visible clouds
      alpha = Math.pow(alpha, 1.2);

      // Clamp to valid range
      alpha = Math.max(0, Math.min(1, alpha));

      // Write to image data
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

/**
 * Smoothstep function for smooth interpolation
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Generate random positions in a sphere using maath
 */
function generateSpherePositions(
  count: number,
  radius: number
): THREE.Vector3[] {
  const positions = random.inSphere(new Float32Array(count * 3), { radius });
  const vectors: THREE.Vector3[] = [];

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    vectors.push(
      new THREE.Vector3(positions[idx], positions[idx + 1], positions[idx + 2])
    );
  }

  return vectors;
}

/**
 * NebulaComponent - Volumetric Cloud/Dust Effect (Sprite-Based)
 *
 * Creates soft, wispy nebula clouds using sprite materials with procedural
 * fractal noise textures. This creates organic, irregular cloud shapes
 * that look like real space nebulae.
 *
 * Features:
 * - Procedurally generated fractal noise cloud textures
 * - Sprite-based rendering for billboarding effect
 * - Additive blending for ethereal glow
 * - Layered depth with varying sizes and opacity
 * - Optional slow rotation animation (flow)
 * - Color palette support for varied cloud colors
 *
 * @example
 * ```html
 * <a3d-nebula
 *   [cloudCount]="60"
 *   [radius]="20"
 *   [colorPalette]="['#ffffff', '#cccccc', '#aaaaaa']"
 *   [minSize]="5"
 *   [maxSize]="20"
 *   [minOpacity]="0.05"
 *   [maxOpacity]="0.15"
 *   [enableFlow]="true"
 * />
 * ```
 */
@Component({
  selector: 'a3d-nebula',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class NebulaComponent implements OnDestroy {
  // Transform input
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  // Cloud configuration
  public readonly cloudCount = input<number>(60);
  public readonly radius = input<number>(20);
  public readonly colorPalette = input<string[]>([
    '#ffffff',
    '#cccccc',
    '#aaaaaa',
  ]);
  public readonly minSize = input<number>(5);
  public readonly maxSize = input<number>(15);
  public readonly minOpacity = input<number>(0.05);
  public readonly maxOpacity = input<number>(0.15);
  public readonly enableFlow = input<boolean>(false);
  public readonly flowSpeed = input<number>(0.02);

  // Legacy inputs for backwards compatibility
  public readonly color = input<string | number | undefined>(undefined);
  public readonly opacity = input<number | undefined>(undefined);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);

  private group: THREE.Group;
  private sprites: THREE.Sprite[] = [];
  private textures: THREE.CanvasTexture[] = []; // Multiple textures for variety
  private renderLoopCleanup?: () => void;

  public constructor() {
    this.group = new THREE.Group();

    // Add to parent after first render
    afterNextRender(() => {
      if (this.parentFn) {
        const parent = this.parentFn();
        if (parent) {
          parent.add(this.group);
        }
      }
    });

    // Effect for rebuilding clouds when config changes
    effect((onCleanup) => {
      // Track dependencies
      const count = this.cloudCount();
      const radius = this.radius();
      const palette = this.colorPalette();
      const minSize = this.minSize();
      const maxSize = this.maxSize();
      const minOpacity = this.minOpacity();
      const maxOpacity = this.maxOpacity();

      // Handle legacy inputs
      const legacyColor = this.color();
      const legacyOpacity = this.opacity();

      const effectivePalette = legacyColor
        ? [
            typeof legacyColor === 'number'
              ? `#${legacyColor.toString(16).padStart(6, '0')}`
              : legacyColor,
          ]
        : palette;
      const effectiveMinOpacity =
        legacyOpacity !== undefined ? legacyOpacity * 0.7 : minOpacity;
      const effectiveMaxOpacity =
        legacyOpacity !== undefined ? legacyOpacity : maxOpacity;

      this.rebuildNebula(
        count,
        radius,
        effectivePalette,
        minSize,
        maxSize,
        effectiveMinOpacity,
        effectiveMaxOpacity
      );

      onCleanup(() => {
        this.disposeResources();
      });
    });

    // Transform effects
    effect(() => {
      this.group.position.set(...this.position());
    });

    // Flow animation
    effect(() => {
      const enableFlow = this.enableFlow();
      const flowSpeed = this.flowSpeed();

      // Cleanup previous registration if any
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
        this.renderLoopCleanup = undefined;
      }

      if (enableFlow) {
        this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(
          (delta) => {
            this.group.rotation.y += delta * flowSpeed;
          }
        );
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      if (this.renderLoopCleanup) {
        this.renderLoopCleanup();
      }
      if (this.parentFn) {
        const parent = this.parentFn();
        parent?.remove(this.group);
      }
      this.disposeResources();
    });
  }

  private rebuildNebula(
    count: number,
    radius: number,
    colorPalette: string[],
    minSize: number,
    maxSize: number,
    minOpacity: number,
    maxOpacity: number
  ): void {
    // Clear previous sprites
    this.group.clear();
    this.sprites = [];

    // Dispose old textures
    this.textures.forEach((t) => t.dispose());
    this.textures = [];

    // Generate multiple unique textures for variety (4-6 variations)
    const textureCount = Math.min(6, Math.max(4, Math.floor(count / 10)));
    for (let i = 0; i < textureCount; i++) {
      this.textures.push(generateFractalCloudTexture(512));
    }

    // Generate sprite positions using maath random
    const positions = generateSpherePositions(count, radius);

    // Create sprites with varied properties
    for (let i = 0; i < positions.length; i++) {
      // Random color from palette
      const colorHex =
        colorPalette[Math.floor(Math.random() * colorPalette.length)];

      // Random opacity within range
      const spriteOpacity =
        minOpacity + Math.random() * (maxOpacity - minOpacity);

      // Pick a random texture for variety
      const texture =
        this.textures[Math.floor(Math.random() * this.textures.length)];

      // Create sprite material with NodeMaterial pattern (direct property assignment)
      const material = new THREE.SpriteNodeMaterial();
      material.map = texture;
      material.color = new THREE.Color(colorHex);
      material.transparent = true;
      material.opacity = spriteOpacity;
      material.blending = THREE.AdditiveBlending;
      material.depthWrite = false;
      material.depthTest = true;
      material.fog = false;

      const sprite = new THREE.Sprite(material);
      sprite.position.copy(positions[i]);
      sprite.renderOrder = 999; // Render after most objects

      // Vary size between min and max
      const size = minSize + Math.random() * (maxSize - minSize);
      sprite.scale.set(size, size, 1);

      // Random rotation for more variety
      material.rotation = Math.random() * Math.PI * 2;

      this.sprites.push(sprite);
      this.group.add(sprite);
    }
  }

  private disposeResources(): void {
    // Dispose sprites and materials
    for (const sprite of this.sprites) {
      if (sprite.material instanceof THREE.SpriteNodeMaterial) {
        sprite.material.dispose();
      }
    }
    this.sprites = [];

    // Dispose all textures
    this.textures.forEach((t) => t.dispose());
    this.textures = [];
  }

  public ngOnDestroy(): void {
    // Cleanup handled by destroyRef
  }
}
