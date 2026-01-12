# Requirements Document - TASK_2025_037

## Introduction

The Bubble Dream Hero Scene is currently non-functional, with the `BubbleTextComponent` rendering bubbles as dense, unreadable blob-like clusters instead of forming legible text. This task encompasses fixing the core bubble text rendering issue, enhancing the scene with decorative bubbles and mouse interactivity, and creating a portfolio-style skills section overlay that integrates with the bubble aesthetic.

**Business Value**: This scene showcases the `@hive-academy/angular-3d` library's capabilities for creating immersive, interactive 3D experiences. A polished, functional bubble scene demonstrates the library's text rendering, particle effects, and mouse interaction features to potential adopters.

**Technical Context**: The current implementation uses `BubbleTextComponent` which samples text positions via `TextSamplingService` and renders bubbles as instanced icosahedron spheres. The issue appears to be in bubble distribution, scaling, and positioning parameters that cause visual clustering rather than readable text formation.

---

## Requirements

### Requirement 1: Fix Bubble Text Rendering

**User Story:** As a viewer of the demo scene, I want the bubble text "BUBBLE DREAM" to be clearly readable, so that the visual effect is impressive rather than broken.

#### Acceptance Criteria

1. WHEN the scene loads THEN the text "BUBBLE DREAM" SHALL be clearly legible from the default camera position (z=12)
2. WHEN bubbles form the text THEN each bubble SHALL have appropriate spacing to prevent dense blob formation
3. WHEN viewing the text THEN individual bubbles SHALL be distinguishable while still creating cohesive letter shapes
4. WHEN bubbles animate (grow/burst cycle) THEN the text shape SHALL remain readable throughout the animation cycle
5. WHEN the scene renders THEN bubble sizes SHALL be appropriately scaled relative to font size and viewport

#### Technical Analysis

**Current Issue Investigation:**

- `bubblesPerPixel: 2` - May be too dense, causing overlapping bubbles
- `maxBubbleScale: 0.8` - May be too large relative to font scale
- `fontScaleFactor: 0.07` - May need adjustment for proper world-space scaling
- `fontSize: 70` - Combined with fontScaleFactor creates bubbles that overlap

**Recommended Investigation Points:**

1. Reduce `bubblesPerPixel` to 1 or 0.5 for sparser distribution
2. Reduce `maxBubbleScale` to 0.3-0.5 for smaller individual bubbles
3. Increase sampling step in `TextSamplingService` to reduce bubble count
4. Adjust position randomization range (`offsetRange`) in `createBubble()`

---

### Requirement 2: Add Decorative Floating Bubbles

**User Story:** As a viewer of the demo scene, I want decorative bubbles floating on the left and right sides of the scene, so that the scene feels more immersive and complete.

#### Acceptance Criteria

1. WHEN the scene loads THEN decorative bubbles SHALL appear in designated areas on the left and right sides of the viewport
2. WHEN decorative bubbles animate THEN they SHALL float upward with a gentle, organic motion
3. WHEN decorative bubbles reach the top of the scene THEN they SHALL respawn at the bottom or reset position
4. WHEN the scene renders THEN decorative bubbles SHALL NOT overlap with the main bubble text area
5. WHEN decorative bubbles render THEN they SHALL use the same bubble material/shader as the text bubbles for visual consistency

#### Technical Constraints

- Decorative bubbles should be implemented as a separate instance group or component
- Use the same TSL bubble material from `BubbleTextComponent` (fresnel, iridescence effects)
- Position spawning zones at x < -4 (left) and x > 4 (right) to avoid text area
- Bubble count should be configurable (suggested default: 30-50 per side)

---

### Requirement 3: Mouse Interaction - Bubble Hover Effect

**User Story:** As a user interacting with the scene, I want bubbles to grow larger when I hover near them, so that the scene feels responsive and engaging.

#### Acceptance Criteria

1. WHEN the mouse moves over the scene THEN the mouse position SHALL be tracked in 3D world coordinates
2. WHEN the mouse is within proximity (configurable radius) of a bubble THEN that bubble SHALL scale up smoothly
3. WHEN the mouse moves away from a bubble THEN that bubble SHALL smoothly return to its normal size
4. WHEN multiple bubbles are within mouse proximity THEN all affected bubbles SHALL respond with distance-based scaling
5. WHEN scaling occurs THEN it SHALL use smooth interpolation (easing) for natural motion
6. WHEN touch events occur on mobile THEN the same interaction behavior SHALL apply

#### Technical Reference

The `MetaballComponent` implements robust mouse tracking with:

- Normalized screen-to-world coordinate conversion
- Smooth interpolation (`mouseSmoothness`)
- Proximity-based scaling with `smoothstep`

The `MouseTracking3dDirective` provides:

- Document-level mouse tracking
- Intersection observer for visibility-based optimization
- Damped position/rotation updates

---

### Requirement 4: Skills Section Overlay

**User Story:** As a portfolio viewer, I want to see a skills/portfolio section overlaying the bubble scene, so that the scene serves as an impressive background for content presentation.

#### Acceptance Criteria

1. WHEN the scene loads THEN a skills section overlay SHALL appear on top of the 3D scene
2. WHEN viewing the overlay THEN skill items SHALL be clearly readable against the bubble background
3. WHEN the overlay renders THEN it SHALL use proper z-indexing to appear above the 3D canvas
4. WHEN skill items are displayed THEN they SHALL integrate aesthetically with the bubble theme (e.g., bubble-like card styling)
5. WHEN the overlay content scrolls (if applicable) THEN the 3D scene SHALL remain fixed as background
6. WHEN viewing on different viewport sizes THEN the overlay layout SHALL be responsive

#### Technical Reference

The `MetaballHeroSceneComponent` demonstrates the pattern:

- Layer 1: 3D scene with `position: absolute; inset: 0; z-index: 0;`
- Layer 2: HTML overlay with `position: absolute; inset: 0; z-index: 10; pointer-events: none;`
- Grid-based layout for content positioning
- `pointer-events: auto` on interactive elements

#### Design Considerations

- Header with scene title
- Center content with headline
- Skills grid or list with bubble-themed styling
- Semi-transparent overlays for readability against 3D background

---

## Non-Functional Requirements

### Performance Requirements

- **Frame Rate**: Scene SHALL maintain 60 FPS on desktop and 30+ FPS on mobile devices
- **Bubble Count**: Total bubble count (text + decorative) SHALL NOT exceed 3000 instances to maintain performance
- **Memory Usage**: Scene SHALL NOT cause memory leaks; all Three.js resources SHALL be disposed on component destroy
- **Render Loop**: Animation updates SHALL use `RenderLoopService.registerUpdateCallback()` for consistent frame timing

### Visual Quality Requirements

- **Anti-aliasing**: Scene SHALL use WebGPU anti-aliasing for smooth bubble edges
- **Material Consistency**: All bubbles SHALL use TSL-based material with fresnel and iridescence effects
- **Bloom Effect**: Soft bloom SHALL enhance the dreamy atmosphere without washing out colors
- **Color Harmony**: Bubble colors SHALL complement the pink/purple nebula background

### Accessibility Requirements

- **Color Contrast**: Overlay text SHALL meet WCAG 2.1 AA contrast requirements against the background
- **Motion Sensitivity**: Bubble animations SHALL respect `prefers-reduced-motion` media query where feasible
- **Screen Reader**: Overlay content SHALL include appropriate ARIA labels

### Browser/Device Compatibility

- **WebGPU**: Scene SHALL function correctly with the Three.js WebGPU renderer
- **Mobile**: Touch interaction SHALL work on iOS Safari and Android Chrome
- **Viewport**: Scene SHALL be responsive from 320px to 4K screen widths

---

## Technical Constraints

### Technology Stack

- Angular 20.3 with standalone components and signals
- Three.js 0.182 with WebGPU renderer
- TSL (Three Shading Language) for materials
- `@hive-academy/angular-3d` library components and services

### Existing Dependencies

- `BubbleTextComponent` - Primary component to fix
- `TextSamplingService` - Canvas-based text position sampling
- `RenderLoopService` - Animation frame management
- `SceneService` - Scene/camera/renderer access
- `NG_3D_PARENT` - Parent-child hierarchy token

### Coding Standards

- Use `ChangeDetectionStrategy.OnPush` for all components
- Use signal-based inputs: `input<T>()`, `input.required<T>()`
- Use `DestroyRef` for cleanup instead of `ngOnDestroy`
- Use `afterNextRender()` for browser-only initialization
- Dispose all Three.js resources (geometry, material) on destroy

---

## Out of Scope

1. **New Text Fonts**: The current Arial font in `TextSamplingService` is sufficient; custom font support is not required
2. **Advanced Physics**: Bubble collision physics or fluid simulation are not required
3. **Save/Export**: Functionality to save or export the scene is not required
4. **CMS Integration**: Dynamic content management for the skills section is not required
5. **Animation Timeline**: GSAP ScrollTrigger integration is not required for this scene
6. **Multi-language**: Internationalization of the skills overlay text is not required

---

## Dependencies

### Internal Dependencies

| Component                   | Dependency Type | Notes                  |
| --------------------------- | --------------- | ---------------------- |
| `BubbleTextComponent`       | Modification    | Core fix target        |
| `Scene3dComponent`          | Usage           | Container for 3D scene |
| `NebulaVolumetricComponent` | Usage           | Background atmosphere  |
| `EffectComposerComponent`   | Usage           | Bloom post-processing  |

### External Dependencies

| Package | Version | Notes                          |
| ------- | ------- | ------------------------------ |
| `three` | 0.182.x | WebGPU renderer, TSL           |
| Angular | 20.3.x  | Signals, standalone components |

---

## Success Metrics

| Metric                 | Target        | Measurement Method                           |
| ---------------------- | ------------- | -------------------------------------------- |
| Text Legibility        | 100% readable | Visual inspection at default camera position |
| Frame Rate (Desktop)   | 60 FPS        | Chrome DevTools Performance panel            |
| Frame Rate (Mobile)    | 30+ FPS       | Remote debugging on real device              |
| Mouse Response Latency | < 16ms        | Perceptual smoothness testing                |
| Bubble Instance Count  | < 3000        | Console logging in development               |

---

## Risk Assessment

### Technical Risks

| Risk                                                             | Probability | Impact | Mitigation                                                                               |
| ---------------------------------------------------------------- | ----------- | ------ | ---------------------------------------------------------------------------------------- |
| Bubble scaling parameters causing new visual issues              | Medium      | Medium | Implement configurable inputs; test multiple parameter combinations                      |
| Mouse tracking causing performance degradation with many bubbles | Low         | High   | Use distance culling; only check proximity for visible bubbles                           |
| TSL material compatibility issues                                | Low         | Medium | Use established patterns from `MetaballComponent`                                        |
| Mobile touch interaction not working                             | Low         | Medium | Test on real devices early; use existing `MetaballComponent` touch handling as reference |

### Schedule Risks

| Risk                                           | Probability | Impact | Mitigation                                                            |
| ---------------------------------------------- | ----------- | ------ | --------------------------------------------------------------------- |
| Bubble text fix more complex than anticipated  | Medium      | Medium | Time-box investigation; consider alternative approaches if blocked    |
| Skills overlay design decisions causing delays | Low         | Low    | Use existing `MetaballHeroSceneComponent` overlay pattern as template |

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder   | Interest              | Success Criteria                   |
| ------------- | --------------------- | ---------------------------------- |
| Library Users | Showcase capabilities | Impressive, functional demo scene  |
| Developers    | Code quality          | Clean, reusable component patterns |

### Secondary Stakeholders

| Stakeholder        | Interest      | Success Criteria                    |
| ------------------ | ------------- | ----------------------------------- |
| Portfolio Visitors | Visual impact | Engaging, professional presentation |
| Mobile Users       | Accessibility | Smooth experience on touch devices  |

---

## Implementation Notes

### Suggested Approach

1. **Phase 1: Fix Bubble Text** - Focus on `BubbleTextComponent` parameters:

   - Reduce `bubblesPerPixel` to 0.5 or 1
   - Reduce `maxBubbleScale` to 0.3
   - Test with different `fontSize` and `fontScaleFactor` combinations
   - Consider increasing sampling step in `TextSamplingService`

2. **Phase 2: Decorative Bubbles** - Create separate bubble spawning zones:

   - New component or extend scene with additional instanced mesh
   - Floating animation with sine wave y-movement
   - Reset position when leaving viewport bounds

3. **Phase 3: Mouse Interaction** - Add to bubble animation loop:

   - Track mouse in world coordinates
   - Calculate distance from each bubble to mouse
   - Apply scale multiplier based on proximity
   - Use exponential falloff for natural feel

4. **Phase 4: Skills Overlay** - Follow `MetaballHeroSceneComponent` pattern:
   - Layered HTML structure
   - Grid layout for skills
   - Bubble-themed card styling
   - Ensure pointer events work correctly

---

## Revision History

| Version | Date       | Author                | Changes                       |
| ------- | ---------- | --------------------- | ----------------------------- |
| 1.0     | 2026-01-02 | Project Manager Agent | Initial requirements document |
