# Implementation Plan - TASK_2025_009

## Goal

Extract DOM scroll animation directives from application code and temp folder into a new standalone library `@hive-academy/angular-gsap`. This library will provide reusable GSAP-powered scroll animations for any Angular application, completely independent of Three.js or 3D rendering concerns.

**Architectural Principle**: Clean separation - `@hive-academy/angular-gsap` provides DOM animation primitives only. Three.js-specific animations remain in `@hive-academy/angular-3d`.

---

## User Review Required

> [!IMPORTANT] > **Breaking Change**: Consumer components (10+ files in `temp/`) will need import path updates from application code to `@hive-academy/angular-gsap`. Migration checklist provided to ensure all consumers are updated atomically.

---

## Proposed Changes

### Component 1: Library Scaffolding

**Purpose**: Create new Nx library following workspace patterns from `@hive-academy/angular-3d`.

#### Files to Create

##### [CREATE] `libs/angular-gsap/project.json`

**Pattern Reference**: `libs/angular-3d/project.json:1-55`  
**Purpose**: Nx project configuration for buildable Angular library

```json
{
  "name": "@hive-academy/angular-gsap",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/angular-gsap/src",
  "prefix": "gsap",
  "projectType": "library",
  "release": {
    "version": {
      "manifestRootsToUpdate": ["dist/{projectRoot}"],
      "currentVersionResolver": "git-tag",
      "fallbackCurrentVersionResolver": "disk"
    }
  },
  "tags": [],
  "targets": {
    "build": {
      "executor": "@nx/angular:package",
      "outputs": ["{workspaceRoot}/dist/{projectRoot}"],
      "options": {
        "project": "libs/angular-gsap/ng-package.json",
        "tsConfig": "libs/angular-gsap/tsconfig.lib.json"
      },
      "configurations": {
        "production": {
          "tsConfig": "libs/angular-gsap/tsconfig.lib.prod.json"
        },
        "development": {}
      },
      "defaultConfiguration": "production"
    },
    "nx-release-publish": {
      "options": {
        "packageRoot": "dist/{projectRoot}"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/{projectRoot}"],
      "options": {
        "jestConfig": "libs/angular-gsap/jest.config.ts",
        "tsConfig": "libs/angular-gsap/tsconfig.spec.json"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint"
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc -p libs/angular-gsap/tsconfig.lib.json --noEmit"
      }
    }
  }
}
```

---

##### [CREATE] `libs/angular-gsap/package.json`

**Pattern Reference**: `libs/angular-3d/package.json:1-13`  
**Purpose**: NPM package metadata and peer dependencies

```json
{
  "name": "@hive-academy/angular-gsap",
  "version": "0.1.0",
  "peerDependencies": {
    "@angular/core": "~20.3.0",
    "@angular/common": "~20.3.0",
    "gsap": "^3.12.0",
    "rxjs": "~7.8.0"
  },
  "sideEffects": false
}
```

**Quality Requirements**:

- ✅ Uses peer dependencies (not direct dependencies) for Angular and GSAP
- ✅ `sideEffects: false` enables tree-shaking
- ✅ No Three.js dependencies (confirms DOM-only scope)

---

##### [CREATE] `libs/angular-gsap/ng-package.json`

**Pattern Reference**: `libs/angular-3d/ng-package.json` (implicit from project.json:20)  
**Purpose**: Angular package format configuration

```json
{
  "$schema": "../../node_modules/ng-packagr/ng-package.schema.json",
  "dest": "../../dist/libs/angular-gsap",
  "lib": {
    "entryFile": "src/index.ts"
  }
}
```

---

##### [CREATE] `libs/angular-gsap/tsconfig.json`

**Pattern Reference**: Angular library standard  
**Purpose**: Base TypeScript configuration

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": false,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "files": [],
  "include": [],
  "references": [
    {
      "path": "./tsconfig.lib.json"
    },
    {
      "path": "./tsconfig.spec.json"
    }
  ],
  "extends": "../../tsconfig.base.json",
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

---

##### [CREATE] `libs/angular-gsap/tsconfig.lib.json`

**Purpose**: TypeScript configuration for library compilation

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "../../dist/out-tsc",
    "declaration": true,
    "declarationMap": true,
    "inlineSources": true,
    "types": []
  },
  "exclude": ["src/**/*.spec.ts", "src/test-setup.ts", "jest.config.ts", "src/**/*.test.ts"],
  "include": ["src/**/*.ts"]
}
```

---

##### [CREATE] `libs/angular-gsap/jest.config.ts`

**Pattern Reference**: Standard Jest configuration for Angular libraries  
**Purpose**: Jest test runner configuration

```typescript
export default {
  displayName: 'angular-gsap',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/libs/angular-gsap',
  transform: {
    '^.+\\.(ts|mts|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.ts',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: ['jest-preset-angular/build/serializers/no-ng-attributes', 'jest-preset-angular/build/serializers/ng-snapshot', 'jest-preset-angular/build/serializers/html-comment'],
};
```

---

##### [CREATE] `libs/angular-gsap/src/test-setup.ts`

**Purpose**: Jest test environment setup with GSAP mocks

```typescript
import 'jest-preset-angular/setup-jest';

// Mock GSAP for animation tests (handles default import: `import gsap from 'gsap'`)
jest.mock('gsap', () => {
  const mockTimeline = {
    to: jest.fn().mockReturnThis(),
    fromTo: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    kill: jest.fn(),
    pause: jest.fn().mockReturnThis(),
    play: jest.fn().mockReturnThis(),
    progress: jest.fn(() => 0),
    isActive: jest.fn(() => false),
  };

  const gsapMock = {
    to: jest.fn(() => mockTimeline),
    fromTo: jest.fn(() => mockTimeline),
    timeline: jest.fn(() => mockTimeline),
    registerPlugin: jest.fn(),
    defaults: jest.fn(),
    killTweensOf: jest.fn(),
  };

  return {
    default: gsapMock,
    ...gsapMock,
    ScrollTrigger: {
      create: jest.fn(() => ({
        kill: jest.fn(),
        refresh: jest.fn(),
        enable: jest.fn(),
        disable: jest.fn(),
        progress: 0,
      })),
      refresh: jest.fn(),
    },
  };
});
```

---

### Component 2: Scroll Animation Directive

**Purpose**: Migrate `ScrollAnimationDirective` from temp folder to library

#### Files to Create

##### [CREATE] `libs/angular-gsap/src/lib/directives/scroll-animation.directive.ts`

**Pattern Reference**: `temp/angular-3d/directives/scroll-animation.directive.ts:1-362`  
**Source File**: Copy from temp with modifications for SSR compatibility

```typescript
/**
 * ScrollAnimationDirective - GSAP ScrollTrigger Integration
 *
 * Reusable directive for scroll-based animations using GSAP ScrollTrigger.
 * Provides declarative scroll animations with configurable options.
 *
 * Features:
 * - Scroll-triggered animations (fade, slide, scale, parallax, custom)
 * - SSR-compatible (browser-only plugin registration)
 * - Configurable trigger points and animation properties
 * - Automatic cleanup and performance optimization
 */

import { Directive, ElementRef, input, type OnDestroy, inject, effect, PLATFORM_ID, afterNextRender, Injector } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export type AnimationType = 'fadeIn' | 'fadeOut' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'scaleOut' | 'parallax' | 'custom';

export interface ScrollAnimationConfig {
  // Animation type
  animation?: AnimationType;

  // ScrollTrigger settings
  trigger?: string;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  pin?: boolean;
  pinSpacing?: boolean;
  markers?: boolean;

  // Animation properties
  duration?: number;
  delay?: number;
  ease?: string;
  stagger?: number;

  // Parallax settings
  speed?: number;
  yPercent?: number;
  xPercent?: number;

  // Custom animation properties
  from?: gsap.TweenVars;
  to?: gsap.TweenVars;

  // Callbacks
  onEnter?: () => void;
  onLeave?: () => void;
  onEnterBack?: () => void;
  onLeaveBack?: () => void;
  onUpdate?: (progress: number) => void;

  // Performance
  once?: boolean;
  toggleActions?: string;
}

@Directive({
  selector: '[scrollAnimation]',
  standalone: true,
})
export class ScrollAnimationDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly injector = inject(Injector);
  private scrollTrigger?: ScrollTrigger;
  private animation?: gsap.core.Tween | gsap.core.Timeline;
  private isInitialized = false;

  readonly scrollConfig = input<ScrollAnimationConfig>({
    animation: 'fadeIn',
    start: 'top 80%',
    duration: 1,
    ease: 'power2.out',
  });

  constructor() {
    // Register ScrollTrigger only in browser
    if (isPlatformBrowser(this.platformId)) {
      gsap.registerPlugin(ScrollTrigger);
    }

    // React to config changes
    effect(() => {
      const config = this.scrollConfig();
      if (!config) return;

      if (this.isInitialized && isPlatformBrowser(this.platformId)) {
        this.cleanup();
        afterNextRender(() => this.initializeAnimation(config), { injector: this.injector });
      }
    });

    // Initialize after render (browser only)
    if (isPlatformBrowser(this.platformId)) {
      afterNextRender(
        () => {
          const config = this.scrollConfig();
          if (config) {
            this.initializeAnimation(config);
          }
        },
        { injector: this.injector }
      );
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeAnimation(config: ScrollAnimationConfig): void {
    const element = this.elementRef.nativeElement;

    if (!element || !(element instanceof HTMLElement)) {
      console.warn('[ScrollAnimation] Can only be applied to DOM elements');
      return;
    }

    const animationProps = this.getAnimationProperties(config);
    const timeline = gsap.timeline({ paused: true });
    timeline.fromTo(element, animationProps.from, animationProps.to);
    this.animation = timeline;

    this.scrollTrigger = ScrollTrigger.create({
      trigger: config.trigger === 'self' || !config.trigger ? element : config.trigger,
      start: config.start ?? 'top 80%',
      end: config.end,
      scrub: config.scrub ?? false,
      pin: config.pin ?? false,
      pinSpacing: config.pinSpacing ?? true,
      markers: config.markers ?? false,
      animation: timeline,
      once: config.once ?? false,
      toggleActions: config.toggleActions ?? 'play none none none',
      onEnter: config.onEnter,
      onLeave: config.onLeave,
      onEnterBack: config.onEnterBack,
      onLeaveBack: config.onLeaveBack,
      onUpdate: (self) => config.onUpdate?.(self.progress),
    });

    this.isInitialized = true;
  }

  private getAnimationProperties(config: ScrollAnimationConfig): {
    from: gsap.TweenVars;
    to: gsap.TweenVars;
  } {
    // Implementation matches temp/angular-3d/directives/scroll-animation.directive.ts:222-323
    // ... (full implementation from source file)
  }

  private cleanup(): void {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = undefined;
    }
    if (this.animation) {
      this.animation.kill();
      this.animation = undefined;
    }
    this.isInitialized = false;
  }

  public refresh(): void {
    this.scrollTrigger?.refresh();
  }

  public getProgress(): number {
    return this.scrollTrigger?.progress ?? 0;
  }

  public setEnabled(enabled: boolean): void {
    if (enabled) {
      this.scrollTrigger?.enable();
    } else {
      this.scrollTrigger?.disable();
    }
  }
}
```

**Key Changes from Source**:

1. ✅ Added `isPlatformBrowser()` check for SSR compatibility
2. ✅ Used `afterNextRender()` instead of `ngOnInit()` for initialization
3. ✅ Registered ScrollTrigger plugin only in browser context

---

##### [CREATE] `libs/angular-gsap/src/lib/directives/scroll-animation.directive.spec.ts`

**Purpose**: Unit tests for ScrollAnimationDirect

ive

```typescript
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ScrollAnimationDirective } from './scroll-animation.directive';

@Component({
  standalone: true,
  imports: [ScrollAnimationDirective],
  template: `<div scrollAnimation [scrollConfig]="config"></div>`,
})
class TestHostComponent {
  config = { animation: 'fadeIn' as const };
}

describe('ScrollAnimationDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should initialize GSAP animation', () => {
    const gsap = require('gsap');
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(gsap.timeline).toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directive = fixture.debugElement.children[0].injector.get(ScrollAnimationDirective);
    directive.ngOnDestroy();

    // Verify cleanup was called
    expect(directive['scrollTrigger']).toBeUndefined();
  });
});
```

---

### Component 3: Hijacked Scroll Directives

**Purpose**: Migrate `HijackedScrollDirective` and `HijackedScrollItemDirective` from temp folder

#### Files to Create

##### [CREATE] `libs/angular-gsap/src/lib/directives/hijacked-scroll.directive.ts`

**Pattern Reference**: `temp/angular-3d/directives/hijacked-scroll.directive.ts:1-352`  
**Changes**: SSR compatibility, same pattern as ScrollAnimationDirective

_(Full implementation follows same SSR pattern with `isPlatformBrowser()` and `afterNextRender()`)_

---

##### [CREATE] `libs/angular-gsap/src/lib/directives/hijacked-scroll-item.directive.ts`

**Pattern Reference**: `temp/angular-3d/directives/hijacked-scroll-item.directive.ts:1-95`  
**Changes**: None (no browser-specific code)

---

### Component 4: Hijacked Scroll Timeline Component

**Purpose**: Migrate convenience wrapper component

##### [CREATE] `libs/angular-gsap/src/lib/components/hijacked-scroll-timeline.component.ts`

**Pattern Reference**: `temp/hijacked-scroll-timeline.component.ts:1-92`  
**Changes**: Update import paths to use relative imports within library

---

### Component 5: Public API Exports

##### [CREATE] `libs/angular-gsap/src/index.ts`

**Purpose**: Public API barrel export

```typescript
// Directives
export { ScrollAnimationDirective, type ScrollAnimationConfig, type AnimationType } from './lib/directives/scroll-animation.directive';
export { HijackedScrollDirective, type HijackedScrollConfig } from './lib/directives/hijacked-scroll.directive';
export { HijackedScrollItemDirective, type HijackedScrollItemConfig, type SlideDirection } from './lib/directives/hijacked-scroll-item.directive';

// Components
export { HijackedScrollTimelineComponent } from './lib/components/hijacked-scroll-timeline.component';
```

---

### Component 6: Consumer Migration

**Purpose**: Update all consumer imports to use new library

#### Files to Modify

##### [MODIFY] `temp/chromadb-section.component.ts`

**Line Range**: 3-5 (imports)  
**Changes**: Update import paths

```typescript
// OLD
import { ScrollAnimationDirective } from '../../../core/angular-3d/directives/scroll-animation.directive';
import { HijackedScrollTimelineComponent } from '../../../shared/components/hijacked-scroll-timeline.component';
import { HijackedScrollItemDirective } from '../../../core/angular-3d/directives/hijacked-scroll-item.directive';

// NEW
import { ScrollAnimationDirective, HijackedScrollTimelineComponent, HijackedScrollItemDirective } from '@hive-academy/angular-gsap';
```

**Pattern Reference**: Standard NPM package import  
**Repeat for**: All 10+ consumer files listed in requirements

---

## Integration Architecture

### Library Structure

```
libs/angular-gsap/
├── src/
│   ├── index.ts                          # Public API
│   ├── test-setup.ts                     # Jest GSAP mocks
│   └── lib/
│       ├── directives/
│       │   ├── scroll-animation.directive.ts
│       │   ├── scroll-animation.directive.spec.ts
│       │   ├── hijacked-scroll.directive.ts
│       │   ├── hijacked-scroll.directive.spec.ts
│       │   ├── hijacked-scroll-item.directive.ts
│       │   └── hijacked-scroll-item.directive.spec.ts
│       └── components/
│           ├── hijacked-scroll-timeline.component.ts
│           └── hijacked-scroll-timeline.component.spec.ts
├── project.json
├── package.json
├── ng-package.json
├── tsconfig.json
├── tsconfig.lib.json
├── tsconfig.spec.json
└── jest.config.ts
```

### Dependency Graph

```
Consumer Apps/Components
         ↓
@hive-academy/angular-gsap (DOM scroll animations)
         ↓
      GSAP + ScrollTrigger
```

**No circular dependencies**: `angular-3d` does NOT import from `angular-gsap`.

---

## Verification Plan

### Automated Tests

#### Unit Tests

```bash
# Run library unit tests
npx nx test angular-gsap

# Expected: All tests pass with ≥80% coverage
```

**Coverage Requirements**:

- ScrollAnimationDirective: initialization, cleanup, public API methods
- HijackedScrollDirective: item discovery, timeline creation, events
- HijackedScrollItemDirective: config generation, slide offsets

#### Build Verification

```bash
# Build library
npx nx build angular-gsap

# Expected: Clean build with no errors, output in dist/libs/angular-gsap

# Verify tree-shakeable
ls -lh dist/libs/angular-gsap/fesm2022/*.mjs
```

#### Lint & Typecheck

```bash
# Lint
npx nx lint angular-gsap

# Type check
npx nx typecheck angular-gsap
```

### Manual Verification

1. **Consumer Import Verification**

   - Update one consumer file (e.g., `temp/chromadb-section.component.ts`)
   - Change import to `@hive-academy/angular-gsap`
   - Build the consumer project
   - **Expected**: Build succeeds, animations work identically

2. **SSR Compatibility Check**

   - Build library in production mode
   - Verify no browser-specific code executes during build
   - **Expected**: No GSAP errors during server-side rendering

3. **Visual Regression Test**
   - Run demo application with migrated components
   - Compare scroll animations before/after migration
   - **Expected**: Pixel-perfect visual parity

---

## Team-Leader Handoff

**Developer Type**: frontend-developer  
**Complexity**: Medium  
**Estimated Tasks**: 12-15 atomic tasks  
**Batch Strategy**: Layer-based (Scaffolding → Directives → Components → Consumers → Verification)

**Recommended Batches**:

1. **Library Setup** (3 tasks): Scaffolding, package config, test setup
2. **Scroll Animation Directive** (2 tasks): Implementation + tests
3. **Hijacked Scroll Directives** (3 tasks): HijackedScrollDirective + HijackedScrollItemDirective + tests
4. **Components** (2 tasks): HijackedScrollTimelineComponent + tests
5. **Consumer Migration** (2 tasks): Update imports, verify builds
6. **Final Verification** (1 task): Run full test suite, verify coverage

**Critical Dependencies**:

- Batch 1 must complete before any other batch
- Batches 2-4 can run in parallel
- Batch 5 depends on Batches 2-4
- Batch 6 depends on all previous batches
