# Task Context - TASK_2026_004

**Task ID**: TASK_2026_004
**Created**: 2026-01-06
**Type**: FEATURE
**Complexity**: Medium

---

## User Intent

Create a **new section** in the home page that replicates the design and 3D scene from `bubble-dream-hero-scene.component.ts` but with **changed content** to showcase our custom Claude Agent Skills:

1. **angular-3d-scene-crafter** - Interactive 3D scene designer for @hive-academy/angular-3d library
2. **angular-gsap-animation-crafter** - Interactive scroll animation designer for @hive-academy/angular-gsap library

The section should demonstrate how we leverage Claude's Agent Skills feature to provide guided, conversational design experiences for 3D scenes and scroll animations.

---

## Reference Documents

- **Design Reference**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/bubble-dream-hero-scene.component.ts`
- **Skill 1**: `.claude/skills/angular-3d-scene-crafter/SKILL.md`
- **Skill 2**: `.claude/skills/angular-gsap-animation-crafter/SKILL.md`
- **Claude Skills Overview**: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- **Home Page**: `apps/angular-3d-demo/src/app/pages/home/home.component.ts`

---

## Key Requirements

### 1. Replicate Bubble-Dream-Hero-Scene Design

The existing bubble-dream-hero-scene features:

- **3D Scene Layer**:

  - Volumetric nebula background (pink/purple dreamy colors)
  - BubbleTextComponent with prominent "SKILLS" text
  - Four decorative floating bubbles in corners with mouse tracking
  - Soft ambient + spotlight + point light setup
  - Bloom effect for ethereal atmosphere

- **Overlay Layer**:
  - Header with brand and navigation
  - Skills intro section with label and headline
  - Grid of 4 skill cards with icons, names, descriptions, and progress bars
  - Footer with Angular-3D attribution

### 2. Change Content to Showcase Claude Skills

Replace the existing skill cards (Angular, Three.js, WebGPU, TypeScript) with:

**angular-3d-scene-crafter**:

- **Icon**: 🎨 or 🌌
- **Name**: 3D Scene Crafter
- **Description**: Guides 3D scene creation using conversational design. Analyzes reference images, reverse-engineers aesthetics, and generates complete Angular-3D components.
- **Key Features**:
  - Text-based conversational scene design
  - Image-based reverse engineering
  - Component and material recommendations
  - Production-ready code generation

**angular-gsap-animation-crafter**:

- **Icon**: ✨ or 🎬
- **Name**: Animation Crafter
- **Description**: Creates smooth scroll-based animations through guided design. Analyzes motion patterns, recommends timing/easing, and builds GSAP configurations.
- **Key Features**:
  - Scroll trigger configuration
  - Parallax and viewport animations
  - Stagger patterns and hijacked scroll
  - Motion analysis from video/images

### 3. Update Headline/Text Content

- Update `skills-label` and `skills-headline` for Claude Skills context
- Update footer attribution to reference Claude Agent Skills
- Consider changing bubble text from "SKILLS" to "AI CRAFTED" or "CLAUDE SKILLS"

---

## Existing Home Page Structure

```
home.component.ts
├── GlassSphereHeroSectionComponent  (hero)
├── CtaSectionComponent              (section)
└── LibraryOverviewSectionComponent  (section)
```

The new section should be added as a **fourth section** - likely between CTA and Library Overview, or after all existing sections.

---

## Technical Approach

1. Create new component: `claude-skills-showcase-section.component.ts`
2. Based on `bubble-dream-hero-scene.component.ts` structure
3. Customize content for Claude Skills
4. Add to `home.component.ts` template
5. Ensure consistent styling with home page sections

---

## Success Criteria

1. ✅ New section matches bubble-dream design aesthetic (nebula, bubbles, bloom)
2. ✅ Skills cards show angular-3d-scene-crafter and angular-gsap-animation-crafter
3. ✅ Content accurately describes Claude Agent Skills capabilities
4. ✅ Interactive 3D elements (mouse tracking, floating bubbles) work correctly
5. ✅ Section integrates seamlessly into home page scroll flow
6. ✅ Performance maintained (60fps)

---

## Files in Scope

### CREATE

- `apps/angular-3d-demo/src/app/pages/home/sections/claude-skills-showcase-section.component.ts`

### MODIFY

- `apps/angular-3d-demo/src/app/pages/home/home.component.ts` - add new section

### REFERENCE (read-only)

- `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/bubble-dream-hero-scene.component.ts`
- `.claude/skills/angular-3d-scene-crafter/SKILL.md`
- `.claude/skills/angular-gsap-animation-crafter/SKILL.md`
