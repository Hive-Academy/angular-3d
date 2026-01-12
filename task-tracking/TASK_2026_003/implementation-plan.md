# Implementation Plan - TASK_2026_003 (COMPLETE REWRITE - NEW COMPONENT)

## 📊 Codebase Investigation Summary

### Libraries Discovered

- **@hive-academy/angular-3d**: Three.js wrapper library (D:\projects\angular-3d-workspace\libs\angular-3d)
  - Key exports: MarbleSphereComponent, SparkleCoronaComponent, createMarbleMaterial, TSL textures
  - Documentation: libs\angular-3d\CLAUDE.md
  - Usage examples: marble-sphere.component.ts, sparkle-corona.component.ts

### Patterns Identified

- **Marble Sphere Pattern**: Clean TSL material creation via factory function

  - Evidence: libs\angular-3d\src\lib\primitives\effects\marble-sphere.component.ts
  - Components: MeshStandardNodeMaterial, createMarbleMaterial factory, TSL texture support
  - Conventions: Signal-based inputs, effect-driven initialization, DestroyRef cleanup

- **Surface Particle Emission**: SparkleCoronaComponent pattern

  - Evidence: libs\angular-3d\src\lib\primitives\particles\sparkle-corona.component.ts:90-112
  - Key Method: generateShellPositions() - particles distributed ON sphere surface
  - Pattern: Linear interpolation between innerRadius and outerRadius (shell, not volume)
  - Animation: Per-particle twinkling via opacity BufferAttribute updates

- **Particle Lifecycle Management**: Spawn -> Animate -> Despawn pattern
  - Evidence: sparkle-corona.component.ts:404-429 (animate callback)
  - Pattern: Update BufferAttribute positions/opacities per frame
  - Convention: Use needsUpdate flag for efficient GPU updates

### Integration Points

- **createMarbleMaterial Factory**: libs\angular-3d\src\lib\primitives\shaders\tsl-marble.ts

  - Location: Lines 321-391 (factory function)
  - Interface: MarbleMaterialConfig with colorA/B, edgeColor, interiorTexture support
  - Returns: { colorNode, emissiveNode, roughness, metalness }

- **TSL Textures**: libs\angular-3d\src\lib\primitives\shaders\tsl-textures\space.ts
  - Available: tslCausticsTexture (line 207), tslPhotosphere (line 256)
  - Pattern: Animated procedural textures for sphere interior

---

## 🏗️ Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Brand New Component (NOT modification)
**Rationale**:

- User explicitly requested: "Create a NEW component", "Start completely fresh"
- Glass-sphere particle system is fundamentally broken (particles penetrate sphere interior)
- Reference image shows particles ONLY outside sphere, flowing outward
- Clean-slate approach eliminates technical debt

**Evidence**:

- User feedback: "Don't modify glass-sphere.component.ts at all"
- SparkleCoronaComponent demonstrates correct surface emission pattern (line 90-112)
- Reference screenshot shows corona/halo effect, not interior penetration

**Component Name**: `CoralSphereComponent` (warm peachy theme, descriptive)

### Problem Analysis (Root Causes)

#### Problem 1: Glass-Sphere Particles Penetrate Interior

**Root Cause**: Particles spawn at surface but animation allows bidirectional movement

- Evidence: glass-sphere.component.ts:376-377 - particles start at `radius * 1.0`
- Evidence: glass-sphere.component.ts:463-466 - drift can be positive OR negative
- Impact: Particles flow through sphere, appearing inside it

**Reference Analysis**:

- Screenshot shows particles ONLY outside sphere
- Particles form corona/halo at edge
- No particles visible inside sphere interior

**Solution**: New emission system with outward-only flow

- Spawn at surface (radius \* 1.0)
- Velocity always points AWAY from center
- Fade opacity as distance increases
- Despawn particles beyond max distance

---

#### Problem 2: No Animated Interior for Warmth

**Root Cause**: Need warm glowing peachy interior to match reference

- Reference shows warm coral/peach gradient with depth
- Static colors lack visual interest

**Solution**: Use marble pattern with tslCausticsTexture

- Proven pattern from marble-sphere.component.ts
- Animated caustic texture in peachy colors
- Clean factory-based approach

---

### Component Specifications

#### Component 1: CoralSphereComponent (Brand New)

**Purpose**: Create warm peachy sphere with outward-flowing particle corona

**Pattern**: Marble-Sphere Material + Surface Particle Emission (verified from codebase)
**Evidence**:

- Marble pattern: marble-sphere.component.ts:241-292 (createMesh method)
- Surface emission: sparkle-corona.component.ts:90-112 (generateShellPositions)
- Particle lifecycle: sparkle-corona.component.ts:404-429 (animate callback)

**Responsibilities**:

- Create sphere with marble material (warm peachy, animated caustic interior)
- Spawn particles at sphere surface (radius \* 1.0)
- Animate particles flowing outward only (never inward)
- Fade particles as they travel away (opacity decreases with distance)
- Despawn particles at max distance
- Provide clean, intuitive API for configuration

**Implementation Pattern**:

```typescript
// NEW FILE: libs/angular-3d/src/lib/primitives/effects/coral-sphere.component.ts
// Pattern source: marble-sphere.component.ts + sparkle-corona.component.ts

/**
 * CoralSphereComponent - Warm Peachy Sphere with Outward Particle Corona
 *
 * Creates a semi-transparent sphere with:
 * - Marble-based material with animated caustic interior (warm peachy)
 * - Coral/peach edge glow
 * - Particle emission system that flows OUTWARD from surface
 * - Particles fade and despawn as they travel away
 *
 * @example
 * <a3d-coral-sphere
 *   [radius]="4.5"
 *   [particleCount]="800"
 *   [emissionRate]="0.5"
 * />
 */
@Component({
  selector: 'a3d-coral-sphere',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
})
export class CoralSphereComponent {
  // ========================================================================
  // Sphere Configuration Inputs
  // ========================================================================

  /** Sphere radius (default: 4.5) */
  readonly radius = input<number>(4.5);

  /** Sphere position [x, y, z] */
  readonly position = input<[number, number, number]>([0, 0, 0]);

  /** Sphere scale multiplier */
  readonly scale = input<number>(1.0);

  /** Interior texture type (default: 'caustics') */
  readonly interiorTexture = input<'caustics' | 'photosphere'>('caustics');

  /** Sphere opacity (default: 0.15) */
  readonly opacity = input<number>(0.15);

  // ========================================================================
  // Particle Emission Configuration Inputs
  // ========================================================================

  /** Number of particles in system (default: 800) */
  readonly particleCount = input<number>(800);

  /** Particle size (default: 0.015) */
  readonly particleSize = input<number>(0.015);

  /** Outward flow speed (units/second, default: 0.3) */
  readonly flowSpeed = input<number>(0.3);

  /** Max distance from sphere before despawn (default: 5.5) */
  readonly maxDistance = input<number>(5.5);

  /** Particle colors (default: 5-color peachy palette) */
  readonly particleColors = input<string[]>([
    '#ffffff', // White
    '#fff5e6', // Cream
    '#ffccaa', // Light coral
    '#ff8866', // Coral
    '#ff6644', // Deep orange
  ]);

  /** Base particle opacity (default: 0.6) */
  readonly particleOpacity = input<number>(0.6);

  // ========================================================================
  // Internal State
  // ========================================================================

  private readonly parent = inject(NG_3D_PARENT);
  private readonly renderLoop = inject(RenderLoopService);
  private readonly destroyRef = inject(DestroyRef);

  // Sphere mesh
  private sphereMesh: THREE.Mesh | null = null;
  private sphereGeometry: THREE.SphereGeometry | null = null;
  private sphereMaterial: THREE.MeshStandardNodeMaterial | null = null;

  // Particle system
  private particlePoints: THREE.Points | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.PointsNodeMaterial | null = null;

  // Particle tracking data
  private particleData: Array<{
    distance: number; // Current distance from sphere center
    direction: THREE.Vector3; // Normalized outward direction
    baseOpacity: number; // Base opacity for this particle
  }> = [];

  private particleUpdateCleanup: (() => void) | null = null;

  // ========================================================================
  // Component Initialization
  // ========================================================================

  constructor() {
    // Effect: Create sphere and particles when parent available
    effect(() => {
      const parent = this.parent();
      if (parent && !this.sphereMesh) {
        this.createSphereMesh();
        this.createParticleEmissionSystem();

        parent.add(this.sphereMesh);
        parent.add(this.particlePoints);
      }
    });

    // Effect: Update position
    effect(() => {
      const [x, y, z] = this.position();
      if (this.sphereMesh) this.sphereMesh.position.set(x, y, z);
      if (this.particlePoints) this.particlePoints.position.set(x, y, z);
    });

    // Effect: Update scale
    effect(() => {
      const s = this.scale();
      if (this.sphereMesh) this.sphereMesh.scale.setScalar(s);
      if (this.particlePoints) this.particlePoints.scale.setScalar(s);
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => this.dispose());
  }

  // ========================================================================
  // Sphere Creation (Marble Pattern)
  // ========================================================================

  /**
   * Create sphere mesh with marble material and animated interior texture
   * Pattern: marble-sphere.component.ts:241-292
   */
  private createSphereMesh(): void {
    const radius = this.radius();

    // Create geometry
    this.sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);

    // Create animated interior texture
    const textureType = this.interiorTexture();
    const interiorTexture =
      textureType === 'caustics'
        ? tslCausticsTexture({
            scale: 2,
            speed: 0.5,
            color: new THREE.Color('#ffd4a3'), // Warm peachy
          })
        : tslPhotosphere({
            scale: 2,
            color: new THREE.Color('#ffd4a3'),
            background: new THREE.Color('#ffe8d7'),
          });

    // Create marble material config
    const marbleConfig: MarbleMaterialConfig = {
      colorA: '#ffd4a3', // Warm peachy base
      colorB: '#ffe8d7', // Light peachy
      edgeColor: '#ffaa77', // Coral edge glow
      edgeIntensity: 3.0, // Strong glow
      edgePower: 2.0, // Soft falloff
      interiorTexture: interiorTexture,
      textureBlendMode: 'replace',
      iterations: 16,
      depth: 0.8,
    };

    // Create marble material nodes
    const marble = createMarbleMaterial(marbleConfig);

    // Create material
    this.sphereMaterial = new THREE.MeshStandardNodeMaterial({
      metalness: marble.metalness,
      roughness: marble.roughness,
      transparent: true,
      opacity: this.opacity(),
      side: THREE.DoubleSide,
      depthWrite: false, // Allow particles behind/inside to be visible
    });

    this.sphereMaterial.colorNode = marble.colorNode;
    this.sphereMaterial.emissiveNode = marble.emissiveNode;

    // Create mesh
    this.sphereMesh = new THREE.Mesh(this.sphereGeometry, this.sphereMaterial);
    this.sphereMesh.renderOrder = 2; // Render after particles
  }

  // ========================================================================
  // Particle Emission System (Surface-Based, Outward Flow)
  // ========================================================================

  /**
   * Create particle emission system with outward-only flow
   * Pattern: sparkle-corona.component.ts:90-112 (surface generation)
   */
  private createParticleEmissionSystem(): void {
    const radius = this.radius();
    const count = this.particleCount();
    const size = this.particleSize();

    // Create geometry
    this.particleGeometry = new THREE.BufferGeometry();

    // Initialize position, color, and opacity arrays
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    // Parse particle color palette
    const colorStrings = this.particleColors();
    const threeColors = colorStrings.map((c) => new THREE.Color(c));

    // Generate initial particle positions (AT sphere surface)
    for (let i = 0; i < count; i++) {
      // Random direction on sphere surface
      // Pattern: sparkle-corona.component.ts:99-100
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      // Direction vector (normalized)
      const dirX = Math.sin(phi) * Math.cos(theta);
      const dirY = Math.cos(phi);
      const dirZ = Math.sin(phi) * Math.sin(theta);

      // CRITICAL: Start particles AT sphere surface (radius * 1.0)
      // NOT inside volume
      const startDistance = radius * 1.0;

      // Set position
      const idx = i * 3;
      positions[idx] = dirX * startDistance;
      positions[idx + 1] = dirY * startDistance;
      positions[idx + 2] = dirZ * startDistance;

      // Assign random color from palette
      const colorIndex = Math.floor(Math.random() * threeColors.length);
      const selectedColor = threeColors[colorIndex];
      colors[idx] = selectedColor.r;
      colors[idx + 1] = selectedColor.g;
      colors[idx + 2] = selectedColor.b;

      // Initialize opacity
      opacities[i] = this.particleOpacity();

      // Store particle data for animation
      this.particleData.push({
        distance: startDistance,
        direction: new THREE.Vector3(dirX, dirY, dirZ).normalize(),
        baseOpacity: this.particleOpacity() * (0.5 + Math.random() * 0.5), // Vary opacity
      });
    }

    // Set buffer attributes
    this.particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(opacities, 1));

    // Create circular texture for round particles
    const circularTexture = this.createCircularTexture();

    // Create material
    this.particleMaterial = new THREE.PointsNodeMaterial();
    this.particleMaterial.size = size * 50; // Scale for visibility
    this.particleMaterial.sizeAttenuation = true;
    this.particleMaterial.transparent = true;
    this.particleMaterial.depthWrite = false;
    this.particleMaterial.blending = THREE.AdditiveBlending;
    this.particleMaterial.vertexColors = true;
    this.particleMaterial.map = circularTexture; // Circular sprite

    // Create Points object
    this.particlePoints = new THREE.Points(this.particleGeometry, this.particleMaterial);
    this.particlePoints.frustumCulled = false;
    this.particlePoints.renderOrder = 1; // Render before sphere

    // Setup animation
    this.setupParticleLifecycle();
  }

  /**
   * Create circular texture for point sprite
   * Makes particles appear as round glowing dots instead of squares
   */
  private createCircularTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    // Radial gradient for soft circular glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  /**
   * Setup particle lifecycle animation
   * Spawn -> Flow Outward -> Fade -> Despawn -> Respawn
   *
   * CRITICAL: Particles ONLY flow outward, never inward
   * This prevents particles from penetrating sphere interior
   */
  private setupParticleLifecycle(): void {
    const radius = this.radius();
    const maxDistance = this.maxDistance();
    const flowSpeed = this.flowSpeed();

    const positionAttribute = this.particleGeometry!.getAttribute('position') as THREE.BufferAttribute;
    const opacityAttribute = this.particleGeometry!.getAttribute('opacity') as THREE.BufferAttribute;

    this.particleUpdateCleanup = this.renderLoop.registerUpdateCallback((delta) => {
      const count = this.particleData.length;

      for (let i = 0; i < count; i++) {
        const data = this.particleData[i];

        // FLOW OUTWARD: Increase distance from center
        // NEVER decrease distance (no inward flow)
        data.distance += flowSpeed * delta * 1000;

        // DESPAWN: If particle too far, respawn at surface
        if (data.distance > maxDistance) {
          data.distance = radius * 1.0; // Back to surface

          // Optional: Regenerate random direction for variety
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          data.direction.set(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta)).normalize();
        }

        // UPDATE POSITION: Move along outward direction
        const idx = i * 3;
        positionAttribute.array[idx] = data.direction.x * data.distance;
        positionAttribute.array[idx + 1] = data.direction.y * data.distance;
        positionAttribute.array[idx + 2] = data.direction.z * data.distance;

        // FADE: Opacity decreases with distance from sphere
        // Particles brightest at surface, fade as they travel
        const normalizedDistance = (data.distance - radius) / (maxDistance - radius);
        const fadeFactor = 1.0 - normalizedDistance;
        opacityAttribute.array[i] = data.baseOpacity * fadeFactor;
      }

      positionAttribute.needsUpdate = true;
      opacityAttribute.needsUpdate = true;
    });

    this.destroyRef.onDestroy(() => {
      if (this.particleUpdateCleanup) {
        this.particleUpdateCleanup();
        this.particleUpdateCleanup = null;
      }
    });
  }

  // ========================================================================
  // Cleanup
  // ========================================================================

  private dispose(): void {
    const parent = this.parent();

    // Remove from scene
    if (parent && this.sphereMesh) parent.remove(this.sphereMesh);
    if (parent && this.particlePoints) parent.remove(this.particlePoints);

    // Cleanup animation
    if (this.particleUpdateCleanup) {
      this.particleUpdateCleanup();
      this.particleUpdateCleanup = null;
    }

    // Dispose sphere resources
    this.sphereGeometry?.dispose();
    this.sphereMaterial?.dispose();
    this.sphereMesh = null;

    // Dispose particle resources
    this.particleGeometry?.dispose();
    this.particleMaterial?.dispose();
    this.particleMaterial?.map?.dispose(); // Dispose circular texture
    this.particlePoints = null;
    this.particleData = [];
  }
}
```

**Quality Requirements**:

- **Functional**:
  - Sphere displays warm peachy interior with animated caustic/photosphere texture
  - Coral edge glow visible and configurable
  - Particles spawn at sphere surface (radius \* 1.0)
  - Particles flow outward only (never penetrate interior)
  - Particles fade as they travel away
  - Particles despawn and respawn at surface when reaching max distance
  - Circular glowing particles (not squares)
  - 5-color palette visible
- **Visual**: Matches reference screenshot (corona halo effect, warm peachy sphere)
- **Non-functional**: 60fps maintained with 800 particles + marble raymarching
- **Pattern Compliance**:
  - Uses createMarbleMaterial factory (verified at tsl-marble.ts:321)
  - Uses TSL textures (verified at space.ts:207, 256)
  - Uses surface emission pattern (verified at sparkle-corona.component.ts:90-112)
  - Signal-based inputs (verified pattern)
  - Effect-driven initialization (verified pattern)
  - DestroyRef cleanup (verified pattern)

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\coral-sphere.component.ts (CREATE - brand new file)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\index.ts (MODIFY - add export)

---

#### Component 2: Hero Section Integration

**Purpose**: Replace glass-sphere with new coral-sphere component

**Pattern**: Template component replacement (verified from codebase)
**Evidence**: glass-sphere-hero-section.component.ts:63-82 (existing template)

**Responsibilities**:

- Replace a3d-glass-sphere with a3d-coral-sphere
- Use simplified API (fewer parameters, better defaults)
- Maintain scroll-driven position/scale animations

**Implementation Pattern**:

```typescript
// Pattern source: glass-sphere-hero-section.component.ts
// Updated template (simpler, cleaner API)

<a3d-coral-sphere
  [radius]="4.5"
  [position]="spherePosition()"
  [scale]="sphereScale()"

  <!-- Sphere material (uses defaults: caustics, peachy colors) -->
  [interiorTexture]="'caustics'"  <!-- or 'photosphere' -->
  [opacity]="0.15"

  <!-- Particle emission -->
  [particleCount]="800"
  [particleSize]="0.015"
  [flowSpeed]="0.3"
  [maxDistance]="5.5"
  [particleColors]="['#ffffff', '#fff5e6', '#ffccaa', '#ff8866', '#ff6644']"
  [particleOpacity]="0.6"
/>
```

**Quality Requirements**:

- **Functional**: Hero section works with new component
- **Visual**: Better appearance (correct particle behavior)
- **Maintainability**: Simpler API, cleaner code
- **Backward Compatibility**: NOT required (new component, breaking change is acceptable)

**Files Affected**:

- D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\glass-sphere-hero-section.component.ts (MODIFY)
  - Replace import: GlassSphereComponent → CoralSphereComponent
  - Replace template: <a3d-glass-sphere> → <a3d-coral-sphere>
  - Update parameters to match new API

---

#### Component 3: Library Index Export

**Purpose**: Export new component from library public API

**Pattern**: Library export pattern (verified from codebase)
**Evidence**: libs\angular-3d\src\lib\primitives\effects\index.ts:1-5

**Responsibilities**:

- Add CoralSphereComponent to effects index
- Maintain alphabetical export order

**Implementation Pattern**:

```typescript
// libs/angular-3d/src/lib/primitives/effects/index.ts
export * from './background-cubes.component';
export * from './coral-sphere.component'; // NEW
export * from './glass-sphere.component';
export * from './marble-sphere.component';
export * from './metaball.component';
```

**Files Affected**:

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\index.ts (MODIFY - add export)

---

## 🔗 Integration Architecture

### Integration Points

- **Hero Section → CoralSphere**: Property binding

  - Pattern: Signal-based reactive inputs
  - Evidence: Similar to glass-sphere-hero-section.component.ts:63-82

- **CoralSphere → createMarbleMaterial**: Factory function call

  - Pattern: Pass MarbleMaterialConfig, receive TSL nodes
  - Evidence: marble-sphere.component.ts:256-272

- **CoralSphere → TSL Textures**: Interior texture generation

  - Pattern: Call tslCausticsTexture or tslPhotosphere with config
  - Evidence: space.ts:207-237, 256-271

- **CoralSphere → Surface Emission**: Particle spawning at surface
  - Pattern: generateShellPositions approach from sparkle-corona
  - Evidence: sparkle-corona.component.ts:90-112

### Data Flow

1. **Hero Section Template** (glass-sphere-hero-section.component.ts)

   - Binds to CoralSphereComponent inputs
   - Drives scroll-based position/scale animations via computed signals

2. **CoralSphereComponent** (coral-sphere.component.ts - NEW)

   - Receives configuration via signal inputs
   - Creates TSL interior texture (tslCausticsTexture or tslPhotosphere)
   - Calls createMarbleMaterial factory with peachy config
   - Creates sphere mesh with marble material
   - Spawns particles at sphere surface
   - Registers particle lifecycle animation callback

3. **Particle Lifecycle** (setupParticleLifecycle method)

   - Per-frame: Increase particle distance (outward flow)
   - Check distance: Despawn if > maxDistance, respawn at surface
   - Update position: Move along direction vector
   - Update opacity: Fade based on distance from sphere

4. **RenderLoopService**
   - Executes particle lifecycle updates every frame
   - Updates BufferAttribute positions and opacities
   - Marks attributes as needsUpdate for GPU sync

### Dependencies

**External**:

- three/webgpu (MeshStandardNodeMaterial, PointsNodeMaterial, CanvasTexture, BufferGeometry)
- three/tsl (vec3, time, mix for TSL nodes)

**Internal**:

- createMarbleMaterial (factory function from tsl-marble.ts)
- tslCausticsTexture or tslPhotosphere (TSL texture generators from space.ts)
- RenderLoopService (render loop registration)
- NG_3D_PARENT token (scene graph integration)

---

## 🎯 Quality Requirements (Architecture-Level)

### Functional Requirements

- Sphere displays warm peachy interior with animated texture (caustics or photosphere)
- Coral edge glow visible and tunable
- Particles spawn AT sphere surface (radius \* 1.0), NOT inside
- Particles flow OUTWARD only (never inward, never penetrate interior)
- Particles fade opacity as distance from sphere increases
- Particles despawn at maxDistance, respawn at surface
- Particles appear as circular glowing dots (point sprites with circular texture)
- 5-color particle palette visible (white → cream → coral → orange)
- Visual match to reference screenshot (corona/halo effect outside sphere)

### Non-Functional Requirements

- **Performance**: Maintain 60fps with 800 particles + marble raymarching (16 iterations)
- **Maintainability**: Clean component, proven patterns, no technical debt
- **Simplicity**: Factory-based material, straightforward particle lifecycle
- **Code Quality**: Signal-based inputs, effect-driven init, proper cleanup

### Pattern Compliance

- **Marble Material Pattern**: Use createMarbleMaterial factory - verified at tsl-marble.ts:321-391
- **TSL Textures**: Use tslCausticsTexture or tslPhotosphere - verified at space.ts:207-271
- **Surface Emission**: Spawn particles on sphere surface - verified at sparkle-corona.component.ts:90-112
- **Particle Lifecycle**: Update BufferAttribute per frame - verified at sparkle-corona.component.ts:404-429
- **Signal-Based Inputs**: All inputs use `input<T>()` - verified pattern
- **Effect-Driven Initialization**: Use `effect()` for parent availability - verified pattern
- **DestroyRef Cleanup**: Register cleanup callbacks - verified pattern

---

## 🤝 Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. **WebGPU/Three.js Work**: Component uses Three.js WebGPU renderer and TSL shaders
2. **New Component Creation**: Building from scratch, not modifying existing code
3. **Browser-Specific**: Canvas texture generation, BufferAttribute updates, visual verification
4. **Particle Animation**: Per-frame position/opacity updates, lifecycle management
5. **No Backend Logic**: Pure client-side 3D rendering

### Complexity Assessment

**Complexity**: MEDIUM-HIGH
**Estimated Effort**: 3-4 hours

**Breakdown**:

- **Study Patterns**: 45 minutes (marble-sphere, sparkle-corona, particle lifecycle)
- **Create Sphere Material**: 45 minutes (marble pattern with TSL texture)
- **Create Particle Emission**: 90 minutes (surface spawning, outward flow, fade, despawn)
- **Circular Texture**: 15 minutes (createCircularTexture method)
- **Integration**: 30 minutes (hero section, library exports)
- **Visual Verification**: 30 minutes (compare with reference, iterate parameters)

**Rationale for MEDIUM-HIGH Complexity**:

- Brand new component creation (not modification)
- Combines two patterns (marble-sphere + surface emission)
- Custom particle lifecycle logic (spawn, flow, fade, despawn)
- Must understand BufferAttribute updates for particle animation
- Clear reference implementations to follow (reduces risk)

### Files Affected Summary

**CREATE** (1 file - BRAND NEW):

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\coral-sphere.component.ts
  - Complete new component implementation
  - ~400-500 lines of code
  - Sphere material creation (marble pattern)
  - Particle emission system (surface-based, outward flow)
  - Particle lifecycle animation (spawn, flow, fade, despawn)
  - Circular texture generation for point sprites
  - Signal-based inputs, effect-driven init, cleanup

**MODIFY** (2 files):

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\index.ts

  - Add export: `export * from './coral-sphere.component';`

- D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\sections\glass-sphere-hero-section.component.ts
  - Import: Replace `GlassSphereComponent` with `CoralSphereComponent`
  - Template: Replace `<a3d-glass-sphere>` with `<a3d-coral-sphere>`
  - Update parameters to match new API

**REFERENCE** (read-only):

- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\effects\marble-sphere.component.ts (sphere pattern)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particles\sparkle-corona.component.ts (surface emission)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-marble.ts (factory)
- D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\shaders\tsl-textures\space.ts (textures)
- D:\projects\angular-3d-workspace\docs\Screenshot 2026-01-03 205300.png (visual target)

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **All imports exist in codebase**:

   - createMarbleMaterial from '../shaders/tsl-marble' (coral-sphere.component.ts)
   - MarbleMaterialConfig type from '../shaders/tsl-marble'
   - tslCausticsTexture from '../shaders/tsl-textures'
   - tslPhotosphere from '../shaders/tsl-textures'
   - THREE.CanvasTexture from 'three/webgpu'
   - THREE.BufferAttribute from 'three/webgpu'

2. **All patterns verified from examples**:

   - Marble material creation: marble-sphere.component.ts:256-280
   - TSL texture generation: marble-sphere.component.ts:313-397, space.ts:207-271
   - Surface emission: sparkle-corona.component.ts:90-112
   - Particle lifecycle: sparkle-corona.component.ts:404-429

3. **Library documentation consulted**:

   - libs/angular-3d/CLAUDE.md (component pattern guidelines)

4. **No hallucinated APIs**:
   - All marble functions verified: createMarbleMaterial (tsl-marble.ts:321)
   - All TSL textures verified: tslCausticsTexture (space.ts:207), tslPhotosphere (space.ts:256)
   - All Three.js classes verified: MeshStandardNodeMaterial, PointsNodeMaterial, BufferAttribute, CanvasTexture
   - All patterns verified: Surface emission, particle lifecycle updates

### Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase (marble-sphere, sparkle-corona, TSL textures)
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined (outward-only flow, surface emission)
- [x] Integration points documented
- [x] Files affected list complete (CREATE + MODIFY)
- [x] Developer type recommended (frontend-developer)
- [x] Complexity assessed (MEDIUM-HIGH, 3-4 hours)
- [x] New component creation strategy clear (NOT modification)

---

## 📝 Implementation Strategy Summary

**What NOT To Do** (User Explicitly Requested):

- ❌ NO modifications to glass-sphere.component.ts
- ❌ NO hybrid approach (keeping old particle system)
- ❌ NO bidirectional particle flow (inward/outward)
- ❌ NO particles inside sphere interior

**What TO Do** (Clean-Slate Approach):

- ✅ Create brand new CoralSphereComponent file
- ✅ Use marble-sphere pattern for sphere material
- ✅ Use sparkle-corona pattern for surface particle emission
- ✅ Implement outward-only particle flow (never inward)
- ✅ Fade particles as they travel away
- ✅ Despawn and respawn particles at surface
- ✅ Circular texture for round glowing particles
- ✅ Replace glass-sphere usage in hero section

**Key Architecture Decisions**:

- **Brand New Component**: CoralSphereComponent (not modification)
- **Marble Pattern**: Proven factory-based material creation
- **Surface Emission**: Particles spawn AT surface, not in volume
- **Outward Flow Only**: Particles NEVER penetrate sphere interior
- **Lifecycle Management**: Spawn → Flow → Fade → Despawn → Respawn
- **Reference Patterns**: marble-sphere (material) + sparkle-corona (emission)

**Success Criteria** (from context.md:89-97 + user feedback):

1. ✅ Sphere has warm peachy/coral gradient with animated interior texture
2. ✅ Particles appear as small circular glowing dots
3. ✅ Particles ONLY exist OUTSIDE sphere (corona/halo effect)
4. ✅ Particles flow outward only (never penetrate interior)
5. ✅ 5-color particle palette visible (white → coral → orange)
6. ✅ Visual match to reference screenshot
7. ✅ 60fps performance maintained
8. ✅ Clean, maintainable codebase (no technical debt)

---

## 🎨 Visual Design References

**Reference Screenshot**: D:\projects\angular-3d-workspace\docs\Screenshot 2026-01-03 205300.png

**Analysis Document**: D:\projects\angular-3d-workspace\docs\visual-analysis-and-plan.md

**Target Visual Characteristics** (from reference + user feedback):

- **Sphere**: Warm coral/peach gradient, animated caustic interior, coral edge glow
- **Particles**: Small round dots forming corona/halo OUTSIDE sphere
- **Particle Behavior**: Spawn at surface, flow outward, fade, despawn
- **Overall**: Warm peachy atmosphere, organic particle corona, NO interior penetration

**TSL Texture Recommendation**:

- **Primary Choice**: `tslCausticsTexture` with peachy color (#ffd4a3)
  - Rationale: Underwater caustic patterns create organic, flowing warmth
  - Evidence: space.ts:207-237, matches warm glowing effect
- **Alternative**: `tslPhotosphere` with peachy colors
  - Rationale: Sun surface granulation creates bright glowing center
  - Evidence: space.ts:256-271, matches reference warmth

**Particle Lifecycle Visualization**:

```
Spawn at Surface (r = 4.5)
    ↓ Flow Outward (never inward)
    ↓ Distance increases (4.5 → 5.5)
    ↓ Opacity fades (0.6 → 0.0)
Despawn at maxDistance (r = 5.5)
    ↓ Respawn at Surface (r = 4.5)
    ↓ (cycle repeats)
```

**Recommended Starting Config**:

```typescript
// Sphere material
const marbleConfig: MarbleMaterialConfig = {
  colorA: '#ffd4a3', // Warm peachy base
  colorB: '#ffe8d7', // Light peachy
  edgeColor: '#ffaa77', // Coral edge glow
  edgeIntensity: 3.0,
  edgePower: 2.0,
  interiorTexture: tslCausticsTexture({
    scale: 2,
    speed: 0.5,
    color: new THREE.Color('#ffd4a3'),
  }),
  textureBlendMode: 'replace',
};

// Particle emission
particleCount: 800;
particleSize: 0.015;
flowSpeed: 0.3; // Units per second
maxDistance: 5.5; // Despawn distance
particleColors: ['#ffffff', '#fff5e6', '#ffccaa', '#ff8866', '#ff6644'];
particleOpacity: 0.6; // Base opacity (fades with distance)
```

---

## 🔄 Component Naming & API Design

**Component Name**: `CoralSphereComponent`
**Selector**: `a3d-coral-sphere`

**Rationale**:

- "Coral" reflects warm peachy/coral color theme
- Descriptive and memorable
- Distinguishes from glass-sphere (broken implementation)
- Aligns with library naming conventions (a3d- prefix)

**API Design Philosophy**:

- **Sensible Defaults**: Component works well with minimal configuration
- **Intuitive Parameters**: particleCount, flowSpeed, maxDistance (clear semantics)
- **Composable**: Can customize sphere OR particles independently
- **Type-Safe**: Signal-based inputs with proper TypeScript types

**Example Usage**:

```html
<!-- Minimal (uses defaults) -->
<a3d-coral-sphere />

<!-- Customized sphere -->
<a3d-coral-sphere [radius]="4.5" [interiorTexture]="'photosphere'" [opacity]="0.2" />

<!-- Customized particles -->
<a3d-coral-sphere [particleCount]="1200" [flowSpeed]="0.5" [particleSize]="0.02" />

<!-- Fully customized -->
<a3d-coral-sphere [radius]="4.5" [position]="[0, -1, 0]" [scale]="1.2" [interiorTexture]="'caustics'" [opacity]="0.15" [particleCount]="800" [particleSize]="0.015" [flowSpeed]="0.3" [maxDistance]="5.5" [particleColors]="customColors" [particleOpacity]="0.6" />
```

---

**Architecture Ready for Team-Leader Decomposition**

**Key Message to Team-Leader**:
This is a **brand new component creation**, NOT a modification or hybrid approach. The developer should:

1. Study marble-sphere.component.ts for sphere material pattern
2. Study sparkle-corona.component.ts for surface particle emission pattern
3. Create new file: coral-sphere.component.ts
4. Implement sphere material creation using createMarbleMaterial factory
5. Implement particle emission system (spawn at surface, flow outward only)
6. Implement particle lifecycle (spawn → flow → fade → despawn → respawn)
7. Add circular texture for point sprites
8. Export from library index
9. Integrate into hero section (replace glass-sphere)
10. Verify visual match with reference screenshot

**Critical Requirement**: Particles MUST flow outward only, NEVER inward. This prevents interior penetration shown in reference image.

**Estimated Timeline**: 3-4 hours for experienced Three.js developer familiar with BufferAttribute updates and particle systems.
