# TASK_2026_012 — NEWPASSIVE Hero Replica (Tribunal) — HANDOFF

**Status:** IN PROGRESS — architecture done, art-direction correction pending
**Created:** 2026-07-20
**Owner (next session):** continue from this doc; branches + commits below are durable

---

## 1. Objective

Replicate the "NEWPASSIVE — Connecting Science to Global Wellness" cinematic hero
(reference screenshot in chat) as close to 100% as possible, as a HYBRID:
Three.js canvas for immersive visuals + HTML/CSS for all UI/typography, inside the
demo app at route `/newpassive`.

Reference = an Egypt-based nutraceutical marketing hero: night-side Earth with glowing
city lights + a blue network mesh curving across the lower ~2/3, a SMALL bright sunrise
point on the horizon, a SUBTLE glass sphere center-frame with a single THIN neon ring
outline containing the swirl logo + "NEWPASSIVE" wordmark + tagline, two glassmorphism
portal cards (Distribution / Healthcare), navbar, gradient heading, 2/3 slider.

---

## 2. Where the work lives (all durable on branches)

Base repo: `D:\projects\angular-3d-workspace` (currently on branch `feature/newpassive-hero`).

| Branch                              | Commits                           | Meaning                                                                                                                                 |
| ----------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `feature/newpassive-hero`           | `95437f4`                         | Landed race winner (P2) + 8K night texture. The "safe" base.                                                                            |
| `tribunal/race/newpassive-refine-c` | `95437f4` → `0b1da54` → `dc2946f` | Refinement (city lights + sunrise flare + gradient heading + swirl logo), then image-backed hybrid conversion. **Latest work is here.** |

Active worktree with the latest code: `D:\projects\angular-3d-workspace-refine-c`
(branch `tribunal/race/newpassive-refine-c` @ `dc2946f`).

Leftover first-race worktrees (uncommitted experiments, safe to remove — see Cleanup):
`D:\projects\angular-3d-workspace-race-a` (branch `…hero-a`), `…-race-b` (branch `…hero-b`).

Component files (in `apps/angular-3d-demo/src/app/pages/newpassive-hero/`):

- `newpassive-hero.component.ts` — the page (canvas + HTML overlay)
- `newpassive-backdrop.component.ts` — **in-scene backdrop plane** (image-backed layer), `[textureUrl]` swap point
- `newpassive-network-arcs.component.ts` — network connection arcs + travelling particles
- `newpassive-camera-drift.component.ts` — slow cinematic camera drift
- `newpassive-city-lights.component.ts` — additive night-lights glow (UNUSED after hybrid; file kept)
- `newpassive-sunrise-flare.component.ts` — 3D sunrise sprites (UNUSED after hybrid; file kept)

Assets in `apps/angular-3d-demo/public/`:

- `earth-night.jpg` — 8192×4096 NASA-style night earth (used by procedural earth; now unused in hybrid)
- `newpassive-backdrop.jpg` — 2560×1438 NASA "orbital sunrise" limb photo (current hybrid backdrop — SEE §4, likely wrong composition)

Route: `/newpassive` (lazy-loaded in `apps/angular-3d-demo/src/app/app.routes.ts`).

---

## 3. Validation (done this session)

- `npx nx build angular-3d-demo` → **PASS** on all three commits (only pre-existing
  bundle/style-budget WARNINGS; the hero CSS is ~0.8 KB over the 4 KB per-component budget — cosmetic).
- `npx nx lint angular-3d-demo` → **PASS** (0 errors).
- `nx.json` / `tsconfig.base.json` showed as modified only due to CRLF/LF line-ending
  churn (empty content diff) — reverted, NOT committed. Watch for this in the worktree.
- Angular standards respected throughout: standalone, OnPush, signal inputs, `inject()`,
  `afterNextRender` for browser-only init, `DestroyRef` disposal of Three.js resources.
  All changes app-scoped — **no `libs/` edits**.

---

## 4. The visual gap vs the reference (USER FEEDBACK — the real next task)

The current hybrid (`dc2946f`) is technically clean but **art-directionally off**. User's
critique, which is correct:

1. **Sun is wrong.** Reference has a SMALL circular sunrise light on the horizon. The
   auto-sourced backdrop (`newpassive-backdrop.jpg` = NASA "orbital sunrise" limb photo)
   shows a big atmospheric sun blaze across the whole limb → too heavy, wrong composition.
2. **Central glass sphere + rings are over-styled.** Reference = a subtle, understated glass
   sphere with ONE thin neon ring outline. Ours = a large translucent sphere + 3 bright
   crossing neon torus rings + sparkle corona → too much "sci-fi neon".
3. **Backdrop composition is wrong.** Reference earth = full night-side globe with city
   lights + blue network mesh filling the lower 2/3. The NASA orbital-limb photo is a thin
   dark limb → doesn't read as the reference's earth.

**Root cause (honest):** the image-backed _architecture is right_, but (a) the blindly
auto-sourced backdrop photo has the wrong composition, and (b) the live 3D has been
consistently over-styled across every iteration. This is NOT a "wrong iteration" problem —
restraint + the correct backdrop image fix it.

---

## 5. Recommended plan for next session (single track, art-direction correction)

1. **Get the real backdrop.** Ask the user to export the earth/background layer from their
   Figma (`NEWPASSIVE`, node-id `123-15541`) as a clean image, OR source a proper
   "full night earth with city lights + network mesh, sunrise point on horizon" image.
   Drop it at `apps/angular-3d-demo/public/newpassive-backdrop.jpg` — **one-line swap**, no
   layout changes (the backdrop plane cover-fits automatically). This single change fixes
   the earth + the sun composition at once.
2. **Tone the live 3D WAY down** to match the restrained reference:
   - Central sphere: lower opacity subtle glass, keep it understated.
   - Rings: reduce to ONE thin ring (thin tube, gradient purple→blue, LOW emissive). Drop
     the 3 crossing neon rings + sparkle corona (or make them barely-there).
   - Bloom: reduce strength/threshold so nothing blooms into heavy neon.
   - Sunrise: if any live sunrise element remains, make it a small low-intensity point — but
     it should mostly come from the backdrop image.
   - Keep: subtle network connection arcs, HTML overlay, swirl logo, lockup scrim.
3. Rebuild green, then land onto `feature/newpassive-hero` and open a PR.

Optional (only if pixel-fidelity of live glass is later required): a true glass sphere that
REFRACTS the backdrop needs `MeshPhysicalMaterial` transmission + an env map (CubeCamera/HDRI)
— a library extension, out of scope for the restraint pass above.

---

## 6. Environment gotchas (WILL bite the next session)

- **`ptah_agent_spawn` `workingDirectory` is validated against the ACTIVE VS Code window's
  workspace root**, which toggles between `D:\projects\angular-3d-workspace` and
  `D:\projects\ptah-extension` depending on which window is focused. A worktree path only
  passes the check if it STARTS WITH the active root string (siblings like
  `…-workspace-refine-c` pass when root = `…\angular-3d-workspace`). If a spawn fails with
  "Working directory must be within workspace root", relocate the worktree under the
  currently-active root prefix and re-spawn.
- **Git worktrees have no `node_modules`.** Junction it before building/serving:
  `cmd /c mklink /J "<worktree>\node_modules" "D:\projects\angular-3d-workspace\node_modules"`.
  Remove the junction (`cmd /c rmdir "<wt>\node_modules"`) BEFORE `git worktree remove` or
  the recursive delete fails with "Invalid argument".
- **Git "dubious ownership":** run `git config --global --add safe.directory <path>` for the
  repo + each worktree path.
- **Screenshots:** the chrome-devtools MCP browser is pinned to the user's Chrome profile;
  `new_page`/`list_pages` fail with "browser already running". Serve a port and let the USER
  view, or use `--isolated` if a headless shot is essential.
- **Background dev server:** launch `nx serve … --port N` as the background command itself
  (NOT with a trailing `&` inside a wrapper — that gets SIGINT'd when the wrapper exits).
- **Spawned ptah-cli sub-sessions may schedule their own wakeups / dev servers** — harmless,
  they die with the sub-session.

---

## 7. Cleanup checklist (do when abandoning the experiment branches)

- [ ] `feature/newpassive-hero` is the keeper; decide whether to fast-forward it to the
      corrected `refine-c` work or cherry-pick.
- [ ] Remove worktrees (junction first): `…-workspace-race-a`, `…-workspace-race-b`,
      and `…-workspace-refine-c` once merged. `git worktree prune` after.
- [ ] Orphaned dir possibly left at `D:\projects\ptah-extension\.tribunal\refine-c`
      (deregistered from git; delete manually if present).
- [ ] Loser branches (`…hero-a`, `…hero-b`, `…refine-d`) can be deleted; kept for audit.

---

## 8. How to run / review

```bash
# from the latest worktree
cd D:/projects/angular-3d-workspace-refine-c
# (ensure node_modules junction exists — see §6)
npx nx serve angular-3d-demo --port 4220
# open http://localhost:4220/newpassive
```

Tribunal record: initial RACE (2 Fable-5 lanes) → winner P2 landed; refinement RACE
(2 lanes) → refine-C kept; single-track image-backed hybrid → `dc2946f`. Panel model
throughout: `claude-fable-5[1m]` via ptah-cli `pc-45aa18a4-d3a1-4809-acae-e6eba6d2f95c`.
