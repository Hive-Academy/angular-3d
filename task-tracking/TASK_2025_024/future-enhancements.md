# Future Enhancements - TASK_2025_024

**Task**: Refactor particle text to Troika-based smoke/glow variants
**Status**: Complete with technical debt identified
**Review Date**: 2025-12-23

---

## Technical Debt Summary

Both code reviewers identified areas for improvement in `SmokeTroikaTextComponent`. These are tracked here for future iterations.

---

## Critical Priority (Next Sprint)

### 1. SDF Texture Integration Investigation

**File**: `libs/angular-3d/src/lib/primitives/text/smoke-troika-text.component.ts`
**Issue**: Fragment shader may not be sampling Troika's SDF texture, potentially affecting text visibility.

**Action Required**:

- Visually verify text renders correctly in demo app
- If text not visible, implement one of:
  - **Option A**: Research Troika's shader API to access SDF texture uniform and integrate into fragment shader
  - **Option B**: Use layer-based approach (shader plane behind solid Troika text)

**Reference**: Code Logic Review - Critical Issue #1

### 2. Render Loop Memory Leak Fix

**File**: `smoke-troika-text.component.ts:408-429`
**Issue**: Rapid `enableFlow` toggling registers multiple render callbacks without cleanup.

**Fix Pattern** (from NebulaVolumetricComponent):

```typescript
// Register ONCE in constructor, execute conditionally
this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta) => {
  if (this.enableFlow() && this.smokeMaterial) {
    this.smokeMaterial.uniforms['uTime'].value += delta * this.flowSpeed();
  }
});
```

---

## High Priority

### 3. Material Creation Timing Consistency

**File**: `smoke-troika-text.component.ts:365-367`
**Issue**: Creates material inline during text initialization effect. GlowTroikaTextComponent uses separate effect for material creation.

**Recommendation**: Extract material creation to separate effect for better reactivity to property changes.

### 4. Effect Cleanup for Shader Uniforms

**File**: `smoke-troika-text.component.ts:392-405`
**Issue**: Shader uniforms update effect lacks `onCleanup` registration.

**Fix**: Add `onCleanup` parameter to effect.

### 5. Remove Unused `color` Input

**File**: `smoke-troika-text.component.ts:91`
**Issue**: `color` input declared but never used - smoke shader controls color via `smokeColor`.

**Options**:

- Remove `color` input entirely (recommended)
- OR use as base color in shader blend

---

## Medium Priority

### 6. Extract Shader to Constants File

**File**: `smoke-troika-text.component.ts:495-677`
**Issue**: 183 lines of embedded GLSL shader code.

**Recommendation**:

```typescript
// New file: smoke-shader.constants.ts
export const SMOKE_VERTEX_SHADER = `...`;
export const SMOKE_FRAGMENT_SHADER = `...`;
export const SMOKE_NOISE_FUNCTIONS = `...`; // Reusable for other effects
```

### 7. Property Naming Standardization

**Issue**: Inconsistent naming between text effect components:

- GlowTroikaTextComponent: `glowOutlineWidth`
- SmokeTroikaTextComponent: `outlineWidth`

**Recommendation**: Use effect-specific prefixes (`smokeOutlineWidth`) for specialty components.

### 8. Billboard vs Rotation Conflict

**File**: `smoke-troika-text.component.ts:446-450, 720`
**Issue**: Billboard mode overwrites quaternion every frame, conflicting with manual rotation input.

**Fix Options**:

- Validation warning when both enabled
- Document mutual exclusivity in JSDoc
- Use quaternion multiplication to blend

### 9. Font Load Error Handling

**File**: `smoke-troika-text.component.ts:370-375`
**Issue**: No error handling for font load failures (404, CORS, corrupted).

**Recommendation**: Add error callback + timeout fallback.

### 10. Resource Disposal Order

**File**: `smoke-troika-text.component.ts:454-463`
**Issue**: Disposes shader material before Text object (potential double-dispose).

**Fix**: Follow GlowTroikaTextComponent pattern - only dispose Text object, let it handle material internally.

---

## Low Priority

### 11. Input Validation for Numeric Ranges

Add validation for smoke properties to prevent shader artifacts:

```typescript
const intensity = Math.max(0, Math.min(10, this.smokeIntensity()));
const flowSpeed = Math.max(0, Math.min(5, this.flowSpeed()));
```

### 12. Property Documentation

Add JSDoc warnings for properties incompatible with shader rendering:

```typescript
/**
 * @warning This property is NOT supported in smoke shader mode.
 *          Use smokeIntensity instead.
 */
```

### 13. Consider Directive-Based Composition

Long-term architectural improvement to eliminate duplication across text effect components:

```html
<a3d-troika-text text="SMOKE" a3dSmokeMaterial [smokeColor]="'#8a2be2'" />
```

This eliminates 195 lines of property duplication.

---

## Architectural Consideration

**Pattern Issue**: All text effect components (Troika, Glow, Smoke) duplicate ~195 lines of property declarations. Consider:

1. Base class with shared properties
2. Directive composition pattern
3. Mixin approach

**Estimated Effort**: Medium (refactor all 3 components)

---

## Related Tasks

- Create TASK_2025_025 for critical fixes (SDF integration + memory leak)
- Create TASK_2025_026 for shader extraction and architecture improvements

---

## Review Scores

| Reviewer   | Score  | Assessment     |
| ---------- | ------ | -------------- |
| Code Style | 6.5/10 | NEEDS_REVISION |
| Code Logic | 6.5/10 | NEEDS_REVISION |

**Note**: Despite revision recommendations, the component is functional for the demo app use case. Critical fixes should be prioritized for production use.
