# Implementation Plan - TASK_2026_001

## Title

Glass Sphere Flocking Animation System with 3-Group Particle Architecture

## Overview

Replace the current smooth wave-based particle animation (lines 552-605) in `glass-sphere.component.ts` with a sophisticated flocking/boids algorithm featuring three independent particle groups with distinct visual characteristics. The implementation will use spatial partitioning for optimal performance with 90,000 particles while maintaining 60 FPS.

---

## Architecture Design

### 1. Multi-Group Particle System

#### Current Architecture (Single Group)

```typescript
// ONE InstancedMesh for all particles
private particlesMesh: THREE.InstancedMesh | null = null;
private particlesGeometry: THREE.PlaneGeometry | null = null;
private particlesMaterial: MeshBasicNodeMaterial | null = null;
private particleData: ParticleData[] = [];
```

#### New Architecture (Three Groups)

```typescript
// THREE separate InstancedMesh instances for render order control
private particleGroups: ParticleGroup[] = [];  // Array of 3 groups

interface ParticleGroup {
  mesh: THREE.InstancedMesh;
  geometry: THREE.PlaneGeometry;
  material: MeshBasicNodeMaterial;
  startIndex: number;  // Index into unified particle data array
  count: number;       // Number of particles in this group
}

// UNIFIED particle simulation data (all 90k particles)
private particleData: ParticleData[] = [];  // Length: 90,000

interface ParticleData {
  position: THREE.Vector3;     // Current position
  velocity: THREE.Vector3;     // Current velocity
  basePosition: THREE.Vector3; // Original spawn position
  groupIndex: 0 | 1 | 2;       // Which visual group (0=dust, 1=medium, 2=large)
}
```

**Key Design Decision: Unified vs Separate Simulation**

- ✅ **UNIFIED**: All 90k particles share ONE flocking simulation
- ❌ NOT separate simulations per group (unnecessary complexity)
- Visual grouping is for rendering only (size/color/opacity)
- All particles see each other as neighbors in flocking algorithm

---

### 2. Signal Inputs for 3-Group Configuration

```typescript
// ============================================================================
// Group 1: Tiny Dust Particles (Background Ambient)
// ============================================================================

/** Number of tiny dust particles (default: 50000, 55% of total) */
public readonly group1Count = input<number>(50000);

/** Base size for group 1 particles (default: 0.08) */
public readonly group1Size = input<number>(0.08);

/** Size variation range for group 1: [min, max] multiplier */
public readonly group1SizeVariation = input<[number, number]>([0.5, 1.0]);

/** Color palette for group 1 (white to cream) */
public readonly group1Colors = input<string[]>(['#ffffff', '#fff5e6']);

/** Opacity for group 1 (default: 0.3 for subtle atmosphere) */
public readonly group1Opacity = input<number>(0.3);

// ============================================================================
// Group 2: Medium Core Particles (Main Visual Mass)
// ============================================================================

/** Number of medium core particles (default: 30000, 33% of total) */
public readonly group2Count = input<number>(30000);

/** Base size for group 2 particles (default: 0.15) */
public readonly group2Size = input<number>(0.15);

/** Size variation range for group 2: [min, max] multiplier */
public readonly group2SizeVariation = input<[number, number]>([1.0, 1.5]);

/** Color palette for group 2 (coral to peach) */
public readonly group2Colors = input<string[]>(['#ffccaa', '#ff8866']);

/** Opacity for group 2 (default: 0.6 for visible but not dominant) */
public readonly group2Opacity = input<number>(0.6);

// ============================================================================
// Group 3: Large Bright Spots (Accent Highlights)
// ============================================================================

/** Number of large highlight particles (default: 10000, 12% of total) */
public readonly group3Count = input<number>(10000);

/** Base size for group 3 particles (default: 0.25) */
public readonly group3Size = input<number>(0.25);

/** Size variation range for group 3: [min, max] multiplier */
public readonly group3SizeVariation = input<[number, number]>([1.5, 2.5]);

/** Color palette for group 3 (bright coral to red-orange) */
public readonly group3Colors = input<string[]>(['#ff6644', '#ff4422']);

/** Opacity for group 3 (default: 0.85 for prominent highlights) */
public readonly group3Opacity = input<number>(0.85);

// ============================================================================
// Flocking Parameters
// ============================================================================

/** Distance threshold for neighbor detection (default: 0.8) */
public readonly flockingNeighborDistance = input<number>(0.8);

/** Separation force weight (avoid crowding, default: 1.5) */
public readonly flockingSeparationWeight = input<number>(1.5);

/** Alignment force weight (match neighbor heading, default: 0.5) */
public readonly flockingAlignmentWeight = input<number>(0.5);

/** Cohesion force weight (move toward center of mass, default: 0.8) */
public readonly flockingCohesionWeight = input<number>(0.8);

/** Maximum particle speed (default: 0.015 units/frame) */
public readonly flockingMaxSpeed = input<number>(0.015);

/** Velocity damping factor (default: 0.95 for smooth motion) */
public readonly flockingDampingFactor = input<number>(0.95);

/** Spatial grid resolution (default: 10 = 10x10x10 voxel grid) */
public readonly spatialGridResolution = input<number>(10);
```

---

### 3. Flocking Algorithm Implementation

#### Core Boids Algorithm (Reynolds, 1987)

```typescript
/**
 * Calculate flocking forces for a particle based on its neighbors
 */
private calculateFlockingForces(
  particleIndex: number,
  neighbors: number[],
  params: FlockingParams
): THREE.Vector3 {
  const data = this.particleData[particleIndex];
  const force = new THREE.Vector3();

  if (neighbors.length === 0) return force;

  // 1. SEPARATION: Steer away from too-close neighbors
  const separationForce = new THREE.Vector3();
  let separationCount = 0;

  for (const neighborIdx of neighbors) {
    const neighborData = this.particleData[neighborIdx];
    const diff = data.position.clone().sub(neighborData.position);
    const dist = diff.length();

    // Only apply separation if within threshold
    if (dist < params.neighborDistance && dist > 0.001) {
      // Inverse square falloff (stronger when closer)
      const weight = 1.0 / (dist * dist);
      diff.normalize().multiplyScalar(weight);
      separationForce.add(diff);
      separationCount++;
    }
  }

  if (separationCount > 0) {
    separationForce.divideScalar(separationCount);
    separationForce.normalize().multiplyScalar(params.separationWeight);
    force.add(separationForce);
  }

  // 2. ALIGNMENT: Match average velocity of neighbors
  const alignmentForce = new THREE.Vector3();
  for (const neighborIdx of neighbors) {
    alignmentForce.add(this.particleData[neighborIdx].velocity);
  }
  alignmentForce.divideScalar(neighbors.length);
  alignmentForce.sub(data.velocity); // Steering force
  alignmentForce.normalize().multiplyScalar(params.alignmentWeight);
  force.add(alignmentForce);

  // 3. COHESION: Move toward center of mass of neighbors
  const cohesionForce = new THREE.Vector3();
  for (const neighborIdx of neighbors) {
    cohesionForce.add(this.particleData[neighborIdx].position);
  }
  cohesionForce.divideScalar(neighbors.length);
  cohesionForce.sub(data.position); // Direction to center
  cohesionForce.normalize().multiplyScalar(params.cohesionWeight);
  force.add(cohesionForce);

  return force;
}
```

#### Boundary Constraint Force

```typescript
/**
 * Generate soft force to keep particles within sphere radius
 */
private calculateBoundaryForce(
  position: THREE.Vector3,
  radius: number
): THREE.Vector3 {
  const dist = position.length();
  const force = new THREE.Vector3();

  // Start repelling when > 90% of radius
  const threshold = radius * 0.9;
  if (dist > threshold) {
    // Stronger force as particle gets closer to boundary
    const excess = (dist - threshold) / (radius - threshold);
    const strength = Math.pow(excess, 2) * 0.1; // Quadratic falloff

    force.copy(position).normalize().multiplyScalar(-strength);
  }

  return force;
}
```

---

### 4. Spatial Partitioning System

**Critical for 90k Particles**: Without spatial partitioning, neighbor lookup is O(n²) = 8.1 billion checks per frame. With grid, it's O(k) where k ≈ 100-200 particles per voxel.

#### Spatial Grid Structure

```typescript
/**
 * 3D spatial hash grid for fast neighbor lookups
 */
class SpatialGrid {
  private grid: Map<string, number[]> = new Map();
  private resolution: number;
  private cellSize: number;
  private radius: number;

  constructor(radius: number, resolution: number) {
    this.radius = radius;
    this.resolution = resolution;
    // Cell size covers the sphere diameter divided by resolution
    this.cellSize = (radius * 2) / resolution;
  }

  /**
   * Convert 3D position to grid cell key
   */
  private getGridKey(position: THREE.Vector3): string {
    const x = Math.floor((position.x + this.radius) / this.cellSize);
    const y = Math.floor((position.y + this.radius) / this.cellSize);
    const z = Math.floor((position.z + this.radius) / this.cellSize);
    return `${x},${y},${z}`;
  }

  /**
   * Clear grid and rebuild from current particle positions
   */
  public rebuild(particleData: ParticleData[]): void {
    this.grid.clear();

    for (let i = 0; i < particleData.length; i++) {
      const key = this.getGridKey(particleData[i].position);
      if (!this.grid.has(key)) {
        this.grid.set(key, []);
      }
      this.grid.get(key)!.push(i);
    }
  }

  /**
   * Get neighboring particles within searchRadius
   */
  public getNeighbors(position: THREE.Vector3, searchRadius: number, particleData: ParticleData[]): number[] {
    const neighbors: number[] = [];
    const searchCells = Math.ceil(searchRadius / this.cellSize);

    // Get current cell coordinates
    const centerX = Math.floor((position.x + this.radius) / this.cellSize);
    const centerY = Math.floor((position.y + this.radius) / this.cellSize);
    const centerZ = Math.floor((position.z + this.radius) / this.cellSize);

    // Check all cells within searchRadius
    for (let dx = -searchCells; dx <= searchCells; dx++) {
      for (let dy = -searchCells; dy <= searchCells; dy++) {
        for (let dz = -searchCells; dz <= searchCells; dz++) {
          const key = `${centerX + dx},${centerY + dy},${centerZ + dz}`;
          const cell = this.grid.get(key);

          if (cell) {
            for (const particleIdx of cell) {
              const dist = position.distanceTo(particleData[particleIdx].position);
              if (dist <= searchRadius) {
                neighbors.push(particleIdx);
              }
            }
          }
        }
      }
    }

    return neighbors;
  }
}
```

---

### 5. Animation Loop (Replaces Lines 552-605)

```typescript
/**
 * Initialize flocking animation update loop
 */
private initializeFlockingAnimation(): void {
  const radius = this.radius();
  const params = {
    neighborDistance: this.flockingNeighborDistance(),
    separationWeight: this.flockingSeparationWeight(),
    alignmentWeight: this.flockingAlignmentWeight(),
    cohesionWeight: this.flockingCohesionWeight(),
    maxSpeed: this.flockingMaxSpeed(),
    dampingFactor: this.flockingDampingFactor(),
  };

  // Initialize spatial grid
  const spatialGrid = new SpatialGrid(radius, this.spatialGridResolution());

  this.particleUpdateCleanup = this.renderLoop.registerUpdateCallback((delta) => {
    if (this.particleGroups.length === 0) return;

    // 1. Rebuild spatial grid with current positions
    spatialGrid.rebuild(this.particleData);

    // 2. Update each particle
    for (let i = 0; i < this.particleData.length; i++) {
      const data = this.particleData[i];

      // Find neighbors using spatial grid (fast O(k) lookup)
      const neighbors = spatialGrid.getNeighbors(
        data.position,
        params.neighborDistance,
        this.particleData
      );

      // Calculate flocking forces
      const flockingForce = this.calculateFlockingForces(i, neighbors, params);

      // Calculate boundary force
      const boundaryForce = this.calculateBoundaryForce(data.position, radius);

      // Combine forces
      const totalForce = flockingForce.add(boundaryForce);

      // Update velocity with damping
      data.velocity.add(totalForce.multiplyScalar(delta));
      data.velocity.multiplyScalar(params.dampingFactor);

      // Clamp to max speed
      const speed = data.velocity.length();
      if (speed > params.maxSpeed) {
        data.velocity.normalize().multiplyScalar(params.maxSpeed);
      }

      // Update position
      data.position.add(data.velocity.clone().multiplyScalar(delta * 60));

      // Hard boundary constraint (safety net)
      const dist = data.position.length();
      if (dist > radius) {
        data.position.normalize().multiplyScalar(radius);
        data.velocity.multiplyScalar(0.5); // Reduce velocity on collision
      }
    }

    // 3. Update instance matrices for all three groups
    this.updateInstanceMatrices();
  });

  this.destroyRef.onDestroy(() => {
    if (this.particleUpdateCleanup) {
      this.particleUpdateCleanup();
      this.particleUpdateCleanup = null;
    }
  });
}

/**
 * Update instance matrices for all particle groups
 */
private updateInstanceMatrices(): void {
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const rotation = new THREE.Quaternion();
  const scale = new THREE.Vector3(1, 1, 1);

  for (const group of this.particleGroups) {
    for (let i = 0; i < group.count; i++) {
      const globalIndex = group.startIndex + i;
      const data = this.particleData[globalIndex];

      // Get existing scale (size variation was set during initialization)
      group.mesh.getMatrixAt(i, matrix);
      matrix.decompose(position, rotation, scale);

      // Update only position, keep scale
      matrix.compose(data.position, rotation, scale);
      group.mesh.setMatrixAt(i, matrix);
    }

    group.mesh.instanceMatrix.needsUpdate = true;
  }
}
```

---

### 6. Particle Initialization (createParticleSystem Refactor)

```typescript
/**
 * Create three separate InstancedMesh instances with unified simulation data
 */
private createParticleSystem(parent: THREE.Object3D): void {
  const radius = this.radius();

  // Group configurations
  const groupConfigs = [
    {
      count: this.group1Count(),
      size: this.group1Size(),
      sizeVariation: this.group1SizeVariation(),
      colors: this.group1Colors(),
      opacity: this.group1Opacity(),
    },
    {
      count: this.group2Count(),
      size: this.group2Size(),
      sizeVariation: this.group2SizeVariation(),
      colors: this.group2Colors(),
      opacity: this.group2Opacity(),
    },
    {
      count: this.group3Count(),
      size: this.group3Size(),
      sizeVariation: this.group3SizeVariation(),
      colors: this.group3Colors(),
      opacity: this.group3Opacity(),
    },
  ];

  let globalParticleIndex = 0;

  // Create each group
  for (let groupIdx = 0; groupIdx < groupConfigs.length; groupIdx++) {
    const config = groupConfigs[groupIdx];
    const startIndex = globalParticleIndex;

    // Create InstancedMesh for this group
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new MeshBasicNodeMaterial({
      transparent: true,
      opacity: config.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Set material color (use TSL for gradient if multiple colors)
    if (config.colors.length === 1) {
      material.colorNode = vec3(new THREE.Color(config.colors[0]));
    } else {
      // Gradient between colors based on instance index
      const color1 = vec3(new THREE.Color(config.colors[0]));
      const color2 = vec3(new THREE.Color(config.colors[config.colors.length - 1]));
      // Use instance index for variation (requires instanceIndex TSL node)
      material.colorNode = mix(color1, color2, fract(mul(float(0.1), positionLocal.y)));
    }

    const mesh = new THREE.InstancedMesh(geometry, material, config.count);

    // Initialize particle positions and matrices
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    for (let i = 0; i < config.count; i++) {
      // Spawn position (gaussian distribution - center-weighted)
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(2 * Math.random() - 1);
      const r = radius * Math.pow(Math.random(), 0.33) * 0.9; // Power < 1 = center bias

      position.set(
        r * Math.sin(theta) * Math.cos(phi),
        r * Math.sin(theta) * Math.sin(phi),
        r * Math.cos(theta)
      );

      // Size variation
      const [minVar, maxVar] = config.sizeVariation;
      const sizeMultiplier = minVar + Math.random() * (maxVar - minVar);
      const particleSize = config.size * sizeMultiplier;
      scale.set(particleSize, particleSize, particleSize);

      // Set matrix
      matrix.compose(position, rotation, scale);
      mesh.setMatrixAt(i, matrix);

      // Store particle data for simulation
      this.particleData.push({
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
        basePosition: position.clone(),
        groupIndex: groupIdx as 0 | 1 | 2,
      });

      globalParticleIndex++;
    }

    mesh.instanceMatrix.needsUpdate = true;

    // Add to parent (NOT as child of glass mesh - fixes WebGPU transparency)
    parent.add(mesh);

    // Store group reference
    this.particleGroups.push({
      mesh,
      geometry,
      material,
      startIndex,
      count: config.count,
    });
  }

  // Initialize flocking animation
  this.initializeFlockingAnimation();
}
```

---

### 7. Backward Compatibility Strategy

**Goal**: Existing demos using legacy single-group inputs should continue working.

```typescript
/**
 * Backward compatibility layer: If group inputs are NOT customized,
 * use legacy single-group inputs to populate group 1
 */
private getEffectiveGroupConfigs(): GroupConfig[] {
  // Check if ANY group input was customized (non-default)
  const isGroup1Customized =
    this.group1Count() !== 50000 ||
    this.group1Size() !== 0.08;

  const isGroup2Customized = this.group2Count() !== 30000;
  const isGroup3Customized = this.group3Count() !== 10000;

  const anyGroupCustomized = isGroup1Customized || isGroup2Customized || isGroup3Customized;

  if (!anyGroupCustomized) {
    // LEGACY MODE: Use old single-group inputs
    return [
      {
        count: this.particleCount(), // Use legacy input
        size: this.particleSize(),
        sizeVariation: this.particleSizeVariation(),
        colors: this.particleColors(),
        opacity: this.particleOpacity(),
      },
      { count: 0, size: 0, sizeVariation: [1, 1], colors: [], opacity: 0 }, // Disabled
      { count: 0, size: 0, sizeVariation: [1, 1], colors: [], opacity: 0 }, // Disabled
    ];
  } else {
    // NEW MODE: Use 3-group inputs
    return [
      {
        count: this.group1Count(),
        size: this.group1Size(),
        sizeVariation: this.group1SizeVariation(),
        colors: this.group1Colors(),
        opacity: this.group1Opacity(),
      },
      {
        count: this.group2Count(),
        size: this.group2Size(),
        sizeVariation: this.group2SizeVariation(),
        colors: this.group2Colors(),
        opacity: this.group2Opacity(),
      },
      {
        count: this.group3Count(),
        size: this.group3Size(),
        sizeVariation: this.group3SizeVariation(),
        colors: this.group3Colors(),
        opacity: this.group3Opacity(),
      },
    ];
  }
}
```

---

## Implementation Steps

### Step 1: Add New Signal Inputs

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: After line 162 (after existing particle inputs)

- Add 15 new signal inputs for 3-group configuration
- Add 6 new signal inputs for flocking parameters
- Add JSDoc comments for each input

**Estimated Time**: 30 minutes

---

### Step 2: Update Internal State Structure

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: After line 196 (Internal State section)

- Change `particlesMesh` from single to `particleGroups: ParticleGroup[]`
- Update `ParticleData` interface to include `groupIndex`
- Add `spatialGrid` instance variable
- Add `flockingParams` interface

**Estimated Time**: 20 minutes

---

### Step 3: Implement Spatial Grid Class

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: After line 638 (end of current class)

- Add `SpatialGrid` class as private inner class
- Implement `rebuild()`, `getGridKey()`, `getNeighbors()` methods
- Add unit tests for spatial grid accuracy

**Estimated Time**: 2 hours

---

### Step 4: Implement Flocking Algorithm Methods

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: After line 638

- Add `calculateFlockingForces()` method
- Add `calculateBoundaryForce()` method
- Add `updateInstanceMatrices()` method

**Estimated Time**: 2 hours

---

### Step 5: Refactor createParticleSystem()

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: Replace lines 380-550

- Create 3 InstancedMesh instances (loop over group configs)
- Initialize particle data with group indices
- Apply size variation per particle
- Apply color gradients using TSL
- Add particles directly to parent (not as children of glass mesh)

**Estimated Time**: 3 hours

---

### Step 6: Replace Wave Animation with Flocking

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: Replace lines 552-605

- Remove wave animation logic entirely
- Replace with `initializeFlockingAnimation()`
- Implement spatial grid rebuild per frame
- Implement force calculation loop
- Implement velocity/position update loop
- Call `updateInstanceMatrices()`

**Estimated Time**: 2 hours

---

### Step 7: Implement Backward Compatibility

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: Before createParticleSystem() call

- Add `getEffectiveGroupConfigs()` method
- Check if group inputs are customized
- Fall back to legacy inputs if not customized

**Estimated Time**: 1 hour

---

### Step 8: Update Disposal Logic

**File**: `libs/angular-3d/src/lib/primitives/effects/glass-sphere.component.ts`
**Lines**: Update lines 610-637

- Loop through `particleGroups` array
- Dispose each group's geometry and material
- Clear `particleData` array

**Estimated Time**: 30 minutes

---

### Step 9: Update Hero Section Template

**File**: `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`
**Lines**: Update template (around line 50-80)

- Add 3-group configuration bindings
- Set group 1: 50k tiny dust (0.08, white/cream, 0.3 opacity)
- Set group 2: 30k medium (0.15, coral/peach, 0.6 opacity)
- Set group 3: 10k large highlights (0.25, bright coral, 0.85 opacity)
- Test visual output

**Estimated Time**: 1 hour

---

### Step 10: Performance Testing & Tuning

**File**: Both files

- Profile with 90,000 particles
- Adjust spatial grid resolution if needed (try 8x8x8, 10x10x10, 12x12x12)
- Tune flocking parameters for desired visual effect
- Verify 60 FPS maintained
- Test on different hardware configurations

**Estimated Time**: 2 hours

---

## Validation Criteria

### Build Validation

```bash
npx nx build angular-3d-demo
# MUST succeed without errors
```

### Visual Validation

- [ ] Three distinct particle size tiers visible (tiny, medium, large)
- [ ] Color gradient spans coral → peach → cream → white
- [ ] Opacity layering creates visual depth (0.3 → 0.6 → 0.85)
- [ ] Particles cluster organically (no uniform distribution)
- [ ] Clusters drift and swirl smoothly
- [ ] Visible density variation (dense pockets, sparse areas)
- [ ] Matches reference image (`docs\Screenshot 2026-01-03 205300.png`)

### Performance Validation

- [ ] 90,000 particles render at 60 FPS
- [ ] No frame drops or stuttering
- [ ] No console errors or warnings
- [ ] Spatial grid optimization active (check with profiler)

### Behavioral Validation

- [ ] Separation: Particles avoid crowding
- [ ] Alignment: Particles move together in groups
- [ ] Cohesion: Particles cluster toward neighbors
- [ ] Boundary: No particles escape sphere radius
- [ ] Smooth motion: No jitter or teleporting

### Backward Compatibility Validation

- [ ] Existing demos without group inputs still work
- [ ] Legacy `particleCount`, `particleSize` inputs respected
- [ ] No breaking changes to existing API

---

## Risk Mitigation

### Risk 1: Performance Degradation with 90k Particles

**Mitigation**:

- Spatial grid MUST be implemented from day one (not optimization)
- Profile early with full 90k particle count
- Adjustable grid resolution via input (default 10x10x10)
- Consider reducing particle count if 60 FPS not achievable

### Risk 2: Flocking Parameters Difficult to Tune

**Mitigation**:

- Use proven default values from Reynolds paper
- All parameters exposed as inputs for runtime tuning
- Document visual effect of each parameter
- Create parameter presets (calm, energetic, chaotic)

### Risk 3: Spatial Grid Overhead

**Mitigation**:

- Rebuild grid only once per frame (not per particle)
- Use Map<string, number[]> for O(1) cell lookup
- Consider caching neighbor lists if particles move slowly

### Risk 4: Rendering Overhead with 3 Meshes

**Mitigation**:

- Use InstancedMesh (GPU instancing) for all groups
- Additive blending minimizes overdraw issues
- Render order: smallest → largest (back to front)
- Consider merging groups if rendering is bottleneck (unlikely)

---

## Testing Strategy

### Unit Tests (Optional for Complex Logic)

- `SpatialGrid.getNeighbors()` returns correct particle indices
- `calculateFlockingForces()` produces valid force vectors
- `calculateBoundaryForce()` increases near sphere edge

### Visual Regression Tests

- Screenshot comparison with reference image
- Verify 3 size tiers present
- Verify color gradient distribution

### Performance Tests

- FPS measurement with 90k particles
- Profiler check for spatial grid optimization
- Memory leak check (particle cleanup on destroy)

---

## Future Enhancements (Out of Scope)

- Dynamic particle count adjustment based on performance
- Predator/prey extended boids (add repulsion from cursor)
- Per-group flocking behavior (different weights)
- Particle trails/motion blur for fast particles
- Shader-based flocking (compute shaders on GPU)
- User-controllable parameters via UI sliders

---

## References

- Reynolds, C. W. (1987). "Flocks, herds and schools: A distributed behavioral model"
- Three.js InstancedMesh documentation
- Three.js TSL (Three Shading Language) node materials
- Spatial hashing algorithms for 3D particle systems
- WebGPU rendering order and transparency best practices

---

## Estimated Timeline

| Phase     | Task                          | Time           |
| --------- | ----------------------------- | -------------- |
| 1         | Add signal inputs             | 30 min         |
| 2         | Update internal state         | 20 min         |
| 3         | Implement spatial grid        | 2 hours        |
| 4         | Implement flocking methods    | 2 hours        |
| 5         | Refactor createParticleSystem | 3 hours        |
| 6         | Replace animation loop        | 2 hours        |
| 7         | Backward compatibility        | 1 hour         |
| 8         | Update disposal logic         | 30 min         |
| 9         | Update hero section           | 1 hour         |
| 10        | Performance testing           | 2 hours        |
| **TOTAL** |                               | **14.5 hours** |

---

## Success Metrics

- ✅ Build succeeds without errors
- ✅ 90,000 particles at 60 FPS
- ✅ Three visual tiers clearly distinguishable
- ✅ Organic clustering and drift patterns visible
- ✅ Matches reference image aesthetic
- ✅ No console errors or warnings
- ✅ Backward compatibility maintained
