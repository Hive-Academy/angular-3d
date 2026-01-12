# Requirements Document - TASK_2025_024

## Introduction

This task implements a modern Angular provider pattern for `@hive-academy/angular-3d`, enabling centralized app-level configuration. Currently, every `<a3d-scene-3d>` component must specify renderer settings (antialias, alpha, powerPreference), shadow configuration, and camera defaults individually. This leads to:

1. **Repetition** - Same settings copy-pasted across scenes
2. **No App-Wide Defaults** - Can't configure once for entire application
3. **Discovery Friction** - Consumers must read source to find configurable options
4. **Pattern Mismatch** - Doesn't match `provideRouter()`, `provideGsap()` patterns

The solution is to create `provideAngular3d()` that allows app-level configuration while preserving per-scene override capability.

## Task Classification

- **Type**: FEATURE + REFACTORING
- **Priority**: P2-Medium (DX improvement, no breaking changes)
- **Complexity**: Medium
- **Estimated Effort**: 3-4 hours

## Workflow Dependencies

- **Research Needed**: No (patterns established in TASK_2025_022)
- **UI/UX Design Needed**: No (internal configuration, no visual changes)

---

## Requirements

### Requirement 1: Angular3dConfig Interface & Token

**User Story**: As a library consumer, I want a TypeScript interface that documents all configurable options, so that I can discover available settings via IDE autocompletion.

#### Acceptance Criteria

1. WHEN I type `provideAngular3d({` THEN IDE SHALL show all available configuration options
2. WHEN `Angular3dConfig` is imported THEN it SHALL include:
   - `renderer?: { antialias?, alpha?, powerPreference?, pixelRatio? }`
   - `shadows?: { enabled?, type? }`
   - `camera?: { fov?, near?, far? }`
   - `assets?: { basePath?, dracoDecoderPath? }`
3. WHEN `ANGULAR_3D_CONFIG` token is injected THEN it SHALL be typed as `Angular3dConfig`

### Requirement 2: provideAngular3d() Provider Function

**User Story**: As an Angular developer, I want to configure angular-3d in my `app.config.ts` using a modern provider function, so that configuration follows Angular best practices.

#### Acceptance Criteria

1. WHEN `provideAngular3d()` is called without arguments THEN library defaults SHALL apply
2. WHEN `provideAngular3d({ renderer: { antialias: false } })` is called THEN only specified values SHALL override defaults
3. WHEN `provideAngular3d()` is added to providers THEN it SHALL return `EnvironmentProviders`
4. WHEN JSDoc is viewed THEN it SHALL include usage example in app.config.ts

### Requirement 3: Scene3dComponent Config Integration

**User Story**: As a component author, I want Scene3dComponent to read app-level config while still allowing per-scene overrides, so that I can set defaults once but customize when needed.

#### Acceptance Criteria

1. WHEN app config sets `renderer.antialias: true` AND scene input is not set THEN antialias SHALL be true
2. WHEN app config sets `renderer.antialias: true` AND scene sets `[enableAntialiasing]="false"` THEN antialias SHALL be false (input wins)
3. WHEN no app config exists AND no input is set THEN library default SHALL apply
4. WHEN `ANGULAR_3D_CONFIG` is not provided THEN Scene3dComponent SHALL work without errors

**Priority Order**: Component Input > App Config > Library Default

### Requirement 4: Asset Loader Configuration

**User Story**: As a developer loading 3D models, I want to configure asset paths once at app level, so that I don't repeat paths in every model component.

#### Acceptance Criteria

1. WHEN `assets.basePath` is configured THEN GltfLoaderService SHALL prepend it to relative paths
2. WHEN `assets.dracoDecoderPath` is configured THEN Draco loader SHALL use that path
3. WHEN asset config is not provided THEN loaders SHALL work with default behavior

### Requirement 5: Demo App Simplification

**User Story**: As a demo app maintainer, I want scenes to use centralized config, so that I don't repeat the same settings across multiple scene components.

#### Acceptance Criteria

1. WHEN demo app.config.ts is updated THEN it SHALL include `provideAngular3d()` with app defaults
2. WHEN scene components are simplified THEN they SHALL only specify scene-specific overrides (like cameraPosition)
3. WHEN demo app is served THEN all scenes SHALL render correctly with centralized config
4. WHEN scenes are compared before/after THEN redundant attributes SHALL be removed

---

## Non-Functional Requirements

### Performance Requirements

- **Bundle Impact**: Provider SHALL not increase bundle size by more than 0.5KB
- **Runtime**: Config lookup SHALL be O(1) via DI token

### Reliability Requirements

- **Backward Compatible**: Existing scenes without `provideAngular3d()` SHALL continue working
- **Optional Token**: Config token SHALL be injected with `{ optional: true }`

### Maintainability Requirements

- **Type Safety**: All config options SHALL be typed with TypeScript
- **Documentation**: JSDoc on interface and provider function

---

## Technical Design

### Config Interface

```typescript
export interface Angular3dConfig {
  renderer?: {
    antialias?: boolean;
    alpha?: boolean;
    powerPreference?: 'high-performance' | 'low-power' | 'default';
    pixelRatio?: number;
  };
  shadows?: {
    enabled?: boolean;
    type?: 'Basic' | 'PCF' | 'PCFSoft' | 'VSM';
  };
  camera?: {
    fov?: number;
    near?: number;
    far?: number;
  };
  assets?: {
    basePath?: string;
    dracoDecoderPath?: string;
  };
}
```

### Provider Function

```typescript
export function provideAngular3d(config?: Angular3dConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ANGULAR_3D_CONFIG, useValue: config ?? {} },
  ]);
}
```

### Scene3dComponent Integration

```typescript
// In Scene3dComponent
private readonly appConfig = inject(ANGULAR_3D_CONFIG, { optional: true });

private initRenderer(): void {
  this.renderer = new THREE.WebGLRenderer({
    canvas,
    // Priority: input > appConfig > library default
    antialias: this.enableAntialiasing() ?? this.appConfig?.renderer?.antialias ?? true,
    alpha: this.alpha() ?? this.appConfig?.renderer?.alpha ?? true,
    powerPreference: this.powerPreference() ?? this.appConfig?.renderer?.powerPreference ?? 'high-performance',
  });
}
```

---

## Before/After Comparison

### Before (Current - Redundant)

```typescript
// app.config.ts
providers: [provideRouter(appRoutes)]  // No 3D config

// hero-scene.component.ts
<a3d-scene-3d
  [cameraPosition]="[0, 0, 20]"
  [enableAntialiasing]="true"
  [alpha]="true"
  [powerPreference]="'high-performance'"
  [enableShadows]="true">

// cta-scene.component.ts
<a3d-scene-3d
  [cameraPosition]="[0, 0, 25]"
  [enableAntialiasing]="true"      <!-- REDUNDANT -->
  [alpha]="true"                   <!-- REDUNDANT -->
  [powerPreference]="'high-performance'"  <!-- REDUNDANT -->
  [enableShadows]="true">          <!-- REDUNDANT -->
```

### After (Clean - Centralized)

```typescript
// app.config.ts
providers: [
  provideRouter(appRoutes),
  provideAngular3d({
    renderer: { antialias: true, alpha: true, powerPreference: 'high-performance' },
    shadows: { enabled: true },
  }),
]

// hero-scene.component.ts
<a3d-scene-3d [cameraPosition]="[0, 0, 20]">  <!-- Clean! Uses app defaults -->

// cta-scene.component.ts
<a3d-scene-3d [cameraPosition]="[0, 0, 25]">  <!-- Clean! Uses app defaults -->
```

---

## Files Summary

| Action | File | Description |
|--------|------|-------------|
| CREATE | `libs/angular-3d/src/lib/providers/angular-3d.provider.ts` | Provider function + config interface + token |
| MODIFY | `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` | Read config token, merge with inputs |
| MODIFY | `libs/angular-3d/src/lib/loaders/gltf-loader.service.ts` | Read asset paths from config |
| MODIFY | `libs/angular-3d/src/index.ts` | Export provider, config, token |
| MODIFY | `apps/angular-3d-demo/src/app/app.config.ts` | Add provideAngular3d() |
| MODIFY | `apps/angular-3d-demo/.../scenes/*.component.ts` | Remove redundant attributes |

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Redundant attributes removed | 80%+ reduction | Count scene attributes before/after |
| app.config.ts has provider | Yes | Code review |
| All scenes render correctly | 100% | Manual verification |
| TypeScript types complete | Yes | IDE autocompletion works |
| Backward compatible | Yes | Scenes work without provider |

---

## Out of Scope

- Changing per-scene service architecture (SceneService, RenderLoopService, etc.)
- Adding new Three.js features or components
- Performance optimizations beyond configuration
- SSR-specific handling (already handled by afterNextRender)
