# Task Context - TASK_2025_032

## Task Information

| Field     | Value                            |
| --------- | -------------------------------- |
| Task ID   | TASK_2025_032                    |
| Created   | 2025-12-29                       |
| Type      | FEATURE (New Library Capability) |
| Priority  | P1 - High (Library Enhancement)  |
| Requestor | User                             |

---

## User Intent

Implement native TSL procedural texture generators in the `@hive-academy/angular-3d` library, using the [tsl-textures](https://github.com/boytchev/tsl-textures) library as a reference implementation. These GPU-powered textures enable real-time procedural materials without pre-baked texture files.

---

## Problem Statement

### Current State

- Library has basic TSL utilities (`tsl-utilities.ts`) with noise, fresnel, fog effects
- Library has TSL raymarching (`tsl-raymarching.ts`) with SDF primitives
- No procedural texture generators for common materials (marble, wood, rust, etc.)
- No pattern generators (polka dots, grids, voronoi cells)
- No shape deformers (supersphere, melter, rotator)

### Desired State

- Rich collection of procedural texture generators as Angular components/utilities
- Signal-based inputs for reactive texture parameters
- TypeScript-first API with full type safety
- Compatible with existing `MeshStandardNodeMaterial` usage pattern
- Works on both WebGPU (WGSL) and WebGL (GLSL) via TSL auto-transpilation

---

## Reference Implementation

### tsl-textures Library

**Repository**: https://github.com/boytchev/tsl-textures  
**NPM**: https://www.npmjs.com/package/tsl-textures  
**Demo**: https://boytchev.github.io/tsl-textures/

### Available Textures (50+)

#### Natural Materials

- `marble` - Realistic veined marble patterns
- `wood` / `processed-wood` - Wood grain textures
- `concrete` - Rough concrete surface
- `rust` - Oxidation/corrosion effect
- `cork` - Cork board texture
- `rough-clay` - Sculpted clay look
- `karst-rock` - Weathered rock formations
- `satin` - Silky fabric effect
- `crumpled-fabric` - Wrinkled cloth

#### Organic/Biological

- `brain` - Brain-like folded pattern
- `protozoa` - Microorganism floating in blob
- `reticular-veins` - Vein network patterns
- `dalmatian-spots` - Random spot patterns
- `tiger-fur` / `zebra-lines` - Animal patterns

#### Space/Sci-Fi

- `planet` - Procedural planet surfaces
- `gas-giant` - Jupiter-like banded clouds
- `stars` - Starfield background
- `photosphere` - Sun surface texture
- `dyson-sphere` - Sci-fi tech pattern

#### Effects/Patterns

- `caustics` - Underwater light patterns
- `water-drops` - Droplets on glass
- `polka-dots` - Repeating dot patterns
- `grid` - Tech/hologram grids
- `circles` / `circle-decor` - Decorative circles
- `bricks` - Wall brick patterns
- `isolines` / `isolayers` - Contour map effects
- `voronoi-cells` - Cell-like structures
- `neon-lights` - Glowing neon tubes
- `camouflage` - Military camo patterns

#### Shape Modifiers (Vertex Deformers)

- `supersphere` - Deforms mesh into superspheres
- `melter` - Melting/dripping effect
- `rotator` - Soft-body rotation (skin/muscles)
- `scaler` / `translator` - Shape morphing

---

## Existing Infrastructure

| Component       | Location                                                        | Status       |
| --------------- | --------------------------------------------------------------- | ------------ |
| TSL Utilities   | `libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts`   | ✅ 475 lines |
| TSL Raymarching | `libs/angular-3d/src/lib/primitives/shaders/tsl-raymarching.ts` | ✅ 436 lines |
| MaterialX Noise | `mx_noise_float`, `mx_fractal_noise`                            | ✅ Imported  |
| Node Materials  | `MeshStandardNodeMaterial`, `MeshBasicNodeMaterial`             | ✅ In use    |
| TSL Type Defs   | `libs/angular-3d/src/lib/types/three-tsl-addons.d.ts`           | ✅ Available |

---

## Technical Approach

### Implementation Pattern

```typescript
// 1. TSL Function (in tsl-textures.ts)
export const tslMarble = TSLFn(([scale, thinness, noise, color, background, seed]) => {
  const pos = positionGeometry.mul(exp(scale)).add(seed).toVar();
  // ... noise calculations ...
  return mix(background, color, k);
});

// 2. Angular Component Wrapper (optional)
@Component({ selector: 'lib-marble-texture' })
export class MarbleTextureComponent {
  readonly scale = input(1.2);
  readonly thinness = input(5);
  readonly color = input('#4545D3');
  readonly background = input('#F0F8FF');

  readonly textureNode = computed(() =>
    tslMarble(
      float(this.scale()),
      float(this.thinness())
      // ...
    )
  );
}
```

### Key Utilities from tsl-textures to Port

1. **`tsl-utils.js`** core functions:

   - `hsl()` / `toHsl()` - HSL color conversions
   - `spherical()` - Angle to sphere point conversion
   - `applyEuler()` - Euler rotation application
   - `matRotX/Y/Z()` - Rotation matrices
   - `vnoise()` - Simple vector noise
   - `convertToNodes()` - Parameter conversion helper

2. **Noise functions**:
   - Already have `mx_noise_float` - matches tsl-textures usage
   - May need additional noise variants

---

## Success Criteria

1. **Core Textures Implemented** (minimum 10 priority textures)
2. **Angular-Native API** with Signal inputs
3. **TypeScript Types** for all texture parameters
4. **Demo Showcase** demonstrating each texture
5. **Documentation** with usage examples
6. **Unit Tests** for texture functions

---

## Dependencies

- **TASK_2025_031** (WebGPU TSL Migration) - Should complete first to ensure stable TSL infrastructure
- Existing TSL utilities in `tsl-utilities.ts`
- Three.js WebGPU renderer with TSL support

---

## Out of Scope

- Video generation tools from tsl-textures
- Equirectangular texture baking
- Non-Angular pure JavaScript usage

---

## Related Documents

- tsl-textures GitHub: https://github.com/boytchev/tsl-textures
- Three.js TSL Wiki: https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
- Existing `tsl-utilities.ts` and `tsl-raymarching.ts`
