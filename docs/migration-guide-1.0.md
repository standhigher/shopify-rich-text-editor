# Migration Guide to 1.0

This guide covers upgrading the editor, core, and server packages from the
0.2.x–0.6.x line to 1.0.0. The 1.0 release freezes the protocol and stable root
exports; it does not change the existing editor `JSONContent` value contract.

## Package upgrade

Upgrade the three packages together:

```bash
pnpm add @standhigher/shopify-rich-text-core@^1.0.0 \
  @standhigher/shopify-rich-text-editor@^1.0.0 \
  @standhigher/shopify-rich-text-server@^1.0.0
```

Use Node.js `>=22.0.0`, pnpm `10.15.x`, React `18.3.x`, Tiptap `3.x`, and
Polaris `12.x` for the supported matrix.

## Editor data boundary

The editor continues to accept and emit Tiptap `JSONContent`:

```ts
import { createRichTextDocument } from "@standhigher/shopify-rich-text-core";

const persisted = createRichTextDocument(editorContent);
```

Persist `persisted.content` as the source document and keep generated HTML as a
cache or publishing artifact. Do not switch the `RichTextEditor` `value` prop to
the full envelope without an application-level migration.

## Server processing

Use `processRichText()` for new publishing and cache-generation paths. It
validates the envelope, migrates to schema `2026-08`, validates the current
schema, serializes, applies the channel adapter, sanitizes, and returns warnings.

`renderShopifyHtml()` remains available when an application only needs an HTML
string. `validateRichTextDocument()` remains migration-aware for existing save
paths.

## Schema migration and rollback

Documents on schema `2026-07` migrate automatically to `2026-08`. A migration
failure is recoverable:

1. Keep the original `content_json`, `schema_version`, and cached HTML.
2. Return the structured `MIGRATION_FAILED` error and record its path/message.
3. Do not overwrite the source row or generate new HTML.
4. Fix the data or deploy the required migration, then retry explicitly.

After a successful migration, applications may write back the new document and
schema version in a transaction.

## Resource APIs

Shopify Resource Provider and Resource Node APIs are experimental. New code may
use the named `@standhigher/shopify-rich-text-core/experimental` and
`@standhigher/shopify-rich-text-editor/experimental` entries. Existing root
imports continue to work for 0.6.x source compatibility, but these APIs are not
covered by the frozen stable promise.

## Unsupported 1.0 assumptions

1.0 does not promise arbitrary HTML lossless import, arbitrary custom-node
conversion to every channel, Shopify `rich_text_field` lossless bidirectional
conversion, built-in AI, Admin token management, or real-time collaboration.

## Release rollback

Before publishing, verify the candidate with `pnpm release:check` and a clean
temporary installation. If publication fails, leave `latest` unchanged, fix the
candidate, and publish a new patch or prerelease. If a published version must be
reverted, move the dist-tag to the last verified package version; do not mutate
persisted content or delete migration history.
