# Implementation Plan - TASK_2025_036

## Marble Sphere Component Extraction

---

## Codebase Investigation Summary

### Libraries Discovered

- **@hive-academy/angular-3d** - Three.js wrapper library (`libs/angular-3d/`)
  - Key exports: Scene3dComponent, primitives, TSL shader utilities
  - Documentation: `libs/angular-3d/CLAUDE.md`

### Patterns Identified

#### 1. TSL Shader Function Pattern

**Evidence**: `libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts:351-362`

```typescript
export const tslFresnel = TSLFn(([power, intensity, bias]: [TSLNode, TSLNode, TSLNode]) => {
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const rim = float(1).sub(abs(dot(normalLocal, viewDir)));
  return bias.add(pow(rim, power).mul(intensity));
});
```

- Uses `TSLFn` wrapper for type-safe TSL functions
- Accepts TSLNode parameters
- Returns TSLNode output

#### 2. TSL Material Factory Pattern

**Evidence**: `libs/angular-3d/src/lib/primitives/shaders/tsl-textures/materials.ts:58-102`

```typescript
export const tslMarble = TSLFn((userParams: TslTextureParams = {}) => {
  const p = convertToNodes(userParams, marbleDefaults);
  // ... shader logic
  return mix(p['background'], p['color'], k);
});
```

- Uses `convertToNodes()` for parameter conversion
- Provides sensible defaults via `marbleDefaults` object
- Returns color node for material usage

#### 3. Component Structure Pattern (TSL Material)

**Evidence**: `libs/angular-3d/src/lib/primitives/metaball.component.ts:160-172`

```typescript
@Component({
  selector: 'a3d-metaball',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [{ provide: OBJECT_ID, useFactory: () => `metaball-${crypto.randomUUID()}` }],
})
export class MetaballComponent {
  public readonly preset = input<MetaballPreset>('holographic');
  // ...
  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderLoop = inject(RenderLoopService);
}
```

#### 4. Runtime TSL Access Pattern

**Evidence**: `libs/angular-3d/src/lib/primitives/metaball.component.ts:27-92`

```typescript
function getTSL() {
  const { Fn, Loop, float, vec3, ... } = TSL;
  if (!Fn || !select) {
    throw new Error('TSL functions not available...');
  }
  return { Fn, Loop, float, vec3, ... };
}
```

- Defers TSL import access to runtime
- Prevents WebGPU context race conditions
- Validates critical functions exist

#### 5. Existing Noise/Fresnel Utilities

**Evidence**: `libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts:200-362`

- `nativeFBM(position, octaves, lacunarity, diminish)` - MaterialX fractal noise
- `tslFresnel(power, intensity, bias)` - Rim lighting effect

### Reference Implementation Analysis

**Source**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/volumetric-caustics-scene.component.ts:254-354`

Key raymarching pattern extracted:

```typescript
// Raymarching parameters
const iterations = 16;
const depth = float(0.8);
const smoothingFactor = float(0.15);

// TSL Raymarching function for fake volume
const raymarchMarble = Fn(() => {
  const rayDir = normalize(positionWorld.sub(cameraPosition)).negate();
  const rayOrigin = positionLocal.normalize();
  const perIteration = float(1.0).div(float(iterations));
  const deltaRay = rayDir.mul(perIteration).mul(depth);
  const totalVolume = float(0).toVar();
  const p = vec3(rayOrigin).toVar();
  const t = time.mul(0.3);

  Loop(iterations, ({ i }) => {
    const displacement = vec3(sin(p.x.mul(5).add(t)), cos(p.y.mul(5).add(t.mul(0.7))), sin(p.z.mul(5).add(t.mul(1.2)))).mul(0.15);
    const displacedP = p.add(displacement);
    const noiseVal = nativeFBM(displacedP.mul(3), float(4), float(2.0), float(0.5)).add(1).div(2);
    const cutoff = float(1).sub(float(i).mul(perIteration));
    const slice = smoothstep(cutoff, cutoff.add(smoothingFactor), noiseVal);
    totalVolume.addAssign(slice.mul(perIteration));
    p.addAssign(deltaRay);
  });

  const volume = clamp(totalVolume, float(0), float(1));
  const marbleColor = mix(colorA, colorB, volume.pow(0.7));
  return marbleColor;
});
```

---

## Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Separate TSL shader utilities from component implementation

**Rationale**:

1. Matches existing codebase separation (tsl-utilities.ts vs component files)
2. Allows shader functions to be reused independently
3. Follows pattern established by `tslFresnel`, `nativeFBM`, etc.

**Evidence**:

- `tsl-utilities.ts` exports reusable shader functions (line 14-51)
- Components import these utilities for material composition

---

## Component Specifications

### Component 1: TSL Marble Shader Utilities

**Purpose**: Reusable TSL functions for creating animated volumetric marble interior effects with glossy fresnel edge glow.

**Pattern**: TSL Function Factory (verified from tsl-utilities.ts:351-362)
**Evidence**: Similar to `tslFresnel`, `nativeFBM`, `tslCaustics` patterns

**File to Create**: `libs/angular-3d/src/lib/primitives/shaders/tsl-marble.ts`

**Responsibilities**:

1. `tslMarbleRaymarch` - Raymarched volumetric marble interior
2. `tslGlossyFresnel` - Enhanced fresnel for glass-like edge glow
3. `createMarbleMaterial` - Convenience factory returning material nodes
4. `MarbleMaterialConfig` - TypeScript interface for configuration

**Implementation Pattern**:

````typescript
/**
 * TSL Marble Raymarching Utilities
 *
 * GPU-accelerated volumetric marble effects using Three.js Shading Language.
 * Creates animated fake volume inside a glossy glass sphere.
 *
 * @module primitives/shaders/tsl-marble
 */

import * as TSL from 'three/tsl';
import { Color, type ShaderNodeObject, type Node } from 'three/webgpu';
import { nativeFBM } from './tsl-utilities';

// TSL nodes use complex types - use generic node type for flexibility
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TSLNode = any;

// Re-export commonly used TSL functions
const { Fn, Loop, float, vec3, time, mix, smoothstep, clamp, pow, sin, cos, abs, dot, normalize, positionLocal, positionWorld, cameraPosition, normalWorld } = TSL;

// TSL Fn helper with proper typing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TSLFn = Fn as any;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for marble material creation
 */
export interface MarbleMaterialConfig {
  /** Dark interior color (default: '#001a13' dark emerald) */
  colorA?: THREE.ColorRepresentation;
  /** Bright interior color (default: '#66e5b3' bright teal-green) */
  colorB?: THREE.ColorRepresentation;
  /** Edge glow color (default: '#4cd9a8' teal) */
  edgeColor?: THREE.ColorRepresentation;
  /** Ray march iterations (8-32, default: 16) */
  iterations?: number;
  /** Ray march depth into sphere (0.5-1.0, default: 0.8) */
  depth?: number;
  /** Animation speed multiplier (default: 0.3) */
  timeScale?: number;
  /** Noise scale for FBM (default: 3.0) */
  noiseScale?: number;
  /** Slice smoothing factor (default: 0.15) */
  smoothing?: number;
  /** Fresnel power for edge effect (2-5, default: 3.0) */
  edgePower?: number;
  /** Fresnel intensity (default: 0.6) */
  edgeIntensity?: number;
}

/**
 * Default marble material configuration
 * Matches the reference implementation's emerald/teal color scheme
 */
export const MARBLE_DEFAULTS: Required<MarbleMaterialConfig> = {
  colorA: '#001a13', // Dark emerald
  colorB: '#66e5b3', // Bright teal-green
  edgeColor: '#4cd9a8', // Teal edge glow
  iterations: 16,
  depth: 0.8,
  timeScale: 0.3,
  noiseScale: 3.0,
  smoothing: 0.15,
  edgePower: 3.0,
  edgeIntensity: 0.6,
};

// ============================================================================
// Marble Raymarching Function
// ============================================================================

/**
 * TSL Marble Raymarching
 *
 * Creates animated volumetric interior effect inside a sphere.
 * Marches rays from the surface toward the center, sampling 3D noise
 * to accumulate volume that mixes between two colors.
 *
 * Based on Codrops "Magical Marbles" technique.
 *
 * @param iterations - Ray march steps (8-32). Higher = better quality, lower = better performance
 * @param depth - How deep into sphere to march (0.5-1.0)
 * @param colorA - Dark interior color (vec3)
 * @param colorB - Bright interior color (vec3)
 * @param timeScale - Animation speed multiplier
 * @param noiseScale - Scale for FBM noise sampling
 * @param smoothing - Slice smoothstep factor for softer transitions
 * @returns vec3 color node for use in material.colorNode
 *
 * @example
 * ```typescript
 * const marbleColor = tslMarbleRaymarch(
 *   float(16),                    // iterations
 *   float(0.8),                   // depth
 *   vec3(0.0, 0.2, 0.15),         // colorA (dark emerald)
 *   vec3(0.4, 0.9, 0.7),          // colorB (bright teal)
 *   float(0.3),                   // timeScale
 *   float(3.0),                   // noiseScale
 *   float(0.15)                   // smoothing
 * );
 * material.colorNode = marbleColor;
 * ```
 */
export const tslMarbleRaymarch = TSLFn(([iterations, depth, colorA, colorB, timeScale, noiseScale, smoothing]: [TSLNode, TSLNode, TSLNode, TSLNode, TSLNode, TSLNode, TSLNode]) => {
  // Ray direction from camera to surface point (inverted to go inward)
  const rayDir = normalize(positionWorld.sub(cameraPosition)).negate();

  // Start position (on sphere surface, in local space)
  const rayOrigin = positionLocal.normalize();

  // Per-iteration step size
  const perIteration = float(1.0).div(iterations);
  const deltaRay = rayDir.mul(perIteration).mul(depth);

  // Accumulate volume
  const totalVolume = float(0).toVar();
  const p = vec3(rayOrigin).toVar();

  // Time-based animation for wavy motion
  const t = time.mul(timeScale);

  // Ray march loop
  Loop(iterations, ({ i }: { i: TSLNode }) => {
    // Animated displacement using sine waves
    const displacement = vec3(sin(p.x.mul(5).add(t)), cos(p.y.mul(5).add(t.mul(0.7))), sin(p.z.mul(5).add(t.mul(1.2)))).mul(0.15);

    const displacedP = p.add(displacement);

    // Sample 3D noise at current position (acts as heightmap)
    const noiseVal = nativeFBM(displacedP.mul(noiseScale), float(4), float(2.0), float(0.5)).add(1).div(2);

    // Calculate cutoff based on iteration depth
    const cutoff = float(1).sub(float(i).mul(perIteration));

    // Take a slice with smoothstep for soft edges
    const slice = smoothstep(cutoff, cutoff.add(smoothing), noiseVal);

    // Accumulate volume
    totalVolume.addAssign(slice.mul(perIteration));

    // March ray forward
    p.addAssign(deltaRay);
  });

  // Clamp total volume to valid range
  const volume = clamp(totalVolume, float(0), float(1));

  // Mix colors based on volume with gamma curve for richness
  const marbleColor = mix(colorA, colorB, pow(volume, float(0.7)));

  return marbleColor;
});

// ============================================================================
// Glossy Fresnel Function
// ============================================================================

/**
 * TSL Glossy Fresnel Edge Glow
 *
 * Creates a rim lighting effect for glass-like appearance.
 * Enhanced fresnel specifically designed for glossy marble spheres.
 *
 * @param power - Fresnel power exponent (higher = sharper rim, 2-5 typical)
 * @param intensity - Glow intensity multiplier (0.3-1.0 typical)
 * @param color - Edge glow color (vec3)
 * @returns vec3 emissive color node for use in material.emissiveNode
 *
 * @example
 * ```typescript
 * const edgeGlow = tslGlossyFresnel(
 *   float(3.0),           // power
 *   float(0.6),           // intensity
 *   vec3(0.3, 0.8, 0.7)   // teal color
 * );
 * material.emissiveNode = edgeGlow;
 * ```
 */
export const tslGlossyFresnel = TSLFn(([power, intensity, color]: [TSLNode, TSLNode, TSLNode]) => {
  // View direction from surface to camera
  const viewDir = normalize(cameraPosition.sub(positionWorld));

  // Rim is strongest when view direction is perpendicular to normal
  const rim = float(1).sub(abs(dot(normalWorld, viewDir)));

  // Apply power curve for sharper falloff
  const fresnelValue = pow(rim, power);

  // Return colored glow
  return color.mul(fresnelValue).mul(intensity);
});

// ============================================================================
// Material Factory Function
// ============================================================================

/**
 * Create Marble Material Nodes
 *
 * Convenience factory that creates pre-configured TSL nodes for a marble material.
 * Returns both colorNode and emissiveNode ready for MeshStandardNodeMaterial.
 *
 * @param config - Optional configuration overrides
 * @returns Object with colorNode, emissiveNode, and recommended material settings
 *
 * @example
 * ```typescript
 * const marble = createMarbleMaterial({
 *   colorA: '#001a13',
 *   colorB: '#66e5b3',
 *   edgeColor: '#4cd9a8',
 *   iterations: 16,
 * });
 *
 * const material = new THREE.MeshStandardNodeMaterial({
 *   metalness: marble.metalness,
 *   roughness: marble.roughness,
 * });
 * material.colorNode = marble.colorNode;
 * material.emissiveNode = marble.emissiveNode;
 * ```
 */
export function createMarbleMaterial(config: MarbleMaterialConfig = {}): {
  colorNode: ShaderNodeObject<Node>;
  emissiveNode: ShaderNodeObject<Node>;
  roughness: number;
  metalness: number;
} {
  // Merge with defaults
  const cfg = { ...MARBLE_DEFAULTS, ...config };

  // Convert colors to THREE.Color then to vec3
  const colorAVal = new Color(cfg.colorA);
  const colorBVal = new Color(cfg.colorB);
  const edgeColorVal = new Color(cfg.edgeColor);

  // Create color nodes
  const colorANode = vec3(colorAVal.r, colorAVal.g, colorAVal.b);
  const colorBNode = vec3(colorBVal.r, colorBVal.g, colorBVal.b);
  const edgeColorNode = vec3(edgeColorVal.r, edgeColorVal.g, edgeColorVal.b);

  // Create raymarched interior color
  const colorNode = tslMarbleRaymarch(float(cfg.iterations), float(cfg.depth), colorANode, colorBNode, float(cfg.timeScale), float(cfg.noiseScale), float(cfg.smoothing));

  // Create fresnel edge glow
  const emissiveNode = tslGlossyFresnel(float(cfg.edgePower), float(cfg.edgeIntensity), edgeColorNode);

  return {
    colorNode,
    emissiveNode,
    roughness: 0.1, // Low roughness for glossy reflections
    metalness: 0.0, // Non-metallic for correct fresnel behavior
  };
}
````

**Quality Requirements**:

- Functions must work with WebGPU renderer (MeshStandardNodeMaterial)
- Must use existing `nativeFBM` from tsl-utilities.ts (verified at line 200)
- Must follow TSLFn pattern (verified at tsl-utilities.ts:351)
- Must support configurable parameters for flexibility
- Must have TypeScript types for all public APIs

**Files Affected**:

- `libs/angular-3d/src/lib/primitives/shaders/tsl-marble.ts` (CREATE)
- `libs/angular-3d/src/lib/primitives/shaders/index.ts` (MODIFY - add exports)

---

### Component 2: MarbleSphereComponent

**Purpose**: Declarative Angular component wrapping the marble shader effect with signal-based inputs.

**Pattern**: TSL Material Component (verified from metaball.component.ts:160-451)
**Evidence**: Similar structure to MetaballComponent with TSL material integration

**File to Create**: `libs/angular-3d/src/lib/primitives/marble-sphere.component.ts`

**Responsibilities**:

1. Create SphereGeometry with configurable radius and segments
2. Apply MeshStandardNodeMaterial with marble shader nodes
3. Handle environment map reflections automatically
4. Clean up resources on destroy via DestroyRef

**Implementation Pattern**:

````typescript
/**
 * MarbleSphereComponent - Animated Volumetric Marble Sphere
 *
 * Creates a glossy sphere with animated volumetric interior using TSL raymarching.
 * Based on the Codrops "Magical Marbles" technique.
 *
 * Features:
 * - Raymarched fake volume inside sphere
 * - Configurable interior colors (gradient from dark to bright)
 * - Glossy fresnel edge glow
 * - Environment map reflections (uses scene.environment)
 * - Signal-based reactive inputs
 *
 * @example
 * ```html
 * <a3d-marble-sphere
 *   [radius]="0.2"
 *   [position]="[0, 0.25, 0]"
 *   [colorA]="'#001a13'"
 *   [colorB]="'#66e5b3'"
 *   [edgeColor]="'#4cd9a8'"
 *   [animationSpeed]="0.3"
 *   [iterations]="16"
 * />
 * ```
 */
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input } from '@angular/core';
import * as THREE from 'three/webgpu';

import { OBJECT_ID } from '../tokens/object-id.token';
import { NG_3D_PARENT } from '../types/tokens';
import { createMarbleMaterial, type MarbleMaterialConfig } from './shaders/tsl-marble';

@Component({
  selector: 'a3d-marble-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  providers: [
    {
      provide: OBJECT_ID,
      useFactory: () => `marble-sphere-${crypto.randomUUID()}`,
    },
  ],
})
export class MarbleSphereComponent {
  // ============================================================================
  // Geometry Inputs
  // ============================================================================

  /** Sphere radius (default: 0.2) */
  public readonly radius = input<number>(0.2);

  /** Geometry segments for smooth curvature (default: 64) */
  public readonly segments = input<number>(64);

  /** World position as [x, y, z] tuple */
  public readonly position = input<[number, number, number]>([0, 0, 0]);

  // ============================================================================
  // Material Inputs
  // ============================================================================

  /** Outer shell roughness (0 = mirror, 1 = matte, default: 0.1 for glossy) */
  public readonly roughness = input<number>(0.1);

  /** Outer shell metalness (default: 0.0) */
  public readonly metalness = input<number>(0.0);

  // ============================================================================
  // Interior Color Inputs
  // ============================================================================

  /** Dark interior color (default: '#001a13' dark emerald) */
  public readonly colorA = input<string | number>('#001a13');

  /** Bright interior color (default: '#66e5b3' bright teal-green) */
  public readonly colorB = input<string | number>('#66e5b3');

  // ============================================================================
  // Edge Glow Inputs
  // ============================================================================

  /** Edge glow/fresnel color (default: '#4cd9a8' teal) */
  public readonly edgeColor = input<string | number>('#4cd9a8');

  /** Edge glow intensity (default: 0.6) */
  public readonly edgeIntensity = input<number>(0.6);

  /** Edge glow fresnel power (2-5, default: 3.0) */
  public readonly edgePower = input<number>(3.0);

  // ============================================================================
  // Animation Inputs
  // ============================================================================

  /** Interior animation speed multiplier (default: 0.3) */
  public readonly animationSpeed = input<number>(0.3);

  // ============================================================================
  // Quality Inputs
  // ============================================================================

  /** Ray march iterations (8=mobile, 16=default, 32=high) */
  public readonly iterations = input<number>(16);

  /** Ray march depth into sphere (0.5-1.0, default: 0.8) */
  public readonly depth = input<number>(0.8);

  // ============================================================================
  // Shadow Inputs
  // ============================================================================

  /** Whether mesh casts shadows (default: true) */
  public readonly castShadow = input<boolean>(true);

  /** Whether mesh receives shadows (default: true) */
  public readonly receiveShadow = input<boolean>(true);

  // ============================================================================
  // Internal State
  // ============================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly destroyRef = inject(DestroyRef);

  private mesh: THREE.Mesh | null = null;
  private geometry: THREE.SphereGeometry | null = null;
  private material: THREE.MeshStandardNodeMaterial | null = null;
  private isAddedToScene = false;

  constructor() {
    // Effect: Create mesh and add to parent when parent becomes available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.isAddedToScene) {
        this.createMesh();
        if (this.mesh) {
          parent.add(this.mesh);
          this.isAddedToScene = true;
        }
      }
    });

    // Effect: Update position when it changes
    effect(() => {
      const [x, y, z] = this.position();
      if (this.mesh) {
        this.mesh.position.set(x, y, z);
      }
    });

    // Effect: Update shadow settings when they change
    effect(() => {
      const castShadow = this.castShadow();
      const receiveShadow = this.receiveShadow();
      if (this.mesh) {
        this.mesh.castShadow = castShadow;
        this.mesh.receiveShadow = receiveShadow;
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      const parent = this.parent();
      if (parent && this.mesh && this.isAddedToScene) {
        parent.remove(this.mesh);
      }
      this.disposeMesh();
      this.isAddedToScene = false;
    });
  }

  /**
   * Create the marble sphere mesh with TSL material
   */
  private createMesh(): void {
    // Create geometry
    const radius = this.radius();
    const segments = this.segments();
    this.geometry = new THREE.SphereGeometry(radius, segments, segments);

    // Create material config from inputs
    const config: MarbleMaterialConfig = {
      colorA: this.colorA(),
      colorB: this.colorB(),
      edgeColor: this.edgeColor(),
      iterations: this.iterations(),
      depth: this.depth(),
      timeScale: this.animationSpeed(),
      edgePower: this.edgePower(),
      edgeIntensity: this.edgeIntensity(),
    };

    // Create marble material nodes
    const marble = createMarbleMaterial(config);

    // Create MeshStandardNodeMaterial with TSL nodes
    this.material = new THREE.MeshStandardNodeMaterial({
      metalness: this.metalness(),
      roughness: this.roughness(),
    });
    this.material.colorNode = marble.colorNode;
    this.material.emissiveNode = marble.emissiveNode;

    // Create mesh
    this.mesh = new THREE.Mesh(this.geometry, this.material);

    // Set position
    const [x, y, z] = this.position();
    this.mesh.position.set(x, y, z);

    // Set shadow properties
    this.mesh.castShadow = this.castShadow();
    this.mesh.receiveShadow = this.receiveShadow();
  }

  /**
   * Dispose Three.js resources
   */
  private disposeMesh(): void {
    if (this.geometry) {
      this.geometry.dispose();
      this.geometry = null;
    }
    if (this.material) {
      this.material.dispose();
      this.material = null;
    }
    this.mesh = null;
  }
}
````

**Quality Requirements**:

- Must use NG_3D_PARENT token (verified at metaball.component.ts:219)
- Must use DestroyRef for cleanup (verified at metaball.component.ts:220)
- Must use signal-based inputs (verified at metaball.component.ts:174-216)
- Must dispose geometry and material on destroy
- Must support environment map reflections via low roughness

**Files Affected**:

- `libs/angular-3d/src/lib/primitives/marble-sphere.component.ts` (CREATE)
- `libs/angular-3d/src/lib/primitives/index.ts` (MODIFY - add export)

---

### Component 3: Marble Hero Example Scene

**Purpose**: Refactor the existing volumetric-caustics-scene to demonstrate `<a3d-marble-sphere>` usage with HTML overlay pattern.

**Pattern**: Demo Scene Component (verified from volumetric-caustics-scene.component.ts:512-544)
**Evidence**: Parent/child component pattern with Scene3dComponent

**File to Modify**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/volumetric-caustics-scene.component.ts`

**Changes**:

1. Rename file to `marble-hero-scene.component.ts`
2. Rename component selectors and classes
3. Replace inline raymarching code with `<a3d-marble-sphere>`
4. Add HTML overlay section demonstrating hero pattern
5. Keep caustics ground as optional enhancement
6. Simplify by removing volumetric fog (optional complexity)

**Implementation Pattern**:

```typescript
/**
 * Marble Hero Scene - Example Hero Section with 3D Background
 *
 * Demonstrates how to combine <a3d-marble-sphere> with HTML overlays
 * for a hero section with 3D background.
 *
 * Key patterns demonstrated:
 * 1. Using MarbleSphereComponent for animated marble effect
 * 2. Layering HTML content above 3D canvas
 * 3. Auto-rotating orbit controls for ambient movement
 * 4. Simple lighting setup for glossy materials
 */
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { OrbitControlsComponent, PointLightComponent, Scene3dComponent, SpotLightComponent, MarbleSphereComponent } from '@hive-academy/angular-3d';

/**
 * Content Component - Contains 3D elements and HTML overlay
 */
@Component({
  selector: 'app-marble-hero-content',
  standalone: true,
  imports: [SpotLightComponent, PointLightComponent, OrbitControlsComponent, MarbleSphereComponent],
  template: `
    <!-- Marble sphere with default emerald/teal colors -->
    <a3d-marble-sphere [radius]="0.2" [position]="[0, 0.25, 0]" [colorA]="'#001a13'" [colorB]="'#66e5b3'" [edgeColor]="'#4cd9a8'" [animationSpeed]="0.3" [iterations]="16" />

    <!-- Main spotlight for volumetric feel -->
    <a3d-spot-light [position]="[0.5, 0.7, 0.5]" [angle]="Math.PI / 4" [penumbra]="0.9" [decay]="2" [distance]="3" [intensity]="4" [castShadow]="true" [color]="0xffffff" />

    <!-- Teal accent light -->
    <a3d-point-light [position]="[0.5, 0.3, 0.3]" [color]="0x00897b" [intensity]="2" [distance]="2" />

    <!-- Cool backlight -->
    <a3d-point-light [position]="[-0.5, 0.2, -0.3]" [color]="0x26a69a" [intensity]="1" [distance]="2" />

    <!-- Auto-rotating orbit controls -->
    <a3d-orbit-controls [target]="[0, 0.25, 0]" [maxDistance]="1.5" [minDistance]="0.4" [autoRotate]="true" [autoRotateSpeed]="0.6" [enableDamping]="true" />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarbleHeroContentComponent {
  protected readonly Math = Math;
}

/**
 * Parent Container with HTML Overlay
 */
@Component({
  selector: 'app-marble-hero-scene',
  standalone: true,
  imports: [Scene3dComponent, MarbleHeroContentComponent],
  template: `
    <div class="hero-container">
      <!-- 3D Scene Background -->
      <a3d-scene-3d [cameraPosition]="[0, 0.35, 0.7]" [cameraNear]="0.025" [cameraFar]="5" [frameloop]="'always'" [backgroundColor]="0x0a1a15" [enableShadows]="true">
        <app-marble-hero-content />
      </a3d-scene-3d>

      <!-- HTML Overlay Content -->
      <div class="hero-overlay">
        <h1 class="hero-title">Magical Marble</h1>
        <p class="hero-subtitle">Raymarched volumetric interior with glossy glass shell</p>
        <div class="hero-cta">
          <button class="cta-button">Get Started</button>
          <button class="cta-button secondary">Learn More</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 85vh;
        min-height: 500px;
        position: relative;
      }

      .hero-container {
        position: relative;
        width: 100%;
        height: 100%;
      }

      a3d-scene-3d {
        position: absolute;
        inset: 0;
        z-index: 0;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        z-index: 10;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        pointer-events: none;
        text-align: center;
      }

      .hero-title {
        font-size: clamp(2.5rem, 8vw, 5rem);
        font-weight: 700;
        color: white;
        margin: 0 0 1rem;
        text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
      }

      .hero-subtitle {
        font-size: clamp(1rem, 3vw, 1.5rem);
        color: rgba(255, 255, 255, 0.8);
        margin: 0 0 2rem;
        max-width: 600px;
        text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
      }

      .hero-cta {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        justify-content: center;
        pointer-events: auto;
      }

      .cta-button {
        padding: 0.875rem 2rem;
        font-size: 1rem;
        font-weight: 600;
        border: none;
        border-radius: 9999px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
        background: linear-gradient(135deg, #4cd9a8, #26a69a);
        color: white;
      }

      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(76, 217, 168, 0.4);
      }

      .cta-button.secondary {
        background: transparent;
        border: 2px solid rgba(255, 255, 255, 0.5);
        color: white;
      }

      .cta-button.secondary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: white;
        box-shadow: 0 8px 24px rgba(255, 255, 255, 0.2);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MarbleHeroSceneComponent {}
```

**Quality Requirements**:

- Must use new `<a3d-marble-sphere>` component (not inline shader code)
- Must demonstrate HTML overlay pattern with proper z-index layering
- Must maintain current visual quality (glossy reflections, animated interior)
- Must keep orbit controls with auto-rotate for ambient movement

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/volumetric-caustics-scene.component.ts` (RENAME to `marble-hero-scene.component.ts`, REWRITE)
- `apps/angular-3d-demo/src/app/app.routes.ts` (MODIFY - update route if needed)

---

## Integration Architecture

### Integration Points

**1. TSL Shader Utilities to Component Integration**

- Pattern: Import factory function from shader module
- Evidence: `metaball.component.ts` imports utilities at line 58-59
- Connection: `createMarbleMaterial()` returns nodes for component material

**2. Component to Scene Integration**

- Pattern: NG_3D_PARENT token injection
- Evidence: `metaball.component.ts:219`
- Connection: Component injects parent, adds mesh to parent's THREE.Object3D

**3. Demo Scene to Library Integration**

- Pattern: Import component from library public API
- Evidence: `volumetric-caustics-scene.component.ts:53-60`
- Connection: Import `MarbleSphereComponent` from `@hive-academy/angular-3d`

### Data Flow

```
User Component Input → Signal → createMarbleMaterial() → TSL Nodes → Material → Mesh → Scene
                                      ↓
                               tslMarbleRaymarch() → colorNode
                               tslGlossyFresnel() → emissiveNode
```

### Dependencies

**External**:

- `three/webgpu` - MeshStandardNodeMaterial, SphereGeometry
- `three/tsl` - TSL node functions (Fn, Loop, vec3, etc.)

**Internal**:

- `nativeFBM` from `./tsl-utilities` (verified at line 200)
- `NG_3D_PARENT` token from `../types/tokens`
- `OBJECT_ID` token from `../tokens/object-id.token`

---

## Quality Requirements (Architecture-Level)

### Functional Requirements

1. **MarbleSphereComponent renders identical effect to reference**

   - Animated volumetric interior with two-color gradient
   - Glossy fresnel edge glow
   - Low roughness for environment reflections

2. **Component works in any scene with minimal config**

   - Default values produce good-looking result
   - All customization is optional

3. **Shader utilities are reusable independently**
   - `tslMarbleRaymarch` can be used without component
   - `tslGlossyFresnel` can be used for other effects

### Non-Functional Requirements

**Performance**:

- 60fps on desktop (16 iterations default)
- 30fps on mobile with reduced iterations (8 iterations)
- Material compilation happens once at creation

**Maintainability**:

- TypeScript types for all public APIs
- JSDoc documentation on all exports
- Follows established codebase patterns

**Type Safety**:

- No `any` in public API (only internal TSLNode type)
- Proper `THREE.ColorRepresentation` for color inputs
- Signal types for component inputs

### Pattern Compliance

**Must Follow**:

1. TSLFn wrapper pattern (verified: tsl-utilities.ts:351)
2. NG_3D_PARENT injection pattern (verified: metaball.component.ts:219)
3. DestroyRef cleanup pattern (verified: metaball.component.ts:428-450)
4. Signal-based inputs pattern (verified: metaball.component.ts:174-216)
5. OBJECT_ID provider pattern (verified: metaball.component.ts:166-169)

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

- TSL shader code is frontend (WebGPU/GPU programming)
- Angular component development
- No backend/NestJS involvement
- Browser-specific APIs (WebGPU, requestAnimationFrame)

### Complexity Assessment

**Complexity**: MEDIUM
**Estimated Effort**: 4-6 hours

**Breakdown**:

- TSL shader utilities (tsl-marble.ts): 1.5-2 hours
- MarbleSphereComponent: 1.5-2 hours
- Hero scene refactor: 1-2 hours

### Files Affected Summary

**CREATE**:

- `libs/angular-3d/src/lib/primitives/shaders/tsl-marble.ts`
- `libs/angular-3d/src/lib/primitives/marble-sphere.component.ts`

**MODIFY**:

- `libs/angular-3d/src/lib/primitives/shaders/index.ts` (add exports)
- `libs/angular-3d/src/lib/primitives/index.ts` (add component export)

**RENAME + REWRITE**:

- `volumetric-caustics-scene.component.ts` -> `marble-hero-scene.component.ts`

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **All imports exist in codebase**:

   - `nativeFBM` from `./tsl-utilities` (line 200)
   - `NG_3D_PARENT` from `../types/tokens`
   - `OBJECT_ID` from `../tokens/object-id.token`
   - `DestroyRef` from `@angular/core`

2. **All patterns verified from examples**:

   - TSLFn pattern: tsl-utilities.ts:351-362
   - Component pattern: metaball.component.ts:160-451
   - Signal inputs: metaball.component.ts:174-216
   - Cleanup: metaball.component.ts:428-450

3. **Library documentation consulted**:

   - `libs/angular-3d/CLAUDE.md`
   - `apps/angular-3d-demo/CLAUDE.md`

4. **No hallucinated APIs**:
   - All TSL functions verified in three/tsl exports
   - All THREE classes verified in three/webgpu exports
   - All Angular APIs verified in @angular/core

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended
- [x] Complexity assessed
- [x] No step-by-step implementation (that's team-leader's job)
