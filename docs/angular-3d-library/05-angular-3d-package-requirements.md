# Angular 3D package requirements (minimum scope)

Goal: Build a standalone Angular + Three.js integration package in a separate Nx workspace that can replace the **used** subset of Angular Three.

Source of truth for “what we use today”:

- Inventory: `docs/angular-3d-library/04-angular-three-usage-inventory.md`
- Scan JSON: `tmp/angular-three-usage.json`

## 0) Hard constraints

- No dependency on `angular-three`, `angular-three-soba`, or `angular-three-postprocessing`.
- Angular best practices:
  - Standalone components/directives (default; do **not** set `standalone: true`).
  - Signals for inputs/state; `ChangeDetectionStrategy.OnPush`.
  - Use `host: {}` instead of `@HostBinding`/`@HostListener`.
- Type safety: no `any`.

## 0.1) What gets copied into the new workspace (initial baseline)

The new publishable Nx workspace should start by copying over:

- The full current Angular 3D layer (as the baseline implementation to refactor):
  - `apps/dev-brand-ui/src/app/core/angular-3d/**`
- The landing-page scene graphs as **real example consumers** (kept compiling/running throughout the migration):
  - `apps/dev-brand-ui/src/app/features/landing-page/sections/scene-graphs/**`
    - `hero-space-scene.component.ts`
    - `hero-scene-graph.component.ts`
    - `cta-scene-graph.component.ts`
    - `value-propositions-3d-scene.component.ts`

These examples are not “nice-to-have”; they are the primary integration harness proving the replacement package works.

## 1) Decide: template-compat vs template-migration

You have two viable paths. Pick **one** up front.

### Option 1 (recommended): migrate templates away from `ngt-*`/`ngts-*`/`ngtp-*`

Pros: simplest implementation, best type safety, avoids custom elements.

Requirements:

- Provide Angular components that render/own Three.js objects directly (no `CUSTOM_ELEMENTS_SCHEMA`).
- Replace usage sites in `apps/dev-brand-ui/src/app/core/angular-3d/**` to use the new components.

### Option 2: keep `ngt-*` tag compatibility

Pros: smaller app diffs initially.

Requirements:

- You must implement a “template bridge” that can interpret these tags and build Three.js objects:
  - `ngt-mesh`, `ngt-group`, `ngt-primitive`, common geometries/materials/lights/sprites/fog.
- You must define a replacement for `NgtArgs` and a registration mechanism similar to `extend()`.

## 2) Minimal API surface (by capability)

### A) Canvas host (replacement for `NgtCanvas`)

Must provide:

- A root component that creates and owns:
  - `THREE.WebGLRenderer`
  - `THREE.Scene`
  - `THREE.Camera` (at minimum `PerspectiveCamera`)
- Inputs:
  - camera config (`position`, `fov`, `near`, `far`)
  - renderer config (`antialias`, `alpha`, `powerPreference`)
  - `shadows` toggle
- Content projection for “scene graph” child components.

Acceptance checks:

- Can host the current hero scene graph(s) copied into the new workspace.
- Renderer is disposed on destroy.

### B) Frame loop hook (replacement for `injectBeforeRender`)

Must provide:

- A safe API to register per-frame callbacks that receive at least:
  - `delta` seconds
  - current `camera`
  - current `scene`
  - current `renderer`
- Automatic cleanup on `DestroyRef`.

Acceptance checks:

- Replaces usage in star field / nebula / particle text / orbit controls updates.
- The copied `hero-space-scene` continues animating as expected.

### C) Runtime store access (replacement for `injectStore`)

Must provide:

- A typed store/service accessible from injection context that can return:
  - `camera`
  - `renderer` (and renderer `domElement`)
  - `scene`
- Optional injection (some services currently call `injectStore({ optional: true })`).

Acceptance checks:

- Orbit controls wrapper can access camera + dom element.
- `Angular3DStateStore` and `AnimationService` can integrate (or be refactored to use the new store).

### D) Loader utilities (replacement for `injectLoader` and `injectGLTF`)

Must provide:

- A typed “loader composable” API that supports:
  - texture loading (`THREE.TextureLoader`)
  - GLTF loading (`three-stdlib` `GLTFLoader`) with caching by URL
- Cancellation / stale-request protection when input URLs change.

Acceptance checks:

- Planet texture loading works.
- GLTF model loading works.

### E) Orbit controls wrapper (replacement for `ngt-orbit-controls` + DOM instance access)

Must provide:

- A component that creates `OrbitControls(camera, domElement)`.
- It must expose the actual `OrbitControls` instance in a supported way (typed):
  - either an `output()` event, a signal, or an injection token.

Acceptance checks:

- `ScrollZoomCoordinatorDirective` no longer needs DOM querying.

### F) Postprocessing (replacement for `NgtpEffectComposer`/`NgtpBloom`/`NgtpSMAA`)

Must provide:

- `EffectComposer` pipeline with:
  - Render pass
  - Bloom (UnrealBloomPass)
  - SMAA (if still needed)
- A clean opt-in API, so the base renderer can render with or without composer.

Acceptance checks:

- Bloom effect parity for the hero scene.

### G) Soba equivalents used (optional but currently referenced)

Used today:

- `NgtsText3D`
- `NgtsPointsBuffer` / `NgtsPointMaterial`

If you choose Option 1 (template migration), you can likely replace these with:

- `TextGeometry` (three examples) or troika text (if acceptable)
- native `THREE.BufferGeometry` + `THREE.PointsMaterial`

## 3) Explicit “not required” list (based on scan)

Do **not** implement anything outside this list until a real usage appears.
The scan shows imports/tags only for:

- `NgtCanvas`, `NgtArgs`, `extend`, `injectBeforeRender`, `injectStore`, `injectLoader`, `NgtSelect`
- `injectGLTF`, `NgtsText3D`, `NgtsPointsBuffer`, `NgtsPointMaterial`
- `NgtpEffectComposer`, `NgtpBloom`, `NgtpSMAA`

## 4) Suggested workspace/package shape (for your separate Nx repo)

- One publishable Angular library: `@hive-academy/angular-3d`
- Subfolders inside the lib (not re-exporting across other libs):
  - `canvas/` (host + store)
  - `render-loop/`
  - `controls/`
  - `loaders/`
  - `postprocessing/`

## 5) Migration checklist (app side)

- Replace `Scene3DComponent` to use new canvas host.
- Replace all `injectBeforeRender` usage with the new frame-loop API.
- Replace `injectStore` usage (or delete store coupling in favor of explicit injections).
- Replace OrbitControls usage and stop DOM instance sniffing.
- Replace postprocessing components.
- Remove `CUSTOM_ELEMENTS_SCHEMA` from migrated components.

## 6) Definition of done (for the new workspace MVP)

- The new workspace builds a publishable `@hive-academy/angular-3d` library.
- The new workspace contains an examples app that renders the copied scene graphs.
- No dependency remains on `angular-three`, `angular-three-soba`, or `angular-three-postprocessing`.
- The examples app demonstrates:
  - a scene container + render loop
  - OrbitControls + scroll/zoom coordination (without DOM instance sniffing)
  - GLTF loading
  - bloom/postprocessing (if still required by the hero scene)
