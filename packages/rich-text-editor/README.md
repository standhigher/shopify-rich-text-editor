# @standhigher/shopify-rich-text-editor

[![npm version](https://img.shields.io/npm/v/@standhigher/shopify-rich-text-editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![npm downloads](https://img.shields.io/npm/dm/@standhigher/shopify-rich-text-editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![CI](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/standhigher/shopify-rich-text-editor/blob/master/LICENSE)
[![Storybook](https://img.shields.io/badge/storybook-GitHub%20Pages-ff4785)](https://standhigher.github.io/shopify-rich-text-editor/)

React rich text editor for Shopify Apps, built with Tiptap 3, Shopify Polaris, and Shopify image upload hooks.

## Links

- npm: [@standhigher/shopify-rich-text-editor](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
- GitHub: [standhigher/shopify-rich-text-editor](https://github.com/standhigher/shopify-rich-text-editor)
- Storybook: [GitHub Pages component showcase](https://standhigher.github.io/shopify-rich-text-editor/)
- Local demo: [apps/demo](https://github.com/standhigher/shopify-rich-text-editor/tree/master/apps/demo)
- Usage docs: [Shopify App integration guide](https://github.com/standhigher/shopify-rich-text-editor/blob/master/docs/business-shopify-app-integration.md)
- API docs: [server package README](https://github.com/standhigher/shopify-rich-text-editor/blob/master/packages/rich-text-server/README.md)
- Changelog: [CHANGELOG.md](https://github.com/standhigher/shopify-rich-text-editor/blob/master/CHANGELOG.md)
- Compatibility matrix: [docs/api-compatibility-matrix.md](https://github.com/standhigher/shopify-rich-text-editor/blob/master/docs/api-compatibility-matrix.md)

## Installation

```bash
pnpm add @standhigher/shopify-rich-text-editor
pnpm add @shopify/polaris react react-dom
```

Import styles once:

```css
@import "@shopify/polaris/build/esm/styles.css";
@import "@standhigher/shopify-rich-text-editor/styles.css";
```

## Basic Usage

```tsx
"use client";

import { useState } from "react";
import type { JSONContent } from "@tiptap/core";
import {
  RichTextEditor,
  type RichTextError,
  type ShopifyImageUploadResult
} from "@standhigher/shopify-rich-text-editor";

const emptyContent: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }]
};

async function uploadToShopify(file: File): Promise<ShopifyImageUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/shopify/files/upload", {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("Image upload failed");
  }

  return response.json();
}

export function ProductDescriptionEditor() {
  const [content, setContent] = useState<JSONContent>(emptyContent);

  function handleError(error: RichTextError) {
    console.error(error.code, error.message);
  }

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      onUploadImage={uploadToShopify}
      onError={handleError}
      placeholder="Write product content..."
    />
  );
}
```

## Shopify resource provider (experimental)

Resource APIs are opt-in and experimental in 1.0. New integrations should import
the provider types from `@standhigher/shopify-rich-text-editor/experimental`.
The root type export remains available for 0.6.x source compatibility.

Resource selection is injected by the host Shopify App. The editor does not import App Bridge, Shopify Admin SDK, or hold Admin API tokens.

```tsx
import type { ResourceProvider } from "@standhigher/shopify-rich-text-editor";

const resourceProvider: ResourceProvider = {
  async selectResource({ resourceType, selectionLimit }) {
    // Call the host app's Resource Picker and map its result to this contract.
    // Return null when the user cancels.
    return selectFromHostApp({ resourceType, selectionLimit });
  }
};

<RichTextEditor
  value={content}
  onChange={setContent}
  resourceProvider={resourceProvider}
/>;
```

The provider returns only a stable Shopify GID and an optional display snapshot:

```ts
interface ResourceReference {
  resourceType: "product" | "collection" | "variant";
  id: string;
  title?: string;
  handle?: string;
  image?: string;
}
```

Cancellation returns `null` and does not create an empty node. Provider failures use `PERMISSION_DENIED`, `NETWORK_ERROR`, or `RESOURCE_NOT_FOUND`; the editor reports an unexpected selection failure through `onError` without modifying the document.

## Component Overview

```ts
export interface RichTextEditorProps {
  value: JSONContent;
  onChange?: (content: JSONContent) => void;
  onError?: (error: RichTextError) => void;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  extensionContracts?: readonly EditorExtension[];
  resourceProvider?: ResourceProvider;
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
}

export interface RichTextError {
  code: "IMAGE_UPLOAD_FAILED" | "RESOURCE_SELECTION_FAILED";
  message: string;
  recoverable: boolean;
  cause: unknown;
}

export interface ShopifyImageUploadResult {
  src: string;
  alt?: string;
  title?: string;
  shopifyFileId?: string;
}
```

## Compatibility

| Package | Supported |
| --- | --- |
| React | `^18.3.1` |
| React DOM | `^18.3.1` |
| Shopify Polaris | `^12.0.0` |
| Tiptap | `^3.0.0` |
| TypeScript | `^5.8.2` |
| Node.js | `>=22.0.0` |
| Protocol / schema | `1` / `2026-08` |

## Editor states

- `readOnly` hides the toolbar and prevents editing.
- `disabled` keeps the toolbar visible but disables editing controls.
- `onError` receives structured recoverable upload errors.
- Pending debounced changes are flushed when the editor unmounts.

## Extension contracts

The editor accepts optional `EditorExtension` contracts. The default StarterKit, Link, Underline, and Image setup remains registered automatically, so existing 0.3.x usage does not change.

```tsx
import { Node } from "@tiptap/core";
import { RichTextEditor, type EditorExtension } from "@standhigher/shopify-rich-text-editor";

const calloutExtension: EditorExtension = {
  id: "callout",
  version: "1.0.0",
  nodes: ["callout"],
  client: {
    extensions: [Node.create({ name: "callout", group: "block", content: "inline*" })]
  }
};

<RichTextEditor value={emptyContent} extensionContracts={[calloutExtension]} />;
```

The registry resolves `dependencies` first and rejects duplicate extension IDs, duplicate node or mark names, missing dependencies, and dependency cycles with structured `ExtensionRegistryError` values. Client registration does not make a node safe for server rendering by itself.

## Package Quality

The published package includes `dist`, TypeScript declarations, `styles.css`, README, and MIT license only.

## Maintenance

This package is maintained by Standhigher for Shopify App rich text workflows. Please report bugs and feature requests on GitHub Issues.

## Local Development

```bash
pnpm install
pnpm dev
pnpm storybook
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
