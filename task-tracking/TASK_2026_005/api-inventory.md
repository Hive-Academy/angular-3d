# Complete API Inventory - TASK_2026_005

Generated: 2026-01-06
Purpose: Accurate documentation of all public API items for README generation

---

## @hive-academy/angular-3d

### Components (44 total)

#### Canvas & Controls

| Component              | Selector             | Description                                            |
| ---------------------- | -------------------- | ------------------------------------------------------ |
| Scene3dComponent       | `a3d-scene-3d`       | Root scene container with WebGLRenderer, Scene, Camera |
| OrbitControlsComponent | `a3d-orbit-controls` | Interactive camera controls                            |

#### Geometry Primitives (6)

| Component               | Selector              | Description                                     |
| ----------------------- | --------------------- | ----------------------------------------------- |
| BoxComponent            | `a3d-box`             | Box/cube mesh                                   |
| SphereComponent         | `a3d-sphere`          | Sphere mesh                                     |
| CylinderComponent       | `a3d-cylinder`        | Cylinder mesh                                   |
| TorusComponent          | `a3d-torus`           | Torus (donut) mesh                              |
| PolyhedronComponent     | `a3d-polyhedron`      | Platonic solids (tetrahedron, octahedron, etc.) |
| FloatingSphereComponent | `a3d-floating-sphere` | Pre-animated floating sphere                    |

#### Lights (5)

| Component                 | Selector                | Description                                 |
| ------------------------- | ----------------------- | ------------------------------------------- |
| AmbientLightComponent     | `a3d-ambient-light`     | Uniform ambient illumination                |
| DirectionalLightComponent | `a3d-directional-light` | Sun-like directional light with shadows     |
| PointLightComponent       | `a3d-point-light`       | Omnidirectional point light                 |
| SpotLightComponent        | `a3d-spot-light`        | Focused cone spotlight                      |
| SceneLightingComponent    | `a3d-scene-lighting`    | Preset lighting rig (ambient + directional) |

#### Text Components (7)

| Component                     | Selector                     | Description                      |
| ----------------------------- | ---------------------------- | -------------------------------- |
| TroikaTextComponent           | `a3d-troika-text`            | Basic 3D text using Troika       |
| ResponsiveTroikaTextComponent | `a3d-responsive-troika-text` | Responsive 3D text with maxWidth |
| GlowTroikaTextComponent       | `a3d-glow-troika-text`       | 3D text with glow effect         |
| SmokeTroikaTextComponent      | `a3d-smoke-troika-text`      | 3D text with smoke effect        |
| ParticlesTextComponent        | `a3d-particle-text`          | Text rendered as particles       |
| BubbleTextComponent           | `a3d-bubble-text`            | Text with bubble effect          |
| ExtrudedText3dComponent       | `a3d-extruded-text-3d`       | Extruded 3D text with depth      |

#### Space-Themed Components (5)

| Component                 | Selector                | Description                     |
| ------------------------- | ----------------------- | ------------------------------- |
| PlanetComponent           | `a3d-planet`            | Planet with optional atmosphere |
| StarFieldComponent        | `a3d-star-field`        | Particle-based star background  |
| NebulaComponent           | `a3d-nebula`            | Volumetric nebula effect        |
| NebulaVolumetricComponent | `a3d-nebula-volumetric` | Advanced volumetric nebula      |
| CloudLayerComponent       | `a3d-cloud-layer`       | Cloud layer effect              |

#### Particle Systems (5)

| Component                     | Selector                     | Description                     |
| ----------------------------- | ---------------------------- | ------------------------------- |
| ParticleSystemComponent       | `a3d-particle-system`        | Configurable particle effects   |
| MarbleParticleSystemComponent | `a3d-marble-particle-system` | Marble-styled particles         |
| GpuParticleSphereComponent    | `a3d-gpu-particle-sphere`    | GPU-accelerated particle sphere |
| SparkleCoronaComponent        | `a3d-sparkle-corona`         | Sparkle/corona effect           |
| ParticleCloudComponent        | `a3d-particle-cloud`         | Particle cloud effect           |

#### Visual Effects (7)

| Component                | Selector               | Description                        |
| ------------------------ | ---------------------- | ---------------------------------- |
| MetaballSceneComponent   | `a3d-metaball-scene`   | Metaball container (compositional) |
| MetaballSphereComponent  | `a3d-metaball-sphere`  | Individual metaball sphere         |
| MetaballCursorComponent  | `a3d-metaball-cursor`  | Cursor-following metaball          |
| MarbleSphereComponent    | `a3d-marble-sphere`    | Marble material sphere             |
| FireSphereComponent      | `a3d-fire-sphere`      | Fire/flame effect sphere           |
| BackgroundCubesComponent | `a3d-background-cubes` | Decorative background cubes        |
| MetaballComponent        | `a3d-metaball`         | Legacy metaball (deprecated)       |

#### Scene Organization (5)

| Component               | Selector              | Description                     |
| ----------------------- | --------------------- | ------------------------------- |
| GroupComponent          | `a3d-group`           | Object3D container for grouping |
| FogComponent            | `a3d-fog`             | Scene fog effect                |
| EnvironmentComponent    | `a3d-environment`     | Environment mapping             |
| BackgroundCubeComponent | `a3d-background-cube` | Skybox background               |
| InstancedMeshComponent  | `a3d-instanced-mesh`  | Instanced mesh rendering        |

#### Loaders (2)

| Component          | Selector         | Description               |
| ------------------ | ---------------- | ------------------------- |
| GltfModelComponent | `a3d-gltf-model` | GLTF/GLB model loader     |
| SvgIconComponent   | `a3d-svg-icon`   | SVG extruded as 3D object |

#### Postprocessing (8)

| Component                          | Selector                          | Description                    |
| ---------------------------------- | --------------------------------- | ------------------------------ |
| EffectComposerComponent            | `a3d-effect-composer`             | Postprocessing container       |
| BloomEffectComponent               | `a3d-bloom-effect`                | Bloom/glow effect              |
| SelectiveBloomEffectComponent      | `a3d-selective-bloom-effect`      | Selective bloom with luminance |
| DofEffectComponent                 | `a3d-dof-effect`                  | Depth of field                 |
| SsaoEffectComponent                | `a3d-ssao-effect`                 | Screen-space ambient occlusion |
| ColorGradingEffectComponent        | `a3d-color-grading-effect`        | LUT-based color grading        |
| ChromaticAberrationEffectComponent | `a3d-chromatic-aberration-effect` | Chromatic aberration           |
| FilmGrainEffectComponent           | `a3d-film-grain-effect`           | Film grain effect              |

#### Backgrounds (1)

| Component                             | Selector                             | Description               |
| ------------------------------------- | ------------------------------------ | ------------------------- |
| HexagonalBackgroundInstancedComponent | `a3d-hexagonal-background-instanced` | Hexagonal grid background |

---

### Directives (19 total)

#### Animation Directives (3)

| Directive              | Selector             | Description                     |
| ---------------------- | -------------------- | ------------------------------- |
| Float3dDirective       | `[float3d]`          | Floating/bobbing animation      |
| Rotate3dDirective      | `[rotate3d]`         | Continuous rotation             |
| SpaceFlight3dDirective | `[a3dSpaceFlight3d]` | Waypoint-based flight animation |

#### Core Directives (3)

| Directive          | Selector         | Description                        |
| ------------------ | ---------------- | ---------------------------------- |
| MeshDirective      | `[a3dMesh]`      | Base mesh behavior (hostDirective) |
| GroupDirective     | `[a3dGroup]`     | Group behavior (hostDirective)     |
| TransformDirective | `[a3dTransform]` | Position, rotation, scale          |

#### Geometry Directives (5)

| Directive                   | Selector                  | Description         |
| --------------------------- | ------------------------- | ------------------- |
| BoxGeometryDirective        | `[a3dBoxGeometry]`        | Box geometry        |
| CylinderGeometryDirective   | `[a3dCylinderGeometry]`   | Cylinder geometry   |
| SphereGeometryDirective     | `[a3dSphereGeometry]`     | Sphere geometry     |
| TorusGeometryDirective      | `[a3dTorusGeometry]`      | Torus geometry      |
| PolyhedronGeometryDirective | `[a3dPolyhedronGeometry]` | Polyhedron geometry |

#### Material Directives (3)

| Directive                 | Selector                | Description              |
| ------------------------- | ----------------------- | ------------------------ |
| StandardMaterialDirective | `[a3dStandardMaterial]` | MeshStandardMaterial     |
| PhysicalMaterialDirective | `[a3dPhysicalMaterial]` | MeshPhysicalMaterial     |
| NodeMaterialDirective     | `[a3dNodeMaterial]`     | TSL/Node-based materials |

#### Light Directives (4)

| Directive                 | Selector                | Description       |
| ------------------------- | ----------------------- | ----------------- |
| AmbientLightDirective     | `[a3dAmbientLight]`     | Ambient light     |
| DirectionalLightDirective | `[a3dDirectionalLight]` | Directional light |
| PointLightDirective       | `[a3dPointLight]`       | Point light       |
| SpotLightDirective        | `[a3dSpotLight]`        | Spot light        |

#### Interaction Directives (3)

| Directive                      | Selector                     | Description              |
| ------------------------------ | ---------------------------- | ------------------------ |
| MouseTracking3dDirective       | `[mouseTracking3d]`          | Mouse-following behavior |
| ScrollZoomCoordinatorDirective | `[a3dScrollZoomCoordinator]` | Scroll-based zoom        |
| Performance3dDirective         | `[a3dPerformance3d]`         | Auto LOD and performance |

#### Effect Directives (1)

| Directive       | Selector      | Description                |
| --------------- | ------------- | -------------------------- |
| Glow3dDirective | `[a3dGlow3d]` | Add glow effect to objects |

#### Positioning Directives (1)

| Directive                 | Selector             | Description                   |
| ------------------------- | -------------------- | ----------------------------- |
| ViewportPositionDirective | `[viewportPosition]` | Viewport-relative positioning |

---

### Services (14 total)

| Service                             | Description                             |
| ----------------------------------- | --------------------------------------- |
| SceneService                        | Access to scene, camera, renderer       |
| RenderLoopService                   | Animation frame management              |
| AnimationService                    | Programmatic animations (flight, pulse) |
| GltfLoaderService                   | GLTF/GLB loading                        |
| TextureLoaderService                | Texture loading                         |
| EffectComposerService               | Postprocessing management               |
| ViewportPositioningService          | Screen position calculations            |
| AdvancedPerformanceOptimizerService | Performance optimization                |
| FontPreloadService                  | Font preloading                         |
| Angular3dStateStore                 | State management                        |
| ComponentRegistryService            | Component registration                  |
| SceneGraphStore                     | Scene graph management                  |
| MouseTrackerService                 | Mouse position tracking                 |
| injectTextureLoader                 | Composable texture loader               |
| injectGltfLoader                    | Composable GLTF loader                  |

---

### TSL Shader Utilities (30+)

#### Noise Functions

- `hash()`, `simpleNoise3D()`, `simpleFBM()`, `nativeNoise3D()`, `nativeFBM()`, `nativeFBMVec3()`, `domainWarp()`, `cloudDensity()`

#### Lighting Effects

- `tslFresnel()`, `tslIridescence()`, `fresnel()`, `iridescence()`

#### Environment Effects

- `applyFog()`, `radialFalloff()`, `clampForBloom()`, `tslCaustics()`, `tslVolumetricRay()`

#### Ray Marching

- `tslRayMarch()`, `tslNormal()`, `tslSphereDistance()`, `tslSmoothUnion()`, `tslAmbientOcclusion()`, `tslSoftShadow()`

#### Procedural Textures

- `tslPlanet()`, `tslStars()`, `tslCausticsTexture()`, `tslPhotosphere()`, `tslMarble()`, `tslWood()`, `tslRust()`, `tslPolkaDots()`, `tslGrid()`, `tslVoronoiCells()`, `tslBricks()`, `tslSupersphere()`, `tslMelter()`, `tslBrain()`, `tslReticularVeins()`, `tslWaterMarble()`, `tslRoughClay()`

---

### Injection Tokens

| Token           | Description              |
| --------------- | ------------------------ |
| NG_3D_PARENT    | Parent Object3D access   |
| OBJECT_ID       | Unique object identifier |
| GEOMETRY_SIGNAL | Geometry configuration   |
| MATERIAL_SIGNAL | Material configuration   |

---

## @hive-academy/angular-gsap

### Components (7 total)

| Component                        | Selector                         | Description                            |
| -------------------------------- | -------------------------------- | -------------------------------------- |
| HijackedScrollTimelineComponent  | `agsp-hijacked-scroll-timeline`  | Scroll-hijacked timeline container     |
| ScrollTimelineComponent          | `agsp-scroll-timeline`           | Enhanced timeline with step indicators |
| StepIndicatorComponent           | `agsp-step-indicator`            | Visual step navigation dots            |
| ParallaxSplitScrollComponent     | `agsp-parallax-split-scroll`     | Split-panel parallax container         |
| SplitPanelSectionComponent       | `agsp-split-panel-section`       | 50/50 layout section                   |
| FeatureShowcaseTimelineComponent | `agsp-feature-showcase-timeline` | Feature showcase container             |
| FeatureStepComponent             | `agsp-feature-step`              | Individual feature step                |

---

### Directives (11 total)

#### Scroll Directives (4)

| Directive                   | Selector               | Description                 |
| --------------------------- | ---------------------- | --------------------------- |
| ScrollAnimationDirective    | `[scrollAnimation]`    | Scroll-triggered animations |
| HijackedScrollDirective     | `[hijackedScroll]`     | Scroll hijacking container  |
| HijackedScrollItemDirective | `[hijackedScrollItem]` | Hijacked scroll item        |
| ScrollSectionPinDirective   | `[scrollSectionPin]`   | Pin sections during scroll  |

#### Other Directives (4)

| Directive                  | Selector              | Description                   |
| -------------------------- | --------------------- | ----------------------------- |
| ViewportAnimationDirective | `[viewportAnimation]` | Viewport-triggered animations |
| SectionStickyDirective     | `[sectionSticky]`     | Sticky section detection      |
| ParallaxSplitItemDirective | `[parallaxSplitItem]` | Parallax split item           |
| LenisSmoothScrollDirective | `[lenisSmoothScroll]` | Lenis smooth scrolling        |

#### Content Projection Directives (11)

| Directive                      | Selector                  | Purpose                  |
| ------------------------------ | ------------------------- | ------------------------ |
| SplitPanelImageDirective       | `[splitPanelImage]`       | Image slot               |
| SplitPanelBadgeDirective       | `[splitPanelBadge]`       | Badge slot               |
| SplitPanelTitleDirective       | `[splitPanelTitle]`       | Title slot               |
| SplitPanelDescriptionDirective | `[splitPanelDescription]` | Description slot         |
| SplitPanelFeaturesDirective    | `[splitPanelFeatures]`    | Features slot            |
| FeatureBadgeDirective          | `[featureBadge]`          | Feature badge slot       |
| FeatureTitleDirective          | `[featureTitle]`          | Feature title slot       |
| FeatureDescriptionDirective    | `[featureDescription]`    | Feature description slot |
| FeatureNotesDirective          | `[featureNotes]`          | Feature notes slot       |
| FeatureVisualDirective         | `[featureVisual]`         | Feature visual slot      |
| FeatureDecorationDirective     | `[featureDecoration]`     | Feature decoration slot  |

---

### Services & Providers (4 total)

| Service/Provider         | Description                   |
| ------------------------ | ----------------------------- |
| GsapCoreService          | GSAP and ScrollTrigger access |
| LenisSmoothScrollService | Programmatic Lenis control    |
| provideGsap()            | App initializer for GSAP      |
| provideLenis()           | App initializer for Lenis     |

---

### Animation Types

#### ScrollAnimation Types

`fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `slideLeft`, `slideRight`, `scaleIn`, `scaleOut`, `parallax`, `custom`

#### ViewportAnimation Types

`fadeIn`, `fadeOut`, `slideUp`, `slideDown`, `slideLeft`, `slideRight`, `scaleIn`, `scaleOut`, `rotateIn`, `flipIn`, `bounceIn`, `custom`

---

## Summary

| Library                    | Components | Directives           | Services | Types |
| -------------------------- | ---------- | -------------------- | -------- | ----- |
| @hive-academy/angular-3d   | **44**     | **19**               | **14**   | 25+   |
| @hive-academy/angular-gsap | **7**      | **11** (+11 content) | **4**    | 15    |

This inventory supersedes the original CLAUDE.md files and must be used for README generation.
