# Storybook Pages and Release Gates Design

**Date:** 2026-08-20

**Status:** Approved direction

## Goal

Add a public Storybook site hosted by GitHub Pages that demonstrates the editor's important configuration states, and close the 1.0.0 release blockers found during code review before the branch is considered mergeable.

## Chosen Approach

Use Storybook as the interactive component showcase and GitHub Pages as the static hosting target. The public documentation URL is:

`https://standhigher.github.io/shopify-rich-text-editor/`

The existing Next.js demo remains the local full-stack integration example. It continues to cover API routes and server rendering, while Storybook focuses on deterministic browser-only component states that do not require Shopify credentials or network calls.

## Storybook Scope

Storybook configuration lives at the repository root because it documents the reusable editor package, not the demo app. Stories live next to the editor source and import workspace packages directly.

The initial online showcase includes:

- default editor
- editor with initial rich content
- read-only preview
- mocked image upload
- mocked Shopify resource insertion for product, collection, and variant
- empty document with placeholder text
- narrow viewport rendering
- unavailable resource provider state
- developer-facing JSON and Shopify HTML examples where static rendering is useful

Stories use deterministic fixtures only. They do not call Shopify Admin APIs, upload real files, expose merchant data, or depend on private environment variables.

## GitHub Pages

Add a dedicated Pages workflow that builds `storybook-static` from pushes to the repository default branch and from manual dispatch. The workflow uses Node.js 22, pnpm 10.15.0, official Pages actions, and only the permissions needed to read contents, upload the artifact, and deploy Pages.

Repository administrators still need to set Pages publishing source to GitHub Actions once. The workflow does not push a `gh-pages` branch and does not publish npm packages.

## Release Gate Fixes

The code review identified that built packages are declared as Node ESM but currently emit extensionless relative imports, so a clean Node consumer cannot import the published entry points. The release gate must verify the actual built package exports instead of only importing `src`.

Fixes included in this scope:

- make build output importable by Node ESM consumers
- add a clean local consumer check for Core root, Core experimental, Editor root, Editor experimental, Editor CSS, and Server root
- include that check in `pnpm release:check`
- improve compatibility tests so they assert package exports rather than self-equality
- reject unsupported protocol versions explicitly during server validation
- update release docs and root README references from two public packages and old version examples to the three-package 1.0.0 release line

## Out of Scope

- npm publication
- pushing the branch or tags
- custom domain setup
- Chromatic or external visual regression services
- deploying the Next.js demo to Pages
- removing the 0.6.x compatibility root exports
- deleting existing worktrees

## Verification

Before claiming the work is ready, run:

```bash
pnpm release:check
pnpm build-storybook
```

The release check must exercise the clean consumer import test after building packages. The Storybook build must produce a static site suitable for GitHub Pages.

## Success Criteria

- Developers can open the GitHub Pages Storybook and explore the important editor configurations without credentials.
- The Next.js demo remains available for local full-stack rendering workflows.
- Built package entry points import successfully in a clean Node ESM consumer.
- Unsupported protocol versions fail validation with a clear error.
- Release scripts and docs consistently describe the three public 1.0.0 packages.
- The branch is not published to npm and is ready for merge review after verification passes.
