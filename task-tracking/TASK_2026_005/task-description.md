# Requirements Document - TASK_2026_005

## Open Source Release Readiness for Angular 3D Libraries

### Introduction

This document defines comprehensive requirements for preparing `@hive-academy/angular-3d` and `@hive-academy/angular-gsap` libraries for their first public npm release. The libraries provide Angular developers with declarative Three.js 3D graphics and GSAP scroll animation capabilities respectively.

**Business Context**: These libraries represent significant development investment and address real gaps in the Angular ecosystem. A professional, well-documented release will maximize adoption, establish credibility in the open-source community, and create a foundation for community contributions.

**Current State Assessment**:

| Asset                             | Status     | Action Required                                           |
| --------------------------------- | ---------- | --------------------------------------------------------- |
| @hive-academy/angular-gsap README | GOOD       | Add badges, polish consistency                            |
| @hive-academy/angular-3d README   | INCOMPLETE | Major expansion needed                                    |
| LICENSE file                      | MISSING    | CRITICAL - must exist before npm publish                  |
| CODE_OF_CONDUCT.md                | MISSING    | Required for community trust                              |
| Package.json metadata             | MINIMAL    | Missing description, keywords, homepage, bugs, repository |
| GitHub templates                  | MISSING    | Needed for structured issue/PR management                 |
| Root README                       | NX DEFAULT | Transform to library-focused presentation                 |
| CONTRIBUTING.md                   | GOOD       | Minor polish only                                         |

---

## Requirements

---

### Requirement 1: LICENSE File Creation

**User Story:** As an open source consumer evaluating libraries, I want to see a clear LICENSE file in the repository, so that I can verify the library is legally safe to use in my projects.

**Priority**: CRITICAL (Release Blocker)

**File Path**: `D:\projects\angular-3d-workspace\LICENSE`

#### Acceptance Criteria

1. WHEN a user visits the repository root THEN a LICENSE file SHALL be visible containing the full MIT license text
2. WHEN the LICENSE file is read THEN the copyright notice SHALL include:
   - Current year (2026)
   - Copyright holder name: "Hive Academy"
3. WHEN npm packages are published THEN the LICENSE file SHALL be included in the distributed package
4. WHEN GitHub repository page loads THEN the license badge in the sidebar SHALL correctly identify "MIT License"

#### Content Requirements

- Full MIT license text (standard template from opensource.org)
- Copyright line format: `Copyright (c) 2026 Hive Academy`
- No modifications to standard MIT license terms

#### Quality Criteria

- File uses UTF-8 encoding without BOM
- No trailing whitespace
- Ends with single newline

---

### Requirement 2: Complete @hive-academy/angular-3d README

**User Story:** As an Angular developer discovering this library on npm, I want comprehensive documentation showing all features and how to use them, so that I can quickly evaluate if this library meets my needs and get started without external documentation.

**Priority**: CRITICAL (Release Blocker)

**File Path**: `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`

#### Acceptance Criteria

1. WHEN a developer reads the README THEN they SHALL understand all library capabilities within 2 minutes
2. WHEN a developer follows the Quick Start example THEN they SHALL have a working 3D scene with a visible object in under 5 minutes
3. WHEN comparing to angular-gsap README THEN structural consistency SHALL be maintained (same section ordering, formatting style)
4. WHEN viewing on npm THEN all badges SHALL render correctly and links SHALL be functional

#### Required Sections

**Section 1: Header with Badges**

- npm version badge: `[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-3d.svg)](https://www.npmjs.com/package/@hive-academy/angular-3d)`
- License badge: `[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)`
- Build status badge (placeholder until CI provides URL)
- Title with tagline matching angular-gsap style

**Section 2: Features (matching angular-gsap format)**

Must document:

- Declarative API with Angular signals
- Scene container with automatic renderer/camera setup
- 12+ primitive components (Box, Cylinder, Torus, Polyhedron, Planet, StarField, Nebula, Text3D, GltfModel, ParticleSystem, Group, Fog, SvgIcon)
- 5 light components (Ambient, Directional, Point, Spot, SceneLighting)
- Animation directives (Float3d, Rotate3d)
- Orbit controls
- Asset loaders (GLTF, Textures)
- Postprocessing effects (Bloom, EffectComposer)
- SSR compatible
- Tree-shakeable
- TypeScript first with full type safety

**Section 3: Installation**

- npm install command with all peer dependencies
- Peer dependencies table with version requirements
- Note about GSAP peer dependency (used internally for animations)

**Section 4: Quick Start**

Minimal working example showing:

```typescript
import { Scene3dComponent, BoxComponent } from '@hive-academy/angular-3d';

@Component({
  standalone: true,
  imports: [Scene3dComponent, BoxComponent],
  template: `
    <a3d-scene [cameraPosition]="[0, 0, 5]">
      <a3d-box [position]="[0, 0, 0]" [color]="'#ff6b6b'" />
    </a3d-scene>
  `,
})
export class MySceneComponent {}
```

**Section 5: Available Components Table**

| Component               | Selector                | Description                                      |
| ----------------------- | ----------------------- | ------------------------------------------------ |
| Scene3dComponent        | `<a3d-scene>`           | Root container with WebGLRenderer, Scene, Camera |
| BoxComponent            | `<a3d-box>`             | Box/cube primitive                               |
| CylinderComponent       | `<a3d-cylinder>`        | Cylinder primitive                               |
| TorusComponent          | `<a3d-torus>`           | Torus/donut primitive                            |
| PolyhedronComponent     | `<a3d-polyhedron>`      | Platonic solids                                  |
| PlanetComponent         | `<a3d-planet>`          | Planet with atmosphere                           |
| StarFieldComponent      | `<a3d-star-field>`      | Particle-based star background                   |
| NebulaComponent         | `<a3d-nebula>`          | Volumetric nebula effect                         |
| Text3dComponent         | `<a3d-text-3d>`         | 3D text with Troika                              |
| GltfModelComponent      | `<a3d-gltf-model>`      | GLTF/GLB model loader                            |
| ParticleSystemComponent | `<a3d-particle-system>` | Configurable particles                           |
| GroupComponent          | `<a3d-group>`           | Object3D container                               |
| FogComponent            | `<a3d-fog>`             | Scene fog effect                                 |
| SvgIconComponent        | `<a3d-svg-icon>`        | SVG as 3D object                                 |

**Section 6: Lights Table**

| Component                 | Selector                  | Description           |
| ------------------------- | ------------------------- | --------------------- |
| AmbientLightComponent     | `<a3d-ambient-light>`     | Ambient illumination  |
| DirectionalLightComponent | `<a3d-directional-light>` | Sun-like directional  |
| PointLightComponent       | `<a3d-point-light>`       | Omnidirectional point |
| SpotLightComponent        | `<a3d-spot-light>`        | Focused spotlight     |
| SceneLightingComponent    | `<a3d-scene-lighting>`    | Preset lighting rig   |

**Section 7: Animation Directives**

Retain and polish existing Float3dDirective and Rotate3dDirective documentation.

**Section 8: Controls**

- OrbitControlsComponent usage
- Configuration options

**Section 9: Postprocessing**

- EffectComposerComponent
- BloomEffectComponent
- How to chain effects

**Section 10: Configuration Examples**

- Scene with custom camera settings
- Scene with custom renderer settings
- Multiple objects with materials
- Using GLTF models

**Section 11: SSR Compatibility**

```typescript
// Library handles SSR automatically
// Uses afterNextRender() for browser-only initialization
// No hydration mismatches
```

**Section 12: Live Demo Link**

- Placeholder: `[Live Demo](https://hive-academy.github.io/angular-3d-workspace)` (or StackBlitz when available)

**Section 13: Resources**

- Three.js Documentation link
- Angular Documentation link

**Section 14: Contributing**

- Link to CONTRIBUTING.md

**Section 15: License**

- "MIT (c) Hive Academy"
- Link to LICENSE file

**Section 16: Related Packages**

- Link to @hive-academy/angular-gsap

#### Quality Criteria

- README length: 350-500 lines (matching angular-gsap depth)
- All code examples are copy-paste ready and tested
- Consistent emoji usage matching angular-gsap
- Proper markdown heading hierarchy (no skipped levels)
- All links are valid
- Tables render correctly on npm and GitHub

---

### Requirement 3: Polish @hive-academy/angular-gsap README

**User Story:** As a user comparing the two libraries, I want consistent presentation and complete information, so that I perceive them as professional, cohesive products from the same team.

**Priority**: HIGH

**File Path**: `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`

#### Acceptance Criteria

1. WHEN the README header is viewed THEN badge row SHALL be present with npm version, license, and build status badges
2. WHEN Live Demo section is present THEN placeholder link SHALL be provided
3. WHEN comparing to angular-3d README THEN structural parity SHALL be maintained

#### Required Changes

1. Add badge row after title:

```markdown
[![npm version](https://img.shields.io/npm/v/@hive-academy/angular-gsap.svg)](https://www.npmjs.com/package/@hive-academy/angular-gsap)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
```

2. Add Live Demo section (placeholder):

```markdown
## Live Demo

[View Demo](https://hive-academy.github.io/angular-3d-workspace) | [StackBlitz](https://stackblitz.com/edit/angular-gsap-starter)
```

3. Verify Related Packages section links correctly to angular-3d

#### Quality Criteria

- Badge images load correctly
- Existing content preserved (no regressions)
- Consistent formatting with angular-3d README

---

### Requirement 4: Package.json Metadata Enhancement

**User Story:** As a developer searching npm for Angular Three.js libraries, I want the package to appear in search results with a compelling description, so that I can discover these libraries when searching for relevant keywords.

**Priority**: HIGH

#### Acceptance Criteria - @hive-academy/angular-3d

**File Path**: `D:\projects\angular-3d-workspace\libs\angular-3d\package.json`

1. WHEN searching npm for "angular three.js" THEN @hive-academy/angular-3d SHALL appear in results
2. WHEN viewing package on npm THEN description SHALL clearly explain the library purpose
3. WHEN clicking homepage/bugs/repository links THEN correct GitHub pages SHALL open

**Required Fields**:

```json
{
  "name": "@hive-academy/angular-3d",
  "version": "0.0.1",
  "description": "Declarative Three.js components for Angular - Build stunning 3D experiences with familiar Angular patterns",
  "keywords": [
    "angular",
    "three.js",
    "threejs",
    "3d",
    "webgl",
    "webgpu",
    "angular-library",
    "declarative",
    "components",
    "graphics",
    "visualization",
    "3d-graphics",
    "angular-threejs",
    "scene",
    "renderer"
  ],
  "homepage": "https://github.com/hive-academy/angular-3d-workspace#readme",
  "bugs": {
    "url": "https://github.com/hive-academy/angular-3d-workspace/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hive-academy/angular-3d-workspace.git",
    "directory": "libs/angular-3d"
  },
  "license": "MIT",
  "author": "Hive Academy",
  "peerDependencies": { ... },
  "sideEffects": false
}
```

#### Acceptance Criteria - @hive-academy/angular-gsap

**File Path**: `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json`

1. WHEN searching npm for "angular gsap scroll" THEN @hive-academy/angular-gsap SHALL appear in results
2. WHEN viewing package on npm THEN description SHALL clearly explain scroll animation capabilities

**Required Fields**:

```json
{
  "name": "@hive-academy/angular-gsap",
  "version": "0.0.1",
  "description": "GSAP-powered scroll animations for Angular - Declarative scroll-triggered animations with ScrollTrigger integration",
  "keywords": [
    "angular",
    "gsap",
    "scrolltrigger",
    "scroll-animation",
    "animation",
    "angular-library",
    "scroll",
    "parallax",
    "viewport",
    "intersection-observer",
    "angular-gsap",
    "greensock",
    "scroll-effects",
    "hijacked-scroll",
    "lenis"
  ],
  "homepage": "https://github.com/hive-academy/angular-3d-workspace#readme",
  "bugs": {
    "url": "https://github.com/hive-academy/angular-3d-workspace/issues"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/hive-academy/angular-3d-workspace.git",
    "directory": "libs/angular-gsap"
  },
  "license": "MIT",
  "author": "Hive Academy",
  "peerDependencies": { ... },
  "sideEffects": false
}
```

#### Quality Criteria

- Keywords are lowercase, relevant, and unique
- No more than 15 keywords per package (npm best practice)
- URLs are valid and point to correct locations
- Description is under 250 characters
- All existing fields (peerDependencies, sideEffects) preserved

---

### Requirement 5: CODE_OF_CONDUCT.md Creation

**User Story:** As a potential contributor evaluating this project, I want to see a Code of Conduct, so that I know the project values inclusive community participation and has standards for behavior.

**Priority**: MEDIUM

**File Path**: `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md`

#### Acceptance Criteria

1. WHEN a user visits the repository THEN CODE_OF_CONDUCT.md SHALL be visible at root level
2. WHEN GitHub Community Health page is viewed THEN Code of Conduct SHALL show as present
3. WHEN reading the document THEN Contributor Covenant v2.1 text SHALL be used

#### Content Requirements

- Use Contributor Covenant Version 2.1 (https://www.contributor-covenant.org/version/2/1/code_of_conduct/)
- Contact method: Link to GitHub Issues for reporting
- Scope: All project spaces and community interactions

#### Quality Criteria

- Standard Contributor Covenant formatting preserved
- Contact information is actionable
- No modifications to core covenant principles

---

### Requirement 6: GitHub Issue and PR Templates

**User Story:** As a maintainer receiving community contributions, I want structured issue and PR templates, so that I receive consistent, high-quality information that enables faster triage and resolution.

**Priority**: MEDIUM

**File Paths**:

- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md`
- `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md`
- `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`

#### Acceptance Criteria

1. WHEN creating a new issue THEN user SHALL be presented with template options (Bug Report, Feature Request)
2. WHEN Bug Report template is used THEN required sections SHALL include: Description, Steps to Reproduce, Expected Behavior, Actual Behavior, Environment (Angular version, library version, browser)
3. WHEN Feature Request template is used THEN required sections SHALL include: Problem Statement, Proposed Solution, Alternatives Considered
4. WHEN creating a PR THEN template SHALL include: Description, Type of Change, Checklist (tests, docs, breaking changes)

#### Bug Report Template Content

````markdown
---
name: Bug Report
about: Report a bug to help us improve
title: '[BUG] '
labels: bug
assignees: ''
---

## Description

A clear and concise description of the bug.

## Steps to Reproduce

1. Go to '...'
2. Use component '...'
3. Configure with '...'
4. See error

## Expected Behavior

What you expected to happen.

## Actual Behavior

What actually happened.

## Environment

- **Angular Version**:
- **Library Version**:
- **Browser**:
- **OS**:

## Code Sample

```typescript
// Minimal reproduction code
```
````

## Additional Context

Any other context, screenshots, or error messages.

````

#### Feature Request Template Content

```markdown
---
name: Feature Request
about: Suggest a new feature or enhancement
title: '[FEATURE] '
labels: enhancement
assignees: ''
---

## Problem Statement
Describe the problem or limitation you're facing.

## Proposed Solution
Describe your ideal solution.

## Alternatives Considered
What other solutions have you considered?

## Additional Context
Any mockups, code samples, or references.
````

#### Pull Request Template Content

```markdown
## Description

Brief description of changes.

## Type of Change

- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update

## Related Issue

Fixes #(issue number)

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have added tests covering my changes
- [ ] All new and existing tests pass
- [ ] I have updated relevant documentation
- [ ] My commits follow conventional commit format

## Screenshots (if applicable)
```

#### Quality Criteria

- Templates use GitHub's YAML frontmatter format correctly
- Labels referenced in templates exist in repository
- Templates render correctly in GitHub's issue/PR creation UI

---

### Requirement 7: Root README Transformation

**User Story:** As a developer visiting the GitHub repository for the first time, I want to immediately understand what libraries are available and how to use them, so that I can navigate to the relevant documentation without confusion.

**Priority**: MEDIUM

**File Path**: `D:\projects\angular-3d-workspace\README.md`

#### Acceptance Criteria

1. WHEN visiting repository root THEN purpose of the workspace (Angular 3D and animation libraries) SHALL be immediately clear
2. WHEN scanning the README THEN both libraries SHALL be prominently featured with links to their respective READMEs
3. WHEN looking for installation instructions THEN quick start for each library SHALL be visible
4. WHEN existing publishing documentation is needed THEN it SHALL still be accessible (preserved or linked)

#### Required Sections

**Section 1: Header**

- Project name with badges
- One-line description: "Angular libraries for 3D graphics (Three.js) and scroll animations (GSAP)"

**Section 2: Libraries Overview**

| Library                                           | Description                     | npm                   |
| ------------------------------------------------- | ------------------------------- | --------------------- |
| [@hive-academy/angular-3d](./libs/angular-3d)     | Declarative Three.js components | [![npm](badge)](link) |
| [@hive-academy/angular-gsap](./libs/angular-gsap) | GSAP scroll animations          | [![npm](badge)](link) |

**Section 3: Quick Install**

```bash
# For 3D graphics
npm install @hive-academy/angular-3d three three-stdlib

# For scroll animations
npm install @hive-academy/angular-gsap gsap lenis
```

**Section 4: Live Demo**

- Link to demo application
- Screenshots or GIFs showing capabilities

**Section 5: Documentation Links**

- Link to each library's README
- Link to CONTRIBUTING.md

**Section 6: Development (collapsed or moved to CONTRIBUTING.md)**

- Preserve essential commands for contributors
- Remove Nx template boilerplate

**Section 7: Publishing (preserve existing)**

- Keep existing publishing documentation or link to it

**Section 8: License**

- MIT (c) Hive Academy

#### Quality Criteria

- Nx boilerplate removed or minimized
- Focus on libraries, not workspace tooling
- Professional appearance suitable for open source showcase
- Links to all relevant documentation

---

### Requirement 8: StackBlitz Starter Templates (Phase 2)

**User Story:** As a developer evaluating these libraries, I want to experiment in an online sandbox without installing anything locally, so that I can quickly test if the library meets my needs.

**Priority**: LOW (Phase 2 - Post-Release)

**Note**: This requirement is documented for future implementation after initial release.

#### Acceptance Criteria (Phase 2)

1. WHEN README "Try It Now" badge is clicked THEN StackBlitz SHALL open with working example
2. WHEN StackBlitz project loads THEN all dependencies SHALL be correctly configured
3. WHEN user modifies code THEN live preview SHALL update

#### Required Templates

**Template 1: angular-3d-starter**

- Minimal Angular standalone app
- Single scene with box primitive
- Basic lighting
- OrbitControls enabled

**Template 2: angular-gsap-starter**

- Minimal Angular standalone app
- Three sections with scroll animations
- Demonstrates fadeIn, parallax, hijacked scroll

#### Implementation Approach

- Create GitHub repository for each template
- Configure for StackBlitz compatibility
- Add "Open in StackBlitz" badge to READMEs

---

## Non-Functional Requirements

### Documentation Quality

- **Readability**: All documentation passes Flesch-Kincaid Grade Level < 12
- **Accuracy**: All code examples are tested and working
- **Currency**: Documentation reflects current API (version 0.0.1)
- **Accessibility**: Documentation is screen-reader friendly (proper headings, alt text for images)

### Maintenance

- **Response Time**: Maintainer commits to reviewing issues weekly
- **PR Reviews**: Within 2 weeks
- **Breaking Changes**: Major versions only with migration guides

### Discoverability

- **npm Search**: Both libraries appear in top 20 results for relevant keyword combinations
- **SEO**: Repository topics configured for GitHub search

---

## Stakeholder Analysis

### Primary Stakeholders

| Stakeholder        | Needs                              | Success Criteria                                     |
| ------------------ | ---------------------------------- | ---------------------------------------------------- |
| Angular Developers | Easy-to-use 3D/animation libraries | Installation < 5 min, first working example < 10 min |
| Library Maintainer | Manageable support burden          | Structured issues, clear contribution guidelines     |
| npm Consumers      | Legal clarity, reliable packages   | MIT license, semantic versioning                     |

### Secondary Stakeholders

| Stakeholder            | Needs                   | Success Criteria                 |
| ---------------------- | ----------------------- | -------------------------------- |
| Potential Contributors | Clear contribution path | CONTRIBUTING.md, issue templates |
| Enterprise Evaluators  | Compliance verification | LICENSE file, CODE_OF_CONDUCT    |

---

## Risk Assessment

| Risk                                     | Probability | Impact   | Mitigation                                            |
| ---------------------------------------- | ----------- | -------- | ----------------------------------------------------- |
| Missing LICENSE blocks npm adoption      | High        | Critical | Create LICENSE file first (Requirement 1)             |
| Incomplete README causes user confusion  | High        | High     | Comprehensive README with examples (Requirement 2)    |
| Poor npm discoverability                 | Medium      | Medium   | Keywords and description optimization (Requirement 4) |
| Inconsistent messaging between libraries | Medium      | Low      | README parity check (Requirements 2, 3)               |
| Stale documentation post-release         | Low         | Medium   | Add version badges, date documentation                |

---

## Success Metrics

| Metric                        | Target                        | Measurement               |
| ----------------------------- | ----------------------------- | ------------------------- |
| README completeness           | 100% sections present         | Checklist verification    |
| npm discoverability           | Top 20 for "angular three.js" | npm search test           |
| GitHub Community Health       | 100% health score             | GitHub Community insights |
| Time to first working example | < 10 minutes                  | User testing              |
| Documentation accuracy        | 0 broken code examples        | npm pack + local test     |

---

## Priority Classification

### MVP (Release Blockers)

1. LICENSE file (Requirement 1) - CRITICAL
2. angular-3d README completion (Requirement 2) - CRITICAL
3. Package.json metadata (Requirement 4) - HIGH

### Release Polish

4. angular-gsap README badges (Requirement 3) - HIGH
5. CODE_OF_CONDUCT.md (Requirement 5) - MEDIUM
6. GitHub templates (Requirement 6) - MEDIUM
7. Root README transformation (Requirement 7) - MEDIUM

### Phase 2 (Post-Release)

8. StackBlitz templates (Requirement 8) - LOW

---

## Dependencies

```
Requirement 1 (LICENSE)
    └── Must complete BEFORE npm publish

Requirement 2 (angular-3d README)
    ├── Requires: Review of angular-gsap README for consistency
    └── Must complete BEFORE npm publish

Requirement 3 (angular-gsap README polish)
    └── Requires: Badge URLs determined

Requirement 4 (Package.json)
    ├── Requires: GitHub repository URL confirmed
    └── Must complete BEFORE npm publish

Requirements 5, 6, 7
    └── Can be completed in parallel, before or after release

Requirement 8 (StackBlitz)
    └── Requires: npm packages published first
```

---

## Deliverables Summary

| Deliverable                 | File Path                                                                    | Owner     |
| --------------------------- | ---------------------------------------------------------------------------- | --------- |
| LICENSE                     | `D:\projects\angular-3d-workspace\LICENSE`                                   | Developer |
| angular-3d README           | `D:\projects\angular-3d-workspace\libs\angular-3d\README.md`                 | Developer |
| angular-gsap README updates | `D:\projects\angular-3d-workspace\libs\angular-gsap\README.md`               | Developer |
| angular-3d package.json     | `D:\projects\angular-3d-workspace\libs\angular-3d\package.json`              | Developer |
| angular-gsap package.json   | `D:\projects\angular-3d-workspace\libs\angular-gsap\package.json`            | Developer |
| CODE_OF_CONDUCT.md          | `D:\projects\angular-3d-workspace\CODE_OF_CONDUCT.md`                        | Developer |
| Bug report template         | `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\bug_report.md`      | Developer |
| Feature request template    | `D:\projects\angular-3d-workspace\.github\ISSUE_TEMPLATE\feature_request.md` | Developer |
| PR template                 | `D:\projects\angular-3d-workspace\.github\PULL_REQUEST_TEMPLATE.md`          | Developer |
| Root README                 | `D:\projects\angular-3d-workspace\README.md`                                 | Developer |

---

## Estimated Effort

| Requirement                | Estimated Time |
| -------------------------- | -------------- |
| LICENSE file               | 15 minutes     |
| angular-3d README          | 3-4 hours      |
| angular-gsap README polish | 30 minutes     |
| Package.json metadata      | 30 minutes     |
| CODE_OF_CONDUCT.md         | 15 minutes     |
| GitHub templates           | 1 hour         |
| Root README transformation | 1 hour         |
| **Total MVP**              | **~6 hours**   |

---

**Document Version**: 1.0
**Created**: 2026-01-06
**Status**: Ready for Architect Review
