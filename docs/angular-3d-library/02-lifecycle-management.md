# 02 - Lifecycle Management

## Overview

Properly managing Three.js object lifecycle in Angular components to prevent memory leaks and ensure cleanup.

## The Challenge

Angular components have their own lifecycle, but Three.js objects don't automatically clean up. You must:

1. Create Three.js objects during Angular initialization
2. Add them to the scene when ready
3. Update them reactively when inputs change
4. Remove and dispose them on destruction

## Lifecycle Hooks Mapping

| Angular Hook      | Three.js Action   | Why              |
| ----------------- | ----------------- | ---------------- |
| `constructor`     | Inject services   | DI setup         |
| `ngOnInit`        | Create objects    | Inputs available |
| `ngAfterViewInit` | Add to scene      | DOM ready        |
| `ngOnChanges`     | Update properties | Input changes    |
| `ngOnDestroy`     | Dispose objects   | Cleanup          |

## Base Component Pattern

### Abstract Base Class

```typescript
import { Directive, inject, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import { SceneService } from '../services/scene.service';

@Directive()
export abstract class ThreeJsObject3DComponent implements OnDestroy {
  protected sceneService = inject(SceneService);
  protected object3d?: THREE.Object3D;

  protected addToScene(object: THREE.Object3D) {
    this.object3d = object;
    this.sceneService.addToScene(object);
  }

  protected removeFromScene() {
    if (this.object3d) {
      this.sceneService.removeFromScene(this.object3d);
      this.disposeObject(this.object3d);
      this.object3d = undefined;
    }
  }

  protected disposeObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();

        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => mat.dispose());
        } else {
          child.material?.dispose();
        }
      }
    });
  }

  ngOnDestroy() {
    this.removeFromScene();
  }

  // Public API for directives
  getObject3D(): THREE.Object3D | undefined {
    return this.object3d;
  }
}
```

## Planet Component Example

```typescript
import { Component, input, effect, AfterViewInit } from '@angular/core';
import * as THREE from 'three';
import { ThreeJsObject3DComponent } from '../base/threejs-object3d.component';

@Component({
  selector: 'app-planet',
  standalone: true,
  template: '', // No template needed
})
export class PlanetComponent extends ThreeJsObject3DComponent implements AfterViewInit {
  // Inputs
  readonly position = input<[number, number, number]>([0, 0, 0]);
  readonly radius = input<number>(5);
  readonly color = input<number>(0xcccccc);
  readonly textureUrl = input<string | undefined>(undefined);

  // Three.js objects
  private mesh?: THREE.Mesh;
  private geometry?: THREE.SphereGeometry;
  private material?: THREE.MeshStandardMaterial;

  constructor() {
    super();

    // React to position changes
    effect(() => {
      const pos = this.position();
      if (this.mesh) {
        this.mesh.position.set(...pos);
      }
    });

    // React to color changes
    effect(() => {
      const color = this.color();
      if (this.material) {
        this.material.color.setHex(color);
      }
    });
  }

  ngAfterViewInit() {
    this.createPlanet();
  }

  private createPlanet() {
    // Create geometry
    this.geometry = new THREE.SphereGeometry(this.radius(), 150, 150);

    // Create material
    this.material = new THREE.MeshStandardMaterial({
      color: this.color(),
      metalness: 0.3,
      roughness: 0.7,
    });

    // Load texture if provided
    const textureUrl = this.textureUrl();
    if (textureUrl) {
      const textureLoader = new THREE.TextureLoader();
      textureLoader.load(textureUrl, (texture) => {
        if (this.material) {
          this.material.map = texture;
          this.material.needsUpdate = true;
        }
      });
    }

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Add to scene
    this.addToScene(this.mesh);
  }

  override ngOnDestroy() {
    // Dispose specific resources
    this.geometry?.dispose();
    this.material?.dispose();

    // Call parent cleanup
    super.ngOnDestroy();
  }

  // Override for typed access
  override getObject3D(): THREE.Mesh | undefined {
    return this.mesh;
  }
}
```

## Signal-Based Reactive Updates

### Pattern: Effect for Simple Updates

```typescript
export class PlanetComponent {
  readonly scale = input<number>(1);

  constructor() {
    effect(() => {
      const scaleValue = this.scale();
      if (this.mesh) {
        this.mesh.scale.setScalar(scaleValue);
      }
    });
  }
}
```

### Pattern: Computed for Derived Values

```typescript
import { computed } from '@angular/core';

export class PlanetComponent {
  readonly emissiveIntensity = input<number>(0.2);
  readonly glowMultiplier = input<number>(1.0);

  private readonly finalEmissiveIntensity = computed(() => {
    return this.emissiveIntensity() * this.glowMultiplier();
  });

  constructor() {
    effect(() => {
      const intensity = this.finalEmissiveIntensity();
      if (this.material) {
        this.material.emissiveIntensity = intensity;
        this.material.needsUpdate = true;
      }
    });
  }
}
```

## Texture Loading Lifecycle

### Pattern: Async Texture Loading

```typescript
import { signal } from '@angular/core';

export class PlanetComponent {
  readonly textureUrl = input<string | undefined>(undefined);
  private textureLoaded = signal(false);
  private textureLoader = new THREE.TextureLoader();

  constructor() {
    effect(() => {
      const url = this.textureUrl();
      if (url && this.material) {
        this.loadTexture(url);
      }
    });
  }

  private loadTexture(url: string) {
    this.textureLoader.load(
      url,
      (texture) => {
        // Success
        if (this.material) {
          this.material.map = texture;
          this.material.needsUpdate = true;
          this.textureLoaded.set(true);
        }
      },
      undefined,
      (error) => {
        // Error
        console.error('Failed to load texture:', error);
        this.textureLoaded.set(false);
      }
    );
  }

  override ngOnDestroy() {
    // Dispose texture
    if (this.material?.map) {
      this.material.map.dispose();
    }
    super.ngOnDestroy();
  }
}
```

## Group-Based Components

### Pattern: Multiple Objects

```typescript
@Component({
  selector: 'app-planet-with-rings',
  standalone: true,
  template: '',
})
export class PlanetWithRingsComponent extends ThreeJsObject3DComponent implements AfterViewInit {
  private group?: THREE.Group;
  private planetMesh?: THREE.Mesh;
  private ringMesh?: THREE.Mesh;

  ngAfterViewInit() {
    this.createPlanetSystem();
  }

  private createPlanetSystem() {
    this.group = new THREE.Group();

    // Create planet
    const planetGeometry = new THREE.SphereGeometry(5, 64, 64);
    const planetMaterial = new THREE.MeshStandardMaterial({ color: 0x8b7355 });
    this.planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    this.group.add(this.planetMesh);

    // Create rings
    const ringGeometry = new THREE.RingGeometry(7, 10, 64);
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: 0xc4a57b,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    this.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    this.ringMesh.rotation.x = Math.PI / 2; // Flatten rings
    this.group.add(this.ringMesh);

    // Add group to scene
    this.addToScene(this.group);
  }

  override ngOnDestroy() {
    // Dispose all geometries and materials
    this.planetMesh?.geometry.dispose();
    (this.planetMesh?.material as THREE.Material).dispose();

    this.ringMesh?.geometry.dispose();
    (this.ringMesh?.material as THREE.Material).dispose();

    super.ngOnDestroy();
  }
}
```

## Memory Leak Prevention

### Checklist: What to Dispose

```typescript
override ngOnDestroy() {
  // 1. Geometries
  this.geometry?.dispose();

  // 2. Materials (single or array)
  if (Array.isArray(this.material)) {
    this.material.forEach(mat => mat.dispose());
  } else {
    this.material?.dispose();
  }

  // 3. Textures
  this.material?.map?.dispose();
  this.material?.bumpMap?.dispose();
  this.material?.normalMap?.dispose();

  // 4. Animation mixers
  this.mixer?.stopAllAction();

  // 5. Event listeners
  window.removeEventListener('resize', this.onResize);

  // 6. GSAP animations
  this.gsapAnimation?.kill();

  // 7. Remove from scene
  super.ngOnDestroy();
}
```

### Pattern: Disposal Service

```typescript
@Injectable({ providedIn: 'root' })
export class DisposalService {
  disposeObject3D(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        this.disposeMesh(child);
      }

      if (child instanceof THREE.Points) {
        this.disposePoints(child);
      }
    });
  }

  private disposeMesh(mesh: THREE.Mesh) {
    mesh.geometry?.dispose();

    if (Array.isArray(mesh.material)) {
      mesh.material.forEach((mat) => this.disposeMaterial(mat));
    } else if (mesh.material) {
      this.disposeMaterial(mesh.material);
    }
  }

  private disposeMaterial(material: THREE.Material) {
    // Dispose all texture properties
    const textureProps = ['map', 'lightMap', 'bumpMap', 'normalMap', 'specularMap', 'envMap', 'alphaMap', 'aoMap', 'displacementMap', 'emissiveMap', 'roughnessMap', 'metalnessMap'];

    textureProps.forEach((prop) => {
      const texture = (material as any)[prop];
      if (texture instanceof THREE.Texture) {
        texture.dispose();
      }
    });

    material.dispose();
  }

  private disposePoints(points: THREE.Points) {
    points.geometry?.dispose();
    (points.material as THREE.Material)?.dispose();
  }
}
```

## DestroyRef Pattern (Angular 16+)

```typescript
import { DestroyRef, inject } from '@angular/core';

export class PlanetComponent {
  private destroyRef = inject(DestroyRef);
  private mesh?: THREE.Mesh;

  ngAfterViewInit() {
    this.createPlanet();

    // Register cleanup callback
    this.destroyRef.onDestroy(() => {
      this.mesh?.geometry.dispose();
      (this.mesh?.material as THREE.Material).dispose();
      this.sceneService.removeFromScene(this.mesh!);
    });
  }
}
```

## Testing Cleanup

### Unit Test Example

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanetComponent } from './planet.component';

describe('PlanetComponent', () => {
  let component: PlanetComponent;
  let fixture: ComponentFixture<PlanetComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PlanetComponent],
    });

    fixture = TestBed.createComponent(PlanetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should clean up Three.js objects on destroy', () => {
    const mesh = component.getObject3D() as THREE.Mesh;
    const geometry = mesh.geometry;
    const material = mesh.material as THREE.Material;

    // Spy on dispose methods
    const geometryDisposeSpy = jest.spyOn(geometry, 'dispose');
    const materialDisposeSpy = jest.spyOn(material, 'dispose');

    // Destroy component
    fixture.destroy();

    // Verify cleanup
    expect(geometryDisposeSpy).toHaveBeenCalled();
    expect(materialDisposeSpy).toHaveBeenCalled();
  });
});
```

## Key Principles

### ✅ DO

- Always dispose geometries, materials, and textures
- Remove objects from scene before disposing
- Use DestroyRef or ngOnDestroy for cleanup
- Unsubscribe from observables
- Kill GSAP animations
- Remove event listeners

### ❌ DON'T

- Leave objects in scene after component destruction
- Forget to dispose textures (common leak)
- Keep references to disposed objects
- Create new objects in effects without cleanup
- Ignore disposal in child objects

## Next Steps

See **[03-render-loop.md](./03-render-loop.md)** for managing the animation loop and update cycles.
