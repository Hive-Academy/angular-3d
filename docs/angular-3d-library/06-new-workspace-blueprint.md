# New publishable Nx workspace blueprint (angular-3d)

This doc clarifies the **two migration strategies** and how to set up the new workspace so you can:

1. Copy the current 3D implementation + scene graphs into a new repo
2. Remove `angular-three` entirely
3. Replace only what you actually use (per scan)

## 1) Definitions (what we mean)

### A) Template migration (recommended)

**Meaning**: you _change templates_ so they no longer use `ngt-*` / `ngts-*` / `ngtp-*` elements at all.

Instead of custom elements like:

- `ngt-mesh`, `ngt-sphere-geometry`, `ngtp-effect-composer`, `ngts-text-3d`

…you use **your own Angular components/directives** that create and own Three.js objects directly.

**Key property**: no `CUSTOM_ELEMENTS_SCHEMA` needed, because the template contains only Angular components/directives.

### B) `ngt-*` tag compatibility

**Meaning**: you keep existing templates (or most of them) using `ngt-*` / `ngts-*` / `ngtp-*` tags.

To make those templates still work without `angular-three`, you implement a **template bridge** that:

- understands those tags
- instantiates the correct Three.js objects
- applies inputs (e.g., `position`, `rotation`, material params)
- handles nesting (mesh → geometry + material)

**Key property**: you are effectively rebuilding a subset of Angular Three’s template runtime.

## 2) Trade-offs (why Option A is usually better)

### Template migration (A)

Pros:

- Much simpler to implement (no custom element runtime)
- Stronger TypeScript typing end-to-end
- Better alignment with Angular best practices (signals, OnPush, DI)
- Avoids the hardest part of Angular Three: template-driven scene graph reflection

Cons:

- Requires updating templates (app code changes)
- You need a clean “host context” API so primitives can register into a scene

### `ngt-*` compatibility (B)

Pros:

- Fewer initial changes to your existing templates
- Can be an incremental stepping stone

Cons:

- Big engineering surface area (harder than it looks)
- You must replicate: `extend()`, `*args` semantics, attach semantics, nesting, lifecycle, updates, disposal
- Typing tends to degrade (many dynamic cases)
- Harder testing and debugging

## 3) Recommendation for this repo’s current situation

Given your goal:

- copy over the existing `apps/dev-brand-ui/src/app/core/angular-3d/**`
- copy over landing-page scene graphs as examples
- remove `angular-three` because it’s unmaintained

Recommendation:

- Start with **template migration (A)** for _new_ internal primitives and services.
- Allow **small, tactical template compatibility** only where migration cost is high (e.g., OrbitControls) — but avoid committing to full `ngt-*` runtime.

## 4) “What exactly needs replacement?” (bounded by scan)

The scan shows the used surface area:

- imports: `NgtCanvas`, `NgtArgs`, `extend`, `injectBeforeRender`, `injectStore`, `injectLoader`, `NgtSelect`
- soba imports: `injectGLTF`, `NgtsText3D`, `NgtsPointsBuffer`, `NgtsPointMaterial`
- postprocessing imports: `NgtpEffectComposer`, `NgtpBloom`, `NgtpSMAA`
- template tags: the `ngt-*`, `ngts-*`, `ngtp-*` list in `tmp/angular-three-usage.json`

So even if you chose compatibility (B), you should implement only enough to cover those.

## 5) Concrete blueprint for the _new_ Nx workspace

### Workspace contents

Create a new repo (new Nx workspace) with:

- A publishable Angular library:
  - `libs/angular-3d` → package name `@hive-academy/angular-3d`
- A small examples app:
  - `apps/angular-3d-examples`

### What to copy in (baseline)

Copy these folders into the new workspace (as the starting point for refactor-in-place):

- Library baseline (from current app):
  - `apps/dev-brand-ui/src/app/core/angular-3d/**`
- Examples baseline (from landing-page):
  - `apps/dev-brand-ui/src/app/features/landing-page/sections/scene-graphs/**`

Treat the scene graphs as **acceptance tests**: they must keep rendering as you remove `angular-three`.

## 6) How template migration should look (practical)

A good migration pattern is:

1. Introduce a **Scene Host** component that owns renderer/scene/camera
2. Introduce a **Render Loop** API (service + hook) to replace `injectBeforeRender`
3. Introduce a typed **Scene Context Store** to replace `injectStore`
4. Convert primitives (planet/stars/nebula/text) to create Three.js objects directly
5. Replace OrbitControls with a native wrapper and stop DOM instance sniffing
6. Replace postprocessing via `postprocessing` / `three/examples` passes

During migration:

- templates will mostly stay Angular (`<app-planet .../>`, `<app-star-field .../>`), not custom elements.

## 7) Can we reuse `docs/threejs-vanilla/*` in the new Angular package?

Yes — and it’s useful.

How to use it effectively:

- Treat `docs/threejs-vanilla/*` as the **low-level rendering reference**:

  - renderer setup, camera, resize handling
  - lighting patterns
  - GLTF loading patterns
  - postprocessing composer patterns
  - controls patterns

- In the new Angular package docs, reference those chapters as implementation guides, then add Angular-specific layers:
  - “where to store renderer/scene/camera in DI”
  - “how to manage lifecycle + disposal with `DestroyRef`”
  - “how to run RAF outside Angular and still expose state via signals”

Suggested approach:

- Copy the `docs/threejs-vanilla/` folder into the new workspace as `/docs/threejs-vanilla/` unchanged.
- Add a short “Angular mapping” doc (per chapter) that explains where that vanilla logic lives in the package (canvas, render-loop, loaders, postprocessing, controls).

## 8) Decision checklist (pick one)

Choose **Template migration (A)** if:

- you want best long-term maintainability
- you want strong typing and modern Angular patterns
- you can tolerate updating templates

Choose **`ngt-*` compatibility (B)** if:

- you need minimal template churn short-term
- you’re willing to build a mini runtime for template-driven scene graphs

If unsure: start with (A).
