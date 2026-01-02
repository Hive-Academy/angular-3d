# Development Tasks - TASK_2025_033

**Total Tasks**: 16 | **Batches**: 4 | **Status**: 0/4 complete

---

## Plan Validation Summary

**Validation Status**: PASSED WITH RISKS

### Assumptions Verified

- PMREMGenerator exists in Three.js WebGPU: VERIFIED (volumetric-caustics-scene.component.ts:183)
- MeshStandardNodeMaterial supports colorNode/emissiveNode: VERIFIED (volumetric-caustics-scene.component.ts:259, 336, 345)
- TSL fresnel pattern works: VERIFIED (volumetric-caustics-scene.component.ts:339-345)
- RenderLoopService callback registration: VERIFIED (angular-3d/CLAUDE.md:116-119)
- ScrollAnimationDirective and ViewportAnimationDirective exist: VERIFIED (gsap-showcase-hero-section.component.ts)
- NG_3D_PARENT token for parent-child relationships: VERIFIED (particle-system.component.ts)

### Risks Identified

| Risk                                       | Severity | Mitigation                                                  |
| ------------------------------------------ | -------- | ----------------------------------------------------------- |
| PMREMGenerator WebGPU compatibility        | MEDIUM   | Test early in Batch 2, fall back to basic env map if needed |
| Transparent canvas over gradient (z-index) | LOW      | Test pointer-events and z-index carefully in Batch 3        |
| Twinkling performance with many particles  | LOW      | Use BufferAttribute updates, not recreation (Task 1.3)      |
| Scroll progress edge cases (< 0 or > 1)    | LOW      | Add clamping in position interpolation (Task 2.4)           |

### Edge Cases to Handle

- [ ] Empty featurePills array - Handled in Task 3.1 (@for will simply render nothing)
- [ ] Scroll progress outside 0-1 range - Handled in Task 2.4 (clamp values)
- [ ] Scene not ready when component initializes - Handled via effect() pattern (Task 2.1)

---

## Batch 1: SparkleCoronaComponent (Library Primitive)

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: None
**Status**: IMPLEMENTED

### Task 1.1: Create SparkleCoronaComponent scaffold IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\sparkle-corona.component.ts
**Spec Reference**: implementation-plan.md:316-414
**Pattern to Follow**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-system.component.ts

**Quality Requirements**:

- Use ChangeDetectionStrategy.OnPush
- Use signal-based inputs: input<T>() pattern
- Inject NG_3D_PARENT token for scene hierarchy
- Inject RenderLoopService for animation
- Use afterNextRender() for initialization
- Use DestroyRef for cleanup

**Implementation Details**:

- Imports: THREE from 'three/webgpu', NG_3D_PARENT, RenderLoopService, DestroyRef
- Selector: 'a3d-sparkle-corona'
- Inputs: count (3000), innerRadius (2.5), outerRadius (3.0), baseSize (0.02), position ([0,0,0]), twinkleSpeed (2.0), colorWeights ({white: 0.5, peach: 0.3, gold: 0.2})
- Create geometry with position, color, and opacity attributes
- Create PointsNodeMaterial with vertexColors enabled

**Verification Criteria**:

- Component compiles without errors
- Component follows particle-system.component.ts pattern
- All inputs are signal-based

---

### Task 1.2: Implement shell distribution function IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\sparkle-corona.component.ts
**Spec Reference**: implementation-plan.md:336-356
**Pattern to Follow**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\particle-system.component.ts:59-71

**Quality Requirements**:

- Shell distribution (surface), NOT sphere (volume)
- Particles distributed between innerRadius and outerRadius
- Uniform distribution on sphere surface using theta/phi

**Implementation Details**:

```typescript
function generateShellPositions(count: number, innerRadius: number, outerRadius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
}
```

**Verification Criteria**:

- Particles form a hollow shell (corona), not a filled sphere
- innerRadius and outerRadius inputs affect distribution correctly

---

### Task 1.3: Implement multi-color sparkles with twinkling IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\sparkle-corona.component.ts
**Spec Reference**: implementation-plan.md:358-402
**Pattern to Follow**: N/A (new feature)

**Quality Requirements**:

- Three color groups: white (50%), peach (30%), gold (20%)
- Per-particle opacity stored in BufferAttribute
- Twinkling via sine wave with random phase per particle
- Use RenderLoopService callback for animation
- Update BufferAttribute.needsUpdate = true for efficiency

**Implementation Details**:

```typescript
// Color generation
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const colorChoice = Math.random();
  let r, g, b;
  if (colorChoice < 0.5) [r, g, b] = [1.0, 1.0, 1.0];        // white
  else if (colorChoice < 0.8) [r, g, b] = [1.0, 0.85, 0.7];   // peach
  else [r, g, b] = [1.0, 0.8, 0.4];                           // gold
  colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
}

// Twinkling animation
private twinklePhases: Float32Array;  // Random phase per particle
private animate = (delta: number, elapsed: number) => {
  // Update opacities based on sine wave
};
```

**Validation Notes**:

- Risk: Performance with many particles
- Mitigation: Use BufferAttribute updates, not geometry recreation

**Verification Criteria**:

- Multiple colors visible in particle system
- Particles twinkle (oscillating brightness)
- 60fps maintained with 3000 particles

---

### Task 1.4: Export SparkleCoronaComponent from library IMPLEMENTED

**File**: D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts
**Spec Reference**: implementation-plan.md:577-579
**Pattern to Follow**: Existing exports in index.ts

**Quality Requirements**:

- Export component from primitives/index.ts
- Component accessible via '@hive-academy/angular-3d'

**Implementation Details**:

- Add: `export * from './sparkle-corona.component';`

**Verification Criteria**:

- `npx nx build @hive-academy/angular-3d` succeeds
- SparkleCoronaComponent importable from '@hive-academy/angular-3d'

---

**Batch 1 Verification**:

- [x] All files exist at specified paths
- [x] Build passes: `npx nx build @hive-academy/angular-3d`
- [x] Shell distribution creates corona effect (not fog) - Uses linear radius interpolation, not cbrt
- [x] Twinkling animation runs at 60fps - Uses BufferAttribute.needsUpdate for efficient GPU updates

---

## Batch 2: GlassSphereSceneComponent (3D Content)

**Developer**: frontend-developer
**Tasks**: 5 | **Dependencies**: Batch 1 (SparkleCoronaComponent)
**Status**: PENDING

### Task 2.1: Create GlassSphereSceneComponent scaffold

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-scene.component.ts
**Spec Reference**: implementation-plan.md:213-314
**Pattern to Follow**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\volumetric-caustics-scene.component.ts:111-154

**Quality Requirements**:

- Use SceneService.inject() to access scene/camera/renderer
- Use effect() to wait for renderer to be ready
- Standalone component with ChangeDetectionStrategy.OnPush
- Selector: 'app-glass-sphere-scene'

**Implementation Details**:

- Imports: SceneService, RenderLoopService from '@hive-academy/angular-3d'
- Imports: SparkleCoronaComponent (from Batch 1)
- Input: scrollProgress (number, default 0)
- Child component pattern - placed inside Scene3dComponent

**Verification Criteria**:

- Component initializes when placed inside a3d-scene-3d
- SceneService provides scene/camera/renderer access

---

### Task 2.2: Implement PMREMGenerator environment map

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-scene.component.ts
**Spec Reference**: implementation-plan.md:427-476
**Pattern to Follow**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\volumetric-caustics-scene.component.ts:177-232

**Quality Requirements**:

- Create warm-toned environment (cream/peach, not teal)
- Use PMREMGenerator for prefiltered reflections
- Add "light" spheres for specular highlights
- Apply to scene.environment
- Dispose resources after generation

**Validation Notes**:

- Risk: PMREMGenerator WebGPU compatibility
- Mitigation: Test early, if fails use simpler approach

**Implementation Details**:

```typescript
private setupEnvironment(scene: THREE.Scene, renderer: THREE.WebGPURenderer): void {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  const envScene = new THREE.Scene();
  // Background sphere: warm cream 0xfff0e0
  // Light 1: white for specular
  // Light 2: warm peach 0xffd4a0
  // ... (see implementation-plan.md:443-467)
}
```

**Verification Criteria**:

- scene.environment is set
- Reflections visible on glossy materials in scene
- Warm cream/peach tone, not teal

---

### Task 2.3: Create glass sphere with TSL material

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-scene.component.ts
**Spec Reference**: implementation-plan.md:479-513
**Pattern to Follow**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\angular-3d-showcase\scenes\volumetric-caustics-scene.component.ts:254-354

**Quality Requirements**:

- Use MeshStandardNodeMaterial with roughness: 0.1 (glossy!)
- NOT high emissiveIntensity (that creates sun effect)
- Fresnel rim glow using TSL nodes
- Subtle edge glow (0.15 intensity, not 2.2)
- Warm white base color

**Implementation Details**:

```typescript
import { Fn, vec3, float, normalize, dot, abs, pow, cameraPosition, positionWorld, normalWorld } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial({
  metalness: 0.0,
  roughness: 0.1, // KEY: glossy
  transparent: true,
  opacity: 0.95,
});

material.colorNode = vec3(1.0, 0.98, 0.95);

// Fresnel edge glow
const viewDir = normalize(cameraPosition.sub(positionWorld));
const rim = float(1).sub(abs(dot(normalWorld, viewDir)));
const fresnelPower = pow(rim, float(2.5));
const edgeGlow = vec3(1.0, 0.85, 0.7).mul(fresnelPower).mul(0.15);
material.emissiveNode = edgeGlow;
```

**Verification Criteria**:

- Sphere has visible glossy reflections (from environment map)
- Edge glow is SUBTLE (not glowing sun)
- Sphere looks like glass, not matte plastic

---

### Task 2.4: Add scroll-driven sphere position

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-scene.component.ts
**Spec Reference**: implementation-plan.md:294-311
**Pattern to Follow**: N/A (new feature)

**Quality Requirements**:

- Use computed signal for reactive position
- Start position: bottom center (0, -4, 0)
- End position: top right (5, 3, 0)
- Ease-out cubic for smooth deceleration
- Clamp scrollProgress to 0-1 range

**Validation Notes**:

- Edge case: scrollProgress < 0 or > 1
- Mitigation: Add Math.max(0, Math.min(1, p)) clamping

**Implementation Details**:

```typescript
public readonly scrollProgress = input<number>(0);

public readonly spherePosition = computed((): [number, number, number] => {
  const p = Math.max(0, Math.min(1, this.scrollProgress()));

  const startX = 0, startY = -4;
  const endX = 5, endY = 3;

  // Ease-out cubic
  const eased = 1 - Math.pow(1 - p, 3);

  const x = startX + (endX - startX) * eased;
  const y = startY + (endY - startY) * eased;

  return [x, y, 0];
});
```

**Verification Criteria**:

- Sphere moves smoothly from bottom-center to top-right
- Movement follows ease-out curve (fast start, slow end)
- No jitter or jumping

---

### Task 2.5: Integrate SparkleCoronaComponent

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-scene.component.ts
**Spec Reference**: implementation-plan.md:316-414
**Pattern to Follow**: N/A

**Quality Requirements**:

- Position corona at same position as sphere
- Use innerRadius slightly larger than sphere radius (2.5 vs 2.5)
- outerRadius creates thin shell (3.0)
- Corona moves with sphere

**Implementation Details**:

- Add SparkleCoronaComponent to template
- Bind [position] to spherePosition()
- Configure count=3000, innerRadius=2.55, outerRadius=3.0

**Verification Criteria**:

- Sparkles form corona AROUND sphere edge (not inside)
- Corona moves with sphere during scroll
- Multiple sparkle colors visible

---

**Batch 2 Verification**:

- [ ] All files exist at specified paths
- [ ] Environment map creates warm reflections
- [ ] Glass sphere is glossy (not matte)
- [ ] Edge glow is subtle (not sun-like)
- [ ] Sphere + corona move together with scroll
- [ ] Build passes: `npx nx build angular-3d-demo`

---

## Batch 3: GlassSphereHeroComponent (Container + GSAP)

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 2 (GlassSphereSceneComponent)
**Status**: PENDING

### Task 3.1: Create GlassSphereHeroComponent container

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-hero.component.ts
**Spec Reference**: implementation-plan.md:85-210
**Pattern to Follow**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\sections\gsap-showcase-hero-section.component.ts

**Quality Requirements**:

- Standalone component with ChangeDetectionStrategy.OnPush
- Signal-based inputs for all content customization
- Three-layer composition: gradient -> scene -> content
- Import ScrollAnimationDirective, ViewportAnimationDirective from angular-gsap
- Import Scene3dComponent from angular-3d

**Implementation Details**:

- Selector: 'app-glass-sphere-hero'
- Inputs: scrollProgress, gradientStart (#FFF8F0), gradientEnd (#FFE4C4), height (100vh), badgeText, titleLine1, titleLine2, subtitle, featurePills, primaryButtonText, secondaryButtonText, secondaryButtonHref
- Outputs: progressChange (EventEmitter<number>), primaryAction (EventEmitter<void>)

**Verification Criteria**:

- Component renders three distinct layers
- All inputs are signal-based
- Component compiles without errors

---

### Task 3.2: Implement CSS layer composition

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-hero.component.ts
**Spec Reference**: implementation-plan.md:186-209
**Pattern to Follow**: N/A

**Quality Requirements**:

- Gradient layer: z-index 0, CSS linear gradient
- Scene layer: z-index 1, absolute positioning, pointer-events: none
- Content layer: z-index 10, relative positioning
- Transparent canvas (backgroundColor: null on Scene3dComponent)

**Validation Notes**:

- Risk: Transparent canvas over gradient (z-index issues)
- Mitigation: Test thoroughly, ensure pointer-events correct

**Implementation Details**:

```css
.hero-container {
  position: relative;
  width: 100%;
  overflow: hidden;
}
.gradient-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}
.scene-layer {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}
.content-layer {
  position: relative;
  z-index: 10;
}
```

**Verification Criteria**:

- Gradient visible through transparent 3D canvas
- 3D sphere renders on top of gradient
- Text content is clickable (not blocked by scene layer)

---

### Task 3.3: Add GSAP viewport animations to hero content

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-hero.component.ts
**Spec Reference**: implementation-plan.md:146-180
**Pattern to Follow**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\sections\gsap-showcase-hero-section.component.ts:68-198

**Quality Requirements**:

- Badge: viewportAnimation with scaleIn, delay 0.1
- Title: viewportAnimation with slideUp, delay 0.2
- Subtitle: viewportAnimation with fadeIn, delay 0.4
- Feature pills: viewportAnimation with slideUp, delay 0.5
- CTA buttons: viewportAnimation with slideUp, delay 0.6
- Scroll indicator: viewportAnimation with fadeIn, delay 0.8

**Implementation Details**:

- Use ViewportAnimationDirective on each content element
- Configure animation, duration, delay for staggered reveal
- Dark text styling for light background (unlike dark theme GSAP hero)

**Verification Criteria**:

- Content animates in on page load
- Animations are staggered (badge first, scroll indicator last)
- Animations run once (not repeated on scroll)

---

### Task 3.4: Add scroll-linked content fade-out

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-hero.component.ts
**Spec Reference**: implementation-plan.md:135-144
**Pattern to Follow**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\gsap-showcase\sections\gsap-showcase-hero-section.component.ts:57-67

**Quality Requirements**:

- Use ScrollAnimationDirective with 'custom' animation
- Fade content from opacity 1 to 0 with scroll
- Move content up (y: 0 to y: -100) as it fades
- Scrub mode for smooth scroll-linked animation

**Implementation Details**:

```html
<div
  class="content-layer"
  scrollAnimation
  [scrollConfig]="{
    animation: 'custom',
    start: 'top 20%',
    end: 'bottom 60%',
    scrub: 1.2,
    from: { opacity: 1, y: 0 },
    to: { opacity: 0, y: -100 }
  }"
></div>
```

**Verification Criteria**:

- Content fades out as user scrolls down
- Content moves up as it fades
- Animation is smooth (scrubbed, not triggered)

---

**Batch 3 Verification**:

- [ ] All files exist at specified paths
- [ ] Gradient visible behind 3D scene
- [ ] Text content appears with staggered animations on load
- [ ] Content fades out smoothly on scroll
- [ ] CTA buttons are clickable
- [ ] Build passes: `npx nx build angular-3d-demo`

---

## Batch 4: Home Page Integration + Polish

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: Batch 3 (GlassSphereHeroComponent)
**Status**: PENDING

### Task 4.1: Create barrel export for glass-sphere-hero

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\index.ts
**Spec Reference**: implementation-plan.md:813
**Pattern to Follow**: Standard barrel export pattern

**Quality Requirements**:

- Export GlassSphereHeroComponent
- Export GlassSphereSceneComponent (if needed externally)

**Implementation Details**:

```typescript
export { GlassSphereHeroComponent } from './glass-sphere-hero.component';
export { GlassSphereSceneComponent } from './glass-sphere-scene.component';
```

**Verification Criteria**:

- Components importable from barrel export

---

### Task 4.2: Integrate GlassSphereHeroComponent into home page

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\home.component.ts
**Spec Reference**: implementation-plan.md:574-576, 639-643
**Pattern to Follow**: Current home.component.ts structure

**Quality Requirements**:

- Replace Hero3dTeaserComponent import with GlassSphereHeroComponent
- Add scroll listener for scroll progress
- Pass scrollProgress signal to component
- Keep existing page structure (CTA, Library Overview sections)

**Implementation Details**:

```typescript
import { GlassSphereHeroComponent } from '../../shared/components/glass-sphere-hero';

// Add scroll tracking
public scrollProgress = signal(0);

@HostListener('window:scroll')
onScroll() {
  const max = document.body.scrollHeight - window.innerHeight;
  this.scrollProgress.set(window.scrollY / max);
}
```

**Verification Criteria**:

- Home page shows glass sphere hero instead of old hero
- Sphere moves on scroll
- Content fades out on scroll
- Rest of home page unchanged

---

### Task 4.3: Visual polish and verification

**File**: D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-hero.component.ts
**Spec Reference**: implementation-plan.md:653-679
**Pattern to Follow**: N/A

**Quality Requirements**:

- Glass sphere has visible reflections (not matte)
- Sparkles form corona AROUND sphere (not fog inside)
- Sparkles twinkle (oscillating brightness)
- Multiple sparkle colors visible (white, peach, gold)
- Edge glow is SUBTLE (not sun-like)
- Background gradient is light cream/peach
- Sphere moves smoothly with scroll (no jitter)
- 60fps on mid-range hardware

**Implementation Details**:

- Adjust bloom settings if needed
- Fine-tune color values
- Adjust sparkle count for performance
- Test on different screen sizes

**Verification Criteria**:

- Visual quality checklist from implementation-plan.md:658-665 passes
- Performance requirements from implementation-plan.md:668-672 pass
- `npx nx serve angular-3d-demo` shows polished result

---

**Batch 4 Verification**:

- [ ] Home page integration complete
- [ ] Old hero-3d-teaser can be deprecated (keep for now)
- [ ] Glass sphere hero looks production-quality
- [ ] 60fps maintained
- [ ] All visual quality criteria pass
- [ ] Build passes: `npx nx build angular-3d-demo`

---

## Summary

| Batch | Name                      | Tasks | Developer          | Dependencies |
| ----- | ------------------------- | ----- | ------------------ | ------------ |
| 1     | SparkleCoronaComponent    | 4     | frontend-developer | None         |
| 2     | GlassSphereSceneComponent | 5     | frontend-developer | Batch 1      |
| 3     | GlassSphereHeroComponent  | 4     | frontend-developer | Batch 2      |
| 4     | Home Integration + Polish | 3     | frontend-developer | Batch 3      |

**Total Estimated Effort**: 16-20 hours

---

## Files Summary

### CREATE

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\sparkle-corona.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-hero.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\glass-sphere-scene.component.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\shared\components\glass-sphere-hero\index.ts`

### MODIFY

- `D:\projects\angular-3d-workspace\libs\angular-3d\src\lib\primitives\index.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\home.component.ts`

### DEPRECATE (later)

- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\pages\home\scenes\hero-3d-teaser.component.ts`
