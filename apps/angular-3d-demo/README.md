# Angular 3D Demo

**Demo application** showcasing the [@hive-academy/angular-3d](../../libs/angular-3d) and [@hive-academy/angular-gsap](../../libs/angular-gsap) libraries.

---

## Overview

This demo application demonstrates:

- **@hive-academy/angular-3d**: Component-based Three.js wrapper for Angular
- **@hive-academy/angular-gsap**: Signal-based GSAP directives for scroll animations
- **Multi-page architecture**: Lazy-loaded routes for optimal performance
- **Responsive design**: Mobile, tablet, and desktop support
- **3D scenes**: Hero space scenes, primitives showcase, and floating geometries

---

## Architecture

### Routes

| Route           | Component                    | Description                     |
| --------------- | ---------------------------- | ------------------------------- |
| `/`             | `HomeComponent`              | Dual hero layout with CTAs      |
| `/angular-3d`   | `Angular3dShowcaseComponent` | 3D primitives and scene demos   |
| `/angular-gsap` | `GsapShowcaseComponent`      | GSAP animations (TASK_2025_012) |

### Key Components

- **Shared**: `NavigationComponent`, `FooterComponent`
- **Pages**: `HomeComponent`, `Angular3dShowcaseComponent`, `GsapShowcaseComponent`
- **Sections**: `Hero3dTeaserComponent`, `HeroGsapTeaserComponent`, `LibraryOverviewComponent`, `CtaSectionComponent`, `PrimitivesShowcaseComponent`
- **Scenes**: `HeroSpaceSceneComponent`, `ValueProps3dSceneComponent`, `CtaSceneComponent`

---

## Development

### Start Dev Server

```bash
npx nx serve angular-3d-demo
```

Navigate to `http://localhost:4200`

### Build

```bash
npx nx build angular-3d-demo
```

Production build output: `dist/apps/angular-3d-demo`

### Test

```bash
npx nx test angular-3d-demo
```

### Lint

```bash
npx nx lint angular-3d-demo
```

---

## Libraries Used

### @hive-academy/angular-3d

- **Primitives**: Box, Sphere, Cylinder, Torus, Polyhedron, Cone, etc.
- **Advanced**: GLTF models, Star fields, Nebulae, Particle systems
- **Effects**: Bloom, OrbitControls
- **Directives**: Rotate3d, Float3d, SpaceFlight3d

### @hive-academy/angular-gsap

- **Directives**: ScrollAnimation, HijackedScroll
- **Components**: Timeline orchestration
- **SSR Compatible**: Safe for Angular Universal

---

## Project Structure

```
src/
  app/
    pages/           # Route components
    sections/        # Reusable sections
    scenes/          # 3D scene components
    shared/          # Shared components (nav, footer)
  assets/           # Static assets (moved from temp/)
public/
  3d/               # GLTF models
  images/           # Images and textures
```

---

## Notes

- **GSAP Integration**: TASK_2025_012 will enhance GSAP showcase page
- **Assets**: Copied from `temp/assets/` during implementation
- **3D Scenes**: Migrated from `temp/scene-graphs/` using template migration pattern
- **Responsive**: Star field particle counts adjust based on screen size

---

## License

MIT
