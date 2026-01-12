# Task Context - TASK_2025_035

## User Intent

Redesign metaball-hero-scene.component.ts to match reference design (Nexus-style hero):

1. Remove star field and 3D text components
2. Add HTML/CSS text overlay with large centered headline "Where matter becomes thought and thought becomes form"
3. Add technical subtext below headline
4. Add left sidebar with contact info and navigation links (Fluid Dynamics, Organic Shapes, Interactive Forms, Motion Studies, Contact)
5. Add status indicator in bottom-right
6. Keep preset selector but style as "Metaball Controls" dropdown in top-right
7. Clean dark background, purple/violet metaball color scheme

## Reference Design Elements

- Large purple/violet metaballs filling viewport (organic forms)
- Clean dark background (#1a1a1a-ish), NO star field
- HTML/CSS text overlay (NOT 3D text)
- Left sidebar: Contact info + navigation links
- Right corner: Status indicator + Metaball Controls dropdown
- Central headline with technical subtext

## Prior Context

- TASK_2025_034 just added fullscreen mode to MetaballComponent
- Metaballs now properly fill the viewport
- Camera at z=10, fullscreen=true by default

## Technical Context

- Branch: feature/TASK_2025_028-webgpu-migration (current)
- Created: 2026-01-02
- Type: FEATURE (UI redesign)
- Complexity: Medium

## Execution Strategy

FEATURE with UI/UX work: PM → Architect → Team Leader → Developer → QA
