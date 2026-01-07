# Development Tasks - TASK_2026_005 (Fix Phase)

**Total Tasks**: 12 | **Batches**: 3 | **Status**: 3/3 implemented (pending commit)

---

## Fix Phase Summary

This tasks file addresses critical documentation gaps identified in QA review:

- **Code Logic Review Score**: 4/10 (NEEDS_REVISION)
- **Code Style Review Score**: 6/10 (NEEDS_REVISION)

**Root Cause**: CLAUDE.md files and READMEs contain outdated structure/API information that doesn't match actual codebase exports.

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- [x] CLAUDE.md structure sections are stale - VERIFIED (paths don't match filesystem)
- [x] Public API sections show non-existent exports - VERIFIED (Text3dComponent, etc.)
- [x] Component counts in root README are wrong - VERIFIED (44 vs 54 components)
- [x] angular-gsap missing 80% of API documentation - VERIFIED (19 directives, only 5 documented)
- [x] PR template has broken link - VERIFIED (./CONTRIBUTING.md should be ../CONTRIBUTING.md)
- [x] LICENSE badge URLs use relative paths that break on npm - VERIFIED

### Risks Identified

| Risk                                          | Severity | Mitigation                                     |
| --------------------------------------------- | -------- | ---------------------------------------------- |
| Large CLAUDE.md rewrites may miss items       | MEDIUM   | Use implementation-plan-fixes.md exact content |
| New components may have been added since plan | LOW      | Verified against actual filesystem             |

---

## Batch 1: P0 Critical Fixes (CLAUDE.md + PR Template + Root README)

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: None
**Status**: COMPLETE
**Commit**: ec11fee

### Task 1.1: Rewrite libs/angular-3d/CLAUDE.md Structure and Public API sections

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md`
**Action**: MODIFY (replace lines 23-77 for Structure, lines 212-239 for Public API)
**Spec Reference**: implementation-plan-fixes.md:46-346

**Quality Requirements**:

- Structure section must match actual filesystem structure
- List all 54 components, 24 directives, 14 services
- Include shaders/, backgrounds/, metaball/ directories
- Public API must show actual exports from index.ts
- Include TSL shader function exports

**Implementation Details**:

- Replace lines 23-77 with new Structure section from implementation-plan-fixes.md:47-199
- Replace lines 212-239 with new Public API section from implementation-plan-fixes.md:204-345
- Ensure all paths match actual filesystem

---

### Task 1.2: Rewrite libs/angular-gsap/CLAUDE.md Structure and Public API sections

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\CLAUDE.md`
**Action**: MODIFY (replace lines 22-34 for Structure, lines 222-245 for Public API)
**Spec Reference**: implementation-plan-fixes.md:361-486

**Quality Requirements**:

- Structure must show all directories: scroll/, components/, services/, providers/
- Include feature-showcase/ and split-panel/ subdirectories
- List all 7 components, 19 directives, 2 services, 2 providers
- Public API must match actual index.ts exports

**Implementation Details**:

- Replace lines 22-34 with new Structure section from implementation-plan-fixes.md:363-399
- Replace lines 222-245 with new Public API section from implementation-plan-fixes.md:404-485

---

### Task 1.3: Fix root README.md component counts and code examples

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:490-546

**Quality Requirements**:

- Change "44 components, 19 directives, 14 services" to "54 components, 24 directives, 14 services"
- Change "7 components, 22 directives" to "7 components, 19 directives, 2 services, 2 providers"
- Add `standalone: true` and `imports` to both code examples
- Change LICENSE link from relative `(LICENSE)` to absolute GitHub URL

**Implementation Details**:

- Line 18: Update angular-3d counts
- Line 19: Update angular-gsap counts
- Lines 31-41: Add standalone: true and imports to 3D Graphics example
- Lines 49-55: Add standalone: true and imports to Scroll Animation example
- Line 3: Fix LICENSE URL to absolute GitHub path

---

### Task 1.4: Fix .github/PULL_REQUEST_TEMPLATE.md broken link

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:549-556

**Quality Requirements**:

- Fix relative path from `./CONTRIBUTING.md` to `../CONTRIBUTING.md`

**Implementation Details**:

- Line 33: Change `[conventional commit format](./CONTRIBUTING.md)` to `[conventional commit format](../CONTRIBUTING.md)`

---

**Batch 1 Verification**:

- [x] libs/angular-3d/CLAUDE.md Structure section matches filesystem
- [x] libs/angular-3d/CLAUDE.md Public API matches index.ts exports
- [x] libs/angular-gsap/CLAUDE.md Structure includes all directories
- [x] libs/angular-gsap/CLAUDE.md Public API matches index.ts exports
- [x] Root README has correct component counts
- [x] Root README code examples have standalone: true
- [x] PR template link resolves correctly
- [x] Git commit: ec11fee - `docs(docs): fix critical documentation accuracy issues`

---

## Batch 2: P1 angular-3d README Enhancements

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 1 (CLAUDE.md provides reference)
**Status**: COMPLETE
**Commit**: 4277570

### Task 2.1: Fix LICENSE badge URL in angular-3d README

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:564-565

**Quality Requirements**:

- Change LICENSE badge URL from relative `(../../LICENSE)` to absolute GitHub URL
- URL must work on both GitHub and npm

**Implementation Details**:

- Line 3 (or badge line): Change to `https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE`

---

### Task 2.2: Update component count in angular-3d README

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:567

**Quality Requirements**:

- Update "44 Components" to "54 Components" in Features section

**Implementation Details**:

- Line 14: Change count from 44 to 54

---

### Task 2.3: Add missing components to angular-3d README

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:569-587

**Quality Requirements**:

- Add ThrusterFlameComponent to Visual Effects table
- Add new Backgrounds section with HexagonalBackgroundInstancedComponent
- Add MetaballComponent deprecation notice

**Implementation Details**:

- After Visual Effects table (around line 252): Add ThrusterFlameComponent row
- After Visual Effects section: Add new "### Backgrounds" section
- Add deprecation notice for MetaballComponent

**Content to Add**:

Visual Effects table addition:

```markdown
| ThrusterFlameComponent | `<a3d-thruster-flame>` | Thruster/rocket flame effect |
```

New Backgrounds section:

```markdown
### Backgrounds

| Component                             | Selector                               | Description                        |
| ------------------------------------- | -------------------------------------- | ---------------------------------- |
| HexagonalBackgroundInstancedComponent | `<a3d-hexagonal-background-instanced>` | GPU-instanced hexagonal background |
```

Deprecation notice:

```markdown
> **Note**: `MetaballComponent` (`<a3d-metaball>`) is deprecated. Use the compositional API with `MetaballSceneComponent`, `MetaballSphereComponent`, and `MetaballCursorComponent` instead.
```

---

### Task 2.4: Add Directives Reference and Services sections to angular-3d README

**Status**: COMPLETE
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:589-671

**Quality Requirements**:

- Add comprehensive Directives Reference section documenting all 24 directives
- Add Services Reference section documenting all 14 services
- Include Injectable Functions subsection

**Implementation Details**:

- Add after Animation Directives section
- Include tables for: Core Directives (3), Geometry Directives (5), Material Directives (3), Light Directives (5), Effect Directives (1), Positioning Directives (1)
- Add Services table with all 14 services
- Add Injectable Functions table

**Content from implementation-plan-fixes.md:592-671**

---

**Batch 2 Verification**:

- [x] LICENSE badge URL is absolute GitHub URL
- [x] Component count shows 54, not 44
- [x] ThrusterFlameComponent in Visual Effects table
- [x] Backgrounds section exists with HexagonalBackgroundInstancedComponent
- [x] MetaballComponent deprecation notice present
- [x] All 24 directives documented in Directives Reference
- [x] All 14 services documented in Services Reference
- [x] Git commit: 4277570 - `docs(angular-3d): complete comprehensive README documentation`

---

## Batch 3: P1 angular-gsap README Enhancements

**Developer**: frontend-developer
**Tasks**: 4 | **Dependencies**: Batch 1 (CLAUDE.md provides reference)
**Status**: IMPLEMENTED

### Task 3.1: Fix LICENSE badge URL in angular-gsap README

**Status**: IMPLEMENTED
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:679

**Quality Requirements**:

- Change LICENSE badge URL from relative `(../../LICENSE)` to absolute GitHub URL

**Implementation Details**:

- Line 3 (or badge line): Change to `https://github.com/hive-academy/angular-3d-workspace/blob/main/LICENSE`

---

### Task 3.2: Convert peer dependencies to table format

**Status**: IMPLEMENTED
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:681-692

**Quality Requirements**:

- Convert bullet list peer dependencies to table format
- Match angular-3d README table style

**Implementation Details**:

- Lines 32-38: Replace bullet list with table

**New Content**:

```markdown
**Peer Dependencies**:

| Package           | Version | Purpose                      |
| ----------------- | ------- | ---------------------------- |
| `@angular/core`   | ~20.3.0 | Angular framework            |
| `@angular/common` | ~20.3.0 | Angular common utilities     |
| `gsap`            | ^3.14.2 | GreenSock Animation Platform |
| `lenis`           | ^1.3.16 | Smooth scroll library        |
```

---

### Task 3.3: Add missing components to angular-gsap README

**Status**: IMPLEMENTED
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:694-798

**Quality Requirements**:

- Add ScrollTimelineComponent documentation
- Add StepIndicatorComponent documentation
- Add Feature Showcase Components section (FeatureShowcaseTimelineComponent, FeatureStepComponent)
- Add Split Panel Components section (SplitPanelSectionComponent)
- Add ParallaxSplitScrollComponent documentation

**Implementation Details**:

- Add after HijackedScrollTimelineComponent section (around line 314)
- Include code examples for FeatureShowcaseTimeline and SplitPanelSection

**Content from implementation-plan-fixes.md:697-798**

---

### Task 3.4: Add Directives Reference, Services, and Providers sections to angular-gsap README

**Status**: IMPLEMENTED
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
**Action**: MODIFY
**Spec Reference**: implementation-plan-fixes.md:800-990

**Quality Requirements**:

- Add Directives Reference section with all 19 directives in tables
- Add Services section with GsapCoreService and LenisSmoothScrollService
- Add Configuration Providers section with provideGsap() and provideLenis()
- Add Contributing section with links to CONTRIBUTING.md and CODE_OF_CONDUCT.md

**Implementation Details**:

- Add at end of API documentation section
- Include tables for: Scroll Directives (4), Other Directives (4), Feature Showcase Directives (6), Split Panel Directives (5)
- Add Services section with code examples
- Add Providers section with configuration examples
- Add Contributing links section

**Content from implementation-plan-fixes.md:803-990**

---

**Batch 3 Verification**:

- [x] LICENSE badge URL is absolute GitHub URL
- [x] Peer dependencies in table format matching angular-3d style
- [x] ScrollTimelineComponent documented
- [x] StepIndicatorComponent documented
- [x] Feature Showcase Components section complete with examples
- [x] Split Panel Components section complete with examples
- [x] All 19 directives documented in Directives Reference
- [x] GsapCoreService and LenisSmoothScrollService documented
- [x] provideGsap() and provideLenis() documented with examples
- [x] Contributing section has links to CONTRIBUTING.md and CODE_OF_CONDUCT.md
- [ ] Git commit: `docs(angular-gsap): add missing components, directives, services, and providers documentation`

---

## Summary

| Batch                    | Tasks  | Priority | Focus                                                         | Status      |
| ------------------------ | ------ | -------- | ------------------------------------------------------------- | ----------- |
| Batch 1: P0 Critical     | 4      | CRITICAL | CLAUDE.md files, PR template, root README                     | COMPLETE    |
| Batch 2: P1 angular-3d   | 4      | HIGH     | Missing components, directives, services in README            | COMPLETE    |
| Batch 3: P1 angular-gsap | 4      | HIGH     | Missing components, directives, services, providers in README | IMPLEMENTED |
| **Total**                | **12** |          |                                                               |             |

---

## Files Summary

**MODIFY (6 files)**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\CLAUDE.md`
- `D:\projects\angular-3d-workspace\libs\angular-gsap\CLAUDE.md`
- `D:\projects\angular-3d-workspace\README.md`
- `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`
- `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
- `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`

---

**Document Version**: 1.0
**Created**: 2026-01-07
**Status**: Ready for Batch 1 Assignment
