# Publishing Guide

This guide covers everything you need to know about publishing the Angular 3D libraries to npm.

## Libraries

| Package                      | Description                                | npm                                                             |
| ---------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `@hive-academy/angular-3d`   | Angular wrapper for Three.js 3D graphics   | [npm](https://www.npmjs.com/package/@hive-academy/angular-3d)   |
| `@hive-academy/angular-gsap` | Angular wrapper for GSAP scroll animations | [npm](https://www.npmjs.com/package/@hive-academy/angular-gsap) |

## Release Workflow (Automated with Release Please)

We use [Release Please](https://github.com/googleapis/release-please) from Google for fully automated releases.

### How It Works

```
1. Developer makes changes and commits using conventional commits
2. PRs are merged to main
3. Release Please analyzes commits and creates a "Release PR"
4. When Release PR is merged → package is published to npm
```

### Benefits

- ✅ **Fully automated** - No manual version bumping
- ✅ **CHANGELOG generated** - From conventional commits
- ✅ **Reviewable** - Release PR can be reviewed before publishing
- ✅ **No branch protection issues** - Release Please creates its own PRs
- ✅ **Monorepo support** - Each package is versioned independently

---

## Standard Release Flow

### 1. Develop with Conventional Commits

Use [conventional commits](https://www.conventionalcommits.org/) with package scope:

```bash
# For @hive-academy/angular-3d
git commit -m "feat(angular-3d): add new primitive component"
git commit -m "fix(angular-3d): resolve memory leak in scene"

# For @hive-academy/angular-gsap
git commit -m "feat(angular-gsap): add parallax directive"
git commit -m "fix(angular-gsap): fix scroll trigger timing"
```

### 2. Merge to Main

When your PR is merged to `main`, Release Please will:

- Analyze all commits since the last release
- Create or update a "Release PR" with:
  - Version bump based on commit types
  - Updated CHANGELOG.md
  - Updated package.json version

### 3. Review and Merge Release PR

When you're ready to publish:

1. Review the Release PR created by Release Please
2. Verify the version bump and changelog look correct
3. Merge the Release PR

### 4. Automatic Publishing

When the Release PR is merged:

- Package is built and validated
- Published to npm with provenance
- Git tag is created
- GitHub Release is created

---

## Commit Types and Version Bumps

| Commit Type                                       | Example                                  | Version Bump          |
| ------------------------------------------------- | ---------------------------------------- | --------------------- |
| `feat:`                                           | `feat(angular-3d): add box primitive`    | Minor (1.0.0 → 1.1.0) |
| `fix:`                                            | `fix(angular-3d): resolve memory leak`   | Patch (1.0.0 → 1.0.1) |
| `feat!:` or `BREAKING CHANGE:`                    | `feat(angular-3d)!: change API`          | Major (1.0.0 → 2.0.0) |
| `perf:`                                           | `perf(angular-3d): optimize render loop` | Patch                 |
| `docs:`, `chore:`, `style:`, `test:`, `refactor:` | Various                                  | No release            |

### Scoping for Monorepo

Use the package name (without `@hive-academy/`) as the scope:

```bash
# Affects @hive-academy/angular-3d
feat(angular-3d): description

# Affects @hive-academy/angular-gsap
fix(angular-gsap): description

# Affects both (or workspace-level)
chore: update dependencies
```

---

## Emergency Manual Release

For emergency hotfixes that need to bypass the normal flow:

### Using Git Tags

```bash
# 1. Ensure version is updated in package.json
cd libs/angular-3d
npm version patch  # or minor, major

# 2. Commit the change
git add .
git commit -m "chore(release): emergency release @hive-academy/angular-3d@1.0.1"

# 3. Create and push tag
git tag "@hive-academy/angular-3d@1.0.1"
git push origin main --tags
```

The tag-based workflow will:

- Run validation
- Publish to npm
- Create GitHub Release

⚠️ **Note**: This bypasses the Release Please flow. After an emergency release, you may need to update `.release-please-manifest.json` to sync the version.

---

## Configuration Files

### `release-please-config.json`

Configuration for Release Please:

```json
{
  "packages": {
    "libs/angular-3d": {
      "package-name": "@hive-academy/angular-3d",
      "release-type": "node"
    },
    "libs/angular-gsap": {
      "package-name": "@hive-academy/angular-gsap",
      "release-type": "node"
    }
  }
}
```

### `.release-please-manifest.json`

Tracks current versions:

```json
{
  "libs/angular-3d": "1.0.0",
  "libs/angular-gsap": "1.0.0"
}
```

---

## Troubleshooting

### Release PR Not Created

1. Check that commits use conventional commit format
2. Ensure commits have the correct scope (`angular-3d` or `angular-gsap`)
3. Check GitHub Actions for errors

### Version Mismatch After Manual Release

If you did an emergency release, update `.release-please-manifest.json`:

```json
{
  "libs/angular-3d": "1.0.1", // Update to current version
  "libs/angular-gsap": "1.0.0"
}
```

### NPM Publish Failed

1. Check that `NPM_TOKEN` secret is valid
2. Verify the package isn't already published with that version
3. Check npm registry status

---

## Workflow Files

| File                                   | Purpose                      |
| -------------------------------------- | ---------------------------- |
| `.github/workflows/release-please.yml` | Main release workflow        |
| `.github/workflows/publish.yml`        | Emergency tag-based releases |
| `.github/workflows/ci.yml`             | PR validation                |
| `release-please-config.json`           | Release Please configuration |
| `.release-please-manifest.json`        | Version tracking             |
