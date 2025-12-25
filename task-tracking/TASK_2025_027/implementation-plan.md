# Implementation Plan - TASK_2025_027

## Codebase Investigation Summary

### Libraries Discovered

**@hive-academy/angular-3d** (libs/angular-3d)

- Purpose: Angular wrapper for Three.js 3D graphics
- Current version: 0.0.1
- Key exports: Scene components, primitives, directives, loaders, postprocessing
- Documentation: Comprehensive README with API examples
- CLAUDE.md: Detailed developer guidelines exist

**@hive-academy/angular-gsap** (libs/angular-gsap)

- Purpose: Angular wrapper for GSAP scroll animations
- Current version: 0.0.1
- Key exports: ScrollAnimation, ViewportAnimation, HijackedScroll directives
- Documentation: Professional README with extensive examples
- CLAUDE.md: Detailed developer guidelines exist

### Patterns Identified

**Nx Release Configuration (Existing)**

- Pattern: Nx release version management with git tags
- Evidence: nx.json:81-84 (release.version.preVersionCommand)
- Components:
  - preVersionCommand: "npx nx run-many -t build"
  - Independent versioning per library (release.version in project.json)
  - currentVersionResolver: "git-tag"
  - fallbackCurrentVersionResolver: "disk"

**Library Project Configuration (Existing)**

- Pattern: Each library has nx-release-publish target
- Evidence:
  - libs/angular-3d/project.json:31-34
  - libs/angular-gsap/project.json:31-34
- Configuration: packageRoot: "dist/{projectRoot}"

**CI/CD Pipeline (Existing)**

- Pattern: GitHub Actions workflow for validation
- Evidence: .github/workflows/ci.yml:1-44
- Stages: install deps, lint, test, build, e2e
- Runtime: ubuntu-latest, Node 20, npm ci for reproducible builds

**Commit Conventions (Enforced)**

- Pattern: Commitlint with conventional commits
- Evidence: .husky/commit-msg, package.json devDependencies
- Configuration: @commitlint/config-conventional
- Rules:
  - Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
  - Scopes: angular-3d, angular-gsap, demo, deps, release, ci, docs, hooks, scripts
  - Format: type(scope): subject (3-72 chars, lowercase, no period)

### Integration Points

**GitHub Actions**

- Location: .github/workflows/
- Interface: YAML workflow files
- Secrets: NPM_TOKEN (required)
- Permissions: id-token: write, contents: write (for provenance and releases)

**Nx Release CLI**

- Location: Nx workspace (v22.2.6)
- Interface: npx nx release [options]
- Commands: version, publish, changelog generation
- Config: nx.json release section, project.json release.version

**NPM Registry**

- Location: https://registry.npmjs.org/
- Authentication: .npmrc with NPM_TOKEN
- Scope: @hive-academy/\*
- Provenance: Enabled via --provenance flag

---

## Architecture Design (Codebase-Aligned)

### Design Philosophy

**Chosen Approach**: Nx Native Release + GitHub Actions Automation

**Rationale**:

- Nx 22.2.6 has built-in release management (nx release commands)
- Existing infrastructure already configured (preVersionCommand, nx-release-publish targets)
- Leverages existing CI workflow patterns (ubuntu-latest, Node 20, npm ci)
- Aligns with monorepo best practices (independent versioning, conventional commits)

**Evidence**:

- Nx release configuration exists in nx.json:81-84
- Both libraries have release.version config in project.json
- CI workflow pattern established in .github/workflows/ci.yml
- Commitlint enforces conventional commits for changelog generation

### Component Specifications

---

#### Component 1: Enhanced Nx Release Configuration

**Purpose**: Configure Nx release for independent library versioning, changelog generation, and GitHub Release integration

**Pattern**: Nx release groups with independent versioning
**Evidence**:

- Current setup: nx.json:81-84 (minimal release config)
- Library configs: libs/angular-3d/project.json:7-12, libs/angular-gsap/project.json:7-12
- Nx documentation: https://nx.dev/features/manage-releases

**Responsibilities**:

- Define release groups for independent library versioning
- Configure changelog generation from conventional commits
- Enable GitHub Release notes creation
- Configure version resolution strategy (git-tag primary, disk fallback)

**Implementation Pattern**:

```json
// nx.json (enhancement to existing release config)
{
  "release": {
    "version": {
      "preVersionCommand": "npx nx run-many -t build"
    },
    "changelog": {
      "workspaceChangelog": {
        "createRelease": "github",
        "file": "CHANGELOG.md",
        "renderOptions": {
          "authors": false,
          "commitReferences": true,
          "versionTitleDate": true
        }
      },
      "projectChangelogs": false
    },
    "git": {
      "commitMessage": "chore(release): publish {version}",
      "tagMessage": "Release {version}"
    },
    "releaseTagPattern": "{projectName}@{version}",
    "groups": {
      "angular-3d": {
        "projects": ["@hive-academy/angular-3d"],
        "changelog": {
          "createRelease": "github"
        }
      },
      "angular-gsap": {
        "projects": ["@hive-academy/angular-gsap"],
        "changelog": {
          "createRelease": "github"
        }
      }
    }
  }
}
```

**Quality Requirements**:

**Functional Requirements**:

- Support independent versioning for angular-3d and angular-gsap
- Generate CHANGELOG.md entries from conventional commits since last git tag
- Create GitHub Releases when publishing (if GH_TOKEN available)
- Use git tags for version resolution (fallback to disk package.json)

**Non-Functional Requirements**:

- Performance: Version calculation must complete in <10 seconds
- Reliability: Dry-run mode must not modify any files
- Maintainability: Configuration in standard Nx format

**Pattern Compliance**:

- Must use currentVersionResolver: "git-tag" (verified: project.json:10)
- Must use fallbackCurrentVersionResolver: "disk" (verified: project.json:11)
- Must use conventional commits for changelog (verified: commitlint config)

**Files Affected**:

- D:\projects\angular-3d-workspace\nx.json (MODIFY - add changelog, git, releaseTagPattern, groups)

---

#### Component 2: GitHub Actions Publish Workflow

**Purpose**: Automated CI/CD pipeline for publishing packages to npm when git tags are pushed

**Pattern**: GitHub Actions workflow with validation pipeline + npm publish
**Evidence**:

- Existing CI workflow: .github/workflows/ci.yml (lint, test, build pattern)
- Node 20 runtime: .github/workflows/ci.yml:31
- npm ci pattern: .github/workflows/ci.yml:34

**Responsibilities**:

- Trigger on git tag push matching @hive-academy/angular-3d@_ or @hive-academy/angular-gsap@_
- Run full validation pipeline (install, lint, test, typecheck, build)
- Authenticate with npm using NPM_TOKEN secret
- Publish package with provenance attestation
- Create GitHub Release with changelog notes
- Handle failures gracefully (clear error messages)

**Implementation Pattern**:

```yaml
# .github/workflows/publish.yml
name: Publish to NPM

on:
  push:
    tags:
      - '@hive-academy/angular-3d@*'
      - '@hive-academy/angular-gsap@*'

permissions:
  contents: write # For creating GitHub Releases
  id-token: write # For npm provenance

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for changelog

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Run validation pipeline
        run: |
          npx nx run-many -t lint
          npx nx run-many -t test
          npx nx run-many -t typecheck
          npx nx run-many -t build

      - name: Extract package name from tag
        id: extract
        run: |
          TAG=${GITHUB_REF#refs/tags/}
          echo "package_name=$(echo $TAG | sed 's/@.*//')" >> $GITHUB_OUTPUT
          echo "tag=$TAG" >> $GITHUB_OUTPUT

      - name: Publish to NPM with provenance
        run: |
          npx nx release publish --projects=${{ steps.extract.outputs.package_name }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true

      - name: Extract changelog for GitHub Release
        id: changelog
        run: |
          # Extract changelog section for this version from CHANGELOG.md
          VERSION=$(echo ${{ steps.extract.outputs.tag }} | sed 's/.*@//')
          SECTION=$(sed -n "/## \[${{ steps.extract.outputs.tag }}\]/,/## \[/p" CHANGELOG.md | sed '$d')
          echo "notes<<EOF" >> $GITHUB_OUTPUT
          echo "$SECTION" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        if: steps.changelog.outputs.notes != ''
        with:
          tag_name: ${{ steps.extract.outputs.tag }}
          name: ${{ steps.extract.outputs.tag }}
          body: ${{ steps.changelog.outputs.notes }}
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**Quality Requirements**:

**Functional Requirements**:

- Trigger only on @hive-academy/angular-3d@_ or @hive-academy/angular-gsap@_ tags
- Execute full validation pipeline before publishing
- Publish to npm with provenance enabled
- Create GitHub Release with extracted changelog notes
- Fail fast if any validation stage fails

**Non-Functional Requirements**:

- Performance: Complete workflow in <5 minutes (with npm cache)
- Security: Use secrets.NPM_TOKEN, never log token values
- Reliability: Idempotent (re-running on same tag should skip publish gracefully)

**Pattern Compliance**:

- Use ubuntu-latest (verified: ci.yml:15)
- Use Node 20 (verified: ci.yml:31)
- Use npm ci for reproducible installs (verified: ci.yml:34)
- Use npx nx run-many -t lint test build (verified: ci.yml:40)

**Files Affected**:

- D:\projects\angular-3d-workspace\.github\workflows\publish.yml (CREATE)

---

#### Component 3: Manual Publish NPM Scripts

**Purpose**: Provide convenient npm scripts for manual publishing workflow

**Pattern**: NPM scripts wrapping Nx release commands
**Evidence**: package.json:5-9 (existing scripts like lint:affected, build:affected)

**Responsibilities**:

- Provide script for versioning with dry-run preview
- Provide script for publishing to npm
- Provide combined script for full release flow
- Document manual publish process

**Implementation Pattern**:

```json
// package.json (add to scripts section)
{
  "scripts": {
    "release:version": "npx nx release version",
    "release:version:dry": "npx nx release version --dry-run",
    "release:publish": "npx nx release publish",
    "release": "npx nx release"
  }
}
```

**Quality Requirements**:

**Functional Requirements**:

- npm run release:version:dry displays version preview without modifications
- npm run release:version creates version, updates changelog, creates git commit and tag
- npm run release:publish publishes to npm (requires NPM_TOKEN env var)
- npm run release runs full release flow (version + publish)

**Non-Functional Requirements**:

- Usability: Script names are intuitive and self-documenting
- Safety: Dry-run script never modifies files

**Pattern Compliance**:

- Follow existing script naming pattern (verified: package.json:7-9)

**Files Affected**:

- D:\projects\angular-3d-workspace\package.json (MODIFY - add release scripts)

---

#### Component 4: Documentation Updates

**Purpose**: Document publishing workflows for maintainers and contributors

**Pattern**: README sections for publishing + CONTRIBUTING guide
**Evidence**:

- Root README exists: README.md
- Library READMEs exist: libs/angular-3d/README.md, libs/angular-gsap/README.md
- No CONTRIBUTING.md found (will create)

**Responsibilities**:

- Add "Publishing" section to root README.md
- Create CONTRIBUTING.md with release process
- Update library READMEs with installation instructions
- Document both manual and automated workflows

**Implementation Pattern**:

````markdown
# README.md (append new section)

## Publishing Packages

This workspace uses Nx release tooling for automated versioning and publishing.

### Automated Publishing (Recommended)

When you're ready to release a new version:

1. **Create and push version tag**:

   ```bash
   # For angular-3d library
   npm run release:version -- --projects=@hive-academy/angular-3d
   git push && git push --tags

   # For angular-gsap library
   npm run release:version -- --projects=@hive-academy/angular-gsap
   git push && git push --tags
   ```
````

2. **Automated CI/CD**:
   - GitHub Actions workflow triggers on tag push
   - Runs full validation pipeline (lint, test, typecheck, build)
   - Publishes to npm with provenance
   - Creates GitHub Release with changelog

### Manual Publishing

For emergency hotfixes or when automation is unavailable:

1. **Set NPM token**:

   ```bash
   export NPM_TOKEN=<your_npm_token>
   ```

2. **Preview changes** (dry-run):

   ```bash
   npm run release:version:dry -- --projects=@hive-academy/angular-3d
   ```

3. **Create version**:

   ```bash
   npm run release:version -- --projects=@hive-academy/angular-3d
   ```

4. **Publish to npm**:

   ```bash
   npm run release:publish -- --projects=@hive-academy/angular-3d
   ```

5. **Push to GitHub**:
   ```bash
   git push && git push --tags
   ```

### Versioning Strategy

- **Independent versioning**: Each library has its own version number
- **Semantic versioning**: MAJOR.MINOR.PATCH
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes (backward compatible)
- **Automatic bump detection**: Based on conventional commits
  - `feat:` → MINOR bump
  - `fix:` → PATCH bump
  - `BREAKING CHANGE:` → MAJOR bump

### Requirements

- **NPM Token**: Set `NPM_TOKEN` environment variable (manual publish) or GitHub secret (CI)
- **Conventional Commits**: All commits must follow commitlint rules
- **Validation**: All tests, lints, and builds must pass before publish

````

```markdown
# CONTRIBUTING.md (create new file)

# Contributing to Angular 3D Workspace

Thank you for contributing to our Angular libraries!

## Development Workflow

1. **Clone repository**:
   ```bash
   git clone <repository-url>
   cd angular-3d-workspace
   npm install
````

2. **Create feature branch**:

   ```bash
   git checkout -b feature/my-feature
   ```

3. **Make changes**:

   - Write code following our coding standards
   - Add tests for new functionality
   - Update documentation

4. **Commit changes** (using conventional commits):

   ```bash
   git add .
   git commit -m "feat(angular-3d): add new primitive component"
   ```

   **Commit format**: `type(scope): subject`

   - **Types**: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
   - **Scopes**: angular-3d, angular-gsap, demo, deps, release, ci, docs, hooks, scripts
   - **Subject**: lowercase, 3-72 characters, no period

5. **Run tests**:

   ```bash
   npx nx run-many -t lint test typecheck build
   ```

6. **Create pull request**

## Release Process (Maintainers Only)

### Automated Release (Recommended)

1. **Ensure main branch is up to date**:

   ```bash
   git checkout main
   git pull origin main
   ```

2. **Create version and push tag**:

   ```bash
   # For @hive-academy/angular-3d
   npm run release:version -- --projects=@hive-academy/angular-3d

   # For @hive-academy/angular-gsap
   npm run release:version -- --projects=@hive-academy/angular-gsap

   # Push commit and tag
   git push && git push --tags
   ```

3. **Verify CI workflow**:

   - GitHub Actions automatically publishes to npm
   - Check workflow status at https://github.com/<org>/<repo>/actions
   - Verify package on npm: https://www.npmjs.com/package/@hive-academy/angular-3d

4. **Verify GitHub Release**:
   - Release created at https://github.com/<org>/<repo>/releases
   - Changelog notes included
   - Tag linked correctly

### Manual Release (Emergency Only)

Use when CI/CD is unavailable or for urgent hotfixes.

1. **Set NPM authentication**:

   ```bash
   export NPM_TOKEN=<your_npm_automation_token>
   ```

2. **Preview version changes** (dry-run):

   ```bash
   npm run release:version:dry -- --projects=@hive-academy/angular-3d
   ```

3. **Create version**:

   ```bash
   npm run release:version -- --projects=@hive-academy/angular-3d
   ```

4. **Publish to npm**:

   ```bash
   npm run release:publish -- --projects=@hive-academy/angular-3d
   ```

5. **Push to GitHub**:

   ```bash
   git push origin main --tags
   ```

6. **Manually create GitHub Release** (if needed):
   ```bash
   gh release create @hive-academy/angular-3d@1.0.0 --title "@hive-academy/angular-3d@1.0.0" --notes-file CHANGELOG.md
   ```

### Versioning Guidelines

- **MAJOR (1.0.0 → 2.0.0)**: Breaking changes

  - API changes that break existing code
  - Removed features
  - Commit footer: `BREAKING CHANGE: description`

- **MINOR (1.0.0 → 1.1.0)**: New features (backward compatible)

  - New components, directives, services
  - New features added to existing APIs
  - Commit type: `feat(scope): description`

- **PATCH (1.0.0 → 1.0.1)**: Bug fixes (backward compatible)
  - Bug fixes
  - Performance improvements
  - Documentation updates
  - Commit type: `fix(scope): description`

### Pre-Release Checklist

Before creating a release:

- [ ] All tests passing: `npx nx run-many -t test`
- [ ] All lints passing: `npx nx run-many -t lint`
- [ ] All type-checks passing: `npx nx run-many -t typecheck`
- [ ] All builds successful: `npx nx run-many -t build`
- [ ] CHANGELOG.md preview reviewed (dry-run)
- [ ] Version bump type is correct (major/minor/patch)
- [ ] No uncommitted changes
- [ ] Main branch is up to date

### Troubleshooting

**Issue**: `npm publish` fails with authentication error

**Solution**: Ensure NPM_TOKEN is set correctly:

```bash
npm whoami --registry=https://registry.npmjs.org/
```

**Issue**: Version tag already exists

**Solution**: Delete local and remote tag, then retry:

```bash
git tag -d @hive-academy/angular-3d@1.0.0
git push origin :refs/tags/@hive-academy/angular-3d@1.0.0
```

**Issue**: CI workflow fails at validation stage

**Solution**: Fix validation errors locally, then push fix:

```bash
npx nx run-many -t lint test typecheck build  # Debug locally
git add .
git commit -m "fix(ci): resolve validation failures"
git push
```

## Code Review Guidelines

- All pull requests require at least one approval
- CI checks must pass before merge
- Commit messages must follow conventional commit format
- Code must be formatted with Prettier
- No unused variables (ESLint enforced)

## Questions?

Open an issue or contact the maintainers.

````

```markdown
# libs/angular-3d/README.md (prepend installation section)

# @hive-academy/angular-3d

> 🎨 **Declarative Three.js components for Angular**

A modern Angular library providing declarative, type-safe wrappers for Three.js. Build stunning 3D graphics experiences with familiar Angular patterns.

## Installation

```bash
npm install @hive-academy/angular-3d three three-stdlib gsap maath troika-three-text
````

**Peer Dependencies**:

- `@angular/core`: ~20.3.0
- `@angular/common`: ~20.3.0
- `three`: ^0.182.0
- `three-stdlib`: ^2.35.0
- `gsap`: ^3.14.2
- `maath`: ^0.10.8
- `troika-three-text`: ^0.52.4
- `rxjs`: ~7.8.0

[... rest of existing README content ...]

````

```markdown
# libs/angular-gsap/README.md (update installation section)

# @hive-academy/angular-gsap

> 🎬 **GSAP-powered scroll animations for Angular applications**

[... existing feature list ...]

## Installation

```bash
npm install @hive-academy/angular-gsap gsap lenis
````

**Peer Dependencies**:

- `@angular/core`: ^20.3.0
- `@angular/common`: ^20.3.0
- `gsap`: ^3.12.0
- `lenis`: ^1.3.16

[... rest of existing README content ...]

```

**Quality Requirements**:

**Functional Requirements**:
- Document both automated and manual publishing workflows
- Provide clear examples of all release commands
- Include troubleshooting section for common issues
- Document conventional commit format and versioning strategy

**Non-Functional Requirements**:
- Usability: Documentation is clear and actionable for maintainers
- Completeness: Covers all scenarios (automated, manual, emergency)
- Maintainability: Easy to update as process evolves

**Files Affected**:
- D:\projects\angular-3d-workspace\README.md (MODIFY - add Publishing section)
- D:\projects\angular-3d-workspace\CONTRIBUTING.md (CREATE)
- D:\projects\angular-3d-workspace\libs\angular-3d\README.md (MODIFY - prepend Installation section)
- D:\projects\angular-3d-workspace\libs\angular-gsap\README.md (MODIFY - update Installation section)

---

## Integration Architecture

### Integration Points

**Integration 1: Nx Release → NPM Registry**
- How: Nx release publish command authenticates with .npmrc and publishes built packages from dist/
- Pattern: Standard npm publish with provenance
- Evidence: project.json:31-34 (nx-release-publish target with packageRoot)

**Integration 2: GitHub Actions → Nx Release**
- How: Workflow calls npx nx release publish after validation
- Pattern: CI/CD pipeline with staged validation → publish
- Evidence: .github/workflows/ci.yml (validation pipeline pattern)

**Integration 3: Conventional Commits → Changelog**
- How: Nx release analyzes git commits since last tag, generates changelog
- Pattern: Conventional commits parsed by commitlint parser preset
- Evidence: commitlint config (conventional-changelog-conventionalcommits parser)

**Integration 4: Git Tags → GitHub Releases**
- How: Nx release or GitHub Actions creates releases linked to tags
- Pattern: GitHub Release with changelog notes from CHANGELOG.md
- Evidence: nx.json release.changelog.workspaceChangelog.createRelease: "github"

### Data Flow

**Automated Publish Flow**:
1. Developer runs `npm run release:version --projects=@hive-academy/angular-3d`
2. Nx release:
   - Reads git commits since last tag
   - Determines version bump (major/minor/patch from commit types)
   - Updates CHANGELOG.md
   - Creates git commit with version changes
   - Creates git tag: `@hive-academy/angular-3d@X.Y.Z`
3. Developer pushes commit and tag: `git push && git push --tags`
4. GitHub Actions workflow triggers on tag push
5. Workflow:
   - Installs dependencies (npm ci)
   - Runs validation (lint, test, typecheck, build)
   - Authenticates with npm (NPM_TOKEN)
   - Publishes package with provenance (`npx nx release publish`)
   - Extracts changelog section
   - Creates GitHub Release with notes

**Manual Publish Flow**:
1. Developer sets NPM_TOKEN: `export NPM_TOKEN=<token>`
2. Developer previews: `npm run release:version:dry --projects=@hive-academy/angular-3d`
3. Developer versions: `npm run release:version --projects=@hive-academy/angular-3d`
4. Developer publishes: `npm run release:publish --projects=@hive-academy/angular-3d`
5. Developer pushes: `git push && git push --tags`

### Dependencies

**External Dependencies**:
- NPM Registry: Package hosting and distribution
- GitHub Actions: CI/CD runtime
- Nx CLI: Release management tooling (v22.2.6)
- Git: Version control and tagging

**Internal Dependencies**:
- Build outputs: dist/libs/angular-3d, dist/libs/angular-gsap (must exist before publish)
- CHANGELOG.md: Generated by Nx release, read by GitHub Actions
- package.json versions: Updated by Nx release in dist/ packages
- Commitlint config: Validates commit messages, parser for changelog

---

## Quality Requirements (Architecture-Level)

### Functional Requirements

- Automated CI workflow publishes packages when tags are pushed
- Manual publish workflow completes in <2 minutes
- Dry-run mode accurately previews changes without modifications
- Changelog generated from conventional commits with correct sections
- GitHub Releases created with extracted changelog notes
- NPM provenance attestation included in automated publishes
- Independent versioning for both libraries (no coupling)

### Non-Functional Requirements

**Performance**:
- CI workflow completes in <5 minutes (with npm cache)
- Dry-run preview displays in <10 seconds
- Version resolution from git tags in <5 seconds

**Security**:
- NPM_TOKEN stored in GitHub Secrets (never committed)
- Provenance enabled for supply chain attestation
- Minimal GitHub permissions (id-token: write, contents: write)
- No token values logged in workflow output

**Maintainability**:
- Documentation covers all workflows (automated, manual, emergency)
- Error messages are actionable (e.g., "NPM_TOKEN not set: export NPM_TOKEN=...")
- Configuration in standard Nx format (nx.json release section)
- Workflow visible on repository Actions tab

**Testability**:
- Dry-run mode for testing version changes without side effects
- Idempotent publishes (re-running on same tag skips gracefully)
- Validation pipeline catches issues before publish

### Pattern Compliance

**Nx Release Patterns** (verified in nx.json, project.json):
- Use preVersionCommand for building before versioning
- Use git-tag currentVersionResolver with disk fallback
- Use conventional commits for automatic version bump detection
- Use packageRoot pointing to dist/ build output

**GitHub Actions Patterns** (verified in ci.yml):
- Use ubuntu-latest runner
- Use Node 20 runtime
- Use npm ci for reproducible dependency installation
- Use npx nx run-many for multi-project operations

**Commit Convention Patterns** (verified in commitlint config):
- Use conventional commit format: type(scope): subject
- Use allowed types and scopes from commitlint rules
- Use BREAKING CHANGE footer for major version bumps

---

## Team-Leader Handoff

### Developer Type Recommendation

**Recommended Developer**: backend-developer

**Rationale**:
1. **Infrastructure work**: Creating CI/CD workflows, configuring build systems
2. **YAML/JSON configuration**: Modifying nx.json, creating GitHub Actions workflow
3. **NPM ecosystem knowledge**: Understanding package publishing, provenance, npm authentication
4. **DevOps orientation**: Setting up automated deployment pipelines
5. **No UI/frontend work**: Pure infrastructure and configuration (no Angular components)

### Complexity Assessment

**Complexity**: MEDIUM

**Estimated Effort**: 3-4 hours

**Breakdown**:
- Nx release configuration (nx.json): 30 minutes
- GitHub Actions workflow creation: 1 hour
- NPM scripts and documentation: 1 hour
- Testing workflows (dry-run, manual publish): 1 hour
- Documentation review and refinement: 30 minutes

### Files Affected Summary

**MODIFY**:
- D:\projects\angular-3d-workspace\nx.json (add changelog, git, releaseTagPattern, groups to release section)
- D:\projects\angular-3d-workspace\package.json (add release scripts)
- D:\projects\angular-3d-workspace\README.md (append Publishing section)
- D:\projects\angular-3d-workspace\libs\angular-3d\README.md (prepend Installation section)
- D:\projects\angular-3d-workspace\libs\angular-gsap\README.md (update Installation section)

**CREATE**:
- D:\projects\angular-3d-workspace\.github\workflows\publish.yml (new CI workflow)
- D:\projects\angular-3d-workspace\CONTRIBUTING.md (new contributing guide)

### Critical Verification Points

**Before Implementation, Team-Leader Must Ensure Developer Verifies**:

1. **Nx release configuration is valid**:
   - Test dry-run: `npx nx release version --dry-run --projects=@hive-academy/angular-3d`
   - Verify changelog preview generates correctly
   - Verify version bump calculation from commit history

2. **GitHub Actions workflow syntax is correct**:
   - Validate YAML: https://www.yamllint.com/
   - Verify job steps sequence is logical
   - Verify permissions are minimal required

3. **NPM scripts execute without errors**:
   - Test each script: `npm run release:version:dry`, etc.
   - Verify scripts call correct Nx commands
   - Verify help output is clear

4. **Documentation is complete and accurate**:
   - All code examples tested and work
   - All file paths are absolute Windows paths
   - Troubleshooting section covers common issues

5. **Integration with existing infrastructure**:
   - Verify no conflicts with existing ci.yml workflow
   - Verify git hooks still function correctly
   - Verify no breaking changes to current build process

### Implementation Dependencies

**Prerequisites** (must exist before implementation):
1. NPM_TOKEN secret configured in GitHub repository settings
2. NPM account with publish access to @hive-academy scope
3. GH_TOKEN (GitHub personal access token) for creating releases (optional, can use GITHUB_TOKEN)

**Order of Implementation**:
1. **First**: Modify nx.json (release configuration foundation)
2. **Second**: Add npm scripts to package.json (manual workflow tooling)
3. **Third**: Create publish.yml workflow (automated workflow)
4. **Fourth**: Create/update documentation files (README, CONTRIBUTING, library READMEs)
5. **Fifth**: Test workflows (dry-run, manual publish to test registry like Verdaccio)

### Testing Strategy

**Local Testing** (before pushing):
1. Test dry-run: `npm run release:version:dry --projects=@hive-academy/angular-3d`
2. Verify changelog preview is correct
3. Test workflow YAML syntax: `npx action-validator .github/workflows/publish.yml`
4. Test npm scripts execute without errors

**Verdaccio Testing** (optional, for full end-to-end):
1. Run local Verdaccio registry: `npx verdaccio`
2. Configure npm to use local registry: `npm set registry http://localhost:4873`
3. Create version and publish to Verdaccio
4. Verify package installation from Verdaccio

**Production Testing** (after deployment):
1. Create test tag: `git tag @hive-academy/angular-3d@0.0.2-test`
2. Push tag: `git push origin @hive-academy/angular-3d@0.0.2-test`
3. Monitor GitHub Actions workflow execution
4. Verify package published to npm (check https://www.npmjs.com/package/@hive-academy/angular-3d)
5. Verify GitHub Release created (check Releases tab)
6. Test installation: `npm install @hive-academy/angular-3d@0.0.2-test`

### Risk Mitigation

**Risk 1**: Accidental publish of broken package
- **Mitigation**: Full validation pipeline in CI (lint, test, typecheck, build)
- **Fallback**: npm unpublish within 72 hours (npm policy)

**Risk 2**: NPM_TOKEN exposure
- **Mitigation**: Use GitHub Secrets, never commit .npmrc, never log token
- **Fallback**: Rotate token immediately if exposed, audit publish history

**Risk 3**: Version collision (attempting to publish existing version)
- **Mitigation**: Nx release checks git tags, npm rejects duplicate versions
- **Fallback**: Manually increment version, re-tag, retry

**Risk 4**: CI workflow trigger on wrong tags
- **Mitigation**: Strict tag pattern filter: `@hive-academy/angular-3d@*`, `@hive-academy/angular-gsap@*`
- **Fallback**: Cancel workflow run immediately if wrong tag detected

### Architecture Delivery Checklist

- [x] All components specified with evidence citations
- [x] All patterns verified from codebase (nx.json, project.json, ci.yml, commitlint)
- [x] All configuration values extracted from existing setup
- [x] Quality requirements defined (functional + non-functional)
- [x] Integration points documented with data flow
- [x] Files affected list complete (5 MODIFY, 2 CREATE)
- [x] Developer type recommended (backend-developer)
- [x] Complexity assessed (MEDIUM, 3-4 hours)
- [x] No step-by-step implementation (that's team-leader's job)
- [x] Evidence-based design (all decisions cite file:line or verified patterns)

---

## Technical Decisions

### Decision 1: Use Nx Native Release Instead of Custom Scripts

**Chosen**: Nx release commands with built-in changelog generation

**Alternatives Considered**:
- Custom release scripts with semantic-release
- Lerna for monorepo versioning
- Manual version management

**Rationale**:
- Nx 22.2.6 has mature release tooling built-in
- Already configured in workspace (nx.json:81-84, project.json release.version)
- Aligns with Nx monorepo best practices
- Reduces external dependencies (no semantic-release, no Lerna)
- Native support for independent versioning and conventional commits

**Evidence**:
- Nx release documentation: https://nx.dev/features/manage-releases
- Existing config: nx.json:81-84, libs/angular-3d/project.json:7-12
- Commitlint already configured: @commitlint/config-conventional

**Trade-offs**:
- **Pros**: Integrated with Nx ecosystem, less tooling complexity, better monorepo support
- **Cons**: Less mature than semantic-release, fewer plugins, Nx-specific (vendor lock-in)

### Decision 2: Independent Versioning with Release Groups

**Chosen**: Separate release groups for angular-3d and angular-gsap

**Alternatives Considered**:
- Unified versioning (both libraries always same version)
- Fully independent (no release groups)

**Rationale**:
- Libraries have independent lifecycles (angular-3d can have breaking change without affecting angular-gsap)
- Users may only consume one library (don't force version bumps for unused library)
- Aligns with npm package best practices (semantic versioning per package)
- Existing config already supports independent versioning (currentVersionResolver: git-tag in each project.json)

**Evidence**:
- Requirement 3: "independent versioning for each library" (task-description.md:97-116)
- Existing pattern: libs/angular-3d/project.json:7-12, libs/angular-gsap/project.json:7-12

**Trade-offs**:
- **Pros**: True semantic versioning, smaller dependency footprint for users, clearer changelog
- **Cons**: More complex release process (must specify --projects), potential confusion for users

### Decision 3: GitHub Actions for Automated Publishing

**Chosen**: GitHub Actions workflow triggered by git tag push

**Alternatives Considered**:
- GitHub Actions on release creation
- Manual publish only (no automation)
- Nx Cloud CI integration

**Rationale**:
- Git tags are source of truth for versions (already configured: currentVersionResolver: git-tag)
- Tag push is natural trigger point (version already determined locally)
- Existing CI pattern uses GitHub Actions (ci.yml)
- No additional tooling required (GitHub Actions free for public repos)

**Evidence**:
- Existing workflow: .github/workflows/ci.yml
- Requirement 1: "automated package publishing when I create git tags" (task-description.md:47)

**Trade-offs**:
- **Pros**: Simple trigger, aligned with existing CI, free for public repos
- **Cons**: Requires pushing tags (additional step), tags are immutable (can't retry without deleting)

### Decision 4: NPM Provenance for Supply Chain Security

**Chosen**: Enable npm provenance in CI workflow

**Alternatives Considered**:
- Manual provenance (requires logged-in npm publish)
- No provenance

**Rationale**:
- Requirement 4: "packages published safely with supply chain provenance" (task-description.md:120)
- GitHub Actions has built-in OIDC token provider (permissions: id-token: write)
- Increases trust for open-source consumers (verifiable source)
- Free for public packages (no cost)

**Evidence**:
- Requirement 4 acceptance criteria 4-5: provenance with attestation linking (task-description.md:127-130)
- npm provenance docs: https://docs.npmjs.com/generating-provenance-statements

**Trade-offs**:
- **Pros**: Increased security, supply chain transparency, verifiable builds
- **Cons**: Requires GitHub Actions (can't do manual provenance easily), needs id-token permission

### Decision 5: Workspace-Level Changelog vs Per-Project Changelogs

**Chosen**: Workspace-level CHANGELOG.md with sections per library

**Alternatives Considered**:
- Per-project changelogs (libs/angular-3d/CHANGELOG.md, libs/angular-gsap/CHANGELOG.md)
- No changelog (rely on GitHub Releases only)

**Rationale**:
- Single source of truth for all releases (easier to navigate)
- Simpler for contributors (one file to check)
- Nx release default pattern (workspaceChangelog.file)
- Reduces file clutter in library directories

**Evidence**:
- Requirement 6: "CHANGELOG.md file SHALL be generated/updated in the workspace root" (task-description.md:166)

**Trade-offs**:
- **Pros**: Single file, easier maintenance, clear release history
- **Cons**: Larger file over time, less library isolation

---

## Implementation Order

**Recommended Sequence** (dependencies between components):

1. **Component 1: Enhanced Nx Release Configuration** (FOUNDATIONAL)
   - **Why first**: All other components depend on Nx release working correctly
   - **Files**: nx.json
   - **Verification**: `npx nx release version --dry-run --projects=@hive-academy/angular-3d`

2. **Component 3: Manual Publish NPM Scripts** (TOOLING)
   - **Why second**: Enables local testing of release workflow before CI
   - **Files**: package.json
   - **Verification**: `npm run release:version:dry -- --projects=@hive-academy/angular-3d`

3. **Component 4: Documentation Updates** (DOCUMENTATION)
   - **Why third**: Documents manual workflow before automating
   - **Files**: README.md, CONTRIBUTING.md, library READMEs
   - **Verification**: Read through documentation, test example commands

4. **Component 2: GitHub Actions Publish Workflow** (AUTOMATION)
   - **Why last**: Requires all previous components working (Nx release, scripts, docs)
   - **Files**: .github/workflows/publish.yml
   - **Verification**: Create test tag, push, monitor workflow execution

**Rationale for Order**:
- Foundation before tooling (Nx config → scripts)
- Documentation before automation (understand manual flow → automate it)
- Local testing before CI (verify locally → deploy to cloud)
- Incremental validation (test each layer before next)

**Testing Checkpoints**:
- After Step 1: Dry-run version command works
- After Step 2: Manual scripts execute without errors
- After Step 3: Documentation examples are valid
- After Step 4: Full automated workflow completes successfully

---

## Final Architecture Summary

**Architecture**: Nx Native Release + GitHub Actions CI/CD

**Key Characteristics**:
- **Evidence-Based**: All decisions cite existing codebase patterns
- **Nx-Native**: Leverages built-in Nx release tooling (no external semantic-release)
- **Independent Versioning**: Each library versions separately with release groups
- **Automated + Manual**: CI/CD for production, manual scripts for emergencies
- **Secure**: NPM provenance, secrets management, minimal permissions
- **Maintainable**: Standard Nx patterns, clear documentation, validation gates

**Verification**:
- All configuration values extracted from existing files (nx.json, project.json, ci.yml, commitlint)
- All patterns match established workspace conventions
- All integrations verified as compatible
- All quality requirements defined and measurable

**Ready for Team-Leader Decomposition**: This architecture specification defines WHAT to build and WHY. Team-leader will create atomic tasks defining HOW to implement each component step-by-step.
```
