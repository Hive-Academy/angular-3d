# Requirements Document - TASK_2025_026

## Award-Winning Three.js Enhancements for @hive-academy/angular-3d

---

## Introduction

This requirements document defines the implementation of five high-priority enhancements to transform the `@hive-academy/angular-3d` library from a "functional 3D toolkit" into an "award-winning experience platform." These enhancements address critical gaps identified through comprehensive research of 25+ industry sources and analysis of 40+ codebase files.

**Business Context**: Modern award-winning web experiences (Awwwards, FWA) leverage advanced WebGL techniques including GPU instancing, custom shaders, environment-based lighting, and sophisticated post-processing. The current library architecture is solid but lacks these differentiating capabilities.

**Value Proposition**: These enhancements will enable:

- 100x object scaling for particle-heavy scenes (InstancedMesh)
- Award-quality visual effects (custom shaders, DOF, SSAO)
- Photorealistic material appearance (HDRI environment lighting)
- 10x battery efficiency for static content (demand-based rendering)
- Production-ready post-processing pipeline (DOF, SSAO, color grading)

---

## Requirements

### Requirement 1: InstancedMeshComponent

**User Story:** As a developer using @hive-academy/angular-3d, I want an InstancedMesh component that renders thousands of similar objects with a single draw call, so that I can create particle-heavy scenes with 100x better performance than individual meshes.

#### Acceptance Criteria

1. WHEN a developer declares `<a3d-instanced-mesh [count]="1000" [geometry]="boxGeometry">` THEN the system SHALL render 1000 instances using a single draw call as verified by THREE.WebGLRenderer.info.render.calls.

2. WHEN a developer provides an `[instanceMatrix]` input with Float32Array of 16 \* count elements THEN the system SHALL apply per-instance 4x4 transformation matrices for position, rotation, and scale.

3. WHEN a developer provides an `[instanceColor]` input with Float32Array of 3 \* count elements THEN the system SHALL apply per-instance RGB colors to each mesh instance.

4. WHEN a developer calls `updateInstanceAt(index, matrix, color?)` method THEN the system SHALL update the specific instance transform/color and call `instanceMatrix.needsUpdate = true`.

5. WHEN a developer sets `[frustumCulled]="false"` THEN the system SHALL disable frustum culling for instances that span the entire scene (e.g., star fields).

6. WHEN the component is destroyed THEN the system SHALL dispose of the InstancedMesh geometry and material resources via DestroyRef.onDestroy().

7. WHEN a developer uses `[usage]="dynamic"` THEN the system SHALL set `THREE.DynamicDrawUsage` for instance attributes to optimize frequent updates.

#### Technical Specifications

```typescript
// Component API
@Component({ selector: 'a3d-instanced-mesh' })
export class InstancedMeshComponent {
  readonly count = input.required<number>();
  readonly instanceMatrix = input<Float32Array>();
  readonly instanceColor = input<Float32Array>();
  readonly frustumCulled = input<boolean>(true);
  readonly usage = input<'static' | 'dynamic'>('static');

  // Methods
  updateInstanceAt(index: number, matrix: THREE.Matrix4, color?: THREE.Color): void;
  setMatrixAt(index: number, matrix: THREE.Matrix4): void;
  setColorAt(index: number, color: THREE.Color): void;
}
```

#### Integration Points

- Must integrate with existing `NG_3D_PARENT` token for scene graph placement
- Must support child geometry directives (`a3dBoxGeometry`, `a3dSphereGeometry`, etc.)
- Must support child material directives (`a3dStandardMaterial`, `a3dPhysicalMaterial`, etc.)
- Must register with `RenderLoopService` for per-frame updates when dynamic

---

### Requirement 2: ShaderMaterialDirective

**User Story:** As a developer using @hive-academy/angular-3d, I want a ShaderMaterial directive that accepts custom GLSL vertex/fragment shaders with reactive uniform updates, so that I can create award-winning visual effects like water caustics, ray marching, and procedural textures.

#### Acceptance Criteria

1. WHEN a developer applies `[a3dShaderMaterial]` with `[vertexShader]` and `[fragmentShader]` inputs THEN the system SHALL create a THREE.ShaderMaterial with the provided GLSL code.

2. WHEN a developer provides `[uniforms]="{ time: 0, color: '#ff0000' }"` THEN the system SHALL create THREE.Uniform objects for each property and update them reactively via Angular signals.

3. WHEN a developer updates a uniform value (e.g., `time` signal changes) THEN the system SHALL update `material.uniforms[name].value` without recreating the material.

4. WHEN a developer sets `[transparent]="true"` THEN the system SHALL enable transparency on the ShaderMaterial.

5. WHEN a developer provides `[defines]="{ USE_FOG: '' }"` THEN the system SHALL pass defines to the ShaderMaterial for compile-time shader variants.

6. WHEN a developer uses `[wireframe]="true"` THEN the system SHALL render the geometry as wireframe.

7. WHEN the directive is destroyed THEN the system SHALL dispose of the ShaderMaterial and any custom textures passed as uniforms.

8. WHEN a developer passes a texture uniform via `[uniforms]="{ map: textureObject }"` THEN the system SHALL support THREE.Texture objects as uniform values.

#### Technical Specifications

```typescript
// Directive API
@Directive({ selector: '[a3dShaderMaterial]' })
export class ShaderMaterialDirective {
  readonly vertexShader = input.required<string>();
  readonly fragmentShader = input.required<string>();
  readonly uniforms = input<Record<string, unknown>>({});
  readonly defines = input<Record<string, string>>({});
  readonly transparent = input<boolean>(false);
  readonly wireframe = input<boolean>(false);
  readonly side = input<'front' | 'back' | 'double'>('front');
  readonly depthTest = input<boolean>(true);
  readonly depthWrite = input<boolean>(true);
  readonly blending = input<'normal' | 'additive' | 'subtractive' | 'multiply'>('normal');
}
```

#### Built-in Uniform Injections

The directive SHALL automatically inject common uniforms:

- `time: float` - Elapsed time from RenderLoopService
- `resolution: vec2` - Canvas resolution from SceneService
- `mouse: vec2` - Normalized mouse position (if mouse tracking enabled)

---

### Requirement 3: EnvironmentComponent

**User Story:** As a developer using @hive-academy/angular-3d, I want an Environment component that loads HDRI/EXR environment maps for image-based lighting, so that my PBR materials have realistic reflections and ambient lighting without manual light setup.

#### Acceptance Criteria

1. WHEN a developer declares `<a3d-environment [hdri]="'/assets/studio.hdr'">` THEN the system SHALL load the HDR file using THREE.RGBELoader and apply it as scene.environment for PBR materials.

2. WHEN a developer sets `[background]="true"` THEN the system SHALL also set the environment map as scene.background for visible skybox.

3. WHEN a developer sets `[blur]="0.5"` (0-1 range) THEN the system SHALL apply blur to the background while keeping reflections sharp.

4. WHEN a developer provides `[preset]="'sunset'"` THEN the system SHALL load a built-in environment preset from a curated collection.

5. WHEN the HDRI is loading THEN the system SHALL emit `(loading)` event with progress percentage.

6. WHEN the HDRI finishes loading THEN the system SHALL emit `(loaded)` event with the loaded texture reference.

7. WHEN loading fails THEN the system SHALL emit `(error)` event with error details and NOT crash the scene.

8. WHEN a developer sets `[intensity]="2.0"` THEN the system SHALL apply the intensity multiplier to the environment lighting.

9. WHEN the component is destroyed THEN the system SHALL dispose of the loaded texture and remove it from scene.environment.

#### Technical Specifications

```typescript
// Component API
@Component({ selector: 'a3d-environment' })
export class EnvironmentComponent {
  readonly hdri = input<string>(); // Path to HDR/EXR file
  readonly preset = input<'sunset' | 'dawn' | 'night' | 'warehouse' | 'forest' | 'apartment' | 'studio' | 'city' | 'park' | 'lobby'>();
  readonly background = input<boolean>(false);
  readonly blur = input<number>(0); // 0-1
  readonly intensity = input<number>(1);
  readonly encoding = input<'linear' | 'srgb'>('linear');

  // Events
  readonly loading = output<number>(); // Progress 0-100
  readonly loaded = output<THREE.Texture>();
  readonly error = output<Error>();
}
```

#### Preset Environment Sources

Built-in presets SHALL use the polyhaven.com CDN or bundled low-resolution fallbacks:

- `sunset` - Warm outdoor sunset
- `dawn` - Cool morning light
- `night` - Dark with point lights
- `warehouse` - Industrial neutral
- `forest` - Green natural
- `apartment` - Soft interior
- `studio` - Photography studio
- `city` - Urban environment
- `park` - Daytime outdoor
- `lobby` - Modern interior

---

### Requirement 4: Demand-Based Rendering Mode

**User Story:** As a developer using @hive-academy/angular-3d, I want a demand-based rendering mode that only renders when the scene changes, so that static 3D content does not drain battery on mobile devices.

#### Acceptance Criteria

1. WHEN a developer sets `[frameloop]="'demand'"` on Scene3dComponent THEN the system SHALL stop continuous rendering and only render when explicitly invalidated.

2. WHEN a developer calls `sceneService.invalidate()` THEN the system SHALL trigger a single render frame in demand mode.

3. WHEN any signal-based input changes (e.g., position, rotation, color) THEN the system SHALL automatically call `invalidate()` to trigger a render.

4. WHEN OrbitControls detects user interaction (pan, zoom, rotate) THEN the system SHALL automatically invalidate and continue rendering until interaction ends.

5. WHEN an animation callback is registered via `registerUpdateCallback()` THEN the system SHALL switch to continuous rendering for that frame and return to demand mode when no animations are active.

6. WHEN `[frameloop]="'always'"` (default) THEN the system SHALL render continuously as before (backward compatible).

7. WHEN demand mode is active and no invalidation occurs for 100ms THEN the system SHALL reduce power consumption by stopping the RAF loop entirely.

8. WHEN demand mode is active THEN the FPS signal SHALL report the actual render frequency (not 60fps when idle).

#### Technical Specifications

```typescript
// RenderLoopService additions
export class RenderLoopService {
  // Existing API...

  // New API
  setFrameloop(mode: 'always' | 'demand'): void;
  invalidate(): void;

  // Internal state
  private readonly _frameloop = signal<'always' | 'demand'>('always');
  private readonly _needsRender = signal<boolean>(true);
  private invalidateTimeout: number | null = null;
}

// Scene3dComponent additions
export class Scene3dComponent {
  readonly frameloop = input<'always' | 'demand'>('always');
}

// SceneService additions
export class SceneService {
  invalidate(): void; // Proxy to RenderLoopService
}
```

#### Integration Requirements

- OrbitControlsComponent SHALL automatically invalidate on 'change' event
- All animation directives (Float3d, Rotate3d) SHALL keep continuous mode while active
- EffectComposerService SHALL respect frameloop mode
- Post-processing passes SHALL trigger invalidation when properties change

---

### Requirement 5: Post-Processing Effects Expansion

**User Story:** As a developer using @hive-academy/angular-3d, I want additional post-processing effects (Depth of Field, SSAO, Color Grading), so that I can achieve cinematic visual quality matching award-winning web experiences.

#### Acceptance Criteria - Depth of Field (DOF)

1. WHEN a developer declares `<a3d-dof-effect [focus]="10" [aperture]="0.025" [maxblur]="0.01">` THEN the system SHALL apply BokehPass with the specified focus distance and blur parameters.

2. WHEN a developer updates the `[focus]` input THEN the system SHALL reactively update the DOF focus distance without recreating the pass.

3. WHEN the `[focus]` input is not provided THEN the system SHALL default to the camera's current lookAt distance.

4. WHEN using DOF with demand-based rendering THEN the system SHALL invalidate on focus/aperture changes.

#### Acceptance Criteria - SSAO (Screen Space Ambient Occlusion)

1. WHEN a developer declares `<a3d-ssao-effect [radius]="4" [intensity]="1">` THEN the system SHALL apply SSAOPass with configurable radius and intensity.

2. WHEN a developer sets `[kernelRadius]="16"` THEN the system SHALL use the specified kernel sample count (default 8).

3. WHEN a developer sets `[minDistance]="0.001" [maxDistance]="0.1"` THEN the system SHALL configure the AO distance thresholds.

4. WHEN the scene contains transparent objects THEN the system SHALL handle SSAO correctly without artifacts on transparent surfaces.

#### Acceptance Criteria - Color Grading

1. WHEN a developer declares `<a3d-color-grading-effect [saturation]="1.2" [contrast]="1.1" [brightness]="1.0">` THEN the system SHALL apply a color grading pass with the specified parameters.

2. WHEN a developer provides `[lut]="'/assets/film-look.png'"` THEN the system SHALL load and apply the LUT (Look-Up Table) for cinematic color correction.

3. WHEN a developer sets `[gamma]="2.2"` THEN the system SHALL apply gamma correction to the final output.

4. WHEN a developer sets `[exposure]="1.5"` THEN the system SHALL apply exposure adjustment.

5. WHEN a developer uses `[vignette]="0.3"` THEN the system SHALL apply vignette darkening at screen edges.

#### Technical Specifications

```typescript
// DOF Component
@Component({ selector: 'a3d-dof-effect' })
export class DepthOfFieldEffectComponent {
  readonly focus = input<number>(10);
  readonly aperture = input<number>(0.025);
  readonly maxblur = input<number>(0.01);
}

// SSAO Component
@Component({ selector: 'a3d-ssao-effect' })
export class SsaoEffectComponent {
  readonly radius = input<number>(4);
  readonly intensity = input<number>(1);
  readonly kernelRadius = input<number>(8);
  readonly minDistance = input<number>(0.001);
  readonly maxDistance = input<number>(0.1);
}

// Color Grading Component
@Component({ selector: 'a3d-color-grading-effect' })
export class ColorGradingEffectComponent {
  readonly saturation = input<number>(1);
  readonly contrast = input<number>(1);
  readonly brightness = input<number>(1);
  readonly gamma = input<number>(2.2);
  readonly exposure = input<number>(1);
  readonly vignette = input<number>(0);
  readonly lut = input<string>(); // Path to LUT texture
}
```

#### Effect Composition Order

Post-processing effects SHALL be applied in this order (configurable via `[order]` input):

1. RenderPass (scene)
2. SSAOPass (ambient occlusion)
3. BokehPass (depth of field)
4. UnrealBloomPass (existing bloom)
5. ColorGradingPass (final color correction)

---

## Non-Functional Requirements

### Performance Requirements

| Metric                   | Target                                                     | Measurement                           |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------- |
| InstancedMesh draw calls | 1 draw call per InstancedMesh regardless of instance count | THREE.WebGLRenderer.info.render.calls |
| InstancedMesh capacity   | 100,000+ instances at 60fps on mid-range GPU               | FPS monitoring with 100k instances    |
| Demand-mode power        | 0% GPU usage when idle (no animations)                     | GPU profiler                          |
| HDRI load time           | <2 seconds for 2K HDRI on 10Mbps connection                | Load event timing                     |
| Post-processing overhead | <10ms per frame for DOF+SSAO+ColorGrading combined         | Frame time profiler                   |
| Memory footprint         | <50MB additional for all new features                      | Chrome DevTools memory                |

### Compatibility Requirements

| Platform   | Requirement                                                  |
| ---------- | ------------------------------------------------------------ |
| WebGL      | WebGL 2.0 required for SSAO, graceful fallback for WebGL 1.0 |
| Browsers   | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+                |
| Mobile     | iOS Safari 15+, Chrome Android 90+                           |
| Angular    | Angular 19+ (standalone components, signals)                 |
| Three.js   | Three.js 0.160+ (current: 0.182)                             |
| TypeScript | Strict mode, no explicit `any` types                         |

### API Consistency Requirements

1. ALL new components SHALL use `ChangeDetectionStrategy.OnPush`
2. ALL inputs SHALL use signal-based `input()` / `input.required()`
3. ALL components SHALL use `inject()` for DI (no constructor injection)
4. ALL browser-only code SHALL use `afterNextRender()` for initialization
5. ALL components SHALL use `DestroyRef.onDestroy()` for cleanup
6. ALL component selectors SHALL use `a3d-` prefix
7. ALL directive selectors SHALL use `a3d` attribute prefix

### Documentation Requirements

1. Each component SHALL include JSDoc with `@example` usage
2. Each component SHALL have a corresponding demo section in angular-3d-demo
3. API breaking changes SHALL be documented in CHANGELOG.md
4. Performance characteristics SHALL be documented in component JSDoc

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder           | Impact | Needs                                       | Success Criteria                     |
| --------------------- | ------ | ------------------------------------------- | ------------------------------------ |
| Angular 3D Developers | High   | Easy-to-use declarative API for advanced 3D | 5-minute integration for any feature |
| End Users             | High   | Smooth, battery-efficient 3D experiences    | 60fps on mid-range devices           |
| Library Maintainers   | Medium | Consistent patterns, testable code          | 80%+ test coverage for new features  |

### Secondary Stakeholders

| Stakeholder           | Impact | Needs                                       |
| --------------------- | ------ | ------------------------------------------- |
| Performance Engineers | Medium | Profiling hooks, FPS monitoring             |
| Accessibility Team    | Low    | Reduced motion support, keyboard navigation |
| Mobile Developers     | High   | Battery efficiency, touch support           |

---

## Risk Assessment

### Technical Risks

| Risk                                          | Probability | Impact | Mitigation                            | Contingency                          |
| --------------------------------------------- | ----------- | ------ | ------------------------------------- | ------------------------------------ |
| SSAO WebGL 1.0 incompatibility                | Medium      | Medium | Feature detection + graceful fallback | Disable SSAO on WebGL 1              |
| HDRI loading performance on slow networks     | Medium      | Low    | Progressive loading + low-res presets | Bundled fallback presets             |
| InstancedMesh geometry compatibility          | Low         | High   | Test with all geometry directives     | Document supported geometries        |
| ShaderMaterial uniform type coercion          | Medium      | Medium | Strict type checking for uniforms     | Runtime warnings for type mismatches |
| Demand-mode edge cases (missed invalidations) | Medium      | High   | Extensive testing + escape hatch      | `forceRender()` method               |

### Business Risks

| Risk                             | Probability | Impact | Mitigation                             |
| -------------------------------- | ----------- | ------ | -------------------------------------- |
| Bundle size increase             | Medium      | Medium | Tree-shaking, lazy loading for effects |
| Breaking changes to existing API | Low         | High   | Additive API, no breaking changes      |
| Documentation lag                | Medium      | Low    | Write docs alongside implementation    |

---

## Dependencies

### External Dependencies

| Package      | Version  | Purpose                                      |
| ------------ | -------- | -------------------------------------------- |
| three        | ^0.160.0 | Core Three.js (existing)                     |
| three-stdlib | ^2.0.0   | RGBELoader, EffectComposer passes (existing) |

### Internal Dependencies

| Service/Component     | Purpose                                     |
| --------------------- | ------------------------------------------- |
| SceneService          | Access to scene, camera, renderer           |
| RenderLoopService     | Frame loop management, invalidation         |
| EffectComposerService | Post-processing pipeline                    |
| SceneGraphStore       | Object registry, parent-child relationships |
| NG_3D_PARENT token    | Scene graph parent injection                |

### New Dependencies (None Required)

All required functionality is available in `three` and `three-stdlib` packages already in the project:

- `THREE.InstancedMesh` - Core Three.js
- `THREE.ShaderMaterial` - Core Three.js
- `RGBELoader` - three-stdlib
- `BokehPass` - three-stdlib
- `SSAOPass` - three-stdlib
- `ShaderPass` - three-stdlib (for color grading)

---

## Out of Scope

The following items are explicitly OUT OF SCOPE for this task:

1. **WebGPU Support** - WebGPU renderer is experimental; defer to future task
2. **TSL (Three.js Shading Language)** - TSL preparation is Phase 4; defer to future task
3. **Physics Integration** - Rapier physics is a separate domain; defer to separate task
4. **XR/VR/AR Support** - WebXR requires dedicated effort; defer to separate task
5. **OffscreenCanvas/Web Worker** - Complex threading; defer to performance optimization task
6. **GPU Particle Systems** - Compute shaders require WebGPU; defer to future task
7. **Volumetric Effects** - Ray marching is high complexity; defer to visual effects task
8. **LOD (Level of Detail)** - While mentioned in research, focus on top 5 priorities first
9. **BatchedMesh** - Three.js BatchedMesh is still experimental; defer until stable
10. **KTX2/Basis Texture Compression** - Performance optimization; defer to separate task

---

## Success Metrics

| Metric                     | Target                               | Measurement Method          |
| -------------------------- | ------------------------------------ | --------------------------- |
| InstancedMesh adoption     | Used in 2+ demo scenes               | Demo application review     |
| Draw call reduction        | 90%+ reduction in particle demos     | Renderer stats comparison   |
| Battery efficiency         | 95%+ GPU idle time in static scenes  | GPU profiler on demand mode |
| Post-processing quality    | Matches Awwwards reference sites     | Visual comparison testing   |
| API satisfaction           | No breaking changes to existing code | Existing demo compilation   |
| Test coverage              | 80%+ for new components              | Jest coverage report        |
| Documentation completeness | JSDoc for all public APIs            | Documentation audit         |

---

## Acceptance Testing Scenarios

### Scenario 1: InstancedMesh Performance

```gherkin
Feature: InstancedMesh Performance
  As a developer
  I want to render 10,000 cubes with a single draw call
  So that my scene achieves 60fps

  Scenario: Rendering 10,000 instances
    Given a scene with <a3d-instanced-mesh [count]="10000">
    And a box geometry child
    When the scene renders
    Then renderer.info.render.calls should equal 1 for the instanced mesh
    And FPS should be >= 55

  Scenario: Updating instance transforms
    Given a scene with dynamic instanced mesh
    When updateInstanceAt(500, newMatrix) is called
    Then instance 500 should move to new position
    And no additional draw calls should be created
```

### Scenario 2: Demand-Based Rendering

```gherkin
Feature: Demand-Based Rendering
  As a developer
  I want static scenes to not render continuously
  So that mobile battery is preserved

  Scenario: Static scene stops rendering
    Given a scene with [frameloop]="'demand'"
    And no animations or user interaction
    When 200ms passes without changes
    Then RAF loop should be stopped
    And GPU usage should be near 0%

  Scenario: OrbitControls triggers render
    Given a scene with [frameloop]="'demand'"
    When user drags to rotate camera
    Then scene should render continuously during drag
    And return to demand mode after mouseup
```

### Scenario 3: Environment HDRI Loading

```gherkin
Feature: Environment HDRI Loading
  As a developer
  I want to load an HDRI for realistic lighting
  So that my PBR materials look photorealistic

  Scenario: Loading custom HDRI
    Given a scene with <a3d-environment [hdri]="'/assets/sunset.hdr'">
    When the HDRI loads successfully
    Then scene.environment should be set
    And (loaded) event should emit with texture
    And PBR materials should reflect the environment

  Scenario: Using preset environment
    Given a scene with <a3d-environment [preset]="'studio'">
    When the component initializes
    Then a built-in studio HDRI should be loaded
    And no external network request should be made if bundled
```

---

## Implementation Priority Order

Based on dependency analysis and ROI from research:

1. **Demand-Based Rendering** (RenderLoopService changes) - Foundation for all other features
2. **InstancedMeshComponent** - Highest performance impact, enables demos
3. **EnvironmentComponent** - Immediate visual quality improvement
4. **ShaderMaterialDirective** - Enables custom effects
5. **Post-Processing Effects** - Final polish (DOF, SSAO, Color Grading)

---

## Quality Gates

Before implementation is considered complete:

- [ ] All requirements follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
- [ ] Acceptance criteria in proper WHEN/THEN/SHALL format
- [ ] All new components use signal-based inputs
- [ ] All new components use OnPush change detection
- [ ] All new components have proper resource disposal
- [ ] 80%+ test coverage for new code
- [ ] No breaking changes to existing API
- [ ] JSDoc documentation for all public APIs
- [ ] Demo sections added to angular-3d-demo application
- [ ] Performance benchmarks documented

---

**Document Version**: 1.0
**Created**: 2025-12-24
**Author**: Project Manager Agent
**Task ID**: TASK_2025_026
**Status**: READY FOR VALIDATION
