# Implementation Plan - TASK_2025_032

## Native TSL Procedural Textures

**Task ID**: TASK_2025_032  
**Phase**: Architecture Design  
**Status**: Ready for Review

---

## Overview

This plan implements **14 procedural texture generators** and **6 core utility functions** in the `@hive-academy/angular-3d` library, using [tsl-textures](https://github.com/boytchev/tsl-textures) as reference.

### Evidence Base

| Pattern Source       | File                       | Lines   | Key Insight                                      |
| -------------------- | -------------------------- | ------- | ------------------------------------------------ |
| TSL Function Pattern | `tsl-utilities.ts`         | 102-105 | Use `TSLFn` wrapper with typed array args        |
| MaterialX Noise      | `tsl-utilities.ts`         | 171-194 | Use `mx_noise_vec3`, `mx_fractal_noise_float`    |
| Domain Warping       | `tsl-utilities.ts`         | 233-255 | Offset coordinates with noise for organic shapes |
| Reference marble     | tsl-textures/marble.js     | ALL     | `convertToNodes` + defaults pattern              |
| Reference planet     | tsl-textures/planet.js     | ALL     | Multi-level color mixing with `If/ElseIf`        |
| Reference polka-dots | tsl-textures/polka-dots.js | ALL     | Spherical distribution with `Loop`               |

---

## Proposed Changes

### Batch 1: Core Utilities (Foundation)

#### [MODIFY] [tsl-utilities.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/shaders/tsl-utilities.ts)

**Add 6 new utility functions** (ported from tsl-textures/tsl-utils.js):

```typescript
// === NEW UTILITIES TO ADD ===

/** HSL to RGB color conversion (port from tsl-utils.js) */
export const tslHsl = TSLFn(([h, s, l]: [TSLNode, TSLNode, TSLNode]) => {
  // Implementation using hslHelper pattern
});

/** RGB to HSL conversion */
export const tslToHsl = TSLFn(([rgb]: [TSLNode]) => {
  // Implementation with If/ElseIf for hue calculation
});

/** Convert angles (phi, theta) to point on unit sphere */
export const tslSpherical = TSLFn(([phi, theta]: [TSLNode, TSLNode]) => {
  return vec3(sin(theta).mul(sin(phi)), cos(phi), cos(theta).mul(sin(phi)));
});

/** Simple vector noise (faster than MaterialX) */
export const tslVnoise = TSLFn(([v]: [TSLNode]) => {
  return v.dot(vec3(12.9898, 78.233, -97.5123)).sin().mul(43758.5453).fract().mul(2).sub(1);
});

/** Rotation matrices */
export const tslMatRotX = TSLFn(([angle]: [TSLNode]) => {
  /* mat4 */
});
export const tslMatRotY = TSLFn(([angle]: [TSLNode]) => {
  /* mat4 */
});
export const tslMatRotZ = TSLFn(([angle]: [TSLNode]) => {
  /* mat4 */
});

/** Exponential remap */
export const tslRemapExp = TSLFn(([x, fromMin, fromMax, toMin, toMax]: [...TSLNode[]]) => {
  // Implementation using remap + pow
});
```

**Rationale**: These utilities are required by texture functions. Adding to existing file keeps related code together.

---

### Batch 2: Space/Sci-Fi Textures (Tier 1)

#### [NEW] [tsl-textures.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/shaders/tsl-textures.ts)

**Create new file with 14 procedural texture generators**:

```typescript
/**
 * TSL Procedural Texture Generators
 *
 * GPU-accelerated procedural textures using Three.js Shading Language.
 * Works on both WebGPU (WGSL) and WebGL (GLSL) through TSL auto-transpilation.
 *
 * @module primitives/shaders/tsl-textures
 */

import * as TSL from 'three/tsl';
import { Color } from 'three/webgpu';

// Re-export required TSL functions
const { Fn, float, vec3, mix, smoothstep, positionGeometry, If, Loop, exp, pow, ... } = TSL;
const TSLFn = Fn as any;

// Import utilities from tsl-utilities
import { nativeNoise3D, nativeFBM, tslSpherical, tslHsl } from './tsl-utilities';

// ============================================================================
// Type Definitions
// ============================================================================

export interface TslTextureParams {
  [key: string]: number | Color | [number, number, number];
}

// ============================================================================
// Helper: Convert user params to TSL nodes (from tsl-utils.js)
// ============================================================================

function convertToNodes(params: TslTextureParams, defaults: TslTextureParams) {
  const result = { ...defaults };
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'number') {
      result[key] = float(value);
    } else if (value instanceof Color) {
      result[key] = vec3(value.r, value.g, value.b);
    }
    // else keep as-is
  }
  return result;
}

// ============================================================================
// TIER 1: Space/Sci-Fi Textures
// ============================================================================

/** Planet surface with land/water/snow zones */
export const tslPlanet = TSLFn((params) => {
  // Port from planet.js - multi-color zone mixing
});

/** Starfield background */
export const tslStars = TSLFn((params) => {
  // Scatter points using golden ratio, apply brightness
});

/** Underwater caustic light patterns */
export const tslCaustics = TSLFn((params) => {
  // Animated Voronoi-based light patterns
});

/** Sun/star surface with granulation */
export const tslPhotosphere = TSLFn((params) => {
  // Perlin noise with turbulence and temperature color map
});

// ============================================================================
// TIER 2: Natural Materials
// ============================================================================

/** Veined marble patterns */
export const tslMarble = TSLFn((params) => {
  // Port from marble.js - noise with abs().pow() for veins
});

/** Wood grain with ring patterns */
export const tslWood = TSLFn((params) => {
  // Radial noise for rings, tangential variation
});

/** Oxidation/corrosion patterns */
export const tslRust = TSLFn((params) => {
  // Multi-scale noise with pit generation
});

/** Rough concrete surface */
export const tslConcrete = TSLFn((params) => {
  // High-frequency noise with aggregate spots
});

// ============================================================================
// TIER 3: Patterns
// ============================================================================

/** Repeating dot patterns */
export const tslPolkaDots = TSLFn((params) => {
  // Port from polka-dots.js - spherical or flat distribution
});

/** Tech/hologram grids */
export const tslGrid = TSLFn((params) => {
  // UV-based grid with blur smoothstep
});

/** Voronoi cell structures */
export const tslVoronoiCells = TSLFn((params) => {
  // Cell distance calculation with edge detection
});

/** Brick wall patterns */
export const tslBricks = TSLFn((params) => {
  // Offset grid pattern with mortar
});

// ============================================================================
// TIER 4: Shape Modifiers (positionNode)
// ============================================================================

/** Supersphere deformation */
export const tslSupersphere = TSLFn((params) => {
  // Modify vertex positions based on power parameter
});

/** Melting/dripping effect */
export const tslMelter = TSLFn((params) => {
  // Noise-based vertex displacement in direction
});
```

**File Size Estimate**: ~600-800 lines

---

### Batch 3: Export Updates

#### [MODIFY] [index.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/shaders/index.ts)

**Add exports for new utilities and textures**:

```typescript
// === ADD AFTER LINE 47 ===

// Texture Utility Functions (from tsl-utils.js port)
export { tslHsl, tslToHsl, tslSpherical, tslVnoise, tslMatRotX, tslMatRotY, tslMatRotZ, tslRemapExp } from './tsl-utilities';

// Procedural Texture Generators
export {
  // Type
  type TslTextureParams,

  // Tier 1: Space/Sci-Fi
  tslPlanet,
  tslStars,
  tslCaustics,
  tslPhotosphere,

  // Tier 2: Natural Materials
  tslMarble,
  tslWood,
  tslRust,
  tslConcrete,

  // Tier 3: Patterns
  tslPolkaDots,
  tslGrid,
  tslVoronoiCells,
  tslBricks,

  // Tier 4: Shape Modifiers
  tslSupersphere,
  tslMelter,
} from './tsl-textures';
```

---

### Batch 4: Demo Showcase

#### [NEW] [tsl-textures-section.component.ts](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/src/app/pages/home/sections/tsl-textures-section.component.ts)

**Create demo section with 8+ interactive examples**:

- Display 8 texture examples in a grid
- Parameter sliders for real-time adjustment
- Code examples inline
- Uses `MeshStandardNodeMaterial` with texture colorNode

---

### Batch 5: Tests (if time permits)

#### [NEW] [tsl-textures.spec.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/shaders/tsl-textures.spec.ts)

**Unit tests for texture functions** (following existing `*.spec.ts` pattern):

- Test that each texture function returns a valid TSL node
- Test parameter defaults are applied
- Test color conversion to vec3

---

## Execution Batches

| Batch | Description       | Files                                     | Est. Time |
| ----- | ----------------- | ----------------------------------------- | --------- |
| **1** | Core Utilities    | `tsl-utilities.ts`                        | 2h        |
| **2** | Texture Functions | `tsl-textures.ts` (NEW)                   | 6h        |
| **3** | Export Updates    | `index.ts`                                | 30min     |
| **4** | Demo Section      | `tsl-textures-section.component.ts` (NEW) | 3h        |
| **5** | Unit Tests        | `tsl-textures.spec.ts` (NEW)              | 2h        |

**Total Estimated Time**: 13.5 hours

---

## Dependencies

| Dependency                           | Status       | Notes                                                            |
| ------------------------------------ | ------------ | ---------------------------------------------------------------- |
| TASK_2025_031 (WebGPU TSL Migration) | In Progress  | Batch 2 from 031 adds `tslFresnel`/`tslIridescence` - compatible |
| MaterialX noise functions            | ✅ Available | `mx_noise_float`, `mx_fractal_noise_float` already imported      |
| Three.js TSL                         | ✅ Available | `three/tsl` imports working                                      |

---

## Verification Plan

### Automated Tests

**Command**: Run unit tests for the library

```bash
npx nx test angular-3d --testPathPattern="tsl-textures"
```

> **Note**: No existing tests for `tsl-utilities.ts` or `tsl-raymarching.ts` found. New tests will be the first.

### Visual Verification

**Command**: Serve demo application and visually verify textures

```bash
npx nx serve angular-3d-demo
```

**Verification Steps**:

1. Navigate to demo app in browser (http://localhost:4200)
2. Scroll to TSL Textures section
3. Verify each texture renders correctly:
   - [ ] `tslMarble` shows veined pattern
   - [ ] `tslPlanet` shows land/water zones
   - [ ] `tslStars` shows random star distribution
   - [ ] `tslPolkaDots` shows repeating dots
   - [ ] `tslGrid` shows clean grid lines
4. Verify no console errors (WebGPU mode)
5. Test WebGL fallback by disabling WebGPU in browser flags

### Build Verification

**Command**: Build library to ensure exports are correct

```bash
npx nx build angular-3d
```

---

## Risk Mitigation

| Risk                                          | Probability | Mitigation                                      |
| --------------------------------------------- | ----------- | ----------------------------------------------- |
| TSL `If`/`Loop` differences from tsl-textures | Medium      | Test each texture individually after porting    |
| MaterialX noise range differences             | Low         | Already using same `mx_*` functions             |
| Performance on complex textures               | Low         | Start with simpler textures, optimize if needed |

---

## Success Criteria

- [x] Requirements approved
- [ ] 14 texture functions implemented
- [ ] 6 utility functions added
- [ ] Demo section shows 8+ examples
- [ ] Zero console errors in demo
- [ ] Build passes with no TypeScript errors
- [ ] Visual parity with tsl-textures reference

---

## Notes

- **Pattern Decision**: Using standalone TSL functions (not Angular components) matching tsl-textures API for flexibility
- **Naming Convention**: `tsl` prefix to distinguish from other utilities (e.g., `tslMarble` vs Three.js `Marble`)
- **File Organization**: New `tsl-textures.ts` file keeps texture generators separate from utilities
