# Development Tasks - TASK_2025_017

**Total Tasks**: 20 | **Batches**: 6 | **Status**: 5/6 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- Component-scoped services pattern: Verified in libs/angular-3d/src/lib/store/scene-graph.store.ts (Injectable without providedIn)
- Directive-first pattern: Verified in libs/angular-3d/src/lib/primitives/box.component.ts
- NG_3D_PARENT token usage: Verified in libs/angular-3d/CLAUDE.md:171-181
- SphereGeometryDirective exists: Verified in libs/angular-3d/src/lib/directives/geometries/
- MeshDirective, TransformDirective exist: Verified

### Risks Identified

| Risk                                                                      | Severity | Mitigation                                                                 |
| ------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------- |
| PhysicalMaterialDirective does NOT exist (only StandardMaterialDirective) | MEDIUM   | Create PhysicalMaterialDirective in Batch 3, Task 3.2                      |
| LambertMaterialDirective does NOT exist                                   | MEDIUM   | Create LambertMaterialDirective in Batch 4, Task 4.1                       |
| angular-three dependency in particle text components                      | LOW      | Keep injectBeforeRender as acceptable exception, document in code comments |
| Multiple scenes with EffectComposerService may still have issues          | HIGH     | CRITICAL fix in Batch 1 - must verify with 2-scene test                    |

### Edge Cases to Handle

- [x] EffectComposerService MUST be component-scoped (not providedIn: 'root') - Handled in Batch 1, Task 1.1
- [x] GLTF model cleanup on path change (memory leaks) - Handled in Batch 1, Task 1.3
- [x] Particle systems MUST dispose all resources (geometry, material, texture) - Handled in all particle text tasks
- [x] Shader components MUST handle undefined uniforms gracefully - Handled in Batch 3, Task 3.4

---

## Batch 1: P0 Critical Architecture Fixes (5 hours) - ✅ COMPLETE

**Commit**: `4830299` fix(angular-3d): make effect composer service component-scoped

**Developer**: backend-developer
**Tasks**: 4 | **Dependencies**: None

### Task 1.1: Fix EffectComposerService - Component-Scoped - IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effect-composer.service.ts
**Spec Reference**: implementation-plan.md:181-211
**Pattern to Follow**: libs/angular-3d/src/lib/store/scene-graph.store.ts:54 (Injectable without providedIn)

**Quality Requirements**:

- Service MUST be component-scoped (NOT providedIn: 'root')
- Remove `providedIn: 'root'` from Injectable decorator
- Scene3dComponent MUST provide this service in providers array
- Verify with 2 scenes in demo app (each has independent composer)

**Validation Notes**:

- HIGH RISK: Multiple scenes with shared composer would break independent rendering
- EDGE CASE: Verify both scenes can have different bloom settings independently

**Implementation Details**:

- Imports: @Injectable from @angular/core
- Change: `@Injectable({ providedIn: 'root' })` → `@Injectable()`
- No other logic changes needed

---

### Task 1.2: Modify Scene3dComponent to Provide EffectComposerService - IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts
**Dependencies**: Task 1.1

**Quality Requirements**:

- Add EffectComposerService to Scene3dComponent providers array
- Verify service injection works in child components
- No breaking changes to existing Scene3dComponent API

**Implementation Details**:

- Add to providers: `[SceneGraphStore, RenderLoopService, EffectComposerService]`
- Import EffectComposerService from '../postprocessing/effect-composer.service'

---

### Task 1.3: Fix BloomEffectComponent - Renderer Size Reactivity - IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effects\bloom-effect.component.ts
**Spec Reference**: implementation-plan.md:213-247
**Dependencies**: Task 1.1, Task 1.2

**Quality Requirements**:

- React to renderer size changes via effect
- Update UnrealBloomPass resolution when renderer size changes
- Proper cleanup: removePass() and dispose() in DestroyRef.onDestroy()
- Works with component-scoped EffectComposerService

**Implementation Details**:

- Add effect to watch renderer signal: `const renderer = this.sceneService.renderer();`
- On change: `pass.resolution.set(size.x, size.y);`
- Cleanup in destroyRef.onDestroy: `this.composer.removePass(this.bloomPass); this.bloomPass.dispose();`

---

### Task 1.4: Verify GltfModelComponent - Per-Scene Integration - IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\gltf-model.component.ts
**Spec Reference**: implementation-plan.md:250-303
**Dependencies**: None

**Quality Requirements**:

- Proper model cleanup on path change (no memory leaks)
- Material overrides apply correctly (colorOverride, metalness, roughness)
- NG_3D_PARENT used for scene hierarchy (not manual scene access)
- Signal-based reactivity for modelPath input

**Validation Notes**:

- EDGE CASE: When modelPath changes, old model MUST be removed and disposed
- Memory leak risk if geometry/materials not disposed

**Implementation Details**:

- Effect pattern for loading: Clean up previous model, load new model
- Dispose previous model: geometry, materials, textures
- Use NG_3D_PARENT for adding/removing from scene graph

---

**Batch 1 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Test in demo app with 2 scenes side-by-side
- Verify each scene has independent EffectComposerService instance
- Verify GLTF models load without errors

---

## Batch 2: P1 Particle Text - Instanced & Smoke (12 hours) - ✅ COMPLETE

**Commit**: `3c997f4` feat(angular-3d): add instanced and smoke particle text components

**Developer**: backend-developer
**Tasks**: 3 | **Dependencies**: Batch 1

### Task 2.1: Create InstancedParticleTextComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\instanced-particle-text.component.ts
**Spec Reference**: implementation-plan.md:308-415
**Pattern to Follow**: temp/angular-3d/components/primitives/instanced-particle-text.component.ts

**Quality Requirements**:

- FUNCTIONAL:
  - Render 10,000+ particles at 60fps using THREE.InstancedMesh
  - Billboard rotation (particles face camera)
  - Smoke texture with fractal noise (createSmokeTexture method)
  - Particle lifecycle: grow → pulse → shrink
- ARCHITECTURAL:
  - Use NG_3D_PARENT for scene hierarchy (no manual scene access)
  - Signal-based inputs: text (required), fontSize, particleColor, opacity, maxParticleScale, particlesPerPixel
  - Effect-based reactivity for text changes (no ngOnChanges)
  - DestroyRef cleanup: dispose geometry, material, texture
  - ACCEPTABLE EXCEPTION: Use injectBeforeRender from angular-three for animation loop

**Validation Notes**:

- RISK: angular-three dependency acceptable for frame loop utility
- Document exception in code comment: "Using angular-three injectBeforeRender for performance"

**Implementation Details**:

- Imports: NG_3D_PARENT, injectBeforeRender (angular-three), THREE
- Create InstancedMesh with custom geometry and material
- Sample text pixels from canvas → generate particle positions
- Animation loop updates instance matrices for billboard effect

---

### Task 2.2: Create SmokeParticleTextComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\smoke-particle-text.component.ts
**Spec Reference**: implementation-plan.md:418-502
**Pattern to Follow**: temp/angular-3d/components/primitives/smoke-particle-text.component.ts

**Quality Requirements**:

- FUNCTIONAL:
  - Dense particle clustering (50+ particles per 100 pixels)
  - Organic drift using multi-octave noise (simplex noise algorithm)
  - Additive blending for volumetric smoke appearance
- ARCHITECTURAL:
  - Same as InstancedParticleTextComponent
  - Uses THREE.Points geometry (not InstancedMesh)
  - Signal inputs: text (required), fontSize, particleDensity, smokeColor, driftSpeed

**Implementation Details**:

- Similar to InstancedParticleText but uses Points system
- Multi-octave noise for organic drift animation
- PointsMaterial with additive blending
- Particle texture for soft smoke appearance

---

### Task 2.3: Update Library Public API - Export Particle Text Components - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d\src\index.ts
**Dependencies**: Task 2.1, Task 2.2

**Quality Requirements**:

- Export both new components from public API
- Follow existing export pattern in index.ts
- No breaking changes to existing exports

**Implementation Details**:

- Add exports: `export { InstancedParticleTextComponent } from './lib/primitives/particle-text/instanced-particle-text.component';`
- Add exports: `export { SmokeParticleTextComponent } from './lib/primitives/particle-text/smoke-particle-text.component';`

---

**Batch 2 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Test particle text with 1000+ characters in demo app
- Verify 60fps performance (Chrome DevTools Performance tab)
- Verify no memory leaks (Chrome DevTools Memory tab - heap snapshots)

---

## Batch 3: P1 Particle Text - Glow, Nebula, Sphere (13 hours) - ✅ COMPLETE

**Commit**: `db2e1f2` feat(angular-3d): add glow particle text, nebula, and floating sphere

**Developer**: backend-developer
**Tasks**: 5 | **Dependencies**: Batch 1 (BloomEffect)

### Task 3.1: Create GlowParticleTextComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\glow-particle-text.component.ts
**Spec Reference**: implementation-plan.md:505-567
**Pattern to Follow**: temp/angular-3d/components/primitives/glow-particle-text.component.ts
**Dependencies**: Batch 1 (BloomEffectComponent)

**Quality Requirements**:

- FUNCTIONAL:
  - Neon tube aesthetic (tight particle clustering, 70+ density)
  - Flow animation traveling along text (pathPosition-based pulse)
  - Bloom-ready (toneMapped: false, bright emissive colors)
- ARCHITECTURAL:
  - Same as SmokeParticleTextComponent + bloom integration
  - Signal inputs: text (required), glowColor, glowIntensity, pulseSpeed, flowSpeed

**Validation Notes**:

- DEPENDENCY: Requires BloomEffectComponent from Batch 1
- Edge case: Component works without bloom (just less impressive)

**Implementation Details**:

- Similar to SmokeParticleText but with emissive bright colors
- Global pulse + flow wave animation (sine waves)
- Material: toneMapped: false for bloom compatibility

---

### Task 3.2: Create PhysicalMaterialDirective - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\physical-material.directive.ts
**Spec Reference**: implementation-plan.md:707-765
**Pattern to Follow**: libs/angular-3d/src/lib/directives/materials/standard-material.directive.ts

**Quality Requirements**:

- Follow StandardMaterialDirective pattern exactly
- Support MeshPhysicalMaterial properties: color, metalness, roughness, clearcoat, transmission, ior
- Signal-based inputs for all material properties
- Proper material disposal in cleanup

**Validation Notes**:

- RISK MITIGATION: PhysicalMaterialDirective does NOT exist - we create it
- Needed for FloatingSphereComponent

**Implementation Details**:

- Directive selector: `[a3dPhysicalMaterial]`
- Create THREE.MeshPhysicalMaterial
- Inputs: color, metalness, roughness, clearcoat, clearcoatRoughness, transmission, ior
- Effect-based reactivity for property changes

---

### Task 3.3: Create FloatingSphereComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\floating-sphere.component.ts
**Spec Reference**: implementation-plan.md:705-765
**Dependencies**: Task 3.2 (PhysicalMaterialDirective)

**Quality Requirements**:

- FUNCTIONAL:
  - MeshPhysicalMaterial with metalness, roughness, clearcoat, transmission, ior
  - Optional glow effect (BackSide sphere) - will be enhanced by Glow3dDirective in Batch 4
  - Float3D directive integration
- ARCHITECTURAL:
  - Directive-first pattern (like BoxComponent)
  - NO angular-three templates
  - hostDirectives: MeshDirective, SphereGeometryDirective, TransformDirective, PhysicalMaterialDirective

**Implementation Details**:

- Use hostDirectives composition pattern
- Signal inputs: position, radius, color, metalness, roughness, clearcoat, transmission
- All inputs forwarded to directives
- Template: `<ng-content />`

---

### Task 3.4: Create NebulaVolumetricComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts
**Spec Reference**: implementation-plan.md:570-699
**Pattern to Follow**: temp/angular-3d/components/primitives/nebula-volumetric.component.ts

**Quality Requirements**:

- FUNCTIONAL:
  - Multi-layer shader planes with 3D Perlin noise
  - Domain warping for organic smoke tendrils
  - Ultra-soft edge falloff (no visible geometry boundaries)
  - Configurable: width, height, layers, opacity, primaryColor, secondaryColor, enableFlow
- ARCHITECTURAL:
  - Direct Three.js group management (no `<ngt-group>`)
  - Minimal angular-three usage (only NgtArgs if needed, injectBeforeRender)
  - Shader material uniforms reactive to signal inputs

**Validation Notes**:

- EDGE CASE: Shader uniforms MUST handle undefined gracefully
- Complex GLSL code - copy from temp/ version exactly

**Implementation Details**:

- Create THREE.Group programmatically
- Add to parent via NG_3D_PARENT
- ShaderMaterial with custom vertex/fragment shaders
- Uniforms for colors, time, noise parameters
- Animation loop updates uTime uniform if enableFlow is true

---

### Task 3.5: Update Library Public API - Export Glow, Sphere, Nebula - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d\src\index.ts
**Dependencies**: Task 3.1, Task 3.2, Task 3.3, Task 3.4

**Quality Requirements**:

- Export all new components and directives
- Follow existing export pattern

**Implementation Details**:

- Export GlowParticleTextComponent, FloatingSphereComponent, NebulaVolumetricComponent
- Export PhysicalMaterialDirective

---

**Batch 3 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Test glow particle text with BloomEffectComponent
- Test nebula volumetric shader rendering
- Verify floating sphere with physical material

---

## Batch 4: P2 Background Components & Glow Directive (8 hours) - ✅ COMPLETE

**Commit**: `eb27d12` feat(angular-3d): add background components and glow directive

**Developer**: backend-developer
**Tasks**: 5 | **Dependencies**: None (independent)

### Task 4.1: Create LambertMaterialDirective - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\lambert-material.directive.ts
**Spec Reference**: implementation-plan.md:770-825
**Pattern to Follow**: libs/angular-3d/src/lib/directives/materials/standard-material.directive.ts

**Quality Requirements**:

- Follow StandardMaterialDirective pattern
- Support MeshLambertMaterial properties: color, transparent, opacity, emissive
- Signal-based inputs
- Proper material disposal

**Validation Notes**:

- RISK MITIGATION: LambertMaterialDirective does NOT exist - we create it
- Needed for BackgroundCubeComponent

**Implementation Details**:

- Directive selector: `[a3dLambertMaterial]`
- Create THREE.MeshLambertMaterial
- Inputs: color, transparent, opacity, emissive, emissiveIntensity
- Effect-based reactivity

---

### Task 4.2: Create BackgroundCubeComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\background-cube.component.ts
**Spec Reference**: implementation-plan.md:770-825
**Dependencies**: Task 4.1 (LambertMaterialDirective)

**Quality Requirements**:

- FUNCTIONAL:
  - Simple cube with Lambert material (performance-optimized)
  - Shadow casting/receiving support
  - Integrates with Float3dDirective and Performance3dDirective (applied by consumer)
- ARCHITECTURAL:
  - Directive-first pattern (like BoxComponent)
  - NO angular-three templates
  - hostDirectives: MeshDirective, BoxGeometryDirective, TransformDirective, LambertMaterialDirective

**Implementation Details**:

- Use hostDirectives composition
- Signal inputs: position, size, color, transparent, opacity
- Template: `<ng-content />`

---

### Task 4.3: Create BackgroundCubesComponent - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\background-cubes.component.ts
**Spec Reference**: implementation-plan.md:828-892
**Dependencies**: Task 4.2 (BackgroundCubeComponent)

**Quality Requirements**:

- FUNCTIONAL:
  - Zone-based distribution (top, bottom, left, right areas)
  - Exclusion zone to avoid overlapping foreground content
  - Configurable: count, colorPalette, exclusionZone, sizeRange, depthRange
  - Individual cube rotation and float animation
- ARCHITECTURAL:
  - Pure Angular computed signals (no angular-three)
  - Uses BackgroundCubeComponent via @for template

**Implementation Details**:

- Computed signal: `cubes = computed(() => this.generateCubes())`
- generateCubes() method: Zone-based distribution logic
- Template: `@for (cube of cubes(); track $index) { <a3d-background-cube [position]="cube.position" ... /> }`

---

### Task 4.4: Create Glow3dDirective - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\glow-3d.directive.ts
**Spec Reference**: implementation-plan.md:895-991
**Pattern to Follow**: libs/angular-3d/src/lib/directives/float-3d.directive.ts

**Quality Requirements**:

- FUNCTIONAL:
  - Automatic glow mesh creation/cleanup (BackSide sphere technique)
  - Configurable: glowColor, glowIntensity, glowScale, glowSegments
  - Auto-adjust quality based on performance health (optional)
- ARCHITECTURAL:
  - Works with any component exposing getMesh() method
  - Signal-based reactivity for inputs
  - DestroyRef cleanup

**Implementation Details**:

- Directive selector: `[a3dGlow3d]`
- Get target mesh via component.getMesh() method
- Create BackSide sphere mesh as child of target
- Inputs: glowColor, glowIntensity, glowScale, glowSegments, autoAdjustQuality
- Effect-based color/intensity updates

---

### Task 4.5: Update Library Public API - Export Background & Glow - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d\src\index.ts
**Dependencies**: Task 4.1, Task 4.2, Task 4.3, Task 4.4

**Quality Requirements**:

- Export all new components and directives
- Follow existing export pattern

**Implementation Details**:

- Export BackgroundCubeComponent, BackgroundCubesComponent
- Export Glow3dDirective, LambertMaterialDirective

---

**Batch 4 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Test background cubes distribution with exclusion zone
- Test glow directive on FloatingSphereComponent

---

## Batch 5: P2 Animation Directives (4 hours) - IMPLEMENTED

**Developer**: backend-developer
**Tasks**: 2 | **Dependencies**: None

### Task 5.1: Create SpaceFlight3dDirective - IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\space-flight-3d.directive.ts
**Spec Reference**: implementation-plan.md:994-1075
**Pattern to Follow**: libs/angular-3d/src/lib/directives/float-3d.directive.ts

**Quality Requirements**:

- FUNCTIONAL:
  - Multi-phase flight path with waypoints (position + duration)
  - Smooth interpolation with easing functions (ease-in-out)
  - Continuous rotation during flight
  - Infinite loop with seamless restart
  - Optional - no errors if flightPath not provided
- ARCHITECTURAL:
  - Directive composition pattern (like Float3dDirective)
  - injectBeforeRender for frame loop
  - Signal inputs: flightPath, rotationsPerCycle, loop, autoStart, delay
  - Outputs: animationStarted, animationComplete, waypointReached

**Implementation Details**:

- Directive selector: `[a3dSpaceFlight3d]`
- Input: flightPath (array of SpaceFlightWaypoint: { position, duration })
- Animation state: currentWaypointIndex, isAnimating
- Interpolate between waypoints using easing
- Emit events at lifecycle points

---

### Task 5.2: Update Library Public API - Export SpaceFlight - IMPLEMENTED

**File**: D:\projects\angular-3d\src\index.ts
**Dependencies**: Task 5.1

**Quality Requirements**:

- Export SpaceFlight3dDirective
- Follow existing export pattern

**Implementation Details**:

- Export SpaceFlight3dDirective from public API

---

**Batch 5 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Test space flight directive with multi-waypoint path
- Verify smooth interpolation and continuous rotation

---

## Batch 6: P3 Advanced Performance & Scroll (15 hours) - PENDING

**Developer**: backend-developer
**Tasks**: 4 | **Dependencies**: Batch 1 (Scene3dComponent modification)

### Task 6.1: Create AdvancedPerformanceOptimizerService - PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\services\advanced-performance-optimizer.service.ts
**Spec Reference**: implementation-plan.md:1082-1171
**Pattern to Follow**: libs/angular-3d/src/lib/store/scene-graph.store.ts (component-scoped)

**Quality Requirements**:

- FUNCTIONAL:
  - Enhanced LOD system with distance-based quality scaling
  - Frustum culling with batch processing
  - Memory management with cleanup intervals
  - Real-time performance adaptation (adaptive scaling)
  - Performance health score (0-100) computed signal
- ARCHITECTURAL:
  - Component-scoped (NOT providedIn: 'root')
  - Provided by Scene3dComponent
  - Integrates with Angular3DStateStore and PerformanceMonitorService
  - Signal-based configuration and metrics

**Validation Notes**:

- CRITICAL: MUST be component-scoped for per-scene optimization
- HIGH COMPLEXITY: 8 hours estimated

**Implementation Details**:

- Injectable without providedIn
- Configuration signals: frustumCullingConfig, performanceTarget
- Computed signals: performanceHealthScore, shouldOptimize
- Methods: initialize(), optimize(), getPerformanceRecommendations()

---

### Task 6.2: Modify Scene3dComponent to Provide AdvancedPerformanceOptimizerService - PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts
**Dependencies**: Task 6.1

**Quality Requirements**:

- Add AdvancedPerformanceOptimizerService to providers array
- No breaking changes

**Implementation Details**:

- Update providers: `[SceneGraphStore, RenderLoopService, EffectComposerService, AdvancedPerformanceOptimizerService]`

---

### Task 6.3: Create Performance3dDirective - PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\performance-3d.directive.ts
**Spec Reference**: implementation-plan.md:1174-1233
**Dependencies**: Task 6.1 (AdvancedPerformanceOptimizerService)

**Quality Requirements**:

- FUNCTIONAL:
  - Register object with AdvancedPerformanceOptimizerService
  - Automatic frustum culling and LOD management
  - Lifecycle-aware cleanup on destroy
- ARCHITECTURAL:
  - Aligns with per-scene optimizer (not singleton)
  - Simple directive pattern

**Implementation Details**:

- Directive selector: `[a3dPerformance3d]`
- Inject AdvancedPerformanceOptimizerService
- ngAfterViewInit: Register object3D with optimizer
- Cleanup: Unregister in destroyRef.onDestroy

---

### Task 6.4: Create ScrollZoomCoordinatorDirective - PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\scroll-zoom-coordinator.directive.ts
**Spec Reference**: implementation-plan.md:1236-1300
**Pattern to Follow**: NgZone.runOutsideAngular for performance

**Quality Requirements**:

- FUNCTIONAL:
  - Smooth transition between camera zoom and page scrolling
  - Prevent scroll conflicts at zoom limits
  - Configurable: minZoom, maxZoom, scrollSensitivity, zoomThreshold
  - Delta time-aware for consistent behavior
- ARCHITECTURAL:
  - NgZone.runOutsideAngular for performance
  - Signal inputs: minZoom, maxZoom, scrollSensitivity, zoomThreshold
  - Outputs: stateChange, scrollTransition, zoomEnabledChange

**Implementation Details**:

- Directive selector: `[a3dScrollZoomCoordinator]`
- Listen to wheel events outside Angular zone
- Check OrbitControls zoom limits
- Transition between camera zoom and page scroll smoothly

---

### Task 6.5: Update Library Public API - Export Performance & Scroll - PENDING

**File**: D:\projects\angular-3d\src\index.ts
**Dependencies**: Task 6.1, Task 6.3, Task 6.4

**Quality Requirements**:

- Export all new services and directives
- Follow existing export pattern

**Implementation Details**:

- Export AdvancedPerformanceOptimizerService
- Export Performance3dDirective, ScrollZoomCoordinatorDirective

---

**Batch 6 Verification**:

- All files exist at paths
- Build passes: `npx nx build @hive-academy/angular-3d`
- Test performance optimizer with 100+ objects
- Verify adaptive quality scaling based on FPS
- Test scroll zoom coordinator with OrbitControls

---

## Final Verification Checklist

After ALL batches complete:

- [ ] Build: `npx nx build @hive-academy/angular-3d` succeeds with 0 errors/warnings
- [ ] Lint: `npx nx lint @hive-academy/angular-3d` succeeds with 0 errors/warnings
- [ ] Typecheck: `npx nx typecheck @hive-academy/angular-3d` succeeds with 0 type errors
- [ ] Demo app: All components showcased in working state
- [ ] Performance: 60fps with 3 particle text components + nebula + 100 background cubes
- [ ] Memory: No memory leaks (Chrome DevTools heap snapshots)
- [ ] Multi-scene: 2 scenes render independently with separate services
- [ ] Public API: All new components/directives/services exported in index.ts
- [ ] Unit tests: Basic instantiation tests exist for all components (stretch goal)
