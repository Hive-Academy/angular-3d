# Implementation Plan - TASK_2025_024

## Goal

Create `provideAngular3d()` provider function following modern Angular patterns, enabling app-level configuration for renderer, shadows, camera defaults, and asset paths.

---

## Evidence Summary

### Current Scene Usage (Verified)

```bash
# 10 scene usages found, all specify only camera settings:
<a3d-scene-3d [cameraPosition]="[0, 0, 25]" [cameraFov]="50">
<a3d-scene-3d [cameraPosition]="[0, 0, 3]">
<a3d-scene-3d [cameraPosition]="[0, 0, 20]" [cameraFov]="75">
# etc.
```

### Scene3dComponent Inputs (Current)

| Input | Type | Default | Configurable via Provider? |
|-------|------|---------|---------------------------|
| `cameraPosition` | `[number, number, number]` | `[0, 0, 20]` | Yes (as default) |
| `cameraFov` | `number` | `75` | Yes |
| `cameraNear` | `number` | `0.1` | Yes |
| `cameraFar` | `number` | `1000` | Yes |
| `enableAntialiasing` | `boolean` | `true` | Yes |
| `alpha` | `boolean` | `true` | Yes |
| `powerPreference` | `string` | `'high-performance'` | Yes |
| `backgroundColor` | `number \| null` | `null` | Yes |
| `enableShadows` | `boolean` | `false` | Yes |

---

## Proposed Changes

### Component 1: Provider & Config (NEW)

**Purpose**: Create modern Angular provider pattern

#### [CREATE] `libs/angular-3d/src/lib/providers/angular-3d.provider.ts`

```typescript
import { InjectionToken, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import type { ShadowMapType } from 'three';

/**
 * Configuration for @hive-academy/angular-3d library.
 *
 * Provides app-level defaults that can be overridden per-scene.
 * Priority: Component Input > App Config > Library Default
 */
export interface Angular3dConfig {
  /**
   * WebGLRenderer configuration
   */
  renderer?: {
    /** Enable antialiasing (default: true) */
    antialias?: boolean;
    /** Enable alpha/transparency (default: true) */
    alpha?: boolean;
    /** GPU power preference (default: 'high-performance') */
    powerPreference?: 'high-performance' | 'low-power' | 'default';
    /** Max pixel ratio (default: 2) */
    pixelRatio?: number;
  };

  /**
   * Shadow mapping configuration
   */
  shadows?: {
    /** Enable shadow mapping (default: false) */
    enabled?: boolean;
    /** Shadow map type (default: PCFSoftShadowMap) */
    type?: 'Basic' | 'PCF' | 'PCFSoft' | 'VSM';
  };

  /**
   * Default camera configuration
   */
  camera?: {
    /** Default field of view (default: 75) */
    fov?: number;
    /** Near clipping plane (default: 0.1) */
    near?: number;
    /** Far clipping plane (default: 1000) */
    far?: number;
  };

  /**
   * Asset loading configuration
   */
  assets?: {
    /** Base path for 3D model files */
    basePath?: string;
    /** Path to Draco decoder files */
    dracoDecoderPath?: string;
  };
}

/**
 * Injection token for Angular 3D configuration
 */
export const ANGULAR_3D_CONFIG = new InjectionToken<Angular3dConfig>('ANGULAR_3D_CONFIG');

/**
 * Provides Angular 3D library with optional configuration.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * import { provideAngular3d } from '@hive-academy/angular-3d';
 *
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideAngular3d({
 *       renderer: {
 *         antialias: true,
 *         powerPreference: 'high-performance',
 *       },
 *       shadows: { enabled: true },
 *       assets: {
 *         basePath: '/assets/3d/',
 *         dracoDecoderPath: '/draco/',
 *       },
 *     }),
 *   ],
 * };
 * ```
 *
 * @param config - Optional configuration object
 * @returns EnvironmentProviders for use in app.config.ts
 */
export function provideAngular3d(config?: Angular3dConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ANGULAR_3D_CONFIG, useValue: config ?? {} },
  ]);
}
```

---

### Component 2: Scene3dComponent Integration

**Purpose**: Read app config and merge with component inputs

#### [MODIFY] `libs/angular-3d/src/lib/canvas/scene-3d.component.ts`

**Changes**:

1. Import config token
2. Inject optional config
3. Create helper method for config resolution
4. Update initRenderer() and initCamera() to use resolved values

**Key Logic**:

```typescript
import { ANGULAR_3D_CONFIG, Angular3dConfig } from '../providers/angular-3d.provider';

// In class:
private readonly appConfig = inject(ANGULAR_3D_CONFIG, { optional: true });

/**
 * Resolve a config value with priority: input > appConfig > default
 */
private resolveConfig<T>(
  inputValue: T | undefined,
  configPath: (config: Angular3dConfig) => T | undefined,
  defaultValue: T
): T {
  // If input is explicitly set (not undefined), use it
  if (inputValue !== undefined) {
    return inputValue;
  }
  // Try app config
  const configValue = this.appConfig ? configPath(this.appConfig) : undefined;
  if (configValue !== undefined) {
    return configValue;
  }
  // Fall back to default
  return defaultValue;
}

// In initRenderer():
private initRenderer(): void {
  const canvas = this.canvasRef().nativeElement;

  this.renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: this.resolveConfig(
      this.enableAntialiasing(),
      c => c.renderer?.antialias,
      true
    ),
    alpha: this.resolveConfig(
      this.alpha(),
      c => c.renderer?.alpha,
      true
    ),
    powerPreference: this.resolveConfig(
      this.powerPreference(),
      c => c.renderer?.powerPreference,
      'high-performance'
    ),
  });

  // Pixel ratio
  const pixelRatio = this.appConfig?.renderer?.pixelRatio ?? 2;
  this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatio));

  // Shadows
  const shadowsEnabled = this.resolveConfig(
    this.enableShadows(),
    c => c.shadows?.enabled,
    false
  );
  if (shadowsEnabled) {
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = this.getShadowMapType();
  }
}

private getShadowMapType(): THREE.ShadowMapType {
  const typeConfig = this.appConfig?.shadows?.type ?? 'PCFSoft';
  switch (typeConfig) {
    case 'Basic': return THREE.BasicShadowMap;
    case 'PCF': return THREE.PCFShadowMap;
    case 'VSM': return THREE.VSMShadowMap;
    case 'PCFSoft':
    default: return THREE.PCFSoftShadowMap;
  }
}

// In initCamera():
private initCamera(): void {
  const container = this.canvasRef().nativeElement.parentElement;
  const aspect = container ? container.clientWidth / container.clientHeight : 1;

  this.camera = new THREE.PerspectiveCamera(
    this.resolveConfig(this.cameraFov(), c => c.camera?.fov, 75),
    aspect,
    this.resolveConfig(this.cameraNear(), c => c.camera?.near, 0.1),
    this.resolveConfig(this.cameraFar(), c => c.camera?.far, 1000)
  );

  const [x, y, z] = this.cameraPosition();
  this.camera.position.set(x, y, z);
}
```

---

### Component 3: GltfLoaderService Integration (Optional)

**Purpose**: Read asset paths from config

#### [MODIFY] `libs/angular-3d/src/lib/loaders/gltf-loader.service.ts`

**Changes**:

1. Inject optional config
2. Use basePath and dracoDecoderPath from config

```typescript
private readonly appConfig = inject(ANGULAR_3D_CONFIG, { optional: true });

// In constructor or init:
private getAssetPath(relativePath: string): string {
  const basePath = this.appConfig?.assets?.basePath ?? '';
  return basePath + relativePath;
}

private getDracoDecoderPath(): string {
  return this.appConfig?.assets?.dracoDecoderPath ??
    'https://www.gstatic.com/draco/versioned/decoders/1.5.6/';
}
```

---

### Component 4: Public Exports

#### [MODIFY] `libs/angular-3d/src/index.ts`

**Add exports**:

```typescript
// Providers
export {
  provideAngular3d,
  ANGULAR_3D_CONFIG,
  type Angular3dConfig
} from './lib/providers/angular-3d.provider';
```

---

### Component 5: Demo App Integration

#### [MODIFY] `apps/angular-3d-demo/src/app/app.config.ts`

```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAngular3d } from '@hive-academy/angular-3d';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),

    // Angular 3D configuration
    provideAngular3d({
      renderer: {
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        pixelRatio: 2,
      },
      shadows: {
        enabled: false,  // Enable per-scene as needed
      },
      camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
      },
    }),
  ],
};
```

---

## Verification Plan

### Automated Tests

```bash
npx nx build @hive-academy/angular-3d
npx nx lint @hive-academy/angular-3d
npx nx test @hive-academy/angular-3d
```

### Manual Verification

1. **Serve demo application**
   ```bash
   npx nx serve angular-3d-demo
   ```

2. **Verify scenes render correctly**
   - Home page hero scene
   - CTA scene
   - Angular-3D showcase scenes
   - Primitives showcase

3. **Verify config priority works**
   - Add `[enableShadows]="true"` to one scene
   - Verify shadows only appear on that scene (not others)

4. **Verify backward compatibility**
   - Remove `provideAngular3d()` from app.config
   - Verify all scenes still work with library defaults

---

## Team-Leader Handoff

**Developer Type**: Frontend
**Complexity**: Medium
**Estimated Tasks**: 5 atomic tasks
**Batch Strategy**: Layer-based (provider first, then integration, then demo)

### Suggested Task Breakdown

| Batch | Tasks | Focus |
|-------|-------|-------|
| 1 | 2 | Create provider file + update exports |
| 2 | 2 | Update Scene3dComponent + GltfLoaderService |
| 3 | 1 | Update demo app.config.ts |

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| CREATE | `libs/angular-3d/src/lib/providers/angular-3d.provider.ts` | Provider + config + token |
| MODIFY | `libs/angular-3d/src/lib/canvas/scene-3d.component.ts` | Read config, merge with inputs |
| MODIFY | `libs/angular-3d/src/lib/loaders/gltf-loader.service.ts` | Read asset paths |
| MODIFY | `libs/angular-3d/src/index.ts` | Export provider |
| MODIFY | `apps/angular-3d-demo/src/app/app.config.ts` | Use provideAngular3d() |
