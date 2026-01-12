# Launch Content: @hive-academy/angular-3d & @hive-academy/angular-gsap

Two Angular libraries for 3D graphics and scroll animations. Open source, MIT licensed.

---

## 1. Reddit Posts

### r/Angular

**Title:** Two Angular libraries for 3D graphics (Three.js) and scroll animations (GSAP)

**Body:**

I built two Angular libraries that wrap Three.js and GSAP into declarative components and directives.

**@hive-academy/angular-3d**

- 54 components (primitives, lights, text, particles, effects, loaders)
- 24 directives (animations, materials, geometries)
- 14 services (scene management, render loop, asset loading)
- WebGPU ready with TSL node-based materials
- SSR compatible

```typescript
import { Scene3dComponent, BoxComponent, Float3dDirective } from '@hive-academy/angular-3d';

@Component({
  standalone: true,
  imports: [Scene3dComponent, BoxComponent, Float3dDirective],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
      <a3d-box [color]="'#ff6b6b'" float3d />
    </a3d-scene-3d>
  `,
})
export class MyComponent {}
```

**@hive-academy/angular-gsap**

- 7 components (timelines, feature showcases, split panels)
- 19 directives (scroll animations, viewport triggers, parallax)
- 2 services + 2 providers
- 12 built-in animations (fade, slide, scale, parallax, bounce, flip)
- Lenis smooth scroll integration

```typescript
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `<h1 scrollAnimation>Fades in on scroll</h1>`,
})
export class HeroComponent {}
```

**Install:**

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
npm install @hive-academy/angular-gsap gsap lenis
```

GitHub: https://github.com/hive-academy/angular-3d-workspace

---

This is our first public release. If you try it out, we'd appreciate any feedback on the API design. Does the component structure feel natural for Angular? Open an issue or drop a comment here. Thanks for taking the time to look at this.

---

### r/threejs

**Title:** Angular wrapper for Three.js - 54 declarative components

**Body:**

I built an Angular library that wraps Three.js into declarative components. Instead of imperative setup, you write templates:

```typescript
import {
  Scene3dComponent,
  SphereComponent,
  SceneLightingComponent,
  BloomEffectComponent,
  EffectComposerComponent
} from '@hive-academy/angular-3d';

@Component({
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 2, 5]">
      <a3d-scene-lighting />
      <a3d-sphere
        [color]="'#4ecdc4'"
        [metalness]="0.8"
        [roughness]="0.2"
        float3d
        rotate3d
      />
      <a3d-effect-composer>
        <a3d-bloom-effect [strength]="1.5" [threshold]="0.1" />
      </a3d-effect-composer>
    </a3d-scene-3d>
  `,
})
```

**What's included:**

- 54 components: primitives, lights, text (Troika), particles, metaballs, nebulas, planets
- 24 directives: float, rotate, mouse tracking, materials, geometries
- 8 postprocessing effects: bloom, DOF, SSAO, chromatic aberration, film grain
- GLTF/GLB loader with caching
- WebGPU support via TSL node-based materials (40+ shader utilities)
- Handles cleanup automatically (geometry/material disposal)

**Technical notes:**

- Uses Angular signals for reactive updates
- Scene/camera/renderer accessible via DI (SceneService)
- Per-frame updates through RenderLoopService
- SSR safe (Three.js only initializes in browser)

**Install:**

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
```

GitHub: https://github.com/hive-academy/angular-3d-workspace

---

This is our first release. If you work with Three.js and have thoughts on the API design, we'd like to hear them. Specifically: does the component hierarchy make sense? Is the postprocessing setup intuitive? Open an issue or comment here.

---

### r/webdev

**Title:** Angular libraries for 3D scenes and scroll animations

**Body:**

Built two Angular libraries for common interactive features:

**Problem 1: Adding 3D graphics to Angular apps**

Three.js has a lot of boilerplate. You need to set up renderers, scenes, cameras, animation loops, handle cleanup, manage state. This library wraps it into components:

```typescript
<a3d-scene-3d [cameraPosition]="[0, 0, 5]">
  <a3d-orbit-controls />
  <a3d-scene-lighting />
  <a3d-gltf-model [modelUrl]="'spaceship.glb'" [scale]="0.5" />
</a3d-scene-3d>
```

54 components, 24 directives. Includes primitives, lights, text, particles, postprocessing effects. Handles disposal automatically.

**Problem 2: Scroll-triggered animations**

GSAP ScrollTrigger requires manual plugin registration, trigger setup, cleanup. This library provides directives:

```typescript
<h1 scrollAnimation>Fades in when scrolled into view</h1>

<div scrollAnimation [scrollConfig]="{ animation: 'parallax', speed: 0.5, scrub: true }">
  Parallax background
</div>
```

7 components, 19 directives. Includes hijacked scroll sequences, feature showcases, split panels. 12 built-in animations.

**Install:**

```bash
# 3D graphics
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text

# Scroll animations
npm install @hive-academy/angular-gsap gsap lenis
```

Both are SSR compatible. MIT licensed.

GitHub: https://github.com/hive-academy/angular-3d-workspace

---

First public release. If you try either library, feedback on the developer experience would help. What works? What's confusing? Open an issue or comment here. Thanks.

---

## 2. Twitter/X Thread

**Tweet 1:**
Two Angular libraries we just open sourced:

@hive-academy/angular-3d - 54 Three.js components for 3D graphics
@hive-academy/angular-gsap - 19 GSAP directives for scroll animations

MIT licensed. Here's what they do:

**Tweet 2:**
angular-3d turns Three.js setup into template syntax:

```typescript
<a3d-scene-3d [cameraPosition]="[0, 0, 5]">
  <a3d-box [color]="'#ff6b6b'" float3d rotate3d />
</a3d-scene-3d>
```

Primitives, lights, text, particles, postprocessing. Cleanup handled automatically.

**Tweet 3:**
Includes 8 postprocessing effects:

```typescript
<a3d-effect-composer>
  <a3d-bloom-effect [strength]="1.5" />
  <a3d-dof-effect [focusDistance]="0.02" />
</a3d-effect-composer>
```

Plus GLTF loading, orbit controls, TSL shaders for WebGPU.

**Tweet 4:**
angular-gsap adds scroll animations via directives:

```typescript
<h1 scrollAnimation>Fades in on scroll</h1>
```

12 built-in animations: fade, slide, scale, parallax, bounce, flip.

**Tweet 5:**
For more control, hijacked scroll sequences:

```typescript
<agsp-hijacked-scroll-timeline>
  <div hijackedScrollItem [slideDirection]="'left'">Step 1</div>
  <div hijackedScrollItem [slideDirection]="'right'">Step 2</div>
</agsp-hijacked-scroll-timeline>
```

Viewport pinned while scrolling through steps.

**Tweet 6:**
Install:

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text

npm install @hive-academy/angular-gsap gsap lenis
```

Docs: github.com/hive-academy/angular-3d-workspace

**Tweet 7:**
This is our first public release. If you try it, we'd appreciate feedback.

What's the API like to work with? Anything confusing?

Open an issue or reply here. Thanks for looking.

---

## 3. Discord Messages

### Angular Discord

**Channel:** #showcase or #libraries

---

Two Angular libraries for interactive features:

**@hive-academy/angular-3d** - Three.js wrapper
54 components, 24 directives, 14 services

```typescript
import { Scene3dComponent, SphereComponent, Float3dDirective } from '@hive-academy/angular-3d';

@Component({
  standalone: true,
  imports: [Scene3dComponent, SphereComponent, Float3dDirective],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
      <a3d-sphere [color]="'#4ecdc4'" [metalness]="0.8" float3d />
    </a3d-scene-3d>
  `,
})
export class SceneComponent {}
```

Uses signal inputs, standalone components, DI for scene access. SSR compatible.

**@hive-academy/angular-gsap** - GSAP scroll animations
7 components, 19 directives, 2 providers

```typescript
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `
    <div scrollAnimation [scrollConfig]="{ animation: 'slideUp', stagger: 0.1 }">
      <p>Item 1</p>
      <p>Item 2</p>
    </div>
  `,
})
export class ListComponent {}
```

Install:

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
npm install @hive-academy/angular-gsap gsap lenis
```

GitHub: https://github.com/hive-academy/angular-3d-workspace

First release. If you try it, let us know what works and what doesn't. Thanks.

---

### Three.js Discord

**Channel:** #showcase or #libraries

---

Built an Angular wrapper for Three.js. Declarative components instead of imperative setup.

**What it does:**

- 54 components (box, sphere, torus, lights, text, particles, metaballs, planets, nebulas)
- 24 directives (float, rotate, mouse tracking, materials)
- 8 postprocessing effects (bloom, DOF, SSAO, chromatic aberration)
- GLTF loader with caching
- TSL node-based materials for WebGPU

```typescript
<a3d-scene-3d [cameraPosition]="[0, 0, 5]">
  <a3d-orbit-controls [enableDamping]="true" />
  <a3d-scene-lighting />

  <a3d-gltf-model
    [modelUrl]="'spaceship.glb'"
    [scale]="0.5"
    float3d
  />

  <a3d-star-field [count]="5000" [radius]="50" />

  <a3d-effect-composer>
    <a3d-bloom-effect [strength]="1.5" [threshold]="0.1" />
  </a3d-effect-composer>
</a3d-scene-3d>
```

Scene, camera, renderer accessible via Angular DI (SceneService). Frame updates through RenderLoopService. Cleanup automatic.

Install:

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
```

GitHub: https://github.com/hive-academy/angular-3d-workspace

First release. Feedback on the API design would help. Does the component nesting make sense? Is postprocessing setup clear? Thanks.

---

## 4. LinkedIn Post

---

**Open source: Angular libraries for 3D graphics and scroll animations**

We just released two Angular libraries:

**@hive-academy/angular-3d** wraps Three.js into 54 declarative components. Instead of writing imperative WebGL code, developers use Angular templates:

```
<a3d-scene-3d>
  <a3d-box color="#ff6b6b" float3d />
</a3d-scene-3d>
```

Includes primitives, lighting, text rendering, particle systems, postprocessing effects, and GLTF model loading. WebGPU ready.

**@hive-academy/angular-gsap** provides 19 directives for scroll-triggered animations. Add scroll effects without manual ScrollTrigger setup:

```
<h1 scrollAnimation>Animates on scroll</h1>
```

Includes hijacked scroll sequences, parallax effects, and Lenis smooth scrolling.

Both libraries use modern Angular patterns: standalone components, signal inputs, dependency injection. SSR compatible.

MIT licensed.

GitHub: https://github.com/hive-academy/angular-3d-workspace

npm:

- https://www.npmjs.com/package/@hive-academy/angular-3d
- https://www.npmjs.com/package/@hive-academy/angular-gsap

---

## 5. Dev.to Article Outline

**Title:** Getting Started with 3D Graphics in Angular using @hive-academy/angular-3d

**Subtitle:** Build interactive Three.js scenes with declarative Angular components

---

### Outline

**1. Introduction**

- What the library does
- When you might use it (hero sections, product visualizations, interactive backgrounds)
- Prerequisites (Angular 20+, basic Three.js concepts helpful but not required)

**2. Installation**

- npm install command with all peer dependencies
- Verify installation

**3. Your First Scene**

- Minimal example: Scene3dComponent + BoxComponent
- Styling the container (width, height)
- Result: spinning box

**4. Adding Lighting**

- Why lighting matters (default is unlit)
- SceneLightingComponent for quick setup
- Individual lights for more control (AmbientLightComponent, DirectionalLightComponent)

**5. Materials and Appearance**

- Common inputs: color, metalness, roughness, opacity
- Example: metallic sphere

**6. Animation Directives**

- Float3dDirective: gentle bobbing motion
- Rotate3dDirective: continuous rotation
- Combining directives

**7. Loading 3D Models**

- GltfModelComponent
- Pointing to .glb files
- Position, scale, rotation inputs

**8. Camera Controls**

- OrbitControlsComponent
- Enabling damping, zoom limits

**9. Postprocessing Effects**

- EffectComposerComponent as container
- BloomEffectComponent for glow
- Combining multiple effects

**10. Accessing Three.js Directly**

- SceneService for scene/camera/renderer access
- RenderLoopService for per-frame callbacks
- When you need escape hatches

**11. Performance and SSR**

- Automatic SSR handling
- Performance3dDirective for LOD

**12. Next Steps**

- Link to full API documentation
- Link to angular-gsap for scroll integration
- GitHub repo

---

## Quality Verification Checklist

- [x] No superlatives or hype words used
- [x] Component counts match README: 54 components, 24 directives for angular-3d
- [x] Component counts match README: 7 components, 19 directives for angular-gsap
- [x] All code examples use correct selectors (a3d-, agsp-)
- [x] npm package names exact: @hive-academy/angular-3d, @hive-academy/angular-gsap
- [x] Install commands include all peer dependencies
- [x] Each piece has GitHub link
- [x] Feedback requests use humble, specific, low-barrier tone
