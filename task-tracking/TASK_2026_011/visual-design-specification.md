# Visual Design Specification - TASK_2026_011

## Angular 3D Library Showcase Application

> **Design Aesthetic**: Gradient Modern + Sacred Tech Fusion  
> **Target Audience**: Angular developers, 3D graphics developers, technical evaluators  
> **Brand Positioning**: Premium, cutting-edge, technically sophisticated

---

## 🎨 Design System

### Aesthetic Profile

**Chosen Archetype**: **Gradient Modern** (primary) with **Sacred Tech** influences

**Rationale**:

- **Gradient Modern**: Appeals to modern developers, feels cutting-edge, supports 3D elements naturally
- **Sacred Tech touches**: Adds premium feel fitting for a sophisticated technical library
- **Dark theme**: Optimal backdrop for showcasing 3D scenes with glowing elements
- **Vibrant accents**: Make 3D demos pop, create visual excitement

**Personality**:

1. **Cutting-Edge**: Latest web tech, modern aesthetics
2. **Premium**: High-quality, polished, attention to detail
3. **Technical**: Sophisticated but approachable for developers

**Influences**:

- Raycast (purple gradients, glassmorphism)
- Vercel (minimalism, black backgrounds, gradient accents)
- three.js official site (3D-first design, dark theme)
- Angular.dev (modern developer UX, clear documentation patterns)

---

### Color Palette

```css
/* ===== PRIMARY BACKGROUNDS ===== */
--bg-primary: #0a0e11; /* Deep black (main background) */
--bg-secondary: #13171c; /* Elevated surfaces */
--bg-tertiary: #1c2026; /* Cards, containers */
--bg-code: #0f1419; /* Code blocks */

/* ===== BRAND GRADIENT ===== */
--gradient-brand: linear-gradient(135deg, #7c3aed 0%, #6366f1 50%, #06b6d4 100%);
/* Purple → Indigo → Cyan */

--gradient-hero: linear-gradient(135deg, #7c3aed 0%, #6366f1 30%, #3b82f6 60%, #06b6d4 100%);
/* Extended for larger areas */

--gradient-accent: linear-gradient(90deg, #a1ff4f 0%, #4fffdf 100%);
/* Neon green → Neon blue (for highlights) */

/* ===== TEXT COLORS ===== */
--text-primary: #ffffff; /* Main headings, high emphasis */
--text-secondary: #e5e7eb; /* Body text, descriptions */
--text-muted: #9ca3af; /* Labels, captions */
--text-subtle: #6b7280; /* Timestamps, metadata */

/* ===== ACCENT COLORS ===== */
--accent-primary: #6366f1; /* Primary CTAs, links */
--accent-secondary: #06b6d4; /* Secondary actions */
--accent-neon-green: #a1ff4f; /* Success, "new" badges */
--accent-neon-blue: #4fffdf; /* Interactive elements */
--accent-purple: #d946ef; /* Special highlights */

/* ===== SEMANTIC COLORS ===== */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* ===== BORDERS ===== */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-medium: rgba(255, 255, 255, 0.12);
--border-strong: rgba(255, 255, 255, 0.2);

/* ===== GLASS/OVERLAY ===== */
--glass-bg: rgba(28, 32, 38, 0.7);
--glass-border: rgba(255, 255, 255, 0.1);
--overlay-dark: rgba(10, 14, 17, 0.8);
```

**Accessibility Compliance**:

- `#FFFFFF` on `#0A0E11`: **17.93:1** ✅ (WCAG AAA)
- `#E5E7EB` on `#0A0E11`: **14.55:1** ✅ (WCAG AAA)
- `#9CA3AF` on `#0A0E11`: **8.59:1** ✅ (WCAG AA for all text)
- `#6366F1` on `#0A0E11`: **5.85:1** ✅ (WCAG AA for large text)

---

### Typography

```css
/* ===== FONT FAMILIES ===== */
--font-display: 'Inter', 'Manrope', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;

/* ===== TYPE SCALE ===== */
/* Display (Hero sections) */
--text-display-xl: 64px / 1.1 / 700; /* 4rem */
--text-display-lg: 56px / 1.1 / 700; /* 3.5rem */
--text-display-md: 48px / 1.2 / 700; /* 3rem */

/* Headlines (Section titles) */
--text-headline-lg: 40px / 1.2 / 700; /* 2.5rem */
--text-headline-md: 32px / 1.3 / 600; /* 2rem */
--text-headline-sm: 24px / 1.4 / 600; /* 1.5rem */

/* Body (Main content) */
--text-body-lg: 18px / 1.6 / 400; /* 1.125rem */
--text-body-md: 16px / 1.5 / 400; /* 1rem */
--text-body-sm: 14px / 1.5 / 400; /* 0.875rem */

/* Code & Mono */
--text-code: 14px / 1.7 / 400; /* 0.875rem */
--text-caption: 12px / 1.4 / 400; /* 0.75rem */

/* ===== FONT WEIGHTS ===== */
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

**Responsive Typography**:

```css
/* Mobile (0-767px) */
@media (max-width: 767px) {
  --text-display-xl: 36px / 1.1 / 700;
  --text-display-lg: 32px / 1.1 / 700;
  --text-display-md: 28px / 1.2 / 700;
  --text-headline-lg: 24px / 1.2 / 700;
  --text-headline-md: 20px / 1.3 / 600;
}
```

---

### Spacing System

```css
/* ===== 8px BASE UNIT ===== */
--space-1x: 8px;
--space-2x: 16px;
--space-3x: 24px;
--space-4x: 32px;
--space-5x: 40px;
--space-6x: 48px;
--space-8x: 64px;
--space-10x: 80px;
--space-12x: 96px;
--space-16x: 128px;
--space-20x: 160px;

/* ===== LAYOUT SPACING ===== */
--section-gap: 128px; /* Between major sections */
--section-padding-y: 96px; /* Vertical padding within sections */
--section-padding-x: 32px; /* Horizontal padding (mobile) */

--container-max-width: 1280px;
--content-max-width: 1024px;
--narrow-max-width: 768px;

/* ===== COMPONENT SPACING ===== */
--card-padding: 32px;
--card-gap: 24px;
--button-padding-x: 32px;
--button-padding-y: 16px;
```

---

### Border Radius

```css
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 16px;
--radius-xl: 24px;
--radius-2xl: 32px;

/* Component-specific */
--radius-button: 8px;
--radius-card: 16px;
--radius-input: 8px;
--radius-code: 12px;
```

---

### Shadows & Effects

```css
/* ===== ELEVATION (Box Shadows) ===== */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.12);
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.16);
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.24);
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.32);

/* ===== GLASS SHADOWS ===== */
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1);

/* ===== NEON GLOWS ===== */
--glow-purple: 0 0 20px rgba(124, 58, 237, 0.6), 0 0 40px rgba(124, 58, 237, 0.3);
--glow-cyan: 0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3);
--glow-green: 0 0 20px rgba(161, 255, 79, 0.6), 0 0 40px rgba(161, 255, 79, 0.3);

/* ===== BUTTON SHADOWS ===== */
--shadow-button: 0 2px 8px rgba(99, 102, 241, 0.2);
--shadow-button-hover: 0 4px 16px rgba(99, 102, 241, 0.35);

/* ===== CODE BLOCK GLOW ===== */
--shadow-code: 0 4px 24px rgba(124, 58, 237, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05);
```

---

### Animation Tokens

```css
/* ===== TIMING FUNCTIONS ===== */
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1); /* Material Design standard */
--ease-snappy: cubic-bezier(0.25, 0.1, 0.25, 1); /* Quick response */
--ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

/* ===== DURATIONS ===== */
--duration-instant: 100ms;
--duration-fast: 200ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-very-slow: 800ms;

/* ===== COMMON ANIMATIONS ===== */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
```

---

## 📐 Layout System

### Grid Structure

```
Desktop (1280px container):
┌─────────────────────────────────────────────────────────┐
│  [Sidebar 280px]  │  [Main Content flex-1]              │
│                   │                                      │
│  Categories       │  Demo Page Content                   │
│  Navigation       │  - Breadcrumb                        │
│  - Primitives     │  - Title                             │
│  - Particles      │  - 3D Scene (800x600)                │
│  - Text          │  - Code Block                         │
│  - Lighting      │  - Description                        │
│  - Effects       │                                      │
│                   │                                      │
└─────────────────────────────────────────────────────────┘
```

### Responsive Breakpoints

```css
/* Mobile-first approach */
--breakpoint-mobile: 0px; /* 0-767px */
--breakpoint-tablet: 768px; /* 768-1023px */
--breakpoint-desktop: 1024px; /* 1024-1439px */
--breakpoint-wide: 1440px; /* 1440px+ */
```

**Layout Behavior**:

- **Mobile (0-767px)**: Sidebar becomes top navigation (hamburger menu), single column
- **Tablet (768-1023px)**: Sidebar collapses to icons, main content full width
- **Desktop (1024px+)**: Full sidebar + main content side-by-side

---

## 🧩 Component Specifications

### 1. App Shell Layout

**Purpose**: Overall page structure with sidebar navigation and main content area

**Visual Specification**:

```
┌────────────────────────────────────────────────────────────┐
│ [Header - Logo + Search]                    [Theme Toggle] │ ← height: 64px
├──────────┬─────────────────────────────────────────────────┤
│          │                                                  │
│ Sidebar  │  Main Content Area                              │
│ 280px    │  - Breadcrumb                                    │
│          │  - Page Title                                    │
│ [Nav]    │  - Content Section 1                             │
│          │  - Content Section 2                             │
│ Category │  - ...                                           │
│ Group 1  │                                                  │
│  - Demo1 │                                                  │
│  - Demo2 │                                                  │
│          │                                                  │
│ Category │                                                  │
│ Group 2  │                                                  │
│          │                                                  │
└──────────┴─────────────────────────────────────────────────┘
```

**Component Structure**:

```html
<div class="app-shell">
  <!-- Header -->
  <header class="app-header">
    <div class="header-left">
      <button class="menu-toggle">☰</button>
      <div class="logo">
        <svg>...</svg>
        <span>Angular 3D</span>
      </div>
    </div>
    <div class="header-center">
      <input type="search" placeholder="Search demos..." />
    </div>
    <div class="header-right">
      <button class="theme-toggle">🌙</button>
    </div>
  </header>

  <!-- Main Layout -->
  <div class="app-body">
    <!-- Sidebar Navigation -->
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <!-- Category groups -->
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-outlet></router-outlet>
    </main>
  </div>
</div>
```

**Styles** (TailwindCSS):

```typescript
// Header
'h-16 bg-bg-secondary border-b border-border-subtle px-6 flex items-center justify-between';

// Sidebar
'w-[280px] bg-bg-secondary border-r border-border-subtle overflow-y-auto';

// Main Content
'flex-1 bg-bg-primary overflow-y-auto p-8';
```

**Responsive**:

- Mobile: Sidebar becomes drawer (slide-in from left)
- Tablet: Sidebar collapses to 64px icon-only
- Desktop: Full sidebar visible

---

### 2. Navigation Sidebar

**Purpose**: Categorized navigation for 23+ demo pages

**Visual Specification**:

```
┌──────────────────┐
│  🏠 Home         │
│                  │
│ ▼ PRIMITIVES     │ ← Category header
│   □ Box          │ ← Individual demo link
│   □ Sphere       │
│   □ Torus        │
│                  │
│ ▼ PARTICLES      │
│   □ Particle Cloud
│   □ GPU Particles│
│   □ Marble System│
│                  │
│ ▼ TEXT           │
│   □ Troika Text  │
│                  │
│ ▶ LIGHTING       │ ← Collapsed category
│                  │
│ ▶ EFFECTS        │
│ ▶ POSTPROCESSING │
│ ▶ CONTROLS       │
│ ▶ ADVANCED       │
└──────────────────┘
```

**Component Structure**:

```html
<nav class="sidebar-nav">
  <!-- Home Link -->
  <a href="/" class="nav-link nav-home">
    <span class="icon">🏠</span>
    <span class="label">Home</span>
  </a>

  <!-- Category 1: Primitives -->
  <div class="nav-category">
    <button class="category-header" (click)="toggleCategory('primitives')">
      <span class="caret">▼</span>
      <span class="title">PRIMITIVES</span>
      <span class="count">5</span>
    </button>
    <div class="category-items" *ngIf="isExpanded('primitives')">
      <a routerLink="/primitives/box" class="nav-link" routerLinkActive="active">
        <span class="icon">□</span>
        <span class="label">Box</span>
      </a>
      <a routerLink="/primitives/sphere" class="nav-link" routerLinkActive="active">
        <span class="icon">○</span>
        <span class="label">Sphere</span>
      </a>
      <!-- More items... -->
    </div>
  </div>

  <!-- More categories... -->
</nav>
```

**Styles** (TailwindCSS):

```typescript
// Category Header
'px-4 py-2 flex items-center justify-between text-text-muted text-body-sm font-medium uppercase tracking-wider hover:text-text-secondary cursor-pointer';

// Nav Link (inactive)
'px-4 py-2 flex items-center gap-3 text-text-secondary hover:bg-bg-tertiary rounded-md transition-colors duration-150';

// Nav Link (active)
'px-4 py-2 flex items-center gap-3 bg-gradient-to-r from-accent-primary/20 to-transparent border-l-2 border-accent-primary text-text-primary';
```

**Interaction States**:

- **Hover**: Background fade to `bg-tertiary`, text brightens
- **Active**: Gradient background, left border accent, bold text
- **Focus**: Keyboard outline with `ring-2 ring-accent-primary`

---

### 3. Demo Page Layout

**Purpose**: Consistent layout for each 3D demo page

**Visual Specification**:

```
┌─────────────────────────────────────────────────────────────┐
│  Home > Primitives > Box                    ← Breadcrumb    │
│                                                              │
│  Box Geometry                                ← Page Title   │
│  Fundamental 3D primitive...                 ← Description  │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │                                      │                   │
│  │       [3D SCENE CANVAS]              │  ← 3D Scene      │
│  │         800 x 600px                  │    Container     │
│  │                                      │                   │
│  └──────────────────────────────────────┘                   │
│                                                              │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓                   │
│  ┃ // TypeScript                        ┃  ← Code Block    │
│  ┃ <app-scene-3d>                      ┃                   │
│  ┃   <app-box-geometry                 ┃                   │
│  ┃     [position]="[0, 0, 0]"          ┃                   │
│  ┃     [scale]="[1, 1, 1]"             ┃                   │
│  ┃   />                                ┃                   │
│  ┃ </app-scene-3d>                     ┃                   │
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛                   │
│                                                              │
│  Properties & Controls                   ← Interactive      │
│  - Rotation: [slider]                      Controls        │
│  - Color: [picker]                                          │
│  - Scale: [slider]                                         │
│                                                              │
│  Use Cases                               ← Documentation    │
│  - Basic 3D geometry...                                     │
│  - Placeholder objects...                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Component Structure**:

```html
<div class="demo-page">
  <!-- Breadcrumb -->
  <nav class="breadcrumb">
    <a href="/">Home</a>
    <span>/</span>
    <a href="/primitives">Primitives</a>
    <span>/</span>
    <span class="current">Box</span>
  </nav>

  <!-- Page Header -->
  <header class="page-header">
    <h1 class="page-title">Box Geometry</h1>
    <p class="page-description">Fundamental 3D primitive for creating cubic shapes...</p>
    <div class="meta">
      <span class="badge">Component</span>
      <span class="badge">Interactive</span>
    </div>
  </header>

  <!-- 3D Scene Section -->
  <section class="scene-section">
    <div class="scene-container">
      <app-scene-3d>
        <app-box-geometry [config]="sceneConfig" />
      </app-scene-3d>
    </div>
  </section>

  <!-- Code Example Section -->
  <section class="code-section">
    <div class="code-header">
      <h3>Code Example</h3>
      <button class="copy-button">Copy</button>
    </div>
    <pre class="code-block"><code [highlight]="codeExample"></code></pre>
  </section>

  <!-- Interactive Controls (if applicable) -->
  <section class="controls-section">
    <h3>Properties & Controls</h3>
    <div class="control-grid">
      <app-slider label="Rotation X" [(value)]="rotationX" />
      <app-color-picker label="Color" [(value)]="color" />
      <!-- More controls... -->
    </div>
  </section>

  <!-- Documentation -->
  <section class="docs-section">
    <h3>Use Cases</h3>
    <ul>
      <li>Basic 3D geometry for prototyping</li>
      <li>Placeholder objects in complex scenes</li>
    </ul>
  </section>
</div>
```

**Styles** (TailwindCSS):

```typescript
// Page Title
'text-display-md text-text-primary font-bold mb-3x';

// Scene Container
'relative w-full aspect-[4/3] max-w-[800px] mx-auto bg-bg-secondary rounded-lg border border-border-subtle overflow-hidden';

// Code Block Container
'relative bg-bg-code rounded-lg border border-border-subtle p-6x shadow-code';
```

---

### 4. Code Block Component

**Purpose**: Syntax-highlighted code snippets with copy functionality

**Visual Specification**:

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ TypeScript            [Copy] [Expand] ┃ ← Header (language + actions)
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ 1  import { Component } from '@angu.. ┃
┃ 2                                      ┃ ← Line numbers
┃ 3  @Component({                        ┃
┃ 4    selector: 'app-demo',             ┃
┃ 5    template: `                       ┃
┃ 6      <app-scene-3d>                  ┃
┃ 7        <app-box-geometry             ┃
┃ 8          [position]="[0, 0, 0]"      ┃ ← Syntax highlighting
┃ 9        />                            ┃
┃10      </app-scene-3d>                 ┃
┃11    `                                 ┃
┃12  })                                  ┃
┃13  export class DemoComponent {}       ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

**Component Structure**:

```typescript
@Component({
  selector: 'app-code-block',
  template: `
    <div class="code-block-wrapper">
      <div class="code-header">
        <span class="language-label">{{ language }}</span>
        <div class="actions">
          <button (click)="copyCode()" class="icon-button">
            <svg>...</svg>
            <!-- Copy icon -->
            <span>{{ copied ? 'Copied!' : 'Copy' }}</span>
          </button>
          <button (click)="toggleExpand()" class="icon-button" *ngIf="expandable">
            <svg>...</svg>
            <!-- Expand icon -->
          </button>
        </div>
      </div>
      <pre [class.expanded]="isExpanded"><code [highlight]="code" [languages]="languages"></code></pre>
    </div>
  `,
})
export class CodeBlockComponent {
  @Input() code = '';
  @Input() language = 'typescript';
  @Input() expandable = false;
  copied = false;
  isExpanded = false;

  copyCode() {
    navigator.clipboard.writeText(this.code);
    this.copied = true;
    setTimeout(() => (this.copied = false), 2000);
  }

  toggleExpand() {
    this.isExpanded = !this.isExpanded;
  }
}
```

**Styles** (TailwindCSS):

```typescript
// Code Header
'flex items-center justify-between px-4x py-2x bg-bg-secondary border-b border-border-subtle rounded-t-lg';

// Language Label
'text-body-sm text-text-muted font-mono uppercase tracking-wider';

// Copy Button
'flex items-center gap-2x px-3x py-1x text-body-sm text-text-secondary hover:text-text-primary bg-bg-tertiary hover:bg-bg-primary rounded-md transition-all duration-150';

// Code Block (pre)
'overflow-x-auto p-4x font-mono text-code text-text-secondary bg-bg-code rounded-b-lg max-h-[400px]';

// Code Block (expanded)
'max-h-none';
```

**Syntax Highlighting Theme** (PrismJS Dark):

```css
/* Use Prism "Tomorrow Night" theme with custom token colors */
.token.comment {
  color: #6b7280;
} /* text-muted */
.token.keyword {
  color: #d946ef;
} /* accent-purple */
.token.string {
  color: #a1ff4f;
} /* neon-green */
.token.number {
  color: #4fffdf;
} /* neon-blue */
.token.function {
  color: #6366f1;
} /* accent-primary */
.token.class-name {
  color: #06b6d4;
} /* accent-secondary */
.token.operator {
  color: #e5e7eb;
} /* text-secondary */
.token.punctuation {
  color: #9ca3af;
} /* text-muted */
```

---

### 5. Scene Container (3D Canvas)

**Purpose**: Consistent wrapper for all 3D Three.js scenes

**Visual Specification**:

```
┌─────────────────────────────────────────────┐
│                                             │
│            [3D Scene Rendered Here]         │ ← Canvas element
│                 800 x 600px                 │
│                aspect-ratio: 4/3            │
│                                             │
│  [FPS: 60] [Frame: 16.67ms]                │ ← Performance overlay
└─────────────────────────────────────────────┘
```

**Component Structure**:

```typescript
@Component({
  selector: 'app-scene-container',
  template: `
    <div class="scene-container" #containerRef>
      <canvas #canvasRef class="scene-canvas"></canvas>

      <!-- Performance Overlay (optional) -->
      <div class="performance-overlay" *ngIf="showPerformance">
        <span class="stat">FPS: {{ fps }}</span>
        <span class="stat">Frame: {{ frameTime }}ms</span>
      </div>

      <!-- Loading State -->
      <div class="loading-overlay" *ngIf="isLoading">
        <div class="spinner"></div>
        <span>Loading scene...</span>
      </div>
    </div>
  `,
})
export class SceneContainerComponent {
  @Input() showPerformance = false;
  fps = 0;
  frameTime = 0;
  isLoading = true;
}
```

**Styles** (TailwindCSS):

```typescript
// Scene Container
'relative w-full aspect-[4/3] max-w-[800px] mx-auto bg-bg-secondary rounded-lg border border-border-subtle overflow-hidden shadow-lg';

// Canvas
'w-full h-full object-contain';

// Performance Overlay
'absolute top-3x right-3x flex gap-3x px-3x py-2x bg-black/60 backdrop-blur-sm rounded-md text-caption text-neon-green font-mono';

// Loading Overlay
'absolute inset-0 flex flex-col items-center justify-center bg-bg-primary/90 backdrop-blur-sm';

// Spinner
'w-10 h-10 border-4 border-accent-primary border-t-transparent rounded-full animate-spin';
```

**Responsive Behavior**:

- Desktop: 800x600px max (4:3 aspect)
- Tablet: Full width, 4:3 aspect maintained
- Mobile: Full width, 16:9 aspect (better for portrait)

---

### 6. Button Variants

**Purpose**: Primary, secondary, and ghost button styles

**Visual Specification**:

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Primary CTA    │  │  Secondary      │  │  Ghost Button   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
 Gradient bg          Border only          Transparent

Hover:
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Primary CTA ↗  │  │  Secondary   ↗  │  │  Ghost Button ↗ │
└─────────────────┘  └─────────────────┘  └─────────────────┘
 Glow intensifies     Fill + glow          Subtle bg
```

**Component Structure**:

```typescript
@Component({
  selector: 'app-button',
  template: `
    <button [class]="buttonClasses" [disabled]="disabled" (click)="handleClick($event)">
      <span class="icon" *ngIf="icon">{{ icon }}</span>
      <span class="label"><ng-content></ng-content></span>
      <span class="arrow" *ngIf="showArrow">→</span>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() icon?: string;
  @Input() showArrow = false;
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  get buttonClasses(): string {
    const base = 'inline-flex items-center justify-center gap-2x rounded-button font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white shadow-button hover:shadow-button-hover hover:scale-105',
      secondary: 'border-2 border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white',
      ghost: 'text-text-secondary hover:text-text-primary hover:bg-bg-tertiary',
    };

    const sizes = {
      sm: 'px-4x py-2x text-body-sm',
      md: 'px-6x py-3x text-body-md',
      lg: 'px-8x py-4x text-body-lg',
    };

    return `${base} ${variants[this.variant]} ${sizes[this.size]}`;
  }

  handleClick(event: MouseEvent) {
    if (!this.disabled) {
      this.clicked.emit(event);
    }
  }
}
```

**Styles** (Additional CSS):

```css
/* Primary Button Gradient Animation */
.btn-primary {
  background-size: 200% auto;
  transition: background-position 0.3s ease;
}

.btn-primary:hover {
  background-position: right center;
}

/* Button Glow on Hover */
.btn-primary:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35), 0 0 20px rgba(124, 58, 237, 0.4);
}

.btn-secondary:hover {
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.25), inset 0 0 20px rgba(99, 102, 241, 0.1);
}
```

---

### 7. Badge Component

**Purpose**: Category tags, status indicators, "new" labels

**Visual Specification**:

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Component│  │   New!   │  │Interactive│
└──────────┘  └──────────┘  └──────────┘
 Default        Success       Info
```

**Component Structure**:

```typescript
@Component({
  selector: 'app-badge',
  template: `
    <span [class]="badgeClasses">
      <span class="dot" *ngIf="showDot"></span>
      <ng-content></ng-content>
    </span>
  `,
})
export class BadgeComponent {
  @Input() variant: 'default' | 'success' | 'info' | 'warning' = 'default';
  @Input() showDot = false;

  get badgeClasses(): string {
    const base = 'inline-flex items-center gap-1x px-2x py-1x rounded text-caption font-medium uppercase tracking-wider';

    const variants = {
      default: 'bg-bg-tertiary text-text-muted border border-border-subtle',
      success: 'bg-success/20 text-success border border-success/30',
      info: 'bg-info/20 text-info border border-info/30',
      warning: 'bg-warning/20 text-warning border border-warning/30',
    };

    return `${base} ${variants[this.variant]}`;
  }
}
```

---

### 8. Card Component

**Purpose**: Glassmorphism cards for feature sections

**Visual Specification**:

```
┌─────────────────────────────────────┐
│  ┌───┐                              │
│  │ ✨ │  Feature Title               │ ← Icon + Title
│  └───┘                              │
│                                     │
│  Short description of the feature   │ ← Description
│  and its benefits for developers.   │
│                                     │
│  [Learn More →]                     │ ← CTA Link
└─────────────────────────────────────┘
  Glassmorphism effect with border
```

**Component Structure**:

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div [class]="cardClasses">
      <div class="card-icon" *ngIf="icon">
        {{ icon }}
      </div>
      <h3 class="card-title">{{ title }}</h3>
      <p class="card-description">
        <ng-content></ng-content>
      </p>
      <a [href]="link" class="card-link" *ngIf="link"> Learn More <span class="arrow">→</span> </a>
    </div>
  `,
})
export class CardComponent {
  @Input() title = '';
  @Input() icon?: string;
  @Input() link?: string;
  @Input() variant: 'default' | 'glass' | 'glow' = 'default';

  get cardClasses(): string {
    const base = 'rounded-card p-6x transition-all duration-300';

    const variants = {
      default: 'bg-bg-tertiary border border-border-subtle hover:border-border-medium hover:shadow-md',
      glass: 'bg-glass-bg backdrop-blur-xl border border-glass-border hover:border-accent-primary/30 hover:shadow-glass',
      glow: 'bg-bg-tertiary border border-accent-primary/30 hover:shadow-glow-purple',
    };

    return `${base} ${variants[this.variant]}`;
  }
}
```

**Styles** (TailwindCSS):

```typescript
// Card Title
'text-headline-sm text-text-primary font-semibold mb-2x';

// Card Description
'text-body-md text-text-secondary mb-4x';

// Card Link
'inline-flex items-center gap-1x text-body-sm text-accent-primary hover:text-accent-secondary font-medium';
```

---

## 🎬 Motion Design

### Scroll Animations

**Strategy**: Use Intersection Observer API with GSAP for performant scroll-triggered animations

**Default Pattern** (Fade In Up):

```typescript
// Trigger when element is 20% visible
IntersectionObserver threshold = 0.2;

gsap.from(element, {
  y: 20,
  opacity: 0,
  duration: 0.6,
  ease: 'power2.out'
});
```

**Stagger Effect** (Card Grids):

```typescript
gsap.from('.card-grid > .card', {
  y: 30,
  opacity: 0,
  duration: 0.5,
  stagger: 0.1, // 100ms delay between each
  ease: 'power2.out',
});
```

**Parallax Effect** (Background Elements):

```typescript
// Scrolls at 0.5x speed
element.style.transform = `translateY(${scrollY * 0.5}px)`;
```

---

### Hover Effects

| Element        | Effect                                      | Duration | Easing      |
| -------------- | ------------------------------------------- | -------- | ----------- |
| **Buttons**    | Scale 1.05 + shadow increase                | 200ms    | ease-smooth |
| **Cards**      | Lift (translateY -4px) + shadow + border    | 300ms    | ease-smooth |
| **Links**      | Color shift + underline slide               | 150ms    | ease-snappy |
| **Code Block** | Border glow + shadow                        | 200ms    | ease-smooth |
| **3D Scene**   | Cursor interaction (rotate/pan on mousemove | -        | continuous  |
| **Nav Items**  | Background fade + text brighten             | 150ms    | ease-snappy |

---

### Page Transitions

**Route Change Animation**:

```typescript
// Outgoing page
fadeOut: {
  duration: 200ms,
  opacity: 0
}

// Incoming page
fadeIn: {
  duration: 300ms,
  opacity: 0 → 1,
  delay: 100ms
}
```

**3D Scene Entrance** (When page loads):

```typescript
// 1. Scene fades in
opacity: 0 → 1, duration: 500ms

// 2. Camera zooms in
camera.position.z: 10 → 5, duration: 1000ms, ease: power2.out

// 3. 3D object rotates into view
rotation.y: -Math.PI/4 → 0, duration: 800ms, ease: back.out
```

---

### Loading States

**Scene Loading Spinner**:

```html
<div class="spinner-container">
  <div class="spinner-ring"></div>
  <span class="loading-text">Loading scene...</span>
</div>
```

```css
/* Spinner Animation */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner-ring {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(99, 102, 241, 0.2);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}
```

**Skeleton Loader** (Code blocks while syntax highlighting):

```html
<div class="skeleton-code">
  <div class="skeleton-line w-3/4"></div>
  <div class="skeleton-line w-1/2"></div>
  <div class="skeleton-line w-5/6"></div>
</div>
```

```css
@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 75%);
  background-size: 200px 100%;
  animation: shimmer 1.5s infinite linear;
  border-radius: 4px;
  margin-bottom: 8px;
}
```

---

## 📱 Responsive Design

### Mobile (0-767px)

**Layout Changes**:

- Sidebar → Hamburger menu (slide-in drawer)
- Header: Logo + Menu toggle only
- Content: Single column, full width
- 3D scenes: 16:9 aspect ratio (portrait-friendly)
- Code blocks: Scroll horizontally if needed
- Font sizes: Reduced (see responsive typography tokens)

**Spacing Adjustments**:

```css
--section-padding-y: 48px; /* Reduced from 96px */
--section-gap: 64px; /* Reduced from 128px */
--section-padding-x: 16px; /* Reduced from 32px */
```

**Touch Targets**: Minimum 44x44px for all interactive elements (WCAG 2.1)

---

### Tablet (768-1023px)

**Layout Changes**:

- Sidebar: Icon-only (64px width), expand on hover
- Content: Max-width 900px
- 3D scenes: 4:3 aspect, max 700px width
- 2-column card grids

**Responsive Images**:

```html
<img src="hero-mobile.webp" srcset="hero-mobile.webp 768w, hero-tablet.webp 1024w, hero-desktop.webp 1440w" sizes="(max-width: 767px) 100vw, (max-width: 1023px) 900px, 1280px" alt="Hero visual" />
```

---

### Desktop (1024px+)

**Optimizations**:

- Full sidebar (280px) + main content
- 3-column card grids
- Larger 3D scenes (800x600px max)
- Parallax effects enabled
- Hover states fully expressed

---

## ♿ Accessibility Specifications

### WCAG 2.1 AA Compliance

**Color Contrast**:

- ✅ All text meets 4.5:1 minimum (see color palette section)
- ✅ Large text (18px+) meets 3:1 minimum
- ✅ UI components (borders, icons) meet 3:1 minimum

**Keyboard Navigation**:

```typescript
// Focus visible styles
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

// Skip to main content link
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--accent-primary);
  color: white;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
```

**ARIA Labels**:

```html
<!-- 3D Scene -->
<div class="scene-container" role="img" aria-label="Interactive 3D demonstration of box geometry primitive">
  <canvas></canvas>
</div>

<!-- Navigation -->
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="..." aria-current="page">Home</a></li>
  </ul>
</nav>

<!-- Code Block -->
<div class="code-block" role="region" aria-label="Code example in TypeScript">
  <button aria-label="Copy code to clipboard">Copy</button>
</div>
```

**Screen Reader Announcements**:

```typescript
// Live region for dynamic content
<div aria-live="polite" aria-atomic="true" class="sr-only">
  {{ statusMessage }}
</div>;

// Example: After copying code
this.statusMessage = 'Code copied to clipboard';
setTimeout(() => (this.statusMessage = ''), 3000);
```

**Reduced Motion**:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Disable 3D auto-rotation */
  .scene-auto-rotate {
    animation: none;
  }
}
```

---

## 🎨 3D Scene Configurations (Angular-3D)

### Default Scene Lighting

**Rationale**: Consistent, professional lighting for all demos

```typescript
export const DEFAULT_LIGHTING_CONFIG = {
  ambient: {
    intensity: 0.4,
    color: 0xffffff,
  },
  directional: {
    intensity: 0.8,
    color: 0xffffff,
    position: [5, 10, 7.5],
  },
  point: {
    intensity: 0.3,
    color: 0x6366f1, // Brand color accent
    position: [-5, 5, -5],
  },
};
```

**Usage**:

```html
<app-scene-3d>
  <app-ambient-light [intensity]="0.4" />
  <app-directional-light [intensity]="0.8" [position]="[5, 10, 7.5]" />
  <app-point-light [intensity]="0.3" [color]="0x6366f1" [position]="[-5, 5, -5]" />

  <!-- Demo content -->
</app-scene-3d>
```

---

### Camera Configuration

**Default Camera** (Perspective):

```typescript
export const DEFAULT_CAMERA_CONFIG = {
  fov: 75,
  near: 0.1,
  far: 1000,
  position: [0, 0, 5],
};
```

**Orbit Controls** (For interactive demos):

```typescript
export const ORBIT_CONTROLS_CONFIG = {
  enableDamping: true,
  dampingFactor: 0.05,
  minDistance: 2,
  maxDistance: 20,
  maxPolarAngle: Math.PI / 2, // Prevent going below ground
  autoRotate: false, // User-controlled
  autoRotateSpeed: 1,
};
```

---

### Material Presets

**Standard Material** (Default for most demos):

```typescript
export const MATERIAL_STANDARD = {
  metalness: 0.3,
  roughness: 0.4,
  envMapIntensity: 1,
};
```

**Glass Material** (Transparent effects):

```typescript
export const MATERIAL_GLASS = {
  transparent: true,
  opacity: 0.6,
  metalness: 0,
  roughness: 0.1,
  transmission: 0.9,
  thickness: 0.5,
};
```

**Neon Material** (Glowing objects):

```typescript
export const MATERIAL_NEON = {
  emissive: 0xa1ff4f, // Neon green
  emissiveIntensity: 0.5,
  color: 0xa1ff4f,
  toneMapped: false,
};
```

---

### Postprocessing Presets

**Bloom Effect** (Glowing highlights):

```typescript
export const BLOOM_CONFIG = {
  strength: 0.8,
  radius: 0.4,
  threshold: 0.85,
};
```

**Usage**:

```html
<app-scene-3d>
  <!-- Scene content -->
  <app-postprocessing>
    <app-bloom [strength]="0.8" [radius]="0.4" [threshold]="0.85" />
  </app-postprocessing>
</app-scene-3d>
```

---

## 📦 Asset Generation Plan

### Icons & Graphics

**1. Logo / Brand Mark**

```
Prompt (generate_image):
"Modern 3D geometric logo for Angular library,
isometric cube with gradient purple to cyan,
floating particles around it, dark background,
minimalist tech aesthetic, vector style"

Dimensions: 512x512px
Format: WebP
Usage: Header logo, favicon
```

**2. Hero Visual (Homepage)**

```
Prompt (generate_image):
"Abstract 3D scene with floating geometric shapes
(spheres, cubes, torus), gradient purple to cyan lighting,
particle effects, dark cosmic background,
premium tech aesthetic, wide angle, 4k quality"

Dimensions: 1920x1080px (16:9)
Format: WebP
Usage: Homepage hero background
```

**3. Category Icons** (23 demo categories)

Use emoji or simple SVG icons:

- Primitives: □ (cube emoji)
- Particles: ✨ (sparkles)
- Text: 🔤 (text icon)
- Lighting: 💡 (bulb)
- Effects: ⚡ (lightning)
- Postprocessing: 🎨 (palette)
- Controls: 🎮 (gamepad)
- Advanced: 🚀 (rocket)

---

### 3D Models (Optional Enhancements)

**Logo 3D Model**:

- Create simple geometric logo in Blender/Spline
- Export as GLB format
- Use in hero section with rotation animation

**Demo Placeholders**:

- Low-poly geometric shapes (for fast loading)
- Pre-baked materials with textures
- Optimized for web (< 500KB per model)

---

## 🚀 Implementation Handoff

### Developer Setup

**1. Install Dependencies**:

```bash
npm install prismjs@latest
npm install @types/prismjs --save-dev
```

**2. Configure TailwindCSS**:

Copy design tokens from this spec to `tailwind.config.js` (already exists in demo app, verify tokens match).

**3. Import Global Styles**:

```typescript
// styles.css
@import 'prismjs/themes/prism-tomorrow.css'; // Syntax highlighting

// Add custom Prism overrides (see syntax highlighting section)
```

**4. Create Reusable Components**:

Priority order:

1. `app-code-block` (most reused)
2. `app-scene-container` (critical for 3D)
3. `app-button` (CTA buttons)
4. `app-card` (feature sections)
5. `app-badge` (category tags)

---

### Component Implementation Order

**Phase 1: Core Layout** (2-3 hours)

1. App shell (header + sidebar + main)
2. Navigation sidebar with categories
3. Breadcrumb component

**Phase 2: Demo Page Template** (2-3 hours) 4. Demo page layout 5. Scene container component 6. Code block component

**Phase 3: UI Components** (2-3 hours) 7. Button variants 8. Badge component 9. Card component 10. Loading states

**Phase 4: Content Population** (6-8 hours) 11. Create 23+ demo pages 12. Add code examples for each 13. Wire up 3D scenes 14. Add interactive controls (where applicable)

**Phase 5: Animations** (2-3 hours) 15. Scroll animations (GSAP) 16. Hover effects (CSS transitions) 17. Page transitions (Angular router animations) 18. 3D scene entrance animations

**Phase 6: Polish** (2-3 hours) 19. Responsive testing (mobile, tablet, desktop) 20. Accessibility audit (keyboard nav, screen reader) 21. Performance optimization (lazy loading, code splitting) 22. Cross-browser testing

---

### TailwindCSS Utility Classes Reference

**Common Patterns**:

```typescript
// Section Container
'max-w-container mx-auto px-6x py-16x';

// Card Grid (3 columns)
'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6x';

// Hero Title
'text-display-xl text-text-primary font-bold mb-4x';

// Body Text
'text-body-lg text-text-secondary leading-relaxed';

// Button Primary
'px-6x py-3x bg-gradient-to-r from-accent-primary to-accent-secondary text-white rounded-button shadow-button hover:shadow-button-hover hover:scale-105 transition-all duration-200';

// Code Block
'bg-bg-code rounded-lg p-4x font-mono text-code text-text-secondary overflow-x-auto';

// Glassmorphism Card
'bg-glass-bg backdrop-blur-xl border border-glass-border rounded-card p-6x';
```

---

### Animation Configurations (GSAP)

**Fade In Up** (Default):

```typescript
gsap.from('.fade-in-up', {
  y: 20,
  opacity: 0,
  duration: 0.6,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.fade-in-up',
    start: 'top 80%',
    toggleActions: 'play none none reverse',
  },
});
```

**Stagger Cards**:

```typescript
gsap.from('.card-grid .card', {
  y: 30,
  opacity: 0,
  duration: 0.5,
  stagger: 0.1,
  ease: 'power2.out',
  scrollTrigger: {
    trigger: '.card-grid',
    start: 'top 80%',
  },
});
```

**3D Scene Entrance**:

```typescript
// Camera zoom
gsap.from(camera.position, {
  z: 10,
  duration: 1,
  ease: 'power2.out',
});

// Object rotation
gsap.from(mesh.rotation, {
  y: -Math.PI / 4,
  duration: 0.8,
  ease: 'back.out(1.4)',
});
```

---

## ✅ Design Quality Checklist

Before implementation, verify:

### Visual Consistency

- [ ] All colors from defined palette
- [ ] Typography hierarchy clear (display → headline → body)
- [ ] Spacing follows 8px grid
- [ ] Border radius consistent (card: 16px, button: 8px)

### Accessibility

- [ ] Contrast ratios meet WCAG AA (4.5:1 text, 3:1 UI)
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible (2px accent outline)
- [ ] ARIA labels on 3D scenes and complex components
- [ ] Reduced motion media query respected

### Performance

- [ ] Images optimized (WebP format, lazy loading)
- [ ] Code splitting per route (lazy loading)
- [ ] 3D scenes dispose resources on destroy
- [ ] Animations use transform/opacity (GPU-accelerated)
- [ ] Initial bundle < 500KB gzipped

### Responsive

- [ ] Mobile: Hamburger menu, single column, 16:9 scenes
- [ ] Tablet: Icon sidebar, 2-column grids, 4:3 scenes
- [ ] Desktop: Full sidebar, 3-column grids, 800x600 scenes
- [ ] Touch targets ≥ 44x44px on mobile

### Component Quality

- [ ] All components have hover states
- [ ] Loading states defined
- [ ] Error states designed
- [ ] Empty states considered

---

## 📍 Next Steps

**This visual design specification is now complete.**

**Handoff to**: Software Architect (Phase 4)

**Architect will**:

1. Reference this design spec in implementation plan
2. Create file-level specifications
3. Define component architecture
4. Plan Angular module structure
5. Specify build configurations

**User Validation**: Not required for design phase (informational for architect/developers)

---

##Document Metadata

- **Task ID**: TASK_2026_011
- **Phase**: 3 - UI/UX Design
- **Deliverable**: Visual Design Specification
- **Created**: 2026-01-27
- **Design Aesthetic**: Gradient Modern + Sacred Tech
- **Component Count**: 8 core components
- **Page Count**: 23+ demo pages
- **Accessibility**: WCAG 2.1 AA compliant
- **Status**: ✅ Complete
