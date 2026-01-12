# Contributing to Angular 3D Workspace

Thank you for contributing to our Angular libraries!

## Development Workflow

1. **Clone repository**:

   ```bash
   git clone <repository-url>
   cd angular-3d-workspace
   npm install
   ```

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
