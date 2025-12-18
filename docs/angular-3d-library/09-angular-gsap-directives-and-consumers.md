# Angular GSAP directives (current implementation) + consumers

This doc captures the **exact GSAP/ScrollTrigger-based directives/components currently living inside `dev-brand-ui`** and every known consumer, as the source-of-truth for extracting a new standalone library: **`@hive-academy/angular-gsap`**.

Scope:

- ✅ Document existing behavior and public APIs (as implemented today).
- ✅ List all components that use these directives/components.
- ✅ Describe how they should move into the new `@hive-academy/angular-gsap` workspace.

## Why a separate `@hive-academy/angular-gsap` library

Right now the GSAP directives live under the Angular 3D area:

- `apps/dev-brand-ui/src/app/core/angular-3d/directives/*`

But they are **not 3D-specific**:

- `scrollAnimation` animates regular DOM elements.
- `hijackedScroll` is a generic “scroll-jacked” content sequence.

Extracting them into `@hive-academy/angular-gsap` lets the 3D package (`@hive-academy/angular-3d`) stay focused on Three.js primitives while still reusing scroll UX patterns.

## Current GSAP directives (to migrate)

### 1) `ScrollAnimationDirective`

- File: [apps/dev-brand-ui/src/app/core/angular-3d/directives/scroll-animation.directive.ts](apps/dev-brand-ui/src/app/core/angular-3d/directives/scroll-animation.directive.ts)
- Selector: `[scrollAnimation]`
- What it does:
  - Creates a paused GSAP timeline, binds it to a `ScrollTrigger`.
  - Supports predefined animation types (`fadeIn`, `slideUp`, `scaleIn`, `parallax`, etc.) and fully custom `from/to`.
  - Cleans up on destroy and re-initializes when config changes.

**Primary input**

- `scrollConfig: ScrollAnimationConfig` (signal-based input)
  - Defaults: `{ animation: 'fadeIn', start: 'top 80%', duration: 1, ease: 'power2.out' }`

**Key config fields**

- ScrollTrigger: `trigger`, `start`, `end`, `scrub`, `pin`, `pinSpacing`, `markers`, `once`, `toggleActions`
- Animation: `duration`, `delay`, `ease`, `stagger`, `from`, `to`
- Callbacks: `onEnter`, `onLeave`, `onEnterBack`, `onLeaveBack`, `onUpdate(progress)`

**Important behavior notes**

- It currently guards against being attached to non-`HTMLElement` targets and will log a warning.

### 2) `HijackedScrollDirective`

- File: [apps/dev-brand-ui/src/app/core/angular-3d/directives/hijacked-scroll.directive.ts](apps/dev-brand-ui/src/app/core/angular-3d/directives/hijacked-scroll.directive.ts)
- Selector: `[hijackedScroll]`
- What it does:
  - Pins the container while scrolling through “steps”.
  - Builds a GSAP master timeline where each step fades/slides in/out.
  - Emits current step index and overall progress.
  - Supports per-step “decoration” animations via `[data-decoration-index]` + `.decoration-inner`.

**Inputs**

- `scrollHeightPerStep` (vh per step, default `100`)
- `animationDuration` (seconds, default `0.3`)
- `ease` (default `power2.out`)
- `markers` (default `false`)
- `minHeight` (default `100vh`)
- `start` (default `top top`)
- `end` (optional; otherwise calculated)

**Outputs**

- `currentStepChange: number`
- `progressChange: number`

**Child dependency**

- Discovers its steps via `contentChildren(HijackedScrollItemDirective, { descendants: true })`.

### 3) `HijackedScrollItemDirective`

- File: [apps/dev-brand-ui/src/app/core/angular-3d/directives/hijacked-scroll-item.directive.ts](apps/dev-brand-ui/src/app/core/angular-3d/directives/hijacked-scroll-item.directive.ts)
- Selector: `[hijackedScrollItem]`
- What it does:
  - Marks an element as a step inside a hijacked scroll container.
  - Provides per-step config used by `HijackedScrollDirective`.

**Inputs**

- `slideDirection: 'left' | 'right' | 'up' | 'down' | 'none'` (default `none`)
- `fadeIn: boolean` (default `true`)
- `scale: boolean` (default `true`)
- `customFrom?: Record<string, unknown>`
- `customTo?: Record<string, unknown>`

## Components that wrap or use these directives

### 1) `HijackedScrollTimelineComponent` (wrapper)

- File: [apps/dev-brand-ui/src/app/shared/components/hijacked-scroll-timeline.component.ts](apps/dev-brand-ui/src/app/shared/components/hijacked-scroll-timeline.component.ts)
- Selector: `app-hijacked-scroll-timeline`
- What it does:
  - Thin wrapper around `HijackedScrollDirective` via `hostDirectives`.
  - Pass-through inputs/outputs, with `ng-content` so each feature section can own its markup.

### 2) `ScrollingCodeTimelineComponent` (direct user)

- File: [apps/dev-brand-ui/src/app/shared/components/scrolling-code-timeline.component.ts](apps/dev-brand-ui/src/app/shared/components/scrolling-code-timeline.component.ts)
- What it does:
  - Uses `HijackedScrollDirective` + `HijackedScrollItemDirective` directly.
  - Implements an `@for`-driven progressive “story” layout.

## Consumers inventory (who uses what)

### Uses `ScrollAnimationDirective` (`[scrollAnimation]`)

Landing page sections importing/using `ScrollAnimationDirective`:

- [temp/capabilities-matrix-section.component.ts](temp/capabilities-matrix-section.component.ts)
- [temp/problem-solution-section.component.ts](temp/problem-solution-section.component.ts)
- [temp/value-propositions-section.component.ts](temp/value-propositions-section.component.ts)
- [temp/workflow-examples-section.component.ts](temp/workflow-examples-section.component.ts)
- [temp/neo4j-section.component.ts](temp/neo4j-section.component.ts)
- [temp/langgraph-memory-section.component.ts](temp/langgraph-memory-section.component.ts)
- [temp/langgraph-core-section.component.ts](temp/langgraph-core-section.component.ts)
- [temp/hero-section.component.ts](temp/hero-section.component.ts)
- [temp/developer-experience-section.component.ts](temp/developer-experience-section.component.ts)
- [temp/cta-section.component.ts](temp/cta-section.component.ts)
- [temp/chromadb-section.component.ts](temp/chromadb-section.component.ts)

Also present (currently commented out DOM overlay):

- [temp/hero-section-space.component.ts](temp/hero-section-space.component.ts)

### Uses `HijackedScrollTimelineComponent` (`<app-hijacked-scroll-timeline>`)

- [temp/langgraph-core-section.component.ts](temp/langgraph-core-section.component.ts)
- [temp/langgraph-memory-section.component.ts](temp/langgraph-memory-section.component.ts)
- [temp/neo4j-section.component.ts](temp/neo4j-section.component.ts)
- [temp/chromadb-section.component.ts](temp/chromadb-section.component.ts)

### Uses `HijackedScrollDirective` / `HijackedScrollItemDirective` directly

- [apps/dev-brand-ui/src/app/shared/components/scrolling-code-timeline.component.ts](apps/dev-brand-ui/src/app/shared/components/scrolling-code-timeline.component.ts)

## Extraction guide: `@hive-academy/angular-gsap`

### Recommended library surface

For the new workspace package, treat these as the initial public API:

- `ScrollAnimationDirective`
- `HijackedScrollDirective`
- `HijackedScrollItemDirective`
- `HijackedScrollTimelineComponent` (optional, but it’s already a stable convenience wrapper)
- Types:
  - `ScrollAnimationConfig`, `AnimationType`
  - `HijackedScrollConfig`, `HijackedScrollItemConfig`, `SlideDirection`

### Suggested folder layout

- `libs/angular-gsap/src/lib/scroll/scroll-animation.directive.ts`
- `libs/angular-gsap/src/lib/scroll/hijacked-scroll.directive.ts`
- `libs/angular-gsap/src/lib/scroll/hijacked-scroll-item.directive.ts`
- `libs/angular-gsap/src/lib/components/hijacked-scroll-timeline.component.ts`
- `libs/angular-gsap/src/index.ts` (public exports)

### Dependencies and packaging

- `gsap` should be a dependency (or peerDependency if you want app-level control).
- `@angular/*` should follow the workspace Angular version (peer deps for publishing).

### SSR / platform note (important)

Today, both directives call `gsap.registerPlugin(ScrollTrigger)` at module load time.

In the new library, prefer registering ScrollTrigger only in the browser (e.g., via `isPlatformBrowser`), so SSR builds don’t accidentally execute DOM-dependent code.

## “Related GSAP usage” to consider later

Not part of the directive set above, but these are additional GSAP touchpoints you may want to fold into `@hive-academy/angular-gsap` (or a separate animation lib):

- [apps/dev-brand-ui/src/app/core/angular-3d/services/animation.service.ts](apps/dev-brand-ui/src/app/core/angular-3d/services/animation.service.ts) (GSAP-driven service, currently also depends on `angular-three`)
- [apps/dev-brand-ui/src/app/core/angular-3d/components/primitives/planet.component.ts](apps/dev-brand-ui/src/app/core/angular-3d/components/primitives/planet.component.ts) (uses GSAP tween for rotation)

## Quick “known-good” usage patterns (from current code)

### `scrollAnimation` on hero elements

See patterns in:

- [temp/developer-experience-section.component.ts](temp/developer-experience-section.component.ts)
- [temp/workflow-examples-section.component.ts](temp/workflow-examples-section.component.ts)

### Hijacked scroll timeline with projected content

See:

- [temp/chromadb-section.component.ts](temp/chromadb-section.component.ts)
- [temp/langgraph-core-section.component.ts](temp/langgraph-core-section.component.ts)
