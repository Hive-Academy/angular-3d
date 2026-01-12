# Task Context: Blueyard.com Replication Analysis

**Task ID**: TASK_2025_033
**Created**: 2026-01-01
**Updated**: 2026-01-02
**Type**: RESEARCH → FEATURE
**Status**: 🔄 ARCHITECTURE PHASE

---

## Expanded Scope (2026-01-02)

**Original**: Blueyard.com Replication Analysis (Research only)
**Expanded**: Production-quality Glass Sphere Hero Component

### New Requirements:

1. **Glossy glass sphere** with environment map reflections (like volumetric-caustics-scene)
2. **Sparkle particle corona** - shell distribution, NOT volume fill
3. **Multi-color sparkle variation** - white, peach, gold
4. **Twinkling animation** on particles
5. **Subtle internal glow** - NOT emissive sun effect
6. **Light cream/peach gradient background** - CSS layer behind transparent canvas
7. **Scroll-driven sphere movement** - rises from bottom to top-right
8. **Reusable shared component** - replace current hero-3d-teaser.component.ts

### Technical Reference:

- **Working Example**: `volumetric-caustics-scene.component.ts` (has proper env map + MeshStandardNodeMaterial)
- **Broken Implementation**: `blueyard-scene.component.ts` (wrong materials, wrong particles, too much bloom)

---

## User Request

"lets invoke our browser agent to evaluate the threejs scene and the scolling animations applied on this website https://blueyard.com/ and make a plan on how we can implement the same concepts and scenes with our angular-3d and angular-gsap libraries"

## Intent

The user wants to analyze an external website (blueyard.com) to understand its 3D scenes and scrolling animations. The goal is to reverse-engineer these concepts and create a plan to implement them using the internal `angular-3d` and `angular-gsap` libraries.

## Key Deliverables

1. ✅ Browser-based evaluation of blueyard.com (using Chrome DevTools MCP)
2. ✅ Technical analysis of 3D assets, shaders, and postprocessing
3. ✅ Scroll animation system documentation
4. ✅ Implementation plan for angular-3d and angular-gsap

## Research Findings Summary

### Technology Stack Discovered

- **Framework**: Nuxt.js 3 (Vue SSR)
- **3D Engine**: Three.js (bundled)
- **Scroll Library**: Lenis v1.2.3 (hijacked scroll)
- **Asset Format**: GLB (Draco) + KTX2 (Basis)

### 6 Visual Sections Analyzed

1. **Landing** - Warm peach gradient, particle corona sphere
2. **Computation** - Purple gradient, plasma swirl sphere
3. **Engineering** - Blue gradient, metallic tech sphere
4. **Biology** - Teal gradient, organic honeycomb sphere
5. **Crypto** - Pink gradient, network constellation sphere
6. **Team** - Lavender gradient, disco ball sphere

### Post-Processing Pipeline

- Chromatic Aberration (RGB split)
- Vignette (edge darkening)
- Film Grain (noise overlay)

### Assets Identified

- 8 GLB 3D models (Draco compressed)
- 6 KTX2 textures (GPU compressed)
- Environment maps for reflections
- Normal maps for surface detail

## Deliverable Files

- `research-report.md` - Comprehensive technical analysis
