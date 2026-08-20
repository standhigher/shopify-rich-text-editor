# Shopify Rich Text Editor

[![npm version](https://img.shields.io/npm/v/@standhigher/shopify-rich-text-editor?label=editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![npm downloads](https://img.shields.io/npm/dm/@standhigher/shopify-rich-text-editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![CI](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Demo](https://img.shields.io/badge/demo-Next.js%20app-green)](apps/demo)

Shopify Rich Text Editor is a reusable rich text editing toolkit for Shopify Apps, built with React, Tiptap 3, Shopify Polaris, and server-side Shopify-safe HTML rendering.

[中文文档](README.zh-CN.md)

## Links

- npm editor package: [@standhigher/shopify-rich-text-editor](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
- npm server package: [@standhigher/shopify-rich-text-server](https://www.npmjs.com/package/@standhigher/shopify-rich-text-server)
- GitHub: [standhigher/shopify-rich-text-editor](https://github.com/standhigher/shopify-rich-text-editor)
- Demo app: [apps/demo](apps/demo)
- API docs: [editor package README](packages/rich-text-editor/README.md), [server package README](packages/rich-text-server/README.md)
- Usage docs: [Shopify App integration guide](docs/business-shopify-app-integration.md)
- Maintenance docs: [development and architecture guide](docs/development-and-architecture.md)
- Evolution roadmap: [version evolution roadmap](docs/evolution-roadmap.md)
- 1.0 API matrix: [public API and compatibility matrix](docs/api-compatibility-matrix.md)
- 1.0 migration: [migration guide](docs/migration-guide-1.0.md)
- Changelog: [CHANGELOG.md](CHANGELOG.md)

## Installation

```bash
pnpm add @standhigher/shopify-rich-text-editor @standhigher/shopify-rich-text-server
pnpm add @shopify/polaris react react-dom
```

Import the editor CSS once in your app:

```css
@import "@shopify/polaris/build/esm/styles.css";
@import "@standhigher/shopify-rich-text-editor/styles.css";
```

## Basic Usage

```tsx
"use client";

import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import { RichTextEditor } from "@standhigher/shopify-rich-text-editor";

const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

export function ProductDescriptionEditor() {
  const [content, setContent] = useState<JSONContent>(emptyContent);

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Write product content..."
    />
  );
}
```

At the server boundary, wrap the editor JSON in the persisted protocol envelope:

```ts
import { createRichTextDocument } from "@standhigher/shopify-rich-text-core";

const document = createRichTextDocument(content);
```

Render and sanitize Shopify HTML on the server:

```ts
import {
  renderShopifyHtml,
  validateRichTextDocument
} from "@standhigher/shopify-rich-text-server";

export async function POST(request: Request) {
  const payload = await request.json();
  const document = validateRichTextDocument(payload);

  return Response.json({
    html: renderShopifyHtml(document)
  });
}
```

## Feature Overview

- React editor component for Shopify App admin interfaces.
- Tiptap JSON as the editable source of truth.
- Polaris-aligned toolbar styling and interaction states.
- URL images and Shopify upload callback support.
- Server-side validation, serialization, sanitization, and Shopify HTML output.
- Next.js demo app with client editor and server render route.

## Compatibility

| Package | Supported |
| --- | --- |
| React | `^18.3.1` |
| React DOM | `^18.3.1` |
| Shopify Polaris | `^12.0.0` |
| Tiptap | `^3.0.0` |
| TypeScript | `^5.8.2` |
| Node.js | `>=22.0.0` |
| pnpm | `10.15.x` |
| Protocol / schema | `1` / `2026-08` |

## Examples / Storybook / Demo

This repository currently ships a Next.js demo app instead of Storybook.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

The `build-storybook` script intentionally validates the demo build until Storybook is added:

```bash
npm run build-storybook
```

## Package Quality

Published packages include only:

- `dist` JavaScript output
- TypeScript declaration files
- package README
- MIT license
- editor CSS export

Check package contents before publishing:

```bash
pnpm pack:dry-run
pnpm pack:check
pnpm performance:baseline
```

## Local Development

```bash
pnpm install
pnpm dev
pnpm -r typecheck
pnpm test
pnpm build
```

## Release Preparation

```bash
npm run lint
npm run test
npm run typecheck
npm run build
npm run build-storybook
pnpm pack:dry-run
```

See [docs/release.md](docs/release.md) for npm registry, web auth, dry-run, tag, dist-tag, and rollback guidance.
