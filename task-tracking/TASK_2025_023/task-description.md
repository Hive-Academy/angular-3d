# Task Description - TASK_2025_023

## Task ID
TASK_2025_023

## Title
Troika-Three-Text Implementation - Production-Ready 3D Text Components

## Status
PENDING

## Priority
HIGH

## Type
FEATURE

## Overview
Implement production-ready 3D text rendering using troika-three-text library in the angular-3d library. This replaces basic particle text implementations with high-quality SDF (Signed Distance Field) text that supports dynamic content, multi-language support, and integrates seamlessly with existing Three.js post-processing.

## Background
Current particle text implementations (InstancedParticleTextComponent, SmokeParticleTextComponent) provide artistic effects but lack the quality and flexibility needed for readable, production-grade text. Troika-three-text offers:
- Sharp, scalable text at any zoom level (SDF rendering)
- Full Unicode support (all languages, emoji)
- Dynamic font loading and text updates
- Integration with Three.js materials and post-processing
- Web worker-based font parsing (non-blocking)

Research document: `docs/research/troika-three-text-deep-dive.md`

## Requirements

### Functional Requirements

#### FR1: Core Text Component
- Create `TroikaTextComponent` as primary text rendering component
- Support all troika-three-text core properties:
  - Text content and font configuration (text, font, fontSize, fontStyle, fontWeight)
  - Layout properties (maxWidth, lineHeight, letterSpacing, textAlign, anchorX/Y)
  - Visual styling (color, fillOpacity, outlineWidth/Color/Opacity/Blur)
  - Advanced rendering (sdfGlyphSize, glyphGeometryDetail, gpuAccelerateSDF)
- Signal-based reactive inputs following angular-3d patterns
- Proper lifecycle management (async font loading, resource cleanup)
- Integration with NG_3D_PARENT token for scene hierarchy
- Support for ng-content to allow directive composition (float3d, rotate3d, etc.)

#### FR2: Responsive Text Support
- Text size automatically adapts to viewport/camera changes
- Two responsive modes:
  - **Viewport mode**: Text scales based on camera FOV and distance (like CSS vw units)
  - **Distance mode**: Text scales based on camera distance
- Configurable min/max font size constraints
- Debounced sync() calls to prevent excessive re-layout

#### FR3: Bloom/Glow Integration
- Text works seamlessly with existing bloom post-processing
- Support for emissive materials (toneMapped: false for values > 1.0)
- Layer-based selective bloom support
- Configurable glow intensity and color

#### FR4: Demo Integration
- Replace HTML overlay text in home.component.ts hero section
- Update existing particle text usage with troika text alternatives
- Create showcase examples demonstrating:
  - Basic text rendering with various fonts
  - Responsive text scaling
  - Glow/bloom effects
  - Multi-line text with layout options
  - Outline/stroke effects

### Non-Functional Requirements

#### NFR1: Performance
- Target: 60 FPS with 50 text instances
- Font load time: <500ms for standard fonts
- Text sync time: <50ms per sync() call
- Particle count limit: Warn and truncate if >10,000 particles generated

#### NFR2: Code Quality
- Follow angular-3d coding standards:
  - ChangeDetectionStrategy.OnPush
  - Signal-based inputs using `input()` and `input.required()`
  - DestroyRef for cleanup
  - effect() for reactive logic
  - afterNextRender() for browser-only initialization
- Comprehensive JSDoc documentation
- Type safety (strict TypeScript, no explicit `any`)

#### NFR3: Developer Experience
- Clear error messages for common issues:
  - Font loading failures
  - CSP restrictions
  - Invalid property values
- Loading state signals (isLoading, loadError)
- Optional callbacks for load completion

#### NFR4: Browser Compatibility
- CSP (Content Security Policy) compatibility:
  - Detect CSP restrictions
  - Fallback to main-thread mode when web workers blocked
  - Warn developers about performance implications
- Support for modern browsers (same as Three.js compatibility)

#### NFR5: Maintainability
- Pin troika-three-text to specific version (0.49.x)
- Unit tests for component lifecycle
- Integration tests with existing directives (float3d, rotate3d)
- Example components in demo app

### Acceptance Criteria

#### AC1: Component Implementation
- [ ] TroikaTextComponent created with full API surface
- [ ] All signal inputs properly reactive
- [ ] Font loading is async with loading states
- [ ] Resources properly disposed on destroy
- [ ] Integrates with NG_3D_PARENT token
- [ ] Supports ng-content for directive composition

#### AC2: Responsive Text
- [ ] Viewport-responsive mode implemented
- [ ] Distance-responsive mode implemented
- [ ] Min/max font size constraints work
- [ ] Sync debouncing prevents excessive updates

#### AC3: Bloom Integration
- [ ] Text renders correctly with bloom post-processing
- [ ] Emissive materials supported (toneMapped: false)
- [ ] Glow intensity configurable
- [ ] No visual artifacts with bloom

#### AC4: Demo Integration
- [ ] Home page hero text replaced with troika text
- [ ] Particle text examples updated where appropriate
- [ ] Showcase examples created demonstrating features
- [ ] Performance acceptable (60 FPS target)

#### AC5: Documentation
- [ ] Comprehensive JSDoc on all components
- [ ] README with usage examples
- [ ] Migration guide from particle text
- [ ] Performance best practices documented

#### AC6: Testing
- [ ] Unit tests for component lifecycle
- [ ] Integration tests with directives
- [ ] Visual regression tests (optional)
- [ ] Performance benchmarks recorded

## Out of Scope
- True 3D text extrusion (use TextGeometry for that use case)
- Pre-baked MSDF text atlases (future enhancement)
- Advanced text editing features (caret positioning, selection)
- Vertical writing modes
- Complex text shaping (advanced Arabic, complex ligatures)
- Text animation effects (separate feature - use GSAP directives)

## Technical Constraints

### Dependencies
- troika-three-text: ^0.49.1 (latest stable)
- three: ^0.182.0 (existing)
- @angular/core: ^20.3.0 (existing)

### Compatibility
- Must work with existing ViewportPositionDirective
- Must work with existing bloom post-processing pipeline
- Must work with existing directive ecosystem (float3d, rotate3d, etc.)
- No breaking changes to existing particle text components (keep for backwards compatibility)

### Performance
- Initial font load: <500ms
- Per-frame update: <2ms per text instance
- Memory: <10MB per 100 text instances
- Text sync: <50ms

### Browser Support
- Modern browsers with WebGL 2.0 support
- CSP compatibility (fallback mode)
- No IE11 support required

## Dependencies
- Requires troika-three-text npm package installation
- Depends on existing angular-3d infrastructure:
  - SceneService (camera access for billboarding)
  - RenderLoopService (per-frame updates)
  - NG_3D_PARENT token (scene hierarchy)
  - OBJECT_ID token (unique identification)

## Risks

### R1: Performance with Many Instances
**Probability**: 40% | **Impact**: MEDIUM
**Scenario**: User creates 500+ text objects, FPS drops below 30
**Mitigation**:
- Document recommended instance limits
- Provide object pooling utility
- Implement LOD system (reduce quality at distance)
- Warn when particle count exceeds 10,000

### R2: CSP Restrictions
**Probability**: 15% | **Impact**: HIGH
**Scenario**: User's app has strict CSP, web worker initialization fails
**Mitigation**:
- Detect CSP restrictions automatically
- Fallback to main-thread mode
- Warn developer about performance implications
- Document CSP configuration requirements

### R3: Font Loading Delays
**Probability**: 60% | **Impact**: LOW
**Scenario**: Custom font loads slowly, text appears with delay
**Mitigation**:
- Provide preloadFont() utility
- Use system fonts as fallback
- Emit loading state signals
- Lazy load fonts using IntersectionObserver

### R4: Unicode/Emoji Rendering
**Probability**: 25% | **Impact**: MEDIUM
**Scenario**: Complex emoji or non-Latin scripts render poorly
**Mitigation**:
- Document recommended fonts for different scripts
- Troika auto-loads fallback fonts
- Increase sdfGlyphSize for complex glyphs
- Test with Arabic, Chinese, Japanese, Emoji

## Success Metrics
1. **Performance**: 60 FPS with 50 text instances
2. **Load Time**: <500ms initial font load
3. **Sync Time**: <50ms per text.sync() call
4. **Adoption**: Used in at least 3 demo scenes
5. **Quality**: No pixelation at 2x zoom
6. **Developer Experience**: <5 lines of code for basic text

## Timeline Estimate
- **Phase 1 (Core)**: 8-16 hours
- **Phase 2 (Advanced)**: 8-16 hours
- **Phase 3 (Demo Integration)**: 4-8 hours
- **Phase 4 (Polish)**: 4-8 hours
- **Total**: 24-48 hours

## Related Documents
- Research: `docs/research/troika-three-text-deep-dive.md`
- Implementation Plan: `task-tracking/TASK_2025_023/implementation-plan.md`
- Context: `task-tracking/TASK_2025_023/context.md`

## Approvals
- [ ] Product Manager Review
- [ ] Technical Architect Review
- [ ] Team Lead Review

## Notes
- Keep existing particle text components for artistic effects
- This is a complementary feature, not a replacement for all text use cases
- Focus on readability and production-grade quality
- Performance is critical - monitor and optimize continuously
