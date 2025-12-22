# Task Context - TASK_2025_023

## User Intent

Implement production-quality 3D text rendering using troika-three-text library, replacing the current basic particle text implementation.

**Current Problems:**
1. HTML overlay in home page NOT removed (duplicates 3D text)
2. Particle text uses static positions (not responsive)
3. Current implementation is basic compared to industry standards (award-winning sites)

**Target Outcome:**
1. Create new `TroikaTextComponent` in angular-3d library
2. Remove HTML overlay from home page hero section
3. Replace particle text with responsive troika-three-text
4. Integrate with existing ViewportPositionDirective for positioning
5. Support bloom/glow effects

## Research Summary

Comprehensive research conducted (see `docs/research/troika-three-text-deep-dive.md`):
- troika-three-text is the industry standard (812k weekly npm downloads)
- Used by award-winning Three.js websites
- Provides SDF rendering (sharp at any scale), web worker optimization
- Supports curved text, outlines, full material integration
- Perfect fit for Angular signal-based architecture

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop (continuing from TASK_2025_021)
- Created: 2025-12-22
- Type: FEATURE (Library Enhancement + Demo Update)
- Complexity: Medium-High
- Predecessor: TASK_2025_021 (Hero Section 3D Text Redesign - pivot from particle text)

## Key Components to Create

1. **TroikaTextComponent** - Basic troika wrapper with signal inputs
2. **ResponsiveTextComponent** - Viewport-aware text sizing (optional Phase 2)
3. **GlowTextComponent** - Bloom-compatible text (optional Phase 2)

## Files to Create/Modify

**Create:**
- `libs/angular-3d/src/lib/primitives/text/troika-text.component.ts`
- `libs/angular-3d/src/lib/primitives/text/index.ts`

**Modify:**
- `libs/angular-3d/src/lib/primitives/index.ts` - Export new components
- `libs/angular-3d/package.json` - Add troika-three-text dependency
- `apps/angular-3d-demo/src/app/pages/home/home.component.ts` - Remove HTML overlay
- `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts` - Replace particle text with troika

## Execution Strategy

FEATURE strategy with research already complete - proceed directly to architecture and implementation.

## Dependencies

- troika-three-text ^0.49.x (npm package)
- Existing: SceneService, RenderLoopService, NG_3D_PARENT token
