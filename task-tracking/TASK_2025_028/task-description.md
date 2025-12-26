# Requirements Document - TASK_2025_028

## Full WebGPU Migration for @hive-academy/angular-3d

### Document Information

| Field            | Value                                   |
| ---------------- | --------------------------------------- |
| Task ID          | TASK_2025_028                           |
| Type             | FEATURE (Major Architectural Migration) |
| Priority         | P1 - High                               |
| Complexity       | XL (Extra Large)                        |
| Estimated Effort | 40-60 hours                             |
| Created          | 2025-12-26                              |

---

## Introduction

### Business Context

The @hive-academy/angular-3d library currently uses Three.js WebGLRenderer for all 3D graphics rendering. As of December 2025, WebGPU has achieved approximately 85% browser coverage (Chrome, Edge, Firefox 141+, Safari 26+) and Three.js has matured its WebGPU support with the Three.js Shading Language (TSL) for type-safe, cross-platform shader authoring.

This migration will modernize the entire library to use WebGPURenderer as the primary renderer while leveraging TSL for all shader-based effects. The goal is to unlock next-generation graphics capabilities including compute shaders, superior GPU particle systems, and improved rendering performance.

### Value Proposition

1. **Future-Proofing**: Position the library for the next decade of web graphics development
2. **Performance**: Access to WebGPU's more efficient command submission and parallel compute
3. **Developer Experience**: TSL provides type-safe shader authoring with better tooling support
4. **Capabilities**: Enable 100k+ GPU particles, compute shaders, and advanced instancing

### Technical Scope

- **Current State**: `THREE.WebGLRenderer` with `import * as THREE from 'three'`
- **Target State**: `THREE.WebGPURenderer` with `import * as THREE from 'three/webgpu'` and TSL from `three/tsl`
- **Migration Type**: Full replacement (not hybrid/phased)
- **Fallback Strategy**: Built-in automatic WebGL fallback for unsupported browsers

---

## Requirements

### Requirement 1: Core Renderer Migration

**User Story:** As a library consumer, I want the Scene3dComponent to use WebGPURenderer, so that I can access modern GPU capabilities and improved performance.

#### Acceptance Criteria

1. WHEN Scene3dComponent initializes THEN WebGPURenderer SHALL be created with proper async initialization pattern
2. WHEN WebGPU is not supported THEN the renderer SHALL automatically fall back to WebGLRenderer with console warning
3. WHEN the renderer is created THEN all current RendererConfig options (antialias, alpha, powerPreference) SHALL remain functional
4. WHEN shadows are enabled THEN shadow mapping SHALL work correctly with WebGPURenderer
5. WHEN the scene renders THEN `renderer.renderAsync()` SHALL be called instead of `renderer.render()` for async-capable rendering

#### Technical Notes

```typescript
// Current pattern (WebGL)
import * as THREE from 'three';
this.renderer = new THREE.WebGLRenderer({ canvas, antialias, alpha });
this.renderer.render(scene, camera);

// Target pattern (WebGPU)
import * as THREE from 'three/webgpu';
await THREE.WebGPURenderer.init();
this.renderer = new THREE.WebGPURenderer({ canvas, antialias, alpha });
await this.renderer.renderAsync(scene, camera);
```

---

### Requirement 2: Render Loop Service Migration

**User Story:** As a library consumer, I want the render loop to properly support async WebGPU rendering, so that my animations run smoothly with the new renderer.

#### Acceptance Criteria

1. WHEN RenderLoopService starts THEN it SHALL support both sync and async render functions
2. WHEN the render function is async THEN the loop SHALL properly await renderAsync() calls
3. WHEN demand-based rendering is active THEN the async pattern SHALL work correctly with invalidation
4. WHEN the scene has many objects THEN the frame timing SHALL remain accurate despite async operations
5. WHEN switching between render modes THEN no frame drops or stuttering SHALL occur

#### Technical Notes

The current sync pattern `this.renderFn()` must support async pattern `await this.renderFn()` without breaking animation timing.

---

### Requirement 3: SceneService Type Updates

**User Story:** As a library consumer, I want SceneService to expose the correct renderer type, so that I can access WebGPU-specific features when needed.

#### Acceptance Criteria

1. WHEN accessing renderer from SceneService THEN the signal type SHALL be `THREE.WebGPURenderer | null`
2. WHEN WebGL fallback is active THEN renderer type discrimination SHALL be possible
3. WHEN consumers need WebGPU-specific features THEN type guards SHALL allow safe access

---

### Requirement 4: Standard Material Migration to NodeMaterial

**User Story:** As a library consumer, I want all standard materials to use NodeMaterial variants, so that they work optimally with WebGPURenderer and TSL.

#### Acceptance Criteria

1. WHEN LambertMaterialDirective creates material THEN MeshLambertNodeMaterial SHALL be used
2. WHEN StandardMaterialDirective creates material THEN MeshStandardNodeMaterial SHALL be used
3. WHEN PhysicalMaterialDirective creates material THEN MeshPhysicalNodeMaterial SHALL be used
4. WHEN materials are updated reactively THEN NodeMaterial property updates SHALL work correctly
5. WHEN materials are disposed THEN proper NodeMaterial cleanup SHALL occur

#### Components Affected

| Component                    | Current Material     | Target Material          |
| ---------------------------- | -------------------- | ------------------------ |
| LambertMaterialDirective     | MeshLambertMaterial  | MeshLambertNodeMaterial  |
| PhysicalMaterialDirective    | MeshPhysicalMaterial | MeshPhysicalNodeMaterial |
| (Any) StandardMaterial usage | MeshStandardMaterial | MeshStandardNodeMaterial |
| MeshBasicMaterial usages     | MeshBasicMaterial    | MeshBasicNodeMaterial    |

---

### Requirement 5: Custom Shader Migration to TSL

**User Story:** As a library consumer, I want all custom shader effects to use TSL, so that they are maintainable, type-safe, and compatible with WebGPU.

#### Acceptance Criteria

1. WHEN NebulaVolumetricComponent renders THEN TSL node-based shader graph SHALL replace GLSL strings
2. WHEN custom ShaderMaterial is used THEN NodeMaterial with TSL nodes SHALL be used instead
3. WHEN shader uniforms are updated THEN TSL uniform nodes SHALL update reactively
4. WHEN noise functions are needed THEN TSL noise utility nodes SHALL be used
5. WHEN shaders compile THEN no WebGPU-specific compilation errors SHALL occur

#### Components with Custom Shaders

| Component                 | Current Implementation       | Migration Approach       |
| ------------------------- | ---------------------------- | ------------------------ |
| NebulaVolumetricComponent | GLSL vertex/fragment strings | TSL node graph with Fn() |
| Custom effects            | THREE.ShaderMaterial         | NodeMaterial with TSL    |

#### TSL Migration Pattern

```typescript
// Current GLSL pattern
const material = new THREE.ShaderMaterial({
  vertexShader: `...GLSL...`,
  fragmentShader: `...GLSL...`,
  uniforms: { uTime: { value: 0 } },
});

// Target TSL pattern
import { uniform, Fn, vec3, float } from 'three/tsl';

const uTime = uniform(0);
const nebulaMaterial = new NodeMaterial();
nebulaMaterial.fragmentNode = Fn(() => {
  // TSL node-based shader logic
  return vec3(/* computed color */);
})();
```

---

### Requirement 6: Post-Processing Pipeline Migration

**User Story:** As a library consumer, I want post-processing effects to work with WebGPU, so that bloom and other effects render correctly.

#### Acceptance Criteria

1. WHEN EffectComposerService initializes THEN WebGPU-compatible post-processing pipeline SHALL be created
2. WHEN BloomEffectComponent is used THEN WebGPU-compatible bloom pass SHALL be applied
3. WHEN multiple passes are chained THEN the compositor SHALL handle async rendering correctly
4. WHEN render targets are resized THEN WebGPU render targets SHALL update properly
5. WHEN effects are enabled/disabled THEN pipeline reconfiguration SHALL work without artifacts

#### Technical Notes

Three.js WebGPU uses a different post-processing approach:

```typescript
// WebGPU post-processing pattern
import { bloom, pass } from 'three/tsl';
import PostProcessing from 'three/addons/postprocessing/PostProcessing.js';

const postProcessing = new PostProcessing(renderer);
const scenePass = pass(scene, camera);
postProcessing.outputNode = bloom(scenePass);
```

---

### Requirement 7: Points and Particle System Migration

**User Story:** As a library consumer, I want particle systems to leverage WebGPU compute shaders, so that I can render 100k+ particles efficiently.

#### Acceptance Criteria

1. WHEN StarFieldComponent renders THEN PointsNodeMaterial SHALL be used for particles
2. WHEN ParticleSystemComponent creates particles THEN WebGPU-optimized materials SHALL be used
3. WHEN particle count exceeds 10000 THEN GPU compute shaders SHALL be considered for updates
4. WHEN PointsMaterial properties are set THEN equivalent NodeMaterial properties SHALL work
5. WHEN particle textures are applied THEN they SHALL render correctly with NodeMaterial

#### Components Affected

- StarFieldComponent (uses PointsMaterial, SpriteMaterial)
- ParticleSystemComponent (uses PointsMaterial)
- NebulaComponent (uses SpriteMaterial)

---

### Requirement 8: Sprite and Texture Material Migration

**User Story:** As a library consumer, I want sprite-based components to work correctly with WebGPU, so that billboarded effects render properly.

#### Acceptance Criteria

1. WHEN SpriteMaterial is used THEN SpriteNodeMaterial SHALL replace it
2. WHEN canvas textures are created THEN they SHALL work with WebGPU texture system
3. WHEN additive blending is used THEN it SHALL work correctly with NodeMaterial
4. WHEN sprite opacity changes THEN updates SHALL render immediately

---

### Requirement 9: Troika Text Integration Verification

**User Story:** As a library consumer, I want Troika text components to work with WebGPU, so that 3D text renders correctly.

#### Acceptance Criteria

1. WHEN TroikaTextComponent is used THEN text SHALL render correctly with WebGPURenderer
2. WHEN GlowTroikaTextComponent applies glow THEN outline effects SHALL work with WebGPU
3. WHEN text material is customized THEN NodeMaterial compatibility SHALL be verified
4. WHEN text syncs asynchronously THEN WebGPU rendering SHALL handle the update

#### Technical Notes

Troika text uses its own material system. Verify compatibility or provide material override option.

---

### Requirement 10: GLTF Model Loading Compatibility

**User Story:** As a library consumer, I want GLTF models to load and render correctly with WebGPU, so that imported 3D assets work as expected.

#### Acceptance Criteria

1. WHEN GltfLoaderService loads a model THEN materials SHALL be converted to NodeMaterial equivalents
2. WHEN models have PBR materials THEN MeshPhysicalNodeMaterial SHALL be used
3. WHEN models have animations THEN they SHALL play correctly with WebGPU
4. WHEN models use textures THEN texture loading SHALL work with WebGPU texture system

---

### Requirement 11: Light Components Compatibility

**User Story:** As a library consumer, I want all light types to work correctly with WebGPU rendering, so that scenes are lit properly.

#### Acceptance Criteria

1. WHEN AmbientLightComponent is used THEN lighting SHALL affect NodeMaterial objects
2. WHEN DirectionalLightComponent casts shadows THEN WebGPU shadow maps SHALL work
3. WHEN PointLightComponent is positioned THEN light falloff SHALL render correctly
4. WHEN SpotLightComponent is used THEN cone lighting SHALL work with WebGPU

---

### Requirement 12: OrbitControls Compatibility

**User Story:** As a library consumer, I want OrbitControls to work seamlessly with WebGPU, so that camera interaction remains smooth.

#### Acceptance Criteria

1. WHEN OrbitControlsComponent is used THEN damping updates SHALL work with async rendering
2. WHEN controls change THEN scene invalidation SHALL trigger WebGPU render
3. WHEN zoom/pan/rotate occurs THEN frame updates SHALL be smooth

---

### Requirement 13: Browser Fallback System

**User Story:** As a library consumer, I want transparent WebGL fallback when WebGPU is unavailable, so that my application works on all browsers.

#### Acceptance Criteria

1. WHEN navigator.gpu is undefined THEN WebGLRenderer SHALL be used automatically
2. WHEN fallback occurs THEN a console warning SHALL inform developers
3. WHEN fallback is active THEN all library features SHALL work (with WebGL limitations)
4. WHEN checking support programmatically THEN SceneService SHALL expose renderer type

#### Fallback Detection Pattern

```typescript
async initRenderer() {
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        // WebGPU available
        this.renderer = new THREE.WebGPURenderer({ canvas });
        await this.renderer.init();
        return;
      }
    } catch (e) {
      console.warn('WebGPU init failed, falling back to WebGL');
    }
  }
  // Fallback
  this.renderer = new THREE.WebGLRenderer({ canvas });
}
```

---

### Requirement 14: Three.js Import Path Updates

**User Story:** As a library maintainer, I want all Three.js imports updated for WebGPU, so that the correct types and classes are used.

#### Acceptance Criteria

1. WHEN importing Three.js core THEN `three/webgpu` SHALL be used for renderer-related code
2. WHEN importing TSL utilities THEN `three/tsl` SHALL be used
3. WHEN type definitions are needed THEN @types/three compatibility SHALL be verified
4. WHEN tree-shaking is applied THEN bundle size impact SHALL be measured

#### Import Updates Required

```typescript
// Current
import * as THREE from 'three';

// Target (scene/renderer context)
import * as THREE from 'three/webgpu';

// Target (TSL shaders)
import { uniform, Fn, vec3, float, mx_noise_float } from 'three/tsl';
```

---

### Requirement 15: Animation Service Compatibility

**User Story:** As a library consumer, I want GSAP animations to continue working with WebGPU rendering, so that my animations are unaffected.

#### Acceptance Criteria

1. WHEN AnimationService animates objects THEN GSAP tweens SHALL work with async rendering
2. WHEN animation updates occur THEN scene invalidation SHALL trigger render frames
3. WHEN animations complete THEN cleanup SHALL work correctly

---

## Non-Functional Requirements

### Performance Requirements

| Metric                       | Current Baseline | Target                   | Measurement Method           |
| ---------------------------- | ---------------- | ------------------------ | ---------------------------- |
| Initial render time          | <100ms           | <150ms (with async init) | Performance.now() delta      |
| Frame rate (1000 particles)  | 60fps            | 60fps                    | RenderLoopService FPS signal |
| Frame rate (10000 particles) | 30-40fps         | 60fps                    | RenderLoopService FPS signal |
| Memory usage                 | Baseline         | <110% of baseline        | Chrome DevTools              |
| Bundle size                  | Baseline         | <120% of baseline        | Webpack bundle analyzer      |

### Compatibility Requirements

| Browser         | Minimum Version | Renderer Used    |
| --------------- | --------------- | ---------------- |
| Chrome          | 113+            | WebGPU           |
| Edge            | 113+            | WebGPU           |
| Firefox         | 141+            | WebGPU           |
| Safari          | 26+             | WebGPU           |
| Chrome (older)  | 90+             | WebGL (fallback) |
| Firefox (older) | 89+             | WebGL (fallback) |
| Safari (older)  | 15+             | WebGL (fallback) |

### Security Requirements

- No new security vulnerabilities SHALL be introduced
- GPU resource access SHALL follow WebGPU security model
- Shader compilation SHALL be sandboxed by browser

### Reliability Requirements

- Renderer initialization failures SHALL gracefully fallback
- Shader compilation errors SHALL be caught and reported
- Resource cleanup SHALL prevent GPU memory leaks
- Async rendering errors SHALL not crash the application

### Maintainability Requirements

- All TSL shaders SHALL be documented with input/output specifications
- Migration patterns SHALL be documented for future reference
- Type safety SHALL be maintained throughout the codebase
- Unit tests SHALL cover WebGPU-specific code paths

---

## Components Inventory

### High Priority (Critical Path)

| Component             | File                       | Migration Complexity | Notes                              |
| --------------------- | -------------------------- | -------------------- | ---------------------------------- |
| Scene3dComponent      | scene-3d.component.ts      | High                 | Core renderer creation, async init |
| SceneService          | scene.service.ts           | Medium               | Type updates, renderer signal      |
| RenderLoopService     | render-loop.service.ts     | High                 | Async render support               |
| EffectComposerService | effect-composer.service.ts | High                 | WebGPU post-processing             |
| BloomEffectComponent  | bloom-effect.component.ts  | High                 | WebGPU bloom pass                  |

### Medium Priority (Materials)

| Component                 | File                           | Migration Complexity | Notes                 |
| ------------------------- | ------------------------------ | -------------------- | --------------------- |
| LambertMaterialDirective  | lambert-material.directive.ts  | Medium               | NodeMaterial swap     |
| PhysicalMaterialDirective | physical-material.directive.ts | Medium               | NodeMaterial swap     |
| MeshDirective             | mesh.directive.ts              | Low                  | Material type updates |

### Medium Priority (Primitives with Materials)

| Component               | File                         | Migration Complexity | Notes                 |
| ----------------------- | ---------------------------- | -------------------- | --------------------- |
| StarFieldComponent      | star-field.component.ts      | Medium               | PointsNodeMaterial    |
| NebulaComponent         | nebula.component.ts          | Medium               | SpriteNodeMaterial    |
| ParticleSystemComponent | particle-system.component.ts | Medium               | PointsNodeMaterial    |
| Glow3dDirective         | glow-3d.directive.ts         | Medium               | MeshBasicNodeMaterial |

### High Priority (Custom Shaders)

| Component                 | File                           | Migration Complexity | Notes                       |
| ------------------------- | ------------------------------ | -------------------- | --------------------------- |
| NebulaVolumetricComponent | nebula-volumetric.component.ts | Very High            | Full GLSL to TSL conversion |

### Low Priority (Should Work)

| Component              | File                        | Migration Complexity | Notes                     |
| ---------------------- | --------------------------- | -------------------- | ------------------------- |
| BoxComponent           | box.component.ts            | Low                  | Geometry unchanged        |
| CylinderComponent      | cylinder.component.ts       | Low                  | Geometry unchanged        |
| TorusComponent         | torus.component.ts          | Low                  | Geometry unchanged        |
| PolyhedronComponent    | polyhedron.component.ts     | Low                  | Geometry unchanged        |
| GroupComponent         | group.component.ts          | None                 | No renderer dependency    |
| FogComponent           | fog.component.ts            | Low                  | Scene fog unchanged       |
| All Light Components   | lights/\*.component.ts      | Low                  | Light objects unchanged   |
| OrbitControlsComponent | orbit-controls.component.ts | Low                  | Should work as-is         |
| AnimationService       | animation.service.ts        | None                 | GSAP independent          |
| GltfLoaderService      | gltf-loader.service.ts      | Medium               | Material conversion       |
| TextureLoaderService   | texture-loader.service.ts   | Low                  | Texture system compatible |

### External Dependencies to Verify

| Dependency        | Purpose                         | WebGPU Compatibility          |
| ----------------- | ------------------------------- | ----------------------------- |
| three-stdlib      | OrbitControls, loaders, effects | Verify UnrealBloomPass        |
| troika-three-text | 3D text rendering               | Verify material compatibility |
| maath             | Random/noise utilities          | No renderer dependency        |

---

## Risk Assessment

### Technical Risks

| Risk                         | Probability | Impact | Mitigation                               | Contingency                            |
| ---------------------------- | ----------- | ------ | ---------------------------------------- | -------------------------------------- |
| TSL shader complexity        | High        | High   | Incremental migration, extensive testing | Keep GLSL fallback for complex shaders |
| three-stdlib incompatibility | Medium      | High   | Early compatibility testing              | Fork/patch if needed                   |
| troika-three-text issues     | Medium      | Medium | Test early, engage maintainers           | Provide material override option       |
| Performance regression       | Medium      | Medium | Benchmark before/after each component    | Optimize hot paths                     |
| Type definition gaps         | Low         | Medium | Define custom types as needed            | Use type assertions sparingly          |

### Dependency Risks

| Risk                        | Probability | Impact | Mitigation                                | Contingency                 |
| --------------------------- | ----------- | ------ | ----------------------------------------- | --------------------------- |
| Three.js WebGPU API changes | Medium      | High   | Pin to specific version, monitor releases | Delay migration if breaking |
| Browser support regression  | Low         | Medium | Progressive enhancement                   | Automatic WebGL fallback    |

### Process Risks

| Risk              | Probability | Impact | Mitigation                    | Contingency                      |
| ----------------- | ----------- | ------ | ----------------------------- | -------------------------------- |
| Scope creep       | Medium      | Medium | Strict requirements adherence | Phase additional work separately |
| Extended timeline | Medium      | Medium | Buffer estimates by 20%       | Prioritize critical path         |

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder         | Interest                                  | Success Criteria                                      |
| ------------------- | ----------------------------------------- | ----------------------------------------------------- |
| Library Consumers   | Improved performance, future capabilities | All existing features work, new capabilities unlocked |
| Library Maintainers | Clean migration, maintainable code        | Type-safe TSL, documented patterns                    |
| Demo Application    | Showcase improvements                     | Visible performance gains, new effect demos           |

### Impact Analysis

| Stakeholder         | Impact Level | Involvement      | Communication                |
| ------------------- | ------------ | ---------------- | ---------------------------- |
| Library Consumers   | High         | Testing/Feedback | Changelog, migration notes   |
| Library Maintainers | High         | Implementation   | Technical docs, code reviews |
| Demo Application    | Medium       | Update/Testing   | After library migration      |

---

## Success Metrics

### Functional Success

- [ ] All 28+ library components render correctly with WebGPURenderer
- [ ] WebGL fallback works transparently on unsupported browsers
- [ ] All existing unit tests pass
- [ ] Demo application runs without errors
- [ ] Post-processing effects work correctly

### Performance Success

- [ ] Frame rate >= 60fps for scenes with <5000 objects
- [ ] No memory leaks after extended use
- [ ] Bundle size increase < 20%
- [ ] Initialization time < 200ms

### Quality Success

- [ ] Zero TypeScript errors with strict mode
- [ ] All TSL shaders documented
- [ ] Migration patterns documented for future reference
- [ ] E2E tests pass

---

## Dependencies and Constraints

### Technical Dependencies

- Three.js r170+ (verified WebGPU support)
- @types/three with WebGPU types
- Angular 20.3+ (current)
- Modern browser with WebGPU support for testing

### Constraints

- Must maintain backward compatibility with existing library API
- Must support browsers without WebGPU via automatic fallback
- Must not require breaking changes to consumer code
- Must complete within reasonable timeline to avoid API drift

---

## Quality Gates

### Requirements Validation

- [ ] All requirements follow SMART criteria
- [ ] Acceptance criteria in WHEN/THEN/SHALL format
- [ ] Stakeholder analysis complete
- [ ] Risk assessment with mitigation strategies
- [ ] Success metrics clearly defined
- [ ] Dependencies identified and documented
- [ ] Non-functional requirements specified
- [ ] Component inventory complete

### Ready for Architecture

This requirements document is ready for software architect review when:

1. All sections above are complete
2. Technical risks have been assessed
3. Component inventory is validated against codebase
4. Performance baselines are established

---

## Appendix: TSL Reference

### Key TSL Concepts

```typescript
// Uniforms
import { uniform } from 'three/tsl';
const uTime = uniform(0);
uTime.value = elapsed; // Update

// Functions
import { Fn, vec3, float } from 'three/tsl';
const myFunction = Fn(([pos]) => {
  return vec3(pos.x, pos.y, pos.z);
});

// Noise
import { mx_noise_float } from 'three/tsl';
const noise = mx_noise_float(position.mul(scale));

// NodeMaterial
import { NodeMaterial } from 'three/webgpu';
const material = new NodeMaterial();
material.fragmentNode = myColorFunction();
```

### WebGPU Post-Processing

```typescript
import { bloom, pass } from 'three/tsl';
import PostProcessing from 'three/addons/postprocessing/PostProcessing.js';

const postProcessing = new PostProcessing(renderer);
const scenePass = pass(scene, camera);
const bloomPass = bloom(scenePass, strength, radius, threshold);
postProcessing.outputNode = bloomPass;

// In render loop
await postProcessing.renderAsync();
```
