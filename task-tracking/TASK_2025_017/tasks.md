# Development Tasks - TASK_2025_017

**Total Tasks**: 20 | **Batches**: 6 | **Status**: 6/6 complete

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

## Batch 5: P2 Animation Directives (4 hours) - ✅ COMPLETE

**Commit**: `07f4011` feat(angular-3d): add space flight animation directive

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

## Batch 6: P3 Advanced Performance & Scroll (15 hours) - ✅ COMPLETE

**Developer**: backend-developer
**Tasks**: 5 | **Dependencies**: Batch 1 (Scene3dComponent modification)

### Task 6.1: Create AdvancedPerformanceOptimizerService - 🔄 IMPLEMENTED

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

### Task 6.2: Modify Scene3dComponent to Provide AdvancedPerformanceOptimizerService - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\canvas\scene-3d.component.ts
**Dependencies**: Task 6.1

**Quality Requirements**:

- Add AdvancedPerformanceOptimizerService to providers array
- No breaking changes

**Implementation Details**:

- Update providers: `[SceneGraphStore, RenderLoopService, EffectComposerService, AdvancedPerformanceOptimizerService]`

---

### Task 6.3: Create Performance3dDirective - 🔄 IMPLEMENTED

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

### Task 6.4: Create ScrollZoomCoordinatorDirective - 🔄 IMPLEMENTED

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

### Task 6.5: Update Library Public API - Export Performance & Scroll - 🔄 IMPLEMENTED

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

## Batch 7: QA Review Fixes (18 hours) - ⏸️ PENDING

**Developer**: backend-developer
**Tasks**: 21 grouped into 4 priority sub-batches | **Dependencies**: Batch 1-6 complete

**QA Review Sources**:

- Code Style Review: D:\projects\angular-3d-workspace\task-tracking\TASK_2025_017\code-style-review.md
- Code Logic Review: D:\projects\angular-3d-workspace\task-tracking\TASK_2025_017\code-logic-review.md

---

### Sub-Batch 7.1: P0 BLOCKING Issues (2 hours) - 🔄 IMPLEMENTED

**Must fix before release - blocks core functionality**

#### Task 7.1.1: Create Missing SphereGeometryDirective - ✅ VERIFIED (Already Exists)

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\geometries\sphere-geometry.directive.ts
**Spec Reference**: code-style-review.md:137-152
**Pattern to Follow**: libs/angular-3d/src/lib/directives/geometries/box-geometry.directive.ts

**Issue**: FloatingSphereComponent imports SphereGeometryDirective but it doesn't exist. Component fails at runtime with dependency injection error.

**Quality Requirements**:

- Follow BoxGeometryDirective pattern exactly
- Signal input: args = input<[number, number, number]>([1, 32, 16]) // [radius, widthSegments, heightSegments]
- Provide GEOMETRY_SIGNAL token
- Proper cleanup in DestroyRef.onDestroy()

**Implementation Details**:

- Selector: [a3dSphereGeometry]
- Create THREE.SphereGeometry(radius, widthSegments, heightSegments)
- Effect-based reactivity for args changes
- Dispose old geometry before creating new

**Estimated Time**: 45 minutes

---

#### Task 7.1.2: Fix NebulaVolumetricComponent OnDestroy Interface Violation - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts
**Spec Reference**: code-style-review.md:154-168

**Issue**: Component declares `implements OnDestroy` but has no ngOnDestroy() method. Violates TypeScript interface contract.

**Quality Requirements**:

- Remove `implements OnDestroy` from component declaration (line 63)
- Keep existing DestroyRef.onDestroy() cleanup logic
- No other changes needed

**Implementation Details**:

- Change: `export class NebulaVolumetricComponent implements OnDestroy {`
- To: `export class NebulaVolumetricComponent {`

**Estimated Time**: 15 minutes

---

#### Task 7.1.3: Add OBJECT_ID Validation in Performance3dDirective - 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\performance-3d.directive.ts
**Spec Reference**: code-style-review.md:170-191, code-logic-review.md:295-323

**Issue**: Directive injects OBJECT_ID optionally, then silently fails with warning if missing. No runtime error, making debugging difficult.

**Quality Requirements**:

- Throw error in development mode if OBJECT_ID missing
- Warn and degrade gracefully in production
- Document requirement in JSDoc

**Implementation Details**:

```typescript
afterNextRender(() => {
  if (!this.objectId) {
    const message = '[Performance3dDirective] Requires OBJECT_ID token. Add to component providers: { provide: OBJECT_ID, useFactory: () => `id-${crypto.randomUUID()}` }';
    if (isDevMode()) {
      throw new Error(message);
    } else {
      console.error(message);
    }
    return;
  }
  // ... rest of logic
});
```

**Estimated Time**: 30 minutes

---

### Sub-Batch 7.2: P1 CRITICAL Logic Issues (6 hours) - ⏸️ PENDING

**High-impact failures that cause silent bugs or memory leaks**

#### Task 7.2.1: Fix InstancedParticleText Camera Access Race Condition - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\instanced-particle-text.component.ts
**Spec Reference**: code-logic-review.md:508-543

**Issue**: Camera accessed from sceneService.camera() may be null during initialization. Billboarding silently fails with no visual feedback.

**Quality Requirements**:

- Add billboardingActive signal to track state
- Log when billboarding enables/disables
- Provide user-visible indication of initialization state

**Implementation Details**:

```typescript
private billboardingActive = signal(false);

const cleanup = this.renderLoop.registerUpdateCallback(() => {
  const camera = this.sceneService.camera();
  if (camera) {
    if (!this.billboardingActive()) {
      this.billboardingActive.set(true);
      console.log('[InstancedParticleText] Billboarding enabled');
    }
    this.animateParticles(camera);
  } else if (this.billboardingActive()) {
    console.warn('[InstancedParticleText] Camera lost - billboarding disabled');
    this.billboardingActive.set(false);
  }
});
```

**Estimated Time**: 45 minutes

---

#### Task 7.2.2: Merge Material Directive Double-Effect Anti-Pattern - ⏸️ PENDING

**Files**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\lambert-material.directive.ts
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\physical-material.directive.ts
  **Spec Reference**: code-logic-review.md:547-600

**Issue**: Two separate effects update same material. Effect 1 creates material, Effect 2 updates properties. Runs 2x on every input change, potential race conditions with store.update().

**Quality Requirements**:

- Merge into single effect
- Material creation on first run, updates on subsequent runs
- Eliminate redundant material.needsUpdate calls

**Implementation Details**:

```typescript
effect(() => {
  const color = this.color();
  const emissive = this.emissive();
  const transparent = this.transparent();
  const opacity = this.opacity();

  if (!this.material) {
    // First run: create
    this.material = new THREE.MeshLambertMaterial({ color, emissive, transparent, opacity });
    this.materialSignal.set(this.material);
  } else {
    // Subsequent runs: update
    this.material.color = new THREE.Color(color);
    this.material.emissive = new THREE.Color(emissive);
    this.material.transparent = transparent;
    this.material.opacity = opacity;
    this.material.needsUpdate = true;
  }

  // Store update (every run if objectId exists)
  if (this.objectId) {
    this.store.update(this.objectId, undefined, { color, transparent, opacity });
  }
});
```

**Estimated Time**: 1.5 hours (apply to both directives)

---

#### Task 7.2.3: Fix NebulaVolumetric Render Loop Memory Leak - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts
**Spec Reference**: code-logic-review.md:602-645

**Issue**: renderLoopCleanup is undefined if enableFlow() is false at construction. If component destroyed, cleanup never runs. Memory leak if flow enabled late.

**Quality Requirements**:

- Always register cleanup function, even if flow disabled
- Conditionally execute animation based on enableFlow() signal
- Cleanup always called in DestroyRef.onDestroy()

**Implementation Details**:

```typescript
this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
  if (this.enableFlow()) {
    this.layerUniforms.forEach((uniforms) => {
      uniforms['uTime'].value += delta * this.flowSpeed();
    });
  }
});

this.destroyRef.onDestroy(() => {
  this.renderLoopCleanup(); // Always safe to call
  this.clearLayers();
});
```

**Estimated Time**: 30 minutes

---

#### Task 7.2.4: Implement Frustum Culling in AdvancedPerformanceOptimizer - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\services\advanced-performance-optimizer.service.ts
**Spec Reference**: code-logic-review.md:647-682

**Issue**: isInFrustum() always returns true. Frustum culling documented and exposed but completely non-functional.

**Quality Requirements**:

- Implement bounding sphere frustum intersection test
- Warn in development if culling not implemented
- Consider margin parameter for off-screen culling

**Implementation Details**:

```typescript
private isInFrustum(object: THREE.Object3D, frustum: THREE.Frustum, margin: number): boolean {
  if (!object.geometry?.boundingSphere) {
    object.geometry?.computeBoundingSphere();
  }

  if (!object.geometry?.boundingSphere) {
    // Fallback: assume visible if no bounding sphere
    return true;
  }

  const boundingSphere = new THREE.Sphere();
  boundingSphere.copy(object.geometry.boundingSphere).applyMatrix4(object.matrixWorld);

  // Expand sphere by margin for early visibility
  boundingSphere.radius += margin;

  return frustum.intersectsSphere(boundingSphere);
}
```

**Estimated Time**: 1.5 hours

---

#### Task 7.2.5: Fix ScrollZoomCoordinator Event Handler After Destroy - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\scroll-zoom-coordinator.directive.ts
**Spec Reference**: code-logic-review.md:684-725

**Issue**: Event handler may run after component destroyed. Memory leak, potential crashes accessing destroyed state.

**Quality Requirements**:

- Add destroyed flag
- Early exit from event handler if destroyed
- Set flag before removeEventListener in cleanup

**Implementation Details**:

```typescript
private destroyed = false;

this.destroyRef.onDestroy(() => {
  this.destroyed = true;
  window.removeEventListener('wheel', this.handleWheel);
});

private handleWheel = (event: WheelEvent): void => {
  if (this.destroyed) return; // Early exit if destroyed

  const camera = this.sceneService.camera();
  if (!camera) return;
  // ... rest of handler
};
```

**Estimated Time**: 30 minutes

---

### Sub-Batch 7.3: P2 SERIOUS Issues (7 hours) - ⏸️ PENDING

**Significant technical debt, code duplication, performance issues**

#### Task 7.3.1: Extract TextSamplingService to Eliminate Duplication - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\services\text-sampling.service.ts (NEW)
**Spec Reference**: code-style-review.md:193-205

**Issue**: ~450 lines of duplicated text sampling code across 3 particle text components (canvas operations, pixel sampling).

**Quality Requirements**:

- Create shared service for text sampling logic
- Canvas pooling/reuse strategy
- Update all 3 particle text components to use service
- No behavioral changes to existing components

**Implementation Details**:

```typescript
@Injectable({ providedIn: 'root' })
export class TextSamplingService {
  private canvasPool = new Map<string, HTMLCanvasElement>();

  sampleTextPositions(text: string, fontSize: number): [number, number][] {
    const canvas = this.getOrCreateCanvas(text, fontSize);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return [];

    // Clear and setup
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    // Sample pixels
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const positions: [number, number][] = [];
    // ... sampling logic
    return positions;
  }

  private getOrCreateCanvas(text: string, fontSize: number): HTMLCanvasElement {
    const key = `${text}-${fontSize}`;
    if (!this.canvasPool.has(key)) {
      const canvas = document.createElement('canvas');
      // ... setup canvas dimensions
      this.canvasPool.set(key, canvas);
    }
    return this.canvasPool.get(key)!;
  }
}
```

**Estimated Time**: 2.5 hours (create service + update 3 components)

---

#### Task 7.3.2: Remove Unused Inputs from FloatingSphereComponent - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\floating-sphere.component.ts
**Spec Reference**: code-style-review.md:227-241

**Issue**: Component has radius, widthSegments, heightSegments inputs but never uses them. Only args is forwarded to SphereGeometryDirective. Confusing API.

**Quality Requirements**:

- Remove individual unused inputs (radius, widthSegments, heightSegments)
- Keep only args input
- Update JSDoc to clarify args format: [radius, widthSegments, heightSegments]
- No breaking changes to existing usage (if args was already used)

**Implementation Details**:

```typescript
// REMOVE these inputs:
// public readonly radius = input<number>(1);
// public readonly widthSegments = input<number>(32);
// public readonly heightSegments = input<number>(16);

// KEEP only:
public readonly args = input<[number, number, number]>([1, 32, 16], {
  alias: 'args'
});

// ADD JSDoc:
/**
 * Sphere geometry parameters: [radius, widthSegments, heightSegments]
 * @default [1, 32, 16]
 */
```

**Estimated Time**: 30 minutes

---

#### Task 7.3.3: Make NebulaVolumetric enableFlow Reactive - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\nebula-volumetric.component.ts
**Spec Reference**: code-style-review.md:243-248

**Issue**: enableFlow() check is in constructor, not reactive. If input changes after initialization, animation doesn't start/stop.

**Quality Requirements**:

- Use effect to reactively manage render loop subscription
- Animation starts when enableFlow changes to true
- Animation stops when enableFlow changes to false
- No memory leaks

**Implementation Details**:

- Already addressed in Task 7.2.3 (render loop always registered, conditionally executes)
- This task is DUPLICATE - mark as covered by Task 7.2.3

**Estimated Time**: 0 minutes (covered by 7.2.3)

---

#### Task 7.3.4: Fix Glow3dDirective Scale Updates to Use mesh.scale - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\glow-3d.directive.ts
**Spec Reference**: code-style-review.md:250-255, code-logic-review.md:825-872

**Issue**: updateGlowScale() recreates entire geometry on every scale change. Massive GC pressure if scale animates. Should use mesh.scale instead.

**Quality Requirements**:

- Create geometry once with base size (no scale multiplier)
- Update mesh.scale reactively in effect
- No geometry recreation on scale changes
- Proper initial size calculation

**Implementation Details**:

```typescript
// Create geometry once with base size
private createGlowEffect(): void {
  // ... existing bounding sphere calculation
  const baseGlowRadius = baseRadius; // NO scale multiplier here
  this.glowGeometry = new THREE.SphereGeometry(baseGlowRadius, segments, segments);
  this.glowMesh = new THREE.Mesh(this.glowGeometry, this.glowMaterial);
  this.targetObject.add(this.glowMesh);
}

// Update scale reactively without recreating geometry
effect(() => {
  if (this.glowMesh) {
    const scale = this.glowScale();
    this.glowMesh.scale.setScalar(scale);
  }
});
```

**Estimated Time**: 1 hour

---

#### Task 7.3.5: Add Zone Distribution JSDoc to BackgroundCubesComponent - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\background-cubes.component.ts
**Spec Reference**: code-style-review.md:263-269

**Issue**: Zone distribution logic (lines 156-181) has minimal comments. No visual explanation of coordinate system. Future maintainers will struggle.

**Quality Requirements**:

- Add comprehensive JSDoc with ASCII diagram showing 4 zones
- Explain coordinate system and exclusion zone
- Document why 4 zones specifically
- Explain cube distribution algorithm

**Implementation Details**:

```typescript
/**
 * Generate cube configurations distributed across 4 zones.
 *
 * Zone Layout (Top View):
 *
 *     ┌─────────────────────────────┐
 *     │          TOP ZONE           │
 *     ├───────┬───────────┬─────────┤
 *     │       │           │         │
 *     │ LEFT  │ EXCLUSION │  RIGHT  │
 *     │ ZONE  │   ZONE    │  ZONE   │
 *     │       │ (content) │         │
 *     ├───────┴───────────┴─────────┤
 *     │        BOTTOM ZONE          │
 *     └─────────────────────────────┘
 *
 * Cubes are distributed evenly across 4 zones (top, bottom, left, right).
 * Exclusion zone prevents overlap with foreground content.
 * Each zone gets floor(count/4) cubes, with remainder distributed to first zones.
 *
 * @returns Array of cube configurations with random positions within zones
 */
private generateCubes(): CubeConfig[] {
  // ...
}
```

**Estimated Time**: 45 minutes

---

#### Task 7.3.6: Add Loading/Error State Signals to GltfModelComponent - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\gltf-model.component.ts
**Spec Reference**: code-logic-review.md:731-762

**Issue**: Model loading takes 2+ seconds but no loading state signal. User can't show loading spinner. Model appears broken until it pops in.

**Quality Requirements**:

- Add isLoading signal
- Add loadError signal
- Expose signals as public API for template binding
- Update on loading start, success, error

**Implementation Details**:

```typescript
public readonly isLoading = signal(false);
public readonly loadError = signal<string | null>(null);

effect((onCleanup) => {
  this.isLoading.set(true);
  this.loadError.set(null);

  const result = this.gltfLoader.load(path, { useDraco });
  const data = result.data();

  if (data) {
    this.isLoading.set(false);
    // ... existing logic
  }

  // Handle error state from loader
  if (result.error?.()) {
    this.isLoading.set(false);
    this.loadError.set(result.error());
  }
});
```

**Estimated Time**: 1 hour

---

#### Task 7.3.7: Add Division by Zero Guard to SpaceFlight3dDirective - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\space-flight-3d.directive.ts
**Spec Reference**: code-logic-review.md:873-900

**Issue**: getTotalDuration() returns 0 if flight path has zero-duration waypoints or empty path. Causes division by zero in rotation calculation, NaN in transform matrix.

**Quality Requirements**:

- Guard against zero/invalid duration
- Warn when using fallback duration
- Ensure rotation calculations always produce valid numbers

**Implementation Details**:

```typescript
private getTotalDuration(): number {
  const duration = this.flightPath().reduce((sum, wp) => sum + wp.duration, 0);
  if (duration <= 0) {
    console.warn('[SpaceFlight3d] Invalid total duration (zero or negative), using default 1s');
    return 1;
  }
  return duration;
}
```

**Estimated Time**: 30 minutes

---

#### Task 7.3.8: Add Zone Validation to BackgroundCubesComponent - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\background-cubes.component.ts
**Spec Reference**: code-logic-review.md:902-953

**Issue**: No validation if exclusionZone larger than viewportBounds. Zones have inverted ranges (min > max), cubes generate in wrong positions.

**Quality Requirements**:

- Validate exclusion zone against viewport bounds
- Clamp exclusion to max 90% of viewport
- Warn user if clamping applied
- Validate zone ranges after creation

**Implementation Details**:

```typescript
private generateCubes(): CubeConfig[] {
  const exclusion = this.exclusionZone();
  const bounds = this.viewportBounds();

  // Validate and clamp exclusion
  if (exclusion.x >= bounds.x || exclusion.y >= bounds.y) {
    console.warn('[BackgroundCubes] Exclusion zone too large, clamping to 90% of viewport');
  }

  const clampedExclusion = {
    x: Math.min(exclusion.x, bounds.x * 0.9),
    y: Math.min(exclusion.y, bounds.y * 0.9),
  };

  // ... use clampedExclusion for zone calculations

  // Validate zones after creation
  zones.forEach((zone, index) => {
    if (zone.x.min >= zone.x.max || zone.y.min >= zone.y.max) {
      console.error(`[BackgroundCubes] Zone ${index} has invalid range - check exclusion zone size`);
    }
  });

  // ...
}
```

**Estimated Time**: 1 hour

---

#### Task 7.3.9: Fix EffectComposerService Enable Before Init Race - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\postprocessing\effect-composer.service.ts
**Spec Reference**: code-logic-review.md:955-1001

**Issue**: BloomEffect may call enable() before Scene3d calls init(). updateRenderLoop() runs with this.composer === null, postprocessing silently fails.

**Quality Requirements**:

- Queue enable() calls that happen before init()
- Apply queued enable when init() completes
- Warn when enable requested before init

**Implementation Details**:

```typescript
private pendingEnable = false;

public enable(): void {
  if (this._isEnabled()) return;
  this._isEnabled.set(true);

  if (this.composer) {
    this.updateRenderLoop();
  } else {
    this.pendingEnable = true;
    console.warn('[EffectComposer] Enable requested before init, will activate after init');
  }
}

public init(renderer, scene, camera): void {
  // ... existing init

  if (this.pendingEnable) {
    this.pendingEnable = false;
    this.updateRenderLoop();
  }
}
```

**Estimated Time**: 45 minutes

---

### Sub-Batch 7.4: P3 MODERATE Issues (3 hours) - ⏸️ PENDING

**Lower-priority issues: validation, console logging, edge cases**

#### Task 7.4.1: Add Particle Count Limits to All Particle Text Components - ⏸️ PENDING

**Files**:

- instanced-particle-text.component.ts
- smoke-particle-text.component.ts
- glow-particle-text.component.ts
  **Spec Reference**: code-logic-review.md:1095-1120

**Issue**: No limits on particle count. User can set fontSize=200, particleDensity=100 and freeze browser with 50,000+ particles.

**Quality Requirements**:

- Add MAX_PARTICLES constant (10,000)
- Warn when particle count exceeds limit
- Suggest reducing fontSize or particleDensity
- Optionally truncate to max

**Implementation Details**:

```typescript
private readonly MAX_PARTICLES = 10000;

private updateParticles(): void {
  // ... existing particle generation

  if (this.particles.length > this.MAX_PARTICLES) {
    console.warn(
      `[InstancedParticleText] Generated ${this.particles.length} particles (max ${this.MAX_PARTICLES}). ` +
      `Consider reducing fontSize or particleDensity for better performance.`
    );

    // Optionally: Truncate to max
    this.particles = this.particles.slice(0, this.MAX_PARTICLES);
  }
}
```

**Estimated Time**: 45 minutes (apply to all 3 components)

---

#### Task 7.4.2: Add IOR Validation to PhysicalMaterialDirective - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\directives\materials\physical-material.directive.ts
**Spec Reference**: code-logic-review.md:1067-1091

**Issue**: User can set ior=0 or negative value. Physically impossible refraction, visual glitches.

**Quality Requirements**:

- Clamp IOR to valid range (>= 1)
- Warn when clamping
- Inform about common IOR values (glass=1.5, diamond=2.42)

**Implementation Details**:

```typescript
public readonly ior = input<number>(1.5, {
  transform: (value: number) => {
    if (value < 1) {
      console.warn(`[PhysicalMaterial] IOR must be >= 1, clamping from ${value} to 1`);
      return 1;
    }
    if (value > 3) {
      console.warn(`[PhysicalMaterial] IOR > 3 is unusual (diamond=2.42), using ${value}`);
    }
    return value;
  }
});
```

**Estimated Time**: 30 minutes

---

#### Task 7.4.3: Remove Console Logging in Production Code - ⏸️ PENDING

**Files**:

- advanced-performance-optimizer.service.ts (lines 156, 293, 299, 388)
- glow-3d.directive.ts (line 112)
- performance-3d.directive.ts (lines 79, 88)
  **Spec Reference**: code-style-review.md:295-301

**Issue**: Direct console.log/warn calls in production library code. Should use logging service with configurable levels or remove debug logs.

**Quality Requirements**:

- Wrap console calls with isDevMode() check
- OR remove debug logs entirely
- Keep error/warning logs for critical issues

**Implementation Details**:

```typescript
// Option 1: Conditional logging
if (isDevMode()) {
  console.log('[AdvancedPerformanceOptimizer] Applying optimization');
}

// Option 2: Remove debug logs
// console.log(...); // REMOVE

// Keep critical warnings:
console.error('[Performance3dDirective] OBJECT_ID required but not provided');
```

**Estimated Time**: 1 hour (review and clean up across files)

---

#### Task 7.4.4: Add Empty Text Handling to InstancedParticleTextComponent - ⏸️ PENDING

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-text\instanced-particle-text.component.ts
**Spec Reference**: code-logic-review.md:1036-1064

**Issue**: User sets text="" (empty string). InstancedMesh created with count=0, WebGL warnings, wasted memory.

**Quality Requirements**:

- Skip mesh creation for empty text
- Clean up existing mesh if present
- No WebGL errors or warnings

**Implementation Details**:

```typescript
private refreshText(text: string, fontSize: number): void {
  if (!text || text.trim().length === 0) {
    // Clean up existing mesh if present
    if (this.instancedMesh) {
      const parent = this.parent();
      if (parent) {
        parent.remove(this.instancedMesh);
      }
      this.instancedMesh.geometry.dispose();
      (this.instancedMesh.material as THREE.Material).dispose();
      this.instancedMesh = undefined;
    }
    return;
  }

  this.sampleTextCoordinates(text, fontSize);
  this.updateParticles();
  this.recreateInstancedMesh();
}
```

**Estimated Time**: 45 minutes

---

**Batch 7 Verification**:

- All files modified successfully
- Build passes: `npx nx build @hive-academy/angular-3d`
- Lint passes: `npx nx lint @hive-academy/angular-3d`
- Typecheck passes: `npx nx typecheck @hive-academy/angular-3d`
- No console errors in demo app
- Memory leaks fixed (verify with Chrome DevTools)
- Performance improvements measurable (frustum culling, glow scale)
- All edge cases handled gracefully

---

## Final Verification Checklist

After ALL batches complete (including Batch 7):

- [ ] Build: `npx nx build @hive-academy/angular-3d` succeeds with 0 errors/warnings
- [ ] Lint: `npx nx lint @hive-academy/angular-3d` succeeds with 0 errors/warnings
- [ ] Typecheck: `npx nx typecheck @hive-academy/angular-3d` succeeds with 0 type errors
- [ ] Demo app: All components showcased in working state
- [ ] Performance: 60fps with 3 particle text components + nebula + 100 background cubes
- [ ] Memory: No memory leaks (Chrome DevTools heap snapshots)
- [ ] Multi-scene: 2 scenes render independently with separate services
- [ ] Public API: All new components/directives/services exported in index.ts
- [ ] QA Issues: All blocking, critical, and serious issues from reviews addressed
- [ ] Edge Cases: Empty text, null camera, missing OBJECT_ID all handled gracefully
- [ ] Unit tests: Basic instantiation tests exist for all components (stretch goal)
