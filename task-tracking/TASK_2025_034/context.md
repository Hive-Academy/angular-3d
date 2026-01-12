# Task Context - TASK_2025_034

## User Intent

Refactor the MetaballComponent to be flexible for hero scenes. Currently the metaball component in libs/angular-3d/src/lib/primitives/metaball.component.ts renders as a small clipped box instead of filling the viewport when used in a 3D scene (as seen in metaball-hero-scene.component.ts). The component creates a 2x2 PlaneGeometry meant for NDC clip space but its treated as a regular 3D object with perspective projection.

**Goals**:

1. Allow full-viewport rendering mode for hero scenes
2. Keep flexibility for positioned 3D use
3. Fix the clipping/size issue so metaballs dominate the scene properly

## Problem Analysis

The MetaballComponent mixes two paradigms:

- **Full-screen ray marching shader** (expects to fill viewport via clip-space coordinates)
- **Regular 3D scene object** (subject to perspective camera projection)

When placed in a Scene3dComponent with camera at [0, 0, 1] and FOV 60, the 2x2 plane appears small because:

1. The plane is positioned in world space, not clip space
2. Perspective projection shrinks distant objects
3. The ray marching UV coordinates do not match the visible geometry

## Technical Context

- Branch: feature/TASK_2025_028-webgpu-migration (current)
- Created: 2026-01-02
- Type: REFACTORING
- Complexity: Medium

## Key Files

- libs/angular-3d/src/lib/primitives/metaball.component.ts - Main component
- apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/metaball-hero-scene.component.ts - Usage

## Execution Strategy

REFACTORING: software-architect → USER VALIDATES → team-leader (3 modes) → USER CHOOSES QA → modernization-detector
