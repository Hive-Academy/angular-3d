# Requirements Document - TASK_2025_036 (Revised)

## Introduction

Extract the "Magical Marble" raymarching effect from `volumetric-caustics-scene.component.ts` into reusable angular-3d library components, and refactor the demo scene into a hero section example with HTML overlay.

**Business Value**: Developers using @hive-academy/angular-3d will gain access to a production-ready, configurable marble/orb effect for hero sections without needing deep TSL shader knowledge.

---

## Scope (Revised)

### In Scope

1. **TSL Marble Shader Utilities** - Extract raymarching logic to reusable functions
2. **MarbleSphereComponent** - Declarative component wrapping the effect
3. **Hero Example Scene** - Refactor demo scene to show HTML overlay pattern

### Out of Scope (Based on Existing Library Analysis)

- ~~CausticsGroundComponent~~ - User removed from scope
- ~~ProceduralEnvironmentService~~ - Use existing `EnvironmentComponent`
- ~~VolumetricFogComponent~~ - `NebulaVolumetricComponent` already handles volumetric
- ~~HeroSceneComponent~~ - Demo example serves as reference instead

### Existing Assets to Reuse

| Asset                  | Location                  | Purpose                            |
| ---------------------- | ------------------------- | ---------------------------------- |
| `tslFresnel()`         | tsl-utilities.ts          | Rim lighting (may extend or reuse) |
| `nativeFBM()`          | tsl-utilities.ts          | 3D noise for interior volume       |
| `EnvironmentComponent` | primitives/               | Environment map loading            |
| `tslMarble()`          | tsl-textures/materials.ts | Reference for naming conventions   |

---

## Requirements

### Requirement 1: Marble Shader Utilities (TSL)

**User Story:** As a developer, I want reusable TSL marble shader utilities so that I can apply glossy marble/orb effects to any sphere geometry.

#### Acceptance Criteria

1. WHEN `tslMarbleRaymarch` is called with colors and animation parameters THEN it SHALL return a TSL color node for animated volumetric interior
2. WHEN `iterations` parameter is provided THEN it SHALL control ray marching quality (default: 16, range: 8-32)
3. WHEN `depth` parameter is provided THEN it SHALL control volumetric depth (default: 0.8)
4. WHEN `timeScale` parameter is provided THEN it SHALL control animation speed
5. WHEN no parameters are provided THEN it SHALL use sensible defaults matching reference
6. WHEN `tslGlossyFresnel` is called THEN it SHALL return edge glow effect for glass appearance

#### Technical Scope

**File to Create:**

- `libs/angular-3d/src/lib/primitives/shaders/tsl-marble.ts`

**Functions:**

```typescript
// Raymarching for volumetric marble interior
export const tslMarbleRaymarch = Fn(([
  iterations,  // ray march steps (8-32)
  depth,       // ray march depth (0.5-1.0)
  colorA,      // dark interior color
  colorB,      // bright interior color
  timeScale,   // animation speed
  noiseScale,  // FBM noise scale
  smoothing    // slice smoothing factor
]) => { ... });

// Fresnel edge glow for glass effect
export const tslGlossyFresnel = Fn(([
  power,       // fresnel power (2-5)
  intensity,   // glow intensity
  color        // edge glow color
]) => { ... });

// Convenience config wrapper
export interface MarbleMaterialConfig {
  colorA?: THREE.ColorRepresentation;
  colorB?: THREE.ColorRepresentation;
  edgeColor?: THREE.ColorRepresentation;
  iterations?: number;
  depth?: number;
  timeScale?: number;
  edgePower?: number;
  edgeIntensity?: number;
}

export function createMarbleMaterial(config?: MarbleMaterialConfig): {
  colorNode: ShaderNodeObject<Node>;
  emissiveNode: ShaderNodeObject<Node>;
  roughness: number;
  metalness: number;
};
```

---

### Requirement 2: Marble Sphere Component

**User Story:** As a developer, I want a declarative `<a3d-marble-sphere>` component so that I can add animated marble orbs to my scenes without writing shader code.

#### Acceptance Criteria

1. WHEN `<a3d-marble-sphere>` is rendered THEN it SHALL display a glossy sphere with animated volumetric interior
2. WHEN `[radius]` input is provided THEN it SHALL create a sphere of that size (default: 0.2)
3. WHEN `[position]` input is provided THEN it SHALL position the sphere at those coordinates
4. WHEN `[colorA]` and `[colorB]` inputs are provided THEN it SHALL use those as interior gradient
5. WHEN `[edgeColor]` input is provided THEN it SHALL use that for Fresnel glow
6. WHEN `[roughness]` input is provided THEN it SHALL apply to outer shell (default: 0.1)
7. WHEN `[animationSpeed]` input is provided THEN it SHALL control interior animation rate
8. WHEN `[iterations]` input is provided THEN it SHALL control quality (8=mobile, 16=default)
9. WHEN environment map exists in scene THEN it SHALL reflect on glossy shell
10. WHEN component is destroyed THEN it SHALL dispose geometry and material

#### Component API

```typescript
@Component({
  selector: 'a3d-marble-sphere',
  standalone: true,
})
export class MarbleSphereComponent {
  // Geometry
  readonly radius = input<number>(0.2);
  readonly segments = input<number>(64);
  readonly position = input<[number, number, number]>([0, 0, 0]);

  // Material
  readonly roughness = input<number>(0.1);
  readonly metalness = input<number>(0.0);

  // Interior colors
  readonly colorA = input<string | number>('#001a13');
  readonly colorB = input<string | number>('#66e5b3');

  // Edge glow
  readonly edgeColor = input<string | number>('#4cd9a8');
  readonly edgeIntensity = input<number>(0.6);
  readonly edgePower = input<number>(3.0);

  // Animation
  readonly animationSpeed = input<number>(0.3);

  // Quality
  readonly iterations = input<number>(16);
  readonly depth = input<number>(0.8);

  // Shadows
  readonly castShadow = input<boolean>(true);
  readonly receiveShadow = input<boolean>(true);
}
```

**File to Create:**

- `libs/angular-3d/src/lib/primitives/marble-sphere.component.ts`

**Pattern Reference:**

- Follow `floating-sphere.component.ts` for component structure
- Follow `metaball.component.ts` for TSL material integration

---

### Requirement 3: Marble Hero Example Scene

**User Story:** As a developer, I want a reference hero scene implementation so that I can learn how to combine marble effects with HTML overlays.

#### Acceptance Criteria

1. WHEN scene is rendered THEN it SHALL display marble sphere with HTML content overlay
2. WHEN HTML overlay is rendered THEN it SHALL be positioned above 3D canvas
3. WHEN scene includes orbit controls THEN it SHALL auto-rotate by default
4. WHEN scene is used as hero THEN it SHALL fill viewport height appropriately
5. WHEN example is reviewed THEN it SHALL demonstrate best practices for hero sections

#### Implementation

**File to Modify:**

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/volumetric-caustics-scene.component.ts`
  - Rename to `marble-hero-scene.component.ts`
  - Replace inline shader code with `<a3d-marble-sphere>`
  - Add HTML overlay section with example content
  - Keep volumetric fog as optional enhancement (or remove for simplicity)

**Example Structure:**

```html
<div class="hero-container">
  <a3d-scene-3d [cameraPosition]="[0, 0.35, 0.7]" [backgroundColor]="0x0a1a15">
    <a3d-marble-sphere [colorA]="'#001a13'" [colorB]="'#66e5b3'" [edgeColor]="'#4cd9a8'" [position]="[0, 0.25, 0]" />
    <a3d-spot-light [position]="[0.5, 0.7, 0.5]" ... />
    <a3d-orbit-controls [autoRotate]="true" [autoRotateSpeed]="0.6" />
  </a3d-scene-3d>

  <div class="hero-overlay">
    <h1>Your Headline Here</h1>
    <p>Supporting text for the hero section</p>
  </div>
</div>
```

---

## Technical Constraints

### Shader Architecture

1. **TSL Only**: Use Three.js Shading Language, not raw GLSL
2. **Fn() Pattern**: Use `Fn()` wrapper for reusable shader functions
3. **MaterialX Noise**: Use `nativeFBM` from existing utilities

### Component Architecture

1. **Standalone Components**: No NgModules
2. **Signal Inputs**: Use `input()` signal-based inputs
3. **NG_3D_PARENT Token**: Use parent injection for hierarchy
4. **DestroyRef Cleanup**: Use `DestroyRef` for disposal

---

## Files Summary

### To Create (Library)

| File                                                            | Purpose                 |
| --------------------------------------------------------------- | ----------------------- |
| `libs/angular-3d/src/lib/primitives/shaders/tsl-marble.ts`      | Marble shader utilities |
| `libs/angular-3d/src/lib/primitives/marble-sphere.component.ts` | Marble sphere component |

### To Modify (Demo)

| File                                                  | Change                            |
| ----------------------------------------------------- | --------------------------------- |
| `volumetric-caustics-scene.component.ts`              | Rename & refactor to hero example |
| `libs/angular-3d/src/lib/primitives/shaders/index.ts` | Export new utilities              |
| `libs/angular-3d/src/index.ts`                        | Export new component              |

---

## Success Criteria

1. **Functionality**: MarbleSphereComponent renders identical to original scene
2. **Reusability**: Component works in any scene with minimal config
3. **Example Quality**: Hero example demonstrates HTML overlay pattern
4. **Performance**: 60fps on desktop, 30fps on mobile
5. **Type Safety**: Full TypeScript types, no `any` in public API
