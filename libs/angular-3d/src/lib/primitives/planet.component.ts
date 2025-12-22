import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';
import { injectTextureLoader } from '../loaders/inject-texture-loader';

@Component({
  selector: 'a3d-planet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PlanetComponent implements OnDestroy {
  // Transform inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly radius = input<number>(6.5);
  public readonly segments = input<number>(64);

  // Texture input
  public readonly textureUrl = input<string | null>(null);

  // Material inputs
  public readonly color = input<string | number>(0xcccccc);
  public readonly metalness = input<number>(0.3);
  public readonly roughness = input<number>(0.7);

  // Emissive properties (for self-illumination)
  /**
   * Emissive color - makes the planet glow from within
   * Default: 0x000000 (black, no emissive)
   */
  public readonly emissive = input<string | number>(0x000000);

  /**
   * Emissive intensity - strength of self-illumination
   * Default: 0.2 (subtle glow)
   */
  public readonly emissiveIntensity = input<number>(0.2);

  // Transform properties
  /**
   * Scale multiplier - allows easy size adjustment without changing radius
   * Default: 1 (no scaling)
   */
  public readonly scale = input<number>(1);

  // Glow inputs
  /**
   * Glow intensity - strength of point light halo effect
   * Default: 0.8 (visible atmosphere/aura effect)
   */
  public readonly glowIntensity = input<number>(0.8);

  /**
   * Glow color - color of the point light halo
   * Default: 0xffffff (white)
   */
  public readonly glowColor = input<string | number>(0xffffff);

  /**
   * Glow distance - range of the point light effect
   * Default: 15 (was hardcoded, now configurable)
   */
  public readonly glowDistance = input<number>(15);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  // Pattern: inject-texture-loader.ts:62-64 (reactive texture loading)
  // Note: We need a reactive way to get the loader signal based on the input signal
  // But inject functions must be in injection context.
  // We can't use injectTextureLoader inside an effect.
  // However, we can use a computed signal if the URL allows it, or just use the loader service directly?
  // Use specific texture loader service if available, or raw THREE.TextureLoader.
  // Given 'injectTextureLoader' is likely designed for component initialization:
  // If we want dynamic textures, we might need a different pattern or accept that the texture loader
  // signal is created once.
  // Actually, 'injectTextureLoader' takes a signal function. So it IS reactive.
  // It returns a signal 'Resource<Texture>'.
  private readonly textureResource = injectTextureLoader(this.textureUrl);

  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardMaterial | null = null;
  private light: THREE.PointLight | null = null;

  public constructor() {
    // Top-level effect for rebuilding the planet structure (geometry/material/light)
    effect((onCleanup) => {
      // Dependencies
      const radius = this.radius();
      const segments = this.segments();
      const color = this.color();
      const metalness = this.metalness();
      const roughness = this.roughness();
      const emissive = this.emissive();
      const emissiveIntensity = this.emissiveIntensity();
      const scale = this.scale();
      const glowIntensity = this.glowIntensity();
      const glowColor = this.glowColor();
      const glowDistance = this.glowDistance();

      // Texture dependency
      // Access  data signal directly from the resource object
      const textureData = this.textureResource.data();

      this.rebuildPlanet(
        radius,
        segments,
        color,
        metalness,
        roughness,
        emissive,
        emissiveIntensity,
        scale,
        glowIntensity,
        glowColor,
        glowDistance,
        textureData
      );

      onCleanup(() => {
        this.disposeResources();
      });
    });

    // Transform effect
    effect(() => {
      if (this.mesh) {
        this.mesh.position.set(...this.position());
        // Update light position if it exists
        if (this.light) {
          this.light.position.set(...this.position());
        }
      }
    });
  }

  private rebuildPlanet(
    radius: number,
    segments: number,
    color: string | number,
    metalness: number,
    roughness: number,
    emissive: string | number,
    emissiveIntensity: number,
    scale: number,
    glowIntensity: number,
    glowColor: string | number,
    glowDistance: number,
    texture: THREE.Texture | null
  ): void {
    // Dispose old
    this.disposeResources();

    // Remove from parent
    if (this.parentFn) {
      const parent = this.parentFn();
      if (this.mesh) parent?.remove(this.mesh);
      if (this.light) parent?.remove(this.light);
    }

    // Geometry
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Material with conditional properties and bump mapping
    // When texture exists: less metallic (0.1), more rough (0.9) for realistic appearance
    // When no texture: use input values for metalness/roughness
    this.material = new THREE.MeshStandardMaterial({
      color: color,
      map: texture,
      bumpMap: texture, // Use texture as bump map for surface detail
      bumpScale: texture ? 1 : 0, // Only apply bump when texture exists
      emissive: emissive, // Self-illumination color
      emissiveIntensity: emissiveIntensity, // Self-illumination strength
      metalness: texture ? 0.1 : metalness, // Conditional: textured planets less metallic
      roughness: texture ? 0.9 : roughness, // Conditional: textured planets rougher
    });

    // Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.scale.set(scale, scale, scale); // Apply scale multiplier
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Glow Light with configurable distance
    if (glowIntensity > 0) {
      this.light = new THREE.PointLight(
        glowColor,
        glowIntensity,
        glowDistance,
        2
      );
      this.light.position.set(...this.position());
    } else {
      this.light = null;
    }

    // Add to parent
    if (this.parentFn) {
      const parent = this.parentFn();
      if (parent) {
        parent.add(this.mesh);
        if (this.light) {
          parent.add(this.light);
        }
      } else {
        console.warn('PlanetComponent: Parent not ready');
      }
    } else {
      console.warn('PlanetComponent: No parent found');
    }
  }

  private disposeResources(): void {
    this.geometry?.dispose();
    this.geometry = null;
    this.material?.dispose();
    this.material = null;
    this.light?.dispose();
    this.light = null;
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      if (this.mesh) parent?.remove(this.mesh);
      if (this.light) parent?.remove(this.light);
    }
    this.disposeResources();
  }
}
