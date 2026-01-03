# Implementation Plan - TASK_2025_033

## Production-Quality Glass Sphere Hero Component

### Executive Summary

Create a reusable, production-quality glass sphere hero component inspired by Blueyard.com that:

1. Features a glossy glass sphere with PMREMGenerator environment map reflections
2. Has shell-distributed sparkle particles (corona effect, NOT volume fill)
3. Includes multi-color twinkling sparkles (white, peach, gold)
4. Supports scroll-driven sphere movement (bottom-center to top-right)
5. **GSAP-animated hero content** (badge, title, subtitle, feature pills, CTA buttons)
6. **Viewport animations** on load (staggered reveal effects)
7. **Scroll-linked text fade-out** as user scrolls
8. Can be dropped into any page as a standalone hero section

---

## 1. Architecture Overview

### Component Hierarchy

```
apps/angular-3d-demo/src/app/
  shared/
    components/
      glass-sphere-hero/                    # NEW - Reusable hero component folder
        glass-sphere-hero.component.ts      # Main container with GSAP animations
        glass-sphere-scene.component.ts     # 3D scene with glass sphere
        index.ts                            # Barrel export

libs/angular-3d/src/lib/primitives/
  sparkle-corona.component.ts               # NEW - Shell-distributed particles (library)
```

### Key Imports for Hero Component

```typescript
// angular-gsap imports for hero animations
import { ScrollAnimationDirective, ViewportAnimationDirective } from '@hive-academy/angular-gsap';

// angular-3d imports for 3D scene
import {
  Scene3dComponent,
  EffectComposerComponent,
  BloomEffectComponent,
  SparkleCoronaComponent, // NEW
} from '@hive-academy/angular-3d';
```

### Why This Structure?

1. **Shared location** - `shared/components/` makes it reusable across pages
2. **Three-component separation** - Follows volumetric-caustics-scene pattern:
   - Container component (CSS layout, scroll integration)
   - Scene content component (3D objects, lights, env map)
   - Sparkle component (specialized particle system)

### Integration Strategy

```typescript
// home.component.ts - REPLACE hero-3d-teaser
import { GlassSphereHeroComponent } from '../../shared/components/glass-sphere-hero/glass-sphere-hero.component';

@Component({
  imports: [GlassSphereHeroComponent, ...],
  template: `
    <section class="min-h-screen relative overflow-hidden">
      <app-glass-sphere-hero
        [scrollProgress]="scrollProgress()"
        (progressChange)="onProgressChange($event)"
      />
    </section>
  `
})
```

---

## 2. Component Specifications

### 2.1 GlassSphereHeroComponent (Container)

**Purpose**: Reusable hero section with CSS background gradient and 3D canvas overlay

**File**: `apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-hero.component.ts`

**Pattern Source**: `blueyard-scene.component.ts:54-178` (container with layers)

**Responsibilities**:

- Light cream/peach CSS gradient background
- 3D scene positioned as overlay with transparent canvas
- Scroll progress input/output for external control
- Optional text overlay slot via `<ng-content>`

**Inputs**:
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `scrollProgress` | `number` | `0` | External scroll progress (0-1) |
| `gradientStart` | `string` | `'#FFF8F0'` | CSS gradient start color |
| `gradientEnd` | `string` | `'#FFE4C4'` | CSS gradient end color |
| `height` | `string` | `'100vh'` | Container height |
| `badgeText` | `string` | `'Angular 3D'` | Badge text content |
| `titleLine1` | `string` | `'Build Stunning'` | First line of title |
| `titleLine2` | `string` | `'3D Experiences'` | Second line of title (gradient color) |
| `subtitle` | `string` | `'...'` | Subtitle text |
| `featurePills` | `string[]` | `['WebGPU', 'TSL', 'Signals']` | Feature pill labels |
| `primaryButtonText` | `string` | `'Get Started'` | Primary CTA button text |
| `secondaryButtonText` | `string` | `'See Examples'` | Secondary button text |
| `secondaryButtonHref` | `string` | `'#features'` | Secondary button link |

**Outputs**:
| Output | Type | Description |
|--------|------|-------------|
| `progressChange` | `EventEmitter<number>` | Emits scroll progress when using internal scroll |
| `primaryAction` | `EventEmitter<void>` | Emits when primary CTA button is clicked |

**Template Structure**:

```html
<div class="hero-container" [style.height]="height()">
  <!-- CSS Gradient Background -->
  <div class="gradient-layer" [style.background]="gradient()"></div>

  <!-- 3D Scene Layer (transparent canvas) -->
  <div class="scene-layer">
    <a3d-scene-3d [cameraPosition]="[0, 0, 12]" [cameraFov]="50" [backgroundColor]="null">
      <app-glass-sphere-scene [scrollProgress]="scrollProgress()" />
    </a3d-scene-3d>
  </div>

  <!-- Hero Content Layer with GSAP Animations -->
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
  >
    <!-- Badge -->
    <div viewportAnimation [viewportConfig]="{ animation: 'scaleIn', duration: 0.6, delay: 0.1 }">
      <span class="hero-badge">{{ badgeText() }}</span>
    </div>

    <!-- Main Title -->
    <h1 viewportAnimation [viewportConfig]="{ animation: 'slideUp', duration: 0.8, delay: 0.2 }">
      <span class="title-line-1">{{ titleLine1() }}</span>
      <span class="title-line-2">{{ titleLine2() }}</span>
    </h1>

    <!-- Subtitle -->
    <p viewportAnimation [viewportConfig]="{ animation: 'fadeIn', duration: 0.8, delay: 0.4 }">{{ subtitle() }}</p>

    <!-- Feature Pills -->
    <div class="pills-container" viewportAnimation [viewportConfig]="{ animation: 'slideUp', duration: 0.6, delay: 0.5 }">
      @for (pill of featurePills(); track pill) {
      <span class="feature-pill">{{ pill }}</span>
      }
    </div>

    <!-- CTA Buttons -->
    <div class="cta-container" viewportAnimation [viewportConfig]="{ animation: 'slideUp', duration: 0.6, delay: 0.6 }">
      <button class="btn-primary" (click)="primaryAction.emit()">{{ primaryButtonText() }}</button>
      <a [href]="secondaryButtonHref()" class="btn-secondary">{{ secondaryButtonText() }}</a>
    </div>

    <!-- Scroll Indicator -->
    <div class="scroll-indicator" viewportAnimation [viewportConfig]="{ animation: 'fadeIn', duration: 0.6, delay: 0.8 }">
      <span>Scroll to explore</span>
      <div class="scroll-mouse"><div class="scroll-dot"></div></div>
    </div>
  </div>
</div>
```

**CSS Critical Points**:

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

---

### 2.2 GlassSphereSceneComponent (3D Content)

**Purpose**: Child component containing all 3D objects - glass sphere, sparkles, lighting

**File**: `apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-scene.component.ts`

**Pattern Source**: `volumetric-caustics-scene.component.ts:111-354` (child component pattern)

**Why Child Component?**

- Requires `SceneService.inject()` which needs to be inside Scene3dComponent
- Separates 3D logic from CSS layout concerns
- Enables environment map setup via PMREMGenerator

**Responsibilities**:

- Create PMREMGenerator environment map for glossy reflections
- Create glass sphere with MeshStandardNodeMaterial (low roughness)
- Add subtle internal glow via fresnel emissive (NOT high emissiveIntensity)
- Position sphere based on scroll progress
- Coordinate sparkle corona components

**Inputs**:
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `scrollProgress` | `number` | `0` | Controls sphere position (0=bottom, 1=top-right) |

**Key Technical Decisions**:

#### Environment Map (Critical for Glass Look)

**Evidence**: `volumetric-caustics-scene.component.ts:177-232`

```typescript
// Pattern from volumetric-caustics-scene
private setupEnvironment(scene: THREE.Scene, renderer: THREE.WebGPURenderer): void {
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Create simple gradient environment for warm reflections
  const envScene = new THREE.Scene();
  const envGeometry = new THREE.SphereGeometry(50, 32, 32);
  const envMaterial = new THREE.MeshBasicMaterial({
    color: 0xfff0e0, // Warm cream for soft reflections
    side: THREE.BackSide,
  });
  // ... add "light" spheres for specular highlights

  scene.environment = envMap;
}
```

#### Glass Sphere Material

**WRONG** (current blueyard-scene):

```typescript
// emissiveIntensity: 2.2 = glowing sun, not glass
<a3d-sphere [emissiveIntensity]="2.2" />
```

**CORRECT** (production quality):

```typescript
// Pattern from volumetric-caustics-scene.component.ts:257-261
const material = new THREE.MeshStandardNodeMaterial({
  metalness: 0.0,
  roughness: 0.1, // KEY: Low roughness = glossy reflections
});

// Subtle internal color (not raymarched, simpler approach)
const glassColor = vec3(1.0, 0.95, 0.9); // Warm white
material.colorNode = glassColor;

// Fresnel edge glow (glass rim effect)
const viewDir = normalize(cameraPosition.sub(positionWorld));
const rim = float(1).sub(abs(dot(normalWorld, viewDir)));
const fresnelPower = pow(rim, float(3.0));
const edgeGlow = vec3(1.0, 0.85, 0.7).mul(fresnelPower).mul(0.3); // Subtle warm glow
material.emissiveNode = edgeGlow;
```

#### Scroll-Driven Position

**Evidence**: `blueyard-scene.component.ts:356-376` (position interpolation)

```typescript
// Start: bottom center
// End: top right
public readonly spherePosition = computed((): [number, number, number] => {
  const p = this.scrollProgress();

  const startX = 0, startY = -4;
  const endX = 5, endY = 3;

  // Ease-out cubic for smooth deceleration
  const eased = 1 - Math.pow(1 - p, 3);

  const x = startX + (endX - startX) * eased;
  const y = startY + (endY - startY) * eased;

  return [x, y, 0];
});
```

---

### 2.3 SparkleCoronaComponent (NEW Library Feature)

**Purpose**: Shell-distributed particles around sphere edge with multi-color twinkling

**File**: `libs/angular-3d/src/lib/primitives/sparkle-corona.component.ts`

**Why New Component?**
The existing `ParticleSystemComponent` only supports:

- `sphere` - volume fill (wrong for corona)
- `box` - cubic volume
- `cone` - cone volume

We need: **shell distribution** (particles on sphere surface, not inside)

**Pattern Source**: `particle-system.component.ts:59-71` (distribution function pattern)

**New Distribution Function**:

```typescript
/**
 * Generate positions on sphere SURFACE (shell), not inside volume
 * This creates the corona/halo effect around the glass sphere edge
 */
function generateShellPositions(count: number, innerRadius: number, outerRadius: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.acos(2 * Math.random() - 1);
    // Random radius between inner and outer (thin shell)
    const r = innerRadius + Math.random() * (outerRadius - innerRadius);
    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);
  }
  return positions;
}
```

**Multi-Color Sparkle Implementation**:

```typescript
// Three color groups with different vertex colors
const colors = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  const colorChoice = Math.random();
  let r, g, b;

  if (colorChoice < 0.5) {
    // 50% white sparkles
    [r, g, b] = [1.0, 1.0, 1.0];
  } else if (colorChoice < 0.8) {
    // 30% peach sparkles
    [r, g, b] = [1.0, 0.85, 0.7];
  } else {
    // 20% gold sparkles
    [r, g, b] = [1.0, 0.8, 0.4];
  }

  const idx = i * 3;
  colors[idx] = r;
  colors[idx + 1] = g;
  colors[idx + 2] = b;
}
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
material.vertexColors = true;
```

**Twinkling Animation** (opacity oscillation):

```typescript
// In render loop callback
private twinklePhases: Float32Array;  // Random phase per particle

private animate = (delta: number, elapsed: number) => {
  const opacities = this.geometry.getAttribute('opacity') as THREE.BufferAttribute;

  for (let i = 0; i < this.count; i++) {
    // Sine wave with random phase and speed
    const phase = this.twinklePhases[i];
    const speed = 1 + Math.random() * 2;  // 1-3 Hz
    const opacity = 0.3 + 0.7 * Math.abs(Math.sin(elapsed * speed + phase));
    opacities.setX(i, opacity);
  }
  opacities.needsUpdate = true;
};
```

**Component Inputs**:
| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | `number` | `3000` | Number of sparkle particles |
| `innerRadius` | `number` | `2.5` | Inner shell radius |
| `outerRadius` | `number` | `3.0` | Outer shell radius |
| `baseSize` | `number` | `0.02` | Base particle size |
| `position` | `[x,y,z]` | `[0,0,0]` | Corona center position |
| `twinkleSpeed` | `number` | `2.0` | Twinkle animation speed |
| `colorWeights` | `{white, peach, gold}` | `{0.5, 0.3, 0.2}` | Color distribution |

---

## 3. Technical Implementation Details

### 3.1 Environment Map for Glass Reflections

**Why PMREMGenerator?**

- Creates prefiltered environment map optimized for PBR materials
- Enables smooth, realistic reflections on low-roughness surfaces
- Used by volumetric-caustics-scene for the "glossy shell" effect

**Implementation**:

```typescript
// Evidence: volumetric-caustics-scene.component.ts:177-232

private setupEnvironment(): void {
  const renderer = this.sceneService.renderer() as THREE.WebGPURenderer;
  const scene = this.sceneService.scene();

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();

  // Create warm-toned environment scene
  const envScene = new THREE.Scene();

  // Large background sphere (warm cream)
  const bgGeom = new THREE.SphereGeometry(50, 32, 32);
  const bgMat = new THREE.MeshBasicMaterial({
    color: 0xfff0e0,  // Warm cream
    side: THREE.BackSide
  });
  envScene.add(new THREE.Mesh(bgGeom, bgMat));

  // Bright specular highlight
  const light1 = new THREE.Mesh(
    new THREE.SphereGeometry(8, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
  );
  light1.position.set(30, 40, 20);
  envScene.add(light1);

  // Warm secondary highlight
  const light2 = new THREE.Mesh(
    new THREE.SphereGeometry(4, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffd4a0 })
  );
  light2.position.set(-25, 15, -20);
  envScene.add(light2);

  // Generate and apply environment map
  const envCamera = new THREE.CubeCamera(0.1, 100, new THREE.WebGLCubeRenderTarget(256));
  envCamera.update(renderer, envScene);
  const envMap = pmremGenerator.fromCubemap(envCamera.renderTarget.texture).texture;

  scene.environment = envMap;

  // Cleanup
  bgGeom.dispose();
  bgMat.dispose();
  pmremGenerator.dispose();
}
```

### 3.2 Glass Sphere with TSL Material

**Pattern**: Use `MeshStandardNodeMaterial` with TSL nodes for:

- Low roughness (0.1) for glossy surface
- Fresnel-based edge glow (subtle, not sun-like)
- Optional subtle internal color variation

```typescript
private createGlassSphere(): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(2.5, 64, 64);

  const material = new THREE.MeshStandardNodeMaterial({
    metalness: 0.0,
    roughness: 0.1,  // Glossy!
    transparent: true,
    opacity: 0.95,
  });

  // Subtle warm white base color
  material.colorNode = vec3(1.0, 0.98, 0.95);

  // Fresnel rim glow (evidence: volumetric-caustics-scene.component.ts:339-345)
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const rim = float(1).sub(abs(dot(normalWorld, viewDir)));
  const fresnelPower = pow(rim, float(2.5));

  // Warm peach edge glow - SUBTLE (0.15 intensity, not 2.2!)
  const edgeGlow = vec3(1.0, 0.85, 0.7).mul(fresnelPower).mul(0.15);
  material.emissiveNode = edgeGlow;

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = false;  // No hard shadows for glass

  return mesh;
}
```

### 3.3 Shell Particle Distribution Math

**Why shell, not sphere?**

| Distribution    | Formula                                | Visual Effect                 |
| --------------- | -------------------------------------- | ----------------------------- |
| Sphere (volume) | `r = cbrt(random) * radius`            | Fog-like, fills interior      |
| Shell (surface) | `r = inner + random * (outer - inner)` | Corona halo, ring around edge |

**Blueyard uses shell distribution** - particles only exist in thin band around sphere edge.

### 3.4 Scroll Integration Options

**Option A: External Control (Recommended for Reusability)**

```typescript
// Parent component controls scroll
@Component({
  template: ` <app-glass-sphere-hero [scrollProgress]="scrollProgress()" /> `,
})
export class HomeComponent {
  scrollProgress = signal(0);

  @HostListener('window:scroll')
  onScroll() {
    const max = document.body.scrollHeight - window.innerHeight;
    this.scrollProgress.set(window.scrollY / max);
  }
}
```

**Option B: Internal Hijacked Scroll**

```typescript
// Component manages its own scroll
<div hijackedScroll (progressChange)="progress.set($event)">
  <app-glass-sphere-scene [scrollProgress]="progress()" />
</div>
```

---

## 4. File Structure Summary

### New Files to CREATE

```
apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/
  glass-sphere-hero.component.ts        # Container with gradient + scene
  glass-sphere-scene.component.ts       # 3D content (sphere, env map, sparkles)
  index.ts                              # Barrel export

libs/angular-3d/src/lib/primitives/
  sparkle-corona.component.ts           # NEW shell-distributed particles
```

### Files to MODIFY

```
apps/angular-3d-demo/src/app/pages/home/home.component.ts
  - Replace Hero3dTeaserComponent import with GlassSphereHeroComponent

libs/angular-3d/src/lib/primitives/index.ts
  - Export SparkleCoronaComponent
```

### Files to DELETE (Optional, after verification)

```
apps/angular-3d-demo/src/app/pages/home/scenes/hero-3d-teaser.component.ts
  - DEPRECATE after glass sphere hero is working
  - Keep initially for A/B comparison
```

---

## 5. Implementation Phases

### Phase 1: SparkleCoronaComponent (Library)

**Priority**: HIGH - Foundation for visual effect
**Effort**: 3-4 hours

1. Create `sparkle-corona.component.ts` in angular-3d primitives
2. Implement shell distribution function
3. Add multi-color vertex colors
4. Implement twinkling animation via render loop
5. Export from primitives/index.ts
6. Write basic tests

### Phase 2: GlassSphereSceneComponent (Demo App)

**Priority**: HIGH - Core visual implementation
**Effort**: 4-5 hours

1. Create scene component with SceneService injection
2. Implement PMREMGenerator environment setup
3. Create glass sphere with MeshStandardNodeMaterial
4. Add fresnel edge glow via TSL
5. Integrate SparkleCoronaComponent
6. Add scroll-based position interpolation

### Phase 3: GlassSphereHeroComponent (Container + Hero Content)

**Priority**: HIGH - Complete hero section
**Effort**: 4-5 hours

1. Create container component with GSAP directive imports
2. CSS gradient background layer (light cream/peach)
3. Transparent 3D canvas overlay
4. Hero content layer with GSAP animations:
   - Badge with `viewportAnimation` (scaleIn)
   - Title with `viewportAnimation` (slideUp)
   - Subtitle with `viewportAnimation` (fadeIn)
   - Feature pills with `viewportAnimation` (slideUp)
   - CTA buttons with `viewportAnimation` (slideUp)
   - Scroll indicator with `viewportAnimation` (fadeIn)
5. Scroll-linked content fade-out via `scrollAnimation`
6. Dark text styling for light background (like Blueyard)
7. Signal-based inputs for all content customization

### Phase 4: Home Page Integration

**Priority**: MEDIUM - Replace existing hero
**Effort**: 1-2 hours

1. Import GlassSphereHeroComponent in home.component.ts
2. Replace hero-3d-teaser usage
3. Add scroll listener for progress
4. Verify visual quality matches requirements

### Phase 5: Polish & Optimization

**Priority**: LOW - Quality refinement
**Effort**: 2-3 hours

1. Performance profiling (particle count, env map resolution)
2. Mobile responsiveness testing
3. Bloom post-processing adjustment
4. A/B comparison with original Blueyard reference

---

## 6. Quality Requirements

### Visual Quality Checklist

- [ ] Glass sphere has visible reflections (not matte/flat)
- [ ] Sparkles form a corona AROUND sphere edge (not fog inside)
- [ ] Sparkles twinkle (oscillating brightness)
- [ ] Multiple sparkle colors visible (white, peach, gold)
- [ ] Edge glow is SUBTLE (not sun-like glowing)
- [ ] Background gradient is light cream/peach (not dark)
- [ ] Sphere moves smoothly with scroll (no jitter)

### Performance Requirements

- [ ] Maintains 60fps on mid-range hardware
- [ ] Particle count optimized (3000-5000, not 50000)
- [ ] Environment map cached (not regenerated each frame)
- [ ] Proper Three.js resource cleanup on destroy

### Reusability Requirements

- [ ] Component can be used on any page (not home-specific)
- [ ] Gradient colors are configurable inputs
- [ ] Scroll progress can be controlled externally
- [ ] Text overlay works via ng-content

---

## 7. Dependencies

### Existing (No Changes Needed)

| Dependency              | Location   | Purpose                      |
| ----------------------- | ---------- | ---------------------------- |
| Scene3dComponent        | angular-3d | Canvas container             |
| SceneService            | angular-3d | Scene/camera/renderer access |
| RenderLoopService       | angular-3d | Animation frame callbacks    |
| EffectComposerComponent | angular-3d | Bloom post-processing        |
| BloomEffectComponent    | angular-3d | Glow effect                  |

### Three.js Imports (WebGPU)

```typescript
import * as THREE from 'three/webgpu';
import { Fn, vec3, float, normalize, dot, abs, pow, cameraPosition, positionWorld, normalWorld } from 'three/tsl';
```

### New Component (SparkleCoronaComponent)

Will be added to `@hive-academy/angular-3d` and exported from:

- `libs/angular-3d/src/lib/primitives/sparkle-corona.component.ts`
- `libs/angular-3d/src/lib/primitives/index.ts`

---

## 8. Risk Assessment

### Technical Risks

| Risk                                | Mitigation                                  |
| ----------------------------------- | ------------------------------------------- |
| PMREMGenerator WebGPU compatibility | Test early, fall back to basic env map      |
| Particle performance with twinkling | Use BufferAttribute updates, not recreation |
| Transparent canvas over gradient    | Test z-index and pointer-events carefully   |

### Design Risks

| Risk                                | Mitigation                            |
| ----------------------------------- | ------------------------------------- |
| Glass looks matte instead of glossy | Verify roughness=0.1, check env map   |
| Corona looks like fog               | Verify shell distribution, not sphere |
| Glow too bright/sun-like            | Keep emissive intensity < 0.3         |

---

## 9. Success Criteria

### Definition of Done

1. **Visual Match**: Component visually resembles Blueyard.com hero (glass sphere, sparkle corona, light background)
2. **Technical Quality**: Uses correct patterns (PMREMGenerator, shell distribution, TSL fresnel)
3. **Reusability**: Can be dropped into any Angular page with minimal configuration
4. **Performance**: 60fps maintained with optimized particle count
5. **Integration**: Successfully replaces hero-3d-teaser on home page

### Acceptance Test

```typescript
// Test: Component renders correctly
it('should render glass sphere with reflections', async () => {
  const fixture = TestBed.createComponent(GlassSphereHeroComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  // Canvas should exist
  expect(fixture.nativeElement.querySelector('canvas')).toBeTruthy();

  // Gradient background should have correct colors
  const gradient = fixture.nativeElement.querySelector('.gradient-layer');
  expect(gradient.style.background).toContain('#FFF8F0');
});
```

---

## 10. Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: `frontend-developer`

**Rationale**:

1. Requires Angular component architecture expertise
2. Heavy Three.js/WebGPU shader work (TSL nodes)
3. CSS layer composition (gradient + canvas overlay)
4. No backend/NestJS involvement

### Complexity Assessment

**Complexity**: HIGH
**Estimated Effort**: 16-20 hours total

**Breakdown**:
| Phase | Effort | Skills Required |
|-------|--------|-----------------|
| SparkleCoronaComponent | 3-4h | Three.js particles, BufferGeometry |
| GlassSphereSceneComponent | 4-5h | PMREMGenerator, TSL materials |
| GlassSphereHeroComponent + GSAP | 4-5h | Angular, GSAP, CSS composition |
| Home Integration | 1-2h | Angular routing, imports |
| Polish | 2-3h | Performance tuning |

### Critical Verification Points

**Before implementation, verify**:

1. **PMREMGenerator exists in Three.js WebGPU**:

   - Import: `import * as THREE from 'three/webgpu'`
   - Verified: volumetric-caustics-scene.component.ts:183

2. **MeshStandardNodeMaterial supports colorNode/emissiveNode**:

   - Import: `import * as THREE from 'three/webgpu'`
   - Verified: volumetric-caustics-scene.component.ts:259, 336, 345

3. **TSL fresnel pattern**:

   - Import: `from 'three/tsl'`
   - Verified: volumetric-caustics-scene.component.ts:339-345

4. **RenderLoopService callback registration**:
   - Verified: angular-3d/CLAUDE.md:116-119
   - Pattern: `this.renderLoop.registerUpdateCallback((delta) => {})`

### Files Affected Summary

**CREATE**:

- `apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-hero.component.ts`
- `apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/glass-sphere-scene.component.ts`
- `apps/angular-3d-demo/src/app/shared/components/glass-sphere-hero/index.ts`
- `libs/angular-3d/src/lib/primitives/sparkle-corona.component.ts`

**MODIFY**:

- `apps/angular-3d-demo/src/app/pages/home/home.component.ts`
- `libs/angular-3d/src/lib/primitives/index.ts`

**DEPRECATE** (later):

- `apps/angular-3d-demo/src/app/pages/home/scenes/hero-3d-teaser.component.ts`
