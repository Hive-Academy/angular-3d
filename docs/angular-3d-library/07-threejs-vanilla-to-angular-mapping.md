# threejs-vanilla → angular-3d package mapping

This document maps the **vanilla Three.js reference docs** you copied into:

- `docs/angular-3d-library/threejs-vanilla/*`

to the concrete implementation areas in your **new publishable Nx workspace** package:

- `@hive-academy/angular-3d`

The purpose is to make the new workspace implementation predictable:

- vanilla docs = “what Three.js code must exist”
- mapping = “where that code should live in Angular (services/components) and how it replaces angular-three”

## Package areas (recommended)

- `canvas/` → renderer + scene + camera ownership (replacement for `NgtCanvas`)
- `render-loop/` → RAF + per-frame hooks (replacement for `injectBeforeRender`)
- `store/` (or inside `canvas/`) → typed context store (replacement for `injectStore`)
- `controls/` → OrbitControls wrapper
- `loaders/` → texture + GLTF loaders (replacement for `injectLoader`/`injectGLTF`)
- `postprocessing/` → EffectComposer + bloom/SMAA (replacement for `angular-three-postprocessing`)
- `primitives/` → planet/stars/nebula/text/etc. implemented as Angular components that own Three.js objects
- `utils/` → viewport mapping and other pure helpers

## Chapter-by-chapter mapping

### 01 - Scene setup

Source: `threejs-vanilla/01-scene-setup.md`
Target:

- `canvas/` (renderer, scene, camera lifecycle)
- `store/` (expose `{ scene, camera, renderer, domElement }`)
  Replaces:
- `NgtCanvas`
- `injectStore` (for camera/gl/domElement)

### 02 - Lighting

Source: `threejs-vanilla/02-lighting.md`
Target:

- `primitives/` (lights as owned objects)
- optional: `config/` (shared lighting presets)
  Replaces:
- `ngt-ambient-light`, `ngt-directional-light`, `ngt-point-light`, `ngt-spot-light`, `ngt-hemisphere-light`

### 03 - Planet rendering

Source: `threejs-vanilla/03-planet-rendering.md`
Target:

- `primitives/planet/` (mesh + material + texture handling)
- `loaders/` (TextureLoader caching)
  Replaces:
- `injectLoader`
- `ngt-mesh`, `ngt-sphere-geometry`, `ngt-mesh-standard-material`

### 04 - Star fields

Source: `threejs-vanilla/04-star-fields.md`
Target:

- `primitives/stars/` (Points/Sprites; instancing if needed)
- `render-loop/` (twinkle/animation)
  Replaces:
- `injectBeforeRender`
- any `ngts-points-buffer` / `ngts-point-material` usage (prefer native `THREE.BufferGeometry` + `THREE.PointsMaterial`)

### 05 - Nebula effects

Source: `threejs-vanilla/05-nebula-effects.md`
Target:

- `primitives/nebula/` (shader planes / sprites)
- `render-loop/` (time uniforms, drift)
  Replaces:
- `injectBeforeRender`
- `ngt-plane-geometry`, `ngt-shader-material`, `ngt-sprite`, `ngt-sprite-material`

### 06 - Particle text

Source: `threejs-vanilla/06-particle-text.md`
Target:

- `primitives/text/` (instanced particles / sprite particles)
- `render-loop/` (billboarding, pulses)
  Replaces:
- `injectBeforeRender`
- `ngts-text-3d` (if you choose to replace soba text)

### 07 - GLTF models

Source: `threejs-vanilla/07-gltf-models.md`
Target:

- `loaders/gltf/` (GLTFLoader + caching + abort/stale guards)
- `primitives/models/` (adds/removes loaded scene to parent)
  Replaces:
- `injectGLTF`
- `ngt-primitive`

### 08 - SVG 3D icons

Source: `threejs-vanilla/08-svg-3d-icons.md`
Target:

- `loaders/svg/` (SVGLoader + mesh creation)
- `primitives/icons/`
  Replaces:
- any template-driven `ngt-*` usage for SVG extrusion

### 09 - Post-processing

Source: `threejs-vanilla/09-post-processing.md`
Target:

- `postprocessing/` (EffectComposer pipeline, toggled by the canvas host)
  Replaces:
- `NgtpEffectComposer`, `NgtpBloom`, `NgtpSMAA`
- `ngtp-effect-composer`, `ngtp-bloom`, `ngtp-smaa`

### 10 - Camera controls

Source: `threejs-vanilla/10-camera-controls.md`
Target:

- `controls/orbit-controls/` (OrbitControls wrapper)
- `render-loop/` (controls.update when damping)
  Replaces:
- `ngt-orbit-controls`
- DOM instance sniffing (avoid reading `__THREE__`/`instance`/`ref` off elements)

### 11 - Viewport positioning

Source: `threejs-vanilla/11-viewport-positioning.md`
Target:

- `utils/viewport-positioning/`
- optional: `store/` for viewport/camera metrics
  Replaces:
- any Angular Three viewport helper reliance (keep as pure TS)

## How to use this mapping during the migration

- Copy the current `angular-3d` folder and `scene-graphs` into the new workspace.
- Pick **template migration** as the default approach.
- Use the mapping above to migrate one capability at a time:
  1. canvas + store
  2. render loop hook
  3. loaders
  4. postprocessing
  5. controls
  6. primitives

Each time you remove an `angular-three` feature, confirm the copied scene graphs still render.
