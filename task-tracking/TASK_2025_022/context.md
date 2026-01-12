# TASK_2025_022 - GSAP Service Architecture & Centralization

## User Intent

The user wants to create a centralized `GsapService` singleton in `@hive-academy/angular-gsap` that properly manages GSAP core and plugin registration. This service will become the single source of truth for GSAP initialization, replacing the scattered direct imports and `registerPlugin` calls currently spread across multiple directives and components.

## Conversation Summary

The discussion began when the user asked whether GSAP is being instantiated as a new object each time or using Angular's singleton pattern. The analysis revealed:

1. **Current State**: Multiple components/directives directly import `gsap` and call `gsap.registerPlugin(ScrollTrigger)` in their constructors
2. **Problem**: This leads to redundant plugin registration calls, harder testing, and SSR safety concerns
3. **Solution**: Create a `GsapService` that:
   - Provides singleton access to GSAP core
   - Registers plugins once (ScrollTrigger, etc.)
   - Provides `gsap.context()` for automatic cleanup
   - Handles SSR guards centrally
   - Makes testing easier via DI

## Files with Direct GSAP Imports (to refactor)

### @hive-academy/angular-gsap library

| File                                 | Import Pattern                      | `registerPlugin` Call                                          |
| ------------------------------------ | ----------------------------------- | -------------------------------------------------------------- |
| `scroll-animation.directive.ts`      | `import { gsap } from 'gsap'`       | `gsap.registerPlugin(ScrollTrigger)` in constructor            |
| `hijacked-scroll.directive.ts`       | `import { gsap } from 'gsap'`       | `gsap.registerPlugin(ScrollTrigger)` in constructor            |
| `parallax-split-scroll.component.ts` | `import { gsap } from 'gsap'`       | `gsap.registerPlugin(ScrollTrigger)` in constructor            |
| `lenis-smooth-scroll.service.ts`     | Dynamic import via `import('gsap')` | `this.gsap.registerPlugin(this.ScrollTrigger)` in initialize() |

### @hive-academy/angular-3d library

| File                   | Import Pattern            | Notes                                   |
| ---------------------- | ------------------------- | --------------------------------------- |
| `animation.service.ts` | `import gsap from 'gsap'` | No plugin registration (just core GSAP) |

## Task Type

- **Type**: REFACTOR / CHORE
- **Priority**: Medium-High (architectural improvement)
- **Scope**: `@hive-academy/angular-gsap` and `@hive-academy/angular-3d` libraries

## Created

- **Date**: 2025-12-22
- **Source**: User request during GSAP usage analysis
