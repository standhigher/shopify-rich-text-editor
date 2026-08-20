# @standhigher/shopify-rich-text-editor

[![npm version](https://img.shields.io/npm/v/@standhigher/shopify-rich-text-editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![npm downloads](https://img.shields.io/npm/dm/@standhigher/shopify-rich-text-editor)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
[![CI](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/standhigher/shopify-rich-text-editor/blob/main/LICENSE)
[![Demo](https://img.shields.io/badge/demo-Next.js%20app-green)](https://github.com/standhigher/shopify-rich-text-editor/tree/main/apps/demo)

React rich text editor for Shopify Apps, built with Tiptap 3, Shopify Polaris, and Shopify image upload hooks.

## Links

- npm: [@standhigher/shopify-rich-text-editor](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
- GitHub: [standhigher/shopify-rich-text-editor](https://github.com/standhigher/shopify-rich-text-editor)
- Demo: [apps/demo](https://github.com/standhigher/shopify-rich-text-editor/tree/main/apps/demo)
- Usage docs: [Shopify App integration guide](https://github.com/standhigher/shopify-rich-text-editor/blob/main/docs/business-shopify-app-integration.md)
- API docs: [server package README](https://github.com/standhigher/shopify-rich-text-editor/blob/main/packages/rich-text-server/README.md)
- Changelog: [CHANGELOG.md](https://github.com/standhigher/shopify-rich-text-editor/blob/main/CHANGELOG.md)

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

## Component Overview

```ts
export interface RichTextEditorProps {
  value: JSONContent;
  onChange?: (content: JSONContent) => void;
  onError?: (error: RichTextError) => void;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  onUploadImage?: (file: File) => Promise<ShopifyImageUploadResult>;
}

export interface RichTextError {
  code: "IMAGE_UPLOAD_FAILED";
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

## Editor states

- `readOnly` hides the toolbar and prevents editing.
- `disabled` keeps the toolbar visible but disables editing controls.
- `onError` receives structured recoverable upload errors.
- Pending debounced changes are flushed when the editor unmounts.

## Package Quality

The published package includes `dist`, TypeScript declarations, `styles.css`, README, and MIT license only.

## Maintenance

This package is maintained by Standhigher for Shopify App rich text workflows. Please report bugs and feature requests on GitHub Issues.

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
