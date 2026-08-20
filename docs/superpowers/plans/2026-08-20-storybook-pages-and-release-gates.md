# Storybook Pages and Release Gates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a GitHub Pages hosted Storybook showcase and fix the 1.0.0 release blockers around built-package importability and release gates.

**Architecture:** Storybook is a root-level static React/Vite documentation site that imports workspace package sources. Release gates build the three packages, then run a clean temporary Node ESM consumer against the actual package export map and editor CSS export.

**Tech Stack:** pnpm 10.15, Node.js 22, TypeScript, Vitest, Storybook React/Vite, GitHub Pages Actions.

---

## File Structure

- `scripts/check-consumer-imports.mjs`: creates a temporary consumer project and imports the packed workspace packages through their published exports.
- `scripts/fix-esm-relative-imports.mjs`: rewrites built `dist/*.js` relative import specifiers to include `.js` where Node ESM requires it.
- `tests/compatibility/api-surface.test.ts`: asserts actual public exports and removes self-equality coverage gaps.
- `packages/rich-text-server/tests/rich-text-server.test.ts`: covers unsupported protocol versions.
- `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/manager-head.html`: root Storybook configuration.
- `packages/rich-text-editor/src/components/RichTextEditor.stories.tsx`: deterministic online editor scenarios.
- `.github/workflows/storybook-pages.yml`: GitHub Pages deployment workflow.
- `package.json`, `README.md`, `docs/release.md`, package READMEs: scripts and documentation updates.

## Task 1: Clean Consumer Import Gate

**Files:**
- Create: `scripts/check-consumer-imports.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing consumer import check**

Create `scripts/check-consumer-imports.mjs` that:

```js
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const workspaceRoot = process.cwd();
const tempRoot = mkdtempSync(join(tmpdir(), "best-rich-text-consumer-"));

const packages = {
  "@standhigher/shopify-rich-text-core": "packages/rich-text-core",
  "@standhigher/shopify-rich-text-editor": "packages/rich-text-editor",
  "@standhigher/shopify-rich-text-server": "packages/rich-text-server"
};

try {
  const scopeDir = join(tempRoot, "node_modules", "@standhigher");
  mkdirSync(scopeDir, { recursive: true });

  for (const [packageName, packagePath] of Object.entries(packages)) {
    symlinkSync(resolve(workspaceRoot, packagePath), join(scopeDir, packageName.split("/")[1]), "dir");
  }

  const scriptPath = join(tempRoot, "consumer.mjs");
  writeFileSync(scriptPath, `
    import * as core from "@standhigher/shopify-rich-text-core";
    import * as coreExperimental from "@standhigher/shopify-rich-text-core/experimental";
    import * as editor from "@standhigher/shopify-rich-text-editor";
    import * as editorExperimental from "@standhigher/shopify-rich-text-editor/experimental";
    import * as server from "@standhigher/shopify-rich-text-server";
    import { readFileSync } from "node:fs";
    import { createRequire } from "node:module";

    const require = createRequire(import.meta.url);
    const cssPath = require.resolve("@standhigher/shopify-rich-text-editor/styles.css");
    const css = readFileSync(cssPath, "utf8");

    if (core.RICH_TEXT_PROTOCOL_VERSION !== 1) throw new Error("core root import failed");
    if (typeof coreExperimental.ResourceProviderError !== "function") throw new Error("core experimental import failed");
    if (typeof editor.RichTextEditor !== "function") throw new Error("editor root import failed");
    if (typeof editorExperimental.selectResource !== "function") throw new Error("editor experimental import failed");
    if (typeof server.renderShopifyHtml !== "function") throw new Error("server root import failed");
    if (!css.includes(".bre-root")) throw new Error("editor CSS export failed");
  `);

  await import(pathToFileURL(scriptPath).href);
  console.log("Clean consumer imports passed");
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm build && node scripts/check-consumer-imports.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for a built `dist` import such as `./extensions`.

- [ ] **Step 3: Add the release gate script**

Add `"consumer:check": "node scripts/check-consumer-imports.mjs"` to root `package.json`, and append `pnpm consumer:check` after `pnpm pack:check` in `release:check`.

- [ ] **Step 4: Commit**

```bash
git add package.json scripts/check-consumer-imports.mjs
git commit -m "test: verify clean package consumer imports"
```

## Task 2: Node ESM Build Output

**Files:**
- Create: `scripts/fix-esm-relative-imports.mjs`
- Modify: `packages/rich-text-core/package.json`
- Modify: `packages/rich-text-editor/package.json`
- Modify: `packages/rich-text-server/package.json`

- [ ] **Step 1: Add post-build import rewriting**

Create `scripts/fix-esm-relative-imports.mjs` that scans each package `dist` directory and appends `.js` to extensionless relative import/export specifiers in `.js` files when the target `.js` file exists.

- [ ] **Step 2: Wire package builds**

Update each package build script to run `node ../../scripts/fix-esm-relative-imports.mjs dist` after `tsc` and before CSS copy where applicable.

- [ ] **Step 3: Run targeted verification**

Run: `pnpm build && pnpm consumer:check`

Expected: PASS and output `Clean consumer imports passed`.

- [ ] **Step 4: Commit**

```bash
git add scripts/fix-esm-relative-imports.mjs packages/rich-text-core/package.json packages/rich-text-editor/package.json packages/rich-text-server/package.json
git commit -m "fix: make built esm packages importable"
```

## Task 3: Protocol Version Validation

**Files:**
- Modify: `packages/rich-text-server/tests/rich-text-server.test.ts`
- Modify: `packages/rich-text-server/src/validation.ts`

- [ ] **Step 1: Write failing test**

Add a test that passes a document with `version: 999` to `validateRichTextDocument()` and expects a `RichTextValidationError` with code `INVALID_DOCUMENT`.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @standhigher/shopify-rich-text-server test`

Expected: FAIL because version `999` is currently accepted or fails through an imprecise migration path.

- [ ] **Step 3: Implement strict protocol check**

Import `RICH_TEXT_PROTOCOL_VERSION` from core and reject any parsed envelope whose `version` is greater than the current supported protocol. Keep older versions available for migration.

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @standhigher/shopify-rich-text-server test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/rich-text-server/src/validation.ts packages/rich-text-server/tests/rich-text-server.test.ts
git commit -m "fix: reject unsupported rich text protocol versions"
```

## Task 4: Public API Compatibility Assertions

**Files:**
- Modify: `tests/compatibility/api-surface.test.ts`

- [ ] **Step 1: Replace weak assertions**

Assert root and experimental exports for Core, Editor, and Server against the package entry modules rather than tautologies. Keep source imports only if they verify TypeScript workspace shape.

- [ ] **Step 2: Run compatibility tests**

Run: `pnpm exec vitest run tests/compatibility/api-surface.test.ts`

Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/compatibility/api-surface.test.ts
git commit -m "test: strengthen public api compatibility checks"
```

## Task 5: Storybook and Pages

**Files:**
- Create: `.storybook/main.ts`
- Create: `.storybook/preview.tsx`
- Create: `.storybook/manager-head.html`
- Create: `packages/rich-text-editor/src/components/RichTextEditor.stories.tsx`
- Create: `.github/workflows/storybook-pages.yml`
- Modify: `package.json`
- Modify: `README.md`
- Modify: package README files as needed

- [ ] **Step 1: Install Storybook dependencies**

Run: `pnpm add -Dw storybook @storybook/react-vite @storybook/addon-docs @storybook/addon-a11y vite react react-dom`

- [ ] **Step 2: Add Storybook config**

Configure Storybook to load stories from `packages/rich-text-editor/src/**/*.stories.@(ts|tsx)`, import Polaris CSS and editor CSS in preview, and use `@storybook/react-vite`.

- [ ] **Step 3: Add deterministic stories**

Add stories for the approved scenario list with local fixtures and mocked callbacks only.

- [ ] **Step 4: Add Pages workflow**

Add a workflow that builds Storybook and deploys `storybook-static` through official GitHub Pages actions on `master` and `workflow_dispatch`.

- [ ] **Step 5: Update scripts and docs**

Make root `storybook` run the local docs site, make `build-storybook` build Storybook, add `build-demo` for the Next.js demo, and update public docs to link to the Pages site.

- [ ] **Step 6: Run Storybook build**

Run: `pnpm build-storybook`

Expected: PASS and static output in `storybook-static`.

- [ ] **Step 7: Commit**

```bash
git add .storybook .github/workflows/storybook-pages.yml package.json pnpm-lock.yaml README.md packages/rich-text-editor/src/components/RichTextEditor.stories.tsx packages/rich-text-editor/README.md packages/rich-text-server/README.md
git commit -m "feat: add github pages storybook showcase"
```

## Task 6: Release Documentation Consistency

**Files:**
- Modify: `README.md`
- Modify: `docs/release.md`
- Modify: `docs/releases/1.0.0-verification.md`
- Modify: `docs/superpowers/plans/2026-08-20-1.0-stable-release.md`

- [ ] **Step 1: Update package counts and versions**

Replace two-package language with three-package language, replace stale `0.4.0` examples with `1.0.0`, and ensure install commands include Core when examples import it.

- [ ] **Step 2: Update verification record**

Record that the implementation branch performs clean consumer import checks and Storybook static build, but npm publication remains out of scope.

- [ ] **Step 3: Run diff check**

Run: `git diff --check`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add README.md docs/release.md docs/releases/1.0.0-verification.md docs/superpowers/plans/2026-08-20-1.0-stable-release.md
git commit -m "docs: align version 1 release guidance"
```

## Task 7: Final Verification

**Files:**
- No direct file edits expected.

- [ ] **Step 1: Run release gate**

Run: `pnpm release:check`

Expected: PASS.

- [ ] **Step 2: Run Storybook static build**

Run: `pnpm build-storybook`

Expected: PASS.

- [ ] **Step 3: Check final status**

Run: `git status --short --branch`

Expected: clean working tree on `codex/1.0-stable-release`.

- [ ] **Step 4: Summarize merge readiness**

Report commits, verification commands, and remaining external step: enable GitHub Pages source as GitHub Actions if not already configured.
