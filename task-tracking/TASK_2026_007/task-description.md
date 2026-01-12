# Requirements Document - TASK_2026_007

## Introduction

### Business Context

The Angular 3D workspace provides two reusable Angular libraries (`@hive-academy/angular-3d` and `@hive-academy/angular-gsap`) for building immersive web experiences. The demo application (`angular-3d-demo`) serves as both a showcase and integration testing ground for these libraries. Currently, the demo application can only be viewed locally during development, limiting accessibility for stakeholders, potential users, and the broader developer community.

Deploying the demo application to GitHub Pages will provide a publicly accessible showcase that demonstrates library capabilities, serves as live documentation, and increases adoption by allowing developers to interact with examples before installation.

### Value Proposition

- **Increased Library Adoption**: Live demo reduces friction for developers evaluating the libraries
- **Living Documentation**: Interactive examples complement static API documentation
- **Stakeholder Access**: Product managers and designers can review features without local setup
- **Community Showcase**: Public URL can be shared in npm package README, blog posts, and social media
- **CI/CD Maturity**: Establishes automated deployment pipeline for future enhancements

---

## Requirements

### Requirement 1: Automated GitHub Pages Deployment on Main Branch Merge

**User Story:** As a developer merging changes to the main branch, I want the demo application to automatically deploy to GitHub Pages, so that the live showcase always reflects the latest codebase without manual intervention.

#### Acceptance Criteria

1. WHEN a pull request is merged to the `main` branch THEN a GitHub Actions workflow SHALL trigger deployment to GitHub Pages
2. WHEN the deployment workflow runs THEN it SHALL execute as a separate job from the existing CI workflow (not inline with lint/test/build)
3. WHEN the deployment job starts THEN it SHALL only execute after successful completion of the CI job (dependency: CI job passes)
4. WHEN the deployment completes successfully THEN the updated demo application SHALL be accessible at `https://hive-academy.github.io/angular-3d/`
5. WHEN deployment fails THEN the workflow SHALL provide clear error messages and NOT break the main branch
6. WHEN the workflow runs THEN it SHALL NOT trigger on pull request events (only on merge to main)

---

### Requirement 2: Nx-Based Production Build with GitHub Pages Base Href

**User Story:** As a user accessing the GitHub Pages deployment, I want all application assets (JavaScript, CSS, images) to load correctly, so that I can interact with the demo without broken links or 404 errors.

#### Acceptance Criteria

1. WHEN the deployment workflow builds the application THEN it SHALL use Nx build command `npx nx build angular-3d-demo --configuration=production`
2. WHEN the build executes THEN it SHALL configure `baseHref` to `/angular-3d/` to match the GitHub Pages URL structure
3. WHEN the build completes THEN the output SHALL be located at `dist/apps/angular-3d-demo/browser` (Angular application output folder)
4. WHEN assets are generated THEN all internal links and asset references SHALL use the correct base path `/angular-3d/`
5. WHEN the application loads in the browser THEN routing SHALL work correctly with the base href (e.g., `/angular-3d/showcase` resolves properly)
6. WHEN the production build runs THEN it SHALL respect bundle size budgets defined in `apps/angular-3d-demo/project.json` (initial: max 1MB, component styles: max 8KB)

---

### Requirement 3: Modern GitHub Pages Deployment with Official Actions

**User Story:** As a DevOps engineer maintaining the deployment pipeline, I want to use the official GitHub Pages deployment actions, so that the workflow benefits from GitHub's best practices, security updates, and native integration.

#### Acceptance Criteria

1. WHEN the deployment workflow uploads artifacts THEN it SHALL use `actions/upload-pages-artifact@v3` to package the built application
2. WHEN uploading artifacts THEN it SHALL specify the correct path: `dist/apps/angular-3d-demo/browser`
3. WHEN deploying to GitHub Pages THEN it SHALL use `actions/deploy-pages@v4` for the actual deployment step
4. WHEN the deploy action runs THEN it SHALL receive the artifact ID from the upload step automatically
5. WHEN the deployment completes THEN it SHALL output the deployed URL in the workflow logs
6. WHEN reviewing the workflow THEN it SHALL NOT use deprecated actions (e.g., legacy `JamesIves/github-pages-deploy-action` or manual git push)

---

### Requirement 4: Proper GitHub Pages Permissions and Security

**User Story:** As a security-conscious team member, I want the deployment workflow to use minimal necessary permissions, so that we follow the principle of least privilege and reduce attack surface.

#### Acceptance Criteria

1. WHEN the deployment job runs THEN it SHALL request `pages: write` permission to deploy to GitHub Pages
2. WHEN the deployment job runs THEN it SHALL request `id-token: write` permission for OIDC authentication with GitHub Pages
3. WHEN the workflow defines permissions THEN it SHALL NOT grant broader permissions than necessary (e.g., `contents: write` not required)
4. WHEN the workflow executes THEN it SHALL use GitHub's OIDC provider for secure authentication (no secrets required)
5. WHEN reviewing the workflow THEN permissions SHALL be scoped at the job level for the deployment job only
6. WHEN the repository is configured THEN GitHub Pages settings SHALL be set to deploy from GitHub Actions (not legacy branch-based deployment)

---

### Requirement 5: Deployment Job Dependency on CI Job Success

**User Story:** As a quality assurance engineer, I want deployment to only occur when all tests and checks pass, so that broken code is never deployed to the public showcase.

#### Acceptance Criteria

1. WHEN the workflow defines jobs THEN the deployment job SHALL declare `needs: [ci]` dependency on the CI job
2. WHEN the CI job fails (lint, test, typecheck, or build errors) THEN the deployment job SHALL NOT execute
3. WHEN the CI job succeeds THEN the deployment job SHALL execute automatically without manual approval
4. WHEN viewing the GitHub Actions UI THEN the job dependency graph SHALL visually show deployment depends on CI
5. WHEN the deployment job is skipped due to CI failure THEN the workflow status SHALL be marked as failed
6. WHEN both jobs run on the same commit THEN they SHALL share the same build artifacts (no duplicate builds)

---

### Requirement 6: Workflow Configuration and Environment Setup

**User Story:** As a developer debugging deployment issues, I want the workflow to have clear logging and proper environment setup, so that I can quickly identify and resolve failures.

#### Acceptance Criteria

1. WHEN the deployment workflow runs THEN it SHALL use `ubuntu-latest` runner for consistency with existing CI workflow
2. WHEN the workflow checks out code THEN it SHALL use `actions/checkout@v4` with `fetch-depth: 0` to ensure full git history (required for Nx affected commands if needed)
3. WHEN Node.js is set up THEN it SHALL use `actions/setup-node@v4` with Node 20 and npm caching
4. WHEN dependencies are installed THEN it SHALL use `npm ci` for reproducible builds
5. WHEN the build step executes THEN it SHALL log the Nx command being run and output directory
6. WHEN the upload step executes THEN it SHALL log the artifact name and size
7. WHEN the deployment completes THEN it SHALL output the final GitHub Pages URL in the workflow summary

---

## Non-Functional Requirements

### Performance Requirements

- **Build Time**: Deployment workflow SHALL complete within 10 minutes under normal conditions (95th percentile)
- **Deployment Latency**: Application SHALL be accessible within 2 minutes of workflow completion
- **Cache Utilization**: npm cache SHALL be used to reduce dependency installation time (target: <2 minutes for cache hit)
- **Artifact Size**: Uploaded artifact SHALL not exceed 100MB (compressed)

### Reliability Requirements

- **Uptime**: GitHub Pages hosting SHALL provide 99.9% uptime (GitHub SLA)
- **Error Handling**: Workflow failures SHALL not corrupt existing deployment (rollback safety)
- **Idempotency**: Re-running the workflow on the same commit SHALL produce identical deployments
- **Retry Strategy**: Transient GitHub Actions failures SHALL trigger automatic retries (built into actions/deploy-pages)

### Scalability Requirements

- **Concurrent Builds**: Workflow SHALL support concurrency control to prevent race conditions when multiple commits are merged rapidly
- **Artifact Storage**: GitHub Pages SHALL support the angular-3d-demo application size (current: ~2MB, growth: up to 10MB)
- **Traffic Handling**: GitHub Pages CDN SHALL handle expected traffic (estimate: 1000 visits/month initially)

### Security Requirements

- **OIDC Authentication**: Workflow SHALL use GitHub OIDC tokens (no long-lived secrets required)
- **Permission Minimization**: Workflow SHALL only request `pages: write` and `id-token: write` permissions
- **Dependency Security**: Workflow SHALL use pinned action versions (e.g., `@v4`, not `@latest`)
- **Content Security**: Deployed application SHALL serve over HTTPS with valid TLS certificate (GitHub Pages default)

### Maintainability Requirements

- **Workflow Clarity**: Workflow file SHALL include comments explaining each step's purpose
- **Separation of Concerns**: Deployment logic SHALL be isolated from CI workflow (separate jobs)
- **Version Control**: GitHub Actions versions SHALL be pinned to major versions for stability with auto-updates for security patches
- **Documentation**: Workflow SHALL include inline documentation for baseHref configuration and artifact path

---

## Dependencies and Constraints

### Technical Dependencies

| Dependency                          | Version/Specification              | Purpose                           |
| ----------------------------------- | ---------------------------------- | --------------------------------- |
| GitHub Actions                      | Workflow v2 syntax                 | CI/CD automation platform         |
| actions/checkout                    | v4                                 | Code checkout                     |
| actions/setup-node                  | v4                                 | Node.js environment setup         |
| actions/upload-pages-artifact       | v3                                 | Package deployment artifacts      |
| actions/deploy-pages                | v4                                 | Deploy to GitHub Pages            |
| Nx                                  | 22.2.6 (current workspace version) | Build orchestration               |
| Angular Build                       | 20.3.0 (current workspace version) | Application build                 |
| GitHub Pages                        | Default configuration              | Static site hosting               |
| Repository: Hive-Academy/angular-3d | Existing repository                | Source code and deployment target |

### Configuration Constraints

- **Repository Settings**: GitHub Pages must be enabled and configured to deploy from GitHub Actions (not branch-based)
- **Branch Protection**: Main branch merges trigger deployment (assumes protected main branch)
- **Build Output Path**: Must match Angular application output at `dist/apps/angular-3d-demo/browser`
- **Base Href**: Must be `/angular-3d/` to match repository name in GitHub Pages URL structure
- **Nx Configuration**: Must use existing `angular-3d-demo:build:production` target defined in `apps/angular-3d-demo/project.json`

### External Constraints

- **GitHub Pages URL Format**: Fixed as `https://<org>.github.io/<repo>/` (cannot be customized without custom domain)
- **GitHub Actions Quotas**: 2000 minutes/month for free tier (current usage must be monitored)
- **Artifact Retention**: GitHub Actions artifacts retained for 90 days (default)
- **Storage Limits**: GitHub Pages repositories limited to 1GB total size

### Integration Points

- **Existing CI Workflow**: Must coexist with `.github/workflows/ci.yml` without conflicts
- **Existing Build Configuration**: Must use existing `apps/angular-3d-demo/project.json` build target
- **Nx Caching**: Should leverage Nx build caching if available (optimization)
- **Repository Settings**: Requires GitHub Pages to be enabled in repository settings

---

## Success Metrics

### Deployment Success Metrics

- **Deployment Success Rate**: 95% of main branch merges result in successful deployment
- **Time to Live**: Mean time from merge to accessible deployment <8 minutes
- **First-Time Setup Success**: Workflow executes successfully on first run without manual intervention

### User Experience Metrics

- **Page Load Time**: Demo application loads in <3 seconds on 3G connection
- **Asset Load Success**: 100% of assets (JS, CSS, images, 3D models) load without 404 errors
- **Routing Functionality**: All routes work correctly with base href configuration

### Operational Metrics

- **Build Cache Hit Rate**: >80% of builds use cached npm dependencies
- **Workflow Reliability**: <5% failure rate due to infrastructure issues (vs code issues)
- **Deployment Rollback**: Zero instances of broken deployments requiring manual rollback

---

## Risk Assessment

### Technical Risks

| Risk                          | Probability | Impact | Score | Mitigation Strategy                                | Contingency Plan                                       |
| ----------------------------- | ----------- | ------ | ----- | -------------------------------------------------- | ------------------------------------------------------ |
| Base href misconfiguration    | Medium      | High   | 6     | Test routing and asset paths thoroughly in staging | Document correct configuration in workflow             |
| Build output path mismatch    | Medium      | High   | 6     | Validate artifact path before upload step          | Add explicit path validation in workflow               |
| GitHub Pages quota exhaustion | Low         | Medium | 3     | Monitor usage dashboard monthly                    | Optimize build frequency or use external CDN           |
| Concurrent deployment race    | Low         | Medium | 3     | Add concurrency control to workflow                | Use `concurrency` key with `cancel-in-progress: false` |
| Node.js version drift         | Low         | Low    | 2     | Pin Node.js version to 20 (matches CI)             | Update to LTS versions annually                        |

### Operational Risks

| Risk                               | Probability | Impact   | Score | Mitigation Strategy                      | Contingency Plan                              |
| ---------------------------------- | ----------- | -------- | ----- | ---------------------------------------- | --------------------------------------------- |
| Workflow permissions insufficient  | Medium      | Critical | 9     | Test with minimal permissions first      | Document required permissions in workflow     |
| GitHub Actions service outage      | Low         | Medium   | 3     | No mitigation (external dependency)      | Communicate status via GitHub status page     |
| Broken deployment blocking future  | Low         | High     | 4     | Validate no state corruption on failure  | Manual rollback via GitHub Pages settings     |
| Repository settings not configured | High        | Critical | 12    | Include setup checklist in documentation | Provide step-by-step GitHub Pages setup guide |

### Security Risks

| Risk                              | Probability | Impact | Score | Mitigation Strategy                       | Contingency Plan                             |
| --------------------------------- | ----------- | ------ | ----- | ----------------------------------------- | -------------------------------------------- |
| Overly permissive workflow        | Medium      | Medium | 6     | Follow principle of least privilege       | Audit permissions quarterly                  |
| Compromised dependencies in build | Low         | High   | 4     | Use `npm ci` for reproducible builds      | Enable Dependabot security alerts            |
| Secrets exposure in logs          | Low         | High   | 4     | No secrets required (OIDC authentication) | Mask sensitive output if secrets added later |

---

## Acceptance Validation

### Functional Validation Checklist

- [ ] Workflow file created at `.github/workflows/deploy-gh-pages.yml`
- [ ] Workflow triggers on push to `main` branch only
- [ ] Deployment job depends on CI job success (`needs: [ci]`)
- [ ] Build command uses Nx with production configuration
- [ ] Base href configured as `/angular-3d/`
- [ ] Artifact upload uses `actions/upload-pages-artifact@v3`
- [ ] Artifact path points to `dist/apps/angular-3d-demo/browser`
- [ ] Deployment uses `actions/deploy-pages@v4`
- [ ] Permissions include `pages: write` and `id-token: write`
- [ ] Demo application accessible at `https://hive-academy.github.io/angular-3d/`
- [ ] All assets load without 404 errors
- [ ] Routing works correctly (e.g., `/angular-3d/showcase` route)
- [ ] 3D scenes render correctly in deployed version

### Non-Functional Validation Checklist

- [ ] Workflow completes in <10 minutes (95th percentile)
- [ ] npm cache reduces install time to <2 minutes on cache hit
- [ ] Workflow logs are clear and actionable
- [ ] Failed CI prevents deployment (tested with intentional failure)
- [ ] Concurrency control prevents race conditions
- [ ] GitHub Pages settings configured correctly (source: GitHub Actions)
- [ ] Application serves over HTTPS with valid certificate

---

## Out of Scope

The following items are explicitly **not** included in this task:

- **Custom Domain Configuration**: Using a custom domain (e.g., `demo.angular-3d.com`) instead of GitHub Pages default URL
- **Preview Deployments**: Deploying pull request previews to separate URLs (future enhancement)
- **Analytics Integration**: Adding Google Analytics or other tracking to the deployed demo
- **Performance Monitoring**: Setting up Lighthouse CI or other performance monitoring in deployment workflow
- **CDN Optimization**: Additional CDN layer beyond GitHub Pages built-in CDN
- **Deployment Notifications**: Slack/Discord/Email notifications on deployment success/failure
- **Rollback Automation**: Automated rollback to previous deployment on failure
- **Multi-Environment Strategy**: Separate staging/production GitHub Pages deployments
- **Build Optimization**: Nx Cloud integration for distributed builds (separate task)
- **E2E Testing in Deployment**: Running E2E tests against deployed URL (future enhancement)

---

## References

- **GitHub Pages Documentation**: https://docs.github.com/en/pages
- **GitHub Actions - Deploying to GitHub Pages**: https://docs.github.com/en/actions/deployment/deploying-to-github-pages
- **actions/upload-pages-artifact**: https://github.com/actions/upload-pages-artifact
- **actions/deploy-pages**: https://github.com/actions/deploy-pages
- **Angular Build Configuration**: https://angular.dev/tools/cli/build
- **Nx Build Documentation**: https://nx.dev/nx-api/angular/executors/application
- **Existing CI Workflow**: `.github/workflows/ci.yml` (reference implementation)
- **Existing Publish Workflow**: `.github/workflows/publish.yml` (pattern reference for reliability strategies)
