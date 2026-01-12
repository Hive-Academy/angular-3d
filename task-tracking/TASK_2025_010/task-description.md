# Requirements Document - TASK_2025_010

## Introduction

The `@hive-academy/angular-3d` library is now feature-complete with all core infrastructure, primitives, loaders, controls, postprocessing, and animation capabilities implemented. However, the demo application (`apps/angular-3d-demo/`) remains a minimal Angular boilerplate with no 3D content. Meanwhile, the `temp/scene-graphs/` directory contains 4 production-ready scene components that currently use the deprecated `angular-three` library.

This task migrates reference scenes from `temp/` to the demo application, replacing all `angular-three` dependencies with the new `@hive-academy/angular-3d` library. The demo will serve as both a visual showcase and a reference implementation for developers.

**Business Value**:

- **Developer Onboarding**: Provides real-world examples of library usage patterns
- **Visual Showcase**: Demonstrates library capabilities through production-quality 3D scenes
- **Quality Validation**: Proves library is production-ready through full application integration
- **Documentation Support**: Provides code examples for comprehensive documentation (TASK_2025_014)
- **Testing Foundation**: Creates integration test targets (TASK_2025_011)

## Task Classification

- **Type**: FEATURE (demo application enhancement)
- **Priority**: P1-High (blocks testing and documentation)
- **Complexity**: Medium
- **Estimated Effort**: 12-16 hours

## Workflow Dependencies

- **Research Needed**: No (migration patterns established, library complete)
- **UI/UX Design Needed**: **Yes** (professional showcase for 2 libraries with proper information architecture)

## Requirements

### Requirement 1: Demo App Routing Infrastructure

**User Story**: As a developer exploring `@hive-academy/angular-3d`, I want to navigate between multiple demo scenes, so that I can see different library features in isolation.

#### Acceptance Criteria

1. WHEN demo app loads THEN root route SHALL redirect to `/hero` scene
2. WHEN user clicks navigation links THEN route SHALL change without full page reload
3. WHEN route changes THEN previous scene SHALL be properly disposed (no memory leaks)
4. WHEN invalid route accessed THEN user SHALL be redirected to home page
5. WHEN navigation rendered THEN all scene routes SHALL be listed with descriptive labels

**Technical Details**:

- Routes: `/hero`, `/cta`, `/value-props`
- Navigation component with router links
- Route guards for cleanup (if needed)
- Lazy-loaded route components for optimal bundle size

---

### Requirement 2: Hero Space Scene Migration

**User Story**: As a visitor viewing the demo app hero section, I want to see a stunning space-themed 3D scene with planets, stars, and animated elements, so that I understand the library's advanced capabilities.

#### Acceptance Criteria

1. WHEN `/hero` route loaded THEN space scene SHALL render within 2 seconds
2. WHEN scene renders THEN all elements SHALL appear correctly:
   - Central Earth planet (GLTF model) rotating on Y-axis
   - Moon planet with texture and atmospheric glow
   - Multi-layer star field (3 layers with parallax)
   - Volumetric nebula clouds
   - Tech stack SVG logos (NestJS, LangChain, ChromaDB, Neo4j) with float animations
   - Particle text elements ("Build Production Grade AI Apps", "With TypeScript Patterns", "You Already Know", "Hive Academy")
   - Two robot GLTF models flying on space flight paths
3. WHEN OrbitControls active THEN user SHALL be able to orbit, zoom, and rotate camera
4. WHEN animations running THEN frame rate SHALL maintain 60fps on desktop, 30fps minimum on mobile
5. WHEN scene destroyed THEN all resources (geometries, materials, textures, GSAP timelines) SHALL be disposed

**Technical Details**:

- Source: `temp/scene-graphs/hero-space-scene.component.ts` (728 lines)
- Target: `apps/angular-3d-demo/src/app/scenes/hero-scene.component.ts`
- Components Used:
  - `Scene3dComponent` (canvas host)
  - `GltfModelComponent` (Earth, robots)
  - `PlanetComponent` (Moon)
  - `StarFieldComponent` (3 layers)
  - `NebulaComponent` + `NebulaVolumetricComponent`
  - `SVGIconComponent` (4 tech logos)
  - `ParticleTextComponent` (particle-based text)
  - `OrbitControlsComponent`
  - `BloomEffectComponent`
- Directives: `Float3dDirective`, `Rotate3dDirective`, `ScrollZoomCoordinatorDirective`
- Dependencies: GLTF models, SVG logos, textures (existing in `/assets`)

---

### Requirement 3: CTA Scene Migration

**User Story**: As a visitor viewing the CTA section, I want to see subtle 3D background elements that enhance the section without overwhelming content, so that the CTA remains prominent.

#### Acceptance Criteria

1. WHEN `/cta` route loaded THEN CTA scene SHALL render within 1 second (minimal complexity)
2. WHEN scene renders THEN 3 floating polyhedrons SHALL appear with:
   - Icosahedron (left side, opacity 35%, float 4.5s)
   - Octahedron (right side, opacity 30%, float 5s)
   - Dodecahedron (center background, opacity 40%, float 4s)
3. WHEN polyhedrons animate THEN float animation SHALL be smooth and subtle (60fps)
4. WHEN scene background THEN elements SHALL have low opacity (30-40%) to not distract from content
5. WHEN scene destroyed THEN all resources SHALL be disposed

**Technical Details**:

- Source: `temp/scene-graphs/cta-scene-graph.component.ts` (113 lines)
- Target: `apps/angular-3d-demo/src/app/scenes/cta-scene.component.ts`
- Components Used:
  - `Scene3dComponent`
  - `PolyhedronComponent` (3 instances: icosahedron, octahedron, dodecahedron)
  - `AmbientLightComponent`, `DirectionalLightComponent`
- Directives: `Float3dDirective`
- Pattern: Minimal 3D for background ambiance

---

### Requirement 4: Value Propositions Scene Migration

**User Story**: As a visitor scrolling through value propositions, I want to see unique 3D geometries that represent each library feature, so that visual storytelling reinforces the library's capabilities.

#### Acceptance Criteria

1. WHEN `/value-props` route loaded THEN value propositions scene SHALL render within 1.5 seconds
2. WHEN scene renders THEN 11 unique geometries SHALL be displayed (one per library feature)
3. WHEN user scrolls THEN geometries SHALL rotate and scale responsively (scroll-driven animations)
4. WHEN animations execute THEN frame rate SHALL maintain 60fps on desktop
5. WHEN scene destroyed THEN all resources SHALL be disposed

**Technical Details**:

- Source: `temp/scene-graphs/value-propositions-3d-scene.component.ts` (335 lines)
- Target: `apps/angular-3d-demo/src/app/scenes/value-props-scene.component.ts`
- Components Used:
  - `Scene3dComponent`
  - Multiple primitive components (Box, Sphere, Cylinder, Torus, Cone, etc.)
  - `AmbientLightComponent`, `DirectionalLightComponent`
- Pattern: Scroll-synchronized animations via `@hive-academy/angular-gsap`
- Geometries: Box, Sphere, Cone, Cylinder, Torus, Dodecahedron, Icosahedron, Octahedron, Capsule, Torus Knot, Tetrahedron

---

### Requirement 5: Library Import Migration

**User Story**: As a developer reviewing demo code, I want all imports to use `@hive-academy/angular-3d` instead of `angular-three`, so that I can see correct usage patterns for the new library.

#### Acceptance Criteria

1. WHEN any demo component imports Three.js primitives THEN imports SHALL use `@hive-academy/angular-3d`
2. WHEN any demo component uses canvas/scene THEN imports SHALL use `Scene3dComponent` from `@hive-academy/angular-3d`
3. WHEN any demo component uses GSAP directives THEN imports SHALL use directives from `@hive-academy/angular-3d`
4. WHEN demo built THEN `angular-three` SHALL NOT appear in bundle (zero dependencies)
5. WHEN demo built THEN build SHALL complete without errors

**Technical Details**:

- Replace `extend()` from `angular-three` with native Angular components
- Replace `ngt-*` custom elements with Angular component selectors
- Replace `injectStore()` with `inject(Angular3DStateStore)` (if used)
- Remove `CUSTOM_ELEMENTS_SCHEMA` (no longer needed)
- Update all component/directive imports to use `@hive-academy/angular-3d`

**Migration Mapping**:

| angular-three                                      | @hive-academy/angular-3d                                          |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `extend({ AmbientLight })` + `<ngt-ambient-light>` | `import { AmbientLightComponent }` + `<app-ambient-light>`        |
| `extend({ Mesh })` + `<ngt-mesh>`                  | Use primitive components directly (BoxComponent, SphereComponent) |
| `injectStore()`                                    | `inject(Angular3DStateStore)`                                     |
| `injectBeforeRender()`                             | `inject(RenderLoopService).addUpdateCallback()`                   |
| `injectGLTF()`                                     | `inject(GltfLoaderService).load()`                                |

---

### Requirement 6: Responsive Design & Performance

**User Story**: As a mobile user viewing the demo, I want optimized 3D scenes that perform well on my device, so that I can experience the library without lag or crashes.

#### Acceptance Criteria

1. WHEN demo loaded on mobile (<768px) THEN particle counts SHALL be reduced by 50%
2. WHEN demo loaded on tablet (768-1024px) THEN particle counts SHALL be reduced by 25%
3. WHEN demo loaded on desktop (>1024px) THEN full particle counts SHALL render
4. WHEN frame rate drops below 30fps THEN scene complexity SHALL gracefully degrade
5. WHEN viewport resized THEN camera aspect ratio SHALL update immediately

**Technical Details**:

- Use `window.matchMedia()` for breakpoint detection
- Implement responsive signals for particle counts:
  - Desktop: Full counts (3000+ stars, 60 particles)
  - Tablet: 75% of desktop counts
  - Mobile: 50% of desktop counts (1500 stars, 30 particles)
- Use `RenderLoopService` for performance monitoring
- Adjust bloom intensity based on device capability

---

### Requirement 7: Asset Management

**User Story**: As a developer running the demo locally, I want all 3D assets to load correctly, so that I can see the full visual experience.

#### Acceptance Criteria

1. WHEN scene renders GLTF models THEN models SHALL load from `/assets/3d/` directory
2. WHEN scene renders textures THEN textures SHALL load from `/assets/` directory
3. WHEN scene renders SVG logos THEN logos SHALL load from `/assets/images/logos/` directory
4. WHEN asset fails to load THEN error SHALL be logged and scene SHALL degrade gracefully (show placeholder)
5. WHEN all assets loaded THEN loading indicator SHALL hide

**Technical Details**:

- Required GLTF models:
  - `/assets/3d/planet_earth/scene.gltf`
  - `/assets/3d/mini_robot.glb`
  - `/assets/3d/robo_head/scene.gltf`
- Required textures:
  - `/assets/moon.jpg`
- Required SVG logos:
  - `/assets/images/logos/nestjs.svg`
  - `/assets/images/logos/langchain.svg`
  - `/assets/images/logos/chroma.svg`
  - `/assets/images/logos/neo4j.svg`
- Error handling: Use `GltfLoaderService` error callbacks
- Loading states: Implement loading spinner for GLTF-heavy scenes

---

### Requirement 8: Code Quality & Documentation

**User Story**: As a developer learning `@hive-academy/angular-3d`, I want demo code to be clean, well-commented, and follow best practices, so that I can use it as a reference implementation.

#### Acceptance Criteria

1. WHEN viewing demo component code THEN JSDoc comments SHALL explain scene purpose and features
2. WHEN viewing component inputs THEN signal-based inputs SHALL follow library patterns
3. WHEN viewing lifecycle hooks THEN `DestroyRef` SHALL be used for cleanup (no `ngOnDestroy`)
4. WHEN viewing templates THEN code SHALL be formatted consistently (2-space indentation)
5. WHEN building demo THEN zero ESLint errors SHALL be reported

**Technical Details**:

- JSDoc headers on all scene components
- Signal-based inputs: `readonly sceneId = input<string>();`
- DestroyRef cleanup pattern for GSAP timelines
- TypeScript strict mode: `strict: true`
- ChangeDetection: `OnPush` on all components
- Standalone components only (no NgModules)

---

## Non-Functional Requirements

### Performance

- **Frame Rate**: 60fps target on desktop (1920x1080, modern GPU), 30fps minimum on mobile
- **Load Time**:
  - Hero scene: <2 seconds (includes GLTF loading)
  - CTA scene: <1 second (minimal complexity)
  - Value Props scene: <1.5 seconds
- **Memory Usage**: <200MB total for hero scene (largest scene)
- **Bundle Size**: Demo app ≤500KB gzipped (excluding Three.js peer dependency)

### Code Quality

- **Test Coverage**: ≥50% for demo components (smoke tests for rendering)
- **TypeScript Strict Mode**: All files pass strict type checking
- **Linter**: Zero ESLint warnings/errors
- **Angular Patterns**: Signal-based inputs, `inject()` function, standalone components, OnPush

### Compatibility

- **Angular Version**: 20.3+
- **Browser Support**: Modern browsers with WebGL 2.0 (Chrome 56+, Firefox 51+, Safari 15+)
- **Three.js Version**: Compatible with `@hive-academy/angular-3d` peer dependency
- **GSAP Version**: ^3.12.0+
- **SSR**: Not applicable (Three.js client-only)

### Maintainability

- **Code Style**: Consistent with library patterns (see `angular-style-guide.md`)
- **Comments**: JSDoc on all public APIs
- **File Organization**: Feature-based folders (`scenes/`, `components/`, `services/`)
- **Naming**: Descriptive component names (HeroSceneComponent, CtaSceneComponent)

---

## Stakeholder Analysis

- **End Users (Developers Learning Library)**: Need clear, working examples of library usage
- **Library Maintainers**: Need validation that library works in real applications
- **Documentation Writers (TASK_2025_014)**: Need code examples to reference in docs
- **QA Testers (TASK_2025_011)**: Need integration test targets for validation

---

## Risk Analysis

### Technical Risks

**Risk 1: GLTF Model Loading Failures**

- **Probability**: Low (models already in use)
- **Impact**: High (scenes won't render correctly)
- **Mitigation**: Test all model paths, implement error fallbacks
- **Contingency**: Use simple primitive replacements for missing models

**Risk 2: Performance Degradation on Mobile**

- **Probability**: Medium (complex scenes with many particles)
- **Impact**: High (poor user experience)
- **Mitigation**: Implement responsive particle counts, degrade quality on low FPS
- **Contingency**: Create mobile-specific simplified scenes

**Risk 3: Memory Leaks from Improper Cleanup**

- **Probability**: Medium (complex scenes with many objects)
- **Impact**: High (browser crashes after multiple route changes)
- **Mitigation**: Comprehensive DestroyRef cleanup, manual QA for all scenes
- **Contingency**: Add explicit cleanup service to force disposal

**Risk 4: Angular-Three Migration Complexity**

- **Probability**: Low (migration patterns established)
- **Impact**: Medium (delays implementation)
- **Mitigation**: Use template migration strategy (strongest typing)
- **Contingency**: Create migration helper utilities for common patterns

---

## Dependencies

### Technical Dependencies

- **Required**: `@hive-academy/angular-3d` (workspace library), Three.js ^0.171.0, GSAP ^3.12.0, Angular 20.3+
- **Build**: Nx build tools, TypeScript compiler
- **Assets**: GLTF models, SVG logos, textures (already in `temp/`)

### Task Dependencies

- **Depends On**:
  - ✅ TASK_2025_001-008 (Core library infrastructure - COMPLETE)
  - ✅ TASK_2025_009 (Angular GSAP Library - COMPLETE)
  - ✅ TASK_2025_013 (Angular-3D GSAP Directives - COMPLETE)
- **Blocks**:
  - TASK_2025_011 (Testing & Validation - needs demo for integration tests)
  - TASK_2025_014 (Comprehensive Documentation - needs code examples)
- **Parallel With**:
  - TASK_2025_012 (GSAP Showcase Migration - independent demo)

---

## Success Metrics

### Quantitative Metrics

- **Metric 1**: All 3 scenes (hero, CTA, value props) migrated and rendering correctly
- **Metric 2**: Zero `angular-three` imports in demo codebase
- **Metric 3**: Build passing: `npx nx build angular-3d-demo` in <30 seconds
- **Metric 4**: All scenes maintain ≥30fps on mobile, ≥60fps on desktop
- **Metric 5**: Zero memory leaks (route changes 10x without crash)

### Qualitative Metrics

- **Metric 6**: Developer feedback: "Demo is a clear reference for library usage"
- **Metric 7**: Code review: "Demo code is clean and follows library patterns"
- **Metric 8**: Visual quality: "Scenes are visually impressive and showcase library capabilities"

---

## Scope Boundaries

### In Scope

- ✅ **UI/UX Design** (requires Phase 3):
  - Landing page layout and information architecture
  - Library showcase sections (angular-3d + angular-gsap)
  - Feature highlights and code examples
  - Navigation design and responsive layout
  - Tailwind CSS styling (already installed)
- ✅ Demo app routing (3+ routes: home, angular-3d showcase, angular-gsap showcase)
- ✅ Hero space scene migration
- ✅ CTA scene migration
- ✅ Value propositions scene migration
- ✅ Replace all `angular-three` with `@hive-academy/angular-3d`
- ✅ Responsive particle counts (desktop/tablet/mobile)
- ✅ Asset management (GLTF, textures, SVGs)
- ✅ Code quality (JSDoc, cleanup, linting)

### Out of Scope (Deferred)

- ❌ Advanced interactive features (theme switcher, particle count controls) - Future enhancement
- ❌ Performance metrics overlay - Future enhancement
- ❌ Code view/export feature - Future enhancement
- ❌ E2E tests (handled by TASK_2025_011)
- ❌ Production deployment (separate task)
- ❌ Blog/documentation CMS - Future enhancement
- ❌ User authentication/accounts - Not applicable

---

## Implementation Notes

### Migration Strategy: Template Migration (Recommended)

**Why Template Migration?**

1. **Strongest Typing**: Native Angular components with full TypeScript support
2. **No CUSTOM_ELEMENTS_SCHEMA**: Avoid schema pollution
3. **Clear Errors**: Compiler catches missing/incorrect props
4. **Best DX**: Autocomplete and IntelliSense in templates

**Migration Steps**:

1. Replace `extend({ AmbientLight })` + `<ngt-ambient-light>` with `import { AmbientLightComponent } + <app-ambient-light>`
2. Remove `CUSTOM_ELEMENTS_SCHEMA` from component decorators
3. Update all `ngt-*` tags to corresponding Angular component selectors
4. Replace `injectStore()` with `inject(Angular3DStateStore)` (if used)
5. Replace `injectBeforeRender()` with `inject(RenderLoopService).addUpdateCallback()`

**Example Migration**:

```typescript
// BEFORE (angular-three)
import { extend } from 'angular-three';
import { AmbientLight } from 'three';

extend({ AmbientLight });

@Component({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<ngt-ambient-light [intensity]="0.5" />`
})

// AFTER (@hive-academy/angular-3d)
import { AmbientLightComponent } from '@hive-academy/angular-3d';

@Component({
  imports: [AmbientLightComponent],
  template: `<app-ambient-light [intensity]="0.5" />`
})
```

### Component Selector Mapping

| angular-three Tag         | @hive-academy/angular-3d Component | Selector                          |
| ------------------------- | ---------------------------------- | --------------------------------- |
| `<ngt-ambient-light>`     | `AmbientLightComponent`            | `<app-ambient-light>`             |
| `<ngt-directional-light>` | `DirectionalLightComponent`        | `<app-directional-light>`         |
| `<ngt-point-light>`       | `PointLightComponent`              | `<app-point-light>`               |
| `<ngt-mesh>`              | Use primitive components           | `<app-box>`, `<app-sphere>`, etc. |
| `<ngt-canvas>`            | `Scene3dComponent`                 | `<scene-3d>`                      |

### Assets Migration

All assets in `temp/` should be copied to `apps/angular-3d-demo/src/assets/`:

```bash
# GLTF models
cp -r temp/assets/3d apps/angular-3d-demo/src/assets/

# Textures
cp temp/assets/moon.jpg apps/angular-3d-demo/src/assets/

# SVG logos
cp -r temp/assets/images/logos apps/angular-3d-demo/src/assets/images/
```

---

## Verification Plan

### Manual Verification

1. **Visual Inspection**:

   - Visit `/hero` route → Verify space scene renders correctly
   - Visit `/cta` route → Verify floating polyhedrons appear
   - Visit `/value-props` route → Verify 11 geometries render
   - Navigate between routes 10x → Verify no memory leaks (check DevTools Performance)

2. **Interaction Testing**:

   - Use OrbitControls on hero scene → Verify camera orbits, zooms smoothly
   - Scroll on hero scene → Verify scroll-zoom coordination works
   - Resize browser window → Verify camera aspect updates

3. **Performance Testing**:
   - Open DevTools Performance tab
   - Record hero scene for 10 seconds
   - Verify ≥60fps on desktop, ≥30fps on mobile

### Automated Tests

```bash
# Build demo app
npx nx build angular-3d-demo

# Run unit tests (smoke tests for component rendering)
npx nx test angular-3d-demo

# Check bundle size
npx nx build angular-3d-demo --configuration=production
# Verify dist/ bundle <500KB gzipped
```

### Acceptance Testing

- [ ] All 3 scenes render without errors
- [ ] Navigation works without page reload
- [ ] OrbitControls functional on hero scene
- [ ] No `angular-three` in bundle
- [ ] Build passes without errors
- [ ] Lint passes without errors
- [ ] ≥30fps performance on mobile
- [ ] ≥60fps performance on desktop
- [ ] No memory leaks after 10 route changes
- [ ] All assets load correctly

---

## Deliverables

### Code Deliverables

1. **Demo App Routing**:

   - `apps/angular-3d-demo/src/app/app.routes.ts` (3 routes)
   - `apps/angular-3d-demo/src/app/components/navigation.component.ts` (optional navigation UI)

2. **Scene Components**:

   - `apps/angular-3d-demo/src/app/scenes/hero-scene.component.ts` (migrated hero space scene)
   - `apps/angular-3d-demo/src/app/scenes/cta-scene.component.ts` (migrated CTA scene)
   - `apps/angular-3d-demo/src/app/scenes/value-props-scene.component.ts` (migrated value props scene)

3. **Assets**:

   - `apps/angular-3d-demo/src/assets/3d/` (GLTF models)
   - `apps/angular-3d-demo/src/assets/images/logos/` (SVG logos)
   - `apps/angular-3d-demo/src/assets/moon.jpg` (texture)

4. **Configuration**:
   - `apps/angular-3d-demo/project.json` (updated build targets)
   - `apps/angular-3d-demo/tsconfig.json` (strict mode enabled)

### Documentation Deliverables

1. **README**: `apps/angular-3d-demo/README.md` (updated with scene descriptions)
2. **JSDoc**: All scene components have comprehensive JSDoc headers

---

## Estimated Timeline

- **UI/UX Design (Phase 3)**: 3-4 hours (layout, information architecture, Canva assets)
- **Planning & Setup**: 1 hour (routing, navigation, asset copying)
- **Landing Page Implementation**: 2-3 hours (hero, features, library info sections)
- **Hero Scene Migration**: 4-5 hours (most complex scene, many components)
- **CTA Scene Migration**: 1-2 hours (simple scene, 3 polyhedrons)
- **Value Props Scene Migration**: 2-3 hours (11 geometries, scroll logic)
- **Responsive Optimization**: 2 hours (breakpoints, particle counts)
- **Testing & Debugging**: 2-3 hours (memory leaks, performance, cross-browser)
- **Code Quality & Cleanup**: 1 hour (linting, JSDoc, formatting)

**Total**: 18-24 hours (including UI/UX design phase)

---

## Acceptance Checklist

- [ ] Demo app routing implemented (3 routes)
- [ ] Hero space scene migrated and rendering correctly
- [ ] CTA scene migrated and rendering correctly
- [ ] Value propositions scene migrated and rendering correctly
- [ ] All `angular-three` imports replaced with `@hive-academy/angular-3d`
- [ ] `CUSTOM_ELEMENTS_SCHEMA` removed from all components
- [ ] Responsive particle counts implemented (desktop/tablet/mobile)
- [ ] All assets (GLTF, textures, SVGs) copied and loading correctly
- [ ] OrbitControls functional on hero scene
- [ ] Float animations working on all scenes
- [ ] Rotate animations working on GLTF models
- [ ] Build passing: `npx nx build angular-3d-demo`
- [ ] Lint passing: `npx nx lint angular-3d-demo`
- [ ] Performance verified: ≥30fps mobile, ≥60fps desktop
- [ ] Memory leak testing: 10 route changes without crash
- [ ] JSDoc comments added to all scene components
- [ ] README updated with scene descriptions
- [ ] Zero ESLint errors/warnings
