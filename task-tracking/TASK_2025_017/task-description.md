# Requirements Document - TASK_2025_017

## Introduction

The @hive-academy/angular-3d library requires completion of missing components discovered in the temp/angular-3d directory and fixes to existing postprocessing/GLTF integration. This task addresses architectural debt by migrating battle-tested implementations from the temporary development folder into the production library with proper architectural alignment to the new per-scene service pattern established in TASK_2025_015.

**Business Context**: The library is currently incomplete - it has critical gaps in particle effects, background elements, animation directives, and advanced optimization features that are already implemented in temp/ but not integrated into the library. This prevents the library from being production-ready and publishable.

**Value Proposition**: Completing this migration will:

- Enable rich particle text effects (smoke, glow, instanced) for 3D typography
- Provide background decoration components (cubes, spheres, volumetric nebula)
- Deliver advanced animation directives (glow, space-flight, performance optimization)
- Fix broken postprocessing and GLTF model loading
- Ensure all components work correctly with per-scene service architecture (not singletons)

---

## Requirements

### Requirement 1: Migrate Particle Text Components

**User Story**: As a developer using @hive-academy/angular-3d, I want particle-based text components so that I can create impressive 3D text effects with smoke, glow, and volumetric particle clouds.

#### Acceptance Criteria

1. WHEN I import SmokeParticleTextComponent THEN it SHALL render dense particle clouds forming text shapes

   - Feature: Dense particle clustering from canvas-sampled text pixels
   - Organic drift animation using multi-octave noise
   - Volumetric smoky appearance with additive blending
   - Configurable: text, fontSize, particleDensity, smokeColor, driftSpeed, opacity
   - Architecture: Use angular-three directives instead of raw Three.js, follow directive-first pattern

2. WHEN I import GlowParticleTextComponent THEN it SHALL create neon tube-like glowing text

   - Feature: Bright emissive particles with pulse/flow animation
   - Flow animation traveling along text path
   - Bloom-ready for UnrealBloomPass integration
   - Configurable: text, fontSize, glowColor, glowIntensity, pulseSpeed, flowSpeed
   - Architecture: Integrate with EffectComposerService for bloom support

3. WHEN I import InstancedParticleTextComponent THEN it SHALL render performant particle text using InstancedMesh

   - Feature: Billboard particles that always face camera
   - Individual particle lifecycle (grow → pulse → shrink)
   - Smoke texture alpha mapping for realistic clouds
   - Configurable: text, fontSize, particleColor, opacity, maxParticleScale, particlesPerPixel, blendMode
   - Architecture: Use THREE.InstancedMesh with proper lifecycle management

4. WHEN any particle text component changes inputs THEN it SHALL reactively update
   - Signal-based inputs for all configuration parameters
   - Effect-based reactivity for text/color/size changes
   - Proper cleanup of Three.js resources in ngOnDestroy

---

### Requirement 2: Migrate Background Decoration Components

**User Story**: As a developer, I want background decoration components so that I can fill 3D scenes with ambient visual elements without manual positioning calculations.

#### Acceptance Criteria

1. WHEN I use BackgroundCubesComponent THEN it SHALL generate distributed cubes with exclusion zones

   - Feature: Zone-based distribution (top, bottom, left, right areas)
   - Exclusion zone to avoid overlapping foreground content
   - Configurable: count, colorPalette, exclusionZone, sizeRange, depthRange
   - Individual cube rotation and float animation
   - Architecture: Compose multiple BackgroundCubeComponent instances

2. WHEN I use BackgroundCubeComponent THEN it SHALL render single cube primitive with Lambert material

   - Feature: Signal-based position, size, color, rotation
   - Float3D directive integration
   - Performance3D directive integration
   - Shadow casting/receiving support
   - Architecture: Convert from angular-three's ngt-mesh to @hive-academy/angular-3d's directive-first pattern (MeshDirective + hostDirectives)

3. WHEN I use FloatingSphereComponent THEN it SHALL render metallic sphere with physical material

   - Feature: MeshPhysicalMaterial with metalness/roughness/clearcoat
   - Optional glow effect via nested BackSide sphere
   - Float3D directive support
   - Configurable: radius, color, metalness, roughness, transmission, ior
   - Architecture: Use directive-first pattern, integrate Glow3D directive

4. WHEN I use NebulaVolumetricComponent THEN it SHALL create realistic shader-based nebula clouds
   - Feature: Multi-layer shader planes with 3D Perlin noise
   - Domain warping for organic smoke tendrils
   - Flow animation with configurable speed
   - Configurable: width, height, layers, opacity, primaryColor, secondaryColor, tertiaryColor, noiseScale
   - Architecture: Use THREE.ShaderMaterial with custom GLSL, integrate with scene graph

---

### Requirement 3: Migrate Animation & Enhancement Directives

**User Story**: As a developer, I want reusable animation directives so that I can enhance any 3D component with glow effects, space flight animations, performance optimization, and scroll coordination.

#### Acceptance Criteria

1. WHEN I apply glow3d directive THEN it SHALL add BackSide sphere glow effect

   - Feature: Automatic glow mesh creation/cleanup
   - Configurable color, intensity, scale, segments
   - Auto-adjust quality based on performance health
   - Works with any component exposing getMesh() method
   - Architecture: Follow existing Float3dDirective pattern, integrate with performance monitoring

2. WHEN I apply spaceFlight3d directive THEN it SHALL animate cinematic space flight

   - Feature: Multi-phase flight path with waypoints
   - Continuous rotation during flight
   - Smooth interpolation with easing functions
   - Optional - no errors if flightPath not provided
   - Configurable: flightPath, rotationsPerCycle, loop, autoStart, delay
   - Architecture: Use injectBeforeRender for frame-loop integration, follow directive composition pattern

3. WHEN I apply performance3d directive THEN it SHALL register object for automatic optimization

   - Feature: Integration with AdvancedPerformanceOptimizerService
   - Automatic frustum culling and LOD management
   - Lifecycle-aware cleanup on destroy
   - Respects performance health score for adaptive optimization
   - Architecture: Align with per-scene RenderLoopService (not singleton)

4. WHEN I apply scrollZoomCoordinator directive to OrbitControls THEN it SHALL bridge 3D zoom and page scroll
   - Feature: Smooth transition between camera zoom and page scrolling
   - Prevent scroll conflicts at zoom limits
   - Configurable thresholds and sensitivity
   - Delta time-aware for consistent behavior
   - Outputs: stateChange, scrollTransition, zoomEnabledChange
   - Architecture: Use NgZone.runOutsideAngular for performance, emit events via outputs

---

### Requirement 4: Migrate Advanced Performance Services

**User Story**: As a developer, I want advanced performance optimization services so that my 3D scenes maintain 60fps with automatic quality scaling based on device capabilities.

#### Acceptance Criteria

1. WHEN I initialize AdvancedPerformanceOptimizerService THEN it SHALL coordinate comprehensive optimizations

   - Feature: Enhanced LOD system with distance-based quality scaling
   - Frustum culling with automatic visibility optimization
   - Texture atlasing for reduced draw calls
   - Memory management with automatic cleanup and pooling
   - Real-time performance adaptation based on device capabilities
   - **CRITICAL**: Service MUST be component-scoped (NOT providedIn: 'root'), injected per-Scene3dComponent
   - Architecture: Integrate with Angular3DStateStore and PerformanceMonitorService using signals

2. WHEN performance health score drops below 80% THEN service SHALL apply adaptive optimizations

   - Feature: Computed performance health score (0-100)
   - Automatic LOD reduction for distant objects
   - Aggressive culling when performance degrades
   - Memory cleanup on regular intervals
   - Configurable optimization targets (targetFPS, maxFrameTime, qualityPreference)

3. WHEN I call getPerformanceRecommendations() THEN it SHALL provide actionable optimization suggestions
   - Feature: Severity-graded recommendations (low, medium, high)
   - Type classification (lod, culling, atlas, memory, quality)
   - Impact descriptions and action callbacks
   - Based on current metrics vs performance targets

---

### Requirement 5: Migrate Space Theme Store

**User Story**: As a developer, I want a centralized theme management service so that I can switch between space themes (colors, lighting, nebula styles) without passing props through component hierarchies.

#### Acceptance Criteria

1. WHEN I inject SpaceThemeStore THEN it SHALL provide reactive theme state

   - Feature: Signal-based current theme (computed from selected ID)
   - Available themes: classicSpace, purpleNebula, cyanCosmos, warmSunset, lightSky, greenAurora
   - Theme metadata (name, icon, description) for UI
   - Methods: setTheme(id), resetTheme(), getTheme(id)
   - **CRITICAL**: Service MUST be providedIn: 'root' (singleton for app-wide theme state)

2. WHEN I call setTheme(id) THEN ALL components using currentTheme() SHALL reactively update

   - Feature: Computed signal for currentTheme derived from selectedThemeId
   - Fallback to 'classicSpace' for unknown theme IDs
   - Console logging for theme changes
   - No manual subscriptions required - signals handle reactivity

3. WHEN I access availableThemes array THEN it SHALL provide UI-ready theme options
   - Feature: Array of ThemeOption objects with id, name, icon (emoji), description
   - Matches SPACE_THEMES type definitions
   - Suitable for dropdown/selector UI components

---

### Requirement 6: Fix Postprocessing Integration

**User Story**: As a developer, I want postprocessing effects to work correctly with the per-scene architecture so that bloom and other effects render properly without errors.

#### Acceptance Criteria

1. WHEN I use EffectComposerComponent THEN it SHALL initialize with per-scene services

   - Issue: Current implementation may not work with component-scoped SceneService
   - Fix: Verify effect() properly accesses scene(), camera(), renderer() signals
   - Ensure enabled() signal correctly enables/disables composer
   - Architecture: Component must inject SceneService (per-scene), not assume singleton

2. WHEN I use BloomEffectComponent THEN it SHALL create UnrealBloomPass with correct renderer size

   - Issue: Pass may not update when renderer size changes
   - Fix: React to renderer size changes via effect
   - Ensure threshold, strength, radius inputs update pass properties
   - Proper cleanup: removePass and dispose in ngOnDestroy
   - Architecture: Integrate with per-scene EffectComposerService

3. WHEN multiple scenes exist with separate composers THEN each SHALL render independently
   - Issue: Singleton EffectComposerService would break multiple scenes
   - Fix: **CRITICAL** - EffectComposerService MUST be component-scoped (provided by Scene3dComponent)
   - Verify each scene has its own composer instance
   - Test: Multiple scenes with different bloom settings should not conflict

---

### Requirement 7: Fix GLTF Model Loading

**User Story**: As a developer, I want GLTF model loading to work reliably with the per-scene architecture so that I can display 3D models without errors or rendering issues.

#### Acceptance Criteria

1. WHEN I use GltfModelComponent with modelPath THEN it SHALL load and display the model

   - Issue: GLTF model was commented out during TASK_2025_015 debugging
   - Fix: Verify effect-based loading works with GltfLoaderService
   - Ensure model is added to correct parent via NG_3D_PARENT token
   - Proper transform application (position, rotation, scale)
   - Material overrides (colorOverride, metalness, roughness) apply correctly

2. WHEN modelPath changes THEN component SHALL unload old model and load new one

   - Feature: Effect cleanup removes old model from parent
   - New model loads and adds to parent
   - No memory leaks from undisposed models
   - Signal-based data() from GltfLoaderService triggers update

3. WHEN I use Draco compression THEN useDraco flag SHALL enable DracoLoader
   - Feature: GltfLoaderService supports { useDraco: true } option
   - Draco decoder path configured correctly
   - Compressed models load successfully
   - Fallback to non-Draco if decoder fails

---

## Non-Functional Requirements

### Performance Requirements

- **Frame Rate**: Maintain 60fps with 100+ particle text characters on mid-range devices (tested: RTX 3060 equivalent)
- **Load Time**: GLTF models < 5MB load within 2 seconds on 50Mbps connection
- **Memory Usage**: Particle systems < 200MB total memory (all text components combined)
- **Instancing**: InstancedParticleTextComponent handles 10,000+ particles at 60fps
- **Culling**: Frustum culling reduces render cost by 50%+ for off-screen objects

### Code Quality Requirements

- **TypeScript Strict Mode**: All code passes strict type checking with no 'any' (enforced by ESLint)
- **Signal-Based Reactivity**: ALL inputs use signal-based input<T>() and input.required<T>()
- **Directive-First Pattern**: Mesh-based primitives use hostDirectives (MeshDirective, TransformDirective, MaterialDirective)
- **Resource Cleanup**: ALL Three.js objects disposed in DestroyRef.onDestroy() or ngOnDestroy()
- **No Singletons for Scene State**: SceneGraphStore, RenderLoopService, EffectComposerService MUST be component-scoped
- **Error Handling**: Graceful fallbacks for missing resources (models, textures), console warnings only
- **Naming Conventions**: All components use 'a3d-' selector prefix, services use descriptive names

### Architectural Constraints

- **Per-Scene Services**: Components must work with component-scoped SceneGraphStore and RenderLoopService (NOT providedIn: 'root')
- **NG_3D_PARENT Token**: All primitives use NG_3D_PARENT injection token for parent-child relationships
- **No angular-three Dependencies**: Avoid dependencies on angular-three library - use @hive-academy/angular-3d patterns instead
  - Exception: InstancedParticleTextComponent uses extend() and injectBeforeRender() from angular-three (acceptable for advanced features)
- **Three.js Stdlib**: Use three-stdlib for utilities (UnrealBloomPass, OrbitControls, etc.)
- **Standalone Components**: All components are standalone (no NgModules)
- **ChangeDetectionStrategy.OnPush**: Required for all components

### Testing Requirements

- **Unit Tests**: Each component/directive has .spec.ts with basic instantiation test
- **Integration Tests**: GLTF loading tested with actual .glb file (< 1MB test asset)
- **Visual Regression**: Demo app showcases all components in working state
- **Performance Tests**: Particle text components tested with 1000+ characters
- **Memory Leak Tests**: Verify cleanup via Chrome DevTools heap snapshots

### Documentation Requirements

- **JSDoc Comments**: All public components/services/directives have comprehensive JSDoc
- **Usage Examples**: @example blocks in JSDoc showing basic and advanced usage
- **README Updates**: libs/angular-3d/README.md updated with new components
- **Public API Exports**: All new components exported in libs/angular-3d/src/index.ts
- **Migration Guide**: Document breaking changes if any (unlikely - additive changes)

---

## Component Priority Matrix

### Priority 1: Critical Architecture Fixes (P0)

**Rationale**: These block library functionality and must be fixed before feature additions.

| Component                             | Priority | Blocker? | Complexity | Estimated Effort |
| ------------------------------------- | -------- | -------- | ---------- | ---------------- |
| Fix EffectComposerService (per-scene) | P0       | Yes      | Medium     | 2 hours          |
| Fix BloomEffectComponent              | P0       | Yes      | Low        | 1 hour           |
| Fix GltfModelComponent loading        | P0       | Yes      | Medium     | 2 hours          |

**Acceptance**: All postprocessing and GLTF loading work without errors in demo app.

---

### Priority 2: High-Impact Visual Components (P1)

**Rationale**: Most requested features, high visual impact, enable impressive demos.

| Component                      | Priority | Dependencies     | Complexity | Estimated Effort |
| ------------------------------ | -------- | ---------------- | ---------- | ---------------- |
| InstancedParticleTextComponent | P1       | None             | High       | 6 hours          |
| SmokeParticleTextComponent     | P1       | None             | High       | 6 hours          |
| GlowParticleTextComponent      | P1       | BloomEffect (P0) | High       | 6 hours          |
| NebulaVolumetricComponent      | P1       | None             | High       | 4 hours          |
| FloatingSphereComponent        | P1       | Glow3D (P2)      | Medium     | 3 hours          |

**Acceptance**: All particle text components render correctly, nebula shows realistic smoke, sphere has optional glow.

---

### Priority 3: Background & Enhancement Features (P2)

**Rationale**: Nice-to-have enhancements, improve scene aesthetics but not critical.

| Component                | Priority | Dependencies        | Complexity | Estimated Effort |
| ------------------------ | -------- | ------------------- | ---------- | ---------------- |
| BackgroundCubesComponent | P2       | BackgroundCube (P2) | Low        | 2 hours          |
| BackgroundCubeComponent  | P2       | None                | Medium     | 3 hours          |
| Glow3dDirective          | P2       | None                | Medium     | 3 hours          |
| SpaceFlight3dDirective   | P2       | None                | Medium     | 4 hours          |

**Acceptance**: Background cubes distribute correctly with exclusion zones, glow directive adds halo effect, space flight animates smoothly.

---

### Priority 4: Advanced Optimization (P3)

**Rationale**: Performance enhancements, important for production but not blocking MVP.

| Component                           | Priority | Dependencies           | Complexity | Estimated Effort |
| ----------------------------------- | -------- | ---------------------- | ---------- | ---------------- |
| AdvancedPerformanceOptimizerService | P3       | Performance3D (P3)     | High       | 8 hours          |
| Performance3dDirective              | P3       | AdvancedOptimizer (P3) | Medium     | 3 hours          |
| ScrollZoomCoordinatorDirective      | P3       | None                   | Medium     | 4 hours          |
| SpaceThemeStore                     | P3       | None                   | Low        | 2 hours          |

**Acceptance**: Performance optimizer maintains 60fps under load, scroll zoom coordinates smoothly, theme store switches themes reactively.

---

## Dependency Graph

```
Critical Path (Must Complete First):
├── Fix EffectComposerService (per-scene) ← BLOCKS BloomEffect
├── Fix BloomEffectComponent ← BLOCKS GlowParticleText
└── Fix GltfModelComponent ← BLOCKS demo app scenes

Parallel Track 1 (Particle Text):
├── SmokeParticleTextComponent (no deps)
├── GlowParticleTextComponent (needs BloomEffect)
└── InstancedParticleTextComponent (no deps)

Parallel Track 2 (Background):
├── FloatingSphereComponent (needs Glow3D)
├── Glow3dDirective (no deps)
├── BackgroundCubeComponent (no deps)
└── BackgroundCubesComponent (needs BackgroundCube)

Parallel Track 3 (Advanced):
├── NebulaVolumetricComponent (no deps)
├── SpaceFlight3dDirective (no deps)
├── AdvancedPerformanceOptimizerService (no deps)
├── Performance3dDirective (needs AdvancedOptimizer)
├── ScrollZoomCoordinatorDirective (no deps)
└── SpaceThemeStore (no deps)
```

---

## Architecture Alignment Checklist

**CRITICAL**: All components MUST comply with TASK_2025_015 architecture changes.

- [ ] **Per-Scene Services**: Components inject SceneGraphStore, RenderLoopService from Scene3dComponent (NOT singleton)
- [ ] **RenderLoopService Integration**: Use registerUpdateCallback() for animations, cleanup callback in DestroyRef.onDestroy()
- [ ] **NG_3D_PARENT Token**: All primitives inject NG_3D_PARENT for parent.add(object)
- [ ] **Signal-Based Inputs**: Use input<T>() and input.required<T>(), NO @Input() decorators
- [ ] **Signal-Based Queries**: Use viewChild(), contentChild(), NO @ViewChild() decorators
- [ ] **Effect-Based Reactivity**: Use effect() for side effects, NOT ngOnChanges()
- [ ] **DestroyRef Cleanup**: Use DestroyRef.onDestroy() for cleanup, NOT ngOnDestroy() (except when implementing OnDestroy interface)
- [ ] **hostDirectives Pattern**: Mesh-based components use MeshDirective + GeometryDirective + MaterialDirective + TransformDirective
- [ ] **No Three.js Imports in Primitives**: Components delegate Three.js logic to directives (BoxComponent example)

**Testing Architecture Compliance**:

- Create second scene in demo app
- Verify both scenes render independently
- Verify meshes add to correct scene (not shared between scenes)
- Verify RenderLoopService runs separately per scene

---

## Risk Assessment

### Technical Risks

| Risk                                      | Probability | Impact   | Mitigation Strategy                                                                                                                                                                                 |
| ----------------------------------------- | ----------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **angular-three Dependency Issues**       | High        | High     | Replace angular-three patterns with @hive-academy/angular-3d patterns. Use Three.js directly for advanced features like InstancedMesh. Document exceptions where angular-three usage is acceptable. |
| **Postprocessing Breaks Multiple Scenes** | High        | Critical | Make EffectComposerService component-scoped (provided by Scene3dComponent). Test with 2+ scenes in demo app. Verify independent composer instances.                                                 |
| **Performance Degradation**               | Medium      | High     | Implement AdvancedPerformanceOptimizerService with adaptive quality scaling. Test on low-end devices (Intel UHD 620). Profile with Chrome DevTools.                                                 |
| **Memory Leaks in Particle Systems**      | Medium      | High     | Strict cleanup protocol: dispose() all geometries, materials, textures in ngOnDestroy(). Test with heap snapshots. Add automated memory leak tests.                                                 |
| **GLTF Loading Race Conditions**          | Medium      | Medium   | Use effect() with proper cleanup. Ensure GltfLoaderService data() signal triggers reactive updates. Add loading state signals.                                                                      |
| **Directive Composition Conflicts**       | Low         | Medium   | Follow established patterns from Float3dDirective. Avoid conflicting lifecycle hooks. Document directive compatibility matrix.                                                                      |

### Business Risks

| Risk                     | Probability | Impact | Mitigation Strategy                                                                                                                            |
| ------------------------ | ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Incomplete Migration** | Medium      | High   | Prioritize P0 and P1 items. Create phased delivery plan. P2/P3 can be delivered in subsequent releases.                                        |
| **Breaking Changes**     | Low         | Medium | All changes are additive (new components/directives). No breaking API changes. Document any subtle behavior changes in migration guide.        |
| **Documentation Gaps**   | Medium      | Medium | Require JSDoc for all public APIs. Update README with each component. Create comprehensive demo app showcasing all features.                   |
| **Testing Insufficient** | Medium      | High   | Require unit tests for all components. Integration tests for GLTF/postprocessing. Visual regression tests in demo app. Performance benchmarks. |

---

## Success Metrics

### Functional Metrics

- **Component Coverage**: 100% of temp/angular-3d components migrated (16 components/directives/services)
- **Test Coverage**: ≥80% code coverage for new components
- **Zero Regressions**: All existing tests pass, no broken features
- **Demo App**: All new components showcased in working state

### Performance Metrics

- **Frame Rate**: 60fps with 3 particle text components + nebula + 100 background cubes
- **Load Time**: Demo app loads in < 5 seconds on 3G connection
- **Bundle Size**: Library size increase < 100KB (minified + gzipped)
- **Memory Usage**: < 300MB total memory usage for full demo app

### Quality Metrics

- **TypeScript Errors**: 0 type errors in strict mode
- **Lint Errors**: 0 ESLint errors, 0 warnings
- **Build Errors**: npx nx build @hive-academy/angular-3d succeeds
- **No 'any' Types**: 0 explicit 'any' usages (enforced by ESLint)

### Business Metrics

- **Library Completeness**: @hive-academy/angular-3d ready for npm publish
- **Developer Experience**: < 5 minutes to create impressive particle text effect
- **Documentation Quality**: All public APIs have JSDoc + usage examples
- **Community Readiness**: README.md suitable for public GitHub repository

---

## Implementation Order Recommendation

**Phase 1: Fix Critical Blockers (P0)** - 5 hours

1. Fix EffectComposerService (make component-scoped)
2. Fix BloomEffectComponent (verify with per-scene composer)
3. Fix GltfModelComponent (verify loading with signals)
4. Test: Multiple scenes with independent postprocessing

**Phase 2: High-Impact Visuals (P1)** - 25 hours

1. InstancedParticleTextComponent (most performant, good starting point)
2. SmokeParticleTextComponent (similar to instanced, reuse patterns)
3. GlowParticleTextComponent (depends on BloomEffect from Phase 1)
4. NebulaVolumetricComponent (shader-based, independent)
5. FloatingSphereComponent (simple primitive, prepares for Phase 3)

**Phase 3: Background & Enhancements (P2)** - 12 hours

1. Glow3dDirective (needed for FloatingSphere)
2. BackgroundCubeComponent (convert to directive-first)
3. BackgroundCubesComponent (uses BackgroundCube)
4. SpaceFlight3dDirective (animation enhancement)

**Phase 4: Advanced Optimization (P3)** - 17 hours

1. SpaceThemeStore (simple, quick win)
2. AdvancedPerformanceOptimizerService (complex, needed for Performance3D)
3. Performance3dDirective (uses AdvancedOptimizer)
4. ScrollZoomCoordinatorDirective (independent, last priority)

**Total Estimated Effort**: 59 hours (~7.5 developer days)

---

## Acceptance Criteria Summary

**Definition of Done**:

- [ ] All P0 and P1 components migrated and working
- [ ] All components follow directive-first pattern
- [ ] All components work with per-scene services (tested with 2+ scenes)
- [ ] All Three.js resources properly disposed in cleanup
- [ ] All components have unit tests (basic instantiation + key features)
- [ ] Demo app showcases all components in working state
- [ ] README.md updated with new component documentation
- [ ] Public API exports added to index.ts
- [ ] npm run build succeeds with 0 errors/warnings
- [ ] npm run lint succeeds with 0 errors/warnings
- [ ] npm run typecheck succeeds with 0 type errors
- [ ] Performance benchmarks confirm 60fps targets met

**Stretch Goals (Optional)**:

- [ ] P2 and P3 components migrated
- [ ] Advanced performance optimizer fully functional
- [ ] Scroll zoom coordinator integrated in demo
- [ ] Space theme store with live theme switcher in demo
- [ ] Visual regression tests automated
- [ ] Performance monitoring dashboard in demo app
