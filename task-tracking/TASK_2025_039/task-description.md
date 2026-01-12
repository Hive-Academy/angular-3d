# Requirements Document - TASK_2025_039

## Introduction

This task establishes a comprehensive shader-based background system for the `@hive-academy/angular-3d` library. The system leverages existing TSL (Three.js Shading Language) infrastructure to create reusable, high-performance background effects suitable for hero sections, landing pages, and immersive 3D experiences.

**Business Context**: Currently, the library has limited background effect capabilities (`BackgroundCubesComponent` for simple geometric distributions). Developers need sophisticated, shader-driven backgrounds that integrate seamlessly with existing positioning and interaction systems without duplicating code or creating architectural inconsistencies.

**Value Proposition**: This system provides a production-ready foundation for creating visually stunning backgrounds using ray marching, procedural textures, and volumetric effects while maintaining consistency with library patterns and maximizing code reuse.

---

## Requirements

### Requirement 1: Shader Background Component Architecture

**User Story**: As a library user implementing a hero section, I want reusable background shader components that follow the library's established patterns, so that I can quickly create sophisticated visual effects without writing custom shader code.

#### Acceptance Criteria

1. WHEN creating a new background component THEN it SHALL be located in `libs/angular-3d/src/lib/primitives/backgrounds/` folder structure
2. WHEN a background component is instantiated THEN it SHALL follow the established component pattern (signal inputs, `NG_3D_PARENT` injection, `DestroyRef` cleanup)
3. WHEN a background is rendered THEN it SHALL use `MeshBasicNodeMaterial` with TSL node graphs (NOT deprecated `ShaderMaterial` with GLSL)
4. WHEN multiple background components exist THEN they SHALL share common base functionality through composition patterns
5. WHEN a background component is destroyed THEN it SHALL properly dispose all Three.js resources (geometry, material, textures)

---

### Requirement 2: TSL Shader Integration Strategy

**User Story**: As a library maintainer extending shader capabilities, I want background components to leverage existing TSL utilities (`tsl-raymarching.ts`, `tsl-textures/`), so that we avoid code duplication and maintain consistency across the library.

#### Acceptance Criteria

1. WHEN implementing ray-marched backgrounds THEN they SHALL use functions from `tsl-raymarching.ts` (`tslSphereDistance`, `tslSmoothUnion`, `tslRayMarch`, `tslNormal`, `tslAmbientOcclusion`, `tslSoftShadow`)
2. WHEN implementing procedural texture backgrounds THEN they SHALL use TSL texture functions from `tsl-textures/` (`tslCausticsTexture`, `tslPlanet`, `tslStars`, etc.)
3. WHEN creating shader materials THEN they SHALL use TSL `uniform()` nodes for reactive parameter updates (NOT GLSL string concatenation)
4. WHEN shader complexity requires performance optimization THEN adaptive quality SHALL be implemented using device detection patterns from `MetaballComponent`
5. WHEN shader code becomes reusable THEN it SHALL be extracted to appropriate utility modules (`tsl-raymarching.ts` for SDFs, `tsl-textures/` for procedural patterns)

---

### Requirement 3: Viewport Positioning Integration

**User Story**: As a developer positioning backgrounds in a 3D scene, I want backgrounds to integrate with the existing viewport positioning system, so that I can layer multiple backgrounds at different depths using familiar CSS-like positioning syntax.

#### Acceptance Criteria

1. WHEN positioning a background component THEN it SHALL support `ViewportPositionDirective` as a `hostDirective` or standalone directive
2. WHEN using viewport positioning THEN backgrounds SHALL support all named positions (`center`, `top-left`, `bottom-right`, etc.)
3. WHEN layering backgrounds THEN the `viewportZ` input SHALL control depth placement (far Z values for true background layers)
4. WHEN viewport or camera changes THEN background positions SHALL update reactively via `ViewportPositioningService`
5. WHEN fullscreen mode is required THEN backgrounds SHALL support plane scaling to fill camera frustum (pattern from `MetaballComponent.updateFullscreenScale()`)

---

### Requirement 4: Mouse Interaction Integration

**User Story**: As a user interacting with a 3D scene, I want shader backgrounds to respond to mouse movement with parallax or distortion effects, so that the experience feels dynamic and engaging.

#### Acceptance Criteria

1. WHEN mouse interaction is enabled THEN backgrounds SHALL wire `MouseTracking3dDirective` to shader uniforms
2. WHEN mouse position changes THEN shader uniform nodes SHALL update reactively (e.g., `uMousePosition`, `uCursorSphere`)
3. WHEN implementing mouse effects THEN smooth interpolation SHALL be applied (damping pattern from `MouseTracking3dDirective.tick()`)
4. WHEN multiple backgrounds use mouse tracking THEN they SHALL share the same mouse position data (avoid duplicate event listeners)
5. WHEN touch devices are detected THEN touch events SHALL be converted to normalized mouse coordinates for shader uniforms

---

### Requirement 5: Component File Organization

**User Story**: As a library maintainer navigating the codebase, I want background shader components organized in a clear folder structure, so that I can quickly find and extend background functionality.

#### Acceptance Criteria

1. WHEN creating background components THEN they SHALL be placed in `libs/angular-3d/src/lib/primitives/backgrounds/`
2. WHEN multiple background types exist THEN the folder structure SHALL be:
   ```
   primitives/backgrounds/
   ├── ray-marched-background.component.ts       # Generic ray marching base
   ├── caustics-background.component.ts          # Caustics procedural texture
   ├── volumetric-background.component.ts        # Volumetric fog/clouds
   ├── starfield-background.component.ts         # Space effects
   └── index.ts                                  # Public API exports
   ```
3. WHEN adding new background types THEN they SHALL follow naming convention `*-background.component.ts`
4. WHEN components share utilities THEN shared helpers SHALL be extracted to appropriate modules (NOT kept in component files)
5. WHEN exporting public API THEN `libs/angular-3d/src/lib/primitives/backgrounds/index.ts` SHALL export all background components

---

### Requirement 6: Multiple Shader Type Support

**User Story**: As a developer creating diverse visual experiences, I want a consistent API across different shader types (ray marching, caustics, volumetric), so that I can switch between background effects without rewriting code.

#### Acceptance Criteria

1. WHEN implementing different shader types THEN they SHALL expose consistent signal inputs (`position`, `color`, `scale`, `speed`)
2. WHEN shader parameters vary by type THEN type-specific inputs SHALL be clearly documented with JSDoc
3. WHEN creating ray-marched backgrounds THEN they SHALL support SDF configuration (sphere count, smoothness, ambient occlusion samples)
4. WHEN creating procedural texture backgrounds THEN they SHALL support texture parameters (scale, turbulence, color palette)
5. WHEN creating volumetric backgrounds THEN they SHALL support density, scattering, and depth parameters

---

### Requirement 7: Reusability Strategy

**User Story**: As a developer building multiple scenes, I want background components that work consistently across different routes and scene configurations, so that I can reuse backgrounds without scene-specific workarounds.

#### Acceptance Criteria

1. WHEN a background component is used THEN it SHALL NOT depend on specific scene hierarchy (use `NG_3D_PARENT` for flexible parent attachment)
2. WHEN background parameters are configurable THEN all inputs SHALL use signal-based reactivity for dynamic updates
3. WHEN backgrounds are used in different scenes THEN they SHALL support optional `SceneService` injection (handle cases outside `Scene3dComponent`)
4. WHEN multiple instances exist THEN each SHALL maintain independent state (no shared mutable globals)
5. WHEN backgrounds are combined THEN composition SHALL be through Angular template hierarchy (NOT imperative code)

---

### Requirement 8: Component API Design

**User Story**: As a library user implementing backgrounds, I want a clear, predictable API with sensible defaults, so that I can quickly add backgrounds with minimal configuration while retaining full customization control.

#### Acceptance Criteria

1. WHEN using a background component THEN it SHALL provide at minimum:
   - `position` input: `[number, number, number]` (default: `[0, 0, -10]`)
   - `fullscreen` input: `boolean` (default: `true`)
   - `transparent` input: `boolean` (default: `true`)
   - `opacity` input: `number` (default: `1.0`)
2. WHEN using ray-marched backgrounds THEN additional inputs SHALL include:
   - `preset` input: Predefined visual presets (e.g., `'cosmic'`, `'minimal'`)
   - `sphereCount` input: Number of metaballs (default: `6`)
   - `smoothness` input: Blob blending factor (default: `0.3`)
   - `enableMouse` input: Enable mouse interaction (default: `false`)
3. WHEN using procedural texture backgrounds THEN additional inputs SHALL include:
   - `textureType` input: TSL texture function name (e.g., `'caustics'`, `'stars'`)
   - `textureParams` input: Texture-specific parameters object
   - `animationSpeed` input: Time-based animation speed (default: `1.0`)
4. WHEN using volumetric backgrounds THEN additional inputs SHALL include:
   - `density` input: Fog/cloud density (default: `0.1`)
   - `scattering` input: Light scattering factor (default: `0.5`)
   - `depthFade` input: Depth-based opacity fade (default: `true`)
5. WHEN input validation is required THEN invalid values SHALL log warnings and clamp to safe ranges (NOT throw errors)

---

## Non-Functional Requirements

### Performance Requirements

- **Ray Marching Response Time**: 60 FPS on desktop (GTX 1060+ equivalent), 30 FPS on mid-range mobile (iPhone 12+)
- **Adaptive Quality**: Automatically reduce ray march steps from 64 (desktop) to 16 (mobile) based on device detection
- **Memory Usage**: Each background component < 10MB GPU memory (geometry + material + textures)
- **Shader Compilation**: Initial shader compilation < 2 seconds on target devices

### Security Requirements

- **Input Sanitization**: All numeric inputs SHALL be validated and clamped to prevent shader compilation errors
- **Resource Limits**: Maximum sphere count capped at 10 for ray marching to prevent shader complexity explosion
- **WebGPU Compatibility**: All TSL shaders SHALL compile successfully for both WebGPU and WebGL backends

### Scalability Requirements

- **Multiple Instances**: Support up to 5 concurrent background instances per scene without performance degradation
- **Scene Complexity**: Backgrounds SHALL NOT block render loop when scene has 1000+ objects
- **Future Extensibility**: Architecture SHALL support adding new shader types without modifying existing components

### Reliability Requirements

- **Resource Cleanup**: 100% of Three.js resources disposed on component destroy (verified via Chrome DevTools heap snapshots)
- **Error Handling**: Shader compilation errors SHALL be caught and logged with helpful messages (NOT crash the app)
- **Graceful Degradation**: If WebGPU is unavailable, fallback to WebGL with automatic quality reduction

---

## Integration Points

### 1. TSL Ray Marching Utilities (`tsl-raymarching.ts`)

**Integration Strategy**:
- Import SDF primitives: `tslSphereDistance`, `tslSmoothUnion`
- Import ray marching algorithm: `tslRayMarch` with adaptive step count
- Import surface utilities: `tslNormal` for lighting, `tslAmbientOcclusion` for shading
- Import lighting: `tslSoftShadow` for realistic shadows (optional, disable on low-power devices)

**Example Usage**:
```typescript
import { tslRayMarch, tslSphereDistance, tslNormal } from '../../shaders/tsl-raymarching';

const sceneSDF = Fn(([pos]: [TSLNode]) => {
  const sphere1 = tslSphereDistance(pos, center1, radius1);
  const sphere2 = tslSphereDistance(pos, center2, radius2);
  return tslSmoothUnion(sphere1, sphere2, smoothness);
});

const hitDist = tslRayMarch(rayOrigin, rayDir, sceneSDF, stepCount);
const normal = tslNormal(hitPoint, sceneSDF);
```

---

### 2. TSL Procedural Textures (`tsl-textures/`)

**Integration Strategy**:
- Import texture functions: `tslCausticsTexture`, `tslPlanet`, `tslStars`, `tslPhotosphere`
- Import organic textures: `tslBrain`, `tslReticularVeins`, `tslWaterMarble`
- Use `TslTextureParams` for parameter typing
- Apply textures to background plane via `MeshBasicNodeMaterial.colorNode`

**Example Usage**:
```typescript
import { tslCausticsTexture } from '../../shaders/tsl-textures/space';

const causticsNode = tslCausticsTexture({
  scale: this.scale(),
  speed: this.animationSpeed(),
  color: new Color(this.color()),
  seed: 0
});

this.material.colorNode = causticsNode;
```

---

### 3. Viewport Positioning System (`ViewportPositionDirective`)

**Integration Strategy**:
- Option A: Use as `hostDirective` on background component selector
- Option B: Apply directive directly in template
- Wire `viewportZ` input to control depth layering (e.g., `-50` for far background)
- Leverage reactive position updates from `ViewportPositioningService`

**Example Usage**:
```typescript
@Component({
  selector: 'a3d-caustics-background',
  hostDirectives: [ViewportPositionDirective],
  // ...
})
```

**Template Usage**:
```html
<a3d-caustics-background
  viewportPosition="center"
  [viewportZ]="-50"
  [viewportOffset]="{ offsetY: -2 }"
/>
```

---

### 4. Mouse Tracking System (`MouseTracking3dDirective`)

**Integration Strategy**:
- Create TSL uniform nodes for mouse data: `uMousePosition` (vec2), `uCursorSphere` (vec3)
- Wire directive to update uniform values in component
- Apply smooth interpolation (damping) to prevent jittery motion
- Support optional mouse tracking (input: `enableMouse`)

**Example Usage**:
```typescript
// In component
private uMousePosition = uniform(new Vector2(0.5, 0.5));

// In mouse event handler
private onPointerMove(event: MouseEvent): void {
  this.targetMousePosition.x = event.clientX / window.innerWidth;
  this.targetMousePosition.y = 1.0 - event.clientY / window.innerHeight;
}

// In render loop
const smoothness = 0.1;
this.mousePosition.lerp(this.targetMousePosition, smoothness);
this.uMousePosition.value = this.mousePosition;
```

---

### 5. Existing Background Components (`BackgroundCubesComponent`)

**Integration Strategy**:
- DO NOT modify `BackgroundCubesComponent` (maintains backward compatibility)
- Create shader backgrounds as ALTERNATIVE options (NOT replacements)
- Support layering shader backgrounds BEHIND `BackgroundCubesComponent` using `viewportZ`
- Share common patterns (signal inputs, cleanup) but NO code inheritance

---

### 6. Effect Components Pattern (`MetaballComponent`, `GlassSphereComponent`)

**Integration Strategy**:
- Follow established TSL material patterns from `MetaballComponent`
- Reuse device detection logic (`isMobile`, `isLowPowerDevice`)
- Reuse fullscreen scaling logic (`updateFullscreenScale()`)
- Follow preset pattern for predefined visual configurations
- Use `afterNextRender()` for browser-only initialization

---

## Reusability Strategy

### 1. Component Composition Over Inheritance

**Principle**: Background components SHALL use composition patterns, NOT class inheritance.

**Implementation**:
- Shared functionality extracted to utility functions (NOT base classes)
- Common TSL shader logic extracted to `tsl-raymarching.ts` and `tsl-textures/`
- Dependency injection for services (`SceneService`, `RenderLoopService`, etc.)

**Example**:
```typescript
// GOOD: Composition via utility functions
import { createFullscreenPlane, updatePlaneScale } from './background-utils';

// BAD: Inheritance
class BaseBackground extends Object3D { ... }
```

---

### 2. Flexible Scene Integration

**Principle**: Backgrounds SHALL NOT depend on specific scene structure.

**Implementation**:
- Use `NG_3D_PARENT` token for parent attachment (supports `Scene`, `Group`, or any `Object3D`)
- Make `SceneService` optional injection (support usage outside `Scene3dComponent`)
- Support positioning via `ViewportPositionDirective` OR manual `position` input

**Example**:
```typescript
// Optional SceneService injection
private readonly sceneService = inject(SceneService, { optional: true });

// Flexible parent attachment
private readonly parent = inject(NG_3D_PARENT);
```

---

### 3. Configurable Defaults

**Principle**: All background components SHALL provide sensible defaults while supporting full customization.

**Implementation**:
- Define preset configurations (e.g., `'cosmic'`, `'minimal'`)
- Expose granular inputs for advanced users (e.g., `sphereCount`, `smoothness`)
- Use TypeScript defaults for optional inputs

**Example**:
```typescript
public readonly preset = input<BackgroundPreset>('cosmic');
public readonly sphereCount = input<number>(6);
public readonly smoothness = input<number>(0.3);
```

---

### 4. Stateless Shader Logic

**Principle**: TSL shader functions SHALL be pure (no shared mutable state).

**Implementation**:
- All shader state passed via TSL uniform nodes
- Avoid global variables in shader code
- Cache TSL function instances to prevent recreation overhead

**Example**:
```typescript
// GOOD: Pure TSL function with cached instance
let _cachedSceneSDF: TSLNode;
const createSceneSDF = (uniforms: UniformNodes) => {
  if (!_cachedSceneSDF) {
    _cachedSceneSDF = Fn(([pos]: [TSLNode]) => {
      // Use uniforms for configuration
      return tslSphereDistance(pos, uniforms.uCenter, uniforms.uRadius);
    });
  }
  return _cachedSceneSDF;
};

// BAD: Mutable global state in shader
let globalSphereCount = 6; // DON'T DO THIS
```

---

## Performance Considerations

### 1. Adaptive Quality System

**Requirement**: Background shaders SHALL automatically adjust quality based on device capabilities.

**Implementation Strategy**:
```typescript
// Device detection (pattern from MetaballComponent)
private readonly isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
private readonly isLowPower = this.isMobile || navigator.hardwareConcurrency <= 4;

// Adaptive ray march steps
const rayMarchSteps = this.enableAdaptiveQuality()
  ? (this.isMobile ? 16 : 64)
  : this.maxRayMarchSteps();

// Adaptive AO samples
const aoSamples = this.isLowPower ? 2 : 6;

// Disable expensive features on low-power
const enableSoftShadows = !this.isLowPower && this.enableShadows();
```

---

### 2. Shader Complexity Management

**Requirement**: TSL shaders SHALL NOT cause compilation hangs or excessive GPU memory usage.

**Implementation Strategy**:
- Limit ray march steps to max 64 (desktop) / 16 (mobile)
- Limit metaball sphere count to max 10
- Use simplified AO (2-6 samples, NOT 10+)
- Disable soft shadows on low-power devices (expensive loop iterations)
- Avoid deeply nested `Loop` nodes (TSL unrolls at compile time)

**Warning Pattern**:
```typescript
if (this.sphereCount() > 10) {
  console.warn('[RayMarchedBackground] sphereCount clamped to 10 to prevent shader compilation hang');
  this.uSphereCount.value = 10;
}
```

---

### 3. Fullscreen Plane Optimization

**Requirement**: Fullscreen backgrounds SHALL minimize overdraw and fragment shader cost.

**Implementation Strategy**:
- Use 2x2 `PlaneGeometry` (minimal vertices)
- Scale plane to exactly fit viewport (avoid rendering outside frustum)
- Set `frustumCulled = false` (plane always visible)
- Use `depthWrite = false` for true backgrounds (don't block other objects)
- Consider `depthTest = false` for backgrounds that should always render behind

**Scaling Pattern** (from `MetaballComponent`):
```typescript
private updateFullscreenScale(): void {
  const camera = this.sceneService?.camera();
  if (!camera || !this.mesh) return;

  const distance = this.cameraDistance() ?? camera.position.length();
  const vFov = (camera.fov * Math.PI) / 180;
  const planeHeight = 2 * Math.tan(vFov / 2) * distance;
  const planeWidth = planeHeight * camera.aspect;

  // 10% overflow to prevent edge artifacts
  this.mesh.scale.set(planeWidth * 1.1, planeHeight * 1.1, 1);
  this.mesh.position.set(0, 0, -distance + 0.01);
}
```

---

### 4. Resource Cleanup

**Requirement**: All Three.js resources SHALL be disposed on component destroy to prevent memory leaks.

**Implementation Strategy**:
```typescript
this.destroyRef.onDestroy(() => {
  // Cleanup render loop callback
  if (this.renderLoopCleanup) {
    this.renderLoopCleanup();
  }

  // Remove event listeners
  if (typeof window !== 'undefined') {
    window.removeEventListener('mousemove', this.boundOnPointerMove);
    window.removeEventListener('resize', this.boundOnResize);
  }

  // Remove from parent
  const parent = this.parent();
  if (parent && this.mesh) {
    parent.remove(this.mesh);
  }

  // Dispose Three.js resources
  if (this.mesh) {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
});
```

---

## Success Metrics

### 1. Component Creation Success

**Metric**: All background component files created in correct folder structure

**Validation**:
```bash
# Verify folder structure exists
ls libs/angular-3d/src/lib/primitives/backgrounds/

# Expected output:
# ray-marched-background.component.ts
# caustics-background.component.ts
# volumetric-background.component.ts
# starfield-background.component.ts
# index.ts
```

---

### 2. TSL Integration Success

**Metric**: Background components successfully use existing TSL utilities WITHOUT code duplication

**Validation**:
```bash
# Verify imports from tsl-raymarching.ts
grep -r "from '.*tsl-raymarching'" libs/angular-3d/src/lib/primitives/backgrounds/

# Verify imports from tsl-textures/
grep -r "from '.*tsl-textures/" libs/angular-3d/src/lib/primitives/backgrounds/

# Verify NO GLSL string shaders (deprecated ShaderMaterial pattern)
grep -r "ShaderMaterial" libs/angular-3d/src/lib/primitives/backgrounds/
# Expected: No matches (should use MeshBasicNodeMaterial + TSL)
```

---

### 3. Positioning Integration Success

**Metric**: Backgrounds integrate with `ViewportPositionDirective` for depth layering

**Validation**:
```typescript
// Test template usage
<a3d-caustics-background
  viewportPosition="center"
  [viewportZ]="-50"
/>

// Verify background renders behind scene content (Z = -50)
```

---

### 4. Mouse Interaction Success

**Metric**: Mouse tracking updates shader uniforms reactively

**Validation**:
```typescript
// Test mouse movement updates uniform
const bg = fixture.componentInstance;
bg.onPointerMove({ clientX: 100, clientY: 200 } as MouseEvent);
expect(bg.uMousePosition.value.x).toBeCloseTo(100 / window.innerWidth);
```

---

### 5. Performance Success

**Metric**: Backgrounds render at target frame rates on reference devices

**Validation**:
```bash
# Desktop: GTX 1060 equivalent, 1920x1080
# Target: 60 FPS with ray marched background (64 steps)

# Mobile: iPhone 12 equivalent, 1170x2532
# Target: 30 FPS with ray marched background (16 steps)

# Measure via Chrome DevTools Performance tab:
# - Record 5 seconds of interaction
# - Verify frame rate stays above target
# - Verify GPU memory < 10MB per background
```

---

### 6. API Consistency Success

**Metric**: All background components expose consistent base inputs

**Validation**:
```typescript
// Every background component MUST have these inputs
interface BackgroundComponentAPI {
  position: InputSignal<[number, number, number]>;
  fullscreen: InputSignal<boolean>;
  transparent: InputSignal<boolean>;
  opacity: InputSignal<number>;
}

// Verify at compile time via TypeScript interface compliance
```

---

### 7. Reusability Success

**Metric**: Background components work across different scenes without modification

**Validation**:
```html
<!-- Scene 1: Hero section -->
<a3d-scene>
  <a3d-caustics-background viewportPosition="center" [viewportZ]="-50" />
  <a3d-sphere [position]="[0, 0, 0]" />
</a3d-scene>

<!-- Scene 2: Product showcase (different route) -->
<a3d-scene>
  <a3d-caustics-background viewportPosition="bottom-right" [viewportZ]="-30" />
  <a3d-gltf-model [modelPath]="productModel" />
</a3d-scene>

<!-- Verify: Same component, different positioning, no code changes -->
```

---

### 8. Documentation Success

**Metric**: All background components have comprehensive JSDoc and usage examples

**Validation**:
```typescript
/**
 * CausticsBackgroundComponent - Underwater caustic light patterns
 *
 * Creates animated caustic reflections using Worley noise procedural texture.
 * Supports fullscreen mode for hero sections or positioned mode for layered backgrounds.
 *
 * @example
 * ```html
 * <a3d-caustics-background
 *   viewportPosition="center"
 *   [viewportZ]="-50"
 *   [scale]="2"
 *   [animationSpeed]="1.5"
 *   [color]="'#50a8c0'"
 * />
 * ```
 */
```

---

### 9. Build Success

**Metric**: Library builds successfully with all background components exported

**Validation**:
```bash
# Build library
npx nx build @hive-academy/angular-3d

# Verify exports in dist
grep -r "CausticsBackgroundComponent" dist/libs/angular-3d/

# Verify no build errors or warnings
```

---

### 10. Demo Integration Success

**Metric**: Background components successfully integrated into `angular-3d-demo` app

**Validation**:
```bash
# Create demo page showcasing all background types
# apps/angular-3d-demo/src/app/pages/backgrounds-showcase.component.ts

# Verify demo runs without errors
npx nx serve angular-3d-demo

# Navigate to /backgrounds-showcase
# Verify all background types render correctly
```

---

## Dependencies and Constraints

### Technical Dependencies

1. **Three.js WebGPU**: Version 0.182+ (TSL support)
2. **Angular**: Version 20.3+ (signal-based components)
3. **Existing Library Infrastructure**:
   - `tsl-raymarching.ts` (SDF primitives, ray marching algorithm)
   - `tsl-textures/` (procedural texture library)
   - `ViewportPositionDirective` (positioning system)
   - `MouseTracking3dDirective` (interaction system)
   - `RenderLoopService` (animation frame management)
   - `SceneService` (scene/camera/renderer access)

### Architectural Constraints

1. **NO Backward Compatibility Breaking**: Existing components (`BackgroundCubesComponent`, etc.) SHALL NOT be modified
2. **NO GLSL Shaders**: All shaders SHALL use TSL node graphs (WebGPU-native, NOT deprecated GLSL strings)
3. **NO Class Inheritance**: Background components SHALL use composition patterns (NOT inheritance hierarchies)
4. **NO Shared Mutable State**: TSL shader functions SHALL be pure (stateless, side-effect free)
5. **NO Scene-Specific Logic**: Components SHALL work in ANY `Scene3dComponent` or standalone `Group`

### Browser/Device Constraints

1. **WebGPU Support**: Graceful fallback to WebGL when WebGPU unavailable
2. **Mobile Performance**: Automatic quality reduction on mobile devices (16 ray march steps vs 64 desktop)
3. **Low-Power Devices**: Disable expensive features (soft shadows, high AO samples) on devices with <= 4 CPU cores
4. **Browser Compatibility**: Support Chrome 113+, Safari 17+, Firefox 121+ (WebGPU availability)

---

## Implementation Notes

### Folder Structure (CRITICAL)

**MUST follow this exact structure**:
```
libs/angular-3d/src/lib/primitives/backgrounds/
├── ray-marched-background.component.ts       # Generic ray marching (metaballs, SDFs)
├── caustics-background.component.ts          # Caustics procedural texture
├── volumetric-background.component.ts        # Volumetric fog/clouds
├── starfield-background.component.ts         # Space starfield
└── index.ts                                  # Public API exports
```

**Rationale**: Backgrounds are primitives (visual building blocks), NOT effects (compositions). They belong in `primitives/backgrounds/` to distinguish them from `primitives/effects/` (which compose multiple primitives).

---

### TSL vs GLSL Migration Path

**CRITICAL**: DO NOT use `ShaderMaterial` with GLSL strings (deprecated pattern).

**Correct Pattern**:
```typescript
// GOOD: TSL with MeshBasicNodeMaterial
import * as TSL from 'three/tsl';
const { Fn, vec3, uniform } = TSL;

const colorNode = Fn(() => {
  return vec3(uColor);
});

const material = new MeshBasicNodeMaterial();
material.colorNode = colorNode;
```

**Incorrect Pattern**:
```typescript
// BAD: GLSL with ShaderMaterial (deprecated)
const material = new ShaderMaterial({
  vertexShader: `...`,
  fragmentShader: `...`,
  uniforms: { ... }
});
```

---

### Performance Profiling Checklist

Before finalizing implementation, verify:
- [ ] Chrome DevTools > Performance > Record 5 seconds of interaction
- [ ] Frame rate >= 60 FPS (desktop) or >= 30 FPS (mobile)
- [ ] GPU memory per background < 10MB (DevTools > Memory > Heap snapshot)
- [ ] Shader compilation time < 2 seconds (Console timestamps)
- [ ] No memory leaks (Heap snapshots before/after component destroy)

---

### Code Review Checklist

Before submitting PR, verify:
- [ ] All components use signal inputs (NOT `@Input` decorator)
- [ ] All components use `DestroyRef` for cleanup (NOT `ngOnDestroy`)
- [ ] All Three.js resources disposed in `onDestroy` callback
- [ ] All TSL functions cached (avoid recreation overhead)
- [ ] All shader complexity within limits (max 64 steps, 10 spheres)
- [ ] All components follow naming convention `*-background.component.ts`
- [ ] All components exported from `index.ts`
- [ ] All components have comprehensive JSDoc
- [ ] All components have usage examples in JSDoc

---

## Related Tasks

- **TASK_2025_028**: WebGPU Migration (shader foundation)
- **TASK_2025_032**: Native TSL Procedural Textures (texture library)
- **TASK_2025_033**: Blueyard.com Replication Analysis (visual effects inspiration)
- **TASK_2025_038**: Angular-3D Library Structure Reorganization (folder structure)

---

## Approval Status

**Status**: PENDING USER VALIDATION

**Next Steps**:
1. User reviews requirements document
2. User provides feedback or approval
3. On approval, proceed to architecture phase (Software Architect)
