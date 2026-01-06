# Development Tasks - TASK_2026_005

**Total Tasks**: 10 | **Batches**: 4 | **Status**: 0/4 complete

---

## Plan Validation Summary

**Validation Status**: PASSED

### Assumptions Verified

- [x] LICENSE file missing at repo root - VERIFIED
- [x] CODE_OF_CONDUCT.md missing at repo root - VERIFIED
- [x] GitHub issue/PR templates missing - VERIFIED (.github has workflows but no templates)
- [x] Package.json metadata minimal - VERIFIED (both libs missing description, keywords, etc.)
- [x] angular-3d README incomplete - VERIFIED (145 lines, animation directives only)
- [x] angular-gsap README missing badges - VERIFIED (449 lines, no badge row)
- [x] Root README is Nx boilerplate - VERIFIED (159 lines)
- [x] CONTRIBUTING.md exists and is good - VERIFIED (196 lines, no changes needed)

### Risks Identified

| Risk                                    | Severity | Mitigation                                                     |
| --------------------------------------- | -------- | -------------------------------------------------------------- |
| GitHub repository URL unverified        | LOW      | Assumed `https://github.com/hive-academy/angular-3d-workspace` |
| npm badges won't render until published | LOW      | Expected - badges auto-populate after npm publish              |
| Live demo not deployed                  | LOW      | Use placeholder links                                          |

### Edge Cases to Handle

- [x] Preserve existing peerDependencies and sideEffects in package.json -> Task 2.1, 2.2
- [x] Emoji rendering consistency between GitHub and npm -> Use GitHub shortcodes
- [x] Markdown table rendering on npm vs GitHub -> Use standard CommonMark syntax

---

## Batch 1: Foundation Documents

**Developer**: frontend-developer
**Tasks**: 5 | **Dependencies**: None
**Status**: IN PROGRESS

### Task 1.1: Create LICENSE file

**Status**: IN PROGRESS
**File**: `D:\projects\angular-3d-workspace\LICENSE`
**Action**: CREATE
**Spec Reference**: implementation-plan.md:131-169

**Quality Requirements**:

- MIT License text from opensource.org
- Copyright year: 2026
- Copyright holder: "Hive Academy"
- UTF-8 encoding without BOM
- No trailing whitespace
- Ends with single newline

**Implementation Details**:

- Standard MIT license template
- Single file at repository root

---

### Task 1.2: Create CODE_OF_CONDUCT.md

**Status**: IN PROGRESS
**File**: `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md`
**Action**: CREATE
**Spec Reference**: implementation-plan.md:172-227

**Quality Requirements**:

- Contributor Covenant v2.1 text exactly
- Contact method: GitHub Issues link
- Attribution section present
- All standard sections complete

**Implementation Details**:

- Full Contributor Covenant v2.1 from https://www.contributor-covenant.org/version/2/1/code_of_conduct/
- Contact: `https://github.com/hive-academy/angular-3d-workspace/issues`

---

### Task 1.3: Create bug report issue template

**Status**: IN PROGRESS
**File**: `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md`
**Action**: CREATE (directory needs creation)
**Spec Reference**: implementation-plan.md:230-298

**Quality Requirements**:

- Valid YAML frontmatter
- Labels reference "bug"
- Environment section includes Angular version, library version, browser, OS
- Library selection (angular-3d / angular-gsap)
- Code sample section with TypeScript fence
- Reproduction section (StackBlitz or minimal code)

**Implementation Details**:

- Create `.github/ISSUE_TEMPLATE/` directory if needed
- YAML frontmatter with name, about, title, labels, assignees

---

### Task 1.4: Create feature request issue template

**Status**: IN PROGRESS
**File**: `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md`
**Action**: CREATE
**Spec Reference**: implementation-plan.md:301-358

**Quality Requirements**:

- Valid YAML frontmatter
- Labels reference "enhancement"
- Library selection checkboxes (angular-3d, angular-gsap, Both)
- Proposed solution with TypeScript code example section

**Implementation Details**:

- Problem Statement, Proposed Solution, Alternatives Considered, Use Case sections

---

### Task 1.5: Create pull request template

**Status**: IN PROGRESS
**File**: `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`
**Action**: CREATE
**Spec Reference**: implementation-plan.md:361-416

**Quality Requirements**:

- Type of Change checkboxes (Bug fix, New feature, Breaking change, Documentation, Refactoring, Performance, Test)
- Library Affected checkboxes (angular-3d, angular-gsap, Demo app, Documentation only)
- Checklist references actual validation command (`npx nx run-many -t lint test typecheck build`)
- Conventional commit link to CONTRIBUTING.md
- Breaking Changes section included

**Implementation Details**:

- Description, Type of Change, Related Issue, Library Affected, Checklist, Screenshots, Breaking Changes sections

---

**Batch 1 Verification**:

- [ ] All 5 files exist at specified paths
- [ ] LICENSE file is valid MIT format
- [ ] CODE_OF_CONDUCT.md uses Contributor Covenant v2.1
- [ ] Issue templates have valid YAML frontmatter
- [ ] PR template references correct validation command
- [ ] Git commit: `docs(docs): add foundation open source documents`

---

## Batch 2: Package.json Metadata

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: None (can run parallel with Batch 1)
**Status**: PENDING

### Task 2.1: Update angular-3d package.json

**Status**: PENDING
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\package.json`
**Action**: MODIFY
**Spec Reference**: implementation-plan.md:419-501

**Quality Requirements**:

- Preserve ALL existing peerDependencies exactly
- Preserve sideEffects: false
- Description under 250 characters
- Exactly 15 keywords (npm best practice)
- Keywords lowercase and unique
- Repository URL: `git+https://github.com/hive-academy/angular-3d-workspace.git`
- Directory field: `libs/angular-3d`

**Implementation Details**:

- Add: description, keywords (15), homepage, bugs, repository, license, author
- Keep: name, version, peerDependencies, sideEffects

**Current peerDependencies to preserve**:

```json
{
  "@angular/core": "~20.3.0",
  "@angular/common": "~20.3.0",
  "three": "^0.182.0",
  "three-stdlib": "^2.35.0",
  "gsap": "^3.14.2",
  "rxjs": "~7.8.0",
  "maath": "^0.10.8",
  "troika-three-text": "^0.52.4"
}
```

---

### Task 2.2: Update angular-gsap package.json

**Status**: PENDING
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json`
**Action**: MODIFY
**Spec Reference**: implementation-plan.md:504-575

**Quality Requirements**:

- Preserve ALL existing peerDependencies exactly
- Preserve sideEffects: false
- Description under 250 characters
- Exactly 15 keywords
- Keywords lowercase and unique
- Directory field: `libs/angular-gsap`

**Implementation Details**:

- Add: description, keywords (15), homepage, bugs, repository, license, author
- Keep: name, version, peerDependencies, sideEffects

**Current peerDependencies to preserve**:

```json
{
  "@angular/common": "^20.3.0",
  "@angular/core": "^20.3.0",
  "gsap": "^3.12.0",
  "lenis": "^1.3.16"
}
```

---

**Batch 2 Verification**:

- [ ] Both package.json files have valid JSON syntax
- [ ] peerDependencies unchanged in both
- [ ] sideEffects: false preserved in both
- [ ] Description under 250 characters in both
- [ ] 15 keywords each, lowercase
- [ ] Repository URLs valid
- [ ] Git commit: `docs(deps): add npm package metadata`

---

## Batch 3: angular-3d README Expansion

**Developer**: frontend-developer
**Tasks**: 1 (major task) | **Dependencies**: Batch 1 (LICENSE needed for badge link)
**Status**: PENDING

### Task 3.1: Complete angular-3d README rewrite

**Status**: PENDING
**File**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
**Action**: REWRITE
**Spec Reference**: implementation-plan.md:578-908
**API Reference**: api-inventory.md (44 components, 19 directives, 14 services)

**Quality Requirements**:

- Target length: 600-800 lines (comprehensive coverage)
- All 44 components documented in tables
- All 19 directives documented
- 14 services mentioned
- Badge URLs correct format
- 3+ Quick Start examples (copy-paste ready)
- Emoji usage matches angular-gsap pattern
- Section order matches angular-gsap
- All code examples use standalone: true
- Tables render correctly on GitHub and npm

**Required Sections** (exact order):

1. Header with badges (npm version, MIT license)
2. Features section (emoji bullets)
3. Scope callout (link to angular-gsap)
4. Installation section (peer dependencies table)
5. Quick Start (3 examples: Basic Scene, Scene with Lighting, Animated Scene)
6. API Reference - Scene Container
7. API Reference - Primitives Table (6 geometry + others)
8. API Reference - Lights Table (5 lights)
9. API Reference - Text Components Table (7)
10. API Reference - Space-Themed Table (5)
11. API Reference - Particle Systems Table (5)
12. API Reference - Visual Effects Table (7)
13. API Reference - Scene Organization Table (5)
14. API Reference - Loaders Table (2)
15. API Reference - Postprocessing Table (8)
16. API Reference - Directives (Animation, Core, Geometry, Material, Light, Interaction, Effect, Positioning)
17. API Reference - Services Table (14)
18. Configuration section
19. SSR Compatibility section
20. Live Demo section (placeholder)
21. Resources section
22. Contributing section (link to CONTRIBUTING.md)
23. License section
24. Related Packages section (link to angular-gsap)

**Implementation Details**:

- Must document ALL 44 components from api-inventory.md
- Must document ALL 19 directives from api-inventory.md
- Must mention TSL shader utilities (30+)
- Use tables for component listings
- Match angular-gsap emoji pattern (sparkles, dart, movie_camera, package, etc.)

---

**Batch 3 Verification**:

- [ ] README has 600-800 lines
- [ ] All 44 components documented
- [ ] All 19 directives documented
- [ ] 14 services mentioned
- [ ] Badge URLs render correctly
- [ ] All code examples are valid TypeScript
- [ ] Markdown preview looks correct
- [ ] Git commit: `docs(angular-3d): complete comprehensive README documentation`

---

## Batch 4: angular-gsap + Root README

**Developer**: frontend-developer
**Tasks**: 2 | **Dependencies**: Batch 3 (consistency verification)
**Status**: PENDING

### Task 4.1: Update angular-gsap README

**Status**: PENDING
**File**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`
**Action**: MODIFY (additions only)
**Spec Reference**: implementation-plan.md:911-955
**API Reference**: api-inventory.md (7 components, 22 directives, 4 services/providers)

**Quality Requirements**:

- Add badge row after title (npm version, MIT license)
- Add Live Demo section before Resources
- Preserve ALL existing content (no regressions)
- Document NEW components/directives not in current README:
  - ScrollTimeline, StepIndicator, ParallaxSplitScroll, SplitPanelSection, FeatureShowcaseTimeline, FeatureStep (components)
  - ScrollSectionPin, SectionSticky, ParallaxSplitItem, LenisSmoothScroll (directives)
  - 11 Content Projection directives
  - GsapCoreService, LenisSmoothScrollService (services)
  - provideGsap(), provideLenis() (providers)

**Implementation Details**:

- Insert badge row at line 2 (after title)
- Insert Live Demo section around line 426 (before Resources)
- Add new API sections for undocumented components/directives
- LICENSE link path: `../../LICENSE`

---

### Task 4.2: Transform root README

**Status**: PENDING
**File**: `D:\projects\angular-3d-workspace\README.md`
**Action**: REWRITE
**Spec Reference**: implementation-plan.md:958-1122

**Quality Requirements**:

- Remove ALL Nx boilerplate and promotional content
- Focus on libraries, not workspace tooling
- Target length: 150-200 lines
- Both libraries prominently featured with npm badges
- Quick install sections for both libraries
- Code examples for both libraries
- Preserve publishing documentation (condensed, link to CONTRIBUTING.md)
- Links to library READMEs work

**Required Sections**:

1. Header with license badge
2. Libraries Overview table (both libraries with npm badges)
3. Quick Install (3D graphics + Scroll animations)
4. Code examples for each library
5. Live Demo section (placeholder)
6. Documentation links
7. Development section (Prerequisites, Setup, Commands)
8. Publishing section (condensed, link to CONTRIBUTING.md)
9. License section
10. Contributing section
11. Links section

**Implementation Details**:

- Remove Nx logo, "shiny workspace" text, Nx Cloud link
- Remove "Add new projects", "Install Nx Console", "Useful links" sections
- Keep publishing info but condense it
- Add professional badges and library comparison table

---

**Batch 4 Verification**:

- [ ] angular-gsap README has badge row
- [ ] angular-gsap README has Live Demo section
- [ ] angular-gsap README documents new components/directives
- [ ] Root README is library-focused
- [ ] No Nx boilerplate in root README
- [ ] All internal links work
- [ ] Consistent emoji usage across all READMEs
- [ ] Git commit: `docs(docs): finalize angular-gsap and root README documentation`

---

## Summary

| Batch                               | Tasks  | Est. Time       | Developer          | Status  |
| ----------------------------------- | ------ | --------------- | ------------------ | ------- |
| Batch 1: Foundation Documents       | 5      | 1.5 hours       | frontend-developer | PENDING |
| Batch 2: Package.json Metadata      | 2      | 30 min          | frontend-developer | PENDING |
| Batch 3: angular-3d README          | 1      | 5-6 hours       | frontend-developer | PENDING |
| Batch 4: angular-gsap + Root README | 2      | 3-4 hours       | frontend-developer | PENDING |
| **Total**                           | **10** | **10-12 hours** |                    |         |

---

## Files Summary

**CREATE (6 files)**:

- `D:\projects\angular-3d-workspace\LICENSE`
- `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md`
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md`
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md`
- `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`

**MODIFY (4 files)**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\package.json`
- `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json`
- `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`

**REWRITE (2 files)**:

- `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`
- `D:\projects\angular-3d-workspace\README.md`

---

**Document Version**: 1.0
**Created**: 2026-01-06
**Status**: Ready for Batch 1 Assignment
