# Task Context - TASK_2025_024

## User Intent

Refactor particle text to Troika-based smoke/glow variants:

1. **Remove** entire particle-text/ folder containing:

   - InstancedParticleTextComponent (smoke cloud text using instanced meshes)
   - GlowParticleTextComponent (neon tube glow particles)
   - SmokeParticleTextComponent (dense smoke particles)

2. **Create** new lightweight Troika-based components in text/ folder:
   - SmokeTroikaTextComponent - Troika SDF text with smoke/atmospheric shader effect
   - Enhance existing GlowTroikaTextComponent if needed

**Goal**: Same visual effect as inspiration screenshot but lightweight, responsive, GPU-efficient like Troika.

## Conversation Summary

- User showed inspiration screenshot (Enterprise AI SaaS landing with smokey text effects)
- Current implementation uses particle-based approach (1000s of CPU-animated particles)
- User wants Troika (SDF) as base for crispness + shader/material effects for smoke/glow
- Text3DComponent already removed (unused extruded 3D text)
- TroikaTextComponent, ResponsiveTroikaTextComponent, GlowTroikaTextComponent already exist

## Technical Context

- Branch: feature/TASK_2025_002-canvas-render-loop (current)
- Created: 2025-12-23
- Type: REFACTORING
- Complexity: Medium

## Key Insight

**Old approach**: Particles FORM the text (CPU-intensive, 1000s of points animated per frame)
**New approach**: Troika renders crisp SDF text + shader/material creates smoke/glow effect (GPU-efficient)

## Files to Remove

- libs/angular-3d/src/lib/primitives/particle-text/instanced-particle-text.component.ts
- libs/angular-3d/src/lib/primitives/particle-text/glow-particle-text.component.ts
- libs/angular-3d/src/lib/primitives/particle-text/smoke-particle-text.component.ts
- libs/angular-3d/src/lib/services/text-sampling.service.ts (if only used by particle-text)

## Files to Create/Modify

- Create SmokeTroikaTextComponent in text/ folder
- Potentially enhance GlowTroikaTextComponent
- Update primitives/index.ts exports
- Update demo app imports if any

## Execution Strategy

REFACTORING: software-architect -> USER VALIDATES -> team-leader (3 modes) -> USER CHOOSES QA -> modernization-detector
