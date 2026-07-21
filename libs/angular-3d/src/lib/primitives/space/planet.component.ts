import {
  Component,
  ChangeDetectionStrategy,
  OnDestroy,
  inject,
  input,
  effect,
} from '@angular/core';
import * as THREE from 'three/webgpu';
import { NG_3D_PARENT } from '../../types/tokens';
import { injectTextureLoader } from '../../loaders/inject-texture-loader';

@Component({
  selector: 'a3d-planet',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class PlanetComponent implements OnDestroy {
  // Transform inputs
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly radius = input<number>(6.5);
  public readonly segments = input<number>(64);

  // Texture input
  public readonly textureUrl = input<string | null>(null);

  /**
   * Optional emissive (night-lights) map URL. When set, the texture is used as
   * an `emissiveMap` so bright areas (e.g. city lights) self-illuminate
   * independent of scene lighting. Point it at the same albedo for a glowing
   * night-earth. Default: null (no self-illumination map).
   */
  public readonly emissiveMapUrl = input<string | null>(null);

  /**
   * Bump-map strength. When > 0 the albedo texture is used as a bump map at
   * this scale for surface relief. Default: 0 (off) — a color texture makes a
   * poor bump map, so this is opt-in.
   */
  public readonly bumpScale = input<number>(0);

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
  private readonly emissiveTextureResource = injectTextureLoader(
    this.emissiveMapUrl
  );

  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardNodeMaterial | null = null;
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
      const bumpScale = this.bumpScale();

      // Texture dependencies
      // Access  data signal directly from the resource object
      const textureData = this.textureResource.data();
      const emissiveTextureData = this.emissiveTextureResource.data();

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
        textureData,
        emissiveTextureData,
        bumpScale
      );

      onCleanup(() => {
        this.disposeResources();
      });
    });

    // Transform effect
    effect(() => {
      if (this.mesh) {
        this.mesh.position.set(...this.position());
        this.mesh.rotation.set(...this.rotation());
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
    texture: THREE.Texture | null,
    emissiveTexture: THREE.Texture | null,
    bumpScale: number
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

    // Material with NodeMaterial pattern (direct property assignment).
    // Material inputs (metalness/roughness) are honored as-is — the material is
    // deliberately unopinionated so callers control the look.
    this.material = new THREE.MeshStandardNodeMaterial();
    this.material.color = new THREE.Color(color);
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace; // sample albedo in sRGB
      texture.anisotropy = 16; // stay sharp at grazing angles (the limb)
      this.material.map = texture;
      // Bump is opt-in: a color texture is a poor height map, so only apply it
      // when the caller explicitly sets a bumpScale.
      if (bumpScale > 0) {
        this.material.bumpMap = texture;
        this.material.bumpScale = bumpScale;
      }
    }
    // Emissive: an emissive map (e.g. night-lights) self-illuminates bright
    // areas; drive it white so the map's own colors show. Otherwise use the
    // flat emissive color.
    if (emissiveTexture) {
      emissiveTexture.colorSpace = THREE.SRGBColorSpace;
      emissiveTexture.anisotropy = 16;
      this.material.emissiveMap = emissiveTexture;
      this.material.emissive = new THREE.Color(0xffffff);
    } else {
      this.material.emissive = new THREE.Color(emissive);
    }
    this.material.emissiveIntensity = emissiveIntensity;
    this.material.metalness = metalness;
    this.material.roughness = roughness;

    // Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.rotation.set(...this.rotation());
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
    // Wrap dispose calls in try-catch as WebGPU materials/geometry
    // can fail during disposal if internal state is already cleaned up
    if (this.geometry) {
      try {
        this.geometry.dispose();
      } catch {
        // Geometry may already be disposed
      }
      this.geometry = null;
    }

    if (this.material) {
      try {
        this.material.dispose();
      } catch {
        // Material may already be disposed or in invalid state
      }
      this.material = null;
    }

    if (this.light) {
      try {
        this.light.dispose();
      } catch {
        // Light may already be disposed
      }
      this.light = null;
    }
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
