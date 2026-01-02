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
import { SpriteNodeMaterial } from 'three/webgpu';
import {
  float,
  vec3,
  uniform,
  mix,
  smoothstep,
  uv,
  mul,
  add,
  pow,
  abs,
  sin,
} from 'three/tsl';
import { NG_3D_PARENT } from '../types/tokens';
import { RenderLoopService } from '../render-loop/render-loop.service';
import { nativeFBMVec3, domainWarp } from './shaders/tsl-utilities';

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
 * Smoothstep function for smooth interpolation
 */
function smoothstepCPU(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * NebulaComponent - Volumetric Cloud/Dust Effect (TSL Sprite-Based)
 *
 * Creates soft, wispy nebula clouds using TSL sprite materials with procedural
 * MaterialX noise. This creates organic, irregular cloud shapes that look like
 * real space nebulae, rendered entirely on the GPU.
 *
 * Features:
 * - GPU-procedural MaterialX noise (no CPU texture generation)
 * - Sprite-based rendering for billboarding effect
 * - Additive blending for ethereal glow
 * - Layered depth with varying sizes and opacity
 * - Optional slow rotation animation (flow)
 * - Color palette support for varied cloud colors
 * - Significant performance improvement over CPU noise (GPU-accelerated)
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
  private renderLoopCleanup?: () => void;
  private isDestroyed = false;

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

      // Don't rebuild if component is being destroyed
      if (this.isDestroyed) return;

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
        // Don't cleanup if component is already destroyed (handled by onDestroy)
        if (this.isDestroyed) return;
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
      // Prevent double cleanup
      if (this.isDestroyed) return;
      this.isDestroyed = true;

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

      // Random seed for procedural noise variety
      const seedX = Math.random() * 100;
      const seedY = Math.random() * 100;

      // Create TSL procedural sprite material (GPU-accelerated)
      const material = this.createProceduralCloudMaterial(
        colorHex,
        spriteOpacity,
        seedX,
        seedY
      );

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

  /**
   * Create procedural cloud material using TSL
   * Replaces CPU-based CanvasTexture generation with GPU procedural noise
   * SIGNIFICANT PERFORMANCE IMPROVEMENT: GPU vs CPU noise generation
   */
  private createProceduralCloudMaterial(
    colorHex: string,
    opacity: number,
    seedX: number,
    seedY: number
  ): SpriteNodeMaterial {
    const material = new SpriteNodeMaterial();

    // Color as TSL uniform
    const uColor = uniform(vec3(...new THREE.Color(colorHex).toArray()));
    const uOpacity = uniform(float(opacity));
    const uSeed = uniform(vec3(seedX, seedY, 0));

    // Normalize coordinates to -0.5 to 0.5
    const nx = add(uv().x, float(-0.5));
    const ny = add(uv().y, float(-0.5));

    // Scale for noise sampling
    const scale = 3.0;
    let px = add(mul(nx, float(scale)), uSeed.x);
    let py = add(mul(ny, float(scale)), uSeed.y);

    // Apply domain warping for organic distortion
    const warpedPos = domainWarp(vec3(px, py, float(0)), float(0.8));
    px = warpedPos.x;
    py = warpedPos.y;

    // Main cloud density using MaterialX FBM (6 octaves for detail)
    const cloudDensity = nativeFBMVec3(
      vec3(px, py, float(0)),
      float(6),
      float(2.0),
      float(0.5)
    );

    // Wispy detail using turbulence (absolute value)
    const wispyDetail = abs(
      nativeFBMVec3(
        vec3(mul(px, float(2)), mul(py, float(2)), float(0)),
        float(4),
        float(2.0),
        float(0.5)
      )
    );

    // Combine for final density
    const densityBase = add(
      mul(cloudDensity.x, float(0.7)),
      mul(wispyDetail.x, float(0.3))
    );

    // Normalize to 0-1
    const density = mul(add(densityBase, float(1.0)), float(0.5));

    // NOISE-BASED edge falloff (not circular!)
    // Use noise to create irregular edges
    const dist = pow(add(mul(nx, nx), mul(ny, ny)), float(0.5)); // sqrt(nx*nx + ny*ny)

    // Create irregular edge using noise
    const edgeNoise = nativeFBMVec3(
      vec3(
        add(mul(px, float(1.5)), float(5.0)),
        add(mul(py, float(1.5)), float(5.0)),
        float(0)
      ),
      float(3),
      float(2.0),
      float(0.5)
    );
    const edgeThreshold = add(float(0.35), mul(edgeNoise.x, float(0.15))); // Varies between 0.2 and 0.5

    // Soft falloff from noise-varied edge
    const edgeFalloffBase = float(1).sub(
      smoothstep(
        add(edgeThreshold, float(-0.15)),
        add(edgeThreshold, float(0.1)),
        dist
      )
    );

    // Add wispy tendrils at edges using turbulence
    const tendrilNoise = abs(
      nativeFBMVec3(
        vec3(
          add(mul(px, float(3)), float(10)),
          add(mul(py, float(3)), float(10)),
          float(0)
        ),
        float(4),
        float(2.0),
        float(0.6)
      )
    );
    const edgeFalloff = add(
      edgeFalloffBase,
      mul(mul(tendrilNoise.x, float(0.3)), float(1).sub(mul(dist, float(1.5))))
    ).clamp(0, 1);

    // Final alpha calculation
    const alphaBase = mul(density, edgeFalloff);

    // Enhance contrast for more visible clouds
    const alphaEnhanced = pow(alphaBase, float(1.2));

    // Clamp to valid range
    const alphaClamped = alphaEnhanced.clamp(0, 1);

    // Apply opacity multiplier
    const alpha = mul(alphaClamped, uOpacity);

    // Assign color and opacity nodes to material
    material.colorNode = uColor;
    material.opacityNode = alpha;

    // Material properties
    material.transparent = true;
    material.blending = THREE.AdditiveBlending;
    material.depthWrite = false;
    material.depthTest = true;
    material.fog = false;

    return material;
  }

  private disposeResources(): void {
    // Dispose sprites and materials with defensive checks
    for (const sprite of this.sprites) {
      if (!sprite) continue;

      // Safely dispose material - wrap in try-catch as WebGPU materials
      // can fail during disposal if internal state is already cleaned up
      if (sprite.material && sprite.material instanceof SpriteNodeMaterial) {
        try {
          sprite.material.dispose();
        } catch {
          // Material may already be disposed or in invalid state
        }
      }
    }
    this.sprites = [];
  }

  public ngOnDestroy(): void {
    // Cleanup handled by destroyRef
  }
}
