# @hive-academy/angular-3d

[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE)

> 🎨 **Declarative Three.js components for Angular applications**

A modern Angular library providing declarative, type-safe wrappers for Three.js. Build stunning 3D graphics experiences with familiar Angular patterns using signals, standalone components, and dependency injection.

## ✨ Features

- 🎯 **Declarative API** - Configure 3D scenes via Angular inputs and signals
- 🎬 **Scene Container** - Automatic WebGLRenderer, Scene, and Camera setup
- 📦 **54 Components** - Primitives, lights, text, particles, effects, loaders, and more
- 💡 **5 Light Types** - Ambient, Directional, Point, Spot, and preset SceneLighting
- 🌊 **Animation Directives** - Float3d, Rotate3d, and waypoint-based flight animations
- 🎮 **Orbit Controls** - Interactive camera controls out of the box
- 📥 **Asset Loaders** - GLTF/GLB models, SVG icons, and texture loading
- 🎬 **Scene Loading & Entrance** - Asset preloading with cinematic camera animations
- 🌈 **Postprocessing** - Bloom, DOF, SSAO, color grading, and 8+ effects
- 🚀 **WebGPU Ready** - TSL (Three.js Shading Language) node-based materials
- 🌐 **SSR Compatible** - Safely handles server-side rendering
- 🌳 **Tree-Shakeable** - Import only what you need
- 🎓 **TypeScript First** - Full type safety and IntelliSense support

> **Scope**: This library provides **3D graphics components**. For scroll animations, see [`@hive-academy/angular-gsap`](../angular-gsap).

---

## 📦 Installation

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
```

**Peer Dependencies**:

| Package             | Version  | Purpose                                      |
| ------------------- | -------- | -------------------------------------------- |
| `@angular/core`     | ~20.3.0  | Angular framework                            |
| `@angular/common`   | ~20.3.0  | Angular common utilities                     |
| `three`             | ^0.182.0 | Three.js core library                        |
| `three-stdlib`      | ^2.35.0  | Three.js extensions (OrbitControls, loaders) |
| `gsap`              | ^3.14.2  | Animation engine (used by Float3d, Rotate3d) |
| `maath`             | ^0.10.8  | Math utilities for 3D calculations           |
| `troika-three-text` | ^0.52.4  | 3D text rendering                            |
| `rxjs`              | ~7.8.0   | Reactive extensions                          |

---

## 🚀 Quick Start

### Example 1: Basic Scene with Box

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, BoxComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-basic-scene',
  standalone: true,
  imports: [Scene3dComponent, BoxComponent],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
      <a3d-box [position]="[0, 0, 0]" [color]="'#ff6b6b'" />
    </a3d-scene-3d>
  `,
  styles: [
    `
      a3d-scene-3d {
        display: block;
        width: 100%;
        height: 400px;
      }
    `,
  ],
})
export class BasicSceneComponent {}
```

### Example 2: Scene with Lighting

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, SphereComponent, SceneLightingComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-lit-scene',
  standalone: true,
  imports: [Scene3dComponent, SphereComponent, SceneLightingComponent],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 2, 5]">
      <a3d-scene-lighting />
      <a3d-sphere [position]="[0, 0, 0]" [color]="'#4ecdc4'" [metalness]="0.8" [roughness]="0.2" />
    </a3d-scene-3d>
  `,
})
export class LitSceneComponent {}
```

### Example 3: Animated Scene

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, TorusComponent, Float3dDirective, Rotate3dDirective, SceneLightingComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-animated-scene',
  standalone: true,
  imports: [Scene3dComponent, TorusComponent, Float3dDirective, Rotate3dDirective, SceneLightingComponent],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 0, 5]">
      <a3d-scene-lighting />
      <a3d-torus [position]="[0, 0, 0]" [color]="'#9b59b6'" float3d rotate3d />
    </a3d-scene-3d>
  `,
})
export class AnimatedSceneComponent {}
```

---

## 📚 API Reference

### Scene Container

#### Scene3dComponent

Root scene container automatically sets up WebGLRenderer, Scene, PerspectiveCamera, and render loop.

**Selector**: `<a3d-scene-3d>`

**Inputs**:

- `cameraPosition?: [number, number, number]` - Camera position (default: `[0, 0, 5]`)
- `cameraTarget?: [number, number, number]` - Camera look-at target (default: `[0, 0, 0]`)
- `backgroundColor?: string` - Scene background color
- `fov?: number` - Camera field of view (default: 75)
- `enableShadows?: boolean` - Enable shadow rendering
- `rendererOptions?: WebGLRendererParameters` - Custom renderer config

---

### Geometry Primitives

| Component               | Selector                | Description                                     |
| ----------------------- | ----------------------- | ----------------------------------------------- |
| BoxComponent            | `<a3d-box>`             | Box/cube mesh with configurable size            |
| SphereComponent         | `<a3d-sphere>`          | Sphere mesh with radius and segments            |
| CylinderComponent       | `<a3d-cylinder>`        | Cylinder mesh with height and radius            |
| TorusComponent          | `<a3d-torus>`           | Torus (donut) mesh                              |
| PolyhedronComponent     | `<a3d-polyhedron>`      | Platonic solids (tetrahedron, octahedron, etc.) |
| FloatingSphereComponent | `<a3d-floating-sphere>` | Pre-animated floating sphere                    |

**Common Inputs** (all primitives):

- `position?: [number, number, number]` - Position in 3D space
- `rotation?: [number, number, number]` - Rotation in radians
- `scale?: [number, number, number] | number` - Scale factor
- `color?: string` - Material color (hex or CSS color name)
- `metalness?: number` - Metalness (0-1, default: 0)
- `roughness?: number` - Roughness (0-1, default: 0.5)
- `opacity?: number` - Opacity (0-1, default: 1)
- `transparent?: boolean` - Enable transparency

---

### Lights

| Component                 | Selector                  | Description                                 |
| ------------------------- | ------------------------- | ------------------------------------------- |
| AmbientLightComponent     | `<a3d-ambient-light>`     | Uniform ambient illumination                |
| DirectionalLightComponent | `<a3d-directional-light>` | Sun-like directional light with shadows     |
| PointLightComponent       | `<a3d-point-light>`       | Omnidirectional point light                 |
| SpotLightComponent        | `<a3d-spot-light>`        | Focused cone spotlight                      |
| SceneLightingComponent    | `<a3d-scene-lighting>`    | Preset lighting rig (ambient + directional) |

**Example**:

```html
<a3d-scene-3d>
  <a3d-ambient-light [intensity]="0.5" />
  <a3d-directional-light [position]="[5, 5, 5]" [intensity]="1.0" [castShadow]="true" />
  <a3d-sphere [receiveShadow]="true" [castShadow]="true" />
</a3d-scene-3d>
```

---

### Text Components

| Component                     | Selector                       | Description                      |
| ----------------------------- | ------------------------------ | -------------------------------- |
| TroikaTextComponent           | `<a3d-troika-text>`            | Basic 3D text using Troika       |
| ResponsiveTroikaTextComponent | `<a3d-responsive-troika-text>` | Responsive 3D text with maxWidth |
| GlowTroikaTextComponent       | `<a3d-glow-troika-text>`       | 3D text with glow effect         |
| SmokeTroikaTextComponent      | `<a3d-smoke-troika-text>`      | 3D text with smoke effect        |
| ParticlesTextComponent        | `<a3d-particle-text>`          | Text rendered as particles       |
| BubbleTextComponent           | `<a3d-bubble-text>`            | Text with bubble effect          |
| ExtrudedText3dComponent       | `<a3d-extruded-text-3d>`       | Extruded 3D text with depth      |

**Example**:

```html
<a3d-troika-text [text]="'Hello 3D World'" [fontSize]="0.5" [color]="'#ffffff'" [position]="[0, 0, 0]" />
```

---

### Space-Themed Components

| Component                 | Selector                  | Description                     |
| ------------------------- | ------------------------- | ------------------------------- |
| PlanetComponent           | `<a3d-planet>`            | Planet with optional atmosphere |
| StarFieldComponent        | `<a3d-star-field>`        | Particle-based star background  |
| NebulaComponent           | `<a3d-nebula>`            | Volumetric nebula effect        |
| NebulaVolumetricComponent | `<a3d-nebula-volumetric>` | Advanced volumetric nebula      |
| CloudLayerComponent       | `<a3d-cloud-layer>`       | Cloud layer effect              |

**Example**:

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 10]">
  <a3d-star-field [count]="5000" [radius]="50" />
  <a3d-planet [radius]="2" [textureUrl]="'assets/earth.jpg'" [hasAtmosphere]="true" />
  <a3d-nebula [position]="[-10, 0, -20]" [color]="'#9b59b6'" />
</a3d-scene-3d>
```

---

### Particle Systems

| Component                     | Selector                       | Description                     |
| ----------------------------- | ------------------------------ | ------------------------------- |
| ParticleSystemComponent       | `<a3d-particle-system>`        | Configurable particle effects   |
| MarbleParticleSystemComponent | `<a3d-marble-particle-system>` | Marble-styled particles         |
| GpuParticleSphereComponent    | `<a3d-gpu-particle-sphere>`    | GPU-accelerated particle sphere |
| SparkleCoronaComponent        | `<a3d-sparkle-corona>`         | Sparkle/corona effect           |
| ParticleCloudComponent        | `<a3d-particle-cloud>`         | Particle cloud effect           |

---

### Visual Effects

| Component                | Selector                 | Description                        |
| ------------------------ | ------------------------ | ---------------------------------- |
| MetaballSceneComponent   | `<a3d-metaball-scene>`   | Metaball container (compositional) |
| MetaballSphereComponent  | `<a3d-metaball-sphere>`  | Individual metaball sphere         |
| MetaballCursorComponent  | `<a3d-metaball-cursor>`  | Cursor-following metaball          |
| MarbleSphereComponent    | `<a3d-marble-sphere>`    | Marble material sphere             |
| FireSphereComponent      | `<a3d-fire-sphere>`      | Fire/flame effect sphere           |
| BackgroundCubesComponent | `<a3d-background-cubes>` | Decorative background cubes        |
| ThrusterFlameComponent   | `<a3d-thruster-flame>`   | Thruster/rocket flame effect       |

> **Note**: `MetaballComponent` (`<a3d-metaball>`) is deprecated. Use the compositional API with `MetaballSceneComponent`, `MetaballSphereComponent`, and `MetaballCursorComponent` instead.

---

### Backgrounds

| Component                             | Selector                               | Description                        |
| ------------------------------------- | -------------------------------------- | ---------------------------------- |
| HexagonalBackgroundInstancedComponent | `<a3d-hexagonal-background-instanced>` | GPU-instanced hexagonal background |

---

### Scene Organization

| Component               | Selector                | Description                     |
| ----------------------- | ----------------------- | ------------------------------- |
| GroupComponent          | `<a3d-group>`           | Object3D container for grouping |
| FogComponent            | `<a3d-fog>`             | Scene fog effect                |
| EnvironmentComponent    | `<a3d-environment>`     | Environment mapping             |
| BackgroundCubeComponent | `<a3d-background-cube>` | Skybox background               |
| InstancedMeshComponent  | `<a3d-instanced-mesh>`  | Instanced mesh rendering        |

**Example - Grouping objects**:

```html
<a3d-scene-3d>
  <a3d-group [position]="[0, 2, 0]" rotate3d>
    <a3d-box [position]="[-1, 0, 0]" />
    <a3d-sphere [position]="[1, 0, 0]" />
  </a3d-group>
</a3d-scene-3d>
```

---

### Loaders

| Component          | Selector           | Description               |
| ------------------ | ------------------ | ------------------------- |
| GltfModelComponent | `<a3d-gltf-model>` | GLTF/GLB model loader     |
| SvgIconComponent   | `<a3d-svg-icon>`   | SVG extruded as 3D object |

**Example - Loading GLTF model**:

```html
<a3d-gltf-model [modelUrl]="'assets/models/spaceship.glb'" [scale]="0.5" [position]="[0, 0, 0]" [autoRotate]="true" />
```

---

### Postprocessing Effects

| Component                          | Selector                            | Description                    |
| ---------------------------------- | ----------------------------------- | ------------------------------ |
| EffectComposerComponent            | `<a3d-effect-composer>`             | Postprocessing container       |
| BloomEffectComponent               | `<a3d-bloom-effect>`                | Bloom/glow effect              |
| SelectiveBloomEffectComponent      | `<a3d-selective-bloom-effect>`      | Selective bloom with luminance |
| DofEffectComponent                 | `<a3d-dof-effect>`                  | Depth of field                 |
| SsaoEffectComponent                | `<a3d-ssao-effect>`                 | Screen-space ambient occlusion |
| ColorGradingEffectComponent        | `<a3d-color-grading-effect>`        | LUT-based color grading        |
| ChromaticAberrationEffectComponent | `<a3d-chromatic-aberration-effect>` | Chromatic aberration           |
| FilmGrainEffectComponent           | `<a3d-film-grain-effect>`           | Film grain effect              |

**Example - Adding bloom**:

```html
<a3d-scene-3d>
  <a3d-effect-composer>
    <a3d-bloom-effect [strength]="1.5" [radius]="0.8" [threshold]="0.1" />
  </a3d-effect-composer>

  <a3d-sphere [color]="'#00ffff'" [emissiveIntensity]="1.0" />
</a3d-scene-3d>
```

---

## 🎮 Controls

### OrbitControlsComponent

Interactive camera controls with mouse/touch support.

**Selector**: `<a3d-orbit-controls>`

**Inputs**:

- `enableDamping?: boolean` - Enable smooth damping (default: true)
- `dampingFactor?: number` - Damping inertia (default: 0.05)
- `enableZoom?: boolean` - Enable zoom (default: true)
- `minDistance?: number` - Minimum zoom distance
- `maxDistance?: number` - Maximum zoom distance
- `target?: [number, number, number]` - Orbit target point

**Example**:

```html
<a3d-scene-3d>
  <a3d-orbit-controls [enableDamping]="true" [minDistance]="2" [maxDistance]="10" />
  <a3d-box />
</a3d-scene-3d>
```

---

## 🌊 Animation Directives

### Float3dDirective

Adds smooth floating/bobbing animation.

**Selector**: `[float3d]`

**Inputs**:

- `floatHeight?: number` - Float distance (default: 0.3)
- `floatSpeed?: number` - Animation speed (default: 1.5)

**Example**:

```html
<a3d-sphere float3d [floatHeight]="0.5" [floatSpeed]="2.0" />
```

---

### Rotate3dDirective

Continuous rotation animation.

**Selector**: `[rotate3d]`

**Inputs**:

- `rotateSpeed?: [number, number, number]` - Rotation speed per axis (default: `[0, 1, 0]`)

**Example**:

```html
<a3d-box rotate3d [rotateSpeed]="[0.5, 1, 0]" />
```

---

### SpaceFlight3dDirective

Waypoint-based flight animation for spaceship-like movement.

**Selector**: `[a3dSpaceFlight3d]`

**Inputs**:

- `waypoints?: Array<{ position: [number, number, number]; rotation?: [number, number, number] }>`
- `speed?: number` - Flight speed
- `loop?: boolean` - Loop through waypoints

---

## 🎯 Interaction Directives

### MouseTracking3dDirective

Makes objects follow mouse movement.

**Selector**: `[mouseTracking3d]`

**Inputs**:

- `trackingSpeed?: number` - Response speed (default: 0.1)
- `trackingRange?: number` - Movement range (default: 1.0)

**Example**:

```html
<a3d-sphere mouseTracking3d [trackingSpeed]="0.2" />
```

---

## 🎬 Scene Loading & Entrance Animations

Orchestrate professional scene loading experiences with asset preloading and cinematic camera entrances.

### Overview

The Scene Loading & Entrance Animation System provides:

- **Asset Preloading** - Load GLTF models and textures with unified progress tracking
- **Cinematic Camera Entrances** - 4 preset camera animations (dolly-in, orbit-drift, crane-up, fade-drift)
- **Object Reveal Animations** - 3 reveal effects (fade-in, scale-pop, rise-up)
- **Stagger Group Coordination** - Cascade reveal effects across multiple objects

### Quick Start

```typescript
import { Component, inject } from '@angular/core';
import { Scene3dComponent, OrbitControlsComponent, BoxComponent, SphereComponent, AssetPreloaderService, StaggerGroupService, CinematicEntranceDirective, SceneRevealDirective, type CinematicEntranceConfig } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-hero-scene',
  standalone: true,
  imports: [Scene3dComponent, OrbitControlsComponent, BoxComponent, SphereComponent, CinematicEntranceDirective, SceneRevealDirective],
  template: `
    <a3d-scene-3d [cameraPosition]="[0, 2, 8]">
      <a3d-orbit-controls a3dCinematicEntrance [entranceConfig]="entranceConfig" (entranceComplete)="onEntranceComplete()" />

      <a3d-box a3dSceneReveal [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'items', staggerIndex: 0 }" [position]="[-2, 0, 0]" [color]="'#ff6b6b'" />

      <a3d-sphere a3dSceneReveal [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'items', staggerIndex: 1 }" [position]="[2, 0, 0]" [color]="'#4ecdc4'" />
    </a3d-scene-3d>

    @if (!preloadState.isReady()) {
    <div class="loading">Loading: {{ preloadState.progress() }}%</div>
    }
  `,
})
export class HeroSceneComponent {
  private preloader = inject(AssetPreloaderService);
  private stagger = inject(StaggerGroupService);

  // Preload assets (optional - for heavy scenes)
  preloadState = this.preloader.preload([
    { url: '/assets/model.glb', type: 'gltf', weight: 3 },
    { url: '/assets/texture.jpg', type: 'texture' },
  ]);

  entranceConfig: CinematicEntranceConfig = {
    preset: 'dolly-in',
    duration: 2.5,
    preloadState: this.preloadState,
  };

  async onEntranceComplete(): Promise<void> {
    await this.stagger.revealGroup('items', 150);
  }
}
```

### AssetPreloaderService

Coordinates loading of multiple assets with unified progress tracking.

**Methods**:

| Method                      | Description                                  |
| --------------------------- | -------------------------------------------- |
| `preload(assets)`           | Load multiple assets, returns `PreloadState` |
| `getActiveOperationCount()` | Get number of active preload operations      |

**AssetDefinition**:

| Property   | Type        | Description                                          |
| ---------- | ----------- | ---------------------------------------------------- |
| `url`      | `string`    | URL of the asset to load                             |
| `type`     | `AssetType` | `'gltf'`, `'texture'`, or `'hdri'`                   |
| `weight?`  | `number`    | Weight for progress calculation (default: 1)         |
| `options?` | `object`    | Loader options (e.g., `{ useDraco: true }` for GLTF) |

**PreloadState** (reactive signals):

| Signal        | Type              | Description                         |
| ------------- | ----------------- | ----------------------------------- |
| `progress`    | `Signal<number>`  | Combined progress (0-100)           |
| `isReady`     | `Signal<boolean>` | True when all assets loaded         |
| `errors`      | `Signal<Error[]>` | Array of loading errors             |
| `loadedCount` | `Signal<number>`  | Count of successfully loaded assets |
| `totalCount`  | `Signal<number>`  | Total number of assets              |
| `cancel`      | `() => void`      | Cancel loading operation            |

---

### CinematicEntranceDirective

Applies cinematic camera entrance animations with preset patterns.

**Selector**: `[a3dCinematicEntrance]`

**Inputs**:

| Input            | Type                      | Description             |
| ---------------- | ------------------------- | ----------------------- |
| `entranceConfig` | `CinematicEntranceConfig` | Animation configuration |

**Outputs**:

| Output             | Type   | Description                      |
| ------------------ | ------ | -------------------------------- |
| `entranceStart`    | `void` | Emitted when animation starts    |
| `entranceComplete` | `void` | Emitted when animation completes |

**CinematicEntranceConfig**:

| Property         | Type             | Default          | Description                     |
| ---------------- | ---------------- | ---------------- | ------------------------------- |
| `preset?`        | `EntrancePreset` | subtle dolly-in  | Animation preset                |
| `duration?`      | `number`         | `2.5`            | Duration in seconds             |
| `startPosition?` | `[x, y, z]`      | (from preset)    | Override start camera position  |
| `endPosition?`   | `[x, y, z]`      | (current camera) | Override end camera position    |
| `startLookAt?`   | `[x, y, z]`      | (from preset)    | Override start look-at target   |
| `endLookAt?`     | `[x, y, z]`      | `[0, 0, 0]`      | Override end look-at target     |
| `easing?`        | `string`         | `'power2.inOut'` | GSAP easing function            |
| `delay?`         | `number`         | `0`              | Delay before animation starts   |
| `autoStart?`     | `boolean`        | `true`           | Auto-start when ready           |
| `preloadState?`  | `PreloadState`   | -                | Wait for assets before starting |

**Available Presets** (`EntrancePreset`):

| Preset          | Description                                      |
| --------------- | ------------------------------------------------ |
| `'dolly-in'`    | Camera moves forward along Z-axis toward scene   |
| `'orbit-drift'` | Camera drifts from offset position (right/above) |
| `'crane-up'`    | Camera rises from below, like a crane shot       |
| `'fade-drift'`  | Gentle horizontal drift from the left            |

**Example - Custom positions**:

```html
<a3d-orbit-controls
  a3dCinematicEntrance
  [entranceConfig]="{
    startPosition: [10, 5, 15],
    endPosition: [0, 2, 8],
    startLookAt: [0, -2, 0],
    endLookAt: [0, 0, 0],
    duration: 3,
    easing: 'power3.out'
  }"
/>
```

---

### SceneRevealDirective

Adds reveal animations to 3D objects with stagger group coordination.

**Selector**: `[a3dSceneReveal]`

**Inputs**:

| Input          | Type                | Description             |
| -------------- | ------------------- | ----------------------- |
| `revealConfig` | `SceneRevealConfig` | Animation configuration |

**Outputs**:

| Output           | Type   | Description                   |
| ---------------- | ------ | ----------------------------- |
| `revealStart`    | `void` | Emitted when reveal starts    |
| `revealComplete` | `void` | Emitted when reveal completes |

**SceneRevealConfig**:

| Property        | Type              | Default        | Description                           |
| --------------- | ----------------- | -------------- | ------------------------------------- |
| `animation?`    | `RevealAnimation` | `'fade-in'`    | Animation type                        |
| `duration?`     | `number`          | `0.8`          | Duration in seconds                   |
| `delay?`        | `number`          | `0`            | Delay before animation                |
| `easing?`       | `string`          | `'power2.out'` | GSAP easing (scale-pop uses back.out) |
| `staggerGroup?` | `string`          | -              | Group name for stagger coordination   |
| `staggerIndex?` | `number`          | `0`            | Index within stagger group            |
| `autoReveal?`   | `boolean`         | `false`        | Auto-reveal on init                   |

**Available Animations** (`RevealAnimation`):

| Animation     | Description                                  |
| ------------- | -------------------------------------------- |
| `'fade-in'`   | Material opacity animates from 0 to original |
| `'scale-pop'` | Scale from near-zero with overshoot effect   |
| `'rise-up'`   | Position animates upward from below          |

**Example - Mixed animations**:

```html
<a3d-box a3dSceneReveal [revealConfig]="{ animation: 'fade-in', staggerGroup: 'items', staggerIndex: 0 }" />

<a3d-sphere a3dSceneReveal [revealConfig]="{ animation: 'scale-pop', staggerGroup: 'items', staggerIndex: 1 }" />

<a3d-torus a3dSceneReveal [revealConfig]="{ animation: 'rise-up', staggerGroup: 'items', staggerIndex: 2 }" />
```

---

### StaggerGroupService

Coordinates reveal animations across multiple SceneRevealDirective instances.

**Methods**:

| Method                      | Description                                  |
| --------------------------- | -------------------------------------------- |
| `revealGroup(name, delay?)` | Reveal all items in group with stagger delay |
| `hideGroup(name)`           | Hide all items in group simultaneously       |
| `hasGroup(name)`            | Check if group exists and has items          |
| `getGroupSize(name)`        | Get number of items in group                 |
| `getGroupNames()`           | Get array of all group names                 |
| `clearGroup(name)`          | Clear all items from a group                 |
| `clearAllGroups()`          | Clear all groups                             |

**Example - Programmatic control**:

```typescript
private stagger = inject(StaggerGroupService);

// Reveal with 150ms stagger delay (default)
await this.stagger.revealGroup('hero-items');

// Reveal with custom 200ms stagger
await this.stagger.revealGroup('hero-items', 200);

// Reveal all at once (no stagger)
await this.stagger.revealGroup('hero-items', 0);

// Hide all items for re-reveal
await this.stagger.hideGroup('hero-items');
```

---

### LoadingOverlayComponent

Pre-styled loading overlay that displays during scene initialization and asset loading.

**Selector**: `<a3d-loading-overlay>`

**Inputs**:

| Input      | Type                   | Description                            |
| ---------- | ---------------------- | -------------------------------------- |
| `progress` | `Signal<number>`       | Loading progress signal (0-100)        |
| `isReady`  | `Signal<boolean>`      | Ready state signal (triggers fade-out) |
| `config?`  | `LoadingOverlayConfig` | Optional visual customization          |

**LoadingOverlayConfig**:

| Property          | Type      | Default     | Description                  |
| ----------------- | --------- | ----------- | ---------------------------- |
| `fadeOutDuration` | `number`  | `800`       | Fade-out duration in ms      |
| `fadeOutDelay`    | `number`  | `200`       | Delay before fade-out starts |
| `showProgress`    | `boolean` | `true`      | Show progress percentage     |
| `showSpinner`     | `boolean` | `true`      | Show animated spinner        |
| `spinnerColor`    | `string`  | `'#ff6600'` | Spinner accent color         |
| `backgroundColor` | `string`  | `'#0a0a0f'` | Overlay background color     |
| `zIndex`          | `number`  | `9999`      | CSS z-index                  |

**Example - Basic usage with preload state**:

```html
<a3d-scene-3d [cameraPosition]="[0, 2, 8]">
  <!-- 3D content -->
</a3d-scene-3d>

<a3d-loading-overlay [progress]="preloadState.progress" [isReady]="preloadState.isReady" />
```

**Example - Custom styling**:

```html
<a3d-loading-overlay
  [progress]="preloadState.progress"
  [isReady]="preloadState.isReady"
  [config]="{
    spinnerColor: '#00ff88',
    backgroundColor: '#1a1a2e',
    fadeOutDuration: 500
  }"
/>
```

**Features**:

- Animated spinner with pulsing glow effect
- Smooth progress text updates
- Respects `prefers-reduced-motion` media query
- Automatic fade-out when `isReady` becomes true
- Removes itself from DOM after fade-out completes

---

### ScrollZoomCoordinatorDirective

Coordinates camera zoom with page scroll.

**Selector**: `[a3dScrollZoomCoordinator]`

**Inputs**:

- `zoomRange?: [number, number]` - Min/max zoom distance
- `scrollSensitivity?: number` - Scroll response sensitivity

---

### Performance3dDirective

Automatic LOD (Level of Detail) and performance optimization.

**Selector**: `[a3dPerformance3d]`

**Inputs**:

- `targetFps?: number` - Target frame rate (default: 60)
- `enableLod?: boolean` - Enable LOD switching

---

## 📋 Directives Reference

### Core Directives

| Directive          | Selector         | Description                     |
| ------------------ | ---------------- | ------------------------------- |
| MeshDirective      | `[a3dMesh]`      | Creates a Three.js Mesh         |
| GroupDirective     | `[a3dGroup]`     | Creates a Three.js Group        |
| TransformDirective | `[a3dTransform]` | Applies position/rotation/scale |

### Geometry Directives

| Directive                   | Selector                  | Description                |
| --------------------------- | ------------------------- | -------------------------- |
| BoxGeometryDirective        | `[a3dBoxGeometry]`        | Creates BoxGeometry        |
| SphereGeometryDirective     | `[a3dSphereGeometry]`     | Creates SphereGeometry     |
| CylinderGeometryDirective   | `[a3dCylinderGeometry]`   | Creates CylinderGeometry   |
| TorusGeometryDirective      | `[a3dTorusGeometry]`      | Creates TorusGeometry      |
| PolyhedronGeometryDirective | `[a3dPolyhedronGeometry]` | Creates PolyhedronGeometry |

### Material Directives

| Directive                 | Selector                | Description                       |
| ------------------------- | ----------------------- | --------------------------------- |
| StandardMaterialDirective | `[a3dStandardMaterial]` | Creates MeshStandardMaterial      |
| PhysicalMaterialDirective | `[a3dPhysicalMaterial]` | Creates MeshPhysicalMaterial      |
| NodeMaterialDirective     | `[a3dNodeMaterial]`     | Creates TSL NodeMaterial (WebGPU) |

### Light Directives

| Directive                 | Selector                | Description            |
| ------------------------- | ----------------------- | ---------------------- |
| LightDirective            | `[a3dLight]`            | Base light directive   |
| AmbientLightDirective     | `[a3dAmbientLight]`     | Adds ambient light     |
| PointLightDirective       | `[a3dPointLight]`       | Adds point light       |
| DirectionalLightDirective | `[a3dDirectionalLight]` | Adds directional light |
| SpotLightDirective        | `[a3dSpotLight]`        | Adds spot light        |

### Effect Directives

| Directive       | Selector      | Description              |
| --------------- | ------------- | ------------------------ |
| Glow3dDirective | `[a3dGlow3d]` | Adds glow effect to mesh |

### Positioning Directives

| Directive                 | Selector             | Description                              |
| ------------------------- | -------------------- | ---------------------------------------- |
| ViewportPositionDirective | `[viewportPosition]` | Positions 3D object relative to viewport |

---

## 🔧 Services Reference

| Service                             | Description                             |
| ----------------------------------- | --------------------------------------- |
| SceneService                        | Access to scene, camera, renderer       |
| RenderLoopService                   | Frame loop management and callbacks     |
| AnimationService                    | Flight waypoints, pulse animations      |
| GltfLoaderService                   | GLTF/GLB model loading with caching     |
| TextureLoaderService                | Texture loading with caching            |
| AssetPreloaderService               | Multi-asset loading with progress       |
| StaggerGroupService                 | Coordinated reveal animations           |
| EffectComposerService               | Postprocessing effect chain management  |
| ViewportPositioningService          | Viewport-relative positioning utilities |
| ComponentRegistryService            | Component registration and lookup       |
| Angular3dStateStore                 | Signal-based application state          |
| SceneGraphStore                     | Scene graph node registry               |
| AdvancedPerformanceOptimizerService | Performance monitoring and optimization |
| RenderCallbackRegistryService       | Render callback management              |
| VisibilityObserverService           | Intersection observer utilities         |
| FontPreloadService                  | Font preloading for text components     |

### Injectable Functions

| Function              | Description                          |
| --------------------- | ------------------------------------ |
| injectGltfLoader()    | Modern DI pattern for GLTF loader    |
| injectTextureLoader() | Modern DI pattern for texture loader |

---

## ⚙️ Configuration

### Material Options

All mesh components support standard material properties:

```html
<a3d-sphere [color]="'#ff6b6b'" [metalness]="0.8" [roughness]="0.2" [opacity]="0.9" [transparent]="true" [emissive]="'#ff0000'" [emissiveIntensity]="0.5" />
```

### Custom Materials with TSL

Use `NodeMaterialDirective` for advanced node-based materials:

```typescript
import { tslFresnel, tslIridescence } from '@hive-academy/angular-3d';
```

---

## 🌐 SSR Compatibility

The library automatically handles server-side rendering:

- Three.js initializes only in browser environment
- No hydration mismatches
- Safe component lifecycle management

```typescript
// ✅ Safe - library handles SSR internally
<a3d-scene-3d>
  <a3d-box />
</a3d-scene-3d>

// ✅ No additional guards needed
constructor() {
  // Library uses isPlatformBrowser() internally
}
```

---

## 🎬 Live Demo

> 🚀 Coming soon - Live demo application showcasing all components

---

## 📖 Resources

- [Three.js Documentation](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Angular Documentation](https://angular.dev)
- [WebGL Fundamentals](https://webglfundamentals.org/)

---

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](../../CONTRIBUTING.md) and follow the conventional commit format for all commits.

See [CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) for community guidelines.

---

## 📄 License

MIT © Hive Academy

See [LICENSE](../../LICENSE) for details.

---

## 🔗 Related Packages

- [`@hive-academy/angular-gsap`](../angular-gsap) - GSAP scroll animations for Angular (for DOM scroll effects)
