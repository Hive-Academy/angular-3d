# Post-Deployment Validation Checklist - TASK_2026_007

## Expected Deployment URL

**Live Site**: `https://hive-academy.github.io/angular-3d/`

## Validation Timeline

1. **Merge to Main**: 0 minutes
2. **CI Workflow Completes**: 5-7 minutes
3. **Deploy Workflow Completes**: 8-12 minutes (total)
4. **CDN Propagation**: 2 minutes (wait before testing)
5. **Start Validation**: 14 minutes after merge

---

## PHASE 1: Monitor Deployment Workflow

### Step 1.1: GitHub Actions Monitoring

**URL**: `https://github.com/Hive-Academy/angular-3d/actions`

**Checklist**:

- [ ] Go to GitHub Actions tab
- [ ] Find "Deploy to GitHub Pages" workflow run
- [ ] Verify CI workflow completed first
- [ ] Verify deploy workflow status: "In Progress" → "Success"
- [ ] Check workflow execution time: <10 minutes (95th percentile)

### Step 1.2: Workflow Logs Review

**Deploy Workflow Steps**:

- [ ] **Checkout repository**: ✅ Success
- [ ] **Setup Node.js**: ✅ Success
- [ ] **Install dependencies**: ✅ Success (npm ci completed)
- [ ] **Build demo application**: ✅ Success (no errors, respects budgets)
- [ ] **Upload GitHub Pages artifact**: ✅ Success (artifact ID visible)
- [ ] **Deploy to GitHub Pages**: ✅ Success (deployment URL output)
- [ ] **Display deployment URL**: ✅ Success (shows URL)

### Step 1.3: Deployment URL Verification

**From Workflow Logs**:

```
🚀 Deployment complete!
📍 Application accessible at: https://hive-academy.github.io/angular-3d/
⏱️  CDN propagation may take 1-2 minutes
```

**Action**: Wait 2 minutes for CDN propagation before proceeding to Phase 2

---

## PHASE 2: Functional Validation

### Step 2.1: Site Accessibility

**URL**: `https://hive-academy.github.io/angular-3d/`

**Checklist**:

- [ ] Homepage loads without errors
- [ ] Page title displays correctly: "Angular 3D Demo" (or configured title)
- [ ] No blank page or "404 Not Found" error
- [ ] No "502 Bad Gateway" or "503 Service Unavailable" errors
- [ ] Page loads within 3 seconds

### Step 2.2: Navigation Testing

**Test All Routes**:

- [ ] **Home** (`/`): Loads correctly
- [ ] **Showcase** (`/showcase`): Loads correctly (if exists)
- [ ] Click navigation links: All transitions work smoothly
- [ ] Browser back button: Works correctly
- [ ] Browser forward button: Works correctly

**Expected Behavior**:

- Routes should load instantly (SPA behavior)
- No page reload between route changes
- URL updates in browser address bar

### Step 2.3: Deep Linking Testing

**Purpose**: Verify base href is correct and routing works

**Test Scenarios**:

1. **Direct URL Access**:

   - [ ] Open new browser tab
   - [ ] Navigate to: `https://hive-academy.github.io/angular-3d/showcase`
   - [ ] Route loads correctly (NOT 404)
   - [ ] Page displays expected content

2. **Refresh on Route**:

   - [ ] Navigate to any route (e.g., `/showcase`)
   - [ ] Press F5 or refresh button
   - [ ] Page reloads successfully (NOT 404)
   - [ ] Content remains correct

3. **Bookmark Test**:
   - [ ] Bookmark a specific route
   - [ ] Close all browser tabs
   - [ ] Open bookmark
   - [ ] Route loads correctly

### Step 2.4: Asset Loading Verification

**Open Browser DevTools** (F12):

1. **Console Tab**:

   - [ ] NO 404 errors for JavaScript files
   - [ ] NO 404 errors for CSS files
   - [ ] NO 404 errors for images
   - [ ] NO CORS errors
   - [ ] NO "Failed to load resource" errors

2. **Network Tab**:

   - [ ] All requests return status 200
   - [ ] All assets loaded from `/angular-3d/` base path
   - [ ] Example: `/angular-3d/main.js` (NOT `/main.js`)
   - [ ] Example: `/angular-3d/styles.css` (NOT `/styles.css`)

3. **Verify Base Href**:
   - [ ] Open page source (Ctrl+U or View Source)
   - [ ] Find `<base>` tag in `<head>`
   - [ ] Verify: `<base href="/angular-3d/">`

### Step 2.5: 3D Rendering Verification

**Navigate to page with 3D scenes**:

**Checklist**:

- [ ] 3D scenes render correctly
- [ ] WebGL context initialized (no errors)
- [ ] Animations play smoothly
- [ ] Scene interactions work (camera controls, if present)
- [ ] No WebGL errors in console
- [ ] No "WebGL not supported" errors

**DevTools Console Check**:

```
// Should NOT see:
- "WebGL: CONTEXT_LOST_WEBGL"
- "WebGL: Failed to create context"
- "THREE.WebGLRenderer: Error"
```

### Step 2.6: Scroll Animations (If Using angular-gsap)

**Checklist**:

- [ ] Scroll animations trigger correctly
- [ ] ScrollTrigger markers visible (if debug mode)
- [ ] Animations play smoothly during scroll
- [ ] No animation stuttering or lag
- [ ] No GSAP errors in console

---

## PHASE 3: Performance Validation

### Step 3.1: Load Time Metrics

**Chrome DevTools > Network Tab**:

**Metrics**:

- [ ] **Page Load Time**: <3 seconds
- [ ] **First Contentful Paint (FCP)**: <1.8 seconds
- [ ] **Largest Contentful Paint (LCP)**: <2.5 seconds
- [ ] **Time to Interactive (TTI)**: <3.8 seconds
- [ ] **Total Page Size**: <2MB (compressed)
- [ ] **Number of Requests**: <50

**How to Measure**:

1. Open DevTools > Network tab
2. Refresh page (Ctrl+Shift+R - hard refresh)
3. Check "DOMContentLoaded" and "Load" times at bottom of Network tab

### Step 3.2: Bundle Size Verification

**Expected Bundle Sizes** (from project.json budgets):

- [ ] **Initial Bundle**: <1MB (1024KB)
- [ ] **Component Styles**: <8KB per file

**How to Verify**:

- Check Network tab for main bundle size
- Verify no "Budget exceeded" warnings during build (workflow logs)

### Step 3.3: Lighthouse Audit (Optional but Recommended)

**Chrome DevTools > Lighthouse Tab**:

**Run Audit** (Desktop):

- [ ] **Performance Score**: >80
- [ ] **Accessibility Score**: >90
- [ ] **Best Practices Score**: >90
- [ ] **SEO Score**: >90

**Critical Issues to Check**:

- No critical accessibility violations
- No security vulnerabilities
- No console errors affecting score

---

## PHASE 4: Browser Compatibility Testing

### Step 4.1: Multi-Browser Testing

**Test in Each Browser**:

1. **Chrome (Latest)**:

   - [ ] Site loads correctly
   - [ ] 3D scenes render
   - [ ] Animations work

2. **Firefox (Latest)**:

   - [ ] Site loads correctly
   - [ ] 3D scenes render
   - [ ] Animations work

3. **Safari (Latest)** (if available):

   - [ ] Site loads correctly
   - [ ] 3D scenes render
   - [ ] Animations work

4. **Edge (Latest)**:
   - [ ] Site loads correctly
   - [ ] 3D scenes render
   - [ ] Animations work

### Step 4.2: Responsive Design Testing

**Test Viewports**:

1. **Desktop** (1920x1080):

   - [ ] Layout correct
   - [ ] 3D scenes responsive

2. **Tablet** (768x1024):

   - [ ] Layout adapts correctly
   - [ ] Navigation works
   - [ ] 3D scenes render

3. **Mobile** (375x667):
   - [ ] Layout mobile-friendly
   - [ ] Touch interactions work
   - [ ] Performance acceptable

**How to Test**:

- Chrome DevTools > Toggle Device Toolbar (Ctrl+Shift+M)
- Test each viewport size
- Verify layout and interactions

---

## PHASE 5: Repository Settings Verification

### Step 5.1: GitHub Pages Settings

**URL**: `https://github.com/Hive-Academy/angular-3d/settings/pages`

**Checklist**:

- [ ] GitHub Pages enabled
- [ ] Source: "GitHub Actions" (NOT "Deploy from a branch")
- [ ] Site status: "Your site is live at https://hive-academy.github.io/angular-3d/"
- [ ] No error messages in settings

### Step 5.2: HTTPS Certificate Verification

**Checklist**:

- [ ] Open site in browser
- [ ] Click padlock icon in address bar
- [ ] Verify: "Connection is secure"
- [ ] Certificate issued by: GitHub
- [ ] Certificate valid and not expired

---

## PHASE 6: Workflow History Verification

### Step 6.1: GitHub Actions History

**URL**: `https://github.com/Hive-Academy/angular-3d/actions`

**Checklist**:

- [ ] "Deploy to GitHub Pages" workflow visible in history
- [ ] Latest run status: ✅ Success
- [ ] CI workflow ran first
- [ ] Deploy workflow ran after CI success
- [ ] Total execution time: <10 minutes

### Step 6.2: Deployment Environment

**URL**: `https://github.com/Hive-Academy/angular-3d/deployments`

**Checklist**:

- [ ] "github-pages" environment visible
- [ ] Latest deployment active
- [ ] Deployment URL: `https://hive-academy.github.io/angular-3d/`
- [ ] Deployment status: Active

---

## VALIDATION SUMMARY

### Success Criteria (All Must Pass)

**Functional**:

- ✅ Site accessible at correct URL
- ✅ All routes work (including deep linking)
- ✅ All assets load without 404 errors
- ✅ 3D scenes render correctly
- ✅ Animations work smoothly

**Performance**:

- ✅ Page loads in <3 seconds
- ✅ No bundle budget violations
- ✅ Lighthouse Performance >80

**Technical**:

- ✅ Workflow completed successfully
- ✅ CI dependency works (no deployment if CI fails)
- ✅ HTTPS certificate valid
- ✅ Base href correct (`/angular-3d/`)

**Browser Compatibility**:

- ✅ Works in Chrome, Firefox, Edge
- ✅ Responsive design works (desktop, tablet, mobile)

### Failure Scenarios

**If ANY validation fails**:

1. Document the failure in `task-tracking/TASK_2026_007/validation-report.md`
2. Create bug report with reproduction steps
3. Determine if immediate rollback needed
4. Follow rollback strategy in `pr-checklist.md`

---

## Post-Validation Actions

### If All Validations Pass

1. **Update tasks.md**:

   - Mark Task 3.2 as "✅ COMPLETE"

2. **Document Success**:

   - Record deployment URL in project README (if needed)
   - Update team documentation with deployment process

3. **Enable Monitoring** (Optional):
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure GitHub Actions status notifications

### If Validations Fail

1. **Investigate**:

   - Check workflow logs for errors
   - Check browser console for runtime errors
   - Review deployment environment settings

2. **Fix Issues**:

   - Option A: Quick fix forward (create PR with fix)
   - Option B: Revert deployment (revert commit)

3. **Re-test**:
   - Run validation checklist again after fix

---

## Validation Report Template

After completing validation, document results:

```markdown
## Validation Report - TASK_2026_007

**Date**: [Date]
**Validator**: [Name]
**Deployment URL**: https://hive-academy.github.io/angular-3d/

### Results Summary

- Site Accessibility: ✅ PASS / ❌ FAIL
- Navigation: ✅ PASS / ❌ FAIL
- Deep Linking: ✅ PASS / ❌ FAIL
- Asset Loading: ✅ PASS / ❌ FAIL
- 3D Rendering: ✅ PASS / ❌ FAIL
- Performance: ✅ PASS / ❌ FAIL
- Browser Compatibility: ✅ PASS / ❌ FAIL

### Issues Found

[List any issues discovered]

### Recommendation

[APPROVE for production / REQUIRES FIX]
```

---

## Quick Reference Commands

### Check Workflow Status

```bash
gh run list --workflow=deploy-gh-pages.yml --limit=5
```

### View Workflow Logs

```bash
gh run view <run-id> --log
```

### Check Deployment Environment

```bash
gh api repos/Hive-Academy/angular-3d/deployments | jq '.[0]'
```

### Test Build Locally (If Issues Found)

```bash
npx nx build angular-3d-demo --configuration=production --base-href=/angular-3d/
npx http-server dist/apps/angular-3d-demo/browser -p 4200
# Open: http://localhost:4200
```
