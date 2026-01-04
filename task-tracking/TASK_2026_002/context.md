# TASK_2026_002: Hexagonal Background Component Enhancement

**Created**: 2026-01-04
**Type**: REFACTORING + ENHANCEMENT
**Complexity**: Medium
**Priority**: HIGH (Mouse interaction completely broken)

---

## User Request

Fix and enhance `hexagonal-background-instanced.component.ts`:

1. **Fix mouse event handling** (CRITICAL - currently broken)
2. **Add separate edge/face color control** (separate hexagon fill color from neon edge glow)
3. **Add geometry flexibility** (support diamond, octagon, square shapes)

---

## Investigation Findings

### Issue #1: Mouse Events Race Condition (CRITICAL)

**File**: `libs/angular-3d/src/lib/primitives/backgrounds/hexagonal-background-instanced.component.ts:459-465`

**Root Cause**:

- Both `Scene3dComponent` and `HexagonalBackgroundInstancedComponent` use `afterNextRender()`
- No execution order guarantee between parent/child `afterNextRender()` callbacks
- Scene sets `renderer`/`camera` in its `afterNextRender()` (scene-3d.component.ts:245-246)
- Hexagonal component calls `setupHoverInteraction()` in its `afterNextRender()` (line 181)
- **Race condition**: If hexagonal component runs first, `renderer()`/`camera()` return null
- `setupHoverInteraction()` silently fails (line 463-465) - no error, no retry
- Mouse event listeners are **never attached**

**Current Code**:

```typescript
private setupHoverInteraction(): void {
  const renderer = this.sceneService.renderer();
  const camera = this.sceneService.camera();

  if (!renderer || !camera) {
    return;  // ❌ SILENTLY FAILS - No error, no retry!
  }

  const canvas = renderer.domElement;
  // ... mouse event setup
}
```

**Solution**: Use Angular `effect()` to reactively wait for renderer/camera availability.

---

### Issue #2: Limited Color Control

**Current State**:

- `baseColor` input (line 110) - controls hexagon face color
- `colorPalette` input (line 90-95) - used for **pulsing** edge glow (4 colors)
- Edge color is **always animated** (time-based blending)
- No way to set **static** edge color separate from face color

**Shader Behavior** (lines 260-310):

- Edge detection based on `positionLocal.z` (distance from center plane)
- Edges get pulsing colors: `mix(baseColor, colorPalette[i], time)`
- Faces get `baseColor` (dark) unless mouse is near
- Mouse proximity reveals face with bright color

**Missing Capabilities**:

- ❌ Can't set static edge color (always pulses)
- ❌ Can't disable edge pulsing animation
- ❌ Can't set custom hover/mouse-influence color

---

### Issue #3: Fixed Geometry (Hexagon Only)

**Current Implementation** (lines 212-218):

```typescript
const geometry = new THREE.CylinderGeometry(
  hexRadius,
  hexRadius,
  hexHeight,
  6 // ← HARDCODED: Always hexagon (6 sides)
);
geometry.rotateX(Math.PI / 2);
```

**Constraint**:

- Geometry is hardcoded to 6-sided cylinder (hexagon)
- Edge detection shader assumes cylinder structure (works for hex/diamond/octagon)
- **Wouldn't work** for completely different geometries (spheres, boxes, custom meshes)

**Requested Enhancement**:

- Support `shape` input: `'hexagon' | 'diamond' | 'octagon' | 'square'`
- Optionally support `customGeometry` for advanced users

---

## Proposed Solution

### New Component API

```typescript
// ✅ NEW INPUTS

/**
 * Geometry shape type
 */
public readonly shape = input<'hexagon' | 'diamond' | 'octagon' | 'square'>('hexagon');

/**
 * Edge color (neon glow color for edges)
 * If null, uses colorPalette with pulsing
 */
public readonly edgeColor = input<ColorRepresentation | null>(null);

/**
 * Whether edge color should pulse (animate over time)
 */
public readonly edgePulse = input<boolean>(true);

/**
 * Face color when mouse is near (hover glow color)
 */
public readonly hoverColor = input<ColorRepresentation>(0xffffff);

/**
 * Custom geometry (advanced users - overrides shape)
 */
public readonly customGeometry = input<THREE.BufferGeometry | null>(null);
```

### Example Usage

```html
<a3d-hexagonal-background-instanced <!-- Existing -->
  [circleCount]="10" [hexRadius]="0.5" [hexHeight]="0.1" [baseColor]="0x222244"

  <!-- ✨ NEW: Separate edge control -->
  [edgeColor]="0x00ffff"
  <!-- Static cyan edges -->
  [edgePulse]="false"
  <!-- Disable pulsing -->
  [hoverColor]="0xff00ff"
  <!-- Magenta on hover -->

  <!-- ✨ NEW: Geometry options -->
  [shape]="'diamond'"
  <!-- or 'hexagon', 'octagon', 'square' -->

  <!-- ✅ FIXED: Mouse interaction now works -->
  [mouseInfluenceRadius]="3.0" /></a3d-hexagonal-background-instanced
>
```

---

## Implementation Tasks

### 1. Fix Mouse Events (CRITICAL)

**File**: `hexagonal-background-instanced.component.ts:171-203`

- Replace silent fail with reactive `effect()`
- Wait for `renderer()` and `camera()` signals to be non-null
- Only then call `setupHoverInteraction()`

**Code Change**:

```typescript
constructor() {
  afterNextRender(() => {
    this.createInstancedHexagons();

    const parent = this.parent();
    if (parent) {
      parent.add(this.instancedMesh);
    }

    // ✅ REACTIVE: Wait for renderer/camera to be available
    effect(() => {
      const renderer = this.sceneService.renderer();
      const camera = this.sceneService.camera();

      if (renderer && camera) {
        this.setupHoverInteraction();
      }
    });

    // Register animation loop
    const cleanup = this.renderLoop.registerUpdateCallback(() => {
      this.updateAnimation();
    });

    this.destroyRef.onDestroy(() => {
      cleanup();
      // ... existing cleanup
    });
  });
}
```

---

### 2. Add Geometry Flexibility

**File**: `hexagonal-background-instanced.component.ts:205-230`

- Add new inputs: `shape`, `customGeometry`
- Create `createGeometry()` helper method
- Support hexagon (6), diamond (4), octagon (8), square (4) sides

**Code Change**:

```typescript
private createGeometry(): THREE.BufferGeometry {
  const customGeom = this.customGeometry();
  if (customGeom) return customGeom;

  const sidesMap = {
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
  geometry.rotateX(Math.PI / 2); // Face camera
  return geometry;
}

private createInstancedHexagons(): void {
  const geometry = this.createGeometry(); // ← Use helper

  // ... rest of existing code
}
```

---

### 3. Enhanced Color Control (Shader Modifications)

**File**: `hexagonal-background-instanced.component.ts:232-314`

- Add new inputs: `edgeColor`, `edgePulse`, `hoverColor`
- Add uniforms for new color controls
- Modify TSL shader to support:
  - Static edge color OR pulsing palette
  - Custom hover color
  - Disable edge pulse option

**Code Changes**:

**Step 3a: Add Uniforms**:

```typescript
private edgeColorUniform!: THREE.UniformNode<THREE.Color | null>;
private edgePulseUniform!: THREE.UniformNode<number>;
private hoverColorUniform!: THREE.UniformNode<THREE.Color>;

// In createInstancedHexagons():
this.edgeColorUniform = uniform(
  this.edgeColor() ? new THREE.Color(this.edgeColor()!) : null
);
this.edgePulseUniform = uniform(this.edgePulse() ? 1.0 : 0.0);
this.hoverColorUniform = uniform(new THREE.Color(this.hoverColor()));
```

**Step 3b: Modify Shader Logic**:

```typescript
const edgeColorNode = Fn(() => {
  // Edge detection (existing)
  const edgeStart = mul(float(0.015), heightScale);
  const edgeEnd = mul(float(0.02).add(mul(float(1.0).sub(t), float(0.03))), heightScale);
  const edgeFactor = smoothstep(edgeStart, edgeEnd, abs(positionLocal.z));

  // ✨ NEW: Use edgeColor if set, else use colorPalette
  const useStaticEdgeColor = edgeColorUniform.notEqual(null);

  const staticEdgeColor = vec3(edgeColorUniform.x, edgeColorUniform.y, edgeColorUniform.z);

  // Pulsing palette color (existing logic)
  const phaseOffset = fract(mul(float(instanceIndex), float(0.618)));
  const t = mul(sin(mul(time, float(3.14159)).add(mul(phaseOffset, float(6.28)))), float(0.5)).add(float(0.5));

  // Select from palette
  const colorIdx = fract(mul(float(instanceIndex), float(0.25)));
  const color01 = mix(paletteColors[0], paletteColors[1], smoothstep(float(0.0), float(0.25), colorIdx));
  const color23 = mix(paletteColors[2], paletteColors[3], smoothstep(float(0.5), float(0.75), colorIdx));
  const selectedPaletteColor = mix(color01, color23, smoothstep(float(0.25), float(0.5), colorIdx));

  // ✨ NEW: Apply pulse or static
  const paletteWithPulse = mix(baseColor, selectedPaletteColor, mul(t, edgePulseUniform));

  // ✨ NEW: Choose edge color
  const edgeColor = useStaticEdgeColor ? staticEdgeColor : paletteWithPulse;

  // ✨ NEW: Use hoverColor for mouse influence
  const hoverColor = vec3(hoverColorUniform.x, hoverColorUniform.y, hoverColorUniform.z);

  // Face color (existing baseColor or hoverColor)
  const faceColor = mix(baseColor, hoverColor, mouseInfluence);

  // Mix edge/face based on edgeFactor
  return mix(edgeColor, faceColor, edgeFactor);
})();
```

---

### 4. Update Demo Usage

**File**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/backgrounds-section.component.ts:64-81`

Add example showcasing new features:

```html
<!-- Scene 3: NEW - Static Cyan Edges + Diamond Shape -->
<div class="bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
  <div class="h-[600px] relative">
    <a3d-scene-3d [cameraPosition]="[0, -3, 4]" [backgroundColor]="darkMagenta">
      <a3d-ambient-light [color]="colorNums.white" [intensity]="0.5" />
      <a3d-directional-light [color]="colorNums.blue" [intensity]="1.5" [position]="[100, -50, 50]" />

      <!-- ✨ NEW: Diamond shape with static cyan edges -->
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

---

### 5. Testing

**File**: `hexagonal-background-instanced.component.spec.ts` (create if missing)

- Test mouse event setup (verify listeners attached)
- Test shape variations (hexagon, diamond, octagon, square)
- Test color combinations (static edges, pulsing edges, hover colors)
- Test edge cases (null edgeColor, custom geometry)

---

## Acceptance Criteria

### Must Have (Critical)

- ✅ Mouse events work reliably (no race condition)
- ✅ Can set static edge color (separate from face color)
- ✅ Can disable edge pulsing animation
- ✅ Can switch between hexagon/diamond/octagon/square shapes

### Should Have

- ✅ Can set custom hover color
- ✅ Demo showcases new features
- ✅ Component API is backward-compatible (existing usage still works)

### Nice to Have

- ✅ Support custom geometry input (advanced users)
- ✅ Unit tests for new inputs

---

## Files to Modify

1. **libs/angular-3d/src/lib/primitives/backgrounds/hexagonal-background-instanced.component.ts** (PRIMARY)

   - Fix mouse event timing
   - Add new inputs (shape, edgeColor, edgePulse, hoverColor, customGeometry)
   - Refactor geometry creation
   - Modify shader color logic

2. **apps/angular-3d-demo/src/app/pages/angular-3d-showcase/sections/backgrounds-section.component.ts**

   - Add demo scene showcasing new features
   - Update documentation/comments

3. **libs/angular-3d/src/lib/primitives/backgrounds/hexagonal-background-instanced.component.spec.ts** (CREATE if missing)
   - Add unit tests for new functionality

---

## Notes

- **Backward Compatibility**: All new inputs have defaults that preserve existing behavior
- **WebGPU Compatibility**: TSL shader modifications maintain WebGPU support
- **Performance**: Geometry flexibility doesn't impact render performance (still instanced)
- **User Request**: Skip PM/Architect phases, go straight to team-leader + developers
