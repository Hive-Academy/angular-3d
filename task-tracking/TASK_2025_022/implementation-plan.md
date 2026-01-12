# Implementation Plan - TASK_2025_022 (Updated)

## Goal

Create centralized `GsapCoreService` and modern Angular provider functions (`provideGsap()`, `provideLenis()`) that:

1. Eliminate redundant `gsap.registerPlugin(ScrollTrigger)` calls across 4 files
2. Provide a modern configuration pattern like `provideRouter()`
3. Move Lenis initialization from `app.ts` constructor to `app.config.ts`

---

## Evidence Summary

### Current Problem (Verified)

| File                                 | Line       | Redundant Code                                                  |
| ------------------------------------ | ---------- | --------------------------------------------------------------- |
| `scroll-animation.directive.ts`      | 58-59, 136 | Direct import + `gsap.registerPlugin(ScrollTrigger)`            |
| `hijacked-scroll.directive.ts`       | 52-53, 100 | Direct import + `gsap.registerPlugin(ScrollTrigger)`            |
| `parallax-split-scroll.component.ts` | 53-54, 171 | Direct import + `gsap.registerPlugin(ScrollTrigger)`            |
| `lenis-smooth-scroll.service.ts`     | 77-78, 141 | Dynamic import + `this.gsap.registerPlugin(this.ScrollTrigger)` |
| `app.ts` (demo)                      | 22-33      | Manual Lenis initialization in constructor                      |

### Modern Angular Pattern (Evidence)

**Source**: Angular Router pattern

```typescript
// Angular's pattern for configurable providers
export function provideRouter(routes: Routes): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: ROUTES, useValue: routes }, ...routerProviders]);
}
```

---

## Proposed Changes

### Component 1: GsapCoreService (NEW)

**Purpose**: Centralized GSAP access and plugin management

#### [CREATE] `libs/angular-gsap/src/lib/services/gsap-core.service.ts`

**Pattern Reference**: `lenis-smooth-scroll.service.ts:67-100` (singleton pattern)

**Implementation**:

```typescript
import { Injectable, inject, PLATFORM_ID, signal, InjectionToken } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Configuration for GSAP initialization
 */
export interface GsapConfig {
  /** Global GSAP defaults (ease, duration, etc.) */
  defaults?: gsap.TweenVars;
  /** Additional plugins to register */
  plugins?: gsap.RegisterablePlugins[];
}

/**
 * Injection token for GSAP configuration
 */
export const GSAP_CONFIG = new InjectionToken<GsapConfig>('GSAP_CONFIG');

/**
 * GsapCoreService - Centralized GSAP Access
 *
 * Provides singleton access to GSAP core and plugins.
 * Registers plugins once on first browser access.
 */
@Injectable({
  providedIn: 'root',
})
export class GsapCoreService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly config = inject(GSAP_CONFIG, { optional: true });
  private readonly _isInitialized = signal(false);
  private _gsap: typeof gsap | null = null;
  private _scrollTrigger: typeof ScrollTrigger | null = null;

  public readonly isInitialized = this._isInitialized.asReadonly();

  public get gsap(): typeof gsap | null {
    this.ensureInitialized();
    return this._gsap;
  }

  public get scrollTrigger(): typeof ScrollTrigger | null {
    this.ensureInitialized();
    return this._scrollTrigger;
  }

  public get isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  public createContext(func: gsap.ContextFunc, scope?: Element | string): gsap.Context | undefined {
    if (!this.isBrowser || !this._gsap) {
      return undefined;
    }
    return this._gsap.context(func, scope);
  }

  private ensureInitialized(): void {
    if (this._isInitialized() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this._gsap = gsap;
    this._scrollTrigger = ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    // Apply config if provided
    if (this.config?.defaults) {
      gsap.defaults(this.config.defaults);
    }
    if (this.config?.plugins) {
      gsap.registerPlugin(...this.config.plugins);
    }

    this._isInitialized.set(true);
  }
}
```

---

### Component 2: Provider Functions (NEW)

**Purpose**: Modern Angular configuration pattern

#### [CREATE] `libs/angular-gsap/src/lib/providers/gsap.provider.ts`

````typescript
import { EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, inject } from '@angular/core';
import { GsapCoreService, GSAP_CONFIG, GsapConfig } from '../services/gsap-core.service';

/**
 * Provides GSAP with optional configuration
 *
 * @example
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideGsap({ defaults: { ease: 'power2.out' } }),
 *   ],
 * };
 * ```
 */
export function provideGsap(config?: GsapConfig): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: GSAP_CONFIG, useValue: config ?? {} },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const gsapCore = inject(GsapCoreService);
        return () => {
          // Trigger initialization
          gsapCore.gsap;
        };
      },
      multi: true,
    },
  ]);
}
````

#### [CREATE] `libs/angular-gsap/src/lib/providers/lenis.provider.ts`

````typescript
import { EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, InjectionToken, inject } from '@angular/core';
import { LenisSmoothScrollService, LenisServiceOptions } from '../services/lenis-smooth-scroll.service';

/**
 * Injection token for Lenis configuration
 */
export const LENIS_CONFIG = new InjectionToken<LenisServiceOptions>('LENIS_CONFIG');

/**
 * Provides Lenis smooth scroll with configuration
 *
 * @example
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideLenis({ lerp: 0.1, wheelMultiplier: 1 }),
 *   ],
 * };
 * ```
 */
export function provideLenis(config?: LenisServiceOptions): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: LENIS_CONFIG, useValue: config ?? {} },
    {
      provide: APP_INITIALIZER,
      useFactory: () => {
        const lenis = inject(LenisSmoothScrollService);
        const lenisConfig = inject(LENIS_CONFIG, { optional: true });
        return async () => {
          await lenis.initialize(lenisConfig ?? {});
        };
      },
      multi: true,
    },
  ]);
}
````

---

### Component 3: Update LenisSmoothScrollService

**Purpose**: Use GsapCoreService instead of separate dynamic imports

#### [MODIFY] `libs/angular-gsap/src/lib/services/lenis-smooth-scroll.service.ts`

**Changes**:

1. Remove private gsap/ScrollTrigger properties
2. Inject GsapCoreService
3. Use service for GSAP access
4. Remove dynamic gsap import (keep lenis dynamic import)

---

### Component 4: Update Directives (3 files)

**Purpose**: Remove direct GSAP import, use GsapCoreService

#### [MODIFY] `libs/angular-gsap/src/lib/directives/scroll-animation.directive.ts`

#### [MODIFY] `libs/angular-gsap/src/lib/directives/hijacked-scroll.directive.ts`

#### [MODIFY] `libs/angular-gsap/src/lib/components/parallax-split-scroll.component.ts`

**Changes** (same for all):

1. Remove direct `import { gsap } from 'gsap'`
2. Remove direct `import { ScrollTrigger } from 'gsap/ScrollTrigger'`
3. Inject `GsapCoreService`
4. Remove `gsap.registerPlugin(ScrollTrigger)` from constructor
5. Access GSAP via service properties

---

### Component 5: Update Demo App

**Purpose**: Use new provider pattern, remove old registration

#### [MODIFY] `apps/angular-3d-demo/src/app/app.config.ts`

```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideGsap, provideLenis } from '@hive-academy/angular-gsap';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(appRoutes),

    // GSAP with configuration
    provideGsap({
      defaults: { ease: 'power2.out', duration: 1 },
    }),

    // Lenis smooth scroll with configuration
    provideLenis({
      lerp: 0.1,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      smoothWheel: true,
      useGsapTicker: true,
    }),
  ],
};
```

#### [MODIFY] `apps/angular-3d-demo/src/app/app.ts`

**Remove old Lenis initialization** (lines 22-33):

```typescript
// BEFORE
private readonly lenis = inject(LenisSmoothScrollService);

public constructor() {
  afterNextRender(() => {
    void this.lenis.initialize({...});
  });
}

// AFTER
// Clean - no manual initialization needed!
export class App {
  protected title = 'angular-3d-demo';
}
```

---

### Component 6: Update Public Exports

#### [MODIFY] `libs/angular-gsap/src/index.ts`

**Add new exports**:

```typescript
// Providers (NEW)
export { provideGsap, GSAP_CONFIG, type GsapConfig } from './lib/providers/gsap.provider';
export { provideLenis, LENIS_CONFIG } from './lib/providers/lenis.provider';

// Services
export { GsapCoreService } from './lib/services/gsap-core.service';
export { LenisSmoothScrollService, type LenisServiceOptions } from './lib/services/lenis-smooth-scroll.service';
```

---

## Integration Architecture

### Provider Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    app.config.ts                            │
│                                                             │
│   providers: [                                              │
│     provideGsap({ defaults: {...} }),  ← GSAP config       │
│     provideLenis({ lerp: 0.1, ... }),  ← Lenis config      │
│   ]                                                         │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ APP_INITIALIZER
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    GsapCoreService                          │
│           (providedIn: 'root' - singleton)                  │
│                                                             │
│  • Reads GSAP_CONFIG token                                  │
│  • Registers ScrollTrigger ONCE                             │
│  • Applies global defaults                                  │
└─────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────┼───────────────────┐
│                           │                   │
▼                           ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐
│ ScrollAnim    │  │ HijackedScroll│  │ LenisSmoothScrollSvc  │
│ Directive     │  │ Directive     │  │                       │
│               │  │               │  │ Reads LENIS_CONFIG    │
│ inject(       │  │ inject(       │  │ Auto-initializes      │
│  GsapCore)    │  │  GsapCore)    │  │ via APP_INITIALIZER   │
└───────────────┘  └───────────────┘  └───────────────────────┘
```

---

## Verification Plan

### Automated Tests

```bash
npx nx test angular-gsap
npx nx build angular-gsap
npx nx lint angular-gsap
```

### Manual Verification

1. **Serve demo application**

   ```bash
   npx nx serve angular-3d-demo
   ```

2. **Verify smooth scroll works** - Page should have smooth scrolling
3. **Verify scroll animations work** - Navigate to `/angular-gsap` and scroll
4. **Verify no console errors** - Check browser console

---

## Team-Leader Handoff

**Developer Type**: Frontend
**Complexity**: Medium
**Estimated Tasks**: 8 atomic tasks
**Batch Strategy**: Layer-based (providers first, then consumers, then demo)

### Suggested Task Breakdown

1. **Batch 1**: Core service + providers (3 tasks)
2. **Batch 2**: Refactor library consumers (4 tasks)
3. **Batch 3**: Update demo app (1 task)

---

## Files Summary

| Action | File                                 | Purpose                    |
| ------ | ------------------------------------ | -------------------------- |
| CREATE | `gsap-core.service.ts`               | Centralized GSAP singleton |
| CREATE | `gsap.provider.ts`                   | `provideGsap()` function   |
| CREATE | `lenis.provider.ts`                  | `provideLenis()` function  |
| MODIFY | `lenis-smooth-scroll.service.ts`     | Use GsapCoreService        |
| MODIFY | `scroll-animation.directive.ts`      | Use GsapCoreService        |
| MODIFY | `hijacked-scroll.directive.ts`       | Use GsapCoreService        |
| MODIFY | `parallax-split-scroll.component.ts` | Use GsapCoreService        |
| MODIFY | `index.ts`                           | Export providers           |
| MODIFY | `app.config.ts` (demo)               | Use provider functions     |
| MODIFY | `app.ts` (demo)                      | Remove old Lenis init      |
