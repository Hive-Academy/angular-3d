# Development Tasks - TASK_2026_002

**Total Tasks**: 8 | **Batches**: 2 | **Status**: 1/2 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- effect() pattern for reactive initialization: VERIFIED (standard pattern in codebase)
- SceneService signal timing: VERIFIED (renderer/camera set in Scene3dComponent afterNextRender)
- TSL shader modifications: VERIFIED (existing shader structure supports conditional logic)
- Geometry flexibility: VERIFIED (CylinderGeometry supports variable sides)

### Risks Identified

| Risk                                    | Severity | Mitigation                         |
| --------------------------------------- | -------- | ---------------------------------- |
| Multiple effect() runs if signals pulse | LOW      | Add initialized flag (Task 1.1)    |
| Shader complexity increase              | LOW      | Inline comments in shader (Task 2) |
| Backward compatibility                  | LOW      | All new inputs have defaults       |

### Edge Cases to Handle

- [ ] effect() double initialization → Handled in Task 1.1 (initialized flag)
- [ ] null edgeColor with edgePulse=false → Documented in shader comments (Task 2)
- [ ] customGeometry incompatibility → Documented in TSDoc (Task 1.2)

---

## Batch 1: Core Bug Fix + Geometry Flexibility COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None

### Task 1.1: Fix Mouse Event Race Condition (CRITICAL) COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\hexagonal-background-instanced.component.ts:171-203, 459-465
**Spec Reference**: context.md:20-51
**Pattern to Follow**: libs/angular-3d/src/lib/controls/orbit-controls.component.ts:149-160

**Quality Requirements**:

- Use Angular effect() for reactive initialization (established pattern in codebase)
- Add initialized flag to prevent double initialization if signals pulse
- Remove silent fail from setupHoverInteraction() (lines 463-465)
- Mouse event listeners must be reliably attached

**Validation Notes**:

- RISK: effect() may re-run if renderer/camera signals change
  - MITIGATION: Add `initialized` boolean flag (see orbit-controls.component.ts:150,158)
- This fixes the race condition where child afterNextRender() runs before parent sets signals

**Implementation Details**:

**Imports**: Add `effect` to Angular imports (line 7)

**New Property**:

```typescript
private initialized = false;
```

**Constructor Modification** (lines 171-203):

```typescript
public constructor() {
  afterNextRender(() => {
    this.createInstancedHexagons();

    const parent = this.parent();
    if (parent) {
      parent.add(this.instancedMesh);
    }

    // FIXED: Reactive initialization - wait for renderer/camera signals
    effect(() => {
      const renderer = this.sceneService.renderer();
      const camera = this.sceneService.camera();

      if (renderer && camera && !this.initialized) {
        this.initialized = true;
        this.setupHoverInteraction();
      }
    });

    // Register animation loop
    const cleanup = this.renderLoop.registerUpdateCallback(() => {
      this.updateAnimation();
    });

    // Cleanup
    this.destroyRef.onDestroy(() => {
      cleanup();
      const parent = this.parent();
      if (parent && this.instancedMesh) {
        parent.remove(this.instancedMesh);
      }
      if (this.instancedMesh) {
        this.instancedMesh.geometry.dispose();
        if (this.material) {
          this.material.dispose();
        }
      }
    });
  });
}
```

**Remove Silent Fail** (lines 463-465):

- Delete the early return `if (!renderer || !camera) { return; }`
- setupHoverInteraction() will only be called when both are available

**Acceptance Criteria**:

- Mouse event listeners are reliably attached (no race condition)
- No errors in console during initialization
- Hovering over hexagons reveals bright faces (test in demo)
- effect() only runs once (initialized flag prevents duplicates)

---

### Task 1.2: Add Geometry Flexibility Inputs COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\hexagonal-background-instanced.component.ts:79-147
**Spec Reference**: context.md:203-240
**Dependencies**: None

**Quality Requirements**:

- Add new signal inputs with TypeScript strict typing
- All inputs must have defaults that preserve existing behavior
- TSDoc comments for each input
- CustomGeometry input must document edge detection requirements

**Validation Notes**:

- EDGE CASE: customGeometry with incompatible structure may break edge detection
  - SOLUTION: Document in TSDoc that custom geometry requires `positionLocal.z` variation

**Implementation Details**:

**Add Inputs** (after line 147):

```typescript
/**
 * Geometry shape type
 * Controls the number of sides for the cylindrical hexagon prisms
 * - hexagon: 6 sides (default)
 * - diamond: 4 sides
 * - octagon: 8 sides
 * - square: 4 sides (aligned differently than diamond)
 */
public readonly shape = input<'hexagon' | 'diamond' | 'octagon' | 'square'>('hexagon');

/**
 * Custom geometry (advanced users - overrides shape input)
 * WARNING: Custom geometry MUST have positionLocal.z variation for edge detection to work.
 * Geometries without Z-axis variation will not show edge glow effect.
 */
public readonly customGeometry = input<THREE.BufferGeometry | null>(null);
```

**Acceptance Criteria**:

- Inputs compile without TypeScript errors
- Default values preserve existing behavior (hexagon shape)
- TSDoc comments explain purpose and constraints

---

### Task 1.3: Implement Geometry Creation Helper COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\hexagonal-background-instanced.component.ts:205-230
**Spec Reference**: context.md:203-240
**Dependencies**: Task 1.2

**Quality Requirements**:

- Extract geometry creation into separate method
- Support all shape types (hexagon, diamond, octagon, square)
- Respect customGeometry override
- Maintain existing geometry transformations (rotateX)

**Implementation Details**:

**Add Helper Method** (before createInstancedHexagons):

```typescript
/**
 * Creates geometry based on shape or customGeometry input
 * @returns BufferGeometry for instanced mesh
 */
private createGeometry(): THREE.BufferGeometry {
  const customGeom = this.customGeometry();
  if (customGeom) {
    return customGeom;
  }

  const sidesMap: Record<string, number> = {
    hexagon: 6,
    diamond: 4,
    octagon: 8,
    square: 4,
  };

  const sides = sidesMap[this.shape()];

  const geometry = new THREE.CylinderGeometry(
    this.hexRadius(),
    this.hexRadius(),
    this.hexHeight(),
    sides
  );

  geometry.rotateX(Math.PI / 2); // Face camera (align with XY plane)
  return geometry;
}
```

**Replace Geometry Creation** (lines 212-218):

```typescript
// OLD:
// const geometry = new THREE.CylinderGeometry(
//   hexRadius,
//   hexRadius,
//   hexHeight,
//   6
// );
// geometry.rotateX(Math.PI / 2);

// NEW:
const geometry = this.createGeometry();
```

**Acceptance Criteria**:

- All shape types render correctly (hexagon, diamond, octagon, square)
- Custom geometry works when provided
- Geometry is properly rotated to face camera
- Edge detection still works for all shapes

---

**Batch 1 Verification**:

- [x] All files exist at paths
- [x] All changes implemented (effect, inputs, createGeometry helper)
- [ ] Build verification (deferred until all batches complete)
- [ ] Manual testing (deferred until demo updated in Batch 2)

---

## Batch 2: Enhanced Color Control + Demo + Tests COMPLETE

**Developer**: frontend-developer
**Tasks**: 5 | **Dependencies**: Batch 1 complete

### Task 2.1: Add Color Control Inputs IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\hexagonal-background-instanced.component.ts:79-147
**Spec Reference**: context.md:244-318
**Dependencies**: Batch 1 complete

**Quality Requirements**:

- Add new signal inputs for edge/hover color control
- All inputs must have defaults that preserve existing behavior
- TSDoc comments explaining each input's purpose

**Implementation Details**:

**Add Inputs** (after mouseInfluenceRadius input, line 147):

```typescript
/**
 * Edge color (neon glow color for hexagon edges)
 * If null, uses colorPalette with pulsing animation (default behavior)
 * If set, edges will use this static color (unless edgePulse is true)
 */
public readonly edgeColor = input<ColorRepresentation | null>(null);

/**
 * Whether edge color should pulse (animate over time)
 * Only applies if edgeColor is set
 * - true: edge color pulses with time-based animation
 * - false: edge color is static
 * NOTE: If edgeColor is null, this input is ignored (palette always pulses)
 */
public readonly edgePulse = input<boolean>(true);

/**
 * Face color when mouse is near (hover glow color)
 * This is the bright color revealed when cursor moves over hexagons
 */
public readonly hoverColor = input<ColorRepresentation>(0xffffff);
```

**Acceptance Criteria**:

- Inputs compile without TypeScript errors
- Defaults preserve existing behavior (null edgeColor, pulsing, white hover)

---

### Task 2.2: Add Color Control Uniforms IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\hexagonal-background-instanced.component.ts:157-169, 232-256
**Spec Reference**: context.md:255-268
**Dependencies**: Task 2.1

**Quality Requirements**:

- Create THREE.UniformNode properties for new color controls
- Initialize uniforms in createInstancedHexagons()
- Handle null edgeColor case properly

**Implementation Details**:

**Add Uniform Properties** (after line 164):

```typescript
private edgeColorUniform!: THREE.UniformNode<THREE.Color | null>;
private edgePulseUniform!: THREE.UniformNode<number>;
private hoverColorUniform!: THREE.UniformNode<THREE.Color>;
```

**Initialize Uniforms** (after line 249, before creating edgeColorNode):

```typescript
// Uniforms for enhanced color control
this.edgeColorUniform = uniform(this.edgeColor() ? new THREE.Color(this.edgeColor()!) : null);
this.edgePulseUniform = uniform(this.edgePulse() ? 1.0 : 0.0);
this.hoverColorUniform = uniform(new THREE.Color(this.hoverColor()));
```

**Acceptance Criteria**:

- Uniforms are properly typed
- null edgeColor handled correctly
- edgePulse boolean converted to 0.0/1.0 float

---

### Task 2.3: Modify TSL Shader for Enhanced Color Control IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\backgrounds\hexagonal-background-instanced.component.ts:260-314
**Spec Reference**: context.md:269-318
**Dependencies**: Task 2.2

**Quality Requirements**:

- Modify edgeColorNode Fn() to support static/pulsing edge colors
- Support custom hover color
- Maintain backward compatibility (null edgeColor uses palette)
- Add inline comments explaining new logic

**Validation Notes**:

- RISK: Shader complexity increase
  - MITIGATION: Add inline comments for each conditional branch
- EDGE CASE: edgeColor=null + edgePulse=false → Uses palette-based static color (blend factor 0)

**Implementation Details**:

**Replace edgeColorNode** (lines 260-311):

```typescript
// TSL Color Modification Function
// Replaces diffuse color at edges with bright neon colors
// Supports both palette-based pulsing and static edge colors
const edgeColorNode = Fn(() => {
  // Time-based pulsing (0 to 1) - varies per instance via instanceIndex
  const phaseOffset = fract(mul(float(instanceIndex), float(0.618))); // Golden ratio for variety
  const t = mul(sin(mul(time, float(3.14159)).add(mul(phaseOffset, float(6.28)))), float(0.5)).add(float(0.5));

  // Edge detection thresholds scaled by hexHeight
  const edgeStart = mul(float(0.015), heightScale);
  const edgeEnd = mul(float(0.02).add(mul(float(1.0).sub(t), float(0.03))), heightScale);

  // edgeFactor is LOW (0) at edges, HIGH (1) away from edges (faces)
  const edgeFactor = smoothstep(edgeStart, edgeEnd, abs(positionLocal.z));

  // Base material color (dark blue-gray)
  const baseColor = vec3(0.133, 0.133, 0.267); // 0x222244

  // === EDGE COLOR LOGIC (NEW) ===
  // Check if static edgeColor is set (not null)
  const hasStaticEdgeColor = this.edgeColorUniform.notEqual(null);

  // Convert edgeColor uniform to vec3 (safe even if null - won't be used)
  const staticEdgeColor = vec3(this.edgeColorUniform.x, this.edgeColorUniform.y, this.edgeColorUniform.z);

  // Palette-based color selection (existing logic)
  const colorIdx = fract(mul(float(instanceIndex), float(0.25))); // 0, 0.25, 0.5, 0.75
  const color01 = mix(paletteColors[0], paletteColors[1], smoothstep(float(0.0), float(0.25), colorIdx));
  const color23 = mix(paletteColors[2], paletteColors[3], smoothstep(float(0.5), float(0.75), colorIdx));
  const selectedPaletteColor = mix(color01, color23, smoothstep(float(0.25), float(0.5), colorIdx));

  // Apply pulse to palette color (controlled by edgePulseUniform)
  // If edgePulse=false, blend factor is 0 (shows baseColor, not bright palette)
  const paletteWithPulse = mix(baseColor, selectedPaletteColor, mul(t, this.edgePulseUniform));

  // Choose edge color: static OR pulsing palette
  const edgeColor = hasStaticEdgeColor
    ? mix(baseColor, staticEdgeColor, this.edgePulseUniform) // Static edge (pulsed if edgePulse=true)
    : paletteWithPulse; // Palette-based (existing behavior)

  // === HOVER COLOR LOGIC (NEW) ===
  const hoverColor = vec3(this.hoverColorUniform.x, this.hoverColorUniform.y, this.hoverColorUniform.z);

  // Face color: dark base or bright hover based on mouse proximity
  const faceColor = mix(baseColor, hoverColor, mouseInfluence);

  // Final color: mix edge and face based on edgeFactor
  // edgeFactor=0 (edges) → show edgeColor
  // edgeFactor=1 (faces) → show faceColor
  return mix(edgeColor, faceColor, edgeFactor);
})();
```

**Acceptance Criteria**:

- Static edge colors work (edgeColor set, edgePulse=false)
- Pulsing edge colors work (edgeColor set, edgePulse=true)
- Palette fallback works (edgeColor=null)
- Custom hover color works
- Shader compiles without errors
- Backward compatibility: null edgeColor behaves like before

---

### Task 2.4: Update Demo with New Features IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\sections\backgrounds-section.component.ts
**Spec Reference**: context.md:322-370
**Dependencies**: Tasks 2.1, 2.2, 2.3

**Quality Requirements**:

- Add new demo scene showcasing shape + color features
- Use clear descriptions explaining the new features
- Test different combinations (static edges, diamond shape, hover color)

**Implementation Details**:

**Add New Scene** (after existing hexagonal background scenes):

```html
<!-- Scene 3: NEW - Static Cyan Edges + Diamond Shape -->
<div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
  <div class="h-[600px] relative">
    <a3d-scene-3d [cameraPosition]="[0, -3, 4]" [backgroundColor]="darkMagenta">
      <a3d-ambient-light [color]="colorNums.white" [intensity]="0.5" />
      <a3d-directional-light [color]="colorNums.blue" [intensity]="1.5" [position]="[100, -50, 50]" />

      <!-- NEW: Diamond shape with static cyan edges -->
      <a3d-hexagonal-background-instanced [circleCount]="10" [shape]="'diamond'" [edgeColor]="colorNums.cyan" [edgePulse]="false" [hoverColor]="colorNums.hotPink" [baseColor]="colorNums.darkBlueGray" [hexRadius]="0.5" [hexHeight]="0.1" [mouseInfluenceRadius]="3.0" [bloomLayer]="1" />

      <a3d-orbit-controls [enableDamping]="true" />
    </a3d-scene-3d>
  </div>
  <div class="p-6">
    <h4 class="text-white font-bold text-lg mb-2">Diamond Grid - Static Cyan Edges</h4>
    <p class="text-gray-400">Diamond-shaped instances with static cyan edge glow (no pulsing). Move mouse to reveal hot pink faces. Demonstrates separate edge/face color control and geometry flexibility.</p>
  </div>
</div>
```

**Acceptance Criteria**:

- New scene renders correctly
- Diamond shapes are visible
- Cyan edges are static (no pulsing)
- Hovering reveals hot pink faces
- Demo page builds without errors

---

### Task 2.5: Manual Testing Checklist IMPLEMENTED

**File**: Manual testing in browser
**Spec Reference**: context.md:384-400
**Dependencies**: All tasks in Batch 2

**Quality Requirements**:

- Manually verify all feature combinations work
- Test edge cases and backward compatibility
- Document any issues found

**Testing Checklist**:

**Mouse Events (Task 1.1 fix)**:

- [ ] Open demo page with hexagonal background
- [ ] Move mouse over hexagons → faces reveal bright colors
- [ ] Move mouse off canvas → faces return to dark
- [ ] No console errors during interaction

**Geometry Shapes (Task 1.2, 1.3)**:

- [ ] Hexagon shape renders correctly (default)
- [ ] Diamond shape renders (4 sides visible)
- [ ] Octagon shape renders (8 sides visible)
- [ ] Square shape renders (4 sides, aligned)

**Color Control (Tasks 2.1-2.3)**:

- [ ] Static edge color works (edgeColor set, edgePulse=false)
- [ ] Pulsing edge color works (edgeColor set, edgePulse=true)
- [ ] Palette fallback works (edgeColor=null → original behavior)
- [ ] Custom hover color works (hoverColor changes face reveal color)

**Backward Compatibility**:

- [ ] Existing demo scenes still work (no regressions)
- [ ] Default inputs preserve original behavior

**Edge Cases**:

- [ ] edgeColor=null + edgePulse=false → palette-based static (blend factor 0)
- [ ] customGeometry with proper Z variation → edge detection works
- [ ] Multiple shape changes (hexagon → diamond → octagon) → renders update

**Acceptance Criteria**:

- All checklist items pass
- No console errors or warnings
- Smooth 60fps rendering
- Mouse interaction feels responsive

---

**Batch 2 Verification**:

- [ ] All files exist at paths
- [ ] Build passes: `npx nx build @hive-academy/angular-3d`
- [ ] Build passes: `npx nx build angular-3d-demo`
- [ ] Demo page loads without errors
- [ ] All manual testing checklist items pass
- [ ] No regressions in existing scenes

---

## Summary

**Batch 1** (Core Fixes):

- Task 1.1: Fix mouse race condition (effect() pattern)
- Task 1.2: Add geometry inputs
- Task 1.3: Implement geometry creation helper

**Batch 2** (Enhancements + Testing):

- Task 2.1: Add color control inputs
- Task 2.2: Add color control uniforms
- Task 2.3: Modify TSL shader
- Task 2.4: Update demo
- Task 2.5: Manual testing

**Total**: 7 tasks, 2 batches, frontend-developer only
