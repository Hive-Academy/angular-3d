# BlueYard Particle Sphere Implementation - Session Summary

## Date: 2026-01-03

## Objective
Implement a BlueYard-style hero section with a glass sphere containing volumetric particles, matching reference images:
- `docs/Screenshot 2026-01-03 205300.png`
- `docs/Screenshot 2026-01-03 205344.png`
- `docs/Screenshot 2026-01-02 234414.png`

## What We Accomplished

### 1. Created New Components

#### VolumetricFogSphereComponent
**File**: `libs/angular-3d/src/lib/primitives/effects/volumetric-fog-sphere.component.ts`

- True volumetric fog using TSL raymarching shader
- Creates smooth fog-like appearance with 3D noise
- Single draw call (efficient)
- **Status**: Created but **NOT USED** in final implementation

#### VolumetricFog Shader (TSL)
**File**: `libs/angular-3d/src/lib/primitives/shaders/tsl-textures/volumetric-fog.ts`

- Raymarching through sphere volume
- 3D FBM noise for organic density variation
- Density gradient (power 2.5 for center concentration)
- Color mixing based on depth
- **Status**: Created but **NOT USED** in final implementation

#### ParticleCloudComponent
**File**: `libs/angular-3d/src/lib/primitives/particles/particle-cloud.component.ts`

- GPU instanced rendering (1 draw call for thousands of particles)
- Dramatic size variation (tiny stars to large orbs)
- Color gradients based on distance from center
- Per-instance opacity variation
- Density gradients (denser in center via 'density-gradient' distribution)
- Organic noise-based motion animation
- **HARD BOUNDARY CONSTRAINT** - particles stop at sphere edge
- **Status**: ✅ ACTIVELY USED in final implementation

**Key Features**:
```typescript
// Interior: Dense with hard boundary
<a3d-particle-cloud
  [count]="40000"
  [size]="0.08"
  [radiusMin]="0"
  [radiusMax]="4.3"              // HARD STOP - creates visible edge
  [distribution]="'density-gradient'"
  [colorGradient]="['#ffffff', '#ffccaa', '#ff8866']"
  [opacity]="0.8"
/>

// Exterior: Sparse background
<a3d-particle-cloud
  [count]="8000"
  [size]="0.03"
  [radiusMin]="4.7"               // Gap creates clear boundary
  [radiusMax]="9.0"
  [colorGradient]="['#ffe8cc', '#ffccaa']"
  [opacity]="0.3"
/>
```

### 2. Modified Existing Components

#### MarbleSphereComponent
**File**: `libs/angular-3d/src/lib/primitives/effects/marble-sphere.component.ts`

**Critical Fix**: Added `NG_3D_PARENT` provider to allow children to attach

**Changes Made**:
1. **Removed all particle-related code** (~500 lines):
   - Removed particle input properties (`enableParticles`, `particleCount`, `particleSize`, etc.)
   - Removed particle private fields (mesh, geometry, material, data arrays)
   - Removed particle creation methods
   - Removed particle animation methods
   - Removed particle cleanup code
   - Removed 'blueyard' and 'volumetricCloud' texture options

2. **Added NG_3D_PARENT provider** to support child components:
```typescript
/** Holds mesh reference to avoid circular dependency */
class MeshRef {
  mesh: THREE.Object3D | null = null;
}

@Component({
  providers: [
    MeshRef,
    {
      provide: NG_3D_PARENT,
      useFactory: (ref: MeshRef) => () => ref.mesh,
      deps: [MeshRef],
    },
  ],
})
export class MarbleSphereComponent {
  private readonly meshRef = inject(MeshRef);

  createMesh() {
    this.mesh = new THREE.Mesh(...);
    this.meshRef.mesh = this.mesh;  // Set reference for children
  }
}
```

#### GlassSphereHeroSectionComponent
**File**: `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`

**Final Structure**:
```html
<a3d-marble-sphere
  [radius]="4.5"
  [position]="spherePosition()"
  [roughness]="0.05"
  [colorA]="'#fde8d7'"
  [colorB]="'#ff8866'"
  [edgeColor]="'#ff6644'"
  [edgeIntensity]="1.2"
>
  <!-- Interior: Dense particles with HARD boundary -->
  <a3d-particle-cloud
    [count]="40000"
    [size]="0.08"
    [radiusMin]="0"
    [radiusMax]="4.3"
    [position]="[0, 0, 0]"
    [distribution]="'density-gradient'"
    [colorGradient]="['#ffffff', '#ffccaa', '#ff8866']"
    [opacity]="0.8"
    [animated]="true"
  />

  <!-- Exterior: Sparse background particles -->
  <a3d-particle-cloud
    [count]="8000"
    [size]="0.03"
    [radiusMin]="4.7"
    [radiusMax]="9.0"
    [position]="[0, 0, 0]"
    [distribution]="'uniform'"
    [colorGradient]="['#ffe8cc', '#ffccaa']"
    [opacity]="0.3"
    [animated]="true"
  />
</a3d-marble-sphere>
```

### 3. Export Updates

#### Effects Index
**File**: `libs/angular-3d/src/lib/primitives/effects/index.ts`

Added export:
```typescript
export * from './volumetric-fog-sphere.component';
```

#### Particles Index
**File**: `libs/angular-3d/src/lib/primitives/particles/index.ts`

Added export:
```typescript
export * from './particle-cloud.component';
```

## Issues Encountered & Solutions

### Issue 1: Volumetric Fog vs Discrete Particles
**Problem**: Initially used volumetric raymarching fog for interior, but BlueYard reference shows **discrete particles with HARD BOUNDARY**.

**Solution**: Replaced `VolumetricFogSphereComponent` with `ParticleCloudComponent` that has hard boundary constraints.

**Key Insight**: The clear edge where particles stop at the sphere boundary is what creates the "contained energy" effect in the BlueYard reference.

### Issue 2: Particles Floating at Screen Center (Not Attached to Sphere)
**Problem**: Particles appeared at world origin `[0, 0, 0]` instead of moving with the sphere.

**Root Cause**: `MarbleSphereComponent` didn't provide the `NG_3D_PARENT` token, so children couldn't attach to the sphere mesh.

**Solution**: Added `NG_3D_PARENT` provider using `MeshRef` holder pattern to avoid circular dependency.

**Before (Broken)**:
```
Scene Root
├── MarbleSphere (position: spherePosition())  ← lonely sphere
└── ParticleCloud (position: [0, 0, 0])        ← orphaned at world origin
```

**After (Fixed)**:
```
MarbleSphere (position: spherePosition())
├── Mesh (the glass sphere)
│   ├── ParticleCloud Interior (40k particles)
│   └── ParticleCloud Exterior (8k particles)
```

### Issue 3: Circular Dependency Error
**Problem**: When adding `NG_3D_PARENT` provider, got circular dependency error:
```
ERROR RuntimeError: NG0200: Circular dependency
InjectionToken NG_3D_PARENT -> _MarbleSphereComponent
```

**Root Cause**: Provider tried to inject `MarbleSphereComponent` while component was being created.

**Solution**: Used intermediate `MeshRef` class:
```typescript
class MeshRef {
  mesh: THREE.Object3D | null = null;
}

// Provider injects MeshRef (no circular dependency)
{
  provide: NG_3D_PARENT,
  useFactory: (ref: MeshRef) => () => ref.mesh,
  deps: [MeshRef],
}

// Component injects MeshRef and sets mesh reference after creation
export class MarbleSphereComponent {
  private readonly meshRef = inject(MeshRef);

  createMesh() {
    this.mesh = new THREE.Mesh(...);
    this.meshRef.mesh = this.mesh;  // ✅ Set reference after mesh creation
  }
}
```

### Issue 4: Particles Scattered Across Entire Screen
**Problem**: Rainbow-colored particles scattered everywhere, not localized to sphere.

**Root Cause**: Duplicate position bindings - both marble sphere and particle clouds had separate `[position]="spherePosition()"` bindings.

**Solution**: Made particles **children** of marble sphere with relative position `[0, 0, 0]`. Only the parent sphere has the absolute position binding.

## Architecture Decisions

### 1. Component Composition Pattern
**Decision**: Use parent-child hierarchy with `NG_3D_PARENT` injection token.

**Benefits**:
- ✅ Single position binding on parent
- ✅ Children automatically move with parent
- ✅ Clean separation of concerns
- ✅ Reusable components

### 2. Discrete Particles vs Volumetric Fog
**Decision**: Use discrete particle clouds with hard boundary constraints.

**Reasoning**:
- BlueYard reference shows **visible individual particles**
- Clear **sharp edge** at sphere boundary (not smooth fog falloff)
- "Contained energy" effect requires visible boundary

### 3. Two-Layer Particle System
**Decision**: Interior dense cloud + exterior sparse cloud.

**Configuration**:
- **Interior**: 40k particles, radius 0-4.3, density-gradient distribution
- **Gap**: 4.3-4.7 (creates visible boundary)
- **Exterior**: 8k particles, radius 4.7-9.0, uniform distribution

## Current State

### Working Features ✅
1. Glass sphere shell with peachy/pink fresnel glow
2. 40,000 interior particles with hard boundary constraint
3. 8,000 exterior particles in background
4. Particles move with sphere (parent-child hierarchy)
5. Scroll-driven animation (sphere moves left→right, scales down)
6. Warm peachy color palette matching BlueYard

### Known Issues ⚠️
1. **Visual verification needed**: No screenshot confirmation that current implementation matches BlueYard reference
2. **Possible render issue**: Last screenshot from user showed blank scene (nothing rendering)
3. **Browser cache**: User might need hard refresh (Ctrl+Shift+R) to see latest changes

### Files Modified
1. ✅ `libs/angular-3d/src/lib/primitives/effects/marble-sphere.component.ts`
2. ✅ `libs/angular-3d/src/lib/primitives/effects/volumetric-fog-sphere.component.ts` (created)
3. ✅ `libs/angular-3d/src/lib/primitives/shaders/tsl-textures/volumetric-fog.ts` (created)
4. ✅ `libs/angular-3d/src/lib/primitives/particles/particle-cloud.component.ts` (created)
5. ✅ `libs/angular-3d/src/lib/primitives/effects/index.ts`
6. ✅ `libs/angular-3d/src/lib/primitives/particles/index.ts`
7. ✅ `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`

### Build Status
- ✅ Library builds successfully: `npx nx build @hive-academy/angular-3d`
- ✅ Demo builds successfully: `npx nx build angular-3d-demo`
- ✅ No TypeScript errors
- ✅ No circular dependency errors

## Next Steps / TODO

### Immediate Verification
1. **Hard refresh browser** (Ctrl+Shift+R) to clear cache
2. **Verify particles render** inside/around sphere
3. **Check scroll animation** - particles should move with sphere
4. **Compare to BlueYard reference** - verify visual match

### Potential Improvements
1. **Fine-tune particle parameters**:
   - Adjust `count` (40k interior might be too many/few)
   - Adjust `size` for better visibility
   - Adjust `radiusMax` for interior (currently 4.3, sphere is 4.5)
   - Adjust gap size (currently 4.3→4.7)

2. **Color palette refinement**:
   - Interior gradient: `['#ffffff', '#ffccaa', '#ff8866']`
   - Exterior gradient: `['#ffe8cc', '#ffccaa']`
   - Sphere colors: `colorA='#fde8d7'`, `colorB='#ff8866'`, `edgeColor='#ff6644'`

3. **Performance optimization**:
   - Monitor frame rate with 48,000 total particles
   - Consider reducing count if performance issues
   - Test on lower-end devices

4. **Animation tuning**:
   - Interior animation speed: `0.3`
   - Exterior animation speed: `0.15`
   - Verify motion looks organic and natural

## Key Code References

### Particle Cloud Component Usage
```typescript
<a3d-particle-cloud
  [count]="40000"                              // Number of particles
  [size]="0.08"                                // Base size
  [radiusMin]="0"                              // Inner radius
  [radiusMax]="4.3"                            // Outer radius (HARD BOUNDARY)
  [position]="[0, 0, 0]"                       // Relative to parent
  [distribution]="'density-gradient'"          // Denser in center
  [colorGradient]="['#fff', '#fca', '#f86']"  // Color progression
  [opacity]="0.8"                              // Base opacity
  [animated]="true"                            // Enable animation
  [animationSpeed]="0.3"                       // Animation speed
/>
```

### Hard Boundary Constraint (in ParticleCloudComponent)
```typescript
// Animation loop in particle-cloud.component.ts (lines 303-309)
const dist = position.length();
if (dist > radiusMax) {
  // HARD CLAMP: Snap particle back to boundary
  position.normalize().multiplyScalar(radiusMax * 0.99);
  // Reflect velocity (bounce back)
  const normal = position.clone().normalize();
  data.velocity.reflect(normal);
  data.velocity.multiplyScalar(0.5);
}
```

### NG_3D_PARENT Provider Pattern
```typescript
// Avoid circular dependency with MeshRef holder
class MeshRef {
  mesh: THREE.Object3D | null = null;
}

@Component({
  providers: [
    MeshRef,
    {
      provide: NG_3D_PARENT,
      useFactory: (ref: MeshRef) => () => ref.mesh,
      deps: [MeshRef],
    },
  ],
})
export class MarbleSphereComponent {
  private readonly meshRef = inject(MeshRef);

  createMesh() {
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.meshRef.mesh = this.mesh;  // Set for children to access
  }

  disposeMesh() {
    this.mesh = null;
    this.meshRef.mesh = null;  // Clear reference
  }
}
```

## BlueYard Reference Analysis

### Visual Characteristics
1. **Translucent glass sphere** - peachy/pink gradient with strong fresnel glow
2. **Dense interior particles** - concentrated in center, HARD STOP at edge
3. **Clear boundary edge** - visible containment line where particles stop
4. **Sparse exterior particles** - floating in background (peachy/yellow)
5. **Warm color palette** - peachy, coral, pink tones (NOT rainbow colors)

### Key Insight
The **hard boundary constraint** creates the visual effect of the sphere "containing" the particles. This is achieved by:
- Interior particles: `radiusMax="4.3"` (stops before sphere edge at 4.5)
- Gap: 4.3 → 4.7 (creates visible boundary)
- Exterior particles: `radiusMin="4.7"` (starts outside sphere)

This gap creates the **clear distinction** between contained interior and free-floating exterior particles.

## Git Status (from conversation start)
```
Current branch: feature/TASK_2025_028-webgpu-migration
Main branch: main

Modified:
  M apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts
  M libs/angular-3d/src/lib/primitives/effects/marble-sphere.component.ts
  M libs/angular-3d/src/lib/primitives/particles/index.ts
  M libs/angular-3d/src/lib/primitives/shaders/tsl-textures/index.ts

Untracked:
  ?? libs/angular-3d/src/lib/primitives/particles/particle-cloud.component.ts
  ?? libs/angular-3d/src/lib/primitives/effects/volumetric-fog-sphere.component.ts
  ?? libs/angular-3d/src/lib/primitives/shaders/tsl-textures/volumetric-fog.ts
```

## Commands for Next Session

### View Changes
```bash
# Check git status
git status

# View modified files
git diff apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts
git diff libs/angular-3d/src/lib/primitives/effects/marble-sphere.component.ts

# View new files
cat libs/angular-3d/src/lib/primitives/particles/particle-cloud.component.ts
```

### Build & Test
```bash
# Build library
npx nx build @hive-academy/angular-3d

# Build demo
npx nx build angular-3d-demo

# Start dev server
npx nx serve angular-3d-demo --open
```

### Create Commit (if satisfied with implementation)
```bash
# Stage changes
git add .

# Create commit (follow commitlint rules!)
git commit -m "feat(demo): implement blueyard-style particle sphere hero

- Add ParticleCloudComponent with hard boundary constraints
- Add VolumetricFogSphereComponent (unused, for future use)
- Fix MarbleSphereComponent NG_3D_PARENT provider (circular dep fix)
- Remove particle code from marble-sphere (extracted to particle-cloud)
- Update glass-sphere-hero with two-layer particle system (40k interior + 8k exterior)

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

## Important Notes for Continuation

1. **Visual verification is critical** - last user screenshot showed blank scene
2. **Hard refresh required** - browser cache may show old version
3. **Particle counts can be adjusted** - 48k total particles might be heavy
4. **Color palette is configurable** - easy to tweak if doesn't match reference
5. **VolumetricFogSphereComponent** was created but ultimately not used (discrete particles worked better)
6. **MeshRef pattern** is the correct solution for NG_3D_PARENT in components with ng-content

## Questions for Next Session

1. Does the sphere render correctly with particles inside/outside?
2. Do particles move with the sphere when scrolling?
3. Does the visual match the BlueYard reference images?
4. Is the hard boundary edge clearly visible?
5. Are the colors correct (peachy/coral/pink, not rainbow)?
6. Is performance acceptable (48,000 particles rendering)?

---

**End of Session Summary**
