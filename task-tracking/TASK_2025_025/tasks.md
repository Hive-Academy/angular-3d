# Development Tasks - TASK_2025_025

**Total Tasks**: 8 | **Batches**: 3 | **Status**: 3/3 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- ✅ All three text components missing SceneGraphStore integration (TroikaTextComponent, GlowTroikaTextComponent, SmokeTroikaTextComponent)
- ✅ Pattern from GltfModelComponent is correct reference
- ✅ Memory leak in SmokeTroikaTextComponent confirmed (effect creates new callback on each `enableFlow()` change)

### Risks Identified

| Risk                                                                | Severity | Mitigation                                                         |
| ------------------------------------------------------------------- | -------- | ------------------------------------------------------------------ |
| Memory leak in render loop effect creates multiple callbacks        | HIGH     | Task 1.3 - Fix render loop to register ONCE, execute conditionally |
| **CRITICAL: Bloom not rendering - missing effect-composer wrapper** | HIGH     | Task 3.1 - Wrap bloom in effect-composer                           |
| Text components use Text object (not Group like GLTF)               | MEDIUM   | Verify Text extends Object3D, register directly                    |
| Ambient light too dim (0.08) - objects barely visible               | MEDIUM   | Task 3.2 - Increase to 0.3                                         |
| Bloom threshold too high (0.7) - no spheres bloom                   | MEDIUM   | Task 3.3 - Lower to 0.3                                            |
| Nebulas too far/faint (z=-25/-30)                                   | LOW      | Task 3.4 - Move closer, increase opacity                           |
| Hero scene has fixed positions needing conversion                   | LOW      | Task 2.1 - Replace [position] with viewportPosition                |

### Edge Cases to Handle

- [x] Memory leak when enableFlow toggles multiple times → Task 1.3 (register once, execute conditionally)
- [x] Text object registration (not Group like GLTF) → Use textObject directly (it's THREE.Object3D)

---

## Batch 1: Library Components - SceneGraphStore Integration ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None
**Commit**: c7b3560

### Task 1.1: Add SceneGraphStore integration to TroikaTextComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\troika-text.component.ts
**Spec Reference**: context.md:52-64 (Reference Pattern from GltfModelComponent)
**Pattern to Follow**: gltf-model.component.ts:14-15,47-48,119-120,136

**Quality Requirements**:

- Import SceneGraphStore and inject in constructor
- Register textObject with sceneStore after adding to parent (line ~370)
- Unregister in cleanup (effect onCleanup + destroyRef.onDestroy)
- Follow exact pattern from GltfModelComponent

**Implementation Details**:

- Imports: Add `SceneGraphStore` from `'../../store/scene-graph.store'`
- Inject: `private readonly sceneStore = inject(SceneGraphStore);`
- Inject: `private readonly objectId = inject(OBJECT_ID);` (already has OBJECT_ID provider)
- Register: `this.sceneStore.register(this.objectId, this.textObject, 'text');` (after parent.add)
- Cleanup: `this.sceneStore.remove(this.objectId);` (in effect onCleanup + destroyRef.onDestroy)

**Key Logic**:

```typescript
// In effect after parent.add(this.textObject) - line ~370
this.sceneStore.register(this.objectId, this.textObject, 'text');

// In effect onCleanup and destroyRef.onDestroy
this.sceneStore.remove(this.objectId);
```

---

### Task 1.2: Add SceneGraphStore integration to GlowTroikaTextComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\glow-troika-text.component.ts
**Dependencies**: None (can run parallel with Task 1.1)
**Spec Reference**: context.md:52-64 (Reference Pattern from GltfModelComponent)
**Pattern to Follow**: gltf-model.component.ts:14-15,47-48,119-120,136

**Quality Requirements**:

- Import SceneGraphStore and inject in constructor
- Register textObject with sceneStore after adding to parent (line ~330)
- Unregister in cleanup (effect onCleanup + destroyRef.onDestroy)
- Follow exact pattern from GltfModelComponent

**Implementation Details**:

- Imports: Add `SceneGraphStore` from `'../../store/scene-graph.store'`
- Inject: `private readonly sceneStore = inject(SceneGraphStore);`
- Inject: `private readonly objectId = inject(OBJECT_ID);` (already has OBJECT_ID provider)
- Register: `this.sceneStore.register(this.objectId, this.textObject, 'text');` (after parent.add)
- Cleanup: `this.sceneStore.remove(this.objectId);` (in effect onCleanup + destroyRef.onDestroy)

**Key Logic**:

```typescript
// In effect after parent.add(this.textObject) - line ~330
this.sceneStore.register(this.objectId, this.textObject, 'text');

// In effect onCleanup and destroyRef.onDestroy
this.sceneStore.remove(this.objectId);
```

---

### Task 1.3: Add SceneGraphStore integration + fix memory leak in SmokeTroikaTextComponent ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\text\smoke-troika-text.component.ts
**Dependencies**: None (can run parallel with Task 1.1, 1.2)
**Spec Reference**: context.md:52-76 (Reference Pattern + Memory Leak Fix)
**Pattern to Follow**: gltf-model.component.ts:14-15,47-48,119-120,136

**Quality Requirements**:

- Import SceneGraphStore and inject in constructor
- Register textObject with sceneStore after adding to parent (line ~374)
- Unregister in cleanup (effect onCleanup + destroyRef.onDestroy)
- FIX MEMORY LEAK: Render loop effect (lines 408-429) creates new callback on each `enableFlow()` change
- Follow exact pattern from GltfModelComponent

**Validation Notes**:

- ⚠️ **MEMORY LEAK RISK**: Current effect at lines 408-429 creates NEW callback every time `enableFlow()` toggles
- If `enableFlow()` goes `false → true → false → true`, multiple callbacks leak (only last cleanup stored)
- **FIX**: Register callback ONCE in constructor, execute conditionally based on signal

**Implementation Details**:

**Part A: SceneGraphStore Integration**

- Imports: Add `SceneGraphStore` from `'../../store/scene-graph.store'`
- Inject: `private readonly sceneStore = inject(SceneGraphStore);`
- Inject: `private readonly objectId = inject(OBJECT_ID);` (already has OBJECT_ID provider)
- Register: `this.sceneStore.register(this.objectId, this.textObject, 'text');` (after parent.add)
- Cleanup: `this.sceneStore.remove(this.objectId);` (in effect onCleanup + destroyRef.onDestroy)

**Part B: Memory Leak Fix**

- REMOVE: Lines 408-429 (effect that conditionally registers/unregisters)
- REPLACE WITH: Register callback ONCE in constructor, execute conditionally

**Key Logic**:

```typescript
// PART A: SceneGraphStore (in effect after parent.add - line ~374)
this.sceneStore.register(this.objectId, this.textObject, 'text');

// PART A: Cleanup (in effect onCleanup + destroyRef.onDestroy)
this.sceneStore.remove(this.objectId);

// PART B: Fix memory leak - REPLACE lines 408-429 with:
// Register ONCE in constructor (NOT inside effect)
this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta) => {
  // Execute conditionally based on signal
  if (this.enableFlow() && this.smokeMaterial) {
    this.smokeMaterial.uniforms['uTime'].value += delta * this.flowSpeed();
  }
});

// Cleanup stays in destroyRef.onDestroy (line 455)
```

---

**Batch 1 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Memory leak fixed (no multiple callback registrations)
- All text components can use viewportPosition directive

---

## Batch 2: Demo Application - Hero Scene Positioning ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batch 1 must be complete
**Commit**: f0d02ed

### Task 2.1: Update hero scene to use viewportPosition for text elements ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts
**Dependencies**: Batch 1 complete (text components must have SceneGraphStore integration)
**Spec Reference**: context.md:1-9 (User Intent - text on LEFT side using viewport positioning)

**Quality Requirements**:

- Replace fixed [position] with viewportPosition directive for heading text
- Replace fixed [position] with viewportPosition directive for description text
- Background smoke text can keep fixed position (decorative element)
- Text should be on LEFT side of screen (Earth is already at 70% right)
- Maintain readability and visual hierarchy

**Implementation Details**:

**Current State** (lines 122-179):

- Heading text: Uses fixed `[position]` coordinates (line 128, 138, 150)
- Description text: Uses fixed `[position]` with z=22 (lines 165, 174)
- Earth: Already uses `viewportPosition="{ x: '70%', y: '50%' }"` (line 96)

**Changes Required**:

1. **Heading Line 1 - "Build "** (line 125-134)

   - REMOVE: `[position]="[-11, 3.5, 0]"`
   - ADD: `viewportPosition="top-left"` + `[viewportOffset]="{ offsetX: 2, offsetY: -3, offsetZ: 0 }"`

2. **Heading Line 1 - "Stunning"** (line 135-144)

   - REMOVE: `[position]="[-5.5, 4.5, 0]"`
   - ADD: `viewportPosition="top-left"` + `[viewportOffset]="{ offsetX: 6, offsetY: -2.5, offsetZ: 0 }"`

3. **Heading Line 2 - "Angular Experiences"** (line 147-156)

   - REMOVE: `[position]="[-11, 2.5, 0]"`
   - ADD: `viewportPosition="top-left"` + `[viewportOffset]="{ offsetX: 2, offsetY: -4.5, offsetZ: 0 }"`

4. **Description Line 1** (line 162-170)

   - REMOVE: `[position]="[-10.91, -1.5, 22]"`
   - ADD: `viewportPosition="center-left"` + `[viewportOffset]="{ offsetX: 1, offsetY: -1, offsetZ: 22 }"`

5. **Description Line 2** (line 171-179)

   - REMOVE: `[position]="[-10.91, -2.5, 22]"`
   - ADD: `viewportPosition="center-left"` + `[viewportOffset]="{ offsetX: 1, offsetY: -2, offsetZ: 22 }"`

6. **Background Smoke Text** (line 107-119)
   - KEEP: `[position]="[2, 0, -5]"` (decorative, doesn't need responsive positioning)

**Key Logic**:

```html
<!-- BEFORE -->
<a3d-glow-troika-text text="Build " [fontSize]="1.8" [position]="[-11, 3.5, 0]" anchorX="left" anchorY="middle" ... />

<!-- AFTER -->
<a3d-glow-troika-text text="Build " [fontSize]="1.8" viewportPosition="top-left" [viewportOffset]="{ offsetX: 2, offsetY: -3, offsetZ: 0 }" anchorX="left" anchorY="middle" ... />
```

---

**Batch 2 Verification**:

- All files exist at paths
- Build passes: `npx nx build angular-3d-demo`
- Text elements positioned on LEFT side of screen
- Text remains readable and maintains hierarchy
- Responsive positioning works across viewport sizes

---

## Batch 3: Demo Application - Rendering Fixes (Bloom/Lighting/Nebula) ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 1 complete (library fixes must be done first)
**Commit**: e02b1a9

### Task 3.1: CRITICAL - Wrap bloom effect in effect-composer ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts
**Dependencies**: None
**Priority**: CRITICAL - Without this fix, bloom will NEVER work

**Root Cause Analysis**:

- `BloomEffectComponent` requires `EffectComposerService` to be initialized
- `EffectComposerService` is initialized by `EffectComposerComponent`
- Without the wrapper, the service never calls `init()`, composer never replaces render function
- Bloom pass is added to composer, but composer never renders

**Quality Requirements**:

- Import `EffectComposerComponent` from `@hive-academy/angular-3d`
- Wrap existing `<a3d-bloom-effect>` in `<a3d-effect-composer>`
- Maintain same bloom settings (threshold, strength, radius)

**Implementation Details**:

**BEFORE** (line 341):

```html
<a3d-bloom-effect [threshold]="0.7" [strength]="0.6" [radius]="0.5" />
```

**AFTER**:

```html
<a3d-effect-composer [enabled]="true">
  <a3d-bloom-effect [threshold]="0.3" [strength]="0.6" [radius]="0.5" />
</a3d-effect-composer>
```

**Note**: Also lowering threshold from 0.7 to 0.3 (see Task 3.3)

---

### Task 3.2: Increase ambient light intensity ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts
**Dependencies**: None

**Root Cause Analysis**:

- Current ambient light intensity is 0.08 (extremely dim)
- Without sufficient lighting, objects appear very dark
- Nebula volumetric uses additive blending, requires scene brightness

**Quality Requirements**:

- Increase ambient light intensity from 0.08 to 0.3
- Maintain dark space atmosphere while making objects visible

**Implementation Details**:

**BEFORE** (line 77):

```html
<a3d-ambient-light [color]="colors.white" [intensity]="0.08" />
```

**AFTER**:

```html
<a3d-ambient-light [color]="colors.white" [intensity]="0.3" />
```

---

### Task 3.3: Lower bloom threshold ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts
**Dependencies**: Task 3.1 (effect-composer must be added first)

**Root Cause Analysis**:

- Current bloom threshold is 0.7 (very high)
- Floating spheres don't have emissive materials
- Only objects with luminance > 0.7 will bloom
- GlowTroikaText has emissive, but spheres don't

**Quality Requirements**:

- Lower bloom threshold from 0.7 to 0.3
- Makes bloom visible on more scene objects
- Glow text will bloom more prominently

**Implementation Details**:
Combined with Task 3.1 - threshold changed in effect-composer wrapper

---

### Task 3.4: Adjust nebula positioning and opacity ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts
**Dependencies**: None

**Root Cause Analysis**:

- Nebulas positioned at very deep z-values (-25 and -30)
- Camera starts at z=20, so nebulas are 45-50 units away
- Low opacity (0.85 and 0.6) makes distant nebulas faint
- Additive blending with low scene brightness = barely visible

**Quality Requirements**:

- Move primary nebula from z=-25 to z=-15
- Move secondary nebula from z=-30 to z=-18
- Increase opacity (0.85→0.95, 0.6→0.8)

**Implementation Details**:

**BEFORE** (lines 302-320):

```html
<a3d-nebula-volumetric viewportPosition="top-right" [viewportOffset]="{ offsetZ: -25 }" [opacity]="0.85" ... /> <a3d-nebula-volumetric viewportPosition="bottom-left" [viewportOffset]="{ offsetZ: -30 }" [opacity]="0.6" ... />
```

**AFTER**:

```html
<a3d-nebula-volumetric viewportPosition="top-right" [viewportOffset]="{ offsetZ: -15 }" [opacity]="0.95" ... /> <a3d-nebula-volumetric viewportPosition="bottom-left" [viewportOffset]="{ offsetZ: -18 }" [opacity]="0.8" ... />
```

---

**Batch 3 Verification**:

- Build passes: `npx nx build angular-3d-demo`
- Bloom effect visible on glow-troika-text components
- Scene is brighter and objects are visible
- Nebulas appear in background
- Overall visual quality improved

---

## Status Icons Reference

| Status         | Meaning                         | Who Sets              |
| -------------- | ------------------------------- | --------------------- |
| ⏸️ PENDING     | Not started                     | team-leader (initial) |
| 🔄 IN PROGRESS | Assigned to developer           | team-leader           |
| 🔄 IMPLEMENTED | Developer done, awaiting verify | developer             |
| ✅ COMPLETE    | Verified and committed          | team-leader           |
| ❌ FAILED      | Verification failed             | team-leader           |
