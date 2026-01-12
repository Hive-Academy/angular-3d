# Implementation Plan - TASK_2025_035

## Metaball Hero Scene Redesign (Nexus-Style)

---

## Current State Analysis

### Existing Component Structure (metaball-hero-scene.component.ts)

**Location**: `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/metaball-hero-scene.component.ts`

**Current Implementation**:

- **3D Scene Container**: Uses `Scene3dComponent` with camera at z=10, FOV=60
- **Lighting**: AmbientLight (0.2 intensity) + PointLight (1.2 intensity) with preset-based colors
- **Background**: StarFieldComponent with 2000 stars - **REMOVE**
- **Metaballs**: MetaballComponent in fullscreen mode with 6 spheres - **KEEP**
- **Text**: 3D TroikaTextComponent for headline and subtext - **REPLACE WITH HTML**
- **Controls**: OrbitControlsComponent - **KEEP/OPTIONAL**
- **UI**: Preset selector buttons at bottom center - **RESTYLE AS DROPDOWN**

**Current Presets** (lines 202-209):

- moody, cosmic, neon, sunset, holographic, minimal
- Each preset has: background color, light color, sphere color

**Evidence Citations**:

- Component definition: `metaball-hero-scene.component.ts:30-294`
- StarField usage: lines 65-71
- TroikaText (headline): lines 85-95
- TroikaText (subtext): lines 97-106
- Preset selector UI: lines 118-133

---

## Target Design Specification

### Reference: Nexus-Style Hero Layout

```
+------------------------------------------------------------------------------+
|  [Nexus Logo]           "Nexus."               [Metaball Controls v]         |
|                                                                              |
|  +GET IN TOUCH                                                               |
|  HI@FILIP.FYI                                                                |
|                                                                              |
|                                                                              |
|                      Where matter becomes                                    |
|                      thought and thought                                     |
|                        becomes form                                          |
|                                                                              |
|                    vessel: (0.00, 0.00) * field: 0.12u                       |
|                    merges: dynamic * theme: holographic                      |
|                                                                              |
|  Fluid Dynamics                                                              |
|  Organic Shapes                                                              |
|  Interactive Forms                               Nexus State - Active        |
|  Motion Studies                             where consciousness flows        |
|  Contact                                                                     |
+------------------------------------------------------------------------------+
```

### Visual Requirements

1. **Metaballs**: Large purple/violet organic forms filling entire viewport
2. **Background**: Clean dark background (#1a1a1a), NO star field
3. **Text**: HTML/CSS overlay (NOT 3D text) with modern typography
4. **Color Scheme**: Purple/violet dominant with subtle variations per preset

### Layout Structure

| Element             | Position     | Content                                           |
| ------------------- | ------------ | ------------------------------------------------- |
| Header              | Top          | Logo area + "Nexus." + Metaball Controls dropdown |
| Left Sidebar Top    | Top-Left     | Contact info (email link)                         |
| Left Sidebar Bottom | Bottom-Left  | Navigation links (vertical list)                  |
| Center              | Center       | Large headline + technical subtext                |
| Right Corner        | Bottom-Right | Status indicator                                  |

---

## Component Architecture

### Pattern Selection

**Chosen Pattern**: Layered HTML/CSS overlay on 3D scene (same as blueyard-scene.component.ts)

**Evidence**:

- `blueyard-scene.component.ts:70-177` - Template structure with layers
- `blueyard-scene.component.ts:179-271` - CSS styles for layered approach

**Rationale**:

1. Matches established codebase pattern for HTML overlays on 3D scenes
2. Provides better typography control than 3D text
3. Enables responsive design with TailwindCSS
4. Separates concerns: 3D rendering vs UI overlay

### Component Template Architecture

```
<div class="nexus-container">
  <!-- Layer 1: 3D Scene (background) -->
  <div class="scene-layer">
    <a3d-scene-3d>
      <a3d-ambient-light />
      <a3d-point-light />
      <a3d-metaball [fullscreen]="true" [preset]="selectedPreset()" />
      <a3d-orbit-controls />
    </a3d-scene-3d>
  </div>

  <!-- Layer 2: HTML Overlay (foreground) -->
  <div class="overlay-layer">
    <!-- Header -->
    <header class="header">
      <div class="logo-area">...</div>
      <span class="brand-title">Nexus.</span>
      <div class="controls-dropdown">...</div>
    </header>

    <!-- Left Sidebar -->
    <aside class="left-sidebar">
      <div class="contact-info">...</div>
      <nav class="nav-links">...</nav>
    </aside>

    <!-- Center Content -->
    <main class="center-content">
      <h1 class="headline">...</h1>
      <p class="subtext">...</p>
    </main>

    <!-- Right Corner Status -->
    <div class="status-indicator">...</div>
  </div>
</div>
```

### CSS Architecture

**Approach**: Component-scoped styles with TailwindCSS utilities

**Key CSS Classes**:

```css
.nexus-container {
  position: relative;
  width: 100%;
  height: 100vh;
  min-height: 600px;
  overflow: hidden;
  background: #1a1a1a;
}

.scene-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
}

.overlay-layer {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
  display: grid;
  grid-template-areas:
    'header header header'
    'sidebar center status'
    'sidebar center status';
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto 1fr auto;
  padding: 2rem;
}

.header {
  grid-area: header;
}
.left-sidebar {
  grid-area: sidebar;
}
.center-content {
  grid-area: center;
}
.status-indicator {
  grid-area: status;
  align-self: end;
}
```

---

## Implementation Details

### 1. Remove Unused Components

**Remove from imports**:

- `TroikaTextComponent` - replaced by HTML text
- `StarFieldComponent` - not in target design
- `ViewportPositionDirective` - not needed without 3D text

**Keep imports**:

- `Scene3dComponent` - 3D scene container
- `MetaballComponent` - core feature
- `AmbientLightComponent` - lighting
- `PointLightComponent` - preset-based lighting
- `OrbitControlsComponent` - optional interactivity

### 2. Template Changes

**Header Section**:

```html
<header class="header">
  <!-- Logo placeholder -->
  <div class="logo" aria-label="Logo">
    <svg><!-- Custom logo SVG --></svg>
  </div>

  <!-- Brand title -->
  <span class="brand-title">Nexus.</span>

  <!-- Preset dropdown -->
  <div class="controls-dropdown" (click)="toggleDropdown()">
    <span>Metaball Controls</span>
    <svg class="chevron"><!-- Dropdown icon --></svg>

    @if (dropdownOpen()) {
    <div class="dropdown-menu">
      @for (preset of presets; track preset) {
      <button (click)="selectPreset(preset)" [class.active]="selectedPreset() === preset">{{ preset }}</button>
      }
    </div>
    }
  </div>
</header>
```

**Left Sidebar**:

```html
<aside class="left-sidebar">
  <!-- Contact info -->
  <div class="contact-section">
    <span class="contact-label">+GET IN TOUCH</span>
    <a href="mailto:contact@example.com" class="contact-email">HI@EXAMPLE.COM</a>
  </div>

  <!-- Navigation -->
  <nav class="nav-links">
    <a href="#" class="nav-link">Fluid Dynamics</a>
    <a href="#" class="nav-link">Organic Shapes</a>
    <a href="#" class="nav-link">Interactive Forms</a>
    <a href="#" class="nav-link">Motion Studies</a>
    <a href="#" class="nav-link">Contact</a>
  </nav>
</aside>
```

**Center Content**:

```html
<main class="center-content">
  <h1 class="headline">
    Where matter becomes<br />
    thought and thought<br />
    becomes form
  </h1>
  <p class="subtext">{{ subtextContent() }}</p>
</main>
```

**Status Indicator**:

```html
<div class="status-indicator">
  <div class="status-title">Nexus State - Active</div>
  <div class="status-subtitle">where consciousness flows</div>
</div>
```

### 3. New Signals/State

```typescript
// Dropdown state
public readonly dropdownOpen = signal<boolean>(false);

// Toggle dropdown
public toggleDropdown(): void {
  this.dropdownOpen.update(open => !open);
}

// Close dropdown when selecting preset
public selectPreset(preset: MetaballPreset): void {
  this.selectedPreset.set(preset);
  this.dropdownOpen.set(false);
}
```

### 4. Styling Details

**Typography** (matching design system from tailwind.config.js):

- Brand title: `font-sans text-lg font-medium tracking-wider`
- Headline: `font-sans text-display-md font-bold leading-tight text-white text-center`
- Subtext: `font-mono text-body-sm text-text-secondary tracking-wide`
- Nav links: `font-sans text-body-sm text-white/70 hover:text-white`

**Colors**:

- Background: `#1a1a1a` (darker than current presets)
- Text primary: `#ffffff`
- Text secondary: `rgba(255, 255, 255, 0.6)`
- Accent: Purple/violet from preset colors

**Spacing** (8px base unit):

- Container padding: `2rem` (32px)
- Element gaps: `1rem` to `2rem`
- Section margins: `3rem` to `4rem`

### 5. Responsive Design

**Breakpoints** (from TailwindCSS defaults):

- Desktop: > 1024px - Full layout
- Tablet: 768px - 1024px - Condensed sidebar
- Mobile: < 768px - Stacked layout, hamburger menu

**Mobile Adaptations**:

- Header: Logo + hamburger menu
- Sidebar: Hidden, revealed by hamburger
- Headline: Smaller font size (clamp)
- Status: Positioned above center content

---

## Files Affected

| File                                                                                             | Action  | Changes                    |
| ------------------------------------------------------------------------------------------------ | ------- | -------------------------- |
| `apps/angular-3d-demo/src/app/pages/angular-3d-showcase/scenes/metaball-hero-scene.component.ts` | REWRITE | Full component restructure |

**No new files needed** - This is a single-component redesign.

---

## Quality Requirements

### Functional Requirements

1. **Metaball rendering**: Must display fullscreen metaballs with all 6 presets working
2. **Preset switching**: Dropdown must change metaball preset and update lighting
3. **Text overlay**: All text must be HTML/CSS, not 3D text
4. **Interactive controls**: Orbit controls should still work for metaball interaction
5. **Responsive layout**: Must work on desktop, tablet, and mobile viewports

### Non-Functional Requirements

1. **Performance**: No additional render overhead from removing 3D text
2. **Accessibility**:
   - Semantic HTML (header, nav, main, aside)
   - ARIA labels on interactive elements
   - Keyboard navigation for dropdown
3. **Maintainability**: CSS organized in component styles section

### Pattern Compliance

- Must follow standalone component pattern (verified: `blueyard-scene.component.ts:54`)
- Must use signal-based state (verified: `metaball-hero-scene.component.ts:197`)
- Must use ChangeDetectionStrategy.OnPush (verified: both components)
- Must follow TailwindCSS design tokens (verified: `tailwind.config.js`)

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: frontend-developer

**Rationale**:

1. Primary work is HTML/CSS template restructuring
2. Requires TailwindCSS expertise for styling
3. Responsive design implementation
4. No backend/API changes needed
5. Existing Angular component patterns to follow

### Complexity Assessment

**Complexity**: MEDIUM

**Estimated Effort**: 3-4 hours

**Breakdown**:

- Template restructure: 1.5 hours
- CSS styling (grid layout, typography, responsive): 1.5 hours
- Dropdown component logic: 30 minutes
- Testing and polish: 30 minutes

### Critical Verification Points

**Before Implementation, Developer Must Verify**:

1. **Imports exist in codebase**:

   - `Scene3dComponent` from `@hive-academy/angular-3d` (verified: lib exports)
   - `MetaballComponent` from `@hive-academy/angular-3d` (verified: lib exports)
   - `AmbientLightComponent` from `@hive-academy/angular-3d` (verified: lib exports)
   - `PointLightComponent` from `@hive-academy/angular-3d` (verified: lib exports)
   - `OrbitControlsComponent` from `@hive-academy/angular-3d` (verified: lib exports)

2. **Patterns verified from examples**:

   - Layered HTML overlay: `blueyard-scene.component.ts:70-177`
   - CSS grid layout: `blueyard-scene.component.ts:179-271`
   - Signal-based state: `metaball-hero-scene.component.ts:197`
   - Preset switching: `metaball-hero-scene.component.ts:280-282`

3. **Library documentation consulted**:

   - `libs/angular-3d/CLAUDE.md` - Component patterns and public API

4. **Design system tokens**:
   - Colors: `tailwind.config.js:18-68`
   - Typography: `tailwind.config.js:75-94`
   - Spacing: `tailwind.config.js:96-110`

---

## Architecture Delivery Checklist

- [x] All components specified with evidence
- [x] All patterns verified from codebase
- [x] All imports/decorators verified as existing
- [x] Quality requirements defined
- [x] Integration points documented
- [x] Files affected list complete
- [x] Developer type recommended
- [x] Complexity assessed
- [x] No step-by-step implementation (team-leader's responsibility)
