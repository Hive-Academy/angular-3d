# Code Logic Review - TASK_2026_005

## Review Summary

| Metric              | Value          |
| ------------------- | -------------- |
| Overall Score       | 4/10           |
| Assessment          | NEEDS_REVISION |
| Critical Issues     | 6              |
| Serious Issues      | 8              |
| Moderate Issues     | 4              |
| Failure Modes Found | 14             |

---

## The 5 Paranoid Questions

### 1. How does this fail silently?

- **Users cannot discover components**: The README and CLAUDE.md list only a subset of available components. Users looking at documentation will miss 15+ components that exist and are exported.
- **Stale API examples**: CLAUDE.md shows old public API exports that don't match actual `index.ts` exports, causing import failures with no clear path to correct imports.
- **Missing component counts**: Root README claims "44 components, 19 directives, 14 services" for angular-3d but actual count is different (53 components, 24 directives, 16+ services).

### 2. What user action causes unexpected behavior?

- **Following CLAUDE.md structure leads to 404s**: The file structure shown in CLAUDE.md is outdated - shows `primitives/text-3d.component.ts` which doesn't exist (actual: `primitives/text/*.component.ts`)
- **Import path failures**: Following the documented Public API in CLAUDE.md will fail because paths like `./lib/primitives/text-3d.component` don't exist.
- **angular-gsap import confusion**: CLAUDE.md shows path `./lib/directives/scroll-animation.directive` but actual path is `./lib/directives/scroll/scroll-animation.directive`.

### 3. What data makes this produce wrong results?

- **Component count in root README is inaccurate**: Claims 44 components but actual count from glob is 53 components in angular-3d.
- **Directive count mismatch**: Claims 19 directives but actual count is 24 directives.
- **angular-gsap counts wrong**: Claims "7 components, 22 directives" but actual is 7 components + 8 standalone directives + 11 component directives = 19 directives total.

### 4. What happens when dependencies fail?

- **Documentation-code drift**: The documentation is a snapshot from an earlier version. As code evolves, documentation becomes increasingly misleading.
- **Missing feature discovery**: New features added to source are invisible in documentation, leading users to implement workarounds for existing functionality.
- **CLAUDE.md stale for AI assistants**: AI assistants (like Claude Code) using CLAUDE.md for context receive outdated information, generating incorrect code.

### 5. What's missing that the requirements didn't mention?

- **No cross-reference validation system**: No CI/CD or script to validate documentation against source code.
- **No component inventory in documentation**: No single authoritative list of all components with their selectors.
- **Missing TSL shader documentation**: The shaders module exports 30+ TSL functions that are completely undocumented in README.
- **Missing provider documentation**: `provideGsap()` and `provideLenis()` are exported but not documented.

---

## Failure Mode Analysis

### Failure Mode 1: Angular-3d README Missing Components

- **Trigger**: Developer searches README for available components
- **Symptoms**: Cannot find HexagonalBackgroundInstancedComponent, ThrusterFlameComponent, MetaballComponent (deprecated version), and 10+ other components
- **Impact**: HIGH - Users implement custom solutions for existing functionality
- **Current Handling**: Components exist in source but not documented
- **Recommendation**: Add complete component inventory table to README

### Failure Mode 2: CLAUDE.md Structure is Stale

- **Trigger**: AI assistant or developer uses CLAUDE.md for navigation
- **Symptoms**: File paths shown don't exist, directory structure is wrong
- **Impact**: HIGH - Causes confusion and failed imports
- **Current Handling**: None - outdated file left in place
- **Recommendation**: Regenerate CLAUDE.md structure from actual filesystem

### Failure Mode 3: Public API Section Shows Non-Existent Exports

- **Trigger**: Developer copies imports from CLAUDE.md "Public API" section
- **Symptoms**: TypeScript compilation errors, module not found
- **Impact**: CRITICAL - Direct code failure
- **Current Handling**: None
- **Recommendation**: Update Public API to match actual `index.ts` exports

### Failure Mode 4: Angular-gsap Has Major Documentation Gaps

- **Trigger**: Developer looks for available angular-gsap functionality
- **Symptoms**: Cannot find ScrollTimelineComponent, StepIndicatorComponent, SectionStickyDirective, LenisSmoothScrollDirective, ParallaxSplitScrollComponent, FeatureShowcaseTimelineComponent, SplitPanelSectionComponent, and 11+ directives
- **Impact**: HIGH - Majority of angular-gsap functionality is undocumented
- **Current Handling**: Components exist but README only covers 4 directives
- **Recommendation**: Complete rewrite of angular-gsap README with full API

### Failure Mode 5: Provider Functions Undocumented

- **Trigger**: Developer wants to configure GSAP/Lenis globally
- **Symptoms**: No documentation for provideGsap(), provideLenis(), GSAP_CONFIG, LENIS_CONFIG
- **Impact**: MEDIUM - Users may misconfigure or miss configuration options
- **Current Handling**: Providers exported but not documented
- **Recommendation**: Add Provider Configuration section to README

### Failure Mode 6: TSL Shader Functions Invisible

- **Trigger**: Developer wants to create custom materials
- **Symptoms**: 30+ TSL utility functions exported but zero documentation
- **Impact**: MEDIUM - Advanced users cannot leverage TSL utilities
- **Current Handling**: Only brief mention of NodeMaterialDirective
- **Recommendation**: Add TSL Shaders documentation section

---

## Critical Issues

### Issue 1: CLAUDE.md Public API Section is Completely Wrong

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md` (lines 214-239)
- **Scenario**: Developer/AI copies imports from Public API section
- **Impact**: All imports fail - paths don't exist
- **Evidence**:

```markdown
// DOCUMENTED (Wrong):
export { BoxComponent, CylinderComponent, TorusComponent } from './lib/primitives';
export { GltfModelComponent, Text3dComponent, ParticleSystemComponent } from './lib/primitives';

// ACTUAL (Correct):
export \* from './lib/primitives'; // via index.ts barrel exports
// Text3dComponent doesn't exist - it's TroikaTextComponent
```

- **Fix**: Replace entire Public API section with actual exports from `libs/angular-3d/src/index.ts`

### Issue 2: CLAUDE.md Directory Structure is Outdated

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md` (lines 26-77)
- **Scenario**: Developer uses structure for navigation
- **Impact**: Files not found where expected
- **Evidence**:

```markdown
// DOCUMENTED:
primitives/
├── text-3d.component.ts # WRONG - doesn't exist
├── gltf-model.component.ts # WRONG - now in primitives/loaders/

// ACTUAL:
primitives/
├── text/ # Multiple text components
│ ├── troika-text.component.ts
│ ├── bubble-text.component.ts
│ └── 5 more...
├── loaders/
│ ├── gltf-model.component.ts
│ └── svg-icon.component.ts
├── effects/
│ ├── metaball/ # 3 components
│ ├── marble-sphere.component.ts
│ ├── fire-sphere.component.ts
│ ├── thruster-flame.component.ts
│ └── background-cubes.component.ts
├── backgrounds/
│ └── hexagonal-background-instanced.component.ts
└── shaders/ # Not documented at all
```

- **Fix**: Regenerate Structure section from actual filesystem

### Issue 3: angular-gsap CLAUDE.md Missing 80% of Components

- **File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\CLAUDE.md` (lines 24-35)
- **Scenario**: AI assistant uses CLAUDE.md for context
- **Impact**: Generates code using only 4 of 19+ available items
- **Evidence**:

```markdown
// DOCUMENTED:
src/lib/
├── directives/
│ ├── scroll-animation.directive.ts
│ ├── hijacked-scroll.directive.ts
│ └── hijacked-scroll-item.directive.ts
└── components/
└── hijacked-scroll-timeline.component.ts

// ACTUAL (Missing from CLAUDE.md):
├── directives/
│ ├── scroll/
│ │ ├── scroll-animation.directive.ts
│ │ ├── hijacked-scroll.directive.ts
│ │ ├── hijacked-scroll-item.directive.ts
│ │ └── scroll-section-pin.directive.ts # MISSING
│ ├── viewport-animation.directive.ts # MISSING
│ ├── section-sticky.directive.ts # MISSING
│ ├── parallax-split-item.directive.ts # MISSING
│ └── lenis-smooth-scroll.directive.ts # MISSING
├── components/
│ ├── scroll-timeline/
│ │ ├── hijacked-scroll-timeline.component.ts
│ │ ├── scroll-timeline.component.ts # MISSING
│ │ └── step-indicator.component.ts # MISSING
│ ├── feature-showcase/ # ENTIRE FOLDER MISSING
│ │ ├── feature-showcase-timeline.component.ts
│ │ ├── feature-step.component.ts
│ │ └── feature-step.directives.ts (6 directives)
│ ├── split-panel/ # ENTIRE FOLDER MISSING
│ │ ├── split-panel-section.component.ts
│ │ └── split-panel.directives.ts (5 directives)
│ └── parallax-split-scroll.component.ts # MISSING
├── services/
│ ├── gsap-core.service.ts # MISSING
│ └── lenis-smooth-scroll.service.ts # MISSING
└── providers/ # ENTIRE FOLDER MISSING
├── gsap.provider.ts
└── lenis.provider.ts
```

- **Fix**: Complete rewrite of CLAUDE.md Structure section

### Issue 4: angular-gsap README Missing Core Components

- **File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
- **Scenario**: User reads README to understand library capabilities
- **Impact**: Users think library is simpler than it is
- **Evidence**:

```markdown
DOCUMENTED in README:

- ScrollAnimationDirective
- ViewportAnimationDirective
- HijackedScrollDirective
- HijackedScrollItemDirective
- HijackedScrollTimelineComponent

MISSING from README (but exported in index.ts):

- ScrollSectionPinDirective
- SectionStickyDirective
- ParallaxSplitItemDirective
- LenisSmoothScrollDirective
- ScrollTimelineComponent
- StepIndicatorComponent
- FeatureShowcaseTimelineComponent
- FeatureStepComponent
- FeatureBadgeDirective
- FeatureTitleDirective
- FeatureDescriptionDirective
- FeatureNotesDirective
- FeatureVisualDirective
- FeatureDecorationDirective
- SplitPanelSectionComponent
- SplitPanelImageDirective
- SplitPanelBadgeDirective
- SplitPanelTitleDirective
- SplitPanelDescriptionDirective
- SplitPanelFeaturesDirective
- ParallaxSplitScrollComponent
- GsapCoreService
- LenisSmoothScrollService
- provideGsap()
- provideLenis()
```

- **Fix**: Add complete API Reference section for all exported items

### Issue 5: Root README Component Count is Wrong

- **File**: `D:\projects\angular-3d-workspace\README.md` (line 18-19)
- **Scenario**: User evaluates library capabilities
- **Impact**: Underestimates library scope
- **Evidence**:

```markdown
DOCUMENTED:
| @hive-academy/angular-3d | 44 components, 19 directives, 14 services |
| @hive-academy/angular-gsap | 7 components, 22 directives, 12+ animation types |

ACTUAL COUNT from source:
angular-3d:

- Components: 53 (not 44)
- Directives: 24 (not 19)
- Services: 16+ (not 14)

angular-gsap:

- Components: 7 (correct)
- Directives: 8 standalone + 11 component directives = 19 (not 22)
```

- **Fix**: Update counts to match actual source

### Issue 6: angular-3d README Missing Components

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
- **Scenario**: User looks for specific component
- **Impact**: User cannot find existing components
- **Evidence**:

Components MISSING from README but exported:
| Component | Selector | Status |
|-----------|----------|--------|
| ThrusterFlameComponent | `<a3d-thruster-flame>` | NOT DOCUMENTED |
| HexagonalBackgroundInstancedComponent | `<a3d-hexagonal-background-instanced>` | NOT DOCUMENTED |
| MetaballComponent (deprecated) | `<a3d-metaball>` | NOT DOCUMENTED |
| ParticleCloudComponent | `<a3d-particle-cloud>` | MISSING (in table but no details) |

Directives MISSING from README:

- ViewportPositionDirective
- MeshDirective
- GroupDirective
- TransformDirective
- Glow3dDirective
- LightDirective (base)
- All geometry directives (BoxGeometryDirective, etc.)
- All material directives (StandardMaterialDirective, etc.)
- All light directives (standalone versions)

- **Fix**: Add complete directive documentation section

---

## Serious Issues

### Issue 7: TSL Shader Exports Completely Undocumented

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d/README.md`
- **Scenario**: Developer wants custom materials
- **Impact**: 30+ TSL functions invisible to users
- **Evidence**: See `libs/angular-3d/src/lib/primitives/shaders/index.ts` - exports tslFresnel, tslIridescence, tslCaustics, tslMarble, tslPlanet, etc.
- **Fix**: Add "TSL Shader Utilities" section to README

### Issue 8: Provider Functions Not Documented (angular-gsap)

- **File**: `D:\projects\angular-3d-workspace\libs\angular-gsap/README.md`
- **Evidence**:

```typescript
// Exported but undocumented:
export { provideGsap, GSAP_CONFIG, type GsapConfig } from './lib/providers/gsap.provider';
export { provideLenis, LENIS_CONFIG } from './lib/providers/lenis.provider';
```

- **Fix**: Add "Configuration Providers" section

### Issue 9: Store Module Undocumented

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d/README.md`
- **Evidence**: Store exports ComponentRegistryService, Angular3dStateStore, SceneGraphStore
- **Fix**: Add internal API documentation

### Issue 10: Render-Loop Types Not Documented

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d/README.md`
- **Evidence**: UpdateCallback, FrameContext, FrameloopMode types exported but not documented
- **Fix**: Add types documentation

### Issue 11: Positioning Module Completely Missing

- **File**: `D:\projects\angular-3d-workspace\libs\angular-3d/README.md`
- **Evidence**: ViewportPositioningService and ViewportPositionDirective exported but not documented
- **Fix**: Add Positioning Utilities section

### Issue 12: Animation Service Not Documented

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/README.md`
- **Evidence**: AnimationService with FlightWaypoint and PulseConfig exported but not documented
- **Fix**: Document AnimationService

### Issue 13: Injectable Functions Not Documented

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/README.md`
- **Evidence**: injectTextureLoader() and injectGltfLoader() provide modern DI patterns but undocumented
- **Fix**: Add Injectable Functions section

### Issue 14: EffectComposerService Not Documented

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/README.md`
- **Evidence**: EffectComposerService exported but only component documented
- **Fix**: Document the service

---

## Moderate Issues

### Issue 15: angular-3d README Says "44 Components" in Features

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/README.md` (line 14)
- **Evidence**: "44 Components" but actual is 53
- **Fix**: Update count

### Issue 16: Metaball Deprecation Not Clearly Communicated

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/src/lib/primitives/effects/index.ts`
- **Evidence**: Comment says old MetaballComponent is deprecated but README doesn't mention this
- **Fix**: Add deprecation notice to README

### Issue 17: Peer Dependencies Version Ranges May Be Stale

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/README.md` (lines 37-47)
- **Evidence**: Shows `~20.3.0` but project may support different versions
- **Fix**: Verify peer deps match package.json

### Issue 18: Code Examples May Use Outdated Selectors

- **File**: `D:\projects\angular-3d-workspace\libs/angular-3d/CLAUDE.md`
- **Evidence**: Shows `a3dFloat3d` but actual directive may have different selector
- **Fix**: Verify all code examples compile

---

## Data Flow Analysis

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          DOCUMENTATION DATA FLOW                                 │
│                                                                                 │
│  SOURCE OF TRUTH                     GAP                   DOCUMENTATION        │
│  ===============                     ===                   =============        │
│                                                                                 │
│  libs/angular-3d/src/index.ts  ──────────────────>  README.md                  │
│        │                                                │                       │
│        │ exports 53 components                          │ documents ~40         │
│        │ exports 24 directives                          │ documents ~15         │
│        │ exports 16+ services                           │ documents ~8          │
│        │                                                │                       │
│        └─────────────> CLAUDE.md shows WRONG paths ─────┘                       │
│                                                                                 │
│  libs/angular-gsap/src/index.ts ────────────────>  README.md                   │
│        │                                                │                       │
│        │ exports 7 components                           │ documents 2           │
│        │ exports 19 directives                          │ documents 5           │
│        │ exports 2 providers                            │ documents 0           │
│        │ exports 2 services                             │ documents 0           │
│        │                                                │                       │
│        └─────────────> CLAUDE.md MASSIVELY outdated ────┘                       │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Gap Points Identified:

1. **No automated sync between source exports and documentation**
2. **CLAUDE.md files created once and never updated**
3. **README component tables manually maintained (error-prone)**
4. **No TypeDoc or automated API documentation generation**

---

## Requirements Fulfillment

| Requirement                      | Status  | Concern                       |
| -------------------------------- | ------- | ----------------------------- |
| README reflects current codebase | PARTIAL | 30%+ of exports undocumented  |
| CLAUDE.md structure accurate     | MISSING | File paths completely wrong   |
| Component counts accurate        | MISSING | All counts wrong              |
| Code examples work               | UNKNOWN | Need compilation verification |
| All exports documented           | MISSING | Major gaps in both libraries  |

### Implicit Requirements NOT Addressed:

1. **TSL shader API documentation** - Advanced users need this for custom materials
2. **Provider configuration documentation** - Modern Angular apps need DI setup
3. **Service API documentation** - Internal services are exported but undocumented
4. **Deprecation notices** - Old components should have migration guides
5. **Type export documentation** - Exported types should be documented

---

## Edge Case Analysis

| Edge Case            | Handled | How                    | Concern               |
| -------------------- | ------- | ---------------------- | --------------------- |
| New component added  | NO      | Manual update required | Documentation drifts  |
| Component renamed    | NO      | Old docs remain        | Confusion             |
| Component deprecated | PARTIAL | Comment in code only   | Users don't see it    |
| Export path changed  | NO      | Old paths in CLAUDE.md | Import failures       |
| New directive added  | NO      | Manual update required | Undiscovered features |

---

## Integration Risk Assessment

| Integration                | Failure Probability | Impact                     | Mitigation       |
| -------------------------- | ------------------- | -------------------------- | ---------------- |
| CLAUDE.md -> AI Assistants | HIGH                | Wrong code generated       | Update CLAUDE.md |
| README -> New Users        | HIGH                | Feature confusion          | Update README    |
| Package.json exports -> TS | LOW                 | Compilation works          | N/A              |
| Documentation -> IDE       | MEDIUM              | Missing IntelliSense hints | Add JSDoc        |

---

## Verdict

**Recommendation**: NEEDS_REVISION
**Confidence**: HIGH
**Top Risk**: CLAUDE.md files provide completely wrong information to AI assistants and developers, leading to compilation failures and missed functionality.

---

## What Robust Implementation Would Include

A bulletproof documentation system would have:

1. **Automated API Documentation**

   - TypeDoc or Compodoc generation from source
   - Pre-commit hooks to validate docs match exports
   - CI check that fails if documentation is stale

2. **Single Source of Truth**

   - Generate component inventory from source code
   - README includes auto-generated tables
   - CLAUDE.md regenerated from filesystem

3. **Version Tracking**

   - Changelog entries required for new components
   - Deprecation warnings in both code and docs
   - Migration guides for breaking changes

4. **Validation Scripts**

   ```bash
   # Script to compare exports vs documentation
   npm run validate:docs
   ```

5. **Complete Coverage**
   - Every exported item has:
     - README entry with selector
     - CLAUDE.md structure entry
     - At least one code example
     - TypeScript types documented

---

## Detailed Inventory Comparison

### Angular-3D: Components in Source vs Documentation

#### COMPONENTS IN SOURCE (53 total):

**Canvas (1)**

- Scene3dComponent - DOCUMENTED

**Controls (1)**

- OrbitControlsComponent - DOCUMENTED

**Geometry (6)**

- BoxComponent - DOCUMENTED
- SphereComponent - DOCUMENTED
- CylinderComponent - DOCUMENTED
- TorusComponent - DOCUMENTED
- PolyhedronComponent - DOCUMENTED
- FloatingSphereComponent - DOCUMENTED

**Lights (5)**

- AmbientLightComponent - DOCUMENTED
- DirectionalLightComponent - DOCUMENTED
- PointLightComponent - DOCUMENTED
- SpotLightComponent - DOCUMENTED
- SceneLightingComponent - DOCUMENTED

**Text (7)**

- TroikaTextComponent - DOCUMENTED
- ResponsiveTroikaTextComponent - DOCUMENTED
- GlowTroikaTextComponent - DOCUMENTED
- SmokeTroikaTextComponent - DOCUMENTED
- ParticlesTextComponent - DOCUMENTED
- BubbleTextComponent - DOCUMENTED
- ExtrudedText3dComponent - DOCUMENTED

**Space (5)**

- PlanetComponent - DOCUMENTED
- StarFieldComponent - DOCUMENTED
- NebulaComponent - DOCUMENTED
- NebulaVolumetricComponent - DOCUMENTED
- CloudLayerComponent - DOCUMENTED

**Particles (5)**

- ParticleSystemComponent - DOCUMENTED
- MarbleParticleSystemComponent - DOCUMENTED
- GpuParticleSphereComponent - DOCUMENTED
- SparkleCoronaComponent - DOCUMENTED
- ParticleCloudComponent - DOCUMENTED

**Effects (7)**

- MetaballSceneComponent - DOCUMENTED
- MetaballSphereComponent - DOCUMENTED
- MetaballCursorComponent - DOCUMENTED
- MarbleSphereComponent - DOCUMENTED
- BackgroundCubesComponent - DOCUMENTED
- FireSphereComponent - DOCUMENTED
- ThrusterFlameComponent - **NOT DOCUMENTED**
- MetaballComponent (deprecated) - **NOT DOCUMENTED**

**Scene (5)**

- GroupComponent - DOCUMENTED
- FogComponent - DOCUMENTED
- EnvironmentComponent - DOCUMENTED
- BackgroundCubeComponent - DOCUMENTED
- InstancedMeshComponent - DOCUMENTED

**Loaders (2)**

- GltfModelComponent - DOCUMENTED
- SvgIconComponent - DOCUMENTED

**Backgrounds (1)**

- HexagonalBackgroundInstancedComponent - **NOT DOCUMENTED**

**Postprocessing (8)**

- EffectComposerComponent - DOCUMENTED
- BloomEffectComponent - DOCUMENTED
- SelectiveBloomEffectComponent - DOCUMENTED
- DofEffectComponent - DOCUMENTED
- SsaoEffectComponent - DOCUMENTED
- ColorGradingEffectComponent - DOCUMENTED
- ChromaticAberrationEffectComponent - DOCUMENTED
- FilmGrainEffectComponent - DOCUMENTED

#### DIRECTIVES IN SOURCE (24 total):

**Animation (3)**

- Float3dDirective - DOCUMENTED
- Rotate3dDirective - DOCUMENTED
- SpaceFlight3dDirective - DOCUMENTED

**Core (3)**

- MeshDirective - **NOT DOCUMENTED**
- GroupDirective - **NOT DOCUMENTED**
- TransformDirective - **NOT DOCUMENTED**

**Interaction (3)**

- MouseTracking3dDirective - DOCUMENTED
- ScrollZoomCoordinatorDirective - DOCUMENTED
- Performance3dDirective - DOCUMENTED

**Effects (1)**

- Glow3dDirective - **NOT DOCUMENTED**

**Geometries (5)**

- BoxGeometryDirective - **NOT DOCUMENTED**
- CylinderGeometryDirective - **NOT DOCUMENTED**
- TorusGeometryDirective - **NOT DOCUMENTED**
- SphereGeometryDirective - **NOT DOCUMENTED**
- PolyhedronGeometryDirective - **NOT DOCUMENTED**

**Materials (3)**

- StandardMaterialDirective - **NOT DOCUMENTED**
- PhysicalMaterialDirective - **NOT DOCUMENTED**
- NodeMaterialDirective - **PARTIALLY DOCUMENTED (mentioned briefly)**

**Lights (5)**

- LightDirective (base) - **NOT DOCUMENTED**
- AmbientLightDirective - **NOT DOCUMENTED**
- PointLightDirective - **NOT DOCUMENTED**
- DirectionalLightDirective - **NOT DOCUMENTED**
- SpotLightDirective - **NOT DOCUMENTED**

**Positioning (1)**

- ViewportPositionDirective - **NOT DOCUMENTED**

#### SERVICES IN SOURCE (16+ total):

**Canvas**

- SceneService - MENTIONED

**Render Loop**

- RenderLoopService - MENTIONED
- AnimationService - **NOT DOCUMENTED**

**Loaders**

- TextureLoaderService - MENTIONED
- GltfLoaderService - MENTIONED

**Postprocessing**

- EffectComposerService - **NOT DOCUMENTED**

**Store**

- ComponentRegistryService - **NOT DOCUMENTED**
- Angular3dStateStore - **NOT DOCUMENTED**
- SceneGraphStore - **NOT DOCUMENTED**

**Services**

- AdvancedPerformanceOptimizerService - **NOT DOCUMENTED**
- RenderCallbackRegistryService - **NOT DOCUMENTED**
- VisibilityObserverService - **NOT DOCUMENTED**
- FontPreloadService - **NOT DOCUMENTED**

**Metaball**

- MouseTrackerService - **NOT DOCUMENTED**

**Positioning**

- ViewportPositioningService - **NOT DOCUMENTED**

**Text**

- TextSamplingService - **NOT DOCUMENTED**

---

### Angular-GSAP: Components in Source vs Documentation

#### COMPONENTS IN SOURCE (7 total):

**Scroll Timeline (3)**

- HijackedScrollTimelineComponent - DOCUMENTED
- ScrollTimelineComponent - **NOT DOCUMENTED**
- StepIndicatorComponent - **NOT DOCUMENTED**

**Feature Showcase (2)**

- FeatureShowcaseTimelineComponent - **NOT DOCUMENTED**
- FeatureStepComponent - **NOT DOCUMENTED**

**Split Panel (1)**

- SplitPanelSectionComponent - **NOT DOCUMENTED**

**Other (1)**

- ParallaxSplitScrollComponent - **NOT DOCUMENTED**

#### DIRECTIVES IN SOURCE (19 total):

**Scroll (4)**

- ScrollAnimationDirective - DOCUMENTED
- HijackedScrollDirective - DOCUMENTED
- HijackedScrollItemDirective - DOCUMENTED
- ScrollSectionPinDirective - **NOT DOCUMENTED**

**Other (4)**

- ViewportAnimationDirective - DOCUMENTED
- SectionStickyDirective - **NOT DOCUMENTED**
- ParallaxSplitItemDirective - **NOT DOCUMENTED**
- LenisSmoothScrollDirective - **NOT DOCUMENTED**

**Feature Showcase (6)**

- FeatureBadgeDirective - **NOT DOCUMENTED**
- FeatureTitleDirective - **NOT DOCUMENTED**
- FeatureDescriptionDirective - **NOT DOCUMENTED**
- FeatureNotesDirective - **NOT DOCUMENTED**
- FeatureVisualDirective - **NOT DOCUMENTED**
- FeatureDecorationDirective - **NOT DOCUMENTED**

**Split Panel (5)**

- SplitPanelImageDirective - **NOT DOCUMENTED**
- SplitPanelBadgeDirective - **NOT DOCUMENTED**
- SplitPanelTitleDirective - **NOT DOCUMENTED**
- SplitPanelDescriptionDirective - **NOT DOCUMENTED**
- SplitPanelFeaturesDirective - **NOT DOCUMENTED**

#### SERVICES IN SOURCE (2 total):

- GsapCoreService - **NOT DOCUMENTED**
- LenisSmoothScrollService - **NOT DOCUMENTED**

#### PROVIDERS IN SOURCE (2 total):

- provideGsap() - **NOT DOCUMENTED**
- provideLenis() - **NOT DOCUMENTED**

---

## Summary Statistics

### Angular-3D Coverage:

| Category      | In Source | Documented | Coverage |
| ------------- | --------- | ---------- | -------- |
| Components    | 53        | 49         | 92%      |
| Directives    | 24        | 10         | 42%      |
| Services      | 16        | 4          | 25%      |
| TSL Functions | 30+       | 0          | 0%       |
| **Total API** | **123+**  | **63**     | **51%**  |

### Angular-GSAP Coverage:

| Category      | In Source | Documented | Coverage |
| ------------- | --------- | ---------- | -------- |
| Components    | 7         | 2          | 29%      |
| Directives    | 19        | 5          | 26%      |
| Services      | 2         | 0          | 0%       |
| Providers     | 2         | 0          | 0%       |
| **Total API** | **30**    | **7**      | **23%**  |

---

## Recommendations Priority

### P0 - Critical (Do Immediately):

1. Update CLAUDE.md structure sections for both libraries
2. Update CLAUDE.md Public API sections for both libraries
3. Fix component counts in root README.md

### P1 - High (Do This Sprint):

4. Document all angular-gsap missing components and directives
5. Document angular-gsap providers
6. Add ThrusterFlameComponent to angular-3d README
7. Add HexagonalBackgroundInstancedComponent to angular-3d README

### P2 - Medium (Do Next Sprint):

8. Document all angular-3d directives
9. Document TSL shader functions
10. Document services for both libraries
11. Add deprecation notice for old MetaballComponent

### P3 - Low (Backlog):

12. Set up automated documentation generation
13. Add documentation validation to CI/CD
14. Create comprehensive JSDoc for all exports
