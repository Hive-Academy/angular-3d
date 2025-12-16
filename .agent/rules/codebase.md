---
trigger: always_on
---

# Angular 3D Library - Codebase Context

> **Glob-activated context** for `@hive-academy/angular-3d` development.

## 🎯 Overview

**Purpose**: Angular library wrapping Three.js directly, replacing `angular-three`.

**Tech Stack**: Angular 20.3 | Nx 22.2.6 | TypeScript 5.9 | Jest | Three.js

**Structure**:

```
apps/angular-3d-demo/       # Demo app
docs/angular-3d-library/    # 8 docs + 12 vanilla Three.js guides
temp/angular-3d/            # Reference: components, directives, services
temp/scene-graphs/          # Example scenes (acceptance tests)
```

**Constraints**: Only angular-3d imports `three` | Signal-based state | OnPush detection

---

## 📋 Commands

```bash
npm install                          # Install deps
npx nx serve angular-3d-demo         # Dev server
npx nx test angular-3d-demo          # Unit tests
npx nx e2e angular-3d-demo-e2e       # E2E tests
```

---

## 🔍 Components (`temp/angular-3d/components/**/*.ts`)

**26 primitives**: Planet, StarField, Nebula, GltfModel, ParticleText, SVGIcon, Fog, etc.

**Patterns**:

```typescript
readonly position = input<[number, number, number]>([0, 0, 0]);
ngAfterViewInit() { this.createMesh(); this.addToScene(this.mesh); }
ngOnDestroy() { this.geometry?.dispose(); this.material?.dispose(); }
```

**Rules**: Dispose all resources | OnPush | Empty templates | Use `effect()` for reactivity

---

## 🔍 Directives (`temp/angular-3d/directives/**/*.ts`)

**10+ directives**: Float3d, Rotate3d, SpaceFlight3d, Glow3d, ScrollZoomCoordinator

**Patterns**:

```typescript
private hostComponent = inject(HostComponentWithMesh);
this.animationService.floatAnimation(mesh, { height: 0.3 });
```

**Rules**: Kill animations in `ngOnDestroy` | Access objects after init | Config via inputs

---

## 🔍 Services (`temp/angular-3d/services/**/*.ts`)

| Service                     | Purpose                                      |
| --------------------------- | -------------------------------------------- |
| `Angular3DStateStore`       | Signal-based state (scenes, cameras, lights) |
| `AnimationService`          | GSAP animations (float, rotate, flight)      |
| `PerformanceMonitorService` | FPS, frame time tracking                     |

**Patterns**:

```typescript
private readonly _state = signal<AppState>(initial);
readonly activeScene = computed(() => this._state().scenes[this._state().activeSceneId]);
```

**Rules**: Immutable updates | Root injectable | `effect({ allowSignalWrites: true })`

---

## 🔍 Scene Graphs (`temp/scene-graphs/**/*.ts`)

4 scenes: `hero-space-scene`, `hero-scene-graph`, `cta-scene-graph`, `value-propositions-3d`

**Rules**: Keep as acceptance tests | Use library components | Document patterns

---

## 🔍 Docs (`docs/angular-3d-library/**/*.md`)

- `01-08`: Scene container, lifecycle, render loop, usage inventory, requirements, blueprint, mapping, linting
- `threejs-vanilla/`: 12 pure Three.js reference guides

---

## 🧠 Patterns

**Error Handling**: try/catch with disposal on error
**State**: Signal-based, immutable updates via `_state.update()`
**Testing**: Co-located `*.spec.ts` | Jest | Playwright e2e

---

## 🗺️ Quick Reference

| Find           | Location                                             |
| -------------- | ---------------------------------------------------- |
| Components     | `temp/angular-3d/components/`                        |
| Directives     | `temp/angular-3d/directives/`                        |
| State Store    | `temp/angular-3d/services/angular-3d-state.store.ts` |
| Scene Examples | `temp/scene-graphs/`                                 |
| Docs           | `docs/angular-3d-library/`                           |

---

## ⚠️ Migration

**Status**: `temp/` uses `angular-three` (to be replaced)

**Strategy**: Template Migration - convert `ngt-*` tags to Angular components (strongest typing, no CUSTOM_ELEMENTS_SCHEMA)

See: `05-angular-3d-package-requirements.md`, `06-new-workspace-blueprint.md`
