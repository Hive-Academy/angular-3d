# Task Context - TASK_2026_003

**Task ID**: TASK_2026_003
**Created**: 2026-01-04
**Type**: REFACTORING
**Complexity**: Medium
**Branch**: feature/TASK_2026_003-glass-sphere-visual-refinement

---

## User Intent

Fix visual discrepancies in the existing `glass-sphere-hero-section.component.ts` to match the reference screenshot (docs/Screenshot 2026-01-03 205300.png):

1. **Sphere Colors/Lighting**: Currently looks inverted - needs warm peachy gradient to match reference
2. **Beam Particles**: Currently appear as elongated streaks - should be small glowing particles emitting from sphere

**Critical Context**: User spent days attempting inner particle systems (Gaussian distribution, etc.) without success. This task focuses ONLY on:

- Fixing sphere material colors and lighting
- Converting beam geometry to small point-like particles
- NO work on complex inner particle distributions

---

## Related Work

- **TASK_2025_033**: Created new components (SparkleCoronaComponent, GlassSphereSceneComponent) - different approach
- **Visual Analysis Document**: `docs/visual-analysis-and-plan.md` - contains detailed analysis of reference vs current implementation
- **Current Implementation**: `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`
- **Library Component**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts` - beam system implementation

---

## Technical Context

### Current State (Problem)

**Sphere**:

- Color: `#ffe8d7` (too cream/white)
- Appears "inverted" compared to reference
- Reference has: Warm coral/peach gradient (#ffd4a3 → #ffe8d7)

**Particles**:

- Geometry: `PlaneGeometry(beamWidth: 0.05, beamLength: 2.0)` - creates elongated streaks
- Behavior: Radiating outward from sphere surface
- Reference has: Small circular glowing particles (not elongated beams)

### Target State (Solution)

**Sphere**:

- Base color: `#ffd4a3` (warmer peachy)
- Edge glow: `#ffaa77` (warmer orange)
- Opacity: `0.12` (slightly more transparent)

**Particles**:

- Geometry: Small squares with circular alpha falloff (simulate round particles)
- Size: Much smaller, varying sizes
- Colors: 5-color palette (white, cream, light coral, coral, orange)
- Keep radial emission behavior (user is okay with this)

---

## Execution Strategy

**REFACTORING** workflow:

1. Project Manager (skip - requirements clear from context)
2. Software Architect → implementation plan
3. Team Leader → decompose into tasks
4. Frontend Developer → implement fixes
5. QA (user choice)
6. Git operations
7. Modernization detector

---

## Files in Scope

### MODIFY

- `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts` - parameter adjustments
- `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts` - beam → particle conversion

### REFERENCE (read-only)

- `docs/visual-analysis-and-plan.md` - detailed visual analysis
- `docs/Screenshot 2026-01-03 205300.png` - target reference
- `apps/angular-3d-demo/src/app/shared/colors.ts` - color palette

---

## Success Criteria

1. ✅ Sphere has warm peachy/coral gradient (not cool cream)
2. ✅ Particles appear as small glowing dots (not elongated beams)
3. ✅ 5-color particle palette visible (white → coral → orange)
4. ✅ Visual match to reference screenshot
5. ✅ 60fps performance maintained
6. ✅ No complex inner particle systems (keep it simple)
