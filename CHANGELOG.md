# Changelog

All notable changes to this project are documented here.

This project follows semantic versioning for the published npm packages:

- `@standhigher/shopify-rich-text-editor`
- `@standhigher/shopify-rich-text-core`
- `@standhigher/shopify-rich-text-server`

## 0.6.0 - 2026-08-20

### Added

- Added `CURRENT_RICH_TEXT_SCHEMA_VERSION` and a recoverable schema migration runner.
- Added constrained standard HTML import with pre-sanitization, normalization, structured warnings, and validation.
- Added `processRichText()` as the recommended server pipeline returning HTML, plain text, warnings, schema version, and channel.
- Added a callable Shopify HTML Channel Capability Matrix for supported, degraded, and unsupported Node/Mark behavior.
- Added Demo API support for returning the full `ProcessResult`.

### Changed

- `validateRichTextDocument()` now prepares persisted documents by migrating from published schema versions before current schema validation.
- `renderShopifyHtml()` remains available as a compatibility HTML-string API.

### Constraints

- Standard HTML import does not promise stable support for Word HTML, Google Docs HTML, complex inline styles, forms, iframes, scripts, or arbitrary custom tags.
- Migration failures preserve the original input and should not overwrite stored JSON or cached HTML.

## 0.4.0 - 2026-08-20

### Added

- Added the dependency-free `@standhigher/shopify-rich-text-core` package for shared document, error, extension, and migration contracts.
- Added deterministic extension dependency resolution and structured conflict errors.
- Added editor and server Extension Registries with custom serializer support.
- Added pure document migration helpers with missing, duplicate, and cycle detection.

### Changed

- Existing editor usage keeps the default 0.3.x extensions and now accepts optional `extensionContracts`.
- Server validation derives its node and mark allowlist from the registered server extensions.

## 0.5.0 - 2026-08-20

### Added

- Added the dependency-free `ResourceProvider` contract for Product, Collection, and Variant selection.
- Added Shopify Resource Node support with stable GID validation, limited display snapshots, unresolved-resource rendering, and cancellation-safe insertion.
- Added safe Shopify HTML resource rendering with optional server-side URL mapping and final sanitization.
- Added脱敏 Shopify capability fixtures, a local Mock Provider demo, and integration guidance.

### Constraints

- Shopify `rich_text_field` JSON import/export remains experimental and is not a stable 0.5.x API.
- The editor does not import App Bridge, Shopify Admin SDK, or expose Admin API tokens.

## 0.3.0 - 2026-08-20

### Added

- Added editor component regression tests with jsdom and Polaris test setup.
- Added `disabled` editor state and structured `RichTextError` upload failures.
- Added server-side validation limits for UTF-8 document bytes, text length, node count, attrs count, and nesting depth.
- Added structured validation errors for unknown nodes, unknown marks, unsafe URLs, and oversized documents.

### Changed

- Pending debounced editor changes are flushed before unmount.
- Server validation supports per-request limit overrides while preserving default limits.

## 0.2.0 - 2026-08-11

### Added

- Expanded npm and GitHub package metadata for public discovery.
- Added English README as the default project entry and Chinese README as a companion document.
- Added npm package README content for the editor and server packages.
- Added release documentation, contribution guide, security policy, code of conduct, GitHub issue templates, pull request template, and CI workflow.
- Added release helper scripts for major, minor, patch, verification, and npm publishing.

### Changed

- Improved package keywords, descriptions, repository links, bug tracker links, author, license, and publish file lists.

## 0.1.0 - 2026-07-30

### Added

- Initial Shopify Rich Text Editor monorepo.
- React editor package with Tiptap 3 and Polaris-aligned toolbar UI.
- Server package for validation, serialization, sanitization, and Shopify-safe HTML output.
- Next.js demo app.
