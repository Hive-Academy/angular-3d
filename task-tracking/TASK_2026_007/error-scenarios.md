# Error Scenario Testing - TASK_2026_007

## Overview

This document outlines error scenarios to test after successful deployment, ensuring the GitHub Pages deployment workflow handles failures gracefully and prevents broken deployments.

---

## Error Scenario 1: CI Workflow Failure Prevents Deployment

### Purpose

Verify that deployment workflow does NOT run when CI workflow fails, preventing broken code from being deployed.

### Test Steps

#### Step 1: Create Test Branch with Intentional Error

```bash
# Create test branch
git checkout -b test/ci-failure-blocks-deployment

# Find a TypeScript file (e.g., demo app component)
# Add intentional lint error
```

**Example Error (in any .ts file)**:

```typescript
// Add at top of file
const unusedVariable = 'test'; // ESLint will fail (no-unused-vars)
```

#### Step 2: Commit and Push Error

```bash
git add .
git commit -m "test(ci): intentional lint error to verify deployment blocking"
git push -u origin test/ci-failure-blocks-deployment
```

#### Step 3: Create Pull Request

```bash
gh pr create \
  --title "test(ci): verify CI failure blocks deployment" \
  --body "Testing error scenario: CI failure should prevent deployment"
```

#### Step 4: Merge to Main

**Option A**: Merge PR via GitHub UI
**Option B**: Merge via CLI

```bash
gh pr merge --merge
```

#### Step 5: Monitor GitHub Actions

**URL**: `https://github.com/Hive-Academy/angular-3d/actions`

**Expected Behavior**:

- [ ] CI workflow runs automatically
- [ ] CI workflow FAILS at lint step
- [ ] Deploy workflow does NOT trigger
- [ ] Workflow status shows: ❌ Failed

**Verification Checklist**:

- [ ] CI workflow status: ❌ Failed
- [ ] Deploy workflow status: ⊘ Skipped (not triggered)
- [ ] Existing deployment remains intact (site still accessible)
- [ ] No new deployment created
- [ ] Deployment environment shows old deployment as active

#### Step 6: Verify Site Remains Accessible

```bash
# Site should still work (previous deployment)
# Open: https://hive-academy.github.io/angular-3d/
```

**Expected**:

- [ ] Previous deployment still live
- [ ] Site accessible and functional
- [ ] No "404 Not Found" or broken state
- [ ] Deployment URL unchanged

#### Step 7: Fix Error and Verify Recovery

```bash
# Revert the intentional error
git checkout main
git pull origin main
git revert HEAD
git push origin main
```

**Expected Recovery**:

- [ ] New CI workflow run triggered
- [ ] CI workflow succeeds
- [ ] Deploy workflow triggers automatically
- [ ] Deploy workflow succeeds
- [ ] Site still accessible (no downtime)

### Success Criteria

- ✅ CI failure prevents deployment workflow from running
- ✅ Existing deployment remains intact during failure
- ✅ Site accessibility not affected by failed CI
- ✅ Recovery workflow works correctly after fix

---

## Error Scenario 2: Build Failure in Deploy Job

### Purpose

Verify that build failures in the deploy workflow do not corrupt the existing deployment.

### Test Steps

#### Step 1: Create Test Branch with Build Error

```bash
git checkout -b test/build-failure-handling

# Introduce build error (e.g., import non-existent module)
# In src/app/app.component.ts:
```

**Example Build Error**:

```typescript
import { NonExistentModule } from './does-not-exist'; // Build will fail
```

#### Step 2: Commit and Push

```bash
git add .
git commit -m "test(deploy): intentional build error to verify handling"
git push -u origin test/build-failure-handling
```

#### Step 3: Create and Merge PR

```bash
gh pr create --title "test(deploy): verify build failure handling" --body "Testing deploy workflow error handling"
gh pr merge --merge
```

#### Step 4: Monitor Deploy Workflow

**Expected Behavior**:

- [ ] CI workflow succeeds (lint/test pass)
- [ ] Deploy workflow triggers
- [ ] Deploy workflow FAILS at build step
- [ ] Artifact upload step SKIPS (no artifact to upload)
- [ ] Deploy step SKIPS (no artifact available)

**Verification Checklist**:

- [ ] Deploy workflow status: ❌ Failed
- [ ] Build step logs show clear error message
- [ ] Workflow fails before artifact upload
- [ ] No partial deployment created
- [ ] Existing deployment remains active

#### Step 5: Verify Site Integrity

**Expected**:

- [ ] Previous deployment still live
- [ ] Site fully functional
- [ ] No 404 errors or broken assets
- [ ] No partial/corrupt deployment

#### Step 6: Fix and Verify Recovery

```bash
git checkout main
git pull origin main
git revert HEAD
git push origin main
```

### Success Criteria

- ✅ Build failure stops workflow before deployment
- ✅ No partial deployment created
- ✅ Existing deployment not corrupted
- ✅ Clear error message in workflow logs

---

## Error Scenario 3: Concurrent Deployments (Race Condition)

### Purpose

Verify that concurrency control prevents race conditions when multiple commits are merged rapidly.

### Test Steps

#### Step 1: Prepare Two Test Branches

```bash
# Branch 1: Simple change
git checkout -b test/concurrent-deploy-1
echo "Test change 1" >> README.md
git add README.md
git commit -m "test(deploy): concurrent test 1"
git push -u origin test/concurrent-deploy-1

# Branch 2: Another simple change
git checkout main
git checkout -b test/concurrent-deploy-2
echo "Test change 2" >> README.md
git add README.md
git commit -m "test(deploy): concurrent test 2"
git push -u origin test/concurrent-deploy-2
```

#### Step 2: Create PRs

```bash
gh pr create --head test/concurrent-deploy-1 --title "test(deploy): concurrent 1"
gh pr create --head test/concurrent-deploy-2 --title "test(deploy): concurrent 2"
```

#### Step 3: Merge PRs Rapidly (Within 1 Minute)

```bash
gh pr merge <PR-1-number> --merge
gh pr merge <PR-2-number> --merge
```

#### Step 4: Monitor Workflow Execution

**URL**: `https://github.com/Hive-Academy/angular-3d/actions`

**Expected Behavior** (with concurrency control):

- [ ] First deploy workflow starts
- [ ] Second deploy workflow queues (waits for first to complete)
- [ ] First deployment completes successfully
- [ ] Second deployment starts after first finishes
- [ ] Second deployment completes successfully

**Alternative Behavior** (if cancel-in-progress: true):

- [ ] First deploy workflow starts
- [ ] Second deploy workflow cancels first and starts
- [ ] Only second deployment completes

**Verification Checklist**:

- [ ] No simultaneous deployments running
- [ ] No "deployment already in progress" errors
- [ ] No corrupt deployment state
- [ ] Both commits successfully deployed (final state correct)

### Success Criteria

- ✅ Concurrency control prevents parallel deployments
- ✅ No race condition errors
- ✅ Final deployment state matches latest commit
- ✅ No deployment corruption

---

## Error Scenario 4: GitHub Pages Service Outage

### Purpose

Understand behavior when GitHub Pages service is unavailable.

### Test Approach

**Note**: This scenario cannot be artificially tested. Document expected behavior for reference.

### Expected Behavior During Outage

**If GitHub Pages is down**:

- [ ] CI workflow succeeds normally
- [ ] Deploy workflow triggers
- [ ] Build and artifact upload succeed
- [ ] Deploy step fails with GitHub API error
- [ ] Workflow status: ❌ Failed

**Error Message Example**:

```
Error: Failed to create deployment: 503 Service Unavailable
```

### Recovery Actions

1. **Check GitHub Status**:

   - Visit: https://www.githubstatus.com/
   - Verify GitHub Pages service status

2. **If Outage Confirmed**:

   - Wait for service restoration (no action needed)
   - Existing deployment remains live during outage
   - Site accessible via CDN cache

3. **After Service Restored**:
   - Re-run failed deployment workflow:
     ```bash
     # Via GitHub UI: Actions > Failed workflow > Re-run all jobs
     ```
   - OR push new commit to trigger fresh deployment

### Success Criteria

- ✅ Site remains accessible during GitHub Pages outage (CDN cache)
- ✅ Workflow fails gracefully with clear error
- ✅ Recovery possible via workflow re-run
- ✅ No permanent corruption

---

## Error Scenario 5: Incorrect Base Href Configuration

### Purpose

Verify detection and recovery from incorrect base href setting.

### Test Steps

#### Step 1: Create Test Branch with Wrong Base Href

```bash
git checkout -b test/incorrect-base-href

# Edit .github/workflows/deploy-gh-pages.yml
# Change: --base-href=/angular-3d/
# To:     --base-href=/wrong-path/
```

#### Step 2: Commit and Deploy

```bash
git add .github/workflows/deploy-gh-pages.yml
git commit -m "test(deploy): incorrect base href for testing"
git push -u origin test/incorrect-base-href

gh pr create --title "test(deploy): incorrect base href"
gh pr merge --merge
```

#### Step 3: Monitor Deployment

**Expected**:

- [ ] CI workflow succeeds
- [ ] Deploy workflow succeeds (no build errors)
- [ ] Deployment completes
- [ ] **BUT**: Site is broken

#### Step 4: Verify Site Broken (Expected)

**Open**: `https://hive-academy.github.io/angular-3d/`

**Expected Errors**:

- [ ] Homepage loads but shows blank page
- [ ] Console shows 404 errors for all assets
- [ ] Assets requested from wrong path (e.g., `/wrong-path/main.js`)
- [ ] Routes don't work

**DevTools Console**:

```
GET https://hive-academy.github.io/wrong-path/main.js 404 (Not Found)
GET https://hive-academy.github.io/wrong-path/styles.css 404 (Not Found)
```

#### Step 5: Fix Base Href

```bash
git checkout main
git pull origin main
git revert HEAD
git push origin main
```

#### Step 6: Verify Recovery

**Expected**:

- [ ] New deployment triggered
- [ ] Site restored to working state
- [ ] All assets load correctly
- [ ] Routes work

### Success Criteria

- ✅ Incorrect base href causes asset 404s (detected)
- ✅ Workflow does not detect base href errors (limitation)
- ✅ Recovery via revert works
- ✅ Demonstrates importance of pre-deployment testing

### Prevention

**Always test base href locally before deploying**:

```bash
npx nx build angular-3d-demo --configuration=production --base-href=/angular-3d/
cat dist/apps/angular-3d-demo/browser/index.html | grep "base href"
# Verify: <base href="/angular-3d/">
```

---

## Error Scenario 6: Repository Settings Misconfigured

### Purpose

Verify behavior when GitHub Pages settings are incorrect.

### Test Steps

#### Step 1: Change GitHub Pages Source (Manual)

1. Go to: `https://github.com/Hive-Academy/angular-3d/settings/pages`
2. Change "Source" from "GitHub Actions" to "Deploy from a branch"
3. Select branch: `main`, folder: `/root`
4. Save changes

#### Step 2: Trigger Deployment

```bash
# Make trivial change
git checkout main
echo "test" >> README.md
git add README.md
git commit -m "test(deploy): trigger with wrong settings"
git push origin main
```

#### Step 3: Monitor Workflow

**Expected**:

- [ ] CI workflow succeeds
- [ ] Deploy workflow triggers
- [ ] Deploy step may fail or succeed (unpredictable)
- [ ] **BUT**: Site does NOT update (serves old deployment or 404)

#### Step 4: Verify Site Issue

**Open**: `https://hive-academy.github.io/angular-3d/`

**Possible States**:

- **Scenario A**: Shows old deployment (cached)
- **Scenario B**: Shows 404 Not Found
- **Scenario C**: Shows repository README (branch deployment)

#### Step 5: Fix Settings

1. Go to: `https://github.com/Hive-Academy/angular-3d/settings/pages`
2. Change "Source" back to "GitHub Actions"
3. Save changes

#### Step 6: Re-run Deployment

```bash
# Via GitHub UI: Actions > Latest workflow > Re-run all jobs
```

**Expected**:

- [ ] Deployment succeeds
- [ ] Site updates correctly
- [ ] Workflow completes without errors

### Success Criteria

- ✅ Incorrect settings cause deployment failures
- ✅ Clear documentation on correct settings
- ✅ Recovery via settings fix works
- ✅ Re-run workflow restores functionality

---

## Error Testing Summary

### Recommended Test Order

1. **CI Failure** (Error Scenario 1) - Most critical, tests quality gate
2. **Build Failure** (Error Scenario 2) - Tests deploy workflow error handling
3. **Concurrent Deployments** (Error Scenario 3) - Tests concurrency control
4. **Incorrect Base Href** (Error Scenario 5) - Tests configuration validation
5. **Repository Settings** (Error Scenario 6) - Tests settings dependency

**Skip** (Cannot Test):

- **GitHub Pages Outage** (Error Scenario 4) - External service outage

### Overall Success Criteria

After testing all scenarios:

- ✅ CI failure blocks deployment (quality gate works)
- ✅ Build failures don't corrupt existing deployment
- ✅ Concurrency control prevents race conditions
- ✅ Configuration errors are detectable and recoverable
- ✅ Repository settings issues documented and fixable
- ✅ All recovery procedures work correctly

---

## Error Recovery Quick Reference

### CI Failure Recovery

```bash
# Fix code issue, commit, push
git revert <bad-commit>
git push
# New workflow will trigger automatically
```

### Build Failure Recovery

```bash
# Same as CI failure
git revert <bad-commit>
git push
```

### Deployment Failure Recovery

```bash
# Re-run workflow via GitHub UI
# OR push new commit to trigger
git commit --allow-empty -m "chore: retrigger deployment"
git push
```

### Settings Issue Recovery

1. Fix settings in GitHub UI: Settings > Pages > Source: "GitHub Actions"
2. Re-run latest workflow in Actions tab

### Emergency Rollback (Broken Deployment Live)

```bash
# Revert to last known good commit
git log --oneline -10  # Find last good commit
git revert <broken-commit>
git push  # New deployment will restore working state
```

---

## Post-Testing Documentation

After completing error scenario testing, document results in `validation-report.md`:

```markdown
## Error Scenario Testing Results

- Scenario 1 (CI Failure): ✅ PASS / ❌ FAIL
- Scenario 2 (Build Failure): ✅ PASS / ❌ FAIL
- Scenario 3 (Concurrent Deployments): ✅ PASS / ❌ FAIL
- Scenario 5 (Incorrect Base Href): ✅ PASS / ❌ FAIL
- Scenario 6 (Settings Issue): ✅ PASS / ❌ FAIL

### Issues Discovered

[List any unexpected behaviors]

### Recommendations

[Any improvements to workflow or documentation]
```
