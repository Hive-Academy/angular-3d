# Implementation Plan - TASK_2025_034: MetaballComponent Viewport Refactoring

## Problem Statement

The `MetaballComponent` creates a **2x2 PlaneGeometry** intended for NDC (Normalized Device Coordinates) clip-space rendering, but it is placed as a **regular 3D object** in a perspective scene. This causes:

1. **Small Rendered Area**: With camera at `[0, 0, 1]` and FOV 60, the 2x2 plane appears as a small rectangle instead of filling the viewport
2. **UV Mismatch**: The ray marching shader uses `uv()` coordinates expecting full-screen coverage, but only covers a fraction of the visible area
3. **Incorrect Clipping**: The metaballs are clipped to the small plane bounds

**Evidence**:

- `metaball.component.ts:598-599`: Creates 2x2 PlaneGeometry
- `metaball.component.ts:1109`: Uses `uv()` expecting screen-space UVs
- `metaball-hero-scene.component.ts:55-58`: Camera at `[0, 0, 1]` with FOV 60

---

## Codebase Investigation Summary

### Libraries Discovered

**Three.js TSL ScreenNode** (`node_modules/three/src/nodes/display/ScreenNode.js`):

- `screenUV`: Normalized screen coordinates (0-1) - window-relative
- `viewportUV`: Normalized viewport coordinates (0-1) - viewport-relative
- `screenSize`: Screen resolution in physical pixels
- `viewportCoordinate`: Current pixel position on viewport
- Key export: Line 228 - `export const screenUV = nodeImmutable(ScreenNode, ScreenNode.UV)`

**Existing Ray Marching Pattern** (`metaball.component.ts:1107-1119`):

```typescript
// Current approach uses uv() from PlaneGeometry
const screenUV = uv().sub(vec2(float(0.5), float(0.5)));
const aspect = this.uResolution.x.div(this.uResolution.y);
const adjustedUV = vec2(screenUV.x.mul(aspect), screenUV.y);
```

**Similar Volumetric Components**:

- `nebula-volumetric.component.ts:196-197`: Uses PlaneGeometry with world-space positioning
- `cloud-layer.component.ts:199`: Uses PlaneGeometry with merged geometries
- Both use additive blending and disable depth testing

**PostProcessing Architecture** (`effect-composer.service.ts`):

- Uses `THREE.PostProcessing` for render passes
- TSL `pass()` function creates scene render pass
- Supports custom effect nodes via `addEffect()`

### Patterns Identified

**Full-Screen Quad Pattern (Traditional)**:

```typescript
// Approach 1: OrthographicCamera + screen-aligned plane
const orthoCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const plane = new THREE.PlaneGeometry(2, 2);
// Mesh at z=0, camera looks at z=0
```

**TSL screenUV Pattern (Modern)**:

```typescript
// Approach 2: Use TSL screenUV instead of geometry uv()
import { screenUV, screenSize, viewport } from 'three/tsl';
// screenUV is 0-1 normalized, independent of geometry
const adjustedUV = screenUV.sub(vec2(0.5, 0.5));
```

**Dynamic Plane Scaling Pattern**:

```typescript
// Approach 3: Scale plane to match camera frustum
const vFov = (camera.fov * Math.PI) / 180;
const planeHeight = 2 * Math.tan(vFov / 2) * cameraDistance;
const planeWidth = planeHeight * aspect;
plane.scale.set(planeWidth, planeHeight, 1);
```

### Integration Points

**Scene3dComponent** (`scene-3d.component.ts`):

- Provides `SceneService` for renderer/camera access
- Camera setup: `initCamera()` at line 414-429
- Resize handling: `setupResizeHandler()` at line 431-451

**RenderLoopService** (`render-loop.service.ts`):

- Animation frame management via `registerUpdateCallback()`
- Used by MetaballComponent for time uniform updates

---

## Solution Architecture

### Chosen Approach: Hybrid TSL screenUV + Dynamic Scaling

**Rationale**:
After investigating multiple approaches, the best solution is a **hybrid approach** that:

1. **Uses TSL `screenUV`** instead of geometry `uv()` for screen-space coordinates
2. **Dynamically scales the plane** to fill the camera frustum
3. **Adds a `fullscreen` mode input** for toggling between modes

**Why this approach**:

- **screenUV is camera-independent**: Works regardless of camera position/FOV
- **Dynamic scaling ensures geometry coverage**: No clipping at edges
- **Backward compatible**: Existing positioned 3D usage still works with `fullscreen="false"`
- **No separate postprocessing pass needed**: Simpler architecture
- **TSL already available**: `screenUV` verified in `three/tsl` exports

**Alternative approaches rejected**:

1. **PostProcessing Pass**: Too complex, requires separate render target management
2. **OrthographicCamera Layer**: Requires second camera, complicates scene hierarchy
3. **Plane Scaling Only**: Doesn't fix UV coordinate mismatch

---

## Component Specifications

### Component: MetaballComponent (MODIFY)

**Purpose**: Add fullscreen rendering mode while preserving positioned 3D capability

**Pattern**: Signal-based input for mode switching + TSL screenUV for fullscreen mode

**Evidence**:

- TSL screenUV: `node_modules/three/src/nodes/display/ScreenNode.js:228`
- Current PlaneGeometry: `metaball.component.ts:598-599`
- Resize handling pattern: `scene-3d.component.ts:431-451`

**New Inputs**:

```typescript
/**
 * Fullscreen mode for hero sections
 * When true: Plane scales to fill camera frustum, uses screenUV
 * When false: Standard 3D positioning (legacy behavior)
 */
public readonly fullscreen = input<boolean>(true);

/**
 * Camera distance for fullscreen mode calculations
 * Only used when fullscreen=true
 */
public readonly cameraDistance = input<number | null>(null);
```

**Implementation Changes**:

#### 1. Import TSL screenUV

```typescript
// Add to imports section
import { screenUV, screenSize, viewport } from 'three/tsl';
```

#### 2. Modify createMetaballMesh()

```typescript
private createMetaballMesh(): void {
  // ... existing uniform setup ...

  // Create plane geometry (always 2x2 for NDC-like coordinates)
  const geometry = new THREE.PlaneGeometry(2, 2);

  // Create mesh
  this.mesh = new THREE.Mesh(geometry, this.material);
  this.mesh.frustumCulled = false;

  // Fullscreen mode: scale plane to fill viewport
  if (this.fullscreen()) {
    this.updateFullscreenScale();
  }

  this.group.add(this.mesh);
}
```

#### 3. Add fullscreen scaling method

```typescript
/**
 * Scale plane geometry to fill camera frustum
 * Uses camera FOV and distance to calculate required plane dimensions
 */
private updateFullscreenScale(): void {
  const camera = this.sceneService?.camera();
  if (!camera || !this.mesh) return;

  // Get camera distance (from input or calculate from camera position)
  const distance = this.cameraDistance() ?? camera.position.length();

  // Calculate frustum dimensions at plane distance
  const vFov = (camera.fov * Math.PI) / 180;
  const planeHeight = 2 * Math.tan(vFov / 2) * distance;
  const planeWidth = planeHeight * camera.aspect;

  // Scale plane to fill viewport (with small overflow to prevent edge artifacts)
  const scale = 1.1; // 10% overflow
  this.mesh.scale.set(planeWidth * scale, planeHeight * scale, 1);

  // Position at camera distance
  this.mesh.position.set(0, 0, -distance + 0.01);
}
```

#### 4. Modify createTSLMaterial() to use screenUV in fullscreen mode

```typescript
private createTSLMaterial(): MeshBasicNodeMaterial {
  // ... existing setup ...

  const rayMarch = Fn(() => {
    // CRITICAL: Use screenUV for fullscreen mode, uv() for positioned mode
    const uvSource = this.fullscreen()
      ? screenUV  // Screen-space coordinates (0-1)
      : uv();     // Geometry UV coordinates

    const screenCoords = uvSource.sub(vec2(float(0.5), float(0.5)));
    const aspect = screenSize.x.div(screenSize.y);
    const adjustedUV = vec2(screenCoords.x.mul(aspect), screenCoords.y);

    // ... rest of ray marching logic (unchanged) ...
  });

  // ... rest of material setup ...
}
```

#### 5. Add resize handler for fullscreen mode

```typescript
private onWindowResize(): void {
  // ... existing resize logic ...

  // Update fullscreen scaling when viewport changes
  if (this.fullscreen() && this.mesh) {
    this.updateFullscreenScale();
  }
}
```

#### 6. Inject SceneService for camera access

```typescript
// Add to DI section
private readonly sceneService = inject(SceneService, { optional: true });
```

**Quality Requirements**:

**Functional**:

- `fullscreen=true` (default): Metaballs fill entire viewport
- `fullscreen=false`: Metaballs render as positioned 3D object (existing behavior)
- Resize handling maintains fullscreen coverage
- Mouse interaction coordinates remain accurate in both modes

**Non-Functional**:

- Performance: No additional render passes
- Compatibility: WebGPU and WebGL backends
- Memory: No additional textures or render targets

**Pattern Compliance**:

- Uses signal-based `input<T>()` for new inputs
- Follows existing resize handling pattern from `scene-3d.component.ts`
- Uses TSL imports verified in codebase

**Files Affected**:

- `libs/angular-3d/src/lib/primitives/metaball.component.ts` (MODIFY)

---

### Usage Update: MetaballHeroSceneComponent

**Purpose**: Update demo scene to use new fullscreen mode

**Changes Required**:

```typescript
// metaball-hero-scene.component.ts
// Change camera position to reasonable distance for fullscreen mode
[cameraPosition]="[0, 0, 10]"

// MetaballComponent will now fill viewport by default
<a3d-metaball
  [preset]="selectedPreset()"
  [sphereCount]="6"
  [smoothness]="0.3"
  [mouseProximityEffect]="true"
  [animationSpeed]="0.6"
  [movementScale]="1.2"
  [fullscreen]="true"  // New: explicit fullscreen mode (default is true)
/>
```

**Files Affected**:

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/metaball-hero-scene.component.ts` (MODIFY)

---

## Integration Architecture

### Data Flow

```
User Interaction (Mouse/Touch)
    |
    v
MetaballComponent.onPointerMove()
    |
    +-- Update targetMousePosition (normalized 0-1)
    |
    v
RenderLoopService.registerUpdateCallback()
    |
    +-- Interpolate mousePosition
    +-- Update uMousePosition uniform
    +-- Update uTime uniform
    |
    v
TSL Material (ray marching shader)
    |
    +-- screenUV (fullscreen) OR uv() (positioned)
    +-- Ray march with metaball SDF
    +-- Lighting calculations
    |
    v
WebGPU/WebGL Renderer
```

### Camera-Plane Relationship (Fullscreen Mode)

```
Camera at [0, 0, 10] with FOV 60
    |
    |  distance = 10
    |
    v
Plane at z = -9.99 (slightly in front of origin)
    |
    +-- Scale calculated from frustum:
    |   height = 2 * tan(30deg) * 10 = 11.55
    |   width = height * aspect
    |
    +-- screenUV provides 0-1 coordinates
    |   independent of actual plane size
```

### Dependencies

**Internal**:

- `SceneService` - Camera access for frustum calculations
- `RenderLoopService` - Animation frame updates
- `NG_3D_PARENT` - Scene hierarchy integration

**External (TSL)**:

- `screenUV` from `three/tsl` - Screen-space coordinates
- `screenSize` from `three/tsl` - Viewport dimensions

---

## Quality Requirements (Architecture-Level)

### Functional Requirements

1. **Fullscreen Mode (default)**:

   - Metaballs fill entire viewport regardless of camera settings
   - Mouse/touch interaction works across full viewport
   - Resize handling maintains full coverage

2. **Positioned Mode (legacy)**:

   - `fullscreen=false` preserves existing behavior
   - 2x2 plane renders at world origin
   - Subject to perspective projection

3. **Mode Switching**:
   - Can toggle between modes via input binding
   - No visual artifacts during mode switch

### Non-Functional Requirements

**Performance**:

- No additional render passes or textures
- Same GPU cost as current implementation
- Maintain 60fps on modern browsers

**Compatibility**:

- WebGPU with WebGL fallback (TSL handles transpilation)
- Works with existing postprocessing pipeline

**Maintainability**:

- Minimal code changes to existing implementation
- Clear separation between fullscreen and positioned logic
- Well-documented new inputs

### Pattern Compliance

**Verified Patterns Used**:

- Signal-based inputs: `input<T>()` (Angular 20+ standard)
- TSL screenUV: Verified in `three/tsl` exports
- Resize handling: Pattern from `scene-3d.component.ts:431-451`
- Camera frustum calculation: Standard Three.js math

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: backend-developer

**Rationale**:

1. TSL shader modifications require understanding of WebGPU shading language
2. Camera frustum math is graphics/math-heavy
3. Changes are in library code (`libs/angular-3d`)
4. No UI/CSS work involved

### Complexity Assessment

**Complexity**: MEDIUM
**Estimated Effort**: 3-5 hours

**Breakdown**:

- Add fullscreen input and SceneService injection: 30 min
- Implement updateFullscreenScale(): 1 hour
- Modify createTSLMaterial() for screenUV: 1.5 hours
- Update resize handler: 30 min
- Update demo scene and test: 1 hour
- Edge case handling and polish: 30 min

### Files Affected Summary

**MODIFY**:

- `libs/angular-3d/src/lib/primitives/metaball.component.ts`

  - Add `fullscreen` and `cameraDistance` inputs
  - Inject `SceneService`
  - Add `updateFullscreenScale()` method
  - Modify `createTSLMaterial()` to use `screenUV` conditionally
  - Update `onWindowResize()` for fullscreen scaling

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/metaball-hero-scene.component.ts`
  - Update camera position to `[0, 0, 10]`
  - Add `[fullscreen]="true"` attribute (explicit, though default)

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **TSL screenUV is available**:

   - Import path: `import { screenUV, screenSize } from 'three/tsl'`
   - Source: `node_modules/three/src/nodes/display/ScreenNode.js:228`

2. **SceneService camera access works**:

   - `sceneService.camera()` returns PerspectiveCamera
   - Source: `libs/angular-3d/src/lib/canvas/scene.service.ts`

3. **Existing metaball functionality preserved**:

   - Test with `fullscreen="false"` for positioned mode
   - Verify mouse interaction in both modes

4. **Performance unchanged**:
   - No additional render passes
   - Same GPU workload as before

### Architecture Delivery Checklist

- [x] Problem statement with evidence
- [x] Solution approach with rationale
- [x] Alternative approaches considered and rejected
- [x] All patterns verified from codebase
- [x] All imports verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended
- [x] Complexity assessed
- [x] No step-by-step implementation (that's team-leader's job)
