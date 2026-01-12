# Manual Testing Checklist - TASK_2026_002

**Component**: HexagonalBackgroundInstancedComponent
**Testing Date**: 2026-01-04
**Tester**: Team-Leader + Business-Analyst (validation pending)

---

## Test Environment Setup

**Prerequisites**:

1. Run `npx nx serve angular-3d-demo`
2. Navigate to: http://localhost:4200/angular-3d-showcase
3. Scroll to "Live Hexagonal Cloud Backgrounds" section
4. Verify 3 scenes are visible

---

## Batch 1 Tests: Core Bug Fix + Geometry Flexibility

### Test 1.1: Mouse Event Race Condition Fix (CRITICAL)

**Objective**: Verify mouse events are reliably attached (no race condition)

**Steps**:

1. Open demo page with hexagonal background
2. Move mouse over hexagons in Scene 1
3. Move mouse off canvas

**Expected Results**:

- [ ] Mouse hovering reveals bright faces (pulsing colors)
- [ ] Mouse leaving canvas returns faces to dark
- [ ] No console errors during interaction
- [ ] Consistent behavior on page reload (race condition eliminated)

**Validation Notes**:

- Test 5 times with hard refresh (Ctrl+Shift+R) to verify effect() pattern works
- If ANY reload shows non-interactive hexagons, test FAILS

---

### Test 1.2: Geometry Shapes (Task 1.2, 1.3)

**Objective**: Verify different shape types render correctly

**Steps**:

1. View Scene 1 (Hexagon - default)
2. View Scene 3 (Diamond - 4 sides)

**Expected Results**:

- [ ] Scene 1: Hexagon shapes visible (6 sides)
- [ ] Scene 3: Diamond shapes visible (4 sides, rotated orientation)
- [ ] Edge detection works for both shapes (edges glow)
- [ ] No geometry errors in console

**Optional Manual Tests** (not in demo):

- Modify Scene 3 `[shape]` to `'octagon'` (8 sides) - verify renders
- Modify Scene 3 `[shape]` to `'square'` (4 sides, aligned) - verify renders

---

## Batch 2 Tests: Enhanced Color Control

### Test 2.1: Static Edge Color (edgeColor + edgePulse=false)

**Objective**: Verify static edge colors work without pulsing

**Steps**:

1. View Scene 3 (Diamond Grid - Static Cyan Edges)
2. Observe edge glow color over 5 seconds

**Expected Results**:

- [ ] Edges are CYAN (not pulsing through palette colors)
- [ ] Edge color is STATIC (no animation over time)
- [ ] Edges do NOT change brightness (edgePulse=false working)

**Validation Notes**:

- If edges pulse or change color, test FAILS (edgePulse logic broken)
- If edges are not cyan, edgeColor uniform not working

---

### Test 2.2: Pulsing Edge Color (edgeColor + edgePulse=true)

**Objective**: Verify custom edge color can pulse

**Steps**:

1. Modify Scene 3: Change `[edgePulse]="false"` to `[edgePulse]="true"`
2. Observe edge glow behavior

**Expected Results**:

- [ ] Edges remain CYAN (base color)
- [ ] Edge brightness PULSES (animate over time)
- [ ] Pulsing is smooth and continuous

**Validation Notes**:

- Static cyan should pulse in brightness (fade in/out)
- Color should NOT shift to palette colors

---

### Test 2.3: Palette Fallback (edgeColor=null)

**Objective**: Verify default palette behavior when edgeColor is null

**Steps**:

1. View Scene 1 or Scene 2 (no edgeColor specified)
2. Observe edge colors over 10 seconds

**Expected Results**:

- [ ] Edges pulse through colorPalette colors (cyan, mint green, hot pink, white)
- [ ] Different hexagons have different colors (instanceIndex variation)
- [ ] Pulsing animation is continuous

**Validation Notes**:

- This is ORIGINAL behavior (backward compatibility test)
- If edges are all same color or not pulsing, test FAILS

---

### Test 2.4: Custom Hover Color

**Objective**: Verify custom hover color works

**Steps**:

1. View Scene 3 (hoverColor set to hotPink)
2. Move mouse over diamond shapes
3. Observe revealed face color

**Expected Results**:

- [ ] Faces reveal HOT PINK when mouse is near (not white)
- [ ] Color transitions smoothly based on distance
- [ ] Moving mouse away returns faces to dark

**Validation Notes**:

- Default hover color is white (0xffffff)
- Scene 3 should show pink (0xff6bd4) instead

---

## Backward Compatibility Tests

### Test 3.1: Existing Scenes Still Work

**Objective**: Verify new inputs don't break existing usage

**Steps**:

1. View Scene 1 and Scene 2 (no new inputs used)
2. Verify behavior matches original implementation

**Expected Results**:

- [ ] Scene 1: Pulsing palette edges (cyan/green/pink/white)
- [ ] Scene 2: Pulsing palette edges (red/green/blue/white)
- [ ] Mouse interaction works (white hover color default)
- [ ] No regressions in visual quality

---

## Edge Cases

### Test 4.1: edgeColor=null + edgePulse=false

**Objective**: Verify edge case handling (palette with no pulse)

**Steps**:

1. Create test scene with:
   - `[edgeColor]="null"`
   - `[edgePulse]="false"`
2. Observe edge behavior

**Expected Results**:

- [ ] Edges use palette colors (fallback to colorPalette)
- [ ] Edges are STATIC (no pulsing - blend factor 0)

**Validation Notes**:

- This is edge case: palette-based static color
- paletteWithPulse should use `mul(t, this.edgePulseUniform)` where edgePulseUniform=0

---

### Test 4.2: Custom Geometry with Z Variation

**Objective**: Verify edge detection works with custom geometry (if implemented)

**Steps**:

1. Only if customGeometry is provided by user
2. Geometry must have positionLocal.z variation

**Expected Results**:

- [ ] Custom geometry renders
- [ ] Edge detection still works (glow visible)

**Validation Notes**:

- SKIP if no custom geometry provided
- This validates TSDoc warning in code

---

### Test 4.3: Shape Changes (Dynamic Update)

**Objective**: Verify changing shape input updates geometry

**Steps**:

1. Manually change Scene 3 `[shape]` from `'diamond'` to `'octagon'`
2. Save and observe hot reload

**Expected Results**:

- [ ] Geometry updates to octagon (8 sides)
- [ ] No errors during hot reload
- [ ] Edge detection still works

**Validation Notes**:

- Signal inputs should trigger reactive updates
- If geometry doesn't update, signal reactivity broken

---

## Performance & Stability

### Test 5.1: No Console Errors

**Objective**: Verify no runtime errors

**Steps**:

1. Open browser DevTools Console
2. Load demo page
3. Interact with all 3 scenes

**Expected Results**:

- [ ] No errors in console
- [ ] No warnings about missing uniforms
- [ ] No shader compilation errors

---

### Test 5.2: Smooth 60fps Rendering

**Objective**: Verify performance is acceptable

**Steps**:

1. Open browser DevTools Performance tab
2. Record 10 seconds of Scene 3 animation
3. Check frame rate

**Expected Results**:

- [ ] Consistent 60fps (or monitor refresh rate)
- [ ] No dropped frames during mouse interaction
- [ ] Smooth animations (depth bobbing, rotation wobble)

---

## Summary

**Total Tests**: 15
**Critical Tests**: Test 1.1, Test 2.1, Test 3.1
**Optional Tests**: Test 1.2 (manual shape changes), Test 4.2 (custom geometry)

**Testing Protocol**:

1. Run ALL tests in order
2. Mark each checkbox as PASS or FAIL
3. Document any failures with screenshots
4. Report blockers to team-leader

**Acceptance Criteria**:

- ALL critical tests must PASS
- At least 90% of all tests must PASS
- No regressions in existing scenes

---

## Notes for Testers

**Known Limitations**:

- Custom geometry feature is advanced - most users won't use it
- edgeColor=null + edgePulse=false is edge case - unlikely in practice
- Shape changes require code edit (no dynamic UI control in demo yet)

**Debugging Tips**:

- If mouse events don't work: Check console for errors, verify effect() runs once
- If colors wrong: Check uniform initialization in createInstancedHexagons()
- If shader broken: Check for TSL syntax errors in edgeColorNode

**Future Enhancements** (out of scope for this task):

- [ ] UI controls for dynamic shape/color changes in demo
- [ ] Unit tests for shader logic
- [ ] Visual regression tests
