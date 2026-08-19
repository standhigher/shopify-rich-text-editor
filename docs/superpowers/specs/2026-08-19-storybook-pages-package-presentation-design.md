# Storybook Pages and Package Presentation Design

**Date:** 2026-08-19

**Status:** Approved direction; awaiting written-spec review

## Goal

Make the two public npm packages and the GitHub repository immediately understandable to external developers, add a real Storybook documentation site hosted on GitHub Pages, and prepare a synchronized `0.3.0` minor release.

The published packages are:

- `@standhigher/shopify-rich-text-editor`
- `@standhigher/shopify-rich-text-server`

## Current State

- The Git working tree is clean.
- Both public packages and the workspace are at `0.2.0`.
- npm `latest` points to `0.2.0` for both public packages.
- The repository uses `pnpm-lock.yaml`; it does not use `package-lock.json`.
- The repository default branch is `master`, although several public links currently point to `main`.
- The existing `build-storybook` script builds the Next.js demo and no Storybook is installed.
- The Next.js demo is for local full-stack development and is not deployed publicly.
- Package metadata, bilingual README files, community documents, issue templates, a pull request template, and release documentation already exist but need consistency updates.

## Chosen Approach

Install a root-level React and Vite Storybook that imports the editor package source directly. Build it as a static site and deploy it to GitHub Pages with official GitHub Actions.

The public documentation URL will be:

`https://standhigher.github.io/shopify-rich-text-editor/`

The Next.js demo remains a separate local integration environment. It will not be statically exported or deployed as part of this work.

## Architecture

### Storybook

Storybook configuration lives at the workspace root because it documents the reusable editor package rather than the Next.js demo application.

The implementation will use matching Storybook `10.5.9` packages with `@storybook/react-vite`, Vite `8.2.1`, and Node.js 22 for local and CI builds. Storybook dependencies are root development dependencies and are not included in either published npm package.

Configuration responsibilities:

- `.storybook/main.ts` selects React with Vite, locates stories under the editor package, enables documentation and accessibility addons, and configures the static build.
- `.storybook/preview.tsx` imports Shopify Polaris and editor styles, applies the Polaris application provider, and defines shared preview parameters.
- `.storybook/manager-head.html` supplies a concise public description for search engines and link previews.
- `packages/rich-text-editor/src/components/RichTextEditor.stories.tsx` contains the public component examples and controlled-state wrappers.

The initial story set is:

- Default editor
- Editor with initial rich content
- Read-only editor
- Editor with a mocked image-upload callback
- Narrow viewport
- Empty document

Stories use deterministic local data. They do not call Shopify, require credentials, upload real files, or expose merchant information.

### Local Demo

The existing Next.js application in `apps/demo` remains the full-stack integration example. Its responsibilities continue to include client editing and server rendering behavior.

Scripts are made explicit:

- `storybook` starts the component documentation environment.
- `build-storybook` creates the static Storybook site.
- `build-demo` builds the Next.js integration demo.
- `build` continues to build all workspaces.

### GitHub Pages

A dedicated `.github/workflows/storybook-pages.yml` workflow deploys the generated `storybook-static` directory.

The workflow:

- runs on pushes to `master` and through `workflow_dispatch`;
- uses Node.js 22 and pnpm `10.15.0`;
- installs with `pnpm install --frozen-lockfile`;
- runs `npm run build-storybook`;
- configures Pages and uploads the static artifact with official GitHub actions;
- deploys from a separate job to the `github-pages` environment;
- grants only `contents: read`, `pages: write`, and `id-token: write` permissions;
- uses Pages concurrency control to avoid overlapping deployments.

Repository administrators must select **GitHub Actions** as the Pages publishing source once. The workflow does not create or update a `gh-pages` branch and does not use a third-party deployment action.

## Public Documentation Design

### Root README Files

`README.md` remains the default English entry and `README.zh-CN.md` remains the Chinese companion.

Both files will include:

- npm version badge;
- npm downloads badge;
- CI badge;
- MIT license badge;
- Storybook documentation badge linked to GitHub Pages;
- a one-sentence package description;
- links to both npm packages, GitHub, online Storybook, local demo source, API documentation, usage documentation, changelog, contribution guide, security policy, and issue tracker;
- installation and CSS setup;
- basic editor and server usage;
- feature overview;
- compatibility table;
- Storybook and local demo instructions;
- package quality and published-file information;
- maintenance status and support channels;
- local development and release preparation commands.

The documentation will call the hosted site “Storybook” or “component documentation,” not an online full-stack demo. The local Next.js application will be labelled “local demo source.”

### Package README Files

Each published package README uses absolute GitHub links based on the actual `master` branch and links to the hosted Storybook where relevant. Broken `/main/` links are removed.

The editor README emphasizes component props, styling, controlled state, image upload hooks, and Storybook examples. The server README emphasizes validation, serialization, sanitization, and Shopify-safe HTML rendering.

### Metadata

The root and both public package manifests retain accurate descriptions, MIT licensing, repository information, issue URLs, and publish file lists.

Changes include:

- structured Standhigher author metadata with the public GitHub organization URL;
- package-specific keyword review across technology, Shopify/e-commerce domain, React/Tiptap/Polaris ecosystem, component type, and content-editing use cases;
- the GitHub Pages URL as the public documentation homepage for the two published packages;
- a documented and enforceable Node.js runtime range where appropriate;
- root Storybook scripts and development dependencies;
- synchronized version `0.3.0` in all four workspace manifests.

Published file allowlists remain limited to compiled output, declarations, README, license, and editor CSS. Story files, Storybook configuration, source code, demo code, tests, and repository documentation are not added to npm tarballs.

## Repository Collaboration Documents

Existing collaboration files will be retained and updated rather than replaced:

- `CHANGELOG.md` receives the `0.3.0` entry.
- `CONTRIBUTING.md` adds Storybook development and verification commands.
- `SECURITY.md` marks `0.3.x` as supported and older minor lines as unsupported.
- `CODE_OF_CONDUCT.md` changes only if link or terminology consistency requires it.
- Bug and feature issue forms retain the no-sensitive-data guidance and receive corrected links or version examples.
- The issue template configuration receives corrected documentation links.
- The pull request template includes real Storybook verification.

No internal URLs, credentials, merchant identifiers, store data, or private operating procedures are introduced.

## Release Documentation

`docs/release.md` will describe a manual, verifiable npm release through the public npm registry.

It will cover:

- registry URL `https://registry.npmjs.org/`;
- Web Auth with `npm login --auth-type=web` and `npm whoami` verification;
- token or OTP fallback without recording secrets in the repository;
- semantic version selection;
- separate package dry runs;
- stable `latest` and prerelease `next` behavior;
- explicit dist-tag inspection and recovery commands;
- direct package publishing;
- npm registry verification after publication;
- creation and push of `v0.3.0` only after both packages publish successfully;
- a complete pre-publish checklist.

Examples will use a release-specific variable or `0.3.0` where an exact value is necessary, avoiding stale `0.2.0` examples.

## Versioning

This release is a synchronized minor release:

- workspace root: `0.3.0`
- local demo: `0.3.0`
- editor package: `0.3.0`
- server package: `0.3.0`

There is no `packageVersion` source constant and there are no version assertions in the current tests. The pnpm lockfile will be updated for Storybook dependencies; a `package-lock.json` will not be created.

## Build and Deployment Flow

1. A developer starts Storybook locally with `npm run storybook`.
2. Storybook imports the editor source, Polaris styling, and deterministic story data.
3. `npm run build-storybook` writes the static site to `storybook-static`.
4. CI verifies that the static build succeeds.
5. After the change reaches `master`, the Pages workflow rebuilds Storybook and uploads the static artifact.
6. GitHub Pages deploys the artifact to the repository Pages URL.
7. README badges and package homepages resolve to that deployed documentation site.

## Failure Handling

- Storybook type or bundling failures fail CI and prevent Pages deployment.
- The Pages deploy job depends on a successful build and artifact upload.
- The existing CI workflow remains separate from deployment so pull requests never publish Pages.
- Storybook image-upload stories use a mock and surface simulated failures without external network calls.
- npm publication does not begin until all local checks and both package dry runs pass.
- If one npm package publishes and the second fails, the release guide requires diagnosing and publishing the same `0.3.0` version of the remaining package before creating the Git tag.
- Dist-tags are inspected after publishing and corrected explicitly only when registry state differs from the intended stable release.

## Verification

Before publication, run and confirm:

```bash
git diff --check
npm run lint
npm run test
npm run typecheck
npm run build
npm run build-storybook
```

Then run the required package-level check once in each public package directory:

```bash
npm pack --dry-run --registry=https://registry.npmjs.org/
```

Verification also includes:

- inspecting both dry-run file lists;
- confirming no Storybook or demo files enter either tarball;
- checking internal and absolute README links;
- confirming the Pages workflow uses `master`;
- checking the deployed Storybook URL after the first successful Pages run;
- querying both npm packages and their dist-tags after publication;
- confirming the final Git working tree contains only the intended committed changes.

## Out of Scope

- Deploying the Next.js demo application
- Adding a custom domain
- Chromatic or visual regression services
- Publishing Storybook stories inside the npm packages
- Changing the GitHub default branch from `master`
- Automating npm publication from Git tags
- Changing the editor or server public runtime APIs

## Success Criteria

- A first-time visitor can understand package purpose, installation, usage, compatibility, maintenance, contribution, security, and support paths from npm or GitHub.
- The public Storybook site loads at the repository GitHub Pages URL and demonstrates the editor’s important states without external services.
- Both public package homepages and README badges link to the Storybook site.
- All public repository links use valid paths.
- Both npm packages are verified, published as `0.3.0`, and exposed through the intended `latest` dist-tag with minimal tarball contents.
- Git tag `v0.3.0` is created only after both registry publications are verified.
- All required validation commands pass before publication.
