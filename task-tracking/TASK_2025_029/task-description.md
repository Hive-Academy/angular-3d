# Requirements Document - TASK_2025_029

## Introduction

This document defines the requirements for creating 6 prebuilt hero section showcases for the angular-3d-demo application. These hero sections will demonstrate the full capabilities of the `@hive-academy/angular-3d` library by combining multiple components, directives, and post-processing effects into visually stunning, production-ready templates.

**Business Value**: Provide developers with ready-to-use hero section templates that showcase modern 3D web design trends (2025), accelerating adoption of the angular-3d library and serving as reference implementations for common use cases.

**Technical Context**:

- Branch: `feature/TASK_2025_029-prebuilt-hero-sections`
- Location: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/`
- New Library Component: `libs/angular-3d/src/lib/primitives/metaball.component.ts`

---

## Scope Definition

### In Scope

1. **MetaballComponent** - New library component with ray marching shader
2. **6 Hero Scene Components** - Standalone scene components following existing patterns
3. **Routing Integration** - Add routes for showcasing each hero
4. **Responsive Design** - All heroes work on desktop and mobile
5. **Performance Optimization** - Adaptive quality for different devices

### Out of Scope

1. Unit tests for hero scenes (demo application, not library)
2. E2E tests for visual verification
3. Documentation pages explaining each hero
4. Animation timeline integration with GSAP
5. Custom fonts or typography loading
6. Backend integration or API calls

---

## Requirements

### Requirement 1: MetaballComponent (New Library Component)

**User Story:** As a developer using angular-3d, I want a MetaballComponent that renders organic, blob-like shapes with smooth blending, so that I can create modern hero sections with fluid, interactive visuals.

**Location**: `libs/angular-3d/src/lib/primitives/metaball.component.ts`

#### Acceptance Criteria

1. WHEN the component is rendered THEN it SHALL display ray-marched metaballs using fragment shader
2. WHEN the mouse moves THEN the cursor sphere SHALL follow mouse position with smooth interpolation
3. WHEN metaballs approach each other THEN they SHALL blend smoothly using `smin()` (smooth minimum) function
4. WHEN a color preset is selected THEN the component SHALL apply the corresponding lighting and color configuration
5. WHEN rendered on mobile THEN the component SHALL reduce ray march iterations for performance
6. WHEN the component is destroyed THEN it SHALL dispose all Three.js resources (geometry, material, textures)

#### Technical Specifications

**Shader Techniques (from reference example):**

- Ray marching with Signed Distance Functions (SDFs)
- `smin()` smooth minimum for organic blob merging: `float smin(float a, float b, float k)`
- `sdSphere()` sphere distance function: `float sdSphere(vec3 p, float r)`
- Interactive cursor sphere following mouse with proximity effects
- Adaptive quality detection (mobile vs desktop via navigator.userAgent)

**Color Presets (minimum 6):**
| Preset | Background | Sphere Color | Light Color | Cursor Glow |
|--------|------------|--------------|-------------|-------------|
| moody | #050505 | #000000 | #ffffff | #ffffff |
| cosmic | #000011 | #000022 | #88aaff | #4477ff |
| neon | #000505 | #000808 | #00ffcc | #00ffaa |
| sunset | #150505 | #100000 | #ff6622 | #ff4422 |
| holographic | #0a0a15 | #050510 | #ccaaff | #aa77ff |
| minimal | #0a0a0a | #000000 | #ffffff | #ffffff |

**Lighting Model:**

- Ambient light with configurable intensity (0.0 - 0.5)
- Diffuse lighting (Lambertian)
- Specular highlights (Blinn-Phong, configurable power 3-64)
- Fresnel rim lighting (configurable power 0.8 - 5.0)
- Ambient Occlusion (6-step sampling)
- Soft shadows (20-step ray march)

**Inputs:**

```typescript
// Configuration
preset = input<MetaballPreset>('holographic');
sphereCount = input<number>(6);
smoothness = input<number>(0.3);
animationSpeed = input<number>(0.6);
movementScale = input<number>(1.2);

// Cursor interaction
cursorRadiusMin = input<number>(0.08);
cursorRadiusMax = input<number>(0.15);
cursorGlowIntensity = input<number>(0.4);
cursorGlowRadius = input<number>(1.2);
mouseProximityEffect = input<boolean>(true);
mouseSmoothness = input<number>(0.1);

// Performance
enableAdaptiveQuality = input<boolean>(true);
maxRayMarchSteps = input<number>(48);
mobileRayMarchSteps = input<number>(16);
```

---

### Requirement 2: Metaball Hero Scene

**User Story:** As a user visiting the angular-3d showcase, I want to see an immersive metaball hero section with interactive cursor effects, so that I can experience cutting-edge 3D web design.

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/metaball-hero-scene.component.ts`

#### Acceptance Criteria

1. WHEN the scene loads THEN it SHALL render full-viewport metaballs with holographic preset by default
2. WHEN the user moves their mouse THEN the cursor sphere SHALL create proximity-based attraction effects
3. WHEN blobs merge THEN the blend radius SHALL dynamically increase based on proximity
4. WHEN a preset toggle is clicked THEN the scene SHALL smoothly transition to the new color scheme
5. WHEN viewed on mobile THEN touch events SHALL control the cursor sphere position
6. WHEN the component unmounts THEN all render loop callbacks SHALL be unregistered

#### Scene Composition

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 1]" [cameraFov]="75">
  <a3d-metaball [preset]="selectedPreset()" [sphereCount]="6" [mouseProximityEffect]="true" />
</a3d-scene-3d>
```

#### UI Overlay Requirements

- Preset selector (6 buttons or dropdown)
- Optional: FPS counter in dev mode
- Overlay text with gradient styling

---

### Requirement 3: Cosmic Portal Hero Scene

**User Story:** As a user visiting the angular-3d showcase, I want to see a cinematic space scene with nebula, planet, and glowing text, so that I can appreciate the library's depth and visual richness.

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/cosmic-portal-hero-scene.component.ts`

#### Acceptance Criteria

1. WHEN the scene loads THEN it SHALL render NebulaVolumetricComponent as background atmosphere
2. WHEN the scene loads THEN it SHALL display PlanetComponent with custom texture and glow
3. WHEN the scene loads THEN it SHALL render GlowTroikaTextComponent with bloom effect
4. WHEN orbit controls are enabled THEN the user SHALL be able to rotate the view
5. WHEN bloom effect is active THEN only emissive elements (text glow) SHALL bloom
6. WHEN the component is destroyed THEN all Three.js resources SHALL be disposed

#### Scene Composition

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="60">
  <!-- Lighting -->
  <a3d-ambient-light [intensity]="0.15" />
  <a3d-directional-light [position]="[10, 5, 10]" [intensity]="1.5" />

  <!-- Background -->
  <a3d-star-field [starCount]="4000" [radius]="60" [stellarColors]="true" />
  <a3d-nebula-volumetric [position]="[0, 0, -20]" [width]="80" [height]="40" [primaryColor]="'#8b5cf6'" [secondaryColor]="'#ec4899'" [opacity]="0.3" />

  <!-- Focal Elements -->
  <a3d-planet [position]="[-5, 0, 0]" [radius]="3" [textureUrl]="'/earth.jpg'" [glowIntensity]="0.6" rotate3d [rotateConfig]="{ axis: 'y', speed: 2 }" />

  <a3d-glow-troika-text [text]="'COSMIC PORTAL'" [fontSize]="2" [position]="[0, 5, 0]" [glowColor]="'#ec4899'" [glowIntensity]="3" />

  <!-- Post-processing -->
  <a3d-effect-composer>
    <a3d-bloom-effect [threshold]="0.8" [strength]="0.6" [radius]="0.4" />
  </a3d-effect-composer>

  <a3d-orbit-controls [autoRotate]="true" [autoRotateSpeed]="0.3" />
</a3d-scene-3d>
```

---

### Requirement 4: Floating Geometry Hero Scene

**User Story:** As a user visiting the angular-3d showcase, I want to see multiple floating polyhedrons with mouse tracking effects, so that I can experience interactive 3D geometry.

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/floating-geometry-hero-scene.component.ts`

#### Acceptance Criteria

1. WHEN the scene loads THEN it SHALL render at least 5 different polyhedron types (icosahedron, octahedron, dodecahedron, tetrahedron, cube)
2. WHEN polyhedrons are rendered THEN they SHALL have Float3dDirective for gentle bobbing motion
3. WHEN the mouse moves THEN polyhedrons SHALL subtly track toward mouse position (MouseTracking3dDirective)
4. WHEN polyhedrons are rendered THEN they SHALL use various metallic/glass-like materials
5. WHEN scene includes environment THEN IBL reflections SHALL be visible on metallic surfaces
6. WHEN the component is destroyed THEN all Three.js resources SHALL be disposed

#### Scene Composition

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="50">
  <!-- Lighting -->
  <a3d-ambient-light [intensity]="0.2" />
  <a3d-directional-light [position]="[5, 10, 5]" [intensity]="1.2" />

  <!-- Environment for reflections -->
  <a3d-environment [preset]="'sunset'" [intensity]="0.5" />

  <!-- Floating Polyhedrons with various types -->
  <a3d-polyhedron [type]="'icosahedron'" [position]="[-6, 2, 0]" [args]="[1.5, 0]" [color]="'#6366f1'" a3dFloat3d [floatSpeed]="1.2" [floatIntensity]="0.3" mouseTracking3d />

  <a3d-polyhedron [type]="'octahedron'" [position]="[4, -1, 2]" [args]="[1.2, 0]" [color]="'#ec4899'" a3dFloat3d [floatSpeed]="0.8" mouseTracking3d />

  <!-- Additional polyhedrons... -->

  <!-- Post-processing -->
  <a3d-effect-composer>
    <a3d-bloom-effect [threshold]="0.9" [strength]="0.3" [radius]="0.5" />
  </a3d-effect-composer>

  <a3d-orbit-controls [enableDamping]="true" [dampingFactor]="0.05" />
</a3d-scene-3d>
```

---

### Requirement 5: Particle Storm Hero Scene

**User Story:** As a user visiting the angular-3d showcase, I want to see dramatic particle text combined with a star field, so that I can experience dynamic text effects with atmospheric depth.

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/particle-storm-hero-scene.component.ts`

#### Acceptance Criteria

1. WHEN the scene loads THEN it SHALL render ParticleTextComponent with smoke/cloud particles
2. WHEN the scene loads THEN it SHALL include multi-layer StarFieldComponent for depth
3. WHEN particles animate THEN they SHALL grow, pulse, and rotate individually
4. WHEN bloom effect is applied THEN particle edges SHALL have soft glow
5. WHEN text is rendered THEN particles SHALL form readable text shape
6. WHEN the component is destroyed THEN all instanced meshes and textures SHALL be disposed

#### Scene Composition

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 15]" [cameraFov]="60" [backgroundColor]="0x0a0a0f">
  <!-- Ambient fill -->
  <a3d-ambient-light [intensity]="0.1" />

  <!-- Multi-layer star fields -->
  <a3d-star-field [starCount]="3000" [radius]="50" [size]="0.03" [stellarColors]="true" />
  <a3d-star-field [starCount]="2000" [radius]="70" [size]="0.02" [opacity]="0.6" />

  <!-- Particle text hero -->
  <a3d-particle-text [text]="'PARTICLE STORM'" [fontSize]="80" [fontScaleFactor]="0.06" [particleColor]="0x00d4ff" [opacity]="0.25" [maxParticleScale]="0.12" [particlesPerPixel]="2" [blendMode]="'additive'" [position]="[0, 0, 0]" />

  <!-- Post-processing -->
  <a3d-effect-composer>
    <a3d-bloom-effect [threshold]="0.6" [strength]="0.8" [radius]="0.5" />
  </a3d-effect-composer>
</a3d-scene-3d>
```

---

### Requirement 6: Bubble Dream Hero Scene

**User Story:** As a user visiting the angular-3d showcase, I want to see whimsical bubble text with volumetric nebula background, so that I can experience playful 3D effects.

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/bubble-dream-hero-scene.component.ts`

#### Acceptance Criteria

1. WHEN the scene loads THEN it SHALL render BubbleTextComponent with icosahedron bubbles
2. WHEN the scene loads THEN it SHALL include NebulaVolumetricComponent as dreamy background
3. WHEN bubbles animate THEN they SHALL grow, burst, and regrow cyclically
4. WHEN flying bubbles are enabled THEN some bubbles SHALL float upward
5. WHEN bubble shader runs THEN bubbles SHALL have fresnel-based rim lighting
6. WHEN the component is destroyed THEN all instanced meshes SHALL be disposed

#### Scene Composition

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 12]" [cameraFov]="55" [backgroundColor]="0x0f0520">
  <!-- Lighting -->
  <a3d-ambient-light [intensity]="0.3" />
  <a3d-directional-light [position]="[0, 5, 5]" [intensity]="0.8" />

  <!-- Dreamy nebula background -->
  <a3d-nebula-volumetric [position]="[0, 0, -15]" [width]="40" [height]="25" [primaryColor]="'#d946ef'" [secondaryColor]="'#8b5cf6'" [opacity]="0.4" />

  <!-- Bubble text -->
  <a3d-bubble-text [text]="'BUBBLE DREAM'" [fontSize]="70" [fontScaleFactor]="0.07" [bubbleRadius]="0.15" [maxBubbleScale]="0.8" [enableFlying]="true" [flyingRatio]="0.08" [position]="[0, 0, 0]" />

  <!-- Post-processing -->
  <a3d-effect-composer>
    <a3d-bloom-effect [threshold]="0.7" [strength]="0.4" [radius]="0.6" />
  </a3d-effect-composer>
</a3d-scene-3d>
```

---

### Requirement 7: Crystal Grid Hero Scene

**User Story:** As a user visiting the angular-3d showcase, I want to see geometric torus knots with wireframe and glow effects, so that I can experience abstract crystalline visuals.

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/crystal-grid-hero-scene.component.ts`

#### Acceptance Criteria

1. WHEN the scene loads THEN it SHALL render multiple TorusComponent objects in a grid pattern
2. WHEN torus objects are rendered THEN they SHALL use wireframe mode with emissive materials
3. WHEN Rotate3dDirective is applied THEN torus objects SHALL rotate continuously on multiple axes
4. WHEN Glow3dDirective is applied THEN torus objects SHALL have BackSide glow effect
5. WHEN bloom effect is applied THEN wireframe edges SHALL glow brightly
6. WHEN the component is destroyed THEN all Three.js resources SHALL be disposed

#### Scene Composition

```html
<a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="50" [backgroundColor]="0x050510">
  <!-- Lighting -->
  <a3d-ambient-light [intensity]="0.15" />
  <a3d-point-light [position]="[0, 0, 10]" [intensity]="1" [color]="'#00ffff'" />

  <!-- Crystal grid of rotating torus shapes -->
  <a3d-torus [position]="[-8, 4, 0]" [args]="[2, 0.5, 16, 50]" [color]="'#00ffff'" [wireframe]="true" [emissive]="'#00ffff'" [emissiveIntensity]="2" rotate3d [rotateConfig]="{ axis: 'y', speed: 1 }" a3dGlow3d [glowColor]="0x00ffff" [glowIntensity]="0.3" />

  <a3d-torus [position]="[8, -4, 0]" [args]="[2.5, 0.4, 16, 50]" [color]="'#ff00ff'" [wireframe]="true" [emissive]="'#ff00ff'" [emissiveIntensity]="2" rotate3d [rotateConfig]="{ axis: 'x', speed: 0.8 }" a3dGlow3d [glowColor]="0xff00ff" [glowIntensity]="0.3" />

  <a3d-torus [position]="[0, 0, -5]" [args]="[3, 0.6, 16, 50]" [color]="'#ffff00'" [wireframe]="true" [emissive]="'#ffff00'" [emissiveIntensity]="1.5" rotate3d [rotateConfig]="{ axis: 'z', speed: 0.5 }" a3dGlow3d [glowColor]="0xffff00" [glowIntensity]="0.25" />

  <!-- Post-processing -->
  <a3d-effect-composer>
    <a3d-bloom-effect [threshold]="0.5" [strength]="1.2" [radius]="0.4" />
  </a3d-effect-composer>

  <a3d-orbit-controls [autoRotate]="true" [autoRotateSpeed]="0.5" />
</a3d-scene-3d>
```

---

## Non-Functional Requirements

### Performance Requirements

| Metric                 | Target (Desktop) | Target (Mobile) | Measurement Method           |
| ---------------------- | ---------------- | --------------- | ---------------------------- |
| Frame Rate             | 60 FPS sustained | 30 FPS minimum  | Browser DevTools Performance |
| First Contentful Paint | < 1.5s           | < 2.5s          | Lighthouse                   |
| Time to Interactive    | < 3s             | < 5s            | Lighthouse                   |
| Memory Usage           | < 150MB          | < 100MB         | Browser DevTools Memory      |
| GPU Memory             | < 256MB          | < 128MB         | Browser DevTools             |

**Performance Optimization Strategies:**

- Adaptive ray march iterations (48 desktop, 16 mobile)
- Reduced sphere segments on mobile (detail: 3 -> 2)
- Instanced mesh rendering for particles (max 10,000 instances)
- Demand-based frame loop for static scenes
- Texture resolution reduction on mobile (1024px -> 512px)

### Responsiveness Requirements

| Breakpoint | Viewport Width | Behavior                                       |
| ---------- | -------------- | ---------------------------------------------- |
| Mobile     | < 768px        | Touch controls, reduced quality, simplified UI |
| Tablet     | 768px - 1024px | Touch/mouse hybrid, medium quality             |
| Desktop    | > 1024px       | Full quality, mouse controls, complete UI      |

**Responsive Adaptations:**

- WHEN viewport width < 768px THEN ray march steps SHALL reduce to 16
- WHEN viewport width < 768px THEN particle count SHALL reduce by 50%
- WHEN touch device is detected THEN touch events SHALL be used for cursor tracking
- WHEN device pixel ratio > 2 THEN render resolution SHALL be capped at 2x

### Accessibility Requirements

| Requirement         | Implementation                                   |
| ------------------- | ------------------------------------------------ |
| Reduced Motion      | Respect `prefers-reduced-motion` media query     |
| Focus Indicators    | Visible focus states on UI controls              |
| ARIA Labels         | All interactive elements have descriptive labels |
| Color Contrast      | UI text meets WCAG 2.1 AA (4.5:1 ratio)          |
| Keyboard Navigation | All UI controls accessible via keyboard          |

**Implementation:**

```typescript
// Check for reduced motion preference
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) {
  // Disable or reduce animations
  settings.animationSpeed = 0;
}
```

### Browser Compatibility

| Browser        | Minimum Version | WebGL Requirement |
| -------------- | --------------- | ----------------- |
| Chrome         | 90+             | WebGL 2.0         |
| Firefox        | 88+             | WebGL 2.0         |
| Safari         | 15+             | WebGL 2.0         |
| Edge           | 90+             | WebGL 2.0         |
| Mobile Safari  | 15+             | WebGL 2.0         |
| Chrome Android | 90+             | WebGL 2.0         |

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder         | Role        | Interest                         | Success Criteria                 |
| ------------------- | ----------- | -------------------------------- | -------------------------------- |
| Angular Developers  | End Users   | Ready-to-use hero templates      | Can copy/customize scenes easily |
| Library Maintainers | Development | Demonstrate library capabilities | All components used correctly    |
| Demo Site Visitors  | Evaluators  | See visual quality               | Smooth, impressive visuals       |

### Secondary Stakeholders

| Stakeholder       | Role       | Interest               | Success Criteria              |
| ----------------- | ---------- | ---------------------- | ----------------------------- |
| UX/Design Teams   | Reference  | Design patterns        | Modern, trend-aligned visuals |
| Performance Teams | Validation | Performance benchmarks | Meets FPS/memory targets      |
| Marketing         | Promotion  | Showcase material      | Screenshot/video-ready scenes |

---

## Risk Assessment

### Technical Risks

| Risk                                  | Probability | Impact | Mitigation                                           | Contingency                                    |
| ------------------------------------- | ----------- | ------ | ---------------------------------------------------- | ---------------------------------------------- |
| Shader compilation fails on some GPUs | Medium      | High   | Test on multiple GPU vendors; provide fallback       | Simple material fallback without ray marching  |
| Performance issues on low-end mobile  | High        | Medium | Aggressive quality reduction; early device detection | Static image fallback for very low-end devices |
| Memory leaks from improper cleanup    | Medium      | High   | Strict DestroyRef usage; memory profiling            | Add explicit dispose() methods                 |
| Ray marching precision issues         | Low         | Medium | Use appropriate EPSILON values; test edge cases      | Increase EPSILON or reduce complexity          |

### Implementation Risks

| Risk                            | Probability | Impact | Mitigation                                           | Contingency                      |
| ------------------------------- | ----------- | ------ | ---------------------------------------------------- | -------------------------------- |
| MetaballComponent complexity    | Medium      | High   | Incremental implementation; reference example code   | Simplify shader, reduce features |
| Component integration conflicts | Low         | Medium | Test with existing demo scenes; isolated development | Namespace shader uniforms        |
| Build/bundle size increase      | Medium      | Low    | Tree-shaking; lazy loading                           | Code splitting by route          |

---

## Dependencies

### Internal Dependencies

| Dependency                | Component       | Required For                     |
| ------------------------- | --------------- | -------------------------------- |
| Scene3dComponent          | canvas          | All hero scenes                  |
| RenderLoopService         | render-loop     | Animation callbacks              |
| SceneService              | canvas          | Camera/renderer access           |
| Float3dDirective          | directives      | Floating geometry                |
| Rotate3dDirective         | directives      | Crystal grid rotation            |
| MouseTracking3dDirective  | directives      | Floating geometry mouse tracking |
| Glow3dDirective           | directives      | Crystal grid glow                |
| EffectComposerComponent   | postprocessing  | All bloom effects                |
| BloomEffectComponent      | postprocessing  | All hero scenes                  |
| StarFieldComponent        | primitives      | Cosmic portal, particle storm    |
| NebulaVolumetricComponent | primitives      | Cosmic portal, bubble dream      |
| PlanetComponent           | primitives      | Cosmic portal                    |
| PolyhedronComponent       | primitives      | Floating geometry                |
| TorusComponent            | primitives      | Crystal grid                     |
| ParticleTextComponent     | primitives/text | Particle storm                   |
| BubbleTextComponent       | primitives/text | Bubble dream                     |
| GlowTroikaTextComponent   | primitives/text | Cosmic portal                    |

### External Dependencies

| Dependency   | Version  | Required For      |
| ------------ | -------- | ----------------- |
| three        | ^0.182.0 | Core 3D rendering |
| @types/three | ^0.182.0 | TypeScript types  |

---

## Success Metrics

| Metric                                  | Target         | Measurement                       |
| --------------------------------------- | -------------- | --------------------------------- |
| All 6 hero scenes render without errors | 100%           | Manual testing                    |
| Desktop FPS >= 60                       | 100% of scenes | Performance profiling             |
| Mobile FPS >= 30                        | 100% of scenes | Device testing                    |
| Memory leaks                            | 0 detected     | Memory profiling after navigation |
| Build succeeds                          | All projects   | `npx nx run-many -t build`        |
| Type check passes                       | All projects   | `npx nx run-many -t typecheck`    |
| Lint passes                             | All projects   | `npx nx run-many -t lint`         |

---

## Implementation Priority

| Priority | Component                    | Rationale                                      |
| -------- | ---------------------------- | ---------------------------------------------- |
| 1        | MetaballComponent (library)  | Foundation for metaball hero; new capability   |
| 2        | Metaball Hero Scene          | Showcases new component; highest visual impact |
| 3        | Crystal Grid Hero Scene      | Uses existing components; wireframe + glow     |
| 4        | Floating Geometry Hero Scene | Uses existing components; interactive          |
| 5        | Cosmic Portal Hero Scene     | Uses existing components; cinematic            |
| 6        | Particle Storm Hero Scene    | Uses existing components; text effects         |
| 7        | Bubble Dream Hero Scene      | Uses existing components; playful              |

---

## Appendix A: Reference Shader Code

The MetaballComponent shader should implement these core functions from the reference example:

```glsl
// Smooth minimum for blob blending
float smin(float a, float b, float k) {
  float h = max(k - abs(a - b), 0.0) / k;
  return min(a, b) - h * h * k * 0.25;
}

// Sphere SDF
float sdSphere(vec3 p, float r) {
  return length(p) - r;
}

// Ray marching main loop
float rayMarch(vec3 ro, vec3 rd) {
  float t = 0.0;
  for (int i = 0; i < MAX_STEPS; i++) {
    vec3 p = ro + rd * t;
    float d = sceneSDF(p);
    if (d < EPSILON) return t;
    if (t > MAX_DIST) break;
    t += d;
  }
  return -1.0;
}
```

---

## Appendix B: Component API Summary

### MetaballComponent Inputs

| Input                 | Type           | Default       | Description                   |
| --------------------- | -------------- | ------------- | ----------------------------- |
| preset                | MetaballPreset | 'holographic' | Color/lighting preset         |
| sphereCount           | number         | 6             | Number of moving metaballs    |
| smoothness            | number         | 0.3           | Blend smoothness factor       |
| animationSpeed        | number         | 0.6           | Animation multiplier          |
| movementScale         | number         | 1.2           | Orbit radius scale            |
| cursorRadiusMin       | number         | 0.08          | Min cursor sphere radius      |
| cursorRadiusMax       | number         | 0.15          | Max cursor sphere radius      |
| cursorGlowIntensity   | number         | 0.4           | Cursor glow brightness        |
| cursorGlowRadius      | number         | 1.2           | Cursor glow spread            |
| mouseProximityEffect  | boolean        | true          | Enable mouse interaction      |
| mouseSmoothness       | number         | 0.1           | Mouse lerp factor             |
| enableAdaptiveQuality | boolean        | true          | Auto-reduce quality on mobile |
| maxRayMarchSteps      | number         | 48            | Desktop ray march iterations  |
| mobileRayMarchSteps   | number         | 16            | Mobile ray march iterations   |

### MetaballComponent Outputs

| Output         | Type                                 | Description                  |
| -------------- | ------------------------------------ | ---------------------------- |
| mergeCount     | EventEmitter<number>                 | Number of active blob merges |
| cursorPosition | EventEmitter<{x: number, y: number}> | Normalized cursor position   |

---

## Document History

| Version | Date       | Author                | Changes                       |
| ------- | ---------- | --------------------- | ----------------------------- |
| 1.0     | 2025-12-26 | Project Manager Agent | Initial requirements document |
