# Task Context - TASK_2025_020

## User Intent

Comprehensive audit and fix of all @hive-academy/angular-3d library components to ensure they match the quality and features of their temp folder reference implementations. Previous migration tasks (TASK_2025_007, TASK_2025_008, TASK_2025_017) created simplified versions instead of properly copying the battle-tested temp folder code.

## Problem Statement

Investigation revealed that library components have **systematic quality issues**:
1. **StarFieldComponent** - Star sizes were 5-10x smaller than temp folder (FIXED in this session)
2. **NebulaVolumetricComponent** - Missing advanced shader features (FIXED in this session)
3. **Other components** - Need audit to identify similar discrepancies

The migration tasks specified components should be "migrated from temp folder" but the acceptance criteria were too simplified, resulting in developers creating new implementations instead of copying the actual working code.

## Root Cause

Migration task acceptance criteria focused on architecture compliance (signals, per-scene services, cleanup) but did NOT specify:
- Exact parameter values (sizes, colors, intensities)
- Complete shader implementations
- All configuration inputs
- Visual quality targets

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop
- Created: 2025-12-22
- Type: BUGFIX (Quality restoration)
- Complexity: Medium-Complex (30+ components to audit)

## Execution Strategy

BUGFIX strategy - focused comparison and fix workflow

---

## COMPREHENSIVE COMPONENT MAPPING

### TEMP FOLDER STRUCTURE
```
temp/angular-3d/
├── components/
│   ├── effects/
│   │   └── bloom-effect.component.ts
│   ├── primitives/
│   │   ├── background-cube.component.ts
│   │   ├── background-cubes.component.ts
│   │   ├── box.component.ts
│   │   ├── cylinder.component.ts
│   │   ├── floating-sphere.component.ts
│   │   ├── fog.component.ts
│   │   ├── glow-particle-text.component.ts
│   │   ├── gltf-model.component.ts
│   │   ├── instanced-particle-text.component.ts
│   │   ├── nebula.component.ts
│   │   ├── nebula-volumetric.component.ts
│   │   ├── particle-system.component.ts
│   │   ├── planet.component.ts
│   │   ├── polyhedron.component.ts
│   │   ├── scene-lighting.component.ts
│   │   ├── smoke-particle-text.component.ts
│   │   ├── star-field.component.ts
│   │   ├── star-field-enhanced.component.ts
│   │   ├── svg-icon.component.ts
│   │   ├── text-3d.component.ts
│   │   └── torus.component.ts
│   ├── orbit-controls.component.ts
│   └── scene-3d.component.ts
└── directives/
    ├── float-3d.directive.ts
    ├── glow-3d.directive.ts
    ├── hijacked-scroll.directive.ts
    ├── hijacked-scroll-item.directive.ts
    ├── performance-3d.directive.ts
    ├── rotate-3d.directive.ts
    ├── scroll-animation.directive.ts
    ├── scroll-zoom-coordinator.directive.ts
    ├── section-sticky.directive.ts
    └── space-flight-3d.directive.ts
```

### LIBRARY FOLDER STRUCTURE
```
libs/angular-3d/src/lib/
├── canvas/
│   └── scene-3d.component.ts
├── controls/
│   └── orbit-controls.component.ts
├── directives/
│   ├── geometries/
│   │   ├── box-geometry.directive.ts
│   │   ├── cylinder-geometry.directive.ts
│   │   ├── polyhedron-geometry.directive.ts
│   │   ├── sphere-geometry.directive.ts
│   │   └── torus-geometry.directive.ts
│   ├── lights/
│   │   ├── ambient-light.directive.ts
│   │   ├── directional-light.directive.ts
│   │   ├── point-light.directive.ts
│   │   └── spot-light.directive.ts
│   ├── materials/
│   │   ├── lambert-material.directive.ts
│   │   ├── physical-material.directive.ts
│   │   └── standard-material.directive.ts
│   ├── float-3d.directive.ts
│   ├── glow-3d.directive.ts
│   ├── group.directive.ts
│   ├── light.directive.ts
│   ├── mesh.directive.ts
│   ├── performance-3d.directive.ts
│   ├── rotate-3d.directive.ts
│   ├── scroll-zoom-coordinator.directive.ts
│   ├── space-flight-3d.directive.ts
│   └── transform.directive.ts
├── positioning/
│   ├── viewport-position.directive.ts
│   └── viewport-positioning.service.ts
├── postprocessing/
│   ├── effects/
│   │   └── bloom-effect.component.ts
│   ├── effect-composer.component.ts
│   └── effect-composer.service.ts
└── primitives/
    ├── lights/
    │   ├── ambient-light.component.ts
    │   ├── directional-light.component.ts
    │   ├── point-light.component.ts
    │   ├── scene-lighting.component.ts
    │   └── spot-light.component.ts
    ├── particle-text/
    │   ├── glow-particle-text.component.ts
    │   ├── instanced-particle-text.component.ts
    │   └── smoke-particle-text.component.ts
    ├── background-cube.component.ts
    ├── background-cubes.component.ts
    ├── box.component.ts
    ├── cylinder.component.ts
    ├── floating-sphere.component.ts
    ├── fog.component.ts
    ├── gltf-model.component.ts
    ├── group.component.ts
    ├── nebula.component.ts
    ├── nebula-volumetric.component.ts
    ├── particle-system.component.ts
    ├── planet.component.ts
    ├── polyhedron.component.ts
    ├── star-field.component.ts
    ├── svg-icon.component.ts
    ├── text-3d.component.ts
    └── torus.component.ts
```

---

## COMPONENT AUDIT CHECKLIST

### Priority 1: Visual Effects (HIGH IMPACT)

| Component | Temp File | Library File | Status | Notes |
|-----------|-----------|--------------|--------|-------|
| StarField | star-field-enhanced.component.ts | star-field.component.ts | ❌ CRITICAL | Stars appear as flat SQUARES (no glow texture in simple mode) |
| NebulaVolumetric | nebula-volumetric.component.ts | nebula-volumetric.component.ts | ✅ FIXED | Full shader with all uniforms |
| BloomEffect | bloom-effect.component.ts | bloom-effect.component.ts | ❓ AUDIT | Check threshold/strength values |
| GlowParticleText | glow-particle-text.component.ts | glow-particle-text.component.ts | ❓ AUDIT | |
| SmokeParticleText | smoke-particle-text.component.ts | smoke-particle-text.component.ts | ❓ AUDIT | |
| InstancedParticleText | instanced-particle-text.component.ts | instanced-particle-text.component.ts | ❓ AUDIT | |

### Priority 2: Core Primitives

| Component | Temp File | Library File | Status | Notes |
|-----------|-----------|--------------|--------|-------|
| Planet | planet.component.ts | planet.component.ts | ❓ AUDIT | Glow, texture, rotation |
| FloatingSphere | floating-sphere.component.ts | floating-sphere.component.ts | ❓ AUDIT | Material properties |
| BackgroundCube | background-cube.component.ts | background-cube.component.ts | ❓ AUDIT | |
| BackgroundCubes | background-cubes.component.ts | background-cubes.component.ts | ❓ AUDIT | |
| GltfModel | gltf-model.component.ts | gltf-model.component.ts | ❓ AUDIT | Loading states |
| Nebula (basic) | nebula.component.ts | nebula.component.ts | ❓ AUDIT | |

### Priority 3: Animation Directives

| Directive | Temp File | Library File | Status | Notes |
|-----------|-----------|--------------|--------|-------|
| Float3d | float-3d.directive.ts | float-3d.directive.ts | ❓ AUDIT | Animation config |
| Rotate3d | rotate-3d.directive.ts | rotate-3d.directive.ts | ❓ AUDIT | |
| SpaceFlight3d | space-flight-3d.directive.ts | space-flight-3d.directive.ts | ❓ AUDIT | Waypoint interpolation |
| Glow3d | glow-3d.directive.ts | glow-3d.directive.ts | ❓ AUDIT | |
| Performance3d | performance-3d.directive.ts | performance-3d.directive.ts | ❓ AUDIT | |

### Priority 4: Infrastructure

| Component | Temp File | Library File | Status | Notes |
|-----------|-----------|--------------|--------|-------|
| Scene3d | scene-3d.component.ts | scene-3d.component.ts | ❓ AUDIT | Renderer config |
| OrbitControls | orbit-controls.component.ts | orbit-controls.component.ts | ❓ AUDIT | |
| EffectComposer | (uses library directly) | effect-composer.component.ts | ❓ AUDIT | |
| SceneLighting | scene-lighting.component.ts | scene-lighting.component.ts | ❓ AUDIT | Presets |

### Library-Only Components (No temp equivalent - OK)

These were created as part of the new architecture:
- geometries/*.directive.ts (BoxGeometry, CylinderGeometry, etc.)
- materials/*.directive.ts (StandardMaterial, LambertMaterial, PhysicalMaterial)
- lights/*.directive.ts
- mesh.directive.ts, transform.directive.ts, group.directive.ts
- viewport-positioning.service.ts, viewport-position.directive.ts

### Temp-Only Components (Not yet in library)

These exist in temp but have NO library equivalent:
- scroll-animation.directive.ts → In @hive-academy/angular-gsap (correct)
- hijacked-scroll.directive.ts → In @hive-academy/angular-gsap (correct)
- hijacked-scroll-item.directive.ts → In @hive-academy/angular-gsap (correct)
- section-sticky.directive.ts → In @hive-academy/angular-gsap (correct)
- scroll-zoom-coordinator.directive.ts → Library has this ✓

---

## AUDIT METHODOLOGY

For each component pair:

1. **Input Comparison**: List all inputs in temp vs library
2. **Default Value Comparison**: Check if default values match
3. **Shader/Material Comparison**: For shader-based components, compare GLSL code
4. **Animation Config Comparison**: Check timing, easing, parameters
5. **Missing Features**: Identify features in temp not in library

## Success Criteria

- All visual components produce output matching temp folder reference
- All shader-based components have complete uniform sets
- All animation directives have correct timing/easing
- Demo app hero section looks as impressive as temp folder scene-graph reference
