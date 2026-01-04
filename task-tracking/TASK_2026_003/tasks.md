# Development Tasks - TASK_2026_003

**Total Tasks**: 5 | **Batches**: 2 | **Status**: 2/2 complete

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- createMarbleMaterial factory exists: Verified at tsl-marble.ts:321-391
- MarbleMaterialConfig interface exists: Verified at tsl-marble.ts
- tslCausticsTexture exists: Verified at space.ts:207-237
- tslPhotosphere exists: Verified at space.ts (line 244+)
- generateShellPositions pattern: Verified at sparkle-corona.component.ts:90-112
- BufferAttribute update pattern: Verified at sparkle-corona.component.ts:404-429
- Marble material creation pattern: Verified at marble-sphere.component.ts:241-292

### Risks Identified

| Risk                                                              | Severity | Mitigation                                                                                     |
| ----------------------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------- |
| Particle lifecycle performance (800 particles, per-frame updates) | MEDIUM   | Use BufferAttribute.needsUpdate pattern (proven in sparkle-corona), monitor fps during testing |
| Circular texture canvas rendering                                 | LOW      | Pattern verified in Three.js docs, straightforward CanvasTexture creation                      |

### Edge Cases to Handle

- [x] Particle despawn/respawn boundary (r > maxDistance) -> Handled in Task 1.3 (lifecycle logic)
- [x] Division by zero in fade calculation -> Handled in Task 1.3 (normalizedDistance formula guards)
- [x] Empty particle array initialization -> Handled in Task 1.2 (proper Float32Array sizing)

---

## Batch 1: CoralSphereComponent Creation (Core Implementation) ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None
**Commit**: c0da3e4
**Review Score**: 9.5/10 (code-logic-reviewer)

### Task 1.1: Create CoralSphereComponent with Marble Sphere Material ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\coral-sphere.component.ts
**Spec Reference**: implementation-plan.md:110-306
**Pattern to Follow**: marble-sphere.component.ts:241-292 (createMesh method)

**Quality Requirements**:

- Component extends no base class (standalone pattern)
- Uses ChangeDetectionStrategy.OnPush
- All inputs are signal-based: radius, position, scale, interiorTexture, opacity
- Creates sphere with SphereGeometry(radius, 64, 64)
- Uses createMarbleMaterial factory with MarbleMaterialConfig
- Warm peachy colors: colorA '#ffd4a3', colorB '#ffe8d7', edgeColor '#ffaa77'
- Supports both tslCausticsTexture and tslPhotosphere interior textures
- Material is MeshStandardNodeMaterial with transparent: true, depthWrite: false
- Sphere renderOrder = 2 (renders after particles)

**Validation Notes**:

- All imports verified to exist in codebase
- createMarbleMaterial factory verified at tsl-marble.ts:321
- TSL textures verified at space.ts:207, 244+
- Pattern proven in marble-sphere.component.ts

**Implementation Details**:

- Imports:
  - THREE from 'three/webgpu' (MeshStandardNodeMaterial, SphereGeometry, Color, DoubleSide)
  - createMarbleMaterial, MarbleMaterialConfig from '../shaders/tsl-marble'
  - tslCausticsTexture, tslPhotosphere from '../shaders/tsl-textures'
  - NG_3D_PARENT from '../../types/tokens'
  - RenderLoopService from '../../render-loop'
- Decorators: @Component with selector 'a3d-coral-sphere', standalone: true, template: '<ng-content />'
- Key Logic:
  - Effect-driven sphere creation (effect(() => { if (parent) createSphereMesh() }))
  - createSphereMesh() method following marble-sphere.component.ts:241-292 pattern
  - TSL texture creation based on interiorTexture() input
  - MarbleMaterialConfig with peachy colors and interior texture
  - Mesh creation with transparent material, depthWrite: false

---

### Task 1.2: Add Particle Emission System (Surface Spawning) ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\coral-sphere.component.ts
**Dependencies**: Task 1.1
**Spec Reference**: implementation-plan.md:308-398
**Pattern to Follow**: sparkle-corona.component.ts:90-112 (generateShellPositions)

**Quality Requirements**:

- Particle inputs: particleCount (800), particleSize (0.015), flowSpeed (0.3), maxDistance (5.5)
- Particle color palette: ['#ffffff', '#fff5e6', '#ffccaa', '#ff8866', '#ff6644'] (5 colors)
- Particles spawn AT sphere surface (radius \* 1.0), NOT inside volume
- Uses BufferGeometry with position, color, opacity attributes
- Position attribute: Float32Array(count \* 3) with spherical coordinate distribution
- Color attribute: Float32Array(count \* 3) with random palette selection per particle
- Opacity attribute: Float32Array(count) initialized to particleOpacity input
- Material is PointsNodeMaterial with circular texture map, AdditiveBlending, vertexColors: true
- Particle renderOrder = 1 (renders before sphere)
- Creates circular texture via createCircularTexture() method (canvas-based radial gradient)

**Validation Notes**:

- generateShellPositions pattern verified at sparkle-corona.component.ts:90-112
- BufferAttribute pattern verified in Three.js BufferGeometry docs
- CanvasTexture pattern verified in Three.js docs

**Implementation Details**:

- Imports: THREE.BufferGeometry, THREE.BufferAttribute, THREE.Points, THREE.PointsNodeMaterial, THREE.CanvasTexture, THREE.AdditiveBlending
- Key Logic:
  - createParticleEmissionSystem() method called in constructor effect
  - Spherical coordinate generation: theta = random * 2PI, phi = acos(2*random - 1)
  - Direction vector: (sin(phi)*cos(theta), cos(phi), sin(phi)*sin(theta))
  - Spawn position: direction \* radius (AT surface)
  - Random color selection from palette per particle
  - createCircularTexture(): 64x64 canvas with radial gradient (white center -> transparent edge)
  - particleData array stores { distance, direction, baseOpacity } per particle

---

### Task 1.3: Implement Particle Lifecycle Animation (Outward Flow Only) ✅ COMPLETE

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\coral-sphere.component.ts
**Dependencies**: Task 1.2
**Spec Reference**: implementation-plan.md:424-486
**Pattern to Follow**: sparkle-corona.component.ts:404-429 (animate callback)

**Quality Requirements**:

- Particles flow OUTWARD only (distance increases, never decreases)
- Per-frame update: distance += flowSpeed _ delta _ 1000
- Despawn condition: if (distance > maxDistance) reset to radius \* 1.0
- Position update: position = direction \* distance
- Opacity fade: opacity = baseOpacity \* (1.0 - normalizedDistance)
  - normalizedDistance = (distance - radius) / (maxDistance - radius)
- Updates BufferAttribute arrays directly, sets needsUpdate = true
- Registers callback via renderLoop.registerUpdateCallback(callback)
- Cleanup: unregister callback in DestroyRef.onDestroy

**Validation Notes**:

- Outward-only flow prevents interior penetration (critical requirement from plan validation)
- Fade formula prevents division by zero (maxDistance > radius guaranteed by inputs)
- Despawn/respawn ensures continuous particle flow

**Implementation Details**:

- Imports: None new (uses existing RenderLoopService, DestroyRef)
- Key Logic:
  - setupParticleLifecycle() method called after createParticleEmissionSystem()
  - registerUpdateCallback receives (delta) parameter
  - Loop through particleData array per frame
  - Update distance: data.distance += flowSpeed _ delta _ 1000
  - Check despawn: if (data.distance > maxDistance) -> data.distance = radius \* 1.0
  - Optional: regenerate random direction on respawn for variety
  - Update position array: positionAttribute.array[idx] = direction.x \* distance
  - Calculate fade: normalizedDistance, fadeFactor = 1.0 - normalizedDistance
  - Update opacity array: opacityAttribute.array[i] = baseOpacity \* fadeFactor
  - Mark attributes: positionAttribute.needsUpdate = true, opacityAttribute.needsUpdate = true
  - Cleanup callback stored in particleUpdateCleanup, called in dispose()

---

**Batch 1 Verification**:

- CoralSphereComponent file exists at path
- Build passes: npx nx build @hive-academy/angular-3d
- Visual verification: Sphere displays warm peachy interior, particles flow outward only
- Performance check: Maintain 60fps with 800 particles
- code-logic-reviewer approved

---

## Batch 2: Integration and Export (Library Export + Hero Section) 🔄 IMPLEMENTED

**Developer**: frontend-developer
**Tasks**: 2/2 | **Dependencies**: Batch 1 complete

### Task 2.1: Export CoralSphereComponent from Library Index 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\index.ts
**Spec Reference**: implementation-plan.md:595-617
**Pattern to Follow**: index.ts:1-6 (existing exports)

**Quality Requirements**:

- Add export line: export \* from './coral-sphere.component';
- Maintain alphabetical order (between background-cubes and glass-sphere)
- No other changes to file
- Verify export works: import { CoralSphereComponent } from '@hive-academy/angular-3d' in demo app

**Validation Notes**:

- Simple export addition, low risk
- Alphabetical order ensures maintainability

**Implementation Details**:

- Insert after line 1 (background-cubes export)
- Exact text: export \* from './coral-sphere.component';

---

### Task 2.2: Replace GlassSphere with CoralSphere in Hero Section 🔄 IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\glass-sphere-hero-section.component.ts
**Dependencies**: Task 2.1
**Spec Reference**: implementation-plan.md:546-589
**Pattern to Follow**: glass-sphere-hero-section.component.ts:13-28 (existing imports/template)

**Quality Requirements**:

- Import: Replace GlassSphereComponent with CoralSphereComponent
- Template: Replace <a3d-glass-sphere> with <a3d-coral-sphere>
- Parameters: Update to match new API (radius, position, scale, interiorTexture, opacity, particle config)
- Use defaults from CoralSphereComponent for particle parameters (remove explicit bindings for defaults)
- Maintain scroll-driven position() and scale() signals
- Visual match: Compare with reference screenshot (docs/Screenshot 2026-01-03 205300.png)

**Validation Notes**:

- Breaking change acceptable (new component, not modification)
- Simpler API improves maintainability

**Implementation Details**:

- Import line 27: Change GlassSphereComponent -> CoralSphereComponent
- Template: Replace selector a3d-glass-sphere -> a3d-coral-sphere
- Template bindings:
  - Keep: [radius]="4.5", [position]="spherePosition()", [scale]="sphereScale()"
  - Add: [interiorTexture]="'caustics'", [opacity]="0.15"
  - Optional: Customize particle parameters if needed, otherwise use defaults
- Remove old glass-sphere specific parameters (beamCount, beamWidth, etc.)

---

**Batch 2 Verification**:

- Library index exports CoralSphereComponent successfully
- Hero section builds without errors
- Hero section displays new coral sphere with outward particles
- Visual comparison: Matches reference screenshot warm peachy sphere + corona particles
- No glass-sphere remnants in hero section
- Build passes: npx nx build angular-3d-demo
- code-logic-reviewer approved

---

## Completion Criteria

**ALL tasks must be**:

- Implemented with REAL production code (no stubs, TODOs, or placeholders)
- Verified to build successfully
- Visually verified against reference screenshot
- Performance tested (60fps maintained)
- Code-logic-reviewer approved

**Final Deliverables**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\coral-sphere.component.ts (NEW, ~450 lines)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\index.ts (MODIFIED, +1 export)
- D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\glass-sphere-hero-section.component.ts (MODIFIED, import + template)
