# Git Hooks + Linting Standards (Husky + lint-staged + commitlint + ESLint)

This document is a copyable recipe for setting up the same “quality gates” used in this repo (Husky, lint-staged, commitlint, and Nx/Angular ESLint flat config) inside the **new separate Nx workspace** you’re creating for `@hive-academy/angular-3d`.

## Goals

- Block bad commits early (format/lint/typecheck/build) using Git hooks.
- Enforce consistent commit messages (Conventional Commits + required scope).
- Keep linting aligned with modern Angular (standalone + signals + modern template control flow) and strict TypeScript hygiene.
- Use Nx-native commands (`nx format`, `nx affected:*`) so the workspace scales.

## 1) Install the dev tooling

In the new workspace root:

- `npm i -D husky lint-staged @commitlint/cli @commitlint/config-conventional`

Optional but recommended (if you want Nx-managed formatting):

- Keep Nx’s default formatter (typically Prettier) and use `nx format:*`.

## 2) Package.json scripts (minimum)

Add (or keep) these scripts in the new workspace `package.json`:

- `prepare`: `husky install`

Recommended scripts (so hooks can call them consistently):

- `typecheck:affected`: `nx affected -t typecheck`
- `lint:affected`: `nx affected -t lint`
- `build:affected`: `nx affected:build`

Notes:

- If your workspace doesn’t define a `typecheck` target for projects yet, either add it to your project targets or switch the pre-push hook to a target you do have.

## 3) Initialize Husky

From the new workspace root:

1. Ensure the repo is a git repo: `git init` (if needed).
2. Run: `npm run prepare`
3. Ensure a `.husky/` folder exists.

### Husky hooks (same behavior as this repo)

Create these files:

#### `.husky/pre-commit`

- Runs lint-staged (and uses `--no-stash` to avoid VS Code “hidden stash” confusion)

```sh

echo "🔍 Running pre-commit checks..."

# Run lint-staged (--no-stash prevents automatic backup stashes that VSCode can't display)
npx lint-staged --no-stash


echo "✅ Pre-commit checks passed!"
```

#### `.husky/commit-msg`

- Validates commit message format

```sh

echo "📝 Validating commit message..."

# Run commitlint
npx --no-install commitlint --edit "$1"

echo "✅ Commit message is valid!"
```

#### `.husky/pre-push`

- Typechecks and builds what changed

```sh

echo "🚀 Running pre-push checks..."

# Get the current branch
current_branch=$(git rev-parse --abbrev-ref HEAD)

echo " 🏗️  typechecking affected libraries..."
npm run typecheck:affected --base=$current_branch

echo "🏗️  Building affected projects..."
npx nx affected:build --base=$current_branch


echo "✅ Pre-push checks passed!"
```

Important:

- The `--base=$current_branch` pattern matches this repo. Adjust if you prefer `--base=origin/main` or a fixed base branch.
- On Windows, these hook scripts run in a shell context provided by Git (Git Bash). If your team uses PowerShell-only environments, you’ll want PowerShell equivalents.

## 4) Configure lint-staged (Nx-scaled)

Create `.lintstagedrc.json` in the new workspace root:

```json
{
  "*.{ts,js,json,md}": ["npx nx format:write --base=HEAD~1"],
  "*.{ts,js}": ["npx nx affected:lint --base=HEAD~1"],
  "libs/**/**/package.json": ["npm run validate:package-json"]
}
```

Notes:

- This matches the current repo.
- If your new workspace doesn’t include `validate:package-json`, remove that line or implement an equivalent script.

## 5) Configure commitlint

Create `.commitlintrc.json` in the new workspace root.

Baseline (mirrors this repo):

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "type-enum": [2, "always", ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"]],
    "scope-enum": [2, "always", ["angular-3d", "deps", "release", "ci", "docs", "hooks", "scripts"]],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "never", ["sentence-case", "start-case", "pascal-case", "upper-case"]],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."],
    "subject-max-length": [2, "always", 72],
    "subject-min-length": [2, "always", 3],
    "type-case": [2, "always", "lower-case"],
    "type-empty": [2, "never"],
    "header-max-length": [2, "always", 100],
    "body-leading-blank": [1, "always"],
    "body-max-line-length": [2, "always", 100],
    "footer-leading-blank": [1, "always"],
    "footer-max-line-length": [2, "always", 100]
  }
}
```

Recommended convention for this package:

- `feat(angular-3d): add orbit controls`
- `fix(angular-3d): handle resize correctly`
- `docs(angular-3d): document effect composer`

## 6) ESLint: Angular + TypeScript best practices (flat config)

This repo uses **flat ESLint configs** and layers rules in two places:

- Root config: Nx base + TypeScript/JavaScript settings and workspace-wide rules.
- Per-project configs: extend the base config and add Angular-specific linting.

### 6.1 Root ESLint config (workspace)

Recommended ingredients (mirrors the approach in this repo):

- Use Nx flat configs: `...nx.configs['flat/base']`, `...nx.configs['flat/typescript']`, `...nx.configs['flat/javascript']`
- Enable `@nx/enforce-module-boundaries` for scalable architecture.
- Set `parserOptions.project` to cover app/lib `tsconfig.*.json` so type-aware rules work.

### 6.2 Angular project ESLint config (apps/libs)

In each Angular app/lib `eslint.config.mjs`:

- Extend base config.
- Add:
  - `...nx.configs['flat/angular']`
  - `...nx.configs['flat/angular-template']`

High-value Angular rules used in this repo (recommended):

- `@angular-eslint/prefer-standalone: error`
- `@angular-eslint/prefer-signals: error`
- `@angular-eslint/use-injectable-provided-in: error`
- `@angular-eslint/contextual-lifecycle: error`
- `@angular-eslint/no-empty-lifecycle-method: error`
- `@angular-eslint/no-conflicting-lifecycle: error`
- `@angular-eslint/use-lifecycle-interface: error`
- `@angular-eslint/no-attribute-decorator: error`

High-value template rules used in this repo (recommended):

- `@angular-eslint/template/prefer-control-flow: error` (prefer `@if/@for/@switch`)
- `@angular-eslint/template/prefer-ngsrc: error`
- `@angular-eslint/template/prefer-self-closing-tags: error`
- `@angular-eslint/template/use-track-by-function: error`
- `@angular-eslint/template/no-negated-async: error`
- `@angular-eslint/template/no-any: warn`

TypeScript hygiene rules used in this repo (recommended):

- `@typescript-eslint/no-unused-vars: error` with `{ argsIgnorePattern: '^_' }`
- `@typescript-eslint/no-explicit-any: warn` (you can tighten to `error` for the new workspace)
- `@typescript-eslint/explicit-member-accessibility: error` (if you want explicitness)

### 6.3 (Angular 3D specific) Restrict direct Three.js imports

This repo enforces an architectural rule: **only the angular-3d area may import `three` directly**.

In the new workspace, the simplest equivalent is:

- Allow direct `three` imports inside the `angular-3d` library.
- Disallow them everywhere else (apps/examples), forcing consumers to use your library abstractions.

That can be done with `no-restricted-imports` in the app configs, and an override that disables it for the library folder.

## 7) Quick verification checklist

- `npm run prepare` creates/initializes `.husky/`.
- `npx lint-staged --debug` runs with your `.lintstagedrc.json`.
- Bad commit messages are blocked (try `git commit -m "bad message"`).
- Pre-push runs `nx affected` commands successfully.

## Appendix: What to copy from this repo (reference)

If you want to mirror _exactly_ what’s in this monorepo, the reference configs are:

- `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push`
- `.lintstagedrc.json`
- `.commitlintrc.json`
- Root `eslint.config.mjs` and an Angular project `eslint.config.mjs` (app/lib)
