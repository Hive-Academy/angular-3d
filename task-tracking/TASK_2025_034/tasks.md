# Development Tasks - TASK_2025_034: MetaballComponent Viewport Refactoring

**Total Tasks**: 6 | **Batches**: 2 | **Status**: 2/2 COMPLETE

**Final Verification**: PASSED (2026-01-02)
**Git Commits**: 58f733e, e454c40

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- [TSL screenUV]: VERIFIED - Available at `node_modules/three/src/nodes/display/ScreenNode.js:228`
- [TSL screenSize]: VERIFIED - Available at `node_modules/three/src/nodes/display/ScreenNode.js:236`
- [SceneService.camera()]: VERIFIED - Returns `PerspectiveCamera | null` signal
- [Frustum Math]: VERIFIED - Standard Three.js calculation pattern
- [Coordinate Space]: VERIFIED - screenUV provides 0-1 normalized coords matching current approach

### Risks Identified

| Risk                           | Severity | Mitigation                                                         |
| ------------------------------ | -------- | ------------------------------------------------------------------ |
| SceneService injection context | MEDIUM   | Use `inject(SceneService, { optional: true })` with null check     |
| Camera timing (null on init)   | MEDIUM   | Check for null camera in `updateFullscreenScale()`                 |
| Mode switching at runtime      | LOW      | Document as limitation - fullscreen mode set at component creation |

### Edge Cases to Handle

- [x] Camera not available when component initializes -> Handled in Task 1.3 (early return in updateFullscreenScale)
- [x] Window resize in fullscreen mode -> Handled in Task 1.4 (updateFullscreenScale called in onWindowResize)
- [x] SceneService not provided (component outside Scene3dComponent) -> Handled in Task 1.1 (optional injection with null check)

---

## Batch 1: MetaballComponent Core Changes - COMPLETE

**Developer**: backend-developer
**Tasks**: 4 | **Dependencies**: None
**Commit**: 58f733e

### Task 1.1: Add fullscreen inputs and SceneService injection - COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts
**Spec Reference**: implementation-plan.md:126-139
**Pattern to Follow**: metaball.component.ts:169-181 (existing signal inputs)

**Quality Requirements**:

- Add `fullscreen` input with default value `true`
- Add `cameraDistance` input with default value `null`
- Inject SceneService with `{ optional: true }` to handle usage outside Scene3dComponent
- Use signal-based `input<T>()` pattern matching existing inputs

**Validation Notes**:

- RISK: SceneService may not be provided - use optional injection
- Import SceneService from `../canvas/scene.service`

**Implementation Details**:

- Imports: Add `SceneService` import
- New inputs:
  - `public readonly fullscreen = input<boolean>(true);`
  - `public readonly cameraDistance = input<number | null>(null);`
- DI: `private readonly sceneService = inject(SceneService, { optional: true });`

---

### Task 1.2: Add TSL screenUV import and modify createTSLMaterial - COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts
**Spec Reference**: implementation-plan.md:197-217
**Pattern to Follow**: metaball.component.ts:1107-1119 (current uv() usage)

**Quality Requirements**:

- Import `screenUV` and `screenSize` from `three/tsl` via TSL namespace
- Modify `rayMarch` function to conditionally use screenUV (fullscreen) or uv() (positioned)
- Use `screenSize` instead of `uResolution` for aspect calculation in fullscreen mode
- Maintain backward compatibility - positioned mode must work exactly as before

**Validation Notes**:

- screenUV is 0-1 normalized, same as uv() - centering logic remains same
- CRITICAL: The `fullscreen()` value is read at material creation time, not reactively
- screenSize provides physical pixel dimensions

**Implementation Details**:

- Add to getTSL() function: `screenUV`, `screenSize` from TSL namespace
- In `rayMarch` Fn:

  ```typescript
  // Read fullscreen value (captured at material creation)
  const isFullscreen = this.fullscreen();

  // Use screenUV for fullscreen, uv() for positioned mode
  const uvSource = isFullscreen ? screenUV : uv();
  const screenCoords = uvSource.sub(vec2(float(0.5), float(0.5)));

  // Use screenSize for aspect in fullscreen mode
  const aspect = isFullscreen ? screenSize.x.div(screenSize.y) : this.uResolution.x.div(this.uResolution.y);
  ```

---

### Task 1.3: Implement updateFullscreenScale method - COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts
**Spec Reference**: implementation-plan.md:176-194
**Pattern to Follow**: scene-3d.component.ts:431-451 (resize handling pattern)

**Quality Requirements**:

- Create `updateFullscreenScale()` method to scale plane to camera frustum
- Handle null camera gracefully (early return)
- Calculate distance from `cameraDistance` input or camera position
- Apply 10% overflow scale to prevent edge artifacts
- Position plane at camera distance

**Validation Notes**:

- RISK: Camera may be null during initialization - method must check
- Frustum formula verified: `height = 2 * tan(fov/2) * distance`
- Use PerspectiveCamera's `fov` (degrees) and `aspect` properties

**Implementation Details**:

```typescript
/**
 * Scale plane geometry to fill camera frustum
 * Only used when fullscreen=true
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

  // Position at camera distance (slightly in front)
  this.mesh.position.set(0, 0, -distance + 0.01);
}
```

---

### Task 1.4: Update createMetaballMesh and onWindowResize for fullscreen - COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\metaball.component.ts
**Spec Reference**: implementation-plan.md:149-168, 219-229
**Pattern to Follow**: metaball.component.ts:541-607 (existing createMetaballMesh)

**Quality Requirements**:

- Modify `createMetaballMesh()` to call `updateFullscreenScale()` when fullscreen=true
- Modify `onWindowResize()` to call `updateFullscreenScale()` when fullscreen=true
- Ensure mesh is created before calling updateFullscreenScale

**Validation Notes**:

- Order matters: mesh must exist before scaling
- Resize handler already updates resolution uniforms - add fullscreen scaling after

**Implementation Details**:

In `createMetaballMesh()` after `this.group.add(this.mesh);`:

```typescript
// Fullscreen mode: scale plane to fill viewport
if (this.fullscreen()) {
  this.updateFullscreenScale();
}
```

In `onWindowResize()` after resolution updates:

```typescript
// Update fullscreen scaling when viewport changes
if (this.fullscreen() && this.mesh) {
  this.updateFullscreenScale();
}
```

---

**Batch 1 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- code-logic-reviewer approved
- No stubs, placeholders, or TODOs
- Backward compatibility: `fullscreen=false` works as before

---

## Batch 2: Demo Scene Update + Integration - COMPLETE

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 1 (COMPLETE)
**Commit**: e454c40

### Task 2.1: Update MetaballHeroSceneComponent for fullscreen mode - COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\metaball-hero-scene.component.ts
**Spec Reference**: implementation-plan.md:260-283
**Pattern to Follow**: Existing component template lines 55-87

**Quality Requirements**:

- Update camera position from `[0, 0, 1]` to `[0, 0, 10]` for better depth
- Add explicit `[fullscreen]="true"` attribute to MetaballComponent
- Ensure hero text positioning still works with new camera distance
- Adjust `[viewportZ]` if needed for text visibility

**Validation Notes**:

- Camera distance change may affect text positioning
- Text uses ViewportPositionDirective which handles camera-independent positioning

**Implementation Details**:

Update Scene3dComponent:

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 10]" <!-- Changed from [0, 0, 1] --> [cameraFov]="60" ... ></a3d-scene-3d>
```

Update MetaballComponent:

```html
<a3d-metaball [preset]="selectedPreset()" [sphereCount]="6" [smoothness]="0.3" [mouseProximityEffect]="true" [animationSpeed]="0.6" [movementScale]="1.2" [fullscreen]="true" <!-- Add explicit fullscreen mode --> /></a3d-metaball>
```

Update OrbitControls if needed:

```html
<a3d-orbit-controls [minDistance]="5" [maxDistance]="30" <!-- Adjust max distance for new camera position --> /></a3d-orbit-controls>
```

---

### Task 2.2: Visual verification and adjustments - COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\metaball-hero-scene.component.ts
**Spec Reference**: implementation-plan.md:350-387
**Pattern to Follow**: N/A - verification task

**Quality Requirements**:

- Run dev server: `npx nx serve angular-3d-demo`
- Navigate to metaball hero scene
- Verify: Metaballs fill entire viewport
- Verify: Mouse/touch interaction works across full viewport
- Verify: Window resize maintains full coverage
- Verify: All 6 presets work correctly
- Verify: Text positioning is correct

**Validation Notes**:

- If text positioning is off, adjust `viewportZ` or `viewportOffset`
- If metaballs don't fill viewport, check updateFullscreenScale calculation

**Implementation Details**:

- Start dev server and manually test
- Make any necessary adjustments to text positioning
- Ensure no visual regressions from existing behavior
- Test on different viewport sizes (resize browser window)

---

**Batch 2 Verification**: PASSED

- [x] Dev server starts without errors: `npx nx serve angular-3d-demo`
- [x] Build passes: `npx nx build angular-3d-demo`
- [x] Metaballs fill viewport on page load
- [x] All 6 presets display correctly (tested: moody, cosmic, neon, sunset, holographic, minimal)
- [x] Preset switching works via button clicks
- [x] Text positioning is readable (scaled for camera z=10)
- [x] No console errors related to fullscreen mode (only WebGPU powerPreference warning - unrelated)
- [x] Unused imports cleaned up from component

---

## Implementation Notes

### TSL Import Pattern

The MetaballComponent uses `import * as TSL from 'three/tsl'` and accesses functions via the TSL namespace. Add screenUV and screenSize to the getTSL() helper:

```typescript
function getTSL() {
  const {
    Fn,
    // ... existing imports ...
    screenUV, // Add
    screenSize, // Add
  } = TSL;

  return {
    // ... existing returns ...
    screenUV,
    screenSize,
  };
}
```

### Backward Compatibility

The `fullscreen` input defaults to `true`, which changes default behavior. However, the demo scene currently doesn't work correctly (metaballs render too small), so this default makes the component work out-of-the-box for the intended use case.

For users who want the old "positioned 3D object" behavior, they set `[fullscreen]="false"`.

### Performance Note

No additional render passes or textures are created. The fullscreen mode only:

1. Scales the plane geometry
2. Uses different UV coordinates in the shader

Both operations are essentially free performance-wise.

---

## Task Status Legend

| Status      | Icon | Meaning                               |
| ----------- | ---- | ------------------------------------- |
| PENDING     | -    | Not started                           |
| IN PROGRESS | -    | Assigned to developer                 |
| IMPLEMENTED | -    | Developer done, awaiting verification |
| COMPLETE    | -    | Verified and committed                |
| FAILED      | -    | Verification failed                   |

---

## Files Affected Summary

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
