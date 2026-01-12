# TASK_2026_009: 3D Scene & Footer Visual Consistency

## User Request

Fix visual inconsistencies where 3D scenes use colors that clash with the established Tailwind design system. Additionally, enhance the footer with the Hive Academy logo.

## Screenshot Analysis (localhost:4200 - 2026-01-08)

### Identified Issues

#### 1. Hero Section 3D Scene (glass-sphere-hero-section.component.ts)

- **Orange Fire Sphere**: Default orange fire colors clash with green/cyan theme
- **Orange Caustics Texture**: Uses `#ff6600` (bright orange) and `#1a0a00` (dark brown)
- **HoneyGold Nebula**: Uses `SCENE_COLORS.honeyGold` (`#ffb03b`) - orange/gold tone
- **Impact**: Creates warm orange glow that conflicts with the cool cyan/green palette

#### 2. Claude Skills Section (claude-skills-showcase-section.component.ts)

- **Purple Point Light**: `#a855f7` - random purple
- **Pink Point Light**: `#f472b6` - random pink
- **Floating Spheres**: `#f472b6` (pink) and `#d946ef` (magenta)
- **Spotlights**: Match sphere colors
- **Impact**: Creates purple/pink aesthetic disconnected from main theme

#### 3. Footer (footer.component.ts)

- **Missing Logo**: Only text "Hive Academy", no visual branding
- **Basic Design**: Simple 4-column text layout with minimal visual interest

### Established Design System (tailwind.config.js)

**Primary Accent Colors:**

- `neon-green`: #A1FF4F (main highlight, CTAs, badges)
- `neon-blue`: #4FFFDF (secondary highlight, gradients)
- `primary-500`: #6366F1 (tertiary, purple-indigo)

**Neon Accent Palette:**

- `neon-purple`: #D946EF
- `neon-pink`: #FF6BD4

**Background:**

- `background-dark`: #0A0E11

### Current Page Color Flow

The page successfully uses:

- Neon-green for "Angular 3D" badge, "Today" text, feature pills
- Gradient from neon-green → primary-500 → neon-blue for "3D Experiences" title
- Dark navy backgrounds with teal/cyan accents

### Required Harmonization

**Hero Section Should Use:**

- Fire/sun: Shift from orange to neon-green/cyan energy (or warm but subtle)
- Caustics: Use design system colors (neon-blue, neon-green tints)
- Nebula: Use neon-purple/neon-blue instead of honeyGold/emerald

**Skills Section Should Use:**

- Floating spheres: Use neon-green and neon-blue (or primary-500)
- Lights: Match the sphere colors
- Maintain existing nebula colors (already using neonGreen/cyan)

**Footer Should Include:**

- Hive Academy logo SVG
- More visual interest while maintaining clean design

## Technical Context

### Files to Modify

1. `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts`
2. `apps/angular-3d-demo/src/app/pages/home/sections/claude-skills-showcase-section.component.ts`
3. `apps/angular-3d-demo/src/app/shared/footer.component.ts`

### Color Constants Location

- `apps/angular-3d-demo/src/app/shared/colors.ts` - SCENE_COLORS

### Components Involved

- `a3d-fire-sphere` - Has color props for fire effect
- `a3d-nebula-volumetric` - primaryColor, secondaryColor props
- `a3d-floating-sphere` - color prop
- `a3d-point-light` / `a3d-spot-light` - color prop
- `tslCausticsTexture()` - color and background params

## Workflow

1. UI/UX Designer: Define exact color mappings for each 3D element
2. Frontend Developer: Implement the color changes and footer enhancement
