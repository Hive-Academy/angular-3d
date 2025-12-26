# Publishing Guide

This guide covers everything you need to know about publishing the Angular 3D libraries to npm.

## Libraries

| Package                      | Description                                | npm                                                             |
| ---------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `@hive-academy/angular-3d`   | Angular wrapper for Three.js 3D graphics   | [npm](https://www.npmjs.com/package/@hive-academy/angular-3d)   |
| `@hive-academy/angular-gsap` | Angular wrapper for GSAP scroll animations | [npm](https://www.npmjs.com/package/@hive-academy/angular-gsap) |

## Release Workflows

We support **two release workflows** for different scenarios:

| Workflow         | Trigger                 | Use Case           | Review Required |
| ---------------- | ----------------------- | ------------------ | --------------- |
| **Branch-Based** | PR merge to `release/*` | Standard releases  | Yes (PR review) |
| **Tag-Based**    | Git tag push            | Emergency hotfixes | No              |

---

## Branch-Based Release (Recommended)

The branch-based workflow provides safety through PR reviews and validation checks.

### How It Works

```
1. Developer bumps version on main branch
2. Creates PR from main → release/angular-3d (or release/angular-gsap)
3. PR triggers validation workflow
4. Reviewer approves PR
5. Merge triggers publish to npm
6. Git tag and GitHub Release created automatically
```

### Step-by-Step Guide

#### 1. Prepare the Release

First, bump the version and update the changelog:

```bash
# For @hive-academy/angular-3d
npm run release:prepare:a3d

# For @hive-academy/angular-gsap
npm run release:prepare:gsap
```

This command:

- Analyzes commits since last release
- Determines version bump (major/minor/patch) based on conventional commits
- Updates `libs/{library}/package.json` with new version
- Updates `CHANGELOG.md`
- Creates a git commit
- Pushes to main branch

#### 2. Create Release PR

Create a pull request to the release branch:

```bash
# For @hive-academy/angular-3d
npm run release:pr:a3d

# For @hive-academy/angular-gsap
npm run release:pr:gsap
```

This creates a PR from `main` to `release/angular-3d` (or `release/angular-gsap`).

#### 3. Review and Approve

The PR will automatically:

- Run validation (lint, test, typecheck, build)
- Check that the version isn't already published
- Add a comment with release information

A reviewer must approve the PR before it can be merged.

#### 4. Merge to Publish

When the PR is merged:

- Package is published to npm with provenance
- Git tag is created (e.g., `@hive-academy/angular-3d@1.0.0`)
- GitHub Release is created

### Quick Reference

```bash
# Full release flow for angular-3d
npm run release:prepare:a3d  # Bump version, update changelog
npm run release:pr:a3d       # Create release PR
# → Review and merge PR in GitHub

# Full release flow for angular-gsap
npm run release:prepare:gsap
npm run release:pr:gsap
# → Review and merge PR in GitHub
```

---

## Tag-Based Release (Emergency)

Use the tag-based workflow for emergency hotfixes when PR review would cause unacceptable delay.

### How It Works

```
1. Developer creates version (bumps package.json, updates changelog, creates tag)
2. Pushes commit and tag to remote
3. Tag push triggers GitHub Actions workflow
4. Workflow validates and publishes immediately
```

### Step-by-Step Guide

```bash
# 1. Create version and tag for angular-3d
npm run release:version -- --projects=@hive-academy/angular-3d

# 2. Push commit and tag
git push && git push --tags

# The workflow will automatically:
# - Validate (lint, test, typecheck, build)
# - Publish to npm with provenance
# - Create GitHub Release
```

### When to Use

- Critical security patches
- Production-breaking bugs
- When PR review delay is unacceptable
- Automated releases from CI/CD

---

## Local/Manual Publishing

For development testing or when CI/CD is unavailable.

### Prerequisites

1. **NPM Token**: Get an automation token from [npmjs.com](https://www.npmjs.com/settings/~/tokens)
2. **Scope Access**: Token must have publish access to `@hive-academy` scope

### Step-by-Step Guide

```bash
# 1. Set NPM token
export NPM_TOKEN=<your_npm_automation_token>

# 2. Preview version changes (dry-run)
npm run release:version:dry -- --projects=@hive-academy/angular-3d

# 3. Create version (if dry-run looks good)
npm run release:version -- --projects=@hive-academy/angular-3d

# 4. Publish to npm
npm run release:publish -- --projects=@hive-academy/angular-3d

# 5. Push to GitHub
git push && git push --tags
```

### Manual GitHub Release

If the automated GitHub Release fails:

```bash
# Using GitHub CLI
gh release create @hive-academy/angular-3d@1.0.0 \
  --title "@hive-academy/angular-3d@1.0.0" \
  --notes-file CHANGELOG.md
```

---

## Versioning Strategy

### Semantic Versioning

All packages follow [Semantic Versioning](https://semver.org/):

| Version                   | When to Use                        | Example                          |
| ------------------------- | ---------------------------------- | -------------------------------- |
| **MAJOR** (1.0.0 → 2.0.0) | Breaking changes                   | Removing APIs, changing behavior |
| **MINOR** (1.0.0 → 1.1.0) | New features (backward compatible) | New components, new options      |
| **PATCH** (1.0.0 → 1.0.1) | Bug fixes (backward compatible)    | Fixes, performance improvements  |

### Automatic Version Detection

Version bumps are automatically determined from conventional commits:

| Commit Type        | Version Bump | Example                                    |
| ------------------ | ------------ | ------------------------------------------ |
| `feat:`            | MINOR        | `feat(angular-3d): add sphere component`   |
| `fix:`             | PATCH        | `fix(angular-3d): resolve memory leak`     |
| `BREAKING CHANGE:` | MAJOR        | Footer in commit message                   |
| `feat!:`           | MAJOR        | `feat(angular-3d)!: remove deprecated API` |

### Independent Versioning

Each library is versioned independently:

- `@hive-academy/angular-3d` can be at `2.0.0`
- `@hive-academy/angular-gsap` can be at `1.5.0`

---

## Pre-Release Checklist

Before creating a release:

- [ ] All tests passing: `npx nx run-many -t test`
- [ ] All lints passing: `npx nx run-many -t lint`
- [ ] All type-checks passing: `npx nx run-many -t typecheck`
- [ ] All builds successful: `npx nx run-many -t build`
- [ ] CHANGELOG.md preview reviewed (dry-run)
- [ ] Version bump type is correct (major/minor/patch)
- [ ] No uncommitted changes: `git status`
- [ ] Main branch is up to date: `git pull origin main`

Run all checks at once:

```bash
npx nx run-many -t lint test typecheck build
```

---

## Troubleshooting

### Authentication Errors

**Problem**: `npm publish` fails with 401 Unauthorized

**Solution**:

```bash
# Verify your token is valid
npm whoami

# Check token has correct scope
npm access ls-packages @hive-academy
```

### Version Already Exists

**Problem**: `npm publish` fails with "version already exists"

**Solution**:

```bash
# Check published versions
npm view @hive-academy/angular-3d versions --json

# If tag exists but package doesn't, delete the tag
git tag -d @hive-academy/angular-3d@1.0.0
git push origin :refs/tags/@hive-academy/angular-3d@1.0.0
```

### CI Workflow Fails at Validation

**Problem**: GitHub Actions workflow fails during lint/test/build

**Solution**:

```bash
# Reproduce locally
npx nx run-many -t lint test typecheck build --verbose

# Fix issues, then push fix
git add .
git commit -m "fix(ci): resolve validation failures"
git push
```

### PR Validation Fails

**Problem**: Release PR shows validation failed

**Solution**:

1. Check the PR checks for specific error
2. Fix on main branch
3. Update the PR (it will re-run validation)

### Build Artifacts Missing

**Problem**: Workflow fails with "dist/ not found"

**Solution**:

```bash
# Ensure build runs successfully
npx nx run-many -t build

# Check dist directory exists
ls dist/libs/angular-3d/
ls dist/libs/angular-gsap/
```

---

## Rollback Procedures

### Deprecate a Bad Version

If you published a broken version:

```bash
# Mark version as deprecated (users see warning on install)
npm deprecate @hive-academy/angular-3d@1.0.0 "This version has issues, please upgrade to 1.0.1"
```

### Unpublish (Within 72 Hours)

If you need to completely remove a version (only works within 72 hours):

```bash
npm unpublish @hive-academy/angular-3d@1.0.0
```

### Publish Corrected Version

1. Fix the issue
2. Bump to next patch version
3. Publish using standard workflow

---

## Repository Setup (One-Time)

### Create Release Branches

```bash
git checkout main
git pull origin main

# Create angular-3d release branch
git checkout -b release/angular-3d
git push -u origin release/angular-3d

# Create angular-gsap release branch
git checkout main
git checkout -b release/angular-gsap
git push -u origin release/angular-gsap

git checkout main
```

### Configure Branch Protection (GitHub Settings)

For both `release/angular-3d` and `release/angular-gsap`:

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `release/angular-3d` (or `release/angular-gsap`)
3. Enable:
   - Require a pull request before merging
   - Require approvals: 1
   - Require status checks to pass before merging
   - Status checks: `validate-release-pr`
   - Do not allow bypassing the above settings

### Configure NPM_TOKEN Secret

1. Go to Settings → Secrets and variables → Actions
2. Add secret: `NPM_TOKEN`
3. Value: Your npm automation token

---

## Reference

### npm Scripts

| Script                         | Description                                |
| ------------------------------ | ------------------------------------------ |
| `npm run release:version`      | Create version, changelog, and tag         |
| `npm run release:version:dry`  | Preview version changes (no modifications) |
| `npm run release:publish`      | Publish to npm                             |
| `npm run release`              | Full release (version + publish)           |
| `npm run release:prepare:a3d`  | Prepare angular-3d release                 |
| `npm run release:prepare:gsap` | Prepare angular-gsap release               |
| `npm run release:pr:a3d`       | Create PR for angular-3d release           |
| `npm run release:pr:gsap`      | Create PR for angular-gsap release         |

### GitHub Workflows

| Workflow                | Trigger            | Purpose                         |
| ----------------------- | ------------------ | ------------------------------- |
| `publish.yml`           | Tag push           | Tag-based publish (emergency)   |
| `publish-on-branch.yml` | Push to release/\* | Branch-based publish (standard) |
| `release-pr-check.yml`  | PR to release/\*   | Validate release PR             |
| `ci.yml`                | Push/PR to main    | Standard CI validation          |

### Verification Commands

```bash
# Check published versions
npm view @hive-academy/angular-3d versions --json
npm view @hive-academy/angular-gsap versions --json

# Verify package contents
npm pack @hive-academy/angular-3d --dry-run
npm pack @hive-academy/angular-gsap --dry-run

# Verify provenance
npm audit signatures
```
