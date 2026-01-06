# Implementation Plan - TASK_2026_005

## Open Source Release Readiness for Angular 3D Libraries

**Task ID**: TASK_2026_005
**Created**: 2026-01-06
**Status**: Ready for Team-Leader Decomposition

---

## Codebase Investigation Summary

### Current State Assessment

| Asset                              | Status         | Lines/Size | Gap Analysis                                                                     |
| ---------------------------------- | -------------- | ---------- | -------------------------------------------------------------------------------- |
| `libs/angular-3d/README.md`        | INCOMPLETE     | 145 lines  | Missing: Features section, component tables, badges, SSR docs, Quick Start scene |
| `libs/angular-gsap/README.md`      | GOOD           | 449 lines  | Missing: Badge row, Live Demo placeholder                                        |
| `libs/angular-3d/package.json`     | MINIMAL        | 15 lines   | Missing: description, keywords, homepage, bugs, repository, author, license      |
| `libs/angular-gsap/package.json`   | MINIMAL        | 11 lines   | Missing: description, keywords, homepage, bugs, repository, author, license      |
| `LICENSE`                          | MISSING        | N/A        | Must create MIT license                                                          |
| `CODE_OF_CONDUCT.md`               | MISSING        | N/A        | Must create Contributor Covenant v2.1                                            |
| `.github/ISSUE_TEMPLATE/`          | MISSING        | N/A        | Must create bug_report.md, feature_request.md                                    |
| `.github/PULL_REQUEST_TEMPLATE.md` | MISSING        | N/A        | Must create PR template                                                          |
| `README.md` (root)                 | NX BOILERPLATE | 159 lines  | Transform to library-focused presentation                                        |
| `CONTRIBUTING.md`                  | GOOD           | 196 lines  | No changes needed                                                                |

### Libraries Discovered (UPDATED 2026-01-06 - Full Audit)

**@hive-academy/angular-3d** (libs/angular-3d):

- **44 Components** total:
  - Canvas: Scene3dComponent
  - Controls: OrbitControlsComponent
  - Geometry Primitives (6): Box, Sphere, Cylinder, Torus, Polyhedron, FloatingSphere
  - Lights (5): AmbientLight, DirectionalLight, PointLight, SpotLight, SceneLighting
  - Text (7): TroikaText, ResponsiveTroikaText, GlowTroikaText, SmokeTroikaText, ParticlesText, BubbleText, ExtrudedText3d
  - Space (5): Planet, StarField, Nebula, NebulaVolumetric, CloudLayer
  - Particles (5): ParticleSystem, MarbleParticleSystem, GpuParticleSphere, SparkleCorona, ParticleCloud
  - Effects (7): MetaballScene, MetaballSphere, MetaballCursor, MarbleSphere, FireSphere, BackgroundCubes, Metaball (deprecated)
  - Scene Organization (5): Group, Fog, Environment, BackgroundCube, InstancedMesh
  - Loaders (2): GltfModel, SvgIcon
  - Postprocessing (8): EffectComposer, Bloom, SelectiveBloom, DOF, SSAO, ColorGrading, ChromaticAberration, FilmGrain
  - Backgrounds (1): HexagonalBackgroundInstanced
- **19 Directives**:
  - Animation (3): Float3d, Rotate3d, SpaceFlight3d
  - Core (3): Mesh, Group, Transform
  - Geometry (5): BoxGeometry, CylinderGeometry, SphereGeometry, TorusGeometry, PolyhedronGeometry
  - Material (3): StandardMaterial, PhysicalMaterial, NodeMaterial
  - Light (4): AmbientLight, DirectionalLight, PointLight, SpotLight
  - Interaction (3): MouseTracking3d, ScrollZoomCoordinator, Performance3d
  - Effect (1): Glow3d
  - Positioning (1): ViewportPosition
- **14 Services**: SceneService, RenderLoopService, AnimationService, GltfLoaderService, TextureLoaderService, EffectComposerService, ViewportPositioningService, AdvancedPerformanceOptimizerService, FontPreloadService, Angular3dStateStore, ComponentRegistryService, SceneGraphStore, MouseTrackerService
- **30+ TSL Shader Utilities**: Procedural textures, noise functions, ray marching, lighting effects

**@hive-academy/angular-gsap** (libs/angular-gsap):

- **7 Components**: HijackedScrollTimeline, ScrollTimeline, StepIndicator, ParallaxSplitScroll, SplitPanelSection, FeatureShowcaseTimeline, FeatureStep
- **11 Directives** + 11 content projection directives:
  - Scroll (4): ScrollAnimation, HijackedScroll, HijackedScrollItem, ScrollSectionPin
  - Other (4): ViewportAnimation, SectionSticky, ParallaxSplitItem, LenisSmoothScroll
  - Content Projection (11): SplitPanelImage, SplitPanelBadge, SplitPanelTitle, etc.
- **2 Services**: GsapCoreService, LenisSmoothScrollService
- **2 Provider Functions**: provideGsap(), provideLenis()
- **12+ Animation Types**: fadeIn, fadeOut, slideUp, slideDown, slideLeft, slideRight, scaleIn, scaleOut, parallax, rotateIn, flipIn, bounceIn

**Full API inventory**: See `task-tracking/TASK_2026_005/api-inventory.md`

### GitHub Repository Pattern

Based on research and package.json analysis:

- **Repository URL**: `https://github.com/hive-academy/angular-3d-workspace`
- **npm Scoped Packages**: `@hive-academy/angular-3d`, `@hive-academy/angular-gsap`
- **License**: MIT (stated in package.json but LICENSE file missing)

---

## Batch Organization

### Batch 1: Foundation Documents (Quick Wins)

**Estimated Time**: 1.5 hours
**Dependencies**: None
**Files to Create**:

- `D:\projects\angular-3d-workspace\LICENSE` (CREATE)
- `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md` (CREATE)
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md` (CREATE)
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md` (CREATE)
- `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md` (CREATE)

**Rationale**: These are boilerplate files that can be created quickly with standard content. Completing them first removes critical blockers and builds momentum.

---

### Batch 2: Package.json Metadata (Both Libraries)

**Estimated Time**: 30 minutes
**Dependencies**: None (can run parallel with Batch 1)
**Files to Modify**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\package.json` (MODIFY)
- `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json` (MODIFY)

**Rationale**: Simple JSON edits. Must preserve existing peerDependencies and sideEffects fields.

---

### Batch 3: angular-3d README Expansion (Major Work)

**Estimated Time**: 3-4 hours
**Dependencies**: Batch 1 complete (LICENSE file must exist for badge link)
**Files to Modify**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\README.md` (REWRITE)

**Rationale**: This is the largest deliverable requiring careful structuring to match angular-gsap quality.

---

### Batch 4: Final Polish (angular-gsap + Root README)

**Estimated Time**: 1.5 hours
**Dependencies**: Batch 3 complete (for consistency verification)
**Files to Modify**:

- `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md` (MODIFY)
- `D:\projects\angular-3d-workspace\README.md` (REWRITE)

**Rationale**: Final pass ensures both library READMEs are consistent, and root README showcases both libraries professionally.

---

## Batch 1: Foundation Documents

### Task 1.1: LICENSE File

**File**: `D:\projects\angular-3d-workspace\LICENSE`
**Action**: CREATE
**Evidence**: Standard MIT license format from opensource.org

**Content Specification**:

```
MIT License

Copyright (c) 2026 Hive Academy

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

**Verification**:

- [ ] File exists at repository root
- [ ] UTF-8 encoding without BOM
- [ ] No trailing whitespace
- [ ] Ends with single newline
- [ ] Year is 2026
- [ ] Copyright holder is "Hive Academy"

---

### Task 1.2: CODE_OF_CONDUCT.md

**File**: `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md`
**Action**: CREATE
**Evidence**: Contributor Covenant v2.1 from https://www.contributor-covenant.org/version/2/1/code_of_conduct/

**Content Structure**:

```markdown
# Contributor Covenant Code of Conduct

## Our Pledge

[Standard Contributor Covenant pledge text]

## Our Standards

[Standard Contributor Covenant standards text]

## Enforcement Responsibilities

[Standard text]

## Scope

[Standard text]

## Enforcement

[Standard text]

## Enforcement Guidelines

### 1. Correction

### 2. Warning

### 3. Temporary Ban

### 4. Permanent Ban

## Attribution

This Code of Conduct is adapted from the [Contributor Covenant][homepage],
version 2.1, available at
[https://www.contributor-covenant.org/version/2/1/code_of_conduct.html][v2.1].

[homepage]: https://www.contributor-covenant.org
[v2.1]: https://www.contributor-covenant.org/version/2/1/code_of_conduct.html

For answers to common questions about this code of conduct, see the FAQ at
https://www.contributor-covenant.org/faq.
```

**Contact Method**: Link to GitHub Issues

```markdown
Instances of abusive, harassing, or otherwise unacceptable behavior may be
reported to the community leaders responsible for enforcement at
[GitHub Issues](https://github.com/hive-academy/angular-3d-workspace/issues).
```

**Verification**:

- [ ] Uses Contributor Covenant v2.1 exactly
- [ ] Contact method is GitHub Issues link
- [ ] Attribution section present
- [ ] All sections complete

---

### Task 1.3: Bug Report Template

**File**: `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md`
**Action**: CREATE (directory may need creation)

**Content Specification**:

````markdown
---
name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Description

A clear and concise description of the bug.

## Steps to Reproduce

1. Go to '...'
2. Use component '...'
3. Configure with '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- **Angular Version**:
- **Library Version**:
- **Library**: @hive-academy/angular-3d / @hive-academy/angular-gsap
- **Browser**:
- **OS**:

## Reproduction

<!-- Please provide one of the following: -->

- [ ] StackBlitz reproduction: [link]
- [ ] Minimal code sample below

```typescript
// Minimal reproduction code
```
````

## Error Messages

```
// Any console errors or stack traces
```

## Additional Context

Any other context, screenshots, or information.

````

**Verification**:
- [ ] YAML frontmatter valid
- [ ] Labels reference existing label ("bug")
- [ ] All required sections present
- [ ] Library selection dropdown included

---

### Task 1.4: Feature Request Template

**File**: `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md`
**Action**: CREATE

**Content Specification**:
```markdown
---
name: Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Problem Statement

Describe the problem or limitation you're facing.

**Is your feature request related to a problem?**
<!-- A clear description of what the problem is. Ex. I'm always frustrated when [...] -->

## Proposed Solution

Describe your ideal solution.

**What would be the ideal API/usage?**

```typescript
// Example usage of proposed feature
````

## Alternatives Considered

What other solutions have you considered?

## Use Case

Who would benefit from this feature and how?

## Library

Which library is this feature for?

- [ ] @hive-academy/angular-3d
- [ ] @hive-academy/angular-gsap
- [ ] Both

## Additional Context

Any mockups, code samples, links to similar features in other libraries, or references.

````

**Verification**:
- [ ] YAML frontmatter valid
- [ ] Labels reference existing label ("enhancement")
- [ ] Library selection checkboxes present
- [ ] Code example section included

---

### Task 1.5: Pull Request Template

**File**: `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`
**Action**: CREATE

**Content Specification**:
```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] Test update

## Related Issue

Fixes #(issue number)

## Library Affected

- [ ] @hive-academy/angular-3d
- [ ] @hive-academy/angular-gsap
- [ ] Demo app
- [ ] Documentation only

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have run `npx nx run-many -t lint test typecheck build` locally
- [ ] I have added tests covering my changes
- [ ] All new and existing tests pass
- [ ] I have updated relevant documentation
- [ ] My commits follow [conventional commit format](./CONTRIBUTING.md)

## Screenshots (if applicable)

<!-- Add screenshots for UI changes -->

## Breaking Changes (if applicable)

<!-- Describe what breaks and how users should migrate -->
````

**Verification**:

- [ ] Checklist references actual validation command
- [ ] Conventional commit link works
- [ ] All change types covered
- [ ] Breaking changes section included

---

## Batch 2: Package.json Metadata

### Task 2.1: angular-3d package.json

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\package.json`
**Action**: MODIFY (preserve existing fields)

**Current Content** (must preserve):

```json
{
  "name": "@hive-academy/angular-3d",
  "version": "0.0.1",
  "peerDependencies": {
    "@angular/core": "~20.3.0",
    "three": "^0.182.0",
    "three-stdlib": "^2.35.0",
    "gsap": "^3.14.2",
    "rxjs": "~7.8.0",
    "@angular/common": "~20.3.0",
    "maath": "^0.10.8",
    "troika-three-text": "^0.52.4"
  },
  "sideEffects": false
}
```

**New Content** (complete replacement):

```json
{
  "name": "@hive-academy/angular-3d",
  "version": "0.0.1",
  "description": "Declarative Three.js components for Angular - Build stunning 3D experiences with familiar Angular patterns",
  "keywords": ["angular", "three.js", "threejs", "3d", "webgl", "webgpu", "angular-library", "declarative", "components", "graphics", "visualization", "3d-graphics", "angular-threejs", "scene", "renderer"],
  "homepage": "https://github.com/hive-academy/angular-3d-workspace#readme",
  "bugs": {
    "url": "https://github.com/hive-academy/angular-3d-workspace/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hive-academy/angular-3d-workspace.git",
    "directory": "libs/angular-3d"
  },
  "license": "MIT",
  "author": "Hive Academy",
  "peerDependencies": {
    "@angular/core": "~20.3.0",
    "@angular/common": "~20.3.0",
    "three": "^0.182.0",
    "three-stdlib": "^2.35.0",
    "gsap": "^3.14.2",
    "rxjs": "~7.8.0",
    "maath": "^0.10.8",
    "troika-three-text": "^0.52.4"
  },
  "sideEffects": false
}
```

**Verification**:

- [ ] All peerDependencies preserved exactly
- [ ] sideEffects: false preserved
- [ ] Description under 250 characters
- [ ] Exactly 15 keywords (npm best practice)
- [ ] Keywords are lowercase
- [ ] Repository URL valid
- [ ] Directory field correct

---

### Task 2.2: angular-gsap package.json

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json`
**Action**: MODIFY (preserve existing fields)

**Current Content** (must preserve):

```json
{
  "name": "@hive-academy/angular-gsap",
  "version": "0.0.1",
  "peerDependencies": {
    "@angular/common": "^20.3.0",
    "@angular/core": "^20.3.0",
    "gsap": "^3.12.0",
    "lenis": "^1.3.16"
  },
  "sideEffects": false
}
```

**New Content** (complete replacement):

```json
{
  "name": "@hive-academy/angular-gsap",
  "version": "0.0.1",
  "description": "GSAP-powered scroll animations for Angular - Declarative scroll-triggered animations with ScrollTrigger integration",
  "keywords": ["angular", "gsap", "scrolltrigger", "scroll-animation", "animation", "angular-library", "scroll", "parallax", "viewport", "intersection-observer", "angular-gsap", "greensock", "scroll-effects", "hijacked-scroll", "lenis"],
  "homepage": "https://github.com/hive-academy/angular-3d-workspace#readme",
  "bugs": {
    "url": "https://github.com/hive-academy/angular-3d-workspace/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hive-academy/angular-3d-workspace.git",
    "directory": "libs/angular-gsap"
  },
  "license": "MIT",
  "author": "Hive Academy",
  "peerDependencies": {
    "@angular/common": "^20.3.0",
    "@angular/core": "^20.3.0",
    "gsap": "^3.12.0",
    "lenis": "^1.3.16"
  },
  "sideEffects": false
}
```

**Verification**:

- [ ] All peerDependencies preserved exactly
- [ ] sideEffects: false preserved
- [ ] Description under 250 characters
- [ ] Exactly 15 keywords
- [ ] Keywords are lowercase and unique
- [ ] Repository directory field is "libs/angular-gsap"

---

## Batch 3: angular-3d README Expansion

### Task 3.1: Complete README Rewrite

**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
**Action**: REWRITE
**Target Length**: 600-800 lines (comprehensive coverage of 44 components, 19 directives, 14 services)
**Reference**: See `task-tracking/TASK_2026_005/api-inventory.md` for complete component list

**Required Structure** (exact section order for consistency with angular-gsap):

```markdown
# @hive-academy/angular-3d

[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

> [Emoji] **Declarative Three.js components for Angular applications**

[One-liner description]

## [Emoji] Features

[Bullet list matching angular-gsap format]

> **Scope**: This library provides **3D graphics components**. For scroll animations, see [`@hive-academy/angular-gsap`](../angular-gsap).

---

## [Emoji] Installation

[Install command + peer dependencies table]

---

## [Emoji] Quick Start

### Example 1: Basic Scene with Box

[Complete working example]

### Example 2: Scene with Lighting

[Example with lights]

### Example 3: Animated Scene

[Example with directives]

---

## [Emoji] API Reference

### Scene Container

[Scene3dComponent documentation]

### Primitives

| Component | Selector | Description |
| --------- | -------- | ----------- |

[Complete table of 14 primitives]

### Lights

| Component | Selector | Description |
| --------- | -------- | ----------- |

[Complete table of 5 lights]

### Animation Directives

[Float3dDirective]
[Rotate3dDirective]

### Controls

[OrbitControlsComponent]

### Postprocessing

[EffectComposer, BloomEffect]

---

## [Emoji] Configuration

### Scene Configuration

[Camera, renderer options]

### Material Options

[Common material patterns]

---

## [Emoji] SSR Compatibility

[SSR handling explanation]

---

## [Emoji] Live Demo

[Placeholder link]

---

## [Emoji] Resources

[Three.js, Angular links]

---

## [Emoji] Contributing

[Link to CONTRIBUTING.md]

---

## [Emoji] License

MIT (c) Hive Academy

---

## [Emoji] Related Packages

[Link to angular-gsap]
```

### Section-by-Section Content Specifications

#### Header Section

```markdown
# @hive-academy/angular-3d

[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)

> :art: **Declarative Three.js components for Angular applications**

A modern Angular library providing declarative, type-safe wrappers for Three.js. Build stunning 3D graphics experiences with familiar Angular patterns using signals, standalone components, and dependency injection.
```

#### Features Section

```markdown
## :sparkles: Features

- :dart: **Declarative API** - Configure 3D scenes via Angular inputs and signals
- :movie_camera: **Scene Container** - Automatic WebGLRenderer, Scene, and Camera setup
- :package: **14+ Primitives** - Box, Cylinder, Torus, Planet, StarField, Nebula, Text3D, and more
- :bulb: **5 Light Types** - Ambient, Directional, Point, Spot, and preset SceneLighting
- :ocean: **Animation Directives** - Float3d and Rotate3d for smooth object animations
- :video_game: **Orbit Controls** - Interactive camera controls out of the box
- :inbox_tray: **Asset Loaders** - GLTF/GLB models and texture loading
- :rainbow: **Postprocessing** - Bloom effects with EffectComposer
- :globe_with_meridians: **SSR Compatible** - Safely handles server-side rendering
- :evergreen_tree: **Tree-Shakeable** - Import only what you need
- :mortar_board: **TypeScript First** - Full type safety and IntelliSense support

> **Scope**: This library provides **3D graphics components**. For scroll animations, see [`@hive-academy/angular-gsap`](../angular-gsap).
```

#### Installation Section

```markdown
## :package: Installation

\`\`\`bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
\`\`\`

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
```

#### Quick Start Section

**Example 1**: Basic Scene with Box

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, BoxComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-basic-scene',
  standalone: true,
  imports: [Scene3dComponent, BoxComponent],
  template: `
    <a3d-scene [cameraPosition]="[0, 0, 5]">
      <a3d-box [position]="[0, 0, 0]" [color]="'#ff6b6b'" />
    </a3d-scene>
  `,
  styles: [
    `
      a3d-scene {
        display: block;
        width: 100%;
        height: 400px;
      }
    `,
  ],
})
export class BasicSceneComponent {}
```

**Example 2**: Scene with Lighting

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, BoxComponent, AmbientLightComponent, DirectionalLightComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-lit-scene',
  standalone: true,
  imports: [Scene3dComponent, BoxComponent, AmbientLightComponent, DirectionalLightComponent],
  template: `
    <a3d-scene [cameraPosition]="[3, 3, 5]">
      <a3d-ambient-light [intensity]="0.4" />
      <a3d-directional-light [position]="[5, 10, 5]" [intensity]="1" />
      <a3d-box [position]="[0, 0, 0]" [color]="'#4ecdc4'" />
    </a3d-scene>
  `,
})
export class LitSceneComponent {}
```

**Example 3**: Animated Scene

```typescript
import { Component } from '@angular/core';
import { Scene3dComponent, TorusComponent, Float3dDirective, Rotate3dDirective, SceneLightingComponent } from '@hive-academy/angular-3d';

@Component({
  selector: 'app-animated-scene',
  standalone: true,
  imports: [Scene3dComponent, TorusComponent, Float3dDirective, Rotate3dDirective, SceneLightingComponent],
  template: `
    <a3d-scene [cameraPosition]="[0, 0, 8]">
      <a3d-scene-lighting />
      <a3d-torus float3d rotate3d [floatConfig]="{ height: 0.3, speed: 2000 }" [rotateConfig]="{ axis: 'y', speed: 30 }" [color]="'#9b59b6'" />
    </a3d-scene>
  `,
})
export class AnimatedSceneComponent {}
```

#### API Reference - Primitives Table

| Component                 | Selector                | Description                                      |
| ------------------------- | ----------------------- | ------------------------------------------------ |
| `Scene3dComponent`        | `<a3d-scene>`           | Root container with WebGLRenderer, Scene, Camera |
| `BoxComponent`            | `<a3d-box>`             | Box/cube primitive mesh                          |
| `CylinderComponent`       | `<a3d-cylinder>`        | Cylinder primitive mesh                          |
| `TorusComponent`          | `<a3d-torus>`           | Torus (donut) primitive mesh                     |
| `PolyhedronComponent`     | `<a3d-polyhedron>`      | Platonic solids (tetrahedron, octahedron, etc.)  |
| `PlanetComponent`         | `<a3d-planet>`          | Planet with optional atmosphere effect           |
| `StarFieldComponent`      | `<a3d-star-field>`      | Particle-based star background                   |
| `NebulaComponent`         | `<a3d-nebula>`          | Volumetric nebula/cloud effect                   |
| `Text3dComponent`         | `<a3d-text-3d>`         | 3D text using Troika                             |
| `GltfModelComponent`      | `<a3d-gltf-model>`      | GLTF/GLB model loader                            |
| `ParticleSystemComponent` | `<a3d-particle-system>` | Configurable particle effects                    |
| `GroupComponent`          | `<a3d-group>`           | Object3D container for grouping                  |
| `FogComponent`            | `<a3d-fog>`             | Scene fog effect                                 |
| `SvgIconComponent`        | `<a3d-svg-icon>`        | SVG extruded as 3D object                        |

#### API Reference - Lights Table

| Component                   | Selector                  | Description                                 |
| --------------------------- | ------------------------- | ------------------------------------------- |
| `AmbientLightComponent`     | `<a3d-ambient-light>`     | Uniform ambient illumination                |
| `DirectionalLightComponent` | `<a3d-directional-light>` | Sun-like directional light with shadows     |
| `PointLightComponent`       | `<a3d-point-light>`       | Omnidirectional point light source          |
| `SpotLightComponent`        | `<a3d-spot-light>`        | Focused cone spotlight                      |
| `SceneLightingComponent`    | `<a3d-scene-lighting>`    | Preset lighting rig (ambient + directional) |

#### SSR Section

```markdown
## :globe_with_meridians: SSR Compatibility

The library automatically handles server-side rendering:

- Three.js initialization occurs only in browser environment
- Uses `afterNextRender()` for browser-only code
- No hydration mismatches

\`\`\`typescript
// Safe - library handles SSR internally
<a3d-scene>
<a3d-box [color]="'red'" />
</a3d-scene>

// No additional guards needed in your components
\`\`\`
```

**Verification Checklist**:

- [ ] Total lines: 350-500
- [ ] All 14 primitives documented in table
- [ ] All 5 lights documented in table
- [ ] Both animation directives documented
- [ ] OrbitControls documented
- [ ] Postprocessing documented
- [ ] 3 Quick Start examples (copy-paste ready)
- [ ] Badge URLs correct format
- [ ] Emoji usage matches angular-gsap pattern
- [ ] Section order matches angular-gsap
- [ ] All code examples use standalone: true
- [ ] No broken markdown (tables render correctly)

---

## Batch 4: Final Polish

### Task 4.1: angular-gsap README Update

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
**Action**: MODIFY (add badges, Live Demo section, AND document new components/directives)

**IMPORTANT**: The existing README is missing documentation for:

- 6 NEW Components: ScrollTimeline, StepIndicator, ParallaxSplitScroll, SplitPanelSection, FeatureShowcaseTimeline, FeatureStep
- 4 NEW Directives: ScrollSectionPin, SectionSticky, ParallaxSplitItem, LenisSmoothScroll
- 2 Services: GsapCoreService, LenisSmoothScrollService
- 2 Provider Functions: provideGsap(), provideLenis()
- 11 Content Projection Directives

**Reference**: See `task-tracking/TASK_2026_005/api-inventory.md` for complete list

**Changes Required**:

1. **Add badge row after title** (insert after line 1):

```markdown
[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-gsap.svg)](https://www.npmjs.com/package/@hive-academy/angular-gsap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../../LICENSE)
```

2. **Add Live Demo section** (insert before Resources section, around line 426):

```markdown
---

## :rocket: Live Demo

[View Demo](https://hive-academy.github.io/angular-3d-workspace) | [StackBlitz (coming soon)](https://stackblitz.com)
```

3. **Update Related Packages link** (currently relative, keep as-is since it works):

```markdown
- [`@hive-academy/angular-3d`](../angular-3d) - Three.js integration for Angular (for 3D object animations)
```

**Verification**:

- [ ] Badges render correctly
- [ ] Badge URLs use same format as angular-3d
- [ ] LICENSE link path correct (../../LICENSE)
- [ ] Live Demo placeholder present
- [ ] No content removed (only additions)

---

### Task 4.2: Root README Transformation

**File**: `D:\projects\angular-3d-workspace\README.md`
**Action**: REWRITE
**Target Length**: 150-200 lines

**New Structure**:

```markdown
# Angular 3D Workspace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Angular libraries for 3D graphics and scroll animations

This monorepo contains two production-ready Angular libraries:

## :package: Libraries

| Library                                           | Description                                 | npm                                                                                                                             |
| ------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [@hive-academy/angular-3d](./libs/angular-3d)     | Declarative Three.js components for Angular | [![npm](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)     |
| [@hive-academy/angular-gsap](./libs/angular-gsap) | GSAP-powered scroll animations for Angular  | [![npm](https://img.shields.io/npm/v/@hive-academy/angular-gsap.svg)](https://www.npmjs.com/package/@hive-academy/angular-gsap) |

---

## :zap: Quick Install

### 3D Graphics (Three.js)

\`\`\`bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
\`\`\`

\`\`\`typescript
import { Scene3dComponent, BoxComponent } from '@hive-academy/angular-3d';

@Component({
imports: [Scene3dComponent, BoxComponent],
template: \`
<a3d-scene [cameraPosition]="[0, 0, 5]">
<a3d-box [color]="'#ff6b6b'" />
</a3d-scene>
\`
})
export class MyComponent {}
\`\`\`

### Scroll Animations (GSAP)

\`\`\`bash
npm install @hive-academy/angular-gsap gsap lenis
\`\`\`

\`\`\`typescript
import { ScrollAnimationDirective } from '@hive-academy/angular-gsap';

@Component({
imports: [ScrollAnimationDirective],
template: \`<h1 scrollAnimation>Animates on scroll!</h1>\`
})
export class MyComponent {}
\`\`\`

---

## :rocket: Live Demo

[View Demo](https://hive-academy.github.io/angular-3d-workspace) | Coming soon

---

## :book: Documentation

- [@hive-academy/angular-3d README](./libs/angular-3d/README.md) - Full API reference, examples
- [@hive-academy/angular-gsap README](./libs/angular-gsap/README.md) - Full API reference, examples
- [Contributing Guide](./CONTRIBUTING.md) - Development workflow, release process

---

## :hammer_and_wrench: Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

\`\`\`bash
git clone https://github.com/hive-academy/angular-3d-workspace.git
cd angular-3d-workspace
npm install
\`\`\`

### Commands

\`\`\`bash

# Start demo application

npx nx serve angular-3d-demo

# Build libraries

npx nx build @hive-academy/angular-3d
npx nx build @hive-academy/angular-gsap

# Run tests

npx nx run-many -t test

# Run all validation

npx nx run-many -t lint test typecheck build
\`\`\`

---

## :shipit: Publishing

See [CONTRIBUTING.md](./CONTRIBUTING.md#release-process-maintainers-only) for release process.

### Quick Reference

\`\`\`bash

# Version and publish (CI handles npm publish)

npm run release:version -- --projects=@hive-academy/angular-3d
git push && git push --tags
\`\`\`

---

## :page_facing_up: License

MIT (c) [Hive Academy](https://github.com/hive-academy)

---

## :handshake: Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting PRs.

---

## :link: Links

- [npm: @hive-academy/angular-3d](https://www.npmjs.com/package/@hive-academy/angular-3d)
- [npm: @hive-academy/angular-gsap](https://www.npmjs.com/package/@hive-academy/angular-gsap)
- [Three.js Documentation](https://threejs.org/docs/)
- [GSAP Documentation](https://greensock.com/docs/)
- [Angular Documentation](https://angular.dev)
```

**Key Changes from Current**:

- Remove all Nx boilerplate and promotional content
- Focus on libraries, not workspace tooling
- Add library comparison table with npm badges
- Add quick install sections for both libraries
- Preserve publishing documentation (condensed)
- Add professional badges and links

**Verification**:

- [ ] Nx boilerplate removed
- [ ] Both libraries prominently featured
- [ ] npm badges display correctly
- [ ] Quick Start for each library
- [ ] Links to library READMEs work
- [ ] Publishing info preserved (linked to CONTRIBUTING.md)
- [ ] Professional appearance

---

## Dependency Graph

```
Batch 1 (Foundation)          Batch 2 (Metadata)
├── LICENSE                   ├── angular-3d/package.json
├── CODE_OF_CONDUCT.md        └── angular-gsap/package.json
├── bug_report.md                      │
├── feature_request.md                 │
└── PULL_REQUEST_TEMPLATE.md           │
        │                              │
        └──────────┬───────────────────┘
                   │
                   v
           Batch 3 (angular-3d README)
           (Requires LICENSE for badge link)
                   │
                   v
           Batch 4 (Final Polish)
           ├── angular-gsap README badges
           └── Root README transformation
```

**Parallel Execution**:

- Batch 1 and Batch 2 can execute in parallel
- Batch 3 must wait for Batch 1 (LICENSE needed for badge)
- Batch 4 must wait for Batch 3 (consistency check)

---

## Quality Gates

### Gate 1: After Batch 1 (Foundation)

- [ ] `LICENSE` file exists at repo root
- [ ] `CODE_OF_CONDUCT.md` exists at repo root
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md` exists
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md` exists
- [ ] `.github/PULL_REQUEST_TEMPLATE.md` exists
- [ ] All files use UTF-8 encoding
- [ ] No trailing whitespace in files

**Verification Command**:

```bash
# Check files exist
ls -la LICENSE CODE_OF_CONDUCT.md
ls -la .github/ISSUE_TEMPLATE/ .github/PULL_REQUEST_TEMPLATE.md
```

### Gate 2: After Batch 2 (Metadata)

- [ ] `libs/angular-3d/package.json` has all new fields
- [ ] `libs/angular-gsap/package.json` has all new fields
- [ ] peerDependencies unchanged in both
- [ ] sideEffects: false preserved in both
- [ ] JSON is valid (no syntax errors)

**Verification Command**:

```bash
# Validate JSON syntax
npx jsonlint libs/angular-3d/package.json
npx jsonlint libs/angular-gsap/package.json

# Or simply:
cat libs/angular-3d/package.json | jq .
cat libs/angular-gsap/package.json | jq .
```

### Gate 3: After Batch 3 (angular-3d README)

- [ ] README has 350-500 lines
- [ ] All 14 primitives in table
- [ ] All 5 lights in table
- [ ] Badge URLs correct format
- [ ] All code examples valid TypeScript
- [ ] Markdown renders correctly (preview in VS Code or GitHub)

**Verification Command**:

```bash
# Count lines
wc -l libs/angular-3d/README.md

# Preview markdown (requires markdownlint)
npx markdownlint libs/angular-3d/README.md
```

### Gate 4: After Batch 4 (Final Polish)

- [ ] angular-gsap README has badge row
- [ ] Root README is library-focused
- [ ] All internal links work
- [ ] No Nx boilerplate in root README
- [ ] Consistent emoji usage across all READMEs

**Verification Command**:

```bash
# Check for broken links (requires markdown-link-check)
npx markdown-link-check libs/angular-3d/README.md
npx markdown-link-check libs/angular-gsap/README.md
npx markdown-link-check README.md
```

### Final Verification

- [ ] `npx nx run-many -t lint` passes
- [ ] `npx nx run-many -t build` passes
- [ ] All README markdown renders on GitHub preview
- [ ] npm badges will display (URLs are correct format)

---

## Risk Mitigation

### Risk 1: GitHub Repository URL Incorrect

**Symptom**: Badge images don't load, homepage links broken
**Mitigation**:

- Assumed URL pattern: `https://github.com/hive-academy/angular-3d-workspace`
- If different, search/replace all occurrences
- Test by clicking links in GitHub markdown preview

### Risk 2: npm Package Not Yet Published

**Symptom**: npm version badges show "package not found"
**Mitigation**:

- This is expected before first publish
- Badges will auto-populate after `npm publish`
- No action needed - documentation is correct

### Risk 3: Live Demo Not Deployed

**Symptom**: Demo links lead to 404
**Mitigation**:

- Use placeholder text: "Coming soon"
- Link to StackBlitz once templates created (Phase 2)
- Update after demo deployment

### Risk 4: Markdown Rendering Differences

**Symptom**: Tables or code blocks look wrong on npm vs GitHub
**Mitigation**:

- Use standard CommonMark syntax
- Avoid GitHub-specific features (details/summary)
- Test on both GitHub and npm preview

### Risk 5: Emoji Rendering

**Symptom**: Emojis don't display correctly
**Mitigation**:

- Use GitHub emoji shortcodes (`:sparkles:`) for consistency
- Alternatively use Unicode emojis directly
- Test in GitHub preview before merge

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. All tasks involve documentation files (Markdown, JSON)
2. No backend code, APIs, or database work
3. Requires understanding of Angular patterns for README examples
4. No browser-specific runtime code

### Complexity Assessment

**Overall Complexity**: HIGH (scope increased after full API audit)
**Estimated Total Effort**: 10-12 hours (updated from 6-7 hours)

| Batch   | Complexity | Estimated Time | Notes                                                                        |
| ------- | ---------- | -------------- | ---------------------------------------------------------------------------- |
| Batch 1 | LOW        | 1.5 hours      | Foundation docs (unchanged)                                                  |
| Batch 2 | LOW        | 30 minutes     | Package.json metadata (unchanged)                                            |
| Batch 3 | HIGH       | 5-6 hours      | angular-3d README: 44 components, 19 directives, 14 services                 |
| Batch 4 | HIGH       | 3-4 hours      | angular-gsap README: +6 components, +4 directives, +2 services + Root README |

### Files Summary

**CREATE (6 files)**:

- `D:\projects\angular-3d-workspace\LICENSE`
- `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md`
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md`
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md`
- `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`

**MODIFY (2 files)**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\package.json`
- `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json`

**REWRITE (3 files)**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\README.md` (major expansion: 145 → 600-800 lines)
- `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md` (significant additions: +6 components, +4 directives, +2 services)
- `D:\projects\angular-3d-workspace\README.md` (transform from Nx boilerplate)

### Critical Verification Points

**Before Implementation, Verify**:

1. GitHub repository URL is `https://github.com/hive-academy/angular-3d-workspace`
2. npm scope is `@hive-academy`
3. License is MIT (confirmed in existing package.json)
4. All peer dependency versions are correct in existing package.json

### Architecture Delivery Checklist

- [x] All files specified with exact paths
- [x] All content specifications provided
- [x] Batch organization with dependencies
- [x] Quality gates defined per batch
- [x] Risk mitigation strategies documented
- [x] Developer type recommended
- [x] Complexity assessed
- [x] Verification commands provided

---

**Document Version**: 1.0
**Created**: 2026-01-06
**Status**: Ready for Team-Leader Decomposition
