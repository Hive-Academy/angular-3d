# Implementation Plan - TASK_2025_004

## Goal

Implement the **Loader Utilities** module for `@hive-academy/angular-3d`, providing typed, signal-based loaders for textures and GLTF models with caching, cancellation support, and automatic cleanup.

---

## Proposed Changes

### Component 1: Texture Loader Service

**Purpose**: Provides a signal-based texture loading utility that replaces `injectLoader` from angular-three.

---

#### [CREATE] `libs/angular-3d/src/lib/loaders/texture-loader.service.ts`

**Purpose**: Core service for loading textures with caching and reactive state.

**Pattern Reference**: [animation.service.ts:89-94](file:///D:/projects/angular-3d-workspace/libs/angular-3d/src/lib/render-loop/animation.service.ts#L89-L94) - @Injectable pattern with Map-based resource tracking

**Template**:

```typescript
/**
 * Texture Loader Service - Signal-based texture loading
 *
 * Provides reactive texture loading with caching and cleanup.
 */

import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';
import * as THREE from 'three';

export interface TextureLoadState {
  readonly data: THREE.Texture | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly progress: number;
}

@Injectable({ providedIn: 'root' })
export class TextureLoaderService {
  private readonly cache = new Map<string, THREE.Texture>();
  private readonly loader = new THREE.TextureLoader();

  /**
   * Load a texture from URL with caching
   */
  public load(url: string): TextureLoadState { ... }

  /**
   * Clear cache and dispose textures
   */
  public clearCache(): void { ... }

  /**
   * Get cached texture if available
   */
  public getCached(url: string): THREE.Texture | undefined { ... }
}
```

**Quality Requirements**:

- ✅ Signal-based state (loading, error, data)
- ✅ URL-based caching
- ✅ Proper texture disposal on cache clear
- ✅ Progress tracking via THREE.LoadingManager

---

#### [CREATE] `libs/angular-3d/src/lib/loaders/inject-texture-loader.ts`

**Purpose**: Function-based injectable API for texture loading in components.

**Pattern Reference**: Follows Angular's `inject()` pattern for composable utilities

**Template**:

````typescript
/**
 * Inject Texture Loader - Composable texture loading
 *
 * Usage:
 * ```typescript
 * readonly texture = injectTextureLoader(() => this.textureUrl());
 * ```
 */

import { inject, DestroyRef, signal, computed, effect } from '@angular/core';
import * as THREE from 'three';
import { TextureLoaderService } from './texture-loader.service';

export interface TextureLoaderResult {
  readonly data: () => THREE.Texture | null;
  readonly loading: () => boolean;
  readonly error: () => Error | null;
}

export function injectTextureLoader(
  urlFn: () => string | null | undefined
): TextureLoaderResult { ... }
````

---

### Component 2: GLTF Loader Service

**Purpose**: Provides a signal-based GLTF loading utility that replaces `injectGLTF` from angular-three-soba.

---

#### [CREATE] `libs/angular-3d/src/lib/loaders/gltf-loader.service.ts`

**Purpose**: Core service for loading GLTF/GLB models with Draco/MeshOpt support.

**Pattern Reference**: [angular-3d-state.store.ts:194-199](file:///D:/projects/angular-3d-workspace/libs/angular-3d/src/lib/store/angular-3d-state.store.ts#L194-L199) - Root injectable service pattern

**Template**:

```typescript
/**
 * GLTF Loader Service - Signal-based GLTF/GLB model loading
 *
 * Supports Draco and MeshOpt decompression.
 */

import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { GLTFLoader, GLTF, DRACOLoader, MeshoptDecoder } from 'three-stdlib';

export interface GltfLoaderOptions {
  useDraco?: boolean;
  useMeshOpt?: boolean;
  dracoDecoderPath?: string;
}

export interface GltfLoadState {
  readonly data: GLTF | null;
  readonly loading: boolean;
  readonly error: Error | null;
  readonly progress: number;
}

@Injectable({ providedIn: 'root' })
export class GltfLoaderService {
  private readonly cache = new Map<string, GLTF>();
  private loader: GLTFLoader | null = null;
  private dracoLoader: DRACOLoader | null = null;

  /**
   * Load GLTF/GLB model with options
   */
  public load(url: string, options?: GltfLoaderOptions): Promise<GLTF> { ... }

  /**
   * Clear cache (does not dispose geometries/materials)
   */
  public clearCache(): void { ... }

  /**
   * Get cache key for URL + options
   */
  private getCacheKey(url: string, options?: GltfLoaderOptions): string { ... }
}
```

---

#### [CREATE] `libs/angular-3d/src/lib/loaders/inject-gltf-loader.ts`

**Purpose**: Function-based injectable API for GLTF loading in components.

**Template**:

````typescript
/**
 * Inject GLTF Loader - Composable GLTF/GLB loading
 *
 * Usage:
 * ```typescript
 * readonly gltf = injectGltfLoader(() => this.modelPath(), {
 *   useDraco: this.useDraco
 * });
 * ```
 */

import { inject, DestroyRef, signal, effect } from '@angular/core';
import { GLTF } from 'three-stdlib';
import { GltfLoaderService, GltfLoaderOptions } from './gltf-loader.service';

export interface GltfLoaderResult {
  readonly data: () => GLTF | null;
  readonly loading: () => boolean;
  readonly error: () => Error | null;
  readonly scene: () => THREE.Group | null;
}

export function injectGltfLoader(
  urlFn: () => string | null | undefined,
  options?: GltfLoaderOptions | (() => GltfLoaderOptions)
): GltfLoaderResult { ... }
````

---

### Component 3: Unit Tests

**Purpose**: Comprehensive test coverage following existing patterns.

---

#### [CREATE] `libs/angular-3d/src/lib/loaders/texture-loader.service.spec.ts`

**Purpose**: Unit tests for TextureLoaderService

**Pattern Reference**: [animation.service.spec.ts:1-25](file:///D:/projects/angular-3d-workspace/libs/angular-3d/src/lib/render-loop/animation.service.spec.ts#L1-L25) - Jest mock pattern for Three.js

**Template**:

```typescript
import { TextureLoaderService } from './texture-loader.service';
import * as THREE from 'three';

// Mock Three.js TextureLoader
jest.mock('three', () => {
  const originalModule = jest.requireActual('three');
  return {
    ...originalModule,
    TextureLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn((url, onLoad) => {
        const texture = new originalModule.Texture();
        setTimeout(() => onLoad?.(texture), 0);
        return texture;
      }),
    })),
  };
});

describe('TextureLoaderService', () => {
  let service: TextureLoaderService;

  beforeEach(() => {
    service = new TextureLoaderService();
  });

  // Tests for load, caching, error handling
});
```

---

#### [CREATE] `libs/angular-3d/src/lib/loaders/gltf-loader.service.spec.ts`

**Purpose**: Unit tests for GltfLoaderService

**Pattern Reference**: Same as texture-loader spec

**Template**:

```typescript
import { GltfLoaderService } from './gltf-loader.service';

// Mock three-stdlib GLTFLoader
jest.mock('three-stdlib', () => ({
  GLTFLoader: jest.fn().mockImplementation(() => ({
    load: jest.fn((url, onLoad) => {
      const mockGltf = { scene: { traverse: jest.fn() } };
      setTimeout(() => onLoad?.(mockGltf), 0);
    }),
    setDRACOLoader: jest.fn(),
    setMeshoptDecoder: jest.fn(),
  })),
  DRACOLoader: jest.fn().mockImplementation(() => ({
    setDecoderPath: jest.fn(),
    preload: jest.fn(),
    dispose: jest.fn(),
  })),
  MeshoptDecoder: { decode: jest.fn() },
}));

describe('GltfLoaderService', () => {
  let service: GltfLoaderService;

  beforeEach(() => {
    service = new GltfLoaderService();
  });

  // Tests for load, Draco, MeshOpt, caching
});
```

---

### Component 4: Module Exports

**Purpose**: Update barrel exports for public API.

---

#### [MODIFY] `libs/angular-3d/src/lib/loaders/index.ts`

**Line Range**: 1-6
**Changes**:

- Remove placeholder export
- Add real service and function exports

**Template**:

```typescript
// @hive-academy/angular-3d - Loaders module
// Texture and GLTF loaders with caching

// Services
export { TextureLoaderService, type TextureLoadState } from './texture-loader.service';
export { GltfLoaderService, type GltfLoaderOptions, type GltfLoadState } from './gltf-loader.service';

// Injectable functions
export { injectTextureLoader, type TextureLoaderResult } from './inject-texture-loader';
export { injectGltfLoader, type GltfLoaderResult } from './inject-gltf-loader';
```

---

## Integration Architecture

### Data Flow

```
Component → injectTextureLoader(urlFn) → TextureLoaderService → THREE.TextureLoader → Cache → Signal
                                                        ↓
                                              effect() watches urlFn
                                                        ↓
                                              Cancel stale / Load new
```

### Caching Strategy

- **Texture Cache**: Map\<url, THREE.Texture\>
- **GLTF Cache**: Map\<cacheKey, GLTF\> where cacheKey = `${url}:${JSON.stringify(options)}`

### Stale Request Protection

```typescript
effect(() => {
  const url = urlFn();
  const requestId = ++this.currentRequestId;

  // Load...

  // Only update state if this is still the current request
  if (requestId === this.currentRequestId) {
    _data.set(result);
  }
});
```

---

## Verification Plan

### Automated Tests

```bash
# Run unit tests for angular-3d library
npx nx test angular-3d --skip-nx-cache --no-watch

# Run lint
npx nx lint angular-3d

# Build library
npx nx build angular-3d
```

### Manual Verification

1. **Build Success**: Verify `npx nx build angular-3d` completes without errors
2. **Test Coverage**: All new tests pass with >80% coverage on loader files
3. **Type Safety**: No TypeScript errors in strict mode

---

## Team-Leader Handoff

**Developer Type**: backend-developer (service layer, no UI)
**Complexity**: Medium
**Estimated Tasks**: 6-8 atomic tasks
**Batch Strategy**: Layer-based (services first, then inject functions, then tests)

### Suggested Task Breakdown

1. Create `TextureLoaderService` with basic load + cache
2. Create `injectTextureLoader` function
3. Create `TextureLoaderService` unit tests
4. Create `GltfLoaderService` with Draco support
5. Create `injectGltfLoader` function
6. Create `GltfLoaderService` unit tests
7. Update `loaders/index.ts` exports
8. Verify build/lint/test pass
