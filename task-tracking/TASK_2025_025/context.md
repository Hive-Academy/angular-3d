# Task Context - TASK_2025_025

## User Intent

Fix SmokeTroikaTextComponent viewport positioning support and hero scene layout:

1. Component lacks SceneGraphStore integration - viewportPosition directive doesn't work
2. Memory leak in render loop effect (TASK_2025_024 critical fix #2)
3. Hero scene text positioning - text should be on LEFT side using viewport positioning (currently overlaps with Earth at 70%)

## Conversation Summary

Investigation revealed:

- `SmokeTroikaTextComponent` provides `OBJECT_ID` token but does NOT register with `SceneGraphStore`
- `ViewportPositionDirective` requires objects to be registered in `SceneGraphStore` to update positions
- Pattern from `GltfModelComponent` shows correct integration: `this.sceneStore.register(this.objectId, this.group, 'group')`
- `TroikaTextComponent` and `GlowTroikaTextComponent` likely have the same missing integration
- Hero scene uses absolute `[position]` coordinates instead of responsive `viewportPosition`
- Reference screenshot shows text should be on LEFT side, Earth on RIGHT

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop (current)
- Created: 2025-12-23
- Type: BUGFIX
- Complexity: Medium

## Execution Strategy

BUGFIX Strategy (Streamlined):

- Skip PM/Architect (requirements clear from investigation)
- team-leader MODE 1 (decomposition) → MODE 2 (dev loop) → MODE 3 (completion)
- QA choice checkpoint
- Modernization detector

## Files to Modify

1. `libs/angular-3d/src/lib/primitives/text/smoke-troika-text.component.ts`

   - Add SceneGraphStore integration
   - Fix memory leak in render loop effect

2. `libs/angular-3d/src/lib/primitives/text/troika-text.component.ts`

   - Add SceneGraphStore integration (if missing)

3. `libs/angular-3d/src/lib/primitives/text/glow-troika-text.component.ts`

   - Add SceneGraphStore integration (if missing)

4. `apps/angular-3d-demo/src/app/pages/home/scenes/hero-3d-teaser.component.ts`
   - Update text elements to use viewportPosition directive
   - Position text on LEFT side (like reference screenshot)

## Reference Pattern

From `GltfModelComponent`:

```typescript
// Inject
private readonly sceneStore = inject(SceneGraphStore);
private readonly objectId = inject(OBJECT_ID);

// Register after creation
this.sceneStore.register(this.objectId, this.group, 'group');

// Cleanup
this.sceneStore.remove(this.objectId);
```

## Memory Leak Fix Pattern

From TASK_2025_024 future-enhancements.md:

```typescript
// Register ONCE in constructor, execute conditionally
this.cleanupRenderLoop = this.renderLoop.registerUpdateCallback((delta) => {
  if (this.enableFlow() && this.smokeMaterial) {
    this.smokeMaterial.uniforms['uTime'].value += delta * this.flowSpeed();
  }
});
```
