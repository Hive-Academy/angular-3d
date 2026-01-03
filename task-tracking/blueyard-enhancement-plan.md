# BlueYard Hero Enhancement Plan

Match the glass sphere hero section to BlueYard.com's visual design with improved materials, particles, and animations.

---

## User Review Required

> [!IMPORTANT] > **Breaking Change**: New directional particle component will replace the existing SparkleCorona for better BlueYard match.

> [!WARNING] > **Performance**: Directional particle spray with 10k+ particles may impact low-end devices.

---

## Proposed Changes

### Component: Glass Sphere Material

#### [MODIFY] [glass-sphere-scene.component.ts](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-scene.component.ts)

**Current:** Transparent glass with subtle edge glow
**Target:** Nearly opaque coral glass with strong fresnel rim

**Changes (line ~270-310):**

```diff
- material.colorNode = vec3(1.0, 0.75, 0.65);
+ material.colorNode = vec3(1.0, 0.65, 0.55);  // Deeper coral

- opacity: 0.95,
+ opacity: 0.98,  // Nearly opaque like BlueYard

- const edgeGlow = fresnelValue.mul(0.4);
+ const edgeGlow = fresnelValue.mul(0.65);  // Stronger rim glow
```

---

### Component: Directional Particle Spray

#### [NEW] [directional-particles.component.ts](file:///d:/projects/angular-3d-workspace/libs/angular-3d/src/lib/primitives/particles/directional-particles.component.ts)

**Purpose:** Create diagonal particle spray extending from sphere to upper-right

**Architecture:**

- Extends proven `StarFieldComponent` InstancedMesh pattern
- Particles distributed in 90° arc (upper-right quadrant only)
- Trail effect with particles further from sphere being smaller/fainter
- Follows sphere position during scroll animation

**Key Inputs:**

```typescript
particleCount = input<number>(8000);
arcStart = input<number>(300); // degrees, 0 = right
arcEnd = input<number>(60); // degrees, upper-right quadrant
innerRadius = input<number>(4.5); // starts at sphere surface
outerRadius = input<number>(12); // spray extends far
color = input<string>('#ff8866'); // coral to match sphere
```

---

### Component: SparkleCorona Adjustments

#### [MODIFY] [glass-sphere-scene.component.ts](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-scene.component.ts#L67-75)

**Current Template:**

```html
<a3d-sparkle-corona [count]="5000" [colorWeights]="{ white: 0.4, peach: 0.4, gold: 0.2 }" />
```

**New Template (with directional particles):**

```html
<!-- Replace SparkleCorona with directional spray -->
<a3d-directional-particles [particleCount]="8000" [innerRadius]="4.5" [outerRadius]="12" [arcStart]="300" [arcEnd]="60" [color]="'#ff8866'" [position]="spherePosition()" />
```

---

### Component: Background Gradient

#### [MODIFY] [glass-sphere-hero.component.ts](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-hero.component.ts)

**Current:** Generic warm gradient
**Target:** BlueYard's peach-to-coral gradient

```typescript
// Update gradient computed signal
gradient = computed(() => 'linear-gradient(180deg, #fde8d7 0%, #f5c4a8 50%, #e8a080 100%)');
```

---

## Verification Plan

### Visual Tests

1. **Sphere Opacity**: Should appear solid coral, not see-through
2. **Edge Glow**: Strong white/peach rim visible at all angles
3. **Particle Spray**: Diagonal trail extending upper-right from sphere
4. **Scroll Animation**: Sphere moves left→right, shrinks 1.0→0.3
5. **Background**: Warm peach-to-coral gradient matching BlueYard

### Performance Tests

```bash
npx nx serve angular-3d-demo
# Check FPS in browser DevTools Performance tab
# Target: 50+ FPS during scroll animation
```

---

## Implementation Order

| Step | Task                                   | Complexity | Time   |
| ---- | -------------------------------------- | ---------- | ------ |
| 1    | Fix glass sphere opacity/glow          | Low        | 5 min  |
| 2    | Update particle colors                 | Low        | 2 min  |
| 3    | Create directional particles component | High       | 30 min |
| 4    | Integrate new particles in scene       | Medium     | 10 min |
| 5    | Adjust background gradient             | Low        | 5 min  |
| 6    | Visual verification                    | -          | 10 min |

**Total Estimated Time:** ~1 hour

---

## Files Summary

| Action | File                                 |
| ------ | ------------------------------------ |
| MODIFY | `glass-sphere-scene.component.ts`    |
| MODIFY | `glass-sphere-hero.component.ts`     |
| NEW    | `directional-particles.component.ts` |
| MODIFY | `primitives/particles/index.ts`      |
