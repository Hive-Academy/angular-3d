# Implementation Plan - TASK_2025_008

## Goal

Implement 8 advanced primitive components for `@hive-academy/angular-3d`: GltfModel, SvgIcon, Text3D, Planet, StarField, Nebula, ParticleSystem, and SceneLighting. These components replace temp/ implementations that depend on `angular-three`, using our established patterns: signal inputs, `NG_3D_PARENT` hierarchy, and direct Three.js manipulation.

## Proposed Changes

### Component 1: GLTF Model Loading

#### [NEW] `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`

**Purpose**: Declarative GLTF/GLB model loading with reactive transforms and material overrides.

**Pattern Reference**:

- `box.component.ts:1-115` (signal inputs, NG_3D_PARENT injection, lifecycle)
- `gltf-loader.service.ts:109-182` (GltfLoaderService.load() API)
- `temp/primitives/gltf-model.component.ts:104-313` (material customization pattern)

**Implementation**:

```typescript
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, input, effect, signal } from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';
import { GltfLoaderService } from '../loaders/gltf-loader.service';

@Component({
  selector: 'a3d-gltf-model',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class GltfModelComponent implements OnInit, OnDestroy {
  // Pattern: box.component.ts:21-30 (transform inputs)
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly rotation = input<[number, number, number]>([0, 0, 0]);
  public readonly scale = input<number | [number, number, number]>(1);

  // Model loading inputs
  public readonly modelPath = input.required<string>();
  public readonly useDraco = input<boolean>(false);

  // Material override inputs (pattern: temp/gltf-model.component.ts:150-155)
  public readonly colorOverride = input<string | number | undefined>(undefined);
  public readonly metalness = input<number | undefined>(undefined);
  public readonly roughness = input<number | undefined>(undefined);

  private readonly gltfLoader = inject(GltfLoaderService);
  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private group: THREE.Group | null = null;

  constructor() {
    // Pattern: box.component.ts:41-62 (reactive effects for transforms)
    effect(() => {
      if (this.group) {
        this.group.position.set(...this.position());
      }
    });
    effect(() => {
      if (this.group) {
        this.group.rotation.set(...this.rotation());
      }
    });
    effect(() => {
      if (this.group) {
        const s = this.scale();
        const scale = typeof s === 'number' ? [s, s, s] : s;
        this.group.scale.set(...scale);
      }
    });
    // Pattern: temp/gltf-model.component.ts:196-208 (material update effect)
    effect(() => {
      if (this.group) {
        const color = this.colorOverride();
        const metal = this.metalness();
        const rough = this.roughness();
        this.applyMaterialOverrides(this.group);
      }
    });
  }

  public ngOnInit(): void {
    // Pattern: gltf-loader.service.ts:109 (load API)
    const result = this.gltfLoader.load(this.modelPath(), {
      useDraco: this.useDraco(),
    });

    // Poll for completion (pattern: inject-texture-loader.ts:105-125)
    const checkLoad = (): void => {
      const data = result.data();
      if (data && !this.group) {
        this.group = data.scene.clone(); // Clone to allow multiple instances
        this.group.position.set(...this.position());
        this.group.rotation.set(...this.rotation());
        const s = this.scale();
        const scale = typeof s === 'number' ? [s, s, s] : s;
        this.group.scale.set(...scale);

        // Add to parent (pattern: box.component.ts:94-103)
        if (this.parentFn) {
          const parent = this.parentFn();
          parent?.add(this.group);
        }

        this.applyMaterialOverrides(this.group);
      } else if (result.loading()) {
        requestAnimationFrame(checkLoad);
      }
    };
    checkLoad();
  }

  // Pattern: temp/gltf-model.component.ts:247-292 (material override traversal)
  private applyMaterialOverrides(object: THREE.Object3D): void {
    object.traverse((child) => {
      if ('material' in child && child.material) {
        const material = child.material as THREE.Material;
        if ('color' in material) {
          const pbr = material as THREE.MeshStandardMaterial;
          const color = this.colorOverride();
          if (color !== undefined) pbr.color.set(color);
          if (this.metalness() !== undefined) pbr.metalness = this.metalness()!;
          if (this.roughness() !== undefined) pbr.roughness = this.roughness()!;
          pbr.needsUpdate = true;
        }
      }
    });
  }

  public ngOnDestroy(): void {
    // Pattern: box.component.ts:106-113 (disposal)
    if (this.parentFn && this.group) {
      const parent = this.parentFn();
      parent?.remove(this.group);
    }
    // Note: Don't dispose loader cache, just remove from scene
  }
}
```

**Spec**:

- Inputs: `modelPath` (required), `position`, `rotation`, `scale`, `useDraco`, `colorOverride`, `metalness`, `roughness`
- Lifecycle: Load GLTF in `ngOnInit`, apply transforms via `effect()`, dispose in `ngOnDestroy`
- Error handling: Silently fail if parent not available (console.warn in development)

---

### Component 2: Star Field (Particle System)

#### [NEW] `libs/angular-3d/src/lib/primitives/star-field.component.ts`

**Purpose**: Efficient background star rendering using `THREE.Points`.

**Pattern Reference**:

- `box.component.ts:1-115` (component structure)
- `temp/star-field.component.ts:60-90` (particle generation with `random.inSphere`)

**Implementation**:

```typescript
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, input, computed } from '@angular/core';
import * as THREE from 'three';
import { NG_3D_PARENT } from '../types/tokens';

// Simple spherical distribution (replacing maath dependency)
function generateStarPositions(count: number, radius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * radius;
    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
}

@Component({
  selector: 'a3d-star-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class StarFieldComponent implements OnInit, OnDestroy {
  // Pattern: temp/star-field.component.ts:62-66
  public readonly starCount = input<number>(3000);
  public readonly radius = input<number>(40);
  public readonly color = input<string | number>('#ffffff');
  public readonly size = input<number>(0.02);
  public readonly opacity = input<number>(0.8);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });
  private points!: THREE.Points;
  private geometry!: THREE.BufferGeometry;
  private material!: THREE.PointsMaterial;

  // Pattern: temp/star-field.component.ts:71-77 (computed positions)
  private readonly positions = computed(() => {
    return generateStarPositions(this.starCount(), this.radius());
  });

  public ngOnInit(): void {
    // Create geometry with positions (pattern: temp/star-field.component.ts:41-44)
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions(), 3));

    // Create material (pattern: temp/star-field.component.ts:46-54)
    this.material = new THREE.PointsMaterial({
      color: this.color(),
      size: this.size(),
      sizeAttenuation: true,
      transparent: true,
      opacity: this.opacity(),
      depthWrite: false,
    });

    // Create points
    this.points = new THREE.Points(this.geometry, this.material);
    this.points.frustumCulled = false; // Stars span entire scene

    // Add to parent (pattern: box.component.ts:94-103)
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.add(this.points);
    }
  }

  public ngOnDestroy(): void {
    // Pattern: box.component.ts:106-113
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.points);
    }
    this.geometry?.dispose();
    this.material?.dispose();
  }
}
```

**Spec**:

- Inputs: `starCount`, `radius`, `color`, `size`, `opacity`
- Uses `BufferGeometry` with `PointsMaterial` for efficiency
- No dependencies on `maath` - inline sphere distribution

---

### Component 3: Planet (Textured Sphere)

#### [NEW] `libs/angular-3d/src/lib/primitives/planet.component.ts`

**Purpose**: Celestial body with optional texture and glow.

**Pattern Reference**:

- `box.component.ts:1-115` (mesh creation)
- `inject-texture-loader.ts:62-142` (reactive texture loading)
- `temp/planet.component.ts:38-177` (sphere with texture)

**Implementation**:

```typescript
import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, input, computed } from '@angular/core';
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
  public readonly position = input<[number, number, number]>([0, 0, 0]);
  public readonly radius = input<number>(6.5);
  public readonly segments = input<number>(64);

  public readonly textureUrl = input<string | null>(null);
  public readonly color = input<string | number>(0xcccccc);
  public readonly metalness = input<number>(0.3);
  public readonly roughness = input<number>(0.7);

  public readonly glowIntensity = input<number>(0);
  public readonly glowColor = input<string | number>(0xffffff);

  private readonly parentFn = inject(NG_3D_PARENT, { optional: true });

  // Pattern: inject-texture-loader.ts:62-64 (reactive texture loading)
  private readonly texture = computed(() => {
    const url = this.textureUrl();
    return url ? injectTextureLoader(() => url) : null;
  });

  private mesh!: THREE.Mesh;
  private geometry!: THREE.SphereGeometry;
  private material!: THREE.MeshStandardMaterial;
  private light?: THREE.PointLight;

  public ngOnInit(): void {
    // Pattern: box.component.ts:77-91
    this.geometry = new THREE.SphereGeometry(this.radius(), this.segments(), this.segments());

    const tex = this.texture();
    this.material = new THREE.MeshStandardMaterial({
      color: this.color(),
      map: tex?.data() ?? null,
      metalness: this.metalness(),
      roughness: this.roughness(),
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.position.set(...this.position());
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    // Glow light (pattern: temp/planet.component.ts:67-74)
    if (this.glowIntensity() > 0) {
      this.light = new THREE.PointLight(this.glowColor(), this.glowIntensity(), 15, 2);
      this.light.position.set(...this.position());
    }

    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.add(this.mesh);
      if (this.light) parent?.add(this.light);
    }
  }

  public ngOnDestroy(): void {
    if (this.parentFn) {
      const parent = this.parentFn();
      parent?.remove(this.mesh);
      if (this.light) parent?.remove(this.light);
    }
    this.geometry?.dispose();
    this.material?.dispose();
    this.light?.dispose();
  }
}
```

---

### Component 4-8: Additional Components

Following the same patterns above, implement:

#### [NEW] `libs/angular-3d/src/lib/primitives/nebula.component.ts`

- **Pattern**: `temp/nebula.component.ts:72-221` (sprite-based clouds with procedural textures)
- **Approach**: Simpler version using `THREE.Sprite` with canvas-generated cloud texture, no `maath` dependency

#### [NEW] `libs/angular-3d/src/lib/primitives/particle-system.component.ts`

- **Pattern**: `star-field.component.ts` (same structure, different distribution)
- **Approach**: Generic `THREE.Points` with customizable position distribution

#### [NEW] `libs/angular-3d/src/lib/primitives/text-3d.component.ts`

- **Pattern**: `box.component.ts` (mesh creation)
- **Three.js API**: `TextGeometry` from `three/addons/geometries/TextGeometry.js`
- **Font Loading**: `FontLoader` from `three/addons/loaders/Font Loader.js`

#### [NEW] `libs/angular-3d/src/lib/primitives/svg-icon.component.ts`

- **Pattern**: `box.component.ts` (mesh creation)
- **Three.js API**: `SVGLoader` from `three/addons/loaders/SVGLoader.js`
- **Approach**: Load SVG, extrude paths to 3D geometry

#### [NEW] `libs/angular-3d/src/lib/primitives/scene-lighting.component.ts`

- **Pattern**: Composite component that uses existing light components
- **Inputs**: `preset` ('studio' | 'outdoor' | 'dramatic'), individual light overrides
- **Approach**: Conditionally renders multiple light components based on preset

---

### Library Exports

#### [MODIFY] `libs/angular-3d/src/lib/primitives/index.ts`

**Line Range**: 1-8
**Changes**: Add exports for new components

**Pattern Reference**: `primitives/index.ts:1-8` (existing exports)

```typescript
// Existing exports...
export * from './box.component';
// ... other existing exports

// NEW: Advanced primitives
export * from './gltf-model.component';
export * from './star-field.component';
export * from './planet.component';
export * from './nebula.component';
export * from './particle-system.component';
export * from './text-3d.component';
export * from './svg-icon.component';
export * from './scene-lighting.component';
```

#### [MODIFY] `libs/angular-3d/src/index.ts`

**Line Range**: Root module exports
**Changes**: Ensure primitives barrel export is included

```typescript
export * from './lib/primitives';
```

---

## Verification Plan

### Automated Tests

#### Unit Tests - Component Creation & Disposal

```bash
# Run tests for each new component
npx nx test angular-3d --testNamePattern="GltfModelComponent"
npx nx test angular-3d --testNamePattern="StarFieldComponent"
npx nx test angular-3d --testNamePattern="PlanetComponent"
```

**Test Pattern** (based on `box.component.spec.ts`):

- Verify component creates without errors
- Verify mesh/points/group is created in `ngOnInit`
- Verify parent injection and add to scene
- Verify disposal in `ngOnDestroy`

**Test Files to Create**:

- `libs/angular-3d/src/lib/primitives/gltf-model.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/star-field.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/planet.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/nebula.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/particle-system.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/text-3d.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/svg-icon.component.spec.ts`
- `libs/angular-3d/src/lib/primitives/scene-lighting.component.spec.ts`

#### Build Verification

```bash
# Verify library builds without errors
npx nx build angular-3d

# Verify no angular-three imports
npx nx lint angular-3d
```

### Manual Verification

Since we don't have a demo app setup yet (TASK_2025_010), manual verification will be deferred to that task.

**Future Manual Tests** (to be executed in TASK_2025_010):

1. Create test scene with GLTF model component → verify model loads and displays
2. Add star-field component → verify 3000 stars render efficiently
3. Add planet component with texture → verify texture loads and glow effect works
4. Performance test: monitor FPS with multiple advanced primitives active

---

## Team-Leader Handoff

**Developer Type**: Frontend (3D Graphics)
**Complexity**: Medium-Complex
**Estimated Tasks**: 16 tasks (8 components × 2 subtasks each: implementation + tests)

**Batch Strategy**: Component-based batching

1. **Batch 1**: GLTF Model + Star Field (foundational, needed for demo)

   - `gltf-model.component.ts` + spec
   - `star-field.component.ts` + spec

2. **Batch 2**: Planet + Nebula (celestial objects)

   - `planet.component.ts` + spec
   - `nebula.component.ts` + spec

3. **Batch 3**: Text3D + SVG Icon (asset-based)

   - `text-3d.component.ts` + spec
   - `svg-icon.component.ts` + spec

4. **Batch 4**: Particle System + Scene Lighting (utilities)

   - `particle-system.component.ts` + spec
   - `scene-lighting.component.ts` + spec

5. **Batch 5**: Library Exports & Build Verification
   - Update `primitives/index.ts`
   - Update root `index.ts`
   - Run full build and lint
