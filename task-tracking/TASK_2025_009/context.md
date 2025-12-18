# Task Context - TASK_2025_009

## User Intent

Extract GSAP-based scroll animation directives into a new standalone library: **`@hive-academy/angular-gsap`**

## Background

Currently, GSAP directives live in the `dev-brand-ui` app under the Angular 3D area, but they are NOT 3D-specific:

- `scrollAnimation` - Animates regular DOM elements
- `hijackedScroll` - Generic "scroll-jacked" content sequences

These directives should be extracted into a separate library to:

1. Keep `@hive-academy/angular-3d` focused on Three.js primitives
2. Allow reuse across multiple applications
3. Follow single responsibility principle
4. Enable independent versioning and testing

## Reference Documentation

Complete specification documented in:

- `docs/angular-3d-library/09-angular-gsap-directives-and-consumers.md`

## Scope

### Components to Extract (from temp folder):

1. **ScrollAnimationDirective** - GSAP ScrollTrigger integration for scroll-based animations
2. **HijackedScrollDirective** - Scroll-jacking container for step-by-step sequences
3. **HijackedScrollItemDirective** - Individual step marker for hijacked scroll
4. **HijackedScrollTimelineComponent** - Wrapper component with content projection

### Consumer Components (10+):

- Landing page sections (hero, CTA, capabilities matrix, value propositions, etc.)
- Database sections (ChromaDB, Neo4j, LangGraph Core/Memory)
- ScrollingCodeTimelineComponent

## Technical Context

- **Workspace**: Nx monorepo using Angular 20.3
- **Existing Pattern**: `@hive-academy/angular-3d` library already established
- **Dependencies**: GSAP, ScrollTrigger plugin
- **Platform Considerations**: SSR support required (browser-only plugin registration)

## Conversation Summary

User requested Phase 1 Requirements for task 009, referencing document 09-angular-gsap-directives-and-consumers.md. All directive code has been added to the `temp/` folder for reference during library creation.
