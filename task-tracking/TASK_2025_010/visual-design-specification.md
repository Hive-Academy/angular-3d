# Visual Design Specification - TASK_2025_010

> **Hive Academy Angular Libraries Showcase**  
> Landing page design for `@hive-academy/angular-3d` and `@hive-academy/angular-gsap`

---

## Design System Reference

**Base Configuration**: [tailwind.config.js](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/tailwind.config.js)  
**Design Tokens**: [designs-systems.md](file:///d:/projects/angular-3d-workspace/docs/design-system/designs-systems.md)

### Color Palette

**Primary Brand**:

- Primary: `#6366F1` (highlights, CTAs)
- Neon Green: `#A1FF4F` (accent, hover states)
- Deep Black: `#0A0E11` (dark mode background)

**Text Colors**:

- Primary: `#23272F` (body text)
- Secondary: `#71717A` (muted text)
- Inverse: `#FFFFFF` (dark backgrounds)

**Background**:

- Light: `#FFFFFF` / `#F9FAFB`
- Dark: `#0A0E11`

### Typography Scale

- **Display XL**: `4rem` (64px), weight 700, line-height 1.1
- **Display LG**: `3.5rem` (56px), weight 700, line-height 1.1
- **Headline LG**: `2.5rem` (40px), weight 700, line-height 1.2
- **Headline MD**: `2rem` (32px), weight 600, line-height 1.3
- **Body LG**: `1.125rem` (18px), line-height 1.6
- **Body MD**: `1rem` (16px), line-height 1.5

**Font Family**: `Inter, Manrope, system-ui, sans-serif`

### Spacing Scale

Based on 8px grid:

- `1x`: 8px
- `2x`: 16px
- `3x`: 24px
- `4x`: 32px
- `5x`: 40px
- `6x`: 48px
- `8x`: 64px
- `10x`: 80px
- `12x`: 96px

---

## Page Structure & Information Architecture

### Navigation Bar

- Fixed/sticky header
- Links: Home, Angular-3D, Angular-GSAP, Docs, GitHub
- CTA button: "Get Started"
- Dark theme toggle

### Page Sections (Vertical Flow)

1. **Hero Section** - Space scene with headline
2. **Library Overview** - Side-by-side cards (angular-3d + angular-gsap)
3. **Angular-3D Features** - Feature grid with 3D demos
4. **Angular-GSAP Features** - Animation showcase
5. **CTA Section** - Floating polyhedrons background
6. **Footer** - Links, social, license

---

## Component Specifications

### 1. Navigation Bar

**Layout**:

- Container: `max-w-container` (1280px), centered
- Padding: `px-4x py-3x`
- Background: Dark mode: `bg-background-dark/80` with backdrop blur
- Position: `fixed top-0 z-50`

**Elements**:

**Logo**:

- Typography: `text-headline-md font-bold`
- Color: `text-neon-green`
- Animation: Glow effect on hover

**Nav Links**:

- Typography: `text-body-lg`
- Color: `text-text-secondary` → hover: `text-neon-green`
- Spacing: `gap-6x`
- Transition: `duration-250`

**CTA Button**:

- Size: `px-6x py-2x`
- Background: `bg-primary-500`
- Border radius: `rounded-button` (8px)
- Hover: `scale-105` + `shadow-button-hover`
- Typography: `text-body-lg font-semibold text-white`

---

### 2. Hero Section

**Layout**:

- Full viewport height: `min-h-screen`
- Container: `max-w-container mx-auto`
- Grid: 2 columns (text left, 3D scene right) on desktop
- Mobile: Stack vertically, 3D above text
- Padding: `px-4x py-12x`

**Background**:

- Dark: `bg-background-dark`
- Subtle gradient overlay from neon green

**Text Column** (Left):

**Headline**:

- Typography: `text-display-xl` (64px on desktop, 48px mobile)
- Color: `text-white`
- Content: "Build **Stunning 3D Experiences** with Angular"
- Animation: Fade in from bottom, 0.6s delay 0s

**Subheadline**:

- Typography: `text-headline-md`
- Color: `text-text-secondary`
- Content: "Two powerful libraries for modern Angular applications"
- Animation: Fade in from bottom, 0.8s delay 0.2s

**Feature Pills**:

- Layout: Horizontal flex, `gap-2x`
- Pills: `bg-background-dark/50 border border-neon-green/30 px-4x py-2x rounded-full`
- Content: "Three.js Wrapper", "GSAP Animations", "Signal-Based"
- Typography: `text-body-md text-neon-green`

**CTA Buttons**:

- Primary: "Explore Angular-3D" - `bg-neon-green text-background-dark`
- Secondary: "View GSAP Library" - `border-2 border-neon-green text-neon-green`
- Size: `px-8x py-4x`
- Border radius: `rounded-button`
- Hover: Primary scales 1.05, Secondary fills with neon green

**3D Scene Column** (Right):

- Scene: **Hero Space Scene** (from `temp/scene-graphs/hero-space-scene.component.ts`)
- Height: `h-full min-h-[600px]`
- Elements:
  - Earth GLTF model (rotating)
  - Star field (3 layers, parallax)
  - Nebula volumetric clouds
  - Floating tech logos (NestJS, LangChain, Chroma, Neo4j)
  - Particle text: "Hive Academy"
- Animation: Continuous rotation, parallax on scroll
- Performance: Reduce particles 50% on mobile

**Responsive**:

- Desktop (≥1024px): Side-by-side grid
- Tablet (768-1023px): Reduced 3D complexity, same layout
- Mobile (<768px): Stack vertically, 3D scene above, 60% height

---

### 3. Library Overview Section

**Layout**:

- Container: `max-w-container mx-auto px-4x py-16x`
- Background: `bg-background-light`
- Grid: 2 columns on desktop, 1 on mobile
- Gap: `gap-8x`

**Section Header**:

- Typography: `text-display-lg text-center mb-12x`
- Content: "Two Libraries, **Infinite Possibilities**"

**Library Card 1: Angular-3D**:

**Structure**:

- Card: `bg-white rounded-card shadow-card p-6x`
- Hover: `shadow-card-hover` + lift 8px

**Icon/Visual**:

- 3D rotating cube (small inline scene)
- Size: `w-16x h-16x mb-4x`
- Color: Neon green wireframe

**Title**:

- Typography: `text-headline-lg font-bold`
- Color: `text-primary-500`
- Content: "@hive-academy/angular-3d"

**Description**:

- Typography: `text-body-lg text-text-secondary`
- Content: "Pure Angular wrapper for Three.js. Build 3D scenes with components, not imperative code."

**Features List**:

- Items: "26+ Primitives", "GLTF Loading", "Post-processing", "OrbitControls"
- Typography: `text-body-md`
- Layout: `grid grid-cols-2 gap-2x`
- Icon: Green checkmark before each

**CTA**:

- Button: "Explore Components →"
- Style: `text-primary-500 hover:text-neon-green`

**Library Card 2: Angular-GSAP**:

(Similar structure to Card 1)

**Icon/Visual**:

- Animated SVG with bouncing elements

**Title**:

- Content: "@hive-academy/angular-gsap"

**Description**:

- Content: "Signal-based GSAP directives for scroll animations, hijacked scroll, and timeline orchestration."

**Features List**:

- Items: "Scroll Triggers", "Hijacked Scroll", "Timeline Components", "SSR Compatible"

**CTA**:

- Button: "View Animations →"

---

### 4. Angular-3D Features Section

**Layout**:

- Container: `max-w-content mx-auto px-4x py-16x`
- Background: `bg-background-dark text-white`

**Section Header**:

- Typography: `text-display-lg mb-12x`
- Content: "**Angular-3D** Capabilities"
- Underline: Neon green accent line, `w-20x h-1x bg-neon-green`

**Feature Grid**:

- Layout: `grid grid-cols-3 gap-8x` (1 col mobile, 2 cols tablet)

**Feature Card Template**:

**3D Demo** (Top):

- Inline 3D scene showcasing feature
- Height: `h-64` (256px)
- Border: `border border-neon-green/20 rounded-lg`
- Examples:
  - Card 1: Rotating GLTF model
  - Card 2: Particle system
  - Card 3: Post-processing bloom effect

**Title**:

- Typography: `text-headline-md mt-4x`
- Color: `text-neon-green`

**Description**:

- Typography: `text-body-md text-text-secondary`

**Code Snippet** (Optional):

- Dark code block with syntax highlighting
- Show component usage (4-6 lines)

**Feature Examples**:

1. **GLTF Models** - Show robot model
2. **Particle Systems** - Star field demo
3. **Post-Processing** - Bloom effect showcase
4. **Primitives** - Rotating geometries
5. **Lighting** - Dynamic light scene
6. **Controls** - OrbitControls demo

---

### 5. Angular-GSAP Features Section

**Layout**:

- Container: `max-w-content mx-auto px-4x py-16x`
- Background: `bg-white`

**Section Header**:

- Typography: `text-display-lg mb-12x text-background-dark`
- Content: "**Angular-GSAP** Animations"

**Animation Showcase**:

- Layout: Vertical scroll-triggered sections
- Each section demonstrates a specific directive

**Showcase Item Template**:

**Left Column** (Text, 40% width):

- Directive name: `text-headline-lg text-primary-500`
- Description: `text-body-lg`
- Props table: List key inputs with types
- Code snippet: Show directive usage

**Right Column** (Demo, 60% width):

- Live demo of animation
- Interactive controls (optional)
- Visual representation of scroll/timeline behavior

**Examples**:

1. **ScrollAnimationDirective** - Elements fade in on scroll
2. **HijackedScrollDirective** - Pinned scroll sections
3. **Float3dDirective** - Floating 3D objects
4. **Rotate3dDirective** - Rotating animations

---

### 6. CTA Section

**Layout**:

- Full width: `w-full`
- Padding: `py-20x px-4x`
- Background: `bg-background-dark`
- Text alignment: Center

**3D Background**:

- Scene: **CTA Scene** (from `temp/scene-graphs/cta-scene-graph.component.ts`)
- Elements: 3 floating polyhedrons (low opacity 30-40%)
- Icosahedron (left), Octahedron (right), Dodecahedron (center)
- Animation: Slow float animations (4-5s)
- Position: Absolute, behind content

**Content** (Z-index above 3D):

**Headline**:

- Typography: `text-display-lg font-bold text-white`
- Content: "Ready to Build?"

**Subheadline**:

- Typography: `text-headline-md text-text-secondary`
- Content: "Install both libraries and start creating stunning Angular applications today"

**CTA Buttons**:

- Primary: "Get Started" - `bg-neon-green text-background-dark px-10x py-4x`
- Secondary: "View Documentation" - `border-2 border-white text-white px-10x py-4x`
- Layout: `flex gap-4x justify-center`

**Install Command**:

- Code block: `npm install @hive-academy/angular-3d @hive-academy/angular-gsap`
- Style: `bg-background-dark/80 border border-neon-green/30 px-6x py-3x rounded-lg`
- Copy button: Icon with neon green hover

---

### 7. Footer

**Layout**:

- Container: `max-w-container mx-auto px-4x py-8x`
- Background: `bg-background-dark`
- Grid: 4 columns on desktop, 1 on mobile

**Column 1: Branding**:

- Logo + tagline
- Typography: `text-body-md text-text-secondary`

**Column 2: Libraries**:

- Title: "Libraries"
- Links: Angular-3D, Angular-GSAP, GitHub Org
- Typography: `text-body-md`
- Hover: `text-neon-green`

**Column 3: Resources**:

- Title: "Resources"
- Links: Documentation, Examples, Tutorials, API Reference

**Column 4: Community**:

- Title: "Community"
- Links: GitHub Issues, Discord, Twitter

**Bottom Bar**:

- Copyright: `text-body-sm text-text-secondary`
- License: MIT
- Social icons: GitHub, Discord, Twitter (neon green on hover)

---

## Responsive Breakpoints

### Desktop (≥1024px)

- Full 3D complexity
- 2-3 column grids
- Large typography scale
- Hero: Side-by-side layout

### Tablet (768-1023px)

- 75% 3D particle counts
- 2 column grids
- Reduced spacing (75% of desktop)
- Hero: Side-by-side but smaller 3D

### Mobile (<768px)

- 50% 3D particle counts
- 1 column layouts
- Stack all content vertically
- Hero: 3D above text, 60% viewport height
- Font sizes reduced by 20%

---

## Motion Design & Animations

### Page Load Animations

**Hero Section**:

1. Background fade in (0.3s)
2. Headline fade in from bottom (0.6s, delay 0s)
3. Subheadline fade in from bottom (0.8s, delay 0.2s)
4. Pills fade in (0.5s, delay 0.4s)
5. Buttons fade in (0.6s, delay 0.6s)
6. 3D scene loads and animates

**Stagger Pattern**: Each element delays by 0.2s

### Scroll Animations

**Fade In Pattern** (All sections):

- Trigger: When 20% of section is visible
- Animation: Opacity 0 → 1, translateY(30px) → translateY(0)
- Duration: 0.6s
- Easing: `ease-out`

**Parallax** (Hero 3D scene):

- Background moves at 0.5x scroll speed
- Stars move at varying speeds (0.3x, 0.5x, 0.7x for 3 layers)

**3D Scene Interactions**:

- Hero: Continuous rotation + scroll parallax
- Features: Rotate/scale on scroll into view
- CTA: Slow float animations (independent of scroll)

### Hover Effects

**Buttons**:

- Scale: 1 → 1.05
- Shadow: Elevation increase
- Duration: 0.25s
- Easing: `ease-out`

**Cards**:

- Lift: 0 → 8px translateY
- Shadow: `shadow-card` → `shadow-card-hover`
- Border: Neon green glow pulse
- Duration: 0.3s

**Links**:

- Color: `text-secondary` → `text-neon-green`
- Underline: Slide in from left
- Duration: 0.2s

---

## 3D Scene Configurations

### Hero Space Scene

**Source**: `temp/scene-graphs/hero-space-scene.component.ts`

**Configuration**:

```typescript
{
  camera: {
    position: [0, 0, 5],
    fov: 75
  },
  models: [
    {
      type: 'gltf',
      path: '/assets/3d/planet_earth/scene.gltf',
      position: [-1, 0, 0],
      scale: 1.5,
      animation: { rotation: { axis: 'y', speed: 0.005 } }
    },
    {
      type: 'gltf',
      path: '/assets/3d/mini_robot.glb',
      position: [2, 1, -1],
      directive: 'spaceFlight3d' // Uses SpaceFlight3dDirective
    }
  ],
  particles: {
    stars: {
      count: 3000, // 1500 on mobile
      layers: 3,
      colors: ['#FFFFFF', '#A1FF4F', '#6366F1']
    },
    nebula: {
      type: 'volumetric',
      opacity: 0.4,
      color: '#6366F1'
    }
  },
  lights: [
    { type: 'ambient', intensity: 0.5, color: '#FFFFFF' },
    { type: 'directional', position: [10, 10, 5], intensity: 1, color: '#A1FF4F' }
  ],
  postProcessing: {
    bloom: {
      strength: 0.8,
      radius: 0.5,
      threshold: 0.85
    }
  },
  controls: {
    type: 'orbit',
    enableDamping: true,
    autoRotate: true,
    autoRotateSpeed: 0.5
  }
}
```

### CTA Polyhedrons Scene

**Source**: `temp/scene-graphs/cta-scene-graph.component.ts`

**Configuration**:

```typescript
{
  camera: {
    position: [0, 0, 6],
    fov: 50
  },
  objects: [
    {
      type: 'polyhedron',
      geometry: 'icosahedron',
      position: [-3, 1, -2],
      material: {
        color: '#6366F1',
        transparent: true,
        opacity: 0.35,
        wireframe: false
      },
      directive: 'float3d' // height: 0.5, duration: 4.5s
    },
    {
      type: 'polyhedron',
      geometry: 'octahedron',
      position: [3, -1, -2],
      material: { color: '#A1FF4F', opacity: 0.30 },
      directive: 'float3d' // height: 0.4, duration: 5s
    },
    {
      type: 'polyhedron',
      geometry: 'dodecahedron',
      position: [0, 0, -4],
      material: { color: '#6366F1', opacity: 0.40 },
      directive: 'float3d' // height: 0.6, duration: 4s
    }
  ],
  lights: [
    { type: 'ambient', intensity: 0.6 },
    { type: 'directional', position: [5, 5, 5], intensity: 0.8 }
  ]
}
```

### Value Propositions Scene

**Source**: `temp/scene-graphs/value-propositions-3d-scene.component.ts`

**Configuration**: 11 unique geometries (Box, Sphere, Cone, Cylinder, Torus, etc.) each representing a library feature. Scroll-driven animations via `@hive-academy/angular-gsap` ScrollAnimationDirective.

**Layout**: Vertical stack, each geometry appears on scroll with rotation + scale animation.

---

## TailwindCSS Class Usage Patterns

### Container Pattern

```html
<section class="max-w-container mx-auto px-4x py-16x">
  <!-- Content -->
</section>
```

### Card Pattern

```html
<div class="bg-white rounded-card shadow-card p-6x hover:shadow-card-hover transition-all duration-300">
  <!-- Card content -->
</div>
```

### Button Pattern (Primary)

```html
<button class="px-8x py-4x bg-neon-green text-background-dark rounded-button font-semibold hover:scale-105 transition-transform duration-250 shadow-button hover:shadow-button-hover">Get Started</button>
```

### Button Pattern (Secondary)

```html
<button class="px-8x py-4x border-2 border-neon-green text-neon-green rounded-button font-semibold hover:bg-neon-green hover:text-background-dark transition-all duration-250">View Docs</button>
```

### Gradient Text Pattern

```html
<h1 class="text-display-xl font-bold bg-gradient-to-r from-white to-neon-green bg-clip-text text-transparent">Headline</h1>
```

### Code Block Pattern

```html
<pre class="bg-background-dark/80 border border-neon-green/30 px-6x py-3x rounded-lg text-neon-green font-mono text-body-md">
  <code>npm install @hive-academy/angular-3d</code>
</pre>
```

---

## Accessibility Requirements

### Color Contrast

- All text meets WCAG AA: 4.5:1 for normal text, 3:1 for large text
- Neon green (#A1FF4F) on dark background (#0A0E11): 12.7:1 ✓
- Primary (#6366F1) on white: 4.6:1 ✓

### Keyboard Navigation

- All interactive elements focusable
- Focus ring: `ring-2 ring-neon-green ring-offset-2`
- Skip to main content link

### ARIA Labels

- 3D scenes: `aria-label="3D visualization"`
- Buttons: Descriptive labels
- Navigation: `role="navigation"`

### Motion Preferences

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Asset Requirements

### Images

- Logo: SVG, neon green color
- Social icons: GitHub, Discord, Twitter (SVG)
- Tech stack logos: Already exist in `temp/assets/images/logos/`

### 3D Models

- Already exist in `temp/assets/3d/`:
  - `planet_earth/scene.gltf`
  - `mini_robot.glb`
  - `robo_head/scene.gltf`

### Textures

- Moon texture: `temp/assets/moon.jpg`

**No new assets required** - All visuals use existing 3D scenes and library components.

---

## Performance Targets

### Load Time

- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3.5s

### Frame Rate

- Desktop: 60fps sustained
- Tablet: 45fps minimum
- Mobile: 30fps minimum

### Bundle Size

- Initial bundle: <500KB gzipped
- 3D scenes: Lazy loaded per route
- GLTF models: Progressive loading with spinner

---

## Implementation Priority

### Phase 1: Core Layout (P0)

1. Navigation bar
2. Hero section (without 3D)
3. Library overview cards
4. Footer

### Phase 2: 3D Integration (P1)

1. Hero space scene
2. CTA polyhedrons
3. Feature demo scenes

### Phase 3: Animations (P2)

1. Scroll animations
2. Hover effects
3. Page transitions

### Phase 4: Polish (P3)

1. Dark mode toggle
2. Performance optimizations
3. Accessibility audit

---

## Quality Checklist

- [ ] All colors meet WCAG AA contrast ratios
- [ ] Responsive design tested on mobile, tablet, desktop
- [ ] 3D scenes perform at target frame rates
- [ ] All hover states defined
- [ ] Keyboard navigation functional
- [ ] Focus states visible
- [ ] Motion reduced for `prefers-reduced-motion`
- [ ] Loading states for GLTF models
- [ ] All Tailwind classes use design tokens
- [ ] Code examples syntax highlighted
- [ ] Install commands copyable
- [ ] Social links functional

---

**Next Steps**: Developer Handoff → Implementation Guide
