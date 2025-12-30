import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  computed,
  DestroyRef,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { uv, float, smoothstep, sub, length, vec2, mul } from 'three/tsl';
import { NG_3D_PARENT } from '../types/tokens';
import { RenderLoopService } from '../render-loop/render-loop.service';

/**
 * Simple spherical distribution (replacing maath dependency)
 * Generates random positions uniformly distributed within a sphere
 */
function generateStarPositions(count: number, radius: number): Float32Array {
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
 * Per-star data for multi-size and twinkle features
 */
interface StarData {
  size: number;
  brightness: number;
  color: THREE.Color;
  twinkleSpeed: number;
  twinklePhase: number;
}

/**
 * Stellar color palette based on temperature
 * Blue (hot) -> White -> Yellow -> Orange (cool)
 */
const STELLAR_COLORS = [
  '#9bb0ff', // O-type (blue, hottest)
  '#aabfff', // B-type (blue-white)
  '#cad7ff', // A-type (white)
  '#f8f7ff', // F-type (yellow-white)
  '#fff4ea', // G-type (yellow, like our Sun)
  '#ffd2a1', // K-type (orange)
  '#ffcc6f', // M-type (red-orange, coolest)
];

/**
 * StarFieldComponent - Configurable Star Field Primitive
 *
 * Creates a realistic star field with optional enhancements:
 * - Multi-size distribution (tiny, small, medium, large stars)
 * - Procedural glow texture for soft star appearance
 * - Temperature-based color palette
 * - Twinkle animation
 *
 * @example
 * ```html
 * <!-- Simple mode (default) -->
 * <a3d-star-field [starCount]="3000" [radius]="40" />
 *
 * <!-- Enhanced mode with all features -->
 * <a3d-star-field
 *   [starCount]="2000"
 *   [radius]="40"
 *   [enableGlow]="true"
 *   [enableTwinkle]="true"
 *   [multiSize]="true"
 *   [stellarColors]="true"
 * />
 * ```
 */
@Component({
  selector: 'a3d-star-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class StarFieldComponent implements OnDestroy {
  // Basic configuration inputs
  public readonly starCount = input<number>(3000);
  public readonly radius = input<number>(40);
  public readonly color = input<string | number>('#ffffff');
  public readonly size = input<number>(0.02);
  public readonly opacity = input<number>(0.8);

  // Enhancement inputs
  // NOTE: multiSize and stellarColors now default to true for better visual quality
  // Stars will have varied sizes and colors by default (like real night sky)
  public readonly enableTwinkle = input<boolean>(false);
  public readonly enableGlow = input<boolean>(false);
  public readonly multiSize = input<boolean>(true);
  public readonly stellarColors = input<boolean>(true);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // WebGPU-compatible: use InstancedMesh with quads instead of Points
  private object3d: THREE.InstancedMesh | THREE.Group | null = null;
  private starGeometry: THREE.PlaneGeometry | null = null;
  private starMaterial: THREE.MeshBasicNodeMaterial | null = null;
  private geometry: THREE.BufferGeometry | null = null; // For position data
  private glowTexture: THREE.CanvasTexture | null = null;
  private starDataArray: StarData[] = [];
  private twinkleCleanup: (() => void) | null = null;

  /**
   * Generate procedural star glow texture for sprite mode
   * Creates a radial gradient with soft falloff
   */
  private readonly createGlowTexture = computed(() => {
    if (!this.enableGlow()) {
      return null;
    }

    const canvas = document.createElement('canvas');
    const canvasSize = 128;
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d')!;

    // Create radial gradient (center to edge)
    const gradient = ctx.createRadialGradient(
      canvasSize / 2,
      canvasSize / 2,
      0,
      canvasSize / 2,
      canvasSize / 2,
      canvasSize / 2
    );

    // Bright center fading to transparent edges
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  });

  /**
   * Generate simpler glow texture for Points mode
   * Smaller texture for better performance with Points rendering
   * Makes stars appear as soft glowing circles instead of flat squares
   */
  private generatePointsGlowTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const canvasSize = 64; // Smaller than sprite version for performance
    canvas.width = canvasSize;
    canvas.height = canvasSize;
    const ctx = canvas.getContext('2d')!;

    // Create radial gradient (center to edge)
    const gradient = ctx.createRadialGradient(
      canvasSize / 2,
      canvasSize / 2,
      0,
      canvasSize / 2,
      canvasSize / 2,
      canvasSize / 2
    );

    // Soft glow with transparent edges (simpler than sprite version)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1.0, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    return texture;
  }

  /**
   * Generate per-star data for multi-size and color features
   */
  private generateStarData(count: number): StarData[] {
    const data: StarData[] = [];

    for (let i = 0; i < count; i++) {
      let starSize: number;
      let brightness: number;

      if (this.multiSize()) {
        // Size distribution: 80% tiny, 15% small, 4% medium, 1% large
        // Sizes match temp/star-field-enhanced.component.ts for proper glow appearance
        const rand = Math.random();

        if (rand < 0.8) {
          starSize = 0.05 + Math.random() * 0.05; // tiny: 0.05-0.10
          brightness = 0.4 + Math.random() * 0.3;
        } else if (rand < 0.95) {
          starSize = 0.1 + Math.random() * 0.1; // small: 0.10-0.20
          brightness = 0.6 + Math.random() * 0.3;
        } else if (rand < 0.99) {
          starSize = 0.2 + Math.random() * 0.15; // medium: 0.20-0.35
          brightness = 0.8 + Math.random() * 0.2;
        } else {
          starSize = 0.35 + Math.random() * 0.25; // large: 0.35-0.60
          brightness = 0.9 + Math.random() * 0.1;
        }
      } else {
        starSize = this.size();
        brightness = this.opacity();
      }

      // Color selection
      let starColor: THREE.Color;
      if (this.stellarColors()) {
        const colorHex =
          STELLAR_COLORS[Math.floor(Math.random() * STELLAR_COLORS.length)];
        starColor = new THREE.Color(colorHex);
      } else {
        starColor = new THREE.Color(this.color());
      }

      data.push({
        size: starSize,
        brightness,
        color: starColor,
        twinkleSpeed: 0.5 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
      });
    }

    return data;
  }

  public constructor() {
    // Effect for rebuilding stars when config changes
    effect((onCleanup) => {
      // Track dependencies
      const count = this.starCount();
      const radius = this.radius();
      const color = this.color();
      const starSize = this.size();
      const starOpacity = this.opacity();
      const enableGlow = this.enableGlow();
      const enableTwinkle = this.enableTwinkle();
      const multiSize = this.multiSize();
      const stellarColors = this.stellarColors();

      this.rebuildStars(
        count,
        radius,
        color,
        starSize,
        starOpacity,
        enableGlow,
        enableTwinkle,
        multiSize,
        stellarColors
      );

      onCleanup(() => {
        this.disposeResources();
      });
    });
  }

  private rebuildStars(
    count: number,
    radius: number,
    color: string | number,
    starSize: number,
    starOpacity: number,
    enableGlow: boolean,
    enableTwinkle: boolean,
    multiSize: boolean,
    stellarColors: boolean
  ): void {
    // Dispose old resources
    this.disposeResources();

    // Remove old object from parent if exists
    if (this.object3d && this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.object3d);
    }

    // Generate star positions
    const positions = generateStarPositions(count, radius);

    // Generate per-star data if multi-size or stellar colors enabled
    if (multiSize || stellarColors || enableGlow || enableTwinkle) {
      this.starDataArray = this.generateStarData(count);
    }

    // Create geometry
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );

    // Choose rendering mode: Glow uses Sprites, Simple uses Points
    if (enableGlow) {
      this.buildGlowStars(count);
    } else {
      this.buildSimpleStars(
        color,
        starSize,
        starOpacity,
        multiSize,
        stellarColors
      );
    }

    // Add to parent
    if (this.parentFn && this.object3d) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.object3d);
      }
    }

    // Setup twinkle animation if enabled
    if (enableTwinkle) {
      this.setupTwinkleAnimation();
    }
  }

  /**
   * Build star field using THREE.InstancedMesh with PlaneGeometry quads
   *
   * WebGPU COMPATIBLE: Uses InstancedMesh with small plane quads.
   * Each quad has UVs, so we can use TSL's uv() for circular falloff.
   * This works in both WebGPU and WebGL (unlike Points which are 1px in WebGPU).
   */
  private buildSimpleStars(
    color: string | number,
    starSize: number,
    starOpacity: number,
    multiSize: boolean,
    stellarColors: boolean
  ): void {
    const count =
      this.starDataArray.length > 0
        ? this.starDataArray.length
        : this.starCount();
    const positions = this.geometry!.getAttribute('position');

    // Create a small plane geometry for each star (has proper UVs)
    this.starGeometry = new THREE.PlaneGeometry(1, 1);

    // Create TSL material with circular falloff using uv()
    // uv() works with PlaneGeometry (it has UV attributes)
    const centeredUV = sub(uv(), vec2(0.5, 0.5));
    const dist = length(centeredUV);
    // Soft circular falloff: opaque at center, transparent at edges
    const circularAlpha = sub(
      float(1.0),
      smoothstep(float(0.0), float(0.5), dist)
    );
    const finalOpacity = mul(circularAlpha, float(starOpacity));

    // Create material
    this.starMaterial = new THREE.MeshBasicNodeMaterial();
    this.starMaterial.transparent = true;
    this.starMaterial.depthWrite = false;
    this.starMaterial.blending = THREE.AdditiveBlending;
    this.starMaterial.side = THREE.DoubleSide;
    this.starMaterial.opacityNode = finalOpacity;

    // Set base color
    if (!stellarColors) {
      this.starMaterial.color = new THREE.Color(color);
    }

    // Create instanced mesh
    this.object3d = new THREE.InstancedMesh(
      this.starGeometry,
      this.starMaterial,
      count
    );

    // Set up instance transforms
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      // Position
      dummy.position.set(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );

      // Size - use star data if available, otherwise use input
      const size = this.starDataArray[i]?.size ?? starSize;
      dummy.scale.setScalar(size);

      // Random rotation for variety
      dummy.rotation.z = Math.random() * Math.PI * 2;

      dummy.updateMatrix();
      this.object3d.setMatrixAt(i, dummy.matrix);

      // Set per-instance color if stellar colors enabled
      if (stellarColors && this.starDataArray[i]) {
        this.object3d.setColorAt(i, this.starDataArray[i].color);
      }
    }

    // Enable instance colors if using stellar colors
    if (stellarColors) {
      this.object3d.instanceColor!.needsUpdate = true;
    }

    this.object3d.instanceMatrix.needsUpdate = true;
    this.object3d.frustumCulled = false; // Stars span entire scene
  }

  /**
   * Build glowing star field using THREE.Sprite instances
   */
  private buildGlowStars(count: number): void {
    const group = new THREE.Group();
    const texture = this.createGlowTexture();

    if (!texture) {
      // Fallback to simple mode if texture creation fails
      this.buildSimpleStars(
        this.color(),
        this.size(),
        this.opacity(),
        this.multiSize(),
        this.stellarColors()
      );
      return;
    }

    this.glowTexture = texture;

    const positions = this.geometry!.getAttribute('position');

    for (let i = 0; i < count; i++) {
      const star = this.starDataArray[i];

      // Create sprite material with NodeMaterial pattern (direct property assignment)
      const spriteMaterial = new THREE.SpriteNodeMaterial();
      spriteMaterial.map = texture;
      spriteMaterial.color = star.color;
      spriteMaterial.opacity = star.brightness;
      spriteMaterial.transparent = true;
      spriteMaterial.blending = THREE.AdditiveBlending;
      spriteMaterial.depthWrite = false;

      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(
        positions.getX(i),
        positions.getY(i),
        positions.getZ(i)
      );
      sprite.scale.setScalar(star.size);

      // Store star index for twinkle animation
      sprite.userData = { starIndex: i };

      group.add(sprite);
    }

    this.object3d = group;
    this.starMaterial = null; // Materials are per-sprite
  }

  /**
   * Setup twinkle animation using RenderLoopService
   */
  private setupTwinkleAnimation(): void {
    // Clear any existing twinkle animation
    if (this.twinkleCleanup) {
      this.twinkleCleanup();
      this.twinkleCleanup = null;
    }

    let elapsed = 0;

    this.twinkleCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      elapsed += delta;

      if (!this.object3d) return;

      if (this.enableGlow() && this.object3d instanceof THREE.Group) {
        // Twinkle for sprite-based stars
        this.object3d.children.forEach((sprite) => {
          if (
            sprite instanceof THREE.Sprite &&
            sprite.userData['starIndex'] !== undefined
          ) {
            const star = this.starDataArray[sprite.userData['starIndex']];
            const spriteMat = sprite.material as THREE.SpriteNodeMaterial;
            const twinkle =
              Math.sin(elapsed * star.twinkleSpeed + star.twinklePhase) * 0.3 +
              0.7;
            spriteMat.opacity = star.brightness * twinkle;
          }
        });
      } else if (this.object3d instanceof THREE.InstancedMesh) {
        // Twinkle for instanced mesh stars
        // For InstancedMesh, we can't easily animate per-instance opacity
        // Instead, we'll pulse the overall material opacity slightly
        if (this.starMaterial) {
          const baseOpacity = this.opacity();
          const twinkle = Math.sin(elapsed * 0.5) * 0.1 + 0.9;
          this.starMaterial.opacity = baseOpacity * twinkle;
          this.starMaterial.needsUpdate = true;
        }
      }
    });

    // Register cleanup with DestroyRef
    this.destroyRef.onDestroy(() => {
      if (this.twinkleCleanup) {
        this.twinkleCleanup();
        this.twinkleCleanup = null;
      }
    });
  }

  private disposeResources(): void {
    // Cleanup twinkle animation
    if (this.twinkleCleanup) {
      this.twinkleCleanup();
      this.twinkleCleanup = null;
    }

    // Dispose position data geometry
    this.geometry?.dispose();
    this.geometry = null;

    // Dispose star geometry (for InstancedMesh)
    this.starGeometry?.dispose();
    this.starGeometry = null;

    // Dispose star material
    if (this.starMaterial) {
      this.starMaterial.dispose();
      this.starMaterial = null;
    }

    // Dispose sprite materials in group
    if (this.object3d instanceof THREE.Group) {
      this.object3d.children.forEach((sprite) => {
        if (sprite instanceof THREE.Sprite) {
          sprite.material.dispose();
        }
      });
    }

    // Dispose glow texture
    if (this.glowTexture) {
      this.glowTexture.dispose();
      this.glowTexture = null;
    }

    // Clear star data
    this.starDataArray = [];
  }

  public ngOnDestroy(): void {
    if (this.parentFn && this.object3d) {
      const parent = this.parentFn();
      parent?.remove(this.object3d);
    }
    this.disposeResources();
  }
}
