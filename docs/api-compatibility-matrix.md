# 1.0 Public API and Compatibility Matrix

This document freezes the public surface for the 1.0 release line. Imports from
`src/`, test files, demo code, and package-internal paths are not public API.

## Stable package entry points

| Package | Stable root exports | Compatibility notes |
| --- | --- | --- |
| `@standhigher/shopify-rich-text-core` | `RichTextDocument`, `RichTextNode`, `RichTextMark`, `RichTextWarning`, `RICH_TEXT_PROTOCOL_VERSION`, `CURRENT_RICH_TEXT_SCHEMA_VERSION`, `createRichTextDocument`, extension contracts, migration runner and structured errors | Dependency-free protocol and pure contracts. |
| `@standhigher/shopify-rich-text-editor` | `RichTextEditor`, `createEditorConfig`, `createEditorExtensionRegistry`, `RichTextError`, editor props and extension types | `value` and `onChange` continue to use Tiptap `JSONContent`. |
| `@standhigher/shopify-rich-text-server` | `validateRichTextDocument`, `prepareRichTextDocument`, `processRichText`, `renderShopifyHtml`, serializers, importer, sanitizer, channel capabilities and structured errors | Server validates and migrates persisted documents before output. |

## Compatibility surface retained from 0.6.x

- Editor callers may continue to pass Tiptap `JSONContent` to `RichTextEditor`.
- Server callers may continue to pass `RichTextDocument` to
  `validateRichTextDocument()` and `renderShopifyHtml()`.
- `renderShopifyHtml()` remains the HTML-string compatibility API. Use
  `processRichText()` when warnings, channel and schema metadata are needed.
- `validateRichTextDocument()` remains the migration-aware validation entry
  point; `validateCurrentRichTextDocument()` is available for callers that have
  already migrated data.
- `createRichTextDocument()` is the recommended boundary helper for wrapping
  editor JSON in the persisted protocol envelope.

## Experimental APIs

Shopify Resource Provider and Resource Node support remain opt-in and are marked
`@experimental`. New integrations may import them from:

- `@standhigher/shopify-rich-text-core/experimental`
- `@standhigher/shopify-rich-text-editor/experimental`

The corresponding root exports remain temporarily available for 0.6.x source
compatibility. They are not covered by the frozen stable API promise.

Shopify `rich_text_field` JSON conversion, Variables, AI, arbitrary HTML
round-tripping, additional channel adapters, Admin token management, and real-
time collaboration are not 1.0 commitments.

## Supported compatibility range

| Dimension | 1.0 support range |
| --- | --- |
| Package versions | `@standhigher/shopify-rich-text-core`, `editor`, and `server` `1.0.x` |
| Upgrade source | `0.2.x`, `0.3.x`, `0.4.x`, `0.5.x`, and `0.6.x` documented migration paths |
| Node.js | `>=22.0.0` |
| pnpm | `10.15.x` |
| TypeScript | `>=5.8.0` when compiling consumers |
| React / React DOM | `18.3.x` peer range for the editor |
| Tiptap | `3.x` |
| Polaris | `12.x` peer range for the editor |
| Protocol version | `1` |
| Current schema version | `2026-08` |
| Stable channel | `shopify-html` |
| Migration | `2026-07` → `2026-08`; migration failures are recoverable and must not overwrite source data |

## Stability rules

Only root exports listed above and the explicitly named experimental subpaths
are supported import paths. Public behavior includes structured error codes,
validation limits, migration semantics, and the server processing order:

```text
validate envelope → migrate → validate current schema → serialize → channel adapter → sanitize
```
