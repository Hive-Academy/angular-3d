# Requirements Document - TASK_2025_027

## Introduction

Establish a production-ready NPM publishing infrastructure for two open-source Angular libraries in an Nx monorepo. The workspace contains `@hive-academy/angular-3d` (Three.js wrapper) and `@hive-academy/angular-gsap` (GSAP wrapper), currently at version 0.0.1 with basic Nx release configuration. The business goal is to enable reliable, automated package publishing to the npm registry while maintaining manual override capabilities for controlled releases. This infrastructure will allow the open-source community to consume these libraries through standard npm installation, increasing adoption and establishing the project as a professionally maintained open-source solution.

## Scope & Goals

### What's In Scope

1. Automated CI/CD publishing workflow triggered by git tags
2. Manual publishing workflow via command-line interface
3. NPM authentication configuration (NPM_TOKEN management)
4. Pre-publish validation pipeline (tests, builds, type-checking)
5. Versioning automation using Nx release tooling
6. Package provenance for supply chain security
7. GitHub Release creation synchronized with npm publishing
8. Changelog generation from conventional commits
9. Independent versioning for both libraries (publish separately)
10. Dry-run capabilities for testing publish workflows

### What's Out of Scope

1. Package registry alternatives (GitHub Packages, private registries)
2. Library code changes or refactoring
3. Monorepo structure modifications
4. Documentation website deployment
5. Package download analytics or monitoring
6. Breaking change migration tooling
7. Canary/beta release channels (future enhancement)
8. Automated dependency updates for published packages

### Business Goals

- **Discoverability**: Enable npm installation for open-source consumers
- **Trust**: Establish provenance and professional release process
- **Automation**: Reduce manual work in versioning and publishing
- **Safety**: Prevent accidental publishes through validation gates
- **Flexibility**: Support both automated and manual release workflows

---

## Requirements

### Requirement 1: Automated CI/CD Publishing Workflow

**User Story:** As a library maintainer, I want automated package publishing when I create git tags, so that releases are published to npm without manual intervention.

#### Acceptance Criteria

1. WHEN a git tag matching pattern `@hive-academy/angular-3d@*` OR `@hive-academy/angular-gsap@*` is pushed to the repository THEN the publish workflow SHALL trigger automatically
2. WHEN the publish workflow runs THEN it SHALL authenticate with npm using `NPM_TOKEN` from GitHub secrets
3. WHEN the workflow executes THEN it SHALL run the following validation steps in sequence:
   - Install dependencies via `npm ci`
   - Execute `npx nx run-many -t lint` for code quality validation
   - Execute `npx nx run-many -t test` for unit test verification
   - Execute `npx nx run-many -t typecheck` for TypeScript validation
   - Execute `npx nx run-many -t build` for production build verification
4. WHEN all validation steps pass THEN the workflow SHALL publish the package to npm registry using `npx nx release publish`
5. WHEN package publishing succeeds THEN the workflow SHALL create a GitHub Release with:
   - Release title matching tag name
   - Release notes generated from CHANGELOG.md
   - Tag reference linking to commit
6. WHEN any validation step fails THEN the workflow SHALL halt execution and SHALL NOT publish packages
7. WHEN the workflow fails THEN it SHALL provide clear error messages indicating which validation step failed
8. WHEN publishing succeeds THEN the workflow SHALL enable npm provenance for supply chain attestation

### Requirement 2: Manual Publishing Workflow

**User Story:** As a library maintainer, I want to manually publish packages from my local development environment, so that I can control the release timing and perform emergency hotfixes.

#### Acceptance Criteria

1. WHEN the maintainer runs `npx nx release --projects=@hive-academy/angular-3d` THEN the workflow SHALL:
   - Prompt for version bump type (major, minor, patch)
   - Update package.json version
   - Run pre-version build command (`npx nx run-many -t build`)
   - Generate CHANGELOG.md entry from conventional commits
   - Create git commit with version changes
   - Create git tag matching `@hive-academy/angular-3d@X.Y.Z` pattern
2. WHEN the maintainer runs `npx nx release publish --projects=@hive-academy/angular-3d` THEN the workflow SHALL:
   - Verify local `NPM_TOKEN` environment variable exists
   - Authenticate with npm registry
   - Publish built package from `dist/libs/angular-3d` directory
   - Report publishing success with package URL
3. WHEN the maintainer runs `npx nx release --dry-run` THEN the workflow SHALL:
   - Display version changes that would occur
   - Show CHANGELOG.md preview
   - Display git operations that would execute
   - NOT modify any files or create commits/tags
4. WHEN the maintainer wants to publish both libraries THEN they SHALL run `npx nx release --projects=@hive-academy/angular-3d,@hive-academy/angular-gsap`
5. WHEN manual publish fails due to missing NPM_TOKEN THEN the workflow SHALL display error message: "NPM_TOKEN environment variable not set. Run: export NPM_TOKEN=your_token_here"
6. WHEN manual publish is attempted without built packages THEN the workflow SHALL automatically trigger build via `preVersionCommand` configuration

### Requirement 3: Versioning Strategy

**User Story:** As a library maintainer, I want independent versioning for each library using semantic versioning, so that breaking changes in one library don't force version bumps in unrelated libraries.

#### Acceptance Criteria

1. WHEN versioning is applied THEN each library SHALL maintain its own version number independently
2. WHEN the maintainer creates a release THEN the version number SHALL follow semantic versioning (MAJOR.MINOR.PATCH):
   - MAJOR: Breaking changes (e.g., 1.0.0 → 2.0.0)
   - MINOR: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
   - PATCH: Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)
3. WHEN version is determined THEN it SHALL be resolved from git tags using `currentVersionResolver: "git-tag"` configuration
4. WHEN no git tag exists THEN version SHALL fallback to reading from `package.json` in `dist/libs/{projectRoot}` using `fallbackCurrentVersionResolver: "disk"`
5. WHEN version is updated THEN the following files SHALL be modified:
   - `dist/libs/angular-3d/package.json` (or angular-gsap)
   - Root CHANGELOG.md
   - Git tag created: `@hive-academy/angular-3d@X.Y.Z`
6. WHEN conventional commits exist since last release THEN version bump type SHALL be automatically determined:
   - `feat:` commits → MINOR bump
   - `fix:` commits → PATCH bump
   - `BREAKING CHANGE:` footer → MAJOR bump
7. WHEN the maintainer overrides automatic versioning THEN they SHALL specify explicit version via `--version` flag

### Requirement 4: NPM Authentication & Security

**User Story:** As a library maintainer, I want secure npm authentication without exposing tokens in code, so that packages are published safely with supply chain provenance.

#### Acceptance Criteria

1. WHEN CI workflow authenticates THEN it SHALL use `NPM_TOKEN` from GitHub repository secrets
2. WHEN manual publish authenticates THEN it SHALL read `NPM_TOKEN` from environment variable
3. WHEN NPM_TOKEN is configured THEN it SHALL have publish permissions for `@hive-academy` scope
4. WHEN CI workflow publishes THEN it SHALL enable npm provenance using `--provenance` flag
5. WHEN provenance is enabled THEN the published package SHALL contain attestation linking to:
   - GitHub repository
   - Commit SHA
   - Workflow run URL
6. WHEN authentication fails THEN the workflow SHALL report error without exposing token value
7. WHEN .npmrc file is needed THEN it SHALL be generated dynamically in CI and SHALL NOT be committed to repository
8. WHEN local development requires authentication THEN documentation SHALL guide maintainer to create `~/.npmrc` with:
   ```
   //registry.npmjs.org/:_authToken=${NPM_TOKEN}
   ```

### Requirement 5: Pre-Publish Validation Pipeline

**User Story:** As a library maintainer, I want comprehensive validation before publishing, so that broken packages are never released to npm.

#### Acceptance Criteria

1. WHEN pre-publish validation runs THEN it SHALL execute these stages in order:
   - **Stage 1**: Dependency installation (`npm ci`)
   - **Stage 2**: Linting (`npx nx run-many -t lint`)
   - **Stage 3**: Unit tests (`npx nx run-many -t test`)
   - **Stage 4**: Type checking (`npx nx run-many -t typecheck`)
   - **Stage 5**: Production build (`npx nx run-many -t build`)
2. WHEN any validation stage fails THEN subsequent stages SHALL NOT execute
3. WHEN linting fails THEN error output SHALL display ESLint violations with file paths and line numbers
4. WHEN tests fail THEN error output SHALL display failing test names and assertion details
5. WHEN type-checking fails THEN error output SHALL display TypeScript compilation errors
6. WHEN build fails THEN error output SHALL display build error messages
7. WHEN all validations pass THEN the workflow SHALL proceed to package publishing
8. WHEN validation is run locally THEN the maintainer SHALL execute `npm run build:affected && npm run lint:affected && npm run typecheck:affected` before manual publish
9. WHEN pre-version command runs THEN it SHALL execute full build for all libraries via `preVersionCommand: "npx nx run-many -t build"` (configured in nx.json)

### Requirement 6: Changelog Generation

**User Story:** As a library user, I want automatically generated changelogs, so that I can understand what changed between versions.

#### Acceptance Criteria

1. WHEN a release is created THEN a CHANGELOG.md file SHALL be generated/updated in the workspace root
2. WHEN changelog is generated THEN it SHALL parse conventional commits since last release tag
3. WHEN changelog entry is created THEN it SHALL include these sections (if applicable):
   - **Features**: Commits with `feat:` type
   - **Bug Fixes**: Commits with `fix:` type
   - **Breaking Changes**: Commits with `BREAKING CHANGE:` footer
   - **Other**: Commits with `chore:`, `docs:`, `refactor:`, `perf:`, `test:` types
4. WHEN commit has scope THEN changelog SHALL group by scope: `feat(angular-3d):` → under angular-3d section
5. WHEN changelog is formatted THEN it SHALL follow this structure:

   ```markdown
   # Changelog

   ## [@hive-academy/angular-3d@1.0.0] - 2025-12-25

   ### Features

   - **angular-3d**: add box component with material support
   - **angular-3d**: add orbit controls component

   ### Bug Fixes

   - **angular-3d**: fix render loop cleanup

   ## [@hive-academy/angular-3d@0.9.0] - 2025-12-20

   ...
   ```

6. WHEN changelog is updated THEN the changes SHALL be committed as part of the release commit
7. WHEN dry-run mode is used THEN changelog preview SHALL be displayed without modifying files

### Requirement 7: GitHub Release Creation

**User Story:** As a library user, I want GitHub Releases synchronized with npm versions, so that I can track releases and download source code snapshots.

#### Acceptance Criteria

1. WHEN CI publish workflow succeeds THEN it SHALL create a GitHub Release using `gh release create` command
2. WHEN GitHub Release is created THEN it SHALL include:
   - **Tag**: Matching the git tag (e.g., `@hive-academy/angular-3d@1.0.0`)
   - **Title**: Same as tag name
   - **Body**: Extracted from CHANGELOG.md for this version
   - **Assets**: None (source code auto-attached by GitHub)
3. WHEN release notes are extracted THEN they SHALL contain only the section for the current version from CHANGELOG.md
4. WHEN manual publish is performed THEN GitHub Release creation SHALL be optional (maintainer uses `gh release create` manually if desired)
5. WHEN GitHub Release creation fails THEN it SHALL NOT fail the entire publish workflow (package is already on npm)
6. WHEN GitHub Release exists for a tag THEN workflow SHALL skip recreation and log warning

---

## Non-Functional Requirements

### Performance Requirements

- **Publish Workflow Execution Time**: Complete CI publish workflow in under 5 minutes (dependency caching enabled)
- **Validation Pipeline**: Complete all pre-publish validation stages in under 3 minutes
- **Dry-Run Responsiveness**: Display dry-run results within 10 seconds (no network operations)

### Security Requirements

- **Token Management**: NPM_TOKEN stored in GitHub Secrets with organization-level access control
- **Provenance**: All automated publishes include npm provenance attestation
- **Least Privilege**: CI workflow uses `permissions: id-token: write, contents: write` (minimal required)
- **Secret Exposure Prevention**: No tokens logged in workflow output or error messages
- **Dependency Security**: Use `npm ci` for reproducible dependency installation

### Scalability Requirements

- **Multi-Library Support**: Workflow supports publishing 2-10 libraries without modification
- **Concurrent Publishes**: Support publishing multiple libraries in parallel (future enhancement)
- **Tag Volume**: Handle up to 100 release tags per year without performance degradation

### Reliability Requirements

- **Idempotency**: Re-running publish workflow for existing tag SHALL skip publishing and report success
- **Atomic Operations**: Package version update, changelog, git tag creation SHALL be atomic (all succeed or all fail)
- **Rollback Capability**: Failed publishes SHALL NOT leave workspace in dirty state (uncommitted changes)
- **Network Resilience**: Retry npm registry operations up to 3 times with exponential backoff

### Maintainability Requirements

- **Documentation**: Provide README.md section explaining publish workflows (manual and automated)
- **Error Messages**: All failures display actionable error messages with resolution steps
- **Workflow Visibility**: GitHub Actions workflow status visible on repository main page
- **Audit Trail**: All publishes traceable to git tag, commit SHA, and workflow run URL

---

## Stakeholder Analysis

### Primary Stakeholders

**Library Maintainers (Developer Team)**

- **Needs**: Easy versioning, automated publishing, rollback capabilities
- **Pain Points**: Manual version management is error-prone, forgetting to update changelogs
- **Success Criteria**: Publish new version in under 2 minutes (manual), automated CI publish works reliably

**Open-Source Users (Consumers)**

- **Needs**: Reliable package availability on npm, clear changelogs, version transparency
- **Pain Points**: Stale packages, unclear breaking changes, supply chain security concerns
- **Success Criteria**: Packages always available via `npm install`, provenance verifiable, changelogs comprehensive

**Security & Compliance Team**

- **Needs**: Supply chain attestation, token security, audit trail
- **Pain Points**: Unverified package sources, token leakage risks
- **Success Criteria**: All packages have provenance, no token exposure incidents

### Secondary Stakeholders

**DevOps/Operations Team**

- **Needs**: CI/CD workflow reliability, monitoring, maintenance
- **Pain Points**: Workflow failures difficult to debug, unclear ownership
- **Success Criteria**: Workflow failures auto-alert, clear runbooks for common issues

**Future Contributors (External Developers)**

- **Needs**: Clear contribution guidelines, understanding of release process
- **Pain Points**: Unclear how changes get released
- **Success Criteria**: CONTRIBUTING.md explains versioning and publish workflow

### Stakeholder Impact Matrix

| Stakeholder       | Impact Level | Involvement       | Success Criteria                                |
| ----------------- | ------------ | ----------------- | ----------------------------------------------- |
| Maintainers       | High         | Daily Use         | Manual publish under 2 min, zero failed deploys |
| Open-Source Users | High         | Package Consumers | 100% uptime on npm, changelogs for all releases |
| Security Team     | Medium       | Audit/Review      | 100% provenance coverage, zero token leaks      |
| DevOps Team       | Medium       | CI Maintenance    | <5% workflow failure rate, clear error messages |
| Contributors      | Low          | Occasional        | Documentation complete, process transparent     |

---

## Risk Analysis

### Technical Risks

**Risk 1: NPM Token Exposure**

- **Probability**: Low
- **Impact**: Critical
- **Description**: NPM_TOKEN accidentally committed or logged, allowing unauthorized publishes
- **Mitigation**:
  - Use GitHub Secrets for CI token storage
  - Add `.npmrc` to `.gitignore`
  - Configure workflow to never log NPM_TOKEN value
  - Use environment variable for local development
- **Contingency**: Revoke token immediately, rotate secrets, audit publish history

**Risk 2: Accidental Breaking Change Publish**

- **Probability**: Medium
- **Impact**: High
- **Description**: Breaking change published as minor/patch version, breaking user applications
- **Mitigation**:
  - Enforce conventional commits via commitlint (already configured)
  - Require `BREAKING CHANGE:` footer for breaking changes
  - Use dry-run mode for review before publish
  - Maintain comprehensive test coverage
- **Contingency**: Publish new patch version with fix, deprecate broken version, communicate via GitHub Issue

**Risk 3: CI Publish Workflow Failure**

- **Probability**: Medium
- **Impact**: Medium
- **Description**: Automated publish fails due to npm registry outage, network issues, or validation failures
- **Mitigation**:
  - Implement retry logic for npm operations (3 attempts)
  - Cache dependencies to reduce network dependency
  - Maintain manual publish workflow as fallback
  - Monitor npm registry status before releases
- **Contingency**: Use manual publish workflow, delay release if critical registry issue

**Risk 4: Version Collision**

- **Probability**: Low
- **Impact**: Medium
- **Description**: Attempting to publish version that already exists on npm
- **Mitigation**:
  - Nx release automatically increments version from git tags
  - npm registry rejects duplicate versions
  - Workflow idempotency check skips re-publish
- **Contingency**: Manually increment version, re-tag, retry publish

**Risk 5: Build Artifacts Corruption**

- **Probability**: Low
- **Impact**: High
- **Description**: Published package contains incorrect/corrupted build artifacts
- **Mitigation**:
  - Always build from clean state in CI (`npm ci` + fresh build)
  - Run full test suite on built packages
  - Use `packageRoot: "dist/{projectRoot}"` to ensure correct build location
  - Manual smoke test after first publish
- **Contingency**: Unpublish broken version within 72 hours (npm policy), publish hotfix

### Business Risks

**Risk 6: Premature 1.0.0 Release**

- **Probability**: Medium
- **Impact**: Medium
- **Description**: Releasing 1.0.0 while APIs are still unstable, leading to frequent breaking changes
- **Mitigation**:
  - Keep version below 1.0.0 during beta phase (0.x.x allows breaking changes in minor versions)
  - Document API stability guarantees clearly
  - Gather community feedback before 1.0.0
- **Contingency**: Clearly communicate breaking changes, provide migration guides

**Risk 7: Insufficient Community Adoption**

- **Probability**: Low
- **Impact**: Medium
- **Description**: Published packages receive low downloads due to poor discoverability
- **Mitigation**:
  - Comprehensive README.md with examples
  - Detailed CHANGELOG.md for transparency
  - GitHub Release notes for visibility
  - npm package keywords for search optimization
- **Contingency**: Marketing efforts (blog posts, demos), Angular community outreach

### Integration Risks

**Risk 8: Nx Release Tool Breaking Changes**

- **Probability**: Low
- **Impact**: Medium
- **Description**: Future Nx updates change release API, breaking publish workflows
- **Mitigation**:
  - Pin Nx version in package.json (currently 22.2.6)
  - Review Nx release notes before major upgrades
  - Test publish workflow after Nx upgrades
- **Contingency**: Delay Nx upgrade, migrate to new release API, or use alternative tooling

### Risk Matrix

| Risk                       | Probability | Impact   | Score | Mitigation Priority |
| -------------------------- | ----------- | -------- | ----- | ------------------- |
| NPM Token Exposure         | Low         | Critical | 7     | High                |
| Accidental Breaking Change | Medium      | High     | 6     | High                |
| CI Workflow Failure        | Medium      | Medium   | 4     | Medium              |
| Build Artifacts Corruption | Low         | High     | 5     | Medium              |
| Version Collision          | Low         | Medium   | 3     | Low                 |
| Premature 1.0.0 Release    | Medium      | Medium   | 4     | Medium              |
| Insufficient Adoption      | Low         | Medium   | 3     | Low                 |
| Nx Release Tool Changes    | Low         | Medium   | 3     | Low                 |

---

## Dependencies & Constraints

### Dependencies

**External Dependencies:**

1. **NPM Registry**: Public npm registry must be available for publishing
2. **GitHub Actions**: CI/CD runtime environment for automated workflows
3. **Nx Release Tool**: Nx version 22.2.6 with `nx release` commands
4. **Git Tags**: Versioning relies on git tag annotations

**Internal Dependencies:**

1. **Existing CI Workflow**: `.github/workflows/ci.yml` must continue working (no conflicts)
2. **Build Targets**: Both libraries must have functional `build` target
3. **Test Targets**: Both libraries must have functional `test` target
4. **Commit Conventions**: Existing commitlint rules enforced in `.husky/commit-msg`

### Constraints

**Technical Constraints:**

1. **Nx Version**: Must use Nx 22.2.6 (current workspace version)
2. **Node Version**: CI uses Node 20 (existing CI configuration)
3. **Package Scope**: Packages must remain under `@hive-academy/` scope
4. **Registry**: Public npm registry only (no private registry support)

**Process Constraints:**

1. **Conventional Commits**: All commits must follow commitlint rules (enforced by pre-commit hook)
2. **Semantic Versioning**: Must follow semver strictly (industry standard expectation)
3. **Monorepo Structure**: Must publish from `dist/libs/{projectRoot}` (Nx convention)

**Security Constraints:**

1. **Token Storage**: NPM_TOKEN must never be committed to repository
2. **Provenance**: CI publishes must include npm provenance (supply chain security)
3. **Permissions**: CI workflow uses minimal required GitHub permissions

---

## Success Metrics

### Functional Success Criteria

- [ ] Automated publish workflow successfully publishes packages when git tags are pushed
- [ ] Manual publish workflow completes in under 2 minutes (from version command to npm confirmation)
- [ ] Dry-run mode accurately previews changes without modifying any files
- [ ] All pre-publish validation stages (lint, test, typecheck, build) execute correctly
- [ ] Changelogs generate automatically with correct sections and formatting
- [ ] GitHub Releases created automatically with correct release notes
- [ ] NPM provenance attestation visible on published packages
- [ ] Both libraries can be published independently without conflicts

### Quality Success Criteria

- [ ] Zero failed publishes in first month of operation
- [ ] Zero npm token exposure incidents
- [ ] 100% of releases have associated CHANGELOG.md entries
- [ ] 100% of automated publishes have GitHub Release counterparts
- [ ] Documentation covers both automated and manual workflows with examples

### User Acceptance Criteria

- [ ] Maintainer can version and publish a package in under 2 minutes (manual workflow)
- [ ] Open-source user can install both packages via `npm install @hive-academy/angular-3d`
- [ ] Consumer can view package provenance on npm package page
- [ ] Contributor can understand release process from documentation alone

---

## Testing Strategy

### Unit Testing (Not Applicable)

Publishing infrastructure is validated through integration and end-to-end testing, not unit tests.

### Integration Testing

**Test 1: Local Dry-Run Validation**

- Execute: `npx nx release --dry-run --projects=@hive-academy/angular-3d`
- Verify: Version calculation correct, changelog preview accurate, no files modified

**Test 2: Local Build Pre-Publish**

- Execute: `npx nx run-many -t build`
- Verify: Both libraries build successfully to `dist/libs/angular-3d` and `dist/libs/angular-gsap`

**Test 3: NPM Authentication**

- Set: `export NPM_TOKEN=<test-token>`
- Execute: `npm whoami --registry=https://registry.npmjs.org/`
- Verify: Authenticated user displayed

### End-to-End Testing

**Test 4: Full Manual Publish Workflow**

1. Create feature branch
2. Make commit with `feat(angular-3d): test feature` message
3. Run `npx nx release --dry-run --projects=@hive-academy/angular-3d`
4. Verify version bump from 0.0.1 → 0.1.0 (minor bump for feat)
5. Run `npx nx release --projects=@hive-academy/angular-3d`
6. Verify git tag created: `@hive-academy/angular-3d@0.1.0`
7. Verify CHANGELOG.md updated
8. Run `npx nx release publish --projects=@hive-academy/angular-3d`
9. Verify package published to npm
10. Run `npm view @hive-academy/angular-3d@0.1.0`
11. Verify package metadata correct

**Test 5: Automated CI Publish Workflow**

1. Push git tag: `git push origin @hive-academy/angular-3d@0.1.0`
2. Monitor GitHub Actions workflow execution
3. Verify all validation stages pass (lint, test, typecheck, build)
4. Verify package published to npm
5. Verify GitHub Release created with correct release notes
6. Verify npm provenance attestation exists
7. Install package in test project: `npm install @hive-academy/angular-3d@0.1.0`
8. Verify installation succeeds

**Test 6: Failure Scenario - Failed Tests**

1. Introduce failing test in `libs/angular-3d/src/lib/test.spec.ts`
2. Push git tag to trigger CI publish
3. Verify workflow fails at test stage
4. Verify package NOT published to npm
5. Verify error message clearly indicates test failure

**Test 7: Independent Library Publishing**

1. Publish `@hive-academy/angular-3d@0.1.0`
2. Verify `@hive-academy/angular-gsap` remains at 0.0.1
3. Publish `@hive-academy/angular-gsap@0.2.0`
4. Verify `@hive-academy/angular-3d` remains at 0.1.0
5. Confirm independent versioning works correctly

---

## Quality Gates

Before delegating to software-architect, verify:

- [x] All requirements follow SMART criteria (Specific, Measurable, Achievable, Relevant, Time-bound)
- [x] Acceptance criteria in proper WHEN/THEN/SHALL format
- [x] Stakeholder analysis complete with impact matrix
- [x] Risk assessment with mitigation strategies and risk matrix
- [x] Success metrics clearly defined (functional, quality, user acceptance)
- [x] Dependencies identified and documented (external, internal, constraints)
- [x] Non-functional requirements specified (performance, security, scalability, reliability, maintainability)
- [x] Compliance requirements addressed (npm provenance, supply chain security)
- [x] Performance benchmarks established (5 min CI, 2 min manual)
- [x] Security requirements documented (token management, provenance, least privilege)
- [x] Testing strategy defined (integration and E2E tests)
- [x] Scope boundaries clear (in-scope vs out-of-scope)

---

## Appendix: Reference Documentation

### Nx Release Documentation

- [Nx Release Overview](https://nx.dev/features/manage-releases)
- [Nx Release Publish](https://nx.dev/nx-api/nx/documents/release-publish)
- [Conventional Commits](https://www.conventionalcommits.org/)

### NPM Publishing

- [npm publish Documentation](https://docs.npmjs.com/cli/v10/commands/npm-publish)
- [npm Provenance](https://docs.npmjs.com/generating-provenance-statements)
- [Scoped Packages](https://docs.npmjs.com/cli/v10/using-npm/scope)

### GitHub Actions

- [Publishing Node.js Packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)
- [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)

### Current Workspace Configuration

- `nx.json`: Contains `release.version.preVersionCommand` (build before version)
- `libs/angular-3d/project.json`: Contains `release.version` config and `nx-release-publish` target
- `libs/angular-gsap/project.json`: Contains `release.version` config and `nx-release-publish` target
- `.github/workflows/ci.yml`: Existing CI workflow (lint, test, build, e2e)
- `package.json`: Commitlint configured with conventional commits
