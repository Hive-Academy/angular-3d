import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
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
export class PlanetComponent implements OnInit, OnDestroy {
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
  private readonly textureLoader = (() => {
    const url = this.textureUrl();
    return url ? injectTextureLoader(() => url) : null;
  })();

  private mesh!: THREE.Mesh;
  private geometry!: THREE.SphereGeometry;
  private material!: THREE.MeshStandardMaterial;
  private light?: THREE.PointLight;

  public constructor() {
    // Reactive position updates
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

  public ngOnInit(): void {
    // Pattern: box.component.ts:77-91
    this.geometry = new THREE.SphereGeometry(
      this.radius(),
      this.segments(),
      this.segments()
    );

    const texture = this.textureLoader?.data() ?? null;
    this.material = new THREE.MeshStandardMaterial({
      color: this.color(),
      map: texture,
      metalness: this.metalness(),
      roughness: this.roughness(),
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Glow light (pattern: temp/planet.component.ts:67-74)
    if (this.glowIntensity() > 0) {
      this.light = new THREE.PointLight(
        this.glowColor(),
        this.glowIntensity(),
        15,
        2
      );
      this.light.position.set(...this.position());
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

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.mesh);
      if (this.light) {
        parent?.remove(this.light);
      }
    }
    this.geometry?.dispose();
    this.material?.dispose();
    this.light?.dispose();
  }
}
