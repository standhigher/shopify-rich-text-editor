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
- Compatibility matrix: [docs/api-compatibility-matrix.md](https://github.com/standhigher/shopify-rich-text-editor/blob/main/docs/api-compatibility-matrix.md)

## Installation

```bash
pnpm add @standhigher/shopify-rich-text-server
```

## Basic Usage

```ts
import {
  RICH_TEXT_VALIDATION_LIMITS,
  RichTextValidationError,
  processRichText
} from "@standhigher/shopify-rich-text-server";

export async function renderDescription(input: unknown) {
  const result = processRichText(input, { channel: "shopify-html" });

  if (!result.ok) {
    console.error(result.error.code, result.error.path);
    throw new RichTextValidationError(result.error.code, result.error.message, result.error.path);
  }

  return {
    html: result.html,
    plainText: result.plainText,
    warnings: result.warnings,
    schemaVersion: result.schemaVersion
  };
}

// `validateRichTextDocument(input, limits)` supports per-request limits.
// `RICH_TEXT_VALIDATION_LIMITS` contains the defaults.
```

`processRichText()` is the recommended publishing and cache-generation entry point. It validates the persisted envelope, migrates to `CURRENT_RICH_TEXT_SCHEMA_VERSION`, validates the current schema, serializes, applies the channel adapter, sanitizes, and returns a structured `ProcessResult`.

`renderShopifyHtml()` remains available as a compatibility API when callers only need the HTML string and do not need warnings.

## Standard HTML import (0.6.x)

```ts
import { importStandardHtml } from "@standhigher/shopify-rich-text-server";

const imported = importStandardHtml("<h2>Title</h2><p>Hello <strong>world</strong></p>");

if (imported.ok) {
  await saveRichTextDocument(imported.document);
}
```

The importer supports constrained standard HTML: paragraphs, H1-H4 headings, lists, links, images, blockquotes, bold, italic, and underline. It sanitizes before and after conversion and returns warnings when unsupported or unsafe HTML is removed.

Word HTML, Google Docs HTML, complex inline styles, forms, iframes, scripts, and arbitrary custom tags are not part of the stable import contract.

## Schema migration (0.6.x)

`validateRichTextDocument()` and `processRichText()` migrate documents from published schema versions to `CURRENT_RICH_TEXT_SCHEMA_VERSION` before final schema validation. Migration failure is recoverable: callers should keep the original stored document, report the structured error, and avoid overwriting cached HTML or persisted JSON.

## Shopify resource rendering (experimental)

Shopify Resource rendering is opt-in and experimental in 1.0. Resource fields
must remain limited to stable GIDs and display-safe snapshots.

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
- Migrate published schema versions to the current schema.
- Process documents through the recommended `processRichText()` pipeline.
- Import constrained standard HTML into Tiptap JSON.
- Report channel warnings through a callable capability matrix.
- Render Tiptap JSON to HTML.
- Extract plain text for indexing or previews.
- Sanitize HTML with an allowlist.
- Remove editor-only metadata before writing HTML to Shopify.

## Compatibility

| Package | Supported |
| --- | --- |
| Node.js | `>=22.0.0` |
| pnpm | `10.15.x` |
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
