# Angular3dWorkspace

<a alt="Nx logo" href="https://nx.dev" target="_blank" rel="noreferrer"><img src="https://raw.githubusercontent.com/nrwl/nx/master/images/nx-logo.png" width="45"></a>

✨ Your new, shiny [Nx workspace](https://nx.dev) is almost ready ✨.

[Learn more about this workspace setup and its capabilities](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or run `npx nx graph` to visually explore what was created. Now, let's get you up to speed!

## Finish your CI setup

[Click here to finish setting up your workspace!](https://cloud.nx.app/connect/J6TDnj0iSI)

## Run tasks

To run the dev server for your app, use:

```sh
npx nx serve angular-3d-demo
```

To create a production bundle:

```sh
npx nx build angular-3d-demo
```

To see all available targets to run for a project, run:

```sh
npx nx show project angular-3d-demo
```

These targets are either [inferred automatically](https://nx.dev/concepts/inferred-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) or defined in the `project.json` or `package.json` files.

[More about running tasks in the docs &raquo;](https://nx.dev/features/run-tasks?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Add new projects

While you could add new projects to your workspace manually, you might want to leverage [Nx plugins](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) and their [code generation](https://nx.dev/features/generate-code?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) feature.

Use the plugin's generator to create new projects.

To generate a new application, use:

```sh
npx nx g @nx/angular:app demo
```

To generate a new library, use:

```sh
npx nx g @nx/angular:lib mylib
```

You can use `npx nx list` to get a list of installed plugins. Then, run `npx nx list <plugin-name>` to learn about more specific capabilities of a particular plugin. Alternatively, [install Nx Console](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) to browse plugins and generators in your IDE.

[Learn more about Nx plugins &raquo;](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects) | [Browse the plugin registry &raquo;](https://nx.dev/plugin-registry?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

[Learn more about Nx on CI](https://nx.dev/ci/intro/ci-with-nx#ready-get-started-with-your-provider?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Install Nx Console

Nx Console is an editor extension that enriches your developer experience. It lets you run tasks, generate code, and improves code autocompletion in your IDE. It is available for VSCode and IntelliJ.

[Install Nx Console &raquo;](https://nx.dev/getting-started/editor-setup?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Useful links

Learn more:

- [Learn more about this workspace setup](https://nx.dev/getting-started/tutorials/angular-monorepo-tutorial?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Learn about Nx on CI](https://nx.dev/ci/intro/ci-with-nx?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [Releasing Packages with Nx release](https://nx.dev/features/manage-releases?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)
- [What are Nx plugins?](https://nx.dev/concepts/nx-plugins?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

And join the Nx community:

- [Discord](https://go.nx.dev/community)
- [Follow us on X](https://twitter.com/nxdevtools) or [LinkedIn](https://www.linkedin.com/company/nrwl)
- [Our Youtube channel](https://www.youtube.com/@nxdevtools)
- [Our blog](https://nx.dev/blog?utm_source=nx_project&utm_medium=readme&utm_campaign=nx_projects)

## Publishing Packages

This workspace uses Nx release tooling for automated versioning and publishing.

### Automated Publishing (Recommended)

When you're ready to release a new version:

1. **Create and push version tag**:

   ```bash
   # For angular-3d library
   npm run release:version -- --projects=@hive-academy/angular-3d
   git push && git push --tags

   # For angular-gsap library
   npm run release:version -- --projects=@hive-academy/angular-gsap
   git push && git push --tags
   ```

2. **Automated CI/CD**:
   - GitHub Actions workflow triggers on tag push
   - Runs full validation pipeline (lint, test, typecheck, build)
   - Publishes to npm with provenance
   - Creates GitHub Release with changelog

### Manual Publishing

For emergency hotfixes or when automation is unavailable:

1. **Set NPM token**:

   ```bash
   export NPM_TOKEN=<your_npm_token>
   ```

2. **Preview changes** (dry-run):

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
   git push && git push --tags
   ```

### Versioning Strategy

- **Independent versioning**: Each library has its own version number
- **Semantic versioning**: MAJOR.MINOR.PATCH
  - MAJOR: Breaking changes
  - MINOR: New features (backward compatible)
  - PATCH: Bug fixes (backward compatible)
- **Automatic bump detection**: Based on conventional commits
  - `feat:` → MINOR bump
  - `fix:` → PATCH bump
  - `BREAKING CHANGE:` → MAJOR bump

### Requirements

- **NPM Token**: Set `NPM_TOKEN` environment variable (manual publish) or GitHub secret (CI)
- **Conventional Commits**: All commits must follow commitlint rules
- **Validation**: All tests, lints, and builds must pass before publish
