# TASK_2025_006: Postprocessing Pipeline Context

## User Intent

The user wants to implement a robust postprocessing pipeline for the Angular 3D library directly using `three-stdlib`, removing legacy dependencies on `angular-three-postprocessing`. This enables cinematic effects like Bloom, Glitch, and Vignette.

## Architectural Decisions

1.  **Unified Render Loop**: Refactor `Scene3dComponent` to use the shared `RenderLoopService` instead of running its own loop. This allows `EffectComposerService` to override the render function globally.
2.  **Service-Based Composition**: `EffectComposerService` will manage the `EffectComposer`, `RenderPass`, and pass ordering.
3.  **Declarative Components**:
    - `EffectComposerComponent` acts as a container/activator.
    - `BloomEffectComponent` registers itself with the service.
4.  **No Custom Schemas**: Use native Angular components with inputs/outputs.
5.  **Performance**: Run all composition rendering outside Angular zone.

## Key Files

- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` (Refactor target)
- `libs/angular-3d/src/lib/render-loop/render-loop.service.ts` (Infrastructure)
- `libs/angular-3d/src/lib/postprocessing/*` (New module)

## References

- `three-stdlib` EffectComposer source.
- `RenderLoopService` existing API.
