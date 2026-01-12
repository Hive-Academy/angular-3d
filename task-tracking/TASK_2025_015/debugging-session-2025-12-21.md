# TASK_2025_015 - Debugging Session (2025-12-21)

## Session Summary

This document captures the debugging progress for the Angular-3D architecture migration, specifically the issues encountered with the new hostDirectives-based component pattern.

---

## Issues Fixed This Session

### Issue 1: NG0201 - No provider for InjectionToken OBJECT_ID

**Error:**

```
NG0201: No provider for InjectionToken OBJECT_ID found
```

**Root Cause:**
`StandardMaterialDirective` used `{ skipSelf: true }` when injecting OBJECT_ID, which incorrectly skipped the component's providers where OBJECT_ID is defined.

**File:** `libs/angular-3d/src/lib/directives/materials/standard-material.directive.ts`

**Fix:**

```typescript
// BEFORE (WRONG)
private readonly objectId = inject(OBJECT_ID, { skipSelf: true });

// AFTER (FIXED)
private readonly objectId = inject(OBJECT_ID, { optional: true });
```

---

### Issue 2: NG0203 - effect() outside injection context

**Error:**

```
NG0203: effect() can only be used within an injection context
```

**Root Cause:**
`GltfModelComponent` called `effect()` inside `afterNextRender()` callback, which is outside the injection context.

**File:** `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`

**Fix:**
Moved `effect()` calls from inside `afterNextRender()` to the constructor level where injection context exists.

---

## Current Issue: Visual Rendering Problem

### Symptoms

- App runs without errors
- Hero section shows a "large solid teal shape" instead of:
  - Multiple wireframe polyhedrons at different positions
  - GLTF robot model
  - Star field (stars ARE visible)

### Debug Logging Added

Added console logging to trace OBJECT_ID injection and effect execution in:

- `transform.directive.ts` - Logs position/rotation/scale application
- `mesh.directive.ts` - Logs mesh creation and registration
- `standard-material.directive.ts` - Logs material creation with color/wireframe
- `rotate-3d.directive.ts` - Logs OBJECT_ID injection
- `float-3d.directive.ts` - Logs OBJECT_ID injection
- All light directives - Added optional injection

### Log Analysis

Logs show **correct values being set**:

```
[StandardMaterialDirective] Effect1: Creating material with color= #4FFFDF wireframe= true
[TransformDirective] Effect: Applying transform pos= [-2,-1.5,-1] rot= [0,0,0] scl= [1,1,1]
[MeshDirective] Mesh registered successfully: polyhedron-xxxxx
```

Despite correct log output, the visual is wrong.

---

## Root Cause Analysis: Timing/Race Condition

### The Problem

`Float3dDirective` captures `originalPosition` from the mesh BEFORE `TransformDirective` applies the correct position.

**In `float-3d.directive.ts` line 133:**

```typescript
this.originalPosition = [m.position.x, m.position.y, m.position.z];
```

### Execution Order Issue

1. `MeshDirective` creates mesh at position `[0, 0, 0]` and registers with store
2. `Float3dDirective.effect()` runs, stores `originalPosition = [0, 0, 0]` (WRONG!)
3. `TransformDirective.effect()` runs, applies position `[-2, -1.5, -1]`
4. `Float3dDirective` animates Y relative to `0`, overwriting the correct Y position

### Result

- All floating polyhedrons animate around Y=0 instead of their intended Y positions
- Meshes overlap near the center, appearing as one large shape
- Wireframe IS set correctly, but overlapping wireframes appear solid

### Affected Components

In `hero-3d-teaser.component.ts`, two polyhedrons use `float3d`:

```html
<a3d-polyhedron [position]="[4, 2.5, -4]" float3d [floatConfig]="{ height: 0.3, speed: 3500 }" />

<a3d-polyhedron [position]="[-2, -1.5, -1]" float3d [floatConfig]="{ height: 0.2, speed: 3000 }" />
```

Both have their Y positions corrupted by Float3dDirective.

---

## Solution Options

### Option 1: Defer Float3dDirective Initialization

Wait until TransformDirective has applied transforms before capturing `originalPosition`.

**Implementation idea:**

```typescript
// In Float3dDirective, wait for a frame after mesh is detected
effect(() => {
  const m = this.mesh();
  if (m && !this.gsapTimeline) {
    // Defer to next frame to allow TransformDirective to apply first
    requestAnimationFrame(() => {
      this.originalPosition = [m.position.x, m.position.y, m.position.z];
      this.createFloatingAnimation(m, config);
    });
  }
});
```

### Option 2: Read Position from Input Signal

Instead of reading from mesh object, read from the `position` input signal which has the correct value immediately.

**Challenge:** Float3dDirective doesn't have access to the host component's position input.

### Option 3: Add "Transforms Applied" Signal

TransformDirective could signal when it's done, and Float3dDirective waits for this.

**Implementation idea:**

```typescript
// In TransformDirective
public readonly transformsApplied = signal(false);

effect(() => {
  // ... apply transforms ...
  this.transformsApplied.set(true);
});

// Float3dDirective injects and waits for this signal
```

### Option 4: Use Store for Original Position

Store the intended position in SceneGraphStore when registering, and Float3dDirective reads from there instead of the mesh object.

---

## Files Modified This Session

### With Fixes Applied

- `libs/angular-3d/src/lib/directives/materials/standard-material.directive.ts`
- `libs/angular-3d/src/lib/primitives/gltf-model.component.ts`

### With Debug Logging Added (to be removed after fix)

- `libs/angular-3d/src/lib/directives/transform.directive.ts`
- `libs/angular-3d/src/lib/directives/mesh.directive.ts`
- `libs/angular-3d/src/lib/directives/materials/standard-material.directive.ts`
- `libs/angular-3d/src/lib/directives/rotate-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/float-3d.directive.ts`
- `libs/angular-3d/src/lib/directives/lights/*.directive.ts`
- `libs/angular-3d/src/lib/directives/group.directive.ts`
- `libs/angular-3d/src/lib/directives/light.directive.ts`

---

## Related Tasks

- **TASK_2025_015**: Angular-3D Architecture Migration (current task)
- **TASK_2025_016**: Viewport 3D Positioning Feature (NOT related to this issue - separate feature)

---

## Next Steps

1. Choose a solution option for the Float3dDirective timing issue
2. Implement the fix
3. Test with hero-3d-teaser scene
4. Remove debug logging from all files
5. Continue with remaining TASK_2025_015 work

---

## How to Test

```bash
# Start the dev server
npx nx serve angular-3d-demo

# Navigate to http://localhost:4200
# Check the hero section for:
# - Multiple wireframe polyhedrons at different positions
# - Floating animation working correctly
# - Robot GLTF model visible
# - Star field visible
```

---

## Key Files to Review

| File                                                                | Purpose                           |
| ------------------------------------------------------------------- | --------------------------------- |
| `libs/angular-3d/src/lib/directives/float-3d.directive.ts`          | Contains the timing bug           |
| `libs/angular-3d/src/lib/directives/transform.directive.ts`         | Applies transforms to meshes      |
| `apps/angular-3d-demo/src/app/sections/hero-3d-teaser.component.ts` | Scene that exhibits the issue     |
| `libs/angular-3d/src/lib/store/scene-graph.store.ts`                | Central store for mesh management |
