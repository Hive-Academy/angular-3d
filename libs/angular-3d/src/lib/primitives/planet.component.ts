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

  // Glow inputs
  public readonly glowIntensity = input<number>(0);
  public readonly glowColor = input<string | number>(0xffffff);

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
      const glowIntensity = this.glowIntensity();
      const glowColor = this.glowColor();

      // Texture dependency
      // Access  data signal directly from the resource object
      const textureData = this.textureResource.data();

      this.rebuildPlanet(
        radius,
        segments,
        color,
        metalness,
        roughness,
        glowIntensity,
        glowColor,
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
    glowIntensity: number,
    glowColor: string | number,
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

    // Material
    this.material = new THREE.MeshStandardMaterial({
      color: color,
      map: texture,
      metalness: metalness,
      roughness: roughness,
    });

    // Mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Glow Light
    if (glowIntensity > 0) {
      this.light = new THREE.PointLight(glowColor, glowIntensity, 15, 2);
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
