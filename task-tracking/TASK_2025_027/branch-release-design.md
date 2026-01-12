# Branch-Based Release Workflow - Architecture Design

## Executive Summary

This document designs an **alternative branch-based release workflow** to complement (or replace) the existing tag-based workflow. The branch-based approach uses dedicated long-lived release branches (`release/angular-3d`, `release/angular-gsap`) where merging a PR triggers publishing to npm.

---

## 1. Workflow Overview

### Visual Diagram: Branch-Based Release Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         BRANCH-BASED RELEASE WORKFLOW                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  DEVELOPER FLOW:                                                                │
│  ───────────────                                                                │
│                                                                                 │
│  ┌─────────┐     ┌──────────────┐     ┌─────────────────┐     ┌──────────────┐ │
│  │  main   │────>│ feature/xyz  │────>│   PR to main    │────>│ main branch  │ │
│  │ branch  │     │   branch     │     │  (code review)  │     │   updated    │ │
│  └─────────┘     └──────────────┘     └─────────────────┘     └──────────────┘ │
│                                                                                 │
│                                                                                 │
│  RELEASE FLOW (when ready to publish):                                          │
│  ─────────────────────────────────────                                          │
│                                                                                 │
│  ┌──────────────┐     ┌─────────────────────┐     ┌──────────────────────────┐ │
│  │    main      │────>│  Create Release PR  │────>│ PR to release/angular-3d │ │
│  │   branch     │     │  (includes version) │     │    (triggers publish)    │ │
│  └──────────────┘     └─────────────────────┘     └──────────────────────────┘ │
│         │                                                   │                   │
│         │                                                   ▼                   │
│         │             ┌─────────────────────────────────────────────────────┐   │
│         │             │              GITHUB ACTIONS WORKFLOW                │   │
│         │             │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────┐ │   │
│         │             │  │Validate │─>│  Build   │─>│ Publish │─>│Release│ │   │
│         │             │  │(lint,   │  │(all libs)│  │(npm +   │  │(GitHub│ │   │
│         │             │  │test,tc) │  │          │  │provena.)│  │Release│ │   │
│         │             │  └─────────┘  └──────────┘  └─────────┘  └───────┘ │   │
│         │             └─────────────────────────────────────────────────────┘   │
│         │                                                   │                   │
│         ▼                                                   ▼                   │
│  ┌──────────────┐                                  ┌──────────────────────────┐ │
│  │ Back-merge   │<─────────────────────────────────│   Package published to   │ │
│  │ to main      │                                  │   npm with provenance    │ │
│  └──────────────┘                                  └──────────────────────────┘ │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Comparison: Tag-Based vs Branch-Based

| Aspect                 | Tag-Based (Current)       | Branch-Based (Proposed)      |
| ---------------------- | ------------------------- | ---------------------------- |
| **Trigger**            | Push git tag              | Merge PR to release branch   |
| **Version Source**     | Extracted from tag name   | From PR title/body OR commit |
| **Review Gate**        | None (tag push = publish) | PR review required           |
| **Rollback**           | Delete tag, re-publish    | Revert PR, re-publish        |
| **Audit Trail**        | Git tags + workflow logs  | PR history + merge commits   |
| **Protection**         | Anyone with push access   | Branch protection rules      |
| **Accidental Publish** | Higher risk               | Lower risk (PR gate)         |
| **Hotfix Process**     | Create tag, push          | Create PR, merge             |

---

## 2. Branch Strategy

### 2.1 Long-Lived Release Branches

```
BRANCH STRUCTURE:
─────────────────

main (default, protected)
  │
  ├── feature/* (development branches)
  │
  ├── release/angular-3d (long-lived, protected)
  │   └── Publishes @hive-academy/angular-3d to npm
  │
  └── release/angular-gsap (long-lived, protected)
      └── Publishes @hive-academy/angular-gsap to npm
```

### 2.2 Branch Protection Rules

**release/angular-3d Branch Protection:**

```yaml
Branch Protection Settings:
  require_pull_request: true
  required_reviewers: 1
  dismiss_stale_reviews: true
  require_status_checks: true
  required_status_checks:
    - 'validate-release' # Our new workflow job
  restrict_pushes: true
  allow_force_push: false
  allow_deletions: false
```

**Rationale:**

- Prevents direct pushes (must go through PR)
- Requires code review before publish
- Requires validation checks to pass
- Creates audit trail via PR history
- Prevents accidental force pushes or deletions

### 2.3 Release Branch Initialization

**One-Time Setup (create from main):**

```bash
# Create release branches from main
git checkout main
git pull origin main

# Create angular-3d release branch
git checkout -b release/angular-3d
git push -u origin release/angular-3d

# Create angular-gsap release branch
git checkout main
git checkout -b release/angular-gsap
git push -u origin release/angular-gsap

# Return to main
git checkout main
```

---

## 3. GitHub Actions Changes

### 3.1 New Workflow: Branch-Based Publish

**File:** `.github/workflows/publish-on-branch.yml`

````yaml
name: Publish on Release Branch

on:
  push:
    branches:
      - 'release/angular-3d'
      - 'release/angular-gsap'

# Prevent concurrent publishes for same branch
concurrency:
  group: publish-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write # For creating GitHub Releases and tags
  id-token: write # For npm provenance
  pull-requests: read # For reading PR metadata

jobs:
  # Job 1: Determine which library to publish based on branch
  determine-package:
    runs-on: ubuntu-latest
    outputs:
      package_name: ${{ steps.detect.outputs.package_name }}
      package_path: ${{ steps.detect.outputs.package_path }}
      should_publish: ${{ steps.check-version.outputs.should_publish }}
      version: ${{ steps.check-version.outputs.version }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0 # Full history for version detection

      - name: Detect package from branch
        id: detect
        run: |
          BRANCH="${GITHUB_REF#refs/heads/}"
          case "$BRANCH" in
            "release/angular-3d")
              echo "package_name=@hive-academy/angular-3d" >> $GITHUB_OUTPUT
              echo "package_path=libs/angular-3d" >> $GITHUB_OUTPUT
              ;;
            "release/angular-gsap")
              echo "package_name=@hive-academy/angular-gsap" >> $GITHUB_OUTPUT
              echo "package_path=libs/angular-gsap" >> $GITHUB_OUTPUT
              ;;
            *)
              echo "::error::Unknown release branch: $BRANCH"
              exit 1
              ;;
          esac

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Check if version changed
        id: check-version
        run: |
          # Get version from package.json in the library
          CURRENT_VERSION=$(node -p "require('./${{ steps.detect.outputs.package_path }}/package.json').version")

          # Check if this version is already published
          PACKAGE_NAME="${{ steps.detect.outputs.package_name }}"
          NPM_VERSION=$(npm view "$PACKAGE_NAME@$CURRENT_VERSION" version 2>/dev/null || echo "not-found")

          if [ "$NPM_VERSION" = "$CURRENT_VERSION" ]; then
            echo "Version $CURRENT_VERSION already published, skipping"
            echo "should_publish=false" >> $GITHUB_OUTPUT
          else
            echo "Version $CURRENT_VERSION not yet published"
            echo "should_publish=true" >> $GITHUB_OUTPUT
          fi

          echo "version=$CURRENT_VERSION" >> $GITHUB_OUTPUT

  # Job 2: Validate before publishing
  validate-release:
    needs: determine-package
    if: needs.determine-package.outputs.should_publish == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Verify NPM authentication
        run: npm whoami
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

      - name: Run validation pipeline
        run: |
          echo "::group::Linting"
          npx nx run-many -t lint
          echo "::endgroup::"

          echo "::group::Testing"
          npx nx run-many -t test
          echo "::endgroup::"

          echo "::group::Type Checking"
          npx nx run-many -t typecheck
          echo "::endgroup::"

          echo "::group::Building"
          npx nx run-many -t build
          echo "::endgroup::"

      - name: Validate build artifacts
        run: |
          PACKAGE_PATH="${{ needs.determine-package.outputs.package_path }}"
          DIST_PATH="dist/$PACKAGE_PATH"

          if [[ ! -d "$DIST_PATH" ]]; then
            echo "::error::Build output not found at $DIST_PATH"
            exit 1
          fi

          if [[ ! -f "$DIST_PATH/package.json" ]]; then
            echo "::error::package.json not found in $DIST_PATH"
            exit 1
          fi

          echo "Build artifacts validated successfully"

  # Job 3: Publish to npm
  publish:
    needs: [determine-package, validate-release]
    if: needs.determine-package.outputs.should_publish == 'true'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build packages
        run: npx nx run-many -t build

      - name: Publish to NPM with provenance
        uses: nick-fields/retry@v3
        with:
          timeout_minutes: 10
          max_attempts: 3
          retry_wait_seconds: 30
          command: npx nx release publish --projects=${{ needs.determine-package.outputs.package_name }}
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
          NPM_CONFIG_PROVENANCE: true

      - name: Create git tag
        run: |
          VERSION="${{ needs.determine-package.outputs.version }}"
          PACKAGE="${{ needs.determine-package.outputs.package_name }}"
          TAG="${PACKAGE}@${VERSION}"

          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"

          # Create tag if it doesn't exist
          if ! git rev-parse "$TAG" >/dev/null 2>&1; then
            git tag -a "$TAG" -m "Release $TAG"
            git push origin "$TAG"
          fi

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          tag_name: ${{ needs.determine-package.outputs.package_name }}@${{ needs.determine-package.outputs.version }}
          name: ${{ needs.determine-package.outputs.package_name }}@${{ needs.determine-package.outputs.version }}
          body: |
            ## ${{ needs.determine-package.outputs.package_name }} v${{ needs.determine-package.outputs.version }}

            Published via branch-based release workflow.

            **Install:**
            ```bash
            npm install ${{ needs.determine-package.outputs.package_name }}@${{ needs.determine-package.outputs.version }}
            ```
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  # Job 4: Skip notification when version unchanged
  skip-notification:
    needs: determine-package
    if: needs.determine-package.outputs.should_publish == 'false'
    runs-on: ubuntu-latest
    steps:
      - name: Log skip reason
        run: |
          echo "Skipping publish: version ${{ needs.determine-package.outputs.version }} already published"
          echo "::notice::Version ${{ needs.determine-package.outputs.version }} already exists on npm, no publish needed"
````

### 3.2 PR Validation Workflow (Status Check)

**File:** `.github/workflows/release-pr-check.yml`

```yaml
name: Release PR Validation

on:
  pull_request:
    branches:
      - 'release/angular-3d'
      - 'release/angular-gsap'

permissions:
  contents: read
  pull-requests: write

jobs:
  validate-release-pr:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Detect target package
        id: detect
        run: |
          TARGET_BRANCH="${{ github.base_ref }}"
          case "$TARGET_BRANCH" in
            "release/angular-3d")
              echo "package_name=@hive-academy/angular-3d" >> $GITHUB_OUTPUT
              echo "package_path=libs/angular-3d" >> $GITHUB_OUTPUT
              ;;
            "release/angular-gsap")
              echo "package_name=@hive-academy/angular-gsap" >> $GITHUB_OUTPUT
              echo "package_path=libs/angular-gsap" >> $GITHUB_OUTPUT
              ;;
          esac

      - name: Get version info
        id: version
        run: |
          CURRENT=$(node -p "require('./${{ steps.detect.outputs.package_path }}/package.json').version")
          echo "current_version=$CURRENT" >> $GITHUB_OUTPUT

          # Check npm for published versions
          NPM_LATEST=$(npm view "${{ steps.detect.outputs.package_name }}" version 2>/dev/null || echo "0.0.0")
          echo "npm_version=$NPM_LATEST" >> $GITHUB_OUTPUT

      - name: Validate version bump
        run: |
          CURRENT="${{ steps.version.outputs.current_version }}"
          NPM="${{ steps.version.outputs.npm_version }}"

          echo "Current package.json version: $CURRENT"
          echo "Latest npm version: $NPM"

          # Use semver comparison (basic)
          if [ "$CURRENT" = "$NPM" ]; then
            echo "::error::Version $CURRENT already published to npm. Please bump the version."
            exit 1
          fi

          echo "Version $CURRENT is valid for publishing"

      - name: Run full validation
        run: |
          npx nx run-many -t lint
          npx nx run-many -t test
          npx nx run-many -t typecheck
          npx nx run-many -t build

      - name: Validate build output
        run: |
          DIST_PATH="dist/${{ steps.detect.outputs.package_path }}"

          if [[ ! -d "$DIST_PATH" ]]; then
            echo "::error::Build output not found"
            exit 1
          fi

          echo "Build artifacts validated"

      - name: Add PR comment with release info
        uses: actions/github-script@v7
        with:
          script: |
            const version = '${{ steps.version.outputs.current_version }}';
            const package_name = '${{ steps.detect.outputs.package_name }}';
            const npm_version = '${{ steps.version.outputs.npm_version }}';

            const body = `## Release Validation Passed

            | Property | Value |
            |----------|-------|
            | **Package** | \`${package_name}\` |
            | **Version to Publish** | \`${version}\` |
            | **Current npm Version** | \`${npm_version}\` |

            ### Pre-Publish Checklist
            - [x] Lint validation passed
            - [x] Tests passed
            - [x] Type checking passed
            - [x] Build successful
            - [x] Version bump validated

            ### What happens on merge?
            1. Package will be published to npm with provenance
            2. Git tag \`${package_name}@${version}\` will be created
            3. GitHub Release will be created

            **Merge this PR to publish to npm.**`;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: body
            });
```

### 3.3 Existing Workflow Modifications

**Keep or Replace Tag-Based Workflow?**

**RECOMMENDATION: Keep BOTH workflows**

| Scenario           | Use Tag-Based | Use Branch-Based      |
| ------------------ | ------------- | --------------------- |
| Regular release    | No            | Yes (PR review gate)  |
| Emergency hotfix   | Yes (faster)  | Yes (if time permits) |
| CI/CD automation   | Yes (scripts) | Yes (GitOps)          |
| Team collaboration | Possible      | Preferred (PR review) |

**Modifications to existing `publish.yml`:**

- Add comment clarifying it's the tag-based workflow
- Consider adding deprecation notice if transitioning fully to branch-based

---

## 4. Version Strategy

### 4.1 Version Determination Methods

**Option A: Version in package.json (RECOMMENDED)**

```
Flow:
1. Developer bumps version in libs/angular-3d/package.json
2. Creates PR to release/angular-3d
3. PR validation checks version isn't already published
4. On merge, workflow publishes that version
```

**Advantages:**

- Version is explicit in code (auditable)
- Works with existing Nx release version command
- No parsing PR titles/bodies required
- Standard npm workflow

**Option B: Conventional Commits Auto-Detection**

```
Flow:
1. Developer merges features to main (with conventional commits)
2. Creates release PR from main → release/angular-3d
3. Workflow analyzes commits since last release
4. Auto-determines version bump (feat=minor, fix=patch, BREAKING=major)
```

**Disadvantages:**

- More complex workflow
- Less explicit control
- Requires maintaining commit history on release branch

**Option C: PR Title Convention**

```
Flow:
1. PR title follows format: "release: @hive-academy/angular-3d@1.2.3"
2. Workflow extracts version from PR title
3. Updates package.json and publishes
```

**Disadvantages:**

- Error-prone (typos in PR title)
- Disconnected from source of truth (package.json)

### 4.2 Recommended Version Workflow

```bash
# Step 1: Bump version locally (on main branch)
npm run release:version -- --projects=@hive-academy/angular-3d --skip-publish

# This updates:
# - libs/angular-3d/package.json (version)
# - CHANGELOG.md
# - Creates git commit

# Step 2: Push to main
git push origin main

# Step 3: Create release PR
gh pr create --base release/angular-3d --head main \
  --title "release: @hive-academy/angular-3d@$(node -p "require('./libs/angular-3d/package.json').version")" \
  --body "Releasing new version. See CHANGELOG.md for changes."

# Step 4: Merge PR (triggers publish)
gh pr merge --merge
```

### 4.3 npm Scripts for Branch-Based Workflow

```json
{
  "scripts": {
    "release:prepare:a3d": "npx nx release version --projects=@hive-academy/angular-3d --skip-publish && git push origin main",
    "release:prepare:gsap": "npx nx release version --projects=@hive-academy/angular-gsap --skip-publish && git push origin main",
    "release:pr:a3d": "gh pr create --base release/angular-3d --head main --title \"release: angular-3d@$(node -p \"require('./libs/angular-3d/package.json').version\")\" --body \"See CHANGELOG.md\"",
    "release:pr:gsap": "gh pr create --base release/angular-gsap --head main --title \"release: angular-gsap@$(node -p \"require('./libs/angular-gsap/package.json').version\")\" --body \"See CHANGELOG.md\""
  }
}
```

---

## 5. Documentation Structure

### 5.1 Documentation Files to Create/Update

```
DOCUMENTATION STRUCTURE:
────────────────────────

docs/
├── publishing/
│   ├── README.md                    # Publishing overview
│   ├── branch-based-release.md      # Branch-based workflow guide
│   ├── tag-based-release.md         # Tag-based workflow guide (existing)
│   ├── version-strategy.md          # Versioning guidelines
│   ├── hotfix-procedure.md          # Emergency hotfix process
│   └── troubleshooting.md           # Common issues and solutions

CONTRIBUTING.md                       # Update with release process
README.md                             # Add publishing section
```

### 5.2 Documentation Outline: Branch-Based Release Guide

```markdown
# Branch-Based Release Workflow

## Overview

- What is branch-based releasing?
- When to use (vs tag-based)
- Key benefits (PR review, audit trail, protection)

## Prerequisites

- Repository write access
- NPM_TOKEN configured in GitHub secrets
- Branch protection rules set up

## Release Process

### Standard Release

1. Prepare version (bump package.json)
2. Create release PR
3. Review and approve
4. Merge to publish

### Quick Reference

- `npm run release:prepare:a3d` - Prepare angular-3d release
- `npm run release:pr:a3d` - Create release PR

## Hotfix Releases

- When to use
- Steps for emergency releases

## Rollback Procedure

- How to unpublish
- How to publish corrected version

## Troubleshooting

- Common errors and solutions
```

---

## 6. Migration Plan

### 6.1 Phase 1: Preparation (1-2 hours)

```
PHASE 1 TASKS:
──────────────
[ ] Create release/angular-3d branch from main
[ ] Create release/angular-gsap branch from main
[ ] Configure branch protection rules
[ ] Create publish-on-branch.yml workflow
[ ] Create release-pr-check.yml workflow
[ ] Test workflow with dry-run (no actual publish)
```

### 6.2 Phase 2: Parallel Operation (1-2 weeks)

```
PHASE 2 TASKS:
──────────────
[ ] Keep existing tag-based workflow operational
[ ] Add branch-based workflow alongside
[ ] Document both workflows
[ ] Team training on branch-based process
[ ] Perform 1-2 real releases using branch-based
[ ] Gather feedback and iterate
```

### 6.3 Phase 3: Transition (Optional)

```
PHASE 3 TASKS (if replacing tag-based):
───────────────────────────────────────
[ ] Update documentation to recommend branch-based
[ ] Add deprecation notice to tag-based workflow
[ ] Remove tag-based workflow (after grace period)
[ ] Update npm scripts to only use branch-based
```

### 6.4 Recommended Timeline

| Week | Phase   | Activities                            |
| ---- | ------- | ------------------------------------- |
| 1    | Phase 1 | Setup branches, workflows, protection |
| 1-2  | Phase 2 | Parallel operation, testing           |
| 3+   | Phase 3 | Optional: Full transition             |

---

## 7. Design Decisions

### 7.1 Decision: Keep Both Workflows

**Decision:** Implement branch-based as ADDITION, not replacement

**Rationale:**

- Tag-based useful for emergency hotfixes (faster, no PR required)
- Branch-based better for planned releases (review gate)
- Different use cases warrant different tools
- No breaking change for existing automation

**Trade-offs:**

- (+) Flexibility for different scenarios
- (+) No migration risk
- (-) Two workflows to maintain
- (-) Potential confusion about which to use

### 7.2 Decision: Version from package.json

**Decision:** Read version from source package.json, not PR metadata

**Rationale:**

- Version is explicitly committed to source control
- Works with existing Nx release version command
- Auditable (version change is a git commit)
- No complex parsing of PR titles/bodies

**Trade-offs:**

- (+) Explicit, auditable
- (+) Works with existing tooling
- (-) Requires version bump before PR

### 7.3 Decision: Create Tags Automatically

**Decision:** Workflow creates git tags after successful publish

**Rationale:**

- Maintains consistency with tag-based workflow
- Tags provide point-in-time references
- Required for GitHub Releases
- Enables both workflows to coexist

**Trade-offs:**

- (+) Consistent tag history
- (+) GitHub Releases work naturally
- (-) Additional git operation in workflow

### 7.4 Decision: Long-Lived Release Branches

**Decision:** Use persistent `release/*` branches (not ephemeral)

**Rationale:**

- Simpler workflow (no branch creation/deletion)
- Branch protection can be configured once
- Clear, predictable branch names
- Standard GitOps pattern

**Trade-offs:**

- (+) Simple, predictable
- (+) Easy to protect
- (-) Branches need to be kept in sync
- (-) Potential for branch divergence

---

## 8. Safeguards Against Accidental Publishes

### 8.1 Branch Protection (Primary)

```yaml
Required:
  - PR approval (1+ reviewers)
  - Status checks pass (validate-release-pr)
  - No direct pushes

This prevents:
  - Accidental pushes to release branch
  - Publishing without review
  - Publishing with failing tests
```

### 8.2 Version Check (Secondary)

```yaml
Workflow checks:
  - Is version already on npm? → Skip publish
  - Is version > npm version? → Allow publish

This prevents:
  - Republishing same version
  - Accidental duplicate publishes
```

### 8.3 PR Review Gate (Tertiary)

```yaml
PR comment shows:
  - Exact version to publish
  - Current npm version
  - What will happen on merge

This ensures:
  - Reviewer sees exactly what will publish
  - No surprises on merge
```

---

## 9. Hotfix Procedure

### 9.1 Standard Hotfix (Branch-Based)

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-fix

# 2. Make fix and commit
git add .
git commit -m "fix(angular-3d): critical security fix"

# 3. Merge to main
gh pr create --base main --head hotfix/critical-fix --title "fix(angular-3d): critical security fix"
gh pr merge --squash

# 4. Bump version on main
npm run release:version -- --projects=@hive-academy/angular-3d --skip-publish
git push origin main

# 5. Create release PR
npm run release:pr:a3d

# 6. Fast-track review and merge
gh pr merge --merge
```

### 9.2 Emergency Hotfix (Tag-Based, Bypass Review)

For true emergencies where PR review would cause unacceptable delay:

```bash
# Use existing tag-based workflow
npm run release:version -- --projects=@hive-academy/angular-3d
git push && git push --tags
# Tag push triggers immediate publish (no PR required)
```

---

## 10. Rollback Procedure

### 10.1 Rollback a Bad Publish

```bash
# 1. Revert the merge commit on release branch
git checkout release/angular-3d
git revert <merge-commit-sha>
git push origin release/angular-3d

# 2. Bump to next patch version with fix
git checkout main
# ... fix the issue ...
npm run release:version -- --projects=@hive-academy/angular-3d --skip-publish
git push origin main

# 3. Create new release PR
npm run release:pr:a3d
gh pr merge --merge

# 4. (Optional) Deprecate bad version on npm
npm deprecate @hive-academy/angular-3d@<bad-version> "This version has issues, please upgrade to <new-version>"
```

### 10.2 Unpublish (Within 72 Hours)

```bash
# Only possible within 72 hours of publish (npm policy)
npm unpublish @hive-academy/angular-3d@<version>
```

---

## 11. Implementation Checklist

### 11.1 Files to Create

| File                                      | Purpose                            | Priority |
| ----------------------------------------- | ---------------------------------- | -------- |
| `.github/workflows/publish-on-branch.yml` | Main branch-based publish workflow | P0       |
| `.github/workflows/release-pr-check.yml`  | PR validation for release branches | P0       |
| `docs/publishing/branch-based-release.md` | Documentation                      | P1       |

### 11.2 Files to Modify

| File              | Changes                                    | Priority |
| ----------------- | ------------------------------------------ | -------- |
| `package.json`    | Add release:prepare and release:pr scripts | P1       |
| `README.md`       | Add branch-based release section           | P2       |
| `CONTRIBUTING.md` | Update release process                     | P2       |

### 11.3 Repository Configuration

| Setting                                   | Value                                  | Priority |
| ----------------------------------------- | -------------------------------------- | -------- |
| Create `release/angular-3d` branch        | From main                              | P0       |
| Create `release/angular-gsap` branch      | From main                              | P0       |
| Branch protection: `release/angular-3d`   | PR required, 1 reviewer, status checks | P0       |
| Branch protection: `release/angular-gsap` | PR required, 1 reviewer, status checks | P0       |

---

## 12. Summary

### Key Architectural Decisions

1. **Dual Workflow Support**: Keep both tag-based and branch-based workflows
2. **Version from Source**: Read version from package.json, not PR metadata
3. **Long-Lived Branches**: Persistent release/\* branches with protection
4. **Automatic Tagging**: Create git tags after successful publish
5. **PR Review Gate**: Require approval before publish

### Benefits of Branch-Based Approach

- **Safety**: PR review prevents accidental publishes
- **Audit Trail**: Full PR history for every release
- **Protection**: Branch rules prevent unauthorized publishes
- **Collaboration**: Team can review and discuss releases
- **Flexibility**: Standard release via PR, emergency via tags

### Risk Mitigations

- Version already published? → Workflow skips
- Tests failing? → PR blocked
- No approval? → PR blocked
- Direct push? → Branch protection blocks

### Next Steps for Implementation

1. Create release branches
2. Configure branch protection
3. Create workflow files
4. Test with dry-run
5. Document the process
6. Train the team
7. Perform first real release

---

## Appendix: Quick Reference

### Release Commands (Branch-Based)

```bash
# Prepare release for angular-3d
npm run release:prepare:a3d

# Create release PR for angular-3d
npm run release:pr:a3d

# Prepare release for angular-gsap
npm run release:prepare:gsap

# Create release PR for angular-gsap
npm run release:pr:gsap
```

### Emergency Commands (Tag-Based)

```bash
# Emergency publish angular-3d
npm run release:version -- --projects=@hive-academy/angular-3d
git push && git push --tags

# Emergency publish angular-gsap
npm run release:version -- --projects=@hive-academy/angular-gsap
git push && git push --tags
```

### Verification Commands

```bash
# Check published versions
npm view @hive-academy/angular-3d versions --json
npm view @hive-academy/angular-gsap versions --json

# Verify provenance
npm audit signatures
```
