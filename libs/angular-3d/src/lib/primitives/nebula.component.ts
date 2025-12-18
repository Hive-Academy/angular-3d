import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
  afterNextRender,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';

/**
 * Generate a procedural cloud texture using canvas
 * Simplified approach: radial gradient with alpha falloff
 */
function generateCloudTexture(
  size: number,
  color: THREE.Color
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    // Radial gradient from opaque center to transparent edges
    gradient.addColorStop(
      0,
      `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`
    );
    gradient.addColorStop(
      0.3,
      `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.8)`
    );
    gradient.addColorStop(
      0.6,
      `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0.4)`
    );
    gradient.addColorStop(
      1,
      `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 0)`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Simple spherical distribution for cloud sprites
 */
function generateSpritePositions(
  count: number,
  radius: number
): THREE.Vector3[] {
  const positions: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.cbrt(Math.random()) * radius;

    positions.push(
      new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )
    );
  }
  return positions;
}

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
  public readonly cloudCount = input<number>(20);
  public readonly radius = input<number>(10);
  public readonly color = input<string | number>(0x4488ff);
  public readonly opacity = input<number>(0.6);
  public readonly minSize = input<number>(2);
  public readonly maxSize = input<number>(5);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private group: THREE.Group;
  private sprites: THREE.Sprite[] = [];
  private texture: THREE.CanvasTexture | null = null;

  public constructor() {
    this.group = new THREE.Group();

    // Add to parent after first render
    afterNextRender(() => {
      if (this.parentFn) {
        const parent = this.parentFn();
        if (parent) {
          parent.add(this.group);
        } else {
          console.warn('NebulaComponent: Parent not ready');
        }
      } else {
        console.warn('NebulaComponent: No parent found');
      }
    });

    // Effect for rebuilding clouds when config changes
    effect((onCleanup) => {
      // Track dependencies
      const count = this.cloudCount();
      const radius = this.radius();
      const color = this.color();
      const opacity = this.opacity();
      const minSize = this.minSize();
      const maxSize = this.maxSize();

      this.rebuildNebula(count, radius, color, opacity, minSize, maxSize);

      onCleanup(() => {
        this.disposeResources();
      });
    });

    // Transform effects
    effect(() => {
      this.group.position.set(...this.position());
    });
  }

  private rebuildNebula(
    count: number,
    radius: number,
    color: string | number,
    opacity: number,
    minSize: number,
    maxSize: number
  ): void {
    // Clear previous sprites from group (resources disposed in onCleanup/disposeResources)
    this.group.clear();
    this.sprites = [];

    // Generate cloud texture
    const cloudColor = new THREE.Color(color);
    // Reuse texture if color hasn't changed? For simplicity, regenerate.
    // Optimization: In a real app, memoize texture based on color alone.
    if (this.texture) this.texture.dispose();
    this.texture = generateCloudTexture(128, cloudColor);

    // Generate sprite positions
    const positions = generateSpritePositions(count, radius);

    // Create sprites
    for (let i = 0; i < positions.length; i++) {
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        transparent: true,
        opacity: opacity * (0.7 + Math.random() * 0.3), // Vary opacity
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const sprite = new THREE.Sprite(material);
      sprite.position.copy(positions[i]);

      // Vary size between min and max
      const size = minSize + Math.random() * (maxSize - minSize);
      sprite.scale.set(size, size, 1);

      this.sprites.push(sprite);
      this.group.add(sprite);
    }
  }

  private disposeResources(): void {
    // Dispose sprites and materials
    for (const sprite of this.sprites) {
      if (sprite.material instanceof THREE.SpriteMaterial) {
        sprite.material.dispose();
      }
    }
    this.sprites = []; // Clear array

    // Dispose texture
    this.texture?.dispose();
    this.texture = null;
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }
    this.disposeResources();
  }
}
