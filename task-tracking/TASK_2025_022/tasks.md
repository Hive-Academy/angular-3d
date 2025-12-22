# Development Tasks - TASK_2025_022 (Updated)

**Total Tasks**: 8 | **Batches**: 3 | **Status**: 0/3 complete

---

## Plan Validation Summary

**Validation Status**: PASSED ✅

### Assumptions Verified

- ✅ `provideGsap()` pattern follows Angular's `provideRouter()` convention
- ✅ `APP_INITIALIZER` will run before components initialize
- ✅ LENIS_CONFIG injection token pattern works with optional injection

### Risks Identified

| Risk                            | Severity | Mitigation                               |
| ------------------------------- | -------- | ---------------------------------------- |
| APP_INITIALIZER async timing    | LOW      | Lenis uses async factory, GSAP uses sync |
| Demo app breaks during refactor | LOW      | Test after each batch                    |

---

## Batch 1: Core Service & Providers ✅ COMPLETE

**Developer**: frontend-developer
**Tasks**: 3 | **Dependencies**: None
**Commit**: `90a2a31`

### Task 1.1: Create GsapCoreService 🔄 IN PROGRESS

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\services\gsap-core.service.ts`
**Spec Reference**: implementation-plan.md:60-105
**Pattern to Follow**: `lenis-smooth-scroll.service.ts:67-100`

**Quality Requirements**:

- Singleton pattern with `providedIn: 'root'`
- SSR-safe with `isPlatformBrowser` guard
- Lazy initialization on first property access
- Reads optional `GSAP_CONFIG` token
- Provides `gsap`, `scrollTrigger`, and `createContext()` methods
- Comprehensive JSDoc comments

**Implementation Details**:

- Imports: `Injectable, inject, PLATFORM_ID, signal, InjectionToken` from `@angular/core`
- Create `GsapConfig` interface and `GSAP_CONFIG` token
- Decorators: `@Injectable({ providedIn: 'root' })`
- Key Logic: `ensureInitialized()` registers plugins once, applies config defaults

---

### Task 1.2: Create provideGsap() Provider Function 🔄 IN PROGRESS

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\providers\gsap.provider.ts`
**Spec Reference**: implementation-plan.md:112-140
**Pattern to Follow**: Angular's `provideRouter()` pattern

**Quality Requirements**:

- Uses `makeEnvironmentProviders()` for type safety
- Provides `GSAP_CONFIG` token
- Uses `APP_INITIALIZER` to trigger initialization
- Comprehensive JSDoc with usage example

**Implementation Details**:

- Imports: `EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, inject`
- Export function signature: `provideGsap(config?: GsapConfig): EnvironmentProviders`

---

### Task 1.3: Create provideLenis() Provider Function 🔄 IN PROGRESS

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\providers\lenis.provider.ts`
**Spec Reference**: implementation-plan.md:142-180
**Pattern to Follow**: Angular's `provideRouter()` pattern

**Quality Requirements**:

- Uses `makeEnvironmentProviders()` for type safety
- Creates `LENIS_CONFIG` injection token
- Uses async `APP_INITIALIZER` to call `lenis.initialize()`
- Comprehensive JSDoc with usage example

**Implementation Details**:

- Imports: `EnvironmentProviders, makeEnvironmentProviders, APP_INITIALIZER, InjectionToken, inject`
- Export function signature: `provideLenis(config?: LenisServiceOptions): EnvironmentProviders`

---

**Batch 1 Verification**:

- [ ] `gsap-core.service.ts` exists with full implementation
- [ ] `providers/gsap.provider.ts` exists
- [ ] `providers/lenis.provider.ts` exists
- [ ] Build passes: `npx nx build angular-gsap`
- [ ] Types export correctly

---

## Batch 2: Refactor Library Consumers ⏸️ PENDING

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 1 complete

### Task 2.1: Refactor ScrollAnimationDirective ⏸️ PENDING

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\directives\scroll-animation.directive.ts`
**Spec Reference**: implementation-plan.md:192-205

**Quality Requirements**:

- Remove direct `import { gsap } from 'gsap'`
- Remove direct `import { ScrollTrigger } from 'gsap/ScrollTrigger'`
- Inject `GsapCoreService`
- Remove `gsap.registerPlugin(ScrollTrigger)` from constructor
- Access GSAP via `this.gsapCore.gsap` and `this.gsapCore.scrollTrigger`

---

### Task 2.2: Refactor HijackedScrollDirective ⏸️ PENDING

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\directives\hijacked-scroll.directive.ts`
**Spec Reference**: implementation-plan.md:192-205
**Dependencies**: Task 2.1

**Quality Requirements**:

- Same refactoring pattern as ScrollAnimationDirective

---

### Task 2.3: Refactor ParallaxSplitScrollComponent ⏸️ PENDING

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\components\parallax-split-scroll.component.ts`
**Spec Reference**: implementation-plan.md:192-205
**Dependencies**: Task 2.1

**Quality Requirements**:

- Same refactoring pattern as directives

---

### Task 2.4: Refactor LenisSmoothScrollService ⏸️ PENDING

**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\src\lib\services\lenis-smooth-scroll.service.ts`
**Spec Reference**: implementation-plan.md:187-190

**Quality Requirements**:

- Remove private gsap/ScrollTrigger properties (lines 76-78)
- Inject `GsapCoreService`
- Remove dynamic import for gsap (keep lenis dynamic import)
- Use `this.gsapCore.gsap` and `this.gsapCore.scrollTrigger`
- Keep all Lenis functionality working

---

**Batch 2 Verification**:

- [ ] All 4 files refactored
- [ ] No direct `import { gsap } from 'gsap'` in consumer files
- [ ] No `gsap.registerPlugin` calls except in GsapCoreService
- [ ] Build passes: `npx nx build angular-gsap`
- [ ] Tests pass: `npx nx test angular-gsap`

---

## Batch 3: Demo App & Exports ⏸️ PENDING

**Developer**: frontend-developer
**Tasks**: 1 | **Dependencies**: Batch 2 complete

### Task 3.1: Update Demo App & Public Exports ⏸️ PENDING

**Files**:

- `D:\projects\angular-3d-workspace\libs\angular-gsap\src\index.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.config.ts`
- `D:\projects\angular-3d-workspace\apps\angular-3d-demo\src\app\app.ts`

**Spec Reference**: implementation-plan.md:210-265

**Quality Requirements**:

**index.ts**:

- Export `provideGsap`, `GSAP_CONFIG`, `GsapConfig` from providers
- Export `provideLenis`, `LENIS_CONFIG` from providers
- Export `GsapCoreService` from services

**app.config.ts**:

- Import `provideGsap`, `provideLenis` from `@hive-academy/angular-gsap`
- Add `provideGsap({ defaults: { ease: 'power2.out', duration: 1 } })`
- Add `provideLenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 2, smoothWheel: true, useGsapTicker: true })`

**app.ts**:

- Remove `import { LenisSmoothScrollService }` (line 7)
- Remove `private readonly lenis = inject(LenisSmoothScrollService)` (line 22)
- Remove `afterNextRender` import (line 5) if no longer needed
- Remove constructor body (lines 24-33)

---

**Batch 3 Verification**:

- [ ] `index.ts` exports all new providers and services
- [ ] `app.config.ts` uses `provideGsap()` and `provideLenis()`
- [ ] `app.ts` has no Lenis initialization code
- [ ] Build passes: `npx nx build angular-gsap` and `npx nx build angular-3d-demo`
- [ ] Demo app works: `npx nx serve angular-3d-demo`
  - Smooth scroll active
  - Scroll animations work on `/angular-gsap` page
  - No console errors

---

## Summary

| Batch | Tasks | Focus                                     |
| :---- | :---- | :---------------------------------------- |
| 1     | 3     | Create core service + provider functions  |
| 2     | 4     | Refactor library consumers to use service |
| 3     | 1     | Update exports + demo app                 |
