# Task Context - TASK_2026_008

## User Intent

Implement a Route-Level Scene Loading Coordinator service for Angular 3D applications that prevents route reveal until Three.js scenes are fully initialized. The user is experiencing a "seconds freeze" with an empty black screen before the existing loading/entrance animations kick in. This gap occurs during WebGPU context initialization and shader compilation - BEFORE the AssetPreloaderService tracking begins.

The solution should:

1. Block route transitions until the 3D scene is ready to render
2. Show a loading indicator during WebGPU/shader compilation phase
3. Coordinate seamlessly with existing AssetPreloaderService and CinematicEntranceDirective
4. Provide smooth transitions from loading state to entrance animations
5. Work with GSAP text animations in hero content

## Conversation Summary

User observed that when first loading the home page:

- Empty black screen shows for several seconds
- Only navigation header visible during this gap
- After the freeze, entrance animations work perfectly
- The existing preload overlay only shows AFTER scene initialization

This is NOT a bug - it's a missing feature. TASK_2026_006 implemented asset preloading and entrance animations, but there's no route-level coordination to prevent showing an empty scene during Three.js/WebGPU initialization.

## Technical Context

- **Branch**: feature/TASK_2026_008-route-loading-coordinator
- **Created**: 2026-01-07
- **Type**: FEATURE
- **Complexity**: Medium-High (route guards, service integration, animation coordination)
- **Related Task**: TASK_2026_006 (Scene Loading & Entrance Animation System)

## Current State

The @hive-academy/angular-3d library already has (from TASK_2026_006):

- `AssetPreloaderService` - Asset loading with progress signals
- `CinematicEntranceDirective` - Camera entrance animations
- `SceneRevealDirective` - Object reveal animations
- `StaggerGroupService` - Coordinated stagger reveals

What's MISSING:

- Scene initialization detection (WebGPU ready, renderer created)
- Route-level loading coordination (guards/resolvers)
- Unified loading state that spans scene-init + asset-preload + entrance
- Loading UI component for the initialization phase

## Execution Strategy

**FEATURE** (Full Workflow)

1. project-manager → Requirements & scope definition
2. software-architect → Architecture design
3. team-leader → Task decomposition
4. frontend-developer → Implementation
5. QA agents → Testing & review
6. modernization-detector → Future enhancements

## Files of Interest

- `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` - Scene container
- `libs/angular-3d/src/lib/canvas/scene.service.ts` - Scene/renderer access
- `libs/angular-3d/src/lib/loaders/asset-preloader.service.ts` - Existing preloader
- `libs/angular-3d/src/lib/directives/animation/cinematic-entrance.directive.ts` - Entrance animations
- `apps/angular-3d-demo/src/app/pages/home/sections/glass-sphere-hero-section.component.ts` - Current hero section
- `apps/angular-3d-demo/src/app/app.routes.ts` - Route definitions
