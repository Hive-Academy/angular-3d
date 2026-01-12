# Implementation Plan - TASK_2026_004

## Goal Description

Create a new "Claude Skills Showcase" section for the Angular-3D Demo home page that replicates the visual design of `bubble-dream-hero-scene.component.ts` but with content showcasing our Claude Agent Skills: **angular-3d-scene-crafter** and **angular-gsap-animation-crafter**.

---

## Proposed Changes

### Home Page Section

---

#### [NEW] [claude-skills-showcase-section.component.ts](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/src/app/pages/home/sections/claude-skills-showcase-section.component.ts)

New standalone Angular component replicating bubble-dream-hero-scene design:

**3D Scene Layer:**

- `a3d-scene-3d` with camera at [0, 0, 15], FOV 50, dark purple background
- `a3d-ambient-light` at low intensity (0.15)
- `a3d-spot-light` for main text illumination
- Two `a3d-point-light` for purple/pink accent lighting
- Four `a3d-floating-sphere` with glass/transmission materials, positioned at corners, with `float3d` and `mouseTracking3d` directives
- `a3d-nebula-volumetric` background with pink/purple palette
- `a3d-bubble-text` displaying "AI CRAFTED" with iridescence and mouse proximity effects
- `a3d-effect-composer` with bloom effect

**HTML Overlay Layer:**

- Header with branding ("Claude Skills")
- Skills intro section with label and headline
- Skills grid (2 cards) for each Claude Agent Skill
- Footer with Claude Platform attribution

**Skills Data:**

```typescript
skills = signal([
  {
    icon: '🎨',
    name: '3D Scene Crafter',
    description: 'Design stunning 3D scenes through conversational AI guidance',
    features: ['Image reverse-engineering', 'Material recommendations', 'Code generation'],
    color: '#e879f9',
  },
  {
    icon: '✨',
    name: 'Animation Crafter',
    description: 'Create smooth scroll animations with AI-guided design',
    features: ['Motion analysis', 'Timing optimization', 'GSAP configuration'],
    color: '#a855f7',
  },
]);
```

---

#### [MODIFY] [home.component.ts](file:///d:/projects/angular-3d-workspace/apps/angular-3d-demo/src/app/pages/home/home.component.ts)

Add import and include new section in template:

```diff
+ import { ClaudeSkillsShowcaseSectionComponent } from './sections/claude-skills-showcase-section.component';

  imports: [
    GlassSphereHeroSectionComponent,
+   ClaudeSkillsShowcaseSectionComponent,
    LibraryOverviewSectionComponent,
    CtaSectionComponent,
  ],

  template: `
    <app-glass-sphere-hero-section />

+   <section class="min-h-screen">
+     <app-claude-skills-showcase-section />
+   </section>

    <section class="min-h-screen">
      <app-cta-section />
    </section>
    ...
  `
```

---

## Verification Plan

### Build Verification

**Command:**

```bash
npx nx build angular-3d-demo
```

**Success Criteria:**

- Build completes without TypeScript errors
- No missing imports or undefined components

---

### Visual Verification (Browser)

**Command:**

```bash
npx nx serve angular-3d-demo
```

**Manual Steps:**

1. Open http://localhost:4200/ in browser
2. Scroll past the glass sphere hero section
3. Verify Claude Skills Showcase section appears with:
   - Purple/pink nebula background
   - "AI CRAFTED" bubble text with iridescent bubbles
   - Four corner floating spheres with mouse tracking
   - Two skill cards visible (3D Scene Crafter, Animation Crafter)
   - Soft bloom glow effect
4. Hover over floating spheres - verify mouse tracking works
5. Hover over skill cards - verify hover effects
6. Continue scrolling - verify CTA and Library Overview sections still render

---

### Performance Verification

**Manual Steps:**

1. Open browser DevTools → Performance tab
2. Record while scrolling through new section
3. Verify frame rate stays above 55fps
4. Check for no WebGL context errors in console

---

### Unit Test Update (Optional)

The existing `home.component.spec.ts` is outdated (references removed components). If time permits, update to reflect current component structure:

```typescript
// Add mock for new component
@Component({
  selector: 'app-claude-skills-showcase-section',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MockClaudeSkillsShowcaseSectionComponent {}

// Update test to verify new section renders
it('should render claude skills showcase section', () => {
  const compiled = fixture.nativeElement as HTMLElement;
  expect(compiled.querySelector('app-claude-skills-showcase-section')).toBeTruthy();
});
```

> **Note:** Unit test update is lower priority than visual verification since the existing tests are already broken.
