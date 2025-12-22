# Requirements Document - TASK_2025_021

## Introduction

This task involves redesigning the home page hero section to create a more immersive 3D experience by converting all text content from HTML overlays to 3D smoke particle text components. The goal is to achieve a cohesive, fully 3D scene where Earth serves as a right-side focal point with hero messaging prominently displayed using particle effects on the left side.

**Business Context**: The current implementation uses HTML text overlays that feel disconnected from the 3D scene. Converting to 3D particle text creates a unified visual experience that better demonstrates the library's capabilities and provides a more engaging landing page.

**Value Proposition**: This redesign showcases the particle text components as production-ready features while improving visual coherence and user engagement through full 3D immersion.

---

## Requirements

### Requirement 1: Remove Existing Smoke Text Above Earth

**User Story:** As a user viewing the hero section, I want the Earth to be the clear focal point without competing text elements, so that the scene feels less cluttered and more balanced.

#### Acceptance Criteria

1. WHEN the hero section loads THEN the "Angular 3D Library" smoke particle text (currently at position [0, 7.5, 0]) SHALL be completely removed from the scene
2. WHEN the Earth model renders THEN it SHALL remain visible and animated with rotation at its current position (center, offsetZ: -9)
3. WHEN users interact with orbit controls THEN they SHALL see only the Earth, star fields, nebula effects, flying robots, and floating spheres (no particle text above Earth)

---

### Requirement 2: Reposition Earth to Right Side

**User Story:** As a user viewing the hero section, I want the Earth positioned on the right side of the viewport, so that it serves as a visual anchor while allowing space for hero messaging on the left.

#### Acceptance Criteria

1. WHEN the Earth GLTF model initializes THEN its viewport position SHALL be set to approximately 70% from the left edge of the viewport
2. WHEN using ViewportPositionDirective THEN the configuration SHALL use percentage positioning with `{ x: '70%', y: '50%' }` OR custom percentage object positioning
3. WHEN the window resizes THEN the Earth SHALL maintain its 70% horizontal position responsively through ViewportPositioningService
4. WHEN the Earth is repositioned THEN its scale (2.3), rotation animation (axis: 'y', speed: 120), and Z-depth (offsetZ: -9) SHALL remain unchanged
5. WHEN orbit controls are enabled THEN users SHALL still be able to rotate and zoom the entire scene with Earth at its new position

---

### Requirement 3: Convert Hero Heading to 3D Particle Text (Left Side)

**User Story:** As a user viewing the hero section, I want the main heading "Build Stunning Angular Experiences" displayed as 3D smoke particle text, so that it feels integrated with the space scene and creates visual impact.

#### Acceptance Criteria

1. WHEN the hero heading renders THEN it SHALL use `InstancedParticleTextComponent` for performance with thousands of particles
2. WHEN the heading text is "Build Stunning Angular Experiences" THEN it SHALL be displayed as a single text string with the word "Stunning" visually differentiated
3. WHEN positioning the heading THEN it SHALL use viewport positioning at approximately 25-30% from left edge and 40% from top of viewport
4. WHEN configuring text appearance THEN the following properties SHALL be applied:
   - `fontSize`: 40-50 (large enough for readability)
   - `particleColor`: SCENE_COLORS.neonGreen for "Stunning", SCENE_COLORS.white or softGray for other words
   - `opacity`: 0.4-0.6 (readable but maintaining smoke aesthetic)
   - `maxParticleScale`: 0.2-0.3 (sufficient size for visibility)
   - `particlesPerPixel`: 3-4 (dense enough for readability)
   - `skipInitialGrowth`: true (immediate visibility on load)
5. WHEN the heading renders THEN the text SHALL be multi-line with natural word breaks:
   - Line 1: "Build Stunning"
   - Line 2: "Angular Experiences"
6. WHEN "Stunning" is highlighted THEN it SHALL use neon green color (SCENE_COLORS.neonGreen) while other words use white or soft gray
7. WHEN the particle text animates THEN it SHALL exhibit subtle organic drift consistent with `InstancedParticleTextComponent` behavior
8. WHEN users view the heading from different angles THEN particles SHALL billboard (face camera) for consistent readability

---

### Requirement 4: Convert Description to 3D Particle Text (Below Heading)

**User Story:** As a user viewing the hero section, I want the description paragraph displayed as 3D smoke particle text below the main heading, so that all text content is cohesively integrated into the 3D scene.

#### Acceptance Criteria

1. WHEN the description renders THEN it SHALL use `InstancedParticleTextComponent` OR `SmokeParticleTextComponent` depending on performance and readability testing
2. WHEN displaying description text THEN it SHALL show the current HTML description content: "Discover a powerful Angular library that seamlessly integrates Three.js for stunning 3D graphics and GSAP for smooth scroll animations."
3. WHEN positioning the description THEN it SHALL be placed below the hero heading at approximately:
   - X: 25-30% from left (aligned with heading)
   - Y: 55-60% from top (sufficient spacing below heading)
4. WHEN configuring description appearance THEN the following properties SHALL be applied:
   - `fontSize`: 18-24 (smaller than heading, but readable)
   - `particleColor`: SCENE_COLORS.softGray or white with reduced opacity
   - `opacity`: 0.25-0.35 (more subtle than heading)
   - `maxParticleScale`: 0.12-0.18 (smaller particles for paragraph text)
   - `particlesPerPixel`: 2-3 (less dense than heading for subtlety)
   - `skipInitialGrowth`: true (immediate visibility)
5. WHEN the description renders THEN text SHALL wrap naturally with max width approximately 40-45% of viewport width
6. WHEN comparing heading and description THEN the visual hierarchy SHALL be clear with heading more prominent (larger, brighter, denser)
7. WHEN particle text is too long THEN word breaks SHALL occur naturally OR description text SHALL be shortened to essential messaging

---

### Requirement 5: Maintain HTML Buttons and Scene Elements

**User Story:** As a user viewing the hero section, I want the call-to-action buttons and existing scene elements to remain functional, so that I can navigate to library showcases while enjoying the 3D environment.

#### Acceptance Criteria

1. WHEN the hero section renders THEN HTML buttons (call-to-action elements) SHALL remain as HTML overlays (NOT converted to 3D)
2. WHEN buttons are displayed THEN they SHALL maintain their current styling and positioning at the bottom of the hero section
3. WHEN all scene elements render THEN the following SHALL remain unchanged:
   - Multi-layer star fields (3 layers at radius 60, 45, 35)
   - Flying robots with SpaceFlight3D animation
   - Floating spheres with Float3D animation
   - Nebula volumetric effects (top-right and bottom-left)
   - Bloom post-processing effect
   - Orbit controls configuration
   - Lighting setup (ambient, directional, point lights)
4. WHEN users interact with buttons THEN click events and navigation SHALL function identically to current implementation
5. WHEN 3D text is added THEN it SHALL NOT interfere with button click regions or hover states

---

## Non-Functional Requirements

### Performance Requirements

- **Particle Count**: Total particle count for both heading and description SHALL NOT exceed 15,000 particles to prevent browser performance degradation
- **Frame Rate**: Scene SHALL maintain 60 FPS on desktop devices (≥ 16.67ms per frame)
- **Initial Load**: Particle text SHALL render within 2 seconds of scene initialization
- **Memory Usage**: Addition of particle text components SHALL NOT increase memory footprint by more than 50MB

### Readability and UX Requirements

- **Contrast**: 3D text SHALL have sufficient contrast against star field and nebula backgrounds (minimum 3:1 ratio for accessibility)
- **Multi-Device Readability**: Particle text SHALL be readable on viewport widths ≥ 1024px (tablet landscape and desktop)
- **Animation Subtlety**: Particle drift animation SHALL be subtle enough to maintain readability (drift amount < 0.08 world units)
- **Fallback Consideration**: If particle text performance is inadequate on testing, HTML overlay fallback SHALL be considered as alternative

### Visual Design Requirements

- **Color Palette**: All colors SHALL use SCENE_COLORS constants from `shared/colors.ts`
- **Depth Layering**: Text SHALL be positioned in foreground layer (Z: 0 to -5) while Earth remains in midground (Z: -9)
- **Visual Balance**: Left-side text and right-side Earth SHALL create balanced composition with clear focal points
- **Consistency**: Particle aesthetic SHALL match existing smoke/nebula effects for cohesive scene design

### Technical Constraints

- **Component Usage**: MUST use `InstancedParticleTextComponent` for primary text (better performance for large text)
- **Component Usage**: MAY use `SmokeParticleTextComponent` for description if readability requires denser particles
- **Positioning**: MUST use `ViewportPositionDirective` for responsive positioning of Earth and text elements
- **Text Limitations**: `InstancedParticleTextComponent` requires single-line input; multi-line text requires multiple component instances
- **Particle Limits**: Each component instance has MAX_PARTICLES = 10,000 built-in safety limit
- **Angular Version**: MUST maintain compatibility with Angular 20.3 standalone components and signal-based inputs

---

## Stakeholder Analysis

### Primary Stakeholders

**End Users (Library Evaluators)**
- **Needs**: Visually impressive hero that demonstrates library capabilities; clear messaging about library value
- **Pain Points**: Current HTML overlay feels disconnected from 3D scene; unclear library differentiation
- **Success Metrics**: Increased time on page (> 30 seconds), scroll to showcase sections (> 60%), reduced bounce rate

**Library Maintainers (Development Team)**
- **Needs**: Showcase particle text components as production-ready features; maintain code quality and performance
- **Pain Points**: Need compelling demo that sells the library's capabilities
- **Success Metrics**: Zero performance regressions, maintainable component structure, reusable patterns

### Secondary Stakeholders

**Content Team**
- **Needs**: Ability to update hero messaging without deep 3D knowledge
- **Impact**: Medium - text content changes should be straightforward
- **Requirements**: Text content passed as simple string inputs to components

**SEO/Accessibility Team**
- **Needs**: Ensure 3D text doesn't harm SEO or accessibility
- **Impact**: Low - 3D text is decorative; HTML content should remain in DOM for indexing
- **Requirements**: Maintain semantic HTML structure alongside 3D visuals

---

## Risk Analysis

### Technical Risks

| Risk | Probability | Impact | Score | Mitigation Strategy | Contingency |
|------|-------------|--------|-------|---------------------|-------------|
| Particle text unreadable on backgrounds | High | Critical | 9 | Test multiple opacity/color combinations; use additive blending; ensure adequate contrast | Fallback to HTML text overlay with subtle 3D background elements |
| Performance degradation with 15K particles | Medium | High | 6 | Use InstancedMesh rendering (better than Points); implement particle count warnings; profile with Chrome DevTools | Reduce particlesPerPixel to 2, reduce fontSize, or implement level-of-detail system |
| Multi-line text implementation complexity | Medium | Medium | 4 | Create multiple InstancedParticleTextComponent instances with calculated Y offsets | Use single-line heading OR create wrapper component for multi-line support |
| Viewport positioning breaks on mobile | Low | Medium | 3 | Use ViewportPositioningService responsive features; test tablet/desktop breakpoints | Provide mobile-specific layout with adjusted percentages |
| Particle animation distracts from readability | Medium | Medium | 4 | Reduce driftSpeed and driftAmount; test skipInitialGrowth=true; disable pulse effect if needed | Use static particle text (zero drift) or reduce animation intensity |

### Business Risks

| Risk | Probability | Impact | Score | Mitigation | Contingency |
|------|-------------|--------|-------|------------|-------------|
| Design doesn't resonate with users | Low | High | 5 | Reference screenshot inspiration; gather stakeholder feedback before final implementation | Quick rollback to HTML text if user metrics decline |
| Accessibility concerns raised | Low | Medium | 3 | Maintain semantic HTML for screen readers; ensure ARIA labels present | Add visible HTML text with aria-live regions |
| Browser compatibility issues | Low | High | 5 | Test on Chrome, Firefox, Safari; verify WebGL 2.0 support detection | Implement WebGL feature detection and HTML fallback |

---

## Implementation Considerations

### Text Color Strategy for "Stunning" Highlight

Due to `InstancedParticleTextComponent` accepting single text strings, highlighting "Stunning" in green requires:

**Option A: Multiple Component Instances (Recommended)**
- Instance 1: "Build " (white/gray)
- Instance 2: "Stunning" (neon green)
- Instance 3: " Angular Experiences" (white/gray)
- Position calculation: Calculate text width using canvas measureText, position each instance with appropriate X offset

**Option B: Custom Component Extension**
- Extend `InstancedParticleTextComponent` to support inline color spans
- Requires modification to text sampling and particle generation logic
- Higher complexity, but cleaner template

**Option C: Simplified Single Color**
- Use single color for entire heading (neon green OR white)
- Simplest implementation; acceptable if highlight not critical to design

### Multi-Line Text Implementation

Since components accept single-line text input:

**Recommended Approach:**
- Create two separate `InstancedParticleTextComponent` instances:
  - Line 1: "Build Stunning" at Y: 40%
  - Line 2: "Angular Experiences" at Y: 48%
- Calculate line height spacing: fontSize * 1.5 in viewport units

### Performance Testing Protocol

Before finalizing, measure:
1. Total particle count (heading + description) - target < 15,000
2. Frame time in Chrome DevTools Performance tab - target < 16.67ms
3. Memory usage in Chrome Task Manager - target < 200MB increase
4. Visual readability on 1920x1080, 1440x900, 1280x720 resolutions

---

## Success Metrics

### Quantitative Metrics

- **Performance**: Maintain 60 FPS on desktop (measured via Chrome Performance monitor)
- **Load Time**: Hero scene fully rendered within 3 seconds on fast 3G connection
- **Particle Efficiency**: ≤ 12,000 total particles for both heading and description
- **Code Quality**: Zero TypeScript errors, zero ESLint warnings

### Qualitative Metrics

- **Visual Hierarchy**: Clear distinction between heading (prominent) and description (subtle)
- **Readability**: Text readable at all zoom levels within orbit control limits (distance 8-40 units)
- **Aesthetic Cohesion**: 3D text feels integrated with scene (matches smoke/particle aesthetic)
- **Balance**: Left text and right Earth create harmonious composition

---

## Dependencies

### Component Dependencies

- `@hive-academy/angular-3d`:
  - `InstancedParticleTextComponent` - Primary text rendering
  - `SmokeParticleTextComponent` - Alternative for description if needed
  - `GltfModelComponent` - Earth planet model
  - `ViewportPositionDirective` - Responsive positioning
  - `Scene3dComponent` - Scene container

### Service Dependencies

- `ViewportPositioningService` - Reactive viewport positioning calculations
- `SceneService` - Camera access for billboarding
- `RenderLoopService` - Per-frame animation updates

### Asset Dependencies

- `3d/planet_earth/scene.gltf` - Earth model (existing)
- SCENE_COLORS constants from `shared/colors.ts`

### External Dependencies

- Three.js (existing) - 3D rendering
- WebGL 2.0 browser support

---

## Acceptance Checklist

Before marking task complete, verify:

- [ ] "Angular 3D Library" smoke text removed from scene
- [ ] Earth repositioned to 70% from left using ViewportPositionDirective
- [ ] Hero heading "Build Stunning Angular Experiences" rendered as 3D particle text on left side
- [ ] Description paragraph rendered as 3D particle text below heading
- [ ] "Stunning" word highlighted in neon green (if multi-instance approach used)
- [ ] HTML buttons remain unchanged and functional
- [ ] All existing scene elements (stars, robots, spheres, nebula) unchanged
- [ ] Performance metrics met: 60 FPS, < 15K particles, < 3s load time
- [ ] Readability confirmed on 1920x1080, 1440x900 resolutions
- [ ] Viewport responsiveness tested (window resize maintains layout)
- [ ] Orbit controls functional with new layout
- [ ] No TypeScript errors or ESLint warnings
- [ ] Component cleanup (DestroyRef) implemented correctly
- [ ] Code follows angular-3d coding standards (signals, ChangeDetectionStrategy.OnPush)

---

## Reference Materials

- **Inspiration Screenshot**: `docs/Screenshot 2025-10-30 135915.png` - Shows centered Earth with smoke text "Build Production Grade AI Apps" demonstrating desired particle text aesthetic
- **Current Implementation**: `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts`
- **Particle Components**:
  - `libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts`
  - `libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts`
- **Positioning Guide**: `libs/angular-3d/docs/POSITIONING_GUIDE.md` (referenced in component comments)
