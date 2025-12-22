# Task Context - TASK_2025_021

## User Intent

Redesign home page hero section to use full 3D components for all text content, creating an immersive 3D experience.

**Current State:**
- HTML text overlay on left: "Build Stunning Angular Experiences" + description
- Earth planet centered with "Angular 3D Library" smoke text above
- HTML buttons at bottom

**Target Design (inspired by reference screenshot docs/Screenshot 2025-10-30 135915.png):**
1. Remove "Angular 3D Library" smoke text entirely
2. Move Earth planet to the RIGHT side of screen (approximately 70% from left)
3. Convert hero text content to 3D smoke particle text on the LEFT side:
   - Main heading: "Build Stunning Angular Experiences" (multi-line, "Stunning" highlighted green)
   - Description paragraph as smaller smoke text below
4. Keep HTML buttons as-is (or explore SVG component if feasible)

## Conversation Summary

User wants to convert the current hybrid HTML/3D hero section into a fully immersive 3D experience where:
- All text content uses smoke particle text components
- Earth model moves to the right creating visual balance
- The layout follows left-text / right-visual pattern
- Buttons remain as HTML for usability (may explore 3D SVG)

Reference image shows centered Earth with "Build Production Grade AI Apps" as smoke text.

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop (current working branch)
- Created: 2025-12-22
- Type: FEATURE (UI Enhancement)
- Complexity: Medium

## Key Components to Use

- `InstancedParticleTextComponent` or `SmokeParticleTextComponent` for 3D text
- `GltfModelComponent` for Earth (reposition to right)
- `ViewportPositionDirective` for viewport-relative positioning
- Potentially `SvgIconComponent` for 3D buttons

## Files to Modify

Primary:
- `apps/angular-3d-demo/src/app/pages/home/sections/hero-3d-teaser.component.ts`

## Execution Strategy

FEATURE strategy - Medium complexity UI redesign using existing components
