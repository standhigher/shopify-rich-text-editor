# @standhigher/shopify-rich-text-server

[![npm version](https://img.shields.io/npm/v/@standhigher/shopify-rich-text-server)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-server)
[![npm downloads](https://img.shields.io/npm/dm/@standhigher/shopify-rich-text-server)](https://www.npmjs.com/package/@standhigher/shopify-rich-text-server)
[![CI](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/standhigher/shopify-rich-text-editor/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/standhigher/shopify-rich-text-editor/blob/main/LICENSE)

Server utilities for validating Tiptap JSON, sanitizing rich text HTML, and rendering Shopify-safe output.

## Links

- npm: [@standhigher/shopify-rich-text-server](https://www.npmjs.com/package/@standhigher/shopify-rich-text-server)
- GitHub: [standhigher/shopify-rich-text-editor](https://github.com/standhigher/shopify-rich-text-editor)
- Demo: [apps/demo](https://github.com/standhigher/shopify-rich-text-editor/tree/main/apps/demo)
- Usage docs: [Shopify App integration guide](https://github.com/standhigher/shopify-rich-text-editor/blob/main/docs/business-shopify-app-integration.md)
- Editor package: [@standhigher/shopify-rich-text-editor](https://www.npmjs.com/package/@standhigher/shopify-rich-text-editor)
- Changelog: [CHANGELOG.md](https://github.com/standhigher/shopify-rich-text-editor/blob/main/CHANGELOG.md)

## Installation

```bash
pnpm add @standhigher/shopify-rich-text-server
```

## Basic Usage

```ts
import {
  RICH_TEXT_VALIDATION_LIMITS,
  RichTextValidationError,
  renderShopifyHtml,
  richTextJsonToPlainText,
  validateRichTextDocument
} from "@standhigher/shopify-rich-text-server";

export async function renderDescription(input: unknown) {
  try {
    const document = validateRichTextDocument(input);

    return {
      html: renderShopifyHtml(document),
      plainText: richTextJsonToPlainText(document.content)
    };
  } catch (error) {
    if (error instanceof RichTextValidationError) {
      console.error(error.code, error.path);
    }
    throw error;
  }
}

// `validateRichTextDocument(input, limits)` supports per-request limits.
// `RICH_TEXT_VALIDATION_LIMITS` contains the defaults.
```

## Shopify resource rendering (0.5.x)

Product, Collection, and Variant references are validated by their stable Shopify GID. The server persists only `resourceType`, `id`, and optional `title`, `handle`, and `image` snapshot fields. Internal API responses, tokens, permissions, and provider-specific fields are rejected.

By default, a resource renders as sanitized title text. A server-side business adapter may provide a URL builder:

```ts
const html = renderShopifyHtml(document, {
  resourceUrlBuilder: (resource) =>
    resource.handle ? `/${resource.resourceType}s/${resource.handle}` : undefined
});
```

The builder runs on the server and accepts only absolute `http(s)` or single-slash relative URLs. Unsafe URLs fall back to text. Resource images are subject to the same `http`/`https` URL policy and final HTML allowlist sanitization.

Shopify `rich_text_field` JSON import/export is not a stable 0.5.x API. Use Tiptap JSON as the source document until the planned compatibility matrix and downgrade tests are complete.

## Extension contracts

Server registration is separate from client registration. A custom node must be registered with the server before validation or rendering; otherwise validation rejects it as an unknown node.

```ts
import { Node } from "@tiptap/core";
import {
  createServerExtensionRegistry,
  richTextJsonToHtml,
  validateRichTextDocument,
  type ServerExtension
} from "@standhigher/shopify-rich-text-server";

const calloutExtension: ServerExtension = {
  id: "callout",
  version: "1.0.0",
  nodes: ["callout"],
  server: {
    extensions: [Node.create({ name: "callout", group: "block", content: "inline*" })],
    serializers: {
      callout: (node) => `<p>${node.content?.map((child) => child.text ?? "").join("") ?? ""}</p>`
    }
  }
};

const registry = createServerExtensionRegistry([calloutExtension]);
const document = validateRichTextDocument(input, {}, registry);
const html = richTextJsonToHtml(document.content, [calloutExtension]);
```

Keep the client and server contracts in the same application module or registry factory. The server registry controls the node and mark allowlist, and custom serializer output must still pass through the channel adapter and sanitizer before publishing.

## Feature Overview

- Validate the persisted rich text document envelope.
- Render Tiptap JSON to HTML.
- Extract plain text for indexing or previews.
- Sanitize HTML with an allowlist.
- Remove editor-only metadata before writing HTML to Shopify.

## Compatibility

| Package | Supported |
| --- | --- |
| Node.js | 18+ recommended |
| Tiptap | `^3.0.0` |
| TypeScript | `^5.8.2` |

## Package Quality

The published package includes `dist`, TypeScript declarations, README, and MIT license only.

## Maintenance

This package is maintained by Standhigher for Shopify App rich text workflows. Please report bugs and feature requests on GitHub Issues.

## Local Development

```bash
pnpm install
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
