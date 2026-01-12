# Code Logic Review - TASK_2025_017

## Review Summary

| Metric              | Value          |
| ------------------- | -------------- |
| Overall Score       | 6.5/10         |
| Assessment          | NEEDS_REVISION |
| Critical Issues     | 5              |
| Serious Issues      | 12             |
| Moderate Issues     | 8              |
| Failure Modes Found | 25             |

## The 5 Paranoid Questions

### 1. How does this fail silently?

**InstancedParticleTextComponent - Silent Billboard Failure**

- Camera is accessed from `sceneService.camera()` in animation loop
- If camera is null, billboard rotation silently skips
- User sees static particles instead of billboarded particles
- No visual feedback that billboarding failed

**ScrollZoomCoordinatorDirective - Lost Events**

- Event handlers run outside Angular zone for performance
- If component is destroyed mid-wheel event, event processing continues
- Events emitted into destroyed Angular context are silently lost
- No cleanup verification that event handler was removed

**Performance3dDirective - Registration Failures**

- If OBJECT_ID is missing, silently logs warning and skips optimization
- If object not in store yet, silently logs warning and skips
- Component appears to work but performance optimization never happens
- No user-visible indication that optimization is inactive

**Glow3dDirective - Geometry Calculation Failures**

- If target object has no boundingSphere and bounding box calculation fails
- Falls back to baseRadius = 1 silently
- Glow may be completely wrong size for object
- User sees weird-sized glow but no error

**GltfModelComponent - Missing Parent Warning**

- Logs "Parent not ready" or "No parent found" as warnings
- Model never gets added to scene
- User sees nothing but thinks model is loading
- No error state signal exposed to template

### 2. What user action causes unexpected behavior?

**NebulaVolumetricComponent - Text Change Mid-Animation**

- User changes layer count while animation is running
- `clearLayers()` disposes geometries/materials in animation frame
- Causes brief flash or render error as layers are recreated
- Animation loop tries to update uniforms on disposed materials

**SpaceFlight3dDirective - Rapid Start/Stop Cycles**

- User calls `start()` multiple times quickly
- `animationStarted` emits multiple times
- State becomes inconsistent if `flightPath` changes between starts
- No guard against duplicate start calls

**BackgroundCubesComponent - Count Changes**

- User changes `count()` input from 180 to 20
- Computed signal regenerates ALL cubes from scratch
- Brief frame where old cubes disappear before new ones render
- Performance spike as 180 cubes dispose and 20 create

**SmokeParticleTextComponent - Rapid Text Changes**

- User types quickly, changing text input multiple times per second
- Effect creates new particle system for each keystroke
- Canvas operations (getImageData) run on every change
- Old particle systems may not dispose before new ones create

**InstancedParticleTextComponent - Empty Text Input**

- User clears text input to empty string
- `sampleTextCoordinates` creates empty texture coordinates array
- `updateParticles()` creates empty particles array
- `recreateInstancedMesh()` creates InstancedMesh with count=0
- THREE.InstancedMesh with 0 instances may cause WebGL warnings

### 3. What data makes this produce wrong results?

**AdvancedPerformanceOptimizerService - Invalid Renderer Info**

- `updateMetrics` accesses `renderer?.info?.render?.calls`
- If renderer has no info object (old Three.js version), crashes
- If renderer.info.render is undefined, `drawCalls` becomes 0 silently
- Metrics are wrong but service continues with bad data

**LambertMaterialDirective - Color Format Edge Cases**

- `color` input accepts `ColorRepresentation` (number | string | Color)
- If user passes THREE.Color instance, conversion to hex for store fails
- `color.getHex()` works but `typeof color` checks fail
- Material updates but store doesn't sync

**PhysicalMaterialDirective - Invalid IOR Values**

- User sets `ior="0"` or negative value
- Three.js MeshPhysicalMaterial accepts any number
- Produces physically impossible refraction
- No validation or clamping

**BackgroundCubesComponent - Exclusion Zone Larger Than Viewport**

- User sets `exclusionZone: { x: 50, y: 50 }` with `viewportBounds: { x: 30, y: 20 }`
- Zone calculations create negative ranges: `{ min: -30, max: -50 }`
- Cubes generate in invalid positions
- Some zones may have no cubes at all

**SmokeParticleTextComponent - Unicode/Emoji Text**

- User inputs emoji "🚀🌟💫"
- Canvas font rendering may fail or produce unexpected glyphs
- Canvas width/height calculations wrong for multi-byte characters
- Particle positions don't match visual text

### 4. What happens when dependencies fail?

**All Particle Text Components - Canvas Context Failure**

- `document.createElement('canvas').getContext('2d')` returns null (rare but possible in SSR/worker)
- InstancedParticleTextComponent throws: `Error('Failed to get 2D context')`
- SmokeParticleTextComponent returns empty array silently
- GlowParticleTextComponent returns empty array silently
- Inconsistent error handling strategies

**GltfModelComponent - Loader Service Failure**

- `gltfLoader.load()` throws error (file not found, network error)
- GltfLoaderService may return signal with error state
- Component effect reads `data()` which is null/undefined
- Model never loads but no error UI shown
- Silent failure - user sees nothing

**EffectComposerService - Composer Initialization Failure**

- `new EffectComposer(renderer)` may fail if renderer is invalid
- No try-catch around EffectComposer creation
- Service state becomes inconsistent (`composer` is null but `isEnabled` is true)
- Crashes on first `composer.render()` call

**Performance3dDirective - Optimizer Service Missing**

- If AdvancedPerformanceOptimizerService is not provided by Scene3dComponent
- DI will throw error at component creation (good)
- BUT: If provided but `initialize()` never called, service doesn't work
- Directive silently registers objects with uninitialized optimizer

**ScrollZoomCoordinatorDirective - Camera Missing**

- `sceneService.camera()` returns null (camera not initialized yet)
- `handleWheel` accesses `camera.position.z` on null
- Crashes wheel event handler
- User can't scroll page at all

### 5. What's missing that the requirements didn't mention?

**Loading States for Async Operations**

- GltfModelComponent has no `isLoading()` signal
- Particle text components don't expose "generating" state
- User has no way to show loading spinner while complex particle systems initialize
- Canvas operations can take 100ms+ for large text

**Error Recovery Mechanisms**

- No retry logic for GLTF loading failures
- No fallback if canvas operations fail
- No degraded mode if WebGL context lost
- All failures are permanent with no recovery path

**Performance Budgets/Throttling**

- Particle text components can create 10,000+ particles with no limit
- No warning when `particleDensity * textLength` exceeds reasonable count
- BackgroundCubesComponent generates 180 cubes instantly with no batching
- User can easily create 500+ cubes and freeze browser

**Memory Leak Prevention Verification**

- No explicit texture.dispose() verification after material.dispose()
- Canvas elements created in effects not explicitly nulled
- WebGL context leak risk if renderer.dispose() order wrong
- No memory profiling or leak detection tests

**Null/Undefined Guard Patterns**

- Many components assume parent() returns valid object
- NG_3D_PARENT injection doesn't verify parent is ready
- Effect-based initialization races with parent availability
- No standard pattern for "parent not ready yet" state

---

## Failure Mode Analysis

### Failure Mode 1: Camera Billboard Race Condition

**Trigger**: InstancedParticleTextComponent initializes before camera is created
**Symptoms**: Particles render as static squares instead of billboards
**Impact**: HIGH - Core feature broken, no visual feedback
**Current Handling**: Silent skip in animation loop: `if (!camera) return;`
**Recommendation**:

```typescript
// Add initialization check effect
effect(() => {
  const camera = this.sceneService.camera();
  if (camera && !this.billboardingEnabled) {
    this.billboardingEnabled = true;
    console.log('[InstancedParticleText] Billboarding enabled');
  }
});
```

### Failure Mode 2: Material Directive Double-Effect Trap

**Trigger**: LambertMaterialDirective/PhysicalMaterialDirective have 2 effects updating same material
**Symptoms**: Material.needsUpdate called twice per change, store.update() race conditions
**Impact**: MEDIUM - Performance degradation, potential state inconsistency
**Current Handling**: Both effects run independently, no coordination
**Recommendation**: Merge into single effect or use explicit dependency chain

```typescript
// CURRENT (ISSUE):
effect(() => { /* Create material */ });
effect(() => { /* Update material + store */ });

// BETTER:
effect(() => {
  // Create material first run
  if (!this.material) {
    this.material = new THREE.MeshLambertMaterial({ ... });
    this.materialSignal.set(this.material);
  }

  // Update material every run (including first)
  const color = this.color();
  // ... update all properties
  this.material.needsUpdate = true;

  // Update store only if objectId exists
  if (this.objectId) {
    this.store.update(this.objectId, undefined, { color, transparent, opacity });
  }
});
```

### Failure Mode 3: NebulaVolumetricComponent Animation Loop Memory Leak

**Trigger**: Component destroyed while `enableFlow()` is true
**Symptoms**: RenderLoop continues calling animation callback after component destroyed
**Impact**: HIGH - Memory leak, performance degradation over time
**Current Handling**: `renderLoopCleanup?.()` in DestroyRef.onDestroy()
**Issue**: `renderLoopCleanup` is undefined if `enableFlow()` is false at construction

```typescript
// CURRENT (ISSUE):
if (this.enableFlow()) {
  this.renderLoopCleanup = this.renderLoop.registerUpdateCallback(...);
}

this.destroyRef.onDestroy(() => {
  if (this.renderLoopCleanup) { // Only cleans up if flow was enabled
    this.renderLoopCleanup();
  }
});
```

**Recommendation**: Always register cleanup, even if callback does nothing:

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
});
```

### Failure Mode 4: SpaceFlight3dDirective - Empty Flight Path Array

**Trigger**: User provides `[flightPath]="[]"` or removes all waypoints
**Symptoms**: `getTotalDuration()` returns 0, divide-by-zero in rotation calculation
**Impact**: MEDIUM - NaN in rotation values, object disappears or behaves erratically
**Current Handling**: Warns on `start()` but not on runtime if path becomes empty

```typescript
// ISSUE: Division by zero
private getTotalDuration(): number {
  return this.flightPath().reduce((sum, wp) => sum + wp.duration, 0); // Can be 0
}

// Used here:
const rotationSpeed = (Math.PI * 2 * this.rotationsPerCycle()) / totalDuration; // totalDuration can be 0!
```

**Recommendation**: Guard against zero duration:

```typescript
private getTotalDuration(): number {
  const duration = this.flightPath().reduce((sum, wp) => sum + wp.duration, 0);
  return Math.max(duration, 0.01); // Prevent divide-by-zero
}
```

### Failure Mode 5: Performance3dDirective - OBJECT_ID Optional Trap

**Trigger**: Component provides Performance3dDirective but forgets OBJECT_ID provider
**Symptoms**: Warning logged, optimization silently skipped, no runtime error
**Impact**: MEDIUM - Feature silently disabled, hard to debug
**Current Handling**: `inject(OBJECT_ID, { optional: true })` then warns if missing

```typescript
// ISSUE: Optional injection allows silent failure
if (!this.objectId) {
  console.warn('[Performance3dDirective] No OBJECT_ID found - cannot register');
  return;
}
```

**Recommendation**: Make OBJECT_ID required or fail loudly in development:

```typescript
private readonly objectId = inject(OBJECT_ID); // Remove optional

// OR keep optional but fail in dev:
if (!this.objectId) {
  if (!isProduction) {
    throw new Error('[Performance3dDirective] OBJECT_ID is required. Did you forget to provide it?');
  } else {
    console.warn('[Performance3dDirective] No OBJECT_ID - optimization disabled');
  }
  return;
}
```

### Failure Mode 6: Glow3dDirective - Bounding Sphere Missing

**Trigger**: Target mesh has complex geometry without precomputed bounding sphere
**Symptoms**: `computeBoundingSphere()` is called but may fail for invalid geometry
**Impact**: LOW - Glow uses fallback radius of 1, may be wrong size
**Current Handling**: Falls back to radius = 1 if boundingSphere is null

```typescript
// ISSUE: Silent fallback to arbitrary radius
if (!this.targetObject.geometry.boundingSphere) {
  this.targetObject.geometry.computeBoundingSphere();
}
baseRadius = this.targetObject.geometry.boundingSphere?.radius || 1; // Falls back to 1
```

**Recommendation**: Warn when using fallback:

```typescript
if (!this.targetObject.geometry.boundingSphere) {
  this.targetObject.geometry.computeBoundingSphere();
}

if (!this.targetObject.geometry.boundingSphere) {
  console.warn('[Glow3dDirective] Failed to compute bounding sphere, using fallback radius');
  baseRadius = 1;
} else {
  baseRadius = this.targetObject.geometry.boundingSphere.radius;
}
```

### Failure Mode 7: ScrollZoomCoordinatorDirective - Event Listener Leak

**Trigger**: Component destroyed while wheel event is being processed
**Symptoms**: Event listener continues to run after component destroyed
**Impact**: MEDIUM - Memory leak, potential errors accessing destroyed component state
**Current Handling**: `removeEventListener` in DestroyRef.onDestroy()
**Issue**: If event is firing during destroy, handler may run after cleanup

```typescript
// ISSUE: Race between destroy and event firing
this.destroyRef.onDestroy(() => {
  window.removeEventListener('wheel', this.handleWheel);
});

private handleWheel = (event: WheelEvent): void => {
  const camera = this.sceneService.camera(); // May be destroyed
  if (!camera) return; // Good guard, but state may be stale

  // Access this.currentState - may be incorrect if destroy happened
};
```

**Recommendation**: Add destroyed flag:

```typescript
private destroyed = false;

this.destroyRef.onDestroy(() => {
  this.destroyed = true;
  window.removeEventListener('wheel', this.handleWheel);
});

private handleWheel = (event: WheelEvent): void => {
  if (this.destroyed) return;
  // ... rest of handler
};
```

### Failure Mode 8: AdvancedPerformanceOptimizerService - Frustum Culling Stub

**Trigger**: User expects frustum culling to work as documented
**Symptoms**: All objects always visible, no performance gain from culling
**Impact**: HIGH - Advertised feature doesn't work, misleading documentation
**Current Handling**: `isInFrustum()` returns `true` unconditionally with TODO comment

```typescript
private isInFrustum(object: THREE.Object3D, frustum: THREE.Frustum, margin: number): boolean {
  // Simple sphere check using bounding sphere
  // In production, would compute bounding sphere and test against frustum
  // For now, return true (no culling) to avoid breaking existing scenes
  return true; // STUB - NO ACTUAL CULLING
}
```

**Impact Assessment**: This is essentially a stub implementation pretending to work. Users enabling frustum culling get NO benefit.

**Recommendation**: Either implement it or document clearly:

```typescript
/**
 * Check if object is within camera frustum
 *
 * @todo INCOMPLETE IMPLEMENTATION
 * Currently returns true for all objects (no culling).
 * Planned: Compute bounding sphere and test against frustum with margin.
 */
private isInFrustum(object: THREE.Object3D, frustum: THREE.Frustum, margin: number): boolean {
  console.warn('[AdvancedPerformanceOptimizer] Frustum culling not yet implemented');
  return true;
}
```

### Failure Mode 9: BackgroundCubesComponent - Negative Zone Range

**Trigger**: `exclusionZone` larger than `viewportBounds`
**Symptoms**: Zone calculations produce `{ min: 30, max: -30 }` (inverted range)
**Impact**: MEDIUM - Cubes generated in wrong positions or not at all
**Current Handling**: No validation of zone calculations

```typescript
// ISSUE: No validation that zones are valid
// Left zone
{
  x: { min: -bounds.x, max: -exclusion.x }, // If exclusion.x > bounds.x, this is inverted!
  y: { min: -exclusion.y, max: exclusion.y },
  z: { min: depthRange.min, max: depthRange.max },
}
```

**Recommendation**: Validate zones or clamp exclusion:

```typescript
const clampedExclusion = {
  x: Math.min(exclusion.x, bounds.x * 0.9), // Max 90% of viewport
  y: Math.min(exclusion.y, bounds.y * 0.9),
};

// Validate after creating zones
zones.forEach((zone, index) => {
  if (zone.x.min >= zone.x.max || zone.y.min >= zone.y.max) {
    console.error(`[BackgroundCubes] Zone ${index} has invalid range - exclusion too large`);
  }
});
```

### Failure Mode 10: EffectComposerService - Enable Before Init

**Trigger**: BloomEffectComponent calls `enable()` before Scene3dComponent calls `init()`
**Symptoms**: `this.composer` is null when `updateRenderLoop()` runs
**Impact**: HIGH - Postprocessing doesn't work, silent failure
**Current Handling**: No guard against enable() before init()

```typescript
public enable(): void {
  if (this._isEnabled()) return;
  this._isEnabled.set(true);
  this.updateRenderLoop(); // May be called with this.composer === null
}

private updateRenderLoop(): void {
  if (this._isEnabled() && this.composer) { // composer may be null
    this.renderLoop.setRenderFunction(() => {
      this.composer?.render(); // Optional chaining prevents crash but doesn't work
    });
  }
}
```

**Recommendation**: Guard against early enable or queue it:

```typescript
private pendingEnable = false;

public enable(): void {
  if (this._isEnabled()) return;
  this._isEnabled.set(true);

  if (this.composer) {
    this.updateRenderLoop();
  } else {
    this.pendingEnable = true; // Remember to enable after init
  }
}

public init(...): void {
  // ... existing init code

  if (this.pendingEnable) {
    this.pendingEnable = false;
    this.updateRenderLoop();
  }
}
```

---

## Critical Issues

### Issue 1: InstancedParticleTextComponent - Camera Access Race Condition

**File**: `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:160-165`

**Scenario**: Component initializes before camera is created in Scene3dComponent

**Impact**: Billboarding silently fails - particles render as static squares instead of facing camera. Core visual feature broken with no error feedback.

**Evidence**:

```typescript
const cleanup = this.renderLoop.registerUpdateCallback(() => {
  const camera = this.sceneService.camera();
  if (camera) {
    this.animateParticles(camera);
  }
});
```

**Fix**: Add initialization state tracking and warning:

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

---

### Issue 2: Material Directives - Double Effect Anti-Pattern

**Files**:

- `libs/angular-3d/src/lib/directives/materials/lambert-material.directive.ts:89-140`
- `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts:110-161`

**Scenario**: Two effects update the same material on every input change

**Impact**: Performance degradation (2x effect runs), potential race conditions with store.update(), material.needsUpdate called redundantly

**Evidence**:

```typescript
// Effect 1: Create material once
effect(() => {
  if (!this.material) {
    this.material = new THREE.MeshLambertMaterial({ ... });
    this.materialSignal.set(this.material);
  }
});

// Effect 2: Update material properties (runs on EVERY input change, even first run)
effect(() => {
  if (this.material) {
    this.material.color = new THREE.Color(this.color());
    // ... more updates
    this.material.needsUpdate = true;
  }
});
```

**Fix**: Merge into single effect:

```typescript
effect(() => {
  const color = this.color();
  const emissive = this.emissive();
  // ... read all inputs

  if (!this.material) {
    // First run: create
    this.material = new THREE.MeshLambertMaterial({ color, emissive, ... });
    this.materialSignal.set(this.material);
  } else {
    // Subsequent runs: update
    this.material.color = new THREE.Color(color);
    this.material.emissive = new THREE.Color(emissive);
    this.material.needsUpdate = true;
  }

  // Store update (every run if objectId exists)
  if (this.objectId) {
    this.store.update(this.objectId, undefined, { color, transparent, opacity });
  }
});
```

---

### Issue 3: NebulaVolumetricComponent - Conditional Render Loop Cleanup

**File**: `libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts:126-146`

**Scenario**: `enableFlow()` is false at construction, component gets destroyed

**Impact**: If `enableFlow` input changes to true after construction, cleanup function is never registered. Potential memory leak if flow is enabled late.

**Evidence**:

```typescript
// Animation loop
if (this.enableFlow()) {
  this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
    this.layerUniforms.forEach((uniforms) => {
      uniforms['uTime'].value += delta * this.flowSpeed();
    });
  });
}

// Cleanup
this.destroyRef.onDestroy(() => {
  if (this.renderLoopCleanup) {
    // Undefined if enableFlow was false
    this.renderLoopCleanup();
  }
  // ...
});
```

**Fix**: Always register, conditionally execute:

```typescript
this.renderLoopCleanup = this.renderLoop.registerUpdateCallback((delta) => {
  if (this.enableFlow()) {
    this.layerUniforms.forEach((uniforms) => {
      uniforms['uTime'].value += delta * this.flowSpeed();
    });
  }
});

this.destroyRef.onDestroy(() => {
  this.renderLoopCleanup(); // Always defined now
  // ...
});
```

---

### Issue 4: AdvancedPerformanceOptimizerService - Frustum Culling Stub Masquerading as Feature

**File**: `libs/angular-3d/src/lib/services/advanced-performance-optimizer.service.ts:260-270`

**Scenario**: User enables frustum culling expecting performance improvement

**Impact**: Feature documented and exposed but completely non-functional. Returns `true` for all objects (no culling). Misleading to users.

**Evidence**:

```typescript
private isInFrustum(object: THREE.Object3D, frustum: THREE.Frustum, margin: number): boolean {
  // Simple sphere check using bounding sphere
  // In production, would compute bounding sphere and test against frustum
  // For now, return true (no culling) to avoid breaking existing scenes
  return true;
}
```

**Fix**: Either implement properly or make stub status explicit:

```typescript
private isInFrustum(object: THREE.Object3D, frustum: THREE.Frustum, margin: number): boolean {
  if (!isProduction) {
    console.warn('[AdvancedPerformanceOptimizer] Frustum culling not implemented - all objects visible');
  }

  // TODO: Implement bounding sphere frustum test
  // const boundingSphere = new THREE.Sphere();
  // boundingSphere.copy(object.geometry.boundingSphere).applyMatrix4(object.matrixWorld);
  // return frustum.intersectsSphere(boundingSphere);

  return true; // Stub: no culling
}
```

---

### Issue 5: ScrollZoomCoordinatorDirective - Event Handler Runs After Destroy

**File**: `libs/angular-3d/src/lib/directives/scroll-zoom-coordinator.directive.ts:135-182`

**Scenario**: Component destroyed while wheel event is being processed

**Impact**: Memory leak, potential crashes accessing destroyed component state (camera, ngZone, signals)

**Evidence**:

```typescript
this.destroyRef.onDestroy(() => {
  window.removeEventListener('wheel', this.handleWheel);
});

private handleWheel = (event: WheelEvent): void => {
  const camera = this.sceneService.camera(); // sceneService may be destroyed
  if (!camera) return;

  // Accesses this.currentState, this.ngZone, etc.
  // All may be in inconsistent state if destroy happened mid-event
};
```

**Fix**: Add explicit destroyed flag:

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

---

## Serious Issues

### Issue 6: GltfModelComponent - No Loading State Signal

**File**: `libs/angular-3d/src/lib/primitives/gltf-model.component.ts:42-110`

**Scenario**: Model takes 2+ seconds to load

**Impact**: User has no way to show loading spinner. No signal to bind to in template. Model appears broken until it suddenly pops in.

**Fix**: Add loading state signal:

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

---

### Issue 7: Particle Text Components - Canvas Operation Blocking

**Files**:

- `instanced-particle-text.component.ts:200-280`
- `smoke-particle-text.component.ts:138-184`
- `glow-particle-text.component.ts:136-184`

**Scenario**: Large text (20+ characters) at high fontSize triggers expensive canvas operations

**Impact**: `getImageData()` blocks main thread for 100ms+. UI freezes on every text change. No throttling or async handling.

**Fix**: Throttle text updates or move to worker:

```typescript
private textUpdateScheduled = false;

effect(() => {
  const text = this.text();
  const fontSize = this.fontSize();

  if (!this.textUpdateScheduled) {
    this.textUpdateScheduled = true;
    requestAnimationFrame(() => {
      this.textUpdateScheduled = false;
      this.refreshText(text, fontSize);
    });
  }
});
```

---

### Issue 8: Performance3dDirective - OBJECT_ID Optional Creates Silent Failures

**File**: `libs/angular-3d/src/lib/directives/performance-3d.directive.ts:60-95`

**Scenario**: Developer uses directive but forgets to provide OBJECT_ID

**Impact**: Directive silently fails with console warning. Hard to debug in production. Feature doesn't work but no error thrown.

**Fix**: Make OBJECT_ID required in development:

```typescript
private readonly objectId = inject(OBJECT_ID, { optional: !isDevMode() });

afterNextRender(() => {
  if (!this.objectId) {
    const message = '[Performance3dDirective] OBJECT_ID required but not provided';
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

---

### Issue 9: Glow3dDirective - Scale Update Recreates Geometry

**File**: `libs/angular-3d/src/lib/directives/glow-3d.directive.ts:217-252`

**Scenario**: User animates `glowScale` input for pulsing effect

**Impact**: Every frame recreates SphereGeometry. Massive GC pressure. Should update mesh.scale instead.

**Evidence**:

```typescript
effect(() => {
  if (this.glowMesh && this.targetObject) {
    const scale = this.glowScale();
    this.updateGlowScale(scale); // Recreates geometry!
  }
});

private updateGlowScale(scale: number): void {
  // ...
  if (this.glowGeometry) {
    this.glowGeometry.dispose();
  }

  const segments = this.glowSegments();
  this.glowGeometry = new THREE.SphereGeometry(glowRadius, segments, segments);
  this.glowMesh.geometry = this.glowGeometry;
}
```

**Fix**: Use mesh.scale for reactive scaling:

```typescript
// Create geometry once with base size
private createGlowEffect(): void {
  // ...
  const baseGlowRadius = baseRadius; // No scale multiplier
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

---

### Issue 10: SpaceFlight3dDirective - Division by Zero in Rotation

**File**: `libs/angular-3d/src/lib/directives/space-flight-3d.directive.ts:226-229`

**Scenario**: Flight path has waypoints with duration=0, or empty path starts animation

**Impact**: `totalDuration` is 0, `rotationSpeed` becomes Infinity/NaN. Object rotation breaks completely.

**Evidence**:

```typescript
const totalDuration = this.getTotalDuration(); // Can be 0
const rotationSpeed = (Math.PI * 2 * this.rotationsPerCycle()) / totalDuration; // Division by zero!
this.totalRotation += delta * rotationSpeed;
```

**Fix**: Guard against zero/invalid duration:

```typescript
private getTotalDuration(): number {
  const duration = this.flightPath().reduce((sum, wp) => sum + wp.duration, 0);
  if (duration <= 0) {
    console.warn('[SpaceFlight3d] Invalid total duration, using default 1s');
    return 1;
  }
  return duration;
}
```

---

### Issue 11: BackgroundCubesComponent - No Zone Validation

**File**: `libs/angular-3d/src/lib/primitives/background-cubes.component.ts:156-181`

**Scenario**: Exclusion zone larger than viewport bounds

**Impact**: Zones have inverted ranges (min > max). Cubes generate in wrong positions or zones become empty.

**Fix**: Validate and clamp zones:

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

  // Use clamped values for zone calculations
  // ...
}
```

---

### Issue 12: EffectComposerService - Enable Before Init Race

**File**: `libs/angular-3d/src/lib/postprocessing/effect-composer.service.ts:94-107`

**Scenario**: Child component (BloomEffect) calls enable() before parent (Scene3d) calls init()

**Impact**: `updateRenderLoop()` runs with `this.composer === null`. Postprocessing silently fails to activate.

**Fix**: Queue enable until after init:

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

---

### Issue 13: SmokeParticleTextComponent - Unicode/Emoji Handling

**File**: `libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts:138-184`

**Scenario**: User inputs emoji or multi-byte characters: "🚀💫"

**Impact**: `measureText()` and `fillText()` produce incorrect dimensions. Particle positions don't match visual text.

**Fix**: Add font fallback and validation:

```typescript
private sampleTextPositions(text: string, fontSize: number): [number, number][] {
  // Validate text contains renderable characters
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  // Use emoji-compatible font
  ctx.font = `bold ${fontSize}px "Arial", "Segoe UI Emoji", "Apple Color Emoji"`;

  // Warn for potentially problematic characters
  if (/[\u{1F600}-\u{1F64F}]/u.test(text)) {
    console.warn('[SmokeParticleText] Emoji detected - rendering may vary across browsers');
  }

  // ... rest of sampling
}
```

---

### Issue 14: AdvancedPerformanceOptimizerService - Renderer Info Access

**File**: `libs/angular-3d/src/lib/services/advanced-performance-optimizer.service.ts:206-230`

**Scenario**: Old Three.js version or custom renderer without `info` property

**Impact**: `renderer?.info?.render?.calls` crashes or returns undefined. Metrics become 0 silently.

**Fix**: Validate renderer info structure:

```typescript
updateMetrics(delta: number, renderer?: any): void {
  // ... existing FPS calculation

  let drawCalls = 0;
  let triangles = 0;

  if (renderer?.info?.render) {
    drawCalls = renderer.info.render.calls ?? 0;
    triangles = renderer.info.render.triangles ?? 0;
  } else if (renderer) {
    console.warn('[AdvancedPerformanceOptimizer] Renderer missing info.render - metrics limited');
  }

  this.performanceMetrics.set({
    fps,
    frameTime: avgFrameTime,
    drawCalls,
    triangles,
  });
}
```

---

### Issue 15: InstancedParticleTextComponent - Empty Text Handling

**File**: `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts:200-280`

**Scenario**: User sets `text=""` (empty string)

**Impact**: InstancedMesh created with count=0. WebGL warnings. Wasted memory allocation.

**Fix**: Skip mesh creation for empty text:

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

---

### Issue 16: PhysicalMaterialDirective - No IOR Validation

**File**: `libs/angular-3d/src/lib/directives/materials/physical-material.directive.ts:90-98`

**Scenario**: User sets `[ior]="0"` or negative value

**Impact**: Physically impossible refraction. Three.js accepts any value. Visual glitches in transmission rendering.

**Fix**: Validate and clamp IOR:

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

---

### Issue 17: All Particle Components - No Particle Count Limit

**Files**: All 3 particle text components

**Scenario**: User sets `fontSize=200`, `particleDensity=100`, text="HELLO WORLD WELCOME"

**Impact**: Generates 50,000+ particles. Browser freezes. No warning or limit.

**Fix**: Add particle budget with warning:

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

---

## Moderate Issues

### Issue 18: Glow3dDirective - No Performance Degradation Handling

**File**: `libs/angular-3d/src/lib/directives/glow-3d.directive.ts:98`

**Scenario**: `autoAdjustQuality` is true but never actually implemented

**Impact**: Input exists but does nothing. Misleading API.

**Fix**: Either implement or remove input:

```typescript
// Option 1: Remove input
// public readonly autoAdjustQuality = input<boolean>(true); // REMOVE

// Option 2: Implement (inject performance monitor)
private readonly performanceMonitor = inject(PerformanceMonitorService, { optional: true });

effect(() => {
  if (this.autoAdjustQuality() && this.performanceMonitor) {
    const fps = this.performanceMonitor.currentFPS();
    if (fps < 30 && this.glowSegments() > 8) {
      console.log('[Glow3d] Reducing segments for performance');
      this.createGlowEffect(8); // Lower quality
    }
  }
});
```

---

### Issue 19: NebulaVolumetricComponent - Layer Recreation on Every Input Change

**File**: `libs/angular-3d/src/lib/primitives/nebula-volumetric.component.ts:99-112`

**Scenario**: User animates `opacity` input

**Impact**: Every opacity change triggers `clearLayers()` then `createNebulaLayer()` for ALL layers. Massive overhead.

**Evidence**:

```typescript
effect(() => {
  const layerCount = this.layers();
  const width = this.width();
  const height = this.height();

  // Clear existing layers
  this.clearLayers(); // EVERY time width/height/layers changes

  // Create new layers
  for (let i = 0; i < layerCount; i++) {
    this.createNebulaLayer(i, width, height, layerCount);
  }
});
```

**Fix**: Separate geometry updates from uniform updates:

```typescript
// Effect 1: Recreate layers only when structure changes
effect(() => {
  const layerCount = this.layers();
  const width = this.width();
  const height = this.height();

  if (this.needsLayerRecreation(layerCount, width, height)) {
    this.clearLayers();
    for (let i = 0; i < layerCount; i++) {
      this.createNebulaLayer(i, width, height, layerCount);
    }
  }
});

// Effect 2: Update uniforms reactively without recreation
effect(() => {
  const opacity = this.opacity();
  const noiseScale = this.noiseScale();
  this.layerUniforms.forEach((uniforms) => {
    uniforms['uOpacity'].value = opacity;
    uniforms['uNoiseScale'].value = noiseScale;
  });
});
```

---

### Issue 20: BloomEffectComponent - Pass Created Before Composer Init

**File**: `libs/angular-3d/src/lib/postprocessing/effects/bloom-effect.component.ts:57-73`

**Scenario**: BloomEffect component initializes before EffectComposerService.init() called

**Impact**: Pass gets added to composer before renderer size is known. Resolution may be wrong.

**Fix**: Defer pass creation until renderer is ready:

```typescript
effect(() => {
  const renderer = this.sceneService.renderer();
  const composerReady = this.composerService.isEnabled(); // Or add isInitialized signal

  if (renderer && composerReady && !this.pass) {
    const size = new THREE.Vector2();
    renderer.getSize(size);

    this.pass = new UnrealBloomPass(size, this.strength(), this.radius(), this.threshold());
    this.composerService.addPass(this.pass);
  }
});
```

---

### Issue 21: SpaceFlight3dDirective - No Guard Against Duplicate start()

**File**: `libs/angular-3d/src/lib/directives/space-flight-3d.directive.ts:139-161`

**Scenario**: User calls `start()` multiple times rapidly

**Impact**: `animationStarted` emits multiple times, state becomes inconsistent

**Fix**: Add isAnimating guard:

```typescript
start(): void {
  if (this.isAnimating) {
    console.warn('[SpaceFlight3d] Already animating, ignoring duplicate start()');
    return;
  }

  const path = this.flightPath();
  if (path.length === 0) {
    console.warn('[SpaceFlight3dDirective] Cannot start: flightPath is empty');
    return;
  }

  // ... existing logic
}
```

---

### Issue 22: BackgroundCubesComponent - No Memoization for Computed

**File**: `libs/angular-3d/src/lib/primitives/background-cubes.component.ts:140`

**Scenario**: Cubes computed signal uses `Math.random()` - regenerates on EVERY read

**Impact**: If computed is read multiple times (debugging, template re-renders), cubes regenerate with different random positions

**Fix**: Memoize cube generation or use seed:

```typescript
private lastConfig = { count: 0, palette: [], exclusion: { x: 0, y: 0 } };
private memoizedCubes: CubeConfig[] = [];

public readonly cubes = computed(() => {
  const count = this.count();
  const palette = this.colorPalette();
  const exclusion = this.exclusionZone();

  // Only regenerate if inputs actually changed
  if (
    count !== this.lastConfig.count ||
    JSON.stringify(palette) !== JSON.stringify(this.lastConfig.palette) ||
    JSON.stringify(exclusion) !== JSON.stringify(this.lastConfig.exclusion)
  ) {
    this.memoizedCubes = this.generateCubes();
    this.lastConfig = { count, palette, exclusion };
  }

  return this.memoizedCubes;
});
```

---

### Issue 23: LambertMaterialDirective - ColorRepresentation Type Handling

**File**: `libs/angular-3d/src/lib/directives/materials/lambert-material.directive.ts:128-137`

**Scenario**: User passes `THREE.Color` instance instead of number/string

**Impact**: `typeof color` check fails, `color.getHex()` works but conditional logic broken

**Fix**: Robust color conversion:

```typescript
private colorToHex(color: ColorRepresentation): number {
  if (typeof color === 'number') {
    return color;
  } else if (typeof color === 'string') {
    return new THREE.Color(color).getHex();
  } else if (color instanceof THREE.Color) {
    return color.getHex();
  } else {
    console.warn('[LambertMaterial] Unknown color type, using white');
    return 0xffffff;
  }
}

// Use in store update
this.store.update(this.objectId, undefined, {
  color: this.colorToHex(color),
  transparent,
  opacity,
});
```

---

### Issue 24: GltfModelComponent - Material Override Race Condition

**File**: `libs/angular-3d/src/lib/primitives/gltf-model.component.ts:131-141`

**Scenario**: Material override inputs change while model is loading

**Impact**: Effect runs before `this.group` is set. Silently does nothing until next change.

**Fix**: Apply overrides when group is ready:

```typescript
effect(() => {
  const group = this.group;
  if (!group) return; // Guard - wait for group to exist

  // Read all material inputs
  this.colorOverride();
  this.metalness();
  this.roughness();

  this.applyMaterialOverrides(group);
});
```

---

### Issue 25: Performance3dDirective - Store Timing Race

**File**: `libs/angular-3d/src/lib/directives/performance-3d.directive.ts:85-91`

**Scenario**: `afterNextRender` fires but object not in store yet

**Impact**: Warning logged, directive silently fails to register

**Fix**: Retry with small delay or subscribe to store changes:

```typescript
afterNextRender(() => {
  const config = this.normalizeConfig(this.a3dPerformance3d());
  if (!config.enabled || !this.objectId) return;

  // Try immediate registration
  let object = this.sceneStore.getObject(this.objectId);

  if (!object) {
    // Retry after small delay (object may be registering)
    setTimeout(() => {
      object = this.sceneStore.getObject(this.objectId!);
      if (object) {
        this.optimizer.registerObject(this.objectId!, object);
      } else {
        console.error(`[Performance3dDirective] Object ${this.objectId} never registered in store`);
      }
    }, 50);
  } else {
    this.optimizer.registerObject(this.objectId, object);
  }
});
```

---

## Data Flow Analysis

```
PARTICLE TEXT COMPONENTS FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ User Input (text, fontSize, density)                            │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ effect() triggered → sampleTextPositions()                       │
│ ├─ Create canvas element (browser-only)                         │
│ ├─ Render text to canvas                                        │
│ ├─ Call getImageData() [BLOCKING, 100ms+ for large text]        │
│ └─ Sample pixel coordinates                                     │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼ [Gap: No throttling, runs on every keystroke]
┌─────────────────────────────────────────────────────────────────┐
│ generateParticles() / updateParticles()                          │
│ ├─ Create particle data structures                              │
│ ├─ Apply density multiplier [Gap: No limit check]               │
│ └─ Generate 100s-10,000s of particles                           │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ createParticleSystem() / recreateInstancedMesh()                 │
│ ├─ Dispose old system [Gap: Disposal order not guaranteed]      │
│ ├─ Create BufferGeometry                                        │
│ ├─ Create Material                                              │
│ └─ Create Points/InstancedMesh                                  │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ parent.add(particleSystem)                                       │
│ [Gap: No check if parent exists]                                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ RenderLoop animation callbacks                                   │
│ ├─ InstancedParticle: Billboard rotation [Gap: Camera nullable] │
│ ├─ SmokeParticle: Noise-based drift                             │
│ └─ GlowParticle: Pulse + flow animation                         │
└─────────────────────────────────────────────────────────────────┘

MATERIAL DIRECTIVE FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ User sets [color]="0xff0000" on component                        │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Effect 1: Material Creation                                      │
│ if (!this.material) { create + signal.set() }                   │
│ [Runs on EVERY input change, even after created]                │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ Effect 2: Material Update [Gap: Runs in parallel with Effect 1] │
│ if (this.material) { update properties + needsUpdate }          │
│ ├─ material.color = new THREE.Color(color)                      │
│ ├─ material.needsUpdate = true                                  │
│ └─ store.update(objectId, { color, ... })                       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼ [Gap: Race condition - store.update may run before signal.set]
┌─────────────────────────────────────────────────────────────────┐
│ MATERIAL_SIGNAL consumed by MeshDirective                        │
│ mesh.material = signal()                                         │
└─────────────────────────────────────────────────────────────────┘

POSTPROCESSING FLOW:
┌─────────────────────────────────────────────────────────────────┐
│ Scene3dComponent provides EffectComposerService                  │
│ [Gap: Service provided but not initialized until afterNextRender]│
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ BloomEffectComponent initializes [Gap: May run before composer]  │
│ effect() → creates UnrealBloomPass                               │
│ composerService.addPass(pass) [Gap: Composer may be null]       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼ [Race: Child component ready before parent init]
┌─────────────────────────────────────────────────────────────────┐
│ Scene3dComponent.init() eventually calls                         │
│ effectComposer.init(renderer, scene, camera)                     │
│ [Gap: Passes added before init may have wrong resolution]       │
└────────────┬────────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────────┐
│ RenderLoop.setRenderFunction(() => composer.render())            │
│ [Works IF composer initialized, silently fails otherwise]       │
└─────────────────────────────────────────────────────────────────┘
```

### Gap Points Identified:

1. **Particle Text**: No throttling on text input changes - canvas operations block on every keystroke
2. **Material Directives**: Double effect pattern causes redundant runs and potential race conditions
3. **Postprocessing**: Child components (effects) may initialize before parent (composer) is ready
4. **All Components**: Parent() access assumes parent exists - no retry mechanism if parent not ready
5. **Animation Loops**: Camera access in billboarding assumes camera exists - silent failure if null
6. **Resource Disposal**: Order of dispose() calls not guaranteed - may access disposed objects in same frame

---

## Requirements Fulfillment

| Requirement                                | Status   | Concern                                            |
| ------------------------------------------ | -------- | -------------------------------------------------- |
| P0: EffectComposerService component-scoped | COMPLETE | Race condition: enable() before init()             |
| P0: BloomEffect renderer size reactivity   | COMPLETE | Pass may be created before composer init           |
| P0: GltfModel per-scene integration        | COMPLETE | No loading state signal, error handling incomplete |
| P1: InstancedParticleText InstancedMesh    | COMPLETE | Camera access race, no particle count limit        |
| P1: SmokeParticleText drift animation      | COMPLETE | Canvas blocking operations, no throttling          |
| P1: GlowParticleText bloom integration     | COMPLETE | Tight coupling to BloomEffect presence             |
| P1: NebulaVolumetric shader clouds         | COMPLETE | Layer recreation overhead on input changes         |
| P1: FloatingSphere physical material       | COMPLETE | IOR validation missing                             |
| P2: BackgroundCube Lambert material        | COMPLETE | Zone validation missing                            |
| P2: BackgroundCubes distribution           | COMPLETE | Random regeneration on every computed() read       |
| P2: Glow3d BackSide effect                 | COMPLETE | Geometry recreation on scale changes               |
| P2: SpaceFlight3d waypoint animation       | COMPLETE | Division by zero risk, no duplicate start guard    |
| P3: AdvancedPerformanceOptimizer           | PARTIAL  | Frustum culling is stub (returns true always)      |
| P3: Performance3d registration             | COMPLETE | OBJECT_ID optional creates silent failures         |
| P3: ScrollZoomCoordinator transitions      | COMPLETE | Event handler runs after destroy                   |

### Implicit Requirements NOT Addressed:

1. **Loading States**: No `isLoading()` signals for async operations (GLTF, particle generation)
2. **Error Boundaries**: No error state signals, all failures are silent console warnings
3. **Performance Budgets**: No limits on particle counts, texture sizes, geometry complexity
4. **Graceful Degradation**: No fallback modes when features fail (WebGL context loss, etc.)
5. **Memory Profiling**: No instrumentation to detect memory leaks in production
6. **Input Validation**: No validation for physically impossible values (IOR < 1, negative sizes, etc.)

---

## Edge Case Analysis

| Edge Case                      | Handled | How                                     | Concern                           |
| ------------------------------ | ------- | --------------------------------------- | --------------------------------- |
| Empty text input               | NO      | Creates InstancedMesh(count=0)          | WebGL warnings, wasted allocation |
| Camera null during animation   | PARTIAL | Returns early from callback             | Silent failure, no billboarding   |
| Parent not ready during add    | NO      | Logs warning, silently fails            | Model/particles never appear      |
| Extremely large particle count | NO      | No limit checking                       | Browser freezes                   |
| Zero-duration flight path      | NO      | Division by zero in rotation            | NaN in transform matrix           |
| Exclusion zone > viewport      | NO      | Invalid zone ranges                     | Cubes in wrong positions          |
| Material effect double-run     | YES     | Works but inefficient                   | 2x effect executions              |
| Composer enable before init    | NO      | Silent failure                          | Postprocessing doesn't work       |
| Canvas getContext null         | MIXED   | Throws (Instanced), returns [] (others) | Inconsistent error handling       |
| Glow on non-mesh object        | PARTIAL | Falls back to bounding box              | May produce wrong size            |
| Unicode/emoji in text          | NO      | Render issues, wrong dimensions         | Visual glitches                   |
| Renderer missing info property | NO      | Crashes or returns 0                    | Metrics incorrect                 |
| OBJECT_ID missing              | PARTIAL | Warns (Performance3d), ignores (Glow3d) | Silent feature disable            |
| Negative/zero IOR value        | NO      | Physically impossible rendering         | Visual glitches                   |
| Rapid input changes            | NO      | No throttling, blocks main thread       | UI freezes                        |

---

## Integration Risk Assessment

| Integration                | Failure Probability | Impact | Mitigation                                        |
| -------------------------- | ------------------- | ------ | ------------------------------------------------- |
| Particle Text → Camera     | MEDIUM              | HIGH   | Add camera-ready check, expose billboarding state |
| Material Directive → Store | LOW                 | MEDIUM | Current: Merge double-effect pattern              |
| Bloom → Composer           | MEDIUM              | HIGH   | Current: Defer pass creation until init complete  |
| Directive → OBJECT_ID      | MEDIUM              | MEDIUM | Current: Make required in dev mode                |
| Animation → RenderLoop     | LOW                 | LOW    | Good: Cleanup functions always registered         |
| GLTF → Loader Service      | MEDIUM              | MEDIUM | Add: Loading/error state signals                  |
| Glow → Target Object       | LOW                 | MEDIUM | Current: Robust bounding calculation fallback     |
| ScrollZoom → Window Events | MEDIUM              | LOW    | Add: Destroyed flag guard                         |
| Performance3d → Optimizer  | MEDIUM              | HIGH   | Critical: Frustum culling is stub                 |
| Nebula → Shader Uniforms   | LOW                 | LOW    | Good: Uniforms always initialized                 |

---

## Verdict

**Recommendation**: REVISE

**Confidence**: HIGH

**Top Risk**: Silent failures everywhere - camera null, parent null, OBJECT_ID missing, frustum culling not implemented. Users will struggle to debug issues because components fail silently with console warnings instead of throwing errors or exposing error states.

## What Robust Implementation Would Include

A production-ready implementation would have:

### 1. Observable State for All Async Operations

```typescript
// Every component with async work
public readonly isLoading = signal(false);
public readonly error = signal<string | null>(null);
public readonly isReady = signal(false);
```

### 2. Explicit Dependency Validation

```typescript
// Fail fast in development, degrade gracefully in production
constructor() {
  const camera = this.sceneService.camera();
  if (!camera && isDevMode()) {
    throw new Error('[ParticleText] Camera required but not available');
  }
}
```

### 3. Resource Budgets and Limits

```typescript
private readonly MAX_PARTICLES = 10_000;
private readonly MAX_CANVAS_SIZE = 4096;

if (particleCount > this.MAX_PARTICLES) {
  throw new Error(`Particle count ${particleCount} exceeds max ${this.MAX_PARTICLES}`);
}
```

### 4. Retry and Fallback Mechanisms

```typescript
// GLTF loading with retry
const result = await this.loadWithRetry(path, { maxRetries: 3, timeout: 5000 });
if (!result) {
  this.error.set('Failed to load model after 3 retries');
}
```

### 5. Input Validation and Sanitization

```typescript
public readonly ior = input<number>(1.5, {
  transform: (v) => Math.max(1, Math.min(3, v)) // Clamp to valid range
});
```

### 6. Explicit Lifecycle Coordination

```typescript
// Wait for dependencies before initializing
effect(() => {
  const camera = this.sceneService.camera();
  const parent = this.parent();
  const storeReady = this.store.isInitialized();

  if (camera && parent && storeReady && !this.isInitialized()) {
    this.initialize();
  }
});
```

### 7. Performance Instrumentation

```typescript
private readonly performanceMarks = new Map<string, number>();

private trackPerformance(operation: string, fn: () => void) {
  const start = performance.now();
  fn();
  const duration = performance.now() - start;

  if (duration > 16.67) { // Frame budget exceeded
    console.warn(`[${this.constructor.name}] ${operation} took ${duration}ms`);
  }
}
```

### 8. Error Boundaries and Recovery

```typescript
try {
  this.createParticleSystem();
} catch (error) {
  this.error.set(`Failed to create particles: ${error.message}`);
  this.useFallbackRendering(); // Simple mode instead of crash
}
```

### 9. Throttling and Debouncing

```typescript
private readonly textChangeDebounced = debounceTime(300);

effect(() => {
  const text = this.text();
  this.textChangeDebounced(() => {
    this.refreshParticles(text);
  });
});
```

### 10. Memory Leak Detection (Development)

```typescript
if (isDevMode()) {
  this.destroyRef.onDestroy(() => {
    setTimeout(() => {
      if (this.particleSystem) {
        console.error('[MemoryLeak] Particle system not cleaned up!');
      }
    }, 1000);
  });
}
```

**Current implementation**: Functional for happy path, but fragile under edge cases, fails silently, and lacks production-hardening features like observability, validation, and graceful degradation.
