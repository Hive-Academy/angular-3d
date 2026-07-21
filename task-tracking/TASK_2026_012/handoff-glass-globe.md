# NEWPASSIVE `/newpassive-scene` — Glass-Globe Hero — HANDOFF

**Status:** IN PROGRESS — very close to the reference; final framing/polish remains
**Branch:** `feature/newpassive-hero` (UNCOMMITTED — nothing committed yet this session)
**Route:** `/newpassive-scene` → `apps/angular-3d-demo/src/app/pages/newpassive-hero/newpassive-scene.component.ts`

---

## 1. Objective

A single hero element: the connected **night-earth as a GLASS sphere** (city-lights +
flight-line network texture), curving as a large limb across the lower frame, sunrise cresting
the top over **Europe/the Mediterranean**, over a starfield + nebula. Match the NEWPASSIVE
reference (Egypt-based nutraceutical "Connecting Science to Global Wellness" hero: big earth
limb, Europe/Med centered, sunrise flare at the crest).

## 2. USER'S FIRM RULES (do not violate — these caused repeated frustration)

1. **Use ONLY the glass component** (`a3d-floating-sphere` / `FloatingSphereComponent`,
   MeshPhysical). **NEVER switch to `a3d-planet` / `PlanetComponent`** — the user calls it the
   "weird/broken/distorted component."
2. **NO blue circle.** The `GlassShellComponent` "atmosphere rim" (its `edgeColor` default is
   blue `#88ccff`) reads as a "weird blue circle you can't remove." It has been deleted from the
   scene. Do **not** re-add `a3d-glass-shell`. If a rim is ever wanted, use a SOFT additive glow,
   not that hard Fresnel ring.
3. Avoid the word-triggered reflex of swapping components. Keep the glass sphere.

## 3. Current scene composition (all in `newpassive-scene.component.ts`)

- `a3d-environment [preset]="'dawn'" [intensity]="0.12"` — subtle HDRI reflections (kept LOW so
  it doesn't wash the self-lit night texture; higher intensity washes the city lights).
- Lighting: `ambient 0.06 #ffffff`, warm key `[-6,6,18] 0.1`, warm backlight `[0,10,-30] 1.7`.
- 2× static `a3d-star-field` (enableRotation false), 1× static `a3d-nebula` (enableFlow false).
- **The globe** = `a3d-floating-sphere` with the texture as BOTH `textureUrl` and
  `emissiveMapUrl` (city lights self-glow). Glossy-but-crisp glass: `roughness 0.4`,
  `clearcoat 0.5`, `clearcoatRoughness 0.22`, `transmission 0`, `ior 1.45`, `thickness 0`.
- Sunrise: `a3d-sphere` (emissive) + `a3d-point-light`.
- Fixed `a3d-orbit-controls` (all motion off). Bloom composer.

### Current key input values (tuned live; iterate from here)

- `cameraPosition [0,0,16]`, `cameraFov 46`, `renderPixelRatio 2` (supersampling for DPR-1 crispness)
- `earthTextureUrl 'earth-network.jpg'` (now **7000×5969**, the user's max-res drop)
- `earthCenter [0,-30,-22]`, `earthRadius 32`, `earthRotation [-0.34, 4.58, 0]` (big limb; Y≈4.58 aims at the Mediterranean; X tilts Europe up to the crest)
- `earthEmissiveIntensity 2.6`
- Glass material: `roughness 0.62`, `clearcoat 0.3`, `clearcoatRoughness 0.35` (raised roughness/lowered clearcoat to KILL the sun-reflection blob — keep these)
- `sunPosition [-1,5,-13]`, `sunRadius 0.5`
- Bloom `threshold 0.5 / strength 0.85 / radius 0.55`
- **Matches the reference well as of this pass.** Remaining: sun still floats above the limb
  (reference flare sits AT the horizon — lower `sunPosition.y`); crest ~42% vs reference ~52%
  (nudge `earthCenter.y` down); optional rayed flare; distortion left = inherent equirectangular
  limb stretch + 7000px resolution (user is sourcing a true 8K texture).

## 4. Library changes made this session (all backward-compatible; keep)

- `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts` — **added
  `textureUrl`, `emissiveMapUrl`, `emissive`, `emissiveIntensity` inputs**; sets `map`/`emissiveMap`
  with `SRGBColorSpace` + `anisotropy = 16`. (This is what lets the GLASS sphere carry the earth
  texture — the enabling change.)
- `libs/angular-3d/src/lib/primitives/geometry/floating-sphere.component.ts` — forwards those 4 new inputs.
- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` — **added `pixelRatio` input**
  (supersampling; default null = `min(DPR,2)`; scene uses `2`).
- `libs/angular-3d/src/lib/primitives/space/planet.component.ts` — fixed the shared planet
  (removed color-texture-as-bumpMap hack → opt-in `bumpScale`; honor metalness/roughness; sRGB;
  anisotropy; added `emissiveMapUrl` + `rotation` inputs). **Not used by the scene now** (user
  rejected the planet), but the fix is valid and worth keeping.
- `apps/angular-3d-demo/src/app/app.ts` + `app.html` + `app.routes.ts` — **chrome toggle**:
  `data:{chrome:false}` on the `newpassive-scene` route + a `showChrome` signal hides nav/footer
  for a full-bleed, no-scroll hero. Other routes keep their chrome (verified).

Validation this session: `nx typecheck` + `nx lint` for `@hive-academy/angular-3d` and
`angular-3d-demo` → **0 errors** (1 pre-existing unrelated lint warning).

## 5. Remaining differences vs the reference (the next-session to-do)

1. **Bigger limb** — reference spans full width edge-to-edge; ours curves in on the sides.
   Increase `earthRadius` (24 → ~30+) and/or lower `cameraFov`.
2. **Lower the crest** — reference horizon at ~52% down; ours ~35%. Move `earthCenter.y` down
   (more negative) and re-tune so Europe stays at the crest.
3. **Glass sun-reflection blob** — a 2nd orange spot appears on the surface (clearcoat reflecting
   the sun sphere). Soften via higher `roughness`/lower `clearcoat`, or move the sun.
4. **Sunrise flare** — reference is a rayed flare; ours is a round emissive sphere. Consider a
   sprite/flare or a small lens-flare.
5. **(Optional) soft atmosphere glow** — only if the user asks; must NOT be the hard blue
   `GlassShell` ring (see rule #2). A subtle additive back-lit rim would match without the "circle."

## 6. Texture facts (settled — don't re-litigate)

- `earth-network.jpg` is a valid **equirectangular** night-earth map (NASA Black Marble style +
  network + nebula), **7000×5969 (1.17:1)**.
- **Aspect does NOT distort on a sphere**: Three.js maps normalized UV (0–1), not pixels, so 1.17:1
  vs 2:1 is a **no-op** for geometry. Resizing to 2:1 (8192×4096) would only **lose vertical
  resolution** (5969→4096) for zero benefit — DON'T. Keep the 7000px file as-is.
- The earlier "distortion" was the extreme close-up **limb grazing angle** + natural
  **equirectangular pole-pinch** — both handled by pulling back to a fuller, mid-latitude framing.
- Crispness is already maximized via `anisotropy=16` (texture) + `pixelRatio=2` (canvas
  supersampling; the user's display is DPR 1). More detail would need a higher-res source only.

## 7. Environment / gotchas

- **Dev server**: `npx nx serve angular-3d-demo --port 4200`. Was restarted fresh this session
  (`nx reset` + serve). Library-source changes hot-recompile (Nx maps to source).
- **chrome-devtools MCP browser is the USER'S Chrome profile** — it follows whatever tab the user
  navigates. `navigate_page` to `http://localhost:4200/newpassive-scene` before each screenshot.
- **HMR**: after edits, wait ~5–9s (longer for `libs/` changes) before screenshotting.
- **Distortion review trick**: to judge the texture alone, temporarily set a full centered globe
  (`earthCenter [0,0,-6]`, `earthRadius 8`, `earthRotation [0, Y, 0]`), then restore the limb.
- Rotation mapping (empirical): **increasing Y rotates the view WEST**; Americas≈0.7,
  Pacific≈1.4, Asia≈2.5, **Europe/Med≈4.5**. `X≈-0.3` tilts Europe up to the crest.

## 8. How to run / review

```bash
cd D:/projects/angular-3d-workspace
npx nx serve angular-3d-demo --port 4200
# open http://localhost:4200/newpassive-scene  (full-bleed, no chrome)
```

Nothing committed. When ready: commit to `feature/newpassive-hero` (glass-globe scene +
the 5 library files in §4). Suggested message:
`feat(demo): newpassive glass-globe hero + textured physical material support`.
