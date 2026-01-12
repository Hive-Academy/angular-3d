# Task Context - TASK_2025_031

## Task Information

| Field     | Value                                      |
| --------- | ------------------------------------------ |
| Task ID   | TASK_2025_031                              |
| Created   | 2025-12-28                                 |
| Type      | BUG FIX / COMPLETION (incomplete Task 028) |
| Priority  | P0 - Critical (Broken UI)                  |
| Requestor | User                                       |

---

## User Intent

Complete the WebGPU TSL migration that was incorrectly skipped during TASK_2025_028. The developer made an unauthorized architectural decision to keep GLSL shaders instead of migrating to TSL as planned, causing material compatibility errors when WebGPU falls back to WebGL.

---

## Problem Statement

### Current Symptoms

- Hero section shows black screen (broken 3D rendering)
- Console errors: `THREE.NodeMaterial: Material "ShaderMaterial" is not compatible`
- Console errors: `THREE.NodeMaterial: Material "MeshDepthMaterial" is not compatible`
- Post-processing effects fail entirely

### Root Cause

Components import `ShaderMaterial` from `three/webgpu`, but `three/webgpu`'s ShaderMaterial is a NodeMaterial variant that does NOT support GLSL strings. When WebGPU is unavailable and the renderer falls back to WebGL, these materials fail.

### What Was Supposed to Happen (Task 028 Plan)

According to `TASK_2025_028/implementation-plan.md` Section 4 "Category C":

- Convert GLSL shaders to TSL (Three.js Shading Language)
- TSL compiles to WGSL for WebGPU AND GLSL for WebGL fallback
- This was planned for 5 components and 5 post-processing effects

### What Actually Happened

Developer made unilateral "Architecture Decision" to skip TSL migration:

> "Keep GLSL ShaderMaterial with WebGPU import fallback"
> "TSL doesn't have equivalent Simplex noise functions"

This was done WITHOUT escalating to architect or user, violating proper process (now documented in updated developer agent escalation protocol).

---

## Affected Components

### Category C - Custom GLSL to TSL (5 files)

1. `primitives/nebula-volumetric.component.ts` (~220 lines GLSL)
2. `primitives/cloud-layer.component.ts` (~100 lines GLSL)
3. `primitives/text/bubble-text.component.ts` (~35 lines GLSL)
4. `primitives/text/smoke-troika-text.component.ts` (~170 lines GLSL)
5. `directives/materials/shader-material.directive.ts` (API redesign needed)

### Category D - Post-Processing (5 files)

6. `postprocessing/effect-composer.service.ts` (three-stdlib → native PostProcessing)
7. `postprocessing/effects/bloom-effect.component.ts` (UnrealBloomPass → TSL bloom())
8. `postprocessing/effects/dof-effect.component.ts` (BokehPass → TSL dof())
9. `postprocessing/effects/ssao-effect.component.ts` (custom TSL or WebGL-only)
10. `postprocessing/effects/color-grading-effect.component.ts` (TSL operations)

### Discovered During Investigation

11. `primitives/metaball.component.ts` (also uses GLSL ShaderMaterial)

---

## Success Criteria

1. **All affected components render correctly** on both WebGPU and WebGL fallback
2. **No console errors** related to material compatibility
3. **Post-processing effects work** (bloom, DOF, color grading)
4. **Visual parity** maintained (effects look the same as before)
5. **Demo app fully functional** at http://localhost:4200/

---

## Related Documents

- `TASK_2025_028/implementation-plan.md` - Original plan (Section 4 was skipped)
- `TASK_2025_028/tasks.md` - Shows Batch 6 "Architecture Decision"
- `TASK_2025_028/future-enhancements.md` - Documented as deferred work

---

## Process Improvement Applied

Before starting this task, escalation protocols were added to:

- `.claude/agents/backend-developer.md`
- `.claude/agents/frontend-developer.md`

This prevents future developers from making unauthorized architectural decisions.
