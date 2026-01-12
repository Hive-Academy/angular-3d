# 🎯 Orchestration & Git Commit Standards

## Commit Message Format

All commits MUST follow commitlint rules.

### Format

```
<type>(<scope>): <subject>

[optional body]
[optional footer]
```

### Allowed Types (REQUIRED)

`feat` `fix` `docs` `style` `refactor` `perf` `test` `build` `ci` `chore` `revert`

### Allowed Scopes (REQUIRED)

| Scope        | Description                   |
| ------------ | ----------------------------- |
| `angular-3d` | Main library changes          |
| `demo`       | Demo application changes      |
| `deps`       | Dependency updates            |
| `release`    | Release/versioning changes    |
| `ci`         | CI/CD configuration           |
| `docs`       | Documentation updates         |
| `hooks`      | Git hooks (husky, commitlint) |
| `scripts`    | Build/utility scripts         |

### Commit Rules (ENFORCED)

- ✓ Type: lowercase, required, from allowed list
- ✓ Scope: lowercase, required, from allowed list
- ✓ Subject:
  - lowercase only (NOT Sentence-case, UPPER-CASE)
  - 3-72 characters
  - No period at end
  - Imperative mood ("add" not "added")
- ✓ Header: max 100 characters
- ✓ Body/Footer: max 100 characters per line

### Valid Examples

```bash
feat(angular-3d): add scene container component
fix(angular-3d): resolve webgl context cleanup
docs(angular-3d): update component usage examples
refactor(demo): simplify hero scene implementation
chore(deps): update @angular/core to v20.1.2
test(angular-3d): add unit tests for animation service
```

### Invalid (WILL FAIL)

```bash
❌ "Feature: Add search"           # Wrong type, case
❌ "feat: Add search"              # Missing scope
❌ "feat(search): Add search"      # Invalid scope, wrong case
❌ "feat(angular-3d): Add search." # Period at end
❌ "feat(angular-3d): Add Search"  # Uppercase subject
```

---

## Task Management

### Task ID Format

`TASK_YYYY_NNN` - Sequential (TASK_2025_001, TASK_2025_002)

### Folder Structure

```
task-tracking/
  registry.md              # Master task list
  TASK_[ID]/
    📄 context.md          # User intent, conversation summary
```

---

## Branch & PR Workflow

```bash
# New task
git checkout -b feature/TASK_2025_XXX
git push -u origin feature/TASK_2025_XXX

# Continue existing
git checkout feature/TASK_2025_XXX
git pull origin feature/TASK_2025_XXX --rebase

# Commit
git add .
git commit -m "type(scope): description"

# Complete
gh pr create --title "type(scope): description"
```

---

## Pre-commit Checks

Automatic on commit:

1. **lint-staged**: Format & lint staged files
2. **typecheck:affected**: Type-check changed projects
3. **commitlint**: Validate commit message format

### Hook Failure Protocol

When hook fails:

1. **Fix Issue** - Fix if related to current work
2. **Bypass Hook** - Commit with `--no-verify` (document reason)
3. **Stop & Report** - Mark as blocker

**NEVER** run destructive git commands (reset, force push, rebase --hard).
