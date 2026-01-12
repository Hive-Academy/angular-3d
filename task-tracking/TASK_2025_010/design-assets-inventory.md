# Design Assets Inventory - TASK_2025_010

> **Asset Management for Hive Academy Angular Libraries Showcase**

---

## Asset Status

**✅ All Required Assets Already Exist**

No new asset generation was required for this design. All visuals leverage:

1. Existing 3D models and textures from `temp/assets/`
2. Library components for inline 3D scenes
3. SVG icons for social links (standard open-source icons)
4. Code-generated visuals (3D scenes, particles, geometries)

---

## Existing Assets Inventory

### 3D Models

**Location**: `temp/assets/3d/` (to be migrated to `apps/angular-3d-demo/src/assets/3d/`)

| Asset       | File Path                 | Usage                              | Size   |
| ----------- | ------------------------- | ---------------------------------- | ------ |
| Earth Model | `planet_earth/scene.gltf` | Hero space scene (central planet)  | ~2MB   |
| Mini Robot  | `mini_robot.glb`          | Hero space scene (flying robot)    | ~500KB |
| Robo Head   | `robo_head/scene.gltf`    | Hero space scene (secondary robot) | ~1MB   |

**Migration Required**: Copy these to demo app assets folder during implementation.

---

### Textures

**Location**: `temp/assets/`

| Asset        | File Path  | Usage                           | Format |
| ------------ | ---------- | ------------------------------- | ------ |
| Moon Texture | `moon.jpg` | Planet component (moon surface) | JPG    |

---

### SVG Logos (Tech Stack)

**Location**: `temp/assets/images/logos/`

| Asset          | File Path       | Usage                      | Color  |
| -------------- | --------------- | -------------------------- | ------ |
| NestJS Logo    | `nestjs.svg`    | Hero scene (floating logo) | Red    |
| LangChain Logo | `langchain.svg` | Hero scene (floating logo) | Green  |
| ChromaDB Logo  | `chroma.svg`    | Hero scene (floating logo) | Purple |
| Neo4j Logo     | `neo4j.svg`     | Hero scene (floating logo) | Blue   |

**Usage**: These are rendered as 3D SVG icons using `SVGIconComponent` with `Float3dDirective`.

---

### Social Icons (Standard)

**Location**: Use icon library or inline SVG

| Icon      | Usage                         | Source                 |
| --------- | ----------------------------- | ---------------------- |
| GitHub    | Footer social links, Nav link | Heroicons / Inline SVG |
| Discord   | Footer social links           | Heroicons / Inline SVG |
| Twitter   | Footer social links           | Heroicons / Inline SVG |
| Copy Icon | Install command copy button   | Heroicons / Inline SVG |

**Implementation**: Use Heroicons or similar open-source icon library. All icons inlined as SVG for performance.

---

## Code-Generated Visuals

### 3D Scenes (Component-Based)

These are **not** static images but **live 3D scenes** rendered in real-time:

| Scene                  | Component                    | Elements                                                       | Location                        |
| ---------------------- | ---------------------------- | -------------------------------------------------------------- | ------------------------------- |
| Hero Space Scene       | `Hero3dSceneComponent`       | Earth model, stars, nebula, robots, logos, particle text       | Section 1 (Hero)                |
| CTA Polyhedrons        | `Cta3dSceneComponent`        | 3 floating polyhedrons (icosahedron, octahedron, dodecahedron) | Section 6 (CTA)                 |
| Value Props Geometries | `ValueProps3dSceneComponent` | 11 rotating primitives                                         | Section 4 (Angular-3D Features) |

**Assets Used**: None (generated via library primitives and Three.js)

---

### Particle Effects

All particle systems use `@hive-academy/angular-3d` components:

| Effect        | Component               | Configuration                                  | Usage                 |
| ------------- | ----------------------- | ---------------------------------------------- | --------------------- |
| Star Field    | `StarFieldComponent`    | 3000 stars (1500 mobile), 3 layers, parallax   | Hero scene background |
| Nebula Clouds | `NebulaComponent`       | Volumetric, opacity 0.4, purple/blue           | Hero scene depth      |
| Particle Text | `ParticleTextComponent` | 60 particles (30 mobile), text: "Hive Academy" | Hero scene branding   |

---

## Asset Optimization

### Performance Guidelines

**GLTF Models**:

- Already optimized in source
- Draco compression enabled (if available)
- Progressive loading with loading spinner

**Textures**:

- Use WebP format where possible
- Lazy load textures not in viewport
- Mipmapping enabled in Three.js

**Particle Counts** (Responsive):

- Desktop (≥1024px): 100% (3000 stars, 60 particles)
- Tablet (768-1023px): 75% (2250 stars, 45 particles)
- Mobile (<768px): 50% (1500 stars, 30 particles)

---

## Asset Migration Checklist

When implementing the design, developers should:

- [ ] Copy `temp/assets/3d/` → `apps/angular-3d-demo/src/assets/3d/`
- [ ] Copy `temp/assets/images/logos/` → `apps/angular-3d-demo/src/assets/images/logos/`
- [ ] Copy `temp/assets/moon.jpg` → `apps/angular-3d-demo/src/assets/moon.jpg`
- [ ] Configure asset paths in `angular.json` (if needed)
- [ ] Test all asset loading paths
- [ ] Implement loading states for GLTF models
- [ ] Verify responsive particle counts work

---

## Why No New Assets Were Generated

**Design Strategy**: This landing page design leverages the **strength of the libraries themselves** to create visuals:

1. **3D Scenes as Visuals**: Instead of static hero images, we use live 3D scenes built with the library components—this showcases library capabilities directly.

2. **Component-Based Graphics**: Feature cards use inline 3D demos (rotating cubes, particle systems, etc.) rather than static images.

3. **Code as Art**: The entire visual experience is created through component composition, demonstrating the library's ease of use.

4. **Performance**: No image assets means faster loads and smaller bundle sizes.

5. **Maintainability**: Components can be updated without regenerating assets.

---

## Asset Naming Conventions

**If developers add custom assets**, follow these conventions:

**File Naming**:

- Lowercase with hyphens: `hero-background.webp`
- Descriptive: `angular-3d-logo.svg` not `logo1.svg`
- Versioned if needed: `hero-v2.webp`

**Directory Structure**:

```
apps/angular-3d-demo/src/assets/
├── 3d/                  # GLTF/GLB models
├── images/
│   ├── logos/          # SVG logos
│   ├── icons/          # UI icons
│   └── backgrounds/    # Background images (if needed)
└── textures/           # Material textures
```

---

## Accessibility for Visual Assets

### Alt Text for 3D Scenes

All 3D scenes should have `aria-label`:

```html
<scene-3d aria-label="Interactive 3D space scene with Earth and floating robots">
  <!-- ... -->
</scene-3d>
```

### Icon Accessibility

All SVG icons should have titles or `aria-label`:

```html
<svg aria-label="GitHub icon">...</svg>
```

### Loading States

Show accessible loading indicators:

```html
<div role="status" aria-live="polite">
  @if (isLoading()) {
  <span>Loading 3D model...</span>
  }
</div>
```

---

## Future Asset Needs

**Out of Scope for Current Task** (Future Enhancements):

- [ ] Custom logo design for Hive Academy brand
- [ ] OG image for social sharing (1200x630px)
- [ ] Favicon set (16x16, 32x32, 180x180, 512x512)
- [ ] Loading spinner animation
- [ ] 404 page custom illustration
- [ ] Dark mode specific assets (if UI differs significantly)

---

**Summary**: This design requires **zero new asset generation**. All visuals are created using existing 3D models, library components, and code-generated effects. This showcases the library's capabilities while maintaining optimal performance and bundle size.
